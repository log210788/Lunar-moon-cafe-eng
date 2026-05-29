// ==========================================================================
// Web Audio Synthesizer (No external assets required!)
// ==========================================================================
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!document.getElementById('audioToggle').checked) return;
    try {
        initAudio();
        const now = audioCtx.currentTime;

        switch (type) {
            case 'like': {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(1500, now + 0.08);
                
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            }
            case 'damage': {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(700, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
                
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
                break;
            }
            case 'shield': {
                const osc1 = audioCtx.createOscillator();
                const osc2 = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(400, now);
                osc1.frequency.exponentialRampToValueAtTime(800, now + 0.25);
                
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(600, now);
                osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
                
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                
                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.3);
                osc2.stop(now + 0.3);
                break;
            }
            case 'nuke-cross': {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.25);
                
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
                break;
            }
            case 'nuke-area': {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(40, now + 0.4);
                
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            }
            case 'nuke-laser': {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(900, now + 0.6);
                
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.6);
                break;
            }
            case 'nuke-mega': {
                const osc = audioCtx.createOscillator();
                const noiseGain = audioCtx.createGain();
                
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
                osc.frequency.exponentialRampToValueAtTime(30, now + 1.4);
                
                noiseGain.gain.setValueAtTime(0.01, now);
                noiseGain.gain.linearRampToValueAtTime(0.25, now + 0.5);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.4);
                
                osc.connect(noiseGain);
                noiseGain.connect(audioCtx.destination);
                
                osc.start(now);
                osc.stop(now + 1.4);
                break;
            }
        }
    } catch (e) {
        console.warn('Audio context suspended or failed', e);
    }
}

// ==========================================================================
// Board State & Configuration
// ==========================================================================
const GRID_SIZE = 6;
let boardState = [];
let lastTargetId = -1; // stores the target of the last simulated action
let activePlayers = {}; // stores active viewers and their board statuses

// Match Timer & Mystery Prize state variables
let matchTimeLeft = 180; // default 3 minutes (180 seconds)
let matchDuration = 180;
let matchTimerInterval = null;
let shuffleInterval = null;
let positionShuffleInterval = null;
let shuffleTimeout1 = null;
let shuffleTimeout2 = null;
let shuffleTimeout3 = null;
let isTimerRunning = false;
let isGameFinished = false;
let isShuffling = false;
let isVisualShuffling = false;
let activePrizePool = [];

// Prize Pool definition (36 total items for 6x6 grid)
const PRIZE_POOL = [
    { type: 'jackpot', name: 'PlayStation 5 👑', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/PlayStation_5_and_DualSense_with_transparent_background.png' },
    { type: 'major', name: 'Nintendo Switch 🎮', icon: '🎮' },
    { type: 'major', name: 'Steam Game Key 🔑', icon: '🔑' },
    { type: 'special', name: 'Moderator Status ⭐', icon: '⭐' },
    { type: 'special', name: 'Moderator Status ⭐', icon: '⭐' },
    { type: 'special', name: 'TikTok Follow Back 🤝', icon: '🤝' },
    { type: 'special', name: 'TikTok Follow Back 🤝', icon: '🤝' },
    { type: 'special', name: 'Personal Shoutout 📣', icon: '📣' },
    { type: 'special', name: 'Personal Shoutout 📣', icon: '📣' },
    { type: 'special', name: 'Custom Discord Role 🎭', icon: '🎭' },
    { type: 'special', name: 'Custom Discord Role 🎭', icon: '🎭' },
    { type: 'common', name: '100 TikTok Coins 🪙', icon: '🪙' },
    { type: 'common', name: '100 TikTok Coins 🪙', icon: '🪙' },
    { type: 'common', name: '50 TikTok Coins 🪙', icon: '🪙' },
    { type: 'common', name: '50 TikTok Coins 🪙', icon: '🪙' },
    { type: 'common', name: '10 TikTok Coins 🪙', icon: '🪙' },
    { type: 'common', name: '10 TikTok Coins 🪙', icon: '🪙' },
    { type: 'common', name: 'Double Shoutout XP 📈', icon: '📈' },
    { type: 'common', name: 'Double Shoutout XP 📈', icon: '📈' },
    { type: 'common', name: 'Custom Meme Sound 🎵', icon: '🎵' },
    { type: 'common', name: 'Custom Meme Sound 🎵', icon: '🎵' },
    { type: 'common', name: 'Join Steam Party 🛸', icon: '🛸' },
    { type: 'common', name: 'Join Steam Party 🛸', icon: '🛸' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' },
    { type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' }
];

// Fisher-Yates shuffle helper to ensure uniform random distributions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

// Render prize icon helper (handles emojis and image URLs)
function renderPrizeIcon(icon) {
    if (typeof icon === 'string' && (icon.startsWith('http') || icon.includes('.png') || icon.includes('.jpg') || icon.includes('.svg'))) {
        return `<img src="${icon}" class="prize-icon-img" alt="Prize" />`;
    }
    return icon;
}

// Generate A1, B2 labels from index
function getCoordLabel(index) {
    const colLetter = String.fromCharCode(65 + (index % GRID_SIZE)); // A, B, C...
    const rowNum = Math.floor(index / GRID_SIZE) + 1; // 1, 2, 3...
    return `${colLetter}${rowNum}`;
}

// Generate consistent HSL player color
function getPlayerColor(username) {
    if (!username || username === 'System' || username === 'Anonymous') return '#4b5563'; // neutral gray
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 85%, 55%)`; // vibrant neon colors
}

// Generate consistent transparent HSL player color glow
function getPlayerColorGlow(username) {
    if (!username || username === 'System' || username === 'Anonymous') return 'rgba(75, 85, 99, 0.25)';
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsla(${hue}, 85%, 55%, 0.35)`; // transparent glow
}

function buildActivePrizePool(count) {
    const activePool = [];
    
    // Priority order:
    // 1. Jackpot PS5 (only if count >= 10)
    if (count >= 10 && PRIZE_POOL.length > 0) {
        const ps5 = PRIZE_POOL.find(p => p.type === 'jackpot');
        if (ps5) activePool.push(ps5);
    }
    
    // 2. Majors (Nintendo Switch, Steam Key)
    const majors = PRIZE_POOL.filter(p => p.type === 'major');
    majors.forEach(m => {
        if (activePool.length < count) {
            activePool.push(m);
        }
    });
    
    // 3. Specials
    const specials = PRIZE_POOL.filter(p => p.type === 'special');
    specials.forEach(s => {
        if (activePool.length < count) {
            activePool.push(s);
        }
    });
    
    // 4. Commons
    const commons = PRIZE_POOL.filter(p => p.type === 'common');
    const shuffledCommons = shuffleArray([...commons]);
    shuffledCommons.forEach(c => {
        if (activePool.length < count) {
            activePool.push(c);
        }
    });
    
    // Fallback fill
    while (activePool.length < count) {
        activePool.push({ type: 'common', name: 'Better Luck Next Time ☘️', icon: '☘️' });
    }
    
    return activePool;
}

function shufflePrizes() {
    const prizeCountInput = document.getElementById('matchPrizesCountInput');
    let count = 10;
    if (prizeCountInput) {
        count = parseInt(prizeCountInput.value) || 10;
        count = Math.max(1, Math.min(36, count));
    }
    activePrizePool = buildActivePrizePool(count);
    
    const shuffledPrizes = shuffleArray([...activePrizePool]);
    
    const indices = [];
    for (let i = 0; i < boardState.length; i++) {
        indices.push(i);
        boardState[i].prize = null;
        boardState[i].revealed = false;
        boardState[i].isShuffling = false;
    }
    shuffleArray(indices);
    
    for (let j = 0; j < shuffledPrizes.length; j++) {
        const tileIdx = indices[j];
        boardState[tileIdx].prize = shuffledPrizes[j];
    }
}

function renderShowcaseShelf(prizes) {
    const shelfEl = document.getElementById('prizeShowcaseShelf');
    if (!shelfEl) return;
    shelfEl.innerHTML = prizes.map((p, idx) => {
        const rarityClass = `rarity-${p.type}`;
        return `<div class="showcase-item ${rarityClass}" id="showcase-item-${idx}" title="${p.name}">${renderPrizeIcon(p.icon)}</div>`;
    }).join('');
}

// Init board array: ALL start neutral (empty)
function initBoard() {
    boardState = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        boardState.push({
            id: i,
            coord: getCoordLabel(i),
            hp: 6,
            maxHp: 6,
            shield: 0,
            team: 'neutral',
            ownerName: 'System',
            profilePicUrl: '',
            immune: false,
            immuneTimeLeft: 0,
            activeEffect: null,
            prize: null,
            revealed: false,
            isShuffling: false,
            visualIndex: i,
            offsetX: 0,
            offsetY: 0
        });
    }
    shufflePrizes();
}

// ==========================================================================
// UI Rendering & DOM Updates
// ==========================================================================
function renderBoard() {
    const boardEl = document.getElementById('gridBoard');

    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const index = r * GRID_SIZE + c;
            const square = boardState[index];

            let sqEl = document.getElementById(`square-${square.id}`);

            if (!sqEl) {
                // Initial render: Create the element once
                sqEl = document.createElement('div');
                sqEl.className = 'grid-square';
                sqEl.id = `square-${square.id}`;
                sqEl.dataset.id = square.id;

                sqEl.addEventListener('click', () => {
                    selectSquare(square.id);
                });

                sqEl.addEventListener('animationend', (e) => {
                    if (e.target !== sqEl) return; // ignore children animationend events bubbling up
                    const effects = ['shake', 'takeover-flash', 'under-attack', 'deflected'];
                    effects.forEach(eff => {
                        if (sqEl.classList.contains(eff)) {
                            sqEl.classList.remove(eff);
                            square.activeEffect = null;
                        }
                    });
                });

                boardEl.appendChild(sqEl);
            }

            // Sync Dynamic Position based on visualIndex
            const visualIdx = square.visualIndex !== undefined ? square.visualIndex : square.id;
            const visualRow = Math.floor(visualIdx / GRID_SIZE);
            const visualCol = visualIdx % GRID_SIZE;
            let left = visualCol * 82 + (visualRow % 2 === 1 ? 41 : 0);
            let top = visualRow * 69 + 12;
            
            // Apply chaotic physical offsets during shuffling
            if (square.isShuffling) {
                left += square.offsetX || 0;
                top += square.offsetY || 0;
            }
            
            const zIndex = 6 - visualRow;

            sqEl.style.left = `${left}px`;
            sqEl.style.top = `${top}px`;
            sqEl.style.zIndex = zIndex;

            // Sync Classes
            const isOwned = square.ownerName !== 'System';
            sqEl.classList.toggle('owned', isOwned);
            if (isOwned) {
                const color = getPlayerColor(square.ownerName);
                const colorGlow = getPlayerColorGlow(square.ownerName);
                sqEl.style.setProperty('--owner-color', color);
                sqEl.style.setProperty('--owner-color-glow', colorGlow);
            } else {
                sqEl.style.removeProperty('--owner-color');
                sqEl.style.removeProperty('--owner-color-glow');
            }
            sqEl.classList.toggle('selected', square.id === lastTargetId);
            sqEl.classList.toggle('shielded', square.shield > 0);
            sqEl.classList.toggle('immune', square.immune);
            sqEl.classList.toggle('shuffling-tile', square.isShuffling);

            // Sync active animation classes
            ['shake', 'takeover-flash', 'under-attack', 'deflected'].forEach(eff => {
                sqEl.classList.toggle(eff, square.activeEffect === eff);
            });

            // Update details
            const hpPercent = (square.hp / square.maxHp) * 100;
            const shieldPercent = square.immune ? (square.immuneTimeLeft / 60) * 100 : Math.min(100, (square.shield / 6) * 100);

            let shieldBadgeHtml = '';
            if (square.immune) {
                shieldBadgeHtml = `<span class="shield-badge immune-badge">⚡IMMUNE ${Math.ceil(square.immuneTimeLeft)}s</span>`;
            } else if (square.shield > 0) {
                shieldBadgeHtml = `<span class="shield-badge">🛡️${square.shield}</span>`;
            }

            let prizeBadgeHtml = '';
            if (square.prize) {
                const prizeIcon = square.revealed ? renderPrizeIcon(square.prize.icon) : '🎁';
                const shufflingClass = square.isShuffling ? 'shuffling' : (square.revealed ? 'revealed' : '');
                prizeBadgeHtml = `<span class="prize-badge ${shufflingClass}" title="${square.revealed ? square.prize.name : 'Mystery Prize'}">${prizeIcon}</span>`;
            }

            // Build inner HTML structure only on first load
            if (!sqEl.querySelector('.square-coord')) {
                sqEl.innerHTML = `
                    <div class="square-coord"></div>
                    <div class="square-owner"></div>
                    <div class="username-label"></div>
                    <div class="prize-badge-container"></div>
                    
                    <!-- Hexagonal HUD Perimeter Overlay -->
                    <svg class="hex-hud-svg" viewBox="0 0 80 92">
                        <polygon class="hud-path hp-track" points="40,3.5 77,24.8 77,67.2 40,88.5 3,67.2 3,24.8" />
                        <polygon class="hud-path hp-catchup" points="40,3.5 77,24.8 77,67.2 40,88.5 3,67.2 3,24.8" />
                        <polygon class="hud-path hp-fill" points="40,3.5 77,24.8 77,67.2 40,88.5 3,67.2 3,24.8" />
                        
                        <polygon class="hud-path shd-track" points="40,8.3 72.8,27.1 72.8,64.9 40,83.7 7.2,64.9 7.2,27.1" />
                        <polygon class="hud-path shd-catchup" points="40,8.3 72.8,27.1 72.8,64.9 40,83.7 7.2,64.9 7.2,27.1" />
                        <polygon class="hud-path shd-fill" points="40,8.3 72.8,27.1 72.8,64.9 40,83.7 7.2,64.9 7.2,27.1" />
                    </svg>
                    <div class="shield-bubble-overlay"></div>
                `;
            }

            // Sync reveal-flip class for animations
            sqEl.classList.toggle('reveal-flip', square.revealed);

            // Update DOM text/HTML values selectively
            const coordEl = sqEl.querySelector('.square-coord');
            const expectedCoordHtml = `${square.coord}${shieldBadgeHtml}`;
            if (coordEl.innerHTML !== expectedCoordHtml) {
                coordEl.innerHTML = expectedCoordHtml;
            }

            const prizeContainerEl = sqEl.querySelector('.prize-badge-container');
            if (prizeContainerEl) {
                if (prizeContainerEl.innerHTML !== prizeBadgeHtml) {
                    prizeContainerEl.innerHTML = prizeBadgeHtml;
                }
            }

            const avatarHtml = square.ownerName === 'System'
                ? 'SYS'
                : `<img class="user-avatar" src="${square.profilePicUrl}" alt="${square.ownerName}">`;
            
            const ownerEl = sqEl.querySelector('.square-owner');
            ownerEl.title = `Owner: ${square.ownerName}`;
            if (ownerEl.innerHTML !== avatarHtml) {
                ownerEl.innerHTML = avatarHtml;
            }

            const usernameEl = sqEl.querySelector('.username-label');
            const expectedUsername = square.ownerName === 'System' ? 'System' : square.ownerName;
            if (usernameEl.textContent !== expectedUsername) {
                usernameEl.textContent = expectedUsername;
            }

            // Update SVGs style offsets directly
            const hpOffset = 254 * (1 - hpPercent / 100);
            const hpFill = sqEl.querySelector('.hp-fill');
            const hpCatchup = sqEl.querySelector('.hp-catchup');
            hpFill.style.strokeDasharray = '254';
            hpFill.style.strokeDashoffset = hpOffset.toString();
            hpCatchup.style.strokeDasharray = '254';
            hpCatchup.style.strokeDashoffset = hpOffset.toString();

            const shdOffset = 227 * (1 - shieldPercent / 100);
            const shdFill = sqEl.querySelector('.shd-fill');
            const shdCatchup = sqEl.querySelector('.shd-catchup');
            shdFill.style.strokeDasharray = '227';
            shdFill.style.strokeDashoffset = shdOffset.toString();
            shdCatchup.style.strokeDasharray = '227';
            shdCatchup.style.strokeDashoffset = shdOffset.toString();
        }
    }

    updatePlayerRoster();
    updateStats();
}

