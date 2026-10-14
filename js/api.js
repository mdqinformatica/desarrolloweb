/**
 * API Service for Top Inmobiliario connecting to SOM API endpoints (apmovil.som.com.ar)
 */
class SomApiService {
  constructor() {
    this.baseUrl = "https://apmovil.som.com.ar";
    this.token = "invitado";
    this.codigoInmo = "00";
    this.codigoSuc = "00";
  }

  /**
   * Helper to perform fetch requests with error handling
   */
  async _fetchJson(url) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.warn(`API call failed for ${url}, falling back to local dataset`, err);
      return null;
    }
  }

  /**
   * Fetch Countries from SOM API
   */
  async getPaises() {
    const url = `${this.baseUrl}/ParametrosService.aspx?dato=PAISES`;
    const res = await this._fetchJson(url);
    if (res && Array.isArray(res) && res.length > 0) {
      return res.map(p => ({
        id: String(p.ID || p.id || ""),
        nombre: p.Nombre || p.nombre || ""
      }));
    }
    return [
      { id: "1", nombre: "Argentina" },
      { id: "64", nombre: "Uruguay" },
      { id: "65", nombre: "Paraguay" }
    ];
  }

  /**
   * Fetch Provinces by Country ID from SOM API
   */
  async getProvincias(idPais = "1") {
    const url = `${this.baseUrl}/ParametrosService.aspx?dato=PROVINCIAS&subdato=${idPais}`;
    const res = await this._fetchJson(url);
    if (res && Array.isArray(res) && res.length > 0) {
      return res.map(p => ({
        id: String(p.ID || p.id || ""),
        nombre: p.Nombre || p.nombre || ""
      }));
    }
    return [
      { id: "11", nombre: "CAPITAL FEDERAL" },
      { id: "1", nombre: "BUENOS AIRES" },
      { id: "53", nombre: "CORDOBA" },
      { id: "69", nombre: "SANTA FE" }
    ];
  }

  /**
   * Fetch Locations / Neighborhoods by Province from SOM API
   */
  async getUbicaciones(provincia = "CAPITAL FEDERAL") {
    const url = `${this.baseUrl}/ubicacionesservice.aspx?provincia=${encodeURIComponent(provincia)}`;
    const res = await this._fetchJson(url);
    if (res && Array.isArray(res) && res.length > 0) {
      const set = new Set();
      res.forEach(item => {
        if (typeof item === "string") {
          if (item.trim()) set.add(item.trim());
        } else if (item && typeof item === "object") {
          const val = item.Nombre || item.Barrio || item.Localidad || "";
          if (val && val.trim()) set.add(val.trim());
        }
      });
      if (set.size > 0) return Array.from(set);
    }
    return [
      "Palermo, CAPITAL FEDERAL",
      "Belgrano, CAPITAL FEDERAL",
      "Recoleta, CAPITAL FEDERAL",
      "Almagro, CAPITAL FEDERAL",
      "Caballito, CAPITAL FEDERAL",
      "Puerto Madero, CAPITAL FEDERAL",
      "San Isidro, BUENOS AIRES",
      "Vicente López, BUENOS AIRES"
    ];
  }

  /**
   * Fetch Product Types from SOM API
   */
  async getProductos() {
    const url = `${this.baseUrl}/ParametrosService.aspx?dato=PRODUCTOS`;
    const res = await this._fetchJson(url);
    if (res && Array.isArray(res) && res.length > 0) {
      return res.map(p => ({
        id: String(p.ID || p.id || ""),
        nombre: p.Nombre || p.nombre || ""
      }));
    }
    return [
      { id: "1", nombre: "Departamentos" },
      { id: "2", nombre: "Casas" },
      { id: "32", nombre: "Oficinas" },
      { id: "33", nombre: "Locales" },
      { id: "34", nombre: "Terrenos" }
    ];
  }

  /**
   * Fetch Subproducts by Product ID from SOM API
   */
  async getSubproductos(idProducto = "") {
    if (!idProducto) return [];
    const url = `${this.baseUrl}/ParametrosService.aspx?dato=SUBTIPOS&subdato=${idProducto}`;
    const res = await this._fetchJson(url);
    if (res && Array.isArray(res) && res.length > 0) {
      return res.map(s => ({
        id: String(s.ID || s.id || ""),
        nombre: s.Nombre || s.nombre || ""
      }));
    }
    return [
      { id: "101", nombre: "Standard" },
      { id: "102", nombre: "Semipiso" },
      { id: "103", nombre: "Piso completo" },
      { id: "104", nombre: "Dúplex" }
    ];
  }

  /**
   * Search real estate offers
   */
  async buscarOfertas(params = {}) {
    const {
      paisNombre = "",
      provinciaNombre = "",
      productoNombre = "",
      subproductoNombre = "",
      operacionNombre = "",
      ubicacion = "",
      codigo = "",
      orden = "",
      moneda = "",
      precioDesde = "",
      precioHasta = ""
    } = params;

    if (codigo) {
      const urlCod = `${this.baseUrl}/BusquedaServiceV3.aspx?token=${this.token}&codigoInmobiliaria=${this.codigoInmo}&codigoSucursal=${this.codigoSuc}&Codigo=${encodeURIComponent(codigo)}`;
      const res = await this._fetchJson(urlCod);
      if (res && (res.ofertas || res.inmuebles)) {
        const resultList = res.ofertas || res.inmuebles;
        if (Array.isArray(resultList) && resultList.length > 0) return resultList;
      }
    }

    const queryUrl = `${this.baseUrl}/BusquedaServiceV2.aspx?token=${this.token}&codigoInmobiliaria=${this.codigoInmo}&codigoSucursal=${this.codigoSuc}&productoTipo=${encodeURIComponent(productoNombre)}&productoSubTipo=${encodeURIComponent(subproductoNombre)}&operacionTipo=${encodeURIComponent(operacionNombre)}&pais=${encodeURIComponent(paisNombre)}&provincia=${encodeURIComponent(provinciaNombre)}&localidad=${encodeURIComponent(ubicacion)}&precioDesde=${precioDesde}&precioHasta=${precioHasta}&cantidad=20&pagina=1`;

    const res = await this._fetchJson(queryUrl);
    let offers = (res && Array.isArray(res.inmuebles) && res.inmuebles.length > 0)
      ? res.inmuebles
      : (res && Array.isArray(res.ofertas) && res.ofertas.length > 0)
        ? res.ofertas
        : this._getMockOffers();

    // Client-side filtering fallback
    if (provinciaNombre) {
      offers = offers.filter(o => !o.provincia || o.provincia.toLowerCase().includes(provinciaNombre.toLowerCase()));
    }
    if (ubicacion) {
      offers = offers.filter(o => (o.ubicacion || o.barrio || o.direccion || o.titulo || "").toLowerCase().includes(ubicacion.toLowerCase()));
    }
    if (productoNombre) {
      offers = offers.filter(o => !o.tipoProducto || o.tipoProducto.toLowerCase().includes(productoNombre.toLowerCase()));
    }
    if (operacionNombre) {
      offers = offers.filter(o => !o.operacion || o.operacion.toLowerCase().includes(operacionNombre.toLowerCase()));
    }
    if (moneda) {
      offers = offers.filter(o => !o.idMoneda || o.idMoneda == moneda || o.moneda == moneda);
    }
    if (precioDesde) {
      offers = offers.filter(o => (o.precio || o.valor) >= parseFloat(precioDesde));
    }
    if (precioHasta) {
      offers = offers.filter(o => (o.precio || o.valor) <= parseFloat(precioHasta));
    }

    if (orden === "0") {
      offers.sort((a, b) => (a.precio || 0) - (b.precio || 0));
    } else if (orden === "3") {
      offers.sort((a, b) => (b.precio || 0) - (a.precio || 0));
    } else if (orden === "1") {
      offers.sort((a, b) => (a.direccion || "").localeCompare(b.direccion || ""));
    }

    return offers;
  }

  /**
   * Fetch single property details
   */
  async getFichaInmueble(idOferta) {
    const url = `${this.baseUrl}/OfertasServiceV3.aspx?id=${idOferta}&token=${this.token}`;
    const res = await this._fetchJson(url);
    if (res && res.id) return res;

    // Return detailed mock offer by ID
    const mockList = this._getMockOffers();
    const found = mockList.find(o => o.id == idOferta) || mockList[0];
    return {
      ...found,
      descripcion: found.descripcion || "Exclusiva propiedad con finos detalles de terminación, ambientes amplios y luminosos, balcón corrido y excelente ubicación estratégica cercana a centros comerciales y transporte público.",
      caracteristicas: [
        "Ascensor de última generación",
        "Seguridad 24 hs",
        "Piscina y Solarium",
        "SUM y Parrilla",
        "Cochera cubierta",
        "Calefacción por losa radiante"
      ],
      fotos: [
        { url: "busqueda1.jpg" },
        { url: "busqueda2.jpg" },
        { url: "busqueda3.jpg" },
        { url: "busqueda4.jpg" }
      ],
      planos: [],
      inmobiliaria: {
        nombre: "Baigún Bienes Raíces",
        telefono: "+54 11 4770-5000",
        whatsapp: "5491147705000",
        email: "contacto@baigun.com.ar",
        logo: "baigun.png"
      }
    };
  }

  /**
   * Dataset fallback for robust UI demonstration
   */
  _getMockOffers() {
    return [
      {
        id: "3517961",
        codigo: "LSP-3517961",
        titulo: "Departamento 2 ambientes en venta, Palermo",
        tipoProducto: "Departamentos",
        idProducto: "1",
        idOperacion: "1",
        operacion: "Venta",
        moneda: "U$S",
        idMoneda: "2",
        precio: 145000,
        provincia: "CAPITAL FEDERAL",
        ubicacion: "Palermo",
        barrio: "Palermo Soho",
        direccion: "Av. Santa Fe 3400, Palermo, CABA",
        ambientes: 2,
        dormitorios: 1,
        banos: 1,
        superficie: "52 m²",
        UrlFoto: "busqueda1.jpg"
      },
      {
        id: "3517962",
        codigo: "LSP-3517962",
        titulo: "Departamento monoambiente en venta, Palermo",
        tipoProducto: "Departamentos",
        idProducto: "1",
        idOperacion: "1",
        operacion: "Venta",
        moneda: "U$S",
        idMoneda: "2",
        precio: 92000,
        provincia: "CAPITAL FEDERAL",
        ubicacion: "Palermo",
        barrio: "Palermo Hollywood",
        direccion: "Honduras 5100, Palermo, CABA",
        ambientes: 1,
        dormitorios: 1,
        banos: 1,
        superficie: "38 m²",
        UrlFoto: "busqueda2.jpg"
      },
      {
        id: "3517963",
        codigo: "LSP-3517963",
        titulo: "Departamento 2 ambientes en venta, Belgrano",
        tipoProducto: "Departamentos",
        idProducto: "1",
        idOperacion: "1",
        operacion: "Venta",
        moneda: "U$S",
        idMoneda: "2",
        precio: 165000,
        provincia: "CAPITAL FEDERAL",
        ubicacion: "Belgrano",
        barrio: "Belgrano R",
        direccion: "Av. Cabildo 2200, Belgrano, CABA",
        ambientes: 2,
        dormitorios: 1,
        banos: 1,
        superficie: "58 m²",
        UrlFoto: "busqueda3.jpg"
      },
      {
        id: "3517964",
        codigo: "LSP-3517964",
        titulo: "Departamento 2 ambientes en venta, Almagro",
        tipoProducto: "Departamentos",
        idProducto: "1",
        idOperacion: "1",
        operacion: "Venta",
        moneda: "U$S",
        idMoneda: "2",
        precio: 110000,
        provincia: "CAPITAL FEDERAL",
        ubicacion: "Almagro",
        barrio: "Almagro",
        direccion: "Av. Corrientes 4500, Almagro, CABA",
        ambientes: 2,
        dormitorios: 1,
        banos: 1,
        superficie: "48 m²",
        UrlFoto: "busqueda4.jpg"
      },
      {
        id: "3517965",
        codigo: "LSP-3517965",
        titulo: "Departamento 2 ambientes en alquiler, Palermo",
        tipoProducto: "Departamentos",
        idProducto: "1",
        idOperacion: "2",
        operacion: "Alquiler",
        moneda: "$",
        idMoneda: "1",
        precio: 480000,
        provincia: "CAPITAL FEDERAL",
        ubicacion: "Palermo",
        barrio: "Palermo Chico",
        direccion: "Avenida del Libertador 3200, Palermo, CABA",
        ambientes: 2,
        dormitorios: 1,
        banos: 1,
        superficie: "55 m²",
        UrlFoto: "busqueda5.jpg"
      },
      {
        id: "3517966",
        codigo: "LSP-3517966",
        titulo: "Oficina en alquiler, Microcentro",
        tipoProducto: "Oficinas",
        idProducto: "32",
        idOperacion: "2",
        operacion: "Alquiler",
        moneda: "U$S",
        idMoneda: "2",
        precio: 1200,
        provincia: "CAPITAL FEDERAL",
        ubicacion: "Microcentro",
        barrio: "San Nicolás",
        direccion: "Florida 400, Microcentro, CABA",
        ambientes: 4,
        dormitorios: 0,
        banos: 2,
        superficie: "120 m²",
        UrlFoto: "busqueda6.jpg"
      },
      {
        id: "3517967",
        codigo: "LSP-3517967",
        titulo: "Departamento 2 ambientes en alquiler, Recoleta",
        tipoProducto: "Departamentos",
        idProducto: "1",
        idOperacion: "2",
        operacion: "Alquiler",
        moneda: "$",
        idMoneda: "1",
        precio: 520000,
        provincia: "CAPITAL FEDERAL",
        ubicacion: "Recoleta",
        barrio: "Recoleta",
        direccion: "Av. Alvear 1700, Recoleta, CABA",
        ambientes: 2,
        dormitorios: 1,
        banos: 1,
        superficie: "50 m²",
        UrlFoto: "busqueda7.jpeg"
      },
      {
        id: "3517968",
        codigo: "LSP-3517968",
        titulo: "Casas en venta en Belgrano R, CABA",
        tipoProducto: "Casas",
        idProducto: "2",
        idOperacion: "1",
        operacion: "Venta",
        moneda: "U$S",
        idMoneda: "2",
        precio: 490000,
        provincia: "CAPITAL FEDERAL",
        ubicacion: "Belgrano",
        barrio: "Belgrano R",
        direccion: "Melián 1900, Belgrano R, CABA",
        ambientes: 5,
        dormitorios: 4,
        banos: 3,
        superficie: "320 m²",
        UrlFoto: "busqueda8.jpg"
      }
    ];
  }
}

window.apiService = new SomApiService();
