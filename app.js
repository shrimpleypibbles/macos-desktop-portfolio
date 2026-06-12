function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} = React;

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const WORKS_CSV_PATH = 'data/works.csv';

// Menu bar label (shown next to Apple logo)
const APP_TITLE_BOLD = 'Gabriel Kyne';
const APP_TITLE_LIGHT = 'Film Composer';

// ───────────────────────────────────────────────────────────────────────────
// DOCK CONFIGURATION
//
// To ADD a new dock item, append an entry to DOCK_ITEMS below. Fields:
//   id       — unique string. Also the PNG filename at assets/dock/{id}.png
//              (if no PNG exists, the built-in SVG fallback is used)
//   label    — tooltip text shown on hover
//   action   — what happens when the icon is clicked. One of:
//
//     { type:'section', section:'works' }
//         → opens one of the built-in sections
//         → valid sections: 'works' | 'about' | 'contact' | 'teaching'
//
//     { type:'url', url:'https://...' }
//         → opens that URL in a new tab
//
//     { type:'file', path:'documents/cv.pdf', name:'CV' }
//         → opens the file in the media viewer
//         → `path` is resolved relative to assets/  (so 'cv.pdf' → assets/cv.pdf)
//         → `name` is the window title
//         → media-type inferred from file extension
//
// To CHANGE the icon for an item, drop a PNG at assets/dock/{id}.png
//   (recommended: 128×128 or larger, square, any colors you like)
//
// To REMOVE an item, delete its entry from DOCK_ITEMS.
//
// To REORDER items, just move them in the array.
// ───────────────────────────────────────────────────────────────────────────
const DOCK_ITEMS = [{
  id: 'finder',
  label: 'Finder',
  action: {
    type: 'section',
    section: 'works'
  }
}, {
  id: 'works',
  label: 'Works',
  action: {
    type: 'section',
    section: 'works'
  }
}, {
  id: 'scores',
  label: 'Music for Instruments',
  action: {
    type: 'section',
    section: 'scores'
  }
}, {
  id: 'about',
  label: 'About Me',
  action: {
    type: 'section',
    section: 'about'
  }
}, {
  id: 'contact',
  label: 'Contact',
  action: {
    type: 'section',
    section: 'contact'
  }
}, {
  id: 'teaching',
  label: 'Teaching',
  action: {
    type: 'section',
    section: 'teaching'
  }
}
// Example — uncomment to add a CV link:
// { id:'cv', label:'CV', action:{ type:'file', path:'documents/cv.pdf', name:'CV' } },
// Example — uncomment to add an external link:
// { id:'instagram', label:'Instagram', action:{ type:'url', url:'https://instagram.com/imsoproud.ofu' } },
];

// Media-type inferred from file extension (used for dock file-actions)
const EXT_TO_MEDIA_TYPE = {
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  m4a: 'audio',
  flac: 'audio',
  aac: 'audio',
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  m4v: 'video',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  heic: 'image',
  txt: 'text',
  md: 'text',
  html: 'text',
  pdf: 'pdf'
};

// ═══════════════════════════════════════════════════════════════════════════
// PATH RESOLUTION — so you don't have to type "/assets/" every time
// ═══════════════════════════════════════════════════════════════════════════
//   'winterreise.mp3'              → 'assets/winterreise.mp3'
//   'audio/winterreise.mp3'        → 'assets/audio/winterreise.mp3'
//   '/assets/audio/winterreise.mp3'→ 'assets/audio/winterreise.mp3'
//   'assets/audio/winterreise.mp3' → 'assets/audio/winterreise.mp3'
//   'https://example.com/a.mp3'    → 'https://example.com/a.mp3'  (untouched)
//   'uploads/wallpaper.jpg'        → 'uploads/wallpaper.jpg'       (untouched)
// ───────────────────────────────────────────────────────────────────────────
function resolvePath(p) {
  if (!p) return '';
  p = p.trim();
  if (!p) return '';
  if (/^(https?:|data:|blob:)/i.test(p)) return p;
  let cleaned = p.replace(/^\/+/, ''); // strip leading /
  if (/^(assets|uploads|data)\//i.test(cleaned)) return cleaned;
  return 'assets/' + cleaned;
}
function extOf(path) {
  const m = /\.([a-z0-9]+)(?:\?.*)?$/i.exec(path || '');
  return m ? m[1].toLowerCase() : '';
}
function guessMediaType(path) {
  return EXT_TO_MEDIA_TYPE[extOf(path)] || 'unknown';
}

// ═══════════════════════════════════════════════════════════════════════════
// CSV PARSER
// ═══════════════════════════════════════════════════════════════════════════

function parseCSVRow(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && inQ && line[i + 1] === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === ',' && !inQ) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map(s => s.trim());
}
function parseCSV(csvText) {
  const lines = csvText.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim().length);
  if (lines.length < 2) return [];
  const headers = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim();
    });
    if (!row.number || !row.name) continue;

    // Accept either 'description' (new) or 'instrumentation' (legacy)
    const description = row.description || row.instrumentation || '';
    rows.push({
      id: parseInt(row.number),
      name: row.name,
      year: row.year,
      description,
      credits: row.credits || '',
      notes: row.notes || '',
      mediaType: (row['media-type'] || '').toLowerCase(),
      mediaLocation: resolvePath(row['media-location']),
      thumbnail: resolvePath(row['thumbnail-location']),
      sub: [row.year, description].filter(Boolean).join(' · ')
    });
  }
  return rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function seededRand(seed) {
  let s = seed || 1;
  return () => {
    s = s * 1664525 + 1013904223 & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Natural scatter — mostly near center, a few toward the edges, all visible.
function generateInitialPositions(works) {
  const W = window.innerWidth,
    H = window.innerHeight;
  const TOP = 40,
    BOT = 120,
    SIDE = 60;
  const iconSize = 100;

  // New random seed every first-load
  const rand = seededRand(Date.now() & 0x7fffffff);
  const positions = {};
  const placed = [];
  const cx = W / 2;
  const cy = (H - TOP - BOT) / 2 + TOP;
  works.forEach(w => {
    let x,
      y,
      tries = 0;
    // ~10% of icons go toward the edges; rest clustered near center
    const edgeMode = rand() < 0.1;
    while (true) {
      if (edgeMode && tries < 8) {
        const side = Math.floor(rand() * 4);
        if (side === 0) {
          x = SIDE + rand() * (W - 2 * SIDE);
          y = TOP + rand() * 90;
        } else if (side === 1) {
          x = W - SIDE - rand() * 140;
          y = TOP + rand() * (H - TOP - BOT);
        } else if (side === 2) {
          x = SIDE + rand() * (W - 2 * SIDE);
          y = H - BOT - 90 + rand() * 70;
        } else {
          x = SIDE + rand() * 140;
          y = TOP + rand() * (H - TOP - BOT);
        }
      } else {
        // Gaussian-ish scatter around the center
        const r1 = rand(),
          r2 = rand();
        const g1 = Math.sqrt(-2 * Math.log(r1 || 0.0001)) * Math.cos(2 * Math.PI * r2);
        const g2 = Math.sqrt(-2 * Math.log(r1 || 0.0001)) * Math.sin(2 * Math.PI * r2);
        x = cx + g1 * (W * 0.13);
        y = cy + g2 * ((H - TOP - BOT) * 0.16);
      }

      // Clamp to visible area
      x = Math.max(SIDE, Math.min(W - SIDE - iconSize, x));
      y = Math.max(TOP, Math.min(H - BOT - iconSize, y));

      // Check overlap
      const tooClose = placed.some(p => Math.hypot(p.x - x, p.y - y) < iconSize * 0.85);
      if (!tooClose || tries > 25) break;
      tries++;
    }
    positions[w.id] = {
      x,
      y
    };
    placed.push({
      x,
      y
    });
  });
  return positions;
}
const fmtTime = s => {
  if (!isFinite(s) || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// THUMBNAIL — image from filepath, letter fallback. No corner badge.
// ═══════════════════════════════════════════════════════════════════════════

function Thumbnail({
  work,
  size = 80
}) {
  const [imgError, setImgError] = useState(false);
  const hasImage = work.thumbnail && !imgError;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: size * 0.175,
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: 'none',
      background: 'transparent'
    }
  }, hasImage ? /*#__PURE__*/React.createElement("img", {
    src: work.thumbnail,
    alt: work.name,
    onError: () => setImgError(true),
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      display: 'block'
    },
    draggable: false
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgba(255,255,255,0.85)',
      fontSize: size * 0.42,
      fontWeight: 300
    }
  }, (work.name || '?').charAt(0).toUpperCase()));
}

