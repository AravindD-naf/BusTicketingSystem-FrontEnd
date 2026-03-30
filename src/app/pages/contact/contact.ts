import { Component } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [Navbar, Footer],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class Contact {}
