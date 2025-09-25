/**
 * 간단한 지도 관리 모듈
 * Kakao Maps API를 사용한 위치 정보 표시
 */

class SimpleMapManager {
    constructor() {
        this.currentMap = null;
        this.defaultCenter = { lat: 37.5665, lng: 126.9780 }; // 서울 중심
        this.defaultZoom = 7;
        this.loadingTimeout = 5000; // 5초 타임아웃
        this.scriptLoaded = false;
        this.scriptLoading = false;
    }

    /**
     * Kakao Maps API 스크립트 동적 로드
     * @returns {Promise} 스크립트 로드 완료 시 resolve
     */
    loadMapScript() {
        return new Promise((resolve, reject) => {
            console.log('🔄 Kakao Maps API 스크립트 로딩 시작...');
            
            // API 키 상태 확인
            if (!API_KEY_STATUS.isValid) {
                console.error('❌ API 키가 유효하지 않습니다:', API_KEY_STATUS);
                reject(new Error('Invalid API key'));
                return;
            }

            // 이미 로드된 경우
            if (this.scriptLoaded || (typeof kakao !== 'undefined' && kakao.maps)) {
                console.log('✅ Kakao Maps API 이미 로드됨');
                this.scriptLoaded = true;
                resolve();
                return;
            }

            // 이미 로딩 중인 경우
            if (this.scriptLoading) {
                console.log('⏳ Kakao Maps API 로딩 중... 대기');
                // 로딩 완료까지 대기
                const checkLoaded = () => {
                    if (this.scriptLoaded) {
                        resolve();
                    } else if (typeof kakao !== 'undefined' && kakao.maps) {
                        this.scriptLoaded = true;
                        resolve();
                    } else {
                        setTimeout(checkLoaded, 100);
                    }
                };
                checkLoaded();
                return;
            }

            this.scriptLoading = true;

            // 기존 스크립트 태그가 있는지 확인
            const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
            if (existingScript) {
                console.log('📜 기존 Kakao Maps API 스크립트 발견');
                // 기존 스크립트의 로드 이벤트 대기
                existingScript.onload = () => {
                    this.scriptLoaded = true;
                    this.scriptLoading = false;
                    console.log('✅ 기존 스크립트 로드 완료');
                    resolve();
                };
                existingScript.onerror = () => {
                    this.scriptLoading = false;
                    console.error('❌ 기존 스크립트 로드 실패');
                    reject(new Error('Kakao Maps API script failed to load'));
                };
                return;
            }

            // 새 스크립트 태그 생성
            const script = document.createElement('script');
            script.type = 'text/javascript';
            
            // HTTPS 우선 사용
            const protocol = window.location.protocol === 'https:' ? 'https:' : 'https:';
            script.src = `${protocol}//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&autoload=false`;
            script.async = true;
            // CORS 문제 해결을 위해 crossOrigin 제거
            // script.crossOrigin = 'anonymous';

            // 타임아웃 설정 (10초)
            const timeoutId = setTimeout(() => {
                console.error('⏰ Kakao Maps API 로딩 타임아웃');
                this.scriptLoading = false;
                reject(new Error('Kakao Maps API loading timeout'));
            }, 10000);

            script.onload = () => {
                clearTimeout(timeoutId);
                this.scriptLoaded = true;
                this.scriptLoading = false;
                console.log('✅ Kakao Maps API script loaded successfully');
                
                // 추가 검증
                if (typeof kakao !== 'undefined' && kakao.maps) {
                    console.log('✅ Kakao Maps 객체 확인됨');
                    resolve();
                } else {
                    console.error('❌ Kakao Maps 객체가 정의되지 않음');
                    reject(new Error('Kakao Maps object not defined'));
                }
            };

            script.onerror = (error) => {
                clearTimeout(timeoutId);
                this.scriptLoading = false;
                console.error('❌ Kakao Maps API script failed to load:', error);
                console.error('API Key:', KAKAO_MAP_API_KEY ? `${KAKAO_MAP_API_KEY.substring(0, 8)}...` : 'undefined');
                console.error('Script URL:', script.src);
                reject(new Error('Kakao Maps API script failed to load'));
            };

            // 스크립트를 head에 추가
            document.head.appendChild(script);
            console.log('📝 Kakao Maps API 스크립트 추가됨:', script.src);
        });
    }

