import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { SocketService } from '../socket';
import { Subscription } from 'rxjs';
import { ReporteService } from '../reporte.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class Admin implements OnInit, OnDestroy {
  private sub!: Subscription;

  constructor(
    public auth: AuthService,
    private socket: SocketService,
    private cdr: ChangeDetectorRef,
    private reporte: ReporteService
  ) {}

  historialPedidos: any[] = [];
  ventasPorMes: any[]     = [];
  ventasPorDia: any[]     = [];
  ventasPorSemana: any[]  = [];
  stockProductos: any[]   = [];
  stockIngredientes: any[] = [];
  vistaActual: string     = 'hoy';
  vistaVentas: string     = 'dia';
  mesExpandido: string | null = null; 

  // Filtros de stock
  filtroStock: 'todos' | 'bajo' | 'vencimiento' = 'todos';
  diasVencimientoAlerta: number = 7;

  editandoId: string | null = null;
  editandoTipo : 'producto' | 'ingrediente' | null = null;
  editForm : any = {};

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
    fetch('https://integrador-proy-1.onrender.com/historial')
      .then(res => res.json())
      .then((data: any[]) => {
        this.historialPedidos = data;
        this.cdr.detectChanges();
      });
  }

  cargarVentasPorDia() {
    fetch('https://integrador-proy-1.onrender.com/ventas-por-dia')
      .then(res => res.json())
      .then((data: any) => {
        this.ventasPorDia = Array.isArray(data) ? data : []; 
        this.cdr.detectChanges();
      });
  }

  cargarVentasPorMes() {
    fetch('https://integrador-proy-1.onrender.com/ventas-por-mes')
      .then(res => res.json())
      .then((data: any) => {
        this.ventasPorMes = Array.isArray(data) ? data : []; 
        this.cdr.detectChanges();
      });
  }

  cargarVentasPorSemana() {
    fetch('https://integrador-proy-1.onrender.com/ventas-por-semana')
      .then(res => res.json())
      .then((data: any) => {
        this.ventasPorSemana = Array.isArray(data) ? data : []; 
        this.cdr.detectChanges();
      });
  }

  cargarStock() {
    fetch('https://integrador-proy-1.onrender.com/stock-admin')
      .then(res => res.json())
      .then((data: any) => {
        this.stockProductos   = data.productos;
        this.stockIngredientes = data.ingredientes;
        this.cdr.detectChanges();
      });
  }

  diasParaVencer(item: any): number | null {
    if (!item.fecha_vencimiento) return null;
    const hoy   = new Date(); hoy.setHours(0, 0, 0, 0);
    const vence = new Date(item.fecha_vencimiento);
    return Math.round((vence.getTime() - hoy.getTime()) / 86400000);
  }

  etiquetaVencimiento(item: any): string {
    const dias = this.diasParaVencer(item);
    if (dias === null)  return '';
    if (dias < 0)       return 'Vencido';
    if (dias === 0)     return 'Vence hoy';
    if (dias === 1)     return 'Vence mañana';
    return `${dias}d`;
  }

  claseVencimiento(item: any): string {
    const dias = this.diasParaVencer(item);
    if (dias === null) return '';
    if (dias <= 0)     return 'vence-critico';
    if (dias <= this.diasVencimientoAlerta) return 'vence-proximo';
    return 'vence-ok';
  }

  esBajoStock(item: any): boolean {
    return item.stock_actual <= item.stock_minimo;
  }

  esProximoAVencer(item: any): boolean {
    const dias = this.diasParaVencer(item);
    return dias !== null && dias <= this.diasVencimientoAlerta;
  }

  get productosFiltrados(): any[] {
    return this.stockProductos.filter(p => this.pasaFiltro(p));
  }

  get ingredientesFiltrados(): any[] {
    return this.stockIngredientes.filter(i => this.pasaFiltro(i));
  }

  private pasaFiltro(item: any): boolean {
    if (this.filtroStock === 'bajo')        return this.esBajoStock(item);
    if (this.filtroStock === 'vencimiento') return this.esProximoAVencer(item);
    return true;
  }

  get contadorAlertas(): number {
    const bajosP = this.stockProductos.filter(p => this.esBajoStock(p) || this.esProximoAVencer(p)).length;
    const bajosI = this.stockIngredientes.filter(i => this.esBajoStock(i) || this.esProximoAVencer(i)).length;
    return bajosP + bajosI;
  }

  abrirEdicion(item: any, tipo: 'producto' | 'ingrediente') {
    this.editandoId   = `${tipo}-${item.id}`;
    this.editandoTipo = tipo;
    this.editForm = {
      stock_actual:       item.stock_actual,
      stock_minimo:       item.stock_minimo,
      precio:            item.precio,
      fecha_vencimiento:  item.fecha_vencimiento
        ? new Date(item.fecha_vencimiento).toISOString().slice(0, 10)
        : ''
    };
  }

  cerrarEdicion() {
    this.editandoId   = null;
    this.editandoTipo = null;
    this.editForm     = {};
  }

  guardando: boolean = false;

  async guardarEdicion(item: any) {
    const tipo = this.editandoTipo!;
    const url  = tipo === 'producto'
      ? `https://integrador-proy-1.onrender.com/stock-admin/producto/${item.id}`
      : `https://integrador-proy-1.onrender.com/stock-admin/ingrediente/${item.id}`;

    this.guardando = true;

    try {
      // Helper: hace el fetch y lanza error si la respuesta no es 2xx,
      // en vez de dejarlo pasar en silencio como antes.
      const peticion = async (peticionUrl: string, body: any) => {
        const res = await fetch(peticionUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const texto = await res.text().catch(() => '');
          throw new Error(`(${res.status}) ${peticionUrl} → ${texto || res.statusText}`);
        }
        return res;
      };

      await peticion(url, {
        stock_actual:      Number(this.editForm.stock_actual),
        stock_minimo:      Number(this.editForm.stock_minimo),
        fecha_vencimiento: this.editForm.fecha_vencimiento || null
      });

      if (tipo === 'producto' && this.editForm.precio != null && this.editForm.precio !== '') {
        await peticion(`https://integrador-proy-1.onrender.com/productos/${item.id}/precio`, {
          precio: Number(this.editForm.precio)
        });
      }

      this.cerrarEdicion();
      this.cargarStock();
    } catch (err: any) {
      console.error('Error guardando:', err);
      alert('No se pudo guardar el cambio.\n\n' + (err?.message || err));
    } finally {
      this.guardando = false;
      this.cdr.detectChanges();
    }
  }

  get pedidosHoy(): any[] {
    const hoy = new Date();
    const keyHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    return this.historialPedidos.filter(p => {
      const fecha = new Date(p.creado_en);
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      return key === keyHoy;
    });
  }

  get totalPedidosMostrados(): number {
    if (this.vistaActual === 'hoy')    return this.pedidosHoy.length;
    if (this.vistaActual === 'dia')    return (this.ventasPorDia || []).reduce((s, d) => s + Number(d.total_pedidos), 0);
    if (this.vistaActual === 'semana') return (this.ventasPorSemana || []).reduce((s, d) => s + Number(d.total_pedidos), 0);
    if (this.vistaActual === 'mes')    return (this.ventasPorMes || []).reduce((s, d) => s + Number(d.total_pedidos), 0);
    return this.historialPedidos.length;
  }

  get totalVentasMostradas(): number {
    if (this.vistaActual === 'hoy')    return this.pedidosHoy.reduce((s, p) => s + (p.total || 0), 0);
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
    fetch(`https://integrador-proy-1.onrender.com/pedidos/${id}`, { method: 'DELETE' })
      .then(() => {
        this.historialPedidos = this.historialPedidos.filter(p => p.id !== id);
        this.cargarVentasPorMes();
        this.cargarVentasPorDia();
        this.cargarVentasPorSemana();
        this.cdr.detectChanges();
      })
      .catch(err => console.error('Error:', err));
  }

  exportarExcel(mes: any) {
    this.reporte.generarReporteMes(
      this.historialPedidos,
      mes.mes_nombre,
      mes.mes
    );
  }

  logout() {
    this.auth.logout();
  }
}