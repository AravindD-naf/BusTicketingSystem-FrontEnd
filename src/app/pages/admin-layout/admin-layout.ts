import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="admin-shell">
      <aside class="sidebar" [class.collapsed]="collapsed()">
        <div class="sidebar-header">
          <!-- <span class="brand">🚌</span> -->
          <span class="brand-name" *ngIf="!collapsed()">BusMate Admin</span>
        </div>
        <button class="toggle-btn" (click)="collapsed.update(v=>!v)" [title]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
          {{ collapsed() ? '☰' : '✕' }}
        </button>
        <nav class="nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link">
            <span>📊</span><span *ngIf="!collapsed()" class="label">Dashboard</span>
          </a>
          <a routerLink="/admin/buses" routerLinkActive="active" class="nav-link">
            <span>🚌</span><span *ngIf="!collapsed()" class="label">Buses</span>
          </a>
          <a routerLink="/admin/routes" routerLinkActive="active" class="nav-link">
            <span>🗺️</span><span *ngIf="!collapsed()" class="label">Routes</span>
          </a>
          <a routerLink="/admin/schedules" routerLinkActive="active" class="nav-link">
            <span>🕐</span><span *ngIf="!collapsed()" class="label">Schedules</span>
          </a>
          <a routerLink="/admin/bookings" routerLinkActive="active" class="nav-link">
            <span>🎫</span><span *ngIf="!collapsed()" class="label">Bookings</span>
          </a>
          <a routerLink="/admin/sources" routerLinkActive="active" class="nav-link">
            <span>📍</span><span *ngIf="!collapsed()" class="label">Sources</span>
          </a>
          <a routerLink="/admin/destinations" routerLinkActive="active" class="nav-link">
            <span>🏁</span><span *ngIf="!collapsed()" class="label">Destinations</span>
          </a>
          <a routerLink="/admin/audit-logs" routerLinkActive="active" class="nav-link">
            <span>📋</span><span *ngIf="!collapsed()" class="label">Audit Logs</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <a routerLink="/" class="nav-link">
            <span>🏠</span><span *ngIf="!collapsed()" class="label">Customer View</span>
          </a>
          <button class="logout-btn" (click)="logout()">
            <span>🚪</span><span *ngIf="!collapsed()" class="label">Logout</span>
          </button>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="topbar-left">
            <span class="admin-badge">Admin Panel</span>
          </div>
          <div class="topbar-right">
            <span class="user-chip">👤 {{ userName() }}</span>
          </div>
        </header>
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-shell{display:flex;min-height:100vh;font-family:'Inter',sans-serif;background:#f1f5f9}
    .sidebar{width:220px;background:#0A1F44;color:#fff;display:flex;flex-direction:column;transition:width .25s;flex-shrink:0;position:relative;}
    .sidebar.collapsed{width:56px}
    .sidebar-header{display:flex;align-items:center;gap:10px;padding:18px 14px;border-bottom:1px solid rgba(255,255,255,.1)}
    .brand{font-size:1.4rem;flex-shrink:0}
    .brand-name{font-size:.95rem;font-weight:700;white-space:nowrap;overflow:hidden}
    .toggle-btn{
      position:absolute;
      top:14px;
      right:-14px;
      width:28px;
      height:28px;
      background:#1e3a6e;
      border:2px solid rgba(255,255,255,0.15);
      border-radius:50%;
      color:#fff;
      cursor:pointer;
      font-size:.85rem;
      display:flex;
      align-items:center;
      justify-content:center;
      z-index:20;
      transition:background .2s;
      box-shadow:0 2px 6px rgba(0,0,0,.3);
    }
    .toggle-btn:hover{background:#2d5299;}
    .nav{flex:1;padding:10px 0;overflow-y:auto}
    .nav-link{display:flex;align-items:center;gap:12px;padding:11px 14px;color:#cbd5e1;text-decoration:none;transition:all .2s;white-space:nowrap;overflow:hidden;font-size:.875rem}
    .nav-link:hover,.nav-link.active{background:rgba(255,255,255,.1);color:#fff}
    .nav-link.active{border-right:3px solid #60a5fa}
    .label{overflow:hidden;text-overflow:ellipsis}
    .sidebar-footer{padding:10px 0;border-top:1px solid rgba(255,255,255,.1)}
    .logout-btn{width:100%;display:flex;align-items:center;gap:12px;padding:11px 14px;background:none;border:none;color:#f87171;cursor:pointer;font-size:.875rem;text-align:left;white-space:nowrap}
    .logout-btn:hover{background:rgba(248,113,113,.1)}
    .main{flex:1;display:flex;flex-direction:column;min-width:0}
    .topbar{background:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,.08);position:sticky;top:0;z-index:10}
    .admin-badge{background:#eff6ff;color:#1d4ed8;padding:4px 12px;border-radius:20px;font-size:.8rem;font-weight:600}
    .user-chip{font-size:.85rem;color:#475569}
    .page-content{flex:1;padding:24px;overflow-y:auto}
  `]
})
export class AdminLayout {
  private auth = inject(AuthService);
  private router = inject(Router);
  collapsed = signal(false);

  /** Safe string getter — avoids TS2571 on unknown signal type */
  userName(): string {
    const u = this.auth.user();
    if (!u) return 'Admin';
    return (u as any).name || (u as any).email || 'Admin';
  }

  logout() {
    this.auth.logout(true);
  }
}
