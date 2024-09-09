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
  const tagDropdown = document.getElementById('tagDropdown');

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
      let blob = new Blob(recordedAudio, { type: 'audio/wav' });
      downloadBtn.href = URL.createObjectURL(blob);
      downloadBtn.download = 'recording.wav';
    } else {
      recordedAudio = [];
    }
  });


  // Event listener for the dropdown tag selection
  tagDropdown.addEventListener('change', function () {
    fetchSoundsByTag(this.value);
  });
};

// Function to play sounds
function playSound(key) {
  if (sounds[key]) {
    const audio = new Audio();
    audio.src = sounds[key];
    audio.crossOrigin = "anonymous"; // Allow cross-origin for sounds
    audio.play();

    if (isRecording) {
      recordedAudio.push(sounds[key]);
    }
  }
}


// Function to fetch and display sounds by tag using Freesound API
// Function to fetch and display sounds by tag using Freesound API
function fetchSoundsByTag(tag) {
  if (!tag) {
    resultsDiv.innerHTML = '<p>Please select a tag.</p>';
    return;
  }


  const url = `https://freesound.org/apiv2/search/text/?query=${tag}&filter=type:wav`;

  fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}` // Use Bearer authorization
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data && data.results && data.results.length > 0) {
        displayResults(data.results);
      } else {
        resultsDiv.innerHTML = '<p>No sounds found for this tag.</p>';
      }
    })
    .catch(error => console.error('Error fetching sounds by tag:', error));
}

// Function to display the results in the UI
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

    // Update the UI to reflect the sound assignment
    const padElement = document.querySelector(`.pad[data-key="${padKey}"]`);
    if (padElement) {
      padElement.innerText = padKey; // Update key label
    }

    alert('Sound assigned to ' + padKey + '!');
  } else {
    alert("Please assign a valid key (A-Z).");
  }
}
