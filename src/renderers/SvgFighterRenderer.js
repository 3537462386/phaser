// =============================================
// SVG Fighter renderer
// =============================================

class SvgFighterRenderer {
    static loadAssets(scene) {
        const svgConfig = GAME_CONFIG.render.svg;

        for (const [playerId, assetRoot] of Object.entries(svgConfig.assetRoots)) {
            for (const part of svgConfig.parts) {
                scene.load.svg(`${playerId}_${part.key}`, `${assetRoot}/${part.key}.svg`, {
                    width: part.w * 2,
                    height: part.h * 2,
                });
            }
        }
    }

    constructor(fighter) {
        this.fighter = fighter;
        this.scene = fighter.scene;
        this.parts = {};
    }

    build() {
        const pid = this.fighter.playerId;
        const facing = this.fighter.facing;

        this.parts.legsImg = this.scene.add.image(0, -8, `${pid}_legs`);
        this.parts.legsImg.setDisplaySize(70, 65);

        this.parts.torso = this.scene.add.image(2 * facing, -52, `${pid}_torso`);
        this.parts.torso.setDisplaySize(60, 72);

        this.parts.head = this.scene.add.image(4 * facing, -88, `${pid}_head`);
        this.parts.head.setDisplaySize(58, 58);

        this.parts.armContainer = this.scene.add.container(22 * facing, -55);
        this.parts.armImg = this.scene.add.image(0, 0, `${pid}_arm`);
        this.parts.armImg.setDisplaySize(32, 72);
        this.parts.armContainer.add(this.parts.armImg);

        this.parts.kickLeg = this.scene.add.container(14 * facing, -15);
        this.parts.kickLegImg = this.scene.add.image(0, 0, `${pid}_kick_leg`);
        this.parts.kickLegImg.setDisplaySize(48, 80);
        this.parts.kickLeg.add(this.parts.kickLegImg);
        this.parts.kickLeg.setVisible(false);

        this.parts.hitFlash = this.scene.add.rectangle(0, -40, 44, 88, 0xffffff, 0);

        this.parts.armPunch = this.scene.add.container(18 * facing, -55);
        this.parts.armPunchImg = this.scene.add.image(0, 0, `${pid}_arm_punch`);
        this.parts.armPunchImg.setDisplaySize(72, 32);
        this.parts.armPunch.add(this.parts.armPunchImg);
        this.parts.armPunch.setVisible(false);

        this.fighter.container.add([
            this.parts.legsImg,
            this.parts.torso,
            this.parts.hitFlash,
            this.parts.kickLeg,
            this.parts.armContainer,
            this.parts.armPunch,
            this.parts.head,
        ]);

        this.fighter.legLeft = this.parts.legsImg;
        this.fighter.legRight = this.parts.legsImg;
        this.updateFacing(facing);
        this.resetPose();
    }

    updateFacing(facing) {
        const flip = facing === -1;

        this.parts.legsImg.setFlipX(flip);
        this.parts.torso.setFlipX(flip);
        this.parts.head.setFlipX(flip);
        this.parts.armImg.setFlipX(flip);
        this.parts.kickLegImg.setFlipX(flip);
        this.parts.armPunchImg.setFlipX(flip);

        this.parts.armContainer.x = 22 * facing;
        this.parts.armPunch.x = 18 * facing;
        this.parts.kickLeg.x = 14 * facing;
        this.parts.head.x = 4 * facing;
        this.parts.torso.x = 2 * facing;
    }

    setBlockVisual(blocking) {
        const tint = blocking ? COLORS.BLOCK_TINT : COLORS.NORMAL_TINT;
        this.parts.torso.setTint(tint);
        this.parts.legsImg.setTint(tint);
        this.parts.armImg.setTint(tint);
        this.parts.armPunchImg.setTint(tint);
    }

    clearTints() {
        this.parts.torso.clearTint();
        this.parts.legsImg.clearTint();
        this.parts.armImg.clearTint();
        this.parts.armPunchImg.clearTint();
    }

    showHitFlash() {
        this.parts.hitFlash.setFillStyle(0xffffff, 0.75);
        this.scene.time.delayedCall(80, () => this.parts.hitFlash.setFillStyle(0xffffff, 0));
    }

    getHitReactionTargets() {
        return [this.parts.torso, this.parts.head].filter(Boolean);
    }

    setTorsoAngle(angle) {
        this.parts.torso.angle = angle;
    }

    _showPunch(scaleX = 0.1, scaleY = 1) {
        this.parts.armContainer.setVisible(false);
        this.parts.armPunch.setVisible(true);
        this.parts.armPunchImg.setScale(scaleX, scaleY);
    }

