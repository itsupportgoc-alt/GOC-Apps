/* GOC Builders desktop app.
 * One codebase, built three times (Projects, Payroll, Materials).
 * Each build opens its own system from the online server (Hostinger).
 * The server address can be changed from the menu: File > Change server address. */
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
let autoUpdater = null;
try { autoUpdater = require('electron-updater').autoUpdater; } catch (e) { /* running without the updater (development) */ }
const path = require('path');
const fs = require('fs');

const pkg = require('./package.json');
const cfg = require('./app-config.json');

const MODULE = cfg.modules[pkg.gocModule] ? pkg.gocModule : 'home';
const MOD = cfg.modules[MODULE];
const TITLE = MOD.title;
const ICON = path.join(__dirname, 'build', 'icons', MODULE + '.ico');
const FULL = MODULE === 'home';   // the "GOC Builders" app: home page with all the cards, nothing blocked

let win = null;
let settingsWin = null;

/* ---------- settings (saved per computer) ---------- */
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

function normalizeUrl(u) {
  u = String(u || '').trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try {
    const p = new URL(u);
    let base = p.origin + p.pathname;
    // if someone pastes the full module link, keep only the site address
    base = base.replace(/\/(projects|payroll|materials|concerns)\/?.*$/i, '/');
    if (!base.endsWith('/')) base += '/';
    return base;
  } catch (e) { return ''; }
}

function readSettings() {
  try { return JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); } catch (e) { return {}; }
}
function writeSettings(s) {
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(s, null, 2));
}
function serverUrl() { return normalizeUrl(readSettings().serverUrl) || cfg.defaultServerUrl; }
function moduleUrl() { return serverUrl() + MOD.path; }
function sameSite(url) {
  try { return new URL(url).host === new URL(serverUrl()).host; } catch (e) { return false; }
}

/* Each app shows ONLY its own system: the website home page (cards) and the
 * other two systems are blocked here. The website itself is not changed. */
function blockedUrl(url) {
  if (FULL) return false;
  try {
    if (!sameSite(url)) return false;
    const base = new URL(serverUrl()).pathname;               // usually "/"
    const p = decodeURIComponent(new URL(url).pathname);
    if (!p.startsWith(base)) return false;
    const rel = p.slice(base.length).toLowerCase();           // "", "index.php", "payroll/..."
    if (rel === '' || rel === 'index.php') return true;       // home page with the cards
    const first = rel.split('/')[0];
    return Object.keys(cfg.modules).includes(first) && first !== MODULE;  // another system
  } catch (e) { return false; }
}

/* Hides the Home buttons inside the app only (sidebar "Home" and the logo link) */
const HIDE_HOME_CSS = `
  .side-bottom a[href="../"], .side-bottom a[href="../index.php"], .side-bottom a[title="GOC Builders home"] { display: none !important; }
  a.brandmark[href="../"], a.brandmark[href="../index.php"] { pointer-events: none !important; cursor: default !important; }
  a.crumb[href="../"], a.crumb[href="./"] { display: none !important; }
`;

/* ---------- windows ---------- */
function loadModule() {
  if (!win) return;
  win.loadURL(moduleUrl());
}

