import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { BusSearchService } from '../../core/services/bus-search.service';
import { HttpErrorHandlerService } from '../../core/services/http-error-handler.service';
import { SortOption } from '../../core/models/filter.model';
import { FilterSidebar } from '../../components/filter-sidebar/filter-sidebar';


@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, FilterSidebar],
  templateUrl: './search-results.html',
  styleUrl: './search-results.css',
})
export class SearchResults implements OnInit {
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private errHandler = inject(HttpErrorHandlerService);
  busSearchService   = inject(BusSearchService);

  from       = signal('');
  to         = signal('');
  date       = signal('');
  passengers = signal(1);
  loading    = signal(true);
  error      = signal<string | null>(null);

  schedules = this.busSearchService.filteredSchedules;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.from.set(params['from'] || '');
      this.to.set(params['to'] || '');
      this.date.set(params['date'] || '');
      this.passengers.set(+params['passengers'] || 1);
      this.loadSchedules();
    });
  }

  loadSchedules() {
    if (!this.from() || !this.to() || !this.date()) {
      this.loading.set(false);
      this.error.set('Please enter origin, destination, and date to search.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.busSearchService.search(this.from(), this.to(), this.date(), this.passengers()).subscribe({
      next: () => this.loading.set(false),
      error: (err) => {
        this.error.set(this.errHandler.getErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  sortBy(option: SortOption) {
    this.busSearchService.updateSort(option);
  }

  onSelectBus(scheduleId: number) {
    this.router.navigate(['/seat-selection', scheduleId], {
      queryParams: {
        from: this.from(), to: this.to(),
        date: this.date(), passengers: this.passengers()
      }
    });
  }

  editSearch() {
    this.router.navigate(['/'], {
      queryParams: { from: this.from(), to: this.to(), date: this.date() }
    });
  }

  getOpInitials(name: string = ''): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return (words[0]?.substring(0, 2) || 'BU').toUpperCase();
  }

  formatTime(t: string): string {
    if (!t) return '';
    const parts = t.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parts[1];
      return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
    }
    return t;
  }

  formatDuration(dep: string, arr: string): string {
    if (!dep || !arr) return '';
    try {
      const toMins = (t: string) => {
        const p = t.split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
      };
      let diff = toMins(arr) - toMins(dep);
      if (diff < 0) diff += 24 * 60; // handle overnight
      return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    } catch {
      return '';
    }
  }
}
