import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SocketService } from '../socket';

@Component({
  selector: 'app-integrador-display',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './integrador-display.html',
  styleUrls: ['./integrador-display.css']
})
export class IntegradorDisplay implements OnInit {

  constructor(
    private socket: SocketService,
    private cdr: ChangeDetectorRef
  ) {}

  pedidos: any[] = [];
  columnas: any[][] = [[], [], [], []];
  fechaActual = '';
  pedidosVisibles: any[] = [];
  pedidosEnEspera: number = 0;

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    const key = event.key;
    if (key >= '0' && key <= '9') {
      const index = parseInt(key, 10);
      this.cambiarEstado(index);
    }
    const teclas = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
    const idx = teclas.indexOf(key);
    if (idx !== -1) {
      this.cambiarEstado(idx + 10);
      return;
    }
  }

  ngOnInit() {
    this.actualizarReloj();
    setInterval(() => {
      this.actualizarReloj();
    }, 1000);

    this.socket.escucharPedidos().subscribe((data: any) => {
      console.log('Pedidos actualizados:', data);
      this.pedidos = data;
      this.actualizarColumnas();
      this.cdr.detectChanges();
    });
  }

  actualizarReloj() {
    this.fechaActual = new Date().toLocaleString();
    this.cdr.detectChanges();
  }

  actualizarColumnas() {
    const todosVisibles = this.pedidos.filter(
      p => p.estado !== 'entregado'
    );

    const enPantalla = todosVisibles.slice(0, 20);
    const enEspera = todosVisibles.slice(20);

    this.pedidosVisibles = enPantalla.map((pedido, index) => ({
      ...pedido,
      originalIndex: index
    }));

    this.pedidosEnEspera = enEspera.length;
    this.columnas = [this.pedidosVisibles];
    this.cdr.detectChanges();
  }

  cambiarEstado(index: number) {
    const pedidosVisibles = this.pedidos.filter(
      p => p.estado !== 'entregado'
    );
    const pedidoVisible = pedidosVisibles[index];
    if (!pedidoVisible) return;

    const pedido = this.pedidos.find(
      p => p.id === pedidoVisible.id
    );
    if (!pedido) return;

    if (pedido.estado === 'pendiente') {
      pedido.estado = 'preparacion';
    } else if (pedido.estado === 'preparacion') {
      pedido.estado = 'listo';
    } else if (pedido.estado === 'listo') {
      pedido.estado = 'entregado';
    }

    this.socket.actualizarPedidos(this.pedidos);
    this.actualizarColumnas();
    this.cdr.detectChanges();
  }
}


