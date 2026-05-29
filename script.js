// script.js
const DISCORD_ID = '374351552720142336';
const LANYARD_WS = 'wss://api.lanyard.rest/socket';
const LANYARD_API = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;

let musicUnlocked = false;
const audio = document.getElementById('siteTrack');
const audioToggle = document.getElementById('audioToggle');
const audioSymbol = document.getElementById('audioSymbol');
const recordSymbol = document.getElementById('recordSymbol');
const audioBar = document.getElementById('audioBar');
const audioNow = document.getElementById('audioNow');
const audioLength = document.getElementById('audioLength');
const soundBar = document.getElementById('soundBar');
const soundSymbol = document.getElementById('soundSymbol');
const cursorGlow = document.getElementById('cursorGlow');

let lanyardWs = null;
let lanyardHb = null;

const BADGE_MAPPING = {
  STAFF: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/DiscordStaff.svg',
  PARTNER: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/Partner.svg',
  HYPESQUAD: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/HypeSquadEvents.svg',
  BUG_HUNTER_LEVEL_1: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/BugHunterLevel1.svg',
  HYPESQUAD_ONLINE_HOUSE_1: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/HypeSquadBravery.svg',
  HYPESQUAD_ONLINE_HOUSE_2: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/HypeSquadBrilliance.svg',
  HYPESQUAD_ONLINE_HOUSE_3: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/HypeSquadBalance.svg',
  PREMIUM_EARLY_SUPPORTER: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/EarlySupporter.svg',
  BUG_HUNTER_LEVEL_2: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/BugHunterLevel2.svg',
  ACTIVE_DEVELOPER: 'https://raw.githubusercontent.com/m66n/discord-badges/main/svg/DiscordActiveDeveloper.svg'
};

function initAudio() {
  if (!audio || !audioToggle || !audioBar) return;

  audio.volume = 0.5;
  if (soundBar) soundBar.value = 0.5;

  audioToggle.addEventListener('click', () => {
    musicUnlocked = true;
    if (audio.paused) {
      audio.play().catch(() => {});
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
      audioBar.max = Math.floor(audio.duration);
      audioBar.value = Math.floor(audio.currentTime);
      audioNow.textContent = formatTime(audio.currentTime);
      audioLength.textContent = formatTime(audio.duration);
    }
  });

  audioBar.addEventListener('input', () => {
    audio.currentTime = audioBar.value;
  });

  if (soundBar) {
    soundBar.addEventListener('input', () => {
      audio.volume = soundBar.value;
      if (audio.volume === 0) {
        soundSymbol.className = 'fa-solid fa-volume-xmark';
      } else if (audio.volume < 0.4) {
        soundSymbol.className = 'fa-solid fa-volume-low';
      } else {
        soundSymbol.className = 'fa-solid fa-volume-high';
      }
    });
  }

  document.addEventListener('click', () => {
    if (!musicUnlocked) {
      musicUnlocked = true;
      audio.play().then(() => {
        audioSymbol.className = 'fa fa-pause';
        if (recordSymbol) recordSymbol.classList.add('spinning');
      }).catch(() => {});
    }
  }, { once: true });
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function initEffects() {
  if (window.innerWidth > 700 && cursorGlow) {
    document.addEventListener('mousemove', e => {
      cursorGlow.style.opacity = '1';
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top = e.clientY + 'px';
      spawnTrail(e.clientX, e.clientY);
    });
    document.addEventListener('mouseleave', () => {
      cursorGlow.style.opacity = '0';
    });
  }
  initEmberField();
}

function spawnTrail(x, y) {
  if (Math.random() > 0.35) return;
  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  dot.style.left = x + 'px';
  dot.style.top = y + 'px';
  document.body.appendChild(dot);
  setTimeout(() => dot.remove(), 650);
}

function initEmberField() {
  const canvas = document.getElementById('emberField');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = (canvas.width = window.innerWidth);
  let h = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });

  const pCount = 30;
  const particles = [];
  for (let i = 0; i < pCount; i++) {
    particles.push({
      x: Math.random() * w,
                   y: Math.random() * h + h,
                   r: Math.random() * 1.5 + 0.5,
                   vx: Math.random() * 0.4 - 0.2,
                   vy: Math.random() * -0.7 - 0.3,
                   alpha: Math.random() * 0.5 + 0.2,
                   fade: Math.random() * 0.005 + 0.002
    });
  }

  function loop() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < pCount; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.fade;

      if (p.alpha <= 0 || p.y < -10 || p.x < -10 || p.x > w + 10) {
        p.x = Math.random() * w;
        p.y = h + Math.random() * 20;
        p.alpha = Math.random() * 0.5 + 0.2;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
  loop();
}

