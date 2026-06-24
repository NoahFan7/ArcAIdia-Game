// Original chiptune engine — upbeat fighting-game style background music
// Uses Web Audio API square/triangle waves, no audio files needed

let audioCtx = null;
let musicPlaying = false;
let musicGain = null;
let musicLoopId = null;
let musicStep = 0;
let nextNoteTime = 0;
const TEMPO = 140;
const STEP_DUR = 60 / TEMPO / 4;

const NOTES = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
  rest: 0
};

const BASS = [
  'C2','C2','G2','C2','A2','A2','E2','A2',
  'F2','F2','C3','F2','G2','G2','D3','G2',
  'C2','C2','G2','C2','A2','A2','E2','A2',
  'F2','F2','C3','F2','G2','G2','G2','B2'
];

const LEAD = [
  'C4','E4','G4','E4','C4','E4','G4','A4',
  'G4','E4','C4','E4','D4','F4','A4','G4',
  'C4','E4','G4','C5','B4','G4','E4','D4',
  'C4','E4','G4','E4','F4','A4','G4','E4'
];

const ARP = [
  'C4','E4','G4','C5','C4','E4','G4','C5',
  'A3','C4','E4','A4','A3','C4','E4','A4',
  'F3','A3','C4','F4','F3','A3','C4','F4',
  'G3','B3','D4','G4','G3','D4','B3','G3'
];

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.18;
  musicGain.connect(audioCtx.destination);
}

function playNote(freq, time, dur, type, vol, target) {
  if (freq <= 0) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.01);
  gain.gain.linearRampToValueAtTime(vol * 0.7, time + dur * 0.3);
  gain.gain.linearRampToValueAtTime(0, time + dur);
  osc.connect(gain);
  gain.connect(target || musicGain);
  osc.start(time);
  osc.stop(time + dur + 0.02);
}

function scheduleStep() {
  if (!musicPlaying || !audioCtx) return;
  while (nextNoteTime < audioCtx.currentTime + 0.15) {
    const step = musicStep % 32;
    const bassNote = NOTES[BASS[step]];
    const leadNote = NOTES[LEAD[step]];
    const arpNote = NOTES[ARP[step]];

    if (bassNote > 0) playNote(bassNote, nextNoteTime, STEP_DUR * 0.9, 'triangle', 0.35);
    if (arpNote > 0) playNote(arpNote, nextNoteTime, STEP_DUR * 0.4, 'square', 0.08);
    if (leadNote > 0) playNote(leadNote, nextNoteTime, STEP_DUR * 0.85, 'square', 0.18);
    if (step % 8 === 0) {
      playNote(NOTES.C2, nextNoteTime, 0.05, 'square', 0.15);
    }

    nextNoteTime += STEP_DUR;
    musicStep++;
  }
  musicLoopId = setTimeout(scheduleStep, 30);
}

function startMusic() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (musicPlaying) return;
  musicPlaying = true;
  musicStep = 0;
  nextNoteTime = audioCtx.currentTime + 0.05;
  scheduleStep();
}

function stopMusic() {
  musicPlaying = false;
  if (musicLoopId) { clearTimeout(musicLoopId); musicLoopId = null; }
}

function toggleMusic() {
  if (musicPlaying) stopMusic();
  else startMusic();
}

function playSfx(type) {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const t = audioCtx.currentTime;
  if (type === 'hit') {
    playNote(180, t, 0.08, 'square', 0.3);
    playNote(90, t, 0.12, 'sawtooth', 0.2);
  } else if (type === 'win') {
    playNote(523, t, 0.1, 'square', 0.25);
    playNote(659, t + 0.1, 0.1, 'square', 0.25);
    playNote(784, t + 0.2, 0.2, 'square', 0.25);
  } else if (type === 'lose') {
    playNote(200, t, 0.15, 'sawtooth', 0.25);
    playNote(150, t + 0.15, 0.15, 'sawtooth', 0.25);
    playNote(100, t + 0.3, 0.3, 'sawtooth', 0.25);
  } else if (type === 'coin') {
    playNote(988, t, 0.06, 'square', 0.2);
    playNote(1319, t + 0.06, 0.1, 'square', 0.2);
  } else if (type === 'click') {
    playNote(440, t, 0.03, 'square', 0.12);
  } else if (type === 'flag') {
    playNote(660, t, 0.04, 'square', 0.15);
    playNote(880, t + 0.04, 0.06, 'square', 0.15);
  } else if (type === 'reveal') {
    playNote(523, t, 0.03, 'triangle', 0.1);
    playNote(659, t + 0.03, 0.04, 'triangle', 0.1);
  } else if (type === 'boom') {
    playNote(80, t, 0.3, 'sawtooth', 0.3);
    playNote(60, t + 0.05, 0.4, 'sawtooth', 0.25);
    playNote(200, t, 0.05, 'square', 0.2);
  }
}
