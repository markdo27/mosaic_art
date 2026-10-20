/* ============================================================
   MOSAIC SYSTEM — application
   Assembled from head / engine / tail / ui modules.
   ============================================================ */

/* ---- app-head.js ---- */
'use strict';

/* ============================================================
   MOSAIC SYSTEM — studio application
   A single-page encaustic tile renderer.
   State in, tiles out. No network, no uploads, no dependencies.
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const STORAGE_KEY = 'mosaic-system.v3.state';
const PRESET_KEY = 'mosaic-system.v3.presets';
const PANEL_KEY = 'mosaic-system.v3.panel';
const SEED = 0x5eed1a7e;

/* ------------------------------------------------------------
   State
   ------------------------------------------------------------ */
const DEFAULTS = {
    text: 'AMERICAN\nENCAUSTIC\nTILING CO.',
    font: 'Arial, sans-serif',
    fontScale: 100,
    letterSpacing: 0,
    rotation: 0,
    align: 'center',

    mode: 'text',
    logo: null,
    logoName: '',
    logoScale: 100,
    showContent: true,

    tileStyle: 'beveled',
    tileSize: 12,
    grout: 1.2,
    bevel: 1.5,
    shading: false,
    noise: false,
    variance: 0,

    bg: '#ffffff',
    tileBg: '#e8e8e8',
    face: '#5b7d62',
    shadow: '#c46a58',
    highlight: '#5b7d62',

    band: '#e3dbca',
    borderColor: '#487868',
    borderAccent: '#e3dbca',

    width: 900,
    height: 350,
    autoHeight: true,
    border: 'none',

    textX: 0,
    textY: 0,

    docName: 'Untitled mosaic'
};

const PALETTE_KEYS = ['bg', 'tileBg', 'face', 'shadow', 'highlight', 'band', 'borderColor', 'borderAccent'];

let state = Object.assign({}, DEFAULTS);
let palette = { bg: state.bg, band: state.band, accent: state.borderAccent, border: state.borderColor };

/* Deterministic randomness: preview and export must fire the same tiles. */
let rngState = SEED >>> 0;
function rng() {
    rngState = (rngState + 0x6D2B79F5) >>> 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function resetRandom(seed = SEED) { rngState = seed >>> 0; }

/* ------------------------------------------------------------
   DOM: canvases
   ------------------------------------------------------------ */
const canvas = document.getElementById('mosaicCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const hiddenCanvas = document.createElement('canvas');
const hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });

const canvasScrollArea = document.getElementById('canvasScrollArea');
const canvasFrame = document.getElementById('canvasFrame');
const emptyState = document.getElementById('emptyState');
const renderTimeIndicator = document.getElementById('renderTimeIndicator');
const canvasResIndicator = document.getElementById('canvasResIndicator');
const tileCountIndicator = document.getElementById('tileCount');
const statusSize = document.getElementById('statusSize');
const statusTiles = document.getElementById('statusTiles');
const zoomLabel = document.getElementById('zoomLabel');
const zoomFoot = document.getElementById('zoomFoot');
const toastNotification = document.getElementById('toastNotification');
const busyOverlay = document.getElementById('busyOverlay');
const busyText = document.getElementById('busyText');

/* ------------------------------------------------------------
   HTML inputs
   ------------------------------------------------------------ */
const textInput = document.getElementById('textInput');
const charCount = document.getElementById('charCount');
const textFontSelect = document.getElementById('textFont');
const fontScaleInput = document.getElementById('fontScale');
const letterSpacingInput = document.getElementById('letterSpacing');
const textRotationInput = document.getElementById('textRotation');

const tileStyleGrid = document.getElementById('tileStyleGrid');
const tileStyleNo = document.getElementById('tileStyleNo');
const tileSizeInput = document.getElementById('tileSize');
const groutSizeInput = document.getElementById('groutSize');
const bevelDepthInput = document.getElementById('bevelDepth');
const colorVarianceInput = document.getElementById('colorVariance');
const groutNoiseCheckbox = document.getElementById('groutNoise');
const tileShadingCheckbox = document.getElementById('tileShading');
const tileShadingGroup = document.getElementById('tileShadingGroup');

const bgColorPicker = document.getElementById('bgColor');
const tileBgColorPicker = document.getElementById('tileBgColor');
const faceColorPicker = document.getElementById('faceColor');
const shadowColorPicker = document.getElementById('shadowColor');
const highlightColorPicker = document.getElementById('highlightColor');
const shadowGroup = document.getElementById('shadowGroup');
const highlightGroup = document.getElementById('highlightGroup');

const palettePresetsGrid = document.getElementById('palettePresets');
const randomizePaletteBtn = document.getElementById('randomizePalette');
const savePresetBtn = document.getElementById('savePreset');
const presetCount = document.getElementById('presetCount');

const canvasWidthInput = document.getElementById('canvasWidth');
const canvasHeightInput = document.getElementById('canvasHeight');
const autoHeightCheckbox = document.getElementById('autoHeight');
const sizePresets = document.getElementById('sizePresets');

const borderPatternGrid = document.getElementById('borderPatternGrid');
const borderSettingsGroup = document.getElementById('borderSettingsGroup');
const borderMeta = document.getElementById('borderMeta');
const subwayBandColorPicker = document.getElementById('subwayBandColor');
const subwayBorderColorPicker = document.getElementById('subwayBorderColor');
const subwayHeaderColorPicker = document.getElementById('subwayHeaderColor');
const showTextCheckbox = document.getElementById('showText');

const typographyControls = document.getElementById('typographyControls');
const logoControls = document.getElementById('logoControls');
const logoInput = document.getElementById('logoInput');
const logoScaleInput = document.getElementById('logoScale');
const logoFileNameSpan = document.getElementById('logoFileName');
const logoDrop = document.getElementById('logoDrop');
const textPosReadout = document.getElementById('textPosReadout');

const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const resetBtn = document.getElementById('resetBtn');
const docNameInput = document.getElementById('docName');
const docSaved = document.getElementById('docSaved');

const btnExportPNG = document.getElementById('btnExportPNG');
const btnExportSVG = document.getElementById('btnExportSVG');
const exportScaleSelect = document.getElementById('exportScale');

const railButtons = $$('.rail-btn[data-panel]');
const panel = document.getElementById('panel');
const workspace = document.querySelector('.workspace');
const panelTitle = document.getElementById('panelTitle');
const panelIndex = document.getElementById('panelIndex');
const panelCollapse = document.getElementById('panelCollapse');
const panelReveal = document.getElementById('panelReveal');
const panelPanes = $$('.panel-pane');

const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const zoomFitBtn = document.getElementById('zoomFit');
const copyLinkBtn = document.getElementById('copyLink');
const aboutBtn = document.getElementById('aboutBtn');
const aboutDialog = document.getElementById('aboutDialog');
const aboutClose = document.getElementById('aboutClose');

/* ------------------------------------------------------------
   Small helpers
   ------------------------------------------------------------ */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

// Only weights that each family actually ships — avoids ugly synthetic bolding.
function fontWeightFor(font) {
    if (/Times/.test(font)) return '700';
    if (/Shrikhand/.test(font)) return '400';
    if (/Space Mono/.test(font)) return '700';
    if (/Playfair/.test(font)) return '700';
    if (/Cinzel/.test(font)) return '700';
    if (/Outfit/.test(font)) return '600';
    if (/Montserrat/.test(font)) return '900';
    return '900';
}

function showToast(message, duration = 3200) {
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => toastNotification.classList.remove('show'), duration);
}

