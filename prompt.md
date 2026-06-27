# 补丁 Prompt — 兼容性检测优化 + 加载器筛选修复

> 基于实测反馈，修复两个问题：
> 1. CompatibilityCheck 显示不够直观
> 2. VersionSelector 缺少加载器筛选（选 Fabric 时仍出现 NeoForge 版本）

---

## 问题定位

### 问题 2：加载器筛选缺失（根因）

`VersionSelector` 当前**只有游戏版本筛选 chips**，没有加载器筛选。文件行底部的 Fabric/Forge/NeoForge 标签**只是显示标签，不可点击筛选**。用户看到这些标签以为可以筛选，但实际上不行。

### 问题 1：兼容性检测不够直观

当前三栏纯文字布局，缺少一目了然的 ✅/❌ 兼容状态指示。

---

## 修改文件（2 个）

```
src/components/resource/VersionSelector.tsx          — 问题 2：加加载器筛选 chips
src/components/collection/CompatibilityCheck.tsx     — 问题 1：改进为清晰布局
```

---

## 改动 1 — VersionSelector：加加载器筛选

**改动点**：在现有游戏版本筛选 chips 下方，增加一行加载器筛选 chips。

```tsx
// 在组件内新增 state：
const [filterLoader, setFilterLoader] = useState<string | null>(null);

// 收集所有去重的加载器
const allLoaders = useMemo(() => {
  const set = new Set<string>();
  files.forEach((f) => f.modLoaders.forEach((l) => set.add(l)));
  return Array.from(set);
}, [files]);

// 筛选逻辑改为同时按版本 + 加载器过滤：
const filteredFiles = useMemo(() => {
  let result = files;
  if (filterGameVersion) {
    result = result.filter((f) => f.gameVersions.includes(filterGameVersion));
  }
  if (filterLoader) {
    const lower = filterLoader.toLowerCase();
    result = result.filter((f) =>
      f.modLoaders.some((l) => l.toLowerCase() === lower)
    );
  }
  return result;
}, [files, filterGameVersion, filterLoader]);
```

**新增 UI**（在游戏版本 chips 的 `</div>` 之后、文件列表之前）：

```tsx
{/* 加载器筛选 chips */}
{allLoaders.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-4">
    <button
      onClick={() => setFilterLoader(null)}
      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
        !filterLoader
          ? 'bg-mc-green/15 text-mc-green-light border border-mc-green/20'
          : 'bg-mc-card text-mc-muted border border-white/5 hover:text-mc-text'
      }`}
    >
      全部加载器
    </button>
    {allLoaders.map((loader) => (
      <button
        key={loader}
        onClick={() => setFilterLoader(loader === filterLoader ? null : loader)}
        className={`px-3 py-1 text-xs rounded-full transition-all duration-200 capitalize ${
          filterLoader === loader
            ? 'bg-mc-green/15 text-mc-green-light border border-mc-green/20'
            : 'bg-mc-card text-mc-muted border border-white/5 hover:text-mc-text'
        }`}
      >
        {loader}
      </button>
    ))}
  </div>
)}
```

**注意**：将原来的 `filteredFiles` 从 `const` 改为 `useMemo`（因为现在依赖两个 filter）。

---

## 改动 2 — CompatibilityCheck：清晰直观布局

**改为表格式布局 + ✅/❌ 图标**：

```tsx
import type { CollectionItem } from '@/types';

interface Props {
  selectedItems: CollectionItem[];
}

const LOADER_KEYWORDS = ['forge', 'fabric', 'neoforge', 'quilt', 'rift', 'liteloader'];

