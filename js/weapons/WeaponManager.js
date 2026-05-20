/**
 * WeaponManager — 管理玩家所有武器
 * 包含所有武器的实现类，最多同时装备 6 种武器
 */

// ════════════════════════════════════════════════
// 武器基类
// ════════════════════════════════════════════════
class BaseWeapon {
    constructor(scene, player, data) {
        this.scene   = scene;
        this.player  = player;
        this.data    = data;
        this.level   = 1;
        this._lastFired = 0;
    }
    get id() { return this.data.id; }
    get cooldown() {
        // 每升一级冷却降低 10%
        return this.data.cooldown * Math.pow(0.9, this.level - 1);
    }
    get damage() {
        return this.data.damage + (this.level - 1);
    }
    upgrade() { this.level = Math.min(3, this.level + 1); }
    update(time, enemyGroup) {}
    destroy() {}
}

// ════════════════════════════════════════════════
// GunWeapon — 直线子弹
// ════════════════════════════════════════════════
class GunWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player, WEAPON_DATA.gun);
        this._pool = scene.physics.add.group({ maxSize: 20 });
    }

    get bulletGroup() { return this._pool; }

    update(time, enemyGroup) {
        // 自动开火
        if (time > this._lastFired + this.cooldown) {
            this._fire();
            this._lastFired = time;
        }
        // 回收飞出屏幕的子弹
        this._pool.children.iterate(b => {
            if (b.active && b.y < -20) { b.setActive(false).setVisible(false); }
        });
    }

    _fire() {
        const { x, y } = this.player.sprite;
        this._spawnBullet(x, y, 0, -500);
        if (this.level >= 2) {  // 二级：双排
            this._spawnBullet(x - 14, y, 0, -500);
            this._spawnBullet(x + 14, y, 0, -500);
        }
    }

    _spawnBullet(x, y, vx, vy) {
        const b = this._pool.get(x, y, 'bulletPlayer');
        if (!b) return;
        b.setActive(true).setVisible(true).setScale(0.8);
        b.setVelocity(vx, vy);
        b.damage = this.damage;
    }

    destroy() { this._pool.clear(true, true); }
}

// ════════════════════════════════════════════════
// SpreadWeapon — 三向散射
// ════════════════════════════════════════════════
class SpreadWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player, WEAPON_DATA.spread);
        this._pool = scene.physics.add.group({ maxSize: 30 });
    }

    get bulletGroup() { return this._pool; }

    update(time, enemyGroup) {
        if (time > this._lastFired + this.cooldown) {
            this._fire();
            this._lastFired = time;
        }
        this._pool.children.iterate(b => {
            if (b.active && (b.y < -20 || b.x < -20 || b.x > 520)) {
                b.setActive(false).setVisible(false);
            }
        });
    }

    _fire() {
        const { x, y } = this.player.sprite;
        const spd = this.data.speed;
        const angles = this.level >= 3
            ? [-30, -15, 0, 15, 30]   // 五叉
            : [-this.data.angle, 0, this.data.angle];
        for (const deg of angles) {
            const rad = Phaser.Math.DegToRad(deg - 90);
            const vx  = Math.cos(rad) * spd;
            const vy  = Math.sin(rad) * spd;
            const b   = this._pool.get(x, y, 'bulletPlayer');
            if (!b) continue;
            b.setActive(true).setVisible(true).setScale(0.7).setTint(this.data.color);
            b.setVelocity(vx, vy);
            b.damage = this.damage;
        }
    }

    destroy() { this._pool.clear(true, true); }
}

