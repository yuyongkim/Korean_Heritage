/**
 * 데이터 관리자 - CSV 로딩 및 데이터 처리
 */
class DataManager {
    constructor() {
        this.heritageData = [];
        this.filteredData = [];
        this.categories = new Set();
        this.locations = new Set();
        this.isLoaded = false;
        this.currentLanguage = 'ko';
        
        this.setupLanguageToggle();
    }
    
    /**
     * 문화재 데이터 로드 (JavaScript 데이터 우선)
     */
    async loadData() {
        if (this.isLoaded) return this.heritageData;
        
        console.log('🔄 데이터 로드 시작...');
        
        // 방법 1: JavaScript 데이터 로드 시도 (최우선)
        try {
            console.log('방법 1: JavaScript 데이터 로드 시도');
            if (typeof getHeritageData === 'function') {
                const jsData = getHeritageData();
                if (jsData && Array.isArray(jsData) && jsData.length > 0) {
                    // JavaScript 데이터를 내부 형식으로 변환
                    this.heritageData = jsData.map((row, index) => {
                        // 이미지 URL 처리
                        let imageUrl = '';
                        if (row.imageUrl && row.imageUrl.trim() !== '') {
                            imageUrl = row.imageUrl.trim();
                            // URL이 상대 경로인 경우 절대 경로로 변환
                            if (imageUrl.startsWith('/')) {
                                imageUrl = 'http://www.khs.go.kr' + imageUrl;
                            }
                        }
                        
                        return {
                            id: index + 1,
                            name: row.name || '',
                            category: row.kdcd_name || '',
                            location: row.ctcd_name || '',
                            korean_description: row.content || '',
                            english_description: '', // 현재 CSV에는 영문 설명이 없음
                            source_url: '', // 현재 CSV에는 출처 URL이 없음
                            period: '', // 현재 CSV에는 시대 정보가 없음
                            designation_no: row.key_asno ? `지정번호: ${row.key_asno}` : '',
                            image_url: imageUrl,
                            coords: (row.longitude && row.latitude) ? {
                                lat: parseFloat(row.latitude),
                                lng: parseFloat(row.longitude)
                            } : null,
                            // 4축 필터링을 위한 필드들 추가
                            kdcd_name: row.kdcd_name || '',
                            ctcd_name: row.ctcd_name || '',
                            key_kdcd: row.key_kdcd || '',
                            key_ctcd: row.key_ctcd || '',
                            content: row.content || '',
                            // 원본 데이터 보존
                            original_data: {
                                key_asno: row.key_asno,
                                key_kdcd: row.key_kdcd,
                                key_ctcd: row.key_ctcd,
                                composite_key: row.composite_key,
                                has_image: row.has_image === 'True',
                                content_length: parseInt(row.content_length) || 0,
                                original_image_url: row.imageUrl || ''
                            }
                        };
                    }).filter(item => item.name && item.name.trim() !== ''); // 빈 이름 제거
                    
                    console.log('✅ JavaScript 데이터 로드 성공:', this.heritageData.length, '개 항목');
                    
                    // 데이터 샘플 확인
                    if (this.heritageData.length > 0) {
                        console.log('📊 데이터 샘플:', {
                            첫번째: this.heritageData[0],
                            카테고리분포: this.heritageData.slice(0, 10).map(item => item.kdcd_name || item.category)
                        });
                    }
                    
                    // JavaScript 데이터를 대용량 저장소에 저장
                    await this.saveData();
                    
                    this.processData();
                    this.isLoaded = true;
                    return this.heritageData;
                }
            }
        } catch (jsError) {
            console.log('JavaScript 데이터 로드 실패, IndexedDB 시도');
        }
        
        // 방법 2: IndexedDB에서 로드 시도
        if (IndexedDBManager.isSupported()) {
            try {
                console.log('방법 2: IndexedDB 로드 시도');
                const indexedData = await window.indexedDBManager.loadData();
                if (indexedData && indexedData.data) {
                    this.heritageData = indexedData.data;
                    console.log('✅ IndexedDB 로드 성공:', this.heritageData.length, '개 항목');
                    
                    this.processData();
                    this.isLoaded = true;
                    return this.heritageData;
                }
            } catch (indexedError) {
                console.log('IndexedDB 로드 실패, 자동 CSV 시도');
            }
        }
        
        // 방법 3: 자동 CSV 로드 시도
        try {
            console.log('방법 3: 자동 CSV 로드 시도');
            await this.loadFromAutoCSV();
            console.log('✅ 자동 CSV 로드 성공:', this.heritageData.length, '개 항목');
            
            // CSV 데이터를 대용량 저장소에 저장
            await this.saveData();
            
            this.processData();
            this.isLoaded = true;
            return this.heritageData;
            
        } catch (autoCsvError) {
            console.log('자동 CSV 로드 실패, 로컬 스토리지 시도');
            
            // 방법 4: 로컬 스토리지에서 사용자 데이터 로드 시도
            try {
                console.log('방법 4: 로컬 스토리지 사용자 데이터 로드');
            
            const userData = localStorage.getItem('heritage_user_data');
            const timestamp = localStorage.getItem('heritage_data_timestamp');
            
            if (userData) {
                const parsedData = JSON.parse(userData);
                    
                    // 새로운 형식 (객체) 또는 기존 형식 (배열) 처리
                    if (parsedData && typeof parsedData === 'object') {
                        if (parsedData.data && Array.isArray(parsedData.data)) {
                            // 새로운 형식: {data: [...], timestamp: ..., version: ...}
                            this.heritageData = parsedData.data;
                            const backupAge = parsedData.timestamp ? 
                                Math.floor((Date.now() - parsedData.timestamp) / 1000 / 60) : '알 수 없음';
                            
                            console.log('✅ 사용자 데이터 로드 성공 (새 형식):', this.heritageData.length, '개 항목');
                            console.log('데이터 버전:', parsedData.version || '1.0');
                            console.log('데이터 소스:', parsedData.source || '알 수 없음');
                    console.log('마지막 업데이트:', backupAge, '분 전');
                    
                            if (parsedData.compressed) {
                                console.log('⚠️ 압축된 데이터입니다. 일부 설명이 축약되어 있을 수 있습니다.');
                            }
                            
                        } else if (Array.isArray(parsedData) && parsedData.length > 0) {
                            // 기존 형식: [...]
                    this.heritageData = parsedData;
                            const backupAge = timestamp ? 
                                Math.floor((Date.now() - parseInt(timestamp)) / 1000 / 60) : '알 수 없음';
                    
                            console.log('✅ 사용자 데이터 로드 성공 (기존 형식):', this.heritageData.length, '개 항목');
                    console.log('마지막 업데이트:', backupAge, '분 전');
                        }
                    
                        if (this.heritageData && this.heritageData.length > 0) {
                    this.processData();
                    this.isLoaded = true;
                    return this.heritageData;
                        }
                }
            }
            
            throw new Error('사용자 데이터 없음');
            
        } catch (userDataError) {
                console.log('사용자 데이터 없음, 기존 CSV 파일 로드 시도');
                
                // 방법 5: 기존 CSV 파일에서 로드 시도
                try {
                    await this.loadFromCSV();
                    console.log('✅ 기존 CSV 파일 로드 성공:', this.heritageData.length, '개 항목');
                    
                    // CSV 데이터를 대용량 저장소에 저장
                    await this.saveData();
                    
                    this.processData();
                    this.isLoaded = true;
                    return this.heritageData;
                    
                } catch (csvError) {
                    console.log('기존 CSV 파일 로드 실패, 샘플 데이터로 시작');
                    
                    // 방법 6: 샘플 데이터로 시작 (최후 수단)
            this.heritageData = this.getSampleData();
            console.log('✅ 샘플 데이터 로드:', this.heritageData.length, '개 항목');
            
            // 샘플 데이터를 로컬 스토리지에 저장
            this.saveToLocalStorage();
            
            this.processData();
            this.isLoaded = true;
            return this.heritageData;
        }
            }
        }
    }
    
