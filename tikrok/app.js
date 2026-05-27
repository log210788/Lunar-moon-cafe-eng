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
let currentUserTeam = 'blue';
let activePlayers = {}; // stores active viewers and their board statuses

// Generate A1, B2 labels from index
function getCoordLabel(index) {
    const colLetter = String.fromCharCode(65 + (index % GRID_SIZE)); // A, B, C...
    const rowNum = Math.floor(index / GRID_SIZE) + 1; // 1, 2, 3...
    return `${colLetter}${rowNum}`;
}

// Init board array: ALL start neutral (empty)
function initBoard() {
    boardState = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        boardState.push({
            id: i,
            coord: getCoordLabel(i),
            hp: 100,
            maxHp: 100,
            shield: 0,
            team: 'neutral',
            ownerName: 'System',
            profilePicUrl: '',
            immune: false,
            immuneTimeLeft: 0,
            activeEffect: null
        });
    }
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

                const left = c * 82 + (r % 2 === 1 ? 41 : 0);
                const top = r * 69 + 12;
                const zIndex = 6 - r;

                sqEl.style.left = `${left}px`;
                sqEl.style.top = `${top}px`;
                sqEl.style.zIndex = zIndex;

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

            // Sync Classes
            sqEl.classList.toggle('blue-owned', square.team === 'blue');
            sqEl.classList.toggle('red-owned', square.team === 'red');
            sqEl.classList.toggle('selected', square.id === lastTargetId);
            sqEl.classList.toggle('shielded', square.shield > 0);
            sqEl.classList.toggle('immune', square.immune);

            // Sync active animation classes
            ['shake', 'takeover-flash', 'under-attack', 'deflected'].forEach(eff => {
                sqEl.classList.toggle(eff, square.activeEffect === eff);
            });

            // Update details
            const hpPercent = (square.hp / square.maxHp) * 100;
            const shieldPercent = square.immune ? (square.immuneTimeLeft / 60) * 100 : Math.min(100, (square.shield / 500) * 100);

            let shieldBadgeHtml = '';
            if (square.immune) {
                shieldBadgeHtml = `<span class="shield-badge immune-badge">⚡IMMUNE ${Math.ceil(square.immuneTimeLeft)}s</span>`;
            } else if (square.shield > 0) {
                shieldBadgeHtml = `<span class="shield-badge">🛡️${square.shield}</span>`;
            }

            // Build inner HTML structure only on first load
            if (!sqEl.querySelector('.square-coord')) {
                sqEl.innerHTML = `
                    <div class="square-coord"></div>
                    <div class="square-owner"></div>
                    <div class="username-label"></div>
                    
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

            // Update DOM text/HTML values selectively
            const coordEl = sqEl.querySelector('.square-coord');
            const expectedCoordHtml = `${square.coord}${shieldBadgeHtml}`;
            if (coordEl.innerHTML !== expectedCoordHtml) {
                coordEl.innerHTML = expectedCoordHtml;
            }

            const avatarHtml = square.team === 'neutral'
                ? 'SYS'
                : `<img class="user-avatar" src="${square.profilePicUrl}" alt="${square.ownerName}">`;
            
            const ownerEl = sqEl.querySelector('.square-owner');
            ownerEl.title = `Owner: ${square.ownerName}`;
            if (ownerEl.innerHTML !== avatarHtml) {
                ownerEl.innerHTML = avatarHtml;
            }

            const usernameEl = sqEl.querySelector('.username-label');
            const expectedUsername = square.team === 'neutral' ? 'System' : square.ownerName;
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
    let blueCount = 0;
    let redCount = 0;
    let neutralCount = 0;

    boardState.forEach(s => {
        if (s.team === 'blue') blueCount++;
        else if (s.team === 'red') redCount++;
        else neutralCount++;
    });

    document.getElementById('blueScore').textContent = blueCount;
    document.getElementById('redScore').textContent = redCount;
    document.getElementById('neutralScore').textContent = neutralCount;
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

function spawnParticles(squareId, colorClass) {
    const boardEl = document.getElementById('gridBoard');
    if (!boardEl) return;

    const square = boardState[squareId];
    if (!square) return;

    const row = Math.floor(squareId / GRID_SIZE);
    const col = squareId % GRID_SIZE;

    // Calculate center coordinates of the target hex
    const left = col * 82 + (row % 2 === 1 ? 41 : 0) + 40; // center X
    const top = row * 69 + 12 + 46; // center Y

    // Spawn 7 flying particles
    for (let i = 0; i < 7; i++) {
        const particle = document.createElement('div');
        particle.className = `hit-particle ${colorClass}`;
        
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
function registerActivePlayer(username, team) {
    if (!username || username === 'System' || username === 'Anonymous') return;
    if (!activePlayers[username]) {
        activePlayers[username] = {
            name: username,
            team: team,
            avatar: `https://robohash.org/${encodeURIComponent(username)}?set=set4`,
            squaresCount: 0
        };
    }
}

