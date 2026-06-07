#!/usr/bin/env node

import fs from 'node:fs/promises';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import pc from 'picocolors';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { execSync, spawn, exec } from 'node:child_process';
import readline from 'node:readline';

if (isMainThread) {
  process.stdout.write('\x1B[?25l');
  process.on('exit', () => process.stdout.write('\x1B[?25h'));
  process.on('SIGINT', () => process.exit(0));
}

const CONFIG_PATH = path.join(os.homedir(), '.dtmpc.json');

const locales = {
  'en-US': {
    langName: 'English',
    mainMenu: 'Select Clean Option:',
    settings: 'Project:',
    projMode: 'Project Cache Mode',
    genMode: 'General Cache Mode',
    github: 'GitHub Repository',
    langSwitch: 'Language',
    scanStart: 'Scanning directories...',
    scanSkip: 'Skipping size calculation...',
    scanCalc: 'Calculating size (Esc to skip):',
    noCache: 'No cache found',
    delProjTitle: 'Select directories to delete:',
    delGenTitle: 'Select general cache items to clean:',
    hint: '- Space to select, Enter to confirm, Up/Down to navigate',
    noSel: 'No items selected, exiting.',
    delItem: 'Deleted: {0} ({1})',
    delFail: 'Failed to delete {0}: {1}',
    summary: '\nDeleted {0} items, freed {1} space.\n',
    bbFail: 'Cannot run BleachBit backend. Ensure Python is installed.',
    bbFetch: 'Fetching general cache items...',
    confirm: 'Confirm'
  },
  'ja-JP': {
    langName: '日本語',
    mainMenu: 'クリーンアップオプションを選択:',
    settings: 'プロジェクト:',
    projMode: 'プロジェクトキャッシュモード',
    genMode: '一般キャッシュモード',
    github: 'GitHub リポジトリ',
    langSwitch: '言語設定',
    scanStart: 'ディレクトリをスキャン中...',
    scanSkip: 'サイズ計算をスキップ中...',
    scanCalc: 'サイズを計算中 (Escでスキップ):',
    noCache: 'キャッシュが見つかりません',
    delProjTitle: '削除するディレクトリを選択:',
    delGenTitle: 'クリーンアップする一般キャッシュを選択:',
    hint: '- Spaceで選択、Enterで確認、上下キーで移動',
    noSel: '何も選択されていません。終了します。',
    delItem: '削除済: {0} ({1})',
    delFail: '削除失敗 {0}: {1}',
    summary: '\n{0} 個の項目を削除し、{1} のディスク領域を解放しました。\n',
    bbFail: 'BleachBitバックエンドを実行できません。Pythonがインストールされているか確認してください。',
    bbFetch: '一般キャッシュ項目を取得中...',
    confirm: '確認'
  },
  'ko-KR': {
    langName: '한국어',
    mainMenu: '정리 옵션 선택:',
    settings: '프로젝트:',
    projMode: '프로젝트 캐시 모드',
    genMode: '일반 캐시 모드',
    github: 'GitHub 저장소',
    langSwitch: '언어 변경',
    scanStart: '디렉토리 스캔 중...',
    scanSkip: '크기 계산 건너뛰는 중...',
    scanCalc: '크기 계산 중 (Esc로 건너뛰기):',
    noCache: '캐시를 찾을 수 없습니다',
    delProjTitle: '삭제할 디렉토리 선택:',
    delGenTitle: '정리할 일반 캐시 항목 선택:',
    hint: '- Space로 선택, Enter로 확인, 위/아래 키로 이동',
    noSel: '선택된 항목이 없습니다. 종료합니다.',
    delItem: '삭제됨: {0} ({1})',
    delFail: '삭제 실패 {0}: {1}',
    summary: '\n{0}개 항목 삭제됨, {1} 디스크 공간 확보.\n',
    bbFail: 'BleachBit 백엔드를 실행할 수 없습니다. Python이 설치되어 있는지 확인하세요.',
    bbFetch: '일반 캐시 항목을 가져오는 중...',
    confirm: '확인'
  },
  'zh-TW': {
    langName: '繁體中文',
    mainMenu: '請選擇清理選項:',
    settings: '專案:',
    projMode: '專案快取模式',
    genMode: '通用快取模式',
    github: 'GitHub 倉庫',
    langSwitch: '切換顯示語言',
    scanStart: '正在掃描目錄...',
    scanSkip: '正在跳過大小計算...',
    scanCalc: '正在計算大小 (按 Esc 跳過):',
    noCache: '沒有發現快取',
    delProjTitle: '請選擇要刪除的目錄:',
    delGenTitle: '請選擇要清理的通用快取項:',
    hint: '- 按空格鍵選擇，按回車鍵確認，上下鍵移動',
    noSel: '未選擇任何項目，程式退出。',
    delItem: '已刪除: {0} ({1})',
    delFail: '無法刪除 {0}: {1}',
    summary: '\n共刪除了 {0} 個項目，釋放了 {1} 的磁碟空間。\n',
    bbFail: '無法運行 BleachBit 後端。請確保 Python 已安裝且 bleachbit 目錄存在。',
    bbFetch: '正在獲取通用快取清理項...',
    confirm: '確認'
  },
  'zh-CN': {
    langName: '简体中文',
    mainMenu: '请选择清理选项:',
    settings: '项目:',
    projMode: '项目缓存模式',
    genMode: '通用缓存模式',
    github: 'GitHub 仓库',
    langSwitch: '切换显示语言',
    scanStart: '正在扫描目录...',
    scanSkip: '正在跳过大小计算...',
    scanCalc: '正在计算大小 (按 Esc 跳过):',
    noCache: '没有发现缓存',
    delProjTitle: '请选择要删除的目录:',
    delGenTitle: '请选择要清理的通用缓存项:',
    hint: '- 按空格键选择，按回车键确认，上下键移动',
    noSel: '未选择任何项目，程序退出。',
    delItem: '已删除: {0} ({1})',
    delFail: '无法删除 {0}: {1}',
    summary: '\n共删除了 {0} 个项目，释放了 {1} 的磁盘空间。\n',
    bbFail: '无法运行 BleachBit 后端。请确保 Python 已安装且 bleachbit 目录存在。',
    bbFetch: '正在获取通用缓存清理项...',
    confirm: '确认'
  }
};

