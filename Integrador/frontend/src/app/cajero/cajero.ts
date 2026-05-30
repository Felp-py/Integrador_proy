import { Component,  OnInit } from '@angular/core';
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
    private pedidoService: PedidoService, // Inyectas PedidoService en vez de SocketService directamente
    private router: Router
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

  ngOnInit() {
    this.cargarStock();
  }

  cargarStock() {
    fetch('http://localhost:3000/stock')
      .then(res => res.json())
      .then((data: any[]) => {
        data.forEach(item => {
          this.stockMap[item.id] = item.stock_actual;
        });
      });
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

  confirmarProducto() {

    if (!this.productoSeleccionado) return;

    let precioFinal =
      this.productoSeleccionado.precio;

    if (this.tamanoSeleccionado === 'Mediana') {
      precioFinal += 3;
    }

    if (this.tamanoSeleccionado === 'Grande') {
      precioFinal += 6;
    }

    precioFinal +=
      this.extrasSeleccionados.length * 2;

    this.carrito.push({

      ...this.productoSeleccionado,

      producto_id: this.productoSeleccionado.producto_id, //cambio

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

    // El servicio se encarga de armar el ID, el número correlativo y disparar el Socket
    this.pedidoService.agregarPedido(
      [...this.carrito],
      this.metodoPago,
      this.total
    );

    this.ultimoPedidoId = Date.now();
    this.carrito = [];
    this.mostrarPago = false;
    alert('✅ Pago realizado correctamente y enviado a cocina');
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
        alert('✅ Pedido cancelado y eliminado permanentemente.');
        this.ultimoPedidoId = null;
      })
      .catch(err => console.error('Error al cancelar:', err));
  }


  volverLogin() {

    this.router.navigate(['/login']);

  }

}
