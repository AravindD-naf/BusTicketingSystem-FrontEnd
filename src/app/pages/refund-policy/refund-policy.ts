import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-refund-policy',
  standalone: true,
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './refund-policy.html',
  styleUrl: './refund-policy.css'
})
export class RefundPolicy {}
