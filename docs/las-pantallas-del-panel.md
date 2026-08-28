# Fichas y listados

Cómo están construidas las pantallas de gestión del panel, y **por qué** están
así. Lo segundo es lo que importa: la forma se copia sola, la razón no.

Las reglas salieron de las pantallas de destinos, empresas, clientes, usuarios y
cargos por servicio. Cuando una regla y el código no coincidan, gana el código:
corregí este documento.

---

## El principio

**Una pantalla contesta preguntas, no muestra campos.** De acá sale todo lo
demás.

Un formulario con trece campos apilados en una columna es una lista de casillas.
Nadie sabe cuál importa, cuál depende de cuál, ni qué está haciendo cuando lo
completa.

Las pantallas se arman al revés: primero se identifican **las dos o tres
preguntas** que la pantalla contesta, y esas preguntas se vuelven las tarjetas.
Los campos van adentro de la pregunta a la que pertenecen.

| Pantalla | Las preguntas |
|---|---|
| Cliente | Quién es · Datos del pasajero |
| Usuario | Quién es · Qué puede hacer |
| Destino | Datos del destino · Dónde queda |
| Empresa | Datos y logo · Conexión al web service |
| Cargo por servicio | Qué es · Cuánto cobra |

El título de la tarjeta es la pregunta, en el idioma de quien la usa. Su
descripción dice para qué sirve la respuesta: «lo que va en el pasaje y en la
factura», «los pide la transportista al emitir», «el rol define qué pantallas ve
y qué puede tocar».

Cuando un campo no encuentra su pregunta, es señal de que la pregunta falta o de
que el campo sobra.

---

## El listado

```
┌───────────────────────────────────────────────┐
│ Clientes                       [Nuevo cliente]│
│ Las personas que compran pasajes.             │
├───────────────────────────────────────────────┤
│ [buscador]  [filtros]                   [Ver] │
├───────────────────────────────────────────────┤
│ la tabla                                      │
├───────────────────────────────────────────────┤
│ 10 de 246              [Anterior] [Siguiente] │
└───────────────────────────────────────────────┘
```

**Paginar y filtrar los hace el servidor, no el navegador.** Traer todo para
filtrarlo en memoria deja de funcionar mucho antes de que se note. Cuando se
nota, ya hay 20.000 filas y el problema es de arquitectura.

**La página y la búsqueda viven en la URL.** Una recarga conserva el contexto, y
un listado filtrado se puede pasar por chat como un enlace. Con el estado en
`useState`, ninguna de las dos cosas es posible.

**La tabla anterior se queda en pantalla mientras llega la siguiente**
(`keepPreviousData`). Sin eso, cada tecla del buscador vacía la tabla y la deja
en esqueleto: la pantalla salta en cada letra.

**Cambiar cualquier filtro vuelve a la página 1.** Quedarse en la página 4 de un
resultado que ahora tiene una sola muestra una tabla vacía sin explicación.

**La carga y el error se dibujan dentro de la tabla, no en lugar de la página.**
Al fallar la consulta se perdían el encabezado, los botones y la navegación, y no
quedaba forma de reintentar sin recargar.

**El vacío explica, no anuncia.** «No se encontraron clientes» es un hecho. «Los
clientes aparecen solos con cada venta; también podés cargarlos con Nuevo
cliente» es una salida. Por eso hay `emptyMessage` y `emptyHint`.

---

## La ficha

```
┌───────────────────────────────────────────────┐
│ Sebastián Castro    [← Clientes][Cancelar][Guardar]
│ Editando un cliente que ya existe.            │
├──────────────────────┬────────────────────────┤
│ Quién es             │ Datos del pasajero     │
│ Lo que va en el      │ Los pide la            │
│ pasaje y la factura. │ transportista.         │
│                      │                        │
├──────────────────────┴────────────────────────┤
│ [Datos de facturación] [Compras]              │
│ la tabla                                      │
└───────────────────────────────────────────────┘
```

**Dos tarjetas arriba, del mismo alto. Lo que es tabla va abajo, a todo el
ancho.** Una tabla dentro de una columna de la mitad del ancho no se lee. Y las
dos tarjetas comparten alto porque lo que está al lado se compara: si una queda
corta, parece que falta algo.

**El alto compartido es un mínimo, nunca un fijo.** Con `lg:h-[520px]`, la
columna que tenga un campo más se desborda. Con `lg:min-h-[520px]` crece. Es un
piso para que no queden desparejas, no un techo.

```tsx
const ALTO_DE_LA_FILA = 'lg:min-h-[520px]'

<div className='grid gap-5 lg:grid-cols-2'>
  <Card className={`flex flex-col ${ALTO_DE_LA_FILA}`}>…</Card>
  <Card className={`flex flex-col ${ALTO_DE_LA_FILA}`}>…</Card>
</div>
```