function setBusy(isBusy, message = 'Rendering…') {
    busyOverlay.hidden = !isBusy;
    busyText.textContent = message;
    document.body.setAttribute('aria-busy', String(isBusy));
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function slugify(value, fallback = 'mosaic') {
    const slug = String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || fallback;
}

/* ------------------------------------------------------------
   Logo state (kept outside the serialisable studio state)
   ------------------------------------------------------------ */
let loadedLogoImage = null;
let logoMaskRed = null;
let logoMaskGreen = null;
let logoMaskBlue = null;

const defaultLogoSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><path d="M50,5 L95,50 L50,95 L5,50 Z" fill="#000"/><path d="M50,22 L78,50 L50,78 L22,50 Z" fill="#fff"/><circle cx="50" cy="50" r="10" fill="#000"/></svg>`;

/* ------------------------------------------------------------
   Curated palettes
   ------------------------------------------------------------ */
const BUILTIN_PRESETS = [
    { name: 'Cobalt Classic', bg: '#ecece6', tileBg: '#cccabf', face: '#1e3d6b', shadow: '#7ba2cc', highlight: '#edd5b2' },
    { name: 'Art Deco Navy', bg: '#e5dec9', tileBg: '#ccc2ad', face: '#162a45', shadow: '#c98f3c', highlight: '#faebcf' },
    { name: 'Victorian Sage', bg: '#ece7db', tileBg: '#d0c6b3', face: '#3b5842', shadow: '#b2624f', highlight: '#ebd4b0' },
    { name: 'Tuscan Hearth', bg: '#ece3d3', tileBg: '#cca896', face: '#872b22', shadow: '#4d3936', highlight: '#dec08f' },
    { name: 'Mid-Century Olive', bg: '#e4ded2', tileBg: '#cdbfac', face: '#4f5d2f', shadow: '#8b5a2b', highlight: '#ebd09f' },
    { name: 'Retro Flamingo', bg: '#ebdcd3', tileBg: '#cca99c', face: '#d46a78', shadow: '#405d6b', highlight: '#fcedc0' },
    { name: 'Saigon Navy', bg: '#e8e0d5', tileBg: '#c5bfb0', face: '#1e3a5f', shadow: '#7faabf', highlight: '#d4b48c' },
    { name: 'Hội An Terracotta', bg: '#f0e5d8', tileBg: '#d4a88a', face: '#b85230', shadow: '#5a8a6a', highlight: '#f0d090' },
    { name: 'Indochine Gold', bg: '#e8dcc5', tileBg: '#c0a870', face: '#1a2d4a', shadow: '#c08828', highlight: '#f0e0a8' },
    { name: 'Đà Lạt Coral', bg: '#f5e5e0', tileBg: '#d4a09a', face: '#c03858', shadow: '#e87050', highlight: '#fce4b0' },
    { name: 'Hanoi Rosette', bg: '#dde8f0', tileBg: '#a8c5d8', face: '#185878', shadow: '#c8a030', highlight: '#e8f2f8' },
    { name: 'Mekong Baroque', bg: '#ede8d5', tileBg: '#c5b082', face: '#4a2808', shadow: '#3a8880', highlight: '#e8d0a0' }
];

let customPresets = [];

function allPresets() { return BUILTIN_PRESETS.concat(customPresets); }

/* ---- engine.js ---- */
// Build a single-colour stencil from an image.
// Transparent artwork keeps its own alpha; opaque artwork (JPEG, white-background
// PNG) is keyed out by luminance so the mark survives instead of becoming a block.
function createColorMask(img, color) {
    const MAX = 2048;
    const ratio = Math.min(1, MAX / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * ratio));
    const h = Math.max(1, Math.round(img.height * ratio));

    const mCanvas = document.createElement('canvas');
    mCanvas.width = w;
    mCanvas.height = h;
    const mCtx = mCanvas.getContext('2d', { willReadFrequently: true });
    mCtx.drawImage(img, 0, 0, w, h);

    const imgData = mCtx.getImageData(0, 0, w, h);
    const d = imgData.data;
    let hasAlpha = false;
    for (let i = 3; i < d.length; i += 4) {
        if (d[i] < 250) { hasAlpha = true; break; }
    }

    const rgb = color.match(/\d+/g).map(Number);
    // Luminance keying: map near-white to fully transparent and near-black to
    // fully opaque, so white-background exports (JPEG, flattened PNG) do not
    // become a solid block of tiles.
    const BLACK_POINT = 28;
    const WHITE_POINT = 232;
    for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3] / 255;
        let alpha;
        if (hasAlpha) {
            alpha = a;
        } else {
            const lum = Math.min(d[i], d[i + 1], d[i + 2]);
            alpha = Math.max(0, Math.min(1, (WHITE_POINT - lum) / (WHITE_POINT - BLACK_POINT)));
            if (alpha < 0.06) alpha = 0;
        }
        d[i] = rgb[0];
        d[i + 1] = rgb[1];
        d[i + 2] = rgb[2];
        d[i + 3] = Math.round(255 * alpha);
    }
    mCtx.putImageData(imgData, 0, 0);
    return mCanvas;
}

function createLogoMasks(img) {
    logoMaskRed = createColorMask(img, 'rgb(255, 0, 0)');
    logoMaskGreen = createColorMask(img, 'rgb(0, 255, 0)');
    logoMaskBlue = createColorMask(img, 'rgb(0, 0, 255)');
}

// Convert Hex to HSL
function hexToHsl(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

// Generate slight color shift. Accepts hex only � hsl() strings from the border
// patterns are passed through untouched, otherwise hexToHsl() would produce NaN.
function getVariantColor(hex, variancePercent) {
    if (variancePercent === 0 || typeof hex !== 'string' || hex.charAt(0) !== '#') return hex;
    const hsl = hexToHsl(hex);
    const hVar = (rng() - 0.5) * (variancePercent * 1.5);
    const sVar = (rng() - 0.5) * (variancePercent * 2.0);
    const lVar = (rng() - 0.5) * (variancePercent * 2.0);
    let h = Math.max(0, Math.min(360, hsl.h + hVar));
    let s = Math.max(0, Math.min(100, hsl.s + sVar));
    let l = Math.max(0, Math.min(100, hsl.l + lVar));
    return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

// Render sand grain noise onto grout background.
// The 128x128 texture is cached per colour � it used to be rebuilt every frame.
let noiseCache = { key: null, pattern: null };
function createNoisePattern(colorHex, hostCtx) {
    if (noiseCache.key === colorHex && noiseCache.pattern) return noiseCache.pattern;
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 128; noiseCanvas.height = 128;
    const nCtx = noiseCanvas.getContext('2d');
    nCtx.fillStyle = colorHex; nCtx.fillRect(0, 0, 128, 128);
    const imgData = nCtx.getImageData(0, 0, 128, 128);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (rng() - 0.5) * 12;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
        data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
    }
    nCtx.putImageData(imgData, 0, 0);
    const pattern = hostCtx.createPattern(noiseCanvas, 'repeat');
    noiseCache = { key: colorHex, pattern };
    return pattern;
}

// ============================================================
// BORDER PATTERN HELPERS
// ============================================================

function getBorderVariant(x, y, tileSize) {
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    const hash = Math.abs(Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1;
    const hsl = hexToHsl(palette.border);
    let hShift = 0, lShift = 0;
    if (hash < 0.35) { hShift = -4; lShift = -5; }
    else if (hash < 0.7) { hShift = 4; lShift = 5; }
    let h = Math.max(0, Math.min(360, hsl.h + hShift));
    let s = Math.max(0, Math.min(100, hsl.s));
    let l = Math.max(0, Math.min(100, hsl.l + lShift));
    return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

function getBellOrnamentColor(relX, relY) {
    const gold = '#cca05a', green = '#1a3b2b', cream = palette.accent;
    if (relY === 0 || relY === 5) return cream;
    if (relY === 1) return relX === 2 ? green : cream;
    if (relY === 2) { if (relX === 2) return gold; if (relX === 1 || relX === 3) return green; return cream; }
    if (relY === 3) { if (relX >= 1 && relX <= 3) return gold; if (relX === 0 || relX === 4) return green; return cream; }
    if (relY === 4) { if (relX === 2) return gold; if (relX === 1 || relX === 3) return green; return cream; }
    return cream;
}

// Helper: sample pixel and return text color or null
function sampleTextColor(data, x, y, canvasWidth, canvasHeight, is3DMode, faceColor, shadowColor, highlightColor) {
    const sx = Math.max(0, Math.min(canvasWidth - 1, Math.floor(x)));
    const sy = Math.max(0, Math.min(canvasHeight - 1, Math.floor(y)));
    const idx = (sy * canvasWidth + sx) * 4;
    const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
    if (a > 50) {
        if (is3DMode) {
            if (r > g && r > b) return faceColor;
            if (g > r && g > b) return shadowColor;
            if (b > r && b > g) return highlightColor;
            return faceColor;
        }
        return faceColor;
    }
    return null;
}

// ============================================================
// PATTERN 1: NYC SUBWAY MOSAIC
// ============================================================
function getSubwayTileColor(x, y, data, cw, ch, cx, cy, tbYs, tbYe, topYs, botYe, ts, bRows, is3D, fc, sc, hc, bg) {
    const bandC = palette.band, accentC = palette.accent;
    if (y >= tbYs && y < tbYe) {
        const col = Math.floor(x / ts), totalCols = Math.floor(cw / ts);
        const sp = Math.max(3, Math.min(6, Math.floor(totalCols * 0.06)));
        if (col < sp) { if (col === sp - 1) return '#1a3b2b'; return getBellOrnamentColor(col % 5, Math.floor((y - tbYs) / ts) % 6); }
        const cfr = totalCols - 1 - col;
        if (cfr < sp) { if (cfr === sp - 1) return '#1a3b2b'; return getBellOrnamentColor(cfr % 5, Math.floor((y - tbYs) / ts) % 6); }
        const tc = sampleTextColor(data, x, y, cw, ch, is3D, fc, sc, hc);
        return tc !== null ? tc : bandC;
    }
    if (y >= topYs && y < tbYs) {
        const row = Math.floor((y - topYs) / ts), ar = Math.max(1, Math.floor(bRows * 0.2));
        if (row < ar || row >= bRows - ar) return getBorderVariant(x, y, ts);
        const vf = Math.max(ts * 10, cw / 5), ph = (x % vf) / vf;
        const vcr = topYs + ts * (ar + (bRows - ar * 2) / 2);
        const va = ts * Math.max(1, (bRows - ar * 2) * 0.2);
        const vy = vcr + Math.sin(ph * Math.PI * 2) * va;
        if (Math.abs(y - vy) < ts * 0.6) return accentC;
        const l1cx = vf * 0.25, l1cy = vcr + va - ts, l2cx = vf * 0.75, l2cy = vcr - va + ts;
        const dx1 = (x % vf) - l1cx, dy1 = y - l1cy, dx2 = (x % vf) - l2cx, dy2 = y - l2cy;
        if ((dx1*dx1)/(ts*ts*2.5)+(dy1*dy1)/(ts*ts*0.8) < 1 || (dx2*dx2)/(ts*ts*2.5)+(dy2*dy2)/(ts*ts*0.8) < 1) return accentC;
        return '#1a3b2b';
    }
    if (y >= tbYe && y < botYe) {
        const row = Math.floor((y - tbYe) / ts), cr = Math.max(1, Math.floor(bRows * 0.2)), ar = Math.max(1, Math.floor(bRows * 0.2));
        if (row < cr) { const col = Math.floor(x / ts); return (col + row) % 2 === 0 ? '#1a3b2b' : accentC; }
        if (row >= bRows - ar) return getBorderVariant(x, y, ts);
        const col = Math.floor(x / ts), pr = Math.max(6, Math.floor(cw / ts / 8));
        const rc = col % pr, rr = row - cr, pir = bRows - cr - ar;
        if (rc === 0) return '#1a3b2b';
        if (Math.abs(rc - pr / 2) + Math.abs(rr - pir / 2) <= Math.min(pr, pir) / 2.5) return '#cca05a';
        return accentC;
    }
    return bg;
}

// ============================================================
// PATTERN 2: GREEK KEY MEANDER
// ============================================================
function getGreekKeyTileColor(x, y, data, cw, ch, cx, cy, tbYs, tbYe, topYs, botYe, ts, bRows, is3D, fc, sc, hc, bg) {
    const borderC = palette.border, accentC = palette.accent, bandC = palette.band;
    if (y >= tbYs && y < tbYe) {
        const tc = sampleTextColor(data, x, y, cw, ch, is3D, fc, sc, hc);
        return tc !== null ? tc : bandC;
    }
    if ((y >= topYs && y < tbYs) || (y >= tbYe && y < botYe)) {
        const bs = y < tbYs ? topYs : tbYe;
        const row = Math.floor((y - bs) / ts), col = Math.floor(x / ts);
        if (row === 0 || row === bRows - 1) return borderC;
        const kw = Math.max(6, Math.min(12, Math.floor(cw / ts / 8)));
        const innerR = bRows - 2;
        const rc = ((col % kw) + kw) % kw, rr = row - 1;
        const hH = Math.floor(innerR / 2);
        if (rr === 0 || rr === innerR - 1) return borderC;
        if (rc === 0) return borderC;
        if (rc === kw - 1 && rr <= hH) return borderC;
        if (rc === 1 && rr > hH) return borderC;
        if (rr === hH && rc >= 1 && rc < kw - 1) return borderC;
        if (rr === 1 && rc <= Math.floor(kw * 0.6)) return borderC;
        if (rr === innerR - 2 && rc >= Math.floor(kw * 0.4)) return borderC;
        return accentC;
    }
    return bg;
}

// ============================================================
// PATTERN 3: ART DECO GEOMETRIC
// ============================================================
function getArtDecoTileColor(x, y, data, cw, ch, cx, cy, tbYs, tbYe, topYs, botYe, ts, bRows, is3D, fc, sc, hc, bg) {
    const borderC = palette.border, accentC = palette.accent, bandC = palette.band;
    if (y >= tbYs && y < tbYe) {
        const col = Math.floor(x / ts), totalCols = Math.floor(cw / ts);
        const sw = Math.max(2, Math.floor(totalCols * 0.03));
        if (col < sw || (totalCols - 1 - col) < sw) return col % 2 === 0 ? borderC : '#cca05a';
        const tc = sampleTextColor(data, x, y, cw, ch, is3D, fc, sc, hc);
        return tc !== null ? tc : bandC;
    }
    if (y >= topYs && y < tbYs) {
        const row = Math.floor((y - topYs) / ts);
        if (row === 0 || row === bRows - 1) return borderC;
        const fw = Math.max(ts * 8, cw / 6);
        const fcx = Math.floor(x / fw) * fw + fw / 2;
        const dx = x - fcx, dy = y - tbYs;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dx, -dy);
        const rw = ts * 2;
        const ri = Math.floor(dist / rw), ra = Math.PI / 8;
        const rai = Math.floor((angle + Math.PI) / ra);
        if ((ri % 2 === 0 && rai % 2 === 0) || (ri % 2 === 1 && rai % 2 === 1)) return borderC;
        return accentC;
    }
    if (y >= tbYe && y < botYe) {
        const row = Math.floor((y - tbYe) / ts);
        if (row === 0 || row === bRows - 1) return borderC;
        const chW = Math.max(ts * 6, cw / 8);
        const rx = ((x % chW) + chW) % chW, ry = y - tbYe;
        const chH = (bRows - 2) * ts;
        const nx = Math.abs(rx - chW / 2) / (chW / 2), ny = ry / chH;
        const cd = Math.abs(nx - ny), sw = 0.2;
        if (Math.floor(cd / sw) % 2 === 0) return borderC;
        return accentC;
    }
    return bg;
}

// ============================================================
// PATTERN 4: VICTORIAN FLOURISH
// ============================================================
function getVictorianTileColor(x, y, data, cw, ch, cx, cy, tbYs, tbYe, topYs, botYe, ts, bRows, is3D, fc, sc, hc, bg) {
    const borderC = palette.border, accentC = palette.accent, bandC = palette.band;
    if (y >= tbYs && y < tbYe) {
        const col = Math.floor(x / ts), totalCols = Math.floor(cw / ts);
        const rw = Math.max(2, Math.floor(totalCols * 0.04));
        if (col < rw || (totalCols - 1 - col) < rw) {
            const rowB = Math.floor((y - tbYs) / ts);
            const rc = col < rw ? col : (totalCols - 1 - col);
            if ((rc + rowB) % 3 === 0) return '#cca05a';
            if ((rc + rowB) % 3 === 1) return borderC;
            return accentC;
        }
        const tc = sampleTextColor(data, x, y, cw, ch, is3D, fc, sc, hc);
        return tc !== null ? tc : bandC;
    }
    if (y >= topYs && y < tbYs) {
        const row = Math.floor((y - topYs) / ts);
        if (row === 0 || row === bRows - 1) return borderC;
        if (row === 1 || row === bRows - 2) return getBorderVariant(x, y, ts);
        const ms = Math.max(ts * 8, cw / 6);
        const mcx = Math.floor(x / ms) * ms + ms / 2;
        const mcy = topYs + (bRows * ts) / 2;
        const dx = x - mcx, dy = y - mcy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mr = Math.min(ms * 0.35, (bRows - 4) * ts * 0.45);
        if (dist < mr * 0.4) return '#cca05a';
        if (dist < mr * 0.6) return borderC;
        if (dist < mr * 0.8) return accentC;
        if (dist < mr) return borderC;
        const ds = ts * 3, dotX = x % ds, dotY = (y - topYs) % ds;
        if (Math.sqrt((dotX - ds/2)**2 + (dotY - ds/2)**2) < ts * 0.4) return borderC;
        return accentC;
    }
    if (y >= tbYe && y < botYe) {
        const row = Math.floor((y - tbYe) / ts);
        if (row === 0 || row === bRows - 1) return borderC;
        if (row === 1 || row === bRows - 2) return getBorderVariant(x, y, ts);
        const sw = Math.max(ts * 6, cw / 10);
        const scx = Math.floor(x / sw) * sw + sw / 2;
        const scy = tbYe + ts * 2;
        const dx = x - scx, dy = y - scy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const sr = sw * 0.45;
        if (dist > sr - ts && dist < sr) return borderC;
        if (dist > sr - ts * 2 && dist < sr - ts) return '#cca05a';
        return accentC;
    }
    return bg;
}

// ============================================================
// PATTERN 5: VIETNAMESE ENCAUSTIC
// ============================================================

// Returns base tile color for the border zone (motif overlay drawn separately)
function getVietnameseTileColor(x, y, data, cw, ch, cx, cy, tbYs, tbYe, topYs, botYe, ts, bRows, is3D, fc, sc, hc, bg) {
    const bandC = palette.band;
    // Text band: sample text color as usual
    if (y >= tbYs && y < tbYe) {
        const tc = sampleTextColor(data, x, y, cw, ch, is3D, fc, sc, hc);
        return tc !== null ? tc : bandC;
    }
    // Border bands: flat band color — motifs overlaid in renderVietnameseBands()
    return bandC;
}

/**
 * Draw one Vietnamese encaustic tile motif (6 distinct types cycling mod 6).
 * Motif types are inspired by the 12 patterns in the reference photo.
 * @param {CanvasRenderingContext2D} tCtx
 * @param {number} tx  top-left x of the cell
 * @param {number} ty  top-left y of the cell
 * @param {number} cs  cell size (square)
 * @param {number} motifIdx  cycling index (mod 6 used internally)
 * @param {string} bgC   background cut-out color
 * @param {string} priC  primary motif color
 * @param {string} secC  secondary / field color
 * @param {string} accC  accent / highlight color
 */
function drawVietnameseMotif(tCtx, tx, ty, cs, motifIdx, bgC, priC, secC, accC) {
    const cmx = tx + cs / 2, cmy = ty + cs / 2;
    const r   = cs * 0.46;
    const lw  = Math.max(1, cs * 0.042);

    tCtx.save();
    tCtx.beginPath();
    tCtx.rect(tx, ty, cs, cs);
    tCtx.clip();

    // Solid cell background (overrides the small-tile grid lines for a clean canvas)
    tCtx.fillStyle = secC;
    tCtx.fillRect(tx, ty, cs, cs);

    // Thin outer frame line around the full cell
    tCtx.strokeStyle = priC;
    tCtx.lineWidth = Math.max(1, lw * 0.7);
    tCtx.strokeRect(tx + lw, ty + lw, cs - lw * 2, cs - lw * 2);

    switch (motifIdx % 6) {

        // ── 0  Compass Rose  (Tile 1 from photo) ──────────────────────────
        // Navy ring of petals, corner accent circles, concentric borders
        case 0: {
            // Outer & inner concentric rings
            tCtx.strokeStyle = priC; tCtx.lineWidth = lw;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.90, 0, Math.PI * 2); tCtx.stroke();
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.66, 0, Math.PI * 2); tCtx.stroke();

            // 4 elliptical petals at N / S / E / W
            tCtx.fillStyle = priC;
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i - Math.PI / 2;
                tCtx.save();
                tCtx.translate(cmx + Math.cos(a) * r * 0.33, cmy + Math.sin(a) * r * 0.33);
                tCtx.rotate(a + Math.PI / 2);
                tCtx.beginPath();
                tCtx.ellipse(0, 0, r * 0.16, r * 0.28, 0, 0, Math.PI * 2);
                tCtx.fill();
                tCtx.restore();
            }

            // 4 accent circles at diagonal corners
            tCtx.fillStyle = accC;
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i - Math.PI / 4;
                tCtx.beginPath();
                tCtx.arc(cmx + Math.cos(a) * r * 0.62, cmy + Math.sin(a) * r * 0.62, r * 0.12, 0, Math.PI * 2);
                tCtx.fill();
            }

            // Center medallion
            tCtx.fillStyle = priC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.18, 0, Math.PI * 2); tCtx.fill();
            tCtx.fillStyle = secC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.09, 0, Math.PI * 2); tCtx.fill();
            break;
        }

        // ── 1  Baroque Cross  (Tile 2 from photo) ─────────────────────────
        // Dark-brown 4-armed cross with knobbed terminals; teal star center
        case 1: {
            // Corner accent fills (yellow in photo)
            tCtx.fillStyle = accC;
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i + Math.PI / 4;
                tCtx.beginPath();
                tCtx.arc(cmx + Math.cos(a) * r * 0.72, cmy + Math.sin(a) * r * 0.72, r * 0.28, 0, Math.PI * 2);
                tCtx.fill();
            }

            // 4 arms + terminal knobs (dark primary color)
            tCtx.fillStyle = priC;
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i - Math.PI / 2;
                tCtx.save();
                tCtx.translate(cmx, cmy);
                tCtx.rotate(a);
                // Arm shaft
                tCtx.beginPath();
                tCtx.rect(-lw * 1.8, 0, lw * 3.6, r * 0.68);
                tCtx.fill();
                // Terminal knob
                tCtx.beginPath(); tCtx.arc(0,        r * 0.72, r * 0.13, 0, Math.PI * 2); tCtx.fill();
                // Side buds on the terminal
                tCtx.beginPath(); tCtx.arc(-r * 0.15, r * 0.64, r * 0.09, 0, Math.PI * 2); tCtx.fill();
                tCtx.beginPath(); tCtx.arc( r * 0.15, r * 0.64, r * 0.09, 0, Math.PI * 2); tCtx.fill();
                tCtx.restore();
            }

            // Central 12-point star (teal/cyan accent)
            tCtx.fillStyle = accC;
            tCtx.beginPath();
            for (let i = 0; i < 12; i++) {
                const a  = (Math.PI / 6) * i;
                const rr = i % 2 === 0 ? r * 0.22 : r * 0.11;
                const px = cmx + Math.cos(a) * rr, py = cmy + Math.sin(a) * rr;
                i === 0 ? tCtx.moveTo(px, py) : tCtx.lineTo(px, py);
            }
            tCtx.closePath(); tCtx.fill();

            // Center eye
            tCtx.fillStyle = bgC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.08, 0, Math.PI * 2); tCtx.fill();
            break;
        }

        // ── 2  Clover Arcs  (Tile 4 from photo) ──────────────────────────
        // Terracotta overlapping arcs, sage corner diamonds, ivory cutout
        case 2: {
            // 4 large circular petal arcs at N/S/E/W
            tCtx.fillStyle = priC;
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i;
                tCtx.beginPath();
                tCtx.arc(cmx + Math.cos(a) * r * 0.38, cmy + Math.sin(a) * r * 0.38, r * 0.40, 0, Math.PI * 2);
                tCtx.fill();
            }

            // Reveal inner background circle (creates the clover hole)
            tCtx.fillStyle = secC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.28, 0, Math.PI * 2); tCtx.fill();

            // Corner pointed diamond leaves (accent = sage in photo)
            tCtx.fillStyle = accC;
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i + Math.PI / 4;
                tCtx.save();
                tCtx.translate(cmx + Math.cos(a) * r * 0.76, cmy + Math.sin(a) * r * 0.76);
                tCtx.rotate(a + Math.PI / 4);
                tCtx.beginPath();
                tCtx.moveTo(0, -r * 0.20);
                tCtx.lineTo(r * 0.11, 0);
                tCtx.lineTo(0,  r * 0.20);
                tCtx.lineTo(-r * 0.11, 0);
                tCtx.closePath();
                tCtx.fill();
                tCtx.restore();
            }

            // Center dot accent
            tCtx.fillStyle = accC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.14, 0, Math.PI * 2); tCtx.fill();
            break;
        }

        // ── 3  Fleur-de-lis Quatrefoil  (Tile 8 from photo) ───────────────
        // Deep navy fleur shapes on terracotta; gold center circle
        case 3: {
            // Corner ornament dots
            tCtx.fillStyle = accC;
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i + Math.PI / 4;
                tCtx.beginPath();
                tCtx.arc(cmx + Math.cos(a) * r * 0.82, cmy + Math.sin(a) * r * 0.82, r * 0.13, 0, Math.PI * 2);
                tCtx.fill();
            }

            // 4 fleur-de-lis symbols (primary = navy in photo)
            tCtx.fillStyle = priC;
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i - Math.PI / 2;
                tCtx.save();
                tCtx.translate(cmx, cmy);
                tCtx.rotate(a);
                // Main upward petal
                tCtx.beginPath(); tCtx.ellipse(0, -r * 0.54, r * 0.16, r * 0.24, 0, 0, Math.PI * 2); tCtx.fill();
                // Left wing
                tCtx.beginPath(); tCtx.ellipse(-r * 0.18, -r * 0.37, r * 0.13, r * 0.15, -0.38, 0, Math.PI * 2); tCtx.fill();
                // Right wing
                tCtx.beginPath(); tCtx.ellipse( r * 0.18, -r * 0.37, r * 0.13, r * 0.15,  0.38, 0, Math.PI * 2); tCtx.fill();
                // Stem
                tCtx.beginPath(); tCtx.rect(-lw * 1.1, -r * 0.28, lw * 2.2, r * 0.28); tCtx.fill();
                tCtx.restore();
            }

            // Central double-circle (gold accent + primary inner)
            tCtx.fillStyle = accC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.25, 0, Math.PI * 2); tCtx.fill();
            tCtx.fillStyle = priC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.15, 0, Math.PI * 2); tCtx.fill();
            break;
        }

        // ── 4  Star Rosette  (Tile 11 from photo) ────────────────────────
        // Sky-blue background; gold/yellow 8-pointed star; white dot ring
        case 4: {
            // Outer accent ring
            tCtx.strokeStyle = priC; tCtx.lineWidth = lw * 0.85;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.88, 0, Math.PI * 2); tCtx.stroke();

            // 8-pointed star (primary color)
            tCtx.fillStyle = priC;
            tCtx.beginPath();
            for (let i = 0; i < 16; i++) {
                const a  = (Math.PI / 8) * i - Math.PI / 2;
                const rr = i % 2 === 0 ? r * 0.76 : r * 0.36;
                const px = cmx + Math.cos(a) * rr, py = cmy + Math.sin(a) * rr;
                i === 0 ? tCtx.moveTo(px, py) : tCtx.lineTo(px, py);
            }
            tCtx.closePath(); tCtx.fill();

            // White dot ring (8 dots at mid-radius)
            tCtx.fillStyle = bgC;
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI / 4) * i;
                tCtx.beginPath();
                tCtx.arc(cmx + Math.cos(a) * r * 0.56, cmy + Math.sin(a) * r * 0.56, r * 0.075, 0, Math.PI * 2);
                tCtx.fill();
            }

            // Center: accent circle then sec cutout
            tCtx.fillStyle = accC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.23, 0, Math.PI * 2); tCtx.fill();
            tCtx.fillStyle = secC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.13, 0, Math.PI * 2); tCtx.fill();
            break;
        }

        // ── 5  Sunburst Medallion  (Tiles 7 & 12 from photo) ─────────────
        // Radiating 12 petals; ring; central nested circles with dot accents
        case 5: {
            // 12 radiating petals
            tCtx.fillStyle = priC;
            for (let i = 0; i < 12; i++) {
                const a = (Math.PI / 6) * i;
                tCtx.save();
                tCtx.translate(cmx, cmy);
                tCtx.rotate(a);
                tCtx.beginPath();
                tCtx.ellipse(0, -r * 0.60, r * 0.11, r * 0.27, 0, 0, Math.PI * 2);
                tCtx.fill();
                tCtx.restore();
            }

            // Inner secondary field circle
            tCtx.fillStyle = secC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.38, 0, Math.PI * 2); tCtx.fill();

            // Accent ring stroke
            tCtx.strokeStyle = priC; tCtx.lineWidth = lw * 1.3;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.38, 0, Math.PI * 2); tCtx.stroke();

            // 8 small dot accents just inside the ring
            tCtx.fillStyle = accC;
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI / 4) * i;
                tCtx.beginPath();
                tCtx.arc(cmx + Math.cos(a) * r * 0.52, cmy + Math.sin(a) * r * 0.52, r * 0.07, 0, Math.PI * 2);
                tCtx.fill();
            }

            // Center nested circles
            tCtx.fillStyle = priC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.26, 0, Math.PI * 2); tCtx.fill();
            tCtx.fillStyle = accC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.15, 0, Math.PI * 2); tCtx.fill();
            tCtx.fillStyle = secC;
            tCtx.beginPath(); tCtx.arc(cmx, cmy, r * 0.07, 0, Math.PI * 2); tCtx.fill();
            break;
        }
    }

    tCtx.restore();
}

/**
 * Render Vietnamese encaustic tile motifs as an overlay on the top and bottom border bands.
 * Called after the base tile grid has been drawn inside renderMosaic().
 */
function renderVietnameseBands(targetCtx, topYStart, tbYStart, tbYEnd, botYEnd, cw, bandH, groutSize) {
    if (bandH < 12) return; // too thin to draw anything useful
    const cs   = bandH;   // each Vietnamese tile = square with side = full band height
    const priC = palette.border;
    const secC = palette.band;
    const accC = palette.accent;
    const bgC  = palette.bg;

    // Draw top band, then bottom band
    const bands = [
        { y: topYStart, label: 0 },
        { y: tbYEnd,    label: 3 }  // offset bottom motif sequence by 3
    ];
    for (const { y: by, label } of bands) {
        for (let x = 0; x < cw; x += cs) {
            const availW = cw - x;
            if (availW < cs * 0.2) continue; // skip hairline slivers
            const motifIdx = Math.floor(x / cs) + label;
            drawVietnameseMotif(targetCtx, x, by, Math.min(cs, availW), motifIdx, bgC, priC, secC, accC);
        }
    }
}

/**
 * Generate the SVG elements for a Vietnamese encaustic tile motif.
 * Mirrors drawVietnameseMotif() for vector export.
 */
function getVietnameseMotifSVGString(tx, ty, cs, motifIdx, bgC, priC, secC, accC) {
    const cmx = tx + cs / 2, cmy = ty + cs / 2;
    const r   = cs * 0.46;
    const lw  = Math.max(1, cs * 0.042);
    
    const clipId = `clip-viet-${tx.toFixed(0)}-${ty.toFixed(0)}`;
    let s = `    <clipPath id="${clipId}">\n      <rect x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" width="${cs.toFixed(1)}" height="${cs.toFixed(1)}" />\n    </clipPath>\n`;
    s += `    <g clip-path="url(#${clipId})">\n`;
    
    // Solid cell background
    s += `      <rect x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" width="${cs.toFixed(1)}" height="${cs.toFixed(1)}" fill="${secC}" />\n`;
    
    // Thin outer frame line
    s += `      <rect x="${(tx + lw).toFixed(1)}" y="${(ty + lw).toFixed(1)}" width="${(cs - lw * 2).toFixed(1)}" height="${(cs - lw * 2).toFixed(1)}" fill="none" stroke="${priC}" stroke-width="${(lw * 0.7).toFixed(2)}" />\n`;
    
    switch (motifIdx % 6) {
        case 0: { // Compass Rose
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.90).toFixed(1)}" fill="none" stroke="${priC}" stroke-width="${lw.toFixed(2)}" />\n`;
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.66).toFixed(1)}" fill="none" stroke="${priC}" stroke-width="${lw.toFixed(2)}" />\n`;
            
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i - Math.PI / 2;
                const px = cmx + Math.cos(a) * r * 0.33;
                const py = cmy + Math.sin(a) * r * 0.33;
                const rot = (a + Math.PI / 2) * 180 / Math.PI;
                s += `      <ellipse cx="0" cy="0" rx="${(r * 0.16).toFixed(1)}" ry="${(r * 0.28).toFixed(1)}" fill="${priC}" transform="translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot.toFixed(1)})" />\n`;
            }
            
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i - Math.PI / 4;
                const px = cmx + Math.cos(a) * r * 0.62;
                const py = cmy + Math.sin(a) * r * 0.62;
                s += `      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(r * 0.12).toFixed(1)}" fill="${accC}" />\n`;
            }
            
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.18).toFixed(1)}" fill="${priC}" />\n`;
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.09).toFixed(1)}" fill="${secC}" />\n`;
            break;
        }
        case 1: { // Baroque Cross
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i + Math.PI / 4;
                const px = cmx + Math.cos(a) * r * 0.72;
                const py = cmy + Math.sin(a) * r * 0.72;
                s += `      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(r * 0.28).toFixed(1)}" fill="${accC}" />\n`;
            }
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i - Math.PI / 2;
                const rot = a * 180 / Math.PI;
                s += `      <g transform="translate(${cmx.toFixed(1)}, ${cmy.toFixed(1)}) rotate(${rot.toFixed(1)})">\n`;
                s += `        <rect x="${(-lw * 1.8).toFixed(1)}" y="0" width="${(lw * 3.6).toFixed(1)}" height="${(r * 0.68).toFixed(1)}" fill="${priC}" />\n`;
                s += `        <circle cx="0" cy="${(r * 0.72).toFixed(1)}" r="${(r * 0.13).toFixed(1)}" fill="${priC}" />\n`;
                s += `        <circle cx="${(-r * 0.15).toFixed(1)}" cy="${(r * 0.64).toFixed(1)}" r="${(r * 0.09).toFixed(1)}" fill="${priC}" />\n`;
                s += `        <circle cx="${(r * 0.15).toFixed(1)}" cy="${(r * 0.64).toFixed(1)}" r="${(r * 0.09).toFixed(1)}" fill="${priC}" />\n`;
                s += `      </g>\n`;
            }
            let starPts = [];
            for (let i = 0; i < 12; i++) {
                const a  = (Math.PI / 6) * i;
                const rr = i % 2 === 0 ? r * 0.22 : r * 0.11;
                starPts.push(`${(cmx + Math.cos(a) * rr).toFixed(1)},${(cmy + Math.sin(a) * rr).toFixed(1)}`);
            }
            s += `      <polygon points="${starPts.join(' ')}" fill="${accC}" />\n`;
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.08).toFixed(1)}" fill="${bgC}" />\n`;
            break;
        }
        case 2: { // Clover Arcs
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i;
                const px = cmx + Math.cos(a) * r * 0.38;
                const py = cmy + Math.sin(a) * r * 0.38;
                s += `      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(r * 0.40).toFixed(1)}" fill="${priC}" />\n`;
            }
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.28).toFixed(1)}" fill="${secC}" />\n`;
            
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i + Math.PI / 4;
                const px = cmx + Math.cos(a) * r * 0.76;
                const py = cmy + Math.sin(a) * r * 0.76;
                const rot = (a + Math.PI / 4) * 180 / Math.PI;
                s += `      <polygon points="0,${(-r * 0.20).toFixed(1)} ${(r * 0.11).toFixed(1)},0 0,${(r * 0.20).toFixed(1)} ${(-r * 0.11).toFixed(1)},0" fill="${accC}" transform="translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot.toFixed(1)})" />\n`;
            }
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.14).toFixed(1)}" fill="${accC}" />\n`;
            break;
        }
        case 3: { // Fleur-de-lis Quatrefoil
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i + Math.PI / 4;
                const px = cmx + Math.cos(a) * r * 0.82;
                const py = cmy + Math.sin(a) * r * 0.82;
                s += `      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(r * 0.13).toFixed(1)}" fill="${accC}" />\n`;
            }
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI / 2) * i - Math.PI / 2;
                const rot = a * 180 / Math.PI;
                s += `      <g transform="translate(${cmx.toFixed(1)}, ${cmy.toFixed(1)}) rotate(${rot.toFixed(1)})">\n`;
                s += `        <ellipse cx="0" cy="${(-r * 0.54).toFixed(1)}" rx="${(r * 0.16).toFixed(1)}" ry="${(r * 0.24).toFixed(1)}" fill="${priC}" />\n`;
                s += `        <ellipse cx="${(-r * 0.18).toFixed(1)}" cy="${(-r * 0.37).toFixed(1)}" rx="${(r * 0.13).toFixed(1)}" ry="${(r * 0.15).toFixed(1)}" transform="rotate(-21.7, ${(-r * 0.18).toFixed(1)}, ${(-r * 0.37).toFixed(1)})" fill="${priC}" />\n`;
                s += `        <ellipse cx="${(r * 0.18).toFixed(1)}" cy="${(-r * 0.37).toFixed(1)}" rx="${(r * 0.13).toFixed(1)}" ry="${(r * 0.15).toFixed(1)}" transform="rotate(21.7, ${(r * 0.18).toFixed(1)}, ${(-r * 0.37).toFixed(1)})" fill="${priC}" />\n`;
                s += `        <rect x="${(-lw * 1.1).toFixed(1)}" y="${(-r * 0.28).toFixed(1)}" width="${(lw * 2.2).toFixed(1)}" height="${(r * 0.28).toFixed(1)}" fill="${priC}" />\n`;
                s += `      </g>\n`;
            }
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.25).toFixed(1)}" fill="${accC}" />\n`;
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.15).toFixed(1)}" fill="${priC}" />\n`;
            break;
        }
        case 4: { // Star Rosette
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.88).toFixed(1)}" fill="none" stroke="${priC}" stroke-width="${(lw * 0.85).toFixed(2)}" />\n`;
            let starPts = [];
            for (let i = 0; i < 16; i++) {
                const a  = (Math.PI / 8) * i - Math.PI / 2;
                const rr = i % 2 === 0 ? r * 0.76 : r * 0.36;
                starPts.push(`${(cmx + Math.cos(a) * rr).toFixed(1)},${(cmy + Math.sin(a) * rr).toFixed(1)}`);
            }
            s += `      <polygon points="${starPts.join(' ')}" fill="${priC}" />\n`;
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI / 4) * i;
                const px = cmx + Math.cos(a) * r * 0.56;
                const py = cmy + Math.sin(a) * r * 0.56;
                s += `      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(r * 0.075).toFixed(1)}" fill="${bgC}" />\n`;
            }
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.23).toFixed(1)}" fill="${accC}" />\n`;
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.13).toFixed(1)}" fill="${secC}" />\n`;
            break;
        }
        case 5: { // Sunburst Medallion
            for (let i = 0; i < 12; i++) {
                const rot = i * 30;
                s += `      <ellipse cx="0" cy="${(-r * 0.60).toFixed(1)}" rx="${(r * 0.11).toFixed(1)}" ry="${(r * 0.27).toFixed(1)}" fill="${priC}" transform="translate(${cmx.toFixed(1)}, ${cmy.toFixed(1)}) rotate(${rot})" />\n`;
            }
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.38).toFixed(1)}" fill="${secC}" stroke="${priC}" stroke-width="${(lw * 1.3).toFixed(2)}" />\n`;
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI / 4) * i;
                const px = cmx + Math.cos(a) * r * 0.52;
                const py = cmy + Math.sin(a) * r * 0.52;
                s += `      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(r * 0.07).toFixed(1)}" fill="${accC}" />\n`;
            }
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.26).toFixed(1)}" fill="${priC}" />\n`;
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.15).toFixed(1)}" fill="${accC}" />\n`;
            s += `      <circle cx="${cmx.toFixed(1)}" cy="${cmy.toFixed(1)}" r="${(r * 0.07).toFixed(1)}" fill="${secC}" />\n`;
            break;
        }
    }
    s += `    </g>\n`;
    return s;
}

