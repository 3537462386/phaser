/**
 * EnemyManager — 敌人管理器（定时生成 + 对象池）
 *
 * 设计思路：
 *   - 不预先堆满屏幕，用 scene.time.addEvent 每隔 _spawnInterval ms 生成一个敌人
 *   - 使用 Phaser 对象池（group.get/maxSize），被击落的敌人直接回收，不做位置"传送"
 *   - increaseDifficulty(level) 根据难度等级收紧间隔、提高速度、放宽同屏上限
 *   - stop() 供游戏结束时调用，停止定时器
 *   - shooter 类型：进入画面后原地不动，定时向玩家方向发射子弹
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

        /** 敌人被击杀时的回调：(x, y, expValue, enemyType) => void */
        this.onEnemyKilled = null;

        /** shooter 子弹击中玩家时的回调：(damage) => void */
        this.onEnemyBulletHit = null;

        /** shooter 子弹对象池 { gfx, x, y, vx, vy, damage, active }[] */
        this._shooterBullets = [];
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

    update(deltaSec = 1 / 60) {
        const dtScale = deltaSec * 60;
        this.group.children.iterate((enemy) => {
            if (!enemy.active) return;

            // ── shooter 类型：移动到停留位置后原地射击 ─────
            if (enemy.isShooter) {
                const stopY = enemy.stopY || 200;
                if (enemy.y < stopY) {
                    enemy.y += enemy.speed * dtScale;
                } else {
                    if (enemy.body) enemy.body.reset(enemy.x, enemy.y);
                    enemy.fireTimer = (enemy.fireTimer || 0) - deltaSec * 1000;
                    if (enemy.fireTimer <= 0) {
                        this._fireShooterBullet(enemy);
                        const data = ENEMY_DATA[enemy.enemyType];
                        enemy.fireTimer = (data ? data.fireInterval : 2000)
                            + Phaser.Math.Between(-300, 300);
                    }
                }
            } else if (enemy.isSeeker) {
                // ── seeker 类型：角度偏向玩家移动 ─────────
                const player = this.scene.player;
                if (player && player.sprite && player.sprite.active) {
                    const dx = player.sprite.x - enemy.x;
                    const dy = player.sprite.y - enemy.y;
                    const targetAngle = Math.atan2(dy, dx);
                    // 渐进转向（不直接追踪，有 turnRate 限制）
                    let seekAngle = enemy._seekAngle;
                    const tr = enemy._seekTurnRate;
                    // 角度差最短路径
                    let angleDiff = targetAngle - seekAngle;
                    while (angleDiff > Math.PI)  angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    seekAngle += Math.max(-tr, Math.min(tr, angleDiff));
                    enemy._seekAngle = seekAngle;
                    enemy.x += Math.cos(seekAngle) * enemy.speed * dtScale;
                    enemy.y += Math.sin(seekAngle) * enemy.speed * dtScale;
                } else {
                    enemy.y += enemy.speed * dtScale;
                }
                // 偏航角视觉旋转
                if (enemy._seekAngle !== undefined) {
                    enemy.setAngle(Phaser.Math.RadToDeg(enemy._seekAngle) + 90);
                }
                if (enemy.body) enemy.body.reset(enemy.x, enemy.y);
                if (enemy.y > 720 || enemy.x < -30 || enemy.x > 530) this._despawn(enemy);
            } else {
                // ── 普通敌人：直向下移 ────────────────
                enemy.y += enemy.speed * dtScale;
                if (enemy.y > 720) this._despawn(enemy);
            }
        });

        // ── 更新 shooter 子弹 ─────────────────────────
        this._updateShooterBullets(deltaSec);
    }

    /** 子弹命中时调用；wasKilled=true 表示是被打死（而非逃跑） */
    reset(enemy, wasKilled = false) {
        if (wasKilled && this.onEnemyKilled) {
            this.onEnemyKilled(enemy.x, enemy.y, enemy.expValue || 1, enemy.enemyType || 'normal');
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
        // 清空 shooter 子弹
        this._clearShooterBullets();
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

        // ── shooter / seeker 专属属性 ──────────
        enemy.isShooter = (typeId === 'shooter');
        enemy.isSeeker  = (typeId === 'seeker');
        enemy.stopY     = enemy.isShooter
            ? Phaser.Math.Between(80, 300)
            : 0;
        enemy.fireTimer = enemy.isShooter
            ? Phaser.Math.Between(500, 2000)
            : 0;
        if (enemy.isSeeker) {
            // 初始角度：略偏向下方（-PI/2 附近加随机偏移）
            enemy._seekAngle = -Math.PI / 2 + Phaser.Math.FloatBetween(-0.6, 0.6);
            enemy._seekTurnRate = data ? (data.turnRate || 0.03) : 0.03;
        }

        if (enemy.body) {
            enemy.body.enable = true;
            enemy.body.reset(x, y);
            enemy.body.setSize(44, 30);
        }
    }

    // ── shooter 子弹系统 ────────────────────────────

    /**
     * 从 shooter 敌人位置发射一颗向下的子弹
     */
    _fireShooterBullet(enemy) {
        if (!enemy || !enemy.active) return;
        const data = ENEMY_DATA[enemy.enemyType] || { bulletSpeed: 3, bulletDamage: 1 };
        const bx = enemy.x;
        const by = enemy.y + 15;

        // 尝试使用播放器相对方向（对准玩家），否则直下
        const player = this.scene.player;
        let vx = 0;
        let vy = data.bulletSpeed;
        if (player && player.sprite && player.sprite.active) {
            const dx = player.sprite.x - bx;
            const dy = player.sprite.y - by;
            const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
            vx = (dx / dist) * data.bulletSpeed;
            vy = (dy / dist) * data.bulletSpeed;
        }

        const gfx = this.scene.add.graphics();
        gfx.fillStyle(0xffff44, 0.9);
        gfx.fillCircle(0, 0, 4);
        gfx.fillStyle(0xffcc00, 0.6);
        gfx.fillCircle(0, 0, 2);
        gfx.setPosition(bx, by);
        gfx.setDepth(5);

        this._shooterBullets.push({
            gfx, x: bx, y: by, vx, vy,
            damage: data.bulletDamage,
            active: true
        });
    }

    /**
     * 每帧更新 shooter 子弹：移动 + 碰撞检测 + 越界清理
     */
    _updateShooterBullets(deltaSec) {
        const dtScale = deltaSec * 60;
        const player = this.scene.player;

        for (const b of this._shooterBullets) {
            if (!b.active) continue;

            b.x += b.vx * dtScale;
            b.y += b.vy * dtScale;
            b.gfx.setPosition(b.x, b.y);

            // 越界销毁
            if (b.x < -20 || b.x > 520 || b.y < -20 || b.y > 720) {
                b.active = false;
                b.gfx.destroy();
                continue;
            }

            // 与玩家碰撞
            if (player && player.sprite && player.sprite.active) {
                const dx = b.x - player.sprite.x;
                const dy = b.y - player.sprite.y;
                if (Math.sqrt(dx * dx + dy * dy) < 24) {
                    b.active = false;
                    b.gfx.destroy();
                    if (this.onEnemyBulletHit) {
                        this.onEnemyBulletHit(b.damage);
                    }
                }
            }
        }

        // 清理不活跃的子弹
        this._shooterBullets = this._shooterBullets.filter(b => b.active);
    }

    /** 清空所有 shooter 子弹 */
    _clearShooterBullets() {
        for (const b of this._shooterBullets) {
            if (b.gfx) b.gfx.destroy();
        }
        this._shooterBullets = [];
    }

    // ── 回收 ────────────────────────────────────────

    _despawn(enemy) {
        enemy.setActive(false).setVisible(false);
        enemy.isShooter = false;
        enemy.isSeeker  = false;
        enemy.stopY     = 0;
        enemy.fireTimer = 0;
        enemy._seekAngle = 0;
        enemy.setAngle(0);
        // 移出画面，防止 overlap 在本帧仍然触发
        if (enemy.body) enemy.body.reset(-200, -200);
    }
}
