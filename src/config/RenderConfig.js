// ============================================
// Render and character config
// ============================================

const RENDER_CONFIG = {
    mode: 'spine',
    playerIds: {
        P1: 'p1',
        P2: 'p2',
    },
    colors: {
        P1: 0xff3355,
        P2: 0x3388ff,
        BLOCK_TINT: 0x8888aa,
        NORMAL_TINT: 0xffffff,
    },
    effectAnchors: {
        skill: { x: 0, y: -110 },
        block: { x: 0, y: -50 },
        hitSpark: { x: 0, y: -50 },
        damage: { x: 0, y: -95 },
        burst: { x: 0, y: -55 },
        flame: { x: 0, y: 0 },
        ko: { x: 0, y: 10 },
    },
    hitbox: {
        width: 40,
        height: 80,
        offsetX: -20,
        offsetY: -80,
    },
    spine: {
        enabled: true,
        pluginKey: 'SpinePlugin',
        sceneKey: 'spine',
        debug: false,
        assetKey: 'fighter_spineboy',
        jsonURL: 'assets/spine/spineboy/spineboy-pro.json',
        atlasURL: 'assets/spine/spineboy/spineboy-pma.atlas',
        preMultipliedAlpha: true,
        displayScale: 0.24,
        motionThreshold: 35,
        blockAlpha: 0.82,
        hitFlashAlpha: 0.65,
        offset: {
            x: 0,
            y: 0,
        },
        defaultMix: 0.08,
        animations: {
            idle: {
                name: 'idle',
                loop: true,
            },
            walk: {
                name: 'walk',
                loop: true,
            },
            jump: {
                name: 'jump',
                loop: false,
            },
            punch: {
                name: 'shoot',
                loop: false,
            },
            kick: {
                name: 'shoot',
                loop: false,
            },
            rising: {
                name: 'jump',
                loop: false,
            },
            airpunch: {
                name: 'shoot',
                loop: false,
            },
            airkick: {
                name: 'jump',
                loop: false,
            },
            super: {
                name: 'shoot',
                loop: false,
            },
        },
    }
};