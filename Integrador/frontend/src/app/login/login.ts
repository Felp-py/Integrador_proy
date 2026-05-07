import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class login {
  usuario = '';
  clave = '';
  errorMensaje = '';

  constructor(private authService: AuthService) {}

  onSubmit() {
    const exito = this.authService.login(this.usuario, this.clave);
    if (!exito) {
      this.errorMensaje = 'Usuario o contraseña incorrectos ❌';
    }
  }
}