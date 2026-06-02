import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from './socket';

export interface PedidoItem {
  producto_id: number;
  nombre: string;
  precio: number;
  categoria: string;
  color: string;
  tamano?: string;
  extras?: string[];
  observacion?: string;
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
    this.socket.escucharPedidos().subscribe((pedidosDesdeServidor) => {
      this.pedidos = pedidosDesdeServidor;
      this.pedidosSubject.next(this.pedidos);
    });
  }

  agregarPedido(items: PedidoItem[], pago: 'Efectivo' | 'Tarjeta' | 'Yape', total: number): number {
    this.contador++;
    const nuevoId = Date.now();
    const nuevo: Pedido = {
      id: nuevoId,
      numero: this.contador,
      items,
      estado: 'pendiente',
      pago,
      total
    };
    this.socket.enviarPedido(nuevo);
    return nuevoId; // ← devuelve el id real
  }

  actualizarPedidos(pedidos: Pedido[]) {
    this.socket.actualizarPedidos(pedidos);
  }
}