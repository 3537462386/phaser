/**
 * UpgradeManager — 升级选项生成器
 *
 * 升级时提供 3（或 4，如有幸运护符）个随机选项。
 * 选项池包含：
 *   - 新武器（未拥有的武器）
 *   - 升级已有武器（Lv1→2→3）
 *   - 武器进化（Lv3 + 持有催化剂遗物时出现）
 *   - 被动遗物（随机 tier 1 或 tier 2）
 *   - 属性加成（移速/HP/冷却）
 *
 * 权重系统保证：
 *   - 武器进化（稀有）权重最高但条件最苛刻
 *   - 遗物根据当前持有武器优先展示有协同的
 *   - 属性加成作为保底选项
 */
class UpgradeManager {

    /**
     * 生成升级选项
     * @param {WeaponManager} weaponManager
     * @param {number} playerLevel
     * @param {PassiveItemManager} [passiveItemManager]
     * @returns {Array<{type, id, label, desc, icon, rarity}>}
     */
    getOptions(weaponManager, playerLevel, passiveItemManager) {
        const optionCount = passiveItemManager
            ? passiveItemManager.upgradeOptionCount
            : 3;

        const all = this._buildAllOptions(weaponManager, playerLevel, passiveItemManager);

        // 按权重排序后加权随机选择
        const weighted = this._weightedShuffle(all);
        return weighted.slice(0, Math.min(optionCount, weighted.length));
    }

    _buildAllOptions(weaponManager, playerLevel, passiveItemManager) {
        const options = [];
        const activeIds = weaponManager.getWeaponIds();

        // ── 武器进化（稀有，Lv3 + 催化剂） ──────────────────
        for (const wid of activeIds) {
            const lvl = weaponManager.getWeaponLevel(wid);
            if (lvl >= 3) {
                const evo = WEAPON_EVOLUTION[wid];
                if (evo && passiveItemManager && passiveItemManager.has(evo.catalyst)) {
                    options.push({
                        type:   'evolveWeapon',
                        id:     evo.evolvedId,
                        sourceWeaponId: wid,
                        label:  `进化 ${evo.evolvedName}`,
                        desc:   evo.evolvedDesc,
                        icon:   evo.evolvedIcon,
                        rarity: 'legendary',
                        weight: 100  // 进化出现权重最高
                    });
                }
            }
        }

        // ── 新增武器 ──────────────────────────────────────────
        const allWeaponIds = Object.keys(WEAPON_DATA);
        for (const wid of allWeaponIds) {
            if (!activeIds.includes(wid)) {
                const wd = WEAPON_DATA[wid];
                options.push({
                    type:   'newWeapon',
                    id:     wid,
                    label:  `获得 ${wd.name}`,
                    desc:   wd.desc,
                    icon:   wd.icon,
                    rarity: 'common',
                    weight: 20
                });
            }
        }

        // ── 升级已有武器 ──────────────────────────────────────
        for (const wid of activeIds) {
            const lvl = weaponManager.getWeaponLevel(wid);
            if (lvl < 3) {
                const wd = WEAPON_DATA[wid];
                // 升级描述细化
                let desc = `提升 ${wd.name} 的伤害和频率`;
                if (wid === 'gun' && lvl === 1) desc = '双排齐射';
                if (wid === 'spread' && lvl === 2) desc = '升级为五叉';
                if (wid === 'homing' && lvl === 1) desc = '同时发射2枚';

                options.push({
                    type:   'upgradeWeapon',
                    id:     wid,
                    label:  `升级 ${wd.name} Lv${lvl + 1}`,
                    desc,
                    icon:   wd.icon,
                    rarity: 'uncommon',
                    weight: 30
                });
            }
        }

        // ── 被动遗物 ──────────────────────────────────────────
        if (passiveItemManager) {
            const activeWeapons = weaponManager.getWeaponIds();
            const allRelics = Object.values(PASSIVE_ITEM_DATA);

            for (const relic of allRelics) {
                // 已满叠跳过
                if (passiveItemManager.has(relic.id) &&
                    passiveItemManager.getStack(relic.id) >= relic.maxStack) continue;

                // 计算协同权重加成
                let synergyBonus = 0;
                if (relic.synergy) {
                    for (const wid of relic.synergy) {
                        if (activeWeapons.includes(wid)) synergyBonus += 15;
                    }
                }

                const isCurse = relic.category === 'curse';
                options.push({
                    type:   'passiveItem',
                    id:     relic.id,
                    label:  isCurse ? `诅咒: ${relic.name}` : `遗物: ${relic.name}`,
                    desc:   relic.desc,
                    icon:   relic.icon,
                    rarity: relic.tier === 2 ? 'rare' : 'common',
                    weight: 15 + synergyBonus + (isCurse ? 5 : 0)
                });
            }
        }

        // ── 属性加成（保底） ──────────────────────────────────
        options.push({
            type:   'stat', id: 'speed',
            label:  '提升移速', desc: '移动速度 +15%',
            icon:   '💨', rarity: 'common', weight: 10
        });
        options.push({
            type:   'stat', id: 'hp',
            label:  '恢复生命', desc: '生命值 +1',
            icon:   '❤', rarity: 'common', weight: 12
        });
        options.push({
            type:   'stat', id: 'cooldown',
            label:  '加速射击', desc: '射击冷却 -10%',
            icon:   '⚡', rarity: 'common', weight: 10
        });

        return options;
    }

    /**
     * 加权随机打乱（权重越高越靠前）
     */
    _weightedShuffle(options) {
        const tagged = options.map(opt => ({
            opt,
            roll: Math.random() * (opt.weight || 10)
        }));
        tagged.sort((a, b) => b.roll - a.roll);
        return tagged.map(t => t.opt);
    }
}
