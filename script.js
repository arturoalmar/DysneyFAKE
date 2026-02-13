document.addEventListener('DOMContentLoaded', () => {
    // --- AUTH CHECK ---
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    // Mostrar el nombre de usuario
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay && user) {
        userNameDisplay.textContent = user.username || user.email;
    }

    // --- LÓGICA DE PERFIL Y MENÚ ---
    const userProfile = document.getElementById('userProfile');
    const userDropdown = document.getElementById('userDropdown');
    const userAvatar = document.getElementById('userAvatar');
    const logoutBtn = document.getElementById('logoutBtn');
    const deleteBtn = document.getElementById('deleteAccountBtn');
    const editIconBtn = document.getElementById('editIconBtn');

    // --- LÓGICA DE MODAL ---
    const movieModal = document.getElementById('movieModal');
    const closeModal = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalYear = document.getElementById('modalYear');
    const modalRating = document.getElementById('modalRating');
    const modalScore = document.getElementById('modalScore');
    const modalSaga = document.getElementById('modalSaga');
    const modalProductora = document.getElementById('modalProductora');
    const modalDescription = document.getElementById('modalDescription');
    const modalPoster = document.getElementById('modalPoster');

    function showMovieDetails(movie) {
        if (!movieModal) return;
        modalTitle.textContent = movie.title;
        modalYear.textContent = movie.release_year || '';
        modalRating.textContent = movie.rating || 'TP';
        if (modalScore) modalScore.textContent = `⭐ ${movie.score || '0.0'}`;
        if (modalSaga) modalSaga.textContent = movie.saga || 'Disney Collection';
        if (modalProductora) modalProductora.textContent = movie.productora || 'Disney';
        modalDescription.textContent = movie.description || 'Sin descripción disponible.';
        if (modalPoster) {
            modalPoster.src = movie.poster;
            modalPoster.alt = movie.title;
        }
        movieModal.classList.add('show');
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => movieModal.classList.remove('show'));
    }

    window.addEventListener('click', (e) => {
        if (e.target === movieModal) movieModal.classList.remove('show');
    });

    // Cargar avatar si existe en el usuario
    if (user && user.avatar) {
        userAvatar.src = user.avatar;
    }

    // Toggle menú
    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => userDropdown.classList.remove('show'));

    // Cerrar Sesión
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Editar Icono
    editIconBtn.addEventListener('click', () => {
        const newUrl = prompt('Introduce la URL de tu nueva imagen de perfil:', userAvatar.src);
        if (newUrl) {
            userAvatar.src = newUrl;
            user.avatar = newUrl;
            localStorage.setItem('user', JSON.stringify(user));
        }
    });

    // Eliminar Cuenta
    deleteBtn.addEventListener('click', async () => {
        if (confirm('¿ESTÁS SEGURO? Esto borrará tu cuenta para siempre. ¡BOOM!')) {
            try {
                const res = await fetch('http://localhost:3000/api/auth/account', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                });
                const data = await res.json();
                if (data.ok) {
                    localStorage.removeItem('user');
                    alert('Cuenta eliminada. Adiós, vaquero.');
                    window.location.href = 'login.html';
                }
            } catch (err) {
                console.error('Error deleting account:', err);
            }
        }
    });

    // Crear el elemento del cursor
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    // Mover el cursor con el mouse
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Detectar elementos interactivos
    const interactiveElements = document.querySelectorAll('a, button, .movie-card, .logo, .user-profile, .carousel-btn');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
        });
    });

    // Asegurar que también funcione para nuevos elementos si se añadieran dinámicamente (opcional, pero buena práctica)
    // O simplemente usar delegación de eventos si fuera una app compleja, pero por ahora esto sirve.

    // --- INTEGRACIÓN BACKEND ---
    const API_URL = 'http://localhost:3000/api/movies';

    // Contenedores de secciones en el index.html
    const sections = {
        originals: {
            container: document.getElementById('originals-section'),
            list: document.getElementById('originals-list'),
            filter: (movie) => movie.is_original === 1
        },
        trending: {
            container: document.getElementById('trending-section'),
            list: document.getElementById('trending-list'),
            filter: (movie) => movie.is_trending === 1
        },
        recommended: {
            container: document.getElementById('recommended-section'),
            list: document.getElementById('recommended-list'),
            filter: (movie) => movie.is_recommended === 1
        },
        all: {
            container: document.getElementById('all-movies-section'),
            list: document.getElementById('all-movies-list'),
            filter: () => true // Muestra todas
        }
    };

    let loadedMovies = [];

    function renderMovies(movies) {
        // Limpiar listas primero
        Object.keys(sections).forEach(key => {
            if (sections[key].list) sections[key].list.innerHTML = '';
        });

        // Llenar cada sección según su filtro
        Object.keys(sections).forEach(key => {
            const section = sections[key];
            const filteredMovies = movies.filter(section.filter);

            if (filteredMovies.length > 0) {
                if (section.container) section.container.style.display = 'block';
                filteredMovies.forEach(movie => {
                    const card = createMovieCard(movie);
                    if (section.list) section.list.appendChild(card);
                });

                // Ocultar botones de carrusel si hay menos de 6
                const prevBtn = section.container.querySelector('.carousel-btn.prev');
                const nextBtn = section.container.querySelector('.carousel-btn.next');
                if (prevBtn && nextBtn) {
                    if (filteredMovies.length < 6) {
                        prevBtn.style.display = 'none';
                        nextBtn.style.display = 'none';
                    } else {
                        prevBtn.style.display = 'flex';
                        nextBtn.style.display = 'flex';
                    }
                }
            } else {
                if (section.container) section.container.style.display = 'none';
            }
        });

        // Reinicializar carruseles si es necesario (o simplemente aplicar búsqueda)
        performSearch();
    }

    // --- LÓGICA DE FILTROS ---
    const filterBtn = document.getElementById('filterBtn');
    const filterDropdown = document.getElementById('filterDropdown');

    if (filterBtn && filterDropdown) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => filterDropdown.classList.remove('show'));

        const options = document.querySelectorAll('.filter-option');
        options.forEach(opt => {
            opt.addEventListener('click', () => {
                const sortType = opt.dataset.sort;
                const isListPage = window.location.pathname.includes('favoritos.html');

                let sourceMovies = isListPage ? (JSON.parse(localStorage.getItem(getMyListKey())) || []) : [...loadedMovies];
                let sorted = [...sourceMovies];

                if (sortType === 'top-rated') {
                    sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
                    filterBtn.innerHTML = `Mejor valoradas <span>▼</span>`;
                } else if (sortType === 'oldest') {
                    sorted.sort((a, b) => (a.release_year || 2024) - (b.release_year || 2024));
                    filterBtn.innerHTML = `Antiguas <span>▼</span>`;
                } else if (sortType === 'newest') {
                    sorted.sort((a, b) => (b.release_year || 2024) - (a.release_year || 2024));
                    filterBtn.innerHTML = `Recientes <span>▼</span>`;
                } else {
                    sorted.sort((a, b) => a.title.localeCompare(b.title));
                    filterBtn.innerHTML = `Filtrar por <span>▼</span>`;
                }

                if (isListPage) {
                    renderMyList(sorted);
                } else {
                    renderMovies(sorted);
                }
                filterDropdown.classList.remove('show');
            });
        });
    }

    // --- LÓGICA DE BOTONES DE CATEGORÍA (INDEX) ---
    const indexCategoryFilters = document.getElementById('indexCategoryFilters');
    if (indexCategoryFilters) {
        const catBtns = indexCategoryFilters.querySelectorAll('.cat-filter-btn');
        catBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // UI update
                catBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const targetId = btn.dataset.target;
                const categoryRows = document.querySelectorAll('.category-row');

                categoryRows.forEach(row => {
                    // Ignorar secciones que no sean de categorías si las hubiera, 
                    // pero aquí todas las filas principales son .category-row
                    if (targetId === 'all') {
                        // Solo mostrar si tienen contenido (la lógica de renderMovies ya las oculta si están vacías, 
                        // pero aquí forzamos la visibilidad según la selección del usuario)
                        // Para simplificar, si es 'all' mostramos las que deberían estar visibles según el filtro de datos
                        const sectionKey = row.id.replace('-section', '');
                        // Buscamos si hay pelis para esta sección en loadedMovies
                        const section = sections[sectionKey === 'originals' ? 'originals' : sectionKey === 'trending' ? 'trending' : sectionKey === 'recommended' ? 'recommended' : 'all'];
                        if (section) {
                            const hasMovies = loadedMovies.filter(section.filter).length > 0;
                            row.style.display = hasMovies ? 'block' : 'none';
                        } else {
                            row.style.display = 'block';
                        }
                    } else {
                        if (row.id === targetId) {
                            row.style.display = 'block';
                        } else {
                            row.style.display = 'none';
                        }
                    }
                });

                // Si hay una búsqueda activa, los filtros de categoría podrían interferir, 
                // pero el usuario pidió filtrar las secciones existentes.
            });
        });
    }

    // --- LÓGICA DE BÚSQUEDA ---
    const searchContainer = document.querySelector('.search-container');
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');

    // Función para ejecutar la búsqueda (se llamará después de cargar los datos)
    const performSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const searchResultsSection = document.getElementById('search-results-section');
        const searchResultsGrid = document.getElementById('search-results-grid');
        const categoryRows = document.querySelectorAll('.category-row');

        // No buscar en las tarjetas clonadas de resultados anteriores
        const originalCards = document.querySelectorAll('.category-row .movie-card');

        // Mostrar/Ocultar botón de borrar
        if (searchTerm.length > 0) {
            clearBtn.classList.add('visible');
            searchContainer.classList.add('has-text');
        } else {
            clearBtn.classList.remove('visible');
            searchContainer.classList.remove('has-text');
        }

        const isListPage = window.location.pathname.includes('favoritos.html');

        if (isListPage) {
            const myListContainer = document.getElementById('my-list-container');
            const movieCards = myListContainer.querySelectorAll('.movie-card');
            const emptyMsg = document.getElementById('empty-message');
            let matches = 0;

            movieCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const genre = (card.dataset.genre || '').toLowerCase();
                const saga = (card.dataset.saga || '').toLowerCase();
                const productora = (card.dataset.productora || '').toLowerCase();
                const actor = (card.dataset.actor || '').toLowerCase();

                if (title.includes(searchTerm) || genre.includes(searchTerm) || saga.includes(searchTerm) || productora.includes(searchTerm) || actor.includes(searchTerm)) {
                    card.style.display = 'block';
                    matches++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (emptyMsg) {
                if (matches === 0 && searchTerm !== "") {
                    emptyMsg.textContent = "No se encontraron favoritos con ese criterio.";
                    emptyMsg.style.display = 'block';
                } else if (matches === 0 && searchTerm === "") {
                    emptyMsg.textContent = "No hay nada en tus favoritos aún. ¡Añade algunas cosas!";
                    emptyMsg.style.display = 'block';
                } else {
                    emptyMsg.style.display = 'none';
                }
            }
            return;
        }

        if (searchTerm === "") {
            if (searchResultsSection) searchResultsSection.style.display = 'none';
            if (searchResultsGrid) searchResultsGrid.innerHTML = '';
            categoryRows.forEach(row => row.style.display = 'block');
        } else {
            // Limpiar resultados anteriores
            searchResultsGrid.innerHTML = '';
            let matches = 0;

            // Almacenar IDs para no duplicar en la vista de búsqueda
            const addedIds = new Set();

            originalCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const genre = (card.dataset.genre || '').toLowerCase();
                const saga = (card.dataset.saga || '').toLowerCase();
                const productora = (card.dataset.productora || '').toLowerCase();
                const actor = (card.dataset.actor || '').toLowerCase();

                if (title.includes(searchTerm) || genre.includes(searchTerm) || saga.includes(searchTerm) || productora.includes(searchTerm) || actor.includes(searchTerm)) {
                    // Solo añadir si no lo hemos añadido ya (evitar duplicados entre filas)
                    const movieId = card.dataset.movieId || title;
                    if (!addedIds.has(movieId)) {
                        const clone = card.cloneNode(true);
                        // Re-vincular eventos al clon ya que cloneNode no copia event listeners
                        clone.onclick = card.onclick;
                        clone.querySelector('.info').onclick = card.querySelector('.info').onclick;
                        clone.querySelector('.add').onclick = card.querySelector('.add').onclick;

                        // En lugar de confiar en onclick, mejor usar una función para re-asignar
                        // Pero para simplicidad y que funcione el cursor:
                        clone.addEventListener('mouseenter', () => document.querySelector('.custom-cursor').classList.add('hover'));
                        clone.addEventListener('mouseleave', () => document.querySelector('.custom-cursor').classList.remove('hover'));

                        // El modal se abre por el evento 'click' que añadimos antes, necesitamos re-vincularlo
                        // Vamos a usar una solución más limpia: delegación de eventos o re-crear la tarjeta
                        // Por ahora, para esta tarea, re-vinculamos los eventos principales:
                        const movieData = JSON.parse(card.dataset.movieRaw || '{}');
                        clone.addEventListener('click', () => showMovieDetails(movieData));
                        clone.querySelector('.info').addEventListener('click', (e) => {
                            e.stopPropagation();
                            showMovieDetails(movieData);
                        });

                        searchResultsGrid.appendChild(clone);
                        addedIds.add(movieId);
                        matches++;
                    }
                }
            });

            if (matches > 0) {
                searchResultsSection.style.display = 'block';
                categoryRows.forEach(row => row.style.display = 'none');
            } else {
                searchResultsSection.style.display = 'none';
                categoryRows.forEach(row => row.style.display = 'none');
            }
        }
    };

    searchInput.addEventListener('input', performSearch);

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        performSearch();
        searchInput.focus();
    });

    // Resetear búsquedas al clicar el logo si ya estamos en Inicio
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', (e) => {
            // Si ya estamos en index o raíz, prevenimos recarga y limpiamos búsqueda
            if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                if (searchInput.value !== "") {
                    e.preventDefault();
                    searchInput.value = '';
                    performSearch();
                }
            }
        });
    }

    // --- LÓGICA DE MI LISTA ---
    const getMyListKey = () => user ? `myList_${user.id || user.email}` : 'myList_guest';

    function toggleMyList(movie, btn) {
        const key = getMyListKey();
        let myList = JSON.parse(localStorage.getItem(key)) || [];
        const index = myList.findIndex(m => m.id === movie.id || m.title === movie.title);

        if (index > -1) {
            myList.splice(index, 1);
            btn.textContent = '+';
            btn.classList.remove('added');
            btn.title = "Añadir a favoritos";
        } else {
            myList.push(movie);
            btn.textContent = '✓';
            btn.classList.add('added');
            btn.title = "En favoritos";
        }

        localStorage.setItem(key, JSON.stringify(myList));

        // Si estamos en la página de lista, refrescar
        if (window.location.pathname.includes('favoritos.html')) {
            renderMyList();
        }
    }

    function renderMyList(providedMovies = null) {
        const container = document.getElementById('my-list-container');
        const emptyMsg = document.getElementById('empty-message');
        if (!container) return;

        const key = getMyListKey();
        const myList = providedMovies || (JSON.parse(localStorage.getItem(key)) || []);

        container.innerHTML = '';
        if (myList.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
        } else {
            if (emptyMsg) emptyMsg.style.display = 'none';
            myList.forEach(movie => {
                const card = createMovieCard(movie);
                // Aseguramos que el botón refleje el estado
                const addBtn = card.querySelector('.action-btn.add');
                if (addBtn) {
                    addBtn.textContent = '✓';
                    addBtn.classList.add('added');
                }
                container.appendChild(card);
            });
        }
    }

    function createMovieCard(movie) {
        const card = document.createElement('div');
        card.classList.add('movie-card');

        // Atributos para búsqueda
        card.dataset.genre = movie.genre || '';
        card.dataset.actor = movie.actor || '';
        card.dataset.saga = movie.saga || '';
        card.dataset.productora = movie.productora || '';
        card.dataset.movieId = movie.id || movie.title;
        card.dataset.movieRaw = JSON.stringify(movie);

        const img = document.createElement('img');
        img.src = movie.poster;
        img.alt = movie.title;
        img.onerror = () => { img.src = 'https://via.placeholder.com/300x450?text=' + encodeURIComponent(movie.title); };

        const overlay = document.createElement('div');
        overlay.classList.add('card-overlay');

        const title = document.createElement('h3');
        title.textContent = movie.title;

        const actions = document.createElement('div');
        actions.classList.add('card-actions');

        // Verificar si ya está en la lista
        const key = getMyListKey();
        const myList = JSON.parse(localStorage.getItem(key)) || [];
        const isInList = myList.some(m => m.id === movie.id || m.title === movie.title);

        actions.innerHTML = `
            <button class="action-btn play" title="Reproducir">▶</button>
            <button class="action-btn add ${isInList ? 'added' : ''}" title="${isInList ? 'En favoritos' : 'Añadir a favoritos'}">${isInList ? '✓' : '+'}</button>
            <button class="action-btn info" title="Más Info">i</button>
        `;

        const addBtn = actions.querySelector('.action-btn.add');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar otros eventos del card
            toggleMyList(movie, addBtn);
        });

        overlay.appendChild(title);
        overlay.appendChild(actions);
        card.appendChild(img);
        card.appendChild(overlay);

        // Abrir modal al clicar en la tarjeta (pero no en los botones de acción)
        card.addEventListener('click', () => {
            showMovieDetails(movie);
        });

        // El botón "i" también abre el modal
        const infoBtn = actions.querySelector('.action-btn.info');
        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showMovieDetails(movie);
        });

        // Re-binding hover for cursor (since it's dynamic)
        card.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        card.addEventListener('mouseleave', () => cursor.classList.remove('hover'));

        return card;
    }

    // Cargar películas desde el backend
    fetch(API_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.ok && data.movies && data.movies.length > 0) {
                loadedMovies = data.movies;
                renderMovies(loadedMovies);

                // --- LÓGICA DE CARRUSEL ---
                const setupCarousel = (container) => {
                    const list = container.querySelector('.movie-list');
                    const nextBtn = container.querySelector('.carousel-btn.next');
                    const prevBtn = container.querySelector('.carousel-btn.prev');

                    if (!list || !nextBtn || !prevBtn) return;

                    const scrollAmount = () => {
                        const firstCard = list.querySelector('.movie-card');
                        if (!firstCard) return 300;
                        return (firstCard.offsetWidth + 20) * 2; // Scroll 2 cards at a time
                    };

                    nextBtn.addEventListener('click', () => {
                        const maxScroll = list.scrollWidth - list.clientWidth;
                        if (list.scrollLeft >= maxScroll - 5) {
                            // Infinite Loop: Back to start
                            list.scrollTo({ left: 0, behavior: 'smooth' });
                        } else {
                            list.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
                        }
                    });

                    prevBtn.addEventListener('click', () => {
                        if (list.scrollLeft <= 5) {
                            // Infinite Loop: To the end
                            list.scrollTo({ left: list.scrollWidth, behavior: 'smooth' });
                        } else {
                            list.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
                        }
                    });

                    // Add hover for cursor to dynamically added buttons
                    [nextBtn, prevBtn].forEach(btn => {
                        btn.addEventListener('mouseenter', () => cursor.classList.add('hover'));
                        btn.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
                    });
                };

                document.querySelectorAll('.carousel-container').forEach(setupCarousel);

                // --- LÓGICA DE BOTONES HERO ---
                const heroPlayBtn = document.getElementById('heroPlayBtn');
                const heroAddListBtn = document.getElementById('heroAddListBtn');

                if (heroPlayBtn) {
                    heroPlayBtn.addEventListener('click', () => {
                        alert('Esta función no está disponible en la versión de demostración.');
                    });
                }

                if (heroAddListBtn) {
                    // El Mandaloriano - Buscamos su objeto en loadedMovies si existe, 
                    // o creamos uno básico ya que es la peli del Hero por defecto
                    const mandalorianMovie = loadedMovies.find(m => m.title.includes('Mandalorian')) || {
                        id: 'mandalorian-hero',
                        title: 'The Mandalorian',
                        poster: 'https://holocronstarwarsnoticiasdiarias.wordpress.com/wp-content/uploads/2021/09/sin-titulo-3.jpg',
                        description: 'Tras la caída del Imperio, un guerrero solitario se abre paso por los confines de la galaxia.',
                        release_year: 2019,
                        rating: '12+',
                        score: 8.8,
                        genre: 'Ciencia Ficción'
                    };

                    // Función para actualizar texto del botón hero
                    const updateHeroBtnText = () => {
                        const key = getMyListKey();
                        const myList = JSON.parse(localStorage.getItem(key)) || [];
                        const isInList = myList.some(m => m.id === mandalorianMovie.id || m.title === mandalorianMovie.title);
                        heroAddListBtn.textContent = isInList ? '✓ EN FAVORITOS' : '+ FAVORITOS';
                        heroAddListBtn.classList.toggle('added', isInList);
                    };

                    updateHeroBtnText();

                    heroAddListBtn.addEventListener('click', () => {
                        toggleMyList(mandalorianMovie, heroAddListBtn);
                        updateHeroBtnText();
                    });
                }

            } else {
                console.log('No movies found or API error', data);
            }
        })
        .catch(error => console.error('Error fetching movies:', error));

    // Si estamos en la página de lista, renderizar al cargar
    if (window.location.pathname.includes('favoritos.html')) {
        renderMyList();
    }
});
