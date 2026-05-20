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
        score:       0,
        killCount:   0,
        level:       1,
        elapsedTime: 0    // 秒
    },

    reset() {
        this.run.score       = 0;
        this.run.killCount   = 0;
        this.run.level       = 1;
        this.run.elapsedTime = 0;
    }
};
