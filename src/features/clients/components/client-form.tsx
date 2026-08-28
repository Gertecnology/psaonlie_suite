import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Link2Off } from 'lucide-react'
import { formatearFechaCorta, formatearGuaranies } from '@/lib/formato'
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
import { Textarea } from '@/components/ui/textarea'
import { PageLayout } from '@/components/layout'
import { useClientForm } from '../hooks/use-client-form'
import { useClienteConEstadisticas } from '../hooks/use-clients'
import { ClientDetalleTabs } from './client-detalle-tabs'
import { EmpresaSearch } from './empresa-search'

/** Alto compartido por las dos tarjetas del formulario, de donde sale la simetría. */
const ALTO_DE_LA_FILA = 'lg:min-h-[520px]'

const ID_DEL_FORM = 'cliente-form'

const NACIONALIDADES = [
  'Paraguaya',
  'Argentina',
  'Brasileña',
  'Uruguaya',
  'Chilena',
  'Boliviana',
  'Peruana',
  'Colombiana',
  'Venezolana',
  'Ecuatoriana',
  'Mexicana',
  'Estadounidense',
  'Española',
  'Italiana',
  'Alemana',
  'Otro',
]

const OCUPACIONES = [
  'Estudiante',
  'Empleado',
  'Profesional',
  'Empresario',
  'Docente',
  'Médico',
  'Ingeniero',
  'Abogado',
  'Contador',
  'Comerciante',
  'Técnico',
  'Obrero',
  'Agricultor',
  'Jubilado',
  'Ama de casa',
  'Desempleado',
  'Otro',
]

interface ClientFormProps {
  /** Absent when creating. The API identifies a client by email. */
  email?: string
}

interface ResumenProps {
  compras: number
  pagadas: number
  montoPagado: number
  ultimaCompra?: string
  cargando: boolean
}

/**
 * Lo que el cliente lleva comprado, sobre el formulario.
 *
 * Va arriba y no en una pestaña porque es el contexto con el que se leen sus
 * datos: quien abre la ficha de alguien que compró treinta veces la corrige
 * con otro cuidado que la de alguien que nunca compró.
 */
