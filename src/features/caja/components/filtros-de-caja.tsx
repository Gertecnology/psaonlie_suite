import {
  BarraDeFiltros,
  FiltroDeRangoDeFechas,
  FiltroDeRangoNumerico,
  FiltroDeSeleccion,
  FiltroDeTexto,
  type FiltroAplicado,
} from '@/components/filtros'
import { formatearGuaranies } from '@/lib/formato'
import { deFechaISOLocal, describirPeriodo } from '@/lib/periodo'
import type {
  FiltrosDeCaja,
  OpcionesDeCaja,
  OrigenDeVenta,
} from '../models/caja.model'

/** Los estados que puede tener el cobro. Son los del enum del backend. */
export const ESTADOS_DE_PAGO = [
  'PENDIENTE',
  'PAGADO',
  'EXPIRADO',
  'CANCELADO',
  'FALLIDO',
  'REEMBOLSADO',
]

/**
 * Los estados de la venta.
 *
 * No son los del pago: una venta anulada pudo haberse cobrado, y una pagada
 * pudo no confirmarse nunca con la transportista. Por eso son dos filtros y no
 * uno.
 */
export const ESTADOS_DE_VENTA = [
  'RESERVADO',
  'CONFIRMADO',
  'EXPIRADO',
  'CANCELADO',
  'ANULADO',
  'PENDIENTE_PAGO',
  'PAGO_APROBADO',
]

const ETIQUETAS_DE_ORIGEN: Record<Exclude<OrigenDeVenta, 'TODAS'>, string> = {
  CAJA: 'Sólo caja',
  WEB: 'Sólo web',
}

interface FiltrosDeCajaProps {
  filtros: FiltrosDeCaja
  opciones?: OpcionesDeCaja
  /** Si quien mira ve sólo sus ventas: le sobran vendedor y origen. */
  soloMisVentas: boolean
  actualizando: boolean
  total?: number
  onPoner: (parche: Partial<FiltrosDeCaja>) => void
  onQuitar: (clave: keyof FiltrosDeCaja) => void
  onLimpiar: () => void
}

/**
 * Los filtros del listado de la caja.
 *
 * Todos van al servidor. Filtrar en el cliente recortaría las veinticinco
 * filas que ya llegaron —no las cuatro mil que hay— y dejaría las tarjetas de
 * totales sumando lo que la tabla no muestra.
 *
 * Los que no le sirven a un vendedor no se deshabilitan: no se dibujan. Un
 * control gris invita a preguntarse qué falta para usarlo; acá no falta nada,
 * simplemente no es su pantalla.
 */
