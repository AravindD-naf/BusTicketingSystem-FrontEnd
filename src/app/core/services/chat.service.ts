import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel
} from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatMsg {
  messageId: number;
  senderId: number;
  receiverId: number;
  content: string;
  sentAt: string;
  isReadByReceiver?: boolean;
}

export interface Conversation {
  userId: number;
  fullName: string;
  email: string;
  unreadCount: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private hub!: HubConnection;
  private connectAttempts = 0;
  private readonly MAX_ATTEMPTS = 3;

  messages      = signal<ChatMsg[]>([]);
  connected     = signal(false);
  adminId       = signal<number | null>(null);
  conversations = signal<Conversation[]>([]);
  totalUnread   = computed(() => this.conversations().reduce((s, c) => s + c.unreadCount, 0));
  activeConvUserId = signal<number | null>(null);

  // Use HTTP port 5000 directly — avoids HTTPS redirect/cert issues in dev
  // skipNegotiation + WebSockets only means no negotiate HTTP request at all
  private readonly HUB_URL = 'http://localhost:5000/hubs/chat';
  private readonly API = environment.apiBase;

  connect() {
    if (!this.auth.isAuthenticated()) return;
    if (this.hub && this.hub.state !== HubConnectionState.Disconnected) return;
    if (this.connectAttempts >= this.MAX_ATTEMPTS) return;

    this.hub = new HubConnectionBuilder()
      .withUrl(this.HUB_URL, {
        accessTokenFactory: () => this.auth.token ?? '',
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true   // skip HTTP negotiate — go straight to WebSocket
      })
      .withAutomaticReconnect([2000, 5000, 10000]) // retry 3 times max, then stop
      .configureLogging(LogLevel.Warning)
      .build();

    this.hub.onreconnected(() => {
      this.connected.set(true);
      this.connectAttempts = 0;
    });
    this.hub.onclose(() => this.connected.set(false));
    this.hub.onreconnecting(() => this.connected.set(false));

    this.hub.on('ReceiveMessage', (msg: ChatMsg) => {
      const isAdmin = this.auth.user()?.role === 'Admin';
      if (isAdmin) {
        const active = this.activeConvUserId();
        if (active !== null && (msg.senderId === active || msg.receiverId === active)) {
          this.messages.update(msgs => this.dedup([...msgs, msg]));
        }
        this.loadConversations();
      } else {
        this.messages.update(msgs => this.dedup([...msgs, msg]));
      }
    });

    this.connectAttempts++;
    this.hub.start()
      .then(() => {
        this.connected.set(true);
        this.connectAttempts = 0;
      })
      .catch((err: unknown) => {
        console.warn('SignalR connection failed:', err);
        this.connected.set(false);
      });
  }

  private dedup(msgs: ChatMsg[]): ChatMsg[] {
    const seen = new Set<number>();
    return msgs.filter(m => {
      if (seen.has(m.messageId)) return false;
      seen.add(m.messageId);
      return true;
    });
  }

  sendMessage(receiverId: number, content: string) {
    if (!content.trim() || !this.isConnected()) return;
    this.hub.invoke('SendMessage', receiverId, content)
      .catch((err: unknown) => console.error('Send error:', err));
  }

  markRead(senderId: number) {
    if (!this.isConnected()) return;
    this.hub.invoke('MarkRead', senderId).catch(() => {});
    this.conversations.update(cs =>
      cs.map(c => c.userId === senderId ? { ...c, unreadCount: 0 } : c)
    );
  }

  loadHistory(otherUserId: number) {
    this.messages.set([]);
    this.activeConvUserId.set(otherUserId);
    this.http.get<any>(`${this.API}/chat/history/${otherUserId}`).subscribe({
      next: r => this.messages.set(r?.data ?? []),
      error: () => {}
    });
  }

  loadConversations() {
    this.http.get<any>(`${this.API}/chat/conversations`).subscribe({
      next: r => this.conversations.set(r?.data ?? []),
      error: () => {}
    });
  }

  loadAdminId() {
    this.http.get<any>(`${this.API}/chat/admin-id`).subscribe({
      next: r => this.adminId.set(r?.data?.adminId ?? null),
      error: () => {}
    });
  }

  isConnected(): boolean {
    return this.hub?.state === HubConnectionState.Connected;
  }
}
