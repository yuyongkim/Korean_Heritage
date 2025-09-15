/**
 * CSV 파일 업로드 및 처리 모듈
 */

class CSVUploader {
    constructor() {
        this.fileInput = null;
        this.uploadModal = null;
        this.progressBar = null;
        this.setupUploadModal();
    }

    /**
     * 업로드 모달 생성
     */
    setupUploadModal() {
        // 모달 HTML 추가
        const modalHTML = `
            <div class="modal fade" id="csvUploadModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-upload me-2"></i>
                                CSV 데이터 업로드
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="upload-instructions mb-4">
                                <div class="alert alert-info">
                                    <h6><i class="fas fa-info-circle me-2"></i>업로드 가이드</h6>
                                    <ul class="mb-0">
                                        <li>CSV 파일 형식: <code>name, category, location, korean_description, english_description, source_url</code></li>
                                        <li>파일 크기 제한: 최대 50MB</li>
                                        <li>인코딩: UTF-8 권장</li>
                                        <li>예상 처리 시간: 10,000건 기준 약 30초</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div class="upload-area" id="upload-area">
                                <div class="upload-zone" onclick="document.getElementById('csv-file-input').click()">
                                    <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                    <h5>파일을 여기에 드래그하거나 클릭하여 선택</h5>
                                    <p class="text-muted">CSV 파일만 업로드 가능합니다</p>
                                    <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
                                </div>
                            </div>
                            
                            <div id="file-info" class="mt-3" style="display: none;">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h6>선택된 파일</h6>
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <i class="fas fa-file-csv text-success me-2"></i>
                                                <span id="file-name"></span>
                                            </div>
                                            <small class="text-muted" id="file-size"></small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div id="upload-progress" class="mt-3" style="display: none;">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span>처리 진행률</span>
                                    <span id="progress-text">0%</span>
                                </div>
                                <div class="progress">
                                    <div id="progress-bar" class="progress-bar" style="width: 0%"></div>
                                </div>
                                <div id="progress-status" class="mt-2 text-center">
                                    <small class="text-muted">파일 분석 중...</small>
                                </div>
                            </div>
                            
                            <div id="upload-results" class="mt-3" style="display: none;">
                                <div class="alert alert-success">
                                    <h6><i class="fas fa-check-circle me-2"></i>업로드 완료</h6>
                                    <div id="results-summary"></div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                            <button type="button" id="process-csv" class="btn btn-primary" disabled>
                                <i class="fas fa-cog me-2"></i>데이터 처리 시작
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.uploadModal = new bootstrap.Modal(document.getElementById('csvUploadModal'));
        
        // 이벤트 리스너 설정
        this.setupEventListeners();
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // DOM이 완전히 로드된 후 이벤트 설정
        setTimeout(() => {
            const fileInput = document.getElementById('csv-file-input');
            const uploadArea = document.getElementById('upload-area');
            const processBtn = document.getElementById('process-csv');

            console.log('CSV 업로더 요소 확인:', {
                fileInput: !!fileInput,
                uploadArea: !!uploadArea, 
                processBtn: !!processBtn
            });

            if (!fileInput || !uploadArea || !processBtn) {
                console.error('CSV 업로더 DOM 요소를 찾을 수 없습니다!');
                return;
            }

            // 파일 선택
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
            // 드래그 앤 드롭
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFile(files[0]);
                }
            });
            
            // 처리 시작 버튼
            processBtn.addEventListener('click', () => this.processCSV());
            
            console.log('✅ CSV 업로더 이벤트 리스너 설정 완료');
        }, 500);
    }

    /**
     * 업로드 모달 표시
     */
    show() {
        this.uploadModal.show();
    }

    /**
     * 파일 선택 처리
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    /**
     * 파일 처리
     */
    handleFile(file) {
        console.log('파일 처리 시작:', file.name, file.type, file.size);
        
        if (!file.name.toLowerCase().endsWith('.csv')) {
            console.error('CSV 파일이 아님:', file.name);
            this.showError('CSV 파일만 업로드 할 수 있습니다.');
            return;
        }
        
        if (file.size > 50 * 1024 * 1024) { // 50MB
            console.error('파일 크기 초과:', file.size);
            this.showError('파일 크기가 50MB를 초과합니다.');
            return;
        }
        
        this.selectedFile = file;
        this.displayFileInfo(file);
        
        const processBtn = document.getElementById('process-csv');
        if (processBtn) {
            processBtn.disabled = false;
            console.log('✅ 파일 처리 완료, 처리 버튼 활성화');
        } else {
            console.error('❌ process-csv 버튼을 찾을 수 없음');
        }
    }

    /**
     * 파일 정보 표시
     */
    displayFileInfo(file) {
        document.getElementById('file-name').textContent = file.name;
        document.getElementById('file-size').textContent = this.formatFileSize(file.size);
        document.getElementById('file-info').style.display = 'block';
    }

    /**
     * CSV 파일 처리
     */
    async processCSV() {
        if (!this.selectedFile) return;
        
        console.log('=== CSV 처리 시작 ===');
        console.log('파일명:', this.selectedFile.name);
        console.log('파일 크기:', this.selectedFile.size);
        
        // 진행률 표시
        const progressContainer = document.getElementById('upload-progress');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const statusText = document.getElementById('progress-status');
        
        progressContainer.style.display = 'block';
        document.getElementById('process-csv').disabled = true;
        
        try {
            // 환경 체크
            statusText.innerHTML = '<small class="text-muted">환경 확인 중...</small>';
            this.updateProgress(5);
            
            const envCheck = await this.checkEnvironment();
            console.log('환경 체크 완료:', envCheck);
            
            // 파일 읽기
            statusText.innerHTML = '<small class="text-muted">파일 읽는 중...</small>';
            this.updateProgress(10);
            
            const fileContent = await this.readFileAsText(this.selectedFile);
            console.log('파일 내용 길이:', fileContent.length);
            console.log('파일 첫 200자:', fileContent.substring(0, 200));
            
            // CSV 파싱
            statusText.innerHTML = '<small class="text-muted">CSV 데이터 파싱 중...</small>';
            this.updateProgress(30);
            
            const results = Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                transform: (value, field) => {
                    return value ? value.trim() : '';
                },
                // 멀티라인 필드 처리
                complete: (results) => {
                    console.log('PapaParse 완료:', results.data.length, '행');
                },
                error: (error) => {
                    console.error('PapaParse 오류:', error);
                },
                // CSV 파일의 특수 문자 처리
                delimiter: ",",
                quoteChar: '"',
                escapeChar: '"',
                newline: "\n"
            });
            
            console.log('파싱 결과:', results.data.length, '행');
            console.log('파싱 오류:', results.errors);
            console.log('첫 번째 데이터:', results.data[0]);
            
            if (results.errors.length > 0) {
                console.warn('CSV 파싱 경고:', results.errors);
            }
            
            // 데이터 검증
            statusText.innerHTML = '<small class="text-muted">데이터 검증 중...</small>';
            this.updateProgress(50);
            
            const validatedData = this.validateAndProcessData(results.data);
            console.log('검증 완료:', validatedData.validRows, '건 성공,', validatedData.errors.length, '건 오류');
            
            // 이미지 URL 해결
            statusText.innerHTML = '<small class="text-muted">이미지 URL 해결 중...</small>';
            this.updateProgress(70);
            
            if (window.imageResolver) {
                console.log('이미지 URL 자동 해결 시작...');
                validatedData.data = await imageResolver.resolveBatchImages(validatedData.data);
            }
            
            // 영어 설명 자동 생성
            statusText.innerHTML = '<small class="text-muted">영어 설명 생성 중...</small>';
            this.updateProgress(80);
            
            validatedData.data = this.generateEnglishDescriptions(validatedData.data);
            console.log('영어 설명 생성 완료');
            
            // 데이터 저장
            statusText.innerHTML = '<small class="text-muted">데이터 저장 중...</small>';
            this.updateProgress(90);
            
            await this.saveProcessedData(validatedData);
            console.log('저장 완료');
            
            // 완료
            this.updateProgress(100);
            this.showResults(validatedData);
            
        } catch (error) {
            console.error('=== CSV 처리 오류 ===', error);
            this.showError(`파일 처리 중 오류가 발생했습니다: ${error.message}\n\n상세 정보:\n${error.stack || '스택 정보 없음'}`);
            
            // 진행률 숨기기
            progressContainer.style.display = 'none';
            document.getElementById('process-csv').disabled = false;
        }
    }

    /**
     * 데이터 검증 및 처리
     */
    validateAndProcessData(rawData) {
        const processedData = [];
        const errors = [];
        
        rawData.forEach((row, index) => {
            try {
                // 첫 번째 행 디버깅
                if (index === 0) {
                    console.log('=== 첫 번째 행 디버깅 ===');
                    console.log('전체 데이터:', row);
                    console.log('모든 필드명:', Object.keys(row));
                    console.log('name:', row.name, '(타입:', typeof row.name, ')');
                    console.log('kdcd_name:', row.kdcd_name, '(타입:', typeof row.kdcd_name, ')');
                    console.log('ctcd_name:', row.ctcd_name, '(타입:', typeof row.ctcd_name, ')');
                    console.log('content 길이:', row.content ? row.content.length : 0);
                    console.log('content 미리보기:', row.content ? row.content.substring(0, 100) + '...' : '없음');
                    console.log('imageUrl:', row.imageUrl);
                    console.log('longitude:', row.longitude);
                    console.log('latitude:', row.latitude);
                }
                
                // 필수 필드 검증 (실제 CSV 구조에 맞게)
                // CSV 파일의 필수 필드: name, kdcd_name, ctcd_name
                if (!row.name || row.name.trim() === '') {
                    const errorMsg = `${index + 1}행: 이름이 없습니다 (${row.name || '빈 값'})`;
                    errors.push(errorMsg);
                    if (index < 5) console.log('검증 실패:', errorMsg);
                    return;
                }
                
                if (!row.kdcd_name || row.kdcd_name.trim() === '') {
                    const errorMsg = `${index + 1}행: 분류명이 없습니다 (${row.kdcd_name || '빈 값'})`;
                    errors.push(errorMsg);
                    if (index < 5) console.log('검증 실패:', errorMsg);
                    return;
                }
                
                // 이미지 URL 처리
                let imageUrl = '';
                if (row.imageUrl && row.imageUrl.trim() !== '') {
                    imageUrl = row.imageUrl.trim();
                    // URL이 상대 경로인 경우 절대 경로로 변환
                    if (imageUrl.startsWith('/')) {
                        imageUrl = 'http://www.khs.go.kr' + imageUrl;
                    }
                }
                
                // 데이터 구조화 (실제 CSV 필드에 맞게)
                const item = {
                    id: Date.now() + Math.random(), // 임시 ID
                    name: row.name,
                    category: row.kdcd_name || '',
                    location: row.ctcd_name || '',
                    korean_description: row.content || '',
                    english_description: '', // 현재 CSV에는 영문 설명이 없음
                    source_url: row.source_url || '', // 원본 CSV의 source_url 사용
                    period: '', // 현재 CSV에는 시대 정보가 없음
                    designation_no: row.key_asno ? `지정번호: ${row.key_asno}` : '',
                    image_url: imageUrl,
                    coords: (row.longitude && row.latitude) ? {
                        lat: parseFloat(row.latitude),
                        lng: parseFloat(row.longitude)
                    } : null,
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
                
                processedData.push(item);
                
            } catch (error) {
                errors.push(`${index + 1}행: ${error.message}`);
            }
        });
        
        return {
            data: processedData,
            errors: errors,
            totalRows: rawData.length,
            validRows: processedData.length
        };
    }

    /**
     * 좌표 파싱
     */
    parseCoordinates(coordsStr) {
        if (!coordsStr) return null;
        
        try {
            const coords = coordsStr.split(',');
            if (coords.length === 2) {
                return {
                    lat: parseFloat(coords[0].trim()),
                    lng: parseFloat(coords[1].trim())
                };
            }
        } catch (error) {
            console.warn('좌표 파싱 실패:', coordsStr);
        }
        
        return null;
    }

    /**
     * 영어 설명 자동 생성
     */
    generateEnglishDescriptions(items) {
        const categoryTranslations = {
            '국보': 'National Treasure',
            '보물': 'Treasure',
            '사적': 'Historic Site',
            '명승': 'Scenic Site',
            '천연기념물': 'Natural Monument',
            '국가무형문화재': 'Intangible Cultural Heritage'
        };

        const templates = [
            (name, category, location) => `This is a ${category} located in ${location}. ${name} represents an important part of Korean cultural heritage.`,
            (name, category, location) => `${name} is designated as a ${category} in ${location}. This cultural property holds significant historical and cultural value.`,
            (name, category, location) => `As a ${category}, ${name} in ${location} is recognized for its cultural importance and historical significance.`,
            (name, category, location) => `${name} is a valuable ${category} situated in ${location}, contributing to Korea's rich cultural heritage.`
        ];