// ═══════════════════════════════════════════════════════════════════════════
// DESKTOP ICON
// ═══════════════════════════════════════════════════════════════════════════

function DesktopIcon({
  work,
  pos,
  onPosChange,
  onOpen,
  isSelected,
  onSelect,
  dropDelay
}) {
  const drag = useRef(null);
  const onMouseDown = useCallback(e => {
    e.stopPropagation();
    onSelect(work.id);
    drag.current = {
      mx0: e.clientX,
      my0: e.clientY,
      x0: pos.x,
      y0: pos.y,
      moved: false
    };
    const onMove = ev => {
      if (!drag.current) return;
      const dx = ev.clientX - drag.current.mx0,
        dy = ev.clientY - drag.current.my0;
      if (!drag.current.moved && Math.hypot(dx, dy) > 4) {
        drag.current.moved = true;
        document.body.classList.add('dragging');
      }
      if (drag.current.moved) onPosChange(work.id, {
        x: drag.current.x0 + dx,
        y: drag.current.y0 + dy
      });
    };
    const onUp = () => {
      drag.current = null;
      document.body.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [pos, work.id, onPosChange, onSelect]);
  const onDoubleClick = useCallback(e => {
    e.stopPropagation();
    onOpen(work);
  }, [work, onOpen]);
  return /*#__PURE__*/React.createElement("div", {
    className: "icon-drop",
    style: {
      position: 'absolute',
      left: pos.x,
      top: pos.y,
      width: 90,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      cursor: 'default',
      zIndex: isSelected ? 10 : 2,
      animationDelay: `${dropDelay}ms`,
      userSelect: 'none'
    },
    onMouseDown: onMouseDown,
    onDoubleClick: onDoubleClick
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 4,
      borderRadius: 16,
      background: isSelected ? 'rgba(10,132,255,0.25)' : 'transparent',
      outline: isSelected ? '1.5px solid rgba(10,132,255,0.6)' : '1.5px solid transparent',
      outlineOffset: 1,
      transition: 'background 0.1s'
    }
  }, /*#__PURE__*/React.createElement(Thumbnail, {
    work: work,
    size: 72
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 3,
      fontSize: 11,
      lineHeight: 1.35,
      textAlign: 'center',
      maxWidth: 88,
      wordBreak: 'break-word',
      color: '#fff',
      textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 0 14px rgba(0,0,0,0.7)',
      padding: '1px 5px',
      borderRadius: 3,
      background: isSelected ? 'rgba(10,132,255,0.8)' : 'transparent',
      transition: 'background 0.1s'
    }
  }, work.name));
}

// ═══════════════════════════════════════════════════════════════════════════
// METADATA BLOCK — shared by all players
// ═══════════════════════════════════════════════════════════════════════════

