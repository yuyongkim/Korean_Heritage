// DEBUG_MODE와 debugLog는 config.js에서 가져옴

class Router {
    constructor() {
        this.routes = {};
        this.currentView = null;
        this.isLoading = false;

        // URL의 해시(#) 변경을 감지하여 handleRoute 함수를 실행
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    // 경로 추가 (예: '#list', '#detail/:name')
    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    // URL을 변경하고 싶을 때 호출하는 함수
    navigate(path) {
        if (this.isLoading) {
            console.log('⏳ 이미 네비게이션 진행 중, 무시');
            return;
        }
        // 현재 URL과 동일하면 아무것도 하지 않음 (중복 실행 방지)
        if (`#${path}` === window.location.hash) {
            return;
        }
        window.location.hash = path;
    }

    // 해시 변경이 감지되면 실행되는 메인 핸들러
    async handleRoute() {
        if (this.isLoading) return;

        this.isLoading = true;
        const hash = window.location.hash.slice(1) || 'home';
        
        let currentPath = hash;
        let params = {};

        // URL 파라미터 처리 (예: detail/:name)
        for (const path in this.routes) {
            const paramNames = [];
            const regexPath = path.replace(/:(\w+)/g, (_, name) => {
                paramNames.push(name);
                return '([^/]+)';
            });

            const regex = new RegExp(`^${regexPath}$`);
            const match = hash.match(regex);

            if (match) {
                currentPath = path;
                paramNames.forEach((name, index) => {
                    params[name] = decodeURIComponent(match[index + 1]);
                });
                break;
            }
        }

        // 등록된 경로가 있으면 해당 핸들러 실행
        if (this.routes[currentPath]) {
            try {
                // 핸들러(app.js의 함수)가 끝날 때까지 기다림
                await this.routes[currentPath](params);
            } catch (error) {
                console.error('라우트 처리 중 에러:', error);
            }
        } else {
            console.log('404: 페이지를 찾을 수 없음');
            this.showView('not-found-view');
        }
        
        this.isLoading = false;
    }
    
    // 화면(View)을 보여주고 숨기는 역할
    showView(viewId) {
        if (this.currentView === viewId) {
            return;
        }
        
        // 모든 view를 숨김
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });

        // 요청된 view만 보여줌
        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.style.display = 'block';
            this.currentView = viewId;
        }
    }
}

// 라우터 인스턴스 생성 및 경로 설정
const router = new Router();

router.addRoute('home', (params) => {
    router.showView('home-view');
    // 홈 뷰에 필요한 데이터 로딩 함수가 있다면 여기서 호출
});

router.addRoute('list', async (params) => {
    router.showView('list-view');
    await loadHeritageList(); // app.js의 함수 호출
});

router.addRoute('category/:category', async (params) => {
    router.showView('category-view');
    await loadCategoryView(params.category); // app.js의 함수 호출
});

router.addRoute('category/:category/page/:page', async (params) => {
    router.showView('category-view');
    await loadCategoryView(params.category, parseInt(params.page)); // app.js의 함수 호출
});

router.addRoute('detail/:name', async (params) => {
    router.showView('detail-view');
    await loadHeritageDetail(params.name); // app.js의 함수 호출
});