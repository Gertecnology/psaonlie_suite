import * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useServiceChargeForm } from '../hooks/use-service-charge-form'

interface ServiceChargeFormProps {
  /** Absent when creating. */
  serviceChargeId?: string
}

/**
 * Create or edit a service charge, on its own page.
 *
 * It was a side drawer with up to nine fields and a save button parked in the
 * footer, outside the `<form>`. A drawer has no address: it cannot be linked,
 * a reload loses it, and the back button closes the whole panel instead of
 * undoing the last step.
 *
 * All the logic lives in `use-service-charge-form`; this file only renders.
 */
export function ServiceChargeForm({ serviceChargeId }: ServiceChargeFormProps) {
  const {
    form,
    save,
    saving,
    isEdit,
    tipoAplicacion,
    loading,
    error,
    backToList,
    hasUnsavedChanges,
  } = useServiceChargeForm(serviceChargeId)

  const titulo = isEdit ? 'Editar cargo por servicio' : 'Nuevo cargo por servicio'

  // Un cierre accidental con el formulario a medias pierde todo lo cargado.
  React.useEffect(() => {
    if (!hasUnsavedChanges) return

    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [hasUnsavedChanges])

  if (loading) {
    return (
      <PageLayout title={titulo} showSearch={false}>
        <div className='max-w-2xl space-y-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout title={titulo} showSearch={false}>
        <div
          role='alert'
          className='border-destructive/50 text-destructive max-w-2xl rounded-md border p-6'
        >
          <p className='font-medium'>No se pudo cargar el cargo por servicio</p>
          <p className='text-muted-foreground mt-1 text-sm'>{error.message}</p>
          <Button variant='outline' className='mt-4' asChild>
            <Link to='/settings/service-charges'>Volver al listado</Link>
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={titulo}
      description='Los cargos por servicio se suman al precio del pasaje dentro de su ventana de vigencia.'
      showSearch={false}
      actions={
        <Button variant='ghost' size='sm' asChild>
          <Link to='/settings/service-charges'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Cargos por servicio
          </Link>
        </Button>
      }
    >
      <Form {...form}>
        {/* El submit vive en el <form>, así que Enter guarda desde cualquier
            campo — antes el botón estaba en el pie del drawer, fuera del
            formulario. */}
        <form onSubmit={save} className='max-w-2xl space-y-6'>
          <FormField
            control={form.control}
            name='nombre'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} autoFocus placeholder='Cargo por emisión' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='descripcion'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input {...field} placeholder='Para qué se cobra este cargo' />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='tipoAplicacion'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de aplicación</FormLabel>
                {/* `value` y no `defaultValue`: con `defaultValue` el Select
                    queda no controlado y no refleja lo que el formulario
                    carga al editar. */}
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Elegí un tipo' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='PORCENTUAL'>Porcentual</SelectItem>
                    <SelectItem value='FIJO'>Fijo</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Un cargo porcentual se calcula sobre el precio del pasaje; uno
                  fijo suma siempre el mismo monto.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {tipoAplicacion === 'PORCENTUAL' && (
            <FormField
              control={form.control}
              name='porcentaje'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porcentaje</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      step='0.01'
                      min='0'
                      max='100'
                      placeholder='5'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {tipoAplicacion === 'FIJO' && (
            <fieldset className='space-y-4 rounded-md border p-4'>
              <legend className='px-1 text-sm font-medium'>Montos</legend>

              <FormField
                control={form.control}
                name='montoFijo'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto fijo</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        min='0'
                        value={field.value ?? ''}
                        onChange={(evento) =>
                          field.onChange(
                            evento.target.value === ''
                              ? undefined
                              : Number(evento.target.value),
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        placeholder='10000'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='montoMinimo'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto mínimo</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          min='0'
                          value={field.value ?? ''}
                          onChange={(evento) =>
                            field.onChange(
                              evento.target.value === ''
                                ? undefined
                                : Number(evento.target.value),
                            )
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>Opcional.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='montoMaximo'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto máximo</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.01'
                          min='0'
                          value={field.value ?? ''}
                          onChange={(evento) =>
                            field.onChange(
                              evento.target.value === ''
                                ? undefined
                                : Number(evento.target.value),
                            )
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>Opcional.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </fieldset>
          )}

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='fechaInicio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de inicio</FormLabel>
                  <FormControl>
                    <Input {...field} type='date' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='fechaFin'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de fin</FormLabel>
                  <FormControl>
                    <Input {...field} type='date' />
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
              <FormItem className='flex items-center justify-between rounded-md border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel>Global</FormLabel>
                  <FormDescription>
                    Un cargo global se aplica a todas las empresas, sin tener que
                    asignarlo una por una.
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
              <FormItem className='flex items-center justify-between rounded-md border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel>Activo</FormLabel>
                  <FormDescription>
                    Un cargo inactivo no se suma al precio, aunque esté vigente.
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

          <div className='flex items-center gap-3 border-t pt-4'>
            <Button type='submit' disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button
              type='button'
              variant='ghost'
              onClick={backToList}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  )
}
