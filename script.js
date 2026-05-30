const DISCORD_ID  = '374351552720142336';
const LANYARD_WS  = 'wss://api.lanyard.rest/socket';
const LANYARD_API = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

const BADGE_MAP = {
  STAFF:                    'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/DiscordStaff.svg',
  PARTNER:                  'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/Partner.svg',
  HYPESQUAD:                'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/HypeSquadEvents.svg',
  BUG_HUNTER_LEVEL_1:       'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/BugHunterLevel1.svg',
  HYPESQUAD_ONLINE_HOUSE_1: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/HypeSquadBravery.svg',
  HYPESQUAD_ONLINE_HOUSE_2: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/HypeSquadBrilliance.svg',
  HYPESQUAD_ONLINE_HOUSE_3: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/HypeSquadBalance.svg',
  PREMIUM_EARLY_SUPPORTER:  'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/EarlySupporter.svg',
  BUG_HUNTER_LEVEL_2:       'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/BugHunterLevel2.svg',
  ACTIVE_DEVELOPER:         'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/DiscordActiveDeveloper.svg',
  NITRO:                    'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/NitroSubscriber.svg',
};

let musicUnlocked = false;
const audio        = document.getElementById('siteTrack');
const audioToggle  = document.getElementById('audioToggle');
const audioSymbol  = document.getElementById('audioSymbol');
const recordSymbol = document.getElementById('recordSymbol');
const audioBar     = document.getElementById('audioBar');
const audioNow     = document.getElementById('audioNow');
const audioLength  = document.getElementById('audioLength');
const soundBar     = document.getElementById('soundBar');
const soundSymbol  = document.getElementById('soundSymbol');
const cursorGlow   = document.getElementById('cursorGlow');

let lanyardWs = null;
let lanyardHb = null;

function extractColor(img) {
  try {
    const c = document.createElement('canvas');
    c.width = 40; c.height = 40;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, 40, 40);
    const d = ctx.getImageData(0, 0, 40, 40).data;
    let rS=0, gS=0, bS=0, n=0;
    for (let i=0; i<d.length; i+=4) {
      const r=d[i], g=d[i+1], b=d[i+2], a=d[i+3];
      if (a < 80) continue;
      const lum = (r+g+b)/3;
      if (lum < 18 || lum > 230) continue;
      rS+=r; gS+=g; bS+=b; n++;
    }
    if (!n) return null;
    return { r:Math.round(rS/n), g:Math.round(gS/n), b:Math.round(bS/n) };
  } catch(e) { return null; }
}

function applyTheme(r, g, b) {
  const lum = (r+g+b)/3;
  const sat = Math.max(r,g,b) - Math.min(r,g,b);
  if (lum > 195 || sat < 14) { r=145; g=145; b=153; }

  const avg = (r+g+b)/3;
  const boost = 1.6;
  r = Math.min(255, Math.round(avg + (r-avg)*boost));
  g = Math.min(255, Math.round(avg + (g-avg)*boost));
  b = Math.min(255, Math.round(avg + (b-avg)*boost));

  const tR = Math.min(255, r+80);
  const tG = Math.min(255, g+80);
  const tB = Math.min(255, b+80);

  const root = document.documentElement;
  root.style.setProperty('--ac',       `${r}, ${g}, ${b}`);
  root.style.setProperty('--ac-color', `rgb(${r},${g},${b})`);
  root.style.setProperty('--ac-dim',   `rgba(${r},${g},${b},0.18)`);
  root.style.setProperty('--ac-dim2',  `rgba(${r},${g},${b},0.07)`);
  root.style.setProperty('--ac-text',  `rgb(${tR},${tG},${tB})`);
  root.style.setProperty('--ac-glow',  `rgba(${r},${g},${b},0.28)`);
  root.style.setProperty('--ac-border',`rgba(${r},${g},${b},0.42)`);

  const dynBg = document.getElementById('dynBgBlur');
  if (dynBg) {
    dynBg.style.background = `radial-gradient(ellipse at 40% 20%, rgba(${r},${g},${b},0.22) 0%, transparent 70%)`;
    dynBg.style.opacity = '1';
  }

  const banner = document.getElementById('bannerBlur');
  if (banner) {
    banner.style.background = `linear-gradient(135deg, rgba(${r},${g},${b},0.5) 0%, rgba(${r},${g},${b},0.15) 100%)`;
    banner.style.opacity = '1';
  }

  window._emberRGB = { r, g, b };
}

