import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class Contact {}
