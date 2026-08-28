# Por qué el HTML no se cachea y los assets sí

`index.html` va con `no-cache, must-revalidate`. Es el único archivo que dice
**qué versión de la aplicación hay que cargar**: si el navegador se queda con
uno viejo, sigue pidiendo los bundles viejos por su nombre, y ésos sí están
cacheados. El resultado es alguien usando una versión de hace horas y
recargando sin que cambie nada.

Pasó: se desplegó un cambio del flujo de cobro, el servidor lo tenía, y en el
navegador seguía la pantalla anterior después de varias recargas.

Los archivos de `assets/` van con `immutable` y un año de caché, y eso es
seguro justamente porque llevan el hash del contenido en el nombre: cuando el
código cambia, cambia el nombre del archivo. Nunca se sirve uno viejo por
error, y no hay que revalidar nada en cada carga.

Sin este archivo, `serve` no manda `Cache-Control` en el HTML y cada navegador
aplica su propia heurística.