    /**
     * 자동 CSV 로드 (data/heritage_master.csv)
     */
    async loadFromAutoCSV() {
        const csvPath = './data/heritage_master.csv';
        console.log('자동 CSV 로드 시작:', csvPath);
        
        const response = await fetch(csvPath + '?v=' + Date.now()); // 캐시 방지
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('CSV 텍스트 로드 완료, 크기:', csvText.length, 'bytes');
        
        // PapaParse를 사용하여 CSV 파싱
        const parseResult = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim()
        });
        
        if (parseResult.errors && parseResult.errors.length > 0) {
            console.warn('CSV 파싱 경고:', parseResult.errors);
        }
        
        console.log('CSV 파싱 완료:', parseResult.data.length, '행');
        
        // 데이터 변환
        this.heritageData = parseResult.data.map((row, index) => {
            // 이미지 URL 처리
            let imageUrl = '';
            if (row.imageUrl && row.imageUrl.trim() !== '') {
                imageUrl = row.imageUrl.trim();
                // URL이 상대 경로인 경우 절대 경로로 변환
                if (imageUrl.startsWith('/')) {
                    imageUrl = 'http://www.khs.go.kr' + imageUrl;
                }
            }
            
            return {
                id: index + 1,
                name: row.name || '',
                category: row.kdcd_name || '',
                location: row.ctcd_name || '',
                korean_description: row.content || '',
                english_description: '', // 현재 CSV에는 영문 설명이 없음
                source_url: '', // 현재 CSV에는 출처 URL이 없음
                period: '', // 현재 CSV에는 시대 정보가 없음
                designation_no: row.key_asno ? `지정번호: ${row.key_asno}` : '',
                image_url: imageUrl,
                coords: (row.longitude && row.latitude) ? {
                    lat: parseFloat(row.latitude),
                    lng: parseFloat(row.longitude)
                } : null,
                // 4축 필터링을 위한 필드들 추가
                kdcd_name: row.kdcd_name || '',
                ctcd_name: row.ctcd_name || '',
                key_kdcd: row.key_kdcd || '',
                key_ctcd: row.key_ctcd || '',
                content: row.content || '',
                // 원본 데이터 보존
                original_data: {
                    key_asno: row.key_asno,
                    key_kdcd: row.key_kdcd,
                    key_ctcd: row.key_ctcd,
                    composite_key: row.composite_key,
                    has_image: row.has_image === 'True',
                    content_length: parseInt(row.content_length) || 0,
                    original_image_url: row.imageUrl || ''
                }
            };
        }).filter(item => item.name && item.name.trim() !== ''); // 빈 이름 제거
        
        console.log('자동 CSV 데이터 변환 완료:', this.heritageData.length, '개 항목');
        
        // 영어 설명 자동 생성
        this.generateMissingEnglishDescriptions();
        
        // 백그라운드에서 이미지 해결
        this.resolveImagesInBackground();
    }
    
    /**
     * CSV 파일에서 데이터 로드
     */
    async loadFromCSV() {
        try {
            console.log('CSV 파일 로드 시작...');
            
            const response = await fetch('heritage_perfect_dataset.csv');
            if (!response.ok) {
                throw new Error(`CSV 파일 로드 실패: ${response.status}`);
            }
            
            const csvText = await response.text();
            console.log('CSV 텍스트 로드 완료, 크기:', csvText.length, 'bytes');
            
            // PapaParse를 사용하여 CSV 파싱
            const parseResult = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim()
            });
            
            if (parseResult.errors && parseResult.errors.length > 0) {
                console.warn('CSV 파싱 경고:', parseResult.errors);
            }
            
            console.log('CSV 파싱 완료:', parseResult.data.length, '행');
            
            // 데이터 변환
            this.heritageData = parseResult.data.map((row, index) => {
                // 이미지 URL 처리
                let imageUrl = '';
                if (row.imageUrl && row.imageUrl.trim() !== '') {
                    imageUrl = row.imageUrl.trim();
                    // URL이 상대 경로인 경우 절대 경로로 변환
                    if (imageUrl.startsWith('/')) {
                        imageUrl = 'http://www.khs.go.kr' + imageUrl;
                    }
                }
                
                return {
                    id: index + 1,
                    name: row.name || '',
                    category: row.kdcd_name || '',
                    location: row.ctcd_name || '',
                    korean_description: row.content || '',
                    english_description: '', // 현재 CSV에는 영문 설명이 없음
                    source_url: '', // 현재 CSV에는 출처 URL이 없음
                    period: '', // 현재 CSV에는 시대 정보가 없음
                    designation_no: row.key_asno ? `지정번호: ${row.key_asno}` : '',
                    image_url: imageUrl,
                    coords: (row.longitude && row.latitude) ? {
                        lat: parseFloat(row.latitude),
                        lng: parseFloat(row.longitude)
                    } : null,
                    // 4축 필터링을 위한 필드들 추가
                    kdcd_name: row.kdcd_name || '',
                    ctcd_name: row.ctcd_name || '',
                    key_kdcd: row.key_kdcd || '',
                    key_ctcd: row.key_ctcd || '',
                    content: row.content || '',
                    // 원본 데이터 보존
                    original_data: {
                        key_asno: row.key_asno,
                        key_kdcd: row.key_kdcd,
                        key_ctcd: row.key_ctcd,
                        composite_key: row.composite_key,
                        has_image: row.has_image === 'True',
                        content_length: parseInt(row.content_length) || 0,
                        original_image_url: row.imageUrl || ''
                    }
                };
            }).filter(item => item.name && item.name.trim() !== ''); // 빈 이름 제거
            
            console.log('데이터 변환 완료:', this.heritageData.length, '개 항목');
            
            // 영어 설명 자동 생성
            this.generateMissingEnglishDescriptions();
            
            // 이미지 URL 자동 해결 (백그라운드에서 실행)
            this.resolveImagesInBackground();
            
        } catch (error) {
            console.error('CSV 로드 오류:', error);
            throw error;
        }
    }

    /**
     * 백그라운드에서 이미지 URL 해결
     */
    async resolveImagesInBackground() {
        if (!window.imageResolver) {
            console.log('이미지 리졸버가 없어서 이미지 해결을 건너뜁니다.');
            return;
        }

        console.log('백그라운드 이미지 해결 시작...');
        
        // 이미지가 없는 항목들만 필터링
        const itemsWithoutImages = this.heritageData.filter(item => 
            !item.image_url || item.image_url.trim() === ''
        );

        if (itemsWithoutImages.length === 0) {
            console.log('이미지가 없는 항목이 없습니다.');
            return;
        }

        console.log(`이미지 해결 대상: ${itemsWithoutImages.length}개 항목`);

        // 배치로 이미지 해결 (한 번에 10개씩)
        const batchSize = 10;
        for (let i = 0; i < itemsWithoutImages.length; i += batchSize) {
            const batch = itemsWithoutImages.slice(i, i + batchSize);
            
            try {
                await Promise.all(batch.map(async (item) => {
                    // 원본 이미지 URL이 있으면 해결 시도
                    if (item.original_data && item.original_data.original_image_url) {
                        const resolvedUrl = await window.imageResolver.resolveHeritageImage(
                            item.original_data.original_image_url
                        );
                        if (resolvedUrl) {
                            item.image_url = resolvedUrl;
                            console.log(`✅ 이미지 해결: ${item.name}`);
                        }
                    }
                }));
                
                // 배치 완료 후 잠시 대기 (서버 부하 방지)
                if (i + batchSize < itemsWithoutImages.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.warn(`배치 ${Math.floor(i/batchSize) + 1} 처리 중 오류:`, error);
            }
        }

        console.log('백그라운드 이미지 해결 완료');
        
        // 로컬 스토리지 업데이트
        this.saveToLocalStorage();
    }

    /**
     * 대용량 데이터 저장 (IndexedDB 우선, 폴백으로 로컬 스토리지)
     */
    async saveData() {
        console.log('💾 데이터 저장 시작...');
        
        // IndexedDB 지원 여부 확인
        if (IndexedDBManager.isSupported()) {
            try {
                console.log('🚀 IndexedDB 사용하여 대용량 데이터 저장...');
                await window.indexedDBManager.saveData(this.heritageData);
                this.showSaveNotification('IndexedDB');
                return;
            } catch (error) {
                console.warn('⚠️ IndexedDB 저장 실패, 로컬 스토리지로 폴백:', error);
            }
        } else {
            console.log('📱 IndexedDB 미지원, 로컬 스토리지 사용');
        }
        
        // 폴백: 로컬 스토리지 압축 저장
        this.saveToLocalStorage();
    }
    
    /**
     * 로컬 스토리지에 데이터 저장 (압축)
     */
    saveToLocalStorage() {
        try {
            const dataToSave = {
                data: this.heritageData,
                timestamp: Date.now(),
                version: '1.0',
                source: 'heritage_perfect_dataset.csv',
                count: this.heritageData.length
            };
            
            const jsonData = JSON.stringify(dataToSave);
            const sizeInMB = (new Blob([jsonData]).size / 1024 / 1024).toFixed(2);
            
            console.log(`데이터 크기: ${sizeInMB}MB (${this.heritageData.length}건)`);
            
            if (sizeInMB > 3) {
                console.warn('⚠️ 데이터가 너무 큽니다. 강력 압축된 버전을 저장합니다.');
                
                // 기존 로컬 스토리지 정리
                this.clearLocalStorage();
                
                // 강력 압축된 버전 저장 (핵심 데이터만)
                const compressedData = this.heritageData.map(item => ({
                    name: item.name,
                    category: item.category,
                    location: item.location,
                    kdcd_name: item.kdcd_name,
                    ctcd_name: item.ctcd_name,
                    key_kdcd: item.key_kdcd,
                    key_ctcd: item.key_ctcd,
                    designation_no: item.designation_no,
                    period: item.period,
                    image_url: item.image_url,
                    content: item.content ? item.content.substring(0, 50) + '...' : '',
                    korean_description: item.korean_description ? item.korean_description.substring(0, 50) + '...' : '',
                    english_description: item.english_description ? item.english_description.substring(0, 50) + '...' : '',
                    longitude: item.longitude,
                    latitude: item.latitude
                }));
                
                const compressedSaveData = {
                    data: compressedData,
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    source: 'heritage_perfect_dataset.csv',
                    count: this.heritageData.length,
                    compressed: true,
                    originalCount: this.heritageData.length
                };
                
                localStorage.setItem('heritage_user_data', JSON.stringify(compressedSaveData));
                console.log('✅ 강력 압축된 데이터 저장 완료:', compressedData.length, '건');
            } else {
                localStorage.setItem('heritage_user_data', jsonData);
                console.log('✅ 로컬 스토리지 영구 저장 완료:', this.heritageData.length, '건');
            }
            
            localStorage.setItem('heritage_data_timestamp', Date.now().toString());
            
            // 저장 성공 알림
            this.showSaveNotification();
            
        } catch (error) {
            console.error('❌ 로컬 스토리지 저장 실패:', error);
            this.showSaveError(error);
        }
    }
    
    /**
     * 로컬 스토리지 정리
     */
    clearLocalStorage() {
        try {
            // 기존 데이터 삭제
            localStorage.removeItem('heritage_user_data');
            localStorage.removeItem('heritage_data');
            localStorage.removeItem('heritage_updated');
            localStorage.removeItem('heritage_data_timestamp');
            
            // 다른 관련 데이터도 정리
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('heritage_') || key.startsWith('csv_')) {
                    localStorage.removeItem(key);
                }
            });
            
            console.log('✅ 로컬 스토리지 정리 완료');
        } catch (error) {
            console.error('❌ 로컬 스토리지 정리 실패:', error);
        }
    }
    
    /**
     * 저장 성공 알림
     */
    showSaveNotification(storageType = '로컬 스토리지') {
        // 기존 알림 제거
        const existingNotification = document.querySelector('.save-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 새 알림 생성
        const notification = document.createElement('div');
        notification.className = 'save-notification alert alert-success alert-dismissible fade show';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        const storageIcon = storageType === 'IndexedDB' ? 'fa-database' : 'fa-hdd';
        const storageMessage = storageType === 'IndexedDB' 
            ? `${this.heritageData.length}개 항목이 IndexedDB에 대용량 저장되었습니다! 수백MB~GB까지 지원합니다!`
            : `${this.heritageData.length}개 항목이 로컬 스토리지에 압축 저장되었습니다. 이제 매번 CSV 업로드할 필요가 없습니다!`;
            
        notification.innerHTML = `
            <i class="fas ${storageIcon} me-2"></i>
            <strong>데이터 영구 저장 완료!</strong><br>
            <small>${storageMessage}</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // 7초 후 자동 제거
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
            }
        }, 7000);
    }
    
    /**
     * 저장 오류 알림
     */
    showSaveError(error) {
        const notification = document.createElement('div');
        notification.className = 'save-notification alert alert-danger alert-dismissible fade show';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>저장 실패!</strong><br>
            <small>데이터 저장 중 오류가 발생했습니다: ${error.message}</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification && notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    /**
     * 데이터베이스에 문화재 데이터 추가
     */
    async addHeritageData(items) {
        try {
            console.log('데이터베이스에 추가 중:', items.length, '건');
            
            const promises = items.map(async (item) => {
                const dbItem = {
                    name: item.name,
                    category: item.category,
                    location: item.location,
                    korean_description: item.korean_description,
                    english_description: item.english_description,
                    source_url: item.source_url,
                    period: item.period,
                    designation_no: item.designation_no,
                    image_url: item.image_url || '',
                    coords_lat: item.coords?.lat || null,
                    coords_lng: item.coords?.lng || null
                };
                
                const response = await fetch('tables/heritage', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(dbItem)
                });
                
                if (!response.ok) {
                    throw new Error(`데이터 추가 실패: ${response.status}`);
                }
                
                return await response.json();
            });
            
            const results = await Promise.all(promises);
            console.log('데이터베이스 추가 완료:', results.length, '건');
            
            // 데이터 다시 로드
            this.isLoaded = false;
            await this.loadData();
            
            return results;
        } catch (error) {
            console.error('데이터베이스 추가 오류:', error);
            throw error;
        }
    }
    
    /**
     * 샘플 데이터 생성 (CSV 업로드 전까지 사용)
     */
    getSampleData() {
        return [
            {
                id: 1,
                name: "국보 서울 원각사지 십층석탑 (서울 圓覺寺址 十層石塔)",
                category: "국보",
                location: "서울특별시",
                korean_description: "원각사는 지금의 탑골공원 자리에 있었던 절로, 조선 세조 11년(1465)에 세웠다. 조선시대의 숭유억불정책 속에서도 중요한 사찰로 보호되어 오다가 1504년 연산군이 이 절을 '연방원(聯芳院)'이라는 이름의 기생집으로 만들어 승려들을 내보냄으로써 절은 없어지게 되었다. 이 탑은 조선시대의 석탑으로는 유일한 형태로, 높이는 약 12m이다. 대리석으로 만들어졌으며 탑 구석구석에 표현된 화려한 조각이 대리석의 회백색과 잘 어울려 더욱 아름답게 보인다.",
                english_description: "Wongaksa Temple whose precincts once housed this stone was established in 1465 at the current location of Tapgol Park in Downtown Seoul. The temple continued to thrive as a state institution even after the adoption of anti-Buddhist policies by the Joseon Dynasty, but was eventually turned into a gisaeng house called Yeonbangwon by King Yeonsangun in 1504. This stone pagoda is unique among those built during the Joseon period, standing about 12 meters tall. Made of marble, the pagoda displays exquisite carvings throughout that harmonize beautifully with the grayish-white color of the marble.",
                source_url: "http://www.heritage.go.kr/heri/cul/culSelectDetail.do?culPageNo=1&region=1&searchCondition=1&searchKeyword=원각사지&ccbaCpno=2113800860000&ccbaKdcd=11&ccbaCtcd=13",
                period: "조선시대",
                designation_no: "국보 제2호",
                image_url: "https://www.cha.go.kr/unisearch/images/national_treasure/1613374.jpg",
                coords: { lat: 37.5703, lng: 126.9882 }
            },
            {
                id: 2,
                name: "국보 훈민정음",
                category: "국보",
                location: "전국",
                korean_description: "훈민정음은 1443년(세종 25) 조선 제4대 왕인 세종이 창제한 우리나라 고유의 문자이다. 세종은 중국 문자를 사용하던 당시의 현실을 안타깝게 여겨, 우리말의 표기에 적합한 문자 체계를 완성하였다. 훈민정음 해례본은 1446년에 간행된 것으로, 새로 만든 28자의 자형과 그 사용법을 자세히 설명하고 있다.",
                english_description: "Hunminjeongeum is the original name of Hangeul, the Korean alphabet created by King Sejong the Great in 1443. Feeling sorry for the people who could not express their thoughts and feelings in writing due to the difficulty of Chinese characters, King Sejong created an easy writing system suitable for Korean language. The Hunminjeongeum Haerye edition published in 1446 contains detailed explanations of the 28 letters and their usage.",
                source_url: "http://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1132970700000",
                period: "조선시대",
                designation_no: "국보 제70호",
                image_url: "https://www.cha.go.kr/unisearch/images/national_treasure/1613644.jpg",
                coords: { lat: 37.5795, lng: 126.9770 }
            },
            {
                id: 3,
                name: "보물 경주 불국사 다보탑",
                category: "보물", 
                location: "경상북도",
                korean_description: "불국사 다보탑은 통일신라시대인 751년(경덕왕 10)에 건립된 것으로 추정되는 석탑이다. 높이 10.4m의 이 탑은 독특하고 화려한 장식으로 유명하며, 같은 경내에 있는 석가탑과 대조를 이루고 있다. 다보탑은 『법화경』의 다보여래 신앙을 바탕으로 건립되었으며, 복잡하면서도 아름다운 구조로 통일신라 석탑 예술의 절정을 보여준다.",
                english_description: "Dabotap Pagoda at Bulguksa Temple is estimated to have been built in 751 during the Unified Silla period. Standing 10.4 meters tall, this pagoda is famous for its unique and ornate decorations, contrasting with the simpler Seokgatap Pagoda in the same temple grounds. Dabotap was built based on the faith of Prabhutaratna Buddha from the Lotus Sutra, showcasing the pinnacle of Unified Silla pagoda art with its complex yet beautiful structure.",
                source_url: "http://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1132020200000",
                period: "통일신라",
                designation_no: "보물 제20호",
                image_url: "https://www.cha.go.kr/unisearch/images/treasure/1611515.jpg",
                coords: { lat: 35.7898, lng: 129.3320 }
            },
            {
                id: 4,
                name: "사적 경주 첨성대",
                category: "사적",
                location: "경상북도",
                korean_description: "첨성대는 신라시대의 천문관측대로, 선덕여왕(재위 632~647) 때 건립된 것으로 추정된다. 높이 9.17m의 이 석조 건물은 동양에서 현존하는 가장 오래된 천문대이다. 27단의 석재로 쌓아 올린 원통형 구조물로, 신라인들의 뛰어난 과학 기술과 천문학 지식을 보여주는 귀중한 유산이다.",
                english_description: "Cheomseongdae is an astronomical observatory from the Silla period, believed to have been built during the reign of Queen Seondeok (632-647). This 9.17-meter-tall stone structure is the oldest existing observatory in East Asia. Built with 27 layers of stone in a cylindrical form, it represents the advanced scientific technology and astronomical knowledge of the Silla people.",
                source_url: "http://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1315400310000",
                period: "신라시대",
                designation_no: "사적 제31호",
                image_url: "https://www.cha.go.kr/unisearch/images/historic_site/1612055.jpg",
                coords: { lat: 35.8347, lng: 129.2186 }
            },
            {
                id: 5,
                name: "명승 한라산",
                category: "명승",
                location: "제주특별자치도",
                korean_description: "한라산은 제주도 중앙에 위치한 해발 1,950m의 우리나라 최고봉이다. 화산활동으로 형성된 이 산은 정상에 백록담이라는 분화구호를 가지고 있으며, 고도에 따라 다양한 식생대를 이루고 있다. 아고산대 식물과 고산식물이 분포하여 학술적 가치가 높고, 웅장하고 아름다운 자연경관을 자랑한다.",
                english_description: "Hallasan Mountain, located in the center of Jeju Island, is South Korea's highest peak at 1,950 meters above sea level. This mountain, formed by volcanic activity, has a crater lake called Baengnokdam at its summit and features diverse vegetation zones according to altitude. It has high academic value due to the distribution of subalpine and alpine plants, and boasts magnificent and beautiful natural scenery.",
                source_url: "http://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1572600980000",
                period: "자연유산",
                designation_no: "명승 제98호",
                image_url: "https://www.cha.go.kr/unisearch/images/scenic_site/1613905.jpg",
                coords: { lat: 33.3616, lng: 126.5292 }
            },
            {
                id: 6,
                name: "천연기념물 진도 진돗개",
                category: "천연기념물",
                location: "전라남도",
                korean_description: "진돗개는 진도에서 자연적으로 번식해온 우리나라 토종개로, 충성심이 강하고 영리하여 예로부터 사랑받아 왔다. 주인에 대한 충성심과 귀소본능이 뛰어나며, 사냥개로서의 능력도 우수하다. 모색에 따라 황구(황색)와 백구(흰색)로 나뉘며, 우리나라 고유의 견종으로서의 가치를 인정받고 있다.",
                english_description: "The Jindo dog is Korea's native breed that has naturally bred on Jindo Island. Known for strong loyalty and intelligence, it has been beloved since ancient times. It excels in loyalty to its master and homing instinct, and also has excellent abilities as a hunting dog. Divided into Hwanggu (yellow) and Baekgu (white) according to coat color, it is recognized for its value as Korea's unique dog breed.",
                source_url: "http://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1472053000000",
                period: "자연유산",
                designation_no: "천연기념물 제53호",
                image_url: "https://www.cha.go.kr/unisearch/images/natural_monument/1614201.jpg",
                coords: { lat: 34.4867, lng: 126.2637 }
            }
        ];
    }
    
    /**
     * 데이터 처리 및 분류
     */
    processData() {
        this.filteredData = [...this.heritageData];
        
        // 카테고리 및 지역 정보 수집
        this.heritageData.forEach(item => {
            if (item.category) this.categories.add(item.category);
            if (item.location) this.locations.add(item.location);
        });
        
        // 4축 필터링 시스템 업데이트
        this.updateFilters();
        
        // 기존 필터 옵션도 업데이트 (호환성)
        this.updateFilterOptions();
        
        // 대시보드 업데이트 (데이터 로드 완료 후)
        if (typeof updateDashboard === 'function') {
            setTimeout(() => {
                updateDashboard();
            }, 100);
        }
    }
    
    /**
     * 필터 옵션 업데이트
     */
    updateFilterOptions() {
        const categoryFilter = document.getElementById('category-filter');
        const locationFilter = document.getElementById('location-filter');
        
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">모든 카테고리</option>';
            [...this.categories].sort().forEach(category => {
                categoryFilter.innerHTML += `<option value="${category}">${category}</option>`;
            });
        }
        
        if (locationFilter) {
            locationFilter.innerHTML = '<option value="">모든 지역</option>';
            [...this.locations].sort().forEach(location => {
                locationFilter.innerHTML += `<option value="${location}">${location}</option>`;
            });
        }
    }
    
    /**
     * 검색 및 필터링 (기본)
     */
    search(query = '', categoryFilter = '', locationFilter = '') {
        this.filteredData = this.heritageData.filter(item => {
            const matchesQuery = !query || 
                item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.korean_description.toLowerCase().includes(query.toLowerCase()) ||
                (item.english_description && item.english_description.toLowerCase().includes(query.toLowerCase()));
            
            const matchesCategory = !categoryFilter || item.category === categoryFilter;
            const matchesLocation = !locationFilter || item.location === locationFilter;
            
            return matchesQuery && matchesCategory && matchesLocation;
        });
        
        return this.filteredData;
    }
    
    /**
     * 4축 필터링 시스템
     */
    applyFilters() {
        const searchTerm = document.getElementById('globalSearch')?.value || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const regionFilter = document.getElementById('location-filter')?.value || '';
        const authorityFilter = document.getElementById('authority-filter')?.value || '';
        const regionGroupFilter = document.getElementById('region-group-filter')?.value || '';
        const qualityFilter = document.getElementById('quality-filter')?.value || '';
        const periodFilter = document.getElementById('period-filter')?.value || '';
        
        console.log('🔍 4축 필터링 적용:', {
            searchTerm, categoryFilter, regionFilter, authorityFilter, 
            regionGroupFilter, qualityFilter, periodFilter
        });
        
        this.filteredData = this.heritageData.filter(item => {
            // 1. 검색어 필터
            if (searchTerm) {
                const searchableText = [
                    item.name, item.kdcd_name || item.category, 
                    item.ctcd_name || item.location, item.content
                ].join(' ').toLowerCase();
                if (!searchableText.includes(searchTerm.toLowerCase())) return false;
            }
            
            // 2. 카테고리 필터 (기존)
            if (categoryFilter) {
                const itemCategory = item.kdcd_name || item.category || (item.key_kdcd ? `미분류코드${item.key_kdcd}` : '미분류');
                if (itemCategory !== categoryFilter) return false;
            }
            
            // 3. 지역 필터 (기존)
            if (regionFilter) {
                const itemRegion = item.ctcd_name || item.location || (item.key_ctcd ? `미분류지역${item.key_ctcd}` : '미분류지역');
                if (itemRegion !== regionFilter) return false;
            }
            
            // 4. 지정 권한 필터 (축 1)
            if (authorityFilter) {
                const authorityLevel = this.getAuthorityLevel(item.key_kdcd);
                if (authorityLevel !== authorityFilter) return false;
            }
            
            // 5. 지역 그룹 필터 (축 2)
            if (regionGroupFilter) {
                const regionGroup = this.getRegionGroup(item.key_ctcd);
                if (regionGroup !== regionGroupFilter) return false;
            }
            
            // 6. 데이터 품질 필터 (축 3)
            if (qualityFilter) {
                const qualityScore = this.getDataQualityScore(item);
                if (!this.matchesQualityFilter(qualityScore, qualityFilter)) return false;
            }
            
            // 7. 시대 분류 필터 (축 4)
            if (periodFilter) {
                const period = this.getHistoricalPeriod(item);
                if (period !== periodFilter) return false;
            }
            
            return true;
        });
        
        // 결과 개수 실시간 업데이트
        this.updateResultsCount();
        
        // 필터 요약 업데이트
        this.updateFilterSummary();
        
        console.log(`✅ 4축 필터링 완료: ${this.filteredData.length}개 결과`);
        return this.filteredData;
    }
    
    /**
     * 지정 권한 레벨 계산
     */
    getAuthorityLevel(keyKdcd) {
        if (!keyKdcd) return '미분류';
        
        const code = String(keyKdcd);
        if (['11', '12', '13', '14', '15', '16', '17'].includes(code)) {
            return '국가지정';
        } else if (['21', '22', '23', '31'].includes(code)) {
            return '시도지정';
        } else if (['79', '80'].includes(code)) {
            return '기타지정';
        }
        return '미분류';
    }
    
    /**
     * 지역 그룹 계산
     */
    getRegionGroup(keyCtcd) {
        if (!keyCtcd) return '미분류';
        
        const code = String(keyCtcd);
        const regionGroups = {
            '수도권': ['11', '23', '31'], // 서울, 인천, 경기
            '영남권': ['21', '22', '26', '37', '38'], // 부산, 대구, 울산, 경북, 경남
            '호남권': ['24', '35', '36'], // 광주, 전북, 전남
            '충청권': ['25', '29', '33', '34'], // 대전, 세종, 충북, 충남
            '강원권': ['32'], // 강원
            '제주권': ['39'] // 제주
        };
        
        for (const [group, codes] of Object.entries(regionGroups)) {
            if (codes.includes(code)) return group;
        }
        return '기타지역';
    }
    
    /**
     * 데이터 품질 점수 계산
     */
    getDataQualityScore(item) {
        let score = 0;
        if (item.content && item.content.trim()) score += 1;
        if (item.image_url && item.image_url.trim()) score += 1;
        if (item.english_description && item.english_description.trim()) score += 1;
        if (item.coords && item.coords.lat && item.coords.lng) score += 1;
        return score;
    }
    
    /**
     * 품질 필터 매칭
     */
    matchesQualityFilter(score, filter) {
        switch (filter) {
            case 'complete': return score >= 4;
            case 'high': return score >= 3;
            case 'medium': return score >= 2;
            case 'basic': return score >= 1;
            default: return true;
        }
    }
    
    /**
     * 시대 분류 계산 (간단한 키워드 기반)
     */
    getHistoricalPeriod(item) {
        const content = (item.content || '').toLowerCase();
        const name = (item.name || '').toLowerCase();
        const text = content + ' ' + name;
        
        if (text.includes('선사') || text.includes('구석기') || text.includes('신석기')) return '선사시대';
        if (text.includes('삼국') || text.includes('고구려') || text.includes('백제') || text.includes('신라')) return '삼국시대';
        if (text.includes('통일신라') || text.includes('신라시대')) return '통일신라';
        if (text.includes('고려') || text.includes('고려시대')) return '고려시대';
        if (text.includes('조선') || text.includes('조선시대') || text.includes('세종') || text.includes('이성계')) return '조선시대';
        if (text.includes('근대') || text.includes('현대') || text.includes('일제') || text.includes('해방')) return '근현대';
        
        return '미분류';
    }
    
    /**
     * 필터 요약 업데이트
     */
    updateFilterSummary() {
        const filters = [];
        const authorityFilter = document.getElementById('authority-filter')?.value;
        const regionGroupFilter = document.getElementById('region-group-filter')?.value;
        const qualityFilter = document.getElementById('quality-filter')?.value;
        const periodFilter = document.getElementById('period-filter')?.value;
        
        if (authorityFilter) filters.push(`지정권한: ${authorityFilter}`);
        if (regionGroupFilter) filters.push(`지역: ${regionGroupFilter}`);
        if (qualityFilter) filters.push(`품질: ${qualityFilter}`);
        if (periodFilter) filters.push(`시대: ${periodFilter}`);
        
        const summary = filters.length > 0 ? filters.join(', ') : '모든 문화재';
        updateElement('current-filters', summary);
        updateElement('filtered-count', this.filteredData.length.toLocaleString());
    }
    
    /**
     * ID로 특정 문화재 찾기
     */
    getById(id) {
        return this.heritageData.find(item => item.id == id);
    }
    
    /**
     * 이름으로 특정 문화재 찾기
     */
    getByName(name) {
        return this.heritageData.find(item => item.name === name);
    }
    
    /**
     * 카테고리별 문화재 가져오기
     */
    getByCategory(category) {
        console.log('🔍 카테고리별 검색:', category);
        
        return this.heritageData.filter(item => {
            // 미분류 카테고리 처리
            if (category.startsWith('미분류-')) {
                const subCategory = category.replace('미분류-', '');
                
                // 이름 기반 분류
                if (item.name && item.name.includes(subCategory)) {
                    return true;
                }
                
                // 설명 기반 분류
                const content = (item.content || item.korean_description || '').toLowerCase();
                if (content.includes(subCategory)) {
                    return true;
                }
                
                // 키워드 기반 분류
                const keywords = {
                    '사찰': ['사찰', '절', '암자', '선원', '정사'],
                    '고분': ['고분', '무덤', '분묘', '능', '릉'],
                    '성곽': ['성', '성곽', '성벽', '성터', '산성'],
                    '탑': ['탑', '석탑', '목탑', '전탑'],
                    '불상': ['불상', '석불', '목불', '금불'],
                    '기와': ['기와', '와당', '전', '벽돌'],
                    '도자기': ['도자기', '자기', '도기', '토기', '청자', '백자'],
                    '서적': ['서적', '책', '문서', '고문서', '필사본'],
                    '회화': ['회화', '그림', '화', '도화', '산수화'],
                    '공예': ['공예', '장식', '금속', '목공', '칠공'],
                    '기타': ['기타', '미상', '불명']
                };
                
                if (keywords[subCategory]) {
                    return keywords[subCategory].some(keyword => 
                        item.name.includes(keyword) || content.includes(keyword)
                    );
                }
                
                return false;
            }
            
            // 일반 카테고리 처리
            return item.category === category || 
                   item.kdcd_name === category ||
                   (item.key_kdcd && this.getCategoryByCode(item.key_kdcd) === category);
        });
    }
    
    /**
     * 코드로 카테고리명 반환
     */
    getCategoryByCode(keyKdcd) {
        const codeMapping = {
            '11': '국보', '12': '보물', '13': '사적', '14': '명승',
            '15': '천연기념물', '16': '국가무형문화재', '17': '국가민속문화재',
            '21': '시도유형문화재', '22': '시도기념물', '23': '시도민속문화재',
            '31': '시도무형문화재', '79': '문화재자료', '80': '등록문화재'
        };
        return codeMapping[keyKdcd] || '미분류';
    }
    
    /**
     * 통계 정보 가져오기
     */
    getStatistics() {
        console.log('📊 통계 계산 시작, 총 데이터:', this.heritageData.length);
        
        const stats = {
            total: this.heritageData.length,
            categories: {},
            locations: new Set()
        };
        
        // 실제 데이터 기반으로 통계 수집
        this.heritageData.forEach(item => {
            // 카테고리 통계 (우선순위: kdcd_name > category > 코드 기반)
            let category = '미분류';
            if (item.kdcd_name && item.kdcd_name !== '') {
                category = item.kdcd_name;
            } else if (item.category && item.category !== '') {
                category = item.category;
            } else if (item.key_kdcd) {
                // 코드 기반 매핑
                const codeMapping = {
                    '11': '국보', '12': '보물', '13': '사적', '14': '명승',
                    '15': '천연기념물', '16': '국가무형문화재', '17': '국가민속문화재',
                    '21': '시도유형문화재', '22': '시도기념물', '23': '시도민속문화재',
                    '31': '시도무형문화재', '79': '문화재자료', '80': '등록문화재'
                };
                category = codeMapping[item.key_kdcd] || `미분류코드${item.key_kdcd}`;
            } else {
                // 미분류 항목들을 더 세분화
                if (item.name && item.name.includes('사찰')) {
                    category = '미분류-사찰';
                } else if (item.name && item.name.includes('고분')) {
                    category = '미분류-고분';
                } else if (item.name && item.name.includes('성')) {
                    category = '미분류-성곽';
                } else if (item.name && item.name.includes('탑')) {
                    category = '미분류-탑';
                } else if (item.name && item.name.includes('불상')) {
                    category = '미분류-불상';
                } else if (item.name && item.name.includes('기와')) {
                    category = '미분류-기와';
                } else if (item.name && item.name.includes('도자기')) {
                    category = '미분류-도자기';
                } else if (item.name && item.name.includes('서적')) {
                    category = '미분류-서적';
                } else if (item.name && item.name.includes('회화')) {
                    category = '미분류-회화';
                } else if (item.name && item.name.includes('공예')) {
                    category = '미분류-공예';
                } else {
                    category = '미분류-기타';
                }
            }
            
            stats.categories[category] = (stats.categories[category] || 0) + 1;
            
            // 지역 통계 (우선순위: ctcd_name > location > 코드 기반)
            let location = null;
            if (item.ctcd_name && item.ctcd_name !== '') {
                location = item.ctcd_name;
            } else if (item.location && item.location !== '') {
                location = item.location;
            } else if (item.key_ctcd) {
                // 지역 코드 기반 매핑
                const regionMapping = {
                    '11': '서울특별시', '21': '부산광역시', '22': '대구광역시', '23': '인천광역시',
                    '24': '광주광역시', '25': '대전광역시', '26': '울산광역시', '29': '세종특별자치시',
                    '31': '경기도', '32': '강원특별자치도', '33': '충청북도', '34': '충청남도',
                    '35': '전북특별자치도', '36': '전라남도', '37': '경상북도', '38': '경상남도',
                    '39': '제주특별자치도'
                };
                location = regionMapping[item.key_ctcd] || `미분류지역${item.key_ctcd}`;
            }
            
            if (location) {
                stats.locations.add(location);
            }
        });
        
        console.log('📊 통계 계산 완료:', {
            total: stats.total,
            categories: stats.categories,
            locationCount: stats.locations.size
        });
        
        return {
            ...stats,
            locationCount: stats.locations.size
        };
    }
    
    /**
     * 현재 필터링된 데이터 반환
     */
    getCurrentData() {
        return this.filteredData && this.filteredData.length > 0 ? this.filteredData : this.heritageData;
    }
    
    /**
     * 4축 필터링 시스템 - 모든 실제 카테고리 수집
     */
    updateFilters() {
        console.log('🔄 4축 필터링 시스템 업데이트 시작...');
        
        // 1. 모든 실제 카테고리 수집 (미분류 포함)
        const allCategories = [...new Set(this.heritageData.map(item => {
            // 우선순위: kdcd_name > category > 코드 기반 이름
            if (item.kdcd_name && item.kdcd_name !== '') {
                return item.kdcd_name;
            } else if (item.category && item.category !== '') {
                return item.category;
            } else if (item.key_kdcd) {
                // 코드 기반 매핑
                const codeMapping = {
                    '11': '국보', '12': '보물', '13': '사적', '14': '명승',
                    '15': '천연기념물', '16': '국가무형문화재', '17': '국가민속문화재',
                    '21': '시도유형문화재', '22': '시도기념물', '23': '시도민속문화재',
                    '31': '시도무형문화재',  // ← 3,288개의 정체!
                    '79': '문화재자료', '80': '등록문화재'
                };
                return codeMapping[item.key_kdcd] || `미분류코드${item.key_kdcd}`;
            } else {
                return '미분류';
            }
        }).filter(Boolean))].sort();
        
        console.log('📊 발견된 전체 카테고리:', allCategories.length, allCategories);
        
        // 2. 카테고리 드롭다운 업데이트 (모든 카테고리 포함)
        const categorySelect = document.getElementById('category-filter');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">모든 종목</option>';
            
            allCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categorySelect.appendChild(option);
            });
        }
        
        // 3. 지역도 동일하게 처리
        const allRegions = [...new Set(this.heritageData.map(item => {
            if (item.ctcd_name && item.ctcd_name !== '') {
                return item.ctcd_name;
            } else if (item.location && item.location !== '') {
                return item.location;
            } else if (item.key_ctcd) {
                const regionMapping = {
                    '11': '서울특별시', '21': '부산광역시', '22': '대구광역시',
                    '23': '인천광역시', '24': '광주광역시', '25': '대전광역시',
                    '26': '울산광역시', '29': '세종특별자치시',
                    '31': '경기도', '32': '강원특별자치도', '33': '충청북도',
                    '34': '충청남도', '35': '전북특별자치도', '36': '전라남도',
                    '37': '경상북도', '38': '경상남도', '39': '제주특별자치도'
                };
                return regionMapping[item.key_ctcd] || `미분류지역${item.key_ctcd}`;
            } else {
                return '미분류지역';
            }
        }).filter(Boolean))].sort();
        
        const regionSelect = document.getElementById('region-filter') || document.getElementById('location-filter');
        if (regionSelect) {
            regionSelect.innerHTML = '<option value="">모든 지역</option>';
            
            allRegions.forEach(region => {
                const option = document.createElement('option');
                option.value = region;
                option.textContent = region;
                regionSelect.appendChild(option);
            });
        }
        
        console.log(`✅ 필터 업데이트 완료: 전체 ${this.heritageData.length}개 데이터`);
        
        // 4축 필터링 이벤트 리스너 설정
        this.setup4AxisFilterListeners();
    }
    
    /**
     * 4축 필터링 이벤트 리스너 설정
     */
    setup4AxisFilterListeners() {
        console.log('🔧 4축 필터링 이벤트 리스너 설정 중...');
        
        // 기존 이벤트 리스너 제거 (중복 방지)
        const filterElements = [
            'authority-filter', 'region-group-filter', 'quality-filter', 'period-filter',
            'category-filter', 'location-filter', 'region-filter'
        ];
        
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // 기존 이벤트 리스너 제거
                element.removeEventListener('change', this.handleFilterChange);
                // 새 이벤트 리스너 추가
                element.addEventListener('change', this.handleFilterChange.bind(this));
                console.log(`✅ ${id} 이벤트 리스너 설정 완료`);
            }
        });
        
        // 검색어 이벤트 리스너
        const searchElement = document.getElementById('globalSearch');
        if (searchElement) {
            searchElement.removeEventListener('input', this.handleSearchInput);
            searchElement.addEventListener('input', this.handleSearchInput.bind(this));
            console.log('✅ 검색어 이벤트 리스너 설정 완료');
        }
        
        console.log('🔧 4축 필터링 이벤트 리스너 설정 완료');
    }
    
    /**
     * 필터 변경 이벤트 핸들러
     */
    handleFilterChange(event) {
        console.log('🔍 필터 변경:', event.target.id, event.target.value);
        this.applyFilters();
    }
    
    /**
     * 검색어 입력 이벤트 핸들러
     */
    handleSearchInput(event) {
        console.log('🔍 검색어 입력:', event.target.value);
        // 디바운스 적용 (300ms)
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
        }, 300);
    }
    
    /**
     * 4축 필터링 적용
     */
    applyFilters() {
        // 모든 필터 값 수집
        const searchTerm = document.getElementById('globalSearch')?.value?.toLowerCase() || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const regionFilter = document.getElementById('region-filter')?.value || 
                           document.getElementById('location-filter')?.value || '';
        
        // 4축 필터링 값들
        const authorityFilter = document.getElementById('authority-filter')?.value || '';
        const regionGroupFilter = document.getElementById('region-group-filter')?.value || '';
        const qualityFilter = document.getElementById('quality-filter')?.value || '';
        const periodFilter = document.getElementById('period-filter')?.value || '';
        
        console.log('🔍 4축 필터 적용:', { 
            searchTerm, categoryFilter, regionFilter,
            authorityFilter, regionGroupFilter, qualityFilter, periodFilter
        });
        
        this.filteredData = this.heritageData.filter(item => {
            // 1. 검색어 필터
            if (searchTerm) {
                const searchableText = [
                    item.name,
                    item.kdcd_name || item.category,
                    item.ctcd_name || item.location,
                    item.content || item.korean_description
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(searchTerm)) return false;
            }
            
            // 2. 카테고리 필터
            if (categoryFilter) {
                const itemCategory = item.kdcd_name || item.category || 
                                   (item.key_kdcd ? `미분류코드${item.key_kdcd}` : '미분류');
                if (itemCategory !== categoryFilter) return false;
            }
            
            // 3. 지역 필터
            if (regionFilter) {
                const itemRegion = item.ctcd_name || item.location || 
                                  (item.key_ctcd ? `미분류지역${item.key_ctcd}` : '미분류지역');
                if (itemRegion !== regionFilter) return false;
            }
            
            // 4. 지정 권한 필터
            if (authorityFilter) {
                const authority = this.getAuthorityLevel(item.key_kdcd);
                if (authority !== authorityFilter) return false;
            }
            
            // 5. 지역 그룹 필터
            if (regionGroupFilter) {
                const regionGroup = this.getRegionGroup(item.key_ctcd);
                if (regionGroup !== regionGroupFilter) return false;
            }
            
            // 6. 데이터 품질 필터
            if (qualityFilter) {
                const qualityScore = this.getDataQualityScore(item);
                if (!this.matchesQualityFilter(qualityScore, qualityFilter)) return false;
            }
            
            // 7. 역사적 시대 필터
            if (periodFilter) {
                const period = this.getHistoricalPeriod(item);
                if (period !== periodFilter) return false;
            }
            
            return true;
        });
        
        console.log(`🔍 4축 필터 적용 결과: ${this.filteredData.length}개`);
        
        // 결과 개수 실시간 업데이트
        this.updateResultsCount();
        
        // 필터 요약 업데이트
        this.updateFilterSummary();
        
        return this.filteredData;
    }
    
    /**
     * 지정 권한 레벨 반환
     */
    getAuthorityLevel(keyKdcd) {
        if (!keyKdcd) return '기타지정';
        
        const authorityMapping = {
            '11': '국가지정', '12': '국가지정', '13': '국가지정', '14': '국가지정',
            '15': '국가지정', '16': '국가지정', '17': '국가지정',
            '21': '시도지정', '22': '시도지정', '23': '시도지정',
            '31': '시도지정', '79': '기타지정', '80': '기타지정'
        };
        
        return authorityMapping[keyKdcd] || '기타지정';
    }
    
    /**
     * 지역 그룹 반환
     */
    getRegionGroup(keyCtcd) {
        if (!keyCtcd) return '기타';
        
        const regionGroupMapping = {
            '11': '수도권', '31': '수도권',  // 서울, 경기
            '21': '영남권', '22': '영남권', '25': '영남권', '26': '영남권', '37': '영남권', '38': '영남권',  // 부산, 대구, 대전, 울산, 경북, 경남
            '24': '호남권', '35': '호남권', '36': '호남권',  // 광주, 전북, 전남
            '23': '충청권', '29': '충청권', '33': '충청권', '34': '충청권',  // 인천, 세종, 충북, 충남
            '32': '강원권',  // 강원
            '39': '제주권'   // 제주
        };
        
        return regionGroupMapping[keyCtcd] || '기타';
    }
    
    /**
     * 데이터 품질 점수 계산
     */
    getDataQualityScore(item) {
        let score = 0;
        
        // 기본 정보 (1점)
        if (item.name && item.name.trim()) score += 1;
        
        // 카테고리 정보 (1점)
        if (item.kdcd_name || item.category) score += 1;
        
        // 지역 정보 (1점)
        if (item.ctcd_name || item.location) score += 1;
        
        // 설명 정보 (1점)
        if (item.content || item.korean_description) score += 1;
        
        // 이미지 정보 (1점)
        if (item.image_url && item.image_url.trim()) score += 1;
        
        // 좌표 정보 (1점)
        if (item.coords && item.coords.lat && item.coords.lng) score += 1;
        
        return score;
    }
    
    /**
     * 품질 필터 매칭 확인
     */
    matchesQualityFilter(score, filter) {
        switch (filter) {
            case 'complete': return score >= 6;
            case 'high': return score >= 3;
            case 'medium': return score >= 2;
            case 'basic': return score >= 1;
            default: return true;
        }
    }
    
    /**
     * 역사적 시대 반환
     */
    getHistoricalPeriod(item) {
        const name = item.name || '';
        const description = item.content || item.korean_description || '';
        const text = (name + ' ' + description).toLowerCase();
        
        // 시대별 키워드 매칭
        if (text.includes('삼국') || text.includes('고구려') || text.includes('백제') || text.includes('신라')) {
            return '삼국시대';
        } else if (text.includes('고려') || text.includes('고려시대')) {
            return '고려시대';
        } else if (text.includes('조선') || text.includes('조선시대')) {
            return '조선시대';
        } else if (text.includes('일제') || text.includes('일본') || text.includes('근대')) {
            return '근대';
        } else if (text.includes('현대') || text.includes('현재')) {
            return '현대';
        } else {
            return '시대미상';
        }
    }
    
    /**
     * 필터 요약 업데이트
     */
    updateFilterSummary() {
        const summaryElement = document.getElementById('filter-summary');
        if (!summaryElement) return;
        
        const activeFilters = [];
        
        // 활성 필터 수집
        const filters = [
            { id: 'authority-filter', label: '지정권한' },
            { id: 'region-group-filter', label: '지역그룹' },
            { id: 'quality-filter', label: '데이터품질' },
            { id: 'period-filter', label: '역사적시대' },
            { id: 'category-filter', label: '카테고리' },
            { id: 'location-filter', label: '지역' }
        ];
        
        filters.forEach(filter => {
            const element = document.getElementById(filter.id);
            if (element && element.value) {
                activeFilters.push(`${filter.label}: ${element.value}`);
            }
        });
        
        // 요약 표시
        if (activeFilters.length > 0) {
            summaryElement.innerHTML = `
                <div class="alert alert-info mb-0">
                    <i class="fas fa-filter me-2"></i>
                    <strong>활성 필터:</strong> ${activeFilters.join(', ')}
                </div>
            `;
        } else {
            summaryElement.innerHTML = '';
        }
    }
    
    /**
     * 결과 개수 업데이트
     */
    updateResultsCount() {
        const count = this.filteredData ? this.filteredData.length : this.heritageData.length;
        
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
        
        // 메인 페이지 총 문화재 수 업데이트
        this.updateMainPageCount();
    }
    
    /**
     * 메인 페이지 총 문화재 수 업데이트
     */
    updateMainPageCount() {
        const totalCount = this.heritageData.length;
        console.log('🏠 메인 페이지 총 문화재 수 업데이트:', totalCount);
        
        // 여러 가능한 요소 ID들에 대해 업데이트 시도
        const possibleIds = [
            'total-heritage-count', 'main-total-count', 'dashboard-total-count',
            'sidebar-total', 'home-total-count'
        ];
        
        possibleIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = totalCount.toLocaleString();
                console.log(`✅ ${id} 업데이트: ${totalCount.toLocaleString()}`);
            }
        });
        
        // 클래스 기반으로도 찾기
        const totalCountElements = document.querySelectorAll('.total-heritage-count, .main-total-count');
        totalCountElements.forEach(element => {
            element.textContent = totalCount.toLocaleString();
        });
    }
    
    /**
     * 언어 토글 설정
     */
    setupLanguageToggle() {
        const langButtons = document.querySelectorAll('input[name="lang"]');
        const detailLangButtons = document.querySelectorAll('input[name="detail-lang"]');
        
        langButtons.forEach(button => {
            button.addEventListener('change', (e) => {
                const newLang = e.target.id === 'lang-ko' ? 'ko' : 'en';
                this.currentLanguage = newLang;
                
                // i18n 언어 변경
                if (window.i18n) {
                    i18n.setLanguage(newLang);
                }
                
                this.updateLanguageDisplay();
            });
        });
        
        detailLangButtons.forEach(button => {
            button.addEventListener('change', (e) => {
                const newLang = e.target.id === 'detail-lang-ko' ? 'ko' : 'en';
                this.currentLanguage = newLang;
                
                // i18n 언어 변경
                if (window.i18n) {
                    i18n.setLanguage(newLang);
                }
                
                this.updateLanguageDisplay();
            });
        });
    }
    
    /**
     * 언어 표시 업데이트
     */
    updateLanguageDisplay() {
        // 현재 보이는 뷰에 따라 언어 업데이트
        const currentView = document.querySelector('.view:not([style*="display: none"])');
        if (currentView) {
            if (currentView.id === 'detail-view') {
                this.updateDetailLanguage();
            } else if (currentView.id === 'list-view') {
                this.updateListLanguage();
            }
        }
    }
    
    updateDetailLanguage() {
        // 상세 페이지 언어 업데이트 (추후 구현)
    }
    
    updateListLanguage() {
        // 목록 페이지 언어 업데이트 (추후 구현)
    }

    /**
     * 영어 설명 생성 (간단한 템플릿 기반)
     */
    generateEnglishDescription(item) {
        if (!item || !item.name) {
            return 'Description not available';
        }

        const categoryTranslations = {
            '국보': 'National Treasure',
            '보물': 'Treasure',
            '사적': 'Historic Site',
            '명승': 'Scenic Site',
            '천연기념물': 'Natural Monument',
            '국가무형문화재': 'Intangible Cultural Heritage'
        };

        const category = categoryTranslations[item.category] || item.category;
        const location = item.location || 'Unknown location';
        const name = item.name;

        // 간단한 영어 설명 템플릿
        const templates = [
            `This is a ${category} located in ${location}. ${name} represents an important part of Korean cultural heritage.`,
            `${name} is designated as a ${category} in ${location}. This cultural property holds significant historical and cultural value.`,
            `As a ${category}, ${name} in ${location} is recognized for its cultural importance and historical significance.`,
            `${name} is a valuable ${category} situated in ${location}, contributing to Korea's rich cultural heritage.`
        ];

        // 이름의 해시값을 사용해서 일관된 템플릿 선택
        const hash = this.simpleHash(name);
        const templateIndex = hash % templates.length;
        
        return templates[templateIndex];
    }

    /**
     * 간단한 해시 함수
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit 정수로 변환
        }
        return Math.abs(hash);
    }

    /**
     * 영어 설명이 없는 항목들에 대해 자동 생성
     */
    generateMissingEnglishDescriptions() {
        let generatedCount = 0;
        
        this.heritageData.forEach(item => {
            if (!item.english_description || item.english_description.trim() === '') {
                item.english_description = this.generateEnglishDescription(item);
                generatedCount++;
            }
        });

        if (generatedCount > 0) {
            console.log(`영어 설명 자동 생성 완료: ${generatedCount}개 항목`);
            this.saveToLocalStorage();
        }

        return generatedCount;
    }
}

// 전역 데이터 매니저 인스턴스
const dataManager = new DataManager();