// Recalculate owned squares for the Roster
function updatePlayerRoster() {
    // Reset counts
    Object.values(activePlayers).forEach(p => p.squaresCount = 0);
    
    // Count owned squares and dynamically register any owners we missed (e.g. from autoplay bots)
    boardState.forEach(s => {
        if (s.team !== 'neutral' && s.ownerName !== 'System') {
            registerActivePlayer(s.ownerName, s.team);
            if (activePlayers[s.ownerName]) {
                activePlayers[s.ownerName].squaresCount++;
            }
        }
    });
    
    renderPlayerRoster();
}

// Render active player lobby in the sidebar
function renderPlayerRoster() {
    const rosterEl = document.getElementById('playerRoster');
    if (!rosterEl) return;

    const players = Object.values(activePlayers);

    if (players.length === 0) {
        rosterEl.innerHTML = `<div class="leaderboard-empty" style="font-size: 12px; text-align: center; color: var(--text-muted);">No active players in lobby yet.<br>Send an action to join!</div>`;
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
        const statusText = isOnMap ? `ON MAP (${p.squaresCount})` : 'LOBBY';
        const badgeClass = isOnMap ? 'on-map' : 'lobby';
        const teamClass = p.team === 'blue' ? 'blue' : 'red';

        return `
            <div class="roster-item">
                <div class="roster-player-info">
                    <img class="roster-avatar ${teamClass}-border" src="${p.avatar}" alt="${p.name}">
                    <span class="roster-name ${teamClass}-text">${p.name}</span>
                </div>
                <span class="roster-status-badge ${badgeClass}">${statusText}</span>
            </div>
        `;
    }).join('');
}

// Launch flying avatar projectile from team side
function launchProjectile(user, team, targetId, callback) {
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

    const row = Math.floor(targetId / GRID_SIZE);
    const col = targetId % GRID_SIZE;

    // Calculate center coordinates of target hexagon relative to gridBoard
    const targetX = col * 82 + (row % 2 === 1 ? 41 : 0) + 40 - 16; // X center minus projectile half-width (16px)
    const targetY = row * 69 + 12 + 46 - 16; // Y center minus projectile half-height (16px)

    // Starting positions based on team
    const startX = team === 'blue' ? -80 : 620;
    const startY = 230; // middle height

    // Create projectile div
    const projEl = document.createElement('div');
    projEl.className = `flying-projectile ${team}-proj`;
    
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
        callback();
    }, 600);
}

// ==========================================================================
// Gameplay Mechanics Handlers (All Actions are Randomly Target-based)
// ==========================================================================

// Helper to set owner and profile picture
function setSquareOwner(square, ownerName, team) {
    square.team = team;
    square.ownerName = ownerName;
    square.hp = 100;
    square.shield = 0;
    if (ownerName === 'System') {
        square.profilePicUrl = '';
    } else {
        // Use Robohash to generate a cute unique cat avatar for the user
        square.profilePicUrl = `https://robohash.org/${encodeURIComponent(ownerName)}?set=set4`;
    }
}

