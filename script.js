const apiKey = 'qoA9eNdzJODSdWwHQKt6gzzUxA4SLILrLXSlyjpB';
let pads, recordBtn, downloadBtn, resultsDiv;

let isRecording = false;
let recordedAudio = [];
let audioChunks = [];

// Map keycodes to sounds (will be updated dynamically)
let sounds = {};

// Ensure DOM is fully loaded before executing the script
window.onload = function () {
  pads = document.querySelectorAll('.pad');
  recordBtn = document.getElementById('record');
  downloadBtn = document.getElementById('download');
  resultsDiv = document.getElementById('results');

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

  // Recording logic
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
};

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

// Function to fetch and display sounds by tag using Freesound API
function fetchSoundsByTag(tag) {
  const url = `https://freesound.org/apiv2/search/text/?query=${tag}&filter=type:wav&token=${apiKey}`;

  fetch(url)
    .then(response => response.json())
    .then(data => displayResults(data.results))
    .catch(error => console.error('Error fetching sounds by tag:', error));
}

// Display the results in the UI
// Function to display the results
function displayResults(soundsList) {
  resultsDiv.innerHTML = ''; // Clear previous results

  soundsList.forEach(sound => {
    // Use the low-quality mp3 preview URL provided by Freesound API
    const soundUrl = sound.previews ? sound.previews['preview-lq-mp3'] : null;

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
      console.log('Sound "' + sound.name + '" does not have a valid preview URL.');
    }
  });
}


// Function to assign sound to drum pad
function addToDrumPad(soundUrl) {
  const padKey = prompt("Assign a key for this sound (e.g., Q, W, E, etc.):").toUpperCase();
  if (padKey && /^[A-Z]$/.test(padKey)) {
    sounds[padKey] = soundUrl;
    alert('Sound assigned to ' + padKey + '!');
  } else {
    alert("Please assign a valid key (A-Z).");
  }
}
