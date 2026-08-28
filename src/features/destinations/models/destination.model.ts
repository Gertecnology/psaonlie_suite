import { z } from 'zod'

export const destinationSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  activo: z.boolean(),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
  /** `MANUAL`, `ROOFTOP`, `APPROXIMATE`… de dónde salió la coordenada. */
  geocodingPrecision: z.string().nullable().optional(),
  paradasHomologadas: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    activo: z.boolean(),
    empresaNombre: z.string(),
  })).optional(),
  cantidadParadas: z.number().optional(),
})

export const destinationFormSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, 'Poné el nombre del destino.')
      .max(255, 'El nombre no puede pasar de 255 caracteres.'),
    // Sin mínimo: un destino existe antes de que se le homologue una parada, y
    // exigir una impedía incluso corregirle el nombre a los que no tienen.
    paradasHomologadasIds: z.array(z.string()),
    activo: z.boolean(),
    // `null` es "sin ubicación cargada", que es un estado válido: el destino
    // funciona igual, sólo que no se puede proponer por cercanía.
    latitud: z
      .number({ invalid_type_error: 'La latitud tiene que ser un número.' })
      .min(-90, 'La latitud va de -90 a 90.')
      .max(90, 'La latitud va de -90 a 90.')
      .nullable(),
    longitud: z
      .number({ invalid_type_error: 'La longitud tiene que ser un número.' })
      .min(-180, 'La longitud va de -180 a 180.')
      .max(180, 'La longitud va de -180 a 180.')
      .nullable(),
  })
  .refine(
    (valores) => (valores.latitud === null) === (valores.longitud === null),
    {
      // Media coordenada no ubica nada, y la base lo rechaza con un CHECK.
      message: 'La ubicación necesita las dos coordenadas.',
      path: ['latitud'],
    },
  )

export const clientSchema = z.object({
  email: z.string().email('El email no es válido.'),
  nombre: z.string().min(1, 'El nombre es requerido.'),
  apellido: z.string().min(1, 'El apellido es requerido.'),
  telefono: z.string().min(1, 'El teléfono es requerido.'),
  agenciaId: z.string().min(1, 'La empresa es requerida.'),
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
export type ClientFormValues = z.infer<typeof clientSchema> 