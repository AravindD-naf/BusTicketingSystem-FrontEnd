import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-boarding-drop',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-head">
        <div class="card-head-left">
          <div class="card-head-icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <div class="card-title">Boarding & Drop Points</div>
            <div class="card-sub">Select your pickup and drop locations</div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div class="boarding-grid">
          <div class="form-group">
            <label class="form-label">Boarding Point</label>
            <select class="form-select">
              <option>Koyambedu CMBT - 22:30</option>
              <option>Chennai CMBT - 22:00</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Drop Point</label>
            <select class="form-select">
              <option>Majestic - 06:30</option>
              <option>Silk Board - 06:00</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './boarding-drop.css'
})
export class BoardingDrop {}
