// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Get ALL Element References FIRST ---
    // This helps prevent issues where an element might not be found
    // if its section is initially hidden or if the script structure is complex.
    // We check if they exist before using them later.

    // Global Elements and Navigation
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarLinks = document.querySelectorAll('#sidebar .sidebar-link');
    const mainContent = document.getElementById('mainContent');
    const contentSections = document.querySelectorAll('.content-section'); // Includes homeTool, functionPackTool, qrTool, nbtTool, settingsTool

    // Function Pack Creator Tool Elements
    const generateBtn = document.getElementById('generateBtn'); // Main generate button
    const packNameInput = document.getElementById('packName');
    const packDescriptionInput = document.getElementById('packDescription');
    const packIconInput = document.getElementById('packIcon');
    const presetListDiv = document.getElementById('presetList'); // Div for available presets
    const selectedPresetsDiv = document.getElementById('selectedPresets'); // The container div for selected list
    const selectedPresetsListUl = document.getElementById('selectedPresetsList'); // The UL for selected items
    const packStatusDiv = document.getElementById('packStatus'); // Status message

    // QR Code to MCFunction Tool Elements
    const imageInput = document.getElementById('imageInput'); // File input for image
    const imagePreview = document.getElementById('imagePreview'); // Image preview element (hidden initially)
    const processingCanvas = document.getElementById('processingCanvas'); // Hidden canvas for processing
    const ctx = processingCanvas ? processingCanvas.getContext('2d') : null; // Get 2D context
    const convertButton = document.getElementById('convertButton'); // Convert image button
    const outputCommands = document.getElementById('outputCommands'); // Textarea for commands
    const copyButton = document.getElementById('copyButton'); // Copy commands button
    const downloadButton = document.getElementById('downloadButton'); // Download .mcfunction button
    const imageStatusMessage = document.getElementById('imageStatusMessage'); // Status message for image tool
    const pixelRatioInput = document.getElementById('pixelRatio'); // Input for pixels per block
    const baseHeightInput = document.getElementById('baseHeight'); // Input for base Y height
    const zOffsetInput = document.getElementById('zOffset'); // Input for Z offset
    const ditheringEnabledInput = document.getElementById('ditheringEnabled'); // Checkbox for dithering
    const thresholdInput = document.getElementById('threshold'); // Range input for threshold
    const thresholdValueSpan = document.getElementById('thresholdValue'); // Span to display threshold value

    // MCFunction to Nifty Building Tool NBT Elements
    const nbtStatusMessage = document.getElementById('nbtStatusMessage'); // Status message for NBT tool
    const nbtFileInput = document.getElementById('input-file'); // File input for .mcfunction
    const nbtTitleInput = document.getElementById('nbt-title'); // Text input for build title
    const commandsPerNpcInput = document.getElementById('commands-per-npc'); // Number input for commands per NPC

    // Audio Elements
    const clickSound = document.getElementById('clickSound'); // Click sound audio tag
    const backgroundMusic = document.getElementById('backgroundMusic'); // Background music audio tag

    // Settings Tool Elements
    const musicVolumeInput = document.getElementById('musicVolume'); // Range input for music volume
    const musicVolumeValueSpan = document.getElementById('musicVolumeValue'); // Span to display music volume percentage
    const sfxVolumeInput = document.getElementById('sfxVolume'); // Range input for SFX volume
    const sfxVolumeValueSpan = document.getElementById('sfxVolumeValue'); // Span to display SFX volume percentage
    const toggleMusicBtn = document.getElementById('toggleMusicBtn'); // Button to toggle music playback


    // --- Set Initial Audio Volumes and State (Read from localStorage) ---
    // Use unique keys for each setting in localStorage
    const MUSIC_VOLUME_STORAGE_KEY = 'minecraftToolsMusicVolume';
    const SFX_VOLUME_STORAGE_KEY = 'minecraftToolsSfxVolume';

    if (backgroundMusic) {
        const savedMusicVolume = localStorage.getItem(MUSIC_VOLUME_STORAGE_KEY);
        // Parse float and default to 0.5 (50%) if saved value is null or not a valid number
        backgroundMusic.volume = savedMusicVolume !== null && !isNaN(parseFloat(savedMusicVolume)) ? parseFloat(savedMusicVolume) : 0.5;
        backgroundMusic.loop = true; // Ensure music loops continuously
        // Pause immediately and reset time to ensure play() works correctly on first user interaction
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        // Add a muted attribute initially to potentially help with autoplay, then remove it later
        backgroundMusic.muted = true; // Start muted to comply with autoplay policies

    } else {
        console.warn("Background music element not found.");
    }

     if (clickSound) {
        const savedSfxVolume = localStorage.getItem(SFX_VOLUME_STORAGE_KEY);
         // Parse float and default to 1.0 (100%)
         clickSound.volume = savedSfxVolume !== null && !isNaN(parseFloat(savedSfxVolume)) ? parseFloat(savedSfxVolume) : 1.0;
     } else {
         console.warn("Click sound element not found.");
     }


    // --- Global Functions (Navigation, Download, Sound) ---

    // Function to toggle sidebar open/closed state
    function toggleSidebar() {
        if (sidebar) { // Check if sidebar element exists
            sidebar.classList.toggle('open'); // Toggle the 'open' class
            document.body.classList.toggle('sidebar-open'); // Toggle class on body for CSS layout shift
        }
    }

    // Function to show a specific content section and hide others
    function showSection(sectionId) {
        // Hide all content sections by default display property
        contentSections.forEach(section => {
            section.style.display = 'none';
        });

        // Find the selected section by ID
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.style.display = 'block'; // Make the selected section visible

             if (mainContent) {
                 // Scroll to top of the main content area when switching sections for better UX
                 mainContent.scrollTo({ top: 0, behavior: 'auto' }); // Use 'auto' for instant scroll, 'smooth' for animation
             }

            // Update active state in sidebar links
            // Remove 'active-section' class from all links, then add to the selected one
            sidebarLinks.forEach(link => {
                 if (link.dataset.section === sectionId) {
                     link.classList.add('active-section'); // Add active class
                 } else {
                     link.classList.remove('active-section'); // Remove active class
                 }
            });

            // --- Perform specific setup needed when a particular section is made visible ---
            // This ensures elements are initialized *after* they are displayed and referenced
            if (sectionId === 'functionPackTool') {
                if (presetListDiv && selectedPresetsListUl) {
                    renderPresetList(); // Re-render available presets
                    renderSelectedPresetsList(); // Re-render selected presets (also calls renderPresetList)
                } else { console.warn("Function Pack Creator preset elements not found."); }
            } else if (sectionId === 'qrTool') {
                if (thresholdInput && thresholdValueSpan) {
                    // Function to update the displayed threshold value and the range slider track fill CSS variable
                    const updateThresholdDisplay = () => {
                        thresholdValueSpan.textContent = thresholdInput.value; // Update the displayed value
                        // Update the CSS variable for the range slider track fill
                        thresholdInput.style.setProperty('--threshold-progress', `${(thresholdInput.value / 255) * 100}%`);
                    };
                    // Attach the 'input' event listener to the threshold slider, removing potential previous ones
                    thresholdInput.removeEventListener('input', updateThresholdDisplay);
                    thresholdInput.addEventListener('input', updateThresholdDisplay);
                    updateThresholdDisplay(); // Update display immediately when section is shown

                } else { console.warn("QR Tool threshold elements not found."); }
                 // Also reset image preview and status when entering the QR tool section for a clean state
                 if (imagePreview) imagePreview.style.display = 'none'; // Hide image preview
                 if (convertButton) convertButton.disabled = true; // Disable convert button
                 if (outputCommands) outputCommands.value = ''; // Clear output textarea
                 if (copyButton) copyButton.disabled = true; // Disable copy button
                 if (downloadButton) downloadButton.disabled = true; // Disable download button
                 if (imageStatusMessage) imageStatusMessage.textContent = 'Select an image to begin.'; // Reset status message
                 // Remove the pixel-preview class from the canvas
                 if (processingCanvas) processingCanvas.classList.remove('pixel-preview');


            } else if (sectionId === 'settingsTool') {
                 // Initialize settings UI and attach listeners *when* settings section is shown
                 if (musicVolumeInput && musicVolumeValueSpan && backgroundMusic) {
                     // Ensure the slider reflects the current audio volume loaded from localStorage
                     musicVolumeInput.value = backgroundMusic.volume; // Set slider position
                     musicVolumeValueSpan.textContent = `${Math.round(backgroundMusic.volume * 100)}%`; // Update displayed percentage
                     // Attach listener to the slider, removing potential previous ones to avoid duplicates
                     musicVolumeInput.removeEventListener('input', handleMusicVolumeChange);
                     musicVolumeInput.addEventListener('input', handleMusicVolumeChange);
                 } else if (!backgroundMusic && musicVolumeInput) {
                     console.warn("Background music element missing, settings music slider might not work.");
                     musicVolumeInput.disabled = true; // Disable slider if audio missing
                 } else { console.warn("Settings music volume elements not found."); }


                 if (sfxVolumeInput && sfxVolumeValueSpan && clickSound) {
                     // Ensure the slider reflects the current audio volume loaded from localStorage
                     sfxVolumeInput.value = clickSound.volume; // Set slider position
                     sfxVolumeValueSpan.textContent = `${Math.round(clickSound.volume * 100)}%`; // Update displayed percentage
                     // Set initial lastValue for test sound logic comparison on this specific slider
                     sfxVolumeInput.dataset.lastValue = sfxVolumeInput.value;
                     // Attach listener to the slider, removing potential previous ones
                     sfxVolumeInput.removeEventListener('input', handleSfxVolumeChange);
                     sfxVolumeInput.addEventListener('input', handleSfxVolumeChange);
                 } else if (!clickSound && sfxVolumeInput) {
                     console.warn("Click sound element missing, settings SFX slider might not work.");
                     sfxVolumeInput.disabled = true; // Disable slider if audio missing
                 } else { console.warn("Settings SFX volume elements not found."); }


                  // Update music toggle button text and attach listener, removing potential previous ones
                 if (toggleMusicBtn && backgroundMusic) {
                     toggleMusicBtn.textContent = backgroundMusic.paused ? 'Play Music' : 'Pause Music';
                     toggleMusicBtn.removeEventListener('click', toggleMusicPlayback);
                     toggleMusicBtn.addEventListener('click', toggleMusicPlayback);
                 } else if (!backgroundMusic && toggleMusicBtn) {
                     console.warn("Background music element missing, music toggle button might not work.");
                     toggleMusicBtn.disabled = true; // Disable toggle if music missing
                 } else { console.warn("Settings music toggle button not found."); }

            }
            // Add checks for other sections here if they need specific setup on show
            // e.g., NBT tool reset?
             if (sectionId === 'nbtTool') {
                 if (nbtStatusMessage) nbtStatusMessage.textContent = 'Select an .mcfunction file to convert.'; // Reset status
                 // No other complex state to reset currently
             }
             // Home tool doesn't need specific setup on show
        } else {
             console.error(`Content section with ID "${sectionId}" not found.`);
        }

        // Close the sidebar on mobile after selecting a section
        // Check screen width or check for the 'sidebar-open' class on the body
        if (window.innerWidth <= 768 && document.body.classList.contains('sidebar-open')) {
             toggleSidebar(); // Close the sidebar by calling the toggle function
        }
    }

    // Shared Download Function - Creates and triggers download of a file (used by FuncPack and QR tools)
    function download(filename, textOrBlob) {
        const element = document.createElement('a'); // Create a temporary anchor element
        // Determine if we have text content or a Blob (like from JSZip)
        if (textOrBlob instanceof Blob) {
             element.setAttribute('href', URL.createObjectURL(textOrBlob)); // Create a temporary URL for the Blob
        } else { // Assume it's text content
             element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textOrBlob)); // Encode text as a data URL
        }
        element.setAttribute('download', filename); // Set the download filename
        element.style.display = 'none'; // Hide the link element
        document.body.appendChild(element); // Append to body (required for click)
        element.click(); // Simulate a click to trigger download
        document.body.removeChild(element); // Clean up the temporary element

        // Clean up the object URL if a Blob was used
        if (textOrBlob instanceof Blob) {
             URL.revokeObjectURL(element.href); // Release the temporary URL
        }
    }

    // Sound on Click Logic - Plays the click sound effect
    function playClickSound() {
        if (clickSound) { // Check if the audio element exists
            // Stop and rewind the sound to the start to allow rapid playback
            clickSound.currentTime = 0;
            // Attempt to play the sound. Use catch to handle potential errors (e.g., not loaded, browser restrictions)
            clickSound.play().catch(e => { /* Error ignored, often autoplay policy before user interaction */ });
        } else {
             // console.warn("Attempted to play click sound, but element is missing."); // Log warning if element not found
        }
    }

    // Background Music Playback Attempt Logic - Tries to play music after first user interaction
    // Browsers often block autoplay until the user interacts with the page.
    function attemptBackgroundMusicPlayback() {
        // Only proceed if the backgroundMusic element exists and is currently paused
        if (backgroundMusic && backgroundMusic.paused) {
             // Unmute the audio as user interaction has occurred
             backgroundMusic.muted = false;

            const playPromise = backgroundMusic.play(); // Attempt to play - returns a Promise

            // Use the promise to determine if playback started successfully
            if (playPromise !== undefined) { // Check if play() returned a Promise (modern browsers)
                playPromise.then(() => {
                    // Playback started successfully
                    console.log("Background music started.");
                    // Playback succeeded, remove the initial global listeners that trigger this function
                    document.body.removeEventListener('click', attemptBackgroundMusicPlayback);
                    document.body.removeEventListener('keydown', attemptBackgroundMusicPlayback);
                    // Update settings button text if settings section is currently shown
                    if (toggleMusicBtn) toggleMusicBtn.textContent = 'Pause Music';

                }).catch(error => {
                    // Playback failed (likely autoplay blocked by browser until *more* user interaction, or an error)
                    console.warn("Background music autoplay blocked or failed:", error);
                    // Keep the listeners active to try again on the next user interaction
                    // Optionally, display a message to the user like "Click anywhere to play music"
                     backgroundMusic.muted = true; // Re-mute if play failed to avoid loud unexpected sound later
                });
            } else {
                 // Fallback for older browsers that don't return a Promise from play()
                 // We assume it played and remove listeners.
                 console.log("Attempted background music play (no promise returned).");
                 document.body.removeEventListener('click', attemptBackgroundMusicPlayback);
                 document.body.removeEventListener('keydown', attemptBackgroundMusicPlayback);
                 // Update settings button text if settings section is currently shown
                 if (toggleMusicBtn) toggleMusicBtn.textContent = 'Pause Music';
            }
        }
    }

    // --- Settings Functionality Handlers ---
    // Handle change on Music Volume slider
    function handleMusicVolumeChange() {
         if (backgroundMusic && musicVolumeInput && musicVolumeValueSpan) {
            const volume = parseFloat(musicVolumeInput.value); // Get slider value as float
            if (!isNaN(volume)) { // Ensure it's a valid number
                backgroundMusic.volume = volume; // Set the actual audio volume
                musicVolumeValueSpan.textContent = `${Math.round(volume * 100)}%`; // Update displayed percentage (0-100)
                // Save the volume setting to localStorage
                localStorage.setItem(MUSIC_VOLUME_STORAGE_KEY, volume.toString()); // Save as string
            }
         }
    }

    // Handle change on SFX Volume slider
    function handleSfxVolumeChange() {
         if (clickSound && sfxVolumeInput && sfxVolumeValueSpan) {
            const volume = parseFloat(sfxVolumeInput.value); // Get slider value as float
            if (!isNaN(volume)) { // Ensure it's a valid number
                 clickSound.volume = volume; // Set the actual audio volume
                 sfxVolumeValueSpan.textContent = `${Math.round(volume * 100)}%`; // Update displayed percentage (0-100)
                 // Save the volume setting to localStorage
                 localStorage.setItem(SFX_VOLUME_STORAGE_KEY, volume.toString()); // Save as string

                 // Play a quick test sound if volume is increased from 0 and slider position changed notably
                 // Get the previously stored value from the dataset attribute
                 const lastValue = parseFloat(sfxVolumeInput.dataset.lastValue || '0'); // Default to 0 if lastValue not set
                 // Play sound if the new volume is greater than 0 AND it has increased significantly from the last recorded value
                 if (volume > 0 && volume > lastValue + 0.01) { // Check for an increase of at least 0.01 to avoid noise while dragging
                     playClickSound(); // Play the click sound
                 }
                 sfxVolumeInput.dataset.lastValue = sfxVolumeInput.value; // Store the current string value for next comparison
            }
         }
    }

    // Handle click on Music Toggle button
    function toggleMusicPlayback() {
        if (backgroundMusic && toggleMusicBtn) {
            if (backgroundMusic.paused) {
                // If music is paused, attempt to play it using the dedicated function
                // attemptBackgroundMusicPlayback handles browser autoplay rules and updates the button text on success.
                attemptBackgroundMusicPlayback();
                // Give immediate feedback that we are attempting playback
                 toggleMusicBtn.textContent = 'Play Music (Attempting...)';
            } else {
                // If music is playing, pause it
                backgroundMusic.pause();
                console.log("Background music paused.");
                toggleMusicBtn.textContent = 'Play Music'; // Update button text
            }
        } else { console.warn("Music toggle button or audio element not found."); }
    }


    // --- Add Global Event Listeners ---

    // Listener for the hamburger button to toggle sidebar visibility
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleSidebar); // Attach listener
    } else { console.warn("Hamburger button not found, sidebar toggle will not work."); }

    // Listeners for sidebar links using event delegation on the parent elements (menu and footer)
    const sidebarMenu = document.querySelector('.sidebar-menu');
    const sidebarFooter = document.querySelector('.sidebar-footer');

    if (sidebarMenu) {
        sidebarMenu.addEventListener('click', (event) => {
            const linkButton = event.target.closest('.sidebar-link'); // Check if the click was on a sidebar link or descendant
            if (linkButton && linkButton.dataset.section) { // If a link button was clicked and has a data-section attribute
                showSection(linkButton.dataset.section); // Show the corresponding content section

                 // Play click sound for sidebar links (handled by dedicated listener below)
                 // Close sidebar on mobile after clicking a link
                 if (window.innerWidth <= 768) { // Check if screen width is mobile
                     toggleSidebar(); // Close the sidebar
                 }
            }
        });
    } else { console.warn("Sidebar menu not found."); }

     if (sidebarFooter) {
        sidebarFooter.addEventListener('click', (event) => {
            const linkButton = event.target.closest('.sidebar-link'); // Check if the click was on a sidebar link or descendant
            if (linkButton && linkButton.dataset.section) { // If a link button was clicked and has a data-section attribute
                showSection(linkButton.dataset.section); // Show the corresponding content section

                 // Play click sound for sidebar links (handled by dedicated listener below)
                 // Close sidebar on mobile after clicking a link
                 if (window.innerWidth <= 768) { // Check if screen width is mobile
                     toggleSidebar(); // Close the sidebar
                 }
            }
        });
    } else { console.warn("Sidebar footer not found."); }


    // Add event listener to play click sound on *most* element clicks using delegation on the body
    // This handles clicks on general buttons *outside* the sidebar/navigation and sidebar links themselves.
    document.body.addEventListener('click', (event) => {
        const clickedElement = event.target; // The element that was actually clicked

        // --- Play Click Sound Logic ---
        // Check if the clicked element or its closest ancestor is a button
        const button = clickedElement.closest('button');

        // Play sound if it meets the criteria:
        // 1. It's a button (`button` is not null)
        // 2. It's NOT disabled (`!button.disabled`)
        // 3. It's NOT the hamburger button itself (`button !== hamburgerBtn`)
        // 4. It's NOT a range input element (clicks/drags on these often have built-in or different feedback) (`event.target.type !== 'range'`)
        // 5. It's NOT a link *within* the sidebar (sidebar links have a specific delegation handler above that already plays the sound) (`!button.closest('#sidebar')`)
        if (button && !button.disabled && button !== hamburgerBtn && event.target.type !== 'range' && !button.closest('#sidebar')) {
             playClickSound(); // Play the click sound
        }

        // --- Background Music Autoplay Attempt Logic ---
        // This listener also serves as the initial trigger for background music after user interaction.
        // The `attemptBackgroundMusicPlayback` function itself checks if music is paused before trying to play.
        // The `{ once: true }` option on the listener itself is added later to ensure it's removed after the first trigger.
        // So, no need to call attemptBackgroundMusicPlayback here explicitly, the listener setup at the bottom does it.
    });


    // Add initial listeners to try playing background music on the first user interaction (click or keydown)
    // Using `{ once: true }` ensures these listeners are automatically removed after the first time they trigger
    if (backgroundMusic) {
        document.body.addEventListener('click', attemptBackgroundMusicPlayback, { once: true }); // Trigger on first click anywhere
        document.body.addEventListener('keydown', attemptBackgroundMusicPlayback, { once: true }); // Trigger on first key press anywhere
    } else { console.warn("Background music element not found, music will not play."); }


    // --- Add Event Listeners for Function Pack tab elements ---
    // These are added directly on DOMContentLoaded as they don't depend on showSection state for setup
    if (generateBtn) {
        generateBtn.addEventListener('click', generatePack); // Attach listener to the Generate button
    } else { console.warn("Function Pack Generator button not found."); }

    // Event delegation on the parent div for preset add/remove buttons
    const presetsSection = document.querySelector('.presets.section');
    if(presetsSection) {
         presetsSection.addEventListener('click', handlePresetButtonClick); // Attach delegation listener to the section
    } else { console.warn("Presets section not found."); }


    // --- QR Code to MCFunction Tool Logic and Listeners ---
    // These are added directly on DOMContentLoaded as they don't depend on showSection state for setup
    if (imageInput) {
        // Attach listener to the file input for image selection
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0]; // Get the selected file
            if (file) { // If a file was selected
                const reader = new FileReader(); // Create a FileReader to read the file
                reader.onload = function(e) { // Callback when file is read successfully
                    if (imagePreview) { imagePreview.src = e.target.result; imagePreview.style.display = 'block'; } // Show image preview
                    if (convertButton) convertButton.disabled = false; // Enable convert button
                    // Reset output area
                    if (outputCommands) outputCommands.value = '';
                    if (copyButton) copyButton.disabled = true;
                    if (downloadButton) downloadButton.disabled = true;
                    if (imageStatusMessage) imageStatusMessage.textContent = 'Image loaded. Adjust options and click Convert.'; // Update status
                    // Remove the pixel-preview class from the canvas when a new image is loaded (if it was there)
                    if (processingCanvas) processingCanvas.classList.remove('pixel-preview');

                };
                reader.onerror = function() { // Callback if file reading fails
                    if (imageStatusMessage) imageStatusMessage.textContent = 'Error reading file.';
                    // Reset UI on error
                    if (convertButton) convertButton.disabled = true;
                    if (imagePreview) imagePreview.style.display = 'none';
                    if (outputCommands) outputCommands.value = '';
                    if (copyButton) copyButton.disabled = true;
                    if (downloadButton) downloadButton.disabled = true;
                }
                reader.readAsDataURL(file); // Read the file content as a Data URL (for image preview)
            } else { // If user cancelled file selection (e.g. clicked 'Cancel' in file picker)
                // Reset UI to initial state for the QR tool
                if (imagePreview) imagePreview.style.display = 'none'; // Hide preview
                if (convertButton) convertButton.disabled = true; // Disable convert
                if (outputCommands) outputCommands.value = ''; // Clear output
                if (copyButton) copyButton.disabled = true; // Disable copy
                if (downloadButton) downloadButton.disabled = true; // Disable download
                if (imageStatusMessage) imageStatusMessage.textContent = 'Select an image to begin.'; // Reset status
                 if (processingCanvas) processingCanvas.classList.remove('pixel-preview'); // Remove class from canvas

            }
        });
    } else { console.warn("Image input element not found."); }

    // The threshold slider 'input' listener is attached within showSection('qrTool') because it needs thresholdInput element to be visible/ready.

    if (convertButton) {
        // Attach listener to the Convert button
        convertButton.addEventListener('click', function() {
            // Check if all required elements and conditions are met before processing
            if (!imagePreview || !imagePreview.src || imagePreview.src === '#' || !processingCanvas || !ctx || !pixelRatioInput || !baseHeightInput || !zOffsetInput || !ditheringEnabledInput || !outputCommands || !imageStatusMessage || !convertButton || !copyButton || !downloadButton || !thresholdInput) {
                console.error("Missing required elements for image conversion. Cannot proceed.");
                if(imageStatusMessage) imageStatusMessage.textContent = 'Error converting image: Missing page elements.';
                 if (convertButton) convertButton.disabled = false; // Re-enable button on error
                return;
            }

            if (imageStatusMessage) imageStatusMessage.textContent = 'Converting...'; // Update status
            // Disable buttons during conversion
            if (convertButton) convertButton.disabled = true;
            if (copyButton) copyButton.disabled = true;
            if (downloadButton) downloadButton.disabled = true;
            if (outputCommands) outputCommands.value = ''; // Clear previous output

            const img = new Image(); // Create a new Image object
            img.onload = function() { // Callback when image loads successfully
                processImage(img); // Process the loaded image
            };
            img.onerror = function() { // Callback if image loading fails
                if (imageStatusMessage) imageStatusMessage.textContent = 'Error loading image for processing.';
                if (convertButton) convertButton.disabled = false; // Re-enable button on error
            };
            img.src = imagePreview.src; // Set the image source to the preview's data URL
        });
    } else { console.warn("Convert button not found."); }

    if (copyButton) {
        // Attach listener to the Copy button
        copyButton.addEventListener('click', function() {
            if (!outputCommands) return; // Check if textarea exists
            outputCommands.select(); // Select the text in the textarea
            outputCommands.setSelectionRange(0, 99999); // For mobile compatibility

            // Copy the selected text to the clipboard using the Clipboard API
            navigator.clipboard.writeText(outputCommands.value).then(() => {
                // Provide visual feedback that copy was successful
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                // Revert button text after a short delay
                setTimeout(() => {
                    copyButton.textContent = originalText;
                }, 1500);
            }).catch(err => {
                // Handle potential errors during copy (e.g., not supported in all contexts, permissions)
                console.error('Could not copy text: ', err);
                 if(imageStatusMessage) imageStatusMessage.textContent = 'Error copying commands.'; // Report error to user
            });
        });
    } else { console.warn("Copy button not found."); }

    if (downloadButton) {
         // Attach listener to the Download button
         downloadButton.addEventListener('click', function() {
             if (!outputCommands || !imageStatusMessage) return; // Check elements
             const textToSave = outputCommands.value; // Get text from textarea
             if (!textToSave) { // Check if there is text to download
                 imageStatusMessage.textContent = 'No commands to download.'; // Report status
                 return;
             }
             // Use the shared download function to create and trigger download of .mcfunction file
             download('pixel_art.mcfunction', textToSave);
             imageStatusMessage.textContent = 'Downloaded pixel_art.mcfunction'; // Update status message
         });
    } else { console.warn("Download button not found."); }


    // --- MCFunction to Nifty Building Tool NBT Logic and Listeners ---
    // These are added directly on DOMContentLoaded
    if (nbtFileInput) {
        // Attach listener to the file input for .mcfunction files
        nbtFileInput.addEventListener('change', function(event) {
            const input = event.target;
            if ('files' in input && input.files.length > 0) { // Check if files were selected
                 if(nbtStatusMessage) nbtStatusMessage.textContent = 'Reading file...'; // Update status
                 processNBTFile(input.files[0]); // Process the first selected file
            } else { // If user cancelled file selection
                 if(nbtStatusMessage) nbtStatusMessage.textContent = 'Select an .mcfunction file to convert.'; // Reset status
            }
            // input.value = ''; // Optional: Clear file input after selection to allow selecting the same file again immediately
        });
    } else { console.warn("NBT file input not found."); }

    // The main processing function for NBT conversion is triggered by the file input change


    // --- Initial Page Load: Show Default Section ---
    // Show the Home section when the page finishes loading
     showSection('homeTool'); // Call showSection with the ID of the home section


}); // End of DOMContentLoaded listener
