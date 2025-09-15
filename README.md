# 한국 문화유산 위키 시스템 (Korean Cultural Heritage Wiki System)

한국의 문화재 정보를 체계적으로 관리하고 다국어로 제공하는 웹 기반 디지털 아카이브 시스템입니다.

## 🌐 접속 주소

### 로컬 개발 환경
```bash
# 로컬 서버 실행
python -m http.server 8080 --bind 0.0.0.0

# 브라우저에서 접속
http://localhost:8080
```

### 배포 환경
- **GitHub Pages**: `https://USERNAME.github.io/korean-heritage-wiki`
- **Netlify**: `https://your-site-name.netlify.app`
- **Vercel**: `https://your-project.vercel.app`
- **Firebase Hosting**: `https://your-project.web.app`

### 직접 파일 접속
- **메인 페이지**: `index.html` (자동으로 `main.html`로 리다이렉트)
- **애플리케이션**: `main.html`

## 🌟 주요 기능

### 📊 대시보드 및 통계
- 실시간 문화재 통계 현황
- 6가지 카테고리별 분류 표시
- 지역별 분포 현황
- AI 번역 품질 지표 (COMET 점수)

### 🌍 다국어 지원
- **완전한 언어 토글**: 한국어 ↔ 영어 실시간 전환
- 모든 UI 요소 다국어화 (메뉴, 버튼, 라벨, 메시지)
- 문화재 설명의 이중 언어 제공

### 📚 카테고리 분류 시스템
- **국보** (National Treasure): 최고 등급 문화재
- **보물** (Treasure): 국가지정문화재  
- **사적** (Historic Site): 역사적 장소와 유적
- **명승** (Scenic Site): 아름다운 경치의 명소
- **천연기념물** (Natural Monument): 자연 유산과 생물
- **국가무형문화재** (Intangible Cultural Heritage): 전통 기능과 예술

### 🔍 검색 및 필터링
- **전역 검색**: 문화재명, 설명으로 검색
- **카테고리별 필터링**: 각 카테고리 개별 탐색
- **지역별 필터링**: 지역 단위 문화재 검색
- **실시간 검색**: 타이핑 시 즉시 결과 표시

### 📱 반응형 뷰 모드
- **그리드 뷰**: 카드 형태 이미지 중심 표시
- **리스트 뷰**: 테이블 형태 정보 중심 표시
- **페이지네이션**: 대용량 데이터 효율적 표시 (20개/페이지)
- **모바일 최적화**: 반응형 디자인

### 📄 CSV 데이터 관리
- **일괄 업로드**: CSV 파일을 통한 대량 데이터 입력
- **실시간 처리**: 진행률 표시와 오류 검증
- **데이터 검증**: 필수 필드 및 형식 검사
- **로컬 저장**: 브라우저 로컬 스토리지 활용
- **번역 데이터 업로드**: 영어 번역 완료된 CSV 파일 업로드 지원

## 📝 번역 완료된 CSV 업로드 방법

### 1. 번역 완료된 CSV 파일 준비
번역이 완료된 CSV 파일은 다음 형식을 따라야 합니다:

```csv
name,key_asno,key_kdcd,key_ctcd,longitude,latitude,collected_at,composite_key,kdcd_name,ctcd_name,content,imageUrl,content_length,has_image,detail_collected_at,api_success,api_error,english_description
서울 숭례문,10000000,11,11,126.975312652739,37.559975221378,2025-09-13T06:35:01.196603,11-11-10000000,국보,서울특별시,"조선시대 한양도성의 정문...","https://example.com/image.jpg",1500,true,2025-09-13T06:35:01.196603,true,,Sungnyemun Gate, the main gate of Hanyangdoseong Fortress...
```

**중요한 필드:**
- `name`: 문화재명 (한국어)
- `content`: 한국어 설명
- `english_description`: **새로 추가된 영어 번역 필드**
- 기타 모든 기존 필드 유지

### 2. CSV 파일 업로드 방법

#### 방법 1: 웹 인터페이스 사용 (권장)
1. 웹사이트 접속 후 우상단 "CSV 업로드" 버튼 클릭
2. 번역 완료된 CSV 파일 선택
3. 업로드 진행률 확인
4. 완료 후 자동으로 영어 설명이 적용됨

#### 방법 2: 로컬 서버 사용
```bash
# 1. 번역 완료된 CSV 파일을 data 폴더에 복사
cp translated_heritage_data.csv ./data/heritage_master.csv

# 2. 서버 재시작
python -m http.server 8080 --bind 0.0.0.0

# 3. 브라우저에서 새로고침 (Ctrl+F5)
```

### 3. 번역 데이터 확인
- 상세 페이지에서 언어 토글 버튼으로 한국어/영어 전환 확인
- 영어 설명이 제대로 표시되는지 확인
- 번역 품질 및 완성도 검증

