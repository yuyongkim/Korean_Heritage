/**
 * 🚀 고성능 페이지네이션 매니저 - 캐싱 시스템
 */
class PaginationManager {
    constructor(itemsPerPage = 20) {
        this.itemsPerPage = itemsPerPage;
        this.cache = new Map();
        this.maxCacheSize = 100; // 최대 100개 페이지 캐시
    }

    /**
     * 🚀 캐시된 페이지네이션 데이터 반환
     */
    getPaginatedData(data, page) {
        const cacheKey = this._generateCacheKey(data, page);
        
        // 🚀 캐시에서 먼저 확인
        if (this.cache.has(cacheKey)) {
            console.log('🚀 페이지네이션 캐시 사용:', page);
            return this.cache.get(cacheKey);
        }

        const result = this._calculatePagination(data, page);
        
        // 🚀 결과 캐싱
        this._cacheResult(cacheKey, result);
        
        console.log(`📄 페이지 ${page} 생성: ${result.items.length}개 항목`);
        return result;
    }

    /**
     * 🚀 페이지네이션 계산
     */
    _calculatePagination(data, page) {
        if (!Array.isArray(data) || data.length === 0) {
            return {
                items: [],
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                hasNext: false,
                hasPrev: false,
                startIndex: 0,
                endIndex: 0
            };
        }

        const totalPages = Math.ceil(data.length / this.itemsPerPage);
        
        // 🚀 페이지 유효성 검사
        if (page < 1 || page > totalPages) {
            console.warn(`❌ 잘못된 페이지: ${page} (총 ${totalPages}페이지)`);
            return null;
        }

        const startIndex = (page - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, data.length);
        const items = data.slice(startIndex, endIndex);

        return {
            items,
            currentPage: page,
            totalPages,
            totalItems: data.length,
            hasNext: page < totalPages,
            hasPrev: page > 1,
            startIndex: startIndex + 1,
            endIndex: endIndex
        };
    }

    /**
     * 🚀 캐시 키 생성
     */
    _generateCacheKey(data, page) {
        if (!Array.isArray(data)) return `empty-${page}`;
        
        // 데이터 해시 생성 (성능을 위해 길이와 첫 항목만 사용)
        const dataHash = `${data.length}-${data[0]?.name || 'unknown'}`;
        return `${dataHash}-${page}-${this.itemsPerPage}`;
    }

    /**
     * 🚀 결과 캐싱
     */
    _cacheResult(cacheKey, result) {
        // 🚀 캐시 크기 제한
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(cacheKey, result);
    }

    /**
     * 🚀 캐시 무효화
     */
    clearCache() {
        this.cache.clear();
        console.log('🔄 페이지네이션 캐시 클리어');
    }

    /**
     * 🚀 특정 데이터에 대한 캐시 무효화
     */
    invalidateDataCache(data) {
        if (!Array.isArray(data)) return;
        
        const dataHash = `${data.length}-${data[0]?.name || 'unknown'}`;
        const keysToDelete = [];
        
        for (const key of this.cache.keys()) {
            if (key.startsWith(dataHash)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log(`🔄 데이터 캐시 무효화: ${keysToDelete.length}개 항목`);
    }

    /**
     * 🚀 페이지네이션 HTML 생성
     */
    generatePaginationHTML(current, totalPages, totalItems, baseUrl = '#') {
        if (totalPages <= 1) return '';

        let html = '<nav aria-label="페이지네이션"><ul class="pagination justify-content-center">';
        
        // 이전 버튼
        html += `
            <li class="page-item ${current <= 1 ? 'disabled' : ''}">
                <a class="page-link" href="${baseUrl}?page=${current - 1}" 
                   onclick="changePage(${current - 1}); return false;">이전</a>
            </li>
        `;
        
        // 페이지 번호들
        const start = Math.max(1, current - 2);
        const end = Math.min(totalPages, current + 2);
        
        if (start > 1) {
            html += `<li class="page-item"><a class="page-link" href="${baseUrl}?page=1" onclick="changePage(1); return false;">1</a></li>`;
            if (start > 2) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
        
        for (let i = start; i <= end; i++) {
            html += `
                <li class="page-item ${i === current ? 'active' : ''}">
                    <a class="page-link" href="${baseUrl}?page=${i}" 
                       onclick="changePage(${i}); return false;">${i}</a>
                </li>
            `;
        }
        
        if (end < totalPages) {
            if (end < totalPages - 1) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            html += `<li class="page-item"><a class="page-link" href="${baseUrl}?page=${totalPages}" onclick="changePage(${totalPages}); return false;">${totalPages}</a></li>`;
        }
        
        // 다음 버튼
        html += `
            <li class="page-item ${current >= totalPages ? 'disabled' : ''}">
                <a class="page-link" href="${baseUrl}?page=${current + 1}" 
                   onclick="changePage(${current + 1}); return false;">다음</a>
            </li>
        `;
        
        html += '</ul></nav>';
        
        // 결과 정보
        const startItem = (current - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(current * this.itemsPerPage, totalItems);
        html += `<div class="text-center text-muted mt-2">${startItem}-${endItem} / 총 ${totalItems}개</div>`;
        
        return html;
    }

    /**
     * 🚀 통계 정보 반환
     */
    getCacheStats() {
        return {
            cacheSize: this.cache.size,
            maxCacheSize: this.maxCacheSize,
            itemsPerPage: this.itemsPerPage
        };
    }
}

// 🚀 전역 페이지네이션 매니저
const paginationManager = new PaginationManager(20);

// 🚀 기존 함수들과의 호환성을 위한 래퍼 함수들
function getPaginatedData(data, page) {
    return paginationManager.getPaginatedData(data, page);
}

function renderPagination(current, totalPages, totalItems, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const html = paginationManager.generatePaginationHTML(current, totalPages, totalItems);
    container.innerHTML = html;
}

function clearPaginationCache() {
    paginationManager.clearCache();
}

function invalidateDataCache(data) {
    paginationManager.invalidateDataCache(data);
}