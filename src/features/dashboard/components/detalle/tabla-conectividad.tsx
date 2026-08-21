import { formatearFechaHora } from '@/lib/formato'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  ConectividadEmpresas,
  EmpresaConectividad,
} from '../../models/alertas.model'
import { EstadoVacio } from '../estados'

const ORDEN_SITUACION: Record<EmpresaConectividad['situacion'], number> = {
  'sin-url': 0,
  'sin-sincronizar': 1,
  desactualizada: 2,
  ok: 3,
}

const ETIQUETA_SITUACION: Record<EmpresaConectividad['situacion'], string> = {
  'sin-url': 'Sin web server',
  'sin-sincronizar': 'Nunca sincronizó',
  desactualizada: 'Sin sincronizar hace +24 h',
  ok: 'Sincronizada',
}

interface Props {
  datos: ConectividadEmpresas | undefined
}

export function TablaConectividad({ datos }: Props) {
  if (!datos || datos.empresas.length === 0) {
    return (
      <EstadoVacio
        titulo='Sin empresas cargadas'
        descripcion='No hay empresas en el sistema, así que no hay conexiones que verificar.'
      />
    )
  }

  const empresas = [...datos.empresas].sort(
    (a, b) =>
      ORDEN_SITUACION[a.situacion] - ORDEN_SITUACION[b.situacion] ||
      a.nombre.localeCompare(b.nombre, 'es'),
  )

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Situación</TableHead>
            <TableHead>Última sincronización</TableHead>
            <TableHead>Estado operativo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {empresas.map((empresa) => (
            <TableRow key={empresa.id}>
              <TableCell className='font-medium'>
                {empresa.nombre}
                {empresa.url && (
                  <span className='text-muted-foreground block max-w-[22rem] truncate text-xs font-normal'>
                    {empresa.url}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <span
                  className={
                    empresa.situacion === 'ok'
                      ? 'text-sm'
                      : 'text-sm font-medium'
                  }
                >
                  {ETIQUETA_SITUACION[empresa.situacion]}
                </span>
              </TableCell>
              <TableCell className='tabular-nums'>
                {formatearFechaHora(empresa.ultimaSincronizacion)}
              </TableCell>
              <TableCell>
                <Badge variant={empresa.activo ? 'outline' : 'secondary'}>
                  {empresa.activo ? 'Activa' : 'Inactiva'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className='text-muted-foreground mt-4 space-y-2 text-xs leading-relaxed'>
        <p>
          <strong className='text-foreground font-medium'>
            Estado operativo no es salud del web server.
          </strong>{' '}
          Ese campo lo escriben dos autores: un proceso automático que corre cada
          3 minutos y lo cambia en las dos direcciones, y los operadores desde el
          CRUD de empresas. Una empresa desactivada a mano vuelve sola a
          &quot;activa&quot; si su URL responde. Por eso las alertas se calculan
          con la URL y la última sincronización, que sí son inequívocas.
        </p>
        <p>
          Para diagnosticar de verdad hace falta que el backend guarde el
          resultado de cada chequeo por separado del flag operativo.
        </p>
      </div>
    </div>
  )
}
