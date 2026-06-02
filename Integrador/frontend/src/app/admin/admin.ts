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
  ventasPorMes: any[]     = [];
  ventasPorDia: any[]     = [];
  ventasPorSemana: any[]  = [];
  stockProductos: any[]   = [];
  stockIngredientes: any[] = [];
  vistaActual: string     = 'historial';
  vistaVentas: string     = 'dia';
  mesExpandido: string | null = null; 

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
    this.cargarVentasPorDia();
    this.cargarVentasPorSemana();
    this.cargarStock();
  }

  cargarHistorial() {
    fetch('http://localhost:3000/historial')
      .then(res => res.json())
      .then((data: any[]) => {
        this.historialPedidos = data;
        this.cdr.detectChanges();
      });
  }

  cargarVentasPorDia() {
    fetch('http://localhost:3000/ventas-por-dia')
      .then(res => res.json())
      .then((data: any) => {
        this.ventasPorDia = Array.isArray(data) ? data : []; 
        this.cdr.detectChanges();
      });
  }

  cargarVentasPorMes() {
    fetch('http://localhost:3000/ventas-por-mes')
      .then(res => res.json())
      .then((data: any) => {
        this.ventasPorMes = Array.isArray(data) ? data : []; 
        this.cdr.detectChanges();
      });
  }

  cargarVentasPorSemana() {
    fetch('http://localhost:3000/ventas-por-semana')
      .then(res => res.json())
      .then((data: any) => {
        this.ventasPorSemana = Array.isArray(data) ? data : []; 
        this.cdr.detectChanges();
      });
  }

  cargarStock() {
    fetch('http://localhost:3000/stock-admin')
      .then(res => res.json())
      .then((data: any) => {
        this.stockProductos   = data.productos;
        this.stockIngredientes = data.ingredientes;
        this.cdr.detectChanges();
      });
  }

  // Total dinámico según la vista activa
  get totalPedidosMostrados(): number {
    if (this.vistaActual === 'dia')    return (this.ventasPorDia || []).reduce((s, d) => s + Number(d.total_pedidos), 0);
    if (this.vistaActual === 'semana') return (this.ventasPorSemana || []).reduce((s, d) => s + Number(d.total_pedidos), 0);
    if (this.vistaActual === 'mes')    return (this.ventasPorMes || []).reduce((s, d) => s + Number(d.total_pedidos), 0);
    return this.historialPedidos.length;
  }

  get totalVentasMostradas(): number {
    if (this.vistaActual === 'dia')    return (this.ventasPorDia || []).reduce((s, d) => s + Number(d.total_ventas), 0);
    if (this.vistaActual === 'semana') return (this.ventasPorSemana || []).reduce((s, d) => s + Number(d.total_ventas), 0);
    if (this.vistaActual === 'mes')    return (this.ventasPorMes || []).reduce((s, d) => s + Number(d.total_ventas), 0);
    return this.historialPedidos.reduce((s, p) => s + (p.total || 0), 0);
  }

  toggleMes(mesKey: string) {
    this.mesExpandido = this.mesExpandido === mesKey ? null : mesKey;
  }

  pedidosDelMes(mesKey: string): any[] {
    return this.historialPedidos.filter(p => {
      const fecha = new Date(p.creado_en);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      return key === mesKey;
    });
  }

  pedidosDeLaSemana(semanaKey: string): any[] {
    return this.historialPedidos.filter(p => {
      const fecha = new Date(p.creado_en);
      const año = fecha.getFullYear();
      const inicio = new Date(año, 0, 1);
      const dias = Math.floor((fecha.getTime() - inicio.getTime()) / 86400000);
      const diaSemana = inicio.getDay() || 7;
      const semana = Math.ceil((dias + diaSemana) / 7);
      const key = `${año}${String(semana).padStart(2, '0')}`;
      return key === String(semanaKey);
    });
  }

  pedidosDelDia(dia: string): any[] {
    const diaCorto = dia.toString().slice(0, 10); 
    return this.historialPedidos.filter(p => {
      const fecha = new Date(p.creado_en);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      return key === diaCorto;
    });
  }

  getTotalPedido(pedido: any): number {
    return pedido.total || pedido.items?.reduce((s: number, i: any) => s + i.precio, 0) || 0;
  }

  cancelarPedido(id: number) {
    const confirmar = confirm('¿Eliminar este pedido permanentemente?');
    if (!confirmar) return;
    fetch(`http://localhost:3000/pedidos/${id}`, { method: 'DELETE' })
      .then(() => {
        this.historialPedidos = this.historialPedidos.filter(p => p.id !== id);
        this.cargarVentasPorMes();
        this.cargarVentasPorDia();
        this.cargarVentasPorSemana();
        this.cdr.detectChanges();
      })
      .catch(err => console.error('Error:', err));
  }

  logout() {
    this.auth.logout();
  }
}