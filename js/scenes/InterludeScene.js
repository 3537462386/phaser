/**
 * InterludeScene — 太空补给终端（赛博朋克风格）
 *
 * 流程：轮结束 → 随机事件 → 军备补给站 → 继续战斗
 * 设计：终端界面、全息面板、霓虹分割线、扫描线背景
 */
class InterludeScene extends BaseScene {

    constructor() {
        super({ key: 'InterludeScene' });
        this._eventPhase   = false;
        this._currentEvent = null;
        this._rerollCount  = 0;
        this._shopItems    = [];
    }

    create(data) {
        data = data || this.scene.settings.data || {};
        const isRefresh = data.refreshShop === true;
        const skipEvent = data.skipEvent === true;

        if (!isRefresh) {
            this._fadeIn(400);
        }
        this._initStarfield(60);

        if (!GameState.run.playerSnapshot) {
            this.scene.start('MenuScene');
            return;
        }

        const snap           = GameState.run.playerSnapshot;
        const completedRound = GameState.run.currentRound;

        const T = UITheme;
        const C = T.colors;

        // 深层背景
        this.add.graphics()
            .fillStyle(C.bgDarkest, 0.92)
            .fillRect(0, 0, 500, 700);

        // 扫描线
        const scanGfx = this.add.graphics().setDepth(1);
        scanGfx.fillStyle(C.cyan, 0.015);
        for (let sy = 0; sy < 700; sy += 4) {
            scanGfx.fillRect(0, sy, 500, 1);
        }

        // 顶部信息栏
        const topBar = this.add.graphics().setDepth(2);
        topBar.fillStyle(C.bgDark, 0.9);
        topBar.fillRect(0, 0, 500, 50);
        topBar.fillStyle(C.cyan, 0.3);
        topBar.fillRect(0, 50, 500, 1);

        // 终端标识
        this.add.text(16, 16, 'TERM-7 // OUTPOST-STATION', {
            fontSize: '10px', fontFamily: T.font.family,
            fill: C.textDim
        }).setDepth(3);

        this.add.text(484, 16, `RND-${completedRound} COMPLETE`, {
            fontSize: '12px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textAccent, stroke: '#001a11', strokeThickness: 1
        }).setOrigin(1, 0).setDepth(3);

        const eventManager = new EventManager();
        if (!skipEvent && eventManager.shouldTriggerEvent(completedRound)) {
            this._currentEvent = eventManager.drawEvent();
            this._eventPhase = true;
            this._rerollCount = 0;
            this._renderEvent(snap, completedRound);
        } else {
            this._eventPhase = false;
            this._rerollCount = 0;
            this._renderShopPhase(snap, completedRound);
        }
    }

    update() {
        this._tickStars();
    }

    // ── 事件阶段 ──────────────────────────────────────────

    _renderEvent(snap, completedRound) {
        const evt = this._currentEvent;
        if (!evt) { this._renderShopPhase(snap, completedRound); return; }

        const T = UITheme;
        const C = T.colors;

        // 事件标题
        this.add.text(250, 80, '// ANOMALY DETECTED', {
            fontSize: '11px', fontFamily: T.font.family, fill: C.textDim
        }).setOrigin(0.5).setDepth(5);

        this.add.text(250, 130, evt.icon, {
            fontSize: '42px'
        }).setOrigin(0.5).setDepth(5);

        this.add.text(250, 185, evt.name, {
            fontSize: '24px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textGold, stroke: '#221100', strokeThickness: 2
        }).setOrigin(0.5).setDepth(5);

        this.add.text(250, 225, evt.desc, {
            fontSize: '13px', fontFamily: T.font.family, fill: C.textSecondary,
            wordWrap: { width: 360 }, align: 'center'
        }).setOrigin(0.5).setDepth(5);

        // 选项卡牌
        const CARD_W = 150, CARD_H = 150;
        const TOTAL  = evt.options.length;
        const startX = 250 - ((TOTAL - 1) * 0.5) * (CARD_W + 12);

        for (let i = 0; i < TOTAL; i++) {
            const opt = evt.options[i];
            const cx  = startX + i * (CARD_W + 12);
            const cy  = 390;
            this._drawEventCard(cx, cy, CARD_W, CARD_H, opt, snap);
        }

        this.add.text(250, 550, '> SELECT OPTION TO PROCEED', {
            fontSize: '11px', fontFamily: T.font.family, fill: C.textDim
        }).setOrigin(0.5).setDepth(5);
    }

