/**
 * CharacterSelectScene — 机甲选择舱（赛博朋克风格）
 *
 * 展示 3 个机甲数据面板，选中后跳转 GameScene
 * 设计：数据面板、系统状态条、等宽终端字体、霓虹配色
 */
class CharacterSelectScene extends BaseScene {

    constructor() {
        super({ key: 'CharacterSelectScene' });
    }

    create() {
        this._initStarfield(80);
        this._drawGrid();
        this._drawHeader();
        this._drawCards();
        this._addBackButton('MenuScene');
        this._fadeIn(300);
    }

    update() {
        this._tickStars();
    }

    _drawGrid() {
        const C = UITheme.colors;
        const g = this.add.graphics();
        g.fillStyle(C.bgDarkest, 0.92);
        g.fillRect(0, 0, 500, 700);
        g.lineStyle(0.5, C.cyanDim, 0.08);
        for (let x = 0; x <= 500; x += 40) {
            g.lineBetween(x, 0, x, 700);
        }
        for (let y = 0; y <= 700; y += 40) {
            g.lineBetween(0, y, 500, y);
        }
    }

    _drawHeader() {
        const T = UITheme;
        const C = T.colors;

        this.add.text(250, 40, '// PILOT SELECTION', {
            fontSize: '26px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textAccent, stroke: '#001a11', strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(250, 76, 'SELECT YOUR MECH FRAME', {
            fontSize: '10px', fontFamily: T.font.family, fill: C.textDim
        }).setOrigin(0.5);

        const dg = this.add.graphics();
        dg.fillStyle(C.cyan, 0.25);
        dg.fillRect(50, 96, 400, 1);
    }

    _drawCards() {
        const CARD_W = 145, CARD_H = 370;
        const positions = [
            { x: 95,  y: 380 },
            { x: 250, y: 380 },
            { x: 405, y: 380 }
        ];
        CHARACTER_DATA.forEach((char, i) => {
            this._makeCard(positions[i].x, positions[i].y, CARD_W, CARD_H, char);
        });
    }

    _makeCard(cx, cy, W, H, char) {
        const T = UITheme;
        const C = UITheme.colors;
        const x0 = cx - W / 2, y0 = cy - H / 2;
        const accent = char.tint === 0xffffff ? 0x00ffcc : char.tint;

        const gfx = this.add.graphics();
        const draw = (hover) => {
            gfx.clear();

            // 辉光
            if (hover) {
                gfx.lineStyle(2, accent, 0.25);
                gfx.strokeRoundedRect(x0 - 3, y0 - 3, W + 6, H + 6, 8);
            }

            // 背景
            gfx.fillStyle(hover ? C.bgPanelLight : C.bgPanel, 0.96);
            gfx.fillRoundedRect(x0, y0, W, H, 5);
            // 扫描线
            gfx.fillStyle(accent, 0.015);
            for (let sy = y0; sy < y0 + H; sy += 4) {
                gfx.fillRect(x0, sy, W, 1);
            }
            // 边框
            gfx.lineStyle(1.5, accent, hover ? 1.0 : 0.4);
            gfx.strokeRoundedRect(x0, y0, W, H, 5);
            // 左侧条
            gfx.fillStyle(accent, hover ? 1.0 : 0.45);
            gfx.fillRect(x0 + 1, y0 + 14, 3, H - 28);

            // 角落
            const cL = 8;
            gfx.lineStyle(1, accent, 0.4);
            gfx.lineBetween(x0, y0 + cL, x0 + cL, y0);
            gfx.lineBetween(x0 + W - cL, y0, x0 + W, y0 + cL);
            gfx.lineBetween(x0, y0 + H - cL, x0 + cL, y0 + H);
            gfx.lineBetween(x0 + W - cL, y0 + H, x0 + W, y0 + H - cL);

            // 顶部色带
            gfx.fillStyle(accent, 0.35);
            gfx.fillRect(x0 + 12, y0 + 1, W - 24, 2);
        };
        draw(false);

        // FRAME标签
        this.add.text(cx, y0 + 14, 'FRAME', {
            fontSize: '8px', fontFamily: T.font.family, fill: C.textDim
        }).setOrigin(0.5).setDepth(6);

        // 大图标
        const iconTxt = this.add.text(cx, y0 + 48, char.icon, {
            fontSize: '44px'
        }).setOrigin(0.5);

        // 名称
        const nameTxt = this.add.text(cx, y0 + 98, char.name, {
            fontSize: '16px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textPrimary
        }).setOrigin(0.5);

        // 描述
        this.add.text(cx, y0 + 122, char.description, {
            fontSize: '10px', fontFamily: T.font.family, fill: C.textSecondary,
            wordWrap: { width: W - 20 }, align: 'center'
        }).setOrigin(0.5, 0);

        // 分割线
        const lineGfx = this.add.graphics();
        lineGfx.fillStyle(accent, 0.25);
        lineGfx.fillRect(x0 + 12, y0 + 168, W - 24, 1);

        // 属性列表 — 系统状态条
        const stats = [
            { label: 'SPD', value: this._barVal(char.speed, 100, 500), color: 0x00ffcc },
            { label: 'HULL', value: this._barVal(char.maxHp, 0, 6),    color: 0x22ff88 },
            { label: 'FIRE', value: 1 - this._barVal(char.fireCooldown, 150, 400), color: 0xffcc22 },
        ];
        stats.forEach((s, i) => {
            const sy = y0 + 182 + i * 34;
            this.add.text(x0 + 10, sy, s.label, {
                fontSize: '10px', fontFamily: T.font.family, fontStyle: 'bold',
                fill: '#' + s.color.toString(16).padStart(6, '0')
            }).setDepth(6);

            const barX = x0 + 46, barW = W - 58;
            // 背景
            const bg = this.add.graphics();
            bg.fillStyle(C.bgDarkest, 1);
            bg.fillRoundedRect(barX, sy + 2, barW, 8, 2);
            // 填充
            const fill = this.add.graphics();
            fill.fillStyle(s.color, 0.8);
            fill.fillRoundedRect(barX, sy + 2, barW * s.value, 8, 2);
            // 发光端
            fill.fillStyle(s.color, 0.4);
            fill.fillRect(barX + barW * s.value - 2, sy + 3, 1, 6);
        });

        // 起始武器
        const startWd = WEAPON_DATA[char.startWeapon];
        this.add.text(cx, y0 + H - 28, `WPN: ${startWd.name}`, {
            fontSize: '10px', fontFamily: T.font.family, fill: C.textDim
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
            nameTxt.setStyle({ fill: C.textPrimary });
            this.tweens.add({ targets: iconTxt, scaleX: 1, scaleY: 1, duration: 100, ease: 'Power2' });
        });
        hit.on('pointerdown', () => {
            GameState.selectedCharacter = char;
            this.cameras.main.fadeOut(220, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene'));
        });
    }

    _barVal(v, min, max) {
        return Math.max(0, Math.min(1, (v - min) / (max - min)));
    }
}
