/**
 * Main Application Script for InmoFinder
 * Handles UI events, state management, search filters, favorites localStorage and dynamic rendering.
 */

// Application State
const state = {
    filters: {
        query: '',
        transactionType: 'all',
        type: 'all',
        bedrooms: 'all',
        maxPrice: 'all',
        sortBy: 'default'
    },
    favorites: JSON.parse(localStorage.getItem('inmofinder_favorites') || '[]'),
    properties: []
};

// DOM Elements Initialization
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    updateFavoritesBadge();
    setupEventListeners();
    applyFilters();
}

function setupEventListeners() {
    // Favorites Drawer toggle
    const favBtn = document.getElementById('favorites-toggle-btn');
    if (favBtn) {
        favBtn.addEventListener('click', () => toggleFavoritesDrawer(true));
    }

    // Live search input handler
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                state.filters.query = e.target.value;
                applyFilters();
            }, 300);
        });
    }

    // Property Type select handler
    const typeSelect = document.getElementById('type-select');
    if (typeSelect) {
        typeSelect.addEventListener('change', (e) => {
            state.filters.type = e.target.value;
            applyFilters();
        });
    }
}

/**
 * Sets transaction type filter tab (all / venta / alquiler)
 */
function setTransactionType(type) {
    state.filters.transactionType = type;

    // Update active tab styles
    const tabs = ['tab-all', 'tab-sale', 'tab-rent'];
    tabs.forEach(tabId => {
        const btn = document.getElementById(tabId);
        if (!btn) return;

        if (
            (tabId === 'tab-all' && type === 'all') ||
            (tabId === 'tab-sale' && type === 'venta') ||
            (tabId === 'tab-rent' && type === 'alquiler')
        ) {
            btn.className = "type-tab px-4 py-1.5 rounded-lg text-sm font-semibold bg-brand-600 text-white shadow-sm transition";
        } else {
            btn.className = "type-tab px-4 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition";
        }
    });

    applyFilters();
}

/**
 * Fetches filtered properties from RealEstateAPI service and updates DOM
 */
async function applyFilters() {
    const container = document.getElementById('listings-container');
    const loading = document.getElementById('loading-spinner');
    const empty = document.getElementById('empty-state');
    const countEl = document.getElementById('results-count');

    // Read additional inline filter values from DOM
    const bedroomsSelect = document.getElementById('bedrooms-select');
    if (bedroomsSelect) state.filters.bedrooms = bedroomsSelect.value;

    const maxPriceSelect = document.getElementById('max-price-select');
    if (maxPriceSelect) state.filters.maxPrice = maxPriceSelect.value;

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) state.filters.sortBy = sortSelect.value;

    // UI Loading state
    if (container) container.innerHTML = '';
    if (empty) empty.classList.add('hidden');
    if (loading) loading.classList.remove('hidden');

    try {
        const results = await RealEstateAPI.fetchProperties(state.filters);
        state.properties = results;

        if (loading) loading.classList.add('hidden');

        if (countEl) {
            countEl.textContent = `${results.length} propiedad${results.length === 1 ? '' : 'es'} encontrada${results.length === 1 ? '' : 's'}`;
        }

        if (results.length === 0) {
            if (empty) empty.classList.remove('hidden');
        } else {
            renderPropertyListings(results);
        }
    } catch (err) {
        if (loading) loading.classList.add('hidden');
        showToast('Error al conectar con el servicio de API', 'error');
        console.error('API Error:', err);
    }
}

/**
 * Renders property card grid
 */
