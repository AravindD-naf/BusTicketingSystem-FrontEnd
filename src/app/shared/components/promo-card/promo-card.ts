import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PromoData {
  tag: string;
  text: string;
  code: string;
  badge: string;
  badgeSub: string;
}

@Component({
  selector: 'app-promo-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="promo-card">
      <div class="promo-left">
        <div class="promo-tag">{{ promo.tag }}</div>
        <div class="promo-text" [innerHTML]="promo.text"></div>
        <div class="promo-code">🏷 {{ promo.code }}</div>
      </div>
      <div class="promo-badge">
        <div class="promo-badge-val">{{ promo.badge }}</div>
        <div class="promo-badge-sub">{{ promo.badgeSub }}</div>
      </div>
    </div>
  `,
  styleUrl: './promo-card.css'
})
export class PromoCard {
  @Input({ required: true }) promo!: PromoData;
}