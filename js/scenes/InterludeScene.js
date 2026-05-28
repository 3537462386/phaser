/**
 * InterludeScene — 轮间休整场景
 *
 * 优化后流程：
 *   1. 轮结束 → 随机事件（EventManager）
 *   2. 事件选择后 → 军备补给站（商店）
 *   3. 商店 → 继续战斗
 *
 * 商店新增：
 *   - 遗物购买（随机 tier 1/2 遗物，可重roll）
 *   - 武器进化（条件满足时可进化）
 *   - 重roll 商店（消耗金币刷新商品）
 *   - 金币经济深度优化
 *
 * 数据来源：GameState.run.playerSnapshot
 * 数据去向：修改 playerSnapshot，GameScene.create() 读取并应用
 */
class InterludeScene extends BaseScene {

    constructor() {
        super({ key: 'InterludeScene' });
        this._eventPhase   = false;   // 是否在事件阶段
        this._currentEvent = null;    // 当前事件数据
        this._rerollCount  = 0;       // 本轮重roll次数
        this._shopItems    = [];      // 当前商店遗物商品
    }

    create(data) {
        data = data || this.scene.settings.data || {};
        const isRefresh = data.refreshShop === true;
        const skipEvent = data.skipEvent === true;

        if (!isRefresh) {
            this._fadeIn(400);
        }
        this._initStarfield(80);

        // 若无快照，跳回菜单
        if (!GameState.run.playerSnapshot) {
            this.scene.start('MenuScene');
            return;
        }

        const snap           = GameState.run.playerSnapshot;
        const completedRound = GameState.run.currentRound;

        // 底层半透明背景
        this.add.graphics()
            .fillStyle(0x000011, 0.9)
            .fillRect(0, 0, 500, 700);

        // 判断是否先触发事件
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

        // 标题
        this.add.text(250, 36, `第 ${completedRound} 轮完成`, {
            fontSize: '20px', fontFamily: 'Arial', fill: '#aabbcc'
        }).setOrigin(0.5);

        this.add.text(250, 100, evt.icon, {
            fontSize: '48px'
        }).setOrigin(0.5);

        this.add.text(250, 160, evt.name, {
            fontSize: '28px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ffcc44', stroke: '#443300', strokeThickness: 3
        }).setOrigin(0.5);

        this.add.text(250, 200, evt.desc, {
            fontSize: '14px', fontFamily: 'Arial', fill: '#8899aa',
            wordWrap: { width: 360 }, align: 'center'
        }).setOrigin(0.5);

        // 选项卡牌
        const CARD_W = 140, CARD_H = 140;
        const TOTAL  = evt.options.length;
        const startX = 250 - ((TOTAL - 1) * 0.5) * (CARD_W + 12);

        for (let i = 0; i < TOTAL; i++) {
            const opt = evt.options[i];
            const cx  = startX + i * (CARD_W + 12);
            const cy  = 380;
            this._drawEventCard(cx, cy, CARD_W, CARD_H, opt, snap);
        }

        // 提示
        this.add.text(250, 560, '选择一个选项继续', {
            fontSize: '12px', fontFamily: 'Arial', fill: '#445566'
        }).setOrigin(0.5);
    }