function updateLastTargetIndicator(id) {
    lastTargetId = id;
    const square = boardState[id];
    if (square) {
        document.querySelector('.coordinate-value').textContent = square.coord;
    }
}

function updateStats() {
    let neutralCount = 0;
    const scores = {};

    boardState.forEach(s => {
        if (s.ownerName === 'System') {
            neutralCount++;
        } else {
            scores[s.ownerName] = (scores[s.ownerName] || 0) + 1;
        }
    });

    // Count active players (everyone in activePlayers registry)
    const activePlayersList = Object.values(activePlayers);
    const activeCount = activePlayersList.length;

    // Find top player
    let topPlayer = 'None';
    let maxScore = 0;
    for (const [player, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            topPlayer = `${player} (${score})`;
        }
    }

    const neutralEl = document.getElementById('neutralScore');
    if (neutralEl) neutralEl.textContent = neutralCount;

    const activeEl = document.getElementById('activePlayersCount');
    if (activeEl) activeEl.textContent = activeCount;

    const leaderEl = document.getElementById('topConqueror');
    if (leaderEl) {
        leaderEl.textContent = topPlayer;
        if (topPlayer !== 'None') {
            const leaderName = topPlayer.split(' (')[0];
            leaderEl.style.color = getPlayerColor(leaderName);
        } else {
            leaderEl.style.color = 'var(--coin-gold)';
        }
    }
}

// Log activities to screen
function logActivity(text, type = 'system') {
    const logEl = document.getElementById('activityLog');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerHTML = `<span style="color: var(--text-muted)">[${time}]</span> ${text}`;
    
    logEl.appendChild(entry);
    
    // Auto Scroll
    logEl.scrollTop = logEl.scrollHeight;
}

function triggerVisualFX(squareId, effect) {
    const square = boardState[squareId];
    if (!square) return;
    square.activeEffect = effect;

    const el = document.getElementById(`square-${squareId}`);
    if (el) {
        el.classList.remove('shake', 'takeover-flash', 'under-attack', 'deflected');
        void el.offsetWidth; // Trigger reflow
        el.classList.add(effect);
    }
}