function loadAvatarWithTheme(url, imgEl) {
  const tmp = new Image();
  tmp.crossOrigin = 'anonymous';
  tmp.onload = () => {
    imgEl.src = url;
    const col = extractColor(tmp);
    if (col) applyTheme(col.r, col.g, col.b);

    const banner = document.getElementById('bannerBlur');
    if (banner) {
      banner.style.backgroundImage = `url('${url}')`;
    }
    const dynBg = document.getElementById('dynBgBlur');
    if (dynBg) {
      dynBg.style.backgroundImage = `url('${url}')`;
    }
  };
  tmp.onerror = () => { imgEl.src = url; };
  tmp.src = url;
}

function renderDiscord(data) {
  if (!data) return;

  const user       = data.discord_user;
  const status     = data.discord_status;
  const activities = data.activities || [];

  const hash   = user.avatar;
  const isAnim = hash && hash.startsWith('a_');
  const ext    = isAnim ? 'gif' : 'png';
  const avatarUrl = hash
    ? `https://cdn.discordapp.com/avatars/${user.id}/${hash}.${ext}?size=256`
    : 'firstavatar.png';

  const avatarImg = document.getElementById('avatarImg');
  if (avatarImg) loadAvatarWithTheme(avatarUrl, avatarImg);

  const unEl = document.getElementById('discordUsername');
  if (unEl) unEl.textContent = user.global_name || user.username;

  const dot = document.getElementById('statusDot');
  if (dot) dot.className = `status-dot-inline ${status || 'offline'}`;

  const stEl = document.getElementById('discordStatusText');
  const statusMap = { online:'Online', idle:'Idle', dnd:'Do Not Disturb', offline:'Offline' };
  const customStatus = activities.find(a => a.type === 4);
  if (stEl) {
    let txt = statusMap[status] || 'Offline';
    if (customStatus) {
      let cs = '';
      if (customStatus.emoji?.id) {
        const eExt = customStatus.emoji.animated ? 'gif' : 'png';
        cs += `<img src="https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${eExt}" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;" />`;
      } else if (customStatus.emoji?.name) {
        cs += customStatus.emoji.name + ' ';
      }
      cs += customStatus.state || '';
      if (cs.trim()) txt = cs;
    }
    stEl.innerHTML = txt;
  }

  const badgesEl = document.getElementById('discordBadges');
  if (badgesEl) {
    badgesEl.innerHTML = '';
    const flags = user.public_flags || 0;
    const pairs = [
      [1,      BADGE_MAP.STAFF],
      [2,      BADGE_MAP.PARTNER],
      [4,      BADGE_MAP.HYPESQUAD],
      [8,      BADGE_MAP.BUG_HUNTER_LEVEL_1],
      [64,     BADGE_MAP.HYPESQUAD_ONLINE_HOUSE_1],
      [128,    BADGE_MAP.HYPESQUAD_ONLINE_HOUSE_2],
      [256,    BADGE_MAP.HYPESQUAD_ONLINE_HOUSE_3],
      [512,    BADGE_MAP.PREMIUM_EARLY_SUPPORTER],
      [16384,  BADGE_MAP.BUG_HUNTER_LEVEL_2],
      [131072, BADGE_MAP.ACTIVE_DEVELOPER],
    ];
    pairs.forEach(([flag, url]) => {
      if (!(flags & flag)) return;
      const img = document.createElement('img');
      img.src = url; img.className = 'discord-badge-img';
      badgesEl.appendChild(img);
    });

    if (user.premium_type && user.premium_type > 0) {
      const img = document.createElement('img');
      img.src = BADGE_MAP.NITRO; img.className = 'discord-badge-img';
      badgesEl.appendChild(img);
    }
  }

  const actEl = document.getElementById('discordActivities');
  if (actEl) {
    actEl.innerHTML = '';

    const spotify = activities.find(a => a.name === 'Spotify' || a.id === 'spotify:1');
    if (spotify) {
      const pill = document.createElement('div');
      pill.className = 'activity-pill';
      pill.innerHTML = `
        <i class="fab fa-spotify spotify-icon"></i>
        <div class="act-detail">
          <span class="act-title">${spotify.details || 'Unknown'}</span>
          <span class="act-sub">by ${spotify.state || '—'} · ${spotify.assets?.large_text || ''}</span>
        </div>`;
      actEl.appendChild(pill);
    }

    const game = activities.find(a => a.type === 0);
    if (game) {
      const pill = document.createElement('div');
      pill.className = 'activity-pill';
      pill.innerHTML = `
        <i class="fa fa-gamepad"></i>
        <div class="act-detail">
          <span class="act-title">${game.name}</span>
          <span class="act-sub">${game.details || 'Playing'}</span>
        </div>`;
      actEl.appendChild(pill);
    }
  }
}

