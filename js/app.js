/**
 * 메인 애플리케이션 - 뷰 컨트롤러 및 이벤트 핸들러
 */

// 전역 변수
let currentPage = 1;
const itemsPerPage = 20;

/**
 * 애플리케이션 초기화
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('애플리케이션 시작...');
console.log('전역 객체들 확인:', {
    dataManager: typeof dataManager,
    router: typeof router,
    i18n: typeof i18n,
    imageResolver: typeof imageResolver,
    mapManager: typeof mapManager
});
    
    // 데이터 로드 (로컬 스토리지 우선)
    await dataManager.loadData();
    
    // 초기 통계 표시
    console.log('현재 총 문화재 수:', dataManager.heritageData.length);
    
    // 대시보드 업데이트
    updateDashboard();
    
    // 데이터 변경 이벤트 리스너 설정
    dataManager.addEventListener('dataLoaded', (data) => {
        console.log('📊 데이터 로딩 완료 이벤트 수신:', data.length, '개 항목');
        updateDashboard();
    });
    
    dataManager.addEventListener('dataUpdated', (data) => {
        console.log('📊 데이터 업데이트 이벤트 수신');
        updateDashboard();
    });
    
    dataManager.addEventListener('statisticsChanged', (stats) => {
        console.log('📊 통계 변경 이벤트 수신:', stats);
        updateDashboard();
    });
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 초기 라우팅
    router.handleRoute();
    
    console.log('애플리케이션 초기화 완료');
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
function updateDashboard() {
    // 데이터가 로딩되지 않았으면 대기
    if (!dataManager || !dataManager.isLoaded || !dataManager.heritageData || dataManager.heritageData.length === 0) {
        console.log('📊 데이터가 아직 로딩되지 않음, 대시보드 업데이트 대기');
        return;
    }
    
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
function toggleViewMode(mode) {
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
    loadHeritageList();
}

/**
 * 문화재 목록 로드
 */
