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
  ventasPorMes: any[] = []; 

  ngOnInit() {
    this.cargarHistorial(); 
    this.cargarVentasPorMes(); 
    this.socket.escucharPedidos().subscribe((pedidos: any[]) => {
      console.log('ADMIN RECIBIÓ:', pedidos);
      this.cdr.detectChanges();
    });
  }

  // nuevo
  cargarHistorial() {
    fetch('http://localhost:3000/historial')
      .then(res => res.json())
      .then((data: any[]) => {
        this.historialPedidos = data;
        this.cdr.detectChanges();
      });
  }

  cargarVentasPorMes() {
  fetch('http://localhost:3000/ventas-por-mes')
    .then(res => res.json())
    .then((data: any[]) => {
      this.ventasPorMes = data;
      this.cdr.detectChanges();
    });
}

  get totalVentas() {
    return this.historialPedidos.reduce(
      (totalGeneral, pedido) => {
        const totalPedido = pedido.items?.reduce(
          (sum: number, item: any) => sum + item.precio, 0
        ) || 0;
        return totalGeneral + totalPedido;
      }, 0
    );
  }

  getTotalPedido(pedido: any): number {
    if (!pedido.items) return 0;
    return pedido.items.reduce(
      (sum: number, item: any) => sum + item.precio, 0
    );
  }

  cancelarPedido(id: number) {
    const confirmar = confirm('¿Eliminar este pedido permanentemente?');
    if (!confirmar) return;

    fetch(`http://localhost:3000/pedidos/${id}`, { method: 'DELETE' })
      .then(() => {
        this.historialPedidos = this.historialPedidos.filter(p => p.id !== id);
        this.cdr.detectChanges();
      })
      .catch(err => console.error('Error al cancelar pedido:', err));
  }

  logout() {
    this.auth.logout();
  }
}