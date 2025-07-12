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
        <button onClick={toggleSidebar} className="focus:outline-none">
          {collapsed ? (
            <img src="/images/iconopasaje.ico" alt="Logo mini" className='w-8 h-8' />
          ) : (
            <span className="w-40 h-10 flex items-center font-bold text-2xl select-none text-foreground">PasajeOnline</span>
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
