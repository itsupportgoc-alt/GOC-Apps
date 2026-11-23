/* Installation password (GitHub secret GOC_INSTALL_PASSWORD).
 * Run by the GitHub build before electron-builder. The password itself is NEVER written anywhere:
 * only a salted PBKDF2 hash goes into the installer (build/pass.nsh) and into the app (app-config.json).
 * No secret -> the apps are built without an installation password (a warning is shown). */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ITER = 100000;   // ~1-2 seconds for the installer to check
const pw = process.env.GOC_INSTALL_PASSWORD || '';
const nsh = path.join(__dirname, 'pass.nsh');
const cfgFile = path.join(__dirname, '..', 'app-config.json');
const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));

if (!pw) {
  // stop the build: nothing is released until the secret is added (Settings > Secrets and variables > Actions)
  console.log('::error::GOC_INSTALL_PASSWORD secret is missing - add it in GitHub (Settings > Secrets and variables > Actions), then run the build again');
  process.exit(1);
} else {
  const salt = crypto.randomBytes(16);
  // PBKDF2-HMAC-SHA1 (the same as Windows' Rfc2898DeriveBytes, which the installer uses to check it)
  const hash = crypto.pbkdf2Sync(pw, salt, ITER, 32, 'sha1').toString('base64');
  fs.writeFileSync(nsh, [
    '; installation password check (made by build/make-pass.js)',
    '!define GOC_PASS_SALT "' + salt.toString('base64') + '"',
    '!define GOC_PASS_ITER "' + ITER + '"',
    '!define GOC_PASS_HASH "' + hash + '"',
    ''
  ].join('\n'));
  cfg.installSalt = salt.toString('base64'); cfg.installHash = hash; cfg.installIter = ITER;
  console.log('Installation password: on');
}
fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2));
