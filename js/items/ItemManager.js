/**
 * ItemManager — 经验球掉落与拾取
 * 使用 Graphics 绘制经验球（不需要新图片资源）
 */
class ItemManager {
    constructor() {
        this.scene    = null;
        this._orbs    = [];   // { gfx, x, y, amount, active }
        this._onPickup = null;
        this._RADIUS   = 8;
        this._MAGNET_DIST = 80;
        this._PICKUP_DIST = 22;
    }

    create(scene) {
        this.scene = scene;
    }

    /**
     * 在指定位置掉落经验球
     */
    spawnExp(x, y, amount) {
        const gfx = this.scene.add.graphics();
        gfx.setDepth(3);
        // 绘制经验球
        gfx.fillStyle(0x44ffaa, 0.9);
        gfx.fillCircle(0, 0, this._RADIUS);
        gfx.lineStyle(1.5, 0xffffff, 0.5);
        gfx.strokeCircle(0, 0, this._RADIUS);
        gfx.setPosition(x, y);

        this._orbs.push({ gfx, x, y, amount, active: true });
    }

    /**
     * 注册拾取回调
     * @param {Function} callback - 收到 (amount) 参数
     */
    onPickup(callback) {
        this._onPickup = callback;
    }

    /**
     * 每帧更新：磁力吸取 + 拾取判定
     * @param {Phaser.GameObjects.Sprite} playerSprite
     */
    update(playerSprite) {
        if (!playerSprite || !playerSprite.active) return;
        const px = playerSprite.x;
        const py = playerSprite.y;

        for (const orb of this._orbs) {
            if (!orb.active) continue;

            const dx = px - orb.x;
            const dy = py - orb.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 拾取
            if (dist < this._PICKUP_DIST) {
                orb.active = false;
                orb.gfx.destroy();
                if (this._onPickup) this._onPickup(orb.amount);
                continue;
            }

            // 磁力吸引
            if (dist < this._MAGNET_DIST) {
                const speed = 3.5;
                orb.x += (dx / dist) * speed;
                orb.y += (dy / dist) * speed;
                orb.gfx.setPosition(orb.x, orb.y);
            }

            // 飞出屏幕则销毁
            if (orb.y > 730) {
                orb.active = false;
                orb.gfx.destroy();
            }
        }

        this._orbs = this._orbs.filter(o => o.active);
    }

    /** 场景重置时清理所有球 */
    clear() {
        for (const o of this._orbs) o.gfx.destroy();
        this._orbs = [];
    }
}
