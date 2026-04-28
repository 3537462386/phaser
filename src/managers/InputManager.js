// =============================================
// 输入管理器 - 处理键盘输入
// =============================================

class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.keysP1 = null;
        this.keysP2 = null;
        this.attackCallbacks = {};
    }

    // 初始化输入
    init() {
        this.setupP1Keys();
        this.setupP2Keys();
        this.setupAttackListeners();
    }

    _createKeyState(playerId) {
        const bindings = GAME_CONFIG.input.players[playerId];
        const keyState = {};

        for (const [action, binding] of Object.entries(bindings)) {
            keyState[action] = this.scene.input.keyboard.addKey(binding);
        }

        return keyState;
    }

    _registerAttackListener(playerId, action, callbackName) {
        const eventName = GAME_CONFIG.input.attackEvents[playerId][action];

        this.scene.input.keyboard.on(eventName, () => {
            if (this.attackCallbacks[callbackName]) {
                this.attackCallbacks[callbackName]();
            }
        });
    }

    // P1 按键配置 (WASD + J/K/F)
    setupP1Keys() {
        this.keysP1 = this._createKeyState(PLAYER_IDS.P1);
    }

    // P2 按键配置 (方向键 + 小键盘)
    setupP2Keys() {
        this.keysP2 = this._createKeyState(PLAYER_IDS.P2);
    }

    // 设置攻击监听
    setupAttackListeners() {
        this._registerAttackListener(PLAYER_IDS.P1, 'punch', 'onP1Punch');
        this._registerAttackListener(PLAYER_IDS.P1, 'kick', 'onP1Kick');
        this._registerAttackListener(PLAYER_IDS.P2, 'punch', 'onP2Punch');
        this._registerAttackListener(PLAYER_IDS.P2, 'kick', 'onP2Kick');
    }

    // 注册攻击回调
    onAttack(callbacks) {
        this.attackCallbacks = { ...this.attackCallbacks, ...callbacks };
    }

    // 获取 P1 按键状态
    getP1Keys() {
        return this.keysP1;
    }

    // 获取 P2 按键状态
    getP2Keys() {
        return this.keysP2;
    }

    // 解析攻击类型
    /**
     * 根据当前状态决定实际触发的技能：
     *  - 地面 + 拳键 + 上键 → 升龙拳
     *  - 地面 + 拳键         → 普通拳
     *  - 地面 + 踢键         → 普通踢
     *  - 空中 + 拳键         → 飞拳
     *  - 空中 + 踢键         → 飞脚
     */
    resolveAttack(fighter, key, keys) {
        if (fighter.attackState !== ATTACK_STATES.IDLE || fighter.isHit) return null;
        const onGround = fighter.isOnGround();

        let type;
        if (key === ATTACK_TYPES.PUNCH) {
            if (onGround && GAME_CONFIG.rage.superEnabled && keys.down.isDown && fighter.rage >= GAME_CONFIG.rage.superCost) {
                type = ATTACK_TYPES.SUPER;       // 满怒必杀
            } else if (onGround && keys.up.isDown) {
                type = ATTACK_TYPES.RISING;      // 升龙拳
            } else if (onGround) {
                type = ATTACK_TYPES.PUNCH;       // 普通拳
            } else {
                type = ATTACK_TYPES.AIR_PUNCH;   // 飞拳
            }
        } else { // kick
            if (onGround) {
                type = ATTACK_TYPES.KICK;        // 普通踢
            } else {
                type = ATTACK_TYPES.AIR_KICK;    // 飞脚
            }
        }
        return type;
    }

    // 处理移动
    processMovement(fighter, keys) {
        const body     = fighter.body;
        const onGround = fighter.isOnGround();
        const canMove  = fighter.attackState === ATTACK_STATES.IDLE && !fighter.isHit;

        if (keys.left.isDown && canMove) {
            body.setVelocityX(-GAME_CONFIG.playerSpeed);
        } else if (keys.right.isDown && canMove) {
            body.setVelocityX(GAME_CONFIG.playerSpeed);
        } else if (!fighter.isHit && fighter.attackType !== ATTACK_TYPES.RISING) {
            body.setVelocityX(body.velocity.x * 0.78);
        }

        if (keys.up.isDown && onGround && canMove) {
            body.setVelocityY(GAME_CONFIG.jumpForce);
        }

        // 防御只在地面
        const wantBlock = keys.block.isDown && onGround && canMove;
        fighter.setBlockVisual(wantBlock);
    }
}
