import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeatType } from '../../core/models/seat.model';

@Component({
  selector: 'app-seat-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-icon.html'
})
export class SeatIconComponent {
  @Input({ required: true }) seatType!: SeatType;
  @Input({ required: true }) color!: string;
  @Input() gender: 'M' | 'F' | null = null;
  @Input() isBooked = false;

  get highlightColor(): string {
    return this.color === '#c9d5e8'
      ? 'rgba(255,255,255,0.35)'
      : 'rgba(255,255,255,0.22)';
  }

  get genderIconColor(): string {
    return this.color === '#c9d5e8' ? '#9fafc2' : 'rgba(255,255,255,0.85)';
  }
}
