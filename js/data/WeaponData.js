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
