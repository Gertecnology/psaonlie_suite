import * as React from 'react'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout'
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
import { MultiSelect } from '@/components/ui/multi-select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useDestinationForm } from '../hooks/use-destination-form'
import { DestinationMapPicker } from './destination-map-picker'

interface DestinationFormProps {
  /** Absent when creating. */
  destinationId?: string
}

/**
 * Create or edit a destination, on its own page.
 *
 * It was a 600px side drawer. A drawer has no address: it cannot be shared as a
 * link, a reload loses it, and the back button closes the whole panel instead of
 * undoing the last step.
 *
 * Las tres secciones responden tres preguntas distintas —cómo se llama, dónde
 * queda, con qué paradas se corresponde—. Cuando eran campos sueltos uno abajo
 * del otro, nada decía que el selector de paradas es homologación y no un
 * adorno: por eso cada bloque explica su consecuencia arriba.
 *
 * All the logic lives in `use-destination-form`; this file only renders.
 */
export function DestinationForm({ destinationId }: DestinationFormProps) {
  const {
    form,
    save,
    saving,
    isEdit,
    paradaOptions,
    loadingOptions,
    loading,
    error,
    backToList,
    hasUnsavedChanges,
    precisionUbicacion,
  } = useDestinationForm(destinationId)

  const titulo = isEdit ? 'Editar destino' : 'Crear destino'

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
        <div className='max-w-3xl space-y-6'>
          <Skeleton className='h-40 w-full' />
          <Skeleton className='h-[420px] w-full' />
          <Skeleton className='h-32 w-full' />
        </div>
      </PageLayout>
    )
  }

  if (isEdit && error) {
    return (
      <PageLayout title={titulo} showSearch={false}>
        <div
          role='alert'
          className='border-destructive/50 text-destructive max-w-3xl rounded-md border p-6'
        >
          <p className='font-medium'>No se pudo cargar el destino</p>
          <p className='text-muted-foreground mt-1 text-sm'>{error.message}</p>
          <Button variant='outline' className='mt-4' asChild>
            <Link to='/destinations'>Volver al listado</Link>
          </Button>
        </div>
      </PageLayout>
    )
  }

  const cantidadParadas = form.watch('paradasHomologadasIds').length
  const latitud = form.watch('latitud')
  const longitud = form.watch('longitud')
  const coordenada =
    latitud !== null && longitud !== null
      ? { lat: latitud, lng: longitud }
      : null

  return (
    <PageLayout
      title={titulo}
      description={
        isEdit
          ? 'Modificá cómo se llama, dónde queda y qué paradas lo representan.'
          : 'Un destino agrupa las paradas que las empresas reportan con nombres distintos.'
      }
      showSearch={false}
      actions={
        <Button variant='ghost' size='sm' asChild>
          <Link to='/destinations'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Destinos
          </Link>
        </Button>
      }
    >
      <Form {...form}>
        {/* El submit vive en el <form>, así que Enter guarda desde cualquier
            campo — antes el botón estaba fuera y Enter no hacía nada. */}
        <form onSubmit={save} className='max-w-3xl space-y-6 pb-24'>
          <Card>
            <CardHeader>
              <CardTitle>Identificación</CardTitle>
              <CardDescription>
                El nombre es el que ve quien compra cuando elige origen y
                destino.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <FormField
                control={form.control}
                name='nombre'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del destino</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoFocus
                        placeholder='Ej: Asunción Terminal'
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
                      <FormLabel>Se ofrece en la búsqueda</FormLabel>
                      <FormDescription>
                        Apagado, el destino deja de aparecer cuando alguien
                        busca un pasaje. Los que ya lo compraron no se ven
                        afectados.
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

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='h-4 w-4' />
                Dónde queda
              </CardTitle>
              <CardDescription>
                Se usa para proponerle este destino como origen a quien entra a
                comprar desde cerca. Es opcional: sin ubicación el destino
                funciona igual, sólo que no aparece por cercanía.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name='latitud'
                render={() => (
                  <FormItem>
                    <FormControl>
                      <DestinationMapPicker
                        valor={coordenada}
                        precision={precisionUbicacion}
                        nombreDestino={form.watch('nombre')}
                        disabled={saving}
                        onChange={(nueva) => {
                          // Las dos coordenadas se mueven juntas, y con
                          // `shouldDirty` para que el aviso de cambios sin
                          // guardar cuente también mover el pin.
                          form.setValue('latitud', nueva?.lat ?? null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                          form.setValue('longitud', nueva?.lng ?? null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paradas homologadas</CardTitle>
              <CardDescription>
                Cada empresa reporta la misma parada con su propio nombre.
                Elegir una acá es decir «todas estas son este lugar».
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name='paradasHomologadasIds'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='sr-only'>
                      Paradas homologadas
                    </FormLabel>
                    <FormControl>
                      {/* Controlado por `value`: con `defaultValue` el selector se
                          quedaba con lo que hubiera al montar e ignoraba el registro
                          que llegaba después. */}
                      <MultiSelect
                        options={paradaOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={loadingOptions || saving}
                        placeholder={
                          loadingOptions
                            ? 'Cargando paradas...'
                            : 'Seleccioná las paradas...'
                        }
                        maxCount={10}
                      />
                    </FormControl>
                    <FormDescription>
                      {cantidadParadas === 0
                        ? 'Sin paradas todavía. El destino se puede guardar igual y homologarlo después.'
                        : `${cantidadParadas} parada${cantidadParadas === 1 ? '' : 's'} seleccionada${cantidadParadas === 1 ? '' : 's'}. Una parada que hoy está en otro destino se mueve a éste.`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Fija abajo: con el mapa en el medio, el formulario pasó a ser más
              alto que la pantalla y el botón de guardar quedaba fuera de vista. */}
          <div className='bg-background/95 fixed inset-x-0 bottom-0 border-t backdrop-blur md:left-(--sidebar-width)'>
            <div className='mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 md:px-8'>
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
              {hasUnsavedChanges && !saving && (
                <span className='text-muted-foreground ml-auto text-sm'>
                  Hay cambios sin guardar
                </span>
              )}
            </div>
          </div>
        </form>
      </Form>
    </PageLayout>
  )
}
