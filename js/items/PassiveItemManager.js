/**
 * PassiveItemManager — 被动遗物管理器
 *
 * 管理玩家持有的所有被动遗物，处理：
 *   - 遗物获取与叠加逻辑
 *   - 协同检测（遗物x武器联动加成）
 *   - 被动效果触发（护盾、回血、爆炸等运行时效果）
 *   - 快照保存/恢复（轮间休整）
 *
 * 运行时效果由 GameScene 在 update 中调用本管理器的 update 方法
 */
class PassiveItemManager {
    constructor() {
        /** @type {Map<string, {data: object, count: number}>} */
        this._items = new Map();

        // 运行时状态
        this._killCounter  = 0;     // 用于 regen_cell 计数
        this._shieldTimer  = 0;     // 用于 shield_shard 计时
        this._shieldStacks = 0;     // 当前护盾层数
        this._scene        = null;
        this._player       = null;
        this._weaponMgr    = null;
    }

    create(scene, player, weaponManager) {
        this._scene     = scene;
        this._player    = player;
        this._weaponMgr = weaponManager;
    }

    reset() {
        this._items.clear();
        this._killCounter  = 0;
        this._shieldTimer  = 0;
        this._shieldStacks = 0;
    }

    // ── 获取遗物 ──────────────────────────────────────

    /**
     * 获取一个遗物
     * @param {string} itemId - 遗物 ID
     * @returns {boolean} 是否成功获取
     */
    acquire(itemId) {
        const data = PASSIVE_ITEM_DATA[itemId];
        if (!data) return false;

        const existing = this._items.get(itemId);
        if (existing) {
            if (existing.count >= data.maxStack) return false;
            existing.count++;
        } else {
            this._items.set(itemId, { data, count: 1 });
        }

        // 执行获取效果
        if (data.onAcquire) {
            data.onAcquire(this._player, this._weaponMgr);
        }

        return true;
    }

    /** 是否持有指定遗物 */
    has(itemId) {
        return this._items.has(itemId);
    }

    /** 获取遗物叠加数 */
    getStack(itemId) {
        const entry = this._items.get(itemId);
        return entry ? entry.count : 0;
    }

    /** 获取所有持有遗物 */
    getAll() {
        const result = [];
        this._items.forEach((entry, id) => {
            result.push({ id, data: entry.data, count: entry.count });
        });
        return result;
    }

    /** 遗物数量 */
    get count() {
        return this._items.size;
    }

    // ── 协同检测 ──────────────────────────────────────

    /**
     * 检查指定武器是否与已有遗物有协同
     * @param {string} weaponId
     * @returns {string[]} 有协同的遗物 ID 列表
     */
    getSynergiesForWeapon(weaponId) {
        const synergies = [];
        this._items.forEach((entry, id) => {
            if (entry.data.synergy && entry.data.synergy.includes(weaponId)) {
                synergies.push(id);
            }
        });
        return synergies;
    }

    /**
     * 检查指定遗物是否与已有武器有协同
     * @param {string} itemId
     * @returns {string[]} 有协同的武器 ID 列表
     */
    getSynergiesForItem(itemId) {
        const data = PASSIVE_ITEM_DATA[itemId];
        if (!data || !data.synergy) return [];
        const activeWeapons = this._weaponMgr ? this._weaponMgr.getWeaponIds() : [];
        return data.synergy.filter(wid => activeWeapons.includes(wid));
    }

    // ── 运行时效果 ──────────────────────────────────────

    /**
     * 每帧更新（由 GameScene 调用）
     * @param {number} time   - Phaser 时间戳
     * @param {number} delta  - 帧间隔 ms
     */
    update(time, delta) {
        // 护盾碎片：每 15 秒加 1 层
        if (this.has('shield_shard')) {
            this._shieldTimer += delta;
            const interval = 15000 / this.getStack('shield_shard');
            if (this._shieldTimer >= interval) {
                this._shieldTimer -= interval;
                this._shieldStacks = Math.min(2, this._shieldStacks + 1);
            }
        }
    }