function renderDiscord(data) {
  if (!data) return;

  const user = data.discord_user;
  const status = data.discord_status;
  const activities = data.activities || [];

  const avatarHash = user.avatar;
  const isAnim = avatarHash && avatarHash.startsWith('a_');
  const ext = isAnim ? 'gif' : 'png';
  const avatarUrl = avatarHash
  ? `https://cdn.discordapp.com/avatars/${user.id}/${avatarHash}.${ext}?size=256`
  : 'firstavatar.png';

  const avatarImg = document.getElementById('avatarImg');
  const discordMiniAvatar = document.getElementById('discordMiniAvatar');

  if (avatarImg) avatarImg.src = avatarUrl;
  if (discordMiniAvatar) discordMiniAvatar.src = avatarUrl;

  const discordUsername = document.getElementById('discordUsername');
  if (discordUsername) discordUsername.textContent = user.global_name || user.username;

  const statusDot = document.getElementById('statusDot');
  const discordStatusText = document.getElementById('discordStatusText');

  if (statusDot) {
    statusDot.className = `status-dot ${status || 'offline'}`;
  }

  if (discordStatusText) {
    const statusMap = { online: 'Online', idle: 'Idle', dnd: 'Do Not Disturb', offline: 'Offline' };
    discordStatusText.textContent = statusMap[status] || 'Offline';
  }

  const badgesContainer = document.getElementById('discordBadges');
  if (badgesContainer) {
    badgesContainer.innerHTML = '';

    const flags = user.public_flags || 0;
    const badgeUrls = [];
    if (flags & 1) badgeUrls.push(BADGE_MAPPING.STAFF);
    if (flags & 2) badgeUrls.push(BADGE_MAPPING.PARTNER);
    if (flags & 4) badgeUrls.push(BADGE_MAPPING.HYPESQUAD);
    if (flags & 8) badgeUrls.push(BADGE_MAPPING.BUG_HUNTER_LEVEL_1);
    if (flags & 64) badgeUrls.push(BADGE_MAPPING.HYPESQUAD_ONLINE_HOUSE_1);
    if (flags & 128) badgeUrls.push(BADGE_MAPPING.HYPESQUAD_ONLINE_HOUSE_2);
    if (flags & 256) badgeUrls.push(BADGE_MAPPING.HYPESQUAD_ONLINE_HOUSE_3);
    if (flags & 512) badgeUrls.push(BADGE_MAPPING.PREMIUM_EARLY_SUPPORTER);
    if (flags & 16384) badgeUrls.push(BADGE_MAPPING.BUG_HUNTER_LEVEL_2);
    if (flags & 131072) badgeUrls.push(BADGE_MAPPING.ACTIVE_DEVELOPER);

    badgeUrls.forEach(url => {
      if(url) {
        const img = document.createElement('img');
        img.src = url;
        img.className = 'discord-badge-img';
        badgesContainer.appendChild(img);
      }
    });
  }

  const activityEl = document.getElementById('discordActivity');
  const listeningEl = document.getElementById('discordListening');

  if (activityEl) { activityEl.style.display = 'none'; activityEl.innerHTML = ''; }
  if (listeningEl) { listeningEl.style.display = 'none'; listeningEl.innerHTML = ''; }

  const customStatus = activities.find(a => a.type === 4);
  if (customStatus && discordStatusText) {
    let text = '';
    if (customStatus.emoji && customStatus.emoji.id) {
      const ext = customStatus.emoji.animated ? 'gif' : 'png';
      text += `<img src="https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${ext}" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;" />`;
    } else if (customStatus.emoji && customStatus.emoji.name) {
      text += customStatus.emoji.name + ' ';
    }
    text += customStatus.state || '';
    if (text.trim() !== '') {
      discordStatusText.innerHTML = text;
    }
  }

  const spotify = activities.find(a => a.name === 'Spotify' || a.id === 'spotify:1');
  if (spotify && listeningEl) {
    listeningEl.style.display = 'block';
    listeningEl.innerHTML = `<i class="fab fa-spotify" style="color:#1ed760; margin-right:6px;"></i> Listening to <strong>${spotify.details}</strong> by <em>${spotify.state}</em>`;
  }

  const game = activities.find(a => a.type === 0);
  if (game && activityEl) {
    activityEl.style.display = 'block';
    activityEl.innerHTML = `<i class="fa fa-gamepad" style="margin-right:6px;"></i> Playing <strong>${game.name}</strong>`;
  }
}

async function fetchLanyard() {
  try {
    const res = await fetch(LANYARD_API);
    const json = await res.json();
    if (json.success && json.data) renderDiscord(json.data);
  } catch (e) {
    console.warn('Lanyard REST failed:', e);
  }
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
          const data = msg.t === 'INIT_STATE' ? msg.d[DISCORD_ID] : msg.d;
          if (data) renderDiscord(data);
        }
      } catch {}
    };

    lanyardWs.onclose = () => {
      clearInterval(lanyardHb);
      setTimeout(connectLanyard, 6000);
    };
    lanyardWs.onerror = () => lanyardWs.close();
  } catch {}
}

document.addEventListener('DOMContentLoaded', () => {
  initAudio();
  initEffects();
  fetchLanyard();
  connectLanyard();
});
