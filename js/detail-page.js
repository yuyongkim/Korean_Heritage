/**
 * 상세페이지 관련 기능을 담당하는 클래스
 */
class DetailPage {
    constructor() {
        this.currentItem = null;
    }

    /**
     * 문화재 상세 정보 로드
     */
    async loadHeritageDetail(name) {
        // 데이터 매니저가 준비될 때까지 기다리기
        await dataManager.waitForData();
        
        const item = dataManager.getByName(name);
        if (!item) {
            console.error('문화재를 찾을 수 없습니다:', name);
            // 홈으로 리다이렉트하지 않고 에러 페이지 표시
            this.showHeritageNotFound(name);
            return;
        }
        
        this.currentItem = item;
        this.renderHeritageDetail(item);
    }

    /**
     * 상세 뷰 로드 (라우터에서 호출)
     */
    async loadDetailView(itemId) {
        console.log('🔍 상세뷰 로드 요청:', itemId);
        console.log('🔍 데이터 매니저 상태:', dataManager);
        console.log('🔍 데이터 매니저 데이터 길이:', dataManager.heritageData?.length);
        
        try {
            // 데이터 매니저가 준비될 때까지 기다리기
            await dataManager.waitForData();
            console.log('✅ 데이터 매니저 준비 완료');
            
            // 다양한 방식으로 아이템 찾기
            let item = null;
            
            // 1. composite_key로 찾기 시도
            item = dataManager.heritageData.find(data => 
                data.composite_key === itemId
            );
            console.log('🔍 composite_key로 찾기 결과:', item ? item.name : '없음');
            
            // 2. name으로 찾기 시도
            if (!item) {
                item = dataManager.heritageData.find(data => 
                    data.name === itemId
                );
                console.log('🔍 name으로 찾기 결과:', item ? item.name : '없음');
            }
            
            // 3. URL 디코딩된 이름으로 찾기 시도
            if (!item) {
                try {
                    const decodedId = decodeURIComponent(itemId);
                    item = dataManager.heritageData.find(data => 
                        data.name === decodedId
                    );
                    console.log('🔍 디코딩된 이름으로 찾기 결과:', item ? item.name : '없음');
                } catch (e) {
                    console.log('URL 디코딩 실패:', e);
                }
            }
            
            // 4. 부분 일치로 찾기 시도
            if (!item) {
                item = dataManager.heritageData.find(data => 
                    data.name && data.name.includes(itemId)
                );
                console.log('🔍 부분 일치로 찾기 결과:', item ? item.name : '없음');
            }
            
            // 5. 대소문자 구분 없이 찾기 시도
            if (!item) {
                item = dataManager.heritageData.find(data => 
                    data.name && data.name.toLowerCase().includes(itemId.toLowerCase())
                );
                console.log('🔍 대소문자 구분 없이 찾기 결과:', item ? item.name : '없음');
            }
            
            if (!item) {
                console.error('❌ 문화재를 찾을 수 없습니다:', itemId);
                console.log('🔍 전체 데이터에서 비슷한 이름 검색...');
                const similarItems = dataManager.heritageData.filter(data => 
                    data.name && data.name.includes(itemId.substring(0, 5))
                );
                console.log('🔍 비슷한 항목들:', similarItems.slice(0, 5).map(item => item.name));
                this.showHeritageNotFound(itemId);
                return;
            }
            
            console.log('✅ 문화재 발견:', item.name);
            console.log('🔍 발견된 문화재 정보:', {
                name: item.name,
                category: item.kdcd_name,
                location: item.ctcd_name
            });
            this.currentItem = item;
            this.renderHeritageDetail(item);
        } catch (error) {
            console.error('❌ 상세뷰 로드 실패:', error);
            this.showErrorMessage('문화재 정보를 불러오는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 문화재를 찾을 수 없을 때 표시할 페이지
     */
    showHeritageNotFound(name) {
        const detailView = document.getElementById('detail-view');
        if (!detailView) return;
        
        // 상세 뷰 표시
        router.showView('detail-view');
        
        // 에러 메시지 표시
        const mainContent = detailView.querySelector('.col-lg-8');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="heritage-not-found text-center py-5">
                    <div class="container">
                        <i class="fas fa-search fa-3x text-muted mb-4"></i>
                        <h2 class="mb-3">문화재를 찾을 수 없습니다</h2>
                        <p class="text-muted mb-4">
                            요청하신 문화재 "<strong>${name}</strong>"를 찾을 수 없습니다.<br>
                            문화재 이름이 변경되었거나 삭제되었을 수 있습니다.
                        </p>
                        <div class="d-flex gap-3 justify-content-center">
                            <button class="btn btn-primary" onclick="router.navigate('list')">
                                <i class="fas fa-list me-2"></i>전체 목록 보기
                            </button>
                            <button class="btn btn-outline-primary" onclick="router.navigate('home')">
                                <i class="fas fa-home me-2"></i>홈으로 이동
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 문화재 상세 정보 렌더링
     */
    renderHeritageDetail(item) {
        // 헤더 영역 추가 (제목과 카테고리)
        const mainContent = document.querySelector('#detail-view .col-lg-8');
        if (mainContent) {
            // 기존 헤더가 있으면 제거
            const existingHeader = mainContent.querySelector('.heritage-detail-header');
            if (existingHeader) {
                existingHeader.remove();
            }

            // 새 헤더 추가
            const headerHTML = `
                <div class="heritage-detail-header mb-4">
                    <div class="container-fluid">
                        <div class="row align-items-center">
                            <div class="col">
                                <h1 class="heritage-title">${item.name}</h1>
                                <div class="heritage-subtitle">
                                    <span class="heritage-badge me-2">${item.kdcd_name || item.category}</span>
                                    ${item.ctcd_name ? `<span class="heritage-location me-2">${item.ctcd_name}</span>` : ''}
                                    ${item.composite_key ? `<span class="heritage-designation">${item.composite_key}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            mainContent.insertAdjacentHTML('afterbegin', headerHTML);
        }

        // 이미지 영역
        const imageContainer = document.getElementById('heritage-image');
        if (imageContainer) {
            // Handle both raw data format (imageUrl) and transformed format (image_url)
            const imageUrl = item.imageUrl || item.image_url || '';
            if (imageUrl && imageUrl.trim() !== '') {
                imageContainer.innerHTML = `
                    <div class="heritage-image-wrapper">
                        <img src="${imageCacheManager.getCachedImageUrl(imageUrl)}" alt="${item.name}" class="heritage-main-image" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="heritage-image-placeholder d-none" style="min-height: 400px;">
                            <div class="text-center text-muted">
                                <i class="fas fa-image fa-3x mb-3" style="color: var(--primary);"></i>
                                <h5>이미지 로드 실패</h5>
                                <small>이미지를 불러올 수 없습니다</small>
                            </div>
                        </div>
                        <div class="heritage-image-overlay">
                            <button class="btn btn-light btn-sm" onclick="openImageModal('${imageUrl}', '${item.name}')">
                                <i class="fas fa-expand"></i> 확대보기
                            </button>
                        </div>
                    </div>
                `;
            } else {
                imageContainer.innerHTML = `
                    <div class="heritage-image-placeholder d-flex align-items-center justify-content-center" style="min-height: 400px;">
                        <div class="text-center text-muted">
                            <i class="fas fa-landmark fa-3x mb-3" style="color: var(--primary);"></i>
                            <h5>문화재 이미지</h5>
                            <small>이미지 정보가 없습니다</small>
                            <div class="mt-3">
                                <button class="btn btn-outline-primary btn-sm" onclick="requestImageUpload('${item.name}')">
                                    <i class="fas fa-upload"></i> 이미지 업로드
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        // 설명 영역
        const descContainer = document.getElementById('heritage-description');
        if (descContainer) {
            this.updateHeritageDescription(item);
        }
        
        // 기본 정보 - 전통 스타일로 개선
        const infoContainer = document.getElementById('heritage-info');
        if (infoContainer) {
            infoContainer.innerHTML = `
                <div class="heritage-meta-item d-flex">
                    <div class="heritage-meta-label"><i class="fas fa-tag me-2"></i>분류</div>
                    <div class="heritage-meta-value">
                        <span class="badge category-badge category-${item.kdcd_name}">${item.kdcd_name}</span>
                    </div>
                </div>
                ${item.composite_key ? `
                <div class="heritage-meta-item d-flex">
                    <div class="heritage-meta-label"><i class="fas fa-certificate me-2"></i>식별번호</div>
                    <div class="heritage-meta-value">${item.composite_key}</div>
                </div>
                ` : ''}
                ${item.key_asno ? `
                <div class="heritage-meta-item d-flex">
                    <div class="heritage-meta-label"><i class="fas fa-hashtag me-2"></i>관리번호</div>
                    <div class="heritage-meta-value">${item.key_asno}</div>
                </div>
                ` : ''}
                <div class="heritage-meta-item d-flex">
                    <div class="heritage-meta-label"><i class="fas fa-map-marker-alt me-2"></i>소재지</div>
                    <div class="heritage-meta-value">${item.ctcd_name}</div>
                </div>
                ${item.source_url ? `
                <div class="heritage-meta-item d-flex">
                    <div class="heritage-meta-label"><i class="fas fa-external-link-alt me-2"></i>출처</div>
                    <div class="heritage-meta-value">
                        <a href="${item.source_url}" target="_blank" class="text-primary">
                            문화재청 바로가기 <i class="fas fa-external-link-alt fa-sm"></i>
                        </a>
                    </div>
                </div>
                ` : ''}
            `;
        }
        
        // 위치 정보와 지도 표시
        const locationContainer = document.getElementById('heritage-location');
        if (locationContainer) {
            locationContainer.innerHTML = `
                <p class="mb-2"><i class="fas fa-map-marker-alt text-primary me-2"></i>${item.ctcd_name}</p>
                ${item.longitude && item.latitude ? `
                    <small class="text-muted">위도: ${item.latitude}, 경도: ${item.longitude}</small>
                ` : `
                    <small class="text-muted">좌표 정보 없음</small>
                `}
            `;

            // 지도 표시 - Kakao Maps API 사용
            const mapContainer = document.getElementById('heritage-map');
            if (mapContainer && item.longitude && item.latitude) {
                // Kakao Maps API 사용
                mapManager.showMap('heritage-map', {
                    lat: item.latitude,
                    lng: item.longitude
                }, item.name);
            } else if (mapContainer) {
                mapContainer.innerHTML = `
                    <div class="text-center text-muted p-4">
                        <i class="fas fa-map-marked-alt fa-2x mb-2"></i>
                        <p>위치 정보가 없습니다</p>
                    </div>
                `;
            }
        }
        
        // 관련 링크
        const linksContainer = document.getElementById('heritage-links');
        if (linksContainer) {
            linksContainer.innerHTML = `
                ${item.source_url ? `
                    <a href="${item.source_url}" target="_blank" class="heritage-link d-block mb-2">
                        <i class="fas fa-external-link-alt me-2"></i>문화재청 상세 정보
                    </a>
                ` : ''}
                <a href="#" class="heritage-link d-block mb-2">
                    <i class="fas fa-share me-2"></i>공유하기
                </a>
                <a href="#" class="heritage-link d-block">
                    <i class="fas fa-heart me-2"></i>즐겨찾기
                </a>
            `;
        }
        
        // 상세 페이지 언어 토글 이벤트 재설정
        this.setupDetailLanguageToggle(item);
    }

    /**
     * 문화재 설명 업데이트 (언어별)
     */
    updateHeritageDescription(item) {
        const container = document.getElementById('heritage-description');
        if (!container) return;
        
        const isKorean = dataManager.currentLanguage === 'ko';
        
        const description = isKorean 
            ? item.content 
            : (item.content_en || '영문 설명을 준비 중입니다.');
        
        // 문단 나누기 - 숫자와 단위 분리 방지
        let processedDescription = description
            .replace(/\n/g, '<br>')  // 기존 줄바꿈을 <br>로 변환
            .replace(/(\d+\.?\d*)\s*<br>\s*([a-zA-Z가-힣]+)/g, '$1$2')  // 숫자와 단위 사이 줄바꿈 제거
            .replace(/([가-힣])\s*<br>\s*([가-힣])/g, '$1 $2')  // 한글 단어 사이 줄바꿈을 공백으로
            .replace(/([가-힣]\.)\s*<br>\s*([가-힣])/g, '$1 $2')  // 문장 끝과 다음 문장 시작 사이 줄바꿈 제거
            .replace(/\s+/g, ' ');  // 연속된 공백을 하나로
        
        // 문장 단위로 나누기 (숫자.숫자 패턴 제외)
        const sentences = processedDescription
            .split(/(?<!\d)\.(?!\d)/)  // 숫자가 아닌 점에서만 분리
            .filter(s => s.trim().length > 0);
        
        container.innerHTML = sentences.map(s => `<p>${s.trim()}.</p>`).join('');
    }

    /**
     * 상세 페이지 언어 토글 설정
     */
    setupDetailLanguageToggle(item) {
        const detailLangButtons = document.querySelectorAll('input[name="detail-lang"]');
        detailLangButtons.forEach(button => {
            button.addEventListener('change', (e) => {
                const newLang = e.target.id === 'detail-lang-ko' ? 'ko' : 'en';
                dataManager.currentLanguage = newLang;
                this.updateHeritageDescription(item);
            });
        });
    }

    /**
     * 에러 메시지 표시
     */
    showErrorMessage(message) {
        // 기존 에러 메시지 제거
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // 새 에러 메시지 생성
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message alert alert-danger alert-dismissible fade show';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>오류 발생</strong><br>
            <small>${message}</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (errorDiv && errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// 전역으로 함수 등록
window.loadDetailView = function(itemId) {
    if (window.detailPage) {
        window.detailPage.loadDetailView(itemId);
    }
};

window.viewHeritageDetail = function(name) {
    console.log('🔍 viewHeritageDetail 호출됨:', name);
    console.log('🔍 현재 라우터 상태:', router);
    console.log('🔍 detailPage 객체:', window.detailPage);
    
    try {
        const encodedName = encodeURIComponent(name);
        console.log('🔍 인코딩된 이름:', encodedName);
        router.navigate(`detail/${encodedName}`);
        console.log('✅ 라우터 네비게이션 완료');
    } catch (error) {
        console.error('❌ viewHeritageDetail 오류:', error);
        // 대체 방법으로 상세 페이지 로드 시도
        if (window.detailPage && window.detailPage.loadDetailView) {
            console.log('🔄 대체 방법으로 상세 페이지 로드 시도');
            window.detailPage.loadDetailView(name);
        }
    }
};