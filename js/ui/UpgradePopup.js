/**
 * UpgradePopup — 升级选择弹窗（3 张升级牌）
 * 暂停物理 + 展示选项，选择后恢复游戏
 */
class UpgradePopup {
    constructor() {
        this._container = null;
        this._scene     = null;
        this._onSelect  = null;
    }

    /**
     * 显示升级弹窗
     * @param {Phaser.Scene} scene
     * @param {Array} options  - 来自 UpgradeManager.getOptions()
     * @param {Function} onSelect - (option) => void
     */
    show(scene, options, onSelect) {
        this._scene    = scene;
        this._onSelect = onSelect;

        // 暂停物理
        scene.physics.pause();

        // 半透明遮罩
        const overlay = scene.add.graphics().setDepth(50);
        overlay.fillStyle(0x000011, 0.75);
        overlay.fillRect(0, 0, 500, 700);

        // 标题
        const title = scene.add.text(250, 130, '选择升级', {
            fontSize: '30px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ffee44', stroke: '#443300', strokeThickness: 3
        }).setOrigin(0.5).setDepth(51);

        const sub = scene.add.text(250, 168, 'CHOOSE AN UPGRADE', {
            fontSize: '11px', fontFamily: 'Arial', fill: '#665500'
        }).setOrigin(0.5).setDepth(51);

        this._container = scene.add.container(0, 0).setDepth(51);
        this._container.add([overlay, title, sub]);

        // 绘制三张牌
        const CARD_W = 130, CARD_H = 180;
        const TOTAL  = options.length;
        const startX = 250 - ((TOTAL - 1) * 0.5) * (CARD_W + 16);

        for (let i = 0; i < TOTAL; i++) {
            const opt    = options[i];
            const cx     = startX + i * (CARD_W + 16);
            const cy     = 380;
            this._makeCard(cx, cy, CARD_W, CARD_H, opt);
        }
    }

    hide() {
        if (this._container) {
            this._container.destroy(true);
            this._container = null;
        }
        if (this._scene) {
            this._scene.physics.resume();
        }
    }

    _makeCard(cx, cy, W, H, option) {
        const scene = this._scene;
        const x0 = cx - W / 2, y0 = cy - H / 2;
        const accent = this._accentColor(option);

        const gfx = scene.add.graphics().setDepth(52);
        const draw = (hover) => {
            gfx.clear();
            if (hover) {
                gfx.lineStyle(1, accent, 0.3);
                gfx.strokeRoundedRect(x0 - 4, y0 - 4, W + 8, H + 8, 12);
            }
            gfx.fillStyle(hover ? 0x0a1a38 : 0x050e1e, 0.97);
            gfx.fillRoundedRect(x0, y0, W, H, 10);
            gfx.lineStyle(1.5, accent, hover ? 0.95 : 0.4);
            gfx.strokeRoundedRect(x0, y0, W, H, 10);
        };
        draw(false);

        // 图标
        const iconTxt = scene.add.text(cx, y0 + 38, option.icon, {
            fontSize: '32px'
        }).setOrigin(0.5).setDepth(53);

        // 名称
        const nameTxt = scene.add.text(cx, y0 + 85, option.label, {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ddeeff', wordWrap: { width: W - 12 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(53);

        // 描述
        const descTxt = scene.add.text(cx, y0 + 125, option.desc, {
            fontSize: '11px', fontFamily: 'Arial',
            fill: '#667799', wordWrap: { width: W - 16 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(53);

        const hit = scene.add.rectangle(cx, cy, W, H)
            .setInteractive({ cursor: 'pointer' })
            .setDepth(54);

        hit.on('pointerover', () => {
            draw(true);
            nameTxt.setStyle({ fill: '#ffffff' });
        });
        hit.on('pointerout', () => {
            draw(false);
            nameTxt.setStyle({ fill: '#ddeeff' });
        });
        hit.on('pointerdown', () => {
            this.hide();
            if (this._onSelect) this._onSelect(option);
        });

        this._container.add([gfx, iconTxt, nameTxt, descTxt, hit]);
    }

    _accentColor(option) {
        if (option.type === 'newWeapon')     return 0x44aaff;
        if (option.type === 'upgradeWeapon') return 0xffaa22;
        switch (option.id) {
            case 'speed':    return 0x44ffcc;
            case 'hp':       return 0xff4466;
            case 'cooldown': return 0xffee44;
            default:         return 0x6677aa;
        }
    }
}
