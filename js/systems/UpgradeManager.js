/**
 * UpgradeManager — 在升级时提供 3 个随机升级选项
 */
class UpgradeManager {

    /**
     * 生成 3 个升级选项
     * @param {WeaponManager} weaponManager
     * @param {number} playerLevel
     * @returns {Array<{type, id, label, desc, icon}>}
     */
    getOptions(weaponManager, playerLevel) {
        const all = this._buildAllOptions(weaponManager, playerLevel);
        // 随机打乱后取前 3
        Phaser.Utils.Array.Shuffle(all);
        return all.slice(0, Math.min(3, all.length));
    }

    _buildAllOptions(weaponManager, playerLevel) {
        const options = [];
        const activeIds = weaponManager.getWeaponIds();

        // 新增武器（最多 6 种，按已有武器判断）
        const allWeaponIds = Object.keys(WEAPON_DATA);
        for (const wid of allWeaponIds) {
            if (!activeIds.includes(wid)) {
                const wd = WEAPON_DATA[wid];
                options.push({
                    type:  'newWeapon',
                    id:    wid,
                    label: `获得 ${wd.name}`,
                    desc:  wd.desc,
                    icon:  wd.icon
                });
            }
        }

        // 升级已有武器（如果等级 < 3）
        for (const wid of activeIds) {
            const lvl = weaponManager.getWeaponLevel(wid);
            if (lvl < 3) {
                const wd = WEAPON_DATA[wid];
                options.push({
                    type:  'upgradeWeapon',
                    id:    wid,
                    label: `升级 ${wd.name} Lv${lvl + 1}`,
                    desc:  `提升 ${wd.name} 的伤害和频率`,
                    icon:  wd.icon
                });
            }
        }

        // 属性加成
        options.push({ type: 'stat', id: 'speed',   label: '提升移速', desc: '移动速度 +15%', icon: '💨' });
        options.push({ type: 'stat', id: 'hp',      label: '恢复生命', desc: '生命值 +1',     icon: '❤' });
        options.push({ type: 'stat', id: 'cooldown',label: '加速射击', desc: '射击冷却 -10%', icon: '⚡' });

        return options;
    }
}
