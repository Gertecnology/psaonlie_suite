import { z } from 'zod'

/**
 * Agencias, en la jerarquía de dos niveles que expone el backend sobre una
 * sola tabla.
 *
 * Una fila SIN `padreId` es una **empresa**: tiene la conexión al web service
 * de la transportista (`url`, `usuario`, `password`, `agenciaPrincipal`).
 * Una fila CON `padreId` es una **agencia** de esa empresa: aporta su `codigo`
 * y su stock de boletos, y no se da de alta ni se borra a mano — la trae la
 * sincronización desde `AgenciaHabilitada`.
 *
 * `GET /agencias` devuelve SÓLO empresas (las filas sin padre), cada una con
 * sus agencias en `hijas`.
 */

/**
 * Una agencia hija, tal como viene embebida en el listado (`AgenciaBasicDto`).
 *
 * `padreId` y `heredaComision` NO viajan en este payload: el primero lo
 * completamos al aplanar la jerarquía (lo sabemos: es el id de la fila que la
 * contiene), y el segundo se lee de `GET /agencias/:id` cuando hace falta
 * editarla. Inventar un default para `heredaComision` sería peor que no
 * tenerlo: decidiría por el usuario qué comisión se le cobra a la agencia.
 */
export const agenciaHijaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  codigo: z.string().nullable().optional(),
  boletosDisponibles: z.number().nullable().optional(),
  activo: z.boolean(),
})

export const serviceChargeSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  porcentaje: z.string().nullable().optional(),
  activo: z.boolean(),
  esGlobal: z.boolean(),
  tipoAplicacion: z.enum(['PORCENTUAL', 'FIJO']),
  montoFijo: z.number().nullable().optional(),
})

export const agenciaSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, 'El nombre es requerido.'),
  agenciaPrincipal: z.string().nullable().optional(),
  usuario: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  activo: z.boolean(),
  urlPerfil: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  cantidadParadasHomologadas: z.number().optional(),
  porcentajeVentas: z.string().nullable().optional(),
  ventaHabilitada: z.string().nullable().optional(),
  ultimaSincronizacionSoap: z.string().nullable().optional(),
  /** `null`/ausente en una empresa; el id del padre en una agencia hija. */
  padreId: z.string().nullable().optional(),
  /** El código con el que el servidor del padre identifica a esta agencia. */
  codigo: z.string().nullable().optional(),
  boletosDisponibles: z.number().nullable().optional(),
  /**
   * Con `true` la agencia cobra lo que cobra su empresa y sus propios
   * `porcentajeVentas` y `serviceCharge` se ignoran. En una empresa el flag no
   * tiene efecto: no hay de quién heredar.
   */
  heredaComision: z.boolean().optional(),
  hijas: z.array(agenciaHijaSchema).nullable().optional(),
  serviceCharge: serviceChargeSchema.nullable().optional(),
})

export const agenciasPaginadasSchema = z.object({
  items: z.array(agenciaSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const agenciaFormSchema = agenciaSchema.omit({
  id: true,
  urlPerfil: true,
  cantidadParadasHomologadas: true,
})

export const crearAgenciaSchema = agenciaFormSchema.extend({
  nombre: z.string().min(1, 'El nombre es requerido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  agenciaPrincipal: z.string().nullable().optional(),
  usuario: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  url: z.string().url({ message: 'URL inválida.' }).optional().or(z.literal('')),
  porcentajeVentas: z.number().optional(),
  profileImage: z.instanceof(File).optional(),
})

export type Agencia = z.infer<typeof agenciaSchema>
export type AgenciaHija = z.infer<typeof agenciaHijaSchema>
export type AgenciasPaginadasResponse = z.infer<typeof agenciasPaginadasSchema>
export type AgenciaFormValues = z.infer<typeof agenciaFormSchema>
export type CrearAgenciaFormValues = z.infer<typeof crearAgenciaSchema>

/** `true` si la fila es una empresa (una conexión), no una agencia hija. */
export function esEmpresa(agencia: Pick<Agencia, 'padreId'>): boolean {
  return agencia.padreId === null || agencia.padreId === undefined
}
