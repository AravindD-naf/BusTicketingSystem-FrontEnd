import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-partner',
  standalone: true,
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './partner.html',
  styleUrl: './partner.css'
})
export class Partner {}
