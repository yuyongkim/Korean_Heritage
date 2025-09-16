"""
Korean Heritage 완전 영어 번역 시스템 (Cursor/로컬 환경용)
- Upstage Solar Pro2 API 사용
- AMD Ryzen 9 5900X 최적화 (8워커)
- 예상 소요시간: 4-6시간, 비용: $7-8
"""

import json, time, concurrent.futures, re, os
import requests
from openai import OpenAI
from datetime import datetime

print("🔥 Korean Heritage 완전 영어 번역 시작!")
print("💻 AMD Ryzen 9 5900X (12코어) 최적화")

# ===== 설정 =====
UPSTAGE_API_KEY = os.getenv("UPSTAGE_API_KEY")
if not UPSTAGE_API_KEY:
    print("❌ UPSTAGE_API_KEY 환경변수가 설정되지 않았습니다!")
    print("터미널에서 다음 명령어를 실행 후 다시 시도하세요:")
    print("Windows: $env:UPSTAGE_API_KEY=\"여기에_API_키_입력\"")
    print("Linux/macOS: export UPSTAGE_API_KEY=\"여기에_API_키_입력\"")
    exit(1)

MAX_WORKERS = 8  # 12코어 CPU 최적화
BACKUP_INTERVAL = 100  # 100개마다 백업

# ===== OpenAI 클라이언트 설정 (사장님 검증된 방식) =====
client = OpenAI(
    api_key=UPSTAGE_API_KEY,
    base_url="https://api.upstage.ai/v1/solar"
)

# ===== API 연결 테스트 =====
def test_connection():
    try:
        response = client.chat.completions.create(
            model="solar-pro2",
            messages=[{"role": "user", "content": "연결 테스트"}],
            max_tokens=5
        )
        print("✅ Upstage Solar Pro2 API 연결 성공!")
        return True
    except Exception as e:
        print(f"❌ API 연결 실패: {e}")
        return False

if not test_connection():
    exit(1)

# ===== 데이터 로드 =====
def load_heritage_data():
    print("📥 GitHub에서 heritage-data.js 로드 중...")
    url = "https://raw.githubusercontent.com/yuyongkim/Korean_Heritage/main/js/heritage-data.js"
    
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    
    js_content = response.text
    match = re.search(r'HERITAGE_DATA\s*=\s*(\[[\s\S]*?\]);', js_content)
    if not match:
        raise ValueError("HERITAGE_DATA 배열을 찾을 수 없습니다.")
    
    array_text = match.group(1).replace('NaN', 'null')
    heritage_data = json.loads(array_text)
    
    print(f"✅ 전체 문화재 로드: {len(heritage_data):,}개")
    return heritage_data

heritage_data = load_heritage_data()

# ===== 미번역 항목 필터링 =====
untranslated_items = [
    item for item in heritage_data 
    if not (item.get('name_en') and item.get('content_en'))
]

if not untranslated_items:
    print("🎉 모든 문화재가 이미 번역되었습니다!")
    exit(0)

print(f"🎯 번역 대상: {len(untranslated_items):,}개")

# 카테고리별 분포
category_count = {}
for item in untranslated_items:
    cat = item.get('kdcd_name', '기타')
    category_count[cat] = category_count.get(cat, 0) + 1

print("📊 카테고리별 분포:")
for cat, count in sorted(category_count.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f"  - {cat}: {count:,}개")

# 예상 비용/시간
estimated_tokens = len(untranslated_items) * 1500
estimated_cost = estimated_tokens / 1_000_000 * 0.30
estimated_hours = len(untranslated_items) / MAX_WORKERS * 6 / 3600

print(f"\n💰 예상 비용: ${estimated_cost:.2f}")
print(f"⏰ 예상 시간: {estimated_hours:.1f}시간")

# ===== 번역 함수 =====
def translate_item(item, max_retries=3):
    name = item.get('name', '')
    content = item.get('content', '')
    key_asno = item.get('key_asno')
    
    delay = 2.0
    for attempt in range(1, max_retries + 1):
        try:
            response = client.chat.completions.create(
                model="solar-pro2",
                messages=[
                    {
                        "role": "system", 
                        "content": "한국 문화재 전문 번역가입니다. JSON 형식으로만 응답하세요."
                    },
                    {
                        "role": "user", 
                        "content": f"문화재명: {name}\n상세설명: {content}\n\nJSON: {{\"name_en\": \"영문명\", \"content_en\": \"영문설명\"}}"
                    }
                ],
                temperature=0.2,
                max_tokens=4000,
                extra_body={
                    "reasoning_effort": "high"
                }
            )
            
            content_text = response.choices[0].message.content.strip()
            
            # JSON 추출
            if '```json' in content_text:
                content_text = content_text.split('```json')[1].split('```')[0].strip()
            elif '```' in content_text:
                content_text = content_text.split('```')[1].split('```')[0].strip()
            
            try:
                parsed = json.loads(content_text)
                return {
                    "success": True,
                    "key_asno": key_asno,
                    "name_en": parsed.get("name_en", name),
                    "content_en": parsed.get("content_en", content),
                    "tokens": response.usage.total_tokens if response.usage else 0
                }
            except json.JSONDecodeError:
                if attempt < max_retries:
                    time.sleep(delay)
                    delay *= 1.5
                    continue
                else:
                    # JSON 파싱 실패해도 번역 텍스트는 저장
                    return {
                        "success": True,
                        "key_asno": key_asno,
                        "name_en": name,
                        "content_en": content_text,
                        "tokens": response.usage.total_tokens if response.usage else 0
                    }
        except Exception as e:
            if attempt < max_retries:
                time.sleep(delay)
                delay *= 1.5
                continue
    
    return {"success": False, "key_asno": key_asno, "error": "최대 재시도 초과"}

