/**
 * 이미지 캐싱 매니저
 * 이미지를 미리 로드하고 캐시하여 성능을 향상시킵니다
 */

class ImageCacheManager {
    constructor() {
        this.cache = new Map();
        this.preloadedImages = new Set();
        this.failedImages = new Set(); // 실패한 이미지 URL 저장
        this.maxCacheSize = 1000; // 최대 1000개 이미지 캐시
        this.preloadBatchSize = 20; // 한 번에 미리 로드할 이미지 수
        this.preloadDelay = 100; // 배치 간 지연 시간 (ms)
        this.maxRetries = 2; // 최대 재시도 횟수
    }

    /**
     * 이미지 미리 로드 (중복 방지 및 성능 최적화)
     */
    async preloadImages(items, startIndex = 0, count = null) {
        const endIndex = count ? startIndex + count : items.length;
        const itemsToPreload = items.slice(startIndex, endIndex);
        
        // 중복 로딩 방지: 이미 처리 중인 항목 필터링
        const newItems = itemsToPreload.filter(item => 
            item.image_url && 
            !this.preloadedImages.has(item.image_url) && 
            !this.failedImages.has(item.image_url)
        );
        
        if (newItems.length === 0) {
            console.log('🖼️ 이미지 미리 로드: 모든 이미지가 이미 처리됨');
            return;
        }
        
        console.log(`🖼️ 이미지 미리 로드 시작: ${newItems.length}개 (중복 제외: ${itemsToPreload.length - newItems.length}개)`);
        
        const batches = this._createBatches(newItems, this.preloadBatchSize);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`📦 배치 ${i + 1}/${batches.length} 처리 중... (${batch.length}개)`);
            
            await this._preloadBatch(batch);
            
            // 배치 간 지연 (브라우저 블로킹 방지)
            if (i < batches.length - 1) {
                await this._delay(this.preloadDelay);
            }
        }
        
        console.log(`✅ 이미지 미리 로드 완료: ${newItems.length}개`);
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

        // 이미 실패한 이미지는 다시 시도하지 않음
        if (this.failedImages.has(item.image_url)) {
            return;
        }

        try {
            const imageUrl = await this._loadImage(item.image_url);
            if (imageUrl) {
                this.cache.set(item.image_url, imageUrl);
                this.preloadedImages.add(item.image_url);
                // 로깅 최소화: 성공한 이미지는 로그하지 않음
            }
        } catch (error) {
            // 로깅 최소화: 에러만 간단히 기록
            console.warn(`❌ 이미지 로드 실패: ${item.name}`);
            // 실패한 이미지 URL을 기록하여 재시도 방지
            this.failedImages.add(item.image_url);
        }
    }

    /**
     * 이미지 로드 (재시도 로직 포함)
     */
    _loadImage(url, retryCount = 0) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            let timeoutId;
            
            // 타임아웃 설정 (10초)
            timeoutId = setTimeout(() => {
                img.onload = null;
                img.onerror = null;
                reject(new Error('이미지 로드 타임아웃'));
            }, 10000);
            
            img.onload = () => {
                clearTimeout(timeoutId);
                try {
                    // CORS 문제 해결: 캔버스 변환 없이 원본 URL 반환
                    // 이미지가 로드되었으면 원본 URL을 그대로 사용
                    resolve(url);
                } catch (error) {
                    // 캔버스 변환 실패 시에도 원본 URL 반환
                    console.warn('이미지 캔버스 변환 실패, 원본 URL 사용:', error.message);
                    resolve(url);
                }
            };
            
            img.onerror = () => {
                clearTimeout(timeoutId);
                
                // 재시도 로직
                if (retryCount < this.maxRetries) {
                    console.log(`🔄 이미지 재시도 ${retryCount + 1}/${this.maxRetries}: ${url}`);
                    setTimeout(() => {
                        this._loadImage(url, retryCount + 1)
                            .then(resolve)
                            .catch(reject);
                    }, 1000 * (retryCount + 1)); // 지수 백오프
                } else {
                    reject(new Error('이미지 로드 실패 (최대 재시도 횟수 초과)'));
                }
            };
            
            // CORS 문제 방지를 위해 crossOrigin 설정
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
            failedCount: this.failedImages.size,
            maxCacheSize: this.maxCacheSize
        };
    }

    /**
     * 캐시 클리어
     */
    clearCache() {
        this.cache.clear();
        this.preloadedImages.clear();
        this.failedImages.clear();
        console.log('🧹 이미지 캐시 클리어됨');
    }
}

// 전역 인스턴스 생성
const imageCacheManager = new ImageCacheManager();