import {
  IconChecklist,
  IconLayoutDashboard,
  //IconSettings,
 //IconTool,
 //IconUserCog,
  IconBuilding,
  IconShoppingCart,
  //IconCurrencyDollar,
  IconUsers,
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
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: IconLayoutDashboard,
        },
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
        {
          title: 'Clientes',
          url: '/clients',
          icon: IconUsers,
        },
        {
          title: 'Ventas',
          url: '/sales',
          icon: IconShoppingCart,
        }
      ],
    },
    /*{
      title: 'Otros',
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
          ],
        },
      ],
    },*/
  ],
}
