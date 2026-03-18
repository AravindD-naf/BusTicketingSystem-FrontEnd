import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BusDisplay } from '../../core/models/bus.model';

@Component({
  selector: 'app-bus-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bus-card.html',
  styleUrl: './bus-card.css',
})
export class BusCard {
  @Input({ required: true }) bus!: BusDisplay;
  @Output() selectSeat = new EventEmitter<string>();

  get seatsClass(): string {
    if (this.bus.seatsAvailable <= 5) return 'low';
    if (this.bus.seatsAvailable <= 10) return 'few';
    return '';
  }

  get durationFormatted(): string {
    const h = Math.floor(this.bus.durationMinutes / 60);
    const m = this.bus.durationMinutes % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  }

  onSelect() {
    this.selectSeat.emit(this.bus.id);
  }
}