let currentLang = 'en-US';
function loadConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      const cfg = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
      if (cfg.lang && locales[cfg.lang]) currentLang = cfg.lang;
    }
  } catch (e) {}
}
function saveConfig() {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify({ lang: currentLang }));
  } catch (e) {}
}
function t(key, ...args) {
  let str = locales[currentLang][key] || key;
  args.forEach((arg, i) => {
    str = str.replace(`{${i}}`, arg);
  });
  return str;
}

const TARGETS = new Set([
  'node_modules',
  'target',
  'dist',
  'build',
  '__pycache__',
  '.DS_Store',
  '.next',
  '.nuxt'
]);

const IGNORE_DIRS = new Set(['.git']);

const projectDescMap = {
  'node_modules': { 'zh-CN': 'Node.js 依赖包', 'zh-TW': 'Node.js 依賴包', 'en-US': 'Node.js dependencies', 'ja-JP': 'Node.js 依存関係', 'ko-KR': 'Node.js 종속성' },
  'target': { 'zh-CN': 'Rust 构建输出', 'zh-TW': 'Rust 構建輸出', 'en-US': 'Rust build output', 'ja-JP': 'Rust ビルド出力', 'ko-KR': 'Rust 빌드 출력' },
  'dist': { 'zh-CN': '前端分发目录', 'zh-TW': '前端分發目錄', 'en-US': 'Frontend dist', 'ja-JP': 'フロントエンド配布', 'ko-KR': '프론트엔드 배포' },
  'build': { 'zh-CN': '通用构建输出', 'zh-TW': '通用構建輸出', 'en-US': 'General build output', 'ja-JP': '一般ビルド出力', 'ko-KR': '일반 빌드 출력' },
  '__pycache__': { 'zh-CN': 'Python 字节码缓存', 'zh-TW': 'Python 位元組碼快取', 'en-US': 'Python bytecode cache', 'ja-JP': 'Python バイトコード', 'ko-KR': 'Python 바이트코드' },
  '.DS_Store': { 'zh-CN': 'macOS 属性文件', 'zh-TW': 'macOS 屬性文件', 'en-US': 'macOS attributes', 'ja-JP': 'macOS 属性', 'ko-KR': 'macOS 속성' },
  '.next': { 'zh-CN': 'Next.js 缓存', 'zh-TW': 'Next.js 快取', 'en-US': 'Next.js cache', 'ja-JP': 'Next.js キャッシュ', 'ko-KR': 'Next.js 캐시' },
  '.nuxt': { 'zh-CN': 'Nuxt.js 缓存', 'zh-TW': 'Nuxt.js 快取', 'en-US': 'Nuxt.js cache', 'ja-JP': 'Nuxt.js キャッシュ', 'ko-KR': 'Nuxt.js 캐시' }
};

