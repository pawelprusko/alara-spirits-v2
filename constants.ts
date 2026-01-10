
import { ThemeConfig, LevelConfig, Essence, ClassType } from './types';
import { 
    CUSTOM_WORKSHOP_BG, 
    CUSTOM_RANKING_POSTER, 
    CUSTOM_EXIT_DOOR, 
    CUSTOM_SHELF, 
    CUSTOM_PORTAL, 
    CUSTOM_RECIPE_BOOK, 
    CUSTOM_CRYSTAL,
    CUSTOM_SPLASH_SCREEN
} from './customAssets';

export const CANVAS_WIDTH = 360;
// ZMIANA: Zwiększamy wysokość do 932px (iPhone 14 Pro Max), aby object-cover miał z czego przycinać
export const CANVAS_HEIGHT = 932;
export const MAP_WIDTH = 1000; 
export const MAP_HEIGHT = 3000; 
export const MAP_PADDING = 150; 
export const TILE_SIZE = 90; 

// Ranges
export const CATCH_RANGE = 100; 
export const ATTACK_RANGE = 100; 

// GAME BALANCE:
export const MELEE_DAMAGE = 150; 
export const ATTACK_COOLDOWN = 600; 

// Game Balance
export const TIME_BONUS_VALUE = 10; 
export const SAFE_SPAWN_RADIUS = 400; 

// Perspective Config
export const HORIZON_Y = 120; 
export const MIN_SCALE = 0.6; 
export const MAX_SCALE = 1.35; 
export const PLAYER_SAFE_ZONE_Y = 280; 

export const POINTS_PER_GHOST = 100; 
export const TOTAL_GHOST_HEALTH = 3000; 

export const COLORS = {
  background: '#0f172a', 
  sky: '#1e293b', 
  uiBg: 'rgba(15, 23, 42, 0.85)', 
  uiBorder: '#a855f7', 
  uiAccent: '#a855f7', 
  uiText: '#f1f5f9',
  beam: '#a855f7', 
  beamCore: '#ffffff',
  possessedTint: '#d8b4fe', 
  hpBarBg: '#334155',
  hpBarFill: '#ef4444'
};

// --- LEVEL NAME GENERATOR ---
export const LEVEL_ADJECTIVES = [
    "Whispering", "Forgotten", "Burning", "Frozen", "Cursed", "Silent", "Hollow", 
    "Ancient", "Shattered", "Toxic", "Dark", "Lost", "Crimson", "Shadow", "Eternal"
];

export const LEVEL_NOUNS = [
    "Woods", "Wastes", "Ruins", "Keep", "Graveyard", "Swamp", "Dunes", 
    "Void", "Catacombs", "Sanctuary", "Temple", "Valley", "Citadel", "Forest", "Abyss"
];

// --- ASSETS GENERATION HELPERS ---

const svgToDataUri = (svgString: string) => {
    try {
        const cleanSvg = svgString.trim();
        const base64 = window.btoa(unescape(encodeURIComponent(cleanSvg)));
        return `data:image/svg+xml;charset=utf-8;base64,${base64}`;
    } catch (e) {
        console.error("SVG Encoding Error:", e);
        return ""; 
    }
};

// ==========================================
// SVG DEFINITIONS
// ==========================================

