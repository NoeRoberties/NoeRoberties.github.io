/* ==========================================================================
   Céline Dion Compte à Rebours & Entraînement - Logique & Synthétiseur
   ========================================================================== */

// --- Variables Globales ---
let audioCtx = null;
let currentSynthNodes = []; // Oscillateurs et gains actifs
let isPlaying = false;
let playbackTimeoutId = null;
let visualizerAnimationId = null;
let analyserNode = null;

// État du Karaoké / Paroles
let activeSongKey = null;
let songStartTime = 0;
let lyricsIntervalId = null;

// Citations de Céline Dion (en Français)
const CELINE_QUOTES = [
    { text: "Je n'ai jamais été branchée, et je m'en fiche royalement.", context: "Interview TV, 2013" },
    { text: "Ma musique est ma façon de m'exprimer. C'est ma thérapie, ma force.", context: "Conférence de presse" },
    { text: "Il n'y a pas de règles en amour, et il n'y a pas de règles en musique.", context: "Spectacle à Las Vegas" },
    { text: "Si tu suis tes rêves, cela signifie que tu suis ton cœur.", context: "Tournée A New Day" },
    { text: "Je ne sais pas si je suis une diva. Mais je suis une grande bosseuse.", context: "Reportage Biographique" },
    { text: "Le plus difficile dans la vie, c'est de trouver un équilibre - surtout avec le succès.", context: "Interview Vogue" },
    { text: "Mon cœur continuera de battre... seconde après seconde.", context: "Coulisses, Titanic Theme" },
    { text: "J'ai toujours été une personne très positive, il faut aller de l'avant.", context: "Journal de convalescence" },
    { text: "Nous avons tous nos propres rêves. J'ai de la chance de vivre le mien.", context: "Discours des Grammy Awards" }
];

// Féquences des notes pour le synthétiseur (Octaves 3, 4 et 5)
const NOTE_FREQS = {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'REST': 0
};

