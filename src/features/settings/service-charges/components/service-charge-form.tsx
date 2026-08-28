import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { PageLayout } from '@/components/layout/page-layout'
import { useServiceChargeForm } from '../hooks/use-service-charge-form'

/** Alto compartido por las dos tarjetas de arriba, de donde sale la simetría. */
const ALTO_DE_LA_FILA = 'lg:min-h-[520px]'

const ID_DEL_FORM = 'cargo-form'

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
    nombreGuardado,
    empresas,
  } = useServiceChargeForm(serviceChargeId)

  const titulo = isEdit
    ? 'Editar cargo por servicio'
    : 'Nuevo cargo por servicio'

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

  const esGlobal = form.watch('esGlobal')

  return (
    <PageLayout
      title={isEdit ? (nombreGuardado ?? titulo) : titulo}
      description={
        isEdit
          ? 'Editando un cargo que ya existe.'
          : 'Se suma al precio del pasaje dentro de su ventana de vigencia.'
      }
      showSearch={false}
      actions={
        <div className='flex flex-col items-end gap-1'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/settings/service-charges'>
                <ArrowLeft className='mr-1.5 h-4 w-4' />
                Cargos
              </Link>
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={backToList}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type='submit' form={ID_DEL_FORM} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
          {hasUnsavedChanges && !saving && (
            <span className='text-muted-foreground text-xs'>
              Hay cambios sin guardar
            </span>
          )}
        </div>
      }
    >
      <Form {...form}>
        <form id={ID_DEL_FORM} onSubmit={save} className='space-y-5'>
          <div className='grid gap-5 lg:grid-cols-2'>
            <Card className={`flex flex-col ${ALTO_DE_LA_FILA}`}>
              <CardHeader>
                <CardTitle>Qué es</CardTitle>
                <CardDescription>
                  El nombre aparece en el desglose que ve quien compra.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1 space-y-5'>
                <FormField
                  control={form.control}
                  name='nombre'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoFocus
                          placeholder='Cargo estándar'
                        />
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
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder='Opcional'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='activo'
                  render={({ field }) => (
                    <FormItem className='flex items-start justify-between gap-6 rounded-md border p-4'>
                      <div className='space-y-1'>
                        <FormLabel>Se aplica</FormLabel>
                        <FormDescription>
                          Apagado, deja de sumarse a las ventas nuevas. Las ya
                          hechas no cambian.
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
                  name='esGlobal'
                  render={({ field }) => (
                    <FormItem className='flex items-start justify-between gap-6 rounded-md border p-4'>
                      <div className='space-y-1'>
                        <FormLabel>Vale para todas las empresas</FormLabel>
                        <FormDescription>
                          Encendido, no hace falta asignarlo una por una.
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
              </CardContent>
            </Card>

            <Card className={`flex flex-col ${ALTO_DE_LA_FILA}`}>
              <CardHeader>
                <CardTitle>Cuánto cobra</CardTitle>
                <CardDescription>
                  Se le suma al cliente sobre el precio del pasaje.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1 space-y-5'>
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='tipoAplicacion'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de cálculo</FormLabel>
                        {/* `value` y no `defaultValue`: con `defaultValue` el
                            Select queda no controlado y no refleja lo que el
                            formulario carga al editar. */}
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Elegí un tipo' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='PORCENTUAL'>
                              Porcentual
                            </SelectItem>
                            <SelectItem value='FIJO'>Fijo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {tipoAplicacion === 'PORCENTUAL' ? (
                    <FormField
                      control={form.control}
                      name='porcentaje'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Porcentaje</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
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
                  ) : (
                    <FormField
                      control={form.control}
                      name='montoFijo'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monto</FormLabel>
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
                                    : Number(evento.target.value)
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
                  )}
                </div>

                {/* Piso y techo valen para los dos tipos: un porcentual sobre un
                    pasaje caro puede pasarse, y sobre uno barato quedarse corto.
                    Antes sólo aparecían con el cargo fijo, donde no tienen
                    ningún sentido —el monto ya es fijo—. */}
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='montoMinimo'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mínimo</FormLabel>
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
                                  : Number(evento.target.value)
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            placeholder='Sin piso'
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
                      <FormItem>
                        <FormLabel>Máximo</FormLabel>
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
                                  : Number(evento.target.value)
                              )
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            placeholder='Sin techo'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='fechaInicio'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desde</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            type='date'
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
                      <FormItem>
                        <FormLabel>Hasta</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            type='date'
                          />
                        </FormControl>
                        <FormDescription>Vacío, no vence.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Las empresas asignadas no se veían en ningún lado: se elegían desde
              un menú de la fila del listado y ahí terminaba el rastro. */}
          {isEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Empresas que lo aplican</CardTitle>
                <CardDescription>
                  {esGlobal
                    ? 'Vale para todas, así que no hace falta asignarlo una por una.'
                    : 'Sólo se cobra en las ventas de estas empresas.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {esGlobal ? (
                  <p className='text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm'>
                    Este cargo vale para todas las empresas.
                  </p>
                ) : empresas.length === 0 ? (
                  <p className='text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm'>
                    Todavía no se lo asignó a ninguna empresa, así que hoy no se
                    cobra en ninguna venta.
                  </p>
                ) : (
                  <div className='flex flex-wrap gap-2'>
                    {empresas.map((empresa) => (
                      <Badge key={empresa.id} variant='secondary'>
                        {empresa.nombre}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </form>
      </Form>
    </PageLayout>
  )
}
