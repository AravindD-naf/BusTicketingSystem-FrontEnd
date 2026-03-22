import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-cancellations',
  standalone: true,
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './cancellations.html',
  styleUrl: './cancellations.css'
})
export class Cancellations {}
