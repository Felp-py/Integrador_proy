import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PedidoService } from '../pedido'; // 👈 IMPORT CORRECTO

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

  constructor(private pedidoService: PedidoService) {} // 👈 SOLO UN CONSTRUCTOR

  pedidos: Pedido[] = [];
  historial: Pedido[] = [];

  fechaActual = '';
  mostrarHistorial = false;

  ngOnInit() {

    // 🕒 reloj
    setInterval(() => {
      this.fechaActual = new Date().toLocaleString();
    }, 1000);

    // 🔥 ESCUCHAR pedidos del cajero
    this.pedidoService.pedidos$.subscribe(pedidos => {
      this.pedidos = pedidos;
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
      return;
    }

    this.pedidoService.actualizarPedidos(this.pedidos); // 👈 sincronizar
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

      this.pedidoService.actualizarPedidos(this.pedidos); // 👈 sincronizar
    }
  }

  recuperarPedido(index: number) {
    const pedido = this.historial[index];

    if (pedido) {
      this.pedidos.unshift(pedido);
      this.historial.splice(index, 1);

      this.pedidoService.actualizarPedidos(this.pedidos); // 👈 sincronizar
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