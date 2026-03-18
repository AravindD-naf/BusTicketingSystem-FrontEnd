import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-head">
        <div class="card-head-left">
          <div class="card-head-icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <div class="card-title">Contact Details</div>
            <div class="card-sub">For booking confirmation</div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div class="contact-grid">
          <input type="email" class="form-input" placeholder="Email">
          <input type="tel" class="form-input" placeholder="Phone Number">
        </div>
        <div class="whatsapp-opt">
          <input type="checkbox" id="whatsapp">
          <label for="whatsapp" class="wa-label">Send booking updates on WhatsApp</label>
          <div class="wa-sub">Get real-time updates about your booking</div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './contact-details.css'
})
export class ContactDetails {}
