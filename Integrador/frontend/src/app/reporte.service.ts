import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({ providedIn: 'root' })
export class ReporteService {

    private readonly MARRON      = '4B250F';
    private readonly MARRON_MED  = '5B2D0F';
    private readonly DORADO      = 'D89B45';
    private readonly DORADO_CLAR = 'F5D5A7';
    private readonly CREMA       = 'FDF6EC';
    private readonly VERDE       = 'E8F8F0';
    private readonly VERDE_TXT   = '1A6B3C';
    private readonly AZUL        = 'EAF2FB';
    private readonly AZUL_TXT    = '1A5276';
    private readonly MORADO      = 'F5EEF8';
    private readonly MORADO_TXT  = '6C3483';
    private readonly BLANCO      = 'FFFFFFFF';

    generarReporteMes(historialPedidos: any[], mesNombre: string, mesKey: string) {
        const pedidosMes = historialPedidos.filter(p => {
        const fecha = new Date(p.creado_en);
        const key   = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        return key === mesKey;
        });
        if (pedidosMes.length === 0) {
        alert('No hay pedidos en este período.');
        return;
        }
        const wb   = XLSX.utils.book_new();
        const now  = new Date();
        const hoy  = now.toLocaleDateString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric' });
        const hora = now.toLocaleTimeString('es-PE', { hour:'2-digit', minute:'2-digit' });
        const totalVentas  = pedidosMes.reduce((s, p) => s + (p.total || 0), 0);
        const totalPedidos = pedidosMes.length;
        const ticketProm   = totalVentas / totalPedidos;
        const efectivoCnt  = pedidosMes.filter(p => p.pago === 'Efectivo').length;
        const tarjetaCnt   = pedidosMes.filter(p => p.pago === 'Tarjeta').length;
        const yapeCnt      = pedidosMes.filter(p => p.pago === 'Yape').length;
        const efectivoTot  = pedidosMes.filter(p => p.pago === 'Efectivo').reduce((s,p) => s + p.total, 0);
        const tarjetaTot   = pedidosMes.filter(p => p.pago === 'Tarjeta').reduce((s,p)  => s + p.total, 0);
        const yapeTot      = pedidosMes.filter(p => p.pago === 'Yape').reduce((s,p)     => s + p.total, 0);
        // Agrupar por día
        const porDia: Record<string, {pedidos:number, Efectivo:number, Tarjeta:number, Yape:number, total:number}> = {};
        pedidosMes.forEach(p => {
        const d = new Date(p.creado_en);
        const key = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
        if (!porDia[key]) porDia[key] = { pedidos:0, Efectivo:0, Tarjeta:0, Yape:0, total:0 };
        porDia[key].pedidos++;
        (porDia[key] as any)[p.pago] += p.total;
        porDia[key].total += p.total;
        });
        // Producto más vendido
        const conteoProductos: Record<string, number> = {};
        pedidosMes.forEach(p => {
        (p.items || []).forEach((item: any) => {
            conteoProductos[item.nombre] = (conteoProductos[item.nombre] || 0) + 1;
        });
        });
        const topProducto = Object.entries(conteoProductos).sort((a,b) => b[1]-a[1])[0];
        // ── HOJA 1: RESUMEN ──────────────────────────────────────────────
        const resumenData = [
        ['CAPITÁN BURGER'],
        [`REPORTE DE VENTAS — ${mesNombre.toUpperCase()}`],
        [`Generado: ${hoy} ${hora}`],
        [],
        ['RESUMEN GENERAL'],
        ['Total de Pedidos',    totalPedidos],
        ['Ventas Totales',      totalVentas],
        ['Ticket Promedio',     ticketProm],
        [],
        ['VENTAS POR MÉTODO DE PAGO'],
        ['Método', 'Pedidos', '% Pedidos', 'Total S/', '% Ventas'],
        ['Efectivo', efectivoCnt, efectivoCnt/totalPedidos, efectivoTot, efectivoTot/totalVentas],
        ['Tarjeta',  tarjetaCnt,  tarjetaCnt/totalPedidos,  tarjetaTot,  tarjetaTot/totalVentas],
        ['Yape',     yapeCnt,     yapeCnt/totalPedidos,     yapeTot,     yapeTot/totalVentas],
        ['TOTAL',    totalPedidos, 1,                       totalVentas, 1],
        [],
        ['DESTACADO DEL MES'],
        topProducto ? [`Producto más vendido: ${topProducto[0]}`, `${topProducto[1]} pedido(s)`] : ['Sin datos'],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
        // Anchos columnas hoja 1
        ws1['!cols'] = [
        { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }
        ];
        // Merge header hoja 1
        ws1['!merges'] = [
        { s:{r:0,c:0}, e:{r:0,c:4} },
        { s:{r:1,c:0}, e:{r:1,c:4} },
        { s:{r:2,c:0}, e:{r:2,c:4} },
        { s:{r:4,c:0}, e:{r:4,c:4} },
        { s:{r:9,c:0}, e:{r:9,c:4} },
        { s:{r:16,c:0}, e:{r:16,c:4} },
        ];
        XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');
        // ── HOJA 2: DETALLE DE PEDIDOS ───────────────────────────────────
        const detalleRows: any[][] = [
        [`CAPITÁN BURGER — DETALLE DE PEDIDOS — ${mesNombre.toUpperCase()}`],
        ['Ticket', 'Fecha', 'Hora', 'Método de Pago', 'Productos', 'Total S/'],
        ];
        pedidosMes.forEach(p => {
        const fecha = new Date(p.creado_en);
        const fechaStr = `${String(fecha.getDate()).padStart(2,'0')}/${String(fecha.getMonth()+1).padStart(2,'0')}/${fecha.getFullYear()}`;
        const horaStr  = `${String(fecha.getHours()).padStart(2,'0')}:${String(fecha.getMinutes()).padStart(2,'0')}`;
        const ticket   = `#${String(p.id).slice(-4)}`;
        const productos = (p.items || []).map((i:any) => i.nombre).join(', ');
        detalleRows.push([ticket, fechaStr, horaStr, p.pago, productos, p.total]);
        });
        detalleRows.push(['', '', '', '', 'TOTAL', totalVentas]);
        const ws2 = XLSX.utils.aoa_to_sheet(detalleRows);
        ws2['!cols'] = [
        { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 16 }, { wch: 35 }, { wch: 14 }
        ];
        ws2['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:5} }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Detalle de Pedidos');

        // ── HOJA 3: VENTAS POR DÍA ───────────────────────────────────────
        const diasOrdenados = Object.keys(porDia).sort((a, b) => {
        const [da,ma,ya] = a.split('/').map(Number);
        const [db,mb,yb] = b.split('/').map(Number);
        return new Date(ya,ma-1,da).getTime() - new Date(yb,mb-1,db).getTime();
        });

        const diasRows: any[][] = [
        [`CAPITÁN BURGER — VENTAS POR DÍA — ${mesNombre.toUpperCase()}`],
        ['Fecha', 'Pedidos', 'Efectivo S/', 'Tarjeta S/', 'Yape S/', 'Total S/'],
        ];

        diasOrdenados.forEach(dia => {
        const d = porDia[dia];
        diasRows.push([dia, d.pedidos, d.Efectivo, d.Tarjeta, d.Yape, d.total]);
        });

        diasRows.push(['TOTAL',
        diasOrdenados.reduce((s,d) => s + porDia[d].pedidos, 0),
        diasOrdenados.reduce((s,d) => s + porDia[d].Efectivo, 0),
        diasOrdenados.reduce((s,d) => s + porDia[d].Tarjeta, 0),
        diasOrdenados.reduce((s,d) => s + porDia[d].Yape, 0),
        totalVentas,
        ]);

        const ws3 = XLSX.utils.aoa_to_sheet(diasRows);
        ws3['!cols'] = [
        { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }
        ];
        ws3['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:5} }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Ventas por Día');

        // ── DESCARGAR ────────────────────────────────────────────────────
        const nombreArchivo = `Reporte_CapitanBurger_${mesKey}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
    }
    }