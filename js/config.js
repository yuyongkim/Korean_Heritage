/**
 * Application Configuration
 * Centralized configuration for the heritage application
 */

// Debug mode configuration
const DEBUG_MODE = false; // Set to true for development debugging

// API Keys - 보안을 위해 환경변수 또는 별도 설정 파일 사용 권장
const KAKAO_MAP_API_KEY = (() => {
    // 1. 환경변수에서 먼저 시도 (서버 환경)
    if (typeof process !== 'undefined' && process.env && process.env.KAKAO_MAP_API_KEY) {
        return process.env.KAKAO_MAP_API_KEY;
    }
    
    // 2. window 객체에서 확인 (브라우저 환경)
    if (typeof window !== 'undefined' && window.KAKAO_MAP_API_KEY) {
        return window.KAKAO_MAP_API_KEY;
    }
    
    // 3. 로컬 스토리지에서 확인 (개발 환경)
    if (typeof localStorage !== 'undefined' && localStorage.getItem('KAKAO_MAP_API_KEY')) {
        return localStorage.getItem('KAKAO_MAP_API_KEY');
    }
    
    // 4. 기본값 (개발용 - 프로덕션에서는 제거 필요)
    return 'f3b94f450409b9b743b3932047bdbe4b';
})();

// API 키 유효성 검증
function validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
        return false;
    }
    
    // 카카오 API 키 형식 검증 (32자리 영숫자)
    const kakaoApiKeyPattern = /^[a-f0-9]{32}$/i;
    return kakaoApiKeyPattern.test(apiKey);
}

// API 키 상태 확인
const API_KEY_STATUS = {
    isValid: validateApiKey(KAKAO_MAP_API_KEY),
    source: (() => {
        if (typeof process !== 'undefined' && process.env && process.env.KAKAO_MAP_API_KEY) return 'environment';
        if (typeof window !== 'undefined' && window.KAKAO_MAP_API_KEY) return 'window';
        if (typeof localStorage !== 'undefined' && localStorage.getItem('KAKAO_MAP_API_KEY')) return 'localStorage';
        return 'default';
    })()
};

// API 키 검증 및 오류 처리
function checkApiKeyStatus() {
    if (!API_KEY_STATUS.isValid) {
        console.error('❌ 카카오 지도 API 키가 유효하지 않습니다:', {
            key: KAKAO_MAP_API_KEY ? `${KAKAO_MAP_API_KEY.substring(0, 8)}...` : 'undefined',
            source: API_KEY_STATUS.source,
            isValid: API_KEY_STATUS.isValid
        });
        
        // 개발 환경에서만 경고 표시
        if (DEBUG_MODE) {
            alert('⚠️ 카카오 지도 API 키를 확인해주세요.\n개발자 도구 콘솔을 확인하세요.');
        }
        
        return false;
    }
    
    console.log('✅ 카카오 지도 API 키가 유효합니다:', {
        source: API_KEY_STATUS.source,
        keyPrefix: KAKAO_MAP_API_KEY.substring(0, 8) + '...'
    });
    
    return true;
}

// API 키 상태 초기 검증
checkApiKeyStatus();

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