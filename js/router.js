// 🚨 긴급 성능 복구 - 과도한 로깅 제거
// 🔥 1단계: 로깅 레벨 조정 (중앙화된 설정 사용)
// DEBUG_MODE와 debugLog는 config.js에서 가져옴

/**
 * SPA 라우터 - URL 해시 기반 페이지 라우팅
 */
class Router {
    constructor() {
        this.routes = {};
        this.currentView = null;
        this.currentRoute = null;
        this.isNavigating = false;
        this.lastParseResult = null;
        this.lastParseHash = null;
        
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
        
        debugLog(`🎯 라우트 실행: ${route}`, params);
        
        // 🚀 라우트 존재 확인
        if (this.routes[route]) {
            try {
                // ✅ 파라미터를 확실히 전달
                this.routes[route](params);
                debugLog(`✅ ${route} 라우트 실행 완료`);
            } catch (error) {
                debugLog(`❌ ${route} 라우트 실행 에러:`, error);
                // 에러 시 홈으로 리다이렉트
                if (route !== 'home') {
                    this.navigate('home');
                }
            }
        } else {
            debugLog(`❌ 알 수 없는 라우트: ${route}`);
            this.navigate('home');
        }
    }

    /**
     * 🚀 해시 파싱 (파라미터 및 쿼리 파라미터 지원)
     */
    parseHash() {
        const hash = window.location.hash.slice(1) || 'home';
        
        // 🚨 캐싱된 파싱 결과 사용
        if (this.lastParseHash === hash && this.lastParseResult) {
            return this.lastParseResult;
        }
        
        // 🚀 URL 디코딩 먼저 수행 (한글 처리)
        let decodedHash;
        try {
            decodedHash = decodeURIComponent(hash);
        } catch (e) {
            decodedHash = hash;
        }
        
        let result;
        
        // 🎯 세부페이지 라우팅 추가 (detail/ID)
        if (decodedHash.startsWith('detail/')) {
            const itemId = decodedHash.replace('detail/', '');
            result = {
                route: 'detail',
                params: { id: itemId }
            };
        }
        // 카테고리 + 페이지 처리
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
        // 기본 카테고리 처리
        else if (decodedHash.startsWith('category/')) {
            const categoryName = decodedHash.replace('category/', '').split('/')[0];
            result = {
                route: 'category',
                params: { category: categoryName, page: 1 }
            };
        }
        // 미분류 항목 처리
        else if (decodedHash.startsWith('unclassified/')) {
            const parts = decodedHash.split('/');
            const unclassifiedType = parts[1] || 'sido-type';
            result = {
                route: 'unclassified',
                params: { type: unclassifiedType, page: 1 }
            };
        }
        // 기본 라우트
        else {
            const parts = decodedHash.split('/');
            result = {
                route: parts[0] || 'home',
                params: {}
            };
        }

        // 🚨 캐싱
        this.lastParseHash = hash;
        this.lastParseResult = result;
        
        return result;
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
            'unclassified': 'unclassified-view',
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
     * 🔥 세부페이지 직접 로드 (대체 로직)
     */
    loadDetailDirectly(itemId) {
        if (window.dataManager && window.dataManager.cachedData) {
            const item = window.dataManager.cachedData.find(data => 
                data.key_asno === itemId || 
                data.composite_key === itemId ||
                data.name === itemId
            );
            
            if (item) {
                debugLog('✅ 세부 항목 찾음:', item.name);
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

    /**
     * 🔥 추가 디버깅용 함수 (임시로 router.js에 추가)
     */
    debugRouteExecution() {
        const { route, params } = this.parseHash();
        debugLog('🔍 라우트 디버그:');
        debugLog('  - 파싱된 라우트:', route);
        debugLog('  - 파싱된 파라미터:', params);
        debugLog('  - 사용 가능한 라우트:', Object.keys(this.routes));
        debugLog('  - 해당 라우트 함수:', typeof this.routes[route]);
        
        // 수동으로 라우트 실행 테스트
        if (this.routes[route]) {
            debugLog('🧪 수동 라우트 실행 테스트...');
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

router.addRoute('list', async (params) => {
    console.log('📋 리스트 라우트 실행:', params);
    router.showView('list-view');
    
    // 🚀 페이지 파라미터 처리
    const page = parseInt(params.page) || 1;
    console.log('📄 요청된 페이지:', page);
    
    if (typeof window.loadListView === 'function') {
        await window.loadListView(page, params);
    } else if (typeof loadHeritageList === 'function') {
        await loadHeritageList();
    } else {
        console.error('❌ loadListView 함수를 찾을 수 없습니다');
    }
});

// 🚨 세부페이지 라우트 핸들러 추가
router.addRoute('detail', async (params) => {
    debugLog('📄 세부페이지 라우트 실행:', params);
    router.showView('detail-view');
    
    const itemId = params.id;
    if (itemId) {
        // 세부페이지 로드 함수 호출
        if (typeof window.loadDetailView === 'function') {
            await window.loadDetailView(itemId);
        } else if (typeof loadDetailView === 'function') {
            await loadDetailView(itemId);
        } else {
            // 🚨 대체 로직: 직접 데이터 찾기
            router.loadDetailDirectly(itemId);
        }
    }
});

router.addRoute('category', async (params) => {
    console.log('📂 카테고리 라우트 실행:', params);
    router.showView('category-view');
    
    // 🚀 카테고리 파라미터 검증 및 처리
    if (params.category) {
        console.log('✅ 카테고리 파라미터 확인:', params.category);
        
        // loadCategoryView 함수 존재 확인
        if (typeof window.loadCategoryView === 'function') {
            await window.loadCategoryView(params.category);
        } else if (typeof loadCategoryView === 'function') {
            await loadCategoryView(params.category);
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
            await window.loadAllCategories();
        }
    }
});

router.addRoute('search', async (params) => {
    router.showView('list-view');
    if (params[0] && typeof performSearch === 'function') {
        const query = decodeURIComponent(params[0]);
        // URL에서 검색 옵션 추출
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
    
    if (typeof window.loadUnclassifiedView === 'function') {
        await window.loadUnclassifiedView(unclassifiedType);
    } else if (typeof loadUnclassifiedView === 'function') {
        await loadUnclassifiedView(unclassifiedType);
    } else {
        console.error('❌ loadUnclassifiedView 함수를 찾을 수 없습니다');
    }
});