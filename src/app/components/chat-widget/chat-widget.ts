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
  private prevMsgCount = 0;
  private shouldScroll = false;

  @ViewChild('msgList') msgList!: ElementRef<HTMLDivElement>;

  get myId(): number { return +(this.auth.user()?.id ?? 0); }

  ngOnInit() {
    if (!this.auth.isAuthenticated() || this.auth.user()?.role === 'Admin') return;
    this.chatService.loadAdminId();
    this.chatService.connect();

    // Poll for new messages when window is closed to show unread badge
    setInterval(() => {
      const msgs = this.chatService.messages();
      if (!this.open() && msgs.length > this.prevMsgCount) {
        const newMsgs = msgs.slice(this.prevMsgCount);
        const fromAdmin = newMsgs.filter(m => m.senderId !== this.myId).length;
        if (fromAdmin > 0) this.unreadFromAdmin.update(n => n + fromAdmin);
      }
      this.prevMsgCount = msgs.length;
    }, 500);
  }

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
      this.prevMsgCount = 0;
      const adminId = this.chatService.adminId();
      if (adminId) {
        this.chatService.loadHistory(adminId);
        this.chatService.markRead(adminId);
      } else {
        this.chatService.loadAdminId();
        setTimeout(() => {
          const id = this.chatService.adminId();
          if (id) { this.chatService.loadHistory(id); this.chatService.markRead(id); }
        }, 800);
      }
      this.shouldScroll = true;
    } else {
      this.chatService.messages.set([]);
      this.prevMsgCount = 0;
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
