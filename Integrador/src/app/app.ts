import { Component } from '@angular/core';
import { IntegradorDisplay } from './integrador-display/integrador-display';

@Component({
  selector: 'app-root', // 👈 SIEMPRE así
  standalone: true,
  imports: [IntegradorDisplay], // 👈 importas el componente
  templateUrl: './app.html', // 👈 NO el del integrador
  styleUrls: ['./app.css']
})
export class App {}