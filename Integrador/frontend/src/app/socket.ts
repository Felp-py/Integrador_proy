import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { Pedido } from './pedido';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: Socket;

  constructor() {

    this.socket = io('http://localhost:3000');

    this.socket.on('connect', () => {
      console.log('🟢 Conectado al socket');
    });

    this.socket.on('disconnect', () => {
      console.log('🔴 Desconectado');
    });

  }

  escucharPedidos(): Observable<Pedido[]> {

    return new Observable(observer => {

      this.socket.on(
        'pedidosActualizados',
        (data: Pedido[]) => {

          console.log(
            '📦 evento recibido:',
            data
          );

          observer.next(data);

        }
      );

    });

  }

  enviarPedido(pedido: Pedido) {

    console.log(
      '📤 enviando pedido:',
      pedido
    );

    this.socket.emit(
      'nuevoPedido',
      pedido
    );

  }

  actualizarPedidos(pedidos: Pedido[]) {
    this.socket.emit(
      'actualizarPedidos',
      pedidos
    );
  }
}