import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cancellation-policy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary-card">
      <div class="summary-head">
        <h3>Cancellation Policy</h3>
      </div>
      <div class="summary-body">
        <div class="cancel-toggle">
          <div class="cancel-toggle-left">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="currentColor"/>
            </svg>
            Cancellation Policy
          </div>
          <div class="toggle-arrow">▼</div>
        </div>
        <div class="cancel-body">
          <div class="cancel-row">
            <div class="cancel-icon ci-green">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <div class="cancel-text">
              <strong>24 hours before departure</strong>
              <span>Full refund</span>
            </div>
          </div>
          <div class="cancel-row">
            <div class="cancel-icon ci-amber">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <div class="cancel-text">
              <strong>6-24 hours before departure</strong>
              <span>50% refund</span>
            </div>
          </div>
          <div class="cancel-row">
            <div class="cancel-icon ci-red">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <div class="cancel-text">
              <strong>Less than 6 hours</strong>
              <span>No refund</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './cancellation-policy.css'
})
export class CancellationPolicy {}
