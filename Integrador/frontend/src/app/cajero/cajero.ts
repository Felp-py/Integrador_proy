import { Component,  OnInit, ChangeDetectorRef } from '@angular/core';
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
  ) { }

  carrito: PedidoItem[] = [];
  ultimoPedidoId: number | null = null;
  categoriaSeleccionada = 'Hamburguesas';
  observacion = '';
  productoSeleccionado: PedidoItem | null = null;
  mostrarModal = false;
  mostrarPago = false;
  metodoPago: 'Efectivo' | 'Tarjeta' | 'Yape' = 'Efectivo';
  tamanos = ['Personal', 'Mediana', 'Grande'];
  tamanoSeleccionado = 'Personal';
  stockMap: { [producto_id: number]: number } = {};
  stockIngredientes: { [nombre: string]: number } = {};
  stockCargado = false;

  ngOnInit() {
    this.cargarStock();
    this.cargarStockIngredientes();
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
      .catch(err => console.error('Error cargando stock:', err));
  }

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
      .catch(err => console.error('Error cargando stock ingredientes:', err));
  }

  // Para saber si un extra tiene stock disponible
  tieneStockExtra(extra: string): boolean {
    const base = extra.replace(' extra', '').trim();
    const stock = this.stockIngredientes[base];
    if (stock === undefined) return true; 
    return stock > 0;
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

    // HAMBURGUESAS
    { producto_id: 1, nombre: 'Cheddar Burger', precio: 18, categoria: 'Hamburguesas', color: '#6B3E26' },
    { producto_id: 2, nombre: 'Royal Burger', precio: 22, categoria: 'Hamburguesas', color: '#6B3E26' },
    { producto_id: 3, nombre: 'Doble Carne', precio: 25, categoria: 'Hamburguesas', color: '#6B3E26' },
    { producto_id: 4, nombre: 'BBQ Burger', precio: 24, categoria: 'Hamburguesas', color: '#6B3E26' },
    { producto_id: 5, nombre: 'Burger Jalapeño', precio: 26, categoria: 'Hamburguesas', color: '#6B3E26' },
    { producto_id: 6, nombre: 'Cheese Bacon', precio: 27, categoria: 'Hamburguesas', color: '#6B3E26' },

    // COMBOS
    { producto_id: 7, nombre: 'Combo Cheddar', precio: 32, categoria: 'Combos', color: '#D89B45' },
    { producto_id: 8, nombre: 'Combo Royal', precio: 35, categoria: 'Combos', color: '#D89B45' },
    { producto_id: 9, nombre: 'Mega Combo', precio: 40, categoria: 'Combos', color: '#D89B45' },
    { producto_id: 10, nombre: 'Combo Familiar', precio: 55, categoria: 'Combos', color: '#D89B45' },

    // BEBIDAS
    { producto_id: 11, nombre: 'Coca Cola', precio: 5, categoria: 'Bebidas', color: '#4A90E2' },
    { producto_id: 12, nombre: 'Inca Kola', precio: 5, categoria: 'Bebidas', color: '#4A90E2' },
    { producto_id: 13, nombre: 'Sprite', precio: 5, categoria: 'Bebidas', color: '#4A90E2' },
    { producto_id: 14, nombre: 'Fanta', precio: 5, categoria: 'Bebidas', color: '#4A90E2' },
    { producto_id: 15, nombre: 'Milkshake', precio: 12, categoria: 'Bebidas', color: '#4A90E2' },

    // COMPLEMENTOS
    { producto_id: 16, nombre: 'Papas Fritas', precio: 8, categoria: 'Complementos', color: '#4CAF50' },
    { producto_id: 17, nombre: 'Nuggets', precio: 10, categoria: 'Complementos', color: '#4CAF50' },
    { producto_id: 18, nombre: 'Aros de Cebolla', precio: 9, categoria: 'Complementos', color: '#4CAF50' },
    { producto_id: 19, nombre: 'Alitas BBQ', precio: 15, categoria: 'Complementos', color: '#4CAF50' },
    { producto_id: 20, nombre: 'Papas Cheddar', precio: 14, categoria: 'Complementos', color: '#4CAF50' },

  ]

  get productosFiltrados() {
    return this.productos.filter(
      producto =>
        producto.categoria ===
        this.categoriaSeleccionada
    );
  }

  esBebidaOComplemento(): boolean {
    return (
      this.productoSeleccionado?.categoria === 'Bebidas' ||
      this.productoSeleccionado?.categoria === 'Complementos'
    );
  }

  agregar(producto: PedidoItem) {
    this.productoSeleccionado = producto;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.productoSeleccionado = null;
    this.extrasSeleccionados = [];
    this.observacion = '';
    this.tamanoSeleccionado = 'Personal';
  }

  get precioModalActual(): number {
    if (!this.productoSeleccionado) return 0;
    let precio = this.productoSeleccionado.precio;
    if (this.tamanoSeleccionado === 'Mediana') precio += 3;
    if (this.tamanoSeleccionado === 'Grande')  precio += 6;
    precio += this.extrasSeleccionados.length * 2;
    return precio;
  }

  confirmarProducto() {
    if (!this.productoSeleccionado) return;
    const precioFinal = this.precioModalActual; 
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
    if (
      this.extrasSeleccionados.includes(extra)
    ) {
      this.extrasSeleccionados =
        this.extrasSeleccionados.filter(
          e => e !== extra
        );
    } else {
      this.extrasSeleccionados.push(extra);
    }
  }

  eliminar(index: number) {
    this.carrito.splice(index, 1);
  }

  get total(): number {
    return this.carrito.reduce(
      (sum, item) => sum + item.precio,
      0
    );
  }

  abrirPago() {
    if (this.carrito.length === 0) return;
    this.mostrarPago = true;
  }

  procesarPago() {
    if (this.carrito.length === 0) return;

    this.ultimoPedidoId = this.pedidoService.agregarPedido(
      [...this.carrito],
      this.metodoPago,
      this.total
    );

    // Recolectar todos los extras usados en el pedido
    const extrasUsados: string[] = [];
    this.carrito.forEach(item => {
      if (item.extras && item.extras.length > 0) {
        extrasUsados.push(...item.extras);
      }
    });

    // Descontar del stock de ingredientes
    if (extrasUsados.length > 0) {
      fetch('http://localhost:3000/stock-ingredientes/descontar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombres: extrasUsados })
      }).then(() => this.cargarStockIngredientes());
    }

    this.carrito = [];
    this.mostrarPago = false;
    this.cargarStock();
    this.cargarStockIngredientes(); 
    alert('Pago realizado correctamente y enviado a cocina');
  }

  esStockBajoExtra(extra: string): boolean {
    const base = extra.replace(' extra', '').trim();
    const stock = this.stockIngredientes[base];
    if (stock === undefined) return false;
    return stock > 0 && stock <= 5; // naranja si está entre 1 y 5
  }

  cancelarUltimoPedido() {
    if (!this.ultimoPedidoId) {
      alert('No hay pedido reciente para cancelar.');
      return;
    }

    const confirmar = confirm('¿Cancelar y eliminar permanentemente el último pedido?');
    if (!confirmar) return;
    fetch(`http://localhost:3000/pedidos/${this.ultimoPedidoId}`, { method: 'DELETE' })
      .then(() => {
        alert('Pedido cancelado y eliminado permanentemente.');
        this.ultimoPedidoId = null;
        this.cargarStock();
        this.cdr.detectChanges();
      })
      .catch(err => console.error('Error al cancelar:', err));
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }
}
