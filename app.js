/* ==========================================================================
   Celine Dion Clock - Application Logic & Web Audio API Synthesizer
   ========================================================================== */

// --- Global State ---
let audioCtx = null;
let currentSynthNodes = []; // Track active oscillators/nodes to stop them
let isPlaying = false;
let playbackTimeoutId = null;
let visualizerAnimationId = null;
let analyserNode = null;

// Quotes Database
const CELINE_QUOTES = [
    { text: "I've never been cool - and I don't care.", context: "Interview, 2013" },
    { text: "My music is my way of speaking. It's my therapy, my strength.", context: "Press Conference" },
    { text: "There are no rules in love, and there are no rules in music.", context: "Las Vegas Residency" },
    { text: "If you follow your dreams, it means you follow your heart.", context: "A New Day Has Come Tour" },
    { text: "I don't know if I'm a diva. But I'm a worker.", context: "Behind the Music" },
    { text: "The hardest thing to find in life is balance - especially the more success you have.", context: "Vogue Interview" },
    { text: "My heart will go on... and on, and on, and on!", context: "Behind the Scenes" },
    { text: "I have always been a very positive person, and I think it's very important to keep moving forward.", context: "Recovery Journal" },
    { text: "We all have our own dreams. I'm lucky I have the opportunity to live mine.", context: "Grammy Awards speech" }
];

// Synth Songs & Notes Definitions
// Frequencies mapping for Octave 4 and 5
const NOTE_FREQS = {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'REST': 0
};

