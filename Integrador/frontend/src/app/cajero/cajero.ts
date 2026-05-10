import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../socket'; 

interface Item {
  nombre: string;
  precio: number;
  categoria: string;
  color: string;
}

@Component({
  selector: 'app-cajero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cajero.html',
  styleUrls: ['./cajero.css']
})
export class Cajero {

  constructor(private socket: SocketService) {}

  carrito: any[] = [];
  categoriaSeleccionada = 'Hamburguesas';
  observacion = '';

  productoSeleccionado: Item | null = null;
  mostrarModal = false;

  tamanos = ['Personal', 'Mediana', 'Grande'];
  tamanoSeleccionado = 'Personal';

  ingredientesExtra = [
    'Queso extra',
    'Tocino extra',
    'Cebolla extra',
    'Lechuga extra',
    'Tomate extra',
    'Salsa BQQ',
    'Huevo extra'
  ];

  extrasSeleccionados: string[] = [];

  categorias = [
    { nombre: 'Hamburguesas', color: '#6b3e26' },
    { nombre: 'Combos', color: '#d89b45' },
    { nombre: 'Bebidas', color: '#4a90e2' },
    { nombre: 'Complementos', color: '#4caf50' }
  ];
  
  productos: Item[] = [
    { nombre: 'Cheddar Burger', precio: 18, categoria: 'Hamburguesas', color: '#6B3E26' },
    { nombre: 'Royal Burger', precio: 22, categoria: 'Hamburguesas', color: '#6B3E26' },
    { nombre: 'Doble Carne', precio: 25, categoria: 'Hamburguesas', color: '#6B3E26' },
    { nombre: 'BBQ Burger', precio: 24, categoria: 'Hamburguesas', color: '#6B3E26' },
    { nombre: 'Burger Jalapeño', precio: 26, categoria: 'Hamburguesas', color: '#6B3E26' },
    { nombre: 'Cheese Bacon', precio: 27, categoria: 'Hamburguesas', color: '#6B3E26' },
    { nombre: 'Combo Cheddar', precio: 32, categoria: 'Combos', color: '#D89B45' },
    { nombre: 'Combo Royal', precio: 35, categoria: 'Combos', color: '#D89B45' },
    { nombre: 'Mega Combo', precio: 40, categoria: 'Combos', color: '#D89B45' },
    { nombre: 'Combo Familiar', precio: 55, categoria: 'Combos', color: '#D89B45' },
    { nombre: 'Coca Cola', precio: 5, categoria: 'Bebidas', color: '#4A90E2' },
    { nombre: 'Inca Kola', precio: 5, categoria: 'Bebidas', color: '#4A90E2' },
    { nombre: 'Sprite', precio: 5, categoria: 'Bebidas', color: '#4A90E2' },
    { nombre: 'Fanta', precio: 5, categoria: 'Bebidas', color: '#4A90E2' },
    { nombre: 'Milkshake', precio: 12, categoria: 'Bebidas', color: '#4A90E2' },
    { nombre: 'Papas Fritas', precio: 8, categoria: 'Complementos', color: '#4CAF50' },
    { nombre: 'Nuggets', precio: 10, categoria: 'Complementos', color: '#4CAF50' },
    { nombre: 'Aros de Cebolla', precio: 9, categoria: 'Complementos', color: '#4CAF50' },
    { nombre: 'Alitas BBQ', precio: 15, categoria: 'Complementos', color: '#4CAF50' },
    { nombre: 'Papas Cheddar', precio: 14, categoria: 'Complementos', color: '#4CAF50' }
  ];

  get productosFiltrados() {
    return this.productos.filter(
      producto => producto.categoria === this.categoriaSeleccionada
    );
  }

  esBebidaOComplemento(): boolean {
    return (
      this.productoSeleccionado?.categoria === 'Bebidas' ||
      this.productoSeleccionado?.categoria === 'Complementos'
    );
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.productoSeleccionado = null;
    this.extrasSeleccionados = [];
    this.observacion = '';
    this.tamanoSeleccionado = 'Personal';
  }

  agregar(producto: Item) {
    this.productoSeleccionado = producto;
    this.mostrarModal = true;
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

    precioFinal += this.extrasSeleccionados.length * 2;
    this.carrito.push({
      ...this.productoSeleccionado,
      tamano: this.tamanoSeleccionado,
      extras: [...this.extrasSeleccionados],
      observacion: this.observacion,
      precio: precioFinal
    });

    this.productoSeleccionado = null;
    this.mostrarModal = false;
    this.extrasSeleccionados = [];
    this.observacion = '';
    this.tamanoSeleccionado = 'Personal';
  }
  

  toggleExtra(extra: string) {
    if (this.extrasSeleccionados.includes(extra)) {
      this.extrasSeleccionados = this.extrasSeleccionados.filter(e => e !== extra);
    } else {
      this.extrasSeleccionados.push(extra);
    }
  }

  eliminar(index: number) {
    this.carrito.splice(index, 1);
  }

  get total() {
    return this.carrito.reduce((sum, i) => sum + i.precio, 0);
  }

  confirmarPedido() {
    if (this.carrito.length === 0) return;

    this.socket.enviarPedido({
      id: Date.now(),
      items: [...this.carrito],
      estado: 'pendiente'
    });

    this.carrito = [];
  }
}