        return items.map(item => {
            if (!item.english_description || item.english_description.trim() === '') {
                const category = categoryTranslations[item.category] || item.category;
                const location = item.location || 'Unknown location';
                const name = item.name;

                // 이름의 해시값을 사용해서 일관된 템플릿 선택
                const hash = this.simpleHash(name);
                const templateIndex = hash % templates.length;
                
                item.english_description = templates[templateIndex](name, category, location);
            }
            return item;
        });
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
     * 처리된 데이터 저장 (단순화된 로컬 스토리지 방식)
     */
    async saveProcessedData(validatedData) {
        console.log('=== 데이터 저장 시작 ===');
        console.log('저장할 데이터:', validatedData.data.length, '건');
        
        try {
            // 현재 데이터 수 확인
            const beforeCount = dataManager.heritageData.length;
            console.log('저장 전 데이터 수:', beforeCount);
            
            // 단순히 모든 데이터 추가 (중복 체크 없이)
            dataManager.heritageData.push(...validatedData.data);
            
            // 데이터 처리 및 로컬 스토리지 저장
            dataManager.processData();
            dataManager.saveToLocalStorage();
            
            const afterCount = dataManager.heritageData.length;
            console.log('저장 후 데이터 수:', afterCount);
            console.log('추가된 데이터 수:', afterCount - beforeCount);
            
            validatedData.saveMethod = 'localStorage';
            validatedData.saveSuccess = true;
            validatedData.newItemsCount = afterCount - beforeCount;
            
            console.log('✅ 데이터 저장 완료!');
            
        } catch (error) {
            console.error('❌ 저장 실패:', error);
            validatedData.saveMethod = 'failed';
            validatedData.saveSuccess = false;
            throw error;
        }
        
        // 즉시 통계 업데이트
        setTimeout(() => this.updateAppStats(), 100);
    }
    