// ============================================================
// UNIFIED DISPATCHER
// ============================================================
function getBorderTileColor(pat, x, y, data, cw, ch, cx, cy, tbYs, tbYe, topYs, botYe, ts, bRows, is3D, fc, sc, hc, bg) {
    switch (pat) {
        case 'subway':     return getSubwayTileColor(x,y,data,cw,ch,cx,cy,tbYs,tbYe,topYs,botYe,ts,bRows,is3D,fc,sc,hc,bg);
        case 'greek':      return getGreekKeyTileColor(x,y,data,cw,ch,cx,cy,tbYs,tbYe,topYs,botYe,ts,bRows,is3D,fc,sc,hc,bg);
        case 'artdeco':    return getArtDecoTileColor(x,y,data,cw,ch,cx,cy,tbYs,tbYe,topYs,botYe,ts,bRows,is3D,fc,sc,hc,bg);
        case 'victorian':  return getVictorianTileColor(x,y,data,cw,ch,cx,cy,tbYs,tbYe,topYs,botYe,ts,bRows,is3D,fc,sc,hc,bg);
        case 'vietnamese': return getVietnameseTileColor(x,y,data,cw,ch,cx,cy,tbYs,tbYe,topYs,botYe,ts,bRows,is3D,fc,sc,hc,bg);
        default: return bg;
    }
}

