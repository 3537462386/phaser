/**
 * Player — 玩家飞机实体
 *
 * 封装内容：
 *  - 飞机精灵 & 碰撞体
 *  - 子弹对象池
 *  - 键盘输入（← → A D 水平，↑ ↓ W S 垂直，空格射击）
 *  - 触屏拖动控制（手指/鼠标拖动方向 = 飞机移动方向）
 *  - 飞行 / 爆炸动画注册
 *  - 移动、射击冷却、子弹回收逻辑
 *  - 死亡特效
 *
 * 对外 API：
 *  player.create(x, y)   → 在 scene.create() 中调用
 *  player.update(time)   → 在 scene.update(time) 中调用
 *  player.triggerDeath() → 触发死亡动画
 *  player.sprite         → Phaser 精灵（用于碰撞注册）
 *  player.bullets        → 子弹对象池（用于碰撞注册）
 *  player.penetrate      → 是否穿透模式（可外部赋值）
 *  player.fireCooldown   → 射击冷却毫秒数（可外部赋值）
 *  player.moveSpeed      → 移动速度 px/s（可外部赋值）
 */
class Player {

    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        this.scene = scene;

        /** @type {Phaser.Physics.Arcade.Sprite} */
        this.sprite = null;

        /** @type {Phaser.Physics.Arcade.Group} */
        this.bullets = null;

        this.penetrate    = false;  // 子弹是否穿透
        this.fireCooldown = 200;    // 射击冷却（ms）
        this.moveSpeed    = 280;    // 移动速度（px/s）

        // HP 系统
        this.hp    = 3;
        this.maxHp = 3;

        this._cursors  = null;
        this._spacebar = null;
        this._keyA     = null;
        this._keyD     = null;
        this._keyW     = null;
        this._keyS     = null;
        this._lastFired = 0;

