// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Get ALL Element References FIRST ---
    // Global Elements and Tab Functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Function Pack Creator Tool Elements
    const generateBtn = document.getElementById('generateBtn'); // Renamed back to generateBtn
    const packNameInput = document.getElementById('packName');
    const packDescriptionInput = document.getElementById('packDescription');
    const packIconInput = document.getElementById('packIcon');
    const presetListDiv = document.getElementById('presetList'); // Div for available presets
    const selectedPresetsDiv = document.getElementById('selectedPresets'); // The container div for selected list
    const selectedPresetsListUl = document.getElementById('selectedPresetsList'); // The UL for selected items
    const packStatusDiv = document.getElementById('packStatus');

    // --- Removed Editor Elements ---
    // const fileEditorArea = document.getElementById('fileEditorArea');
    // const editableFileListDiv = document.getElementById('editableFileList');
    // const fileEditorTextarea = document.getElementById('fileEditor');
    // const editorStatusDiv = document.getElementById('editorStatus');

    // QR Code to MCFunction Tool Elements
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const processingCanvas = document.getElementById('processingCanvas');
    const ctx = processingCanvas ? processingCanvas.getContext('2d') : null;
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
    const nbtStatusMessage = document.getElementById('nbtStatusMessage');
    const nbtFileInput = document.getElementById('input-file');
    const nbtTitleInput = document.getElementById('nbt-title');
    const commandsPerNpcInput = document.getElementById('commands-per-npc');

    // Audio Elements
    const clickSound = document.getElementById('clickSound');
    const backgroundMusic = document.getElementById('backgroundMusic');

    // --- Set Background Music Volume and Initial State ---
    if (backgroundMusic) {
        backgroundMusic.volume = 1.0; // Set volume back to 100%
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }


    // --- Global Functions (Tab Switching, Download, Sound) ---

    function openTab(tabId) {
        tabContents.forEach(content => {
            content.style.display = 'none';
        });

        tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        } else {
             console.error(`Tab with ID "${tabId}" not found.`);
             return;
        }

         let clickedButton = null;
         for (const button of tabButtons) {
             const onclickAttr = button.getAttribute('onclick');
             if (onclickAttr && onclickAttr.includes(`openTab('${tabId}')`)) {
                 clickedButton = button;
                 break;
             }
         }
        if (clickedButton) {
            clickedButton.classList.add('active');
        }

         // --- Perform initial setup specific to the tab being opened ---
         if (tabId === 'functionPackTool') {
             if (presetListDiv && selectedPresetsListUl) {
                 renderPresetList();
                 renderSelectedPresetsList(); // Ensure lists are rendered when tab is active
                 // No editor to reset anymore
             }
         } else if (tabId === 'qrTool') {
             if (thresholdInput && thresholdValueSpan) {
                 const updateThresholdDisplay = () => {
                     thresholdValueSpan.textContent = thresholdInput.value;
                     thresholdInput.style.setProperty('--threshold-progress', `${(thresholdInput.value / 255) * 100}%`);
                 };
                 updateThresholdDisplay();
             }
         } else if (tabId === 'nbtTool') {
             // NBT tool doesn't need specific setup on tab switch
         }
    }

    // Shared Download Function
    function download(filename, textOrBlob) {
        const element = document.createElement('a');
        if (textOrBlob instanceof Blob) {
             element.setAttribute('href', URL.createObjectURL(textOrBlob));
        } else {
             element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textOrBlob));
        }
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        if (textOrBlob instanceof Blob) {
             URL.revokeObjectURL(element.href);
        }
    }

    // Sound on Click Logic
    function playClickSound() {
        if (clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(e => {});
        }
    }

    // Background Music Playback Attempt Logic
    function attemptBackgroundMusicPlayback() {
        if (backgroundMusic && backgroundMusic.paused) {
            const playPromise = backgroundMusic.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log("Background music started.");
                    document.body.removeEventListener('click', attemptBackgroundMusicPlayback);
                    document.body.removeEventListener('keydown', attemptBackgroundMusicPlayback);
                }).catch(error => {
                    console.warn("Background music autoplay blocked or failed:", error);
                });
            } else {
                 console.log("Attempted background music play (no promise returned).");
                 document.body.removeEventListener('click', attemptBackgroundMusicPlayback);
                 document.body.removeEventListener('keydown', attemptBackgroundMusicPlayback);
            }
        }
    }


    // --- Add Global Event Listeners ---

    // Add event listeners for tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const onclickAttr = button.getAttribute('onclick');
            const match = onclickAttr.match(/openTab\('(.+?)'\)/);
            if (match && match[1]) {
                const tabId = match[1];
                openTab(tabId);
            }
        });
    });

    // Add event listener to play click sound on button clicks using delegation
    document.body.addEventListener('click', (event) => {
        const clickedElement = event.target;
        const button = clickedElement.closest('button');

        if (button && !button.disabled) {
             if (event.target.type !== 'range') {
                playClickSound();
             }
        }
    });

    // Add initial listeners to try playing background music on the first click or keydown
    document.body.addEventListener('click', attemptBackgroundMusicPlayback);
    document.body.addEventListener('keydown', attemptBackgroundMusicPlayback);


    // --- Function Pack Creator Tool Logic and Listeners ---
    // State variables (only selected presets remain)
    let selectedPresetIds = new Set();

    // Preset Definitions (Same as before)
    const allPresets = [
        { id: 'coords_to_score', name: 'Coords to Scores', description: 'Stores player X, Y, Z coordinates into scoreboard objectives each tick.', objectives: [{ name: "coordX", type: "dummy" }, { name: "coordY", type: "dummy" }, { name: "coordZ", type: "dummy" }], setup_commands: [], main_commands: ['# Store player coordinates in scores', 'execute as @a store result score @s coordX run data get entity @s Pos[0] 100', 'execute as @a store result score @s coordY run data get entity @s Pos[1] 100', 'execute as @a store result score @s coordZ run data get entity @s Pos[2] 100'], additional_files: [] },
        { id: 'on_death', name: 'On Player Death', description: 'Detects player deaths using deathCount and runs a function.', objectives: [{ name: "deaths", type: "deathCount" }], setup_commands: [], main_commands: ['# Check for players who have died', 'execute as @a[scores={deaths=1..}] run function <pack_namespace>:on_death_action'], additional_files: [{ filename: "on_death_action.mcfunction", content: "# This function runs when a player dies.\n# Add your commands here.\n# Example: Send a message\ntellraw @s {\"text\":\"You died!\",\"color\":\"red\"}\n\n# IMPORTANT: Reset the death score\nscoreboard players set @s deaths 0" }] },
        { id: 'on_first_join', name: 'On First Join', description: 'Runs a function when a player joins the world for the first time.', objectives: [{ name: "has_joined", type: "dummy" }], setup_commands: [], main_commands: ['# Check for players who have just joined', 'execute as @a unless score @s has_joined matches 1 run function <pack_namespace>:on_first_join_action', '# Mark players as having joined', 'scoreboard players set @a[scores={has_joined=..0}] has_joined 1'], additional_files: [{ filename: "on_first_join_action.mcfunction", content: "# This function runs on a player's first join.\n# Add commands here.\n# Example: Send a welcome message\ntellraw @s {\"text\":\"Welcome to the world!\",\"color\":\"gold\"}" }] }
    ];


    // Helper Functions for Function Pack Creator

    function renderPresetList() {
        if (!presetListDiv) return;
        presetListDiv.innerHTML = '';
        allPresets.forEach(preset => {
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
    }

    function renderSelectedPresetsList() {
        if (!selectedPresetsListUl || !selectedPresetsDiv) return;
        selectedPresetsListUl.innerHTML = '';
         selectedPresetIds.forEach(presetId => {
            const preset = allPresets.find(p => p.id === presetId);
            if (preset) {
                 const li = document.createElement('li');
                 li.innerHTML = `
                     <span>${preset.name}</span>
                     <button data-preset-id="${preset.id}" data-action="remove">Remove</button>
                 `;
                 selectedPresetsListUl.appendChild(li);
            }
         });
         renderPresetList();
         // No editor to reset anymore
    }

    function handlePresetButtonClick(event) {
        const button = event.target.closest('#presetList li button, #selectedPresetsList li button');
        if (!button || !button.dataset.action || !button.dataset.presetId) return;

        const presetId = button.dataset.presetId;
        const action = button.dataset.action;

        if (action === 'add') {
            selectedPresetIds.add(presetId);
        } else if (action === 'remove') {
            selectedPresetIds.delete(presetId);
        }

        renderSelectedPresetsList();
    }

    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function sanitizeNamespace(name) {
        return name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_').replace(/^_|_$/g, '');
    }

    // --- Refactored Generation Logic (No Editor) ---
    async function generatePack() {
         if (!generateBtn || !packStatusDiv || !packNameInput || !packDescriptionInput || !packIconInput) {
             console.error("Missing required elements for pack generation. Cannot proceed.");
             if(packStatusDiv) packStatusDiv.textContent = 'Error generating pack: Missing page elements.';
              if(generateBtn) generateBtn.disabled = false;
             return;
         }

        generateBtn.disabled = true; // Disable button while generating
        if(packStatusDiv) packStatusDiv.textContent = 'Generating pack...';

        const packName = packNameInput.value.trim() || 'My Function Pack';
        const packDescription = packDescriptionInput.value.trim() || 'Generated by the online tool';
        const packIconFile = packIconInput.files[0];
        const packNamespace = sanitizeNamespace(packName) || 'my_pack';


        // --- Assemble All File Contents Directly ---

        // manifest.json
        const manifestUuid = generateUUID();
        const moduleUuid = generateUUID();
        const manifestContent = JSON.stringify({
            "format_version": 2,
            "header": {
                "name": packName,
                "description": packDescription,
                "uuid": manifestUuid,
                "version": [1, 0, 0],
                "min_engine_version": [1, 16, 0]
            },
            "modules": [
                {
                    "type": "data",
                    "uuid": moduleUuid,
                    "version": [1, 0, 0]
                }
            ]
        }, null, 4);

        // tick.json
        const tickJsonContent = JSON.stringify({
             "values": [
                `${packNamespace}:main`
             ]
        }, null, 4);

        // main.mcfunction, objectives.mcfunction, setup.mcfunction, and additional files
        const mainCommands = [
            `# Function pack: ${packName}`,
            `# Namespace: ${packNamespace}`,
            '',
            '# --- Setup & Objectives ---',
            `function ${packNamespace}:setup`, // Run setup once on pack load (or on first tick)
            `function ${packNamespace}:objectives`, // Ensure objectives are added
            '',
            '# --- Tick Commands (Runs every tick via tick.json) ---',
            '# Add your custom tick commands below this line',
            ''
        ];

        const requiredObjectives = new Map();
        const requiredSetupCommands = new Set();
        const additionalFilesMap = new Map(); // Use a map to store additional file contents

        selectedPresetIds.forEach(presetId => {
            const preset = allPresets.find(p => p.id === presetId);
            if (preset) {
                preset.objectives.forEach(obj => requiredObjectives.set(obj.name, obj));
                preset.setup_commands.forEach(cmd => requiredSetupCommands.add(cmd));
                mainCommands.push('');
                mainCommands.push(`# --- Preset: ${preset.name} ---`);
                preset.main_commands.forEach(cmd => {
                     mainCommands.push(cmd.replace(/<pack_namespace>/g, packNamespace));
                });
                 preset.additional_files.forEach(file => {
                    // Store additional files by their intended full path within the namespace
                     const fullPath = `${packNamespace}/${file.filename}`;
                      if (additionalFilesMap.has(fullPath)) {
                         console.warn(`Duplicate additional file generated: ${fullPath}. Content is being overwritten.`);
                      }
                     additionalFilesMap.set(fullPath, file.content.replace(/<pack_namespace>/g, packNamespace));
                 });
            }
        });

         requiredObjectives.set('objectives', {name: 'objectives', type: 'dummy'});

         const objectiveCommands = [
             `# Automatically added objectives for pack: ${packName}`,
             '# Ensure objectives are added only if they don\'t exist (requires a player online).',
             '',
             ...Array.from(requiredObjectives.keys()).sort().map(objName => {
                 const obj = requiredObjectives.get(objName);
                 return `execute as @a at @s unless score @s "${obj.name}" objectives matches 0 run scoreboard objectives add "${obj.name}" ${obj.type}`;
             })
         ];

         const setupCommands = [
             `# Setup commands for pack: ${packName}`,
              '# This function runs once when the pack is loaded/enabled (typically via main.mcfunction on first tick).',
              '',
              ...Array.from(requiredSetupCommands).sort()
         ];

         // Add the core files to the map for zipping
         const allFunctionFiles = new Map([
             [`${packNamespace}/main.mcfunction`, mainCommands.join('\n')],
             [`${packNamespace}/objectives.mcfunction`, objectiveCommands.join('\n')],
             [`${packNamespace}/setup.mcfunction`, setupCommands.join('\n')],
             ...additionalFilesMap // Spread the additional files into this map
         ]);


        // --- Create Zip File ---
        const zip = new JSZip();

        zip.file("manifest.json", manifestContent);

        if (packIconFile) {
             try {
                 const iconData = await packIconFile.arrayBuffer();
                 zip.file("pack_icon.png", iconData);
             } catch (error) {
                 if(packStatusDiv) packStatusDiv.textContent = `Error reading pack icon: ${error}`;
                 console.error("Error reading pack icon:", error);
                 generateBtn.disabled = false;
                 return;
             }
        }

        const functionsFolder = zip.folder("functions");
        functionsFolder.file("tick.json", tickJsonContent);

        // Add all generated function files
        allFunctionFiles.forEach((content, relativePath) => {
            zip.file(`functions/${relativePath}`, content);
        });


        // --- Generate and Download the Zip File ---
        zip.generateAsync({ type: "blob" })
            .then(function(content) {
                download(`${packName}.zip`, content);

                if(packStatusDiv) packStatusDiv.textContent = 'Pack generated and downloaded successfully!';
                generateBtn.disabled = false;

            })
            .catch(function(error) {
                if(packStatusDiv) packStatusDiv.textContent = `Error generating pack: ${error}`;
                generateBtn.disabled = false;
                console.error("Error generating zip:", error);
            });
    }


    // --- Add Event Listeners for Function Pack tab elements ---
    if (generateBtn) {
        generateBtn.addEventListener('click', generatePack);
        // The generate button is enabled by default in HTML
    }

    // Event delegation on the parent div for preset add/remove buttons
    const presetsSection = document.querySelector('.presets.section');
    if(presetsSection) {
         presetsSection.addEventListener('click', handlePresetButtonClick);
    }


    // --- Removed Editor Event Listeners ---
    // if (prepareFilesBtn) prepareFilesBtn.addEventListener('click', prepareFilesForEditing);
    // if (editableFileListDiv) { ... }
    // if (fileEditorTextarea) { ... }


    // --- QR Code to MCFunction Tool Logic and Listeners ---

    if (imageInput) {
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (imagePreview) { imagePreview.src = e.target.result; imagePreview.style.display = 'block'; }
                    if (convertButton) convertButton.disabled = false;
                    if (outputCommands) outputCommands.value = '';
                    if (copyButton) copyButton.disabled = true;
                    if (downloadButton) downloadButton.disabled = true;
                    if (imageStatusMessage) imageStatusMessage.textContent = 'Image loaded. Adjust options and click Convert.';
                };
                reader.onerror = function() {
                    if (imageStatusMessage) imageStatusMessage.textContent = 'Error reading file.';
                    if (convertButton) convertButton.disabled = true;
                    if (imagePreview) imagePreview.style.display = 'none';
                    if (copyButton) copyButton.disabled = true;
                    if (downloadButton) downloadButton.disabled = true;
                }
                reader.readAsDataURL(file);
            } else {
                if (imagePreview) imagePreview.style.display = 'none';
                if (convertButton) convertButton.disabled = true;
                if (outputCommands) outputCommands.value = '';
                if (copyButton) copyButton.disabled = true;
                if (downloadButton) downloadButton.disabled = true;
                if (imageStatusMessage) imageStatusMessage.textContent = 'Select an image to begin.';
            }
        });
    }

    if (thresholdInput && thresholdValueSpan) {
         const updateThresholdDisplay = () => {
             thresholdValueSpan.textContent = thresholdInput.value;
             thresholdInput.style.setProperty('--threshold-progress', `${(thresholdInput.value / 255) * 100}%`);
         };
         thresholdInput.addEventListener('input', updateThresholdDisplay);
    }


    if (convertButton) {
        convertButton.addEventListener('click', function() {
            if (!imagePreview || !imagePreview.src || imagePreview.src === '#' || !processingCanvas || !ctx || !pixelRatioInput || !baseHeightInput || !zOffsetInput || !ditheringEnabledInput || !outputCommands || !imageStatusMessage || !convertButton || !copyButton || !downloadButton || !thresholdInput) {
                console.error("Missing required elements for image conversion. Cannot proceed.");
                if(imageStatusMessage) imageStatusMessage.textContent = 'Error converting image: Missing page elements.';
                 if (convertButton) convertButton.disabled = false;
                return;
            }

            if (imageStatusMessage) imageStatusMessage.textContent = 'Converting...';
            if (convertButton) convertButton.disabled = true;
            if (copyButton) copyButton.disabled = true;
            if (downloadButton) downloadButton.disabled = true;
            if (outputCommands) outputCommands.value = '';

            const img = new Image();
            img.onload = function() {
                processImage(img);
            };
            img.onerror = function() {
                if (imageStatusMessage) imageStatusMessage.textContent = 'Error loading image for processing.';
                if (convertButton) convertButton.disabled = false;
            };
            img.src = imagePreview.src;
        });
    }

    function findClosestColor(pixelColor, palette) {
        const black = palette[0];
        const white = palette[1];

        const r = pixelColor[0];
        const g = pixelColor[1];
        const b = pixelColor[2];

        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
         const threshold = parseInt(document.getElementById('threshold')?.value) || 128;

        if (luminance < threshold) {
            return black;
        } else {
            return white;
        }
    }

     function diffuseError(workingPixels, width, height, px, py, er, eg, eb, weight) {
         if (px >= 0 && px < width && py >= 0 && py < height) {
             const idx = (py * width + px) * 4;
             if (workingPixels[idx + 3] > 10) {
                 workingPixels[idx] = Math.max(0, Math.min(255, workingPixels[idx] + er * weight));
                 workingPixels[idx + 1] = Math.max(0, Math.min(255, workingPixels[idx + 1] + eg * weight));
                 workingPixels[idx + 2] = Math.max(0, Math.min(255, workingPixels[idx + 2] + eb * weight));
             }
         }
     }

    function processImage(img) {
        if (!ctx || !processingCanvas || !pixelRatioInput || !baseHeightInput || !zOffsetInput || !ditheringEnabledInput || !outputCommands || !imageStatusMessage || !convertButton || !copyButton || !downloadButton || !thresholdInput) {
             console.error("Missing required elements inside processImage. Cannot proceed.");
             if(imageStatusMessage) imageStatusMessage.textContent = 'Internal error during processing.';
             if(convertButton) convertButton.disabled = false;
             return;
        }

        const pixelRatio = parseInt(pixelRatioInput.value) || 1;
        const baseHeight = parseInt(baseHeightInput.value) || 64;
        const zOffset = parseInt(zOffsetInput.value) || 0;
        const ditheringEnabled = ditheringEnabledInput.checked;

        if (pixelRatio < 1) {
             imageStatusMessage.textContent = 'Pixels per Block must be at least 1.';
             convertButton.disabled = false;
             return;
        }

        processingCanvas.width = img.width;
        processingCanvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;
        const workingPixels = ditheringEnabled ? new Uint8ClampedArray(pixels) : pixels;


        const commands = [];
        const outputWidth = Math.floor(img.width / pixelRatio);
        const outputHeight = Math.floor(img.height / pixelRatio);

        if (outputWidth === 0 || outputHeight === 0) {
            imageStatusMessage.textContent = 'Image is too small for the chosen Pixels per Block.';
            convertButton.disabled = false;
            return;
        }

         ctx.clearRect(0, 0, processingCanvas.width, processingCanvas.height);
        processingCanvas.width = outputWidth;
        processingCanvas.height = outputHeight;
         ctx.fillStyle = '#1a1a1a';
         ctx.fillRect(0, 0, outputWidth, outputHeight);


        for (let y = 0; y < outputHeight; y++) {
            for (let x = 0; x < outputWidth; x++) {
                 const startPixelX = x * pixelRatio;
                 const startPixelY = y * pixelRatio;

                 const pixelIndex = (startPixelY * img.width + startPixelX) * 4;
                 const pixelR = workingPixels[pixelIndex];
                 const pixelG = workingPixels[pixelIndex + 1];
                 const pixelB = workingPixels[pixelIndex + 2];
                 const pixelA = workingPixels[pixelIndex + 3];


                 let matchedBlock = null;
                 let finalColorForCanvas = [0, 0, 0];

                 if (pixelA > 10) {
                     const originalColor = [pixelR, pixelG, pixelB];
                     matchedBlock = findClosestColor(originalColor, minecraftPalette);

                     finalColorForCanvas = matchedBlock.color;

                     if (ditheringEnabled) {
                         let errorR = originalColor[0] - matchedBlock.color[0];
                         let errorG = originalColor[1] - matchedBlock.color[1];
                         let errorB = originalColor[2] - matchedBlock.color[2];

                         diffuseError(workingPixels, img.width, img.height, startPixelX + 1, startPixelY, errorR, errorG, errorB, 7 / 16);
                         diffuseError(workingPixels, img.width, img.height, startPixelX - 1, startPixelY + 1, errorR, errorG, errorB, 3 / 16);
                         diffuseError(workingPixels, img.width, img.height, startPixelX, startPixelY + 1, errorR, errorG, errorB, 5 / 16);
                         diffuseError(workingPixels, img.width, img.height, startPixelX + 1, startPixelY + 1, errorR, errorG, errorB, 1 / 16);
                     }

                      commands.push(`setblock ~${x} ~${y + baseHeight} ~${zOffset} ${matchedBlock.id}`);

                 } else {
                     matchedBlock = findClosestColor([255, 255, 255], minecraftPalette);
                     finalColorForCanvas = matchedBlock.color;
                     commands.push(`setblock ~${x} ~${y + baseHeight} ~${zOffset} ${matchedBlock.id}`);
                 }


                 ctx.fillStyle = `rgb(${finalColorForCanvas[0]}, ${finalColorForCanvas[1]}, ${finalColorForCanvas[2]})`;
                 ctx.fillRect(x, y, 1, 1);
            }
        }

        outputCommands.value = commands.join('\n');
        imageStatusMessage.textContent = `Converted image to ${commands.length} blocks (${outputWidth}x${outputHeight}).`;
        convertButton.disabled = false;
        copyButton.disabled = commands.length === 0;
        downloadButton.disabled = commands.length === 0;
    }

    if (copyButton) {
        copyButton.addEventListener('click', function() {
            if (!outputCommands) return;
            outputCommands.select();
            outputCommands.setSelectionRange(0, 99999);

            navigator.clipboard.writeText(outputCommands.value).then(() => {
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = originalText;
                }, 1500);
            }).catch(err => {
                console.error('Could not copy text: ', err);
                 if(imageStatusMessage) imageStatusMessage.textContent = 'Error copying commands.';
            });
        });
    }

    if (downloadButton) {
         downloadButton.addEventListener('click', function() {
             if (!outputCommands || !imageStatusMessage) return;
             const textToSave = outputCommands.value;
             if (!textToSave) {
                 imageStatusMessage.textContent = 'No commands to download.';
                 return;
             }
             download('pixel_art.mcfunction', textToSave);
             imageStatusMessage.textContent = 'Downloaded pixel_art.mcfunction';
         });
    }


    // --- MCFunction to Nifty Building Tool NBT Converter Logic and Listeners ---

    if (nbtFileInput) {
        nbtFileInput.addEventListener('change', getNBTFile);
    }

    function getNBTFile(event) {
        const input = event.target;
        if ('files' in input && input.files.length > 0) {
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Reading file...';
             processNBTFile(input.files[0]);
        } else {
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Select an .mcfunction file to convert.';
        }
    }

    function processNBTFile(file) {
         if(!nbtStatusMessage || !nbtTitleInput || !commandsPerNpcInput) {
             console.error("Missing NBT tool elements. Cannot proceed.");
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Internal error: Missing elements.';
             return;
         }

         nbtStatusMessage.textContent = 'Processing commands...';
        readFileContent(file).then(content => {
            const commands = getUsefulCommands(content);

            if (commands.length === 0) {
                 nbtStatusMessage.textContent = 'No setblock, fill, summon, or structure commands found in the file.';
                 return;
            }

            let commands_per_npc = parseInt(commandsPerNpcInput.value);
            let nbt_name = nbtTitleInput.value.trim();
            let file_name;
            if (nbt_name === "") {
                file_name = "NiftyBuildingTool_Output.txt";
                nbt_name = "Unnamed Build"
            } else {
                file_name = "NiftyBuildingTool_" + nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "") + ".txt";
            }
            if (isNaN(commands_per_npc) || commands_per_npc <= 0) {
                commands_per_npc = 346;
                 if (commandsPerNpcInput) commandsPerNpcInput.value = 346;
            }

            let curSec = 0;
            let NBTdata = getBlockOpener(nbt_name);
            let NPCCount = Math.ceil(commands.length / commands_per_npc);

             nbtStatusMessage.textContent = `Generating NBT for ${commands.length} commands across ${NPCCount} NPCs...`;

            for (var i = 0; i < commands.length; i += commands_per_npc) {
                curSec++;
                let NPCCommandList = commands.slice(i, i + commands_per_npc);
                let nextNPC = (curSec === NPCCount ? 1 : curSec + 1);

                const cleanNbtNameForTag = nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "");

                NPCCommandList.unshift(`/tickingarea add circle ~ ~ ~ 4 NIFTYBUILDINGTOOL_${cleanNbtNameForTag}`);
                NPCCommandList.push(`/tickingarea remove NIFTYBUILDINGTOOL_${cleanNbtNameForTag}`);
                if (NPCCount > 1) {
                     NPCCommandList.push(`/dialogue open @e[tag="${cleanNbtNameForTag}${nextNPC}",type=NPC,c=1] @initiator`);
                }
                NPCCommandList.push(`/kill @s`);

                NBTdata += getNPCOpener(curSec, nbt_name);
                NBTdata += NPCCommandList.map(x => commandToNBT(x.trim())).join(",");
                NBTdata += getNPCCloser();

                if (curSec < NPCCount) {
                  NBTdata += ",";
                }
            }
            NBTdata += getBlockCloser();

             nbtStatusMessage.textContent = 'Download starting...';
            download(file_name, NBTdata);

             nbtStatusMessage.textContent = `Successfully generated and downloaded ${file_name}.`;
        }).catch(error => {
             console.error("Error processing file:", error);
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Error processing file. Check console (F12) for details.';
         });
    }

    function readFileContent(file) {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = event => resolve(event.target.result);
            reader.onerror = error => reject(error);
            reader.readAsText(file);
        })
    }

    function getUsefulCommands(content) {
        return content.split('\n').map(x => x.replace(/^\s*\//, "").trim()).filter(x => {
            return x.length > 0 && !x.startsWith("#") && (x.startsWith("setblock") || x.startsWith("fill") || x.startsWith("summon") || x.startsWith("structure"));
        });
    }

    function getBlockOpener(nbt_name) {
        const escapedNbtNameForDisplay = nbt_name.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        return `{Block:{name:"minecraft:moving_block",states:{},version:17959425},Count:1b,Damage:0s,Name:"minecraft:moving_block",WasPickedUp:0b,tag:{display:{Lore:["Created using the Nifty Building Tool\\\\nBy Brutus314 and Clawsky123.\\\\n\\\\nÂ§gÂ§l${escapedNbtNameForDisplay}"],Name:"Â§gÂ§l${escapedNbtNameForDisplay}"},movingBlock:{name:"minecraft:sea_lantern",states:{},version:17879555},movingEntity:{Occupants:[`;
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
        return `],\\"mode\\" : 0,\\"text\\" : \\"\\",\\"type\\" : 1}]",InterativeText:"Â§4Â§lCreated using the Nifty Building Tool by Brutus314 and Clawsky123."},TicksLeftToStay:0}`;
    }

    function commandToNBT(command) {
        const jsonCommand = JSON.stringify({
            cmd_line : command,
            cmd_ver : 12
        });
        return jsonCommand.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
    }


    // --- Initial Page Load: Open Default Tab ---
     openTab('functionPackTool');


}); // End of DOMContentLoaded listener
