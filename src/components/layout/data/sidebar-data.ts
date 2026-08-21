import {
  IconChecklist,
  IconLayoutDashboard,
  IconSettings,
  IconUserCog,
  IconBuilding,
  IconShoppingCart,
  IconCurrencyDollar,
  IconUsers,
  IconBell,
  IconFileReport,
  IconExternalLink,
} from '@tabler/icons-react'
import { Command } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  // Un solo espacio de trabajo: el selector queda como identidad, no como
  // conmutador. Los tres nombres de ejemplo que traía la plantilla
  // ("Acme Inc", "Acme Corp.") se veían en producción.
  teams: [
    {
      name: 'Pasaje Online',
      logo: Command,
      plan: 'Panel administrativo',
    },
  ],
  navGroups: [
    {
      title: 'Principal',
      items: [
        {
          title: 'Panel de control',
          url: '/',
          icon: IconLayoutDashboard,
        },
      ],
    },
    {
      title: 'Gestión de Servicios',
      items: [
        {
          title: 'Destinos',
          url: '/destinations',
          icon: IconChecklist,
        },
        {
          title: 'Empresas',
          url: '/companies',
          icon: IconBuilding,
        },
      ],
    },
    {
      title: 'Gestión de Usuarios',
      items: [
        {
          title: 'Usuarios',
          url: '/users',
          icon: IconUserCog,
        },
        {
          title: 'Clientes',
          url: '/clients',
          icon: IconUsers,
        },
      ],
    },
    {
      title: 'Ventas',
      items: [
        {
          title: 'Ventas',
          url: '/sales',
          icon: IconShoppingCart,
        },
      ],
    },
    {
      title: 'Informes',
      items: [
        {
          title: 'Informes',
          url: '/reports',
          icon: IconFileReport,
        },
      ],
    },
    {
      title: 'Configuración',
      items: [
        {
          title: 'Configuración',
          icon: IconSettings,
          items: [
            {
              title: 'Cargos por servicio',
              url: '/settings/service-charges',
              icon: IconCurrencyDollar,
            },
            {
              title: 'Notificaciones',
              url: '/settings/notifications',
              icon: IconBell,
            },
            {
              title: 'Datos externos',
              url: '/settings/external-data',
              icon: IconExternalLink,
            },
          ],
        },
      ],
    },
  ],
}
