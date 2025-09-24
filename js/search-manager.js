/**
 * 검색 기능 전용 모듈
 * 문화재 데이터 검색 및 필터링 기능
 */
class SearchManager {
    constructor() {
        this.searchCache = new Map();
        this.lastSearchQuery = '';
        this.lastSearchResults = [];
    }

    /**
     * 🚀 최적화된 검색 기능
     */
    search(query, categoryFilter = '', locationFilter = '', searchOption = 'title+description') {
        if (!query || query.trim() === '') {
            return this._getAllData();
        }

        const searchKey = `${query}|${categoryFilter}|${locationFilter}|${searchOption}`;
        
        // 캐시된 결과가 있으면 반환
        if (this.searchCache.has(searchKey)) {
            return this.searchCache.get(searchKey);
        }

        const results = this._performSearch(query, categoryFilter, locationFilter, searchOption);
        
        // 캐시에 저장 (최대 100개까지만)
        if (this.searchCache.size >= 100) {
            const firstKey = this.searchCache.keys().next().value;
            this.searchCache.delete(firstKey);
        }
        this.searchCache.set(searchKey, results);
        
        return results;
    }

    /**
     * 실제 검색 수행
     */
    _performSearch(query, categoryFilter, locationFilter, searchOption) {
        const data = dataManager.heritageData;
        if (!data || data.length === 0) {
            return [];
        }

        let results = data;

        // 카테고리 필터 적용
        if (categoryFilter && categoryFilter.trim() !== '') {
            results = results.filter(item => 
                item.category === categoryFilter || 
                item.kdcd_name === categoryFilter
            );
        }

        // 지역 필터 적용
        if (locationFilter && locationFilter.trim() !== '') {
            results = results.filter(item => 
                (item.location && item.location.includes(locationFilter)) ||
                (item.ctcd_name && item.ctcd_name.includes(locationFilter))
            );
        }

        // 검색어 필터 적용
        if (query && query.trim() !== '') {
            const searchTerms = query.toLowerCase().trim().split(/\s+/);
            results = results.filter(item => {
                return this._matchesSearchTerms(item, searchTerms, searchOption);
            });
        }

        return results;
    }

    /**
     * 검색어 매칭 확인
     */
    _matchesSearchTerms(item, searchTerms, searchOption) {
        const searchFields = this._getSearchFields(item, searchOption);
        const searchText = searchFields.join(' ').toLowerCase();

        return searchTerms.every(term => 
            searchText.includes(term.toLowerCase())
        );
    }

    /**
     * 검색 대상 필드 결정
     */
    _getSearchFields(item, searchOption) {
        const fields = [];
        
        switch (searchOption) {
            case 'title':
                fields.push(item.name || '');
                break;
            case 'description':
                fields.push(item.korean_description || '');
                fields.push(item.english_description || '');
                break;
            case 'title+description':
            default:
                fields.push(item.name || '');
                fields.push(item.korean_description || '');
                fields.push(item.english_description || '');
                break;
        }
        
        return fields.filter(field => field && field.trim() !== '');
    }

    /**
     * 모든 데이터 반환
     */
    _getAllData() {
        return dataManager.heritageData || [];
    }

    /**
     * 카테고리별 데이터 검색
     */
    getByCategory(category) {
        const data = dataManager.heritageData;
        if (!data || data.length === 0) {
            return [];
        }

        return data.filter(item => 
            item.category === category || 
            item.kdcd_name === category
        );
    }

    /**
     * 이름으로 특정 아이템 검색
     */
    getByName(name) {
        const data = dataManager.heritageData;
        if (!data || data.length === 0) {
            return null;
        }

        return data.find(item => 
            item.name === name || 
            item.composite_key === name
        );
    }

    /**
     * 지역별 데이터 검색
     */
    getByLocation(location) {
        const data = dataManager.heritageData;
        if (!data || data.length === 0) {
            return [];
        }

        return data.filter(item => 
            (item.location && item.location.includes(location)) ||
            (item.ctcd_name && item.ctcd_name.includes(location))
        );
    }

    /**
     * 검색 캐시 클리어
     */
    clearSearchCache() {
        this.searchCache.clear();
    }

    /**
     * 현재 검색 결과 반환
     */
    getCurrentSearchResults() {
        return this.lastSearchResults;
    }

    /**
     * 검색 통계 반환
     */
    getSearchStats() {
        return {
            cacheSize: this.searchCache.size,
            lastQuery: this.lastSearchQuery,
            resultCount: this.lastSearchResults.length
        };
    }
}

// 전역 인스턴스 생성
window.searchManager = new SearchManager();