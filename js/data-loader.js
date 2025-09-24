/**
 * 데이터 로딩 전용 모듈
 * CSV, IndexedDB, LocalStorage에서 데이터를 로드하는 기능
 */
class DataLoader {
    constructor() {
        this.cachedData = null;
        this.loadPromise = null;
        this.lastLoadTime = 0;
        this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시 유효시간
        this.isLoading = false;
    }

    /**
     * 🚀 최적화된 데이터 로드 (캐싱 시스템)
     */
    async loadData() {
        // 🚀 캐시된 데이터가 있으면 즉시 반환
        if (this.cachedData && this.cachedData.length > 0) {
            return this.cachedData;
        }

        if (this.isLoading && this.loadPromise) {
            return await this.loadPromise;
        }

        this.isLoading = true;
        this.loadPromise = this._performDataLoad();

        try {
            this.cachedData = await this.loadPromise;
            return this.cachedData;
        } finally {
            this.isLoading = false;
            this.loadPromise = null;
        }
    }

    /**
     * 🚀 캐시 유효성 검사
     */
    _isCacheValid() {
        return (Date.now() - this.lastLoadTime) < this.cacheTimeout;
    }

    /**
     * 🚀 실제 데이터 로딩 수행
     */
    async _performDataLoad() {
        const methods = [
            { name: 'JavaScript', fn: () => this._loadFromJavaScript() },
            { name: 'IndexedDB', fn: () => this._loadFromIndexedDB() },
            { name: 'LocalStorage', fn: () => this._loadFromLocalStorage() }
        ];

        for (const method of methods) {
            try {
                debugLog(`🔄 ${method.name} 데이터 로드 시도...`);
                const data = await method.fn();
                if (data && Array.isArray(data) && data.length > 0) {
                    debugLog(`✅ ${method.name} 성공: ${data.length}개 항목`);
                    this.lastLoadTime = Date.now();
                    
                    // 🚀 성공한 데이터는 다른 저장소에도 백업
                    this._backupToStorage(data, method.name);
                    
                    // 데이터 검증 및 정리
                    const cleanedData = this._validateAndCleanData(data);
                    return cleanedData;
                }
            } catch (error) {
                debugLog(`❌ ${method.name} 실패:`, error);
            }
        }
        
        throw new Error('모든 데이터 소스에서 로드 실패');
    }

    /**
     * 🚀 JavaScript 데이터 로드
     */
    async _loadFromJavaScript() {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (typeof HERITAGE_DATA !== 'undefined' && Array.isArray(HERITAGE_DATA)) {
                    resolve(HERITAGE_DATA);
                } else {
                    resolve(null);
                }
            }, 100);
        });
    }

    /**
     * 🚀 IndexedDB 데이터 로드
     */
    async _loadFromIndexedDB() {
        if (!IndexedDBManager.isSupported()) {
            return null;
        }

        const indexedData = await window.indexedDBManager.loadData('heritageData');
        if (indexedData && indexedData.data) {
            return indexedData.data;
        }
        return null;
    }

    /**
     * 🚀 LocalStorage 데이터 로드
     */
    async _loadFromLocalStorage() {
        const userData = localStorage.getItem('heritageData');
        if (!userData) {
            return null;
        }

        try {
            const parsedData = JSON.parse(userData);
            if (parsedData && typeof parsedData === 'object') {
                if (parsedData.data && Array.isArray(parsedData.data)) {
                    return parsedData.data;
                }
                if (Array.isArray(parsedData)) {
                    return parsedData;
                }
            }
        } catch (error) {
            console.warn('LocalStorage 데이터 파싱 실패:', error);
        }
        return null;
    }

    /**
     * 🚀 데이터 백업 (다른 저장소에 저장)
     */
    _backupToStorage(data, source) {
        // IndexedDB에 백업 (JavaScript에서 로드한 경우)
        if (source !== 'IndexedDB') {
            window.indexedDBManager.saveData(data, 'heritageData');
        }
        
        // LocalStorage에 백업 (작은 데이터만)
        if (source !== 'LocalStorage' && data.length < 1000) {
            localStorage.setItem('heritageData', JSON.stringify({ data, timestamp: Date.now() }));
        }
    }

    /**
     * 🚀 데이터 검증 및 정리
     */
    _validateAndCleanData(data) {
        if (!Array.isArray(data)) {
            throw new Error('데이터가 배열이 아닙니다');
        }

        return data.filter(item => {
            // 필수 필드 검증
            return item && 
                   typeof item === 'object' && 
                   item.name && 
                   typeof item.name === 'string' &&
                   item.name.trim() !== '';
        }).map(item => {
            // 이미지 URL 정리
            if (item.imageUrl && item.imageUrl.trim() !== '') {
                let imageUrl = item.imageUrl.trim();
                if (imageUrl.startsWith('/')) {
                    imageUrl = imageUrl.substring(1);
                }
                item.image_url = imageUrl;
            }
            
            // 카테고리 정리
            if (item.kdcd_name) {
                item.category = item.kdcd_name;
            }
            
            // 지역 정보 정리
            if (item.ctcd_name) {
                item.location = item.ctcd_name;
            }
            
            return item;
        });
    }

    /**
     * 캐시 무효화
     */
    invalidateCache() {
        this.cachedData = null;
        this.lastLoadTime = 0;
    }

    /**
     * 데이터 로드 상태 확인
     */
    isDataLoaded() {
        return this.cachedData && this.cachedData.length > 0;
    }

    /**
     * 현재 캐시된 데이터 반환
     */
    getCachedData() {
        return this.cachedData;
    }
}

// 전역 인스턴스 생성
window.dataLoader = new DataLoader();