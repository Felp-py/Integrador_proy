import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000');

    this.socket.on('connect', () => {
      console.log('Conectado al socket');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado');
    });
  }

  escucharPedidos(): Observable<any> {
    return new Observable(observer => {

      this.socket.on('pedidosActualizados', (data) => {
        console.log('evento recibido en service:', data);
        observer.next(data);
      });

    });
  }

  enviarPedido(pedido: any) {
    console.log('enviando pedido:', pedido);
    this.socket.emit('nuevoPedido', pedido);
  }

  actualizarPedidos(pedidos: any[]) {
    this.socket.emit('actualizarPedidos', pedidos);
  }
}