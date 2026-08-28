import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
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
import { ClientDetalleTabs } from './client-detalle-tabs'
import { EmpresaSearch } from './empresa-search'

/** Alto compartido por las dos tarjetas de arriba, de donde sale la simetría. */
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

/**
 * La ficha de un cliente: sus datos, su libreta de facturación y sus compras.
 *
 * Antes eran dos pantallas distintas —un formulario en `/clients/:email/editar`
 * y una pantalla de detalle que se abría desde el menú de la fila— que
 * mostraban al mismo cliente y no se podía pasar de una a la otra. Ver un dato
 * y corregirlo son el mismo gesto, así que son la misma pantalla.
 *
 * Las dos tarjetas de arriba separan las dos preguntas que la pantalla
 * contesta: quién es, que es lo que se imprime, y qué le pide la transportista
 * para emitir. Toda la lógica del formulario vive en `use-client-form`; esto
 * sólo dibuja.
 */
export function ClientForm({ email }: ClientFormProps) {
  const {
    form,
    save,
    saving,
    isEdit,
    client,
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

  const titulo = isEdit
    ? (client?.nombreCompleto ?? 'Cliente')
    : 'Nuevo cliente'

  // Hasta que no haya empresa no se sabe qué documentos acepta, así que los
  // campos del alta esperan. En edición no aplica: el cliente ya tiene empresa.
  const esperandoEmpresa = !isEdit && !agenciaId

  const documentoGuardado = [client?.tipoDocumento, client?.numeroDocumento]
    .filter(Boolean)
    .join(' ')

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
        <div className='grid gap-5 lg:grid-cols-2'>
          <Skeleton className='h-[520px] w-full' />
          <Skeleton className='h-[520px] w-full' />
        </div>
      </PageLayout>
    )
  }

  /**
   * Un formulario en blanco no se distingue de uno cuyos datos están vacíos, y
   * guardarlo escribiría ese vacío encima de lo que la persona tenía. Que falle
   * no puede parecerse a que esté vacío.
   */
  if (isEdit && (error || !client)) {
    return (
      <PageLayout title='Cliente' showSearch={false}>
        <div
          role='alert'
          className='border-destructive/50 text-destructive max-w-2xl rounded-md border p-6'
        >
          <p className='font-medium'>No se pudo cargar el cliente</p>
          <p className='text-muted-foreground mt-1 text-sm'>
            {error?.message ??
              'El servidor no devolvió sus datos. No se muestra el formulario para no guardar campos vacíos encima de los suyos.'}
          </p>
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
          ? 'Editando un cliente que ya existe.'
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
                    Lo que va en el pasaje y en la factura.
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
                        <FormLabel>Correo</FormLabel>
                        <FormControl>
                          {/* En edición es de sólo lectura: es la clave con la
                              que la API identifica al cliente, así que cambiarlo
                              acá no lo renombraría, guardaría contra el correo
                              viejo. */}
                          <Input
                            {...field}
                            type='email'
                            placeholder='Ingresá el correo'
                            readOnly={isEdit}
                            disabled={esperandoEmpresa}
                            className={isEdit ? 'bg-muted' : undefined}
                          />
                        </FormControl>
                        <FormDescription>
                          {isEdit
                            ? 'Con esto se le manda el pasaje, y es lo que lo identifica: no se puede cambiar.'
                            : 'Con esto se le manda el pasaje.'}
                        </FormDescription>
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

                  {/* El documento se definió al dar de alta y la API de
                      actualización no lo acepta, pero es parte de quién es la
                      persona: se muestra, no se edita. */}
                  {isEdit && (
                    <div className='space-y-2'>
                      <p className='text-sm leading-none font-medium'>
                        Documento
                      </p>
                      <div className='bg-muted text-muted-foreground rounded-md border px-3 py-2 text-sm'>
                        {documentoGuardado || 'Sin documento cargado'}
                      </div>
                      <p className='text-muted-foreground text-sm'>
                        Se definió al darlo de alta y no se cambia desde acá.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={`flex flex-col ${ALTO_DE_LA_FILA}`}>
                <CardHeader>
                  <CardTitle>Datos del pasajero</CardTitle>
                  <CardDescription>
                    Los pide la transportista al emitir el pasaje.
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex flex-1 flex-col space-y-5'>
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
                            placeholder='Opcional'
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
        {isEdit && client && (
          <Card className='overflow-hidden py-0'>
            <ClientDetalleTabs clienteId={client.id} />
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
