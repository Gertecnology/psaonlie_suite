import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, MapPin } from 'lucide-react'
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
import { PageLayout } from '@/components/layout'
import { useDestinationForm } from '../hooks/use-destination-form'
import { DestinationMapPicker } from './destination-map-picker'
import { DestinationParadasTable } from './destination-paradas-table'

/**
 * Alto compartido por las dos tarjetas de arriba, de donde sale la simetría.
 *
 * `min-h` y no `h`: con alto fijo, la columna que tenga un campo más desborda
 * la tarjeta y su último control se monta sobre lo que sigue. Como el grid
 * estira las dos al alto de la más alta, la simetría se mantiene igual y
 * ninguna corta su contenido.
 */
const ALTO_DE_LA_FILA = 'lg:min-h-[460px]'

const ID_DEL_FORM = 'destino-form'

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
 * El nombre y el mapa van lado a lado y miden lo mismo: ubicar es la mitad del
 * trabajo de esta pantalla, y con el mapa apilado abajo quedaba fuera de vista
 * en cuanto la ventana era normal. El listado de paradas va debajo, a todo el
 * ancho, porque es tabla y no campo.
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
    nombreGuardado,
  } = useDestinationForm(destinationId)

  const titulo = isEdit ? (nombreGuardado ?? 'Editar destino') : 'Crear destino'

  // Un cierre accidental con el formulario a medias pierde todo lo cargado.
  React.useEffect(() => {
    if (!hasUnsavedChanges) return

    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [hasUnsavedChanges])

  if (loading) {
    return (
      <PageLayout title='Cargando destino…' showSearch={false}>
        <div className='space-y-5'>
          <div className='grid gap-5 lg:grid-cols-2'>
            <Skeleton className='h-[460px] w-full' />
            <Skeleton className='h-[460px] w-full' />
          </div>
          <Skeleton className='h-64 w-full' />
        </div>
      </PageLayout>
    )
  }

  if (isEdit && error) {
    return (
      <PageLayout title='Editar destino' showSearch={false}>
        <div
          role='alert'
          className='border-destructive/50 text-destructive max-w-2xl rounded-md border p-6'
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
          ? 'Editando un destino que ya existe.'
          : 'Un destino agrupa las paradas que las empresas reportan con nombres distintos.'
      }
      showSearch={false}
      actions={
        <div className='flex flex-col items-end gap-1'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/destinations'>
                <ArrowLeft className='mr-1.5 h-4 w-4' />
                Destinos
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
            {/* Fuera del <form> pero atado a él por id: así el botón puede vivir
                en el encabezado y seguir enviando. */}
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
                <CardTitle>Datos del destino</CardTitle>
                <CardDescription>
                  El nombre es el que ve quien compra cuando elige origen y
                  destino.
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
                          placeholder='Ej: Asunción Terminal'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='paradasHomologadasIds'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agregar una parada homologada</FormLabel>
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
                              ? 'Cargando paradas…'
                              : 'Buscar entre las paradas que reportan las empresas…'
                          }
                          maxCount={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Cada una que elijas aparece en el listado de abajo. Si
                        hoy está en otro destino, se mueve a éste.
                      </FormDescription>
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
                          Apagado, deja de aparecer cuando alguien busca un
                          pasaje. Los que ya compraron no se ven afectados.
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

            <Card
              className={`flex flex-col overflow-hidden ${ALTO_DE_LA_FILA}`}
            >
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MapPin className='h-4 w-4' />
                  Dónde queda
                </CardTitle>
                <CardDescription>
                  Se usa para proponer este destino como origen a quien compra
                  desde cerca. Es opcional.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex min-h-0 flex-1 flex-col'>
                <FormField
                  control={form.control}
                  name='latitud'
                  render={() => (
                    <FormItem className='flex min-h-0 flex-1 flex-col'>
                      <FormControl>
                        <DestinationMapPicker
                          valor={coordenada}
                          precision={precisionUbicacion}
                          disabled={saving}
                          alto='100%'
                          onChange={(nueva) => {
                            // `shouldDirty` para que el aviso de cambios sin
                            // guardar cuente también mover el pin.
                            form.setValue('latitud', nueva?.lat ?? null, {
                              shouldDirty: true,
                            })
                            form.setValue('longitud', nueva?.lng ?? null, {
                              shouldDirty: true,
                            })
                            // Se valida DESPUÉS de mover las dos, y las dos
                            // juntas. Con `shouldValidate` en cada `setValue`,
                            // el primero corría la regla de "las dos o ninguna"
                            // con la longitud todavía vieja y dejaba el error
                            // «La ubicación necesita las dos coordenadas»
                            // pegado en un formulario que ya estaba completo.
                            void form.trigger(['latitud', 'longitud'])
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card className='overflow-hidden'>
            <CardHeader>
              <CardTitle>Paradas homologadas</CardTitle>
              <CardDescription>
                Cada empresa reporta esta misma parada con su propio nombre.
                Todas son este lugar. El estado que se muestra es el de la
                empresa que la reporta.
              </CardDescription>
            </CardHeader>
            {destinationId ? (
              <DestinationParadasTable destinationId={destinationId} />
            ) : (
              <CardContent>
                <p className='text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm'>
                  El listado aparece una vez que el destino exista. Elegí las
                  paradas arriba y guardá.
                </p>
              </CardContent>
            )}
          </Card>
        </form>
      </Form>
    </PageLayout>
  )
}
