const FREESOUNDS_API_KEY = 'qoA9eNdzJODSdWwHQKt6gzzUxA4SLILrLXSlyjpB';
const clientId = 'k4GwXmkPAGXRJIlnNjNm'; // Replace with your Freesound client ID
const clientSecret = 'qoA9eNdzJODSdWwHQKt6gzzUxA4SLILrLXSlyjpB'; // Replace with your Freesound client secret
const redirectUri = 'https://freesound.org/home/app_permissions/permission_granted/';
const FREESOUNDS_API_URL = 'https://freesound.org/apiv2/search/text/';
const FREESOUNDS_DOWNLOAD_URL = 'https://freesound.org/apiv2/sounds/';
let accessToken = '';
let currentPreviewAudio = null;
let intervalId;  // Store interval for the sequencer loop
let bpm = 120;   // Default BPM
let volume = 0.5; // Default volume

document.addEventListener('DOMContentLoaded', () => {
    const drumPad = document.getElementById('drum-pad');
    const recordButton = document.getElementById('record');
    const downloadButton = document.getElementById('download');
    const clearButton = document.getElementById('clear');
    const soundBrowser = document.getElementById('sound-browser');
    const keySelection = document.createElement('select'); // Dropdown for key selection
    const sequencer = document.getElementById('sequencer');
    const bpmInput = document.getElementById('bpmInput');  // BPM slider
    const bpmDisplay = document.getElementById('bpmDisplay');  // BPM number display
    const volumeSlider = document.getElementById('volumeSlider');  // Volume slider
    let audioCtx;
    const keys = ['q', 'w', 'e', 'r', 'u', 'i', 'o', 'p']; // Keys for the drum pad
    const loopLength = 8; // Number of steps in the sequencer
    const sequencerData = {}; // Object to track sounds in the sequencer grid

    // Initialize the sequencerData object to keep track of each step and key
    keys.forEach(key => {
        sequencerData[key] = Array(loopLength).fill(null); // Initialize with null sounds
    });

    // Set up key selection dropdown
    keys.forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.text = key.toUpperCase();
        keySelection.appendChild(option);
    });
    soundBrowser.appendChild(keySelection); // Add dropdown to sound browser

    // Initialize AudioContext after user interaction (browser autoplay policy)
    document.body.addEventListener('click', () => {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    });

    // Set up the drum pad with 8 buttons
    keys.forEach((key) => {
        const button = document.createElement('button');
        button.textContent = key.toUpperCase();
        button.dataset.key = key;
        button.addEventListener('click', () => playSound(button.dataset.sound, button));
        drumPad.appendChild(button);

        // Add event listener for keyboard trigger
        document.addEventListener('keydown', (e) => {
            if (e.key === key) {
                const button = drumPad.querySelector(`button[data-key="${key}"]`);
                playSound(button.dataset.sound, button);
            }
        });
    });

    // Set up sequencer grid
    function createSequencer() {
        sequencer.innerHTML = '';  // Clear existing sequencer
        for (let step = 0; step < loopLength; step++) {
            const column = document.createElement('div');
            column.classList.add('loop-column');

            keys.forEach((key, idx) => {
                const pad = document.createElement('div');
                pad.classList.add('loop-pad');
                pad.dataset.active = 'false';
                pad.dataset.key = key; // Track which key the pad belongs to
                pad.dataset.step = step; // Track which step the pad belongs to

                // Allow the user to assign sounds from the drum pad to the sequencer pad
                pad.addEventListener('click', () => {
                    const selectedKey = keySelection.value;
                    const selectedButton = drumPad.querySelector(`button[data-key="${selectedKey}"]`);
                    if (selectedButton.dataset.sound) {
                        sequencerData[selectedKey][step] = selectedButton.dataset.sound; // Assign the sound
                        pad.dataset.active = 'true';
                        pad.style.backgroundColor = '#4caf50'; // Visual cue for active pad
                    }
                });

                column.appendChild(pad);
            });
            sequencer.appendChild(column);
        }
    }
    createSequencer(); // Initialize sequencer

    // Loop through the sequencer and play active pads based on BPM
    function loopSequence() {
        let step = 0;
        clearInterval(intervalId);  // Clear previous loop
        const interval = (60 / bpm) * 1000;  // Calculate interval based on BPM

        intervalId = setInterval(() => {
            const columns = document.querySelectorAll('.loop-column');
            columns.forEach((col, idx) => {
                const pads = col.children;
                Array.from(pads).forEach((pad) => {
                    const key = pad.dataset.key;
                    if (idx === step && pad.dataset.active === 'true') {
                        const sound = sequencerData[key][step];
                        if (sound) playSound(sound);
                    }
                });
            });
            step = (step + 1) % loopLength;
        }, interval);
    }
    loopSequence(); // Start looping

    // Play the sound using the assigned sound URL and light up the button
    function playSound(url, button = null, isPreview = false) {
        if (!url) return;

        // Stop the currently playing preview if it's a preview sound
        if (isPreview && currentPreviewAudio) {
            currentPreviewAudio.pause();
            currentPreviewAudio.currentTime = 0;
        }

        // Create a new Audio object for each sound
        const audio = new Audio(url);
        audio.volume = volumeSlider.value; // Apply the current volume from the slider

        if (isPreview) {
            currentPreviewAudio = audio;  // Track the current preview audio
        }

        if (button) {
            button.classList.add('active');  // Add "active" class to light up the button
        }

        // Play the sound
        audio.play().catch((error) => {
            console.error("Error playing sound:", error);
        });

        // Add an event listener to remove the 'active' class after the sound finishes playing
        audio.addEventListener('ended', () => {
            if (button) {
                button.classList.remove('active');  // Remove "active" class when sound ends
            }
        });
    }

    // Event listener for BPM slider
    bpmInput.addEventListener('input', (e) => {
        bpm = e.target.value;
        bpmDisplay.value = bpm; // Update BPM display
        loopSequence(); // Restart sequencer loop with new BPM
    });

    // Fetch sounds from Freesound API
    function fetchSounds(query) {
        const url = `${FREESOUNDS_API_URL}?token=${FREESOUNDS_API_KEY}&query=${query}&fields=name,previews`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Freesound API response:", data); // Log the full response for debugging
                displaySounds(data.results);
            })
            .catch(error => {
                console.error('Error fetching sounds:', error);
            });
    }

    // Display sounds from the API in the sound browser
    function displaySounds(sounds) {
        soundBrowser.innerHTML = '';  // Clear previous results

        // Keep the search bar, search button, and key selection dropdown intact
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search for sounds...';
        const searchButton = document.createElement('button');
        searchButton.textContent = 'Search';
        searchButton.addEventListener('click', () => fetchSounds(searchInput.value));

        soundBrowser.appendChild(searchInput);
        soundBrowser.appendChild(searchButton);
        soundBrowser.appendChild(keySelection); // Reattach dropdown after clearing

        // Add new sound results
        sounds.forEach(sound => {
            const soundItem = document.createElement('div');
            soundItem.classList.add('sound-item');

            const button = document.createElement('button');
            button.textContent = sound.name;
            soundItem.appendChild(button);

            // Use the correct preview URL for playback (check for .wav preview or fallback to mp3)
            const wavUrl = sound.previews ? sound.previews['preview-hq-mp3'] : null; // Try hq-mp3 preview
            if (wavUrl) {
                const previewButton = document.createElement('button');
                previewButton.textContent = 'Preview';
                previewButton.addEventListener('click', () => playSound(wavUrl, null, true)); // Pass isPreview as true
                soundItem.appendChild(previewButton);
            } else {
                const noPreview = document.createElement('span');
                noPreview.textContent = 'No Preview';
                soundItem.appendChild(noPreview);
            }

            const assignButton = document.createElement('button');
            assignButton.textContent = 'Assign';
            assignButton.addEventListener('click', () => assignSoundToPad(wavUrl)); // Use the preview URL
            soundItem.appendChild(assignButton);

            soundBrowser.appendChild(soundItem);
        });
    }

    // Assign the selected sound to the chosen drum pad button
    function assignSoundToPad(url) {
        const selectedKey = keySelection.value;  // Get the selected key from the dropdown
        const selectedButton = drumPad.querySelector(`button[data-key="${selectedKey}"]`);  // Find the corresponding button
        if (selectedButton && url) {
            selectedButton.dataset.sound = url;
            selectedButton.style.backgroundColor = '#f39c12';  // Change color after sound assignment
        } else {
            console.error('Sound URL or button is missing');
        }
    }

    // Fetch the .wav file URL for a sound using its ID
    function getWavFile(soundId) {
        const url = `${FREESOUNDS_DOWNLOAD_URL}${soundId}/?token=${FREESOUNDS_API_KEY}`;
        return fetch(url, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(response => response.json())
        .then(data => data.download)
        .catch(error => {
            console.error('Error fetching .wav file:', error);
        });
    }

    // Clear the drum pad and sequencer
    clearButton.addEventListener('click', () => {
        drumPad.innerHTML = '';
        keys.forEach((key) => {
            const button = document.createElement('button');
            button.textContent = key.toUpperCase();
            button.dataset.key = key;
            drumPad.appendChild(button);
        });
        createSequencer(); // Recreate sequencer
        Object.keys(sequencerData).forEach(key => {
            sequencerData[key] = Array(loopLength).fill(null); // Reset sequencer data
        });
    });

    // OAuth2 Step 1: Redirect to Freesound OAuth2 authorization page
    function redirectToAuthorization() {
        const authorizationUrl = `https://freesound.org/apiv2/oauth2/authorize/?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;
        window.location.href = authorizationUrl;
    }

    // OAuth2 Step 2: Extract the authorization code from the URL
    function getAuthorizationCode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('code');
    }

    // OAuth2 Step 3: Use the authorization code to get an access token
    function getAccessToken(code) {
        const url = 'https://freesound.org/apiv2/oauth2/access_token/';
        const data = {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            code: code,
        };

        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data)
        })
        .then(response => response.json())
        .then(data => {
            accessToken = data.access_token;
            console.log('Access token:', accessToken);
        })
        .catch(error => {
            console.error('Error fetching access token:', error);
        });
    }

    // Automatically handle OAuth2 redirect for access token
    document.addEventListener('DOMContentLoaded', () => {
        const code = getAuthorizationCode();
        if (code) {
            getAccessToken(code);
        } else {
            redirectToAuthorization(); // Redirect to OAuth2 authorization if no code found
        }
    });

    // Search for sounds in Freesound
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search for sounds...';
    const searchButton = document.createElement('button');
    searchButton.textContent = 'Search';
    searchButton.addEventListener('click', () => fetchSounds(searchInput.value));
    soundBrowser.appendChild(searchInput);
    soundBrowser.appendChild(searchButton);
});
