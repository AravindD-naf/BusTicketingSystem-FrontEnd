import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
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
export class ChatWidget implements OnInit, AfterViewChecked {
  auth        = inject(AuthService);
  chatService = inject(ChatService);

  open            = signal(false);
  inputText       = signal('');
  unreadFromAdmin = signal(0);
  private shouldScroll = false;
  private lastMsgCount = 0;

  @ViewChild('msgList') msgList!: ElementRef<HTMLDivElement>;

  get myId(): number { return +(this.auth.user()?.id ?? 0); }

  ngOnInit() {
    if (!this.auth.isAuthenticated() || this.auth.user()?.role === 'Admin') return;
    this.chatService.loadAdminId();
    this.chatService.connect();
  }

  ngAfterViewChecked() {
    const msgs = this.chatService.messages();
    // Auto-scroll when new messages arrive
    if (msgs.length !== this.lastMsgCount) {
      this.lastMsgCount = msgs.length;
      this.shouldScroll = true;
      // Track unread when window is closed
      if (!this.open() && msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        if (last.senderId !== this.myId) {
          this.unreadFromAdmin.update(n => n + 1);
        }
      }
    }
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleOpen() {
    this.open.update(v => !v);
    if (this.open()) {
      this.unreadFromAdmin.set(0);
      this.lastMsgCount = 0;
      const adminId = this.chatService.adminId();
      if (adminId) {
        this.chatService.loadHistory(adminId);
        this.chatService.markRead(adminId);
      } else {
        // adminId not loaded yet — retry after connection settles
        setTimeout(() => {
          const id = this.chatService.adminId();
          if (id) { this.chatService.loadHistory(id); this.chatService.markRead(id); }
        }, 1000);
      }
      this.shouldScroll = true;
    } else {
      this.chatService.messages.set([]);
      this.lastMsgCount = 0;
    }
  }

  send() {
    const text = this.inputText().trim();
    const adminId = this.chatService.adminId();
    if (!text || !adminId) return;
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
