document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const entryForm = document.getElementById('entryForm');
    const entriesGrid = document.getElementById('entriesGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const editForm = document.getElementById('editForm');
    const themeToggle = document.getElementById('themeToggle');
    
    // State
    let entries = JSON.parse(localStorage.getItem('watchEntries')) || [];
    let currentFilter = 'all';
    let editingId = null;
    
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
            entryCard.className = 'entry-card';
            entryCard.dataset.id = entry.id;
            
            // Prepare stars HTML
            let starsHTML = '';
            for (let i = 1; i <= 5; i++) {
                const starClass = i <= entry.rating ? 'fas' : 'far';
                starsHTML += `<i class="${starClass} fa-star"></i>`;
            }
            
            entryCard.innerHTML = `
                <div class="entry-type">${entry.type}</div>
                <h3 class="entry-title">${entry.title}</h3>
                <div class="entry-rating">${starsHTML}</div>
                <p class="entry-notes">${entry.notes || 'No notes added'}</p>
                <div class="entry-actions">
                    <button class="action-btn edit-btn" data-id="${entry.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${entry.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
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
        
        const newEntry = {
            id: Date.now().toString(),
            title,
            type,
            rating,
            notes,
            createdAt: new Date().toISOString()
        };
        
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
    
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });
    
    themeToggle.addEventListener('click', toggleTheme);
    
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
