import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-cancellations',
  standalone: true,
  imports: [Navbar, Footer],
  templateUrl: './cancellations.html',
  styleUrl: './cancellations.css'
})
export class Cancellations {}
