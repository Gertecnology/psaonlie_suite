import { formatearEntero, formatearGuaranies } from '@/lib/formato'
import { importeEnLetras } from '@/lib/importe-en-letras'
import { cn } from '@/lib/utils'
import { informePorRuta } from '../../models/informe.model'
import { etiquetaClasificacion } from '../../models/estado-ventas.model'
import type { ResumenFinanciero } from '../../models/resumen-financiero.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

const DEFINICION = informePorRuta('resumen-financiero')!

/**
 * A dónde fue la plata del período.
 *
 * Lee el `resumen-financiero` del backend, que el panel nunca llamaba: armaba
 * esto desde un endpoint genérico de estadísticas y sumaba las partes por su
 * cuenta. De ahí salían dos problemas — las cifras podían discrepar con las que
 * el backend produce en otro lado, y el `cuadre` era invisible, así que un
 * período cuyos propios números no cerraban se veía igual que uno que sí.
 */
export function InformeResumenFinanciero() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  const { data, isLoading, error } = useInforme<ResumenFinanciero>(
    DEFINICION.ruta,
    aplicados,
  )

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={aplicados}
      periodo={data?.periodo}
      isLoading={isLoading}
      error={error}
      onEmitir={generar}
      puedeEmitir={puedeGenerar}
      controles={
        <FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />
      }
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    />
  )
}

/** Un renglón del estado: un concepto y una cifra, parcial o de cierre. */
interface RenglonEstado {
  clave: string
  concepto: string
  /** Bajo el concepto, en chico: conteos y contexto que no son importes. */
  detalle?: string
  /** Componente del grupo. */
  parcial?: number
  /** Cierre del grupo: la cifra que el lector viene buscando. */
  total?: number
  observado?: boolean
}

interface GrupoEstado {
  clave: string
  titulo: string
  observado?: boolean
  renglones: RenglonEstado[]
}

type LineaEstado =
  | { tipo: 'grupo'; clave: string; titulo: string; observado: boolean }
  | { tipo: 'renglon'; clave: string; numero: number; renglon: RenglonEstado }

/**
 * El estado de resultados del período.
 *
 * No es una planilla de columnas sino un estado, y por eso no usa
 * `TablaContable`: las cifras no son una serie comparable renglón contra
 * renglón, sino una cuenta que se lee de arriba abajo —lo cobrado, lo devuelto,
 * cómo se aplicó lo que quedó— con **Parcial** para los componentes y **Total**
 * para el cierre de cada grupo. La densidad tipográfica y los colores son los
 * mismos que los de `TablaContable` a propósito: dos hojas del mismo talonario.
 *
 * El cierre es la suma de control del `cuadre`, y va abajo y no arriba: un
 * aviso antes del detalle se lee antes de que haya algo de qué desconfiar.
 */