// Base de données des chansons avec notes (musique) et paroles synchronisées
const SONGS = {
    'pour-que-tu-maimes-encore': {
        title: "Pour que tu m'aimes encore",
        instrument: "vocal",
        tempo: 96,
        notes: [
            // Refrain : "J'irai chercher ton cœur..."
            { note: 'F#4', dur: 1.0 }, { note: 'A4', dur: 1.0 }, { note: 'G#4', dur: 1.0 }, { note: 'F#4', dur: 1.0 },
            { note: 'E4', dur: 1.0 }, { note: 'F#4', dur: 1.0 }, { note: 'REST', dur: 0.5 }, { note: 'F#4', dur: 0.5 }, { note: 'F#4', dur: 1.0 },
            { note: 'F#4', dur: 1.0 }, { note: 'A4', dur: 1.0 }, { note: 'G#4', dur: 1.0 }, { note: 'F#4', dur: 1.0 },
            { note: 'E4', dur: 1.0 }, { note: 'F#4', dur: 1.0 }, { note: 'REST', dur: 0.5 }, { note: 'F#4', dur: 0.5 }, { note: 'F#4', dur: 1.0 },
            { note: 'F#4', dur: 1.0 }, { note: 'A4', dur: 1.0 }, { note: 'G#4', dur: 1.0 }, { note: 'F#4', dur: 1.0 },
            { note: 'E4', dur: 1.0 }, { note: 'F#4', dur: 1.0 }, { note: 'A4', dur: 1.0 }, { note: 'B4', dur: 1.0 },
            { note: 'C#5', dur: 1.5 }, { note: 'B4', dur: 1.0 }, { note: 'A4', dur: 1.0 }, { note: 'B4', dur: 2.5 }
        ],
        lyrics: [
            { time: 0.0, text: "♫ Préparez-vous à chanter... ♫" },
            { time: 1.2, text: "J'irai chercher ton cœur..." },
            { time: 3.5, text: "Si tu l'emportes ailleurs..." },
            { time: 6.2, text: "Même si dans tes danses..." },
            { time: 8.8, text: "D'autres dansent tes heures..." },
            { time: 11.2, text: "J'irai chercher ton âme..." },
            { time: 13.6, text: "Dans les froids, dans les flammes..." },
            { time: 16.2, text: "Je te jetterai des sorts..." },
            { time: 18.8, text: "Pour que tu m'aimes encore..." },
            { time: 22.0, text: "♫ Excellent ! Continuez l'entraînement ! ♫" }
        ]
    },
    'my-heart-will-go-on': {
        title: "My Heart Will Go On",
        instrument: "whistle",
        tempo: 105,
        notes: [
            // Refrain : "Near, far, wherever you are..."
            { note: 'G#4', dur: 1.0 }, { note: 'A4', dur: 0.5 }, { note: 'B4', dur: 2.0 },
            { note: 'A4', dur: 1.0 }, { note: 'G#4', dur: 0.5 }, { note: 'F#4', dur: 2.0 },
            { note: 'G#4', dur: 1.0 }, { note: 'A4', dur: 0.5 }, { note: 'G#4', dur: 1.0 }, { note: 'F#4', dur: 0.5 }, { note: 'E4', dur: 2.0 },
            { note: 'D#4', dur: 1.5 }, { note: 'E4', dur: 2.5 }
        ],
        lyrics: [
            { time: 0.0, text: "♫ My Heart Will Go On ♫" },
            { time: 1.0, text: "Near, far..." },
            { time: 2.8, text: "Wherever you are..." },
            { time: 5.2, text: "I believe that the heart..." },
            { time: 8.0, text: "Does go on..." },
            { time: 10.2, text: "Once more, you open the door..." },
            { time: 13.0, text: "And you're here in my heart..." },
            { time: 15.5, text: "And my heart will go on..." }
        ]
    },
    'sil-suffisait-daimer': {
        title: "S'il suffisait d'aimer",
        instrument: "vocal",
        tempo: 90,
        notes: [
            // Refrain : "S'il suffisait d'aimer..."
            { note: 'E4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'A4', dur: 1.5 },
            { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 1.0 }, { note: 'D4', dur: 2.0 },
            { note: 'E4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'A4', dur: 1.5 },
            { note: 'B4', dur: 1.0 }, { note: 'A4', dur: 2.5 }
        ],
        lyrics: [
            { time: 0.0, text: "♫ S'il suffisait d'aimer ♫" },
            { time: 1.0, text: "S'il suffisait d'aimer..." },
            { time: 3.5, text: "Si l'on pouvait changer les choses..." },
            { time: 6.2, text: "Et tout recommencer..." },
            { time: 8.8, text: "S'il suffisait d'aimer..." },
            { time: 11.2, text: "Nous ferions de ce monde un rêve..." }
        ]
    }
};

// --- Éléments du DOM ---
const cdDays = document.getElementById('cd-days');
const cdHours = document.getElementById('cd-hours');
const cdMinutes = document.getElementById('cd-minutes');
const cdSeconds = document.getElementById('cd-seconds');

const quoteText = document.getElementById('quote-text');
const quoteContext = document.getElementById('quote-context');
const btnNextQuote = document.getElementById('btn-next-quote');

// Entraînement Karaoké
const btnLaunchTraining = document.getElementById('btn-launch-training');
const karaokeBoard = document.getElementById('karaoke-board');
const currentTrackName = document.getElementById('current-track-name');
const lyricPrev = document.getElementById('lyric-prev');
const lyricActive = document.getElementById('lyric-active');
const lyricNext = document.getElementById('lyric-next');
const karaokeControls = document.getElementById('karaoke-controls');
const btnStopKaraoke = document.getElementById('btn-stop-karaoke');

// Canevas de Visualisation
const canvas = document.getElementById('audio-visualizer');
const canvasCtx = canvas.getContext('2d');

// --- 1. Compte à Rebours (7 Octobre 2026 à 19h30) ---
// Note: Octobre est le mois indexé 9 en JS (0 = Janvier)
const TARGET_DATE = new Date(2026, 9, 7, 19, 30, 0);

function updateCountdown() {
    const now = new Date();
    const diff = TARGET_DATE - now;

    if (diff <= 0) {
        cdDays.textContent = "00";
        cdHours.textContent = "00";
        cdMinutes.textContent = "00";
        cdSeconds.textContent = "00";
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    cdDays.textContent = String(days).padStart(2, '0');
    cdHours.textContent = String(hours).padStart(2, '0');
    cdMinutes.textContent = String(minutes).padStart(2, '0');
    cdSeconds.textContent = String(seconds).padStart(2, '0');
}
setInterval(updateCountdown, 1000);
updateCountdown();

// --- 2. Citations de Céline ---
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
    }, 250);
}
btnNextQuote.addEventListener('click', showNextQuote);
quoteText.style.transition = "opacity 0.25s ease";
quoteContext.style.transition = "opacity 0.25s ease";

