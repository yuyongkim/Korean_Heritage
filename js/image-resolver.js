/**
 * 이미지 URL 해결 모듈
 * 문화재청 페이지 URL을 실제 이미지 URL로 변환
 */

class ImageResolver {
    constructor() {
        this.cache = new Map();
        this.processing = new Set();
    }

    /**
     * 문화재청 URL에서 이미지 추출
     */
    async resolveHeritageImage(sourceUrl) {
        if (!sourceUrl) {
            return null;
        }

        // 캐시 확인
        if (this.cache.has(sourceUrl)) {
            return this.cache.get(sourceUrl);
        }

        // 이미 처리 중인 URL인지 확인
        if (this.processing.has(sourceUrl)) {
            return null;
        }

        this.processing.add(sourceUrl);

        try {
            console.log('이미지 해결 중:', sourceUrl);
            
            // 직접 이미지 URL인지 먼저 확인
            if (this.isDirectImageUrl(sourceUrl)) {
                // 이미지 존재 여부 확인
                if (await this.checkImageExists(sourceUrl)) {
                    this.cache.set(sourceUrl, sourceUrl);
                    console.log('✅ 직접 이미지 URL 확인 성공:', sourceUrl);
                    return sourceUrl;
                }
            }
            
            // 문화재청 URL 패턴 분석
            const imageUrl = await this.extractImageFromUrl(sourceUrl);
            
            if (imageUrl) {
                this.cache.set(sourceUrl, imageUrl);
                console.log('✅ 이미지 URL 추출 성공:', imageUrl);
                return imageUrl;
            }
            
        } catch (error) {
            console.warn('이미지 추출 실패:', error.message);
        } finally {
            this.processing.delete(sourceUrl);
        }

        return null;
    }

    /**
     * URL에서 이미지 추출 (다양한 패턴 지원)
     */
    async extractImageFromUrl(url) {
        // 1. 직접 이미지 URL인지 확인
        if (this.isDirectImageUrl(url)) {
            return url;
        }

        // 2. 문화재청 상세 페이지 URL 패턴 분석
        if (url.includes('selectDetail.do')) {
            return await this.resolveDetailPageImage(url);
        }

        // 3. 기타 패턴들
        return await this.tryGenericExtraction(url);
    }

    /**
     * 직접 이미지 URL인지 확인
     */
    isDirectImageUrl(url) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
        const lowercaseUrl = url.toLowerCase();
        return imageExtensions.some(ext => lowercaseUrl.includes(ext));
    }

    /**
     * 문화재청 상세 페이지에서 이미지 추출
     */
    async resolveDetailPageImage(url) {
        try {
            // URL에서 파라미터 추출
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const ccbaKdcd = urlParams.get('ccbaKdcd');
            const ccbaAsno = urlParams.get('ccbaAsno');
            const ccbaCtcd = urlParams.get('ccbaCtcd');

            if (!ccbaKdcd || !ccbaAsno || !ccbaCtcd) {
                console.warn('문화재청 URL 파라미터 부족:', url);
                return null;
            }

            // 문화재청 이미지 URL 패턴 추정
            const possibleImageUrls = [
                `https://www.heritage.go.kr/unisearch/images/cultural_assets/${ccbaKdcd}/${ccbaAsno}_${ccbaCtcd}_1.jpg`,
                `https://www.heritage.go.kr/unisearch/images/cultural_assets/${ccbaKdcd}/${ccbaAsno}_1.jpg`,
                `https://www.heritage.go.kr/cmm/fms/getImage.do?atchFileId=${ccbaAsno}&fileSn=1`,
                `https://cdn.heritage.go.kr/images/${ccbaKdcd}/${ccbaAsno}.jpg`
            ];

            // 이미지 URL 유효성 검사
            for (const imageUrl of possibleImageUrls) {
                if (await this.checkImageExists(imageUrl)) {
                    return imageUrl;
                }
            }

        } catch (error) {
            console.warn('상세 페이지 이미지 추출 실패:', error);
        }

        return null;
    }

    /**
     * 범용 이미지 추출 시도
     */
    async tryGenericExtraction(url) {
        // CORS 문제로 인해 직접 페이지 파싱은 어려움
        // 대신 URL 패턴 기반으로 추정
        
        try {
            // URL에서 ID나 번호 추출 시도
            const matches = url.match(/(\d+)/g);
            if (matches && matches.length > 0) {
                const id = matches[matches.length - 1]; // 마지막 숫자를 ID로 사용
                
                // 추정 이미지 URL들
                const estimatedUrls = [
                    `https://www.heritage.go.kr/images/${id}.jpg`,
                    `https://www.heritage.go.kr/images/thumb/${id}_thumb.jpg`,
                    `https://cdn.heritage.go.kr/thumb/${id}.jpg`
                ];

                for (const imageUrl of estimatedUrls) {
                    if (await this.checkImageExists(imageUrl)) {
                        return imageUrl;
                    }
                }
            }
        } catch (error) {
            console.warn('범용 추출 실패:', error);
        }

        return null;
    }

    /**
     * 이미지 존재 여부 확인
     */
    async checkImageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            
            // 타임아웃 설정 (3초)
            const timeout = setTimeout(() => {
                resolve(false);
            }, 3000);

            img.onload = () => {
                clearTimeout(timeout);
                resolve(true);
            };

            img.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };

            // CORS 문제 방지
            img.crossOrigin = 'anonymous';
            img.src = url;
        });
    }

    /**
     * 여러 이미지 URL 일괄 해결
     */
    async resolveBatchImages(items) {
        console.log('일괄 이미지 해결 시작:', items.length, '건');
        
        const promises = items.map(async (item, index) => {
            if (!item.source_url || item.image_url) {
                return item; // 이미 이미지가 있거나 소스가 없으면 건너뛰기
            }

            try {
                const resolvedImageUrl = await this.resolveHeritageImage(item.source_url);
                if (resolvedImageUrl) {
                    item.image_url = resolvedImageUrl;
                    console.log(`✅ ${index + 1}/${items.length}: ${item.name} 이미지 해결`);
                } else {
                    console.log(`⚠️ ${index + 1}/${items.length}: ${item.name} 이미지 해결 실패`);
                }
            } catch (error) {
                console.warn(`❌ ${index + 1}/${items.length}: ${item.name} 처리 오류:`, error);
            }

            return item;
        });

        const results = await Promise.all(promises);
        console.log('일괄 이미지 해결 완료');
        
        return results;
    }

    /**
     * 캐시 정리
     */
    clearCache() {
        this.cache.clear();
        console.log('이미지 URL 캐시 정리 완료');
    }

    /**
     * 캐시 통계
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            processing: this.processing.size,
            entries: Array.from(this.cache.entries())
        };
    }
}

// 전역 인스턴스 생성
const imageResolver = new ImageResolver();