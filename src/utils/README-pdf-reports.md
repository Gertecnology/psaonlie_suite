# Sistema de Reportes PDF Reutilizable

Este sistema permite generar reportes en PDF siguiendo el diseño de facturas profesionales, usando `react-to-print`.

## Componentes Principales

### 1. `PDFReport` - Componente Base

Componente reutilizable que genera el layout del reporte siguiendo el diseño de la factura.

### 2. `usePDFReport` - Hook Personalizado

Hook que maneja la lógica de impresión y referencia del componente.

### 3. `SalesReport` - Componente Específico

Implementación específica para reportes de ventas.

## Uso Básico

```tsx
import { Download } from 'lucide-react'
import { PDFReport, usePDFReport } from '@/utils/pdf-report'
import { Button } from '@/components/ui/button'

function MiReporte({ data }: { data: any[] }) {
  const { componentRef, handlePrint } = usePDFReport()

  const columns = [
    { key: 'nombre', label: 'Nombre', width: '150px' },
    { key: 'email', label: 'Email', width: '200px' },
    { key: 'fecha', label: 'Fecha', width: '120px' },
  ]

  const companyInfo = {
    name: 'Mi Empresa',
    ruc: 'RUC 12345678-9',
    phone: '(021) 123-4567',
    address: 'Mi Dirección',
  }

  const reportInfo = {
    reportNumber: `REP-${Date.now().toString().slice(-8)}`,
    date: new Date().toISOString(),
  }

  return (
    <div>
      <Button onClick={handlePrint}>
        <Download className='mr-2 h-4 w-4' />
        Descargar PDF
      </Button>

      <div className='hidden'>
        <PDFReport
          ref={componentRef}
          title='MI REPORTE'
          companyInfo={companyInfo}
          reportInfo={reportInfo}
          data={data}
          columns={columns}
          footer='Mi empresa - Sistema de gestión'
        />
      </div>
    </div>
  )
}
```

## Propiedades del Componente PDFReport

### `title` (string, requerido)

Título principal del reporte.

### `subtitle` (string, opcional)

Subtítulo descriptivo del reporte.

### `companyInfo` (objeto, requerido)

Información de la empresa:

```tsx
{
  name: string,
  ruc?: string,
  phone?: string,
  address?: string,
  timbrado?: string
}
```

### `reportInfo` (objeto, requerido)

Información del reporte:

```tsx
{
  reportNumber: string,
  date: string,
  transactionId?: string
}
```

### `data` (array, requerido)

Array de datos a mostrar en la tabla.

### `columns` (array, requerido)

Configuración de las columnas:

```tsx
{
  key: string,           // Clave del campo en los datos
  label: string,          // Etiqueta de la columna
  width?: string,         // Ancho de la columna
  render?: (value, row) => React.ReactNode  // Función de renderizado personalizada
}
```

### `summary` (objeto, opcional)

Resumen financiero:

```tsx
{
  subtotalExento?: number,
  subtotalGravado?: number,
  iva?: number,
  total: number
}
```

### `footer` (string, opcional)

Texto del pie de página.

## Características del Diseño

- **Header**: Logo, nombre de empresa, información de contacto
- **Información del Reporte**: Título, fecha, número de transacción
- **Tabla de Datos**: Con bordes y estilos profesionales
- **Resumen**: Cálculos financieros con totales destacados
- **Footer**: Información adicional y fecha de generación

## Estilos Aplicados

- Fuente: Arial, sans-serif
- Tamaño: 14px
- Colores: Blanco de fondo, texto negro
- Bordes: Grises para las tablas
- Responsive: Se adapta al tamaño A4

## Ejemplos de Uso

Ver `src/utils/pdf-report-examples.tsx` para ejemplos completos de:

- Reporte de Clientes
- Reporte de Empresas
- Reporte Personalizado con Summary

## Integración en el Dashboard

El botón "Generar Reporte" está disponible en el dashboard principal y abre un modal con:

- Vista previa del reporte
- Estadísticas resumidas
- Botón de descarga PDF

## Notas Técnicas

- Usa `react-to-print` para la generación de PDF
- El componente se oculta visualmente pero se renderiza para la impresión
- Compatible con todos los navegadores modernos
- Optimizado para impresión en tamaño A4
