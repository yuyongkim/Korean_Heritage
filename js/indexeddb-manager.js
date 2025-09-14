/**
 * IndexedDB 관리자 - 대용량 데이터 저장 (수백MB~GB 지원)
 */
class IndexedDBManager {
    constructor() {
        this.dbName = 'HeritageDatabase';
        this.version = 1;
        this.storeName = 'heritage';
        this.db = null;
    }

    /**
     * IndexedDB 초기화
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('❌ IndexedDB 초기화 실패');
                reject(new Error('IndexedDB 초기화 실패'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ IndexedDB 초기화 완료');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 기존 스토어 삭제
                if (db.objectStoreNames.contains(this.storeName)) {
                    db.deleteObjectStore(this.storeName);
                }
                
                // 새 스토어 생성
                const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('source', 'source', { unique: false });
                
                console.log('✅ IndexedDB 스토어 생성 완료');
            };
        });
    }

    /**
     * 데이터 저장
     */
    async saveData(data, key = 'heritage_data') {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const dataToSave = {
                id: key,
                data: data,
                timestamp: new Date().toISOString(),
                version: '1.0',
                source: 'heritage_perfect_dataset.csv',
                count: data.length
            };

            const request = store.put(dataToSave);

            request.onsuccess = () => {
                console.log(`✅ IndexedDB 저장 완료: ${data.length}건`);
                resolve(true);
            };

            request.onerror = () => {
                console.error('❌ IndexedDB 저장 실패');
                reject(new Error('IndexedDB 저장 실패'));
            };
        });
    }

    /**
     * 데이터 로드
     */
    async loadData(key = 'heritage_data') {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                if (request.result) {
                    console.log(`✅ IndexedDB 로드 완료: ${request.result.count}건`);
                    resolve(request.result);
                } else {
                    console.log('IndexedDB에 데이터 없음');
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error('❌ IndexedDB 로드 실패');
                reject(new Error('IndexedDB 로드 실패'));
            };
        });
    }

    /**
     * 데이터 삭제
     */
    async deleteData(key = 'heritage_data') {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onsuccess = () => {
                console.log('✅ IndexedDB 데이터 삭제 완료');
                resolve(true);
            };

            request.onerror = () => {
                console.error('❌ IndexedDB 데이터 삭제 실패');
                reject(new Error('IndexedDB 데이터 삭제 실패'));
            };
        });
    }

    /**
     * 저장소 크기 확인
     */
    async getStorageSize() {
        if (!this.db) {
            await this.init();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const data = request.result;
                let totalSize = 0;
                
                data.forEach(item => {
                    totalSize += JSON.stringify(item).length;
                });

                const sizeInMB = (totalSize / 1024 / 1024).toFixed(2);
                console.log(`📊 IndexedDB 사용량: ${sizeInMB}MB`);
                resolve({ sizeInMB, itemCount: data.length });
            };

            request.onerror = () => {
                reject(new Error('IndexedDB 크기 확인 실패'));
            };
        });
    }

    /**
     * IndexedDB 지원 여부 확인
     */
    static isSupported() {
        return 'indexedDB' in window;
    }
}

// 전역 인스턴스 생성
window.indexedDBManager = new IndexedDBManager();