// ════════════════════════════════════════════════
// HomingWeapon — 追踪弹
// ════════════════════════════════════════════════
class HomingWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player, WEAPON_DATA.homing);
        this._bullets = [];  // { gfx, x, y, vx, vy, active, damage }
    }

    get bulletGroup() { return null; }  // 手动处理碰撞

    update(time, enemyGroup) {
        if (time > this._lastFired + this.cooldown) {
            this._fire();
            this._lastFired = time;
        }
        // 更新追踪弹运动
        for (const b of this._bullets) {
            if (!b.active) continue;
            // 寻找最近的活跃敌人
            const target = this._findNearest(b.x, b.y, enemyGroup);
            if (target) {
                const dx = target.x - b.x;
                const dy = target.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const tr = this.data.turnRate;
                b.vx += (dx / dist) * tr;
                b.vy += (dy / dist) * tr;
                const spd = this.data.speed;
                const len = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
                b.vx = (b.vx / len) * spd;
                b.vy = (b.vy / len) * spd;
            }
            b.x += b.vx / 60;
            b.y += b.vy / 60;
            b.gfx.setPosition(b.x, b.y);
            // 检测与敌人的碰撞
            if (enemyGroup) {
                enemyGroup.children.iterate(enemy => {
                    if (!enemy.active || !b.active) return;
                    const dx = enemy.x - b.x, dy = enemy.y - b.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 22) {
                        b.active = false;
                        b.gfx.setVisible(false);
                        if (this.scene._damageEnemy) this.scene._damageEnemy(enemy, b.damage);
                    }
                });
            }
            if (b.y < -30 || b.y > 730 || b.x < -30 || b.x > 530) {
                b.active = false;
                b.gfx.setVisible(false);
            }
        }
        // 清理不活跃的子弹对象
        this._bullets = this._bullets.filter(b => b.active);
    }

    _fire() {
        const count = this.level >= 2 ? 2 : 1;
        for (let i = 0; i < count; i++) {
            const gfx = this.scene.add.graphics();
            gfx.fillStyle(this.data.color, 1);
            gfx.fillCircle(0, 0, 5);
            gfx.setDepth(5);
            this._bullets.push({
                gfx, active: true, damage: this.damage,
                x: this.player.sprite.x + (i - 0.5) * 14,
                y: this.player.sprite.y - 20,
                vx: Phaser.Math.Between(-30, 30),
                vy: -this.data.speed
            });
        }
    }

    _findNearest(bx, by, enemyGroup) {
        let nearest = null, minDist = 9999;
        if (!enemyGroup) return null;
        enemyGroup.children.iterate(e => {
            if (!e.active) return;
            const d = Phaser.Math.Distance.Between(bx, by, e.x, e.y);
            if (d < minDist) { minDist = d; nearest = e; }
        });
        return nearest;
    }

    destroy() {
        for (const b of this._bullets) b.gfx.destroy();
        this._bullets = [];
    }
}

// ════════════════════════════════════════════════
// LaserWeapon — 激光束（持续型）
// ════════════════════════════════════════════════
class LaserWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player, WEAPON_DATA.laser);
        this._laserGfx = null;
        this._activeUntil = 0;
    }

    get bulletGroup() { return null; }

    update(time, enemyGroup) {
        const isActive = time < this._activeUntil;

        if (!isActive && time > this._lastFired + this.cooldown) {
            this._activeUntil = time + this.data.duration;
            this._lastFired   = time;
        }

        if (time < this._activeUntil) {
            this._drawLaser();
            // 对激光路径上的敌人造成伤害
            if (enemyGroup) {
                const px = this.player.sprite.x;
                enemyGroup.children.iterate(e => {
                    if (!e.active) return;
                    if (Math.abs(e.x - px) < 18 && e.y < this.player.sprite.y) {
                        if (this.scene._damageEnemy) this.scene._damageEnemy(e, this.damage * 0.1);
                    }
                });
            }
        } else if (this._laserGfx) {
            this._laserGfx.clear();
        }
    }

    _drawLaser() {
        if (!this._laserGfx) {
            this._laserGfx = this.scene.add.graphics();
            this._laserGfx.setDepth(6);
        }
        const px = this.player.sprite.x;
        const py = this.player.sprite.y;
        this._laserGfx.clear();
        // 外层光晕
        this._laserGfx.lineStyle(8, this.data.color, 0.2);
        this._laserGfx.lineBetween(px, py, px, 0);
        // 内核
        this._laserGfx.lineStyle(3, this.data.color, 0.9);
        this._laserGfx.lineBetween(px, py, px, 0);
    }

    destroy() {
        if (this._laserGfx) { this._laserGfx.destroy(); this._laserGfx = null; }
    }
}

// ════════════════════════════════════════════════
// OrbitWeapon — 护盾球（环绕）
// ════════════════════════════════════════════════
class OrbitWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player, WEAPON_DATA.orbit);
        this._orbs    = [];
        this._angle   = 0;
    }

    get bulletGroup() { return null; }

    update(time, enemyGroup) {
        const count  = this.data.count + (this.level - 1);
        const radius = this.data.radius;
        const px     = this.player.sprite.x;
        const py     = this.player.sprite.y;

        // 按需创建/销毁护盾球
        while (this._orbs.length < count) {
            const g = this.scene.add.graphics();
            g.fillStyle(this.data.color, 0.85);
            g.fillCircle(0, 0, 8);
            g.setDepth(7);
            this._orbs.push(g);
        }
        while (this._orbs.length > count) {
            this._orbs.pop().destroy();
        }

        this._angle += 0.03;

        for (let i = 0; i < this._orbs.length; i++) {
            const a = this._angle + (i / count) * Math.PI * 2;
            const ox = px + Math.cos(a) * radius;
            const oy = py + Math.sin(a) * radius;
            this._orbs[i].setPosition(ox, oy);

            // 与敌人碰撞
            if (enemyGroup) {
                enemyGroup.children.iterate(e => {
                    if (!e.active) return;
                    const d = Phaser.Math.Distance.Between(ox, oy, e.x, e.y);
                    if (d < 26) {
                        if (this.scene._damageEnemy) this.scene._damageEnemy(e, this.damage);
                    }
                });
            }
        }
    }

    destroy() {
        for (const o of this._orbs) o.destroy();
        this._orbs = [];
    }
}

