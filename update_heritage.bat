@echo off
chcp 65001 >nul
echo 🔄 문화재 데이터 업데이트 중...

:: 백업 생성
if exist "data\heritage_master.csv" (
    for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
    set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
    set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
    set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
    
    copy "data\heritage_master.csv" "data\backup\heritage_master_%timestamp%.csv" >nul
    echo ✅ 기존 데이터 백업 완료: heritage_master_%timestamp%.csv
) else (
    echo ⚠️ 기존 데이터 파일이 없습니다. 새로 생성합니다.
)

:: 새 파일 복사 (사용자가 지정)
if exist "%1" (
    copy "%1" "data\heritage_master.csv" >nul
    echo ✅ 새 데이터 적용 완료: %1
    echo.
    echo 🌐 브라우저에서 Ctrl+F5로 새로고침하세요
    echo 📱 모바일에서도 http://192.168.0.15:8080 으로 접속 가능합니다
    echo.
    echo 📊 업데이트된 데이터가 자동으로 로드됩니다!
) else (
    echo ❌ 파일을 찾을 수 없습니다: %1
    echo.
    echo 사용법: update_heritage.bat "새파일경로.csv"
    echo 예시: update_heritage.bat "C:\새로운_문화재_데이터.csv"
)

echo.
pause