// ============================================================
// TEXT WRAPPING & DRAWING
// ============================================================
function wrapText(context, text, maxWidth) {
    const paragraphs = String(text).replace(/\r/g, '').split('\n');
    const lines = [];
    for (const para of paragraphs) {
        if (para === '') { lines.push(''); continue; }
        let current = '';
        for (const word of para.split(' ')) {
            const candidate = current ? current + ' ' + word : word;
            if (!current || context.measureText(candidate).width <= maxWidth) {
                current = candidate;
            } else {
                lines.push(current);
                current = word;
            }
        }
        lines.push(current);
    }
    // Force-break any word wider than the measure, so nothing is clipped off-canvas.
    return lines.flatMap(line => {
        if (context.measureText(line).width <= maxWidth) return [line];
        const out = [];
        let chunk = '';
        for (const ch of Array.from(line)) {
            if (chunk && context.measureText(chunk + ch).width > maxWidth) {
                out.push(chunk);
                chunk = ch;
            } else {
                chunk += ch;
            }
        }
        out.push(chunk);
        return out;
    });
}

function drawTextLineOrSpaced(targetCtx, text, x, y, spacing, rotation) {
    if (spacing === 0 && rotation === 0) { targetCtx.fillText(text, x, y); return; }
    targetCtx.save();
    targetCtx.translate(x, y);
    targetCtx.rotate(rotation * Math.PI / 180);
    const chars = Array.from(text);
    const charWidths = chars.map(c => targetCtx.measureText(c).width);
    const totalWidth = charWidths.reduce((a, b) => a + b, 0) + (chars.length - 1) * spacing;
    let cx = -totalWidth / 2;
    chars.forEach((char, i) => { const w = charWidths[i]; targetCtx.fillText(char, cx + w / 2, 0); cx += w + spacing; });
    targetCtx.restore();
}

// ============================================================
// TILE SHAPE RENDERING
// ============================================================
function drawSquareTile(targetCtx, x, y, size, color, bevelDepth, useLighting) {
    targetCtx.fillStyle = color; targetCtx.fillRect(x, y, size, size);
    if (useLighting && bevelDepth > 0) {
        targetCtx.save();
        targetCtx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        targetCtx.beginPath(); targetCtx.moveTo(x, y); targetCtx.lineTo(x + size, y); targetCtx.lineTo(x + size - bevelDepth, y + bevelDepth); targetCtx.lineTo(x + bevelDepth, y + bevelDepth); targetCtx.lineTo(x + bevelDepth, y + size - bevelDepth); targetCtx.lineTo(x, y + size); targetCtx.closePath(); targetCtx.fill();
        targetCtx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        targetCtx.beginPath(); targetCtx.moveTo(x + size, y); targetCtx.lineTo(x + size, y + size); targetCtx.lineTo(x, y + size); targetCtx.lineTo(x + bevelDepth, y + size - bevelDepth); targetCtx.lineTo(x + size - bevelDepth, y + size - bevelDepth); targetCtx.lineTo(x + size - bevelDepth, y + bevelDepth); targetCtx.closePath(); targetCtx.fill();
        targetCtx.restore();
    }
}
function drawCircleTile(targetCtx, cx, cy, r, color, bevelDepth, useLighting) {
    if (!(r > 0)) return;
    targetCtx.beginPath(); targetCtx.arc(cx, cy, r, 0, Math.PI * 2); targetCtx.fillStyle = color; targetCtx.fill();
    if (useLighting && bevelDepth > 0) {
        targetCtx.save();
        const grad = targetCtx.createRadialGradient(cx - r*0.3, cy - r*0.3, 1, cx, cy, r);
        grad.addColorStop(0, 'rgba(255,255,255,0.38)'); grad.addColorStop(0.3, 'rgba(255,255,255,0.15)'); grad.addColorStop(0.7, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.35)');
        targetCtx.beginPath(); targetCtx.arc(cx, cy, r, 0, Math.PI * 2); targetCtx.fillStyle = grad; targetCtx.fill();
        targetCtx.restore();
    }
}
function drawHexagonTile(targetCtx, cx, cy, r, color, bevelDepth, useLighting) {
    const hp = (tCtx, x, y, rad) => { tCtx.beginPath(); for (let i = 0; i < 6; i++) { const a = (Math.PI/3)*i - Math.PI/6; const px = x+rad*Math.cos(a), py = y+rad*Math.sin(a); i===0 ? tCtx.moveTo(px,py) : tCtx.lineTo(px,py); } tCtx.closePath(); };
    targetCtx.fillStyle = color; hp(targetCtx, cx, cy, r); targetCtx.fill();
    if (useLighting && bevelDepth > 0) {
        targetCtx.save(); hp(targetCtx, cx, cy, r); targetCtx.clip();
        const grad = targetCtx.createLinearGradient(cx-r, cy-r, cx+r, cy+r);
        grad.addColorStop(0, 'rgba(255,255,255,0.35)'); grad.addColorStop(0.4, 'rgba(255,255,255,0.08)'); grad.addColorStop(0.6, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.35)');
        targetCtx.fillStyle = grad; targetCtx.fillRect(cx-r-2, cy-r-2, r*2+4, r*2+4); targetCtx.restore();
    }
}
function drawTriangleTile(targetCtx, cx, cy, r, color, bevelDepth, useLighting, pointingUp) {
    const tp = (tCtx, x, y, rad, up) => { tCtx.beginPath(); if (up) { tCtx.moveTo(x, y-rad); tCtx.lineTo(x+rad*0.866, y+rad*0.5); tCtx.lineTo(x-rad*0.866, y+rad*0.5); } else { tCtx.moveTo(x, y+rad); tCtx.lineTo(x+rad*0.866, y-rad*0.5); tCtx.lineTo(x-rad*0.866, y-rad*0.5); } tCtx.closePath(); };
    targetCtx.fillStyle = color; tp(targetCtx, cx, cy, r, pointingUp); targetCtx.fill();
    if (useLighting && bevelDepth > 0) {
        targetCtx.save(); tp(targetCtx, cx, cy, r, pointingUp); targetCtx.clip();
        const grad = targetCtx.createLinearGradient(cx-r, cy-r, cx+r, cy+r);
        grad.addColorStop(0, 'rgba(255,255,255,0.35)'); grad.addColorStop(0.4, 'rgba(255,255,255,0.08)'); grad.addColorStop(0.6, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.35)');
        targetCtx.fillStyle = grad; targetCtx.fillRect(cx-r-2, cy-r-2, r*2+4, r*2+4); targetCtx.restore();
    }
}
function drawDiamondTile(targetCtx, cx, cy, r, color, bevelDepth, useLighting) {
    const dp = (tCtx, x, y, rad) => { tCtx.beginPath(); tCtx.moveTo(x, y-rad); tCtx.lineTo(x+rad*0.82, y); tCtx.lineTo(x, y+rad); tCtx.lineTo(x-rad*0.82, y); tCtx.closePath(); };
    targetCtx.fillStyle = color; dp(targetCtx, cx, cy, r); targetCtx.fill();
    if (useLighting && bevelDepth > 0) {
        targetCtx.save(); dp(targetCtx, cx, cy, r); targetCtx.clip();
        const grad = targetCtx.createLinearGradient(cx-r, cy-r, cx+r, cy+r);
        grad.addColorStop(0, 'rgba(255,255,255,0.38)'); grad.addColorStop(0.4, 'rgba(255,255,255,0.08)'); grad.addColorStop(0.6, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.38)');
        targetCtx.fillStyle = grad; targetCtx.fillRect(cx-r-2, cy-r-2, r*2+4, r*2+4); targetCtx.restore();
    }
}

/* ---- app-tail.js ---- */
/* ============================================================
   SCENE MEASUREMENT
   Every pixel value is multiplied by `k` so the same scene can be
   painted at 1x for the screen and 8x for export, using identical
   layout maths and identical (seeded) tile variation.
   ============================================================ */

function logoMetrics(S, W, k) {
    if (S.mode !== 'logo' || !loadedLogoImage) return null;
    const fit = Math.min(1, (W * 0.72) / loadedLogoImage.width);
    const unit = fit * (S.logoScale / 100);
    return { unit, w: loadedLogoImage.width * unit, h: loadedLogoImage.height * unit };
}

function measureScene(S, k) {
    const style = S.tileStyle;
    const ts = S.tileSize * k;
    const gs = S.grout * k;
    const bd = S.bevel * k;
    const W = Math.max(1, Math.round(S.width * k));

    const isStyle1 = style === 'square';
    const baseFont = (isStyle1 ? 110 : 100) * (S.fontScale / 100) * k;
    const lineH = (isStyle1 ? 120 : 110) * (S.fontScale / 100) * k;
    const weight = fontWeightFor(S.font);
    const fontString = `${weight} ${baseFont}px ${S.font}`;
    const padding = 60 * k;

    hiddenCtx.font = fontString;
    const lines = wrapText(hiddenCtx, S.text && S.text.length ? S.text : ' ', Math.max(20, W - padding));
    const totalTextH = lines.length * lineH;

    const logo = logoMetrics(S, W, k);
    const contentH = logo ? logo.h : totalTextH;

    const hasBorder = S.border && S.border !== 'none';
    let borderRows = 0;
    if (hasBorder) {
        const widthBased = Math.max(4, Math.min(14, Math.round((W / ts) * 0.1)));
        if (S.autoHeight) {
            borderRows = widthBased;
        } else {
            const availableSpace = Math.max(0, (S.height * k) - contentH - ts * 4);
            const heightBased = Math.floor(availableSpace / (2 * ts));
            borderRows = Math.max(widthBased, Math.min(28, heightBased));
        }
    }
    const borderH = borderRows * ts;
    const layoutPadding = hasBorder ? (borderH * 2 + ts * 4) : (padding * 2);
    const offsetAllowance = S.autoHeight ? Math.abs(S.textY) * 2 * k : 0;
    const H = Math.max(1, Math.round(S.autoHeight ? Math.max(350 * k, contentH + layoutPadding + offsetAllowance) : S.height * k));

    return {
        W, H, ts, gs, bd, k, padding, isStyle1, baseFont, lineH, weight, fontString,
        lines, totalTextH, logo, contentH, hasBorder, borderRows, borderH
    };
}

