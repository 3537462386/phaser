// =============================================
// Fighter 角色类
// =============================================

class Fighter {
    constructor(scene, x, y, color, playerId) {
        this.scene    = scene;
        this.color    = color;
        this.playerId = playerId;
        this.facing   = playerId === PLAYER_IDS.P1 ? 1 : -1;

        this.health       = 100;
        this.rage         = 0;
        this.isHit        = false;
        this.isDead       = false;
        this.isBlocking   = false;
        this.attackState  = ATTACK_STATES.IDLE;
        this.attackType   = null;
        this.hitRegistered = false;
        this.renderMode   = GAME_CONFIG.render.mode;

        // 创建物理容器
        this.container = scene.add.container(x, y);
        scene.physics.world.enable(this.container);
        this.syncHitbox();
        this.container.body.setCollideWorldBounds(true);
        this.container.fighter = this;

        this.renderer = this._createRenderer();
        this.renderer.build();
    }

    _createRenderer() {
        return FighterRendererFactory.create(this);
    }

    updateFacing(facing) {
        if (this.facing === facing) return;
        this.facing = facing;
        this.renderer.updateFacing(facing);
    }

    setBlockVisual(blocking) {
        this.isBlocking = blocking;
        this.renderer.setBlockVisual(blocking);
    }

    showHitFlash() {
        this.renderer.showHitFlash();
    }

    getEffectAnchor(name = 'hitSpark') {
        const anchor = GAME_CONFIG.render.effectAnchors[name] || { x: 0, y: 0 };
        return {
            x: this.x + anchor.x,
            y: this.y + anchor.y,
        };
    }

    getHitReactionTargets() {
        return this.renderer.getHitReactionTargets();
    }

    getKOTweenTarget() {
        return this.container;
    }

    getKOFallY() {
        return this.getEffectAnchor('ko').y;
    }

    getRenderMode() {
        return this.renderMode;
    }

    setRenderMode(mode) {
        this.renderMode = mode;
        this.syncHitbox();
    }

    playAttackStartup(type) {
        this.renderer.playAttackStartup(type);
    }

    playAttackActive(type) {
        this.renderer.playAttackActive(type);
    }

    playAttackRecovery(type) {
        this.renderer.playAttackRecovery(type);
    }

    updateVisualState() {
        if (this.renderer && typeof this.renderer.syncAnimationState === 'function') {
            this.renderer.syncAnimationState();
        }
    }

    syncHitbox() {
        const hitbox = GAME_CONFIG.render.hitbox;

        if (!hitbox || !this.container.body) return;

        this.container.body.setSize(hitbox.width, hitbox.height);
        this.container.body.setOffset(hitbox.offsetX, hitbox.offsetY);
    }

    get x()    { return this.container.x; }
    get y()    { return this.container.y; }
    get body() { return this.container.body; }

    isOnGround() { return this.body.touching.down; }

    // 重置角色状态
    reset(x, y) {
        this.container.x = x;
        this.container.y = y;
        this.container.angle = 0;
        this.body.setVelocity(0, 0);
        this.health = 100;
        this.rage = 0;
        this.isHit = false;
        this.isDead = false;
        this.isBlocking = false;
        this.attackState = ATTACK_STATES.IDLE;
        this.attackType = null;
        this.hitRegistered = false;
        this.renderer.resetVisualState();
    }

    // 重置姿势
    resetPose() {
        this.renderer.resetPose();
    }
}