function stripAnsi(str) {
  return str.replace(/\x1B\[\d+m/g, '');
}

function padStartAnsi(str, targetLength, padChar = ' ') {
  const visibleLength = stripAnsi(str).length;
  if (visibleLength >= targetLength) return str;
  return padChar.repeat(targetLength - visibleLength) + str;
}

function truncateCols(str, maxCols) {
  if (!maxCols || maxCols <= 0) return str;
  let cols = 0;
  let result = '';
  let inAnsi = false;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '\x1B') inAnsi = true;
    result += char;
    if (!inAnsi) {
      cols += char.charCodeAt(0) > 255 ? 2 : 1;
    }
    if (char === 'm' && inAnsi) inAnsi = false;
    
    if (cols >= maxCols - 3 && i < str.length - 1) {
      return result + pc.gray('...');
    }
  }
  return result;
}

class DiffRenderer {
  constructor() {
    this.prevLines = [];
  }
  render(outputString) {
    const str = outputString.endsWith('\n') ? outputString.slice(0, -1) : outputString;
    const newLines = str.split('\n');
    if (this.prevLines.length === 0) {
      for (let i = 0; i < newLines.length; i++) process.stdout.write(newLines[i] + '\n');
      this.prevLines = newLines;
      return;
    }
    let cursorY = this.prevLines.length;
    const maxLines = Math.max(this.prevLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      const prev = this.prevLines[i] || '';
      const curr = newLines[i] || '';
      if (prev !== curr) {
        const dy = cursorY - i;
        readline.moveCursor(process.stdout, 0, -dy);
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(curr);
        cursorY = i;
      }
    }
    const bottomY = newLines.length;
    const dyReturn = bottomY - cursorY;
    if (dyReturn !== 0) {
      readline.moveCursor(process.stdout, 0, dyReturn);
      readline.cursorTo(process.stdout, 0);
    }
    this.prevLines = newLines;
  }
  clear() {
    if (this.prevLines.length > 0) {
      readline.moveCursor(process.stdout, 0, -this.prevLines.length);
      readline.clearScreenDown(process.stdout);
      this.prevLines = [];
    }
  }
}

const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerIndex = 0;
const statusRenderer = new DiffRenderer();
let currentStatusText = '';
let spinnerInterval = null;

let lastRenderedText = null;

function renderStatus() {
  const cols = process.stdout.columns || 80;
  const frame = spinnerFrames[spinnerIndex];
  spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
  
  if (currentStatusText !== lastRenderedText) {
    const tStr = truncateCols(pc.cyan(frame + ' ') + currentStatusText, cols);
    statusRenderer.render(tStr + '\n');
    lastRenderedText = currentStatusText;
  } else {
    if (statusRenderer.prevLines.length > 0) {
      readline.moveCursor(process.stdout, 0, -statusRenderer.prevLines.length);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(pc.cyan(frame));
      readline.moveCursor(process.stdout, 0, statusRenderer.prevLines.length);
      readline.cursorTo(process.stdout, 0);
    }
  }
}

function updateStatus(text) {
  currentStatusText = text;
  if (!spinnerInterval) {
    spinnerInterval = setInterval(renderStatus, 80);
  }
  renderStatus();
}

function clearStatus() {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
  }
  statusRenderer.clear();
}

function openUrl(url) {
  const plat = process.platform;
  if (plat === 'win32') exec(`start "" "${url}"`);
  else if (plat === 'darwin') exec(`open "${url}"`);
  else exec(`xdg-open "${url}"`);
}

function formatSize(bytes) {
  if (bytes === -1) return pc.yellow('Skip calculation');
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function getDirSizeFast(dirPath) {
  let totalSize = 0;
  const queue = [dirPath];
  while (queue.length > 0) {
    const currentBatch = queue.splice(0, 50);
    const batchResults = await Promise.all(currentBatch.map(async (dir) => {
      let size = 0;
      let subDirs = [];
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const filePaths = [];
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            subDirs.push(fullPath);
          } else if (entry.isFile()) {
            filePaths.push(fullPath);
          }
        }
        const chunkSize = 50;
        for (let i = 0; i < filePaths.length; i += chunkSize) {
          const chunk = filePaths.slice(i, i + chunkSize);
          const stats = await Promise.all(chunk.map(p => fs.stat(p).catch(() => ({ size: 0 }))));
          for (const stat of stats) size += stat.size;
        }
      } catch (e) {}
      return { size, subDirs };
    }));
    for (const res of batchResults) {
      totalSize += res.size;
      queue.push(...res.subDirs);
    }
  }
  return totalSize;
}