function Cuerpo({ datos }: { datos: ResumenFinanciero }) {
  const grupos: GrupoEstado[] = [
    {
      clave: 'cobrado',
      titulo: 'Ingresos cobrados al cliente',
      renglones: [
        {
          clave: 'cobrado-pasajes',
          concepto: 'Pasajes',
          parcial: datos.cobrado.pasajes,
        },
        {
          clave: 'cobrado-cargo',
          concepto: 'Cargo por servicio',
          parcial: datos.cobrado.cargoServicio,
        },
        {
          clave: 'cobrado-total',
          concepto: 'Total cobrado al cliente',
          detalle:
            `${formatearEntero(datos.volumen.ventasLiquidables)} ventas liquidables · ` +
            `${formatearEntero(datos.volumen.boletosVigentes)} boletos vigentes · ` +
            `ticket promedio ${formatearGuaranies(datos.volumen.ticketPromedio)} · ` +
            `${datos.volumen.boletosPorVenta.toFixed(2)} boletos por venta`,
          total: datos.cobrado.total,
        },
      ],
    },
    {
      clave: 'devoluciones',
      titulo: 'Menos: devoluciones al cliente',
      renglones: [
        {
          clave: 'devoluciones-pasajes',
          concepto: 'Pasajes devueltos',
          parcial: datos.devoluciones.pasajes,
        },
        {
          clave: 'devoluciones-cargo',
          concepto: 'Cargo por servicio devuelto',
          parcial: datos.devoluciones.cargoServicio,
        },
        {
          clave: 'devoluciones-comision',
          concepto: 'Comisión revertida',
          parcial: datos.devoluciones.comision,
        },
        {
          clave: 'devoluciones-total',
          concepto: 'Total devuelto al cliente',
          detalle:
            `${formatearEntero(datos.devoluciones.ventasReembolsadas)} ventas reembolsadas · ` +
            `${formatearEntero(datos.devoluciones.boletosAnulados)} boletos anulados`,
          total: datos.devoluciones.totalDevueltoAlCliente,
        },
      ],
    },
    {
      clave: 'agencias',
      titulo: 'Liquidación a las empresas transportistas',
      renglones: [
        {
          clave: 'agencias-pasajes',
          concepto: 'Pasajes vendidos',
          parcial: datos.agencias.pasajes,
        },
        {
          // La comisión se descuenta de la transferencia: nunca se le suma al
          // cliente ni queda como una cuenta a cobrar contra la empresa.
          clave: 'agencias-comision',
          concepto: 'Menos: comisión retenida',
          parcial: datos.agencias.comisionDescontada,
        },
        {
          clave: 'agencias-neto',
          concepto: 'Neto a transferir a las empresas',
          total: datos.agencias.netoATransferir,
        },
      ],
    },
    {
      clave: 'propio',
      titulo: 'Ingreso propio del período',
      renglones: [
        {
          clave: 'propio-comision',
          concepto: 'Comisiones retenidas',
          parcial: datos.propio.comision,
        },
        {
          clave: 'propio-cargo',
          concepto: 'Cargo por servicio',
          parcial: datos.propio.cargoServicio,
        },
        {
          clave: 'propio-total',
          concepto: 'Total ingreso propio',
          total: datos.propio.total,
        },
      ],
    },
    {
      clave: 'neto',
      titulo: 'Aplicación del ingreso neto',
      renglones: [
        {
          clave: 'neto-cobrado',
          concepto: 'Cobrado al cliente, neto de devoluciones',
          parcial: datos.neto.cobradoAlCliente,
        },
        {
          clave: 'neto-agencias',
          concepto: 'Aplicado a las empresas transportistas',
          parcial: datos.neto.netoATransferirEmpresas,
        },
        {
          clave: 'neto-propio',
          concepto: 'Ingreso neto del período',
          total: datos.neto.ingresoPropio,
        },
      ],
    },
  ]

  // Decir qué NO se contó es parte de decir qué se contó: sin esto, un total
  // bajo parece una mala semana y no una cola de ventas a medio terminar. Va
  // como un grupo numerado más y no como un cartel aparte.
  if (datos.excluido.length > 0) {
    grupos.push({
      clave: 'excluido',
      titulo: 'Partidas fuera de las cifras anteriores',
      observado: true,
      renglones: datos.excluido.map((bucket) => ({
        clave: `excluido-${bucket.clasificacion}`,
        concepto: etiquetaClasificacion(bucket.clasificacion),
        detalle:
          `${formatearEntero(bucket.cantidad)} ventas · ` +
          `cargo por servicio ${formatearGuaranies(bucket.cargoServicio)} · ` +
          `comisión ${formatearGuaranies(bucket.comision)}` +
          (bucket.critico ? ' · requiere atención' : ''),
        parcial: bucket.pasajes,
        observado: bucket.critico,
      })),
    })
  }

  const lineas: LineaEstado[] = []
  let numero = 0
  for (const grupo of grupos) {
    lineas.push({
      tipo: 'grupo',
      clave: grupo.clave,
      titulo: grupo.titulo,
      observado: grupo.observado ?? false,
    })
    for (const renglon of grupo.renglones) {
      numero += 1
      lineas.push({
        tipo: 'renglon',
        clave: renglon.clave,
        numero,
        renglon,
      })
    }
  }

  return (
    <>
      <table className='informe-tabla w-full border-collapse text-[12.5px]'>
        <caption className='sr-only'>
          Estado de resultados del período: lo cobrado al cliente, lo devuelto,
          la liquidación a las empresas, el ingreso propio y las partidas que
          quedaron fuera del cálculo
        </caption>
        <thead>
          <tr className='bg-muted/60 border-y border-y-[#1e2a5a]'>
            <th
              scope='col'
              className='text-muted-foreground w-[42px] py-1.5 pr-2.5 pl-7 text-right text-[10px] font-semibold tracking-wide uppercase'
            >
              N°
            </th>
            <th
              scope='col'
              className='text-muted-foreground py-1.5 pr-2.5 text-left text-[10px] font-semibold tracking-wide uppercase'
            >
              Concepto
            </th>
            <th
              scope='col'
              style={{ width: 148 }}
              className='text-muted-foreground px-2.5 py-1.5 text-right text-[10px] font-semibold tracking-wide uppercase'
            >
              Parcial
              <span className='text-muted-foreground/70 block text-[9px] font-normal normal-case'>
                Gs.
              </span>
            </th>
            <th
              scope='col'
              style={{ width: 148 }}
              className='text-muted-foreground px-2.5 py-1.5 pr-7 text-right text-[10px] font-semibold tracking-wide uppercase'
            >
              Total
              <span className='text-muted-foreground/70 block text-[9px] font-normal normal-case'>
                Gs.
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          {lineas.map((linea) =>
            linea.tipo === 'grupo' ? (
              <tr key={linea.clave} className='bg-muted/40'>
                <th
                  scope='colgroup'
                  colSpan={4}
                  className={cn(
                    'py-1.5 pr-7 pl-7 text-left text-[10px] font-semibold tracking-wide uppercase',
                    linea.observado ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {linea.titulo}
                </th>
              </tr>
            ) : (
              <tr
                key={linea.clave}
                className={cn(
                  'border-border/50 border-b',
                  linea.numero % 2 === 0 && 'bg-muted/25',
                  linea.renglon.observado && 'bg-destructive/5',
                )}
              >
                <td className='text-muted-foreground/70 py-1 pr-2.5 pl-7 text-right text-[11px] tabular-nums'>
                  {linea.numero}
                </td>
                <td className='py-1 pr-2.5 text-left'>
                  <span className='flex flex-col gap-px'>
                    <span
                      className={cn(
                        linea.renglon.total !== undefined && 'font-semibold',
                        linea.renglon.observado && 'text-destructive',
                      )}
                    >
                      {linea.renglon.concepto}
                    </span>
                    {/* El color nunca es el único canal: en papel no se imprime.
                        La partida observada lo dice con texto. */}
                    {linea.renglon.detalle && (
                      <span
                        className={cn(
                          'text-[10.5px]',
                          linea.renglon.observado
                            ? 'text-destructive'
                            : 'text-muted-foreground',
                        )}
                      >
                        {linea.renglon.detalle}
                      </span>
                    )}
                  </span>
                </td>
                <td
                  data-tipo='monto'
                  className='px-2.5 py-1 text-right tabular-nums'
                >
                  {linea.renglon.parcial === undefined ? (
                    <span className='text-muted-foreground'>—</span>
                  ) : (
                    formatearGuaranies(linea.renglon.parcial)
                  )}
                </td>
                <td
                  data-tipo='monto'
                  className='px-2.5 py-1 pr-7 text-right tabular-nums'
                >
                  {linea.renglon.total === undefined ? (
                    <span className='text-muted-foreground'>—</span>
                  ) : (
                    <span className='font-semibold'>
                      {formatearGuaranies(linea.renglon.total)}
                    </span>
                  )}
                </td>
              </tr>
            ),
          )}
        </tbody>

        {/*
          La suma de control cierra el estado.
          Cada lado se agrega por separado en SQL, así que una diferencia
          distinta de cero significa que las cifras de arriba se contradicen
          entre sí, y ninguna es confiable hasta explicarla. Por eso el renglón
          va siempre, también cuando cuadra: un control que sólo aparece cuando
          falla no se distingue de un control que no se hizo.
        */}
        <tfoot>
          <tr className='bg-muted/60 border-y-2 border-y-[#1e2a5a] font-bold text-[#1e2a5a]'>
            <td className='py-1.5 pr-2.5 pl-7' />
            <td className='py-1.5 pr-2.5 text-left'>
              <span className='flex flex-col gap-px'>
                <span className='text-[12px] tracking-wide uppercase'>
                  Suma de control del período
                </span>
                <span
                  className={cn(
                    'block text-[10px] font-normal normal-case',
                    datos.cuadre.cuadra
                      ? 'text-muted-foreground'
                      : 'text-destructive',
                  )}
                >
                  {datos.cuadre.cuadra
                    ? 'Lo cobrado menos lo devuelto coincide con el neto, línea por línea.'
                    : 'Lo cobrado menos lo devuelto no coincide con el neto: las cifras de arriba no son confiables hasta explicarlo.'}
                </span>
              </span>
            </td>
            <td
              data-tipo='monto'
              className='px-2.5 py-1.5 text-right tabular-nums'
            >
              <span className='text-muted-foreground font-normal'>—</span>
            </td>
            <td
              data-tipo='monto'
              className={cn(
                'px-2.5 py-1.5 pr-7 text-right tabular-nums',
                !datos.cuadre.cuadra && 'text-destructive',
              )}
            >
              {formatearGuaranies(datos.cuadre.descuadre)}
            </td>
          </tr>
        </tfoot>
      </table>

      <p className='border-border flex items-baseline gap-2.5 border-b px-7 py-2'>
        <span className='text-muted-foreground text-[10px] font-bold tracking-wider'>
          SON:
        </span>
        <span className='text-[11.5px]'>
          {importeEnLetras(datos.neto.ingresoPropio)}
        </span>
      </p>
    </>
  )
}
