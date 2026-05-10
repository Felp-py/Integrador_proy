import { Routes } from '@angular/router';
import { login } from './login/login';
import { Cajero } from './cajero/cajero';
import { IntegradorDisplay } from './integrador-display/integrador-display';
import { Admin } from './admin/admin';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: login },
  
  { 
    path: 'cajero', 
    component: Cajero, 
    canActivate: [authGuard], 
    data: { role: 'cajero' } 
  },
  { 
    path: 'admin', 
    component: Admin, 
    canActivate: [authGuard], 
    data: { role: 'admin' } 
  },
  { 
    path: 'cocina', 
    component: IntegradorDisplay, 
    canActivate: [authGuard], 
    data: { role: 'cocina' } 
  },
  
  { path: '**', redirectTo: 'login' }
];