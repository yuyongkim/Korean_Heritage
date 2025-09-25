/**
 * 환경별 설정 파일
 * 프로덕션 환경에서는 이 파일을 사용하여 API 키를 관리
 */

// 환경별 설정
const ENV_CONFIG = {
    development: {
        KAKAO_MAP_API_KEY: 'f3b94f450409b9b743b3932047bdbe4b', // 개발용 키
        DEBUG_MODE: true,
        API_BASE_URL: 'http://localhost:3000'
    },
    production: {
        KAKAO_MAP_API_KEY: '', // 프로덕션에서는 환경변수에서 가져옴
        DEBUG_MODE: false,
        API_BASE_URL: 'https://your-production-domain.com'
    },
    staging: {
        KAKAO_MAP_API_KEY: '', // 스테이징에서는 환경변수에서 가져옴
        DEBUG_MODE: false,
        API_BASE_URL: 'https://staging.your-domain.com'
    }
};

// 현재 환경 감지
function getCurrentEnvironment() {
    // 1. 환경변수에서 확인
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
        return process.env.NODE_ENV;
    }
    
    // 2. 호스트명으로 판단
    if (typeof window !== 'undefined' && window.location) {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        } else if (hostname.includes('staging')) {
            return 'staging';
        } else {
            return 'production';
        }
    }
    
    // 3. 기본값
    return 'development';
}

// 현재 환경 설정 가져오기
const currentEnv = getCurrentEnvironment();
const config = ENV_CONFIG[currentEnv] || ENV_CONFIG.development;

// 환경변수에서 API 키 가져오기 (프로덕션 환경)
function getApiKeyFromEnv() {
    if (typeof process !== 'undefined' && process.env) {
        return process.env.KAKAO_MAP_API_KEY || config.KAKAO_MAP_API_KEY;
    }
    return config.KAKAO_MAP_API_KEY;
}

// 최종 API 키 설정
const KAKAO_MAP_API_KEY = getApiKeyFromEnv();

// 설정 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        KAKAO_MAP_API_KEY,
        DEBUG_MODE: config.DEBUG_MODE,
        API_BASE_URL: config.API_BASE_URL,
        currentEnv
    };
} else {
    // 브라우저 환경에서 전역 변수로 설정
    window.APP_CONFIG = {
        KAKAO_MAP_API_KEY,
        DEBUG_MODE: config.DEBUG_MODE,
        API_BASE_URL: config.API_BASE_URL,
        currentEnv
    };
}