import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedInUserRole: 'cajero' | 'cocina' | null = null;

  constructor(private router: Router) {
    // Check if user session survived a page reload
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      this.loggedInUserRole = savedRole as 'cajero' | 'cocina';
    }
  }

  login(usuario: string, clave: string): boolean {
    // Hardcoded credentials for Capitán Burger staff
    if (usuario === 'caja1' && clave === 'burger123') {
      this.setSession('cajero');
      this.router.navigate(['/cajero']);
      return true;
    } else if (usuario === 'chef1' && clave === 'cocina123') {
      this.setSession('cocina');
      this.router.navigate(['/cocina']);
      return true;
    }
    return false;
  }

  private setSession(role: 'cajero' | 'cocina') {
    this.loggedInUserRole = role;
    localStorage.setItem('userRole', role);
  }

  getRole() {
    return this.loggedInUserRole;
  }

  isLoggedIn(): boolean {
    return this.loggedInUserRole !== null;
  }

  logout() {
    this.loggedInUserRole = null;
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }
}