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
        const hash = window.location.hash.slice(1) || 'home';
        const { route, params } = this.parseHash();
        
        // 🚀 중복 네비게이션 방지
        if (this.isNavigating) {
            console.log('⏳ 이미 네비게이션 진행 중, 무시');
            return;
        }

        // 🚀 동일한 라우트로의 이동 체크 (파라미터 포함)
        const newRouteKey = hash;
        if (this.currentRoute === newRouteKey) {
            console.log('🔄 동일한 라우트, 무시:', newRouteKey);
            return;
        }

        this.isNavigating = true;
        this.currentRoute = newRouteKey;

        try {
            console.log(`🎯 라우트 실행: ${route}`, params);
            
            if (this.routes[route]) {
                this.routes[route](params);
            } else {
                console.warn(`❌ 알 수 없는 라우트: ${route}`);
                this.navigate('home');
            }
        } catch (error) {
            console.error('❌ 라우팅 에러:', error);
            this.navigate('home');
        } finally {
            this.isNavigating = false;
        }
    }

    /**
     * 🚀 해시 파싱 (파라미터 및 쿼리 파라미터 지원)
     */
    parseHash() {
        const hash = window.location.hash.slice(1) || 'home';
        const [route, ...paramParts] = hash.split('/');
        
        // 🚀 파라미터 파싱 개선
        const params = {};
        const paramString = paramParts.join('/');
        
        // URL 파라미터 파싱 (예: category/국보/page/2)
        if (paramString) {
            const parts = paramString.split('/');
            for (let i = 0; i < parts.length; i += 2) {
                if (parts[i] && parts[i + 1] !== undefined) {
                    params[parts[i]] = decodeURIComponent(parts[i + 1]);
                }
            }
        }

        // 🚀 쿼리 파라미터도 파싱 (예: #home?page=2&category=국보)
        const queryStart = hash.indexOf('?');
        if (queryStart !== -1) {
            const queryString = hash.slice(queryStart + 1);
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
    navigate(path) {
        // 🚀 중복 네비게이션 방지
        if (this.isNavigating) {
            console.log('⏳ 이미 네비게이션 진행 중, 무시');
            return;
        }

        // 🚀 동일한 라우트로의 이동 체크
        const currentHash = window.location.hash.slice(1) || 'home';
        if (currentHash === path) {
            console.log('🔄 동일한 경로, 무시:', path);
            return;
        }
        
        console.log(`🛣️ 라우터 네비게이션: ${currentHash} -> ${path}`);
        
        // 해시 변경으로 라우팅 트리거
        window.location.hash = path;
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
router.addRoute('home', () => {
    router.showView('home-view');
    if (typeof updateDashboard === 'function') {
        updateDashboard();
    }
});

router.addRoute('list', () => {
    router.showView('list-view');
    if (typeof loadHeritageList === 'function') {
        loadHeritageList();
    }
});

router.addRoute('detail', async (params) => {
    router.showView('detail-view');
    if (params[0] && typeof loadHeritageDetail === 'function') {
        await loadHeritageDetail(decodeURIComponent(params[0]));
    }
});

router.addRoute('category', (params) => {
    console.log('카테고리 라우트 실행:', params);
    router.showView('category-view');
    
    // 🚀 개선된 파라미터 처리
    const categoryName = params.category || params[0];
    const page = params.page || params[1];
    
    if (categoryName && typeof loadCategoryView === 'function') {
        const decodedCategory = decodeURIComponent(categoryName);
        console.log('카테고리 로드:', decodedCategory);
        
        // 카테고리 로드
        loadCategoryView(decodedCategory);
        
        // 페이지 번호가 있는 경우 처리
        if (page) {
            const pageNum = parseInt(page);
            if (pageNum && pageNum > 0) {
                setTimeout(() => {
                    if (typeof changeCategoryPage === 'function') {
                        changeCategoryPage(pageNum);
                    }
                }, 100);
            }
        }
    } else {
        console.error('카테고리 파라미터가 없거나 loadCategoryView 함수가 없습니다');
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