const SKY_SVG = `<svg width="360" height="250" viewBox="0 0 360 250" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="mangaSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0f172a"/><stop offset="50%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#312e81"/></linearGradient><filter id="moonGlow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="360" height="250" fill="url(#mangaSky)"/><g filter="url(#moonGlow)"><circle cx="260" cy="80" r="50" fill="#fefce8" opacity="0.9"/><circle cx="250" cy="70" r="45" fill="#fef08a" opacity="0.4"/></g><path d="M-20 150 L100 145 L80 155 Z" fill="#4338ca" opacity="0.3"/><path d="M200 40 L380 45 L350 55 Z" fill="#4338ca" opacity="0.3"/><path d="M50 80 L180 82 L160 88 Z" fill="#4338ca" opacity="0.2"/><circle cx="40" cy="40" r="1.5" fill="#fff"/><circle cx="150" cy="20" r="1" fill="#fff"/><path d="M100 100 L102 102 M102 100 L100 102" stroke="#fff" stroke-width="1"/></svg>`;
const HORIZON_STRIP_SVG = `<svg width="360" height="60" viewBox="0 0 360 60" xmlns="http://www.w3.org/2000/svg"><path d="M0 60 L0 10 Q60 5 120 15 Q180 25 240 10 Q300 0 360 15 L360 60 Z" fill="#020617" /><path d="M0 60 L0 25 Q90 35 180 20 Q270 5 360 30 L360 60 Z" fill="#1e1b4b" opacity="0.5"/></svg>`;
const GROUND_JUNGLE = `<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="jungleGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#022c22"/><stop offset="100%" stop-color="#064e3b"/></linearGradient></defs><rect width="256" height="256" fill="url(#jungleGrad)"/><path d="M20 40 Q50 20 80 50 Q60 80 30 70 Z" fill="#111827" opacity="0.4"/><path d="M180 150 Q220 140 240 180 Q200 210 160 190 Z" fill="#111827" opacity="0.4"/><path d="M40 100 L45 80 L50 100 M30 95 L45 85 L60 95" stroke="#10b981" stroke-width="2" opacity="0.3" fill="none"/><path d="M200 200 L205 180 L210 200 M190 195 L205 185 L220 195" stroke="#10b981" stroke-width="2" opacity="0.3" fill="none"/><path d="M0 50 Q60 60 100 40" stroke="#3f2c22" stroke-width="3" fill="none" opacity="0.5"/><path d="M150 250 Q200 220 256 240" stroke="#3f2c22" stroke-width="3" fill="none" opacity="0.5"/></svg>`;
const GROUND_DESERT = `<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sandGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs><rect width="256" height="256" fill="url(#sandGrad)"/><path d="M0 60 Q128 90 256 60" fill="none" stroke="#d97706" stroke-width="3" opacity="0.4"/><path d="M0 160 Q128 190 256 160" fill="none" stroke="#d97706" stroke-width="3" opacity="0.4"/><circle cx="80" cy="80" r="2" fill="#92400e" opacity="0.2"/><circle cx="200" cy="120" r="3" fill="#92400e" opacity="0.2"/><rect x="150" y="50" width="2" height="2" fill="#fff" opacity="0.6"/></svg>`;
const GROUND_ICE = `<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="iceGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f0f9ff"/><stop offset="100%" stop-color="#e0f2fe"/></linearGradient></defs><rect width="256" height="256" fill="url(#iceGrad)"/><path d="M0 100 Q128 80 256 120" stroke="#bae6fd" stroke-width="15" stroke-opacity="0.4" fill="none" filter="blur(3px)"/><path d="M40 40 L80 60 L60 90" stroke="#38bdf8" stroke-width="1" fill="none" opacity="0.6"/><path d="M200 200 L230 180 L210 160" stroke="#38bdf8" stroke-width="1" fill="none" opacity="0.6"/><path d="M20 150 L60 150 L40 160 Z" fill="#fff" opacity="0.8"/><path d="M180 50 L220 50 L200 60 Z" fill="#fff" opacity="0.8"/></svg>`;
const GROUND_DIMENSION = `<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4f46e5" stroke-width="1" opacity="0.5"/></pattern><radialGradient id="dimGrad" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#020617"/></radialGradient></defs><rect width="256" height="256" fill="url(#dimGrad)"/><rect width="256" height="256" fill="url(#grid)" /><circle cx="128" cy="128" r="80" fill="none" stroke="#6366f1" stroke-width="2" opacity="0.2" /></svg>`;
const GROUND_RIFT = `<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="riftGrad" cx="50%" cy="50%" r="80%"><stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#020617"/></radialGradient><filter id="roughness"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3"/><feDisplacementMap in="SourceGraphic" scale="10"/></filter></defs><rect width="256" height="256" fill="url(#riftGrad)"/><g opacity="0.3" fill="#1e293b"><path d="M20 30 Q40 10 60 30 Q80 50 50 70 Q20 60 20 30 Z" /><path d="M150 40 Q180 20 200 50 Q190 90 150 80 Q130 60 150 40 Z" /><path d="M40 150 Q70 130 90 160 Q80 200 40 190 Q20 170 40 150 Z" /><path d="M180 180 Q220 160 240 200 Q220 240 170 220 Q160 190 180 180 Z" /><path d="M100 100 Q130 90 140 120 Q120 150 90 140 Q80 110 100 100 Z" /></g><g opacity="0.1" fill="#334155" transform="translate(30, 40)"><circle cx="50" cy="50" r="20" /><circle cx="180" cy="120" r="30" /><circle cx="100" cy="200" r="25" /></g></svg>`;
const GROUND_DUNGEON = `<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="dungeonGrad" cx="50%" cy="50%" r="90%"><stop offset="0%" stop-color="#1c1917"/><stop offset="100%" stop-color="#000000"/></radialGradient><pattern id="stonePattern" width="128" height="128" patternUnits="userSpaceOnUse"><path d="M10 10 Q30 5 50 15 Q60 30 50 50 Q30 60 10 50 Q0 30 10 10 Z" fill="#292524" opacity="0.4"/><path d="M70 20 Q90 10 110 20 Q120 40 110 60 Q90 70 70 60 Q60 40 70 20 Z" fill="#292524" opacity="0.3"/><path d="M20 70 Q40 60 60 70 Q70 90 60 110 Q40 120 20 110 Q10 90 20 70 Z" fill="#292524" opacity="0.5"/><path d="M80 80 Q100 70 120 80 Q130 100 120 120 Q100 130 80 120 Q70 100 80 80 Z" fill="#292524" opacity="0.4"/><path d="M30 30 L40 40 M90 90 L100 80" stroke="#000" stroke-width="1" opacity="0.3"/></pattern></defs><rect width="256" height="256" fill="url(#dungeonGrad)"/><rect width="256" height="256" fill="url(#stonePattern)"/></svg>`;

