// ==========================================================================
// Application State & Globals
// ==========================================================================
let appData = [];
let activeUnitId = 1;
let currentCardIndex = 0;
let audioPlayer = null;
let currentPlayingBtn = null;

// Native HTML Textbook Spread State
let bookSpreadMode = 'lesson'; // 'lesson' or 'exercises'

// Progress Tracking System
let progress = {
    completedUnits: {},
    masteredIdioms: {}
};

// Speed Rate Option
let globalAudioSpeed = 1.0;

// Match Game State Variables
let matchGame = {
    selectedIdiom: null,
    selectedDef: null,
    matchedCount: 0,
    totalCount: 5,
    timerInterval: null,
    startTime: 0,
    elapsedTime: 0,
    idioms: [],
    definitions: []
};

// Dictation State Variables
let dictationState = {
    currentIdiom: null,
    remainingIdioms: [],
    isAnswered: false
};

// Whiteboard State Variables
let whiteboardMode = 'pen'; // 'pen' or 'eraser'
let whiteboardColor = '#06b6d4'; // default cyan
let whiteboardSize = 2; // thin


// ==========================================================================
// DOM Elements Cache
// ==========================================================================
const DOM = {
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    unitList: document.getElementById('unitListContainer'),
    searchInput: document.getElementById('unitSearchInput'),
    progressText: document.getElementById('progressText'),
    progressBar: document.getElementById('progressBar'),
    mobileClose: document.getElementById('mobileCloseBtn'),
    mobileToggle: document.getElementById('mobileToggleBtn'),

    // Main Header
    activeUnitNumber: document.getElementById('activeUnitNumber'),
    activeUnitTitle: document.getElementById('activeUnitTitle'),
    speedSelect: document.getElementById('speedSelect'),
    globalAudioPlayer: document.getElementById('globalAudioPlayer'),

    // Tab buttons
    tabBook: document.getElementById('tab-book'),
    tabStudy: document.getElementById('tab-study'),
    tabFlashcards: document.getElementById('tab-flashcards'),
    tabMatch: document.getElementById('tab-match'),
    tabListening: document.getElementById('tab-listening'),

    // Views
    panelBook: document.getElementById('panel-book'),
    panelStudy: document.getElementById('panel-study'),
    panelFlashcards: document.getElementById('panel-flashcards'),
    panelMatch: document.getElementById('panel-match'),
    panelListening: document.getElementById('panel-listening'),

    // Interactive Book View
    toggleLessonSpread: document.getElementById('toggleLessonSpreadBtn'),
    toggleExercisesSpread: document.getElementById('toggleExercisesSpreadBtn'),
    bookSpreadViewport: document.getElementById('bookSpreadViewport'),
    bookPageInfo: document.getElementById('bookPageInfo'),
    textbookPageLeft: document.getElementById('textbookPageLeft'),
    textbookPageRight: document.getElementById('textbookPageRight'),
    pageBodyLeft: document.getElementById('pageBodyLeft'),
    pageBodyRight: document.getElementById('pageBodyRight'),
    pageUnitNumLeft: document.getElementById('pageUnitNumLeft'),
    pageUnitTitleLeft: document.getElementById('pageUnitTitleLeft'),
    pageUnitNumRight: document.getElementById('pageUnitNumRight'),
    pageUnitTitleRight: document.getElementById('pageUnitTitleRight'),
    pageNumLeft: document.getElementById('pageNumLeft'),
    pageNumRight: document.getElementById('pageNumRight'),
    
    // Image and Whiteboard overlays
    pageImgLeft: document.getElementById('pageImgLeft'),
    pageImgRight: document.getElementById('pageImgRight'),
    hotspotsOverlayLeft: document.getElementById('hotspotsOverlayLeft'),
    hotspotsOverlayRight: document.getElementById('hotspotsOverlayRight'),
    drawingCanvasLeft: document.getElementById('drawingCanvasLeft'),
    drawingCanvasRight: document.getElementById('drawingCanvasRight'),
    textAnnotationsLayerLeft: document.getElementById('textAnnotationsLayerLeft'),
    textAnnotationsLayerRight: document.getElementById('textAnnotationsLayerRight'),
    
    // Exercise Answer Sheet View
    toggleAnswerSheetBtn: document.getElementById('toggleAnswerSheetBtn'),
    exerciseAnswerSheet: document.getElementById('exerciseAnswerSheet'),
    closeAnswerSheetBtn: document.getElementById('closeAnswerSheetBtn'),
    answerSheetBody: document.getElementById('answerSheetBody'),
    sheetScoreSummary: document.getElementById('sheetScoreSummary'),
    sheetScoreValue: document.getElementById('sheetScoreValue'),
    checkAllAnswersBtn: document.getElementById('checkAllAnswersBtn'),
    revealAllAnswersBtn: document.getElementById('revealAllAnswersBtn'),

    // Study View
    idiomGrid: document.getElementById('idiomGridContainer'),

    // Flashcards View
    flashcard: document.getElementById('flashcard'),
    fcFrontTitle: document.getElementById('fcFrontTitle'),
    fcFrontIpa: document.getElementById('fcFrontIpa'),
    fcBackTitle: document.getElementById('fcBackTitle'),
    fcBackDefinition: document.getElementById('fcBackDefinition'),
    fcAudioPlayBtn: document.getElementById('fcAudioPlayBtn'),
    prevCardBtn: document.getElementById('prevCardBtn'),
    nextCardBtn: document.getElementById('nextCardBtn'),
    cardIndicator: document.getElementById('cardIndicator'),
    fcMarkMasteredBtn: document.getElementById('fcMarkMasteredBtn'),

    // Match View
    matchArena: document.getElementById('matchArena'),
    matchIdiomsCol: document.getElementById('matchIdiomsCol'),
    matchDefsCol: document.getElementById('matchDefsCol'),
    matchScore: document.getElementById('matchGameScore'),
    matchTimer: document.getElementById('matchGameTimer'),
    restartMatchBtn: document.getElementById('restartMatchBtn'),
    matchSuccessOverlay: document.getElementById('matchSuccessOverlay'),
    finalMatchTime: document.getElementById('finalMatchTime'),
    playMatchAgainBtn: document.getElementById('playMatchAgainBtn'),

    // Listening View
    listeningExercisesList: document.getElementById('listeningExercisesList'),
    dictationPlayBtn: document.getElementById('dictationPlayBtn'),
    dictationInput: document.getElementById('dictationInput'),
    dictationSubmitBtn: document.getElementById('dictationSubmitBtn'),
    dictationFeedback: document.getElementById('dictationFeedback'),
    dictationNextBtn: document.getElementById('dictationNextBtn'),
    dictationRevealBtn: document.getElementById('dictationRevealBtn'),
    dictationSolutionText: document.getElementById('dictationSolutionText')
};

// ==========================================================================
// Initialization & Loading Data
// ==========================================================================
window.addEventListener('DOMContentLoaded', async () => {
    setupAudioPlayer();
    loadProgress();
    setupEventHandlers();
    initWhiteboard();
    
    try {
        // Load data directly from window.idiomsAppData (set by data.js) to avoid CORS issues on local filesystem
        if (typeof window.idiomsAppData !== 'undefined') {
            appData = window.idiomsAppData;
        } else {
            console.log('window.idiomsAppData not found, falling back to fetch data.json');
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Failed to fetch data.json');
            appData = await response.json();
        }
        
        renderUnitList(appData);
        updateOverallProgress();
        selectUnit(1); // Auto-load Unit 1 on startup
    } catch (error) {
        console.error('Initialization Error:', error);
        DOM.unitList.innerHTML = `<p class="empty-state">Error loading units database. Make sure data.js or data.json is present in the workspace.</p>`;
    }
});

