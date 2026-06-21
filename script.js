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
const BADGE_NAMES = {
  STAFF:'Discord Staff', PARTNER:'Partner', HYPESQUAD:'HypeSquad Events',
  BUG_HUNTER_LEVEL_1:'Bug Hunter', HYPESQUAD_ONLINE_HOUSE_1:'HypeSquad Bravery',
  HYPESQUAD_ONLINE_HOUSE_2:'HypeSquad Brilliance', HYPESQUAD_ONLINE_HOUSE_3:'HypeSquad Balance',
  PREMIUM_EARLY_SUPPORTER:'Early Supporter', BUG_HUNTER_LEVEL_2:'Bug Hunter Gold',
  ACTIVE_DEVELOPER:'Active Developer', NITRO:'Nitro',
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

function showToast(msg) {
  const t = document.getElementById('copyToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

function renderDiscord(data) {
  if (!data) return;

  const user       = data.discord_user;
  const status     = data.discord_status;
  const activities = data.activities || [];
  const realTag = user.global_name || user.username;
  const tagEl = document.getElementById('discordTagText');
  if (tagEl) tagEl.textContent = realTag;
  const copyBtn = document.getElementById('discordTagCopy');
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(realTag).then(() => showToast('copied to clipboard')).catch(() => {});
    };
  }
  const dot = document.getElementById('statusDot');
  if (dot) dot.className = `status-dot-inline ${status || 'offline'}`;

  const stEl = document.getElementById('discordStatusText');
  const statusMap = { online:'online', idle:'idle', dnd:'do not disturb', offline:'offline' };
  const customStatus = activities.find(a => a.type === 4);
  if (stEl) {
    let txt = statusMap[status] || 'offline';
    if (customStatus) {
      let cs = '';
      if (customStatus.emoji?.id) {
        const eExt = customStatus.emoji.animated ? 'gif' : 'png';
        cs += `<img src="https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${eExt}" style="width:13px;height:13px;vertical-align:middle;margin-right:4px;" />`;
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
      [1,      'STAFF'],
      [2,      'PARTNER'],
      [4,      'HYPESQUAD'],
      [8,      'BUG_HUNTER_LEVEL_1'],
      [64,     'HYPESQUAD_ONLINE_HOUSE_1'],
      [128,    'HYPESQUAD_ONLINE_HOUSE_2'],
      [256,    'HYPESQUAD_ONLINE_HOUSE_3'],
      [512,    'PREMIUM_EARLY_SUPPORTER'],
      [16384,  'BUG_HUNTER_LEVEL_2'],
      [131072, 'ACTIVE_DEVELOPER'],
    ];
    pairs.forEach(([flag, key]) => {
      if (!(flags & flag)) return;
      const wrap = document.createElement('div'); wrap.className = 'badge-wrap';
      const img = document.createElement('img'); img.src = BADGE_MAP[key]; img.className = 'discord-badge-img';
      const tip = document.createElement('span'); tip.className = 'badge-tooltip'; tip.textContent = BADGE_NAMES[key];
      wrap.appendChild(img); wrap.appendChild(tip); badgesEl.appendChild(wrap);
    });
    if (user.premium_type && user.premium_type > 0) {
      const wrap = document.createElement('div'); wrap.className = 'badge-wrap';
      const img = document.createElement('img'); img.src = BADGE_MAP.NITRO; img.className = 'discord-badge-img';
      const tip = document.createElement('span'); tip.className = 'badge-tooltip'; tip.textContent = 'Nitro';
      wrap.appendChild(img); wrap.appendChild(tip); badgesEl.appendChild(wrap);
    }
  }
  const rowGame    = document.getElementById('rowGame');
  const gameText   = document.getElementById('gameText');
  const rowSpotify = document.getElementById('rowSpotify');
  const spotifyText= document.getElementById('spotifyText');

  const game = activities.find(a => a.type === 0);
  if (game && rowGame && gameText) {
    gameText.textContent = game.details ? `${game.name} — ${game.details}` : game.name;
    rowGame.style.display = 'flex';
  } else if (rowGame) {
    rowGame.style.display = 'none';
  }

  const spotify = activities.find(a => a.name === 'Spotify' || a.id === 'spotify:1');
  if (spotify && rowSpotify && spotifyText) {
    spotifyText.textContent = `${spotify.details || 'unknown'} — ${spotify.state || '—'}`;
    rowSpotify.style.display = 'flex';
  } else if (rowSpotify) {
    rowSpotify.style.display = 'none';
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

function initLocalTime() {
  const el = document.getElementById('localTimeSpan');
  if (!el) return;
  function tick() {
    const now = new Date();
    const opts = { timeZone:'Asia/Riyadh', hour:'2-digit', minute:'2-digit', hour12:true };
    el.textContent = now.toLocaleTimeString('en-US', opts) + ' AST';
  }
  tick(); setInterval(tick, 1000);
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
  if (Math.random() > 0.12) return;
  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  dot.style.left = x + 'px';
  dot.style.top  = y + 'px';
  document.body.appendChild(dot);
  setTimeout(() => dot.remove(), 600);
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

  const pCount = 16;
  const particles = Array.from({ length: pCount }, () => ({
    x: Math.random()*w, y: Math.random()*h+h,
    r: Math.random()*1.2+0.3,
    vx: Math.random()*0.25-0.12, vy: Math.random()*-0.45-0.18,
    alpha: Math.random()*0.28+0.08, fade: Math.random()*0.004+0.0015,
  }));

  function loop() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.alpha -= p.fade;
      if (p.alpha <= 0 || p.y < -10 || p.x < -10 || p.x > w+10) {
        p.x = Math.random()*w; p.y = h + Math.random()*20;
        p.alpha = Math.random()*0.28+0.08;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(220,220,220,${p.alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  loop();
}

document.addEventListener('DOMContentLoaded', () => {
  initAudio();
  initEffects();
  initLocalTime();
  fetchLanyard();
  connectLanyard();
});