const FACE_DEFS = `<path d="M50 20 Q64 55 78 20" fill="#1e293b" opacity="0.2"/><path d="M50 25 L78 25 L78 45 Q78 58 64 60 Q50 58 50 45 Z" fill="#ffedd5"/><path d="M48 28 Q 50 10, 64 8 Q 78 10, 80 28 Q 82 40, 78 32 Q 64 20, 48 32 Z" fill="url(#hairGrad)"/><path d="M50 20 Q 55 35 60 25" fill="#3E2723"/><path d="M78 20 Q 73 35 68 25" fill="#3E2723"/><g transform="translate(54, 34)"><path d="M0 0 L 8 0 L 8 6 Q 4 8 0 6 Z" fill="#fff"/><circle cx="4" cy="3" r="2.5" fill="#1e293b"/><path d="M-1 -2 L 9 0" stroke="#3E2723" stroke-width="1.5"/></g><g transform="translate(67, 34)"><path d="M0 0 L 8 0 L 8 6 Q 4 8 0 6 Z" fill="#fff"/><circle cx="4" cy="3" r="2.5" fill="#1e293b"/><path d="M-1 0 L 9 -2" stroke="#3E2723" stroke-width="1.5"/></g><path d="M65 38 L 63 46 L 67 46" fill="rgba(0,0,0,0.1)"/><path d="M63 38 L 63 46" stroke="#e2c4a8" stroke-width="1"/><path d="M61 52 Q64 54 67 52" fill="none" stroke="#d4b996" stroke-width="2"/><path d="M63 54 Q64 55 65 54" fill="none" stroke="#cc8e69" stroke-width="1" opacity="0.7"/>`;
// UPDATED: High Res 512x512 for Player
const PLAYER_BODY_SCIENTIST = `<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="pShadow"><feDropShadow dx="0" dy="8" stdDeviation="4" flood-opacity="0.5"/></filter><linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5D4037"/><stop offset="100%" stop-color="#3E2723"/></linearGradient></defs><g filter="url(#pShadow)"><rect x="40" y="35" width="48" height="60" rx="6" fill="#1e293b"/><circle cx="80" cy="85" r="5" fill="#ef4444" opacity="0.8"><animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite"/></circle><path d="M44 52 L84 52 L76 100 L52 100 Z" fill="#d4b996"/><path d="M52 100 L48 125 L58 125 L60 100" fill="#d4b996"/><path d="M76 100 L80 125 L70 125 L68 100" fill="#d4b996"/><path d="M46 125 L60 125 L60 128 L46 128 Z" fill="#1e293b"/><path d="M68 125 L82 125 L82 128 L68 128 Z" fill="#1e293b"/><rect x="50" y="90" width="28" height="6" fill="#1e293b"/><rect x="70" y="85" width="6" height="12" fill="#0f172a" rx="1"/><path d="M52 52 L64 65 L76 52" fill="#1e293b" opacity="0.3"/>${FACE_DEFS}</g></svg>`;
// UPDATED: High Res 512x512 for Player
const PLAYER_BODY_MONK = `<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="mShadow"><feDropShadow dx="0" dy="8" stdDeviation="4" flood-opacity="0.5"/></filter><linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5D4037"/><stop offset="100%" stop-color="#3E2723"/></linearGradient></defs><g filter="url(#mShadow)"><path d="M42 52 L86 52 L82 110 L46 110 Z" fill="#facc15"/><path d="M42 52 L64 110 L86 52" fill="#eab308" opacity="0.3"/><path d="M46 105 L44 125 L58 125 L56 105" fill="#fef08a"/><path d="M82 105 L84 125 L70 125 L72 105" fill="#fef08a"/><path d="M44 125 L58 125 L58 127 L44 127 Z" fill="#78350f"/><path d="M70 125 L84 125 L84 127 L70 127 Z" fill="#78350f"/><rect x="44" y="85" width="40" height="8" fill="#dc2626"/><path d="M44 85 L35 100 L45 100" fill="#dc2626"/><path d="M50 52 Q64 75 78 52" stroke="#92400e" stroke-width="4" stroke-dasharray="4 2" fill="none"/>${FACE_DEFS}</g></svg>`;
// UPDATED: High Res 512x512 for Player
const PLAYER_BODY_THIEF = `<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="tShadow"><feDropShadow dx="0" dy="8" stdDeviation="4" flood-opacity="0.5"/></filter><linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5D4037"/><stop offset="100%" stop-color="#3E2723"/></linearGradient></defs><g filter="url(#tShadow)"><path d="M35 55 Q20 80 30 110 L98 110 Q108 80 93 55" fill="#0f172a"/><path d="M44 52 L84 52 L78 100 L50 100 Z" fill="#334155"/><path d="M50 100 L48 125 L58 125 L60 100" fill="#1e293b"/><path d="M78 100 L80 125 L70 125 L68 100" fill="#1e293b"/><path d="M46 120 L60 120 L60 128 L46 128 Z" fill="#000"/><path d="M68 120 L82 120 L82 128 L68 128 Z" fill="#000"/><rect x="48" y="90" width="32" height="5" fill="#000"/><rect x="52" y="55" width="5" height="40" fill="#000" opacity="0.5"/><path d="M40 50 L45 40 L50 50" fill="#0f172a"/><path d="M88 50 L83 40 L78 50" fill="#0f172a"/>${FACE_DEFS}</g></svg>`;
// UPDATED: High Res 512x512 for Arms
const PLAYER_ARMS_GUN = `<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="gunShad"><feDropShadow dx="0" dy="2" stdDeviation="1" flood-opacity="0.3"/></filter></defs><g filter="url(#gunShad)"><path d="M44 55 Q28 65 38 75 L52 75" stroke="#d4b996" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="38" cy="75" r="5" fill="#1e293b"/><circle cx="52" cy="75" r="5" fill="#ffedd5"/><path d="M84 55 Q95 65 92 70 L78 72" stroke="#d4b996" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="92" cy="70" r="5" fill="#1e1b4b"/><circle cx="78" cy="72" r="5" fill="#ffedd5"/><rect x="52" y="70" width="35" height="10" fill="#1e293b" rx="1"/><rect x="58" y="68" width="22" height="14" fill="#0f172a" rx="1"/><rect x="54" y="76" width="4" height="6" fill="#334155"/><rect x="76" y="74" width="4" height="8" fill="#334155"/><rect x="85" y="72" width="10" height="6" fill="#64748b"/><circle cx="95" cy="75" r="3" fill="#ef4444"/><path d="M52 75 Q35 85 45 60" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round"/></g></svg>`;
const PLAYER_ARMS_MAGE = `<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="mageShad"><feDropShadow dx="0" dy="2" stdDeviation="1" flood-opacity="0.3"/></filter></defs><g filter="url(#mageShad)"><path d="M44 55 Q35 70 48 75" stroke="#d4b996" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="48" cy="75" r="5" fill="#ffedd5"/><path d="M84 55 Q93 70 80 75" stroke="#d4b996" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="80" cy="75" r="5" fill="#ffedd5"/><circle cx="64" cy="70" r="8" fill="#facc15" opacity="0.6"><animate attributeName="r" values="8;10;8" dur="1s" repeatCount="indefinite"/></circle></g></svg>`;
const PLAYER_ARMS_DAGGER = `<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="dagShad"><feDropShadow dx="0" dy="2" stdDeviation="1" flood-opacity="0.3"/></filter></defs><g filter="url(#dagShad)"><path d="M44 55 Q40 70 45 75" stroke="#d4b996" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="45" cy="75" r="5" fill="#ffedd5"/><path d="M45 75 L40 65 L48 65 Z" fill="#94a3b8"/><path d="M84 55 Q88 70 83 75" stroke="#d4b996" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="83" cy="75" r="5" fill="#ffedd5"/><path d="M83 75 L78 65 L86 65 Z" fill="#94a3b8"/></g></svg>`;
// UPDATED: High Res 400x400 for Weapons
const WEAPON_GUN_SVG = `<svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><filter id="wGunShad"><feDropShadow dx="2" dy="4" stdDeviation="2" flood-opacity="0.3"/></filter></defs><g filter="url(#wGunShad)"><path d="M40 20 L60 20 L60 70 L65 75 L65 85 L55 90 L35 85 L35 75 L40 70 Z" fill="#1e293b" /><rect x="42" y="20" width="16" height="50" fill="#334155" /><rect x="45" y="25" width="10" height="30" fill="#475569" /><circle cx="50" cy="20" r="6" fill="#ef4444" /><circle cx="50" cy="20" r="3" fill="#fecaca" /><rect x="35" y="60" width="30" height="6" fill="#0f172a" /></g></svg>`;
const WEAPON_LIGHT_SWORD_SVG = `<svg width="400" height="800" viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg"><defs><filter id="glowLS"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#glowLS)"><rect x="45" y="150" width="10" height="40" fill="#334155" rx="2" /><rect x="42" y="145" width="16" height="5" fill="#475569" /><path d="M48 145 L48 20 Q 50 10, 52 20 L52 145 Z" fill="#fef08a" opacity="0.9" /><path d="M49 140 L49 25 L51 25 L51 140 Z" fill="#fff" /></g></svg>`;
const WEAPON_CLEAVER_SVG = `<svg width="400" height="400" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g transform="translate(50, 50) rotate(-45)"><rect x="-5" y="10" width="10" height="30" fill="#3f2c22" rx="2" /><path d="M-10 10 L10 10 L15 -30 L-15 -30 Z" fill="#94a3b8" stroke="#cbd5e1" stroke-width="2" /><circle cx="0" cy="0" r="2" fill="#334155" /></g></svg>`;
const OBS_STUMP_SVG = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><filter id="stumpShad"><feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/></filter></defs><g filter="url(#stumpShad)"><path d="M20 80 Q10 90 20 95 L80 95 Q90 90 80 80 L75 40 Q50 35 25 40 Z" fill="#3f2c22" /><path d="M25 40 Q50 30 75 40 Q70 50 25 40" fill="#5d4037" /><path d="M35 40 Q50 35 65 40" stroke="#78350f" stroke-width="2" fill="none" /></g></svg>`;
const OBS_ROCK_SVG = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><filter id="rockShad"><feDropShadow dx="2" dy="4" stdDeviation="2" flood-opacity="0.3"/></filter></defs><g filter="url(#rockShad)"><path d="M20 80 L30 50 L50 30 L80 50 L90 80 L70 95 L30 95 Z" fill="#57534e" /><path d="M30 50 L50 30 L60 60 Z" fill="#78716c" opacity="0.5" /><path d="M50 30 L80 50 L60 60 Z" fill="#44403c" opacity="0.3" /></g></svg>`;
const OBS_CRYPT_SVG = `<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg"><defs><filter id="cryptShad"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-opacity="0.5"/></filter></defs><g filter="url(#cryptShad)"><rect x="20" y="40" width="100" height="90" fill="#27272a" /><path d="M15 40 L70 10 L125 40 Z" fill="#3f3f46" /><rect x="50" y="70" width="40" height="60" fill="#09090b" rx="20" ry="20" /><path d="M65 40 L75 40 M70 35 L70 45" stroke="#52525b" stroke-width="3" /></g></svg>`;
const OBS_TOMBSTONE_SVG = `<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><filter id="tombShad"><feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.4"/></filter></defs><g filter="url(#tombShad)"><path d="M25 90 L25 40 Q50 10 75 40 L75 90 Z" fill="#52525b" /><rect x="20" y="90" width="60" height="5" fill="#3f3f46" /><path d="M40 40 L60 40 M50 30 L50 55" stroke="#a1a1aa" stroke-width="3" opacity="0.6" /></g></svg>`;
// UPDATED: High Res 512x512 AND Fixed Filter Clipping
const MONSTER_SLIME = `<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="slimeGrad" cx="30%" cy="30%" r="70%"><stop offset="0%" stop-color="#4ade80"/><stop offset="100%" stop-color="#16a34a"/></radialGradient><filter id="slimeGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M64 20 Q100 20 110 60 Q120 100 100 120 L28 120 Q8 100 18 60 Q28 20 64 20 Z" fill="url(#slimeGrad)" filter="url(#slimeGlow)"/><circle cx="45" cy="55" r="5" fill="#000"/><circle cx="83" cy="55" r="5" fill="#000"/><path d="M50 75 Q64 85 78 75" fill="none" stroke="#000" stroke-width="3" opacity="0.5"/><ellipse cx="30" cy="110" rx="10" ry="5" fill="#a7f3d0" opacity="0.3"/><ellipse cx="100" cy="110" rx="10" ry="5" fill="#a7f3d0" opacity="0.3"/></svg>`;
// UPDATED: High Res 512x512
const MONSTER_VOODOO = `<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><circle cx="64" cy="50" r="30" fill="#a16207"/><rect x="44" y="80" width="40" height="40" fill="#a16207"/><circle cx="54" cy="45" r="8" fill="#fff"/><circle cx="54" cy="45" r="2" fill="#000"/><path d="M70 41 L82 49 M70 49 L82 41" stroke="#000" stroke-width="3"/><path d="M64 20 L64 10" stroke="#facc15" stroke-width="2"/><path d="M50 25 L40 15" stroke="#facc15" stroke-width="2"/><path d="M78 25 L88 15" stroke="#facc15" stroke-width="2"/><path d="M64 65 Q64 75 54 70" stroke="#000" stroke-width="2" fill="none"/></svg>`;
// UPDATED: High Res 512x512 AND Fixed Filter Clipping
const BOSS_GHOST_SVG = `<svg width="512" height="512" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bossGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ef4444"/><stop offset="100%" stop-color="#991b1b"/></radialGradient><filter id="bossGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#bossGlow)"><path d="M80 10 Q140 10 140 70 L140 110 Q140 150 110 140 Q80 160 50 140 Q20 150 20 110 L20 70 Q20 10 80 10 Z" fill="url(#bossGrad)" opacity="0.9"/><path d="M50 50 L70 65 L60 80" fill="#000"/><path d="M110 50 L90 65 L100 80" fill="#000"/><path d="M60 100 Q80 120 100 100" stroke="#000" stroke-width="5" fill="none"/><path d="M40 30 L50 10" stroke="#fca5a5" stroke-width="3"/><path d="M120 30 L110 10" stroke="#fca5a5" stroke-width="3"/></g></svg>`;
const OBS_JUNGLE_TREE = `<svg width="150" height="200" viewBox="0 0 150 200" xmlns="http://www.w3.org/2000/svg"><defs><filter id="treeShad"><feDropShadow dx="2" dy="4" stdDeviation="2" flood-opacity="0.3"/></filter></defs><g filter="url(#treeShad)"><rect x="65" y="100" width="20" height="100" fill="#3f2c22"/><circle cx="75" cy="90" r="50" fill="#064e3b"/><circle cx="45" cy="110" r="30" fill="#064e3b"/><circle cx="105" cy="110" r="30" fill="#064e3b"/><circle cx="75" cy="60" r="35" fill="#047857"/><circle cx="75" cy="90" r="40" fill="url(#jungleGrad)" opacity="0.3"/></g></svg>`;
const OBS_GIANT_FERN = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><path d="M64 120 Q40 80 20 60" stroke="#166534" stroke-width="4" fill="none"/><path d="M64 120 Q88 80 108 60" stroke="#166534" stroke-width="4" fill="none"/><path d="M64 120 Q64 70 64 40" stroke="#15803d" stroke-width="4" fill="none"/><ellipse cx="20" cy="60" rx="10" ry="20" fill="#22c55e" transform="rotate(-30 20 60)"/><ellipse cx="108" cy="60" rx="10" ry="20" fill="#22c55e" transform="rotate(30 108 60)"/><ellipse cx="64" cy="40" rx="12" ry="25" fill="#4ade80"/></svg>`;
// FIXED SVG SYNTAX ERROR IN RADIALGRADIENT CLOSING TAG
const ECTOPLASM_SVG = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><filter id="glow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="grad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#e9d5ff"/><stop offset="100%" stop-color="#a855f7"/></radialGradient></defs><g filter="url(#glow)"><circle cx="32" cy="32" r="16" fill="url(#grad)" opacity="0.9"><animate attributeName="r" values="16;18;16" dur="1.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0.6;0.9" dur="1.5s" repeatCount="indefinite"/></circle><circle cx="32" cy="32" r="8" fill="#fff" opacity="0.8"/></g></svg>`;
const ECTOPLASM_GOLD_SVG = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><filter id="goldGlow"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="gradGold" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#f59e0b"/></radialGradient></defs><g filter="url(#goldGlow)"><circle cx="32" cy="32" r="18" fill="url(#gradGold)" opacity="0.9"><animate attributeName="r" values="18;20;18" dur="1.0s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0.8;0.9" dur="1.0s" repeatCount="indefinite"/></circle><path d="M24 20 L40 20 L24 44 L40 44 L24 20 Z" fill="#fff" opacity="0.9"/><path d="M24 20 L40 20 M24 44 L40 44" stroke="#78350f" stroke-width="2"/></g></svg>`;
const PORTAL_SVG = `<svg width="200" height="300" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="portalGrad"><stop offset="0%" stop-color="#fff"/><stop offset="40%" stop-color="#d8b4fe"/><stop offset="100%" stop-color="#7e22ce"/></radialGradient><filter id="portalGlow"><feGaussianBlur stdDeviation="10" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#portalGlow)"><ellipse cx="100" cy="150" rx="90" ry="140" fill="#581c87" opacity="0.8"/><ellipse cx="100" cy="150" rx="70" ry="120" fill="url(#portalGrad)"/><path d="M100 150 Q150 100 100 50 Q50 100 100 150 Z" fill="#fff" opacity="0.3"><animateTransform attributeName="transform" type="rotate" from="0 100 150" to="360 100 150" dur="3s" repeatCount="indefinite"/></path></g></svg>`;
const PORTAL_RED_SVG = `<svg width="200" height="300" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="portalRedGrad"><stop offset="0%" stop-color="#fff"/><stop offset="40%" stop-color="#f87171"/><stop offset="100%" stop-color="#dc2626"/></radialGradient><filter id="portalRedGlow"><feGaussianBlur stdDeviation="10" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#portalRedGlow)"><ellipse cx="100" cy="150" rx="90" ry="140" fill="#7f1d1d" opacity="0.8"/><ellipse cx="100" cy="150" rx="70" ry="120" fill="url(#portalRedGrad)"/><path d="M100 150 Q150 100 100 50 Q50 100 100 150 Z" fill="#fff" opacity="0.3"><animateTransform attributeName="transform" type="rotate" from="0 100 150" to="360 100 150" dur="2s" repeatCount="indefinite"/></path></g></svg>`;
const SHRINE_SVG = `<svg width="120" height="160" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg"><defs><filter id="shrineShadow"><feDropShadow dx="0" dy="5" stdDeviation="3" flood-opacity="0.6"/></filter></defs><g filter="url(#shrineShadow)"><rect x="20" y="100" width="80" height="50" fill="#292524" /><path d="M20 100 L30 150 L90 150 L100 100 Z" fill="#44403c" /><rect x="30" y="40" width="60" height="80" fill="#1c1917" /><rect x="25" y="120" width="70" height="5" fill="#57534e" /><rect x="25" y="140" width="70" height="5" fill="#57534e" /><path d="M30 40 L60 10 L90 40 Z" fill="#292524" /><circle cx="60" cy="70" r="15" fill="#7f1d1d" opacity="0.8"><animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/></circle><path d="M55 65 L60 75 L65 65" stroke="#fca5a5" stroke-width="2" fill="none" /><path d="M30 40 L30 120" stroke="#000" stroke-width="2" opacity="0.5" /><path d="M90 40 L90 120" stroke="#000" stroke-width="2" opacity="0.5" /></g></svg>`;
const LOADING_GHOST_SVG = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="pGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="ghostGrad" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#ffffff"/><stop offset="60%" stop-color="#d8b4fe"/><stop offset="100%" stop-color="#7e22ce"/></radialGradient></defs><g filter="url(#pGlow)"><path d="M64 20 Q24 20 24 64 L24 110 L44 100 L64 110 L84 100 L104 110 L104 64 Q104 20 64 20 Z" fill="url(#ghostGrad)" opacity="0.9"/><circle cx="50" cy="55" r="6" fill="#1e1b4b"/><circle cx="78" cy="55" r="6" fill="#1e1b4b"/></g></svg>`;
const SPIRIT_RED_SVG = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="rGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="redGhostGrad" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#ffffff"/><stop offset="60%" stop-color="#ef4444"/><stop offset="100%" stop-color="#991b1b"/></radialGradient></defs><g filter="url(#rGlow)"><path d="M64 20 Q24 20 24 64 L24 110 L44 100 L64 110 L84 100 L104 110 L104 64 Q104 20 64 20 Z" fill="url(#redGhostGrad)" opacity="0.9"/><circle cx="50" cy="55" r="6" fill="#1e1b4b"/><circle cx="78" cy="55" r="6" fill="#1e1b4b"/></g></svg>`;
const TESLA_COIL_SVG = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="teslaGlow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect x="34" y="90" width="60" height="30" fill="#334155" rx="2"/><rect x="44" y="80" width="40" height="10" fill="#475569"/><rect x="49" y="50" width="30" height="30" fill="#b91c1c" rx="2"/><path d="M49 55 L79 55 M49 60 L79 60 M49 65 L79 65 M49 70 L79 70 M49 75 L79 75" stroke="#7f1d1d" stroke-width="2"/><circle cx="64" cy="35" r="15" fill="#ef4444" filter="url(#teslaGlow)"><animate attributeName="r" values="15;18;15" dur="0.2s" repeatCount="indefinite"/></circle><rect x="40" y="50" width="5" height="40" fill="#64748b"/><rect x="83" y="50" width="5" height="40" fill="#64748b"/></svg>`;

