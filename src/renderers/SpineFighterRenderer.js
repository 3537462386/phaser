// =============================================
// Spine Fighter renderer
// =============================================

class SpineFighterRenderer {
    static loadAssets(scene) {
        const spineConfig = GAME_CONFIG.render.spine;

        if (typeof scene.load.spine !== 'function') {
            throw new Error('Spine loader 未注册，无法加载 Spine 资源。');
        }

        scene.load.spine(
            spineConfig.assetKey,
            spineConfig.jsonURL,
            spineConfig.atlasURL,
            spineConfig.preMultipliedAlpha
        );
    }

    constructor(fighter) {
        this.fighter = fighter;
        this.scene = fighter.scene;
        this.spineConfig = GAME_CONFIG.render.spine;
        this.parts = {};
        this.currentMotionKey = null;
        this.currentActionKey = null;
    }

    build() {
        const idleAnimation = this._getAnimationConfig('idle');

        if (typeof this.scene.add.spine !== 'function') {
            throw new Error('Spine game object 工厂未注册，无法创建 Spine 角色。');
        }

        this.parts.visualRoot = this.scene.add.container(0, 0);
        this.parts.spine = this.scene.add.spine(
            this.spineConfig.offset.x,
            this.spineConfig.offset.y,
            this.spineConfig.assetKey,
            idleAnimation.name,
            idleAnimation.loop
        );

        if (this.parts.spine.stateData && typeof this.spineConfig.defaultMix === 'number') {
            this.parts.spine.stateData.defaultMix = this.spineConfig.defaultMix;
        }

        this.parts.hitFlash = this.scene.add.rectangle(
            0,
            -GAME_CONFIG.render.hitbox.height * 0.55,
            GAME_CONFIG.render.hitbox.width * 1.45,
            GAME_CONFIG.render.hitbox.height * 1.7,
            0xffffff,
            0
        );

        this.parts.visualRoot.add([this.parts.spine, this.parts.hitFlash]);
        this.fighter.container.add(this.parts.visualRoot);

        this.updateFacing(this.fighter.facing);
        this.resetPose();
    }

    updateFacing(facing) {
        if (!this.parts.spine) return;

        const scale = this.spineConfig.displayScale;

        this.parts.spine.setScale(scale * facing, scale);
    }

    setBlockVisual(blocking) {
        if (!this.parts.visualRoot) return;

        this.parts.visualRoot.setAlpha(blocking ? this.spineConfig.blockAlpha : 1);
    }

    showHitFlash() {
        if (!this.parts.hitFlash) return;

        this.parts.hitFlash.setFillStyle(0xffffff, this.spineConfig.hitFlashAlpha);
        this.scene.time.delayedCall(80, () => {
            if (this.parts.hitFlash) {
                this.parts.hitFlash.setFillStyle(0xffffff, 0);
            }
        });
    }

    getHitReactionTargets() {
        return this.parts.visualRoot ? [this.parts.visualRoot] : [];
    }

    resetPose() {
        this.currentActionKey = null;
        this.currentMotionKey = null;

        if (this.parts.visualRoot) {
            this.parts.visualRoot.setAngle(0);
        }

        if (this.parts.spine && typeof this.parts.spine.setToSetupPose === 'function') {
            this.parts.spine.setToSetupPose();
        }

        if (this.parts.hitFlash) {
            this.parts.hitFlash.setFillStyle(0xffffff, 0);
        }

        this._playMotionAnimation('idle', false);
    }

    resetVisualState() {
        this.setBlockVisual(false);
        this.updateFacing(this.fighter.facing);
        this.resetPose();
    }

    playAttackStartup(type) {
        this._playActionAnimation(type);
    }

    playAttackActive(type) {
        if (type === ATTACK_TYPES.SUPER && this.parts.visualRoot) {
            this.parts.visualRoot.setAngle(4 * this.fighter.facing);
        }
    }

    playAttackRecovery() {
        if (this.parts.visualRoot) {
            this.parts.visualRoot.setAngle(0);
        }
    }

    syncAnimationState() {
        if (!this.parts.spine || this.fighter.isHit || this.fighter.isDead) return;
        if (this.fighter.attackState !== ATTACK_STATES.IDLE) return;

        const nextMotionKey = this._getMotionAnimationKey();

        if (nextMotionKey === this.currentMotionKey) return;

        this.currentActionKey = null;
        this._playMotionAnimation(nextMotionKey, true);
    }

    _getMotionAnimationKey() {
        if (!this.fighter.isOnGround()) {
            return 'jump';
        }

        if (Math.abs(this.fighter.body.velocity.x) >= this.spineConfig.motionThreshold) {
            return 'walk';
        }

        return 'idle';
    }

    _playMotionAnimation(key, ignoreIfPlaying) {
        this.currentMotionKey = key;
        this._playAnimationKey(key, ignoreIfPlaying);
    }

    _playActionAnimation(key) {
        this.currentActionKey = key;
        this.currentMotionKey = null;
        this._playAnimationKey(key, true);
    }

    _playAnimationKey(key, ignoreIfPlaying) {
        const animationConfig = this._getAnimationConfig(key);
        const animationName = this._resolveAnimationName(key);
        const trackEntry = this.parts.spine.setAnimation(
            0,
            animationName,
            animationConfig.loop,
            ignoreIfPlaying
        );

        if (trackEntry && typeof animationConfig.timeScale === 'number') {
            trackEntry.timeScale = animationConfig.timeScale;
        }
    }

    _resolveAnimationName(key) {
        const animationConfig = this._getAnimationConfig(key);
        const fallbackName = this._getAnimationConfig('idle').name;

        if (typeof this.parts.spine.findAnimation === 'function') {
            if (this.parts.spine.findAnimation(animationConfig.name)) {
                return animationConfig.name;
            }

            if (this.parts.spine.findAnimation(fallbackName)) {
                return fallbackName;
            }
        }

        return animationConfig.name;
    }

    _getAnimationConfig(key) {
        const animationConfig = this.spineConfig.animations[key];

        if (animationConfig) {
            return animationConfig;
        }

        return this.spineConfig.animations.idle;
    }
}