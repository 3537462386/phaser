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
        spawnWeight:   6
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
        spawnWeight:   3
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
        spawnWeight:   2
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
        spawnWeight:   1
    }
};
