/**
 * EVENT_DATA — 轮间随机事件定义
 *
 * 事件在每轮结束后的休整阶段之前触发，提供风险/收益决策。
 * 每个事件包含 2-3 个选择，每个选择有正面和/或负面效果。
 *
 * 分类：
 *   gamble  — 赌博（高收益高风险）
 *   trade   — 交易（确定性交换）
 *   mystery — 神秘（结果不确定）
 *   curse   — 诅咒（牺牲换力量）
 */
const EVENT_DATA = [
    {
        id:       'devil_deal',
        name:     '恶魔交易',
        desc:     '一个低沉的声音在你耳边回荡...',
        category: 'curse',
        icon:     '😈',
        options: [
            {
                label: '献出 2 HP 上限',
                desc:  '获得 40 金币',
                effect(snap, gameState) {
                    snap.maxHp = Math.max(1, snap.maxHp - 2);
                    snap.hp = Math.min(snap.hp, snap.maxHp);
                    gameState.gold += 40;
                }
            },
            {
                label: '拒绝交易',
                desc:  '什么也不发生',
                effect() {}
            }
        ]
    },
    {
        id:       'slot_machine',
        name:     '星际赌场',
        desc:     '投入金币试试运气？',
        category: 'gamble',
        icon:     '🎰',
        options: [
            {
                label: '投入 15 金币',
                desc:  '50% 翻倍, 50% 血本无归',
                effect(snap, gameState) {
                    gameState.gold -= 15;
                    if (Math.random() < 0.5) {
                        gameState.gold += 30;
                    }
                }
            },
            {
                label: '投入 30 金币',
                desc:  '33% 获得 3 倍, 67% 血本无归',
                effect(snap, gameState) {
                    gameState.gold -= 30;
                    if (Math.random() < 0.33) {
                        gameState.gold += 90;
                    }
                }
            },
            {
                label: '离开',
                desc:  '不冒险',
                effect() {}
            }
        ]
    },
    {
        id:       'mysterious_chest',
        name:     '神秘宝箱',
        desc:     '一个发光的箱子漂浮在虚空中...',
        category: 'mystery',
        icon:     '📦',
        options: [
            {
                label: '打开宝箱',
                desc:  '随机获得一件 tier 1 遗物 或 受到 1 点伤害',
                effect(snap, gameState, eventContext) {
                    if (Math.random() < 0.6) {
                        // 获得随机 tier 1 遗物
                        const pool = Object.values(PASSIVE_ITEM_DATA).filter(d => d.tier === 1);
                        if (pool.length > 0) {
                            const pick = pool[Math.floor(Math.random() * pool.length)];
                            if (eventContext && eventContext.acquireRelic) {
                                eventContext.acquireRelic(pick.id);
                            }
                        }
                    } else {
                        snap.hp = Math.max(1, snap.hp - 1);
                    }
                }
            },
            {
                label: '无视宝箱',
                desc:  '安全地离开',
                effect() {}
            }
        ]
    },
    {
        id:       'wandering_merchant',
        name:     '流浪商人',
        desc:     '"看看我的货,都是好东西!"',
        category: 'trade',
        icon:     '🧙',
        options: [
            {
                label: '买遗物 (25 金币)',
                desc:  '获得随机 tier 1 遗物',
                effect(snap, gameState, eventContext) {
                    if (gameState.gold >= 25) {
                        gameState.gold -= 25;
                        const pool = Object.values(PASSIVE_ITEM_DATA).filter(d => d.tier === 1);
                        if (pool.length > 0) {
                            const pick = pool[Math.floor(Math.random() * pool.length)];
                            if (eventContext && eventContext.acquireRelic) {
                                eventContext.acquireRelic(pick.id);
                            }
                        }
                    }
                }
            },
            {
                label: '卖 HP 换金币',
                desc:  'HP -1, 金币 +20',
                effect(snap, gameState) {
                    if (snap.hp > 1) {
                        snap.hp--;
                        gameState.gold += 20;
                    }
                }
            },
            {
                label: '离开',
                desc:  '不交易',
                effect() {}
            }
        ]
    },
    {
        id:       'energy_surge',
        name:     '能量涌动',
        desc:     '一股奇异的能量包裹了你...',
        category: 'mystery',
        icon:     '⚡',
        options: [
            {
                label: '吸收能量',
                desc:  '移速 +10% 但受伤 +1',
                effect(snap) {
                    snap.moveSpeed = Math.min(500, Math.floor(snap.moveSpeed * 1.10));
                    snap.extraDamage = (snap.extraDamage || 0) + 1;
                }
            },
            {
                label: '排斥能量',
                desc:  '武器冷却 -10%',
                effect(snap) {
                    snap.fireCooldown = Math.max(60, Math.floor(snap.fireCooldown * 0.90));
                }
            }
        ]
    },
    {
        id:       'ancient_ruins',
        name:     '古代遗迹',
        desc:     '古老的石碑上刻满了符文...',
        category: 'curse',
        icon:     '🏛',
        options: [
            {
                label: '读取符文',
                desc:  '随机获得一件 tier 2 遗物, HP -2',
                effect(snap, gameState, eventContext) {
                    snap.hp = Math.max(1, snap.hp - 2);
                    const pool = Object.values(PASSIVE_ITEM_DATA).filter(d => d.tier === 2);
                    if (pool.length > 0) {
                        const pick = pool[Math.floor(Math.random() * pool.length)];
                        if (eventContext && eventContext.acquireRelic) {
                            eventContext.acquireRelic(pick.id);
                        }
                    }
                }
            },
            {
                label: '离开遗迹',
                desc:  '什么也不发生',
                effect() {}
            }
        ]
    }
];

/**
 * EventManager — 轮间事件管理器
 */
class EventManager {
    constructor() {
        this._usedEvents = new Set();
    }

    reset() {
        this._usedEvents.clear();
    }

    /**
     * 随机抽取一个未使用的事件
     * @returns {object|null} 事件数据
     */
    drawEvent() {
        const available = EVENT_DATA.filter(e => !this._usedEvents.has(e.id));
        if (available.length === 0) {
            // 全部用完，重置
            this._usedEvents.clear();
            return EVENT_DATA[Math.floor(Math.random() * EVENT_DATA.length)];
        }
        const picked = available[Math.floor(Math.random() * available.length)];
        this._usedEvents.add(picked.id);
        return picked;
    }

    /**
     * 判断本轮是否应触发事件（非 Boss 轮时 50% 概率触发）
     * @param {number} round
     * @returns {boolean}
     */
    shouldTriggerEvent(round) {
        // Boss 轮不触发事件
        if (round % 5 === 0) return false;
        // 第 1 轮不触发
        if (round <= 1) return false;
        // 50% 概率
        return Math.random() < 0.5;
    }
}