const SONGS = {
    'my-heart-will-go-on-intro': {
        title: "My Heart Will Go On (Tin Whistle Intro)",
        instrument: "whistle",
        tempo: 125, // BPM
        notes: [
            { note: 'F#4', dur: 0.75 }, { note: 'G#4', dur: 0.75 }, { note: 'A4', dur: 1.5 },
            { note: 'G#4', dur: 0.75 }, { note: 'F#4', dur: 0.75 }, { note: 'E4', dur: 1.5 },
            { note: 'F#4', dur: 0.75 }, { note: 'B4', dur: 1.5 }, { note: 'A4', dur: 1.5 }, { note: 'G#4', dur: 2.25 },
            
            { note: 'F#4', dur: 0.75 }, { note: 'G#4', dur: 0.75 }, { note: 'A4', dur: 1.5 },
            { note: 'G#4', dur: 0.75 }, { note: 'F#4', dur: 0.75 }, { note: 'E4', dur: 1.5 },
            { note: 'D#4', dur: 1.5 }, { note: 'E4', dur: 3.0 }
        ]
    },
    'my-heart-will-go-on-chorus': {
        title: "My Heart Will Go On (Chorus)",
        instrument: "vocal",
        tempo: 110,
        notes: [
            // "Near, far, wherever you are..."
            { note: 'G#4', dur: 1.0 }, { note: 'A4', dur: 0.5 }, { note: 'B4', dur: 2.0 },
            { note: 'A4', dur: 1.0 }, { note: 'G#4', dur: 0.5 }, { note: 'F#4', dur: 2.0 },
            { note: 'G#4', dur: 1.0 }, { note: 'A4', dur: 0.5 }, { note: 'G#4', dur: 1.0 }, { note: 'F#4', dur: 0.5 }, { note: 'E4', dur: 2.0 },
            { note: 'D#4', dur: 1.5 }, { note: 'E4', dur: 2.5 },
            
            // "I believe that the heart does go on..."
            { note: 'G#4', dur: 1.0 }, { note: 'A4', dur: 0.5 }, { note: 'B4', dur: 2.0 },
            { note: 'A4', dur: 1.0 }, { note: 'G#4', dur: 0.5 }, { note: 'F#4', dur: 2.0 },
            { note: 'G#4', dur: 1.0 }, { note: 'A4', dur: 0.5 }, { note: 'G#4', dur: 1.0 }, { note: 'F#4', dur: 0.5 }, { note: 'E4', dur: 2.0 },
            { note: 'E4', dur: 1.0 }, { note: 'D#4', dur: 1.0 }, { note: 'E4', dur: 1.0 }, { note: 'F#4', dur: 1.0 }, { note: 'G#4', dur: 3.0 }
        ]
    },
    'its-all-coming-back': {
        title: "It's All Coming Back to Me Now",
        instrument: "piano",
        tempo: 130,
        notes: [
            // Opening piano and vocal hook
            { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'A4', dur: 2.0 },
            { note: 'G4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'G4', dur: 1.0 }, { note: 'E4', dur: 1.0 }, { note: 'D4', dur: 2.0 },
            { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'A4', dur: 2.0 },
            { note: 'B4', dur: 1.0 }, { note: 'A4', dur: 1.0 }, { note: 'G4', dur: 3.0 }
        ]
    },
    'all-by-myself': {
        title: "All By Myself (The High Note)",
        instrument: "vocal",
        tempo: 100,
        notes: [
            // High note build up and peak
            { note: 'F#4', dur: 1.0 }, { note: 'G#4', dur: 1.0 }, { note: 'A4', dur: 1.5 },
            { note: 'B4', dur: 1.5 }, { note: 'C#5', dur: 1.5 }, { note: 'D5', dur: 1.5 },
            { note: 'E5', dur: 4.5 } // The peak power note!
        ]
    }
};

// --- DOM Elements ---
const clockTime = document.getElementById('clock-time');
const clockAmpm = document.getElementById('clock-ampm');
const clockDate = document.getElementById('clock-date');

const vinylDisc = document.getElementById('vinyl-disc');
const btnPlay = document.getElementById('btn-play');
const btnStop = document.getElementById('btn-stop');
const songSelect = document.getElementById('song-select');
const currentTrackTitle = document.getElementById('current-track-title');

const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Alarm Elements
const alarmHours = document.getElementById('alarm-hours');
const alarmMinutes = document.getElementById('alarm-minutes');
const btnSetAlarm = document.getElementById('btn-set-alarm');
const alarmStatusText = document.getElementById('alarm-status-text');
const alarmModal = document.getElementById('alarm-modal');
const btnDismissAlarm = document.getElementById('btn-dismiss-alarm');
const alarmMelodyName = document.getElementById('alarm-melody-name');

// Timer Elements
const timerMin = document.getElementById('timer-min');
const timerSec = document.getElementById('timer-sec');
const btnTimerStart = document.getElementById('btn-timer-start');
const btnTimerReset = document.getElementById('btn-timer-reset');
const timerCountdown = document.getElementById('timer-countdown');

// Stopwatch Elements
const stopwatchTime = document.getElementById('stopwatch-time');
const btnStopwatchStart = document.getElementById('btn-stopwatch-start');
const btnStopwatchLap = document.getElementById('btn-stopwatch-lap');
const btnStopwatchReset = document.getElementById('btn-stopwatch-reset');
const lapsList = document.getElementById('laps-list');

// Quotes Elements
const quoteText = document.getElementById('quote-text');
const quoteContext = document.getElementById('quote-context');
const btnNextQuote = document.getElementById('btn-next-quote');

// Visualizer Canvas
const canvas = document.getElementById('audio-visualizer');
const canvasCtx = canvas.getContext('2d');

// --- Alarm State & Timer State ---
let alarmTime = null;
let isAlarmRinging = false;

let timerInterval = null;
let timerTimeLeft = 0; // in seconds
let isTimerRunning = false;

let stopwatchInterval = null;
let stopwatchStart = 0;
let stopwatchElapsed = 0;
let isStopwatchRunning = false;
let stopwatchLaps = [];

// Resize visualizer canvas
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- 1. Clock Display Ticker ---
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = String(hours).padStart(2, '0');
    
    clockTime.textContent = `${hoursStr}:${minutes}:${seconds}`;
    clockAmpm.textContent = ampm;

    // Format Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    clockDate.textContent = now.toLocaleDateString('en-US', options);

    // Check alarm
    if (alarmTime && !isAlarmRinging) {
        const currentHours = now.getHours();
        const currentMins = now.getMinutes();
        if (currentHours === alarmTime.hours && currentMins === alarmTime.minutes && now.getSeconds() === 0) {
            triggerAlarm();
        }
    }
}
setInterval(updateClock, 1000);
updateClock();

// --- 2. Tabs Navigation ---
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`tab-${tabId}`).classList.add('active');
    });
});

// --- 3. Quotes Generator ---
function showNextQuote() {
    quoteText.style.opacity = 0;
    quoteContext.style.opacity = 0;
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * CELINE_QUOTES.length);
        const quote = CELINE_QUOTES[randomIndex];
        quoteText.textContent = `"${quote.text}"`;
        quoteContext.textContent = `— Céline Dion, ${quote.context}`;
        quoteText.style.opacity = 1;
        quoteContext.style.opacity = 1;
    }, 200);
}
btnNextQuote.addEventListener('click', showNextQuote);
// Initial quote animation styles
quoteText.style.transition = "opacity 0.2s ease";
quoteContext.style.transition = "opacity 0.2s ease";