    _drawEventCard(cx, cy, W, H, option, snap) {
        const T = UITheme;
        const C = T.colors;
        const x0 = cx - W / 2, y0 = cy - H / 2;

        const gfx = this.add.graphics().setDepth(5);
        const paintBg = (hover) => {
            gfx.clear();
            gfx.fillStyle(hover ? C.bgPanelLight : C.bgPanel, 0.95);
            gfx.fillRoundedRect(x0, y0, W, H, 5);
            // 扫描线
            gfx.fillStyle(C.cyan, 0.015);
            for (let sy = y0; sy < y0 + H; sy += 4) {
                gfx.fillRect(x0, sy, W, 1);
            }
            gfx.lineStyle(1.5, hover ? C.orange : C.orangeDim, hover ? 1.0 : 0.55);
            gfx.strokeRoundedRect(x0, y0, W, H, 5);
            // 左侧强调条
            gfx.fillStyle(C.orange, hover ? 1.0 : 0.4);
            gfx.fillRect(x0 + 1, y0 + 14, 3, H - 28);
            // 角落
            const cL = 8;
            gfx.lineStyle(1, C.orange, 0.4);
            gfx.lineBetween(x0, y0 + cL, x0 + cL, y0);
            gfx.lineBetween(x0 + W - cL, y0, x0 + W, y0 + cL);
            gfx.lineBetween(x0, y0 + H - cL, x0 + cL, y0 + H);
            gfx.lineBetween(x0 + W - cL, y0 + H, x0 + W, y0 + H - cL);
        };
        paintBg(false);

        this.add.text(cx, y0 + 40, option.label, {
            fontSize: '14px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textGold, wordWrap: { width: W - 16 }, align: 'center'
        }).setOrigin(0.5).setDepth(6);

        this.add.text(cx, y0 + 80, option.desc, {
            fontSize: '11px', fontFamily: T.font.family, fill: C.textSecondary,
            wordWrap: { width: W - 16 }, align: 'center'
        }).setOrigin(0.5).setDepth(6);

        const hit = this.add.rectangle(cx, cy, W, H)
            .setInteractive({ cursor: 'pointer' }).setDepth(7);
        hit.on('pointerover', () => paintBg(true));
        hit.on('pointerout',  () => paintBg(false));
        hit.on('pointerdown', () => {
            option.effect(snap, GameState.run, {
                acquireRelic: (itemId) => {
                    if (!snap.relicsToAcquire) snap.relicsToAcquire = [];
                    snap.relicsToAcquire.push(itemId);
                }
            });
            this._eventPhase = false;
            this._renderShopPhase(snap, GameState.run.currentRound);
        });
    }

    // ── 商店阶段 ──────────────────────────────────────────

    _renderShopPhase(snap, completedRound) {
        if (this._currentEvent && !this._shopEntered) {
            this._shopEntered = true;
            this.scene.restart({ skipEvent: true, refreshShop: true });
            return;
        }
        this._shopEntered = false;

        const T = UITheme;
        const C = T.colors;

        // 商店标题
        this.add.text(250, 66, '// ARMORY SUPPLY STATION', {
            fontSize: '18px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textAccent, stroke: '#001a11', strokeThickness: 2
        }).setOrigin(0.5).setDepth(5);

        // 分隔线
        const sepGfx = this.add.graphics().setDepth(5);
        sepGfx.fillStyle(C.cyan, 0.2);
        sepGfx.fillRect(50, 90, 400, 1);

        // 状态栏
        this._hpTxt = this.add.text(100, 100, '', {
            fontSize: '13px', fontFamily: T.font.family
        }).setOrigin(0.5).setDepth(6);

        this._goldTxt = this.add.text(400, 100, '', {
            fontSize: '15px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textGold, stroke: '#221100', strokeThickness: 1
        }).setOrigin(0.5).setDepth(6);

        this._updateStatus(snap);

        // 商店卡牌
        this._renderShop(snap);

        // 重roll 按钮
        this._addRerollButton(snap, completedRound);

        // 继续按钮
        this._addContinueButton();

        this.add.text(250, 672, '> SELECT ITEM TO PURCHASE | REROLL REFRESHES RELICS', {
            fontSize: '10px', fontFamily: T.font.family, fill: C.textDim
        }).setOrigin(0.5).setDepth(5);
    }

