class SettingsScene extends BaseScene {

    constructor() {
        super({ key: 'SettingsScene' });
        // 全局设置状态（跨场景可用）
        if (!window.gameSettings) {
            window.gameSettings = {
                bgmVolume:       5,
                sfxVolume:       8,
                difficulty:      1,   // 0=简单 1=普通 2=困难
                bulletPenetrate: false
            };
        }
    }

    create() {
        this._cfg = window.gameSettings;
        this._initStarfield(90);
        this._drawHeader();
        this._drawAllSettings();
        this._addBackButton();
        this._fadeIn(300);
    }

    update() {
        this._tickStars();
    }

    // ── 顶部标题 ──────────────────────────────────────────

    _drawHeader() {
        this.add.text(250, 46, '⚙  游戏设置', {
            fontSize: '30px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#44dd88', stroke: '#117744', strokeThickness: 3
        }).setOrigin(0.5);

        const g = this.add.graphics();
        g.lineStyle(1, 0x117744, 0.4);
        g.lineBetween(50, 78, 450, 78);
    }

    // ── 设置项 ────────────────────────────────────────────

    _drawAllSettings() {
        this._makeVolumeRow(250, 148, '背景音乐音量', 'bgmVolume');
        this._makeVolumeRow(250, 268, '音效音量',     'sfxVolume');
        this._makeDifficultyRow(250, 390);
        this._makePenetrateRow(250, 490);
    }

    // 音量行：[−]  ████░░░  [+]  数值
    _makeVolumeRow(cx, cy, labelStr, key) {
        // 行标签
        this.add.text(cx, cy - 28, labelStr, {
            fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#88bbdd'
        }).setOrigin(0.5);

        const BAR_W = 220, BAR_H = 10, MAX = 10;
        const barX = cx - BAR_W / 2;

        // 轨道背景
        const trackGfx = this.add.graphics();
        trackGfx.fillStyle(0x0d1e33, 1);
        trackGfx.fillRoundedRect(barX, cy - BAR_H / 2, BAR_W, BAR_H, 5);
        trackGfx.lineStyle(1, 0x224466, 0.7);
        trackGfx.strokeRoundedRect(barX, cy - BAR_H / 2, BAR_W, BAR_H, 5);

        // 填充条
        const fillGfx = this.add.graphics();
        const drawFill = (val) => {
            fillGfx.clear();
            if (val <= 0) return;
            const fw = (val / MAX) * BAR_W;
            fillGfx.fillStyle(0x2288ff, 0.85);
            fillGfx.fillRoundedRect(barX, cy - BAR_H / 2, fw, BAR_H, 5);
        };
        drawFill(this._cfg[key]);

        // 数值文字
        const valTxt = this.add.text(cx + BAR_W / 2 + 36, cy, String(this._cfg[key]), {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#ffffff'
        }).setOrigin(0.5);

        const update = (delta) => {
            this._cfg[key] = Phaser.Math.Clamp(this._cfg[key] + delta, 0, MAX);
            drawFill(this._cfg[key]);
            valTxt.setText(String(this._cfg[key]));
        };

        // [−] 按钮
        this._makeSmallBtn(barX - 26, cy, '−', () => update(-1), 0xff5544);
        // [+] 按钮
        this._makeSmallBtn(cx + BAR_W / 2 + 72, cy, '+', () => update(+1), 0x44cc66);
    }

    _makeSmallBtn(x, y, symbol, onTap, color) {
        const gfx = this.add.graphics();
        const draw = (hover) => {
            gfx.clear();
            gfx.fillStyle(hover ? color : 0x0d1e33, hover ? 0.5 : 0.9);
            gfx.fillRoundedRect(x - 18, y - 16, 36, 32, 6);
            gfx.lineStyle(1, color, hover ? 0.9 : 0.45);
            gfx.strokeRoundedRect(x - 18, y - 16, 36, 32, 6);
        };
        draw(false);
        this.add.text(x, y, symbol, {
            fontSize: '20px', fontFamily: 'Arial', fill: '#ccddee'
        }).setOrigin(0.5);
        const hit = this.add.rectangle(x, y, 36, 32).setInteractive({ cursor: 'pointer' });
        hit.on('pointerover', () => draw(true));
        hit.on('pointerout',  () => draw(false));
        hit.on('pointerdown', onTap);
    }

