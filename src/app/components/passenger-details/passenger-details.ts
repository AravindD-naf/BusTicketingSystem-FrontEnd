import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-passenger-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-head">
        <div class="card-head-left">
          <div class="card-head-icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <div class="card-title">Passenger Details</div>
            <div class="card-sub">Enter details for each passenger</div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div class="passenger-forms">
          <div class="pax-form">
            <div class="pax-form-head">
              <div class="pax-num">
                <div class="pax-badge">1</div>
                Passenger 1
              </div>
              <div class="pax-seat-tag">Seat A1</div>
            </div>
            <div class="pax-form-body">
              <div class="pax-grid">
                <input type="text" class="form-input" placeholder="Full Name">
                <input type="number" class="form-input" placeholder="Age">
                <select class="form-select">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './passenger-details.css'
})
export class PassengerDetails {}