    _updateStatus(snap) {
        const T = UITheme;
        const C = T.colors;
        if (snap && this._hpTxt) {
            const hpRatio = snap.maxHp > 0 ? snap.hp / snap.maxHp : 0;
            const hpColor = hpRatio > 0.6 ? C.textAccent : (hpRatio > 0.3 ? '#ffcc22' : '#ff3344');
            this._hpTxt.setText(`HULL: ${snap.hp}/${snap.maxHp}`);
            this._hpTxt.setStyle({ fill: hpColor });
        }
        if (this._goldTxt) {
            this._goldTxt.setText(`CR: ${GameState.run.gold}`);
        }
    }

    _renderShop(snap) {
        const items = this._buildItems(snap);

        const cols  = 3;
        const cardW = 150, cardH = 100;
        const gapX  = 6,   gapY  = 6;
        const totalW = cols * cardW + (cols - 1) * gapX;
        const startX = (500 - totalW) / 2;
        const startY = 120;

        for (let i = 0; i < items.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx  = startX + col * (cardW + gapX);
            const cy  = startY + row * (cardH + gapY);
            this._drawCard(cx, cy, cardW, cardH, items[i], snap);
        }
    }

    _buildItems(snap) {
        const items = [];

        items.push({
            icon: '+', label: 'HULL +1', desc: 'Restore 1 hull point',
            cost: 10, accent: 0x22ff88,
            canBuy() { return snap.hp < snap.maxHp && GameState.run.gold >= 10; },
            onBuy()  { snap.hp = Math.min(snap.hp + 1, snap.maxHp); GameState.run.gold -= 10; }
        });

        items.push({
            icon: '++', label: 'HULL MAX', desc: 'Full hull restoration',
            cost: 30, accent: 0x22ff88,
            canBuy() { return snap.hp < snap.maxHp && GameState.run.gold >= 30; },
            onBuy()  { snap.hp = snap.maxHp; GameState.run.gold -= 30; }
        });

        items.push({
            icon: 'UP', label: 'HULL+1 MAX', desc: 'Increase max hull',
            cost: 25, accent: 0x22ff88,
            canBuy() { return snap.maxHp < 10 && GameState.run.gold >= 25; },
            onBuy()  {
                snap.maxHp++;
                snap.hp = Math.min(snap.hp + 1, snap.maxHp);
                GameState.run.gold -= 25;
            }
        });

        items.push({
            icon: 'SPD', label: 'THRUST +15%', desc: 'Movement speed up',
            cost: 20, accent: 0x00ffcc,
            canBuy() { return snap.moveSpeed < 500 && GameState.run.gold >= 20; },
            onBuy()  { snap.moveSpeed = Math.min(500, snap.moveSpeed * 1.15); GameState.run.gold -= 20; }
        });

        items.push({
            icon: 'FIR', label: 'FIRE RATE +10%', desc: 'Shoot faster',
            cost: 20, accent: 0xffcc22,
            canBuy() { return snap.fireCooldown > 60 && GameState.run.gold >= 20; },
            onBuy()  { snap.fireCooldown = Math.max(60, snap.fireCooldown * 0.9); GameState.run.gold -= 20; }
        });

        for (const w of snap.weapons) {
            if (w.level >= 3) continue;
            const wd = typeof WEAPON_DATA !== 'undefined' ? WEAPON_DATA[w.id] : null;
            if (!wd) continue;
            const cost = 15 + w.level * 5;
            const _w = w, _cost = cost;
            items.push({
                icon:  'WPN',
                label: `UPG ${wd.name}`,
                desc:  `${wd.name} => LV${_w.level + 1}`,
                cost:  _cost, accent: 0xff8822,
                canBuy() { return _w.level < 3 && GameState.run.gold >= _cost; },
                onBuy()  { _w.level++; GameState.run.gold -= _cost; }
            });
        }

        for (const w of snap.weapons) {
            if (w.level < 3) continue;
            const evo = typeof WEAPON_EVOLUTION !== 'undefined' ? WEAPON_EVOLUTION[w.id] : null;
            if (!evo) continue;
            const hasCatalyst = snap.relics && snap.relics.some(r => r.id === evo.catalyst);
            if (!hasCatalyst) continue;
            const cost = 40;
            const _w = w, _evo = evo;
            items.push({
                icon:  'EVO',
                label: `EVOLVE ${_evo.evolvedName}`,
                desc:  _evo.evolvedDesc,
                cost:  cost, accent: 0xaa44ff,
                canBuy() { return GameState.run.gold >= cost; },
                onBuy()  {
                    _w.id = _evo.evolvedId;
                    _w.level = 4;
                    GameState.run.gold -= cost;
                }
            });
        }

        if (!this._shopItems || this._shopItems.length === 0) {
            this._shopItems = this._generateRelicShop();
        }

        for (const relicId of this._shopItems) {
            const rd = PASSIVE_ITEM_DATA[relicId];
            if (!rd) continue;
            const cost = rd.tier === 2 ? 35 : 20;
            const _rd = relicId, _cost2 = cost;
            items.push({
                icon:  'REL',
                label: `RELIC: ${rd.name}`,
                desc:  rd.desc,
                cost:  _cost2, accent: 0x44aaff,
                canBuy() { return GameState.run.gold >= _cost2; },
                onBuy()  {
                    if (!snap.relicsToAcquire) snap.relicsToAcquire = [];
                    snap.relicsToAcquire.push(_rd);
                    const idx = this._shopItems.indexOf(_rd);
                    if (idx >= 0) this._shopItems.splice(idx, 1);
                    GameState.run.gold -= _cost2;
                }
            });
        }

        return items;
    }

