const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' }
});

// Conexión a MySQL
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '081806',
  database: 'capitan_burger',
  waitForConnections: true,
  connectionLimit: 10
});

db.getConnection()
  .then(() => console.log('MySQL conectado'))
  .catch(err => console.error('Error MySQL:', err.message));

// Estado en memoria
let contador = 0;
let pedidos = [];

async function cargarPedidosActivos() {
  try {
    const [rowsPedidos] = await db.query(
      "SELECT id, numero, estado, pago, CAST(total AS FLOAT) as total, creado_en FROM pedidos WHERE estado != 'entregado' ORDER BY creado_en ASC"
    );

    const pedidosReconstruidos = [];

    for (const pedido of rowsPedidos) {
      const [rowsItems] = await db.query(
        "SELECT nombre, CAST(precio AS FLOAT) as precio, tamano, extras, observacion FROM pedido_items WHERE pedido_id = ?",
        [pedido.id]
      );
      const itemsMap = rowsItems.map(item => ({
        ...item,
        extras: typeof item.extras === 'string' ? JSON.parse(item.extras) : (item.extras || [])
      }));

      pedidosReconstruidos.push({
        id: pedido.id,
        numero: pedido.numero,
        estado: pedido.estado,
        pago: pedido.pago,
        total: pedido.total,
        items: itemsMap
      });
    }

    pedidos = pedidosReconstruidos;

    if (pedidos.length > 0) {
      contador = Math.max(...pedidos.map(p => p.numero)) + 1;
    } else {
      contador = 1; 
    }
    console.log(`${pedidos.length} pedidos activos con sus ítems cargados desde MySQL`);
  } catch (err) {
    console.error('Error cargando pedidos al iniciar:', err.message);
  }
}