function spawnFloatingText(squareId, text, type = 'damage') {
    const boardEl = document.getElementById('gridBoard');
    if (!boardEl) return;

    const square = boardState[squareId];
    if (!square) return;

    const row = Math.floor(squareId / GRID_SIZE);
    const col = squareId % GRID_SIZE;

    // Calculate center coordinates of the target hex
    const left = col * 82 + (row % 2 === 1 ? 41 : 0) + 40; // center X
    const top = row * 69 + 12 + 46; // center Y

    const floatEl = document.createElement('div');
    floatEl.className = `floating-text ${type}`;
    floatEl.textContent = text;

    // Position absolutely relative to the gridBoard container
    floatEl.style.position = 'absolute';
    floatEl.style.left = `${left}px`;
    floatEl.style.top = `${top}px`;
    floatEl.style.zIndex = '500'; // Make sure it sits on top of all rows

    // RPG style random angle and horizontal drift
    const angle = (Math.random() - 0.5) * 36; // -18deg to +18deg
    const drift = (Math.random() - 0.5) * 50; // -25px to +25px
    floatEl.style.setProperty('--drift-x', `${drift}px`);
    floatEl.style.setProperty('--rotate-angle', `${angle}deg`);

    boardEl.appendChild(floatEl);

    floatEl.addEventListener('animationend', () => {
        floatEl.remove();
    });
}

function spawnLeaderboardFloatingText(username, text) {
    const dock = document.getElementById('leaderboardDock');
    if (!dock) return;

    // Find the row element
    const rowEl = dock.querySelector(`.leaderboard-row[data-username="${username}"]`);
    if (!rowEl) return;

    const dockRect = dock.getBoundingClientRect();
    const rowRect = rowEl.getBoundingClientRect();

    // Position relative to #leaderboardDock
    const left = rowRect.left - dockRect.left + rowRect.width / 2 - 20;
    const top = rowRect.top - dockRect.top + rowRect.height / 2 - 10;

    const floatEl = document.createElement('div');
    floatEl.className = 'floating-text damage';
    floatEl.textContent = text;
    floatEl.style.position = 'absolute';
    floatEl.style.left = `${left}px`;
    floatEl.style.top = `${top}px`;
    floatEl.style.zIndex = '1000';

    // RPG style random angle and horizontal drift
    const angle = (Math.random() - 0.5) * 20; // -10deg to +10deg
    const drift = (Math.random() - 0.5) * 30; // -15px to +15px
    floatEl.style.setProperty('--drift-x', `${drift}px`);
    floatEl.style.setProperty('--rotate-angle', `${angle}deg`);

    dock.appendChild(floatEl);

    floatEl.addEventListener('animationend', () => {
        floatEl.remove();
    });
}

function spawnParticles(squareId, colorType) {
    const boardEl = document.getElementById('gridBoard');
    if (!boardEl) return;

    const square = boardState[squareId];
    if (!square) return;

    const row = Math.floor(squareId / GRID_SIZE);
    const col = squareId % GRID_SIZE;

    // Calculate center coordinates of the target hex
    const left = col * 82 + (row % 2 === 1 ? 41 : 0) + 40; // center X
    const top = row * 69 + 12 + 46; // center Y

    let resolvedColor = '#ef4444'; // fallback red
    if (colorType === 'green') resolvedColor = '#10b981';
    else if (colorType === 'gold') resolvedColor = '#f59e0b';
    else if (colorType === 'cyan') resolvedColor = '#00d2ff';
    else if (colorType === 'red') resolvedColor = '#ef4444';
    else if (colorType) resolvedColor = colorType; // custom HSL or hex color

    // Spawn 7 flying particles
    for (let i = 0; i < 7; i++) {
        const particle = document.createElement('div');
        particle.className = `hit-particle`;
        particle.style.setProperty('--particle-color', resolvedColor);
        
        particle.style.position = 'absolute';
        particle.style.left = `${left}px`;
        particle.style.top = `${top}px`;
        particle.style.zIndex = '400'; // Sits on top of the hexes

        const angle = Math.random() * Math.PI * 2;
        const speed = 15 + Math.random() * 25;
        const destX = Math.cos(angle) * speed;
        const destY = Math.sin(angle) * speed;

        particle.style.setProperty('--dest-x', `${destX}px`);
        particle.style.setProperty('--dest-y', `${destY}px`);

        boardEl.appendChild(particle);

        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }
}

function selectSquare(id) {
    updateLastTargetIndicator(id);
    renderBoard();
}

// Active Viewer Lobby Registration
function registerActivePlayer(username) {
    if (!username || username === 'System' || username === 'Anonymous') return;
    if (!activePlayers[username]) {
        activePlayers[username] = {
            name: username,
            avatar: `https://robohash.org/${encodeURIComponent(username)}?set=set4`,
            squaresCount: 0,
            attacking: false,
            hurt: false
        };
    }
}

// Recalculate owned squares for the Roster
function updatePlayerRoster() {
    // Save old counts to detect territory loss
    const oldCounts = {};
    Object.values(activePlayers).forEach(p => {
        oldCounts[p.name] = p.squaresCount;
    });

    // Reset counts
    Object.values(activePlayers).forEach(p => p.squaresCount = 0);
    
    // Count owned squares and dynamically register any owners we missed (e.g. from autoplay bots)
    boardState.forEach(s => {
        if (s.ownerName !== 'System') {
            registerActivePlayer(s.ownerName);
            if (activePlayers[s.ownerName]) {
                activePlayers[s.ownerName].squaresCount++;
            }
        }
    });

    // Detect territory loss and trigger visual hurt FX
    Object.values(activePlayers).forEach(p => {
        const prev = oldCounts[p.name] || 0;
        const current = p.squaresCount;
        if (prev > current && prev > 0) {
            p.hurt = true;
            // Wait brief moment for DOM render, then spawn floating text
            setTimeout(() => {
                const lostCount = prev - current;
                spawnLeaderboardFloatingText(p.name, `-${lostCount} Tile${lostCount > 1 ? 's' : ''} 💔`);
            }, 50);
        }
    });
    
    renderPlayerRoster();
}

// Render active player roster in the sidebar
function renderPlayerRoster() {
    const rosterEl = document.getElementById('playerRoster');
    if (!rosterEl) return;

    const players = Object.values(activePlayers);

    if (players.length === 0) {
        rosterEl.innerHTML = `<div class="leaderboard-empty" style="font-size: 12px; text-align: center; color: var(--text-muted);">No active players in lobby yet.<br>Send an action to join!</div>`;
        renderLobbyDocks();
        renderLeaderboardDock();
        return;
    }

    // Sort: ON MAP first (descending squaresCount), then Lobby alphabetically
    players.sort((a, b) => {
        if (a.squaresCount !== b.squaresCount) {
            return b.squaresCount - a.squaresCount; // higher count first
        }
        return a.name.localeCompare(b.name);
    });

    rosterEl.innerHTML = players.map(p => {
        const isOnMap = p.squaresCount > 0;
        const isAttacking = p.attacking;
        
        let statusText = isOnMap ? `ON MAP (${p.squaresCount})` : 'LOBBY';
        let badgeClass = isOnMap ? 'on-map' : 'lobby';
        
        if (isAttacking) {
            statusText = 'ATTACKING...';
            badgeClass = 'attacking';
        }
        
        const playerColor = getPlayerColor(p.name);
        const attackingItemClass = isAttacking ? 'attacking' : '';

        return `
            <div class="roster-item ${attackingItemClass}">
                <div class="roster-player-info">
                    <img class="roster-avatar" style="border-color: ${playerColor};" src="${p.avatar}" alt="${p.name}">
                    <span class="roster-name" style="color: ${playerColor};">${p.name}</span>
                </div>
                <span class="roster-status-badge ${badgeClass}">${statusText}</span>
            </div>
        `;
    }).join('');

    renderLobbyDocks();
    renderLeaderboardDock();
}

// Render left lobby dock for off-board active players
function renderLobbyDocks() {
    const lobbyAvatarsEl = document.getElementById('lobbyAvatars');
    if (!lobbyAvatarsEl) return;

    const players = Object.values(activePlayers);
    const offBoard = players.filter(p => p.squaresCount === 0);

    if (offBoard.length === 0) {
        lobbyAvatarsEl.innerHTML = `<div class="dock-empty-slot" title="No players in lobby">+</div>`;
    } else {
        lobbyAvatarsEl.innerHTML = offBoard.map(p => {
            const attackingClass = p.attacking ? 'attacking' : '';
            const playerColor = getPlayerColor(p.name);
            const playerGlow = getPlayerColorGlow(p.name);
            return `
                <div class="dock-avatar-item ${attackingClass}" data-username="${p.name}" style="border-color: ${playerColor}; --owner-color: ${playerColor}; --owner-color-glow: ${playerGlow};" title="${p.name} (Lobby)">
                    <img src="${p.avatar}" alt="${p.name}">
                </div>
            `;
        }).join('');
    }
}

