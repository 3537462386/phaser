/**
 * BaseScene — 赛博朋克基类
 * 提供：流动星空（带尾迹）、返回按钮（终端风格）、通用淡入
 */
class BaseScene extends Phaser.Scene {

    // ── 星空（赛博朋克版：带尾迹的流星） ──────────────

    _initStarfield(count = 120) {
        this._starData = [];
        const C = UITheme.colors;
        const palette = [0xffffff, 0xffffff, C.cyan, C.cyanBright, C.purple, C.shield];
        for (let i = 0; i < count; i++) {
            this._starData.push({
                x: Phaser.Math.Between(0, 500),
                y: Phaser.Math.Between(0, 700),
                r: Phaser.Math.FloatBetween(0.3, 1.8),
                a: Phaser.Math.FloatBetween(0.15, 0.8),
                spd: Phaser.Math.FloatBetween(0.1, 0.8),
                col: palette[Math.floor(Math.random() * palette.length)],
                trail: Phaser.Math.FloatBetween(0, 3)  // 尾迹长度
            });
        }
        this._starGfx = this.add.graphics();
    }

    _tickStars() {
        if (!this._starGfx) return;
        this._starGfx.clear();
        for (const s of this._starData) {
            s.y += s.spd;
            if (s.y > 706) {
                s.y = -4;
                s.x = Phaser.Math.Between(0, 500);
            }
            // 尾迹
            if (s.trail > 0.5) {
                this._starGfx.fillStyle(s.col, s.a * 0.3);
                this._starGfx.fillRect(s.x, s.y - s.trail * 2, Math.max(0.5, s.r * 0.5), s.trail * 2);
            }
            this._starGfx.fillStyle(s.col, s.a);
            this._starGfx.fillCircle(s.x, s.y, s.r);
        }
    }

    // ── 返回按钮（终端风格） ──────────────────────────────

    _addBackButton(target = 'MenuScene') {
        const T = UITheme;
        const C = T.colors;
        const gfx = this.add.graphics();
        const draw = (hover) => {
            gfx.clear();
            gfx.fillStyle(hover ? C.bgPanelLight : C.bgPanel, 0.9);
            gfx.fillRoundedRect(28, 628, 136, 46, 5);
            gfx.lineStyle(1, hover ? C.cyan : C.cyanDim, hover ? 1.0 : 0.4);
            gfx.strokeRoundedRect(28, 628, 136, 46, 5);
            // 左侧条
            gfx.fillStyle(C.cyan, hover ? 1.0 : 0.3);
            gfx.fillRect(29, 640, 2, 22);
        };
        draw(false);

        const txt = this.add.text(96, 651, '< BACK', {
            fontSize: '13px', fontFamily: T.font.family, fill: C.textSecondary
        }).setOrigin(0.5);

        const hit = this.add.rectangle(96, 651, 136, 46)
            .setInteractive({ cursor: 'pointer' });
        hit.on('pointerover', () => { draw(true); txt.setStyle({ fill: C.textAccent }); });
        hit.on('pointerout',  () => { draw(false); txt.setStyle({ fill: C.textSecondary }); });
        hit.on('pointerdown', () => {
            this.cameras.main.fadeOut(220, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(target));
        });
    }

    // ── 通用淡入 ─────────────────────────────────────────

    _fadeIn(ms = 350) {
        this.cameras.main.fadeIn(ms, 0, 0, 0);
    }
}
