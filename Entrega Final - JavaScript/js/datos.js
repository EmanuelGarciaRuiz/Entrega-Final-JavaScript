const CLAVE_CATALOGO = "tienda-catalogo";
const CLAVE_CARRITO = "tienda-carrito";
const CLAVE_DESCUENTO = "tienda-descuento";
const CLAVE_ULTIMO_PEDIDO = "tienda-ultimo-pedido";

const PORCENTAJE_IVA = 21;
const CODIGO_CUPON = "BIENVENIDO10";
const PORCENTAJE_CUPON = 10;

let catalogo = [];
let carrito = leerStorage(CLAVE_CARRITO, []);
let porcentajeDescuento = leerStorage(CLAVE_DESCUENTO, 0);

function leerStorage(clave, valorPorDefecto) {
  try {
    return JSON.parse(localStorage.getItem(clave)) ?? valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
}

function guardarStorage(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor));
}

function borrarStorage(clave) {
  localStorage.removeItem(clave);
}

function vaciarStorageDeLaTienda() {
  const claves = [CLAVE_CATALOGO, CLAVE_CARRITO, CLAVE_DESCUENTO, CLAVE_ULTIMO_PEDIDO];
  claves.forEach((clave) => borrarStorage(clave));
}

async function obtenerProductos() {
  const respuesta = await fetch("./data/productos.json");

  if (!respuesta.ok) {
    throw new Error("No se pudo leer el catálogo (error " + respuesta.status + ")");
  }

  const productosDelArchivo = await respuesta.json();
  const catalogoGuardado = leerStorage(CLAVE_CATALOGO, []);

  return productosDelArchivo.map((producto) => {
    const productoGuardado = catalogoGuardado.find((guardado) => guardado.id === producto.id);
    return productoGuardado ? { ...producto, stock: productoGuardado.stock } : producto;
  });
}

function buscarProducto(idProducto) {
  return catalogo.find((producto) => producto.id === idProducto);
}

function obtenerItemsDelCarrito() {
  return carrito
    .map(({ id, cantidad }) => ({ producto: buscarProducto(id), cantidad }))
    .filter(({ producto }) => producto);
}

function calcularResumen() {
  const subtotal = obtenerItemsDelCarrito().reduce(
    (acumulado, { producto, cantidad }) => acumulado + producto.precio * cantidad,
    0
  );
  const descuento = (subtotal * porcentajeDescuento) / 100;
  const iva = ((subtotal - descuento) * PORCENTAJE_IVA) / 100;
  const total = subtotal - descuento + iva;

  return { subtotal, descuento, iva, total };
}

function contarUnidadesEnCarrito() {
  return carrito.reduce((acumulado, { cantidad }) => acumulado + cantidad, 0);
}

function cantidadEnCarrito(idProducto) {
  const itemEncontrado = carrito.find((item) => item.id === idProducto);
  return itemEncontrado ? itemEncontrado.cantidad : 0;
}

function registrarPedido(datosComprador) {
  const items = obtenerItemsDelCarrito();
  const resumen = calcularResumen();

  items.forEach(({ producto, cantidad }) => {
    producto.stock -= cantidad;
  });

  const pedido = {
    numero: String(Date.now()).slice(-6),
    fecha: new Date().toLocaleString("es-AR"),
    comprador: datosComprador,
    productos: items.map(({ producto, cantidad }) => ({ nombre: producto.nombre, cantidad })),
    total: resumen.total,
  };

  carrito = [];
  porcentajeDescuento = 0;

  guardarStorage(CLAVE_CATALOGO, catalogo);
  guardarStorage(CLAVE_ULTIMO_PEDIDO, pedido);
  borrarStorage(CLAVE_CARRITO);
  borrarStorage(CLAVE_DESCUENTO);

  return pedido;
}