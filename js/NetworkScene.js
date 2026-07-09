// NetworkScene.js — 联网双人对战场景

var PIECE_TEXT = {
  'K': '帅', 'k': '将', 'A': '仕', 'a': '士',
  'B': '相', 'b': '象', 'N': '馬', 'n': '马',
  'R': '車', 'r': '车', 'C': '炮', 'c': '炮',
  'P': '兵', 'p': '卒'
};

class NetworkScene extends Phaser.Scene {
  constructor() {
    super('NetworkScene');
  }

  preload() {
    if (!this.textures.exists('chess')) {
      this.load.image('chess', 'image/chess.png');
    }
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1208');
    this.room = window.NetworkManager.getRoom();
    if (!this.room) {
      this.scene.start('MenuScene');
      return;
    }

    var player = this.room.state.players.get(this.room.sessionId);
    this.mySeat = player ? player.seat : 0;

    this.selectedFrom = -1;
    this.pieces = {};        // { boardIndex: Phaser.GameObjects.Container }
    this.containerGroup = this.add.group();
    this.prevBoard = '';
    this.cellW = 46;
    this.boardX = 30;
    this.boardY = 110;
    this.boardW = 8 * this.cellW;
    this.boardH = 9 * this.cellW;
    this.pieceR = 18;

    this.drawBoard();
    this.createUI();
    this.syncPieces(this.room.state.board);
    this.bindState();
    this.setupInteraction();
  }

  // ========== 棋盘绘制 ==========

  drawBoard() {
    var g = this.add.graphics();
    var bx = this.boardX, by = this.boardY, cw = this.cellW;
    var bw = this.boardW, bh = this.boardH;

    // 外框
    g.lineStyle(2, 0xd4a355, 0.8);
    g.strokeRect(bx - 10, by - 10, bw + 20, bh + 20);

    // 横线 × 10
    g.lineStyle(1, 0x8b7355, 0.7);
    for (var r = 0; r < 10; r++) {
      g.lineBetween(bx, by + r * cw, bx + bw, by + r * cw);
    }

    // 竖线 × 9（中间断开画楚河汉界）
    for (var c = 0; c < 9; c++) {
      // 上半
      g.lineBetween(bx + c * cw, by, bx + c * cw, by + 4 * cw);
      // 下半
      g.lineBetween(bx + c * cw, by + 5 * cw, bx + c * cw, by + bh);
    }
    // 左右边线连起来
    g.lineBetween(bx, by, bx, by + 4 * cw);
    g.lineBetween(bx, by + 5 * cw, bx, by + bh);
    g.lineBetween(bx + bw, by, bx + bw, by + 4 * cw);
    g.lineBetween(bx + bw, by + 5 * cw, bx + bw, by + bh);

    // 楚河汉界标记
    var riverY = by + 4.5 * cw;
    g.fillStyle(0xd4a355, 0.4);
    g.fillRect(bx + 12, riverY - 12, bw - 24, 24);
    this.add.text(bx + bw / 2, riverY, '楚　河　　　汉　界', {
      fontSize: '14px', color: '#1a1208', fontFamily: 'Zpix, monospace'
    }).setOrigin(0.5).setDepth(1);

    // 九宫斜线
    g.lineStyle(1, 0x8b7355, 0.35);
    var drawX = [
      [bx + 3 * cw, by, bx + 5 * cw, by + 2 * cw],
      [bx + 5 * cw, by, bx + 3 * cw, by + 2 * cw],
      [bx + 3 * cw, by + 7 * cw, bx + 5 * cw, by + bh],
      [bx + 5 * cw, by + 7 * cw, bx + 3 * cw, by + bh],
    ];
    for (var i = 0; i < drawX.length; i++) {
      g.lineBetween(drawX[i][0], drawX[i][1], drawX[i][2], drawX[i][3]);
    }

    // 炮位 / 兵位标记
    g.fillStyle(0xd4a355, 0.15);
    var dots = [
      [1, 2], [7, 2], [0, 3], [2, 3], [4, 3], [6, 3], [8, 3],
      [1, 7], [7, 7], [0, 6], [2, 6], [4, 6], [6, 6], [8, 6],
    ];
    for (var d = 0; d < dots.length; d++) {
      var dr = dots[d][1], dc = dots[d][0];
      var dx = bx + dc * cw, dy = by + dr * cw;
      g.fillCircle(dx, dy, 2.5);
    }
  }

  // ========== 棋子渲染 ==========

  syncPieces(boardStr) {
    var self = this;
    if (!boardStr || boardStr.length < 90) {
      // 棋盘未就绪，等 state 初始化
      return;
    }
    // 清除旧棋子
    Object.keys(self.pieces).forEach(function (k) {
      self.pieces[k].destroy();
    });
    self.pieces = {};

    for (var i = 0; i < boardStr.length; i++) {
      var ch = boardStr[i];
      if (ch === '.') continue;
      var piece = self.createPiece(ch, i);
      self.pieces[i] = piece;
    }
    this.prevBoard = boardStr;
  }

