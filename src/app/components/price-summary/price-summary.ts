import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-price-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary-card">
      <div class="summary-head">
        <h3>Price Summary</h3>
      </div>
      <div class="summary-body">
        <div class="summary-row">
          <span>Seat Fare</span>
          <span>₹ 1,500</span>
        </div>
        <div class="summary-row">
          <span>Tax (6%)</span>
          <span>₹ 90</span>
        </div>
        <div class="summary-row">
          <span>Convenience Fee</span>
          <span>₹ 20</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>₹ 1,610</span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './price-summary.css'
})
export class PriceSummary {}
