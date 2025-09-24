/**
 * 통계 계산 전용 모듈
 * 문화재 데이터 통계 및 분석 기능
 */
class StatisticsManager {
    constructor() {
        this.lastStatsUpdate = 0;
        this.STATS_THROTTLE = 1000; // 1초에 한 번만 통계 업데이트
        this.cachedStats = null;
    }

    /**
     * 🚀 최적화된 통계 계산 (스로틀링 적용)
     */
    getStatistics() {
        const now = Date.now();
        
        // 스로틀링: 1초에 한 번만 계산
        if (now - this.lastStatsUpdate < this.STATS_THROTTLE && this.cachedStats) {
            return this.cachedStats;
        }

        this.lastStatsUpdate = now;
        this.cachedStats = this._calculateStatistics();
        return this.cachedStats;
    }

    /**
     * 실제 통계 계산
     */
    _calculateStatistics() {
        const data = dataManager.heritageData;
        if (!data || data.length === 0) {
            return this._getEmptyStats();
        }

        const stats = {
            total: data.length,
            categories: {},
            locations: {},
            periods: {},
            locationCount: 0,
            translationRate: 0,
            unclassifiedCount: 0
        };

        // 카테고리별 통계
        data.forEach(item => {
            const category = item.category || item.kdcd_name || '미분류';
            stats.categories[category] = (stats.categories[category] || 0) + 1;
        });

        // 지역별 통계
        const uniqueLocations = new Set();
        data.forEach(item => {
            const location = item.location || item.ctcd_name;
            if (location) {
                uniqueLocations.add(location);
                stats.locations[location] = (stats.locations[location] || 0) + 1;
            }
        });
        stats.locationCount = uniqueLocations.size;

        // 시대별 통계
        data.forEach(item => {
            if (item.period) {
                stats.periods[item.period] = (stats.periods[item.period] || 0) + 1;
            }
        });

        // 번역률 계산
        const translatedCount = data.filter(item => {
            const englishDesc = item.english_description;
            if (!englishDesc) return false;
            
            const descStr = String(englishDesc).trim();
            return descStr !== '' && 
                   descStr !== 'null' && 
                   descStr !== 'undefined' &&
                   descStr !== '영문 설명 준비 중입니다.' &&
                   !descStr.includes('Description not available');
        }).length;

        stats.translationRate = data.length > 0 ? Math.round((translatedCount / data.length) * 100) : 0;

        // 미분류 항목 수
        stats.unclassifiedCount = data.filter(item => 
            item.category === '미분류' || 
            item.kdcd_name === '미분류' || 
            item.ctcd_name === '미분류' ||
            item.location === '미분류'
        ).length;

        return stats;
    }

    /**
     * 빈 통계 반환
     */
    _getEmptyStats() {
        return {
            total: 0,
            categories: {},
            locations: {},
            periods: {},
            locationCount: 0,
            translationRate: 0,
            unclassifiedCount: 0
        };
    }

    /**
     * 카테고리별 상세 통계
     */
    getCategoryStats() {
        const stats = this.getStatistics();
        return {
            nationalTreasure: stats.categories['국보'] || 0,
            treasure: stats.categories['보물'] || 0,
            historicSite: stats.categories['사적'] || 0,
            scenicSite: stats.categories['명승'] || 0,
            naturalMonument: stats.categories['천연기념물'] || 0,
            intangibleHeritage: stats.categories['국가무형문화재'] || 0,
            unclassified: stats.categories['미분류'] || 0
        };
    }

    /**
     * 지역별 상세 통계
     */
    getLocationStats() {
        const stats = this.getStatistics();
        return {
            totalLocations: stats.locationCount,
            topLocations: this._getTopLocations(stats.locations, 10)
        };
    }

    /**
     * 상위 지역 목록 반환
     */
    _getTopLocations(locations, limit = 10) {
        return Object.entries(locations)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([location, count]) => ({ location, count }));
    }

    /**
     * 시대별 상세 통계
     */
    getPeriodStats() {
        const stats = this.getStatistics();
        return {
            totalPeriods: Object.keys(stats.periods).length,
            topPeriods: this._getTopPeriods(stats.periods, 10)
        };
    }

    /**
     * 상위 시대 목록 반환
     */
    _getTopPeriods(periods, limit = 10) {
        return Object.entries(periods)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([period, count]) => ({ period, count }));
    }

    /**
     * 번역 통계
     */
    getTranslationStats() {
        const stats = this.getStatistics();
        const data = dataManager.heritageData;
        
        if (!data || data.length === 0) {
            return {
                total: 0,
                translated: 0,
                rate: 0
            };
        }

        const translated = data.filter(item => {
            const englishDesc = item.english_description;
            if (!englishDesc) return false;
            
            const descStr = String(englishDesc).trim();
            return descStr !== '' && 
                   descStr !== 'null' && 
                   descStr !== 'undefined' &&
                   descStr !== '영문 설명 준비 중입니다.' &&
                   !descStr.includes('Description not available');
        }).length;

        return {
            total: data.length,
            translated: translated,
            rate: stats.translationRate
        };
    }

    /**
     * 미분류 항목 통계
     */
    getUnclassifiedStats() {
        const data = dataManager.heritageData;
        if (!data || data.length === 0) {
            return {
                total: 0,
                byType: {}
            };
        }

        const unclassified = {
            sidoType: data.filter(item => item.kdcd_name === '시도유형문화재').length,
            sidoFolklore: data.filter(item => item.kdcd_name === '시도민속문화재').length,
            culturalData: data.filter(item => item.kdcd_name === '문화재자료').length,
            others: data.filter(item => 
                item.kdcd_name === '미분류' || 
                item.ctcd_name === '미분류' || 
                item.category === '미분류' || 
                item.location === '미분류'
            ).length
        };

        return {
            total: Object.values(unclassified).reduce((sum, count) => sum + count, 0),
            byType: unclassified
        };
    }

    /**
     * 대시보드용 요약 통계
     */
    getDashboardStats() {
        const stats = this.getStatistics();
        const categoryStats = this.getCategoryStats();
        
        return {
            total: stats.total,
            nationalTreasure: categoryStats.nationalTreasure,
            treasure: categoryStats.treasure,
            historicSite: categoryStats.historicSite,
            scenicSite: categoryStats.scenicSite,
            naturalMonument: categoryStats.naturalMonument,
            intangibleHeritage: categoryStats.intangibleHeritage,
            locationCount: stats.locationCount,
            translationRate: stats.translationRate,
            unclassifiedCount: stats.unclassifiedCount
        };
    }

    /**
     * 통계 캐시 무효화
     */
    invalidateStats() {
        this.cachedStats = null;
        this.lastStatsUpdate = 0;
    }

    /**
     * 통계 업데이트 강제 실행
     */
    forceUpdateStats() {
        this.invalidateStats();
        return this.getStatistics();
    }

    /**
     * 통계 내보내기 (JSON)
     */
    exportStats() {
        const stats = this.getStatistics();
        return {
            timestamp: new Date().toISOString(),
            statistics: stats,
            categoryStats: this.getCategoryStats(),
            locationStats: this.getLocationStats(),
            periodStats: this.getPeriodStats(),
            translationStats: this.getTranslationStats(),
            unclassifiedStats: this.getUnclassifiedStats()
        };
    }
}

// 전역 인스턴스 생성
window.statisticsManager = new StatisticsManager();