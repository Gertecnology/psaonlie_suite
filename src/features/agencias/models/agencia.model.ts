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

/**
 * Una fila del listado, ya aplanada: la empresa y, debajo, sus agencias.
 *
 * `nivel` es lo único que la tabla necesita para dibujar la sangría, y
 * `cantidadHijas` para el botón que expande. Se calculan al aplanar en vez de
 * pedírselos a la tabla: así la fila sigue siendo una `Agencia` común y las
 * columnas no tienen que saber de jerarquías.
 */
export interface FilaAgencia extends Agencia {
  nivel: 0 | 1
  cantidadHijas: number
  /**
   * La comisión de la empresa padre, copiada acá para poder mostrar qué cobra
   * de verdad una hija que hereda. Sólo se completa en las filas de nivel 1.
   */
  comisionDelPadre?: {
    porcentajeVentas: string | null
    serviceCharge: Agencia['serviceCharge']
  }
}

/**
 * La comisión que le corresponde a una fila, ya resuelta.
 *
 * `desconocida` es un estado real y no un caso borde: el listado embebe las
 * agencias con un DTO que no trae `heredaComision`, así que hasta que llegue
 * `GET /agencias/:id/hijas` no sabemos si la agencia cobra lo suyo o lo de su
 * empresa. Los dos números existen; elegir uno al azar informa mal una plata.
 */
export type ComisionResuelta =
  | { estado: 'desconocida' }
  | {
      estado: 'propia' | 'heredada'
      porcentajeVentas: string | null
      serviceCharge: Agencia['serviceCharge']
    }

export function resolverComision(fila: FilaAgencia): ComisionResuelta {
  if (esEmpresa(fila)) {
    return {
      estado: 'propia',
      porcentajeVentas: fila.porcentajeVentas ?? null,
      serviceCharge: fila.serviceCharge,
    }
  }

  if (fila.heredaComision === undefined) {
    return { estado: 'desconocida' }
  }

  if (fila.heredaComision) {
    return {
      estado: 'heredada',
      porcentajeVentas: fila.comisionDelPadre?.porcentajeVentas ?? null,
      serviceCharge: fila.comisionDelPadre?.serviceCharge,
    }
  }

  return {
    estado: 'propia',
    porcentajeVentas: fila.porcentajeVentas ?? null,
    serviceCharge: fila.serviceCharge,
  }
}

/**
 * Convierte el listado de empresas en filas planas: cada empresa seguida de
 * sus agencias, si está expandida.
 *
 * Aplanar en vez de usar el modelo de filas expandibles de TanStack Table deja
 * la selección, la paginación y el `getRowId` funcionando exactamente igual que
 * antes: una fila sigue siendo una agencia con su `id`.
 *
 * `hijasCompletas` son las que devolvió `GET /agencias/:id/hijas`, que sí traen
 * `heredaComision` y el `porcentajeVentas` propio. Mientras esa consulta está
 * en vuelo se usan las hijas embebidas del listado: alcanzan para dibujar la
 * jerarquía al instante, y las columnas de comisión saben quedarse calladas
 * hasta que `heredaComision` llegue. Mostrar una comisión adivinada sería
 * informar mal un número que es plata.
 */
export function aplanarJerarquia(
  empresas: Agencia[],
  expandidas: ReadonlySet<string>,
  hijasCompletas?: ReadonlyMap<string, Agencia[]>,
): FilaAgencia[] {
  const filas: FilaAgencia[] = []

  for (const empresa of empresas) {
    const embebidas = empresa.hijas ?? []
    filas.push({ ...empresa, nivel: 0, cantidadHijas: embebidas.length })

    if (!expandidas.has(empresa.id)) continue

    const hijas = hijasCompletas?.get(empresa.id) ?? embebidas

    for (const hija of hijas) {
      filas.push({
        ...hija,
        // El backend no manda `padreId` en las hijas embebidas, pero no hay
        // ambigüedad posible: es el id de la fila que las contiene.
        padreId: empresa.id,
        nivel: 1,
        cantidadHijas: 0,
        comisionDelPadre: {
          porcentajeVentas: empresa.porcentajeVentas ?? null,
          serviceCharge: empresa.serviceCharge,
        },
      })
    }
  }

  return filas
}
