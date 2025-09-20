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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateClient } from '@/features/clients/hooks/use-client-mutations'
import { useTiposDocumentoByEmpresa } from '@/features/clients/hooks/use-tipos-documento'
import { CreateClientFormValues } from '@/features/clients/models/clients.model'

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
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

interface ClientFormProps {
  empresaId: string
  empresaNombre?: string
  onClientCreated?: (clientData: CreateClientFormValues) => void
  isClientCreated?: boolean
  seatNumber?: number
  passengerNumber?: number
}

export function ClientForm({ empresaId, empresaNombre, onClientCreated, isClientCreated, seatNumber, passengerNumber }: ClientFormProps) {
  const createClient = useCreateClient()
  
  // Obtener tipos de documento para la empresa
  const { data: tiposDocumento, isLoading: isLoadingTiposDocumento } = useTiposDocumentoByEmpresa(empresaId)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      apellido: '',
      nombre: '',
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

  const onSubmit = (data: FormValues) => {
    const clientData: CreateClientFormValues = {
      ...data,
      empresaId: empresaId,
    }

    createClient.mutate(clientData, {
      onSuccess: () => {
        form.reset()
        if (onClientCreated) {
          onClientCreated(clientData)
        }
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span>
            {passengerNumber ? `Pasajero ${passengerNumber}` : 'Información del Cliente'}
            {seatNumber && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - Asiento ida: {seatNumber}
              </span>
            )}
          </span>
          {empresaNombre && (
            <span className="text-sm font-normal text-muted-foreground">
              - {empresaNombre}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Form {...form}>
          <form
            id="checkout-client-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Campos organizados según la imagen */}
            <div className="space-y-3">
              {/* Primera fila: Nombres y Apellidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">Nombres <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Nombres" 
                          className="h-8"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apellido"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">Apellidos <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Apellidos" 
                          className="h-8"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Segunda fila: Nacionalidad y País de residencia */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="nacionalidad"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">Nacionalidad <span className="text-destructive">*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue placeholder="Nacionalidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Paraguaya">Paraguaya</SelectItem>
                          <SelectItem value="Argentina">Argentina</SelectItem>
                          <SelectItem value="Brasileña">Brasileña</SelectItem>
                          <SelectItem value="Uruguaya">Uruguaya</SelectItem>
                          <SelectItem value="Chilena">Chilena</SelectItem>
                          <SelectItem value="Boliviana">Boliviana</SelectItem>
                          <SelectItem value="Peruana">Peruana</SelectItem>
                          <SelectItem value="Colombiana">Colombiana</SelectItem>
                          <SelectItem value="Venezolana">Venezolana</SelectItem>
                          <SelectItem value="Ecuatoriana">Ecuatoriana</SelectItem>
                          <SelectItem value="Mexicana">Mexicana</SelectItem>
                          <SelectItem value="Estadounidense">Estadounidense</SelectItem>
                          <SelectItem value="Española">Española</SelectItem>
                          <SelectItem value="Italiana">Italiana</SelectItem>
                          <SelectItem value="Alemana">Alemana</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paisResidencia"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">País de residencia <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: Paraguay" 
                          className="h-8"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tercera fila: Tipo de documento y N° de documento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="tipoDocumento"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">Tipo de documento <span className="text-destructive">*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoadingTiposDocumento}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingTiposDocumento ? (
                            <SelectItem value="loading-tipos" disabled>
                              Cargando...
                            </SelectItem>
                          ) : tiposDocumento ? (
                            tiposDocumento.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.codigo}>
                                {tipo.descripcion}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-tipos" disabled>
                              No disponible
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
                  name="numeroDocumento"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">N° de documento <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Número" 
                          className="h-8"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cuarta fila: Fecha de nacimiento y Número de teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="fechaNacimiento"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">Fecha de nacimiento <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="date" 
                          className="h-8"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">Número de teléfono <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ej: 975622233" 
                          className="h-8"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Quinta fila: Género y Ocupación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="sexo"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">Género <span className="text-destructive">*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue placeholder="Género" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Femenino</SelectItem>
                          <SelectItem value="O">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ocupacion"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-sm">Ocupación <span className="text-destructive">*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue placeholder="Seleccione una ocupación" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Estudiante">Estudiante</SelectItem>
                          <SelectItem value="Empleado">Empleado</SelectItem>
                          <SelectItem value="Profesional">Profesional</SelectItem>
                          <SelectItem value="Empresario">Empresario</SelectItem>
                          <SelectItem value="Docente">Docente</SelectItem>
                          <SelectItem value="Médico">Médico</SelectItem>
                          <SelectItem value="Ingeniero">Ingeniero</SelectItem>
                          <SelectItem value="Abogado">Abogado</SelectItem>
                          <SelectItem value="Contador">Contador</SelectItem>
                          <SelectItem value="Comerciante">Comerciante</SelectItem>
                          <SelectItem value="Técnico">Técnico</SelectItem>
                          <SelectItem value="Obrero">Obrero</SelectItem>
                          <SelectItem value="Agricultor">Agricultor</SelectItem>
                          <SelectItem value="Jubilado">Jubilado</SelectItem>
                          <SelectItem value="Ama de casa">Ama de casa</SelectItem>
                          <SelectItem value="Desempleado">Desempleado</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">Email <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="email" 
                        placeholder="ejemplo@correo.com" 
                        className="h-8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Observaciones */}
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm">Observaciones (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Información adicional (opcional)" 
                        className="h-8"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-2">
              {isClientCreated ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Cliente registrado</span>
                </div>
              ) : (
                <Button 
                  type="submit"
                  disabled={createClient.isPending}
                  size="sm"
                >
                  {createClient.isPending ? 'Creando...' : 'Crear Cliente'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
