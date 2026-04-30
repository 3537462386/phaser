/**
 * 暗棋场景（翻转棋）
 *
 * 规则：
 *  - 棋子初始随机分布在 32 格（4×8）棋盘上，全部朝下（未翻开）
 *  - 点击未翻开的棋子 → 翻开，归属自动判定（先翻方为红方）
 *  - 点击已翻开的己方棋子 → 选中
 *  - 选中后点击空格 → 移动（只能走相邻一格，上下左右）
 *  - 选中后点击对方棋子 → 吃子（按等级规则）
 *  - 炮可隔一子吃，移动规则同其他子（相邻一格）
 *  - 将帅不能吃兵卒
 *  - 己方无棋可走 → 游戏结束
 */
class DarkChessScene extends Phaser.Scene {
    constructor() {
        super('DarkChessScene');
        // 棋盘参数
        this.COLS   = 8;
        this.ROWS   = 4;
        this.CS     = 68;   // 格子大小
        this.PAD    = 20;
    }

    // ─── 等级表（数字越大越大）：帅/将=7, 车=6, 马=5, 炮=4（特殊），相/象=3, 仕/士=2, 兵/卒=1
    static RANK = { j: 7, c: 6, m: 5, p: 4, x: 3, s: 2, z: 1 };

    create() {
        this.isMobile = com.isMobileViewport();
        this.CS = this.isMobile ? 56 : 58;
        this.PAD = this.isMobile ? 16 : 18;
        this._gameOver = false;
        this._moving   = false;
        this.firstSide = null;   // 先翻者阵营 'red'|'black'
        this.currentTurn = null; // 'red'|'black'，翻第一子后确定
        this.selected  = null;   // 当前选中格 {col, row}

        this.drawBackground();
        this.setupBoard();
        this.drawBoard();
        this.renderPieces();
        this.createBackButton();
    }

