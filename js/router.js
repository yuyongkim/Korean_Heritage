/**
 * SPA 라우터 - URL 해시 기반 페이지 라우팅
 */
class Router {
    constructor() {
        this.routes = {};
        this.currentView = null;
        this.currentRoute = null;
        this.isNavigating = false;
        
        // 브라우저 뒤로가기/앞으로가기 이벤트 처리
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
        
        // 네비게이션 링크 클릭 이벤트 처리
        this.setupNavigation();
    }
    
    /**
     * 라우트 등록
     */
    addRoute(pattern, handler) {
        this.routes[pattern] = handler;
    }
    
    /**
     * 🚀 최적화된 라우팅 처리 (파라미터 파싱 개선)
     */
    handleRoute() {
        // 🚀 parseHash로 라우트와 파라미터 추출
        const { route, params } = this.parseHash();
        
        console.log(`🎯 라우트 실행: ${route}`, params); // 이 로그가 중요!
        
        // 🚀 라우트 존재 확인
        if (this.routes[route]) {
            try {
                // ✅ 파라미터를 확실히 전달
                this.routes[route](params);
                console.log(`✅ ${route} 라우트 실행 완료`);
            } catch (error) {
                console.error(`❌ ${route} 라우트 실행 에러:`, error);
                // 에러 시 홈으로 리다이렉트
                if (route !== 'home') {
                    this.navigate('home');
                }
            }
        } else {
            console.warn(`❌ 알 수 없는 라우트: ${route}`);
            this.navigate('home');
        }
    }

    /**
     * 🚀 해시 파싱 (파라미터 및 쿼리 파라미터 지원)
     */
    parseHash() {
        const hash = window.location.hash.slice(1) || 'home';
        console.log('🔍 원본 해시:', hash);
        
        // 🚀 URL 디코딩 먼저 수행 (한글 처리)
        const decodedHash = decodeURIComponent(hash);
        console.log('🔍 디코딩된 해시:', decodedHash);
        
        const [route, ...paramParts] = decodedHash.split('/');
        
        // 🚀 파라미터 파싱 개선
        const params = {};
        
        // URL 파라미터 파싱 (예: category/국보, list/page/2)
        if (paramParts.length > 0) {
            // 🎯 카테고리 라우트 특별 처리
            if (route === 'category' && paramParts[0]) {
                params.category = paramParts[0];
                console.log('📂 카테고리 파라미터:', params.category);
            }
            // 🎯 리스트 라우트 처리 (list/page/2)
            else if (route === 'list') {
                for (let i = 0; i < paramParts.length; i += 2) {
                    if (paramParts[i] && paramParts[i + 1] !== undefined) {
                        params[paramParts[i]] = paramParts[i + 1];
                    }
                }
            }
            // 🎯 기타 라우트 일반 처리
            else {
                for (let i = 0; i < paramParts.length; i += 2) {
                    if (paramParts[i] && paramParts[i + 1] !== undefined) {
                        params[paramParts[i]] = paramParts[i + 1];
                    }
                }
            }
        }

        // 🚀 쿼리 파라미터도 파싱 (예: #home?page=2&category=국보)
        const queryStart = decodedHash.indexOf('?');
        if (queryStart !== -1) {
            const queryString = decodedHash.slice(queryStart + 1);
            const urlParams = new URLSearchParams(queryString);
            
            for (const [key, value] of urlParams) {
                params[key] = decodeURIComponent(value);
            }
        }

        console.log(`🛣️ 라우팅 파싱: ${route}`, params);
        return { route, params };
    }
    
    /**
     * 라우트에서 뷰 ID 추출
     */
    getViewIdFromRoute(route) {
        const routeToViewMap = {
            'home': 'home-view',
            'list': 'list-view',
            'detail': 'detail-view',
            'category': 'category-view',
            'search': 'list-view',
            'english': 'english-view'
        };
        return routeToViewMap[route] || 'home-view';
    }
    
