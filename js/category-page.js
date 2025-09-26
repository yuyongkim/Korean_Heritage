/**
 * 카테고리 페이지 관련 기능을 담당하는 클래스
 */
class CategoryPage {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.isLoading = false;
        this.currentData = [];
        this.currentCategoryName = '';
    }

    /**
     * 카테고리별 뷰 로드
     */
    async loadCategoryView(category) {
        console.log('카테고리 뷰 로드 시작:', category);
        this.currentCategoryName = category;
        this.currentPage = 1;
        
        try {
            // 데이터 매니저가 준비될 때까지 기다리기
            await dataManager.waitForData();
            
            // 기본 데이터 로드
            const allItems = dataManager.getByCategory(category);
            console.log('카테고리 데이터:', category, '→', allItems.length, '건');
            
            if (allItems.length === 0) {
                console.warn('⚠️ 카테고리 데이터가 없습니다:', category);
                this.showNoDataMessage(category);
                return;
            }
            
            this.currentData = allItems;
            
            // 제목 업데이트
            const titleElement = document.getElementById('category-title');
            if (titleElement) {
                titleElement.textContent = category;
            }
            
            // 카운트 업데이트
            this.updateCategoryCount(allItems.length);
            
            // 지역 필터 초기화
            this.setupCategoryLocationFilter(allItems);
            
            // 컨텐츠 렌더링
            await this.renderCategoryContent();
            
            // 🖼️ 카테고리 이미지 미리 로드 (다음 페이지들)
            setTimeout(() => {
                const nextPages = allItems.slice(20, 60); // 2-3페이지
                if (nextPages.length > 0) {
                    imageCacheManager.preloadImages(nextPages);
                }
            }, 1000);
            
            // 이벤트 리스너 설정
            this.setupCategoryEventListeners();
            
            console.log('✅ 카테고리 뷰 로드 완료:', category);
        } catch (error) {
            console.error('❌ 카테고리 뷰 로드 실패:', error);
            this.showErrorMessage('카테고리 데이터를 불러오는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 카테고리 컨텐츠 렌더링
     */
    async renderCategoryContent() {
        console.log('카테고리 컨텐츠 렌더링 시작:', this.currentData.length, '건');
        
        // 지역 필터 적용
        const locationFilter = document.getElementById('category-location-filter')?.value || '';
        let filteredData = this.currentData;
        
        if (locationFilter) {
            filteredData = this.currentData.filter(item => 
                item.ctcd_name && item.ctcd_name.includes(locationFilter)
            );
            console.log('지역 필터 적용:', locationFilter, '→', filteredData.length, '건');
        }
        
        // 페이지네이션
        const totalPages = Math.ceil(filteredData.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        // 카운트 업데이트
        this.updateCategoryCount(filteredData.length);
        
        // 뷰 모드에 따라 렌더링
        const isGridView = document.getElementById('category-grid-btn')?.checked !== false;
        
        if (isGridView) {
            this.renderCategoryGridView(pageData);
            document.getElementById('category-grid').style.display = 'block';
            document.getElementById('category-table').style.display = 'none';
        } else {
            this.renderCategoryListView(pageData);
            document.getElementById('category-grid').style.display = 'none';
            document.getElementById('category-table').style.display = 'block';
        }
        
        // 페이지네이션 렌더링
        this.renderCategoryPagination(this.currentPage, totalPages, filteredData.length);
    }

    /**
     * 카테고리 그리드 뷰 렌더링
     */
    renderCategoryGridView(items) {
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
                            `<img src="${imageCacheManager.getCachedImageUrl(item.image_url)}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.classList.add('no-image')">` : 
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
    renderCategoryListView(items) {
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
                            `<img src="${imageCacheManager.getCachedImageUrl(item.image_url)}" alt="${item.name}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
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
     * 카테고리 페이지네이션 렌더링
     */
    renderCategoryPagination(current, totalPages, totalItems) {
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
    async changeCategoryPage(page) {
        // 🚨 중요: 로딩 중이면 무시
        if (this.isLoading) {
            console.log('이미 로딩 중이므로 카테고리 페이지 변경 무시:', page);
            return;
        }
        
        // 🚨 중요: 페이지 번호 유효성 검사
        if (page < 1 || isNaN(page)) {
            console.warn('유효하지 않은 카테고리 페이지 번호:', page);
            return;
        }
        
        // 🚨 중요: 현재 페이지와 동일하면 무시
        if (page === this.currentPage) {
            console.log('현재 카테고리 페이지와 동일하므로 무시:', page);
            return;
        }
        
        console.log(`카테고리 페이지 변경: ${this.currentPage} -> ${page}`);
        this.currentPage = page;
        this.isLoading = true;
        
        // 🚨 중요: 로딩 타임아웃 설정
        this.setLoadingTimeout();
        
        try {
            // 🚨 중요: router.navigate() 사용하여 무한 루프 방지
            const newUrl = `category/${this.currentCategoryName}/page/${page}`;
            router.navigate(newUrl);
            
            // 컨텐츠 렌더링 (URL 업데이트 없이)
            await this.renderCategoryContent();
        } catch (error) {
            console.error('카테고리 페이지 로딩 오류:', error);
            this.showErrorMessage('카테고리 페이지를 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 카테고리 카운트 업데이트
     */
    updateCategoryCount(count) {
        const countElement = document.getElementById('category-count');
        if (countElement) {
            countElement.textContent = count.toLocaleString();
        }
    }

    /**
     * 카테고리 지역 필터 설정
     */
    setupCategoryLocationFilter(items) {
        const locationFilter = document.getElementById('category-location-filter');
        if (!locationFilter) {
            console.log('❌ category-location-filter 요소를 찾을 수 없습니다');
            return;
        }
        
        // 고유한 지역 목록 추출 (location과 ctcd_name 모두 포함)
        const locations = new Set();
        items.forEach(item => {
            if (item.location && item.location.trim() !== '') {
                locations.add(item.location);
            }
            if (item.ctcd_name && item.ctcd_name.trim() !== '') {
                locations.add(item.ctcd_name);
            }
        });
        
        const sortedLocations = Array.from(locations).sort();
        console.log('📍 카테고리 지역 필터 옵션:', sortedLocations);
        
        // 옵션 생성
        locationFilter.innerHTML = '<option value="">모든 지역</option>' + 
            sortedLocations.map(location => `<option value="${location}">${location}</option>`).join('');
        
        console.log('✅ 카테고리 지역 필터 설정 완료:', sortedLocations.length, '개');
    }

    /**
     * 카테고리 페이지 이벤트 리스너 설정
     */
    setupCategoryEventListeners() {
        // 뷰 모드 전환
        const gridBtn = document.getElementById('category-grid-btn');
        const listBtn = document.getElementById('category-list-btn');
        
        if (gridBtn && listBtn) {
            gridBtn.addEventListener('change', () => {
                if (gridBtn.checked) {
                    this.renderCategoryContent();
                }
            });
            
            listBtn.addEventListener('change', () => {
                if (listBtn.checked) {
                    this.renderCategoryContent();
                }
            });
        }
        
        // 지역 필터
        const locationFilter = document.getElementById('category-location-filter');
        if (locationFilter) {
            locationFilter.addEventListener('change', () => {
                this.currentPage = 1; // 첫 페이지로 리셋
                this.renderCategoryContent();
            });
        }
    }

    /**
     * 로딩 타임아웃 설정
     */
    setLoadingTimeout() {
        setTimeout(() => {
            if (this.isLoading) {
                console.error('⚠️ 10초 타임아웃: 강제로 로딩 상태 해제');
                this.isLoading = false;
                this.showErrorMessage('페이지 로딩이 너무 오래 걸립니다. 새로고침을 시도해보세요.');
            }
        }, 10000);
    }

    /**
     * 데이터 없음 메시지 표시
     */
    showNoDataMessage(category) {
        const gridContainer = document.getElementById('category-grid');
        const tableContainer = document.getElementById('category-table');
        
        const noDataMessage = `
            <div class="col-12 text-center py-5">
                <div class="empty-state">
                    <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                    <h4>${category} 카테고리에 데이터가 없습니다</h4>
                    <p class="text-muted">해당 카테고리의 문화재 정보를 찾을 수 없습니다.</p>
                    <div class="mt-3">
                        <button class="btn btn-primary" onclick="router.navigate('home')">
                            <i class="fas fa-home me-2"></i>홈으로 이동
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        if (gridContainer) {
            gridContainer.innerHTML = noDataMessage;
        }
        
        if (tableContainer) {
            const tbody = document.getElementById('category-list-tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr><td colspan="5" class="text-center py-5">
                        <div class="empty-state">
                            <i class="fas fa-folder-open fa-2x text-muted mb-2"></i>
                            <h5>${category} 카테고리에 데이터가 없습니다</h5>
                            <p class="text-muted mb-0">해당 카테고리의 문화재 정보를 찾을 수 없습니다.</p>
                        </div>
                    </td></tr>
                `;
            }
        }
        
        // 카운트 업데이트
        this.updateCategoryCount(0);
    }

    /**
     * 에러 메시지 표시
     */
    showErrorMessage(message) {
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
}

// 전역으로 함수 등록
window.loadCategoryView = function(category) {
    if (window.categoryPage) {
        window.categoryPage.loadCategoryView(category);
    }
};

window.changeCategoryPage = function(page) {
    if (window.categoryPage) {
        window.categoryPage.changeCategoryPage(page);
    }
};