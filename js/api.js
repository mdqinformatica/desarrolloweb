/**
 * API Service Layer for InmoFinder
 * Simulates real REST API communication for fetching property listings.
 * Structured so that replacing the URL with a real backend endpoint (e.g. `https://api.ejemplo.com/propiedades`) works seamlessly.
 */

const API_CONFIG = {
    // URL base de la API backend (se puede reemplazar por tu servidor real)
    baseUrl: 'https://api.inmofinder.fake/v1/properties',
    useMockData: true, // Si es true, usa datos de simulación local en respuesta de red simulada
    delayMs: 300 // Simula tiempo de respuesta de red
};

// Datos iniciales de prueba (Mock Dataset)
const MOCK_PROPERTIES = [
    {
        id: "prop-101",
        title: "Ático de lujo con terraza y vistas al mar",
        description: "Exclusivo ático reformado con acabados de alta gama, amplia terraza soleada de 40m² y panorámicas vistas. Incluye plaza de garaje y trastero.",
        type: "Atico",
        transactionType: "venta",
        price: 485000,
        currency: "EUR",
        location: "Barcelona, Cataluña",
        address: "Passeig Marítim 42",
        bedrooms: 3,
        bathrooms: 2,
        areaM2: 125,
        featured: true,
        images: [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
        ],
        features: ["Ascensor", "Terraza", "Piscina comunitaria", "Garaje", "Aire Acondicionado"],
        agent: {
            name: "Laura Martínez",
            phone: "+34 612 345 678",
            email: "l.martinez@inmofinder.es"
        }
    },
    {
        id: "prop-102",
        title: "Moderno apartamento céntrico de diseño",
        description: "Ubicado en el corazón histórico de la ciudad. Totalmente amueblado y equipado con tecnología domótica. Excelente conexión con transporte público.",
        type: "Apartamento",
        transactionType: "alquiler",
        price: 1350,
        currency: "EUR/mes",
        location: "Madrid, Centro",
        address: "Calle Mayor 15",
        bedrooms: 2,
        bathrooms: 1,
        areaM2: 75,
        featured: true,
        images: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"
        ],
        features: ["Amueblado", "Calefacción central", "Balcón", "WiFi Alta velocidad"],
        agent: {
            name: "Carlos Ruiz",
            phone: "+34 622 987 654",
            email: "c.ruiz@inmofinder.es"
        }
    },
    {
        id: "prop-103",
        title: "Chalet independiente con gran jardín y piscina",
        description: "Magnífica propiedad ideal para familias. Amplio jardín privado, zona de barbacoa, garaje para 2 vehículos y acabados sostenibles.",
        type: "Casa",
        transactionType: "venta",
        price: 690000,
        currency: "EUR",
        location: "Valencia, El Saler",
        address: "Avenida de los Pinos 8",
        bedrooms: 4,
        bathrooms: 3,
        areaM2: 280,
        featured: true,
        images: [
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
        ],
        features: ["Jardín privado", "Piscina privada", "Garaje doble", "Trastero", "Paneles Solares"],
        agent: {
            name: "Elena Gómez",
            phone: "+34 633 456 789",
            email: "e.gomez@inmofinder.es"
        }
    },
    {
        id: "prop-104",
        title: "Local comercial listo para negocio en zona comercial",
        description: "Local a pie de calle con amplio escaparate acristalado. Ubicación estratégica con gran afluencia peatonal.",
        type: "Local",
        transactionType: "alquiler",
        price: 2100,
        currency: "EUR/mes",
        location: "Sevilla, Nervión",
        address: "Calle Luis de Morales 22",
        bedrooms: 0,
        bathrooms: 2,
        areaM2: 110,
        featured: false,
        images: [
            "https://images.unsplash.com/photo-1582037928769-181f2644ecb7?auto=format&fit=crop&w=800&q=80"
        ],
        features: ["Salida de humos", "A pie de calle", "Climatización"],
        agent: {
            name: "Carlos Ruiz",
            phone: "+34 622 987 654",
            email: "c.ruiz@inmofinder.es"
        }
    },
    {
        id: "prop-105",
        title: "Oficina luminosa y diáfana en parque tecnológico",
        description: "Espacio corporativo moderno con divisiones modulares en cristal, salas de reunión y office para empleados.",
        type: "Oficina",
        transactionType: "alquiler",
        price: 1800,
        currency: "EUR/mes",
        location: "Málaga, PTA",
        address: "Calle Severo Ochoa 4",
        bedrooms: 0,
        bathrooms: 2,
        areaM2: 150,
        featured: false,
        images: [
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
        ],
        features: ["Seguridad 24h", "Fibra Óptica", "Aparcamiento incluido"],
        agent: {
            name: "Laura Martínez",
            phone: "+34 612 345 678",
            email: "l.martinez@inmofinder.es"
        }
    },
    {
        id: "prop-106",
        title: "Piso acogedor reformado cerca del parque",
        description: "Excelente oportunidad para vivir en zona residencial tranquila. Reformado completamente con cocina integrada.",
        type: "Apartamento",
        transactionType: "venta",
        price: 215000,
        currency: "EUR",
        location: "Bilbao, Indautxu",
        address: "Calle Gran Vía 78",
        bedrooms: 2,
        bathrooms: 1,
        areaM2: 82,
        featured: false,
        images: [
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80"
        ],
        features: ["Ascensor", "Calefacción gas", "Trastero"],
        agent: {
            name: "Elena Gómez",
            phone: "+34 633 456 789",
            email: "e.gomez@inmofinder.es"
        }
    }
];

