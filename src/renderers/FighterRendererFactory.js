// =============================================
// Fighter renderer factory
// =============================================

class FighterRendererFactory {
    static create(fighter) {
        if (fighter.getRenderMode() !== 'spine') {
            fighter.setRenderMode('spine');
        }

        return new SpineFighterRenderer(fighter);
    }

    static loadAssets(scene, mode = GAME_CONFIG.render.mode) {
        if (mode !== 'spine') {
            throw new Error(`Unsupported render mode: ${mode}`);
        }

        SpineFighterRenderer.loadAssets(scene);
    }
}