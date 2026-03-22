import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class About {}
