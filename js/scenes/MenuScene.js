/**
 * MenuScene — 赛博朋克主菜单
 *
 * 设计：霓虹标题、数据网格背景、全息面板按钮、等宽终端字体
 */
class MenuScene extends BaseScene {

    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        this._initStarfield(100);
        this._drawGrid();
        this._drawGlitchBars();
        this._drawTitle();
        this._drawButtons();
        this._drawFooter();
        this._fadeIn(400);
    }

    update() {
        this._tickStars();
    }

    // ── 数据网格背景 ──────────────────────────────────────────

    _drawGrid() {
        const T = UITheme;
        const C = T.colors;
        const g = this.add.graphics();

        // 深层背景
        g.fillStyle(C.bgDarkest, 0.95);
        g.fillRect(0, 0, 500, 700);

        // 网格线
        g.lineStyle(0.5, C.cyanDim, 0.12);
        for (let x = 0; x <= 500; x += 40) {
            g.lineBetween(x, 0, x, 700);
        }
        for (let y = 0; y <= 700; y += 40) {
            g.lineBetween(0, y, 500, y);
        }

        // 中心聚焦光晕
        g.fillStyle(C.cyanDark, 0.15);
        g.fillEllipse(250, 350, 300, 400);
    }

    // ── 故障条装饰 ──────────────────────────────────────────

    _drawGlitchBars() {
        const g = this.add.graphics();
        const C = UITheme.colors;

        // 随机水平故障条
        const yPositions = [180, 350, 520, 650];
        yPositions.forEach(y => {
            const x = Phaser.Math.Between(0, 400);
            const w = Phaser.Math.Between(20, 80);
            g.fillStyle(C.cyan, Phaser.Math.FloatBetween(0.03, 0.08));
            g.fillRect(x, y, w, 1);
        });
    }

    // ── 标题区 ────────────────────────────────────────────

    _drawTitle() {
        const T = UITheme;
        const C = T.colors;

        // 光晕
        const halo = this.add.graphics();
        halo.fillStyle(C.cyanDark, 0.12);
        halo.fillEllipse(250, 110, 380, 120);

        // 主标题 — 赛博朋克终端风格
        const title = this.add.text(250, 95, 'VOID SHOOTER', {
            fontSize: '44px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textAccent, stroke: '#001a11', strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title, scaleX: 1.02, scaleY: 1.02,
            duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // 副标题 — 系统版本号风格
        this.add.text(250, 145, 'v2.0.77 // SPACE-ROGUE PROTOCOL', {
            fontSize: '10px', fontFamily: T.font.family, fill: C.textDim
        }).setOrigin(0.5);

        // 装饰线
        const dg = this.add.graphics();
        dg.fillStyle(C.cyan, 0.35);
        dg.fillRect(60, 170, 160, 1);
        dg.fillRect(280, 170, 160, 1);
        // 中心菱形
        dg.fillStyle(C.cyan, 0.5);
        dg.fillRect(247, 167, 6, 6);
    }

    // ── 菜单按钮 ──────────────────────────────────────────

    _drawButtons() {
        [
            { label: 'DEPLOY',    sub: '// START MISSION',  icon: '>', target: 'CharacterSelectScene', accent: 0x00ffcc },
            { label: 'RECORDS',   sub: '// ACHIEVEMENTS',   icon: '#', target: 'AchievementsScene',     accent: 0xff8822 },
            { label: 'CONFIG',    sub: '// SETTINGS',       icon: '*', target: 'SettingsScene',         accent: 0x22ff88 },
        ].forEach((item, i) => this._makeButton(250, 260 + i * 85, item));
    }

    _makeButton(cx, cy, { label, sub, icon, target, accent }) {
        const T = UITheme;
        const C = T.colors;
        const W = 310, H = 66;
        const x0 = cx - W / 2, y0 = cy - H / 2;

        const gfx = this.add.graphics();
        const draw = (hover) => {
            gfx.clear();

            // 辉光
            if (hover) {
                gfx.lineStyle(2, accent, 0.2);
                gfx.strokeRoundedRect(x0 - 3, y0 - 3, W + 6, H + 6, 6);
            }

            // 背景
            gfx.fillStyle(hover ? C.bgPanelLight : C.bgPanel, 0.94);
            gfx.fillRoundedRect(x0, y0, W, H, 5);
            // 扫描线
            gfx.fillStyle(accent, 0.015);
            for (let sy = y0; sy < y0 + H; sy += 4) {
                gfx.fillRect(x0, sy, W, 1);
            }
            // 边框
            gfx.lineStyle(1.5, accent, hover ? 1.0 : 0.4);
            gfx.strokeRoundedRect(x0, y0, W, H, 5);

            // 左侧强调条
            gfx.fillStyle(accent, hover ? 1.0 : 0.5);
            gfx.fillRect(x0 + 1, y0 + 12, 4, H - 24);

            // 角落
            const cL = 8;
            gfx.lineStyle(1, accent, 0.4);
            gfx.lineBetween(x0, y0 + cL, x0 + cL, y0);
            gfx.lineBetween(x0 + W - cL, y0, x0 + W, y0 + cL);
            gfx.lineBetween(x0, y0 + H - cL, x0 + cL, y0 + H);
            gfx.lineBetween(x0 + W - cL, y0 + H, x0 + W, y0 + H - cL);
        };
        draw(false);

        const ox = { icon: x0 + 32, label: x0 + 60, sub: x0 + 61, chev: x0 + W - 22 };

        const iconTxt  = this.add.text(ox.icon,  cy,      icon,  { fontSize: '20px', fontFamily: T.font.family, fontStyle: 'bold', fill: '#' + accent.toString(16).padStart(6, '0') }).setOrigin(0.5);
        const labelTxt = this.add.text(ox.label, cy - 10, label, { fontSize: '18px', fontFamily: T.font.family, fontStyle: 'bold', fill: C.textPrimary }).setOrigin(0, 0.5);
        const subTxt   = this.add.text(ox.sub,   cy + 10, sub,   { fontSize: '10px', fontFamily: T.font.family, fill: C.textDim }).setOrigin(0, 0.5);
        const chevTxt  = this.add.text(ox.chev,  cy,      '>>',  { fontSize: '14px', fontFamily: T.font.family, fill: C.textDim }).setOrigin(0.5);

        const allTxt = [iconTxt, labelTxt, subTxt, chevTxt];

        const hit = this.add.rectangle(cx, cy, W, H).setInteractive({ cursor: 'pointer' });

        hit.on('pointerover', () => {
            draw(true);
            labelTxt.setStyle({ fill: '#ffffff' });
            chevTxt.setStyle({ fill: '#' + accent.toString(16).padStart(6, '0') });
            this.tweens.killTweensOf(allTxt);
            this.tweens.add({ targets: iconTxt,  x: ox.icon  + 6, duration: 90, ease: 'Power2' });
            this.tweens.add({ targets: labelTxt, x: ox.label + 6, duration: 90, ease: 'Power2' });
            this.tweens.add({ targets: subTxt,   x: ox.sub   + 6, duration: 90, ease: 'Power2' });
            this.tweens.add({ targets: chevTxt,  x: ox.chev  + 6, duration: 90, ease: 'Power2' });
        });

        hit.on('pointerout', () => {
            draw(false);
            labelTxt.setStyle({ fill: C.textPrimary });
            chevTxt.setStyle({ fill: C.textDim });
            this.tweens.killTweensOf(allTxt);
            this.tweens.add({ targets: iconTxt,  x: ox.icon,  duration: 90, ease: 'Power2' });
            this.tweens.add({ targets: labelTxt, x: ox.label, duration: 90, ease: 'Power2' });
            this.tweens.add({ targets: subTxt,   x: ox.sub,   duration: 90, ease: 'Power2' });
            this.tweens.add({ targets: chevTxt,  x: ox.chev,  duration: 90, ease: 'Power2' });
        });

        hit.on('pointerdown', () => {
            this.cameras.main.fadeOut(240, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(target));
        });
    }

    // ── 底部提示 ─────────────────────────────────────────

    _drawFooter() {
        const T = UITheme;
        const C = T.colors;
        this.add.text(250, 668, 'WASD // MOVE  |  SPACE // FIRE  |  ARROWS // ALT', {
            fontSize: '10px', fontFamily: T.font.family, fill: C.textDim
        }).setOrigin(0.5);
        this.add.text(250, 684, 'VOID SHOOTER v2.0.77 // Z.AI-CORP', {
            fontSize: '9px', fontFamily: T.font.family, fill: '#1a2a3a'
        }).setOrigin(0.5);
    }
}