// Input A: Likes Action (Random Placement / Attack)
function handleRandomLike(user, team) {
    const randomIndex = Math.floor(Math.random() * boardState.length);
    const target = boardState[randomIndex];
    updateLastTargetIndicator(randomIndex);

    registerActivePlayer(user, team);

    launchProjectile(user, team, randomIndex, () => {
        // Block attacks on immune enemy squares
        if (target.team !== 'neutral' && target.team !== team && target.immune) {
            logActivity(`🛡️ <b>${user}</b> liked but enemy square <b>${target.coord}</b> is IMMUNE! (BLOCKED)`, 'shield');
            playSound('shield');
            triggerVisualFX(randomIndex, 'deflected');
            spawnFloatingText(randomIndex, "BLOCKED!", "immune");
            spawnParticles(randomIndex, 'gold');
            renderBoard();
            return;
        }

        if (target.team === 'neutral') {
            // Claim neutral instantly
            setSquareOwner(target, user, team);
            logActivity(`👍 <b>${user}</b> liked and randomly claimed neutral square <b>${target.coord}</b> for ${team.toUpperCase()}!`, 'like');
            playSound('like');
            triggerVisualFX(randomIndex, 'takeover-flash');
            spawnFloatingText(randomIndex, "CLAIM!", "heal");
            spawnParticles(randomIndex, team === 'blue' ? 'cyan' : 'red');
        } else if (target.team === team) {
            // Fortify own team square
            target.hp = Math.min(100, target.hp + 20);
            logActivity(`👍 <b>${user}</b> liked and fortified owned square <b>${target.coord}</b> (+20 HP).`, 'like');
            playSound('like');
            triggerVisualFX(randomIndex, 'takeover-flash');
            spawnFloatingText(randomIndex, "+20 HP", "heal");
            spawnParticles(randomIndex, 'green');
        } else {
            // Attack enemy square
            triggerVisualFX(randomIndex, 'under-attack');
            if (target.shield > 0) {
                target.shield = Math.max(0, target.shield - 40);
                logActivity(`👍 <b>${user}</b> liked and randomly hit enemy shield on <b>${target.coord}</b> (-40).`, 'shield');
                playSound('damage');
                spawnFloatingText(randomIndex, "-40 SHD", "damage");
                spawnParticles(randomIndex, 'cyan');
            } else {
                target.hp = Math.max(0, target.hp - 30);
                logActivity(`👍 <b>${user}</b> liked and damaged enemy square <b>${target.coord}</b> (-30 HP).`, 'rose');
                spawnFloatingText(randomIndex, "-30 HP", "damage");
                spawnParticles(randomIndex, 'red');
                
                if (target.hp <= 0) {
                    const oldTeam = target.team;
                    setSquareOwner(target, user, team);
                    logActivity(`🚩 Conquered! <b>${target.coord}</b> flips to ${team.toUpperCase()} team from ${oldTeam.toUpperCase()} via likes!`, 'nuke');
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
function handleRandomDamage(amount, attacker, team) {
    const enemyTeam = team === 'blue' ? 'red' : 'blue';
    const enemySquares = boardState.filter(s => s.team === enemyTeam);
    
    if (enemySquares.length === 0) {
        logActivity(`🌹 <b>${attacker}</b> wanted to Rose attack, but the ${enemyTeam.toUpperCase()} team has no owned squares!`, 'rose');
        return;
    }

    const targetId = enemySquares[Math.floor(Math.random() * enemySquares.length)].id;
    const square = boardState[targetId];
    updateLastTargetIndicator(targetId);

    registerActivePlayer(attacker, team);

    launchProjectile(attacker, team, targetId, () => {
        // Block attack if square is immune
        if (square.immune) {
            logActivity(`🛡️ <b>${attacker}</b> sent a Rose but enemy square <b>${square.coord}</b> is IMMUNE! (BLOCKED)`, 'shield');
            playSound('shield');
            triggerVisualFX(targetId, 'deflected');
            spawnFloatingText(targetId, "BLOCKED!", "immune");
            spawnParticles(targetId, 'gold');
            renderBoard();
            return;
        }
        
        triggerVisualFX(targetId, 'under-attack');
        
        if (square.shield > 0) {
            square.shield = Math.max(0, square.shield - amount);
            logActivity(`🌹 <b>${attacker}</b> sent a Rose and randomly hit enemy shield on <b>${square.coord}</b> (-${amount})!`, 'shield');
            playSound('damage');
            spawnFloatingText(targetId, `-${amount} SHD`, "damage");
            spawnParticles(targetId, 'cyan');
        } else {
            square.hp = Math.max(0, square.hp - amount);
            logActivity(`🌹 <b>${attacker}</b> sent a Rose and dealt <b>${amount} dmg</b> to <b>${square.coord}</b>!`, 'rose');
            spawnFloatingText(targetId, `-${amount} HP`, "damage");
            spawnParticles(targetId, 'red');
            
            if (square.hp <= 0) {
                claimSingleSquare(targetId, attacker, team);
            } else {
                playSound('damage');
            }
        }
        renderBoard();
    });
}

// Boost Shield donation (Chooses a Random Owned Square)
function handleRandomShield(amount, user, team) {
    // Prioritize owned squares that are NOT already immune
    const ownedSquares = boardState.filter(s => s.team === team && !s.immune);
    
    let targetId;
    if (ownedSquares.length === 0) {
        // If all owned squares are already immune, fallback to any owned square
        const allOwned = boardState.filter(s => s.team === team);
        if (allOwned.length === 0) {
            logActivity(`System: <b>${user}</b> tried to shield, but ${team.toUpperCase()} owns no squares!`, 'system');
            return;
        }
        targetId = allOwned[Math.floor(Math.random() * allOwned.length)].id;
    } else {
        targetId = ownedSquares[Math.floor(Math.random() * ownedSquares.length)].id;
    }

    const square = boardState[targetId];
    updateLastTargetIndicator(targetId);

    registerActivePlayer(user, team);

    launchProjectile(user, team, targetId, () => {
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
        square.shield = Math.min(500, square.shield + amount);
        
        if (square.shield >= 500) {
            square.immune = true;
            square.immuneTimeLeft = 60;
            logActivity(`👑 <b>SUPERCHARGE!</b> Square <b>${square.coord}</b> has achieved a FULL shield rotation and is now <b>IMMUNE for 60 seconds</b>!`, 'nuke');
            playSound('shield');
            triggerVisualFX(targetId, 'takeover-flash');
            spawnFloatingText(targetId, "IMMUNE!", "immune");
            spawnParticles(targetId, 'gold');
            triggerHypeAlert("IMMUNITY TRIGGERED!", `Square ${square.coord} is now IMMUNE for 60s!`, "👑", false);
        } else {
            logActivity(`💖 <b>${user}</b> sent a Heart Shield and boosted owned square <b>${square.coord}</b> (+${amount} Shield)!`, 'shield');
            playSound('shield');
            triggerVisualFX(targetId, 'takeover-flash');
            spawnFloatingText(targetId, `+${amount} SHD`, "shield");
            spawnParticles(targetId, 'cyan');
        }
        renderBoard();
    });
}

// Helper to overwrite a single square
function claimSingleSquare(squareId, user, team) {
    const square = boardState[squareId];
    if (!square) return;

    // Block takeover if the square is immune and owned by the enemy
    if (square.immune && square.team !== 'neutral' && square.team !== team) {
        logActivity(`🛡️ center/impact hit <b>${square.coord}</b> but it is IMMUNE! (BLOCKED)`, 'shield');
        playSound('shield');
        triggerVisualFX(squareId, 'deflected');
        spawnFloatingText(squareId, "BLOCKED!", "immune");
        spawnParticles(squareId, 'gold');
        return;
    }

    const oldTeam = square.team;
    setSquareOwner(square, user, team);
    
    if (oldTeam !== 'neutral') {
        logActivity(`🚩 <b>${square.coord}</b> conquered from ${oldTeam.toUpperCase()} team by <b>${user}</b> (<span class="${team}-text" style="color: var(--${team}-team)"><b>${team.toUpperCase()}</b></span>)!`, 'nuke');
    } else {
        logActivity(`🚩 <b>${square.coord}</b> claimed by <b>${user}</b> for the <span class="${team}-text" style="color: var(--${team}-team)"><b>${team.toUpperCase()} TEAM</b></span>!`, 'nuke');
    }
    
    triggerVisualFX(squareId, 'takeover-flash');
    spawnFloatingText(squareId, oldTeam !== 'neutral' ? "CONQUERED!" : "CLAIMED!", "heal");
    spawnParticles(squareId, team === 'blue' ? 'cyan' : 'red');
    spawnParticles(squareId, 'gold'); // dual sparks for capture!
}

// ==========================================================================
// DIFFERENT LAYER OF NUKES (All target randomly)
// ==========================================================================

// Layer 1: Cross Nuke (Bolt - Cost: 10 Coins)
function launchCrossNuke(user, team) {
    const targetId = Math.floor(Math.random() * boardState.length);
    const target = boardState[targetId];
    updateLastTargetIndicator(targetId);

    registerActivePlayer(user, team);

    launchProjectile(user, team, targetId, () => {
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
                claimSingleSquare(id, user, team);
            }
        });

        renderBoard();
    });
}

// Layer 2: Area Nuke (Bomb - Cost: 30 Coins)
function launchAreaNuke(user, team) {
    const targetId = Math.floor(Math.random() * boardState.length);
    const target = boardState[targetId];
    updateLastTargetIndicator(targetId);

    registerActivePlayer(user, team);

    launchProjectile(user, team, targetId, () => {
        playSound('nuke-area');
        logActivity(`💥 <b>${user}</b> sent a Bomb, launching a <b>3x3 Area Nuke</b> centered on <b>${target.coord}</b>!`, 'nuke');

        const col = targetId % GRID_SIZE;
        const row = Math.floor(targetId / GRID_SIZE);

        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                    const id = r * GRID_SIZE + c;
                    claimSingleSquare(id, user, team);
                }
            }
        }

        renderBoard();
    });
}

