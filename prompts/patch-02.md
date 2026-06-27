# 补丁 Prompt — 补充 Mod 加载器兼容性检查

> 基于 Step 10 后实测反馈：现有 CompatibilityCheck 仅检查游戏版本交集，缺少 Mod 加载器（Forge / Fabric / NeoForge / Quilt）兼容性检测。`categories` JSON 字段中已包含加载器数据但未被使用。

---

## 当前状态

- `CompatibilityCheck.tsx`（Step 6）仅做**游戏版本交集**检查
- `CollectionItem.categories` 存储为 JSON 字符串（如 `["Fabric","Forge","NeoForge"]`），数据已有但未解析

## 修复目标

扩展 `CompatibilityCheck` 为**三栏布局**：游戏版本兼容 + 加载器兼容 + 各资源详情。

---

## 修改文件

```
src/components/collection/CompatibilityCheck.tsx  — 唯一需改的文件
```

---

## 改动内容

### 替换现有 CompatibilityCheck

```tsx
import type { CollectionItem } from '@/types';

interface Props {
  selectedItems: CollectionItem[];
}

// 常见 Mod 加载器关键词
const LOADER_KEYWORDS = ['forge', 'fabric', 'neoforge', 'quilt', 'rift', 'liteloader'];

export default function CompatibilityCheck({ selectedItems }: Props) {
  if (selectedItems.length < 2) return null;

  // 1. 解析游戏版本
  const allVersions = selectedItems.map(item => {
    try { return JSON.parse(item.gameVersions) as string[]; }
    catch { return []; }
  });

  // 2. 解析 categories 中的加载器信息
  const allCategories = selectedItems.map(item => {
    try { return JSON.parse(item.categories) as string[]; }
    catch { return []; }
  });

  // 提取加载器
  const allLoaders = allCategories.map(cats =>
    cats.filter(c => LOADER_KEYWORDS.some(kw => c.toLowerCase().includes(kw)))
         .map(c => {
           const lower = c.toLowerCase();
           if (lower.includes('forge')) return lower.includes('neo') ? 'NeoForge' : 'Forge';
           if (lower.includes('fabric')) return 'Fabric';
           if (lower.includes('quilt')) return 'Quilt';
           if (lower.includes('rift')) return 'Rift';
           if (lower.includes('liteloader')) return 'LiteLoader';
           return c;
         })
  );

  // 3. 计算交集
  const versionIntersection = allVersions.reduce((acc, vers) =>
    acc.filter(v => vers.includes(v))
  );

  const loaderIntersection = allLoaders.reduce((acc, loaders) =>
    acc.filter(l => loaders.includes(l))
  );

  return (
    <div className="space-y-3 p-4 bg-mc-card rounded-mc border border-white/5">
      <h4 className="text-sm font-medium text-mc-text">兼容性检测</h4>

      {/* 三栏布局 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 左栏：游戏版本兼容 */}
        <div>
          <h5 className="text-xs text-mc-muted mb-2">游戏版本</h5>
          <div className="flex flex-wrap gap-1">
            {versionIntersection.length > 0
              ? versionIntersection.map(v => (
                  <span key={v}
                    className="text-xs px-2 py-0.5 rounded-full bg-mc-green/10 text-mc-green font-medium">
                    {v}
                  </span>
                ))
              : <span className="text-red-400 text-sm">无交集</span>
            }
          </div>
        </div>

        {/* 中栏：加载器兼容 */}
        <div>
          <h5 className="text-xs text-mc-muted mb-2">加载器</h5>
          <div className="flex flex-wrap gap-1">
            {loaderIntersection.length > 0
              ? loaderIntersection.map(l => (
                  <span key={l}
                    className="text-xs px-2 py-0.5 rounded-full bg-mc-green/10 text-mc-green font-medium">
                    {l}
                  </span>
                ))
              : <span className="text-red-400 text-sm">无交集</span>
            }
          </div>
        </div>

        {/* 右栏：各资源详情 */}
        <div>
          <h5 className="text-xs text-mc-muted mb-2">各资源</h5>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {selectedItems.map((item, i) => {
              const versions = allVersions[i];
              const loaders = allLoaders[i];
              const hasVersionConflict = versionIntersection.length > 0
                && !versions.some(v => versionIntersection.includes(v));
              const hasLoaderConflict = loaderIntersection.length > 0
                && !loaders.some(l => loaderIntersection.includes(l));

              return (
                <div key={item.id} className="text-xs">
                  <span className="text-mc-text">{item.name}</span>
                  <div className="text-mc-muted flex flex-wrap gap-x-2">
                    <span>版本: {versions.length > 0 ? versions.join(', ') : '-'}</span>
                    <span>加载器: {loaders.length > 0 ? loaders.join(', ') : '未知'}</span>
                  </div>
                  {(hasVersionConflict || hasLoaderConflict) && (
                    <div className="text-red-400 mt-0.5">
                      {hasVersionConflict && '⚠️ 版本冲突 '}
                      {hasLoaderConflict && '⚠️ 加载器冲突'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 底部警告 */}
      {(versionIntersection.length === 0 || loaderIntersection.length === 0) && selectedItems.length > 0 && (
        <div className="mt-2 p-2 bg-red-400/10 border border-red-400/20 rounded-md">
          <p className="text-xs text-red-400">
            {versionIntersection.length === 0 && '⚠️ 选中的资源没有兼容的游戏版本。'}
            {versionIntersection.length === 0 && loaderIntersection.length === 0 && ' '}
            {loaderIntersection.length === 0 && '⚠️ 选中资源需要不同的加载器（Forge/Fabric/等），可能无法同时使用。'}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 改动要点

| 改动 | 说明 |
|------|------|
| 新增加载器解析 | 从 `categories` JSON 中提取 Forge/Fabric/NeoForge/Quilt 等 |
| 二栏 → 三栏 | 游戏版本 / 加载器 / 各资源详情 |
| 加载器交集 | 与版本交集相同的 reduce-filter 逻辑 |
| 冲突警告 | 版本冲突 + 加载器冲突分别标红 |
| 底部汇总警告 | 无兼容版本或加载器时显示完整警告文字 |

---

## 验证

```bash
npx tsc --noEmit
npm run tauri dev
```

**验证清单**：
- [ ] 收藏夹详情页勾选 ≥2 个资源 → CompatibilityCheck 显示三栏
- [ ] 左栏显示兼容的游戏版本
- [ ] 中栏显示兼容的加载器
- [ ] 右栏显示各资源的版本 + 加载器详情
- [ ] 版本/加载器有冲突时对应资源标红 ⚠️
- [ ] 无兼容加载器时底部显示警告

---

## 约束

- ❌ 不改数据库表结构
- ❌ 不改 Rust 端任何代码
- ❌ 不改其他组件
- ✅ 只改 `CompatibilityCheck.tsx` 一个文件

**本补丁只补充加载器兼容性检查，不做其他功能。**
