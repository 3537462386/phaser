/**
 * GameHUD — 机甲战斗仪表盘（赛博朋克风格）
 *
 * 显示：能量条HP、护盾层、EXP充能条、轮次计时、击杀进度、
 *       武器装备栏、遗物状态栏、Boss威胁指示器、金币
 *
 * 设计语言：尖锐边角、霓虹描边、等宽字体、扫描线
 */
class GameHUD {
    constructor() {
        this.scene   = null;
        this._hearts = [];       // 保留兼容，但用能量段替代
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
        this._lastWeaponHash = '';
        this._lastRelicHash  = '';
        this._bossBarBg      = null;
        this._bossBarFill    = null;
        this._bossNameTxt    = null;

        // 赛博朋克专用
        this._hpGfx        = null;  // HP能量条 Graphics
        this._shieldGfx    = null;  // 护盾层 Graphics
        this._scanLineGfx  = null;  // 扫描线
        this._frameGfx     = null;  // HUD边框
        this._hpLabel      = null;
        this._shieldLabel  = null;
    }

    create(scene) {
        this.scene = scene;
        const T = UITheme;
        const C = T.colors;
        const depth = 20;

        // ── HUD外框（顶部信息区 + 底部装备区）──────────────────
        this._frameGfx = scene.add.graphics().setDepth(depth);
        // 顶部面板背景
        this._frameGfx.fillStyle(C.bgDark, 0.88);
        this._frameGfx.fillRect(0, 0, 500, 56);
        // 顶部面板底边霓虹线
        this._frameGfx.fillStyle(C.cyan, 0.4);
        this._frameGfx.fillRect(0, 56, 500, 1);
        // 底部面板背景
        this._frameGfx.fillStyle(C.bgDark, 0.85);
        this._frameGfx.fillRect(0, 646, 500, 54);
        // 底部面板顶边霓虹线
        this._frameGfx.fillStyle(C.cyan, 0.3);
        this._frameGfx.fillRect(0, 646, 500, 1);

        // ── 左上：HP能量条 ───────────────────────────────
        this._hpLabel = scene.add.text(16, 6, 'HULL', {
            fontSize: '9px', fontFamily: T.font.family,
            fill: C.textDim, stroke: '#000511', strokeThickness: 1
        }).setDepth(depth);

        this._hpGfx = scene.add.graphics().setDepth(depth);
        this._hpBarX = 46; this._hpBarY = 8; this._hpBarW = 130; this._hpBarH = 12;
        // 背景条
        this._hpGfx.fillStyle(C.bgPanel, 0.9);
        this._hpGfx.fillRoundedRect(this._hpBarX, this._hpBarY, this._hpBarW, this._hpBarH, 2);

        // 预留兼容爱心（隐藏）
        for (let i = 0; i < 5; i++) {
            const t = scene.add.text(-100, -100, '', { fontSize: '1px' }).setDepth(-1);
            this._hearts.push(t);
        }

        // ── 护盾层指示 ───────────────────────────────────────
        this._shieldLabel = scene.add.text(16, 28, 'SHLD', {
            fontSize: '9px', fontFamily: T.font.family,
            fill: C.textDim, stroke: '#000511', strokeThickness: 1
        }).setDepth(depth);

        this._shieldGfx = scene.add.graphics().setDepth(depth);
        this._shieldBarX = 46; this._shieldBarY = 30; this._shieldBarW = 80; this._shieldBarH = 8;

        this._shieldTxt = scene.add.text(-100, -100, '', {
            fontSize: '1px'
        }).setDepth(-1); // 隐藏旧的emoji护盾

        // ── 顶部中间：轮次 + 计时 ───────────────────────────────
        this._timeTxt = scene.add.text(250, 12, 'RND-1 | 00:00', {
            fontSize: '16px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textAccent, stroke: '#001a11', strokeThickness: 2
        }).setOrigin(0.5, 0).setDepth(depth);

        // 次级信息行
        this._roundInfoTxt = scene.add.text(250, 34, '', {
            fontSize: '10px', fontFamily: T.font.family,
            fill: C.textDim
        }).setOrigin(0.5, 0).setDepth(depth);

        // ── 右上：等级 + EXP 充能条 ──────────────────────
        this._levelTxt = scene.add.text(484, 6, 'LV.01', {
            fontSize: '14px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textAccent, stroke: '#001a11', strokeThickness: 2
        }).setOrigin(1, 0).setDepth(depth);

        this._expBar = scene.add.graphics().setDepth(depth);
        this._expBarX = 340; this._expBarY = 26; this._expBarW = 144; this._expBarH = 8;
        this._expBar.fillStyle(C.bgPanel, 0.9);
        this._expBar.fillRoundedRect(this._expBarX, this._expBarY, this._expBarW, this._expBarH, 2);

        // EXP标签
        scene.add.text(340, 16, 'EXP', {
            fontSize: '9px', fontFamily: T.font.family,
            fill: C.textDim
        }).setDepth(depth);

        this._expFill = scene.add.graphics().setDepth(depth);

        // ── 击杀进度（顶部条下方） ────────────────────────────
        const kbX = 16, kbY = 44, kbW = 280, kbH = 4;
        const killBarBg = scene.add.graphics().setDepth(depth);
        killBarBg.fillStyle(C.bgPanel, 0.85);
        killBarBg.fillRoundedRect(kbX, kbY, kbW, kbH, 1);
        this._killBarFill = scene.add.graphics().setDepth(depth);
        this._kbX = kbX; this._kbY = kbY; this._kbW = kbW; this._kbH = kbH;

        this._killProgressTxt = scene.add.text(300, 40, '0/20', {
            fontSize: '10px', fontFamily: T.font.family,
            fill: C.textDim, stroke: '#000511', strokeThickness: 1
        }).setOrigin(0, 0).setDepth(depth);

        // ── Boss 血条（默认隐藏）─────────────────────────────
        this._bossNameTxt = scene.add.text(250, 62, '', {
            fontSize: '13px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textDanger, stroke: '#220011', strokeThickness: 2
        }).setOrigin(0.5, 0).setDepth(depth).setAlpha(0);

        this._bossBarBg = scene.add.graphics().setDepth(depth).setAlpha(0);
        this._bossBarBg.fillStyle(C.pinkDim, 0.8);
        this._bossBarBg.fillRoundedRect(100, 78, 300, 10, 2);
        // Boss条边框
        this._bossBarBg.lineStyle(1, C.pink, 0.4);
        this._bossBarBg.strokeRoundedRect(100, 78, 300, 10, 2);

        this._bossBarFill = scene.add.graphics().setDepth(depth).setAlpha(0);
        this._bossBarX = 100; this._bossBarY = 78;
        this._bossBarW = 300; this._bossBarH = 10;

        // Boss标签
        this._bossLabel = scene.add.text(96, 64, 'THREAT', {
            fontSize: '9px', fontFamily: T.font.family,
            fill: '#ff2266'
        }).setDepth(depth).setAlpha(0);

        // ── 右下：总击杀数 ─────────────────────────────────────
        this._killTxt = scene.add.text(484, 690, 'KILL: 0', {
            fontSize: '12px', fontFamily: T.font.family,
            fill: C.textDim, stroke: '#000511', strokeThickness: 1
        }).setOrigin(1, 1).setDepth(depth);

        // ── 左下：金币 ─────────────────────────────────────────
        this._goldTxt = scene.add.text(16, 690, 'CR: 0', {
            fontSize: '14px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textGold, stroke: '#221100', strokeThickness: 2
        }).setOrigin(0, 1).setDepth(depth);

        // ── 底部面板分隔符 ─────────────
        const sepGfx = scene.add.graphics().setDepth(depth);
        sepGfx.fillStyle(C.cyan, 0.15);
        sepGfx.fillRect(200, 652, 1, 42);
        sepGfx.fillRect(330, 652, 1, 42);

        // 底部标签
        scene.add.text(16, 650, 'WPN', {
            fontSize: '9px', fontFamily: T.font.family, fill: C.textDim
        }).setDepth(depth);
        scene.add.text(210, 650, 'RELIC', {
            fontSize: '9px', fontFamily: T.font.family, fill: C.textDim
        }).setDepth(depth);
        scene.add.text(340, 650, 'SYS', {
            fontSize: '9px', fontFamily: T.font.family, fill: C.textDim
        }).setDepth(depth);

        // ── 底部：武器图标区域 ─────────────
        this._weaponContainer = scene.add.container(0, 0).setDepth(depth);

        // ── 底部左侧：遗物图标区域 ─────────────
        this._relicContainer = scene.add.container(0, 0).setDepth(depth);

        // ── 扫描线效果 ─────────────
        this._scanLineGfx = scene.add.graphics().setDepth(depth + 1);
        this._scanLineY = 0;
    }

