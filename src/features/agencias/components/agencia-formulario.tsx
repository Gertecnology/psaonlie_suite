import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ImagePlus } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { PageLayout } from '@/components/layout/page-layout'
import { useFormularioAgencia } from '../hooks/use-formulario-agencia'
import { EmpresaAgenciasTable } from './empresa-agencias-table'

/**
 * Alto compartido por las dos tarjetas de arriba, de donde sale la simetría.
 *
 * `min-h` y no `h`: con alto fijo, la columna que tenga un campo más desborda
 * la tarjeta y su último control se monta sobre lo que sigue. Como el grid
 * estira las dos al alto de la más alta, la simetría se mantiene igual y
 * ninguna corta su contenido.
 */
const ALTO_DE_LA_FILA = 'lg:min-h-[520px]'

const ID_DEL_FORM = 'empresa-form'

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
    nombreGuardado,
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

  const titulacion = esEdicion
    ? (nombreGuardado ?? `Editar ${titulo}`)
    : `Crear ${titulo}`

  return (
    <PageLayout
      title={titulacion}
      description={
        esHija
          ? 'Las agencias las sincroniza el web service: su código, su stock y su conexión no se editan acá.'
          : esEdicion
            ? 'Editando una empresa que ya existe.'
            : 'La conexión al web service vive en la empresa. Sus agencias la heredan.'
      }
      showSearch={false}
      actions={
        <div className='flex flex-col items-end gap-1'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/agencias'>
                <ArrowLeft className='mr-1.5 h-4 w-4' />
                Empresas
              </Link>
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={volverAlListado}
              disabled={guardando}
            >
              Cancelar
            </Button>
            {/* Fuera del <form> pero atado a él por id: así el botón vive en el
                encabezado y sigue enviando. */}
            <Button type='submit' form={ID_DEL_FORM} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
          {hayCambiosSinGuardar && !guardando && (
            <span className='text-muted-foreground text-xs'>
              Hay cambios sin guardar
            </span>
          )}
        </div>
      }
    >
      <Form {...form}>
        <form id={ID_DEL_FORM} onSubmit={guardar} className='space-y-5'>
          <div className={esHija ? 'max-w-2xl' : `grid gap-5 lg:grid-cols-2`}>
            <Card
              className={
                esHija ? undefined : `flex flex-col ${ALTO_DE_LA_FILA}`
              }
            >
              <CardHeader>
                <CardTitle>Datos de la empresa</CardTitle>
                <CardDescription>
                  El nombre es el que ve quien compra, en el pasaje y en los
                  resultados.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1 space-y-5'>
                <div className='space-y-2'>
                  <FormLabel>Logo</FormLabel>
                  <div className='flex items-center gap-4'>
                    {/* Es un <button> y no un <div onClick>: así se llega con Tab
                        y se activa con Enter. Antes subir un logo era imposible
                        sin mouse. */}
                    <button
                      type='button'
                      onClick={() => entradaArchivo.current?.click()}
                      aria-label='Elegir el logo'
                      className='border-accent bg-muted focus-visible:ring-ring group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 focus-visible:ring-2 focus-visible:outline-none'
                    >
                      {vistaPreviaLogo ? (
                        <img
                          src={vistaPreviaLogo}
                          alt=''
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <ImagePlus className='text-muted-foreground h-5 w-5' />
                      )}
                      <span className='absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'>
                        Cambiar
                      </span>
                    </button>
                    <p className='text-muted-foreground text-sm'>
                      Se ve en el pasaje y en los resultados de búsqueda.
                    </p>
                  </div>
                  <input
                    ref={entradaArchivo}
                    type='file'
                    accept='image/jpeg,image/png,image/webp,image/svg+xml'
                    className='sr-only'
                    onChange={(evento) => elegirLogo(evento.target.files?.[0])}
                  />
                  {errorLogo && (
                    <p className='text-destructive text-xs'>{errorLogo}</p>
                  )}
                </div>

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
                          placeholder='Opcional — para distinguirla internamente'
                        />
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
                        {heredaComision && (
                          <Badge variant='secondary'>Heredada</Badge>
                        )}
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
                                : Number(evento.target.value)
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {heredaComision
                          ? 'Esta agencia cobra la comisión de su empresa. Para cambiarla, editá la empresa.'
                          : 'Sus agencias la heredan, salvo que tengan una propia. Se descuenta de la transferencia; no se le suma al cliente.'}
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
                        <FormLabel>Vende pasajes</FormLabel>
                        <FormDescription>
                          Apagada, sus servicios dejan de aparecer en la
                          búsqueda. Los pasajes ya vendidos no se ven afectados.
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

            {!esHija && (
              <Card className={`flex flex-col ${ALTO_DE_LA_FILA}`}>
                <CardHeader>
                  <CardTitle>Conexión al web service</CardTitle>
                  <CardDescription>
                    De acá salen los horarios, las butacas y los precios. Si
                    falla, la empresa no vende.
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex-1 space-y-5'>
                  <FormField
                    control={form.control}
                    name='url'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL del servicio</FormLabel>
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
                              type='password'
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Mínimo 6 caracteres.
                          </FormDescription>
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
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            placeholder='TRX'
                          />
                        </FormControl>
                        <FormDescription>
                          El código con el que el web service identifica a esta
                          conexión.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* El listado sólo tiene sentido en una empresa que ya existe: las
              agencias las trae la sincronización después de crearla. */}
          {esEdicion && !esHija && agenciaId && (
            <Card className='overflow-hidden'>
              <CardHeader>
                <CardTitle>Agencias de esta empresa</CardTitle>
                <CardDescription>
                  Cada una vende con el mismo web service y hereda la comisión,
                  salvo que tenga una propia. Las da de alta la sincronización.
                </CardDescription>
              </CardHeader>
              <EmpresaAgenciasTable
                empresaId={agenciaId}
                nombreEmpresa={nombreGuardado ?? 'la empresa'}
              />
            </Card>
          )}
        </form>
      </Form>
    </PageLayout>
  )
}
