# 카카오 지도 API 연동 가이드

## 개요
이 프로젝트에서 카카오 지도 API를 안전하고 효율적으로 연동하는 방법을 설명합니다.

## 현재 구현 상태
- ✅ 카카오 지도 API 스크립트 동적 로드
- ✅ 지도 표시 및 마커 기능
- ✅ API 키 보안 관리
- ✅ 환경별 설정 분리
- ✅ API 키 유효성 검증

## 1. API 키 보안 관리

### 1.1 환경변수 사용 (권장)
```bash
# .env 파일 생성
KAKAO_MAP_API_KEY=your_actual_api_key_here
NODE_ENV=production
```

### 1.2 서버 사이드에서 API 키 주입
```javascript
// 서버에서 HTML에 API 키 주입
<script>
    window.KAKAO_MAP_API_KEY = '${process.env.KAKAO_MAP_API_KEY}';
</script>
```

### 1.3 개발 환경에서 로컬 스토리지 사용
```javascript
// 개발자 도구 콘솔에서 실행
localStorage.setItem('KAKAO_MAP_API_KEY', 'your_api_key_here');
```

## 2. 카카오 지도 API 연동 방법

### 2.1 기본 사용법
```javascript
// 지도 표시
mapManager.showMap('map-container', {
    lat: 37.5665,
    lng: 126.9780
}, '서울시청');
```

### 2.2 고급 기능
```javascript
// 마커와 인포윈도우가 포함된 지도
mapManager.showMap('map-container', {
    lat: 37.5665,
    lng: 126.9780
}, '서울시청', () => {
    console.log('지도 로딩 완료');
});
```

## 3. 보안 모범 사례

### 3.1 API 키 보호
- ✅ 소스 코드에 API 키 하드코딩 금지
- ✅ 환경변수 사용
- ✅ API 키 형식 검증
- ✅ 개발/프로덕션 환경 분리

### 3.2 도메인 제한
카카오 개발자 콘솔에서 API 키에 도메인 제한을 설정하세요:
```
https://your-domain.com/*
https://staging.your-domain.com/*
```

### 3.3 API 사용량 모니터링
- 카카오 개발자 콘솔에서 API 사용량 확인
- 일일/월간 사용량 제한 설정
- 비정상적인 사용량 알림 설정

## 4. 환경별 설정

### 4.1 개발 환경
```javascript
// js/config.js
const KAKAO_MAP_API_KEY = 'development_api_key';
const DEBUG_MODE = true;
```

### 4.2 프로덕션 환경
```javascript
// js/config-env.js
const KAKAO_MAP_API_KEY = process.env.KAKAO_MAP_API_KEY;
const DEBUG_MODE = false;
```

## 5. 오류 처리

### 5.1 API 키 오류
```javascript
// API 키가 유효하지 않은 경우
if (!API_KEY_STATUS.isValid) {
    console.error('카카오 지도 API 키를 확인해주세요.');
    // 대체 UI 표시
}
```

### 5.2 네트워크 오류
```javascript
// 지도 로딩 실패 시 대체 처리
mapManager.showMap('map-container', coords, locationName)
    .catch(error => {
        console.error('지도 로딩 실패:', error);
        // 정적 지도 이미지 또는 오류 메시지 표시
    });
```

## 6. 성능 최적화

### 6.1 지도 스크립트 지연 로드
```javascript
// 필요할 때만 지도 스크립트 로드
if (document.getElementById('map-container')) {
    mapManager.loadMapScript();
}
```

### 6.2 지도 인스턴스 재사용
```javascript
// 기존 지도가 있으면 재사용
if (this.currentMap) {
    this.currentMap.setCenter(new kakao.maps.LatLng(lat, lng));
    return;
}
```

## 7. 트러블슈팅

### 7.1 일반적인 문제들
1. **API 키 오류**: 카카오 개발자 콘솔에서 키 확인
2. **도메인 오류**: 허용된 도메인에 등록되어 있는지 확인
3. **HTTPS 오류**: 프로덕션에서는 HTTPS 필수

### 7.2 디버깅
```javascript
// 디버그 모드 활성화
const DEBUG_MODE = true;

// 콘솔에서 API 키 상태 확인
console.log('API Key Status:', API_KEY_STATUS);
```

## 8. 추가 기능 구현

### 8.1 여러 마커 표시
```javascript
// 여러 위치에 마커 표시
const locations = [
    { lat: 37.5665, lng: 126.9780, name: '서울시청' },
    { lat: 37.5511, lng: 126.9882, name: '남산타워' }
];

locations.forEach(location => {
    const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(location.lat, location.lng),
        map: this.currentMap
    });
});
```

### 8.2 지도 스타일 커스터마이징
```javascript
// 지도 스타일 설정
const mapStyle = new kakao.maps.StyledMapType([
    // 스타일 정의
]);

this.currentMap.addOverlayMapType(mapStyle, kakao.maps.MapTypeId.STANDARD);
```

## 9. 보안 체크리스트

- [ ] API 키가 소스 코드에 하드코딩되지 않음
- [ ] 환경변수 또는 서버에서 API 키 주입
- [ ] 카카오 개발자 콘솔에서 도메인 제한 설정
- [ ] API 사용량 모니터링 설정
- [ ] HTTPS 환경에서 테스트
- [ ] 프로덕션 환경에서 디버그 모드 비활성화

## 10. 참고 자료

- [카카오 지도 API 문서](https://apis.map.kakao.com/)
- [카카오 개발자 콘솔](https://developers.kakao.com/)
- [카카오 지도 JavaScript API 가이드](https://apis.map.kakao.com/web/guide/)