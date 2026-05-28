/**
 * GameHUD — 游戏内 HUD
 * 显示：HP（爱心），等级，EXP进度条，计时，击杀数，武器图标，遗物图标，Boss血条，护盾
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
        this._relicContainer = null;
        this._shieldTxt      = null;
        this._bossBarBg      = null;
        this._bossBarFill    = null;
        this._bossNameTxt    = null;
    }

    create(scene) {
        this.scene = scene;

        const depth = 20;

        // ── 左上：HP 爱心 ───────────────────────────────
        for (let i = 0; i < 5; i++) {
            const t = scene.add.text(16 + i * 26, 16, '❤', {
                fontSize: '20px'
            }).setDepth(depth).setAlpha(0.2);
            this._hearts.push(t);
        }

        // ── 护盾图标 ───────────────────────────────────────
        this._shieldTxt = scene.add.text(146, 16, '', {
            fontSize: '16px'
        }).setDepth(depth).setAlpha(0);

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

        const barX = 340, barY = 34, barW = 144, barH = 6;
        this._expBar = scene.add.graphics().setDepth(depth);
        this._expBar.fillStyle(0x111133, 0.8);
        this._expBar.fillRoundedRect(barX, barY, barW, barH, 3);

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

        // ── Boss 血条（默认隐藏）─────────────────────────────
        this._bossNameTxt = scene.add.text(250, 58, '', {
            fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ff4488', stroke: '#220011', strokeThickness: 2
        }).setOrigin(0.5, 0).setDepth(depth).setAlpha(0);

        this._bossBarBg = scene.add.graphics().setDepth(depth).setAlpha(0);
        this._bossBarBg.fillStyle(0x331122, 0.8);
        this._bossBarBg.fillRoundedRect(100, 78, 300, 8, 4);

        this._bossBarFill = scene.add.graphics().setDepth(depth).setAlpha(0);
        this._bossBarX = 100; this._bossBarY = 78;
        this._bossBarW = 300; this._bossBarH = 8;

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

        // ── 底部：武器图标区域 ─────────────
        this._weaponContainer = scene.add.container(0, 0).setDepth(depth);

        // ── 底部左侧：遗物图标区域 ─────────────
        this._relicContainer = scene.add.container(0, 0).setDepth(depth);
    }

    update(data) {
        const { hp, maxHp, level, expProgress, elapsedSec, killCount, weapons,
                round = 1, roundKills = 0, killTarget = 20, gold = 0,
                relics = [], shieldStacks = 0,
                bossActive = false, bossHp = 0, bossMaxHp = 0, bossName = '' } = data;

        // HP 爱心
        for (let i = 0; i < this._hearts.length; i++) {
            this._hearts[i].setAlpha(i < maxHp ? 1 : 0);
            this._hearts[i].setStyle({ fill: i < hp ? '#ff4444' : '#444444' });
        }

        // 护盾
        if (this._shieldTxt) {
            if (shieldStacks > 0) {
                this._shieldTxt.setText('🛡'.repeat(shieldStacks));
                this._shieldTxt.setAlpha(1);
            } else {
                this._shieldTxt.setAlpha(0);
            }
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

        // Boss 血条
        if (bossActive && bossMaxHp > 0) {
            if (this._bossNameTxt) {
                this._bossNameTxt.setText(bossName).setAlpha(1);
            }
            if (this._bossBarBg) this._bossBarBg.setAlpha(1);
            if (this._bossBarFill) {
                this._bossBarFill.clear().setAlpha(1);
                const bossRatio = Math.max(0, bossHp / bossMaxHp);
                const bossFillW = bossRatio * this._bossBarW;
                const bossColor = bossRatio > 0.5 ? 0xff2266 : 0xff8800;
                this._bossBarFill.fillStyle(bossColor, 0.9);
                this._bossBarFill.fillRoundedRect(this._bossBarX, this._bossBarY, bossFillW, this._bossBarH, 4);
            }
        } else {
            if (this._bossNameTxt) this._bossNameTxt.setAlpha(0);
            if (this._bossBarBg) this._bossBarBg.setAlpha(0);
            if (this._bossBarFill) this._bossBarFill.clear().setAlpha(0);
        }

        // 总击杀
        if (this._killTxt) this._killTxt.setText(`总击杀: ${killCount}`);

        // 金币
        if (this._goldTxt) this._goldTxt.setText(`💰 ${gold}`);

        // 武器图标
        this._updateWeaponIcons(weapons);

        // 遗物图标
        this._updateRelicIcons(relics);
    }

    _updateWeaponIcons(weapons) {
        if (!weapons) return;
        this._weaponContainer.removeAll(true);

        const startX = 250 - (weapons.length * 28) / 2;
        for (let i = 0; i < weapons.length; i++) {
            const w = weapons[i];
            const x = startX + i * 28;
            const icon = this.scene.add.text(x, 658, w.data.icon, {
                fontSize: '16px'
            }).setOrigin(0.5, 1);

            if (w.level > 1) {
                const lvlColor = w.level >= 4 ? '#ff44ff' : '#ffee44';
                const badge = this.scene.add.text(x + 8, 646, w.level >= 4 ? 'E' : String(w.level), {
                    fontSize: '9px', fontFamily: 'Arial',
                    fill: lvlColor, stroke: '#000', strokeThickness: 2
                }).setOrigin(0.5, 1);
                this._weaponContainer.add(badge);
            }
            this._weaponContainer.add(icon);
        }
    }

    _updateRelicIcons(relics) {
        if (!relics || relics.length === 0) return;
        this._relicContainer.removeAll(true);

        const startX = 16;
        const y = 660;
        for (let i = 0; i < relics.length; i++) {
            const r = relics[i];
            const x = startX + i * 22;
            const icon = this.scene.add.text(x, y, r.data.icon, {
                fontSize: '14px'
            }).setOrigin(0, 1);

            if (r.count > 1) {
                const countBadge = this.scene.add.text(x + 10, y - 12, `x${r.count}`, {
                    fontSize: '8px', fontFamily: 'Arial',
                    fill: '#aaccff', stroke: '#000', strokeThickness: 1
                }).setOrigin(0, 1);
                this._relicContainer.add(countBadge);
            }
            this._relicContainer.add(icon);
        }
    }
}