// Setup audio elements and controls
function setupAudioPlayer() {
    audioPlayer = DOM.globalAudioPlayer;
    
    // Stop playing indicators when audio ends
    audioPlayer.addEventListener('ended', () => {
        clearAudioBtnStates();
    });

    // Pause listener
    audioPlayer.addEventListener('pause', () => {
        clearAudioBtnStates();
    });
}

function clearAudioBtnStates() {
    if (currentPlayingBtn) {
        currentPlayingBtn.classList.remove('playing');
        
        // Reset SVG representation depending on button class type
        if (currentPlayingBtn.classList.contains('audio-play-btn')) {
            currentPlayingBtn.innerHTML = getPlayIconSVG();
        } else if (currentPlayingBtn.classList.contains('play-btn-large')) {
            currentPlayingBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" class="play-svg-large"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span>Listen to Idiom</span>
            `;
        }
        currentPlayingBtn = null;
    }
    
    // Deactivate any book view play buttons
    document.querySelectorAll('.idiom-play-btn.playing').forEach(btn => btn.classList.remove('playing'));
    document.querySelectorAll('.hotspot-rect.playing').forEach(btn => btn.classList.remove('playing'));
    document.querySelectorAll('.ex-audio-play-btn.playing').forEach(btn => btn.classList.remove('playing'));
}

// Load progress from localStorage
function loadProgress() {
    const saved = localStorage.getItem('idiom_study_progress');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.completedUnits && parsed.masteredIdioms) {
                progress = parsed;
            }
        } catch (e) {
            console.error('Failed to parse progress:', e);
        }
    }
    if (!progress.drawings) {
        progress.drawings = {};
    }
    if (!progress.exerciseAnswers) {
        progress.exerciseAnswers = {};
    }
    if (!progress.textAnnotations) {
        progress.textAnnotations = {};
    }
}

// Save progress to localStorage
function saveProgress() {
    localStorage.setItem('idiom_study_progress', JSON.stringify(progress));
    updateOverallProgress();
    
    // Update active unit element in sidebar
    const unitItem = document.querySelector(`.unit-item[data-unit-id="${activeUnitId}"]`);
    if (unitItem) {
        const isCompleted = isUnitFullyMastered(activeUnitId);
        if (isCompleted) {
            unitItem.classList.add('completed');
            progress.completedUnits[activeUnitId] = true;
        } else {
            unitItem.classList.remove('completed');
            delete progress.completedUnits[activeUnitId];
        }
        localStorage.setItem('idiom_study_progress', JSON.stringify(progress));
    }
}

// Check if all idioms in a unit are marked as mastered
function isUnitFullyMastered(unitId) {
    const unit = appData.find(u => u.unitId === unitId);
    if (!unit || !unit.idioms.length) return false;
    return unit.idioms.every(idiom => progress.masteredIdioms[`${unitId}:${idiom.idiom}`]);
}

// Update the visual progress bars
function updateOverallProgress() {
    const totalUnits = 54;
    let completedCount = 0;
    
    for (let uId = 1; uId <= totalUnits; uId++) {
        if (isUnitFullyMastered(uId)) {
            completedCount++;
        }
    }
    
    const percentage = Math.round((completedCount / totalUnits) * 100);
    DOM.progressBar.style.width = `${percentage}%`;
    DOM.progressText.textContent = `${completedCount} / ${totalUnits} Units (${percentage}%)`;
}

// ==========================================================================
// Sidebar UI & Unit Selection
// ==========================================================================
function renderUnitList(data) {
    DOM.unitList.innerHTML = '';
    
    data.forEach(unit => {
        const isCompleted = isUnitFullyMastered(unit.unitId);
        const item = document.createElement('button');
        item.className = `unit-item ${isCompleted ? 'completed' : ''}`;
        item.setAttribute('data-unit-id', unit.unitId);
        
        item.innerHTML = `
            <div class="unit-item-content">
                <span class="unit-num-badge">Unit ${unit.unitId}</span>
                <span class="unit-item-title">${unit.title}</span>
            </div>
            <div class="unit-item-status">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
        `;
        
        item.addEventListener('click', () => {
            selectUnit(unit.unitId);
            // Hide sidebar on mobile screen
            if (window.innerWidth <= 900) {
                DOM.sidebar.classList.remove('open');
            }
        });
        
        DOM.unitList.appendChild(item);
    });
}

// Select and load active unit contents
function selectUnit(unitId) {
    activeUnitId = unitId;
    const unit = appData.find(u => u.unitId === unitId);
    if (!unit) return;
    
    // Highlight sidebar active item
    document.querySelectorAll('.unit-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.querySelector(`.unit-item[data-unit-id="${unitId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        // Smoothly scroll the selected unit item into view in the sidebar
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Set active header texts
    DOM.activeUnitNumber.textContent = `Unit ${unit.unitId}`;
    DOM.activeUnitTitle.textContent = unit.title;
    
    // Reset view indices
    currentCardIndex = 0;
    
    // Initialize Tab Panel Contents
    renderStudyTab(unit);
    initFlashcards(unit);
    resetMatchGame();
    initListeningTab(unit);
    
    // Render the interactive book spread for the selected unit
    renderBookSpread();
    
    // Stop any playing audio
    stopAudio();
}

// ==========================================================================
// Tab Controllers & Event Handlers
// ==========================================================================
function setupEventHandlers() {
    // Mobile Navigation triggers
    DOM.mobileToggle.addEventListener('click', () => DOM.sidebar.classList.add('open'));
    DOM.mobileClose.addEventListener('click', () => DOM.sidebar.classList.remove('open'));
    
    // Global Speed selector
    DOM.speedSelect.addEventListener('change', (e) => {
        globalAudioSpeed = parseFloat(e.target.value);
        if (audioPlayer && !audioPlayer.paused) {
            audioPlayer.playbackRate = globalAudioSpeed;
        }
    });
    
    // Tabs click actions
    const tabs = [
        { button: DOM.tabBook, panel: DOM.panelBook, name: 'book' },
        { button: DOM.tabStudy, panel: DOM.panelStudy, name: 'study' },
        { button: DOM.tabFlashcards, panel: DOM.panelFlashcards, name: 'flashcards' },
        { button: DOM.tabMatch, panel: DOM.panelMatch, name: 'match' },
        { button: DOM.tabListening, panel: DOM.panelListening, name: 'listening' }
    ];
    
    tabs.forEach(tab => {
        tab.button.addEventListener('click', () => {
            tabs.forEach(t => {
                t.button.classList.remove('active');
                t.button.setAttribute('aria-selected', 'false');
                t.panel.classList.remove('active');
            });
            
            tab.button.classList.add('active');
            tab.button.setAttribute('aria-selected', 'true');
            tab.panel.classList.add('active');
            
            // Tab Specific Initializers
            stopAudio();
            if (tab.name === 'book') {
                renderBookSpread();
            } else if (tab.name === 'match') {
                resetMatchGame();
            } else if (tab.name === 'listening') {
                initListeningQuiz();
            }
        });
    });

    // Interactive Book specific controls
    DOM.toggleLessonSpread.addEventListener('click', () => {
        if (bookSpreadMode === 'lesson') return;
        bookSpreadMode = 'lesson';
        DOM.toggleLessonSpread.classList.add('active');
        DOM.toggleExercisesSpread.classList.remove('active');
        renderBookSpread();
    });

    DOM.toggleExercisesSpread.addEventListener('click', () => {
        if (bookSpreadMode === 'exercises') return;
        bookSpreadMode = 'exercises';
        DOM.toggleExercisesSpread.classList.add('active');
        DOM.toggleLessonSpread.classList.remove('active');
        renderBookSpread();
    });
    // Whiteboard Toolbar setup
    const toolPen = document.getElementById('tool-pen');
    const toolEraser = document.getElementById('tool-eraser');
    const toolText = document.getElementById('tool-text');
    
    function resetToolBtns() {
        if (toolPen) toolPen.classList.remove('active');
        if (toolEraser) toolEraser.classList.remove('active');
        if (toolText) toolText.classList.remove('active');
    }
    
    if (toolPen) {
        toolPen.addEventListener('click', () => {
            whiteboardMode = 'pen';
            resetToolBtns();
            toolPen.classList.add('active');
        });
    }
    
    if (toolEraser) {
        toolEraser.addEventListener('click', () => {
            whiteboardMode = 'eraser';
            resetToolBtns();
            toolEraser.classList.add('active');
        });
    }
    
    if (toolText) {
        toolText.addEventListener('click', () => {
            whiteboardMode = 'text';
            resetToolBtns();
            toolText.classList.add('active');
        });
    }
    
    // Color dots
    document.querySelectorAll('.color-dot').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.color-dot').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            whiteboardColor = btn.getAttribute('data-color');
            
            // Switch back to pen mode if in eraser mode when choosing color
            if (whiteboardMode === 'eraser' && toolPen) {
                toolPen.click();
            }
        });
    });
    
    // Size buttons
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            whiteboardSize = parseInt(btn.getAttribute('data-size'));
        });
    });
    
    // Clear button
    const clearCanvasBtn = document.getElementById('clearCanvasBtn');
    if (clearCanvasBtn) {
        clearCanvasBtn.addEventListener('click', () => {
            const leftCanvas = DOM.drawingCanvasLeft;
            const rightCanvas = DOM.drawingCanvasRight;
            
            if (leftCanvas && leftCanvas.dataset.pageNum) {
                const pNum = parseInt(leftCanvas.dataset.pageNum);
                progress.drawings[pNum] = [];
                progress.textAnnotations[pNum] = [];
                redrawCanvas(leftCanvas, pNum);
                renderTextAnnotations(pNum, DOM.textAnnotationsLayerLeft);
            }
            if (rightCanvas && rightCanvas.dataset.pageNum) {
                const pNum = parseInt(rightCanvas.dataset.pageNum);
                progress.drawings[pNum] = [];
                progress.textAnnotations[pNum] = [];
                redrawCanvas(rightCanvas, pNum);
                renderTextAnnotations(pNum, DOM.textAnnotationsLayerRight);
            }
            saveProgress();
        });
    }

    // Answer Sheet panel listeners
    if (DOM.toggleAnswerSheetBtn) {
        DOM.toggleAnswerSheetBtn.addEventListener('click', () => {
            DOM.exerciseAnswerSheet.classList.toggle('active');
            DOM.toggleAnswerSheetBtn.classList.toggle('active');
            setTimeout(resizeCanvases, 350);
        });
    }
    
    if (DOM.closeAnswerSheetBtn) {
        DOM.closeAnswerSheetBtn.addEventListener('click', () => {
            DOM.exerciseAnswerSheet.classList.remove('active');
            DOM.toggleAnswerSheetBtn.classList.remove('active');
            setTimeout(resizeCanvases, 350);
        });
    }
    
    if (DOM.checkAllAnswersBtn) {
        DOM.checkAllAnswersBtn.addEventListener('click', () => {
            checkExerciseAnswers();
        });
    }
    
    if (DOM.revealAllAnswersBtn) {
        DOM.revealAllAnswersBtn.addEventListener('click', () => {
            revealExerciseAnswers();
        });
    }

    // Search input systems
    DOM.searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        filterUnits(query);
    });

    // Re-render book spread on resize (for responsive layout)
    window.addEventListener('resize', debounce(() => {
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        if (activeTab === 'book') {
            resizeCanvases();
        }
    }, 150));
}



