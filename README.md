# Pasaje Online — Panel administrativo

Panel de operación de Pasaje Online: ventas de pasajes, empresas y agencias,
destinos, usuarios, informes y monitoreo de conectividad de las transportistas.

## Tech stack

- **UI**: React 19 + [shadcn/ui](https://ui.shadcn.com) (Tailwind CSS v4 + Radix)
- **Routing**: [TanStack Router](https://tanstack.com/router) (rutas por archivo, filtros en la URL)
- **Datos**: TanStack Query + TanStack Table
- **Build**: Vite 7 · TypeScript · ESLint + Prettier

## Correr localmente

```bash
pnpm install
pnpm run dev        # levanta el panel
pnpm run test       # vitest con TZ=America/Asuncion
pnpm run build      # tsc -b && vite build
```

El panel espera el backend de Pasaje Online (`psa_be_online`); las variables de
entorno van en `.env.local` (URL de la API y del frontend).

## Convenciones de la casa

- El contexto de diseño vive en `.impeccable.md`: sala de control contable,
  precisa, sobria y densa. Los colores salen de los tokens de `src/index.css`
  (oklch, modo claro/oscuro); nunca hex hardcodeado en componentes.
- El color nunca es el único canal: todo estado lleva ícono y texto.
- Una sola tabla de datos (`src/components/data-table`): no se copia en las
  features.
- Crear y editar son páginas con dirección propia, no modales ni cajones.
- Copia en español, voseo; los estados vacíos enseñan el primer paso.
