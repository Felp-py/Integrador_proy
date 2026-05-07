import { Routes } from '@angular/router';
import { login } from './login/login';
import { Cajero } from './cajero/cajero';
import { IntegradorDisplay } from './integrador-display/integrador-display';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: login },
  
  // 🔐 Protected routes
  { 
    path: 'cajero', 
    component: Cajero, 
    canActivate: [authGuard], 
    data: { role: 'cajero' } 
  },
  { 
    path: 'cocina', // Assuming your display route is called cocina
    component: IntegradorDisplay, 
    canActivate: [authGuard], 
    data: { role: 'cocina' } 
  },
  
  { path: '**', redirectTo: 'login' }
];