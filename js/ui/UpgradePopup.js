/**
 * UpgradePopup — 全息投影升级选卡（赛博朋克风格）
 *
 * 暂停物理 + 展示选项，选择后恢复游戏
 * 设计：全息面板、扫描线、霓虹边框、稀有度色差
 */
class UpgradePopup {
    constructor() {
        this._container = null;
        this._scene     = null;
        this._onSelect  = null;
    }

    show(scene, options, onSelect) {
        this._scene    = scene;
        this._onSelect = onSelect;

        scene.physics.pause();

        const T = UITheme;
        const C = T.colors;

        // 半透明遮罩 — 深蓝 + 扫描线
        const overlay = scene.add.graphics().setDepth(50);
        overlay.fillStyle(C.bgDarkest, 0.82);
        overlay.fillRect(0, 0, 500, 700);
        // 扫描线
        overlay.fillStyle(C.cyan, 0.02);
        for (let sy = 0; sy < 700; sy += 4) {
            overlay.fillRect(0, sy, 500, 1);
        }

        // 标题
        const title = scene.add.text(250, 120, '// UPGRADE', {
            fontSize: '30px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textAccent, stroke: '#001a11', strokeThickness: 3
        }).setOrigin(0.5).setDepth(51);

        const sub = scene.add.text(250, 158, 'SELECT ENHANCEMENT', {
            fontSize: '11px', fontFamily: T.font.family, fill: C.textDim
        }).setOrigin(0.5).setDepth(51);

        // 分隔线
        const sepGfx = scene.add.graphics().setDepth(51);
        sepGfx.fillStyle(C.cyan, 0.3);
        sepGfx.fillRect(100, 176, 300, 1);

        this._container = scene.add.container(0, 0).setDepth(51);
        this._container.add([overlay, title, sub]);

        // 绘制卡牌（支持 3-4 个选项）
        const TOTAL  = options.length;
        const CARD_W = TOTAL > 3 ? 108 : 130;
        const CARD_H = TOTAL > 3 ? 180 : 200;
        const GAP    = TOTAL > 3 ? 8 : 14;
        const startX = 250 - ((TOTAL - 1) * 0.5) * (CARD_W + GAP);

        for (let i = 0; i < TOTAL; i++) {
            const opt    = options[i];
            const cx     = startX + i * (CARD_W + GAP);
            const cy     = 385;
            this._makeCard(cx, cy, CARD_W, CARD_H, opt);
        }
    }

    hide() {
        if (this._container) {
            this._container.destroy(true);
            this._container = null;
        }
        if (this._scene) {
            this._scene.physics.resume();
        }
    }

    _makeCard(cx, cy, W, H, option) {
        const scene = this._scene;
        const T = UITheme;
        const C = T.colors;
        const x0 = cx - W / 2, y0 = cy - H / 2;
        const accent = this._accentColor(option);

        // 赛博朋克面板
        const gfx = scene.add.graphics().setDepth(52);
        const draw = (hover) => {
            gfx.clear();

            // 辉光层
            if (hover) {
                gfx.lineStyle(2, accent, 0.25);
                gfx.strokeRoundedRect(x0 - 3, y0 - 3, W + 6, H + 6, 8);
            }

            // 背景
            gfx.fillStyle(hover ? C.bgPanelLight : C.bgPanel, 0.96);
            gfx.fillRoundedRect(x0, y0, W, H, 5);

            // 扫描线纹理
            gfx.fillStyle(accent, 0.02);
            for (let sy = y0; sy < y0 + H; sy += 4) {
                gfx.fillRect(x0, sy, W, 1);
            }

            // 边框
            gfx.lineStyle(hover ? 2 : 1.5, accent, hover ? 1.0 : 0.55);
            gfx.strokeRoundedRect(x0, y0, W, H, 5);

            // 左侧强调条
            gfx.fillStyle(accent, hover ? 1.0 : 0.5);
            gfx.fillRect(x0 + 1, y0 + 14, 3, H - 28);

            // 角落装饰
            const cLen = 8;
            gfx.lineStyle(1, accent, 0.5);
            gfx.lineBetween(x0, y0 + cLen, x0 + cLen, y0);
            gfx.lineBetween(x0 + W - cLen, y0, x0 + W, y0 + cLen);
            gfx.lineBetween(x0, y0 + H - cLen, x0 + cLen, y0 + H);
            gfx.lineBetween(x0 + W - cLen, y0 + H, x0 + W, y0 + H - cLen);

            // 顶部装饰线
            gfx.fillStyle(accent, 0.3);
            gfx.fillRect(x0 + 12, y0 + 1, W - 24, 1);
        };
        draw(false);

        // 稀有度顶部色带
        if (option.rarity && option.rarity !== 'common') {
            const rarityBar = scene.add.graphics().setDepth(53);
            rarityBar.fillStyle(accent, 0.6);
            rarityBar.fillRect(x0 + 12, y0 + 2, W - 24, 2);
        }

        // 图标
        const iconTxt = scene.add.text(cx, y0 + 42, option.icon, {
            fontSize: '30px'
        }).setOrigin(0.5).setDepth(53);

        // 类型标签
        const typeLabel = this._typeLabel(option);
        const typeTxt = scene.add.text(cx, y0 + 70, typeLabel, {
            fontSize: '9px', fontFamily: T.font.family,
            fill: '#' + accent.toString(16).padStart(6, '0')
        }).setOrigin(0.5).setDepth(53);

        // 名称（含稀有度标签）
        const nameTxt = scene.add.text(cx, y0 + 90, option.label + (this._rarityTag(option) || ''), {
            fontSize: '12px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textPrimary, wordWrap: { width: W - 16 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(53);

        // 描述
        const descTxt = scene.add.text(cx, y0 + 130, option.desc, {
            fontSize: '10px', fontFamily: T.font.family,
            fill: C.textSecondary, wordWrap: { width: W - 20 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(53);

        const hit = scene.add.rectangle(cx, cy, W, H)
            .setInteractive({ cursor: 'pointer' })
            .setDepth(54);

        hit.on('pointerover', () => {
            draw(true);
            nameTxt.setStyle({ fill: '#ffffff' });
        });
        hit.on('pointerout', () => {
            draw(false);
            nameTxt.setStyle({ fill: C.textPrimary });
        });
        hit.on('pointerdown', () => {
            this.hide();
            if (this._onSelect) this._onSelect(option);
        });

        this._container.add([gfx, iconTxt, typeTxt, nameTxt, descTxt, hit]);
    }

    _accentColor(option) {
        const C = UITheme.colors;
        if (option.rarity === 'legendary') return C.purple;
        if (option.rarity === 'rare')      return C.info;
        if (option.rarity === 'uncommon')  return C.success;
        if (option.type === 'evolveWeapon') return C.purple;
        if (option.type === 'newWeapon')    return C.cyan;
        if (option.type === 'upgradeWeapon')return C.orange;
        if (option.type === 'passiveItem')  return C.success;
        switch (option.id) {
            case 'speed':    return C.cyan;
            case 'hp':       return C.success;
            case 'cooldown': return C.warning;
            default:         return C.info;
        }
    }

    _rarityTag(option) {
        return UITheme.rarity[option.rarity]?.label || '';
    }

    _typeLabel(option) {
        switch (option.type) {
            case 'newWeapon':     return '[ WPN ]';
            case 'upgradeWeapon': return '[ UPG ]';
            case 'evolveWeapon':  return '[ EVO ]';
            case 'passiveItem':   return '[ RELIC ]';
            case 'stat':          return '[ STAT ]';
            default:              return '[ SYS ]';
        }
    }
}