// Render right leaderboard dock for active on-board players
function renderLeaderboardDock() {
    const leaderboardAvatarsEl = document.getElementById('leaderboardAvatars');
    if (!leaderboardAvatarsEl) return;

    const players = Object.values(activePlayers).filter(p => p.squaresCount > 0);
    players.sort((a, b) => b.squaresCount - a.squaresCount);

    if (players.length === 0) {
        leaderboardAvatarsEl.innerHTML = `<div class="dock-empty-slot" title="No players on map">-</div>`;
    } else {
        leaderboardAvatarsEl.innerHTML = players.map((p, index) => {
            const attackingClass = p.attacking ? 'attacking' : '';
            const hurtClass = p.hurt ? 'hurt' : '';
            const playerColor = getPlayerColor(p.name);
            const playerGlow = getPlayerColorGlow(p.name);
            const rankLabel = index === 0 ? '👑' : `#${index + 1}`;
            const percent = ((p.squaresCount / (GRID_SIZE * GRID_SIZE)) * 100).toFixed(1);
            return `
                <div class="leaderboard-row ${attackingClass} ${hurtClass}" data-username="${p.name}" style="--owner-color: ${playerColor}; --owner-color-glow: ${playerGlow};" title="${rankLabel} ${p.name}: ${p.squaresCount} tiles (${percent}%)">
                    <div class="leaderboard-rank">${rankLabel}</div>
                    <div class="leaderboard-avatar-wrap">
                        <img src="${p.avatar}" alt="${p.name}">
                    </div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-name-row">
                            <span class="leaderboard-name">${p.name}</span>
                            <span class="leaderboard-score">${p.squaresCount} (${percent}%)</span>
                        </div>
                        <div class="leaderboard-bar-bg">
                            <div class="leaderboard-bar-fill" style="width: ${percent}%;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Launch flying avatar projectile from lobby dock or owned square
function launchProjectile(user, targetId, callback) {
    const boardEl = document.getElementById('gridBoard');
    if (!boardEl) {
        callback();
        return;
    }

    const square = boardState[targetId];
    if (!square) {
        callback();
        return;
    }

    // Set attacking state to true
    if (activePlayers[user]) {
        activePlayers[user].attacking = true;
        renderPlayerRoster();
    }

    const row = Math.floor(targetId / GRID_SIZE);
    const col = targetId % GRID_SIZE;

    // Calculate center coordinates of target hexagon relative to gridBoard
    const targetX = col * 82 + (row % 2 === 1 ? 41 : 0) + 40 - 16; // X center minus projectile half-width (16px)
    const targetY = row * 69 + 12 + 46 - 16; // Y center minus projectile half-height (16px)

    // Starting positions based on whether player is on map or off map
    let startX, startY;
    const player = activePlayers[user];
    const isOnMap = player && player.squaresCount > 0;

    if (isOnMap) {
        // Find closest owned square
        const ownedSquares = boardState.filter(s => s.ownerName === user);
        let sourceTileId = -1;
        if (ownedSquares.length > 0) {
            let minDistance = Infinity;
            const targetCenterX = col * 82 + (row % 2 === 1 ? 41 : 0) + 40;
            const targetCenterY = row * 69 + 12 + 46;
            ownedSquares.forEach(s => {
                const sRow = Math.floor(s.id / GRID_SIZE);
                const sCol = s.id % GRID_SIZE;
                const sCenterX = sCol * 82 + (sRow % 2 === 1 ? 41 : 0) + 40;
                const sCenterY = sRow * 69 + 12 + 46;
                const dist = Math.hypot(sCenterX - targetCenterX, sCenterY - targetCenterY);
                if (dist < minDistance) {
                    minDistance = dist;
                    sourceTileId = s.id;
                }
            });
        }

        if (sourceTileId !== -1) {
            const sRow = Math.floor(sourceTileId / GRID_SIZE);
            const sCol = sourceTileId % GRID_SIZE;
            startX = sCol * 82 + (sRow % 2 === 1 ? 41 : 0) + 40 - 16;
            startY = sRow * 69 + 12 + 46 - 16;
        } else {
            // Fallback coordinates
            startX = -80;
            startY = 230;
        }
    } else {
        // Off map: launch from Lobby Dock avatar
        const boardRect = boardEl.getBoundingClientRect();
        const avatarEl = document.querySelector(`#lobbyDock .dock-avatar-item[data-username="${user}"]`);

        if (avatarEl) {
            const avatarRect = avatarEl.getBoundingClientRect();
            startX = avatarRect.left - boardRect.left + avatarRect.width / 2 - 16;
            startY = avatarRect.top - boardRect.top + avatarRect.height / 2 - 16;
        } else {
            const dockEl = document.getElementById('lobbyDock');
            if (dockEl) {
                const dockRect = dockEl.getBoundingClientRect();
                startX = dockRect.left - boardRect.left + dockRect.width / 2 - 16;
                startY = dockRect.top - boardRect.top + dockRect.height / 2 - 16;
            } else {
                startX = -80;
                startY = 230;
            }
        }
    }

    // Create projectile div
    const projEl = document.createElement('div');
    projEl.className = `flying-projectile`;
    
    const playerColor = getPlayerColor(user);
    const playerGlow = getPlayerColorGlow(user);
    projEl.style.setProperty('--owner-color', playerColor);
    projEl.style.setProperty('--owner-color-glow', playerGlow);

    const avatarUrl = `https://robohash.org/${encodeURIComponent(user)}?set=set4`;
    projEl.innerHTML = `<img src="${avatarUrl}" alt="${user}">`;

    // Initial position
    projEl.style.left = `${startX}px`;
    projEl.style.top = `${startY}px`;

    boardEl.appendChild(projEl);

    // Force reflow
    void projEl.offsetWidth;

    // Animate to target coordinates
    projEl.classList.add('moving');
    projEl.style.left = `${targetX}px`;
    projEl.style.top = `${targetY}px`;

    // Execute callback and clean up on landing (600ms)
    setTimeout(() => {
        projEl.remove();
        if (activePlayers[user]) {
            activePlayers[user].attacking = false;
            renderPlayerRoster();
        }
        callback();
    }, 600);
}


// ==========================================================================
// Gameplay Mechanics Handlers (All Actions are Randomly Target-based)
// ==========================================================================

// Helper to set owner and profile picture
function setSquareOwner(square, ownerName) {
    square.ownerName = ownerName;
    square.team = (ownerName === 'System') ? 'neutral' : 'owned';
    square.hp = 6;
    square.shield = 0;
    if (ownerName === 'System') {
        square.profilePicUrl = '';
    } else {
        // Use Robohash to generate a cute unique cat avatar for the user
        square.profilePicUrl = `https://robohash.org/${encodeURIComponent(ownerName)}?set=set4`;
    }
}

// Input A: Likes Action (Random Placement / Attack)
function handleRandomLike(user) {
    if (isGameFinished) {
        logActivity("System: The round is finished! Reset the match to play again.", "system");
        return;
    }
    if (isShuffling) {
        logActivity("System: Prizes are currently being shuffled. Wait for match start!", "system");
        return;
    }
    if (!isTimerRunning) {
        logActivity("System: Match is not active. Click 'Start Match' to begin!", "system");
        return;
    }

    const randomIndex = Math.floor(Math.random() * boardState.length);
    const target = boardState[randomIndex];
    updateLastTargetIndicator(randomIndex);

    registerActivePlayer(user);

    launchProjectile(user, randomIndex, () => {
        // Block attacks on immune enemy squares
        const isEnemyOwned = target.ownerName !== 'System' && target.ownerName !== user;
        if (isEnemyOwned && target.immune) {
            logActivity(`🛡️ <b>${user}</b> liked but <b>${target.ownerName}</b>'s square <b>${target.coord}</b> is IMMUNE! (BLOCKED)`, 'shield');
            playSound('shield');
            triggerVisualFX(randomIndex, 'deflected');
            spawnFloatingText(randomIndex, "BLOCKED!", "immune");
            spawnParticles(randomIndex, 'gold');
            renderBoard();
            return;
        }

        const playerColor = getPlayerColor(user);

        if (target.ownerName === 'System') {
            // Claim neutral instantly
            setSquareOwner(target, user);
            logActivity(`👍 <b>${user}</b> liked and randomly claimed neutral square <b>${target.coord}</b>!`, 'like');
            playSound('like');
            triggerVisualFX(randomIndex, 'takeover-flash');
            spawnFloatingText(randomIndex, "CLAIM!", "heal");
            spawnParticles(randomIndex, playerColor);
        } else if (target.ownerName === user) {
            // Fortify own square
            target.hp = Math.min(6, target.hp + 1);
            logActivity(`👍 <b>${user}</b> liked and fortified their own square <b>${target.coord}</b> (+1 HP).`, 'like');
            playSound('like');
            triggerVisualFX(randomIndex, 'takeover-flash');
            spawnFloatingText(randomIndex, "+1 HP", "heal");
            spawnParticles(randomIndex, 'green');
        } else {
            // Attack enemy square
            triggerVisualFX(randomIndex, 'under-attack');
            if (target.shield > 0) {
                target.shield = Math.max(0, target.shield - 1);
                logActivity(`👍 <b>${user}</b> hit <b>${target.ownerName}</b>'s shield on <b>${target.coord}</b> (-1 SHD).`, 'shield');
                playSound('damage');
                spawnFloatingText(randomIndex, "-1 SHD", "damage");
                spawnParticles(randomIndex, playerColor);
            } else {
                target.hp = Math.max(0, target.hp - 1);
                logActivity(`👍 <b>${user}</b> damaged <b>${target.ownerName}</b>'s square <b>${target.coord}</b> (-1 HP).`, 'rose');
                spawnFloatingText(randomIndex, "-1 HP", "damage");
                spawnParticles(randomIndex, playerColor);
                
                if (target.hp <= 0) {
                    const oldOwner = target.ownerName;
                    setSquareOwner(target, user);
                    logActivity(`🚩 Conquered! <b>${target.coord}</b> flips to <b>${user}</b> from <b>${oldOwner}</b>!`, 'nuke');
                    playSound('nuke-cross');
                    triggerVisualFX(randomIndex, 'takeover-flash');
                } else {
                    playSound('damage');
                }
            }
        }
        renderBoard();
    });
}

// Rose Attack donation (Chooses a Random Enemy Square)
function handleRandomDamage(amount, attacker) {
    if (isGameFinished || isShuffling || !isTimerRunning) return;

    const enemySquares = boardState.filter(s => s.ownerName !== 'System' && s.ownerName !== attacker);
    
    if (enemySquares.length === 0) {
        logActivity(`🌹 <b>${attacker}</b> wanted to Rose attack, but there are no enemy owned squares!`, 'rose');
        return;
    }

    const targetId = enemySquares[Math.floor(Math.random() * enemySquares.length)].id;
    const square = boardState[targetId];
    updateLastTargetIndicator(targetId);

    registerActivePlayer(attacker);

    launchProjectile(attacker, targetId, () => {
        // Block attack if square is immune
        if (square.immune) {
            logActivity(`🛡️ <b>${attacker}</b> sent a Rose but <b>${square.ownerName}</b>'s square <b>${square.coord}</b> is IMMUNE! (BLOCKED)`, 'shield');
            playSound('shield');
            triggerVisualFX(targetId, 'deflected');
            spawnFloatingText(targetId, "BLOCKED!", "immune");
            spawnParticles(targetId, 'gold');
            renderBoard();
            return;
        }
        
        const playerColor = getPlayerColor(attacker);
        triggerVisualFX(targetId, 'under-attack');
        
        if (square.shield > 0) {
            square.shield = Math.max(0, square.shield - amount);
            logActivity(`🌹 <b>${attacker}</b> sent a Rose and hit <b>${square.ownerName}</b>'s shield on <b>${square.coord}</b> (-${amount})!`, 'shield');
            playSound('damage');
            spawnFloatingText(targetId, `-${amount} SHD`, "damage");
            spawnParticles(targetId, playerColor);
        } else {
            square.hp = Math.max(0, square.hp - amount);
            logActivity(`🌹 <b>${attacker}</b> sent a Rose and dealt <b>${amount} dmg</b> to <b>${square.ownerName}</b>'s square <b>${square.coord}</b>!`, 'rose');
            spawnFloatingText(targetId, `-${amount} HP`, "damage");
            spawnParticles(targetId, playerColor);
            
            if (square.hp <= 0) {
                claimSingleSquare(targetId, attacker);
            } else {
                playSound('damage');
            }
        }
        renderBoard();
    });
}

// Boost Shield donation (Chooses a Random Owned Square)
function handleRandomShield(amount, user) {
    if (isGameFinished || isShuffling || !isTimerRunning) return;

    // Prioritize owned squares that are NOT already immune
    const ownedSquares = boardState.filter(s => s.ownerName === user && !s.immune);
    
    let targetId;
    if (ownedSquares.length === 0) {
        const allOwned = boardState.filter(s => s.ownerName === user);
        if (allOwned.length === 0) {
            logActivity(`System: <b>${user}</b> tried to shield, but owns no squares!`, 'system');
            return;
        }
        targetId = allOwned[Math.floor(Math.random() * allOwned.length)].id;
    } else {
        targetId = ownedSquares[Math.floor(Math.random() * ownedSquares.length)].id;
    }

    const square = boardState[targetId];
    updateLastTargetIndicator(targetId);

    registerActivePlayer(user);

    launchProjectile(user, targetId, () => {
        if (square.immune) {
            // Refresh immunity timer to 60s
            square.immuneTimeLeft = 60;
            logActivity(`💖 <b>${user}</b> refreshed IMMUNITY timer on square <b>${square.coord}</b>!`, 'shield');
            playSound('shield');
            triggerVisualFX(targetId, 'takeover-flash');
            spawnFloatingText(targetId, "REFRESH", "immune");
            spawnParticles(targetId, 'gold');
            renderBoard();
            return;
        }

        // Upgrade shield
        square.shield = Math.min(6, square.shield + amount);
        
        if (square.shield >= 6) {
            square.immune = true;
            square.immuneTimeLeft = 60;
            logActivity(`👑 <b>SUPERCHARGE!</b> Square <b>${square.coord}</b> has achieved a FULL shield rotation and is now <b>IMMUNE for 60 seconds</b>!`, 'nuke');
            playSound('shield');
            triggerVisualFX(targetId, 'takeover-flash');
            spawnFloatingText(targetId, "IMMUNE!", "immune");
            spawnParticles(targetId, 'gold');
            triggerHypeAlert("IMMUNITY TRIGGERED!", `Square ${square.coord} is now IMMUNE for 60s!`, "👑", false);
        } else {
            logActivity(`💖 <b>${user}</b> boosted owned square <b>${square.coord}</b> (+${amount} Shield)!`, 'shield');
            playSound('shield');
            triggerVisualFX(targetId, 'takeover-flash');
            spawnFloatingText(targetId, `+${amount} SHD`, "shield");
            spawnParticles(targetId, 'cyan');
        }
        renderBoard();
    });
}

// Helper to overwrite a single square
function claimSingleSquare(squareId, user) {
    const square = boardState[squareId];
    if (!square) return;

    // Block takeover if the square is immune and owned by another player
    if (square.immune && square.ownerName !== 'System' && square.ownerName !== user) {
        logActivity(`🛡️ center/impact hit <b>${square.coord}</b> but it is IMMUNE! (BLOCKED)`, 'shield');
        playSound('shield');
        triggerVisualFX(squareId, 'deflected');
        spawnFloatingText(squareId, "BLOCKED!", "immune");
        spawnParticles(squareId, 'gold');
        return;
    }

    const oldOwner = square.ownerName;
    setSquareOwner(square, user);
    
    const playerColor = getPlayerColor(user);
    if (oldOwner !== 'System') {
        logActivity(`🚩 <b>${square.coord}</b> conquered from <b>${oldOwner}</b> by <span style="color: ${playerColor}"><b>${user}</b></span>!`, 'nuke');
    } else {
        logActivity(`🚩 <b>${square.coord}</b> claimed by <span style="color: ${playerColor}"><b>${user}</b></span>!`, 'nuke');
    }
    
    triggerVisualFX(squareId, 'takeover-flash');
    spawnFloatingText(squareId, oldOwner !== 'System' ? "CONQUERED!" : "CLAIMED!", "heal");
    spawnParticles(squareId, playerColor);
    spawnParticles(squareId, 'gold'); // dual sparks for capture!
}

// ==========================================================================
// DIFFERENT LAYER OF NUKES (All target randomly)
// ==========================================================================

// Layer 1: Cross Nuke (Bolt - Cost: 10 Coins)
function launchCrossNuke(user) {
    if (isGameFinished) {
        logActivity("System: Round is finished! Reset match to trigger nukes.", "system");
        return;
    }
    if (isShuffling) {
        logActivity("System: Prizes are shuffling. Wait for match start!", "system");
        return;
    }
    if (!isTimerRunning) {
        logActivity("System: Match not active. Start match to fire nukes!", "system");
        return;
    }

    const targetId = Math.floor(Math.random() * boardState.length);
    const target = boardState[targetId];
    updateLastTargetIndicator(targetId);

    registerActivePlayer(user);

    launchProjectile(user, targetId, () => {
        playSound('nuke-cross');
        logActivity(`⚡ <b>${user}</b> sent a TikTok Bolt, launching a <b>Cross Nuke</b> centered at <b>${target.coord}</b>!`, 'nuke');

        const col = targetId % GRID_SIZE;
        const row = Math.floor(targetId / GRID_SIZE);

        const coordinates = [
            { r: row, c: col },       // Center
            { r: row - 1, c: col },   // Up
            { r: row + 1, c: col },   // Down
            { r: row, c: col - 1 },   // Left
            { r: row, c: col + 1 }    // Right
        ];

        coordinates.forEach(coord => {
            if (coord.r >= 0 && coord.r < GRID_SIZE && coord.c >= 0 && coord.c < GRID_SIZE) {
                const id = coord.r * GRID_SIZE + coord.c;
                claimSingleSquare(id, user);
            }
        });

        renderBoard();
    });
}

// Layer 2: Area Nuke (Bomb - Cost: 30 Coins)
function launchAreaNuke(user) {
    if (isGameFinished) {
        logActivity("System: Round is finished! Reset match to trigger nukes.", "system");
        return;
    }
    if (isShuffling) {
        logActivity("System: Prizes are shuffling. Wait for match start!", "system");
        return;
    }
    if (!isTimerRunning) {
        logActivity("System: Match not active. Start match to fire nukes!", "system");
        return;
    }

    const targetId = Math.floor(Math.random() * boardState.length);
    const target = boardState[targetId];
    updateLastTargetIndicator(targetId);

    registerActivePlayer(user);

    launchProjectile(user, targetId, () => {
        playSound('nuke-area');
        logActivity(`💥 <b>${user}</b> sent a Bomb, launching a <b>3x3 Area Nuke</b> centered on <b>${target.coord}</b>!`, 'nuke');

        const col = targetId % GRID_SIZE;
        const row = Math.floor(targetId / GRID_SIZE);

        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                    const id = r * GRID_SIZE + c;
                    claimSingleSquare(id, user);
                }
            }
        }

        renderBoard();
    });
}

