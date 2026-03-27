import { Component, inject, OnInit, OnDestroy, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css'
})
export class ChatWidget implements OnInit, OnDestroy, AfterViewChecked {
  auth        = inject(AuthService);
  chatService = inject(ChatService);

  open            = signal(false);
  inputText       = signal('');
  unreadFromAdmin = signal(0);
  private shouldScroll = false;
  private msgSub: (() => void) | null = null;

  @ViewChild('msgList') msgList!: ElementRef<HTMLDivElement>;

  get myId(): number { return +(this.auth.user()?.id ?? 0); }

  ngOnInit() {
    // Only for authenticated non-admin users
    if (!this.auth.isAuthenticated() || this.auth.user()?.role === 'Admin') return;
    this.chatService.loadAdminId();
    this.chatService.connect();
  }

  ngOnDestroy() { /* service stays alive */ }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleOpen() {
    this.open.update(v => !v);
    if (this.open()) {
      this.unreadFromAdmin.set(0);
      const adminId = this.chatService.adminId();
      if (adminId) {
        this.chatService.loadHistory(adminId);
        this.chatService.markRead(adminId);
      } else {
        // Retry once after a short delay
        setTimeout(() => {
          const id = this.chatService.adminId();
          if (id) { this.chatService.loadHistory(id); this.chatService.markRead(id); }
        }, 1000);
      }
      this.shouldScroll = true;
    } else {
      this.chatService.messages.set([]);
    }
  }

  // Called from template when new messages arrive while window is open
  onMessagesChange() {
    this.shouldScroll = true;
  }

  send() {
    const text = this.inputText().trim();
    const adminId = this.chatService.adminId();
    if (!text || !adminId) return;
    if (!this.chatService.isConnected()) {
      // Try to reconnect once then send
      this.chatService.connect();
      setTimeout(() => {
        if (this.chatService.isConnected()) {
          this.chatService.sendMessage(adminId, text);
          this.inputText.set('');
          this.shouldScroll = true;
        }
      }, 1500);
      return;
    }
    this.chatService.sendMessage(adminId, text);
    this.inputText.set('');
    this.shouldScroll = true;
  }

  onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  private scrollToBottom() {
    try { this.msgList.nativeElement.scrollTop = this.msgList.nativeElement.scrollHeight; } catch {}
  }
}
