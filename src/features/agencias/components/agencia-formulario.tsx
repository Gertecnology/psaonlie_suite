import * as React from 'react'
import { ArrowLeft, ImagePlus } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { Badge } from '@/components/ui/badge'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { useFormularioAgencia } from '../hooks/use-formulario-agencia'

interface AgenciaFormularioProps {
  /** Absent when creating. */
  agenciaId?: string
}

/**
 * Create or edit a company, on its own page.
 *
 * It was a 400px side drawer holding a form with up to eleven fields. A drawer
 * has no address: it cannot be shared as a link, a reload loses it, and the
 * back button closes the whole panel instead of undoing the last step. On a
 * narrow screen the form was also just narrower, not simpler.
 *
 * All the logic lives in `use-formulario-agencia`; this file only renders.
 */
export function AgenciaFormulario({ agenciaId }: AgenciaFormularioProps) {
  const {
    form,
    guardar,
    guardando,
    esEdicion,
    esHija,
    heredaComision,
    comisionHeredada,
    cargando,
    error,
    vistaPreviaLogo,
    errorLogo,
    elegirLogo,
    volverAlListado,
    hayCambiosSinGuardar,
  } = useFormularioAgencia(agenciaId)

  const entradaArchivo = React.useRef<HTMLInputElement | null>(null)
  const titulo = esHija ? 'agencia' : 'empresa'

  // Un cierre accidental con el formulario a medias pierde todo lo cargado.
  React.useEffect(() => {
    if (!hayCambiosSinGuardar) return

    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [hayCambiosSinGuardar])

  if (cargando) {
    return (
      <PageLayout title='Editar empresa' showSearch={false}>
        <div className='max-w-2xl space-y-4'>
          <Skeleton className='h-20 w-20 rounded-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
      </PageLayout>
    )
  }

  if (error) {
    return (
      <PageLayout title='Editar empresa' showSearch={false}>
        <div
          role='alert'
          className='border-destructive/50 text-destructive max-w-2xl rounded-md border p-6'
        >
          <p className='font-medium'>No se pudo cargar la empresa</p>
          <p className='text-muted-foreground mt-1 text-sm'>{error.message}</p>
          <Button variant='outline' className='mt-4' asChild>
            <Link to='/agencias'>Volver al listado</Link>
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title={`${esEdicion ? 'Editar' : 'Crear'} ${titulo}`}
      description={
        esHija
          ? 'Las agencias las sincroniza el web service: su código, su stock y su conexión no se editan acá.'
          : 'La conexión al web service vive en la empresa. Sus agencias la heredan.'
      }
      showSearch={false}
      actions={
        <Button variant='ghost' size='sm' asChild>
          <Link to='/agencias'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Empresas y agencias
          </Link>
        </Button>
      }
    >
      <Form {...form}>
        {/* El submit vive en el <form>, así que Enter guarda desde cualquier
            campo — antes el botón estaba fuera y Enter no hacía nada. */}
        <form onSubmit={guardar} className='max-w-2xl space-y-6'>
          <div className='flex items-start gap-6'>
            <div className='space-y-2'>
              {/* Es un <button> y no un <div onClick>: así se llega con Tab y
                  se activa con Enter. Antes subir un logo era imposible sin
                  mouse. */}
              <button
                type='button'
                onClick={() => entradaArchivo.current?.click()}
                aria-label='Elegir el logo'
                className='border-accent bg-muted focus-visible:ring-ring group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 focus-visible:ring-2 focus-visible:outline-none'
              >
                {vistaPreviaLogo ? (
                  <img
                    src={vistaPreviaLogo}
                    alt=''
                    className='h-full w-full rounded-full object-cover'
                  />
                ) : (
                  <ImagePlus className='text-muted-foreground h-6 w-6' />
                )}
                <span className='absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'>
                  Cambiar
                </span>
              </button>
              <input
                ref={entradaArchivo}
                type='file'
                accept='image/jpeg,image/png,image/webp,image/svg+xml'
                className='sr-only'
                onChange={(evento) => elegirLogo(evento.target.files?.[0])}
              />
              {errorLogo && (
                <p className='text-destructive max-w-[10rem] text-xs'>
                  {errorLogo}
                </p>
              )}
            </div>

            <div className='flex-1'>
              <FormField
                control={form.control}
                name='nombre'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input {...field} autoFocus placeholder='La Ovetense' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {!esHija && (
            <fieldset className='space-y-4 rounded-md border p-4'>
              <legend className='px-1 text-sm font-medium'>
                Conexión al web service
              </legend>

              <FormField
                control={form.control}
                name='url'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder='http://empresa.dyndns.org/ws/wsdelta.asmx'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='usuario'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sólo al crear: la API no devuelve la contraseña, así que en
                  edición el campo llegaría vacío y guardarla la borraría. */}
              {!esEdicion && (
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          type='password'
                          autoComplete='new-password'
                        />
                      </FormControl>
                      <FormDescription>Mínimo 6 caracteres.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name='agenciaPrincipal'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agencia principal</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} placeholder='TRX' />
                    </FormControl>
                    <FormDescription>
                      El código de agencia con el que nos identificamos ante el
                      web service.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>
          )}

          <FormField
            control={form.control}
            name='descripcion'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='porcentajeVentas'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-2'>
                  Comisión sobre ventas
                  {heredaComision && <Badge variant='secondary'>Heredada</Badge>}
                </FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    step='0.01'
                    min='0'
                    max='100'
                    disabled={heredaComision}
                    value={
                      heredaComision
                        ? (comisionHeredada ?? '')
                        : (field.value ?? '')
                    }
                    onChange={(evento) =>
                      field.onChange(
                        evento.target.value === ''
                          ? undefined
                          : Number(evento.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  {heredaComision
                    ? 'Esta agencia cobra la comisión de su empresa. Para cambiarla, editá la empresa.'
                    : 'Porcentaje que se descuenta de la transferencia. No se le suma al cliente.'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='activo'
            render={({ field }) => (
              <FormItem className='flex items-center justify-between rounded-md border p-4'>
                <div className='space-y-0.5'>
                  <FormLabel>Activa</FormLabel>
                  <FormDescription>
                    Una empresa inactiva no aparece en la búsqueda de pasajes.
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
            <Button type='submit' disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button
              type='button'
              variant='ghost'
              onClick={volverAlListado}
              disabled={guardando}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </PageLayout>
  )
}