// Search and filter unit indexes
function filterUnits(query) {
    const items = document.querySelectorAll('.unit-item');
    
    appData.forEach((unit, idx) => {
        const itemElement = items[idx];
        if (!itemElement) return;
        
        // Search in unit title
        const matchTitle = unit.title.toLowerCase().includes(query);
        const matchUnitNum = `unit ${unit.unitId}`.includes(query);
        
        // Search in idiom list
        const matchIdioms = unit.idioms.some(i => i.idiom.toLowerCase().includes(query) || i.definition.toLowerCase().includes(query));
        
        if (matchTitle || matchUnitNum || matchIdioms) {
            itemElement.style.display = 'flex';
        } else {
            itemElement.style.display = 'none';
        }
    });
}

// ==========================================================================
// Interactive Book Spread Renderer (Images + Hotspots + Whiteboard)
// ==========================================================================

function renderBookSpread() {
    const unit = appData.find(u => u.unitId === activeUnitId);
    if (!unit) return;
    stopAudio();
    
    const lessonStartPage = 10 + (unit.unitId - 1) * 4;
    let leftPageNum, rightPageNum;
    
    if (bookSpreadMode === 'lesson') {
        leftPageNum = lessonStartPage;
        rightPageNum = lessonStartPage + 1;
        
        DOM.bookPageInfo.innerHTML = `
            <span class="book-hint-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Click any highlighted idiom row on the page to hear it!
            </span>
        `;
        
        // Hide answer sheet toggle button
        if (DOM.toggleAnswerSheetBtn) DOM.toggleAnswerSheetBtn.style.display = 'none';
        
        // Close answer sheet panel if active
        if (DOM.exerciseAnswerSheet) DOM.exerciseAnswerSheet.classList.remove('active');
        if (DOM.toggleAnswerSheetBtn) DOM.toggleAnswerSheetBtn.classList.remove('active');
    } else {
        leftPageNum = lessonStartPage + 2;
        rightPageNum = lessonStartPage + 3;
        
        // Build floating listening console for exercise tracks
        let listenHtml = '';
        if (unit.listeningExercises && unit.listeningExercises.length > 0) {
            listenHtml = `
                <div class="whiteboard-toolbar" style="margin-bottom: 0; background: transparent; border: none; padding: 0; backdrop-filter: none; gap: 8px;">
                    <span class="toolbar-label">Exercise Audio:</span>
            `;
            unit.listeningExercises.forEach(ex => {
                const label = ex.question === 'eg' ? 'Example' : `Q${ex.question}`;
                listenHtml += `
                    <button class="ex-audio-play-btn" data-file="${ex.file}" title="Play Exercise ${ex.exercise} ${label}">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="8" height="8"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        <span>${label}</span>
                    </button>
                `;
            });
            listenHtml += `</div>`;
        } else {
            listenHtml = `
                <span class="book-hint-badge">
                    No listening tracks for this unit
                </span>
            `;
        }
        DOM.bookPageInfo.innerHTML = listenHtml;
        
        // Attach click listeners to exercise audio buttons
        const playBtns = DOM.bookPageInfo.querySelectorAll('.ex-audio-play-btn');
        playBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const file = btn.getAttribute('data-file');
                playIdiomAudio(unit.unitId, file, btn);
            });
        });
        
        // Show answer sheet toggle button
        if (DOM.toggleAnswerSheetBtn) DOM.toggleAnswerSheetBtn.style.display = 'inline-flex';
        
        // Populate Answer Sheet
        renderAnswerSheet(unit);
    }
    
    // Clear old text layers immediately before loading new pages
    DOM.textAnnotationsLayerLeft.innerHTML = '';
    DOM.textAnnotationsLayerRight.innerHTML = '';
    
    // Load page images
    DOM.pageImgLeft.src = `pages/page_${leftPageNum}.jpg`;
    DOM.pageImgRight.src = `pages/page_${rightPageNum}.jpg`;
    
    // Store page num on canvases
    DOM.drawingCanvasLeft.dataset.pageNum = leftPageNum;
    DOM.drawingCanvasRight.dataset.pageNum = rightPageNum;
    
    // Handle image load logic
    DOM.pageImgLeft.onload = () => {
        DOM.drawingCanvasLeft.width = DOM.pageImgLeft.clientWidth;
        DOM.drawingCanvasLeft.height = DOM.pageImgLeft.clientHeight;
        redrawCanvas(DOM.drawingCanvasLeft, leftPageNum);
        renderTextAnnotations(leftPageNum, DOM.textAnnotationsLayerLeft);
    };
    DOM.pageImgRight.onload = () => {
        DOM.drawingCanvasRight.width = DOM.pageImgRight.clientWidth;
        DOM.drawingCanvasRight.height = DOM.pageImgRight.clientHeight;
        redrawCanvas(DOM.drawingCanvasRight, rightPageNum);
        renderTextAnnotations(rightPageNum, DOM.textAnnotationsLayerRight);
    };
    
    // Fallback if images are already cached
    if (DOM.pageImgLeft.complete) {
        DOM.pageImgLeft.onload();
    }
    if (DOM.pageImgRight.complete) {
        DOM.pageImgRight.onload();
    }
    
    // Render audio hotspots
    renderHotspots(unit, leftPageNum, rightPageNum);
}