    /**
     * 通知击杀事件（用于 regen_cell 计数）
     * @returns {number} 应恢复的 HP 量
     */
    notifyKill() {
        this._killCounter++;
        if (this.has('regen_cell')) {
            const threshold = Math.max(10, 20 - this.getStack('regen_cell') * 5);
            if (this._killCounter >= threshold) {
                this._killCounter -= threshold;
                return 1;
            }
        }
        return 0;
    }

    /**
     * 检查敌人被击杀时是否触发爆炸核心
     * @returns {boolean}
     */
    checkExplosionCore() {
        if (!this.has('explosion_core')) return false;
        return Math.random() < 0.30;
    }

    /**
     * 计算伤害修正
     * @param {number} baseDamage
     * @returns {number}
     */
    modifyDamage(baseDamage) {
        let dmg = baseDamage;
        if (this.has('magnifier')) {
            dmg *= (1 + 0.25 * this.getStack('magnifier'));
        }
        if (this.has('blood_pact')) {
            dmg *= 1.5;
        }
        return Math.ceil(dmg);
    }

    /**
     * 计算冷却修正
     * @param {number} baseCooldown
     * @returns {number}
     */
    modifyCooldown(baseCooldown) {
        let cd = baseCooldown;
        if (this.has('rapid_coil')) {
            cd *= Math.pow(0.85, this.getStack('rapid_coil'));
        }
        if (this.has('glass_cannon')) {
            cd *= 0.70;
        }
        return cd;
    }

    /**
     * 计算受伤修正
     * @param {number} incomingDamage
     * @returns {number}
     */
    modifyIncomingDamage(incomingDamage) {
        let dmg = incomingDamage;
        if (this.has('armor_plating')) {
            dmg = Math.max(1, dmg - 1);
        }
        if (this.has('glass_cannon')) {
            dmg += 1;
        }
        return dmg;
    }

    /**
     * 消耗护盾（如果有的话）
     * @returns {boolean} 是否消耗了护盾
     */
    consumeShield() {
        if (this._shieldStacks > 0) {
            this._shieldStacks--;
            return true;
        }
        return false;
    }

    /** 当前护盾层数 */
    get shieldStacks() {
        return this._shieldStacks;
    }

    /**
     * 计算经验修正
     * @param {number} baseExp
     * @returns {number}
     */
    modifyExp(baseExp) {
        if (this.has('exp_battery')) {
            return Math.ceil(baseExp * (1 + 0.30 * this.getStack('exp_battery')));
        }
        return baseExp;
    }

    /**
     * 计算金币修正
     * @param {number} baseGold
     * @returns {number}
     */
    modifyGold(baseGold) {
        let gold = baseGold;
        if (this.has('gold_magnet')) {
            gold *= (1 + 0.50 * this.getStack('gold_magnet'));
        }
        if (this.has('shadow_deal')) {
            gold *= 2;
        }
        return Math.ceil(gold);
    }

    /** 经验球吸取范围修正 */
    get magnetRangeMultiplier() {
        if (this.has('magnet_core')) {
            return 1 + 0.80 * this.getStack('magnet_core');
        }
        return 1;
    }

    /** 升级选项数修正 */
    get upgradeOptionCount() {
        return this.has('lucky_charm') ? 4 : 3;
    }

    // ── 快照 ──────────────────────────────────────────

    /**
     * 生成快照（轮间休整用）
     * @returns {Array<{id: string, count: number}>}
     */
    getSnapshot() {
        const snap = [];
        this._items.forEach((entry, id) => {
            snap.push({ id, count: entry.count });
        });
        return snap;
    }

    /**
     * 从快照恢复
     * @param {Array<{id: string, count: number}>} snapshot
     */
    initFromSnapshot(snapshot) {
        this.reset();
        if (!snapshot) return;
        for (const s of snapshot) {
            const data = PASSIVE_ITEM_DATA[s.id];
            if (data) {
                this._items.set(s.id, { data, count: s.count });
            }
        }
    }
}
