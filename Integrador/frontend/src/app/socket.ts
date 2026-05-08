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

    // DEBUG: ver conexión
    this.socket.on('connect', () => {
      console.log('Conectado al socket');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado');
    });
  }

  //ESCUCHAR EVENTO CORRECTO
  escucharPedidos(): Observable<any> {
    return new Observable(observer => {

      this.socket.on('pedidosActualizados', (data) => {
        console.log('evento recibido en service:', data);
        observer.next(data);
      });

    });
  }

  // ENVIAR PEDIDO
  enviarPedido(pedido: any) {
    console.log('enviando pedido:', pedido);
    this.socket.emit('nuevoPedido', pedido);
  }

  // ACTUALIZAR
  actualizarPedidos(pedidos: any[]) {
    this.socket.emit('actualizarPedidos', pedidos);
  }
}