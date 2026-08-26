import { z } from 'zod'
import { PRESETS_PERIODO } from '@/lib/periodo'

/**
 * Filtros del panel, tal como viajan en la URL.
 *
 * Viven en la URL y no en un `useState` por tres razones concretas:
 * recargar la página no pierde el rango elegido, un informe se puede pasar por
 * chat como un link, y el botón "atrás" del navegador hace lo que el usuario
 * espera.
 *
 * Todo es opcional: entrar a `/` sin parámetros tiene que funcionar.
 */
export const esquemaFiltrosPanel = z.object({
  /** Preset del rango de fechas. */
  preset: z.enum(PRESETS_PERIODO).optional(),
  /** Inicio del rango, `YYYY-MM-DD` en hora local. Sólo con `preset=personalizado`. */
  desde: z.string().optional(),
  /** Fin del rango, `YYYY-MM-DD` en hora local. */
  hasta: z.string().optional(),
  /** Empresa por la que se filtra todo el panel. Vacío = todas. */
  agenciaId: z.string().optional(),
  /** Informe activo dentro de la sección de informes. */
  informe: z.string().optional(),
})

export type FiltrosUrl = z.infer<typeof esquemaFiltrosPanel>