# ===== 배치 번역 =====
def translate_batch(items):
    results = []
    failed_items = []
    total_tokens = 0
    start_time = time.time()
    
    print(f"🚀 {len(items):,}개 문화재 번역 시작 ({MAX_WORKERS}워커)")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_item = {executor.submit(translate_item, item): item for item in items}
        
        for i, future in enumerate(concurrent.futures.as_completed(future_to_item), 1):
            result = future.result()
            item_name = future_to_item[future]['name']
            
            if result and result.get("success"):
                results.append(result)
                tokens = result.get("tokens", 0)
                total_tokens += tokens
                cost = total_tokens / 1_000_000 * 0.30
                
                print(f"  ✅ {i:4d}/{len(items):,}: {item_name[:40]}...")
                
                # 50개마다 진행상황 표시
                if i % 50 == 0:
                    elapsed = time.time() - start_time
                    eta = elapsed / i * (len(items) - i)
                    success_rate = len(results) / i * 100
                    speed = i / elapsed * 3600  # 개/시간
                    
                    print(f"📊 진행률: {i:,}/{len(items):,} ({i/len(items)*100:.1f}%)")
                    print(f"   성공률: {success_rate:.1f}% | 속도: {speed:.0f}개/시간")
                    print(f"   경과: {elapsed/3600:.1f}h | ETA: {eta/3600:.1f}h | 비용: ${cost:.2f}")
            else:
                failed_items.append(result)
                print(f"  ❌ {i:4d}/{len(items):,}: {item_name[:40]}...")
            
            # 백업 저장
            if len(results) % BACKUP_INTERVAL == 0 and len(results) > 0:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_file = f"backup_{len(results)}_{timestamp}.json"
                
                backup_data = {
                    "timestamp": timestamp,
                    "completed": len(results),
                    "total": len(items),
                    "results": results
                }
                
                with open(backup_file, 'w', encoding='utf-8') as f:
                    json.dump(backup_data, f, ensure_ascii=False, indent=2)
                
                print(f"💾 백업 저장: {backup_file}")
    
    elapsed = time.time() - start_time
    final_cost = total_tokens / 1_000_000 * 0.30
    
    print(f"\n🎉 번역 완료!")
    print(f"✅ 성공: {len(results):,}개")
    print(f"❌ 실패: {len(failed_items):,}개") 
    print(f"📊 성공률: {len(results)/(len(results)+len(failed_items))*100:.1f}%")
    print(f"⏰ 총 시간: {elapsed/3600:.1f}시간")
    print(f"💰 총 비용: ${final_cost:.2f}")
    print(f"🚀 평균 속도: {len(results)/elapsed*3600:.0f}개/시간")
    
    return results, failed_items

# ===== 실행 확인 =====
print(f"\n🚀 {len(untranslated_items):,}개 문화재 번역을 시작하시겠습니까?")
response = input("계속하려면 'y'를 입력하세요 (y/N): ")

if response.lower() != 'y':
    print("❌ 작업이 취소되었습니다.")
    exit(0)

# ===== 번역 실행 =====
translation_results, failed_items = translate_batch(untranslated_items)

# ===== 데이터 병합 =====
print("\n🔄 번역 결과를 원본 데이터에 병합 중...")

translation_dict = {r["key_asno"]: r for r in translation_results if r.get("success")}

updated_count = 0
for item in heritage_data:
    key_asno = item.get("key_asno")
    if key_asno in translation_dict:
        trans = translation_dict[key_asno]
        item["name_en"] = trans["name_en"]
        item["content_en"] = trans["content_en"]
        updated_count += 1

print(f"✅ {updated_count:,}개 문화재에 영어 번역 추가 완료")

# ===== 최종 파일 생성 =====
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
output_file = f"heritage-data-complete-{timestamp}.js"

js_content = f"const HERITAGE_DATA = {json.dumps(heritage_data, ensure_ascii=False, indent=2)};"

with open(output_file, "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"📁 최종 파일 생성: {output_file}")

# ===== 품질 검증 =====
translated_items = [item for item in heritage_data if item.get('name_en') and item.get('content_en')]

print(f"\n🔍 최종 검증: {len(translated_items):,}개 문화재 번역 완료")

# 샘플 3개 출력
import random
samples = random.sample(translated_items, min(3, len(translated_items)))

print("\n📋 번역 품질 샘플:")
for i, item in enumerate(samples, 1):
    print(f"\n=== 샘플 {i} ===")
    print(f"카테고리: {item.get('kdcd_name', 'N/A')}")
    print(f"한글명: {item['name']}")
    print(f"영어명: {item['name_en']}")
    print(f"한글설명: {item['content'][:80]}...")
    print(f"영어설명: {item['content_en'][:80]}...")

print(f"\n🎯 전체 작업 완료!")
print(f"📊 최종 결과: {len(translation_results):,}개 번역 완료")
print(f"📁 GitHub에 {output_file} 업로드하여 홈페이지 연동 완성하세요")

print(f"\n💡 다음 단계:")
print(f"1. {output_file}을 heritage-data.js로 이름 변경")
print(f"2. GitHub에 업로드")
print(f"3. 홈페이지에서 한글/English 토글 테스트")
