/**
 * BossManager — Boss 战管理器
 *
 * 负责：
 *   - 判断当前轮是否为 Boss 轮（每 5 轮）
 *   - Boss 生成、AI 行为、阶段变化
 *   - Boss 弹幕（环形射击）
 *   - Boss 死亡掉落
 *   - Boss 轮 UI 提示
 */
class BossManager {
    constructor() {
        this.scene       = null;
        this.enemyManager = null;

        this._boss       = null;       // 当前 Boss 精灵
        this._bossData   = null;       // 当前 Boss 数据
        this._isBossRound = false;
        this._isPhase2   = false;
        this._attackTimers = [];
        this._bullets    = [];         // Boss 弹幕 {gfx, x, y, vx, vy, active}
        this._charging   = false;
        this._chargeDir  = { x: 0, y: 0 };
        this._chargeUntil = 0;

        /** Boss 被击杀回调 */
        this.onBossKilled = null;
    }

    create(scene, enemyManager) {
        this.scene = scene;
        this.enemyManager = enemyManager;
    }

    reset() {
        this._clearBoss();
    }

    // ── 判断与生成 ──────────────────────────────────

    /** 当前轮是否为 Boss 轮 */
    isBossRound(round) {
        return round > 0 && round % 5 === 0;
    }

    /** 生成 Boss */
    spawnBoss(round) {
        if (!this.isBossRound(round)) return;

        const idx    = Math.floor((round / 5 - 1)) % BOSS_SCHEDULE.length;
        const bossId = BOSS_SCHEDULE[idx];
        const data   = BOSS_DATA[bossId];
        if (!data) return;

        this._bossData = data;
        this._isBossRound = true;
        this._isPhase2 = false;

        // 生成 Boss 精灵（复用 enemy 图像但放大+着色）
        const boss = this.enemyManager.group.get(250, -40);
        if (!boss) return;

        boss.setActive(true).setVisible(true);
        boss.setScale(data.scale);
        boss.setTint(data.tint);
        boss.speed         = data.speed;
        boss.hp            = data.hp;
        boss.maxHp         = data.hp;
        boss.expValue      = data.expValue;
        boss.contactDamage = data.contactDamage;
        boss.enemyType     = 'boss';
        boss.isBoss        = true;
        boss.bossId        = data.id;

        if (boss.body) {
            boss.body.enable = true;
            boss.body.reset(250, -40);
            boss.body.setSize(44, 30);
        }

        this._boss = boss;

        // 启动攻击定时器
        this._startAttacks();

        // Boss 出现警告
        this._showBossWarning(data.name);
    }

    // ── 更新 ──────────────────────────────────────

    update(time, delta) {
        if (!this._boss || !this._boss.active) return;

        // Boss 基础移动（缓慢下移到屏幕上方后左右移动）
        if (!this._charging) {
            if (this._boss.y < 100) {
                this._boss.y += this._boss.speed;
            } else {
                // 左右巡逻
                this._boss.x += Math.sin(time * 0.001) * this._boss.speed * 2;
                this._boss.x = Phaser.Math.Clamp(this._boss.x, 40, 460);
            }
            if (this._boss.body) {
                this._boss.body.reset(this._boss.x, this._boss.y);
            }
        } else {
            // 冲撞中
            this._boss.x += this._chargeDir.x * 4;
            this._boss.y += this._chargeDir.y * 4;
            if (this._boss.body) {
                this._boss.body.reset(this._boss.x, this._boss.y);
            }
            if (time > this._chargeUntil) {
                this._charging = false;
            }
        }

        // 阶段 2 检测
        if (!this._isPhase2 && this._bossData.phase2HpRatio) {
            if (this._boss.hp / this._boss.maxHp <= this._bossData.phase2HpRatio) {
                this._enterPhase2();
            }
        }

        // 更新弹幕
        this._updateBullets();
    }

    // ── 攻击系统 ──────────────────────────────────────

