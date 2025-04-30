// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Global Elements and Tab Functionality ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    function openTab(tabId) {
        // Hide all tab contents
        tabContents.forEach(content => {
            content.style.display = 'none';
        });

        // Deactivate all tab buttons
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });

        // Show the selected tab content
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }

        // Activate the clicked button
        const clickedButton = document.querySelector(`.tab-button[onclick*="openTab('${tabId}')"]`);
        if (clickedButton) {
            clickedButton.classList.add('active');
        }

         // Trigger any initialization needed for the opened tab
         // (Currently handled by DOMContentLoaded, but useful for dynamic content)
    }

    // Add event listeners for tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('onclick').match(/openTab\('(.+?)'\)/)[1];
            openTab(tabId);
        });
    });


    // --- Function Pack Creator Tool Logic ---
    const generatePackBtn = document.getElementById('generatePackBtn'); // Renamed ID
    const packNameInput = document.getElementById('packName');
    const packDescriptionInput = document.getElementById('packDescription');
    const packIconInput = document.getElementById('packIcon');
    const presetListDiv = document.getElementById('presetList');
    const selectedPresetsListUl = document.getElementById('selectedPresetsList');
    const packStatusDiv = document.getElementById('packStatus'); // Renamed ID


    // --- Preset Definitions ---
    const allPresets = [
        {
            id: 'coords_to_score',
            name: 'Coords to Scores',
            description: 'Stores player X, Y, Z coordinates into scoreboard objectives each tick.',
            objectives: [
                { name: "coordX", type: "dummy" },
                { name: "coordY", type: "dummy" },
                { name: "coordZ", type: "dummy" }
            ],
            setup_commands: [],
            main_commands: [
                '# Store player coordinates in scores',
                'execute as @a store result score @s coordX run data get entity @s Pos[0] 100', // Scale by 100
                'execute as @a store result score @s coordY run data get entity @s Pos[1] 100',
                'execute as @a store result score @s coordZ run data get entity @s Pos[2] 100'
            ],
            additional_files: []
        },
        {
            id: 'on_death',
            name: 'On Player Death',
            description: 'Detects player deaths using deathCount and runs a function.',
            objectives: [
                { name: "deaths", type: "deathCount" }
            ],
            setup_commands: [],
            main_commands: [
                '# Check for players who have died',
                'execute as @a[scores={deaths=1..}] run function <pack_namespace>:on_death_action'
            ],
            additional_files: [
                 {
                     filename: "on_death_action.mcfunction",
                     content: "# This function runs when a player dies.\n# Add your commands here.\n# Example: Send a message\ntellraw @s {\"text\":\"You died!\",\"color\":\"red\"}\n\n# IMPORTANT: Reset the death score\nscoreboard players set @s deaths 0"
                 }
            ]
        },
        {
            id: 'on_first_join',
            name: 'On First Join',
            description: 'Runs a function when a player joins the world for the first time.',
             objectives: [
                { name: "has_joined", type: "dummy" }
            ],
            setup_commands: [],
            main_commands: [
                '# Check for players who have just joined',
                'execute as @a unless score @s has_joined matches 1 run function <pack_namespace>:on_first_join_action',
                '# Mark players as having joined',
                'scoreboard players set @a[scores={has_joined=..0}] has_joined 1' // Set score for those just processed
            ],
             additional_files: [
                 {
                     filename: "on_first_join_action.mcfunction",
                     content: "# This function runs on a player's first join.\n# Add commands here.\n# Example: Send a welcome message\ntellraw @s {\"text\":\"Welcome to the world!\",\"color\":\"gold\"}"
                 }
            ]
        }
        // Add more presets here
    ];

    let selectedPresetIds = new Set();

    function renderPresetList() {
        if (!presetListDiv) return; // Check if element exists (only in func pack tab)
        presetListDiv.innerHTML = '';
        allPresets.forEach(preset => {
            if (!selectedPresetIds.has(preset.id)) {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>
                        <strong>${preset.name}</strong><br>
                        <small>${preset.description}</small>
                    </span>
                    <button data-preset-id="${preset.id}">Add</button>
                `;
                presetListDiv.appendChild(li);
            }
        });
    }

    function renderSelectedPresetsList() {
        if (!selectedPresetsListUl) return; // Check if element exists
        selectedPresetsListUl.innerHTML = '';
         selectedPresetIds.forEach(presetId => {
            const preset = allPresets.find(p => p.id === presetId);
            if (preset) {
                 const li = document.createElement('li');
                 li.innerHTML = `
                     <span>${preset.name}</span>
                     <button data-preset-id="${preset.id}">Remove</button>
                 `;
                 selectedPresetsListUl.appendChild(li);
            }
         });
         renderPresetList(); // Re-render available list
    }

    function handlePresetButtonClick(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const presetId = button.dataset.presetId;
        const action = button.textContent.trim().toLowerCase();

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
        return name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_').replace(/^_|_$/g, ''); // lowercase, replace non-alphanumeric/underscore with underscore, remove leading/trailing/duplicate underscores
    }

    async function generatePack() {
        if (!packStatusDiv || !packNameInput || !packDescriptionInput || !packIconInput || !generatePackBtn) return; // Ensure elements exist

        packStatusDiv.textContent = 'Generating pack...';
        generatePackBtn.disabled = true;

        const packName = packNameInput.value.trim() || 'My Function Pack';
        const packDescription = packDescriptionInput.value.trim() || 'Generated by the online tool';
        const packIconFile = packIconInput.files[0];
        const packNamespace = sanitizeNamespace(packName) || 'my_pack'; // Default namespace if name results in empty string

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

        const tickJsonContent = JSON.stringify({
             "values": [
                `${packNamespace}:main`
             ]
        }, null, 4);

        const mainCommands = [
            `# Function pack: ${packName}`,
            `# Namespace: ${packNamespace}`,
            '',
            '# --- Setup & Objectives ---',
            `function ${packNamespace}:setup`, // Run setup once on pack load (or on first tick if setup doesn't handle it)
            `function ${packNamespace}:objectives`, // Ensure objectives are added
            '',
            '# --- Tick Commands (Runs every tick) ---',
            '# Add your custom tick commands here',
            ''
        ];

        const requiredObjectives = new Map(); // Use Map to store unique objectives by name
        const requiredSetupCommands = new Set();
        const additionalFiles = [];

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
                     additionalFiles.push({
                        filename: file.filename,
                        content: file.content.replace(/<pack_namespace>/g, packNamespace)
                     });
                 });
            }
        });

         // Construct objectives.mcfunction content
         const objectiveCommands = [
             `# Automatically added objectives for pack: ${packName}`,
             '# Ensure objectives are added only if they don\'t exist.',
             '# Requires a player to be online when run.',
             '' // Add newline
         ];
         requiredObjectives.forEach(obj => {
             // This check is slightly more robust than just testing for @p having the score
             objectiveCommands.push(`execute as @a at @s unless score @s ${obj.name} objectives matches 0 run scoreboard objectives add ${obj.name} ${obj.type}`);
             // A perfect check would need `/scoreboard objectives list`, but its output is hard to parse in commands.
             // This `execute unless score ... objectives matches 0` is a common workaround.
             // The dummy objective 'objectives' is needed for this trick - add it if not present.
             requiredObjectives.set('objectives', {name: 'objectives', type: 'dummy'}); // Ensure the 'objectives' dummy objective is included
         });
          // Rebuild objectiveCommands after potentially adding 'objectives' dummy
         const finalObjectiveCommands = [
             `# Automatically added objectives for pack: ${packName}`,
             '# Ensure objectives are added only if they don\'t exist.',
             '# Requires a player to be online when run.',
             ''
         ];
         requiredObjectives.forEach(obj => {
             finalObjectiveCommands.push(`execute as @a at @s unless score @s ${obj.name} objectives matches 0 run scoreboard objectives add ${obj.name} ${obj.type}`);
         });


         // Construct setup.mcfunction content
         const setupCommands = [
             `# Setup commands for pack: ${packName}`,
              '# This function runs once when the pack is loaded/enabled (typically via main.mcfunction on first tick).',
              '' // Add newline
         ];
         requiredSetupCommands.forEach(cmd => setupCommands.push(cmd));


        // --- Create Zip File ---
        const zip = new JSZip();

        zip.file("manifest.json", manifestContent);

        if (packIconFile) {
            // Need to convert File object to Blob or ArrayBuffer for JSZip if not directly supported
             const reader = new FileReader();
             reader.onload = function(event) {
                 zip.file("pack_icon.png", event.target.result); // Add as ArrayBuffer
                 finalizeZipAndDownload(zip, packName, packStatusDiv, generatePackBtn);
             };
             reader.onerror = function(error) {
                 packStatusDiv.textContent = `Error reading pack icon: ${error}`;
                 generatePackBtn.disabled = false;
                 console.error("Error reading file:", error);
             };
             reader.readAsArrayBuffer(packIconFile); // Read the file

        } else {
             // No icon, finalize and download immediately
             finalizeZipAndDownload(zip, packName, packStatusDiv, generatePackBtn);
        }

         function finalizeZipAndDownload(zipObj, name, statusEl, btnEl) {
             // Create the functions folder and namespace subfolder
             const functionsFolder = zipObj.folder("functions");
             const namespaceFolder = functionsFolder.folder(packNamespace);

             // Add core function files
             functionsFolder.file("tick.json", tickJsonContent);
             namespaceFolder.file("main.mcfunction", mainCommands.join('\n'));
             namespaceFolder.file("objectives.mcfunction", finalObjectiveCommands.join('\n')); // Use the finalized list
             namespaceFolder.file("setup.mcfunction", setupCommands.join('\n'));

             // Add additional files from presets
             additionalFiles.forEach(file => {
                  namespaceFolder.file(file.filename, file.content);
             });


             // Generate and Download
             zipObj.generateAsync({ type: "blob" })
                 .then(function(content) {
                     const link = document.createElement('a');
                     link.href = URL.createObjectURL(content);
                     link.download = `${name}.zip`;
                     link.click();

                     statusEl.textContent = 'Pack generated successfully!';
                     btnEl.disabled = false;
                     URL.revokeObjectURL(link.href); // Clean up
                 })
                 .catch(function(error) {
                     statusEl.textContent = `Error generating pack: ${error}`;
                     btnEl.disabled = false;
                     console.error("Error generating zip:", error);
                 });
         }
    }


    // Add event listeners for Function Pack tab
    if (generatePackBtn) generatePackBtn.addEventListener('click', generatePack);
    if (presetListDiv) presetListDiv.addEventListener('click', handlePresetButtonClick);
    if (selectedPresetsListUl) selectedPresetsListUl.addEventListener('click', handlePresetButtonClick);
     // Initial render for function pack presets
    if (presetListDiv) renderPresetList();


    // --- QR Code to MCFunction Tool Logic ---
    // Get element references for the first tool
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const processingCanvas = document.getElementById('processingCanvas');
    const ctx = processingCanvas ? processingCanvas.getContext('2d') : null; // Check if canvas exists
    const convertButton = document.getElementById('convertButton');
    const outputCommands = document.getElementById('outputCommands');
    const copyButton = document.getElementById('copyButton');
    const downloadButton = document.getElementById('downloadButton');
    const imageStatusMessage = document.getElementById('imageStatusMessage');

    const pixelRatioInput = document.getElementById('pixelRatio');
    const baseHeightInput = document.getElementById('baseHeight');
    const zOffsetInput = document.getElementById('zOffset');
    const ditheringEnabledInput = document.getElementById('ditheringEnabled');
    const thresholdInput = document.getElementById('threshold'); // Threshold input

     // --- Minecraft Block Color Palette (Only Black Concrete and White Wool) ---
    const minecraftPalette = [
         { id: 'minecraft:black_concrete', color: [18, 20, 26] }, // Using actual block color values
         { id: 'minecraft:white_wool', color: [242, 242, 242] }
    ];

    // --- Event Listener for File Input (Image Tool) ---
    if (imageInput) { // Add check
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (imagePreview) {
                        imagePreview.src = e.target.result;
                        imagePreview.style.display = 'block';
                    }
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

    // Add listener for range slider value update and CSS variable
    if (thresholdInput) {
        const thresholdValueSpan = document.getElementById('thresholdValue');
        const updateThresholdDisplay = () => {
            if (thresholdValueSpan) {
               thresholdValueSpan.textContent = thresholdInput.value; // Update display
            }
            // Update the CSS variable for Webkit track fill
            thresholdInput.style.setProperty('--threshold-progress', `${(thresholdInput.value / 255) * 100}%`);
        };
        thresholdInput.addEventListener('input', updateThresholdDisplay);
        // Also set it once on load
        updateThresholdDisplay();
    }


    // --- Event Listener for Convert Button (Image Tool) ---
    if (convertButton) { // Add check
        convertButton.addEventListener('click', function() {
            if (!imagePreview || !imagePreview.src || imagePreview.src === '#') {
                if(imageStatusMessage) imageStatusMessage.textContent = 'No image loaded.';
                return;
            }
             if (!ctx || !processingCanvas) {
                 if(imageStatusMessage) imageStatusMessage.textContent = 'Internal error: Canvas not available.';
                 console.error("Canvas or context is null");
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
            img.src = imagePreview.src; // Use the data URL from the preview
        });
    }


     // --- Helper Function to Find Closest Color in Palette (Image Tool) ---
    function findClosestColor(pixelColor, palette) {
        const black = palette[0];
        const white = palette[1];

        const r = pixelColor[0];
        const g = pixelColor[1];
        const b = pixelColor[2];

        // Simple luminance calculation for B&W
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
         const threshold = parseInt(document.getElementById('threshold').value) || 128;

        if (luminance < threshold) {
            return black;
        } else {
            return white;
        }
    }

     // --- Dithering Helper Function (Image Tool) ---
     function diffuseError(workingPixels, width, height, px, py, er, eg, eb, weight) {
         if (px >= 0 && px < width && py >= 0 && py < height) {
             const idx = (py * width + px) * 4;
             // Only apply error to pixels that are not fully transparent
             if (workingPixels[idx + 3] > 10) {
                 workingPixels[idx] = Math.max(0, Math.min(255, workingPixels[idx] + er * weight));
                 workingPixels[idx + 1] = Math.max(0, Math.min(255, workingPixels[idx + 1] + eg * weight));
                 workingPixels[idx + 2] = Math.max(0, Math.min(255, workingPixels[idx + 2] + eb * weight));
             }
         }
     }

     // --- Process Image Function (Image Tool) ---
    function processImage(img) {
        if (!ctx || !processingCanvas || !pixelRatioInput || !baseHeightInput || !zOffsetInput || !ditheringEnabledInput || !outputCommands || !imageStatusMessage || !convertButton || !copyButton || !downloadButton) {
             console.error("Missing required elements for image processing.");
             if(imageStatusMessage) imageStatusMessage.textContent = 'Internal error: Missing elements.';
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
        // Create a writable copy if dithering is enabled
        const workingPixels = ditheringEnabled ? new Uint8ClampedArray(pixels) : pixels;


        const commands = [];
        const outputWidth = Math.floor(img.width / pixelRatio);
        const outputHeight = Math.floor(img.height / pixelRatio);

        if (outputWidth === 0 || outputHeight === 0) {
            imageStatusMessage.textContent = 'Image is too small for the chosen Pixels per Block.';
            convertButton.disabled = false;
            return;
        }

         // Clear canvas and resize it to match the output block dimensions for the preview
         ctx.clearRect(0, 0, processingCanvas.width, processingCanvas.height);
        processingCanvas.width = outputWidth;
        processingCanvas.height = outputHeight;
         ctx.fillStyle = '#1a1a1a'; // Fill background with a dark color
         ctx.fillRect(0, 0, outputWidth, outputHeight); // Fill the background


        for (let y = 0; y < outputHeight; y++) {
            for (let x = 0; x < outputWidth; x++) {
                 const startPixelX = x * pixelRatio;
                 const startPixelY = y * pixelRatio;

                 // Get the color of the top-left pixel in the current block area
                 // This is a simplification; averaging colors in the block area would be better but more complex.
                 // For QR codes and B&W, the top-left pixel is usually representative.
                 const pixelIndex = (startPixelY * img.width + startPixelX) * 4;
                 const pixelR = workingPixels[pixelIndex];
                 const pixelG = workingPixels[pixelIndex + 1];
                 const pixelB = workingPixels[pixelIndex + 2];
                 const pixelA = workingPixels[pixelIndex + 3]; // Get alpha


                 let matchedBlock = null;
                 let finalColorForCanvas = [0, 0, 0]; // Default for drawing

                 if (pixelA > 10) { // Only process if the pixel is mostly opaque
                     const originalColor = [pixelR, pixelG, pixelB]; // Use workingPixels color if dithering
                     matchedBlock = findClosestColor(originalColor, minecraftPalette);

                     finalColorForCanvas = matchedBlock.color; // Use the block's color for canvas preview

                     if (ditheringEnabled) {
                         // Calculate error based on the original pixel color and the chosen block color
                         let errorR = originalColor[0] - matchedBlock.color[0];
                         let errorG = originalColor[1] - matchedBlock.color[1];
                         let errorB = originalColor[2] - matchedBlock.color[2];

                         // Apply Floyd-Steinberg error diffusion to surrounding pixels
                         diffuseError(workingPixels, img.width, img.height, startPixelX + 1, startPixelY, errorR, errorG, errorB, 7 / 16);
                         diffuseError(workingPixels, img.width, img.height, startPixelX - 1, startPixelY + 1, errorR, errorG, errorB, 3 / 16);
                         diffuseError(workingPixels, img.width, img.height, startPixelX, startPixelY + 1, errorR, errorG, errorB, 5 / 16);
                         diffuseError(workingPixels, img.width, img.height, startPixelX + 1, startPixelY + 1, errorR, errorG, errorB, 1 / 16);
                     }

                      commands.push(`setblock ~${x} ~${y + baseHeight} ~${zOffset} ${matchedBlock.id}`);

                 } else {
                    // If pixel is transparent or very low alpha, place a white block
                     matchedBlock = findClosestColor([255, 255, 255], minecraftPalette);
                     finalColorForCanvas = matchedBlock.color;
                     commands.push(`setblock ~${x} ~${y + baseHeight} ~${zOffset} ${matchedBlock.id}`);
                 }


                 ctx.fillStyle = `rgb(${finalColorForCanvas[0]}, ${finalColorForCanvas[1]}, ${finalColorForCanvas[2]})`;
                 ctx.fillRect(x, y, 1, 1); // Draw a 1x1 pixel on the output canvas grid
            }
        }

        outputCommands.value = commands.join('\n');
        imageStatusMessage.textContent = `Converted image to ${commands.length} blocks (${outputWidth}x${outputHeight}).`;
        convertButton.disabled = false;
        copyButton.disabled = commands.length === 0;
        downloadButton.disabled = commands.length === 0;
    }

    // --- Copy Button Functionality (Image Tool) ---
    if (copyButton) { // Add check
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


    // --- Download Button Functionality (Image Tool) ---
    if (downloadButton) { // Add check
         downloadButton.addEventListener('click', function() {
             if (!outputCommands || !imageStatusMessage) return;
             const textToSave = outputCommands.value;
             if (!textToSave) {
                 imageStatusMessage.textContent = 'No commands to download.';
                 return;
             }
             // Using the shared download function at the end of the script
             download('pixel_art.mcfunction', textToSave);
             imageStatusMessage.textContent = 'Downloaded pixel_art.mcfunction';
         });
    }


    // --- MCFunction to Nifty Building Tool NBT Converter Logic ---
    const nbtStatusMessage = document.getElementById('nbtStatusMessage'); // Get reference to the new status element
    const nbtFileInput = document.getElementById('input-file'); // Get ref to the input file element
    const nbtTitleInput = document.getElementById('nbt-title');
    const commandsPerNpcInput = document.getElementById('commands-per-npc');


    // Entry point for choosing a file (MCFunction Tool) - event listener on its specific input
    if (nbtFileInput) { // Add check
        nbtFileInput.addEventListener('change', getNBTFile); // Renamed function to avoid conflict
    }


    function getNBTFile(event) { // Renamed function
        const input = event.target;
        if ('files' in input && input.files.length > 0) {
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Reading file...';
             processNBTFile(input.files[0]); // Renamed function call
        } else {
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Select an .mcfunction file to convert.';
        }
        // input.value = ''; // Clearing input might prevent selecting the same file again immediately if needed
    }

    // Meat-and-potatoes logic (MCFunction Tool)
    function processNBTFile(file) { // Renamed function
         if(!nbtStatusMessage || !nbtTitleInput || !commandsPerNpcInput) {
             console.error("Missing NBT tool elements");
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Internal error: Missing elements.';
             return;
         }

         nbtStatusMessage.textContent = 'Processing commands...';
        readFileContent(file).then(content => { // Keep readFileContent same name
            const commands = getUsefulCommands(content); // Keep getUsefulCommands same name

            if (commands.length === 0) {
                 nbtStatusMessage.textContent = 'No setblock, fill, or summon commands found in the file.';
                 return;
            }

            let commands_per_npc = parseInt(commandsPerNpcInput.value);
            let nbt_name = nbtTitleInput.value.trim();
            let file_name;
            if (nbt_name === "") {
                file_name = "NiftyBuildingTool_Output.txt";
                nbt_name = "Unnamed Build" // Use default name for NBT data too
            } else {
                // Clean up file name to be safer for file systems
                file_name = "NiftyBuildingTool_" + nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "") + ".txt";
            }
            if (isNaN(commands_per_npc) || commands_per_npc <= 0) {
                commands_per_npc = 346;
                 if (commandsPerNpcInput) commandsPerNpcInput.value = 346; // Update the input field too if it exists
            }

            let curSec = 0;
            // Cleaning for NBT string content happens inside these opener functions now
            let NBTdata = getBlockOpener(nbt_name); // Keep getBlockOpener same name
            let NPCCount = Math.ceil(commands.length / commands_per_npc);

             nbtStatusMessage.textContent = `Generating NBT for ${commands.length} commands across ${NPCCount} NPCs...`;

            for (var i = 0; i < commands.length; i += commands_per_npc) {
                curSec++;
                let NPCCommandList = commands.slice(i, i + commands_per_npc);
                let nextNPC = (curSec === NPCCount ? 1 : curSec + 1);

                // Clean name for tag/tickingarea ONLY
                const cleanNbtNameForTag = nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "");

                NPCCommandList.unshift(`/tickingarea add circle ~ ~ ~ 4 NIFTYBUILDINGTOOL_${cleanNbtNameForTag}`);
                NPCCommandList.push(`/tickingarea remove NIFTYBUILDINGTOOL_${cleanNbtNameForTag}`);
                if (NPCCount > 1) {
                     NPCCommandList.push(`/dialogue open @e[tag="${cleanNbtNameForTag}${nextNPC}",type=NPC,c=1] @initiator`);
                }
                NPCCommandList.push(`/kill @s`);

                NBTdata += getNPCOpener(curSec, nbt_name); // Keep getNPCOpener same name
                NBTdata += NPCCommandList.map(x => commandToNBT(x.trim())).join(","); // Keep commandToNBT same name
                NBTdata += getNPCCloser(); // Keep getNPCCloser same name

                if (curSec < NPCCount) {
                  NBTdata += ",";
                }
            }
            NBTdata += getBlockCloser(); // Keep getBlockCloser same name

             nbtStatusMessage.textContent = 'Download starting...';
            // Using the shared download function
            download(file_name, NBTdata); // Keep download same name

             nbtStatusMessage.textContent = `Successfully generated and downloaded ${file_name}.`;
        }).catch(error => {
             console.error("Error processing file:", error);
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Error processing file. Check console (F12) for details.';
         });
    }

    // Keep these helper functions as they were, they are only called by NBT logic
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
            // Added 'structure' command as it's also used in building
            return x.length > 0 && (x.startsWith("setblock") || x.startsWith("fill") || x.startsWith("summon") || x.startsWith("structure"));
        });
    }

    function getBlockOpener(nbt_name) {
        // Escape quotes and newlines for display strings (Lore and Name)
        const escapedNbtNameForDisplay = nbt_name.replace(/"/g, '\\"').replace(/\n/g, '\\n');
        // Original Lore had \\n, preserving that structure but adding name to it
        return `{Block:{name:"minecraft:moving_block",states:{},version:17959425},Count:1b,Damage:0s,Name:"minecraft:moving_block",WasPickedUp:0b,tag:{display:{Lore:["Created using the Nifty Building Tool\\\\nBy Brutus314 and Clawsky123.\\\\n\\\\nÂ§gÂ§l${escapedNbtNameForDisplay}"],Name:"Â§gÂ§l${escapedNbtNameForDisplay}"},movingBlock:{name:"minecraft:sea_lantern",states:{},version:17879555},movingEntity:{Occupants:[`;
    }

    function getBlockCloser() {
        return '],id:"Beehive"}}}';
    }

    function getNPCOpener(section, nbt_name) {
         // Clean name for tag (alphanumeric, hyphen, underscore)
         const cleanedNbtNameForTag = nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "");
         // Escape quotes and backslashes for JSON string content
         const escapedNbtNameForJSON = nbt_name.replace(/"/g, '\\"').replace(/\\/g, '\\\\');

        return `{ActorIdentifier:"minecraft:npc<>",SaveData:{Persistent:1b,Pos:[],Variant:18,definitions:["+minecraft:npc"],RawtextName:"${escapedNbtNameForJSON}",CustomName:"${escapedNbtNameForJSON}",CustomNameVisible:1b,Tags:["${cleanedNbtNameForTag}${section}","NiftyBuildingTool"],Actions:"[{\\"button_name\\" : \\"Build Section ${section}\\",\\"data\\" : [`;
    }

    function getNPCCloser() {
        return `],\\"mode\\" : 0,\\"text\\" : \\"\\",\\"type\\" : 1}]",InterativeText:"Â§4Â§lCreated using the Nifty Building Tool by Brutus314 and Clawsky123."},TicksLeftToStay:0}`;
    }

    function commandToNBT(command) {
        const jsonCommand = JSON.stringify({
            cmd_line : command,
            cmd_ver : 12 // Using version 12
        });
        // Escape the resulting JSON string for the 'data' field in the NBT 'Actions' string
        return jsonCommand.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
    }


    // --- Shared Download Function ---
    // This function is used by all tools
    function download(filename, textOrBlob) { // Can accept text or Blob
        const element = document.createElement('a');
         // If it's a Blob (like from JSZip), use createObjectURL
        if (textOrBlob instanceof Blob) {
             element.setAttribute('href', URL.createObjectURL(textOrBlob));
        } else { // Otherwise assume text
             element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textOrBlob));
        }
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

         // Clean up the URL object if it was created
        if (textOrBlob instanceof Blob) {
             URL.revokeObjectURL(element.href);
        }
    }


    // --- Initial Page Load Setup ---
    // Open the first tab (Function Pack Creator) by default on page load
     openTab('functionPackTool');


});