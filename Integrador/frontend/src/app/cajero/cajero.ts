import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PedidoService } from '../pedido';
import { Pedido, PedidoItem } from '../pedido';

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
  stockIngredientes: { [nombre: string]: number } = {}; // ← agregado
  mostrarConfirmacion = false;
  mensajeConfirmacion = '';

  ngOnInit() {
    this.cargarStock();
    this.cargarStockIngredientes(); // ← agregado
  }

  cargarStock() {
    fetch('http://localhost:3000/stock')
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

  // ← método agregado
  cargarStockIngredientes() {
    fetch('http://localhost:3000/stock-ingredientes')
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

  productos: PedidoItem[] = [
    { producto_id: 1,  nombre: 'Cheddar Burger',  precio: 18, categoria: 'Hamburguesas', color: '#6B3E26' },
    { producto_id: 2,  nombre: 'Royal Burger',     precio: 22, categoria: 'Hamburguesas', color: '#6B3E26' },
    { producto_id: 3,  nombre: 'Doble Carne',      precio: 25, categoria: 'Hamburguesas', color: '#6B3E26' },
    { producto_id: 4,  nombre: 'BBQ Burger',       precio: 24, categoria: 'Hamburguesas', color: '#6B3E26' },
    { producto_id: 5,  nombre: 'Burger Jalapeño',  precio: 26, categoria: 'Hamburguesas', color: '#6B3E26' },
    { producto_id: 6,  nombre: 'Cheese Bacon',     precio: 27, categoria: 'Hamburguesas', color: '#6B3E26' },
    { producto_id: 7,  nombre: 'Combo Cheddar',    precio: 32, categoria: 'Combos',       color: '#D89B45' },
    { producto_id: 8,  nombre: 'Combo Royal',      precio: 35, categoria: 'Combos',       color: '#D89B45' },
    { producto_id: 9,  nombre: 'Mega Combo',       precio: 40, categoria: 'Combos',       color: '#D89B45' },
    { producto_id: 10, nombre: 'Combo Familiar',   precio: 55, categoria: 'Combos',       color: '#D89B45' },
    { producto_id: 11, nombre: 'Coca Cola',        precio: 5,  categoria: 'Bebidas',      color: '#4A90E2' },
    { producto_id: 12, nombre: 'Inca Kola',        precio: 5,  categoria: 'Bebidas',      color: '#4A90E2' },
    { producto_id: 13, nombre: 'Sprite',           precio: 5,  categoria: 'Bebidas',      color: '#4A90E2' },
    { producto_id: 14, nombre: 'Fanta',            precio: 5,  categoria: 'Bebidas',      color: '#4A90E2' },
    { producto_id: 15, nombre: 'Milkshake',        precio: 12, categoria: 'Bebidas',      color: '#4A90E2' },
    { producto_id: 16, nombre: 'Papas Fritas',     precio: 8,  categoria: 'Complementos', color: '#4CAF50' },
    { producto_id: 17, nombre: 'Nuggets',          precio: 10, categoria: 'Complementos', color: '#4CAF50' },
    { producto_id: 18, nombre: 'Aros de Cebolla',  precio: 9,  categoria: 'Complementos', color: '#4CAF50' },
    { producto_id: 19, nombre: 'Alitas BBQ',       precio: 15, categoria: 'Complementos', color: '#4CAF50' },
    { producto_id: 20, nombre: 'Papas Cheddar',    precio: 14, categoria: 'Complementos', color: '#4CAF50' },
  ];

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

    // ← captura el id real devuelto por el servicio
    const idGenerado = this.pedidoService.agregarPedido(
      [...this.carrito],
      this.metodoPago,
      this.total
    );
    this.ultimoPedidoId = idGenerado ?? null;

    const extrasUsados: string[] = [];
    this.carrito.forEach(item => {
      if (item.extras && item.extras.length > 0) {
        extrasUsados.push(...item.extras);
      }
    });

    if (extrasUsados.length > 0) {
      fetch('http://localhost:3000/stock-ingredientes/descontar', {
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

    this.mensajeConfirmacion = 'Pago realizado correctamente\ny enviado a cocina';
    this.mostrarConfirmacion = true;
    setTimeout(() => this.mostrarConfirmacion = false, 2500);
  }

  cancelarUltimoPedido() {
    if (!this.ultimoPedidoId) {
      this.mensajeConfirmacion = 'No hay pedido reciente\npara cancelar.';
      this.mostrarConfirmacion = true;
      setTimeout(() => this.mostrarConfirmacion = false, 2500);
      return;
    }

    const confirmar = confirm('¿Cancelar y eliminar permanentemente el último pedido?');
    if (!confirmar) return;

    fetch(`http://localhost:3000/pedidos/${this.ultimoPedidoId}`, { method: 'DELETE' })
      .then(() => {
        this.ultimoPedidoId = null;
        setTimeout(() => {
          this.cargarStock();
          this.cargarStockIngredientes();
        }, 500);
        this.mensajeConfirmacion = 'Pedido cancelado.\nEl stock fue recuperado.';
        this.mostrarConfirmacion = true;
        setTimeout(() => this.mostrarConfirmacion = false, 2500);
        this.cdr.detectChanges();
      })
      .catch(err => console.error('Error al cancelar:', err));
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }
}