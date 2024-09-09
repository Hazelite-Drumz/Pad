const apiKey = 'qoA9eNdzJODSdWwHQKt6gzzUxA4SLILrLXSlyjpB';
let soundsData = []; // Store all fetched sounds here
let pads, recordBtn, downloadBtn, resultsDiv;

let isRecording = false;
let recordedAudio = [];
let audioChunks = [];

// Ensure DOM is fully loaded before executing the script
window.onload = function () {
  pads = document.querySelectorAll('.pad');
  recordBtn = document.getElementById('record');
  downloadBtn = document.getElementById('download');
  resultsDiv = document.getElementById('results');
  const tagDropdown = document.getElementById('tagDropdown');

  // Fetch all sounds and store them
  fetchAllSounds();

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

  // Event listener for the dropdown tag selection
  tagDropdown.addEventListener('change', function () {
    filterSoundsByTag(this.value);
  });
};


// Function to fetch all sounds from the Freesound API
function fetchAllSounds() {
  const url = `https://freesound.org/apiv2/search/text/?query=&filter=type:wav`;

  fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`, // Use Bearer authorization
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data && data.results) {
        soundsData = data.results;
        displayResults(soundsData); // Display all sounds initially
      } else {
        resultsDiv.innerHTML = '<p>No sounds found.</p>';
      }
    })
    .catch(error => console.error('Error fetching sounds:', error));
}

// Function to display all fetched sounds
function displayResults(soundsList) {
  resultsDiv.innerHTML = ''; // Clear previous results

  soundsList.forEach(sound => {
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
      console.log(`Sound "${sound.name}" does not have a valid preview URL.`);
    }
  });
}

// Function to filter sounds based on tag
function filterSoundsByTag(tag) {
  if (!tag) {
    displayResults(soundsData); // If no tag is selected, display all sounds
    return;
  }

  const filteredSounds = soundsData.filter(sound => sound.tags.includes(tag));
  displayResults(filteredSounds);
}

// Function to assign sound to drum pad
function addToDrumPad(soundUrl) {
  const padKey = prompt("Assign a key for this sound (e.g., Q, W, E, etc.):").toUpperCase();
  if (padKey && /^[A-Z]$/.test(padKey)) {
    sounds[padKey] = soundUrl;
    alert(`Sound assigned to ${padKey}!`);
  } else {
    alert("Please assign a valid key (A-Z).");
  }
}
