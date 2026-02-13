document.addEventListener('DOMContentLoaded', () => {
    // --- CURSOR PERSONALIZADO ---
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    function addCursorHover(element) {
        element.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        element.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    }

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

    // --- LÓGICA DE PERFIL Y MENÚ ---
    const user = JSON.parse(localStorage.getItem('user'));
    const userProfile = document.getElementById('userProfile');
    const userDropdown = document.getElementById('userDropdown');
    const userAvatar = document.getElementById('userAvatar');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const deleteBtn = document.getElementById('deleteAccountBtn');
    const editIconBtn = document.getElementById('editIconBtn');

    if (user) {
        if (userNameDisplay) userNameDisplay.textContent = user.username || user.email;
        if (userAvatar && user.avatar) userAvatar.src = user.avatar;
    }

    if (userProfile && userDropdown) {
        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => userDropdown.classList.remove('show'));
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }

    if (editIconBtn) {
        editIconBtn.addEventListener('click', () => {
            const newUrl = prompt('Introduce la URL de tu nueva imagen de perfil:', userAvatar.src);
            if (newUrl) {
                userAvatar.src = newUrl;
                user.avatar = newUrl;
                localStorage.setItem('user', JSON.stringify(user));
            }
        });
    }

    if (deleteBtn && user) {
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
    }

    const API_URL = 'http://localhost:3000/api/movies';
    const categoriesContainer = document.getElementById('categories-container');

    let loadedMovies = [];

    function renderCategories(movies) {
        // Limpiar excepto el section de búsqueda
        const searchSection = document.getElementById('search-results-section');
        categoriesContainer.innerHTML = '';
        if (searchSection) categoriesContainer.appendChild(searchSection);

        if (movies.length === 0) {
            categoriesContainer.innerHTML += '<p style="text-align:center; padding: 2rem;">No se encontraron películas.</p>';
            return;
        }

        // Agrupar por género
        const groupedMovies = movies.reduce((acc, movie) => {
            const genre = movie.genre || 'Otros';
            if (!acc[genre]) acc[genre] = [];
            acc[genre].push(movie);
            return acc;
        }, {});

        // Crear una fila por cada género
        Object.keys(groupedMovies).sort().forEach(genre => {
            const row = createCategoryRow(genre, groupedMovies[genre]);
            categoriesContainer.appendChild(row);
        });

        // --- GENERAR BOTONES DE GÉNERO ---
        const genreFilters = document.getElementById('genreFilters');
        if (genreFilters) {
            genreFilters.innerHTML = '<button class="cat-filter-btn active" data-genre="all">Todas</button>';
            Object.keys(groupedMovies).sort().forEach(genre => {
                const btn = document.createElement('button');
                btn.classList.add('cat-filter-btn');
                btn.dataset.genre = genre;
                btn.textContent = genre;
                genreFilters.appendChild(btn);
            });

            // Lógica de click para estos botones
            const genreBtns = genreFilters.querySelectorAll('.cat-filter-btn');
            genreBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    genreBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const selectedGenre = btn.dataset.genre;
                    const rows = categoriesContainer.querySelectorAll('.category-row');

                    rows.forEach(row => {
                        const rowTitle = row.querySelector('.category-title').textContent;
                        if (selectedGenre === 'all' || rowTitle === selectedGenre) {
                            row.style.display = 'block';
                        } else {
                            row.style.display = 'none';
                        }
                    });
                });
            });
        }

        // Re-bind hover for existing interactive elements
        document.querySelectorAll('a, button, .logo').forEach(addCursorHover);

        // Inicializar búsqueda por si hay texto al cargar
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
                let sorted = [...loadedMovies];

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

                renderCategories(sorted);
                filterDropdown.classList.remove('show');
            });
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
            e.stopPropagation();
            toggleMyList(movie, addBtn);
        });

        overlay.appendChild(title);
        overlay.appendChild(actions);
        card.appendChild(img);
        card.appendChild(overlay);

        // Abrir modal al clicar en la tarjeta
        card.addEventListener('click', () => {
            showMovieDetails(movie);
        });

        const infoBtn = actions.querySelector('.action-btn.info');
        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showMovieDetails(movie);
        });

        addCursorHover(card);

        return card;
    }

    function createCategoryRow(genre, movies) {
        const row = document.createElement('div');
        row.classList.add('category-row');

        const title = document.createElement('h2');
        title.classList.add('category-title');
        title.textContent = genre || 'Otros';

        const carouselContainer = document.createElement('div');
        carouselContainer.classList.add('carousel-container');

        const prevBtn = document.createElement('button');
        prevBtn.classList.add('carousel-btn', 'prev');
        prevBtn.setAttribute('aria-label', 'Anterior');
        prevBtn.textContent = '‹';

        const nextBtn = document.createElement('button');
        nextBtn.classList.add('carousel-btn', 'next');
        nextBtn.setAttribute('aria-label', 'Siguiente');
        nextBtn.textContent = '›';

        const movieList = document.createElement('div');
        movieList.classList.add('movie-list');

        movies.forEach(movie => {
            movieList.appendChild(createMovieCard(movie));
        });

        carouselContainer.appendChild(prevBtn);
        carouselContainer.appendChild(movieList);
        carouselContainer.appendChild(nextBtn);

        row.appendChild(title);
        row.appendChild(carouselContainer);

        // Ocultar botones de carrusel si hay menos de 6
        if (movies.length < 6) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }

        // Configurar el carrusel inmediatamente o guardarlo para después
        setupCarousel(carouselContainer);

        return row;
    }

    const setupCarousel = (container) => {
        const list = container.querySelector('.movie-list');
        const nextBtn = container.querySelector('.carousel-btn.next');
        const prevBtn = container.querySelector('.carousel-btn.prev');

        if (!list || !nextBtn || !prevBtn) return;

        const scrollAmount = () => {
            const firstCard = list.querySelector('.movie-card');
            if (!firstCard) return 300;
            return (firstCard.offsetWidth + 20) * 2;
        };

        nextBtn.addEventListener('click', () => {
            const maxScroll = list.scrollWidth - list.clientWidth;
            if (list.scrollLeft >= maxScroll - 5) {
                list.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                list.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
            }
        });

        prevBtn.addEventListener('click', () => {
            if (list.scrollLeft <= 5) {
                list.scrollTo({ left: list.scrollWidth, behavior: 'smooth' });
            } else {
                list.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
            }
        });

        [nextBtn, prevBtn].forEach(btn => {
            btn.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            btn.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });
    };

    fetch(API_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data.ok && data.movies && data.movies.length > 0) {
                loadedMovies = data.movies;
                renderCategories(loadedMovies);
            } else {
                categoriesContainer.innerHTML = '<p style="text-align:center; padding: 2rem;">No se encontraron películas.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching movies:', error);
            categoriesContainer.innerHTML = '<p style="text-align:center; padding: 2rem; color: #ff6b6b;">Error al conectar con el servidor.</p>';
        });
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
            if (clearBtn) clearBtn.classList.add('visible');
            if (searchContainer) searchContainer.classList.add('has-text');
        } else {
            if (clearBtn) clearBtn.classList.remove('visible');
            if (searchContainer) searchContainer.classList.remove('has-text');
        }

        if (searchTerm === "") {
            if (searchResultsSection) searchResultsSection.style.display = 'none';
            if (searchResultsGrid) searchResultsGrid.innerHTML = '';
            categoryRows.forEach(row => row.style.display = 'block');
        } else {
            // Limpiar resultados anteriores
            if (searchResultsGrid) searchResultsGrid.innerHTML = '';
            let matches = 0;

            // Almacenar IDs para no duplicar en la vista de búsqueda
            const addedIds = new Set();

            originalCards.forEach(card => {
                const titleCol = card.querySelector('h3');
                if (!titleCol) return;
                const title = titleCol.textContent.toLowerCase();
                const genre = (card.dataset.genre || '').toLowerCase();
                const saga = (card.dataset.saga || '').toLowerCase();
                const productora = (card.dataset.productora || '').toLowerCase();
                const actor = (card.dataset.actor || '').toLowerCase();

                if (title.includes(searchTerm) || genre.includes(searchTerm) || saga.includes(searchTerm) || productora.includes(searchTerm) || actor.includes(searchTerm)) {
                    // Solo añadir si no lo hemos añadido ya
                    const movieId = card.dataset.movieId || title;
                    if (!addedIds.has(movieId)) {
                        const clone = card.cloneNode(true);

                        // Re-vincular cursor
                        clone.addEventListener('mouseenter', () => cursor.classList.add('hover'));
                        clone.addEventListener('mouseleave', () => cursor.classList.remove('hover'));

                        // Re-vincular modal
                        const movieData = JSON.parse(card.dataset.movieRaw || '{}');
                        clone.addEventListener('click', () => showMovieDetails(movieData));
                        const infoBtn = clone.querySelector('.info');
                        if (infoBtn) {
                            infoBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                showMovieDetails(movieData);
                            });
                        }

                        // Re-vincular añadir a lista
                        const addBtn = clone.querySelector('.add');
                        if (addBtn) {
                            addBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                toggleMyList(movieData, addBtn);
                            });
                        }

                        if (searchResultsGrid) searchResultsGrid.appendChild(clone);
                        addedIds.add(movieId);
                        matches++;
                    }
                }
            });

            if (matches > 0) {
                if (searchResultsSection) searchResultsSection.style.display = 'block';
                categoryRows.forEach(row => row.style.display = 'none');
            } else {
                if (searchResultsSection) searchResultsSection.style.display = 'none';
                categoryRows.forEach(row => row.style.display = 'none');
            }
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            performSearch();
            searchInput.focus();
        });
    }
});
