/**
 * GraphicsPool — Graphics 对象通用池
 * 解决频繁 add.graphics() / destroy() 导致的 GC 与渲染管线抖动
 */
class GraphicsPool {
    constructor(scene, capacity = 10) {
        this.scene = scene;
        this.capacity = capacity;
        this.pool = [];
    }

    /** 获取一个可用 Graphics；池满时返回 null */
    get() {
        for (const gfx of this.pool) {
            if (!gfx.active) {
                gfx.setActive(true).setVisible(true);
                gfx.clear();
                return gfx;
            }
        }
        if (this.pool.length < this.capacity) {
            const gfx = this.scene.add.graphics().setActive(true).setVisible(true);
            this.pool.push(gfx);
            return gfx;
        }
        return null;
    }

    /** 回收 Graphics（clear + 隐藏） */
    release(gfx) {
        if (gfx) {
            gfx.clear();
            gfx.setActive(false).setVisible(false);
        }
    }

    /** 清空并销毁池中所有对象 */
    clear() {
        for (const gfx of this.pool) {
            if (gfx.destroy) gfx.destroy();
        }
        this.pool = [];
    }
}
