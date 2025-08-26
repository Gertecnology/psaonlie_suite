# 🗺️ Destinations Feature

## 📋 Descripción

El módulo de **Destinations** gestiona los destinos de transporte y sus paradas homologadas. Permite crear, editar, eliminar y visualizar destinos con funcionalidades avanzadas de filtrado, búsqueda y paginación.

## 🏗️ Arquitectura

### **📁 Estructura de Directorios**

```
destinations/
├── components/           # Componentes de UI
├── hooks/               # Hooks de React Query
├── models/              # Esquemas Zod y tipos TypeScript
├── services/            # Llamadas HTTP a la API
├── store/               # Estado local con Zustand
└── index.ts             # Archivo de barril (exports)
```

### **🔄 Flujo de Datos**

```
Componente → Hook → Service → API
    ↓           ↓       ↓      ↓
   UI      Estado    HTTP   Backend
```

## 🎯 Componentes Principales

### **DestinationDetailsHeader**

- **Propósito**: Header principal de la página de detalles
- **Características**:
  - Botón "Volver" elegante
  - Título y badge de estado
  - Botones de acción (Editar/Eliminar)
  - Estadísticas visuales simplificadas
  - Integración directa con `DestinationParadasList`

### **DestinationParadasList**

- **Propósito**: Lista filtrable y ordenable de paradas homologadas
- **Características**:
  - Búsqueda en tiempo real
  - Filtros por estado (activo/inactivo)
  - Ordenamiento por nombre, empresa o estado
  - Indicadores visuales de estado
  - Información de resultados filtrados
  - **Botón de remover parada** con confirmación

### **RemoveParadaDialog**

- **Propósito**: Diálogo de confirmación para remover paradas del destino
- **Características**:
  - Confirmación visual clara
  - Información del destino y parada
  - Advertencia de acción irreversible
  - Estados de carga durante la operación
  - Integración con toast notifications

### **DestinationMutateDrawer**

- **Propósito**: Formulario para crear/editar destinos
- **Características**:
  - Validación con Zod
  - Selección múltiple de paradas
  - Estados de carga optimizados
  - Integración con hooks de mutación

## 🎣 Hooks Disponibles

### **useGetDestination(id: string)**

- **Propósito**: Obtener un destino específico por ID
- **Retorna**: `{ data, isLoading, error, refetch }`
- **Cache**: 5 minutos stale, 10 minutos GC

### **useGetDestinations(params?)**

- **Propósito**: Obtener lista paginada de destinos
- **Retorna**: `{ data, isLoading, error, refetch }`
- **Cache**: 2 minutos stale, 5 minutos GC

### **useCreateDestination()**

- **Propósito**: Crear un nuevo destino
- **Retorna**: `{ mutate, isPending, error }`
- **Características**: Toast notifications, cache invalidation

### **useUpdateDestination()**

- **Propósito**: Actualizar un destino existente
- **Retorna**: `{ mutate, isPending, error }`
- **Características**: Toast notifications, cache invalidation

### **useDeleteDestination()**

- **Propósito**: Eliminar un destino
- **Retorna**: `{ mutate, isPending, error }`
- **Características**: Toast notifications, cache invalidation

### **useRemoveParadaHomologada()**

- **Propósito**: Remover una parada homologada de un destino específico
- **Retorna**: `{ mutate, isPending, error }`
- **Características**: Toast notifications, cache invalidation, actualización automática de la UI

### **useGetParadasHomologadas(descripcion?)**

- **Propósito**: Obtener lista de paradas para formularios
- **Retorna**: `{ data, isLoading, error }`
- **Cache**: 10 minutos stale, 30 minutos GC

### **useGetDestinationForEdit(id, enabled)**

- **Propósito**: Obtener destino específico para edición (con paradas homologadas)
- **Retorna**: `{ data, isLoading, error }`
- **Cache**: 0 minutos stale (siempre fresco), 5 minutos GC
- **Uso**: Especialmente útil en formularios de edición

## 🗄️ Store (Zustand)

### **useDestinationDialog**

- **Estado**: `{ open, isUpdate, data }`
- **Acciones**: `openDialog(mode, data)`, `close()`

### **useDestinationDeleteDialog**

- **Estado**: `{ open, id }`
- **Acciones**: `openDialog(id)`, `close()`

## 📊 Modelos de Datos

### **Destination**