// --- COMPLETELY NEW UNIQUE SVG ASSETS FOR THEMES ---

// DESERT MONSTERS - UPDATED: High Res 512x512 AND Fixed Filter Clipping
const MONSTER_MUMMY = `<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="mummyShad" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="5" stdDeviation="3" flood-opacity="0.4"/></filter></defs><g filter="url(#mummyShad)"><rect x="48" y="20" width="32" height="80" rx="10" fill="#d6d3d1"/><circle cx="64" cy="35" r="18" fill="#d6d3d1"/><path d="M46 35 L82 35 M46 42 L82 42 M48 60 L80 60 M48 70 L80 70 M48 85 L80 85" stroke="#a8a29e" stroke-width="2"/><path d="M50 100 L40 120 M78 100 L88 120" stroke="#d6d3d1" stroke-width="8" stroke-linecap="round"/><path d="M48 50 L30 70 M80 50 L98 70" stroke="#d6d3d1" stroke-width="8" stroke-linecap="round"/><circle cx="58" cy="35" r="3" fill="#000"/><circle cx="70" cy="35" r="3" fill="#000"/></g></svg>`;
// UPDATED: High Res 512x512
const MONSTER_SCORPION = `<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><ellipse cx="64" cy="70" rx="25" ry="35" fill="#b45309"/><path d="M64 35 L64 20 Q75 10 85 20 L90 30" stroke="#b45309" stroke-width="6" fill="none"/><path d="M90 30 L85 35 L95 35 Z" fill="#78350f"/><path d="M40 70 L20 60 M40 80 L20 90 M88 70 L108 60 M88 80 L108 90" stroke="#92400e" stroke-width="4" stroke-linecap="round"/><circle cx="55" cy="55" r="3" fill="#fcd34d"/><circle cx="73" cy="55" r="3" fill="#fcd34d"/></svg>`;

