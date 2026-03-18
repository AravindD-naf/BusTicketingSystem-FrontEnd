import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter, signal } from '@angular/core';
import { SortOption } from '../../core/models/filter.model';

@Component({
  selector: 'app-sort-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sort-bar">
      <span class="sort-label">Sort by</span>
      @for (opt of sortOptions; track opt.value) {
        <button class="sort-btn" [class.active]="activeSort() === opt.value"
          (click)="onSort(opt.value)">
          {{ opt.label }}
          @if (opt.arrow) { <span class="sort-arrow">{{ opt.arrow }}</span> }
        </button>
      }
    </div>
  `,
  styleUrl: './sort-bar.css',
})
export class SortBar {
   @Output() sortChange = new EventEmitter<SortOption>();
  activeSort = signal<SortOption>('departure');

  sortOptions = [
    { value: 'departure' as SortOption, label: 'Departure', arrow: '↑' },
    { value: 'arrival' as SortOption, label: 'Arrival', arrow: '' },
    { value: 'price_asc' as SortOption, label: 'Price', arrow: '↑' },
    { value: 'duration' as SortOption, label: 'Duration', arrow: '' },
    { value: 'rating' as SortOption, label: 'Ratings', arrow: '↓' }
  ];

  onSort(val: SortOption) {
    this.activeSort.set(val);
    this.sortChange.emit(val);
  }
}
