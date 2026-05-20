/**
 * CHARACTER_DATA — 角色定义列表
 */
const CHARACTER_DATA = [
    {
        id:          'balanced',
        name:        '均衡型',
        description: '各项属性均衡，适合新手',
        speed:       280,
        maxHp:       3,
        fireCooldown:200,
        startWeapon: 'gun',
        tint:        0xffffff,
        icon:        '✈'
    },
    {
        id:          'swift',
        name:        '疾速型',
        description: '移速极快，但血量较低，适合走位',
        speed:       380,
        maxHp:       2,
        fireCooldown:180,
        startWeapon: 'gun',
        tint:        0x88ffcc,
        icon:        '⚡'
    },
    {
        id:          'heavy',
        name:        '重炮型',
        description: '高伤害高血量，移速较慢',
        speed:       190,
        maxHp:       5,
        fireCooldown:320,
        startWeapon: 'spread',
        tint:        0xff8844,
        icon:        '💥'
    }
];