function loadHeritageList(searchQuery = '') {
    const query = searchQuery || document.getElementById('globalSearch')?.value || '';
    const categoryFilter = document.getElementById('category-filter')?.value || '';
    const locationFilter = document.getElementById('location-filter')?.value || '';
    const searchOption = document.getElementById('searchOption')?.value || 'title+description';
    
    // 검색 및 필터링
    const results = dataManager.search(query, categoryFilter, locationFilter, searchOption);
    
    // 페이지네이션
    const totalPages = Math.ceil(results.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = results.slice(startIndex, endIndex);
    
    // 목록 렌더링
    renderHeritageList(pageData);
    
    // 페이지네이션 렌더링
    renderPagination(currentPage, totalPages, results.length);
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
                        `<img src="${item.image_url}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.classList.add('no-image')">` : 
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
                        `<img src="${item.image_url}" alt="${item.name}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
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
 * 페이지네이션 렌더링
 */
function renderPagination(current, total, totalItems) {
    const container = document.getElementById('pagination');
    if (!container || total <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // 이전 버튼
    html += `
        <li class="page-item ${current === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${current - 1})">이전</a>
        </li>
    `;
    
    // 페이지 번호들
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    
    if (start > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1)">1</a></li>`;
        if (start > 2) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    
    for (let i = start; i <= end; i++) {
        html += `
            <li class="page-item ${i === current ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }
    
    if (end < total) {
        if (end < total - 1) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${total})">${total}</a></li>`;
    }
    
    // 다음 버튼
    html += `
        <li class="page-item ${current === total ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${current + 1})">다음</a>
        </li>
    `;
    
    container.innerHTML = html;
    
    // 결과 수 표시
    const resultInfo = document.querySelector('.result-info');
    if (resultInfo) {
        const start = (current - 1) * itemsPerPage + 1;
        const end = Math.min(current * itemsPerPage, totalItems);
        resultInfo.textContent = `${start}-${end} / 총 ${totalItems}개`;
    }
}

/**
 * 문화재 상세 정보 로드
 */
function loadHeritageDetail(name) {
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
                                <span class="heritage-badge me-2">${item.category}</span>
                                ${item.period ? `<span class="heritage-period me-2">${item.period}</span>` : ''}
                                ${item.designation_no ? `<span class="heritage-designation">${item.designation_no}</span>` : ''}
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
        if (item.image_url && item.image_url.trim() !== '') {
            imageContainer.innerHTML = `
                <div class="heritage-image-wrapper">
                    <img src="${item.image_url}" alt="${item.name}" class="heritage-main-image" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="heritage-image-placeholder d-none" style="min-height: 400px;">
                        <div class="text-center text-muted">
                            <i class="fas fa-image fa-3x mb-3" style="color: var(--primary);"></i>
                            <h5>이미지 로드 실패</h5>
                            <small>이미지를 불러올 수 없습니다</small>
                        </div>
                    </div>
                    <div class="heritage-image-overlay">
                        <button class="btn btn-light btn-sm" onclick="openImageModal('${item.image_url}', '${item.name}')">
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
                    <span class="badge category-badge category-${item.category}">${item.category}</span>
                </div>
            </div>
            ${item.designation_no ? `
            <div class="heritage-meta-item d-flex">
                <div class="heritage-meta-label"><i class="fas fa-certificate me-2"></i>지정번호</div>
                <div class="heritage-meta-value">${item.designation_no}</div>
            </div>
            ` : ''}
            ${item.period ? `
            <div class="heritage-meta-item d-flex">
                <div class="heritage-meta-label"><i class="fas fa-history me-2"></i>시대</div>
                <div class="heritage-meta-value">${item.period}</div>
            </div>
            ` : ''}
            <div class="heritage-meta-item d-flex">
                <div class="heritage-meta-label"><i class="fas fa-map-marker-alt me-2"></i>소재지</div>
                <div class="heritage-meta-value">${item.location}</div>
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
            <p class="mb-2"><i class="fas fa-map-marker-alt text-primary me-2"></i>${item.location}</p>
            ${item.coords ? `
                <small class="text-muted">위도: ${item.coords.lat}, 경도: ${item.coords.lng}</small>
            ` : `
                <small class="text-muted">좌표 정보 없음</small>
            `}
        `;

        // 지도 표시
        if (window.mapManager && item.coords) {
            setTimeout(() => {
                mapManager.showMap('heritage-map', item.coords, item.name);
            }, 100);
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
        ? item.korean_description 
        : (item.english_description || '영문 설명을 준비 중입니다.');
    
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
            dataManager.currentLanguage = e.target.id === 'detail-lang-ko' ? 'ko' : 'en';
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
function loadCategoryView(category) {
    console.log('카테고리 뷰 로드 시작:', category);
    currentCategoryName = category;
    currentCategoryPage = 1;
    
    // 데이터 매니저 확인
    if (!dataManager || !dataManager.isLoaded) {
        console.error('데이터 매니저가 로드되지 않았습니다');
        return;
    }
    
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
    
    // 이벤트 리스너 설정
    setupCategoryEventListeners();
    
    console.log('카테고리 뷰 로드 완료:', category);
}

/**
 * 카테고리 컨텐츠 렌더링
 */
function renderCategoryContent() {
    console.log('카테고리 컨텐츠 렌더링 시작:', currentCategoryData.length, '건');
    
    // 지역 필터 적용
    const locationFilter = document.getElementById('category-location-filter')?.value || '';
    let filteredData = currentCategoryData;
    
    if (locationFilter) {
        filteredData = currentCategoryData.filter(item => 
            item.location && item.location.includes(locationFilter)
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
                        `<img src="${item.image_url}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.classList.add('no-image')">` : 
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
                        `<img src="${item.image_url}" alt="${item.name}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
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
function changeCategoryPage(page) {
    currentCategoryPage = page;
    renderCategoryContent();
}

// English 페이지 전역 변수
let currentEnglishPage = 1;
let currentEnglishData = [];

/**
 * English 페이지 로드
 */
function loadEnglishView() {
    currentEnglishPage = 1;
    
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
function renderEnglishContent() {
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
                        `<img src="${item.image_url}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.classList.add('no-image')">` : 
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
                        ${item.english_description && item.english_description.trim() 
                            ? item.english_description.substring(0, 100) + '...' 
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
                        `<img src="${item.image_url}" alt="${item.name}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
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
                    ${item.english_description && item.english_description.trim()
                        ? item.english_description.substring(0, 150) + '...'
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
function changeEnglishPage(page) {
    currentEnglishPage = page;
    renderEnglishContent();
}

// 미분류 항목 페이지 전역 변수
let currentUnclassifiedPage = 1;
let currentUnclassifiedData = [];
let currentUnclassifiedType = 'all';

/**
 * 미분류 항목 뷰 로드
 */
function loadUnclassifiedView(type = 'sido-type') {
    console.log('미분류 항목 뷰 로드:', type);
    currentUnclassifiedType = type;
    currentUnclassifiedPage = 1;
    
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

/**
 * 미분류 항목 컨텐츠 렌더링
 */
function renderUnclassifiedContent() {
    console.log('미분류 항목 컨텐츠 렌더링 시작:', currentUnclassifiedData.length, '건');
    
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
                        `<img src="${item.image_url}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.classList.add('no-image')">` : 
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
                        `<img src="${item.image_url}" alt="${item.name}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
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
function changeUnclassifiedPage(page) {
    currentUnclassifiedPage = page;
    renderUnclassifiedContent();
}

/**
 * 번역률 계산 및 업데이트
 */
function updateTranslationRate() {
    if (!dataManager || !dataManager.heritageData || dataManager.heritageData.length === 0) {
        console.log('📊 번역률 계산: 데이터 없음');
        return;
    }
    
    const totalItems = dataManager.heritageData.length;
    const translatedItems = dataManager.heritageData.filter(item => 
        item.english_description && 
        item.english_description.trim() !== '' && 
        item.english_description !== '영문 설명 준비 중입니다.' &&
        !item.english_description.includes('Description not available')
    ).length;
    
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
function performSearch(query, searchOption = 'title+description') {
    currentPage = 1;
    document.getElementById('globalSearch').value = query;
    
    // 검색 옵션 드롭다운 업데이트
    const searchOptionSelect = document.getElementById('searchOption');
    if (searchOptionSelect) {
        searchOptionSelect.value = searchOption;
    }
    
    loadHeritageList(query);
}

/**
 * 필터 적용
 */
function applyFilters() {
    currentPage = 1;
    
    // 4축 필터링 시스템 사용
    if (dataManager && typeof dataManager.applyFilters === 'function') {
        dataManager.applyFilters();
    }
    
    loadHeritageList();
    
    // 필터 적용 후 건수 업데이트
    setTimeout(() => {
        updateResultsCount();
    }, 100);
}

/**
 * 필터 초기화
 */
function resetFilters() {
    document.getElementById('category-filter').value = '';
    document.getElementById('location-filter').value = '';
    document.getElementById('globalSearch').value = '';
    currentPage = 1;
    loadHeritageList();
}

/**
 * 페이지 변경
 */
function changePage(page) {
    if (page < 1) return;
    currentPage = page;
    loadHeritageList();
    window.scrollTo(0, 0);
}

/**
 * 문화재 상세 보기
 */
function viewHeritageDetail(name) {
    router.navigate(`detail/${encodeURIComponent(name)}`);
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

// 이벤트 방지
document.addEventListener('click', (e) => {
    if (e.target.closest('a[href="#"]')) {
        e.preventDefault();
    }
});