function renderPropertyListings(items) {
    const container = document.getElementById('listings-container');
    if (!container) return;

    container.innerHTML = items.map(property => {
        const isFav = state.favorites.includes(property.id);
        const formattedPrice = new Intl.NumberFormat('es-ES').format(property.price);
        const priceLabel = property.transactionType === 'alquiler' ? `${formattedPrice} €/mes` : `${formattedPrice} €`;

        return `
            <div class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col justify-between">
                <div>
                    <!-- Image Banner -->
                    <div class="relative h-52 overflow-hidden bg-slate-100">
                        <img src="${property.images[0]}" alt="${property.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">

                        <!-- Badges -->
                        <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            <span class="px-2.5 py-1 text-xs font-bold rounded-lg ${property.transactionType === 'venta' ? 'bg-sky-600 text-white' : 'bg-emerald-600 text-white'} uppercase tracking-wide">
                                ${property.transactionType === 'venta' ? 'En Venta' : 'Alquiler'}
                            </span>
                            <span class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900/80 text-white backdrop-blur-xs">
                                ${property.type}
                            </span>
                        </div>

                        <!-- Favorite Heart Button -->
                        <button onclick="toggleFavorite('${property.id}')" class="absolute top-3 right-3 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-rose-500 shadow-md transition-transform active:scale-90 z-10" title="Guardar en favoritos">
                            <i class="${isFav ? 'fa-solid text-rose-500' : 'fa-regular'} fa-heart text-lg"></i>
                        </button>
                    </div>

                    <!-- Card Body -->
                    <div class="p-5">
                        <div class="flex justify-between items-baseline mb-2">
                            <span class="text-2xl font-black text-brand-600">${priceLabel}</span>
                        </div>

                        <h3 class="text-lg font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-brand-600 transition">
                            ${property.title}
                        </h3>

                        <p class="text-xs font-medium text-slate-500 flex items-center mt-1 mb-4">
                            <i class="fa-solid fa-location-dot text-brand-500 mr-1.5"></i>
                            ${property.location}
                        </p>

                        <!-- Key Specs -->
                        <div class="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl text-slate-600 text-xs font-medium border border-slate-100">
                            <div class="flex items-center space-x-1.5">
                                <i class="fa-solid fa-bed text-brand-500"></i>
                                <span>${property.bedrooms} hab.</span>
                            </div>
                            <div class="flex items-center space-x-1.5">
                                <i class="fa-solid fa-bath text-brand-500"></i>
                                <span>${property.bathrooms} baño${property.bathrooms > 1 ? 's' : ''}</span>
                            </div>
                            <div class="flex items-center space-x-1.5">
                                <i class="fa-solid fa-ruler-combined text-brand-500"></i>
                                <span>${property.areaM2} m²</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Action -->
                <div class="px-5 pb-5 pt-1">
                    <button onclick="openModal('${property.id}')" class="w-full py-2.5 bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2">
                        <span>Ver Ficha Completa</span>
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Resets all search filters back to default values
 */
function resetFilters() {
    state.filters = {
        query: '',
        transactionType: 'all',
        type: 'all',
        bedrooms: 'all',
        maxPrice: 'all',
        sortBy: 'default'
    };

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    const typeSelect = document.getElementById('type-select');
    if (typeSelect) typeSelect.value = 'all';

    const bedroomsSelect = document.getElementById('bedrooms-select');
    if (bedroomsSelect) bedroomsSelect.value = 'all';

    const maxPriceSelect = document.getElementById('max-price-select');
    if (maxPriceSelect) maxPriceSelect.value = 'all';

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'default';

    setTransactionType('all');
}

/**
 * Favorite Bookmark Toggle Logic
 */
function toggleFavorite(id) {
    const index = state.favorites.indexOf(id);
    if (index === -1) {
        state.favorites.push(id);
        showToast('Guardado en tus favoritos', 'success');
    } else {
        state.favorites.splice(index, 1);
        showToast('Eliminado de favoritos', 'info');
    }

    localStorage.setItem('inmofinder_favorites', JSON.stringify(state.favorites));
    updateFavoritesBadge();
    applyFilters();
    renderFavoritesList();
}

function updateFavoritesBadge() {
    const badge = document.getElementById('favorites-badge');
    if (!badge) return;

    const count = state.favorites.length;
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

/**
 * Property Details Modal
 */
async function openModal(id) {
    const modal = document.getElementById('property-modal');
    const content = document.getElementById('modal-content');

    if (!modal || !content) return;

    try {
        const item = await RealEstateAPI.getPropertyById(id);
        const formattedPrice = new Intl.NumberFormat('es-ES').format(item.price);
        const priceLabel = item.transactionType === 'alquiler' ? `${formattedPrice} €/mes` : `${formattedPrice} €`;
        const isFav = state.favorites.includes(item.id);

        content.innerHTML = `
            <div class="relative">
                <!-- Primary Image -->
                <img src="${item.images[0]}" alt="${item.title}" class="w-full h-72 object-cover">
            </div>

            <div class="p-6 space-y-6">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <span class="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md mb-2 inline-block">
                            ${item.type} en ${item.transactionType === 'venta' ? 'Venta' : 'Alquiler'}
                        </span>
                        <h2 class="text-2xl font-bold text-slate-900">${item.title}</h2>
                        <p class="text-slate-500 text-sm flex items-center mt-1">
                            <i class="fa-solid fa-location-dot text-brand-500 mr-1.5"></i>
                            ${item.address}, ${item.location}
                        </p>
                    </div>
                    <div class="text-left sm:text-right">
                        <span class="text-3xl font-extrabold text-brand-600">${priceLabel}</span>
                    </div>
                </div>

                <!-- Feature Grid -->
                <div class="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl text-center">
                    <div>
                        <span class="block text-slate-400 text-xs font-medium">Habitaciones</span>
                        <span class="text-lg font-bold text-slate-800">${item.bedrooms}</span>
                    </div>
                    <div>
                        <span class="block text-slate-400 text-xs font-medium">Baños</span>
                        <span class="text-lg font-bold text-slate-800">${item.bathrooms}</span>
                    </div>
                    <div>
                        <span class="block text-slate-400 text-xs font-medium">Superficie</span>
                        <span class="text-lg font-bold text-slate-800">${item.areaM2} m²</span>
                    </div>
                </div>

                <!-- Description -->
                <div>
                    <h3 class="font-bold text-slate-900 text-sm uppercase tracking-wide mb-2">Descripción</h3>
                    <p class="text-slate-600 text-sm leading-relaxed">${item.description}</p>
                </div>

                <!-- Features Tags -->
                <div>
                    <h3 class="font-bold text-slate-900 text-sm uppercase tracking-wide mb-2">Características Principales</h3>
                    <div class="flex flex-wrap gap-2">
                        ${item.features.map(f => `
                            <span class="bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                                <i class="fa-solid fa-check text-emerald-500"></i>
                                <span>${f}</span>
                            </span>
                        `).join('')}
                    </div>
                </div>

                <!-- Agent Contact Box -->
                <div class="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center font-bold text-lg text-white">
                            ${item.agent.name.charAt(0)}
                        </div>
                        <div>
                            <h4 class="font-bold text-sm">${item.agent.name}</h4>
                            <p class="text-xs text-slate-400">Agente Inmobiliario Asignado</p>
                        </div>
                    </div>
                    <div class="flex space-x-2 w-full sm:w-auto">
                        <a href="tel:${item.agent.phone}" class="flex-1 sm:flex-initial text-center bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition">
                            <i class="fa-solid fa-phone mr-1.5"></i> Llamar
                        </a>
                        <button onclick="showToast('Consulta enviada al agente', 'success'); closeModal();" class="flex-1 sm:flex-initial bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition">
                            Contactar
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } catch (err) {
        showToast('Error al cargar detalle del inmueble', 'error');
    }
}

function closeModal() {
    const modal = document.getElementById('property-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * Favorites Drawer Render
 */
function toggleFavoritesDrawer(open) {
    const drawer = document.getElementById('favorites-drawer');
    if (!drawer) return;

    if (open) {
        renderFavoritesList();
        drawer.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        drawer.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

async function renderFavoritesList() {
    const container = document.getElementById('favorites-list');
    if (!container) return;

    if (state.favorites.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <i class="fa-regular fa-heart text-4xl mb-3 block"></i>
                <p class="text-sm">No tienes propiedades guardadas en favoritos.</p>
            </div>
        `;
        return;
    }

    const allProps = await RealEstateAPI.fetchProperties({});
    const favProps = allProps.filter(p => state.favorites.includes(p.id));

    container.innerHTML = favProps.map(item => `
        <div class="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <img src="${item.images[0]}" alt="${item.title}" class="w-16 h-16 object-cover rounded-lg">
            <div class="flex-grow min-w-0">
                <h4 class="text-xs font-bold text-slate-900 truncate">${item.title}</h4>
                <p class="text-xs text-brand-600 font-bold">${item.price} €</p>
                <p class="text-[10px] text-slate-400">${item.location}</p>
            </div>
            <button onclick="toggleFavorite('${item.id}')" class="text-rose-500 hover:text-rose-700 p-2 text-sm">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    const iconEl = document.getElementById('toast-icon');

    if (!toast || !msgEl) return;

    msgEl.textContent = message;

    if (type === 'error') {
        iconEl.className = "fa-solid fa-circle-exclamation text-rose-400 text-lg";
    } else if (type === 'info') {
        iconEl.className = "fa-solid fa-circle-info text-sky-400 text-lg";
    } else {
        iconEl.className = "fa-solid fa-circle-check text-emerald-400 text-lg";
    }

    toast.classList.remove('translate-y-20', 'opacity-0');

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}
