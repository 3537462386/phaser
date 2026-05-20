/**
 * LevelingSystem — 管理玩家经验值和等级
 * EXP 曲线：nextExp = 10 + level * 15
 */
class LevelingSystem {
    constructor() {
        this.level      = 1;
        this.currentExp = 0;
        this.nextExp    = this._calcNextExp(1);
    }

    reset() {
        this.level      = 1;
        this.currentExp = 0;
        this.nextExp    = this._calcNextExp(1);
    }

    /**
     * 添加经验值
     * @param {number} amount
     * @returns {boolean} 是否发生了升级
     */
    addExp(amount) {
        this.currentExp += amount;
        if (this.currentExp >= this.nextExp) {
            this.currentExp -= this.nextExp;
            this.level++;
            this.nextExp = this._calcNextExp(this.level);
            return true;  // 升级了
        }
        return false;
    }

    /** 0~1 的经验进度比例 */
    get progress() {
        return this.nextExp > 0 ? this.currentExp / this.nextExp : 0;
    }

    _calcNextExp(level) {
        return 10 + level * 15;
    }
}