**Lo que decide qué aceptan los demás campos va arriba, a todo el ancho.** En el
alta de un cliente, la empresa define qué tipos de documento se pueden usar.
Ponerla al costado la vuelve un campo más entre otros; arriba se lee como lo que
es: un paso previo.

**Una sola ficha. No hay «ver detalles» y «editar» por separado.** Eran dos
pantallas del mismo registro sin forma de pasar de una a la otra. Ver un dato y
corregirlo son el mismo gesto, así que son la misma pantalla — y la dirección no
dice `/editar`, porque la pantalla no es sólo el formulario.

**Lo que rodea al registro va en pestañas, abajo.** La libreta de facturación de
un cliente, sus compras, las paradas de un destino, las agencias de una empresa.
Cada pestaña pagina y filtra en el servidor, igual que un listado.

---

## Dirección y navegación

**Página, nunca drawer.** Un panel lateral no tiene dirección: no se puede pasar
como enlace, una recarga lo pierde, y el botón de atrás cierra todo en vez de
deshacer el último paso. En una pantalla angosta, además, el formulario era sólo
más angosto, no más simple.

**El menú de la fila usa enlaces, no `onClick`.** Un enlace se abre en otra
pestaña, se copia y se comparte. Un handler no.

**El nombre en la tabla abre la ficha.** Llegar a un registro no debería exigir
encontrar el menú de la fila y elegir dentro de él.

**El parámetro de la ruta se llama como lo que la API acepta.**
`/clients/$email` y no `$id`, porque `/api/clientes` identifica por correo y no
existe un endpoint que reciba el id. Nombrarlo `$id` sería nombrarlo por algo que
el backend nunca acepta.

**Un diálogo sigue siendo diálogo cuando la pregunta es de sí o no.** Borrar no
merece dos navegaciones. Lo que se fue a página propia son los formularios, no
las confirmaciones.

---

## El encabezado

**Guardar y Cancelar viven arriba, atados al formulario por `id`.** Al final de
la página no se encuentran: hay que bajar hasta el fondo para descubrir si el
trabajo se puede guardar. El atributo `form` deja que el botón viva fuera del
`<form>` y siga enviándolo.

```tsx
const ID_DEL_FORM = 'cliente-form'

<Button type='submit' form={ID_DEL_FORM}>Guardar</Button>
…
<form id={ID_DEL_FORM} onSubmit={save}>…</form>
```

**El título es el nombre _guardado_, no el que se está tipeando.** Si no, el
encabezado se reescribe letra por letra mientras se corrige el nombre.

**«Hay cambios sin guardar», debajo de los botones.** Y un `beforeunload`
mientras el formulario esté sucio: un cierre accidental con el formulario a
medias pierde todo lo cargado.

**El submit vive en el `<form>`.** Así Enter guarda desde cualquier campo, sin
cablear nada.

---

## Cargar y fallar

**Un formulario que no pudo cargar no se dibuja.** Un formulario en blanco no se
distingue de uno cuyos datos están en blanco, y guardarlo escribe ese vacío
encima de lo que la persona tenía. En edición, sin registro, la pantalla dice qué
pasó y no muestra los campos.

**El formulario se rellena una sola vez, cuando el registro llega.** Con el
objeto entre las dependencias del efecto, cada refetch en segundo plano vuelve a
resetear el formulario y borra lo que se está escribiendo. Se clava en el id: un
refetch del mismo registro no cambia nada en pantalla.

```ts
const loadedId = React.useRef<string | null>(null)

React.useEffect(() => {
  if (!client || loadedId.current === client.id) return
  loadedId.current = client.id
  form.reset({ … })
}, [client, form])
```

**No se reintenta lo que el servidor ya rechazó.** Insistir no lo va a hacer
cambiar de opinión: falta el permiso, no existe, o los datos están mal. Los 5xx
sí se reintentan, y también lo que nunca llegó al servidor — que es el caso para
el que reintentar existe. La regla vive en `utils/reintentar`.

**El error de red lleva el status adentro** (`ApiError`). Sin él, quien lo recibe
no puede distinguir «no existe» de «el servidor se cayó», y termina reintentando
cuatro veces un 404.

**Sólo se navega si la operación salió bien.** Si falla, el formulario se queda
con todo lo cargado y el error a la vista. Navegar y avisar del error en un toast
tira el trabajo.

---

## Campos

**Un campo que no aplica no se deshabilita: no se muestra.** La comisión aparece
recién cuando el rol elegido es el de vendedor. Ofrecerla para un administrador
es pedir un dato que nadie va a leer.

