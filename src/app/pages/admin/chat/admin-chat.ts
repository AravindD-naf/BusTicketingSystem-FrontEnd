import { Component, inject, OnInit, OnDestroy, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Conversation } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-chat.html',
  styleUrl: './admin-chat.css'
})
export class AdminChat implements OnInit, OnDestroy, AfterViewChecked {
  chatService  = inject(ChatService);
  auth         = inject(AuthService);

  selectedUser = signal<Conversation | null>(null);
  inputText    = signal('');
  private shouldScroll = false;

  @ViewChild('msgList') msgList!: ElementRef<HTMLDivElement>;

  get myId(): number { return +(this.auth.user()?.id ?? 0); }

  ngOnInit() {
    // AdminLayout already connects and loads conversations on init.
    // Just refresh conversations in case this page was navigated to directly.
    this.chatService.loadConversations();
  }

  ngOnDestroy() { /* keep connection alive for notifications */ }

  ngAfterViewChecked() {
    if (this.shouldScroll) { this.scrollToBottom(); this.shouldScroll = false; }
  }

  selectUser(conv: Conversation) {
    this.selectedUser.set(conv);
    this.chatService.loadHistory(conv.userId);
    this.chatService.markRead(conv.userId);
    this.shouldScroll = true;
  }

  send() {
    const text = this.inputText().trim();
    const user = this.selectedUser();
    if (!text || !user) return;
    this.chatService.sendMessage(user.userId, text);
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