// Renders trusted HTML (e.g. <a> links) from CSV fields like instrumentation/description.
function HtmlText({
  html,
  className = '',
  ...props
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `html-text ${className}`.trim()
  }, props, {
    dangerouslySetInnerHTML: {
      __html: html
    }
  }));
}
function MetadataBlock({
  work,
  compact = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: compact ? 15 : 17,
      fontWeight: 700,
      color: '#1d1d1f',
      marginBottom: 3,
      lineHeight: 1.2
    }
  }, work.name), work.sub && /*#__PURE__*/React.createElement(HtmlText, {
    html: work.sub,
    style: {
      fontSize: 12,
      color: '#888',
      marginBottom: work.credits || work.notes ? 4 : 8
    }
  }), work.credits && /*#__PURE__*/React.createElement(HtmlText, {
    html: work.credits,
    style: {
      fontSize: 11.5,
      color: '#555',
      marginBottom: work.notes ? 4 : 8,
      lineHeight: 1.5
    }
  }), work.notes && /*#__PURE__*/React.createElement(HtmlText, {
    html: work.notes,
    style: {
      fontSize: 11,
      color: '#777',
      fontStyle: 'italic',
      marginBottom: 8,
      lineHeight: 1.5
    }
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO PLAYER
// ═══════════════════════════════════════════════════════════════════════════

const btnIconStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 6,
  color: 'rgba(255,255,255,0.7)',
  fontSize: 17,
  lineHeight: 1,
  transition: 'color 0.15s, transform 0.1s'
};
function AudioPlayer({
  work
}) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [err, setErr] = useState(null);
  const [hover, setHover] = useState(false);
  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();else a.play().catch(e => setErr(e.message));
  };
  const seekTo = pct => {
    const a = audioRef.current;
    if (!a || !isFinite(a.duration)) return;
    a.currentTime = pct / 100 * a.duration;
  };
  const art = work.thumbnail;
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      position: 'relative',
      width: '100%',
      minWidth: 380,
      boxSizing: 'border-box',
      overflow: 'hidden',
      isolation: 'isolate',
      background: '#1c1c1e',
      color: '#fff'
    }
  }, art && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: -60,
      zIndex: 0,
      backgroundImage: `url(${art})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      filter: 'blur(48px) saturate(1.6) brightness(0.55)',
      transform: 'scale(1.2)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 0,
      background: 'linear-gradient(180deg, rgba(20,20,22,0.55) 0%, rgba(20,20,22,0.78) 100%)',
      backdropFilter: 'blur(2px)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      padding: '22px 24px 24px'
    }
  }, /*#__PURE__*/React.createElement("audio", {
    ref: audioRef,
    src: work.mediaLocation,
    preload: "metadata",
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    },
    onTimeUpdate: e => {
      const t = e.target.currentTime,
        d = e.target.duration;
      setCurrentTime(t);
      if (isFinite(d) && d > 0) setProgress(t / d * 100);
    },
    onLoadedMetadata: e => setDuration(e.target.duration),
    onError: () => setErr('Unable to load audio file')
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      alignItems: 'center',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: '0 8px 28px rgba(0,0,0,0.55)'
    }
  }, /*#__PURE__*/React.createElement(Thumbnail, {
    work: work,
    size: 88
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 600,
      lineHeight: 1.25,
      marginBottom: 4,
      color: '#fff',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      textShadow: '0 1px 3px rgba(0,0,0,0.4)'
    }
  }, work.name), work.sub && /*#__PURE__*/React.createElement(HtmlText, {
    html: work.sub,
    style: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.72)',
      marginBottom: work.credits ? 3 : 0
    }
  }), work.credits && /*#__PURE__*/React.createElement(HtmlText, {
    html: work.credits,
    style: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.5)',
      lineHeight: 1.5
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 30,
      marginBottom: 16,
      height: 40,
      opacity: hover || !playing ? 1 : 0,
      transition: 'opacity 0.25s',
      pointerEvents: hover || !playing ? 'auto' : 'none'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => seekTo(0),
    style: btnIconStyle
  }, "\u23EE"), /*#__PURE__*/React.createElement("button", {
    onClick: toggle,
    style: {
      ...btnIconStyle,
      fontSize: 30,
      color: '#fff',
      padding: 0
    }
  }, playing ? '⏸' : '▶'), /*#__PURE__*/React.createElement("button", {
    onClick: () => seekTo(100),
    style: btnIconStyle
  }, "\u23ED")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 5,
      background: 'rgba(255,255,255,0.18)',
      borderRadius: 3,
      cursor: 'pointer',
      position: 'relative',
      marginBottom: 6
    },
    onClick: e => {
      const r = e.currentTarget.getBoundingClientRect();
      seekTo(Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)));
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      width: `${progress}%`,
      borderRadius: 3,
      background: 'rgba(255,255,255,0.95)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '50%',
      left: `${progress}%`,
      transform: 'translate(-50%,-50%)',
      width: 13,
      height: 13,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 5px rgba(0,0,0,0.5)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 10.5,
      color: 'rgba(255,255,255,0.55)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, /*#__PURE__*/React.createElement("span", null, fmtTime(currentTime)), /*#__PURE__*/React.createElement("span", null, duration > 0 ? '-' + fmtTime(duration - currentTime) : fmtTime(0)))), err && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 11,
      color: '#ff6b5e',
      textAlign: 'center'
    }
  }, err, " \u2014 check ", /*#__PURE__*/React.createElement("code", null, work.mediaLocation))));
}

// ═══════════════════════════════════════════════════════════════════════════
// VIDEO PLAYER — no autoplay, user clicks play
// ═══════════════════════════════════════════════════════════════════════════

function VideoPlayer({
  work,
  onMediaSize
}) {
  const [err, setErr] = useState(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#000',
      width: '100%',
      minWidth: 420,
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement("video", {
    src: work.mediaLocation,
    controls: true,
    preload: "metadata",
    style: {
      display: 'block',
      width: '100%',
      maxHeight: '70vh',
      background: '#000'
    },
    onError: () => setErr('Unable to load video file'),
    onLoadedMetadata: e => onMediaSize?.(e.target.videoWidth, e.target.videoHeight)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 18px',
      background: '#111',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, work.name), work.sub && /*#__PURE__*/React.createElement(HtmlText, {
    html: work.sub,
    style: {
      fontSize: 12,
      color: '#aaa',
      marginTop: 2
    }
  }), work.credits && /*#__PURE__*/React.createElement(HtmlText, {
    html: work.credits,
    style: {
      fontSize: 11.5,
      color: '#888',
      marginTop: 5,
      lineHeight: 1.5
    }
  }), work.notes && /*#__PURE__*/React.createElement(HtmlText, {
    html: work.notes,
    style: {
      fontSize: 11,
      color: '#777',
      fontStyle: 'italic',
      marginTop: 5,
      lineHeight: 1.5
    }
  }), err && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#ff6b5e',
      marginTop: 8
    }
  }, err, " \u2014 check ", /*#__PURE__*/React.createElement("code", null, work.mediaLocation))));
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE VIEWER
// ═══════════════════════════════════════════════════════════════════════════

function ImageViewer({
  work,
  onMediaSize
}) {
  const [err, setErr] = useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#1a1a1a',
      width: '100%',
      minWidth: 400,
      maxHeight: '85vh',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 18,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 260,
      maxHeight: '70vh',
      overflow: 'hidden'
    }
  }, err ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#888',
      fontSize: 13,
      textAlign: 'center',
      padding: 20
    }
  }, "Unable to load image.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("code", {
    style: {
      fontSize: 11
    }
  }, work.mediaLocation)) : /*#__PURE__*/React.createElement("img", {
    src: work.mediaLocation,
    alt: work.name,
    onError: () => setErr(true),
    onLoad: e => onMediaSize?.(e.target.naturalWidth, e.target.naturalHeight),
    style: {
      maxWidth: '100%',
      maxHeight: '70vh',
      objectFit: 'contain',
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 18px',
      background: '#0d0d0d',
      color: '#fff',
      borderTop: '1px solid #222'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 600
    }
  }, work.name), work.sub && /*#__PURE__*/React.createElement(HtmlText, {
    html: work.sub,
    style: {
      fontSize: 12,
      color: '#aaa',
      marginTop: 2
    }
  }), work.credits && /*#__PURE__*/React.createElement(HtmlText, {
    html: work.credits,
    style: {
      fontSize: 11.5,
      color: '#888',
      marginTop: 5,
      lineHeight: 1.5
    }
  }), work.notes && /*#__PURE__*/React.createElement(HtmlText, {
    html: work.notes,
    style: {
      fontSize: 11,
      color: '#777',
      fontStyle: 'italic',
      marginTop: 5,
      lineHeight: 1.5
    }
  })));
}

// ═══════════════════════════════════════════════════════════════════════════
// TEXT VIEWER (also auto-routes to PDF viewer for .pdf files)
// ═══════════════════════════════════════════════════════════════════════════

function TextViewer({
  work
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    fetch(work.mediaLocation).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    }).then(t => {
      if (!cancelled) {
        setText(t);
        setLoading(false);
      }
    }).catch(e => {
      if (!cancelled) {
        setErr(e.message);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [work.mediaLocation]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      minWidth: 420,
      boxSizing: 'border-box',
      background: '#fafafa'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px',
      borderBottom: '1px solid #ececec',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Thumbnail, {
    work: work,
    size: 44
  }), /*#__PURE__*/React.createElement(MetadataBlock, {
    work: work,
    compact: true
  })), /*#__PURE__*/React.createElement("pre", {
    style: {
      padding: '18px 22px',
      fontSize: 13,
      lineHeight: 1.65,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      color: '#2a2a2c',
      maxHeight: '60vh',
      overflow: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      background: '#fafafa'
    }
  }, loading ? 'Loading…' : err ? `Could not load file: ${err}\nPath: ${work.mediaLocation}` : text));
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF VIEWER (used for media-type: pdf, score, and any .pdf file)
// ═══════════════════════════════════════════════════════════════════════════

function PdfViewer({
  work
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      minWidth: 480,
      boxSizing: 'border-box',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 20px',
      borderBottom: '1px solid #ececec',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Thumbnail, {
    work: work,
    size: 44
  }), /*#__PURE__*/React.createElement(MetadataBlock, {
    work: work,
    compact: true
  })), /*#__PURE__*/React.createElement("iframe", {
    src: work.mediaLocation,
    title: work.name,
    style: {
      width: '100%',
      height: '70vh',
      border: 'none',
      background: '#333'
    }
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDIA VIEWER — routes to the right player based on media-type
// ═══════════════════════════════════════════════════════════════════════════

function MediaViewer({
  work,
  onMediaSize
}) {
  if (!work.mediaLocation) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 30,
        width: '100%',
        minWidth: 360,
        boxSizing: 'border-box',
        background: '#fafafa'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 6
      }
    }, work.name), work.sub && /*#__PURE__*/React.createElement(HtmlText, {
      html: work.sub,
      style: {
        fontSize: 12,
        color: '#888',
        marginBottom: 14
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: '#ff9500',
        padding: 12,
        background: '#fff8ed',
        borderRadius: 8
      }
    }, "No ", /*#__PURE__*/React.createElement("code", null, "media-location"), " set in CSV for this work."));
  }

  // If a 'text' media-type actually points to a PDF, route to the PDF viewer.
  const ext = extOf(work.mediaLocation);
  switch (work.mediaType) {
    case 'audio':
      return /*#__PURE__*/React.createElement(AudioPlayer, {
        work: work
      });
    case 'video':
      return /*#__PURE__*/React.createElement(VideoPlayer, {
        work: work,
        onMediaSize: onMediaSize
      });
    case 'image':
      return /*#__PURE__*/React.createElement(ImageViewer, {
        work: work,
        onMediaSize: onMediaSize
      });
    case 'pdf':
    case 'score':
      return /*#__PURE__*/React.createElement(PdfViewer, {
        work: work
      });
    case 'text':
      return ext === 'pdf' ? /*#__PURE__*/React.createElement(PdfViewer, {
        work: work
      }) : /*#__PURE__*/React.createElement(TextViewer, {
        work: work
      });
    default:
      // Fallback: guess from file extension
      const guessed = guessMediaType(work.mediaLocation);
      if (guessed !== 'unknown' && guessed !== work.mediaType) {
        return /*#__PURE__*/React.createElement(MediaViewer, {
          work: {
            ...work,
            mediaType: guessed
          },
          onMediaSize: onMediaSize
        });
      }
      return /*#__PURE__*/React.createElement("div", {
        style: {
          padding: 30,
          width: '100%',
          minWidth: 360,
          boxSizing: 'border-box',
          background: '#fafafa'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 14,
          fontWeight: 600
        }
      }, work.name), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: '#ff3b30',
          marginTop: 12
        }
      }, "Unknown media-type: \"", work.mediaType || '(empty)', "\". Use one of: audio, video, image, text, pdf, score."));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION WINDOWS
// ═══════════════════════════════════════════════════════════════════════════

function AboutContent() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '24px 30px',
      width: '100%',
      minWidth: 480,
      boxSizing: 'border-box',
      background: '#fafafa'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "https://pub-715e1f7bc3864cb8b05d16f94698b504.r2.dev/assets/images/gabriel-pfp-1.jpg",
    style: {
      width: 84,
      height: 84,
      borderRadius: '50%',
      flexShrink: 0,
      objectFit: 'cover'
    },
    alt: "Gabriel Kyne"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 22,
      fontWeight: 700,
      color: '#1d1d1f',
      marginBottom: 3
    }
  }, "Gabriel Kyne"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: '#888',
      marginBottom: 4
    }
  }, "Composer & Creator"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "https://www.orchestraltools.com/",
    target: "_blank",
    rel: "noreferrer",
    style: {
      color: '#0a84ff',
      textDecoration: 'none'
    }
  }, "Orchestral Tools"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#aaa'
    }
  }, " \xB7 "), /*#__PURE__*/React.createElement("a", {
    href: "https://www.filmuniversitaet.de/",
    target: "_blank",
    rel: "noreferrer",
    style: {
      color: '#0a84ff',
      textDecoration: 'none'
    }
  }, "Filmuniversit\xE4t Babelsberg")))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: '#3a3a3c',
      lineHeight: 1.75,
      marginBottom: 22
    }
  }, "Gabriel Kyne is an American composer currently living in Berlin, Germany. Recent projects include the 30-minute documentary ", /*#__PURE__*/React.createElement("em", null, "DVD f\xFCr Dad"), ", produced by Dreh's Um, and a 15-minute stop motion animation called ", /*#__PURE__*/React.createElement("em", null, "Fr\xF8"), ". He is currently pursuing his Master's degree in Filmmusik at the Filmuni Babelsberg. In addition to film composition, he works regularly with brands like Orchestral Tools making fun and educational content for Instagram and YouTube, and keeps a small but busy studio as a private piano teacher."), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid #ececec',
      paddingTop: 18
    }
  }, /*#__PURE__*/React.createElement("a", {
    onClick: e => {
      e.preventDefault();
      window.location.href = 'mailto:' + 'gabrielkyne' + '@' + 'gmail.com';
    },
    href: "#",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      background: '#1d1d1f',
      color: '#fff',
      padding: '9px 18px',
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 600,
      textDecoration: 'none',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "4",
    width: "20",
    height: "16",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 7l10 7 10-7"
  })), "Get in touch")));
}
function ContactContent() {
  // Email split to avoid scraper harvesting
  const emailUser = 'gabrielkyne';
  const emailDomain = 'gmail.com';
  const items = [{
    label: 'Instagram',
    value: '@imsoproud.ofu',
    href: 'https://instagram.com/imsoproud.ofu'
  }, {
    label: 'Email',
    email: true
  }, {
    label: 'Location',
    value: 'Berlin, Germany'
  }, {
    label: 'Affiliation',
    value: 'Orchestral Tools, Filmuniversität Babelsberg'
  }, {
    label: 'Education',
    value: 'MA Filmmusik · Filmuniversität Babelsberg'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '28px 30px',
      width: '100%',
      minWidth: 340,
      boxSizing: 'border-box',
      background: '#fafafa'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: '#1d1d1f',
      marginBottom: 20
    }
  }, "Get in Touch"), items.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.label,
    style: {
      borderBottom: '1px solid #ececec',
      paddingBottom: 14,
      marginBottom: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10.5,
      color: '#aaa',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      fontWeight: 500
    }
  }, item.label), item.href ? /*#__PURE__*/React.createElement("a", {
    href: item.href,
    target: "_blank",
    rel: "noreferrer",
    style: {
      fontSize: 14,
      color: '#0a84ff',
      textDecoration: 'none'
    }
  }, item.value) : item.email ? /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      window.location.href = 'mailto:' + emailUser + '@' + emailDomain;
    },
    style: {
      fontSize: 14,
      color: '#0a84ff',
      textDecoration: 'none'
    }
  }, emailUser, '@', emailDomain) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: '#1d1d1f',
      whiteSpace: 'pre-line'
    }
  }, item.value))));
}
function TeachingContent() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '28px 30px',
      width: '100%',
      minWidth: 360,
      boxSizing: 'border-box',
      background: '#fafafa'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: '#1d1d1f',
      marginBottom: 6
    }
  }, "Teaching"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: '#aaa',
      marginBottom: 22,
      fontStyle: 'italic'
    }
  }, "Details & booking coming soon."), [{
    title: 'Film Scoring',
    desc: 'Writing music for picture — narrative arc, emotional sync, temp tracks.',
    color: '#0a84ff'
  }, {
    title: 'Orchestral Writing',
    desc: 'Voice leading, orchestration, idiomatic writing for live ensembles.',
    color: '#30d158'
  }, {
    title: 'Virtual Orchestration',
    desc: 'Mockup techniques, DAW workflow, sample libraries & Orchestral Tools.',
    color: '#ff9f0a'
  }, {
    title: 'Composition Mentoring',
    desc: 'One-on-one sessions for developing composers at any level.',
    color: '#bf5af2'
  }].map(item => /*#__PURE__*/React.createElement("div", {
    key: item.title,
    style: {
      display: 'flex',
      gap: 12,
      marginBottom: 14,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 4,
      flexShrink: 0,
      height: 44,
      borderRadius: 2,
      background: item.color,
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: '#1d1d1f',
      marginBottom: 2
    }
  }, item.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: '#888',
      lineHeight: 1.5
    }
  }, item.desc)))));
}

// FINDER-STYLE WORKS WINDOW (saved for later)
// function WorksContentFinder({ works, onOpenWork }) {
//   return (
//     <div style={{ display:'flex', flexDirection:'column', width:1000, height:600, background:'#f5f5f7' }}>
//       <div style={{ padding:'12px 16px', borderBottom:'1px solid #e5e5e7', display:'flex', alignItems:'center', gap:12 }}>
//         <div style={{ fontSize:14, color:'#666' }}>audio</div>
//         <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
//           <button style={{ width:32, height:32, borderRadius:6, background:'#e8e8ed', border:'none' }}>⊞</button>
//           <button style={{ width:32, height:32, borderRadius:6, background:'#e8e8ed', border:'none' }}>☰</button>
//         </div>
//       </div>
//       <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
//         <div style={{ width:180, background:'#f5f5f7', borderRight:'1px solid #e5e5e7', padding:'12px 0', overflowY:'auto' }}>
//           <div style={{ paddingLeft:16, fontSize:11, fontWeight:600, color:'#999', marginBottom:8 }}>FAVORITES</div>
//           {['Recents', 'AirDrop', 'Desktop', 'gabrielkyne.com', 'Applications', 'Documents', 'Pictures', 'Downloads'].map(item => (
//             <div key={item} style={{ padding:'6px 16px', fontSize:13, color:'#1d1d1f' }}>📁 {item}</div>
//           ))}
//         </div>
//         <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
//           <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1.5fr 1fr', borderBottom:'1px solid #e5e5e7', padding:'8px 16px', background:'#fafafa', fontSize:12, fontWeight:600, color:'#666' }}>
//             <div>Name</div><div>Date Created</div><div>Size</div><div>Kind</div>
//           </div>
//           <div style={{ flex:1, overflowY:'auto', padding:'0 16px' }}>
//             {works.map((w) => (
//               <div key={w.id} style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1.5fr 1fr', padding:'8px 0', borderBottom:'1px solid #f0f0f0', fontSize:13, color:'#1d1d1f' }}>
//                 <div>📄 {w.name}</div><div style={{ color:'#666', fontSize:12 }}>24. Apr 2026</div><div style={{ color:'#666', fontSize:12 }}>39,2 MB</div><div style={{ color:'#666', fontSize:12 }}>Audio</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//       <div style={{ padding:'8px 16px', borderTop:'1px solid #e5e5e7', background:'#fafafa', fontSize:11, color:'#666' }}>
//         💾 Macintosh HD ▸ Users ▸ gabrielkyne ▸ Documents ▸ gabrielkyne.com ▸ assets ▸ audio
//         <div style={{ marginLeft:'auto', display:'inline', fontSize:11, color:'#999' }}>{works.length} items</div>
//       </div>
//     </div>
//   );
// }

function ScoresContent({
  works
}) {
  const scores = works.filter(w => w.mediaType === 'score');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      width: '100%',
      minWidth: 380,
      boxSizing: 'border-box',
      background: '#f5f5f7'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: '#aaa',
      marginBottom: 16
    }
  }, "Free to download and perform. Double-click any score to open."), scores.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: '#bbb',
      textAlign: 'center',
      padding: '40px 0'
    }
  }, "Scores coming soon.") : scores.map(w => /*#__PURE__*/React.createElement("a", {
    key: w.id,
    href: w.mediaLocation,
    target: "_blank",
    rel: "noreferrer",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 12px',
      borderRadius: 8,
      marginBottom: 6,
      background: 'rgba(255,255,255,0.7)',
      textDecoration: 'none',
      transition: 'background 0.12s'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(10,132,255,0.1)',
    onMouseLeave: e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22
    }
  }, "\uD83D\uDCC4"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: '#1d1d1f'
    }
  }, w.name), w.year && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#aaa'
    }
  }, w.year)))));
}
function WorksContent({
  works,
  onOpenWork
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      width: '100%',
      minWidth: 420,
      boxSizing: 'border-box',
      background: '#f5f5f7',
      maxHeight: 440,
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 12
    }
  }, works.map(w => /*#__PURE__*/React.createElement("div", {
    key: w.id,
    onDoubleClick: () => onOpenWork(w),
    title: `Double-click to open ${w.name}`,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      padding: '10px 6px',
      borderRadius: 12,
      cursor: 'default',
      background: 'rgba(255,255,255,0.7)',
      transition: 'background 0.12s'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(10,132,255,0.1)',
    onMouseLeave: e => e.currentTarget.style.background = 'rgba(255,255,255,0.7)'
  }, /*#__PURE__*/React.createElement(Thumbnail, {
    work: w,
    size: 58
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      textAlign: 'center',
      color: '#1d1d1f',
      lineHeight: 1.3,
      maxWidth: 90
    }
  }, w.name)))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 11,
      color: '#bbb',
      textAlign: 'center',
      marginTop: 14
    }
  }, "Double-click any cover to open the file"));
}

// ═══════════════════════════════════════════════════════════════════════════
// APP WINDOW (drag by title bar)
// ═══════════════════════════════════════════════════════════════════════════

function AppWindow({
  win,
  onClose,
  onFocus,
  zIndex,
  works,
  onOpenWork
}) {
  const drag = useRef(null);
  const [pos, setPos] = useState(win.pos);
  // null = size to content; once the user resizes we store explicit {w,h}
  const [size, setSize] = useState(win.size || null);
  const onTitleDown = e => {
    if (e.target.closest('[data-traffic]')) return;
    e.preventDefault();
    onFocus(win.id);
    drag.current = {
      mx0: e.clientX,
      my0: e.clientY,
      x0: pos.x,
      y0: pos.y
    };
    document.body.classList.add('dragging');
    const onMove = ev => {
      if (!drag.current) return;
      setPos({
        x: drag.current.x0 + ev.clientX - drag.current.mx0,
        y: drag.current.y0 + ev.clientY - drag.current.my0
      });
    };
    const onUp = () => {
      drag.current = null;
      document.body.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  // Once the media's natural size is known, size the window proportionally
  // (small-to-medium) instead of leaving blank space or cropping content.
  const autoSizedRef = useRef(false);
  const handleMediaSize = (naturalW, naturalH) => {
    if (autoSizedRef.current || !naturalW || !naturalH) return;
    autoSizedRef.current = true;
    const MAX_MEDIA_W = 640,
      MAX_MEDIA_H = 420;
    const MIN_MEDIA_W = 360,
      MIN_MEDIA_H = 220;
    const aspect = naturalW / naturalH;
    let mediaW, mediaH;
    if (aspect >= 1) {
      mediaW = Math.min(naturalW, MAX_MEDIA_W);
      mediaH = mediaW / aspect;
    } else {
      mediaH = Math.min(naturalH, MAX_MEDIA_H);
      mediaW = mediaH * aspect;
    }
    if (mediaW < MIN_MEDIA_W) {
      mediaW = MIN_MEDIA_W;
      mediaH = mediaW / aspect;
    }
    if (mediaH < MIN_MEDIA_H) {
      mediaH = MIN_MEDIA_H;
      mediaW = mediaH * aspect;
    }
    const isImage = win.work?.mediaType === 'image';
    const PAD = isImage ? 36 : 0;
    const TITLEBAR_H = 38;
    const CAPTION_H = isImage ? 80 : 90;
    const w = Math.max(mediaW + PAD, 420);
    const h = mediaH + PAD + CAPTION_H + TITLEBAR_H;
    const prevW = size?.w || w,
      prevH = size?.h || h;
    setPos(p => ({
      x: p.x - (w - prevW) / 2,
      y: p.y - (h - prevH) / 2
    }));
    setSize({
      w,
      h
    });
  };
  const MIN_W = 280,
    MIN_H = 160;
  const onResizeDown = e => {
    e.preventDefault();
    e.stopPropagation();
    onFocus(win.id);
    autoSizedRef.current = true;
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    const start = {
      mx0: e.clientX,
      my0: e.clientY,
      w0: rect.width,
      h0: rect.height
    };
    document.body.classList.add('dragging');
    const onMove = ev => {
      setSize({
        w: Math.max(MIN_W, start.w0 + ev.clientX - start.mx0),
        h: Math.max(MIN_H, start.h0 + ev.clientY - start.my0)
      });
    };
    const onUp = () => {
      document.body.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  const title = win.type === 'player' ? win.work?.name || '' : win.type === 'about' ? 'About Gabriel Kyne' : win.type === 'contact' ? 'Contact' : win.type === 'teaching' ? 'Teaching' : win.type === 'works' ? 'All Works' : win.type === 'scores' ? 'Music for Instruments' : '';
  return /*#__PURE__*/React.createElement("div", {
    className: "window-enter",
    style: {
      position: 'fixed',
      left: pos.x,
      top: pos.y,
      zIndex,
      borderRadius: 13,
      overflow: 'hidden',
      boxShadow: '0 22px 70px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(0,0,0,0.12)',
      minWidth: 280,
      display: 'flex',
      flexDirection: 'column',
      width: size ? size.w : undefined,
      height: size ? size.h : undefined
    },
    onMouseDown: () => onFocus(win.id)
  }, /*#__PURE__*/React.createElement("div", {
    onMouseDown: onTitleDown,
    style: {
      height: 38,
      background: 'linear-gradient(to bottom, #f0f0f0, #e8e8e8)',
      borderBottom: '1px solid #d8d8d8',
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      cursor: 'default',
      userSelect: 'none',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    "data-traffic": true,
    style: {
      display: 'flex',
      gap: 7,
      alignItems: 'center'
    }
  }, ['#ed6158', '#fcc02e', '#5fc038'].map((bg, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    onClick: i === 0 ? () => onClose(win.id) : undefined,
    style: {
      width: 13,
      height: 13,
      borderRadius: '50%',
      background: bg,
      cursor: i === 0 ? 'pointer' : 'default',
      flexShrink: 0
    },
    onMouseEnter: e => e.currentTarget.style.filter = 'brightness(0.82)',
    onMouseLeave: e => e.currentTarget.style.filter = ''
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: 13,
      fontWeight: 500,
      color: '#3a3a3c',
      maxWidth: 380,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflow: 'auto',
      position: 'relative',
      background: win.type === 'player' && (win.work.mediaType === 'video' || win.work.mediaType === 'image') ? '#000' : '#fafafa'
    }
  }, win.type === 'player' && /*#__PURE__*/React.createElement(MediaViewer, {
    work: win.work,
    onMediaSize: handleMediaSize
  }), win.type === 'about' && /*#__PURE__*/React.createElement(AboutContent, null), win.type === 'contact' && /*#__PURE__*/React.createElement(ContactContent, null), win.type === 'teaching' && /*#__PURE__*/React.createElement(TeachingContent, null), win.type === 'works' && /*#__PURE__*/React.createElement(WorksContent, {
    works: works,
    onOpenWork: onOpenWork
  }), win.type === 'scores' && /*#__PURE__*/React.createElement(ScoresContent, {
    works: works
  })), /*#__PURE__*/React.createElement("div", {
    onMouseDown: onResizeDown,
    style: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 18,
      height: 18,
      cursor: 'nwse-resize',
      zIndex: 5
    }
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCK
// ═══════════════════════════════════════════════════════════════════════════

// Built-in SVG icon fallbacks. Used if assets/dock/{id}.png is missing.
const DockIconFallback = {
  finder:
  /*#__PURE__*/
  // Simple Finder-style face
  React.createElement("svg", {
    width: "38",
    height: "38",
    viewBox: "0 0 40 40"
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "fbg",
    x1: "0",
    y1: "0",
    x2: "1",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "#3ab7ff"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "#1f6ed6"
  }))), /*#__PURE__*/React.createElement("rect", {
    x: "1",
    y: "1",
    width: "38",
    height: "38",
    rx: "9",
    fill: "url(#fbg)"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 14 Q13 10 17 10 Q21 10 21 14",
    stroke: "#fff",
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M27 14 Q27 10 31 10 Q35 10 35 14",
    stroke: "#fff",
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 24 Q20 30 36 24",
    stroke: "#fff",
    strokeWidth: "2.2",
    fill: "none",
    strokeLinecap: "round"
  })),
  works: /*#__PURE__*/React.createElement("svg", {
    width: "34",
    height: "34",
    viewBox: "0 0 34 34",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "18",
    width: "5",
    height: "12",
    rx: "1.5",
    fill: "white",
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "11",
    y: "12",
    width: "5",
    height: "18",
    rx: "1.5",
    fill: "white",
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "19",
    y: "6",
    width: "5",
    height: "24",
    rx: "1.5",
    fill: "white",
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "27",
    y: "15",
    width: "5",
    height: "15",
    rx: "1.5",
    fill: "white",
    opacity: "0.9"
  })),
  about: /*#__PURE__*/React.createElement("svg", {
    width: "34",
    height: "34",
    viewBox: "0 0 34 34",
    fill: "none"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "17",
    cy: "12",
    r: "6.5",
    stroke: "white",
    strokeWidth: "2.5",
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3.5 31c0-7.456 6.044-13.5 13.5-13.5S30.5 23.544 30.5 31",
    stroke: "white",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    opacity: "0.9"
  })),
  contact: /*#__PURE__*/React.createElement("svg", {
    width: "34",
    height: "34",
    viewBox: "0 0 34 34",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "7",
    width: "30",
    height: "22",
    rx: "3.5",
    stroke: "white",
    strokeWidth: "2.5",
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 11l15 11L32 11",
    stroke: "white",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    opacity: "0.9"
  })),
  teaching: /*#__PURE__*/React.createElement("svg", {
    width: "34",
    height: "34",
    viewBox: "0 0 34 34",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 17L17 9l14 8-14 8-14-8z",
    stroke: "white",
    strokeWidth: "2.5",
    strokeLinejoin: "round",
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9.5 21v6.5c2.5 2.5 5 3 7.5 3s5-0.5 7.5-3V21",
    stroke: "white",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    opacity: "0.9"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "31",
    y1: "17",
    x2: "31",
    y2: "26",
    stroke: "white",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    opacity: "0.6"
  }))
};
const DockBackgrounds = {
  finder: 'linear-gradient(145deg,#1f6ed6,#3ab7ff)',
  works: 'linear-gradient(145deg,#0d3a6a,#2a6496)',
  scores: 'linear-gradient(145deg,#0d2e1a,#2a7a4a)',
  about: 'linear-gradient(145deg,#1e0d2e,#6a3a9a)',
  contact: 'linear-gradient(145deg,#0d2e0d,#3a9a3a)',
  teaching: 'linear-gradient(145deg,#2e1e0d,#a0683a)',
  cv: 'linear-gradient(145deg,#2a2a2a,#5a5a5a)',
  instagram: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)'
};
function DockIconContent({
  id,
  size
}) {
  const [imgError, setImgError] = useState(false);
  const imgPath = `https://pub-715e1f7bc3864cb8b05d16f94698b504.r2.dev/assets/dock/${id}.png`;
  const bg = DockBackgrounds[id] || 'linear-gradient(145deg,#333,#555)';
  const fallback = DockIconFallback[id];
  if (!imgError) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: size,
        height: size,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: 'none'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: imgPath,
      alt: id,
      onError: () => setImgError(true),
      draggable: false,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block'
      }
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: 14,
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 3px 12px rgba(0,0,0,0.35)'
    }
  }, fallback || /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#fff',
      fontSize: size * 0.4,
      fontWeight: 600
    }
  }, (id || '?').charAt(0).toUpperCase()));
}
function Dock({
  items,
  onItemClick,
  openSections
}) {
  const SIZE = 62;
  const [hoverId, setHoverId] = useState(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      bottom: 10,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'flex-end',
      gap: 5,
      background: 'rgba(240,240,245,0.35)',
      backdropFilter: 'blur(28px) saturate(200%)',
      WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      border: '1px solid rgba(255,255,255,0.55)',
      borderRadius: 16,
      padding: '6px 6px 8px 6px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.6)',
      zIndex: 9999,
      overflow: 'visible'
    },
    onMouseLeave: () => setHoverId(null)
  }, items.map((item, idx) => {
    const isOpen = openSections.has(item.id) || item.action?.type === 'section' && openSections.has(item.action.section);
    const isHover = hoverId === item.id;
    const needsSeparator = item.id === 'finder' && items.length > 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: item.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        position: 'relative'
        // HOVER LIFT: re-enable by uncommenting the two lines below
        // transition:'transform 0.12s',
        // transform: isHover ? 'translateY(-3px)' : 'translateY(0)',
      },
      onClick: () => onItemClick(item),
      onMouseEnter: () => setHoverId(item.id),
      onMouseLeave: () => setHoverId(null)
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: `${SIZE + 18}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(30,30,30,0.88)',
        color: '#fff',
        fontSize: 11.5,
        fontWeight: 500,
        padding: '4px 10px',
        borderRadius: 7,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        opacity: isHover ? 1 : 0,
        transition: 'opacity 0.12s',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }
    }, item.label, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: -4,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: '5px solid rgba(30,30,30,0.88)'
      }
    })), /*#__PURE__*/React.createElement(DockIconContent, {
      id: item.id,
      size: SIZE
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: -4,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: isOpen ? 'rgba(0,0,0,0.7)' : 'transparent'
      }
    })), needsSeparator && /*#__PURE__*/React.createElement("div", {
      style: {
        width: 1,
        alignSelf: 'stretch',
        background: 'rgba(0,0,0,0.15)',
        margin: '8px 2px'
      }
    }));
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU BAR — macOS-style
// ═══════════════════════════════════════════════════════════════════════════

// Icons for the right-side status tray
const TrayIcons = {
  // macOS-accurate battery: outline + tip + proportional inner fill + optional charging bolt.
  battery: ({
    level = 0.85,
    charging = true
  } = {}) => {
    const innerW = 19.5; // inside usable width
    const fillW = Math.max(1.5, innerW * level);
    return /*#__PURE__*/React.createElement("svg", {
      width: "28",
      height: "12",
      viewBox: "0 0 28 12"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "0.6",
      y: "0.6",
      width: "23.8",
      height: "10.8",
      rx: "2.6",
      fill: "none",
      stroke: "currentColor",
      strokeOpacity: "0.55",
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("rect", {
      x: "25",
      y: "3.5",
      width: "1.7",
      height: "5",
      rx: "0.7",
      fill: "currentColor",
      fillOpacity: "0.55"
    }), /*#__PURE__*/React.createElement("rect", {
      x: 2.5,
      y: "2",
      width: fillW,
      height: "8",
      rx: "1.1",
      fill: "currentColor"
    }), charging && /*#__PURE__*/React.createElement("path", {
      d: "M13.1 2.6 L10.2 6.2 H12 L11.4 9.4 L14.3 5.4 H12.5 L13.1 2.6 Z",
      fill: "#fff",
      stroke: "#fff",
      strokeWidth: "0.35",
      strokeLinejoin: "round"
    }));
  },
  // macOS-accurate volume / speaker with two wave arcs.
  volume: /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "14",
    viewBox: "0 0 18 14",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1.2 5 L4 5 L7.8 2 L7.8 12 L4 9 L1.2 9 Z",
    fill: "currentColor",
    stroke: "currentColor",
    strokeWidth: "0.6",
    strokeLinejoin: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 4.2 Q11.6 7 10 9.8",
    stroke: "currentColor",
    strokeWidth: "1.3",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12.2 2.5 Q14.8 7 12.2 11.5",
    stroke: "currentColor",
    strokeWidth: "1.3",
    strokeLinecap: "round"
  }))
};
function MenuBar() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const dateStr = time.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
  const timeStr = time.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const menuItem = (label, bold) => /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: '#1d1d1f',
      padding: '3px 10px',
      borderRadius: 5,
      fontWeight: bold ? 700 : 400,
      cursor: 'default',
      letterSpacing: '-0.01em'
    }
  }, label);
  const trayItem = content => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      padding: '0 6px',
      height: '100%',
      color: '#1d1d1f',
      cursor: 'default'
    }
  }, content);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 24,
      // Neutral, slightly cool translucent tint — no saturation boost (avoids the tan over warm wallpapers).
      background: 'rgba(246,246,248,0.32)',
      backdropFilter: 'blur(22px)',
      WebkitBackdropFilter: 'blur(22px)',
      boxShadow: 'inset 0 -0.5px 0 rgba(0,0,0,0.10)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 10px',
      zIndex: 9998,
      color: '#1d1d1f',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '2px 10px',
      cursor: 'default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "16",
    viewBox: "0 0 13 16",
    style: {
      display: 'block',
      overflow: 'visible'
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10.08 7.88c-.02-2.08 1.7-3.08 1.78-3.13-.97-1.42-2.48-1.62-3.02-1.64-1.29-.13-2.52.76-3.18.76-.67 0-1.67-.74-2.75-.72-1.41.02-2.72.82-3.44 2.08-1.48 2.57-.38 6.37 1.06 8.46.71 1.02 1.55 2.17 2.65 2.13 1.07-.04 1.47-.69 2.76-.69 1.29 0 1.65.69 2.77.67 1.15-.02 1.87-1.04 2.57-2.07.82-1.18 1.15-2.33 1.17-2.39-.03-.01-2.24-.86-2.27-3.42zM8.08 2.16c.58-.72.98-1.71.87-2.7-.84.04-1.87.57-2.48 1.28-.54.62-1.03 1.64-.9 2.6.94.07 1.91-.48 2.51-1.18z",
    fill: "#000"
  }))), menuItem(APP_TITLE_BOLD, true), menuItem(APP_TITLE_LIGHT, false), menuItem('File'), menuItem('Edit'), menuItem('View'), menuItem('Window'), menuItem('Help')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      height: '100%'
    }
  }, trayItem(TrayIcons.volume), trayItem(TrayIcons.battery({
    level: 0.85,
    charging: true
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: '#1d1d1f',
      padding: '0 8px 0 6px',
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '-0.01em',
      cursor: 'default'
    }
  }, dateStr, "\xA0\xA0", timeStr)));
}

// ═══════════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════════

function App() {
  const [works, setWorks] = useState([]);
  const [positions, setPositions] = useState({});
  const [windows, setWindows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const zRef = useRef(200);
  const nextZ = () => ++zRef.current;
  useEffect(() => {
    const loadWorks = async () => {
      try {
        const response = await fetch(WORKS_CSV_PATH);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const csvText = await response.text();
        const parsed = parseCSV(csvText);
        setWorks(parsed);
        const saved = localStorage.getItem('gk-icon-positions');
        if (saved) {
          const pos = JSON.parse(saved);
          const allPresent = parsed.every(w => pos[w.id]);
          if (allPresent) {
            setPositions(pos);
            return;
          }
        }
        setPositions(generateInitialPositions(parsed));
      } catch (err) {
        console.error('Failed to load works:', err);
        setLoadError(err.message);
      }
    };
    loadWorks();
  }, []);
  const openWindow = useCallback((type, work = null) => {
    const id = type === 'player' ? `player-${work.id || work.name}` : type;

    // Video/image players default to a smaller fixed size and open centered
    // (their content is otherwise huge at intrinsic size and lands off-center).
    let size = null;
    if (type === 'player' && (work?.mediaType === 'video' || work?.mediaType === 'image')) {
      size = {
        w: 560,
        h: 460
      };
    }
    const pos = size ? {
      x: (window.innerWidth - size.w) / 2 + (Math.random() - 0.5) * 80,
      y: (window.innerHeight - size.h) / 2 + (Math.random() - 0.5) * 60
    } : {
      x: window.innerWidth * 0.22 + Math.random() * window.innerWidth * 0.3,
      y: window.innerHeight * 0.08 + Math.random() * window.innerHeight * 0.18
    };
    setWindows(prev => {
      const exists = prev.find(w => w.id === id);
      if (exists) return prev.map(w => w.id === id ? {
        ...w,
        zIndex: nextZ()
      } : w);
      return [...prev, {
        id,
        type,
        work,
        zIndex: nextZ(),
        pos,
        size
      }];
    });
  }, []);
  const closeWindow = useCallback(id => setWindows(p => p.filter(w => w.id !== id)), []);
  const focusWindow = useCallback(id => setWindows(p => p.map(w => w.id === id ? {
    ...w,
    zIndex: nextZ()
  } : w)), []);
  const updatePos = useCallback((id, pos) => {
    setPositions(p => {
      const next = {
        ...p,
        [id]: pos
      };
      localStorage.setItem('gk-icon-positions', JSON.stringify(next));
      return next;
    });
  }, []);
  const handleDockItem = useCallback(item => {
    const a = item.action || {};
    if (a.type === 'section') {
      openWindow(a.section || 'works');
    } else if (a.type === 'url') {
      window.open(a.url, '_blank', 'noopener');
    } else if (a.type === 'file') {
      const path = resolvePath(a.path);
      const fakeWork = {
        id: `dock-${item.id}`,
        name: a.name || item.label,
        sub: '',
        mediaType: guessMediaType(path),
        mediaLocation: path,
        thumbnail: ''
      };
      openWindow('player', fakeWork);
    }
  }, [openWindow]);
  const openSections = useMemo(() => new Set(windows.map(w => w.type === 'player' ? null : w.type).filter(Boolean)), [windows]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      backgroundImage: `url(https://pub-715e1f7bc3864cb8b05d16f94698b504.r2.dev/assets/images/wallpaper.jpg)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    },
    onClick: () => setSelected(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'rgba(0,0,0,0.08)'
    }
  }), /*#__PURE__*/React.createElement(MenuBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      top: 24,
      bottom: 100
    }
  }, works.map((work, i) => /*#__PURE__*/React.createElement(DesktopIcon, {
    key: work.id,
    work: work,
    pos: positions[work.id] || {
      x: 80 + i * 10,
      y: 80
    },
    onPosChange: updatePos,
    onOpen: w => openWindow('player', w),
    isSelected: selected === work.id,
    onSelect: setSelected,
    dropDelay: i * 40
  }))), loadError && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      top: 42,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(255,59,48,0.95)',
      color: '#fff',
      padding: '10px 18px',
      borderRadius: 10,
      fontSize: 13,
      zIndex: 10000,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }
  }, "Could not load ", /*#__PURE__*/React.createElement("code", null, WORKS_CSV_PATH), ": ", loadError), windows.map(win => /*#__PURE__*/React.createElement(AppWindow, {
    key: win.id,
    win: win,
    onClose: closeWindow,
    onFocus: focusWindow,
    zIndex: win.zIndex,
    works: works,
    onOpenWork: w => openWindow('player', w)
  })), /*#__PURE__*/React.createElement(Dock, {
    items: DOCK_ITEMS,
    onItemClick: handleDockItem,
    openSections: openSections
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
