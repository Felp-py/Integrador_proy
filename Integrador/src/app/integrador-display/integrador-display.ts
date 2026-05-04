import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Pedido {
  id: number;
  numero: number;
  nombre: string;
  estado: 'pendiente' | 'preparacion' | 'listo';
}

@Component({
  selector: 'app-integrador-display',
  standalone: true,
  imports: [CommonModule], 
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
      const now = new Date();
      this.fechaActual = now.toLocaleString();
    }, 1000);
  }

  constructor() {
    this.Cargar();
  }

  Cargar() {
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

    if(!pedido) return;

    if(pedido.estado === 'pendiente') {
      pedido.estado = 'preparacion';
    }
    else if(pedido.estado === 'preparacion') {
      pedido.estado = 'listo';
    }
    else {
      this.eliminarPedido(numero);
    }
  }

  eliminarPedido(numero: number) {
    const pedidoEliminado = this.pedidos.findIndex(p => p.numero === numero);

    if (pedidoEliminado !== -1) {
      const eliminado = this.pedidos[pedidoEliminado];

      this.historial.unshift(eliminado); 

      if (this.historial.length > 10) {
        this.historial.pop(); 
      }

      this.pedidos.splice(pedidoEliminado, 1);
    }
  }

  recuperarPedido(index: number) {
    const pedido = this.historial[index];

    if (pedido) {
      this.pedidos.unshift(pedido); 
      this.historial.splice(index, 1);
      this.reordenar();
    }
  }

  reordenar() {
    this.pedidos.forEach((p, index) => {
      p.numero = index;
    });
  }

  get columnas() {
    const cols: Pedido[][] = [[], [], [], []];

    this.pedidos.forEach((pedido, index) => {
      cols[index % 4].push(pedido);
    });

    return cols;
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    console.log('tecla:', event.key);

    if (event.key === 'r' || event.key === 'R') {
      this.mostrarHistorial = !this.mostrarHistorial;
      return;
    }

    if (event.key === 'a' || event.key === 'A') {
      this.agregarPedido();
      return;
    }

    const num = parseInt(event.key);

    if (!isNaN(num)) {

      if (this.mostrarHistorial) {
        this.recuperarPedido(num);
      } 

      else {
        this.cambiarEstado(num);
      }
    }
  }
}