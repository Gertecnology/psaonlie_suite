import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { sidebarData } from './data/sidebar-data'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <button onClick={toggleSidebar} className='focus:outline-none'>
          {collapsed ? (
            <img
              src='/images/iconopasaje.ico'
              alt='Logo mini'
              className='h-8 w-8'
            />
          ) : (
            <img
              src='https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-jk7LpXOiFM0FqL2A0IR1k0vHJXmllm.png'
              alt='pasajeonline'
              className='bg-slate-900 p-2 rounded-md'
            />
          )}
        </button>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
