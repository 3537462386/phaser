# 太空射击 · Space Shooter

> 一款基于 **Phaser 3** 的肉鸽割草风格太空射击游戏，灵感来自《吸血鬼幸存者》。

---

## 游戏特色

- **角色选择**：开局从 3 名飞行员中挑选，各有不同的移速、血量和初始武器
- **6 种武器**：机炮、散弹、追踪弹、激光束、护盾球、脉冲波，可同时装备并逐级升级
- **经验 & 升级**：击杀敌人掉落经验球，经验球可被磁力吸引；升级后暂停并弹出 3 选 1 升级界面
- **波次系统**：随存活时间推进，自动解锁更多敌人类型（快速型、重型、精英）
- **完整 HUD**：HP 爱心、等级 / EXP 进度条、计时器、击杀计数、武器图标一览无遗
- **移动端支持**：键盘方向键 / WASD 控制，也支持触屏拖动

---

## 角色

| 图标 | 名称 | 特点 |
|------|------|------|
| ✈ | 均衡型 | 各项属性均衡，适合新手 |
| ⚡ | 疾速型 | 移速极快，血量较低 |
| 💥 | 重炮型 | 高伤害高血量，初始散弹，移速较慢 |

---

## 武器

| 图标 | 名称 | 说明 |
|------|------|------|
| 🔫 | 机炮 | 直线射击，冷却短；Lv2 升级为双排齐射 |
| 💨 | 散弹 | 三向扩散；Lv3 升级为五叉 |
| 🎯 | 追踪弹 | 自动追踪最近敌人 |
| ⚡ | 激光束 | 持续激光，高伤害 |
| 🔮 | 护盾球 | 围绕飞机旋转，接触即伤敌 |
| 💫 | 脉冲波 | 向四周扩散的环形冲击波 |

---

## 敌人类型

| 类型 | 特点 | 出现时机 |
|------|------|----------|
| 普通 | 基础敌人 | 全程 |
| 快速 | 移速快、体积小 | 120 秒后 |
| 重型 | HP 多、体积大 | 300 秒后 |
| 精英 | 高 HP 高经验值 | 300 秒后每 60 秒一次 |

---

## 操作说明

| 操作 | 说明 |
|------|------|
| ← → ↑ ↓ / WASD | 移动飞船 |
| 触屏拖动 | 移动端移动飞船 |
| 自动射击 | 武器自动开火，无需手动 |

---

## 技术栈

- [Phaser 3](https://phaser.io/) — 游戏框架（本地 `phaser.min.js`）
- 纯 JavaScript（无打包工具，直接浏览器运行）
- Arcade 物理引擎，对象池管理子弹与敌人

---

## 项目结构

```
index.html
phaser.min.js
images/
js/
├── core/
│   └── GameState.js          # 全局状态单例
├── data/
│   ├── CharacterData.js       # 角色定义
│   ├── WeaponData.js          # 武器定义
│   └── EnemyData.js           # 敌人类型定义
├── systems/
│   ├── LevelingSystem.js      # 经验/升级系统
│   ├── WaveManager.js         # 波次管理
│   └── UpgradeManager.js      # 升级选项生成
├── weapons/
│   └── WeaponManager.js       # 6种武器实现
├── items/
│   └── ItemManager.js         # 经验球掉落与拾取
├── ui/
│   ├── GameHUD.js             # 游戏内 HUD
│   └── UpgradePopup.js        # 升级选择弹窗
├── entities/
│   ├── Player.js              # 玩家飞机实体
│   └── EnemyManager.js        # 敌人管理器
├── scenes/
│   ├── BaseScene.js           # UI场景基类（星空/返回按钮）
│   ├── MenuScene.js           # 主菜单
│   ├── CharacterSelectScene.js# 角色选择
│   ├── GameScene.js           # 主游戏场景
│   ├── AchievementsScene.js   # 成就
│   └── SettingsScene.js       # 设置
└── main.js                    # Phaser.Game 配置入口
```

---

## 快速开始

用任意本地 HTTP 服务器打开 `index.html` 即可（直接双击打开因浏览器安全限制可能无法加载资源）。

```bash
# 使用 Python
python -m http.server 8080

# 或使用 VS Code Live Server 插件
```

然后浏览器访问 `http://localhost:8080`。
