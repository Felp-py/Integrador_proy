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

  // ⌨️ KEYBOARD SHORTCUTS (Press 0-9 to advance orders instantly)
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return; // Ignore shortcut if the user is typing in an input field
    }
    const key = event.key;
    if (key >= '0' && key <= '9') {
      const index = parseInt(key, 10);
      this.cambiarEstado(index);
    }
  }

  ngOnInit() {
    this.actualizarReloj();
    setInterval(() => this.actualizarReloj(), 1000);

    // 📡 Socket listener receiving the new structured orders array
    this.socket.escucharPedidos().subscribe((data: any) => {
      console.log('📡 Pedidos actualizados en cocina:', data);
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
    this.pedidos.forEach((pedido, index) => {
      // Retain reference to original index for trackable button/keyboard interactions
      cols[index % 4].push({ ...pedido, originalIndex: index });
    });
    this.columnas = cols;
  }

  cambiarEstado(index: number) {
    const pedido = this.pedidos[index];
    if (!pedido) return;

    if (pedido.estado === 'pendiente') {
      pedido.estado = 'preparacion';
    } else if (pedido.estado === 'preparacion') {
      pedido.estado = 'listo';
    } else {
      this.pedidos.splice(index, 1); // Deliver / Clear order from board
    }

    this.socket.actualizarPedidos(this.pedidos);
    this.actualizarColumnas();
    this.cdr.detectChanges();
  }
}