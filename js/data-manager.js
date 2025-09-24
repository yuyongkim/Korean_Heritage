/**
 * 데이터 관리자 - 메인 조정자 (리팩토링된 버전)
 * 작은 모듈들을 조합하여 데이터 관리 기능 제공
 */
class DataManager {
    constructor() {
        this.heritageData = [];
        this.isLoaded = false;
        this.isLoading = false;
        this.currentLanguage = 'ko';
        
        // 이벤트 시스템 초기화
        this.eventListeners = {
            dataLoaded: [],
            dataUpdated: [],
            statisticsChanged: []
        };
        
        this.setupLanguageToggle();
    }
    
    /**
     * 이벤트 리스너 추가
     */
    addEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }
    
    /**
     * 이벤트 발생
     */
    emit(event, data = null) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`이벤트 리스너 오류 (${event}):`, error);
                }
            });
        }
    }
    
    /**
     * 🚀 최적화된 데이터 로드 (작은 모듈들 사용)
     */
    async loadData() {
        if (this.isLoaded && this.heritageData.length > 0) {
            return this.heritageData;
        }

        if (this.isLoading) {
            return await this._waitForLoad();
        }

        this.isLoading = true;
        
        try {
            // DataLoader 모듈 사용
            this.heritageData = await window.dataLoader.loadData();
            this.isLoaded = true;
            
            // 이벤트 발생
            this.emit('dataLoaded', this.heritageData);
            
            debugLog('✅ 데이터 로드 완료:', this.heritageData.length, '개 항목');
            return this.heritageData;
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            this.heritageData = [];
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 로딩 완료 대기
     */
    async _waitForLoad() {
        return new Promise((resolve) => {
            const checkLoaded = () => {
                if (this.isLoaded) {
                    resolve(this.heritageData);
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            checkLoaded();
        });
    }

    /**
     * 데이터 로드 상태 확인
     */
    async waitForData() {
        if (this.isLoaded) {
            return this.heritageData;
        }
        
        return await this.loadData();
    }

    /**
     * 🚀 검색 기능 (직접 구현)
     */
    search(query, categoryFilter = '', locationFilter = '', searchOption = 'title+description') {
        if (!query || query.trim() === '') {
            return this.heritageData;
        }

        let results = this.heritageData;

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
     * 카테고리별 데이터 검색
     */
    getByCategory(category) {
        if (!this.heritageData || this.heritageData.length === 0) {
            return [];
        }

        return this.heritageData.filter(item => 
            item.category === category || 
            item.kdcd_name === category
        );
    }

    /**
     * 이름으로 데이터 검색
     */
    getByName(name) {
        if (!this.heritageData || this.heritageData.length === 0) {
            return null;
        }

        return this.heritageData.find(item => 
            item.name === name || 
            item.composite_key === name
        );
    }

    /**
     * 지역별 데이터 검색
     */
    getByLocation(location) {
        if (!this.heritageData || this.heritageData.length === 0) {
            return [];
        }

        return this.heritageData.filter(item => 
            (item.location && item.location.includes(location)) ||
            (item.ctcd_name && item.ctcd_name.includes(location))
        );
    }

    /**
     * 🚀 필터링 기능 (직접 구현)
     */
    applyFilters() {
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const locationFilter = document.getElementById('location-filter')?.value || '';
        
        let results = this.heritageData;

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

        return results;
    }

    /**
     * 현재 필터된 데이터 반환
     */
    getCurrentData() {
        return this.applyFilters();
    }

    /**
     * 🚀 통계 계산 (직접 구현)
     */
    getStatistics() {
        if (!this.heritageData || this.heritageData.length === 0) {
            return {
                total: 0,
                categories: {},
                locations: {},
                periods: {},
                locationCount: 0,
                translationRate: 0,
                unclassifiedCount: 0
            };
        }

        const stats = {
            total: this.heritageData.length,
            categories: {},
            locations: {},
            periods: {},
            locationCount: 0,
            translationRate: 0,
            unclassifiedCount: 0
        };

        // 카테고리별 통계
        this.heritageData.forEach(item => {
            const category = item.category || item.kdcd_name || '미분류';
            stats.categories[category] = (stats.categories[category] || 0) + 1;
        });

        // 지역별 통계
        const uniqueLocations = new Set();
        this.heritageData.forEach(item => {
            const location = item.location || item.ctcd_name;
            if (location) {
                uniqueLocations.add(location);
                stats.locations[location] = (stats.locations[location] || 0) + 1;
            }
        });
        stats.locationCount = uniqueLocations.size;

        // 시대별 통계
        this.heritageData.forEach(item => {
            if (item.period) {
                stats.periods[item.period] = (stats.periods[item.period] || 0) + 1;
            }
        });

        // 번역률 계산
        const translatedCount = this.heritageData.filter(item => {
            const englishDesc = item.english_description;
            if (!englishDesc) return false;
            
            const descStr = String(englishDesc).trim();
            return descStr !== '' && 
                   descStr !== 'null' && 
                   descStr !== 'undefined' &&
                   descStr !== '영문 설명 준비 중입니다.' &&
                   !descStr.includes('Description not available');
        }).length;

        stats.translationRate = this.heritageData.length > 0 ? Math.round((translatedCount / this.heritageData.length) * 100) : 0;

        // 미분류 항목 수
        stats.unclassifiedCount = this.heritageData.filter(item => 
            item.category === '미분류' || 
            item.kdcd_name === '미분류' || 
            item.ctcd_name === '미분류' ||
            item.location === '미분류'
        ).length;

        return stats;
    }

    /**
     * 대시보드용 통계
     */
    getDashboardStats() {
        return this.getStatistics();
    }

    /**
     * 번역 통계
     */
    getTranslationStats() {
        const stats = this.getStatistics();
        return {
            total: stats.total,
            translated: Math.round((stats.total * stats.translationRate) / 100),
            rate: stats.translationRate
        };
    }

    /**
     * 미분류 항목 통계
     */
    getUnclassifiedStats() {
        if (!this.heritageData || this.heritageData.length === 0) {
            return {
                total: 0,
                byType: {}
            };
        }

        const unclassified = {
            sidoType: this.heritageData.filter(item => item.kdcd_name === '시도유형문화재').length,
            sidoFolklore: this.heritageData.filter(item => item.kdcd_name === '시도민속문화재').length,
            culturalData: this.heritageData.filter(item => item.kdcd_name === '문화재자료').length,
            others: this.heritageData.filter(item => 
                item.kdcd_name === '미분류' || 
                item.ctcd_name === '미분류' || 
                item.category === '미분류' || 
                item.location === '미분류'
            ).length
        };

        return {
            total: Object.values(unclassified).reduce((sum, count) => sum + count, 0),
            byType: unclassified
        };
    }

    /**
     * 결과 개수 업데이트
     */
    updateResultsCount() {
        const currentData = this.getCurrentData();
        const count = currentData ? currentData.length : this.heritageData.length;
        
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

    /**
     * 언어 토글 설정
     */
    setupLanguageToggle() {
        const langButtons = document.querySelectorAll('input[name="language"]');
        langButtons.forEach(button => {
            button.addEventListener('change', (e) => {
                this.currentLanguage = e.target.id === 'lang-ko' ? 'ko' : 'en';
                console.log('언어 변경:', this.currentLanguage);
                
                // 통계 업데이트 이벤트 발생
                this.emit('statisticsChanged', this.getStatistics());
            });
        });
    }

    /**
     * 캐시 무효화
     */
    invalidateCache() {
        window.dataLoader.invalidateCache();
        window.searchManager.clearSearchCache();
        window.filterManager.clearFilterCache();
        window.statisticsManager.invalidateStats();
    }

    /**
     * 데이터 새로고침
     */
    async refreshData() {
        this.invalidateCache();
        this.isLoaded = false;
        return await this.loadData();
    }

    /**
     * 현재 데이터 상태 반환
     */
    getDataStatus() {
        return {
            isLoaded: this.isLoaded,
            isLoading: this.isLoading,
            dataCount: this.heritageData.length,
            currentLanguage: this.currentLanguage,
            searchStats: window.searchManager.getSearchStats(),
            filterStats: window.filterManager.getFilterStats()
        };
    }
}

// 전역 인스턴스 생성
window.dataManager = new DataManager();