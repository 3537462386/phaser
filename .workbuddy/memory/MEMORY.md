# Phaser 太空射击 — 项目记忆

## 项目概况
- 类型：类吸血鬼幸存者肉鸽割草太空射击
- 技术栈：Phaser 3 + 纯JS + Arcade物理引擎
- 画布：500x700，对象池管理子弹与敌人

## 肉鸽系统架构 (2026-05-28 优化后)
- **3层循环**：战斗层(即时反馈) → 构建层(遗物/升级决策) → 节奏层(Boss/事件/商店)
- **遗物系统**：14种遗物，4类(攻击/防御/功能/诅咒)，可叠加，有协同标记
- **Boss系统**：3种Boss，每5轮出现，阶段2变化，稀有掉落
- **事件系统**：6种随机事件，50%触发，在商店之前
- **武器进化**：6种终极形态，需催化剂遗物+满级Lv3
- **升级系统**：遗物+进化+加权随机+协同优先

## 关键文件
- 遗物数据: js/data/PassiveItemData.js
- Boss数据: js/data/BossData.js
- 遗物管理器: js/items/PassiveItemManager.js
- Boss管理器: js/entities/BossManager.js
- 事件系统: js/systems/EventManager.js
- 武器进化: js/data/WeaponData.js → WEAPON_EVOLUTION

## 调优参数 [PLACEHOLDER]
- 遗物伤害加成 25%/层 | 护盾间隔 15s | 再生阈值 20杀
- 爆炸核心 30% | 事件触发 50% | Boss间隔 5轮

## 后续方向
- HUD遗物动画 | Boss血条优化 | 更多遗物(20+) | 更多事件(10+) | 成就联动 | 元进度
