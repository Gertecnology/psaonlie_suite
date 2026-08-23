import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * `/reports` has no screen of its own.
 *
 * It used to be an index of twelve cards, each with a question and a
 * description — which meant reaching a report took reading a catalogue first.
 * The reports hang off the sidebar now, so this is only the entry point
 * somebody lands on from an old link.
 */
export const Route = createFileRoute('/_authenticated/reports/')({
  beforeLoad: () => {
    throw redirect({ to: '/reports/resumen-financiero' })
  },
})