    // 难度行：[简单] [普通] [困难]
    _makeDifficultyRow(cx, cy) {
        this.add.text(cx, cy - 30, '游戏难度', {
            fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#88bbdd'
        }).setOrigin(0.5);

        const options   = ['简单', '普通', '困难'];
        const accents   = [0x44cc66, 0xffaa22, 0xff4444];
        const btnWidth  = 96, btnHeight = 42, gap = 12;
        const totalW    = options.length * btnWidth + (options.length - 1) * gap;
        const startX    = cx - totalW / 2;
        const gfxList   = [];

        const drawAll = () => {
            gfxList.forEach((g, i) => {
                const bx = startX + i * (btnWidth + gap);
                const sel = (i === this._cfg.difficulty);
                g.clear();
                g.fillStyle(sel ? accents[i] : 0x0d1e33, sel ? 0.35 : 0.7);
                g.fillRoundedRect(bx, cy - btnHeight / 2, btnWidth, btnHeight, 7);
                g.lineStyle(1, accents[i], sel ? 0.95 : 0.3);
                g.strokeRoundedRect(bx, cy - btnHeight / 2, btnWidth, btnHeight, 7);
            });
        };

        options.forEach((opt, i) => {
            const bx = startX + i * (btnWidth + gap);
            const g = this.add.graphics();
            gfxList.push(g);

            this.add.text(bx + btnWidth / 2, cy, opt, {
                fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#ddeeff'
            }).setOrigin(0.5);

            const hit = this.add.rectangle(bx + btnWidth / 2, cy, btnWidth, btnHeight)
                .setInteractive({ cursor: 'pointer' });
            hit.on('pointerdown', () => {
                this._cfg.difficulty = i;
                drawAll();
            });
        });

        drawAll();
    }

    // 穿透开关行
    _makePenetrateRow(cx, cy) {
        this.add.text(cx - 80, cy, '子弹穿透', {
            fontSize: '15px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#88bbdd'
        }).setOrigin(0, 0.5);

        const TW = 64, TH = 30, tx = cx + 56, ty = cy;
        const gfx = this.add.graphics();

        const draw = () => {
            const on = this._cfg.bulletPenetrate;
            gfx.clear();
            gfx.fillStyle(on ? 0x33cc77 : 0x223344, 0.9);
            gfx.fillRoundedRect(tx, ty - TH / 2, TW, TH, TH / 2);
            gfx.lineStyle(1, on ? 0x55ff99 : 0x334455, 0.8);
            gfx.strokeRoundedRect(tx, ty - TH / 2, TW, TH, TH / 2);
            // 滑块圆点
            gfx.fillStyle(0xffffff, 1);
            const knobX = on ? tx + TW - TH / 2 : tx + TH / 2;
            gfx.fillCircle(knobX, ty, TH / 2 - 3);
        };
        draw();

        // ON / OFF 文字提示
        const hint = this.add.text(tx + TW + 14, cy, this._cfg.bulletPenetrate ? '开' : '关', {
            fontSize: '14px', fontFamily: 'Arial', fill: '#aabbcc'
        }).setOrigin(0, 0.5);

        const hit = this.add.rectangle(tx + TW / 2, ty, TW, TH)
            .setInteractive({ cursor: 'pointer' });
        hit.on('pointerdown', () => {
            this._cfg.bulletPenetrate = !this._cfg.bulletPenetrate;
            draw();
            hint.setText(this._cfg.bulletPenetrate ? '开' : '关');
        });
    }
}
