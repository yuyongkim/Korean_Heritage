/**
 * 이미지 캐싱 매니저
 * 이미지를 미리 로드하고 캐시하여 성능을 향상시킵니다
 */

class ImageCacheManager {
    constructor() {
        this.cache = new Map();
        this.preloadedImages = new Set();
        this.maxCacheSize = 1000; // 최대 1000개 이미지 캐시
        this.preloadBatchSize = 20; // 한 번에 미리 로드할 이미지 수
        this.preloadDelay = 100; // 배치 간 지연 시간 (ms)
    }

    /**
     * 이미지 미리 로드
     */
    async preloadImages(items, startIndex = 0, count = null) {
        const endIndex = count ? startIndex + count : items.length;
        const itemsToPreload = items.slice(startIndex, endIndex);
        
        console.log(`🖼️ 이미지 미리 로드 시작: ${itemsToPreload.length}개`);
        
        const batches = this._createBatches(itemsToPreload, this.preloadBatchSize);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`📦 배치 ${i + 1}/${batches.length} 처리 중... (${batch.length}개)`);
            
            await this._preloadBatch(batch);
            
            // 배치 간 지연 (브라우저 블로킹 방지)
            if (i < batches.length - 1) {
                await this._delay(this.preloadDelay);
            }
        }
        
        console.log(`✅ 이미지 미리 로드 완료: ${itemsToPreload.length}개`);
    }

    /**
     * 배치 생성
     */
    _createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * 배치 미리 로드
     */
    async _preloadBatch(batch) {
        const promises = batch.map(item => this._preloadSingleImage(item));
        await Promise.allSettled(promises);
    }

    /**
     * 단일 이미지 미리 로드
     */
    async _preloadSingleImage(item) {
        if (!item.image_url || this.preloadedImages.has(item.image_url)) {
            return;
        }

        try {
            const imageUrl = await this._loadImage(item.image_url);
            if (imageUrl) {
                this.cache.set(item.image_url, imageUrl);
                this.preloadedImages.add(item.image_url);
                console.log(`✅ 이미지 캐시됨: ${item.name}`);
            }
        } catch (error) {
            console.warn(`❌ 이미지 로드 실패: ${item.name}`, error);
            // 실패한 이미지에 대해 플레이스홀더 URL 저장
            this.cache.set(item.image_url, this._getPlaceholderImage(item));
        }
    }

    /**
     * 플레이스홀더 이미지 생성
     */
    _getPlaceholderImage(item) {
        // SVG 플레이스홀더 이미지 생성
        const svg = `
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#f8f9fa"/>
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="16" fill="#6c757d">
                    이미지 로드 실패
                </text>
                <text x="50%" y="60%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="12" fill="#adb5bd">
                    ${item.name}
                </text>
            </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /**
     * 이미지 로드 (CORS 문제 해결)
     */
    _loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                // 이미지를 캔버스로 변환하여 base64로 저장
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataUrl);
            };
            
            img.onerror = () => {
                reject(new Error('이미지 로드 실패'));
            };
            
            // CORS 문제 방지 - 여러 방법 시도
            img.crossOrigin = 'anonymous';
            
            // CORS 프록시 URL 사용 (여러 서비스 시도)
            const proxyUrl = this._getProxyUrl(url);
            img.src = proxyUrl;
        });
    }

    /**
     * CORS 프록시 URL 생성
     */
    _getProxyUrl(originalUrl) {
        // 여러 CORS 프록시 서비스 시도
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
            `https://cors-anywhere.herokuapp.com/${originalUrl}`,
            `https://thingproxy.freeboard.io/fetch/${originalUrl}`,
            originalUrl // 마지막에 원본 URL 시도
        ];
        
        // 랜덤하게 프록시 선택 (로드 분산)
        const randomIndex = Math.floor(Math.random() * proxies.length);
        return proxies[randomIndex];
    }

    /**
     * 캐시된 이미지 URL 반환
     */
    getCachedImageUrl(originalUrl) {
        if (!originalUrl) return null;
        
        // 캐시에서 찾기
        if (this.cache.has(originalUrl)) {
            return this.cache.get(originalUrl);
        }
        
        // 캐시에 없으면 원본 URL 반환
        return originalUrl;
    }

    /**
     * 지연 함수
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 캐시 크기 관리
     */
    _manageCacheSize() {
        if (this.cache.size > this.maxCacheSize) {
            const keysToDelete = Array.from(this.cache.keys()).slice(0, this.cache.size - this.maxCacheSize);
            keysToDelete.forEach(key => {
                this.cache.delete(key);
                this.preloadedImages.delete(key);
            });
            console.log(`🧹 캐시 정리: ${keysToDelete.length}개 항목 제거`);
        }
    }

    /**
     * 캐시 통계
     */
    getCacheStats() {
        return {
            cacheSize: this.cache.size,
            preloadedCount: this.preloadedImages.size,
            maxCacheSize: this.maxCacheSize
        };
    }

    /**
     * 캐시 클리어
     */
    clearCache() {
        this.cache.clear();
        this.preloadedImages.clear();
        console.log('🧹 이미지 캐시 클리어됨');
    }
}

// 전역 인스턴스 생성
const imageCacheManager = new ImageCacheManager();