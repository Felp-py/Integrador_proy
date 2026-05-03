import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Pedido {
  id: number;
  numero: number;
  nombre: string;
}

@Component({
  selector: 'app-integrador-display',
  standalone: true, // 👈 FALTABA
  imports: [CommonModule], // 👈 AQUÍ EL FIX
  templateUrl: './integrador-display.html',
  styleUrls: ['./integrador-display.css'] // 👈 también corregido (plural)
})
export class IntegradorDisplay implements OnInit {

  pedidos: Pedido[] = [];
  contador = 0;
  fechaActual = '';
  historial: Pedido[] = []; // 👈 pila
  mostrarHistorial = false;

  ngOnInit() {
    setInterval(() => {
      const now = new Date();
      this.fechaActual = now.toLocaleString();
    }, 1000);
  }

  constructor() {
    for (let i = 0; i < 8; i++) {
      this.agregarPedido();
    }
  }

  agregarPedido() {
    console.log('agregando pedido');

    this.pedidos.push({
      id: Date.now(),
      numero: this.contador,
      nombre: 'Pedido ' + this.contador
    });
    this.contador++;
    this.reordenar();
  }

  eliminarPedido(numero: number) {
  const pedidoEliminado = this.pedidos.find(p => p.numero === numero);

  if (pedidoEliminado) {
    this.historial.unshift(pedidoEliminado); // 👈 pila (último arriba)

    if (this.historial.length > 10) {
      this.historial.pop(); // máximo 10
    }
  }

  this.pedidos = this.pedidos.filter(p => p.numero !== numero);
  this.reordenar();
}
recuperarPedido(index: number) {
  if (index >= this.historial.length) return;

  const pedido = this.historial[index];

  if (pedido) {
    this.pedidos.unshift(pedido); // vuelve al inicio
    this.historial.splice(index, 1);
    this.reordenar();
  }
}

  reordenar() {
    this.pedidos.forEach((p, index) => {
      p.numero = index;
    });
  }

  @HostListener('window:keydown', ['$event'])
handleKey(event: KeyboardEvent) {
  console.log('tecla:', event.key);

  // 🔴 Botón rojo (R)
  if (event.key === 'r' || event.key === 'R') {
    this.mostrarHistorial = !this.mostrarHistorial;
    return;
  }

  // ➕ Agregar pedido
  if (event.key === 'a' || event.key === 'A') {
    this.agregarPedido();
    return;
  }

  const num = parseInt(event.key);

  if (!isNaN(num)) {

    // 🔵 Si popup abierto → RECUPERAR
    if (this.mostrarHistorial) {
      this.recuperarPedido(num);
    } 
    // 🟢 Si no → ELIMINAR
    else {
      this.eliminarPedido(num);
    }
  }
}
get columnas() {
  const cols = [[], [], [], []] as Pedido[][];
  this.pedidos.forEach((pedido, i) => {
    cols[i % 4].push(pedido);
  });
  return cols;
}
}