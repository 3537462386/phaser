class AchievementsScene extends BaseScene {

    constructor() {
        super({ key: 'AchievementsScene' });
    }

    create() {
        this._initStarfield(90);
        this._drawHeader();
        this._drawCards();
        this._addBackButton();
        this._fadeIn(300);
    }

    update() {
        this._tickStars();
    }

    _drawHeader() {
        // 标题
        this.add.text(250, 46, '🏆  成就', {
            fontSize: '30px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: '#ffcc44', stroke: '#996600', strokeThickness: 3
        }).setOrigin(0.5);

        // 分割线
        const g = this.add.graphics();
        g.lineStyle(1, 0xaa7700, 0.4);
        g.lineBetween(50, 78, 450, 78);

        // 说明
        this.add.text(250, 94, '完成挑战后自动解锁', {
            fontSize: '12px', fontFamily: 'Arial', fill: '#664400'
        }).setOrigin(0.5);
    }

    _drawCards() {
        const list = [
            { icon: '🎯', name: '首次击杀',  desc: '击落第一架敌机',        unlocked: false },
            { icon: '💯', name: '百分射手',  desc: '累计得分达到 100 分',    unlocked: false },
            { icon: '⚡', name: '连环炮手',  desc: '5 秒内连续击落 5 架',    unlocked: false },
            { icon: '🛡️', name: '钢铁意志',  desc: '单局存活超过 5 分钟',    unlocked: false },
            { icon: '🌟', name: '宇宙英雄',  desc: '累计得分达到 500 分',    unlocked: false },
        ];

        list.forEach((ach, i) => this._drawCard(ach, 118 + i * 96));
    }

    _drawCard({ icon, name, desc, unlocked }, y) {
        const g = this.add.graphics();
        const border = unlocked ? 0xffcc44 : 0x2a3d55;
        const fill   = unlocked ? 0xffaa00 : 0x0a1628;

        g.fillStyle(fill, unlocked ? 0.18 : 0.5);
        g.fillRoundedRect(28, y, 444, 80, 8);
        g.lineStyle(1, border, unlocked ? 0.7 : 0.3);
        g.strokeRoundedRect(28, y, 444, 80, 8);

        // 左侧图标区
        g.fillStyle(unlocked ? 0xffaa00 : 0x111f33, 0.4);
        g.fillRoundedRect(28, y, 68, 80, { tl: 8, tr: 0, br: 0, bl: 8 });

        this.add.text(62, y + 40, icon, {
            fontSize: '28px'
        }).setOrigin(0.5).setAlpha(unlocked ? 1 : 0.3);

        // 成就名
        this.add.text(112, y + 20, name, {
            fontSize: '16px', fontFamily: 'Arial', fontStyle: 'bold',
            fill: unlocked ? '#ffdd77' : '#556677'
        });

        // 描述
        this.add.text(112, y + 44, desc, {
            fontSize: '13px', fontFamily: 'Arial',
            fill: unlocked ? '#cccccc' : '#3a4d5e'
        });

        // 右侧状态
        if (unlocked) {
            this.add.text(448, y + 40, '✔', {
                fontSize: '20px', fill: '#ffcc44'
            }).setOrigin(0.5);
        } else {
            this.add.text(448, y + 40, '🔒', {
                fontSize: '18px'
            }).setOrigin(0.5).setAlpha(0.35);
        }
    }
}
