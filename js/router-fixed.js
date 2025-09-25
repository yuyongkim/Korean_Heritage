/**
 * SPA Router - Race Condition Free Implementation
 * Solves the persistent duplicate execution problem
 */
class Router {
    constructor() {
        this.routes = {};
        this.currentView = null;
        this.currentRoute = null;
        this.lastParams = null;
        this.isNavigating = false;
        this.lastParseResult = null;
        this.lastParseHash = null;
        this.history = [];
        this.pendingNavigation = null; // 🚀 NEW: Queue for pending navigations
        
        // 🚀 CRITICAL FIX: Use bound methods to prevent context loss
        this.handleRoute = this.handleRoute.bind(this);
        this.navigate = this.navigate.bind(this);
        
        // Event listeners
        window.addEventListener('hashchange', this.handleRoute);
        window.addEventListener('load', this.handleRoute);
        
        // Navigation setup
        this.setupNavigation();
    }
    
    /**
     * Add route handler
     */
    addRoute(pattern, handler) {
        this.routes[pattern] = handler;
    }
    
    /**
     * 🚀 RACE-CONDITION-FREE ROUTING HANDLER
     * This is the core fix - single entry point with proper mutex
     */
    handleRoute() {
        // 🚀 CRITICAL: Immediate mutex check at function entry
        if (this.isNavigating) {
            console.log('⏳ 라우팅 처리 중, 중복 실행 방지');
            return;
        }
        
        // 🚀 CRITICAL: Set mutex immediately, before any async operations
        this.isNavigating = true;
        
        // 🚀 CRITICAL: Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            try {
                this._executeRoute();
            } catch (error) {
                console.error('❌ 라우팅 실행 에러:', error);
            } finally {
                // 🚀 CRITICAL: Reset mutex immediately after execution
                this.isNavigating = false;
                
                // 🚀 Process any pending navigation
                if (this.pendingNavigation) {
                    const pending = this.pendingNavigation;
                    this.pendingNavigation = null;
                    this.navigate(pending);
                }
            }
        });
    }
    
    /**
     * 🚀 INTERNAL ROUTE EXECUTION (separated for clarity)
     */
    _executeRoute() {
        const { route, params } = this.parseHash();
        
        // 🚀 Duplicate route prevention
        if (this.currentRoute === route && JSON.stringify(this.lastParams) === JSON.stringify(params)) {
            console.log('🔄 동일한 라우트와 파라미터, 중복 실행 방지:', route);
            return;
        }
        
        console.log(`🎯 라우트 실행: ${route}`, params);
        
        // Update state
        this.currentRoute = route;
        this.lastParams = params;
        
        // Execute route handler
        if (this.routes[route]) {
            console.log(`✅ 라우트 '${route}' 핸들러 찾음, 실행 중...`);
            try {
                this.routes[route](params);
                console.log(`✅ ${route} 라우트 실행 완료`);
            } catch (error) {
                console.error(`❌ ${route} 라우트 실행 에러:`, error);
                if (route !== 'home') {
                    this.navigate('home');
                }
            }
        } else {
            console.error(`❌ 알 수 없는 라우트: ${route}`, '사용 가능한 라우트:', Object.keys(this.routes));
            this.navigate('home');
        }
    }
    
    /**
     * 🚀 RACE-CONDITION-FREE NAVIGATION
     */
    navigate(hash) {
        const currentHash = window.location.hash.slice(1);
        const newHash = hash.startsWith('#') ? hash.slice(1) : hash;
        
        console.log(`🛣️ 라우터 네비게이션 요청: ${currentHash} -> ${newHash}`);
        
        // 🚀 CRITICAL: If already navigating, queue the request
        if (this.isNavigating) {
            console.log('⏳ 네비게이션 진행 중, 요청 대기열에 추가:', newHash);
            this.pendingNavigation = newHash;
            return;
        }
        
        // Same route check
        if (currentHash === newHash) {
            console.log('🔄 동일한 라우트, 무시:', newHash);
            return;
        }
        
        // 🚀 CRITICAL: Update URL first, then let hashchange handle the rest
        try {
            window.location.hash = newHash;
            
            // Update history
            if (currentHash && currentHash !== newHash) {
                this.history.push(currentHash);
            }
            
            // 🚀 CRITICAL: Don't call handleRoute() directly - let hashchange event handle it
            // This prevents the race condition between direct calls and event-driven calls
            
        } catch (error) {
            console.error('❌ 네비게이션 에러:', error);
            this.isNavigating = false; // Reset flag on error
            if (newHash !== 'home') {
                this.navigate('home');
            }
        }
    }
    
    /**
     * Hash parsing (unchanged)
     */
    parseHash() {
        const hash = window.location.hash.slice(1) || 'home';
        console.log('📍 Hash 파싱 시작:', hash);
        
        // Cache check
        if (this.lastParseHash === hash && this.lastParseResult) {
            console.log('🚀 캐시된 파싱 결과 사용:', this.lastParseResult);
            return this.lastParseResult;
        }
        
        // URL decoding
        let decodedHash;
        try {
            decodedHash = decodeURIComponent(hash);
            console.log('🔓 URL 디코딩 완료:', decodedHash);
        } catch (e) {
            decodedHash = hash;
            console.log('⚠️ URL 디코딩 실패, 원본 사용:', decodedHash);
        }
        
        let result;
        
        // Route parsing logic (unchanged)
        if (decodedHash.startsWith('detail/')) {
            const itemId = decodedHash.replace('detail/', '');
            console.log('🔍 상세페이지 라우트 감지:', decodedHash, '-> ID:', itemId);
            result = {
                route: 'detail',
                params: { id: itemId }
            };
        }
        else if (decodedHash.match(/^category\/[^\/]+\/page\/\d+$/)) {
            const parts = decodedHash.split('/');
            result = {
                route: 'category',
                params: { 
                    category: parts[1], 
                    page: parseInt(parts[3]) 
                }
            };
        }
        else if (decodedHash.startsWith('category/')) {
            const categoryName = decodedHash.replace('category/', '').split('/')[0];
            result = {
                route: 'category',
                params: { category: categoryName, page: 1 }
            };
        }
        else if (decodedHash.startsWith('unclassified/')) {
            const parts = decodedHash.split('/');
            const unclassifiedType = parts[1] || 'sido-type';
            result = {
                route: 'unclassified',
                params: { type: unclassifiedType, page: 1 }
            };
        }
        else if (decodedHash.startsWith('list?page=')) {
            const pageMatch = decodedHash.match(/page=(\d+)/);
            const pageNum = pageMatch ? parseInt(pageMatch[1]) : 1;
            result = {
                route: 'list',
                params: { page: pageNum }
            };
        }
        else if (decodedHash.includes('?')) {
            const [routePart, queryPart] = decodedHash.split('?', 2);
            const params = {};
            
            if (queryPart) {
                queryPart.split('&').forEach(param => {
                    const [key, value] = param.split('=');
                    if (key && value !== undefined) {
                        params[key] = isNaN(value) ? decodeURIComponent(value) : parseInt(value);
                    }
                });
            }
            
            result = {
                route: routePart || 'home',
                params: params
            };
        }
        else {
            const parts = decodedHash.split('/');
            result = {
                route: parts[0] || 'home',
                params: {}
            };
        }

        // Cache result
        this.lastParseHash = hash;
        this.lastParseResult = result;
        
        console.log('📋 최종 파싱 결과:', result);
        return result;
    }
    
    /**
     * View management (unchanged)
     */
    getViewIdFromRoute(route) {
        const routeToViewMap = {
            'home': 'home-view',
            'list': 'list-view',
            'detail': 'detail-view',
            'category': 'category-view',
            'unclassified': 'unclassified-view',
            'search': 'list-view',
            'english': 'english-view'
        };
        return routeToViewMap[route] || 'home-view';
    }
    
    hideAllViews() {
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });
    }
    
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
    
    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }
    
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
    
    /**
     * Navigation setup (unchanged)
     */
    setupNavigation() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const hash = link.getAttribute('href');
                this.navigate(hash.slice(1));
            }
        });
    }
    
    updateNavigation(currentRoute) {
        document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`a[href="#${currentRoute}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
    
    // Error handling methods (unchanged)
    showRouteNotFound(route) {
        console.warn('알 수 없는 라우트:', route);
        this.showView('home-view');
        this.showNotFoundMessage(route);
    }
    
    showRouteError(error) {
        console.error('라우트 처리 중 오류:', error);
        this.showView('home-view');
        this.showErrorMessage(error);
    }
    
    showNotFoundMessage(route) {
        const existingAlert = document.querySelector('.route-not-found-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
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
        
        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
    
    showErrorMessage(message) {
        const existingAlert = document.querySelector('.route-error-alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
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
        
        setTimeout(() => {
            if (alert && alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }
    
    // Detail page methods (unchanged)
    loadDetailDirectly(itemId) {
        if (window.dataManager && window.dataManager.cachedData) {
            const item = window.dataManager.cachedData.find(data => 
                data.key_asno === itemId || 
                data.composite_key === itemId ||
                data.name === itemId
            );
            
            if (item) {
                console.log('✅ 세부 항목 찾음:', item.name);
                this.renderDetailView(item);
            } else {
                console.error('❌ 세부 항목을 찾을 수 없음:', itemId);
                this.navigate('home');
            }
        }
    }

    renderDetailView(item) {
        const detailContainer = document.querySelector('.detail-content, #detail-view, .main-content');
        if (detailContainer) {
            detailContainer.innerHTML = `
                <div class="detail-header">
                    <h1>${item.name}</h1>
                    <p class="text-muted">${item.kdcd_name} | ${item.ctcd_name}</p>
                </div>
                <div class="detail-body">
                    ${item.imageUrl ? `<img src="${item.imageUrl}" class="img-fluid mb-3" alt="${item.name}">` : ''}
                    <p>${item.content || '내용이 없습니다.'}</p>
                    ${item.english_description ? `<div class="mt-3"><h5>English</h5><p>${item.english_description}</p></div>` : ''}
                </div>
                <div class="detail-footer">
                    <button onclick="history.back()" class="btn btn-secondary">돌아가기</button>
                </div>
            `;
        }
    }
}

// Global router instance
const router = new Router();

// Navigation functions
function goBack() {
    console.log('뒤로가기 요청, 현재 히스토리:', router.history);
    
    if (router.history && router.history.length > 1) {
        router.history.pop();
        const previousPath = router.history[router.history.length - 1];
        console.log('이전 경로로 이동:', previousPath);
        
        if (previousPath && previousPath !== '') {
            router.navigate(previousPath);
        } else {
            router.navigate('home');
        }
    } else {
        console.log('히스토리 없음, 홈으로 이동');
        router.navigate('home');
    }
}

function goHome() {
    console.log('🏠 홈으로 이동 요청');
    router.navigate('home');
}

// Global function registration
window.goBack = goBack;
window.goHome = goHome;

// Route registrations (unchanged)
router.addRoute('home', async (params) => {
    console.log('🏠 홈 라우트 실행:', params);
    
    router.showView('home-view');
    
    const page = parseInt(params.page) || 1;
    console.log('📄 홈 페이지 요청:', page);
    
    if (page > 1) {
        router.showView('list-view');
        if (window.homePage && typeof window.homePage.loadHeritageList === 'function') {
            await window.homePage.loadHeritageList();
        } else if (typeof loadHeritageList === 'function') {
            await loadHeritageList();
        }
    } else {
        console.log('🏠 홈 대시보드 로드 시작');
        
        if (typeof updateDashboard === 'function') {
            console.log('📊 updateDashboard 함수 호출');
            updateDashboard();
        } else if (window.app && typeof window.app.updateDashboard === 'function') {
            console.log('📊 app.updateDashboard 함수 호출');
            await window.app.updateDashboard();
        } else {
            console.log('⚠️ updateDashboard 함수를 찾을 수 없습니다');
        }
        
        console.log('✅ 홈 대시보드 로드 완료');
    }
});

router.addRoute('list', async (params) => {
    console.log('📋 리스트 라우트 실행:', params);
    router.showView('list-view');
    
    const page = parseInt(params.page) || 1;
    console.log('📄 요청된 페이지:', page);
    
    if (window.homePage && typeof window.homePage.loadHeritageList === 'function') {
        await window.homePage.loadHeritageList();
    } else if (typeof loadHeritageList === 'function') {
        await loadHeritageList();
    } else {
        console.error('❌ homePage 또는 loadHeritageList 함수를 찾을 수 없습니다');
    }
});

router.addRoute('detail', async (params) => {
    console.log('📄 세부페이지 라우트 실행:', params);
    router.showView('detail-view');
    
    const itemId = params.id;
    if (itemId) {
        if (window.detailPage && typeof window.detailPage.loadDetailView === 'function') {
            await window.detailPage.loadDetailView(itemId);
        } else {
            console.error('❌ detailPage 또는 loadDetailView 함수를 찾을 수 없습니다');
            router.loadDetailDirectly(itemId);
        }
    }
});

router.addRoute('category', async (params) => {
    console.log('📂 카테고리 라우트 실행:', params);
    router.showView('category-view');
    
    if (params.category) {
        console.log('✅ 카테고리 파라미터 확인:', params.category);
        
        const page = parseInt(params.page) || 1;
        console.log('📄 카테고리 페이지 요청:', page);
        
        if (window.categoryPage && typeof window.categoryPage.loadCategoryView === 'function') {
            await window.categoryPage.loadCategoryView(params.category);
            
            if (page > 1) {
                console.log(`🔄 카테고리 페이지 ${page}로 이동`);
                if (typeof window.categoryPage.changeCategoryPage === 'function') {
                    window.categoryPage.changeCategoryPage(page);
                }
            }
        } else {
            console.error('❌ categoryPage 또는 loadCategoryView 함수를 찾을 수 없습니다');
            if (window.dataManager && window.dataManager.getByCategory) {
                const categoryData = window.dataManager.getByCategory(params.category);
                console.log('🔄 dataManager로 카테고리 필터링 실행:', categoryData.length, '건');
            }
        }
    } else {
        console.warn('⚠️ 카테고리 파라미터가 없습니다, 전체 카테고리 표시');
        if (typeof window.loadAllCategories === 'function') {
            await window.loadAllCategories();
        }
    }
});

router.addRoute('search', async (params) => {
    router.showView('list-view');
    if (params[0] && typeof performSearch === 'function') {
        const query = decodeURIComponent(params[0]);
        const urlParams = new URLSearchParams(window.location.search);
        const searchOption = urlParams.get('option') || 'title+description';
        await performSearch(query, searchOption);
    }
});

router.addRoute('english', async () => {
    router.showView('english-view');
    if (typeof loadEnglishView === 'function') {
        await loadEnglishView();
    }
});

router.addRoute('unclassified', async (params) => {
    console.log('🗂️ 미분류 라우트 실행:', params);
    router.showView('unclassified-view');
    
    const unclassifiedType = params.type || 'sido-type';
    
    if (window.searchPage && typeof window.searchPage.loadUnclassifiedView === 'function') {
        await window.searchPage.loadUnclassifiedView(unclassifiedType);
    } else {
        console.error('❌ searchPage 또는 loadUnclassifiedView 함수를 찾을 수 없습니다');
        if (window.dataManager && window.dataManager.heritageData) {
            const unclassifiedData = window.dataManager.heritageData.filter(item => {
                switch (unclassifiedType) {
                    case 'sido-type':
                        return item.kdcd_name === '시도유형문화재';
                    case 'sido-folklore':
                        return item.kdcd_name === '시도민속문화재';
                    case 'cultural-data':
                        return item.kdcd_name === '문화재자료';
                    case 'others':
                        return item.kdcd_name === '미분류' || item.ctcd_name === '미분류';
                    default:
                        return false;
                }
            });
            console.log('🔄 미분류 데이터 필터링 실행:', unclassifiedData.length, '건');
        }
    }
});