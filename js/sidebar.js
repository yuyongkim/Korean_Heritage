/**
 * 사이드바 관리 모듈
 */

class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.overlay = document.getElementById('sidebarOverlay');
        this.toggle = document.getElementById('sidebarToggle');
        this.close = document.getElementById('sidebarClose');
        
        this.setupEventListeners();
        this.updateActiveMenu();
        this.restoreSidebarState();
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 모바일 토글 버튼
        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // 데스크톱 토글 버튼
        const desktopToggle = document.getElementById('sidebarToggleDesktop');
        if (desktopToggle) {
            desktopToggle.addEventListener('click', () => this.toggleSidebarDesktop());
        }
        
        // 사이드바 닫기 버튼
        if (this.close) {
            this.close.addEventListener('click', () => this.closeSidebar());
        }
        
        // 오버레이 클릭 시 사이드바 닫기
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeSidebar());
        }
        
        // 메뉴 링크 클릭 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.matches('.menu-link, .submenu-link') || e.target.closest('.menu-link, .submenu-link')) {
                this.updateActiveMenu(e.target);
                
                // 모바일에서 메뉴 클릭 시 사이드바 닫기
                if (window.innerWidth < 768) {
                    this.closeSidebar();
                }
            }
        });
        
        // 브라우저 리사이즈 이벤트
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                this.closeSidebar();
            }
        });
        
        // 라우터 이벤트 리스너
        window.addEventListener('hashchange', () => {
            this.updateActiveMenu();
        });
    }
    
    /**
     * 사이드바 토글
     */
    toggleSidebar() {
        if (this.sidebar.classList.contains('mobile-open')) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }
    
    /**
     * 사이드바 열기
     */
    openSidebar() {
        this.sidebar.classList.add('mobile-open');
        if (this.overlay) {
            this.overlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * 사이드바 닫기
     */
    closeSidebar() {
        this.sidebar.classList.remove('mobile-open');
        if (this.overlay) {
            this.overlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }
    
    /**
     * 데스크톱 사이드바 토글
     */
    toggleSidebarDesktop() {
        const isHidden = document.body.classList.toggle('sidebar-hidden');
        const toggleBtn = document.getElementById('sidebarToggleDesktop');
        
        if (toggleBtn) {
            toggleBtn.classList.toggle('rotated', isHidden);
        }
        
        // 로컬 스토리지에 상태 저장
        localStorage.setItem('sidebar-hidden', isHidden);
    }
    
    /**
     * 활성 메뉴 업데이트
     */
    updateActiveMenu(clickedElement = null) {
        // 모든 메뉴 링크에서 active 클래스 제거
        document.querySelectorAll('.menu-link, .submenu-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // 현재 라우트 확인
        const currentHash = window.location.hash.slice(1) || 'home';
        const [route, ...params] = currentHash.split('/');
        
        // 해당하는 메뉴 링크에 active 클래스 추가
        let activeLink = null;
        
        if (clickedElement) {
            activeLink = clickedElement.closest('.menu-link, .submenu-link');
        } else {
            // 현재 라우트와 일치하는 링크 찾기
            if (route === 'category' && params[0]) {
                activeLink = document.querySelector(`a[href="#category/${params[0]}"]`);
            } else {
                activeLink = document.querySelector(`a[href="#${route}"]`);
            }
        }
        
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // 사이드바 통계 업데이트
        this.updateSidebarStats();
    }
    
    /**
     * 사이드바 통계 업데이트
     */
    updateSidebarStats() {
        if (typeof dataManager !== 'undefined' && dataManager.isLoaded) {
            const stats = dataManager.getStatistics();
            const totalElement = document.getElementById('sidebar-total');
            
            if (totalElement) {
                totalElement.textContent = stats.total.toLocaleString();
            }
        }
    }
    
    /**
     * 검색 상태 업데이트
     */
    updateSearchHighlight(hasResults) {
        const searchInput = document.querySelector('.sidebar-search .form-control');
        if (searchInput) {
            if (hasResults === false) {
                searchInput.style.borderColor = 'var(--accent)';
            } else {
                searchInput.style.borderColor = '';
            }
        }
    }
    
    /**
     * 사이드바 상태 복원
     */
    restoreSidebarState() {
        const isHidden = localStorage.getItem('sidebar-hidden') === 'true';
        
        if (isHidden) {
            document.body.classList.add('sidebar-hidden');
            const toggleBtn = document.getElementById('sidebarToggleDesktop');
            if (toggleBtn) {
                toggleBtn.classList.add('rotated');
            }
        }
    }
}

// 전역 사이드바 매니저 인스턴스
const sidebarManager = new SidebarManager();

// CSV 업로드 버튼 이벤트 추가  
function setupCSVButton() {
    const csvBtn = document.getElementById('csv-upload-btn');
    if (csvBtn) {
        csvBtn.addEventListener('click', () => {
            console.log('CSV 업로드 버튼 클릭, csvUploader 확인:', typeof csvUploader);
            
            if (typeof csvUploader !== 'undefined' && csvUploader.show) {
                console.log('✅ CSV 업로더 호출');
                csvUploader.show();
            } else {
                console.log('⏳ CSV 업로더 로딩 대기 중...');
                
                // 최대 5초 동안 0.5초마다 재시도
                let attempts = 0;
                const maxAttempts = 10;
                
                const tryAgain = setInterval(() => {
                    attempts++;
                    console.log(`재시도 ${attempts}/${maxAttempts}`);
                    
                    if (typeof csvUploader !== 'undefined' && csvUploader.show) {
                        console.log('✅ CSV 업로더 로드 완료, 모달 열기');
                        clearInterval(tryAgain);
                        csvUploader.show();
                    } else if (attempts >= maxAttempts) {
                        console.error('❌ CSV 업로더 로드 실패');
                        clearInterval(tryAgain);
                        alert('CSV 업로더 로딩에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
                    }
                }, 500);
            }
        });
        console.log('✅ CSV 버튼 이벤트 리스너 설정 완료');
    } else {
        console.error('❌ csv-upload-btn 요소를 찾을 수 없음');
    }
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', setupCSVButton);

// 혹시 DOMContentLoaded가 이미 지나갔을 경우를 대비
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCSVButton);
} else {
    setupCSVButton();
}