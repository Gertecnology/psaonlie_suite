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
import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'

import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'Principal',
      items: [
        {
          title: 'Dashboard',
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
      title: 'Reportes',
      items: [
        {
          title: 'Reportes',
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
