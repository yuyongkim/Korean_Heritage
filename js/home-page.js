/**
 * 홈페이지 관련 기능을 담당하는 클래스
 */
class HomePage {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.isLoading = false;
    }

    /**
     * 홈페이지 초기화
     */
    async init() {
        console.log('🏠 홈페이지 초기화');
        await this.loadHeritageList();
    }

    /**
     * 문화재 목록 로드
     */
    async loadHeritageList(searchQuery = '') {
        // 데이터 매니저가 준비될 때까지 기다리기
        await dataManager.waitForData();
        
        const query = searchQuery || document.getElementById('globalSearch')?.value || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const locationFilter = document.getElementById('location-filter')?.value || '';
        const searchOption = document.getElementById('searchOption')?.value || 'title+description';
        
        console.log('문화재 목록 로드 시작:', { query, categoryFilter, locationFilter, currentPage: this.currentPage });
        
        try {
            // 검색 및 필터링
            const results = dataManager.search(query, categoryFilter, locationFilter, searchOption);
            
            // 🚨 중요: 빈 결과 처리
            if (!results || results.length === 0) {
                console.log('검색 결과가 없습니다');
                this.renderHeritageList([]);
                this.renderPagination(1, 1, 0);
                return;
            }
            
            // 🚀 최적화된 페이지네이션 (캐싱 사용)
            const paginationData = this.getPaginatedData(results, this.currentPage);
            
            if (!paginationData) {
                console.warn('페이지네이션 데이터 없음');
                this.renderHeritageList([]);
                return;
            }
            
            console.log(`🚀 페이지 데이터 로드 완료: ${paginationData.items.length}개 항목 (${paginationData.currentPage}/${paginationData.totalPages})`);
            
            // 목록 렌더링
            this.renderHeritageList(paginationData.items);
            
            // 페이지네이션 렌더링
            this.renderPagination(paginationData.currentPage, paginationData.totalPages, paginationData.totalItems, 'pagination');
            
        } catch (error) {
            console.error('문화재 목록 로드 오류:', error);
            this.showErrorMessage('문화재 목록을 불러오는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 페이지네이션 데이터 생성
     */
    getPaginatedData(data, page) {
        if (!data || data.length === 0) return null;
        
        const totalPages = Math.ceil(data.length / this.itemsPerPage);
        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        
        return {
            items: data.slice(startIndex, endIndex),
            currentPage: page,
            totalPages: totalPages,
            totalItems: data.length
        };
    }

    /**
     * 문화재 목록 렌더링 (뷰 모드에 따라)
     */
    renderHeritageList(items) {
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
            this.renderGridView(items);
        } else {
            this.renderListView(items);
        }
    }

    /**
     * 그리드 뷰 렌더링
     */
    renderGridView(items) {
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
    renderListView(items) {
        const tbody = document.getElementById('heritage-list-tbody');
        if (!tbody) return;
        
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
     * 페이지네이션 렌더링
     */
    renderPagination(current, total, totalItems, containerId = 'pagination') {
        const container = document.getElementById(containerId);
        if (!container || total <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        const html = paginationManager.generatePaginationHTML(current, total, totalItems);
        container.innerHTML = html;
    }

    /**
     * 페이지 변경
     */
    async changePage(page) {
        // 🚨 중요: 로딩 중이면 무시
        if (this.isLoading) {
            console.log('이미 로딩 중이므로 페이지 변경 무시:', page);
            return;
        }
        
        // 🚨 중요: 페이지 번호 유효성 검사
        if (page < 1 || isNaN(page)) {
            console.warn('유효하지 않은 페이지 번호:', page);
            return;
        }
        
        // 🚨 중요: 현재 페이지와 동일하면 무시
        if (page === this.currentPage) {
            console.log('현재 페이지와 동일하므로 무시:', page);
            return;
        }
        
        console.log(`페이지 변경: ${this.currentPage} -> ${page}`);
        this.currentPage = page;
        this.isLoading = true;
        
        // 🚨 중요: 로딩 타임아웃 설정
        this.setLoadingTimeout();
        
        try {
            // 🚨 중요: URL 업데이트를 router.navigate()로 변경하여 상태 관리 개선
            const newUrl = this.createPageUrl(page);
            router.navigate(newUrl);
            
            // 직접 데이터 로드 (라우터를 거치지 않음)
            await this.loadHeritageList();
            
            // 🖼️ 다음 페이지 이미지 미리 로드
            setTimeout(() => {
                const nextPageStart = page * this.itemsPerPage;
                const nextPageEnd = nextPageStart + this.itemsPerPage;
                const nextPageItems = dataManager.heritageData.slice(nextPageStart, nextPageEnd);
                if (nextPageItems.length > 0) {
                    imageCacheManager.preloadImages(nextPageItems);
                }
            }, 500);
            
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('페이지 로딩 오류:', error);
            this.showErrorMessage('페이지를 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 페이지 URL 생성
     */
    createPageUrl(newPage) {
        const currentHash = window.location.hash.slice(1) || 'home';
        
        // 🚨 중요: URL 파싱 개선 - 더 정확한 컨텍스트 파악
        console.log(`🔗 URL 생성: 현재 해시=${currentHash}, 새 페이지=${newPage}`);
        
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

    /**
     * 뷰 모드 전환
     */
    async toggleViewMode(mode) {
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
        await this.loadHeritageList();
    }
}

// 전역으로 함수 등록
window.changePage = function(page) {
    if (window.homePage) {
        window.homePage.changePage(page);
    }
};