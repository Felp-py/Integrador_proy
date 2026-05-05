import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core'; // 👈 Added ChangeDetectorRef
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
    private cdr: ChangeDetectorRef // 👈 Inject this
  ) {}

  pedidos: any[] = [];
  columnas: any[][] = [[], [], [], []];
  fechaActual = '';

   @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Check if the key pressed is a number between 0 and 9
    const key = event.key;
    if (key >= '0' && key <= '9') {
      const index = parseInt(key, 10);
      this.cambiarEstado(index);
    }}

  ngOnInit() {
    // 1. Fixed Clock: No need for runOutsideAngular for a basic display
    this.actualizarReloj();
    setInterval(() => {
      this.actualizarReloj();
    }, 1000);

    // 2. Fixed Socket: Force Angular to "see" the new data
    this.socket.escucharPedidos().subscribe((data: any) => {
      console.log('📡 Pedidos recibidos:', data);
      this.pedidos = data;
      this.actualizarColumnas();
      
      // 🔥 This tells Angular: "Hey, data changed, redraw the screen NOW"
      this.cdr.detectChanges(); 
    });
  }

  actualizarReloj() {
    this.fechaActual = new Date().toLocaleString();
    this.cdr.detectChanges(); // Ensures the clock ticks every second
  }

  actualizarColumnas() {
    const cols: any[][] = [[], [], [], []];
    this.pedidos.forEach((p, i) => {
      // We store the original index so the buttons still work correctly
      cols[i % 4].push({ ...p, originalIndex: i });
    });
    this.columnas = cols;
  }

  // Update your HTML button to use p.originalIndex
 cambiarEstado(index: number) {
    const pedido = this.pedidos[index];
    if (!pedido) return; // If I press '5' but there are only 3 orders, do nothing.

    if (pedido.estado === 'pendiente') {
      pedido.estado = 'preparacion';
    } else if (pedido.estado === 'preparacion') {
      pedido.estado = 'listo';
    } else {
      this.pedidos.splice(index, 1);
    }

    this.socket.actualizarPedidos(this.pedidos);
    this.actualizarColumnas();
    this.cdr.detectChanges();
  }
}