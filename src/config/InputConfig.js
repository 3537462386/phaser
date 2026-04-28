// ============================================
// Input bindings and help text
// ============================================

const INPUT_CONFIG = {
    players: {
        p1: {
            left: 'A',
            right: 'D',
            up: 'W',
            down: 'S',
            punch: 'J',
            kick: 'K',
            block: 'F',
        },
        p2: {
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            punch: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE,
            kick: Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO,
            block: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO,
        }
    },
    attackEvents: {
        p1: {
            punch: 'keydown-J',
            kick: 'keydown-K',
        },
        p2: {
            punch: 'keydown-NUMPAD_ONE',
            kick: 'keydown-NUMPAD_TWO',
        }
    },
    helpText: {
        p1: 'WASD移动 · J拳 · W+J升龙拳 · K踢 · F防御 · 空中J飞拳 · 空中K飞脚',
        p2: '方向键 · Num1拳 · ↑+Num1升龙 · Num2踢 · Num0防御',
    }
};