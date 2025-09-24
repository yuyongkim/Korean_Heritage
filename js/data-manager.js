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
            this.heritageData = await dataLoader.loadData();
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
     * 🚀 검색 기능 (SearchManager 사용)
     */
    search(query, categoryFilter = '', locationFilter = '', searchOption = 'title+description') {
        return searchManager.search(query, categoryFilter, locationFilter, searchOption);
    }

    /**
     * 카테고리별 데이터 검색 (SearchManager 사용)
     */
    getByCategory(category) {
        return searchManager.getByCategory(category);
    }

    /**
     * 이름으로 데이터 검색 (SearchManager 사용)
     */
    getByName(name) {
        return searchManager.getByName(name);
    }

    /**
     * 지역별 데이터 검색 (SearchManager 사용)
     */
    getByLocation(location) {
        return searchManager.getByLocation(location);
    }

    /**
     * 🚀 필터링 기능 (FilterManager 사용)
     */
    applyFilters() {
        return filterManager.applyFilters();
    }

    /**
     * 현재 필터된 데이터 반환 (FilterManager 사용)
     */
    getCurrentData() {
        return filterManager.getFilteredData();
    }

    /**
     * 🚀 통계 계산 (StatisticsManager 사용)
     */
    getStatistics() {
        return statisticsManager.getStatistics();
    }

    /**
     * 대시보드용 통계 (StatisticsManager 사용)
     */
    getDashboardStats() {
        return statisticsManager.getDashboardStats();
    }

    /**
     * 번역 통계 (StatisticsManager 사용)
     */
    getTranslationStats() {
        return statisticsManager.getTranslationStats();
    }

    /**
     * 미분류 항목 통계 (StatisticsManager 사용)
     */
    getUnclassifiedStats() {
        return statisticsManager.getUnclassifiedStats();
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
        dataLoader.invalidateCache();
        searchManager.clearSearchCache();
        filterManager.clearFilterCache();
        statisticsManager.invalidateStats();
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
            searchStats: searchManager.getSearchStats(),
            filterStats: filterManager.getFilterStats()
        };
    }
}

// 전역 인스턴스 생성
window.dataManager = new DataManager();