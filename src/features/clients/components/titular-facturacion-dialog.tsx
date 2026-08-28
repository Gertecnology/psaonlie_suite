import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useGuardarTitular } from '../hooks/use-libreta-facturacion'
import {
  resolverDocumento,
  type TitularDeFacturacion,
} from '../services/facturacion.service'

const schema = z.object({
  tipoDocumento: z.enum(['RUC', 'CI']),
  documento: z.string().min(1, 'El documento es requerido.'),
  razonSocial: z.string().min(1, 'La razón social es requerida.'),
  email: z
    .string()
    .email('El correo no es válido.')
    .or(z.literal(''))
    .optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  esPredeterminado: z.boolean(),
})

type Valores = z.infer<typeof schema>

const VACIO: Valores = {
  tipoDocumento: 'RUC',
  documento: '',
  razonSocial: '',
  email: '',
  direccion: '',
  telefono: '',
  esPredeterminado: false,
}

interface TitularFacturacionDialogProps {
  clienteId: string
  /** El titular que se corrige. Ausente al agregar uno nuevo. */
  titular?: TitularDeFacturacion | null
  open: boolean
  onOpenChange: (abierto: boolean) => void
}

/**
 * Cargar o corregir un titular de la libreta.
 *
 * Es un diálogo y no una pantalla porque son seis campos y se llega desde la
 * tabla que se está mirando; mandar a otra dirección para escribir una razón
 * social haría perder de vista la libreta entera.
 *
 * Alta y corrección son el mismo formulario porque son la misma operación para
 * el backend: busca por documento y actualiza lo que encuentre.
 */
export function TitularFacturacionDialog({
  clienteId,
  titular,
  open,
  onOpenChange,
}: TitularFacturacionDialogProps) {
  const guardar = useGuardarTitular(clienteId)
  const [consultando, setConsultando] = React.useState(false)
  const [origen, setOrigen] = React.useState<string | null>(null)

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: VACIO,
  })

  // El diálogo se monta una sola vez: sin esto, abrirlo para otro titular
  // mostraría los datos del anterior.
  React.useEffect(() => {
    if (!open) return

    setOrigen(null)
    form.reset(
      titular
        ? {
            tipoDocumento: titular.tipoDocumento === 'CI' ? 'CI' : 'RUC',
            documento: titular.documento,
            razonSocial: titular.razonSocial,
            email: titular.email ?? '',
            direccion: titular.direccion ?? '',
            telefono: titular.telefono ?? '',
            esPredeterminado: titular.esPredeterminado,
          }
        : VACIO
    )
  }, [open, titular, form])

  /**
   * Al terminar de escribir el documento se busca quién es.
   *
   * Primero en la libreta y después en el padrón, que es lo que evita tipear
   * una razón social a mano y equivocarse en una letra. Si no se encuentra, no
   * pasa nada: se escribe.
   */
  const buscarQuienEs = async () => {
    const documento = form.getValues('documento').trim()
    if (!documento || titular) return

    setConsultando(true)
    try {
      const encontrado = await resolverDocumento(clienteId, documento)
      if (!encontrado || encontrado.origen === 'no-encontrado') {
        setOrigen('no-encontrado')
        return
      }

      setOrigen(encontrado.origen)
      if (encontrado.razonSocial) {
        form.setValue('razonSocial', encontrado.razonSocial, {
          shouldDirty: true,
        })
      }
      if (encontrado.tipoDocumento) {
        form.setValue('tipoDocumento', encontrado.tipoDocumento)
      }
      if (encontrado.email) form.setValue('email', encontrado.email)
      if (encontrado.direccion) form.setValue('direccion', encontrado.direccion)
      if (encontrado.telefono) form.setValue('telefono', encontrado.telefono)
    } catch {
      // Que la consulta falle no impide cargar el titular a mano.
      setOrigen(null)
    } finally {
      setConsultando(false)
    }
  }

  const enviar = form.handleSubmit((valores) => {
    guardar.mutate(
      {
        ...valores,
        email: valores.email || undefined,
        direccion: valores.direccion || undefined,
        telefono: valores.telefono || undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {titular ? 'Corregir titular' : 'Agregar titular'}
          </DialogTitle>
          <DialogDescription>
            A nombre de quién se emite la factura. Puede ser el cliente, su
            empresa o un tercero.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id='titular-form' onSubmit={enviar} className='space-y-4'>
            <div className='grid grid-cols-3 gap-3'>
              <FormField
                control={form.control}
                name='tipoDocumento'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='RUC'>RUC</SelectItem>
                        <SelectItem value='CI'>CI</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='documento'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <FormLabel>Documento</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoFocus={!titular}
                        placeholder='80012345-6'
                        onBlur={() => {
                          field.onBlur()
                          void buscarQuienEs()
                        }}
                        // El documento identifica al titular: cambiarlo al
                        // corregir crearía otro en vez de arreglar éste.
                        readOnly={Boolean(titular)}
                        className={titular ? 'bg-muted' : undefined}
                      />
                    </FormControl>
                    {consultando && (
                      <FormDescription className='flex items-center gap-1.5'>
                        <Loader2 className='h-3 w-3 animate-spin' />
                        Buscando quién es…
                      </FormDescription>
                    )}
                    {!consultando && origen === 'padron' && (
                      <FormDescription>
                        Los datos vienen del padrón. Lo que corrijas acá manda
                        sobre lo que diga la DNIT.
                      </FormDescription>
                    )}
                    {!consultando && origen === 'libreta' && (
                      <FormDescription>
                        Este documento ya estaba en la libreta: se va a
                        actualizar.
                      </FormDescription>
                    )}
                    {!consultando && origen === 'no-encontrado' && (
                      <FormDescription>
                        No figura en el padrón. Cargá la razón social a mano.
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='razonSocial'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón social</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Gertecnology S.A.' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo de facturación</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='email'
                      placeholder='facturas@empresa.com'
                    />
                  </FormControl>
                  <FormDescription>
                    A dónde va la factura. Si se deja vacío se manda al correo
                    del cliente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-3'>
              <FormField
                control={form.control}
                name='direccion'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Opcional' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='telefono'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Opcional' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='esPredeterminado'
              render={({ field }) => (
                <FormItem className='flex items-center justify-between rounded-md border p-3'>
                  <div className='space-y-0.5'>
                    <FormLabel>Predeterminado</FormLabel>
                    <FormDescription>
                      Es el que se le ofrece primero al comprar.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={guardar.isPending}
          >
            Cancelar
          </Button>
          <Button
            type='submit'
            form='titular-form'
            disabled={guardar.isPending}
          >
            {guardar.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