    /**
     * 지도 표시 (Kakao Maps API 사용)
     */
    async showMap(containerId, coords, locationName = '', callback = null) {
        console.log('🗺️ Kakao 지도 표시 시작:', containerId, coords, locationName);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('지도 컨테이너를 찾을 수 없음:', containerId);
            return;
        }

        // 기존 지도 정리
        if (this.currentMap) {
            this.currentMap = null;
        }

        // 좌표가 없으면 기본 메시지
        if (!coords || (!coords.lat && !coords.latitude) || (!coords.lng && !coords.longitude)) {
            console.warn('위치 정보 없음:', coords);
            container.innerHTML = `
                <div class="text-center py-4 bg-light rounded">
                    <i class="fas fa-map-marked-alt fa-2x text-muted mb-2"></i>
                    <p class="mb-0 text-muted">위치 정보가 없습니다</p>
                </div>
            `;
            return;
        }

        // 좌표 추출 (다양한 필드명 지원)
        const lat = parseFloat(coords.lat || coords.latitude);
        const lng = parseFloat(coords.lng || coords.longitude);
        
        console.log('🗺️ 지도 좌표 확인:', { lat, lng, coords });
        
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn('잘못된 좌표:', lat, lng);
            container.innerHTML = `
                <div class="text-center py-4 bg-light rounded">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
                    <p class="mb-0 text-muted">잘못된 좌표 정보입니다</p>
                    <small class="text-muted">위도: ${lat}, 경도: ${lng}</small>
                </div>
            `;
            return;
        }

        // Kakao Maps API 로드 확인 및 로드
        try {
            if (typeof kakao === 'undefined' || !kakao.maps) {
                console.log('🔄 Kakao Maps API 로드 중...');
                await this.loadMapScript();
                
                // 추가 대기 시간 (API 초기화)
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error('❌ Kakao Maps API 로드 실패:', error);
            container.innerHTML = `
                <div class="text-center py-4 bg-light rounded">
                    <i class="fas fa-exclamation-circle fa-2x text-danger mb-2"></i>
                    <p class="mb-0 text-muted">지도 API 로드 실패</p>
                    <small class="text-muted">오류: ${error.message}</small>
                    <br><small class="text-muted">API 키: ${KAKAO_MAP_API_KEY ? KAKAO_MAP_API_KEY.substring(0, 8) + '...' : 'undefined'}</small>
                </div>
            `;
            return;
        }

        // 지도 컨테이너 설정 - 정사각형 강제
        container.innerHTML = '<div id="loading-map" class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> 지도 로딩 중...</div>';
        container.style.height = '300px';
        container.style.width = '300px';
        container.style.minWidth = '300px';
        container.style.minHeight = '300px';
        container.style.maxWidth = '300px';
        container.style.maxHeight = '300px';
        container.style.aspectRatio = '1/1';
        container.style.margin = '0 auto';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';

        // 타임아웃 설정
        const timeoutId = setTimeout(() => {
            console.warn('지도 로딩 타임아웃');
            container.innerHTML = `
                <div class="text-center py-4 bg-light rounded">
                    <i class="fas fa-clock fa-2x text-warning mb-2"></i>
                    <p class="mb-0 text-muted">지도 로딩 시간이 초과되었습니다</p>
                    <small class="text-muted">좌표: ${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
                </div>
            `;
        }, this.loadingTimeout);

        try {
            // 로딩 메시지 제거
            container.innerHTML = '';
            
            // Kakao Maps 지도 생성
            const mapContainer = document.getElementById(containerId);
            if (!mapContainer) {
                throw new Error('지도 컨테이너를 찾을 수 없습니다: ' + containerId);
            }
            
            // 좌표 객체 생성 전 유효성 재검사
            if (!kakao.maps.LatLng) {
                throw new Error('Kakao Maps LatLng 클래스를 찾을 수 없습니다');
            }
            
            const mapOption = {
                center: new kakao.maps.LatLng(lat, lng), // 지도의 중심좌표
                level: 3 // 지도의 확대 레벨
            };

            // 지도 생성
            this.currentMap = new kakao.maps.Map(mapContainer, mapOption);
            
            if (!this.currentMap) {
                throw new Error('지도 생성 실패');
            }
            
            // 지도 크기 강제 설정
            setTimeout(() => {
                const mapElement = document.getElementById(containerId);
                if (mapElement) {
                    mapElement.style.width = '300px';
                    mapElement.style.height = '300px';
                    mapElement.style.minWidth = '300px';
                    mapElement.style.minHeight = '300px';
                    mapElement.style.maxWidth = '300px';
                    mapElement.style.maxHeight = '300px';
                    mapElement.style.aspectRatio = '1/1';
                }
                // Kakao Maps 크기 조정
                if (this.currentMap && kakao.maps.event) {
                    kakao.maps.event.trigger(this.currentMap, 'resize');
                }
            }, 100);

            // 마커 생성
            const markerPosition = new kakao.maps.LatLng(lat, lng);
            const marker = new kakao.maps.Marker({
                position: markerPosition
            });

            // 마커를 지도에 표시
            marker.setMap(this.currentMap);
            
            // 인포윈도우 생성 (위치명이 있는 경우)
            if (locationName) {
                const infowindow = new kakao.maps.InfoWindow({
                    content: `
                        <div style="padding: 10px; text-align: center; min-width: 150px;">
                            <strong>${locationName}</strong><br>
                            <small style="color: #666;">${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
                        </div>
                    `
                });
                
                // 인포윈도우를 지도에 표시
                infowindow.open(this.currentMap, marker);
            }

            // 타임아웃 해제
            clearTimeout(timeoutId);
            
            // 콜백 실행 (지도가 성공적으로 로드된 후)
            if (callback && typeof callback === 'function') {
                callback();
            }

        } catch (error) {
            console.error('Kakao 지도 생성 오류:', error);
            clearTimeout(timeoutId);
            container.innerHTML = `
                <div class="text-center py-4 bg-light rounded">
                    <i class="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
                    <p class="mb-0 text-muted">지도를 불러올 수 없습니다</p>
                    <small class="text-muted">좌표: ${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
                    <br><small class="text-muted">오류: ${error.message}</small>
                </div>
            `;
        }
    }

    /**
     * 지도 정리
     */
    cleanup() {
        if (this.currentMap) {
            // Kakao Maps는 remove() 메서드가 없으므로 null로 설정
            this.currentMap = null;
        }
    }

    /**
     * 디버깅용 상태 확인
     */
    getDebugInfo() {
        return {
            scriptLoaded: this.scriptLoaded,
            scriptLoading: this.scriptLoading,
            currentMap: !!this.currentMap,
            kakaoDefined: typeof kakao !== 'undefined',
            kakaoMapsDefined: typeof kakao !== 'undefined' && !!kakao.maps,
            apiKeyStatus: API_KEY_STATUS,
            apiKey: KAKAO_MAP_API_KEY ? `${KAKAO_MAP_API_KEY.substring(0, 8)}...` : 'undefined'
        };
    }

    /**
     * 테스트용 지도 표시
     */
    async testMap(containerId = 'test-map') {
        console.log('🧪 테스트 지도 표시 시작');
        
        // 테스트 컨테이너 생성
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.style.width = '300px';
            container.style.height = '300px';
            container.style.border = '1px solid #ccc';
            document.body.appendChild(container);
        }
        
        // 디버그 정보 출력
        console.log('🔍 디버그 정보:', this.getDebugInfo());
        
        // 테스트 좌표 (서울시청)
        const testCoords = { lat: 37.5665, lng: 126.9780 };
        
        try {
            await this.showMap(containerId, testCoords, '서울시청 (테스트)');
            console.log('✅ 테스트 지도 표시 완료');
        } catch (error) {
            console.error('❌ 테스트 지도 표시 실패:', error);
        }
    }
}

// 전역 인스턴스 생성
const mapManager = new SimpleMapManager();
