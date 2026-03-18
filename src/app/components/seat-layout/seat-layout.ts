import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeatIconComponent } from '../seat-icon/seat-icon';
import { Seat, SeatRow } from '../../core/models/seat.model';
import { SeatService } from '../../core/services/seat.service';

@Component({
  selector: 'app-seat-layout',
  standalone: true,
  imports: [CommonModule, SeatIconComponent],
  templateUrl: './seat-layout.html',
  styleUrl: './seat-layout.css'
})
export class SeatLayoutComponent {
  @Input({ required: true }) rows!: SeatRow[];
  @Input() selectedSeats: Seat[] = [];
  @Output() seatToggled = new EventEmitter<Seat>();

  constructor(public seatService: SeatService) {}

  onSeatClick(seat: Seat): void {
    if (seat.status !== 'booked') {
      this.seatToggled.emit(seat);
    }
  }

  getSeatClass(seat: Seat): Record<string, boolean> {
    return {
      'seat-cell': true,
      'is-sleeper': seat.type === 'sleeper',
      'is-selected': this.seatService.isSelected(seat.seatId),
      'is-booked': seat.status === 'booked'
    };
  }
}
