/**
 * 메인 애플리케이션 - 초기화 및 전역 관리
 */

/**
 * 앱 컨트롤러 클래스
 */
class AppController {
    constructor() {
        this.updateQueue = new Set();
        this.isUpdating = false;
        this.lastUpdateData = null;
        this.updateTimeout = null;
        this.DEBOUNCE_TIME = 300; // 300ms로 증가
    }

    // 🚀 디바운스된 업데이트 시스템
    scheduleUpdate(updateType, data) {
        // 🚨 동일한 데이터 체크 강화
        const dataHash = this._hashData(data);
        if (this.lastUpdateData === dataHash) {
            return; // 완전히 무시
        }

        this.updateQueue.add(updateType);
        
        // 🚨 디바운싱 강화
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            this._processUpdateQueue(data, dataHash);
        }, this.DEBOUNCE_TIME);
    }

    async _processUpdateQueue(data, dataHash) {
        if (this.isUpdating) {
            return;
        }

        this.isUpdating = true;
        debugLog('🔄 업데이트 큐 처리:', Array.from(this.updateQueue));

        try {
            // 🚀 한 번에 모든 업데이트 처리
            if (this.updateQueue.has('dashboard')) {
                await this._updateDashboard(data);
            }
            
            if (this.updateQueue.has('filters')) {
                await this._updateFilters(data);
            }
            
            if (this.updateQueue.has('stats')) {
                await this._updateStats(data);
            }

            this.lastUpdateData = dataHash;
            debugLog('✅ 모든 업데이트 완료');
            
        } catch (error) {
            debugLog('❌ 업데이트 에러:', error);
        } finally {
            this.updateQueue.clear();
            this.isUpdating = false;
        }
    }

    _hashData(data) {
        if (!data || !Array.isArray(data)) return 'empty';
        return `${data.length}-${data[0]?.name || 'unknown'}`;
    }

    // 🚀 개별 업데이트 함수들
    async _updateDashboard(data) {
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    }

    async _updateFilters(data) {
        if (dataManager && typeof dataManager.updateFilters === 'function') {
            dataManager.updateFilters();
        }
    }

    async _updateStats(data) {
        if (dataManager && typeof dataManager.getStatistics === 'function') {
            dataManager.getStatistics();
        }
    }

    // 🚀 공개 메서드들
    updateDashboard(data) {
        this.scheduleUpdate('dashboard', data);
    }

    updateFilters(data) {
        this.scheduleUpdate('filters', data);
    }

    updateStats(data) {
        this.scheduleUpdate('stats', data);
    }
}

// 🚀 전역 앱 컨트롤러
const appController = new AppController();

// 전역 페이지 인스턴스들
let homePage, categoryPage, detailPage, searchPage;

// 전역 변수
let currentPage = 1;
const itemsPerPage = 20;
let isLoading = false;

/**
 * 애플리케이션 초기화
 */
