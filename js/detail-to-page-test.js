/**
 * 상세페이지 → 2페이지 테스트 및 문제점 분석
 */

class DetailToPageTest {
    constructor() {
        this.testResults = [];
        this.originalFunctions = {};
    }

    /**
     * 테스트 시나리오 실행
     */
    async runTestScenario() {
        console.log('🧪 상세페이지 → 2페이지 테스트 시작');
        
        // 1. 현재 상태 백업
        this.backupCurrentState();
        
        // 2. 시나리오 실행
        await this.simulateDetailToPage2();
        
        // 3. 문제점 분석
        this.analyzeProblems();
        
        // 4. 해결책 제안
        this.suggestSolutions();
        
        return this.testResults;
    }

    /**
     * 현재 상태 백업
     */
    backupCurrentState() {
        this.originalFunctions = {
            goBack: window.goBack,
            changePage: window.changePage,
            routerNavigate: window.router?.navigate,
            currentPage: window.currentPage,
            currentHash: window.location.hash
        };
        
        console.log('📦 현재 상태 백업 완료');
    }

    /**
     * 상세페이지 → 2페이지 시뮬레이션
     */
    async simulateDetailToPage2() {
        console.log('🎭 시나리오 시뮬레이션 시작');
        
        // 시나리오 1: 홈 → 상세페이지 → 뒤로가기 → 2페이지
        await this.scenario1_HomeToDetailToBackToPage2();
        
        // 시나리오 2: 1페이지 → 상세페이지 → 뒤로가기 → 2페이지
        await this.scenario2_Page1ToDetailToBackToPage2();
        
        // 시나리오 3: 카테고리 → 상세페이지 → 뒤로가기 → 2페이지
        await this.scenario3_CategoryToDetailToBackToPage2();
    }

    /**
     * 시나리오 1: 홈 → 상세페이지 → 뒤로가기 → 2페이지
     */
    async scenario1_HomeToDetailToBackToPage2() {
        console.log('📋 시나리오 1: 홈 → 상세페이지 → 뒤로가기 → 2페이지');
        
        try {
            // 1단계: 홈페이지 설정
            window.location.hash = 'home';
            await this.waitForRoute();
            this.logStep('홈페이지 설정', 'success');
            
            // 2단계: 상세페이지로 이동
            window.location.hash = 'detail/테스트문화재';
            await this.waitForRoute();
            this.logStep('상세페이지 이동', 'success');
            
            // 3단계: 뒤로가기
            if (typeof window.goBack === 'function') {
                window.goBack();
                await this.waitForRoute();
                this.logStep('뒤로가기 실행', 'success');
            } else {
                this.logStep('goBack 함수 없음', 'error');
            }
            
            // 4단계: 2페이지로 이동
            if (typeof window.changePage === 'function') {
                window.changePage(2);
                await this.waitForRoute();
                this.logStep('2페이지 이동', 'success');
            } else {
                this.logStep('changePage 함수 없음', 'error');
            }
            
        } catch (error) {
            this.logStep(`시나리오 1 오류: ${error.message}`, 'error');
        }
    }

    /**
     * 시나리오 2: 1페이지 → 상세페이지 → 뒤로가기 → 2페이지
     */
    async scenario2_Page1ToDetailToBackToPage2() {
        console.log('📋 시나리오 2: 1페이지 → 상세페이지 → 뒤로가기 → 2페이지');
        
        try {
            // 1단계: 1페이지 설정
            window.location.hash = 'home?page=1';
            await this.waitForRoute();
            this.logStep('1페이지 설정', 'success');
            
            // 2단계: 상세페이지로 이동
            window.location.hash = 'detail/테스트문화재2';
            await this.waitForRoute();
            this.logStep('상세페이지 이동', 'success');
            
            // 3단계: 뒤로가기
            if (typeof window.goBack === 'function') {
                window.goBack();
                await this.waitForRoute();
                this.logStep('뒤로가기 실행', 'success');
            }
            
            // 4단계: 2페이지로 이동
            if (typeof window.changePage === 'function') {
                window.changePage(2);
                await this.waitForRoute();
                this.logStep('2페이지 이동', 'success');
            }
            
        } catch (error) {
            this.logStep(`시나리오 2 오류: ${error.message}`, 'error');
        }
    }

