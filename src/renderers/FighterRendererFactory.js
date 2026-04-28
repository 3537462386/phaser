// =============================================
// Fighter renderer factory
// =============================================

class FighterRendererFactory {
    static create(fighter) {
        switch (fighter.getRenderMode()) {
            case 'spine':
                if (GAME_CONFIG.render.spine.enabled) {
                    return new SpineFighterRenderer(fighter);
                }
                return new SvgFighterRenderer(fighter);

            case 'svg':
            default:
                return new SvgFighterRenderer(fighter);
        }
    }

    static loadAssets(scene, mode = GAME_CONFIG.render.mode) {
        switch (mode) {
            case 'spine':
                if (GAME_CONFIG.render.spine.enabled) {
                    SpineFighterRenderer.loadAssets(scene);
                    break;
                }

            case 'svg':
            default:
                SvgFighterRenderer.loadAssets(scene);
                break;
        }
    }
}