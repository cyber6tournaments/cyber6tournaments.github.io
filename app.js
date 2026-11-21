// ============================================================================
// CYBER 6 TOURNAMENT — ORGANIZER, VERIFICATION & PLATFORM ADMIN ENGINE (V9)
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore, doc, getDoc, collection, onSnapshot, setDoc, deleteDoc,
  writeBatch, serverTimestamp, query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9-Q2DGT3oRR4D4MaCt9zzfpk9wWBjBKA",
  authDomain: "cyber-6-tournaments.firebaseapp.com",
  projectId: "cyber-6-tournaments",
  storageBucket: "cyber-6-tournaments.firebasestorage.app",
  messagingSenderId: "1068153338223",
  appId: "1:1068153338223:web:e60287b8802a4ab28d909a",
  measurementId: "G-DZ7MMRD6WL"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const FOUNDER_ADMIN_EMAIL = "nikdjoraev0303@gmail.com";
const PLATFORM_DOMAIN = "https://cyber6tournaments.github.io";
const OFFICIAL_SPONSOR_NAME = "CYBER 6 Organization";
const OFFICIAL_SPONSOR_TG = "https://t.me/cyber6esports";

// ============================================================================
// СИСТЕМА ТЕМ (Black Orange & Blood Black Style)
// ============================================================================
let activeTheme = localStorage.getItem("c6e_active_theme") || "black-orange";
if (activeTheme !== "black-orange" && activeTheme !== "blood-black") activeTheme = "black-orange";
document.documentElement.setAttribute("data-theme", activeTheme);

function getThemeEmblemSVG(themeKey) {
  if (themeKey === "blood-black") {
    return `<svg width="26" height="26" viewBox="0 0 28 28" fill="none"><polygon points="14,2 25,8 25,20 14,26 3,20 3,8" fill="rgba(159,18,57,0.22)" stroke="#e11d48" stroke-width="1.6"/><path d="M14 6C14 6 19 12.2 19 15.8C19 18.6 16.8 20.8 14 20.8C11.2 20.8 9 18.6 9 15.8C9 12.2 14 6 14 6Z" fill="#be123c" stroke="#ffffff" stroke-width="1.2"/></svg>`;
  }
  return `<svg width="26" height="26" viewBox="0 0 28 28" fill="none"><polygon points="14,2 25,8 25,20 14,26 3,20 3,8" fill="rgba(184,67,9,0.24)" stroke="#d97736" stroke-width="1.6"/><polygon points="14,7 20,14 14,21 8,14" fill="#c95212" stroke="#ffffff" stroke-width="1.2"/></svg>`;
}

window.setPlatformTheme = (themeKey) => {
  activeTheme = themeKey === "blood-black" ? "blood-black" : "black-orange";
  document.documentElement.setAttribute("data-theme", activeTheme);
  try { localStorage.setItem("c6e_active_theme", activeTheme); } catch (e) {}
  renderGlassMorePopupTiles();
  window.showMirrorToast(`Тема переключена: ${activeTheme === "blood-black" ? "Blood Black Style" : "Black Orange"}`);
};

// ============================================================================
// ФОРМУЛЫ CYBER POINTS (CP)
// ============================================================================
export function calculatePlayerMatchCP(kdValue) {
  const kd = Math.max(0, Number(kdValue) || 0);
  if (kd < 0.80) return 25;
  if (kd <= 1.20) return Math.round(40 + ((kd - 0.80) / 0.40) * 60);
  if (kd < 1.25) return Math.round(100 + ((kd - 1.20) / 0.05) * 20);
  return Math.min(250, Math.round(120 + ((kd - 1.25) / 1.25) * 130));
}

export function calculateTeamMatchCP(roundDiff = 0, isTechWin = false) {
  if (isTechWin) return 25;
  return Math.min(120, 50 + Math.max(0, parseInt(roundDiff, 10) || 0) * 5);
}

// ============================================================================
// КАСТОМНЫЕ ЭМБЛЕМЫ (CP, SO2, VERIFIED, СОЦСЕТИ, 5 СТАТИСТИК)
// ============================================================================
function getCPEmblemSVG(size = 15) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><polygon points="12,1.5 21,6.8 21,17.2 12,22.5 3,17.2 3,6.8" fill="rgba(217,119,54,0.22)" stroke="#d97736" stroke-width="1.8"/><polygon points="12,6 16.5,12 12,18 7.5,12" fill="#ffffff"/></svg>`;
}

function getSO2EmblemSVG(size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 5.5v6.5c0 4.8 3.4 9.1 8 10.5 4.6-1.4 8-5.7 8-10.5V5.5L12 2z" fill="rgba(201,82,18,0.26)" stroke="#ffffff" stroke-width="1.6"/><path d="M9 9.5h6l-4.5 5H15" stroke="#d97736" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}


function getDevBadgeHTML() {
  return `<span class="c6e-dev-pill" title="Официальный разработчик платформы"><svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polygon points="12,1.5 21,6.5 21,17.5 12,22.5 3,17.5 3,6.5" fill="#d97706" stroke="#fde047" stroke-width="1.8"/><path d="M8.5 12.2l2.3 2.3 4.8-5.1" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>DEV</span>`;
}

function getOfficialCheckSVG(size = 14, title = "Подтверждённый статус") {
  return `<span class="c6e-badge-inline" title="${title}"><svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><polygon points="12,1.5 20.5,6.5 20.5,17.5 12,22.5 3.5,17.5 3.5,6.5" fill="#0ea5e9" stroke="#bae6fd" stroke-width="1.7"/><path d="M8.2 12.2l2.5 2.5 5.1-5.4" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
}

function renderUserBadgesHTML(u) {
  if (!u) return "";
  let out = "";
  const isDev = Boolean(u.hasDevBadge || String(u.email || "").toLowerCase() === FOUNDER_ADMIN_EMAIL);
  if (isDev) out += getDevBadgeHTML();
  if (u.verifiedBadge) out += getOfficialCheckSVG(14, "Верифицированный игрок");
  return out;
}

function renderClanBadgeHTML(c) {
  if (!c || !c.verifiedBadge) return "";
  return getOfficialCheckSVG(15, "Официально верифицированная команда");
}

function normalizeSafeUserObj(raw, fbUser = null) {
  const email = String(raw?.email || fbUser?.email || "").toLowerCase();
  const isFounder = email === FOUNDER_ADMIN_EMAIL;
  const fallbackNick = isFounder ? "Kas" : ((email.split("@")[0] || "Player").replace(/[^A-Za-z0-9_]/g, "").slice(0, 14) || "Player");
  const nick = (raw && raw.nick && raw.nick !== "undefined") ? raw.nick : fallbackNick;
  const regLoc = detectUserRegionData();
  return {
    uid: raw?.uid || fbUser?.uid || "",
    username: raw?.username || nick.toLowerCase(),
    email: raw?.email || fbUser?.email || "",
    nick,
    accountType: raw?.accountType || "player",
    isAdmin: Boolean(isFounder || raw?.isAdmin),
    hasDevBadge: Boolean(isFounder || raw?.hasDevBadge),
    verifiedBadge: Boolean(raw?.verifiedBadge),
    isVerifiedOrganizer: Boolean(isFounder || raw?.isVerifiedOrganizer || raw?.organizerStatus === "verified"),
    organizerStatus: raw?.organizerStatus || (isFounder ? "verified" : null),
    orgName: raw?.orgName || "",
    orgSocials: raw?.orgSocials || {},
    orgStaff: Array.isArray(raw?.orgStaff) ? raw.orgStaff : [],
    subscribers: Array.isArray(raw?.subscribers) ? raw.subscribers : [],
    so2Id: raw?.so2Id || (isFounder ? "C6E-000001" : ""),
    so2IdUpdatedAt: raw?.so2IdUpdatedAt || 0,
    so2IdChangeRequested: Boolean(raw?.so2IdChangeRequested),
    so2ProfileLink: raw?.so2ProfileLink || "",
    age: raw?.age || "",
    region: raw?.region || regLoc.label,
    regionFlag: raw?.regionFlag || regLoc.flag,
    playRole: raw?.playRole || (isFounder ? "Капитан (IGL)" : "Рифлер / Энтри"),
    avatar: raw?.avatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(nick)}&backgroundColor=9a3412`,
    banner: raw?.banner || "",
    provider: raw?.provider || "Firebase Auth",
    clanId: raw?.clanId || null,
    cp: Number(raw?.cp || 0),
    kills: Number(raw?.kills ?? raw?.stats?.kills ?? 0),
    deaths: Number(raw?.deaths ?? raw?.stats?.deaths ?? 0),
    wins: Number(raw?.wins ?? raw?.stats?.wins ?? 0),
    losses: Number(raw?.losses ?? raw?.stats?.losses ?? 0),
    matchesPlayed: Number(raw?.matchesPlayed ?? raw?.stats?.matchesPlayed ?? 0),
    banned: Boolean(raw?.banned),
    profileCompleted: Boolean(raw?.profileCompleted || isFounder),
    stats: {
      kd: raw?.stats?.kd || "0.00",
      kills: Number(raw?.stats?.kills ?? raw?.kills ?? 0),
      deaths: Number(raw?.stats?.deaths ?? raw?.deaths ?? 0),
      impact: Number(raw?.stats?.impact ?? 0),
      matchesPlayed: Number(raw?.stats?.matchesPlayed ?? raw?.matchesPlayed ?? 0),
      wins: Number(raw?.stats?.wins ?? raw?.wins ?? 0),
      losses: Number(raw?.stats?.losses ?? raw?.losses ?? 0)
    },
    matchHistory: Array.isArray(raw?.matchHistory) ? raw.matchHistory : []
  };
}

function getVerifiedOrgCheckSVG(size = 13) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><polygon points="12,1.5 20.5,6.5 20.5,17.5 12,22.5 3.5,17.5 3.5,6.5" fill="#15803d" stroke="#86efac" stroke-width="1.6"/><path d="M8.5 12.2l2.4 2.4 4.8-5.2" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function getSocialPlatformMeta(key) {
  const map = {
    vk: { name: "VK", icon: "fab fa-vk", color: "#3b82f6" },
    tg: { name: "Telegram", icon: "fab fa-telegram-plane", color: "#38bdf8" },
    yt: { name: "YouTube", icon: "fab fa-youtube", color: "#ef4444" },
    tt: { name: "TikTok", icon: "fab fa-tiktok", color: "#f8fafc" }
  };
  return map[key] || { name: key.toUpperCase(), icon: "fas fa-globe", color: "#ffffff" };
}

function getStatCustomEmblemSVG(type) {
  if (type === "live") return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3" fill="var(--accent-bright)" stroke="var(--accent-bright)"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4"/><path d="M19.1 4.9a10 10 0 0 1 0 14.2" opacity="0.5"/><path d="M4.9 19.1a10 10 0 0 1 0-14.2" opacity="0.5"/></svg>`;
  if (type === "players") return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 20 6.5 20 17.5 12 22 4 17.5 4 6.5" stroke="rgba(255,255,255,0.4)"/><circle cx="12" cy="9.5" r="2.6" stroke="var(--accent-soft)"/><path d="M7.5 16.5c1.1-1.9 2.7-2.6 4.5-2.6s3.4.7 4.5 2.6"/></svg>`;
  if (type === "clans") return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L4 5.5v6c0 5.1 3.4 9.7 8 10.9 4.6-1.2 8-5.8 8-10.9v-6L12 2z"/><path d="M12 7v9" stroke="var(--accent-soft)"/><path d="M8.5 11.5L12 8.5l3.5 3"/></svg>`;
  if (type === "matches") return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="6" stroke="var(--accent-soft)"/><line x1="12" y1="18" x2="12" y2="22" stroke="var(--accent-soft)"/><line x1="2" y1="12" x2="6" y2="12" stroke="var(--accent-soft)"/><line x1="18" y1="12" x2="22" y2="12" stroke="var(--accent-soft)"/><circle cx="12" cy="12" r="2" fill="#ffffff"/></svg>`;
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-soft)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 20 8 17 20 7 20 4 8" fill="var(--accent-glow)"/><path d="M9 12h6M12 9v6" stroke="#ffffff"/></svg>`;
}

function buildDynamicCircularGauge({ id, size, strokeWidth, pct, centerValue, centerSub, label, isPositive, elevated = false }) {
  const r = (size / 2) - strokeWidth - 2;
  const circ = 2 * Math.PI * r;
  const clampedPct = Math.max(0, Math.min(100, pct));
  const offset = (circ - (circ * clampedPct) / 100).toFixed(1);
  const gradId = `gaugeGrad_${id}`;
  const c1 = isPositive ? "#15803d" : "#c2410c";
  const c2 = isPositive ? "#065f46" : "#7c2d12";
  const numFontSize = Math.round(size * 0.18);

  return `
    <div class="gauge-item ${elevated ? 'center-elevated' : ''}">
      <div class="gauge-ring-wrap" style="width:${size}px; height:${size}px;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <defs>
            <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${c1}"/>
              <stop offset="100%" stop-color="${c2}"/>
            </linearGradient>
          </defs>
          <circle class="gauge-track-neg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${strokeWidth}"></circle>
          <circle class="gauge-arc-pos" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="url(#${gradId})" stroke-width="${strokeWidth}" stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="gauge-center-readout">
          <span class="gauge-val-num" style="font-size:${numFontSize}px;">${escapeHTML(centerValue)}</span>
          ${centerSub ? `<span class="gauge-val-sub">${escapeHTML(centerSub)}</span>` : ''}
        </div>
      </div>
      <div class="gauge-title-lbl">${escapeHTML(label)}</div>
    </div>
  `;
}

// ============================================================================
// ВАЛИДАЦИЯ РЕГИСТРАЦИИ
// ============================================================================
const FORBIDDEN_PROFANITY = [
  "fuck", "shit", "bitch", "dick", "cock", "pussy", "cunt", "whore", "slut", "bastard",
  "asshole", "nigger", "nigga", "faggot", "retard", "nazi", "hitler", "porn", "sex",
  "blya", "blyat", "blyad", "suka", "cyka", "nahui", "nahuy", "naxui", "pizd", "pizda",
  "ebat", "ebal", "eban", "yebat", "huy", "hui", "xuy", "xui", "pidor", "pidar",
  "gandon", "gondon", "mudak", "zalupa", "shlyuha", "shluha", "dolboeb", "dalbaeb",
  "mraz", "tvar", "uebok", "uyebok", "chmo", "loh", "lox", "sosat", "sosi", "mamku", "admin"
];

function containsProfanity(rawText = "") {
  const normalized = String(rawText).toLowerCase()
    .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t")
    .replace(/[^a-z]/g, "");
  return FORBIDDEN_PROFANITY.some(bad => normalized.includes(bad));
}

function validateNicknameLive(nick, excludeUid = null) {
  const val = String(nick || "").trim();
  const latinOnly = /^[A-Za-z]+$/.test(val);
  const lengthOk = val.length >= 3 && val.length <= 16;
  const cleanWords = val.length > 0 ? !containsProfanity(val) : true;
  const isUnique = val.length > 0
    ? !cloudUsers.some(u => u.uid !== excludeUid && String(u.nick || "").toLowerCase() === val.toLowerCase())
    : true;
  return { val, latinOnly, lengthOk, cleanWords, isUnique, ok: latinOnly && lengthOk && cleanWords && isUnique };
}

function validatePasswordLive(pass) {
  const val = String(pass || "");
  const allowedChars = /^[A-Za-z0-9]+$/.test(val);
  const minLen = val.length >= 6;
  const hasUpper = /[A-Z]/.test(val);
  const hasLower = /[a-z]/.test(val);
  const hasDigit = /[0-9]/.test(val);
  return { val, allowedChars, minLen, hasUpper, hasLower, hasDigit, ok: allowedChars && minLen && hasUpper && hasLower && hasDigit };
}

function detectUserRegionData() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("Bishkek") || tz.includes("Osh")) return { code: "KG", flag: "🇰🇬", label: "Кыргызстан" };
    if (tz.includes("Almaty") || tz.includes("Aqtobe") || tz.includes("Qyzylorda") || tz.includes("Oral")) return { code: "KZ", flag: "🇰🇿", label: "Казахстан" };
    if (tz.includes("Tashkent") || tz.includes("Samarkand")) return { code: "UZ", flag: "🇺🇿", label: "Узбекистан" };
    if (tz.includes("Minsk")) return { code: "BY", flag: "🇧🇾", label: "Беларусь" };
    if (tz.includes("Kiev") || tz.includes("Kyiv")) return { code: "UA", flag: "🇺🇦", label: "Украина" };
    if (tz.includes("Moscow") || tz.includes("Samara") || tz.includes("Yekaterinburg") || tz.includes("Novosibirsk")) return { code: "RU", flag: "🇷🇺", label: "Россия" };
    if (tz.includes("Europe")) return { code: "EU", flag: "🇪🇺", label: "Европа" };
    return { code: "CIS", flag: "🌐", label: "CIS / Global" };
  } catch (e) { return { code: "CIS", flag: "🌐", label: "CIS / Global" }; }
}

function getFlagByRegionString(regionStr = "") {
  const s = String(regionStr).toLowerCase();
  if (s.includes("кыргыз") || s.includes("bishkek") || s.includes("kg")) return "🇰🇬";
  if (s.includes("казах") || s.includes("almaty") || s.includes("kz")) return "🇰🇿";
  if (s.includes("узбек") || s.includes("tashkent") || s.includes("uz")) return "🇺🇿";
  if (s.includes("белар") || s.includes("minsk") || s.includes("by")) return "🇧🇾";
  if (s.includes("украин") || s.includes("kyiv") || s.includes("ua")) return "🇺🇦";
  if (s.includes("росси") || s.includes("moscow") || s.includes("ru")) return "🇷🇺";
  if (s.includes("европ") || s.includes("eu")) return "🇪🇺";
  return "🌐";
}

// ============================================================================
// ХРАНИЛИЩЕ ДАННЫХ ПЛАТФОРМЫ
// ============================================================================
let cloudUsers = [];

let cloudClans = [];
let cloudTournaments = [];
let cloudMatches = [];
let cloudTickets = [];
let cloudGlobalChat = [];
let cloudDirectMessages = [];
let cloudNotifications = [];
let teamsFilterMode = "all"; // "all" | "open" | "invites"
let activeChatMode = "global"; // "global" | "dm"
let activeDmPeerUid = null;

let currentUser = null;
let viewedProfileUid = null;
let viewedClanId = null;
let authTabMode = "login";
let registerAccountType = "player"; // "player" | "organizer"
let isPasswordVisible = false;
let currentRoute = "/feed";
let isEditingPlayerProfile = false;
let orgSelectedSocials = { vk: false, tg: true, yt: false, tt: false };

let teamSearchQuery = "";
let tournamentFilterFormat = "ALL";
let activeTournamentId = null;
let matchTabFilter = "live";
let leaderboardTab = "players";
let organizerPanelTab = "tournaments"; // "tournaments" | "create" | "staff"
let adminPanelTab = "verify"; // "verify" | "official" | "requests" | "users"
let detectedRefreshHz = 60;

// Проверка прав доступа к Панели Организатора
function canUserAccessOrganizerPanel(userObj) {
  if (!userObj) return false;
  if (userObj.isAdmin) return true;
  if (userObj.accountType === "organizer" && userObj.organizerStatus === "verified") return true;
  // Простой игрок, назначенный администратором или судьёй хотя бы одного турнира/организации
  const isAppointedStaff = cloudUsers.some(org =>
    org.accountType === "organizer" &&
    Array.isArray(org.orgStaff) &&
    org.orgStaff.some(s => s.uid === userObj.uid)
  );
  return isAppointedStaff;
}

function getManageableOrganizations(userObj) {
  if (!userObj) return [];
  if (userObj.accountType === "organizer" && userObj.organizerStatus === "verified") return [userObj];
  return cloudUsers.filter(org =>
    org.accountType === "organizer" &&
    Array.isArray(org.orgStaff) &&
    org.orgStaff.some(s => s.uid === userObj.uid)
  );
}

const escapeHTML = (str) => String(str || "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

function compressPhoneImageToDataUrl(file, maxSize = 260, quality = 0.84) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h && w > maxSize) { h = Math.round((h * maxSize) / w); w = maxSize; }
        else if (h >= w && h > maxSize) { w = Math.round((w * maxSize) / h); h = maxSize; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("phonePlayerAvatarInput")?.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file || !currentUser) return;
  try {
    currentUser.avatar = await compressPhoneImageToDataUrl(file, 260, 0.85);
    saveCurrentUserEverywhere();
    window.showMirrorToast(currentUser.accountType === "organizer" ? "Логотип организации обновлён!" : "Аватарка профиля обновлена!");
  } catch (err) { window.showMirrorToast("Не удалось обработать фото", true); }
});

document.getElementById("phoneProfileBannerInput")?.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file || !currentUser) return;
  try {
    currentUser.banner = await compressPhoneImageToDataUrl(file, 920, 0.82);
    saveCurrentUserEverywhere();
    window.showMirrorToast("Баннер установлен!");
  } catch (err) { window.showMirrorToast("Не удалось загрузить баннер", true); }
});

document.getElementById("phoneClanAvatarInput")?.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file || !currentUser) return;
  try {
    const dataUrl = await compressPhoneImageToDataUrl(file, 260, 0.85);
    const myClan = getPlayerClan(currentUser);
    if (myClan) { myClan.logo = dataUrl; await syncArenaDataToCloud(); renderAllStageSections(); window.showMirrorToast("Логотип клана обновлён!"); }
    else { window._pendingClanLogoDataUrl = dataUrl; const el = document.getElementById("clan-logo-form-preview"); if (el) el.src = dataUrl; }
  } catch (err) { window.showMirrorToast("Ошибка чтения изображения", true); }
});

document.getElementById("phoneClanBannerInput")?.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file || !currentUser) return;
  try {
    const dataUrl = await compressPhoneImageToDataUrl(file, 920, 0.82);
    const myClan = getPlayerClan(currentUser);
    if (myClan) { myClan.banner = dataUrl; await syncArenaDataToCloud(); renderAllStageSections(); window.showMirrorToast("Баннер клана установлен!"); }
  } catch (err) { window.showMirrorToast("Не удалось загрузить баннер клана", true); }
});

window.triggerPhonePlayerAvatarUpload = () => document.getElementById("phonePlayerAvatarInput")?.click();
window.triggerPhoneProfileBannerUpload = () => document.getElementById("phoneProfileBannerInput")?.click();
window.triggerPhoneClanAvatarUpload = () => document.getElementById("phoneClanAvatarInput")?.click();
window.triggerPhoneClanBannerUpload = () => document.getElementById("phoneClanBannerInput")?.click();

let _pendingTabScreenshotTarget = null;
document.getElementById("matchTabScreenshotInput")?.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file || !_pendingTabScreenshotTarget) return;
  try {
    const dataUrl = await compressPhoneImageToDataUrl(file, 880, 0.80);
    const trn = cloudTournaments.find(t => t.id === _pendingTabScreenshotTarget.tId);
    const match = trn ? findMatchInTournament(trn, _pendingTabScreenshotTarget.mId) : null;
    if (match) {
      match.tabScreenshot = dataUrl;
      syncArenaDataToCloud();
      renderTournamentsSection();
      window.showMirrorToast("Скриншот Таба успешно прикреплён к матчу!");
    }
  } catch (err) { window.showMirrorToast("Не удалось загрузить скриншот Таба", true); }
});


let _pendingTournamentBannerId = null;
document.getElementById("tournamentBannerInput")?.addEventListener("change", async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file || !_pendingTournamentBannerId) return;
  try {
    const dataUrl = await compressPhoneImageToDataUrl(file, 960, 0.82);
    const trn = cloudTournaments.find(t => t.id === _pendingTournamentBannerId);
    if (trn) {
      trn.banner = dataUrl;
      appendTournamentAuditLog(trn, "Обновлён баннер (обложка) турнира");
      syncArenaDataToCloud();
      renderAllStageSections();
      window.showMirrorToast("Баннер турнира установлен!");
    }
  } catch (err) { window.showMirrorToast("Не удалось загрузить баннер турнира", true); }
});

window.triggerTournamentBannerUpload = (tId) => {
  _pendingTournamentBannerId = tId;
  document.getElementById("tournamentBannerInput")?.click();
};

window.toggleMatchPause = (tId, matchId, side) => {
  if (!currentUser) return window.goRoute("/authorization");
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, matchId) : null;
  if (!trn || !match) return;

  if (side === "RESUME") {
    if (match.pausedAt) {
      match.pausedAccumMs = (match.pausedAccumMs || 0) + (Date.now() - match.pausedAt);
      match.pausedAt = null;
    }
    match.isPaused = false;
    match.pauseInfo = "";
    appendTournamentAuditLog(trn, `Пауза снята (${match.teamA?.name || 'A'} vs ${match.teamB?.name || 'B'})`);
    syncArenaDataToCloud();
    renderTournamentsSection();
    return window.showMirrorToast("Матч возобновлён!");
  }

  match.pausesA = match.pausesA || 0;
  match.pausesB = match.pausesB || 0;
  if (side === "A" && match.pausesA >= 2) return window.showMirrorToast("Команда A исчерпала лимит пауз (2/2)!", true);
  if (side === "B" && match.pausesB >= 2) return window.showMirrorToast("Команда B исчерпала лимит пауз (2/2)!", true);

  if (side === "A") match.pausesA += 1;
  else match.pausesB += 1;
  match.isPaused = true;
  if (!match.pausedAt) match.pausedAt = Date.now();
  match.pauseInfo = `Пауза стороны ${side} (${side === 'A' ? match.pausesA : match.pausesB}/2) • запросил ${currentUser.nick}`;
  appendTournamentAuditLog(trn, match.pauseInfo);
  syncArenaDataToCloud();
  renderTournamentsSection();
  window.showMirrorToast("Пауза активирована!");
};


function getStageBadgeHTML(stage) {
  const st = stage || "registration";
  const labels = {
    registration: "РЕГИСТРАЦИЯ",
    checkin: "CHECK-IN",
    live: "● LIVE",
    finished: "ЗАВЕРШЁН"
  };
  return `<span class="trn-stage-tag st-${st}">${labels[st] || st.toUpperCase()}</span>`;
}

// Поиск ближайшего активного матча текущего игрока/клана в турнире
function findMyActiveMatchInTournament(trn) {
  if (!trn || !trn.bracketData || !currentUser) return null;
  const myClan = getPlayerClan(currentUser);
  const myId = trn.format === "1v1" ? currentUser.uid : (myClan ? myClan.id : currentUser.uid);
  const all = [...(trn.bracketData.rounds || []), ...(trn.bracketData.lowerRounds || [])].flat();
  return all.find(m => m.status !== "finished" && ((m.teamA && m.teamA.id === myId) || (m.teamB && m.teamB.id === myId))) || null;
}

// Зафиксировать результат одной карты в серии BO3 / BO5

// ============================================================================
// V26: ТОЧНАЯ СИСТЕМА СЕРИЙ (BO1 / BO2 / BO3 / BO5) И ЖИВОЙ ТАЙМЕР МАТЧА
// ============================================================================
function getEffectiveMatchSeriesFormat(trn, match) {
  const base = (trn && trn.seriesFormat) || "BO1";
  const sf = trn && trn.stageFormats;
  if (!sf || !match) return base;
  const rn = String(match.roundName || "").toLowerCase();
  if (rn.includes("финал") && !rn.includes("полу") && !rn.includes("четверть") && !rn.includes("1/2") && !rn.includes("1/4")) {
    return sf.final || base;
  }
  if (rn.includes("полуфинал") || rn.includes("1/2") || rn.includes("1/4") || rn.includes("четверть")) {
    return sf.playoff || base;
  }
  if (rn.includes("1/16") || rn.includes("1/8") || rn.includes("квал")) {
    return sf.early || base;
  }
  return base;
}

function getSeriesRulesMeta(fmt) {
  const f = String(fmt || "BO1").toUpperCase();
  if (f === "BO2") return { code: "BO2", maxMaps: 2, winsNeeded: 2, allowDraw: true, label: "BO2 • 2 КАРТЫ (2:0 ИЛИ 1:1)" };
  if (f === "BO3") return { code: "BO3", maxMaps: 3, winsNeeded: 2, allowDraw: false, label: "BO3 • ДО 2 ПОБЕД" };
  if (f === "BO5") return { code: "BO5", maxMaps: 5, winsNeeded: 3, allowDraw: false, label: "BO5 • ДО 3 ПОБЕД" };
  return { code: "BO1", maxMaps: 1, winsNeeded: 1, allowDraw: false, label: "BO1 • 1 КАРТА" };
}

function formatElapsedClock(ms) {
  const totalSec = Math.max(0, Math.floor((ms || 0) / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

function getMatchElapsedMs(match) {
  if (!match) return 0;
  if (match.status === "finished" && typeof match.durationSec === "number") {
    return match.durationSec * 1000;
  }
  if (!match.startedAt) return 0;
  const endRef = match.status === "finished"
    ? (match.finishedAt || Date.now())
    : (match.isPaused && match.pausedAt ? match.pausedAt : Date.now());
  return Math.max(0, endRef - match.startedAt - (match.pausedAccumMs || 0));
}


function advanceWinnerToNextRound(trn, match, winnerObj) {
  if (!trn || !trn.bracketData || !match || !winnerObj) return;
  const loserObj = match.winner === "A" ? match.teamB : match.teamA;
  if (match.bracketSide === "upper" && trn.bracketData.rounds && trn.bracketData.rounds[match.roundIdx + 1]) {
    const nextM = trn.bracketData.rounds[match.roundIdx + 1][Math.floor(match.matchIdx / 2)];
    if (nextM) {
      if (match.matchIdx % 2 === 0) nextM.teamA = winnerObj;
      else nextM.teamB = winnerObj;
    }
  }
  if (trn.bracketType === "Double Elimination" && match.bracketSide === "upper" && match.roundIdx === 0 && loserObj && trn.bracketData.lowerRounds?.[0]) {
    const lowerM = trn.bracketData.lowerRounds[0][Math.floor(match.matchIdx / 2)];
    if (lowerM) {
      if (match.matchIdx % 2 === 0) lowerM.teamA = loserObj;
      else lowerM.teamB = loserObj;
    }
  }
  if (match.roundName === "ГРАНД-ФИНАЛ") {
    trn.champion = winnerObj;
    trn.runnerUp = loserObj || null;
  }
}

function lockMatchFinalDuration(match) {
  if (!match) return;
  const now = Date.now();
  if (!match.startedAt) match.startedAt = now;
  match.finishedAt = now;
  match.finishedTimeLabel = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const elapsedMs = Math.max(0, now - match.startedAt - (match.pausedAccumMs || 0));
  match.durationSec = Math.floor(elapsedMs / 1000);
  match.durationFormatted = formatElapsedClock(elapsedMs);
}

window.startMatchLiveTimer = (tId, matchId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, matchId) : null;
  if (!trn || !match || !currentUser) return;
  if (!canModerateBracket(getUserRoleInTournament(currentUser, trn))) {
    return window.showMirrorToast("Запустить таймер и LIVE-матч может судья или организатор!", true);
  }
  const now = Date.now();
  if (!match.startedAt) {
    match.startedAt = now;
    match.startedTimeLabel = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    match.pausedAccumMs = 0;
  }
  if (match.isPaused && match.pausedAt) {
    match.pausedAccumMs = (match.pausedAccumMs || 0) + (now - match.pausedAt);
    match.pausedAt = null;
    match.isPaused = false;
  }
  match.status = "live";
  appendTournamentAuditLog(trn, `▶ Матч переведён в LIVE (${match.startedTimeLabel}), запущен таймер игры.`);
  syncLiveMatchesRegistry();
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast("Таймер игры запущен! Матч выведен в LIVE.");
};

let _pendingSeriesTabTarget = null;

window.uploadSeriesMapTab = (tId, matchId, mapIdx) => {
  if (!currentUser) return window.goRoute("/authorization");
  _pendingSeriesTabTarget = { tId, matchId, mapIdx };
  let inp = document.getElementById("c6e-series-map-tab-input");
  if (!inp) {
    inp = document.createElement("input");
    inp.type = "file";
    inp.id = "c6e-series-map-tab-input";
    inp.accept = "image/*";
    inp.style.display = "none";
    document.body.appendChild(inp);
    inp.onchange = (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file || !_pendingSeriesTabTarget) return;
      const { tId: curT, matchId: curM, mapIdx: curIdx } = _pendingSeriesTabTarget;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const trn = cloudTournaments.find(t => t.id === curT);
        const match = trn ? findMatchInTournament(trn, curM) : null;
        if (!trn || !match) return;
        match.seriesMaps = Array.isArray(match.seriesMaps) ? match.seriesMaps : [];
        const existing = match.seriesMaps[curIdx] || {};
        match.seriesMaps[curIdx] = {
          ...existing,
          mapIndex: curIdx,
          map: existing.map || match.map || OFFICIAL_SO2_MAPS[curIdx % OFFICIAL_SO2_MAPS.length],
          tabScreenshot: dataUrl,
          uploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        match.tabScreenshot = dataUrl;
        syncArenaDataToCloud();
        renderAllStageSections();
        window.showMirrorToast(`Таб Карты ${curIdx + 1} загружен! Введите счёт или запустите OCR-сканер.`);
      };
      reader.readAsDataURL(file);
      inp.value = "";
    };
  }
  inp.click();
};

window.submitSeriesMapScoreModal = (e, tId, matchId, mapIdx) => {
  e.preventDefault();
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, matchId) : null;
  if (!trn || !match || !currentUser) return;
  const rules = getSeriesRulesMeta(getEffectiveMatchSeriesFormat(trn, match));
  const curSlot = (match.seriesMaps && match.seriesMaps[mapIdx]) || {};
  const mapName = (document.getElementById("sm-map-sel")?.value || curSlot.map || "Sandstone").trim();
  const sA = Math.max(0, parseInt(document.getElementById("sm-score-a")?.value || "0", 10) || 0);
  const sB = Math.max(0, parseInt(document.getElementById("sm-score-b")?.value || "0", 10) || 0);
  if (sA === sB) return window.showMirrorToast("В Standoff 2 карта не может закончиться вничью!", true);

  const now = Date.now();
  if (!match.startedAt) {
    match.startedAt = now;
    match.startedTimeLabel = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
  match.seriesMaps = Array.isArray(match.seriesMaps) ? match.seriesMaps : [];
  match.seriesMaps[mapIdx] = {
    ...curSlot,
    mapIndex: mapIdx,
    map: mapName,
    scoreA: sA,
    scoreB: sB,
    winner: sA > sB ? "A" : "B",
    finishedTime: new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    elapsedAtFinish: formatElapsedClock(getMatchElapsedMs(match))
  };

  const completed = match.seriesMaps.filter(x => x && x.winner);
  const wonA = completed.filter(x => x.winner === "A").length;
  const wonB = completed.filter(x => x.winner === "B").length;
  match.scoreA = rules.code === "BO1" ? sA : wonA;
  match.scoreB = rules.code === "BO1" ? sB : wonB;
  match.map = mapName;

  appendTournamentAuditLog(trn, `${rules.code} Карта ${mapIdx + 1} (${mapName}): ${sA}:${sB} → счёт серии ${wonA}:${wonB}`);

  let seriesClosed = false;
  if (wonA >= rules.winsNeeded || wonB >= rules.winsNeeded) {
    match.winner = wonA >= rules.winsNeeded ? "A" : "B";
    match.status = "finished";
    lockMatchFinalDuration(match);
    seriesClosed = true;
    advanceWinnerToNextRound(trn, match, match.winner === "A" ? match.teamA : match.teamB);
  } else if (rules.allowDraw && completed.length >= rules.maxMaps) {
    match.winner = "DRAW";
    match.status = "finished";
    lockMatchFinalDuration(match);
    seriesClosed = true;
  }

  window.closeSiteGlassModal();
  syncLiveMatchesRegistry();
  syncArenaDataToCloud();
  renderAllStageSections();
  if (seriesClosed) {
    window.showMirrorToast(`Серия ${rules.code} завершена (${wonA}:${wonB})! Время игры: ${match.durationFormatted}.`);
  } else {
    window.showMirrorToast(`Карта ${mapIdx + 1} зафиксирована (${sA}:${sB}). Счёт серии: ${wonA}:${wonB}!`);
  }
};

window.confirmSeriesMapScore = (tId, matchId, mapIdx) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, matchId) : null;
  if (!trn || !match || !currentUser) return;
  if (!canModerateBracket(getUserRoleInTournament(currentUser, trn))) {
    return window.showMirrorToast("Подтвердить итоговый счёт карты может судья или организатор!", true);
  }
  const curSlot = (match.seriesMaps && match.seriesMaps[mapIdx]) || {};
  const curMap = curSlot.map || match.map || "Sandstone";
  openSiteGlassModal(
    `ИТОГ КАРТЫ №${mapIdx + 1}`,
    `
      <form onsubmit="window.submitSeriesMapScoreModal(event, '${tId}', '${matchId}', ${mapIdx})" style="display:flex; flex-direction:column; gap:10px;">
        <div>
          <label class="auth-label">Карта Standoff 2</label>
          <select id="sm-map-sel" class="auth-input" style="padding:9px 12px;">
            ${OFFICIAL_SO2_MAPS.map(mp => `<option value="${mp}" ${mp === curMap ? 'selected' : ''}>${mp}</option>`).join("")}
          </select>
        </div>
        <div class="c6e-modal-field-row">
          <div>
            <label class="auth-label">${escapeHTML(getMatchSideName(match.teamA))}</label>
            <input type="number" id="sm-score-a" class="auth-input" style="padding:9px 12px;" min="0" max="30" value="${curSlot.scoreA ?? 13}" required>
          </div>
          <div>
            <label class="auth-label">${escapeHTML(getMatchSideName(match.teamB))}</label>
            <input type="number" id="sm-score-b" class="auth-input" style="padding:9px 12px;" min="0" max="30" value="${curSlot.scoreB ?? 0}" required>
          </div>
        </div>
        <button type="submit" class="auth-submit-btn">ЗАФИКСИРОВАТЬ СЧЁТ КАРТЫ</button>
      </form>
    `
  );
};

function renderMatchTimerBarHTML(trn, match, isMod) {
  const elapsed = formatElapsedClock(getMatchElapsedMs(match));
  const isLive = match.status === "live" && !match.isPaused;
  const isPaused = Boolean(match.isPaused);
  const isDone = match.status === "finished";
  const clockCls = isLive ? "is-live" : (isPaused ? "is-paused" : "");
  const statusLbl = isDone
    ? `✓ ЗАВЕРШЁН • ДЛИТЕЛЬНОСТЬ: ${escapeHTML(match.durationFormatted || elapsed)}`
    : (isPaused
      ? `⏸ ПАУЗА • ВРЕМЯ ИГРЫ: ${elapsed}`
      : (isLive
        ? `● ИДЁТ ИГРА: ${elapsed}`
        : `⏱ ОЖИДАНИЕ СТАРТА (00:00)`));

  return `
    <div class="match-timer-bar">
      <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
        <span class="match-timer-clock ${clockCls}" data-live-timer-match="${escapeHTML(match.id)}" data-trn-id="${escapeHTML(trn.id)}">
          ${statusLbl}
        </span>
        ${match.startedTimeLabel ? `<span class="glass-pill-badge">Старт: ${escapeHTML(match.startedTimeLabel)}</span>` : ''}
        ${match.finishedTimeLabel ? `<span class="glass-pill-badge">Финиш: ${escapeHTML(match.finishedTimeLabel)}</span>` : ''}
      </div>
      ${isMod && !isDone ? `
        <button type="button" class="auth-submit-btn" style="width:auto; padding:6px 12px; font-size:9.5px;" onclick="window.startMatchLiveTimer('${trn.id}', '${match.id}')">
          ${isLive ? '● Таймер идёт' : '▶ Старт таймера / LIVE'}
        </button>
      ` : ''}
    </div>
  `;
}

function renderSeriesMapStepperHTML(trn, match, isMod) {
  const fmt = getEffectiveMatchSeriesFormat(trn, match);
  const rules = getSeriesRulesMeta(fmt);
  const maps = Array.isArray(match.seriesMaps) ? match.seriesMaps : [];
  const wonA = maps.filter(x => x && x.winner === "A").length;
  const wonB = maps.filter(x => x && x.winner === "B").length;
  const seriesDecided = match.status === "finished" || wonA >= rules.winsNeeded || wonB >= rules.winsNeeded || (rules.allowDraw && maps.filter(x => x && x.winner).length >= rules.maxMaps);

  let currentActiveIdx = -1;
  if (!seriesDecided) {
    for (let i = 0; i < rules.maxMaps; i++) {
      if (!maps[i] || !maps[i].winner) { currentActiveIdx = i; break; }
    }
  }

  const slotsHTML = Array.from({ length: rules.maxMaps }, (_, idx) => {
    const slot = maps[idx] || null;
    const isDone = Boolean(slot && slot.winner);
    const isCurrent = !seriesDecided && idx === currentActiveIdx;
    const isSkipped = seriesDecided && !isDone;
    const cls = isDone ? "is-done" : (isCurrent ? "is-current" : (isSkipped ? "is-skipped" : ""));
    const mapTitle = idx === rules.maxMaps - 1 && rules.maxMaps >= 3 ? `Карта ${idx + 1} (Десайдер)` : `Карта ${idx + 1}`;

    return `
      <div class="series-slot-card ${cls}">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
          <b style="font-family:var(--font-display); font-size:10.5px; color:#ffffff;">${mapTitle}</b>
          ${isDone ? `<span style="font-size:10px; color:#86efac; font-weight:800;">✓ ${slot.scoreA}:${slot.scoreB}</span>`
            : (isCurrent ? `<span style="font-size:9.5px; color:var(--accent-soft); font-weight:800;">● ТЕКУЩАЯ</span>`
              : (isSkipped ? `<span style="font-size:9.5px; color:var(--white-dim);">Не нужна</span>`
                : `<span style="font-size:9.5px; color:var(--white-dim);">Ожидание</span>`))}
        </div>
        ${slot && slot.map ? `<div style="font-size:11px; color:var(--white-soft);">${escapeHTML(slot.map)} ${slot.finishedTime ? `• ${escapeHTML(slot.finishedTime)}` : ''}</div>` : ''}
        ${slot && slot.tabScreenshot ? `<img src="${slot.tabScreenshot}" class="series-slot-thumb" onclick="window.openTabLightbox('${slot.tabScreenshot}')" alt="Таб карты ${idx + 1}">` : ''}
        ${!isSkipped ? `
          <div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:auto;">
            <button type="button" class="social-auth-btn" style="flex:1; padding:5px 7px; font-size:9px;" onclick="window.uploadSeriesMapTab('${trn.id}', '${match.id}', ${idx})">
              📷 ${slot && slot.tabScreenshot ? 'Заменить таб' : 'Таб Карты ' + (idx + 1)}
            </button>
            ${isMod ? `<button type="button" class="auth-submit-btn" style="flex:1; padding:5px 7px; font-size:9px;" onclick="window.confirmSeriesMapScore('${trn.id}', '${match.id}', ${idx})">${isDone ? 'Изм.' : '✓ Итог'}</button>` : ''}
          </div>
        ` : `<div style="font-size:10px; color:var(--white-dim);">Серия закрыта досрочно (${wonA}:${wonB})</div>`}
      </div>
    `;
  }).join("");

  return `
    <div class="series-stepper-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="font-family:var(--font-display); font-size:11px; font-weight:900; color:#ffffff;">
          ПРОГРЕСС СЕРИИ • <span style="color:var(--accent-soft);">${rules.label}</span>
        </div>
        <span class="glass-pill-badge">СЧЁТ ПО КАРТАМ: ${wonA} : ${wonB}</span>
      </div>
      <div class="series-stepper-grid">${slotsHTML}</div>
    </div>
  `;
}

// Live 1-second timer ticker (never re-renders inputs/chat!)
if (!window._c6eLiveTimerInterval) {
  window._c6eLiveTimerInterval = setInterval(() => {
    document.querySelectorAll("[data-live-timer-match]").forEach(el => {
      const mId = el.getAttribute("data-live-timer-match");
      const tId = el.getAttribute("data-trn-id");
      const trn = cloudTournaments.find(t => t.id === tId);
      const match = trn ? findMatchInTournament(trn, mId) : cloudMatches.find(m => m.id === mId);
      if (!match || match.status !== "live" || match.isPaused) return;
      el.textContent = `● ИДЁТ ИГРА: ${formatElapsedClock(getMatchElapsedMs(match))}`;
    });
  }, 1000);
}

window.recordMapScoreInSeries = (tId, matchId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, matchId) : null;
  if (!trn || !match || !currentUser) return;
  if (!canModerateBracket(getUserRoleInTournament(currentUser, trn))) return;

  const mapVal = (document.getElementById("mc-map")?.value || match.map || "Sandstone").trim();
  const sA = Math.max(0, parseInt(document.getElementById("mc-score-a")?.value || "0", 10) || 0);
  const sB = Math.max(0, parseInt(document.getElementById("mc-score-b")?.value || "0", 10) || 0);
  if (sA === sB) return window.showMirrorToast("Счёт карты не может быть ничейным!", true);

  match.seriesMaps = Array.isArray(match.seriesMaps) ? match.seriesMaps : [];
  match.seriesMaps.push({ map: mapVal, scoreA: sA, scoreB: sB, winner: sA > sB ? "A" : "B" });
  const mapsWonA = match.seriesMaps.filter(x => x.winner === "A").length;
  const mapsWonB = match.seriesMaps.filter(x => x.winner === "B").length;
  match.scoreA = mapsWonA;
  match.scoreB = mapsWonB;

  appendTournamentAuditLog(trn, `Серия ${trn.seriesFormat}: карта ${mapVal} (${sA}:${sB}) → счёт серии ${mapsWonA}:${mapsWonB}`);
  syncLiveMatchesRegistry();
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(`Карта ${mapVal} (${sA}:${sB}) добавлена в серию! Счёт серии: ${mapsWonA}:${mapsWonB}`);
};

// Дисквалификация участника (DQ) с автоматической тех. победой сопернику в текущем матче
window.disqualifyParticipantInTournament = (tId, entryId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser) return;
  if (!canChiefControl(getUserRoleInTournament(currentUser, trn))) {
    return window.showMirrorToast("Дисквалифицировать (DQ) может только Главный Судья!", true);
  }
  const part = (trn.participants || []).find(p => p.id === entryId);
  if (!part) return;
  if (!confirm(`Дисквалифицировать «${part.name}» (DQ)? Соперник в текущем матче автоматически получит тех. победу.`)) return;

  part.disqualified = true;
  part.checkedIn = false;

  // Авто-продвижение соперника в текущем незавершённом матче
  if (trn.bracketData) {
    const all = [...(trn.bracketData.rounds || []), ...(trn.bracketData.lowerRounds || [])].flat();
    const activeM = all.find(m => m.status !== "finished" && ((m.teamA && m.teamA.id === entryId) || (m.teamB && m.teamB.id === entryId)));
    if (activeM) {
      const oppSide = activeM.teamA?.id === entryId ? "B" : "A";
      const winnerObj = oppSide === "A" ? activeM.teamA : activeM.teamB;
      activeM.status = "finished";
      activeM.winner = oppSide;
      activeM.isTechWin = true;
      if (winnerObj && activeM.bracketSide === "upper" && trn.bracketData.rounds[activeM.roundIdx + 1]) {
        const nextM = trn.bracketData.rounds[activeM.roundIdx + 1][Math.floor(activeM.matchIdx / 2)];
        if (nextM) {
          if (activeM.matchIdx % 2 === 0) nextM.teamA = winnerObj;
          else nextM.teamB = winnerObj;
        }
      }
    }
  }

  appendTournamentAuditLog(trn, `Дисквалификация (DQ): ${part.name}`);
  syncLiveMatchesRegistry();
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(`Участник «${part.name}» дисквалифицирован (DQ).`);
};

window.assignTournamentMVP = (tId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser) return;
  if (!canChiefControl(getUserRoleInTournament(currentUser, trn))) return window.showMirrorToast("Назначить MVP может только Главный Судья!", true);
  if (trn.mvpAwarded) return window.showMirrorToast("MVP турнира уже назначен!");

  const mvpNick = prompt("Введите игровой ник MVP турнира (получит +100 CP):", "");
  if (!mvpNick || !mvpNick.trim()) return;
  const targetU = cloudUsers.find(u => String(u.nick || "").toLowerCase() === mvpNick.trim().toLowerCase());
  if (!targetU) return window.showMirrorToast("Игрок с таким ником не найден на платформе!", true);

  targetU.cp = (targetU.cp || 0) + 100;
  trn.mvpPlayer = { uid: targetU.uid, nick: targetU.nick, avatar: targetU.avatar };
  trn.mvpAwarded = true;
  appendTournamentAuditLog(trn, `Назначен MVP турнира: ${targetU.nick} (+100 CP)`);
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(`Игрок ${targetU.nick} назначен MVP турнира (+100 CP)!`);
};

window.triggerMatchTabScreenshotUpload = (tId, mId) => {
  _pendingTabScreenshotTarget = { tId, mId };
  document.getElementById("matchTabScreenshotInput")?.click();
};

window.copyLobbyId = (lobbyId, ev) => {
  if (ev) ev.stopPropagation();
  if (!lobbyId) return;
  try { navigator.clipboard.writeText(lobbyId); window.showMirrorToast(`ID лобби ${lobbyId} скопирован!`); }
  catch (e) { window.showMirrorToast(`ID лобби: ${lobbyId}`); }
};


window.showMirrorToast = (msg, isError = false) => {
  const cont = document.getElementById("mirror-toast-container");
  if (!cont) return;
  const el = document.createElement("div");
  el.className = "mirror-toast";
  if (isError) el.style.borderLeftColor = "#e11d48";
  el.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}" style="color:${isError ? '#fb7185' : 'var(--accent-soft)'}; margin-right:7px;"></i> ${escapeHTML(msg)}`;
  cont.appendChild(el);
  setTimeout(() => el.remove(), 3600);
};

function getPlayerClan(userObj) {
  if (!userObj) return null;
  return cloudClans.find(c => c.leaderUid === userObj.uid || (userObj.clanId && c.id === userObj.clanId) || (Array.isArray(c.members) && c.members.some(m => m && m.uid === userObj.uid))) || null;
}

function loadSavedUserSession() {
  try {
    [
      "c6e_stage3_users", "c6e_stage3_clans", "c6e_stage3_tournaments",
      "c6e_stage3_matches", "c6e_stage3_tickets", "c6e_stage3_gchat",
      "c6e_stage3_dms", "c6e_stage3_notifs", "c6e_stage3_current_user"
    ].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    const cached = localStorage.getItem("c6e_active_user_v29") || sessionStorage.getItem("c6e_active_user_v29");
    if (cached) currentUser = JSON.parse(cached);
  } catch (e) {}
}

function ensureFounderAdminExists() {
  // Founder rights are strictly verified by Firebase Auth UID in Firestore Security Rules.
  const fbUser = auth.currentUser;
  if (!fbUser) return null;
  const emailLower = String(fbUser.email || "").toLowerCase();
  if (emailLower !== FOUNDER_ADMIN_EMAIL) return null;
  let founder = cloudUsers.find(u => u.uid === fbUser.uid);
  if (!founder) {
    founder = {
      uid: fbUser.uid,
      username: "kas",
      email: FOUNDER_ADMIN_EMAIL,
      nick: "Kas",
      accountType: "player",
      isAdmin: true,
      isVerifiedOrganizer: true,
      organizerStatus: "verified",
      so2Id: "C6E-000001",
      so2IdUpdatedAt: 0,
      so2IdChangeRequested: false,
      so2ProfileLink: "https://standoff2.com/profile/C6E-000001",
      age: "18",
      region: detectUserRegionData().label,
      regionFlag: detectUserRegionData().flag,
      playRole: "Капитан (IGL)",
      avatar: "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=KasFounder&backgroundColor=9a3412",
      banner: "",
      provider: "Firebase Auth",
      clanId: null,
      cp: 0,
      kills: 0,
      deaths: 0,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      profileCompleted: true,
      stats: { kd: "0.00", kills: 0, deaths: 0, impact: 0, matchesPlayed: 0, wins: 0, losses: 0 },
      matchHistory: []
    };
    cloudUsers.unshift(founder);
  } else {
    founder.isAdmin = true;
    founder.isVerifiedOrganizer = true;
  }
  return founder;
}

loadSavedUserSession();

// Track last synced JSON snapshots per doc so we only write changed docs and respect Security Rules
const _syncedDocHashes = new Map();
const _privateUnsubs = [];
let _lastGlobalChatAtMs = 0;
let _lastDmAtMs = 0;

function _cleanForFirestore(obj) {
  const copy = JSON.parse(JSON.stringify(obj));
  delete copy.pass; // NEVER store plaintext passwords in Firestore
  return copy;
}

function _stripProtectedUserFields(obj) {
  const copy = _cleanForFirestore(obj);
  ["isAdmin", "isVerifiedOrganizer", "cp", "kills", "deaths", "wins", "losses", "matchesPlayed", "banned"].forEach(k => delete copy[k]);
  return copy;
}

function _stripProtectedClanFields(obj) {
  const copy = _cleanForFirestore(obj);
  ["cp", "wins", "losses", "kills", "deaths", "matchesPlayed"].forEach(k => delete copy[k]);
  return copy;
}

function _isCurrentVerifiedOrg() {
  return Boolean(currentUser && (currentUser.isAdmin || currentUser.isVerifiedOrganizer || currentUser.organizerStatus === "verified"));
}

async function _syncCollectionDiff(colName, items, idField, transformFn, allowFilterFn) {
  if (!auth.currentUser) return;
  for (const item of items) {
    const id = item && item[idField];
    if (!id) continue;
    if (allowFilterFn && !allowFilterFn(item)) continue;
    const payload = transformFn ? transformFn(item) : _cleanForFirestore(item);
    const key = `${colName}/${id}`;
    const serialized = JSON.stringify(payload);
    if (_syncedDocHashes.get(key) === serialized) continue;
    try {
      await setDoc(doc(db, colName, String(id)), payload, { merge: true });
      _syncedDocHashes.set(key, serialized);
    } catch (err) {
      // Blocked by Firestore Security Rules — ignore silently for non-owned items
    }
  }
}

async function syncArenaDataToCloud() {

  const fbUser = auth.currentUser;
  if (!fbUser) return;
  const uid = fbUser.uid;
  const isAdm = Boolean(currentUser && currentUser.isAdmin);
  const isOrg = _isCurrentVerifiedOrg();

  await _syncCollectionDiff(
    "users",
    cloudUsers,
    "uid",
    (u) => (isAdm ? _cleanForFirestore(u) : (u.uid === uid ? _stripProtectedUserFields(u) : _cleanForFirestore(u))),
    (u) => isAdm || isOrg || u.uid === uid
  );
  await _syncCollectionDiff(
    "clans",
    cloudClans,
    "id",
    (c) => (isAdm || isOrg ? _cleanForFirestore(c) : _stripProtectedClanFields(c)),
    (c) => isAdm || isOrg || c.leaderUid === uid
  );
  if (isAdm || isOrg) {
    await _syncCollectionDiff("tournaments", cloudTournaments, "id", _cleanForFirestore);
    await _syncCollectionDiff("matches", cloudMatches, "id", _cleanForFirestore);
  }
  await _syncCollectionDiff(
    "tickets",
    cloudTickets,
    "id",
    (t) => ({ ..._cleanForFirestore(t), uid: t.uid || uid }),
    (t) => isAdm || t.uid === uid
  );
}

function saveCurrentUserEverywhere() {
  if (!currentUser) return;
  const cleanUser = _cleanForFirestore(currentUser);
  currentUser = cleanUser;
  const idx = cloudUsers.findIndex(u => u.uid === currentUser.uid);
  if (idx >= 0) cloudUsers[idx] = currentUser;
  else cloudUsers.push(currentUser);
  try { localStorage.setItem("c6e_active_user_v29", JSON.stringify(currentUser)); } catch (e) {}
  syncArenaDataToCloud();
  updateTopRightPlayerUI();
  renderAllStageSections();
}

function _recordSnapshotHashes(colName, arr, idField) {
  arr.forEach(item => {
    if (item && item[idField]) _syncedDocHashes.set(`${colName}/${item[idField]}`, JSON.stringify(_cleanForFirestore(item)));
  });
}

// Public realtime Firestore listeners
onSnapshot(collection(db, "users"), (snap) => {
  const list = [];
  snap.forEach(d => list.push(normalizeSafeUserObj({ uid: d.id, ...d.data() })));
  cloudUsers = list;
  _recordSnapshotHashes("users", cloudUsers, "uid");
  if (currentUser) {
    const fresh = cloudUsers.find(u => u.uid === currentUser.uid);
    if (fresh) {
      currentUser = normalizeSafeUserObj({ ...currentUser, ...fresh, nick: fresh.nick || currentUser.nick }, auth.currentUser);
      try { localStorage.setItem("c6e_active_user_v29", JSON.stringify(currentUser)); } catch (e) {}
      updateTopRightPlayerUI();
    }
  }
  renderAllStageSections();
}, () => {});

onSnapshot(collection(db, "clans"), (snap) => {
  const list = [];
  snap.forEach(d => list.push({ id: d.id, ...d.data() }));
  cloudClans = list;
  _recordSnapshotHashes("clans", cloudClans, "id");
  _mergeClanAppsAndInvites();
  renderAllStageSections();
}, () => {});

onSnapshot(collection(db, "tournaments"), (snap) => {
  const list = [];
  snap.forEach(d => list.push({ id: d.id, ...d.data() }));
  cloudTournaments = list;
  _recordSnapshotHashes("tournaments", cloudTournaments, "id");
  renderAllStageSections();
}, () => {});

onSnapshot(collection(db, "matches"), (snap) => {
  const list = [];
  snap.forEach(d => list.push({ id: d.id, ...d.data() }));
  cloudMatches = list;
  _recordSnapshotHashes("matches", cloudMatches, "id");
  renderAllStageSections();
}, () => {});

onSnapshot(query(collection(db, "chat_global"), orderBy("createdAt", "asc"), limit(80)), (snap) => {
  const list = [];
  snap.forEach(d => list.push({ id: d.id, ...d.data() }));
  cloudGlobalChat = list;
  if (typeof renderChatSection === "function") renderChatSection();
}, () => {});

function _stopPrivateListeners() {
  while (_privateUnsubs.length) {
    const unsub = _privateUnsubs.pop();
    try { unsub(); } catch (e) {}
  }
}

let cloudClanApplications = [];
let cloudClanInvites = [];

function _mergeClanAppsAndInvites() {
  cloudClans.forEach(c => {
    const liveApps = cloudClanApplications.filter(a => a.clanId === c.id && a.status === "pending");
    const liveInvs = cloudClanInvites.filter(i => i.clanId === c.id && i.status === "pending");
    // Merge live Firestore collection apps with any local fallback without duplicates
    const appMap = new Map();
    liveApps.forEach(a => appMap.set(a.uid, a));
    c.applications = [...appMap.values()];
    const invMap = new Map();
    liveInvs.forEach(i => invMap.set(i.toUid || i.uid, { ...i, uid: i.toUid || i.uid }));
    c.invites = [...invMap.values()];
  });
}

function _startPrivateListeners(uid, isAdm) {
  _stopPrivateListeners();
  let dmSent = [], dmRecv = [];
  const mergeDms = () => {
    const map = new Map();
    [...dmSent, ...dmRecv].forEach(m => map.set(m.id, m));
    cloudDirectMessages = [...map.values()].sort((a, b) => (a.ts || 0) - (b.ts || 0));
    if (typeof renderChatSection === "function") renderChatSection();
  };
  _privateUnsubs.push(onSnapshot(query(collection(db, "direct_messages"), where("fromUid", "==", uid)), (snap) => {
    dmSent = [];
    snap.forEach(d => dmSent.push({ id: d.id, ...d.data() }));
    mergeDms();
  }, () => {}));
  _privateUnsubs.push(onSnapshot(query(collection(db, "direct_messages"), where("toUid", "==", uid)), (snap) => {
    dmRecv = [];
    snap.forEach(d => dmRecv.push({ id: d.id, ...d.data() }));
    mergeDms();
  }, () => {}));
  _privateUnsubs.push(onSnapshot(query(collection(db, "notifications"), where("toUid", "==", uid)), (snap) => {
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    cloudNotifications = list.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    if (typeof updateNotificationsBadgeUI === "function") updateNotificationsBadgeUI();
    if (typeof renderNotificationsListModal === "function") renderNotificationsListModal();
  }, () => {}));
  _privateUnsubs.push(onSnapshot(collection(db, "clan_applications"), (snap) => {
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    cloudClanApplications = list;
    _mergeClanAppsAndInvites();
    renderAllStageSections();
  }, () => {}));
  _privateUnsubs.push(onSnapshot(query(collection(db, "clan_invites"), where("toUid", "==", uid)), (snap) => {
    const mine = [];
    snap.forEach(d => mine.push({ id: d.id, ...d.data() }));
    cloudClanInvites = [...cloudClanInvites.filter(x => x.toUid !== uid), ...mine];
    _mergeClanAppsAndInvites();
    renderAllStageSections();
  }, () => {}));
  _privateUnsubs.push(onSnapshot(query(collection(db, "clan_invites"), where("leaderUid", "==", uid)), async (snap) => {
    const led = [];
    snap.forEach(d => led.push({ id: d.id, ...d.data() }));
    cloudClanInvites = [...cloudClanInvites.filter(x => x.leaderUid !== uid), ...led];
    // Auto-finalize accepted invites when captain is online
    for (const inv of led) {
      if (inv.status === "accepted") {
        const cl = cloudClans.find(c => c.id === inv.clanId);
        if (cl && !(cl.members || []).some(m => m.uid === inv.toUid) && (cl.members || []).length < 7) {
          cl.members.push({ uid: inv.toUid, nick: inv.toNick || "Player", so2Id: inv.toSo2Id || "—", role: "Игрок основы" });
          try {
            await setDoc(doc(db, "clans", cl.id), _stripProtectedClanFields(cl), { merge: true });
            await deleteDoc(doc(db, "clan_invites", inv.id));
          } catch (e) {}
        }
      }
    }
    _mergeClanAppsAndInvites();
    renderAllStageSections();
  }, () => {}));
  const ticketRef = isAdm ? collection(db, "tickets") : query(collection(db, "tickets"), where("uid", "==", uid));
  _privateUnsubs.push(onSnapshot(ticketRef, (snap) => {
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    cloudTickets = list;
    _recordSnapshotHashes("tickets", cloudTickets, "id");
    renderAllStageSections();
  }, () => {}));
}

onAuthStateChanged(auth, async (fbUser) => {
  if (!fbUser) {
    _stopPrivateListeners();
    if (currentUser) {
      currentUser = null;
      try {
        localStorage.removeItem("c6e_active_user_v29");
        sessionStorage.removeItem("c6e_active_user_v29");
      } catch (e) {}
      updateTopRightPlayerUI();
      renderAllStageSections();
    }
    return;
  }

  const emailLower = String(fbUser.email || "").toLowerCase();
  const isFounderEmail = emailLower === FOUNDER_ADMIN_EMAIL;
  let existing = null;
  try {
    const snap = await getDoc(doc(db, "users", fbUser.uid));
    if (snap.exists()) existing = { uid: fbUser.uid, ...snap.data() };
  } catch (e) {}
  if (!existing) existing = cloudUsers.find(u => u.uid === fbUser.uid) || null;

  if (!existing && isFounderEmail) {
    existing = ensureFounderAdminExists();
    if (existing) {
      try { await setDoc(doc(db, "users", fbUser.uid), _cleanForFirestore(existing), { merge: true }); } catch (e) {}
    }
  }
  if (existing) {
    const needsHeal = !existing.nick || existing.nick === "undefined" || !existing.stats;
    existing = normalizeSafeUserObj(existing, fbUser);
    if (isFounderEmail) {
      existing.isAdmin = true;
      existing.hasDevBadge = true;
      existing.isVerifiedOrganizer = true;
    }
    if (needsHeal) {
      try { await setDoc(doc(db, "users", fbUser.uid), _cleanForFirestore(existing), { merge: true }); } catch (e) {}
    }
    const idx = cloudUsers.findIndex(u => u.uid === fbUser.uid);
    if (idx >= 0) cloudUsers[idx] = existing;
    else cloudUsers.push(existing);
    currentUser = existing;
    try { localStorage.setItem("c6e_active_user_v29", JSON.stringify(currentUser)); } catch (e) {}
    updateTopRightPlayerUI();
    if (window.location.pathname === "/authorization" || document.body.classList.contains("on-login-route")) {
      activateRouteView("/feed", false);
    }
  }
  _startPrivateListeners(fbUser.uid, Boolean(isFounderEmail || (existing && existing.isAdmin)));
  renderAllStageSections();
});

window.toggleGlassDropdown = (id, ev) => {
  if (ev) ev.stopPropagation();
  document.querySelectorAll(".glass-select-wrap.open").forEach(el => { if (el.id !== id) el.classList.remove("open"); });
  const wrap = document.getElementById(id);
  if (wrap) wrap.classList.toggle("open");
};

window.selectGlassDropdownOption = (wrapId, inputId, labelId, value, callbackName = null) => {
  const inp = document.getElementById(inputId);
  const lbl = document.getElementById(labelId);
  const wrap = document.getElementById(wrapId);
  if (inp) inp.value = value;
  if (lbl) lbl.innerText = value;
  if (wrap) wrap.classList.remove("open");
  if (callbackName && typeof window[callbackName] === "function") window[callbackName](value);
};

document.addEventListener("click", () => {
  document.querySelectorAll(".glass-select-wrap.open").forEach(el => el.classList.remove("open"));
});

// ============================================================================
// 1. ШАПКА САЙТА (ПРАВЫЙ ВЕРХНИЙ УГОЛ)
// ============================================================================
function updateTopRightPlayerUI() {
  const avEl = document.getElementById("top-player-avatar");
  const dotEl = document.getElementById("top-player-dot");
  const nickEl = document.getElementById("top-player-nick");
  const subEl = document.getElementById("top-player-sub");
  if (!avEl || !nickEl || !subEl || !dotEl) return;

  if (currentUser) {
    avEl.src = currentUser.avatar || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(currentUser.nick)}`;
    nickEl.innerText = currentUser.nick;
    if (currentUser.accountType === "organizer") {
      subEl.innerText = currentUser.orgName ? currentUser.orgName : "Организатор";
    } else {
      const clan = getPlayerClan(currentUser);
      subEl.innerText = clan ? `[${clan.tag}] ${clan.name}` : "";
    }
    dotEl.classList.remove("guest");
  } else {
    avEl.src = "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=GuestC6E";
    nickEl.innerText = "Гость";
    subEl.innerText = "";
    dotEl.classList.add("guest");
  }
}

window.handleTopProfileClick = () => {
  if (!currentUser) window.goRoute("/authorization");
  else { viewedProfileUid = null; window.goRoute("/profile"); }
};

// ============================================================================
// 2. ОКНО «ЕЩЕ» (9 ТОЧЕК) + ПАРАМЕТРЫ ТЕМ И ПАНЕЛИ ОРГАНИЗАТОРА/АДМИНА
// ============================================================================
function getExtraSectionsForUser() {
  const list = [
    { key: "profile", route: "/profile", title: currentUser?.accountType === "organizer" ? "Профиль организации" : "Профиль игрока", sub: "Личный кабинет", icon: "fa-id-badge" }
  ];
  if (!currentUser || currentUser.accountType !== "organizer") {
    list.push({ key: "clan", route: "/clan", title: "Профиль клана", sub: "Управление и состав", icon: "fa-shield-alt" });
  }
  if (canUserAccessOrganizerPanel(currentUser)) {
    list.push({ key: "organizer", route: "/organizer", title: "Панель организатора", sub: "Турниры, сетки и судьи", icon: "fa-trophy" });
  }
  list.push(
    { key: "chat", route: "/chat", title: "Общий и личный чат", sub: "Сообщения и ЛС", icon: "fa-comments" },
    { key: "rules", route: "/rules", title: "Регламент арены", sub: "Правила Standoff 2", icon: "fa-book-open" },
    { key: "support", route: "/support", title: "Тех. поддержка", sub: "Тикеты и помощь 24/7", icon: "fa-headset" }
  );
  if (currentUser && currentUser.isAdmin) {
    list.push({ key: "admin", route: "/admin", title: "Админ-панель платформы", sub: "Верификация и Official", icon: "fa-user-shield" });
  }
  return list;
}

function renderGlassMorePopupTiles() {
  const box = document.getElementById("glass-more-tiles-container");
  if (box) {
    box.innerHTML = getExtraSectionsForUser().map(item => `
      <button type="button" class="glass-more-tile" onclick="window.openExtraGlassSection('${item.key}')">
        <div class="glass-tile-icon"><i class="fas ${item.icon}"></i></div>
        <div>
          <div style="font-family:var(--font-display); font-size:11px; font-weight:800; color:#fff;">${escapeHTML(item.title)}</div>
          <div style="font-size:10px; color:var(--white-dim); margin-top:2px;">${escapeHTML(item.sub)}</div>
        </div>
      </button>
    `).join("");
  }

  const themeBox = document.getElementById("glass-theme-switcher-container");
  if (themeBox) {
    themeBox.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; font-family:var(--font-display); font-size:10px; font-weight:800; color:var(--white-soft); letter-spacing:1.2px;">
        <i class="fas fa-palette" style="color:var(--accent-soft);"></i> СМЕНА ТЕМЫ ОФОРМЛЕНИЯ
      </div>
      <div class="theme-options-grid">
        <button type="button" class="theme-choice-card ${activeTheme === 'black-orange' ? 'active' : ''}" onclick="window.setPlatformTheme('black-orange')">
          ${getThemeEmblemSVG("black-orange")}
          <div>
            <div style="font-family:var(--font-display); font-size:10.5px; font-weight:900; color:#fff;">Black Orange</div>
            <div style="font-size:9.5px; color:var(--white-dim);">По умолчанию</div>
          </div>
        </button>
        <button type="button" class="theme-choice-card ${activeTheme === 'blood-black' ? 'active' : ''}" onclick="window.setPlatformTheme('blood-black')">
          ${getThemeEmblemSVG("blood-black")}
          <div>
            <div style="font-family:var(--font-display); font-size:10.5px; font-weight:900; color:#fff;">Blood Black Style</div>
            <div style="font-size:9.5px; color:var(--white-dim);">Кровавое стекло</div>
          </div>
        </button>
      </div>
    `;
  }
}

window.toggleGlassMoreModal = (ev = null) => {
  if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation();
  const bd = document.getElementById("glass-more-backdrop");
  if (!bd) return;
  renderGlassMorePopupTiles();
  bd.classList.toggle("open");
};
window.closeGlassMoreModal = () => { const bd = document.getElementById("glass-more-backdrop"); if (bd) bd.classList.remove("open"); };

window.openExtraGlassSection = (secKey) => {
  window.closeGlassMoreModal();
  if (secKey === "profile") { viewedProfileUid = null; return window.goRoute("/profile"); }
  if (secKey === "clan") { viewedClanId = null; return window.goRoute("/clan"); }
  if (secKey === "organizer") return window.goRoute("/organizer");
  if (secKey === "chat") return window.goRoute("/chat");
  selectedExtraSectionKey = secKey;
  if (!currentUser) {
    window.showMirrorToast("Войдите или зарегистрируйтесь!", true);
    return activateRouteView("/authorization", true);
  }
  activateRouteView(`/${secKey}`, true);
};

// ============================================================================
// 3. МАРШРУТИЗАЦИЯ ЧИСТЫХ URL
// ============================================================================
const ALL_ROUTES = [
  "/feed", "/profile", "/teams", "/leaderboard", "/clan", "/tournaments",
  "/organizer", "/matches", "/schedule", "/authorization", "/login",
  "/chat", "/rules", "/support", "/admin"
];

let selectedExtraSectionKey = "rules";

function normalizeRouteAlias(rawRoute) {
  if (!rawRoute || rawRoute === "/" || rawRoute === "/index.html" || rawRoute === "/home") return "/feed";
  if (rawRoute === "/login" || rawRoute === "/auth" || rawRoute === "/register") return "/authorization";
  return ALL_ROUTES.includes(rawRoute) ? rawRoute : "/feed";
}

function getRepoBasePrefix() {
  let p = window.location.pathname || "/";
  if (p.endsWith("/index.html")) p = p.slice(0, p.length - 11);
  for (const r of ALL_ROUTES) { if (p.endsWith(r)) return p.slice(0, p.length - r.length); }
  return p.replace(/\/+$/, "");
}

function detectInitialRoute() {
  const p = (window.location.pathname || "/").replace(/\/+$/, "");
  if (p.endsWith("/index.html") || p === "" || p === "/") return "/feed";
  for (const r of ALL_ROUTES) {
    if (p === r || p.endsWith(r)) {
      if (["/rules", "/support", "/admin"].includes(r)) selectedExtraSectionKey = r.slice(1);
      return normalizeRouteAlias(r);
    }
  }
  return "/feed";
}

window.goRoute = (route, ev = null) => {
  if (ev && typeof ev.preventDefault === "function") ev.preventDefault();
  window.closeGlassMoreModal();
  const target = normalizeRouteAlias(route);
  if (!currentUser && target !== "/feed" && target !== "/authorization") {
    window.showMirrorToast("Войдите или зарегистрируйтесь, чтобы продолжить!", true);
    return activateRouteView("/authorization", true);
  }
  activateRouteView(target, true);
};

function activateRouteView(route, pushHistory = true) {
  const cleanRoute = normalizeRouteAlias(route);
  currentRoute = cleanRoute;
  document.body.classList.toggle("on-login-route", cleanRoute === "/authorization");
  if (["/rules", "/support", "/admin"].includes(cleanRoute)) selectedExtraSectionKey = cleanRoute.slice(1);

  try {
    const base = getRepoBasePrefix();
    const nextUrl = `${base}${cleanRoute}`;
    if (pushHistory && window.location.pathname !== nextUrl) window.history.pushState({ route: cleanRoute }, "", nextUrl);
    else window.history.replaceState({ route: cleanRoute }, "", nextUrl);
  } catch (e) {}

  const mapSec = {
    "/feed": "sec-home", "/profile": "sec-profile", "/teams": "sec-teams",
    "/leaderboard": "sec-leaderboard", "/clan": "sec-clan", "/tournaments": "sec-tournaments",
    "/organizer": "sec-organizer", "/matches": "sec-matches", "/schedule": "sec-schedule",
    "/authorization": "sec-login", "/chat": "sec-chat", "/rules": "sec-more", "/support": "sec-more", "/admin": "sec-more"
  };

  document.querySelectorAll(".stage-section").forEach(s => s.classList.remove("active"));
  const secEl = document.getElementById(mapSec[cleanRoute] || "sec-home");
  if (secEl) secEl.classList.add("active");

  document.querySelectorAll("#mirror-bottom-nav [data-route], #desktop-top-nav [data-route]").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-route") === cleanRoute);
  });

  renderAllStageSections(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("popstate", () => {
  const r = detectInitialRoute();
  if (!currentUser && r !== "/feed" && r !== "/authorization") activateRouteView("/authorization", false);
  else activateRouteView(r, false);
});

let _renderRafId = null;
function _renderActiveRouteNow() {
  _renderRafId = null;
  updateTopRightPlayerUI();
  updateNotificationsBadgeUI();
  switch (currentRoute) {
    case "/feed": renderMainShowcaseSection(); break;
    case "/authorization": renderLoginSection(); break;
    case "/profile": renderPlayerProfileSection(); break;
    case "/teams": renderTeamsSearchSection(); break;
    case "/leaderboard": renderLeaderboardSection(); break;
    case "/clan": renderClanProfileSection(); break;
    case "/tournaments": renderTournamentsSection(); break;
    case "/organizer": renderOrganizerPanelSection(); break;
    case "/matches": renderMatchesSection(); break;
    case "/schedule": renderScheduleSection(); break;
    case "/chat": renderChatSection(); break;
    case "/rules":
    case "/support":
    case "/admin": renderExtraSections(); break;
    default: renderMainShowcaseSection(); break;
  }
}
function renderAllStageSections(immediate = false) {
  if (immediate) {
    if (_renderRafId) { cancelAnimationFrame(_renderRafId); _renderRafId = null; }
    return _renderActiveRouteNow();
  }
  if (_renderRafId) return;
  _renderRafId = requestAnimationFrame(_renderActiveRouteNow);
}

// ============================================================================
// 4. ГЛАВНЫЙ РАЗДЕЛ (/feed) С РЕКЛАМНЫМ ЩИТКОМ
// ============================================================================

// ============================================================================
// V22: НАСТРОЙКИ РАЗРАБОТЧИКА (CMS) И КЛИКАБЕЛЬНЫЙ LIVE-БАННЕР НА ГЛАВНОЙ
// ============================================================================
function getDevSiteConfig() {
  const defaults = {
    adEnabled: true,
    adTitle: "Здесь могла бы быть ваша реклама",
    adSub: "Рекламный щит • Cyber 6 Tournament",
    adUrl: "https://t.me/kascheff",
    newsBadge: "ОБТ • 1 ДЕКАБРЯ",
    newsTitle: "СТАРТ CYBER 6 TOURNAMENT",
    newsText: "Открытие платформы, верификация организаторов и первые кубки на Gold.",
    maintenanceBanner: ""
  };
  try {
    const saved = JSON.parse(localStorage.getItem("c6e_dev_site_config") || "null");
    return saved ? { ...defaults, ...saved } : defaults;
  } catch (e) {
    return defaults;
  }
}

function getMatchSideName(side) {
  if (!side) return "TBD";
  if (typeof side === "string") return side;
  return side.name || side.nick || "TBD";
}

function getMatchSideAvatar(side, fallbackSeed = "Team") {
  if (side && typeof side === "object" && side.avatar) return side.avatar;
  const label = getMatchSideName(side);
  const clan = cloudClans.find(c => label.includes(c.name) || (c.tag && label.includes(`[${c.tag}]`)));
  if (clan && clan.avatar) return clan.avatar;
  return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(label || fallbackSeed)}&backgroundColor=9a3412`;
}

window.openLiveMatchFromBanner = (tournamentId, matchId) => {
  if (tournamentId) {
    activeTournamentId = tournamentId;
    tournamentDetailTab = "bracket";
    if (matchId) activeControlMatchId = matchId;
    window.goRoute("/tournaments");
    if (matchId && typeof window.openMatchControlRoom === "function") {
      setTimeout(() => window.openMatchControlRoom(matchId), 40);
    }
    return;
  }
  window.goRoute("/tournaments");
};

function renderClickableLiveMatchBannerHTML() {
  const liveList = cloudMatches.filter(m => m.status === "live");
  if (liveList.length === 0) {
    return `
      <div class="live-hero-banner" style="background-image:url('Dune.png');" onclick="window.goRoute('/tournaments')">
        <div class="live-hero-scrim">
          <div class="live-hero-top">
            <span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> LIVE АРЕНА</span>
            <span class="glass-pill-badge">STANDOFF 2 • CYBER 6</span>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; padding:6px 0;">
            <div>
              <div style="font-family:var(--font-display); font-size:clamp(16px, 2.6vw, 22px); font-weight:900; color:#ffffff; letter-spacing:0.6px;">
                АРЕНА ГОТОВА К НОВЫМ ПРОТИВОСТОЯНИЯМ
              </div>
              <div style="font-size:12.5px; color:var(--white-soft); margin-top:4px;">
                Как только начнётся турнирный матч, здесь появится прямой баннер с текущим счётом и входом в табло.
              </div>
            </div>
            <span class="live-hero-cta">ПЕРЕЙТИ К ТУРНИРАМ →</span>
          </div>
        </div>
      </div>
    `;
  }

  const featured = liveList.find(m => m.featuredOnHome) || liveList[0];
  const others = liveList.filter(m => m.id !== featured.id);
  const nameA = getMatchSideName(featured.teamA);
  const nameB = getMatchSideName(featured.teamB);
  const avA = getMatchSideAvatar(featured.teamA, "TeamA");
  const avB = getMatchSideAvatar(featured.teamB, "TeamB");
  const scoreStr = featured.score
    ? String(featured.score)
    : `${Number(featured.scoreA || 0)} : ${Number(featured.scoreB || 0)}`;
  const parts = scoreStr.split(":");
  const sA = (parts[0] || "0").trim();
  const sB = (parts[1] || "0").trim();
  const mapName = featured.map || "Sandstone";
  const mapBg = getMapBannerUrl(mapName);
  const trn = cloudTournaments.find(t => t.id === featured.tournamentId);
  const trnTitle = trn ? trn.name : (featured.tournamentName || "CYBER 6 TOURNAMENT");

  return `
    <div class="live-hero-banner" style="background-image:url('${escapeHTML(mapBg)}');" onclick="window.openLiveMatchFromBanner('${escapeHTML(featured.tournamentId || '')}', '${escapeHTML(featured.id || '')}')">
      <div class="live-hero-scrim">
        <div class="live-hero-top">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> LIVE MATCH</span>
            <span class="glass-pill-badge">${escapeHTML(trnTitle)}</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span class="glass-pill-badge">${escapeHTML(featured.format || '5v5')}</span>
            <span class="glass-pill-badge">${escapeHTML(mapName)}</span>
            ${featured.lobbyId ? `<span class="glass-pill-badge" onclick="window.copyLobbyId('${escapeHTML(featured.lobbyId)}', event)"><i class="far fa-copy"></i> ID: ${escapeHTML(featured.lobbyId)}</span>` : ''}
          </div>
        </div>

        <div class="live-hero-clash">
          <div class="live-team-side">
            <img src="${escapeHTML(avA)}" class="live-team-avatar" alt="">
            <div style="min-width:0;">
              <div class="live-team-name">${escapeHTML(nameA)}</div>
              <div class="live-team-role">ОБОРОНА / CT</div>
            </div>
          </div>

          <div class="live-score-core">
            <div class="live-score-digits">${escapeHTML(sA)} <span>:</span> ${escapeHTML(sB)}</div>
            <div class="live-score-sub" data-live-timer-match="${escapeHTML(featured.id || '')}" data-trn-id="${escapeHTML(featured.tournamentId || '')}">● ИДЁТ ИГРА: ${formatElapsedClock(getMatchElapsedMs(featured))}</div>
          </div>

          <div class="live-team-side right">
            <div style="min-width:0;">
              <div class="live-team-name">${escapeHTML(nameB)}</div>
              <div class="live-team-role">АТАКА / T</div>
            </div>
            <img src="${escapeHTML(avB)}" class="live-team-avatar" alt="">
          </div>
        </div>

        <div class="live-hero-footer">
          <span>Команды уже сражаются на карте <b>${escapeHTML(mapName)}</b></span>
          <span class="live-hero-cta">ОТКРЫТЬ ТАБЛО МАТЧА →</span>
        </div>
      </div>
    </div>
    ${others.length > 0 ? `
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
        ${others.map(m => `
          <div class="live-match-row" onclick="window.openLiveMatchFromBanner('${escapeHTML(m.tournamentId || '')}', '${escapeHTML(m.id || '')}')">
            <div style="display:flex; align-items:center; gap:9px; flex-wrap:wrap;">
              <span class="crimson-dot-pulse"></span>
              <span class="glass-pill-badge">${escapeHTML(m.format || '5v5')}</span>
              <b style="font-size:12.5px;">${escapeHTML(getMatchSideName(m.teamA))}</b>
              <span style="font-family:var(--font-display); color:var(--accent-soft); font-weight:900;">${escapeHTML(m.score || `${m.scoreA || 0} : ${m.scoreB || 0}`)}</span>
              <b style="font-size:12.5px;">${escapeHTML(getMatchSideName(m.teamB))}</b>
            </div>
            <div style="display:flex; align-items:center; gap:7px;">
              <span class="glass-pill-badge">${escapeHTML(m.map || 'Sandstone')}</span>
              <span style="font-size:10.5px; color:var(--accent-soft); font-weight:800;">Открыть →</span>
            </div>
          </div>
        `).join("")}
      </div>
    ` : ''}
  `;
}

function getAdBillboardHTML() {
  const cfg = getDevSiteConfig();
  const maint = cfg.maintenanceBanner
    ? `<div class="mirror-card" style="padding:12px 16px; margin-bottom:12px; border-color:rgba(251,113,133,0.45); display:flex; align-items:center; gap:10px;"><i class="fas fa-tools" style="color:#fb7185;"></i><span style="font-size:12px; color:#ffffff; font-weight:700;">${escapeHTML(cfg.maintenanceBanner)}</span></div>`
    : "";
  if (!cfg.adEnabled) return maint;
  return `${maint}
    <div class="ad-billboard-strip">
      <div class="ad-billboard-left">
        <div class="ad-emblem-badge" aria-hidden="true">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z" fill="rgba(217,119,54,0.28)"/>
            <path d="M14.5 8.5a5 5 0 0 1 0 7" stroke="var(--accent-soft)"/>
            <path d="M17.8 6a8.5 8.5 0 0 1 0 12" stroke="var(--accent-soft)" opacity="0.65"/>
          </svg>
        </div>
        <div>
          <div class="ad-billboard-title">${escapeHTML(cfg.adTitle)}</div>
          <div class="ad-billboard-sub">${escapeHTML(cfg.adSub)}</div>
        </div>
      </div>
      <a class="ad-order-btn" href="${escapeHTML(cfg.adUrl || '#')}" ${cfg.adUrl && cfg.adUrl.startsWith('http') ? 'target="_blank" rel="noopener"' : 'onclick="event.preventDefault()"'}>Заказать</a>
    </div>
  `;
}

function renderMainShowcaseSection() {
  const root = document.getElementById("home-showcase-root");
  if (!root) return;

  const playersCount = cloudUsers.filter(u => u.accountType !== "organizer").length;
  const clansCount = cloudClans.length;
  const tournamentsCount = cloudTournaments.length;
  const liveMatchesCount = cloudMatches.filter(m => m.status === "live").length;
  const finishedMatchesCount = cloudMatches.filter(m => m.status === "finished").length;
  const totalGoldPayout = cloudTournaments.reduce((sum, t) => sum + ((t.payoutPaid || t.status === "finished") ? (parseInt(t.prizeGold, 10) || 0) : 0), 0);

  const statGridHTML = `
    <div class="feed-stat-grid-2row">
      <div class="feed-stat-box"><div><div class="feed-stat-lbl">LIVE МАТЧЕЙ</div><div class="feed-stat-num">${liveMatchesCount}</div><div class="feed-stat-sub">Идут прямо сейчас</div></div><div class="stat-custom-emblem">${getStatCustomEmblemSVG("live")}</div></div>
      <div class="feed-stat-box"><div><div class="feed-stat-lbl">КОЛИЧЕСТВО ИГРОКОВ</div><div class="feed-stat-num">${playersCount}</div><div class="feed-stat-sub">Участники платформы</div></div><div class="stat-custom-emblem">${getStatCustomEmblemSVG("players")}</div></div>
      <div class="feed-stat-box"><div><div class="feed-stat-lbl">КОЛИЧЕСТВО КЛАНОВ</div><div class="feed-stat-num">${clansCount}</div><div class="feed-stat-sub">Команды Standoff 2</div></div><div class="stat-custom-emblem">${getStatCustomEmblemSVG("clans")}</div></div>
      <div class="feed-stat-box"><div><div class="feed-stat-lbl">СЫГРАНО МАТЧЕЙ</div><div class="feed-stat-num">${finishedMatchesCount}</div><div class="feed-stat-sub">Официальные протоколы арены</div></div><div class="stat-custom-emblem">${getStatCustomEmblemSVG("matches")}</div></div>
      <div class="feed-stat-box"><div><div class="feed-stat-lbl">ВЫПЛАТЫ ЗА ВСЕ ТУРНИРЫ</div><div class="feed-stat-num" style="color:var(--accent-soft);">${totalGoldPayout} Gold</div><div class="feed-stat-sub">Общий призовой фонд в Gold</div></div><div class="stat-custom-emblem">${getStatCustomEmblemSVG("gold")}</div></div>
    </div>
  `;

  if (!currentUser) {
    root.innerHTML = `
      ${getAdBillboardHTML()}
      <div class="mirror-card" style="padding:36px 28px; text-align:left; margin-bottom:18px;">
        <div style="margin-bottom:14px;"><span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> STANDOFF 2</span></div>
        <h1 style="font-family:var(--font-display); font-size:clamp(21px, 3.6vw, 34px); font-weight:900; line-height:1.2; letter-spacing:0.8px; color:#ffffff; text-align:left; max-width:820px; margin-bottom:14px;">
          Cyber 6 Tournament — Турнирная организация по дисциплине <span style="color:var(--accent-soft);">STANDOFF 2</span>
        </h1>
        <p style="font-size:14px; color:var(--white-soft); max-width:660px; line-height:1.65; text-align:left; margin-bottom:24px;">
          Официальная турнирная платформа для соревнований 5v5, 2v2 и 1v1, создания кланов, верифицированных организаторов и призовых фондов в Gold.
        </p>
        <button type="button" class="auth-submit-btn" style="width:auto; min-width:210px; padding:14px 36px; font-size:13px;" onclick="window.goRoute('/authorization')">НАЧАТЬ</button>
      </div>
      <div style="margin-bottom:16px;">${renderClickableLiveMatchBannerHTML()}</div>
      ${statGridHTML}
    `;
    return;
  }

  const canCreate = canUserAccessOrganizerPanel(currentUser);

  root.innerHTML = `
    ${getAdBillboardHTML()}
    <div class="mirror-card" style="padding:32px 28px; text-align:left; margin-bottom:16px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:16px;">
        <span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> STANDOFF 2</span>
        
      </div>
      <h1 style="font-family:var(--font-display); font-size:clamp(21px, 3.5vw, 33px); font-weight:900; line-height:1.2; letter-spacing:0.8px; margin-bottom:12px; color:#ffffff; text-align:left; max-width:820px;">
        Cyber 6 Tournament — Турнирная организация по дисциплине <span style="color:var(--accent-soft);">STANDOFF 2</span>
      </h1>
      <p style="font-size:13.5px; color:var(--white-soft); max-width:620px; line-height:1.65; text-align:left; margin-bottom:22px;">
        Участвуйте в официальных кубках ${OFFICIAL_SPONSOR_NAME} и турнирах верифицированных организаторов с призовым фондом в Gold.
      </p>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        ${canCreate ? `
          <button type="button" class="auth-submit-btn" style="width:auto; padding:13px 26px;" onclick="window.openCreateTournamentFromFeed()">
            <i class="fas fa-plus-circle" style="margin-right:6px;"></i> СОЗДАТЬ ТУРНИР
          </button>
        ` : ''}
        <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:13px 24px;" onclick="window.goRoute('/tournaments')">
          <i class="fas fa-search" style="color:var(--accent-soft);"></i> НАЙТИ ТУРНИР
        </button>
      </div>
    </div>

    <div style="margin-bottom:16px;">
      ${renderClickableLiveMatchBannerHTML()}
    </div>

    <div style="margin-bottom:16px;">${statGridHTML}</div>

    <div class="mirror-card" style="padding:22px 24px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
        <span style="font-family:var(--font-display); font-size:13px; font-weight:900; letter-spacing:1px;">СПИСОК АКТИВНЫХ ТУРНИРОВ (${tournamentsCount})</span>
        <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 14px; font-size:10px;" onclick="window.goRoute('/tournaments')">ВСЕ ТУРНИРЫ →</button>
      </div>
      ${tournamentsCount > 0 ? `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
          ${cloudTournaments.slice(0, 4).map(t => `
            <div class="trn-catalog-card" style="${t.banner ? `background-image:url('${escapeHTML(t.banner)}');` : ''}" onclick="window.openTournamentDetails('${t.id}')">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:8px; flex-wrap:wrap;">
                ${t.isOfficial ? `<span class="official-c6e-badge">OFFICIAL</span>` : `<span class="glass-pill-badge">${escapeHTML(t.format)}</span>`}
                <span style="font-family:var(--font-display); font-size:11px; color:var(--accent-soft); font-weight:800;">${escapeHTML(t.prizeGold)} Gold</span>
              </div>
              <div style="font-family:var(--font-display); font-size:14px; font-weight:900; color:#ffffff;">${escapeHTML(t.name)}</div>
              <div style="font-size:11px; color:var(--white-dim); margin-top:4px;">${escapeHTML(t.orgName || OFFICIAL_SPONSOR_NAME)} • Слоты: ${(t.participants || []).length}/${t.maxTeams}</div>
            </div>
          `).join("")}
        </div>
      ` : `<div class="glass-subcard" style="text-align:center; padding:22px; font-size:12.5px; color:var(--white-dim);">Активных турниров пока нет (0).</div>`}
    </div>

    <div class="mirror-card" style="padding:22px 24px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
        <span style="font-family:var(--font-display); font-size:13px; font-weight:900; letter-spacing:1px;">НОВОСТИ И АНОНСЫ</span>
        <span class="glass-pill-badge">БАННЕРЫ</span>
      </div>
      <div class="news-banners-grid">
        <div class="news-banner-card"><span class="glass-pill-badge" style="align-self:flex-start;">${escapeHTML(getDevSiteConfig().newsBadge)}</span><div><div style="font-family:var(--font-display); font-size:14px; font-weight:900; margin-bottom:4px;">${escapeHTML(getDevSiteConfig().newsTitle)}</div><div style="font-size:12px; color:var(--white-soft);">${escapeHTML(getDevSiteConfig().newsText)}</div></div></div>
        <div class="news-banner-card"><span class="glass-pill-badge" style="align-self:flex-start;">CYBER POINTS</span><div><div style="font-family:var(--font-display); font-size:14px; font-weight:900; margin-bottom:4px;">РЕЙТИНГ И ОЧКИ CP</div><div style="font-size:12px; color:var(--white-soft);">Побеждайте в турнирах и получайте до 250 CP за матч в таблице лидеров.</div></div></div>
      </div>
    </div>
  `;
}

window.openCreateTournamentFromFeed = () => {
  if (currentUser && currentUser.isAdmin) {
    adminPanelTab = "official";
    selectedExtraSectionKey = "admin";
    return window.goRoute("/admin");
  }
  organizerPanelTab = "create";
  window.goRoute("/organizer");
};

// ============================================================================
// 5. ПРОФИЛЬ ИГРОКА И ПРОФИЛЬ ОРГАНИЗАТОРА (/profile)
// ============================================================================
window.viewPlayerProfile = (uid) => {
  viewedProfileUid = (currentUser && uid === currentUser.uid) ? null : uid;
  isEditingPlayerProfile = false;
  window.goRoute("/profile");
};

window.toggleOrgSocialChoice = (key) => {
  orgSelectedSocials[key] = !orgSelectedSocials[key];
  renderPlayerProfileSection();
};

window.toggleSubscribeToOrg = (orgUid) => {
  if (!currentUser) return window.goRoute("/authorization");
  const org = cloudUsers.find(u => u.uid === orgUid);
  if (!org) return;
  org.subscribers = Array.isArray(org.subscribers) ? org.subscribers : [];
  const idx = org.subscribers.indexOf(currentUser.uid);
  if (idx >= 0) {
    org.subscribers.splice(idx, 1);
    window.showMirrorToast(`Вы отписались от организации ${org.orgName || org.nick}.`);
  } else {
    org.subscribers.push(currentUser.uid);
    window.showMirrorToast(`Вы подписались на организацию ${org.orgName || org.nick}!`);
  }
  syncArenaDataToCloud();
  renderAllStageSections();
};

window.submitOrganizerVerificationForm = (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const orgName = (document.getElementById("org-ver-name")?.value || "").trim();
  const honestAgree = Boolean(document.getElementById("org-ver-honest")?.checked);
  if (!orgName) return window.showMirrorToast("Укажите полное название организации!", true);
  if (!honestAgree) return window.showMirrorToast("Необходимо принять обязательство честных турниров и выдачи призовых!", true);

  const socials = {};
  ["vk", "tg", "yt", "tt"].forEach(k => {
    if (orgSelectedSocials[k]) {
      const val = (document.getElementById(`org-soc-${k}`)?.value || "").trim();
      if (val) socials[k] = val.startsWith("http") ? val : `https://${val}`;
    }
  });
  if (Object.keys(socials).length === 0) {
    return window.showMirrorToast("Выберите и укажите ссылку хотя бы на одну соцсеть (VK, TG, YouTube или TikTok)!", true);
  }

  currentUser.orgName = orgName;
  currentUser.orgSocials = socials;
  currentUser.organizerStatus = "pending";
  currentUser.profileCompleted = true;
  currentUser.subscribers = currentUser.subscribers || [];
  currentUser.orgStaff = currentUser.orgStaff || [];
  isEditingPlayerProfile = false;

  saveCurrentUserEverywhere();
  window.showMirrorToast("Заявка на верификацию организации отправлена Администрации!");
};

function renderOrganizerProfileView(targetOrg, isOwnProfile) {
  const root = document.getElementById("profile-stage-root");
  const isVerified = targetOrg.organizerStatus === "verified";
  const isPending = targetOrg.organizerStatus === "pending";
  const needVerificationForm = isOwnProfile && (!targetOrg.orgName || targetOrg.organizerStatus === "unverified" || isEditingPlayerProfile);
  const bannerInlineStyle = targetOrg.banner ? `background-image: url('${escapeHTML(targetOrg.banner)}');` : "";
  const orgTournaments = cloudTournaments.filter(t => t.organizerUid === targetOrg.uid);
  const subs = Array.isArray(targetOrg.subscribers) ? targetOrg.subscribers : [];
  const isSubbed = currentUser && subs.includes(currentUser.uid);
  const socialsObj = targetOrg.orgSocials || {};
  const socialKeys = Object.keys(socialsObj).filter(k => Boolean(socialsObj[k]));

  root.innerHTML = `
    ${!isOwnProfile ? `
      <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:8px 16px; font-size:10.5px; margin-bottom:14px;" onclick="window.viewPlayerProfile('${currentUser.uid}')">
        ← Вернуться в мой профиль
      </button>
    ` : ''}

    ${needVerificationForm ? `
      <div class="mirror-card" style="margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
          <div style="font-family:var(--font-display); font-size:13px; font-weight:900; color:#ffffff;">ЗАЯВКА НА ВЕРИФИКАЦИЮ ОРГАНИЗАТОРА</div>
          <span class="glass-pill-badge">CYBER 6 VERIFICATION</span>
        </div>

        <form onsubmit="window.submitOrganizerVerificationForm(event)">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:12px;">
            <div class="auth-form-group" style="margin:0;">
              <label class="auth-label">Ник Организатора</label>
              <input type="text" class="auth-input" style="padding-left:14px;" value="${escapeHTML(targetOrg.nick)}" readonly disabled>
            </div>
            <div class="auth-form-group" style="margin:0;">
              <label class="auth-label">Полное название организации</label>
              <input type="text" id="org-ver-name" class="auth-input" style="padding-left:14px;" value="${escapeHTML(targetOrg.orgName || '')}" placeholder="Например: APEX Esports League" required>
            </div>
          </div>

          <div class="auth-label" style="margin-bottom:6px;">Выберите соцсети организации (минимум 1, можно все 4):</div>
          <div class="social-toggle-grid">
            ${["vk", "tg", "yt", "tt"].map(k => {
              const m = getSocialPlatformMeta(k);
              return `<button type="button" class="social-toggle-chip ${orgSelectedSocials[k] ? 'active' : ''}" onclick="window.toggleOrgSocialChoice('${k}')"><i class="${m.icon}" style="color:${m.color};"></i> ${m.name}</button>`;
            }).join("")}
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; margin-bottom:12px;">
            ${["vk", "tg", "yt", "tt"].filter(k => orgSelectedSocials[k]).map(k => {
              const m = getSocialPlatformMeta(k);
              return `
                <div class="auth-form-group" style="margin:0;">
                  <label class="auth-label">Ссылка на ${m.name}</label>
                  <input type="text" id="org-soc-${k}" class="auth-input" style="padding-left:14px;" value="${escapeHTML(socialsObj[k] || '')}" placeholder="https://..." required>
                </div>
              `;
            }).join("")}
          </div>

          <label class="auth-remember-lbl" style="display:flex; align-items:flex-start; gap:9px; padding:12px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid var(--edge-light); margin-bottom:14px; font-size:11.5px; line-height:1.45;">
            <input type="checkbox" id="org-ver-honest" checked style="margin-top:3px;">
            <span>Подтверждаю, что наша организация проводит честные турниры и гарантирует своевременную выдачу призовых в соответствии с регламентом <b>${OFFICIAL_SPONSOR_NAME}</b>.</span>
          </label>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:11px 16px;" onclick="window.triggerPhonePlayerAvatarUpload()"><i class="fas fa-camera" style="color:var(--accent-soft);"></i> Логотип</button>
            <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:11px 16px;" onclick="window.triggerPhoneProfileBannerUpload()"><i class="fas fa-image" style="color:var(--accent-soft);"></i> Баннер</button>
            <button type="submit" class="auth-submit-btn" style="flex:1; min-width:210px;">ПОДАТЬ ЗАЯВКУ НА ВЕРИФИКАЦИЮ</button>
          </div>
        </form>
      </div>
    ` : ''}

    <!-- ПРОФИЛЬ ОРГАНИЗАТОРА -->
    <div class="mirror-card" style="margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:14px;">
        <span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> ОРГАНИЗАТОР ТУРНИРОВ</span>
        <div style="display:flex; gap:7px; flex-wrap:wrap;">
          ${isOwnProfile && isVerified ? `
            <button type="button" class="auth-submit-btn" style="width:auto; padding:7px 14px; font-size:10px;" onclick="window.goRoute('/organizer')">
              <i class="fas fa-trophy"></i> Панель организатора
            </button>
          ` : ''}
          ${isOwnProfile ? `
            <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 13px; font-size:10px;" onclick="window.toggleEditPlayerProfile(${!isEditingPlayerProfile})">
              <i class="fas fa-cog"></i> Настройки
            </button>
            <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 11px; font-size:10px; color:#fb7185;" onclick="window.logoutCurrentUser()"><i class="fas fa-sign-out-alt"></i></button>
          ` : ''}
        </div>
      </div>

      <div class="profile-hero-banner" style="${bannerInlineStyle}; margin-bottom:16px;">
        ${isOwnProfile ? `
          <button type="button" class="banner-upload-chip" onclick="window.triggerPhoneProfileBannerUpload()">
            <i class="fas fa-image" style="color:var(--accent-soft);"></i> Баннер организации
          </button>
        ` : ''}

        <div class="profile-top-row" style="margin-top:8px;">
          <div class="so2-avatar-stage esports-avatar-frame" ${isOwnProfile ? 'onclick="window.triggerPhonePlayerAvatarUpload()"' : ''}>
            <img src="${escapeHTML(targetOrg.avatar)}" alt="Org Logo">
            ${isOwnProfile ? `<div class="so2-avatar-upload-badge"><i class="fas fa-camera"></i></div>` : ''}
          </div>

          <div style="flex:1; min-width:200px;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
              ${isVerified
                ? `<span class="verified-org-check">${getVerifiedOrgCheckSVG(13)} ВЕРИФИЦИРОВАННЫЙ ОРГАНИЗАТОР</span>`
                : `<span class="glass-pill-badge" style="color:var(--accent-soft);">${isPending ? 'НА ПРОВЕРКЕ ВЕРИФИКАЦИИ' : 'ТРЕБУЕТСЯ ВЕРИФИКАЦИЯ'}</span>`}
              <span class="glass-pill-badge">ПОДПИСЧИКОВ: ${subs.length}</span>
            </div>

            <h2 style="font-family:var(--font-display); font-size:23px; font-weight:900; color:#ffffff; line-height:1.15;">
              ${escapeHTML(targetOrg.orgName || "Название организации не указано")}
            </h2>
            <div style="font-size:12px; color:var(--white-soft); margin-top:4px;">
              Организатор: <b>${escapeHTML(targetOrg.nick)}</b> • Проведено турниров: <b>${orgTournaments.length}</b>
            </div>

            ${socialKeys.length > 0 ? `
              <div class="org-socials-row">
                ${socialKeys.map(k => {
                  const m = getSocialPlatformMeta(k);
                  return `<a href="${escapeHTML(socialsObj[k])}" target="_blank" rel="noopener" class="org-social-emblem-btn"><i class="${m.icon}" style="color:${m.color}; font-size:13px;"></i> ${m.name}</a>`;
                }).join("")}
              </div>
            ` : ''}

            ${!isOwnProfile ? `
              <div style="margin-top:12px;">
                <button type="button" class="${isSubbed ? 'social-auth-btn' : 'auth-submit-btn'}" style="width:auto; padding:9px 20px; font-size:10.5px;" onclick="window.toggleSubscribeToOrg('${targetOrg.uid}')">
                  ${isSubbed ? '✓ Вы подписаны на организацию' : '+ Подписаться на организацию'}
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- ИСТОРИЯ ПРОВЕДЁННЫХ ТУРНИРОВ ОРГАНИЗАЦИИ -->
      <div>
        <div style="font-family:var(--font-display); font-size:12px; font-weight:900; color:#ffffff; letter-spacing:1px; margin-bottom:10px;">
          ИСТОРИЯ ТУРНИРОВ ОРГАНИЗАЦИИ (${orgTournaments.length})
        </div>
        ${orgTournaments.length === 0 ? `
          <div class="glass-subcard" style="text-align:center; padding:22px; font-size:12px; color:var(--white-dim);">
            Организация пока не провела ни одного турнира. ${isOwnProfile && isVerified ? 'Создайте первый турнир в Панели организатора.' : ''}
          </div>
        ` : `
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:10px;">
            ${orgTournaments.map(t => `
              <div class="glass-subcard" style="cursor:pointer;" onclick="window.openTournamentDetails('${t.id}')">
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                  <span class="glass-pill-badge">${escapeHTML(t.format)}</span>
                  <span style="font-family:var(--font-display); font-size:11px; color:var(--accent-soft); font-weight:800;">${escapeHTML(t.prizeGold)} Gold</span>
                </div>
                <div style="font-family:var(--font-display); font-size:13.5px; font-weight:900;">${escapeHTML(t.name)}</div>
                <div style="font-size:11px; color:var(--white-dim); margin-top:4px;">Статус: ${t.status === 'finished' ? 'Завершён' : 'Открыт'} • ${escapeHTML(t.startDate)}</div>
              </div>
            `).join("")}
          </div>
        `}
      </div>
    </div>
  `;
}

function renderPlayerProfileSection() {
  const root = document.getElementById("profile-stage-root");
  if (!root || !currentUser) return;

  const targetUser = viewedProfileUid ? (cloudUsers.find(u => u.uid === viewedProfileUid) || currentUser) : currentUser;
  const isOwnProfile = targetUser.uid === currentUser.uid;

  // Если это профиль организатора — рендерим отдельный дизайн Организатора!
  if (targetUser.accountType === "organizer") {
    return renderOrganizerProfileView(targetUser, isOwnProfile);
  }

  const clan = getPlayerClan(targetUser);
  const st = targetUser.stats || { kd: "0.00", kills: 0, deaths: 0, impact: 0, matchesPlayed: 0, wins: 0, losses: 0 };
  const history = Array.isArray(targetUser.matchHistory) ? targetUser.matchHistory : [];
  const needOnboarding = isOwnProfile && (!currentUser.profileCompleted || isEditingPlayerProfile);

  const kdNum = parseFloat(st.kd || "0") || 0;
  const kdFormatted = kdNum.toFixed(2);
  const wrPct = (st.matchesPlayed || 0) > 0 ? Math.round(((st.wins || 0) / st.matchesPlayed) * 100) : 0;
  const cpVal = targetUser.cp || 0;

  const kdPct = Math.max(8, Math.min(100, Math.round((kdNum / 2.2) * 100)));
  const wrGaugePct = Math.max(8, Math.min(100, wrPct));

  const mainRole = targetUser.playRole || "Рифлер / Энтри";
  const rolesList = ["Рифлер / Энтри", "Снайпер (AWM)", "Капитан (IGL)", "Люркер / Клатчер", "Саппорт"];
  const userFlag = targetUser.regionFlag || getFlagByRegionString(targetUser.region);

  const hasLockedSo2Id = Boolean(currentUser.so2Id && currentUser.so2IdUpdatedAt);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const msPassed = Date.now() - (currentUser.so2IdUpdatedAt || 0);
  const daysLeft = Math.max(0, Math.ceil((sevenDaysMs - msPassed) / (24 * 60 * 60 * 1000)));
  const idLockedBy7Days = hasLockedSo2Id && msPassed < sevenDaysMs;

  const bannerInlineStyle = targetUser.banner ? `background-image: url('${escapeHTML(targetUser.banner)}');` : "";

  root.innerHTML = `
    ${!isOwnProfile ? `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;"><button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:8px 16px; font-size:10.5px;" onclick="window.viewPlayerProfile('${currentUser.uid}')">← Вернуться в мой профиль</button><button type="button" class="auth-submit-btn" style="width:auto; padding:8px 16px; font-size:10.5px;" onclick="window.openDirectChatWith('${targetUser.uid}')"><i class="fas fa-comment-dots"></i> Написать в ЛС</button></div>` : ''}

    ${needOnboarding ? `
      <div class="mirror-card" style="margin-bottom:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px;">
          <div style="font-family:var(--font-display); font-size:13px; font-weight:900; color:#ffffff; letter-spacing:1.2px;">НАСТРОЙКИ ПРОФИЛЯ</div>
          <span class="glass-pill-badge">STANDOFF 2</span>
        </div>
        <form onsubmit="window.saveCompletedPlayerProfile(event)">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
            <div class="auth-form-group" style="margin:0;"><label class="auth-label">Никнейм (латиница)</label><input type="text" id="prof-edit-nick" class="auth-input" style="padding-left:14px;" value="${escapeHTML(currentUser.nick || '')}" required></div>
            <div class="auth-form-group" style="margin:0;"><label class="auth-label">ID в Standoff 2 ${idLockedBy7Days ? `(смена через ${daysLeft} дн.)` : ''}</label><input type="text" id="prof-edit-so2id" class="auth-input" style="padding-left:14px;" value="${escapeHTML(currentUser.so2Id || '')}" ${hasLockedSo2Id ? 'readonly' : 'required'}></div>
            <div class="auth-form-group" style="margin:0;"><label class="auth-label">Ссылка на профиль SO2</label><input type="text" id="prof-edit-so2link" class="auth-input" style="padding-left:14px;" value="${escapeHTML(currentUser.so2ProfileLink || '')}" required></div>
            <div class="auth-form-group" style="margin:0;"><label class="auth-label">Возраст</label><input type="number" id="prof-edit-age" class="auth-input" style="padding-left:14px;" min="10" max="60" value="${escapeHTML(currentUser.age || '17')}" required></div>
            <div class="auth-form-group" style="margin:0;"><label class="auth-label">Регион (нельзя изменить)</label><input type="text" class="auth-input" style="padding-left:14px;" value="${escapeHTML(userFlag)} Зафиксирован" readonly disabled></div>
            <div class="auth-form-group" style="margin:0;">
              <label class="auth-label">Выбрать роль</label>
              <input type="hidden" id="prof-edit-role" value="${escapeHTML(mainRole)}">
              <div class="glass-select-wrap" id="custom-role-dropdown">
                <button type="button" class="glass-select-trigger" onclick="window.toggleGlassDropdown('custom-role-dropdown', event)">
                  <span id="custom-role-label">${escapeHTML(mainRole)}</span><i class="fas fa-chevron-down" style="font-size:11px; color:var(--accent-soft);"></i>
                </button>
                <div class="glass-select-menu">
                  ${rolesList.map(r => `<button type="button" class="glass-select-option ${r === mainRole ? 'selected' : ''}" onclick="window.selectGlassDropdownOption('custom-role-dropdown', 'prof-edit-role', 'custom-role-label', '${escapeHTML(r)}')">${escapeHTML(r)}</button>`).join("")}
                </div>
              </div>
            </div>
          </div>
          ${hasLockedSo2Id ? `<div class="glass-subcard" style="margin-top:12px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; padding:12px 14px;"><div style="font-size:11.5px; color:var(--white-soft);">Смена SO2 ID доступна через <b>7 дней</b> по запросу Администрации.</div><button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:8px 14px; font-size:10px;" onclick="window.requestSo2IdChangeToAdmin()">${currentUser.so2IdChangeRequested ? 'Запрос отправлен' : 'Запросить смену ID'}</button></div>` : ''}
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
            <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:11px 16px;" onclick="window.triggerPhonePlayerAvatarUpload()"><i class="fas fa-camera" style="color:var(--accent-soft);"></i> Аватар</button>
            <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:11px 16px;" onclick="window.triggerPhoneProfileBannerUpload()"><i class="fas fa-image" style="color:var(--accent-soft);"></i> Баннер</button>
            <button type="submit" class="auth-submit-btn" style="flex:1; min-width:200px;">СОХРАНИТЬ НАСТРОЙКИ</button>
          </div>
        </form>
      </div>
    ` : ''}

    <div class="mirror-card" style="margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:14px;">
        <span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> STANDOFF 2</span>
        ${isOwnProfile ? `
          <div style="display:flex; gap:7px; flex-wrap:wrap;">
            ${currentUser.isAdmin ? `<button type="button" class="auth-submit-btn" style="width:auto; padding:7px 13px; font-size:10px;" onclick="window.goRoute('/admin')"><i class="fas fa-user-shield"></i> Админ-панель</button>` : ''}
            <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 13px; font-size:10px;" onclick="window.toggleEditPlayerProfile(${!isEditingPlayerProfile})"><i class="fas fa-cog"></i> Настройки профиля</button>
            <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 11px; font-size:10px; color:#fb7185;" onclick="window.logoutCurrentUser()"><i class="fas fa-sign-out-alt"></i></button>
          </div>
        ` : ''}
      </div>

      <div class="profile-hero-banner" style="${bannerInlineStyle}; margin-bottom:16px;">
        ${isOwnProfile ? `<button type="button" class="banner-upload-chip" onclick="window.triggerPhoneProfileBannerUpload()"><i class="fas fa-image" style="color:var(--accent-soft);"></i> Сменить баннер</button>` : ''}
        <div class="profile-top-row" style="margin-top:8px;">
          <div class="so2-avatar-stage esports-avatar-frame" ${isOwnProfile ? 'onclick="window.triggerPhonePlayerAvatarUpload()"' : ''}>
            <img src="${escapeHTML(targetUser.avatar)}" alt="Avatar">
            ${isOwnProfile ? `<div class="so2-avatar-upload-badge"><i class="fas fa-camera"></i></div>` : ''}
          </div>
          <div style="flex:1; min-width:180px;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px;">
              ${clan ? `<span class="glass-pill-badge" style="cursor:pointer;" onclick="window.viewClanProfile('${clan.id}')">[${escapeHTML(clan.tag)}] ${escapeHTML(clan.name)}</span>` : ''}
              <span class="cp-badge-pill">${getCPEmblemSVG(14)} ${cpVal} CP</span>
            </div>
            <h2 style="font-family:var(--font-display); font-size:23px; font-weight:900; color:#ffffff; line-height:1.15;">${escapeHTML(targetUser.nick)}${renderUserBadgesHTML(targetUser)}</h2>
            <div style="margin-top:10px;">
              ${targetUser.so2ProfileLink ? `<a href="${escapeHTML(targetUser.so2ProfileLink)}" target="_blank" rel="noopener" class="so2-compact-emblem-btn">${getSO2EmblemSVG(15)} <span>STANDOFF 2</span></a>` : `<button type="button" class="so2-compact-emblem-btn" onclick="${isOwnProfile ? 'window.toggleEditPlayerProfile(true)' : ''}">${getSO2EmblemSVG(15)} <span>STANDOFF 2</span></button>`}
            </div>
          </div>
        </div>
      </div>

      <div class="tri-gauges-stage" style="margin-bottom:16px;">
        ${buildDynamicCircularGauge({
          id: "pl_kd_ratio", size: 104, strokeWidth: 7,
          pct: (st.kills || 0) + (st.deaths || 0) > 0 ? Math.round(((st.kills || 0) / ((st.kills || 0) + (st.deaths || 0))) * 100) : 8,
          centerValue: `${st.kills || 0} / ${st.deaths || 0}`, centerSub: "K / D",
          label: "Убийств / Смертей", isPositive: (st.kills || 0) >= (st.deaths || 0) && (st.kills || 0) > 0, elevated: false
        })}
        ${buildDynamicCircularGauge({
          id: "pl_kd_main", size: 128, strokeWidth: 8.5, pct: kdPct,
          centerValue: kdFormatted, centerSub: "K/D", label: "K/D", isPositive: kdNum >= 1.0, elevated: true
        })}
        ${buildDynamicCircularGauge({
          id: "pl_wr", size: 104, strokeWidth: 7, pct: wrGaugePct,
          centerValue: `${wrPct}%`, centerSub: `${st.wins || 0}W / ${st.losses || 0}L`,
          label: "W/R (Win Rate)", isPositive: wrPct >= 50, elevated: false
        })}
      </div>

      <div class="passport-meta-grid">
        <div class="passport-meta-cell" style="cursor:pointer;" onclick="window.copyPlayerSo2Id('${escapeHTML(targetUser.so2Id || '')}')"><div class="passport-meta-lbl"><i class="fas fa-id-badge" style="color:var(--accent-soft);"></i> Игровой ID (SO2)</div><div class="passport-meta-val" style="font-family:var(--font-display); display:flex; align-items:center; justify-content:space-between;"><span class="allow-copy">${escapeHTML(targetUser.so2Id || 'Не указан')}</span><i class="far fa-copy" style="font-size:11px; color:var(--accent-soft);"></i></div></div>
        <div class="passport-meta-cell"><div class="passport-meta-lbl"><i class="fas fa-user-clock" style="color:var(--accent-soft);"></i> Возраст</div><div class="passport-meta-val">${escapeHTML(targetUser.age ? targetUser.age + ' лет' : 'Не указан')}</div></div>
        <div class="passport-meta-cell"><div class="passport-meta-lbl"><i class="fas fa-flag" style="color:var(--accent-soft);"></i> Регион</div><div class="passport-meta-val" style="font-size:20px; line-height:1;">${escapeHTML(userFlag)}</div></div>
        <div class="passport-meta-cell"><div class="passport-meta-lbl"><i class="fas fa-crosshairs" style="color:var(--accent-soft);"></i> Боевая роль</div><div class="passport-meta-val">${escapeHTML(mainRole)}</div></div>
      </div>
    </div>

    <div class="mirror-card" style="padding:22px 24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-family:var(--font-display); font-size:12px; font-weight:900; color:#ffffff; letter-spacing:1px;">ИСТОРИЯ ТУРНИРНЫХ МАТЧЕЙ (${history.length})</span>
        <span class="glass-pill-badge">СЫГРАНО: ${history.length}</span>
      </div>
      ${history.length === 0 ? `<div class="glass-subcard" style="text-align:center; padding:20px; font-size:12px; color:var(--white-dim);">История матчей пуста (0 игр).</div>` : `
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${history.slice(0, 12).map(h => `
            <div class="glass-subcard" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:11px 14px; border-left:3px solid ${h.result === 'WIN' ? '#16a34a' : '#c2410c'};">
              <div>
                <div style="font-family:var(--font-display); font-size:12px; font-weight:900; color:#fff;">${escapeHTML(h.tournamentName)} • vs ${escapeHTML(h.opponent)}</div>
                <div style="font-size:11px; color:var(--white-dim); margin-top:2px;">Карта: ${escapeHTML(h.map)} • Счёт: <b>${escapeHTML(h.score)}</b> • ${escapeHTML(h.date || '')}</div>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="glass-pill-badge" style="color:${h.result === 'WIN' ? '#86efac' : '#fb923c'};">${escapeHTML(h.result)}</span>
                ${h.cpGained ? `<span class="cp-badge-pill">+${h.cpGained} CP</span>` : ''}
              </div>
            </div>
          `).join("")}
        </div>
      `}
    </div>
  `;
}

window.copyPlayerSo2Id = (idText) => {
  if (!idText) { window.toggleEditPlayerProfile(true); return window.showMirrorToast("Сначала укажите игровой ID Standoff 2!"); }
  try { navigator.clipboard.writeText(idText); window.showMirrorToast(`Игровой ID ${idText} скопирован!`); }
  catch (e) { window.showMirrorToast(`Ваш SO2 ID: ${idText}`); }
};
window.toggleEditPlayerProfile = (state) => { isEditingPlayerProfile = Boolean(state); renderPlayerProfileSection(); };
window.requestSo2IdChangeToAdmin = () => { if (!currentUser) return; currentUser.so2IdChangeRequested = true; saveCurrentUserEverywhere(); window.showMirrorToast("Запрос отправлен Администрации!"); };

window.saveCompletedPlayerProfile = (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const rawNick = (document.getElementById("prof-edit-nick")?.value || "").trim();
  const so2Id = (document.getElementById("prof-edit-so2id")?.value || "").trim();
  let so2Link = (document.getElementById("prof-edit-so2link")?.value || "").trim();
  const age = (document.getElementById("prof-edit-age")?.value || "17").trim();
  const playRole = (document.getElementById("prof-edit-role")?.value || "Рифлер / Энтри").trim();

  const nickCheck = validateNicknameLive(rawNick, currentUser.uid);
  if (!nickCheck.ok) return window.showMirrorToast("Проверьте ник (только латиница, без матов и не занят)!", true);
  if (!so2Id) return window.showMirrorToast("Укажите Standoff 2 ID!", true);
  if (cloudUsers.some(u => u.uid !== currentUser.uid && String(u.so2Id || "").toLowerCase() === so2Id.toLowerCase())) return window.showMirrorToast("Этот Standoff 2 ID уже занят!", true);
  const hadPreviousId = Boolean(currentUser.so2Id && currentUser.so2IdUpdatedAt);
  if (hadPreviousId && so2Id !== currentUser.so2Id) return window.showMirrorToast("Сменить ID можно через 7 дней и по запросу Администрации!", true);
  if (so2Link && !so2Link.startsWith("http") && !so2Link.startsWith("standoff2://")) so2Link = `https://standoff2.com/profile/${encodeURIComponent(so2Link)}`;

  currentUser.nick = rawNick;
  if (!hadPreviousId) { currentUser.so2Id = so2Id; currentUser.so2IdUpdatedAt = Date.now(); }
  currentUser.so2ProfileLink = so2Link; currentUser.age = age; currentUser.playRole = playRole;
  currentUser.profileCompleted = true; isEditingPlayerProfile = false;
  saveCurrentUserEverywhere();
  window.showMirrorToast("Настройки профиля сохранены!");
};

window.logoutCurrentUser = async () => {
  _stopPrivateListeners();
  try { await signOut(auth); } catch (e) {}
  currentUser = null; viewedProfileUid = null; viewedClanId = null;
  localStorage.removeItem("c6e_active_user_v29"); sessionStorage.removeItem("c6e_active_user_v29");
  updateTopRightPlayerUI(); window.showMirrorToast("Вы вышли из аккаунта."); window.goRoute("/feed");
};

// ============================================================================
// 6. УМНАЯ СИСТЕМА ПРАВ (RBAC), ПАНЕЛЬ ОРГАНИЗАТОРА И ДВИЖОК СЕТОК ДО 32 МЕСТ
// ============================================================================
let createEntryMode = "subs"; // "subs" | "gold"
let createSubPlatform = "Telegram"; // "Telegram" | "VK"
let tournamentDetailTab = "bracket"; // "bracket" | "participants" | "control"
let activeControlMatchId = null;

let tournamentSearchQuery = "";
let tournamentStageFilter = "ALL"; // "ALL" | "registration" | "checkin" | "live" | "finished"
const OFFICIAL_SO2_MAPS = ["Sandstone", "Rust", "Pravincia", "Hanami", "Dune", "Breeze", "Prison"];
const getMapBannerUrl = (mapName) => `${encodeURIComponent(mapName || "Sandstone")}.png`;

function appendTournamentAuditLog(trn, actionText) {
  if (!trn) return;
  trn.auditLog = Array.isArray(trn.auditLog) ? trn.auditLog : [];
  trn.auditLog.unshift({
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    actor: currentUser ? currentUser.nick : "System",
    text: actionText
  });
  if (trn.auditLog.length > 40) trn.auditLog.length = 40;
}

window.onTournamentSearchInput = (val) => {
  tournamentSearchQuery = val || "";
  renderTournamentsCatalogGridOnly();
};

function renderTournamentsCatalogGridOnly() {
  const grid = document.getElementById("tournaments-catalog-grid");
  if (!grid) return;
  const qTrn = tournamentSearchQuery.trim().toLowerCase();
  const filtered = cloudTournaments.filter(t => {
    const fmtOk = tournamentFilterFormat === "ALL" || t.format === tournamentFilterFormat;
    const stOk = tournamentStageFilter === "ALL" || (t.stage || "registration") === tournamentStageFilter;
    const qOk = !qTrn || String(t.name || "").toLowerCase().includes(qTrn) || String(t.orgName || "").toLowerCase().includes(qTrn);
    return fmtOk && stOk && qOk;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="glass-subcard" style="text-align:center; padding:26px; font-size:12.5px; color:var(--white-dim);">Турниры не найдены (0).</div>`;
    return;
  }

  grid.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(275px, 1fr)); gap:12px;">
      ${filtered.map(t => `
        <div class="trn-catalog-card" style="${t.banner ? `background-image:url('${escapeHTML(t.banner)}');` : ''}" onclick="window.openTournamentDetails('${t.id}')">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:8px; flex-wrap:wrap;">
            ${t.isOfficial ? `<span class="official-c6e-badge">OFFICIAL</span>` : `<span class="verified-org-check">${getVerifiedOrgCheckSVG(11)} ${escapeHTML(t.orgName)}</span>`}
            <span style="font-family:var(--font-display); font-size:12px; font-weight:900; color:var(--accent-soft);">${escapeHTML(t.prizeGold)} Gold</span>
          </div>
          <div style="font-family:var(--font-display); font-size:15px; font-weight:900; color:#ffffff;">${escapeHTML(t.name)}</div>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:7px; flex-wrap:wrap;">
            <span style="font-size:11px; color:var(--white-soft);">${escapeHTML(t.format)} • ${escapeHTML(t.seriesFormat || 'BO1')} • ${escapeHTML(t.bracketType)}</span>
            ${getStageBadgeHTML(t.stage)}
          </div>
          <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--white-dim); margin-top:8px;">
            <span>Слоты: <b style="color:#fff;">${(t.participants || []).length} / ${t.maxTeams}</b></span>
            <span>Старт: ${escapeHTML(t.startDate)}</span>
          </div>
          <div class="trn-slot-bar-track">
            <div class="trn-slot-bar-fill" style="width:${Math.min(100, Math.round((((t.participants || []).length) / Math.max(1, t.maxTeams)) * 100))}%;"></div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

window.setTournamentStageFilter = (st) => {
  tournamentStageFilter = st;
  renderTournamentsSection();
};

// Интерактивный бан карт (Map Veto): поочерёдно баним карты, пока не останется 1 финальная карта матча!
window.vetoBanMapInMatch = (tId, matchId, mapName) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, matchId) : null;
  if (!trn || !match || !currentUser) return;
  if (!canModerateBracket(getUserRoleInTournament(currentUser, trn))) return;

  match.bannedMaps = Array.isArray(match.bannedMaps) ? match.bannedMaps : [];
  if (match.bannedMaps.includes(mapName)) return;
  const remainingBefore = OFFICIAL_SO2_MAPS.filter(m => !match.bannedMaps.includes(m));
  if (remainingBefore.length <= 1) return;

  match.bannedMaps.push(mapName);
  const remainingAfter = OFFICIAL_SO2_MAPS.filter(m => !match.bannedMaps.includes(m));
  if (remainingAfter.length === 1) {
    match.map = remainingAfter[0];
    appendTournamentAuditLog(trn, `Map Veto завершён (${match.teamA?.name || 'A'} vs ${match.teamB?.name || 'B'}) → выбрана карта ${match.map}`);
    window.showMirrorToast(`Финальная карта матча выбрана: ${match.map}!`);
  }
  syncArenaDataToCloud();
  renderTournamentsSection();
};

window.resetMatchVeto = (tId, matchId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, matchId) : null;
  if (!trn || !match) return;
  match.bannedMaps = [];
  syncArenaDataToCloud();
  renderTournamentsSection();
  window.showMirrorToast("Map Veto сброшен.");
};

// Переоткрыть матч (только Главный Судья) на случай ошибочного счёта

let matchRoomSubTab = "overview"; // "overview" | "scanner" | "referee"
let ocrScanProgress = 0;
let ocrIsScanning = false;

window.setMatchRoomSubTab = (tab) => {
  matchRoomSubTab = tab;
  renderTournamentsSection();
};

// Инициализация строк игроков матча для Сканера Таба (из составов кланов или 1v1)
function ensureMatchScannedPlayers(trn, match) {
  if (Array.isArray(match.scannedRows) && match.scannedRows.length > 0) return match.scannedRows;
  const rows = [];
  const collectSide = (teamObj, sideKey) => {
    if (!teamObj) return;
    if (trn.format === "1v1") {
      rows.push({ uid: teamObj.id, nick: teamObj.name, side: sideKey, kills: 0, deaths: 0, impact: 0 });
    } else {
      const clan = cloudClans.find(c => c.id === teamObj.id);
      if (clan && Array.isArray(clan.members) && clan.members.length > 0) {
        clan.members.slice(0, trn.format === "2v2" ? 2 : 5).forEach(m => {
          rows.push({ uid: m.uid, nick: m.nick, side: sideKey, kills: 0, deaths: 0, impact: 0 });
        });
      } else {
        rows.push({ uid: teamObj.id, nick: teamObj.name, side: sideKey, kills: 0, deaths: 0, impact: 0 });
      }
    }
  };
  collectSide(match.teamA, "A");
  collectSide(match.teamB, "B");
  match.scannedRows = rows;
  return rows;
}

window.updateScannedRowField = (tId, mId, rowIdx, field, rawVal) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, mId) : null;
  if (!trn || !match || !match.scannedRows || !match.scannedRows[rowIdx]) return;
  match.scannedRows[rowIdx][field] = Math.max(0, parseInt(rawVal || "0", 10) || 0);
  const r = match.scannedRows[rowIdx];
  const kd = r.deaths > 0 ? (r.kills / r.deaths) : (r.kills > 0 ? r.kills : 0);
  const cp = calculatePlayerMatchCP(kd);
  const kdEl = document.getElementById(`scan-kd-${rowIdx}`);
  const cpEl = document.getElementById(`scan-cp-${rowIdx}`);
  if (kdEl) kdEl.innerText = kd.toFixed(2);
  if (cpEl) cpEl.innerText = `+${cp} CP`;
};

// Автоматический OCR-сканер скриншота Таба Standoff 2 (Tesseract.js)

function extractClanTagFromName(teamName = "") {
  const m = String(teamName).match(/\[([^\]]+)\]/);
  return m ? m[1].trim() : String(teamName).trim().split(/\s+/)[0];
}

function cropDataUrlRegion(dataUrl, rx, ry, rw, rh) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const sx = Math.floor(img.width * rx);
      const sy = Math.floor(img.height * ry);
      const sw = Math.max(10, Math.floor(img.width * rw));
      const sh = Math.max(10, Math.floor(img.height * rh));
      c.width = sw;
      c.height = sh;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Подтверждение участия в конкретном матче за 30 минут до начала
window.confirmMatch30MinCheckIn = (tId, matchId, side) => {
  if (!currentUser) return window.goRoute("/authorization");
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, matchId) : null;
  if (!trn || !match) return;
  if (side === "A") match.confirmed30mA = true;
  if (side === "B") match.confirmed30mB = true;
  if (side === "A") match.readyA = true;
  if (side === "B") match.readyB = true;
  appendTournamentAuditLog(trn, `Подтверждение матча за 30 мин: сторона ${side} (${side === 'A' ? match.teamA?.name : match.teamB?.name}) — ${currentUser.nick}`);
  if (match.confirmed30mA && match.confirmed30mB && match.status === "pending") {
    match.status = "live";
    appendTournamentAuditLog(trn, `Обе стороны подтвердили матч → статус переведён в LIVE`);
    window.showMirrorToast("Обе команды подтвердили участие! Матч готов к старту (LIVE).");
  } else {
    window.showMirrorToast(`Участие стороны ${side} подтверждено (за 30 мин до старта)!`);
  }
  syncLiveMatchesRegistry();
  syncArenaDataToCloud();
  renderAllStageSections();
};

// Парсинг строк реального Таба Standoff 2: # | [TAG] Nick | У (Kills) | П (Assists/Impact) | С (Deaths) | Счет | Пинг
function parseStandoff2TabHalf(rawText, expectedTag) {
  const lines = String(rawText || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const tagClean = String(expectedTag || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const hasVictoryWord = /побед|victory|win/i.test(rawText);

  // Поиск счёта в верхней части половины (первая строка с числом 0..25 рядом с Оборона/Атака/Победа)
  let sideScore = null;
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    const nums = lines[i].match(/\b(\d{1,2})\b/g);
    if (nums && nums.length > 0) {
      const candidate = parseInt(nums[nums.length - 1], 10);
      if (candidate >= 0 && candidate <= 30) { sideScore = candidate; break; }
    }
  }

  // Проверка наличия тега клана в тексте этой половины Таба
  const normText = rawText.toLowerCase().replace(/[^a-z0-9]/g, "");
  const tagFound = tagClean.length >= 2 && normText.includes(tagClean);

  // Извлечение строк игроков: ищем 5 чисел в конце строки: У (Kills), П (Impact), С (Deaths), Счет, Пинг
  const players = [];
  lines.forEach(ln => {
    const m = ln.match(/(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,3})\s+(\d{1,3})\s*$/);
    if (m) {
      const kills = parseInt(m[1], 10) || 0;
      const impact = parseInt(m[2], 10) || 0;
      const deaths = parseInt(m[3], 10) || 0;
      const score = parseInt(m[4], 10) || 0;
      const ping = parseInt(m[5], 10) || 0;
      const namePart = ln.slice(0, m.index).replace(/^\d+\s+/, "").trim();
      players.push({ rawName: namePart, kills, impact, deaths, score, ping });
    }
  });

  return { sideScore, hasVictoryWord, tagFound, players };
}

window.runTabScreenshotOCR = async (tId, mId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, mId) : null;
  if (!trn || !match) return;
  if (!match.tabScreenshot) return window.showMirrorToast("Сначала загрузите скриншот Таба игры!", true);
  if (ocrIsScanning) return;

  const rows = ensureMatchScannedPlayers(trn, match);
  ocrIsScanning = true;
  ocrScanProgress = 10;
  renderTournamentsSection();

  const setProgress = (pct, label) => {
    ocrScanProgress = pct;
    const bar = document.getElementById("ocr-prog-bar");
    const lbl = document.getElementById("ocr-prog-lbl");
    if (bar) bar.style.width = `${pct}%`;
    if (lbl) lbl.innerText = label;
  };

  try {
    if (typeof window.Tesseract === "undefined") throw new Error("OCR engine loading");

    // 3-зонная нарезка реального Таба Standoff 2: Левая (CT), Правая (T) и Нижний футер (Карта / Сервер)
    setProgress(22, "Анализ левой половины Таба (CT)...");
    const leftCrop = await cropDataUrlRegion(match.tabScreenshot, 0.0, 0.08, 0.50, 0.80);
    const leftRes = await window.Tesseract.recognize(leftCrop, "rus+eng");

    setProgress(55, "Анализ правой половины Таба (T)...");
    const rightCrop = await cropDataUrlRegion(match.tabScreenshot, 0.50, 0.08, 0.50, 0.80);
    const rightRes = await window.Tesseract.recognize(rightCrop, "rus+eng");

    setProgress(82, "Считывание карты и региона сервера...");
    const footerCrop = await cropDataUrlRegion(match.tabScreenshot, 0.0, 0.88, 1.0, 0.12);
    const footerRes = await window.Tesseract.recognize(footerCrop, "rus+eng");

    const leftText = leftRes?.data?.text || "";
    const rightText = rightRes?.data?.text || "";
    const footerText = footerRes?.data?.text || "";

    const tagA = extractClanTagFromName(match.teamA?.name || "");
    const tagB = extractClanTagFromName(match.teamB?.name || "");

    const leftA = parseStandoff2TabHalf(leftText, tagA);
    const rightB = parseStandoff2TabHalf(rightText, tagB);
    const leftB = parseStandoff2TabHalf(leftText, tagB);
    const rightA = parseStandoff2TabHalf(rightText, tagA);

    // Определяем, на какой стороне Таба какая команда (A слева или A справа)
    let aIsLeft = true;
    let verifiedByTags = false;
    if (leftA.tagFound || rightB.tagFound) {
      aIsLeft = true;
      verifiedByTags = (leftA.tagFound && rightB.tagFound) || (trn.format === "1v1");
      if (leftA.tagFound && !rightB.tagFound && tagA.length >= 2) verifiedByTags = true;
    } else if (rightA.tagFound || leftB.tagFound) {
      aIsLeft = false;
      verifiedByTags = (rightA.tagFound && leftB.tagFound) || (trn.format === "1v1");
      if (rightA.tagFound && !leftB.tagFound && tagA.length >= 2) verifiedByTags = true;
    }

    const dataA = aIsLeft ? leftA : rightA;
    const dataB = aIsLeft ? rightB : leftB;

    if (dataA.sideScore !== null) match.scoreA = dataA.sideScore;
    if (dataB.sideScore !== null) match.scoreB = dataB.sideScore;

    // Определяем карту и регион сервера из нижней полосы Таба ("Турнир / Dune / Россия, Москва")
    const foundMap = OFFICIAL_SO2_MAPS.find(mp => footerText.toLowerCase().includes(mp.toLowerCase()));
    if (foundMap) match.map = foundMap;
    const regionMatch = footerText.match(/(Россия[^|\n]*|Москва|Центральная Азия|Европа|Нидерланды|Польша|Франция|Турция|Сингапур)/i);
    match.detectedServerRegion = regionMatch ? regionMatch[0].trim() : "Сервер определён по Табу";

    // Заполняем таблицу игроков: У (Kills), П (Impact), С (Deaths), Счет, Пинг
    const sideARows = rows.filter(r => r.side === "A");
    const sideBRows = rows.filter(r => r.side === "B");
    sideARows.forEach((r, idx) => {
      if (dataA.players[idx]) {
        r.kills = dataA.players[idx].kills;
        r.impact = dataA.players[idx].impact;
        r.deaths = dataA.players[idx].deaths;
        r.ping = dataA.players[idx].ping;
      }
    });
    sideBRows.forEach((r, idx) => {
      if (dataB.players[idx]) {
        r.kills = dataB.players[idx].kills;
        r.impact = dataB.players[idx].impact;
        r.deaths = dataB.players[idx].deaths;
        r.ping = dataB.players[idx].ping;
      }
    });

    // Автоматическая проверка и выдача победы по ТЕГАМ кланов!
    const winByTagA = dataA.hasVictoryWord || (match.scoreA > match.scoreB);
    const winByTagB = dataB.hasVictoryWord || (match.scoreB > match.scoreA);

    if (verifiedByTags && (winByTagA !== winByTagB)) {
      const autoWinnerName = winByTagA ? (match.teamA?.name || "A") : (match.teamB?.name || "B");
      match.tabVerifyStatus = "verified";
      match.tabVerifyMessage = `Теги [${tagA}] / [${tagB}] подтверждены на Табе! Карта: ${match.map} • ${match.detectedServerRegion}. Авто-победа: ${autoWinnerName} (${match.scoreA}:${match.scoreB}).`;
      syncArenaDataToCloud();
      // Если ещё не были начислены CP — автоматически подтверждаем победу и выдаём CP!
      if (!match.cpAwarded) {
        ocrIsScanning = false;
        ocrScanProgress = 100;
        window.applyScannedTabAndAwardCP(tId, mId, true);
        return;
      }
    } else {
      match.tabVerifyStatus = "mismatch";
      match.tabVerifyMessage = `Теги [${tagA}] и [${tagB}] распознаны частично (${match.scoreA}:${match.scoreB}). Проверьте цифры в таблице ниже и подтвердите вручную.`;
      window.showMirrorToast("Таб считан! Проверьте теги и счёт в таблице.", false);
    }
  } catch (err) {
    match.tabVerifyStatus = "mismatch";
    match.tabVerifyMessage = "Не удалось автоматически прочитать текст со скриншота — проверьте значения У/П/С вручную.";
    window.showMirrorToast("Проверьте или введите цифры с Таба вручную.");
  } finally {
    ocrIsScanning = false;
    ocrScanProgress = 100;
    syncArenaDataToCloud();
    renderTournamentsSection();
  }
};

// Автоматическое применение отсканированного Таба и начисление точных CP всем игрокам + команде!
window.applyScannedTabAndAwardCP = (tId, mId, isAutoByTag = false) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, mId) : null;
  if (!trn || !match || !currentUser) return;
  if (!isAutoByTag && !canModerateBracket(getUserRoleInTournament(currentUser, trn))) {
    return window.showMirrorToast("Применять итоги Таба может судья или модератор!", true);
  }
  if (match.cpAwarded) {
    return window.showMirrorToast("Очки CP и статистика за этот матч уже начислены!", true);
  }

  const rows = ensureMatchScannedPlayers(trn, match);
  const sA = match.scoreA || 0;
  const sB = match.scoreB || 0;
  const winSide = sA >= sB ? "A" : "B";
  const winnerObj = winSide === "A" ? match.teamA : match.teamB;
  const loserObj = winSide === "A" ? match.teamB : match.teamA;
  const dateNowStr = new Date().toLocaleDateString();

  // Начисляем точные K/D, Kills, Deaths, Impact и автоматические CP каждому игроку по Табу!
  rows.forEach(r => {
    const u = cloudUsers.find(x => x.uid === r.uid || String(x.nick || "").toLowerCase() === String(r.nick || "").toLowerCase());
    if (!u) return;
    const matchKd = r.deaths > 0 ? (r.kills / r.deaths) : (r.kills > 0 ? r.kills : 0);
    const isWin = r.side === winSide;
    const gainedCp = isWin ? calculatePlayerMatchCP(matchKd) : Math.min(25, calculatePlayerMatchCP(matchKd));

    u.cp = (u.cp || 0) + gainedCp;
    u.stats = u.stats || { kd: "0.00", kills: 0, deaths: 0, impact: 0, matchesPlayed: 0, wins: 0, losses: 0 };
    u.stats.kills = (u.stats.kills || 0) + r.kills;
    u.stats.deaths = (u.stats.deaths || 0) + r.deaths;
    u.stats.impact = (u.stats.impact || 0) + (r.impact || 0);
    u.stats.kd = u.stats.deaths > 0 ? (u.stats.kills / u.stats.deaths).toFixed(2) : (u.stats.kills || 0).toFixed(2);
    u.stats.matchesPlayed = (u.stats.matchesPlayed || 0) + 1;
    if (isWin) u.stats.wins = (u.stats.wins || 0) + 1;
    else u.stats.losses = (u.stats.losses || 0) + 1;

    u.matchHistory = Array.isArray(u.matchHistory) ? u.matchHistory : [];
    u.matchHistory.unshift({
      tournamentName: trn.name,
      opponent: isWin ? (loserObj?.name || "Соперник") : (winnerObj?.name || "Соперник"),
      map: match.map || "Sandstone",
      score: `${sA}:${sB}`,
      result: isWin ? "WIN" : "LOSS",
      cpGained: gainedCp,
      date: dateNowStr
    });
  });

  // Обновляем статистику и CP команды-победителя
  if (trn.format !== "1v1" && winnerObj) {
    const diff = Math.abs(sA - sB);
    const cWin = cloudClans.find(c => c.id === winnerObj.id);
    const cLose = loserObj ? cloudClans.find(c => c.id === loserObj.id) : null;
    if (cWin) {
      const teamKills = rows.filter(r => r.side === winSide).reduce((acc, x) => acc + x.kills, 0);
      const teamDeaths = rows.filter(r => r.side === winSide).reduce((acc, x) => acc + x.deaths, 0);
      cWin.cp = (cWin.cp || 0) + calculateTeamMatchCP(diff, false);
      cWin.kills = (cWin.kills || 0) + teamKills;
      cWin.deaths = (cWin.deaths || 0) + teamDeaths;
      cWin.kd = cWin.deaths > 0 ? (cWin.kills / cWin.deaths).toFixed(2) : (cWin.kills || 0).toFixed(2);
      cWin.matches = (cWin.matches || 0) + 1;
      cWin.wins = (cWin.wins || 0) + 1;
    }
    if (cLose) {
      cLose.matches = (cLose.matches || 0) + 1;
      cLose.losses = (cLose.losses || 0) + 1;
    }
  }

  match.status = "finished";
  match.winner = winSide;
  match.cpAwarded = true;

  // Авто-продвижение победителя по сетке
  if (winnerObj && match.bracketSide === "upper" && trn.bracketData.rounds[match.roundIdx + 1]) {
    const nextM = trn.bracketData.rounds[match.roundIdx + 1][Math.floor(match.matchIdx / 2)];
    if (nextM) {
      if (match.matchIdx % 2 === 0) nextM.teamA = winnerObj;
      else nextM.teamB = winnerObj;
    }
  }
  if (match.roundName === "ГРАНД-ФИНАЛ" && winnerObj) {
    trn.champion = winnerObj;
    trn.runnerUp = loserObj || null;
  }

  appendTournamentAuditLog(trn, `Итоги Таба применены (${winnerObj?.name || winSide} ${sA}:${sB}) — CP начислены автоматически`);
  syncLiveMatchesRegistry();
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast("Итоги Таба применены! Статистика и Cyber Points (CP) начислены автоматически.");
};

window.reopenMatchByChief = (tId, matchId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser) return;
  if (!canChiefControl(getUserRoleInTournament(currentUser, trn))) {
    return window.showMirrorToast("Переоткрыть матч может только Главный Судья!", true);
  }
  const match = findMatchInTournament(trn, matchId);
  if (!match) return;
  match.status = "pending";
  match.winner = null;
  appendTournamentAuditLog(trn, `Главный судья переоткрыл матч ${match.teamA?.name || 'A'} vs ${match.teamB?.name || 'B'}`);
  syncLiveMatchesRegistry();
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast("Матч переоткрыт для корректировки счёта.");
};


// Строгое разделение прав для конкретного турнира:
// "platform_admin" > "chief_referee" (Организатор / Главный судья) > "moderator" (Администратор-модератор сетки) > "player"
function getUserRoleInTournament(userObj, trn) {
  if (!userObj || !trn) return "player";
  if (userObj.isAdmin) return "platform_admin";
  if (trn.organizerUid === userObj.uid) return "chief_referee";
  const ownerOrg = cloudUsers.find(u => u.uid === trn.organizerUid);
  if (ownerOrg && Array.isArray(ownerOrg.orgStaff)) {
    const staffRec = ownerOrg.orgStaff.find(s => s.uid === userObj.uid);
    if (staffRec) {
      return staffRec.role === "Главный судья" ? "chief_referee" : "moderator";
    }
  }
  return "player";
}

function canChiefControl(role) {
  return role === "platform_admin" || role === "chief_referee";
}

function canModerateBracket(role) {
  return role === "platform_admin" || role === "chief_referee" || role === "moderator";
}

// Нормализация участника в объект с аватаркой клана (5v5/2v2) или игрока (1v1)
function normalizeParticipantEntry(raw, format) {
  if (raw && typeof raw === "object" && raw.name) return raw;
  const nameStr = String(raw || "Участник");
  return {
    id: "ENT_" + nameStr.replace(/[^a-zA-Z0-9]/g, ""),
    name: nameStr,
    avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(nameStr)}`,
    type: format === "1v1" ? "player" : "clan",
    checkedIn: true,
    approved: true
  };
}

// Генерация сетки на 4 / 8 / 16 / 32 места (Single Elimination, Double Elimination, Round Robin)
function generateSmartBracketData(trn) {
  const confirmed = (trn.participants || [])
    .map(p => normalizeParticipantEntry(p, trn.format))
    .filter(p => p.approved !== false && (trn.stage === "registration" || p.checkedIn !== false));

  // Перемешивание (Fisher-Yates)
  const seeded = [...confirmed];
  for (let i = seeded.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seeded[i], seeded[j]] = [seeded[j], seeded[i]];
  }

  // Round Robin — все пары каждый с каждым
  if (trn.bracketType === "Round Robin") {
    const rrMatches = [];
    let mIdx = 1;
    for (let i = 0; i < seeded.length; i++) {
      for (let j = i + 1; j < seeded.length; j++) {
        rrMatches.push({
          id: `${trn.id}_RR_${mIdx++}`,
          roundName: "Групповой этап",
          teamA: seeded[i],
          teamB: seeded[j],
          scoreA: 0,
          scoreB: 0,
          map: "Sandstone",
          lobbyId: "",
          status: "pending",
          winner: null,
          isTechWin: false,
          cpAwarded: false
        });
      }
    }
    return { type: "Round Robin", rounds: [rrMatches], lowerRounds: [] };
  }

  // Определение степени двойки (4, 8, 16 или 32)
  const requestedSlots = parseInt(trn.maxTeams, 10) || 8;
  const size = requestedSlots <= 4 ? 4 : (requestedSlots <= 8 ? 8 : (requestedSlots <= 16 ? 16 : 32));
  const totalRounds = Math.log2(size);

  const roundTitleByMatches = (cnt) => {
    if (cnt === 16) return "1/16 ФИНАЛА";
    if (cnt === 8) return "1/8 ФИНАЛА";
    if (cnt === 4) return "1/4 ФИНАЛА";
    if (cnt === 2) return "ПОЛУФИНАЛ";
    return "ГРАНД-ФИНАЛ";
  };

  const rounds = [];
  for (let r = 0; r < totalRounds; r++) {
    const matchCount = size / Math.pow(2, r + 1);
    const rTitle = roundTitleByMatches(matchCount);
    const rMatches = [];
    for (let m = 0; m < matchCount; m++) {
      const slotA = r === 0 ? (seeded[m * 2] || null) : null;
      const slotB = r === 0 ? (seeded[m * 2 + 1] || null) : null;
      rMatches.push({
        id: `${trn.id}_U_R${r}_M${m}`,
        bracketSide: "upper",
        roundIdx: r,
        matchIdx: m,
        roundName: rTitle,
        teamA: slotA,
        teamB: slotB,
        scoreA: 0,
        scoreB: 0,
        map: "Sandstone",
        lobbyId: "",
        status: "pending",
        winner: null,
        isTechWin: false,
        cpAwarded: false
      });
    }
    rounds.push(rMatches);
  }

  // Если в первом раунде у команды нет соперника (BYE), она автоматически проходит в следующий раунд
  if (rounds.length > 1) {
    rounds[0].forEach((m, idx) => {
      if (m.teamA && !m.teamB) {
        m.status = "finished";
        m.winner = "A";
        const nextMatch = rounds[1][Math.floor(idx / 2)];
        if (nextMatch) {
          if (idx % 2 === 0) nextMatch.teamA = m.teamA;
          else nextMatch.teamB = m.teamA;
        }
      }
    });
  }

  // Нижняя сетка для Double Elimination
  const lowerRounds = [];
  if (trn.bracketType === "Double Elimination") {
    const lMatchesCount = Math.max(1, size / 4);
    const l1 = [];
    for (let i = 0; i < lMatchesCount; i++) {
      l1.push({
        id: `${trn.id}_L_R0_M${i}`,
        bracketSide: "lower",
        roundIdx: 0,
        matchIdx: i,
        roundName: "НИЖНЯЯ СЕТКА • РАУНД 1",
        teamA: null,
        teamB: null,
        scoreA: 0,
        scoreB: 0,
        map: "Pravincia",
        lobbyId: "",
        status: "pending",
        winner: null,
        isTechWin: false,
        cpAwarded: false
      });
    }
    lowerRounds.push(l1);
  }

  return { type: trn.bracketType, size, rounds, lowerRounds };
}

function findMatchInTournament(trn, matchId) {
  if (!trn || !trn.bracketData) return null;
  for (const r of (trn.bracketData.rounds || [])) {
    const found = r.find(m => m.id === matchId);
    if (found) return found;
  }
  for (const r of (trn.bracketData.lowerRounds || [])) {
    const found = r.find(m => m.id === matchId);
    if (found) return found;
  }
  return null;
}

function syncLiveMatchesRegistry() {
  const prevFeatured = new Set(cloudMatches.filter(x => x.featuredOnHome).map(x => x.id));
  const activeList = [];
  cloudTournaments.forEach(t => {
    if (!t.bracketData) return;
    [...(t.bracketData.rounds || []), ...(t.bracketData.lowerRounds || [])].forEach(r => {
      r.forEach(m => {
        if (m.status === "live" || m.status === "finished") {
          activeList.push({
            id: m.id,
            tournamentId: t.id,
            tournamentName: t.name,
            format: t.format,
            teamA: m.teamA || { name: "TBD", avatar: "" },
            teamB: m.teamB || { name: "TBD", avatar: "" },
            scoreA: m.scoreA || 0,
            scoreB: m.scoreB || 0,
            score: `${m.scoreA || 0} : ${m.scoreB || 0}`,
            map: m.map || "Sandstone",
            lobbyId: m.lobbyId || "",
            status: m.status,
            featuredOnHome: Boolean(m.featuredOnHome || prevFeatured.has(m.id)),
            startedAt: m.startedAt || null,
            finishedAt: m.finishedAt || null,
            pausedAt: m.pausedAt || null,
            pausedAccumMs: m.pausedAccumMs || 0,
            isPaused: Boolean(m.isPaused),
            durationSec: m.durationSec,
            durationFormatted: m.durationFormatted || ""
          });
        }
      });
    });
  });
  cloudMatches = activeList;
}

window.setOrganizerPanelTab = (tab) => { organizerPanelTab = tab; renderOrganizerPanelSection(); };
window.setCreateEntryMode = (mode) => { createEntryMode = mode; renderOrganizerPanelSection(); renderExtraSections(); };
window.setCreateSubPlatform = (plat) => { createSubPlatform = plat; renderOrganizerPanelSection(); renderExtraSections(); };
window.setTournamentDetailTab = (tab) => { tournamentDetailTab = tab; activeControlMatchId = null; renderTournamentsSection(); };

window.submitCreateTournamentUnified = (e, isOfficialMode = false) => {
  e.preventDefault();
  if (!currentUser) return window.goRoute("/authorization");
  if (!isOfficialMode && !canUserAccessOrganizerPanel(currentUser)) {
    return window.showMirrorToast("Создавать турниры могут только верифицированные организаторы!", true);
  }

  const prefix = isOfficialMode ? "off-" : "org-";
  const name = (document.getElementById(`${prefix}trn-name`)?.value || "").trim();
  const format = (document.getElementById(`${prefix}trn-format`)?.value || "5v5").trim();
  const bracketType = (document.getElementById(`${prefix}trn-bracket`)?.value || "Single Elimination").trim();
  const prizeGold = parseInt(document.getElementById(`${prefix}trn-prize`)?.value || "0", 10) || 0;
  const maxTeams = parseInt(document.getElementById(`${prefix}trn-max-teams`)?.value || "16", 10) || 16;
  const startDate = (document.getElementById(`${prefix}trn-date`)?.value || "01.12 • 19:00").trim();
  const seriesFormat = (document.getElementById(`${prefix}trn-series`)?.value || "BO1").trim();
  const entryFeeGold = createEntryMode === "gold" ? (parseInt(document.getElementById(`${prefix}trn-fee`)?.value || "50", 10) || 50) : 0;
  const subChannelLink = createEntryMode === "subs" ? (document.getElementById(`${prefix}trn-sub-link`)?.value || "").trim() : "";

  if (!name) return window.showMirrorToast("Укажите название турнира!", true);
  if (createEntryMode === "subs" && !subChannelLink) {
    return window.showMirrorToast(`Укажите ссылку на ${createSubPlatform} для условия участия (минимум 5 подписок с команды)!`, true);
  }

  const manageableOrgs = getManageableOrganizations(currentUser);
  const ownerOrg = isOfficialMode ? null : (manageableOrgs[0] || currentUser);

  const newT = {
    id: "TRN_" + Date.now().toString(36).toUpperCase(),
    name,
    format,
    bracketType,
    prizeGold,
    maxTeams,
    seriesFormat,
    hasQualification: Boolean(document.getElementById(`${prefix}trn-has-qual`)?.checked),
    stageFormats: {
      early: (document.getElementById(`${prefix}trn-fmt-early`)?.value || seriesFormat || "BO1").trim(),
      playoff: (document.getElementById(`${prefix}trn-fmt-playoff`)?.value || "BO3").trim(),
      final: (document.getElementById(`${prefix}trn-fmt-final`)?.value || "BO3").trim()
    },
    payoutPaid: false,
    startDate,
    isOfficial: Boolean(isOfficialMode),
    organizerUid: isOfficialMode ? (currentUser.uid || "OFFICIAL_C6E") : ownerOrg.uid,
    orgName: isOfficialMode ? OFFICIAL_SPONSOR_NAME : (ownerOrg.orgName || ownerOrg.nick),
    entryMode: createEntryMode,
    entryFeeGold,
    subPlatform: createEntryMode === "subs" ? createSubPlatform : "",
    subChannelLink,
    mandatorySponsor: OFFICIAL_SPONSOR_NAME,
    mandatorySponsorLink: OFFICIAL_SPONSOR_TG,
    stage: "registration", // "registration" | "checkin" | "live" | "finished"
    status: "open",
    participants: [],
    bracketData: null
  };

  // Сразу строим предпросмотр пустой сетки нужного размера (4/8/16/32)
  newT.bracketData = generateSmartBracketData(newT);

  cloudTournaments.unshift(newT);
  activeTournamentId = newT.id;
  tournamentDetailTab = "bracket";
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(isOfficialMode ? `Официальный турнир «${name}» (${maxTeams} мест) создан!` : `Турнир «${name}» (${maxTeams} мест) создан!`);
  window.goRoute("/tournaments");
};

window.appointTournamentStaff = (e) => {
  e.preventDefault();
  if (!currentUser || (!currentUser.isAdmin && !(currentUser.accountType === "organizer" && currentUser.organizerStatus === "verified"))) {
    return window.showMirrorToast("Назначать судей и модераторов может только Главный организатор!", true);
  }
  const nickQuery = (document.getElementById("staff-player-nick")?.value || "").trim().toLowerCase();
  const roleLabel = (document.getElementById("staff-role-val")?.value || "Администратор (Модератор сетки)").trim();
  const targetPlayer = cloudUsers.find(u => u.uid !== currentUser.uid && String(u.nick || "").toLowerCase() === nickQuery);
  if (!targetPlayer) return window.showMirrorToast("Игрок с таким ником не найден на платформе!", true);

  currentUser.orgStaff = Array.isArray(currentUser.orgStaff) ? currentUser.orgStaff : [];
  if (currentUser.orgStaff.some(s => s.uid === targetPlayer.uid)) {
    return window.showMirrorToast(`${targetPlayer.nick} уже назначен в состав администрации!`);
  }
  currentUser.orgStaff.push({ uid: targetPlayer.uid, nick: targetPlayer.nick, role: roleLabel });
  saveCurrentUserEverywhere();
  window.showMirrorToast(`Игроку ${targetPlayer.nick} выдана роль «${roleLabel}»!`);
};

window.removeTournamentStaff = (staffUid) => {
  if (!currentUser || !Array.isArray(currentUser.orgStaff)) return;
  currentUser.orgStaff = currentUser.orgStaff.filter(s => s.uid !== staffUid);
  saveCurrentUserEverywhere();
  window.showMirrorToast("Права сотрудника сняты.");
};

// Переключение этапов турнира (Регистрация -> Check-In -> Старт и Сетка -> Завершение)
window.advanceTournamentStage = (tId, nextStage) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser) return;
  const role = getUserRoleInTournament(currentUser, trn);

  if ((nextStage === "live" || nextStage === "finished") && !canChiefControl(role)) {
    return window.showMirrorToast("Запускать сетку и завершать турнир может только Главный Судья / Организатор!", true);
  }
  if (nextStage === "checkin" && !canModerateBracket(role)) {
    return window.showMirrorToast("Недостаточно прав для открытия Check-In!", true);
  }

  if (nextStage === "live") {
    const readyCount = (trn.participants || []).filter(p => p.approved !== false && p.checkedIn !== false).length;
    if (readyCount < 2) {
      return window.showMirrorToast("Для старта сетки нужно минимум 2 подтверждённых участника!", true);
    }
    trn.stage = "live";
    trn.bracketData = generateSmartBracketData(trn);
    appendTournamentAuditLog(trn, "Сетка сформирована и турнир переведён в LIVE");
    window.showMirrorToast(`Сетка на ${trn.maxTeams} мест сформирована! Турнир переведён в LIVE.`);
  } else if (nextStage === "checkin") {
    trn.stage = "checkin";
    appendTournamentAuditLog(trn, "Открыт этап Подтверждение матча (за 30 мин)");
    window.showMirrorToast("Этап Check-In открыт! Участники должны подтвердить готовность.");
  } else if (nextStage === "finished") {
    trn.stage = "finished";
    appendTournamentAuditLog(trn, "Турнир официально завершён");
    trn.status = "finished";
    window.showMirrorToast(`Турнир «${trn.name}» завершён! Итоги зафиксированы.`);
  }

  syncLiveMatchesRegistry();
  syncArenaDataToCloud();
  renderAllStageSections();
};

window.deleteTournamentByChief = (tId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser) return;
  const role = getUserRoleInTournament(currentUser, trn);
  if (!canChiefControl(role)) return window.showMirrorToast("Удалить турнир может только Главный Судья / Организатор!", true);
  if (!confirm(`Удалить турнир «${trn.name}» безвозвратно?`)) return;
  cloudTournaments = cloudTournaments.filter(t => t.id !== tId);
  activeTournamentId = null;
  syncLiveMatchesRegistry();
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast("Турнир удалён.");
};

// Модерация заявок и Check-In (доступно и Модератору, и Главному Судье)

window.cancelMyTournamentRegistration = (tId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser || trn.stage !== "registration") return;
  const myClan = getPlayerClan(currentUser);
  const myId = trn.format === "1v1" ? currentUser.uid : (myClan ? myClan.id : currentUser.uid);
  trn.participants = (trn.participants || []).filter(p => p.id !== myId);
  trn.bracketData = generateSmartBracketData(trn);
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast("Ваша заявка на турнир отменена.");
};

window.manualAddParticipantToTournament = (tId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser) return;
  const role = getUserRoleInTournament(currentUser, trn);
  if (!canModerateBracket(role)) return window.showMirrorToast("Нет прав!", true);
  if ((trn.participants || []).length >= trn.maxTeams) return window.showMirrorToast("Слоты заполнены!", true);
  openSiteGlassModal(
    trn.format === "1v1" ? "ДОБАВИТЬ ИГРОКА В ТУРНИР" : "ДОБАВИТЬ КОМАНДУ В ТУРНИР",
    `
      <div style="display:flex; gap:8px; margin-bottom:10px;">
        <input type="text" id="man-add-part-inp" class="auth-input" style="padding:9px 12px;" placeholder="${trn.format === '1v1' ? 'Ник или Standoff 2 ID...' : 'Название или тег клана...'}" oninput="window.filterManualAddSuggest('${trn.id}', this.value)">
        <button type="button" class="auth-submit-btn" style="width:auto; padding:9px 13px; font-size:10px;" onclick="window.confirmManualAddParticipant('${trn.id}')">Добавить</button>
      </div>
      <div id="man-add-suggest-box" class="c6e-modal-suggest-list"></div>
    `
  );
  window.filterManualAddSuggest(trn.id, "");
};

window.playerCheckInTournament = (tId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser) return;
  const myClan = getPlayerClan(currentUser);
  const myId = trn.format === "1v1" ? currentUser.uid : (myClan ? myClan.id : currentUser.uid);
  const entry = (trn.participants || []).find(p => p.id === myId);
  if (!entry) return window.showMirrorToast("Вы не зарегистрированы в этом турнире!", true);
  entry.checkedIn = true;
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast("Check-In успешно пройден! Вы допущены в сетку.");
};

window.moderateParticipantEntry = (tId, entryId, action) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser) return;
  const role = getUserRoleInTournament(currentUser, trn);
  if (!canModerateBracket(role)) return window.showMirrorToast("Нет прав модератора!", true);

  if (action === "kick") {
    trn.participants = (trn.participants || []).filter(p => p.id !== entryId);
    window.showMirrorToast("Участник снят с турнира.");
  } else if (action === "checkin") {
    const p = (trn.participants || []).find(x => x.id === entryId);
    if (p) p.checkedIn = !p.checkedIn;
    window.showMirrorToast("Статус Check-In обновлён.");
  }
  if (trn.stage === "registration") trn.bracketData = generateSmartBracketData(trn);
  syncArenaDataToCloud();
  renderAllStageSections();
};

// Открытие и сохранение управления матчем в сетке
window.openMatchControlModal = (tId, matchId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn) return;
  activeControlMatchId = matchId;
  renderTournamentsSection();
};

window.submitCallRefereeModal = (e, tId, matchId) => {
  e.preventDefault();
  const reason = (document.getElementById("call-ref-reason-inp")?.value || "").trim();
  if (!reason) return;
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, matchId) : null;
  if (!trn || !match || !currentUser) return;
  match.status = "disputed";
  match.disputeReason = `${currentUser.nick}: ${reason}`;
  appendTournamentAuditLog(trn, `Вызов судьи (${getMatchSideName(match.teamA)} vs ${getMatchSideName(match.teamB)}): ${reason}`);
  syncLiveMatchesRegistry();
  syncArenaDataToCloud();
  renderAllStageSections();
  window.closeSiteGlassModal();
  window.showMirrorToast("Судья вызван! Матч переведён в статус СПОРНЫЙ.");
};
window.playerCallRefereeInMatch = (tId, matchId) => {
  if (!currentUser) return window.goRoute("/authorization");
  openSiteGlassModal(
    "ВЫЗВАТЬ ГЛАВНОГО СУДЬЮ",
    `
      <form onsubmit="window.submitCallRefereeModal(event, '${tId}', '${matchId}')" style="display:flex; flex-direction:column; gap:10px;">
        <div style="font-size:11.5px; color:var(--white-soft);">Опишите причину спора (неявка в лобби, неверный счёт, подозрение на нарушение):</div>
        <textarea id="call-ref-reason-inp" class="auth-input" rows="3" style="padding:10px 12px;" required>Соперник не заходит в лобби</textarea>
        <button type="submit" class="auth-submit-btn">ОТПРАВИТЬ ВЫЗОВ СУДЬЕ</button>
      </form>
    `
  );
};

window.checkInAllParticipantsByChief = (tId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser) return;
  if (!canChiefControl(getUserRoleInTournament(currentUser, trn))) return window.showMirrorToast("Только для Главного Судьи!", true);
  trn.participants = (trn.participants || []).map(p => ({ ...normalizeParticipantEntry(p, trn.format), checkedIn: true }));
  appendTournamentAuditLog(trn, "Главный судья подтвердил Check-In всем зарегистрированным участникам");
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast("Check-In подтверждён для всех участников!");
};


window.openTabLightbox = (imgSrc) => {
  const bd = document.getElementById("tab-lightbox-backdrop");
  const im = document.getElementById("tab-lightbox-img");
  if (!bd || !im || !imgSrc) return;
  im.src = imgSrc;
  bd.classList.add("open");
};

window.closeTabLightbox = () => {
  const bd = document.getElementById("tab-lightbox-backdrop");
  if (bd) bd.classList.remove("open");
};

window.shareTournamentLink = (tId) => {
  try {
    const url = `${window.location.origin}${getRepoBasePrefix()}/tournaments?trn=${encodeURIComponent(tId)}`;
    navigator.clipboard.writeText(url);
    window.showMirrorToast("Прямая ссылка на турнир скопирована!");
  } catch (e) {
    window.showMirrorToast("Скопируйте адрес страницы из браузера.");
  }
};

window.toggleMatchSideReady = (tId, matchId, side) => {
  if (!currentUser) return window.goRoute("/authorization");
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, matchId) : null;
  if (!trn || !match) return;
  if (side === "A") match.readyA = !match.readyA;
  if (side === "B") match.readyB = !match.readyB;
  syncArenaDataToCloud();
  renderTournamentsSection();
  window.showMirrorToast(`Готовность стороны ${side} обновлена!`);
};

window.flipCoinForSides = (tId, matchId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, matchId) : null;
  if (!trn || !match || !currentUser) return;
  if (!canModerateBracket(getUserRoleInTournament(currentUser, trn))) return window.showMirrorToast("Бросить монетку может судья или модератор!", true);
  const aIsCT = Math.random() >= 0.5;
  match.sideA = aIsCT ? "CT" : "T";
  match.sideB = aIsCT ? "T" : "CT";
  appendTournamentAuditLog(trn, `Монетка (${match.teamA?.name || 'A'} vs ${match.teamB?.name || 'B'}): A = ${match.sideA}, B = ${match.sideB}`);
  syncArenaDataToCloud();
  renderTournamentsSection();
  window.showMirrorToast(`Монетка: ${match.teamA?.name || 'A'} играет за ${match.sideA}, ${match.teamB?.name || 'B'} — за ${match.sideB}!`);
};

window.sendMatchChatMessage = (e, tId, matchId) => {
  e.preventDefault();
  if (!currentUser) return window.goRoute("/authorization");
  const inp = document.getElementById("mr-chat-input");
  const text = (inp?.value || "").trim();
  if (!text) return;
  const trn = cloudTournaments.find(t => t.id === tId);
  const match = trn ? findMatchInTournament(trn, matchId) : null;
  if (!trn || !match) return;

  const role = getUserRoleInTournament(currentUser, trn);
  const isStaff = canModerateBracket(role);
  const roleTag = role === "platform_admin" || role === "chief_referee" ? "СУДЬЯ" : (role === "moderator" ? "МОДЕРАТОР" : "");

  match.chat = Array.isArray(match.chat) ? match.chat : [];
  match.chat.push({
    author: currentUser.nick,
    roleTag,
    isStaff,
    text,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  });
  if (match.chat.length > 50) match.chat.shift();
  syncArenaDataToCloud();
  renderTournamentsSection();
};

window.confirmTournamentGoldPayout = (tId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser) return;
  if (!canChiefControl(getUserRoleInTournament(currentUser, trn))) return window.showMirrorToast("Подтвердить выплату Gold может только Главный Судья или Админ!", true);
  trn.payoutPaid = true;
  trn.stage = "finished";
  trn.status = "finished";
  appendTournamentAuditLog(trn, `Выплата призового фонда ${trn.prizeGold} Gold официально подтверждена!`);
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(`Выплата ${trn.prizeGold} Gold подтверждена и учтена в статистике платформы!`);
};

window.closeMatchControlModal = () => {
  activeControlMatchId = null;
  renderTournamentsSection();
};

window.saveMatchUpdateAction = (tId, matchId, mode) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser) return;
  const role = getUserRoleInTournament(currentUser, trn);
  if (!canModerateBracket(role)) return window.showMirrorToast("Нет прав управления матчем!", true);

  const match = findMatchInTournament(trn, matchId);
  if (!match) return;

  const mapVal = (document.getElementById("mc-map")?.value || match.map || "Sandstone").trim();
  const lobbyVal = (document.getElementById("mc-lobby")?.value || "").trim();
  const sA = Math.max(0, parseInt(document.getElementById("mc-score-a")?.value || "0", 10) || 0);
  const sB = Math.max(0, parseInt(document.getElementById("mc-score-b")?.value || "0", 10) || 0);
  const tabKills = Math.max(0, parseInt(document.getElementById("mc-tab-kills")?.value || "0", 10) || 0);
  const tabDeaths = Math.max(0, parseInt(document.getElementById("mc-tab-deaths")?.value || "0", 10) || 0);
  const computedTabKd = tabDeaths > 0 ? (tabKills / tabDeaths) : (tabKills > 0 ? tabKills : 1.25);

  match.map = mapVal;
  match.lobbyId = lobbyVal;
  match.scoreA = sA;
  match.scoreB = sB;

  if (mode === "live") {
    match.status = "live";
    window.showMirrorToast("Матч запущен в LIVE! Отображается на главной и в разделе Матчи.");
  } else if (mode === "dispute") {
    match.status = "disputed";
    window.showMirrorToast("Матч помечен как СПОРНЫЙ — передан Главному Судье!", true);
  } else if (mode === "winA" || mode === "winB" || mode === "techA" || mode === "techB") {
    const isTech = mode === "techA" || mode === "techB";
    if (isTech && !canChiefControl(role)) {
      return window.showMirrorToast("Техническую победу может выдать только Главный Судья / Организатор!", true);
    }
    const winSide = (mode === "winA" || mode === "techA") ? "A" : "B";
    const winnerObj = winSide === "A" ? match.teamA : match.teamB;
    const loserObj = winSide === "A" ? match.teamB : match.teamA;
    if (!winnerObj) return window.showMirrorToast("В выбранном слоте нет участника!", true);

    match.status = "finished";
    match.winner = winSide;
    match.isTechWin = isTech;

    // Автоматическое продвижение победителя в следующий раунд (Single / Double Elimination)
    if (match.bracketSide === "upper" && trn.bracketData.rounds[match.roundIdx + 1]) {
      const nextM = trn.bracketData.rounds[match.roundIdx + 1][Math.floor(match.matchIdx / 2)];
      if (nextM) {
        if (match.matchIdx % 2 === 0) nextM.teamA = winnerObj;
        else nextM.teamB = winnerObj;
      }
    }
    // Если Double Elimination — проигравший из 1 раунда падает в Нижнюю сетку
    if (trn.bracketType === "Double Elimination" && match.bracketSide === "upper" && match.roundIdx === 0 && loserObj && trn.bracketData.lowerRounds?.[0]) {
      const lowerM = trn.bracketData.lowerRounds[0][Math.floor(match.matchIdx / 2)];
      if (lowerM) {
        if (match.matchIdx % 2 === 0) lowerM.teamA = loserObj;
        else lowerM.teamB = loserObj;
      }
    }

    // Безопасное однократное начисление Cyber Points (CP) и обновление статистики
    if (!match.cpAwarded) {
      match.cpAwarded = true;
      const diff = Math.abs(sA - sB);
      if (trn.format === "1v1") {
        const uWin = cloudUsers.find(u => u.uid === winnerObj.id);
        const uLose = loserObj ? cloudUsers.find(u => u.uid === loserObj.id) : null;
        const dateNowStr = new Date().toLocaleDateString();
        if (uWin) {
          const cpGain = isTech ? 25 : calculatePlayerMatchCP(computedTabKd);
          uWin.cp = (uWin.cp || 0) + cpGain;
          uWin.stats = uWin.stats || { kd: "0.00", kills: 0, deaths: 0, impact: 0, matchesPlayed: 0, wins: 0, losses: 0 };
          uWin.stats.kills = (uWin.stats.kills || 0) + tabKills;
          uWin.stats.deaths = (uWin.stats.deaths || 0) + tabDeaths;
          uWin.stats.kd = uWin.stats.deaths > 0 ? (uWin.stats.kills / uWin.stats.deaths).toFixed(2) : (uWin.stats.kills || 0).toFixed(2);
          uWin.stats.matchesPlayed += 1; uWin.stats.wins += 1;
          uWin.matchHistory = Array.isArray(uWin.matchHistory) ? uWin.matchHistory : [];
          uWin.matchHistory.unshift({ tournamentName: trn.name, opponent: loserObj?.name || 'BYE', map: match.map, score: `${sA}:${sB}`, result: "WIN", cpGained: cpGain, date: dateNowStr });
        }
        if (uLose) {
          uLose.stats = uLose.stats || { kd: "0.00", kills: 0, deaths: 0, impact: 0, matchesPlayed: 0, wins: 0, losses: 0 };
          uLose.stats.matchesPlayed += 1; uLose.stats.losses += 1;
          uLose.matchHistory = Array.isArray(uLose.matchHistory) ? uLose.matchHistory : [];
          uLose.matchHistory.unshift({ tournamentName: trn.name, opponent: winnerObj.name, map: match.map, score: `${sA}:${sB}`, result: "LOSS", cpGained: 0, date: dateNowStr });
        }
      } else {
        const cWin = cloudClans.find(c => c.id === winnerObj.id);
        const cLose = loserObj ? cloudClans.find(c => c.id === loserObj.id) : null;
        const cpGain = calculateTeamMatchCP(diff, isTech);
        const dateNowStr = new Date().toLocaleDateString();
        if (cWin) {
          cWin.cp = (cWin.cp || 0) + cpGain;
          cWin.kills = (cWin.kills || 0) + tabKills;
          cWin.deaths = (cWin.deaths || 0) + tabDeaths;
          cWin.kd = cWin.deaths > 0 ? (cWin.kills / cWin.deaths).toFixed(2) : (cWin.kills || 0).toFixed(2);
          cWin.matches = (cWin.matches || 0) + 1; cWin.wins = (cWin.wins || 0) + 1;
          (cWin.members || []).forEach(mbr => {
            const u = cloudUsers.find(x => x.uid === mbr.uid);
            if (u) {
              u.cp = (u.cp || 0) + (isTech ? 25 : calculatePlayerMatchCP(1.20 + diff * 0.08));
              u.stats = u.stats || { kd: "0.00", kills: 0, deaths: 0, impact: 0, matchesPlayed: 0, wins: 0, losses: 0 };
              u.stats.matchesPlayed += 1; u.stats.wins += 1;
              u.matchHistory = Array.isArray(u.matchHistory) ? u.matchHistory : [];
              u.matchHistory.unshift({ tournamentName: trn.name, opponent: loserObj?.name || 'BYE', map: match.map, score: `${sA}:${sB}`, result: "WIN", cpGained: isTech ? 25 : calculatePlayerMatchCP(1.20 + diff * 0.08), date: dateNowStr });
            }
          });
        }
        if (cLose) {
          cLose.matches = (cLose.matches || 0) + 1; cLose.losses = (cLose.losses || 0) + 1;
          (cLose.members || []).forEach(mbr => {
            const u = cloudUsers.find(x => x.uid === mbr.uid);
            if (u) {
              u.stats = u.stats || { kd: "0.00", kills: 0, deaths: 0, impact: 0, matchesPlayed: 0, wins: 0, losses: 0 };
              u.stats.matchesPlayed += 1; u.stats.losses += 1;
              u.matchHistory = Array.isArray(u.matchHistory) ? u.matchHistory : [];
              u.matchHistory.unshift({ tournamentName: trn.name, opponent: winnerObj.name, map: match.map, score: `${sA}:${sB}`, result: "LOSS", cpGained: 0, date: dateNowStr });
            }
          });
        }
      }
    }

    if (match.roundName === "ГРАНД-ФИНАЛ") {
      trn.champion = winnerObj;
      trn.runnerUp = loserObj || null;
    }
    activeControlMatchId = null;
    appendTournamentAuditLog(trn, `Зафиксирована победа ${winnerObj.name} (${sA}:${sB}${isTech ? ", Тех. победа" : ""})`);
    window.showMirrorToast(`Победа «${winnerObj.name}» зафиксирована! Сетка, история матчей и CP обновлены.`);
  } else {
    window.showMirrorToast("Параметры матча (карта, лобби, счёт) сохранены.");
  }

  syncLiveMatchesRegistry();
  syncArenaDataToCloud();
  renderAllStageSections();
};

function buildTournamentCreatorFormHTML(isOfficialMode = false) {
  const prefix = isOfficialMode ? "off-" : "org-";
  return `
    <form onsubmit="window.submitCreateTournamentUnified(event, ${isOfficialMode})" class="glass-subcard" style="padding:18px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:14px;">
        <div style="font-family:var(--font-display); font-size:12.5px; font-weight:900; color:#ffffff;">
          ${isOfficialMode ? `СОЗДАНИЕ ОФИЦИАЛЬНОГО ТУРНИРА ${OFFICIAL_SPONSOR_NAME}` : 'НАСТРОЙКА ТУРНИРА И СЕТКИ (ДО 32 МЕСТ)'}
        </div>
        ${isOfficialMode ? `<span class="official-c6e-badge">OFFICIAL • БЕЗ ВЕРИФИКАЦИИ</span>` : `<span class="verified-org-check">${getVerifiedOrgCheckSVG(11)} ГЛАВНЫЙ СУДЬЯ</span>`}
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:12px; margin-bottom:14px;">
        <div class="auth-form-group" style="margin:0;">
          <label class="auth-label">Название турнира</label>
          <input type="text" id="${prefix}trn-name" class="auth-input" style="padding-left:14px;" placeholder="${isOfficialMode ? 'Cyber 6 Official Cup #1' : 'Arena Gold Cup'}" required>
        </div>
        <div class="auth-form-group" style="margin:0;">
          <label class="auth-label">Режим турнира</label>
          <input type="hidden" id="${prefix}trn-format" value="5v5">
          <div class="glass-select-wrap" id="${prefix}trn-format-dd">
            <button type="button" class="glass-select-trigger" onclick="window.toggleGlassDropdown('${prefix}trn-format-dd', event)">
              <span id="${prefix}trn-format-lbl">5v5</span><i class="fas fa-chevron-down" style="font-size:11px; color:var(--accent-soft);"></i>
            </button>
            <div class="glass-select-menu">${["5v5", "2v2", "1v1"].map(f => `<button type="button" class="glass-select-option" onclick="window.selectGlassDropdownOption('${prefix}trn-format-dd','${prefix}trn-format','${prefix}trn-format-lbl','${f}')">${f}</button>`).join("")}</div>
          </div>
        </div>
        <div class="auth-form-group" style="margin:0;">
          <label class="auth-label">Тип сетки</label>
          <input type="hidden" id="${prefix}trn-bracket" value="Single Elimination">
          <div class="glass-select-wrap" id="${prefix}trn-bracket-dd">
            <button type="button" class="glass-select-trigger" onclick="window.toggleGlassDropdown('${prefix}trn-bracket-dd', event)">
              <span id="${prefix}trn-bracket-lbl">Single Elimination</span><i class="fas fa-chevron-down" style="font-size:11px; color:var(--accent-soft);"></i>
            </button>
            <div class="glass-select-menu">${["Single Elimination", "Double Elimination", "Round Robin"].map(b => `<button type="button" class="glass-select-option" onclick="window.selectGlassDropdownOption('${prefix}trn-bracket-dd','${prefix}trn-bracket','${prefix}trn-bracket-lbl','${b}')">${b}</button>`).join("")}</div>
          </div>
        </div>
        <div class="auth-form-group" style="margin:0;">
          <label class="auth-label">Размер сетки (мест)</label>
          <input type="hidden" id="${prefix}trn-max-teams" value="16">
          <div class="glass-select-wrap" id="${prefix}trn-size-dd">
            <button type="button" class="glass-select-trigger" onclick="window.toggleGlassDropdown('${prefix}trn-size-dd', event)">
              <span id="${prefix}trn-size-lbl">16</span><i class="fas fa-chevron-down" style="font-size:11px; color:var(--accent-soft);"></i>
            </button>
            <div class="glass-select-menu">${["4", "8", "16", "32"].map(sz => `<button type="button" class="glass-select-option" onclick="window.selectGlassDropdownOption('${prefix}trn-size-dd','${prefix}trn-max-teams','${prefix}trn-size-lbl','${sz}')">${sz} мест</button>`).join("")}</div>
          </div>
        </div>
        <div class="auth-form-group" style="margin:0;">
          <label class="auth-label">Призовой фонд (Gold)</label>
          <input type="number" id="${prefix}trn-prize" class="auth-input" style="padding-left:14px;" min="0" value="3000" required>
        </div>
        <div class="auth-form-group" style="margin:0;">
          <label class="auth-label">Серия матчей</label>
          <input type="hidden" id="${prefix}trn-series" value="BO1">
          <div class="glass-select-wrap" id="${prefix}trn-series-dd">
            <button type="button" class="glass-select-trigger" onclick="window.toggleGlassDropdown('${prefix}trn-series-dd', event)">
              <span id="${prefix}trn-series-lbl">BO1</span><i class="fas fa-chevron-down" style="font-size:11px; color:var(--accent-soft);"></i>
            </button>
            <div class="glass-select-menu">${["BO1", "BO2", "BO3", "BO5"].map(sr => `<button type="button" class="glass-select-option" onclick="window.selectGlassDropdownOption('${prefix}trn-series-dd','${prefix}trn-series','${prefix}trn-series-lbl','${sr}')">${sr}</button>`).join("")}</div>
          </div>
        </div>
        <div class="auth-form-group" style="margin:0;">
          <label class="auth-label">Дата старта</label>
          <input type="text" id="${prefix}trn-date" class="auth-input" style="padding-left:14px;" placeholder="01.12 • 19:00" required>
        </div>
      </div>

      
      <div class="glass-subcard" style="padding:12px; margin-bottom:14px;">
        <div style="font-family:var(--font-display); font-size:10.5px; font-weight:900; color:var(--accent-soft); margin-bottom:8px;">
          ТОЧНАЯ НАСТРОЙКА ЭТАПОВ И СЕРИЙ (1/16 → 1/8 → 1/4 → 1/2 → ФИНАЛ)
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(145px, 1fr)); gap:9px; margin-bottom:10px;">
          <div class="auth-form-group" style="margin:0;">
            <label class="auth-label">1/16 и 1/8</label>
            <select id="${prefix}trn-fmt-early" class="auth-input" style="padding-left:10px;">
              <option value="BO1" selected>BO1 (1 карта)</option>
              <option value="BO2">BO2 (2 карты)</option>
              <option value="BO3">BO3 (до 2 побед)</option>
            </select>
          </div>
          <div class="auth-form-group" style="margin:0;">
            <label class="auth-label">1/4 и 1/2</label>
            <select id="${prefix}trn-fmt-playoff" class="auth-input" style="padding-left:10px;">
              <option value="BO1">BO1 (1 карта)</option>
              <option value="BO3" selected>BO3 (до 2 побед)</option>
              <option value="BO5">BO5 (до 3 побед)</option>
            </select>
          </div>
          <div class="auth-form-group" style="margin:0;">
            <label class="auth-label">Финал</label>
            <select id="${prefix}trn-fmt-final" class="auth-input" style="padding-left:10px;">
              <option value="BO1">BO1 (1 карта)</option>
              <option value="BO3" selected>BO3 (до 2 побед)</option>
              <option value="BO5">BO5 (до 3 побед)</option>
            </select>
          </div>
        </div>
        <label style="display:flex; align-items:center; gap:8px; font-size:11.5px; color:var(--white-soft); cursor:pointer;">
          <input type="checkbox" id="${prefix}trn-has-qual"> Добавить этап Квалификации перед плей-офф (BO1 / BO2)
        </label>
      </div>

      <div class="auth-label" style="margin-bottom:6px;">Способ участия:</div>
      <div class="role-picker-grid" style="margin-bottom:12px;">
        <button type="button" class="role-pick-card ${createEntryMode === 'subs' ? 'active' : ''}" onclick="window.setCreateEntryMode('subs')">
          <i class="fas fa-users" style="color:var(--accent-soft); font-size:15px;"></i>
          <b style="font-family:var(--font-display); font-size:10.5px;">ЗА ПОДПИСКИ</b>
          <span style="font-size:10px; color:var(--white-dim);">От 5 подписок с 1 команды</span>
        </button>
        <button type="button" class="role-pick-card ${createEntryMode === 'gold' ? 'active' : ''}" onclick="window.setCreateEntryMode('gold')">
          <i class="fas fa-coins" style="color:#eab308; font-size:15px;"></i>
          <b style="font-family:var(--font-display); font-size:10.5px;">ЗА ГОЛДУ (GOLD)</b>
          <span style="font-size:10px; color:var(--white-dim);">Платный взнос Gold</span>
        </button>
      </div>

      ${createEntryMode === "subs" ? `
        <div style="display:grid; grid-template-columns:1fr 2fr; gap:10px; margin-bottom:12px;">
          <div>
            <label class="auth-label" style="display:block; margin-bottom:5px;">Площадка (1 на выбор)</label>
            <div style="display:flex; gap:6px;">
              <button type="button" class="filter-pill-btn ${createSubPlatform === 'Telegram' ? 'active' : ''}" style="flex:1;" onclick="window.setCreateSubPlatform('Telegram')">ТГК</button>
              <button type="button" class="filter-pill-btn ${createSubPlatform === 'VK' ? 'active' : ''}" style="flex:1;" onclick="window.setCreateSubPlatform('VK')">ВК</button>
            </div>
          </div>
          <div class="auth-form-group" style="margin:0;">
            <label class="auth-label">Ссылка на ${createSubPlatform}</label>
            <input type="text" id="${prefix}trn-sub-link" class="auth-input" style="padding-left:14px;" placeholder="${createSubPlatform === 'Telegram' ? 'https://t.me/channel' : 'https://vk.com/group'}" required>
          </div>
        </div>
      ` : `
        <div class="auth-form-group" style="margin-bottom:12px;">
          <label class="auth-label">Взнос с команды (Gold)</label>
          <input type="number" id="${prefix}trn-fee" class="auth-input" style="padding-left:14px;" min="10" value="100" required>
        </div>
      `}

      <div class="sponsor-mandatory-box" style="margin-bottom:14px;">
        <b style="color:#fde047;"><i class="fas fa-star"></i> Обязательный спонсор:</b>
        подписка участников на официальный Telegram-канал <b>${OFFICIAL_SPONSOR_NAME}</b> включена автоматически.
      </div>

      <button type="submit" class="auth-submit-btn">ОПУБЛИКОВАТЬ ТУРНИР</button>
    </form>
  `;
}

function renderOrganizerPanelSection() {
  const root = document.getElementById("organizer-stage-root");
  if (!root || !currentUser) return;

  if (!canUserAccessOrganizerPanel(currentUser)) {
    root.innerHTML = `<div class="mirror-card" style="text-align:center; padding:36px 24px;"><h2 style="font-family:var(--font-display); font-size:20px; font-weight:900; margin-bottom:10px;">ДОСТУП ОГРАНИЧЕН</h2><p style="font-size:13px; color:var(--white-soft); max-width:500px; margin:0 auto;">Панель управления доступна только верифицированным организаторам и назначенным администраторам турниров.</p></div>`;
    return;
  }

  const myOrgs = getManageableOrganizations(currentUser);
  const myOrgIds = myOrgs.map(o => o.uid);
  const myTournaments = currentUser.isAdmin ? cloudTournaments : cloudTournaments.filter(t => myOrgIds.includes(t.organizerUid));
  const isOrgOwner = currentUser.isAdmin || (currentUser.accountType === "organizer" && currentUser.organizerStatus === "verified");
  const staffList = isOrgOwner ? (currentUser.orgStaff || []) : [];

  root.innerHTML = `
    <div class="mirror-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div>
          <span class="rbac-badge-chief"><i class="fas fa-gavel"></i> ГЛАВНЫЙ СУДЬЯ / ОРГАНИЗАТОР</span>
          <h2 style="font-family:var(--font-display); font-size:22px; font-weight:900; color:#ffffff; margin-top:8px;">ПАНЕЛЬ ОРГАНИЗАТОРА</h2>
        </div>
        <div class="filter-pills-row">
          <button type="button" class="filter-pill-btn ${organizerPanelTab === 'tournaments' ? 'active' : ''}" onclick="window.setOrganizerPanelTab('tournaments')">Турниры (${myTournaments.length})</button>
          ${isOrgOwner ? `<button type="button" class="filter-pill-btn ${organizerPanelTab === 'create' ? 'active' : ''}" onclick="window.setOrganizerPanelTab('create')">+ Создать турнир</button>` : ''}
          ${isOrgOwner ? `<button type="button" class="filter-pill-btn ${organizerPanelTab === 'staff' ? 'active' : ''}" onclick="window.setOrganizerPanelTab('staff')">Модераторы и Судьи (${staffList.length})</button>` : ''}
        </div>
      </div>

      ${organizerPanelTab === "create" && isOrgOwner ? buildTournamentCreatorFormHTML(Boolean(currentUser.isAdmin)) : ''}

      ${organizerPanelTab === "tournaments" ? (myTournaments.length === 0 ? `
        <div class="glass-subcard" style="text-align:center; padding:26px; font-size:12.5px; color:var(--white-dim);">Турниров пока нет. Нажмите «+ Создать турнир».</div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${myTournaments.map(t => `
            <div class="glass-subcard" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <div>
                <div style="font-family:var(--font-display); font-size:14px; font-weight:900;">${escapeHTML(t.name)}</div>
                <div style="font-size:11.5px; color:var(--white-dim); margin-top:2px;">
                  ${escapeHTML(t.format)} • ${escapeHTML(t.bracketType)} • ${t.maxTeams} мест • Этап: <b style="color:var(--accent-soft);">${escapeHTML(t.stage || 'registration').toUpperCase()}</b>
                </div>
              </div>
              <button type="button" class="auth-submit-btn" style="width:auto; padding:8px 16px; font-size:10px;" onclick="window.openTournamentDetails('${t.id}')">Управлять сеткой →</button>
            </div>
          `).join("")}
        </div>
      `) : ''}

      ${organizerPanelTab === "staff" && isOrgOwner ? `
        <div class="glass-subcard" style="margin-bottom:12px; font-size:11.5px; color:var(--white-soft); line-height:1.5;">
          <b style="color:#fde047;">Главный судья (Организатор):</b> полные права — запуск/завершение турнира, тех. победы (25 CP), удаление турнира и назначение персонала.<br>
          <b style="color:#7dd3fc;">Администратор (Модератор сетки):</b> следит за сеткой и командами — одобряет заявки, Check-In, вводит ID лобби, карту, счёт раундов и передаёт спорные матчи Главному судье.
        </div>

        <form onsubmit="window.appointTournamentStaff(event)" class="glass-subcard" style="margin-bottom:14px;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px;">
            <div class="auth-form-group" style="margin:0;"><label class="auth-label">Ник игрока</label><input type="text" id="staff-player-nick" class="auth-input" style="padding-left:14px;" placeholder="Например: Shadow" required></div>
            <div class="auth-form-group" style="margin:0;">
              <label class="auth-label">Назначаемая роль</label>
              <input type="hidden" id="staff-role-val" value="Администратор (Модератор сетки)">
              <div class="glass-select-wrap" id="staff-role-dd">
                <button type="button" class="glass-select-trigger" onclick="window.toggleGlassDropdown('staff-role-dd', event)">
                  <span id="staff-role-lbl">Администратор (Модератор сетки)</span><i class="fas fa-chevron-down" style="font-size:11px; color:var(--accent-soft);"></i>
                </button>
                <div class="glass-select-menu">
                  ${["Администратор (Модератор сетки)", "Главный судья"].map(r => `<button type="button" class="glass-select-option" onclick="window.selectGlassDropdownOption('staff-role-dd','staff-role-val','staff-role-lbl','${r}')">${r}</button>`).join("")}
                </div>
              </div>
            </div>
          </div>
          <button type="submit" class="auth-submit-btn" style="margin-top:12px;">НАЗНАЧИТЬ СОТРУДНИКА</button>
        </form>

        <div style="display:flex; flex-direction:column; gap:8px;">
          ${staffList.length === 0 ? `<div class="glass-subcard" style="text-align:center; padding:18px; font-size:12px; color:var(--white-dim);">Назначенных сотрудников пока нет.</div>` : staffList.map(s => `
            <div class="glass-subcard" style="display:flex; justify-content:space-between; align-items:center; padding:12px 15px;">
              <div><b>${escapeHTML(s.nick)}</b> <span class="${s.role === 'Главный судья' ? 'rbac-badge-chief' : 'rbac-badge-mod'}" style="margin-left:8px;">${escapeHTML(s.role)}</span></div>
              <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 11px; font-size:10px; color:#fb7185;" onclick="window.removeTournamentStaff('${s.uid}')">Снять</button>
            </div>
          `).join("")}
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================================
// 7. РАЗДЕЛ «ТУРНИРЫ» (/tournaments) — СЕТКА ДО 32 МЕСТ С АВАТАРКАМИ И УПРАВЛЕНИЕМ
// ============================================================================
window.setTournamentFormatFilter = (fmt) => { tournamentFilterFormat = fmt; renderTournamentsSection(); };
window.openTournamentDetails = (tId) => { activeTournamentId = tId; tournamentDetailTab = "bracket"; activeControlMatchId = null; window.goRoute("/tournaments"); };
window.closeTournamentDetails = () => { activeTournamentId = null; activeControlMatchId = null; renderTournamentsSection(); };

window.registerInTournament = (tId) => {
  if (!currentUser) return window.goRoute("/authorization");
  if (currentUser.accountType === "organizer") return window.showMirrorToast("Организаторы не участвуют в турнирах как игроки!", true);
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn) return;
  if (trn.stage && trn.stage !== "registration") return window.showMirrorToast("Регистрация на этот турнир уже закрыта!", true);

  const myClan = getPlayerClan(currentUser);
  if ((trn.format === "5v5" || trn.format === "2v2") && !myClan) {
    return window.showMirrorToast(`Для командного режима ${trn.format} сначала создайте или вступите в клан!`, true);
  }

  const entryObj = trn.format === "1v1"
    ? { id: currentUser.uid, name: currentUser.nick, avatar: currentUser.avatar, type: "player", checkedIn: false, approved: true }
    : { id: myClan.id, name: `[${myClan.tag}] ${myClan.name}`, avatar: myClan.logo, type: "clan", checkedIn: false, approved: true };

  trn.participants = (trn.participants || []).map(p => normalizeParticipantEntry(p, trn.format));
  if (trn.participants.some(p => p.id === entryObj.id)) return window.showMirrorToast("Ваша заявка уже подана!");
  if (trn.participants.length >= trn.maxTeams) return window.showMirrorToast("Все слоты турнира заняты!", true);

  const ok = confirm(`Условия участия:\n1. Обязательный спонсор: подписка на ${OFFICIAL_SPONSOR_NAME}\n2. ${trn.entryMode === 'gold' ? `Взнос ${trn.entryFeeGold} Gold` : `Минимум 5 подписок от команды на ${trn.subPlatform} (${trn.subChannelLink})`}\n\nПодтвердить и подать заявку от «${entryObj.name}»?`);
  if (!ok) return;

  trn.participants.push(entryObj);
  trn.bracketData = generateSmartBracketData(trn);
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(`Заявка «${entryObj.name}» принята! Не забудьте пройти Check-In.`);
};

function renderMatchNodeHTML(trn, m, canManage) {
  const statusTag = m.status === "live"
    ? `<span style="color:var(--accent-soft); font-weight:900;">● LIVE</span>`
    : (m.status === "disputed" ? `<span style="color:#fb7185; font-weight:900;">⚠ СПОР</span>` : (m.status === "finished" ? `<span style="color:#86efac;">✓ DONE</span>` : `<span>${escapeHTML(m.map || "SO2")}</span>`));

  const renderSlot = (team, score, isWinner) => {
    if (!team) {
      return `<div class="bracket-team-line"><div class="bracket-slot-left"><div class="bracket-slot-avatar"></div><span class="bracket-slot-name tbd">Ожидание слота</span></div><span class="bracket-slot-score">-</span></div>`;
    }
    return `
      <div class="bracket-team-line ${isWinner ? 'is-winner' : ''}">
        <div class="bracket-slot-left">
          <img src="${escapeHTML(team.avatar)}" class="bracket-slot-avatar" alt="">
          <span class="bracket-slot-name">${escapeHTML(team.name)}</span>
        </div>
        <span class="bracket-slot-score">${score}</span>
      </div>
    `;
  };

  return `
    <div class="bracket-match-node manageable ${m.status === 'live' ? 'match-live' : ''} ${m.status === 'disputed' ? 'match-disputed' : ''}" onclick="window.openMatchControlModal('${trn.id}', '${m.id}')">
      <div class="bracket-match-meta">
        <span>${m.lobbyId ? `ID: ${escapeHTML(m.lobbyId)}` : 'Открыть матч'}</span>
        ${statusTag}
      </div>
      ${renderSlot(m.teamA, m.scoreA, m.winner === "A")}
      ${renderSlot(m.teamB, m.scoreB, m.winner === "B")}
    </div>
  `;
}

function renderDynamicBracketForTournament(trn, role) {
  const canManage = canModerateBracket(role);
  if (!trn.bracketData) trn.bracketData = generateSmartBracketData(trn);
  const bd = trn.bracketData;

  if (bd.type === "Round Robin") {
    const matches = bd.rounds[0] || [];
    const tableMap = {};
    (trn.participants || []).map(p => normalizeParticipantEntry(p, trn.format)).forEach(p => {
      tableMap[p.id] = { name: p.name, avatar: p.avatar, played: 0, wins: 0, losses: 0, diff: 0, pts: 0 };
    });
    matches.forEach(m => {
      if (m.status === "finished" && m.teamA && m.teamB) {
        const a = tableMap[m.teamA.id], b = tableMap[m.teamB.id];
        if (a && b) {
          a.played++; b.played++;
          a.diff += (m.scoreA - m.scoreB); b.diff += (m.scoreB - m.scoreA);
          if (m.winner === "A") { a.wins++; a.pts += 3; b.losses++; }
          else if (m.winner === "B") { b.wins++; b.pts += 3; a.losses++; }
        }
      }
    });
    const standings = Object.values(tableMap).sort((x, y) => y.pts - x.pts || y.diff - x.diff);
    return `
      <div class="glass-subcard" style="margin-top:14px;">
        <div style="font-family:var(--font-display); font-size:11px; color:var(--accent-soft); font-weight:800; margin-bottom:12px;">
          КРУГОВАЯ ТАБЛИЦА И МАТЧИ (ROUND ROBIN • ${trn.format})
        </div>
        ${standings.length > 0 ? `
          <div class="rr-table-wrap">
            <table class="rr-table">
              <thead><tr><th>ПОЗ</th><th>УЧАСТНИК</th><th>И</th><th>В</th><th>П</th><th>Р/Р</th><th>ОЧКИ</th></tr></thead>
              <tbody>
                ${standings.map((row, idx) => `
                  <tr>
                    <td style="font-family:var(--font-display); color:var(--accent-soft); font-weight:900;">${idx + 1}</td>
                    <td><div style="display:flex; align-items:center; gap:8px;"><img src="${escapeHTML(row.avatar)}" class="bracket-slot-avatar"><b>${escapeHTML(row.name)}</b></div></td>
                    <td>${row.played}</td><td style="color:#86efac;">${row.wins}</td><td style="color:#fb923c;">${row.losses}</td><td>${row.diff > 0 ? '+' + row.diff : row.diff}</td>
                    <td style="font-family:var(--font-display); font-weight:900; color:var(--accent-soft);">${row.pts}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : ''}
        ${matches.length === 0 ? `<div style="font-size:12px; color:var(--white-dim);">Добавьте минимум 2 участников для генерации пар.</div>` : `
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(235px, 1fr)); gap:12px;">
            ${matches.map(m => renderMatchNodeHTML(trn, m, canManage)).join("")}
          </div>
        `}
      </div>
    `;
  }

  return `
    <div class="glass-subcard" style="margin-top:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:10px;">
        <div style="font-family:var(--font-display); font-size:11px; color:var(--accent-soft); font-weight:800;">
          ТУРНИРНАЯ СЕТКА (${escapeHTML(bd.type.toUpperCase())} • ${bd.size || trn.maxTeams} МЕСТ • ${escapeHTML(trn.format)})
        </div>
        <span style="font-size:10.5px; color:var(--white-dim);">Листайте сетку горизонтально →</span>
      </div>

      <div class="bracket-scroll-shell">
        <div class="bracket-columns">
          ${(bd.rounds || []).map(rMatches => `
            <div class="bracket-col">
              <div class="bracket-col-head">${escapeHTML(rMatches[0]?.roundName || "РАУНД")}</div>
              ${rMatches.map(m => renderMatchNodeHTML(trn, m, canManage)).join("")}
            </div>
          `).join("")}
        </div>
      </div>

      ${bd.type === "Double Elimination" && (bd.lowerRounds || []).length > 0 ? `
        <div style="margin-top:16px; padding-top:14px; border-top:1px solid var(--edge-light);">
          <div style="font-family:var(--font-display); font-size:10.5px; color:#7dd3fc; font-weight:800; margin-bottom:10px;">НИЖНЯЯ СЕТКА (LOWER BRACKET)</div>
          <div class="bracket-scroll-shell">
            <div class="bracket-columns">
              ${bd.lowerRounds.map(lMatches => `
                <div class="bracket-col">
                  <div class="bracket-col-head">LOWER ROUND</div>
                  ${lMatches.map(m => renderMatchNodeHTML(trn, m, canManage)).join("")}
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderTournamentsSection() {
  const root = document.getElementById("tournaments-stage-root");
  if (!root) return;

  if (activeTournamentId) {
    const trn = cloudTournaments.find(t => t.id === activeTournamentId);
    if (trn) {
      const role = getUserRoleInTournament(currentUser, trn);
      const isChief = canChiefControl(role);
      const isMod = canModerateBracket(role);
      const stage = trn.stage || "registration";
      const parts = (trn.participants || []).map(p => normalizeParticipantEntry(p, trn.format));
      const myClan = currentUser ? getPlayerClan(currentUser) : null;
      const myEntryId = currentUser ? (trn.format === "1v1" ? currentUser.uid : (myClan ? myClan.id : currentUser.uid)) : null;
      const myEntry = parts.find(p => p.id === myEntryId);
      const activeMatch = activeControlMatchId ? findMatchInTournament(trn, activeControlMatchId) : null;
      const so2Maps = OFFICIAL_SO2_MAPS;

      root.innerHTML = `
        <div class="mirror-card">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:14px;">
            <div style="display:flex; gap:7px; flex-wrap:wrap;">
              <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 14px; font-size:10px;" onclick="window.closeTournamentDetails()">← К списку турниров</button>
              <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 13px; font-size:10px;" onclick="window.openTournamentInviteModal('${trn.id}')"><i class="fas fa-share-alt" style="color:var(--accent-soft);"></i> Пригласить / Ссылка</button>
            </div>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
              ${isChief ? `<span class="rbac-badge-chief"><i class="fas fa-gavel"></i> ГЛАВНЫЙ СУДЬЯ</span>` : (isMod ? `<span class="rbac-badge-mod"><i class="fas fa-shield-alt"></i> МОДЕРАТОР СЕТКИ</span>` : '')}
            </div>
          </div>

          <div class="trn-hero-cover" style="${trn.banner ? `background-image:url('${escapeHTML(trn.banner)}');` : ''}">
            ${isChief ? `<button type="button" class="banner-upload-chip" onclick="window.triggerTournamentBannerUpload('${trn.id}')"><i class="fas fa-image" style="color:var(--accent-soft);"></i> Баннер турнира</button>` : ''}
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-top:${isChief ? '12px' : '0'};">
            <div>
              <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                ${trn.isOfficial ? `<span class="official-c6e-badge">OFFICIAL • ${OFFICIAL_SPONSOR_NAME}</span>` : `<span class="verified-org-check" style="cursor:pointer;" onclick="window.viewPlayerProfile('${trn.organizerUid}')">${getVerifiedOrgCheckSVG(11)} ${escapeHTML(trn.orgName)}</span>`}
                <span class="glass-pill-badge">${escapeHTML(trn.format)} • ${trn.maxTeams} МЕСТ</span>
              </div>
              <h2 style="font-family:var(--font-display); font-size:23px; font-weight:900; color:#ffffff; margin-top:8px;">${escapeHTML(trn.name)}</h2>
              <div style="font-size:12px; color:var(--white-soft); margin-top:4px;">
                Призовой фонд: <b style="color:var(--accent-soft);">${escapeHTML(trn.prizeGold)} Gold</b> • Старт: <b>${escapeHTML(trn.startDate)}</b> • Участников: <b>${parts.length}/${trn.maxTeams}</b>
              </div>
            </div>

            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${stage === "registration" && !myEntry ? `<button type="button" class="auth-submit-btn" style="width:auto; padding:11px 22px;" onclick="window.registerInTournament('${trn.id}')">УЧАСТВОВАТЬ</button>` : ''}
              ${stage === "registration" && myEntry ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:9px 14px; font-size:10px; color:#fb7185;" onclick="window.cancelMyTournamentRegistration('${trn.id}')">Отменить заявку</button>` : ''}
              ${stage === "checkin" && myEntry && !myEntry.checkedIn ? `<button type="button" class="auth-submit-btn" style="width:auto; padding:11px 22px;" onclick="window.playerCheckInTournament('${trn.id}')">✓ ПРОЙТИ CHECK-IN</button>` : ''}
              ${myEntry && myEntry.checkedIn ? `<span class="verified-org-check">✓ CHECK-IN ПРОЙДЕН</span>` : ''}
            </div>
          </div>
          </div>

          ${trn.champion ? `
            <div class="podium-grid">
              <div class="podium-card place-1">
                <span class="official-c6e-badge">1 МЕСТО • ЧЕМПИОН</span>
                <img src="${escapeHTML(trn.champion.avatar)}" style="width:54px; height:54px; border-radius:50%; object-fit:cover; border:2px solid #eab308;">
                <div style="font-family:var(--font-display); font-size:14px; font-weight:900;">${escapeHTML(trn.champion.name)}</div>
                <div style="font-size:11.5px; color:#fde047; font-weight:800;">Приз: ${Math.round((trn.prizeGold || 0) * 0.6)} Gold ${trn.payoutPaid ? '• ✓ ВЫПЛАЧЕНО' : ''}</div>
                ${isChief && !trn.payoutPaid ? `<button type="button" class="auth-submit-btn" style="width:auto; padding:6px 12px; font-size:9.5px; margin-top:4px;" onclick="window.confirmTournamentGoldPayout('${trn.id}')">✓ Подтвердить выплату Gold</button>` : ''}
              </div>
              ${trn.runnerUp ? `
                <div class="podium-card place-2">
                  <span class="glass-pill-badge">2 МЕСТО • ФИНАЛИСТ</span>
                  <img src="${escapeHTML(trn.runnerUp.avatar)}" style="width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid #cbd5e1;">
                  <div style="font-family:var(--font-display); font-size:13px; font-weight:900;">${escapeHTML(trn.runnerUp.name)}</div>
                  <div style="font-size:11px; color:var(--white-soft); font-weight:700;">Приз: ${Math.round((trn.prizeGold || 0) * 0.3)} Gold</div>
                </div>
              ` : ''}
              ${trn.mvpPlayer ? `
                <div class="podium-card place-mvp" style="cursor:pointer;" onclick="window.viewPlayerProfile('${trn.mvpPlayer.uid}')">
                  <span class="cp-badge-pill">★ MVP ТУРНИРА (+100 CP)</span>
                  <img src="${escapeHTML(trn.mvpPlayer.avatar)}" style="width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid var(--accent-soft);">
                  <div style="font-family:var(--font-display); font-size:13px; font-weight:900;">${escapeHTML(trn.mvpPlayer.nick)}</div>
                </div>
              ` : (isChief ? `
                <div class="podium-card place-mvp" style="justify-content:center;">
                  <span class="glass-pill-badge">MVP ТУРНИРА</span>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:8px 14px; font-size:10px; margin-top:6px;" onclick="window.assignTournamentMVP('${trn.id}')">★ Выбрать MVP (+100 CP)</button>
                </div>
              ` : '')}
            </div>
          ` : ''}

          <!-- ЭТАПЫ ТУРНИРА -->
          <div class="trn-stepper-bar">
            <div class="trn-step-pill ${stage === 'registration' ? 'active' : 'done'}">1. Регистрация</div>
            <div class="trn-step-pill ${stage === 'checkin' ? 'active' : (stage === 'live' || stage === 'finished' ? 'done' : '')}">2. Check-In</div>
            <div class="trn-step-pill ${stage === 'live' ? 'active' : (stage === 'finished' ? 'done' : '')}">3. Сетка LIVE</div>
            <div class="trn-step-pill ${stage === 'finished' ? 'done' : ''}">4. Завершён</div>
          </div>

          ${(() => {
            const myMatch = findMyActiveMatchInTournament(trn);
            if (!myMatch) return '';
            const opp = myMatch.teamA?.id === myEntryId ? myMatch.teamB : myMatch.teamA;
            return `
              <div class="my-match-hud-bar">
                <div style="font-size:12px; color:#ffffff;">
                  <b style="color:#86efac;">Ваш текущий матч (${escapeHTML(myMatch.roundName || 'SO2')}):</b>
                  vs <b>${escapeHTML(opp ? opp.name : 'Ожидание соперника')}</b> • Карта: <b>${escapeHTML(myMatch.map || 'Veto')}</b>
                </div>
                <button type="button" class="auth-submit-btn" style="width:auto; padding:7px 14px; font-size:10px;" onclick="window.openMatchControlModal('${trn.id}', '${myMatch.id}')">
                  Открыть комнату матча →
                </button>
              </div>
            `;
          })()}

          <!-- ПАНЕЛЬ УПРАВЛЕНИЯ ЭТАПАМИ (ДЛЯ СУДЬИ И МОДЕРАТОРА) -->
          ${isMod ? `
            <div class="glass-subcard" style="margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
              <div style="font-size:11.5px; color:var(--white-soft);">
                <b>Управление турниром:</b> ${isChief ? 'полный контроль Главного Судьи' : 'права Модератора (Check-In, заявки, счёт и лобби)'}
              </div>
              <div style="display:flex; gap:7px; flex-wrap:wrap;">
                ${stage === "registration" ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 12px; font-size:10px;" onclick="window.manualAddParticipantToTournament('${trn.id}')">+ Добавить участника</button>` : ''}
                ${stage === "registration" ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 12px; font-size:10px;" onclick="window.advanceTournamentStage('${trn.id}', 'checkin')">Открыть Check-In</button>` : ''}
                ${stage === "checkin" && isChief ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 12px; font-size:10px;" onclick="window.checkInAllParticipantsByChief('${trn.id}')">✓ Check-In всем</button>` : ''}
                ${(stage === "registration" || stage === "checkin") && isChief ? `<button type="button" class="auth-submit-btn" style="width:auto; padding:7px 14px; font-size:10px;" onclick="window.advanceTournamentStage('${trn.id}', 'live')">⚡ Сформировать сетку и Старт</button>` : ''}
                ${stage === "live" && isChief ? `<button type="button" class="auth-submit-btn" style="width:auto; padding:7px 14px; font-size:10px;" onclick="window.advanceTournamentStage('${trn.id}', 'finished')">Завершить турнир</button>` : ''}
                ${isChief ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 11px; font-size:10px; color:#fb7185;" onclick="window.deleteTournamentByChief('${trn.id}')">Удалить</button>` : ''}
              </div>
            </div>
          ` : ''}

          <!-- КОМНАТА МАТЧА (ДОСТУПНА ИГРОКАМ, КАПИТАНАМ И СУДЬЯМ) -->
          ${activeMatch ? `
            <div class="glass-subcard" style="margin-bottom:14px; border-color:var(--accent-bright);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <span class="glass-pill-badge">${escapeHTML(activeMatch.roundName || 'МАТЧ')} • ${escapeHTML(getEffectiveMatchSeriesFormat(trn, activeMatch))}</span>
                  <span class="glass-pill-badge">КАРТА: ${escapeHTML(activeMatch.map || 'Sandstone')}</span>
                  ${activeMatch.lobbyId ? `<button type="button" class="glass-pill-badge" style="cursor:pointer; border-color:var(--accent-soft);" onclick="window.copyLobbyId('${escapeHTML(activeMatch.lobbyId)}', event)"><i class="far fa-copy"></i> ЛОББИ: ${escapeHTML(activeMatch.lobbyId)}</button>` : ''}
                </div>
                <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:4px 10px; font-size:10px;" onclick="window.closeMatchControlModal()">✕</button>
              </div>

              ${activeMatch.disputeReason ? `<div class="mr-dispute-banner"><b>⚠ Спорный матч:</b> ${escapeHTML(activeMatch.disputeReason)}</div>` : ''}
              ${activeMatch.isPaused ? `
                <div class="mr-pause-banner">
                  <span>⏸ ${escapeHTML(activeMatch.pauseInfo || 'ПАУЗА МАТЧА')}</span>
                  ${isMod ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:4px 10px; font-size:9.5px;" onclick="window.toggleMatchPause('${trn.id}', '${activeMatch.id}', 'RESUME')">▶ Продолжить</button>` : ''}
                </div>
              ` : ''}

              <!-- ПОДТВЕРЖДЕНИЕ МАТЧА ЗА 30 МИНУТ ДО НАЧАЛА -->
              ${activeMatch.status !== 'finished' ? `
                <div class="match-30m-checkin-bar">
                  <div>
                    <b style="color:var(--accent-soft);">⏱ Подтверждение матча (за 30 мин до старта):</b>
                    <span style="color:var(--white-soft); margin-left:6px;">
                      A: ${activeMatch.confirmed30mA ? '<b style="color:#86efac;">✓ Подтверждено</b>' : 'Ожидание'} •
                      B: ${activeMatch.confirmed30mB ? '<b style="color:#86efac;">✓ Подтверждено</b>' : 'Ожидание'}
                    </span>
                  </div>
                  <div style="display:flex; gap:6px; flex-wrap:wrap;">
                    ${!activeMatch.confirmed30mA ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 10px; font-size:9.5px;" onclick="window.confirmMatch30MinCheckIn('${trn.id}', '${activeMatch.id}', 'A')">✓ Подтвердить A</button>` : ''}
                    ${!activeMatch.confirmed30mB ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 10px; font-size:9.5px;" onclick="window.confirmMatch30MinCheckIn('${trn.id}', '${activeMatch.id}', 'B')">✓ Подтвердить B</button>` : ''}
                  </div>
                </div>
              ` : ''}

              <div class="match-room-scoreboard" style="background-image:url('${getMapBannerUrl(activeMatch.map || 'Sandstone')}');">
                <div class="mr-side">
                  <img src="${escapeHTML(activeMatch.teamA?.avatar || 'https://api.dicebear.com/7.x/shapes/svg?seed=TBD')}" class="mr-side-avatar">
                  <div class="mr-side-name">${escapeHTML(activeMatch.teamA?.name || 'Ожидание слота')}</div>
                  <div style="display:flex; gap:5px; align-items:center;">
                    ${activeMatch.sideA ? `<span class="mr-ready-pill" style="color:#7dd3fc;">${activeMatch.sideA}</span>` : ''}
                    <span class="mr-ready-pill ${activeMatch.readyA ? 'is-ready' : ''}" style="cursor:pointer;" onclick="window.toggleMatchSideReady('${trn.id}', '${activeMatch.id}', 'A')">${activeMatch.readyA ? '✓ READY' : 'НЕ ГОТОВ'}</span>
                  </div>
                </div>
                <div class="mr-score-center">
                  <div class="mr-score-digits">${activeMatch.scoreA || 0} : ${activeMatch.scoreB || 0}</div>
                  <div style="font-size:9px; font-family:var(--font-display); color:var(--white-dim); margin-top:2px;">${escapeHTML((activeMatch.status || 'pending').toUpperCase())}</div>
                </div>
                <div class="mr-side">
                  <img src="${escapeHTML(activeMatch.teamB?.avatar || 'https://api.dicebear.com/7.x/shapes/svg?seed=TBD2')}" class="mr-side-avatar">
                  <div class="mr-side-name">${escapeHTML(activeMatch.teamB?.name || 'Ожидание слота')}</div>
                  <div style="display:flex; gap:5px; align-items:center;">
                    ${activeMatch.sideB ? `<span class="mr-ready-pill" style="color:var(--accent-soft);">${activeMatch.sideB}</span>` : ''}
                    <span class="mr-ready-pill ${activeMatch.readyB ? 'is-ready' : ''}" style="cursor:pointer;" onclick="window.toggleMatchSideReady('${trn.id}', '${activeMatch.id}', 'B')">${activeMatch.readyB ? '✓ READY' : 'НЕ ГОТОВ'}</span>
                  </div>
                </div>
              </div>

              ${renderMatchTimerBarHTML(trn, activeMatch, isMod)}
              ${renderSeriesMapStepperHTML(trn, activeMatch, isMod)}

              <!-- КОМПАКТНЫЕ ВКЛАДКИ КОМНАТЫ МАТЧА -->
              <div class="mr-compact-tabs">
                <button type="button" class="filter-pill-btn ${matchRoomSubTab === 'overview' ? 'active' : ''}" onclick="window.setMatchRoomSubTab('overview')">Табло и Чат</button>
                <button type="button" class="filter-pill-btn ${matchRoomSubTab === 'scanner' ? 'active' : ''}" onclick="window.setMatchRoomSubTab('scanner')">⚡ Сканер Таба (Авто-CP)</button>
                ${isMod ? `<button type="button" class="filter-pill-btn ${matchRoomSubTab === 'referee' ? 'active' : ''}" onclick="window.setMatchRoomSubTab('referee')">Управление судьи</button>` : ''}
              </div>

              ${matchRoomSubTab === "overview" ? `
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
                  ${activeMatch.lobbyId ? `<button type="button" class="auth-submit-btn" style="width:auto; padding:8px 14px; font-size:10px;" onclick="window.copyLobbyId('${escapeHTML(activeMatch.lobbyId)}', event)"><i class="far fa-copy"></i> ID лобби</button>` : ''}
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:8px 13px; font-size:10px;" onclick="window.triggerMatchTabScreenshotUpload('${trn.id}', '${activeMatch.id}')"><i class="fas fa-camera" style="color:var(--accent-soft);"></i> Загрузить Таб</button>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:8px 13px; font-size:10px; color:#fb7185;" onclick="window.playerCallRefereeInMatch('${trn.id}', '${activeMatch.id}')">⚠ Вызвать судью</button>
                </div>
                ${activeMatch.tabScreenshot ? `<img src="${escapeHTML(activeMatch.tabScreenshot)}" class="tab-screenshot-preview" alt="Скриншот Таба" onclick="window.openTabLightbox(this.src)">` : ''}

                <div class="mr-chat-box">
                  <div style="font-family:var(--font-display); font-size:9.5px; color:var(--accent-soft); font-weight:800; margin-bottom:7px;">ЧАТ МАТЧА (${(activeMatch.chat || []).length})</div>
                  <div class="mr-chat-messages">
                    ${(activeMatch.chat || []).length === 0 ? `<div style="font-size:11px; color:var(--white-dim);">Напишите сопернику или судье (например: «Готовы к лобби»).</div>` : (activeMatch.chat || []).map(c => `
                      <div class="mr-chat-msg ${c.isStaff ? 'staff-msg' : ''}">
                        <div style="display:flex; justify-content:space-between; font-size:10px; margin-bottom:2px;">
                          <span><b style="color:${c.isStaff ? '#fde047' : 'var(--accent-soft)'};">${escapeHTML(c.author)}</b> ${c.roleTag ? `<span class="glass-pill-badge" style="font-size:7.5px; padding:1px 6px; margin-left:4px;">${c.roleTag}</span>` : ''}</span>
                          <span style="color:var(--white-dim);">${escapeHTML(c.time)}</span>
                        </div>
                        <div style="color:#ffffff;">${escapeHTML(c.text)}</div>
                      </div>
                    `).join("")}
                  </div>
                  <form onsubmit="window.sendMatchChatMessage(event, '${trn.id}', '${activeMatch.id}')" class="mr-chat-form">
                    <input type="text" id="mr-chat-input" class="auth-input" style="padding:8px 12px; font-size:12px;" placeholder="Написать в чат матча..." required>
                    <button type="submit" class="auth-submit-btn" style="width:auto; padding:8px 16px; font-size:10px;">Отправить</button>
                  </form>
                </div>
              ` : ''}

              ${matchRoomSubTab === "scanner" ? (() => {
                const scanRows = ensureMatchScannedPlayers(trn, activeMatch);
                return `
                  <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                    <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:8px 13px; font-size:10px;" onclick="window.triggerMatchTabScreenshotUpload('${trn.id}', '${activeMatch.id}')"><i class="fas fa-upload" style="color:var(--accent-soft);"></i> ${activeMatch.tabScreenshot ? 'Заменить скрин Таба' : 'Загрузить скрин Таба'}</button>
                    <button type="button" class="auth-submit-btn" style="width:auto; padding:8px 16px; font-size:10px;" onclick="window.runTabScreenshotOCR('${trn.id}', '${activeMatch.id}')" ${ocrIsScanning ? 'disabled' : ''}>⚡ Сканировать Таб (OCR)</button>
                  </div>
                  ${ocrIsScanning ? `
                    <div style="font-size:11px; color:var(--accent-soft);" id="ocr-prog-lbl">Сканирование Таба Standoff 2... ${ocrScanProgress}%</div>
                    <div class="scanner-progress-track"><div class="scanner-progress-fill" id="ocr-prog-bar" style="width:${ocrScanProgress}%;"></div></div>
                  ` : ''}
                  ${activeMatch.tabScreenshot ? `<img src="${escapeHTML(activeMatch.tabScreenshot)}" class="tab-screenshot-preview" style="max-height:150px;" alt="Скриншот Таба" onclick="window.openTabLightbox(this.src)">` : ''}

                  ${activeMatch.tabVerifyMessage ? `
                    <div class="tab-verify-box ${activeMatch.tabVerifyStatus === 'verified' ? 'verified' : 'mismatch'}">
                      <b>${activeMatch.tabVerifyStatus === 'verified' ? '✓ ТАБ ПОДТВЕРЖДЁН ПО ТЕГУ:' : 'ℹ ПРОВЕРКА ТАБА:'}</b> ${escapeHTML(activeMatch.tabVerifyMessage)}
                    </div>
                  ` : `
                    <div class="tab-verify-box">
                      Загрузите скриншот Таба Standoff 2 (<b>У / П / С / Счет / Пинг / Карта / Регион</b>) и нажмите <b>«Сканировать Таб»</b> — если теги кланов <b>[${escapeHTML(extractClanTagFromName(activeMatch.teamA?.name))}]</b> и <b>[${escapeHTML(extractClanTagFromName(activeMatch.teamB?.name))}]</b> совпадут, игра подтвердится и победа с CP выдастся автоматически!
                    </div>
                  `}

                  <div class="scanner-table-wrap">
                    <table class="scanner-table">
                      <thead><tr><th>ИГРОК</th><th>У (K)</th><th>П (IMP)</th><th>С (D)</th><th>ПИНГ</th><th>K/D</th><th>АВТО-CP</th></tr></thead>
                      <tbody>
                        ${scanRows.map((r, idx) => {
                          const rKd = r.deaths > 0 ? (r.kills / r.deaths) : (r.kills > 0 ? r.kills : 0);
                          const rCp = calculatePlayerMatchCP(rKd);
                          return `
                            <tr>
                              <td><b style="color:${r.side === 'A' ? '#7dd3fc' : 'var(--accent-soft)'};">[${r.side}]</b> ${escapeHTML(r.nick)}</td>
                              <td><input type="number" class="scanner-num-inp" min="0" value="${r.kills}" oninput="window.updateScannedRowField('${trn.id}','${activeMatch.id}',${idx},'kills',this.value)" ${!isMod ? 'disabled' : ''}></td>
                              <td><input type="number" class="scanner-num-inp" min="0" value="${r.impact || 0}" oninput="window.updateScannedRowField('${trn.id}','${activeMatch.id}',${idx},'impact',this.value)" ${!isMod ? 'disabled' : ''}></td>
                              <td><input type="number" class="scanner-num-inp" min="0" value="${r.deaths}" oninput="window.updateScannedRowField('${trn.id}','${activeMatch.id}',${idx},'deaths',this.value)" ${!isMod ? 'disabled' : ''}></td>
                              <td style="font-family:var(--font-display); font-size:10.5px; color:var(--white-dim);">${r.ping || '—'}</td>
                              <td style="font-family:var(--font-display); font-weight:800;" id="scan-kd-${idx}">${rKd.toFixed(2)}</td>
                              <td style="font-family:var(--font-display); font-weight:900; color:#86efac;" id="scan-cp-${idx}">+${rCp} CP</td>
                            </tr>
                          `;
                        }).join("")}
                      </tbody>
                    </table>
                  </div>

                  ${isMod ? `
                    <button type="button" class="auth-submit-btn" style="margin-top:12px;" onclick="window.applyScannedTabAndAwardCP('${trn.id}', '${activeMatch.id}')" ${activeMatch.cpAwarded ? 'disabled' : ''}>
                      ${activeMatch.cpAwarded ? '✓ ИТОГИ ТАБА ПРИМЕНЕНЫ И CP НАЧИСЛЕНЫ' : '✓ ПРИМЕНИТЬ ИТОГИ ТАБА И НАЧИСЛИТЬ CP АВТОМАТИЧЕСКИ'}
                    </button>
                  ` : `<div style="font-size:11px; color:var(--white-dim); margin-top:8px;">CP начисляются сайтом автоматически после подтверждения Таба судьёй.</div>`}
                `;
              })() : ''}

              ${matchRoomSubTab === "referee" && isMod ? `
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(125px, 1fr)); gap:9px; margin-bottom:10px;">
                  <div><label class="auth-label">Карта SO2</label><input type="hidden" id="mc-map" value="${escapeHTML(activeMatch.map || 'Sandstone')}"><div class="glass-select-wrap" id="mc-map-dd"><button type="button" class="glass-select-trigger" onclick="window.toggleGlassDropdown('mc-map-dd', event)"><span id="mc-map-lbl">${escapeHTML(activeMatch.map || 'Sandstone')}</span><i class="fas fa-chevron-down" style="font-size:10px;"></i></button><div class="glass-select-menu">${so2Maps.map(mp => `<button type="button" class="glass-select-option" onclick="window.selectGlassDropdownOption('mc-map-dd','mc-map','mc-map-lbl','${mp}')">${mp}</button>`).join("")}</div></div></div>
                  <div><label class="auth-label">ID Лобби SO2</label><input type="text" id="mc-lobby" class="auth-input" style="padding-left:12px;" value="${escapeHTML(activeMatch.lobbyId || '')}" placeholder="123456"></div>
                  <div><label class="auth-label">Счёт A</label><input type="number" id="mc-score-a" class="auth-input" style="padding-left:12px;" min="0" value="${activeMatch.scoreA || 0}"></div>
                  <div><label class="auth-label">Счёт B</label><input type="number" id="mc-score-b" class="auth-input" style="padding-left:12px;" min="0" value="${activeMatch.scoreB || 0}"></div>
                </div>
                <div style="margin-bottom:10px;">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-family:var(--font-display); font-size:9px; color:var(--accent-soft); font-weight:800;">MAP VETO (БАН КАРТ)</span>
                    <button type="button" style="background:none; border:none; color:var(--white-dim); font-size:10px; cursor:pointer; text-decoration:underline;" onclick="window.resetMatchVeto('${trn.id}', '${activeMatch.id}')">Сбросить</button>
                  </div>
                  <div class="veto-maps-grid">
                    ${OFFICIAL_SO2_MAPS.map(mp => {
                      const banned = (activeMatch.bannedMaps || []).includes(mp);
                      const remaining = OFFICIAL_SO2_MAPS.filter(x => !(activeMatch.bannedMaps || []).includes(x));
                      const picked = !banned && remaining.length === 1;
                      return `<button type="button" class="veto-map-chip ${banned ? 'banned' : ''} ${picked ? 'picked' : ''}" style="background-image:url('${getMapBannerUrl(mp)}');" onclick="window.vetoBanMapInMatch('${trn.id}', '${activeMatch.id}', '${mp}')"><span>${mp}</span><span>${picked ? '✓' : (banned ? '✕' : '')}</span></button>`;
                    }).join("")}
                  </div>
                </div>
                <div style="display:flex; gap:7px; flex-wrap:wrap;">
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 11px; font-size:10px;" onclick="window.flipCoinForSides('${trn.id}', '${activeMatch.id}')">🪙 CT/T</button>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 10px; font-size:10px;" onclick="window.toggleMatchPause('${trn.id}', '${activeMatch.id}', 'A')">⏸ A (${activeMatch.pausesA || 0}/2)</button>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 10px; font-size:10px;" onclick="window.toggleMatchPause('${trn.id}', '${activeMatch.id}', 'B')">⏸ B (${activeMatch.pausesB || 0}/2)</button>
                  ${trn.seriesFormat && trn.seriesFormat !== 'BO1' ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 11px; font-size:10px; color:#86efac;" onclick="window.recordMapScoreInSeries('${trn.id}', '${activeMatch.id}')">+ Карта (${trn.seriesFormat})</button>` : ''}
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 11px; font-size:10px;" onclick="window.saveMatchUpdateAction('${trn.id}', '${activeMatch.id}', 'save')">Сохранить</button>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 11px; font-size:10px; color:var(--accent-soft);" onclick="window.saveMatchUpdateAction('${trn.id}', '${activeMatch.id}', 'live')">● LIVE</button>
                  <button type="button" class="auth-submit-btn" style="width:auto; padding:7px 12px; font-size:10px;" onclick="window.saveMatchUpdateAction('${trn.id}', '${activeMatch.id}', 'winA')">Победа A</button>
                  <button type="button" class="auth-submit-btn" style="width:auto; padding:7px 12px; font-size:10px;" onclick="window.saveMatchUpdateAction('${trn.id}', '${activeMatch.id}', 'winB')">Победа B</button>
                  ${isChief ? `
                    <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 10px; font-size:10px; color:#fde047;" onclick="window.saveMatchUpdateAction('${trn.id}', '${activeMatch.id}', 'techA')">Тех. A</button>
                    <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 10px; font-size:10px; color:#fde047;" onclick="window.saveMatchUpdateAction('${trn.id}', '${activeMatch.id}', 'techB')">Тех. B</button>
                    ${activeMatch.status === 'finished' ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 10px; font-size:10px; color:#fb7185;" onclick="window.reopenMatchByChief('${trn.id}', '${activeMatch.id}')">↺ Переоткрыть</button>` : ''}
                  ` : `
                    <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 10px; font-size:10px; color:#fb7185;" onclick="window.saveMatchUpdateAction('${trn.id}', '${activeMatch.id}', 'dispute')">⚠ Главному судье</button>
                  `}
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="filter-pills-row" style="margin-bottom:10px;">
            <button type="button" class="filter-pill-btn ${tournamentDetailTab === 'bracket' ? 'active' : ''}" onclick="window.setTournamentDetailTab('bracket')">Сетка (${trn.maxTeams} мест)</button>
            <button type="button" class="filter-pill-btn ${tournamentDetailTab === 'participants' ? 'active' : ''}" onclick="window.setTournamentDetailTab('participants')">Участники (${parts.length}/${trn.maxTeams})</button>
            <button type="button" class="filter-pill-btn ${tournamentDetailTab === 'info' ? 'active' : ''}" onclick="window.setTournamentDetailTab('info')">Призы и Лог судьи</button>
          </div>

          ${tournamentDetailTab === "info" ? `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px; margin-top:12px;">
              <div class="glass-subcard">
                <div style="font-family:var(--font-display); font-size:11px; color:var(--accent-soft); font-weight:800; margin-bottom:10px;">РАСПРЕДЕЛЕНИЕ ПРИЗОВОГО ФОНДА (${trn.prizeGold} GOLD)</div>
                <div style="font-size:12px; display:flex; flex-direction:column; gap:6px;">
                  <div style="display:flex; justify-content:space-between;"><span>🥇 1 место (Чемпион)</span><b style="color:#fde047;">${Math.round((trn.prizeGold || 0) * 0.6)} Gold (60%)</b></div>
                  <div style="display:flex; justify-content:space-between;"><span>🥈 2 место (Финалист)</span><b>${Math.round((trn.prizeGold || 0) * 0.3)} Gold (30%)</b></div>
                  <div style="display:flex; justify-content:space-between;"><span>🥉 3 место</span><b style="color:var(--accent-soft);">${Math.round((trn.prizeGold || 0) * 0.1)} Gold (10%)</b></div>
                </div>
                <div class="sponsor-mandatory-box" style="margin-top:12px;">
                  <b>Вход:</b> ${trn.entryMode === 'gold' ? `${trn.entryFeeGold} Gold` : `5+ подписок на ${escapeHTML(trn.subPlatform)}`}<br>
                  <b>Обязательный спонсор:</b> <a href="${OFFICIAL_SPONSOR_TG}" target="_blank" style="color:#fde047;">${OFFICIAL_SPONSOR_NAME}</a>
                </div>
              </div>
              <div class="glass-subcard">
                <div style="font-family:var(--font-display); font-size:11px; color:var(--accent-soft); font-weight:800; margin-bottom:10px;">ЖУРНАЛ ДЕЙСТВИЙ СУДЕЙ (${(trn.auditLog || []).length})</div>
                <div class="trn-audit-log">
                  ${(trn.auditLog || []).length === 0 ? `<div style="font-size:12px; color:var(--white-dim);">Записей в журнале пока нет.</div>` : (trn.auditLog || []).map(l => `
                    <div class="trn-audit-item">
                      <span><b style="color:var(--accent-soft);">${escapeHTML(l.actor)}</b>: ${escapeHTML(l.text)}</span>
                      <span style="color:var(--white-dim); flex-shrink:0;">${escapeHTML(l.time)}</span>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>
          ` : (tournamentDetailTab === "bracket" ? renderDynamicBracketForTournament(trn, role) : `
            <div class="glass-subcard" style="margin-top:12px;">
              ${parts.length === 0 ? `<div style="text-align:center; padding:18px; font-size:12px; color:var(--white-dim);">Заявок пока нет.</div>` : `
                <div style="display:flex; flex-direction:column; gap:8px;">
                  ${parts.map(p => `
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:9px 12px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid var(--edge-light);">
                      <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="${p.type === 'player' ? `window.viewPlayerProfile('${p.id}')` : `window.viewClanProfile('${p.id}')`}" title="Открыть профиль для проверки состава">
                        <img src="${escapeHTML(p.avatar)}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border:1px solid var(--accent-bright);">
                        <div>
                          <div style="font-size:12.5px; font-weight:800; color:#fff;">${escapeHTML(p.name)}</div>
                          <div style="font-size:10px; color:${p.disqualified ? '#fb7185' : (p.checkedIn ? '#86efac' : 'var(--white-dim)')};">${p.disqualified ? '✕ ДИСКВАЛИФИЦИРОВАН (DQ)' : (p.checkedIn ? '✓ Check-In подтверждён' : 'Ожидает Check-In')}</div>
                        </div>
                      </div>
                      ${isMod ? `
                        <div style="display:flex; gap:6px;">
                          <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 10px; font-size:9.5px;" onclick="window.moderateParticipantEntry('${trn.id}', '${p.id}', 'checkin')">Check-In</button>
                          <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 10px; font-size:9.5px; color:#fb7185;" onclick="window.moderateParticipantEntry('${trn.id}', '${p.id}', 'kick')">Снять</button>
                          ${isChief && !p.disqualified ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 10px; font-size:9.5px; color:#fde047;" onclick="window.disqualifyParticipantInTournament('${trn.id}', '${p.id}')">DQ</button>` : ''}
                        </div>
                      ` : ''}
                    </div>
                  `).join("")}
                </div>
              `}
            </div>
          `)}
        </div>
      `;
      return;
    }
  }

  const qTrn = tournamentSearchQuery.trim().toLowerCase();
  const filtered = cloudTournaments.filter(t => {
    const fmtOk = tournamentFilterFormat === "ALL" || t.format === tournamentFilterFormat;
    const stOk = tournamentStageFilter === "ALL" || (t.stage || "registration") === tournamentStageFilter;
    const qOk = !qTrn || String(t.name || "").toLowerCase().includes(qTrn) || String(t.orgName || "").toLowerCase().includes(qTrn);
    return fmtOk && stOk && qOk;
  });
  const canCreate = canUserAccessOrganizerPanel(currentUser);

  root.innerHTML = `
    <div class="mirror-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div>
          <span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> STANDOFF 2</span>
          <h2 style="font-family:var(--font-display); font-size:22px; font-weight:900; color:#ffffff; margin-top:8px;">ТУРНИРЫ CYBER 6 (${filtered.length})</h2>
        </div>
        ${canCreate ? `
          <button type="button" class="auth-submit-btn" style="width:auto; padding:10px 20px;" onclick="window.openCreateTournamentFromFeed()">
            <i class="fas fa-plus"></i> ${currentUser?.isAdmin ? 'Создать Official турнир' : 'Панель организатора'}
          </button>
        ` : `<span class="glass-pill-badge">СОЗДАНИЕ: ТОЛЬКО ДЛЯ ОРГАНИЗАТОРОВ</span>`}
      </div>

      <div class="auth-input-box" style="margin-bottom:12px;">
        <i class="fas fa-search auth-input-icon-left" style="color:var(--accent-soft);"></i>
        <input type="text" class="auth-input" value="${escapeHTML(tournamentSearchQuery)}" oninput="window.onTournamentSearchInput(this.value)" placeholder="Поиск турнира по названию или организатору...">
      </div>

      <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
        <div class="filter-pills-row">
          ${["ALL", "5v5", "2v2", "1v1"].map(f => `<button type="button" class="filter-pill-btn ${tournamentFilterFormat === f ? 'active' : ''}" onclick="window.setTournamentFormatFilter('${f}')">${f === "ALL" ? "Все форматы" : f}</button>`).join("")}
        </div>
        <div class="filter-pills-row">
          ${[
            ["ALL", "Все статусы"],
            ["registration", "Регистрация"],
            ["checkin", "Check-In"],
            ["live", "LIVE"],
            ["finished", "Завершённые"]
          ].map(([k, lbl]) => `<button type="button" class="filter-pill-btn ${tournamentStageFilter === k ? 'active' : ''}" onclick="window.setTournamentStageFilter('${k}')">${lbl}</button>`).join("")}
        </div>
      </div>

      <div id="tournaments-catalog-grid"></div>
    </div>
  `;
  renderTournamentsCatalogGridOnly();
}

// ============================================================================
// 8. ПРОФИЛЬ КЛАНА (/clan), КОМАНДЫ (/teams), ТАБЛИЦА ЛИДЕРОВ (/leaderboard)
// ============================================================================
window.viewClanProfile = (clanId) => { viewedClanId = clanId || null; window.goRoute("/clan"); };
window.toggleFlipMemberCard = (cardEl) => { if (cardEl) cardEl.classList.toggle("is-flipped"); };


// ============================================================================
// V20: СИСТЕМА УВЕДОМЛЕНИЙ, ОБЩИЙ/ЛИЧНЫЙ ЧАТ И ЗАЯВКИ В КЛАНЫ
// ============================================================================
function pushUserNotification(targetUid, title, text, type = "info", meta = {}) {
  if (!targetUid) return;
  const nObj = {
    id: "NTF_" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5),
    toUid: targetUid,
    targetUid,
    fromUid: auth.currentUser ? auth.currentUser.uid : (currentUser ? currentUser.uid : "system"),
    title: String(title || "").slice(0, 120),
    text: String(text || "").slice(0, 260),
    type, // "info" | "dm" | "clan_app" | "clan_invite"
    meta: meta || {},
    read: false,
    ts: Date.now(),
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };
  cloudNotifications.unshift(nObj);
  if (cloudNotifications.length > 120) cloudNotifications.length = 120;
  if (auth.currentUser) {
    setDoc(doc(db, "notifications", nObj.id), nObj).catch(() => {});
  }
}

function updateNotificationsBadgeUI() {
  const badge = document.getElementById("top-notif-badge");
  const bellBtn = document.getElementById("top-notif-btn");
  const chatBtn = document.getElementById("top-chat-btn");
  if (bellBtn) bellBtn.style.display = currentUser ? "inline-flex" : "none";
  if (chatBtn) chatBtn.style.display = currentUser ? "inline-flex" : "none";
  if (!badge || !currentUser) return;
  const unread = cloudNotifications.filter(n => n.targetUid === currentUser.uid && !n.read).length;
  badge.innerText = unread > 9 ? "9+" : String(unread);
  badge.classList.toggle("has-unread", unread > 0);
}

function renderNotificationsListModal() {
  const box = document.getElementById("glass-notif-list");
  if (!box || !currentUser) return;
  const mine = cloudNotifications.filter(n => n.targetUid === currentUser.uid);
  if (mine.length === 0) {
    box.innerHTML = `<div class="glass-subcard" style="text-align:center; padding:22px; font-size:12px; color:var(--white-dim);">Уведомлений пока нет.</div>`;
    return;
  }
  box.innerHTML = mine.slice(0, 30).map(n => `
    <div class="notif-item-card ${n.read ? '' : 'unread'}">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px;">
        <b style="color:var(--accent-soft); font-family:var(--font-display); font-size:10.5px;">${escapeHTML(n.title)}</b>
        <span style="font-size:10px; color:var(--white-dim);">${escapeHTML(n.time)}</span>
      </div>
      <div style="color:#ffffff;">${escapeHTML(n.text)}</div>
      ${n.type === "clan_invite" && n.meta?.clanId && !currentUser.clanId ? `
        <div style="display:flex; gap:7px; margin-top:8px;">
          <button type="button" class="auth-submit-btn" style="width:auto; padding:6px 12px; font-size:9.5px;" onclick="window.respondClanInvite('${n.meta.clanId}', true, '${n.id}')">✓ Вступить в клан</button>
          <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:6px 11px; font-size:9.5px; color:#fb7185;" onclick="window.respondClanInvite('${n.meta.clanId}', false, '${n.id}')">Отклонить</button>
        </div>
      ` : ''}
      ${n.type === "dm" && n.meta?.fromUid ? `
        <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 10px; font-size:9.5px; margin-top:7px;" onclick="window.openDirectChatWith('${n.meta.fromUid}')">Ответить в ЛС →</button>
      ` : ''}
      ${n.type === "clan_app" ? `
        <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 10px; font-size:9.5px; margin-top:7px;" onclick="window.closeNotificationsModal(); window.viewClanProfile(null);">Открыть заявки клана →</button>
      ` : ''}
    </div>
  `).join("");
}

window.toggleNotificationsModal = (ev) => {
  if (ev) ev.stopPropagation();
  if (!currentUser) return window.goRoute("/authorization");
  const bd = document.getElementById("glass-notif-backdrop");
  if (!bd) return;
  renderNotificationsListModal();
  const willOpen = !bd.classList.contains("open");
  bd.classList.toggle("open");
  if (willOpen && currentUser && auth.currentUser) {
    // Automatically mark non-invite informational notifications as read in Firestore when viewed
    const toMark = cloudNotifications.filter(n => (n.targetUid === currentUser.uid || n.toUid === currentUser.uid) && !n.read && n.type !== "clan_invite");
    if (toMark.length > 0) {
      toMark.forEach(n => { n.read = true; });
      updateNotificationsBadgeUI();
      const batch = writeBatch(db);
      toMark.forEach(n => batch.set(doc(db, "notifications", n.id), { read: true }, { merge: true }));
      batch.commit().catch(() => {});
    }
  }
};

window.closeNotificationsModal = () => {
  const bd = document.getElementById("glass-notif-backdrop");
  if (bd) bd.classList.remove("open");
};

window.markAllNotificationsRead = async () => {
  if (!currentUser || !auth.currentUser) return;
  const unread = cloudNotifications.filter(n => (n.targetUid === currentUser.uid || n.toUid === currentUser.uid) && !n.read);
  unread.forEach(n => { n.read = true; });
  updateNotificationsBadgeUI();
  renderNotificationsListModal();
  if (unread.length === 0) return;
  try {
    const batch = writeBatch(db);
    unread.forEach(n => {
      batch.set(doc(db, "notifications", n.id), { read: true }, { merge: true });
    });
    await batch.commit();
  } catch (e) {
    for (const n of unread) {
      setDoc(doc(db, "notifications", n.id), { read: true }, { merge: true }).catch(() => {});
    }
  }
};

// --- ЗАЯВКИ В КЛАНЫ И ПРИГЛАШЕНИЯ (ТОЛЬКО КАПИТАН КЛАНА) ---
window.toggleClanRecruitmentOpen = () => {
  const myClan = getPlayerClan(currentUser);
  if (!myClan || myClan.leaderUid !== currentUser.uid) return window.showMirrorToast("Открывать и закрывать заявки может только Капитан клана!", true);
  myClan.applicationsOpen = !myClan.applicationsOpen;
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(myClan.applicationsOpen ? "Набор в клан ОТКРЫТ! Клан виден в поиске открытых заявок." : "Набор в клан ЗАКРЫТ.");
};

window.saveClanRecruitmentCriteria = (e) => {
  e.preventDefault();
  const myClan = getPlayerClan(currentUser);
  if (!myClan || myClan.leaderUid !== currentUser.uid) return window.showMirrorToast("Менять критерии набора может только Капитан клана!", true);
  const txt = (document.getElementById("clan-criteria-input")?.value || "").trim();
  myClan.recruitmentCriteria = txt;
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast("Описание и критерии набора сохранены!");
};

window.applyToJoinClan = (clanId) => {
  if (!currentUser || !auth.currentUser) return window.goRoute("/authorization");
  if (currentUser.accountType === "organizer") return window.showMirrorToast("Организаторы не вступают в кланы как игроки!", true);
  if (getPlayerClan(currentUser)) return window.showMirrorToast("Вы уже состоите в клане!", true);
  const clan = cloudClans.find(c => c.id === clanId);
  if (!clan || !clan.applicationsOpen) return window.showMirrorToast("Набор в этот клан закрыт!", true);
  if ((clan.members || []).length >= 7) return window.showMirrorToast("Состав клана уже заполнен (7/7)!", true);
  if ((clan.applications || []).some(a => a.uid === currentUser.uid)) return window.showMirrorToast("Вы уже подали заявку в этот клан!");

  openSiteGlassModal(
    `ЗАЯВКА В КЛАН [${escapeHTML(clan.tag)}] ${escapeHTML(clan.name)}`,
    `
      <form onsubmit="window.submitClanApplicationModal(event, '${clan.id}')" style="display:flex; flex-direction:column; gap:10px;">
        <div style="font-size:11.5px; color:var(--white-soft);">Напишите капитану пару слов о себе (роль, опыт, прайм-тайм):</div>
        <textarea id="clan-apply-msg-inp" class="auth-input" rows="3" style="padding:10px 12px;" required>${escapeHTML(currentUser.playRole || "Рифлер")}, готов к тренировкам и турнирам</textarea>
        <button type="submit" class="auth-submit-btn">ОТПРАВИТЬ ЗАЯВКУ КАПИТАНУ</button>
      </form>
    `
  );
};

window.decideClanApplication = async (clanId, appUid, accept) => {
  const clan = cloudClans.find(c => c.id === clanId);
  if (!clan || !currentUser || clan.leaderUid !== currentUser.uid) return window.showMirrorToast("Принимать и отклонять заявки может только Капитан!", true);
  const app = (clan.applications || []).find(a => a.uid === appUid);
  if (!app) return;

  const appDocId = app.id || `${clan.id}_${appUid}`;
  try { await deleteDoc(doc(db, "clan_applications", appDocId)); } catch (e) {}
  clan.applications = (clan.applications || []).filter(a => a.uid !== appUid);

  if (accept) {
    if ((clan.members || []).length >= 7) return window.showMirrorToast("Состав клана уже полон (7/7)!", true);
    if (!(clan.members || []).some(m => m.uid === app.uid)) {
      clan.members.push({ uid: app.uid, nick: app.nick, so2Id: app.so2Id || "—", role: app.role || "Игрок основы" });
    }
    const targetU = cloudUsers.find(u => u.uid === appUid);
    if (targetU) targetU.clanId = clan.id;
    pushUserNotification(appUid, `Заявка принята!`, `Капитан принял вас в клан [${clan.tag}] ${clan.name}. Добро пожаловать в состав!`, "info");
    window.showMirrorToast(`Игрок ${app.nick} принят в клан [${clan.tag}]!`);
  } else {
    pushUserNotification(appUid, `Заявка отклонена`, `Клан [${clan.tag}] ${clan.name} отклонил вашу заявку на вступление.`, "info");
    window.showMirrorToast(`Заявка игрока ${app.nick} отклонена.`);
  }
  syncArenaDataToCloud();
  renderAllStageSections();
};

window.sendClanInviteToPlayer = async (e) => {
  e.preventDefault();
  const myClan = getPlayerClan(currentUser);
  if (!myClan || myClan.leaderUid !== currentUser.uid) return window.showMirrorToast("Приглашать в клан может только Капитан!", true);
  if ((myClan.members || []).length >= 7) return window.showMirrorToast("Состав клана уже полон (7/7)!", true);

  const nickQ = (document.getElementById("clan-invite-nick-inp")?.value || "").trim().toLowerCase();
  const targetU = cloudUsers.find(u => u.uid !== currentUser.uid && u.accountType !== "organizer" && (String(u.nick || "").toLowerCase() === nickQ || String(u.so2Id || "").toLowerCase() === nickQ));
  if (!targetU) return window.showMirrorToast("Игрок с таким ником или SO2 ID не найден!", true);
  if (getPlayerClan(targetU)) return window.showMirrorToast("Этот игрок уже состоит в клане!", true);

  const invId = `${myClan.id}_${targetU.uid}`;
  const invDoc = {
    id: invId,
    clanId: myClan.id,
    leaderUid: currentUser.uid,
    toUid: targetU.uid,
    uid: targetU.uid,
    toNick: targetU.nick,
    toSo2Id: targetU.so2Id || "—",
    status: "pending",
    createdAt: new Date().toLocaleDateString()
  };
  try {
    await setDoc(doc(db, "clan_invites", invId), invDoc);
    pushUserNotification(targetU.uid, `Приглашение в клан [${myClan.tag}]`, `Капитан ${currentUser.nick} приглашает вас вступить в клан [${myClan.tag}] ${myClan.name}.`, "clan_invite", { clanId: myClan.id });
    if (document.getElementById("clan-invite-nick-inp")) document.getElementById("clan-invite-nick-inp").value = "";
    window.showMirrorToast(`Приглашение отправлено игроку ${targetU.nick}!`);
  } catch (err) {
    window.showMirrorToast("Ошибка отправки приглашения.", true);
  }
};

window.respondClanInvite = async (clanId, accept, notifId = null) => {
  if (!currentUser || !auth.currentUser) return;
  const clan = cloudClans.find(c => c.id === clanId);
  if (notifId) {
    const nf = cloudNotifications.find(n => n.id === notifId);
    if (nf) {
      nf.read = true;
      setDoc(doc(db, "notifications", notifId), { read: true }, { merge: true }).catch(() => {});
    }
  }
  if (!clan) return window.showMirrorToast("Клан больше не существует.", true);
  const invId = `${clan.id}_${auth.currentUser.uid}`;

  if (accept) {
    if (getPlayerClan(currentUser)) return window.showMirrorToast("Вы уже состоите в клане!", true);
    if ((clan.members || []).length >= 7) return window.showMirrorToast("Состав клана уже заполнен!", true);
    try { await setDoc(doc(db, "clan_invites", invId), { status: "accepted" }, { merge: true }); } catch (e) {}
    currentUser.clanId = clan.id;
    pushUserNotification(clan.leaderUid, `Игрок принял приглашение`, `${currentUser.nick} принял ваше приглашение в клан [${clan.tag}]!`, "info");
    window.showMirrorToast(`Вы вступили в клан [${clan.tag}] ${clan.name}!`);
    window.closeNotificationsModal();
  } else {
    try { await deleteDoc(doc(db, "clan_invites", invId)); } catch (e) {}
    pushUserNotification(clan.leaderUid, `Приглашение отклонено`, `${currentUser.nick} отклонил приглашение в [${clan.tag}].`, "info");
    window.showMirrorToast("Приглашение отклонено.");
  }
  saveCurrentUserEverywhere();
};

// --- ОБЩИЙ И ЛИЧНЫЙ ЧАТ (/chat) ---
window.setChatTabMode = (mode) => { activeChatMode = mode === "dm" ? "dm" : "global"; renderChatSection(); };

window.openDirectChatWith = (peerUid) => {
  if (!currentUser) return window.goRoute("/authorization");
  if (!peerUid || peerUid === currentUser.uid) return;
  window.closeNotificationsModal();
  activeChatMode = "dm";
  activeDmPeerUid = peerUid;
  window.goRoute("/chat");
};

window.startNewDmByNick = () => {
  openSiteGlassModal(
    "НОВОЕ ЛИЧНОЕ СООБЩЕНИЕ",
    `
      <form onsubmit="window.submitStartDmModal(event)" style="display:flex; flex-direction:column; gap:10px;">
        <div style="font-size:11.5px; color:var(--white-soft);">Введите ник или Standoff 2 ID игрока / организатора:</div>
        <input type="text" id="dm-start-nick-inp" class="auth-input" style="padding:10px 12px;" placeholder="Например: Kas" required>
        <button type="submit" class="auth-submit-btn">ОТКРЫТЬ ДИАЛОГ</button>
      </form>
    `
  );
};

window.sendGlobalChatMessage = async (e) => {
  e.preventDefault();
  if (!currentUser || !auth.currentUser) return window.goRoute("/authorization");
  const inp = document.getElementById("global-chat-inp");
  const text = (inp?.value || "").trim().slice(0, 300);
  if (!text) return;
  const now = Date.now();
  if (now - _lastGlobalChatAtMs < 3200) {
    const left = Math.ceil((3200 - (now - _lastGlobalChatAtMs)) / 1000);
    return window.showMirrorToast(`Антиспам: подождите ${left} сек.`, true);
  }
  const lower = text.toLowerCase();
  if (FORBIDDEN_PROFANITY.some(w => w !== "admin" && lower.includes(w))) {
    return window.showMirrorToast("Сообщение заблокировано фильтром нецензурной лексики.", true);
  }
  _lastGlobalChatAtMs = now;
  const clan = getPlayerClan(currentUser);
  const msgId = "GC_" + now.toString(36) + Math.random().toString(36).slice(2, 5);
  const msgPayload = {
    id: msgId,
    uid: auth.currentUser.uid,
    nick: currentUser.nick,
    avatar: currentUser.avatar,
    tag: clan ? clan.tag : "",
    isOrg: currentUser.accountType === "organizer",
    isAdmin: Boolean(currentUser.isAdmin),
    text,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    createdAt: serverTimestamp()
  };
  if (inp) inp.value = "";
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, "chat_rate", auth.currentUser.uid), { lastAt: serverTimestamp() });
    batch.set(doc(db, "chat_global", msgId), msgPayload);
    await batch.commit();
  } catch (err) {
    window.showMirrorToast("Слишком частая отправка — серверный антиспам (1 сообщ. / 3 сек).", true);
  }
};

window.sendDirectMessageSubmit = async (e) => {
  e.preventDefault();
  if (!currentUser || !auth.currentUser || !activeDmPeerUid) return;
  const inp = document.getElementById("dm-chat-inp");
  const text = (inp?.value || "").trim().slice(0, 500);
  if (!text) return;
  const now = Date.now();
  if (now - _lastDmAtMs < 2000) {
    return window.showMirrorToast("Антиспам: подождите 2 сек. перед отправкой.", true);
  }
  _lastDmAtMs = now;
  const dmId = "DM_" + now.toString(36) + Math.random().toString(36).slice(2, 5);
  const dmPayload = {
    id: dmId,
    fromUid: auth.currentUser.uid,
    toUid: activeDmPeerUid,
    text,
    ts: now,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };
  if (inp) inp.value = "";
  try {
    await setDoc(doc(db, "direct_messages", dmId), dmPayload);
    pushUserNotification(activeDmPeerUid, `Личное сообщение от ${currentUser.nick}`, text.slice(0, 90), "dm", { fromUid: auth.currentUser.uid });
  } catch (err) {
    window.showMirrorToast("Не удалось отправить сообщение. Проверьте вход в аккаунт.", true);
  }
};

function renderChatSection() {
  const root = document.getElementById("chat-stage-root");
  if (!root || !currentUser) return;

  // Список собеседников в ЛС
  const peerIds = new Set();
  if (activeDmPeerUid) peerIds.add(activeDmPeerUid);
  cloudDirectMessages.forEach(m => {
    if (m.fromUid === currentUser.uid) peerIds.add(m.toUid);
    if (m.toUid === currentUser.uid) peerIds.add(m.fromUid);
  });
  const dmPeers = [...peerIds].map(uid => cloudUsers.find(u => u.uid === uid)).filter(Boolean);
  const activePeer = dmPeers.find(u => u.uid === activeDmPeerUid) || dmPeers[0] || null;
  if (activePeer && !activeDmPeerUid) activeDmPeerUid = activePeer.uid;

  const dmThread = activePeer
    ? cloudDirectMessages.filter(m => (m.fromUid === currentUser.uid && m.toUid === activePeer.uid) || (m.fromUid === activePeer.uid && m.toUid === currentUser.uid))
    : [];

  root.innerHTML = `
    <div class="mirror-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div>
          <span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> COMMUNICATION HUB</span>
          <h2 style="font-family:var(--font-display); font-size:22px; font-weight:900; margin-top:8px;">ЧАТ ПЛАТФОРМЫ</h2>
        </div>
        <div class="filter-pills-row">
          <button type="button" class="filter-pill-btn ${activeChatMode === 'global' ? 'active' : ''}" onclick="window.setChatTabMode('global')">Общий чат</button>
          <button type="button" class="filter-pill-btn ${activeChatMode === 'dm' ? 'active' : ''}" onclick="window.setChatTabMode('dm')">Личные сообщения (${dmPeers.length})</button>
        </div>
      </div>

      ${activeChatMode === "global" ? `
        <div class="chat-feed-window">
          ${cloudGlobalChat.length === 0 ? `<div style="margin:auto; font-size:12px; color:var(--white-dim);">Общий чат пуст. Напишите первое сообщение!</div>` : cloudGlobalChat.map(m => {
            const mine = m.uid === currentUser.uid;
            return `
              <div class="chat-bubble ${mine ? 'is-mine' : ''}">
                <div style="display:flex; align-items:center; gap:7px; margin-bottom:3px; font-size:10.5px;">
                  <img src="${escapeHTML(m.avatar)}" style="width:18px; height:18px; border-radius:50%; object-fit:cover; cursor:pointer;" onclick="window.viewPlayerProfile('${m.uid}')">
                  <b style="color:${m.isAdmin ? '#fde047' : 'var(--accent-soft)'}; cursor:pointer;" onclick="window.viewPlayerProfile('${m.uid}')">${m.tag ? `[${escapeHTML(m.tag)}] ` : ''}${escapeHTML(m.nick)}${renderUserBadgesHTML(cloudUsers.find(x => x.uid === m.uid))}</b>
                  <span style="color:var(--white-dim); font-size:9.5px;">${escapeHTML(m.time)}</span>
                </div>
                <div style="color:#ffffff;">${escapeHTML(m.text)}</div>
              </div>
            `;
          }).join("")}
        </div>
        <form onsubmit="window.sendGlobalChatMessage(event)" class="mr-chat-form">
          <input type="text" id="global-chat-inp" class="auth-input" style="padding:10px 14px;" placeholder="Написать в общий чат..." required>
          <button type="submit" class="auth-submit-btn" style="width:auto; padding:10px 20px;">Отправить</button>
        </form>
      ` : `
        <div class="chat-shell-layout dm-mode">
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button type="button" class="auth-submit-btn" style="padding:9px 14px; font-size:10px;" onclick="window.startNewDmByNick()">+ Новый диалог по нику</button>
            ${dmPeers.length === 0 ? `<div class="glass-subcard" style="font-size:11.5px; color:var(--white-dim); text-align:center;">Диалогов пока нет.</div>` : dmPeers.map(p => `
              <div class="chat-peer-item ${activePeer && p.uid === activePeer.uid ? 'active' : ''}" onclick="window.openDirectChatWith('${p.uid}')">
                <img src="${escapeHTML(p.avatar)}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; border:1px solid var(--accent-bright);">
                <div style="min-width:0;">
                  <div style="font-size:12px; font-weight:800; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(p.nick)}</div>
                  <div style="font-size:10px; color:var(--white-dim);">${p.accountType === 'organizer' ? 'Организатор' : 'Игрок'}</div>
                </div>
              </div>
            `).join("")}
          </div>

          <div>
            ${activePeer ? `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-radius:12px; background:var(--glass-subcard); border:1px solid var(--edge-light); margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="window.viewPlayerProfile('${activePeer.uid}')">
                  <img src="${escapeHTML(activePeer.avatar)}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                  <b>${escapeHTML(activePeer.nick)}</b>
                </div>
                <span class="glass-pill-badge">ЛИЧНЫЙ ЧАТ</span>
              </div>
              <div class="chat-feed-window" style="height:320px;">
                ${dmThread.length === 0 ? `<div style="margin:auto; font-size:12px; color:var(--white-dim);">Начните переписку с ${escapeHTML(activePeer.nick)}.</div>` : dmThread.map(m => `
                  <div class="chat-bubble ${m.fromUid === currentUser.uid ? 'is-mine' : ''}">
                    <div style="color:#ffffff;">${escapeHTML(m.text)}</div>
                    <div style="font-size:9px; color:var(--white-dim); margin-top:3px; text-align:right;">${escapeHTML(m.time)}</div>
                  </div>
                `).join("")}
              </div>
              <form onsubmit="window.sendDirectMessageSubmit(event)" class="mr-chat-form">
                <input type="text" id="dm-chat-inp" class="auth-input" style="padding:10px 14px;" placeholder="Написать ${escapeHTML(activePeer.nick)}..." required>
                <button type="submit" class="auth-submit-btn" style="width:auto; padding:10px 20px;">Отправить</button>
              </form>
            ` : `<div class="glass-subcard" style="text-align:center; padding:34px; font-size:12.5px; color:var(--white-dim);">Выберите диалог слева или нажмите «+ Новый диалог по нику».</div>`}
          </div>
        </div>
      `}
    </div>
  `;
}

window.setTeamsFilterMode = (mode) => {
  teamsFilterMode = mode;
  renderTeamsSearchSection();
};

function renderClanProfileSection() {
  const root = document.getElementById("clan-stage-root");
  if (!root) return;
  const myClan = currentUser ? getPlayerClan(currentUser) : null;
  const targetClan = viewedClanId ? (cloudClans.find(c => c.id === viewedClanId) || myClan) : myClan;
  const isMyClan = Boolean(targetClan && myClan && targetClan.id === myClan.id);

  if (!targetClan) {
    root.innerHTML = `<div class="mirror-card"><span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> STANDOFF 2 // КЛАН</span><h2 style="font-family:var(--font-display); font-size:22px; font-weight:900; margin:8px 0 16px 0;">СОЗДАНИЕ ПРОФИЛЯ КЛАНА</h2><form onsubmit="window.createNewClanProfile(event)" class="glass-subcard" style="padding:20px;"><div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid var(--edge-light);"><div class="so2-avatar-stage esports-avatar-frame" onclick="window.triggerPhoneClanAvatarUpload()" style="width:74px; height:74px;"><img id="clan-logo-form-preview" src="https://api.dicebear.com/7.x/shapes/svg?seed=C6EClan" alt="Preview"><div class="so2-avatar-upload-badge"><i class="fas fa-camera"></i></div></div><div><div style="font-family:var(--font-display); font-weight:800; font-size:13px;">ЛОГОТИП КЛАНА</div><div style="font-size:11.5px; color:var(--white-soft); margin:4px 0 8px 0;">Загрузите логотип команды с устройства</div><button type="button" class="social-auth-btn" style="padding:8px 14px; font-size:10px;" onclick="window.triggerPhoneClanAvatarUpload()"><i class="fas fa-upload" style="color:var(--accent-soft);"></i> Выбрать фото</button></div></div><div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:12px;"><div class="auth-form-group"><label class="auth-label">Название Клана</label><input type="text" id="new-clan-name" class="auth-input" style="padding-left:14px;" placeholder="CYBER 6 ESPORTS" required></div><div class="auth-form-group"><label class="auth-label">Тег Клана</label><input type="text" id="new-clan-tag" class="auth-input" style="padding-left:14px;" maxlength="5" placeholder="C6E" required></div></div><button type="submit" class="auth-submit-btn" style="margin-top:6px;">СОЗДАТЬ ПРОФИЛЬ КЛАНА</button></form></div>`;
    return;
  }

  const cKd = parseFloat(targetClan.kd || "0") || 0;
  const cWr = (targetClan.matches || 0) > 0 ? Math.round(((targetClan.wins || 0) / targetClan.matches) * 100) : 0;
  const cBannerStyle = targetClan.banner ? `background-image: url('${escapeHTML(targetClan.banner)}');` : "";

  root.innerHTML = `
    <div class="mirror-card">
      ${viewedClanId && (!myClan || viewedClanId !== myClan.id) ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:7px 14px; font-size:10px; margin-bottom:14px;" onclick="window.goRoute('/leaderboard')">← Назад к рейтингу</button>` : ''}
      <div class="so2-profile-banner" style="${cBannerStyle}; margin-bottom:18px;">
        ${isMyClan ? `<button type="button" class="banner-upload-chip" onclick="window.triggerPhoneClanBannerUpload()"><i class="fas fa-image" style="color:var(--accent-soft);"></i> Баннер клана</button>` : ''}
        <div style="display:flex; align-items:center; gap:18px; flex-wrap:wrap; margin-top:8px;">
          <div class="so2-avatar-stage esports-avatar-frame" ${isMyClan ? 'onclick="window.triggerPhoneClanAvatarUpload()"' : ''}><img src="${escapeHTML(targetClan.logo)}" alt="Clan Logo">${isMyClan ? `<div class="so2-avatar-upload-badge"><i class="fas fa-camera"></i></div>` : ''}</div>
          <div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:6px;"><span class="cp-badge-pill">${getCPEmblemSVG(14)} ${targetClan.cp || 0} CP</span><span class="glass-pill-badge" style="color:var(--emerald-bright);">● ROSTER READY</span></div>
            <h2 style="font-family:var(--font-display); font-size:24px; font-weight:900; color:#ffffff;"><span style="color:var(--accent-soft);">[${escapeHTML(targetClan.tag)}]</span> ${escapeHTML(targetClan.name)}${renderClanBadgeHTML(targetClan)}</h2>
            <div style="font-size:12px; color:var(--white-soft); margin-top:4px;">Лидер: <b>${escapeHTML(targetClan.leaderNick)}</b> • Состав: <b>${(targetClan.members || []).length} / 7</b></div>
          </div>
        </div>
      </div>

      <div class="tri-gauges-stage clan-gauges" style="margin-bottom:18px; padding-top:26px;">
        ${buildDynamicCircularGauge({
          id: "cl_kd_ratio", size: 122, strokeWidth: 8,
          pct: (targetClan.kills || 0) + (targetClan.deaths || 0) > 0 ? Math.round(((targetClan.kills || 0) / ((targetClan.kills || 0) + (targetClan.deaths || 0))) * 100) : 8,
          centerValue: `${targetClan.kills || 0} / ${targetClan.deaths || 0}`, centerSub: "K / D",
          label: "Убийства / Смерти", isPositive: (targetClan.kills || 0) >= (targetClan.deaths || 0) && (targetClan.kills || 0) > 0, elevated: false
        })}
        ${buildDynamicCircularGauge({
          id: "cl_kd_main", size: 148, strokeWidth: 9.5, pct: Math.max(8, Math.min(100, Math.round((cKd / 2.2) * 100))),
          centerValue: cKd.toFixed(2), centerSub: "TEAM K/D", label: "Командный K/D", isPositive: cKd >= 1.0, elevated: true
        })}
        ${buildDynamicCircularGauge({
          id: "cl_wr", size: 122, strokeWidth: 8, pct: Math.max(8, Math.min(100, cWr)),
          centerValue: `${cWr}%`, centerSub: `${targetClan.matches || 0} ИГР`, label: "Матчи и W/R", isPositive: cWr >= 50, elevated: false
        })}
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
        <div><div style="font-family:var(--font-display); font-size:12.5px; font-weight:900;">СОСТАВ КЛАНА [${escapeHTML(targetClan.tag)}] (${(targetClan.members || []).length} / 7)</div><div style="font-size:11px; color:var(--white-dim); margin-top:2px;">Листайте влево-вправо • Нажмите на карточку для статистики</div></div>
        ${isMyClan && targetClan.leaderUid === currentUser.uid ? `<span class="rbac-badge-chief"><i class="fas fa-crown"></i> ПРАВА КАПИТАНА</span>` : ''}
      </div>

      <div class="clan-roster-scroll">
        ${(targetClan.members || []).map(m => {
          const userMatch = cloudUsers.find(u => u.uid === m.uid || String(u.nick).toLowerCase() === String(m.nick).toLowerCase());
          const avatarUrl = (userMatch && userMatch.avatar) || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(m.nick)}&backgroundColor=9a3412`;
          const mst = (userMatch && userMatch.stats) || { kd: "0.00", kills: 0, deaths: 0, matchesPlayed: 0, wins: 0 };
          const mWr = mst.matchesPlayed > 0 ? Math.round((mst.wins / mst.matchesPlayed) * 100) : 0;
          return `<div class="flip-member-scene" onclick="window.toggleFlipMemberCard(this.firstElementChild)"><div class="flip-member-card"><div class="flip-face flip-face-front" style="background-image:url('${escapeHTML(avatarUrl)}');"><span class="glass-pill-badge" style="position:absolute; top:10px; left:10px; font-size:8px; padding:3px 8px;">${escapeHTML(m.role || 'Игрок')}</span><div style="font-family:var(--font-display); font-size:15px; font-weight:900;"><span style="color:var(--accent-soft);">[${escapeHTML(targetClan.tag)}]</span> ${escapeHTML(m.nick)}</div><div style="font-size:10.5px; color:var(--white-dim); margin-top:3px;">Нажмите для статистики ↻</div></div><div class="flip-face flip-face-back"><div><div style="font-family:var(--font-display); font-size:12px; font-weight:900;">${escapeHTML(m.nick)}</div><div style="font-size:10px; color:var(--accent-soft);">${escapeHTML(m.role || 'Состав')}</div><div class="flip-mini-grid"><div class="flip-mini-cell"><div style="font-size:8.5px; color:var(--white-dim);">K/D</div><div style="font-size:15px; font-weight:900;">${escapeHTML(mst.kd || '0.00')}</div></div><div class="flip-mini-cell"><div style="font-size:8.5px; color:var(--white-dim);">WIN RATE</div><div style="font-size:15px; font-weight:900; color:var(--emerald-bright);">${mWr}%</div></div><div class="flip-mini-cell"><div style="font-size:8.5px; color:var(--white-dim);">УБИЙСТВА</div><div style="font-size:15px; font-weight:900;">${mst.kills || 0}</div></div><div class="flip-mini-cell"><div style="font-size:8.5px; color:var(--white-dim);">СМЕРТИ</div><div style="font-size:15px; font-weight:900; color:var(--accent-soft);">${mst.deaths || 0}</div></div></div></div><div style="font-size:10px; text-align:center; color:var(--white-dim);">Нажмите, чтобы вернуть ↺</div></div></div></div>`;
        }).join("")}
      </div>

      <!-- ЗАЯВКИ НА ВСТУПЛЕНИЕ, КРИТЕРИИ И ПРИГЛАШЕНИЯ (УПРАВЛЯЕТ ТОЛЬКО КАПИТАН) -->
      <div style="margin-top:18px; padding-top:16px; border-top:1px solid var(--edge-light);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
          <div style="font-family:var(--font-display); font-size:12px; font-weight:900; color:#ffffff;">
            НАБОР В КЛАН: <span style="color:${targetClan.applicationsOpen ? '#86efac' : '#fb7185'};">${targetClan.applicationsOpen ? 'ОТКРЫТ' : 'ЗАКРЫТ'}</span>
          </div>
          ${isMyClan && targetClan.leaderUid === currentUser.uid ? `
            <button type="button" class="${targetClan.applicationsOpen ? 'social-auth-btn' : 'auth-submit-btn'}" style="width:auto; flex:0 0 auto; padding:7px 14px; font-size:10px;" onclick="window.toggleClanRecruitmentOpen()">
              ${targetClan.applicationsOpen ? 'Закрыть заявки' : '✓ Открыть заявки в клан'}
            </button>
          ` : (!currentUser.clanId && targetClan.applicationsOpen && currentUser.accountType !== 'organizer' ? `
            <button type="button" class="auth-submit-btn" style="width:auto; padding:8px 18px; font-size:10.5px;" onclick="window.applyToJoinClan('${targetClan.id}')">
              Подать заявку на вступление
            </button>
          ` : '')}
        </div>

        ${targetClan.recruitmentCriteria ? `<div class="clan-criteria-box" style="margin-bottom:12px;"><b style="color:var(--accent-soft);">Критерии набора:</b> ${escapeHTML(targetClan.recruitmentCriteria)}</div>` : ''}

        ${isMyClan && targetClan.leaderUid === currentUser.uid ? `
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-top:10px;">
            <form onsubmit="window.saveClanRecruitmentCriteria(event)" class="glass-subcard">
              <div style="font-family:var(--font-display); font-size:10.5px; color:var(--accent-soft); font-weight:800; margin-bottom:6px;">ОПИСАНИЕ И КРИТЕРИИ НАБОРА</div>
              <textarea id="clan-criteria-input" class="auth-input" rows="2" style="padding:9px 11px; margin-bottom:8px;" placeholder="Например: от 1.20 K/D, 120 FPS, от 15 лет, актив на турнирах...">${escapeHTML(targetClan.recruitmentCriteria || '')}</textarea>
              <button type="submit" class="social-auth-btn" style="width:100%; padding:8px;">Сохранить критерии</button>
            </form>

            <form onsubmit="window.sendClanInviteToPlayer(event)" class="glass-subcard">
              <div style="font-family:var(--font-display); font-size:10.5px; color:var(--accent-soft); font-weight:800; margin-bottom:6px;">ПРИГЛАСИТЬ ИГРОКА В КЛАН</div>
              <input type="text" id="clan-invite-nick-inp" class="auth-input" style="padding:9px 12px; margin-bottom:8px;" placeholder="Введите ник игрока..." required>
              <button type="submit" class="auth-submit-btn" style="padding:8px;">Отправить приглашение</button>
            </form>
          </div>

          <div class="glass-subcard" style="margin-top:12px;">
            <div style="font-family:var(--font-display); font-size:11px; color:var(--accent-soft); font-weight:800; margin-bottom:8px;">
              ВХОДЯЩИЕ ЗАЯВКИ В КЛАН (${(targetClan.applications || []).length})
            </div>
            ${(targetClan.applications || []).length === 0 ? `<div style="font-size:12px; color:var(--white-dim);">Новых заявок от игроков пока нет.</div>` : `
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${(targetClan.applications || []).map(a => `
                  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:9px 11px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid var(--edge-light);">
                    <div style="display:flex; align-items:center; gap:9px; cursor:pointer;" onclick="window.viewPlayerProfile('${a.uid}')">
                      <img src="${escapeHTML(a.avatar)}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                      <div>
                        <div style="font-size:12px; font-weight:800; color:#fff;">${escapeHTML(a.nick)} <span style="color:var(--accent-soft); font-size:10.5px;">(K/D ${escapeHTML(a.kd)})</span></div>
                        <div style="font-size:11px; color:var(--white-dim);">${escapeHTML(a.message)}</div>
                      </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                      <button type="button" class="auth-submit-btn" style="width:auto; padding:6px 12px; font-size:9.5px;" onclick="window.decideClanApplication('${targetClan.id}', '${a.uid}', true)">✓ Принять</button>
                      <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:6px 10px; font-size:9.5px; color:#fb7185;" onclick="window.decideClanApplication('${targetClan.id}', '${a.uid}', false)">✕ Отказать</button>
                    </div>
                  </div>
                `).join("")}
              </div>
            `}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

window.addClanRosterMemberModal = () => {
  if (!currentUser) return window.goRoute("/authorization");
  const myClan = getPlayerClan(currentUser);
  if (!myClan || (myClan.members || []).length >= 7) return window.showMirrorToast("Состав клана укомплектован (7/7)!", true);
  const nick = prompt("Введите игровой ник бойца (латиницей):");
  if (!nick || !nick.trim()) return;
  const so2Id = prompt("Введите Standoff 2 ID бойца:", "73910482") || "—";
  const role = prompt("Роль в команде:", "Рифлер") || "Игрок основы";
  myClan.members.push({ uid: "MBR_" + Date.now().toString(36).toUpperCase(), nick: nick.trim(), so2Id: so2Id.trim(), role: role.trim() });
  saveCurrentUserEverywhere();
};

window.createNewClanProfile = async (e) => {
  e.preventDefault();
  if (!currentUser || !auth.currentUser) return window.goRoute("/authorization");
  if (getPlayerClan(currentUser)) return window.showMirrorToast("Вы уже состоите в клане!", true);
  const name = (document.getElementById("new-clan-name")?.value || "").trim();
  const tag = (document.getElementById("new-clan-tag")?.value || "").replace(/[\[\]]/g, "").trim().toUpperCase();
  if (!name || name.length < 2 || !tag || tag.length < 2 || tag.length > 8 || containsProfanity(name) || containsProfanity(tag)) {
    return window.showMirrorToast("Проверьте название (от 2 симв.) и тег клана (2–8 симв.)!", true);
  }
  if (cloudClans.some(c => String(c.tag || "").trim().toLowerCase() === tag.toLowerCase())) {
    return window.showMirrorToast(`Клан с тегом [${tag}] уже существует! Выберите другой тег.`, true);
  }
  if (cloudClans.some(c => String(c.name || "").trim().toLowerCase() === name.toLowerCase())) {
    return window.showMirrorToast(`Клан с названием «${name}» уже существует!`, true);
  }
  const newClan = {
    id: "CLAN_" + Date.now().toString(36).toUpperCase(), name, tag,
    logo: window._pendingClanLogoDataUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(tag)}`,
    banner: "", leaderUid: auth.currentUser.uid, leaderNick: currentUser.nick,
    cp: 0, kd: "0.00", matches: 0, wins: 0, losses: 0, kills: 0, deaths: 0, impact: 0,
    applicationsOpen: false, recruitmentCriteria: "",
    members: [{ uid: auth.currentUser.uid, nick: currentUser.nick, so2Id: currentUser.so2Id || "—", role: "Капитан (IGL)" }],
    matchHistory: []
  };
  try {
    await setDoc(doc(db, "clans", newClan.id), newClan);
    currentUser = normalizeSafeUserObj({ ...currentUser, clanId: newClan.id }, auth.currentUser);
    const userPayload = currentUser.isAdmin ? _cleanForFirestore(currentUser) : _stripProtectedUserFields(currentUser);
    await setDoc(doc(db, "users", auth.currentUser.uid), userPayload, { merge: true });
    cloudClans.push(newClan);
    currentUser.clanId = newClan.id;
    viewedClanId = null;
    try { localStorage.setItem("c6e_active_user_v29", JSON.stringify(currentUser)); } catch (err) {}
    updateTopRightPlayerUI();
    renderAllStageSections();
    window.showMirrorToast(`Клан [${tag}] ${name} создан и сохранён!`);
  } catch (err) {
    window.showMirrorToast("Ошибка сохранения клана в базу. Проверьте подключение.", true);
  }
};

window.setLeaderboardTab = (tab) => { leaderboardTab = tab === "clans" ? "clans" : "players"; renderLeaderboardSection(); };

function renderLeaderboardSection() {
  const root = document.getElementById("leaderboard-stage-root");
  if (!root) return;
  const playersOnly = cloudUsers.filter(u => u.accountType !== "organizer");
  const sortedPlayers = [...playersOnly].sort((a, b) => (b.cp || 0) - (a.cp || 0) || (parseFloat(b.stats?.kd || 0) - parseFloat(a.stats?.kd || 0)));
  const sortedClans = [...cloudClans].sort((a, b) => (b.cp || 0) - (a.cp || 0) || (parseFloat(b.kd || 0) - parseFloat(a.kd || 0)));
  const buildRankBadge = (idx) => { const p = idx + 1; return `<div class="lb-rank-badge ${p <= 3 ? 'rank-' + p : ''}"><span>${p < 10 ? '0' + p : p}</span></div>`; };

  root.innerHTML = `
    <div class="mirror-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div><span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> CYBER POINTS // RANKING</span><h2 style="font-family:var(--font-display); font-size:22px; font-weight:900; margin-top:8px;">ТАБЛИЦА ЛИДЕРОВ</h2></div>
        <div class="filter-pills-row">
          <button type="button" class="filter-pill-btn ${leaderboardTab === 'players' ? 'active' : ''}" onclick="window.setLeaderboardTab('players')">Рейтинг игроков (${sortedPlayers.length})</button>
          <button type="button" class="filter-pill-btn ${leaderboardTab === 'clans' ? 'active' : ''}" onclick="window.setLeaderboardTab('clans')">Рейтинг команд (${sortedClans.length})</button>
        </div>
      </div>

      <div class="glass-subcard" style="margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; padding:12px 15px;">
        <div style="font-size:11.5px; color:var(--white-soft); line-height:1.5;">
          <b style="color:var(--accent-soft);">Система Cyber Points (CP):</b>
          ${leaderboardTab === "players" ? `до <b>250 CP</b> за матч по табу (K/D &lt; 0.80 → 25 CP; 0.80–1.20 → 40–100 CP; от 1.25 и выше → 120–250 CP).` : `от <b>50+ CP</b> за победу по табу и <b>25 CP</b> за техническую победу.`}
        </div>
        <span class="cp-badge-pill">${getCPEmblemSVG(13)} LIVE CP RATING</span>
      </div>

      ${leaderboardTab === "players" ? `<div style="display:flex; flex-direction:column; gap:10px;">${sortedPlayers.map((u, idx) => { const c = getPlayerClan(u); const wr = u.stats?.matchesPlayed > 0 ? Math.round((u.stats.wins / u.stats.matchesPlayed) * 100) : 0; return `<div class="lb-row-card" onclick="window.viewPlayerProfile('${u.uid}')"><div style="display:flex; align-items:center; gap:14px;">${buildRankBadge(idx)}<img src="${escapeHTML(u.avatar)}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1.5px solid var(--accent-bright);"><div><div style="font-family:var(--font-display); font-size:13.5px; font-weight:900;">${escapeHTML(u.nick)}${renderUserBadgesHTML(u)}</div><div style="font-size:11px; color:var(--white-dim);">${c ? `[${escapeHTML(c.tag)}] ${escapeHTML(c.name)}` : 'Свободный агент'} • W/R ${wr}%</div></div></div><div style="display:flex; align-items:center; gap:8px;"><span class="glass-pill-badge">K/D ${escapeHTML(u.stats?.kd || '0.00')}</span><span class="cp-badge-pill">${getCPEmblemSVG(13)} ${u.cp || 0} CP</span></div></div>`; }).join("")}</div>` : (sortedClans.length === 0 ? `<div class="glass-subcard" style="text-align:center; padding:26px; font-size:12.5px; color:var(--white-dim);">Команды ещё не зарегистрированы (0).</div>` : `<div style="display:flex; flex-direction:column; gap:10px;">${sortedClans.map((c, idx) => { const wr = c.matches > 0 ? Math.round((c.wins / c.matches) * 100) : 0; return `<div class="lb-row-card" onclick="window.viewClanProfile('${c.id}')"><div style="display:flex; align-items:center; gap:14px;">${buildRankBadge(idx)}<img src="${escapeHTML(c.logo)}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1.5px solid var(--accent-bright);"><div><div style="font-family:var(--font-display); font-size:13.5px; font-weight:900;"><span style="color:var(--accent-soft);">[${escapeHTML(c.tag)}]</span> ${escapeHTML(c.name)}${renderClanBadgeHTML(c)}</div><div style="font-size:11px; color:var(--white-dim);">Бойцов: ${(c.members || []).length}/7 • W/R ${wr}%</div></div></div><div style="display:flex; align-items:center; gap:8px;"><span class="glass-pill-badge">K/D ${escapeHTML(c.kd || '0.00')}</span><span class="cp-badge-pill">${getCPEmblemSVG(13)} ${c.cp || 0} CP</span></div></div>`; }).join("")}</div>`)}
    </div>
  `;
}

window.onTeamSearchInput = (val) => { teamSearchQuery = val || ""; renderTeamsListOnly(); };
function renderTeamsListOnly() {
  const listRoot = document.getElementById("teams-search-results");
  if (!listRoot) return;
  const q = teamSearchQuery.trim().toLowerCase();
  const filtered = cloudClans.filter(c => {
    const matchText = !q || String(c.name || "").toLowerCase().includes(q) || String(c.tag || "").toLowerCase().includes(q);
    if (!matchText) return false;
    if (teamsFilterMode === "open") return Boolean(c.applicationsOpen);
    if (teamsFilterMode === "invites") return Boolean(currentUser && (c.invites || []).some(i => i.uid === currentUser.uid));
    return true;
  });

  if (filtered.length === 0) {
    listRoot.innerHTML = `<div class="glass-subcard" style="text-align:center; padding:26px; font-size:12.5px; color:var(--white-dim);">${teamsFilterMode === 'open' ? 'Кланов с открытыми заявками пока нет.' : (teamsFilterMode === 'invites' ? 'У вас нет активных приглашений в кланы.' : (q ? `По запросу «${escapeHTML(teamSearchQuery)}» кланы не найдены.` : 'Список кланов пока пуст.'))}</div>`;
    return;
  }

  listRoot.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px;">
      ${filtered.map(c => {
        const hasInvite = currentUser && (c.invites || []).some(i => i.uid === currentUser.uid);
        return `
          <div class="glass-subcard" style="display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; cursor:pointer;" onclick="window.viewClanProfile('${c.id}')">
              <div style="display:flex; align-items:center; gap:11px;">
                <img src="${escapeHTML(c.logo)}" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:1.5px solid var(--accent-bright);">
                <div>
                  <div style="font-family:var(--font-display); font-size:13px; font-weight:900;"><span style="color:var(--accent-soft);">[${escapeHTML(c.tag)}]</span> ${escapeHTML(c.name)}${renderClanBadgeHTML(c)}</div>
                  <div style="font-size:11px; color:var(--white-dim);">Бойцов: ${(c.members || []).length}/7 • K/D ${escapeHTML(c.kd || '0.00')} • ${c.cp || 0} CP</div>
                </div>
              </div>
              <span class="glass-pill-badge" style="color:${c.applicationsOpen ? '#86efac' : 'var(--white-dim)'}; font-size:8px;">${c.applicationsOpen ? '● ОТКРЫТ' : 'ЗАКРЫТ'}</span>
            </div>
            ${c.recruitmentCriteria ? `<div class="clan-criteria-box" style="margin-top:0;">${escapeHTML(c.recruitmentCriteria)}</div>` : ''}
            <div style="display:flex; gap:7px; flex-wrap:wrap;">
              ${hasInvite && !currentUser?.clanId ? `
                <button type="button" class="auth-submit-btn" style="flex:1; padding:8px; font-size:10px;" onclick="window.respondClanInvite('${c.id}', true)">✓ Принять приглашение</button>
                <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:8px 11px; font-size:10px; color:#fb7185;" onclick="window.respondClanInvite('${c.id}', false)">Отклонить</button>
              ` : (c.applicationsOpen && currentUser && !currentUser.clanId && currentUser.accountType !== 'organizer' ? `
                <button type="button" class="auth-submit-btn" style="flex:1; padding:8px; font-size:10px;" onclick="window.applyToJoinClan('${c.id}')">Подать заявку</button>
              ` : '')}
              <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:8px 12px; font-size:10px;" onclick="window.viewClanProfile('${c.id}')">Профиль →</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderTeamsSearchSection() {
  const root = document.getElementById("teams-stage-root");
  if (!root) return;
  const openCount = cloudClans.filter(c => c.applicationsOpen).length;
  const invCount = currentUser ? cloudClans.filter(c => (c.invites || []).some(i => i.uid === currentUser.uid)).length : 0;
  root.innerHTML = `
    <div class="mirror-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
        <div>
          <span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> STANDOFF 2 // CLANS</span>
          <h2 style="font-family:var(--font-display); font-size:22px; font-weight:900; margin-top:8px;">КОМАНДЫ И ПОИСК КЛАНОВ</h2>
        </div>
        ${currentUser?.accountType !== "organizer" ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:9px 16px; font-size:10.5px;" onclick="window.viewClanProfile(null)"><i class="fas fa-shield-alt" style="color:var(--accent-soft);"></i> Мой клан</button>` : ''}
      </div>

      <div class="filter-pills-row" style="margin-bottom:12px;">
        <button type="button" class="filter-pill-btn ${teamsFilterMode === 'all' ? 'active' : ''}" onclick="window.setTeamsFilterMode('all')">Все кланы (${cloudClans.length})</button>
        <button type="button" class="filter-pill-btn ${teamsFilterMode === 'open' ? 'active' : ''}" onclick="window.setTeamsFilterMode('open')">Открытые заявки (${openCount})</button>
        <button type="button" class="filter-pill-btn ${teamsFilterMode === 'invites' ? 'active' : ''}" onclick="window.setTeamsFilterMode('invites')">Приглашения мне (${invCount})</button>
      </div>

      <div class="auth-input-box" style="margin-bottom:16px;">
        <i class="fas fa-search auth-input-icon-left" style="color:var(--accent-soft);"></i>
        <input type="text" id="teams-strict-search-inp" class="auth-input" value="${escapeHTML(teamSearchQuery)}" oninput="window.onTeamSearchInput(this.value)" placeholder="Поиск строго по названию или тегу клана...">
      </div>
      <div id="teams-search-results"></div>
    </div>
  `;
  renderTeamsListOnly();
}

window.setMatchTabFilter = (tab) => { matchTabFilter = tab; renderMatchesSection(); };
function renderMatchesSection() {
  const root = document.getElementById("matches-stage-root");
  if (!root) return;
  const so2Maps = OFFICIAL_SO2_MAPS;
  const allTournamentMatches = [];
  cloudTournaments.forEach(t => {
    if (!t.bracketData) return;
    [...(t.bracketData.rounds || []), ...(t.bracketData.lowerRounds || [])].forEach(r => {
      r.forEach(m => {
        if (m.teamA && m.teamB) {
          allTournamentMatches.push({ ...m, tournamentId: t.id, tournamentName: t.name, format: t.format });
        }
      });
    });
  });

  const filteredM = allTournamentMatches.filter(m => {
    if (matchTabFilter === "live") return m.status === "live" || m.status === "disputed";
    if (matchTabFilter === "upcoming") return m.status === "pending";
    return m.status === "finished";
  });

  root.innerHTML = `
    <div class="mirror-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div>
          <span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> MATCH ROOMS // SO2</span>
          <h2 style="font-family:var(--font-display); font-size:22px; font-weight:900; margin-top:8px;">МАТЧИ И ЛОББИ (${allTournamentMatches.length})</h2>
        </div>
        <div class="filter-pills-row">
          <button type="button" class="filter-pill-btn ${matchTabFilter === 'live' ? 'active' : ''}" onclick="window.setMatchTabFilter('live')">LIVE (${allTournamentMatches.filter(x => x.status === 'live' || x.status === 'disputed').length})</button>
          <button type="button" class="filter-pill-btn ${matchTabFilter === 'upcoming' ? 'active' : ''}" onclick="window.setMatchTabFilter('upcoming')">Предстоящие (${allTournamentMatches.filter(x => x.status === 'pending').length})</button>
          <button type="button" class="filter-pill-btn ${matchTabFilter === 'finished' ? 'active' : ''}" onclick="window.setMatchTabFilter('finished')">Завершённые (${allTournamentMatches.filter(x => x.status === 'finished').length})</button>
        </div>
      </div>

      ${filteredM.length === 0 ? `
        <div class="glass-subcard" style="text-align:center; padding:26px; font-size:12.5px; color:var(--white-dim); margin-bottom:16px;">
          В этой категории матчей пока нет (0).
        </div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
          ${filteredM.map(m => `
            <div class="live-match-row" onclick="window.openTournamentDetails('${m.tournamentId}')">
              <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                <span class="glass-pill-badge">${escapeHTML(m.format)}</span>
                <img src="${escapeHTML(m.teamA.avatar)}" class="bracket-slot-avatar">
                <b style="font-size:12.5px;">${escapeHTML(m.teamA.name)}</b>
                <span style="font-family:var(--font-display); color:var(--accent-soft); font-weight:900;">${m.scoreA} : ${m.scoreB}</span>
                <b style="font-size:12.5px;">${escapeHTML(m.teamB.name)}</b>
                <img src="${escapeHTML(m.teamB.avatar)}" class="bracket-slot-avatar">
              </div>
              <div style="display:flex; align-items:center; gap:7px; flex-wrap:wrap;">
                <span class="glass-pill-badge">${escapeHTML(m.map || 'Sandstone')}</span>
                ${m.lobbyId ? `<span class="glass-pill-badge" onclick="window.copyLobbyId('${escapeHTML(m.lobbyId)}', event)"><i class="far fa-copy"></i> ID: ${escapeHTML(m.lobbyId)}</span>` : ''}
                ${m.status === 'disputed' ? `<span class="glass-pill-badge" style="color:#fb7185;">⚠ СПОР</span>` : ''}
              </div>
            </div>
          `).join("")}
        </div>
      `}

      <div class="glass-subcard">
        <div style="font-family:var(--font-display); font-size:11px; font-weight:800; color:var(--accent-soft); margin-bottom:8px;">ОФИЦИАЛЬНЫЙ ПУЛ КАРТ STANDOFF 2 (7 КАРТ)</div>
        <div class="so2-map-pool-grid">
          ${so2Maps.map(mp => `
            <div class="so2-map-banner-card" style="background-image:url('${getMapBannerUrl(mp)}');">
              <span class="so2-map-banner-name">${mp}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderScheduleSection() {
  const root = document.getElementById("schedule-stage-root");
  if (!root) return;
  root.innerHTML = `<div class="mirror-card"><div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px;"><div><span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> SCHEDULE</span><h2 style="font-family:var(--font-display); font-size:22px; font-weight:900; margin-top:8px;">РАСПИСАНИЕ ТУРНИРОВ</h2></div><span class="glass-pill-badge">ПОДТВЕРЖДЕНИЕ ЗА 30 МИН</span></div>${cloudTournaments.length === 0 ? `<div class="glass-subcard" style="text-align:center; padding:28px; font-size:12.5px; color:var(--white-dim);">Запланированных игр пока нет (0).</div>` : `<div style="display:flex; flex-direction:column; gap:10px;">${cloudTournaments.map(t => `<div class="glass-subcard" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="window.openTournamentDetails('${t.id}')"><div><div style="font-family:var(--font-display); font-size:13px; font-weight:900;">${escapeHTML(t.name)}</div><div style="font-size:11.5px; color:var(--white-dim);">${escapeHTML(t.orgName)} • ${escapeHTML(t.format)}</div></div><span class="glass-pill-badge">${escapeHTML(t.startDate)}</span></div>`).join("")}</div>`}</div>`;
}

// ============================================================================
// 9. АДМИНИСТРАЦИОННАЯ ПАНЕЛЬ ПЛАТФОРМЫ (/admin) + РЕГЛАМЕНТ + ПОДДЕРЖКА
// ============================================================================
window.setAdminPanelTab = (tab) => { adminPanelTab = tab; renderExtraSections(); };

let adminUserSearchQuery = "";

window.adminVerifyOrganizer = (uid, approve = true) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const org = cloudUsers.find(u => u.uid === uid);
  if (!org) return;
  org.organizerStatus = approve ? "verified" : "unverified";
  org.isVerifiedOrganizer = Boolean(approve);
  pushUserNotification(org.uid, approve ? "Организация верифицирована" : "Верификация снята", approve ? "Вы получили статус верифицированного организатора и можете создавать турниры." : "Статус верифицированного организатора был изменён администрацией.", "info");
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(approve ? `Организация «${org.orgName || org.nick}» верифицирована!` : `Верификация «${org.orgName || org.nick}» снята.`);
};

window.adminApproveIdChange = (uid) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const u = cloudUsers.find(x => x.uid === uid);
  if (!u) return;
  u.so2IdUpdatedAt = 0; u.so2IdChangeRequested = false;
  syncArenaDataToCloud(); renderAllStageSections();
  window.showMirrorToast(`Смена ID для ${u.nick} разблокирована!`);
};

window.submitAdminEditStatsModal = (e, uid) => {
  e.preventDefault();
  if (!currentUser || !currentUser.isAdmin) return;
  const u = cloudUsers.find(x => x.uid === uid);
  if (!u) return;
  const cpNum = Math.max(0, parseInt(document.getElementById("adm-ed-cp")?.value || "0", 10) || 0);
  const k = Math.max(0, parseInt(document.getElementById("adm-ed-k")?.value || "0", 10) || 0);
  const d = Math.max(0, parseInt(document.getElementById("adm-ed-d")?.value || "0", 10) || 0);
  const w = Math.max(0, parseInt(document.getElementById("adm-ed-w")?.value || "0", 10) || 0);
  const l = Math.max(0, parseInt(document.getElementById("adm-ed-l")?.value || "0", 10) || 0);
  u.cp = cpNum; u.kills = k; u.deaths = d; u.wins = w; u.losses = l; u.matchesPlayed = w + l;
  u.stats = { ...(u.stats || {}), kills: k, deaths: d, wins: w, losses: l, matchesPlayed: w + l, kd: d > 0 ? (k / d).toFixed(2) : k.toFixed(2) };
  window.closeSiteGlassModal();
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(`Статистика игрока ${u.nick} обновлена (${cpNum} CP).`);
};

window.adminEditPlayerStats = (uid) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const u = cloudUsers.find(x => x.uid === uid);
  if (!u) return;
  openSiteGlassModal(
    `СТАТИСТИКА И CP: ${escapeHTML(u.nick)}`,
    `
      <form onsubmit="window.submitAdminEditStatsModal(event, '${u.uid}')" style="display:flex; flex-direction:column; gap:10px;">
        <div><label class="auth-label">Баланс CP</label><input type="number" id="adm-ed-cp" class="auth-input" style="padding:9px 12px;" min="0" value="${u.cp || 0}" required></div>
        <div class="c6e-modal-field-row">
          <div><label class="auth-label">Убийства (Kills)</label><input type="number" id="adm-ed-k" class="auth-input" style="padding:9px 12px;" min="0" value="${u.stats?.kills ?? u.kills ?? 0}"></div>
          <div><label class="auth-label">Смерти (Deaths)</label><input type="number" id="adm-ed-d" class="auth-input" style="padding:9px 12px;" min="0" value="${u.stats?.deaths ?? u.deaths ?? 0}"></div>
        </div>
        <div class="c6e-modal-field-row">
          <div><label class="auth-label">Победы (Wins)</label><input type="number" id="adm-ed-w" class="auth-input" style="padding:9px 12px;" min="0" value="${u.stats?.wins ?? u.wins ?? 0}"></div>
          <div><label class="auth-label">Поражения (Losses)</label><input type="number" id="adm-ed-l" class="auth-input" style="padding:9px 12px;" min="0" value="${u.stats?.losses ?? u.losses ?? 0}"></div>
        </div>
        <button type="submit" class="auth-submit-btn">СОХРАНИТЬ СТАТИСТИКУ</button>
      </form>
    `
  );
};

window.adminToggleUserAdmin = (uid) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const u = cloudUsers.find(x => x.uid === uid);
  if (!u || u.uid === currentUser.uid) return window.showMirrorToast("Нельзя снять права с самого себя!", true);
  u.isAdmin = !u.isAdmin;
  if (u.isAdmin) u.isVerifiedOrganizer = true;
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(u.isAdmin ? `${u.nick} назначен Администратором!` : `Права Администратора сняты с ${u.nick}.`);
};

window.adminToggleBanUser = (uid) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const u = cloudUsers.find(x => x.uid === uid);
  if (!u || u.uid === currentUser.uid) return window.showMirrorToast("Нельзя заблокировать самого себя!", true);
  u.banned = !u.banned;
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(u.banned ? `Игрок ${u.nick} заблокирован.` : `Игрок ${u.nick} разблокирован.`);
};

window.adminDeleteUser = async (uid) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const u = cloudUsers.find(x => x.uid === uid);
  if (!u || u.uid === currentUser.uid) return window.showMirrorToast("Нельзя удалить собственный аккаунт Основателя!", true);
  if (!confirm(`Удалить профиль ${u.nick} из базы?`)) return;
  cloudUsers = cloudUsers.filter(x => x.uid !== uid);
  try { await deleteDoc(doc(db, "users", uid)); } catch (e) {}
  renderAllStageSections();
  window.showMirrorToast(`Профиль ${u.nick} удалён.`);
};


window.adminTogglePlayerVerified = (uid) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const u = cloudUsers.find(x => x.uid === uid);
  if (!u) return;
  u.verifiedBadge = !u.verifiedBadge;
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(u.verifiedBadge ? `Игроку ${u.nick} выдана галочка!` : `Галочка снята с ${u.nick}.`);
};

window.adminTogglePlayerDev = (uid) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const u = cloudUsers.find(x => x.uid === uid);
  if (!u) return;
  u.hasDevBadge = !u.hasDevBadge;
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(u.hasDevBadge ? `Игроку ${u.nick} выдана галочка Разработчика (DEV)!` : `Галочка DEV снята с ${u.nick}.`);
};

window.adminToggleClanVerified = (clanId) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const c = cloudClans.find(x => x.id === clanId);
  if (!c) return;
  c.verifiedBadge = !c.verifiedBadge;
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(c.verifiedBadge ? `Клану [${c.tag}] выдана официальная галочка!` : `Галочка снята с клана [${c.tag}].`);
};

window.adminEditClanCP = (clanId) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const c = cloudClans.find(x => x.id === clanId);
  if (!c) return;
  const val = prompt(`Новый CP для клана [${c.tag}] ${c.name} (сейчас ${c.cp || 0}):`, String(c.cp || 0));
  if (val === null) return;
  c.cp = Math.max(0, parseInt(val, 10) || 0);
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(`CP клана [${c.tag}] обновлён: ${c.cp}.`);
};

window.adminDeleteClan = async (clanId) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const c = cloudClans.find(x => x.id === clanId);
  if (!c || !confirm(`Удалить клан [${c.tag}] ${c.name}?`)) return;
  cloudClans = cloudClans.filter(x => x.id !== clanId);
  cloudUsers.forEach(u => { if (u.clanId === clanId) u.clanId = null; });
  try { await deleteDoc(doc(db, "clans", clanId)); } catch (e) {}
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(`Клан [${c.tag}] удалён.`);
};

window.adminDeleteTournamentForce = async (trnId) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const t = cloudTournaments.find(x => x.id === trnId);
  if (!t || !confirm(`Полностью удалить турнир «${t.name}»?`)) return;
  cloudTournaments = cloudTournaments.filter(x => x.id !== trnId);
  cloudMatches = cloudMatches.filter(m => m.tournamentId !== trnId);
  try { await deleteDoc(doc(db, "tournaments", trnId)); } catch (e) {}
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast(`Турнир «${t.name}» удалён.`);
};

window.adminPinLiveMatch = (matchId) => {
  if (!currentUser || !currentUser.isAdmin) return;
  cloudMatches.forEach(m => { m.featuredOnHome = (m.id === matchId); if (m.id === matchId) m.status = "live"; });
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast("Матч закреплён в главном LIVE-баннере на /feed!");
};

window.adminFinishLiveMatch = (matchId) => {
  if (!currentUser || !currentUser.isAdmin) return;
  const m = cloudMatches.find(x => x.id === matchId);
  if (!m) return;
  m.status = "finished";
  m.featuredOnHome = false;
  syncArenaDataToCloud();
  renderAllStageSections();
  window.showMirrorToast("LIVE-статус матча снят.");
};

window.adminDeleteGlobalChatMsg = async (msgId) => {
  if (!currentUser || !currentUser.isAdmin) return;
  cloudGlobalChat = cloudGlobalChat.filter(m => m.id !== msgId);
  try { await deleteDoc(doc(db, "chat_global", msgId)); } catch (e) {}
  renderAllStageSections();
  window.showMirrorToast("Сообщение удалено из общего чата.");
};

window.adminClearAllGlobalChat = async () => {
  if (!currentUser || !currentUser.isAdmin) return;
  if (!confirm("Очистить ВСЕ сообщения в общем чате?")) return;
  const ids = cloudGlobalChat.map(m => m.id);
  cloudGlobalChat = [];
  for (const id of ids) { try { await deleteDoc(doc(db, "chat_global", id)); } catch (e) {} }
  renderAllStageSections();
  window.showMirrorToast("Общий чат полностью очищен.");
};

window.adminSendGlobalBroadcast = (e) => {
  e.preventDefault();
  if (!currentUser || !currentUser.isAdmin) return;
  const title = (document.getElementById("adm-bcast-title")?.value || "").trim();
  const text = (document.getElementById("adm-bcast-text")?.value || "").trim();
  if (!title || !text) return window.showMirrorToast("Заполните заголовок и текст объявления!", true);
  cloudUsers.forEach(u => pushUserNotification(u.uid, title, text, "info"));
  document.getElementById("adm-bcast-title").value = "";
  document.getElementById("adm-bcast-text").value = "";
  window.showMirrorToast(`Уведомление отправлено всем (${cloudUsers.length}) пользователям!`);
};

window.adminCloseTicket = async (tktId) => {
  if (!currentUser || !currentUser.isAdmin) return;
  cloudTickets = cloudTickets.filter(t => t.id !== tktId);
  try { await deleteDoc(doc(db, "tickets", tktId)); } catch (e) {}
  renderExtraSections();
  window.showMirrorToast("Тикет закрыт и удалён.");
};

window.adminSaveDevSiteConfig = (e) => {
  e.preventDefault();
  if (!currentUser || !currentUser.isAdmin) return;
  const cfg = {
    adEnabled: Boolean(document.getElementById("dev-ad-enabled")?.checked),
    adTitle: (document.getElementById("dev-ad-title")?.value || "").trim() || "Здесь могла бы быть ваша реклама",
    adSub: (document.getElementById("dev-ad-sub")?.value || "").trim() || "Рекламный щит • Cyber 6 Tournament",
    adUrl: (document.getElementById("dev-ad-url")?.value || "").trim(),
    newsBadge: (document.getElementById("dev-news-badge")?.value || "").trim() || "ОБТ • 1 ДЕКАБРЯ",
    newsTitle: (document.getElementById("dev-news-title")?.value || "").trim() || "СТАРТ CYBER 6 TOURNAMENT",
    newsText: (document.getElementById("dev-news-text")?.value || "").trim(),
    maintenanceBanner: (document.getElementById("dev-maint-text")?.value || "").trim()
  };
  try { localStorage.setItem("c6e_dev_site_config", JSON.stringify(cfg)); } catch (err) {}
  renderAllStageSections();
  window.showMirrorToast("Настройки Главной страницы применены!");
};

window.onAdminUserSearchInput = (val) => {
  adminUserSearchQuery = String(val || "").trim().toLowerCase();
  renderExtraSections();
};

window.submitSupportTicket = (e) => {
  e.preventDefault();
  if (!currentUser) return window.goRoute("/authorization");
  const category = (document.getElementById("sup-cat")?.value || "Технический вопрос").trim();
  const message = (document.getElementById("sup-msg")?.value || "").trim();
  if (!message) return window.showMirrorToast("Опишите ваш вопрос!", true);
  cloudTickets.unshift({
    id: "TKT_" + Date.now().toString(36).toUpperCase(),
    uid: currentUser.uid,
    authorNick: currentUser.nick,
    authorUid: currentUser.uid,
    category,
    message,
    status: "Открыт"
  });
  syncArenaDataToCloud(); renderExtraSections();
  window.showMirrorToast("Обращение отправлено!");
};

function renderExtraSections() {
  const moreEl = document.getElementById("more-stage-root");
  if (!moreEl) return;

  if (selectedExtraSectionKey === "rules") {
    const rules = [
      { n: "01", t: "АККАУНТЫ И РОЛИ", d: "Игроки участвуют в турнирах и создают кланы. Создавать турниры могут только верифицированные организаторы и Администрация CYBER 6 Organization." },
      { n: "02", t: "ВЕРИФИКАЦИЯ ОРГАНИЗАТОРОВ", d: "Организатор обязан указать название организации, соцсети (VK/TG/YouTube/TikTok) и подтвердить обязательство честного проведения турниров и выдачи призовых." },
      { n: "03", t: "СПОСОБЫ УЧАСТИЯ И СПОНСОР", d: "Участие в турнирах возможно за Gold либо бесплатно за подписки (минимум 5 подписок от команды на ТГК или ВК). Обязательный спонсор каждого турнира — CYBER 6 Organization." },
      { n: "04", t: "CYBER POINTS (CP) И GOLD", d: "Командам начисляется 50+ CP за победу (25 CP тех. победа), игрокам — до 250 CP по итогам таба. Призовые фонды выплачиваются в Gold." }
    ];
    moreEl.innerHTML = `<div class="mirror-card"><span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> OFFICIAL RULES</span><h2 style="font-family:var(--font-display); font-size:22px; font-weight:900; margin:8px 0 16px 0;">РЕГЛАМЕНТ CYBER 6 TOURNAMENT</h2><div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:12px;">${rules.map(r => `<div class="glass-subcard"><div style="font-family:var(--font-display); font-size:10px; color:var(--accent-soft); font-weight:800;">РАЗДЕЛ ${r.n}</div><div style="font-family:var(--font-display); font-size:13.5px; font-weight:900; margin:4px 0 6px 0;">${r.t}</div><div style="font-size:12px; color:var(--white-soft);">${r.d}</div></div>`).join("")}</div></div>`;
    return;
  }

  if (selectedExtraSectionKey === "support") {
    const myTickets = currentUser ? cloudTickets.filter(t => t.authorUid === currentUser.uid || t.uid === currentUser.uid) : [];
    moreEl.innerHTML = `<div class="mirror-card"><div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px;"><div><span class="crimson-live-badge"><span class="crimson-dot-pulse"></span> SUPPORT 24/7</span><h2 style="font-family:var(--font-display); font-size:22px; font-weight:900; margin-top:8px;">ТЕХНИЧЕСКАЯ ПОДДЕРЖКА</h2></div><a href="https://t.me/kascheff" target="_blank" rel="noopener" class="social-auth-btn" style="flex:0 0 auto; padding:9px 16px; text-decoration:none;">Связаться с администратором</a></div><form onsubmit="window.submitSupportTicket(event)" class="glass-subcard" style="margin-bottom:16px;"><div class="auth-form-group"><label class="auth-label">Категория</label><input type="hidden" id="sup-cat" value="Спорный матч"><div class="glass-select-wrap" id="sup-cat-dd"><button type="button" class="glass-select-trigger" onclick="window.toggleGlassDropdown('sup-cat-dd', event)"><span id="sup-cat-lbl">Спорный матч</span><i class="fas fa-chevron-down" style="font-size:11px; color:var(--accent-soft);"></i></button><div class="glass-select-menu">${["Спорный матч", "Смена Standoff 2 ID", "Жалоба на организатора", "Технический вопрос"].map(c => `<button type="button" class="glass-select-option" onclick="window.selectGlassDropdownOption('sup-cat-dd','sup-cat','sup-cat-lbl','${c}')">${c}</button>`).join("")}</div></div></div><div class="auth-form-group"><label class="auth-label">Сообщение</label><textarea id="sup-msg" class="auth-input" rows="3" style="padding:11px 14px;" required></textarea></div><button type="submit" class="auth-submit-btn">ОТПРАВИТЬ</button></form>${myTickets.map(t => `<div class="glass-subcard" style="margin-bottom:8px;"><b style="color:var(--accent-soft);">${escapeHTML(t.category)}</b><div style="font-size:12px; color:var(--white-soft); margin-top:3px;">${escapeHTML(t.message)}</div></div>`).join("")}</div>`;
    return;
  }

  // ПОЛНАЯ АДМИН-ПАНЕЛЬ РАЗРАБОТЧИКА И ОСНОВАТЕЛЯ (/admin)
  if (!currentUser || !currentUser.isAdmin) {
    moreEl.innerHTML = `<div class="mirror-card" style="text-align:center; padding:36px;">Доступ открыт только Администрации ${OFFICIAL_SPONSOR_NAME}.</div>`;
    return;
  }

  const pendingOrgs = cloudUsers.filter(u => u.accountType === "organizer" && u.organizerStatus === "pending");
  const idReqs = cloudUsers.filter(u => u.so2IdChangeRequested);
  const filteredUsers = adminUserSearchQuery
    ? cloudUsers.filter(u => (u.nick || "").toLowerCase().includes(adminUserSearchQuery) || (u.email || "").toLowerCase().includes(adminUserSearchQuery) || (u.so2Id || "").toLowerCase().includes(adminUserSearchQuery))
    : cloudUsers;
  const devCfg = getDevSiteConfig();

  moreEl.innerHTML = `
    <div class="mirror-card">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div>
          <span class="official-c6e-badge">DEVELOPER & FOUNDER CONTROL // ${OFFICIAL_SPONSOR_NAME}</span>
          <h2 style="font-family:var(--font-display); font-size:21px; font-weight:900; color:#ffffff; margin-top:8px;">
            ПАНЕЛЬ УПРАВЛЕНИЯ ПЛАТФОРМОЙ
          </h2>
        </div>
        <div class="filter-pills-row">
          <button type="button" class="filter-pill-btn ${adminPanelTab === 'verify' ? 'active' : ''}" onclick="window.setAdminPanelTab('verify')">Заявки (${pendingOrgs.length})</button>
          <button type="button" class="filter-pill-btn ${adminPanelTab === 'official' ? 'active' : ''}" onclick="window.setAdminPanelTab('official')">+ Official</button>
          <button type="button" class="filter-pill-btn ${adminPanelTab === 'manage' ? 'active' : ''}" onclick="window.setAdminPanelTab('manage')">Игроки и Кланы</button>
          <button type="button" class="filter-pill-btn ${adminPanelTab === 'tournaments' ? 'active' : ''}" onclick="window.setAdminPanelTab('tournaments')">Турниры и LIVE</button>
          <button type="button" class="filter-pill-btn ${adminPanelTab === 'moderation' ? 'active' : ''}" onclick="window.setAdminPanelTab('moderation')">Чат и Тикеты (${idReqs.length + cloudTickets.length})</button>
          <button type="button" class="filter-pill-btn ${adminPanelTab === 'site' ? 'active' : ''}" onclick="window.setAdminPanelTab('site')">Настройки сайта</button>
        </div>
      </div>

      <div class="admin-kpi-row">
        <div class="admin-kpi-tile"><div class="feed-stat-lbl">ПОЛЬЗОВАТЕЛЕЙ</div><div class="feed-stat-num">${cloudUsers.length}</div></div>
        <div class="admin-kpi-tile"><div class="feed-stat-lbl">КЛАНОВ</div><div class="feed-stat-num">${cloudClans.length}</div></div>
        <div class="admin-kpi-tile"><div class="feed-stat-lbl">ТУРНИРОВ</div><div class="feed-stat-num">${cloudTournaments.length}</div></div>
        <div class="admin-kpi-tile"><div class="feed-stat-lbl">LIVE МАТЧЕЙ</div><div class="feed-stat-num" style="color:var(--accent-soft);">${cloudMatches.filter(m => m.status === 'live').length}</div></div>
      </div>

      ${adminPanelTab === "verify" ? (pendingOrgs.length === 0 ? `
        <div class="glass-subcard" style="text-align:center; padding:24px; font-size:12.5px; color:var(--white-dim);">Новых заявок на верификацию организаторов нет.</div>
      ` : `
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${pendingOrgs.map(org => `
            <div class="glass-subcard" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
              <div>
                <div style="font-family:var(--font-display); font-size:14px; font-weight:900; color:#ffffff;">${escapeHTML(org.orgName || 'Без названия')}</div>
                <div style="font-size:11.5px; color:var(--white-soft); margin-top:2px;">Организатор: <b>${escapeHTML(org.nick)}</b> • Email: ${escapeHTML(org.email || '')}</div>
                <div class="org-socials-row" style="margin-top:6px;">
                  ${Object.keys(org.orgSocials || {}).map(k => `<a href="${escapeHTML(org.orgSocials[k])}" target="_blank" class="glass-pill-badge" style="text-decoration:none;">${k.toUpperCase()}</a>`).join("")}
                </div>
              </div>
              <div style="display:flex; gap:8px;">
                <button type="button" class="auth-submit-btn" style="width:auto; padding:8px 16px; font-size:10px;" onclick="window.adminVerifyOrganizer('${org.uid}', true)">✓ Верифицировать</button>
                <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:8px 14px; font-size:10px; color:#fb7185;" onclick="window.adminVerifyOrganizer('${org.uid}', false)">Отклонить</button>
              </div>
            </div>
          `).join("")}
        </div>
      `) : ''}

      ${adminPanelTab === "official" ? buildTournamentCreatorFormHTML(true) : ''}

      ${adminPanelTab === "manage" ? `
        <div class="glass-subcard" style="margin-bottom:14px;">
          <input type="text" class="auth-input" style="padding-left:14px; margin-bottom:12px;" placeholder="Поиск игрока по нику, Email или SO2 ID..." value="${escapeHTML(adminUserSearchQuery)}" oninput="window.onAdminUserSearchInput(this.value)">
          <div style="display:flex; flex-direction:column; gap:8px; max-height:380px; overflow-y:auto;">
            ${filteredUsers.map(u => `
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:9px 10px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid var(--edge-light);">
                <div style="cursor:pointer;" onclick="window.viewPlayerProfile('${u.uid}')">
                  <b>${escapeHTML(u.nick)}</b>${renderUserBadgesHTML(u)}
                  <span style="font-size:11px; color:var(--accent-soft); margin-left:6px;">${u.cp || 0} CP</span>
                  ${u.isAdmin ? `<span class="official-c6e-badge" style="margin-left:6px;">ADMIN</span>` : ''}
                  ${u.isVerifiedOrganizer || u.organizerStatus === 'verified' ? `<span class="verified-org-check" style="margin-left:6px;">ORG</span>` : ''}
                  ${u.banned ? `<span class="glass-pill-badge" style="color:#fb7185; margin-left:6px;">BAN</span>` : ''}
                  <div style="font-size:10.5px; color:var(--white-dim);">${escapeHTML(u.email || '')} • SO2: ${escapeHTML(u.so2Id || '—')}</div>
                </div>
                <div style="display:flex; gap:6px; flex-wrap:wrap;">
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 9px; font-size:9.5px;" onclick="window.adminEditPlayerStats('${u.uid}')">CP / Статы</button>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 9px; font-size:9.5px; color:#38bdf8;" onclick="window.adminTogglePlayerVerified('${u.uid}')">${u.verifiedBadge ? 'Снять ✓' : '+ Галочка'}</button>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 9px; font-size:9.5px; color:#fde047;" onclick="window.adminTogglePlayerDev('${u.uid}')">${u.hasDevBadge ? 'Снять DEV' : '+ DEV'}</button>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 9px; font-size:9.5px;" onclick="window.adminVerifyOrganizer('${u.uid}', ${!(u.isVerifiedOrganizer || u.organizerStatus === 'verified')})">${(u.isVerifiedOrganizer || u.organizerStatus === 'verified') ? 'Снять Орг' : 'Выдать Орг'}</button>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 9px; font-size:9.5px;" onclick="window.adminToggleUserAdmin('${u.uid}')">${u.isAdmin ? 'Снять Адм' : 'Дать Адм'}</button>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 9px; font-size:9.5px; color:#fb7185;" onclick="window.adminToggleBanUser('${u.uid}')">${u.banned ? 'Разбан' : 'Бан'}</button>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 9px; font-size:9.5px; color:#fb7185;" onclick="window.adminDeleteUser('${u.uid}')">✕</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="glass-subcard">
          <div style="font-family:var(--font-display); font-size:12px; font-weight:900; color:var(--accent-soft); margin-bottom:10px;">УПРАВЛЕНИЕ КЛАНАМИ (${cloudClans.length})</div>
          ${cloudClans.length === 0 ? `<div style="font-size:12px; color:var(--white-dim);">Кланов пока нет.</div>` : `
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${cloudClans.map(c => `
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding:8px 10px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid var(--edge-light);">
                  <div><b>[${escapeHTML(c.tag)}] ${escapeHTML(c.name)}</b>${renderClanBadgeHTML(c)} • <span style="color:var(--accent-soft);">${c.cp || 0} CP</span> • Участников: ${(c.members || []).length}</div>
                  <div style="display:flex; gap:6px;">
                    <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 10px; font-size:9.5px; color:#38bdf8;" onclick="window.adminToggleClanVerified('${c.id}')">${c.verifiedBadge ? 'Снять ✓' : '+ Галочка'}</button>
                    <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 10px; font-size:9.5px;" onclick="window.adminEditClanCP('${c.id}')">Изменить CP</button>
                    <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 10px; font-size:9.5px; color:#fb7185;" onclick="window.adminDeleteClan('${c.id}')">Удалить</button>
                  </div>
                </div>
              `).join("")}
            </div>
          `}
        </div>
      ` : ''}

      ${adminPanelTab === "tournaments" ? `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
          <div class="glass-subcard">
            <div style="font-family:var(--font-display); font-size:12px; font-weight:900; color:var(--accent-soft); margin-bottom:10px;">ВСЕ ТУРНИРЫ (${cloudTournaments.length})</div>
            ${cloudTournaments.length === 0 ? `<div style="font-size:12px; color:var(--white-dim);">Турниров пока нет.</div>` : cloudTournaments.map(t => `
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid var(--edge-light); font-size:12px;">
                <div><b>${escapeHTML(t.name)}</b><div style="font-size:10.5px; color:var(--white-dim);">${escapeHTML(t.format)} • ${escapeHTML(t.prizeGold)} Gold</div></div>
                <div style="display:flex; gap:6px;">
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 9px; font-size:9.5px;" onclick="window.openTournamentDetails('${t.id}')">Открыть</button>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 9px; font-size:9.5px; color:#fb7185;" onclick="window.adminDeleteTournamentForce('${t.id}')">Удалить</button>
                </div>
              </div>
            `).join("")}
          </div>
          <div class="glass-subcard">
            <div style="font-family:var(--font-display); font-size:12px; font-weight:900; color:var(--accent-soft); margin-bottom:10px;">УПРАВЛЕНИЕ LIVE-БАННЕРОМ НА ГЛАВНОЙ (${cloudMatches.length})</div>
            ${cloudMatches.length === 0 ? `<div style="font-size:12px; color:var(--white-dim);">Матчей пока нет.</div>` : cloudMatches.slice(0, 12).map(m => `
              <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid var(--edge-light); font-size:11.5px;">
                <div><b>${escapeHTML(getMatchSideName(m.teamA))}</b> vs <b>${escapeHTML(getMatchSideName(m.teamB))}</b> (${escapeHTML(m.map || 'Sandstone')})</div>
                <div style="display:flex; gap:5px;">
                  <button type="button" class="auth-submit-btn" style="width:auto; padding:5px 9px; font-size:9px;" onclick="window.adminPinLiveMatch('${m.id}')">${m.featuredOnHome ? '★ В эфире' : 'На Главную LIVE'}</button>
                  ${m.status === 'live' ? `<button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:5px 8px; font-size:9px; color:#fb7185;" onclick="window.adminFinishLiveMatch('${m.id}')">Стоп</button>` : ''}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ''}

      ${adminPanelTab === "moderation" ? `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:14px;">
          <div class="glass-subcard">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span style="font-family:var(--font-display); font-size:11.5px; font-weight:900; color:var(--accent-soft);">ОБЩИЙ ЧАТ (${cloudGlobalChat.length})</span>
              <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:4px 9px; font-size:9.5px; color:#fb7185;" onclick="window.adminClearAllGlobalChat()">Очистить всё</button>
            </div>
            <div style="max-height:220px; overflow-y:auto;">
              ${cloudGlobalChat.length === 0 ? `<div style="font-size:12px; color:var(--white-dim);">Сообщений нет.</div>` : cloudGlobalChat.slice().reverse().slice(0, 20).map(m => `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--edge-light); font-size:11.5px;">
                  <span><b>${escapeHTML(m.nick)}:</b> ${escapeHTML(m.text)}</span>
                  <button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:3px 7px; font-size:9px; color:#fb7185;" onclick="window.adminDeleteGlobalChatMsg('${m.id}')">✕</button>
                </div>
              `).join("")}
            </div>
          </div>
          <div class="glass-subcard">
            <div style="font-family:var(--font-display); font-size:11.5px; font-weight:900; color:var(--accent-soft); margin-bottom:10px;">РАССЫЛКА УВЕДОМЛЕНИЙ ВСЕМ ИГРОКАМ</div>
            <form onsubmit="window.adminSendGlobalBroadcast(event)" style="display:flex; flex-direction:column; gap:8px;">
              <input type="text" id="adm-bcast-title" class="auth-input" style="padding-left:12px;" placeholder="Заголовок объявления" required>
              <textarea id="adm-bcast-text" class="auth-input" rows="2" style="padding:9px 12px;" placeholder="Текст уведомления для всех игроков..." required></textarea>
              <button type="submit" class="auth-submit-btn" style="padding:9px; font-size:10.5px;">ОТПРАВИТЬ ВСЕМ</button>
            </form>
          </div>
          <div class="glass-subcard">
            <div style="font-family:var(--font-display); font-size:11.5px; font-weight:900; color:var(--accent-soft); margin-bottom:10px;">ЗАПРОСЫ SO2 ID (${idReqs.length}) И ТИКЕТЫ (${cloudTickets.length})</div>
            ${idReqs.map(u => `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; font-size:11.5px;"><span>ID: <b>${escapeHTML(u.nick)}</b>${renderUserBadgesHTML(u)} (${escapeHTML(u.so2Id)})</span><button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:4px 9px; font-size:9.5px;" onclick="window.adminApproveIdChange('${u.uid}')">Разрешить</button></div>`).join("")}
            ${cloudTickets.map(t => `<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--edge-light); font-size:11.5px;"><span><b>${escapeHTML(t.authorNick)}</b> (${escapeHTML(t.category)}): ${escapeHTML(t.message)}</span><button type="button" class="social-auth-btn" style="flex:0 0 auto; padding:3px 7px; font-size:9px; color:#86efac;" onclick="window.adminCloseTicket('${t.id}')">✓</button></div>`).join("")}
            ${idReqs.length === 0 && cloudTickets.length === 0 ? `<div style="font-size:12px; color:var(--white-dim);">Запросов и тикетов нет.</div>` : ''}
          </div>
        </div>
      ` : ''}

      ${adminPanelTab === "site" ? `
        <form onsubmit="window.adminSaveDevSiteConfig(event)" class="glass-subcard" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px;">
          <div class="auth-form-group" style="margin:0;">
            <label class="auth-label">Рекламный щит (заголовок)</label>
            <input type="text" id="dev-ad-title" class="auth-input" style="padding-left:12px;" value="${escapeHTML(devCfg.adTitle)}">
          </div>
          <div class="auth-form-group" style="margin:0;">
            <label class="auth-label">Подпись рекламного щита</label>
            <input type="text" id="dev-ad-sub" class="auth-input" style="padding-left:12px;" value="${escapeHTML(devCfg.adSub)}">
          </div>
          <div class="auth-form-group" style="margin:0;">
            <label class="auth-label">Ссылка кнопки «Заказать»</label>
            <input type="text" id="dev-ad-url" class="auth-input" style="padding-left:12px;" value="${escapeHTML(devCfg.adUrl)}" placeholder="https://t.me/kascheff">
          </div>
          <div class="auth-form-group" style="margin:0;">
            <label class="auth-label">Бейдж главного анонса</label>
            <input type="text" id="dev-news-badge" class="auth-input" style="padding-left:12px;" value="${escapeHTML(devCfg.newsBadge)}">
          </div>
          <div class="auth-form-group" style="margin:0;">
            <label class="auth-label">Заголовок главного анонса</label>
            <input type="text" id="dev-news-title" class="auth-input" style="padding-left:12px;" value="${escapeHTML(devCfg.newsTitle)}">
          </div>
          <div class="auth-form-group" style="margin:0;">
            <label class="auth-label">Текст главного анонса</label>
            <input type="text" id="dev-news-text" class="auth-input" style="padding-left:12px;" value="${escapeHTML(devCfg.newsText)}">
          </div>
          <div class="auth-form-group" style="margin:0; grid-column:1 / -1;">
            <label class="auth-label">Предупреждение о тех. работах (оставьте пустым, чтобы скрыть)</label>
            <input type="text" id="dev-maint-text" class="auth-input" style="padding-left:12px;" value="${escapeHTML(devCfg.maintenanceBanner)}" placeholder="Например: Идёт обновление серверов до 22:00">
          </div>
          <label style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--white-soft); cursor:pointer;">
            <input type="checkbox" id="dev-ad-enabled" ${devCfg.adEnabled ? 'checked' : ''}> Показывать рекламный блок на Главной
          </label>
          <button type="submit" class="auth-submit-btn">СОХРАНИТЬ НАСТРОЙКИ САЙТА</button>
        </form>
      ` : ''}
    </div>
  `;
}

// ============================================================================
// 10. АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ (/authorization) — ВЫБОР: ИГРОК ИЛИ ОРГАНИЗАТОР
// ============================================================================
window.setRegisterAccountType = (type) => {
  registerAccountType = type === "organizer" ? "organizer" : "player";
  renderLoginSection();
};

window.liveValidateRegisterForm = () => {
  const nickInp = document.getElementById("reg-username-inp");
  const emailInp = document.getElementById("reg-email-inp");
  const passInp = document.getElementById("reg-password-inp");
  const confirmInp = document.getElementById("reg-password-confirm-inp");
  const submitBtn = document.getElementById("reg-submit-btn");
  if (!nickInp || !passInp || !confirmInp) return;

  const nCheck = validateNicknameLive(nickInp.value);
  const pCheck = validatePasswordLive(passInp.value);
  const emailVal = (emailInp?.value || "").trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
  const confirmMatch = confirmInp.value.length > 0 && confirmInp.value === passInp.value;

  const setInputState = (el, touched, isOk) => { if (!el) return; el.classList.remove("input-valid", "input-invalid"); if (touched) el.classList.add(isOk ? "input-valid" : "input-invalid"); };
  setInputState(nickInp, nickInp.value.length > 0, nCheck.ok);
  setInputState(emailInp, emailVal.length > 0, emailOk);
  setInputState(passInp, passInp.value.length > 0, pCheck.ok);
  setInputState(confirmInp, confirmInp.value.length > 0, confirmMatch);

  const setRule = (id, touched, ok, text) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = "val-rule " + (!touched ? "" : (ok ? "ok" : "err"));
    el.innerHTML = `<i class="fas ${!touched ? 'fa-circle' : (ok ? 'fa-check-circle' : 'fa-times-circle')}" style="font-size:10px;"></i> <span>${text}</span>`;
  };

  const nT = nickInp.value.length > 0;
  setRule("val-nick-latin", nT, nCheck.latinOnly && nCheck.lengthOk, "Только английские (латинские) буквы, 3–16 символов");
  setRule("val-nick-clean", nT, nCheck.cleanWords, "Без матов, брани и запрещённых слов");
  setRule("val-nick-unique", nT, nCheck.isUnique, "Никнейм свободен и не занят");

  const pT = passInp.value.length > 0;
  setRule("val-pass-chars", pT, pCheck.allowedChars && pCheck.minLen, "Только латиница и цифры, минимум 6 символов");
  setRule("val-pass-upper", pT, pCheck.hasUpper, "Минимум 1 заглавная буква (A-Z)");
  setRule("val-pass-lower", pT, pCheck.hasLower, "Минимум 1 строчная буква (a-z)");
  setRule("val-pass-digit", pT, pCheck.hasDigit, "Минимум 1 цифра (0-9)");
  setRule("val-pass-match", confirmInp.value.length > 0, confirmMatch, "Пароли совпадают");

  if (submitBtn) submitBtn.disabled = !(nCheck.ok && emailOk && pCheck.ok && confirmMatch);
};

function renderLoginSection() {
  const root = document.getElementById("login-stage-root");
  if (!root) return;
  root.innerHTML = `
    <div class="login-stage-wrapper">
      <div class="cyber-auth-card">
        <button type="button" class="auth-back-home-pill" onclick="window.goRoute('/feed')">← На главную</button>
        <div class="auth-logo-wrap"><img src="Logotip.png" alt="CYBER 6" class="auth-logo-img"></div>
        <div class="auth-brand-h1">CYBER 6</div>
        <div class="auth-brand-sub">TOURNAMENT</div>

        <div class="auth-mode-switcher">
          <button type="button" class="auth-switch-btn ${authTabMode === 'login' ? 'active' : ''}" onclick="window.switchAuthTab('login')">LOGIN</button>
          <button type="button" class="auth-switch-btn ${authTabMode === 'register' ? 'active' : ''}" onclick="window.switchAuthTab('register')">REGISTER</button>
        </div>

        ${authTabMode === "login" ? `
          <form onsubmit="window.submitEmailOrUsernameLogin(event)" autocomplete="on">
            <div class="auth-form-group"><div class="auth-label-row"><label class="auth-label">Email or Username</label></div><div class="auth-input-box"><i class="far fa-user auth-input-icon-left"></i><input type="text" id="login-identity-inp" class="auth-input" placeholder="Enter your email or username" required></div></div>
            <div class="auth-form-group"><div class="auth-label-row"><label class="auth-label">Password</label><span class="auth-show-hide-txt" onclick="window.toggleAuthPasswordVisibility()">Show/Hide</span></div><div class="auth-input-box"><i class="fas fa-lock auth-input-icon-left"></i><input type="${isPasswordVisible ? 'text' : 'password'}" id="login-password-inp" class="auth-input" placeholder="••••••••••••" required><i class="far ${isPasswordVisible ? 'fa-eye' : 'fa-eye-slash'} auth-input-icon-right" onclick="window.toggleAuthPasswordVisibility()"></i></div></div>
            <div class="auth-options-row"><label class="auth-remember-lbl"><input type="checkbox" id="login-remember-chk" checked><span>Remember me</span></label><span class="auth-forgot-link" onclick="window.handleForgotPasswordClick()">Forgot Password?</span></div>
            <button type="submit" class="auth-submit-btn">LOGIN</button>
          </form>
          <div class="auth-footer-switch">Нет аккаунта? <a onclick="window.switchAuthTab('register')">Создать аккаунт</a></div>
        ` : `
          <form onsubmit="window.submitNewAccountRegister(event)" autocomplete="off">
            <!-- ВЫБОР РОЛИ ПРИ РЕГИСТРАЦИИ: ИГРОК ИЛИ ОРГАНИЗАТОР -->
            <div class="auth-label" style="text-align:left; margin-bottom:6px;">Кем вы регистрируетесь?</div>
            <div class="role-picker-grid">
              <button type="button" class="role-pick-card ${registerAccountType === 'player' ? 'active' : ''}" onclick="window.setRegisterAccountType('player')">
                <i class="fas fa-crosshairs" style="font-size:16px; color:var(--accent-soft);"></i>
                <b style="font-family:var(--font-display); font-size:10.5px;">ИГРОК</b>
                <span style="font-size:9.5px; color:var(--white-dim);">Кланы и участие</span>
              </button>
              <button type="button" class="role-pick-card ${registerAccountType === 'organizer' ? 'active' : ''}" onclick="window.setRegisterAccountType('organizer')">
                <i class="fas fa-trophy" style="font-size:16px; color:var(--accent-soft);"></i>
                <b style="font-family:var(--font-display); font-size:10.5px;">ОРГАНИЗАТОР</b>
                <span style="font-size:9.5px; color:var(--white-dim);">Турниры + верификация</span>
              </button>
            </div>

            <div class="auth-form-group">
              <div class="auth-label-row"><label class="auth-label">${registerAccountType === 'organizer' ? 'Ник Организатора (латиница)' : 'Никнейм (только латиница)'}</label></div>
              <div class="auth-input-box"><i class="far fa-user auth-input-icon-left"></i><input type="text" id="reg-username-inp" class="auth-input" placeholder="Shadow" oninput="window.liveValidateRegisterForm()" required></div>
              <div class="validation-checklist">
                <div class="val-rule" id="val-nick-latin"><i class="fas fa-circle" style="font-size:10px;"></i> <span>Только английские (латинские) буквы, 3–16 символов</span></div>
                <div class="val-rule" id="val-nick-clean"><i class="fas fa-circle" style="font-size:10px;"></i> <span>Без матов, брани и запрещённых слов</span></div>
                <div class="val-rule" id="val-nick-unique"><i class="fas fa-circle" style="font-size:10px;"></i> <span>Никнейм свободен и не занят</span></div>
              </div>
            </div>

            <div class="auth-form-group"><div class="auth-label-row"><label class="auth-label">Email</label></div><div class="auth-input-box"><i class="far fa-envelope auth-input-icon-left"></i><input type="email" id="reg-email-inp" class="auth-input" placeholder="you@example.com" oninput="window.liveValidateRegisterForm()" required></div></div>

            <div class="auth-form-group">
              <div class="auth-label-row"><label class="auth-label">Пароль</label><span class="auth-show-hide-txt" onclick="window.toggleAuthPasswordVisibility()">Показать/Скрыть</span></div>
              <div class="auth-input-box"><i class="fas fa-lock auth-input-icon-left"></i><input type="${isPasswordVisible ? 'text' : 'password'}" id="reg-password-inp" class="auth-input" placeholder="Cyber7" oninput="window.liveValidateRegisterForm()" required><i class="far ${isPasswordVisible ? 'fa-eye' : 'fa-eye-slash'} auth-input-icon-right" onclick="window.toggleAuthPasswordVisibility()"></i></div>
              <div class="validation-checklist">
                <div class="val-rule" id="val-pass-chars"><i class="fas fa-circle" style="font-size:10px;"></i> <span>Только латиница и цифры, минимум 6 символов</span></div>
                <div class="val-rule" id="val-pass-upper"><i class="fas fa-circle" style="font-size:10px;"></i> <span>Минимум 1 заглавная буква (A-Z)</span></div>
                <div class="val-rule" id="val-pass-lower"><i class="fas fa-circle" style="font-size:10px;"></i> <span>Минимум 1 строчная буква (a-z)</span></div>
                <div class="val-rule" id="val-pass-digit"><i class="fas fa-circle" style="font-size:10px;"></i> <span>Минимум 1 цифра (0-9)</span></div>
              </div>
            </div>

            <div class="auth-form-group">
              <div class="auth-label-row"><label class="auth-label">Повторите пароль</label></div>
              <div class="auth-input-box"><i class="fas fa-lock auth-input-icon-left"></i><input type="${isPasswordVisible ? 'text' : 'password'}" id="reg-password-confirm-inp" class="auth-input" placeholder="Повторите пароль" oninput="window.liveValidateRegisterForm()" required></div>
              <div class="validation-checklist" style="padding:7px 11px;"><div class="val-rule" id="val-pass-match"><i class="fas fa-circle" style="font-size:10px;"></i> <span>Пароли совпадают</span></div></div>
            </div>

            <button type="submit" id="reg-submit-btn" class="auth-submit-btn" disabled>
              ${registerAccountType === 'organizer' ? 'ПРОДОЛЖИТЬ К ВЕРИФИКАЦИИ' : 'REGISTER'}
            </button>
          </form>
          <div class="auth-footer-switch">Уже есть аккаунт? <a onclick="window.switchAuthTab('login')">Войти</a></div>
        `}

        <div class="auth-social-row">
          <span class="auth-social-lbl">или войдите через платформу</span>
          <div class="auth-social-buttons">
            <button type="button" class="social-auth-btn" onclick="window.loginWithSocialPlatform('Google')"><i class="fab fa-google" style="color:#ea4335;"></i> Google</button>
            
          </div>
        </div>
      </div>
    </div>
  `;
}

window.switchAuthTab = (mode) => { authTabMode = mode === "register" ? "register" : "login"; renderLoginSection(); };
window.toggleAuthPasswordVisibility = () => {
  isPasswordVisible = !isPasswordVisible;
  ["login-password-inp", "reg-password-inp", "reg-password-confirm-inp"].forEach(id => { const el = document.getElementById(id); if (el) el.type = isPasswordVisible ? "text" : "password"; });
};
window.submitForgotPasswordModal = async (e) => {
  e.preventDefault();
  const email = (document.getElementById("forgot-email-inp")?.value || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return window.showMirrorToast("Введите корректный Email!", true);
  try {
    await sendPasswordResetEmail(auth, email);
    window.closeSiteGlassModal();
    window.showMirrorToast("Письмо для сброса пароля отправлено на вашу почту!");
  } catch (err) {
    window.showMirrorToast("Не удалось отправить сброс пароля. Проверьте Email.", true);
  }
};
window.handleForgotPasswordClick = () => {
  openSiteGlassModal(
    "СБРОС ПАРОЛЯ",
    `
      <form onsubmit="window.submitForgotPasswordModal(event)" style="display:flex; flex-direction:column; gap:10px;">
        <div style="font-size:11.5px; color:var(--white-soft);">Введите Email вашего аккаунта — мы отправим ссылку для восстановления:</div>
        <input type="email" id="forgot-email-inp" class="auth-input" style="padding:10px 12px;" placeholder="you@example.com" required>
        <button type="submit" class="auth-submit-btn">ОТПРАВИТЬ ПИСЬМО</button>
      </form>
    `
  );
};

function completeUserSessionLogin(userObj, remember = true, isNewRegistration = false) {
  currentUser = _cleanForFirestore(userObj); viewedProfileUid = null;
  try {
    if (remember) localStorage.setItem("c6e_active_user_v29", JSON.stringify(currentUser));
    else sessionStorage.setItem("c6e_active_user_v29", JSON.stringify(currentUser));
  } catch (e) {}
  updateTopRightPlayerUI();
  if (isNewRegistration || !currentUser.profileCompleted) {
    isEditingPlayerProfile = true;
    window.showMirrorToast(currentUser.accountType === "organizer" ? "Заполните анкету и подайте заявку на верификацию организатора!" : "Аккаунт создан! Заполните профиль Standoff 2.");
    window.goRoute("/profile");
  } else {
    window.showMirrorToast(`С возвращением, ${currentUser.nick}!`);
    window.goRoute("/feed");
  }
}

window.submitEmailOrUsernameLogin = async (e) => {
  e.preventDefault();
  const idVal = (document.getElementById("login-identity-inp")?.value || "").trim().toLowerCase();
  const passVal = (document.getElementById("login-password-inp")?.value || "").trim();
  const remember = Boolean(document.getElementById("login-remember-chk")?.checked);
  if (!idVal || !passVal) return window.showMirrorToast("Введите Email и пароль!", true);

  let emailToUse = idVal;
  if (!idVal.includes("@")) {
    const matched = cloudUsers.find(u => String(u.username || "").toLowerCase() === idVal || String(u.nick || "").toLowerCase() === idVal);
    if (matched && matched.email) emailToUse = matched.email;
    else return window.showMirrorToast("Для безопасного входа укажите ваш Email!", true);
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, emailToUse, passVal);
    const fbUser = cred.user;
    const isFounderEmail = String(fbUser.email || "").toLowerCase() === FOUNDER_ADMIN_EMAIL;
    let found = cloudUsers.find(u => u.uid === fbUser.uid);
    if (!found) {
      const regLoc = detectUserRegionData();
      const fallbackNick = isFounderEmail ? "Kas" : ((fbUser.email || "Player").split("@")[0].replace(/[^A-Za-z]/g, "").slice(0, 14) || "Player");
      found = {
        uid: fbUser.uid,
        username: fallbackNick.toLowerCase(),
        email: fbUser.email || emailToUse,
        nick: fallbackNick,
        accountType: "player",
        isAdmin: isFounderEmail,
        isVerifiedOrganizer: isFounderEmail,
        organizerStatus: isFounderEmail ? "verified" : null,
        so2Id: isFounderEmail ? "C6E-000001" : "",
        so2IdUpdatedAt: 0,
        so2IdChangeRequested: false,
        so2ProfileLink: "",
        age: "",
        region: regLoc.label,
        regionFlag: regLoc.flag,
        playRole: isFounderEmail ? "Капитан (IGL)" : "Рифлер / Энтри",
        avatar: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(fallbackNick)}&backgroundColor=9a3412`,
        banner: "",
        provider: "Firebase Auth",
        clanId: null,
        cp: 0, kills: 0, deaths: 0, wins: 0, losses: 0, matchesPlayed: 0,
        profileCompleted: isFounderEmail,
        stats: { kd: "0.00", kills: 0, deaths: 0, impact: 0, matchesPlayed: 0, wins: 0, losses: 0 },
        matchHistory: []
      };
      cloudUsers.push(found);
      await setDoc(doc(db, "users", fbUser.uid), _cleanForFirestore(found), { merge: true });
    }
    completeUserSessionLogin(found, remember, false);
  } catch (err) {
    const code = err?.code || "";
    if (code === "auth/too-many-requests") window.showMirrorToast("Слишком много попыток входа. Подождите пару минут.", true);
    else window.showMirrorToast("Неверный Email или пароль!", true);
  }
};

window.submitNewAccountRegister = async (e) => {
  e.preventDefault();
  const rawNick = (document.getElementById("reg-username-inp")?.value || "").trim();
  const email = (document.getElementById("reg-email-inp")?.value || "").trim().toLowerCase();
  const pass = (document.getElementById("reg-password-inp")?.value || "").trim();
  const passConfirm = (document.getElementById("reg-password-confirm-inp")?.value || "").trim();

  const nCheck = validateNicknameLive(rawNick);
  const pCheck = validatePasswordLive(pass);
  if (!nCheck.ok || !pCheck.ok || pass !== passConfirm) return window.showMirrorToast("Проверьте правильность заполнения полей!", true);
  if (pass.length < 6) return window.showMirrorToast("Для защиты Firebase пароль должен быть не короче 6 символов!", true);

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const regLoc = detectUserRegionData();
    const isOrg = registerAccountType === "organizer";
    const newUser = {
      uid: cred.user.uid,
      username: rawNick.toLowerCase(),
      email,
      nick: rawNick,
      accountType: registerAccountType,
      isAdmin: false,
      isVerifiedOrganizer: false,
      organizerStatus: isOrg ? "unverified" : null,
      orgName: "",
      orgSocials: {},
      orgStaff: [],
      subscribers: [],
      so2Id: "", so2IdUpdatedAt: 0, so2IdChangeRequested: false, so2ProfileLink: "",
      age: "", region: regLoc.label, regionFlag: regLoc.flag, playRole: "Рифлер / Энтри",
      avatar: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(rawNick)}&backgroundColor=9a3412`,
      banner: "", provider: "Email", clanId: null,
      cp: 0, kills: 0, deaths: 0, wins: 0, losses: 0, matchesPlayed: 0,
      profileCompleted: false,
      stats: { kd: "0.00", kills: 0, deaths: 0, impact: 0, matchesPlayed: 0, wins: 0, losses: 0 },
      matchHistory: []
    };
    await setDoc(doc(db, "users", cred.user.uid), _cleanForFirestore(newUser));
    cloudUsers.push(newUser);
    completeUserSessionLogin(newUser, true, true);
  } catch (err) {
    const code = err?.code || "";
    if (code === "auth/email-already-in-use") window.showMirrorToast("Этот Email уже зарегистрирован!", true);
    else if (code === "auth/weak-password") window.showMirrorToast("Пароль слишком слабый (минимум 6 символов)!", true);
    else window.showMirrorToast("Ошибка регистрации. Проверьте Email и интернет.", true);
  }
};

async function _finalizeGoogleFirebaseUser(fbUser) {
  if (!fbUser) return;
  const isFounderEmail = String(fbUser.email || "").toLowerCase() === FOUNDER_ADMIN_EMAIL;
  const idx = cloudUsers.findIndex(u => u.uid === fbUser.uid);
  if (idx >= 0) return completeUserSessionLogin(cloudUsers[idx], true, false);
  const regLoc = detectUserRegionData();
  const cleanN = isFounderEmail ? "Kas" : ((fbUser.displayName || "Player").replace(/[^A-Za-z]/g, "").slice(0, 14) || "Player");
  const gUser = {
    uid: fbUser.uid,
    username: cleanN.toLowerCase(),
    email: fbUser.email || "",
    nick: cleanN,
    accountType: isFounderEmail ? "player" : registerAccountType,
    isAdmin: isFounderEmail,
    isVerifiedOrganizer: isFounderEmail,
    organizerStatus: isFounderEmail ? "verified" : (registerAccountType === "organizer" ? "unverified" : null),
    orgName: "", orgSocials: {}, orgStaff: [], subscribers: [],
    so2Id: isFounderEmail ? "C6E-000001" : "", so2IdUpdatedAt: 0, so2IdChangeRequested: false, so2ProfileLink: "",
    age: "", region: regLoc.label, regionFlag: regLoc.flag, playRole: isFounderEmail ? "Капитан (IGL)" : "Рифлер / Энтри",
    avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(cleanN)}`,
    banner: "", provider: "Google", clanId: null,
    cp: 0, kills: 0, deaths: 0, wins: 0, losses: 0, matchesPlayed: 0,
    profileCompleted: isFounderEmail,
    stats: { kd: "0.00", kills: 0, deaths: 0, impact: 0, matchesPlayed: 0, wins: 0, losses: 0 },
    matchHistory: []
  };
  await setDoc(doc(db, "users", fbUser.uid), _cleanForFirestore(gUser), { merge: true });
  cloudUsers.push(gUser);
  return completeUserSessionLogin(gUser, true, !isFounderEmail);
}

// Handle mobile Google Redirect result automatically on return
getRedirectResult(auth).then(res => {
  if (res && res.user) _finalizeGoogleFirebaseUser(res.user);
}).catch(() => {});

window.loginWithSocialPlatform = async (platform) => {
  if (platform !== "Google") {
    return window.showMirrorToast("Вход через VK недоступен без бэкенда — используйте Google или Email.", true);
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const res = await signInWithPopup(auth, provider);
    if (res && res.user) await _finalizeGoogleFirebaseUser(res.user);
  } catch (err) {
    const code = err?.code || "";
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      try {
        await signInWithRedirect(auth, provider);
        return;
      } catch (e2) {}
    }
    if (code === "auth/unauthorized-domain") {
      window.showMirrorToast("Добавьте домен cyber6tournaments.github.io в Firebase → Authentication → Settings → Authorized domains!", true);
    } else if (code === "auth/operation-not-allowed") {
      window.showMirrorToast("Включите провайдер Google в Firebase → Authentication → Sign-in method!", true);
    } else if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      window.showMirrorToast("Окно входа Google было закрыто.", true);
    } else {
      window.showMirrorToast(`Ошибка Google входа (${code || "unknown"}). Проверьте настройки Firebase Auth.`, true);
    }
  }
};

// ============================================================================
// 11. АДАПТИВНЫЙ ФОН
// ============================================================================
(function initAdaptiveRefreshBackground() {
  const canvas = document.getElementById("c6e-120fps-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  let width = (canvas.width = window.innerWidth), height = (canvas.height = window.innerHeight);
  window.addEventListener("resize", () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }, { passive: true });
  const count = window.innerWidth < 700 ? 16 : 26;
  const nodes = Array.from({ length: count }, () => ({ x: Math.random() * width, y: Math.random() * height, vx: (Math.random() - 0.5) * 0.36, vy: (Math.random() - 0.5) * 0.36, r: Math.random() * 1.8 + 0.7, isAccent: Math.random() > 0.35 }));
  let lastTime = performance.now(), frameSamples = [];
  function stepFrame(now) {
    if (document.hidden) { lastTime = now; return requestAnimationFrame(stepFrame); }
    const deltaMs = now - lastTime;
    if (deltaMs < 32) return requestAnimationFrame(stepFrame);
    lastTime = now;
    if (deltaMs > 3 && deltaMs < 50 && frameSamples.length < 30) {
      frameSamples.push(deltaMs);
      if (frameSamples.length === 30) { const hz = Math.round(1000 / (frameSamples.reduce((a, b) => a + b, 0) / 30)); detectedRefreshHz = hz >= 130 ? 144 : (hz >= 105 ? 120 : (hz >= 80 ? 90 : 60)); }
    }
    const dt = Math.min(2.5, deltaMs / 16.667);
    ctx.clearRect(0, 0, width, height);
    const accentColor = activeTheme === "blood-black" ? "rgba(190, 18, 60, 0.44)" : "rgba(184, 67, 9, 0.38)";
    for (let i = 0; i < count; i++) {
      const p = nodes[i]; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0) p.x = width; else if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height; else if (p.y > height) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.isAccent ? accentColor : "rgba(255, 255, 255, 0.16)"; ctx.fill();
    }
    requestAnimationFrame(stepFrame);
  }
  requestAnimationFrame(stepFrame);
})();

try {
  const urlTrn = new URLSearchParams(window.location.search).get("trn");
  if (urlTrn) activeTournamentId = urlTrn;
} catch (e) {}
const startRoute = detectInitialRoute();
if (!currentUser && startRoute !== "/feed" && startRoute !== "/authorization") activateRouteView("/authorization", false);
else activateRouteView(startRoute, false);


// ============================================================================
// V28: ЭЛЕГАНТНЫЕ СТЕКЛЯННЫЕ МОДАЛЬНЫЕ ОКНА САЙТА (ВМЕСТО СИСТЕМНЫХ PROMPT)
// ============================================================================
function openSiteGlassModal(title, bodyHTML) {
  let bd = document.getElementById("c6e-glass-modal-backdrop");
  if (!bd) {
    bd = document.createElement("div");
    bd.id = "c6e-glass-modal-backdrop";
    bd.className = "c6e-glass-modal-backdrop";
    bd.onclick = (ev) => { if (ev.target === bd) window.closeSiteGlassModal(); };
    document.body.appendChild(bd);
  }
  bd.innerHTML = `
    <div class="c6e-glass-modal-card">
      <div class="c6e-modal-head">
        <div class="c6e-modal-title">${title}</div>
        <button type="button" class="c6e-modal-close" onclick="window.closeSiteGlassModal()">✕</button>
      </div>
      <div>${bodyHTML}</div>
    </div>
  `;
  bd.classList.add("open");
}

window.closeSiteGlassModal = () => {
  const bd = document.getElementById("c6e-glass-modal-backdrop");
  if (bd) bd.classList.remove("open");
};

window.copyTournamentInviteUrlFromModal = (url) => {
  try { navigator.clipboard.writeText(url); } catch (e) {}
  window.showMirrorToast("Ссылка-приглашение на турнир скопирована!");
};

window.sendTournamentInviteNotification = (tId, targetUid) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  const target = cloudUsers.find(u => u.uid === targetUid);
  if (!trn || !target || !currentUser) return;
  pushUserNotification(
    target.uid,
    `Приглашение на турнир «${trn.name}»`,
    `${currentUser.nick} приглашает вас принять участие в турнире (${trn.format}, приз ${trn.prizeGold} Gold).`,
    "info",
    { tournamentId: trn.id }
  );
  window.showMirrorToast(`Приглашение отправлено игроку ${target.nick}!`);
};

window.openTournamentInviteModal = (tId) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn) return;
  const shareUrl = `${PLATFORM_DOMAIN}/?trn=${encodeURIComponent(trn.id)}`;
  const tgShare = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Присоединяйся к турниру ${trn.name} (${trn.format}, ${trn.prizeGold} Gold) на CYBER 6 TOURNAMENT!`)}`;
  openSiteGlassModal(
    `ПРИГЛАСИТЬ НА ТУРНИР`,
    `
      <div style="font-size:11.5px; color:var(--white-soft); margin-bottom:8px;">Прямая ссылка-приглашение на <b>${escapeHTML(trn.name)}</b>:</div>
      <div class="c6e-modal-link-box" style="margin-bottom:10px;">
        <input type="text" class="auth-input allow-copy" style="padding:9px 11px; font-size:11px;" value="${escapeHTML(shareUrl)}" readonly onclick="this.select()">
        <button type="button" class="auth-submit-btn" style="width:auto; padding:9px 13px; font-size:10px;" onclick="window.copyTournamentInviteUrlFromModal('${escapeHTML(shareUrl)}')">Копировать</button>
      </div>
      <a href="${tgShare}" target="_blank" rel="noopener" class="social-auth-btn" style="width:100%; justify-content:center; text-decoration:none; margin-bottom:12px;">
        <i class="fab fa-telegram-plane" style="color:#38bdf8;"></i> Отправить ссылку в Telegram
      </a>
      <div class="auth-label" style="margin-bottom:6px;">Пригласить игрока с сайта по нику или SO2 ID:</div>
      <input type="text" id="trn-inv-search-inp" class="auth-input" style="padding:9px 12px; margin-bottom:8px;" placeholder="Введите ник или SO2 ID..." oninput="window.filterTrnInviteSuggest('${trn.id}', this.value)">
      <div id="trn-inv-suggest-box" class="c6e-modal-suggest-list"></div>
    `
  );
  window.filterTrnInviteSuggest(trn.id, "");
};

window.filterTrnInviteSuggest = (tId, q) => {
  const box = document.getElementById("trn-inv-suggest-box");
  if (!box) return;
  const ql = String(q || "").trim().toLowerCase();
  const list = cloudUsers.filter(u => u.uid !== currentUser?.uid && u.accountType !== "organizer" && (
    !ql || (u.nick || "").toLowerCase().includes(ql) || (u.so2Id || "").toLowerCase().includes(ql)
  )).slice(0, 6);
  if (list.length === 0) {
    box.innerHTML = `<div style="font-size:11.5px; color:var(--white-dim); text-align:center; padding:8px;">Игроки не найдены</div>`;
    return;
  }
  box.innerHTML = list.map(u => `
    <div class="c6e-modal-suggest-row">
      <span><b>${escapeHTML(u.nick)}</b>${renderUserBadgesHTML(u)} <span style="color:var(--white-dim); font-size:10.5px;">ID: ${escapeHTML(u.so2Id || '—')}</span></span>
      <button type="button" class="auth-submit-btn" style="width:auto; padding:5px 10px; font-size:9.5px;" onclick="window.sendTournamentInviteNotification('${tId}', '${u.uid}')">Пригласить</button>
    </div>
  `).join("");
};

window.confirmManualAddParticipant = (tId, customVal = null) => {
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!trn || !currentUser) return;
  const raw = customVal !== null ? customVal : (document.getElementById("man-add-part-inp")?.value || "");
  const cleanName = String(raw).trim();
  if (!cleanName) return window.showMirrorToast("Введите ник, SO2 ID или название команды!", true);
  if ((trn.participants || []).length >= trn.maxTeams) return window.showMirrorToast("Слоты заполнены!", true);

  let entry;
  if (trn.format === "1v1") {
    const matchedU = cloudUsers.find(u => (u.nick || "").toLowerCase() === cleanName.toLowerCase() || (u.so2Id || "").toLowerCase() === cleanName.toLowerCase());
    entry = {
      id: matchedU ? matchedU.uid : ("MAN_" + Date.now().toString(36).toUpperCase()),
      name: matchedU ? matchedU.nick : cleanName,
      avatar: matchedU ? matchedU.avatar : `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(cleanName)}`,
      type: "player", checkedIn: true, approved: true
    };
  } else {
    const matchedC = cloudClans.find(c => (c.name || "").toLowerCase() === cleanName.toLowerCase() || (c.tag || "").toLowerCase() === cleanName.toLowerCase());
    entry = {
      id: matchedC ? matchedC.id : ("MAN_" + Date.now().toString(36).toUpperCase()),
      name: matchedC ? `[${matchedC.tag}] ${matchedC.name}` : cleanName,
      avatar: matchedC ? matchedC.avatar : `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(cleanName)}`,
      type: "clan", checkedIn: true, approved: true
    };
  }
  trn.participants = (trn.participants || []).map(p => normalizeParticipantEntry(p, trn.format));
  if (trn.participants.some(p => p.id === entry.id || p.name.toLowerCase() === entry.name.toLowerCase())) {
    return window.showMirrorToast("Этот участник уже добавлен в турнир!", true);
  }
  trn.participants.push(entry);
  trn.bracketData = generateSmartBracketData(trn);
  syncArenaDataToCloud();
  renderAllStageSections();
  window.closeSiteGlassModal();
  window.showMirrorToast(`Участник «${entry.name}» добавлен в турнир!`);
};

window.filterManualAddSuggest = (tId, q) => {
  const box = document.getElementById("man-add-suggest-box");
  const trn = cloudTournaments.find(t => t.id === tId);
  if (!box || !trn) return;
  const ql = String(q || "").trim().toLowerCase();
  if (trn.format === "1v1") {
    const list = cloudUsers.filter(u => u.accountType !== "organizer" && (!ql || (u.nick || "").toLowerCase().includes(ql) || (u.so2Id || "").toLowerCase().includes(ql))).slice(0, 6);
    box.innerHTML = list.length ? list.map(u => `
      <div class="c6e-modal-suggest-row">
        <span><b>${escapeHTML(u.nick)}</b>${renderUserBadgesHTML(u)} <span style="color:var(--white-dim); font-size:10.5px;">SO2: ${escapeHTML(u.so2Id || '—')}</span></span>
        <button type="button" class="auth-submit-btn" style="width:auto; padding:5px 10px; font-size:9.5px;" onclick="window.confirmManualAddParticipant('${tId}', '${escapeHTML(u.nick)}')">+ Добавить</button>
      </div>
    `).join("") : `<div style="font-size:11px; color:var(--white-dim); text-align:center;">Совпадений нет — можно добавить вручную кнопкой выше</div>`;
  } else {
    const list = cloudClans.filter(c => !ql || (c.name || "").toLowerCase().includes(ql) || (c.tag || "").toLowerCase().includes(ql)).slice(0, 6);
    box.innerHTML = list.length ? list.map(c => `
      <div class="c6e-modal-suggest-row">
        <span><b>[${escapeHTML(c.tag)}] ${escapeHTML(c.name)}</b>${renderClanBadgeHTML(c)}</span>
        <button type="button" class="auth-submit-btn" style="width:auto; padding:5px 10px; font-size:9.5px;" onclick="window.confirmManualAddParticipant('${tId}', '${escapeHTML(c.name)}')">+ Добавить</button>
      </div>
    `).join("") : `<div style="font-size:11px; color:var(--white-dim); text-align:center;">Кланов не найдено — введите название команды вручную</div>`;
  }
};

window.submitClanApplicationModal = async (e, clanId) => {
  e.preventDefault();
  if (!currentUser || !auth.currentUser) return window.goRoute("/authorization");
  const clan = cloudClans.find(c => c.id === clanId);
  if (!clan) return;
  const msg = (document.getElementById("clan-apply-msg-inp")?.value || "").trim() || "Хочу вступить в клан";
  const appId = `${clan.id}_${auth.currentUser.uid}`;
  const appDoc = {
    id: appId,
    clanId: clan.id,
    leaderUid: clan.leaderUid,
    uid: auth.currentUser.uid,
    nick: currentUser.nick,
    avatar: currentUser.avatar,
    so2Id: currentUser.so2Id || "—",
    kd: currentUser.stats?.kd || "0.00",
    role: currentUser.playRole || "Игрок",
    message: msg.slice(0, 240),
    status: "pending",
    createdAt: new Date().toLocaleDateString()
  };
  try {
    await setDoc(doc(db, "clan_applications", appId), appDoc);
    pushUserNotification(
      clan.leaderUid,
      `Новая заявка в [${clan.tag}]`,
      `Игрок ${currentUser.nick} (K/D ${appDoc.kd}) подал заявку на вступление в ваш клан.`,
      "clan_app",
      { clanId: clan.id }
    );
    window.closeSiteGlassModal();
    window.showMirrorToast(`Заявка в клан [${clan.tag}] отправлена капитану!`);
  } catch (err) {
    window.showMirrorToast("Не удалось отправить заявку. Убедитесь, что вы вошли в аккаунт.", true);
  }
};

window.submitStartDmModal = (e) => {
  e.preventDefault();
  const q = (document.getElementById("dm-start-nick-inp")?.value || "").trim().toLowerCase();
  const target = cloudUsers.find(u => u.uid !== currentUser?.uid && (String(u.nick || "").toLowerCase() === q || String(u.so2Id || "").toLowerCase() === q));
  if (!target) return window.showMirrorToast("Игрок с таким ником или ID не найден!", true);
  window.closeSiteGlassModal();
  window.openDirectChatWith(target.uid);
};