if (!isMainThread) {
  getDirSizeFast(workerData.dir).then(size => {
    parentPort.postMessage(size);
  });
} else {
  async function scanDirectory(startDir) {
    const results = [];
    const queue = [startDir];
    updateStatus(t('scanStart'));
    while (queue.length > 0) {
      const currentBatch = queue.splice(0, 20);
      await Promise.all(currentBatch.map(async (dir) => {
        try {
          const items = await fs.readdir(dir, { withFileTypes: true });
          for (const item of items) {
            if (!item.isDirectory() && item.name !== '.DS_Store') continue;
            if (IGNORE_DIRS.has(item.name)) continue;
            const fullPath = path.join(dir, item.name);
            if (TARGETS.has(item.name)) {
              updateStatus(`${fullPath}`);
              results.push({ path: fullPath, name: item.name, size: 0, calculated: false });
            } else if (item.isDirectory()) {
              queue.push(fullPath);
            }
          }
        } catch (err) {}
      }));
    }

    const maxWorkers = Math.max(1, os.cpus().length - 1);
    let activeWorkers = 0;
    let index = 0;
    const __filename = fileURLToPath(import.meta.url);
    const workers = new Set();
    
    let skipCalculation = false;
    let isResolved = false;

    await new Promise((resolve) => {
      const doResolve = () => {
        if (isResolved) return;
        isResolved = true;
        if (process.stdin.isTTY) {
          process.stdin.off('keypress', onKeypress);
          process.stdin.setRawMode(false);
          process.stdin.pause();
        }
        resolve();
      };

      const onKeypress = (str, key) => {
        if (key && key.name === 'escape' && !skipCalculation) {
          skipCalculation = true;
          updateStatus(t('scanSkip'));
          for (const w of workers) w.terminate();
          workers.clear();
          for (const r of results) {
            if (!r.calculated) r.size = -1;
          }
          doResolve();
        }
      };

      if (process.stdin.isTTY) {
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('keypress', onKeypress);
      }

      const next = () => {
        if (skipCalculation) return;
        
        if (index >= results.length && activeWorkers === 0) {
          doResolve();
          return;
        }
        
        while (activeWorkers < maxWorkers && index < results.length) {
          if (skipCalculation) break;
          activeWorkers++;
          const resultObj = results[index++];
          updateStatus(`${t('scanCalc')} ${resultObj.path}`);
          
          const worker = new Worker(__filename, { workerData: { dir: resultObj.path } });
          workers.add(worker);
          
          worker.on('message', (size) => {
            if (skipCalculation) return;
            resultObj.size = size;
            resultObj.calculated = true;
            activeWorkers--;
            next();
          });
          worker.on('error', () => {
            if (skipCalculation) return;
            resultObj.size = 0;
            resultObj.calculated = true;
            activeWorkers--;
            next();
          });
          worker.on('exit', () => {
            workers.delete(worker);
            if (activeWorkers === 0 && index >= results.length && !skipCalculation) {
              doResolve();
            }
          });
        }
      };
      next();
    });
    clearStatus();
    return results;
  }

  async function projectMultiSelect(choices, message) {
    let cursorIndex = 0;
    let startIndex = 0;
    const pageSize = 20;
    const creationTime = Date.now();
    const renderer = new DiffRenderer();

    return new Promise((resolve) => {
      const render = () => {
        const cols = process.stdout.columns || 80;
        let output = truncateCols(`${pc.cyan('?')} ${pc.bold(message)} ${pc.gray('»')} ${pc.gray(t('hint'))}`, cols) + '\n';
        
        const endIndex = Math.min(startIndex + pageSize, choices.length);
        if (startIndex > 0) output += pc.gray('  ↑\n');

        for (let i = startIndex; i < endIndex; i++) {
          const line = choices[i];
          const isHovered = i === cursorIndex;
          const prefix = isHovered ? pc.cyan('> ') : '  ';
          const box = line.selected ? pc.cyan('(*)') : '( )';
          let text = `${prefix}${box} ${line.title}`;
          if (line.description) text += pc.gray(` - ${line.description}`);
          if (isHovered) {
              text = pc.cyan(`${prefix}${box} ${line.title}`) + (line.description ? pc.gray(` - ${line.description}`) : '');
          }
          output += truncateCols(text, cols) + '\n';
        }
        if (endIndex < choices.length) output += pc.gray('  ↓\n');
        renderer.render(output);
      };

      const handleKeypress = (str, key) => {
        if (!key) return;
        if (Date.now() - creationTime < 1000) return;
        if (key.name === 'up') {
          if (cursorIndex > 0) cursorIndex--;
          if (cursorIndex < startIndex) startIndex = cursorIndex;
        } else if (key.name === 'down') {
          if (cursorIndex < choices.length - 1) cursorIndex++;
          if (cursorIndex >= startIndex + pageSize) startIndex = cursorIndex - pageSize + 1;
        } else if (key.name === 'space') {
          choices[cursorIndex].selected = !choices[cursorIndex].selected;
        } else if (key.name === 'return' || key.name === 'enter') {
          process.stdin.off('keypress', handleKeypress);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          
          renderer.clear();
          
          const selectedItems = choices.filter(l => l.selected);
          console.log(`${pc.cyan('?')} ${pc.bold(message)} ${pc.gray('»')} `);
          selectedItems.forEach(line => {
             console.log(`  ${pc.cyan('(*)')} ${pc.bold(line.title.trim())} ${pc.gray('- ' + line.description)}`);
          });
          console.log();
          
          const selectedValues = selectedItems.map(l => l.value);
          resolve(selectedValues);
          return;
        } else if (key.name === 'c' && key.ctrl) {
          process.stdin.off('keypress', handleKeypress);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          process.exit(0);
        }
        render();
      };
      if (process.stdin.isTTY) readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('keypress', handleKeypress);
      render();
    });
  }

  async function runProjectMode() {
    const startDir = process.cwd();
    const results = await scanDirectory(startDir);
    if (results.length === 0) { console.log(t('noCache') + '\n'); return; }
    results.sort((a, b) => b.size - a.size);
    const choices = results.map(item => {
      const relativePath = item.path.replace(startDir, '') || '.';
      const descObj = projectDescMap[item.name];
      const desc = descObj ? (descObj[currentLang] || descObj['en-US']) : '';
      return {
        title: `${item.name.padEnd(15)} ${padStartAnsi(formatSize(item.size), 18)}  ${relativePath}`,
        value: item,
        description: desc,
        selected: item.name === '__pycache__'
      };
    });
    const selectedItems = await projectMultiSelect(choices, t('delProjTitle'));
    if (!selectedItems || selectedItems.length === 0) { console.log(t('noSel') + '\n'); process.exit(0); }
    let totalFreed = 0;
    let successCount = 0;
    for (const item of selectedItems) {
      try {
        await fs.rm(item.path, { recursive: true, force: true });
        if (item.size > 0) totalFreed += item.size;
        successCount++;
        console.log(t('delItem', item.path, formatSize(item.size)));
      } catch (err) {
        console.log(t('delFail', item.path, err.message));
      }
    }
    console.log(t('summary', successCount, formatSize(totalFreed)));
    process.exit(0);
  }

  async function treeMultiSelect(categories, message) {
    const lines = [];
    categories.forEach((cat, cIdx) => {
      lines.push({ type: 'cat', cIdx, label: cat.name, selected: false });
      cat.items.forEach((item, iIdx) => {
        lines.push({ type: 'item', cIdx, iIdx, label: item.option, desc: item.desc, value: item.value, selected: false });
      });
    });

    return new Promise((resolve) => {
      let cursorIndex = 0;
      let startIndex = 0;
      const pageSize = 20;
      const creationTime = Date.now();
      const renderer = new DiffRenderer();

      const render = () => {
        const cols = process.stdout.columns || 80;
        let output = truncateCols(`${pc.cyan('?')} ${pc.bold(message)} ${pc.gray('»')} ${pc.gray(t('hint'))}`, cols) + '\n';
        const endIndex = Math.min(startIndex + pageSize, lines.length);
        if (startIndex > 0) output += pc.gray('  ↑\n');
        
        for (let i = startIndex; i < endIndex; i++) {
          const line = lines[i];
          const isHovered = i === cursorIndex;
          const prefix = isHovered ? pc.cyan('> ') : '  ';
          if (line.type === 'cat') {
            const children = lines.filter(l => l.type === 'item' && l.cIdx === line.cIdx);
            const selectedCount = children.filter(l => l.selected).length;
            let box = '( )';
            if (selectedCount === children.length && children.length > 0) box = pc.cyan('(*)');
            else if (selectedCount > 0) box = pc.cyan('(-)');
            let text = `${prefix}${box} ${pc.bold(line.label)}`;
            if (isHovered) text = pc.cyan(text);
            output += truncateCols(text, cols) + '\n';
          } else {
            const box = line.selected ? pc.cyan('(*)') : '( )';
            let text = `${prefix}  ${box} ${line.label}`;
            if (line.desc) text += pc.gray(` - ${line.desc}`);
            if (isHovered) text = pc.cyan(`${prefix}  ${box} ${line.label}`) + pc.gray(` - ${line.desc}`);
            output += truncateCols(text, cols) + '\n';
          }
        }
        if (endIndex < lines.length) output += pc.gray('  ↓\n');
        renderer.render(output);
      };

      const updateCatSelection = (cIdx) => {
        const children = lines.filter(l => l.type === 'item' && l.cIdx === cIdx);
        const selectedCount = children.filter(l => l.selected).length;
        const catLine = lines.find(l => l.type === 'cat' && l.cIdx === cIdx);
        if (selectedCount === children.length && children.length > 0) catLine.selected = true;
        else catLine.selected = false;
      };

      const handleKeypress = (str, key) => {
        if (!key) return;
        if (Date.now() - creationTime < 1000) return;
        if (key.name === 'up') {
          if (cursorIndex > 0) cursorIndex--;
          if (cursorIndex < startIndex) startIndex = cursorIndex;
        } else if (key.name === 'down') {
          if (cursorIndex < lines.length - 1) cursorIndex++;
          if (cursorIndex >= startIndex + pageSize) startIndex = cursorIndex - pageSize + 1;
        } else if (key.name === 'space') {
          const current = lines[cursorIndex];
          if (current.type === 'cat') {
            const children = lines.filter(l => l.type === 'item' && l.cIdx === current.cIdx);
            const allSelected = children.every(l => l.selected);
            children.forEach(l => l.selected = !allSelected);
            updateCatSelection(current.cIdx);
          } else {
            current.selected = !current.selected;
            updateCatSelection(current.cIdx);
          }
        } else if (key.name === 'return' || key.name === 'enter') {
          process.stdin.off('keypress', handleKeypress);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          
          renderer.clear();
          const selectedItems = lines.filter(l => l.type === 'item' && l.selected);
          console.log(`${pc.cyan('?')} ${pc.bold(message)} ${pc.gray('»')} `);
          selectedItems.forEach(line => {
             console.log(`  ${pc.cyan('(*)')} ${pc.bold(categories[line.cIdx].name + ' | ' + line.label)} ${pc.gray('- ' + line.desc)}`);
          });
          console.log();
          const selectedValues = selectedItems.map(l => l.value);
          resolve(selectedValues);
          return;
        } else if (key.name === 'c' && key.ctrl) {
          process.stdin.off('keypress', handleKeypress);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          process.exit(0);
        }
        render();
      };
      if (process.stdin.isTTY) readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('keypress', handleKeypress);
      render();
    });
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const bleachbitPath = path.join(__dirname, 'bleachbit', 'bleachbit.py');

  async function runGeneralMode() {
    updateStatus(t('bbFetch'));
    let stdout;
    try { stdout = execSync(`python "${bleachbitPath}" --list`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch (e) {
      clearStatus(); console.log(t('bbFail') + '\n'); return;
    }
    clearStatus();
    const rawLines = stdout.split('\n').map(l => l.trim()).filter(l => l && l.includes('.') && !l.includes(' '));
    if (rawLines.length === 0) { console.log(t('noCache') + '\n'); return; }
    const descMap = {
      cache: { 'zh-CN': '清理缓存文件', 'en-US': 'Clean cache files', 'ja-JP': 'キャッシュファイルをクリーン', 'ko-KR': '캐시 파일 정리', 'zh-TW': '清理快取文件' },
      cookies: { 'zh-CN': '清除 Cookies', 'en-US': 'Clear Cookies', 'ja-JP': 'Cookieをクリア', 'ko-KR': '쿠키 지우기', 'zh-TW': '清除 Cookies' },
      history: { 'zh-CN': '清除浏览历史', 'en-US': 'Clear browsing history', 'ja-JP': '閲覧履歴をクリア', 'ko-KR': '검색 기록 지우기', 'zh-TW': '清除瀏覽歷史' },
      form_history: { 'zh-CN': '清除表单历史', 'en-US': 'Clear form history', 'ja-JP': 'フォーム履歴をクリア', 'ko-KR': '양식 기록 지우기', 'zh-TW': '清除表單歷史' },
      passwords: { 'zh-CN': '清除保存的密码', 'en-US': 'Clear saved passwords', 'ja-JP': '保存されたパスワードをクリア', 'ko-KR': '저장된 비밀번호 지우기', 'zh-TW': '清除保存的密碼' },
      session: { 'zh-CN': '清除会话数据', 'en-US': 'Clear session data', 'ja-JP': 'セッションデータをクリア', 'ko-KR': '세션 데이터 지우기', 'zh-TW': '清除會話數據' },
      vacuum: { 'zh-CN': '优化/压缩数据库', 'en-US': 'Optimize/Vacuum DB', 'ja-JP': 'DBの最適化', 'ko-KR': 'DB 최적화/정리', 'zh-TW': '優化/壓縮資料庫' },
      crash_reports: { 'zh-CN': '清除崩溃报告', 'en-US': 'Clear crash reports', 'ja-JP': 'クラッシュレポートをクリア', 'ko-KR': '충돌 보고서 지우기', 'zh-TW': '清除崩潰報告' },
      site_preferences: { 'zh-CN': '清除站点偏好设置', 'en-US': 'Clear site preferences', 'ja-JP': 'サイト設定をクリア', 'ko-KR': '사이트 기본 설정 지우기', 'zh-TW': '清除站點偏好設置' },
      sync: { 'zh-CN': '清除同步数据', 'en-US': 'Clear sync data', 'ja-JP': '同期データをクリア', 'ko-KR': '동기화 데이터 지우기', 'zh-TW': '清除同步數據' },
      logs: { 'zh-CN': '清除日志文件', 'en-US': 'Clear log files', 'ja-JP': 'ログファイルをクリア', 'ko-KR': '로그 파일 지우기', 'zh-TW': '清除日誌文件' },
      tmp: { 'zh-CN': '清除临时文件', 'en-US': 'Clear temp files', 'ja-JP': '一時ファイルをクリア', 'ko-KR': '임시 파일 지우기', 'zh-TW': '清除臨時文件' },
      backup: { 'zh-CN': '清除备份文件', 'en-US': 'Clear backup files', 'ja-JP': 'バックアップをクリア', 'ko-KR': '백업 파일 지우기', 'zh-TW': '清除備份文件' },
      mru: { 'zh-CN': '清除最近使用记录', 'en-US': 'Clear MRU list', 'ja-JP': '最近使用した項目をクリア', 'ko-KR': '최근 사용 항목 지우기', 'zh-TW': '清除最近使用記錄' },
      empty_space: { 'zh-CN': '擦除可用空间', 'en-US': 'Wipe free space', 'ja-JP': '空き領域を消去', 'ko-KR': '여유 공간 지우기', 'zh-TW': '擦除可用空间' },
      memory_dump: { 'zh-CN': '清除内存转储', 'en-US': 'Clear memory dumps', 'ja-JP': 'メモリダンプをクリア', 'ko-KR': '메모리 덤프 지우기', 'zh-TW': '清除記憶體轉儲' },
      prefetch: { 'zh-CN': '清除预取文件', 'en-US': 'Clear prefetch files', 'ja-JP': 'プリフェッチをクリア', 'ko-KR': '프리페치 파일 지우기', 'zh-TW': '清除預取文件' },
      recycle_bin: { 'zh-CN': '清空回收站', 'en-US': 'Empty recycle bin', 'ja-JP': 'ごみ箱を空にする', 'ko-KR': '휴지통 비우기', 'zh-TW': '清空回收站' },
      custom: { 'zh-CN': '自定义清理项', 'en-US': 'Custom cleaners', 'ja-JP': 'カスタムクリーン', 'ko-KR': '사용자 지정 정리', 'zh-TW': '自定義清理項' },
      updates: { 'zh-CN': '清除更新缓存', 'en-US': 'Clear update cache', 'ja-JP': '更新キャッシュをクリア', 'ko-KR': '업데이트 캐시 지우기', 'zh-TW': '清除更新快取' },
      search_engines: { 'zh-CN': '清除搜索引擎记录', 'en-US': 'Clear search engines', 'ja-JP': '検索エンジン履歴をクリア', 'ko-KR': '검색 엔진 기록 지우기', 'zh-TW': '清除搜索引擎記錄' },
      site_data: { 'zh-CN': '清除站点数据', 'en-US': 'Clear site data', 'ja-JP': 'サイトデータをクリア', 'ko-KR': '사이트 데이터 지우기', 'zh-TW': '清除站點數據' }
    };
    rawLines.sort();
    const categoriesMap = {};
    for (const item of rawLines) {
      const parts = item.split('.');
      const catName = parts[0].split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const option = parts.slice(1).join('.');
      const descObj = descMap[option];
      const desc = descObj ? (descObj[currentLang] || descObj['en-US']) : option;
      if (!categoriesMap[catName]) categoriesMap[catName] = [];
      categoriesMap[catName].push({ option, value: item, desc });
    }
    const categoriesArray = Object.keys(categoriesMap).map(name => ({ name, items: categoriesMap[name] }));
    const selectedItems = await treeMultiSelect(categoriesArray, t('delGenTitle'));
    if (!selectedItems || selectedItems.length === 0) { console.log(t('noSel') + '\n'); process.exit(0); }
    let successCount = 0;
    let totalFreed = 0;
    const child = spawn('python', [bleachbitPath, '--clean', ...selectedItems], { stdio: ['ignore', 'pipe', 'ignore'] });
    child.stdout.on('data', (data) => {
      const output = data.toString();
      const lines = output.split('\n');
      for (const line of lines) {
        const match = line.match(/^Delete\s+([^\s]+)\s+(.+)$/);
        if (match) {
          const sizeStr = match[1];
          const pathStr = match[2].trim();
          console.log(t('delItem', pathStr, sizeStr));
          successCount++;
          let bytes = 0;
          const num = parseFloat(sizeStr);
          if (!isNaN(num)) {
            if (sizeStr.includes('kB')) bytes = num * 1024;
            else if (sizeStr.includes('MB')) bytes = num * 1024 * 1024;
            else if (sizeStr.includes('GB')) bytes = num * 1024 * 1024 * 1024;
            else if (sizeStr.includes('B')) bytes = num;
          }
          totalFreed += bytes;
        }
      }
    });
    await new Promise(resolve => child.on('close', resolve));
    console.log(t('summary', successCount, formatSize(totalFreed)));
    process.exit(0);
  }

  async function showCustomMainMenu() {
    const lines = [
      { type: 'header', text: t('mainMenu') },
      { type: 'option', value: 'project', label: t('projMode') },
      { type: 'option', value: 'general', label: t('genMode') },
      { type: 'spacer' },
      { type: 'header', text: t('settings') },
      { type: 'option', value: 'github', label: t('github') },
      { type: 'option', value: 'lang', label: `${t('langSwitch')}: ${locales[currentLang].langName}` }
    ];
    const selectableIndices = [];
    lines.forEach((line, i) => { if (line.type === 'option') selectableIndices.push(i); });

    return new Promise((resolve) => {
      let selIdx = 0;
      const creationTime = Date.now();
      const renderer = new DiffRenderer();

      const render = () => {
        const cols = process.stdout.columns || 80;
        let output = pc.bold(pc.cyan('DTempClean\n\n'));
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.type === 'header') { output += truncateCols(`${pc.cyan('?')} ${pc.bold(line.text)}`, cols) + '\n'; }
          else if (line.type === 'spacer') { output += '\n'; }
          else if (line.type === 'option') {
            const isHovered = (i === selectableIndices[selIdx]);
            const prefix = isHovered ? pc.cyan('> ') : '  ';
            let text = `${prefix}${line.label}`;
            if (isHovered) {
                const linesSplit = text.split('\n');
                linesSplit[0] = pc.cyan(linesSplit[0]);
                output += truncateCols(linesSplit.join('\n'), cols) + '\n';
                if (line.value === 'github') {
                    output += pc.gray('    https://github.com/buer5/dtemp_clean') + '\n';
                }
            } else {
                output += truncateCols(text, cols) + '\n';
            }
          }
        }
        renderer.render(output);
      };
      const handleKeypress = (str, key) => {
        if (!key) return;
        if (Date.now() - creationTime < 1000) return;
        if (key.name === 'up') selIdx = (selIdx - 1 + selectableIndices.length) % selectableIndices.length;
        else if (key.name === 'down') selIdx = (selIdx + 1) % selectableIndices.length;
        else if (key.name === 'return' || key.name === 'enter') {
          const chosen = lines[selectableIndices[selIdx]].value;
          if (chosen === 'github') { openUrl('https://github.com/buer5/dtemp_clean'); return; }
          process.stdin.off('keypress', handleKeypress);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          renderer.clear();
          resolve(chosen);
          return;
        } else if (key.name === 'c' && key.ctrl) { process.exit(0); }
        render();
      };
      if (process.stdin.isTTY) readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('keypress', handleKeypress);
      render();
    });
  }

  async function showLangMenu() {
    const langCodes = Object.keys(locales);
    const choices = langCodes.map(code => ({ title: locales[code].langName, value: code }));
    let selIdx = langCodes.indexOf(currentLang);
    if (selIdx === -1) selIdx = 0;
    const renderer = new DiffRenderer();
    return new Promise((resolve) => {
        const render = () => {
            const cols = process.stdout.columns || 80;
            let output = truncateCols(`${pc.cyan('?')} ${pc.bold(t('langSwitch'))} ${pc.gray('»')}`, cols) + '\n';
            for (let i = 0; i < choices.length; i++) {
                const c = choices[i]; const isHovered = i === selIdx;
                const prefix = isHovered ? pc.cyan('> ') : '  ';
                let lineStr = `${prefix}${c.title}`;
                if (isHovered) lineStr = pc.cyan(lineStr);
                output += truncateCols(lineStr, cols) + '\n';
            }
            renderer.render(output);
        };
        const handleKeypress = (str, key) => {
            if (!key) return;
            if (key.name === 'up') selIdx = (selIdx - 1 + choices.length) % choices.length;
            else if (key.name === 'down') selIdx = (selIdx + 1) % choices.length;
            else if (key.name === 'return' || key.name === 'enter') {
                process.stdin.off('keypress', handleKeypress);
                process.stdin.setRawMode(false);
                process.stdin.pause();
                renderer.clear();
                currentLang = choices[selIdx].value;
                saveConfig();
                resolve();
                return;
            } else if (key.name === 'c' && key.ctrl) { process.exit(0); }
            render();
        }
        if (process.stdin.isTTY) readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('keypress', handleKeypress);
        render();
    });
  }

  async function main() {
    loadConfig();
    console.clear();
    while (true) {
      const mode = await showCustomMainMenu();
      if (!mode) process.exit(0);
      if (mode === 'lang') { await showLangMenu(); continue; }
      if (mode === 'project') { await runProjectMode(); break; }
      if (mode === 'general') { await runGeneralMode(); break; }
    }
  }
  main().catch(err => { console.error(err.message); process.exit(1); });
}
