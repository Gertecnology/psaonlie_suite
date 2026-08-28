# Los informes del panel, en formato contable

Este documento es el contrato del que salen los trece informes. Cuando una regla
de acá y el código no coincidan, gana el código: `por-agencia.tsx` es el
ejemplo de referencia y está migrado.

## Qué es un informe acá

Un documento contable, no una pantalla de análisis. Se emite, se lee, se
archiva y se firma en papel. No es un tablero: quien lo usa concilia, no
explora.

## El reparto de la pantalla

**Arriba, fuera de la hoja** — `MarcoInforme` lo dibuja solo:

- el título del informe y su código (`INF-ADM-002`),
- los controles de filtro,
- el botón **Emitir**,
- el botón **Exportar a PDF**, que sólo aparece cuando hay algo que exportar.

**Dentro de la hoja** — `HojaInforme`, también automático:

- membrete: razón social, RUC, dirección; a la derecha el nombre del documento
  en mayúsculas y el código,
- una línea con los filtros **aplicados**: período, los extras que el informe
  declare, moneda, criterio de imputación, emisión, usuario y condición,
- el cuerpo, que es lo único que cada informe escribe,
- el pie con la identificación completa del documento.

## Lo que un informe NO lleva

Estas cuatro son correcciones explícitas del dueño, no preferencias:

1. **Ningún control de filtro dentro de la hoja.** Un informe emitido no se
   filtra; se lee. Dentro va qué se aplicó, en texto.
2. **Ningún bloque de notas al final.** Si una columna necesita un párrafo para
   entenderse, tiene mal el nombre: la aclaración va en la unidad del
   encabezado o no va.
3. **Ninguna sección de firmas.** Ni preparado, ni revisado, ni recibido
   conforme.
4. **Ningún párrafo suelto debajo de la tabla.** Lo que sea una conclusión va
   *antes* del detalle, como renglones (ver `antesDeLaTabla`).

Tampoco: gráficos, indicadores grandes con flechas de variación, tarjetas de
métricas ni exportación a Excel.

## Lo que sí lleva, al cerrar

En este orden y nada más: la **fila de totales**, el **`SON:`** con el importe
en letras, y el **pie** del documento.

El `SON:` se omite —pasando `sonImporte` sin definir— en los informes que no
liquidan un importe: sumar variaciones porcentuales o listar partidas a revisar
no da una cifra que alguien vaya a pagar.

## Cómo se escribe un informe

```tsx
const DEFINICION = informePorRuta('por-agencia')!

export function InformePorAgencia() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } = useFiltrosInforme()
  const { data, isLoading, error } = useInforme<InformePorAgencia>(DEFINICION.ruta, aplicados)

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={aplicados}
      periodo={data?.periodo}
      isLoading={isLoading}
      error={error}
      onEmitir={generar}
      puedeEmitir={puedeGenerar}
      controles={<FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />}
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    />
  )
}
```

El cuerpo es una `TablaContable` con sus columnas:

```tsx
const columnas: ColumnaContable<SaldoAgencia>[] = [
  { clave: 'empresa', titulo: 'Empresa', alinear: 'izquierda',
    celda: (fila) => fila.empresaNombre,
    total: <span className='text-[12px] tracking-wide uppercase'>Totales del período</span> },
  { clave: 'pasajes', titulo: 'Pasajes', unidad: 'Gs.', ancho: 128,
    celda: (fila) => formatearGuaranies(fila.pasajes),
    total: formatearGuaranies(totales.pasajes) },
]
```

Reglas de las columnas:

- La **primera** columna es la que identifica el renglón, va `alinear:
  'izquierda'` y su `total` es el rótulo de la fila de cierre.
- Las de importe llevan `unidad: 'Gs.'` y ancho fijo; las de conteo, la unidad
  que corresponda (`ventas`, `boletos`).
- **Toda planilla cierra con fila de totales.** Si la API devuelve un objeto de
  totales, se usa ése. Si no lo devuelve, se suma la columna con `sumar()` de
  `models/totales.ts` — es legítimo porque la hoja lista todos los renglones
  del período, así que el total es la suma de lo que está a la vista.
- Lo que **sí** está prohibido es totalizar una hoja recortada. Cuando la
  respuesta trae `total` y hay más renglones que los listados, `rotuloDeLosTotales`
  y `alcanceDeLosTotales` cambian el rótulo y lo escriben debajo: un total que
  dice ser del período y suma una página es una cifra que no existe en ningún
  otro lado.
- Una columna que no se totaliza —un porcentaje vigente, una fecha— muestra `—`.
- Un valor que no aplica se escribe `—`. El cero se escribe `0`.
- Los renglones se numeran solos: no agregues una columna de N°.

Renglones observados: `observada={(fila) => …}` los tiñe, y además el renglón
tiene que decirlo con texto —en la celda que identifica la fila, en chico y en
`text-destructive`—. El color nunca es el único canal: en papel no se imprime.

## Filtros extra

Los que el informe acepte además de período y empresa se pasan a
`FiltrosInformeControles` con `extras={['metodoPago']}`, y se declaran para la
ficha técnica de la hoja con `filtrosDescritos`:

```tsx
filtrosDescritos={data ? [{ etiqueta: 'Agrupado por', valor: etiquetaAgrupacion(data.agruparPor) }] : undefined}
```

Sin eso, un informe semanal impreso es indistinguible de uno diario con pocos
días.

## Lo que no se toca

- Los modelos (`models/*.ts`) y los servicios: las cifras siguen saliendo de
  `/api/admin/informes`, sin cálculos propios del panel.
- El hook `useFiltrosInforme` y su regla: nada se consulta hasta que se pide.
- El período que muestra la hoja es el que **devolvió** la API, nunca el que se
  pidió.
