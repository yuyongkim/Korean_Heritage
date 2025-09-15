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
    if (globalSearch) {
        globalSearch.addEventListener('input', debounce((e) => {
            const query = e.target.value.trim();
            if (query) {
                performGlobalSearch(query);
            }
        }, 300));
        
        globalSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    router.navigate(`search/${encodeURIComponent(query)}`);
                }
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
    
    // 4축 필터링 이벤트 리스너
    const authorityFilter = document.getElementById('authority-filter');
    const regionGroupFilter = document.getElementById('region-group-filter');
    const qualityFilter = document.getElementById('quality-filter');
    const periodFilter = document.getElementById('period-filter');
    
    [authorityFilter, regionGroupFilter, qualityFilter, periodFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', () => {
                console.log('🔄 4축 필터 변경:', filter.id, filter.value);
                applyFilters();
            });
        }
    });
    
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
    const stats = dataManager.getStatistics();
    
    console.log('📊 대시보드 업데이트:', stats);
    
    // 메인 통계 업데이트
    updateElement('total-count', stats.total.toLocaleString());
    updateElement('national-count', stats.categories['국보'] || 0);
    updateElement('treasure-count', stats.categories['보물'] || 0);
    updateElement('location-count', stats.locationCount);
    
    // 카테고리별 통계
    updateElement('site-count', (stats.categories['사적'] || 0) + (stats.categories['명승'] || 0));
    updateElement('natural-count', stats.categories['천연기념물'] || 0);
    
    // 대시보드 카테고리별 건수 업데이트
    updateElement('explore-national-count', (stats.categories['국보'] || 0) + '건');
    updateElement('explore-treasure-count', (stats.categories['보물'] || 0) + '건');
    updateElement('explore-historic-count', (stats.categories['사적'] || 0) + '건');
    updateElement('explore-scenic-count', (stats.categories['명승'] || 0) + '건');
    updateElement('explore-natural-count', (stats.categories['천연기념물'] || 0) + '건');
    updateElement('explore-intangible-count', (stats.categories['국가무형문화재'] || 0) + '건');
    
    // 히어로 섹션 통계 업데이트 (4개 주요 숫자)
    updateElement('hero-total-count', stats.total.toLocaleString());
    
    // 번역 완료율 계산 (영어 설명이 있는 항목 비율)
    const totalItems = dataManager.heritageData.length;
    const translatedItems = dataManager.heritageData.filter(item => 
        item.english_description && item.english_description.trim() !== ''
    ).length;
    const translationRate = totalItems > 0 ? Math.round((translatedItems / totalItems) * 100) : 0;
    
    updateElement('hero-translation-count', translationRate + '%');
    updateElement('translation-percentage', translationRate + '%');
    
    // 프로그레스 바 업데이트
    const progressBar = document.getElementById('translation-progress');
    if (progressBar) {
        progressBar.style.width = translationRate + '%';
    }
    
    // COMET 점수 (임시로 고정값 사용, 추후 실제 계산 로직 추가)
    updateElement('hero-comet-score', '0.742');
    updateElement('comet-score', '0.742');
    
    // 지원 언어 수
    updateElement('hero-language-count', '2');
    
    // 4축 필터링 시스템 업데이트
    if (dataManager && typeof dataManager.updateFilters === 'function') {
        dataManager.updateFilters();
    }
    
    // 결과 개수 실시간 업데이트
    updateResultsCount();
    
    // 사이드바 총 문화재 수 업데이트
    updateElement('sidebar-total', stats.total.toLocaleString());
    
    // 사이드바 번역률 업데이트
    updateElement('sidebar-translation-rate', translationRate + '%');
    
    // 애니메이션 효과
    animateNumbers();
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
        const originalText = counter.textContent;
        const target = parseInt(originalText.replace(/,/g, '').replace('%', '')) || 0;
        
        // 이미 애니메이션 중이면 건너뛰기
        if (counter.dataset.animating === 'true') {
            return;
        }
        
        counter.dataset.animating = 'true';
        
        const increment = Math.max(1, Math.ceil(target / 50));
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                counter.textContent = originalText;
                counter.dataset.animating = 'false';
                clearInterval(timer);
            } else {
                // 퍼센트나 다른 단위가 있으면 유지
                if (originalText.includes('%')) {
                    counter.textContent = current + '%';
                } else {
                    counter.textContent = current.toLocaleString();
                }
            }
        }, 30);
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
    
    // 검색 및 필터링
    const results = dataManager.search(query, categoryFilter, locationFilter);
    
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
    console.log('상세 페이지 로드 시작:', name);
    
    const item = dataManager.getByName(name);
    if (!item) {
        console.error('문화재를 찾을 수 없습니다:', name);
        // 홈으로 바로 이동하지 않고 이전 페이지로 돌아가기
        goBack();
        return;
    }
    
    console.log('문화재 데이터 로드 성공:', item.name);
    renderHeritageDetail(item);
}

