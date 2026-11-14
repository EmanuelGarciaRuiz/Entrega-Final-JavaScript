const contenedorProductos = document.getElementById("contenedor-productos");
const contenedorCarrito = document.getElementById("contenedor-carrito");
const contenedorPedido = document.getElementById("contenedor-pedido");
const contenedorResumen = document.getElementById("resumen");
const contadorCarrito = document.getElementById("contador-carrito");
const estadoCarga = document.getElementById("estado");
const buscador = document.getElementById("buscador");
const filtroCategoria = document.getElementById("filtro-categoria");
const ordenPrecio = document.getElementById("orden-precio");

const EXTENSIONES_IMAGEN = ["png", "jpg", "jpeg", "webp"];
const IMAGEN_POR_DEFECTO = "assets/img/general.svg";

function formatearPrecio(valor) {
  return "$" + Math.round(valor).toLocaleString("es-AR");
}

function mostrarNotificacion(texto, tipo) {
  Toastify({
    text: texto,
    duration: 3000,
    gravity: "top",
    position: "right",
    style: {
      background: tipo === "ok" ? "#1e8e5a" : "#c0392b",
    },
  }).showToast();
}

function renderizarCategorias() {
  const categorias = ["todas", ...new Set(catalogo.map((producto) => producto.categoria))];
  const categoriaElegida = filtroCategoria.value || "todas";

  filtroCategoria.innerHTML = categorias
    .map((categoria) => `<option value="${categoria}">${categoria === "todas" ? "Todas las categorías" : categoria}</option>`)
    .join("");
  filtroCategoria.value = categorias.includes(categoriaElegida) ? categoriaElegida : "todas";
}

function obtenerProductosFiltrados() {
  const texto = buscador.value.toLowerCase().trim();
  const categoria = filtroCategoria.value || "todas";

  const productosFiltrados = catalogo.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(texto) &&
      (categoria === "todas" || producto.categoria === categoria)
  );

  if (ordenPrecio.value === "menor") {
    productosFiltrados.sort((productoA, productoB) => productoA.precio - productoB.precio);
  } else if (ordenPrecio.value === "mayor") {
    productosFiltrados.sort((productoA, productoB) => productoB.precio - productoA.precio);
  }

  return productosFiltrados;
}

function asignarImagenesAlternativas() {
  document.querySelectorAll(".tarjeta img").forEach((imagen) => {
    let intento = 0;

    imagen.addEventListener("error", () => {
      intento++;
      const { base } = imagen.dataset;

      if (base && intento < EXTENSIONES_IMAGEN.length) {
        imagen.src = `${base}.${EXTENSIONES_IMAGEN[intento]}`;
      } else if (!imagen.src.endsWith(IMAGEN_POR_DEFECTO)) {
        imagen.src = IMAGEN_POR_DEFECTO;
      }
    });
  });
}

function renderizarCatalogo() {
  const productosFiltrados = obtenerProductosFiltrados();
  contenedorProductos.innerHTML = "";

  if (productosFiltrados.length === 0) {
    contenedorProductos.innerHTML = `<p class="vacio">No hay productos para mostrar.</p>`;
    return;
  }

  productosFiltrados.forEach((producto) => {
    const { id, nombre, precio, stock, imagen } = producto;
    const unidadesDisponibles = stock - cantidadEnCarrito(id);

    let claseStock = "hay";
    let textoStock = "En stock: " + unidadesDisponibles;

    if (unidadesDisponibles === 0) {
      claseStock = "sin-stock";
      textoStock = "Sin stock";
    } else if (unidadesDisponibles <= 5) {
      claseStock = "pocas";
      textoStock = "Últimas " + unidadesDisponibles + " unidades";
    }

    const tieneExtension = /\.[a-z]+$/i.test(imagen || "");
    let rutaInicial = IMAGEN_POR_DEFECTO;

    if (imagen) {
      rutaInicial = tieneExtension ? imagen : `${imagen}.${EXTENSIONES_IMAGEN[0]}`;
    }

    contenedorProductos.innerHTML += `
      <article class="tarjeta">
        <img src="${rutaInicial}" alt="${nombre}" data-base="${tieneExtension ? "" : imagen || ""}">
        <h3>${nombre}</h3>
        <p class="precio">${formatearPrecio(precio)}</p>
        <span class="etiqueta ${claseStock}">${textoStock}</span>
        <button id="agregar-${id}" ${unidadesDisponibles === 0 ? "disabled" : ""}>Agregar al carrito</button>
      </article>`;
  });

  asignarImagenesAlternativas();

  productosFiltrados.forEach(({ id }) => {
    document.getElementById(`agregar-${id}`).addEventListener("click", () => agregarAlCarrito(id));
  });
}

function renderizarCarrito() {
  const items = obtenerItemsDelCarrito();
  contenedorCarrito.innerHTML = "";

  if (items.length === 0) {
    contenedorCarrito.innerHTML = `<p class="vacio">Tu carrito está vacío.</p>`;
  }

  items.forEach(({ producto, cantidad }) => {
    const { id, nombre, precio } = producto;

    contenedorCarrito.innerHTML += `
      <div class="item-carrito">
        <div>
          <strong>${nombre}</strong>
          <p>${formatearPrecio(precio * cantidad)}</p>
        </div>
        <div class="cantidad">
          <button id="restar-${id}" class="btn-chico">-</button>
          <span>${cantidad}</span>
          <button id="sumar-${id}" class="btn-chico">+</button>
          <button id="quitar-${id}" class="btn-chico btn-peligro">Quitar</button>
        </div>
      </div>`;
  });

  items.forEach(({ producto }) => {
    const { id } = producto;
    document.getElementById(`restar-${id}`).addEventListener("click", () => cambiarCantidad(id, -1));
    document.getElementById(`sumar-${id}`).addEventListener("click", () => cambiarCantidad(id, 1));
    document.getElementById(`quitar-${id}`).addEventListener("click", () => quitarDelCarrito(id));
  });
}

function renderizarResumen() {
  const { subtotal, descuento, iva, total } = calcularResumen();

  contenedorResumen.innerHTML = `
    <p>Subtotal: ${formatearPrecio(subtotal)}</p>
    ${porcentajeDescuento > 0 ? `<p>Descuento (${porcentajeDescuento}%): -${formatearPrecio(descuento)}</p>` : ""}
    <p>IVA (${PORCENTAJE_IVA}%): ${formatearPrecio(iva)}</p>
    <p class="total">Total: ${formatearPrecio(total)}</p>`;

  contadorCarrito.textContent = contarUnidadesEnCarrito();
}

function renderizarUltimoPedido() {
  const pedido = leerStorage(CLAVE_ULTIMO_PEDIDO, null);

  if (!pedido) {
    contenedorPedido.innerHTML = `<p class="vacio">Todavía no hiciste ninguna compra.</p>`;
    return;
  }

  const { numero, fecha, comprador, productos, total } = pedido;
  const detalle = productos.map(({ nombre, cantidad }) => `<li>${nombre} x${cantidad}</li>`).join("");

  contenedorPedido.innerHTML = `
    <p><strong>Pedido N° ${numero}</strong> - ${fecha}</p>
    <p>${comprador.nombre} (${comprador.medioDePago})</p>
    <ul>${detalle}</ul>
    <p class="total">Total: ${formatearPrecio(total)}</p>`;
}

function renderizarTodo() {
  renderizarCatalogo();
  renderizarCarrito();
  renderizarResumen();
  renderizarUltimoPedido();
}