// Layer 3: Laser Column/Row Nuke (Rocket - Cost: 99 Coins)
function launchLaserNuke(user) {
    if (isGameFinished) {
        logActivity("System: Round is finished! Reset match to trigger nukes.", "system");
        return;
    }
    if (isShuffling) {
        logActivity("System: Prizes are shuffling. Wait for match start!", "system");
        return;
    }
    if (!isTimerRunning) {
        logActivity("System: Match not active. Start match to fire nukes!", "system");
        return;
    }

    const targetId = Math.floor(Math.random() * boardState.length);
    const target = boardState[targetId];
    updateLastTargetIndicator(targetId);

    registerActivePlayer(user);

    launchProjectile(user, targetId, () => {
        playSound('nuke-laser');
        logActivity(`🚀 <b>${user}</b> sent a Rocket, firing a <b>Row & Column Laser</b> centered on <b>${target.coord}</b>!`, 'nuke');
        triggerHypeAlert("LASER SWEEP!", `${user} launched a Row & Column Rocket!`, "🚀", false);

        const col = targetId % GRID_SIZE;
        const row = Math.floor(targetId / GRID_SIZE);

        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const c = i % GRID_SIZE;
            const r = Math.floor(i / GRID_SIZE);
            
            if (c === col || r === row) {
                claimSingleSquare(i, user);
            }
        }

        renderBoard();
    });
}

