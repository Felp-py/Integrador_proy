import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SocketService } from '../socket'; // 👈 NUEVO

interface Item {
  nombre: string;
  precio: number;
}

@Component({
  selector: 'app-cajero',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cajero.html',
  styleUrls: ['./cajero.css']
})
export class Cajero {

  constructor(private socket: SocketService) {} // 👈 CAMBIO

  carrito: Item[] = [];

  productos: Item[] = [
    { nombre: 'Pizza Pepperoni', precio: 25 },
    { nombre: 'Pizza Hawaiana', precio: 28 },
    { nombre: 'Combo Cheddar', precio: 30 },
    { nombre: 'Papabox', precio: 20 },
    { nombre: 'Rolls Cheddar', precio: 15 },
    { nombre: 'Bebida', precio: 5 }
  ];

  agregar(item: Item) {
    this.carrito.push(item);
  }

  eliminar(index: number) {
    this.carrito.splice(index, 1);
  }

  get total() {
    return this.carrito.reduce((sum, i) => sum + i.precio, 0);
  }

  confirmarPedido() {
    if (this.carrito.length === 0) return;

    const nombrePedido = this.carrito.map(i => i.nombre).join(', ');

    // 🔥 ENVÍO REAL AL SERVIDOR
    this.socket.enviarPedido({
      id: Date.now(),
      nombre: nombrePedido,
      estado: 'pendiente'
    });

    alert('Pedido enviado a cocina 🍔');
    this.carrito = [];
  }
}