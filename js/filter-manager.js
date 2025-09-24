/**
 * 필터링 기능 전용 모듈
 * 카테고리, 지역, 기타 필터링 기능
 */
class FilterManager {
    constructor() {
        this.currentFilters = {
            category: '',
            location: '',
            period: '',
            designation: ''
        };
        this.filteredData = [];
        this.filterCache = new Map();
    }

    /**
     * 🚀 4축 필터링 시스템
     */
    applyFilters() {
        const data = dataManager.heritageData;
        if (!data || data.length === 0) {
            this.filteredData = [];
            return this.filteredData;
        }

        // 필터 키 생성
        const filterKey = this._generateFilterKey();
        
        // 캐시된 결과가 있으면 반환
        if (this.filterCache.has(filterKey)) {
            this.filteredData = this.filterCache.get(filterKey);
            return this.filteredData;
        }

        // 필터 적용
        let results = data;

        // 1. 카테고리 필터
        if (this.currentFilters.category) {
            results = results.filter(item => 
                item.category === this.currentFilters.category ||
                item.kdcd_name === this.currentFilters.category
            );
        }

        // 2. 지역 필터
        if (this.currentFilters.location) {
            results = results.filter(item => 
                (item.location && item.location.includes(this.currentFilters.location)) ||
                (item.ctcd_name && item.ctcd_name.includes(this.currentFilters.location))
            );
        }

        // 3. 시대 필터
        if (this.currentFilters.period) {
            results = results.filter(item => 
                item.period && item.period.includes(this.currentFilters.period)
            );
        }

        // 4. 지정번호 필터
        if (this.currentFilters.designation) {
            results = results.filter(item => 
                item.designation_no && item.designation_no.includes(this.currentFilters.designation)
            );
        }

        this.filteredData = results;

        // 캐시에 저장 (최대 50개까지만)
        if (this.filterCache.size >= 50) {
            const firstKey = this.filterCache.keys().next().value;
            this.filterCache.delete(firstKey);
        }
        this.filterCache.set(filterKey, results);

        return results;
    }

    /**
     * 필터 키 생성
     */
    _generateFilterKey() {
        return Object.values(this.currentFilters).join('|');
    }

    /**
     * 카테고리 필터 설정
     */
    setCategoryFilter(category) {
        this.currentFilters.category = category;
        this._updateFilterUI();
    }

    /**
     * 지역 필터 설정
     */
    setLocationFilter(location) {
        this.currentFilters.location = location;
        this._updateFilterUI();
    }

    /**
     * 시대 필터 설정
     */
    setPeriodFilter(period) {
        this.currentFilters.period = period;
        this._updateFilterUI();
    }

    /**
     * 지정번호 필터 설정
     */
    setDesignationFilter(designation) {
        this.currentFilters.designation = designation;
        this._updateFilterUI();
    }

    /**
     * 필터 UI 업데이트
     */
    _updateFilterUI() {
        // 카테고리 필터 UI 업데이트
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.value = this.currentFilters.category;
        }

        // 지역 필터 UI 업데이트
        const locationFilter = document.getElementById('location-filter');
        if (locationFilter) {
            locationFilter.value = this.currentFilters.location;
        }
    }

    /**
     * 모든 필터 초기화
     */
    resetFilters() {
        this.currentFilters = {
            category: '',
            location: '',
            period: '',
            designation: ''
        };
        this.filteredData = [];
        this.filterCache.clear();
        this._updateFilterUI();
    }

    /**
     * 현재 필터된 데이터 반환
     */
    getFilteredData() {
        return this.filteredData;
    }

    /**
     * 현재 필터 상태 반환
     */
    getCurrentFilters() {
        return { ...this.currentFilters };
    }

    /**
     * 사용 가능한 카테고리 목록 반환
     */
    getAvailableCategories() {
        const data = dataManager.heritageData;
        if (!data || data.length === 0) {
            return [];
        }

        const categories = new Set();
        data.forEach(item => {
            if (item.category) categories.add(item.category);
            if (item.kdcd_name) categories.add(item.kdcd_name);
        });

        return Array.from(categories).sort();
    }

    /**
     * 사용 가능한 지역 목록 반환
     */
    getAvailableLocations() {
        const data = dataManager.heritageData;
        if (!data || data.length === 0) {
            return [];
        }

        const locations = new Set();
        data.forEach(item => {
            if (item.location) locations.add(item.location);
            if (item.ctcd_name) locations.add(item.ctcd_name);
        });

        return Array.from(locations).sort();
    }

    /**
     * 사용 가능한 시대 목록 반환
     */
    getAvailablePeriods() {
        const data = dataManager.heritageData;
        if (!data || data.length === 0) {
            return [];
        }

        const periods = new Set();
        data.forEach(item => {
            if (item.period) {
                periods.add(item.period);
            }
        });

        return Array.from(periods).sort();
    }

    /**
     * 필터 옵션 UI 업데이트
     */
    updateFilterOptions() {
        this._updateCategoryOptions();
        this._updateLocationOptions();
        this._updatePeriodOptions();
    }

    /**
     * 카테고리 옵션 업데이트
     */
    _updateCategoryOptions() {
        const categoryFilter = document.getElementById('category-filter');
        if (!categoryFilter) return;

        const categories = this.getAvailableCategories();
        categoryFilter.innerHTML = '<option value="">모든 카테고리</option>' + 
            categories.map(category => `<option value="${category}">${category}</option>`).join('');
    }

    /**
     * 지역 옵션 업데이트
     */
    _updateLocationOptions() {
        const locationFilter = document.getElementById('location-filter');
        if (!locationFilter) return;

        const locations = this.getAvailableLocations();
        locationFilter.innerHTML = '<option value="">모든 지역</option>' + 
            locations.map(location => `<option value="${location}">${location}</option>`).join('');
    }

    /**
     * 시대 옵션 업데이트
     */
    _updatePeriodOptions() {
        const periodFilter = document.getElementById('period-filter');
        if (!periodFilter) return;

        const periods = this.getAvailablePeriods();
        periodFilter.innerHTML = '<option value="">모든 시대</option>' + 
            periods.map(period => `<option value="${period}">${period}</option>`).join('');
    }

    /**
     * 필터 캐시 클리어
     */
    clearFilterCache() {
        this.filterCache.clear();
    }

    /**
     * 필터 통계 반환
     */
    getFilterStats() {
        return {
            activeFilters: Object.values(this.currentFilters).filter(f => f !== '').length,
            filteredCount: this.filteredData.length,
            cacheSize: this.filterCache.size
        };
    }
}

// 전역 인스턴스 생성
window.filterManager = new FilterManager();