// Layer 4: Mega Galaxy Nuke (Galaxy - Cost: 500 Coins)
function launchMegaNuke(user) {
    if (isGameFinished) {
        logActivity("System: Round is finished! Reset match to trigger nukes.", "system");
        return;
    }
    if (isShuffling) {
        logActivity("System: Prizes are shuffling. Wait for match start!", "system");
        return;
    }
    if (!isTimerRunning) {
        logActivity("System: Match not active. Start match to fire nukes!", "system");
        return;
    }

    const targetId = Math.floor(Math.random() * boardState.length);
    const target = boardState[targetId];
    updateLastTargetIndicator(targetId);

    registerActivePlayer(user);

    launchProjectile(user, targetId, () => {
        playSound('nuke-mega');
        logActivity(`🌌 <b>${user}</b> sent a Universe, launching a massive <b>5x5 Galaxy Nuke</b> centered at <b>${target.coord}</b>!`, 'nuke');
        triggerHypeAlert("GALAXY NUKE!", `${user} sent a UNIVERSE: 5x5 explosion!`, "🌌", true);

        const col = targetId % GRID_SIZE;
        const row = Math.floor(targetId / GRID_SIZE);

        for (let r = row - 2; r <= row + 2; r++) {
            for (let c = col - 2; c <= col + 2; c++) {
                if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                    const id = r * GRID_SIZE + c;
                    claimSingleSquare(id, user);
                }
            }
        }

        renderBoard();
    });
}

// ==========================================================================
// Hype Stream Alerts (Monetization Alert Banners & Full Screen VFX)
// ==========================================================================
let hypeTimeout = null;
function triggerHypeAlert(title, subtitle, emoji, isMega = false) {
    const overlay = document.getElementById('hypeAlert');
    const titleEl = document.getElementById('hypeTitle');
    const subEl = document.getElementById('hypeSubtitle');
    const emojiEl = document.getElementById('hypeEmoji');
    
    if (!overlay || !titleEl || !subEl || !emojiEl) return;
    
    titleEl.textContent = title;
    subEl.textContent = subtitle;
    emojiEl.textContent = emoji;
    
    overlay.classList.remove('active');
    void overlay.offsetWidth; // Reflow
    overlay.classList.add('active');
    
    if (isMega) {
        // Trigger full screen shake
        const container = document.querySelector('.game-container');
        if (container) {
            container.classList.remove('shake-screen');
            void container.offsetWidth;
            container.classList.add('shake-screen');
        }
        
        // Trigger screen background flash
        const arena = document.querySelector('.grid-arena-container');
        if (arena) {
            arena.classList.remove('flash-screen');
            void arena.offsetWidth;
            arena.classList.add('flash-screen');
        }
    }
    
    if (hypeTimeout) clearTimeout(hypeTimeout);
    hypeTimeout = setTimeout(() => {
        overlay.classList.remove('active');
    }, 3000);
}

// ==========================================================================
// Auto-Simulation Stream Mode (Demo)
// ==========================================================================
let autoSimInterval = null;
const BOT_VIEWERS = [
    "Blue_Wave", "Aqua_Knight", "Frost_Byte", "Cobalt_Rex", "Ocean_Eye",
    "Sky_Shield", "Hex_Blue", "Tidal_Wave", "Red_Fury", "Ruby_Fyre",
    "Crimson_Claw", "Blaze_Star", "Scarlet_Viper", "Magma_Lord", "Hex_Red",
    "Cosmic_Ember", "Shadow_Ninja", "Gold_Striker", "Storm_Bringer", "Nexus_Prime"
];

function startAutoSimulation() {
    if (autoSimInterval) return;
    
    autoSimInterval = setInterval(() => {
        if (isGameFinished || isShuffling || !isTimerRunning) return;
        const viewer = BOT_VIEWERS[Math.floor(Math.random() * BOT_VIEWERS.length)];
        const roll = Math.random();
        
        if (roll < 0.70) {
            // 70% chance: Like
            handleRandomLike(viewer);
        } else if (roll < 0.85) {
            // 15% chance: Rose (Damage)
            handleRandomDamage(2, viewer);
        } else if (roll < 0.94) {
            // 9% chance: Shield
            handleRandomShield(2, viewer);
        } else {
            // 6% chance: Nuke
            const nukeRoll = Math.random();
            if (nukeRoll < 0.45) {
                // Cross Nuke
                launchCrossNuke(viewer);
            } else if (nukeRoll < 0.75) {
                // Area Nuke
                launchAreaNuke(viewer);
            } else if (nukeRoll < 0.93) {
                // Laser Nuke
                launchLaserNuke(viewer);
            } else {
                // Galaxy Nuke!
                launchMegaNuke(viewer);
            }
        }
    }, 850); // Execute every 850ms for nice readable pace
}