// Layer 3: Laser Column/Row Nuke (Rocket - Cost: 99 Coins)
function launchLaserNuke(user, team) {
    const targetId = Math.floor(Math.random() * boardState.length);
    const target = boardState[targetId];
    updateLastTargetIndicator(targetId);

    registerActivePlayer(user, team);

    launchProjectile(user, team, targetId, () => {
        playSound('nuke-laser');
        logActivity(`🚀 <b>${user}</b> sent a Rocket, firing a <b>Row & Column Laser</b> centered on <b>${target.coord}</b>!`, 'nuke');
        triggerHypeAlert("LASER SWEEP!", `${user} launched a Row & Column Rocket!`, "🚀", false);

        const col = targetId % GRID_SIZE;
        const row = Math.floor(targetId / GRID_SIZE);

        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const c = i % GRID_SIZE;
            const r = Math.floor(i / GRID_SIZE);
            
            if (c === col || r === row) {
                claimSingleSquare(i, user, team);
            }
        }

        renderBoard();
    });
}

// Layer 4: Mega Galaxy Nuke (Galaxy - Cost: 500 Coins)
function launchMegaNuke(user, team) {
    const targetId = Math.floor(Math.random() * boardState.length);
    const target = boardState[targetId];
    updateLastTargetIndicator(targetId);

    registerActivePlayer(user, team);

    launchProjectile(user, team, targetId, () => {
        playSound('nuke-mega');
        logActivity(`🌌 <b>${user}</b> sent a Universe, launching a massive <b>5x5 Galaxy Nuke</b> centered at <b>${target.coord}</b>!`, 'nuke');
        triggerHypeAlert("GALAXY NUKE!", `${user} sent a UNIVERSE: 5x5 explosion!`, "🌌", true);

        const col = targetId % GRID_SIZE;
        const row = Math.floor(targetId / GRID_SIZE);

        for (let r = row - 2; r <= row + 2; r++) {
            for (let c = col - 2; c <= col + 2; c++) {
                if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                    const id = r * GRID_SIZE + c;
                    claimSingleSquare(id, user, team);
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
const BLUE_VIEWERS = ["Blue_Wave", "Aqua_Knight", "Frost_Byte", "Cobalt_Rex", "Ocean_Eye", "Sky_Shield", "Hex_Blue", "Tidal_Wave"];
const RED_VIEWERS = ["Red_Fury", "Ruby_Fyre", "Crimson_Claw", "Blaze_Star", "Scarlet_Viper", "Magma_Lord", "Hex_Red", "Cosmic_Ember"];

function startAutoSimulation() {
    if (autoSimInterval) return;
    
    autoSimInterval = setInterval(() => {
        // Pick a random team for the action
        const team = Math.random() < 0.5 ? 'blue' : 'red';
        const viewers = team === 'blue' ? BLUE_VIEWERS : RED_VIEWERS;
        const viewer = viewers[Math.floor(Math.random() * viewers.length)];
        
        const roll = Math.random();
        
        if (roll < 0.70) {
            // 70% chance: Like
            handleRandomLike(viewer, team);
        } else if (roll < 0.85) {
            // 15% chance: Rose (Damage)
            handleRandomDamage(50, viewer, team);
        } else if (roll < 0.94) {
            // 9% chance: Shield
            handleRandomShield(200, viewer, team);
        } else {
            // 6% chance: Nuke
            const nukeRoll = Math.random();
            if (nukeRoll < 0.45) {
                // Cross Nuke
                launchCrossNuke(viewer, team);
            } else if (nukeRoll < 0.75) {
                // Area Nuke
                launchAreaNuke(viewer, team);
            } else if (nukeRoll < 0.93) {
                // Laser Nuke
                launchLaserNuke(viewer, team);
            } else {
                // Galaxy Nuke!
                launchMegaNuke(viewer, team);
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

// ==========================================================================
// Event Listeners Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initBoard();
    renderBoard();

    // Team selector configs
    const btnBlue = document.getElementById('selectBlueTeam');
    const btnRed = document.getElementById('selectRedTeam');

    btnBlue.addEventListener('click', () => {
        btnBlue.classList.add('active');
        btnRed.classList.remove('active');
        currentUserTeam = 'blue';
    });

    btnRed.addEventListener('click', () => {
        btnRed.classList.add('active');
        btnBlue.classList.remove('active');
        currentUserTeam = 'red';
    });

    // 1. Likes Action Handler (Input A - Random Placement)
    document.getElementById('actionLike').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        handleRandomLike(user, currentUserTeam);
    });

    // 2. Target Attack & Shield Boost Handlers (No click coordinate dependencies anymore!)
    document.getElementById('actionRose').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        handleRandomDamage(50, user, currentUserTeam); // deals 50 damage to random enemy square
    });

    document.getElementById('actionShield').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        handleRandomShield(500, user, currentUserTeam); // boosts shield on random owned square
    });

    // 3. Different Layers of Nukes (All target randomly)
    document.getElementById('actionCrossNuke').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        launchCrossNuke(user, currentUserTeam);
    });

    document.getElementById('actionAreaNuke').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        launchAreaNuke(user, currentUserTeam);
    });

    document.getElementById('actionLaserNuke').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        launchLaserNuke(user, currentUserTeam);
    });

    document.getElementById('actionMegaNuke').addEventListener('click', () => {
        initAudio();
        const user = document.getElementById('viewerName').value.trim() || 'Anonymous';
        launchMegaNuke(user, currentUserTeam);
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
