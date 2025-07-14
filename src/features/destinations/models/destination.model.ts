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

export type Destination = z.infer<typeof destinationSchema>
export type DestinationFormValues = z.infer<typeof destinationFormSchema> 