// Render hotspots on the lesson spread
function renderHotspots(unit, leftPageNum, rightPageNum) {
    DOM.hotspotsOverlayLeft.innerHTML = '';
    DOM.hotspotsOverlayRight.innerHTML = '';
    
    if (bookSpreadMode !== 'lesson') return; // Hotspots are only on the lesson page
    
    // PDF page size (standard from coordinates extraction)
    const pdfWidth = 552.774;
    const pdfHeight = 660.495;
    
    unit.idioms.forEach(item => {
        if (!item.coords) return;
        
        // Coords: { x, y, width, height }
        const cx = item.coords.x;
        const cy = item.coords.y;
        const cw = item.coords.width;
        const ch = item.coords.height;
        const offset = item.pageOffset || 0; // 0 for left page, 1 for right page
        
        // Convert to percentage positions relative to image container:
        const leftPercent = (cx / pdfWidth) * 100;
        const topPercent = ((pdfHeight - cy - ch) / pdfHeight) * 100;
        const widthPercent = (cw / pdfWidth) * 100;
        const heightPercent = (ch / pdfHeight) * 100;
        
        const hotspot = document.createElement('div');
        hotspot.className = 'hotspot-rect';
        hotspot.style.left = `${leftPercent}%`;
        hotspot.style.top = `${topPercent}%`;
        hotspot.style.width = `${widthPercent}%`;
        hotspot.style.height = `${heightPercent}%`;
        hotspot.title = `Click to play: "${item.idiom}"`;
        
        hotspot.addEventListener('click', (e) => {
            e.stopPropagation();
            playIdiomAudio(unit.unitId, item.audioFile, hotspot);
        });
        
        if (offset === 0) {
            DOM.hotspotsOverlayLeft.appendChild(hotspot);
        } else {
            DOM.hotspotsOverlayRight.appendChild(hotspot);
        }
    });
}

// Initialize Whiteboard Drawing Canvases Once
function initWhiteboard() {
    setupWhiteboard(DOM.drawingCanvasLeft);
    setupWhiteboard(DOM.drawingCanvasRight);
}

// Binds event listeners to drawing canvas element
function setupWhiteboard(canvasEl) {
    const ctx = canvasEl.getContext('2d');
    let lastX = 0;
    let lastY = 0;
    let isDrawing = false;
    let currentStroke = null;
    
    function getMousePos(e) {
        const rect = canvasEl.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    function startDraw(e) {
        e.preventDefault();
        const pageNumStr = canvasEl.dataset.pageNum;
        if (!pageNumStr) return;
        const pageNum = parseInt(pageNumStr);
        
        const pos = getMousePos(e);
        
        if (whiteboardMode === 'text') {
            createTextInput(canvasEl, pageNum, pos.x, pos.y);
            return;
        }
        
        isDrawing = true;
        lastX = pos.x;
        lastY = pos.y;
        
        if (!progress.drawings[pageNum]) progress.drawings[pageNum] = [];
        
        currentStroke = {
            mode: whiteboardMode,
            color: whiteboardColor,
            size: whiteboardSize,
            points: [{ x: pos.x / canvasEl.width, y: pos.y / canvasEl.height }]
        };
    }
    
    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getMousePos(e);
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        
        if (whiteboardMode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = whiteboardSize * 4;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = whiteboardColor;
            ctx.lineWidth = whiteboardSize;
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        lastX = pos.x;
        lastY = pos.y;
        
        currentStroke.points.push({ x: pos.x / canvasEl.width, y: pos.y / canvasEl.height });
    }
    
    function stopDraw() {
        if (!isDrawing) return;
        isDrawing = false;
        const pageNumStr = canvasEl.dataset.pageNum;
        if (!pageNumStr) return;
        const pageNum = parseInt(pageNumStr);
        
        if (currentStroke && currentStroke.points.length > 1) {
            progress.drawings[pageNum].push(currentStroke);
            saveProgress();
        }
        currentStroke = null;
    }
    
    // Mouse events
    canvasEl.addEventListener('mousedown', startDraw);
    canvasEl.addEventListener('mousemove', draw);
    canvasEl.addEventListener('mouseup', stopDraw);
    canvasEl.addEventListener('mouseout', stopDraw);
    
    // Touch events
    canvasEl.addEventListener('touchstart', startDraw, { passive: false });
    canvasEl.addEventListener('touchmove', draw, { passive: false });
    canvasEl.addEventListener('touchend', stopDraw);
}

// Redraw stored strokes on canvas
function redrawCanvas(canvasEl, pageNum) {
    if (!canvasEl || isNaN(pageNum)) return;
    const ctx = canvasEl.getContext('2d');
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    
    if (!progress.drawings || !progress.drawings[pageNum]) return;
    
    progress.drawings[pageNum].forEach(stroke => {
        if (stroke.points.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * canvasEl.width, stroke.points[0].y * canvasEl.height);
        
        for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x * canvasEl.width, stroke.points[i].y * canvasEl.height);
        }
        
        if (stroke.mode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = stroke.size * 4;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    });
}

