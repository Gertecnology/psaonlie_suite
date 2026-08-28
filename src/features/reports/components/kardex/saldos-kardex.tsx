import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  aFecha,
  formatearEntero,
  formatearFechaISO,
  formatearGuaranies,
} from '@/lib/formato'
import { useAuth } from '@/context/auth-context'
import { Switch } from '@/components/ui/switch'
import type {
  DefinicionInforme,
  FiltrosInforme,
  IdInforme,
  PeriodoInforme,
} from '../../models/informe.model'
import {
  kardexGenerado,
  type FiltrosKardex,
  type PeriodoKardex,
  type SaldoAgencia,
  type SaldoCuentaPropia,
  type Saldos,
} from '../../models/kardex.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { obtenerSaldos } from '../../services/kardex.service'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'
import { TablaContable, type ColumnaContable } from '../tabla-contable'

/**
 * La definición del documento, escrita acá y no en el catálogo `INFORMES`.
 *
 * El kardex no sale de `/api/admin/informes` sino de `/api/admin/kardex`, así
 * que no es uno de los del catálogo y su `id` no pertenece a `IdInforme`. La
 * definición existe igual porque la hoja necesita saber qué documento está
 * imprimiendo: sin código ni nombre, un papel archivado no se puede pedir por
 * su nombre corto.
 */
const DEFINICION: DefinicionInforme = {
  id: 'kardex-saldos' as IdInforme,
  ruta: 'kardex/saldos',
  titulo: 'Kardex — Saldos',
  codigo: 'INF-KDX-001',
  documento: 'SALDOS DEL LIBRO DE MOVIMIENTOS',
  // El kardex no cuelga de `/api/admin/informes`: sus saldos salen del libro de
  // movimientos. Sin declararlo, el pie de la hoja imprimiría una ruta que
  // devuelve 404 a quien intente reproducir el documento.
  origen: '/api/admin/kardex/saldos',
  descripcion:
    'Lo que se le debe a cada empresa según los movimientos asentados en el libro.',
  responde: '¿El libro dice lo mismo que la liquidación?',
}

/**
 * Lo que se le debe a cada empresa, salido del libro.
 *
 * Es la misma cifra que el informe de saldos calcula desde `ventas`; acá es la
 * suma de los movimientos asentados. Las dos tienen que coincidir, y cuando no
 * coinciden una de las dos está mal — que es exactamente para lo que existe
 * esta hoja. Hasta la fase 3 los informes siguen siendo la fuente; el libro es
 * el control.
 *
 * El descuadre va en la fila de totales y no en un cartel aparte: se lee junto
 * al total que pone en duda, que es donde importa.
 */
export function SaldosKardex() {
  const { accessToken } = useAuth()
  const { borrador, aplicados, cambiar, generar } = useFiltrosInforme()

  // Los filtros del kardex son los del informe más `acumulado`; el hook de
  // filtros ya resuelve el borrador contra la URL.
  const filtros = aplicados as FiltrosKardex
  const generado = kardexGenerado(filtros)

  const { data, isLoading, error } = useQuery<Saldos>({
    queryKey: ['kardex-saldos', filtros, accessToken],
    queryFn: () => obtenerSaldos<Saldos>(filtros),
    enabled: Boolean(accessToken) && generado,
    staleTime: 60_000,
    retry: 1,
  })

  const acumulado = Boolean((borrador as FiltrosKardex).acumulado)
  const puedeEmitir = acumulado || Boolean(borrador.desde && borrador.hasta)

  /**
   * La señal de «ya se emitió» que espera el marco.
   *
   * `MarcoInforme` la deduce con `estaGenerado`, que exige un período; el
   * acumulado no tiene período —ignora las fechas a propósito— y se decide con
   * `kardexGenerado`. Esto traduce lo segundo a lo primero y no llega a la
   * hoja: el período que se imprime sale de `periodo`, que es el que devolvió
   * la API, y el alcance queda escrito en la ficha técnica.
   */
  const filtrosDelMarco = React.useMemo<FiltrosInforme>(() => {
    if (!generado) return {}
    const hoy = formatearFechaISO(new Date())
    return {
      desde: filtros.desde ?? hoy,
      hasta: filtros.hasta ?? hoy,
      generado: true,
    }
  }, [generado, filtros.desde, filtros.hasta])

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={filtrosDelMarco}
      periodo={aPeriodoInforme(data?.periodo ?? null)}
      filtrosDescritos={[
        {
          etiqueta: 'Alcance',
          valor: filtros.acumulado
            ? 'Acumulado desde el inicio'
            : 'Sólo el período',
        },
      ]}
      isLoading={isLoading}
      error={error}
      onEmitir={generar}
      puedeEmitir={puedeEmitir}
      controles={
        <>
          <FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />
          <div className='flex items-center gap-1.5'>
            <label
              htmlFor='kardex-acumulado'
              className='text-muted-foreground text-[11px]'
            >
              Acumulado
            </label>
            <Switch
              id='kardex-acumulado'
              checked={acumulado}
              onCheckedChange={(valor) =>
                cambiar('acumulado' as keyof FiltrosInforme, valor as never)
              }
            />
          </div>
        </>
      }
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    />
  )
}