// --- 4. Audio Synthesizer (Web Audio API) ---
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 128;
        analyserNode.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Stop current synth notes
function stopSynth() {
    clearTimeout(playbackTimeoutId);
    currentSynthNodes.forEach(node => {
        try {
            node.stop();
        } catch(e) {}
    });
    currentSynthNodes = [];
    isPlaying = false;
    vinylDisc.classList.remove('playing');
    btnPlay.innerHTML = '<i class="fas fa-play"></i>';
}

// Play note helper
function playNote(freq, startTime, duration, instrumentType = 'whistle') {
    if (freq === 0) return; // REST note

    const oscNode = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Low pass filter to make it sound premium and soft rather than harsh chiptune
    const filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    
    // Delay effect node (Reverb feel)
    const delayNode = audioCtx.createDelay(1.0);
    const delayGain = audioCtx.createGain();
    
    delayNode.delayTime.value = 0.25; // Delay echo timing
    delayGain.gain.value = 0.35; // Feed back volume

    // Configure instrument sounds
    if (instrumentType === 'whistle') {
        // Tin whistle flute: Triangle wave + lowpass filter + slight vibrato
        oscNode.type = 'triangle';
        filterNode.frequency.value = 1200;
        
        // Add Vibrato (LFO)
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 5.5; // Vibrato speed
        lfoGain.gain.value = 4; // Vibrato depth (Hz)
        lfo.connect(lfoGain);
        lfoGain.connect(oscNode.frequency);
        lfo.start(startTime);
        currentSynthNodes.push(lfo);
    } else if (instrumentType === 'vocal') {
        // Diva vocal run synth: Sine wave mixed with a bit of filtered triangle for depth
        oscNode.type = 'sine';
        filterNode.frequency.value = 1600;
        
        // Portamento/Vibrato to sound like rich vocal runs
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 6;
        lfoGain.gain.value = 6;
        lfo.connect(lfoGain);
        lfoGain.connect(oscNode.frequency);
        lfo.start(startTime);
        currentSynthNodes.push(lfo);
    } else {
        // Piano/Synth pad: Triangle with quick decay
        oscNode.type = 'sine';
        filterNode.frequency.value = 800;
    }

    // ADSR Envelope
    const attack = 0.08;
    const decay = 0.1;
    const sustain = 0.65;
    const release = 0.25;
    
    const sustainTime = duration - attack - decay;
    const sTime = sustainTime > 0 ? sustainTime : 0;
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.5, startTime + attack); // Peak
    gainNode.gain.exponentialRampToValueAtTime(sustain * 0.5, startTime + attack + decay); // Sustain
    gainNode.gain.setValueAtTime(sustain * 0.5, startTime + attack + decay + sTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration + release); // Release

    // Connections: Osc -> Filter -> Gain -> Analyser & Delay
    oscNode.connect(filterNode);
    filterNode.connect(gainNode);
    
    // Main connection
    gainNode.connect(analyserNode);

    // Feedback Delay loops
    gainNode.connect(delayNode);
    delayNode.connect(delayGain);
    delayGain.connect(delayNode); // feedback
    delayGain.connect(analyserNode); // send to output

    oscNode.start(startTime);
    oscNode.stop(startTime + duration + release + 0.1);
    
    currentSynthNodes.push(oscNode);
    currentSynthNodes.push(gainNode);
}

// Play selected song
function playSong(songKey) {
    initAudio();
    stopSynth();
    
    isPlaying = true;
    vinylDisc.classList.add('playing');
    btnPlay.innerHTML = '<i class="fas fa-pause"></i>';
    
    const song = SONGS[songKey];
    currentTrackTitle.textContent = song.title;
    
    const beatDuration = 60 / song.tempo; // time of 1 beat in seconds
    let playCursor = audioCtx.currentTime + 0.2; // slight padding
    
    song.notes.forEach((noteObj, index) => {
        const noteFreq = NOTE_FREQS[noteObj.note];
        const noteDuration = noteObj.dur * beatDuration;
        
        playNote(noteFreq, playCursor, noteDuration, song.instrument);
        playCursor += noteDuration;
    });

    // Schedule stop state when song is finished
    const totalDurationSeconds = (playCursor - audioCtx.currentTime) * 1000;
    playbackTimeoutId = setTimeout(() => {
        stopSynth();
    }, totalDurationSeconds);
}

