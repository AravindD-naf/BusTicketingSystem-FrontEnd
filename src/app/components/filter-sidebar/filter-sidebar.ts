// import { CommonModule } from '@angular/common';
// import { Component, computed, inject } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { BusSearchService } from '../../core/services/bus-search.service';

// @Component({
//   selector: 'app-filter-sidebar',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './filter-sidebar.html',
//   styleUrl: './filter-sidebar.css',
// })
// export class FilterSidebar {
//   busSearch = inject(BusSearchService);

//   busTypes = ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater', 'Volvo AC Sleeper', 'AC Semi-Sleeper'];
//   operators = computed(() => {
//     const names = this.busSearch.allSchedules()
//       .map((s: any) => s.operatorName)
//       .filter((name: string) => !!name);
//     return [...new Set(names)] as string[];
//   });
//   departureTimes = [
//     { key: 'morning', label: 'Morning', icon: '🌅', range: '6 – 12 AM' },
//     { key: 'afternoon', label: 'Afternoon', icon: '☀️', range: '12 – 6 PM' },
//     { key: 'evening', label: 'Evening', icon: '🌆', range: '6 – 10 PM' },
//     { key: 'night', label: 'Night', icon: '🌙', range: '10 PM – 6' }
//   ] as const;

//   maxPrice = 3000;
//   selectedTypes: string[] = [];
//   selectedTimes: string[] = [];
//   selectedOperators: string[] = [];
//   minRating = 0;

//   onPriceChange(val: number) {
//     this.maxPrice = val;
//     this.applyFilter();
//   }

//   toggleType(type: string) {
//     const idx = this.selectedTypes.indexOf(type);
//     if (idx >= 0) this.selectedTypes.splice(idx, 1);
//     else this.selectedTypes.push(type);
//     this.applyFilter();
//   }

//   toggleTime(time: string) {
//     const idx = this.selectedTimes.indexOf(time);
//     if (idx >= 0) this.selectedTimes.splice(idx, 1);
//     else this.selectedTimes.push(time);
//     this.applyFilter();
//   }

//   setRating(r: number) { this.minRating = r; this.applyFilter(); }

//   applyFilter() {
//     this.busSearch.updateFilter({
//       busTypes: this.selectedTypes,
//       maxPrice: this.maxPrice,
//       departureTimes: this.selectedTimes as any,
//       operators: this.selectedOperators,
//       minRating: this.minRating
//     });
//   }

//   clearAll() {
//     this.selectedTypes = [];
//     this.selectedTimes = [];
//     this.selectedOperators = [];
//     this.maxPrice = 3000;
//     this.minRating = 0;
//     this.busSearch.updateFilter({ busTypes: [], maxPrice: 3000, departureTimes: [], operators: [], minRating: 0 });
//   }
// }




import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusSearchService } from '../../core/services/bus-search.service';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.html',
  styleUrl: './filter-sidebar.css',
})
export class FilterSidebar {
  busSearch = inject(BusSearchService);

  busTypes = ['AC Sleeper', 'Non-AC Sleeper', 'AC Seater', 'Non-AC Seater', 'Volvo AC Sleeper', 'AC Semi-Sleeper'];

  departureTimes = [
    { key: 'morning', label: 'Morning', icon: '🌅', range: '6 – 12 AM' },
    { key: 'afternoon', label: 'Afternoon', icon: '☀️', range: '12 – 6 PM' },
    { key: 'evening', label: 'Evening', icon: '🌆', range: '6 – 10 PM' },
    { key: 'night', label: 'Night', icon: '🌙', range: '10 PM – 6' }
  ] as const;

  maxPrice = 3000;
  selectedTypes: string[] = [];
  selectedTimes: string[] = [];
  selectedOperators: string[] = [];
  minRating = 0;

  // Dynamically derived from actual search results
  readonly operators = computed(() => {
    const names = this.busSearch.allSchedules()
      .map((s: any) => s.operatorName)
      .filter((name: string) => !!name);
    return [...new Set(names)] as string[];
  });

  onPriceChange(val: number) {
    this.maxPrice = val;
    this.applyFilter();
  }

  toggleType(type: string) {
    const idx = this.selectedTypes.indexOf(type);
    if (idx >= 0) this.selectedTypes.splice(idx, 1);
    else this.selectedTypes.push(type);
    this.applyFilter();
  }

  toggleTime(time: string) {
    const idx = this.selectedTimes.indexOf(time);
    if (idx >= 0) this.selectedTimes.splice(idx, 1);
    else this.selectedTimes.push(time);
    this.applyFilter();
  }

  setRating(r: number) { this.minRating = r; this.applyFilter(); }

  applyFilter() {
    this.busSearch.updateFilter({
      busTypes: this.selectedTypes,
      maxPrice: this.maxPrice,
      departureTimes: this.selectedTimes as any,
      operators: this.selectedOperators,
      minRating: this.minRating
    });
  }

  clearAll() {
    this.selectedTypes = [];
    this.selectedTimes = [];
    this.selectedOperators = [];
    this.maxPrice = 3000;
    this.minRating = 0;
    this.busSearch.updateFilter({ busTypes: [], maxPrice: 3000, departureTimes: [], operators: [], minRating: 0 });
  }
}