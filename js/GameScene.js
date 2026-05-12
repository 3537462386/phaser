class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");

        //  棋盘布局常量 ─
        // 格子大小（正方形，单位 px）
        this.CS = 46;
        // 外边距 = 格子的一半
        this.PAD = Math.floor(this.CS / 2); // 23
        // 棋盘交叉点列数 9、行数 10
        this.COLS = 9;
        this.ROWS = 10;

        // 以下在 create() 中计算
        this.SCENE_W = 500;
        this.SCENE_H = 700;
        this.OFFSET_X = 0;
        this.OFFSET_Y = 0;
        this.PIECE_SIZE = this.CS - 4;

        this.piecesMap = {};
    }

    preload() {
        this.load.image("chess-piece", "image/chess.png");
    }

    getInitialMap() {
        return [
            ["C","M","X","S","J","S","X","M","C"],
            [null,null,null,null,null,null,null,null,null],
            [null,"P",null,null,null,null,null,"P",null],
            ["Z",null,"Z",null,"Z",null,"Z",null,"Z"],
            [null,null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null,null],
            ["z",null,"z",null,"z",null,"z",null,"z"],
            [null,"p",null,null,null,null,null,"p",null],
            [null,null,null,null,null,null,null,null,null],
            ["c","m","x","s","j","s","x","m","c"]
        ];
    }

    create() {
        // 左右边距
        const MARGIN_X = 30;
        const isMobile = com.isMobileViewport();
        this.isMobile = isMobile;
        const marginX = isMobile ? 20 : MARGIN_X;

        // 计算所需最小宽度，宽度不够时增加
        const CS = this.CS;
        const PAD = this.PAD;
        const COLS = this.COLS;
        const ROWS = this.ROWS;

        const boardW = (COLS - 1) * CS;
        const boardH = (ROWS - 1) * CS;
        const totalW = boardW + PAD * 2;

        // 实际可用宽度
        let sceneW = this.cameras.main.width;
        let sceneH = this.cameras.main.height;

        // 宽度不够时增加
        const minWidth = totalW + marginX * 2;
        if (sceneW < minWidth) {
            sceneW = minWidth;
        }

        this.SCENE_W = sceneW;
        this.SCENE_H = sceneH;

        const boardX = Math.floor((sceneW - (boardW + PAD * 2)) / 2);
        const boardY = Math.floor((sceneH - (boardH + PAD * 2)) / 2);

        // 绘制棋盘格背景（填满整个画布）
        this.drawPixelBackground(sceneW, sceneH);

        this.OFFSET_X = boardX + PAD;
        this.OFFSET_Y = boardY + PAD;

        this.drawBoard(boardX, boardY, boardW, boardH);

        this.selectedPiece = null;
        this.dots = [];
        this.moveMarkers = []; // 记录移动轨迹的点
        this._moving = false;  // 动画进行中标志
        this._gameOver = false; // 游戏已结束标志

        this.initChessData();
        this.createStatusHud();
        this.initChessPieces();
        this.createUndoButton();
        this.createMuteButton();
        this.createBoardInputLayer();
    }

    drawPixelBackground(drawWidth, drawHeight) {
        const width = drawWidth || this.SCENE_W;
        const height = drawHeight || this.SCENE_H;
        const isMobile = com.isMobileViewport();
        const tileSize = isMobile ? 16 : 20;

        const graphics = this.add.graphics();

        // 深色木纹底
        graphics.fillStyle(0x2c1e14, 1);
        graphics.fillRect(0, 0, width, height);

        // 棋盘格纹理
        for (let y = 0; y < height; y += tileSize) {
            for (let x = 0; x < width; x += tileSize) {
                const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
                graphics.fillStyle(isEven ? 0x3d2a1a : 0x352417, 1);
                graphics.fillRect(x, y, tileSize, tileSize);
            }
        }

        // 顶部渐变
        const topFade = this.add.graphics();
        for (let i = 0; i < 60; i++) {
            topFade.fillStyle(0x1a1208, 1 - i / 60);
            topFade.fillRect(0, i, width, 1);
        }

        // 底部渐变
        const bottomFade = this.add.graphics();
        for (let i = 0; i < 60; i++) {
            bottomFade.fillStyle(0x1a1208, i / 60);
            bottomFade.fillRect(0, height - 60 + i, width, 1);
        }
    }

    drawBoard(boardX, boardY, boardW, boardH) {
        const { CS, PAD, COLS, ROWS, OFFSET_X, OFFSET_Y } = this;
        const LINE_W = 4;
        const g = this.add.graphics();

        // 1. 棋盘底色（棕色，含 padding）
        g.fillStyle(0xC89448, 1);
        g.fillRect(boardX, boardY, boardW + PAD * 2, boardH + PAD * 2);

        // 2. 外边框
        g.lineStyle(LINE_W, 0x5c3010, 1);
        g.strokeRect(OFFSET_X, OFFSET_Y, boardW, boardH);

        // 3. 横线 10 根
        for (let r = 0; r < ROWS; r++) {
            const y = OFFSET_Y + r * CS;
            g.beginPath();
            g.moveTo(OFFSET_X, y);
            g.lineTo(OFFSET_X + boardW, y);
            g.strokePath();
        }

        // 4. 竖线 9 根，中间 7 根楚河汉界处断开
        for (let c = 0; c < COLS; c++) {
            const x = OFFSET_X + c * CS;
            if (c === 0 || c === COLS - 1) {
                g.beginPath();
                g.moveTo(x, OFFSET_Y);
                g.lineTo(x, OFFSET_Y + boardH);
                g.strokePath();
            } else {
                g.beginPath();
                g.moveTo(x, OFFSET_Y);
                g.lineTo(x, OFFSET_Y + 4 * CS);
                g.strokePath();
                g.beginPath();
                g.moveTo(x, OFFSET_Y + 5 * CS);
                g.lineTo(x, OFFSET_Y + boardH);
                g.strokePath();
            }
        }

        // 5. 楚河汉界文字（行 4~5 之间，高度 = CS）
        const riverStyle = {
            fontSize   : Math.floor(this.PIECE_SIZE * 0.48) + "px",
            color      : "#5c3010",
            fontFamily : com.pixelFont,
            fontStyle  : "bold",
            stroke     : "#5c3010",
            strokeThickness : 1,
            resolution : 2
        };
        const riverY = OFFSET_Y + 4 * CS;
        const halfW  = Math.floor(boardW / 2);

        this.add.text(
            OFFSET_X + halfW * 0.5,
            riverY + CS / 2,
            "楚  河",
            riverStyle
        ).setOrigin(0.5, 0.5);

        this.add.text(
            OFFSET_X + halfW + halfW * 0.5,
            riverY + CS / 2,
            "汉  界",
            riverStyle
        ).setOrigin(0.5, 0.5);

        // 6. 九宫斜线
        g.lineStyle(LINE_W, 0x5c3010, 1);
        this._drawDiag(g, 3, 5, 0, 2);
        this._drawDiag(g, 5, 3, 0, 2);
        this._drawDiag(g, 3, 5, 7, 9);
        this._drawDiag(g, 5, 3, 7, 9);

        // 7. 炮位 & 兵卒位标记
        [[1,2],[7,2],[1,7],[7,7]].forEach(([c,r]) => this._drawMark(g, c, r));
        [[0,3],[2,3],[4,3],[6,3],[8,3],
         [0,6],[2,6],[4,6],[6,6],[8,6]].forEach(([c,r]) => this._drawMark(g, c, r));
    }

    _drawDiag(g, c1, c2, r1, r2) {
        g.beginPath();
        g.moveTo(this.OFFSET_X + c1 * this.CS, this.OFFSET_Y + r1 * this.CS);
        g.lineTo(this.OFFSET_X + c2 * this.CS, this.OFFSET_Y + r2 * this.CS);
        g.strokePath();
    }

    _drawMark(g, col, row) {
        const { CS, OFFSET_X, OFFSET_Y, COLS, ROWS } = this;
        const mx = OFFSET_X + col * CS;
        const my = OFFSET_Y + row * CS;
        const len = 7, gap = 4;
        g.lineStyle(2, 0x5c3010, 1);
        const segs = [];
        if (col > 0)        segs.push([mx - gap - len, my,        mx - gap,        my       ]);
        if (col < COLS - 1) segs.push([mx + gap,        my,        mx + gap + len,  my       ]);
        if (row > 0)        segs.push([mx,        my - gap - len, mx,        my - gap       ]);
        if (row < ROWS - 1) segs.push([mx,        my + gap,        mx,        my + gap + len]);
        segs.forEach(([x1,y1,x2,y2]) => {
            g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.strokePath();
        });
    }

    createStatusHud() {
        const W = this.cameras.main.width;
        const isMobile = this.isMobile;
        const y = isMobile ? 48 : 42;
        const w = isMobile ? Math.min(W - 48, 360) : 300;
        const h = isMobile ? 54 : 46;

        this.add.rectangle(W / 2 + 3, y + 3, w, h, 0x0f0905, 0.72).setDepth(6);
        this.add.rectangle(W / 2, y, w, h, 0x2b1d13, 0.92).setDepth(7);
        const border = this.add.graphics().setDepth(8);
        border.lineStyle(2, 0xd4a355, 0.58);
        border.strokeRect(W / 2 - w / 2, y - h / 2, w, h);

        this.statusText = this.add.text(W / 2, y - (isMobile ? 8 : 7), '', {
            fontSize: isMobile ? '17px' : '16px',
            color: '#f0d9b5',
            fontFamily: com.pixelFont,
            resolution: 2
        }).setOrigin(0.5).setDepth(9);

        this.statusSubText = this.add.text(W / 2, y + (isMobile ? 13 : 11), '', {
            fontSize: isMobile ? '12px' : '11px',
            color: '#d4a355',
            fontFamily: com.pixelFont,
            resolution: 2
        }).setOrigin(0.5).setDepth(9);

        this.updateStatusText();
    }

    updateStatusText(extraText) {
        if (!this.statusText) return;
        const side = com.sideName(play.my);
        const mode = play.mode === 'player_vs_ai' ? '玩家 对 电脑' : '本地双人';
        this.statusText.setText(extraText || `${side}行棋`);
        this.statusSubText.setText(mode);
        this.statusText.setColor(play.my === 1 ? '#ffdad0' : '#e5e0d1');
    }

    createUndoButton() {
        const isMobile = this.isMobile;
        const x = this.cameras.main.width / 2;
        const y = this.cameras.main.height - (isMobile ? 42 : 36);
        const btnW = isMobile ? 132 : 120;
        const btnH = isMobile ? 50 : 40;

        // 像素风格按钮
        const btnBg = this.add.rectangle(x, y, btnW, btnH, 0x4a3728)
            .setInteractive({ useHandCursor: true });

        // 按钮边框
        const border = this.add.graphics();
        border.lineStyle(2, 0xd4a355, 0.6);
        border.strokeRect(x - btnW/2, y - btnH/2, btnW, btnH);

        // 按钮高光
        const highlight = this.add.graphics();
        highlight.fillStyle(0xf0d9b5, 0.08);
        highlight.fillRect(x - btnW/2 + 4, y - btnH/2 + 3, btnW - 8, 3);

        this.add.text(x, y, "悔  棋", {
            fontSize   : isMobile ? "16px" : "18px",
            color      : "#f0d9b5",
            fontFamily : com.pixelFont,
            resolution : 2
        }).setOrigin(0.5).setDepth(1);

        btnBg.on("pointerover", () => {
            btnBg.setFillStyle(0x5c4a38);
            border.clear();
            border.lineStyle(2, 0xd4a355, 0.9);
            border.strokeRect(x - btnW/2, y - btnH/2, btnW, btnH);
        });
        btnBg.on("pointerout",  () => {
            btnBg.setFillStyle(0x4a3728);
            border.clear();
            border.lineStyle(2, 0xd4a355, 0.6);
            border.strokeRect(x - btnW/2, y - btnH/2, btnW, btnH);
        });
        btnBg.on("pointerdown", () => {
            btnBg.setFillStyle(0x6b5a48);
            this.undo();
        });
    }

    createMuteButton() {
        const isMobile = this.isMobile;
        const W = this.cameras.main.width;
        const hudW = isMobile ? Math.min(W - 48, 360) : 300;
        const hudY = isMobile ? 48 : 42;
        const x = W / 2 + hudW / 2 - (isMobile ? 24 : 20);
        const y = hudY;
        const hitSize = isMobile ? 44 : 34;

        // 音量图标
        const icon = this.add.text(x, y,
            audioConfig.muted ? '🔇' : '🔊',
            { fontSize: isMobile ? '18px' : '16px', resolution: 2, color: '#f0d9b5' }
        ).setOrigin(0.5).setDepth(10);

        // 交互区域
        const hitArea = this.add.rectangle(x, y, hitSize, hitSize, 0xffffff, 0)
            .setInteractive({ useHandCursor: true }).setDepth(11);

        hitArea.on('pointerover', () => {
            icon.setAlpha(0.7);
        });
        hitArea.on('pointerout',  () => {
            icon.setAlpha(1);
        });
        hitArea.on('pointerdown', () => {
            audioConfig.muted = !audioConfig.muted;
            icon.setText(audioConfig.muted ? '🔇' : '🔊');
            const bgm = this.sound.get('bgm');
            if (bgm) bgm.setVolume(audioConfig.muted ? 0 : audioConfig.bgmVolume);
        });
    }

    undo() {
        if (play.history.length === 0) return;
        const steps = (play.mode === "player_vs_ai" && play.history.length >= 2) ? 2 : 1;
        for (let i = 0; i < steps; i++) {
            if (play.history.length === 0) break;
            this.executeUndo(play.history.pop());
        }
    }

    executeUndo(move) {
        const { key, from, to, eaten } = move;
        const man = play.mans[key];

        play.map[to.y][to.x]    = eaten ? eaten.key : null;
        play.map[from.y][from.x] = key;
        man.x = from.x;
        man.y = from.y;

        const piece = this.piecesMap[key];
        piece.setData("lx", from.x);
        piece.setData("ly", from.y);
        piece.setPosition(
            this.OFFSET_X + from.x * this.CS,
            this.OFFSET_Y + from.y * this.CS
        );

        if (eaten) this.addPieceToBoard(to.x, to.y, eaten.key);

        play.my = -play.my;
        if (this.selectedPiece) this.clearPieceTint(this.selectedPiece);
        this.selectedPiece = null;
        this.dots.forEach(d => d.destroy());
        this.dots = [];
        this.moveMarkers.forEach(m => m.destroy());
        this.moveMarkers = [];
    }

    initChessData() {
        play.map = this.getInitialMap();
        const counts = {};
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const char = play.map[y][x];
                if (char) {
                    play.map[y][x] = char + (counts[char] || 0);
                    counts[char] = (counts[char] || 0) + 1;
                }
            }
        }
        play.initMans(play.map);
        play.my = 1;
    }

    initChessPieces() {
        if (this.piecesMap) Object.values(this.piecesMap).forEach(p => p.destroy());
        this.piecesMap = {};
        const map = play.map;
        for (let y = 0; y < map.length; y++)
            for (let x = 0; x < map[y].length; x++)
                if (map[y][x]) this.addPieceToBoard(x, y, map[y][x]);
    }

    addPieceToBoard(lx, ly, key) {
        const x   = this.OFFSET_X + lx * this.CS;
        const y   = this.OFFSET_Y + ly * this.CS;
        const sz  = this.PIECE_SIZE;
        const isRed = key === key.toLowerCase();

        const img = this.add.image(0, 0, "chess-piece")
            .setDisplaySize(sz, sz);

        const charMap = {
            c: { red: "车", black: "車" },
            m: { red: "马", black: "馬" },
            x: { red: "相", black: "象" },
            s: { red: "仕", black: "士" },
            j: { red: "帅", black: "将" },
            p: { red: "炮", black: "砲" },
            z: { red: "兵", black: "卒" }
        };
        const type  = key[0].toLowerCase();
        const label = charMap[type] ? (isRed ? charMap[type].red : charMap[type].black) : type;

        const txt = this.add.text(0, -2, label, {
            fontSize        : Math.floor(sz * 0.46) + "px",
            color           : isRed ? "#ff0000" : "#000000",
            fontFamily      : com.pixelFont,
            fontStyle       : "bold",
            stroke          : isRed ? "#ff0000" : "#000000",
            strokeThickness : 1,
            resolution      : 2
        }).setOrigin(0.5, 0.5);

        const container = this.add.container(x, y, [img, txt]);
        // 手机端扩大可点击区域，至少覆盖整个格子
        const hitSz = this.isMobile ? Math.max(sz, this.CS + 6) : sz;
        container.setSize(hitSz, hitSz).setInteractive();
        container.setData("lx", lx).setData("ly", ly).setData("key", key);
        container.on("pointerdown", () => this.onPieceClicked(container));
        this.piecesMap[key] = container;
    }

    onPieceClicked(piece) {
        if (this._moving || this._gameOver) return; // 动画进行中或游戏已结束，禁止操作
        const key   = piece.getData("key");
        const isRed = key === key.toLowerCase();
        if (play.my === 1) {
            isRed ? this.selectPiece(piece)
                  : (this.selectedPiece && this.attemptMove(this.selectedPiece, piece.getData("lx"), piece.getData("ly")));
        } else {
            !isRed ? this.selectPiece(piece)
                   : (this.selectedPiece && this.attemptMove(this.selectedPiece, piece.getData("lx"), piece.getData("ly")));
        }
    }

    setPieceTint(c, tint) {
        const img = c && c.getAt(0);
        if (img) img.setTint(tint);
    }

    clearPieceTint(c) {
        if (!c) return;
        const img = c.getAt(0);
        if (img) img.clearTint();
        // 停止漂浮动画并还原缩放和位置
        this.tweens.killTweensOf(c);
        c.setScale(1);
        const lx = c.getData("lx");
        const ly = c.getData("ly");
        c.setPosition(this.OFFSET_X + lx * this.CS, this.OFFSET_Y + ly * this.CS);
    }

    // 仅清除高亮色，不干扰动画（移动过程中使用）
    clearPieceTintOnly(c) {
        if (!c) return;
        const img = c.getAt(0);
        if (img) img.clearTint();
    }

    selectPiece(piece) {
        if (this.selectedPiece) {
            this.clearPieceTint(this.selectedPiece);
            // 取消之前棋子的漂浮动画，还原缩放
            this.tweens.killTweensOf(this.selectedPiece);
            this.selectedPiece.setScale(1);
        }
        this.selectedPiece = piece;
        this.setPieceTint(piece, 0xffdd00);

        // 漂浮动画：轻微放大 + 上下浮动
        piece.setScale(1);
        this.tweens.add({
            targets : piece,
            scaleX  : 1.12,
            scaleY  : 1.12,
            duration: 180,
            ease    : "Back.easeOut",
            onComplete: () => {
                this.tweens.add({
                    targets  : piece,
                    y        : piece.y - 3,
                    duration : 500,
                    ease     : "Sine.easeInOut",
                    yoyo     : true,
                    repeat   : -1
                });
            }
        });

        this.showDots(piece);
    }

    showDots(piece) {
        this.dots.forEach(d => d.destroy());
        this.dots = [];
        const moves = play.mans[piece.getData("key")].bl(play.map);
        moves.forEach(([lx, ly]) => {
            const x = this.OFFSET_X + lx * this.CS;
            const y = this.OFFSET_Y + ly * this.CS;
            
            // 外圈边框
            const ring = this.add.arc(x, y, 5, 0, 360, false, 0x00e000, 0);
            ring.setStrokeStyle(1, 0x00e000, 0.6);
            // 内实心点
            const core = this.add.circle(x, y, 2, 0x00e000, 0.8);
            
            const group = this.add.container(0, 0, [ring, core]);
            // 点击半径覆盖整个格子的一半，手机端更大
            const dotHitR = this.isMobile ? Math.floor(this.CS * 0.6) : Math.floor(this.CS * 0.48);
            group.setInteractive(new Phaser.Geom.Circle(x, y, dotHitR), Phaser.Geom.Circle.Contains);
            group.on("pointerdown", () => this.attemptMove(this.selectedPiece, lx, ly));
            
            this.dots.push(group);
        });
    }

    attemptMove(piece, nlx, nly) {
        const key   = piece.getData("key");
        const moves = play.mans[key].bl(play.map);
        if (moves.some(([x, y]) => x === nlx && y === nly)) this.movePiece(key, nlx, nly);
    }

    movePiece(key, nlx, nly) {
        const man = play.mans[key];
        const olx = man.x, oly = man.y;
        const targetKey = play.map[nly][nlx];

        play.history.push({ key, from: { x: olx, y: oly }, to: { x: nlx, y: nly },
                            eaten: targetKey ? { key: targetKey } : null });

        let eatenGeneral = false;
        if (targetKey) {
            this.piecesMap[targetKey].destroy();
            delete this.piecesMap[targetKey];
            delete play.mans[targetKey];
            if (targetKey[0].toLowerCase() === 'j') {
                eatenGeneral = true;
            }
        }

        play.map[oly][olx] = null;
        play.map[nly][nlx] = key;
        man.x = nlx; man.y = nly;

        // 清除旧的移动标记并添加新标记（移动前的位置）
        this.moveMarkers.forEach(m => m.destroy());
        this.moveMarkers = [];
        
        const mx = this.OFFSET_X + olx * this.CS;
        const my = this.OFFSET_Y + oly * this.CS;
        
        // 标记：白色边框圆环 + 中心小点
        const markerRing = this.add.arc(mx, my, 5, 0, 360, false, 0xffffff, 0);
        markerRing.setStrokeStyle(1, 0xffffff, 0.6);
        const markerCore = this.add.circle(mx, my, 2, 0xffffff, 0.8);
        
        this.moveMarkers.push(markerRing, markerCore);

        const piece = this.piecesMap[key];
        
        // 为移动后的棋子添加白色圆环边框标记
        const px = this.OFFSET_X + nlx * this.CS;
        const py = this.OFFSET_Y + nly * this.CS;
        const pieceMarker = this.add.circle(px, py, (this.PIECE_SIZE / 2) + 0.1);
        pieceMarker.setStrokeStyle(1, 0xffffff, 0.5);
        this.moveMarkers.push(pieceMarker);

        piece.setData("lx", nlx).setData("ly", nly);

        // 先清除高亮色（不干扰动画），并锁定操作防止动画期间误操作
        this.clearPieceTintOnly(piece);
        this.tweens.killTweensOf(piece);
        this._moving = true;
        this.updateStatusText('落子中...');

        const targetX = this.OFFSET_X + nlx * this.CS;
        const targetY = this.OFFSET_Y + nly * this.CS;

        // 第一段：先小幅上抬（模拟起飞）
        this.tweens.add({
            targets : piece,
            scaleX  : 1.15,
            scaleY  : 1.15,
            y       : piece.y - 6,
            duration: 80,
            ease    : "Sine.easeOut",
            onComplete: () => {
                // 第二段：平滑滑向目标位置
                this.tweens.add({
                    targets : piece,
                    x       : targetX,
                    y       : targetY - 6,
                    duration: 180,
                    ease    : "Power2.easeInOut",
                    onComplete: () => {
                        // 第三段：落下，回弹感
                        this.tweens.add({
                            targets : piece,
                            y       : targetY,
                            scaleX  : 1,
                            scaleY  : 1,
                            duration: 120,
                            ease    : "Back.easeOut",
                            onComplete: () => {
                                this._moving = false;
                                if (eatenGeneral) {
                                    const winner = play.my === 1 ? "红方" : "黑方";
                                    this.showGameOver(`${winner}吃掉对方将帅，${winner}获胜！`);
                                } else {
                                    this.endTurn();
                                }
                            }
                        });
                    }
                });
            }
        });

        this.selectedPiece = null;
        this.dots.forEach(d => d.destroy());
        this.dots = [];
    }

    /**
     * 棋盘背景输入层：点击空白格时自动吸附到最近格点执行移动
     * 作为落点小绿点的兜底——即使没有精确点中绿点也能移动
     */
    createBoardInputLayer() {
        const { COLS, ROWS, CS, OFFSET_X, OFFSET_Y } = this;
        const boardW = (COLS - 1) * CS;
        const boardH = (ROWS - 1) * CS;
        // 半格 padding 一起纳入可点击区域
        const PAD = this.PAD;
        const zone = this.add.zone(
            OFFSET_X - PAD, OFFSET_Y - PAD,
            boardW + PAD * 2, boardH + PAD * 2
        ).setOrigin(0, 0).setInteractive().setDepth(-1);

        zone.on("pointerdown", (pointer) => {
            if (!this.selectedPiece || this._moving || this._gameOver) return;
            // 将指针坐标吸附到最近格点
            const lx = Math.round((pointer.x - OFFSET_X) / CS);
            const ly = Math.round((pointer.y - OFFSET_Y) / CS);
            if (lx < 0 || lx >= COLS || ly < 0 || ly >= ROWS) return;
            // 目标格有己方棋子时，改为选中该棋子
            const targetKey = play.map[ly][lx];
            if (targetKey) {
                // 有棋子时交给棋子的 pointerdown 处理，这里不重复处理
                return;
            }
            this.attemptMove(this.selectedPiece, lx, ly);
        });
    }

    endTurn() {
        play.my = -play.my;
        this.updateStatusText(play.mode === "player_vs_ai" && play.my === -1 ? '电脑思考中' : null);
        if (!play.hasLegalMoves(play.my)) {
            const loser  = play.my ===  1 ? "红方" : "黑方";
            const winner = play.my === -1 ? "红方" : "黑方";
            this.showGameOver(`${loser}无路可走（死棋），${winner}获胜！`);
            return;
        }
        if (play.mode === "player_vs_ai" && play.my === -1)
            this.time.delayedCall(500, () => this.aiTurn());
    }

    showGameOver(msg) {
        this._gameOver = true;
        // 清除已选棋子状态
        if (this.selectedPiece) this.clearPieceTint(this.selectedPiece);
        this.selectedPiece = null;
        this.dots.forEach(d => d.destroy());
        this.dots = [];

        const W = this.cameras.main.width;
        const H = this.cameras.main.height;
        const isMobile = this.isMobile;

        // 半透明遮罩
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(20);

        // 面板
        const panelW = Math.min(W - 40, 300);
        const panelH = isMobile ? 160 : 180;
        this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x3d2a1a).setDepth(21);
        const border = this.add.graphics().setDepth(21);
        border.lineStyle(2, 0xd4a355, 1);
        border.strokeRect(W / 2 - panelW / 2, H / 2 - panelH / 2, panelW, panelH);

        // 结果文字
        this.add.text(W / 2, H / 2 - panelH / 2 + (isMobile ? 36 : 44), msg, {
            fontSize   : isMobile ? "16px" : "18px",
            color      : "#f0d9b5",
            fontFamily : com.pixelFont,
            wordWrap   : { width: panelW - 32 },
            align      : "center",
            resolution : 2
        }).setOrigin(0.5).setDepth(22);

        // 按钮辅助
        const makeBtn = (x, y, label, cb) => {
            const bw = isMobile ? 104 : 114, bh = isMobile ? 34 : 38;
            const bg = this.add.rectangle(x, y, bw, bh, 0x4a3728).setDepth(22).setInteractive({ useHandCursor: true });
            const g = this.add.graphics().setDepth(22);
            const drawBorder = (alpha) => {
                g.clear();
                g.lineStyle(2, 0xd4a355, alpha);
                g.strokeRect(x - bw / 2, y - bh / 2, bw, bh);
            };
            drawBorder(0.6);
            this.add.text(x, y, label, {
                fontSize: isMobile ? "14px" : "15px", color: "#f0d9b5",
                fontFamily: com.pixelFont, resolution: 2
            }).setOrigin(0.5).setDepth(23);
            bg.on("pointerover",  () => { bg.setFillStyle(0x5c4a38); drawBorder(1); });
            bg.on("pointerout",   () => { bg.setFillStyle(0x4a3728); drawBorder(0.6); });
            bg.on("pointerdown",  cb);
        };

        const gap = isMobile ? 62 : 68;
        const btnY = H / 2 + panelH / 2 - (isMobile ? 30 : 34);
        makeBtn(W / 2 - gap, btnY, "再来一局", () => location.reload());
        makeBtn(W / 2 + gap, btnY, "主  菜  单", () => this.scene.start("MenuScene"));
    }

    aiTurn() {
        if (play.mode !== "player_vs_ai") return;
        const move = AI.init("");
        if (move) {
            const [ox, oy, nx, ny] = move;
            this.movePiece(play.map[oy][ox], nx, ny);
        } else {
            this.showGameOver("黑方无路可走（死棋），红方获胜！");
        }
    }
}
