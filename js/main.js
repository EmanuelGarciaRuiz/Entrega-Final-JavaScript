const botonRecargar = document.getElementById("btn-recargar");
const botonFinalizar = document.getElementById("btn-finalizar");
const botonVaciar = document.getElementById("btn-vaciar");
const botonCupon = document.getElementById("btn-cupon");
const botonReiniciar = document.getElementById("btn-reiniciar");
const formularioCompra = document.getElementById("form-compra");
const campoCupon = document.getElementById("cupon");
const avisoBienvenida = document.getElementById("aviso");

async function cargarProductos() {
  estadoCarga.innerHTML = `<span class="spinner"></span> Cargando productos...`;
  botonRecargar.disabled = true;

  try {
    catalogo = await obtenerProductos();
    renderizarCategorias();
    renderizarTodo();
    estadoCarga.textContent = `${catalogo.length} productos cargados`;
    mostrarNotificacion("Productos cargados con éxito", "ok");
  } catch (error) {
    catalogo = leerStorage(CLAVE_CATALOGO, []);
    renderizarCategorias();
    renderizarTodo();
    estadoCarga.innerHTML = `<div class="error-caja">No se pudieron cargar los productos. <button id="btn-reintentar">Reintentar</button></div>`;
    document.getElementById("btn-reintentar").addEventListener("click", cargarProductos);
    mostrarNotificacion("Error al cargar los productos: " + error.message, "error");
  } finally {
    botonRecargar.disabled = false;
  }
}

function agregarAlCarrito(idProducto) {
  const producto = buscarProducto(idProducto);
  const itemEnCarrito = carrito.find((item) => item.id === idProducto);

  if (cantidadEnCarrito(idProducto) >= producto.stock) {
    mostrarNotificacion("No hay más stock de " + producto.nombre, "error");
    return;
  }

  if (itemEnCarrito) {
    itemEnCarrito.cantidad++;
  } else {
    carrito.push({ id: idProducto, cantidad: 1 });
  }

  guardarStorage(CLAVE_CARRITO, carrito);
  renderizarTodo();
  mostrarNotificacion("Agregaste " + producto.nombre + " al carrito", "ok");
}

function cambiarCantidad(idProducto, variacion) {
  const producto = buscarProducto(idProducto);
  const itemEnCarrito = carrito.find((item) => item.id === idProducto);
  const nuevaCantidad = itemEnCarrito.cantidad + variacion;

  if (nuevaCantidad <= 0) {
    quitarDelCarrito(idProducto);
    return;
  }

  if (nuevaCantidad > producto.stock) {
    mostrarNotificacion("No hay más stock de " + producto.nombre, "error");
    return;
  }

  itemEnCarrito.cantidad = nuevaCantidad;
  guardarStorage(CLAVE_CARRITO, carrito);
  renderizarTodo();
}

function quitarDelCarrito(idProducto) {
  carrito = carrito.filter((item) => item.id !== idProducto);

  if (carrito.length === 0) {
    borrarStorage(CLAVE_CARRITO);
  } else {
    guardarStorage(CLAVE_CARRITO, carrito);
  }
  renderizarTodo();
}

function leerDatosDelComprador() {
  return {
    nombre: document.getElementById("comprador-nombre").value.trim(),
    email: document.getElementById("comprador-email").value.trim(),
    medioDePago: document.getElementById("medio-de-pago").value,
  };
}

async function finalizarCompra(evento) {
  evento.preventDefault();

  if (carrito.length === 0) {
    mostrarNotificacion("Agregá productos al carrito antes de comprar", "error");
    return;
  }

  const datosComprador = leerDatosDelComprador();
  const { nombre, email } = datosComprador;

  if (nombre.length < 3 || !email.includes("@")) {
    mostrarNotificacion("Completá un nombre y un email válidos", "error");
    return;
  }

  const { total } = calcularResumen();
  const confirmacion = await Swal.fire({
    title: "Confirmar compra",
    text: `Vas a pagar ${formatearPrecio(total)} con ${datosComprador.medioDePago}`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Confirmar",
    cancelButtonText: "Cancelar",
  });

  if (!confirmacion.isConfirmed) {
    return;
  }

  botonFinalizar.disabled = true;

  try {
    const pedido = registrarPedido(datosComprador);
    formularioCompra.reset();
    await Swal.fire({
      title: "Compra realizada",
      text: `Tu pedido N° ${pedido.numero} fue registrado. Total: ${formatearPrecio(pedido.total)}`,
      icon: "success",
    });
  } catch {
    mostrarNotificacion("No se pudo procesar la compra, intentá de nuevo", "error");
  } finally {
    botonFinalizar.disabled = false;
    renderizarTodo();
  }
}

function aplicarCupon() {
  const codigoIngresado = campoCupon.value.trim().toUpperCase();
  campoCupon.value = "";

  if (codigoIngresado !== CODIGO_CUPON) {
    mostrarNotificacion("Ese cupón no es válido", "error");
    return;
  }

  porcentajeDescuento = PORCENTAJE_CUPON;
  guardarStorage(CLAVE_DESCUENTO, porcentajeDescuento);
  renderizarResumen();
  mostrarNotificacion("Cupón aplicado: " + PORCENTAJE_CUPON + "% de descuento", "ok");
}

function vaciarCarrito() {
  if (carrito.length === 0) {
    mostrarNotificacion("El carrito ya está vacío", "error");
    return;
  }

  carrito = [];
  porcentajeDescuento = 0;
  borrarStorage(CLAVE_CARRITO);
  borrarStorage(CLAVE_DESCUENTO);
  renderizarTodo();
  mostrarNotificacion("Carrito vaciado", "ok");
}

async function restablecerTienda() {
  const confirmacion = await Swal.fire({
    title: "Restablecer la tienda",
    text: "Se van a borrar el carrito, el stock y el último pedido guardados",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, restablecer",
    cancelButtonText: "Cancelar",
  });

  if (confirmacion.isConfirmed) {
    vaciarStorageDeLaTienda();
    location.reload();
  }
}

buscador.addEventListener("keyup", renderizarCatalogo);
filtroCategoria.addEventListener("change", renderizarCatalogo);
ordenPrecio.addEventListener("change", renderizarCatalogo);
botonRecargar.addEventListener("click", cargarProductos);
formularioCompra.addEventListener("submit", finalizarCompra);
botonCupon.addEventListener("click", aplicarCupon);
botonVaciar.addEventListener("click", vaciarCarrito);
botonReiniciar.addEventListener("click", restablecerTienda);

renderizarCarrito();
renderizarResumen();
renderizarUltimoPedido();
cargarProductos();

setTimeout(() => {
  avisoBienvenida.textContent = `Cupón de bienvenida: usá el código ${CODIGO_CUPON} en el carrito y obtené ${PORCENTAJE_CUPON}% de descuento.`;
  avisoBienvenida.className = "aviso visible";
}, 3000);