// ICE MONSTERS - UPDATED: High Res 512x512 AND Fixed Filter Clipping
const MONSTER_YETI = `<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="fur" x="-50%" y="-50%" width="200%" height="200%"><feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter></defs><g filter="url(#fur)"><rect x="34" y="40" width="60" height="70" rx="20" fill="#f1f5f9"/><circle cx="64" cy="40" r="25" fill="#f1f5f9"/></g><path d="M20 50 Q10 70 30 90" stroke="#f1f5f9" stroke-width="12" stroke-linecap="round"/><path d="M108 50 Q118 70 98 90" stroke="#f1f5f9" stroke-width="12" stroke-linecap="round"/><circle cx="55" cy="40" r="4" fill="#1e3a8a"/><circle cx="73" cy="40" r="4" fill="#1e3a8a"/><path d="M60 50 Q64 55 68 50" stroke="#1e3a8a" stroke-width="3" fill="none" opacity="0.6"/><rect x="40" y="80" width="48" height="30" rx="10" fill="#e2e8f0" opacity="0.5"/></svg>`;

const MONSTER_ICE_SPIRIT = `<svg width="512" height="512" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg"><defs><filter id="iceGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#iceGlow)"><path d="M64 20 Q94 20 90 60 Q80 110 64 120 Q48 110 38 60 Q34 20 64 20 Z" fill="#bae6fd" opacity="0.8"/><path d="M64 20 L64 120" stroke="#fff" stroke-width="2" opacity="0.5"/><path d="M38 60 L90 60" stroke="#fff" stroke-width="2" opacity="0.5"/><circle cx="55" cy="50" r="4" fill="#fff"/><circle cx="73" cy="50" r="4" fill="#fff"/></g></svg>`;