/**
 * 문화재 상세 정보 렌더링
 */
function renderHeritageDetail(item) {
    console.log('상세 페이지 렌더링 시작:', item.name);
    
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
        if (typeof mapManager !== 'undefined' && mapManager.showMap && item.coords) {
            setTimeout(() => {
                mapManager.showMap('heritage-map', item.coords, item.name);
            }, 100);
        } else if (item.coords) {
            // 지도 매니저가 없으면 기본 메시지 표시
            const mapContainer = document.getElementById('heritage-map');
            if (mapContainer) {
                mapContainer.innerHTML = `
                    <div class="text-center py-4 bg-light rounded">
                        <i class="fas fa-map-marked-alt fa-2x text-muted mb-2"></i>
                        <p class="mb-0 text-muted">지도 정보</p>
                        <small class="text-muted">좌표: ${item.coords.lat.toFixed(6)}, ${item.coords.lng.toFixed(6)}</small>
                    </div>
                `;
            }
        }
    }
    
    // 관련 링크
    const linksContainer = document.getElementById('heritage-links');
    if (linksContainer) {
        linksContainer.innerHTML = `
            <a href="https://www.heritage.go.kr" target="_blank" class="heritage-link d-block mb-2">
                <i class="fas fa-external-link-alt me-2"></i>문화재청 홈페이지
            </a>
            ${item.source_url ? `
                <a href="${item.source_url}" target="_blank" class="heritage-link d-block mb-2">
                    <i class="fas fa-info-circle me-2"></i>상세 정보 (원문)
                </a>
            ` : ''}
            <a href="#" class="heritage-link d-block mb-2" onclick="shareHeritage('${item.name}'); return false;">
                <i class="fas fa-share me-2"></i>공유하기
            </a>
            <a href="#" class="heritage-link d-block" onclick="addToFavorites('${item.name}'); return false;">
                <i class="fas fa-heart me-2"></i>즐겨찾기
            </a>
        `;
    }
    
    // 상세 페이지 언어 토글 이벤트 재설정
    setupDetailLanguageToggle(item);
    
    console.log('상세 페이지 렌더링 완료:', item.name);
}

/**
 * 문화재 설명 업데이트 (언어별)
 */
function updateHeritageDescription(item) {
    const container = document.getElementById('heritage-description');
    if (!container) return;
    
    const isKorean = dataManager.currentLanguage === 'ko';
    const description = isKorean 
        ? (item.content || item.korean_description || '설명이 없습니다.')
        : (item.english_description || '영문 설명을 준비 중입니다.');
    
    // 줄바꿈 처리 및 문단 나누기
    let processedDescription = description
        .replace(/\r\n/g, '\n')  // Windows 줄바꿈 처리
        .replace(/\r/g, '\n')    // Mac 줄바꿈 처리
        .replace(/\n\s*\n/g, '\n\n')  // 연속된 줄바꿈 정리
        .trim();
    
    // 문단별로 나누기 (빈 줄 기준)
    const paragraphs = processedDescription.split('\n\n').filter(p => p.trim().length > 0);
    
    container.innerHTML = paragraphs.map(p => {
        // 문단 내 줄바꿈을 <br>로 변환
        let formattedParagraph = p.trim().replace(/\n/g, '<br>');
        
        // 숫자와 단위 사이의 줄바꿈 방지 (예: 1.54m, 1.4m 등)
        formattedParagraph = formattedParagraph.replace(/(\d+\.?\d*)\s*<br>\s*([a-zA-Z가-힣]+)/g, '$1$2');
        
        // 일반적인 줄바꿈 패턴 처리 (한글 단어 사이)
        formattedParagraph = formattedParagraph.replace(/([가-힣])\s*<br>\s*([가-힣])/g, '$1 $2');
        
        // 문장 끝 마침표 후 줄바꿈 처리 (자연스러운 문단 구분)
        formattedParagraph = formattedParagraph.replace(/([가-힣]\.)\s*<br>\s*([가-힣])/g, '$1 $2');
        
        // 연속된 공백 정리
        formattedParagraph = formattedParagraph.replace(/\s+/g, ' ');
        
        return `<p>${formattedParagraph}</p>`;
    }).join('');
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
    console.log('카테고리 뷰 로드:', category);
    
    // 동일한 카테고리로의 중복 로드 방지
    if (currentCategoryName === category && currentCategoryData.length > 0) {
        console.log('동일한 카테고리 중복 로드 방지:', category);
        return;
    }
    
    currentCategoryName = category;
    currentCategoryPage = 1;
    
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
    if (current > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#category/${encodeURIComponent(currentCategoryName)}/${current - 1}">이전</a>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <span class="page-link">이전</span>
            </li>
        `;
    }
    
    // 페이지 번호
    const maxVisible = 5;
    let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === current) {
            paginationHTML += `
                <li class="page-item active">
                    <span class="page-link">${i}</span>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#category/${encodeURIComponent(currentCategoryName)}/${i}">${i}</a>
                </li>
            `;
        }
    }
    
    // 다음 버튼
    if (current < totalPages) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#category/${encodeURIComponent(currentCategoryName)}/${current + 1}">다음</a>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <span class="page-link">다음</span>
            </li>
        `;
    }
    
    paginationContainer.innerHTML = paginationHTML;
}

