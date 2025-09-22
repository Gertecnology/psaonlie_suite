import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useServiceChargeDialog } from '../store/use-service-charge-dialog'
import { type CreateServiceChargeFormValues } from '../models/service-charge.model'
import { useCreateServiceCharge } from '../hooks/use-create-service-charge'
import { useUpdateServiceCharge } from '../hooks/use-update-service-charge'

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido.'),
  descripcion: z.string().nullable().optional(),
  porcentaje: z.string().min(1, 'El porcentaje es requerido.').optional(),
  activo: z.boolean(),
  esGlobal: z.boolean(),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida.'),
  fechaFin: z.string().min(1, 'La fecha de fin es requerida.'),
  tipoAplicacion: z.enum(['PORCENTUAL', 'FIJO']),
  montoFijo: z.number().min(0, 'El monto fijo debe ser mayor o igual a 0').optional(),
  montoMinimo: z.number().min(0, 'El monto mínimo debe ser mayor o igual a 0').optional(),
  montoMaximo: z.number().min(0, 'El monto máximo debe ser mayor o igual a 0').optional(),
})

type FormValues = z.infer<typeof formSchema>

export function ServiceChargeMutateDrawer() {
  const { open: isOpen, close, data: serviceCharge } = useServiceChargeDialog()
  const createServiceCharge = useCreateServiceCharge()
  const updateServiceCharge = useUpdateServiceCharge()

  const isUpdate = !!serviceCharge && !!serviceCharge.id

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      porcentaje: '',
      activo: true,
      esGlobal: false,
      fechaInicio: '',
      fechaFin: '',
      tipoAplicacion: 'PORCENTUAL',
      montoFijo: undefined,
      montoMinimo: undefined,
      montoMaximo: undefined,
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (isUpdate && serviceCharge) {
        form.reset({
          nombre: serviceCharge.nombre,
          descripcion: serviceCharge.descripcion || '',
          porcentaje: serviceCharge.porcentaje || '',
          activo: serviceCharge.activo,
          esGlobal: serviceCharge.esGlobal,
          fechaInicio: serviceCharge.fechaInicio || '',
          fechaFin: serviceCharge.fechaFin || '',
          tipoAplicacion: serviceCharge.tipoAplicacion,
          montoFijo: serviceCharge.montoFijo || undefined,
          montoMinimo: serviceCharge.montoMinimo || undefined,
          montoMaximo: serviceCharge.montoMaximo || undefined,
        })
      } else {
        form.reset({
          nombre: '',
          descripcion: '',
          porcentaje: '',
          activo: true,
          esGlobal: false,
          fechaInicio: '',
          fechaFin: '',
          tipoAplicacion: 'PORCENTUAL',
          montoFijo: undefined,
          montoMinimo: undefined,
          montoMaximo: undefined,
        })
      }
    }
  }, [isOpen, isUpdate, serviceCharge, form])

  const onSubmit = (data: FormValues) => {
    if (isUpdate && serviceCharge?.id) {
      updateServiceCharge.mutate(
        { id: serviceCharge.id, data },
        {
          onSuccess: () => {
            close()
            import('sonner').then(({ toast }) => {
              toast.success('Cargo por servicio actualizado', {
                description: 'El cargo por servicio se ha actualizado correctamente.',
                duration: 3000,
              })
            })
          },
          onError: (error: unknown) => {
            import('sonner').then(({ toast }) => {
              let message = 'Ha ocurrido un error al actualizar el cargo por servicio.'
              if (error instanceof Error) {
                message = error.message
              } else if (typeof error === 'string') {
                message = error
              }
              toast.error('Error al actualizar', {
                description: message,
                duration: 3000,
              })
            })
          },
        }
      )
    } else {
      const createData: CreateServiceChargeFormValues = {
        ...data,
        descripcion: data.descripcion || null,
        porcentaje: data.porcentaje || null,
        montoFijo: data.montoFijo,
        montoMinimo: data.montoMinimo,
        montoMaximo: data.montoMaximo,
      }
      
      createServiceCharge.mutate(createData, {
        onSuccess: () => {
          close()
          import('sonner').then(({ toast }) => {
            toast.success('Cargo por servicio creado', {
              description: 'El cargo por servicio se ha creado correctamente.',
              duration: 3000,
            })
          })
        },
        onError: (error: unknown) => {
          import('sonner').then(({ toast }) => {
            let message = 'Ha ocurrido un error al crear el cargo por servicio.'
            if (error instanceof Error) {
              message = error.message
            } else if (typeof error === 'string') {
              message = error
            }
            toast.error('Error al crear', {
              description: message,
              duration: 3000,
            })
          })
        },
      })
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className='flex flex-col overflow-y-auto'>
        <SheetHeader className='text-left'>
          <SheetTitle>
            {isUpdate ? 'Actualizar' : 'Crear'} Cargo por Servicio
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Actualiza el cargo por servicio con la información necesaria.'
              : 'Añade un nuevo cargo por servicio con la información necesaria.'}
            Haz click en guardar cuando hayas terminado.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='service-charge-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-5 px-4'
          >
            <FormField
              control={form.control}
              name='nombre'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='Ingresa un nombre' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name='descripcion'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder='Ingresa una descripción'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='tipoAplicacion'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Tipo de Aplicación</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Selecciona un tipo' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='PORCENTUAL'>Porcentual</SelectItem>
                      <SelectItem value='FIJO'>Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='porcentaje'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Porcentaje</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      step='0.01'
                      value={field.value ?? ''}
                      placeholder='Ingresa un porcentaje'
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='montoFijo'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Monto Fijo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      step='0.01'
                      value={field.value ?? ''}
                      placeholder='Ingresa un monto fijo'
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='montoMinimo'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Monto Mínimo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      step='0.01'
                      value={field.value ?? ''}
                      placeholder='Ingresa un monto mínimo'
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='montoMaximo'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Monto Máximo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      step='0.01'
                      value={field.value ?? ''}
                      placeholder='Ingresa un monto máximo'
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='fechaInicio'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type='date'
                        placeholder='Selecciona una fecha'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='fechaFin'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Fecha de Fin</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type='date'
                        placeholder='Selecciona una fecha'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='esGlobal'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                  <div className='space-y-0.5'>
                    <FormLabel>Es Global</FormLabel>
                    <FormDescription>
                      Indica si el cargo se aplica globalmente.
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

            <FormField
              control={form.control}
              name='activo'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
                  <div className='space-y-0.5'>
                    <FormLabel>Activo</FormLabel>
                    <FormDescription>
                      Indica si el cargo por servicio está activo.
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
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline' disabled={createServiceCharge.isPending || updateServiceCharge.isPending}>
              Cerrar
            </Button>
          </SheetClose>
          <Button 
            form='service-charge-form' 
            type='submit'
            disabled={createServiceCharge.isPending || updateServiceCharge.isPending}
          >
            {createServiceCharge.isPending || updateServiceCharge.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
