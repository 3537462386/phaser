/**
 * GameHUD — 游戏内 HUD
 * 显示：HP（爱心），等级，EXP进度条，计时，击杀数，武器图标
 */
class GameHUD {
    constructor() {
        this.scene   = null;
        this._hearts = [];
        this._expBar = null;
        this._expFill= null;
        this._levelTxt        = null;
        this._timeTxt         = null;
        this._killTxt         = null;
        this._killProgressTxt = null;
        this._killBarFill     = null;
        this._goldTxt         = null;
        this._weaponIcons = [];
    }

    create(scene) {
        this.scene = scene;

        const depth = 20;

        // ── 左上：HP 爱心 ───────────────────────────────
        // 预创建 5 个爱心（最大 maxHp）
        for (let i = 0; i < 5; i++) {
            const t = scene.add.text(16 + i * 26, 16, '❤', {
                fontSize: '20px'
            }).setDepth(depth).setAlpha(0.2);
            this._hearts.push(t);
        }

        // ── 顶部中间：轮次 + 计时 ───────────────────────────────
        this._timeTxt = scene.add.text(250, 14, '第 1 轮 | 00:00', {
            fontSize: '15px', fontFamily: 'Arial',
            fill: '#aaccff', stroke: '#000022', strokeThickness: 3
        }).setOrigin(0.5, 0).setDepth(depth);

        // ── 右上：等级 + EXP 进度条 ──────────────────────
        this._levelTxt = scene.add.text(484, 14, 'Lv.1', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ffee44', stroke: '#443300', strokeThickness: 2
        }).setOrigin(1, 0).setDepth(depth);

        // EXP 条背景
        const barX = 340, barY = 34, barW = 144, barH = 6;
        this._expBar = scene.add.graphics().setDepth(depth);
        this._expBar.fillStyle(0x111133, 0.8);
        this._expBar.fillRoundedRect(barX, barY, barW, barH, 3);

        // EXP 填充（Graphics，每帧 clear+redraw）
        this._expFill = scene.add.graphics().setDepth(depth);
        this._expBarX = barX; this._expBarY = barY;
        this._expBarW = barW; this._expBarH = barH;

        // ── 击杀进度（左侧，HP 下方） ────────────────────────────
        const kbX = 16, kbY = 42, kbW = 280, kbH = 5;
        const killBarBg = scene.add.graphics().setDepth(depth);
        killBarBg.fillStyle(0x111122, 0.8);
        killBarBg.fillRoundedRect(kbX, kbY, kbW, kbH, 2);
        this._killBarFill = scene.add.graphics().setDepth(depth);
        this._kbX = kbX; this._kbY = kbY; this._kbW = kbW; this._kbH = kbH;

        this._killProgressTxt = scene.add.text(kbX, kbY - 14, '⚔ 0 / 20', {
            fontSize: '11px', fontFamily: 'Arial',
            fill: '#ff9944', stroke: '#110000', strokeThickness: 2
        }).setOrigin(0, 0).setDepth(depth);

        // ── 右下：总击杀数 ─────────────────────────────────────
        this._killTxt = scene.add.text(484, 686, '总击杀: 0', {
            fontSize: '12px', fontFamily: 'Arial',
            fill: '#667788', stroke: '#000011', strokeThickness: 2
        }).setOrigin(1, 1).setDepth(depth);

        // ── 左下：金币 ─────────────────────────────────────────
        this._goldTxt = scene.add.text(16, 686, '💰 0', {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ffcc44', stroke: '#221100', strokeThickness: 2
        }).setOrigin(0, 1).setDepth(depth);

        // ── 底部：武器图标区域（最多 6 个） ─────────────
        this._weaponContainer = scene.add.container(0, 0).setDepth(depth);
    }

    /**
     * 每帧更新
     * @param {object} data - { hp, maxHp, level, expProgress, elapsedSec, killCount, weapons, round, roundKills, killTarget, gold }
     */
    update(data) {
        const { hp, maxHp, level, expProgress, elapsedSec, killCount, weapons,
                round = 1, roundKills = 0, killTarget = 20, gold = 0 } = data;

        // HP 爱心
        for (let i = 0; i < this._hearts.length; i++) {
            this._hearts[i].setAlpha(i < maxHp ? 1 : 0);
            this._hearts[i].setStyle({ fill: i < hp ? '#ff4444' : '#444444' });
        }

        // 等级
        if (this._levelTxt) this._levelTxt.setText(`Lv.${level}`);

        // EXP 条
        if (this._expFill) {
            this._expFill.clear();
            const w = Math.max(0, Math.min(1, expProgress)) * this._expBarW;
            if (w > 0) {
                this._expFill.fillStyle(0x44ffaa, 0.9);
                this._expFill.fillRoundedRect(this._expBarX, this._expBarY, w, this._expBarH, 3);
            }
        }

        // 计时 + 轮次
        if (this._timeTxt) {
            const m = Math.floor(elapsedSec / 60);
            const s = Math.floor(elapsedSec % 60);
            const mm = String(m).padStart(2, '0');
            const ss = String(s).padStart(2, '0');
            this._timeTxt.setText(`第 ${round} 轮 | ${mm}:${ss}`);
        }

        // 击杀进度条
        if (this._killProgressTxt) {
            this._killProgressTxt.setText(`⚔ ${roundKills} / ${killTarget}`);
        }
        if (this._killBarFill) {
            this._killBarFill.clear();
            const ratio = killTarget > 0 ? Math.min(1, roundKills / killTarget) : 0;
            if (ratio > 0) {
                const fillW = ratio * this._kbW;
                const color = ratio >= 0.8 ? 0xffee44 : 0xff7733;
                this._killBarFill.fillStyle(color, 0.9);
                this._killBarFill.fillRoundedRect(this._kbX, this._kbY, fillW, this._kbH, 2);
            }
        }

        // 总击杀
        if (this._killTxt) this._killTxt.setText(`总击杀: ${killCount}`);

        // 金币
        if (this._goldTxt) this._goldTxt.setText(`💰 ${gold}`);

        // 武器图标
        this._updateWeaponIcons(weapons);
    }

    _updateWeaponIcons(weapons) {
        if (!weapons) return;
        // 清空旧图标
        this._weaponContainer.removeAll(true);

        const startX = 250 - (weapons.length * 28) / 2;
        for (let i = 0; i < weapons.length; i++) {
            const w = weapons[i];
            const x = startX + i * 28;
            const icon = this.scene.add.text(x, 680, w.data.icon, {
                fontSize: '18px'
            }).setOrigin(0.5, 1);

            // 等级角标
            if (w.level > 1) {
                const badge = this.scene.add.text(x + 8, 668, String(w.level), {
                    fontSize: '9px', fontFamily: 'Arial',
                    fill: '#ffee44', stroke: '#000', strokeThickness: 2
                }).setOrigin(0.5, 1);
                this._weaponContainer.add(badge);
            }
            this._weaponContainer.add(icon);
        }
    }
}
