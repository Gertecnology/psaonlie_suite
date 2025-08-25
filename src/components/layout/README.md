# PageLayout Component

El `PageLayout` es un componente reutilizable que encapsula el patrón común de layout usado en todas las páginas de la aplicación.

## Características

- ✅ **Responsivo**: Se adapta automáticamente a diferentes tamaños de pantalla
- ✅ **Consistente**: Mantiene el mismo diseño en todas las páginas
- ✅ **Flexible**: Permite personalizar qué elementos mostrar
- ✅ **Accesible**: Incluye estructura semántica correcta
- ✅ **Mantenible**: Cambios en el layout se aplican automáticamente

## Uso Básico

```tsx
import { PageLayout } from '@/components/layout/page-layout'

export default function MiPagina() {
  return (
    <PageLayout
      title='Título de la Página'
      description='Descripción opcional de la página'
      actions={<MiBoton />}
    >
      {/* Contenido de la página */}
      <div>Mi contenido aquí</div>
    </PageLayout>
  )
}
```

## Props Disponibles

| Prop                 | Tipo        | Default       | Descripción                             |
| -------------------- | ----------- | ------------- | --------------------------------------- |
| `title`              | `string`    | **requerido** | Título principal de la página           |
| `description`        | `string`    | `undefined`   | Descripción opcional debajo del título  |
| `children`           | `ReactNode` | **requerido** | Contenido principal de la página        |
| `actions`            | `ReactNode` | `undefined`   | Botones de acción principales           |
| `fixedHeader`        | `boolean`   | `true`        | Si el header debe ser fijo (con scroll) |
| `fixedMain`          | `boolean`   | `false`       | Si el main debe ser fijo                |
| `className`          | `string`    | `''`          | Clases CSS adicionales                  |
| `showSearch`         | `boolean`   | `true`        | Si mostrar la barra de búsqueda         |
| `showHeaderControls` | `boolean`   | `true`        | Si mostrar controles del header         |

## Variantes Predefinidas

### PageLayoutWithSearch

Para páginas que siempre necesitan búsqueda:

```tsx
import { PageLayoutWithSearch } from '@/components/layout/page-layout'

;<PageLayoutWithSearch
  title='Mi Página'
  description='Descripción'
  actions={<Boton />}
>
  Contenido
</PageLayoutWithSearch>
```

### PageLayoutSimple

Para páginas simples sin controles del header:

```tsx
import { PageLayoutSimple } from '@/components/layout/page-layout'

;<PageLayoutSimple title='Mi Página' description='Descripción'>
  Contenido
</PageLayoutSimple>
```

## Ejemplos de Uso

### Página con Tabla y Acciones

```tsx
<PageLayout
  title='Empresas'
  description='Gestiona las empresas de transporte.'
  actions={<CompanyPrimaryButtons />}
>
  <DataTable data={companies} columns={columns} />
</PageLayout>
```

### Página Simple (Dashboard)

```tsx
<PageLayout
  title='Dashboard'
  description='Panel de control principal'
  showSearch={false}
>
  <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
    {/* Widgets del dashboard */}
  </div>
</PageLayout>
```

### Página con Layout Fijo (Settings)

```tsx
<PageLayout
  title='Configuración'
  description='Gestiona tu cuenta y preferencias'
  fixedMain={true}
  className='space-y-6'
>
  <div className='flex gap-6'>
    <aside className='w-1/5'>
      <SidebarNav />
    </aside>
    <div className='flex-1'>
      <Outlet />
    </div>
  </div>
</PageLayout>
```

## Responsividad

El componente maneja automáticamente:

- **Mobile**: Layout apilado verticalmente
- **Tablet**: Transición suave entre layouts
- **Desktop**: Layout horizontal optimizado
- **Scroll**: Header fijo con sombra en scroll

## Estructura HTML Generada

```html
<header class="header-fixed peer/header fixed z-50 w-[inherit] rounded-md">
  <search />
  <div class="ml-auto flex items-center space-x-4">
    <ThemeSwitch />
    <ProfileDropdown />
  </div>
</header>

<main class="px-4 py-6 peer-[.header-fixed]/header:mt-16">
  <div
    class="mb-2 flex flex-wrap items-center justify-between gap-x-4 space-y-2"
  >
    <div>
      <h2 class="text-2xl font-bold tracking-tight">Título</h2>
      <p class="text-muted-foreground">Descripción</p>
    </div>
    <div class="flex-shrink-0">
      <!-- Acciones -->
    </div>
  </div>

  <div
    class="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0"
  >
    <!-- Contenido -->
  </div>
</main>
```

## Migración desde Layout Manual

### Antes (Layout Manual)

```tsx
<Header fixed>
  <Search />
  <div className='ml-auto flex items-center space-x-4'>
    <ThemeSwitch />
    <ProfileDropdown />
  </div>
</Header>

<Main>
  <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
    <div>
      <h2 className='text-2xl font-bold tracking-tight'>Título</h2>
      <p className='text-muted-foreground'>Descripción</p>
    </div>
    <PrimaryButtons />
  </div>
  <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
    {children}
  </div>
</Main>
```

### Después (Con PageLayout)

```tsx
<PageLayout
  title='Título'
  description='Descripción'
  actions={<PrimaryButtons />}
>
  {children}
</PageLayout>
```

## Beneficios de la Migración

1. **Menos código**: Elimina ~15 líneas de boilerplate por página
2. **Consistencia**: Todas las páginas se ven igual automáticamente
3. **Mantenibilidad**: Cambios en el layout se aplican en todas las páginas
4. **Testing**: Más fácil testear componentes individuales
5. **Accesibilidad**: Estructura semántica consistente
6. **Responsividad**: Manejo automático de diferentes tamaños de pantalla
