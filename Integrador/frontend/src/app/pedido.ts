import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from './socket'; // <-- Importamos el socket aquí

export interface PedidoItem {
  producto_id?: number;
  nombre: string; // cambio
  precio: number;
  categoria: string;
  color: string;
  tamano?: string;      // Opcional de nuevo
  extras?: string[];    // Opcional de nuevo
  observacion?: string; // Opcional de nuevo
}

export interface Pedido {
  id: number;
  numero: number;
  items: PedidoItem[];
  estado: 'pendiente' | 'preparacion' | 'listo' | 'entregado';
  pago: 'Efectivo' | 'Tarjeta' | 'Yape';
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private pedidos: Pedido[] = [];
  private pedidosSubject = new BehaviorSubject<Pedido[]>([]);
  pedidos$ = this.pedidosSubject.asObservable();
  contador = 0;

  constructor(private socket: SocketService) {
    // 🟢 Nos conectamos al socket inmediatamente para actualizar nuestro BehaviorSubject
    this.socket.escucharPedidos().subscribe((pedidosDesdeServidor) => {
      this.pedidos = pedidosDesdeServidor;
      this.pedidosSubject.next(this.pedidos);
    });
  }

  agregarPedido(items: PedidoItem[], pago: 'Efectivo' | 'Tarjeta' | 'Yape', total: number) {
    this.contador++;

    const nuevo: Pedido = {
      id: Date.now(),
      numero: this.contador,
      items,
      estado: 'pendiente',
      pago,
      total
    };

    // En lugar de pushear localmente, se lo enviamos al servidor por el socket.
    // El servidor responderá a todos con la lista actualizada y el constructor de arriba lo recibirá.
    this.socket.enviarPedido(nuevo);
  }

  // Método por si el cajero/cocina actualiza de forma masiva (ej. reordenar o limpiar)
  actualizarPedidos(pedidos: Pedido[]) {
    this.socket.actualizarPedidos(pedidos);
  }
}