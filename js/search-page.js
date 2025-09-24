/**
 * 검색 페이지 관련 기능을 담당하는 클래스
 */
class SearchPage {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.isLoading = false;
        this.currentQuery = '';
        this.currentSearchOption = 'title+description';
    }

    /**
     * 검색 수행 (라우터에서 호출)
     */
    async performSearch(query, searchOption = 'title+description') {
        this.currentPage = 1;
        this.currentQuery = query;
        this.currentSearchOption = searchOption;
        
        document.getElementById('globalSearch').value = query;
        
        // 검색 옵션 드롭다운 업데이트
        const searchOptionSelect = document.getElementById('searchOption');
        if (searchOptionSelect) {
            searchOptionSelect.value = searchOption;
        }
        
        await this.loadSearchResults(query, searchOption);
    }

    /**
     * 글로벌 검색 수행
     */
    performGlobalSearch(query, searchOption = 'title+description') {
        // 검색 옵션을 URL에 포함하여 전달
        const encodedQuery = encodeURIComponent(query);
        const encodedOption = encodeURIComponent(searchOption);
        router.navigate(`search/${encodedQuery}?option=${encodedOption}`);
    }

    /**
     * 검색 결과 로드
     */
    async loadSearchResults(query, searchOption) {
        // 데이터 매니저가 준비될 때까지 기다리기
        await dataManager.waitForData();
        
        console.log('검색 결과 로드 시작:', { query, searchOption, currentPage: this.currentPage });
        
        try {
            // 검색 수행
            const results = dataManager.search(query, '', '', searchOption);
            
            // 🚨 중요: 빈 결과 처리
            if (!results || results.length === 0) {
                console.log('검색 결과가 없습니다');
                this.renderSearchResults([]);
                this.renderSearchPagination(1, 1, 0);
                return;
            }
            
            // 🚀 최적화된 페이지네이션
            const paginationData = this.getPaginatedData(results, this.currentPage);
            
            if (!paginationData) {
                console.warn('페이지네이션 데이터 없음');
                this.renderSearchResults([]);
                return;
            }
            
            console.log(`🚀 검색 결과 로드 완료: ${paginationData.items.length}개 항목 (${paginationData.currentPage}/${paginationData.totalPages})`);
            
            // 결과 렌더링
            this.renderSearchResults(paginationData.items);
            
            // 페이지네이션 렌더링
            this.renderSearchPagination(paginationData.currentPage, paginationData.totalPages, paginationData.totalItems);
            
        } catch (error) {
            console.error('검색 결과 로드 오류:', error);
            this.showErrorMessage('검색 결과를 불러오는 중 오류가 발생했습니다.');
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
     * 검색 결과 렌더링
     */
    renderSearchResults(items) {
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
     * 검색 페이지네이션 렌더링
     */
    renderSearchPagination(current, total, totalItems) {
        const container = document.getElementById('pagination');
        if (!container || total <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        const html = paginationManager.generatePaginationHTML(current, total, totalItems);
        container.innerHTML = html;
    }

    /**
     * 검색 페이지 변경
     */
    async changeSearchPage(page) {
        // 🚨 중요: 로딩 중이면 무시
        if (this.isLoading) {
            console.log('이미 로딩 중이므로 검색 페이지 변경 무시:', page);
            return;
        }
        
        // 🚨 중요: 페이지 번호 유효성 검사
        if (page < 1 || isNaN(page)) {
            console.warn('유효하지 않은 검색 페이지 번호:', page);
            return;
        }
        
        // 🚨 중요: 현재 페이지와 동일하면 무시
        if (page === this.currentPage) {
            console.log('현재 검색 페이지와 동일하므로 무시:', page);
            return;
        }
        
        console.log(`검색 페이지 변경: ${this.currentPage} -> ${page}`);
        this.currentPage = page;
        this.isLoading = true;
        
        // 🚨 중요: 로딩 타임아웃 설정
        this.setLoadingTimeout();
        
        try {
            // URL 업데이트
            const newUrl = this.createSearchPageUrl(page);
            router.navigate(newUrl);
            
            // 검색 결과 다시 로드
            await this.loadSearchResults(this.currentQuery, this.currentSearchOption);
            
            window.scrollTo(0, 0);
        } catch (error) {
            console.error('검색 페이지 로딩 오류:', error);
            this.showErrorMessage('검색 페이지를 불러오는 중 오류가 발생했습니다.');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 검색 페이지 URL 생성
     */
    createSearchPageUrl(newPage) {
        const encodedQuery = encodeURIComponent(this.currentQuery);
        const encodedOption = encodeURIComponent(this.currentSearchOption);
        return `search/${encodedQuery}?option=${encodedOption}&page=${newPage}`;
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
     * 미분류 항목 뷰 로드
     */
    async loadUnclassifiedView(unclassifiedType = 'sido-type') {
        console.log('🗂️ 미분류 항목 뷰 로드:', unclassifiedType);
        
        // 데이터 매니저가 준비될 때까지 기다리기
        await dataManager.waitForData();
        
        try {
            // 미분류 항목 필터링
            const unclassifiedData = dataManager.heritageData.filter(item => {
                switch (unclassifiedType) {
                    case 'sido-type':
                        return item.kdcd_name === '시도유형문화재';
                    case 'sido-folklore':
                        return item.kdcd_name === '시도민속문화재';
                    case 'cultural-data':
                        return item.kdcd_name === '문화재자료';
                    case 'others':
                        return item.kdcd_name === '미분류' || item.ctcd_name === '미분류';
                    default:
                        return false;
                }
            });
            
            console.log(`✅ 미분류 항목 필터링 완료: ${unclassifiedData.length}건`);
            
            // 제목 업데이트
            const titleElement = document.getElementById('unclassified-title');
            if (titleElement) {
                const typeNames = {
                    'sido-type': '시도유형문화재',
                    'sido-folklore': '시도민속문화재',
                    'cultural-data': '문화재자료',
                    'others': '기타 미분류'
                };
                titleElement.textContent = typeNames[unclassifiedType] || '미분류 항목';
            }
            
            // 카운트 업데이트
            const countElement = document.getElementById('unclassified-count');
            if (countElement) {
                countElement.textContent = unclassifiedData.length;
            }
            
            // 필터 업데이트
            const typeFilter = document.getElementById('unclassified-type-filter');
            if (typeFilter) {
                typeFilter.value = unclassifiedType;
            }
            
            // 결과 렌더링
            this.renderUnclassifiedResults(unclassifiedData);
            
        } catch (error) {
            console.error('❌ 미분류 항목 뷰 로드 실패:', error);
            this.showErrorMessage('미분류 항목을 불러오는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 미분류 항목 결과 렌더링
     */
    renderUnclassifiedResults(items) {
        // 현재 뷰 모드 확인
        const isGridView = document.getElementById('unclassified-grid-btn')?.checked !== false;
        
        if (items.length === 0) {
            const emptyState = `
                <div class="col-12 text-center py-5">
                    <div class="empty-state">
                        <i class="fas fa-question-circle fa-3x text-muted mb-3"></i>
                        <h4>미분류 항목이 없습니다</h4>
                        <p class="text-muted">해당 분류에 속하는 항목이 없습니다.</p>
                    </div>
                </div>
            `;
            
            if (isGridView) {
                document.getElementById('unclassified-grid').innerHTML = emptyState;
            } else {
                document.getElementById('unclassified-list-tbody').innerHTML = `
                    <tr><td colspan="6" class="text-center py-5">
                        <div class="empty-state">
                            <i class="fas fa-question-circle fa-2x text-muted mb-2"></i>
                            <h5>미분류 항목이 없습니다</h5>
                            <p class="text-muted mb-0">해당 분류에 속하는 항목이 없습니다.</p>
                        </div>
                    </td></tr>
                `;
            }
            return;
        }
        
        if (isGridView) {
            this.renderUnclassifiedGridView(items);
        } else {
            this.renderUnclassifiedListView(items);
        }
    }

    /**
     * 미분류 항목 그리드 뷰 렌더링
     */
    renderUnclassifiedGridView(items) {
        const container = document.getElementById('unclassified-grid');
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
                            <span class="badge category-badge category-${item.kdcd_name}">${item.kdcd_name}</span>
                            <small class="text-muted">${item.ctcd_name}</small>
                        </div>
                        <h6 class="card-title">${item.name}</h6>
                        <p class="card-text text-truncate-2">
                            ${dataManager.currentLanguage === 'ko' 
                                ? (item.content ? item.content.substring(0, 100) + '...' : '설명 없음')
                                : (item.content_en ? item.content_en.substring(0, 100) + '...' : '영문 설명 준비 중...')
                            }
                        </p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">${item.period || '시대 정보 없음'}</small>
                            <small class="text-primary">${item.composite_key || ''}</small>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * 미분류 항목 리스트 뷰 렌더링
     */
    renderUnclassifiedListView(items) {
        const tbody = document.getElementById('unclassified-list-tbody');
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
                    ${item.composite_key ? `<small class="text-muted">${item.composite_key}</small>` : ''}
                </td>
                <td>
                    <span class="badge category-badge category-${item.kdcd_name}">${item.kdcd_name}</span>
                </td>
                <td>
                    <span class="text-muted">${item.ctcd_name || '정보 없음'}</span>
                    ${item.period ? `<br><small class="text-muted">${item.period}</small>` : ''}
                </td>
                <td>
                    <div class="heritage-list-desc">
                        ${dataManager.currentLanguage === 'ko' 
                            ? (item.content ? item.content.substring(0, 150) + '...' : '설명 없음')
                            : (item.content_en ? item.content_en.substring(0, 150) + '...' : '영문 설명 준비 중...')
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
window.performGlobalSearch = function(query, searchOption) {
    if (window.searchPage) {
        window.searchPage.performGlobalSearch(query, searchOption);
    }
};

window.performSearch = function(query, searchOption) {
    if (window.searchPage) {
        window.searchPage.performSearch(query, searchOption);
    }
};

window.changeSearchPage = function(page) {
    if (window.searchPage) {
        window.searchPage.changeSearchPage(page);
    }
};

window.loadUnclassifiedView = function(unclassifiedType) {
    if (window.searchPage) {
        window.searchPage.loadUnclassifiedView(unclassifiedType);
    }
};