import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.css'
})
export class HowItWorks {}