// DESERT OBSTACLES
const OBS_CACTUS_UNIQUE = `<svg width="100" height="140" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg"><rect x="40" y="40" width="20" height="90" rx="10" fill="#15803d"/><rect x="45" y="40" width="2" height="90" fill="#14532d" opacity="0.3"/><rect x="55" y="40" width="2" height="90" fill="#14532d" opacity="0.3"/><path d="M40 80 Q20 80 20 60 L20 50" stroke="#15803d" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M60 70 Q80 70 80 50 L80 40" stroke="#15803d" stroke-width="12" fill="none" stroke-linecap="round"/></svg>`;
const OBS_RIBCAGE = `<svg width="120" height="100" viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 90 Q30 20 60 90 Q90 20 110 90" stroke="#e7e5e4" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M30 90 Q40 50 50 90" stroke="#d6d3d1" stroke-width="4" fill="none"/><path d="M70 90 Q80 50 90 90" stroke="#d6d3d1" stroke-width="4" fill="none"/></svg>`;

// ICE OBSTACLES - REPLACED SNOWMAN WITH ICE CRAG
const OBS_ICE_SPIKE = `<svg width="100" height="140" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="spikeGrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#bae6fd"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><path d="M20 130 L40 40 L50 130 Z" fill="url(#spikeGrad)"/><path d="M40 130 L60 20 L70 130 Z" fill="url(#spikeGrad)" opacity="0.9"/><path d="M60 130 L80 60 L90 130 Z" fill="url(#spikeGrad)" opacity="0.8"/></svg>`;
const OBS_ICE_CRAG = `<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="cragGrad" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#1e3a8a"/><stop offset="1" stop-color="#60a5fa"/></linearGradient></defs><path d="M20 130 L50 60 L90 130 Z" fill="url(#cragGrad)"/><path d="M60 130 L100 40 L130 130 Z" fill="url(#cragGrad)" opacity="0.8"/><path d="M50 60 L60 130 L90 130 Z" fill="#93c5fd" opacity="0.4"/><path d="M100 40 L80 130 L130 130 Z" fill="#93c5fd" opacity="0.4"/></svg>`;