/* ============================================================
   CORE PAINT
   ============================================================ */
let rasterCache = null;

function paint(S, k, out, oCtx, hid, hCtx) {
    const t0 = performance.now();
    resetRandom(SEED);
    palette = {
        bg: S.bg, tileBg: S.tileBg, face: S.face, shadow: S.shadow, highlight: S.highlight,
        band: S.band, border: S.borderColor, accent: S.borderAccent
    };

    const M = measureScene(S, k);
    const {
        W, H, ts, gs, bd, padding, isStyle1, baseFont, lineH,
        lines, totalTextH, logo, contentH, hasBorder, borderRows, borderH
    } = M;

    const style = S.tileStyle;
    const is3D = style === 'beveled';
    const useShading = S.shading || is3D;
    const variance = S.variance;

    if (out.width !== W || out.height !== H) {
        out.width = W;
        out.height = H;
    }
    if (hid.width !== W || hid.height !== H) {
        hid.width = W;
        hid.height = H;
    }
    // Resizing a canvas resets its context state.
    hCtx.setTransform(1, 0, 0, 1, 0, 0);
    hCtx.clearRect(0, 0, W, H);
    hCtx.font = M.fontString;
    hCtx.textBaseline = 'middle';
    hCtx.textAlign = 'center';

    const centerX = W / 2 + S.textX * k;
    const centerY = H / 2 + S.textY * k;
    const spacing = S.letterSpacing * k;
    const rotation = S.rotation;

    /* ---- rasterise the content into colour channels ---- */
    // Cached on every input that changes the bitmap, so dragging a colour slider
    // does not re-rasterise the type on every frame.
    const rasterKeyStr = [
        S.text, S.font, S.fontScale, S.letterSpacing, S.rotation, S.align,
        S.showContent, S.mode, S.logoScale, S.textX, S.textY, S.width,
        S.tileStyle, k, W, H
    ].join('\u0001');

    let data;
    if (rasterCache && rasterCache.key === rasterKeyStr) {
        data = rasterCache.data;
    } else {
        if (S.showContent) {
            if (logo && loadedLogoImage) {
                const drawMask = (maskCanvas, xOffset, yOffset) => {
                    if (!maskCanvas) return;
                    hCtx.save();
                    hCtx.translate(centerX + xOffset, centerY + yOffset);
                    hCtx.rotate(rotation * Math.PI / 180);
                    hCtx.drawImage(maskCanvas, -logo.w / 2, -logo.h / 2, logo.w, logo.h);
                    hCtx.restore();
                };
                if (is3D) {
                    drawMask(logoMaskBlue, -3 * k, -3 * k);
                    for (let i = 1; i <= 8; i++) drawMask(logoMaskGreen, -i * 1.5 * k, i * 1.5 * k);
                    drawMask(logoMaskRed, 0, 0);
                } else {
                    drawMask(logoMaskRed, 0, 0);
                }
            } else {
                const lineWidths = lines.map(line => hCtx.measureText(line).width + Math.max(0, line.length - 1) * spacing);
                const widest = lineWidths.length ? Math.max.apply(null, lineWidths) : 0;
                const blockTop = -totalTextH / 2;

                // The whole block is rotated about its centre, not each line.
                const drawPass = (color, dx, dy) => {
                    hCtx.save();
                    hCtx.translate(centerX + dx, centerY + dy);
                    hCtx.rotate(rotation * Math.PI / 180);
                    hCtx.fillStyle = color;
                    lines.forEach((line, i) => {
                        let offset = 0;
                        if (S.align === 'left') offset = (lineWidths[i] - widest) / 2;
                        else if (S.align === 'right') offset = (widest - lineWidths[i]) / 2;
                        const y = blockTop + i * lineH + lineH / 2;
                        drawTextLineOrSpaced(hCtx, line, offset, y, spacing, 0);
                    });
                    hCtx.restore();
                };

                if (is3D) {
                    drawPass('rgb(0, 0, 255)', -3 * k, -3 * k);
                    for (let d = 1; d <= 8; d++) drawPass('rgb(0, 255, 0)', -d * 1.5 * k, d * 1.5 * k);
                    drawPass('rgb(255, 0, 0)', 0, 0);
                } else {
                    drawPass('rgb(255, 0, 0)', 0, 0);
                }
            }
        }

        data = hCtx.getImageData(0, 0, W, H).data;
        rasterCache = { key: rasterKeyStr, data };
    }

    /* ---- grout field ---- */
    oCtx.setTransform(1, 0, 0, 1, 0, 0);
    oCtx.globalAlpha = 1;
    oCtx.fillStyle = S.noise ? createNoisePattern(S.tileBg, oCtx) : S.tileBg;
    oCtx.fillRect(0, 0, W, H);

    let tilesDrawn = 0;

    if (hasBorder) {
        const textBandHeight = Math.max(ts * 8, contentH + ts * 4);
        const textBandYStart = centerY - textBandHeight / 2;
        const textBandYEnd = centerY + textBandHeight / 2;
        const topBorderYStart = textBandYStart - borderH;
        const bottomBorderYEnd = textBandYEnd + borderH;

        const fieldTileSize = Math.round(ts * 2.5);
        const fieldColor = () => getVariantColor(S.tileBg, variance);
        let fieldRow = 0;
        for (let y = topBorderYStart - fieldTileSize; y > -fieldTileSize; y -= fieldTileSize) {
            const ox = (fieldRow % 2 === 1) ? (fieldTileSize / 2) : 0;
            for (let x = -fieldTileSize; x < W + fieldTileSize; x += fieldTileSize) {
                const ax = x + ox;
                if (ax > W) continue;
                drawSquareTile(oCtx, ax + gs, y + gs, fieldTileSize - gs * 2, fieldColor(), bd, useShading);
                tilesDrawn++;
            }
            fieldRow++;
        }
        fieldRow = 0;
        for (let y = bottomBorderYEnd; y < H + fieldTileSize; y += fieldTileSize) {
            const ox = (fieldRow % 2 === 1) ? (fieldTileSize / 2) : 0;
            for (let x = -fieldTileSize; x < W + fieldTileSize; x += fieldTileSize) {
                const ax = x + ox;
                if (ax > W) continue;
                drawSquareTile(oCtx, ax + gs, y + gs, fieldTileSize - gs * 2, fieldColor(), bd, useShading);
                tilesDrawn++;
            }
            fieldRow++;
        }

        let smallRow = 0;
        for (let y = topBorderYStart; y < bottomBorderYEnd; y += ts) {
            for (let x = 0; x < W; x += ts) {
                // The encaustic motif layer paints its own opaque cells over both bands.
                if (S.border === 'vietnamese' && (y < textBandYStart || y >= textBandYEnd)) continue;
                const tc = getBorderTileColor(
                    S.border, x, y, data, W, H, centerX, centerY,
                    textBandYStart, textBandYEnd, topBorderYStart, bottomBorderYEnd,
                    ts, borderRows, is3D, S.face, S.shadow, S.highlight, S.tileBg
                );
                const tileColor = getVariantColor(tc, variance);
                const tr = Math.max(0, (ts / 2) - gs);
                const tcx = x + ts / 2;
                const tcy = y + ts / 2;
                if (style === 'square' || style === 'beveled') {
                    drawSquareTile(oCtx, x + gs, y + gs, ts - gs * 2, tileColor, bd, useShading);
                } else if (style === 'circle') {
                    drawCircleTile(oCtx, tcx, tcy, tr, tileColor, bd, useShading);
                } else if (style === 'hexagon') {
                    drawHexagonTile(oCtx, tcx, tcy, tr + k, tileColor, bd, useShading);
                } else if (style === 'triangle') {
                    const col = Math.floor(x / ts);
                    drawTriangleTile(oCtx, tcx, tcy, tr + k, tileColor, bd, useShading, (smallRow + col) % 2 === 0);
                } else if (style === 'diamond') {
                    drawDiamondTile(oCtx, tcx, tcy, (ts / 2) - gs, tileColor, bd, useShading);
                }
                tilesDrawn++;
            }
            smallRow++;
        }

        if (S.border === 'vietnamese') {
            renderVietnameseBands(oCtx, topBorderYStart, textBandYStart, textBandYEnd, bottomBorderYEnd, W, borderH, gs);
        }
    } else {
        let stepX = ts, stepY = ts;
        if (style === 'circle' || style === 'hexagon') stepY = ts * 0.866;
        else if (style === 'triangle') { stepX = ts / 2; stepY = ts * 0.866; }
        else if (style === 'diamond') { stepX = ts * 0.82; stepY = ts / 2; }

        let row = 0;
        for (let y = 0; y < H; y += stepY) {
            const offsetX = (row % 2 === 1 && (style === 'circle' || style === 'hexagon')) ? (ts / 2) : 0;
            const diamondOffset = (row % 2 === 1 && style === 'diamond') ? (ts * 0.41) : 0;
            for (let x = 0; x < W; x += stepX) {
                const ax = x + offsetX + diamondOffset;
                if (ax > W) continue;
                const si = (Math.floor(y) * W + Math.floor(ax)) * 4;
                const r = data[si], g = data[si + 1], b = data[si + 2], a = data[si + 3];
                let tc = S.tileBg;
                if (a > 50) {
                    if (is3D) {
                        if (r > g && r > b) tc = S.face;
                        else if (g > r && g > b) tc = S.shadow;
                        else if (b > r && b > g) tc = S.highlight;
                        else tc = S.face;
                    } else {
                        tc = S.face;
                    }
                }
                const tileColor = getVariantColor(tc, variance);
                const radius = Math.max(0, (ts / 2) - gs);
                const cx = ax + ts / 2;
                const cy = y + ts / 2;
                if (style === 'square' || style === 'beveled') {
                    drawSquareTile(oCtx, ax + gs, y + gs, ts - gs * 2, tileColor, bd, useShading);
                } else if (style === 'circle') {
                    drawCircleTile(oCtx, cx, cy, radius, tileColor, bd, useShading);
                } else if (style === 'hexagon') {
                    drawHexagonTile(oCtx, cx, cy, radius + k, tileColor, bd, useShading);
                } else if (style === 'triangle') {
                    const col = Math.floor(x / stepX);
                    drawTriangleTile(oCtx, cx, cy, radius + k, tileColor, bd, useShading, (row + col) % 2 === 0);
                } else if (style === 'diamond') {
                    drawDiamondTile(oCtx, cx, cy, (ts / 2) - gs, tileColor, bd, useShading);
                }
                tilesDrawn++;
            }
            row++;
        }
    }

    /* ---- content bounds, for the drag affordance ---- */
    let bounds = null;
    if (S.showContent) {
        const bw = logo ? logo.w : (() => {
            hCtx.font = M.fontString;
            const widths = lines.map(l => hCtx.measureText(l).width + Math.max(0, l.length - 1) * spacing);
            return widths.length ? Math.max.apply(null, widths) : 0;
        })();
        const bh = logo ? logo.h : totalTextH;
        const rad = rotation * Math.PI / 180;
        const rw = Math.abs(bw * Math.cos(rad)) + Math.abs(bh * Math.sin(rad));
        const rh = Math.abs(bw * Math.sin(rad)) + Math.abs(bh * Math.cos(rad));
        bounds = { x: centerX - rw / 2, y: centerY - rh / 2, w: rw, h: rh };
    }

    return {
        W, H, tileCount: tilesDrawn, bounds,
        renderTime: performance.now() - t0,
        contentH
    };
}

/* ============================================================
   VIEW RENDER
   ============================================================ */
let lastMetrics = null;
let renderQueued = false;

function renderNow() {
    const metrics = paint(state, 1, canvas, ctx, hiddenCanvas, hiddenCtx);
    lastMetrics = metrics;
    updateStats(metrics);
    if (typeof updateCanvasLabel === 'function') updateCanvasLabel(metrics);
    if (typeof refreshExportHint === 'function') refreshExportHint();
    refreshBounds(metrics.bounds);
    applyZoom();
    return metrics;
}

function requestRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
        renderQueued = false;
        renderNow();
    });
}

function updateStats(metrics) {
    const W = metrics.W, H = metrics.H;
    renderTimeIndicator.textContent = `${metrics.renderTime.toFixed(0)}ms`;
    canvasResIndicator.textContent = `${W} × ${H}`;
    if (tileCountIndicator) tileCountIndicator.textContent = `${metrics.tileCount.toLocaleString()} tiles`;
    if (statusSize) statusSize.textContent = `${W} × ${H} px`;
    if (statusTiles) statusTiles.textContent = `${metrics.tileCount.toLocaleString()} tiles`;
    if (state.autoHeight) {
        if (document.activeElement !== canvasHeightInput) canvasHeightInput.value = H;
        canvasHeightInput.max = Math.max(1500, H);
        setOutput('height', H);
        updateRangeFill(canvasHeightInput);
    }
    const empty = !state.showContent || (state.mode === 'text' && !state.text.trim()) || (state.mode === 'logo' && !loadedLogoImage);
    emptyState.hidden = !empty;
}

/* ============================================================
   SVG EXPORT
   ============================================================ */
