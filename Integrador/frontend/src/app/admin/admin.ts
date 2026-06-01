import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { SocketService } from '../socket';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})

export class Admin implements OnInit, OnDestroy {
  private sub!: Subscription;

  constructor(
    public auth: AuthService,
    private socket: SocketService,
    private cdr: ChangeDetectorRef
  ) {}

  historialPedidos: any[] = [];
  ventasPorMes: any[]    = [];
  ventasPorSemana: any[] = [];
  ventasPorDia: any[]    = [];
  vistaActual: string    = 'historial';

  ngOnInit() {
    this.cargarTodo();
    this.sub = this.socket.escucharPedidos().subscribe(() => {
      this.cargarTodo();
    });
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
  }

  cargarTodo() {
    this.cargarHistorial();
    this.cargarVentasPorMes();
    this.cargarVentasPorSemana(); 
    this.cargarVentasPorDia();    
  }

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

  cargarVentasPorSemana() {
    fetch('http://localhost:3000/ventas-por-semana')
      .then(res => res.json())
      .then((data: any[]) => {
        this.ventasPorSemana = data;
        this.cdr.detectChanges();
      });
  }

  cargarVentasPorDia() {
    fetch('http://localhost:3000/ventas-por-dia')
      .then(res => res.json())
      .then((data: any[]) => {
        this.ventasPorDia = data;
        this.cdr.detectChanges();
      });
  }

  get totalVentas() {
    return this.historialPedidos
      .filter(p => p.estado !== 'cancelado')
      .reduce((sum, p) => sum + (p.total || 0), 0);
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
        this.cargarVentasPorMes();
        this.cargarVentasPorSemana();
        this.cargarVentasPorDia();
        this.cdr.detectChanges();
      })
      .catch(err => console.error('Error al cancelar pedido:', err));
  }

  logout() {
    this.auth.logout();
  }
}