/**
 * EnemyManager — 敌人管理器（定时生成 + 对象池）
 *
 * 设计思路：
 *   - 不预先堆满屏幕，用 scene.time.addEvent 每隔 _spawnInterval ms 生成一个敌人
 *   - 使用 Phaser 对象池（group.get/maxSize），被击落的敌人直接回收，不做位置"传送"
 *   - increaseDifficulty(level) 根据难度等级收紧间隔、提高速度、放宽同屏上限
 *   - stop() 供游戏结束时调用，停止定时器
 *
 * 难度缩放（level = Math.floor(score / 100)）：
 *   生成间隔  1200ms → 每级 -80ms，最低 350ms
 *   速度下限  1.0    → 每级 +0.30，最高 5.0
 *   速度上限  2.5    → 每级 +0.50，最高 8.0
 *   同屏上限  10     → 每 2 级 +1，最高 20
 *
 * 对外接口：
 *   em.group              Phaser.Physics.Arcade.Group，用于 overlap 碰撞检测
 *   em.create()           在 GameScene.create() 中调用
 *   em.update()           在 GameScene.update() 中调用
 *   em.reset(enemy)       子弹命中时调用，回收该敌人
 *   em.increaseDifficulty(level)
 *   em.stop()             游戏结束时调用
 */
class EnemyManager {
    constructor(scene) {
        this.scene  = scene;
        this.group  = null;

        this._spawnInterval = 1200;
        this._speedMin      = 1.0;
        this._speedMax      = 2.5;
        this._maxAlive      = 10;

        this._spawnTimer  = null;
        this._waveManager = null;

        /** 敌人被击杀时的回调：(x, y, expValue) => void */
        this.onEnemyKilled = null;
    }

    /** 绑定 WaveManager，用于决定生成哪种敌人 */
    setWaveManager(wm) {
        this._waveManager = wm;
    }

    // ─── 公有方法 ──────────────────────────────────────

    create() {
        this.group = this.scene.physics.add.group({
            defaultKey : 'enemy',
            maxSize    : 24      // 对象池容量，大于 _maxAlive 最大值即可
        });
        this._startSpawner();
    }

    update() {
        this.group.children.iterate((enemy) => {
            if (!enemy.active) return;
            enemy.y += enemy.speed;
            if (enemy.y > 720) this._despawn(enemy);
        });
    }

    /** 子弹命中时调用；wasKilled=true 表示是被打死（而非逃跑） */
    reset(enemy, wasKilled = false) {
        if (wasKilled && this.onEnemyKilled) {
            this.onEnemyKilled(enemy.x, enemy.y, enemy.expValue || 1);
        }
        this._despawn(enemy);
    }

    /**
     * 提升难度
     * @param {number} level  难度等级（从 1 开始，每 100 分 +1）
     */
    increaseDifficulty(level) {
        this._spawnInterval = Math.max(350,  1200 - level * 80);
        this._speedMin      = Math.min(5.0,  1.0  + level * 0.30);
        this._speedMax      = Math.min(8.0,  2.5  + level * 0.50);
        this._maxAlive      = Math.min(20,   10   + Math.floor(level / 2));
        // 用新间隔重启定时器
        this._restartSpawner();
    }

    /** 游戏结束时停止生成 */
    stop() {
        if (this._spawnTimer) {
            this._spawnTimer.remove(false);
            this._spawnTimer = null;
        }
    }

    // ─── 私有方法 ──────────────────────────────────────

    _startSpawner() {
        this._spawnTimer = this.scene.time.addEvent({
            delay        : this._spawnInterval,
            callback     : this._trySpawn,
            callbackScope: this,
            loop         : true
        });
    }

    _restartSpawner() {
        this.stop();
        this._startSpawner();
    }

    _trySpawn() {
        const maxAlive = this._waveManager ? this._waveManager.maxAlive : this._maxAlive;
        if (this.group.countActive(true) >= maxAlive) return;

        const x     = Phaser.Math.Between(20, 460);
        const y     = Phaser.Math.Between(-120, -20);
        const enemy = this.group.get(x, y);
        if (!enemy) return;

        // 从 WaveManager 取得敌人类型，并应用 EnemyData 配置
        const typeId = this._waveManager ? this._waveManager.pickEnemyType() : 'normal';
        const data   = (typeof ENEMY_DATA !== 'undefined' && ENEMY_DATA[typeId]) || null;

        const speedMin = data ? data.speedMin : this._speedMin;
        const speedMax = data ? data.speedMax : this._speedMax;

        enemy.setActive(true).setVisible(true);
        enemy.setScale(data ? data.scale : 1);
        enemy.setTint(data ? data.tint : 0xffffff);
        enemy.speed         = Phaser.Math.FloatBetween(speedMin, speedMax);
        enemy.hp            = data ? data.hp            : 1;
        enemy.maxHp         = enemy.hp;
        enemy.expValue      = data ? data.expValue      : 1;
        enemy.contactDamage = data ? data.contactDamage : 1;
        enemy.enemyType     = typeId;

        if (enemy.body) {
            enemy.body.enable = true;
            enemy.body.reset(x, y);
            enemy.body.setSize(44, 30);
        }
    }

    _despawn(enemy) {
        enemy.setActive(false).setVisible(false);
        // 移出画面，防止 overlap 在本帧仍然触发
        if (enemy.body) enemy.body.reset(-200, -200);
    }
}

