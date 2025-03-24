import tmdbApi from './tmdb-api.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const entryForm = document.getElementById('entryForm');
    const entriesGrid = document.getElementById('entriesGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const editForm = document.getElementById('editForm');
    const themeToggle = document.getElementById('themeToggle');
    const searchInput = document.getElementById('search');
    const searchResults = document.getElementById('searchResults');
    const detailsModal = document.getElementById('detailsModal');
    const closeDetailsModal = document.getElementById('closeDetailsModal');
    const detailsTitle = document.getElementById('detailsTitle');
    const detailsBody = document.getElementById('detailsBody');
    
    // State
    let entries = JSON.parse(localStorage.getItem('watchEntries')) || [];
    let currentFilter = 'all';
    let editingId = null;
    let searchTimeout = null;
    let selectedItem = null;
    
    // Functions
    const saveEntries = () => {
        localStorage.setItem('watchEntries', JSON.stringify(entries));
    };
    
    const renderEntries = () => {
        entriesGrid.innerHTML = '';
        
        const filteredEntries = currentFilter === 'all' 
            ? entries 
            : entries.filter(entry => entry.type === currentFilter);
        
        if (filteredEntries.length === 0) {
            entriesGrid.innerHTML = `
                <div class="no-entries">
                    <i class="fas fa-film"></i>
                    <p>No entries yet. Add your first movie or TV show!</p>
                </div>
            `;
            return;
        }
        
        filteredEntries.forEach(entry => {
            const entryCard = document.createElement('div');
            entryCard.className = entry.posterUrl ? 'entry-card with-poster' : 'entry-card';
            entryCard.dataset.id = entry.id;
            
            // Prepare stars HTML
            let starsHTML = '';
            for (let i = 1; i <= 5; i++) {
                const starClass = i <= entry.rating ? 'fas' : 'far';
                starsHTML += `<i class="${starClass} fa-star"></i>`;
            }
            
            let entryHTML = '';
            
            if (entry.posterUrl) {
                entryHTML += `<img src="${entry.posterUrl}" alt="${entry.title} Poster" class="entry-poster">`;
            }
            
            entryHTML += `
                <div class="entry-info">
                    <div class="entry-type">${entry.type}</div>
                    <h3 class="entry-title">${entry.title}</h3>
                    <div class="entry-rating">${starsHTML}</div>
                    <p class="entry-notes">${entry.notes || 'No notes added'}</p>
                    <div class="entry-actions">
                        ${entry.tmdbId ? `<button class="action-btn view-details-btn" data-id="${entry.id}" data-tmdb-id="${entry.tmdbId}" data-type="${entry.mediaType || (entry.type === 'Movie' ? 'movie' : 'tv')}"><i class="fas fa-info-circle"></i></button>` : ''}
                        <button class="action-btn edit-btn" data-id="${entry.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${entry.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            
            entryCard.innerHTML = entryHTML;
            entriesGrid.appendChild(entryCard);
        });
        
        // Add event listeners to the new buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                openEditModal(id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                deleteEntry(id);
            });
        });
        
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const tmdbId = btn.dataset.tmdbId;
                const type = btn.dataset.type;
                showDetails(id, tmdbId, type);
            });
        });
    };
    
    const addEntry = (entry) => {
        entries.unshift(entry);
        saveEntries();
        renderEntries();
        showNotification('Entry added successfully!');
    };
    
    const updateEntry = (id, updatedEntry) => {
        const index = entries.findIndex(entry => entry.id === id);
        if (index !== -1) {
            entries[index] = { ...entries[index], ...updatedEntry };
            saveEntries();
            renderEntries();
            closeEditModal();
            showNotification('Entry updated successfully!');
        }
    };
    
    const deleteEntry = (id) => {
        const entryCard = document.querySelector(`.entry-card[data-id="${id}"]`);
        
        // Add removal animation
        entryCard.style.animation = 'fadeOut 0.3s forwards';
        
        setTimeout(() => {
            entries = entries.filter(entry => entry.id !== id);
            saveEntries();
            renderEntries();
            showNotification('Entry removed successfully!');
        }, 300);
    };
    
    const openEditModal = (id) => {
        const entry = entries.find(entry => entry.id === id);
        if (!entry) return;
        
        editingId = id;
        document.getElementById('editId').value = id;
        document.getElementById('editTitle').value = entry.title;
        document.getElementById('editType').value = entry.type;
        document.getElementById('editNotes').value = entry.notes || '';
        
        // Set rating
        document.querySelector(`#editRatingContainer input[value="${entry.rating}"]`).checked = true;
        
        editModal.classList.add('active');
    };
    
    const closeEditModal = () => {
        editModal.classList.remove('active');
        editingId = null;
        editForm.reset();
    };
    
    const showNotification = (message, isError = false) => {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : ''}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };
    
    const toggleTheme = () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        
        // Update icon
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        // Save preference to localStorage
        localStorage.setItem('darkTheme', isDark);
    };
    
    // TMDB API Functions
    const searchTMDB = async (query) => {
        if (!query.trim()) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }
        
        // Add a loading indicator
        searchResults.innerHTML = '<div class="loading-container"><div class="loading"></div></div>';
        searchResults.classList.add('active');
        
        try {
            const results = await tmdbApi.searchMulti(query);
            renderSearchResults(results);
        } catch (error) {
            console.error('TMDB search error:', error);
            searchResults.innerHTML = '<div class="no-results">Error searching. Please try again.</div>';
        }
    };
    
    const renderSearchResults = (results) => {
        if (!results || results.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No results found</div>';
            return;
        }
        
        searchResults.innerHTML = '';
        
        results.forEach(result => {
            const isMovie = result.media_type === 'movie';
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.dataset.id = result.id;
            resultItem.dataset.type = result.media_type;
            
            const title = isMovie ? result.title : result.name;
            const year = isMovie 
                ? (result.release_date ? new Date(result.release_date).getFullYear() : 'N/A')
                : (result.first_air_date ? new Date(result.first_air_date).getFullYear() : 'N/A');
            
            resultItem.innerHTML = `
                <img src="${tmdbApi.getPosterUrl(result.poster_path)}" alt="${title} Poster">
                <div class="search-result-info">
                    <div class="search-result-title">${title}</div>
                    <div class="search-result-year">${year}</div>
                </div>
                <span class="search-result-type">${isMovie ? 'Movie' : 'TV Show'}</span>
            `;
            
            resultItem.addEventListener('click', () => selectSearchResult(result));
            searchResults.appendChild(resultItem);
        });
    };
    
    const selectSearchResult = async (result) => {
        searchResults.classList.remove('active');
        searchInput.value = '';
        
        const isMovie = result.media_type === 'movie';
        
        // Auto-fill the form
        document.getElementById('title').value = isMovie ? result.title : result.name;
        document.getElementById('type').value = isMovie ? 'Movie' : 'TV Show';
        
        // Store selected item for details
        selectedItem = {
            tmdbId: result.id,
            type: result.media_type,
            posterPath: result.poster_path,
            posterUrl: tmdbApi.getPosterUrl(result.poster_path)
        };
    };
    
    const showDetails = async (entryId, tmdbId, type) => {
        detailsBody.innerHTML = '<div class="loading-container"><div class="loading"></div></div>';
        detailsModal.classList.add('active');
        
        try {
            let details;
            if (type === 'movie') {
                details = await tmdbApi.getMovieDetails(tmdbId);
                detailsTitle.textContent = details.title;
            } else {
                details = await tmdbApi.getTVDetails(tmdbId);
                detailsTitle.textContent = details.name;
            }
            
            renderDetails(details, type, entryId);
        } catch (error) {
            console.error('Error fetching details:', error);
            detailsBody.innerHTML = '<p class="error">Error loading details. Please try again.</p>';
        }
    };
    
    const renderDetails = (details, type, entryId) => {
        const isMovie = type === 'movie';
        const year = isMovie 
            ? (details.release_date ? new Date(details.release_date).getFullYear() : 'N/A')
            : (details.first_air_date ? new Date(details.first_air_date).getFullYear() : 'N/A');
            
        const genres = details.genres.map(genre => genre.name).join(', ');
        const rating = details.vote_average ? (details.vote_average / 2).toFixed(1) : 'N/A';
        
        const runtime = isMovie 
            ? details.runtime ? `${details.runtime} min` : 'N/A'
            : details.episode_run_time && details.episode_run_time.length > 0 ? `${details.episode_run_time[0]} min/ep` : 'N/A';
            
        const status = details.status || 'N/A';
        
        let additionalInfo = '';
        if (isMovie) {
            if (details.budget > 0) {
                additionalInfo += `<p><strong>Budget:</strong> $${(details.budget).toLocaleString()}</p>`;
            }
        } else {
            additionalInfo += `<p><strong>Seasons:</strong> ${details.number_of_seasons || 'N/A'}</p>`;
            additionalInfo += `<p><strong>Episodes:</strong> ${details.number_of_episodes || 'N/A'}</p>`;
        }
        
        detailsBody.innerHTML = `
            <img src="${tmdbApi.getPosterUrl(details.poster_path)}" alt="${isMovie ? details.title : details.name} Poster" class="details-poster">
            <div class="details-info">
                <div class="details-meta">
                    <span class="details-meta-item">${year}</span>
                    <span class="details-meta-item">${runtime}</span>
                    <span class="details-meta-item">TMDB: ${rating}/5</span>
                    <span class="details-meta-item">${status}</span>
                </div>
                
                <h3>Overview</h3>
                <p class="details-overview">${details.overview || 'No overview available.'}</p>
                
                <h3>Genres</h3>
                <p>${genres || 'N/A'}</p>
                
                ${additionalInfo}
                
                <div class="details-actions">
                    <a href="https://www.themoviedb.org/${type}/${details.id}" class="btn" target="_blank">View on TMDB</a>
                </div>
            </div>
        `;
    };
    
    const closeDetailsModalFunction = () => {
        detailsModal.classList.remove('active');
    };
    
    // Event Listeners
    entryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('title').value.trim();
        const type = document.getElementById('type').value;
        const ratingInput = document.querySelector('input[name="rating"]:checked');
        const notes = document.getElementById('notes').value.trim();
        
        if (!title || !type || !ratingInput) {
            showNotification('Please fill in all required fields!', true);
            return;
        }
        
        const rating = parseInt(ratingInput.value);
        
        let newEntry = {
            id: Date.now().toString(),
            title,
            type,
            rating,
            notes,
            createdAt: new Date().toISOString()
        };
        
        // Add TMDB data if available
        if (selectedItem) {
            newEntry = {
                ...newEntry,
                tmdbId: selectedItem.tmdbId,
                mediaType: selectedItem.type,
                posterPath: selectedItem.posterPath,
                posterUrl: selectedItem.posterUrl
            };
            selectedItem = null; // Reset selected item
        }
        
        addEntry(newEntry);
        entryForm.reset();
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderEntries();
        });
    });
    
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('editTitle').value.trim();
        const type = document.getElementById('editType').value;
        const ratingInput = document.querySelector('input[name="editRating"]:checked');
        const notes = document.getElementById('editNotes').value.trim();
        
        if (!title || !type || !ratingInput) {
            showNotification('Please fill in all required fields!', true);
            return;
        }
        
        const rating = parseInt(ratingInput.value);
        
        updateEntry(editingId, {
            title,
            type,
            rating,
            notes,
            updatedAt: new Date().toISOString()
        });
    });
    
    closeModal.addEventListener('click', closeEditModal);
    closeDetailsModal.addEventListener('click', closeDetailsModalFunction);
    
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
        if (e.target === detailsModal) {
            closeDetailsModalFunction();
        }
    });
    
    themeToggle.addEventListener('click', toggleTheme);
    
    // TMDB search with debounce
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        
        // Clear any existing timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Debounce search - wait 500ms after typing stops before searching
        searchTimeout = setTimeout(() => {
            searchTMDB(query);
        }, 500);
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
    
    // Focus out of search input
    searchInput.addEventListener('blur', () => {
        // Small delay to allow click events on results to fire first
        setTimeout(() => {
            if (!searchResults.matches(':hover')) {
                searchResults.classList.remove('active');
            }
        }, 150);
    });
    
    // Initialize
    const loadThemePreference = () => {
        const isDark = localStorage.getItem('darkTheme') === 'true';
        if (isDark) {
            document.body.classList.add('dark-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    };
    
    loadThemePreference();
    renderEntries();
});
