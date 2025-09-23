/**
 * SPA 라우터 - URL 해시 기반 페이지 라우팅
 */
class Router {
    constructor() {
        this.routes = {};
        this.currentView = null;
        
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
     * 현재 URL 해시를 기반으로 라우팅 처리
     */
    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const [route, ...params] = hash.split('/');
        
        // 현재 뷰 숨기기
        this.hideAllViews();
        
        // 로딩 표시
        this.showLoading();
        
        // 라우트 처리
        setTimeout(() => {
            try {
                if (this.routes[route]) {
                    this.routes[route](params);
                } else {
                    // 알 수 없는 라우트에 대한 처리
                    console.warn('알 수 없는 라우트:', route);
                    this.showRouteNotFound(route);
                }
                this.updateNavigation(route);
            } catch (error) {
                console.error('라우팅 오류:', error);
                this.showRouteError(error);
            }
            
            this.hideLoading();
        }, 100);
    }
    
    /**
     * 프로그래매틱 네비게이션
     */
    navigate(path) {
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
        this.hideAllViews();
        const view = document.getElementById(viewId);
        if (view) {
            view.style.display = 'block';
            view.classList.add('fade-in');
            this.currentView = viewId;
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
    showErrorMessage(error) {
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
        `;
        alert.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            <strong>페이지 로딩 오류</strong><br>
            <small>페이지를 불러오는 중 오류가 발생했습니다.</small>
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
    if (window.history.length > 1) {
        window.history.back();
    } else {
        router.navigate('home');
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

router.addRoute('detail', (params) => {
    router.showView('detail-view');
    if (params[0] && typeof loadHeritageDetail === 'function') {
        loadHeritageDetail(decodeURIComponent(params[0]));
    }
});

router.addRoute('category', (params) => {
    router.showView('category-view');
    if (params[0] && typeof loadCategoryView === 'function') {
        loadCategoryView(decodeURIComponent(params[0]));
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