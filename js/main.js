const config = {
    type: Phaser.AUTO,
    width: 500,
    height: 700,
    parent: 'gameContainer',
    backgroundColor: '#000033',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [MenuScene, CharacterSelectScene, GameScene, AchievementsScene, SettingsScene]
};

const game = new Phaser.Game(config);
