/**
 * 다국어 지원 모듈
 */

class I18n {
    constructor() {
        this.currentLanguage = 'ko';
        this.translations = {
            ko: {
                // 사이드바
                'sidebar.home': '홈',
                'sidebar.list': '전체 목록',
                'sidebar.categories': '카테고리',
                'sidebar.upload': 'CSV 파일 업로드',
                'sidebar.total': '총 문화재',
                
                // 카테고리
                'category.national': '국보',
                'category.treasure': '보물', 
                'category.historic': '사적',
                'category.scenic': '명승',
                'category.natural': '천연기념물',
                'category.intangible': '국가무형문화재',
                
                // 메인 페이지
                'main.title': '한국 문화유산 디지털 아카이브',
                'main.subtitle': '우리의 소중한 문화재를 디지털로 보존하고 공유합니다',
                'main.explore': '문화재 둘러보기',
                'main.statistics': '통계 현황',
                'main.total_items': '전체 문화재',
                'main.recent_added': '최근 추가',
                'main.categories_count': '카테고리 수',
                'main.locations_count': '지역 수',
                
                // 목록 페이지
                'list.title': '문화재 목록',
                'list.all_categories': '모든 카테고리',
                'list.all_locations': '모든 지역',
                'list.reset': '초기화',
                'list.grid_view': '그리드 뷰',
                'list.list_view': '리스트 뷰',
                'list.no_results': '검색 결과가 없습니다',
                'list.try_different': '다른 검색어나 필터를 시도해보세요.',
                
                // 테이블 헤더
                'table.image': '이미지',
                'table.name': '문화재명',
                'table.category': '카테고리',
                'table.region': '지역',
                'table.description': '설명',
                'table.details': '상세보기',
                
                // 페이지네이션
                'pagination.previous': '이전',
                'pagination.next': '다음',
                
                // 공통 텍스트
                'common.search': '검색',
                'common.back': '뒤로가기',
                'common.loading': '로딩 중...',
                'common.no_image': '이미지 없음',
                'common.no_info': '정보 없음',
                'common.period_unknown': '시대 정보 없음',
                'common.total_count': '총 {count}건',
                
                // 검색
                'search.placeholder': '문화재 검색...',
                'search.no_results': '검색 결과가 없습니다',
                
                // 카테고리 페이지
                'category.total_items': '총 {count}개',
                'category.no_items': '해당 조건의 문화재가 없습니다',
                'category.try_other_region': '다른 지역을 선택해보세요.',
            },
            
            en: {
                // 사이드바
                'sidebar.home': 'Home',
                'sidebar.list': 'All Items',
                'sidebar.categories': 'Categories',
                'sidebar.upload': 'Upload CSV File',
                'sidebar.total': 'Total Heritage',
                
                // 카테고리
                'category.national': 'National Treasure',
                'category.treasure': 'Treasure',
                'category.historic': 'Historic Site',
                'category.scenic': 'Scenic Site',
                'category.natural': 'Natural Monument',
                'category.intangible': 'Intangible Cultural Heritage',
                
                // 메인 페이지
                'main.title': 'Korean Cultural Heritage Digital Archive',
                'main.subtitle': 'Preserving and sharing our precious cultural heritage digitally',
                'main.explore': 'Explore Heritage',
                'main.statistics': 'Statistics',
                'main.total_items': 'Total Items',
                'main.recent_added': 'Recently Added',
                'main.categories_count': 'Categories',
                'main.locations_count': 'Regions',
                
                // 목록 페이지
                'list.title': 'Heritage List',
                'list.all_categories': 'All Categories',
                'list.all_locations': 'All Regions',
                'list.reset': 'Reset',
                'list.grid_view': 'Grid View',
                'list.list_view': 'List View',
                'list.no_results': 'No results found',
                'list.try_different': 'Try different search terms or filters.',
                
                // 테이블 헤더
                'table.image': 'Image',
                'table.name': 'Name',
                'table.category': 'Category',
                'table.region': 'Region',
                'table.description': 'Description',
                'table.details': 'Details',
                
                // 페이지네이션
                'pagination.previous': 'Previous',
                'pagination.next': 'Next',
                
                // 공통 텍스트
                'common.search': 'Search',
                'common.back': 'Back',
                'common.loading': 'Loading...',
                'common.no_image': 'No Image',
                'common.no_info': 'No Info',
                'common.period_unknown': 'Period Unknown',
                'common.total_count': 'Total {count} items',
                
                // 검색
                'search.placeholder': 'Search heritage...',
                'search.no_results': 'No results found',
                
                // 카테고리 페이지
                'category.total_items': 'Total {count} items',
                'category.no_items': 'No cultural heritage found',
                'category.try_other_region': 'Try selecting other regions.',
            }
        };
    }
    
    /**
     * 언어 변경
     */
    setLanguage(lang) {
        console.log('언어 설정 변경:', lang);
        this.currentLanguage = lang;
        this.updateAllTexts();
        
        // 데이터 매니저에도 언어 설정 전달
        if (window.dataManager) {
            dataManager.currentLanguage = lang;
            console.log('데이터 매니저 언어 설정 완료');
        }
    }
    
    /**
     * 텍스트 번역
     */
    t(key, params = {}) {
        const translation = this.translations[this.currentLanguage][key] || key;
        
        // 파라미터 치환
        return translation.replace(/\{(\w+)\}/g, (match, param) => {
            return params[param] || match;
        });
    }
    
    /**
     * 모든 텍스트 업데이트
     */
    updateAllTexts() {
        console.log('언어 변경 중:', this.currentLanguage);
        
        // data-i18n 속성이 있는 모든 요소 업데이트
        const elements = document.querySelectorAll('[data-i18n]');
        console.log('업데이트할 요소 수:', elements.length);
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const params = element.getAttribute('data-i18n-params');
            
            try {
                const parsedParams = params ? JSON.parse(params) : {};
                const translation = this.t(key, parsedParams);
                element.textContent = translation;
                console.log(`${key} -> ${translation}`);
            } catch (e) {
                const translation = this.t(key);
                element.textContent = translation;
                console.log(`${key} -> ${translation} (기본)`);
            }
        });
        
        // placeholder 업데이트
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.setAttribute('placeholder', this.t(key));
        });
        
        // title 업데이트
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.setAttribute('title', this.t(key));
        });
        
        // 현재 페이지 다시 렌더링 (데이터가 있는 경우)
        this.refreshCurrentView();
    }
    
    /**
     * 현재 뷰 새로고침
     */
    refreshCurrentView() {
        const currentHash = window.location.hash.slice(1) || 'home';
        const [route] = currentHash.split('/');
        
        setTimeout(() => {
            if (route === 'home' && typeof updateDashboard === 'function') {
                updateDashboard();
            } else if (route === 'list' && typeof loadHeritageList === 'function') {
                loadHeritageList();
            } else if (route === 'category' && typeof renderCategoryContent === 'function') {
                renderCategoryContent();
            }
        }, 100);
    }
}

// 전역 인스턴스 생성
const i18n = new I18n();