function buildSVG() {
    resetRandom(SEED);
    palette = {
        bg: state.bg, tileBg: state.tileBg, face: state.face, shadow: state.shadow, highlight: state.highlight,
        band: state.band, border: state.borderColor, accent: state.borderAccent
    };

    const S = state;
    const W = canvas.width;
    const H = canvas.height;
    const data = hiddenCtx.getImageData(0, 0, W, H).data;

    const ts = S.tileSize;
    const gs = S.grout;
    const style = S.tileStyle;
    const is3D = style === 'beveled';
    const useShading = S.shading;
    const variance = S.variance;
    const border = S.border;
    const hasBorder = border !== 'none';

    const M = measureScene(S, 1);
    const borderRows = M.borderRows;
    const borderH = M.borderH;
    const contentH = M.contentH;
    const centerX = W / 2 + S.textX;
    const centerY = H / 2 + S.textY;

    let svg = `<?xml version="1.0" encoding="utf-8"?>\n`;
    svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">\n`;
    svg += `  <title>${escapeHtml(S.docName || 'Mosaic')}</title>\n`;
    svg += `  <desc>Encaustic mosaic artwork generated with Mosaic System. ${W}×${H} px, ${ts}px tiles.</desc>\n`;
    svg += `  <defs>\n    <linearGradient id="bevel-gloss" x1="0%" y1="0%" x2="100%" y2="100%">\n      <stop offset="0%" stop-color="white" stop-opacity="0.32" />\n      <stop offset="40%" stop-color="white" stop-opacity="0.08" />\n      <stop offset="60%" stop-color="black" stop-opacity="0.0" />\n      <stop offset="100%" stop-color="black" stop-opacity="0.35" />\n    </linearGradient>\n  </defs>\n`;
    svg += `  <rect width="${W}" height="${H}" fill="${S.tileBg}" />\n  <g id="tiles">\n`;

    const emitRect = (x, y, sz, c) => {
        svg += `    <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" fill="${c}" />\n`;
        if (useShading) svg += `    <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" fill="url(#bevel-gloss)" opacity="0.8" />\n`;
    };
    const emitCirc = (cx, cy, r, c) => {
        svg += `    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" />\n`;
        if (useShading) svg += `    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#bevel-gloss)" opacity="0.8" />\n`;
    };
    const emitPoly = (pts, c) => {
        svg += `    <polygon points="${pts}" fill="${c}" />\n`;
        if (useShading) svg += `    <polygon points="${pts}" fill="url(#bevel-gloss)" opacity="0.8" />\n`;
    };
    const emitTile = (x, y, size, grout, tileColor, tileStyle, row) => {
        const r = (size / 2) - grout;
        const cx = x + size / 2;
        const cy = y + size / 2;
        if (tileStyle === 'square' || tileStyle === 'beveled') {
            emitRect(x + grout, y + grout, size - grout * 2, tileColor);
        } else if (tileStyle === 'circle') {
            emitCirc(cx, cy, r, tileColor);
        } else if (tileStyle === 'hexagon') {
            const pts = [];
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 6;
                pts.push(`${(cx + (r + 0.5) * Math.cos(a)).toFixed(1)},${(cy + (r + 0.5) * Math.sin(a)).toFixed(1)}`);
            }
            emitPoly(pts.join(' '), tileColor);
        } else if (tileStyle === 'triangle') {
            const col = Math.floor(x / size);
            const up = (row + col) % 2 === 0;
            const rad = r + 1;
            const pts = up
                ? [`${cx.toFixed(1)},${(cy - rad).toFixed(1)}`, `${(cx + rad * 0.866).toFixed(1)},${(cy + rad * 0.5).toFixed(1)}`, `${(cx - rad * 0.866).toFixed(1)},${(cy + rad * 0.5).toFixed(1)}`]
                : [`${cx.toFixed(1)},${(cy + rad).toFixed(1)}`, `${(cx + rad * 0.866).toFixed(1)},${(cy - rad * 0.5).toFixed(1)}`, `${(cx - rad * 0.866).toFixed(1)},${(cy - rad * 0.5).toFixed(1)}`];
            emitPoly(pts.join(' '), tileColor);
        } else if (tileStyle === 'diamond') {
            const dr = (size / 2) - grout;
            emitPoly(`${cx.toFixed(1)},${(cy - dr).toFixed(1)} ${(cx + dr * 0.82).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${(cy + dr).toFixed(1)} ${(cx - dr * 0.82).toFixed(1)},${cy.toFixed(1)}`, tileColor);
        }
    };

    if (hasBorder) {
        const tbH = Math.max(ts * 8, contentH + 40);
        const tbYs = centerY - tbH / 2;
        const tbYe = centerY + tbH / 2;
        const topYs = tbYs - borderH;
        const botYe = tbYe + borderH;
        const fts = Math.round(ts * 2.5);

        let fr = 0;
        for (let y = topYs - fts; y > -fts; y -= fts) {
            const ox = (fr % 2 === 1) ? (fts / 2) : 0;
            for (let x = -fts; x < W + fts; x += fts) {
                const ax = x + ox;
                if (ax > W) continue;
                emitRect(ax + gs, y + gs, fts - gs * 2, getVariantColor(S.tileBg, variance));
            }
            fr++;
        }
        fr = 0;
        for (let y = botYe; y < H + fts; y += fts) {
            const ox = (fr % 2 === 1) ? (fts / 2) : 0;
            for (let x = -fts; x < W + fts; x += fts) {
                const ax = x + ox;
                if (ax > W) continue;
                emitRect(ax + gs, y + gs, fts - gs * 2, getVariantColor(S.tileBg, variance));
            }
            fr++;
        }

        let sr = 0;
        for (let y = topYs; y < botYe; y += ts) {
            for (let x = 0; x < W; x += ts) {
                const tc = getBorderTileColor(
                    border, x, y, data, W, H, centerX, centerY,
                    tbYs, tbYe, topYs, botYe, ts, borderRows, is3D,
                    S.face, S.shadow, S.highlight, S.tileBg
                );
                emitTile(x, y, ts, gs, getVariantColor(tc, variance), style, sr);
            }
            sr++;
        }

        if (border === 'vietnamese' && borderH >= 12) {
            const cs = borderH;
            const priC = S.borderColor;
            const secC = S.band;
            const accC = S.borderAccent;
            const bgC = S.bg;
            const bands = [{ y: topYs, label: 0 }, { y: tbYe, label: 3 }];
            for (const band of bands) {
                for (let x = 0; x < W; x += cs) {
                    const availW = W - x;
                    if (availW < cs * 0.2) continue;
                    const motifIdx = Math.floor(x / cs) + band.label;
                    svg += getVietnameseMotifSVGString(x, band.y, Math.min(cs, availW), motifIdx, bgC, priC, secC, accC);
                }
            }
        }
    } else {
        let stepX = ts, stepY = ts;
        if (style === 'circle' || style === 'hexagon') stepY = ts * 0.866;
        else if (style === 'triangle') { stepX = ts / 2; stepY = ts * 0.866; }
        else if (style === 'diamond') { stepX = ts * 0.82; stepY = ts / 2; }

        let row = 0;
        for (let y = 0; y < H; y += stepY) {
            const ox = (row % 2 === 1 && (style === 'circle' || style === 'hexagon')) ? (ts / 2) : 0;
            for (let x = 0; x < W; x += stepX) {
                const ax = x + ox;
                if (ax > W) continue;
                const si = (Math.floor(y) * W + Math.floor(ax)) * 4;
                let tc = S.tileBg;
                if (data[si + 3] > 50) {
                    if (is3D) {
                        const r = data[si], g = data[si + 1], b = data[si + 2];
                        if (r > g && r > b) tc = S.face;
                        else if (g > r && g > b) tc = S.shadow;
                        else if (b > r && b > g) tc = S.highlight;
                        else tc = S.face;
                    } else {
                        tc = S.face;
                    }
                }
                emitTile(ax, y, ts, gs, getVariantColor(tc, variance), style, row);
            }
            row++;
        }
    }

    svg += `  </g>\n</svg>`;
    return svg;
}

/* ---- app-ui.js ---- */
/* ============================================================
   UI: constants, readouts and disabled states
   ============================================================ */
const TILE_NUMBER = { square: '01', beveled: '02', circle: '03', hexagon: '04', triangle: '05', diamond: '06' };
const BORDER_LABELS = {
    none: 'None', subway: 'NYC subway', greek: 'Greek key',
    artdeco: 'Art deco', victorian: 'Victorian', vietnamese: 'Encaustic'
};
const PANEL_META = {
    content: { title: 'Type', index: '01 / 04' },
    tiles: { title: 'Tiles', index: '02 / 04' },
    palette: { title: 'Colour', index: '03 / 04' },
    layout: { title: 'Layout', index: '04 / 04' }
};

const RANGES = {
    fontScale: [30, 250], letterSpacing: [-20, 40], rotation: [-45, 45],
    tileSize: [5, 30], grout: [0, 5], bevel: [0, 4], variance: [0, 30],
    width: [300, 2400], height: [150, 6000], logoScale: [10, 300],
    textX: [-20000, 20000], textY: [-20000, 20000]
};

const RANGE_FIELDS = [
    [fontScaleInput, 'fontScale', '%'],
    [letterSpacingInput, 'letterSpacing', 'px'],
    [textRotationInput, 'rotation', '°'],
    [tileSizeInput, 'tileSize', 'px'],
    [groutSizeInput, 'grout', 'px'],
    [bevelDepthInput, 'bevel', 'px'],
    [colorVarianceInput, 'variance', '%'],
    [canvasWidthInput, 'width', 'px'],
    [canvasHeightInput, 'height', 'px'],
    [logoScaleInput, 'logoScale', '%']
];

const COLOR_FIELDS = [
    [bgColorPicker, 'bg'],
    [tileBgColorPicker, 'tileBg'],
    [faceColorPicker, 'face'],
    [shadowColorPicker, 'shadow'],
    [highlightColorPicker, 'highlight'],
    [subwayBandColorPicker, 'band'],
    [subwayBorderColorPicker, 'borderColor'],
    [subwayHeaderColorPicker, 'borderAccent']
];

const OUTPUT_SUFFIX = {
    fontScale: '%', letterSpacing: 'px', rotation: '°', tileSize: 'px', grout: 'px',
    bevel: 'px', variance: '%', width: 'px', height: 'px', logoScale: '%'
};

const OUTPUT_IDS = {
    fontScale: 'val-fontScale',
    letterSpacing: 'val-letterSpacing',
    rotation: 'val-textRotation',
    tileSize: 'val-tileSize',
    grout: 'val-groutSize',
    bevel: 'val-bevelDepth',
    variance: 'val-colorVariance',
    width: 'val-canvasWidth',
    height: 'val-canvasHeight',
    logoScale: 'val-logoScale'
};

function formatNumber(value, key) {
    if (key === 'grout' || key === 'bevel') return Number(value).toFixed(1);
    return String(Math.round(Number(value) * 100) / 100);
}

function updateRangeFill(el) {
    const min = parseFloat(el.min) || 0;
    const max = parseFloat(el.max) || 100;
    const pct = ((parseFloat(el.value) - min) / (max - min)) * 100;
    el.style.setProperty('--p', `${clamp(pct, 0, 100)}%`);
}

function setOutput(key, value) {
    const el = document.getElementById(OUTPUT_IDS[key] || `val-${key}`);
    if (el) el.textContent = `${value}${OUTPUT_SUFFIX[key] || ''}`;
    const input = RANGE_FIELDS.find(f => f[1] === key);
    if (input) {
        const text = `${value}${OUTPUT_SUFFIX[key] === '%' ? ' percent' : OUTPUT_SUFFIX[key] === '°' ? ' degrees' : OUTPUT_SUFFIX[key] === 'px' ? ' pixels' : ''}`;
        input[0].setAttribute('aria-valuetext', text);
    }
}

function refreshReadouts() {
    RANGE_FIELDS.forEach(([el, key]) => {
        if (key === 'height' && state.autoHeight) {
            const computed = canvas.height || state.height;
            setOutput(key, computed);
            el.value = Math.min(computed, parseFloat(el.max) || computed);
            el.max = Math.max(1500, computed);
        } else {
            setOutput(key, formatNumber(state[key], key));
            if (document.activeElement !== el) el.value = state[key];
            el.max = el.max || 1500;
        }
        updateRangeFill(el);
    });

    document.getElementById('charCount').textContent = String(state.text.length);
    textPosReadout.textContent = `${Math.round(state.textX)} , ${Math.round(state.textY)}`;

    COLOR_FIELDS.forEach(([input, key]) => {
        if (document.activeElement !== input) input.value = state[key];
        const label = document.getElementById(`lbl-${input.id}`);
        if (label) label.textContent = String(state[key]).toUpperCase();
    });

    if (!document.activeElement || document.activeElement !== docNameInput) docNameInput.value = state.docName;
    document.title = `${state.docName || 'Untitled mosaic'} — Mosaic System`;
    refreshExportHint();
}

function refreshChrome() {
    const is3D = state.tileStyle === 'beveled';
    [shadowGroup, highlightGroup].forEach(group => {
        group.classList.toggle('is-disabled', !is3D);
        group.setAttribute('aria-disabled', String(!is3D));
        group.title = is3D ? '' : 'Only used by the Beveled tile style';
    });
    shadowColorPicker.disabled = !is3D;
    highlightColorPicker.disabled = !is3D;

    canvasHeightInput.disabled = state.autoHeight;
    const heightField = canvasHeightInput.closest('.field');
    if (heightField) heightField.classList.toggle('is-disabled', state.autoHeight);

    borderSettingsGroup.hidden = state.border === 'none';
    borderMeta.textContent = BORDER_LABELS[state.border] || 'None';

    applyModeVisibility();
    refreshExportHint();
}

function applyModeVisibility() {
    const isLogo = state.mode === 'logo';
    typographyControls.hidden = isLogo;
    logoControls.hidden = !isLogo;
}

function updateTileButtons() {
    $$('.tile-option', tileStyleGrid).forEach(btn => {
        const on = btn.dataset.style === state.tileStyle;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-checked', String(on));
        btn.tabIndex = on ? 0 : -1;
    });
    tileStyleNo.textContent = TILE_NUMBER[state.tileStyle] || '01';
}

function updateBorderButtons() {
    $$('.border-option', borderPatternGrid).forEach(btn => {
        const on = btn.dataset.pattern === state.border;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-checked', String(on));
        btn.tabIndex = on ? 0 : -1;
    });
}

function refreshExportHint() {
    const hint = document.getElementById('exportHint');
    if (!hint) return;
    const scale = Number(exportScaleSelect.value) || 1;
    const W = Math.round((canvas.width || state.width) * scale);
    const H = Math.round((canvas.height || state.height) * scale);
    hint.textContent = `PNG ${scale}× → ${W} × ${H}`;
    hint.classList.toggle('is-warning', W > 16384 || H > 16384 || W * H > 80000000);
}

function updateCanvasLabel(metrics) {
    const words = (state.text || '').replace(/\s+/g, ' ').trim();
    const subject = state.mode === 'logo'
        ? 'the uploaded logo'
        : (words ? `the words “${words.slice(0, 60)}”` : 'an empty field');
    const border = state.border === 'none' ? 'no border' : `${BORDER_LABELS[state.border]} border`;
    canvas.setAttribute('aria-label',
        `Mosaic preview of ${subject}: ${metrics.W} by ${metrics.H} pixels, ${metrics.tileCount} tiles, ${border}. ` +
        `Content offset ${Math.round(state.textX)} right and ${Math.round(state.textY)} down.`);
}

/* ============================================================
   Full UI sync (load, undo, presets, reset)
   ============================================================ */