    // ─────────────────────────────────────────────
    //  棋盘数据初始化
    // ─────────────────────────────────────────────
    setupBoard() {
        // 各棋子数量（双方合计 32 枚）
        const pool = [
            ...Array(1).fill({ type:'j', side:'red' }),
            ...Array(1).fill({ type:'j', side:'black' }),
            ...Array(2).fill({ type:'c', side:'red' }),
            ...Array(2).fill({ type:'c', side:'black' }),
            ...Array(2).fill({ type:'m', side:'red' }),
            ...Array(2).fill({ type:'m', side:'black' }),
            ...Array(2).fill({ type:'p', side:'red' }),
            ...Array(2).fill({ type:'p', side:'black' }),
            ...Array(2).fill({ type:'x', side:'red' }),
            ...Array(2).fill({ type:'x', side:'black' }),
            ...Array(2).fill({ type:'s', side:'red' }),
            ...Array(2).fill({ type:'s', side:'black' }),
            ...Array(5).fill({ type:'z', side:'red' }),
            ...Array(5).fill({ type:'z', side:'black' }),
        ];

        // Fisher-Yates 洗牌
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        // grid[row][col] = { type, side, flipped } | null
        this.grid = [];
        for (let r = 0; r < this.ROWS; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.COLS; c++) {
                const piece = pool[r * this.COLS + c];
                this.grid[r][c] = { ...piece, flipped: false };
            }
        }
    }

    // ─────────────────────────────────────────────
    //  绘制背景
    // ─────────────────────────────────────────────
    drawBackground() {
        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const g = this.add.graphics();
        const tileSize = this.isMobile ? 16 : 20;
        g.fillStyle(0x2c1e14, 1);
        g.fillRect(0, 0, W, H);
        for (let y = 0; y < H; y += tileSize) {
            for (let x = 0; x < W; x += tileSize) {
                const even = ((x / tileSize) + (y / tileSize)) % 2 === 0;
                g.fillStyle(even ? 0x3d2a1a : 0x352417, 1);
                g.fillRect(x, y, tileSize, tileSize);
            }
        }
    }

    // ─────────────────────────────────────────────
    //  计算棋盘偏移（居中）
    // ─────────────────────────────────────────────
    boardOffset() {
        const W  = this.cameras.main.width;
        const H  = this.cameras.main.height;
        const bw = this.COLS * this.CS + this.PAD * 2;
        const bh = this.ROWS * this.CS + this.PAD * 2;
        return {
            ox: Math.floor((W - bw) / 2) + this.PAD,
            oy: Math.floor((H - bh) / 2) + this.PAD + 20
        };
    }

    // ─────────────────────────────────────────────
    //  绘制棋盘格线
    // ─────────────────────────────────────────────
    drawBoard() {
        const { ox, oy } = this.boardOffset();
        const { COLS, ROWS, CS, PAD } = this;
        const bw = COLS * CS, bh = ROWS * CS;
        const g  = this.add.graphics();

        // 棋盘底色
        g.fillStyle(0xC89448, 1);
        g.fillRect(ox - PAD, oy - PAD, bw + PAD * 2, bh + PAD * 2);

        // 格线
        g.lineStyle(3, 0x5c3010, 1);
        for (let r = 0; r <= ROWS; r++) {
            g.beginPath();
            g.moveTo(ox, oy + r * CS);
            g.lineTo(ox + bw, oy + r * CS);
            g.strokePath();
        }
        for (let c = 0; c <= COLS; c++) {
            g.beginPath();
            g.moveTo(ox + c * CS, oy);
            g.lineTo(ox + c * CS, oy + bh);
            g.strokePath();
        }

        // 标题
        const W = this.cameras.main.width;
        this.add.text(W / 2, oy - PAD - 26, '暗  棋', {
            fontSize  : this.isMobile ? '20px' : '24px',
            color     : '#f0d9b5',
            fontFamily: com.pixelFont,
            fontStyle : 'bold',
            resolution: 2
        }).setOrigin(0.5);

        // 回合提示文字（动态更新）
        this.turnText = this.add.text(W / 2, oy + ROWS * CS + PAD + 18, '点击棋子开始翻牌', {
            fontSize  : this.isMobile ? '14px' : '15px',
            color     : '#f0d9b5',
            fontFamily: com.pixelFont,
            resolution: 2
        }).setOrigin(0.5).setDepth(5);
    }

    // ─────────────────────────────────────────────
    //  渲染所有棋子
    // ─────────────────────────────────────────────
    renderPieces() {
        // 清除旧的棋子容器
        if (this.pieceContainers) {
            this.pieceContainers.forEach(c => c.destroy());
        }
        this.pieceContainers = [];

        const { ox, oy } = this.boardOffset();
        const { COLS, ROWS, CS } = this;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = this.grid[r][c];
                if (!cell) continue;
                const cx = ox + c * CS + CS / 2;
                const cy = oy + r * CS + CS / 2;
                const sz = Math.floor(CS * 0.82);
                this.createPieceSprite(cx, cy, sz, cell, c, r);
            }
        }
    }

    createPieceSprite(cx, cy, sz, cell, col, row) {
        const isSelected = this.selected && this.selected.col === col && this.selected.row === row;

        // 棋子背景图（复用 chess-piece 纹理）
        const img = this.add.image(0, 0, 'chess-piece').setDisplaySize(sz, sz);

        let label = '?';
        let textColor = '#f0d9b5';
        let tint = null;

        if (cell.flipped) {
            const charMap = {
                j: { red: '帅', black: '将' },
                c: { red: '车', black: '車' },
                m: { red: '马', black: '馬' },
                p: { red: '炮', black: '砲' },
                x: { red: '相', black: '象' },
                s: { red: '仕', black: '士' },
                z: { red: '兵', black: '卒' },
            };
            const entry = charMap[cell.type];
            label = entry ? (cell.side === 'red' ? entry.red : entry.black) : '?';
            textColor = cell.side === 'red' ? '#ff3333' : '#111111';
            if (isSelected) tint = 0xffdd00;
        } else {
            // 未翻开：深色遮挡
            img.setTint(0x4a3020);
            label = '▣';
            textColor = '#8b7355';
        }

        if (tint) img.setTint(tint);

        const txt = this.add.text(0, -2, label, {
            fontSize      : Math.floor(sz * 0.42) + 'px',
            color         : textColor,
            fontFamily    : com.pixelFont,
            fontStyle     : 'bold',
            stroke        : textColor,
            strokeThickness: 0.5,
            resolution    : 2
        }).setOrigin(0.5);

        const hitSz = this.isMobile ? Math.max(sz, this.CS) : Math.max(sz, this.CS * 0.92);
        const container = this.add.container(cx, cy, [img, txt]);
        container.setSize(hitSz, hitSz).setInteractive({ useHandCursor: true });
        container.on('pointerdown', () => this.onCellClick(col, row));

        this.pieceContainers.push(container);

        // 显示移动目标高亮圆点
        if (this.selected && !cell.flipped && cell.side !== this.currentTurn) {
            // 空格点已在 renderMoveHints 里处理
        }

        return container;
    }

    // ─────────────────────────────────────────────
    //  渲染空格移动提示
    // ─────────────────────────────────────────────
    renderMoveHints(col, row) {
        if (this.hintObjects) this.hintObjects.forEach(o => o.destroy());
        this.hintObjects = [];
        if (!this.selected) return;

        const { ox, oy } = this.boardOffset();
        const { CS } = this;

        this.getEmptyMoves(col, row).forEach(([tc, tr]) => {
            const hx = ox + tc * CS + CS / 2;
            const hy = oy + tr * CS + CS / 2;
            const ringR = this.isMobile ? 10 : 8;
            const ring = this.add.arc(hx, hy, ringR, 0, 360, false, 0x00e000, 0).setStrokeStyle(2, 0x00e000, 0.7).setDepth(4);
            const dot  = this.add.circle(hx, hy, this.isMobile ? 5 : 4, 0x00e000, 0.9).setDepth(4);
            const zone = this.add.zone(hx, hy, CS, CS).setInteractive({ useHandCursor: true }).setDepth(4);
            zone.on('pointerdown', () => this.onCellClick(tc, tr));
            this.hintObjects.push(ring, dot, zone);
        });
    }

    clearHints() {
        if (this.hintObjects) this.hintObjects.forEach(o => o.destroy());
        this.hintObjects = [];
    }

    // ─────────────────────────────────────────────
    //  点击处理核心
    // ─────────────────────────────────────────────
    onCellClick(col, row) {
        if (this._gameOver || this._moving) return;
        const cell = this.grid[row][col];

        // 1. 空格且没有选中棋子 → 无事
        if (!cell && !this.selected) return;

        // 2. 点击未翻开的棋子 → 翻牌（只有轮到自己或还没确定回合时才能翻）
        if (cell && !cell.flipped) {
            // 如果当前已选中，点击未翻开棋子先取消选中
            if (this.selected) {
                this.selected = null;
                this.clearHints();
                this.renderPieces();
                return;
            }
            // 翻牌
            this.flipPiece(col, row, cell);
            return;
        }

        // 3. 已选中状态下点击目标
        if (this.selected) {
            const sc = this.selected.col, sr = this.selected.row;

            // 点击的是同一个棋子 → 取消选中
            if (sc === col && sr === row) {
                this.selected = null;
                this.clearHints();
                this.renderPieces();
                return;
            }

            // 点击空格 → 尝试移动
            if (!cell) {
                if (this.canMove(sc, sr, col, row)) {
                    this.doMove(sc, sr, col, row);
                }
                return;
            }

            // 点击己方棋子 → 切换选中
            if (cell.flipped && cell.side === this.currentTurn) {
                this.selected = { col, row };
                this.renderPieces();
                this.renderMoveHints(col, row);
                return;
            }

            // 点击对方棋子 → 尝试吃子
            if (cell.flipped && cell.side !== this.currentTurn) {
                if (this.canCapture(sc, sr, col, row)) {
                    this.doCapture(sc, sr, col, row);
                }
                return;
            }

            // 点击对方未翻开棋子（暗棋规则：不能吃未翻开棋）
            return;
        }

        // 4. 没有选中，点击己方已翻开棋子 → 选中
        if (cell && cell.flipped && cell.side === this.currentTurn) {
            this.selected = { col, row };
            this.renderPieces();
            this.renderMoveHints(col, row);
        }
    }

    // ─────────────────────────────────────────────
    //  翻牌
    // ─────────────────────────────────────────────
    flipPiece(col, row, cell) {
        // 确定先手方
        if (!this.currentTurn) {
            this.firstSide   = cell.side;
            this.currentTurn = cell.side;
        }
        // 暗棋允许翻任意未翻开格（不限阵营）
        cell.flipped = true;
        this._moving = true;

        this.renderPieces();
        // 翻牌动画：缩放弹出
        const { ox, oy } = this.boardOffset();
        const cx = ox + col * this.CS + this.CS / 2;
        const cy = oy + row * this.CS + this.CS / 2;

        // 找到这个格子的容器做动画
        const idx = row * this.COLS + col;
        const container = this.pieceContainers.find(c => Math.abs(c.x - cx) < 2 && Math.abs(c.y - cy) < 2);
        if (container) {
            container.setScale(0.6);
            this.tweens.add({
                targets : container,
                scaleX  : 1,
                scaleY  : 1,
                duration: 220,
                ease    : 'Back.easeOut',
                onComplete: () => {
                    this._moving = false;
                    this.nextTurn();
                }
            });
        } else {
            this._moving = false;
            this.nextTurn();
        }
    }

    // ─────────────────────────────────────────────
    //  移动
    // ─────────────────────────────────────────────
    canMove(fc, fr, tc, tr) {
        if (this.grid[tr][tc]) return false; // 目标不是空格
        return Math.abs(fc - tc) + Math.abs(fr - tr) === 1; // 相邻一格
    }

    getEmptyMoves(col, row) {
        const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
        return dirs
            .map(([dc,dr]) => [col+dc, row+dr])
            .filter(([c,r]) => c>=0 && c<this.COLS && r>=0 && r<this.ROWS && !this.grid[r][c]);
    }

    doMove(fc, fr, tc, tr) {
        this.grid[tr][tc] = this.grid[fr][fc];
        this.grid[fr][fc] = null;
        this.selected = null;
        this.clearHints();
        this._moving = true;
        this.animateMove(fc, fr, tc, tr, () => {
            this._moving = false;
            this.nextTurn();
        });
    }

    // ─────────────────────────────────────────────
    //  吃子规则
    // ─────────────────────────────────────────────
    canCapture(fc, fr, tc, tr) {
        const attacker = this.grid[fr][fc];
        const target   = this.grid[tr][tc];
        if (!attacker || !target) return false;
        if (!target.flipped) return false; // 不能吃未翻开棋

        const aRank = DarkChessScene.RANK[attacker.type];
        const tRank = DarkChessScene.RANK[target.type];

        // 炮：需要隔一子
        if (attacker.type === 'p') {
            return this.cannonCapture(fc, fr, tc, tr);
        }

        // 帅/将不能吃兵/卒（特殊规则）
        if (attacker.type === 'j' && target.type === 'z') return false;
        // 兵/卒可以吃帅/将
        // 普通：等级 >= 目标才能吃
        if (aRank >= tRank) {
            return Math.abs(fc - tc) + Math.abs(fr - tr) === 1;
        }
        return false;
    }

    cannonCapture(fc, fr, tc, tr) {
        // 炮：同行或同列，中间恰好有一个棋子（不限翻开与否）
        if (fc !== tc && fr !== tr) return false;
        let between = 0;
        if (fc === tc) {
            const minR = Math.min(fr, tr), maxR = Math.max(fr, tr);
            for (let r = minR + 1; r < maxR; r++) if (this.grid[r][fc]) between++;
        } else {
            const minC = Math.min(fc, tc), maxC = Math.max(fc, tc);
            for (let c = minC + 1; c < maxC; c++) if (this.grid[fr][c]) between++;
        }
        return between === 1;
    }

    doCapture(fc, fr, tc, tr) {
        this.grid[tr][tc] = this.grid[fr][fc];
        this.grid[fr][fc] = null;
        this.selected = null;
        this.clearHints();
        this._moving = true;
        this.animateMove(fc, fr, tc, tr, () => {
            this._moving = false;
            this.checkWin();
        });
    }

    // ─────────────────────────────────────────────
    //  移动动画
    // ─────────────────────────────────────────────
    animateMove(fc, fr, tc, tr, onDone) {
        const { ox, oy } = this.boardOffset();
        const CS = this.CS;
        const fromX = ox + fc * CS + CS / 2;
        const fromY = oy + fr * CS + CS / 2;
        const toX   = ox + tc * CS + CS / 2;
        const toY   = oy + tr * CS + CS / 2;

        // 找到要移动的容器
        const container = this.pieceContainers.find(c => Math.abs(c.x - fromX) < 2 && Math.abs(c.y - fromY) < 2);
        this.renderPieces(); // 先刷新棋盘（目标格棋子已更新）
        if (!container) { onDone(); return; }

        // 已销毁，重新在原位置建一个临时动画精灵
        const cell = this.grid[tr][tc];
        const sz = Math.floor(CS * 0.82);
        const tmpImg = this.add.image(fromX, fromY, 'chess-piece').setDisplaySize(sz, sz).setDepth(10);
        const charMap = { j:{red:'帅',black:'将'},c:{red:'车',black:'車'},m:{red:'马',black:'馬'},p:{red:'炮',black:'砲'},x:{red:'相',black:'象'},s:{red:'仕',black:'士'},z:{red:'兵',black:'卒'} };
        const entry = charMap[cell.type];
        const lbl = entry ? (cell.side==='red' ? entry.red : entry.black) : '?';
        const tmpTxt = this.add.text(fromX, fromY - 2, lbl, {
            fontSize: Math.floor(sz*0.42)+'px', color: cell.side==='red'?'#ff3333':'#111111',
            fontFamily: com.pixelFont, fontStyle:'bold', resolution:2
        }).setOrigin(0.5).setDepth(11);

        this.tweens.add({
            targets : [tmpImg, tmpTxt],
            x       : toX,
            y       : (targets, target) => target === tmpTxt ? toY - 2 : toY,
            duration: 200,
            ease    : 'Power2.easeInOut',
            onComplete: () => {
                tmpImg.destroy();
                tmpTxt.destroy();
                onDone();
            }
        });
    }

    // ─────────────────────────────────────────────
    //  换回合
    // ─────────────────────────────────────────────
    nextTurn() {
        if (!this.currentTurn) return;
        this.currentTurn = this.currentTurn === 'red' ? 'black' : 'red';
        this.updateTurnText();
        this.renderPieces();
        // 检测对方是否有合法走法
        if (!this.hasAnyMove(this.currentTurn)) {
            const winner = this.currentTurn === 'red' ? '黑方' : '红方';
            this.time.delayedCall(300, () => this.showGameOver(`${this.currentTurn === 'red' ? '红方' : '黑方'}无路可走，${winner}获胜！`));
        }
    }

    updateTurnText() {
        if (!this.turnText) return;
        if (!this.currentTurn) {
            this.turnText.setText('点击棋子开始翻牌');
            return;
        }
        const side = this.currentTurn === 'red' ? '红方' : '黑方';
        this.turnText.setText(`轮到 ${side} 行棋`);
        this.turnText.setColor(this.currentTurn === 'red' ? '#ff6666' : '#aaaaaa');
    }

    // ─────────────────────────────────────────────
    //  胜负检测
    // ─────────────────────────────────────────────
    checkWin() {
        // 检测某方将帅是否还在
        let hasRed = false, hasBlack = false;
        for (let r = 0; r < this.ROWS; r++)
            for (let c = 0; c < this.COLS; c++) {
                const cell = this.grid[r][c];
                if (cell && cell.type === 'j') {
                    if (cell.side === 'red') hasRed = true;
                    else hasBlack = true;
                }
            }
        if (!hasRed)   { this.showGameOver('红方将帅被吃，黑方获胜！'); return; }
        if (!hasBlack) { this.showGameOver('黑方将帅被吃，红方获胜！'); return; }
        this.nextTurn();
    }

    hasAnyMove(side) {
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                const cell = this.grid[r][c];
                if (!cell || !cell.flipped || cell.side !== side) continue;
                // 可移动到空格
                if (this.getEmptyMoves(c, r).length > 0) return true;
                // 可吃子
                const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
                for (const [dc,dr] of dirs) {
                    const tc = c+dc, tr = r+dr;
                    if (tc<0||tc>=this.COLS||tr<0||tr>=this.ROWS) continue;
                    if (this.canCapture(c, r, tc, tr)) return true;
                }
                // 炮远程吃子
                if (cell.type === 'p') {
                    for (let cc = 0; cc < this.COLS; cc++) {
                        if (cc===c) continue;
                        const t = this.grid[r][cc];
                        if (t && t.flipped && t.side!==side && this.cannonCapture(c,r,cc,r)) return true;
                    }
                    for (let rr = 0; rr < this.ROWS; rr++) {
                        if (rr===r) continue;
                        const t = this.grid[rr][c];
                        if (t && t.flipped && t.side!==side && this.cannonCapture(c,r,c,rr)) return true;
                    }
                }
                // 还有未翻开的格子可以翻（翻牌也算一步）
                for (let rr=0; rr<this.ROWS; rr++)
                    for (let cc=0; cc<this.COLS; cc++)
                        if (this.grid[rr][cc] && !this.grid[rr][cc].flipped) return true;
            }
        }
        // 还有未翻开的格子可以翻
        for (let r=0; r<this.ROWS; r++)
            for (let c=0; c<this.COLS; c++)
                if (this.grid[r][c] && !this.grid[r][c].flipped) return true;
        return false;
    }

    // ─────────────────────────────────────────────
    //  游戏结束面板
    // ─────────────────────────────────────────────
    showGameOver(msg) {
        this._gameOver = true;
        this.selected = null;
        this.clearHints();

        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const panelW = Math.min(W - 40, 300);
        const panelH = this.isMobile ? 160 : 180;

        this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6).setDepth(20);
        this.add.rectangle(W/2, H/2, panelW, panelH, 0x3d2a1a).setDepth(21);
        const border = this.add.graphics().setDepth(21);
        border.lineStyle(2, 0xd4a355, 1);
        border.strokeRect(W/2 - panelW/2, H/2 - panelH/2, panelW, panelH);

        this.add.text(W/2, H/2 - panelH/2 + (this.isMobile ? 36 : 44), msg, {
            fontSize  : this.isMobile ? '15px' : '17px',
            color     : '#f0d9b5',
            fontFamily: com.pixelFont,
            wordWrap  : { width: panelW - 32 },
            align     : 'center',
            resolution: 2
        }).setOrigin(0.5).setDepth(22);

        const makeBtn = (x, y, label, cb) => {
            const bw = this.isMobile ? 104 : 114, bh = this.isMobile ? 34 : 38;
            const bg = this.add.rectangle(x, y, bw, bh, 0x4a3728).setDepth(22).setInteractive({ useHandCursor: true });
            const g  = this.add.graphics().setDepth(22);
            const draw = (a) => { g.clear(); g.lineStyle(2, 0xd4a355, a); g.strokeRect(x-bw/2, y-bh/2, bw, bh); };
            draw(0.6);
            this.add.text(x, y, label, { fontSize: this.isMobile?'14px':'15px', color:'#f0d9b5', fontFamily: com.pixelFont, resolution:2 }).setOrigin(0.5).setDepth(23);
            bg.on('pointerover', () => { bg.setFillStyle(0x5c4a38); draw(1); });
            bg.on('pointerout',  () => { bg.setFillStyle(0x4a3728); draw(0.6); });
            bg.on('pointerdown', cb);
        };

        const gap = this.isMobile ? 62 : 68;
        const btnY = H/2 + panelH/2 - (this.isMobile ? 30 : 34);
        makeBtn(W/2 - gap, btnY, '再来一局', () => this.scene.restart());
        makeBtn(W/2 + gap, btnY, '主  菜  单', () => this.scene.start('MenuScene'));
    }

    // ─────────────────────────────────────────────
    //  返回按钮
    // ─────────────────────────────────────────────
    createBackButton() {
        const isMobile = this.isMobile;
        const { ox, oy } = this.boardOffset();
        const x = ox - this.PAD + (isMobile ? 38 : 36);
        const y = oy - this.PAD - (isMobile ? 18 : 16);
        const w = isMobile ? 76 : 72, h = isMobile ? 32 : 28;

        const bg = this.add.rectangle(x, y, w, h, 0x4a3728).setDepth(5).setInteractive({ useHandCursor: true });
        const g  = this.add.graphics().setDepth(5);
        g.lineStyle(1, 0xd4a355, 0.5);
        g.strokeRect(x-w/2, y-h/2, w, h);
        this.add.text(x, y, '返回', { fontSize: isMobile?'13px':'12px', color:'#f0d9b5', fontFamily: com.pixelFont, resolution:2 }).setOrigin(0.5).setDepth(6);
        bg.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    // ─────────────────────────────────────────────
    //  preload（复用 chess-piece 图片）
    // ─────────────────────────────────────────────
    preload() {
        this.load.image('chess-piece', 'image/chess.png');
    }
}
