/**
 * UITheme — 赛博朋克/机甲风格 UI 主题系统
 *
 * 为太空射击游戏定义统一的视觉语言：
 *   - 霓虹青 (Neon Cyan) — 主色调，HUD/面板边框
 *   - 热粉 (Hot Pink) — 警告/Boss/稀有
 *   - 暗夜蓝 (Midnight Blue) — 背景/面板填充
 *   - 能量橙 (Energy Orange) — 金币/奖励/事件
 *   - 电弧紫 (Arc Purple) — 诅咒/进化/传说
 *
 * 所有 UI 组件从本文件读取颜色、尺寸、字体等 Token。
 * 不依赖 CSS，纯 Phaser Graphics + Text 使用。
 */

const UITheme = {

    // ═══════════════ 色彩系统 ═══════════════

    colors: {
        // 主色：霓虹青 — HUD边框、能量条、状态指示
        cyan:          0x00ffcc,
        cyanBright:    0x44ffdd,
        cyanDim:       0x007766,
        cyanDark:      0x003322,

        // 副色：热粉 — Boss、危险、稀有
        pink:          0xff2266,
        pinkBright:    0xff5588,
        pinkDim:       0x881133,

        // 背景：暗夜蓝系
        bgDarkest:     0x020810,
        bgDark:        0x040c18,
        bgMid:         0x081424,
        bgPanel:       0x0a1a30,
        bgPanelLight:  0x0e2240,
        bgHover:       0x112844,

        // 能量橙 — 金币、奖励
        orange:        0xff8822,
        orangeBright:  0xffaa44,
        orangeDim:     0x663300,

        // 电弧紫 — 诅咒、进化、传说
        purple:        0xaa44ff,
        purpleBright:  0xcc66ff,
        purpleDim:     0x441188,

        // 语义色
        success:       0x22ff88,
        warning:       0xffcc22,
        danger:        0xff3344,
        info:          0x44aaff,

        // 文本色
        textPrimary:   '#e0f0ff',
        textSecondary: '#6688aa',
        textDim:       '#334466',
        textAccent:    '#00ffcc',
        textDanger:    '#ff2266',
        textGold:      '#ffaa44',

        // 霓虹辉光色（用于低透明度描边）
        glowCyan:      0x00ffcc,
        glowPink:      0xff2266,
        glowPurple:    0xaa44ff,
        glowOrange:    0xff8822,

        // HP 能量条色
        hpHigh:        0x22ff88,
        hpMid:         0xffcc22,
        hpLow:         0xff3344,

        // 护盾色
        shield:        0x44aaff,
        shieldBright:  0x88ccff,

        // EXP 充能色
        expFill:       0x00ffcc,
        expGlow:       0x44ffdd,

        // Boss 血条
        bossHigh:      0xff2266,
        bossLow:       0xff8800,
    },

    // ═══════════════ 稀有度配色 ═══════════════

    rarity: {
        common:    { color: 0x6688aa, label: '',       hex: '#6688aa' },
        uncommon:  { color: 0x22ff88, label: ' [优良]', hex: '#22ff88' },
        rare:      { color: 0x44aaff, label: ' [稀有]', hex: '#44aaff' },
        legendary: { color: 0xaa44ff, label: ' [传说]', hex: '#aa44ff' },
    },

    // ═══════════════ 面板样式 ═══════════════

    panel: {
        bgColor:        0x0a1a30,
        bgAlpha:        0.94,
        hoverBgColor:   0x112844,
        hoverBgAlpha:   0.96,
        borderColor:    0x00ffcc,
        borderWidth:    1.5,
        borderAlpha:    0.6,
        hoverBorder:    0x00ffcc,
        hoverBorderW:   2,
        hoverBorderA:   1.0,
        cornerRadius:   6,         // 略尖锐，不圆滑
        glowRadius:     12,
        glowAlpha:      0.12,
    },

    // ═══════════════ 字体 ═══════════════

    font: {
        family:     "'Courier New', monospace",  // 等宽 = 终端感
        familyAlt:  "'Arial', sans-serif",
        titleSize:  '28px',
        headerSize: '20px',
        bodySize:   '14px',
        smallSize:  '11px',
        tinySize:   '9px',
    },

    // ═══════════════ HUD 布局 ═══════════════

    hud: {
        barHeight:      8,
        barRadius:      2,          // 尖锐能量条
        barBgColor:     0x081424,
        barBgAlpha:     0.85,
        hpBarWidth:     120,
        hpBarX:         16,
        hpBarY:         18,
        expBarWidth:    140,
        expBarX:        340,
        expBarY:        34,
        killBarWidth:   200,
        killBarX:       16,
        killBarY:       42,
        bossBarWidth:   300,
        bossBarX:       100,
        bossBarY:       78,
        weaponY:        660,
        relicY:         660,
    },

    // ═══════════════ 动效参数 ═══════════════

    motion: {
        fadeInDuration:     350,
        fadeOutDuration:    220,
        hoverShiftX:        6,
        hoverShiftDuration: 90,
        pulseDuration:      2400,
        glitchIntensity:    3,       // glitch抖动像素
        scanLineSpeed:      0.3,     // 扫描线速度
    },

    // ═══════════════ 辅助方法 ═══════════════

    /**
     * 绘制赛博朋克风格面板
     * @param {Phaser.GameObjects.Graphics} gfx
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {object} [opts] - { hover, accent, glow }
     */
    drawPanel(gfx, x, y, w, h, opts = {}) {
        const p = UITheme.panel;
        const isHover = opts.hover || false;
        const accent = opts.accent || p.borderColor;

        gfx.clear();

        // 辉光层（hover时显示）
        if (isHover || opts.glow) {
            gfx.lineStyle(p.hoverBorderW, accent, p.glowAlpha);
            gfx.strokeRoundedRect(x - 2, y - 2, w + 4, h + 4, p.cornerRadius + 2);
        }

        // 背景填充
        const bgColor = isHover ? p.hoverBgColor : opts.bgColor || p.bgColor;
        const bgAlpha = isHover ? p.hoverBgAlpha : opts.bgAlpha || p.bgAlpha;
        gfx.fillStyle(bgColor, bgAlpha);
        gfx.fillRoundedRect(x, y, w, h, p.cornerRadius);

        // 边框
        const bw = isHover ? p.hoverBorderW : p.borderWidth;
        const ba = isHover ? p.hoverBorderA : (opts.borderAlpha || p.borderAlpha);
        gfx.lineStyle(bw, accent, ba);
        gfx.strokeRoundedRect(x, y, w, h, p.cornerRadius);

        // 左侧强调条（赛博朋克标志性设计）
        if (opts.accentBar !== false) {
            const barH = h - 20;
            gfx.fillStyle(accent, isHover ? 1.0 : 0.55);
            gfx.fillRect(x + 1, y + 10, 3, barH);
        }

        // 角落装饰线
        if (opts.cornerDeco !== false) {
            const cLen = 8;
            gfx.lineStyle(1, accent, 0.5);
            // 左上
            gfx.lineBetween(x, y + cLen, x + cLen, y);
            // 右上
            gfx.lineBetween(x + w - cLen, y, x + w, y + cLen);
            // 左下
            gfx.lineBetween(x, y + h - cLen, x + cLen, y + h);
            // 右下
            gfx.lineBetween(x + w - cLen, y + h, x + w, y + h - cLen);
        }

        // 扫描线效果（可选）
        if (opts.scanLine) {
            gfx.fillStyle(accent, 0.04);
            for (let sy = y; sy < y + h; sy += 4) {
                gfx.fillRect(x, sy, w, 1);
            }
        }
    },

    /**
     * 绘制能量条（尖锐矩形，带发光端点）
     * @param {Phaser.GameObjects.Graphics} gfx
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {number} ratio - 0~1 填充比例
     * @param {number} fillColor
     * @param {object} [opts]
     */
    drawBar(gfx, x, y, w, h, ratio, fillColor, opts = {}) {
        const h2 = UITheme.hud;
        const r = Math.max(0, Math.min(1, ratio));
        const radius = opts.radius || h2.barRadius;
        const bgAlpha = opts.bgAlpha || h2.barBgAlpha;

        // 背景
        gfx.fillStyle(h2.barBgColor, bgAlpha);
        gfx.fillRoundedRect(x, y, w, h, radius);

        // 填充
        if (r > 0) {
            const fillW = Math.max(h, r * w); // 最小宽度 = 高度（保证圆角可见）
            gfx.fillStyle(fillColor, 0.9);
            gfx.fillRoundedRect(x, y, fillW, h, radius);

            // 发光端点
            if (opts.glowEnd !== false && fillW > 4) {
                gfx.fillStyle(fillColor, 0.5);
                gfx.fillRect(x + fillW - 3, y + 1, 2, h - 2);
            }
        }
    },

    /**
     * 获取类型对应的强调色
     */
    typeAccent(type) {
        const c = UITheme.colors;
        switch (type) {
            case 'newWeapon':     return c.cyan;
            case 'upgradeWeapon': return c.orange;
            case 'evolveWeapon':  return c.purple;
            case 'passiveItem':   return c.success;
            case 'stat':          return c.info;
            default:              return c.cyan;
        }
    },

    /**
     * 获取稀有度强调色
     */
    rarityAccent(rarity) {
        return UITheme.rarity[rarity]?.color || UITheme.colors.cyan;
    },

    /**
     * 创建赛博朋克风格文本配置
     */
    text(style = 'body') {
        const f = UITheme.font;
        const c = UITheme.colors;
        switch (style) {
            case 'title':
                return { fontSize: f.titleSize, fontFamily: f.family, fontStyle: 'bold',
                         fill: c.textPrimary, stroke: '#003322', strokeThickness: 3 };
            case 'header':
                return { fontSize: f.headerSize, fontFamily: f.family, fontStyle: 'bold',
                         fill: c.textAccent, stroke: '#001a11', strokeThickness: 2 };
            case 'body':
                return { fontSize: f.bodySize, fontFamily: f.family,
                         fill: c.textSecondary, stroke: '#000a11', strokeThickness: 1 };
            case 'label':
                return { fontSize: f.bodySize, fontFamily: f.family, fontStyle: 'bold',
                         fill: c.textPrimary, stroke: '#000a11', strokeThickness: 1 };
            case 'small':
                return { fontSize: f.smallSize, fontFamily: f.family,
                         fill: c.textDim, stroke: '#000511', strokeThickness: 1 };
            case 'tiny':
                return { fontSize: f.tinySize, fontFamily: f.family,
                         fill: c.textDim };
            case 'gold':
                return { fontSize: f.bodySize, fontFamily: f.family, fontStyle: 'bold',
                         fill: c.textGold, stroke: '#221100', strokeThickness: 2 };
            case 'danger':
                return { fontSize: f.bodySize, fontFamily: f.family, fontStyle: 'bold',
                         fill: c.textDanger, stroke: '#220011', strokeThickness: 2 };
            case 'accent':
                return { fontSize: f.bodySize, fontFamily: f.family, fontStyle: 'bold',
                         fill: c.textAccent, stroke: '#001a11', strokeThickness: 2 };
            default:
                return { fontSize: f.bodySize, fontFamily: f.family, fill: c.textPrimary };
        }
    }
};
