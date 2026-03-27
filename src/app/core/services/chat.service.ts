import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
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
  private http   = inject(HttpClient);
  private auth   = inject(AuthService);
  private hub!: signalR.HubConnection;

  messages   = signal<ChatMsg[]>([]);
  connected  = signal(false);
  adminId    = signal<number | null>(null);

  // Admin-side: list of conversations with unread counts
  conversations  = signal<Conversation[]>([]);
  totalUnread    = computed(() => this.conversations().reduce((s, c) => s + c.unreadCount, 0));

  // Track which user's history is currently loaded (admin side)
  activeConvUserId = signal<number | null>(null);

  // Hub URL: strip /api/v1 suffix to get base, then append /hubs/chat
  // Works with both relative (/api/v1) and absolute (https://host/api/v1) apiBase
  private readonly HUB_URL = (() => {
    const base = environment.apiBase.replace(/\/api\/v1\/?$/, '');
    return base ? `${base}/hubs/chat` : '/hubs/chat';
  })();
  private readonly API = environment.apiBase;

  connect() {
    if (this.hub && this.hub.state !== signalR.HubConnectionState.Disconnected) return;

    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(this.HUB_URL, {
        accessTokenFactory: () => this.auth.token ?? ''
      })
      .withAutomaticReconnect()
      .build();

    this.hub.onreconnected(() => this.connected.set(true));
    this.hub.onclose(() => this.connected.set(false));

    this.hub.on('ReceiveMessage', (msg: ChatMsg) => {
      const isAdmin = this.auth.user()?.role === 'Admin';

      if (isAdmin) {
        // Only append to message list if this message belongs to the active conversation
        const active = this.activeConvUserId();
        if (active !== null && (msg.senderId === active || msg.receiverId === active)) {
          this.messages.update(msgs => this.dedup([...msgs, msg]));
        }
        // Always refresh conversation list for badge updates
        this.loadConversations();
      } else {
        // Customer: always append (only one conversation — with admin)
        this.messages.update(msgs => this.dedup([...msgs, msg]));
      }
    });

    this.hub.start()
      .then(() => this.connected.set(true))
      .catch((err: unknown) => console.error('SignalR connect error:', err));
  }

  /** Deduplicate by messageId */
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
    // Clear badge locally immediately
    this.conversations.update(cs =>
      cs.map(c => c.userId === senderId ? { ...c, unreadCount: 0 } : c)
    );
  }

  loadHistory(otherUserId: number) {
    this.messages.set([]); // clear before loading
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

  private isConnected(): boolean {
    return this.hub?.state === signalR.HubConnectionState.Connected;
  }
}
