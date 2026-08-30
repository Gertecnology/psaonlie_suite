/**
 * Los datos que hay que cargar por pasajero, y cuándo una fila está completa.
 *
 * Son once campos obligatorios. Con dieciocho butacas eso son ciento noventa y
 * ocho celdas, así que la pantalla necesita saber en todo momento cuántas
 * filas faltan y cuál — y no sólo si el conjunto entero es válido.
 *
 * El orden de las columnas es el orden en que se carga en el mostrador: el
 * documento primero, porque quien vende tiene la pila de cédulas en la mano y
 * al tipear la cédula el resto se completa solo.
 */

export interface DatosDelPasajero {
  numeroDocumento: string
  nombre: string
  apellido: string
  tipoDocumento: string
  nacionalidad: string
  paisResidencia: string
  fechaNacimiento: string
  sexo: string
  ocupacion: string
  telefono: string
  email: string
  observaciones: string
}

/** Una columna de la planilla. */
export interface ColumnaDeLaPlanilla {
  campo: keyof DatosDelPasajero
  etiqueta: string
  /** Qué se dibuja en la celda vacía. */
  ejemplo: string
  /** El ancho de la columna, en px. */
  ancho: number
  obligatorio: boolean
  /** De dónde salen las opciones, cuando la celda es un desplegable. */
  opciones?: 'tiposDeDocumento' | 'paises' | 'sexo' | 'ocupacion'
}

export const COLUMNAS: ColumnaDeLaPlanilla[] = [
  { campo: 'numeroDocumento', etiqueta: 'Documento', ejemplo: 'Documento', ancho: 120, obligatorio: true },
  { campo: 'nombre', etiqueta: 'Nombres', ejemplo: 'Nombres', ancho: 128, obligatorio: true },
  { campo: 'apellido', etiqueta: 'Apellidos', ejemplo: 'Apellidos', ancho: 128, obligatorio: true },
  { campo: 'tipoDocumento', etiqueta: 'Tipo doc.', ejemplo: 'Elegí', ancho: 96, obligatorio: true, opciones: 'tiposDeDocumento' },
  { campo: 'nacionalidad', etiqueta: 'Nacionalidad', ejemplo: 'Elegí', ancho: 118, obligatorio: true, opciones: 'paises' },
  { campo: 'paisResidencia', etiqueta: 'Residencia', ejemplo: 'Paraguay', ancho: 116, obligatorio: true },
  { campo: 'fechaNacimiento', etiqueta: 'F. nacim.', ejemplo: 'dd/mm/aaaa', ancho: 128, obligatorio: true },
  { campo: 'sexo', etiqueta: 'Género', ejemplo: 'Elegí', ancho: 104, obligatorio: true, opciones: 'sexo' },
  { campo: 'ocupacion', etiqueta: 'Ocupación', ejemplo: 'Elegí', ancho: 124, obligatorio: true, opciones: 'ocupacion' },
  { campo: 'telefono', etiqueta: 'Teléfono', ejemplo: 'Teléfono', ancho: 118, obligatorio: true },
  { campo: 'email', etiqueta: 'Email', ejemplo: 'Email', ancho: 172, obligatorio: true },
  { campo: 'observaciones', etiqueta: 'Observaciones', ejemplo: '—', ancho: 140, obligatorio: false },
]

/** Los géneros, como los nombra el backend. */
export const GENEROS = [
  { valor: 'M', etiqueta: 'Masculino' },
  { valor: 'F', etiqueta: 'Femenino' },
  { valor: 'O', etiqueta: 'Otro' },
] as const

/** Las ocupaciones que ofrece el panel, iguales a las del formulario de cliente. */
export const OCUPACIONES = [
  'Estudiante', 'Empleado', 'Profesional', 'Empresario', 'Docente', 'Médico',
  'Ingeniero', 'Abogado', 'Contador', 'Comerciante', 'Técnico', 'Obrero',
  'Agricultor', 'Jubilado', 'Ama de casa', 'Desempleado', 'Otro',
] as const

export function filaVacia(): DatosDelPasajero {
  return {
    numeroDocumento: '', nombre: '', apellido: '', tipoDocumento: '',
    nacionalidad: '', paisResidencia: '', fechaNacimiento: '', sexo: '',
    ocupacion: '', telefono: '', email: '', observaciones: '',
  }
}

/** Qué campos obligatorios le faltan a una fila. */
export function loQueFalta(
  datos: DatosDelPasajero,
): (keyof DatosDelPasajero)[] {
  return COLUMNAS.filter(
    (columna) =>
      columna.obligatorio && !(datos[columna.campo] ?? '').toString().trim(),
  ).map((columna) => columna.campo)
}

/**
 * Un email con arroba y un punto después.
 *
 * No se valida más que eso: el backend es el que rechaza, y una regla estricta
 * acá sólo sirve para trabar una dirección legítima en el mostrador.
 */
const PARECE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function estaCompleta(datos: DatosDelPasajero): boolean {
  return loQueFalta(datos).length === 0 && PARECE_EMAIL.test(datos.email.trim())
}

/** Cuántas filas están listas para vender. */
export function cuantasCompletas(filas: DatosDelPasajero[]): number {
  return filas.filter(estaCompleta).length
}

/**
 * Copia un campo de una fila hacia todas las de abajo.
 *
 * Es lo que hace ⌘↓. Un grupo comparte apellido, teléfono de contacto,
 * nacionalidad y residencia: tipearlos dieciocho veces es la parte que hace
 * que quien vende prefiera el papel.
 *
 * Sólo pisa las que están vacías. Copiar sobre lo ya cargado convierte un
 * atajo en una forma de perder trabajo.
 */
export function copiarHaciaAbajo(
  filas: DatosDelPasajero[],
  desde: number,
  campo: keyof DatosDelPasajero,
): DatosDelPasajero[] {
  const valor = filas[desde]?.[campo]
  if (!valor) return filas

  return filas.map((fila, indice) =>
    indice > desde && !fila[campo] ? { ...fila, [campo]: valor } : fila,
  )
}
