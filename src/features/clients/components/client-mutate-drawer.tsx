import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useClientDialog } from '../store/use-client-dialog'
import { useCreateClient } from '../hooks/use-client-mutations'
import { useUpdateClient } from '../hooks/use-client-mutations'
import { useEmpresasList } from '../../dashboard/hooks/use-empresas-list'
import { useTiposDocumentoByEmpresa } from '../hooks/use-tipos-documento'
import { EmpresaSearch } from './empresa-search'

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  empresaId: z.string().min(1, 'La empresa es requerida'),
  tipoDocumento: z.string().min(1, 'El tipo de documento es requerido'),
  numeroDocumento: z.string().min(1, 'El número de documento es requerido'),
  fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  sexo: z.string().min(1, 'El sexo es requerido'),
  nacionalidad: z.string().min(1, 'La nacionalidad es requerida'),
  paisResidencia: z.string().min(1, 'El país de residencia es requerido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  ocupacion: z.string().min(1, 'La ocupación es requerida'),
  observaciones: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function ClientMutateDrawer() {
  const { open, close, data: client } = useClientDialog()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  
  // Obtener lista de empresas
  const { data: empresasData, isLoading: isLoadingEmpresas } = useEmpresasList()
  const empresas = empresasData?.data || []

  const isUpdate = !!client && !!client.cliente.email

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      apellido: '',
      nombre: '',
      empresaId: '',
      tipoDocumento: '',
      numeroDocumento: '',
      fechaNacimiento: '',
      sexo: '',
      nacionalidad: '',
      paisResidencia: '',
      telefono: '',
      ocupacion: '',
      observaciones: '',
    },
  })

  // Obtener empresaId del formulario para cargar tipos de documento
  const empresaId = form.watch('empresaId')
  
  // Obtener tipos de documento para la empresa seleccionada
  const { data: tiposDocumento, isLoading: isLoadingTiposDocumento } = useTiposDocumentoByEmpresa(empresaId)

  useEffect(() => {
    if (open) {
      if (isUpdate && client) {
        form.reset({
          email: client.cliente.email,
          apellido: client.cliente.apellido,
          nombre: client.cliente.nombre,
          empresaId: '',
          tipoDocumento: '',
          numeroDocumento: '',
          fechaNacimiento: client.cliente.fechaNacimiento || '',
          sexo: client.cliente.sexo || '',
          nacionalidad: client.cliente.nacionalidad || '',
          paisResidencia: client.cliente.paisResidencia || '',
          telefono: client.cliente.telefono || '',
          ocupacion: client.cliente.ocupacion || '',
          observaciones: client.cliente.observaciones || '',
        })
      } else {
        form.reset({
          email: '',
          apellido: '',
          nombre: '',
          empresaId: '',
          tipoDocumento: '',
          numeroDocumento: '',
          fechaNacimiento: '',
          sexo: '',
          nacionalidad: '',
          paisResidencia: '',
          telefono: '',
          ocupacion: '',
          observaciones: '',
        })
      }
    }
  }, [open, isUpdate, client, form])

  // Limpiar tipo de documento cuando cambia la empresa
  useEffect(() => {
    if (empresaId) {
      form.setValue('tipoDocumento', '')
    }
  }, [empresaId, form])

  const onSubmit = (data: FormValues) => {
    if (isUpdate && client?.cliente.email) {
      // Filtrar solo los campos que acepta la API de actualización
      const updateData = {
        apellido: data.apellido,
        nombre: data.nombre,
        fechaNacimiento: data.fechaNacimiento,
        sexo: data.sexo,
        nacionalidad: data.nacionalidad,
        paisResidencia: data.paisResidencia,
        telefono: data.telefono,
        ocupacion: data.ocupacion,
        observaciones: data.observaciones,
      }
      
      updateClient.mutate(
        { email: client.cliente.email, data: updateData },
        {
          onSuccess: () => {
            close()
            import('sonner').then(({ toast }) => {
              toast.success('Cliente actualizado', {
                description: 'El cliente se ha actualizado correctamente.',
                duration: 3000,
              })
            })
          },
          onError: (error: unknown) => {
            import('sonner').then(({ toast }) => {
              let message = 'Ha ocurrido un error al actualizar el cliente.'
              if (error instanceof Error) {
                message = error.message
              } else if (typeof error === 'string') {
                message = error
              }
              toast.error('Error al actualizar', {
                description: message,
                duration: 3000,
              })
            })
          },
        }
      )
    } else {
      createClient.mutate(data, {
        onSuccess: () => {
          close()
          import('sonner').then(({ toast }) => {
            toast.success('Cliente creado', {
              description: 'El cliente se ha creado correctamente.',
              duration: 3000,
            })
          })
        },
        onError: (error: unknown) => {
          import('sonner').then(({ toast }) => {
            let message = 'Ha ocurrido un error al crear el cliente.'
            if (error instanceof Error) {
              message = error.message
            } else if (typeof error === 'string') {
              message = error
            }
            toast.error('Error al crear', {
              description: message,
              duration: 3000,
            })
          })
        },
      })
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close()
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className='flex flex-col overflow-y-auto w-full sm:w-[600px] md:w-[700px] lg:w-[800px] xl:w-[900px]'>
        <SheetHeader className='text-left'>
          <SheetTitle>
            {isUpdate ? 'Actualizar' : 'Crear'} Cliente
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Actualiza el cliente con la información necesaria.'
              : 'Añade un nuevo cliente con la información necesaria.'}
            Haz click en guardar cuando hayas terminado.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='client-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-6 px-2 sm:px-4'
          >
            {/* Selección de Empresa */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Seleccionar Empresa</h3>
              
              <FormField
                control={form.control}
                name='empresaId'
                render={({ field }) => (
                    <FormItem className='space-y-2'>
                      <FormLabel>Empresa <span className='text-destructive'>*</span></FormLabel>
                    <FormControl>
                      <EmpresaSearch
                        empresas={empresas}
                        isLoading={isLoadingEmpresas}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder='Buscar empresa...'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Información del Cliente */}
              <div className={`space-y-4 transition-opacity duration-200 ${!empresaId ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className='text-lg font-semibold'>Información del Cliente</h3>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='nombre'
                  render={({ field }) => (
                    <FormItem className='space-y-2'>
                      <FormLabel>Nombre <span className='text-destructive'>*</span></FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder='Ingresa el nombre' 
                          disabled={!empresaId}
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
                    <FormItem className='space-y-2'>
                      <FormLabel>Apellido <span className='text-destructive'>*</span></FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder='Ingresa el apellido' 
                          disabled={!empresaId}
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
                  <FormItem className='space-y-2'>
                    <FormLabel>Email <span className='text-destructive'>*</span></FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type='email' 
                        placeholder='Ingresa el email' 
                        disabled={!empresaId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='tipoDocumento'
                  render={({ field }) => (
                    <FormItem className='space-y-2'>
                      <FormLabel>Tipo de Documento <span className='text-destructive'>*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!empresaId || isLoadingTiposDocumento}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Selecciona tipo' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingTiposDocumento ? (
                            <SelectItem value='loading-tipos' disabled>
                              Cargando tipos de documento...
                            </SelectItem>
                          ) : tiposDocumento ? (
                            tiposDocumento.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.codigo}>
                                {tipo.descripcion}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value='no-tipos' disabled>
                              No hay tipos disponibles
                            </SelectItem>
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
                    <FormItem className='space-y-2'>
                      <FormLabel>Nro de Documento <span className='text-destructive'>*</span></FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder='Ingresa el número' 
                          disabled={!empresaId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Información Adicional */}
              <div className={`space-y-4 transition-opacity duration-200 ${!empresaId ? 'opacity-50 pointer-events-none' : ''}`}>
              <h3 className='text-lg font-semibold'>Información Adicional</h3>

              <FormField
                control={form.control}
                name='fechaNacimiento'
                render={({ field }) => (
                  <FormItem className='space-y-2'>
                    <FormLabel>Fecha de Nacimiento <span className='text-destructive'>*</span></FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type='date' 
                        disabled={!empresaId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='sexo'
                  render={({ field }) => (
                    <FormItem className='space-y-2'>
                      <FormLabel>Sexo <span className='text-destructive'>*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!empresaId}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Selecciona sexo' />
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
                <FormField
                  control={form.control}
                  name='nacionalidad'
                  render={({ field }) => (
                    <FormItem className='space-y-2'>
                      <FormLabel>Nacionalidad <span className='text-destructive'>*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!empresaId}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Nacionalidad' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Paraguaya'>Paraguaya</SelectItem>
                          <SelectItem value='Argentina'>Argentina</SelectItem>
                          <SelectItem value='Brasileña'>Brasileña</SelectItem>
                          <SelectItem value='Uruguaya'>Uruguaya</SelectItem>
                          <SelectItem value='Chilena'>Chilena</SelectItem>
                          <SelectItem value='Boliviana'>Boliviana</SelectItem>
                          <SelectItem value='Peruana'>Peruana</SelectItem>
                          <SelectItem value='Colombiana'>Colombiana</SelectItem>
                          <SelectItem value='Venezolana'>Venezolana</SelectItem>
                          <SelectItem value='Ecuatoriana'>Ecuatoriana</SelectItem>
                          <SelectItem value='Mexicana'>Mexicana</SelectItem>
                          <SelectItem value='Estadounidense'>Estadounidense</SelectItem>
                          <SelectItem value='Española'>Española</SelectItem>
                          <SelectItem value='Italiana'>Italiana</SelectItem>
                          <SelectItem value='Alemana'>Alemana</SelectItem>
                          <SelectItem value='Otro'>Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='paisResidencia'
                render={({ field }) => (
                  <FormItem className='space-y-2'>
                    <FormLabel>País de Residencia <span className='text-destructive'>*</span></FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder='Ej: Paraguay' 
                        disabled={!empresaId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='telefono'
                render={({ field }) => (
                  <FormItem className='space-y-2'>
                    <FormLabel>Teléfono <span className='text-destructive'>*</span></FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder='Ej: +595981123456' 
                        disabled={!empresaId}
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
                  <FormItem className='space-y-2'>
                    <FormLabel>Ocupación <span className='text-destructive'>*</span></FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!empresaId}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Selecciona ocupación' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='Estudiante'>Estudiante</SelectItem>
                        <SelectItem value='Empleado'>Empleado</SelectItem>
                        <SelectItem value='Profesional'>Profesional</SelectItem>
                        <SelectItem value='Empresario'>Empresario</SelectItem>
                        <SelectItem value='Docente'>Docente</SelectItem>
                        <SelectItem value='Médico'>Médico</SelectItem>
                        <SelectItem value='Ingeniero'>Ingeniero</SelectItem>
                        <SelectItem value='Abogado'>Abogado</SelectItem>
                        <SelectItem value='Contador'>Contador</SelectItem>
                        <SelectItem value='Comerciante'>Comerciante</SelectItem>
                        <SelectItem value='Técnico'>Técnico</SelectItem>
                        <SelectItem value='Obrero'>Obrero</SelectItem>
                        <SelectItem value='Agricultor'>Agricultor</SelectItem>
                        <SelectItem value='Jubilado'>Jubilado</SelectItem>
                        <SelectItem value='Ama de casa'>Ama de casa</SelectItem>
                        <SelectItem value='Desempleado'>Desempleado</SelectItem>
                        <SelectItem value='Otro'>Otro</SelectItem>
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
                  <FormItem className='space-y-2'>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder='Observaciones adicionales' 
                        disabled={!empresaId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <SheetFooter className='gap-4 pt-4'>
          <SheetClose asChild>
            <Button variant='outline' disabled={createClient.isPending || updateClient.isPending}>
              Cerrar
            </Button>
          </SheetClose>
          <Button 
            form='client-form' 
            type='submit'
            disabled={!empresaId || createClient.isPending || updateClient.isPending}
          >
            {createClient.isPending || updateClient.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
