import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { SocketService } from '../socket';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  constructor(
    public auth: AuthService,
    private socket: SocketService
  ) {}

  historialPedidos: any[] = [];
  
  ngOnInit() {
    this.socket.escucharPedidos().subscribe((pedidos: any[]) => {
      console.log('Pedido actualizado en admin:', pedidos);
      this.historialPedidos = pedidos;
    });
  }

  get totalVentas() {
    return this.historialPedidos.reduce(
      (sum, pedido) => sum + pedido.total, 
      0
    );
  }

  logout() {
    this.auth.logout();
  }
}
