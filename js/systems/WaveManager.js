/**
 * WaveManager — 根据当前轮数决定敌人生成策略
 *
 * 轮数阶段：
 *   第 1-2 轮 : 仅 normal
 *   第 3-4 轮 : normal + fast + shooter
 *   第 5-7 轮 : normal + fast + heavy + shooter
 *   第 8 轮+  : fast + heavy + shooter（更高密度）
 *   第 5 轮起  : 每击杀 20 个非精英敌人出现一个 elite
 */
class WaveManager {
    constructor() {
        this.currentRound      = 1;
        this._killsSinceElite  = 0;
    }

    /**
     * 进入新一轮时重置
     * @param {number} round  当前轮数
     */
    reset(round = 1) {
        this.currentRound     = round;
        this._killsSinceElite = 0;
    }

    /**
     * 击杀发生时通知（用于精英计数）
     * @param {string} enemyType
     */
    notifyKill(enemyType) {
        if (enemyType !== 'elite') this._killsSinceElite++;
    }

    /**
     * 当前应生成的敌人类型（随机加权）
     * @returns {string} 敌人 id
     */
    pickEnemyType() {
        const r = this.currentRound;

        // 精英：第 5 轮起，每 20 次击杀出现一次
        if (r >= 5 && this._killsSinceElite >= 20) {
            this._killsSinceElite = 0;
            return 'elite';
        }

        let pool;
        if (r <= 2) {
            pool = ['normal', 'normal', 'normal'];
        } else if (r <= 4) {
            pool = ['normal', 'normal', 'fast', 'shooter', 'seeker'];
        } else if (r <= 7) {
            pool = ['normal', 'fast', 'heavy', 'shooter', 'seeker'];
        } else {
            pool = ['fast', 'heavy', 'heavy', 'shooter', 'seeker'];
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }

    /**
     * 当前同屏最大数量（按轮数递增）
     */
    get maxAlive() {
        return Math.min(25, 8 + this.currentRound * 2);
    }
}
