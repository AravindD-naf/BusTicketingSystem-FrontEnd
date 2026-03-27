import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatWidget } from './components/chat-widget/chat-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatWidget],
  template: `<router-outlet /><app-chat-widget />`,
  styleUrl: './app.css'
})
export class App {}
