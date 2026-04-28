// =============================================
// 格斗游戏 - 入口文件
// =============================================

const useSpineRenderer = GAME_CONFIG.render.mode === 'spine' && GAME_CONFIG.render.spine.enabled;
const spineScenePlugins = [];

if (useSpineRenderer) {
    if (!window.SpinePlugin) {
        console.error('Spine 4.1 plugin script 未加载，无法启用 spine 渲染模式。');
    } else {
        spineScenePlugins.push({
            key: GAME_CONFIG.render.spine.pluginKey,
            plugin: window.SpinePlugin,
            mapping: GAME_CONFIG.render.spine.sceneKey,
        });
    }
}

const config = {
    type: useSpineRenderer ? Phaser.WEBGL : Phaser.AUTO,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    parent: 'game-container',
    backgroundColor: '#0a0020',
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: GAME_CONFIG.gravity }, 
            debug: false 
        }
    },
    ...(spineScenePlugins.length ? { plugins: { scene: spineScenePlugins } } : {}),
    scene: FightScene
};

// 启动游戏
const game = new Phaser.Game(config);
