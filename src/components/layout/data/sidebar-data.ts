import {
  IconBrowserCheck,
  IconChecklist,
  IconLayoutDashboard,
  IconNotification,
  IconPalette,
  IconSettings,
  IconTool,
  IconUserCog,
  IconBuilding,
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
          url: '/tasks',
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
      title: 'Otros',
      items: [
        {
          title: 'Configuración',
          icon: IconSettings,
          items: [
            {
              title: 'Perfil',
              url: '/settings',
              icon: IconUserCog,
            },
            {
              title: 'Cuenta',
              url: '/settings/account',
              icon: IconTool,
            },
            {
              title: 'Apariencia',
              url: '/settings/appearance',
              icon: IconPalette,
            },
            {
              title: 'Notificaciones',
              url: '/settings/notifications',
              icon: IconNotification,
            },
            {
              title: 'Mostrar',
              url: '/settings/display',
              icon: IconBrowserCheck,
            },
          ],
        },
      ],
    },
  ],
}
