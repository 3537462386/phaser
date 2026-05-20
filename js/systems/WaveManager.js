/**
 * WaveManager — 根据游戏时间决定敌人生成策略
 *
 * 时间阶段：
 *   0   ~ 120s  : 仅 normal
 *   120 ~ 300s  : normal + fast
 *   300s+       : normal + fast + heavy；每 60s 额外生成一个 elite
 */
class WaveManager {
    constructor() {
        this.elapsedSeconds = 0;
        this._lastEliteSpawn = 0;  // 上次生成 elite 的时刻(s)
    }

    reset() {
        this.elapsedSeconds  = 0;
        this._lastEliteSpawn = 0;
    }

    /**
     * 每帧调用，增加时间
     * @param {number} deltaSec  delta / 1000
     */
    tick(deltaSec) {
        this.elapsedSeconds += deltaSec;
    }

    /**
     * 当前应生成的敌人类型（随机加权）
     * @returns {string} 敌人 id
     */
    pickEnemyType() {
        const t = this.elapsedSeconds;

        // 精英：300s 后每 60s 一次
        if (t >= 300 && t - this._lastEliteSpawn >= 60) {
            this._lastEliteSpawn = t;
            return 'elite';
        }

        let pool;
        if (t < 120) {
            pool = ['normal', 'normal', 'normal'];
        } else if (t < 300) {
            pool = ['normal', 'normal', 'fast'];
        } else {
            pool = ['normal', 'fast', 'heavy'];
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }

    /**
     * 当前生成间隔(ms)
     * 随时间线性缩短，最低 350ms
     */
    get spawnInterval() {
        const t = this.elapsedSeconds;
        return Math.max(350, 1200 - Math.floor(t / 30) * 80);
    }

    /**
     * 当前同屏最大数量
     */
    get maxAlive() {
        const t = this.elapsedSeconds;
        return Math.min(20, 10 + Math.floor(t / 60));
    }
}
