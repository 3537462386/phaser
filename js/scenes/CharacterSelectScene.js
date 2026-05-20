/**
 * CharacterSelectScene — 角色选择场景
 * 展示 3 个角色卡片，选中后跳转 GameScene
 */
class CharacterSelectScene extends BaseScene {

    constructor() {
        super({ key: 'CharacterSelectScene' });
    }

    create() {
        this._initStarfield(100);
        this._drawHeader();
        this._drawCards();
        this._addBackButton('MenuScene');
        this._fadeIn(300);
    }

    update() {
        this._tickStars();
    }

    // ── 标题 ──────────────────────────────────────────

    _drawHeader() {
        this.add.text(250, 44, '选择飞行员', {
            fontSize: '32px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#e8f4ff', stroke: '#1155ee', strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(250, 88, 'SELECT YOUR PILOT', {
            fontSize: '11px', fontFamily: 'Arial', fill: '#2244aa'
        }).setOrigin(0.5);

        const dg = this.add.graphics();
        dg.lineStyle(1, 0x2255aa, 0.4);
        dg.lineBetween(50, 112, 450, 112);
    }

    // ── 角色卡片 ──────────────────────────────────────

    _drawCards() {
        const CARD_W = 140, CARD_H = 330;
        const positions = [
            { x: 100, y: 390 },
            { x: 250, y: 390 },
            { x: 400, y: 390 }
        ];
        CHARACTER_DATA.forEach((char, i) => {
            this._makeCard(positions[i].x, positions[i].y, CARD_W, CARD_H, char);
        });
    }

    _makeCard(cx, cy, W, H, char) {
        const x0 = cx - W / 2, y0 = cy - H / 2;
        const accent = char.tint;

        const gfx = this.add.graphics();
        const draw = (hover) => {
            gfx.clear();
            if (hover) {
                gfx.lineStyle(1.5, accent, 0.3);
                gfx.strokeRoundedRect(x0 - 4, y0 - 4, W + 8, H + 8, 14);
            }
            gfx.fillStyle(hover ? 0x081428 : 0x040a14, 0.95);
            gfx.fillRoundedRect(x0, y0, W, H, 10);
            gfx.lineStyle(1.5, accent, hover ? 0.9 : 0.35);
            gfx.strokeRoundedRect(x0, y0, W, H, 10);
        };
        draw(false);

        // 大图标
        const iconTxt = this.add.text(cx, y0 + 44, char.icon, {
            fontSize: '52px'
        }).setOrigin(0.5);

        // 名称
        const nameTxt = this.add.text(cx, y0 + 104, char.name, {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#e8f4ff'
        }).setOrigin(0.5);

        // 描述
        const descTxt = this.add.text(cx, y0 + 134, char.description, {
            fontSize: '11px', fontFamily: 'Arial', fill: '#4466aa',
            wordWrap: { width: W - 16 }, align: 'center'
        }).setOrigin(0.5, 0);

        // 分割线
        const lineGfx = this.add.graphics();
        lineGfx.lineStyle(1, accent, 0.3);
        lineGfx.lineBetween(x0 + 12, y0 + 180, x0 + W - 12, y0 + 180);

        // 属性列表
        const stats = [
            { label: '移速', value: this._barVal(char.speed, 100, 500), color: 0x44ffcc },
            { label: 'HP',   value: this._barVal(char.maxHp, 0, 6),    color: 0xff4466 },
            { label: '射速', value: 1 - this._barVal(char.fireCooldown, 150, 400), color: 0xffee44 },
        ];
        stats.forEach((s, i) => {
            const sy = y0 + 192 + i * 34;
            this.add.text(x0 + 12, sy, s.label, {
                fontSize: '11px', fontFamily: 'Arial', fill: '#6677aa'
            });
            const barX = x0 + 46, barW = W - 58;
            const bg = this.add.graphics();
            bg.fillStyle(0x0d1e33, 1);
            bg.fillRoundedRect(barX, sy + 1, barW, 9, 4);
            const fill = this.add.graphics();
            fill.fillStyle(s.color, 0.85);
            fill.fillRoundedRect(barX, sy + 1, barW * s.value, 9, 4);
        });

        // 起始武器
        const startWd = WEAPON_DATA[char.startWeapon];
        this.add.text(cx, y0 + H - 30, `初始武器: ${startWd.icon}${startWd.name}`, {
            fontSize: '11px', fontFamily: 'Arial', fill: '#556677'
        }).setOrigin(0.5);

        // 点击区域
        const hit = this.add.rectangle(cx, cy, W, H).setInteractive({ cursor: 'pointer' });

        hit.on('pointerover', () => {
            draw(true);
            nameTxt.setStyle({ fill: '#ffffff' });
            this.tweens.add({ targets: iconTxt, scaleX: 1.12, scaleY: 1.12, duration: 100, ease: 'Power2' });
        });
        hit.on('pointerout', () => {
            draw(false);
            nameTxt.setStyle({ fill: '#e8f4ff' });
            this.tweens.add({ targets: iconTxt, scaleX: 1, scaleY: 1, duration: 100, ease: 'Power2' });
        });
        hit.on('pointerdown', () => {
            GameState.selectedCharacter = char;
            this.cameras.main.fadeOut(220, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene'));
        });
    }

    /** 将值归一化到 [0,1] */
    _barVal(v, min, max) {
        return Math.max(0, Math.min(1, (v - min) / (max - min)));
    }
}