    _drawEventCard(cx, cy, W, H, option, snap) {
        const x0 = cx - W / 2, y0 = cy - H / 2;

        const gfx = this.add.graphics().setDepth(5);
        const paintBg = (hover) => {
            gfx.clear();
            gfx.fillStyle(hover ? 0x1a1a3a : 0x0a0a1e, 0.95);
            gfx.fillRoundedRect(x0, y0, W, H, 10);
            gfx.lineStyle(1.5, hover ? 0xffaa44 : 0x554422, 1);
            gfx.strokeRoundedRect(x0, y0, W, H, 10);
        };
        paintBg(false);

        this.add.text(cx, y0 + 40, option.label, {
            fontSize: '14px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ffddaa', wordWrap: { width: W - 16 }, align: 'center'
        }).setOrigin(0.5).setDepth(6);

        this.add.text(cx, y0 + 80, option.desc, {
            fontSize: '11px', fontFamily: 'Arial', fill: '#8899aa',
            wordWrap: { width: W - 16 }, align: 'center'
        }).setOrigin(0.5).setDepth(6);

        const hit = this.add.rectangle(cx, cy, W, H)
            .setInteractive({ cursor: 'pointer' }).setDepth(7);
        hit.on('pointerover', () => paintBg(true));
        hit.on('pointerout',  () => paintBg(false));
        hit.on('pointerdown', () => {
            option.effect(snap, GameState.run, {
                acquireRelic: (itemId) => {
                    // 通过快照传递遗物获取
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
        // 清除旧内容（事件阶段留下来的）
        if (this._eventPhase === false) {
            // 已经在商店阶段，仅刷新时重建
        }

        // 如果是事件后切换到商店，需要重建场景
        // 简化处理：直接 restart
        if (this._currentEvent && !this._shopEntered) {
            this._shopEntered = true;
            this.scene.restart({ skipEvent: true, refreshShop: true });
            return;
        }
        this._shopEntered = false;

        // 标题
        this.add.text(250, 36, `第 ${completedRound} 轮完成！`, {
            fontSize: '34px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ffee44', stroke: '#443300', strokeThickness: 4
        }).setOrigin(0.5);

        // 状态栏
        this._hpTxt = this.add.text(130, 82, '', {
            fontSize: '21px', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this._goldTxt = this.add.text(370, 82, '', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ffcc44'
        }).setOrigin(0.5);

        this._updateStatus(snap);

        // 分区标题
        this.add.text(250, 114, '─── 军备补给站 ───', {
            fontSize: '14px', fontFamily: 'Arial',
            fill: '#556677', stroke: '#000011', strokeThickness: 2
        }).setOrigin(0.5);

        // 商店卡牌
        this._renderShop(snap);

        // 重roll 按钮
        this._addRerollButton(snap, completedRound);

        // 继续按钮
        this._addContinueButton();

        // 提示
        this.add.text(250, 672, '点击卡牌消耗金币购买 | 重roll可刷新遗物商品', {
            fontSize: '11px', fontFamily: 'Arial', fill: '#334455'
        }).setOrigin(0.5);
    }

    _updateStatus(snap) {
        if (snap && this._hpTxt) {
            let hearts = '';
            for (let i = 0; i < snap.maxHp; i++) {
                hearts += i < snap.hp ? '❤' : '🖤';
            }
            this._hpTxt.setText(hearts);
        }
        if (this._goldTxt) {
            this._goldTxt.setText(`💰 ${GameState.run.gold}`);
        }
    }

    _renderShop(snap) {
        const items = this._buildItems(snap);

        const cols  = 3;
        const cardW = 148, cardH = 100;
        const gapX  = 6,   gapY  = 6;
        const totalW = cols * cardW + (cols - 1) * gapX;
        const startX = (500 - totalW) / 2;
        const startY = 134;

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

        // ── HP 恢复 ───────────────────────────────────────────
        items.push({
            icon: '❤', label: 'HP +1', desc: '立即恢复一点生命',
            cost: 10,
            canBuy() { return snap.hp < snap.maxHp && GameState.run.gold >= 10; },
            onBuy()  { snap.hp = Math.min(snap.hp + 1, snap.maxHp); GameState.run.gold -= 10; }
        });

        items.push({
            icon: '💊', label: '全满回血', desc: '生命值完全恢复',
            cost: 30,
            canBuy() { return snap.hp < snap.maxHp && GameState.run.gold >= 30; },
            onBuy()  { snap.hp = snap.maxHp; GameState.run.gold -= 30; }
        });

        // ── HP 上限 ───────────────────────────────────────────
        items.push({
            icon: '🛡', label: 'HP上限 +1', desc: '永久增加最大生命',
            cost: 25,
            canBuy() { return snap.maxHp < 10 && GameState.run.gold >= 25; },
            onBuy()  {
                snap.maxHp++;
                snap.hp = Math.min(snap.hp + 1, snap.maxHp);
                GameState.run.gold -= 25;
            }
        });

        // ── 属性强化 ──────────────────────────────────────────
        items.push({
            icon: '💨', label: '提升移速', desc: '移动速度 +15%',
            cost: 20,
            canBuy() { return snap.moveSpeed < 500 && GameState.run.gold >= 20; },
            onBuy()  { snap.moveSpeed = Math.min(500, snap.moveSpeed * 1.15); GameState.run.gold -= 20; }
        });

        items.push({
            icon: '⚡', label: '加速射击', desc: '射击冷却 -10%',
            cost: 20,
            canBuy() { return snap.fireCooldown > 60 && GameState.run.gold >= 20; },
            onBuy()  { snap.fireCooldown = Math.max(60, snap.fireCooldown * 0.9); GameState.run.gold -= 20; }
        });

        // ── 武器升级 ──────────────────────────────────────────
        for (const w of snap.weapons) {
            if (w.level >= 3) continue;
            const wd   = typeof WEAPON_DATA !== 'undefined' ? WEAPON_DATA[w.id] : null;
            if (!wd) continue;
            const cost = 15 + w.level * 5;
            const _w = w, _cost = cost;
            items.push({
                icon:  wd.icon,
                label: `升级 ${wd.name}`,
                desc:  `${wd.name} → Lv${_w.level + 1}`,
                cost:  _cost,
                canBuy() { return _w.level < 3 && GameState.run.gold >= _cost; },
                onBuy()  { _w.level++; GameState.run.gold -= _cost; }
            });
        }

        // ── 武器进化（新增）──────────────────────────────────
        for (const w of snap.weapons) {
            if (w.level < 3) continue;
            const evo = typeof WEAPON_EVOLUTION !== 'undefined' ? WEAPON_EVOLUTION[w.id] : null;
            if (!evo) continue;
            // 检查是否持有催化剂遗物
            const hasCatalyst = snap.relics && snap.relics.some(r => r.id === evo.catalyst);
            if (!hasCatalyst) continue;
            const cost = 40;
            const _w = w, _evo = evo;
            items.push({
                icon:  _evo.evolvedIcon,
                label: `进化 ${_evo.evolvedName}`,
                desc:  _evo.evolvedDesc,
                cost:  cost,
                canBuy() { return GameState.run.gold >= cost; },
                onBuy()  {
                    _w.id = _evo.evolvedId;
                    _w.level = 4;  // 进化标记
                    GameState.run.gold -= cost;
                }
            });
        }

        // ── 随机遗物购买（新增）──────────────────────────────
        if (!this._shopItems || this._shopItems.length === 0) {
            this._shopItems = this._generateRelicShop();
        }

        for (const relicId of this._shopItems) {
            const rd = PASSIVE_ITEM_DATA[relicId];
            if (!rd) continue;
            const cost = rd.tier === 2 ? 35 : 20;
            const _rd = relicId, _cost2 = cost;
            items.push({
                icon:  rd.icon,
                label: `遗物: ${rd.name}`,
                desc:  rd.desc,
                cost:  _cost2,
                canBuy() { return GameState.run.gold >= _cost2; },
                onBuy()  {
                    if (!snap.relicsToAcquire) snap.relicsToAcquire = [];
                    snap.relicsToAcquire.push(_rd);
                    // 从商店列表中移除
                    const idx = this._shopItems.indexOf(_rd);
                    if (idx >= 0) this._shopItems.splice(idx, 1);
                    GameState.run.gold -= _cost2;
                }
            });
        }

        return items;
    }

    _generateRelicShop() {
        // 随机选 2 个遗物放入商店
        const pool = Object.values(PASSIVE_ITEM_DATA);
        const picked = [];
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(2, shuffled.length); i++) {
            picked.push(shuffled[i].id);
        }
        return picked;
    }

    _drawCard(x, y, w, h, item, snap) {
        const depth = 5;
        const avail = item.canBuy();

        const bg = this.add.graphics().setDepth(depth);
        const paintBg = (hover) => {
            bg.clear();
            bg.fillStyle(hover ? 0x0c1e3a : 0x060e1e, avail ? 0.95 : 0.5);
            bg.fillRoundedRect(x, y, w, h, 8);
            bg.lineStyle(1.5,
                avail ? (hover ? 0x55aaff : 0x224488) : 0x1a2233,
                avail ? 1 : 0.6);
            bg.strokeRoundedRect(x, y, w, h, 8);
        };
        paintBg(false);

        const alpha = avail ? 1 : 0.38;

        this.add.text(x + w / 2, y + 14, item.icon, {
            fontSize: '20px'
        }).setOrigin(0.5).setDepth(depth + 1).setAlpha(alpha);

        this.add.text(x + w / 2, y + 38, item.label, {
            fontSize: '11px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: avail ? '#ddeeff' : '#3a4a5a'
        }).setOrigin(0.5).setDepth(depth + 1);

        this.add.text(x + w / 2, y + 54, item.desc, {
            fontSize: '9px', fontFamily: 'Arial',
            fill: avail ? '#7799aa' : '#2a3a48',
            wordWrap: { width: w - 10 }, align: 'center'
        }).setOrigin(0.5, 0).setDepth(depth + 1);

        const costColor = avail
            ? (GameState.run.gold >= item.cost ? '#ffcc44' : '#ff6644')
            : '#4a3a22';
        this.add.text(x + w / 2, y + h - 12, `💰 ${item.cost}`, {
            fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
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

    // ── 重roll 按钮 ──────────────────────────────────────────

    _addRerollButton(snap, completedRound) {
        const rerollCost = 10 + this._rerollCount * 5;
        const btnY = 598;
        const gfx  = this.add.graphics().setDepth(10);
        const canReroll = GameState.run.gold >= rerollCost;

        const draw = (hover) => {
            gfx.clear();
            gfx.fillStyle(hover ? 0x1a1a38 : 0x0e0e1e, canReroll ? 0.95 : 0.5);
            gfx.fillRoundedRect(175, btnY - 18, 150, 36, 8);
            gfx.lineStyle(1, canReroll ? (hover ? 0x8866ff : 0x5533aa) : 0x222233, 1);
            gfx.strokeRoundedRect(175, btnY - 18, 150, 36, 8);
        };
        draw(false);

        const txt = this.add.text(250, btnY, `🔄 重roll (${rerollCost}💰)`, {
            fontSize: '14px', fontFamily: 'Arial',
            fill: canReroll ? '#aa88ff' : '#444455'
        }).setOrigin(0.5).setDepth(11);

        if (canReroll) {
            const hit = this.add.rectangle(250, btnY, 150, 36)
                .setInteractive({ cursor: 'pointer' }).setDepth(12);
            hit.on('pointerover', () => { draw(true); txt.setStyle({ fill: '#ffffff' }); });
            hit.on('pointerout',  () => { draw(false); txt.setStyle({ fill: '#aa88ff' }); });
            hit.on('pointerdown', () => {
                GameState.run.gold -= rerollCost;
                this._rerollCount++;
                this._shopItems = this._generateRelicShop();
                this.scene.restart({ skipEvent: true, refreshShop: true });
            });
        }
    }

    // ── 继续按钮 ──────────────────────────────────────────────

    _addContinueButton() {
        const btnY = 640;
        const gfx  = this.add.graphics().setDepth(10);
        const draw = (hover) => {
            gfx.clear();
            gfx.fillStyle(hover ? 0x143614 : 0x0a1e0a, 0.96);
            gfx.fillRoundedRect(150, btnY - 24, 200, 48, 12);
            gfx.lineStyle(2, hover ? 0x55ff88 : 0x228844, 1);
            gfx.strokeRoundedRect(150, btnY - 24, 200, 48, 12);
        };
        draw(false);

        const txt = this.add.text(250, btnY, '继续战斗 →', {
            fontSize: '20px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#55ffaa'
        }).setOrigin(0.5).setDepth(11);

        const hit = this.add.rectangle(250, btnY, 200, 48)
            .setInteractive({ cursor: 'pointer' }).setDepth(12);
        hit.on('pointerover', () => { draw(true);  txt.setStyle({ fill: '#ffffff' }); });
        hit.on('pointerout',  () => { draw(false); txt.setStyle({ fill: '#55ffaa' }); });
        hit.on('pointerdown', () => {
            GameState.run.currentRound++;
            GameState.resetRound();

            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene', { fromInterlude: true });
            });
        });

        const menuTxt = this.add.text(250, 668, '← 放弃本局，返回主菜单', {
            fontSize: '12px', fontFamily: 'Arial', fill: '#334455'
        }).setOrigin(0.5).setDepth(11).setInteractive({ cursor: 'pointer' });
        menuTxt.on('pointerover', () => menuTxt.setStyle({ fill: '#8899bb' }));
        menuTxt.on('pointerout',  () => menuTxt.setStyle({ fill: '#334455' }));
        menuTxt.on('pointerdown', () => {
            this.cameras.main.fadeOut(220, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('MenuScene');
            });
        });
    }
}
