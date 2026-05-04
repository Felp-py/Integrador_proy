import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Pedido {
  id: number;
  numero: number;
  nombre: string;
  estado: 'pendiente' | 'preparacion' | 'listo';
}

@Component({
  selector: 'app-integrador-display',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './integrador-display.html',
  styleUrls: ['./integrador-display.css']
})
export class IntegradorDisplay implements OnInit {

  pedidos: Pedido[] = [];
  historial: Pedido[] = [];

  contador = 0;
  fechaActual = '';
  mostrarHistorial = false;

  ngOnInit() {
    setInterval(() => {
      this.fechaActual = new Date().toLocaleString();
    }, 1000);
  }

  constructor() {
    this.cargarDemo();
  }

  cargarDemo() {
    for (let i = 0; i < 6; i++) {
      this.agregarPedido();
    }
  }

  agregarPedido() {
    this.contador++;

    this.pedidos.push({
      id: Date.now(),
      numero: this.contador,
      nombre: 'Pedido ' + this.contador,
      estado: 'pendiente'
    });
  }

  cambiarEstado(numero: number) {
    const pedido = this.pedidos.find(p => p.numero === numero);

    if (!pedido) return;

    if (pedido.estado === 'pendiente') {
      pedido.estado = 'preparacion';
    } else if (pedido.estado === 'preparacion') {
      pedido.estado = 'listo';
    } else {
      this.eliminarPedido(numero);
    }
  }

  eliminarPedido(numero: number) {
    const index = this.pedidos.findIndex(p => p.numero === numero);

    if (index !== -1) {
      const eliminado = this.pedidos[index];

      this.historial.unshift(eliminado);

      if (this.historial.length > 10) {
        this.historial.pop();
      }

      this.pedidos.splice(index, 1);
    }
  }

  recuperarPedido(index: number) {
    const pedido = this.historial[index];

    if (pedido) {
      this.pedidos.unshift(pedido);
      this.historial.splice(index, 1);
    }
  }

  get columnas() {
    const cols: Pedido[][] = [[], [], [], []];

    this.pedidos.forEach((p, i) => {
      cols[i % 4].push(p);
    });

    return cols;
  }
}