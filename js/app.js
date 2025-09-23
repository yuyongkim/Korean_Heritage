// 🚨 긴급 성능 복구 - 과도한 로깅 제거
// 🔥 1단계: 로깅 레벨 조정 (중앙화된 설정 사용)
// DEBUG_MODE와 debugLog는 config.js에서 가져옴

/**
 * 메인 애플리케이션 - 뷰 컨트롤러 및 이벤트 핸들러
 */

// 전역 변수
let currentPage = 1;
const itemsPerPage = 20;
let isLoading = false;

// 🚀 성능 최적화: 중복 호출 방지 시스템
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
 * 애플리케이션 초기화
 */
document.addEventListener('DOMContentLoaded', async () => {
    debugLog('🚀 애플리케이션 시작...');
    debugLog('전역 객체들 확인:', {
        dataManager: typeof dataManager,
        router: typeof router,
        i18n: typeof i18n,
        imageResolver: typeof imageResolver,
        mapManager: typeof mapManager
    });
    
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
    
    // 🚨 중요: 페이지 로딩 타임아웃 설정 (10초)
    window.setLoadingTimeout = function() {
        setTimeout(() => {
            if (isLoading) {
                console.error('⚠️ 10초 타임아웃: 강제로 로딩 상태 해제');
                isLoading = false;
                showErrorMessage('페이지 로딩이 너무 오래 걸립니다. 새로고침을 시도해보세요.');
            }
        }, 10000);
    };
    
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
                performGlobalSearch(query, searchType);
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
                performGlobalSearch(query, searchOption.value);
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
                toggleViewMode('grid');
            }
        });
        
        listViewBtn.addEventListener('change', () => {
            if (listViewBtn.checked) {
                toggleViewMode('list');
            }
        });
    }
}

/**
 * 대시보드 업데이트
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
    
    // 4축 필터링 시스템 업데이트는 초기 로딩 시에만 실행
    // if (dataManager && typeof dataManager.updateFilters === 'function') {
    //     dataManager.updateFilters();
    // }
    
    // 결과 개수 실시간 업데이트
    updateResultsCount();
    
    // 애니메이션 효과
    animateNumbers();
    
    // 대시보드 업데이트 완료 이벤트 발생
    console.log('✅ 대시보드 업데이트 완료');
}

/**
 * 결과 개수 업데이트
 */
function updateResultsCount() {
    // dataManager의 함수를 사용하거나 직접 구현
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
 * 숫자 애니메이션
 */
function animateNumbers() {
    const counters = document.querySelectorAll('.stat-number, .category-count');
    counters.forEach(counter => {
        const target = parseInt(counter.textContent.replace(/,/g, '')) || 0;
        const increment = target / 50;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                counter.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current).toLocaleString();
            }
        }, 40);
    });
}

/**
 * 뷰 모드 전환 (그리드/리스트)
 */
async function toggleViewMode(mode) {
    const gridContainer = document.getElementById('heritage-grid');
    const tableContainer = document.getElementById('heritage-table');
    
    if (mode === 'grid') {
        gridContainer.style.display = 'block';
        tableContainer.style.display = 'none';
    } else {
        gridContainer.style.display = 'none';
        tableContainer.style.display = 'block';
    }
    
    // 현재 페이지의 데이터를 다시 렌더링
    await loadHeritageList();
}

/**
 * 문화재 목록 로드
 */
async function loadHeritageList(searchQuery = '') {
    // 데이터 매니저가 준비될 때까지 기다리기
    await dataManager.waitForData();
    
    const query = searchQuery || document.getElementById('globalSearch')?.value || '';
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    const locationFilter = document.getElementById('location-filter')?.value || '';
    const searchOption = document.getElementById('searchOption')?.value || 'title+description';
    
    console.log('문화재 목록 로드 시작:', { query, categoryFilter, locationFilter, currentPage });
    
    try {
        // 검색 및 필터링
        const results = dataManager.search(query, categoryFilter, locationFilter, searchOption);
        
        // 🚨 중요: 빈 결과 처리
        if (!results || results.length === 0) {
            console.log('검색 결과가 없습니다');
            renderHeritageList([]);
            renderPagination(1, 1, 0);
            return;
        }
        
        // 🚀 최적화된 페이지네이션 (캐싱 사용)
        const paginationData = getPaginatedData(results, currentPage);
        
        if (!paginationData) {
            console.warn('페이지네이션 데이터 없음');
            renderHeritageList([]);
            return;
        }
        
        console.log(`🚀 페이지 데이터 로드 완료: ${paginationData.items.length}개 항목 (${paginationData.currentPage}/${paginationData.totalPages})`);
        
        // 목록 렌더링
        renderHeritageList(paginationData.items);
        
        // 페이지네이션 렌더링
        renderPagination(paginationData.currentPage, paginationData.totalPages, paginationData.totalItems, 'pagination');
        
    } catch (error) {
        console.error('문화재 목록 로드 오류:', error);
        showErrorMessage('문화재 목록을 불러오는 중 오류가 발생했습니다.');
    }
}

/**
 * 문화재 목록 렌더링 (뷰 모드에 따라)
 */
function renderHeritageList(items) {
    // 현재 뷰 모드 확인
    const isGridView = document.getElementById('grid-view-btn')?.checked !== false;
    
    if (items.length === 0) {
        const emptyState = `
            <div class="col-12 text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4>검색 결과가 없습니다</h4>
                    <p class="text-muted">다른 검색어나 필터를 시도해보세요.</p>
                </div>
            </div>
        `;
        
        if (isGridView) {
            document.getElementById('heritage-grid').innerHTML = emptyState;
        } else {
            document.getElementById('heritage-list-tbody').innerHTML = `
                <tr><td colspan="6" class="text-center py-5">
                    <div class="empty-state">
                        <i class="fas fa-search fa-2x text-muted mb-2"></i>
                        <h5>검색 결과가 없습니다</h5>
                        <p class="text-muted mb-0">다른 검색어나 필터를 시도해보세요.</p>
                    </div>
                </td></tr>
            `;
        }
        return;
    }
    
    if (isGridView) {
        renderGridView(items);
    } else {
        renderListView(items);
    }
}

/**
 * 그리드 뷰 렌더링
 */
function renderGridView(items) {
    const container = document.getElementById('heritage-grid');
    if (!container) return;
    
    container.innerHTML = items.map(item => `
        <div class="heritage-grid-item">
            <div class="card heritage-card h-100" onclick="viewHeritageDetail('${item.name}')">
                <div class="card-img-top heritage-image">
                    ${item.image_url ? 
                        `<img src="${imageCacheManager.getCachedImageUrl(item.image_url)}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.classList.add('no-image')">` : 
                        `<div class="no-image-placeholder"><i class="fas fa-image"></i><span>이미지 없음</span></div>`
                    }
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge category-badge category-${item.category}">${item.category}</span>
                        <small class="text-muted">${item.location}</small>
                    </div>
                    <h6 class="card-title">${item.name}</h6>
                    <p class="card-text text-truncate-2">
                        ${dataManager.currentLanguage === 'ko' 
                            ? (item.korean_description ? item.korean_description.substring(0, 100) + '...' : '설명 없음')
                            : (item.english_description ? item.english_description.substring(0, 100) + '...' : '영문 설명 준비 중...')
                        }
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${item.period || '시대 정보 없음'}</small>
                        <small class="text-primary">${item.designation_no || ''}</small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * 리스트 뷰 렌더링
 */
function renderListView(items) {
    const tbody = document.getElementById('heritage-list-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = items.map(item => `
        <tr class="heritage-list-row" onclick="viewHeritageDetail('${item.name}')" style="cursor: pointer;">
            <td>
                <div class="heritage-list-image">
                    ${item.image_url ? 
                        `<img src="${imageCacheManager.getCachedImageUrl(item.image_url)}" alt="${item.name}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" crossorigin="anonymous">` : 
                        ''
                    }
                    <div class="no-image-mini ${item.image_url ? 'd-none' : 'd-flex'}" style="width: 60px; height: 60px; background: #f8f9fa; border-radius: 0.375rem; align-items: center; justify-content: center; color: #6c757d; font-size: 0.8rem;">
                        <i class="fas fa-image"></i>
                    </div>
                </div>
            </td>
            <td>
                <div class="fw-semibold text-primary">${item.name}</div>
                ${item.designation_no ? `<small class="text-muted">${item.designation_no}</small>` : ''}
            </td>
            <td>
                <span class="badge category-badge category-${item.category}">${item.category}</span>
            </td>
            <td>
                <span class="text-muted">${item.location || '정보 없음'}</span>
                ${item.period ? `<br><small class="text-muted">${item.period}</small>` : ''}
            </td>
            <td>
                <div class="heritage-list-desc">
                    ${dataManager.currentLanguage === 'ko' 
                        ? (item.korean_description ? item.korean_description.substring(0, 150) + '...' : '설명 없음')
                        : (item.english_description ? item.english_description.substring(0, 150) + '...' : '영문 설명 준비 중...')
                    }
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); viewHeritageDetail('${item.name}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * 카테고리명 영문 변환
 */
function getCategoryEnglishName(category) {
    const categoryMap = {
        '국보': 'National Treasure',
        '보물': 'Treasure',
        '사적': 'Historic Site',
        '명승': 'Scenic Site',
        '천연기념물': 'Natural Monument',
        '국가무형문화재': 'Intangible Cultural Heritage'
    };
    return categoryMap[category] || category;
}

/**
 * English 카운트 업데이트
 */
function updateEnglishCount(count) {
    const countElement = document.getElementById('english-count');
    if (countElement) {
        countElement.textContent = count.toLocaleString();
    }
}

/**
 * English 지역 필터 설정
 */
function setupEnglishLocationFilter(items) {
    const locationFilter = document.getElementById('english-location-filter');
    if (!locationFilter) return;
    
    // 고유한 지역 목록 추출
    const locations = [...new Set(items
        .map(item => item.location)
        .filter(location => location && location.trim())
    )].sort();
    
    // 옵션 생성
    locationFilter.innerHTML = '<option value="">All Regions</option>' + 
        locations.map(location => `<option value="${location}">${location}</option>`).join('');
}

/**
 * English 페이지 이벤트 리스너 설정
 */
function setupEnglishEventListeners() {
    // 뷰 모드 전환
    const gridBtn = document.getElementById('english-grid-btn');
    const listBtn = document.getElementById('english-list-btn');
    
    if (gridBtn && listBtn) {
        gridBtn.addEventListener('change', () => {
            if (gridBtn.checked) {
                renderEnglishContent();
            }
        });
        
        listBtn.addEventListener('change', () => {
            if (listBtn.checked) {
                renderEnglishContent();
            }
        });
    }
    
    // 필터들
    const categoryFilter = document.getElementById('english-category-filter');
    const locationFilter = document.getElementById('english-location-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentEnglishPage = 1; // 첫 페이지로 리셋
            renderEnglishContent();
        });
    }
    
    if (locationFilter) {
        locationFilter.addEventListener('change', () => {
            currentEnglishPage = 1; // 첫 페이지로 리셋
            renderEnglishContent();
        });
    }
}