```typescript
interface Destination {
  id: string
  nombre: string
  activo: boolean
  paradasHomologadas?: Array<{
    id: string
    nombre: string
    activo: boolean
    empresaNombre: string
  }>
  cantidadParadas?: number
}
```

### **DestinationFormValues**

```typescript
interface DestinationFormValues {
  nombre: string
  paradasHomologadasIds: string[]
}
```

## 🚀 Uso en Componentes

### **Página Principal (Lista)**

```tsx
import {
  useGetDestinations,
  useDeleteDestination,
} from '@/features/destinations'

export function DestinationsPage() {
  const { data, error, refetch } = useGetDestinations({
    page: '1',
    limit: '10',
  })

  const deleteDestination = useDeleteDestination()

  const handleDelete = (id: string) => {
    deleteDestination.mutate(id, {
      onSuccess: () => refetch(),
    })
  }

  // ... resto del componente
}
```

### **Página de Detalles**

```tsx
import { useGetDestination } from '@/features/destinations'

export function DestinationDetailsPage({ id }: { id: string }) {
  const { data: destination, isLoading, error } = useGetDestination(id)

  if (error) return <ErrorMessage error={error} />

  return (
    <DestinationDetailsHeader
      destination={destination}
      loading={isLoading}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )
}
```

### **Formulario de Creación/Edición**

```tsx
import {
  useCreateDestination,
  useUpdateDestination,
} from '@/features/destinations'

export function DestinationForm({ isUpdate, initialData }) {
  const createDestination = useCreateDestination()
  const updateDestination = useUpdateDestination()

  const onSubmit = (data: DestinationFormValues) => {
    if (isUpdate) {
      updateDestination.mutate({ id: initialData.id, data })
    } else {
      createDestination.mutate(data)
    }
  }

  // ... resto del componente
}
```

## ✨ Características Destacadas

### **1. Cache Inteligente**

- **Stale Time**: Datos considerados frescos por 2-10 minutos
- **GC Time**: Datos en memoria por 5-30 minutos
- **Invalidación Automática**: Cache se actualiza tras mutaciones

### **2. Estados de Carga Optimizados**

- **Loading States**: Indicadores visuales durante operaciones
- **Error Handling**: Manejo centralizado de errores
- **Optimistic Updates**: UI se actualiza inmediatamente

### **3. Filtrado y Búsqueda Avanzada**

- **Búsqueda en Tiempo Real**: Filtrado instantáneo
- **Filtros Múltiples**: Por estado, empresa, etc.
- **Ordenamiento**: Por diferentes criterios
- **Paginación**: Navegación eficiente en grandes datasets

### **4. Responsive Design**

- **Mobile First**: Optimizado para dispositivos móviles
- **Adaptativo**: Se adapta a diferentes tamaños de pantalla
- **Accesibilidad**: Cumple estándares de accesibilidad

## 🔧 Configuración

### **React Query**

```typescript
// Configuración automática en main.tsx
<QueryClientProvider client={queryClient}>
  {/* App */}
</QueryClientProvider>
```

### **Toast Notifications**

```typescript
// Configurado automáticamente en hooks
import { toast } from 'sonner'

// Los hooks manejan automáticamente las notificaciones
```

## 📱 Responsive Features

### **Mobile (< 768px)**

- Layout vertical optimizado
- Botones de tamaño táctil
- Navegación simplificada

### **Tablet (768px - 1024px)**

- Layout híbrido
- Sidebar colapsable
- Contenido adaptativo

### **Desktop (> 1024px)**

- Layout completo
- Sidebar siempre visible
- Funcionalidades avanzadas

## 🎨 Temas y Estilos

### **Light Theme**

- Colores suaves y legibles
- Sombras sutiles
- Alto contraste

### **Dark Theme**

- Colores oscuros elegantes
- Acentos de color
- Reducción de fatiga visual

## 🚀 Mejoras Futuras

### **Funcionalidades Planificadas**

- [ ] Exportación a Excel/CSV
- [ ] Importación masiva
- [ ] Historial de cambios
- [ ] Notificaciones push
- [ ] Dashboard de métricas

### **Optimizaciones Técnicas**

- [ ] Virtualización de listas largas
- [ ] Lazy loading de componentes
- [ ] Service Worker para offline
- [ ] Tests unitarios y E2E

## 📚 Referencias

- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Zod Documentation](https://zod.dev/)
- [Shadcn/ui Components](https://ui.shadcn.com/)
