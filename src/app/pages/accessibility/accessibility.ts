import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-accessibility',
  standalone: true,
  imports: [Navbar, Footer],
  templateUrl: './accessibility.html',
  styleUrl: './accessibility.css'
})
export class Accessibility {}