// --- 3. Initialisation Audio ---
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

// --- 4. Synthétiseur & Séquenceur de Notes ---
function stopSynth() {
    clearTimeout(playbackTimeoutId);
    clearInterval(lyricsIntervalId);
    
    currentSynthNodes.forEach(node => {
        try {
            node.stop();
        } catch(e) {}
    });
    currentSynthNodes = [];
    
    isPlaying = false;
    activeSongKey = null;
    
    currentTrackName.textContent = "Choisissez un chant";
    lyricPrev.textContent = "...";
    lyricActive.textContent = "Cliquez ci-dessus pour vous entraîner !";
    lyricNext.textContent = "...";
    
    karaokeControls.style.display = "none";
    btnLaunchTraining.style.display = "inline-flex";
}

function playNote(freq, startTime, duration, instrumentType = 'vocal') {
    if (freq === 0) return; // Note Silence (REST)

    const oscNode = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filterNode = audioCtx.createBiquadFilter();
    
    filterNode.type = 'lowpass';

    // Effet d'écho / delay spatial
    const delayNode = audioCtx.createDelay(1.0);
    const delayGain = audioCtx.createGain();
    delayNode.delayTime.value = 0.3; 
    delayGain.gain.value = 0.3; 

    if (instrumentType === 'whistle') {
        // Flûte irlandaise : onde triangle + filtre passe-bas + vibrato
        oscNode.type = 'triangle';
        filterNode.frequency.value = 1400;
        
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 6; 
        lfoGain.gain.value = 5; 
        lfo.connect(lfoGain);
        lfoGain.connect(oscNode.frequency);
        lfo.start(startTime);
        currentSynthNodes.push(lfo);
    } else {
        // Voix Céline : onde sinus + vibrato de diva pour moduler la voix
        oscNode.type = 'sine';
        filterNode.frequency.value = 1800;
        
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 5.5; 
        lfoGain.gain.value = 7; 
        lfo.connect(lfoGain);
        lfoGain.connect(oscNode.frequency);
        lfo.start(startTime);
        currentSynthNodes.push(lfo);
    }

    // Enveloppe sonore ADSR
    const attack = 0.08;
    const decay = 0.1;
    const sustain = 0.65;
    const release = 0.3;
    
    const sustainTime = duration - attack - decay;
    const sTime = sustainTime > 0 ? sustainTime : 0;
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.4, startTime + attack); 
    gainNode.gain.exponentialRampToValueAtTime(sustain * 0.4, startTime + attack + decay); 
    gainNode.gain.setValueAtTime(sustain * 0.4, startTime + attack + decay + sTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration + release); 

    // Connexions
    oscNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(analyserNode);

    // Connexions de l'écho
    gainNode.connect(delayNode);
    delayNode.connect(delayGain);
    delayGain.connect(delayNode); 
    delayGain.connect(analyserNode); 

    oscNode.start(startTime);
    oscNode.stop(startTime + duration + release + 0.1);
    
    currentSynthNodes.push(oscNode);
    currentSynthNodes.push(gainNode);
}

