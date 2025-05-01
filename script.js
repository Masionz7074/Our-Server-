// script.js Minecraftia-themed Application

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // console.log("DOM fully loaded. Initializing application.");

    // --- Get ALL Element References FIRST ---

    // Global Elements and Navigation
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarLinks = document.querySelectorAll('#sidebar .sidebar-link');
    const mainContent = document.getElementById('mainContent');
    const contentSections = document.querySelectorAll('.content-section');

    // Function Pack Creator Tool Elements
    // const functionPackToolSection = document.getElementById('functionPackTool'); // Not strictly needed as a variable here
    const generateBtn = document.getElementById('generateBtn');
    const packNameInput = document.getElementById('packName');
    const packDescriptionInput = document.getElementById('packDescription');
    const packIconInput = document.getElementById('packIcon');
    const presetListDiv = document.getElementById('presetList');
    // const selectedPresetsDiv = document.getElementById('selectedPresets'); // Not strictly needed as a variable here
    const selectedPresetsListUl = document.getElementById('selectedPresetsList');
    const packStatusDiv = document.getElementById('packStatus');

    // QR Code to MCFunction Tool Elements
    // const qrToolSection = document.getElementById('qrTool'); // Not strictly needed as a variable here
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const processingCanvas = document.getElementById('processingCanvas');
    const ctx = processingCanvas ? processingCanvas.getContext('2d') : null; // Get context only if canvas exists
    const convertButton = document.getElementById('convertButton');
    const outputCommands = document.getElementById('outputCommands');
    const copyButton = document.getElementById('copyButton');
    const downloadButton = document.getElementById('downloadButton');
    const imageStatusMessage = document.getElementById('imageStatusMessage');
    const pixelRatioInput = document.getElementById('pixelRatio');
    const baseHeightInput = document.getElementById('baseHeight');
    const zOffsetInput = document.getElementById('zOffset');
    const ditheringEnabledInput = document.getElementById('ditheringEnabled');
    const thresholdInput = document.getElementById('threshold');
    const thresholdValueSpan = document.getElementById('thresholdValue');

    // MCFunction to Nifty Building Tool NBT Elements
    // const nbtToolSection = document.getElementById('nbtTool'); // Not strictly needed as a variable here
    const nbtStatusMessage = document.getElementById('nbtStatusMessage');
    const nbtFileInput = document.getElementById('input-file');
    const nbtTitleInput = document.getElementById('nbt-title');
    const commandsPerNpcInput = document.getElementById('commands-per-npc');

    // Settings Tool Elements (Only SFX remains)
    // const settingsToolSection = document.getElementById('settingsTool'); // Not strictly needed as a variable here
    // const musicVolumeInput = document.getElementById('musicVolume'); // Removed
    // const musicVolumeValueSpan = document.getElementById('musicVolumeValue'); // Removed
    const sfxVolumeInput = document.getElementById('sfxVolume');
    const sfxVolumeValueSpan = document.getElementById('sfxVolumeValue');
    // const toggleMusicBtn = document.getElementById('toggleMusicBtn'); // Removed

    // Audio Elements
    const clickSound = document.getElementById('clickSound');
    const backgroundMusic = document.getElementById('backgroundMusic'); // Keep reference


    // --- Set Initial Audio Volumes and State (Read from localStorage) ---
    // const MUSIC_VOLUME_STORAGE_KEY = 'minecraftToolsMusicVolume'; // Removed
    const SFX_VOLUME_STORAGE_KEY = 'minecraftToolsSfxVolume';

    // Configure background music (simplified)
    if (backgroundMusic) {
        backgroundMusic.src = 'sounds/background.mp3'; // Set the source
        backgroundMusic.loop = true; // Loop the music
        backgroundMusic.volume = 0.5; // Set a default volume (can be adjusted here if needed, but no slider)
        backgroundMusic.pause(); // Start paused
        backgroundMusic.currentTime = 0; // Start from the beginning
        backgroundMusic.muted = true; // Start muted to prevent autoplay issues before interaction
        // console.log(`Background music element found. Source set to ${backgroundMusic.src}.`);
    } else {
        console.warn("Background music element with ID 'backgroundMusic' not found. Music playback disabled.");
    }

     // Configure click sound (SFX remains)
     if (clickSound) {
        const savedSfxVolume = localStorage.getItem(SFX_VOLUME_STORAGE_KEY);
         clickSound.volume = savedSfxVolume !== null && !isNaN(parseFloat(savedSfxVolume)) ? parseFloat(savedSfxVolume) : 1.0;
         // console.log(`Initial SFX Volume: ${clickSound.volume}`);
     } else {
         console.warn("Click sound element with ID 'clickSound' not found. SFX disabled.");
         if (sfxVolumeInput) sfxVolumeInput.disabled = true;
     }


    // --- Global Functions (Navigation, Download, Sound) ---

    function toggleSidebar() {
        if (sidebar) {
            sidebar.classList.toggle('open');
            document.body.classList.toggle('sidebar-open');
            // console.log("Sidebar toggled.");
        } else {
            console.warn("Sidebar element not found.");
        }
    }

    function showSection(sectionId) {
        // Hide all content sections first
        contentSections.forEach(section => {
            section.style.display = 'none';
        });

        // Show the selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.style.display = 'block';
            // console.log(`Showing section: ${sectionId}`);

             // Scroll main content to top
             if (mainContent) {
                 mainContent.scrollTo({ top: 0, behavior: 'auto' });
             }

            // Update active class on sidebar links
            sidebarLinks.forEach(link => {
                 if (link.dataset.section === sectionId) {
                     link.classList.add('active-section');
                 } else {
                     link.classList.remove('active-section');
                 }
            });

            // --- Tool-specific Initialization/Reset ---
            if (sectionId === 'functionPackTool') {
                // Ensure presets are rendered when the section is shown
                if (presetListDiv && selectedPresetsListUl) {
                    renderPresetList();
                    renderSelectedPresetsList(); // Also calls renderPresetList internally
                } else { console.warn("Function Pack Creator preset elements not found."); }
                 if (packStatusDiv) packStatusDiv.textContent = ''; // Clear status message
                 if (generateBtn) generateBtn.disabled = false; // Ensure button is enabled
            } else if (sectionId === 'qrTool') {
                // Reset QR Tool state
                if (thresholdInput && thresholdValueSpan) {
                    // Update threshold display and track on section load
                    const updateThresholdDisplay = () => {
                        thresholdValueSpan.textContent = thresholdInput.value;
                        // Ensure this CSS variable update is specific to the threshold slider
                        thresholdInput.style.setProperty('--threshold-progress', `${(parseFloat(thresholdInput.value) / 255) * 100}%`);
                    };
                    // Listener attached below, just call initially
                    updateThresholdDisplay();
                } else { console.warn("QR Tool threshold elements not found."); }

                 if (imagePreview) imagePreview.style.display = 'none'; // Hide preview
                 if (convertButton) convertButton.disabled = true; // Disable convert button
                 if (outputCommands) outputCommands.value = ''; // Clear output
                 if (copyButton) copyButton.disabled = true; // Disable copy
                 if (downloadButton) downloadButton.disabled = true; // Disable download
                 if (imageStatusMessage) imageStatusMessage.textContent = 'Select an image to begin.'; // Reset status
                 if (processingCanvas) processingCanvas.classList.remove('pixel-preview'); // Remove pixelated style

            } else if (sectionId === 'settingsTool') {
                 // Update SFX UI based on current state (Music part removed)
                 if (sfxVolumeInput && sfxVolumeValueSpan && clickSound) {
                     sfxVolumeInput.value = clickSound.volume;
                     sfxVolumeValueSpan.textContent = `${Math.round(clickSound.volume * 100)}%`;
                     // Ensure this CSS variable update is specific to the SFX slider if needed,
                     // but the CSS uses --threshold-progress which is shared/problematic.
                     // Let's remove the style update here and rely on the input listener.
                     // sfxVolumeInput.style.setProperty('--threshold-progress', `${(clickSound.volume / 1) * 100}%`); // Removed
                 } else if (sfxVolumeInput) {
                     sfxVolumeInput.disabled = true;
                 }

            } else if (sectionId === 'nbtTool') {
                 // Reset NBT Tool state
                 if (nbtStatusMessage) nbtStatusMessage.textContent = 'Select an .mcfunction file to convert.'; // Reset status
                 // Note: File input value cannot be reset directly for security reasons.
            }
        } else {
             console.error(`Content section with ID "${sectionId}" not found.`);
        }

        // Close sidebar automatically on mobile after selecting a section
        if (window.innerWidth <= 768 && document.body.classList.contains('sidebar-open')) {
             toggleSidebar();
        }
    }

    function download(filename, textOrBlob) {
        const element = document.createElement('a');
        if (textOrBlob instanceof Blob) {
             element.setAttribute('href', URL.createObjectURL(textOrBlob));
        } else {
             element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textOrBlob));
        }
        element.setAttribute('download', filename);
        element.style.display = 'none'; // Hide the element
        document.body.appendChild(element);
        element.click(); // Simulate click
        document.body.removeChild(element); // Clean up

        // For Blobs, revoke the URL to free up memory
        if (textOrBlob instanceof Blob) {
             URL.revokeObjectURL(element.href);
        }
         // console.log(`Downloaded: ${filename}`);
    }

    function playClickSound() {
        if (clickSound && clickSound.volume > 0) {
            clickSound.currentTime = 0; // Rewind to start
            clickSound.play().catch(e => {
                // console.warn("Click sound playback failed:", e);
            });
             // console.log("Played click sound.");
        } else if (!clickSound) {
             // console.warn("Click sound element not found, cannot play.");
        }
    }

    // Attempt to play background music after a user interaction
    // Browsers prevent autoplay until the user interacts with the page.
    function tryStartBackgroundMusic() {
        if (backgroundMusic && backgroundMusic.paused) {
             backgroundMusic.muted = false; // Unmute

            const playPromise = backgroundMusic.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // console.log("Background music started successfully.");
                    // Remove the listeners once playback starts
                    document.body.removeEventListener('click', firstInteractionHandler);
                    document.body.removeEventListener('keydown', firstInteractionHandler);
                }).catch(error => {
                    // Autoplay was prevented
                    // console.warn("Background music autoplay blocked or failed:", error);
                     backgroundMusic.muted = true; // Keep muted if autoplay failed
                });
            } else {
                 // Some older browsers might not return a promise
                 // console.log("Attempted background music play (no promise returned).");
                 // Assume it might have worked and remove listeners
                 document.body.removeEventListener('click', firstInteractionHandler);
                 document.body.removeEventListener('keydown', firstInteractionHandler);
            }
        } else if (!backgroundMusic) {
             // console.warn("Background music element not found, cannot attempt playback.");
        }
    }

    // SFX volume change handler (Music volume handler removed)
    function handleSfxVolumeChange() {
         if (clickSound && sfxVolumeInput && sfxVolumeValueSpan) {
            const volume = parseFloat(sfxVolumeInput.value);
            if (!isNaN(volume)) {
                 clickSound.volume = volume;
                 sfxVolumeValueSpan.textContent = `${Math.round(volume * 100)}%`;
                 // The CSS variable --threshold-progress is shared. If you want a visual
                 // progress bar for the SFX slider, you should use a different CSS variable
                 // or update the CSS. For now, removing the CSS variable update here.
                 // sfxVolumeInput.style.setProperty('--threshold-progress', `${(volume / 1) * 100}%`); // Removed
                 localStorage.setItem(SFX_VOLUME_STORAGE_KEY, volume.toString());
                 // console.log(`SFX volume set to: ${volume}`);

                 // Play a sound preview when the slider is moved (if volume > 0)
                 const lastValue = parseFloat(sfxVolumeInput.dataset.lastValue || '0');
                 if (volume > 0 && volume > lastValue + 0.01) { // Play only on increase, with a small buffer
                     playClickSound();
                 }
                 sfxVolumeInput.dataset.lastValue = sfxVolumeInput.value; // Store current value for next comparison
            }
         } else { console.warn("SFX volume elements or audio not found."); }
    }

    // Toggle music playback function removed


    // --- Function Pack Creator Logic ---

    // State variable to track selected presets
    let selectedPresetIds = new Set();

    // Define available presets
    const allPresets = [
        { id: 'coords_to_score', name: 'Coords to Scores', description: 'Stores player X, Y, Z coordinates into scoreboard objectives each tick.', objectives: [{ name: "coordX", type: "dummy" }, { name: "coordY", type: "dummy" }, { name: "coordZ", type: "dummy" }], setup_commands: [], main_commands: ['# Store player coordinates in scores', 'execute as @a store result score @s coordX run data get entity @s Pos[0] 100', 'execute as @a store result score @s coordY run data get entity @s Pos[1] 100', 'execute as @a store result score @s coordZ run data get entity @s Pos[2] 100'], additional_files: [] },
        { id: 'on_death', name: 'On Player Death', description: 'Detects player deaths using deathCount and runs a function.', objectives: [{ name: "deaths", type: "deathCount" }], setup_commands: [], main_commands: ['# Check for players who have died', 'execute as @a[scores={deaths=1..}] run function <pack_namespace>:on_death_action'], additional_files: [{ filename: "on_death_action.mcfunction", content: "# This function runs when a player dies.\n# Add your commands here.\n# Example: Send a message\ntellraw @s {\"text\":\"You died!\",\"color\":\"red\"}\n\n# IMPORTANT: Reset the death score\nscoreboard players set @s deaths 0" }] },
        { id: 'on_first_join', name: 'On First Join', description: 'Runs a function when a player joins the world for the first time.', objectives: [{ name: "has_joined", type: "dummy" }], setup_commands: [], main_commands: ['# Check for players who have just joined', 'execute as @a unless score @s has_joined matches 1 run function <pack_namespace>:on_first_join_action', '# Mark players as having joined', 'scoreboard players set @a[scores={has_joined=..0}] has_joined 1'], additional_files: [{ filename: "on_first_join_action.mcfunction", content: "# This function runs on a player's first join.\n# Add commands here.\n# Example: Send a welcome message\ntellraw @s {\"text\":\"Welcome to the world!\",\"color\":\"gold\"}" }] }
         // Add more presets here following the same structure
    ];

    function renderPresetList() {
        if (!presetListDiv) { console.warn("Preset list div not found."); return; }
        presetListDiv.innerHTML = ''; // Clear current list
        allPresets.forEach(preset => {
            // Only show presets that are NOT already selected
            if (!selectedPresetIds.has(preset.id)) {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>
                        <strong>${preset.name}</strong><br>
                        <small>${preset.description}</small>
                    </span>
                    <button data-preset-id="${preset.id}" data-action="add">Add</button>
                `;
                presetListDiv.appendChild(li);
            }
        });
         // console.log("Available presets rendered.");
    }

    function renderSelectedPresetsList() {
        if (!selectedPresetsListUl) { console.warn("Selected presets list ul not found."); return; }
        selectedPresetsListUl.innerHTML = ''; // Clear current list
         selectedPresetIds.forEach(presetId => {
            const preset = allPresets.find(p => p.id === presetId);
            if (preset) {
                 const li = document.createElement('li');
                 li.innerHTML = `
                     <span>${preset.name}</span>
                     <button data-preset-id="${preset.id}" data-action="remove">Remove</button>
                 `;
                 selectedPresetsListUl.appendChild(li);
            } else {
                 console.warn(`Selected preset with ID "${presetId}" not found in allPresets.`);
                 // Optionally remove invalid IDs from selectedPresetIds
                 selectedPresetIds.delete(presetId);
            }
         });
         // After rendering selected, re-render the available list to update
         renderPresetList();
         // console.log("Selected presets rendered.");
    }

    // Handle clicks on both Add and Remove buttons using event delegation
    function handlePresetButtonClick(event) {
        const button = event.target.closest('#presetList li button, #selectedPresetsList li button');
        if (!button || !button.dataset.action || !button.dataset.presetId) return; // Not a preset button click

        const presetId = button.dataset.presetId;
        const action = button.dataset.action;

        if (action === 'add') {
            if (!selectedPresetIds.has(presetId)) {
                selectedPresetIds.add(presetId);
                 // console.log(`Added preset: ${presetId}`);
            }
        } else if (action === 'remove') {
            if (selectedPresetIds.has(presetId)) {
                selectedPresetIds.delete(presetId);
                 // console.log(`Removed preset: ${presetId}`);
            }
        }

        // Re-render both lists to reflect the change
        renderSelectedPresetsList(); // This also calls renderPresetList
         playClickSound(); // Play sound for preset add/remove
    }

    // Basic UUID generator (simplified)
    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for older environments (less collision resistant)
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Sanitize pack name for use as a namespace
    function sanitizeNamespace(name) {
        return name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_').replace(/^_|_$/g, '');
    }

    async function generatePack() {
         // Check if required elements exist before proceeding
         if (!generateBtn || !packStatusDiv || !packNameInput || !packDescriptionInput || !packIconInput || typeof JSZip === 'undefined') {
             console.error("Missing required elements or JSZip library for pack generation. Cannot proceed.");
             if(packStatusDiv) packStatusDiv.textContent = 'Error generating pack: Missing page elements or JSZip library.';
              if(generateBtn) generateBtn.disabled = false; // Ensure button is re-enabled if it was clicked
             return;
         }

        generateBtn.disabled = true; // Disable button during generation
        if(packStatusDiv) packStatusDiv.textContent = 'Generating pack...';

        const packName = packNameInput.value.trim() || 'My Function Pack';
        const packDescription = packDescriptionInput.value.trim() || 'Generated by the online tool';
        const packIconFile = packIconInput.files[0];
        const packNamespace = sanitizeNamespace(packName) || 'my_pack';

        // Generate UUIDs for manifest
        const manifestUuid = generateUUID();
        const moduleUuid = generateUUID();

        // Build manifest.json content
        const manifestContent = JSON.stringify({
            "format_version": 2,
            "header": {
                "name": packName,
                "description": packDescription,
                "uuid": manifestUuid,
                "version": [1, 0, 0],
                "min_engine_version": [1, 16, 0] // Bedrock Edition 1.16+
            },
            "modules": [
                {
                    "type": "data", // Indicates this is a behavior pack module
                    "uuid": moduleUuid,
                    "version": [1, 0, 0]
                }
            ]
        }, null, 4); // Use 4 spaces for indentation

        // Build tick.json content
        const tickJsonContent = JSON.stringify({
             // The 'values' array lists functions to run every tick
             "values": [
                `${packNamespace}:main` // Assumes a main function in your namespace
             ]
        }, null, 4);

        // Start building main.mcfunction content
        const mainCommands = [
            `# Function pack: ${packName}`,
            `# Namespace: ${packNamespace}`,
            '',
            '# --- Setup & Objectives ---',
            `# This section runs setup commands and objective creation`,
            `function ${packNamespace}:setup`, // Call setup function once (typically on first tick)
            `function ${packNamespace}:objectives`, // Call objectives function once (typically on first tick)
            '',
            '# --- Tick Commands (Runs every tick via tick.json) ---',
            '# Add your custom tick commands below this line',
            ''
        ];

        // Collect objectives, setup commands, and additional files from selected presets
        const requiredObjectives = new Map();
        const requiredSetupCommands = new Set();
        const additionalFilesMap = new Map(); // Map filename -> content

        selectedPresetIds.forEach(presetId => {
            const preset = allPresets.find(p => p.id === presetId);
            if (preset) {
                // Add preset objectives
                preset.objectives.forEach(obj => requiredObjectives.set(obj.name, obj));
                // Add preset setup commands
                preset.setup_commands.forEach(cmd => requiredSetupCommands.add(cmd));
                // Add preset main commands to the main function
                mainCommands.push('');
                mainCommands.push(`# --- Preset: ${preset.name} ---`);
                preset.main_commands.forEach(cmd => {
                     // Replace placeholder namespace with the actual pack namespace
                     mainCommands.push(cmd.replace(/<pack_namespace>/g, packNamespace));
                });
                 // Add preset additional files
                 preset.additional_files.forEach(file => {
                     const fullPath = `${packNamespace}/${file.filename}`; // e.g., my_pack/on_death_action.mcfunction
                      if (additionalFilesMap.has(fullPath)) {
                         console.warn(`Duplicate additional file generated: ${fullPath}. Content is being overwritten.`);
                      }
                     // Replace placeholder namespace in additional files too
                     additionalFilesMap.set(fullPath, file.content.replace(/<pack_namespace>/g, packNamespace));
                 });
            }
        });

         // Add a dummy objective used in the objectives function itself to prevent re-running
         requiredObjectives.set('objectives', {name: 'objectives', type: 'dummy'});

         // Build objectives.mcfunction content
         const objectiveCommands = [
             `# Automatically added objectives for pack: ${packName}`,
             '# This function adds necessary scoreboard objectives if they do not exist.',
             '# It should be run once, typically from main.mcfunction on the first tick.',
             '',
             '# Check if the dummy objective exists (indicates objectives have been set up)',
             `execute as @a at @s unless score @s "objectives" objectives matches 1 run function ${packNamespace}:_add_objectives`,
             '',
             '# Set the dummy objective to 1 for players who just had objectives added',
             '# This prevents _add_objectives from running again for them.',
             `execute as @a[scores={objectives=..0}] run scoreboard players set @s "objectives" 1`
         ];

         // Build _add_objectives.mcfunction content (actual objective creation)
         const addObjectiveCommands = [
             `# Objective creation commands for pack: ${packName}`,
             '# This function is called by objectives.mcfunction to add objectives.',
             '# It runs only if the "objectives" dummy score is not 1 for the player.',
             '',
             ...Array.from(requiredObjectives.keys()).sort().map(objName => {
                 const obj = requiredObjectives.get(objName);
                 // Use `unless objective <name> exists` once available in Bedrock,
                 // For now, rely on the dummy score check in objectives.mcfunction
                 // or add a dummy score check here per objective if needed for robustness.
                 // Simple add command for now, assuming it runs only once per player.
                 return `scoreboard objectives add "${obj.name}" ${obj.type}`;
             })
         ];


         // Build setup.mcfunction content
         const setupCommands = [
             `# Setup commands for pack: ${packName}`,
              '# This function runs once when the pack is loaded/enabled (typically called from main.mcfunction on the first tick).',
              '',
              ...Array.from(requiredSetupCommands).sort(), // Sort setup commands alphabetically
              '',
              '# Example: Send a message to ops when the pack is loaded',
              'tellraw @a[tag=minecraft:is_op] {"text":"Function pack loaded: ' + packName.replace(/"/g, '\\"') + '","color":"green"}'
         ];

         // Combine all function files
         const allFunctionFiles = new Map([
             [`${packNamespace}/main.mcfunction`, mainCommands.join('\n')],
             [`${packNamespace}/objectives.mcfunction`, objectiveCommands.join('\n')],
             [`${packNamespace}/_add_objectives.mcfunction`, addObjectiveCommands.join('\n')], // New function for actual adding
             [`${packNamespace}/setup.mcfunction`, setupCommands.join('\n')],
             ...additionalFilesMap // Add files from presets
         ]);


        // Create a new JSZip instance
        const zip = new JSZip();

        // Add manifest.json
        zip.file("manifest.json", manifestContent);

        // Add pack_icon.png if provided
        if (packIconFile) {
             try {
                 const iconData = await packIconFile.arrayBuffer();
                 zip.file("pack_icon.png", iconData);
                 // console.log("Added pack_icon.png to zip.");
             } catch (error) {
                 if(packStatusDiv) packStatusDiv.textContent = `Error reading pack icon: ${error}`;
                 console.error("Error reading pack icon:", error);
                 generateBtn.disabled = false;
                 return; // Stop generation if icon fails
             }
        }

        // Create 'functions' folder and add tick.json
        const functionsFolder = zip.folder("functions");
        functionsFolder.file("tick.json", tickJsonContent);
        // console.log("Added tick.json to zip.");

        // Add all generated .mcfunction files to the functions folder
        allFunctionFiles.forEach((content, relativePath) => {
            functionsFolder.file(relativePath, content);
             // console.log(`Added function file: functions/${relativePath}`);
        });


        // Generate the zip file asynchronously
        zip.generateAsync({ type: "blob" })
            .then(function(content) {
                // Use the download function to save the zip file
                download(`${packName}.zip`, content);

                if(packStatusDiv) packStatusDiv.textContent = 'Pack generated and downloaded successfully!';
                generateBtn.disabled = false; // Re-enable button

            })
            .catch(function(error) {
                // Handle any errors during zip generation
                if(packStatusDiv) packStatusDiv.textContent = `Error generating pack: ${error}`;
                generateBtn.disabled = false; // Re-enable button
                console.error("Error generating zip:", error);
            });
    }


    // --- QR Code to MCFunction Logic ---

    // Minecraft color palette (Black Concrete and White Wool)
    const minecraftPalette = [
         { id: 'minecraft:black_concrete', color: [18, 20, 26] }, // Approx RGB for black concrete
         { id: 'minecraft:white_wool', color: [242, 242, 242] } // Approx RGB for white wool
    ];

    // Find the closest color in the palette for a given pixel color
    function findClosestColor(pixelColor, palette, threshold) {
        const black = palette[0];
        const white = palette[1];

        const r = pixelColor[0];
        const g = pixelColor[1];
        const b = pixelColor[2];

        // Calculate luminance (perceived brightness)
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        // Compare luminance to the threshold
        if (luminance < threshold) {
            return black;
        } else {
            return white;
        }
    }

    // Floyd-Steinberg dithering error diffusion
     function diffuseError(workingPixels, width, height, px, py, er, eg, eb, weight) {
         // Check if the target pixel is within bounds
         if (px >= 0 && px < width && py >= 0 && py < height) {
             const idx = (py * width + px) * 4; // Index in the pixel data array
             // Only diffuse if the pixel is not fully transparent (alpha > 10)
             if (workingPixels[idx + 3] > 10) {
                 // Add weighted error to the pixel's RGB values, clamping to 0-255
                 workingPixels[idx] = Math.max(0, Math.min(255, workingPixels[idx] + er * weight));
                 workingPixels[idx + 1] = Math.max(0, Math.min(255, workingPixels[idx + 1] + eg * weight));
                 workingPixels[idx + 2] = Math.max(0, Math.min(255, workingPixels[idx + 2] + eb * weight));
             }
         }
     }

    function processImage(img) {
        // Check if required elements exist
        if (!ctx || !processingCanvas || !pixelRatioInput || !baseHeightInput || !zOffsetInput || !ditheringEnabledInput || !outputCommands || !imageStatusMessage || !convertButton || !copyButton || !downloadButton || !thresholdInput) {
             console.error("Missing required elements inside processImage. Cannot proceed.");
             if(imageStatusMessage) imageStatusMessage.textContent = 'Internal error during processing: Missing elements.';
             if(convertButton) convertButton.disabled = false;
             return;
        }

        const pixelRatio = parseInt(pixelRatioInput.value) || 1;
        const baseHeight = parseInt(baseHeightInput.value) || 64;
        const zOffset = parseInt(zOffsetInput.value) || 0;
        const ditheringEnabled = ditheringEnabledInput.checked;
        const threshold = parseInt(thresholdInput.value) || 128;


        if (pixelRatio < 1) {
             imageStatusMessage.textContent = 'Pixels per Block must be at least 1.';
             convertButton.disabled = false;
             return;
        }

        // Draw the original image onto the canvas at its full size to get pixel data
        processingCanvas.width = img.width;
        processingCanvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Get the pixel data from the canvas
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;
        // Create a copy of pixel data for dithering if enabled, otherwise use original
        const workingPixels = ditheringEnabled ? new Uint8ClampedArray(pixels) : pixels;


        const commands = [];
        // Calculate output dimensions based on pixel ratio
        const outputWidth = Math.floor(img.width / pixelRatio);
        const outputHeight = Math.floor(img.height / pixelRatio);

        if (outputWidth === 0 || outputHeight === 0) {
            imageStatusMessage.textContent = 'Image is too small for the chosen Pixels per Block.';
            convertButton.disabled = false;
            return;
        }

         // Resize canvas for the pixel preview (1:1 with output blocks)
         ctx.clearRect(0, 0, processingCanvas.width, processingCanvas.height); // Clear previous drawing
        processingCanvas.width = outputWidth;
        processingCanvas.height = outputHeight;
         ctx.fillStyle = '#1a1a1a'; // Background for transparent areas
         ctx.fillRect(0, 0, outputWidth, outputHeight);


        // Loop through the output block grid
        for (let y = 0; y < outputHeight; y++) {
            for (let x = 0; x < outputWidth; x++) {
                 // Calculate the starting pixel coordinates in the original image data for this block
                 const startPixelX = x * pixelRatio;
                 const startPixelY = y * pixelRatio;

                 // Get the color of the top-left pixel of the block's corresponding area in the original image
                 // This is where we sample the color, and where dithering error originates from
                 const pixelIndex = (startPixelY * img.width + startPixelX) * 4;
                 const pixelR = workingPixels[pixelIndex];
                 const pixelG = workingPixels[pixelIndex + 1];
                 const pixelB = workingPixels[pixelIndex + 2];
                 const pixelA = workingPixels[pixelIndex + 3];


                 let matchedBlock = null;
                 let finalColorForCanvas = [0, 0, 0]; // Default to black for transparent/errors

                 // Process only if the pixel is not mostly transparent
                 if (pixelA > 10) {
                     const originalColor = [pixelR, pixelG, pixelB];
                     // Find the closest block color based on the current pixel color and threshold
                     matchedBlock = findClosestColor(originalColor, minecraftPalette, threshold);

                     // Use the *actual* color of the chosen block for the canvas preview
                     finalColorForCanvas = matchedBlock.color;

                     // Apply Floyd-Steinberg dithering if enabled
                     if (ditheringEnabled) {
                         // Calculate the error between the original color and the chosen block color
                         let errorR = originalColor[0] - matchedBlock.color[0];
                         let errorG = originalColor[1] - matchedBlock.color[1];
                         let errorB = originalColor[2] - matchedBlock.color[2];

                         // Distribute the error to neighboring pixels (Floyd-Steinberg weights)
                         diffuseError(workingPixels, img.width, img.height, startPixelX + 1, startPixelY, errorR, errorG, errorB, 7 / 16); // Pixel to the right
                         diffuseError(workingPixels, img.width, img.height, startPixelX - 1, startPixelY + 1, errorR, errorG, errorB, 3 / 16); // Pixel bottom-left
                         diffuseError(workingPixels, img.width, img.height, startPixelX, startPixelY + 1, errorR, errorG, errorB, 5 / 16);     // Pixel directly below
                         diffuseError(workingPixels, img.width, img.height, startPixelX + 1, startPixelY + 1, errorR, errorG, errorB, 1 / 16); // Pixel bottom-right
                     }

                      // Add the setblock command for this block
                      commands.push(`setblock ~${x} ~${y + baseHeight} ~${zOffset} ${matchedBlock.id}`);

                 } else {
                     // If pixel is transparent, place white wool (or choose another default/transparent block)
                     // Using white wool as a default "background" for transparent pixels based on the original code's behavior
                     matchedBlock = findClosestColor([255, 255, 255], minecraftPalette, threshold); // Treat transparent as white for block choice
                     finalColorForCanvas = matchedBlock.color; // Use the color of the chosen block (white wool)
                     commands.push(`setblock ~${x} ~${y + baseHeight} ~${zOffset} ${matchedBlock.id}`);
                 }

                 // Draw the chosen block's color onto the preview canvas
                 ctx.fillStyle = `rgb(${finalColorForCanvas[0]}, ${finalColorForCanvas[1]}, ${finalColorForCanvas[2]})`;
                 ctx.fillRect(x, y, 1, 1); // Draw a 1x1 pixel block on the preview canvas
            }
        }

        // Update the output area
        outputCommands.value = commands.join('\n');
        imageStatusMessage.textContent = `Converted image to ${commands.length} blocks (${outputWidth}x${outputHeight}).`;
        convertButton.disabled = false; // Re-enable button
        copyButton.disabled = commands.length === 0; // Enable copy if commands exist
        downloadButton.disabled = commands.length === 0; // Enable download if commands exist

        // Add the pixelated class to the canvas for correct rendering
        if (processingCanvas) processingCanvas.classList.add('pixel-preview');
         // console.log("Image processing complete.");
    }


    // --- MCFunction to Nifty Building Tool NBT Logic ---

    // Promise wrapper for FileReader
    function readFileContent(file) {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = event => resolve(event.target.result);
            reader.onerror = error => reject(error);
            reader.readAsText(file);
        })
    }

    // Filter commands to keep only setblock, fill, summon, structure
    function getUsefulCommands(content) {
        return content.split('\n') // Split into lines
            .map(x => x.replace(/^\s*\//, "").trim()) // Remove leading slashes and trim whitespace
            .filter(x => { // Keep lines that are not empty, not comments, and start with specific commands
                return x.length > 0 && !x.startsWith("#") && (x.startsWith("setblock") || x.startsWith("fill") || x.startsWith("summon") || x.startsWith("structure"));
            });
    }

    // NBT formatting helper functions (as provided by user)
    function getBlockOpener(nbt_name) {
        const escapedNbtNameForDisplay = nbt_name.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        return `{Block:{name:"minecraft:moving_block",states:{},version:17959425},Count:1b,Damage:0s,Name:"minecraft:moving_block",WasPickedUp:0b,tag:{display:{Lore:["Created using the Nifty Building Tool\\\\nBy Brutus314 and Clawsky123.\\\\n\\\\n§g§l${escapedNbtNameForDisplay}"],Name:"§g§l${escapedNbtNameForDisplay}"},movingBlock:{name:"minecraft:sea_lantern",states:{},version:17879555},movingEntity:{Occupants:[`;
    }

    function getBlockCloser() {
        return '],id:"Beehive"}}}';
    }

    function getNPCOpener(section, nbt_name) {
         const cleanedNbtNameForTag = nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "");
         const escapedNbtNameForJSON = nbt_name.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

        return `{ActorIdentifier:"minecraft:npc<>",SaveData:{Persistent:1b,Pos:[],Variant:18,definitions:["+minecraft:npc"],RawtextName:"${escapedNbtNameForJSON}",CustomName:"${escapedNbtNameForJSON}",CustomNameVisible:1b,Tags:["${cleanedNbtNameForTag}${section}","NiftyBuildingTool"],Actions:"[{\\"button_name\\" : \\"Build Section ${section}\\",\\"data\\" : [`;
    }

    function getNPCCloser() {
        return `],\\"mode\\" : 0,\\"text\\" : \\"\\",\\"type\\" : 1}]",InterativeText:"§4§lCreated using the Nifty Building Tool by Brutus314 and Clawsky123."},TicksLeftToStay:0}`;
    }

    function commandToNBT(command) {
        // Escape backslashes and double quotes for JSON string
        const jsonCommand = JSON.stringify({
            cmd_line : command,
            cmd_ver : 12 // Command version for Bedrock Edition NPCs
        });
        // The Nifty Building Tool format requires *additional* escaping of backslashes and double quotes within the JSON string itself
        return jsonCommand.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
    }

    async function processNBTFile(file) {
         // Check if required elements exist
         if(!nbtStatusMessage || !nbtTitleInput || !commandsPerNpcInput) {
             console.error("Missing NBT tool elements. Cannot proceed.");
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Internal error: Missing elements.';
             return;
         }

         nbtStatusMessage.textContent = 'Reading file...';

         try {
             const content = await readFileContent(file);
             nbtStatusMessage.textContent = 'Processing commands...';

             const commands = getUsefulCommands(content);

             if (commands.length === 0) {
                  nbtStatusMessage.textContent = 'No setblock, fill, summon, or structure commands found in the file.';
                  return;
             }

             let commands_per_npc = parseInt(commandsPerNpcInput.value) || 346;
             let nbt_name = nbtTitleInput.value.trim() || "Unnamed Build";

             const cleanNbtNameForFilename = nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "") || "Output";
             const file_name = `NiftyBuildingTool_${cleanNbtNameForFilename}.txt`;


             if (isNaN(commands_per_npc) || commands_per_npc <= 0) {
                commands_per_npc = 346;
                 if (commandsPerNpcInput) commandsPerNpcInput.value = 346; // Reset input if invalid
             }

             let curSec = 0;
             let NBTdata = getBlockOpener(nbt_name); // Start the main NBT structure

             let NPCCount = Math.ceil(commands.length / commands_per_npc);

             nbtStatusMessage.textContent = `Generating NBT for ${commands.length} commands across ${NPCCount} NPCs...`;

             // Iterate through commands, chunking them for each NPC
             for (var i = 0; i < commands.length; i += commands_per_npc) {
                 curSec++; // Current NPC section number
                 let NPCCommandList = commands.slice(i, i + commands_per_npc); // Get commands for this NPC
                 let nextNPC = (curSec === NPCCount ? 1 : curSec + 1); // The next NPC section number (wraps around)

                 const cleanNbtNameForTag = nbt_name.replace(/[^a-zA-Z0-9_\-]/g, ""); // Clean name for NPC tags

                 // Add commands specific to the Nifty Building Tool structure
                 // Ticking area to ensure commands run
                 NPCCommandList.unshift(`/tickingarea add circle ~ ~ ~ 4 NIFTYBUILDINGTOOL_${cleanNbtNameForTag}_${curSec}`); // Added section number to tag for uniqueness
                 NPCCommandList.push(`/tickingarea remove NIFTYBUILDINGTOOL_${cleanNbtNameForTag}_${curSec}`); // Remove ticking area after commands run
                 // Open dialogue of the next NPC if there is one
                 if (NPCCount > 1) {
                      NPCCommandList.push(`/dialogue open @e[tag="${cleanNbtNameForTag}${nextNPC}",type=NPC,c=1] @initiator`);
                 }
                 // Kill the current NPC after it finishes its commands
                 NPCCommandList.push(`/kill @s`);

                 // Add the NBT structure for the current NPC
                 NBTdata += getNPCOpener(curSec, nbt_name); // Start NPC structure
                 // Add all commands for this NPC, formatted as NBT strings, joined by commas
                 NBTdata += NPCCommandList.map(x => commandToNBT(x.trim())).join(",");
                 NBTdata += getNPCCloser(); // Close NPC structure

                 // Add a comma between NPC structures, but not after the last one
                 if (curSec < NPCCount) {
                   NBTdata += ",";
                 }
             }
             NBTdata += getBlockCloser(); // Close the main NBT structure

              nbtStatusMessage.textContent = 'Download starting...';
             download(file_name, NBTdata); // Trigger download

              nbtStatusMessage.textContent = `Successfully generated and downloaded ${file_name}.`;
              // console.log(`Generated NBT for ${commands.length} commands in ${NPCCount} NPCs.`);

         } catch (error) {
              console.error("Error processing file:", error);
              if(nbtStatusMessage) nbtStatusMessage.textContent = 'Error processing file. Check console (F12) for details.';
          }
    }


    // --- Event Listeners ---

    // Hamburger button to toggle sidebar
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleSidebar);
         // console.log("Hamburger button listener attached.");
    } else { console.warn("Hamburger button not found, sidebar toggle will not work."); }

    // Sidebar navigation links (using delegation on parent elements)
    const sidebarMenu = document.querySelector('.sidebar-menu');
    const sidebarFooter = document.querySelector('.sidebar-footer');

    if (sidebarMenu) {
        sidebarMenu.addEventListener('click', (event) => {
            const linkButton = event.target.closest('.sidebar-link');
            if (linkButton && linkButton.dataset.section) {
                showSection(linkButton.dataset.section);
                 // Click sound and sidebar close handled within showSection
            }
        });
         // console.log("Sidebar menu listener attached.");
    } else { console.warn("Sidebar menu not found, navigation links might not work."); }

     if (sidebarFooter) {
        sidebarFooter.addEventListener('click', (event) => {
            const linkButton = event.target.closest('.sidebar-link');
            if (linkButton && linkButton.dataset.section) {
                showSection(linkButton.dataset.section);
                 // Click sound and sidebar close handled within showSection
            }
        });
         // console.log("Sidebar footer listener attached.");
    } else { console.warn("Sidebar footer not found, settings link might not work."); }


    // General click sound for buttons (excluding hamburger, range inputs, and sidebar links handled separately)
    document.body.addEventListener('click', (event) => {
        const clickedElement = event.target;
        const button = clickedElement.closest('button');

        // Check if it's a button, not disabled, not the hamburger, not a range input, and not inside the sidebar (handled by delegation)
        if (button && !button.disabled && button !== hamburgerBtn && event.target.type !== 'range' && !button.closest('#sidebar')) {
             playClickSound();
        }
    });
     // console.log("General button click sound listener attached.");


    // Initial interaction listener to attempt background music playback
    // This function is attached to the body and removed after the first interaction
    const firstInteractionHandler = () => {
         // console.log("First user interaction detected. Attempting music playback.");
         tryStartBackgroundMusic(); // Try to play the music
         // The listeners are removed inside tryStartBackgroundMusic if successful
         // but we should also remove them here just in case tryStartBackgroundMusic
         // doesn't fully succeed or if music element is missing.
         document.body.removeEventListener('click', firstInteractionHandler);
         document.body.removeEventListener('keydown', firstInteractionHandler);
         // console.log("Removed first interaction handlers.");
    };

    // Attach the first interaction handlers only if background music element exists
    if (backgroundMusic) {
        document.body.addEventListener('click', firstInteractionHandler, { once: true });
        document.body.addEventListener('keydown', firstInteractionHandler, { once: true });
         // console.log("Attached first interaction handlers for music playback.");
    }


    // Function Pack Creator: Generate button click
    if (generateBtn) {
        generateBtn.addEventListener('click', generatePack);
         // console.log("Generate Pack button listener attached.");
    } else { console.warn("Function Pack Generator button not found."); }

    // Function Pack Creator: Add/Remove Preset buttons (using delegation on the presets section)
    const presetsSection = document.querySelector('.presets.section');
    if(presetsSection) {
         presetsSection.addEventListener('click', handlePresetButtonClick);
         // console.log("Preset buttons listener attached.");
    } else { console.warn("Presets section not found, preset buttons will not work."); }


    // QR Code Tool: Image file input change
    if (imageInput) {
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (imagePreview) { imagePreview.src = e.target.result; imagePreview.style.display = 'block'; }
                    if (convertButton) convertButton.disabled = false; // Enable convert button
                    if (outputCommands) outputCommands.value = ''; // Clear previous output
                    if (copyButton) copyButton.disabled = true; // Disable copy
                    if (downloadButton) downloadButton.disabled = true; // Disable download
                    if (imageStatusMessage) imageStatusMessage.textContent = 'Image loaded. Adjust options and click Convert.';
                    if (processingCanvas) processingCanvas.classList.remove('pixel-preview'); // Remove pixelated style until converted
                     // console.log("Image file loaded.");
                };
                reader.onerror = function() {
                    if (imageStatusMessage) imageStatusMessage.textContent = 'Error reading file.';
                    if (convertButton) convertButton.disabled = true;
                    if (imagePreview) imagePreview.style.display = 'none';
                    if (outputCommands) outputCommands.value = '';
                    if (copyButton) copyButton.disabled = true;
                    if (downloadButton) downloadButton.disabled = true;
                     // console.error("Error reading image file.");
                }
                reader.readAsDataURL(file); // Read the file as a data URL for the image preview
            } else {
                // Reset UI if file selection is cancelled
                if (imagePreview) imagePreview.style.display = 'none';
                if (convertButton) convertButton.disabled = true;
                if (outputCommands) outputCommands.value = '';
                if (copyButton) copyButton.disabled = true;
                if (downloadButton) downloadButton.disabled = true;
                if (imageStatusMessage) imageStatusMessage.textContent = 'Select an image to begin.';
                 if (processingCanvas) processingCanvas.classList.remove('pixel-preview');
                 // console.log("Image file selection cancelled.");
            }
        });
         // console.log("Image input listener attached.");
    } else { console.warn("Image input element not found, QR tool input will not work."); }

    // QR Code Tool: Convert button click
    if (convertButton) {
        convertButton.addEventListener('click', function() {
            // Check if required elements and an image are ready
            if (!imagePreview || !imagePreview.src || imagePreview.src === '#' || !processingCanvas || !ctx || !pixelRatioInput || !baseHeightInput || !zOffsetInput || !ditheringEnabledInput || !outputCommands || !imageStatusMessage || !convertButton || !copyButton || !downloadButton || !thresholdInput) {
                console.error("Missing required elements or no image loaded for conversion. Cannot proceed.");
                if(imageStatusMessage) imageStatusMessage.textContent = 'Error converting image: Missing page elements or no image loaded.';
                 if (convertButton) convertButton.disabled = false;
                return;
            }

            if (imageStatusMessage) imageStatusMessage.textContent = 'Converting...';
            if (convertButton) convertButton.disabled = true; // Disable button during process
            if (copyButton) copyButton.disabled = true;
            if (downloadButton) downloadButton.disabled = true;
            if (outputCommands) outputCommands.value = ''; // Clear previous output

            const img = new Image();
            img.onload = function() {
                // Image loaded successfully, now process it
                processImage(img);
                 // console.log("Image object loaded for processing.");
            };
            img.onerror = function() {
                // Handle image loading errors
                if (imageStatusMessage) imageStatusMessage.textContent = 'Error loading image for processing.';
                if (convertButton) convertButton.disabled = false;
                 console.error("Error loading image object.");
            };
            img.src = imagePreview.src; // Set the source to the data URL from the preview
        });
         // console.log("Convert button listener attached.");
    } else { console.warn("Convert button not found, QR tool conversion will not work."); }

    // QR Code Tool: Copy button click
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            if (!outputCommands) { console.warn("Output commands textarea not found."); return; }
            outputCommands.select(); // Select the text
            outputCommands.setSelectionRange(0, 99999); // For mobile devices

            // Copy the text to the clipboard
            navigator.clipboard.writeText(outputCommands.value).then(() => {
                // Provide visual feedback
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                }, 1500); // Reset text after 1.5 seconds
                 // console.log("Commands copied to clipboard.");
            }).catch(err => {
                // Handle copy errors
                console.error('Could not copy text: ', err);
                 if(imageStatusMessage) imageStatusMessage.textContent = 'Error copying commands.';
            });
        });
         // console.log("Copy button listener attached.");
    } else { console.warn("Copy button not found."); }

    // QR Code Tool: Download button click
    if (downloadButton) {
         downloadButton.addEventListener('click', function() {
             if (!outputCommands || !imageStatusMessage) { console.warn("Output commands or status message element not found."); return; }
             const textToSave = outputCommands.value;
             if (!textToSave) {
                 imageStatusMessage.textContent = 'No commands to download.';
                  // console.warn("Download clicked but no commands available.");
                 return;
             }
             // Use the global download function
             download('pixel_art.mcfunction', textToSave);
             imageStatusMessage.textContent = 'Downloaded pixel_art.mcfunction';
              // console.log("Download button clicked.");
         });
          // console.log("Download button listener attached.");
    } else { console.warn("Download button not found."); }

    // QR Code Tool: Threshold slider input
    if (thresholdInput && thresholdValueSpan) {
        const updateThresholdDisplay = () => {
            thresholdValueSpan.textContent = thresholdInput.value;
            // Update the CSS variable for the range track gradient
            thresholdInput.style.setProperty('--threshold-progress', `${(parseFloat(thresholdInput.value) / 255) * 100}%`);
        };
        thresholdInput.addEventListener('input', updateThresholdDisplay);
        updateThresholdDisplay(); // Call initially to set display on load
         // console.log("Threshold slider listener attached.");
    } else { console.warn("Threshold slider or value span not found."); }


    // NBT Tool: File input change
    if (nbtFileInput) {
        nbtFileInput.addEventListener('change', function(event) {
            const input = event.target;
            if ('files' in input && input.files.length > 0) {
                 if(nbtStatusMessage) nbtStatusMessage.textContent = 'Reading file...';
                 processNBTFile(input.files[0]); // Process the selected file
                 // console.log("NBT file selected.");
            } else {
                 if(nbtStatusMessage) nbtStatusMessage.textContent = 'Select an .mcfunction file to convert.';
                  // console.log("NBT file selection cancelled.");
            }
        });
         // console.log("NBT file input listener attached.");
    } else { console.warn("NBT file input not found, NBT tool will not work."); }

    // Settings Tool: SFX volume slider (Music volume slider and toggle button listeners removed)
    if (sfxVolumeInput && sfxVolumeValueSpan && clickSound) {
         sfxVolumeInput.dataset.lastValue = sfxVolumeInput.value; // Store initial value for preview logic
        sfxVolumeInput.addEventListener('input', handleSfxVolumeChange);
        // Initial display is set in showSection('settingsTool')
         // console.log("SFX volume slider listener attached.");
    } else if (sfxVolumeInput) {
         console.warn("SFX volume slider found, but audio element or span missing.");
         sfxVolumeInput.disabled = true;
    }


    // --- Initial Load ---

    // Show the default section (Home) when the page loads
    showSection('homeTool');
     // console.log("Initial section set to 'homeTool'.");

}); // End of DOMContentLoaded listener