### 4. 백업 및 버전 관리
```bash
# 번역 완료된 CSV 백업
cp heritage_master.csv heritage_master_translated_$(date +%Y%m%d).csv

# Git에 커밋 (선택사항)
git add heritage_master.csv
git commit -m "Add English translations for cultural heritage data"
git push origin main
```

## 🚀 배포 및 관리 방법

### 1. GitHub을 통한 배포 (권장)

#### GitHub Pages 배포
```bash
# 1. GitHub 저장소 생성
# 2. 프로젝트 파일 업로드
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/korean-heritage-wiki.git
git push -u origin main

# 3. GitHub Pages 활성화
# Settings > Pages > Source: Deploy from a branch > main
```

**배포 URL**: `https://USERNAME.github.io/korean-heritage-wiki`

#### GitHub 파일 관리
- **코드 수정**: GitHub 웹 에디터 또는 로컬 편집 후 push
- **CSV 업로드**: 사이트에서 직접 CSV 업로드 (로컬 저장)
- **버전 관리**: Git을 통한 모든 변경사항 추적
- **협업**: Pull Request를 통한 협업 가능

### 2. 다른 호스팅 서비스

#### Netlify 배포
1. [Netlify](https://netlify.com) 가입
2. "New site from Git" → GitHub 연결
3. 자동 빌드 및 배포 설정
4. 커스텀 도메인 설정 가능

#### Vercel 배포
1. [Vercel](https://vercel.com) 가입  
2. GitHub 저장소 import
3. 자동 배포 및 미리보기 기능
4. 글로벌 CDN 제공

#### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### 3. 파일 구조

```
korean-heritage-wiki/
├── index.html              # 메인 HTML 파일
├── css/
│   └── style.css           # 스타일시트
├── js/
│   ├── app.js             # 메인 애플리케이션
│   ├── router.js          # 라우팅 관리
│   ├── data-manager.js    # 데이터 관리
│   ├── csv-uploader.js    # CSV 업로드
│   ├── sidebar.js         # 사이드바 관리
│   └── i18n.js           # 다국어 지원
└── README.md              # 프로젝트 설명서
```

## 📋 데이터 관리

### CSV 파일 형식
```csv
name,category,location,korean_description,english_description,period,designation_no,image_url,source_url,coords
경복궁,사적,서울특별시,조선 왕조의 정궁,Main palace of Joseon Dynasty,조선시대,사적 제117호,https://example.com/image.jpg,,37.579617,126.977041
```

**필수 필드**:
- `name`: 문화재명
- `category`: 카테고리 (국보/보물/사적/명승/천연기념물/국가무형문화재)
- `location`: 위치 정보

**선택 필드**:
- `korean_description`: 한국어 설명
- `english_description`: 영어 설명  
- `period`: 시대 정보
- `designation_no`: 지정번호
- `image_url`: 이미지 URL
- `source_url`: 출처 URL
- `coords`: 좌표 (위도,경도)

### 데이터 저장 방식
1. **로컬 스토리지**: 브라우저별 개별 저장
2. **세션 저장**: 임시 메모리 저장
3. **백업**: CSV 다운로드 기능 (향후 추가 예정)

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **아이콘**: Font Awesome
- **폰트**: Noto Sans KR, Noto Serif KR, Inter, Crimson Text
- **CSV 파싱**: Papa Parse
- **다국어**: 자체 i18n 시스템
- **라우팅**: Hash-based SPA 라우팅

## 🎨 디자인 컨셉

### 한국 전통 색상 팔레트
- **Primary**: #2E4A62 (청자색)
- **Secondary**: #8B4513 (단청 갈색)  
- **Accent**: #C73E1D (단청 적색)
- **배경**: 그라데이션과 미세한 그림자 효과

### 반응형 디자인
- **Desktop**: 풀 사이드바 + 메인 컨텐츠
- **Tablet**: 접이식 사이드바 + 적응형 그리드
- **Mobile**: 모바일 메뉴 + 스택형 레이아웃

## 📈 성능 최적화

- **CDN**: jsDelivr을 통한 라이브러리 로드
- **지연 로딩**: 페이지네이션으로 대량 데이터 처리
- **로컬 캐싱**: 브라우저 스토리지 활용
- **압축**: Minified CSS/JS (프로덕션 시)

## 🔧 향후 개발 계획

### Phase 2
- [ ] 지도 통합 (Kakao Map API)
- [ ] 이미지 업로드 기능
- [ ] 데이터 백업/복원 기능
- [ ] 사용자 즐겨찾기 시스템

### Phase 3  
- [ ] 백엔드 API 연동
- [ ] 사용자 인증 시스템
- [ ] 협업 편집 기능
- [ ] AI 번역 품질 개선

## 📞 지원 및 문의

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **Wiki**: 상세 사용법 및 개발 가이드
- **Discussions**: 커뮤니티 토론 및 질문

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

**문화재청 공식 데이터**: 본 시스템은 문화재청의 국가문화유산포털 데이터를 기반으로 합니다.