export function FiltrosDeCajaControles({
  filtros,
  opciones,
  soloMisVentas,
  actualizando,
  total,
  onPoner,
  onQuitar,
  onLimpiar,
}: FiltrosDeCajaProps) {
  const empresas = opciones?.empresas ?? []
  const vendedores = opciones?.vendedores ?? []

  const nombreDeEmpresa = (id: string) =>
    empresas.find((empresa) => empresa.id === id)?.nombre ?? id
  const nombreDeVendedor = (id: string) =>
    vendedores.find((vendedor) => vendedor.id === id)?.nombre ?? id

  // Lo que se muestra abajo como chips. Se arma con los valores legibles: un
  // uuid en un chip no le dice a nadie por qué la tabla tiene tres filas.
  const aplicados: FiltroAplicado[] = []

  // El período va primero y sin cruz: la pantalla lo pone sola y siempre hay
  // uno. Mostrarlo es lo que impide que alguien lea «Gs. 782.250» creyendo que
  // es lo vendido desde siempre, cuando son treinta días.
  if (filtros.desde || filtros.hasta) {
    aplicados.push({
      clave: 'periodo',
      etiqueta: 'Período',
      valor: describirPeriodo({
        desde: deFechaISOLocal(filtros.desde) ?? new Date(),
        hasta: deFechaISOLocal(filtros.hasta) ?? new Date(),
      }),
      fijo: true,
    })
  }

  if (filtros.busqueda) {
    aplicados.push({
      clave: 'busqueda',
      etiqueta: 'Búsqueda',
      valor: filtros.busqueda,
    })
  }
  if (filtros.estadoPago) {
    aplicados.push({
      clave: 'estadoPago',
      etiqueta: 'Pago',
      valor: filtros.estadoPago,
    })
  }
  if (filtros.estadoVenta) {
    aplicados.push({
      clave: 'estadoVenta',
      etiqueta: 'Venta',
      valor: filtros.estadoVenta,
    })
  }
  if (filtros.emisorId) {
    aplicados.push({
      clave: 'emisorId',
      etiqueta: 'Empresa',
      valor: nombreDeEmpresa(filtros.emisorId),
    })
  }
  if (filtros.vendedorId) {
    aplicados.push({
      clave: 'vendedorId',
      etiqueta: 'Vendedor',
      valor: nombreDeVendedor(filtros.vendedorId),
    })
  }
  if (filtros.origen && filtros.origen !== 'TODAS') {
    aplicados.push({
      clave: 'origen',
      etiqueta: 'Origen',
      valor: ETIQUETAS_DE_ORIGEN[filtros.origen],
    })
  }
  // `!== undefined` y no por verdad: un mínimo de 0 es un filtro puesto.
  if (filtros.montoMin !== undefined || filtros.montoMax !== undefined) {
    const desde =
      filtros.montoMin !== undefined
        ? formatearGuaranies(filtros.montoMin)
        : '—'
    const hasta =
      filtros.montoMax !== undefined
        ? formatearGuaranies(filtros.montoMax)
        : '—'

    aplicados.push({
      clave: 'monto',
      etiqueta: 'Monto',
      valor: `${desde} a ${hasta}`,
    })
  }

  const quitar = (clave: string) => {
    if (clave === 'monto') {
      onPoner({ montoMin: undefined, montoMax: undefined })
      return
    }

    onQuitar(clave as keyof FiltrosDeCaja)
  }

  return (
    <BarraDeFiltros
      aplicados={aplicados}
      onQuitar={quitar}
      onLimpiar={onLimpiar}
      actualizando={actualizando}
      total={total}
    >
      {/*
        Los anchos no son iguales porque los campos no lo son: la búsqueda se
        estira con el espacio que sobra, y un desplegable de dos opciones no
        tiene por qué medir lo mismo que el de empresas.
      */}
      <FiltroDeTexto
        id='caja-busqueda'
        etiqueta='Buscar'
        placeholder='Documento, pasajero o transacción'
        valor={filtros.busqueda ?? ''}
        onCambiar={(valor) => onPoner({ busqueda: valor || undefined })}
        className='min-w-[15rem] flex-1'
      />

      <FiltroDeRangoDeFechas
        desde={filtros.desde}
        hasta={filtros.hasta}
        onCambiar={({ desde, hasta }) => onPoner({ desde, hasta })}
      />

      <FiltroDeSeleccion
        id='caja-estado-pago'
        etiqueta='Estado del pago'
        etiquetaDeTodos='Todos los pagos'
        placeholder='Pago'
        opciones={ESTADOS_DE_PAGO.map((estado) => ({
          valor: estado,
          etiqueta: estado,
        }))}
        valor={filtros.estadoPago}
        onCambiar={(valor) => onPoner({ estadoPago: valor })}
      className='w-[7rem]'
        />

      <FiltroDeSeleccion
        id='caja-estado-venta'
        etiqueta='Estado de la venta'
        etiquetaDeTodos='Todas las ventas'
        placeholder='Venta'
        opciones={ESTADOS_DE_VENTA.map((estado) => ({
          valor: estado,
          etiqueta: estado,
        }))}
        valor={filtros.estadoVenta}
        onCambiar={(valor) => onPoner({ estadoVenta: valor })}
      className='w-[7.5rem]'
        />

      <FiltroDeSeleccion
        id='caja-empresa'
        etiqueta='Empresa'
        etiquetaDeTodos='Todas las empresas'
        opciones={empresas.map((empresa) => ({
          valor: empresa.id,
          etiqueta: empresa.nombre,
        }))}
        valor={filtros.emisorId}
        onCambiar={(valor) => onPoner({ emisorId: valor })}
      className='w-[8.5rem]'
        />

      <FiltroDeRangoNumerico
        id='caja-monto'
        etiqueta='Monto cobrado'
        minimo={filtros.montoMin}
        maximo={filtros.montoMax}
        onCambiar={({ minimo, maximo }) =>
          onPoner({ montoMin: minimo, montoMax: maximo })
        }
      className='w-[11rem]'
        />

      {/* Un vendedor no filtra por vendedor: sólo se tiene a sí mismo. */}
      {!soloMisVentas && (
        <FiltroDeSeleccion
          id='caja-vendedor'
          etiqueta='Vendedor'
          etiquetaDeTodos='Todos los vendedores'
          opciones={vendedores.map((vendedor) => ({
            valor: vendedor.id,
            etiqueta: vendedor.nombre,
          }))}
          valor={filtros.vendedorId}
          onCambiar={(valor) => onPoner({ vendedorId: valor })}
        className='w-[8.5rem]'
        />
      )}

      {!soloMisVentas && (
        <FiltroDeSeleccion
          id='caja-origen'
          etiqueta='Origen'
          etiquetaDeTodos='Caja y web'
          opciones={[
            { valor: 'CAJA', etiqueta: ETIQUETAS_DE_ORIGEN.CAJA },
            { valor: 'WEB', etiqueta: ETIQUETAS_DE_ORIGEN.WEB },
          ]}
          valor={filtros.origen === 'TODAS' ? undefined : filtros.origen}
          onCambiar={(valor) =>
            onPoner({ origen: (valor as OrigenDeVenta) ?? 'TODAS' })
          }
        className='w-[7.5rem]'
        />
      )}
    </BarraDeFiltros>
  )
}
