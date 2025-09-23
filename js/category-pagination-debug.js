/**
 * 카테고리 페이지네이션 디버깅 및 문제점 분석
 */

class CategoryPaginationDebugger {
    constructor() {
        this.debugLog = [];
        this.testResults = [];
    }

    /**
     * 보물 카테고리 페이지네이션 문제 분석
     */
    async analyzeTreasureCategoryPagination() {
        console.log('🔍 보물 카테고리 페이지네이션 문제 분석 시작');
        
        // 1. 현재 상태 분석
        this.analyzeCurrentState();
        
        // 2. 시나리오 시뮬레이션
        await this.simulateTreasureCategoryScenario();
        
        // 3. 문제점 식별
        this.identifyProblems();
        
        // 4. 해결책 제안
        this.suggestSolutions();
        
        return this.testResults;
    }

    /**
     * 현재 상태 분석
     */
    analyzeCurrentState() {
        console.log('📊 현재 상태 분석');
        
        const currentHash = window.location.hash.slice(1);
        const currentCategoryPage = window.currentCategoryPage || 1;
        const currentCategoryName = window.currentCategoryName || '';
        
        this.logDebug('현재 상태', {
            hash: currentHash,
            categoryPage: currentCategoryPage,
            categoryName: currentCategoryName,
            routerNavigating: window.router?.isNavigating || false,
            isLoading: window.isLoading || false
        });
        
        // URL 파싱 테스트
        this.testUrlParsing();
    }

    /**
     * URL 파싱 테스트
     */
    testUrlParsing() {
        console.log('🔗 URL 파싱 테스트');
        
        const testUrls = [
            'category/보물',
            'category/보물/page/2',
            'category/보물/page/3',
            'category/보물/page/4',
            'category/보물/page/5'
        ];
        
        testUrls.forEach(url => {
            const parsed = this.parseCategoryUrl(url);
            this.logDebug(`URL 파싱: ${url}`, parsed);
        });
    }

    /**
     * URL 파싱 함수
     */
    parseCategoryUrl(url) {
        if (url.includes('/page/')) {
            const parts = url.split('/');
            return {
                category: parts[1],
                page: parseInt(parts[3]),
                hasPage: true
            };
        } else {
            const parts = url.split('/');
            return {
                category: parts[1],
                page: 1,
                hasPage: false
            };
        }
    }

    /**
     * 보물 카테고리 시나리오 시뮬레이션
     */
    async simulateTreasureCategoryScenario() {
        console.log('🎭 보물 카테고리 시나리오 시뮬레이션');
        
        try {
            // 1단계: 보물 카테고리로 이동
            this.logDebug('1단계', '보물 카테고리로 이동');
            window.location.hash = 'category/보물';
            await this.waitForRoute();
            
            // 2단계: 2페이지로 이동
            this.logDebug('2단계', '2페이지로 이동');
            if (typeof window.changeCategoryPage === 'function') {
                window.changeCategoryPage(2);
                await this.waitForRoute();
            } else {
                this.logDebug('2단계', 'changeCategoryPage 함수 없음', 'error');
            }
            
            // 3단계: 3페이지로 이동
            this.logDebug('3단계', '3페이지로 이동');
            if (typeof window.changeCategoryPage === 'function') {
                window.changeCategoryPage(3);
                await this.waitForRoute();
            }
            
            // 4단계: 4페이지로 이동
            this.logDebug('4단계', '4페이지로 이동');
            if (typeof window.changeCategoryPage === 'function') {
                window.changeCategoryPage(4);
                await this.waitForRoute();
            }
            
            // 5단계: 5페이지로 이동
            this.logDebug('5단계', '5페이지로 이동');
            if (typeof window.changeCategoryPage === 'function') {
                window.changeCategoryPage(5);
                await this.waitForRoute();
            }
            
        } catch (error) {
            this.logDebug('시뮬레이션 오류', error.message, 'error');
        }
    }

    /**
     * 문제점 식별
     */
    identifyProblems() {
        console.log('🚨 문제점 식별');
        
        // 문제 1: 라우터에서 페이지 파라미터 미처리
        this.logDebug('문제 1', '라우터에서 카테고리 페이지 파라미터를 처리하지 않음', 'error');
        
        // 문제 2: changeCategoryPage에서 window.location.hash 직접 변경
        this.logDebug('문제 2', 'changeCategoryPage에서 window.location.hash 직접 변경으로 인한 라우터 충돌', 'error');
        
        // 문제 3: URL 파싱 불일치
        this.logDebug('문제 3', 'URL 파싱과 실제 페이지 상태 불일치', 'warning');
        
        // 문제 4: 라우터 히스토리 관리 문제
        this.logDebug('문제 4', '라우터 히스토리에서 카테고리 페이지 상태 관리 부족', 'warning');
    }

    /**
     * 해결책 제안
     */
    suggestSolutions() {
        console.log('💡 해결책 제안');
        
        this.logDebug('해결책 1', '라우터에서 카테고리 페이지 파라미터 처리 추가', 'info');
        this.logDebug('해결책 2', 'changeCategoryPage에서 router.navigate() 사용', 'info');
        this.logDebug('해결책 3', 'URL 파싱 로직 개선', 'info');
        this.logDebug('해결책 4', '라우터 히스토리 관리 개선', 'info');
    }

    /**
     * 라우트 처리 대기
     */
    async waitForRoute() {
        return new Promise(resolve => {
            setTimeout(resolve, 500);
        });
    }

    /**
     * 디버그 로깅
     */
    logDebug(step, message, type = 'info') {
        const logEntry = {
            step,
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        this.debugLog.push(logEntry);
        this.testResults.push(logEntry);
        
        const emoji = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'info' ? 'ℹ️' : '✅';
        console.log(`${emoji} [${step}] ${message}`);
    }

    /**
     * 결과 반환
     */
    getResults() {
        return this.testResults;
    }
}

// 전역 디버깅 함수
window.debugTreasureCategoryPagination = function() {
    const debugger = new CategoryPaginationDebugger();
    return debugger.analyzeTreasureCategoryPagination();
};

// 자동 실행 (개발 모드)
if (window.location.search.includes('debug=true')) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            window.debugTreasureCategoryPagination();
        }, 2000);
    });
}