    /**
     * 시나리오 3: 카테고리 → 상세페이지 → 뒤로가기 → 2페이지
     */
    async scenario3_CategoryToDetailToBackToPage2() {
        console.log('📋 시나리오 3: 카테고리 → 상세페이지 → 뒤로가기 → 2페이지');
        
        try {
            // 1단계: 카테고리 페이지 설정
            window.location.hash = 'category/국보';
            await this.waitForRoute();
            this.logStep('카테고리 페이지 설정', 'success');
            
            // 2단계: 상세페이지로 이동
            window.location.hash = 'detail/국보테스트';
            await this.waitForRoute();
            this.logStep('상세페이지 이동', 'success');
            
            // 3단계: 뒤로가기
            if (typeof window.goBack === 'function') {
                window.goBack();
                await this.waitForRoute();
                this.logStep('뒤로가기 실행', 'success');
            }
            
            // 4단계: 2페이지로 이동
            if (typeof window.changePage === 'function') {
                window.changePage(2);
                await this.waitForRoute();
                this.logStep('2페이지 이동', 'success');
            }
            
        } catch (error) {
            this.logStep(`시나리오 3 오류: ${error.message}`, 'error');
        }
    }

    /**
     * 문제점 분석
     */
    analyzeProblems() {
        console.log('🔍 문제점 분석 시작');
        
        // 문제 1: goBack 함수의 무한 루프 가능성
        this.analyzeGoBackInfiniteLoop();
        
        // 문제 2: URL 상태 불일치
        this.analyzeUrlStateMismatch();
        
        // 문제 3: 페이지네이션 상태 초기화
        this.analyzePaginationStateReset();
        
        // 문제 4: 라우터 충돌
        this.analyzeRouterConflict();
    }

    /**
     * goBack 함수 무한 루프 분석
     */
    analyzeGoBackInfiniteLoop() {
        console.log('🔄 goBack 무한 루프 분석');
        
        const goBackCode = `
        function goBack() {
            if (router.history.length > 1) {
                router.history.pop();
                const previousPath = router.history[router.history.length - 1];
                if (previousPath && previousPath !== '') {
                    window.location.hash = previousPath; // ⚠️ 문제: hashchange 이벤트 발생
                }
            }
        }
        `;
        
        this.logStep('goBack 함수에서 window.location.hash 직접 변경으로 인한 hashchange 이벤트 발생', 'warning');
        this.logStep('hashchange 이벤트가 라우터를 다시 트리거하여 무한 루프 가능성', 'error');
    }

    /**
     * URL 상태 불일치 분석
     */
    analyzeUrlStateMismatch() {
        console.log('🔗 URL 상태 불일치 분석');
        
        this.logStep('상세페이지에서 뒤로가기 시 이전 페이지 상태가 정확히 복원되지 않을 수 있음', 'warning');
        this.logStep('createPageUrl 함수가 현재 컨텍스트를 정확히 파악하지 못할 수 있음', 'warning');
    }

    /**
     * 페이지네이션 상태 초기화 분석
     */
    analyzePaginationStateReset() {
        console.log('📄 페이지네이션 상태 초기화 분석');
        
        this.logStep('상세페이지에서 뒤로가기 시 currentPage 변수가 올바르게 설정되지 않을 수 있음', 'warning');
        this.logStep('페이지네이션 캐시가 초기화되어 성능 저하 가능성', 'warning');
    }

    /**
     * 라우터 충돌 분석
     */
    analyzeRouterConflict() {
        console.log('🚦 라우터 충돌 분석');
        
        this.logStep('goBack → hashchange → router.handleRoute → loadDetailView 순환 가능성', 'error');
        this.logStep('라우터 상태와 실제 페이지 상태 불일치', 'warning');
    }

    /**
     * 해결책 제안
     */
    suggestSolutions() {
        console.log('💡 해결책 제안');
        
        this.logStep('1. goBack 함수 개선: router.navigate() 사용', 'info');
        this.logStep('2. 페이지 상태 관리 개선: 상태 저장/복원 메커니즘', 'info');
        this.logStep('3. 라우터 충돌 방지: 플래그 기반 중복 실행 방지', 'info');
        this.logStep('4. URL 파싱 개선: 더 정확한 컨텍스트 파악', 'info');
    }

    /**
     * 라우트 처리 대기
     */
    async waitForRoute() {
        return new Promise(resolve => {
            setTimeout(resolve, 100); // 100ms 대기
        });
    }

    /**
     * 단계 로깅
     */
    logStep(message, type = 'info') {
        const result = {
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        this.testResults.push(result);
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    /**
     * 결과 반환
     */
    getResults() {
        return this.testResults;
    }
}

// 전역 테스트 함수
window.testDetailToPage2 = function() {
    const tester = new DetailToPageTest();
    return tester.runTestScenario();
};

// 자동 실행 (개발 모드)
if (window.location.search.includes('autotest=true')) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            window.testDetailToPage2();
        }, 2000);
    });
}