/**
 * 공통 렌더링 컴포넌트
 * 모든 페이지에서 사용하는 렌더링 함수들을 통합
 */
class Renderer {
    /**
     * 문화재 목록 렌더링 (뷰 모드에 따라)
     */
    static renderHeritageList(items, containerId = 'heritage-grid', tbodyId = 'heritage-list-tbody') {
        // 현재 뷰 모드 확인
        const isGridView = document.getElementById('grid-view-btn')?.checked !== false;
        
        if (items.length === 0) {
            this.renderEmptyState(isGridView, containerId, tbodyId);
            return;
        }
        
        if (isGridView) {
            this.renderGridView(items, containerId);
        } else {
            this.renderListView(items, tbodyId);
        }
    }

    /**
     * 빈 상태 렌더링
     */
    static renderEmptyState(isGridView, containerId, tbodyId) {
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
            const container = document.getElementById(containerId);
            if (container) container.innerHTML = emptyState;
        } else {
            const tbody = document.getElementById(tbodyId);
            if (tbody) {
                tbody.innerHTML = `
                    <tr><td colspan="6" class="text-center py-5">
                        <div class="empty-state">
                            <i class="fas fa-search fa-2x text-muted mb-2"></i>
                            <h5>검색 결과가 없습니다</h5>
                            <p class="text-muted mb-0">다른 검색어나 필터를 시도해보세요.</p>
                        </div>
                    </td></tr>
                `;
            }
        }
    }

    /**
     * 그리드 뷰 렌더링
     */
    static renderGridView(items, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = items.map(item => this.createGridItemHTML(item)).join('');
    }

    /**
     * 리스트 뷰 렌더링
     */
    static renderListView(items, tbodyId) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;
        
        tbody.innerHTML = items.map(item => this.createListItemHTML(item)).join('');
    }

    /**
     * 그리드 아이템 HTML 생성
     */
    static createGridItemHTML(item) {
        return `
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
                            ${this.getDescriptionText(item)}
                        </p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">${item.period || '시대 정보 없음'}</small>
                            <small class="text-primary">${item.designation_no || ''}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 리스트 아이템 HTML 생성
     */
    static createListItemHTML(item) {
        return `
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
                    <span class="badge category-badge category-${item.category}">${item.category}</span>
                </td>
                <td>
                    <span class="text-muted">${item.location || '정보 없음'}</span>
                </td>
                <td>
                    <div class="heritage-list-desc">
                        ${this.getDescriptionText(item, 150)}
                    </div>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); viewHeritageDetail('${item.name}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * 설명 텍스트 생성 (언어별)
     */
    static getDescriptionText(item, maxLength = 100) {
        const isKorean = dataManager.currentLanguage === 'ko';
        
        if (isKorean) {
            return item.korean_description 
                ? item.korean_description.substring(0, maxLength) + '...' 
                : '설명 없음';
        } else {
            return item.english_description 
                ? item.english_description.substring(0, maxLength) + '...' 
                : '영문 설명 준비 중...';
        }
    }

    /**
     * 페이지네이션 렌더링
     */
    static renderPagination(current, total, totalItems, containerId = 'pagination') {
        const container = document.getElementById(containerId);
        if (!container || total <= 1) {
            if (container) container.innerHTML = '';
            return;
        }

        const html = paginationManager.generatePaginationHTML(current, total, totalItems);
        container.innerHTML = html;
    }

    /**
     * 뷰 모드 전환
     */
    static toggleViewMode(mode, gridContainerId = 'heritage-grid', tableContainerId = 'heritage-table') {
        const gridContainer = document.getElementById(gridContainerId);
        const tableContainer = document.getElementById(tableContainerId);
        
        if (mode === 'grid') {
            if (gridContainer) gridContainer.style.display = 'block';
            if (tableContainer) tableContainer.style.display = 'none';
        } else {
            if (gridContainer) gridContainer.style.display = 'none';
            if (tableContainer) tableContainer.style.display = 'block';
        }
    }

    /**
     * 카운트 업데이트
     */
    static updateCount(count, elementId) {
        const countElement = document.getElementById(elementId);
        if (countElement) {
            countElement.textContent = count.toLocaleString();
        }
    }

    /**
     * 에러 메시지 표시
     */
    static showErrorMessage(message) {
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
     * 로딩 타임아웃 설정
     */
    static setLoadingTimeout(isLoadingRef, callback) {
        setTimeout(() => {
            if (isLoadingRef.current) {
                console.error('⚠️ 10초 타임아웃: 강제로 로딩 상태 해제');
                isLoadingRef.current = false;
                this.showErrorMessage('페이지 로딩이 너무 오래 걸립니다. 새로고침을 시도해보세요.');
                if (callback) callback();
            }
        }, 10000);
    }

    /**
     * 페이지네이션 데이터 생성
     */
    static getPaginatedData(data, page, itemsPerPage = 20) {
        if (!data || data.length === 0) return null;
        
        const totalPages = Math.ceil(data.length / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        
        return {
            items: data.slice(startIndex, endIndex),
            currentPage: page,
            totalPages: totalPages,
            totalItems: data.length
        };
    }
}