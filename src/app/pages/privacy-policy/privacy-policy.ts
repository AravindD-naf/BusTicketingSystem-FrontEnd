import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.css'
})
export class PrivacyPolicy {}