class RealEstateAPI {
    /**
     * Devuelve todas las propiedades o aplica filtros pasados por parámetro.
     * @param {Object} filters - Filtros como query, type, transactionType, minPrice, maxPrice, bedrooms, sortBy
     * @returns {Promise<Array>}
     */
    static async fetchProperties(filters = {}) {
        if (!API_CONFIG.useMockData) {
            // Ejemplo de llamada a una API real mediante fetch
            const queryParams = new URLSearchParams(filters).toString();
            const response = await fetch(`${API_CONFIG.baseUrl}?${queryParams}`);
            if (!response.ok) throw new Error('Error al conectar con la API de Inmuebles');
            return await response.json();
        }

        // Simulación de latencia de red de la API
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.delayMs));

        let results = [...MOCK_PROPERTIES];

        // 1. Filtrar por término de búsqueda (Título, Ubicación o Dirección)
        if (filters.query && filters.query.trim() !== '') {
            const q = filters.query.toLowerCase().trim();
            results = results.filter(item =>
                item.title.toLowerCase().includes(q) ||
                item.location.toLowerCase().includes(q) ||
                item.address.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q)
            );
        }

        // 2. Filtrar por tipo de transacción (venta / alquiler)
        if (filters.transactionType && filters.transactionType !== 'all') {
            results = results.filter(item => item.transactionType === filters.transactionType);
        }

        // 3. Filtrar por tipo de inmueble (Casa, Apartamento, Ático, etc)
        if (filters.type && filters.type !== 'all') {
            results = results.filter(item => item.type.toLowerCase() === filters.type.toLowerCase());
        }

        // 4. Filtrar por número mínimo de habitaciones
        if (filters.bedrooms && filters.bedrooms !== 'all') {
            const minBeds = parseInt(filters.bedrooms, 10);
            results = results.filter(item => item.bedrooms >= minBeds);
        }

        // 5. Filtrar por precio máximo
        if (filters.maxPrice && filters.maxPrice !== 'all') {
            const maxP = parseFloat(filters.maxPrice);
            results = results.filter(item => item.price <= maxP);
        }

        // 6. Ordenación
        if (filters.sortBy) {
            if (filters.sortBy === 'price-asc') {
                results.sort((a, b) => a.price - b.price);
            } else if (filters.sortBy === 'price-desc') {
                results.sort((a, b) => b.price - a.price);
            } else if (filters.sortBy === 'area-desc') {
                results.sort((a, b) => b.areaM2 - a.areaM2);
            }
        }

        return results;
    }

    /**
     * Obtiene el detalle completo de una propiedad dada su ID.
     * @param {string} id
     * @returns {Promise<Object>}
     */
    static async getPropertyById(id) {
        if (!API_CONFIG.useMockData) {
            const response = await fetch(`${API_CONFIG.baseUrl}/${id}`);
            if (!response.ok) throw new Error('Propiedad no encontrada');
            return await response.json();
        }

        await new Promise(resolve => setTimeout(resolve, 150));
        const item = MOCK_PROPERTIES.find(p => p.id === id);
        if (!item) throw new Error('Propiedad no encontrada');
        return item;
    }
}
