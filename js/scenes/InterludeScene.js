/**
 * InterludeScene — 轮间休整场景
 *
 * 玩家每轮达成击杀目标后进入此场景，可以：
 *   - 消费金币恢复 HP / 增加 HP 上限
 *   - 升级已有武器
 *   - 强化属性（移速、冷却）
 *
 * 流程：
 *   GameScene --[轮结束]--> InterludeScene --[继续]--> GameScene (fromInterlude)
 *
 * 数据来源：GameState.run.playerSnapshot  （由 GameScene 写入）
 * 数据去向：修改 playerSnapshot，GameScene.create() 读取并应用
 */
class InterludeScene extends BaseScene {

    constructor() {
        super({ key: 'InterludeScene' });
    }

    create(data) {
        data = data || this.scene.settings.data || {};
        const isRefresh = data.refreshShop === true;

        if (!isRefresh) {
            this._fadeIn(400);
        }
        this._initStarfield(80);

        // 若无快照，说明直接访问该场景，跳回菜单
        if (!GameState.run.playerSnapshot) {
            this.scene.start('MenuScene');
            return;
        }

        const snap         = GameState.run.playerSnapshot;
        const completedRound = GameState.run.currentRound;

        // ── 底层半透明背景 ────────────────────────────────────
        this.add.graphics()
            .fillStyle(0x000011, 0.9)
            .fillRect(0, 0, 500, 700);

        // ── 标题 ──────────────────────────────────────────────
        this.add.text(250, 36, `第 ${completedRound} 轮完成！`, {
            fontSize: '34px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ffee44', stroke: '#443300', strokeThickness: 4
        }).setOrigin(0.5);

        // ── 状态栏（HP + 金币） ───────────────────────────────
        this._hpTxt = this.add.text(130, 82, '', {
            fontSize: '21px', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this._goldTxt = this.add.text(370, 82, '', {
            fontSize: '18px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ffcc44'
        }).setOrigin(0.5);

        this._updateStatus();

        // ── 分区标题 ──────────────────────────────────────────
        this.add.text(250, 114, '─── 军备补给站 ───', {
            fontSize: '14px', fontFamily: 'Arial',
            fill: '#556677', stroke: '#000011', strokeThickness: 2
        }).setOrigin(0.5);

        // ── 商店卡牌 ──────────────────────────────────────────
        this._renderShop(snap);

        // ── 继续按钮 ──────────────────────────────────────────
        this._addContinueButton();

        // ── 提示文字 ──────────────────────────────────────────
        this.add.text(250, 672, '点击卡牌消耗金币购买，可重复购买', {
            fontSize: '11px', fontFamily: 'Arial', fill: '#334455'
        }).setOrigin(0.5);
    }

    update() {
        this._tickStars();
    }

    // ── 状态显示 ──────────────────────────────────────────────

    _updateStatus() {
        const snap = GameState.run.playerSnapshot;
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

    // ── 商店卡牌渲染 ──────────────────────────────────────────

    _renderShop(snap) {
        const items = this._buildItems(snap);

        // 布局：3 列
        const cols  = 3;
        const cardW = 148, cardH = 112;
        const gapX  = 6,   gapY  = 8;
        const totalW = cols * cardW + (cols - 1) * gapX;
        const startX = (500 - totalW) / 2;
        const startY = 134;

        for (let i = 0; i < items.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx  = startX + col * (cardW + gapX);
            const cy  = startY + row * (cardH + gapY);
            this._drawCard(cx, cy, cardW, cardH, items[i]);
        }
    }

    _buildItems(snap) {
        const items = [];

        // ── HP 恢复 ───────────────────────────────────────────
        items.push({
            icon: '❤',
            label: 'HP +1',
            desc: '立即恢复一点生命',
            cost: 10,
            canBuy() { return snap.hp < snap.maxHp && GameState.run.gold >= 10; },
            onBuy()  { snap.hp = Math.min(snap.hp + 1, snap.maxHp); GameState.run.gold -= 10; }
        });

        items.push({
            icon: '💊',
            label: '全满回血',
            desc: '生命值完全恢复',
            cost: 30,
            canBuy() { return snap.hp < snap.maxHp && GameState.run.gold >= 30; },
            onBuy()  { snap.hp = snap.maxHp; GameState.run.gold -= 30; }
        });

        // ── HP 上限 ───────────────────────────────────────────
        items.push({
            icon: '🛡',
            label: 'HP上限 +1',
            desc: '永久增加最大生命',
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
            icon: '💨',
            label: '提升移速',
            desc: '移动速度 +15%',
            cost: 20,
            canBuy() { return snap.moveSpeed < 500 && GameState.run.gold >= 20; },
            onBuy()  { snap.moveSpeed = Math.min(500, snap.moveSpeed * 1.15); GameState.run.gold -= 20; }
        });

        items.push({
            icon: '⚡',
            label: '加速射击',
            desc: '射击冷却 -10%',
            cost: 20,
            canBuy() { return snap.fireCooldown > 60 && GameState.run.gold >= 20; },
            onBuy()  { snap.fireCooldown = Math.max(60, snap.fireCooldown * 0.9); GameState.run.gold -= 20; }
        });

        // ── 武器升级 ──────────────────────────────────────────
        for (const w of snap.weapons) {
            if (w.level >= 3) continue;
            const wd   = typeof WEAPON_DATA !== 'undefined' ? WEAPON_DATA[w.id] : null;
            if (!wd) continue;
            const cost = 15 + w.level * 5;   // Lv1→2: 15💰, Lv2→3: 20💰
            // 需要在闭包中捕获 w 和 cost
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

        return items;
    }

    _drawCard(x, y, w, h, item) {
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

        this.add.text(x + w / 2, y + 18, item.icon, {
            fontSize: '24px'
        }).setOrigin(0.5).setDepth(depth + 1).setAlpha(alpha);

        this.add.text(x + w / 2, y + 46, item.label, {
            fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: avail ? '#ddeeff' : '#3a4a5a'
        }).setOrigin(0.5).setDepth(depth + 1);

        this.add.text(x + w / 2, y + 64, item.desc, {
            fontSize: '10px', fontFamily: 'Arial',
            fill: avail ? '#7799aa' : '#2a3a48'
        }).setOrigin(0.5).setDepth(depth + 1);

        // 费用标签
        const costColor = avail
            ? (GameState.run.gold >= item.cost ? '#ffcc44' : '#ff6644')
            : '#4a3a22';
        this.add.text(x + w / 2, y + 86, `💰 ${item.cost}`, {
            fontSize: '13px', fontFamily: 'Arial', fontStyle: 'bold',
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
                // 刷新场景（重建所有卡牌以反映新状态）
                this.scene.restart({ refreshShop: true });
            });
        }
    }

    // ── 继续按钮 ──────────────────────────────────────────────

    _addContinueButton() {
        const btnY = 628;
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
            // 推进轮数并重置本轮计数
            GameState.run.currentRound++;
            GameState.resetRound();

            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene', { fromInterlude: true });
            });
        });

        // 返回菜单（小字）
        const menuTxt = this.add.text(250, 658, '← 放弃本局，返回主菜单', {
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