  createPiece(ch, idx) {
    var self = this;
    var row = Math.floor(idx / 9);
    var col = idx % 9;
    var x = self.boardX + col * self.cellW;
    var y = self.boardY + row * self.cellW;
    var isRed = (ch === ch.toUpperCase());

    var container = self.add.container(x, y);
    container.setDepth(10);
    container.setSize(self.pieceR * 2, self.pieceR * 2);

    // 底座图片
    var img = self.add.image(0, 0, 'chess');
    img.setDisplaySize(self.pieceR * 2, self.pieceR * 2);
    img.setTint(isRed ? 0xffcccc : 0xcccccc);
    container.add(img);

    // 棋子文字
    var text = self.add.text(0, 1, PIECE_TEXT[ch] || ch, {
      fontSize: '22px',
      fontFamily: 'Zpix, monospace',
      color: isRed ? '#cc0000' : '#222222',
      stroke: isRed ? '#ffffff' : '#eeeeee',
      strokeThickness: 1,
    }).setOrigin(0.5);
    container.add(text);

    container.boardIdx = idx;
    return container;
  }

  animateMove(oldBoard, newBoard) {
    var self = this;
    var from = -1, to = -1;
    for (var i = 0; i < 90; i++) {
      if (oldBoard[i] !== '.' && newBoard[i] === '.') from = i;
      if (newBoard[i] !== '.' && oldBoard[i] !== newBoard[i]) to = i;
    }
    if (from < 0 || to < 0) {
      // diff 失败，直接全量重绘
      self.syncPieces(newBoard);
      return;
    }

    // 如果目标位有对方棋子被吃
    if (self.pieces[to]) {
      var eaten = self.pieces[to];
      self.tweens.add({ targets: eaten, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 200, onComplete: function () { eaten.destroy(); } });
      delete self.pieces[to];
    }

    // 移动 from 棋子到 to 位置
    var fromPiece = self.pieces[from];
    if (!fromPiece) {
      self.syncPieces(newBoard);
      return;
    }
    delete self.pieces[from];
    self.pieces[to] = fromPiece;
    fromPiece.boardIdx = to;

    var row = Math.floor(to / 9), col = to % 9;
    var tx = self.boardX + col * self.cellW;
    var ty = self.boardY + row * self.cellW;

    self.tweens.add({
      targets: fromPiece, x: tx, y: ty,
      duration: 300, ease: 'Power2',
      onComplete: function () { self.prevBoard = newBoard; }
    });
  }

  // ========== UI 与状态 ==========

  createUI() {
    var self = this;
    var w = this.cameras.main.width;

    // 回合 / 状态显示
    this.statusText = this.add.text(w / 2, 20, '', {
      fontSize: '16px', fontFamily: 'Zpix, monospace', color: '#f0d9b5',
    }).setOrigin(0.5).setDepth(20);

    // 对手信息
    this.opponentText = this.add.text(w / 2, 44, '', {
      fontSize: '13px', fontFamily: 'Zpix, monospace', color: '#8b7355',
    }).setOrigin(0.5).setDepth(20);

    // 房间码显示（顶部小字）
    this.roomCodeText = this.add.text(10, 8, '房间: ' + (this.room ? this.room.id : ''), {
      fontSize: '11px', fontFamily: 'monospace', color: '#5c4a38',
    }).setDepth(20);

    // 认输按钮
    var resignBg = this.add.rectangle(w - 58, 24, 88, 32, 0x4a3728).setInteractive({ useHandCursor: true }).setDepth(20);
    resignBg.on('pointerover', function () { resignBg.setFillStyle(0x6b3a3a); });
    resignBg.on('pointerout',  function () { resignBg.setFillStyle(0x4a3728); });
    resignBg.on('pointerdown', function () { self.room.send('resign'); });
    this.add.text(w - 58, 24, '认输', {
      fontSize: '14px', fontFamily: 'Zpix, monospace', color: '#f0d9b5',
    }).setOrigin(0.5).setDepth(21);

    // 返回按钮
    var backBg = this.add.rectangle(10, this.cameras.main.height - 16, 60, 26, 0x3a2a1e).setInteractive({ useHandCursor: true }).setDepth(20);
    backBg.on('pointerover', function () { backBg.setFillStyle(0x5c4a38); });
    backBg.on('pointerout',  function () { backBg.setFillStyle(0x3a2a1e); });
    backBg.on('pointerdown', function () {
      window.NetworkManager.leaveRoom();
      self.scene.start('MenuScene');
    });
    this.add.text(10, this.cameras.main.height - 16, '< 返回', {
      fontSize: '12px', fontFamily: 'Zpix, monospace', color: '#8b7355',
    }).setOrigin(0, 0.5).setDepth(21);

    this.updateStatusDisplay();

    // 等待对手提示
    this.waitingOverlay = this.add.rectangle(w / 2, this.boardY + this.boardH / 2, 260, 60, 0x1a1208, 0.85).setDepth(30);
    this.waitingText = this.add.text(w / 2, this.boardY + this.boardH / 2, '等待对手加入...', {
      fontSize: '15px', fontFamily: 'Zpix, monospace', color: '#f0d9b5',
    }).setOrigin(0.5).setDepth(31);

    if (this.room.state.status !== 'waiting') {
      this.waitingOverlay.setVisible(false);
      this.waitingText.setVisible(false);
    }
  }

