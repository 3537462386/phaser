/**
 * ENEMY_DATA — 敌人类型定义
 * normal: 普通      fast: 快速      heavy: 重型      elite: 精英
 */
const ENEMY_DATA = {
    normal: {
        id:            'normal',
        hp:            1,
        speedMin:      1.0,
        speedMax:      2.5,
        expValue:      1,
        contactDamage: 1,
        scale:         1.0,
        tint:          0xffffff,
        spawnWeight:   6,
        goldValue:     1
    },
    fast: {
        id:            'fast',
        hp:            1,
        speedMin:      3.0,
        speedMax:      5.5,
        expValue:      2,
        contactDamage: 1,
        scale:         0.75,
        tint:          0x88ffee,
        spawnWeight:   3,
        goldValue:     2
    },
    heavy: {
        id:            'heavy',
        hp:            3,
        speedMin:      0.6,
        speedMax:      1.3,
        expValue:      4,
        contactDamage: 2,
        scale:         1.4,
        tint:          0xff8844,
        spawnWeight:   2,
        goldValue:     3
    },
    elite: {
        id:            'elite',
        hp:            6,
        speedMin:      0.9,
        speedMax:      1.8,
        expValue:      10,
        contactDamage: 2,
        scale:         1.7,
        tint:          0xff4488,
        spawnWeight:   1,
        goldValue:     8
    },
    shooter: {
        id:            'shooter',
        hp:            1,
        speedMin:      0.6,
        speedMax:      1.2,
        expValue:      1,
        contactDamage: 1,
        scale:         1.0,
        tint:          0xffff44,
        spawnWeight:   2,
        goldValue:     1,
        fireInterval:  2000,     // 每 2 秒发射一颗子弹
        bulletSpeed:   3.5,      // 子弹速度
        bulletDamage:  1         // 子弹伤害
    },
    seeker: {
        id:            'seeker',
        hp:            1,
        speedMin:      3.0,
        speedMax:      5.5,
        expValue:      2,
        contactDamage: 1,
        scale:         0.75,
        tint:          0xff6644,
        spawnWeight:   2,
        goldValue:     2,
        turnRate:      0.03       // 每帧转向速率（弧度），越大越贴身
    }
};