document.addEventListener('DOMContentLoaded', async () => {
    debugLog('🚀 애플리케이션 시작...');
    
    // 페이지 인스턴스 초기화
    homePage = new HomePage();
    categoryPage = new CategoryPage();
    detailPage = new DetailPage();
    searchPage = new SearchPage();
    
    // 전역으로 등록
    window.homePage = homePage;
    window.categoryPage = categoryPage;
    window.detailPage = detailPage;
    window.searchPage = searchPage;
    
    debugLog('전역 객체들 확인:', {
        dataManager: typeof dataManager,
        router: typeof router,
        i18n: typeof i18n,
        imageResolver: typeof imageResolver,
        mapManager: typeof mapManager
    });
    
    // 데이터 로드 (로컬 스토리지 우선)
    await dataManager.loadData();
    
    // 초기 통계 표시
    debugLog('현재 총 문화재 수:', dataManager.heritageData.length);
    
    // 🚀 최적화된 대시보드 업데이트
    appController.updateDashboard(dataManager.heritageData);
    
    // 🔧 필터 옵션 업데이트 (드롭다운 메뉴 문제 해결)
    if (window.filterManager && typeof filterManager.updateFilterOptions === 'function') {
        filterManager.updateFilterOptions();
        debugLog('✅ 필터 옵션 업데이트 완료');
    }
    
    // 🖼️ 이미지 미리 로드 (첫 3페이지)
    setTimeout(() => {
        const firstThreePages = dataManager.heritageData.slice(0, 60); // 20 * 3 = 60개
        imageCacheManager.preloadImages(firstThreePages);
    }, 2000); // 2초 후 시작 (초기 로딩 완료 후)
    
    // 데이터 변경 이벤트 리스너 설정
    dataManager.addEventListener('dataLoaded', (data) => {
        console.log('📊 데이터 로딩 완료 이벤트 수신:', data.length, '개 항목');
        appController.updateDashboard(data);
        
        // 🔧 필터 옵션 업데이트 (드롭다운 메뉴 문제 해결)
        if (window.filterManager && typeof filterManager.updateFilterOptions === 'function') {
            filterManager.updateFilterOptions();
            debugLog('✅ 데이터 로드 후 필터 옵션 업데이트 완료');
        }
        
        // 🖼️ 이미지 미리 로드
        setTimeout(() => {
            const firstThreePages = data.slice(0, 60);
            imageCacheManager.preloadImages(firstThreePages);
        }, 1000);
        
        // 🏛️ 카테고리별 첫 페이지 미리 로드
        setTimeout(() => {
            preloadCategoryFirstPages(data);
        }, 3000); // 3초 후 시작
    });
    
    dataManager.addEventListener('dataUpdated', (data) => {
        console.log('📊 데이터 업데이트 이벤트 수신');
        appController.updateDashboard(data);
    });
    
    dataManager.addEventListener('statisticsChanged', (stats) => {
        console.log('📊 통계 변경 이벤트 수신:', stats);
        appController.updateStats(dataManager.heritageData);
    });
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 🚨 중요: 해시 변경 이벤트 디버깅
    window.addEventListener('hashchange', () => {
        debugLog('🔗 Hash 변경됨:', window.location.hash);
        logCurrentState();
    });
    
    // 초기 라우팅
    router.handleRoute();
    
    debugLog('✅ 애플리케이션 초기화 완료');
});

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 글로벌 검색
    const globalSearch = document.getElementById('globalSearch');
    const searchOption = document.getElementById('searchOption');
    
    if (globalSearch) {
        globalSearch.addEventListener('input', debounce((e) => {
            const query = e.target.value.trim();
            const searchType = searchOption ? searchOption.value : 'title+description';
            if (query) {
                searchPage.performGlobalSearch(query, searchType);
            }
        }, 300));
        
        globalSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                const searchType = searchOption ? searchOption.value : 'title+description';
                if (query) {
                    router.navigate(`search/${encodeURIComponent(query)}`);
                }
            }
        });
    }
    
    // 검색 옵션 변경 시 즉시 검색 실행
    if (searchOption) {
        searchOption.addEventListener('change', () => {
            const query = globalSearch ? globalSearch.value.trim() : '';
            if (query) {
                searchPage.performGlobalSearch(query, searchOption.value);
            }
        });
    }
    
    // 필터 이벤트
    const categoryFilter = document.getElementById('category-filter');
    const locationFilter = document.getElementById('location-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    if (locationFilter) {
        locationFilter.addEventListener('change', applyFilters);
    }
    
    // 뷰 모드 전환
    const gridViewBtn = document.getElementById('grid-view-btn');
    const listViewBtn = document.getElementById('list-view-btn');
    
    if (gridViewBtn && listViewBtn) {
        gridViewBtn.addEventListener('change', () => {
            if (gridViewBtn.checked) {
                homePage.toggleViewMode('grid');
            }
        });
        
        listViewBtn.addEventListener('change', () => {
            if (listViewBtn.checked) {
                homePage.toggleViewMode('list');
            }
        });
    }
}