// Resize all active canvases
function resizeCanvases() {
    if (DOM.pageImgLeft && DOM.drawingCanvasLeft) {
        if (DOM.pageImgLeft.clientWidth > 0) {
            DOM.drawingCanvasLeft.width = DOM.pageImgLeft.clientWidth;
            DOM.drawingCanvasLeft.height = DOM.pageImgLeft.clientHeight;
            redrawCanvas(DOM.drawingCanvasLeft, parseInt(DOM.drawingCanvasLeft.dataset.pageNum));
        }
    }
    if (DOM.pageImgRight && DOM.drawingCanvasRight) {
        if (DOM.pageImgRight.clientWidth > 0) {
            DOM.drawingCanvasRight.width = DOM.pageImgRight.clientWidth;
            DOM.drawingCanvasRight.height = DOM.pageImgRight.clientHeight;
            redrawCanvas(DOM.drawingCanvasRight, parseInt(DOM.drawingCanvasRight.dataset.pageNum));
        }
    }
}

function clearBookRowStates() {
    document.querySelectorAll('.hotspot-rect.playing').forEach(btn => btn.classList.remove('playing'));
    document.querySelectorAll('.ex-audio-play-btn.playing').forEach(btn => btn.classList.remove('playing'));
    currentPlayingBtn = null;
}

// ==========================================================================
// Tab Mode 1: Study Guide Rendering
// ==========================================================================
function renderStudyTab(unit) {
    DOM.idiomGrid.innerHTML = '';
    
    if (!unit.idioms || !unit.idioms.length) {
        DOM.idiomGrid.innerHTML = `<p class="empty-state">No idioms parsed for this unit.</p>`;
        return;
    }
    
    unit.idioms.forEach(item => {
        const isMastered = progress.masteredIdioms[`${unit.unitId}:${item.idiom}`] || false;
        const card = document.createElement('div');
        card.className = `idiom-card ${isMastered ? 'completed' : ''}`;
        card.setAttribute('data-idiom-name', item.idiom);
        
        card.innerHTML = `
            <div class="card-top">
                <div class="card-titles-wrap">
                    <span class="module-badge">Module ${item.module}</span>
                    <h4 class="card-title">${item.idiom}</h4>
                    <span class="idiom-ipa">${item.ipa || ''}</span>
                    <p class="card-def">${item.definition}</p>
                </div>
            </div>
            <div class="card-bottom">
                <button class="audio-play-btn" aria-label="Play Audio">
                    ${getPlayIconSVG()}
                </button>
                <label class="mastery-checkbox">
                    <span class="checkbox-visual">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </span>
                    <span>Mastered</span>
                </label>
            </div>
        `;
        
        // Audio playback handle
        const playBtn = card.querySelector('.audio-play-btn');
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playIdiomAudio(unit.unitId, item.audioFile, playBtn);
        });
        
        // Mastery completion checkbox handle
        const checkbox = card.querySelector('.mastery-checkbox');
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleIdiomMastery(unit.unitId, item.idiom, card);
        });
        
        DOM.idiomGrid.appendChild(card);
    });
}

// Toggle single idiom status
function toggleIdiomMastery(unitId, idiomName, cardElement) {
    const key = `${unitId}:${idiomName}`;
    const wasMastered = progress.masteredIdioms[key] || false;
    
    if (wasMastered) {
        delete progress.masteredIdioms[key];
        cardElement.classList.remove('completed');
    } else {
        progress.masteredIdioms[key] = true;
        cardElement.classList.add('completed');
    }
    
    saveProgress();
    
    // Sync flashcard screen button state if studying same idiom
    const unit = appData.find(u => u.unitId === unitId);
    if (unit && unit.idioms[currentCardIndex] && unit.idioms[currentCardIndex].idiom === idiomName) {
        updateFlashcardMasteryButton(wasMastered ? false : true);
    }
}

// Audio relative path generator & player
function playIdiomAudio(unitId, filename, buttonElement) {
    if (currentPlayingBtn && currentPlayingBtn === buttonElement) {
        // Toggle play/pause
        if (!audioPlayer.paused) {
            audioPlayer.pause();
        } else {
            audioPlayer.play();
            buttonElement.classList.add('playing');
            if (buttonElement.classList.contains('audio-play-btn')) {
                buttonElement.innerHTML = getPauseIconSVG();
            }
        }
        return;
    }
    
    clearAudioBtnStates();
    
    currentPlayingBtn = buttonElement;
    currentPlayingBtn.classList.add('playing');
    
    if (currentPlayingBtn.classList.contains('audio-play-btn')) {
        currentPlayingBtn.innerHTML = getPauseIconSVG();
    }
    
    const path = `English Idioms/${unitId}/${filename}`;
    audioPlayer.src = encodeURI(path);
    audioPlayer.playbackRate = globalAudioSpeed;
    
    audioPlayer.play().catch(e => {
        console.error('Audio failed to play:', e);
        clearAudioBtnStates();
    });
}

function stopAudio() {
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
    }
    clearAudioBtnStates();
}

// ==========================================================================
// Tab Mode 2: Flashcards Logic
// ==========================================================================
function initFlashcards(unit) {
    DOM.flashcard.classList.remove('flipped');
    
    if (!unit.idioms || !unit.idioms.length) {
        DOM.fcFrontTitle.textContent = "No Cards";
        DOM.fcBackDefinition.textContent = "";
        DOM.cardIndicator.textContent = "0 / 0";
        DOM.fcAudioPlayBtn.style.display = 'none';
        DOM.fcMarkMasteredBtn.style.display = 'none';
        return;
    }
    
    DOM.fcAudioPlayBtn.style.display = 'flex';
    DOM.fcMarkMasteredBtn.style.display = 'flex';
    
    showFlashcard(unit, currentCardIndex);
    
    // Remove old listeners to avoid multiple handlers stacking
    DOM.flashcard.onclick = null;
    DOM.flashcard.onclick = () => {
        DOM.flashcard.classList.toggle('flipped');
    };
    
    DOM.prevCardBtn.onclick = null;
    DOM.prevCardBtn.onclick = () => {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            DOM.flashcard.classList.remove('flipped');
            setTimeout(() => showFlashcard(unit, currentCardIndex), 150);
        }
    };
    
    DOM.nextCardBtn.onclick = null;
    DOM.nextCardBtn.onclick = () => {
        if (currentCardIndex < unit.idioms.length - 1) {
            currentCardIndex++;
            DOM.flashcard.classList.remove('flipped');
            setTimeout(() => showFlashcard(unit, currentCardIndex), 150);
        }
    };
}

