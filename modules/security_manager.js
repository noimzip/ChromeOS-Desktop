/**
 * Soul Widgets Manager - Security Manager
 */

'use strict';

window.SecurityManager = (() => {
  const MODES = Object.freeze({
    STRICT: 'strict',
    STANDARD: 'standard',
    NONE: 'none'
  });

  const DEFAULT_MODE = MODES.STANDARD;
  const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
  const SESSION_PREFIX = 'securitySession:';

  const DEFAULT_ALLOWLIST_DOMAINS = [
    'calendar.google.com',
    'gmail.googleapis.com',
    'github-contributions-api.jogruber.de',
    'github.com'
  ];

  const BLOCKLIST_DOMAINS = [
    'malware.test',
    'phishing.example'
  ];

  let currentMode = DEFAULT_MODE;
  let allowedDomains = [];

  function normalizeMode(mode) {
    if (mode === MODES.STRICT || mode === MODES.STANDARD || mode === MODES.NONE) {
      return mode;
    }
    return DEFAULT_MODE;
  }

  function splitCommandLine(input) {
    if (typeof input !== 'string') return [];
    const parts = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;
    let escaping = false;

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (escaping) {
        current += ch;
        escaping = false;
        continue;
      }
      if (ch === '\\') {
        escaping = true;
        continue;
      }
      if (ch === '"' && !inSingle) {
        inDouble = !inDouble;
        continue;
      }
      if (ch === "'" && !inDouble) {
        inSingle = !inSingle;
        continue;
      }
      if (!inSingle && !inDouble && /\s/.test(ch)) {
        if (current.length > 0) {
          parts.push(current);
          current = '';
        }
        continue;
      }
      current += ch;
    }

    if (current.length > 0) parts.push(current);
    return parts;
  }

  function extractBin(command) {
    const parts = splitCommandLine(command);
    return parts[0] || '';
  }

  function loadModeFromStorage() {
    const stored = localStorage.getItem(LS_KEYS.SECURITY_MODE);
    currentMode = normalizeMode(stored || DEFAULT_MODE);
  }

  async function syncAllowedDomainsFromMain() {
    if (!window.electronAPI || !window.electronAPI.getAllowedDomains) return;
    try {
      const list = await window.electronAPI.getAllowedDomains();
      allowedDomains = Array.isArray(list) ? list : [];
    } catch (e) {
      console.error('Failed to load allowed domains:', e);
    }
  }

  function getAllowlistDomains() {
    return [...DEFAULT_ALLOWLIST_DOMAINS, ...allowedDomains];
  }

  async function syncModeFromMain() {
    if (window.electronAPI && window.electronAPI.getSecurityMode) {
      try {
        const mode = await window.electronAPI.getSecurityMode();
        currentMode = normalizeMode(mode);
        localStorage.setItem(LS_KEYS.SECURITY_MODE, currentMode);
      } catch (e) {
        console.error('Failed to sync security mode:', e);
      }
    }
  }

  function persistMode(mode) {
    currentMode = normalizeMode(mode);
    localStorage.setItem(LS_KEYS.SECURITY_MODE, currentMode);
    if (window.electronAPI && window.electronAPI.setSecurityMode) {
      window.electronAPI.setSecurityMode(currentMode);
    }
  }

  function sanitizeInputStrict(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[^\p{L}\p{N}\s]/gu, '');
  }

  /**
   * Very small, local HTML escape helper used only as a fallback when the
   * main sanitizeHTML IPC call is not available. It neutralizes characters
   * needed to form HTML tags so that potentially dangerous markup cannot be
   * interpreted by the browser.
   */
  function basicEscapeHtml(input) {
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async function sanitizeInputStandard(input) {
    if (typeof input !== 'string') return '';
    // Use a well-tested HTML sanitizer via Main process to remove unsafe elements such as
    // <script>, <style>, <iframe>, <img>, <object>, <embed>, <link>, <meta>, etc.
    if (window.electronAPI && window.electronAPI.sanitizeHTML) {
      try {
        return await window.electronAPI.sanitizeHTML(input);
      } catch (e) {
        console.error('Sanitization failed:', e);
      }
    }
    // Fallback: escape HTML special characters if IPC fails to prevent HTML injection
    return basicEscapeHtml(input);
  }

  async function sanitizeInput(input) {
    if (currentMode === MODES.STRICT) return sanitizeInputStrict(input);
    if (currentMode === MODES.STANDARD) return await sanitizeInputStandard(input);
    return input;
  }

  function sanitizeUrlInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  }

  function sanitizeCommandInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  }

  function normalizeHostname(url) {
    try {
      return new URL(url, window.location.href).hostname.toLowerCase();
    } catch {
      return '';
    }
  }

  function hostMatchesList(host, list) {
    return list.some(entry => host === entry || host.endsWith(`.${entry}`));
  }

  function isUrlAllowed(url) {
    if (currentMode === MODES.NONE) return true;
    const host = normalizeHostname(url);
    if (!host) return false;
    if (currentMode === MODES.STRICT) {
      return hostMatchesList(host, getAllowlistDomains());
    }
    return !hostMatchesList(host, BLOCKLIST_DOMAINS);
  }

  function setSessionItem(key, value) {
    const namespacedKey = `${SESSION_PREFIX}${key}`;
    if (currentMode === MODES.STRICT) {
      sessionStorage.setItem(namespacedKey, JSON.stringify({ value }));
      return;
    }
    if (currentMode === MODES.STANDARD) {
      const expiresAt = Date.now() + SESSION_TTL_MS;
      localStorage.setItem(namespacedKey, JSON.stringify({ value, expiresAt }));
      return;
    }
    localStorage.setItem(namespacedKey, JSON.stringify({ value }));
  }

  function getSessionItem(key) {
    const namespacedKey = `${SESSION_PREFIX}${key}`;
    if (currentMode === MODES.STRICT) {
      const raw = sessionStorage.getItem(namespacedKey);
      if (!raw) return null;
      try {
        return JSON.parse(raw).value ?? null;
      } catch {
        return null;
      }
    }
    const raw = localStorage.getItem(namespacedKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (currentMode === MODES.STANDARD && parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem(namespacedKey);
        return null;
      }
      return parsed.value ?? null;
    } catch {
      return null;
    }
  }

  function clearSession() {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(SESSION_PREFIX)) localStorage.removeItem(k);
    });
    Object.keys(sessionStorage).forEach(k => {
      if (k.startsWith(SESSION_PREFIX)) sessionStorage.removeItem(k);
    });
  }

  function applySessionPolicy() {
    if (currentMode === MODES.STANDARD) {
      Object.keys(localStorage).forEach(k => {
        if (!k.startsWith(SESSION_PREFIX)) return;
        try {
          const parsed = JSON.parse(localStorage.getItem(k));
          if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
            localStorage.removeItem(k);
          }
        } catch {
          localStorage.removeItem(k);
        }
      });
    }
    if (currentMode === MODES.STRICT) {
      window.addEventListener('beforeunload', () => clearSession());
    }
  }

  async function initSecurityModeSelector() {
    const selector = document.getElementById('security_mode_selector');
    if (!selector) return;
    await syncModeFromMain();
    selector.value = currentMode;
    selector.addEventListener('change', (e) => {
      const mode = normalizeMode(e.target.value);
      persistMode(mode);
      applySessionPolicy();
    });
  }

  async function initAllowedCommandsEditor() {
    const textarea = document.getElementById('allowed_command_list');
    if (!textarea || !window.electronAPI || !window.electronAPI.getAllowedBinaries) return;
    try {
      const list = await window.electronAPI.getAllowedBinaries();
      textarea.value = Array.isArray(list) ? list.join('\n') : '';
    } catch (e) {
      console.error('Failed to load allowed binaries:', e);
    }
    textarea.addEventListener('change', () => {
      const values = textarea.value
        .split('\n')
        .map(v => v.trim())
        .filter(Boolean);
      if (window.electronAPI && window.electronAPI.setAllowedBinaries) {
        window.electronAPI.setAllowedBinaries(values);
      }
    });
  }

  function collectStoredLinuxCommands() {
    const commands = [];
    try {
      const linuxApps = JSON.parse(localStorage.getItem(LS_KEYS.LINUX_APPS) || '[]');
      linuxApps.forEach(app => {
        if (app && app.command) commands.push(app.command);
      });
    } catch {}
    try {
      const folders = JSON.parse(localStorage.getItem(LS_KEYS.APP_FOLDERS) || '{}');
      Object.values(folders).forEach(folder => {
        if (!folder || !Array.isArray(folder.apps)) return;
        folder.apps.forEach(app => {
          if (app && app.command) commands.push(app.command);
        });
      });
    } catch {}
    return commands;
  }

  async function syncAllowlistFromStorage() {
    if (!window.electronAPI || !window.electronAPI.getAllowedBinaries || !window.electronAPI.setAllowedBinaries) return;
    const commands = collectStoredLinuxCommands();
    const bins = commands.map(extractBin).filter(Boolean);
    if (bins.length === 0) return;
    try {
      const current = await window.electronAPI.getAllowedBinaries();
      const merged = new Set(Array.isArray(current) ? current : []);
      bins.forEach(bin => merged.add(bin));
      const mergedList = [...merged];
      await window.electronAPI.setAllowedBinaries(mergedList);
      const textarea = document.getElementById('allowed_command_list');
      if (textarea) textarea.value = mergedList.join('\n');
    } catch (e) {
      console.error('Failed to sync allowed binaries:', e);
    }
  }

  async function ensureAllowedForCommand(command) {
    const bin = extractBin(command);
    if (!bin || !window.electronAPI || !window.electronAPI.getAllowedBinaries || !window.electronAPI.setAllowedBinaries) return;
    try {
      const current = await window.electronAPI.getAllowedBinaries();
      const list = Array.isArray(current) ? current : [];
      if (!list.includes(bin)) {
        list.push(bin);
        await window.electronAPI.setAllowedBinaries(list);
      }
    } catch (e) {
      console.error('Failed to update allowed binaries:', e);
    }
  }

  function collectStoredWebUrls() {
    const urls = [];
    try {
      const customApps = JSON.parse(localStorage.getItem(LS_KEYS.CUSTOM_APPS) || '[]');
      customApps.forEach(app => {
        if (app && app.url) urls.push(app.url);
      });
    } catch {}
    try {
      const folders = JSON.parse(localStorage.getItem(LS_KEYS.APP_FOLDERS) || '{}');
      Object.values(folders).forEach(folder => {
        if (!folder || !Array.isArray(folder.apps)) return;
        folder.apps.forEach(app => {
          if (app && app.url) urls.push(app.url);
        });
      });
    } catch {}
    return urls;
  }

  async function syncAllowedDomainsFromStorage() {
    if (!window.electronAPI || !window.electronAPI.getAllowedDomains || !window.electronAPI.setAllowedDomains) return;
    const urls = collectStoredWebUrls();
    const hosts = urls.map(normalizeHostname).filter(Boolean);
    if (hosts.length === 0) return;
    try {
      const current = await window.electronAPI.getAllowedDomains();
      const merged = new Set(Array.isArray(current) ? current : []);
      hosts.forEach(host => merged.add(host));
      const mergedList = [...merged];
      await window.electronAPI.setAllowedDomains(mergedList);
      allowedDomains = mergedList;
    } catch (e) {
      console.error('Failed to sync allowed domains:', e);
    }
  }

  async function ensureAllowedDomain(url) {
    const host = normalizeHostname(url);
    if (!host || !window.electronAPI || !window.electronAPI.getAllowedDomains || !window.electronAPI.setAllowedDomains) return;
    try {
      const current = await window.electronAPI.getAllowedDomains();
      const list = Array.isArray(current) ? current : [];
      if (!list.includes(host)) {
        list.push(host);
        await window.electronAPI.setAllowedDomains(list);
        allowedDomains = list;
      }
    } catch (e) {
      console.error('Failed to update allowed domains:', e);
    }
  }

  function init() {
    loadModeFromStorage();
    applySessionPolicy();
    syncAllowedDomainsFromMain();
    initSecurityModeSelector();
    initAllowedCommandsEditor();
    syncAllowlistFromStorage();
    syncAllowedDomainsFromStorage();
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    MODES,
    get mode() { return currentMode; },
    setMode: persistMode,
    sanitizeInput,
    isUrlAllowed,
    setSessionItem,
    getSessionItem,
    clearSession,
    applySessionPolicy,
    sanitizeUrlInput,
    sanitizeCommandInput,
    ensureAllowedForCommand,
    ensureAllowedDomain
  };
})();