// Jouer une chanson et synchroniser les paroles
function playSong(songKey) {
    initAudio();
    stopSynth();
    
    isPlaying = true;
    activeSongKey = songKey;
    songStartTime = audioCtx.currentTime;
    
    const song = SONGS[songKey];
    currentTrackName.textContent = song.title;
    
    karaokeControls.style.display = "flex";
    btnLaunchTraining.style.display = "none";
    
    const beatDuration = 60 / song.tempo;
    let playCursor = audioCtx.currentTime + 0.2; 
    
    song.notes.forEach(noteObj => {
        const noteFreq = NOTE_FREQS[noteObj.note];
        const noteDuration = noteObj.dur * beatDuration;
        
        playNote(noteFreq, playCursor, noteDuration, song.instrument);
        playCursor += noteDuration;
    });

    // Boucle de mise à jour des paroles du Karaoké (100ms)
    lyricsIntervalId = setInterval(() => {
        updateLyrics(songKey);
    }, 100);

    // Arrêt automatique à la fin
    const totalDurationSeconds = (playCursor - audioCtx.currentTime) * 1000;
    playbackTimeoutId = setTimeout(() => {
        stopSynth();
    }, totalDurationSeconds);
}

// Mise à jour des paroles (Board à 3 lignes)
function updateLyrics(songKey) {
    if (!audioCtx || !isPlaying) return;
    
    const elapsed = audioCtx.currentTime - songStartTime;
    const song = SONGS[songKey];
    const lyrics = song.lyrics;
    
    // Trouver l'indice de la parole active
    let activeIndex = 0;
    for (let i = 0; i < lyrics.length; i++) {
        if (elapsed >= lyrics[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }
    
    // Remplir les 3 lignes (Précédent, Actif, Suivant)
    const prevText = activeIndex > 0 ? lyrics[activeIndex - 1].text : "";
    const activeText = lyrics[activeIndex].text;
    const nextText = activeIndex < lyrics.length - 1 ? lyrics[activeIndex + 1].text : "";
    
    if (lyricActive.textContent !== activeText) {
        lyricPrev.style.opacity = 0;
        lyricActive.style.opacity = 0;
        lyricNext.style.opacity = 0;
        
        setTimeout(() => {
            lyricPrev.textContent = prevText || " ";
            lyricActive.textContent = activeText;
            lyricNext.textContent = nextText || " ";
            
            lyricPrev.style.opacity = 0.4;
            lyricActive.style.opacity = 1;
            lyricNext.style.opacity = 0.4;
        }, 150);
    }
}

// Lancement d'un entraînement aléatoire
btnLaunchTraining.addEventListener('click', () => {
    const songKeys = Object.keys(SONGS);
    const randomKey = songKeys[Math.floor(Math.random() * songKeys.length)];
    playSong(randomKey);
});

btnStopKaraoke.addEventListener('click', stopSynth);

// --- 5. Dessin du Visualiseur d'Audio ---
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawVisualizer() {
    visualizerAnimationId = requestAnimationFrame(drawVisualizer);
    
    const width = canvas.width;
    const height = canvas.height;
    canvasCtx.clearRect(0, 0, width, height);

    if (analyserNode && isPlaying) {
        // Mode actif : barres d'analyse audio
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2.0;

            const gradient = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, '#b76e79'); 
            gradient.addColorStop(1, '#d4af37'); 

            canvasCtx.fillStyle = gradient;
            canvasCtx.shadowBlur = 8;
            canvasCtx.shadowColor = 'rgba(212, 175, 55, 0.3)';
            
            canvasCtx.fillRect(x, height - barHeight, barWidth - 1.5, barHeight);
            x += barWidth;
        }
    } else {
        // Mode veille : Ligne sinusoïdale fluide
        canvasCtx.shadowBlur = 0;
        canvasCtx.beginPath();
        canvasCtx.lineWidth = 2.0;
        
        const gradient = canvasCtx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(183, 110, 121, 0.4)');
        gradient.addColorStop(0.5, 'rgba(212, 175, 55, 0.4)');
        gradient.addColorStop(1, 'rgba(183, 110, 121, 0.4)');
        canvasCtx.strokeStyle = gradient;

        const time = Date.now() * 0.0025;
        for (let x = 0; x < width; x++) {
            const y = height / 2 + Math.sin(x * 0.018 + time) * 8;
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
updateCountdown();