function syncUI() {
    textInput.value = state.text;
    textFontSelect.value = state.font;

    $$('input[name="contentMode"]').forEach(r => { r.checked = r.value === state.mode; });
    $$('input[name="textAlign"]').forEach(r => { r.checked = r.value === state.align; });

    tileShadingCheckbox.checked = state.shading;
    groutNoiseCheckbox.checked = state.noise;
    autoHeightCheckbox.checked = state.autoHeight;
    showTextCheckbox.checked = state.showContent;

    RANGE_FIELDS.forEach(([el, key]) => {
        if (key !== 'height' || !state.autoHeight) el.value = state[key];
        updateRangeFill(el);
    });

    COLOR_FIELDS.forEach(([input, key]) => { input.value = state[key]; });

    updateTileButtons();
    updateBorderButtons();
    updatePresetActive();
    refreshReadouts();
    refreshChrome();
}

/* ============================================================
   Change bookkeeping
   ============================================================ */
function markChanged() {
    refreshReadouts();
    refreshChrome();
    requestRender();
    scheduleSave();
    scheduleCommit();
}

/* ============================================================
   History
   ============================================================ */
let history = [];
let historyIndex = -1;
let commitTimer = null;
let applyingHistory = false;

function snapshotState() {
    const { logo, logoName, ...rest } = state;
    return JSON.stringify(rest);
}

function commitNow() {
    window.clearTimeout(commitTimer);
    commitTimer = null;
    if (applyingHistory) return;
    const snap = snapshotState();
    if (history[historyIndex] === snap) return;
    history = history.slice(0, historyIndex + 1);
    history.push(snap);
    if (history.length > 60) history.shift();
    historyIndex = history.length - 1;
    updateHistoryButtons();
}

function scheduleCommit() {
    window.clearTimeout(commitTimer);
    commitTimer = window.setTimeout(commitNow, 450);
}

function updateHistoryButtons() {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= history.length - 1;
}

function applySnapshot(snap) {
    let parsed;
    try { parsed = JSON.parse(snap); } catch { return; }
    applyingHistory = true;
    state = sanitize(Object.assign({}, parsed, { logo: state.logo, logoName: state.logoName }));
    rasterCache = null;
    syncUI();
    renderNow();
    saveNow();
    applyingHistory = false;
}

function undo() {
    commitNow();
    if (historyIndex <= 0) return;
    historyIndex--;
    applySnapshot(history[historyIndex]);
    updateHistoryButtons();
    showToast('Undone.');
}

function redo() {
    commitNow();
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    applySnapshot(history[historyIndex]);
    updateHistoryButtons();
    showToast('Redone.');
}

function initHistory() {
    history = [snapshotState()];
    historyIndex = 0;
    updateHistoryButtons();
}

/* ============================================================
   Persistence and sharing
   ============================================================ */
let saveTimer = null;
let savedTimer = null;

function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveNow, 400);
}

function saveNow() {
    window.clearTimeout(saveTimer);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.assign({}, state, { logo: null }))); } catch (_) { /* storage full or blocked */ }
    }
    docSaved.classList.add('is-visible');
    window.clearTimeout(savedTimer);
    savedTimer = window.setTimeout(() => docSaved.classList.remove('is-visible'), 1400);
}

function loadSaved() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function bytesToBase64(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}

function base64ToBytes(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function encodeShareState() {
    const { logo, logoName, ...rest } = state;
    const json = JSON.stringify(rest);
    return bytesToBase64(new TextEncoder().encode(json)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function readShareState() {
    const match = location.hash.match(/^#s=(.+)$/);
    if (!match) return null;
    try {
        const b64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = new TextDecoder().decode(base64ToBytes(b64));
        return JSON.parse(json);
    } catch { return null; }
}

async function copyShareLink() {
    const url = location.href.split('#')[0] + '#s=' + encodeShareState();
    try {
        await navigator.clipboard.writeText(url);
        showToast('Share link copied — the whole design travels in the URL.');
    } catch {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch { /* ignore */ }
        ta.remove();
        showToast('Share link copied.');
    }
}

function sanitize(raw) {
    const next = Object.assign({}, DEFAULTS);
    if (!raw || typeof raw !== 'object') return next;

    Object.keys(DEFAULTS).forEach(key => {
        const fallback = DEFAULTS[key];
        const value = raw[key];
        if (key === 'logo') {
            next.logo = typeof value === 'string' && value.startsWith('data:') ? value : null;
            return;
        }
        if (typeof value !== typeof fallback) return;
        if (typeof fallback === 'number') {
            const range = RANGES[key];
            const num = Number(value);
            if (!Number.isFinite(num)) return;
            next[key] = range ? clamp(num, range[0], range[1]) : num;
        } else {
            next[key] = value;
        }
    });

    if (!['text', 'logo'].includes(next.mode)) next.mode = DEFAULTS.mode;
    if (!['left', 'center', 'right'].includes(next.align)) next.align = DEFAULTS.align;
    if (!Object.prototype.hasOwnProperty.call(TILE_NUMBER, next.tileStyle)) next.tileStyle = DEFAULTS.tileStyle;
    if (!Object.prototype.hasOwnProperty.call(BORDER_LABELS, next.border)) next.border = DEFAULTS.border;
    if (typeof next.text === 'string') next.text = next.text.slice(0, 2000);
    if (typeof next.docName !== 'string' || !next.docName.trim()) next.docName = DEFAULTS.docName;
    next.docName = next.docName.slice(0, 80);
    next.logoName = typeof raw.logoName === 'string' ? raw.logoName.slice(0, 120) : '';
    return next;
}

/* ============================================================
   Export
   ============================================================ */
const MAX_EXPORT_DIM = 16384;
const MAX_EXPORT_AREA = 80000000;

function planExport(requested) {
    const probe = measureScene(state, requested);
    if (probe.W <= MAX_EXPORT_DIM && probe.H <= MAX_EXPORT_DIM && probe.W * probe.H <= MAX_EXPORT_AREA) {
        return { scale: requested, metrics: probe, clamped: false };
    }
    const limit = Math.min(
        MAX_EXPORT_DIM / probe.W,
        MAX_EXPORT_DIM / probe.H,
        Math.sqrt(MAX_EXPORT_AREA / (probe.W * probe.H))
    );
    const scale = Math.floor(requested * limit * 10) / 10;
    if (scale < 1) return { error: 'This artboard is too large to export. Reduce its width or height.' };
    return { scale, metrics: measureScene(state, scale), clamped: true };
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function exportPNG() {
    if (btnExportPNG.disabled) return;
    const requested = Number(exportScaleSelect.value) || 4;
    const plan = planExport(requested);
    if (plan.error) { showToast(plan.error); return; }

    const { scale, clamped } = plan;
    const label = btnExportPNG.innerHTML;
    btnExportPNG.disabled = true;
    btnExportPNG.textContent = 'Exporting…';
    setBusy(true, `Painting at ${scale}×…`);
    await nextFrame();
    await nextFrame();

    try {
        const out = document.createElement('canvas');
        const hid = document.createElement('canvas');
        const oCtx = out.getContext('2d');
        const hCtx = hid.getContext('2d', { willReadFrequently: true });
        const metrics = paint(state, scale, out, oCtx, hid, hCtx);
        const blob = await new Promise((resolve, reject) => {
            out.toBlob(b => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png');
        });
        downloadBlob(blob, `${slugify(state.docName)}-${metrics.W}x${metrics.H}.png`);
        showToast(`Exported ${metrics.W} × ${metrics.H} PNG${clamped ? ` — reduced to ${scale}× to fit browser limits` : ''}.`);
    } catch (err) {
        console.error(err);
        showToast('Export failed — try a smaller artboard or a lower scale.');
    } finally {
        btnExportPNG.disabled = false;
        btnExportPNG.innerHTML = label;
        setBusy(false);
    }
}

async function exportSVG() {
    if (btnExportSVG.disabled) return;
    renderNow();
    const estimate = (canvas.width / state.tileSize) * (canvas.height / state.tileSize);
    if (estimate > 160000) {
        showToast('Too many tiles for vector export — raise the tile size or shrink the artboard.');
        return;
    }
    const label = btnExportSVG.innerHTML;
    btnExportSVG.disabled = true;
    btnExportSVG.textContent = 'Writing…';
    setBusy(true, 'Writing vector…');
    await nextFrame();
    try {
        const svg = buildSVG();
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        downloadBlob(blob, `${slugify(state.docName)}-${canvas.width}x${canvas.height}.svg`);
        showToast(`SVG exported (${Math.round(blob.size / 1024).toLocaleString()} KB).`);
    } catch (err) {
        console.error(err);
        showToast('SVG export failed.');
    } finally {
        btnExportSVG.disabled = false;
        btnExportSVG.innerHTML = label;
        setBusy(false);
    }
}

/* ============================================================
   Zoom and canvas interaction
   ============================================================ */
let zoomMode = 'fit';
let zoomValue = 1;
let displayScale = 1;

function fitScale() {
    const styles = getComputedStyle(canvasScrollArea);
    const padX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    const padY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
    const availableW = Math.max(80, canvasScrollArea.clientWidth - padX - 4);
    const availableH = Math.max(80, canvasScrollArea.clientHeight - padY - 4);
    return clamp(Math.min(availableW / canvas.width, availableH / canvas.height, 1), 0.05, 3);
}

function applyZoom() {
    if (zoomMode === 'fit') zoomValue = fitScale();
    displayScale = zoomValue;
    canvas.style.width = `${Math.max(1, Math.round(canvas.width * displayScale))}px`;
    canvas.style.height = `${Math.max(1, Math.round(canvas.height * displayScale))}px`;
    const label = `${Math.round(displayScale * 100)}%`;
    if (zoomLabel) zoomLabel.textContent = label;
    if (zoomFoot) zoomFoot.textContent = label;
    if (lastMetrics) refreshBounds(lastMetrics.bounds);
}

function setZoom(mode, value) {
    zoomMode = mode;
    if (typeof value === 'number') zoomValue = clamp(value, 0.05, 3);
    applyZoom();
}

function stepZoom(direction) {
    const next = clamp(Math.round((displayScale + direction * 0.1) * 100) / 100, 0.05, 3);
    setZoom('manual', next);
}

let boundsEl = null;
function ensureBoundsEl() {
    if (boundsEl) return boundsEl;
    boundsEl = document.createElement('div');
    boundsEl.className = 'content-bounds';
    boundsEl.setAttribute('aria-hidden', 'true');
    boundsEl.innerHTML = '<span>drag</span>';
    canvasFrame.appendChild(boundsEl);
    return boundsEl;
}

function refreshBounds(bounds) {
    const el = ensureBoundsEl();
    if (!bounds || bounds.w < 4 || bounds.h < 4 || !state.showContent) {
        el.hidden = true;
        return;
    }
    el.hidden = false;
    el.style.left = `${bounds.x * displayScale}px`;
    el.style.top = `${bounds.y * displayScale}px`;
    el.style.width = `${bounds.w * displayScale}px`;
    el.style.height = `${bounds.h * displayScale}px`;
}

function clampOffset(x, y) {
    const W = canvas.width || state.width;
    const H = canvas.height || state.height;
    return {
        x: clamp(x, -W * 0.92, W * 0.92),
        y: clamp(y, -H * 0.62, H * 0.62)
    };
}

let dragState = null;

canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    canvas.focus({ preventScroll: true });
    dragState = { x: e.clientX, y: e.clientY, ox: state.textX, oy: state.textY, rect: canvas.getBoundingClientRect() };
    canvas.classList.add('is-dragging');
});

canvas.addEventListener('pointermove', e => {
    if (!dragState) return;
    const rect = dragState.rect;
    const dx = (e.clientX - dragState.x) * (canvas.width / rect.width);
    const dy = (e.clientY - dragState.y) * (canvas.height / rect.height);
    const next = clampOffset(dragState.ox + dx, dragState.oy + dy);
    state.textX = next.x;
    state.textY = next.y;
    refreshReadouts();
    requestRender();
});

function endDrag(e) {
    if (!dragState) return;
    dragState = null;
    canvas.classList.remove('is-dragging');
    if (e && e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
    }
    scheduleCommit();
    scheduleSave();
}

canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

canvas.addEventListener('dblclick', () => {
    state.textX = 0;
    state.textY = 0;
    markChanged();
    commitNow();
    showToast('Content recentred.');
});

canvas.addEventListener('keydown', e => {
    const step = e.shiftKey ? 10 : 1;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (e.key === '0' || e.key === 'Home') {
        e.preventDefault();
        state.textX = 0;
        state.textY = 0;
        markChanged();
        return;
    }
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    const next = clampOffset(state.textX + move[0], state.textY + move[1]);
    state.textX = next.x;
    state.textY = next.y;
    requestRender();
    refreshReadouts();
    scheduleCommit();
    scheduleSave();
});

/* ============================================================
   Panels
   ============================================================ */
function setPanel(name, options = {}) {
    if (!PANEL_META[name]) name = 'content';
    railButtons.forEach(btn => {
        const on = btn.dataset.panel === name;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', String(on));
        btn.tabIndex = on ? 0 : -1;
    });
    panelPanes.forEach(pane => {
        const on = pane.dataset.pane === name;
        pane.hidden = !on;
        pane.classList.toggle('is-active', on);
    });
    panelTitle.textContent = PANEL_META[name].title;
    panelIndex.textContent = PANEL_META[name].index;
    if (options.persist !== false) {
        try { localStorage.setItem(PANEL_KEY, name); } catch (_) { /* ignore */ }
    }
}

function setPanelOpen(open, options = {}) {
    workspace.classList.toggle('panel-collapsed', !open);
    panelCollapse.setAttribute('aria-expanded', String(open));
    panelCollapse.setAttribute('aria-label', open ? 'Collapse panel' : 'Expand panel');
    panelCollapse.title = open ? 'Collapse panel' : 'Expand panel';
    panelReveal.setAttribute('aria-expanded', String(open));
    if (!open && panel.contains(document.activeElement)) {
        const activeTab = railButtons.find(btn => btn.classList.contains('is-active'));
        (window.innerWidth > 960 ? panelReveal : activeTab || panelCollapse).focus();
    }
    if (options.persist !== false) {
        try { localStorage.setItem(`${PANEL_KEY}.open`, open ? '1' : '0'); } catch (_) { /* ignore */ }
    }
    if (open) window.setTimeout(applyZoom, 260);
}

function togglePanel() {
    setPanelOpen(workspace.classList.contains('panel-collapsed'));
}

railButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        setPanel(btn.dataset.panel);
        if (window.innerWidth <= 960 && workspace.classList.contains('panel-collapsed')) setPanelOpen(true);
    });
});

document.querySelector('.rail').addEventListener('keydown', e => {
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    const index = railButtons.indexOf(document.activeElement);
    if (index === -1) return;
    e.preventDefault();
    let next = index;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (index + 1) % railButtons.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (index - 1 + railButtons.length) % railButtons.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = railButtons.length - 1;
    railButtons[next].focus();
    setPanel(railButtons[next].dataset.panel);
});

panelCollapse.addEventListener('click', togglePanel);
panelReveal.addEventListener('click', () => setPanelOpen(true));

/* ============================================================
   Presets
   ============================================================ */