function showFlashcard(unit, index) {
    const item = unit.idioms[index];
    if (!item) return;
    
    DOM.fcFrontTitle.textContent = item.idiom;
    DOM.fcFrontIpa.textContent = item.ipa || '';
    DOM.fcBackTitle.textContent = item.idiom;
    DOM.fcBackDefinition.textContent = item.definition;
    DOM.cardIndicator.textContent = `Card ${index + 1} / ${unit.idioms.length}`;
    
    // Setup Audio trigger
    DOM.fcAudioPlayBtn.onclick = null;
    DOM.fcAudioPlayBtn.onclick = (e) => {
        e.stopPropagation(); // Avoid flipping the card when clicking the audio button
        playIdiomAudio(unit.unitId, item.audioFile, DOM.fcAudioPlayBtn);
    };
    DOM.fcAudioPlayBtn.classList.remove('playing');
    DOM.fcAudioPlayBtn.innerHTML = getPlayIconSVG();
    
    // Mastery Button setup
    const isMastered = progress.masteredIdioms[`${unit.unitId}:${item.idiom}`] || false;
    updateFlashcardMasteryButton(isMastered);
    
    DOM.fcMarkMasteredBtn.onclick = null;
    DOM.fcMarkMasteredBtn.onclick = (e) => {
        e.stopPropagation();
        
        // Retrieve dynamic card element inside study guide tab
        const cardElement = document.querySelector(`.idiom-card[data-idiom-name="${item.idiom}"]`);
        if (cardElement) {
            toggleIdiomMastery(unit.unitId, item.idiom, cardElement);
        } else {
            // Fallback toggle directly
            const key = `${unit.unitId}:${item.idiom}`;
            const wasMastered = progress.masteredIdioms[key] || false;
            if (wasMastered) delete progress.masteredIdioms[key];
            else progress.masteredIdioms[key] = true;
            saveProgress();
            updateFlashcardMasteryButton(!wasMastered);
        }
    };
}

function updateFlashcardMasteryButton(isMastered) {
    if (isMastered) {
        DOM.fcMarkMasteredBtn.className = "mastery-btn mastered";
        DOM.fcMarkMasteredBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Mastery Confirmed</span>
        `;
    } else {
        DOM.fcMarkMasteredBtn.className = "mastery-btn";
        DOM.fcMarkMasteredBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Mark as Mastered</span>
        `;
    }
}

// ==========================================================================
// Tab Mode 3: Shuffled Matching Game Logic
// ==========================================================================
function resetMatchGame() {
    clearInterval(matchGame.timerInterval);
    matchGame.timerInterval = null;
    matchGame.selectedIdiom = null;
    matchGame.selectedDef = null;
    matchGame.matchedCount = 0;
    matchGame.elapsedTime = 0;
    DOM.matchTimer.textContent = "0.0s";
    DOM.matchScore.textContent = "0 / 5";
    DOM.matchSuccessOverlay.style.display = 'none';
    
    initMatchGame();
}

function initMatchGame() {
    const unit = appData.find(u => u.unitId === activeUnitId);
    if (!unit || !unit.idioms || !unit.idioms.length) {
        DOM.matchArena.innerHTML = `<p class="empty-state">No items to play with.</p>`;
        return;
    }
    
    // Pull up to 5 idioms randomly
    const activeIdioms = [...unit.idioms];
    shuffle(activeIdioms);
    const gamePool = activeIdioms.slice(0, 5);
    
    matchGame.totalCount = gamePool.length;
    matchGame.idioms = [...gamePool];
    matchGame.definitions = [...gamePool];
    
    // Shuffling separately to randomize lists
    shuffle(matchGame.idioms);
    shuffle(matchGame.definitions);
    
    renderMatchArena();
    
    DOM.restartMatchBtn.onclick = resetMatchGame;
    DOM.playMatchAgainBtn.onclick = resetMatchGame;
}

function renderMatchArena() {
    DOM.matchIdiomsCol.innerHTML = '';
    DOM.matchDefsCol.innerHTML = '';
    
    // Render Idioms list
    matchGame.idioms.forEach(item => {
        const box = document.createElement('div');
        box.className = 'match-item';
        box.textContent = item.idiom;
        box.setAttribute('data-idiom-ref', item.idiom);
        
        box.addEventListener('click', () => handleIdiomSelect(box, item.idiom));
        DOM.matchIdiomsCol.appendChild(box);
    });
    
    // Render Definitions list
    matchGame.definitions.forEach(item => {
        const box = document.createElement('div');
        box.className = 'match-item';
        box.textContent = item.definition;
        box.setAttribute('data-def-ref', item.idiom); // Links by title ref key
        
        box.addEventListener('click', () => handleDefSelect(box, item.idiom));
        DOM.matchDefsCol.appendChild(box);
    });
}

function handleIdiomSelect(element, idiomName) {
    if (element.classList.contains('correct')) return;
    
    // Clear previous highlights
    document.querySelectorAll('#matchIdiomsCol .match-item').forEach(el => el.classList.remove('selected', 'incorrect'));
    
    startMatchTimer();
    
    matchGame.selectedIdiom = { element, name: idiomName };
    element.classList.add('selected');
    
    evaluateMatchSelection();
}

function handleDefSelect(element, refName) {
    if (element.classList.contains('correct')) return;
    
    // Clear previous highlights
    document.querySelectorAll('#matchDefsCol .match-item').forEach(el => el.classList.remove('selected', 'incorrect'));
    
    startMatchTimer();
    
    matchGame.selectedDef = { element, ref: refName };
    element.classList.add('selected');
    
    evaluateMatchSelection();
}

// Evaluate matches
function evaluateMatchSelection() {
    if (!matchGame.selectedIdiom || !matchGame.selectedDef) return;
    
    const idiom = matchGame.selectedIdiom;
    const def = matchGame.selectedDef;
    
    if (idiom.name === def.ref) {
        // MATCH DETECTED
        idiom.element.className = "match-item correct";
        def.element.className = "match-item correct";
        
        matchGame.matchedCount++;
        DOM.matchScore.textContent = `${matchGame.matchedCount} / ${matchGame.totalCount}`;
        
        matchGame.selectedIdiom = null;
        matchGame.selectedDef = null;
        
        if (matchGame.matchedCount === matchGame.totalCount) {
            handleMatchGameComplete();
        }
    } else {
        // MISMATCH DETECTED
        const targetIdiomEl = idiom.element;
        const targetDefEl = def.element;
        
        targetIdiomEl.className = "match-item incorrect";
        targetDefEl.className = "match-item incorrect";
        
        matchGame.selectedIdiom = null;
        matchGame.selectedDef = null;
        
        // Remove shake classes and clean selection values
        setTimeout(() => {
            if (targetIdiomEl && !targetIdiomEl.classList.contains('correct')) {
                targetIdiomEl.classList.remove('incorrect');
            }
            if (targetDefEl && !targetDefEl.classList.contains('correct')) {
                targetDefEl.classList.remove('incorrect');
            }
        }, 800);
    }
}

// Timer mechanics
function startMatchTimer() {
    if (matchGame.timerInterval) return;
    
    matchGame.startTime = Date.now();
    matchGame.timerInterval = setInterval(() => {
        matchGame.elapsedTime = (Date.now() - matchGame.startTime) / 1000;
        DOM.matchTimer.textContent = `${matchGame.elapsedTime.toFixed(1)}s`;
    }, 100);
}

function handleMatchGameComplete() {
    clearInterval(matchGame.timerInterval);
    matchGame.timerInterval = null;
    
    DOM.finalMatchTime.textContent = matchGame.elapsedTime.toFixed(1);
    DOM.matchSuccessOverlay.style.display = 'flex';
}

