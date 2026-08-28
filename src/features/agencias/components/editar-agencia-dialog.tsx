import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useActualizarAgencia } from '../hooks/use-actualizar-agencia'
import { type AgenciaFormValues } from '../models/agencia.model'
import { type HijaDeEmpresa } from '../services/agencia.service'

interface EditarAgenciaDialogProps {
  /** `null` mantiene el diálogo cerrado. */
  agencia: HijaDeEmpresa | null
  nombreEmpresa: string
  onCerrar: () => void
}

/**
 * Lo que se puede cambiar de una agencia, sin salir del listado.
 *
 * Es un diálogo y no una página porque son cuatro campos y el contexto importa:
 * la comisión se entiende mirando la de la empresa, que está en la misma
 * pantalla, atrás.
 *
 * El código no se edita: lo emite el servidor de la transportista y la
 * sincronización lo usa para reconocer a cada agencia. Cambiarlo acá sólo
 * lograría que la próxima sincronización creara una agencia nueva.
 */
export function EditarAgenciaDialog({
  agencia,
  nombreEmpresa,
  onCerrar,
}: EditarAgenciaDialogProps) {
  const actualizar = useActualizarAgencia()

  const [nombre, setNombre] = React.useState('')
  const [hereda, setHereda] = React.useState(true)
  const [comision, setComision] = React.useState('')
  const [vende, setVende] = React.useState(true)

  // Cada agencia que se abre reinicia el formulario. Sin esto, el diálogo
  // mostraría los valores de la anterior hasta que alguien los tocara.
  React.useEffect(() => {
    if (!agencia) return
    setNombre(agencia.nombre ?? '')
    setHereda(agencia.heredaComision)
    setComision(
      agencia.porcentajeVentas === null ? '' : String(agencia.porcentajeVentas),
    )
    setVende(agencia.activo)
  }, [agencia])

  if (!agencia) return null

  const comisionInvalida =
    !hereda &&
    comision.trim() !== '' &&
    (Number.isNaN(Number(comision)) ||
      Number(comision) < 0 ||
      Number(comision) > 100)

  const guardar = () => {
    if (comisionInvalida) return

    const cambios: Partial<AgenciaFormValues> = {
      nombre: nombre.trim(),
      activo: vende,
      heredaComision: hereda,
    }

    // El porcentaje propio sólo se manda si se cobra: mandarlo mientras hereda
    // guardaría un número que no se usa y que confunde al leerlo después.
    // Va como texto porque así lo declara el modelo del panel.
    if (!hereda && comision.trim() !== '') {
      cambios.porcentajeVentas = comision.trim()
    }

    actualizar.mutate(
      { id: agencia.id, data: cambios as AgenciaFormValues },
      { onSuccess: onCerrar },
    )
  }

  return (
    <Dialog open={!!agencia} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>
            {agencia.nombre ?? `Agencia ${agencia.codigo ?? 'sin código'}`}
          </DialogTitle>
          <DialogDescription>
            Agencia de {nombreEmpresa}. Vende con el mismo web service.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-5 py-1'>
          <div className='space-y-1.5'>
            <Label htmlFor='agencia-nombre'>Nombre</Label>
            <Input
              id='agencia-nombre'
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder='Sin nombre'
              autoFocus
            />
            {!agencia.nombre && (
              <p className='text-muted-foreground text-xs'>
                La sincronización la creó sin nombre. Hoy se la reconoce sólo
                por el código.
              </p>
            )}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='agencia-codigo'>Código</Label>
            <Input
              id='agencia-codigo'
              value={agencia.codigo ?? '—'}
              disabled
              className='font-mono'
            />
            <p className='text-muted-foreground text-xs'>
              Lo emite el servidor de la transportista y no se edita: la
              sincronización lo usa para reconocerla.
            </p>
          </div>

          <div className='flex items-start justify-between gap-6 rounded-md border p-4'>
            <div className='space-y-1'>
              <Label htmlFor='agencia-hereda'>
                Usa la comisión de la empresa
              </Label>
              <p className='text-muted-foreground text-sm'>
                Encendido cobra lo que cobra {nombreEmpresa}. Apagado, se define
                acá abajo.
              </p>
            </div>
            <Switch
              id='agencia-hereda'
              checked={hereda}
              onCheckedChange={setHereda}
            />
          </div>

          <div className='space-y-1.5'>
            <Label
              htmlFor='agencia-comision'
              className={hereda ? 'text-muted-foreground' : undefined}
            >
              Comisión propia
            </Label>
            <Input
              id='agencia-comision'
              value={
                hereda
                  ? `${agencia.comisionEfectiva ?? 0} % — heredada de ${nombreEmpresa}`
                  : comision
              }
              onChange={(evento) => setComision(evento.target.value)}
              disabled={hereda}
              inputMode='decimal'
              placeholder='0'
            />
            {comisionInvalida && (
              <p className='text-destructive text-xs'>
                La comisión va de 0 a 100.
              </p>
            )}
          </div>

          <div className='flex items-start justify-between gap-6 rounded-md border p-4'>
            <div className='space-y-1'>
              <Label htmlFor='agencia-vende'>Vende pasajes</Label>
              <p className='text-muted-foreground text-sm'>
                Apagada, sus servicios no aparecen en la búsqueda. Los pasajes
                ya vendidos no se ven afectados.
              </p>
            </div>
            <Switch
              id='agencia-vende'
              checked={vende}
              onCheckedChange={setVende}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='ghost' onClick={onCerrar} disabled={actualizar.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={guardar}
            disabled={actualizar.isPending || comisionInvalida}
          >
            {actualizar.isPending ? 'Guardando…' : 'Guardar agencia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