    _startAttacks() {
        this._clearAttackTimers();

        if (!this._bossData.attacks) return;

        for (const atk of this._bossData.attacks) {
            const timer = this.scene.time.addEvent({
                delay:     atk.interval + Phaser.Math.Between(0, 1000),
                callback:  () => this._executeAttack(atk),
                callbackScope: this,
                loop:      true
            });
            this._attackTimers.push(timer);
        }
    }

    _executeAttack(atk) {
        if (!this._boss || !this._boss.active) return;

        switch (atk.type) {
            case 'spawn_minions':
                this._spawnMinions(atk.count, atk.minionType);
                break;
            case 'charge':
                this._startCharge(atk.speed, atk.duration);
                break;
            case 'ring_shot':
                this._fireRingShot(atk.bulletCount, atk.bulletSpeed, atk.bulletDamage);
                break;
        }
    }

    _spawnMinions(count, type) {
        if (!this.enemyManager) return;
        for (let i = 0; i < count; i++) {
            const x = this._boss.x + Phaser.Math.Between(-60, 60);
            const y = this._boss.y + 20;
            const enemy = this.enemyManager.group.get(x, y);
            if (!enemy) continue;
            const data = ENEMY_DATA[type] || ENEMY_DATA.normal;
            enemy.setActive(true).setVisible(true);
            enemy.setScale(data.scale);
            enemy.setTint(data.tint);
            enemy.speed         = Phaser.Math.FloatBetween(data.speedMin, data.speedMax);
            enemy.hp            = data.hp;
            enemy.maxHp         = data.hp;
            enemy.expValue      = data.expValue;
            enemy.contactDamage = data.contactDamage;
            enemy.enemyType     = type;
            if (enemy.body) {
                enemy.body.enable = true;
                enemy.body.reset(x, y);
                enemy.body.setSize(44, 30);
            }
        }
    }

    _startCharge(speed, duration) {
        if (!this._boss || !this._player) return;
        this._charging = true;
        this._chargeUntil = this.scene.time.now + duration;

        const dx = this._player.sprite.x - this._boss.x;
        const dy = this._player.sprite.y - this._boss.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        this._chargeDir = {
            x: (dx / dist) * speed,
            y: (dy / dist) * speed
        };
    }

