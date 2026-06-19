import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../pedido';
import { Pedido, PedidoItem } from '../pedido';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-cajero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cajero.html',
  styleUrls: ['./cajero.css']
})
export class Cajero implements OnInit {
  constructor(
    private pedidoService: PedidoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  carrito: PedidoItem[] = [];
  ultimoPedidoId: number | null = null;
  categoriaSeleccionada = 'Hamburguesas';
  observacion = '';
  productoSeleccionado: PedidoItem | null = null;
  precioActual = 0;
  mostrarModal = false;
  mostrarPago = false;
  metodoPago: 'Efectivo' | 'Tarjeta' | 'Yape' = 'Efectivo';
  tamanos = ['Personal', 'Mediana', 'Grande'];
  tamanoSeleccionado = 'Personal';
  stockMap: { [producto_id: number]: number } = {};
  stockCargado = false;
  stockIngredientes: { [nombre: string]: number } = {}; 
  mostrarConfirmacion = false;
  mensajeConfirmacion = '';
  ultimoCarritoPagado: PedidoItem[] = [];
  ultimoMetodoPago: string = '';
  ultimoTotal: number = 0;
  ultimoTicketId: number = 0;

  productosCargados = false;

  ngOnInit() {
    this.cargarStock();
    this.cargarStockIngredientes();
    this.cargarProductos();
  }

  cargarStock() {
    fetch('https://integrador-proy-1.onrender.com/stock')
      .then(res => res.json())
      .then((data: any[]) => {
        const mapa: { [id: number]: number } = {};
        data.forEach(item => {
          mapa[item.id] = item.stock_actual;
        });
        this.stockMap = { ...mapa };
        this.stockCargado = true;
        this.cdr.detectChanges();
      })
      .catch(err => console.error('ERROR STOCK:', err));
  }

  cargarStockIngredientes() {
    fetch('https://integrador-proy-1.onrender.com/stock-ingredientes')
      .then(res => res.json())
      .then((data: any[]) => {
        const mapa: { [nombre: string]: number } = {};
        data.forEach(item => {
          mapa[item.nombre] = item.stock_actual;
        });
        this.stockIngredientes = { ...mapa };
        this.cdr.detectChanges();
      })
      .catch(err => console.error('Error stock ingredientes:', err));
  }

  tieneStockExtra(extra: string): boolean {
    const base = extra.replace(' extra', '').trim();
    const stock = this.stockIngredientes[base];
    if (stock === undefined) return true;
    return stock > 0;
  }

  esStockBajoExtra(extra: string): boolean {
    const base = extra.replace(' extra', '').trim();
    const stock = this.stockIngredientes[base];
    if (stock === undefined) return false;
    return stock > 0 && stock <= 5;
  }

  ingredientesExtra = [
    'Queso extra',
    'Tocino extra',
    'Cebolla extra',
    'Lechuga extra',
    'Tomate extra',
    'Salsa BBQ',
    'Huevo extra'
  ];

  extrasSeleccionados: string[] = [];

  categorias = [
    { nombre: 'Hamburguesas', color: '#6b3e26' },
    { nombre: 'Combos', color: '#d89b45' },
    { nombre: 'Bebidas', color: '#4a90e2' },
    { nombre: 'Complementos', color: '#4caf50' }
  ];

  productos: PedidoItem[] = [];

  cargarProductos() {
    fetch('https://integrador-proy-1.onrender.com/productos')
      .then(res => res.json())
      .then((data: any[]) => {
        this.productos = (data || []).map(p => ({
          producto_id: p.id,
          nombre: p.nombre,
          precio: Number(p.precio),
          categoria: p.categoria,
          color: this.colorPorCategoria(p.categoria)
        }));
        this.productosCargados = true;
        this.cdr.detectChanges();
      })
      .catch(err => console.error('Error cargando productos:', err));
  }

  colorPorCategoria(categoria: string): string {
    const cat = this.categorias.find(c => c.nombre === categoria);
    return cat ? cat.color : '#6b3e26';
  }

  get productosFiltrados() {
    return this.productos.filter(p => p.categoria === this.categoriaSeleccionada);
  }

  esBebidaOComplemento(): boolean {
    return (
      this.productoSeleccionado?.categoria === 'Bebidas' ||
      this.productoSeleccionado?.categoria === 'Complementos'
    );
  }

  agregar(producto: PedidoItem) {
    this.productoSeleccionado = producto;
    this.precioActual = producto.precio;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.productoSeleccionado = null;
    this.extrasSeleccionados = [];
    this.observacion = '';
    this.tamanoSeleccionado = 'Personal';
  }

  confirmarProducto() {
    if (!this.productoSeleccionado) return;

    let precioFinal = this.productoSeleccionado.precio;
    if (this.tamanoSeleccionado === 'Mediana') precioFinal += 3;
    if (this.tamanoSeleccionado === 'Grande')  precioFinal += 6;
    precioFinal += this.extrasSeleccionados.length * 2;

    this.carrito.push({
      ...this.productoSeleccionado,
      producto_id: this.productoSeleccionado.producto_id,
      tamano: this.tamanoSeleccionado,
      extras: [...this.extrasSeleccionados],
      observacion: this.observacion,
      precio: precioFinal
    });

    this.cerrarModal();
  }

  toggleExtra(extra: string) {
    if (this.extrasSeleccionados.includes(extra)) {
      this.extrasSeleccionados = this.extrasSeleccionados.filter(e => e !== extra);
    } else {
      this.extrasSeleccionados.push(extra);
    }
    this.actualizarPrecio();
  }

  seleccionarTamano(tamano: string) {
    this.tamanoSeleccionado = tamano;
    this.actualizarPrecio();
  }

  actualizarPrecio() {
    if (!this.productoSeleccionado) return;
    let precio = this.productoSeleccionado.precio;
    if (this.tamanoSeleccionado === 'Mediana') precio += 3;
    if (this.tamanoSeleccionado === 'Grande')  precio += 6;
    precio += this.extrasSeleccionados.length * 2;
    this.precioActual = precio;
  }

  eliminar(index: number) {
    this.carrito.splice(index, 1);
  }

  get total(): number {
    return this.carrito.reduce((sum, item) => sum + item.precio, 0);
  }

  abrirPago() {
    if (this.carrito.length === 0) return;
    this.mostrarPago = true;
  }

  

  procesarPago() {
    if (this.carrito.length === 0) return;
    this.ejecutarPago();
  }

  ejecutarPago() {
    this.ultimoCarritoPagado = [...this.carrito];
    this.ultimoMetodoPago = this.metodoPago;
    this.ultimoTotal = this.total;

    const idGenerado = this.pedidoService.agregarPedido(
      [...this.carrito],
      this.metodoPago,
      this.total
    );
    this.ultimoPedidoId = idGenerado;
    this.ultimoTicketId = idGenerado;

    const extrasUsados: string[] = [];
    this.carrito.forEach(item => {
      if (item.extras && item.extras.length > 0) {
        extrasUsados.push(...item.extras);
      }
    });

    if (extrasUsados.length > 0) {
      fetch('https://integrador-proy-1.onrender.com/stock-ingredientes/descontar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombres: extrasUsados })
      });
    }

    this.carrito = [];
    this.mostrarPago = false;

    setTimeout(() => {
      this.cargarStock();
      this.cargarStockIngredientes();
    }, 500);

    setTimeout(() => {
      this.mensajeConfirmacion = 'Pago realizado correctamente\ny enviado a cocina';
      this.mostrarConfirmacion = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.mostrarConfirmacion = false;
        this.cdr.detectChanges();
      }, 2500);
    }, 100);
  }

  cancelarUltimoPedido() {
    if (!this.ultimoPedidoId) {
      this.mensajeConfirmacion = 'No hay pedido reciente\npara cancelar.';
      this.mostrarConfirmacion = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.mostrarConfirmacion = false;
        this.cdr.detectChanges();
      }, 2500);
      return;
    }
    const confirmar = confirm('¿Cancelar y eliminar permanentemente el último pedido?');
    if (!confirmar) return;
    fetch(`https://integrador-proy-1.onrender.com/pedidos/${this.ultimoPedidoId}`, { method: 'DELETE' })
      .then(() => {
        this.ultimoPedidoId = null;
        setTimeout(() => {
          this.cargarStock();
          this.cargarStockIngredientes();
        }, 500);
        this.mensajeConfirmacion = 'Pedido cancelado.\nEl stock fue recuperado.';
        this.mostrarConfirmacion = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.mostrarConfirmacion = false;
          this.cdr.detectChanges();
        }, 2500);
      })
      .catch(err => console.error('Error al cancelar:', err));
  }

  generarBoleta() {
    const doc = new jsPDF({ unit: 'mm', format: [80, 220] });
    const ticketNum = this.ultimoTicketId.toString().slice(-4);
    const fecha = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora  = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    // ── HEADER MARRÓN ────────────────────────────────────────────
    doc.setFillColor(75, 37, 15);
    doc.rect(0, 0, 80, 36, 'F');

    doc.setTextColor(216, 155, 69);          // dorado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CAPITAN', 40, 13, { align: 'center' });

    doc.setTextColor(253, 246, 236);         // crema
    doc.setFontSize(18);
    doc.text('BURGER', 40, 24, { align: 'center' });

    doc.setTextColor(180, 140, 90);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('RUC: 20123456789', 40, 32, { align: 'center' });

    // ── LÍNEA DORADA ─────────────────────────────────────────────
    doc.setDrawColor(216, 155, 69);
    doc.setLineWidth(0.6);
    doc.line(5, 38, 75, 38);

    // ── TICKET # y FECHA ─────────────────────────────────────────
    let y = 46;
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ticket #${ticketNum}`, 5, y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`${fecha}  ${hora}`, 75, y, { align: 'right' });
    y += 7;

    // ── BADGE MÉTODO DE PAGO ──────────────────────────────────────
    const pagoColors: Record<string, [number, number, number]> = {
      Efectivo: [34, 139, 34],
      Tarjeta:  [26, 82, 118],
      Yape:     [108, 52, 131],
    };
    const [pr, pg, pb] = pagoColors[this.ultimoMetodoPago] ?? [80, 80, 80];
    doc.setFillColor(pr, pg, pb);
    doc.roundedRect(5, y - 4, 28, 6, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(this.ultimoMetodoPago, 19, y, { align: 'center' });
    y += 8;

    // ── LÍNEA PUNTEADA ────────────────────────────────────────────
    doc.setDrawColor(200, 180, 150);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1, 1.5], 0);
    doc.line(5, y, 75, y);
    doc.setLineDashPattern([], 0);
    y += 6;

    // ── ITEMS ─────────────────────────────────────────────────────
    this.ultimoCarritoPagado.forEach(item => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      const nombre = item.nombre.length > 24 ? item.nombre.slice(0, 24) + '...' : item.nombre;
      doc.text(nombre, 5, y);
      doc.setTextColor(75, 37, 15);
      doc.text(`S/ ${item.precio.toFixed(2)}`, 75, y, { align: 'right' });
      y += 5;

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);

      if (item.tamano) {
        doc.text(`  Tamano: ${item.tamano}`, 5, y);
        y += 4;
      }
      if (item.extras && item.extras.length > 0) {
        const lines = doc.splitTextToSize(`  Extras: ${item.extras.join(', ')}`, 68);
        doc.text(lines, 5, y);
        y += lines.length * 4;
      }
      if (item.observacion) {
        const lines = doc.splitTextToSize(`  Obs: ${item.observacion}`, 68);
        doc.text(lines, 5, y);
        y += lines.length * 4;
      }
      y += 2;
    });

    // ── SEPARADOR DORADO ─────────────────────────────────────────
    doc.setDrawColor(216, 155, 69);
    doc.setLineWidth(0.5);
    doc.line(5, y, 75, y);
    y += 7;

    // ── TOTAL ─────────────────────────────────────────────────────
    doc.setFillColor(75, 37, 15);
    doc.roundedRect(5, y - 5, 70, 12, 2, 2, 'F');
    doc.setTextColor(216, 155, 69);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', 12, y + 3);
    doc.setTextColor(253, 246, 236);
    doc.text(`S/ ${this.ultimoTotal.toFixed(2)}`, 71, y + 3, { align: 'right' });
    y += 18;

    // ── PIE ───────────────────────────────────────────────────────
    doc.setTextColor(130, 100, 70);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Gracias por su preferencia!', 40, y, { align: 'center' });
    y += 5;
    doc.text('Vuelva pronto!', 40, y, { align: 'center' });

    doc.save(`boleta-${ticketNum}.pdf`);
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }
}