function showOffline(errText) {
  win.loadFile(path.join(__dirname, 'offline.html'), {
    query: { title: TITLE, url: moduleUrl(), err: errText || '' }
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1366, height: 860, minWidth: 900, minHeight: 600,
    title: TITLE, icon: ICON, show: false, backgroundColor: '#ffffff',
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.on('page-title-updated', (e, t) => { e.preventDefault(); win.setTitle(t ? TITLE + '  -  ' + t : TITLE); });

  // No internet / wrong address -> friendly page with "Try again"
  win.webContents.on('did-fail-load', (e, code, desc, url, isMainFrame) => {
    if (!isMainFrame || code === -3) return; // -3 = navigation aborted (normal)
    if (url && url.startsWith('file:')) return;
    showOffline(desc + ' (' + code + ')');
  });

  // Hide the Home buttons on every page of this system
  win.webContents.on('dom-ready', () => {
    if (!FULL && !win.webContents.getURL().startsWith('file:')) win.webContents.insertCSS(HIDE_HOME_CSS).catch(() => {});
  });

  // Stay inside THIS system; home page / other systems are blocked; other websites open in the normal browser
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('file:')) return;
    if (blockedUrl(url)) { e.preventDefault(); return; }
    if (sameSite(url)) return;
    e.preventDefault(); shell.openExternal(url);
  });
  win.webContents.on('did-navigate', (e, url) => {
    if (blockedUrl(url)) loadModule();   // e.g. Back button or a redirect to the home page
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (blockedUrl(url)) return { action: 'deny' };
    if (sameSite(url)) {
      return { action: 'allow', overrideBrowserWindowOptions: { icon: ICON, autoHideMenuBar: true, width: 1100, height: 800 } };
    }
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Downloads (Excel / CSV / documents): ask where to save
  win.webContents.session.on('will-download', (e, item) => {
    const p = dialog.showSaveDialogSync(win, { defaultPath: path.join(app.getPath('downloads'), item.getFilename()) });
    if (p) item.setSavePath(p); else item.cancel();
  });

  loadModule();
}

function openSettings() {
  if (settingsWin) { settingsWin.focus(); return; }
  settingsWin = new BrowserWindow({
    width: 560, height: 380, resizable: false, minimizable: false, maximizable: false,
    parent: win, modal: true, title: 'Server address', icon: ICON, autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  settingsWin.setMenu(null);
  settingsWin.loadFile(path.join(__dirname, 'settings.html'));
  settingsWin.on('closed', () => { settingsWin = null; });
}

/* ---------- messages from settings.html / offline.html ---------- */
ipcMain.handle('goc:get', () => ({
  title: TITLE, module: MODULE, serverUrl: serverUrl(),
  defaultServerUrl: cfg.defaultServerUrl, moduleUrl: moduleUrl(), version: app.getVersion()
}));
ipcMain.handle('goc:save', (e, url) => {
  const n = normalizeUrl(url);
  if (!n) return { ok: false, error: 'Please type a valid website address, e.g. https://www.gocbuilders.com' };
  writeSettings({ ...readSettings(), serverUrl: n });
  if (settingsWin) settingsWin.close();
  loadModule();
  return { ok: true, serverUrl: n };
});
ipcMain.handle('goc:retry', () => { loadModule(); });
ipcMain.handle('goc:settings', () => { openSettings(); });
ipcMain.handle('goc:close', () => { if (settingsWin) settingsWin.close(); });

/* ---------- menu ---------- */
function buildMenu() {
  const tpl = [
    { label: 'File', submenu: [
      { label: FULL ? 'Home (all systems)' : 'Open ' + TITLE.replace('GOC ', ''), accelerator: 'CmdOrCtrl+H', click: loadModule },
      { label: 'Reload', accelerator: 'F5', click: () => win && win.webContents.reload() },
      { type: 'separator' },
      { label: 'Print', accelerator: 'CmdOrCtrl+P', click: () => win && win.webContents.print() },
      { type: 'separator' },
      { label: 'Change server address...', click: openSettings },
      { type: 'separator' },
      { role: 'quit', label: 'Exit' }
    ]},
    { label: 'Edit', submenu: [
      { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
      { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }
    ]},
    { label: 'View', submenu: [
      { label: 'Back', accelerator: 'Alt+Left', click: () => win && win.webContents.navigationHistory.canGoBack() && win.webContents.navigationHistory.goBack() },
      { label: 'Forward', accelerator: 'Alt+Right', click: () => win && win.webContents.navigationHistory.canGoForward() && win.webContents.navigationHistory.goForward() },
      { type: 'separator' },
      { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' },
      { type: 'separator' }, { role: 'togglefullscreen' }
    ]},
    { label: 'Help', submenu: [
      { label: 'Check for updates', click: checkForUpdatesNow },
      { type: 'separator' },
      { label: 'About', click: () => dialog.showMessageBox(win, {
        type: 'info', title: 'About', icon: ICON,
        message: TITLE, detail: 'GOC Builders Management System\nVersion ' + app.getVersion() + '\nServer: ' + serverUrl()
      }) }
    ]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

/* ---------- automatic updates (new versions from the public GOC-Apps releases) ---------- */
let updateReady = false, manualCheck = false;
function setupUpdates() {
  if (!autoUpdater || !app.isPackaged) return;
  autoUpdater.channel = MODULE;            // each app has its own update file: projects.yml, payroll.yml, ...
  autoUpdater.autoDownload = true;          // download quietly in the background
  autoUpdater.autoInstallOnAppQuit = true;  // install when the app is closed
  autoUpdater.on('update-downloaded', info => {
    updateReady = true;
    dialog.showMessageBox(win, {
      type: 'info', title: 'Update ready', icon: ICON, buttons: ['Restart now', 'Later'], defaultId: 0, cancelId: 1,
      message: TITLE + ' ' + info.version + ' is ready.',
      detail: 'Restart now to use the new version, or it will be installed the next time you close the app.'
    }).then(r => { if (r.response === 0) autoUpdater.quitAndInstall(false, true); });
  });
  autoUpdater.on('update-not-available', () => {
    if (manualCheck) dialog.showMessageBox(win, { type: 'info', title: 'No updates', icon: ICON, message: 'You have the latest version (' + app.getVersion() + ').' });
    manualCheck = false;
  });
  autoUpdater.on('error', err => {
    if (manualCheck) dialog.showMessageBox(win, { type: 'warning', title: 'Update check failed', icon: ICON, message: 'Could not check for updates.', detail: String(err && err.message || err) });
    manualCheck = false;
  });
  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  setTimeout(check, 5000);                  // shortly after start
  setInterval(check, 4 * 60 * 60 * 1000);   // and every 4 hours while open
}
function checkForUpdatesNow() {
  if (!autoUpdater || !app.isPackaged) { dialog.showMessageBox(win, { type: 'info', message: 'Updates work only in the installed app.' }); return; }
  if (updateReady) { autoUpdater.quitAndInstall(false, true); return; }
  manualCheck = true;
  autoUpdater.checkForUpdates().catch(() => {});
}

/* ---------- start ---------- */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.setAppUserModelId('com.gocbuilders.' + MODULE);
  app.whenReady().then(() => { buildMenu(); createWindow(); setupUpdates(); });
  app.on('window-all-closed', () => app.quit());
}
