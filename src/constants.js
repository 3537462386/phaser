// ============================================
// 格斗游戏 - 常量聚合入口
// ============================================

const GAME_CONFIG = {
    ...RUNTIME_CONFIG,
    attack: COMBAT_CONFIG.attack,
    blockReduction: COMBAT_CONFIG.blockReduction,
    rage: COMBAT_CONFIG.rage,
    input: INPUT_CONFIG,
    render: {
        mode: RENDER_CONFIG.mode,
        effectAnchors: RENDER_CONFIG.effectAnchors,
        hitbox: RENDER_CONFIG.hitbox,
        spine: RENDER_CONFIG.spine,
    }
};

const ATTACK_NAMES = COMBAT_CONFIG.attackNames;
const ATTACK_TYPES = COMBAT_CONFIG.attackTypes;
const ATTACK_STATES = COMBAT_CONFIG.attackStates;
const PLAYER_IDS = RENDER_CONFIG.playerIds;
const COLORS = RENDER_CONFIG.colors;