/**
 * 필터 적용
 */
async function applyFilters() {
    currentPage = 1;
    
    // 4축 필터링 시스템 사용
    if (dataManager && typeof dataManager.applyFilters === 'function') {
        dataManager.applyFilters();
    }
    
    await homePage.loadHeritageList();
    
    // 필터 적용 후 건수 업데이트
    setTimeout(() => {
        updateResultsCount();
    }, 100);
}

/**
 * 필터 초기화
 */
async function resetFilters() {
    document.getElementById('category-filter').value = '';
    document.getElementById('location-filter').value = '';
    document.getElementById('globalSearch').value = '';
    currentPage = 1;
    await homePage.loadHeritageList();
}

/**
 * 결과 개수 업데이트
 */
function updateResultsCount() {
    if (dataManager && typeof dataManager.updateResultsCount === 'function') {
        dataManager.updateResultsCount();
    } else {
        const currentData = dataManager.getCurrentData();
        const count = currentData ? currentData.length : dataManager.heritageData.length;
        
        console.log('🔢 결과 개수 업데이트:', count);
        
        // 여러 가능한 요소 ID들에 대해 업데이트 시도
        const possibleIds = [
            'results-title', 'results-count', 'total-results', 
            'heritage-count', 'filtered-count', 'display-count'
        ];
        
        possibleIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'results-title') {
                    element.textContent = `📋 문화재 목록 (${count.toLocaleString()}개)`;
                } else {
                    element.textContent = count.toLocaleString();
                }
                console.log(`✅ ${id} 업데이트: ${count.toLocaleString()}`);
            }
        });
        
        // 클래스 기반으로도 찾기
        const countElements = document.querySelectorAll('.results-count, .heritage-count, .total-count');
        countElements.forEach(element => {
            element.textContent = count.toLocaleString();
        });
    }
}

/**
 * 카테고리별 첫 페이지 미리 로드
 */
async function preloadCategoryFirstPages(data) {
    console.log('🏛️ 카테고리별 첫 페이지 미리 로드 시작');
    
    const categories = ['국보', '보물', '사적', '명승', '천연기념물', '국가무형문화재'];
    
    for (const category of categories) {
        try {
            const categoryItems = data.filter(item => item.category === category);
            if (categoryItems.length > 0) {
                // 첫 페이지만 미리 로드 (20개)
                const firstPageItems = categoryItems.slice(0, 20);
                console.log(`📦 ${category} 카테고리 첫 페이지 미리 로드: ${firstPageItems.length}개`);
                
                // 이미지 미리 로드
                await imageCacheManager.preloadImages(firstPageItems);
                
                // 잠시 대기 (브라우저 블로킹 방지)
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } catch (error) {
            console.warn(`${category} 카테고리 미리 로드 실패:`, error);
        }
    }
    
    console.log('✅ 카테고리별 첫 페이지 미리 로드 완료');
}

/**
 * 유틸리티 함수들
 */

// Debounce 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 엘리먼트 업데이트
function updateElement(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
    }
}

// 🚨 중요: 디버깅을 위한 전역 상태 로깅 함수
window.logCurrentState = function() {
    console.log('=== 현재 상태 ===');
    console.log('현재 페이지:', currentPage);
    console.log('로딩 중:', isLoading);
    console.log('URL 해시:', window.location.hash);
    console.log('라우터 로딩 중:', router.isLoading);
    console.log('데이터 매니저 로딩 중:', dataManager.isLoading);
    console.log('데이터 로드됨:', dataManager.isLoaded);
    console.log('총 데이터 수:', dataManager.heritageData?.length || 0);
    console.log('=================');
};

// 이벤트 방지
document.addEventListener('click', (e) => {
    if (e.target.closest('a[href="#"]')) {
        e.preventDefault();
    }
});

// 🔥 전역 에러 핸들러 추가
window.addEventListener('error', (event) => {
    console.error('전역 에러 캐치:', event.error);
    Renderer.showErrorMessage('예상치 못한 오류가 발생했습니다.');
});

