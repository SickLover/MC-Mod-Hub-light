import type { CollectionItem, ModFile } from '@/types';

interface Props {
  /// 所有已选资源，未选版本的 file 为 undefined
  items: { item: CollectionItem; file?: ModFile }[];
}

export default function CompatibilityCheck({ items }: Props) {
  if (items.length < 2) return null;

  const hasVersion = items.filter(i => i.file);
  const noVersion = items.filter(i => !i.file);

  // 使用已选文件的精确数据做兼容性计算
  const parsed = hasVersion.map(({ item, file }) => ({
    item,
    versions: file!.gameVersions,
    loaders: file!.modLoaders,
  }));

  // 计算交集
  const versionIntersection = parsed.length > 0
    ? parsed.map(p => p.versions).reduce((acc, v) => acc.filter(x => v.includes(x)))
    : [];
  const loaderIntersection = parsed.length > 0
    ? parsed.map(p => p.loaders).reduce((acc, l) => acc.filter(x => l.includes(x)))
    : [];

  const versionOk = versionIntersection.length > 0;
  const loaderOk = parsed.length === 0 || loaderIntersection.length > 0 || parsed.every(p => p.loaders.length === 0);
  const allOk = noVersion.length === 0 && versionOk && loaderOk;

  const statusLine = (() => {
    if (noVersion.length > 0 && parsed.length === 0) {
      return '请为已选资源选择游戏版本';
    }
    if (noVersion.length > 0) {
      return `部分兼容性检测通过 — ${noVersion.length} 个资源未选择版本`;
    }
    if (allOk) return '兼容性检测通过';
    return '兼容性检测发现问题';
  })();

  const statusIcon = noVersion.length > 0 && parsed.length === 0 ? 'ℹ️'
    : allOk ? '✅'
    : '⚠️';

  return (
    <div className={`rounded-mc border p-4 ${
      allOk ? 'bg-mc-green/5 border-mc-green/20' : 'bg-red-400/5 border-red-400/20'
    }`}>
      {/* 顶部摘要 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{statusIcon}</span>
        <h4 className="text-sm font-medium text-mc-text">{statusLine}</h4>
        <span className="text-xs text-mc-muted">({items.length} 个资源)</span>
      </div>

      {/* 兼容版本 + 兼容加载器（仅当有已选版本时显示） */}
      {parsed.length > 0 && (
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
      )}

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
          {/* 已选版本的资源 */}
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
                <td className="py-1.5 text-center">{ok ? '✅' : '❌'}</td>
              </tr>
            );
          })}

          {/* 未选版本的资源 */}
          {noVersion.map(({ item }) => (
            <tr key={item.id} className="border-b border-white/5 last:border-0">
              <td className="py-1.5 text-mc-text max-w-40 truncate pr-2" title={item.name}>
                {item.name}
              </td>
              <td className="py-1.5 text-yellow-400" colSpan={2}>
                ⚠️ 请为 {item.name} 选择游戏版本
              </td>
              <td className="py-1.5 text-center text-yellow-400">⏳</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 底部警告 */}
      {noVersion.length > 0 && (
        <div className="mt-3 p-2 bg-yellow-400/10 border border-yellow-400/20 rounded-md text-xs text-yellow-400">
          ⚠️ 以下资源未选择游戏版本：{noVersion.map(i => i.item.name).join('、')}
          。请为每个资源选择具体版本以进行完整兼容性检测。
        </div>
      )}
      {noVersion.length === 0 && !allOk && (
        <div className="mt-3 p-2 bg-red-400/10 border border-red-400/20 rounded-md text-xs text-red-400">
          {!versionOk && '⚠️ 选中资源没有共同的游戏版本，无法一起加载。'}
          {!versionOk && !loaderOk && <br />}
          {!loaderOk && '⚠️ 选中资源需要不同的模组加载器（Forge / Fabric 等），无法同时使用。'}
        </div>
      )}
    </div>
  );
}
