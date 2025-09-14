/**
 * 지도 관리 모듈
 * Leaflet을 사용한 위치 정보 표시
 */

class MapManager {
    constructor() {
        this.currentMap = null;
        this.defaultCenter = [36.5, 127.5]; // 한국 중심
        this.defaultZoom = 7;
    }

    /**
     * 지도 초기화 및 표시
     */
    showMap(containerId, coords, locationName = '') {
        try {
            console.log('지도 표시 시작:', containerId, coords, locationName);
            
            // 기존 지도가 있으면 제거
            if (this.currentMap) {
                this.currentMap.remove();
                this.currentMap = null;
            }

            const container = document.getElementById(containerId);
            if (!container) {
                console.warn('지도 컨테이너를 찾을 수 없음:', containerId);
                return;
            }

            // 좌표가 없으면 기본 메시지 표시
            if (!coords || !coords.lat || !coords.lng) {
                console.log('좌표 정보 없음, 기본 메시지 표시');
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-map-marked-alt fa-2x text-muted mb-2"></i>
                        <p class="mb-0 text-muted">위치 정보가 없습니다</p>
                    </div>
                `;
                return;
            }

            // 지도 컨테이너 설정
            container.innerHTML = '';
            container.style.height = '200px';
            container.style.width = '100%';

            // 좌표 유효성 검사
            const lat = parseFloat(coords.lat);
            const lng = parseFloat(coords.lng);

            if (isNaN(lat) || isNaN(lng)) {
                console.log('좌표 파싱 실패:', coords);
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-exclamation-triangle fa-2x text-warning mb-2"></i>
                        <p class="mb-0 text-muted">올바르지 않은 좌표 정보</p>
                        <small class="text-muted">위도: ${coords.lat}, 경도: ${coords.lng}</small>
                    </div>
                `;
                return;
            }

            console.log('지도 표시:', locationName, `(${lat}, ${lng})`);

            // Leaflet이 로드되었는지 확인
            if (typeof L === 'undefined') {
                console.error('Leaflet 라이브러리가 로드되지 않음');
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-exclamation-circle fa-2x text-danger mb-2"></i>
                        <p class="mb-0 text-muted">지도 라이브러리 로드 실패</p>
                        <small class="text-muted">Leaflet 라이브러리를 확인해주세요</small>
                    </div>
                `;
                return;
            }

            // Leaflet 지도 생성 (최적화된 설정)
            // 지도 생성 (타임아웃 추가)
            setTimeout(() => {
                try {
                    this.currentMap = L.map(containerId, {
                        zoomControl: true,
                        attributionControl: true,
                        preferCanvas: false,
                        // 성능 최적화 옵션
                        zoomAnimation: true,
                        fadeAnimation: true,
                        markerZoomAnimation: true,
                                // 렌더링 최적화
                        renderer: L.canvas(),
                        // 휠 줌 최적화
                        wheelPxPerZoomLevel: 120
                    }).setView([lat, lng], 15);

                    // OpenStreetMap 타일 레이어 추가 (최적화된 설정)
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
                        maxZoom: 18,
                        minZoom: 1,
                        subdomains: ['a', 'b', 'c'],
                        // 성능 최적화 옵션
                        keepBuffer: 2,
                        updateWhenIdle: false,
                updateWhenZooming: false,
                // 타일 로딩 최적화
                tileSize: 256,
                zoomOffset: 0
            }).addTo(this.currentMap);

            // 한국 전통 색상으로 마커 스타일 커스터마이징
            const customIcon = L.divIcon({
                html: `
                    <div style="
                        background: #2E4A62;
                        width: 24px;
                        height: 24px;
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(46,74,98,0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <i class="fas fa-landmark" style="
                            color: white;
                            font-size: 10px;
                            transform: rotate(45deg);
                        "></i>
                    </div>
                `,
                className: 'custom-heritage-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 24],
                popupAnchor: [0, -24]
            });

            // 마커 추가
            const marker = L.marker([lat, lng], { icon: customIcon })
                .addTo(this.currentMap);

            // 팝업 추가
            if (locationName) {
                marker.bindPopup(`
                    <div class="text-center">
                        <strong>${locationName}</strong><br>
                        <small class="text-muted">위도: ${lat.toFixed(6)}<br>경도: ${lng.toFixed(6)}</small>
                    </div>
                `);
            }

            // 지도 크기 조정 (컨테이너 크기 변경 후) - 최적화
            setTimeout(() => {
                if (this.currentMap) {
                    this.currentMap.invalidateSize();
                    console.log('지도 크기 조정 완료');
                }
            }, 100); // 200ms → 100ms로 단축

            console.log('지도 표시 완료');

        } catch (error) {
            console.error('지도 표시 오류:', error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-exclamation-circle fa-2x text-danger mb-2"></i>
                        <p class="mb-0 text-muted">지도 로드 실패</p>
                        <small class="text-muted">${error.message}</small>
                    </div>
                `;
            }
        }
    }

    /**
     * 전체 문화재 지도 표시 (통합 지도)
     */
    showHeritageMap(containerId, heritageItems) {
        try {
            const container = document.getElementById(containerId);
            if (!container) return;

            // 좌표가 있는 문화재만 필터링
            const validItems = heritageItems.filter(item => 
                item.coords && item.coords.lat && item.coords.lng
            );

            if (validItems.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-map fa-2x text-muted mb-2"></i>
                        <p class="mb-0 text-muted">표시할 위치 정보가 없습니다</p>
                    </div>
                `;
                return;
            }

            // 기존 지도 제거
            if (this.currentMap) {
                this.currentMap.remove();
            }

            container.innerHTML = '';
            container.style.height = '400px';

            // 지도 생성
            this.currentMap = L.map(containerId).setView(this.defaultCenter, this.defaultZoom);

            // 타일 레이어 추가 (최적화된 설정)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
                        minZoom: 1,
                        subdomains: ['a', 'b', 'c'],
                        // 성능 최적화 옵션
                        keepBuffer: 2,
                        updateWhenIdle: false,
                updateWhenZooming: false,
                tileSize: 256,
                zoomOffset: 0
            }).addTo(this.currentMap);

            // 카테고리별 색상 정의
            const categoryColors = {
                '국보': '#C73E1D',
                '보물': '#8B4513', 
                '사적': '#2E4A62',
                '명승': '#228B22',
                '천연기념물': '#32CD32',
                '국가무형문화재': '#9370DB'
            };

            // 마커 그룹 생성
            const markerGroup = L.featureGroup();

            validItems.forEach((item, index) => {
                const lat = parseFloat(item.coords.lat);
                const lng = parseFloat(item.coords.lng);

                if (isNaN(lat) || isNaN(lng)) return;

                const color = categoryColors[item.category] || '#666666';
                
                // 카테고리별 커스텀 마커
                const customIcon = L.divIcon({
                    html: `
                        <div style="
                            background: ${color};
                            width: 20px;
                            height: 20px;
                            border-radius: 50%;
                            border: 2px solid white;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 8px;
                            color: white;
                            font-weight: bold;
                        ">${index + 1}</div>
                    `,
                    className: 'custom-category-marker',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                const marker = L.marker([lat, lng], { icon: customIcon });
                
                // 팝업 내용
                marker.bindPopup(`
                    <div style="min-width: 200px;">
                        <h6>${item.name}</h6>
                        <p class="mb-1">
                            <span class="badge" style="background: ${color};">${item.category}</span>
                        </p>
                        <p class="mb-1"><small><i class="fas fa-map-marker-alt"></i> ${item.location}</small></p>
                        <button class="btn btn-primary btn-sm" onclick="viewHeritageDetail('${item.name}')">
                            상세보기
                        </button>
                    </div>
                `);

                markerGroup.addLayer(marker);
            });

            // 마커 그룹을 지도에 추가
            this.currentMap.addLayer(markerGroup);

            // 모든 마커가 보이도록 지도 범위 조정
            if (validItems.length > 1) {
                this.currentMap.fitBounds(markerGroup.getBounds(), { padding: [20, 20] });
            } else {
                // 마커가 하나면 적당한 줌 레벨로 설정
                this.currentMap.setView([validItems[0].coords.lat, validItems[0].coords.lng], 12);
            }

            console.log('통합 지도 표시 완료:', validItems.length, '개 위치');

        } catch (error) {
            console.error('통합 지도 오류:', error);
        }
    }

    /**
     * 지도 제거
     */
    destroyMap() {
        if (this.currentMap) {
            this.currentMap.remove();
            this.currentMap = null;
        }
    }

    /**
     * 좌표 문자열 파싱
     */
    parseCoordinates(coordsStr) {
        if (!coordsStr) return null;

        try {
            if (typeof coordsStr === 'object' && coordsStr.lat && coordsStr.lng) {
                return coordsStr;
            }

            const coords = coordsStr.toString().split(',');
            if (coords.length >= 2) {
                return {
                    lat: parseFloat(coords[0].trim()),
                    lng: parseFloat(coords[1].trim())
                };
            }
        } catch (error) {
            console.warn('좌표 파싱 실패:', coordsStr, error);
        }

        return null;
    }
}

// 전역 인스턴스 생성
const mapManager = new MapManager();