function ResumenDeCompras({
  compras,
  pagadas,
  montoPagado,
  ultimaCompra,
  cargando,
}: ResumenProps) {
  if (cargando) {
    return (
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {[0, 1, 2, 3].map((posicion) => (
          <Skeleton key={posicion} className='h-[86px] w-full' />
        ))}
      </div>
    )
  }

  const celdas = [
    { titulo: 'Compras', valor: String(compras), pie: 'En total' },
    {
      titulo: 'Pagadas',
      valor: String(pagadas),
      pie:
        compras > 0
          ? `${Math.round((pagadas / compras) * 100)}% del total`
          : 'Sin compras',
    },
    {
      titulo: 'Monto pagado',
      valor: formatearGuaranies(montoPagado),
      pie: 'Acumulado',
    },
    {
      titulo: 'Última compra',
      valor: ultimaCompra ? formatearFechaCorta(ultimaCompra) : '—',
      pie: ultimaCompra ? 'Fecha de la venta' : 'Todavía no compró',
    },
  ]

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
      {celdas.map((celda) => (
        <Card key={celda.titulo}>
          <CardContent className='pt-6'>
            <p className='text-muted-foreground text-sm font-medium'>
              {celda.titulo}
            </p>
            <p className='mt-1 text-2xl font-bold tabular-nums'>
              {celda.valor}
            </p>
            <p className='text-muted-foreground mt-1 text-xs'>{celda.pie}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * La ficha de un cliente: sus datos, su libreta de facturación y sus compras.
 *
 * Antes eran dos pantallas distintas — un formulario en `/clients/:email` y una
 * pantalla de detalle que se abría desde el menú de la fila — que mostraban al
 * mismo cliente y no se podía pasar de una a la otra. Ver un dato y corregirlo
 * son el mismo gesto, así que son la misma pantalla.
 *
 * Toda la lógica del formulario vive en `use-client-form`; esto sólo dibuja.
 */
export function ClientForm({ email }: ClientFormProps) {
  const {
    form,
    save,
    saving,
    isEdit,
    companies,
    loadingCompanies,
    documentTypes,
    loadingDocumentTypes,
    agenciaId,
    loading,
    error,
    backToList,
    hasUnsavedChanges,
  } = useClientForm(email)

  // Los totales de compras no vienen con el cliente: sólo existen en el
  // listado. La ficha no depende de ellos para funcionar, así que su carga y su
  // error se quedan dentro del resumen.
  const conEstadisticas = useClienteConEstadisticas(isEdit ? (email ?? '') : '')
  const estadisticas = conEstadisticas.data?.estadisticasVentas
  const clienteId = conEstadisticas.data?.cliente.id

  const nombreGuardado = conEstadisticas.data?.cliente.nombreCompleto
  const titulo = isEdit ? (nombreGuardado ?? 'Cliente') : 'Nuevo cliente'

  // Hasta que no haya empresa no se sabe qué documentos acepta, así que los
  // campos del alta esperan. En edición no aplica: el cliente ya tiene empresa.
  const esperandoEmpresa = !isEdit && !agenciaId

  // Un cierre accidental con el formulario a medias pierde todo lo cargado.
  React.useEffect(() => {
    if (!hasUnsavedChanges) return

    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [hasUnsavedChanges])

  if (loading) {
    return (
      <PageLayout title='Cargando cliente…' showSearch={false}>
        <div className='space-y-5'>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {[0, 1, 2, 3].map((posicion) => (
              <Skeleton key={posicion} className='h-[86px] w-full' />
            ))}
          </div>
          <div className='grid gap-5 lg:grid-cols-2'>
            <Skeleton className='h-[520px] w-full' />
            <Skeleton className='h-[520px] w-full' />
          </div>
        </div>
      </PageLayout>
    )
  }

  if (isEdit && error) {
    return (
      <PageLayout title='Cliente' showSearch={false}>
        <div
          role='alert'
          className='border-destructive/50 text-destructive max-w-2xl rounded-md border p-6'
        >
          <p className='font-medium'>No se pudo cargar el cliente</p>
          <p className='text-muted-foreground mt-1 text-sm'>{error.message}</p>
          <Button variant='outline' className='mt-4' asChild>
            <Link to='/clients'>Volver al listado</Link>
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
          ? 'Sus datos, a quién factura y qué compró. La empresa y el documento se definieron al darlo de alta.'
          : 'El alta se sincroniza con el web service de la empresa, así que puede tardar.'
      }
      showSearch={false}
      actions={
        <div className='flex flex-col items-end gap-1'>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='sm' asChild>
              <Link to='/clients'>
                <ArrowLeft className='mr-1.5 h-4 w-4' />
                Clientes
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
            <Button
              type='submit'
              form={ID_DEL_FORM}
              disabled={saving || esperandoEmpresa}
            >
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
      <div className='space-y-5'>
        {isEdit && (
          <ResumenDeCompras
            compras={estadisticas?.totalVentas ?? 0}
            pagadas={estadisticas?.ventasPagadas ?? 0}
            montoPagado={estadisticas?.montoTotalPagado ?? 0}
            ultimaCompra={estadisticas?.ultimaVenta}
            cargando={conEstadisticas.isLoading}
          />
        )}

        <Form {...form}>
          {/* El submit vive en el <form>, así que Enter guarda desde cualquier
              campo. */}
          <form id={ID_DEL_FORM} onSubmit={save} className='space-y-5'>
            {/* La empresa sólo se elige al crear: la API de actualización no la
                acepta y el cliente ya está asociado a una. Va arriba y a todo
                el ancho porque decide qué documentos aceptan los campos de
                abajo. */}
            {!isEdit && (
              <Card>
                <CardHeader>
                  <CardTitle>Con qué empresa se da de alta</CardTitle>
                  <CardDescription>
                    Define qué tipos de documento se pueden usar y contra qué
                    web service se sincroniza el alta.
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-5 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='agenciaId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa</FormLabel>
                        <FormControl>
                          <EmpresaSearch
                            empresas={companies}
                            isLoading={loadingCompanies}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder='Buscar empresa...'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='tipoDocumento'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de documento</FormLabel>
                        {/* `value` y no `defaultValue`: así el select refleja lo
                            que tiene el formulario, incluso cuando se limpia al
                            cambiar de empresa. */}
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={esperandoEmpresa || loadingDocumentTypes}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Seleccioná el tipo' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {documentTypes && documentTypes.length > 0 ? (
                              documentTypes.map((tipo) => (
                                <SelectItem key={tipo.id} value={tipo.codigo}>
                                  {tipo.descripcion}
                                </SelectItem>
                              ))
                            ) : (
                              <p className='text-muted-foreground px-2 py-1.5 text-sm'>
                                {loadingDocumentTypes
                                  ? 'Cargando tipos de documento...'
                                  : 'No hay tipos disponibles.'}
                              </p>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='numeroDocumento'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de documento</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder='Ingresá el número'
                            disabled={esperandoEmpresa}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            <div className='grid gap-5 lg:grid-cols-2'>
              <Card className={`flex flex-col ${ALTO_DE_LA_FILA}`}>
                <CardHeader>
                  <CardTitle>Quién es</CardTitle>
                  <CardDescription>
                    Cómo se llama y por dónde se lo ubica. Es lo que sale
                    impreso en el pasaje.
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex-1 space-y-5'>
                  <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
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
                              placeholder='Ingresá el nombre'
                              disabled={esperandoEmpresa}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='apellido'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder='Ingresá el apellido'
                              disabled={esperandoEmpresa}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          {/* En edición es de sólo lectura: es la clave con la
                              que la API identifica al cliente, así que cambiarlo
                              acá no lo renombraría, guardaría contra el email
                              viejo. */}
                          <Input
                            {...field}
                            type='email'
                            placeholder='Ingresá el email'
                            readOnly={isEdit}
                            disabled={esperandoEmpresa}
                            className={isEdit ? 'bg-muted' : undefined}
                          />
                        </FormControl>
                        {isEdit && (
                          <FormDescription>
                            El email identifica al cliente y no se puede
                            cambiar.
                          </FormDescription>
                        )}
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
                          <Input
                            {...field}
                            type='tel'
                            placeholder='Ej: +595981123456'
                            disabled={esperandoEmpresa}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='fechaNacimiento'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de nacimiento</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type='date'
                              disabled={esperandoEmpresa}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='sexo'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sexo</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={esperandoEmpresa}
                          >
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Seleccioná el sexo' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='M'>Masculino</SelectItem>
                              <SelectItem value='F'>Femenino</SelectItem>
                              <SelectItem value='O'>Otro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className={`flex flex-col ${ALTO_DE_LA_FILA}`}>
                <CardHeader>
                  <CardTitle>De dónde es y a qué se dedica</CardTitle>
                  <CardDescription>
                    Datos con los que se arman los informes de viajeros y las
                    estadísticas por origen.
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex-1 space-y-5'>
                  <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='nacionalidad'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nacionalidad</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={esperandoEmpresa}
                          >
                            <FormControl>
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Seleccioná la nacionalidad' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {NACIONALIDADES.map((nacionalidad) => (
                                <SelectItem
                                  key={nacionalidad}
                                  value={nacionalidad}
                                >
                                  {nacionalidad}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='paisResidencia'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País de residencia</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder='Ej: Paraguay'
                              disabled={esperandoEmpresa}
                            />
                          </FormControl>
                          <FormDescription>
                            Dónde vive hoy, que no siempre es de dónde es.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='ocupacion'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ocupación</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={esperandoEmpresa}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='Seleccioná la ocupación' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OCUPACIONES.map((ocupacion) => (
                              <SelectItem key={ocupacion} value={ocupacion}>
                                {ocupacion}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='observaciones'
                    render={({ field }) => (
                      <FormItem className='flex flex-1 flex-col'>
                        <FormLabel>Observaciones</FormLabel>
                        <FormControl>
                          {/* Un <input> de una línea escondía todo lo que
                              pasara del ancho del campo, que es justamente
                              donde se anota lo que no entra en ningún otro. */}
                          <Textarea
                            {...field}
                            rows={4}
                            placeholder='Lo que haya que recordar de este cliente'
                            disabled={esperandoEmpresa}
                            className='min-h-[96px] flex-1 resize-none'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </form>
        </Form>

        {/* Sólo cuando el cliente existe: sin id no hay libreta que pedir ni
            compras que listar. */}
        {isEdit && (
          <Card className='overflow-hidden py-0'>
            {clienteId ? (
              <ClientDetalleTabs clienteId={clienteId} />
            ) : (
              <div className='text-muted-foreground flex flex-col items-center gap-2 px-6 py-12 text-center text-sm'>
                {conEstadisticas.isLoading ? (
                  <Skeleton className='h-5 w-64' />
                ) : (
                  <>
                    <Link2Off className='h-5 w-5' />
                    <p>
                      No se pudieron cargar la facturación ni las compras: el
                      listado no devolvió a este cliente.
                    </p>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => void conEstadisticas.refetch()}
                    >
                      Reintentar
                    </Button>
                  </>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