// ==========================================================================
// Tab Mode 4: Listening / Dictation Quiz Logic
// ==========================================================================
function initListeningTab(unit) {
    DOM.listeningExercisesList.innerHTML = '';
    
    if (!unit.listeningExercises || !unit.listeningExercises.length) {
        DOM.listeningExercisesList.innerHTML = `<p class="empty-state">No exercise tracks configured for this unit.</p>`;
        return;
    }
    
    unit.listeningExercises.forEach(ex => {
        const item = document.createElement('div');
        item.className = 'exercise-item';
        
        // Format names nicely (e.g. eg -> Example, etc.)
        const labelNum = ex.question === 'eg' ? 'Example' : `Question ${ex.question}`;
        
        item.innerHTML = `
            <div class="exercise-info">
                <span class="ex-title">Exercise ${ex.exercise}</span>
                <span class="ex-subtitle">${labelNum} (${ex.file.slice(-6, -4).toUpperCase()})</span>
            </div>
            <button class="audio-play-btn" aria-label="Play Exercise Audio">
                ${getPlayIconSVG()}
            </button>
        `;
        
        const playBtn = item.querySelector('.audio-play-btn');
        playBtn.addEventListener('click', () => {
            playIdiomAudio(unit.unitId, ex.file, playBtn);
        });
        
        DOM.listeningExercisesList.appendChild(item);
    });
}

function initListeningQuiz() {
    const unit = appData.find(u => u.unitId === activeUnitId);
    if (!unit || !unit.idioms || !unit.idioms.length) {
        return;
    }
    
    dictationState.remainingIdioms = [...unit.idioms];
    shuffle(dictationState.remainingIdioms);
    
    DOM.dictationInput.value = '';
    DOM.dictationFeedback.style.display = 'none';
    DOM.dictationNextBtn.style.display = 'none';
    DOM.dictationRevealBtn.style.display = 'inline-flex';
    
    loadNextDictationIdiom();
}

function loadNextDictationIdiom() {
    if (dictationState.remainingIdioms.length === 0) {
        const unit = appData.find(u => u.unitId === activeUnitId);
        dictationState.remainingIdioms = [...unit.idioms];
        shuffle(dictationState.remainingIdioms);
    }
    
    dictationState.currentIdiom = dictationState.remainingIdioms.pop();
    dictationState.isAnswered = false;
    
    DOM.dictationInput.value = '';
    DOM.dictationInput.disabled = false;
    DOM.dictationFeedback.style.display = 'none';
    DOM.dictationNextBtn.style.display = 'none';
    DOM.dictationRevealBtn.style.display = 'inline-flex';
    DOM.dictationSubmitBtn.disabled = false;
    
    DOM.dictationPlayBtn.className = "btn btn-primary play-btn-large";
    DOM.dictationPlayBtn.querySelector('span').textContent = "Listen to Idiom";
    
    // Wire play audio trigger
    DOM.dictationPlayBtn.onclick = () => {
        playIdiomAudio(activeUnitId, dictationState.currentIdiom.audioFile, DOM.dictationPlayBtn);
        DOM.dictationPlayBtn.className = "btn btn-primary play-btn-large playing";
        DOM.dictationPlayBtn.querySelector('span').textContent = "Playing Audio...";
    };

    // Dictation Submit
    DOM.dictationSubmitBtn.onclick = evaluateDictationSpelling;
    DOM.dictationInput.onkeydown = (e) => {
        if (e.key === 'Enter') evaluateDictationSpelling();
    };

    DOM.dictationRevealBtn.onclick = () => {
        DOM.dictationSolutionText.textContent = dictationState.currentIdiom.idiom;
        DOM.dictationFeedback.className = "dictation-feedback error";
        DOM.dictationFeedback.querySelector('.feedback-indicator').textContent = "Answer Revealed";
        DOM.dictationFeedback.querySelector('.feedback-message').textContent = dictationState.currentIdiom.definition;
        DOM.dictationFeedback.querySelector('.feedback-solution').style.display = 'block';
        DOM.dictationFeedback.style.display = 'block';
        
        DOM.dictationInput.disabled = true;
        DOM.dictationNextBtn.style.display = 'inline-flex';
        DOM.dictationRevealBtn.style.display = 'none';
        DOM.dictationSubmitBtn.disabled = true;
    };

    DOM.dictationNextBtn.onclick = loadNextDictationIdiom;
}

