/**
 * Application Configuration
 * Centralized configuration for the heritage application
 */

// Debug mode configuration
const DEBUG_MODE = false; // Set to true for development debugging

// API Keys
const KAKAO_MAP_API_KEY = 'f3b94f450409b9b743b3932047bdbe4b'; // 카카오 맵 API 키

/**
 * Debug logging function
 * Only logs when DEBUG_MODE is enabled
 */
function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEBUG_MODE, debugLog };
}