**Lo que la API no acepta se muestra, pero no se edita.** El documento de un
cliente identifica a la persona y el endpoint de actualización no lo toma.
Esconderlo sería ocultar quién es; dejarlo editable sería prometer un guardado
que no ocurre.

**Los campos esperan a lo que depende de ellos.** Hasta que no hay empresa no se
sabe qué documentos se aceptan, así que el resto del alta está deshabilitado. Un
campo habilitado que va a ser descartado es una trampa.

**Un `<input>` de una línea para «observaciones» es un error.** Escondía todo lo
que pasara del ancho del campo, que es justamente donde se anota lo que no entra
en ningún otro. Va `Textarea`.

**El cero es un valor, no una ausencia.** Un vendedor en 0 % vende y no cobra. Se
manda explícito y se compara con `!== undefined`: con un truthy, ponerlo en cero
no se guardaría nunca.

---

## Lo irreversible

**Antes de borrar hay un `ConfirmDialog`, y dice qué pasa después.** No «¿estás
seguro?», sino «las facturas ya emitidas a su nombre no cambian; el cliente puede
volver a cargarlo al comprar». Lo que se necesita saber para decidir.

**Guardar se cierra de forma síncrona contra el doble click.** Dos clicks
seguidos se despachan antes de que React vuelva a renderizar, así que la guarda
es un `ref` y no un estado. Se reabre sólo si la operación falló.

**Lo que ya ocurrió no se reescribe.** Las ventas guardan su copia del porcentaje
y del cargo al momento de venderse. Cambiar el porcentaje de alguien no toca sus
comisiones ya liquidadas.

---

## Lo que muerde

Tres cosas que fallan en silencio. Las tres costaron una sesión de diagnóstico.

### El `<Select>` dentro de un `<form>` borra el valor cargado

Radix monta un `<select>` oculto para que el control participe del formulario
nativo, y cada vez que el valor cambia se lo asigna y dispara un `change` que
vuelve como `onValueChange`. Ese select sólo conoce las opciones ya registradas:
cuando el valor llega del backend antes que ellas, la asignación no encuentra
opción, el select queda vacío, y ese vacío vuelve **como si la persona hubiera
deseleccionado**.

Síntoma: se edita un registro, se guarda sin tocar nada, y el formulario exige
campos que estaban completos.

Está resuelto en el wrapper de `components/ui/select.tsx`, que descarta un `''`
cuando ya había un valor. No hace falta hacer nada en cada pantalla.

### `FormControl` pone el `id` en su hijo directo

Si envuelve a un `<div>` decorativo — el que lleva un signo `%` o un ícono — la
etiqueta queda apuntando al envoltorio: un lector de pantalla no dice el nombre
del campo y hacer clic en la etiqueta no enfoca nada.

```tsx
<div className='relative'>
  <FormControl><Input {...field} /></FormControl>
  <span>%</span>
</div>
```

El envoltorio va afuera. Testing Library lo detecta con «the element associated
with this label is non-labellable».

### `height: 100%` contra un padre de alto automático resuelve a cero

Un mapa, un canvas o cualquier cosa que se mida en porcentaje mide **cero** si su
contenedor no tiene alto propio: no se dibuja nada y no hay error. La salida es
una columna flex de alto completo y que el hijo tome lo que sobra, con un mínimo
para que nunca colapse: `flex h-full min-h-0 flex-col` arriba, `flex-1
min-h-[220px]` adentro.

---

## Una pantalla nueva

Antes de escribir el primer `<Card>`:

- [ ] **¿Cuáles son las dos preguntas que contesta?** Si hay una sola, quizá no
      necesita dos columnas. Si hay cinco, la pantalla hace demasiado.
- [ ] **¿Hay algo que decida qué aceptan los demás campos?** Va arriba, a todo el
      ancho.
- [ ] **¿Hay una tabla?** Abajo, a todo el ancho, paginando y filtrando en el
      servidor.
- [ ] **¿Ver y editar están separados?** Unificalos: son la misma pantalla.
- [ ] **¿Guardar y Cancelar están en el encabezado**, atados por
      `form={ID_DEL_FORM}`?
- [ ] **¿El título es el nombre guardado** y no el del formulario?
- [ ] **¿Qué se ve si la consulta falla?** Nunca un formulario vacío.
- [ ] **¿Qué se ve si no hay nada?** Un vacío que explica cómo dejar de estar
      vacío.
- [ ] **¿Hay algo irreversible?** Confirmación que diga qué pasa después.
- [ ] **¿Los tests prueban la pantalla** o el hook? Seis tests en verde con la
      pantalla rota ya pasó una vez.
