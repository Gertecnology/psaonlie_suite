import { ClientsDeleteDialog } from './clients-delete-dialog'

/**
 * What is left of the client list's overlays.
 *
 * El alta se fue a `/clients/nuevo` y la ficha a `/clients/$email`; con ella se
 * fueron la pantalla de detalle y la ventana de compras, que mostraban al mismo
 * cliente en tres lugares distintos. Borrar sigue preguntando, y sigue
 * preguntando en un diálogo: una pregunta de sí o no no merece dos
 * navegaciones.
 */
export function ClientsDialogs() {
  return <ClientsDeleteDialog />
}
