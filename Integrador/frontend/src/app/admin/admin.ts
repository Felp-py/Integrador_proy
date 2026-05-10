import { Component,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { SocketService } from '../socket';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})

export class Admin {
  constructor(
    public auth: AuthService,
    private socket: SocketService,
    private cdr: ChangeDetectorRef
  ) {}

  historialPedidos: any[] = [];
  ngOnInit() {
    this.socket.escucharPedidos().subscribe((pedidos: any[]) => {
      console.log('ADMIN RECIBIÓ:', pedidos);
      this.historialPedidos = [...pedidos];
      this.cdr.detectChanges();
    });
  }

  get totalVentas() {
    return this.historialPedidos.reduce(
      (totalGeneral, pedido) => {
        const totalPedido = pedido.items?.reduce(
          (sum: number, item: any) =>
            sum + item.precio,
          0
        ) || 0;
        return totalGeneral + totalPedido;
      },
      0
    );
  }

  getTotalPedido(pedido: any): number {
    if (!pedido.items) return 0;
    return pedido.items.reduce(
      (sum: number, item: any) =>
        sum + item.precio,
      0
    );
  }
  logout() {
    this.auth.logout();
  }
}