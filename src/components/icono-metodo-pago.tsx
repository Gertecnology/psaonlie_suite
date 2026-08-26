import { CreditCard, DollarSign } from 'lucide-react'

/**
 * Icon for a payment method.
 *
 * Card versus cash is the only distinction worth drawing: transfer, Wepa and
 * cash all end up as money in an account, and giving each its own glyph would
 * say nothing the label next to it does not already say.
 *
 * It replaces a four-case switch that was copied into two client screens and
 * returned the same icon in three of the four branches.
 */
export function IconoMetodoPago({
  metodo,
  className = 'h-4 w-4',
}: {
  metodo: string
  className?: string
}) {
  return metodo === 'BANCARD' ? (
    <CreditCard className={className} />
  ) : (
    <DollarSign className={className} />
  )
}
