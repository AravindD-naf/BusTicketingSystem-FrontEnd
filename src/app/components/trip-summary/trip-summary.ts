import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trip-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary-card">
      <div class="summary-head">
        <div class="summary-head-top">
          <div class="sh-logo">GL</div>
          <div>
            <div class="sh-name">GreenLine Travels</div>
            <div class="sh-type">AC Sleeper</div>
          </div>
        </div>
        <div class="summary-times">
          <div class="st-block">
            <div class="st-time">22:30</div>
            <div class="st-city">Chennai</div>
          </div>
          <div class="st-line">
            <div class="st-line-bar"></div>
            <div class="st-dur">8h 30m</div>
          </div>
          <div class="st-block">
            <div class="st-time">07:00</div>
            <div class="st-city">Bangalore</div>
          </div>
        </div>
      </div>
      <div class="summary-body">
        <div class="summary-row">
          <span>Selected Seats</span>
          <span>A1</span>
        </div>
        <div class="summary-row">
          <span>Passengers</span>
          <span>1</span>
        </div>
        <div class="summary-row">
          <span>Base Fare</span>
          <span>₹ 1,500</span>
        </div>
        <div class="summary-row">
          <span>Tax</span>
          <span>₹ 90</span>
        </div>
        <div class="summary-row">
          <span>Convenience Fee</span>
          <span>₹ 20</span>
        </div>
        <div class="summary-row total">
          <span>Total Amount</span>
          <span>₹ 1,610</span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './trip-summary.css'
})
export class TripSummary {}
