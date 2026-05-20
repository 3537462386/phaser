/**
 * BaseScene — 所有 UI 场景的基类
 * 提供：流动星空背景、返回菜单按钮
 */
class BaseScene extends Phaser.Scene {

    // ── 星空 ─────────────────────────────────────────────

    _initStarfield(count = 120) {
        this._starData = [];
        const palette = [0xffffff, 0xffffff, 0xffffff, 0x99bbff, 0xffbbff, 0xbbffff];
        for (let i = 0; i < count; i++) {
            this._starData.push({
                x: Phaser.Math.Between(0, 500),
                y: Phaser.Math.Between(0, 700),
                r: Phaser.Math.FloatBetween(0.4, 2.2),
                a: Phaser.Math.FloatBetween(0.25, 1.0),
                spd: Phaser.Math.FloatBetween(0.15, 1.0),
                col: palette[Math.floor(Math.random() * palette.length)]
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
            this._starGfx.fillStyle(s.col, s.a);
            this._starGfx.fillCircle(s.x, s.y, s.r);
        }
    }

    // ── 返回按钮 ──────────────────────────────────────────

    _addBackButton(target = 'MenuScene') {
        const gfx = this.add.graphics();
        const draw = (hover) => {
            gfx.clear();
            gfx.fillStyle(hover ? 0x112255 : 0x050f22, 0.9);
            gfx.fillRoundedRect(28, 628, 136, 46, 8);
            gfx.lineStyle(1, 0x4488ff, hover ? 1 : 0.5);
            gfx.strokeRoundedRect(28, 628, 136, 46, 8);
        };
        draw(false);

        const txt = this.add.text(96, 651, '← 返回菜单', {
            fontSize: '14px', fontFamily: 'Arial', fill: '#7799cc'
        }).setOrigin(0.5);

        const hit = this.add.rectangle(96, 651, 136, 46)
            .setInteractive({ cursor: 'pointer' });
        hit.on('pointerover', () => { draw(true); txt.setStyle({ fill: '#ffffff' }); });
        hit.on('pointerout',  () => { draw(false); txt.setStyle({ fill: '#7799cc' }); });
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
