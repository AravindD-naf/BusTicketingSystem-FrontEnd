import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { SearchForm } from '../../components/search-form/search-form';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

export interface DealOffer {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  promoCode: string;
  discount: string;
  discountSub: string;
  bgImage: string;
  bgColor: string;
  validUntil: string;
  termsLines: string[];
}

export interface TopRoute {
  from: string;
  to: string;
  image: string;
  safeImage?: SafeStyle;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule, SearchForm, Navbar, Footer],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  auth = inject(AuthService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  selectedDeal = signal<DealOffer | null>(null);
  codeCopied = signal(false);

  deals: DealOffer[] = [
    {
      id: 1,
      tag: 'Limited Offer',
      title: 'First Ride Free',
      subtitle: '20% off on your very first booking with BusMate',
      promoCode: 'FIRSTBUS20',
      discount: '20%',
      discountSub: 'OFF',
      bgImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
      bgColor: '#1a3a5c',
      validUntil: '31 May 2026',
      termsLines: [
        'Valid for first-time users only',
        'Minimum booking value ₹300',
        'Cannot be combined with other offers',
        'Valid on all routes and bus types',
      ]
    },
    {
      id: 2,
      tag: 'Weekend Special',
      title: 'Weekend Getaway',
      subtitle: 'Flat ₹150 off on all weekend trips',
      promoCode: 'WEEKEND150',
      discount: '₹150',
      discountSub: 'FLAT OFF',
      bgImage: 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=600&q=80',
      bgColor: '#1e4d2b',
      validUntil: '30 Apr 2026',
      termsLines: [
        'Valid on Saturday and Sunday travel dates',
        'Minimum booking value ₹500',
        'Applicable once per user per weekend',
        'Valid on AC Sleeper and Volvo buses',
      ]
    },
    {
      id: 3,
      tag: 'Member Exclusive',
      title: 'Loyalty Reward',
      subtitle: 'Save ₹100 on any route — exclusive for members',
      promoCode: 'MEMBER100',
      discount: '₹100',
      discountSub: 'SAVINGS',
      bgImage: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&q=80',
      bgColor: '#4a1a6b',
      validUntil: '15 Apr 2026',
      termsLines: [
        'Valid for registered users with 1+ past bookings',
        'Minimum booking value ₹400',
        'Applicable on routes above 200 km',
        'One-time use per account',
      ]
    },
    {
      id: 4,
      tag: 'Sleeper Deal',
      title: 'Dream Ride',
      subtitle: '15% off on all AC Sleeper bookings this month',
      promoCode: 'SLEEPER15',
      discount: '15%',
      discountSub: 'OFF',
      bgImage: 'https://images.unsplash.com/photo-1588362951121-3ee319b018b2?w=600&q=80',
      bgColor: '#7a2d00',
      validUntil: '30 Apr 2026',
      termsLines: [
        'Valid on AC Sleeper bus type only',
        'Minimum booking value ₹600',
        'Maximum discount capped at ₹300',
        'Valid for travel in April 2026',
      ]
    },
    {
      id: 5,
      tag: 'Group Travel',
      title: 'Travel Together',
      subtitle: 'Book 4+ seats and get 10% group discount',
      promoCode: 'GROUP10',
      discount: '10%',
      discountSub: 'GROUP',
      bgImage: 'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?w=600&q=80',
      bgColor: '#003d5b',
      validUntil: '31 May 2026',
      termsLines: [
        'Minimum 4 seats must be booked together',
        'All seats must be on the same schedule',
        'Maximum discount capped at ₹500',
        'Valid on all routes and bus types',
      ]
    },
  ];

  topRoutes: TopRoute[] = [
    {
      from: 'Chennai',
      to: 'Bangalore',
      image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80&auto=format&fit=crop' // Bangalore city
    },
    {
      from: 'Mumbai',
      to: 'Pune',
      image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80&auto=format&fit=crop' // Mumbai Gateway
    },
    {
      from: 'Hyderabad',
      to: 'Chennai',
      image: 'https://images.unsplash.com/photo-1551161242-b5af797b7233?q=80&w=1151&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      from: 'Delhi',
      to: 'Jaipur',
      image: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      from: 'Bangalore',
      to: 'Hyderabad',
      image: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/View_of_Banglore_Fort%2C_Karnatka%2C_India.jpg?w=800&q=80&auto=format&fit=crop' // Hyderabad Charminar
    },
    {
      from: 'Coimbatore',
      to: 'Chennai',
      image: 'https://images.unsplash.com/photo-1609609830354-8f615d61b9c8?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=800&q=80&auto=format&fit=crop' // Chennai temple
    },
  ];

  sanitizeUrl(url: string): SafeStyle {
    return this.sanitizer.bypassSecurityTrustStyle(`url('${url}')`);
  }

  openDeal(deal: DealOffer) {
    this.selectedDeal.set(deal);
    this.codeCopied.set(false);
  }

  closeDeal() {
    this.selectedDeal.set(null);
    this.codeCopied.set(false);
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    this.codeCopied.set(true);
    setTimeout(() => this.codeCopied.set(false), 2000);
  }

  scrollDeals(direction: number) {
    const track = document.getElementById('dealsTrack');
    if (track) track.scrollBy({ left: direction * 320, behavior: 'smooth' });
  }

  goToRoute(route: TopRoute) {
    const today = new Date().toISOString().split('T')[0];
    this.router.navigate(['/results'], {
      queryParams: {
        from: route.from,
        to: route.to,
        date: today,
      }
    });
  }

  features = [
    { icon: 'calendar', title: 'Easy Booking', desc: 'Reserve your seat in under 60 seconds with our streamlined booking flow.' },
    { icon: 'shield', title: 'Secure Payments', desc: 'Bank-grade encryption for every transaction. Pay via UPI, cards, or net banking.' },
    { icon: 'map-pin', title: 'Live Bus Tracking', desc: 'Track your bus on a real-time map. Never miss your pickup point again.' },
    { icon: 'heart', title: 'Comfortable Travel', desc: 'Choose from AC sleepers, semi-sleepers, and luxury coaches.' }
  ];

  steps = [
    { num: '01', title: 'Search Your Route', desc: "Enter origin, destination, and date. We'll show every available bus instantly." },
    { num: '02', title: 'Pick & Customize', desc: 'Choose your seat on an interactive map. Filter by type, timing, or price.' },
    { num: '03', title: 'Pay & Board', desc: 'Secure payment, instant e-ticket. Show it on your phone at boarding.' }
  ];
}