function stopAutoSimulation() {
    if (autoSimInterval) {
        clearInterval(autoSimInterval);
        autoSimInterval = null;
    }
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('matchTimer');
    if (!timerEl) return;

    const mins = Math.floor(matchTimeLeft / 60);
    const secs = matchTimeLeft % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    timerEl.textContent = formatted;

    if (matchTimeLeft <= 10 && matchTimeLeft > 0) {
        timerEl.classList.add('urgent');
    } else {
        timerEl.classList.remove('urgent');
    }
}
function startMatchTimer() {
    if (isTimerRunning || isGameFinished || isShuffling) return;
    initAudio();

    // 1. Enter shuffling & preview state
    isShuffling = true;
    updateTimerControlButtons();

    // 2. Hide all board tiles initially (neutral grey, no revealed prizes)
    boardState.forEach(s => {
        s.revealed = false;
        s.isShuffling = false;
        s.prize = null;
    });
    renderBoard();

    // 3. Determine the prize count and build active prize pool
    const prizeCountInput = document.getElementById('matchPrizesCountInput');
    let count = 10;
    if (prizeCountInput) {
        count = parseInt(prizeCountInput.value) || 10;
        count = Math.max(1, Math.min(36, count));
    }
    activePrizePool = buildActivePrizePool(count);
    
    // Choose count random unique tile indices to receive prizes
    const allIndices = Array.from({ length: boardState.length }, (_, idx) => idx);
    shuffleArray(allIndices);
    const targetTileIndices = allIndices.slice(0, count);

    // Populate showcase shelf with active prize pool
    renderShowcaseShelf(activePrizePool);
    
    // Smoothly show the showcase shelf
    const shelfEl = document.getElementById('prizeShowcaseShelf');
    if (shelfEl) {
        shelfEl.style.opacity = '1';
        shelfEl.style.transform = 'translateY(0)';
    }

    // Update UI to show showcase preview
    const labelEl = document.querySelector('.timer-label');
    if (labelEl) labelEl.textContent = "🔮 INITIAL PRIZES POOL";
    logActivity(`🔮 <b>SHOWCASE:</b> Take a look at this round's ${count} prizes! Dropping in 2.5s...`, "system");
    playSound('shield'); // play reveal-like sound

    // 4. Start visual dropping ceremony after 2.5 seconds showcase
    shuffleTimeout1 = setTimeout(() => {
        if (!isShuffling) return;

        if (labelEl) labelEl.textContent = "🎲 RAINING PRIZES...";
        logActivity("🎲 Cascading prizes down onto the hexagons...", "system");

        const boardEl = document.getElementById('gridBoard');

        // Helper to swap coordinates of all hexagons and add physical offsets
        function shuffleVisualPositions() {
            const indices = Array.from({ length: boardState.length }, (_, idx) => idx);
            shuffleArray(indices);
            boardState.forEach((s, idx) => {
                s.visualIndex = indices[idx];
                // Add a small random physical offset (e.g. -15px to +15px) to make it look even more chaotic
                s.offsetX = (Math.random() - 0.5) * 20;
                s.offsetY = (Math.random() - 0.5) * 20;
            });
            renderBoard();
        }

        // Start wiggling the whole board immediately
        boardState.forEach(s => {
            s.isShuffling = true;
        });

        // Immediately start swirling positions
        shuffleVisualPositions();
        positionShuffleInterval = setInterval(shuffleVisualPositions, 350);

        // Slot machine rolling effect loop (updates tiles that have landed)
        let tickCount = 0;
        shuffleInterval = setInterval(() => {
            if (!isShuffling) {
                clearInterval(shuffleInterval);
                shuffleInterval = null;
                return;
            }
            tickCount++;

            // Randomize icons of currently shuffling tiles in the DOM
            boardState.forEach(s => {
                if (s.isShuffling) {
                    const sqEl = document.getElementById(`square-${s.id}`);
                    if (sqEl) {
                        const badgeEl = sqEl.querySelector('.prize-badge');
                        if (badgeEl) {
                            const randomPrize = activePrizePool[Math.floor(Math.random() * activePrizePool.length)];
                            badgeEl.innerHTML = renderPrizeIcon(randomPrize.icon);
                        }
                    }
                }
            });
        }, 60);

        // Staggered launch of dropping projectiles (N active prizes)
        let launchedCount = 0;
        const dropTravelTime = 300; // ms for the flight (snappy zip down)

        function launchNextDrop() {
            if (!isShuffling) return;

            if (launchedCount < count) {
                const i = launchedCount;
                const tileIdx = targetTileIndices[i];
                const square = boardState[tileIdx];
                const prize = activePrizePool[i];

                // Find elements
                const showcaseItem = document.getElementById(`showcase-item-${i}`);
                
                let startX = 270 - 16;
                let startY = -45;
                if (showcaseItem && boardEl) {
                    const itemRect = showcaseItem.getBoundingClientRect();
                    const boardRect = boardEl.getBoundingClientRect();
                    startX = itemRect.left - boardRect.left + itemRect.width / 2 - 16;
                    startY = itemRect.top - boardRect.top + itemRect.height / 2 - 16;
                }

                // Calculate target position in hex grid relative to #gridBoard based on its current visual index and chaotic offset
                const targetSquare = boardState[tileIdx];
                const visualIdx = targetSquare.visualIndex !== undefined ? targetSquare.visualIndex : targetSquare.id;
                const visualRow = Math.floor(visualIdx / GRID_SIZE);
                const visualCol = visualIdx % GRID_SIZE;
                let destX = visualCol * 82 + (visualRow % 2 === 1 ? 41 : 0) + 40 - 16;
                let destY = visualRow * 69 + 12 + 46 - 16;
                if (targetSquare.isShuffling) {
                    destX += targetSquare.offsetX || 0;
                    destY += targetSquare.offsetY || 0;
                }

                // Create dropping projectile element
                const proj = document.createElement('div');
                proj.className = 'dropping-prize';
                proj.innerHTML = renderPrizeIcon(prize.icon);

                // Color-code the projectile border/glow based on rarity
                let prizeColor = 'rgba(255,255,255,0.4)';
                let prizeGlow = 'rgba(255,255,255,0.2)';
                if (prize.type === 'jackpot') { 
                    prizeColor = 'var(--coin-gold)'; 
                    prizeGlow = 'rgba(245, 158, 11, 0.7)'; 
                } else if (prize.type === 'major') { 
                    prizeColor = '#a855f7'; 
                    prizeGlow = 'rgba(168, 85, 247, 0.7)'; 
                } else if (prize.type === 'special') { 
                    prizeColor = '#3b82f6'; 
                    prizeGlow = 'rgba(59, 130, 246, 0.7)'; 
                }
                proj.style.setProperty('--prize-color', prizeColor);
                proj.style.setProperty('--prize-glow', prizeGlow);

                // Initial position
                proj.style.left = `${startX}px`;
                proj.style.top = `${startY}px`;
                proj.style.transform = 'scale(0.8)';
                boardEl.appendChild(proj);

                // Fade out showcase item slot
                if (showcaseItem) showcaseItem.classList.add('flying');

                // Force layout reflow
                void proj.offsetWidth;

                // Animate to target cell coordinates
                proj.style.left = `${destX}px`;
                proj.style.top = `${destY}px`;
                proj.style.transform = 'scale(1.2) rotate(360deg)';

                // Staggered beep sound during cascading rain
                if (i % 2 === 0) {
                    playSound('like');
                }

                // Handle impact when projectile lands after 300ms
                setTimeout(() => {
                    if (!isShuffling) {
                        proj.remove();
                        return;
                    }
                    proj.remove();

                    // Settle tile temporary prize
                    square.prize = prize;
                    square.revealed = false; // keep it flat/mystery during shuffle
                    square.isShuffling = true;
                    
                    playSound('like');
                    spawnParticles(tileIdx, prizeColor);
                    renderBoard();
                }, dropTravelTime);

                launchedCount++;
                // Launch next drop after 40ms stagger
                shuffleTimeout1 = setTimeout(launchNextDrop, 40);
            } else {
                // All items launched! Wait for the last one to land (300ms) + cycle for another 1400ms
                shuffleTimeout2 = setTimeout(() => {
                    if (!isShuffling) return;

                    // Transition to final randomized positions
                    clearInterval(shuffleInterval);
                    shuffleInterval = null;
                    if (positionShuffleInterval) {
                        clearInterval(positionShuffleInterval);
                        positionShuffleInterval = null;
                    }

                    // Reset all visualIndex back to s.id so they slide home, clear offsets, and stop wiggles
                    boardState.forEach(s => {
                        s.visualIndex = s.id;
                        s.isShuffling = false;
                        s.offsetX = 0;
                        s.offsetY = 0;
                    });

                    // Choose the final target indices where prizes will rest
                    const allIndices = Array.from({ length: boardState.length }, (_, idx) => idx);
                    shuffleArray(allIndices);
                    const finalTargetTileIndices = allIndices.slice(0, count);

                    // Clear board prizes and assign final shuffled prizes to finalTargetTileIndices
                    boardState.forEach(s => s.prize = null);
                    const finalShuffledPrizes = shuffleArray([...activePrizePool]);
                    
                    for (let k = 0; k < finalTargetTileIndices.length; k++) {
                        const tIdx = finalTargetTileIndices[k];
                        boardState[tIdx].prize = finalShuffledPrizes[k];
                        boardState[tIdx].revealed = true;
                    }
                    renderBoard();

                    if (labelEl) labelEl.textContent = "🧠 MEMORIZE POSITIONS!";
                    logActivity("🔮 <b>MEMORIZE:</b> Look closely! Prizes hiding in 2 seconds...", "system");
                    playSound('shield');

                    // Stagger hide sweep after 2.0s
                    shuffleTimeout3 = setTimeout(() => {
                        if (!isShuffling) return;

                        if (shelfEl) {
                            shelfEl.style.opacity = '0.3';
                        }

                        if (labelEl) labelEl.textContent = "🎲 HIDING PRIZES...";
                        logActivity("🎲 Hiding the prizes face-down...", "system");

                        let sweepIdx = 0;
                        const staggerTime = 25; // ms per tile
                        
                        function hideNextTile() {
                            if (!isShuffling) return;

                            if (sweepIdx < finalTargetTileIndices.length) {
                                const tIdx = finalTargetTileIndices[sweepIdx];
                                const square = boardState[tIdx];
                                square.revealed = false;
                                
                                triggerVisualFX(tIdx, 'reveal-flip');
                                
                                if (sweepIdx % 3 === 0) {
                                    playSound('like');
                                }
                                
                                renderBoard();
                                sweepIdx++;
                                shuffleTimeout3 = setTimeout(hideNextTile, staggerTime);
                            } else {
                                // Done hiding! Now start the actual countdown timer
                                isShuffling = false;
                                isTimerRunning = true;
                                updateTimerControlButtons();
                                if (labelEl) labelEl.textContent = "MATCH TIME REMAINING";
                                logActivity("👍 <b>MATCH ACTIVE!</b> The prizes are hidden. Start liking and attacking to conquer them!", "system");
                                playSound('nuke-cross'); // start signal

                                matchTimerInterval = setInterval(() => {
                                    if (matchTimeLeft > 0) {
                                        matchTimeLeft--;
                                        updateTimerDisplay();
                                        
                                        if (matchTimeLeft <= 5 && matchTimeLeft > 0) {
                                            playSound('like'); // quick beep
                                        }
                                    } else {
                                        clearInterval(matchTimerInterval);
                                        matchTimerInterval = null;
                                        endMatchAndReveal();
                                    }
                                }, 1000);
                            }
                        }

                        hideNextTile();
                    }, 2000);
                }, dropTravelTime + 1200);
            }
        }

        launchNextDrop();
    }, 2500);
}

function pauseMatchTimer() {
    if (!isTimerRunning) return;
    clearInterval(matchTimerInterval);
    matchTimerInterval = null;
    isTimerRunning = false;
    updateTimerControlButtons();
    logActivity("System: Match paused.", "system");
}

function resetMatch() {
    if (matchTimerInterval) {
        clearInterval(matchTimerInterval);
        matchTimerInterval = null;
    }
    if (shuffleInterval) {
        clearInterval(shuffleInterval);
        shuffleInterval = null;
    }
    if (positionShuffleInterval) {
        clearInterval(positionShuffleInterval);
        positionShuffleInterval = null;
    }
    if (shuffleTimeout1) {
        clearTimeout(shuffleTimeout1);
        shuffleTimeout1 = null;
    }
    if (shuffleTimeout2) {
        clearTimeout(shuffleTimeout2);
        shuffleTimeout2 = null;
    }
    if (shuffleTimeout3) {
        clearTimeout(shuffleTimeout3);
        shuffleTimeout3 = null;
    }
    if (shuffleTimeout4) {
        clearTimeout(shuffleTimeout4);
        shuffleTimeout4 = null;
    }
    isTimerRunning = false;
    isGameFinished = false;
    isShuffling = false;
    isVisualShuffling = false;
    
    const selectEl = document.getElementById('matchDurationSelect');
    if (selectEl) {
        matchDuration = parseInt(selectEl.value) || 180;
    }
    matchTimeLeft = matchDuration;
    
    // Reset board state
    initBoard();
    
    // Clear dropping projectiles
    const droppings = document.querySelectorAll('#gridBoard .dropping-prize');
    droppings.forEach(d => d.remove());

    // Reset shelf state
    renderShowcaseShelf(activePrizePool);
    const shelfEl = document.getElementById('prizeShowcaseShelf');
    if (shelfEl) {
        shelfEl.style.opacity = '1';
        shelfEl.style.transform = 'translateY(0)';
    }
    
    // Reset active player attacking state
    Object.values(activePlayers).forEach(p => {
        p.attacking = false;
        p.hurt = false;
        p.squaresCount = 0;
    });

    const labelEl = document.querySelector('.timer-label');
    if (labelEl) labelEl.textContent = "MATCH TIME REMAINING";

    updateTimerDisplay();
    updateTimerControlButtons();
    
    // Hide reveal modal
    const modal = document.getElementById('revealModal');
    if (modal) {
        modal.classList.remove('active');
    }

    logActivity("System: Match reset. All tiles returned to neutral, prizes reshuffled.", "system");
    renderBoard();
}