async function fetchLanyard() {
  try {
    const res  = await fetch(LANYARD_API);
    const json = await res.json();
    if (json.success && json.data) renderDiscord(json.data);
  } catch(e) { console.warn('Lanyard REST failed:', e); }
}

function connectLanyard() {
  try {
    lanyardWs = new WebSocket(LANYARD_WS);
    lanyardWs.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.op === 1) {
          lanyardHb = setInterval(() => {
            if (lanyardWs.readyState === WebSocket.OPEN)
              lanyardWs.send(JSON.stringify({ op: 3 }));
          }, msg.d.heartbeat_interval);
          lanyardWs.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));
        }
        if (msg.op === 0) {
          const d = msg.t === 'INIT_STATE' ? msg.d[DISCORD_ID] : msg.d;
          if (d) renderDiscord(d);
        }
      } catch {}
    };
    lanyardWs.onclose = () => { clearInterval(lanyardHb); setTimeout(connectLanyard, 6000); };
    lanyardWs.onerror = () => lanyardWs.close();
  } catch {}
}

function initAudio() {
  if (!audio || !audioToggle || !audioBar) return;
  audio.volume = 0.5;
  if (soundBar) soundBar.value = 0.5;

  audioToggle.addEventListener('click', () => {
    musicUnlocked = true;
    if (audio.paused) {
      audio.play().catch(()=>{});
      audioSymbol.className = 'fa fa-pause';
      if (recordSymbol) recordSymbol.classList.add('spinning');
    } else {
      audio.pause();
      audioSymbol.className = 'fa fa-play';
      if (recordSymbol) recordSymbol.classList.remove('spinning');
    }
  });

  audio.addEventListener('timeupdate', () => {
    if (!isNaN(audio.duration)) {
      audioBar.max   = Math.floor(audio.duration);
      audioBar.value = Math.floor(audio.currentTime);
      audioNow.textContent    = formatTime(audio.currentTime);
      audioLength.textContent = formatTime(audio.duration);
    }
  });

  audioBar.addEventListener('input', () => { audio.currentTime = audioBar.value; });

  if (soundBar) {
    soundBar.addEventListener('input', () => {
      audio.volume = soundBar.value;
      soundSymbol.className = audio.volume === 0
        ? 'fa-solid fa-volume-xmark'
        : audio.volume < 0.4
          ? 'fa-solid fa-volume-low'
          : 'fa-solid fa-volume-high';
    });
  }

  document.addEventListener('click', () => {
    if (!musicUnlocked) {
      musicUnlocked = true;
      audio.play().then(() => {
        audioSymbol.className = 'fa fa-pause';
        if (recordSymbol) recordSymbol.classList.add('spinning');
      }).catch(()=>{});
    }
  }, { once: true });
}

function formatTime(secs) {
  const m = Math.floor(secs/60), s = Math.floor(secs%60);
  return `${m}:${s<10?'0':''}${s}`;
}

function initEffects() {
  if (window.innerWidth > 700 && cursorGlow) {
    document.addEventListener('mousemove', e => {
      cursorGlow.style.opacity = '1';
      cursorGlow.style.left    = e.clientX + 'px';
      cursorGlow.style.top     = e.clientY + 'px';
      spawnTrail(e.clientX, e.clientY);
    });
    document.addEventListener('mouseleave', () => { cursorGlow.style.opacity = '0'; });
  }
  initEmberField();
}

function spawnTrail(x, y) {
  if (Math.random() > 0.35) return;
  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  dot.style.left = x + 'px';
  dot.style.top  = y + 'px';
  document.body.appendChild(dot);
  setTimeout(() => dot.remove(), 650);
}

function initEmberField() {
  const canvas = document.getElementById('emberField');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width  = window.innerWidth;
  let h = canvas.height = window.innerHeight;
  window.addEventListener('resize', () => {
    w = canvas.width  = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });

  const pCount = 35;
  const particles = Array.from({ length: pCount }, () => ({
    x: Math.random()*w, y: Math.random()*h+h,
    r: Math.random()*1.6+0.4,
    vx: Math.random()*0.4-0.2, vy: Math.random()*-0.8-0.3,
    alpha: Math.random()*0.5+0.2, fade: Math.random()*0.005+0.002,
  }));

  function loop() {
    ctx.clearRect(0, 0, w, h);
    const rgb = window._emberRGB || { r:145, g:145, b:153 };
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.alpha -= p.fade;
      if (p.alpha <= 0 || p.y < -10 || p.x < -10 || p.x > w+10) {
        p.x = Math.random()*w; p.y = h + Math.random()*20;
        p.alpha = Math.random()*0.5+0.2;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  loop();
}

document.addEventListener('DOMContentLoaded', () => {
  initAudio();
  initEffects();
  fetchLanyard();
  connectLanyard();
});
