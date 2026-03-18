import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeatIconComponent } from '../seat-icon/seat-icon';

@Component({
  selector: 'app-seat-legend',
  standalone: true,
  imports: [CommonModule, SeatIconComponent],
  template: `
    <div class="legend-strip">
      <div class="legend-item">
        <app-seat-icon seatType="seater" color="#22a855" gender="M"></app-seat-icon>
        <span>Available (Male)</span>
      </div>
      <div class="legend-item">
        <app-seat-icon seatType="seater" color="#ec4899" gender="F"></app-seat-icon>
        <span>Ladies Seat</span>
      </div>
      <div class="legend-item">
        <app-seat-icon seatType="seater" color="#0A1F44"></app-seat-icon>
        <span>Selected</span>
      </div>
      <div class="legend-item">
        <app-seat-icon seatType="seater" color="#c9d5e8" [isBooked]="true"></app-seat-icon>
        <span>Sold</span>
      </div>
      <div class="legend-item">
        <app-seat-icon seatType="sleeper" color="#22a855"></app-seat-icon>
        <span>Sleeper</span>
      </div>
    </div>
  `,
  styleUrl: './seat-legend.css'
})
export class SeatLegendComponent {
  legendItems = [
    { color: '#22a855', type: 'seater' as const, gender: 'M' as const, label: 'Available (Male)' },
    { color: '#ec4899', type: 'seater' as const, gender: 'F' as const, label: 'Ladies Seat' },
    { color: '#0A1F44', type: 'seater' as const, gender: null, label: 'Selected' },
    { color: '#c9d5e8', type: 'seater' as const, gender: null, label: 'Sold', isBooked: true },
    { color: '#22a855', type: 'sleeper' as const, gender: null, label: 'Sleeper' },
  ];
}