function updateTimerControlButtons() {
    const startBtn = document.getElementById('btnStartMatch');
    const pauseBtn = document.getElementById('btnPauseMatch');
    
    if (startBtn) {
        startBtn.disabled = isTimerRunning || isGameFinished;
        startBtn.style.opacity = (isTimerRunning || isGameFinished) ? '0.5' : '1';
    }
    if (pauseBtn) {
        pauseBtn.disabled = !isTimerRunning;
        pauseBtn.style.opacity = !isTimerRunning ? '0.5' : '1';
        pauseBtn.textContent = isTimerRunning ? 'Pause' : 'Paused';
    }
}

function endMatchAndReveal() {
    isTimerRunning = false;
    isGameFinished = true;
    updateTimerControlButtons();
    
    logActivity("⌛ <b>TIME OVER!</b> The battle is finished! Revealing the mystery prizes...", "system");
    playSound('nuke-mega'); // play grand sound

    // Stop autoplay bot simulation checkbox visually if checked
    const toggleSim = document.getElementById('autoSimToggle');
    if (toggleSim && toggleSim.checked) {
        toggleSim.checked = false;
        stopAutoSimulation();
    }

    // Filter to only tiles that actually contain a prize
    const prizeTiles = boardState.filter(s => s.prize !== null);
    let revealIdx = 0;
    const staggerTime = 40; // ms per tile
    
    function revealNextTile() {
        if (!isGameFinished) return; // guard against reset while revealing

        if (revealIdx < prizeTiles.length) {
            const square = prizeTiles[revealIdx];
            square.revealed = true;
            
            // Visual feedback: flip animation and hit particles in player color if owned
            triggerVisualFX(square.id, 'takeover-flash');
            if (square.ownerName !== 'System') {
                const color = getPlayerColor(square.ownerName);
                spawnParticles(square.id, color);
            } else {
                spawnParticles(square.id, 'gold');
            }
            
            playSound('like');
            renderBoard();
            
            revealIdx++;
            setTimeout(revealNextTile, staggerTime);
        } else {
            // Reveal finished! Trigger winners list modal
            setTimeout(showWinnersSummary, 800);
        }
    }
    
    if (prizeTiles.length > 0) {
        revealNextTile();
    } else {
        setTimeout(showWinnersSummary, 800);
    }
}

function showWinnersSummary() {
    const listEl = document.getElementById('winnersList');
    if (!listEl) return;

    // Aggregate prizes owned by each player
    const playerPrizes = {};
    let jackpotWinner = null;

    boardState.forEach(s => {
        if (s.ownerName !== 'System') {
            if (!playerPrizes[s.ownerName]) {
                playerPrizes[s.ownerName] = {
                    name: s.ownerName,
                    avatar: s.profilePicUrl || `https://robohash.org/${encodeURIComponent(s.ownerName)}?set=set4`,
                    prizes: []
                };
            }
            if (s.prize) {
                playerPrizes[s.ownerName].prizes.push(s.prize);
                if (s.prize.type === 'jackpot') {
                    jackpotWinner = s.ownerName;
                }
            }
        }
    });

    const winnersArray = Object.values(playerPrizes).filter(w => w.prizes.length > 0);
    winnersArray.sort((a, b) => {
        const aHasJackpot = a.prizes.some(p => p.type === 'jackpot');
        const bHasJackpot = b.prizes.some(p => p.type === 'jackpot');
        if (aHasJackpot) return -1;
        if (bHasJackpot) return 1;
        return b.prizes.length - a.prizes.length;
    });

    if (winnersArray.length === 0) {
        listEl.innerHTML = `<div class="no-winners-msg">No tiles were conquered! The prizes remain hidden.</div>`;
    } else {
        listEl.innerHTML = winnersArray.map(w => {
            const playerColor = getPlayerColor(w.name);
            const playerGlow = getPlayerColorGlow(w.name);
            
            const countMap = {};
            w.prizes.forEach(p => {
                countMap[p.name] = (countMap[p.name] || 0) + 1;
            });
            
            const prizeItemsHtml = Object.entries(countMap).map(([name, count]) => {
                const isJackpot = name.includes('PS5');
                const badgeClass = isJackpot ? 'winner-prize-item jackpot' : 'winner-prize-item';
                return `<div class="${badgeClass}">${count}x ${name}</div>`;
            }).join('');

            return `
                <div class="winner-row-card" style="--owner-color: ${playerColor}; --owner-color-glow: ${playerGlow};">
                    <div class="winner-player-info">
                        <img class="winner-avatar" src="${w.avatar}" alt="${w.name}">
                        <span class="winner-name" style="color: ${playerColor};">${w.name}</span>
                    </div>
                    <div class="winner-prizes-list">
                        ${prizeItemsHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    const modal = document.getElementById('revealModal');
    if (modal) {
        modal.classList.add('active');
    }

    if (jackpotWinner) {
        playSound('nuke-mega');
        triggerHypeAlert("PS5 JACKPOT WON! 👑", `${jackpotWinner} conquered the PS5 mystery tile!`, "👑", true);
    } else {
        playSound('shield');
    }
}

// ==========================================================================
// Event Listeners Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initBoard();
    renderBoard();
    renderShowcaseShelf(activePrizePool);

    // Initialize Match Controls
    updateTimerDisplay();
    updateTimerControlButtons();

    document.getElementById('btnStartMatch').addEventListener('click', startMatchTimer);
    document.getElementById('btnPauseMatch').addEventListener('click', pauseMatchTimer);
    document.getElementById('btnResetMatch').addEventListener('click', resetMatch);
    
    document.getElementById('matchDurationSelect').addEventListener('change', (e) => {
        if (!isTimerRunning && !isGameFinished) {
            matchDuration = parseInt(e.target.value) || 180;
            matchTimeLeft = matchDuration;
            updateTimerDisplay();
        }
    });

    const prizeCountInput = document.getElementById('matchPrizesCountInput');
    if (prizeCountInput) {
        prizeCountInput.addEventListener('input', (e) => {
            if (!isTimerRunning && !isGameFinished && !isShuffling) {
                let count = parseInt(e.target.value) || 10;
                count = Math.max(1, Math.min(36, count));
                activePrizePool = buildActivePrizePool(count);
                renderShowcaseShelf(activePrizePool);
                shufflePrizes();
                renderBoard();
            }
        });
    }

    document.getElementById('btnCloseModal').addEventListener('click', () => {
        resetMatch();
    });

    // 1. Likes Action Handler (Input A - Random Placement)
    document.getElementById('actionLike').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        handleRandomLike(user);
    });

    // 2. Target Attack & Shield Boost Handlers (No click coordinate dependencies anymore!)
    document.getElementById('actionRose').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        handleRandomDamage(2, user); // deals 2 damage to random enemy square
    });

    document.getElementById('actionShield').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        handleRandomShield(6, user); // boosts shield on random owned square
    });

    // 3. Different Layers of Nukes (All target randomly)
    document.getElementById('actionCrossNuke').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        launchCrossNuke(user);
    });

    document.getElementById('actionAreaNuke').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        launchAreaNuke(user);
    });

    document.getElementById('actionLaserNuke').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        launchLaserNuke(user);
    });

    document.getElementById('actionMegaNuke').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        launchMegaNuke(user);
    });

    // 4. Auto-Simulate Toggle Config
    const toggleSim = document.getElementById('autoSimToggle');
    if (toggleSim) {
        toggleSim.addEventListener('change', () => {
            initAudio();
            if (toggleSim.checked) {
                logActivity("System: Stream Auto-Simulation started! Watch the bots clash.", "system");
                startAutoSimulation();
            } else {
                logActivity("System: Stream Auto-Simulation stopped.", "system");
                stopAutoSimulation();
            }
        });
    }

    // 5. Cleanup animation classes
    const container = document.querySelector('.game-container');
    if (container) {
        container.addEventListener('animationend', (e) => {
            if (e.target.classList.contains('shake-screen')) {
                e.target.classList.remove('shake-screen');
            }
        });
    }

    const arena = document.querySelector('.grid-arena-container');
    if (arena) {
        arena.addEventListener('animationend', (e) => {
            if (e.target.classList.contains('flash-screen')) {
                e.target.classList.remove('flash-screen');
            }
        });
    }

    // Cleanup hurt class on leaderboard rows after animation finishes
    const lbAvatars = document.getElementById('leaderboardAvatars');
    if (lbAvatars) {
        lbAvatars.addEventListener('animationend', (e) => {
            const row = e.target.closest('.leaderboard-row');
            if (row) {
                const username = row.dataset.username;
                if (username && activePlayers[username]) {
                    activePlayers[username].hurt = false;
                    row.classList.remove('hurt');
                }
            }
        });
    }

    // 6. Immunity Countdown Timer Loop (Ticks every 100ms for smooth visuals)
    setInterval(() => {
        let changed = false;
        boardState.forEach(s => {
            if (s.immuneTimeLeft > 0) {
                s.immuneTimeLeft -= 0.1;
                if (s.immuneTimeLeft <= 0) {
                    s.immuneTimeLeft = 0;
                    s.immune = false;
                    s.shield = 0;
                    logActivity(`🛡️ Immunity expired on square <b>${s.coord}</b>!`, 'system');
                    playSound('damage'); // play deflect break/expire sound
                    spawnFloatingText(s.id, "EXPIRED", "damage");
                    spawnParticles(s.id, 'red');
                }
                changed = true;
            }
        });
        if (changed) {
            renderBoard();
        }
    }, 100);
});
