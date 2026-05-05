const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

let contador = 0;
let pedidos = [];

io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado');

  socket.onAny((event, data) => {
    console.log('📡 Evento recibido:', event, data);
  });

  socket.emit('pedidosActualizados', pedidos);

  socket.on('nuevoPedido', (pedido) => {
    pedido.numero = contador++;
    pedidos.push(pedido);
    io.emit('pedidosActualizados', pedidos);
  });

  socket.on('actualizarPedidos', (data) => {
    pedidos = data;
    io.emit('pedidosActualizados', pedidos);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado');
  });
});

// 🔥 ESTE ES EL FIX
server.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});