// Button Events for Player
btnPlay.addEventListener('click', () => {
    if (isPlaying) {
        stopSynth();
    } else {
        playSong(songSelect.value);
    }
});

btnStop.addEventListener('click', () => {
    stopSynth();
});

songSelect.addEventListener('change', () => {
    if (isPlaying) {
        playSong(songSelect.value);
    } else {
        const song = SONGS[songSelect.value];
        currentTrackTitle.textContent = song.title;
    }
});

// Set default track info on load
currentTrackTitle.textContent = SONGS[songSelect.value].title;

// --- 5. Audio Visualizer Renderer ---
function drawVisualizer() {
    visualizerAnimationId = requestAnimationFrame(drawVisualizer);
    
    const width = canvas.width;
    const height = canvas.height;
    canvasCtx.clearRect(0, 0, width, height);

    if (analyserNode && isPlaying) {
        // Draw frequency bars
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2.5; // Scale height

            // Draw glowing gradients
            const gradient = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, '#b76e79'); // Rose Gold
            gradient.addColorStop(1, '#d4af37'); // Gold

            canvasCtx.fillStyle = gradient;
            canvasCtx.shadowBlur = 10;
            canvasCtx.shadowColor = 'rgba(212, 175, 55, 0.4)';
            
            canvasCtx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
            x += barWidth;
        }
    } else {
        // Idle animation: Smooth wave that matches the rhythm of the clock
        canvasCtx.shadowBlur = 0;
        canvasCtx.beginPath();
        canvasCtx.lineWidth = 2.5;
        
        // Gradient color for idle wave
        const gradient = canvasCtx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(183, 110, 121, 0.5)');
        gradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.5)');
        gradient.addColorStop(1, 'rgba(183, 110, 121, 0.5)');
        canvasCtx.strokeStyle = gradient;

        const time = Date.now() * 0.003;
        for (let x = 0; x < width; x++) {
            const y = height / 2 + Math.sin(x * 0.015 + time) * 12;
            if (x === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
        }
        canvasCtx.stroke();
    }
}
drawVisualizer();

