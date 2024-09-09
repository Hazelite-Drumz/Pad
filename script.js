const apiKey = 'qoA9eNdzJODSdWwHQKt6gzzUxA4SLILrLXSlyjpB';
const pads = document.querySelectorAll('.pad');
const recordBtn = document.getElementById('record');
const downloadBtn = document.getElementById('download');
const resultsDiv = document.getElementById('results');

let isRecording = false;
let recordedAudio = [];
let audioChunks = [];

// Map keycodes to sounds (will be updated dynamically)
let sounds = {};

// Function to play sounds
function playSound(key) {
  if (sounds[key]) {
    const audio = new Audio(sounds[key]);
    audio.crossOrigin = "anonymous"; // Allow cross-origin requests for external sounds
    audio.play();

    if (isRecording) {
      recordedAudio.push(sounds[key]);
    }
  }
}

// Drum pad click listener
pads.forEach(pad => {
  pad.addEventListener('click', () => {
    const key = pad.getAttribute('data-key');
    playSound(key);
  });
});

// Keyboard support for drum pad
window.addEventListener('keydown', (e) => {
  const key = e.key.toUpperCase();
  if (sounds[key]) {
    playSound(key);
  }
});

// Sound search function using Freesound API
document.getElementById('searchBtn').addEventListener('click', function() {
  const query = document.getElementById('searchQuery').value;
  searchSounds(query);
});

function searchSounds(query) {
  const url = `https://freesound.org/apiv2/search/text/?query=${query}&token=${apiKey}`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log(data); // Inspect the entire response structure
      if (data.results) {
        displayResults(data.results); // Pass results to display function if it exists
      } else {
        console.error('No results found in API response.');
      }
    })
    .catch(error => console.error('Error:', error));
}

function displayResults(soundsList) {
  resultsDiv.innerHTML = ''; // Clear previous results

  soundsList.forEach(sound => {
    // Use the low-quality mp3 preview URL provided by Freesound API
    const soundUrl = sound.previews ? sound.previews['preview-lq-mp3'] : null;

    // Check if the sound URL exists
    if (soundUrl) {
      const soundElement = document.createElement('div');
      soundElement.className = 'sound-item';
      soundElement.innerHTML = `
        <p>${sound.name}</p>
        <audio controls>
          <source src="${soundUrl}" type="audio/mpeg">
        </audio>
        <button onclick="addToDrumPad('${soundUrl}')">Add to Drum Pad</button>
      `;
      resultsDiv.appendChild(soundElement);
    } else {
      console.log(`Sound "${sound.name}" does not have a valid preview URL.`);
    }
  });
}




function addToDrumPad(soundUrl) {
  const padKey = prompt("Assign a key for this sound (e.g., Q, W, E, etc.):").toUpperCase();
  if (padKey && /^[A-Z]$/.test(padKey)) {
    sounds[padKey] = soundUrl;
    alert(`Sound assigned to ${padKey}!`);
  } else {
    alert("Please assign a valid key (A-Z).");
  }
}

// Recording logic (as before)
recordBtn.addEventListener('click', () => {
  isRecording = !isRecording;
  recordBtn.textContent = isRecording ? 'Stop' : 'Record';

  if (!isRecording) {
    // Stop recording and prepare audio download
    let blob = new Blob(audioChunks, { type: 'audio/wav' });
    downloadBtn.href = URL.createObjectURL(blob);
    downloadBtn.download = 'recording.wav';
  } else {
    audioChunks = [];
  }
});
