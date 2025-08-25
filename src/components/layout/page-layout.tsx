import React from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

interface PageLayoutProps {
  /** Título principal de la página */
  title: string
  /** Descripción opcional debajo del título */
  description?: string
  /** Contenido principal de la página */
  children: React.ReactNode
  /** Botones de acción principales (ej: botones de crear, exportar, etc.) */
  actions?: React.ReactNode
  /** Si el header debe ser fijo (con scroll) */
  fixedHeader?: boolean
  /** Si el main debe ser fijo (para layouts complejos como settings) */
  fixedMain?: boolean
  /** Clases CSS adicionales para el contenedor principal */
  className?: string
  /** Si mostrar la barra de búsqueda en el header */
  showSearch?: boolean
  /** Si mostrar los controles del header (search, theme, profile) */
  showHeaderControls?: boolean
}

export function PageLayout({
  title,
  description,
  children,
  actions,
  fixedHeader = true,
  fixedMain = false,
  className = '',
  showSearch = true,
  showHeaderControls = true,
}: PageLayoutProps) {
  return (
    <>
      {/* Header con controles estándar */}
      <Header fixed={fixedHeader}>
        {showSearch && <Search />}
        {showHeaderControls && (
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        )}
      </Header>

      {/* Contenido principal */}
      <Main fixed={fixedMain} className={className}>
        {/* Encabezado de la página con título, descripción y acciones */}
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
            {description && (
              <p className='text-muted-foreground'>{description}</p>
            )}
          </div>
          {actions && (
            <div className='flex-shrink-0'>
              {actions}
            </div>
          )}
        </div>

        {/* Contenido de la página con padding y scroll responsivo */}
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          {children}
        </div>
      </Main>
    </>
  )
}

// Variantes predefinidas para casos comunes
export function PageLayoutWithSearch({
  title,
  description,
  children,
  actions,
  ...props
}: Omit<PageLayoutProps, 'showSearch'>) {
  return (
    <PageLayout
      title={title}
      description={description}
      actions={actions}
      showSearch={true}
      {...props}
    >
      {children}
    </PageLayout>
  )
}

export function PageLayoutSimple({
  title,
  description,
  children,
  actions,
  ...props
}: Omit<PageLayoutProps, 'showSearch' | 'showHeaderControls'>) {
  return (
    <PageLayout
      title={title}
      description={description}
      actions={actions}
      showSearch={false}
      showHeaderControls={false}
      {...props}
    >
      {children}
    </PageLayout>
  )
}
