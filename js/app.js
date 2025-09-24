/**
 * 메인 애플리케이션 - 초기화 및 전역 관리
 */

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
    
    // 🖼️ 이미지 미리 로드 (첫 3페이지)
    setTimeout(() => {
        const firstThreePages = dataManager.heritageData.slice(0, 60); // 20 * 3 = 60개
        imageCacheManager.preloadImages(firstThreePages);
    }, 2000); // 2초 후 시작 (초기 로딩 완료 후)
    
    // 데이터 변경 이벤트 리스너 설정
    dataManager.addEventListener('dataLoaded', (data) => {
        console.log('📊 데이터 로딩 완료 이벤트 수신:', data.length, '개 항목');
        appController.updateDashboard(data);
        
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