    update(data) {
        const { hp, maxHp, level, expProgress, elapsedSec, killCount, weapons,
                round = 1, roundKills = 0, killTarget = 20, gold = 0,
                relics = [], shieldStacks = 0,
                bossActive = false, bossHp = 0, bossMaxHp = 0, bossName = '' } = data;

        const T = UITheme;
        const C = T.colors;

        // ── HP 能量条 ───────────────────────────────
        this._hpGfx.clear();
        // 背景
        this._hpGfx.fillStyle(C.bgPanel, 0.9);
        this._hpGfx.fillRoundedRect(this._hpBarX, this._hpBarY, this._hpBarW, this._hpBarH, 2);
        // 分段线
        const segW = this._hpBarW / Math.max(1, maxHp);
        for (let i = 1; i < maxHp; i++) {
            this._hpGfx.fillStyle(C.bgDarkest, 0.6);
            this._hpGfx.fillRect(this._hpBarX + i * segW - 1, this._hpBarY, 2, this._hpBarH);
        }
        // 填充（按HP段数）
        const hpRatio = maxHp > 0 ? hp / maxHp : 0;
        const hpColor = hpRatio > 0.6 ? C.hpHigh : (hpRatio > 0.3 ? C.hpMid : C.hpLow);
        if (hp > 0) {
            const fillW = Math.max(this._hpBarH, hpRatio * this._hpBarW);
            this._hpGfx.fillStyle(hpColor, 0.92);
            this._hpGfx.fillRoundedRect(this._hpBarX, this._hpBarY, fillW, this._hpBarH, 2);
            // 发光端
            this._hpGfx.fillStyle(hpColor, 0.6);
            this._hpGfx.fillRect(this._hpBarX + fillW - 3, this._hpBarY + 1, 2, this._hpBarH - 2);
        }
        // 边框
        this._hpGfx.lineStyle(1, C.cyan, 0.4);
        this._hpGfx.strokeRoundedRect(this._hpBarX, this._hpBarY, this._hpBarW, this._hpBarH, 2);

        // 兼容旧爱心
        for (let i = 0; i < this._hearts.length; i++) {
            this._hearts[i].setAlpha(0);
        }

        // ── 护盾层 ───────────────────────────────
        this._shieldGfx.clear();
        this._shieldGfx.fillStyle(C.bgPanel, 0.85);
        this._shieldGfx.fillRoundedRect(this._shieldBarX, this._shieldBarY, this._shieldBarW, this._shieldBarH, 2);
        if (shieldStacks > 0) {
            const sw = Math.min(1, shieldStacks / 3) * this._shieldBarW;
            this._shieldGfx.fillStyle(C.shield, 0.85);
            this._shieldGfx.fillRoundedRect(this._shieldBarX, this._shieldBarY, sw, this._shieldBarH, 2);
            this._shieldGfx.fillStyle(C.shield, 0.5);
            this._shieldGfx.fillRect(this._shieldBarX + sw - 2, this._shieldBarY + 1, 1, this._shieldBarH - 2);
        }
        this._shieldGfx.lineStyle(1, C.shield, shieldStacks > 0 ? 0.5 : 0.2);
        this._shieldGfx.strokeRoundedRect(this._shieldBarX, this._shieldBarY, this._shieldBarW, this._shieldBarH, 2);

        // ── 等级 ───────────────────────────────
        if (this._levelTxt) this._levelTxt.setText(`LV.${String(level).padStart(2, '0')}`);

        // ── EXP 条 ───────────────────────────────
        if (this._expFill) {
            this._expFill.clear();
            const w = Math.max(0, Math.min(1, expProgress)) * this._expBarW;
            if (w > 0) {
                this._expFill.fillStyle(C.expFill, 0.9);
                this._expFill.fillRoundedRect(this._expBarX, this._expBarY, Math.max(this._expBarH, w), this._expBarH, 2);
                // 发光端
                this._expFill.fillStyle(C.expGlow, 0.5);
                this._expFill.fillRect(this._expBarX + w - 3, this._expBarY + 1, 2, this._expBarH - 2);
            }
        }

        // ── 计时 + 轮次 ───────────────────────────────
        if (this._timeTxt) {
            const m = Math.floor(elapsedSec / 60);
            const s = Math.floor(elapsedSec % 60);
            const mm = String(m).padStart(2, '0');
            const ss = String(s).padStart(2, '0');
            this._timeTxt.setText(`RND-${round} | ${mm}:${ss}`);
        }

        // 次级信息
        if (this._roundInfoTxt) {
            const hpPercent = maxHp > 0 ? Math.round(hp / maxHp * 100) : 0;
            this._roundInfoTxt.setText(`HULL:${hpPercent}%  ${shieldStacks > 0 ? 'SHLD:' + shieldStacks : ''}`);
        }

        // ── 击杀进度条 ───────────────────────────────
        if (this._killProgressTxt) {
            this._killProgressTxt.setText(`${roundKills}/${killTarget}`);
        }
        if (this._killBarFill) {
            this._killBarFill.clear();
            const ratio = killTarget > 0 ? Math.min(1, roundKills / killTarget) : 0;
            if (ratio > 0) {
                const fillW = ratio * this._kbW;
                const color = ratio >= 0.8 ? C.warning : C.orange;
                this._killBarFill.fillStyle(color, 0.85);
                this._killBarFill.fillRoundedRect(this._kbX, this._kbY, fillW, this._kbH, 1);
            }
        }

        // ── Boss 血条 ───────────────────────────────
        if (bossActive && bossMaxHp > 0) {
            if (this._bossNameTxt) this._bossNameTxt.setText(bossName).setAlpha(1);
            if (this._bossLabel) this._bossLabel.setAlpha(1);
            if (this._bossBarBg) this._bossBarBg.setAlpha(1);
            if (this._bossBarFill) {
                this._bossBarFill.clear().setAlpha(1);
                const bossRatio = Math.max(0, bossHp / bossMaxHp);
                const bossFillW = Math.max(this._bossBarH, bossRatio * this._bossBarW);
                const bossColor = bossRatio > 0.5 ? C.bossHigh : C.bossLow;
                this._bossBarFill.fillStyle(bossColor, 0.9);
                this._bossBarFill.fillRoundedRect(this._bossBarX, this._bossBarY, bossFillW, this._bossBarH, 2);
                // 发光端
                this._bossBarFill.fillStyle(bossColor, 0.5);
                this._bossBarFill.fillRect(this._bossBarX + bossFillW - 3, this._bossBarY + 1, 2, this._bossBarH - 2);
            }
        } else {
            if (this._bossNameTxt) this._bossNameTxt.setAlpha(0);
            if (this._bossLabel) this._bossLabel.setAlpha(0);
            if (this._bossBarBg) this._bossBarBg.setAlpha(0);
            if (this._bossBarFill) this._bossBarFill.clear().setAlpha(0);
        }

        // ── 总击杀 ───────────────────────────────
        if (this._killTxt) this._killTxt.setText(`KILL: ${killCount}`);

        // ── 金币 ───────────────────────────────
        if (this._goldTxt) this._goldTxt.setText(`CR: ${gold}`);

        // ── 武器图标 ───────────────────────────────
        this._updateWeaponIcons(weapons);

        // ── 遗物图标 ───────────────────────────────
        this._updateRelicIcons(relics);

        // ── 扫描线 ───────────────────────────────
        this._drawScanLine();
    }

