# Los métodos de pago están escritos tres veces

Verificado el 2026-08-28, contra la base de desarrollo.

## El estado

Hay **tres listas** de métodos de pago, y ya divergen entre sí:

| dónde | qué tiene |
|---|---|
| enum `metodo_pago` de la base | `BANCARD`, `WEPA`, `TRANSFERENCIA`, `EFECTIVO` |
| `venta.service.ts` → `obtenerMetodosPagoDisponibles` | `BANCARD`, `WEPA`, `TRANSFERENCIA` — **sin efectivo** |
| `pasaje_dashboard/src/lib/metodo-pago.ts` | los cuatro, escritos a mano |

Dos cosas que salen de ahí:

**El endpoint que expone los métodos no incluye efectivo.** `GET
/api/ventas/metodos-pago/:agenciaId` devuelve tres objetos literales, escritos
en el código del servicio. Si el panel lo consumiera tal como está, un vendedor
no podría cobrar en efectivo — que es el método de la caja.

**El panel no lo llama.** Tiene su propia lista en `lib/metodo-pago.ts`. Es el
mismo patrón que tenían los informes: un endpoint que existe hace meses y que
nadie consume.

## Por qué no se resolvió consumiendo el endpoint

Porque el endpoint tampoco lee la base. **La base no sabe qué métodos acepta
cada empresa.** Lo único que hay es:

- `agencias.instrucciones_pago` — texto libre, cargado en 1 de 42 empresas
- `agencias.venta_habilitada` — `S` / `N`, y no distingue por método
- `cuentas_bancarias` — **vacía**

No es que el panel duplique algo que existe. No existe en ningún lado más que
en el código.

## Lo que corresponde hacer

Una tabla de métodos por empresa: qué acepta cada una, con su nombre visible,
su orden y sus datos de cobro. Que el endpoint la lea, y que el panel y la
landing la consuman.

Mientras tanto, la pantalla de caja usa `lib/metodo-pago.ts`. Es la lista
completa —la única de las tres que tiene los cuatro— y está en `lib/` y no
dentro de una feature justamente porque las pantallas de caja y los informes
necesitan la misma.

## Lo que sí sale de la base, para no confundirlo

Esto ya está bien y no hay que tocarlo: `service_charges` (9 filas),
`tipos_documento_empresa` (16), `dias_configuracion` (7), países y paradas
homologadas. Todo eso el panel lo pide a la API.
