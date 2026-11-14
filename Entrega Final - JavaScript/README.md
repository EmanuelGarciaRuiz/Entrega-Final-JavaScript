# Tienda Tech

Entrega final - Aplicación web interactiva

Link al proyecto publicado: https://TU-USUARIO.github.io/TU-REPOSITORIO/

## De qué se trata
Armé una tienda online de tecnología. Se pueden ver los productos, buscarlos, filtrarlos por categoría y ordenarlos por precio. Después se agregan al carrito, se cambian las cantidades, se aplica un cupón de descuento y se finaliza la compra completando unos datos. Al terminar, la tienda muestra el último pedido y descuenta el stock de lo que se compró.

## Cómo probarla
Los productos están en un archivo `.json` y se leen con `fetch`, así que no alcanza con abrir el `index.html` con doble clic: el navegador lo bloquea y aparece un mensaje de error. Hay que abrirlo con un servidor, por ejemplo con la extensión Live Server de VS Code, o entrando al link de GitHub Pages de arriba.

## Cómo se usa
1. Entrás y ves los productos. Si querés, buscás por nombre, elegís una categoría o los ordenás por precio.
2. Con el botón "Agregar al carrito" van sumándose al carrito de la derecha.
3. En el carrito podés subir o bajar la cantidad de cada producto, o quitarlo.
4. A los 3 segundos aparece un aviso con un cupón. Si escribís `BIENVENIDO10` y tocás "Aplicar", el total baja un 10%.
5. Completás el nombre, el email y el medio de pago, y tocás "Finalizar compra".
6. Te pide confirmar y, si aceptás, la compra se registra y aparece en "Último pedido".

Si algo sale mal (por ejemplo, un producto sin stock o un email incorrecto) la página avisa con un mensaje. El botón "Restablecer tienda" de abajo borra todo lo guardado y vuelve al estado inicial.

## Cómo está armado
- Los productos viven en `data/productos.json`, no están escritos en el código.
- Los datos de los productos salen siempre del JSON. En el `localStorage` guardo el stock, el carrito, el cupón y el último pedido, para que no se pierdan al recargar la página.
- Para las notificaciones usé Toastify y para las confirmaciones SweetAlert2, en lugar de `alert` y `confirm`.
- Si falla la carga de los productos, la página muestra un error con un botón para reintentar.

## Lo que usé del curso
- DOM y eventos (`click`, `keyup`, `change` y `submit`)
- `fetch` con `async/await` y `try/catch/finally`
- Funciones de orden superior: `map`, `filter`, `reduce`, `find`, `forEach` y `sort`
- localStorage para guardar, modificar, borrar y vaciar datos
- Operador ternario, operador OR (`||`), `??` y destructuring
- `setTimeout` para el aviso del cupón

## Imágenes
En `productos.json` la propiedad `imagen` puede ir sin extensión (por ejemplo `assets/img/mouse-gamer`) y la página prueba `png`, `jpg`, `jpeg` y `webp`. Si un producto no tiene imagen o no se encuentra, muestra una imagen por defecto.

## Carpetas
```
index.html
README.md
assets/img/    logo y fotos de los productos
css/style.css
data/productos.json
js/datos.js     datos, storage y cálculos
js/interfaz.js  funciones que dibujan en pantalla
js/main.js      eventos y flujo de compra
```