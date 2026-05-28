/**
 * PASSIVE_ITEM_DATA — 被动遗物定义
 *
 * 遗物是肉鸽构建多样性的核心层。与武器不同，遗物不直接造成伤害，
 * 而是通过修改属性、触发额外效果、或与其他系统协同来改变游戏体验。
 *
 * 分类：
 *   attack  — 攻击增强（伤害/频率/范围）
 *   defense — 防御增强（减伤/护盾/回血）
 *   utility — 功能增强（拾取/经济/移速）
 *   curse   — 诅咒（负面+正面效果，高风险高收益）
 *
 * 协同标记（synergy）：
 *   标记哪些武器/系统与该遗物有协同效应，用于：
 *   - 升级弹窗中优先展示协同遗物
 *   - 触发协同特效（视觉/数值加成）
 */
const PASSIVE_ITEM_DATA = {
    // ═══════════════ 攻击类 ═══════════════

    magnifier: {
        id:          'magnifier',
        name:        '放大镜',
        desc:        '所有武器伤害 +25%',
        icon:        '🔍',
        category:    'attack',
        tier:        1,
        synergy:     ['gun', 'spread', 'homing', 'laser'],
        maxStack:    3,
        onAcquire(player, weaponManager) {
            weaponManager.getWeapons().forEach(w => { w._dmgBonus = (w._dmgBonus || 0) + 0.25; });
        }
    },

    rapid_coil: {
        id:          'rapid_coil',
        name:        '速射线圈',
        desc:        '所有武器冷却 -15%',
        icon:        '⚙',
        category:    'attack',
        tier:        1,
        synergy:     ['gun', 'spread'],
        maxStack:    3,
        onAcquire(player, weaponManager) {
            weaponManager.getWeapons().forEach(w => { w._cdBonus = (w._cdBonus || 0) + 0.15; });
        }
    },

    explosion_core: {
        id:          'explosion_core',
        name:        '爆裂核心',
        desc:        '击杀敌人时 30% 概率产生小范围爆炸',
        icon:        '💥',
        category:    'attack',
        tier:        2,
        synergy:     ['spread', 'pulse'],
        maxStack:    1,
        onAcquire() {}
    },

    piercing_lens: {
        id:          'piercing_lens',
        name:        '穿透透镜',
        desc:        '子弹类武器获得穿透（不消失）',
        icon:        '🔷',
        category:    'attack',
        tier:        2,
        synergy:     ['gun', 'spread', 'homing'],
        maxStack:    1,
        onAcquire(player) {
            player.penetrate = true;
        }
    },

    // ═══════════════ 防御类 ═══════════════

    shield_shard: {
        id:          'shield_shard',
        name:        '护盾碎片',
        desc:        '每 15 秒获得 1 点临时护盾（最多 2 层）',
        icon:        '🛡',
        category:    'defense',
        tier:        1,
        synergy:     ['orbit'],
        maxStack:    2,
        onAcquire() {}
    },

    regen_cell: {
        id:          'regen_cell',
        name:        '再生细胞',
        desc:        '每击杀 20 个敌人恢复 1 HP',
        icon:        '💚',
        category:    'defense',
        tier:        1,
        synergy:     [],
        maxStack:    2,
        onAcquire() {}
    },

    armor_plating: {
        id:          'armor_plating',
        name:        '装甲板',
        desc:        '受到伤害 -1（最低伤害 1）',
        icon:        '🔩',
        category:    'defense',
        tier:        2,
        synergy:     ['orbit'],
        maxStack:    1,
        onAcquire() {}
    },

    // ═══════════════ 功能类 ═══════════════

    magnet_core: {
        id:          'magnet_core',
        name:        '磁力核心',
        desc:        '经验球吸取范围 +80%',
        icon:        '🧲',
        category:    'utility',
        tier:        1,
        synergy:     [],
        maxStack:    2,
        onAcquire() {}
    },

    gold_magnet: {
        id:          'gold_magnet',
        name:        '金币磁铁',
        desc:        '金币掉落量 +50%',
        icon:        '🪙',
        category:    'utility',
        tier:        1,
        synergy:     [],
        maxStack:    2,
        onAcquire() {}
    },

    lucky_charm: {
        id:          'lucky_charm',
        name:        '幸运护符',
        desc:        '升级时额外出现 1 个选项（4 选 1）',
        icon:        '🍀',
        category:    'utility',
        tier:        2,
        synergy:     [],
        maxStack:    1,
        onAcquire() {}
    },

    exp_battery: {
        id:          'exp_battery',
        name:        '经验电池',
        desc:        '获得经验 +30%',
        icon:        '🔋',
        category:    'utility',
        tier:        1,
        synergy:     [],
        maxStack:    2,
        onAcquire() {}
    },

    // ═══════════════ 诅咒类 ═══════════════

    blood_pact: {
        id:          'blood_pact',
        name:        '血之契约',
        desc:        'HP 上限 -1，所有武器伤害 +50%',
        icon:        '🩸',
        category:    'curse',
        tier:        2,
        synergy:     ['gun', 'laser', 'spread'],
        maxStack:    1,
        onAcquire(player) {
            player.maxHp = Math.max(1, player.maxHp - 1);
            player.hp = Math.min(player.hp, player.maxHp);
        }
    },

    glass_cannon: {
        id:          'glass_cannon',
        name:        '玻璃大炮',
        desc:        '受伤 +1，武器冷却 -30%',
        icon:        '⚗',
        category:    'curse',
        tier:        2,
        synergy:     ['gun', 'homing', 'spread'],
        maxStack:    1,
        onAcquire(player, weaponManager) {
            weaponManager.getWeapons().forEach(w => { w._cdBonus = (w._cdBonus || 0) + 0.30; });
        }
    },

    shadow_deal: {
        id:          'shadow_deal',
        name:        '暗影交易',
        desc:        '移速 -20%，金币获取 +100%',
        icon:        '👤',
        category:    'curse',
        tier:        2,
        synergy:     [],
        maxStack:    1,
        onAcquire(player) {
            player.moveSpeed = Math.floor(player.moveSpeed * 0.8);
        }
    }
};
