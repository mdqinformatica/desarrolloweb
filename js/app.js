/**
 * Application Controller for Top Inmobiliario
 */

let currentSearchResults = [];
let selectedPropertyForContact = null;

document.addEventListener("DOMContentLoaded", async () => {
  setupMobileMenu();
  setupAutocomplete();
  await cargaPrincipal();
  startFeaturedCarousel();
});

/**
 * Mobile navigation toggle
 */
function setupMobileMenu() {
  const btn = document.getElementById("mobileMenuBtn");
  const menu = document.getElementById("mobileMenu");
  if (btn && menu) {
    btn.addEventListener("click", () => {
      menu.classList.toggle("hidden");
    });
  }
}

/**
 * Main initialization (Paises, Productos)
 */
async function cargaPrincipal() {
  await inicializarPaises();
  await inicializarProductos();
}

/**
 * Load Countries dropdown
 */
async function inicializarPaises() {
  const selectPais = document.getElementById("pais");
  if (!selectPais) return;

  const paises = await window.apiService.getPaises();
  selectPais.innerHTML = '<option value="">Seleccione País</option>';
  paises.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.dataset.nombre = p.nombre;
    opt.textContent = p.nombre;
    selectPais.appendChild(opt);
  });

  // Default to Argentina (ID 1)
  selectPais.value = "1";
  await inicializarProvincias("1");
}

/**
 * Load Provinces dropdown
 */
async function inicializarProvincias(idPais) {
  const selectProv = document.getElementById("provincia");
  if (!selectProv) return;

  if (!idPais) {
    selectProv.innerHTML = '<option value="">Seleccione Provincia</option>';
    return;
  }

  const provincias = await window.apiService.getProvincias(idPais);
  selectProv.innerHTML = '<option value="">Seleccione Provincia</option>';
  provincias.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.nombre;
    opt.dataset.id = p.id;
    opt.textContent = p.nombre;
    selectProv.appendChild(opt);
  });

  // Default to CAPITAL FEDERAL
  selectProv.value = "CAPITAL FEDERAL";
  await inicializarUbicaciones("CAPITAL FEDERAL");
}

/**
 * Load Locations autocomplete suggestions
 */
async function inicializarUbicaciones(nomProv) {
  if (!nomProv) return;
  window.currentUbicacionesList = await window.apiService.getUbicaciones(nomProv);
}

/**
 * Autocomplete for Location input
 */
function setupAutocomplete() {
  const input = document.getElementById("ubicacion");
  const box = document.getElementById("ubicacionSuggestions");
  if (!input || !box) return;

  input.addEventListener("input", (e) => {
    const val = e.target.value.trim().toLowerCase();
    box.innerHTML = "";
    if (!val || !window.currentUbicacionesList) {
      box.classList.add("hidden");
      return;
    }

    const matches = window.currentUbicacionesList.filter(u => u.toLowerCase().includes(val));
    if (matches.length === 0) {
      box.classList.add("hidden");
      return;
    }

    matches.slice(0, 8).forEach(match => {
      const item = document.createElement("div");
      item.className = "px-4 py-2 hover:bg-brand-50 cursor-pointer border-b border-gray-100 text-gray-700 font-medium";
      item.textContent = match;
      item.onclick = () => {
        input.value = match;
        box.classList.add("hidden");
      };
      box.appendChild(item);
    });

    box.classList.remove("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !box.contains(e.target)) {
      box.classList.add("hidden");
    }
  });
}

/**
 * Load Products dropdown
 */
async function inicializarProductos() {
  const selectProd = document.getElementById("producto");
  if (!selectProd) return;

  const productos = await window.apiService.getProductos();
  selectProd.innerHTML = '<option value="">Todos los productos</option>';
  productos.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.dataset.nombre = p.nombre;
    opt.textContent = p.nombre;
    selectProd.appendChild(opt);
  });
}

/**
 * Load Subproducts dropdown
 */
