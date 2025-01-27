document.addEventListener('DOMContentLoaded', function() {
    // Language selector handler
    const languageButtons = document.querySelectorAll('.language-button');
    languageButtons.forEach(button => {
        button.addEventListener('click', function() {
            languageButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            chrome.storage.sync.set({ language: this.getAttribute('data-lang') });
        });
    });

    // Load settings
    chrome.storage.sync.get({
        youtubeEnabled: true,
        gmailEnabled: true,
        dtfEnabled: true,
        redditEnabled: true,
        soundEnabled: true,
        soundVolume: 50,
        language: 'en',
        soulsCount: 0
    }, function(items) {
        document.getElementById('youtube-enabled').checked = items.youtubeEnabled;
        document.getElementById('gmail-enabled').checked = items.gmailEnabled;
        document.getElementById('dtf-enabled').checked = items.dtfEnabled;
        document.getElementById('reddit-enabled').checked = items.redditEnabled;
        document.getElementById('sound-enabled').checked = items.soundEnabled;
        document.getElementById('sound-volume').value = items.soundVolume;
        document.getElementById('volume-value').textContent = items.soundVolume + '%';
        
        updateSoulsDisplay(items.soulsCount);

        const activeButton = document.querySelector(`.language-button[data-lang="${items.language}"]`);
        if (activeButton) {
            document.querySelectorAll('.language-button').forEach(b => b.classList.remove('active'));
            activeButton.classList.add('active');
        }
    });

    function saveSettings() {
        const settings = {
            youtubeEnabled: document.getElementById('youtube-enabled').checked,
            gmailEnabled: document.getElementById('gmail-enabled').checked,
            dtfEnabled: document.getElementById('dtf-enabled').checked,
            redditEnabled: document.getElementById('reddit-enabled').checked,
            soundEnabled: document.getElementById('sound-enabled').checked,
            soundVolume: document.getElementById('sound-volume').value,
            language: document.querySelector('.language-button.active').getAttribute('data-lang')
        };
        chrome.storage.sync.set(settings);
        
        document.getElementById('volume-value').textContent = settings.soundVolume + '%';
    }

    function updateSoulsDisplay(count) {
        const soulsValue = document.querySelector('.souls-value');
        soulsValue.textContent = count;
        soulsValue.classList.add('gain');
        setTimeout(() => {
            soulsValue.classList.remove('gain');
        }, 500);
    }

    // Event handlers
    document.getElementById('youtube-enabled').addEventListener('change', saveSettings);
    document.getElementById('gmail-enabled').addEventListener('change', saveSettings);
    document.getElementById('dtf-enabled').addEventListener('change', saveSettings);
    document.getElementById('reddit-enabled').addEventListener('change', saveSettings);
    document.getElementById('sound-enabled').addEventListener('change', saveSettings);
    document.getElementById('sound-volume').addEventListener('input', saveSettings);

    // Souls counter listener
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.soulsCount) {
            updateSoulsDisplay(changes.soulsCount.newValue);
        }
    });
});