// --- WORKSHOP ASSETS ---
const WORKSHOP_BG_DETAILED_SVG = `<svg width="360" height="640" viewBox="0 0 360 640" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="wsGrad" cx="50%" cy="50%" r="90%"><stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#020617"/></radialGradient><pattern id="brickPattern" width="40" height="20" patternUnits="userSpaceOnUse"><path d="M0 20 L40 20 M20 0 L20 20" stroke="#312e81" stroke-width="1" fill="none"/></pattern></defs><rect width="360" height="640" fill="url(#wsGrad)"/><rect width="360" height="640" fill="url(#brickPattern)" opacity="0.3"/><rect x="0" y="500" width="360" height="140" fill="#0f172a"/><path d="M0 500 L360 500" stroke="#4f46e5" stroke-width="2"/></svg>`;
const CRYSTAL_LARGE_SVG = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="crystGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#d8b4fe"/><stop offset="50%" stop-color="#a855f7"/><stop offset="100%" stop-color="#581c87"/><linearGradient><filter id="crystGlow"><feGaussianBlur stdDeviation="5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M100 20 L160 80 L140 160 L60 160 L40 80 Z" fill="url(#crystGrad)" filter="url(#crystGlow)" stroke="#e9d5ff" stroke-width="2"/><path d="M100 20 L100 160 M40 80 L160 80" stroke="#e9d5ff" stroke-width="1" opacity="0.5"/></svg>`;
const BOOK_LECTERN_SVG = `<svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg"><rect x="65" y="80" width="20" height="60" fill="#451a03"/><path d="M40 140 L110 140 L100 80 L50 80 Z" fill="#5c2b08"/><path d="M20 50 Q75 60 130 50 L120 80 Q75 90 30 80 Z" fill="#78350f"/><path d="M25 50 Q75 60 75 80 Q75 60 125 50" fill="#fef3c7"/><path d="M30 55 L70 60 M80 60 L120 55" stroke="#000" stroke-width="1" opacity="0.3"/></svg>`;
const SHELF_SCROLLS_SVG = `<svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="40" width="200" height="10" fill="#5c2b08"/><rect x="0" y="90" width="200" height="10" fill="#5c2b08"/><rect x="20" y="10" width="15" height="30" fill="#fef3c7" stroke="#d4d4d8"/><rect x="40" y="15" width="15" height="25" fill="#e9d5ff" stroke="#a855f7"/><circle cx="80" cy="25" r="10" fill="#3b82f6" opacity="0.5"/><rect x="120" y="60" width="20" height="30" fill="#fca5a5"/><rect x="150" y="55" width="20" height="35" fill="#86efac"/></svg>`;
const PORTAL_GATE_SVG = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="gateGrad"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#2563eb"/></radialGradient></defs><path d="M20 180 L20 40 Q100 -20 180 40 L180 180" stroke="#64748b" stroke-width="15" fill="none"/><path d="M30 180 L30 50 Q100 10 170 50 L170 180" fill="url(#gateGrad)" opacity="0.6"/></svg>`;
const DOOR_EXIT_SVG = `<svg width="100" height="150" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="140" fill="#451a03"/><rect x="15" y="15" width="70" height="130" fill="#5c2b08" stroke="#2b1001" stroke-width="2"/><circle cx="75" cy="80" r="5" fill="#fcd34d"/></svg>`;
const POSTER_RANK_SVG = `<svg width="100" height="140" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="80" height="120" fill="#fefce8" stroke="#d4d4d8"/><rect x="20" y="20" width="60" height="40" fill="#3b82f6" opacity="0.2"/><rect x="25" y="70" width="50" height="5" fill="#94a3b8"/><rect x="25" y="80" width="40" height="5" fill="#94a3b8"/><rect x="25" y="90" width="50" height="5" fill="#94a3b8"/><circle cx="50" cy="110" r="10" fill="#eab308"/></svg>`;

const SPLASH_SCREEN_DEFAULT = `<svg width="360" height="640" viewBox="0 0 360 640" xmlns="http://www.w3.org/2000/svg"><rect width="360" height="640" fill="#020617"/><text x="180" y="280" font-family="serif" font-weight="bold" font-size="40" text-anchor="middle" fill="#a855f7" stroke="#fff" stroke-width="1">ALARA</text><text x="180" y="330" font-family="serif" font-size="30" text-anchor="middle" fill="#d8b4fe" letter-spacing="5">SPIRITS</text><circle cx="180" cy="400" r="20" fill="none" stroke="#a855f7" stroke-width="2"><animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite"/></circle></svg>`;

// ==========================================
// 3. CONFIG EXPORTS
// ==========================================

