---
name: space-game-engine-optimization
overview: 基于 game-engine 技能对太空射击游戏进行全面性能优化，包括对象池化、Delta Time 统一、HUD 渲染缓存、碰撞检测降频等核心优化。
todos:
  - id: hud-icon-cache
    content: 重构 GameHUD 武器/遗物图标为缓存模式，消除每帧重建
    status: pending
  - id: gfx-object-pool
    content: 创建 Graphics 通用对象池并替换经验球、追踪弹、护盾球、脉冲波、爆炸特效的临时创建逻辑
    status: pending
  - id: delta-time-global
    content: 全局引入 Delta Time 缩放：EnemyManager、ItemManager、背景滚动、所有武器系统
    status: pending
    dependencies:
      - hud-icon-cache
  - id: weapon-collision-opt
    content: 优化武器碰撞检测：HomingWeapon 改为物理 overlap，Laser/Orbit/Pulse 引入帧分摊策略
    status: pending
    dependencies:
      - gfx-object-pool
  - id: timer-cleanup
    content: 清理 Player 定时器堆积，改为组级子弹越界回收
    status: pending
---

## 产品概述

使用 game-engine 技能对当前 Phaser 3 太空射击游戏进行系统性性能与架构优化，解决已发现的五大类性能瓶颈，确保游戏在各类设备上稳定 60fps 运行。

## 核心问题

1. **HUD 每帧重建图标**：`_updateWeaponIcons` / `_updateRelicIcons` 在 `update()` 中每帧 `removeAll(true)` 并重新创建全部 Text 对象，造成大量 GC 和 Canvas 重排开销。
2. **Graphics 对象频繁创建/销毁**：经验球、追踪弹、护盾球、脉冲波、爆炸特效均使用临时 Graphics，高频率的 `add.graphics()` / `destroy()` 导致内存抖动和渲染管线重建。
3. **缺少 Delta Time 缩放**：敌人移动、磁力吸引、护盾旋转、脉冲扩张、背景滚动全部使用固定像素/角度增量，低帧率下游戏整体变慢。
4. **碰撞检测全量遍历**：激光束、护盾球、脉冲波、追踪弹每帧遍历全部活跃敌人做距离检测，时间复杂度 O(n×m)。
5. **定时器堆积**：`Player._fire` 中为每颗子弹注册独立 `delayedCall(3000)` 兜底回收，高射速下定时器数量爆炸。

## Tech Stack

- 框架：Phaser 3 (Arcade Physics)
- 语言：原生 JavaScript (ES Module)
- 渲染：Canvas / WebGL (Phaser.AUTO)

## Implementation Approach

### 1. HUD 图标缓存化

- 将 `_updateWeaponIcons` / `_updateRelicIcons` 从"每帧全量销毁重建"改为"差异更新"模式。
- 创建时预分配固定数量 Text 对象池，更新时仅修改可见性、位置、文本内容；武器/遗物数量变化时才增减对象。
- 引入 `_lastWeaponHash` / `_lastRelicHash` 做脏检测，避免无意义的 DOM/Canvas 操作。

### 2. Graphics 统一对象池

- 为所有特效建立独立对象池（`ExpOrbPool`、`HomingBulletPool`、`OrbitShieldPool`、`PulseWavePool`、`ExplosionGfxPool`）。
- 每个池子使用 `Phaser.GameObjects.Graphics` 的 `setActive(false).setVisible(false)` 进行回收，而非 `destroy()`。
- 对象池封装为可复用的 `GraphicsPool` 工具类，提供 `get()` / `release()` 接口。

### 3. 全局 Delta Time 规范化

- `GameScene.update(time, delta)` 已提供 `delta`，计算 `deltaSec = delta / 1000`。
- `EnemyManager.update(deltaSec)`：敌人移动 `enemy.y += enemy.speed * deltaSec * 60`（以 60fps 为基准）。
- `ItemManager.update(deltaSec)`：磁力吸引速度乘以 `deltaSec * 60`。
- `WeaponManager.update(time, deltaSec, enemyGroup)`：所有武器更新签名统一接收 `deltaSec`。
- `OrbitWeapon` 角速度、 `PulseWeapon` 扩张速度、背景滚动均按 `deltaSec` 缩放。

### 4. 武器碰撞检测优化

