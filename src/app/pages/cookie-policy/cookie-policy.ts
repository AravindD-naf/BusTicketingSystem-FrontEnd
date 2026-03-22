import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-cookie-policy',
  standalone: true,
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './cookie-policy.html',
  styleUrl: './cookie-policy.css'
})
export class CookiePolicy {}