    _hidePunch() {
        this.parts.armPunch.x = 18 * this.fighter.facing;
        this.parts.armPunch.y = -55;
        this.parts.armPunch.angle = 0;
        this.parts.armPunch.setVisible(false);
        this.parts.armPunchImg.setScale(1, 1);
        this.parts.armContainer.setVisible(true);
    }

    _showKick(scaleX = 0.1, scaleY = 1) {
        this.parts.kickLeg.setVisible(true);
        this.parts.legsImg.setVisible(false);
        this.parts.kickLegImg.setScale(scaleX, scaleY);
    }

    _hideKick() {
        this.parts.kickLeg.x = 14 * this.fighter.facing;
        this.parts.kickLeg.y = -15;
        this.parts.kickLeg.angle = 0;
        this.parts.kickLeg.setVisible(false);
        this.parts.kickLegImg.setScale(1, 1);
        this.parts.legsImg.setVisible(true);
    }

    _resetVerticalArm() {
        this.parts.armContainer.x = 22 * this.fighter.facing;
        this.parts.armContainer.y = -55;
        this.parts.armContainer.angle = 0;
        this.parts.armImg.setScale(1, 1);
    }

    resetPose() {
        this._resetVerticalArm();
        this._hidePunch();
        this._hideKick();
        this.setTorsoAngle(0);
        this.parts.head.x = 4 * this.fighter.facing;
        this.parts.torso.x = 2 * this.fighter.facing;
    }

    resetVisualState() {
        this.clearTints();
        this.resetPose();
    }

    playAttackStartup(type) {
        switch (type) {
            case ATTACK_TYPES.PUNCH:
            case ATTACK_TYPES.AIR_PUNCH:
                this._showPunch(0.1, 1);
                break;

            case ATTACK_TYPES.KICK:
            case ATTACK_TYPES.AIR_KICK:
                this._showKick(0.1, 1);
                break;

            case ATTACK_TYPES.RISING:
                this.parts.armImg.setScale(0.1, 1);
                break;

            case ATTACK_TYPES.SUPER:
                this._showPunch(0.18, 1.15);
                this.setTorsoAngle(6 * this.fighter.facing);
                break;
        }
    }

    playAttackActive(type) {
        switch (type) {
            case ATTACK_TYPES.PUNCH:
                this.scene.tweens.add({
                    targets: this.parts.armPunchImg,
                    scaleX: 1,
                    duration: GAME_CONFIG.attack.punch.activeFrames * 0.5,
                    ease: 'Power3'
                });
                break;

            case ATTACK_TYPES.KICK:
                this.scene.tweens.add({
                    targets: this.parts.kickLegImg,
                    scaleX: 1,
                    duration: GAME_CONFIG.attack.kick.activeFrames * 0.5,
                    ease: 'Power3'
                });
                break;

            case ATTACK_TYPES.RISING:
                this.scene.tweens.add({
                    targets: this.parts.armImg,
                    scaleX: 1,
                    duration: 200,
                    ease: 'Power3'
                });
                break;

            case ATTACK_TYPES.SUPER:
                this.scene.tweens.add({
                    targets: this.parts.armPunchImg,
                    scaleX: 1.55,
                    scaleY: 1.05,
                    duration: GAME_CONFIG.attack.super.activeFrames * 0.45,
                    ease: 'Cubic.easeOut'
                });
                break;

            case ATTACK_TYPES.AIR_PUNCH:
                this.scene.tweens.add({
                    targets: this.parts.armPunchImg,
                    scaleX: 1,
                    duration: GAME_CONFIG.attack.airpunch.activeFrames * 0.45,
                    ease: 'Power3'
                });
                break;

            case ATTACK_TYPES.AIR_KICK:
                this.scene.tweens.add({
                    targets: this.parts.kickLegImg,
                    scaleX: 1,
                    duration: GAME_CONFIG.attack.airkick.activeFrames * 0.45,
                    ease: 'Power3'
                });
                break;
        }
    }

    playAttackRecovery(type) {
        switch (type) {
            case ATTACK_TYPES.PUNCH:
            case ATTACK_TYPES.SUPER:
            case ATTACK_TYPES.AIR_PUNCH:
                this.scene.tweens.add({
                    targets: this.parts.armPunchImg,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 130,
                    ease: 'Power1',
                    onComplete: () => {
                        this._hidePunch();
                        this.setTorsoAngle(0);
                    }
                });
                break;

            case ATTACK_TYPES.KICK:
            case ATTACK_TYPES.AIR_KICK:
                this.scene.tweens.add({
                    targets: this.parts.kickLegImg,
                    scaleX: 1,
                    duration: 160,
                    ease: 'Power1',
                    onComplete: () => this._hideKick()
                });
                break;

            case ATTACK_TYPES.RISING:
                this.scene.tweens.add({
                    targets: this.parts.armImg,
                    scaleX: 1,
                    duration: 200,
                    ease: 'Power1'
                });
                break;
        }
    }
}