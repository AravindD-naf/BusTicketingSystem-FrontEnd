import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './terms.html',
  styleUrl: './terms.css'
})
export class Terms {}
