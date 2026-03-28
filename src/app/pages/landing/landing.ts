import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { SearchForm } from '../../components/search-form/search-form';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { PromoService, PromoCode } from '../../core/services/promo.service';

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
export class Landing implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private promoService = inject(PromoService);

  selectedDeal = signal<DealOffer | null>(null);
  codeCopied = signal(false);

  // Backgrounds for promo cards — cycled through
  private readonly BG_IMAGES = [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80',
    'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=600&q=80',
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&q=80',
    'https://images.unsplash.com/photo-1588362951121-3ee319b018b2?w=600&q=80',
    'https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?w=600&q=80',
  ];
  private readonly BG_COLORS = ['#1a3a5c', '#1e4d2b', '#4a1a6b', '#7a2d00', '#003d5b'];

  deals: DealOffer[] = [];

  ngOnInit() {
    this.promoService.getActive().subscribe({
      next: (r: any) => {
        const promos: PromoCode[] = r?.data ?? [];
        this.deals = promos.map((p, i) => this.promoToDeals(p, i));
      },
      error: () => { this.deals = []; }
    });
  }

  private promoToDeals(p: PromoCode, i: number): DealOffer {
    const isPercent = p.discountType === 'Percentage';
    const discount = isPercent ? `${p.discountValue}%` : `₹${p.discountValue}`;
    const discountSub = isPercent ? 'OFF' : 'FLAT OFF';
    const validUntil = new Date(p.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const terms: string[] = [];
    if (p.minBookingAmount > 0) terms.push(`Minimum booking value ₹${p.minBookingAmount}`);
    if (p.maxDiscountAmount > 0) terms.push(`Maximum discount capped at ₹${p.maxDiscountAmount}`);
    if (p.maxUsageCount > 0) terms.push(`Limited to ${p.maxUsageCount} uses`);
    terms.push('Valid on all routes and bus types');
    return {
      id: p.promoCodeId,
      tag: isPercent ? 'Percentage Offer' : 'Flat Discount',
      title: p.code,
      subtitle: isPercent
        ? `${p.discountValue}% off on your booking${p.maxDiscountAmount > 0 ? ` (up to ₹${p.maxDiscountAmount})` : ''}`
        : `Flat ₹${p.discountValue} off on your booking`,
      promoCode: p.code,
      discount,
      discountSub,
      bgImage: this.BG_IMAGES[i % this.BG_IMAGES.length],
      bgColor: this.BG_COLORS[i % this.BG_COLORS.length],
      validUntil,
      termsLines: terms
    };
  }
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