        // 触屏拖动状态
        this._isDragging    = false;
        this._lastPointerX  = 0;
        this._lastPointerY  = 0;
    }

    // ── 公开方法 ──────────────────────────────────────────

    /**
     * 初始化飞机；在 scene.create() 中调用
     * @param {number} x
     * @param {number} y
     * @param {object} [characterConfig] - 来自 CHARACTER_DATA
     * @returns {Player} this（支持链式调用）
     */
    create(x, y, characterConfig) {
        const s = this.scene;

        // 应用角色配置
        if (characterConfig) {
            this.moveSpeed    = characterConfig.speed        || this.moveSpeed;
            this.maxHp        = characterConfig.maxHp        || this.maxHp;
            this.fireCooldown = characterConfig.fireCooldown || this.fireCooldown;
        }
        this.hp = this.maxHp;

        this._registerAnimations();

        // 飞机精灵
        this.sprite = s.physics.add.sprite(x, y, 'player');
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setScale(0.5);
        this.sprite.body.setSize(this.sprite.width * 0.8, this.sprite.height * 0.8);
        this.sprite.anims.play('playerFly');

        // 子弹对象池
        this.bullets = s.physics.add.group({
            defaultKey: 'bulletPlayer',
            maxSize: 15
        });

        // 键盘输入
        this._cursors  = s.input.keyboard.createCursorKeys();
        this._spacebar = s.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this._keyA     = s.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this._keyD     = s.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this._keyW     = s.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this._keyS     = s.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        // 触屏 / 鼠标拖动：手指拖动方向即飞机移动方向
        s.input.on('pointerdown', (pointer) => {
            this._isDragging   = true;
            this._lastPointerX = pointer.x;
            this._lastPointerY = pointer.y;
        });

        s.input.on('pointermove', (pointer) => {
            if (!this._isDragging || !pointer.isDown) return;
            const dx   = pointer.x - this._lastPointerX;
            const dy   = pointer.y - this._lastPointerY;
            const newX = Phaser.Math.Clamp(this.sprite.x + dx, 20, 480);
            const newY = Phaser.Math.Clamp(this.sprite.y + dy, 20, 680);
            // body.reset 直接移动物理体并清零速度，避免与键盘速度冲突
            this.sprite.body.reset(newX, newY);
            this._lastPointerX = pointer.x;
            this._lastPointerY = pointer.y;
        });

        s.input.on('pointerup',     () => { this._isDragging = false; });
        s.input.on('pointercancel', () => { this._isDragging = false; });

        return this;
    }

    /**
     * 每帧逻辑；在 scene.update(time) 中调用
     * @param {number} time - Phaser 时间戳
     */
    update(time) {
        this._handleMovement();
        // 注意：射击逻辑已移至 WeaponManager，不再在此处调用 _handleFire
    }

    /**
     * 受到伤害
     * @param {number} amount
     * @returns {boolean} 是否死亡
     */
    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
        // 被击中闪烁
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.2, duration: 60, yoyo: true, repeat: 3,
            onComplete: () => { if (this.sprite) this.sprite.setAlpha(1); }
        });
        return this.hp <= 0;
    }

    /**
     * 播放死亡动画（爆炸精灵 + 飞机闪烁消隐）
     */
    triggerDeath() {
        const s = this.scene;

        // 在飞机位置生成爆炸精灵
        const explosion = s.add.sprite(this.sprite.x, this.sprite.y, 'playerDown');
        explosion.setScale(0.5);
        explosion.anims.play('explode');

        // 飞机闪烁后隐藏并染红
        this.sprite.setVisible(false);
        s.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.sprite.setTint(0xff0000);
                this.sprite.setAlpha(0.5);
            }
        });
    }

    // ── 私有方法 ──────────────────────────────────────────

    /** 注册动画（幂等：只注册一次） */
    _registerAnimations() {
        const anims = this.scene.anims;

        if (!anims.exists('playerFly')) {
            anims.create({
                key: 'playerFly',
                frames: anims.generateFrameNumbers('player', { start: 0, end: 1 }),
                frameRate: 6,
                repeat: -1,
                yoyo: true
            });
        }

        if (!anims.exists('explode')) {
            anims.create({
                key: 'explode',
                frames: anims.generateFrameNumbers('playerDown', { start: 0, end: 7 }),
                frameRate: 15,
                repeat: 0,
                hideOnComplete: true
            });
        }
    }

    _handleMovement() {
        // 拖动模式：位置由 pointermove 直接写入，此处只需清零残留速度
        if (this._isDragging) {
            this.sprite.setVelocity(0, 0);
            return;
        }

        // 水平
        if (this._cursors.left.isDown || this._keyA.isDown) {
            this.sprite.setVelocityX(-this.moveSpeed);
        } else if (this._cursors.right.isDown || this._keyD.isDown) {
            this.sprite.setVelocityX(this.moveSpeed);
        } else {
            this.sprite.setVelocityX(0);
        }

        // 垂直
        if (this._cursors.up.isDown || this._keyW.isDown) {
            this.sprite.setVelocityY(-this.moveSpeed);
        } else if (this._cursors.down.isDown || this._keyS.isDown) {
            this.sprite.setVelocityY(this.moveSpeed);
        } else {
            this.sprite.setVelocityY(0);
        }
    }

    _handleFire(time) {
        if (this._spacebar.isDown && time > this._lastFired) {
            this._fire();
            this._lastFired = time + this.fireCooldown;
        }
    }

    _fire() {
        const bullet = this.bullets.get(this.sprite.x, this.sprite.y - 20);
        if (!bullet) {
            console.log('❌ 没有可用的子弹！对象池已满');
            return;
        }
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.setScale(0.8);
        bullet.setVelocityY(-400);

        // 3 秒后自动回收（兜底）
        this.scene.time.delayedCall(3000, () => {
            if (bullet.active) {
                bullet.setActive(false);
                bullet.setVisible(false);
            }
        });

        console.log('🔊 激光音效');
    }

    _recycleBullets() {
        this.bullets.children.iterate((bullet) => {
            if (bullet.active && bullet.y < -20) {
                bullet.setActive(false);
                bullet.setVisible(false);
            }
        });
    }
}
