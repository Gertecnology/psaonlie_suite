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
import { usePasajeroConocido } from '../../hooks/use-pasajero-conocido'
import { useGetPaisesDisponibles } from '../../hooks/use-get-paises'
import { CreateClientFormValues } from '@/features/clients/models/clients.model'
import { toast } from 'sonner'

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
  agenciaId: string
  empresaNombre?: string
  /**
   * Se llama con el id que devolvió el backend. El checkout necesita ese id
   * para armar la venta: sin él tenía que volver a crear el mismo cliente.
   */
  onClientCreated?: (clienteId: string, clientData: CreateClientFormValues) => void
  isClientCreated?: boolean
  seatNumber?: number
  passengerNumber?: number
}

export function ClientForm({ agenciaId, empresaNombre, onClientCreated, isClientCreated, seatNumber, passengerNumber }: ClientFormProps) {
  const createClient = useCreateClient()

  // Obtener tipos de documento para la empresa
  const { data: tiposDocumento, isLoading: isLoadingTiposDocumento } = useTiposDocumentoByEmpresa(agenciaId)
  
  // Obtener países disponibles del API
  const { data: paisesDisponibles, isLoading: isLoadingPaises } = useGetPaisesDisponibles(agenciaId)

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

  // Precarga desde el documento: quien vuelve a comprar no tiene que dictarle
  // todo al vendedor otra vez. En el mostrador cada dato que no hay que
  // preguntar es una persona menos en la fila.
  //
  // Sólo se completan los campos vacíos: pisar lo escrito haría imposible
  // corregir un dato viejo, porque la respuesta devolvería el anterior.
  const { buscando: buscandoPasajero } = usePasajeroConocido({
    tipoDocumento: form.watch('tipoDocumento'),
    numeroDocumento: form.watch('numeroDocumento'),
    onEncontrado: (campos) => {
      for (const [campo, valor] of Object.entries(campos)) {
        if (!valor) continue

        const actual = form.getValues(campo as keyof FormValues)
        if (actual) continue

        form.setValue(campo as keyof FormValues, valor as never, {
          shouldValidate: true,
        })
      }
    },
  })

  const onSubmit = (data: FormValues) => {
    // Guarda contra doble envío: si ya hay un alta en vuelo, o el pasajero ya
    // quedó registrado, no se manda otra vez.
    if (createClient.isPending || isClientCreated) return

    const clientData: CreateClientFormValues = {
      ...data,
      agenciaId: agenciaId,
    }

    createClient.mutate(clientData, {
      onSuccess: (respuesta) => {
        const clienteId = respuesta?.cliente?.id

        // Sin id no hay forma de asociar el pasajero al asiento en la venta.
        // Reportarlo como éxito dejaría el checkout bloqueado sin explicación.
        if (!clienteId) {
          toast.error('No se pudo registrar el pasajero', {
            description:
              'El servidor no devolvió el identificador del cliente. Volvé a intentarlo.',
            duration: 5000,
          })
          return
        }

        form.reset()
        onClientCreated?.(clienteId, clientData)

        toast.success('Pasajero registrado', {
          description: `${clientData.nombre} ${clientData.apellido} quedó registrado.`,
          duration: 3000,
        })
      },
      onError: (error: unknown) => {
        let message = 'Ha ocurrido un error al crear el cliente.'
        if (error instanceof Error) {
          message = error.message
        } else if (typeof error === 'string') {
          message = error
        }
        toast.error('Error al registrar el pasajero', {
          description: message,
          duration: 6000,
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

              {/* Segunda fila: Tipo de documento y N° de documento */}
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
                          autoComplete="off"
                        />
                      </FormControl>
                      {/* Sin este aviso el formulario se completa solo un
                          segundo después de tipear, sin explicación. */}
                      {buscandoPasajero && (
                        <p role="status" className="text-muted-foreground text-xs">
                          Buscando datos anteriores…
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              

              {/* Tercera fila: Nacionalidad y País de residencia */}
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
                        disabled={isLoadingPaises}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue placeholder="Nacionalidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingPaises ? (
                            <SelectItem value="loading-paises" disabled>
                              Cargando países...
                            </SelectItem>
                          ) : paisesDisponibles && paisesDisponibles.length > 0 ? (
                            paisesDisponibles.map((pais) => (
                              <SelectItem key={pais.id} value={pais.Codigo}>
                                {pais.Descripcion}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-paises" disabled>
                              No hay países disponibles
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
                  <span className="text-sm font-medium">Pasajero registrado</span>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={createClient.isPending}
                  size="sm"
                >
                  {createClient.isPending ? 'Registrando...' : 'Registrar pasajero'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
