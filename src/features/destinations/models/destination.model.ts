import { z } from 'zod'

export const destinationSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  activo: z.boolean(),
  paradasHomologadas: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    activo: z.boolean(),
    empresaNombre: z.string(),
  })).optional(),
  cantidadParadas: z.number().optional(),
})

export const destinationFormSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido.'),
  paradasHomologadasIds: z.array(z.string()).min(1, 'Selecciona al menos una parada.'),
})

export const clientSchema = z.object({
  email: z.string().email('El email no es válido.'),
  nombre: z.string().min(1, 'El nombre es requerido.'),
  apellido: z.string().min(1, 'El apellido es requerido.'),
  telefono: z.string().min(1, 'El teléfono es requerido.'),
  empresaId: z.string().min(1, 'La empresa es requerida.'),
  empresaNombre: z.string().min(1, 'La empresa es requerida.'),
  tipoDocumento: z.string().min(1, 'El tipo de documento es requerido.'),
  numeroDocumento: z.string().min(1, 'El número de documento es requerido.'),
  fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es requerida.'),
  sexo: z.string().min(1, 'El sexo es requerido.'),
  nacionalidad: z.string().min(1, 'La nacionalidad es requerida.'),
  paisResidencia: z.string().min(1, 'El país de residencia es requerido.'),
  ocupacion: z.string().optional(),
  observaciones: z.string().optional(),
})


export type Destination = z.infer<typeof destinationSchema>
export type DestinationFormValues = z.infer<typeof destinationFormSchema> 