    _generateRelicShop() {
        const pool = Object.values(PASSIVE_ITEM_DATA);
        const picked = [];
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(2, shuffled.length); i++) {
            picked.push(shuffled[i].id);
        }
        return picked;
    }

    _drawCard(x, y, w, h, item, snap) {
        const T = UITheme;
        const C = T.colors;
        const depth = 5;
        const avail = item.canBuy();
        const accent = item.accent || C.cyan;

        const bg = this.add.graphics().setDepth(depth);
        const paintBg = (hover) => {
            bg.clear();
            // 背景
            bg.fillStyle(hover ? C.bgPanelLight : C.bgPanel, avail ? 0.95 : 0.5);
            bg.fillRoundedRect(x, y, w, h, 4);
            // 扫描线
            if (avail) {
                bg.fillStyle(accent, 0.012);
                for (let sy = y; sy < y + h; sy += 4) {
                    bg.fillRect(x, sy, w, 1);
                }
            }
            // 边框
            bg.lineStyle(1.5, avail ? (hover ? accent : accent) : 0x1a2233, avail ? (hover ? 1.0 : 0.5) : 0.3);
            bg.strokeRoundedRect(x, y, w, h, 4);
            // 左侧条
            bg.fillStyle(accent, avail ? (hover ? 1.0 : 0.4) : 0.15);
            bg.fillRect(x + 1, y + 10, 2, h - 20);
        };
        paintBg(false);

        const alpha = avail ? 1 : 0.35;

        // 代码标签
        this.add.text(x + 10, y + 8, item.icon, {
            fontSize: '9px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: '#' + accent.toString(16).padStart(6, '0')
        }).setDepth(depth + 1).setAlpha(alpha);

        this.add.text(x + w / 2, y + 28, item.label, {
            fontSize: '11px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: avail ? C.textPrimary : '#3a4a5a'
        }).setOrigin(0.5).setDepth(depth + 1);

        this.add.text(x + w / 2, y + 48, item.desc, {
            fontSize: '9px', fontFamily: T.font.family,
            fill: avail ? C.textSecondary : '#2a3a48',
            wordWrap: { width: w - 12 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(depth + 1);

        // 金币价格
        const costColor = avail
            ? (GameState.run.gold >= item.cost ? C.textGold : '#ff3344')
            : '#4a3a22';
        this.add.text(x + w / 2, y + h - 14, `CR: ${item.cost}`, {
            fontSize: '11px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: costColor
        }).setOrigin(0.5).setDepth(depth + 1);

        if (avail) {
            const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h)
                .setInteractive({ cursor: 'pointer' }).setDepth(depth + 2);
            hit.on('pointerover', () => paintBg(true));
            hit.on('pointerout',  () => paintBg(false));
            hit.on('pointerdown', () => {
                if (!item.canBuy()) return;
                item.onBuy();
                this.scene.restart({ skipEvent: true, refreshShop: true });
            });
        }
    }

    _addRerollButton(snap, completedRound) {
        const T = UITheme;
        const C = T.colors;
        const rerollCost = 10 + this._rerollCount * 5;
        const btnY = 600;
        const gfx  = this.add.graphics().setDepth(10);
        const canReroll = GameState.run.gold >= rerollCost;

        const draw = (hover) => {
            gfx.clear();
            gfx.fillStyle(hover ? C.bgPanelLight : C.bgPanel, canReroll ? 0.95 : 0.5);
            gfx.fillRoundedRect(175, btnY - 18, 150, 36, 4);
            gfx.lineStyle(1, canReroll ? (hover ? C.purple : C.purpleDim) : 0x222233, 1);
            gfx.strokeRoundedRect(175, btnY - 18, 150, 36, 4);
            if (canReroll) {
                gfx.fillStyle(C.purple, hover ? 0.5 : 0.25);
                gfx.fillRect(176, btnY - 6, 2, 24);
            }
        };
        draw(false);

        const txt = this.add.text(250, btnY, `REROLL [CR:${rerollCost}]`, {
            fontSize: '13px', fontFamily: T.font.family,
            fill: canReroll ? '#cc66ff' : '#444455'
        }).setOrigin(0.5).setDepth(11);

        if (canReroll) {
            const hit = this.add.rectangle(250, btnY, 150, 36)
                .setInteractive({ cursor: 'pointer' }).setDepth(12);
            hit.on('pointerover', () => { draw(true);  txt.setStyle({ fill: '#ffffff' }); });
            hit.on('pointerout',  () => { draw(false); txt.setStyle({ fill: '#cc66ff' }); });
            hit.on('pointerdown', () => {
                GameState.run.gold -= rerollCost;
                this._rerollCount++;
                this._shopItems = this._generateRelicShop();
                this.scene.restart({ skipEvent: true, refreshShop: true });
            });
        }
    }

    _addContinueButton() {
        const T = UITheme;
        const C = T.colors;
        const btnY = 642;
        const gfx  = this.add.graphics().setDepth(10);
        const draw = (hover) => {
            gfx.clear();
            gfx.fillStyle(hover ? C.bgPanelLight : C.bgPanel, 0.96);
            gfx.fillRoundedRect(150, btnY - 24, 200, 48, 5);
            gfx.lineStyle(2, hover ? C.success : C.cyanDim, 1);
            gfx.strokeRoundedRect(150, btnY - 24, 200, 48, 5);
            // 左侧条
            gfx.fillStyle(hover ? C.success : C.cyan, 0.6);
            gfx.fillRect(151, btnY - 12, 3, 24);
            // 角落
            gfx.lineStyle(1, hover ? C.success : C.cyan, 0.4);
            gfx.lineBetween(150, btnY - 24 + 8, 150 + 8, btnY - 24);
            gfx.lineBetween(350 - 8, btnY - 24, 350, btnY - 24 + 8);
        };
        draw(false);

        const txt = this.add.text(250, btnY, 'DEPLOY >>', {
            fontSize: '18px', fontFamily: T.font.family, fontStyle: 'bold',
            fill: C.textAccent
        }).setOrigin(0.5).setDepth(11);

        const hit = this.add.rectangle(250, btnY, 200, 48)
            .setInteractive({ cursor: 'pointer' }).setDepth(12);
        hit.on('pointerover', () => { draw(true);  txt.setStyle({ fill: '#ffffff' }); });
        hit.on('pointerout',  () => { draw(false); txt.setStyle({ fill: C.textAccent }); });
        hit.on('pointerdown', () => {
            GameState.run.currentRound++;
            GameState.resetRound();

            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene', { fromInterlude: true });
            });
        });

        const menuTxt = this.add.text(250, 672, '< ABORT MISSION', {
            fontSize: '11px', fontFamily: T.font.family, fill: C.textDim
        }).setOrigin(0.5).setDepth(11).setInteractive({ cursor: 'pointer' });
        menuTxt.on('pointerover', () => menuTxt.setStyle({ fill: C.textDanger }));
        menuTxt.on('pointerout',  () => menuTxt.setStyle({ fill: C.textDim }));
        menuTxt.on('pointerdown', () => {
            this.cameras.main.fadeOut(220, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MenuScene');
            });
        });
    }
}
