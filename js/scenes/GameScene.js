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
        this.hud            = null;
        this.upgradePopup   = null;

        this.bg            = null;
        this.bgScrollSpeed = 2;

        this.gameOver    = false;
        this.isPaused    = false;
        this.killCount   = 0;
        this.elapsedTime = 0;

        this._damageImmune = false;
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
        GameState.reset();
        this.gameOver    = false;
        this.isPaused    = false;
        this.killCount   = 0;
        this.elapsedTime = 0;
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

        // 玩家
        this.player = new Player(this);
        this.player.create(250, 600, charConfig);
        if (charConfig.tint && charConfig.tint !== 0xffffff) {
            this.player.sprite.setTint(charConfig.tint);
        }

        // 武器
        this.weaponManager = new WeaponManager();
        this.weaponManager.create(this, this.player);
        this.weaponManager.initWithWeapon(charConfig.startWeapon || 'gun');

        // 敌人
        this.enemyManager = new EnemyManager(this);
        this.enemyManager.setWaveManager(this.waveManager);
        this.enemyManager.create();
        this.enemyManager.onEnemyKilled = (x, y, expValue) => {
            this.killCount++;
            GameState.run.killCount = this.killCount;
            this.itemManager.spawnExp(x, y, expValue);
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
            const leveledUp = this.levelingSystem.addExp(amount);
            GameState.run.level = this.levelingSystem.level;
            if (leveledUp) this._onLevelUp();
        });

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

        this.waveManager.tick(deltaSec);
        this.player.update(time);
        this.weaponManager.update(time, this.enemyManager.group);
        this.enemyManager.update();
        this.itemManager.update(this.player.sprite);

        this.hud.update({
            hp:          this.player.hp,
            maxHp:       this.player.maxHp,
            level:       this.levelingSystem.level,
            expProgress: this.levelingSystem.progress,
            elapsedSec:  this.elapsedTime,
            killCount:   this.killCount,
            weapons:     this.weaponManager.getWeapons()
        });
    }

    // ── 伤害统一入口 ─────────────────────────────────────

    _damageEnemy(enemy, amount) {
        if (!enemy || !enemy.active) return;
        enemy.hp = (enemy.hp || 1) - amount;
        if (enemy.hp <= 0) {
            this.enemyManager.reset(enemy, true);
        }
    }

    // ── 碰撞回调 ─────────────────────────────────────────

    _onBulletHitEnemy(bullet, enemy) {
        if (!this.player.penetrate) {
            bullet.setActive(false).setVisible(false);
            bullet.x = -100; bullet.y = -100;
        }
        this._damageEnemy(enemy, bullet.damage || 1);
    }

    _onPlayerHitEnemy(playerSprite, enemy) {
        if (this.gameOver || this._damageImmune) return;
        this._damageImmune = true;
        this.time.delayedCall(800, () => { this._damageImmune = false; });

        const isDead = this.player.takeDamage(enemy.contactDamage || 1);
        if (isDead) this._handleGameOver();
    }

    // ── 升级 ─────────────────────────────────────────────

    _onLevelUp() {
        this.isPaused = true;
        this.enemyManager.stop();

        const options = this.upgradeManager.getOptions(
            this.weaponManager, this.levelingSystem.level
        );

        this.upgradePopup.show(this, options, (option) => {
            this._applyUpgrade(option);
            this.isPaused = false;
            // 重启敌人生成器
            this.enemyManager.create();
        });
    }

    _applyUpgrade(option) {
        switch (option.type) {
            case 'newWeapon':
                this.weaponManager.addWeapon(option.id);
                // 为新武器的子弹组注册碰撞
                for (const group of this.weaponManager.getBulletGroups()) {
                    this.physics.add.overlap(group, this.enemyManager.group,
                        this._onBulletHitEnemy, null, this);
                }
                break;
            case 'upgradeWeapon':
                this.weaponManager.upgradeWeapon(option.id);
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

    // ── 游戏结束 ─────────────────────────────────────────

    _handleGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.physics.pause();
        this.enemyManager.stop();
        this.weaponManager.destroy();

        this.player.triggerDeath();
        this.time.delayedCall(600, () => this._showGameOverScreen());
    }

    _showGameOverScreen() {
        const overlay = this.add.graphics().setDepth(60);
        overlay.fillStyle(0x000011, 0.8);
        overlay.fillRect(0, 0, 500, 700);

        this.add.text(250, 200, '游戏结束', {
            fontSize: '52px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ff4455', stroke: '#330011', strokeThickness: 5
        }).setOrigin(0.5).setDepth(61);

        const m = Math.floor(this.elapsedTime / 60);
        const s = Math.floor(this.elapsedTime % 60);
        const timeStr = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

        [
            `存活时间  ${timeStr}`,
            `击杀数量  ${this.killCount}`,
            `最终等级  Lv.${this.levelingSystem.level}`
        ].forEach((line, i) => {
            this.add.text(250, 300 + i * 44, line, {
                fontSize: '20px', fontFamily: 'Arial',
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

        // 返回主菜单
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
