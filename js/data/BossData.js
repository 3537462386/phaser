/**
 * BOSS_DATA — Boss 定义
 *
 * Boss 每 5 轮出现一次，是局程中的高潮节点。
 * 每个 Boss 有独特的攻击模式和阶段变化。
 * 击杀 Boss 掉落稀有遗物（从 tier 2 池中挑选）。
 */
const BOSS_DATA = {
    swarm_queen: {
        id:            'swarm_queen',
        name:          '虫群女王',
        hp:            40,
        speed:         0.8,
        scale:         2.2,
        tint:          0xff2288,
        contactDamage: 2,
        expValue:      30,
        goldValue:     25,
        // 阶段 2：HP < 50% 时触发
        phase2HpRatio: 0.5,
        phase2Speed:   1.8,
        // 攻击模式
        attacks: [
            {
                type:     'spawn_minions',
                interval: 4000,     // 每 4 秒
                count:    3,        // 生成 3 个小兵
                minionType: 'fast'
            },
            {
                type:     'charge',
                interval: 6000,     // 每 6 秒冲撞
                speed:    5,
                duration: 800       // 冲撞持续 ms
            }
        ],
        // 掉落池（tier 2 遗物 + 金币）
        lootTier:  2,
        lootGold:  30
    },

    crystal_fortress: {
        id:            'crystal_fortress',
        name:          '晶体堡垒',
        hp:            60,
        speed:         0.4,
        scale:         2.8,
        tint:          0x44ddff,
        contactDamage: 3,
        expValue:      50,
        goldValue:     40,
        phase2HpRatio: 0.4,
        phase2Speed:   0.6,
        attacks: [
            {
                type:     'ring_shot',
                interval: 3000,      // 每 3 秒发射环形弹幕
                bulletCount: 8,
                bulletSpeed: 2.5,
                bulletDamage: 1
            },
            {
                type:     'spawn_minions',
                interval: 8000,
                count:    2,
                minionType: 'heavy'
            }
        ],
        lootTier:  2,
        lootGold:  50
    },

    void_reaper: {
        id:            'void_reaper',
        name:          '虚空收割者',
        hp:            80,
        speed:         1.2,
        scale:         2.0,
        tint:          0x8822ff,
        contactDamage: 3,
        expValue:      80,
        goldValue:     60,
        phase2HpRatio: 0.3,
        phase2Speed:   2.5,
        attacks: [
            {
                type:     'ring_shot',
                interval: 2000,
                bulletCount: 12,
                bulletSpeed: 3,
                bulletDamage: 1
            },
            {
                type:     'charge',
                interval: 4000,
                speed:    7,
                duration: 600
            },
            {
                type:     'spawn_minions',
                interval: 6000,
                count:    4,
                minionType: 'fast'
            }
        ],
        lootTier:  2,
        lootGold:  80
    }
};

/**
 * BOSS_SCHEDULE — Boss 出场顺序
 * 按索引循环：第 5 轮出 swarm_queen, 第 10 轮出 crystal_fortress, ...
 */
const BOSS_SCHEDULE = ['swarm_queen', 'crystal_fortress', 'void_reaper'];