  updateStatusDisplay() {
    var status = this.room.state.status;
    var turn = this.room.state.turn;
    if (status === 'ended') {
      var won = (this.room.state.winner === this.mySeat);
      this.statusText.setText(won ? '你赢了！' : '你输了');
      this.statusText.setColor(won ? '#ffdd66' : '#cc5555');
      this.opponentText.setText('');
    } else if (status === 'playing') {
      var yourTurn = (turn === this.mySeat);
      var sideName = turn === 0 ? '红方' : '黑方';
      this.statusText.setText(yourTurn ? '轮到你了 (' + sideName + ')' : '对手回合 (' + sideName + ')');
      this.statusText.setColor(yourTurn ? '#ffdd66' : '#8b7355');
    } else {
      this.statusText.setText('等待中...');
    }
    // 对手名称
    var oppName = '';
    var self = this;
    this.room.state.players.forEach(function (p, sid) {
      if (sid !== self.room.sessionId) oppName = p.name;
    });
    this.opponentText.setText(oppName ? '对手: ' + oppName : '');
  }

  // ========== 状态监听 ==========

  bindState() {
    var self = this;

    this.room.state.listen('board', function (newBoard, oldBoard) {
      if (!oldBoard || oldBoard === newBoard) return;
      if (self.prevBoard && self.prevBoard !== oldBoard) {
        // 多步变化（可能从另一个客户端视角初始化），全量刷新
        self.syncPieces(newBoard);
      }
      self.animateMove(oldBoard, newBoard);
    });

    this.room.state.listen('turn', function () {
      self.updateStatusDisplay();
    });

    this.room.state.listen('status', function (newStatus) {
      if (newStatus === 'playing') {
        self.waitingOverlay.setVisible(false);
        self.waitingText.setVisible(false);
      }
      self.updateStatusDisplay();
    });

    this.room.state.listen('winner', function () {
      self.updateStatusDisplay();
    });

    // 玩家变化（对手加入/离开）
    this.room.state.players.onAdd = function () {
      self.updateStatusDisplay();
      self.opponentText.setText('对手已加入');
      // 加入方刷新棋盘（房间创建时可能已设好 board）
      if (self.room.state.board && self.room.state.board.length === 90) {
        self.syncPieces(self.room.state.board);
      }
    };
    this.room.state.players.onRemove = function () {
      self.updateStatusDisplay();
      self.statusText.setText('对手已离开');
      self.statusText.setColor('#cc5555');
    };
  }

  // ========== 交互 ==========

  setupInteraction() {
    var self = this;
    this.input.on('pointerdown', function (pointer) {
      var idx = self.getBoardIndex(pointer.x, pointer.y);
      if (idx < 0 || idx >= 90) return;

      if (self.room.state.status === 'ended') return;

      if (self.room.state.status === 'waiting') return;

      if (self.room.state.turn !== self.mySeat) {
        // 不是你的回合
        self.statusText.setColor('#cc5555');
        return;
      }

      var board = self.room.state.board;
      var piece = board[idx];
      var mySide = self.mySeat;

      if (piece !== '.' && self.pieceSide(piece) === mySide) {
        // 选中己方棋子
        self.selectPiece(idx);
      } else if (self.selectedFrom >= 0) {
        // 走子
        self.room.send('move', { from: self.selectedFrom, to: idx });
        self.deselectPiece();
      }
    });
  }

  pieceSide(ch) {
    if (ch === '.') return -1;
    return ch === ch.toUpperCase() ? 0 : 1;
  }

  getBoardIndex(px, py) {
    var col = Math.floor((px - this.boardX + this.cellW / 2) / this.cellW);
    var row = Math.floor((py - this.boardY + this.cellW / 2) / this.cellW);
    if (col < 0 || col > 8 || row < 0 || row > 9) return -1;
    return row * 9 + col;
  }

  selectPiece(idx) {
    this.deselectPiece();
    var piece = this.pieces[idx];
    if (!piece) return;
    this.selectedFrom = idx;
    piece.list.forEach(function (child) {
      if (child.setTint) child.setTint(0xffff88);
    });
    // 抬升效果
    this.tweens.add({ targets: piece, y: piece.y - 6, duration: 120, ease: 'Back.easeOut' });
  }

  deselectPiece() {
    if (this.selectedFrom < 0) return;
    var piece = this.pieces[this.selectedFrom];
    this.selectedFrom = -1;
    if (!piece) return;
    var row = Math.floor(piece.boardIdx / 9);
    var origY = this.boardY + row * this.cellW;
    this.tweens.add({ targets: piece, y: origY, duration: 120, ease: 'Back.easeOut' });
    var side = this.pieceSide(this.room.state.board[piece.boardIdx]);
    var tint = side === 0 ? 0xffcccc : 0xcccccc;
    piece.list.forEach(function (child) {
      if (child.setTint) child.setTint(tint);
    });
  }
}