// --- 6. Alarm Logic ---
btnSetAlarm.addEventListener('click', () => {
    const hrs = parseInt(alarmHours.value);
    const mins = parseInt(alarmMinutes.value);
    
    if (isNaN(hrs) || isNaN(mins) || hrs < 0 || hrs > 23 || mins < 0 || mins > 59) {
        alarmStatusText.textContent = "Invalid hours or minutes!";
        alarmStatusText.style.color = "var(--danger)";
        return;
    }
    
    alarmTime = { hours: hrs, minutes: mins };
    alarmStatusText.textContent = `Alarm set for ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    alarmStatusText.style.color = "var(--gold)";
});

function triggerAlarm() {
    isAlarmRinging = true;
    alarmModal.classList.add('active');
    
    // Choose the alarm song (My Heart Will Go On - Chorus is default for alarms)
    const alarmSongKey = 'my-heart-will-go-on-chorus';
    alarmMelodyName.textContent = SONGS[alarmSongKey].title;
    
    // Continuous loop of alarm melody until dismissed
    const ring = () => {
        if (!isAlarmRinging) return;
        playSong(alarmSongKey);
        // Reschedule next loop based on song duration
        const totalDuration = SONGS[alarmSongKey].notes.reduce((acc, note) => acc + (note.dur * (60 / SONGS[alarmSongKey].tempo)), 0) + 1;
        playbackTimeoutId = setTimeout(ring, totalDuration * 1000);
    };
    ring();
}

btnDismissAlarm.addEventListener('click', () => {
    isAlarmRinging = false;
    stopSynth();
    alarmModal.classList.remove('active');
    alarmStatusText.textContent = "No alarm set";
    alarmTime = null;
    alarmHours.value = "";
    alarmMinutes.value = "";
});

// --- 7. Timer Logic ---
function updateTimerDisplay() {
    const mins = Math.floor(timerTimeLeft / 60);
    const secs = timerTimeLeft % 60;
    timerCountdown.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

btnTimerStart.addEventListener('click', () => {
    if (isTimerRunning) {
        // Pause timer
        clearInterval(timerInterval);
        isTimerRunning = false;
        btnTimerStart.textContent = "Start";
        btnTimerStart.className = "btn btn-primary";
    } else {
        // Start/Resume timer
        const minVal = parseInt(timerMin.value) || 0;
        const secVal = parseInt(timerSec.value) || 0;
        
        if (!timerTimeLeft && (minVal > 0 || secVal > 0)) {
            timerTimeLeft = minVal * 60 + secVal;
        }
        
        if (timerTimeLeft > 0) {
            isTimerRunning = true;
            btnTimerStart.textContent = "Pause";
            btnTimerStart.className = "btn btn-secondary";
            updateTimerDisplay();
            
            timerInterval = setInterval(() => {
                timerTimeLeft--;
                updateTimerDisplay();
                
                if (timerTimeLeft <= 0) {
                    clearInterval(timerInterval);
                    isTimerRunning = false;
                    btnTimerStart.textContent = "Start";
                    btnTimerStart.className = "btn btn-primary";
                    triggerTimerChime();
                }
            }, 1000);
        }
    }
});

btnTimerReset.addEventListener('click', () => {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerTimeLeft = 0;
    btnTimerStart.textContent = "Start";
    btnTimerStart.className = "btn btn-primary";
    timerMin.value = 5;
    timerSec.value = 0;
    timerCountdown.textContent = "05:00";
});

function triggerTimerChime() {
    initAudio();
    // Rapid arpeggio chime to indicate timer completion
    const startTime = audioCtx.currentTime;
    const chimeNotes = ['C5', 'E5', 'G5', 'C6'];
    chimeNotes.forEach((note, idx) => {
        playNote(NOTE_FREQS[note], startTime + (idx * 0.12), 0.25, 'piano');
    });
    alert("Céline Dion Clock: Timer completed!");
}

// --- 8. Stopwatch Logic ---
function updateStopwatchDisplay() {
    const elapsed = stopwatchElapsed + (isStopwatchRunning ? Date.now() - stopwatchStart : 0);
    const ms = Math.floor((elapsed % 1000) / 10);
    const secs = Math.floor((elapsed / 1000) % 60);
    const mins = Math.floor((elapsed / 60000) % 60);
    const hrs = Math.floor(elapsed / 3600000);
    
    const msStr = String(ms).padStart(2, '0');
    const secsStr = String(secs).padStart(2, '0');
    const minsStr = String(mins).padStart(2, '0');
    const hrsStr = String(hrs).padStart(2, '0');
    
    stopwatchTime.textContent = `${hrsStr}:${minsStr}:${secsStr}.${msStr}`;
}

btnStopwatchStart.addEventListener('click', () => {
    if (isStopwatchRunning) {
        // Pause stopwatch
        stopwatchElapsed += Date.now() - stopwatchStart;
        clearInterval(stopwatchInterval);
        isStopwatchRunning = false;
        btnStopwatchStart.textContent = "Start";
        btnStopwatchStart.className = "btn btn-primary";
        btnStopwatchLap.disabled = true;
    } else {
        // Start stopwatch
        stopwatchStart = Date.now();
        isStopwatchRunning = true;
        btnStopwatchStart.textContent = "Pause";
        btnStopwatchStart.className = "btn btn-secondary";
        btnStopwatchLap.disabled = false;
        
        stopwatchInterval = setInterval(updateStopwatchDisplay, 33); // approx 30 fps
    }
});

btnStopwatchLap.addEventListener('click', () => {
    if (isStopwatchRunning) {
        const currentLapTime = stopwatchElapsed + (Date.now() - stopwatchStart);
        stopwatchLaps.push(currentLapTime);
        
        const ms = Math.floor((currentLapTime % 1000) / 10);
        const secs = Math.floor((currentLapTime / 1000) % 60);
        const mins = Math.floor((currentLapTime / 60000) % 60);
        const hrs = Math.floor(currentLapTime / 3600000);
        
        const timeStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
        
        const li = document.createElement('li');
        li.innerHTML = `<span class="lap-index">Lap ${stopwatchLaps.length}</span><span class="lap-time">${timeStr}</span>`;
        lapsList.prepend(li);
    }
});

btnStopwatchReset.addEventListener('click', () => {
    clearInterval(stopwatchInterval);
    isStopwatchRunning = false;
    stopwatchElapsed = 0;
    stopwatchLaps = [];
    btnStopwatchStart.textContent = "Start";
    btnStopwatchStart.className = "btn btn-primary";
    btnStopwatchLap.disabled = true;
    stopwatchTime.textContent = "00:00:00.00";
    lapsList.innerHTML = "";
});