// ════════════════════════════════════════════════
// PulseWeapon — 环形脉冲波
// ════════════════════════════════════════════════
class PulseWeapon extends BaseWeapon {
    constructor(scene, player) {
        super(scene, player, WEAPON_DATA.pulse);
        this._waves = [];
    }

    get bulletGroup() { return null; }

    update(time, enemyGroup) {
        if (time > this._lastFired + this.cooldown) {
            this._spawnWave();
            this._lastFired = time;
        }
        // 更新波纹扩张
        for (const w of this._waves) {
            w.r += 3;
            w.gfx.clear();
            if (w.r < this.data.radius) {
                w.gfx.lineStyle(3, this.data.color, 1 - w.r / this.data.radius);
                w.gfx.strokeCircle(w.x, w.y, w.r);
                // 伤害范围内的敌人
                if (enemyGroup && w.r > 10) {
                    enemyGroup.children.iterate(e => {
                        if (!e.active) return;
                        const d = Phaser.Math.Distance.Between(w.x, w.y, e.x, e.y);
                        if (Math.abs(d - w.r) < 8) {
                            if (!w.hitSet.has(e)) {
                                w.hitSet.add(e);
                                if (this.scene._damageEnemy) this.scene._damageEnemy(e, this.damage);
                            }
                        }
                    });
                }
            } else {
                w.gfx.destroy();
                w.done = true;
            }
        }
        this._waves = this._waves.filter(w => !w.done);
    }

    _spawnWave() {
        const { x, y } = this.player.sprite;
        const gfx = this.scene.add.graphics();
        gfx.setDepth(5);
        this._waves.push({ gfx, x, y, r: 0, hitSet: new Set(), done: false });
    }

    destroy() {
        for (const w of this._waves) w.gfx.destroy();
        this._waves = [];
    }
}

// ════════════════════════════════════════════════
// WeaponManager — 管理器本体
// ════════════════════════════════════════════════
class WeaponManager {
    constructor() {
        this._weapons = [];   // BaseWeapon[]
        this._scene   = null;
        this._player  = null;
    }

    create(scene, player) {
        this._scene  = scene;
        this._player = player;
    }

    /** 初始化起始武器 */
    initWithWeapon(weaponId) {
        this._weapons = [];
        this.addWeapon(weaponId);
    }

    /**
     * 添加新武器或升级已有武器
     * @param {string} weaponId
     */
    addWeapon(weaponId) {
        const existing = this._weapons.find(w => w.id === weaponId);
        if (existing) {
            existing.upgrade();
            return;
        }
        if (this._weapons.length >= 6) return;
        const weapon = this._createWeapon(weaponId);
        if (weapon) this._weapons.push(weapon);
    }

    /** 升级指定武器（已存在） */
    upgradeWeapon(weaponId) {
        const w = this._weapons.find(w => w.id === weaponId);
        if (w) w.upgrade();
    }

    update(time, enemyGroup) {
        for (const w of this._weapons) {
            w.update(time, enemyGroup);
        }
    }

    /** 获取所有使用 Phaser 物理组的武器子弹 group（用于 overlap 检测） */
    getBulletGroups() {
        return this._weapons
            .map(w => w.bulletGroup)
            .filter(g => g !== null);
    }

    getWeaponIds() {
        return this._weapons.map(w => w.id);
    }

    getWeaponLevel(weaponId) {
        const w = this._weapons.find(w => w.id === weaponId);
        return w ? w.level : 0;
    }

    getWeapons() { return this._weapons; }

    destroy() {
        for (const w of this._weapons) w.destroy();
        this._weapons = [];
    }

    _createWeapon(id) {
        switch (id) {
            case 'gun':    return new GunWeapon(this._scene, this._player);
            case 'spread': return new SpreadWeapon(this._scene, this._player);
            case 'homing': return new HomingWeapon(this._scene, this._player);
            case 'laser':  return new LaserWeapon(this._scene, this._player);
            case 'orbit':  return new OrbitWeapon(this._scene, this._player);
            case 'pulse':  return new PulseWeapon(this._scene, this._player);
            default: console.warn('Unknown weapon:', id); return null;
        }
    }
}
