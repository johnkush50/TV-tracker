import CONFIG from './config.js';

// TMDB API Service
class TMDBApiService {
    constructor() {
        this.apiKey = CONFIG.TMDB_API_KEY;
        this.baseUrl = CONFIG.TMDB_API_BASE_URL;
        this.imageBaseUrl = CONFIG.TMDB_IMAGE_BASE_URL;
    }

    /**
     * Search for movies and TV shows
     * @param {string} query - Search term
     * @returns {Promise} - Search results
     */
    async searchMulti(query) {
        if (!query || query.trim() === '') return [];
        
        try {
            const response = await fetch(`${this.baseUrl}/search/multi?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.status_message || 'Error searching for titles');
            }
            
            // Filter out people and only return movies and TV shows
            return data.results
                .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
                .slice(0, 8); // Limit to 8 results for UX
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    /**
     * Get details for a specific movie
     * @param {number} id - Movie ID
     * @returns {Promise} - Movie details
     */
    async getMovieDetails(id) {
        try {
            const response = await fetch(`${this.baseUrl}/movie/${id}?api_key=${this.apiKey}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.status_message || 'Error fetching movie details');
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching movie details:', error);
            throw error;
        }
    }

    /**
     * Get details for a specific TV show
     * @param {number} id - TV show ID
     * @returns {Promise} - TV show details
     */
    async getTVDetails(id) {
        try {
            const response = await fetch(`${this.baseUrl}/tv/${id}?api_key=${this.apiKey}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.status_message || 'Error fetching TV show details');
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching TV show details:', error);
            throw error;
        }
    }

    /**
     * Get the full image URL for a poster path
     * @param {string} posterPath - Poster path from TMDB
     * @returns {string} - Full image URL
     */
    getPosterUrl(posterPath) {
        if (!posterPath) return 'https://via.placeholder.com/300x450?text=No+Image';
        return `${this.imageBaseUrl}${posterPath}`;
    }

    /**
     * Format a movie object for use in the app
     * @param {Object} movie - Movie data from TMDB
     * @returns {Object} - Formatted movie data
     */
    formatMovieData(movie) {
        return {
            id: `tmdb-movie-${movie.id}`,
            tmdbId: movie.id,
            title: movie.title,
            type: 'Movie',
            posterPath: movie.poster_path,
            posterUrl: this.getPosterUrl(movie.poster_path),
            releaseDate: movie.release_date,
            overview: movie.overview,
            rating: 0, // Default rating
            notes: '',
            mediaType: 'movie',
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Format a TV show object for use in the app
     * @param {Object} tvShow - TV show data from TMDB
     * @returns {Object} - Formatted TV show data
     */
    formatTVData(tvShow) {
        return {
            id: `tmdb-tv-${tvShow.id}`,
            tmdbId: tvShow.id,
            title: tvShow.name,
            type: 'TV Show',
            posterPath: tvShow.poster_path,
            posterUrl: this.getPosterUrl(tvShow.poster_path),
            releaseDate: tvShow.first_air_date,
            overview: tvShow.overview,
            rating: 0, // Default rating
            notes: '',
            mediaType: 'tv',
            createdAt: new Date().toISOString()
        };
    }
}

// Create and export a single instance of the service
const tmdbApi = new TMDBApiService();
export default tmdbApi;
