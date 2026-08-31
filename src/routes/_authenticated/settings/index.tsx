import { Link, createFileRoute } from '@tanstack/react-router'
import {
  IconClock,
  IconCurrencyDollar,
  IconExternalLink,
  IconPalette,
} from '@tabler/icons-react'

// El índice viejo era el formulario de perfil de la plantilla: nombres de
// ejemplo en estado local que no se guardaban en ningún lado. El índice de
// verdad es un mapa de la configuración que existe, con su explicación.
const secciones = [
  {
    url: '/settings/reservas',
    icon: IconClock,
    titulo: 'Reservas',
    detalle: 'Cuánto tiempo se le guardan las butacas a quien está vendiendo.',
  },
  {
    url: '/settings/service-charges',
    icon: IconCurrencyDollar,
    titulo: 'Cargos por servicio',
    detalle: 'Lo que el sistema suma al precio del pasaje, con su vigencia.',
  },
  {
    url: '/settings/external-data',
    icon: IconExternalLink,
    titulo: 'Datos externos',
    detalle: 'Los servicios y horarios que el sistema conoce de las empresas.',
  },
  {
    url: '/settings/appearance',
    icon: IconPalette,
    titulo: 'Apariencia',
    detalle: 'Tipografía y tema del panel; se guarda por usuario.',
  },
] as const

export const Route = createFileRoute('/_authenticated/settings/')({
  component: SettingsIndex,
})

function SettingsIndex() {
  return (
    <div className='divide-border border-border max-w-2xl divide-y border-y'>
      {secciones.map(({ url, icon: Icono, titulo, detalle }) => (
        <Link
          key={url}
          to={url}
          className='hover:bg-accent/50 flex items-center gap-4 rounded-md px-2 py-4'
        >
          <Icono size={20} className='text-muted-foreground shrink-0' />
          <span>
            <span className='block font-medium'>{titulo}</span>
            <span className='text-muted-foreground block text-sm'>
              {detalle}
            </span>
          </span>
        </Link>
      ))}
    </div>
  )
}
