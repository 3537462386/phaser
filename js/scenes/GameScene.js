class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player    = null;  // Player 实例
        this.enemies   = null;
        this.score     = 0;
        this.scoreText = null;
        this.gameOver  = false;
        this.bg        = null;
        this.bgScrollSpeed = 2;
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
        // 背景
        this.bg = this.add.tileSprite(250, 350, 500, 700, 'spaceBg');
        this.bg.setScrollFactor(0);

        // 玩家（动画 / 子弹 / 输入全部由 Player 封装）
        this.player = new Player(this);
        this.player.create(250, 650);

        // 敌人组
        this.enemies = this.physics.add.group();
        this._createEnemies();
        this.enemies.children.iterate((enemy) => {
            enemy.body.setSize(44, 30);
        });

        // 碰撞检测
        this.physics.add.overlap(this.player.bullets, this.enemies, this._hitEnemy,      null, this);
        this.physics.add.overlap(this.player.sprite,  this.enemies, this._gameOverHandler, null, this);

        // UI
        this.scoreText = this.add.text(16, 16, '分数: 0', {
            fontSize: '20px',
            fill: '#fff',
            fontFamily: 'Arial',
            backgroundColor: '#00000066',
            padding: { x: 8, y: 4 }
        });
        this.add.text(16, 650, '← → ↑ ↓ 移动飞船  |  空格射击  |  移动端可拖动', {
            fontSize: '14px',
            fill: '#aaa',
            fontFamily: 'Arial',
            backgroundColor: '#00000066',
            padding: { x: 8, y: 4 }
        });

        // 重置状态（scene.restart() 后生效）
        this.score    = 0;
        this.gameOver = false;
    }

    update(time) {
        if (this.gameOver) return;

        // 背景滚动
        this.bg.tilePositionY += this.bgScrollSpeed;

        // 玩家（移动 + 射击 + 子弹回收）
        this.player.update(time);

        // 敌人下移
        this.enemies.children.iterate((enemy) => {
            if (enemy.active) {
                enemy.y += enemy.speed;
                if (enemy.y > 690) {
                    this._resetEnemyPosition(enemy);
                }
            }
        });
    }

    // ─── 私有方法 ──────────────────────────────────────

    _getNonOverlappingEnemyPosition() {
        const enemyRadius = 30;
        let attempts = 0;
        let positionFound = false;
        let x, y;

        while (!positionFound && attempts < 50) {
            x = Phaser.Math.Between(20, 460);
            y = Phaser.Math.Between(-800, -20);
            positionFound = true;
            this.enemies.children.iterate((existingEnemy) => {
                if (existingEnemy.active) {
                    const distance = Phaser.Math.Distance.Between(x, y, existingEnemy.x, existingEnemy.y);
                    if (distance < enemyRadius * 2) {
                        positionFound = false;
                    }
                }
            });
            attempts++;
        }

        if (!positionFound) {
            x = Phaser.Math.Between(20, 460);
            y = Phaser.Math.Between(-600, -20);
        }
        return { x, y };
    }

    _createEnemies() {
        for (let i = 0; i < 15; i++) {
            const position = this._getNonOverlappingEnemyPosition();
            const enemy = this.enemies.create(position.x, position.y, 'enemy');
            enemy.setScale(1);
            enemy.speed = 1;
            enemy.setBounce(1);
        }
    }

    _hitEnemy(bullet, enemy) {
        if (!this.player.penetrate) {
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.x = -100;
            bullet.y = -100;
        }
        this._resetEnemyPosition(enemy);
        this.score += 10;
        this.scoreText.setText('分数: ' + this.score);
        this._playExplosionSound();
        if (this.score % 100 === 0) {
            this._increaseDifficulty();
        }
    }

    _gameOverHandler(playerSprite, enemy) {
        if (this.gameOver) return;
        this.gameOver = true;
        this.physics.pause();

        this.player.triggerDeath();

        this.time.delayedCall(500, () => {
            this.physics.pause();
            this._showGameOverText();
        });
    }

    _showGameOverText() {
        this.add.text(250, 300, '游戏结束!', {
            fontSize: '36px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            backgroundColor: '#000000aa',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5);

        this.add.text(250, 350, '最终分数: ' + this.score, {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'Arial',
            backgroundColor: '#000000aa',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5);

        this.add.text(250, 400, '点击屏幕重新开始', {
            fontSize: '20px',
            fill: '#00ff00',
            fontFamily: 'Arial',
            backgroundColor: '#000000aa',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }

    _resetEnemyPosition(enemy) {
        const position = this._getNonOverlappingEnemyPosition();
        enemy.x = position.x;
        enemy.y = position.y;
        enemy.setActive(true);
        enemy.setVisible(true);
        if (enemy.body) {
            enemy.body.enable = true;
        }
    }

    _increaseDifficulty() {
        // 预留：每 100 分提速
        // this.enemies.children.iterate((enemy) => { enemy.speed += 1; });
    }

    _playExplosionSound() {
        console.log('💥 爆炸音效');
    }
}