export const DEFAULT_ASSETS: Record<string, string> = {
    sky: svgToDataUri(SKY_SVG),
    horizon: svgToDataUri(HORIZON_STRIP_SVG),
    ground_jungle: svgToDataUri(GROUND_JUNGLE),
    ground_desert: svgToDataUri(GROUND_DESERT),
    ground_ice: svgToDataUri(GROUND_ICE),
    ground_dimension: svgToDataUri(GROUND_DIMENSION),
    ground_dungeon: svgToDataUri(GROUND_DUNGEON),
    ground_rift: svgToDataUri(GROUND_RIFT), 
    
    player_body_scientist: svgToDataUri(PLAYER_BODY_SCIENTIST),
    player_body_monk: svgToDataUri(PLAYER_BODY_MONK),
    player_body_thief: svgToDataUri(PLAYER_BODY_THIEF),
    player_arms_gun: svgToDataUri(PLAYER_ARMS_GUN),
    player_arms_mage: svgToDataUri(PLAYER_ARMS_MAGE),
    player_arms_dagger: svgToDataUri(PLAYER_ARMS_DAGGER),
    
    // JUNGLE DEFAULT MONSTERS
    monster_blob: svgToDataUri(MONSTER_SLIME),
    monster_gnome: svgToDataUri(MONSTER_VOODOO),
    
    // DESERT UNIQUE MONSTERS
    monster_mummy: svgToDataUri(MONSTER_MUMMY),
    monster_scorpion: svgToDataUri(MONSTER_SCORPION),
    
    // ICE UNIQUE MONSTERS
    monster_yeti: svgToDataUri(MONSTER_YETI),
    monster_ice_spirit: svgToDataUri(MONSTER_ICE_SPIRIT),
    
    monster_boss: svgToDataUri(BOSS_GHOST_SVG),
    
    // JUNGLE OBSTACLES
    obs_tree: svgToDataUri(OBS_JUNGLE_TREE),
    obs_stump: svgToDataUri(OBS_STUMP_SVG),
    obs_bush: svgToDataUri(OBS_GIANT_FERN),
    
    // DESERT OBSTACLES
    obs_cactus: svgToDataUri(OBS_CACTUS_UNIQUE),
    obs_ribcage: svgToDataUri(OBS_RIBCAGE),
    
    // ICE OBSTACLES
    obs_ice_spike: svgToDataUri(OBS_ICE_SPIKE),
    obs_ice_crag: svgToDataUri(OBS_ICE_CRAG),
    
    ectoplasm: svgToDataUri(ECTOPLASM_SVG),
    ectoplasm_time: svgToDataUri(ECTOPLASM_GOLD_SVG),
    
    portal: svgToDataUri(PORTAL_SVG),
    portal_red: svgToDataUri(PORTAL_RED_SVG),
    loadingGhost: svgToDataUri(LOADING_GHOST_SVG),
    spiritRed: svgToDataUri(SPIRIT_RED_SVG),
    shrine: svgToDataUri(SHRINE_SVG),
    
    // WORKSHOP DEFAULTS
    workshop_bg_detailed: CUSTOM_WORKSHOP_BG || svgToDataUri(WORKSHOP_BG_DETAILED_SVG),
    crystal_large: CUSTOM_CRYSTAL || svgToDataUri(CRYSTAL_LARGE_SVG),
    book_lectern: CUSTOM_RECIPE_BOOK || svgToDataUri(BOOK_LECTERN_SVG),
    shelf_scrolls: CUSTOM_SHELF || svgToDataUri(SHELF_SCROLLS_SVG),
    portal_gate: CUSTOM_PORTAL || svgToDataUri(PORTAL_GATE_SVG),
    door_exit: CUSTOM_EXIT_DOOR || svgToDataUri(DOOR_EXIT_SVG),
    poster_rank: CUSTOM_RANKING_POSTER || svgToDataUri(POSTER_RANK_SVG),
    
    splash_screen: CUSTOM_SPLASH_SCREEN || svgToDataUri(SPLASH_SCREEN_DEFAULT),

    // Game loop fallbacks
    crystal: svgToDataUri(CRYSTAL_LARGE_SVG), 
    table: svgToDataUri(BOOK_LECTERN_SVG), 
    tesla_coil: svgToDataUri(TESLA_COIL_SVG),
    
    gun: svgToDataUri(WEAPON_GUN_SVG),
    cleaver: svgToDataUri(WEAPON_CLEAVER_SVG),
    light_sword: svgToDataUri(WEAPON_LIGHT_SWORD_SVG),
};

export const THEMES: ThemeConfig[] = [
    {
        type: 'JUNGLE',
        name: 'Whispering Woods',
        groundColor: '#022c22',
        obstacleKeys: ['obs_tree', 'obs_stump', 'obs_bush'],
        // UNIQUE JUNGLE MONSTERS
        monsterKeys: ['monster_blob', 'monster_gnome'],
        groundPatternKey: 'ground_jungle'
    },
    {
        type: 'DESERT',
        name: 'Sands of Despair',
        groundColor: '#451a03',
        obstacleKeys: ['obs_cactus', 'obs_ribcage'],
        // UNIQUE DESERT MONSTERS
        monsterKeys: ['monster_mummy', 'monster_scorpion'],
        groundPatternKey: 'ground_desert'
    },
    {
        type: 'ICE',
        name: 'Frozen Wastes',
        groundColor: '#0c4a6e',
        obstacleKeys: ['obs_ice_spike', 'obs_ice_crag'],
        // UNIQUE ICE MONSTERS
        monsterKeys: ['monster_yeti', 'monster_ice_spirit'], 
        groundPatternKey: 'ground_ice'
    },
    {
        type: 'DIMENSION',
        name: 'Secret Dimension',
        groundColor: '#020617',
        obstacleKeys: [], 
        monsterKeys: [],
        groundPatternKey: 'ground_rift'
    }
];

export const CLASS_CONFIGS: Record<ClassType, Essence> = {
    SCIENTIST: {
        id: 'base_scientist',
        classType: 'SCIENTIST',
        name: 'The Physicist',
        description: 'Uses high-tech gadgets. <span class="text-[#ef4444]">High DMG</span> but slow.',
        specialDescription: '<b>DOOM</b>: 1.2s Electric Shock. Targets explode on death.',
        stats: { damage: 200, range: 65, speed: 1.0, specialChance: 0.25 }, 
        spriteKeyBody: 'player_body_scientist',
        spriteKeyArms: 'player_arms_gun',
        spriteKeyWeapon: 'gun',
        colorAccent: '#ef4444'
    },
    MONK: {
        id: 'base_monk',
        classType: 'MONK',
        name: 'The Exorcist',
        description: 'Channel spiritual energy. <span class="text-[#facc15]">Fast</span> attack speed.',
        specialDescription: '<b>BERSERK</b>: Double attack & run speed for 4s.',
        stats: { damage: 80, range: 100, speed: 1.2, specialChance: 0.15 }, 
        spriteKeyBody: 'player_body_monk',
        spriteKeyArms: 'player_arms_mage',
        spriteKeyWeapon: 'light_sword',
        colorAccent: '#facc15'
    },
    THIEF: {
        id: 'base_thief',
        classType: 'THIEF',
        name: 'The Rogue',
        description: 'Agile and stealthy. <span class="text-[#22d3ee]">Long Range</span>.',
        specialDescription: '<b>CHAIN</b>: Lightning arcs to nearby enemies.',
        stats: { damage: 120, range: 180, speed: 1.4, specialChance: 0.3 }, 
        spriteKeyBody: 'player_body_thief',
        spriteKeyArms: 'player_arms_dagger',
        spriteKeyWeapon: 'cleaver',
        colorAccent: '#22d3ee'
    }
};

export const INITIAL_LEVEL_CONFIG: LevelConfig = {
    levelNumber: 1,
    monsterCount: 8,
    timeLimit: 60,
    obstacleCount: 5,
    theme: THEMES[0]
};

// --- FILE PROCESSING CONSTANTS ---
export const IGNORED_FOLDERS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.vscode'];
export const IGNORED_FILENAMES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store', 'Thumbs.db'];
export const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.less', '.html', '.json', '.md', '.txt', '.xml', '.svg', '.yml', '.yaml', '.sql', '.graphql'];
