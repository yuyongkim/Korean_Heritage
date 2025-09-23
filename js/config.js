/**
 * Application Configuration
 * Centralized configuration for the heritage application
 */

// Debug mode configuration
const DEBUG_MODE = false; // Set to true for development debugging

// API Keys
const KAKAO_MAP_API_KEY = 'YOUR_KAKAO_MAP_API_KEY'; // 카카오 맵 API 키를 여기에 설정하세요

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