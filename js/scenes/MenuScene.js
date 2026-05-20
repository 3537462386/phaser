class MenuScene extends BaseScene {

    create() {
        this._initStarfield(140);
        this._drawPlanet();
        this._drawNebula();
        this._drawTitle();
        this._drawButtons();
        this._drawFooter();
        this._fadeIn(400);
    }

    update() {
        this._tickStars();
    }

    // ── 背景装饰 ──────────────────────────────────────────

    _drawNebula() {
        const g = this.add.graphics();
        // 左下角朦胧蓝紫色星云
        const steps = [[0x1133aa, 0.06], [0x2244bb, 0.04], [0x3355cc, 0.03]];
        steps.forEach(([c, a]) => {
            g.fillStyle(c, a);
            g.fillEllipse(60, 620, 220, 160);
        });
        // 右上角橙红色星云
        [[0xaa4411, 0.05], [0xbb5522, 0.04]].forEach(([c, a]) => {
            g.fillStyle(c, a);
            g.fillEllipse(460, 80, 180, 140);
        });
    }

    _drawPlanet() {
        const g = this.add.graphics();
        // 光晕
        for (let r = 160; r >= 20; r -= 20) {
            g.fillStyle(0x0d1f44, 0.035);
            g.fillCircle(430, 590, r);
        }
        // 星球本体
        g.fillStyle(0x152d50, 0.6);
        g.fillCircle(430, 590, 100);
        g.fillStyle(0x1e3d6a, 0.4);
        g.fillCircle(400, 568, 72);
        // 表面纹理
        g.lineStyle(1, 0x2a5080, 0.25);
        g.strokeEllipse(430, 590, 170, 28);
        g.strokeEllipse(430, 590, 210, 18);
        // 光环
        g.lineStyle(2, 0x2255bb, 0.18);
        g.strokeEllipse(430, 590, 310, 48);
    }

    // ── 标题区 ────────────────────────────────────────────

    _drawTitle() {
        // 大标题背景光晕
        const halo = this.add.graphics();
        halo.fillStyle(0x0044cc, 0.07);
        halo.fillEllipse(250, 115, 420, 130);

        // 阴影层（模拟发光）
        this.add.text(253, 100, '太空射击', {
            fontSize: '56px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#001166'
        }).setOrigin(0.5).setAlpha(0.5);

        // 主标题
        const title = this.add.text(250, 97, '太空射击', {
            fontSize: '56px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#e8f4ff',
            stroke: '#1155ee', strokeThickness: 5
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title, scaleX: 1.025, scaleY: 1.025,
            duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });

        // 英文副标题
        this.add.text(250, 160, 'S · P · A · C · E   S · H · O · O · T · E · R', {
            fontSize: '11px', fontFamily: 'Arial', fill: '#4466aa'
        }).setOrigin(0.5);

        // 装饰分割线
        const dg = this.add.graphics();
        dg.lineStyle(1, 0x2255aa, 0.5);
        dg.lineBetween(75, 182, 200, 182);
        dg.lineBetween(300, 182, 425, 182);
        this.add.text(250, 182, '✦', { fontSize: '13px', fill: '#334d88' }).setOrigin(0.5);
    }

    // ── 菜单按钮 ──────────────────────────────────────────

    _drawButtons() {
        [
            { label: '开始游戏', sub: 'START GAME',   icon: '🚀', target: 'GameScene',          accent: 0x2277ff },
            { label: '成    就',  sub: 'ACHIEVEMENTS', icon: '🏆', target: 'AchievementsScene', accent: 0xffaa22 },
            { label: '游戏设置', sub: 'SETTINGS',     icon: '⚙',  target: 'SettingsScene',     accent: 0x33cc77 },
        ].forEach((item, i) => this._makeButton(250, 272 + i * 90, item));
    }

    _makeButton(cx, cy, { label, sub, icon, target, accent }) {
        const W = 310, H = 68;
        const x0 = cx - W / 2, y0 = cy - H / 2;

        const gfx = this.add.graphics();
        const draw = (hover) => {
            gfx.clear();
            if (hover) {                          // 外层辉光
                gfx.lineStyle(1, accent, 0.25);
                gfx.strokeRoundedRect(x0 - 4, y0 - 4, W + 8, H + 8, 12);
            }
            gfx.fillStyle(hover ? 0x0a1a38 : 0x050e1e, 0.92);
            gfx.fillRoundedRect(x0, y0, W, H, 9);
            gfx.lineStyle(1, accent, hover ? 0.9 : 0.35);
            gfx.strokeRoundedRect(x0, y0, W, H, 9);
            gfx.fillStyle(accent, hover ? 1 : 0.55);
            gfx.fillRoundedRect(x0, y0 + 12, 4, H - 24, 2);
        };
        draw(false);

        const ox = { icon: x0 + 36, label: x0 + 118, sub: x0 + 119, chev: x0 + W - 22 };

        const iconTxt  = this.add.text(ox.icon,  cy,      icon,  { fontSize: '26px' }).setOrigin(0.5);
        const labelTxt = this.add.text(ox.label, cy - 9,  label, { fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold', fill: '#ddeeff' }).setOrigin(0, 0.5);
        const subTxt   = this.add.text(ox.sub,   cy + 12, sub,   { fontSize: '10px', fontFamily: 'Arial', fill: '#3d5a88' }).setOrigin(0, 0.5);
        const chevTxt  = this.add.text(ox.chev,  cy,      '›',   { fontSize: '26px', fontFamily: 'Arial', fill: '#2d3f66' }).setOrigin(0.5);

        const allTxt = [iconTxt, labelTxt, subTxt, chevTxt];

        const hit = this.add.rectangle(cx, cy, W, H).setInteractive({ cursor: 'pointer' });

        hit.on('pointerover', () => {
            draw(true);
            labelTxt.setStyle({ fill: '#ffffff' });
            chevTxt.setStyle({ fill: '#99bbee' });
            this.tweens.killTweensOf(allTxt);
            this.tweens.add({ targets: iconTxt,  x: ox.icon  + 6, duration: 90, ease: 'Power2' });
            this.tweens.add({ targets: labelTxt, x: ox.label + 6, duration: 90, ease: 'Power2' });
            this.tweens.add({ targets: subTxt,   x: ox.sub   + 6, duration: 90, ease: 'Power2' });
            this.tweens.add({ targets: chevTxt,  x: ox.chev  + 6, duration: 90, ease: 'Power2' });
        });

        hit.on('pointerout', () => {
            draw(false);
            labelTxt.setStyle({ fill: '#ddeeff' });
            chevTxt.setStyle({ fill: '#2d3f66' });
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
        this.add.text(250, 668, '← → ↑ ↓  移动飞船   |   空格  射击', {
            fontSize: '11px', fontFamily: 'Arial', fill: '#263850'
        }).setOrigin(0.5);
        this.add.text(250, 684, 'v1.0.0', {
            fontSize: '10px', fontFamily: 'Arial', fill: '#1e2d3d'
        }).setOrigin(0.5);
    }
}
