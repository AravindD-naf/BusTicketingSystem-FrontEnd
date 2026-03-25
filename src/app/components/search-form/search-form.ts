import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouteService } from '../../core/services/route.service';

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-form.html',
  styleUrl: './search-form.css',
})
export class SearchForm implements OnInit {
  private router   = inject(Router);
  private fb       = inject(FormBuilder);
  private routeSvc = inject(RouteService);

  tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  searchForm: FormGroup = this.fb.group({
    from: ['', Validators.required],
    to:   ['', Validators.required],
    date: [this.tomorrow, Validators.required],
    passengers: [1]
  });

  // All unique cities loaded from DB
  allCities = signal<string[]>([]);

  // Dropdown suggestions
  fromSuggestions = signal<string[]>([]);
  toSuggestions   = signal<string[]>([]);

  showFromDropdown = signal(false);
  showToDropdown   = signal(false);

  ngOnInit() {
    this.routeSvc.getAllCities().subscribe({
      next: (r: any) => {
        const routes: any[] = r.data?.items ?? [];
        const cities = new Set<string>();
        routes.forEach((route: any) => {
          if (route.source)      cities.add(this.capitalize(route.source.trim()));
          if (route.destination) cities.add(this.capitalize(route.destination.trim()));
        });
        this.allCities.set([...cities].sort());
      },
      error: () => {}
    });
  }

  onFromInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchForm.patchValue({ from: val });
    this.fromSuggestions.set(this.fuzzyFilter(val, this.allCities()));
    this.showFromDropdown.set(val.length > 0 && this.fromSuggestions().length > 0);
  }

  onToInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchForm.patchValue({ to: val });
    this.toSuggestions.set(this.fuzzyFilter(val, this.allCities()));
    this.showToDropdown.set(val.length > 0 && this.toSuggestions().length > 0);
  }

  selectFrom(city: string) {
    this.searchForm.patchValue({ from: city });
    this.showFromDropdown.set(false);
  }

  selectTo(city: string) {
    this.searchForm.patchValue({ to: city });
    this.showToDropdown.set(false);
  }

  hideFromDropdown() { setTimeout(() => this.showFromDropdown.set(false), 150); }
  hideToDropdown()   { setTimeout(() => this.showToDropdown.set(false), 150); }

  swapCities() {
    const { from, to } = this.searchForm.value;
    this.searchForm.patchValue({ from: to, to: from });
  }

  onSearch() {
    if (this.searchForm.valid) {
      this.router.navigate(['/results'], { queryParams: this.searchForm.value });
    } else {
      this.searchForm.markAllAsTouched();
    }
  }

  // Fuzzy match: checks if all typed chars appear in order within the city name
  // Also does a simple startsWith boost by putting those results first
  private fuzzyFilter(query: string, cities: string[]): string[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    return cities
      .filter(city => city.toLowerCase().startsWith(q))
      .slice(0, 8);
  }


  private isFuzzyMatch(query: string, target: string): boolean {
    let qi = 0;
    for (let i = 0; i < target.length && qi < query.length; i++) {
      if (target[i] === query[qi]) qi++;
    }
    return qi === query.length;
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }
}