    /**
     * 앱 통계 즉시 업데이트
     */
    updateAppStats() {
        console.log('통계 업데이트 중...');
        
        try {
            const stats = dataManager.getStatistics();
            console.log('현재 통계:', stats);
            
            // 모든 카운트 요소 업데이트
            const updates = {
                'total-count': stats.total.toLocaleString(),
                'national-count': stats.categories['국보'] || 0,
                'treasure-count': stats.categories['보물'] || 0,
                'location-count': stats.locationCount,
                'sidebar-total': stats.total.toLocaleString(),
                'site-count': (stats.categories['사적'] || 0) + (stats.categories['명승'] || 0),
                'natural-count': stats.categories['천연기념물'] || 0
            };
            
            Object.entries(updates).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                    console.log(`✅ ${id} 업데이트: ${value}`);
                } else {
                    console.log(`⚠️ ${id} 요소 없음`);
                }
            });
            
            // 히어로 섹션도 업데이트
            const heroNumbers = document.querySelectorAll('.hero-stats .stat-number');
            if (heroNumbers.length > 0) {
                heroNumbers[0].textContent = stats.total.toLocaleString();
                console.log('✅ 히어로 통계 업데이트');
            }
            
        } catch (error) {
            console.error('통계 업데이트 실패:', error);
        }
    }

    /**
     * 결과 표시
     */
    showResults(results) {
        const resultsContainer = document.getElementById('upload-results');
        const summaryElement = document.getElementById('results-summary');
        
        const currentTotal = dataManager.heritageData.length;
        const saveMethodText = {
            'database': '✅ 데이터베이스에 영구 저장',
            'localStorage': '⚠️ 로컬 스토리지에 저장 (브라우저별 개별 보관)',
            'memory': '🚨 임시 저장 (새로고침 시 사라짐)'
        };
        
        summaryElement.innerHTML = `
            <ul class="mb-0">
                <li>총 ${results.totalRows.toLocaleString()}행 처리</li>
                <li>성공: ${results.validRows.toLocaleString()}건</li>
                <li>오류: ${results.errors.length.toLocaleString()}건</li>
                <li><strong>현재 총 문화재: ${currentTotal.toLocaleString()}건</strong></li>
                <li class="mt-2"><strong>저장 방식: ${saveMethodText[results.saveMethod] || '알 수 없음'}</strong></li>
            </ul>
            ${results.errors.length > 0 ? `
                <details class="mt-2">
                    <summary>오류 상세 보기</summary>
                    <ul class="mt-2 mb-0">
                        ${results.errors.slice(0, 10).map(err => `<li><small>${err}</small></li>`).join('')}
                        ${results.errors.length > 10 ? `<li><small>... 외 ${results.errors.length - 10}건</small></li>` : ''}
                    </ul>
                </details>
            ` : ''}
        `;
        
        resultsContainer.style.display = 'block';
        
        // 결과에 따라 다른 대기 시간
        const waitTime = results.saveMethod === 'database' ? 3000 : 5000;
        
        setTimeout(() => {
            this.uploadModal.hide();
            
            // 저장 확인 메시지 표시
            this.showSaveConfirmation(results);
            
            // 전체 애플리케이션 새로고침
            if (typeof updateDashboard === 'function') {
                updateDashboard();
            } else {
                // 메인 페이지 통계 직접 업데이트
                console.log('대시보드 직접 업데이트');
                if (typeof loadHomeDashboard === 'function') {
                    loadHomeDashboard();
                }
            }
            
            // 사이드바 통계 업데이트
            if (typeof sidebarManager !== 'undefined') {
                sidebarManager.updateSidebarStats();
            }
            
            // 현재 뷰에 따라 새로고침
            const currentHash = window.location.hash.slice(1) || 'home';
            const [route] = currentHash.split('/');
            
            if (route === 'list') {
                loadHeritageList();
            } else if (route === 'home') {
                updateDashboard();
            }
            
            // 데이터베이스 저장 실패 시에만 새로고침 (데이터 유지를 위해)
            if (results.saveMethod !== 'database') {
                console.log('로컬 저장 모드 - 새로고침 건너뜀');
            }
        }, waitTime);
    }

    /**
     * 진행률 업데이트
     */
    updateProgress(percent) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        progressBar.style.width = percent + '%';
        progressText.textContent = percent + '%';
    }

    /**
     * 오류 표시
     */
    showError(message) {
        const alertHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.querySelector('.modal-body').insertAdjacentHTML('afterbegin', alertHTML);
    }

    /**
     * 파일을 텍스트로 읽기
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('파일 읽기 실패'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * 저장 확인 메시지 표시
     */
    showSaveConfirmation(results) {
        const confirmationHTML = `
            <div class="alert alert-success alert-dismissible fade show position-fixed" 
                 style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                <strong>CSV 업로드 완료!</strong><br>
                <small>
                    성공: ${results.validRows}건 | 
                    현재 총 ${dataManager.heritageData.length}건 보관 중<br>
                    저장 방식: ${results.saveMethod === 'localStorage' ? '로컬 스토리지' : '데이터베이스'}
                </small>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', confirmationHTML);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            const alert = document.querySelector('.alert.position-fixed');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    /**
     * 파일 크기 포맷
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 데이터베이스 연결 상태 테스트
     */
    async testDatabaseConnection() {
        try {
            console.log('데이터베이스 연결 테스트 중...');
            const response = await fetch('tables/heritage?limit=1');
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ 데이터베이스 연결 정상');
                return { success: true, message: '데이터베이스 연결 정상' };
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.log('❌ 데이터베이스 연결 실패:', error.message);
            return { success: false, message: error.message };
        }
    }
    
    /**
     * 업로드 전 환경 체크
     */
    async checkEnvironment() {
        const dbTest = await this.testDatabaseConnection();
        const hasLocalStorage = typeof(Storage) !== "undefined";
        
        console.log('=== 환경 체크 결과 ===');
        console.log('데이터베이스:', dbTest.success ? '✅ 사용 가능' : '❌ 사용 불가');
        console.log('로컬 스토리지:', hasLocalStorage ? '✅ 사용 가능' : '❌ 사용 불가');
        
        if (!dbTest.success && !hasLocalStorage) {
            throw new Error('데이터베이스와 로컬 스토리지 모두 사용할 수 없습니다.');
        }
        
        return { dbTest, hasLocalStorage };
    }
}

// 전역 업로더 인스턴스 - 즉시 생성
console.log('CSV 업로더 스크립트 로드됨');
const csvUploader = new CSVUploader();
console.log('✅ CSV 업로더 인스턴스 생성 완료');