    _fireRingShot(count, bulletSpeed, damage) {
        if (!this._boss) return;
        const cx = this._boss.x;
        const cy = this._boss.y;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const vx = Math.cos(angle) * bulletSpeed;
            const vy = Math.sin(angle) * bulletSpeed;

            const gfx = this.scene.add.graphics();
            gfx.fillStyle(0xff44aa, 0.9);
            gfx.fillCircle(0, 0, 5);
            gfx.setPosition(cx, cy);
            gfx.setDepth(5);

            this._bullets.push({
                gfx, x: cx, y: cy, vx, vy,
                damage: damage || 1,
                active: true
            });
        }
    }

    _updateBullets() {
        for (const b of this._bullets) {
            if (!b.active) continue;
            b.x += b.vx;
            b.y += b.vy;
            b.gfx.setPosition(b.x, b.y);

            // 出屏销毁
            if (b.x < -20 || b.x > 520 || b.y < -20 || b.y > 720) {
                b.active = false;
                b.gfx.destroy();
                continue;
            }

            // 碰撞玩家
            if (this._player && this._player.sprite && this._player.sprite.active) {
                const dx = b.x - this._player.sprite.x;
                const dy = b.y - this._player.sprite.y;
                if (Math.sqrt(dx * dx + dy * dy) < 22) {
                    b.active = false;
                    b.gfx.destroy();
                    // 由 GameScene 处理伤害
                    if (this.scene._onBossBulletHit) {
                        this.scene._onBossBulletHit(b.damage);
                    }
                }
            }
        }
        this._bullets = this._bullets.filter(b => b.active);
    }

    // ── 阶段 2 ──────────────────────────────────────

    _enterPhase2() {
        this._isPhase2 = true;
        if (this._boss) {
            this._boss.speed = this._bossData.phase2Speed;
            // 闪烁提示阶段变化
            this.scene.tweens.add({
                targets: this._boss,
                alpha: 0.3, duration: 100, yoyo: true, repeat: 5,
                onComplete: () => { if (this._boss) this._boss.setAlpha(1); }
            });
        }
        // 阶段 2 加速攻击频率
        this._clearAttackTimers();
        if (this._bossData.attacks) {
            for (const atk of this._bossData.attacks) {
                const timer = this.scene.time.addEvent({
                    delay:     Math.max(1000, atk.interval * 0.6),
                    callback:  () => this._executeAttack(atk),
                    callbackScope: this,
                    loop:      true
                });
                this._attackTimers.push(timer);
            }
        }
    }

    // ── Boss 死亡 ──────────────────────────────────────

    onBossDeath(boss) {
        const data = this._bossData;
        if (!data) return;

        // 掉落金币
        GameState.run.gold += this._modifyGold(data.lootGold || data.goldValue);

        // 掉落稀有遗物（tier 2）
        this._dropRareRelic(data.lootTier);

        // 清理
        this._clearAttackTimers();
        this._clearBullets();
        this._boss      = null;
        this._bossData  = null;
        this._isBossRound = false;

        if (this.onBossKilled) this.onBossKilled(data);
    }

    _dropRareRelic(tier) {
        // 从指定 tier 的遗物中随机选一个
        const pool = Object.values(PASSIVE_ITEM_DATA).filter(d => d.tier === tier);
        if (pool.length === 0) return;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        // 通过场景回调处理遗物获取
        if (this.scene._onBossDropRelic) {
            this.scene._onBossDropRelic(picked.id);
        }
    }

    _modifyGold(base) {
        // 与 PassiveItemManager 的金币修正联动（简化处理）
        let gold = base;
        if (this.scene.passiveItemManager) {
            gold = this.scene.passiveItemManager.modifyGold(gold);
        }
        return gold;
    }

    // ── UI 提示 ──────────────────────────────────────

    _showBossWarning(bossName) {
        const txt = this.scene.add.text(250, 300, `!! ${bossName} !!`, {
            fontSize: '36px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ff2266', stroke: '#440011', strokeThickness: 5
        }).setOrigin(0.5).setDepth(55).setAlpha(0);

        this.scene.tweens.add({
            targets: txt,
            alpha: 1, duration: 400, yoyo: true, repeat: 2,
            onComplete: () => txt.destroy()
        });

        // 副标题
        const sub = this.scene.add.text(250, 340, 'BOSS 出现', {
            fontSize: '16px', fontFamily: 'Arial',
            fill: '#ff6688', stroke: '#220011', strokeThickness: 2
        }).setOrigin(0.5).setDepth(55).setAlpha(0);

        this.scene.tweens.add({
            targets: sub,
            alpha: 1, duration: 600, delay: 400,
            onComplete: () => {
                this.scene.tweens.add({
                    targets: sub, alpha: 0, duration: 800, delay: 1000,
                    onComplete: () => sub.destroy()
                });
            }
        });
    }

    // ── 清理 ──────────────────────────────────────────

    _clearAttackTimers() {
        for (const t of this._attackTimers) {
            if (t) t.remove(false);
        }
        this._attackTimers = [];
    }

    _clearBullets() {
        for (const b of this._bullets) {
            if (b.gfx) b.gfx.destroy();
        }
        this._bullets = [];
    }

    _clearBoss() {
        this._clearAttackTimers();
        this._clearBullets();
        this._boss       = null;
        this._bossData   = null;
        this._isBossRound = false;
        this._isPhase2   = false;
        this._charging   = false;
    }

    // ── 属性 ──────────────────────────────────────────

    get isBossActive() {
        return this._boss && this._boss.active;
    }

    get bossHp() {
        return this._boss ? this._boss.hp : 0;
    }

    get bossMaxHp() {
        return this._boss ? this._boss.maxHp : 0;
    }

    get bossName() {
        return this._bossData ? this._bossData.name : '';
    }

    setPlayerRef(player) {
        this._player = player;
    }

    destroy() {
        this._clearBoss();
    }
}