- **GunWeapon / SpreadWeapon**：已有 Phaser 物理 Group，保持 `physics.add.overlap` 不变（最佳）。
- **HomingWeapon**：将手动距离碰撞改为发射时把追踪弹加入一个物理 Group，复用 `overlap` 检测；移除 `enemyGroup.children.iterate` 内层遍历。
- **LaserWeapon / OrbitWeapon / PulseWeapon**：引入"空间分区 + 帧分摊"策略——每帧只检测敌人总数的 1/3（按敌人数组索引取模），3 帧完成一轮完整检测；Boss 对象始终每帧检测。大幅降低单次 update 的 CPU 占用。

### 5. 定时器清理与子弹回收

- 移除 `Player._fire` 中的 `time.delayedCall(3000, ...)` 兜底逻辑。
- 改为 `Player.update(time, deltaSec)` 中每帧遍历子弹池，检查 `bullet.y < -20` 时 `setActive(false).setVisible(false)`，与 GunWeapon/SpreadWeapon 的回收模式一致。
- 移除不再需要的 `time.addEvent` / `delayedCall` 引用，降低 TimerEvent 队列压力。

### 6. 架构可扩展性

- 新增 `js/core/ObjectPool.js` 通用对象池工具类，支持 Graphics 和 Sprite 两种模式。
- 新增 `js/core/TimeScale.js` 单例，集中管理全局时间缩放系数（便于后续做暂停/加速/减速效果）。
- 所有修改保持向后兼容，不破坏现有场景切换、快照保存/恢复逻辑。

## Architecture Design

```
GameScene.update()
  ├── deltaSec = delta / 1000
  ├── bg.tilePositionY += scrollSpeed * deltaSec * 60
  ├── player.update(time, deltaSec)
  ├── weaponManager.update(time, deltaSec, enemyGroup)
  │   ├── GunWeapon (对象池 overlap)
  │   ├── SpreadWeapon (对象池 overlap)
  │   ├── HomingWeapon (对象池 + 帧分摊 overlap)
  │   ├── LaserWeapon (空间分区帧分摊)
  │   ├── OrbitWeapon (空间分区帧分摊)
  │   └── PulseWeapon (空间分区帧分摊)
  ├── enemyManager.update(deltaSec)
  ├── itemManager.update(playerSprite, deltaSec)
  ├── passiveItemManager.update(time, delta)
  ├── bossManager.update(time, delta)
  └── hud.update(data)  // 脏检测 + 缓存图标
```

## Directory Structure Summary

```
js/
├── core/
│   └── ObjectPool.js          # [NEW] Graphics/Sprite 通用对象池
├── ui/
│   └── GameHUD.js             # [MODIFY] 图标缓存化、脏检测
├── items/
│   └── ItemManager.js         # [MODIFY] Graphics 对象池、deltaTime
├── weapons/
│   └── WeaponManager.js       # [MODIFY] 全武器 deltaTime、碰撞优化、Graphics 池化
├── entities/
│   ├── Player.js              # [MODIFY] 移除 per-bullet 定时器，组级回收
│   └── EnemyManager.js        # [MODIFY] deltaTime 缩放
└── scenes/
    └── GameScene.js           # [MODIFY] 背景滚动 deltaTime、对象池初始化
```

## Implementation Notes

- **Performance Hot Path**：`GameHUD.update()` 是最高频调用点，优先完成图标缓存化。
- **Blast Radius Control**：所有武器 `update()` 签名从 `update(time, enemyGroup)` 改为 `update(time, deltaSec, enemyGroup)`，需同步修改 `WeaponManager.update()` 调用处和 `GameScene.update()`。
- **帧分摊安全性**：空间分区帧分摊策略对 LaserWeapon 等持续伤害武器，分摊后单次伤害需乘以 3 以保持 DPS 不变；或采用"每帧检测 1/3 敌人，命中时记录 hitCooldown"的方式。
- **对象池容量**：经验球池容量设为 30，追踪弹 20，护盾球 6，脉冲波 5，爆炸特效 10，均按游戏峰值并发量预留。

## Agent Extensions

### Skill

- **game-engine**
- Purpose: 提供 Phaser 3 性能优化最佳实践指导，包括对象池模式、delta time 规范化、碰撞检测优化策略、渲染管线调优等
- Expected outcome: 确保所有优化手段符合游戏引擎设计原则，避免引入反模式

### SubAgent

- **code-explorer**
- Purpose: 在修改过程中快速定位跨文件引用和调用链，验证方法签名变更的完整性
- Expected outcome: 确保 WeaponManager.update() 签名变更后，所有调用点同步更新，无遗漏