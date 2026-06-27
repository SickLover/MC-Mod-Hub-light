/**
 * 版本号管理工具
 *
 * 用法:
 *   node scripts/bump-version.js             查看当前版本
 *   node scripts/bump-version.js patch       递增补丁号 (0.1.0 → 0.1.1)
 *   node scripts/bump-version.js minor       递增次版本号 (0.1.0 → 0.2.0)
 *   node scripts/bump-version.js major       递增大版本号 (0.1.0 → 1.0.0)
 *   node scripts/bump-version.js 0.2.0       指定具体版本
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// 读取 package.json 当前版本
const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const current = pkg.version;
const parts = current.split('.').map(Number);

let newVersion;

const arg = process.argv[2];
if (!arg) {
  console.log(`当前版本: ${current}`);
  process.exit(0);
}

if (/^\d+\.\d+\.\d+$/.test(arg)) {
  newVersion = arg;
} else if (arg === 'patch') {
  newVersion = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
} else if (arg === 'minor') {
  newVersion = `${parts[0]}.${parts[1] + 1}.0`;
} else if (arg === 'major') {
  newVersion = `${parts[0] + 1}.0.0`;
} else {
  console.error(`未知参数: ${arg}`);
  console.error('用法: patch | minor | major | 版本号(如 0.2.0)');
  process.exit(1);
}

// 1. 更新 package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`✅ package.json: ${current} → ${newVersion}`);

// 2. 更新 Cargo.toml
const cargoPath = path.join(ROOT, 'src-tauri', 'Cargo.toml');
let cargo = fs.readFileSync(cargoPath, 'utf8');
cargo = cargo.replace(/^version = ".*"/m, `version = "${newVersion}"`);
fs.writeFileSync(cargoPath, cargo);
console.log(`✅ Cargo.toml:   ${current} → ${newVersion}`);

// 3. 更新 tauri.conf.json
const confPath = path.join(ROOT, 'src-tauri', 'tauri.conf.json');
let conf = JSON.parse(fs.readFileSync(confPath, 'utf8'));
conf.version = newVersion;
fs.writeFileSync(confPath, JSON.stringify(conf, null, 2) + '\n');
console.log(`✅ tauri.conf.json: ${current} → ${newVersion}`);

console.log(`\n🎉 版本号已同步为 ${newVersion}`);
console.log(`👉 运行 npm run build:release 来构建安装包`);