    /**
     * 🚀 최적화된 프로그래매틱 네비게이션
     */
    navigate(hash) {
        if (this.isNavigating) {
            console.log('⏳ 이미 네비게이션 진행 중, 무시');
            return;
        }

        // 🚀 현재 해시와 비교 (정확한 비교)
        const currentHash = window.location.hash.slice(1);
        const newHash = hash.startsWith('#') ? hash.slice(1) : hash;
        
        if (currentHash === newHash) {
            console.log('🔄 동일한 라우트, 무시:', newHash);
            return;
        }

        console.log(`🛣️ 라우터 네비게이션: ${currentHash} -> ${newHash}`);
        
        this.isNavigating = true;
        
        try {
            // URL 업데이트
            window.location.hash = newHash;
            
            // 🚀 즉시 라우팅 처리 (hashchange 이벤트 기다리지 않음)
            this.handleRoute();
            
        } catch (error) {
            console.error('❌ 네비게이션 에러:', error);
            if (newHash !== 'home') {
                this.navigate('home');
            }
        } finally {
            setTimeout(() => {
                this.isNavigating = false;
            }, 100);
        }
    }
    
    /**
     * 모든 뷰 숨기기
     */
    hideAllViews() {
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });
    }
    
    /**
     * 특정 뷰 보이기
     */
    showView(viewId) {
        console.log('뷰 전환:', this.currentView, '->', viewId);
        this.hideAllViews();
        const view = document.getElementById(viewId);
        if (view) {
            view.style.display = 'block';
            view.classList.add('fade-in');
            this.currentView = viewId;
            console.log('뷰 표시 완료:', viewId);
        } else {
            console.error('뷰를 찾을 수 없음:', viewId);
        }
    }
    
    /**
     * 로딩 스피너 표시/숨기기
     */
    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }
    
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
    
    /**
     * 네비게이션 링크 설정
     */
    setupNavigation() {
        // 모든 해시 링크에 이벤트 리스너 추가
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const hash = link.getAttribute('href');
                this.navigate(hash.slice(1));
            }
        });
    }
    
    /**
     * 네비게이션 활성 상태 업데이트
     */
    updateNavigation(currentRoute) {
        // 모든 네비게이션 링크에서 active 클래스 제거
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // 현재 라우트와 일치하는 링크에 active 클래스 추가
        const activeLink = document.querySelector(`a[href="#${currentRoute}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    /**
     * 알 수 없는 라우트 처리
     */
    showRouteNotFound(route) {
        console.warn('알 수 없는 라우트:', route);
        // 홈으로 리다이렉트하지 않고 404 페이지 표시
        this.showView('home-view');
        this.showNotFoundMessage(route);
    }
    
    /**
     * 라우트 에러 처리
     */
    showRouteError(error) {
        console.error('라우트 처리 중 오류:', error);
        // 홈으로 리다이렉트하지 않고 에러 페이지 표시
        this.showView('home-view');
        this.showErrorMessage(error);
    }
    
    /**
     * 404 메시지 표시
     */
    showNotFoundMessage(route) {
        // 기존 알림 제거
        const existingAlert = document.querySelector('.route-not-found-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        // 새 알림 생성
        const alert = document.createElement('div');
        alert.className = 'route-not-found-alert alert alert-warning alert-dismissible fade show';
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
        `;
        alert.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>페이지를 찾을 수 없습니다</strong><br>
            <small>요청하신 경로 "${route}"를 찾을 수 없습니다.</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
    
    /**
     * 에러 메시지 표시
     */
    showErrorMessage(message) {
        // 기존 알림 제거
        const existingAlert = document.querySelector('.route-error-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        // 새 알림 생성
        const alert = document.createElement('div');
        alert.className = 'route-error-alert alert alert-danger alert-dismissible fade show';
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        alert.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            <strong>오류 발생</strong><br>
            <small>${message}</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
    
    /**
     * 🔥 추가 디버깅용 함수 (임시로 router.js에 추가)
     */
    debugRouteExecution() {
        const { route, params } = this.parseHash();
        console.log('🔍 라우트 디버그:');
        console.log('  - 파싱된 라우트:', route);
        console.log('  - 파싱된 파라미터:', params);
        console.log('  - 사용 가능한 라우트:', Object.keys(this.routes));
        console.log('  - 해당 라우트 함수:', typeof this.routes[route]);
        
        // 수동으로 라우트 실행 테스트
        if (this.routes[route]) {
            console.log('🧪 수동 라우트 실행 테스트...');
            this.routes[route](params);
        }
    }
}

// 전역 라우터 인스턴스
const router = new Router();

// 뒤로가기 함수
function goBack() {
    console.log('뒤로가기 요청, 현재 히스토리:', router.history);
    
    // 라우터 히스토리 사용
    if (router.history.length > 1) {
        // 현재 경로를 히스토리에서 제거
        router.history.pop();
        // 이전 경로로 이동
        const previousPath = router.history[router.history.length - 1];
        console.log('이전 경로로 이동:', previousPath);
        
        if (previousPath && previousPath !== '') {
            // navigate 함수를 직접 호출하지 않고 해시를 직접 변경
            window.location.hash = previousPath;
        } else {
            // 이전 경로가 없거나 비어있으면 홈으로
            window.location.hash = 'home';
        }
    } else {
        // 히스토리가 없으면 홈으로
        console.log('히스토리 없음, 홈으로 이동');
        window.location.hash = 'home';
    }
}

// 라우트 등록
router.addRoute('home', (params) => {
    console.log('🏠 홈 라우트 실행');
    router.showView('home-view');
    if (window.loadHomeView) {
        window.loadHomeView();
    } else if (typeof updateDashboard === 'function') {
        updateDashboard();
    }
});

router.addRoute('list', (params) => {
    console.log('📋 리스트 라우트 실행:', params);
    router.showView('list-view');
    
    // 🚀 페이지 파라미터 처리
    const page = parseInt(params.page) || 1;
    console.log('📄 요청된 페이지:', page);
    
    if (typeof window.loadListView === 'function') {
        window.loadListView(page, params);
    } else if (typeof loadHeritageList === 'function') {
        loadHeritageList();
    } else {
        console.error('❌ loadListView 함수를 찾을 수 없습니다');
    }
});

router.addRoute('detail', async (params) => {
    router.showView('detail-view');
    if (params[0] && typeof loadHeritageDetail === 'function') {
        await loadHeritageDetail(decodeURIComponent(params[0]));
    }
});

router.addRoute('category', (params) => {
    console.log('📂 카테고리 라우트 실행:', params);
    router.showView('category-view');
    
    // 🚀 카테고리 파라미터 검증 및 처리
    if (params.category) {
        console.log('✅ 카테고리 파라미터 확인:', params.category);
        
        // loadCategoryView 함수 존재 확인
        if (typeof window.loadCategoryView === 'function') {
            window.loadCategoryView(params.category);
        } else if (typeof loadCategoryView === 'function') {
            loadCategoryView(params.category);
        } else {
            console.error('❌ loadCategoryView 함수를 찾을 수 없습니다');
            // 🚀 대체 로직: 직접 카테고리 필터링 호출
            if (window.dataManager && window.dataManager.filterByCategory) {
                window.dataManager.filterByCategory(params.category);
                console.log('🔄 dataManager로 카테고리 필터링 실행');
            }
        }
    } else {
        console.warn('⚠️ 카테고리 파라미터가 없습니다, 전체 카테고리 표시');
        // 전체 카테고리 목록 표시
        if (typeof window.loadAllCategories === 'function') {
            window.loadAllCategories();
        }
    }
});

router.addRoute('search', (params) => {
    router.showView('list-view');
    if (params[0] && typeof performSearch === 'function') {
        const query = decodeURIComponent(params[0]);
        // URL에서 검색 옵션 추출
        const urlParams = new URLSearchParams(window.location.search);
        const searchOption = urlParams.get('option') || 'title+description';
        performSearch(query, searchOption);
    }
});

router.addRoute('english', () => {
    router.showView('english-view');
    if (typeof loadEnglishView === 'function') {
        loadEnglishView();
    }
});

router.addRoute('unclassified', (params) => {
    router.showView('unclassified-view');
    if (params[0] && typeof loadUnclassifiedView === 'function') {
        loadUnclassifiedView(params[0]);
    } else if (typeof loadUnclassifiedView === 'function') {
        loadUnclassifiedView('all');
    }
});