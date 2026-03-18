import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-form.html',
  styleUrl: './search-form.css',
})
export class SearchForm {
  searchForm: FormGroup;
  tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  constructor(private fb: FormBuilder, private router: Router) {
    this.searchForm = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      date: [this.tomorrow, Validators.required],
      passengers: [1]
    });
  }

  swapCities() {
    const { from, to } = this.searchForm.value;
    this.searchForm.patchValue({ from: to, to: from });
  }

  onSearch() {
    if (this.searchForm.valid) {
      this.router.navigate(['/results'], { queryParams: this.searchForm.value })
        .catch(err => {
          console.error('Navigation error during search:', err);
          alert('Failed to navigate to search results. Please try again.');
        });
    }
    else {
      this.searchForm.markAllAsTouched();
    }
  }
}