/**
 * 대시보드 업데이트 함수
 */
async function updateDashboard() {
    // 데이터 매니저가 준비될 때까지 기다리기
    await dataManager.waitForData();
    
    const stats = dataManager.getStatistics();
    
    console.log('📊 대시보드 업데이트:', stats);
    
    // 메인 통계 업데이트
    updateElement('total-count', stats.total.toLocaleString());
    updateElement('national-count', stats.categories['국보'] || 0);
    updateElement('treasure-count', stats.categories['보물'] || 0);
    updateElement('location-count', stats.locationCount);
    
    // 히어로 섹션 통계 업데이트
    updateElement('hero-total-count', stats.total.toLocaleString());
    
    // 카테고리별 통계
    updateElement('site-count', (stats.categories['사적'] || 0) + (stats.categories['명승'] || 0));
    updateElement('natural-count', stats.categories['천연기념물'] || 0);
    
    // 탐색 카드 카운트 업데이트
    updateElement('explore-national-count', (stats.categories['국보'] || 0) + '건');
    updateElement('explore-treasure-count', (stats.categories['보물'] || 0) + '건');
    updateElement('explore-historic-count', (stats.categories['사적'] || 0) + '건');
    updateElement('explore-scenic-count', (stats.categories['명승'] || 0) + '건');
    updateElement('explore-natural-count', (stats.categories['천연기념물'] || 0) + '건');
    updateElement('explore-intangible-count', (stats.categories['국가무형문화재'] || 0) + '건');
    
    // 사이드바 통계 업데이트
    updateElement('sidebar-total', stats.total);
    
    // 번역률 계산 및 업데이트
    updateTranslationRate();
    
    // 미분류 항목 통계 업데이트
    updateUnclassifiedStats();
    
    // 결과 개수 실시간 업데이트
    updateResultsCount();
    
    // 애니메이션 효과
    animateNumbers();
    
    // 대시보드 업데이트 완료 이벤트 발생
    console.log('✅ 대시보드 업데이트 완료');
}

/**
 * 번역률 업데이트 함수
 */
function updateTranslationRate() {
    if (dataManager && typeof dataManager.getTranslationStats === 'function') {
        const translationStats = dataManager.getTranslationStats();
        const rate = translationStats.rate || 0;
        
        // 번역률 표시 업데이트
        updateElement('translation-rate', `${rate.toFixed(1)}%`);
    }
}

/**
 * 미분류 항목 통계 업데이트
 */
function updateUnclassifiedStats() {
    if (dataManager && typeof dataManager.getUnclassifiedStats === 'function') {
        const unclassifiedStats = dataManager.getUnclassifiedStats();
        
        // 안전한 속성 접근
        if (unclassifiedStats && typeof unclassifiedStats === 'object') {
            updateElement('unclassified-count', (unclassifiedStats.total || 0).toLocaleString());
            updateElement('unclassified-sido-count', (unclassifiedStats.byType?.sidoType || 0).toLocaleString());
            updateElement('unclassified-category-count', (unclassifiedStats.byType?.sidoFolklore || 0).toLocaleString());
            updateElement('cultural-data-count', (unclassifiedStats.byType?.culturalData || 0).toLocaleString());
            updateElement('others-count', (unclassifiedStats.byType?.others || 0).toLocaleString());
        } else {
            // 기본값 설정
            updateElement('unclassified-count', '0');
            updateElement('unclassified-sido-count', '0');
            updateElement('unclassified-category-count', '0');
            updateElement('cultural-data-count', '0');
            updateElement('others-count', '0');
        }
    }
}

/**
 * 숫자 애니메이션 효과
 */
function animateNumbers() {
    // 숫자 애니메이션 효과를 위한 클래스 추가
    const numberElements = document.querySelectorAll('.count-number, .stat-number');
    numberElements.forEach(element => {
        element.classList.add('animate-number');
    });
}