// Sockets
io.on('connection', (socket) => {
  console.log('Cliente conectado');
  socket.emit('pedidosActualizados', pedidos);
  socket.on('nuevoPedido', async (pedido) => {
    pedido.numero = contador++;
    pedido.estado = 'pendiente';
    pedidos.push(pedido);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        'INSERT INTO pedidos (id, numero, estado, pago, total) VALUES (?, ?, ?, ?, ?)',
        [pedido.id, pedido.numero, pedido.estado, pedido.pago, pedido.total]
      );

      if (pedido.items && pedido.items.length > 0) {
        for (const item of pedido.items) {
          await connection.query(
            'INSERT INTO pedido_items (pedido_id, producto_id, nombre, tamano, extras, observacion, precio) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              pedido.id,
              item.producto_id || null,
              item.nombre,
              item.tamano || 'Personal',
              JSON.stringify(item.extras || []), 
              item.observacion || '',
              item.precio
            ]
          );
        }
      }

      await connection.commit();
      console.log(`Pedido #${pedido.numero} y sus ítems guardados en MySQL`);
    } catch (err) {
      await connection.rollback();
      console.error('Error guardando pedido completo en MySQL:', err.message);
    } finally {
      connection.release();
    }

    io.emit('pedidosActualizados', pedidos);
  });

  socket.on('actualizarPedidos', async (data) => {
    pedidos = data;
    io.emit('pedidosActualizados', pedidos);

    try {
      for (const p of pedidos) {
        await db.query(
          'UPDATE pedidos SET estado = ? WHERE id = ?',
          [p.estado, p.id]
        );
      }

      if (pedidos.length > 0) {
        const ids = pedidos.map(p => p.id);
        await db.query(
          `UPDATE pedidos SET estado = 'entregado' 
            WHERE estado != 'entregado' AND id NOT IN (?)`,
          [ids]
        );
      } else {
        await db.query("UPDATE pedidos SET estado = 'entregado' WHERE estado != 'entregado'");
      }
    } catch (err) {
      console.error('Error actualizando estados en lote:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// REST API — historial y productos

// Historial de pedidos
app.get('/historial', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.numero, p.estado, p.pago, 
              CAST(p.total AS FLOAT) as total, 
              p.creado_en,
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'nombre', pi.nombre,
                  'tamano', pi.tamano,
                  'precio', CAST(pi.precio AS FLOAT),
                  'extras', pi.extras,
                  'observacion', pi.observacion
                )
              ) as items
        FROM pedidos p
        LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
        GROUP BY p.id
        ORDER BY p.creado_en DESC
        LIMIT 100`
    );

    const pedidos = rows.map((p) => ({
      ...p,
      items: typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || [])
    }));

    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Historial de ventas por mes
app.get('/ventas-por-mes', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        DATE_FORMAT(creado_en, '%Y-%m') as mes,
        DATE_FORMAT(creado_en, '%M %Y') as mes_nombre,
        COUNT(*) as total_pedidos,
        SUM(total) as total_ventas,
        SUM(CASE WHEN pago = 'Efectivo' THEN 1 ELSE 0 END) as efectivo,
        SUM(CASE WHEN pago = 'Tarjeta'  THEN 1 ELSE 0 END) as tarjeta,
        SUM(CASE WHEN pago = 'Yape'     THEN 1 ELSE 0 END) as yape
        FROM pedidos
        WHERE estado != 'cancelado'
        GROUP BY DATE_FORMAT(creado_en, '%Y-%m')
        ORDER BY mes DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ventas por semana
app.get('/ventas-por-semana', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        YEARWEEK(creado_en, 1) as semana_key,
        DATE_FORMAT(MIN(creado_en), '%d/%m/%Y') as desde,
        DATE_FORMAT(MAX(creado_en), '%d/%m/%Y') as hasta,
        COUNT(*) as total_pedidos,
        SUM(total) as total_ventas,
        SUM(CASE WHEN pago = 'Efectivo' THEN 1 ELSE 0 END) as efectivo,
        SUM(CASE WHEN pago = 'Tarjeta'  THEN 1 ELSE 0 END) as tarjeta,
        SUM(CASE WHEN pago = 'Yape'     THEN 1 ELSE 0 END) as yape
        FROM pedidos
        WHERE estado != 'cancelado'
        GROUP BY YEARWEEK(creado_en, 1)
        ORDER BY semana_key DESC
        LIMIT 12`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ventas por día
app.get('/ventas-por-dia', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        DATE(creado_en) as dia,
        DATE_FORMAT(creado_en, '%d/%m/%Y') as dia_nombre,
        COUNT(*) as total_pedidos,
        SUM(total) as total_ventas,
        SUM(CASE WHEN pago = 'Efectivo' THEN 1 ELSE 0 END) as efectivo,
        SUM(CASE WHEN pago = 'Tarjeta'  THEN 1 ELSE 0 END) as tarjeta,
        SUM(CASE WHEN pago = 'Yape'     THEN 1 ELSE 0 END) as yape
        FROM pedidos
        WHERE estado != 'cancelado'
        GROUP BY DATE(creado_en)
        ORDER BY dia DESC
        LIMIT 30`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista de productos del menú
app.get('/productos', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM productos WHERE activo = TRUE ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//parte añadadido eliminacion permanedenente de pedidos
app.delete('/pedidos/:id', async (req, res) => {
  const id = Number(req.params.id);  
  try {
    await db.query('DELETE FROM pedidos WHERE id = ?', [id]);
    pedidos = pedidos.filter(p => Number(p.id) !== id);  
    io.emit('pedidosActualizados', pedidos);  
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock de productos
app.get('/stock', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.nombre, i.stock_actual, i.stock_minimo
        FROM productos p
        JOIN inventario i ON i.producto_id = p.id
        WHERE p.activo = TRUE
        ORDER BY p.id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock de ingredientes extras
app.get('/stock-ingredientes', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM ingredientes ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stock completo para admin
app.get('/stock-admin', async (req, res) => {
  try {
    const [productos] = await db.query(
      `SELECT p.id, p.nombre, p.categoria,
        i.stock_actual, i.stock_minimo, i.stock_maximo
        FROM productos p
        JOIN inventario i ON i.producto_id = p.id
        WHERE p.activo = TRUE
        ORDER BY p.categoria, p.nombre`
    );

    const [ingredientes] = await db.query(
      `SELECT id, nombre, stock_actual, stock_minimo
        FROM ingredientes
        ORDER BY nombre`
    );

    res.json({ productos, ingredientes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Descontar ingrediente cuando se usa en un pedido
app.post('/stock-ingredientes/descontar', async (req, res) => {
  const { nombres } = req.body; // array de nombres ej: ['Queso extra', 'Tocino extra']
  if (!nombres || nombres.length === 0) return res.json({ ok: true });

  try {
    for (const nombre of nombres) {
      const base = nombre.replace(' extra', '').trim();
      await db.query(
        'UPDATE ingredientes SET stock_actual = stock_actual - 1 WHERE nombre = ? AND stock_actual > 0',
        [base]
      );
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Iniciar servidor
async function iniciar() {
  await cargarPedidosActivos();
  server.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
  });
}

iniciar();