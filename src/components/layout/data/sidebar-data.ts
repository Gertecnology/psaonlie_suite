import {
  IconChecklist,
  IconLayoutDashboard,
  IconSettings,
  IconUserCog,
  IconBuilding,
  IconReceipt,
  IconShoppingCart,
  IconCurrencyDollar,
  IconUsers,
  IconPalette,
  IconFileReport,
  IconExternalLink,
  IconBook,
} from '@tabler/icons-react'
import { Command } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
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
          title: 'Empresas y agencias',
          url: '/agencias',
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
          // La entrada del vendedor: primero ve lo que vendió, y desde ahí
          // abre el flujo. Antes la entrada era el buscador de servicios, que
          // sirve para vender pero no para saber cómo viene el día.
          title: 'Mis ventas',
          url: '/caja',
          icon: IconReceipt,
        },
        {
          title: 'Vender',
          url: '/sales',
          icon: IconShoppingCart,
        },
      ],
    },
    {
      title: 'Informes',
      items: [
        {
          // Los informes cuelgan del menú, no de una página índice. Una lista
          // de doce tarjetas con su descripción obligaba a leerla entera para
          // llegar a la que se buscaba; acá se elige de un clic, y el que se
          // usa todos los días queda a la vista.
          title: 'Informes',
          icon: IconFileReport,
          items: [
            { title: 'Resumen financiero', url: '/reports/resumen-financiero' },
            { title: 'Saldo por empresa', url: '/reports/por-agencia' },
            { title: 'Estado de ventas', url: '/reports/estado-ventas' },
            { title: 'Por método de pago', url: '/reports/por-metodo-pago' },
            { title: 'Por ruta', url: '/reports/por-ruta' },
            { title: 'Por servicio', url: '/reports/por-servicio' },
            { title: 'Evolución', url: '/reports/serie-temporal' },
            { title: 'Comparativo', url: '/reports/comparativo' },
            { title: 'Conciliación', url: '/reports/conciliacion-bancard' },
            { title: 'Cobradas sin boleto', url: '/reports/ventas-sin-boleto' },
            { title: 'Anomalías', url: '/reports/anomalias' },
          ],
        },
        {
          // El kardex va aparte: sus cifras salen del libro de movimientos y
          // no de `ventas`, así que mezclarlo con los informes sugeriría que
          // son intercambiables.
          title: 'Kardex',
          icon: IconBook,
          items: [{ title: 'Saldos', url: '/reports/kardex-saldos' }],
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
              title: 'Apariencia',
              url: '/settings/appearance',
              icon: IconPalette,
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
