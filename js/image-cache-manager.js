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
     * 이미지 미리 로드 (CORS 문제 고려)
     */
    async preloadImages(items, startIndex = 0, count = null) {
        const endIndex = count ? startIndex + count : items.length;
        const itemsToPreload = items.slice(startIndex, endIndex);
        
        console.log(`🖼️ 이미지 미리 로드 시작: ${itemsToPreload.length}개`);
        
        // 🚨 중요: CORS 문제로 인한 실패를 고려하여 배치 크기 동적 조정
        const batchSize = Math.min(this.preloadBatchSize, 10);
        const batches = this._createBatches(itemsToPreload, batchSize);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`📦 배치 ${i + 1}/${batches.length} 처리 중... (${batch.length}개)`);
            
            await this._preloadBatch(batch);
            
            // 배치 간 지연 (브라우저 블로킹 방지)
            if (i < batches.length - 1) {
                await this._delay(this.preloadDelay * 2); // 지연 시간 증가
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
     * 단일 이미지 미리 로드 (CORS 문제 해결)
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
            // 🚨 중요: 실패한 이미지도 원본 URL로 캐시하여 재시도 방지
            this.cache.set(item.image_url, item.image_url);
            this.preloadedImages.add(item.image_url);
        }
    }

    /**
     * 이미지 로드 (CORS 문제 해결)
     */
    _loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                try {
                    // 이미지를 캔버스로 변환하여 base64로 저장
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(dataUrl);
                } catch (error) {
                    // CORS 문제로 캔버스 접근 실패 시 원본 URL 반환
                    console.warn('⚠️ CORS 문제로 캔버스 접근 실패, 원본 URL 사용:', url);
                    resolve(url);
                }
            };
            
            img.onerror = (error) => {
                console.warn('❌ 이미지 로드 실패:', url, error);
                // 이미지 로드 실패 시 기본 이미지나 원본 URL 반환
                resolve(url);
            };
            
            // CORS 설정 (서버에서 허용하지 않을 수 있음)
            img.crossOrigin = 'anonymous';
            img.src = url;
        });
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