export default function CompatibilityCheck({ selectedItems }: Props) {
  if (selectedItems.length < 2) return null;

  // 解析版本和加载器
  const parsed = selectedItems.map(item => {
    let versions: string[] = [];
    let categories: string[] = [];
    try { versions = JSON.parse(item.gameVersions); } catch {}
    try { categories = JSON.parse(item.categories); } catch {}
    const loaders = categories
      .filter(c => LOADER_KEYWORDS.some(kw => c.toLowerCase().includes(kw)))
      .map(c => {
        const lower = c.toLowerCase();
        if (lower.includes('forge')) return lower.includes('neo') ? 'NeoForge' : 'Forge';
        if (lower.includes('fabric')) return 'Fabric';
        if (lower.includes('quilt')) return 'Quilt';
        return c;
      });
    return { item, versions, loaders };
  });

  // 计算交集
  const versionIntersection = parsed
    .map(p => p.versions)
    .reduce((acc, v) => acc.filter(x => v.includes(x)));
  const loaderIntersection = parsed
    .map(p => p.loaders)
    .reduce((acc, l) => acc.filter(x => l.includes(x)));

  const versionOk = versionIntersection.length > 0;
  const loaderOk = loaderIntersection.length > 0 || parsed.every(p => p.loaders.length === 0);
  const allOk = versionOk && loaderOk;

  return (
    <div className={`rounded-mc border p-4 ${
      allOk ? 'bg-mc-green/5 border-mc-green/20' : 'bg-red-400/5 border-red-400/20'
    }`}>
      {/* 顶部摘要 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{allOk ? '✅' : '⚠️'}</span>
        <h4 className="text-sm font-medium text-mc-text">
          {allOk ? '兼容性检测通过' : '兼容性检测发现问题'}
        </h4>
        <span className="text-xs text-mc-muted">
          ({selectedItems.length} 个资源)
        </span>
      </div>

      {/* 兼容版本 + 兼容加载器 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-xs text-mc-muted">兼容游戏版本</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {versionOk ? versionIntersection.slice(0, 8).map(v => (
              <span key={v} className="text-xs px-2 py-0.5 rounded-full bg-mc-green/15 text-mc-green-light">
                {v}
              </span>
            )) : <span className="text-xs text-red-400">无兼容版本</span>}
          </div>
        </div>
        <div>
          <span className="text-xs text-mc-muted">兼容加载器</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {loaderOk && loaderIntersection.length > 0
              ? loaderIntersection.map(l => (
                  <span key={l} className="text-xs px-2 py-0.5 rounded-full bg-mc-green/15 text-mc-green-light">
                    {l}
                  </span>
                ))
              : loaderOk
                ? <span className="text-xs text-mc-muted">不涉及加载器</span>
                : <span className="text-xs text-red-400">无兼容加载器</span>
            }
          </div>
        </div>
      </div>

      {/* 各资源详情表 */}
      <table className="w-full text-xs">
        <thead>
          <tr className="text-mc-muted border-b border-white/5">
            <th className="text-left py-1.5 font-normal">资源</th>
            <th className="text-left py-1.5 font-normal">版本</th>
            <th className="text-left py-1.5 font-normal">加载器</th>
            <th className="text-center py-1.5 font-normal w-10">状态</th>
          </tr>
        </thead>
        <tbody>
          {parsed.map(({ item, versions, loaders }) => {
            const vMatch = !versionOk || versions.some(v => versionIntersection.includes(v));
            const lMatch = !loaderOk || loaderIntersection.length === 0
              || loaders.some(l => loaderIntersection.includes(l));
            const ok = vMatch && lMatch;

            return (
              <tr key={item.id} className="border-b border-white/5 last:border-0">
                <td className="py-1.5 text-mc-text max-w-40 truncate pr-2" title={item.name}>
                  {item.name}
                </td>
                <td className="py-1.5 text-mc-muted">
                  {versions.length > 0 ? versions.join(', ') : '-'}
                </td>
                <td className="py-1.5 text-mc-muted">
                  {loaders.length > 0 ? loaders.join(', ') : '未知'}
                </td>
                <td className="py-1.5 text-center">
                  {ok ? '✅' : '❌'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 底部警告 */}
      {!allOk && (
        <div className="mt-3 p-2 bg-red-400/10 border border-red-400/20 rounded-md text-xs text-red-400">
          {!versionOk && '⚠️ 选中资源没有共同的游戏版本，无法一起加载。'}
          {!versionOk && !loaderOk && <br />}
          {!loaderOk && '⚠️ 选中资源需要不同的模组加载器（Forge / Fabric 等），无法同时使用。'}
        </div>
      )}
    </div>
  );
}
```

---

## 改动对比

| 文件 | 改动 | 行数变化 |
|------|------|---------|
| `VersionSelector.tsx` | 加 `filterLoader` state + `allLoaders` memo + 加载器 chips UI + `filteredFiles` 改用 `useMemo` | ~+30 行 |
| `CompatibilityCheck.tsx` | 全面重写：绿/红边框状态、✅/❌ 表格、清晰摘要 | 重写（~120 行） |

---

## 验证

```bash
npx tsc --noEmit
npm run tauri dev
```

**验证清单**：
- [ ] 资源详情页 → VersionSelector 出现加载器筛选 chips（Fabric/Forge/NeoForge 等）
- [ ] 点击 Fabric chip → 文件列表只显示含 Fabric 的版本
- [ ] 同时选游戏版本 + 加载器 → 两个条件叠加筛选
- [ ] 点击"全部加载器" → 取消加载器筛选
- [ ] 收藏夹详情页勾选 ≥2 个资源 → CompatibilityCheck 显示绿色边框 ✅
- [ ] 选不兼容的资源 → 红色边框 ⚠️ + ❌ 标记 + 底部警告
- [ ] 表格清晰显示每个资源的版本/加载器/兼容状态

---

## 约束

- ❌ 不改数据库 / Rust 端
- ❌ 不改其他组件
- ✅ 只改 2 个文件

**本补丁只修复这两个问题。**