function evaluateDictationSpelling() {
    if (dictationState.isAnswered) return;
    
    const userSpelling = DOM.dictationInput.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const correctSpelling = dictationState.currentIdiom.idiom.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Fuzzy matching strings by stripping punctuation and articles
    const cleanWord = (str) => str.replace(/\b(a|an|the|to|your|someone|someone's)\b/g, '').replace(/[^a-z0-9]/g, '');
    const userClean = cleanWord(userSpelling);
    const correctClean = cleanWord(correctSpelling);
    
    if (userClean === correctClean || userSpelling === correctSpelling) {
        // CORRECT
        DOM.dictationFeedback.className = "dictation-feedback success";
        DOM.dictationFeedback.querySelector('.feedback-indicator').textContent = "Correct spelling!";
        DOM.dictationFeedback.querySelector('.feedback-message').textContent = dictationState.currentIdiom.definition;
        DOM.dictationFeedback.querySelector('.feedback-solution').style.display = 'none';
        DOM.dictationFeedback.style.display = 'block';
        
        // Complete card mastery sync
        const cardElement = document.querySelector(`.idiom-card[data-idiom-name="${dictationState.currentIdiom.idiom}"]`);
        if (cardElement && !cardElement.classList.contains('completed')) {
            toggleIdiomMastery(activeUnitId, dictationState.currentIdiom.idiom, cardElement);
        }
        
        DOM.dictationInput.disabled = true;
        DOM.dictationNextBtn.style.display = 'inline-flex';
        DOM.dictationRevealBtn.style.display = 'none';
        DOM.dictationSubmitBtn.disabled = true;
        dictationState.isAnswered = true;
    } else {
        // INCORRECT
        DOM.dictationFeedback.className = "dictation-feedback error";
        DOM.dictationFeedback.querySelector('.feedback-indicator').textContent = "Try again!";
        DOM.dictationFeedback.querySelector('.feedback-message').textContent = "Spelling is not quite right. Listen carefully and try once more.";
        DOM.dictationFeedback.querySelector('.feedback-solution').style.display = 'none';
        DOM.dictationFeedback.style.display = 'block';
    }
}

// ==========================================================================
// Helper Utility Functions
// ==========================================================================
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getPlayIconSVG() {
    return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
    `;
}

function getPauseIconSVG() {
    return `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
    `;
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ==========================================================================
// Exercise Answer Sheet Actions & Verification (Type Answers Panel)
// ==========================================================================

// Render dynamic exercise answer sheet inputs
function renderAnswerSheet(unit) {
    DOM.answerSheetBody.innerHTML = '';
    
    // Ensure answers structures exist
    if (!progress.exerciseAnswers) {
        progress.exerciseAnswers = {};
    }
    if (!progress.exerciseAnswers[unit.unitId]) {
        progress.exerciseAnswers[unit.unitId] = {};
    }
    
    const savedAnswers = progress.exerciseAnswers[unit.unitId];
    
    unit.idioms.forEach((item, index) => {
        const savedVal = savedAnswers[item.idiom] || '';
        const card = document.createElement('div');
        card.className = 'sheet-item';
        card.innerHTML = `
            <div class="sheet-item-prompt">${index + 1}. ${item.definition}</div>
            <div class="sheet-item-input-wrap">
                <input type="text" class="sheet-item-input" data-idiom="${item.idiom.replace(/"/g, '&quot;')}" value="${savedVal.replace(/"/g, '&quot;')}" placeholder="Type idiom..." autocomplete="off" spellcheck="false">
                <div class="sheet-item-status-icon"></div>
            </div>
            <div class="sheet-item-feedback" style="display: none;"></div>
        `;
        
        // Setup individual input change event to save draft progress as they type!
        const inputEl = card.querySelector('.sheet-item-input');
        inputEl.addEventListener('input', (e) => {
            progress.exerciseAnswers[unit.unitId][item.idiom] = e.target.value;
            localStorage.setItem('idiom_study_progress', JSON.stringify(progress));
        });
        
        DOM.answerSheetBody.appendChild(card);
    });
    
    // Hide scoreboard initially or show if answers have been checked before
    DOM.sheetScoreSummary.style.display = 'none';
    
    // If answers were already checked before, re-run validation on load to show correctness
    const hasAnswers = Object.values(savedAnswers).some(val => val !== '');
    if (hasAnswers) {
        checkExerciseAnswers(true); // check without saving again (silent mode)
    }
}

// Normalizes spelling for validation (e.g. smart/curly quotes, extra spaces)
function normalizeText(text) {
    return text.toLowerCase()
        .replace(/’/g, "'") // Normalize smart apostrophes
        .replace(/“/g, '"')
        .replace(/”/g, '"')
        .replace(/[^a-z0-9']/g, ' ') // Replace punctuation with space (allow apostrophes)
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
}

// Check typed answers
function checkExerciseAnswers(silent = false) {
    const unit = appData.find(u => u.unitId === activeUnitId);
    if (!unit) return;
    
    const items = DOM.answerSheetBody.querySelectorAll('.sheet-item');
    let correctCount = 0;
    let totalCount = items.length;
    
    items.forEach(itemCard => {
        const inputEl = itemCard.querySelector('.sheet-item-input');
        const statusIcon = itemCard.querySelector('.sheet-item-status-icon');
        const correctIdiom = inputEl.getAttribute('data-idiom');
        const userVal = inputEl.value;
        
        const normUser = normalizeText(userVal);
        const normCorrect = normalizeText(correctIdiom);
        
        itemCard.classList.remove('correct', 'incorrect');
        
        if (normUser === '') {
            statusIcon.innerHTML = '';
        } else if (normUser === normCorrect) {
            itemCard.classList.add('correct');
            statusIcon.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" width="16" height="16">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            correctCount++;
        } else {
            itemCard.classList.add('incorrect');
            statusIcon.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" width="16" height="16">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
        }
        
        if (!silent) {
            progress.exerciseAnswers[unit.unitId][correctIdiom] = userVal;
        }
    });
    
    // Display score summary
    DOM.sheetScoreValue.textContent = `${correctCount} / ${totalCount} correct`;
    DOM.sheetScoreSummary.style.display = 'flex';
    
    if (!silent) {
        saveProgress();
    }
}

// Reveal correct answers
function revealExerciseAnswers() {
    const unit = appData.find(u => u.unitId === activeUnitId);
    if (!unit) return;
    
    const items = DOM.answerSheetBody.querySelectorAll('.sheet-item');
    
    items.forEach(itemCard => {
        const inputEl = itemCard.querySelector('.sheet-item-input');
        const statusIcon = itemCard.querySelector('.sheet-item-status-icon');
        const correctIdiom = inputEl.getAttribute('data-idiom');
        
        inputEl.value = correctIdiom;
        itemCard.classList.remove('incorrect');
        itemCard.classList.add('correct');
        statusIcon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" width="16" height="16">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        
        progress.exerciseAnswers[unit.unitId][correctIdiom] = correctIdiom;
    });
    
    DOM.sheetScoreValue.textContent = `${items.length} / ${items.length} correct`;
    DOM.sheetScoreSummary.style.display = 'flex';
    
    saveProgress();
}

// ==========================================================================
// Text Annotation Whiteboard Tool (Create & Render Direct Page Typing)
// ==========================================================================

function createTextInput(canvasEl, pageNum, x, y, existingAnn = null) {
    const layerEl = canvasEl.id === 'drawingCanvasLeft' ? DOM.textAnnotationsLayerLeft : DOM.textAnnotationsLayerRight;
    if (!layerEl) return;

    // Blur existing inputs to commit them
    const activeInput = layerEl.querySelector('.canvas-text-input');
    if (activeInput) {
        activeInput.blur();
    }

    const xPercent = existingAnn ? existingAnn.xPercent : (x / canvasEl.width) * 100;
    const yPercent = existingAnn ? existingAnn.yPercent : (y / canvasEl.height) * 100;

    let existingWrap = null;
    if (existingAnn) {
        existingWrap = layerEl.querySelector(`[data-ann-id="${existingAnn.id}"]`);
        if (existingWrap) {
            existingWrap.style.display = 'none';
        }
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'canvas-text-input';
    input.style.left = `${xPercent}%`;
    input.style.top = `${yPercent}%`;
    input.value = existingAnn ? existingAnn.text : '';

    layerEl.appendChild(input);
    input.focus();

    let committed = false;

    function commitText() {
        if (committed) return;
        committed = true;

        const textVal = input.value.trim();
        if (!progress.textAnnotations[pageNum]) {
            progress.textAnnotations[pageNum] = [];
        }

        if (existingAnn) {
            if (textVal === '') {
                progress.textAnnotations[pageNum] = progress.textAnnotations[pageNum].filter(a => a.id !== existingAnn.id);
            } else {
                const found = progress.textAnnotations[pageNum].find(a => a.id === existingAnn.id);
                if (found) {
                    found.text = textVal;
                }
            }
        } else if (textVal !== '') {
            progress.textAnnotations[pageNum].push({
                id: Date.now() + '-' + Math.floor(Math.random() * 1000),
                text: textVal,
                xPercent: xPercent,
                yPercent: yPercent
            });
        }

        saveProgress();
        renderTextAnnotations(pageNum, layerEl);
        input.remove();
    }

    function cancelText() {
        if (committed) return;
        committed = true;
        if (existingWrap) {
            existingWrap.style.display = '';
        }
        input.remove();
    }

    input.addEventListener('blur', commitText);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitText();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelText();
        }
    });
}

function renderTextAnnotations(pageNum, layerEl) {
    if (!layerEl) return;
    layerEl.innerHTML = '';

    const annotations = progress.textAnnotations[pageNum] || [];
    const canvasEl = layerEl.id === 'textAnnotationsLayerLeft' ? DOM.drawingCanvasLeft : DOM.drawingCanvasRight;

    annotations.forEach(ann => {
        const wrap = document.createElement('div');
        wrap.className = 'text-annotation-wrap';
        wrap.style.left = `${ann.xPercent}%`;
        wrap.style.top = `${ann.yPercent}%`;
        wrap.setAttribute('data-ann-id', ann.id);

        const span = document.createElement('span');
        span.className = 'text-annotation';
        span.textContent = ann.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-annotation-delete-btn';
        deleteBtn.title = 'Delete';
        deleteBtn.textContent = '×';

        wrap.appendChild(span);
        wrap.appendChild(deleteBtn);

        wrap.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const pixelX = (ann.xPercent / 100) * canvasEl.width;
            const pixelY = (ann.yPercent / 100) * canvasEl.height;
            createTextInput(canvasEl, pageNum, pixelX, pixelY, ann);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            progress.textAnnotations[pageNum] = progress.textAnnotations[pageNum].filter(a => a.id !== ann.id);
            saveProgress();
            renderTextAnnotations(pageNum, layerEl);
        });

        layerEl.appendChild(wrap);
    });
}
