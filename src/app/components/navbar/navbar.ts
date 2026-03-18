import { CommonModule } from '@angular/common';
import { Component, signal, HostListener, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  auth = inject(AuthService);
  private router = inject(Router);
  mobileOpen = signal(false);
  scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 20); }

  toggleMobile() { this.mobileOpen.update(v => !v); }

  logout() {
    localStorage.removeItem('bg_token');
    localStorage.removeItem('bg_expiry');
    this.auth.logout(true);
  }

  getInitials(): string {
    const user = this.auth.user();
    if (!user) return '?';
    const name = user.name || user.email || '';
    const parts = name.split(/[\s@.]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] || '?').toUpperCase();
  }

  goToAdmin() { this.router.navigate(['/admin']); }
}