async function inicializarSubproductos(idProducto) {
  const selectSub = document.getElementById("subproducto");
  if (!selectSub) return;

  if (!idProducto) {
    selectSub.innerHTML = '<option value="">Todos los subtipos</option>';
    return;
  }

  const subtipos = await window.apiService.getSubproductos(idProducto);
  selectSub.innerHTML = '<option value="">Todos los subtipos</option>';
  subtipos.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.dataset.nombre = s.nombre;
    opt.textContent = s.nombre;
    selectSub.appendChild(opt);
  });
}

/**
 * Execute Search and display results
 */
async function cargarResultado(scroll = true) {
  const seccionBuscar = document.getElementById("seccionbuscar");
  const seccionResultado = document.getElementById("seccionresultado");
  const seccionFicha = document.getElementById("seccionficha");
  const loader = document.getElementById("cargando");
  const container = document.getElementById("contenedorResultado");

  seccionBuscar.classList.add("hidden");
  seccionFicha.classList.add("hidden");
  seccionResultado.classList.remove("hidden");
  loader.classList.remove("hidden");
  container.innerHTML = "";

  if (scroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const elPais = document.getElementById("pais");
  const elProv = document.getElementById("provincia");
  const elProd = document.getElementById("producto");
  const elSub = document.getElementById("subproducto");
  const elOp = document.getElementById("operacion");

  const params = {
    paisNombre: elPais && elPais.selectedIndex >= 0 ? elPais.options[elPais.selectedIndex].text : "",
    provinciaNombre: elProv ? elProv.value : "",
    productoNombre: elProd && elProd.selectedIndex > 0 ? elProd.options[elProd.selectedIndex].text : "",
    subproductoNombre: elSub && elSub.selectedIndex > 0 ? elSub.options[elSub.selectedIndex].text : "",
    operacionNombre: elOp && elOp.selectedIndex > 0 ? elOp.options[elOp.selectedIndex].text : "",
    ubicacion: document.getElementById("ubicacion")?.value || "",
    codigo: document.getElementById("codigo")?.value || "",
    orden: document.getElementById("ordenarresultado")?.value || "",
    moneda: document.getElementById("monedaresultado")?.value || "",
    precioDesde: document.getElementById("preciodesde")?.value || "",
    precioHasta: document.getElementById("preciohasta")?.value || ""
  };

  currentSearchResults = await window.apiService.buscarOfertas(params);
  loader.classList.add("hidden");

  renderResultados(currentSearchResults);
}

/**
 * Sort and filter result set locally
 */
function ordenarResultado() {
  cargarResultado(false);
}

/**
 * Render property offer cards
 */
function renderResultados(ofertas) {
  const container = document.getElementById("contenedorResultado");
  const countBadge = document.getElementById("cantidadOfertas");

  if (!container) return;
  countBadge.textContent = `${ofertas.length} ofertas encontradas`;

  if (ofertas.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-200">
        <i class="fa-solid fa-folder-open text-4xl text-gray-300 mb-3"></i>
        <h4 class="text-lg font-bold text-gray-700">No se encontraron propiedades</h4>
        <p class="text-sm text-gray-500 mt-1">Intente modificar los filtros o el código de búsqueda.</p>
        <button onclick="volverAlInicio()" class="mt-4 px-4 py-2 bg-brand-800 text-white rounded-lg text-sm font-semibold hover:bg-brand-900 transition">Volver a buscar</button>
      </div>
    `;
    return;
  }

  container.innerHTML = ofertas.map(o => {
    const imgSrc = o.UrlFoto ? (o.UrlFoto.startsWith('http') ? o.UrlFoto : `images/${o.UrlFoto}`) : 'images/busqueda1.jpg';
    const precio = o.precio ? `${o.moneda || 'U$S'} ${Number(o.precio).toLocaleString('es-AR')}` : 'Consultar';

    return `
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition duration-300 overflow-hidden flex flex-col animate-fade-in group">
        <div class="relative h-48 overflow-hidden bg-gray-100">
          <img src="${imgSrc}" alt="${o.titulo || 'Propiedad'}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" onerror="this.src='images/busqueda1.jpg'">
          <span class="absolute top-3 left-3 bg-brand-800 text-white text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
            ${o.operacion || 'Oferta'}
          </span>
          <span class="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-md font-extrabold px-3 py-1 rounded-lg">
            ${precio}
          </span>
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <span class="text-xs font-bold text-brand-600 uppercase tracking-wider">${o.tipoProducto || 'Propiedad'}</span>
            <h3 class="font-bold text-gray-900 text-base leading-snug line-clamp-2 mt-1 hover:text-brand-600 cursor-pointer" onclick="cargarFicha('${o.id}')">
              ${o.titulo || o.direccion || 'Propiedad Inmobiliaria'}
            </h3>
            <p class="text-xs text-gray-500 flex items-center gap-1 mt-2">
              <i class="fa-solid fa-location-dot text-brand-500"></i>
              <span>${o.direccion || o.ubicacion || 'Ubicación disponible'}</span>
            </p>
          </div>

          <div class="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-xs text-gray-600 text-center font-medium">
            <div class="bg-gray-50 p-1.5 rounded-lg">
              <span class="block text-gray-400 text-[10px] uppercase">Ambientes</span>
              <span class="font-bold text-gray-800">${o.ambientes || '-'}</span>
            </div>
            <div class="bg-gray-50 p-1.5 rounded-lg">
              <span class="block text-gray-400 text-[10px] uppercase">Baños</span>
              <span class="font-bold text-gray-800">${o.banos || '-'}</span>
            </div>
            <div class="bg-gray-50 p-1.5 rounded-lg">
              <span class="block text-gray-400 text-[10px] uppercase">Superficie</span>
              <span class="font-bold text-gray-800">${o.superficie || '-'}</span>
            </div>
          </div>

          <div class="flex gap-2 pt-2">
            <button onclick="cargarFicha('${o.id}')" class="flex-1 bg-brand-800 hover:bg-brand-900 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition">
              <i class="fa-solid fa-eye"></i>
              <span>Ver Ficha</span>
            </button>
            <button onclick="abrirContactoModal('${o.id}')" class="bg-brand-50 hover:bg-brand-100 text-brand-800 font-semibold py-2 px-3 rounded-xl text-xs transition">
              <i class="fa-solid fa-envelope"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * Handle Popular Search Card Clicks
 */
async function busquedaPopular(index) {
  const popularMap = {
    1: { provincia: "CAPITAL FEDERAL", ubicacion: "Palermo", operacion: "1", producto: "1" },
    2: { provincia: "CAPITAL FEDERAL", ubicacion: "Palermo", operacion: "1", producto: "1" },
    3: { provincia: "CAPITAL FEDERAL", ubicacion: "Belgrano", operacion: "1", producto: "1" },
    4: { provincia: "CAPITAL FEDERAL", ubicacion: "Almagro", operacion: "1", producto: "1" },
    5: { provincia: "CAPITAL FEDERAL", ubicacion: "Palermo", operacion: "2", producto: "1" },
    6: { provincia: "CAPITAL FEDERAL", ubicacion: "Microcentro", operacion: "2", producto: "32" },
    7: { provincia: "CAPITAL FEDERAL", ubicacion: "Recoleta", operacion: "2", producto: "1" },
    8: { provincia: "CAPITAL FEDERAL", ubicacion: "Belgrano", operacion: "1", producto: "2" },
    9: { provincia: "CAPITAL FEDERAL", ubicacion: "Recoleta", operacion: "1", producto: "1" },
    10: { provincia: "BUENOS AIRES", ubicacion: "San Isidro", operacion: "2", producto: "2" },
    11: { provincia: "CAPITAL FEDERAL", ubicacion: "Belgrano", operacion: "1", producto: "1" },
    12: { provincia: "CAPITAL FEDERAL", ubicacion: "Las Cañitas", operacion: "1", producto: "1" }
  };

  const sel = popularMap[index] || popularMap[1];
  if (document.getElementById("provincia")) document.getElementById("provincia").value = sel.provincia;
  if (document.getElementById("ubicacion")) document.getElementById("ubicacion").value = sel.ubicacion;
  if (document.getElementById("operacion")) document.getElementById("operacion").value = sel.operacion;
  if (document.getElementById("producto")) document.getElementById("producto").value = sel.producto;

  await cargarResultado();
}

/**
 * Load Property Detail Ficha Modal
 */
async function cargarFicha(idOferta) {
  const seccionFicha = document.getElementById("seccionficha");
  const galeria = document.getElementById("galeriaFotos");
  const datosPrincipales = document.getElementById("datosPrincipales");
  const destacable = document.getElementById("destacable");
  const caracteristicas = document.getElementById("caracteristicas");
  const mapa = document.getElementById("mapa");
  const contacto = document.getElementById("contacto");

  seccionFicha.classList.remove("hidden");
  selectedPropertyForContact = idOferta;

  const ficha = await window.apiService.getFichaInmueble(idOferta);

  // Gallery Render
  const fotos = ficha.fotos || [{ url: ficha.UrlFoto || 'busqueda1.jpg' }];
  galeria.innerHTML = `
    <div class="relative h-64 rounded-lg overflow-hidden mb-2 bg-black">
      <img id="mainGalleryImg" src="images/${fotos[0].url || 'busqueda1.jpg'}" class="w-full h-full object-cover" onerror="this.src='images/busqueda1.jpg'">
    </div>
    <div class="flex gap-2 overflow-x-auto pb-1">
      ${fotos.map((f, i) => `
        <img src="images/${f.url || 'busqueda1.jpg'}" onclick="document.getElementById('mainGalleryImg').src='images/${f.url}'" class="h-16 w-20 object-cover rounded cursor-pointer border-2 border-transparent hover:border-brand-500 transition" onerror="this.src='images/busqueda1.jpg'">
      `).join('')}
    </div>
  `;

  // Main Data Render
  datosPrincipales.innerHTML = `
    <span class="inline-block bg-brand-100 text-brand-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase mb-2">
      ${ficha.operacion || 'Venta'} - ${ficha.tipoProducto || 'Departamento'}
    </span>
    <h2 class="text-xl font-bold text-gray-900">${ficha.titulo || ficha.direccion}</h2>
    <p class="text-sm text-gray-500 flex items-center gap-1 mt-1">
      <i class="fa-solid fa-location-dot text-brand-600"></i> ${ficha.direccion || 'Ubicación consultable'}
    </p>
    <div class="text-2xl font-extrabold text-brand-800 my-3">
      ${ficha.moneda || 'U$S'} ${Number(ficha.precio || 0).toLocaleString('es-AR')}
    </div>
    <div class="grid grid-cols-3 gap-3 text-center text-xs bg-white p-3 rounded-lg border border-gray-200">
      <div><span class="text-gray-400 block">Ambientes</span><span class="font-bold text-gray-800">${ficha.ambientes || 2}</span></div>
      <div><span class="text-gray-400 block">Baños</span><span class="font-bold text-gray-800">${ficha.banos || 1}</span></div>
      <div><span class="text-gray-400 block">Superficie</span><span class="font-bold text-gray-800">${ficha.superficie || '50 m²'}</span></div>
    </div>
  `;

  destacable.textContent = ficha.descripcion || "Hermosa propiedad con finos detalles y excelente ubicación.";

  // Characteristics badges
  const listChar = ficha.caracteristicas || ["Balcón", "Luminoso", "Ascensor", "Cochera"];
  caracteristicas.innerHTML = listChar.map(c => `
    <span class="bg-brand-50 text-brand-800 border border-brand-200 px-3 py-1 rounded-full font-medium">
      <i class="fa-solid fa-check text-brand-600 mr-1"></i>${c}
    </span>
  `).join('');

  mapa.innerHTML = `
    <div class="bg-gray-100 rounded-lg p-4 text-center border border-gray-200">
      <i class="fa-solid fa-map-marked-alt text-3xl text-brand-600 mb-2"></i>
      <p class="font-semibold text-gray-800">${ficha.direccion || 'Palermo, CABA'}</p>
      <p class="text-xs text-gray-500">Provincia: ${ficha.provincia || 'CAPITAL FEDERAL'}</p>
    </div>
  `;

  // Contact Info
  const inmo = ficha.inmobiliaria || { nombre: "SOM Red Inmobiliaria", telefono: "+54 11 4000-0000", email: "info@som.com.ar" };
  contacto.innerHTML = `
    <div class="p-4 bg-brand-50 rounded-lg border border-brand-100 space-y-2">
      <p class="font-bold text-brand-900">${inmo.nombre}</p>
      <p class="text-xs text-gray-600 flex items-center gap-2"><i class="fa-solid fa-phone text-brand-600"></i> ${inmo.telefono}</p>
      <p class="text-xs text-gray-600 flex items-center gap-2"><i class="fa-solid fa-envelope text-brand-600"></i> ${inmo.email}</p>
      <button onclick="abrirContactoModal('${idOferta}')" class="w-full mt-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold py-2 rounded-lg text-xs transition">
        Enviar Mensaje
      </button>
    </div>
  `;
}

/**
 * Return from details to results list
 */
function volverAlListado() {
  document.getElementById("seccionficha").classList.add("hidden");
}

/**
 * Return to home/search view
 */
function volverAlInicio() {
  document.getElementById("seccionficha").classList.add("hidden");
  document.getElementById("seccionresultado").classList.add("hidden");
  document.getElementById("seccionbuscar").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Open Contact Modal
 */
function abrirContactoModal(idOferta = null) {
  selectedPropertyForContact = idOferta;
  const modal = document.getElementById("ventanacontacto");
  const detailBox = document.getElementById("contactodetalle");
  if (modal) modal.classList.remove("hidden");
  if (detailBox) {
    detailBox.textContent = idOferta ? `Consulta referida a la propiedad Código: ${idOferta}` : "Consulta general de servicios";
  }
}

/**
 * Close Contact Modal
 */
function cerrarContactoModal() {
  const modal = document.getElementById("ventanacontacto");
  if (modal) modal.classList.add("hidden");
}

/**
 * Submit Contact Form
 */
function enviarConsulta() {
  const nombre = document.getElementById("nombre")?.value;
  alert(`¡Gracias ${nombre}! Tu consulta ha sido enviada con éxito. Un agente inmobiliario se contactará a la brevedad.`);
  cerrarContactoModal();
}

/**
 * Auto rotation for featured card demo
 */
function startFeaturedCarousel() {
  const slides = [
    { bg: "images/busqueda1.jpg", title: "Ático de Lujo en Palermo", price: "USD 145.000", loc: "Palermo, CABA" },
    { bg: "images/busqueda3.jpg", title: "Exclusivo 2 Ambientes Belgrano", price: "USD 165.000", loc: "Belgrano R, CABA" },
    { bg: "images/busqueda8.jpg", title: "Residencia Categoría Belgrano R", price: "USD 490.000", loc: "Belgrano, CABA" }
  ];
  let idx = 0;
  setInterval(() => {
    idx = (idx + 1) % slides.length;
    const item = slides[idx];
    if (document.getElementById("featuredSlideBg")) {
      document.getElementById("featuredSlideBg").style.backgroundImage = `url('${item.bg}')`;
    }
    if (document.getElementById("featuredTitle")) document.getElementById("featuredTitle").textContent = item.title;
    if (document.getElementById("featuredPrice")) document.getElementById("featuredPrice").textContent = item.price;
    if (document.getElementById("featuredLoc")) document.getElementById("featuredLoc").textContent = item.loc;
  }, 4000);
}