/**
 * English 페이지네이션 렌더링
 */
function renderEnglishPagination(current, totalPages, totalItems) {
    const paginationContainer = document.getElementById('english-pagination');
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 이전 버튼
    paginationHTML += `
        <li class="page-item ${current <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeEnglishPage(${current - 1}); return false;">Previous</a>
        </li>
    `;
    
    // 페이지 번호
    const maxVisible = 5;
    let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === current ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changeEnglishPage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // 다음 버튼
    paginationHTML += `
        <li class="page-item ${current >= totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeEnglishPage(${current + 1}); return false;">Next</a>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * English 페이지 변경
 */
function changeEnglishPage(page) {
    currentEnglishPage = page;
    renderEnglishContent();
}

/**
 * 🚀 최적화된 페이지네이션 렌더링 (PaginationManager 사용)
 */
function renderPagination(current, total, totalItems, containerId = 'pagination') {
    const container = document.getElementById(containerId);
    if (!container || total <= 1) {
        if (container) container.innerHTML = '';
        return;
    }
    

    const html = paginationManager.generatePaginationHTML(current, total, totalItems);

    container.innerHTML = html;
}

/**
 * 문화재 상세 정보 로드
 */
async function loadHeritageDetail(name) {
    // 데이터 매니저가 준비될 때까지 기다리기
    await dataManager.waitForData();
    
    const item = dataManager.getByName(name);
    if (!item) {
        console.error('문화재를 찾을 수 없습니다:', name);
        // 홈으로 리다이렉트하지 않고 에러 페이지 표시
        showHeritageNotFound(name);
        return;
    }
    
    renderHeritageDetail(item);
}

/**
 * 상세 뷰 로드 (라우터에서 호출)
 */
async function loadDetailView(itemId) {
    console.log('🔍 상세뷰 로드 요청:', itemId);
    
    // 데이터 매니저가 준비될 때까지 기다리기
    await dataManager.waitForData();
    
    // 다양한 방식으로 아이템 찾기
    let item = null;
    
    // 1. composite_key로 찾기 시도
    item = dataManager.heritageData.find(data => 
        data.composite_key === itemId
    );
    
    // 2. name으로 찾기 시도
    if (!item) {
        item = dataManager.heritageData.find(data => 
            data.name === itemId
        );
    }
    
    // 3. URL 디코딩된 이름으로 찾기 시도
    if (!item) {
        try {
            const decodedId = decodeURIComponent(itemId);
            item = dataManager.heritageData.find(data => 
                data.name === decodedId
            );
        } catch (e) {
            console.log('URL 디코딩 실패:', e);
        }
    }
    
    if (!item) {
        console.error('❌ 문화재를 찾을 수 없습니다:', itemId);
        showHeritageNotFound(itemId);
        return;
    }
    
    console.log('✅ 문화재 발견:', item.name);
    renderHeritageDetail(item);
}

// 전역으로 함수 등록
window.loadDetailView = loadDetailView;

/**
 * 리스트 뷰 로드 (페이지 파라미터 지원)
 */
async function loadListView(page = 1, params = {}) {
    console.log('📋 리스트 뷰 로드:', page, params);
    
    // 현재 페이지 업데이트
    currentPage = page;
    
    // 헤리티지 리스트 로드
    await loadHeritageList();
}

// 전역으로 함수 등록
window.loadListView = loadListView;

/**
 * 문화재를 찾을 수 없을 때 표시할 페이지
 */
function showHeritageNotFound(name) {
    const detailView = document.getElementById('detail-view');
    if (!detailView) return;
    
    // 상세 뷰 표시
    router.showView('detail-view');
    
    // 에러 메시지 표시
    const mainContent = detailView.querySelector('.col-lg-8');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="heritage-not-found text-center py-5">
                <div class="container">
                    <i class="fas fa-search fa-3x text-muted mb-4"></i>
                    <h2 class="mb-3">문화재를 찾을 수 없습니다</h2>
                    <p class="text-muted mb-4">
                        요청하신 문화재 "<strong>${name}</strong>"를 찾을 수 없습니다.<br>
                        문화재 이름이 변경되었거나 삭제되었을 수 있습니다.
                    </p>
                    <div class="d-flex gap-3 justify-content-center">
                        <button class="btn btn-primary" onclick="router.navigate('list')">
                            <i class="fas fa-list me-2"></i>전체 목록 보기
                        </button>
                        <button class="btn btn-outline-primary" onclick="router.navigate('home')">
                            <i class="fas fa-home me-2"></i>홈으로 이동
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * 문화재 상세 정보 렌더링
 */
function renderHeritageDetail(item) {
    // 헤더 영역 추가 (제목과 카테고리)
    const mainContent = document.querySelector('#detail-view .col-lg-8');
    if (mainContent) {
        // 기존 헤더가 있으면 제거
        const existingHeader = mainContent.querySelector('.heritage-detail-header');
        if (existingHeader) {
            existingHeader.remove();
        }

        // 새 헤더 추가
        const headerHTML = `
            <div class="heritage-detail-header mb-4">
                <div class="container-fluid">
                    <div class="row align-items-center">
                        <div class="col">
                            <h1 class="heritage-title">${item.name}</h1>
                            <div class="heritage-subtitle">
                                <span class="heritage-badge me-2">${item.kdcd_name || item.category}</span>
                                ${item.ctcd_name ? `<span class="heritage-location me-2">${item.ctcd_name}</span>` : ''}
                                ${item.composite_key ? `<span class="heritage-designation">${item.composite_key}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.insertAdjacentHTML('afterbegin', headerHTML);
    }

    // 이미지 영역
    const imageContainer = document.getElementById('heritage-image');
    if (imageContainer) {
        // Handle both raw data format (imageUrl) and transformed format (image_url)
        const imageUrl = item.imageUrl || item.image_url || '';
        if (imageUrl && imageUrl.trim() !== '') {
            imageContainer.innerHTML = `
                <div class="heritage-image-wrapper">
                    <img src="${imageCacheManager.getCachedImageUrl(imageUrl)}" alt="${item.name}" class="heritage-main-image" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="heritage-image-placeholder d-none" style="min-height: 400px;">
                        <div class="text-center text-muted">
                            <i class="fas fa-image fa-3x mb-3" style="color: var(--primary);"></i>
                            <h5>이미지 로드 실패</h5>
                            <small>이미지를 불러올 수 없습니다</small>
                        </div>
                    </div>
                    <div class="heritage-image-overlay">
                        <button class="btn btn-light btn-sm" onclick="openImageModal('${imageUrl}', '${item.name}')">
                            <i class="fas fa-expand"></i> 확대보기
                        </button>
                    </div>
                </div>
            `;
        } else {
            imageContainer.innerHTML = `
                <div class="heritage-image-placeholder d-flex align-items-center justify-content-center" style="min-height: 400px;">
                    <div class="text-center text-muted">
                        <i class="fas fa-landmark fa-3x mb-3" style="color: var(--primary);"></i>
                        <h5>문화재 이미지</h5>
                        <small>이미지 정보가 없습니다</small>
                        <div class="mt-3">
                            <button class="btn btn-outline-primary btn-sm" onclick="requestImageUpload('${item.name}')">
                                <i class="fas fa-upload"></i> 이미지 업로드
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    // 설명 영역
    const descContainer = document.getElementById('heritage-description');
    if (descContainer) {
        updateHeritageDescription(item);
    }
    
    // 기본 정보 - 전통 스타일로 개선
    const infoContainer = document.getElementById('heritage-info');
    if (infoContainer) {
        infoContainer.innerHTML = `
            <div class="heritage-meta-item d-flex">
                <div class="heritage-meta-label"><i class="fas fa-tag me-2"></i>분류</div>
                <div class="heritage-meta-value">
                    <span class="badge category-badge category-${item.kdcd_name}">${item.kdcd_name}</span>
                </div>
            </div>
            ${item.composite_key ? `
            <div class="heritage-meta-item d-flex">
                <div class="heritage-meta-label"><i class="fas fa-certificate me-2"></i>식별번호</div>
                <div class="heritage-meta-value">${item.composite_key}</div>
            </div>
            ` : ''}
            ${item.key_asno ? `
            <div class="heritage-meta-item d-flex">
                <div class="heritage-meta-label"><i class="fas fa-hashtag me-2"></i>관리번호</div>
                <div class="heritage-meta-value">${item.key_asno}</div>
            </div>
            ` : ''}
            <div class="heritage-meta-item d-flex">
                <div class="heritage-meta-label"><i class="fas fa-map-marker-alt me-2"></i>소재지</div>
                <div class="heritage-meta-value">${item.ctcd_name}</div>
            </div>
            ${item.source_url ? `
            <div class="heritage-meta-item d-flex">
                <div class="heritage-meta-label"><i class="fas fa-external-link-alt me-2"></i>출처</div>
                <div class="heritage-meta-value">
                    <a href="${item.source_url}" target="_blank" class="text-primary">
                        문화재청 바로가기 <i class="fas fa-external-link-alt fa-sm"></i>
                    </a>
                </div>
            </div>
            ` : ''}
        `;
    }
    
    // 위치 정보와 지도 표시
    const locationContainer = document.getElementById('heritage-location');
    if (locationContainer) {
        locationContainer.innerHTML = `
            <p class="mb-2"><i class="fas fa-map-marker-alt text-primary me-2"></i>${item.ctcd_name}</p>
            ${item.longitude && item.latitude ? `
                <small class="text-muted">위도: ${item.latitude}, 경도: ${item.longitude}</small>
            ` : `
                <small class="text-muted">좌표 정보 없음</small>
            `}
        `;

        // 지도 표시 - Kakao Maps API 사용
        const mapContainer = document.getElementById('heritage-map');
        if (mapContainer && item.longitude && item.latitude) {
            // Kakao Maps API 사용
            mapManager.showMap('heritage-map', {
                lat: item.latitude,
                lng: item.longitude
            }, item.name);
        } else if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="fas fa-map-marked-alt fa-2x mb-2"></i>
                    <p>위치 정보가 없습니다</p>
                </div>
            `;
        }
    }
    
    // 관련 링크
    const linksContainer = document.getElementById('heritage-links');
    if (linksContainer) {
        linksContainer.innerHTML = `
            ${item.source_url ? `
                <a href="${item.source_url}" target="_blank" class="heritage-link d-block mb-2">
                    <i class="fas fa-external-link-alt me-2"></i>문화재청 상세 정보
                </a>
            ` : ''}
            <a href="#" class="heritage-link d-block mb-2">
                <i class="fas fa-share me-2"></i>공유하기
            </a>
            <a href="#" class="heritage-link d-block">
                <i class="fas fa-heart me-2"></i>즐겨찾기
            </a>
        `;
    }
    
    // 상세 페이지 언어 토글 이벤트 재설정
    setupDetailLanguageToggle(item);
}

/**
 * 문화재 설명 업데이트 (언어별)
 */
function updateHeritageDescription(item) {
    const container = document.getElementById('heritage-description');
    if (!container) return;
    
    const isKorean = dataManager.currentLanguage === 'ko';
    
    const description = isKorean 
        ? item.content 
        : (item.content_en || '영문 설명을 준비 중입니다.');
    
    // 문단 나누기 - 숫자와 단위 분리 방지
    let processedDescription = description
        .replace(/\n/g, '<br>')  // 기존 줄바꿈을 <br>로 변환
        .replace(/(\d+\.?\d*)\s*<br>\s*([a-zA-Z가-힣]+)/g, '$1$2')  // 숫자와 단위 사이 줄바꿈 제거
        .replace(/([가-힣])\s*<br>\s*([가-힣])/g, '$1 $2')  // 한글 단어 사이 줄바꿈을 공백으로
        .replace(/([가-힣]\.)\s*<br>\s*([가-힣])/g, '$1 $2')  // 문장 끝과 다음 문장 시작 사이 줄바꿈 제거
        .replace(/\s+/g, ' ');  // 연속된 공백을 하나로
    
    // 문장 단위로 나누기 (숫자.숫자 패턴 제외)
    const sentences = processedDescription
        .split(/(?<!\d)\.(?!\d)/)  // 숫자가 아닌 점에서만 분리
        .filter(s => s.trim().length > 0);
    
    container.innerHTML = sentences.map(s => `<p>${s.trim()}.</p>`).join('');
}

/**
 * 상세 페이지 언어 토글 설정
 */
function setupDetailLanguageToggle(item) {
    const detailLangButtons = document.querySelectorAll('input[name="detail-lang"]');
    detailLangButtons.forEach(button => {
        button.addEventListener('change', (e) => {
            const newLang = e.target.id === 'detail-lang-ko' ? 'ko' : 'en';
            dataManager.currentLanguage = newLang;
            updateHeritageDescription(item);
        });
    });
}

// 카테고리 페이지 전역 변수
let currentCategoryPage = 1;
let currentCategoryData = [];
let currentCategoryName = '';

/**
 * 카테고리별 뷰 로드
 */
async function loadCategoryView(category) {
    console.log('카테고리 뷰 로드 시작:', category);
    currentCategoryName = category;
    currentCategoryPage = 1;
    
    // 데이터 매니저가 준비될 때까지 기다리기
    await dataManager.waitForData();
    
    // 기본 데이터 로드
    const allItems = dataManager.getByCategory(category);
    console.log('카테고리 데이터:', category, '→', allItems.length, '건');
    currentCategoryData = allItems;
    
    // 제목 업데이트
    const titleElement = document.getElementById('category-title');
    if (titleElement) {
        titleElement.textContent = category;
    }
    
    // 카운트 업데이트
    updateCategoryCount(allItems.length);
    
    // 지역 필터 초기화
    setupCategoryLocationFilter(allItems);
    
    // 컨텐츠 렌더링
    renderCategoryContent();
    
    // 🖼️ 카테고리 이미지 미리 로드 (다음 페이지들) - CORS 문제 고려
    setTimeout(() => {
        const nextPages = allItems.slice(20, 60); // 2-3페이지
        if (nextPages.length > 0) {
            // 🚨 중요: CORS 문제로 인한 실패를 고려하여 배치 크기 줄임
            imageCacheManager.preloadBatchSize = 10; // 배치 크기 줄임
            imageCacheManager.preloadImages(nextPages);
        }
    }, 1000);
    
    // 이벤트 리스너 설정
    setupCategoryEventListeners();
    
    console.log('카테고리 뷰 로드 완료:', category);
}

// 전역으로 함수 등록
window.loadCategoryView = loadCategoryView;

/**
 * 카테고리 컨텐츠 렌더링
 */
async function renderCategoryContent() {
    console.log('카테고리 컨텐츠 렌더링 시작:', currentCategoryData.length, '건');
    
    // 🚨 중요: URL 업데이트 로직 제거 - 라우터에서 처리하도록 변경
    // URL 업데이트는 라우터에서 자동으로 처리되므로 여기서는 제거
    
    // 지역 필터 적용
    const locationFilter = document.getElementById('category-location-filter')?.value || '';
    let filteredData = currentCategoryData;
    
    if (locationFilter) {
        filteredData = currentCategoryData.filter(item => 
            item.ctcd_name && item.ctcd_name.includes(locationFilter)
        );
        console.log('지역 필터 적용:', locationFilter, '→', filteredData.length, '건');
    }
    
    // 페이지네이션
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentCategoryPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // 카운트 업데이트
    updateCategoryCount(filteredData.length);
    
    // 뷰 모드에 따라 렌더링
    const isGridView = document.getElementById('category-grid-btn')?.checked !== false;
    
    if (isGridView) {
        renderCategoryGridView(pageData);
        document.getElementById('category-grid').style.display = 'block';
        document.getElementById('category-table').style.display = 'none';
    } else {
        renderCategoryListView(pageData);
        document.getElementById('category-grid').style.display = 'none';
        document.getElementById('category-table').style.display = 'block';
    }
    
    // 페이지네이션 렌더링
    renderCategoryPagination(currentCategoryPage, totalPages, filteredData.length);
}

/**
 * 카테고리 컨텐츠만 렌더링 (URL 업데이트 없이)
 */
async function renderCategoryContentOnly() {
    console.log('카테고리 컨텐츠만 렌더링 시작:', currentCategoryData.length, '건');
    
    // 지역 필터 적용
    const locationFilter = document.getElementById('category-location-filter')?.value || '';
    let filteredData = currentCategoryData;
    
    if (locationFilter) {
        filteredData = currentCategoryData.filter(item => 
            item.ctcd_name && item.ctcd_name.includes(locationFilter)
        );
        console.log('지역 필터 적용:', locationFilter, '→', filteredData.length, '건');
    }
    
    // 페이지네이션
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentCategoryPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // 카운트 업데이트
    updateCategoryCount(filteredData.length);
    
    // 뷰 모드에 따라 렌더링
    const isGridView = document.getElementById('category-grid-btn')?.checked !== false;
    
    if (isGridView) {
        renderCategoryGridView(pageData);
        document.getElementById('category-grid').style.display = 'block';
        document.getElementById('category-table').style.display = 'none';
    } else {
        renderCategoryListView(pageData);
        document.getElementById('category-grid').style.display = 'none';
        document.getElementById('category-table').style.display = 'block';
    }
    
    // 페이지네이션 렌더링
    renderCategoryPagination(currentCategoryPage, totalPages, filteredData.length);
}

/**
 * 카테고리 그리드 뷰 렌더링
 */
function renderCategoryGridView(items) {
    const container = document.getElementById('category-grid');
    console.log('그리드 뷰 렌더링:', items.length, '건', 'container:', !!container);
    if (!container) {
        console.error('category-grid 컨테이너를 찾을 수 없음!');
        return;
    }
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4>해당 조건의 문화재가 없습니다</h4>
                    <p class="text-muted">다른 지역을 선택해보세요.</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="heritage-grid-item">
            <div class="card heritage-card h-100" onclick="viewHeritageDetail('${item.name}')">
                <div class="card-img-top heritage-image">
                    ${item.image_url ? 
                        `<img src="${imageCacheManager.getCachedImageUrl(item.image_url)}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.classList.add('no-image'); this.parentElement.innerHTML='<div class=\"no-image-placeholder\"><i class=\"fas fa-image\"></i><span>이미지 없음</span></div>';" onload="this.style.display='block';" crossorigin="anonymous">` : 
                        `<div class="no-image-placeholder"><i class="fas fa-image"></i><span>이미지 없음</span></div>`
                    }
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge category-badge category-${item.category}">${item.category}</span>
                        <small class="text-muted">${item.location || '지역 정보 없음'}</small>
                    </div>
                    <h6 class="card-title">${item.name}</h6>
                    <p class="card-text text-truncate-2">
                        ${dataManager.currentLanguage === 'ko' 
                            ? (item.korean_description ? item.korean_description.substring(0, 100) + '...' : '설명 없음')
                            : (item.english_description ? item.english_description.substring(0, 100) + '...' : '영문 설명 준비 중...')
                        }
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${item.period || '시대 정보 없음'}</small>
                        <small class="text-primary">${item.designation_no || ''}</small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * 카테고리 리스트 뷰 렌더링
 */
function renderCategoryListView(items) {
    const tbody = document.getElementById('category-list-tbody');
    if (!tbody) return;
    
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="5" class="text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-search fa-2x text-muted mb-2"></i>
                    <h5>해당 조건의 문화재가 없습니다</h5>
                    <p class="text-muted mb-0">다른 지역을 선택해보세요.</p>
                </div>
            </td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr class="heritage-list-row" onclick="viewHeritageDetail('${item.name}')" style="cursor: pointer;">
            <td>
                <div class="heritage-list-image">
                    ${item.image_url ? 
                        `<img src="${imageCacheManager.getCachedImageUrl(item.image_url)}" alt="${item.name}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" crossorigin="anonymous">` : 
                        ''
                    }
                    <div class="no-image-mini ${item.image_url ? 'd-none' : 'd-flex'}" style="width: 60px; height: 60px; background: #f8f9fa; border-radius: 0.375rem; align-items: center; justify-content: center; color: #6c757d; font-size: 0.8rem;">
                        <i class="fas fa-image"></i>
                    </div>
                </div>
            </td>
            <td>
                <div class="fw-semibold text-primary">${item.name}</div>
                ${item.designation_no ? `<small class="text-muted">${item.designation_no}</small>` : ''}
                ${item.period ? `<br><small class="text-muted">${item.period}</small>` : ''}
            </td>
            <td>
                <span class="text-muted">${item.location || '정보 없음'}</span>
            </td>
            <td>
                <div class="heritage-list-desc">
                    ${dataManager.currentLanguage === 'ko' 
                        ? (item.korean_description ? item.korean_description.substring(0, 150) + '...' : '설명 없음')
                        : (item.english_description ? item.english_description.substring(0, 150) + '...' : '영문 설명 준비 중...')
                    }
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); viewHeritageDetail('${item.name}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * 카테고리명 영문 변환
 */
function getCategoryEnglishName(category) {
    const categoryMap = {
        '국보': 'National Treasure',
        '보물': 'Treasure',
        '사적': 'Historic Site',
        '명승': 'Scenic Site',
        '천연기념물': 'Natural Monument',
        '국가무형문화재': 'Intangible Cultural Heritage'
    };
    return categoryMap[category] || category;
}

/**
 * English 카운트 업데이트
 */
function updateEnglishCount(count) {
    const countElement = document.getElementById('english-count');
    if (countElement) {
        countElement.textContent = count.toLocaleString();
    }
}

/**
 * English 지역 필터 설정
 */
function setupEnglishLocationFilter(items) {
    const locationFilter = document.getElementById('english-location-filter');
    if (!locationFilter) return;
    
    // 고유한 지역 목록 추출
    const locations = [...new Set(items
        .map(item => item.location)
        .filter(location => location && location.trim())
    )].sort();
    
    // 옵션 생성
    locationFilter.innerHTML = '<option value="">All Regions</option>' + 
        locations.map(location => `<option value="${location}">${location}</option>`).join('');
}

/**
 * English 페이지 이벤트 리스너 설정
 */
function setupEnglishEventListeners() {
    // 뷰 모드 전환
    const gridBtn = document.getElementById('english-grid-btn');
    const listBtn = document.getElementById('english-list-btn');
    
    if (gridBtn && listBtn) {
        gridBtn.addEventListener('change', () => {
            if (gridBtn.checked) {
                renderEnglishContent();
            }
        });
        
        listBtn.addEventListener('change', () => {
            if (listBtn.checked) {
                renderEnglishContent();
            }
        });
    }
    
    // 필터들
    const categoryFilter = document.getElementById('english-category-filter');
    const locationFilter = document.getElementById('english-location-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentEnglishPage = 1; // 첫 페이지로 리셋
            renderEnglishContent();
        });
    }
    
    if (locationFilter) {
        locationFilter.addEventListener('change', () => {
            currentEnglishPage = 1; // 첫 페이지로 리셋
            renderEnglishContent();
        });
    }
}

/**
 * English 페이지네이션 렌더링
 */
function renderEnglishPagination(current, totalPages, totalItems) {
    const paginationContainer = document.getElementById('english-pagination');
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 이전 버튼
    paginationHTML += `
        <li class="page-item ${current <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeEnglishPage(${current - 1}); return false;">Previous</a>
        </li>
    `;
    
    // 페이지 번호
    const maxVisible = 5;
    let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === current ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changeEnglishPage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // 다음 버튼
    paginationHTML += `
        <li class="page-item ${current >= totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeEnglishPage(${current + 1}); return false;">Next</a>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * English 페이지 변경
 */
function changeEnglishPage(page) {
    currentEnglishPage = page;
    renderEnglishContent();
}

/**
 * 카테고리 카운트 업데이트
 */
function updateCategoryCount(count) {
    const countElement = document.getElementById('category-count');
    if (countElement) {
        countElement.textContent = count.toLocaleString();
    }
}

/**
 * 카테고리 지역 필터 설정
 */
function setupCategoryLocationFilter(items) {
    const locationFilter = document.getElementById('category-location-filter');
    if (!locationFilter) return;
    
    // 고유한 지역 목록 추출
    const locations = [...new Set(items
        .map(item => item.location)
        .filter(location => location && location.trim())
    )].sort();
    
    // 옵션 생성
    locationFilter.innerHTML = '<option value="">모든 지역</option>' + 
        locations.map(location => `<option value="${location}">${location}</option>`).join('');
}

/**
 * 카테고리 페이지 이벤트 리스너 설정
 */
function setupCategoryEventListeners() {
    // 뷰 모드 전환
    const gridBtn = document.getElementById('category-grid-btn');
    const listBtn = document.getElementById('category-list-btn');
    
    if (gridBtn && listBtn) {
        gridBtn.addEventListener('change', () => {
            if (gridBtn.checked) {
                renderCategoryContent();
            }
        });
        
        listBtn.addEventListener('change', () => {
            if (listBtn.checked) {
                renderCategoryContent();
            }
        });
    }
    
    // 지역 필터
    const locationFilter = document.getElementById('category-location-filter');
    if (locationFilter) {
        locationFilter.addEventListener('change', () => {
            currentCategoryPage = 1; // 첫 페이지로 리셋
            renderCategoryContent();
        });
    }
}

/**
 * 카테고리 페이지네이션 렌더링
 */
function renderCategoryPagination(current, totalPages, totalItems) {
    const paginationContainer = document.getElementById('category-pagination');
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 이전 버튼
    paginationHTML += `
        <li class="page-item ${current <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeCategoryPage(${current - 1}); return false;">이전</a>
        </li>
    `;
    
    // 페이지 번호
    const maxVisible = 5;
    let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === current ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changeCategoryPage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // 다음 버튼
    paginationHTML += `
        <li class="page-item ${current >= totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeCategoryPage(${current + 1}); return false;">다음</a>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * 카테고리 페이지 변경
 */
async function changeCategoryPage(page) {
    // 🚨 중요: 로딩 중이면 무시
    if (isLoading) {
        console.log('이미 로딩 중이므로 카테고리 페이지 변경 무시:', page);
        return;
    }
    
    // 🚨 중요: 페이지 번호 유효성 검사
    if (page < 1 || isNaN(page)) {
        console.warn('유효하지 않은 카테고리 페이지 번호:', page);
        return;
    }
    
    // 🚨 중요: 현재 페이지와 동일하면 무시
    if (page === currentCategoryPage) {
        console.log('현재 카테고리 페이지와 동일하므로 무시:', page);
        return;
    }
    
    console.log(`카테고리 페이지 변경: ${currentCategoryPage} -> ${page}`);
    currentCategoryPage = page;
    isLoading = true;
    
    // 🚨 중요: 로딩 타임아웃 설정
    setLoadingTimeout();
    
    try {
        // 🚨 중요: router.navigate() 사용하여 무한 루프 방지
        const newUrl = `category/${currentCategoryName}/page/${page}`;
        router.navigate(newUrl);
        
        // 컨텐츠 렌더링 (URL 업데이트 없이)
        await renderCategoryContentOnly();
    } catch (error) {
        console.error('카테고리 페이지 로딩 오류:', error);
        showErrorMessage('카테고리 페이지를 불러오는 중 오류가 발생했습니다.');
    } finally {
        isLoading = false;
    }
}

// 전역으로 함수 등록
window.changeCategoryPage = changeCategoryPage;

// 🧪 테스트용 함수들
window.testPagination = function(page) {
    console.log('🧪 페이지네이션 테스트:', page);
    changeCategoryPage(page);
};

window.getCurrentRouteInfo = function() {
    const currentHash = window.location.hash.slice(1);
    console.log('📍 현재 라우트 정보:');
    console.log('- Hash:', currentHash);
    console.log('- Category Page:', currentCategoryPage);
    console.log('- Home Page:', currentPage);
    console.log('- English Page:', currentEnglishPage);
    console.log('- Unclassified Page:', currentUnclassifiedPage);
    return {
        hash: currentHash,
        categoryPage: currentCategoryPage,
        homePage: currentPage,
        englishPage: currentEnglishPage,
        unclassifiedPage: currentUnclassifiedPage
    };
};

// English 페이지 전역 변수
let currentEnglishPage = 1;
let currentEnglishData = [];

/**
 * English 페이지 로드
 */
async function loadEnglishView() {
    currentEnglishPage = 1;
    
    // 데이터 매니저가 준비될 때까지 기다리기
    await dataManager.waitForData();
    
    // 모든 데이터 로드 (영문 설명 유무 상관없이)
    const allItems = dataManager.heritageData;
    currentEnglishData = allItems;
    
    // 카운트 업데이트
    updateEnglishCount(allItems.length);
    
    // 지역 필터 초기화
    setupEnglishLocationFilter(allItems);
    
    // 컨텐츠 렌더링
    renderEnglishContent();
    
    // 이벤트 리스너 설정
    setupEnglishEventListeners();
}

/**
 * English 컨텐츠 렌더링
 */
async function renderEnglishContent() {
    // URL 업데이트 (페이지네이션을 위한)
    const newUrl = `english/page/${currentEnglishPage}`;
    console.log(`🛣️ English 페이지 URL 업데이트: ${window.location.hash.slice(1)} -> ${newUrl}`);
    router.navigate(newUrl);
    
    // 필터 적용
    const categoryFilter = document.getElementById('english-category-filter')?.value || '';
    const locationFilter = document.getElementById('english-location-filter')?.value || '';
    let filteredData = currentEnglishData;
    
    if (categoryFilter) {
        filteredData = filteredData.filter(item => item.category === categoryFilter);
    }
    
    if (locationFilter) {
        filteredData = filteredData.filter(item => 
            item.location && item.location.includes(locationFilter)
        );
    }
    
    // 페이지네이션
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentEnglishPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // 카운트 업데이트
    updateEnglishCount(filteredData.length);
    
    // 뷰 모드에 따라 렌더링
    const isGridView = document.getElementById('english-grid-btn')?.checked !== false;
    
    if (isGridView) {
        renderEnglishGridView(pageData);
        document.getElementById('english-grid').style.display = 'block';
        document.getElementById('english-table').style.display = 'none';
    } else {
        renderEnglishListView(pageData);
        document.getElementById('english-grid').style.display = 'none';
        document.getElementById('english-table').style.display = 'block';
    }
    
    // 페이지네이션 렌더링
    renderEnglishPagination(currentEnglishPage, totalPages, filteredData.length);
}

/**
 * English 컨텐츠만 렌더링 (URL 업데이트 없이)
 */
async function renderEnglishContentOnly() {
    // 필터 적용
    const categoryFilter = document.getElementById('english-category-filter')?.value || '';
    const locationFilter = document.getElementById('english-location-filter')?.value || '';
    let filteredData = currentEnglishData;
    
    if (categoryFilter) {
        filteredData = filteredData.filter(item => item.category === categoryFilter);
    }
    
    if (locationFilter) {
        filteredData = filteredData.filter(item => 
            item.location && item.location.includes(locationFilter)
        );
    }
    
    // 페이지네이션
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentEnglishPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // 카운트 업데이트
    updateEnglishCount(filteredData.length);
    
    // 뷰 모드에 따라 렌더링
    const isGridView = document.getElementById('english-grid-btn')?.checked !== false;
    
    if (isGridView) {
        renderEnglishGridView(pageData);
        document.getElementById('english-grid').style.display = 'block';
        document.getElementById('english-table').style.display = 'none';
    } else {
        renderEnglishListView(pageData);
        document.getElementById('english-grid').style.display = 'none';
        document.getElementById('english-table').style.display = 'block';
    }
    
    // 페이지네이션 렌더링
    renderEnglishPagination(currentEnglishPage, totalPages, filteredData.length);
}

/**
 * English 그리드 뷰 렌더링
 */
function renderEnglishGridView(items) {
    const container = document.getElementById('english-grid');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h4>No cultural heritage items found</h4>
                    <p class="text-muted">Try different filters or check back later.</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="heritage-grid-item">
            <div class="card heritage-card h-100" onclick="viewHeritageDetail('${item.name}')">
                <div class="card-img-top heritage-image">
                    ${item.image_url ? 
                        `<img src="${imageCacheManager.getCachedImageUrl(item.image_url)}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.classList.add('no-image')">` : 
                        `<div class="no-image-placeholder"><i class="fas fa-image"></i><span>No Image</span></div>`
                    }
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge category-badge category-${item.category}">${getCategoryEnglishName(item.category)}</span>
                        <small class="text-muted">${item.location || 'Unknown Region'}</small>
                    </div>
                    <h6 class="card-title">${item.name}</h6>
                    <p class="card-text text-truncate-2">
                        ${String(item.english_description || '').trim() 
                            ? String(item.english_description || '').substring(0, 100) + '...' 
                            : (item.korean_description ? '[Korean] ' + item.korean_description.substring(0, 80) + '...' : 'Description not available')
                        }
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${item.period || 'Period unknown'}</small>
                        <small class="text-primary">${item.designation_no || ''}</small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * English 리스트 뷰 렌더링
 */
function renderEnglishListView(items) {
    const tbody = document.getElementById('english-list-tbody');
    if (!tbody) return;
    
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-search fa-2x text-muted mb-2"></i>
                    <h5>No cultural heritage items found</h5>
                    <p class="text-muted mb-0">Try different filters or check back later.</p>
                </div>
            </td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr class="heritage-list-row" onclick="viewHeritageDetail('${item.name}')" style="cursor: pointer;">
            <td>
                <div class="heritage-list-image">
                    ${item.image_url ? 
                        `<img src="${imageCacheManager.getCachedImageUrl(item.image_url)}" alt="${item.name}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" crossorigin="anonymous">` : 
                        ''
                    }
                    <div class="no-image-mini ${item.image_url ? 'd-none' : 'd-flex'}" style="width: 60px; height: 60px; background: #f8f9fa; border-radius: 0.375rem; align-items: center; justify-content: center; color: #6c757d; font-size: 0.8rem;">
                        <i class="fas fa-image"></i>
                    </div>
                </div>
            </td>
            <td>
                <div class="fw-semibold text-primary">${item.name}</div>
                ${item.designation_no ? `<small class="text-muted">${item.designation_no}</small>` : ''}
                ${item.period ? `<br><small class="text-muted">${item.period}</small>` : ''}
            </td>
            <td>
                <span class="badge category-badge category-${item.category}">${getCategoryEnglishName(item.category)}</span>
            </td>
            <td>
                <span class="text-muted">${item.location || 'Unknown'}</span>
            </td>
            <td>
                <div class="heritage-list-desc">
                    ${String(item.english_description || '').trim()
                        ? String(item.english_description || '').substring(0, 150) + '...'
                        : (item.korean_description ? '[Korean] ' + item.korean_description.substring(0, 120) + '...' : 'Description not available')
                    }
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); viewHeritageDetail('${item.name}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * 카테고리명 영문 변환
 */
function getCategoryEnglishName(category) {
    const categoryMap = {
        '국보': 'National Treasure',
        '보물': 'Treasure',
        '사적': 'Historic Site',
        '명승': 'Scenic Site',
        '천연기념물': 'Natural Monument',
        '국가무형문화재': 'Intangible Cultural Heritage'
    };
    return categoryMap[category] || category;
}

/**
 * English 카운트 업데이트
 */
function updateEnglishCount(count) {
    const countElement = document.getElementById('english-count');
    if (countElement) {
        countElement.textContent = count.toLocaleString();
    }
}

/**
 * English 지역 필터 설정
 */
function setupEnglishLocationFilter(items) {
    const locationFilter = document.getElementById('english-location-filter');
    if (!locationFilter) return;
    
    // 고유한 지역 목록 추출
    const locations = [...new Set(items
        .map(item => item.location)
        .filter(location => location && location.trim())
    )].sort();
    
    // 옵션 생성
    locationFilter.innerHTML = '<option value="">All Regions</option>' + 
        locations.map(location => `<option value="${location}">${location}</option>`).join('');
}

/**
 * English 페이지 이벤트 리스너 설정
 */
function setupEnglishEventListeners() {
    // 뷰 모드 전환
    const gridBtn = document.getElementById('english-grid-btn');
    const listBtn = document.getElementById('english-list-btn');
    
    if (gridBtn && listBtn) {
        gridBtn.addEventListener('change', () => {
            if (gridBtn.checked) {
                renderEnglishContent();
            }
        });
        
        listBtn.addEventListener('change', () => {
            if (listBtn.checked) {
                renderEnglishContent();
            }
        });
    }
    
    // 필터들
    const categoryFilter = document.getElementById('english-category-filter');
    const locationFilter = document.getElementById('english-location-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentEnglishPage = 1; // 첫 페이지로 리셋
            renderEnglishContent();
        });
    }
    
    if (locationFilter) {
        locationFilter.addEventListener('change', () => {
            currentEnglishPage = 1; // 첫 페이지로 리셋
            renderEnglishContent();
        });
    }
}

/**
 * English 페이지네이션 렌더링
 */
function renderEnglishPagination(current, totalPages, totalItems) {
    const paginationContainer = document.getElementById('english-pagination');
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 이전 버튼
    paginationHTML += `
        <li class="page-item ${current <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeEnglishPage(${current - 1}); return false;">Previous</a>
        </li>
    `;
    
    // 페이지 번호
    const maxVisible = 5;
    let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === current ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changeEnglishPage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // 다음 버튼
    paginationHTML += `
        <li class="page-item ${current >= totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeEnglishPage(${current + 1}); return false;">Next</a>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * English 페이지 변경
 */
async function changeEnglishPage(page) {
    // 🚨 중요: 로딩 중이면 무시
    if (isLoading) {
        console.log('이미 로딩 중이므로 English 페이지 변경 무시:', page);
        return;
    }
    
    // 🚨 중요: 페이지 번호 유효성 검사
    if (page < 1 || isNaN(page)) {
        console.warn('유효하지 않은 English 페이지 번호:', page);
        return;
    }
    
    // 🚨 중요: 현재 페이지와 동일하면 무시
    if (page === currentEnglishPage) {
        console.log('현재 English 페이지와 동일하므로 무시:', page);
        return;
    }
    
    console.log(`English 페이지 변경: ${currentEnglishPage} -> ${page}`);
    currentEnglishPage = page;
    isLoading = true;
    
    // 🚨 중요: 로딩 타임아웃 설정
    setLoadingTimeout();
    
    try {
        // URL 직접 업데이트
        const newUrl = `english/page/${page}`;
        window.location.hash = newUrl;
        
        // 컨텐츠만 렌더링 (URL 업데이트 없이)
        await renderEnglishContentOnly();
    } catch (error) {
        console.error('English 페이지 로딩 오류:', error);
        showErrorMessage('English 페이지를 불러오는 중 오류가 발생했습니다.');
    } finally {
        isLoading = false;
    }
}

// 미분류 항목 페이지 전역 변수
let currentUnclassifiedPage = 1;
let currentUnclassifiedData = [];
let currentUnclassifiedType = 'all';

/**
 * 미분류 항목 뷰 로드
 */
async function loadUnclassifiedView(type = 'sido-type') {
    console.log('미분류 항목 뷰 로드:', type);
    currentUnclassifiedType = type;
    currentUnclassifiedPage = 1;
    
    // 데이터 매니저가 준비될 때까지 기다리기
    await dataManager.waitForData();
    
    // 미분류 항목 필터링
    const allItems = dataManager.heritageData;
    let filteredItems = [];
    
    if (type === 'sido-type') {
        // 시도유형문화재
        filteredItems = allItems.filter(item => 
            item.kdcd_name === '시도유형문화재'
        );
    } else if (type === 'sido-folklore') {
        // 시도민속문화재
        filteredItems = allItems.filter(item => 
            item.kdcd_name === '시도민속문화재'
        );
    } else if (type === 'cultural-data') {
        // 문화재자료
        filteredItems = allItems.filter(item => 
            item.kdcd_name === '문화재자료'
        );
    } else if (type === 'others') {
        // 기타 미분류 (실제로 분류가 안된 것들)
        filteredItems = allItems.filter(item => 
            item.kdcd_name === '미분류' || item.ctcd_name === '미분류' || 
            item.category === '미분류' || item.location === '미분류'
        );
    }
    
    console.log('미분류 항목 데이터:', type, '→', filteredItems.length, '건');
    currentUnclassifiedData = filteredItems;
    
    // 제목 업데이트
    const titleElement = document.getElementById('unclassified-title');
    if (titleElement) {
        const titles = {
            'sido-type': '시도유형문화재',
            'sido-folklore': '시도민속문화재',
            'cultural-data': '문화재자료',
            'others': '기타 미분류 항목'
        };
        titleElement.textContent = titles[type] || '미분류 항목';
    }
    
    // 카운트 업데이트
    updateUnclassifiedCount(filteredItems.length);
    
    // 컨텐츠 렌더링
    renderUnclassifiedContent();
    
    // 이벤트 리스너 설정
    setupUnclassifiedEventListeners();
}

// 전역으로 함수 등록
window.loadUnclassifiedView = loadUnclassifiedView;

/**
 * 미분류 항목 컨텐츠 렌더링
 */
async function renderUnclassifiedContent() {
    console.log('미분류 항목 컨텐츠 렌더링 시작:', currentUnclassifiedData.length, '건');
    
    // URL 업데이트 (페이지네이션을 위한)
    const newUrl = `unclassified/page/${currentUnclassifiedPage}`;
    console.log(`🛣️ 미분류 페이지 URL 업데이트: ${window.location.hash.slice(1)} -> ${newUrl}`);
    router.navigate(newUrl);
    
    // 페이지네이션
    const totalPages = Math.ceil(currentUnclassifiedData.length / itemsPerPage);
    const startIndex = (currentUnclassifiedPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = currentUnclassifiedData.slice(startIndex, endIndex);
    
    // 카운트 업데이트
    updateUnclassifiedCount(currentUnclassifiedData.length);
    
    // 뷰 모드에 따라 렌더링
    const isGridView = document.getElementById('unclassified-grid-btn')?.checked !== false;
    
    if (isGridView) {
        renderUnclassifiedGridView(pageData);
        document.getElementById('unclassified-grid').style.display = 'block';
        document.getElementById('unclassified-table').style.display = 'none';
    } else {
        renderUnclassifiedListView(pageData);
        document.getElementById('unclassified-grid').style.display = 'none';
        document.getElementById('unclassified-table').style.display = 'block';
    }
    
    // 페이지네이션 렌더링
    renderUnclassifiedPagination(currentUnclassifiedPage, totalPages, currentUnclassifiedData.length);
}

/**
 * 미분류 항목 그리드 뷰 렌더링
 */
function renderUnclassifiedGridView(items) {
    const container = document.getElementById('unclassified-grid');
    console.log('미분류 그리드 뷰 렌더링:', items.length, '건', 'container:', !!container);
    if (!container) {
        console.error('unclassified-grid 컨테이너를 찾을 수 없음!');
        return;
    }
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-question-circle fa-3x text-muted mb-3"></i>
                    <h4>미분류 항목이 없습니다</h4>
                    <p class="text-muted">모든 항목이 적절히 분류되었습니다.</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="heritage-grid-item">
            <div class="card heritage-card h-100" onclick="viewHeritageDetail('${item.name}')">
                <div class="card-img-top heritage-image">
                    ${item.image_url ? 
                        `<img src="${imageCacheManager.getCachedImageUrl(item.image_url)}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.classList.add('no-image')">` : 
                        `<div class="no-image-placeholder"><i class="fas fa-image"></i><span>이미지 없음</span></div>`
                    }
                </div>
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-warning text-dark">미분류</span>
                        <small class="text-muted">${item.location || '지역 정보 없음'}</small>
                    </div>
                    <h6 class="card-title">${item.name}</h6>
                    <p class="card-text text-truncate-2">
                        ${dataManager.currentLanguage === 'ko' 
                            ? (item.korean_description ? item.korean_description.substring(0, 100) + '...' : '설명 없음')
                            : (item.english_description ? item.english_description.substring(0, 100) + '...' : '영문 설명 준비 중...')
                        }
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">${item.period || '시대 정보 없음'}</small>
                        <small class="text-primary">${item.designation_no || ''}</small>
                    </div>
                    <div class="mt-2">
                        <small class="text-warning">
                            <i class="fas fa-exclamation-triangle me-1"></i>
                            ${getUnclassifiedReason(item)}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * 미분류 항목 리스트 뷰 렌더링
 */
function renderUnclassifiedListView(items) {
    const tbody = document.getElementById('unclassified-list-tbody');
    if (!tbody) return;
    
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-question-circle fa-2x text-muted mb-2"></i>
                    <h5>미분류 항목이 없습니다</h5>
                    <p class="text-muted mb-0">모든 항목이 적절히 분류되었습니다.</p>
                </div>
            </td></tr>
        `;
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr class="heritage-list-row" onclick="viewHeritageDetail('${item.name}')" style="cursor: pointer;">
            <td>
                <div class="heritage-list-image">
                    ${item.image_url ? 
                        `<img src="${imageCacheManager.getCachedImageUrl(item.image_url)}" alt="${item.name}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" crossorigin="anonymous">` : 
                        ''
                    }
                    <div class="no-image-mini ${item.image_url ? 'd-none' : 'd-flex'}" style="width: 60px; height: 60px; background: #f8f9fa; border-radius: 0.375rem; align-items: center; justify-content: center; color: #6c757d; font-size: 0.8rem;">
                        <i class="fas fa-image"></i>
                    </div>
                </div>
            </td>
            <td>
                <div class="fw-semibold text-primary">${item.name}</div>
                ${item.designation_no ? `<small class="text-muted">${item.designation_no}</small>` : ''}
                ${item.period ? `<br><small class="text-muted">${item.period}</small>` : ''}
            </td>
            <td>
                <span class="badge bg-warning text-dark">미분류</span>
                <br><small class="text-warning">${getUnclassifiedReason(item)}</small>
            </td>
            <td>
                <span class="text-muted">${item.location || '정보 없음'}</span>
            </td>
            <td>
                <div class="heritage-list-desc">
                    ${dataManager.currentLanguage === 'ko' 
                        ? (item.korean_description ? item.korean_description.substring(0, 150) + '...' : '설명 없음')
                        : (item.english_description ? item.english_description.substring(0, 150) + '...' : '영문 설명 준비 중...')
                    }
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); viewHeritageDetail('${item.name}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * 미분류 이유 반환
 */
function getUnclassifiedReason(item) {
    const reasons = [];
    
    if (item.kdcd_name === '미분류' || item.category === '미분류') {
        reasons.push('카테고리 미분류');
    }
    
    if (item.ctcd_name === '미분류' || item.location === '미분류') {
        reasons.push('지역 미분류');
    }
    
    return reasons.join(', ') || '분류 정보 없음';
}

/**
 * 미분류 항목 카운트 업데이트
 */
function updateUnclassifiedCount(count) {
    const countElement = document.getElementById('unclassified-count');
    if (countElement) {
        countElement.textContent = count.toLocaleString();
    }
}

/**
 * 미분류 항목 페이지 이벤트 리스너 설정
 */
function setupUnclassifiedEventListeners() {
    // 뷰 모드 전환
    const gridBtn = document.getElementById('unclassified-grid-btn');
    const listBtn = document.getElementById('unclassified-list-btn');
    
    if (gridBtn && listBtn) {
        gridBtn.addEventListener('change', () => {
            if (gridBtn.checked) {
                renderUnclassifiedContent();
            }
        });
        
        listBtn.addEventListener('change', () => {
            if (listBtn.checked) {
                renderUnclassifiedContent();
            }
        });
    }
    
    // 타입 필터
    const typeFilter = document.getElementById('unclassified-type-filter');
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            currentUnclassifiedPage = 1; // 첫 페이지로 리셋
            loadUnclassifiedView(typeFilter.value);
        });
    }
}

/**
 * 미분류 항목 페이지네이션 렌더링
 */
function renderUnclassifiedPagination(current, totalPages, totalItems) {
    const paginationContainer = document.getElementById('unclassified-pagination');
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 이전 버튼
    paginationHTML += `
        <li class="page-item ${current <= 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeUnclassifiedPage(${current - 1}); return false;">이전</a>
        </li>
    `;
    
    // 페이지 번호
    const maxVisible = 5;
    let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === current ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changeUnclassifiedPage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    // 다음 버튼
    paginationHTML += `
        <li class="page-item ${current >= totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changeUnclassifiedPage(${current + 1}); return false;">다음</a>
        </li>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * 미분류 항목 페이지 변경
 */
async function changeUnclassifiedPage(page) {
    // 🚨 중요: 로딩 중이면 무시
    if (isLoading) {
        console.log('이미 로딩 중이므로 미분류 페이지 변경 무시:', page);
        return;
    }
    
    // 🚨 중요: 페이지 번호 유효성 검사
    if (page < 1 || isNaN(page)) {
        console.warn('유효하지 않은 미분류 페이지 번호:', page);
        return;
    }
    
    // 🚨 중요: 현재 페이지와 동일하면 무시
    if (page === currentUnclassifiedPage) {
        console.log('현재 미분류 페이지와 동일하므로 무시:', page);
        return;
    }
    
    console.log(`미분류 페이지 변경: ${currentUnclassifiedPage} -> ${page}`);
    currentUnclassifiedPage = page;
    isLoading = true;
    
    // 🚨 중요: 로딩 타임아웃 설정
    setLoadingTimeout();
    
    try {
        // router.navigate()를 여기서 직접 호출하는 대신,
        // renderUnclassifiedContent가 URL을 처리하도록 둡니다.
        await renderUnclassifiedContent();
    } catch (error) {
        console.error('미분류 페이지 로딩 오류:', error);
        showErrorMessage('미분류 페이지를 불러오는 중 오류가 발생했습니다.');
    } finally {
        isLoading = false;
    }
}

// 전역으로 함수 등록
window.changeUnclassifiedPage = changeUnclassifiedPage;

/**
 * 번역률 계산 및 업데이트
 */
function updateTranslationRate() {
    if (!dataManager || !dataManager.heritageData || dataManager.heritageData.length === 0) {
        console.log('📊 번역률 계산: 데이터 없음');
        return;
    }
    
    const totalItems = dataManager.heritageData.length;
    const translatedItems = dataManager.heritageData.filter(item => {
        // 안전한 문자열 체크 및 변환
        const englishDesc = item.english_description;
        
        // null, undefined, 빈 문자열 체크
        if (!englishDesc) return false;
        
        // 문자열로 변환 후 trim (숫자나 다른 타입일 경우 대비)
        const descStr = String(englishDesc).trim();
        
        return descStr !== '' && 
               descStr !== 'null' && 
               descStr !== 'undefined' &&
               descStr !== '영문 설명 준비 중입니다.' &&
               !descStr.includes('Description not available');
    }).length;
    
    const translationRate = totalItems > 0 ? Math.round((translatedItems / totalItems) * 100) : 0;
    
    console.log(`📊 번역률 계산: ${translatedItems}/${totalItems} = ${translationRate}%`);
    
    // 번역률 업데이트
    updateElement('translation-rate', `${translationRate}%`);
    updateElement('hero-translation-rate', `${translationRate}%`);
    
    // 번역 완료 수 업데이트 (사이드바)
    updateElement('sidebar-translation-count', translatedItems);
    
    // 메인 대시보드 번역 완료 수 업데이트
    const translationCountElements = document.querySelectorAll('.stat-number');
    translationCountElements.forEach(element => {
        if (element.textContent.includes('AI 번역 완료') || element.textContent.includes('번역 완료율')) {
            element.textContent = `${translationRate}%`;
        }
    });
}

/**
 * 미분류 항목 통계 업데이트
 */
function updateUnclassifiedStats() {
    if (!dataManager || !dataManager.heritageData) return;
    
    const allItems = dataManager.heritageData;
    
    // 시도유형문화재 수
    const sidoTypeCount = allItems.filter(item => 
        item.kdcd_name === '시도유형문화재'
    ).length;
    
    // 시도민속문화재 수
    const sidoFolkloreCount = allItems.filter(item => 
        item.kdcd_name === '시도민속문화재'
    ).length;
    
    // 문화재자료 수
    const culturalDataCount = allItems.filter(item => 
        item.kdcd_name === '문화재자료'
    ).length;
    
    // 기타 미분류 수 (실제로 분류가 안된 것들)
    const othersCount = allItems.filter(item => 
        item.kdcd_name === '미분류' || item.ctcd_name === '미분류' || 
        item.category === '미분류' || item.location === '미분류'
    ).length;
    
    // 사이드바 배지 업데이트
    updateElement('sido-type-count', sidoTypeCount);
    updateElement('sido-folklore-count', sidoFolkloreCount);
    updateElement('cultural-data-count', culturalDataCount);
    updateElement('others-count', othersCount);
    
    console.log('미분류 항목 통계 업데이트:', {
        시도유형문화재: sidoTypeCount,
        시도민속문화재: sidoFolkloreCount,
        문화재자료: culturalDataCount,
        기타미분류: othersCount
    });
}

/**
 * 글로벌 검색 수행
 */
function performGlobalSearch(query, searchOption = 'title+description') {
    // 검색 옵션을 URL에 포함하여 전달
    const encodedQuery = encodeURIComponent(query);
    const encodedOption = encodeURIComponent(searchOption);
    router.navigate(`search/${encodedQuery}?option=${encodedOption}`);
}

/**
 * 검색 수행 (라우터에서 호출)
 */
async function performSearch(query, searchOption = 'title+description') {
    currentPage = 1;
    document.getElementById('globalSearch').value = query;
    
    // 검색 옵션 드롭다운 업데이트
    const searchOptionSelect = document.getElementById('searchOption');
    if (searchOptionSelect) {
        searchOptionSelect.value = searchOption;
    }
    
    await loadHeritageList(query);
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
    
    await loadHeritageList();
    
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
    await loadHeritageList();
}

/**
 * 페이지 변경
 */
async function changePage(page) {
    // 🚨 중요: 로딩 중이면 무시
    if (isLoading) {
        console.log('이미 로딩 중이므로 페이지 변경 무시:', page);
        return;
    }
    
    // 🚨 중요: 페이지 번호 유효성 검사
    if (page < 1 || isNaN(page)) {
        console.warn('유효하지 않은 페이지 번호:', page);
        return;
    }
    
    // 🚨 중요: 현재 페이지와 동일하면 무시
    if (page === currentPage) {
        console.log('현재 페이지와 동일하므로 무시:', page);
        return;
    }
    
    console.log(`페이지 변경: ${currentPage} -> ${page}`);
    currentPage = page;
    isLoading = true;
    
    // 🚨 중요: 로딩 타임아웃 설정
    setLoadingTimeout();
    
    try {
        // 🚨 중요: URL 업데이트를 router.navigate()로 변경하여 상태 관리 개선
        const newUrl = createPageUrl(page);
        router.navigate(newUrl);
        
        // 직접 데이터 로드 (라우터를 거치지 않음)
        await loadHeritageList();
        
        // 🖼️ 다음 페이지 이미지 미리 로드
        setTimeout(() => {
            const nextPageStart = page * itemsPerPage;
            const nextPageEnd = nextPageStart + itemsPerPage;
            const nextPageItems = dataManager.heritageData.slice(nextPageStart, nextPageEnd);
            if (nextPageItems.length > 0) {
                imageCacheManager.preloadImages(nextPageItems);
            }
        }, 500);
        
        window.scrollTo(0, 0);
    } catch (error) {
        console.error('페이지 로딩 오류:', error);
        showErrorMessage('페이지를 불러오는 중 오류가 발생했습니다.');
    } finally {
        isLoading = false;
    }
}

// 전역으로 함수 등록
window.changePage = changePage;

/**
 * 문화재 상세 보기
 */
function viewHeritageDetail(name) {
    router.navigate(`detail/${encodeURIComponent(name)}`);
}

// 전역으로 함수 등록
window.viewHeritageDetail = viewHeritageDetail;

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

// 이미지 모달 열기
function openImageModal(imageUrl, title) {
    const modalHTML = `
        <div class="modal fade" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="imageModalLabel">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <img src="${imageUrl}" alt="${title}" class="img-fluid" style="max-height: 70vh; border-radius: 8px;">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
                        <a href="${imageUrl}" target="_blank" class="btn btn-primary">
                            <i class="fas fa-external-link-alt"></i> 원본 보기
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달 제거
    const existingModal = document.getElementById('imageModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 새 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // 모달 표시
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();
    
    // 모달이 닫힐 때 DOM에서 제거
    document.getElementById('imageModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

// 이미지 업로드 요청
function requestImageUpload(heritageName) {
    alert(`"${heritageName}"의 이미지를 업로드하려면 관리자에게 문의하세요.\n\n이미지 업로드 기능은 추후 구현 예정입니다.`);
}

// 🚨 중요: 에러 메시지 표시 함수
function showErrorMessage(message) {
    // 기존 에러 메시지 제거
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // 새 에러 메시지 생성
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message alert alert-danger alert-dismissible fade show';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>오류 발생</strong><br>
        <small>${message}</small>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// 이벤트 방지
document.addEventListener('click', (e) => {
    if (e.target.closest('a[href="#"]')) {
        e.preventDefault();
    }
});

// 🔥 전역 에러 핸들러 추가
window.addEventListener('error', (event) => {
    console.error('전역 에러 캐치:', event.error);
    showErrorMessage('예상치 못한 오류가 발생했습니다.');
});

// 🔥 5단계: 페이지네이션 URL 생성 수정 (app.js)
function createPageUrl(newPage) {
    const currentHash = window.location.hash.slice(1) || 'home';
    
    // 🚨 중요: URL 파싱 개선 - 더 정확한 컨텍스트 파악
    console.log(`🔗 URL 생성: 현재 해시=${currentHash}, 새 페이지=${newPage}`);
    
    // 카테고리 페이지인 경우
    if (currentHash.includes('category/')) {
        const categoryPart = currentHash.split('/page/')[0]; // 기존 페이지 부분 제거
        const newUrl = `${categoryPart}/page/${newPage}`;
        console.log(`📂 카테고리 페이지 URL: ${newUrl}`);
        return newUrl;
    }
    
    // 홈 페이지인 경우
    if (currentHash === 'home' || currentHash === '' || currentHash.startsWith('home?')) {
        const newUrl = `home?page=${newPage}`;
        console.log(`🏠 홈 페이지 URL: ${newUrl}`);
        return newUrl;
    }
    
    // 리스트 페이지인 경우
    if (currentHash === 'list' || currentHash.startsWith('list?')) {
        const newUrl = `list?page=${newPage}`;
        console.log(`📋 리스트 페이지 URL: ${newUrl}`);
        return newUrl;
    }
    
    // 기타 경우 - 현재 라우트에 페이지 파라미터 추가
    const baseRoute = currentHash.split('?')[0];
    const newUrl = `${baseRoute}?page=${newPage}`;
    console.log(`🔄 기타 페이지 URL: ${newUrl}`);
    return newUrl;
}

// 🔥 6단계: 성능 모니터링 함수
window.performanceCheck = function() {
    const start = performance.now();
    
    // 기본 동작 테스트
    router.parseHash();
    
    const end = performance.now();
    console.log(`⚡ 라우팅 성능: ${(end - start).toFixed(2)}ms`);
    
    // 메모리 사용량 체크
    if (performance.memory) {
        const memory = performance.memory;
        console.log(`🧠 메모리: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // 데이터 로드 상태
    console.log(`📊 캐시된 데이터: ${window.dataManager?.cachedData?.length || 0}개`);
};

// 🔥 7단계: 긴급 성능 복구 함수
window.emergencyPerformanceFix = function() {
    console.log('🚨 긴급 성능 복구 시작...');
    
    // 모든 타이머 클리어
    for (let i = 1; i < 99999; i++) window.clearTimeout(i);
    for (let i = 1; i < 99999; i++) window.clearInterval(i);
    
    // 불필요한 이벤트 리스너 제거
    const newBody = document.body.cloneNode(true);
    document.body.parentNode.replaceChild(newBody, document.body);
    
    // 캐시 클리어
    if (window.dataManager) {
        window.dataManager.lastStatsUpdate = 0;
    }
    
    console.log('✅ 긴급 성능 복구 완료');
    location.reload(); // 최후의 수단
};

// 🖼️ 이미지 캐시 통계 확인 함수
window.getImageCacheStats = function() {
    const stats = imageCacheManager.getCacheStats();
    console.log('🖼️ 이미지 캐시 통계:', stats);
    return stats;
};

// 🖼️ 이미지 캐시 클리어 함수
window.clearImageCache = function() {
    imageCacheManager.clearCache();
    console.log('🧹 이미지 캐시 클리어됨');
};

// 🧪 상세페이지 → 2페이지 테스트 함수
window.testDetailToPage2 = function() {
    console.log('🧪 상세페이지 → 2페이지 테스트 시작');
    
    // 현재 상태 로깅
    console.log('📍 현재 상태:');
    console.log('- URL:', window.location.href);
    console.log('- Hash:', window.location.hash);
    console.log('- Current Page:', currentPage);
    console.log('- Router Navigating:', router.isNavigating);
    console.log('- Data Manager Loaded:', dataManager.isLoaded);
    
    // 시나리오 시뮬레이션
    console.log('🎭 시나리오 시뮬레이션:');
    
    // 1. 상세페이지로 이동
    console.log('1️⃣ 상세페이지로 이동');
    router.navigate('detail/테스트문화재');
    
    setTimeout(() => {
        // 2. 뒤로가기
        console.log('2️⃣ 뒤로가기');
        goBack();
        
        setTimeout(() => {
            // 3. 2페이지로 이동
            console.log('3️⃣ 2페이지로 이동');
            changePage(2);
            
            setTimeout(() => {
                console.log('✅ 테스트 완료');
                console.log('📍 최종 상태:');
                console.log('- URL:', window.location.href);
                console.log('- Hash:', window.location.hash);
                console.log('- Current Page:', currentPage);
            }, 1000);
        }, 1000);
    }, 1000);
    
    return '테스트 시작됨 - 콘솔을 확인하세요';
};

// 🧪 보물 카테고리 페이지네이션 테스트 함수
window.testTreasureCategoryPagination = function() {
    console.log('🧪 보물 카테고리 페이지네이션 테스트 시작');
    
    // 현재 상태 로깅
    console.log('📍 현재 상태:');
    console.log('- URL:', window.location.href);
    console.log('- Hash:', window.location.hash);
    console.log('- Current Category Page:', currentCategoryPage);
    console.log('- Current Category Name:', currentCategoryName);
    console.log('- Router Navigating:', router.isNavigating);
    
    // 시나리오 시뮬레이션
    console.log('🎭 보물 카테고리 시나리오 시뮬레이션:');
    
    // 1. 보물 카테고리로 이동
    console.log('1️⃣ 보물 카테고리로 이동');
    router.navigate('category/보물');
    
    setTimeout(() => {
        // 2. 2페이지로 이동
        console.log('2️⃣ 2페이지로 이동');
        changeCategoryPage(2);
        
        setTimeout(() => {
            // 3. 3페이지로 이동
            console.log('3️⃣ 3페이지로 이동');
            changeCategoryPage(3);
            
            setTimeout(() => {
                // 4. 4페이지로 이동
                console.log('4️⃣ 4페이지로 이동');
                changeCategoryPage(4);
                
                setTimeout(() => {
                    // 5. 5페이지로 이동
                    console.log('5️⃣ 5페이지로 이동');
                    changeCategoryPage(5);
                    
                    setTimeout(() => {
                        console.log('✅ 보물 카테고리 테스트 완료');
                        console.log('📍 최종 상태:');
                        console.log('- URL:', window.location.href);
                        console.log('- Hash:', window.location.hash);
                        console.log('- Current Category Page:', currentCategoryPage);
                        console.log('- Current Category Name:', currentCategoryName);
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    }, 1000);
    
    return '보물 카테고리 테스트 시작됨 - 콘솔을 확인하세요';
};

// 🔥 안전한 라우팅 함수 래퍼
function safeExecute(fn, fallback = null) {
    try {
        return fn();
    } catch (error) {
        console.error('❌ 함수 실행 중 에러:', error);
        console.error('📍 에러 스택:', error.stack);
        
        // 사용자에게 친화적인 에러 메시지 표시
        showErrorMessage('데이터 처리 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.');
        
        return fallback;
    }
}