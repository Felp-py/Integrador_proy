import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface Pedido {
  id: number;
  numero: number;
  nombre: string;
  estado: 'pendiente' | 'preparacion' | 'listo';
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  private pedidos: Pedido[] = [];
  private pedidosSubject = new BehaviorSubject<Pedido[]>([]);

  pedidos$ = this.pedidosSubject.asObservable();

  contador = 0;

  agregarPedido(nombre: string) {
    this.contador++;

    const nuevo: Pedido = {
      id: Date.now(),
      numero: this.contador,
      nombre,
      estado: 'pendiente'
    };

    this.pedidos.push(nuevo);
    this.pedidosSubject.next(this.pedidos);
  }

  actualizarPedidos(pedidos: Pedido[]) {
    this.pedidos = pedidos;
    this.pedidosSubject.next(this.pedidos);
  }
}