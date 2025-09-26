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
            console.log('❌ 데이터가 없어서 카테고리를 가져올 수 없습니다');
            return [];
        }

        const categories = new Set();
        data.forEach(item => {
            if (item.category && item.category.trim() !== '') {
                categories.add(item.category);
            }
            if (item.kdcd_name && item.kdcd_name.trim() !== '') {
                categories.add(item.kdcd_name);
            }
        });

        const result = Array.from(categories).sort();
        console.log('📋 발견된 카테고리:', result);
        return result;
    }

    /**
     * 사용 가능한 지역 목록 반환
     */
    getAvailableLocations() {
        const data = dataManager.heritageData;
        if (!data || data.length === 0) {
            console.log('❌ 데이터가 없어서 지역을 가져올 수 없습니다');
            return [];
        }

        const locations = new Set();
        data.forEach(item => {
            if (item.location && item.location.trim() !== '') {
                locations.add(item.location);
            }
            if (item.ctcd_name && item.ctcd_name.trim() !== '') {
                locations.add(item.ctcd_name);
            }
        });

        const result = Array.from(locations).sort();
        console.log('📍 발견된 지역:', result);
        return result;
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
        console.log('🔧 필터 옵션 업데이트 시작');
        this._updateCategoryOptions();
        this._updateLocationOptions();
        this._updatePeriodOptions();
        console.log('✅ 필터 옵션 업데이트 완료');
    }

    /**
     * 카테고리 옵션 업데이트
     */
    _updateCategoryOptions() {
        const categoryFilter = document.getElementById('category-filter');
        if (!categoryFilter) {
            console.log('❌ category-filter 요소를 찾을 수 없습니다');
            return;
        }

        const categories = this.getAvailableCategories();
        console.log('📋 사용 가능한 카테고리:', categories);
        
        categoryFilter.innerHTML = '<option value="">모든 카테고리</option>' + 
            categories.map(category => `<option value="${category}">${category}</option>`).join('');
        
        console.log('✅ 카테고리 옵션 업데이트 완료:', categories.length, '개');
    }

    /**
     * 지역 옵션 업데이트
     */
    _updateLocationOptions() {
        const locationFilter = document.getElementById('location-filter');
        if (!locationFilter) {
            console.log('❌ location-filter 요소를 찾을 수 없습니다');
            return;
        }

        const locations = this.getAvailableLocations();
        console.log('📍 사용 가능한 지역:', locations);
        
        locationFilter.innerHTML = '<option value="">모든 지역</option>' + 
            locations.map(location => `<option value="${location}">${location}</option>`).join('');
        
        console.log('✅ 지역 옵션 업데이트 완료:', locations.length, '개');
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