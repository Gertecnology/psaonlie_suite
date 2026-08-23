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
import { useClientForm } from '../hooks/use-client-form'
import { EmpresaSearch } from './empresa-search'

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
 * Create or edit a client, on its own page.
 *
 * It was a drawer up to 900px wide holding thirteen fields across three
 * sections — wider than most dialogs and still without an address: it could not
 * be linked, a reload lost it, and the back button threw the whole form away
 * instead of undoing the last step.
 *
 * All the logic lives in `use-client-form`; this file only renders.
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

  const titulo = isEdit ? 'Editar cliente' : 'Nuevo cliente'

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
      <PageLayout title={titulo} showSearch={false}>
        <div className='max-w-3xl space-y-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
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
          ? 'Los datos de contacto se guardan acá. La empresa y el documento se definieron al darlo de alta.'
          : 'El alta se sincroniza con el web service de la empresa, así que puede tardar.'
      }
      showSearch={false}
      actions={
        <Button variant='ghost' size='sm' asChild>
          <Link to='/clients'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Clientes
          </Link>
        </Button>
      }
    >
      <Form {...form}>
        {/* El submit vive en el <form>, así que Enter guarda desde cualquier
            campo. */}
        <form onSubmit={save} className='max-w-3xl space-y-8'>
          {/* La empresa sólo se elige al crear: la API de actualización no la
              acepta y el cliente ya está asociado a una. */}
          {!isEdit && (
            <fieldset className='space-y-4'>
              <legend className='text-lg font-semibold'>Empresa</legend>

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
                    <FormDescription>
                      Define qué tipos de documento se pueden usar y contra qué
                      web service se sincroniza el alta.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>
          )}

          <fieldset className='space-y-4'>
            <legend className='text-lg font-semibold'>
              Información del cliente
            </legend>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='nombre'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
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
                    {/* En edición es de sólo lectura: es la clave con la que la
                        API identifica al cliente, así que cambiarlo acá no lo
                        renombraría, guardaría contra el email viejo. */}
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
                      El email identifica al cliente y no se puede cambiar.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
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
              </div>
            )}
          </fieldset>

          <fieldset className='space-y-4'>
            <legend className='text-lg font-semibold'>
              Información adicional
            </legend>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
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

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
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
                          <SelectItem key={nacionalidad} value={nacionalidad}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
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
            </div>

            <FormField
              control={form.control}
              name='observaciones'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='Observaciones adicionales'
                      disabled={esperandoEmpresa}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </fieldset>

          <div className='flex items-center gap-3 border-t pt-4'>
            <Button type='submit' disabled={saving || esperandoEmpresa}>
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