/**
 * 카테고리 페이지 변경
 */
function changeCategoryPage(page) {
    currentCategoryPage = page;
    renderCategoryContent();
    
    // URL 업데이트 (브라우저 히스토리에 추가)
    const newUrl = `#category/${encodeURIComponent(currentCategoryName)}/${page}`;
    if (window.location.hash !== newUrl) {
        window.location.hash = newUrl;
    }
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

/**
 * 글로벌 검색 수행
 */
function performGlobalSearch(query) {
    // 검색 결과를 목록 뷰에 표시
    router.navigate(`search/${encodeURIComponent(query)}`);
}

/**
 * 검색 수행 (라우터에서 호출)
 */
function performSearch(query) {
    currentPage = 1;
    document.getElementById('globalSearch').value = query;
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
    
    // 현재 뷰가 상세 페이지인 경우에만 라우터 히스토리 관리
    if (router.currentView === 'detail-view') {
        // 상세 페이지에서 페이지네이션을 사용하는 경우는 없지만, 
        // 혹시 모를 상황을 대비해 현재 경로를 히스토리에 유지
        const currentHash = window.location.hash;
        if (router.history.length > 0) {
            router.history[router.history.length - 1] = currentHash;
        }
    }
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

/**
 * 서브메뉴 토글 기능
 */
function toggleSubmenu(menuId) {
    const menu = document.getElementById(menuId);
    const toggle = menu.parentElement;
    
    if (menu.classList.contains('show')) {
        menu.classList.remove('show');
        toggle.classList.remove('active');
    } else {
        menu.classList.add('show');
        toggle.classList.add('active');
    }
}

/**
 * 문화재 공유하기
 */
function shareHeritage(heritageName) {
    const url = window.location.href;
    const text = `${heritageName} - 한국 문화유산 정보`;
    
    if (navigator.share) {
        navigator.share({
            title: text,
            text: text,
            url: url
        }).catch(err => console.log('공유 실패:', err));
    } else {
        // 클립보드에 복사
        navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
            alert('링크가 클립보드에 복사되었습니다!');
        }).catch(() => {
            alert('공유 기능을 사용할 수 없습니다.');
        });
    }
}

/**
 * 즐겨찾기 추가
 */
function addToFavorites(heritageName) {
    try {
        let favorites = JSON.parse(localStorage.getItem('heritage_favorites') || '[]');
        
        if (!favorites.includes(heritageName)) {
            favorites.push(heritageName);
            localStorage.setItem('heritage_favorites', JSON.stringify(favorites));
            alert(`"${heritageName}"이(가) 즐겨찾기에 추가되었습니다!`);
        } else {
            alert(`"${heritageName}"은(는) 이미 즐겨찾기에 있습니다.`);
        }
    } catch (error) {
        console.error('즐겨찾기 추가 실패:', error);
        alert('즐겨찾기 추가에 실패했습니다.');
    }
}