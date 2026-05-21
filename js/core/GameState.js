/**
 * GameState — 全局单例，替代 window.gameSettings
 * 存储设置、选中角色和本局运行数据
 */
const GameState = {
    settings: {
        bgmVolume:       5,
        sfxVolume:       8,
        difficulty:      1,
        bulletPenetrate: false
    },

    selectedCharacter: null,  // 由 CharacterSelectScene 设置

    run: {
        score:          0,
        killCount:      0,
        level:          1,
        elapsedTime:    0,    // 秒

        // 轮数制
        currentRound:   1,    // 当前轮数（从1开始）
        killTarget:     20,   // 本轮目标击杀数
        roundKills:     0,    // 本轮已击杀数
        gold:           0,    // 持有金币

        // 轮间玩家状态快照（由 GameScene 写入，InterludeScene 读取/修改）
        playerSnapshot: null
    },

    /** 计算第 n 轮的目标击杀数 */
    computeKillTarget(round) {
        return 20 + (round - 1) * 10;
    },

    /** 新游戏时完全重置 */
    reset() {
        this.run.score          = 0;
        this.run.killCount      = 0;
        this.run.level          = 1;
        this.run.elapsedTime    = 0;
        this.run.currentRound   = 1;
        this.run.killTarget     = this.computeKillTarget(1);
        this.run.roundKills     = 0;
        this.run.gold           = 0;
        this.run.playerSnapshot = null;
    },

    /** 进入新一轮时只重置轮内计数 */
    resetRound() {
        this.run.roundKills = 0;
        this.run.killTarget = this.computeKillTarget(this.run.currentRound);
    }
};
