import * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout'
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
import { MultiSelect } from '@/components/ui/multi-select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDestinationForm } from '../hooks/use-destination-form'

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
        <div className='max-w-2xl space-y-6'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-32' />
        </div>
      </PageLayout>
    )
  }

  if (isEdit && error) {
    return (
      <PageLayout title={titulo} showSearch={false}>
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

  return (
    <PageLayout
      title={titulo}
      description={
        isEdit
          ? 'Modificá el nombre del destino y las paradas que lo representan.'
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
        <form onSubmit={save} className='max-w-2xl space-y-6'>
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
            name='paradasHomologadasIds'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paradas homologadas</FormLabel>
                <FormControl>
                  {/* Controlado por `value`: con `defaultValue` el selector se
                      quedaba con lo que hubiera al montar e ignoraba el registro
                      que llegaba después. */}
                  <MultiSelect
                    options={paradaOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loadingOptions}
                    placeholder={
                      loadingOptions
                        ? 'Cargando paradas...'
                        : 'Seleccioná las paradas...'
                    }
                    maxCount={10}
                  />
                </FormControl>
                <FormDescription>
                  Las paradas que las empresas reportan para este destino.
                </FormDescription>
                <FormMessage />
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
