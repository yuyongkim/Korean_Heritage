/**
 * SPA 라우터 - URL 해시 기반 페이지 라우팅
 */
class Router {
    constructor() {
        this.routes = {};
        this.currentView = null;
        this.history = []; // 히스토리 스택 추가
        this.previousHash = null; // 이전 해시 저장
        this.isLoading = false; // 🚨 중요: 로딩 상태 추적
        
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
        
        // 현재 해시와 동일하면 무시 (무한 루프 방지)
        const currentHash = window.location.hash.slice(1) || 'home';
        if (this.previousHash && this.previousHash === currentHash) {
            console.log('동일한 해시로의 중복 라우팅 무시:', currentHash);
            return;
        }
        
        // 🚨 중요: 로딩 상태 확인 (이미 로딩 중이면 리턴)
        if (this.isLoading) {
            console.log('이미 로딩 중이므로 라우팅 무시:', currentHash);
            return;
        }
        
        // 🚨 중요: 로딩 상태 설정
        this.isLoading = true;
        
        // 히스토리에 현재 경로 추가 (중복 방지)
        const currentPath = hash;
        if (this.history.length === 0 || this.history[this.history.length - 1] !== currentPath) {
            this.history.push(currentPath);
            // 히스토리 크기 제한 (최대 50개)
            if (this.history.length > 50) {
                this.history.shift();
            }
        }
        
        console.log('라우팅 처리:', route, params, '히스토리:', this.history.length);
        
        // 현재 뷰 숨기기
        this.hideAllViews();
        
        // 로딩 표시
        this.showLoading();
        
        // 라우트 처리
        setTimeout(() => {
            try {
                if (this.routes[route]) {
                    console.log('라우트 실행:', route, params);
                    try {
                        this.routes[route](params);
                    } catch (routeError) {
                        console.error(`❌ 라우트 ${route} 실행 실패:`, routeError);
                        this.showErrorMessage('페이지 로딩 중 오류가 발생했습니다.');
                        if (route !== 'home') {
                            window.location.hash = '#home';
                        }
                    }
                } else {
                    // 알 수 없는 라우트에 대한 처리
                    console.warn('알 수 없는 라우트:', route);
                    this.showRouteNotFound(route);
                }
                this.updateNavigation(route);
            } catch (error) {
                console.error('라우팅 오류:', error);
                this.showRouteError(error);
            } finally {
                // 🚨 중요: 로딩 상태 해제 (성공/실패 관계없이)
                this.isLoading = false;
                this.hideLoading();
                
                // 이전 해시 업데이트
                this.previousHash = currentHash;
            }
        }, 100);
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
     * 프로그래매틱 네비게이션
     */
    navigate(path) {
        // 🚨 중요: 로딩 중이면 무시
        if (this.isLoading) {
            console.log('로딩 중이므로 네비게이션 무시:', path);
            return;
        }
        
        // 경로가 현재 경로와 같으면 무시
        const currentHash = window.location.hash.slice(1) || 'home';
        if (currentHash === path) {
            console.log('동일한 경로로의 네비게이션 무시:', path);
            return;
        }
        
        // 디버깅을 위한 로그
        console.log('라우터 네비게이션:', currentHash, '->', path);
        
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
    if (params[0] && typeof loadCategoryView === 'function') {
        const categoryName = decodeURIComponent(params[0]);
        console.log('카테고리 로드:', categoryName);
        
        // 페이지 번호가 있는 경우 처리
        if (params[1]) {
            const page = parseInt(params[1]);
            if (page && page > 0) {
                // 카테고리 로드 후 페이지 설정
                loadCategoryView(categoryName);
                setTimeout(() => {
                    if (typeof changeCategoryPage === 'function') {
                        changeCategoryPage(page);
                    }
                }, 100);
            } else {
                loadCategoryView(categoryName);
            }
        } else {
            loadCategoryView(categoryName);
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