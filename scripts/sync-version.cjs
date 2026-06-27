/**
 * 同步版本号到所有配置文件
 * 用法: node scripts/sync-version.js <新版本号>
 * 示例: node scripts/sync-version.js 0.2.0
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const newVersion = process.argv[2];

if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('用法: node scripts/sync-version.js <版本号>');
  console.error('示例: node scripts/sync-version.js 0.2.0');
  process.exit(1);
}

// 1. 更新 package.json
const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`✅ package.json → ${newVersion}`);

// 2. 更新 Cargo.toml
const cargoPath = path.join(ROOT, 'src-tauri', 'Cargo.toml');
let cargo = fs.readFileSync(cargoPath, 'utf8');
cargo = cargo.replace(/^version = ".*"/m, `version = "${newVersion}"`);
fs.writeFileSync(cargoPath, cargo);
console.log(`✅ Cargo.toml → ${newVersion}`);

// 3. 更新 tauri.conf.json
const confPath = path.join(ROOT, 'src-tauri', 'tauri.conf.json');
let conf = JSON.parse(fs.readFileSync(confPath, 'utf8'));
conf.version = newVersion;
fs.writeFileSync(confPath, JSON.stringify(conf, null, 2) + '\n');
console.log(`✅ tauri.conf.json → ${newVersion}`);

console.log(`\n🎉 三个文件版本号已同步为 ${newVersion}`);
console.log(`👉 现在可以运行 npm run build:release 来构建安装包`);