    _drawScanLine() {
        if (!this._scanLineGfx) return;
        this._scanLineY += T_motion.scanLineSpeed;
        if (this._scanLineY > 700) this._scanLineY = 0;

        this._scanLineGfx.clear();
        this._scanLineGfx.fillStyle(0x00ffcc, 0.03);
        this._scanLineGfx.fillRect(0, this._scanLineY, 500, 2);
    }

    _updateWeaponIcons(weapons) {
        if (!weapons) return;
        // 脏检测：仅当武器列表发生实质性变化时才重建
        const hash = weapons.map(w => `${w.id}:${w.level}`).join(',');
        if (this._lastWeaponHash === hash) return;
        this._lastWeaponHash = hash;

        this._weaponContainer.removeAll(true);

        const startX = 40;
        const y = 676;
        for (let i = 0; i < weapons.length; i++) {
            const w = weapons[i];
            const x = startX + i * 32;
            const C = UITheme.colors;

            // 武器图标
            const icon = this.scene.add.text(x, y, w.data.icon, {
                fontSize: '14px'
            }).setOrigin(0, 1);

            // 等级角标
            if (w.level > 1) {
                const isEvolved = w.level >= 4;
                const lvlColor = isEvolved ? '#aa44ff' : '#00ffcc';
                const badge = this.scene.add.text(x + 14, y - 14, isEvolved ? 'E' : `L${w.level}`, {
                    fontSize: '8px', fontFamily: UITheme.font.family, fontStyle: 'bold',
                    fill: lvlColor, stroke: '#000', strokeThickness: 1
                }).setOrigin(0, 1);
                this._weaponContainer.add(badge);
            }
            this._weaponContainer.add(icon);
        }
    }

    _updateRelicIcons(relics) {
        if (!relics) relics = [];
        // 脏检测
        const hash = relics.map(r => `${r.id}:${r.count}`).join(',');
        if (this._lastRelicHash === hash) return;
        this._lastRelicHash = hash;

        this._relicContainer.removeAll(true);
        if (relics.length === 0) return;

        const startX = 210;
        const y = 676;
        for (let i = 0; i < relics.length; i++) {
            const r = relics[i];
            const x = startX + i * 22;
            const icon = this.scene.add.text(x, y, r.data.icon, {
                fontSize: '12px'
            }).setOrigin(0, 1);

            if (r.count > 1) {
                const countBadge = this.scene.add.text(x + 12, y - 10, `x${r.count}`, {
                    fontSize: '7px', fontFamily: UITheme.font.family,
                    fill: '#44aaff', stroke: '#000', strokeThickness: 1
                }).setOrigin(0, 1);
                this._relicContainer.add(countBadge);
            }
            this._relicContainer.add(icon);
        }
    }
}

// 扫描线速度常量
const T_motion = UITheme.motion;
