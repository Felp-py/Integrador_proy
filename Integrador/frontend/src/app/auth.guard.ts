import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['role'];

  if (authService.isLoggedIn() && authService.getRole() === expectedRole) {
    return true;
  }

  alert('Acceso denegado. Por favor inicia sesión con el rol correcto.');
  router.navigate(['/login']);
  return false;
};