let presetRegistry = [];

function loadCustomPresets() {
    try {
        const raw = localStorage.getItem(PRESET_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(p => p && typeof p.name === 'string' && /^#[0-9a-f]{6}$/i.test(p.face || '')) : [];
    } catch { return []; }
}

function persistCustomPresets() {
    try { localStorage.setItem(PRESET_KEY, JSON.stringify(customPresets)); } catch (_) { /* ignore */ }
}

function paletteOfState() {
    return {
        bg: state.bg, tileBg: state.tileBg, face: state.face,
        shadow: state.shadow, highlight: state.highlight
    };
}

function renderPresets() {
    presetRegistry = BUILTIN_PRESETS.concat(customPresets.map(p => Object.assign({}, p, { custom: true })));
    const blocks = [];
    const group = (label, start, end) => {
        if (start >= end) return;
        blocks.push(`<div class="preset-group-label">${label}</div>`);
        for (let i = start; i < end; i++) blocks.push(presetMarkup(presetRegistry[i], i));
    };
    group('Classic', 0, Math.min(6, presetRegistry.length));
    group('Encaustic', 6, Math.min(12, presetRegistry.length));
    if (presetRegistry.length > 12) group('Saved', 12, presetRegistry.length);
    palettePresetsGrid.innerHTML = blocks.join('');
    presetCount.textContent = `${presetRegistry.length} palettes`;
    updatePresetActive();
}

function presetMarkup(preset, index) {
    const name = /[^\x00-\x7F]/.test(preset.name) ? `<span lang="vi">${escapeHtml(preset.name)}</span>` : escapeHtml(preset.name);
    const swatches = [preset.bg, preset.tileBg, preset.face, preset.shadow, preset.highlight]
        .map(color => `<span class="preset-color-block" style="background-color:${escapeHtml(color)}"></span>`).join('');
    const remove = preset.custom
        ? `<button class="preset-del" type="button" data-remove="${index}" aria-label="Delete palette ${escapeHtml(preset.name)}" title="Delete palette">✕</button>`
        : '';
    return `<div class="preset-wrap">
        <button class="preset" type="button" data-preset="${index}" aria-label="Apply palette ${escapeHtml(preset.name)}">
            <span class="preset-name">${name}</span>
            <span class="preset-colors">${swatches}</span>
        </button>${remove}
    </div>`;
}

function applyPreset(preset) {
    state.bg = preset.bg;
    state.tileBg = preset.tileBg;
    state.face = preset.face;
    state.shadow = preset.shadow;
    state.highlight = preset.highlight;
    rasterCache = null;
    syncUI();
    renderNow();
    saveNow();
    commitNow();
    showToast(`Palette “${preset.name}” applied.`);
}

function updatePresetActive() {
    $$('.preset', palettePresetsGrid).forEach(btn => {
        const preset = presetRegistry[Number(btn.dataset.preset)];
        if (!preset) return;
        const on = ['bg', 'tileBg', 'face', 'shadow', 'highlight'].every(key => preset[key].toLowerCase() === String(state[key]).toLowerCase());
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', String(on));
    });
}

palettePresetsGrid.addEventListener('click', e => {
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
        const index = Number(removeBtn.dataset.remove);
        const preset = presetRegistry[index];
        if (preset && preset.custom) {
            const customIndex = index - BUILTIN_PRESETS.length;
            customPresets.splice(customIndex, 1);
            persistCustomPresets();
            renderPresets();
            showToast('Saved palette deleted.');
        }
        return;
    }
    const btn = e.target.closest('[data-preset]');
    if (!btn) return;
    const preset = presetRegistry[Number(btn.dataset.preset)];
    if (preset) applyPreset(preset);
});

savePresetBtn.addEventListener('click', () => {
    const name = `Custom ${customPresets.length + 1}`;
    customPresets.push(Object.assign({ name }, paletteOfState()));
    persistCustomPresets();
    renderPresets();
    showToast(`Saved “${name}” to this browser.`);
});

function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    const to = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${to(r)}${to(g)}${to(b)}`;
}

randomizePaletteBtn.addEventListener('click', () => {
    const h = Math.floor(rng() * 360);
    const scheme = Math.floor(rng() * 3);
    const h2 = h + (scheme === 0 ? 172 : scheme === 1 ? 118 : 34);
    const h3 = h + (scheme === 0 ? 188 : scheme === 1 ? 238 : 322);
    state.bg = hslToHex(h, 10 + rng() * 12, 92 + rng() * 4);
    state.tileBg = hslToHex(h, 8 + rng() * 10, 78 + rng() * 7);
    state.face = hslToHex(h, 26 + rng() * 32, 16 + rng() * 14);
    state.shadow = hslToHex(h2, 34 + rng() * 30, 44 + rng() * 16);
    state.highlight = hslToHex(h3, 28 + rng() * 34, 74 + rng() * 10);
    rasterCache = null;
    syncUI();
    renderNow();
    saveNow();
    commitNow();
    showToast('A fresh palette, fired at random.');
});

/* ============================================================
   Logo loading
   ============================================================ */
function defaultLogoDataUrl() {
    return `data:image/svg+xml;base64,${bytesToBase64(new TextEncoder().encode(defaultLogoSVG))}`;
}

function loadLogoImage(dataUrl, name) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            loadedLogoImage = img;
            createLogoMasks(img);
            rasterCache = null;
            logoFileNameSpan.textContent = name || 'Default mark';
            requestRender();
            resolve(true);
        };
        img.onerror = () => {
            showToast('That file could not be read — try a PNG, SVG or JPG.');
            resolve(false);
        };
        img.src = dataUrl;
    });
}

function handleLogoFile(file) {
    if (!file) return;
    if (!/^image\/(png|svg\+xml|jpeg|jpg)$/.test(file.type)) {
        showToast('Unsupported file — use PNG, SVG or JPG.');
        return;
    }
    const reader = new FileReader();
    reader.onload = async event => {
        const dataUrl = String(event.target.result);
        const ok = await loadLogoImage(dataUrl, file.name);
        if (!ok) return;
        state.logo = dataUrl;
        state.logoName = file.name;
        state.mode = 'logo';
        syncUI();
        renderNow();
        saveNow();
        commitNow();
        showToast(`Logo “${file.name}” loaded.`);
    };
    reader.onerror = () => showToast('Could not read that file.');
    reader.readAsDataURL(file);
}

document.getElementById('logoBrowse').addEventListener('click', e => {
    e.stopPropagation();
    logoInput.click();
});

logoDrop.addEventListener('click', e => {
    if (e.target.closest('button')) return;
    logoInput.click();
});

logoInput.addEventListener('change', e => handleLogoFile(e.target.files[0]));

['dragenter', 'dragover'].forEach(type => {
    logoDrop.addEventListener(type, e => {
        e.preventDefault();
        logoDrop.classList.add('is-over');
    });
});
['dragleave', 'dragend'].forEach(type => {
    logoDrop.addEventListener(type, () => logoDrop.classList.remove('is-over'));
});
logoDrop.addEventListener('drop', e => {
    e.preventDefault();
    logoDrop.classList.remove('is-over');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleLogoFile(file);
});

/* ============================================================
   Input wiring
   ============================================================ */
RANGE_FIELDS.forEach(([el, key]) => {
    el.addEventListener('input', () => {
        state[key] = parseFloat(el.value);
        if (key === 'tileBg') noiseCache.key = null;
        updateRangeFill(el);
        markChanged();
    });
});

textInput.addEventListener('input', () => {
    state.text = textInput.value;
    markChanged();
});

textFontSelect.addEventListener('change', () => {
    state.font = textFontSelect.value;
    markChanged();
    ensureFont();
});

$$('input[name="contentMode"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (!radio.checked) return;
        state.mode = radio.value;
        applyModeVisibility();
        markChanged();
        commitNow();
        if (state.mode === 'logo' && !loadedLogoImage) loadLogoImage(defaultLogoDataUrl(), '');
    });
});

$$('input[name="textAlign"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (!radio.checked) return;
        state.align = radio.value;
        markChanged();
    });
});

tileStyleGrid.addEventListener('click', e => {
    const btn = e.target.closest('.tile-option');
    if (!btn) return;
    state.tileStyle = btn.dataset.style;
    updateTileButtons();
    markChanged();
    commitNow();
});

borderPatternGrid.addEventListener('click', e => {
    const btn = e.target.closest('.border-option');
    if (!btn) return;
    state.border = btn.dataset.pattern;
    updateBorderButtons();
    refreshChrome();
    markChanged();
    commitNow();
});

function arrowNavGroup(container, selector) {
    container.addEventListener('keydown', e => {
        if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) return;
        const buttons = $$(selector, container);
        const index = buttons.indexOf(document.activeElement);
        if (index === -1) return;
        e.preventDefault();
        const step = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
        const next = buttons[(index + step + buttons.length) % buttons.length];
        next.focus();
        next.click();
    });
}
arrowNavGroup(tileStyleGrid, '.tile-option');
arrowNavGroup(borderPatternGrid, '.border-option');

COLOR_FIELDS.forEach(([input, key]) => {
    input.addEventListener('input', () => {
        state[key] = input.value;
        if (key === 'tileBg') noiseCache.key = null;
        if (key === 'band' || key === 'borderColor' || key === 'borderAccent') rasterCache = null;
        markChanged();
    });
});

tileShadingCheckbox.addEventListener('change', () => {
    state.shading = tileShadingCheckbox.checked;
    markChanged();
});

groutNoiseCheckbox.addEventListener('change', () => {
    state.noise = groutNoiseCheckbox.checked;
    markChanged();
});

autoHeightCheckbox.addEventListener('change', () => {
    state.autoHeight = autoHeightCheckbox.checked;
    if (!state.autoHeight) {
        state.height = canvas.height || state.height;
        canvasHeightInput.max = Math.max(1500, state.height);
    }
    syncUI();
    markChanged();
    commitNow();
});

showTextCheckbox.addEventListener('change', () => {
    state.showContent = showTextCheckbox.checked;
    markChanged();
});

sizePresets.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    state.width = Number(chip.dataset.w);
    state.height = Number(chip.dataset.h);
    state.autoHeight = chip.dataset.auto === 'true';
    $$('.chip', sizePresets).forEach(c => c.classList.toggle('is-active', c === chip));
    syncUI();
    renderNow();
    saveNow();
    commitNow();
    showToast(`Format set to ${chip.textContent.trim()}.`);
});

document.getElementById('resetTextPos').addEventListener('click', () => {
    state.textX = 0;
    state.textY = 0;
    markChanged();
    commitNow();
    showToast('Content recentred.');
});

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

resetBtn.addEventListener('click', () => {
    const docName = state.docName;
    state = Object.assign({}, DEFAULTS, { docName });
    loadedLogoImage = null;
    rasterCache = null;
    syncUI();
    loadLogoImage(defaultLogoDataUrl(), '');
    renderNow();
    saveNow();
    commitNow();
    showToast('Studio reset — press Ctrl/⌘ Z to undo.');
});

docNameInput.addEventListener('input', () => {
    state.docName = docNameInput.value.slice(0, 80) || 'Untitled mosaic';
    document.title = `${state.docName} — Mosaic System`;
    scheduleSave();
    scheduleCommit();
});
docNameInput.addEventListener('blur', () => {
    if (!docNameInput.value.trim()) {
        state.docName = 'Untitled mosaic';
        docNameInput.value = state.docName;
    }
    commitNow();
});

exportScaleSelect.addEventListener('change', refreshExportHint);

btnExportPNG.addEventListener('click', exportPNG);
btnExportSVG.addEventListener('click', exportSVG);

zoomInBtn.addEventListener('click', () => stepZoom(1));
zoomOutBtn.addEventListener('click', () => stepZoom(-1));
zoomFitBtn.addEventListener('click', () => { setZoom('fit', 1); showToast('Zoomed to fit.'); });

copyLinkBtn.addEventListener('click', copyShareLink);

aboutBtn.addEventListener('click', () => {
    if (typeof aboutDialog.showModal === 'function') aboutDialog.showModal();
    else aboutDialog.setAttribute('open', '');
});
aboutClose.addEventListener('click', () => aboutDialog.close());
aboutDialog.addEventListener('click', e => {
    if (e.target === aboutDialog) aboutDialog.close();
});

canvas.addEventListener('pointerenter', applyZoom);
canvasScrollArea.addEventListener('scroll', () => { if (lastMetrics) refreshBounds(lastMetrics.bounds); }, { passive: true });

document.querySelector('.stage').addEventListener('transitionend', applyZoom);

/* Keyboard shortcuts */
document.addEventListener('keydown', e => {
    const target = e.target;
    const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
    const meta = e.ctrlKey || e.metaKey;
    if (meta && !typing && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
    } else if (meta && !typing && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
    } else if (e.key === 'Escape' && window.innerWidth <= 960 && !workspace.classList.contains('panel-collapsed') && !aboutDialog.open) {
        setPanelOpen(false);
    }
});

/* Fonts */
let fontLoadTimer = null;
function ensureFont() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const spec = `${fontWeightFor(state.font)} 100px ${state.font}`;
    return document.fonts.load(spec, state.text || 'Aa').catch(() => {}).then(() => {
        rasterCache = null;
        requestRender();
    });
}
if (document.fonts) {
    document.fonts.addEventListener('loadingdone', () => {
        window.clearTimeout(fontLoadTimer);
        fontLoadTimer = window.setTimeout(() => { rasterCache = null; requestRender(); }, 60);
    });
}

/* Resize */
let resizeTimer = null;
let lastNarrow = window.innerWidth <= 960;
window.addEventListener('resize', () => {
    const narrow = window.innerWidth <= 960;
    if (narrow !== lastNarrow) {
        lastNarrow = narrow;
        // Crossing into the drawer layout should not leave the panel covering the stage.
        if (narrow) setPanelOpen(false, { persist: false });
    }
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
        if (zoomMode === 'fit') applyZoom();
        if (lastMetrics) refreshBounds(lastMetrics.bounds);
    }, 120);
});

/* ============================================================
   Boot
   ============================================================ */
function init() {
    customPresets = loadCustomPresets();
    const shared = readShareState();
    const saved = loadSaved();
    state = sanitize(shared || saved || DEFAULTS);

    renderPresets();
    syncUI();
    setPanel(localStorage.getItem(PANEL_KEY) || 'content', { persist: false });

    const storedOpen = localStorage.getItem(`${PANEL_KEY}.open`);
    const narrow = window.innerWidth <= 960;
    setPanelOpen(storedOpen === null ? !narrow : storedOpen === '1', { persist: false });

    initHistory();
    renderNow();
    setZoom('fit', 1);

    const logoUrl = state.logo || defaultLogoDataUrl();
    loadLogoImage(logoUrl, state.logoName || '');

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => { rasterCache = null; renderNow(); });
    }

    if (shared) showToast('Shared settings loaded from the link.');
    else if (saved) showToast('Restored your last session.');
}

init();
