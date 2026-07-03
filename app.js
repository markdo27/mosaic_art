// DOM Elements & Inputs
const textInput = document.getElementById('textInput');
const textFontSelect = document.getElementById('textFont');
const fontScaleInput = document.getElementById('fontScale');
const letterSpacingInput = document.getElementById('letterSpacing');
const textRotationInput = document.getElementById('textRotation');

const tileStyleSelect = document.getElementById('tileStyle');
const tileSizeInput = document.getElementById('tileSize');
const groutSizeInput = document.getElementById('groutSize');
const bevelDepthInput = document.getElementById('bevelDepth');

const bgColorPicker = document.getElementById('bgColor');
const tileBgColorPicker = document.getElementById('tileBgColor');
const faceColorPicker = document.getElementById('faceColor');
const shadowColorPicker = document.getElementById('shadowColor');
const highlightColorPicker = document.getElementById('highlightColor');

const shadowGroup = document.getElementById('shadowGroup');
const highlightGroup = document.getElementById('highlightGroup');
const palettePresetsGrid = document.getElementById('palettePresets');

const colorVarianceInput = document.getElementById('colorVariance');
const groutNoiseCheckbox = document.getElementById('groutNoise');
const tileShadingCheckbox = document.getElementById('tileShading');
const tileShadingGroup = document.getElementById('tileShadingGroup');

const canvasWidthInput = document.getElementById('canvasWidth');
const canvasHeightInput = document.getElementById('canvasHeight');
const autoHeightCheckbox = document.getElementById('autoHeight');
const canvasResIndicator = document.getElementById('canvasResIndicator');
const renderTimeIndicator = document.getElementById('renderTimeIndicator');

// Border pattern controls (new dropdown replaces old subway checkbox)
const borderPatternSelect = document.getElementById('borderPattern');
const borderSettingsGroup = document.getElementById('borderSettingsGroup');
const subwayBandColorPicker = document.getElementById('subwayBandColor');
const subwayBorderColorPicker = document.getElementById('subwayBorderColor');
const subwayHeaderColorPicker = document.getElementById('subwayHeaderColor');
const showTextCheckbox = document.getElementById('showText');