/**
 * El período del kardex, con la cantidad de días que la hoja necesita.
 *
 * La API del kardex devuelve el rango y no los días, así que se cuentan acá.
 * Contar días entre dos fechas no es inventar una cifra contable: es la misma
 * fecha, dicha de otra manera. En el acumulado no hay período —esa es su
 * definición— y la hoja escribe `—`.
 */
function aPeriodoInforme(
  periodo: PeriodoKardex | null,
): PeriodoInforme | undefined {
  if (!periodo) return undefined

  const desde = aFecha(periodo.desde)
  const hasta = aFecha(periodo.hasta)
  if (!desde || !hasta) return { ...periodo, dias: 0 }

  const dias = Math.round((hasta.getTime() - desde.getTime()) / 86_400_000) + 1
  return { ...periodo, dias }
}

function Cuerpo({ datos }: { datos: Saldos }) {
  const columnasAgencias: ColumnaContable<SaldoAgencia>[] = [
    {
      clave: 'codigo',
      titulo: 'Código',
      alinear: 'izquierda',
      ancho: 96,
      celda: (fila) =>
        fila.codigo ?? <span className='text-muted-foreground'>—</span>,
    },
    {
      clave: 'cuenta',
      titulo: 'Cuenta',
      alinear: 'izquierda',
      celda: (fila) => fila.nombre,
    },
    {
      clave: 'pasajes',
      titulo: 'Pasajes',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => formatearGuaranies(fila.pasajes),
      // La API totaliza el saldo a transferir y nada más. Un total de pasajes
      // sumado acá sería una cifra que el libro no conoce.
    },
    {
      clave: 'comision',
      titulo: 'Comisión',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => formatearGuaranies(fila.comision),
    },
    {
      clave: 'movimientos',
      titulo: 'Movimientos',
      unidad: 'asientos',
      ancho: 100,
      celda: (fila) => formatearEntero(fila.movimientos),
    },
    {
      clave: 'saldo',
      titulo: 'Saldo a transferir',
      unidad: 'Gs.',
      ancho: 136,
      // `netoAPagar` y no `saldo`: el saldo del libro viene con el signo
      // invertido —negativo significa que se les debe— y el total que informa
      // la API es el de lo que hay que transferir.
      celda: (fila) => (
        <span className='font-semibold'>
          {formatearGuaranies(fila.netoAPagar)}
        </span>
      ),
      total: formatearGuaranies(datos.totalAPagarAgencias),
    },
  ]

  const columnasPropias: ColumnaContable<SaldoCuentaPropia>[] = [
    {
      clave: 'codigo',
      titulo: 'Código',
      alinear: 'izquierda',
      ancho: 96,
      celda: (fila) => fila.codigo,
    },
    {
      clave: 'cuenta',
      titulo: 'Cuenta',
      alinear: 'izquierda',
      celda: (fila) => fila.nombre,
    },
    {
      clave: 'tipo',
      titulo: 'Tipo',
      alinear: 'izquierda',
      ancho: 150,
      celda: (fila) => fila.tipo,
    },
    {
      clave: 'saldo',
      titulo: 'Saldo',
      unidad: 'Gs.',
      ancho: 136,
      celda: (fila) => formatearGuaranies(fila.saldo),
      // Sin total: la API no suma las cuentas propias. `descuadre` es la suma
      // de TODO el libro, no la de este cuadro, y ponerla acá la haría pasar
      // por lo que no es.
    },
  ]

  return (
    <>
      <TablaContable
        columnas={columnasAgencias}
        filas={datos.agencias}
        claveFila={(fila) => fila.agenciaId}
        antesDeLaTabla={<Rotulo>Cuentas de empresas transportistas</Rotulo>}
        // Un libro que cierra suma cero. Cualquier otra cosa significa que hay
        // un asiento roto y que el total de al lado no es confiable, así que se
        // dice ahí mismo y no en un cartel aparte.
        alcanceTotales={
          datos.descuadre === 0
            ? undefined
            : `Descuadre del libro: ${formatearGuaranies(datos.descuadre)}`
        }
        sonImporte={datos.totalAPagarAgencias}
        descripcion='Saldo del libro por empresa transportista, con los pasajes, la comisión retenida y la cantidad de asientos'
        mensajeVacio='El período no tiene movimientos asentados de ninguna empresa.'
      />

      <TablaContable
        columnas={columnasPropias}
        filas={datos.propias}
        claveFila={(fila) => fila.codigo}
        antesDeLaTabla={<Rotulo>Cuentas propias</Rotulo>}
        descripcion='Saldo de las cuentas propias del libro: comisiones, cargo por servicio y cajas'
        mensajeVacio='El período no tiene movimientos en las cuentas propias.'
      />
    </>
  )
}

/**
 * El nombre del cuadro.
 *
 * La hoja lleva dos, y sin rótulo el segundo es una grilla de números sin saber
 * de qué cuentas habla. No es una nota: es el título de la planilla que sigue.
 */
function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className='border-border border-b px-7 pt-3.5 pb-1.5 text-[12px] font-bold tracking-wide text-[#1e2a5a] uppercase'>
      {children}
    </h3>
  )
}
