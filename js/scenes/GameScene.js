class GameScene extends Phaser.Scene {

    constructor() {
        super({ key: 'GameScene' });

        this.player         = null;
        this.enemyManager   = null;
        this.weaponManager  = null;
        this.levelingSystem = null;
        this.waveManager    = null;
        this.upgradeManager = null;
        this.itemManager    = null;
        this.passiveItemManager = null;  // 遗物管理器
        this.bossManager    = null;      // Boss 管理器
        this.hud            = null;
        this.upgradePopup   = null;

        this.bg            = null;
        this.bgScrollSpeed = 2;

        this.gameOver      = false;
        this.isPaused      = false;
        this.roundComplete = false;
        this.killCount     = 0;
        this.roundKills    = 0;
        this.elapsedTime   = 0;

        this._damageImmune = false;
        this._bossRound    = false;  // 当前轮是否为 Boss 轮
    }

    preload() {
        this.load.image('spaceBg', './images/background.png');
        this.load.image('bulletPlayer', './images/bullet_player.png');
        this.load.spritesheet('player', './images/player_sheet.png', {
            frameWidth: 102,
            frameHeight: 126,
            endFrame: 1
        });
        this.load.spritesheet('playerDown', './images/player_down.png', {
            frameWidth: 102,
            frameHeight: 126,
            endFrame: 3
        });
        this.load.image('enemy', './images/enemy1.png');
    }

    create() {
        const data = this.scene.settings.data || {};
        const fromInterlude = data.fromInterlude === true;

        if (!fromInterlude) {
            GameState.reset();
        }

        this.gameOver      = false;
        this.isPaused      = false;
        this.roundComplete = false;
        this.killCount     = fromInterlude ? GameState.run.killCount   : 0;
        this.roundKills    = 0;
        this.elapsedTime   = fromInterlude ? GameState.run.elapsedTime : 0;
        this._damageImmune = false;

        // 背景
        this.bg = this.add.tileSprite(250, 350, 500, 700, 'spaceBg');
        this.bg.setScrollFactor(0);

        // 角色配置
        const charConfig = GameState.selectedCharacter || {
            id: 'balanced', speed: 280, maxHp: 3, fireCooldown: 200,
            startWeapon: 'gun', tint: 0xffffff
        };

        // 系统
        this.levelingSystem  = new LevelingSystem();
        this.waveManager     = new WaveManager();
        this.upgradeManager  = new UpgradeManager();
        this.itemManager     = new ItemManager();
        this.itemManager.create(this);

        // 被动遗物系统
        this.passiveItemManager = new PassiveItemManager();
        this.passiveItemManager.create(this, null, null); // 后面绑定 player 和 weaponManager

        // Boss 系统
        this.bossManager = new BossManager();
        this.bossManager.create(this, null); // 后面绑定 enemyManager

        // 玩家
        this.player = new Player(this);
        this.player.create(250, 600, charConfig);
        if (charConfig.tint && charConfig.tint !== 0xffffff) {
            this.player.sprite.setTint(charConfig.tint);
        }

        // 绑定遗物管理器的 player 和 weaponManager 引用
        this.passiveItemManager.create(this, this.player, null); // weaponManager 后面创建

        // 武器
        this.weaponManager = new WeaponManager();
        this.weaponManager.create(this, this.player);

        // 绑定遗物管理器的 weaponManager
        this.passiveItemManager._weaponMgr = this.weaponManager;

        if (fromInterlude && GameState.run.playerSnapshot) {
            const snap = GameState.run.playerSnapshot;
            this.player.hp           = snap.hp;
            this.player.maxHp        = snap.maxHp;
            this.player.moveSpeed    = snap.moveSpeed;
            this.player.fireCooldown = snap.fireCooldown;

            // 处理快照中的 extraDamage（诅咒效果）
            if (snap.extraDamage) {
                this.player._extraDamage = snap.extraDamage;
            }

            this.weaponManager.initFromSnapshot(snap.weapons);

            // 恢复遗物
            if (snap.relics) {
                this.passiveItemManager.initFromSnapshot(snap.relics);
            }

            // 处理事件/商店中获取的遗物
            if (snap.relicsToAcquire && snap.relicsToAcquire.length > 0) {
                for (const relicId of snap.relicsToAcquire) {
                    this.passiveItemManager.acquire(relicId);
                }
            }
        } else {
            this.weaponManager.initWithWeapon(charConfig.startWeapon || 'gun');
        }

        // 敌人
        this.enemyManager = new EnemyManager(this);
        this.enemyManager.setWaveManager(this.waveManager);
        this.enemyManager.create();

        // 绑定 Boss 管理器的引用
        this.bossManager._enemyManager = this.enemyManager;
        this.bossManager.setPlayerRef(this.player);

        // 按轮数设置难度
        const round = GameState.run.currentRound;
        this.waveManager.reset(round);
        if (round > 1) {
            this.enemyManager.increaseDifficulty(round - 1);
        }

        // Boss 轮判定
        this._bossRound = this.bossManager.isBossRound(round);
        if (this._bossRound) {
            this.bossManager.spawnBoss(round);
        }

        // 击杀回调
        this.enemyManager.onEnemyKilled = (x, y, expValue, enemyType) => {
            this.killCount++;
            this.roundKills++;
            GameState.run.killCount  = this.killCount;
            GameState.run.roundKills = this.roundKills;

            // 金币掉落（受遗物修正）
            const goldByType = { normal: 1, fast: 2, heavy: 3, elite: 8, boss: 25 };
            let gold = (goldByType[enemyType] || 1);
            gold = this.passiveItemManager.modifyGold(gold);
            GameState.run.gold += gold;

            // 通知遗物系统击杀
            const healAmount = this.passiveItemManager.notifyKill();
            if (healAmount > 0) {
                this.player.hp = Math.min(this.player.hp + healAmount, this.player.maxHp);
            }

            // 爆炸核心效果
            if (this.passiveItemManager.checkExplosionCore()) {
                this._triggerExplosionCore(x, y);
            }

            // 通知 WaveManager
            this.waveManager.notifyKill(enemyType);

            // Boss 死亡处理
            if (enemyType === 'boss') {
                this.bossManager.onBossDeath(null);
            }

            // 经验球掉落（受遗物修正）
            const modifiedExp = this.passiveItemManager.modifyExp(expValue);
            this.itemManager.spawnExp(x, y, modifiedExp);

            // 本轮结束检测
            if (this.roundKills >= GameState.run.killTarget && !this.roundComplete) {
                this._handleRoundComplete();
            }
        };

        // 碰撞
        for (const group of this.weaponManager.getBulletGroups()) {
            this.physics.add.overlap(group, this.enemyManager.group,
                this._onBulletHitEnemy, null, this);
        }
        this.physics.add.overlap(
            this.player.sprite, this.enemyManager.group,
            this._onPlayerHitEnemy, null, this
        );

        // 经验球拾取
        this.itemManager.onPickup((amount) => {
            const modifiedAmount = this.passiveItemManager.modifyExp(amount);
            const leveledUp = this.levelingSystem.addExp(modifiedAmount);
            GameState.run.level = this.levelingSystem.level;
            if (leveledUp) this._onLevelUp();
        });

        // Boss 弹幕击中玩家回调
        this._onBossBulletHit = (damage) => {
            this._applyDamageToPlayer(damage);
        };

        // Boss 掉落遗物回调
        this._onBossDropRelic = (relicId) => {
            this.passiveItemManager.acquire(relicId);
        };

        // HUD
        this.hud = new GameHUD();
        this.hud.create(this);

        // 升级弹窗
        this.upgradePopup = new UpgradePopup();
    }

    update(time, delta) {
        if (this.gameOver || this.isPaused) return;

        const deltaSec = delta / 1000;
        this.elapsedTime        += deltaSec;
        GameState.run.elapsedTime = this.elapsedTime;

        this.bg.tilePositionY += this.bgScrollSpeed;

        this.player.update(time);
        this.weaponManager.update(time, this.enemyManager.group);
        this.enemyManager.update();
        this.itemManager.update(this.player.sprite);

        // 遗物系统更新
        this.passiveItemManager.update(time, delta);

        // Boss 系统更新
        this.bossManager.update(time, delta);

        // 更新经验球吸取范围（遗物修正）
        this.itemManager._MAGNET_DIST = 80 * this.passiveItemManager.magnetRangeMultiplier;

        this.hud.update({
            hp:          this.player.hp,
            maxHp:       this.player.maxHp,
            level:       this.levelingSystem.level,
            expProgress: this.levelingSystem.progress,
            elapsedSec:  this.elapsedTime,
            killCount:   this.killCount,
            weapons:     this.weaponManager.getWeapons(),
            round:       GameState.run.currentRound,
            roundKills:  this.roundKills,
            killTarget:  GameState.run.killTarget,
            gold:        GameState.run.gold,
            relics:      this.passiveItemManager.getAll(),
            shieldStacks: this.passiveItemManager.shieldStacks,
            bossActive:  this.bossManager.isBossActive,
            bossHp:      this.bossManager.bossHp,
            bossMaxHp:   this.bossManager.bossMaxHp,
            bossName:    this.bossManager.bossName
        });
    }

    // ── 伤害统一入口 ─────────────────────────────────────

    _damageEnemy(enemy, amount) {
        if (!enemy || !enemy.active) return;

        // 遗物伤害修正
        const modifiedDamage = this.passiveItemManager.modifyDamage(amount);
        enemy.hp = (enemy.hp || 1) - modifiedDamage;
        if (enemy.hp <= 0) {
            // Boss 特殊处理
            if (enemy.isBoss) {
                this.bossManager.onBossDeath(enemy);
            }
            this.enemyManager.reset(enemy, true);
        }
    }

    // ── 统一受伤处理 ──────────────────────────────────────

    _applyDamageToPlayer(rawDamage) {
        if (this.gameOver || this._damageImmune) return;

        // 护盾优先消耗
        if (this.passiveItemManager.consumeShield()) {
            // 护盾抵挡，闪烁白色
            this.scene.tweens.add({
                targets: this.player.sprite,
                alpha: 0.5, duration: 60, yoyo: true, repeat: 2,
                onComplete: () => { if (this.player.sprite) this.player.sprite.setAlpha(1); }
            });
            return;
        }

        // 遗物受伤修正
        const modifiedDamage = this.passiveItemManager.modifyIncomingDamage(rawDamage);

        this._damageImmune = true;
        this.time.delayedCall(800, () => { this._damageImmune = false; });

        const isDead = this.player.takeDamage(modifiedDamage);
        if (isDead) this._handleGameOver();
    }

    // ── 碰撞回调 ─────────────────────────────────────────

    _onBulletHitEnemy(bullet, enemy) {
        // 穿透透镜遗物：子弹不消失
        const hasPiercingLens = this.passiveItemManager.has('piercing_lens');
        if (!this.player.penetrate && !hasPiercingLens) {
            bullet.setActive(false).setVisible(false);
            bullet.x = -100; bullet.y = -100;
        }
        this._damageEnemy(enemy, bullet.damage || 1);
    }

    _onPlayerHitEnemy(playerSprite, enemy) {
        this._applyDamageToPlayer(enemy.contactDamage || 1);
    }

    // ── 爆炸核心效果 ──────────────────────────────────────

    _triggerExplosionCore(x, y) {
        const radius = 60;
        // 视觉效果
        const gfx = this.add.graphics().setDepth(8);
        gfx.fillStyle(0xff6622, 0.6);
        gfx.fillCircle(x, y, radius);
        this.tweens.add({
            targets: gfx, alpha: 0, duration: 300,
            onComplete: () => gfx.destroy()
        });

        // 范围伤害
        this.enemyManager.group.children.iterate(enemy => {
            if (!enemy.active) return;
            const d = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
            if (d < radius) {
                this._damageEnemy(enemy, 2);
            }
        });
    }

    // ── 升级 ─────────────────────────────────────────────

    _onLevelUp() {
        this.isPaused = true;
        this.enemyManager.stop();

        const options = this.upgradeManager.getOptions(
            this.weaponManager, this.levelingSystem.level,
            this.passiveItemManager
        );

        this.upgradePopup.show(this, options, (option) => {
            this._applyUpgrade(option);
            this.isPaused = false;
            this.enemyManager.create();
        });
    }

    _applyUpgrade(option) {
        switch (option.type) {
            case 'newWeapon':
                this.weaponManager.addWeapon(option.id);
                for (const group of this.weaponManager.getBulletGroups()) {
                    this.physics.add.overlap(group, this.enemyManager.group,
                        this._onBulletHitEnemy, null, this);
                }
                break;
            case 'upgradeWeapon':
                this.weaponManager.upgradeWeapon(option.id);
                break;
            case 'evolveWeapon':
                // 武器进化
                if (option.sourceWeaponId) {
                    const w = this.weaponManager._weapons.find(w => w.id === option.sourceWeaponId);
                    if (w) {
                        const evo = WEAPON_EVOLUTION[option.sourceWeaponId];
                        if (evo) {
                            w.level = 4;
                            w.data = {
                                ...w.data,
                                name: evo.evolvedName,
                                damage: evo.evolvedDamage,
                                cooldown: evo.evolvedCooldown
                            };
                        }
                    }
                }
                break;
            case 'passiveItem':
                this.passiveItemManager.acquire(option.id);
                break;
            case 'stat':
                if (option.id === 'speed') {
                    this.player.moveSpeed = Math.min(500, this.player.moveSpeed * 1.15);
                } else if (option.id === 'hp') {
                    this.player.maxHp++;
                    this.player.hp = Math.min(this.player.hp + 1, this.player.maxHp);
                } else if (option.id === 'cooldown') {
                    this.player.fireCooldown = Math.max(80, this.player.fireCooldown * 0.9);
                }
                break;
        }
    }

    // ── 轮完成 ─────────────────────────────────────────────

    _handleRoundComplete() {
        this.roundComplete = true;
        this.enemyManager.stop();
        this.bossManager.destroy();

        // 保存玩家快照
        GameState.run.playerSnapshot = {
            hp:           this.player.hp,
            maxHp:        this.player.maxHp,
            moveSpeed:    this.player.moveSpeed,
            fireCooldown: this.player.fireCooldown,
            extraDamage:  this.player._extraDamage || 0,
            weapons:      this.weaponManager.getWeapons().map(w => ({
                id: w.id, level: w.level
            })),
            relics:       this.passiveItemManager.getSnapshot(),
            relicsToAcquire: []
        };

        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('InterludeScene');
        });
    }

    // ── 游戏结束 ─────────────────────────────────────────

    _handleGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.physics.pause();
        this.enemyManager.stop();
        this.bossManager.destroy();
        this.weaponManager.destroy();

        this.player.triggerDeath();
        this.time.delayedCall(600, () => this._showGameOverScreen());
    }

    _showGameOverScreen() {
        const overlay = this.add.graphics().setDepth(60);
        overlay.fillStyle(0x000011, 0.8);
        overlay.fillRect(0, 0, 500, 700);

        this.add.text(250, 180, '游戏结束', {
            fontSize: '52px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ff4455', stroke: '#330011', strokeThickness: 5
        }).setOrigin(0.5).setDepth(61);

        const m = Math.floor(this.elapsedTime / 60);
        const s = Math.floor(this.elapsedTime % 60);
        const timeStr = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

        // 遗物统计
        const relicCount = this.passiveItemManager.count;

        [
            `最终轮数  第 ${GameState.run.currentRound} 轮`,
            `存活时间  ${timeStr}`,
            `击杀数量  ${this.killCount}`,
            `最终等级  Lv.${this.levelingSystem.level}`,
            `持有遗物  ${relicCount} 件`
        ].forEach((line, i) => {
            this.add.text(250, 250 + i * 40, line, {
                fontSize: '18px', fontFamily: 'Arial',
                fill: '#aabbcc', stroke: '#000011', strokeThickness: 2
            }).setOrigin(0.5).setDepth(61);
        });

        // 重新开始
        const btnGfx = this.add.graphics().setDepth(61);
        const btnDraw = (hover) => {
            btnGfx.clear();
            btnGfx.fillStyle(hover ? 0x0a1a38 : 0x050e1e, 0.95);
            btnGfx.fillRoundedRect(165, 500, 170, 52, 10);
            btnGfx.lineStyle(1.5, hover ? 0x4488ff : 0x2244aa, 1);
            btnGfx.strokeRoundedRect(165, 500, 170, 52, 10);
        };
        btnDraw(false);

        const btnTxt = this.add.text(250, 526, '重新开始', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#99bbee'
        }).setOrigin(0.5).setDepth(62);

        const btnHit = this.add.rectangle(250, 526, 170, 52)
            .setInteractive({ cursor: 'pointer' }).setDepth(63);
        btnHit.on('pointerover', () => { btnDraw(true);  btnTxt.setStyle({ fill: '#ffffff' }); });
        btnHit.on('pointerout',  () => { btnDraw(false); btnTxt.setStyle({ fill: '#99bbee' }); });
        btnHit.on('pointerdown', () => {
            this.cameras.main.fadeOut(220, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('CharacterSelectScene');
            });
        });

        const menuTxt = this.add.text(250, 574, '← 返回主菜单', {
            fontSize: '14px', fontFamily: 'Arial', fill: '#445566'
        }).setOrigin(0.5).setDepth(62).setInteractive({ cursor: 'pointer' });
        menuTxt.on('pointerover', () => menuTxt.setStyle({ fill: '#aabbcc' }));
        menuTxt.on('pointerout',  () => menuTxt.setStyle({ fill: '#445566' }));
        menuTxt.on('pointerdown', () => {
            this.cameras.main.fadeOut(220, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MenuScene');
            });
        });
    }
}
