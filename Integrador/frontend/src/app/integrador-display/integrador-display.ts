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
    const cols: any[][] = [[], [], [], []];

    const pedidosVisibles = this.pedidos.filter(
      p => p.estado !== 'entregado'
    );

    pedidosVisibles.forEach((pedido, index) => {
      cols[index % 4].push({
        ...pedido,
        originalIndex: index
      });
    });
    this.columnas = cols;
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
    }
    else if (pedido.estado === 'preparacion') {
      pedido.estado = 'listo';
    }
    else if (pedido.estado === 'listo') {
      pedido.estado = 'entregado';
    }
    this.socket.actualizarPedidos(this.pedidos);
    this.actualizarColumnas();
    this.cdr.detectChanges();
  }
  
}