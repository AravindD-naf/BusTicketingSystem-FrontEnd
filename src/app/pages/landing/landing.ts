import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SearchForm } from '../../components/search-form/search-form';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule, SearchForm, Navbar, Footer],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  auth = inject(AuthService);

  features = [
    { icon: 'calendar', title: 'Easy Booking',      desc: 'Reserve your seat in under 60 seconds with our streamlined booking flow.' },
    { icon: 'shield',   title: 'Secure Payments',   desc: 'Bank-grade encryption for every transaction. Pay via UPI, cards, or net banking.' },
    { icon: 'map-pin',  title: 'Live Bus Tracking',  desc: 'Track your bus on a real-time map. Never miss your pickup point again.' },
    { icon: 'heart',    title: 'Comfortable Travel', desc: 'Choose from AC sleepers, semi-sleepers, and luxury coaches.' }
  ];

  steps = [
    { num: '01', title: 'Search Your Route',   desc: "Enter origin, destination, and date. We'll show every available bus instantly." },
    { num: '02', title: 'Pick & Customize',    desc: 'Choose your seat on an interactive map. Filter by type, timing, or price.' },
    { num: '03', title: 'Pay & Board',         desc: 'Secure payment, instant e-ticket. Show it on your phone at boarding.' }
  ];
}
