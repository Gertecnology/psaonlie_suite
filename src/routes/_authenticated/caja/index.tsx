import { createFileRoute } from '@tanstack/react-router'

import { PaginaDeCaja } from '@/features/caja/components/pagina-de-caja'

/**
 * La entrada del vendedor.
 *
 * Va aparte de `/sales` y no la reemplaza: `/sales` es el flujo de venta —que
 * ya funciona y no hay razón para tocar— y esto es lo que faltaba, saber cómo
 * viene el día antes de empezar a vender.
 */
export const Route = createFileRoute('/_authenticated/caja/')({
  component: PaginaDeCaja,
})
