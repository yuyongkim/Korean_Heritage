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
    }

    /**
     * 지도 표시 (Kakao Maps API 사용)
     */
    showMap(containerId, coords, locationName = '', callback = null) {
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
        if (!coords || !coords.lat || !coords.lng) {
            container.innerHTML = `
                <div class="text-center py-4 bg-light rounded">
                    <i class="fas fa-map-marked-alt fa-2x text-muted mb-2"></i>
                    <p class="mb-0 text-muted">위치 정보가 없습니다</p>
                </div>
            `;
            return;
        }

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

        // Kakao Maps API 로드 확인
        if (typeof kakao === 'undefined' || !kakao.maps) {
            console.error('Kakao Maps API가 로드되지 않음');
            container.innerHTML = `
                <div class="text-center py-4 bg-light rounded">
                    <i class="fas fa-exclamation-circle fa-2x text-danger mb-2"></i>
                    <p class="mb-0 text-muted">지도 API 로드 실패</p>
                    <small class="text-muted">Kakao Maps API를 확인해주세요</small>
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
            // 지연 로딩으로 지도 생성
            setTimeout(() => {
                try {
                    // 로딩 메시지 제거
                    container.innerHTML = '';
                    
                    // Kakao Maps 지도 생성
                    const mapContainer = document.getElementById(containerId);
                    const mapOption = {
                        center: new kakao.maps.LatLng(lat, lng), // 지도의 중심좌표
                        level: 3 // 지도의 확대 레벨
                    };

                    // 지도 생성
                    this.currentMap = new kakao.maps.Map(mapContainer, mapOption);
                    
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
                        kakao.maps.event.trigger(this.currentMap, 'resize');
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
                    
                    console.log('✅ Kakao 지도 로딩 성공');
                    
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
            // Kakao Maps는 remove() 메서드가 없으므로 null로 설정
            this.currentMap = null;
        }
    }
}

// 전역 인스턴스 생성
const mapManager = new SimpleMapManager();
