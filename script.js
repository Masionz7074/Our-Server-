
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
                     // Attach listener, removing potential previous ones to avoid duplicates
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
                     // Attach listener, removing potential previous ones
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
         } else { console.warn("Music volume elements or audio not found."); }
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
         } else { console.warn("SFX volume elements or audio not found."); }
    }

    // Handle click on Music Toggle button
    function toggleMusicPlayback() {
        if (backgroundMusic && toggleMusicBtn) { // Check elements
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


    // --- Function Pack Creator Tool Logic ---
    // State variables (only selected presets needed now)
    let selectedPresetIds = new Set(); // Stores IDs of selected presets

    // Preset Definitions (Same as before)
    const allPresets = [
        { id: 'coords_to_score', name: 'Coords to Scores', description: 'Stores player X, Y, Z coordinates into scoreboard objectives each tick.', objectives: [{ name: "coordX", type: "dummy" }, { name: "coordY", type: "dummy" }, { name: "coordZ", type: "dummy" }], setup_commands: [], main_commands: ['# Store player coordinates in scores', 'execute as @a store result score @s coordX run data get entity @s Pos[0] 100', 'execute as @a store result score @s coordY run data get entity @s Pos[1] 100', 'execute as @a store result score @s coordZ run data get entity @s Pos[2] 100'], additional_files: [] },
        { id: 'on_death', name: 'On Player Death', description: 'Detects player deaths using deathCount and runs a function.', objectives: [{ name: "deaths", type: "deathCount" }], setup_commands: [], main_commands: ['# Check for players who have died', 'execute as @a[scores={deaths=1..}] run function <pack_namespace>:on_death_action'], additional_files: [{ filename: "on_death_action.mcfunction", content: "# This function runs when a player dies.\n# Add your commands here.\n# Example: Send a message\ntellraw @s {\"text\":\"You died!\",\"color\":\"red\"}\n\n# IMPORTANT: Reset the death score\nscoreboard players set @s deaths 0" }] },
        { id: 'on_first_join', name: 'On First Join', description: 'Runs a function when a player joins the world for the first time.', objectives: [{ name: "has_joined", type: "dummy" }], setup_commands: [], main_commands: ['# Check for players who have just joined', 'execute as @a unless score @s has_joined matches 1 run function <pack_namespace>:on_first_join_action', '# Mark players as having joined', 'scoreboard players set @a[scores={has_joined=..0}] has_joined 1'], additional_files: [{ filename: "on_first_join_action.mcfunction", content: "# This function runs on a player's first join.\n# Add commands here.\n# Example: Send a welcome message\ntellraw @s {\"text\":\"Welcome to the world!\",\"color\":\"gold\"}" }] }
        // Add more presets here following the same structure
    ];

    // Helper Functions for Function Pack Creator - Rendering preset lists
    function renderPresetList() {
        if (!presetListDiv) return; // Check if element exists
        presetListDiv.innerHTML = ''; // Clear current list
        allPresets.forEach(preset => {
            if (!selectedPresetIds.has(preset.id)) { // Only show presets not already selected
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>
                        <strong>${preset.name}</strong><br>
                        <small>${preset.description}</small>
                    </span>
                    <button data-preset-id="${preset.id}" data-action="add">Add</button>
                `;
                presetListDiv.appendChild(li); // Add to the list of available presets
            }
        });
    }

    function renderSelectedPresetsList() {
        if (!selectedPresetsListUl) return; // Check if element exists
        selectedPresetsListUl.innerHTML = ''; // Clear current list
         selectedPresetIds.forEach(presetId => { // Iterate through selected preset IDs
            const preset = allPresets.find(p => p.id === presetId); // Find the preset object
            if (preset) { // If the preset is found
                 const li = document.createElement('li');
                 li.innerHTML = `
                     <span>${preset.name}</span>
                     <button data-preset-id="${preset.id}" data-action="remove">Remove</button>
                 `;
                 selectedPresetsListUl.appendChild(li); // Add to the list of selected presets
            }
         });
         renderPresetList(); // Re-render the available presets list to update based on selections
    }

    // Event delegation handler for Add/Remove preset buttons
    function handlePresetButtonClick(event) {
        // Ensure the click target is a button within a list item in either preset list
        const button = event.target.closest('#presetList li button, #selectedPresetsList li button');
        if (!button || !button.dataset.action || !button.dataset.presetId) return; // Validate click target and data attributes

        const presetId = button.dataset.presetId; // Get preset ID from data attribute
        const action = button.dataset.action; // Get action ('add' or 'remove') from data attribute

        if (action === 'add') {
            selectedPresetIds.add(presetId); // Add ID to the set
        } else if (action === 'remove') {
            selectedPresetIds.delete(presetId); // Remove ID from the set
        }

        renderSelectedPresetsList(); // Update both lists to reflect the change
    }

    // Helper to generate UUIDs for the manifest
    function generateUUID() {
        // Use the browser's built-in crypto functionality if available (more secure)
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for older browsers (less secure, but works) - basic UUID v4 generation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Helper to sanitize pack name for use as a namespace (lowercase, underscores for invalid chars)
    function sanitizeNamespace(name) {
        // Convert to lowercase, replace non-alphanumeric/underscore with underscore, remove duplicate/leading/trailing underscores
        return name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_').replace(/^_|_$/g, '');
    }

    // Main Function Pack Generation Logic (Generates files and zips them without an editor)
    async function generatePack() {
         // Check if necessary elements exist before proceeding
         if (!generateBtn || !packStatusDiv || !packNameInput || !packDescriptionInput || !packIconInput) {
             console.error("Missing required elements for pack generation. Cannot proceed.");
             if(packStatusDiv) packStatusDiv.textContent = 'Error generating pack: Missing page elements.';
              if(generateBtn) generateBtn.disabled = false; // Ensure button is re-enabled on error
             return; // Stop the function
         }

        generateBtn.disabled = true; // Disable button while generating to prevent multiple clicks
        if(packStatusDiv) packStatusDiv.textContent = 'Generating pack...'; // Update status message

        // Get user input values, provide defaults if empty
        const packName = packNameInput.value.trim() || 'My Function Pack'; // Default name
        const packDescription = packDescriptionInput.value.trim() || 'Generated by the online tool'; // Default description
        const packIconFile = packIconInput.files[0]; // Get the uploaded file (if any)
        const packNamespace = sanitizeNamespace(packName) || 'my_pack'; // Sanitize name for namespace, default if empty or results in empty string


        // --- Assemble All File Contents Directly ---

        // manifest.json content - describes the pack to the game
        const manifestUuid = generateUUID(); // Generate unique UUIDs for header and module
        const moduleUuid = generateUUID();
        const manifestContent = JSON.stringify({
            "format_version": 2, // Manifest format version
            "header": {
                "name": packName, // Pack name from input
                "description": packDescription, // Pack description from input
                "uuid": manifestUuid, // Unique UUID for the pack header
                "version": [1, 0, 0], // Pack version
                "min_engine_version": [1, 16, 0] // Minimum Minecraft engine version required
            },
            "modules": [ // Defines the contents of the pack (this is a data pack)
                {
                    "type": "data", // Type of module
                    "uuid": moduleUuid, // Unique UUID for the module
                    "version": [1, 0, 0] // Module version
                }
            ]
        }, null, 4); // Use 4 spaces for indentation in JSON

        // tick.json content - tells the game which function to run every tick
        const tickJsonContent = JSON.stringify({
             "values": [ // List of functions to run
                `${packNamespace}:main` // Reference the 'main' function inside the pack's namespace folder
             ]
        }, null, 4); // Use 4 spaces for indentation

        // main.mcfunction, objectives.mcfunction, setup.mcfunction, and additional preset files content
        const mainCommands = [
            `# Function pack: ${packName}`, // Header comments
            `# Namespace: ${packNamespace}`,
            '',
            '# --- Setup & Objectives ---',
            `function ${packNamespace}:setup`, // Call setup function (runs once when pack loads/enables)
            `function ${packNamespace}:objectives`, // Call objectives function (safe to run repeatedly, adds missing objectives)
            '',
            '# --- Tick Commands (Runs every tick via tick.json) ---',
            '# Add your custom tick commands below this line',
            ''
        ];

        const requiredObjectives = new Map(); // Use Map to store unique objectives needed by presets { name: {obj_data} }
        const requiredSetupCommands = new Set(); // Use Set to store unique setup commands needed by presets { command_string }
        const additionalFilesMap = new Map(); // Use a Map to store content for additional preset files { path_relative_to_functions_folder: content_string }

        // Iterate through selected presets and collect their required content
        selectedPresetIds.forEach(presetId => {
            const preset = allPresets.find(p => p.id === presetId); // Find the preset object by ID
            if (preset) { // If the preset exists
                // Add objectives from the preset to the Map, using objective name as key to ensure uniqueness
                preset.objectives.forEach(obj => requiredObjectives.set(obj.name, obj));

                // Add setup commands from the preset to the Set for uniqueness
                preset.setup_commands.forEach(cmd => requiredSetupCommands.add(cmd));

                // Add main commands from the preset to the mainCommands array, replacing namespace placeholder
                mainCommands.push(''); // Add separator comment before preset commands
                mainCommands.push(`# --- Preset: ${preset.name} ---`); // Add preset header comment
                preset.main_commands.forEach(cmd => {
                     mainCommands.push(cmd.replace(/<pack_namespace>/g, packNamespace)); // Add command, replacing placeholder
                });

                // Add additional files defined by the preset to the map, replacing namespace placeholder in content
                 preset.additional_files.forEach(file => {
                    // Store additional files by their intended full path within the functions/[namespace] folder
                    // The filename in the preset definition should just be the file name (e.g., 'on_death_action.mcfunction')
                     const fullPath = `${packNamespace}/${file.filename}`; // Construct the full path, e.g., 'my_pack/on_death_action.mcfunction'
                      if (additionalFilesMap.has(fullPath)) {
                         console.warn(`Duplicate additional file generated: ${fullPath}. Content is being overwritten.`);
                      }
                     additionalFilesMap.set(fullPath, file.content.replace(/<pack_namespace>/g, packNamespace)); // Store content, replacing placeholder
                 });
            }
        });

         // Add the dummy 'objectives' objective needed for the Bedrock scoreboard check trick
         // This objective is implicitly required by the 'execute unless score @s "obj" objectives matches 0' check pattern.
         requiredObjectives.set('objectives', {name: 'objectives', type: 'dummy'});


         // Construct objectives.mcfunction content from collected unique objectives
         const objectiveCommands = [
             `# Automatically added objectives for pack: ${packName}`, // Header comment
             '# Ensure objectives are added only if they don\'t exist (requires a player online when run).', // Explanation comment
             '', // Empty line
             // Sort objectives alphabetically by name for consistent output
             ...Array.from(requiredObjectives.keys()).sort().map(objName => {
                 const obj = requiredObjectives.get(objName); // Get objective data
                 // Command to add objective only if it doesn't exist. Requires player context.
                 // Quote objective names in the command for safety, in case they have spaces or special characters (though dummy/deathCount names usually don't).
                 return `execute as @a at @s unless score @s "${obj.name}" objectives matches 0 run scoreboard objectives add "${obj.name}" ${obj.type}`;
             })
         ];

         // Construct setup.mcfunction content from collected unique setup commands
         const setupCommands = [
             `# Setup commands for pack: ${packName}`, // Header comment
              '# This function runs once when the pack is loaded/enabled (typically called from main.mcfunction on the first tick).', // Explanation comment
              '', // Empty line
              ...Array.from(requiredSetupCommands).sort() // Sort setup commands alphabetically for consistent output
         ];

         // Combine all function file contents into a single map for zipping
         // The keys in this map will be the paths relative to the 'functions' folder in the zip
         const allFunctionFiles = new Map([
             [`${packNamespace}/main.mcfunction`, mainCommands.join('\n')], // Main function
             [`${packNamespace}/objectives.mcfunction`, objectiveCommands.join('\n')], // Objectives function
             [`${packNamespace}/setup.mcfunction`, setupCommands.join('\n')], // Setup function
             ...additionalFilesMap // Spread the additional preset files into this map
         ]);


        // --- Create Zip File using JSZip library ---
        const zip = new JSZip(); // Create a new JSZip instance

        // Add manifest.json to the root of the zip file
        zip.file("manifest.json", manifestContent);

        // Add pack icon if an image file was uploaded
        if (packIconFile) {
             try {
                 const iconData = await packIconFile.arrayBuffer(); // Read the file content as an ArrayBuffer asynchronously
                 zip.file("pack_icon.png", iconData); // Add the file content to the zip under the name pack_icon.png
             } catch (error) {
                 if(packStatusDiv) packStatusDiv.textContent = `Error reading pack icon: ${error}`; // Report error to user
                 console.error("Error reading pack icon:", error); // Log error to console
                 generateBtn.disabled = false; // Re-enable button
                 return; // Stop the generation process if icon reading fails
             }
        }

        // Create the 'functions' folder inside the zip
        const functionsFolder = zip.folder("functions");

        // Add tick.json directly inside the 'functions' folder
        functionsFolder.file("tick.json", tickJsonContent);

        // Add all generated function files to the zip using their stored relative paths within the 'functions' folder
        allFunctionFiles.forEach((content, relativePath) => {
            // The keys in allFunctionFiles are already the paths relative to the 'functions' folder
            // e.g., 'my_pack/main.mcfunction' or 'my_pack/on_death_action.mcfunction'
            functionsFolder.file(relativePath, content); // Add the file content at the correct relative path within the functions folder
        });


        // --- Generate the Zip File and Trigger Download ---
        zip.generateAsync({ type: "blob" }) // Generate the zip file data as a Blob asynchronously
            .then(function(content) { // Promise resolves with the Blob content
                // Use the shared download function with the generated Blob data
                download(`${packName}.zip`, content); // Trigger download with the pack name

                if(packStatusDiv) packStatusDiv.textContent = 'Pack generated and downloaded successfully!'; // Update status message for user
                generateBtn.disabled = false; // Re-enable the generate button

            })
            .catch(function(error) { // Catch any errors that occur during zip file generation
                if(packStatusDiv) packStatusDiv.textContent = `Error generating pack: ${error}`; // Report error to user
                generateBtn.disabled = false; // Re-enable button
                console.error("Error generating zip:", error); // Log error to console for debugging
            });
    }


    // --- QR Code to MCFunction Tool Logic ---
     // Minecraft Block Color Palette (Only Black Concrete and White Wool for this tool)
    const minecraftPalette = [
         { id: 'minecraft:black_concrete', color: [18, 20, 26] }, // Using actual block color values (rough approximation)
         { id: 'minecraft:white_wool', color: [242, 242, 242] } // Using actual block color values (rough approximation)
    ];

    // Helper Function to find the closest color in the palette (used by QR tool)
    // Gets the threshold value directly from the input element each time.
    function findClosestColor(pixelColor, palette) {
        const black = palette[0]; // The black block definition
        const white = palette[1]; // The white block definition

        const r = pixelColor[0]; // Red component of the pixel color
        const g = pixelColor[1]; // Green component
        const b = pixelColor[2]; // Blue component

        // Simple luminance calculation to convert RGB to a grayscale value (weighted average)
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
         // Read threshold value directly from the input element. Use optional chaining just in case the element is somehow missing.
         const threshold = parseInt(document.getElementById('threshold')?.value) || 128; // Default to 128 if input is missing or value invalid

        // Compare luminance to the threshold to determine if it's closer to black or white
        if (luminance < threshold) {
            return black; // If luminance is below threshold, it's considered black
        } else {
            return white; // If luminance is at or above threshold, it's considered white
        }
    }

    // Dithering Helper Function (Floyd-Steinberg) - Distributes color error to neighboring pixels (used by QR tool)
     function diffuseError(workingPixels, width, height, px, py, er, eg, eb, weight) {
         // Check if the pixel is within the image boundaries (px and py are coordinates in the original image grid)
         if (px >= 0 && px < width && py >= 0 && py < height) {
             const idx = (py * width + px) * 4; // Calculate the starting index (for the Red component) in the 1D pixel data array (R, G, B, A, R, G, B, A...)
             // Only apply error to pixels that are not fully transparent
             if (workingPixels[idx + 3] > 10) { // Check if alpha component is mostly opaque (alpha > 10 is an arbitrary threshold)
                 // Add a weighted portion of the error to the neighboring pixel's RGB values, clamping the result between 0 and 255
                 workingPixels[idx] = Math.max(0, Math.min(255, workingPixels[idx] + er * weight)); // Red component
                 workingPixels[idx + 1] = Math.max(0, Math.min(255, workingPixels[idx + 1] + eg * weight)); // Green component
                 workingPixels[idx + 2] = Math.max(0, Math.min(255, workingPixels[idx + 2] + eb * weight)); // Blue component
             }
         }
     }

     // Main Image Processing Function (used by QR tool) - Converts image to Minecraft blocks
    function processImage(img) {
        // Check if all necessary elements and canvas context are available before starting processing
        if (!ctx || !processingCanvas || !pixelRatioInput || !baseHeightInput || !zOffsetInput || !ditheringEnabledInput || !outputCommands || !imageStatusMessage || !convertButton || !copyButton || !downloadButton || !thresholdInput) {
             console.error("Missing required elements for image processing. Cannot proceed."); // Log error
             if(imageStatusMessage) imageStatusMessage.textContent = 'Internal error during processing: Missing page elements.'; // Report error to user
             if(convertButton) convertButton.disabled = false; // Ensure convert button is re-enabled on error
             return; // Stop the function
        }

        // Get options from user input, providing default values if inputs are empty or invalid
        const pixelRatio = parseInt(pixelRatioInput.value) || 1; // How many image pixels will be represented by one Minecraft block
        const baseHeight = parseInt(baseHeightInput.value) || 64; // The base Y coordinate for the pixel art (relative to command executor's Y)
        const zOffset = parseInt(zOffsetInput.value) || 0; // The Z offset for the pixel art (relative to command executor's Z)
        const ditheringEnabled = ditheringEnabledInput.checked; // Whether dithering is enabled (boolean)
        // The threshold value for black/white conversion is read inside the findClosestColor function

        // Validate pixel ratio - must be at least 1
        if (pixelRatio < 1) {
             imageStatusMessage.textContent = 'Pixels per Block must be at least 1.'; // Report error to user
             convertButton.disabled = false; // Re-enable button
             return; // Stop the function
        }

        // Set the canvas size to the original image size and draw the image onto it
        // This is done to easily get the pixel data from the image.
        processingCanvas.width = img.width;
        processingCanvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height); // Draw the image onto the canvas

        // Get the pixel data from the canvas
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data; // This is a Uint8ClampedArray (contains R, G, B, A values for each pixel in sequence)
        // Create a writable copy of the pixel data if dithering is enabled, as dithering modifies pixels in place.
        // If dithering is not enabled, we can just use the original pixel data array.
        const workingPixels = ditheringEnabled ? new Uint8ClampedArray(pixels) : pixels;


        const commands = []; // Array to store the generated /setblock commands
        // Calculate the dimensions of the output pixel art grid in terms of Minecraft blocks
        const outputWidth = Math.floor(img.width / pixelRatio); // Number of blocks horizontally
        const outputHeight = Math.floor(img.height / pixelRatio); // Number of blocks vertically

        // Check if calculated output dimensions are valid (must be at least 1x1)
        if (outputWidth === 0 || outputHeight === 0) {
            imageStatusMessage.textContent = 'Image is too small for the chosen Pixels per Block.'; // Report error to user
            convertButton.disabled = false; // Re-enable button
            return; // Stop the function
        }

         // Clear the canvas and resize it to match the output block dimensions for the visual preview
         ctx.clearRect(0, 0, processingCanvas.width, processingCanvas.height); // Clear any previous drawings
        processingCanvas.width = outputWidth; // Set canvas width to the number of blocks horizontally
        processingCanvas.height = outputHeight; // Set canvas height to the number of blocks vertically
         ctx.fillStyle = '#1a1a1a'; // Set fill color to a dark background for the preview
         ctx.fillRect(0, 0, outputWidth, outputHeight); // Fill the background of the preview canvas


        // Loop through each block position (x, y) in the output grid
        for (let y = 0; y < outputHeight; y++) {
            for (let x = 0; x < outputWidth; x++) {
                 const startPixelX = x * pixelRatio; // Top-left X coordinate in the original image for this block area
                 const startPixelY = y * pixelRatio; // Top-left Y coordinate in the original image for this block area

                 // Get the color of the top-left pixel in the current block area from the working pixel data
                 // This pixel serves as the representative color for the block position.
                 const pixelIndex = (startPixelY * img.width + startPixelX) * 4; // Calculate the starting index (for the Red component) in the 1D pixel data array
                 const pixelR = workingPixels[pixelIndex]; // Red component
                 const pixelG = workingPixels[pixelIndex + 1]; // Green component
                 const pixelB = workingPixels[pixelIndex + 2]; // Blue component
                 const pixelA = workingPixels[pixelIndex + 3]; // Get the Alpha component


                 let matchedBlock = null; // Variable to store the chosen Minecraft block definition ({id, color})
                 let finalColorForCanvas = [0, 0, 0]; // Color to draw on the preview canvas for this block position

                 // Only process the pixel if it's mostly opaque (alpha > a small threshold like 10)
                 if (pixelA > 10) {
                     const originalColor = [pixelR, pixelG, pixelB]; // The color of the pixel from the working data
                     // Find the closest block color (black or white concrete/wool) based on the pixel's color and the threshold
                     matchedBlock = findClosestColor(originalColor, minecraftPalette);

                     finalColorForCanvas = matchedBlock.color; // Use the matched block's color for the preview pixel

                     // Apply dithering if enabled
                     if (ditheringEnabled) {
                         // Calculate the error between the original pixel color and the chosen block color (difference in RGB values)
                         let errorR = originalColor[0] - matchedBlock.color[0];
                         let errorG = originalColor[1] - matchedBlock.color[1];
                         let errorB = originalColor[2] - matchedBlock.color[2];

                         // Distribute the calculated error to neighboring pixels using Floyd-Steinberg weights
                         // This happens on the 'workingPixels' array
                         diffuseError(workingPixels, img.width, img.height, startPixelX + 1, startPixelY, errorR, errorG, errorB, 7 / 16); // Right
                         diffuseError(workingPixels, img.width, img.height, startPixelX - 1, startPixelY + 1, errorR, errorG, errorB, 3 / 16); // Bottom-left
                         diffuseError(workingPixels, img.width, img.height, startPixelX, startPixelY + 1, errorR, errorG, errorB, 5 / 16); // Bottom
                         diffuseError(workingPixels, img.width, img.height, startPixelX + 1, startPixelY + 1, errorR, errorG, errorB, 1 / 16); // Bottom-right
                     }

                      // Add the /setblock command for this block position
                      // Coordinates are relative to the command executor's position (~ ~ ~)
                      commands.push(`setblock ~${x} ~${y + baseHeight} ~${zOffset} ${matchedBlock.id}`);

                 } else {
                    // If the pixel is transparent or has very low alpha, place a white block (treating transparent as empty/white)
                     matchedBlock = findClosestColor([255, 255, 255], minecraftPalette); // Match the white block (White Wool)
                     finalColorForCanvas = matchedBlock.color; // Use the white block's color for the preview pixel
                     commands.push(`setblock ~${x} ~${y + baseHeight} ~${zOffset} ${matchedBlock.id}`); // Add the /setblock command for the white block
                 }

                 // Draw a single pixel on the smaller preview canvas representing the chosen block color for this position
                 ctx.fillStyle = `rgb(${finalColorForCanvas[0]}, ${finalColorForCanvas[1]}, ${finalColorForCanvas[2]})`; // Set the drawing color
                 ctx.fillRect(x, y, 1, 1); // Draw a 1x1 pixel at (x, y) on the output grid canvas

            }
        }

        // Update the output textarea with the generated commands
        outputCommands.value = commands.join('\n'); // Join all commands with newlines
        // Update the status message below the convert button
        imageStatusMessage.textContent = `Converted image to ${commands.length} blocks (${outputWidth}x${outputHeight}).`; // Show command count and dimensions

        // Re-enable the convert button
        convertButton.disabled = false;
        // Enable Copy and Download buttons only if commands were generated
        copyButton.disabled = commands.length === 0;
        downloadButton.disabled = commands.length === 0;

        // Add the 'pixel-preview' class to the canvas after drawing, for styling purposes
        // This class is used to make the canvas visible and apply pixel rendering CSS.
        if (processingCanvas) processingCanvas.classList.add('pixel-preview');
    }


    // --- MCFunction to Nifty Building Tool NBT Converter Logic ---
    // Helper to read the content of a file as text asynchronously (used by NBT tool)
    function readFileContent(file) {
        const reader = new FileReader(); // Create a FileReader to read the file
        return new Promise((resolve, reject) => {
            reader.onload = event => resolve(event.target.result); // Resolve the promise with file content on success
            reader.onerror = error => reject(error); // Reject the promise with error on failure
            reader.readAsText(file); // Read the file content as text
        })
    }

    // Helper to extract relevant commands (setblock, fill, summon, structure) from .mcfunction content (used by NBT tool)
    function getUsefulCommands(content) {
        return content.split('\n') // Split the content into individual lines
            .map(x => x.replace(/^\s*\//, "").trim()) // Remove leading slash and trim whitespace from each line
            .filter(x => { // Filter out lines that are empty, comments, or not relevant building commands
                return x.length > 0 && !x.startsWith("#") && (x.startsWith("setblock") || x.startsWith("fill") || x.startsWith("summon") || x.startsWith("structure"));
            });
    }

    // NBT Helper Functions - Generate specific parts of the NBT string structure (used by NBT tool)
    // These functions build the complex string required for Nifty Building Tool NPCs/Blocks
    function getBlockOpener(nbt_name) {
        // Escape quotes and newlines for display strings (Lore and Name) within the NBT
        const escapedNbtNameForDisplay = nbt_name.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        // This is the opening part of the NBT structure for the "moving_block" entity that contains the NPCs
        return `{Block:{name:"minecraft:moving_block",states:{},version:17959425},Count:1b,Damage:0s,Name:"minecraft:moving_block",WasPickedUp:0b,tag:{display:{Lore:["Created using the Nifty Building Tool\\\\nBy Brutus314 and Clawsky123.\\\\n\\\\nÂ§gÂ§l${escapedNbtNameForDisplay}"],Name:"Â§gÂ§l${escapedNbtNameForDisplay}"},movingBlock:{name:"minecraft:sea_lantern",states:{},version:17879555},movingEntity:{Occupants:[`;
    }

    function getBlockCloser() {
        // The closing part of the NBT structure
        return '],id:"Beehive"}}}';
    }

    function getNPCOpener(section, nbt_name) {
         // Clean name for NPC tag and ticking area (allow alphanumeric, hyphen, underscore)
         const cleanedNbtNameForTag = nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "");
         // Escape quotes and backslashes for JSON string content within the NBT 'Actions' string
         const escapedNbtNameForJSON = nbt_name.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

        // The opening part of the NBT structure for an individual NPC entity
        return `{ActorIdentifier:"minecraft:npc<>",SaveData:{Persistent:1b,Pos:[],Variant:18,definitions:["+minecraft:npc"],RawtextName:"${escapedNbtNameForJSON}",CustomName:"${escapedNbtNameForJSON}",CustomNameVisible:1b,Tags:["${cleanedNbtNameForTag}${section}","NiftyBuildingTool"],Actions:"[{\\"button_name\\" : \\"Build Section ${section}\\",\\"data\\" : [`;
    }

    function getNPCCloser() {
        // The closing part of the NBT structure for an individual NPC entity
        return `],\\"mode\\" : 0,\\"text\\" : \\"\\",\\"type\\" : 1}]",InterativeText:"Â§4Â§lCreated using the Nifty Building Tool by Brutus314 and Clawsky123."},TicksLeftToStay:0}`;
    }

    // Helper to convert a command string into the required NBT format for the NPC dialogue 'data' field (used by NBT tool)
    function commandToNBT(command) {
        // Create the command object structure expected by Nifty Building Tool's dialogue system
        const commandObject = {
            cmd_line : command, // The command string itself
            cmd_ver : 12 // Nifty Building Tool command version (often 12 or higher depending on MCBE version)
        };
        // Convert the command object to a JSON string
        const jsonCommand = JSON.stringify(commandObject);
        // Escape the resulting JSON string for the 'data' field within the main NBT 'Actions' string.
        // This involves escaping both backslashes and quotes.
        return jsonCommand.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`); // Escape backslashes, then quotes
    }

    // Main processing logic for MCFunction to NBT conversion (triggered by file input change event)
    function processNBTFile(file) {
         // Check if necessary elements exist before proceeding
         if(!nbtStatusMessage || !nbtTitleInput || !commandsPerNpcInput) {
             console.error("Missing NBT tool elements. Cannot proceed."); // Log error
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Internal error: Missing page elements.'; // Report error to user
             return; // Stop the function
         }

         nbtStatusMessage.textContent = 'Processing commands...'; // Update status message
        // Read the file content as text asynchronously
        readFileContent(file).then(content => {
            // Extract relevant building commands from the file content
            const commands = getUsefulCommands(content);

            // Check if any useful commands were found
            if (commands.length === 0) {
                 nbtStatusMessage.textContent = 'No setblock, fill, summon, or structure commands found in the file.'; // Report to user
                 return; // Stop if no relevant commands are found
            }

            // Get options from user input, provide defaults if input is empty or invalid
            let commands_per_npc = parseInt(commandsPerNpcInput.value) || 346; // Default commands per NPC if input is invalid/empty
            let nbt_name = nbtTitleInput.value.trim() || "Unnamed Build"; // Default build title if input is empty
            let file_name;

            // Determine the output filename for the NBT file
            // Clean up nbt_name for use in the filename (allow alphanumeric, hyphen, underscore)
            const cleanNbtNameForFilename = nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "") || "Output"; // Default filename part if name is empty/invalid
            file_name = `NiftyBuildingTool_${cleanNbtNameForFilename}.txt`; // Construct the final filename


            // Validate commands per NPC, update input field if defaulted (although the || default already handles it)
            if (isNaN(commands_per_npc) || commands_per_npc <= 0) {
                commands_per_npc = 346; // Default limit
                 if (commandsPerNpcInput) commandsPerNpcInput.value = 346; // Update the input field visually if defaulted
            }

            let curSec = 0; // Counter for NPC sections (starts at 1 for display)
            // Start building the main NBT structure string
            let NBTdata = getBlockOpener(nbt_name); // Add the opening part of the NBT structure

            // Calculate the total number of NPCs required based on the number of commands and commands_per_npc limit
            let NPCCount = Math.ceil(commands.length / commands_per_npc);

            nbtStatusMessage.textContent = `Generating NBT for ${commands.length} commands across ${NPCCount} NPCs...`; // Update status

            // Loop through commands, splitting them into sections for each NPC
            for (var i = 0; i < commands.length; i += commands_per_npc) {
                curSec++; // Increment section counter (for NPC tag and dialogue button number)
                // Get the commands for the current NPC section (slice up to commands_per_npc)
                let NPCCommandList = commands.slice(i, i + commands_per_npc);
                // Determine the tag for the *next* NPC (loop back to 1 if this is the last NPC)
                let nextNPC = (curSec === NPCCount ? 1 : curSec + 1);

                // Clean name for NPC tag and ticking area (strict alphanumeric, hyphen, underscore)
                const cleanNbtNameForTag = nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "");

                // Add necessary commands to the start and end of the NPC's command list
                // Ticking area commands ensure chunks are loaded where the NPC executes commands
                NPCCommandList.unshift(`/tickingarea add circle ~ ~ ~ 4 NIFTYBUILDINGTOOL_${cleanNbtNameForTag}`); // Add ticking area start
                NPCCommandList.push(`/tickingarea remove NIFTYBUILDINGTOOL_${cleanNbtNameForTag}`); // Add ticking area end
                // Add dialogue command to open the next NPC's dialogue if there is a next NPC (and more than 1 NPC total)
                if (NPCCount > 1) {
                     NPCCommandList.push(`/dialogue open @e[tag="${cleanNbtNameForTag}${nextNPC}",type=NPC,c=1] @initiator`);
                }
                // Add command to kill the current NPC after it finishes executing its commands
                NPCCommandList.push(`/kill @s`); // Add kill command (targets the NPC itself)

                // Add the NBT structure string for the current NPC to the main NBT data string
                NBTdata += getNPCOpener(curSec, nbt_name); // Add NPC opening part (includes section number and name)
                // Convert each command in the current NPC's list to its NBT string representation and join them with commas
                NBTdata += NPCCommandList.map(x => commandToNBT(x.trim())).join(","); // Use commandToNBT helper
                NBTdata += getNPCCloser(); // Add NPC closing part

                // Add a comma separator between NPC NBT structures if this is not the last NPC
                if (curSec < NPCCount) {
                  NBTdata += ",";
                }
            }
            NBTdata += getBlockCloser(); // Add the closing part of the main NBT structure

            // Trigger the download of the generated NBT data
             nbtStatusMessage.textContent = 'Download starting...'; // Update status
            download(file_name, NBTdata); // Use the shared download function to download the .txt file

             nbtStatusMessage.textContent = `Successfully generated and downloaded ${file_name}.`; // Final success status message
        }).catch(error => {
             // Handle errors that occur during file reading or processing
             console.error("Error processing file:", error); // Log error to console
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Error processing file. Check console (F12) for details.'; // Report error to user
         });
    }


    // --- Add Global Event Listeners ---

    // Listener for the hamburger button to toggle sidebar visibility
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleSidebar); // Attach click listener
    } else { console.warn("Hamburger button not found, sidebar toggle will not work."); } // Warn if element is missing

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
    } else { console.warn("Sidebar menu not found."); } // Warn if element is missing

     if (sidebarFooter) {
        sidebarFooter.addEventListener('click', (event) => {
            const linkButton = event.target.closest('.sidebar-link'); // Check if the click was on a sidebar link or descendant
            if (linkButton && linkButton.dataset.section) { // If a link button was clicked and has a data-section attribute
                showSection(linkButton.dataset.section); // Show the corresponding content section

                 // Play click sound for sidebar links (handled by dedicated listener below)
                 // Close sidebar on mobile after click
                 if (window.innerWidth <= 768) {
                     toggleSidebar(); // Close the sidebar
                 }
            }
        });
    } else { console.warn("Sidebar footer not found."); } // Warn if element is missing


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
        // Check 5 specifically prevents double sounds on sidebar link buttons.
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
    // We also remove the initial 'muted' attribute here as user interaction is starting.
    const firstInteractionHandler = () => {
         if (backgroundMusic) backgroundMusic.muted = false; // Unmute the background music
         attemptBackgroundMusicPlayback(); // Attempt playback
         // Remove these specific handlers after they've run once
         document.body.removeEventListener('click', firstInteractionHandler);
         document.body.removeEventListener('keydown', firstInteractionHandler);
    };

    if (backgroundMusic) {
        document.body.addEventListener('click', firstInteractionHandler, { once: true }); // Trigger on first click anywhere
        document.body.addEventListener('keydown', firstInteractionHandler, { once: true }); // Trigger on first key press anywhere
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
