/**
 * WEAPON_DATA — 武器定义
 * gun:    直线子弹
 * spread: 三连散射
 * homing: 追踪子弹
 * laser:  持续激光线
 * orbit:  护盾球环绕
 * pulse:  环形脉冲波
 */
const WEAPON_DATA = {
    gun: {
        id:        'gun',
        name:      '机炮',
        desc:      '直线射击，冷却短',
        icon:      '🔫',
        cooldown:  200,  // ms
        damage:    1,
        speed:     500,
        color:     0x88ddff
    },
    spread: {
        id:        'spread',
        name:      '散弹',
        desc:      '三向扩散射击',
        icon:      '💨',
        cooldown:  350,
        damage:    1,
        speed:     420,
        color:     0xffdd44,
        angle:     20    // 每侧偏角（度）
    },
    homing: {
        id:        'homing',
        name:      '追踪弹',
        desc:      '自动追踪最近敌人',
        icon:      '🎯',
        cooldown:  500,
        damage:    1,
        speed:     260,
        color:     0xff44ff,
        turnRate:  3     // 每帧转向角速度
    },
    laser: {
        id:        'laser',
        name:      '激光束',
        desc:      '短时间高伤害激光',
        icon:      '⚡',
        cooldown:  1800,
        damage:    2,
        duration:  400,  // 持续 ms
        color:     0x44ffff
    },
    orbit: {
        id:        'orbit',
        name:      '护盾球',
        desc:      '环绕飞机的旋转护盾',
        icon:      '🔮',
        cooldown:  0,    // 持续存在，不需要冷却
        damage:    1,
        count:     2,    // 球数量
        radius:    60,   // 轨道半径
        color:     0x44ff88
    },
    pulse: {
        id:        'pulse',
        name:      '脉冲波',
        desc:      '向四周发射冲击波',
        icon:      '💫',
        cooldown:  2500,
        damage:    1,
        radius:    120,  // 伤害范围
        color:     0xff8844
    }
};

/**
 * WEAPON_EVOLUTION — 武器进化定义
 *
 * 武器达到 Lv3 后，可通过商店/遗物/事件进化为终极形态。
 * 进化需要对应遗物（catalyst），满足条件后武器变为进化形态。
 */
const WEAPON_EVOLUTION = {
    gun: {
        evolvedId:   'gun_omega',
        evolvedName: '欧米茄机炮',
        evolvedDesc: '三排齐射 + 子弹体积增大',
        evolvedIcon: '🌟',
        catalyst:    'magnifier',    // 需要持有放大镜遗物
        evolvedDamage:  3,
        evolvedCooldown: 120
    },
    spread: {
        evolvedId:   'spread_nova',
        evolvedName: '超新星散弹',
        evolvedDesc: '九叉散射 + 爆炸弹头',
        evolvedIcon: '✨',
        catalyst:    'explosion_core',
        evolvedDamage:  2,
        evolvedCooldown: 250
    },
    homing: {
        evolvedId:   'homing_swarm',
        evolvedName: '蜂群追踪弹',
        evolvedDesc: '同时发射 4 枚追踪弹',
        evolvedIcon: '🌀',
        catalyst:    'rapid_coil',
        evolvedDamage:  2,
        evolvedCooldown: 300
    },
    laser: {
        evolvedId:   'laser_death',
        evolvedName: '死亡射线',
        evolvedDesc: '持续激光,伤害大幅提升',
        evolvedIcon: '☄',
        catalyst:    'piercing_lens',
        evolvedDamage: 5,
        evolvedCooldown: 1200
    },
    orbit: {
        evolvedId:   'orbit_storm',
        evolvedName: '轨道风暴',
        evolvedDesc: '6 个护盾球 + 伤害翻倍',
        evolvedIcon: '🌪',
        catalyst:    'shield_shard',
        evolvedDamage:  2,
        evolvedCooldown: 0
    },
    pulse: {
        evolvedId:   'pulse_quake',
        evolvedName: '地震脉冲',
        evolvedDesc: '双倍范围 + 双倍伤害',
        evolvedIcon: '🌋',
        catalyst:    'magnifier',
        evolvedDamage:  3,
        evolvedCooldown: 1800
    }
};
