import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './blog.html',
  styleUrl: './blog.css'
})
export class Blog {}