const canvas = document.getElementById('mosaicCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const hiddenCanvas = document.createElement('canvas');
const hiddenCtx = hiddenCanvas.getContext('2d', { willReadFrequently: true });

// Export buttons
const btnExportPNG = document.getElementById('btnExportPNG');
const btnExportSVG = document.getElementById('btnExportSVG');
const exportScaleSelect = document.getElementById('exportScale');
const toastNotification = document.getElementById('toastNotification');

// Sidebar toggle
const btnToggleSidebar = document.querySelector('.toggle-sidebar');
const sidebar = document.querySelector('.sidebar');

// Interactivity State
let textX = 0;
let textY = 0;
let isDraggingText = false;
let startDragX = 0;
let startDragY = 0;
let textStartOffsetX = 0;
let textStartOffsetY = 0;

// Curated Vintage Encaustic Palettes
const presets = [
    { name: "Cobalt Classic", bg: "#ecece6", tileBg: "#cccabf", face: "#1e3d6b", shadow: "#7ba2cc", highlight: "#edd5b2" },
    { name: "Art Deco Navy", bg: "#e5dec9", tileBg: "#ccc2ad", face: "#162a45", shadow: "#c98f3c", highlight: "#faebcf" },
    { name: "Victorian Sage", bg: "#ece7db", tileBg: "#d0c6b3", face: "#3b5842", shadow: "#b2624f", highlight: "#ebd4b0" },
    { name: "Tuscan Hearth", bg: "#ece3d3", tileBg: "#cca896", face: "#872b22", shadow: "#4d3936", highlight: "#dec08f" },
    { name: "Mid-Century Olive", bg: "#e4ded2", tileBg: "#cdbfac", face: "#4f5d2f", shadow: "#8b5a2b", highlight: "#ebd09f" },
    { name: "Retro Flamingo", bg: "#ebdcd3", tileBg: "#cca99c", face: "#d46a78", shadow: "#405d6b", highlight: "#fcedc0" }
];

// Helper: Show Toast Notification
function showToast(message) {
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    setTimeout(() => { toastNotification.classList.remove('show'); }, 3000);
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

// Generate slight color shift
function getVariantColor(hex, variancePercent) {
    if (variancePercent === 0) return hex;
    const hsl = hexToHsl(hex);
    const hVar = (Math.random() - 0.5) * (variancePercent * 1.5);
    const sVar = (Math.random() - 0.5) * (variancePercent * 2.0);
    const lVar = (Math.random() - 0.5) * (variancePercent * 2.0);
    let h = Math.max(0, Math.min(360, hsl.h + hVar));
    let s = Math.max(0, Math.min(100, hsl.s + sVar));
    let l = Math.max(0, Math.min(100, hsl.l + lVar));
    return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

// Render sand grain noise onto grout background
function createNoisePattern(colorHex) {
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 128; noiseCanvas.height = 128;
    const nCtx = noiseCanvas.getContext('2d');
    nCtx.fillStyle = colorHex; nCtx.fillRect(0, 0, 128, 128);
    const imgData = nCtx.getImageData(0, 0, 128, 128);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 12;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
        data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
    }
    nCtx.putImageData(imgData, 0, 0);
    return ctx.createPattern(noiseCanvas, 'repeat');
}

// ============================================================
// BORDER PATTERN HELPERS
// ============================================================

function getBorderVariant(x, y, tileSize) {
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);
    const hash = Math.abs(Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1;
    const hsl = hexToHsl(subwayBorderColorPicker.value);
    let hShift = 0, lShift = 0;
    if (hash < 0.35) { hShift = -4; lShift = -5; }
    else if (hash < 0.7) { hShift = 4; lShift = 5; }
    let h = Math.max(0, Math.min(360, hsl.h + hShift));
    let s = Math.max(0, Math.min(100, hsl.s));
    let l = Math.max(0, Math.min(100, hsl.l + lShift));
    return `hsl(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%)`;
}

function getBellOrnamentColor(relX, relY) {
    const gold = '#cca05a', green = '#1a3b2b', cream = subwayHeaderColorPicker.value;
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
    const bandC = subwayBandColorPicker.value, accentC = subwayHeaderColorPicker.value;
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
    const borderC = subwayBorderColorPicker.value, accentC = subwayHeaderColorPicker.value, bandC = subwayBandColorPicker.value;
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
    const borderC = subwayBorderColorPicker.value, accentC = subwayHeaderColorPicker.value, bandC = subwayBandColorPicker.value;
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
    const borderC = subwayBorderColorPicker.value, accentC = subwayHeaderColorPicker.value, bandC = subwayBandColorPicker.value;
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
// UNIFIED DISPATCHER
// ============================================================
function getBorderTileColor(pat, x, y, data, cw, ch, cx, cy, tbYs, tbYe, topYs, botYe, ts, bRows, is3D, fc, sc, hc, bg) {
    switch (pat) {
        case 'subway': return getSubwayTileColor(x,y,data,cw,ch,cx,cy,tbYs,tbYe,topYs,botYe,ts,bRows,is3D,fc,sc,hc,bg);
        case 'greek': return getGreekKeyTileColor(x,y,data,cw,ch,cx,cy,tbYs,tbYe,topYs,botYe,ts,bRows,is3D,fc,sc,hc,bg);
        case 'artdeco': return getArtDecoTileColor(x,y,data,cw,ch,cx,cy,tbYs,tbYe,topYs,botYe,ts,bRows,is3D,fc,sc,hc,bg);
        case 'victorian': return getVictorianTileColor(x,y,data,cw,ch,cx,cy,tbYs,tbYe,topYs,botYe,ts,bRows,is3D,fc,sc,hc,bg);
        default: return bg;
    }
}

// ============================================================
// TEXT WRAPPING & DRAWING
// ============================================================
function wrapText(context, text, maxWidth) {
    const paragraphs = text.split('\n');
    let lines = [];
    for (let p = 0; p < paragraphs.length; p++) {
        let words = paragraphs[p].split(' ');
        let currentLine = words[0] || '';
        for (let i = 1; i < words.length; i++) {
            let word = words[i];
            let width = context.measureText(currentLine + " " + word).width;
            if (width < maxWidth) { currentLine += " " + word; }
            else { lines.push(currentLine); currentLine = word; }
        }
        lines.push(currentLine);
    }
    return lines;
}

function drawTextLineOrSpaced(targetCtx, text, x, y, spacing, rotation) {
    if (spacing === 0 && rotation === 0) { targetCtx.fillText(text, x, y); return; }
    targetCtx.save();
    targetCtx.translate(x, y);
    targetCtx.rotate(rotation * Math.PI / 180);
    const chars = text.split('');
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

// ============================================================
// CORE ENGINE: RENDER
// ============================================================
function renderMosaic() {
    const startTime = performance.now();
    const text = textInput.value || " ";
    const fontFace = textFontSelect.value;
    const fontScale = parseFloat(fontScaleInput.value) / 100;
    const letterSpacing = parseInt(letterSpacingInput.value);
    const textRotation = parseInt(textRotationInput.value);
    const style = tileStyleSelect.value;
    const tileSize = parseInt(tileSizeInput.value);
    const groutSize = parseFloat(groutSizeInput.value);
    const bevelDepth = parseFloat(bevelDepthInput.value);
    const tileBgColor = bgColorPicker.value;
    const groutColor = tileBgColorPicker.value;
    const faceColor = faceColorPicker.value;
    const shadowColor = shadowColorPicker.value;
    const highlightColor = highlightColorPicker.value;
    const colorVariance = parseInt(colorVarianceInput.value);
    const useGroutNoise = groutNoiseCheckbox.checked;
    const useTileShading = tileShadingCheckbox.checked;
    const canvasWidth = parseInt(canvasWidthInput.value) || 900;
    const canvasHeight = parseInt(canvasHeightInput.value) || 350;
    const autoHeight = autoHeightCheckbox.checked;
    const borderPattern = borderPatternSelect.value;
    const hasBorder = borderPattern !== 'none';
    const showText = showTextCheckbox.checked;

    const is3DMode = (style === 'beveled');
    if (is3DMode) { shadowGroup.classList.remove('disabled'); highlightGroup.classList.remove('disabled'); }
    else { shadowGroup.classList.add('disabled'); highlightGroup.classList.add('disabled'); }
    tileShadingGroup.style.display = is3DMode ? 'flex' : 'none';
    borderSettingsGroup.style.display = hasBorder ? 'flex' : 'none';

    const isStyle1 = (style === 'square');
    const baseFontSize = (isStyle1 ? 110 : 100) * fontScale;
    const lineHeight = (isStyle1 ? 120 : 110) * fontScale;
    const weight = (fontFace.includes('Times New Roman') || fontFace.includes('Times')) ? 'bold' : '900';
    const fontString = `${weight} ${baseFontSize}px ${fontFace}`;
    hiddenCtx.font = fontString;
    const padding = 60;
    const lines = wrapText(hiddenCtx, text, canvasWidth - padding);
    const totalTextHeight = lines.length * lineHeight;

    // Responsive border rows
    const borderRows = hasBorder ? Math.max(4, Math.min(14, Math.round(canvasWidth / tileSize * 0.1))) : 0;
    const borderHeight = borderRows * tileSize;
    const layoutPadding = hasBorder ? (borderHeight * 2 + tileSize * 4) : (padding * 2);
    const requiredCanvasHeight = autoHeight ? Math.max(350, totalTextHeight + layoutPadding) : canvasHeight;

    if (canvas.width !== canvasWidth || canvas.height !== requiredCanvasHeight) {
        canvas.width = canvasWidth; canvas.height = requiredCanvasHeight;
        hiddenCanvas.width = canvasWidth; hiddenCanvas.height = requiredCanvasHeight;
        if (requiredCanvasHeight > parseInt(canvasHeightInput.max)) canvasHeightInput.max = Math.ceil(requiredCanvasHeight);
        canvasHeightInput.value = Math.round(requiredCanvasHeight);
        canvasResIndicator.textContent = `${canvasWidth} x ${Math.round(requiredCanvasHeight)}`;
        syncAllSliderDisplays();
    }

    hiddenCtx.clearRect(0, 0, canvasWidth, requiredCanvasHeight);
    const centerX = (canvasWidth / 2) + textX;
    const centerY = (requiredCanvasHeight / 2) + textY;

    if (showText) {
        hiddenCtx.font = fontString; hiddenCtx.textBaseline = 'middle'; hiddenCtx.textAlign = 'center';
        let startY = (requiredCanvasHeight - totalTextHeight) / 2 + (lineHeight / 2) + textY;
        lines.forEach((line, index) => {
            const currentY = startY + (index * lineHeight);
            if (is3DMode) {
                hiddenCtx.fillStyle = 'rgb(0, 0, 255)'; drawTextLineOrSpaced(hiddenCtx, line, centerX - 3, currentY - 3, letterSpacing, textRotation);
                hiddenCtx.fillStyle = 'rgb(0, 255, 0)'; for (let i = 1; i <= 8; i++) drawTextLineOrSpaced(hiddenCtx, line, centerX - (i * 1.5), currentY + (i * 1.5), letterSpacing, textRotation);
                hiddenCtx.fillStyle = 'rgb(255, 0, 0)'; drawTextLineOrSpaced(hiddenCtx, line, centerX, currentY, letterSpacing, textRotation);
            } else {
                hiddenCtx.fillStyle = 'rgb(255, 0, 0)'; drawTextLineOrSpaced(hiddenCtx, line, centerX, currentY, letterSpacing, textRotation);
            }
        });
    }

    const imageData = hiddenCtx.getImageData(0, 0, canvasWidth, requiredCanvasHeight);
    const data = imageData.data;
    if (useGroutNoise) { ctx.fillStyle = createNoisePattern(groutColor); } else { ctx.fillStyle = groutColor; }
    ctx.fillRect(0, 0, canvasWidth, requiredCanvasHeight);

    if (hasBorder) {
        const textBandHeight = Math.max(tileSize * 8, totalTextHeight + 40);
        const textBandYStart = centerY - textBandHeight / 2;
        const textBandYEnd = centerY + textBandHeight / 2;
        const TopBorderYStart = textBandYStart - borderHeight;
        const BottomBorderYEnd = textBandYEnd + borderHeight;

        const fieldTileSize = Math.round(tileSize * 2.5);
        let fieldRow = 0;
        for (let y = TopBorderYStart - fieldTileSize; y > -fieldTileSize; y -= fieldTileSize) {
            const ox = (fieldRow % 2 === 1) ? (fieldTileSize / 2) : 0;
            for (let x = -fieldTileSize; x < canvasWidth + fieldTileSize; x += fieldTileSize) {
                const ax = x + ox; if (ax > canvasWidth) continue;
                drawSquareTile(ctx, ax + groutSize, y + groutSize, fieldTileSize - groutSize*2, getVariantColor(tileBgColor, colorVariance), bevelDepth, useTileShading);
            }
            fieldRow++;
        }
        fieldRow = 0;
        for (let y = BottomBorderYEnd; y < requiredCanvasHeight + fieldTileSize; y += fieldTileSize) {
            const ox = (fieldRow % 2 === 1) ? (fieldTileSize / 2) : 0;
            for (let x = -fieldTileSize; x < canvasWidth + fieldTileSize; x += fieldTileSize) {
                const ax = x + ox; if (ax > canvasWidth) continue;
                drawSquareTile(ctx, ax + groutSize, y + groutSize, fieldTileSize - groutSize*2, getVariantColor(tileBgColor, colorVariance), bevelDepth, useTileShading);
            }
            fieldRow++;
        }

        let smallRow = 0;
        for (let y = TopBorderYStart; y < BottomBorderYEnd; y += tileSize) {
            for (let x = 0; x < canvasWidth; x += tileSize) {
                const tc = getBorderTileColor(borderPattern, x, y, data, canvasWidth, requiredCanvasHeight, centerX, centerY, textBandYStart, textBandYEnd, TopBorderYStart, BottomBorderYEnd, tileSize, borderRows, is3DMode, faceColor, shadowColor, highlightColor, tileBgColor);
                const fc2 = getVariantColor(tc, colorVariance);
                const tr = (tileSize / 2) - groutSize, tcx = x + tileSize/2, tcy = y + tileSize/2;
                if (style === 'square' || style === 'beveled') drawSquareTile(ctx, x + groutSize, y + groutSize, tileSize - groutSize*2, fc2, bevelDepth, useTileShading);
                else if (style === 'circle') drawCircleTile(ctx, tcx, tcy, tr, fc2, bevelDepth, useTileShading);
                else if (style === 'hexagon') drawHexagonTile(ctx, tcx, tcy, tr + 1, fc2, bevelDepth, useTileShading);
                else if (style === 'triangle') { const col = Math.floor(x / tileSize); drawTriangleTile(ctx, tcx, tcy, tr + 1, fc2, bevelDepth, useTileShading, (smallRow + col) % 2 === 0); }
                else if (style === 'diamond') drawDiamondTile(ctx, tcx, tcy, (tileSize/2) - groutSize, fc2, bevelDepth, useTileShading);
            }
            smallRow++;
        }
    } else {
        let stepX = tileSize, stepY = tileSize;
        if (style === 'circle' || style === 'hexagon') stepY = tileSize * 0.866;
        else if (style === 'triangle') { stepX = tileSize / 2; stepY = tileSize * 0.866; }
        else if (style === 'diamond') { stepX = tileSize * 0.82; stepY = tileSize / 2; }
        let row = 0;
        for (let y = 0; y < requiredCanvasHeight; y += stepY) {
            let offsetX = (row % 2 === 1 && (style === 'circle' || style === 'hexagon')) ? (tileSize / 2) : 0;
            for (let x = 0; x < canvasWidth; x += stepX) {
                const ax = x + offsetX; if (ax > canvasWidth) continue;
                const si = (Math.floor(y) * canvasWidth + Math.floor(ax)) * 4;
                const r = data[si], g = data[si+1], b = data[si+2], a = data[si+3];
                let tc = tileBgColor;
                if (a > 50) { if (is3DMode) { if (r>g&&r>b) tc=faceColor; else if(g>r&&g>b) tc=shadowColor; else if(b>r&&b>g) tc=highlightColor; else tc=faceColor; } else tc=faceColor; }
                const fc2 = getVariantColor(tc, colorVariance);
                const radius = (tileSize/2) - groutSize, cx = ax + tileSize/2, cy = y + tileSize/2;
                if (style === 'square' || style === 'beveled') drawSquareTile(ctx, ax + groutSize, y + groutSize, tileSize - groutSize*2, fc2, bevelDepth, useTileShading);
                else if (style === 'circle') drawCircleTile(ctx, cx, cy, radius, fc2, bevelDepth, useTileShading);
                else if (style === 'hexagon') drawHexagonTile(ctx, cx, cy, radius + 1, fc2, bevelDepth, useTileShading);
                else if (style === 'triangle') { const col = Math.floor(x / stepX); drawTriangleTile(ctx, cx, cy, radius + 1, fc2, bevelDepth, useTileShading, (row + col) % 2 === 0); }
                else if (style === 'diamond') drawDiamondTile(ctx, cx, cy, (tileSize/2) - groutSize, fc2, bevelDepth, useTileShading);
            }
            row++;
        }
    }
    renderTimeIndicator.textContent = `${(performance.now() - startTime).toFixed(0)}ms`;
}

// ============================================================
// EXPORT SUITE
// ============================================================
function generateSVGString() {
    const text = textInput.value || " ", fontFace = textFontSelect.value, fontScale = parseFloat(fontScaleInput.value)/100;
    const style = tileStyleSelect.value, tileSize = parseInt(tileSizeInput.value), groutSize = parseFloat(groutSizeInput.value), bevelDepth = parseFloat(bevelDepthInput.value);
    const tileBgColor = bgColorPicker.value, groutColor = tileBgColorPicker.value, faceColor = faceColorPicker.value, shadowColor = shadowColorPicker.value, highlightColor = highlightColorPicker.value;
    const colorVariance = parseInt(colorVarianceInput.value), useTileShading = tileShadingCheckbox.checked;
    const canvasWidth = canvas.width, canvasHeight = canvas.height;
    const imageData = hiddenCtx.getImageData(0, 0, canvasWidth, canvasHeight), data = imageData.data;
    let svg = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="100%" height="100%">\n  <defs>\n    <linearGradient id="bevel-gloss" x1="0%" y1="0%" x2="100%" y2="100%">\n      <stop offset="0%" stop-color="white" stop-opacity="0.32" />\n      <stop offset="40%" stop-color="white" stop-opacity="0.08" />\n      <stop offset="60%" stop-color="black" stop-opacity="0.0" />\n      <stop offset="100%" stop-color="black" stop-opacity="0.35" />\n    </linearGradient>\n  </defs>\n  <rect width="100%" height="100%" fill="${groutColor}" />\n  <g id="tiles">\n`;
    const centerX = (canvasWidth/2)+textX, centerY = (canvasHeight/2)+textY;
    const isStyle1 = (style === 'square'), baseFontSize = (isStyle1 ? 110 : 100)*fontScale, lineHeight = (isStyle1 ? 120 : 110)*fontScale;
    const weight = (fontFace.includes('Times New Roman')||fontFace.includes('Times')) ? 'bold' : '900';
    hiddenCtx.font = `${weight} ${baseFontSize}px ${fontFace}`;
    const lines = wrapText(hiddenCtx, text, canvasWidth - 60), totalTextHeight = lines.length*lineHeight;
    const is3DMode = (style === 'beveled'), borderPattern = borderPatternSelect.value, hasBorder = borderPattern !== 'none';
    const borderRows = hasBorder ? Math.max(4, Math.min(14, Math.round(canvasWidth/tileSize*0.1))) : 0;
    const borderHeight = borderRows*tileSize;

    const emitRect = (sx,sy,sz,c) => { svg += `    <rect x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" fill="${c}" />\n`; if (useTileShading && bevelDepth > 0) svg += `    <rect x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sz.toFixed(1)}" height="${sz.toFixed(1)}" fill="url(#bevel-gloss)" opacity="0.8" />\n`; };
    const emitCirc = (cx,cy,r,c) => { svg += `    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" />\n`; if (useTileShading && bevelDepth > 0) svg += `    <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#bevel-gloss)" opacity="0.8" />\n`; };
    const emitPoly = (pts,c) => { svg += `    <polygon points="${pts}" fill="${c}" />\n`; if (useTileShading && bevelDepth > 0) svg += `    <polygon points="${pts}" fill="url(#bevel-gloss)" opacity="0.8" />\n`; };
    const emitTile = (x,y,ts,gs,fc2,st,row) => {
        const r = (ts/2)-gs, cx = x+ts/2, cy = y+ts/2;
        if (st==='square'||st==='beveled') emitRect(x+gs,y+gs,ts-gs*2,fc2);
        else if (st==='circle') emitCirc(cx,cy,r,fc2);
        else if (st==='hexagon') { let p=[]; for(let i=0;i<6;i++){const a=(Math.PI/3)*i-Math.PI/6; p.push(`${(cx+(r+0.5)*Math.cos(a)).toFixed(1)},${(cy+(r+0.5)*Math.sin(a)).toFixed(1)}`);} emitPoly(p.join(' '),fc2); }
        else if (st==='triangle') { const col=Math.floor(x/ts),up=(row+col)%2===0,rad=r+1; let p=[]; if(up){p.push(`${cx.toFixed(1)},${(cy-rad).toFixed(1)}`);p.push(`${(cx+rad*0.866).toFixed(1)},${(cy+rad*0.5).toFixed(1)}`);p.push(`${(cx-rad*0.866).toFixed(1)},${(cy+rad*0.5).toFixed(1)}`);}else{p.push(`${cx.toFixed(1)},${(cy+rad).toFixed(1)}`);p.push(`${(cx+rad*0.866).toFixed(1)},${(cy-rad*0.5).toFixed(1)}`);p.push(`${(cx-rad*0.866).toFixed(1)},${(cy-rad*0.5).toFixed(1)}`);} emitPoly(p.join(' '),fc2); }
        else if (st==='diamond') { const dr=(ts/2)-gs; let p=[]; p.push(`${cx.toFixed(1)},${(cy-dr).toFixed(1)}`);p.push(`${(cx+dr*0.82).toFixed(1)},${cy.toFixed(1)}`);p.push(`${cx.toFixed(1)},${(cy+dr).toFixed(1)}`);p.push(`${(cx-dr*0.82).toFixed(1)},${cy.toFixed(1)}`); emitPoly(p.join(' '),fc2); }
    };

    if (hasBorder) {
        const tbH = Math.max(tileSize*8, totalTextHeight+40), tbYs = centerY-tbH/2, tbYe = centerY+tbH/2;
        const topYs = tbYs-borderHeight, botYe = tbYe+borderHeight;
        const fts = Math.round(tileSize*2.5);
        let fr = 0;
        for (let y = topYs-fts; y > -fts; y -= fts) { const ox=(fr%2===1)?(fts/2):0; for(let x=-fts;x<canvasWidth+fts;x+=fts){const ax=x+ox;if(ax>canvasWidth)continue;emitRect(ax+groutSize,y+groutSize,fts-groutSize*2,getVariantColor(tileBgColor,colorVariance));} fr++; }
        fr=0;
        for (let y = botYe; y < canvasHeight+fts; y += fts) { const ox=(fr%2===1)?(fts/2):0; for(let x=-fts;x<canvasWidth+fts;x+=fts){const ax=x+ox;if(ax>canvasWidth)continue;emitRect(ax+groutSize,y+groutSize,fts-groutSize*2,getVariantColor(tileBgColor,colorVariance));} fr++; }
        let sr=0;
        for (let y = topYs; y < botYe; y += tileSize) { for(let x=0;x<canvasWidth;x+=tileSize){ const tc=getBorderTileColor(borderPattern,x,y,data,canvasWidth,canvasHeight,centerX,centerY,tbYs,tbYe,topYs,botYe,tileSize,borderRows,is3DMode,faceColor,shadowColor,highlightColor,tileBgColor); emitTile(x,y,tileSize,groutSize,getVariantColor(tc,colorVariance),style,sr); } sr++; }
    } else {
        let stepX=tileSize,stepY=tileSize;
        if(style==='circle'||style==='hexagon')stepY=tileSize*0.866; else if(style==='triangle'){stepX=tileSize/2;stepY=tileSize*0.866;} else if(style==='diamond'){stepX=tileSize*0.82;stepY=tileSize/2;}
        let row=0;
        for(let y=0;y<canvasHeight;y+=stepY){ let ox=(row%2===1&&(style==='circle'||style==='hexagon'))?(tileSize/2):0; for(let x=0;x<canvasWidth;x+=stepX){ const ax=x+ox;if(ax>canvasWidth)continue; const si=(Math.floor(y)*canvasWidth+Math.floor(ax))*4; let tc=tileBgColor; if(data[si+3]>50){if(is3DMode){const r=data[si],g=data[si+1],b=data[si+2];if(r>g&&r>b)tc=faceColor;else if(g>r&&g>b)tc=shadowColor;else if(b>r&&b>g)tc=highlightColor;else tc=faceColor;}else tc=faceColor;} emitTile(ax,y,tileSize,groutSize,getVariantColor(tc,colorVariance),style,row); } row++; }
    }
    svg += `  </g>\n</svg>`;
    return svg;
}

function exportPNG() {
    const scale = parseInt(exportScaleSelect.value);
    const ow = canvas.width, oh = canvas.height;
    const ots=parseInt(tileSizeInput.value),ogs=parseFloat(groutSizeInput.value),obd=parseFloat(bevelDepthInput.value),ofs=parseFloat(fontScaleInput.value),ols=parseInt(letterSpacingInput.value);
    // Temporarily raise slider max to accommodate scaled values
    const origMaxW = canvasWidthInput.max, origMaxH = canvasHeightInput.max;
    canvasWidthInput.max = 20000; canvasHeightInput.max = 20000;
    tileSizeInput.value=ots*scale;groutSizeInput.value=ogs*scale;bevelDepthInput.value=obd*scale;fontScaleInput.value=ofs*scale;letterSpacingInput.value=ols*scale;canvasWidthInput.value=ow*scale;canvasHeightInput.value=oh*scale;
    const otx=textX,oty=textY;textX*=scale;textY*=scale;
    renderMosaic();
    const dataURL = canvas.toDataURL('image/png');
    tileSizeInput.value=ots;groutSizeInput.value=ogs;bevelDepthInput.value=obd;fontScaleInput.value=ofs;letterSpacingInput.value=ols;canvasWidthInput.value=ow;canvasHeightInput.value=oh;textX=otx;textY=oty;
    canvasWidthInput.max = origMaxW; canvasHeightInput.max = origMaxH;
    renderMosaic();
    const link = document.createElement('a');
    link.download = `mosaic_${textInput.value.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${scale}x.png`;
    link.href = dataURL; link.click();
    showToast(`High-res PNG (${scale}x) exported!`);
}

function exportSVG() {
    const svgContent = generateSVGString();
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `mosaic_${textInput.value.toLowerCase().replace(/[^a-z0-9]/g, '_')}.svg`;
    link.href = url; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showToast("SVG Vector exported successfully!");
}

// ============================================================
// INTERACTIVITY: DRAG AND DROP TEXT POSITIONING
// ============================================================
function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
}
canvas.addEventListener('mousedown', (e) => {
    const coords = getCanvasCoordinates(e);
    const pixel = hiddenCtx.getImageData(Math.floor(coords.x), Math.floor(coords.y), 1, 1).data;
    if (pixel[3] > 50) { isDraggingText = true; canvas.classList.add('dragging'); startDragX = e.clientX; startDragY = e.clientY; textStartOffsetX = textX; textStartOffsetY = textY; }
});
window.addEventListener('mousemove', (e) => {
    if (!isDraggingText) {
        const coords = getCanvasCoordinates(e);
        if (coords.x >= 0 && coords.x < canvas.width && coords.y >= 0 && coords.y < canvas.height) {
            const pixel = hiddenCtx.getImageData(Math.floor(coords.x), Math.floor(coords.y), 1, 1).data;
            canvas.style.cursor = pixel[3] > 50 ? 'move' : 'crosshair';
        }
        return;
    }
    const rect = canvas.getBoundingClientRect();
    textX = textStartOffsetX + (e.clientX - startDragX) * (canvas.width / rect.width);
    textY = textStartOffsetY + (e.clientY - startDragY) * (canvas.height / rect.height);
    renderMosaic();
});
window.addEventListener('mouseup', () => { if (isDraggingText) { isDraggingText = false; canvas.classList.remove('dragging'); } });

// ============================================================
// UI INITIALIZATION & SYNC
// ============================================================
function initPalettes() {
    palettePresetsGrid.innerHTML = '';
    presets.forEach(preset => {
        const btn = document.createElement('button'); btn.className = 'preset-btn'; btn.title = `Apply ${preset.name}`;
        btn.innerHTML = `<div class="preset-name">${preset.name}</div><div class="preset-colors"><div class="preset-color-block" style="background-color: ${preset.bg}"></div><div class="preset-color-block" style="background-color: ${preset.tileBg}"></div><div class="preset-color-block" style="background-color: ${preset.face}"></div><div class="preset-color-block" style="background-color: ${preset.shadow}"></div><div class="preset-color-block" style="background-color: ${preset.highlight}"></div></div>`;
        btn.addEventListener('click', () => { bgColorPicker.value=preset.bg;tileBgColorPicker.value=preset.tileBg;faceColorPicker.value=preset.face;shadowColorPicker.value=preset.shadow;highlightColorPicker.value=preset.highlight;syncColorLabels();renderMosaic();showToast(`Preset "${preset.name}" applied!`); });
        palettePresetsGrid.appendChild(btn);
    });
}

function syncColorLabels() {
    document.getElementById('lbl-bgColor').textContent = bgColorPicker.value.toUpperCase();
    document.getElementById('lbl-tileBgColor').textContent = tileBgColorPicker.value.toUpperCase();
    document.getElementById('lbl-faceColor').textContent = faceColorPicker.value.toUpperCase();
    document.getElementById('lbl-shadowColor').textContent = shadowColorPicker.value.toUpperCase();
    document.getElementById('lbl-highlightColor').textContent = highlightColorPicker.value.toUpperCase();
    document.getElementById('lbl-subwayBandColor').textContent = subwayBandColorPicker.value.toUpperCase();
    document.getElementById('lbl-subwayBorderColor').textContent = subwayBorderColorPicker.value.toUpperCase();
    document.getElementById('lbl-subwayHeaderColor').textContent = subwayHeaderColorPicker.value.toUpperCase();
}

function updateNumericFeedback(id, suffix = '') {
    const input = document.getElementById(id), feedback = document.getElementById(`val-${id}`);
    if (input && feedback) feedback.textContent = `${input.value}${suffix}`;
}

function syncAllSliderDisplays() {
    updateNumericFeedback('fontScale', '%'); updateNumericFeedback('letterSpacing', 'px'); updateNumericFeedback('textRotation', '\u00b0');
    updateNumericFeedback('tileSize', 'px'); updateNumericFeedback('groutSize', 'px'); updateNumericFeedback('bevelDepth', 'px'); updateNumericFeedback('colorVariance', '%');
    updateNumericFeedback('canvasWidth', 'px'); updateNumericFeedback('canvasHeight', 'px');
}

const triggers = [
    textInput, textFontSelect, fontScaleInput, letterSpacingInput, textRotationInput,
    tileStyleSelect, tileSizeInput, groutSizeInput, bevelDepthInput,
    bgColorPicker, tileBgColorPicker, faceColorPicker, shadowColorPicker, highlightColorPicker,
    colorVarianceInput, groutNoiseCheckbox, tileShadingCheckbox,
    canvasWidthInput, canvasHeightInput, autoHeightCheckbox,
    borderPatternSelect, subwayBandColorPicker, subwayBorderColorPicker, subwayHeaderColorPicker,
    showTextCheckbox
];
triggers.forEach(el => { el.addEventListener('input', () => {
    syncColorLabels(); syncAllSliderDisplays(); renderMosaic();
    // Update ARIA attributes for range inputs
    document.querySelectorAll('input[type="range"]').forEach(r => { r.setAttribute('aria-valuenow', r.value); });
}); });

btnToggleSidebar.addEventListener('click', () => {
    if (sidebar.style.display === 'none') { sidebar.style.display = 'flex'; btnToggleSidebar.style.transform = 'rotate(0deg)'; }
    else { sidebar.style.display = 'none'; btnToggleSidebar.style.transform = 'rotate(180deg)'; }
});

btnExportPNG.addEventListener('click', exportPNG);
btnExportSVG.addEventListener('click', exportSVG);

// Accordion section toggle
document.querySelectorAll('.section-title').forEach(title => {
    title.addEventListener('click', () => {
        const section = title.closest('.control-section');
        section.classList.toggle('collapsed');
    });
});

initPalettes(); syncColorLabels(); syncAllSliderDisplays(); renderMosaic();

// ARIA: link numeric displays to sliders
document.querySelectorAll('input[type="range"]').forEach(r => {
    const feedback = document.getElementById('val-' + r.id);
    if (feedback) { r.setAttribute('aria-describedby', feedback.id); }
});
