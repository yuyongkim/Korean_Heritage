/**
 * 간단한 지도 관리 모듈
 * Leaflet을 사용한 위치 정보 표시 (최적화)
 */

class SimpleMapManager {
    constructor() {
        this.currentMap = null;
        this.defaultCenter = [36.5, 127.5]; // 한국 중심
        this.defaultZoom = 7;
        this.loadingTimeout = 5000; // 5초 타임아웃
    }

    /**
     * 지도 표시 (간단하고 안정적인 방법)
     */
    showMap(containerId, coords, locationName = '') {
        console.log('🗺️ 지도 표시 시작:', containerId, coords, locationName);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('지도 컨테이너를 찾을 수 없음:', containerId);
            return;
        }

        // 기존 지도 정리
        if (this.currentMap) {
            this.currentMap.remove();
            this.currentMap = null;
        }

        // 좌표가 없으면 기본 메시지
        if (!coords || !coords.lat || !coords.lng) {
            container.innerHTML = `
                <div class="text-center py-4 bg-light rounded">
                    <i class="fas fa-map-marked-alt fa-2x text-muted mb-2"></i>
                    <p class="mb-0 text-muted">위치 정보가 없습니다</p>
                </div>
            `;
            return;
        }

        // 지도 컨테이너 설정
        container.innerHTML = '<div id="loading-map" class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> 지도 로딩 중...</div>';
        container.style.height = '200px';
        container.style.width = '100%';

        // 좌표 유효성 검사
        const lat = parseFloat(coords.lat);
        const lng = parseFloat(coords.lng);
        
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn('잘못된 좌표:', lat, lng);
            container.innerHTML = `
                <div class="text-center py-4 bg-light rounded">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
                    <p class="mb-0 text-muted">잘못된 좌표 정보입니다</p>
                </div>
            `;
            return;
        }

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
            // 지연 로딩으로 지도 생성
            setTimeout(() => {
                try {
                    // 로딩 메시지 제거
                    container.innerHTML = '';
                    
                    // 지도 생성
                    this.currentMap = L.map(containerId, {
                        center: [lat, lng],
                        zoom: 15,
                        zoomControl: true,
                        attributionControl: true,
                        scrollWheelZoom: false, // 스크롤 줌 비활성화로 성능 향상
                        doubleClickZoom: true,
                        dragging: true
                    });

                    // 타일 레이어 추가
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap',
                        maxZoom: 18,
                        minZoom: 10,
                        tileSize: 256
                    }).addTo(this.currentMap);

                    // 마커 추가
                    const marker = L.marker([lat, lng]).addTo(this.currentMap);
                    
                    if (locationName) {
                        marker.bindPopup(`
                            <div class="text-center">
                                <strong>${locationName}</strong><br>
                                <small class="text-muted">${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
                            </div>
                        `);
                    }

                    // 타임아웃 해제
                    clearTimeout(timeoutId);
                    
                    console.log('✅ 지도 로딩 성공');

                } catch (error) {
                    console.error('지도 생성 오류:', error);
                    clearTimeout(timeoutId);
                    container.innerHTML = `
                        <div class="text-center py-4 bg-light rounded">
                            <i class="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
                            <p class="mb-0 text-muted">지도를 불러올 수 없습니다</p>
                            <small class="text-muted">좌표: ${lat.toFixed(6)}, ${lng.toFixed(6)}</small>
                        </div>
                    `;
                }
            }, 100); // 100ms 지연

        } catch (error) {
            console.error('지도 초기화 오류:', error);
            clearTimeout(timeoutId);
            container.innerHTML = `
                <div class="text-center py-4 bg-light rounded">
                    <i class="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
                    <p class="mb-0 text-muted">지도 초기화 실패</p>
                </div>
            `;
        }
    }

    /**
     * 지도 정리
     */
    cleanup() {
        if (this.currentMap) {
            this.currentMap.remove();
            this.currentMap = null;
        }
    }
}

// 전역 인스턴스 생성
const mapManager = new SimpleMapManager();
