// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Get ALL Element References FIRST ---
    // This helps prevent issues where an element might not be found
    // if its tab is initially hidden or if the script structure is complex.
    // We check if they exist before using them later.

    // Global Elements and Tab Functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Function Pack Creator Tool Elements
    const prepareFilesBtn = document.getElementById('prepareFilesBtn');
    const generateAndDownloadPackBtn = document.getElementById('generateAndDownloadPackBtn');
    const packNameInput = document.getElementById('packName');
    const packDescriptionInput = document.getElementById('packDescription');
    const packIconInput = document.getElementById('packIcon');
    const presetListDiv = document.getElementById('presetList'); // Div for available presets
    const selectedPresetsDiv = document.getElementById('selectedPresets'); // The container div for selected list
    const selectedPresetsListUl = document.getElementById('selectedPresetsList'); // The UL for selected items
    const packStatusDiv = document.getElementById('packStatus');
    const fileEditorArea = document.getElementById('fileEditorArea'); // The whole editor section
    const editableFileListDiv = document.getElementById('editableFileList'); // Div for file buttons
    const fileEditorTextarea = document.getElementById('fileEditor'); // The textarea
    const editorStatusDiv = document.getElementById('editorStatus'); // Status message below editor title

    // QR Code to MCFunction Tool Elements
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const processingCanvas = document.getElementById('processingCanvas');
    const ctx = processingCanvas ? processingCanvas.getContext('2d') : null; // Check if canvas exists
    const convertButton = document.getElementById('convertButton');
    const outputCommands = document.getElementById('outputCommands'); // Textarea for commands
    const copyButton = document.getElementById('copyButton');
    const downloadButton = document.getElementById('downloadButton');
    const imageStatusMessage = document.getElementById('imageStatusMessage'); // Status message for image tool
    const pixelRatioInput = document.getElementById('pixelRatio');
    const baseHeightInput = document.getElementById('baseHeight');
    const zOffsetInput = document.getElementById('zOffset');
    const ditheringEnabledInput = document.getElementById('ditheringEnabled');
    const thresholdInput = document.getElementById('threshold'); // Range input
    const thresholdValueSpan = document.getElementById('thresholdValue'); // Span next to range input

    // MCFunction to Nifty Building Tool NBT Elements
    const nbtStatusMessage = document.getElementById('nbtStatusMessage'); // Status message for NBT tool
    const nbtFileInput = document.getElementById('input-file'); // File input
    const nbtTitleInput = document.getElementById('nbt-title'); // Text input for title
    const commandsPerNpcInput = document.getElementById('commands-per-npc'); // Number input

    // Audio Element
    const clickSound = document.getElementById('clickSound');


    // --- Global Functions (Tab Switching, Download, Sound) ---

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
        } else {
             console.error(`Tab with ID "${tabId}" not found.`);
             return; // Stop if tab doesn't exist
        }

        // Activate the clicked button (find the button whose onclick matches)
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
         // This ensures UI elements within the tab are properly displayed/initialized
         if (tabId === 'functionPackTool') {
             // Render the preset lists when the function pack tab is opened
             // This must happen after the presetListDiv and selectedPresetsListUl elements are visible
             renderPresetList();
             renderSelectedPresetsList(); // Also render selected list on tab switch
             // Ensure editor area is reset if switching back
              resetEditorArea();
         } else if (tabId === 'qrTool') {
             // Ensure the threshold slider display and CSS variable are updated
             if (thresholdInput && thresholdValueSpan) {
                 const updateThresholdDisplay = () => {
                     thresholdValueSpan.textContent = thresholdInput.value;
                     thresholdInput.style.setProperty('--threshold-progress', `${(thresholdInput.value / 255) * 100}%`);
                 };
                 updateThresholdDisplay(); // Update display immediately on tab switch/load
             }
         } else if (tabId === 'nbtTool') {
             // NBT tool currently doesn't need specific setup on tab switch
         }
    }

    // Shared Download Function
    function download(filename, textOrBlob) {
        const element = document.createElement('a');
        // Determine if we have text or a Blob (like from JSZip)
        if (textOrBlob instanceof Blob) {
             element.setAttribute('href', URL.createObjectURL(textOrBlob));
        } else { // Assume text
             element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textOrBlob));
        }
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element); // Clean up the element

        // Clean up the object URL if a Blob was used
        if (textOrBlob instanceof Blob) {
             URL.revokeObjectURL(element.href);
        }
    }

    // Sound on Click Logic
    function playClickSound() {
        if (clickSound) {
            // Check if the audio is paused or has ended before trying to play
            // This can prevent errors if the audio is in a weird state
            // Or just reset time for rapid clicks
            clickSound.currentTime = 0; // Rewind to the start for immediate playback on rapid clicks
            clickSound.play().catch(e => {
                // Catch potential errors, e.g., user hasn't interacted yet, autoplay blocked
                // console.warn("Error playing sound:", e); // Use warn to be less intrusive than error
            });
        }
    }

    // --- Add Global Event Listeners (like tab clicks and body clicks for sound) ---

    // Add event listeners for tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Extract tabId from the onclick attribute
            const onclickAttr = button.getAttribute('onclick');
            const match = onclickAttr.match(/openTab\('(.+?)'\)/);
            if (match && match[1]) {
                const tabId = match[1];
                openTab(tabId);
            }
        });
    });

    // Add event listener to play sound on button clicks using delegation on the body
    document.body.addEventListener('click', (event) => {
        // Check if the clicked element or its closest ancestor is a button
        const clickedElement = event.target;
        const button = clickedElement.closest('button');

        // If a button was clicked and it's not disabled, play the sound
        if (button && !button.disabled) {
             // Exclude clicks on the range slider thumb itself, as it can be clicked/dragged frequently.
             // Check if the *event target* is NOT the range input element itself.
             // The thumb is part of the input, so checking event.target.type is a decent heuristic.
             if (event.target.type !== 'range') {
                 playClickSound();
             }
        }
        // Could add other elements here if you want sounds on clicks elsewhere
        // e.g., list items in the preset sections:
        // if (clickedElement.closest('#presetList li') || clickedElement.closest('#selectedPresetsList li')) {
        //     playClickSound();
        // }
    });


    // --- Function Pack Creator Tool Logic and Listeners ---
    // State variables
    let selectedPresetIds = new Set();
    // Map to store the content of files that can be edited (path relative to functions/ -> content string)
    let editableFiles = new Map();
    let currentEditingFile = null; // Track which file is currently in the textarea


    // Preset Definitions (Same as before)
    const allPresets = [
        { id: 'coords_to_score', name: 'Coords to Scores', description: 'Stores player X, Y, Z coordinates into scoreboard objectives each tick.', objectives: [{ name: "coordX", type: "dummy" }, { name: "coordY", type: "dummy" }, { name: "coordZ", type: "dummy" }], setup_commands: [], main_commands: ['# Store player coordinates in scores', 'execute as @a store result score @s coordX run data get entity @s Pos[0] 100', 'execute as @a store result score @s coordY run data get entity @s Pos[1] 100', 'execute as @a store result score @s coordZ run data get entity @s Pos[2] 100'], additional_files: [] },
        { id: 'on_death', name: 'On Player Death', description: 'Detects player deaths using deathCount and runs a function.', objectives: [{ name: "deaths", type: "deathCount" }], setup_commands: [], main_commands: ['# Check for players who have died', 'execute as @a[scores={deaths=1..}] run function <pack_namespace>:on_death_action'], additional_files: [{ filename: "on_death_action.mcfunction", content: "# This function runs when a player dies.\n# Add your commands here.\n# Example: Send a message\ntellraw @s {\"text\":\"You died!\",\"color\":\"red\"}\n\n# IMPORTANT: Reset the death score\nscoreboard players set @s deaths 0" }] },
        { id: 'on_first_join', name: 'On First Join', description: 'Runs a function when a player joins the world for the first time.', objectives: [{ name: "has_joined", type: "dummy" }], setup_commands: [], main_commands: ['# Check for players who have just joined', 'execute as @a unless score @s has_joined matches 1 run function <pack_namespace>:on_first_join_action', '# Mark players as having joined', 'scoreboard players set @a[scores={has_joined=..0}] has_joined 1'], additional_files: [{ filename: "on_first_join_action.mcfunction", content: "# This function runs on a player's first join.\n# Add commands here.\n# Example: Send a welcome message\ntellraw @s {\"text\":\"Welcome to the world!\",\"color\":\"gold\"}" }] }
        // Add more presets here
    ];


    // Helper Functions for Function Pack Creator

    function renderPresetList() {
        if (!presetListDiv) return; // Check if the element exists
        presetListDiv.innerHTML = '';
        allPresets.forEach(preset => {
            if (!selectedPresetIds.has(preset.id)) {
                const li = document.createElement('li');
                // Use data-action for delegation
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
        if (!selectedPresetsListUl || !selectedPresetsDiv) return; // Check if elements exist
        selectedPresetsListUl.innerHTML = '';
         selectedPresetIds.forEach(presetId => {
            const preset = allPresets.find(p => p.id === presetId);
            if (preset) {
                 const li = document.createElement('li');
                  // Use data-action for delegation
                 li.innerHTML = `
                     <span>${preset.name}</span>
                     <button data-preset-id="${preset.id}" data-action="remove">Remove</button>
                 `;
                 selectedPresetsListUl.appendChild(li);
            }
         });
         renderPresetList(); // Re-render available list after updating selected
         // Hide editor area and disable download button when presets change
         resetEditorArea();
    }

    // Use event delegation on the parent elements (presetListDiv and selectedPresetsListUl)
    function handlePresetButtonClick(event) {
        // Ensure the click target is a button within a list item
        const button = event.target.closest('#presetList li button, #selectedPresetsList li button');
        if (!button || !button.dataset.action || !button.dataset.presetId) return;

        const presetId = button.dataset.presetId;
        const action = button.dataset.action; // 'add' or 'remove'

        if (action === 'add') {
            selectedPresetIds.add(presetId);
        } else if (action === 'remove') {
            selectedPresetIds.delete(presetId);
        }

        renderSelectedPresetsList(); // Update both lists
    }

    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for older browsers (less secure, but works)
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function sanitizeNamespace(name) {
        return name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_').replace(/^_|_$/g, '');
    }

    // Editor Management

    function resetEditorArea() {
        // Check all necessary elements exist before manipulating
        if (!fileEditorArea || !fileEditorTextarea || !editableFileListDiv || !editorStatusDiv || !generateAndDownloadPackBtn || !prepareFilesBtn) {
             console.warn("Attempted to reset editor area before all elements are available.");
             return;
        }
        fileEditorArea.style.display = 'none';
        editableFiles.clear(); // Clear the map of file contents
        currentEditingFile = null; // No file is currently being edited
        fileEditorTextarea.value = ''; // Clear the textarea
        editableFileListDiv.innerHTML = ''; // Clear the list of file buttons
        editorStatusDiv.textContent = 'Select a file to edit.'; // Reset status message
        generateAndDownloadPackBtn.disabled = true; // Disable download button
        prepareFilesBtn.disabled = false; // Enable prepare button
         if(packStatusDiv) packStatusDiv.textContent = ''; // Clear pack status
    }

    function renderEditableFileList() {
        if (!editableFileListDiv || !editorStatusDiv) return; // Check if elements exist
        editableFileListDiv.innerHTML = ''; // Clear current list

        if (editableFiles.size === 0) {
            editorStatusDiv.textContent = 'No .mcfunction files were generated.';
            return;
        }

        editorStatusDiv.textContent = 'Click a file to edit:';

        // Add buttons for each editable file
        // Sort files alphabetically for consistent display
        const sortedFilenames = Array.from(editableFiles.keys()).sort();

        sortedFilenames.forEach(filename => {
            const button = document.createElement('button');
            button.textContent = filename; // Display filename as button text (e.g., 'my_pack/main.mcfunction')
            button.dataset.filename = filename; // Store the full path in data attribute
            if (filename === currentEditingFile) {
                button.classList.add('active'); // Add active class if this is the current file
            }
            editableFileListDiv.appendChild(button);
        });
    }

    function loadFileIntoEditor(filename) {
        // Check all necessary elements exist and the requested file exists in the map
        if (!fileEditorTextarea || !editableFiles.has(filename) || !editableFileListDiv || !editorStatusDiv) {
             console.warn("Attempted to load file into editor before all elements are available or file missing:", filename);
             return;
        }

        // Save current editor content IF a file was previously being edited
        if (currentEditingFile && fileEditorTextarea) {
             editableFiles.set(currentEditingFile, fileEditorTextarea.value);
             // console.log(`Saved content for: ${currentEditingFile}`); // Debugging line
        }

        // Load new file content
        currentEditingFile = filename; // Set the new current file
        fileEditorTextarea.value = editableFiles.get(filename); // Load content into textarea
        editorStatusDiv.textContent = `Editing: functions/${filename}`; // Update status message with full path

        // Update button highlighting - remove 'active' from all, add to the clicked one
        editableFileListDiv.querySelectorAll('button').forEach(button => {
            button.classList.remove('active');
        });
        const activeButton = editableFileListDiv.querySelector(`button[data-filename="${filename}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        // Focus the textarea for easier editing
        fileEditorTextarea.focus();
         // Scroll to the top of the textarea when loading a new file
         fileEditorTextarea.scrollTop = 0;
    }

    // Save editor content back to the map as user types
    function handleEditorInput() {
        // Check if a file is currently being edited and if the elements exist
        if (currentEditingFile && fileEditorTextarea && editableFiles.has(currentEditingFile)) {
            editableFiles.set(currentEditingFile, fileEditorTextarea.value);
            // console.log(`Autosaved content for: ${currentEditingFile}`); // Debugging line
        }
    }


    // File Preparation Logic

    function prepareFilesForEditing() {
         // Check all necessary elements exist
         if (!prepareFilesBtn || !packNameInput || !packDescriptionInput || !packStatusDiv || !fileEditorArea || !generateAndDownloadPackBtn || !editableFileListDiv || !fileEditorTextarea || !editorStatusDiv) {
             console.error("Missing required elements for file preparation. Cannot proceed.");
             if(packStatusDiv) packStatusDiv.textContent = 'Error preparing files: Missing page elements.';
             return;
         }

        prepareFilesBtn.disabled = true; // Disable while preparing
        if(packStatusDiv) packStatusDiv.textContent = 'Preparing files...';

        // Reset editor area state first
        resetEditorArea(); // This also clears editableFiles map

        const packName = packNameInput.value.trim() || 'My Function Pack';
        const packDescription = packDescriptionInput.value.trim() || 'Generated by the online tool';
        // Ensure namespace is valid, default if name is empty or results in empty sanitized string
        const packNamespace = sanitizeNamespace(packName) || 'my_pack';


         // --- Assemble Default File Contents ---

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

        const requiredObjectives = new Map(); // Use Map to store unique objectives by name
        const requiredSetupCommands = new Set();
        const additionalPresetFiles = []; // Store additional files defined by presets

        selectedPresetIds.forEach(presetId => {
            const preset = allPresets.find(p => p.id === presetId);
            if (preset) {
                // Add objectives to the Map, using name as key to ensure uniqueness
                preset.objectives.forEach(obj => requiredObjectives.set(obj.name, obj));

                // Add setup commands to the Set for uniqueness
                preset.setup_commands.forEach(cmd => requiredSetupCommands.add(cmd));

                // Add main commands to the mainCommands array
                mainCommands.push('');
                mainCommands.push(`# --- Preset: ${preset.name} ---`);
                preset.main_commands.forEach(cmd => {
                     // Replace placeholder with actual namespace
                     mainCommands.push(cmd.replace(/<pack_namespace>/g, packNamespace));
                });

                // Add additional files from presets
                 preset.additional_files.forEach(file => {
                     additionalPresetFiles.push({
                        filename: file.filename, // e.g. 'on_death_action.mcfunction'
                        content: file.content.replace(/<pack_namespace>/g, packNamespace)
                     });
                 });
            }
        });

         // Add the dummy 'objectives' objective needed for the Bedrock scoreboard check trick
         // This is added regardless of selected presets if objectives.mcfunction is generated
         requiredObjectives.set('objectives', {name: 'objectives', type: 'dummy'});


         // Construct objectives.mcfunction content from collected objectives
         const objectiveCommands = [
             `# Automatically added objectives for pack: ${packName}`,
             '# Ensure objectives are added only if they don\'t exist (requires a player online).',
             '',
             // Sort objectives alphabetically by name for consistent output
             ...Array.from(requiredObjectives.keys()).sort().map(objName => {
                 const obj = requiredObjectives.get(objName);
                 // Use `execute as @a at @s` to target a player context, which is necessary for /scoreboard objectives add
                 // Quote objective names in the command in case they have spaces or special chars (though dummy/deathCount names usually don't)
                 return `execute as @a at @s unless score @s "${obj.name}" objectives matches 0 run scoreboard objectives add "${obj.name}" ${obj.type}`;
             })
         ];

         // Construct setup.mcfunction content from collected setup commands
         const setupCommands = [
             `# Setup commands for pack: ${packName}`,
              '# This function runs once when the pack is loaded/enabled (typically via main.mcfunction on first tick).',
              '',
              ...Array.from(requiredSetupCommands).sort() // Sort setup commands alphabetically
         ];


        // --- Store Content for Editing ---
        // Store filenames relative to the functions/ folder root.
        // This path will be used directly by JSZip.file() relative to functions/.
         editableFiles.set(`${packNamespace}/main.mcfunction`, mainCommands.join('\n'));
         editableFiles.set(`${packNamespace}/objectives.mcfunction`, objectiveCommands.join('\n'));
         editableFiles.set(`${packNamespace}/setup.mcfunction`, setupCommands.join('\n'));

         // Add additional files from presets to the editable list
         additionalPresetFiles.forEach(file => {
            // Preset filenames are added inside the namespace folder
            // Check for duplicates if multiple presets add the same file name (unlikely with preset-specific names)
             const fullPath = `${packNamespace}/${file.filename}`;
             if (editableFiles.has(fullPath)) {
                 console.warn(`Duplicate editable file generated: ${fullPath}. Content is being overwritten.`);
             }
             editableFiles.set(fullPath, file.content);
         });


        // --- Show Editor Area and Load First File ---
         fileEditorArea.style.display = 'block'; // Make the editor section visible
         renderEditableFileList(); // Populate the list of file buttons

         // Load the content of the first generated file into the textarea
         // Default to main.mcfunction if it exists, otherwise take the first one in the map
         const defaultFirstFile = `${packNamespace}/main.mcfunction`;
         const firstFileToLoad = editableFiles.has(defaultFirstFile) ? defaultFirstFile : (editableFiles.size > 0 ? editableFiles.keys().next().value : null);


         if (firstFileToLoad) {
             loadFileIntoEditor(firstFileToLoad); // Load the determined file
         } else {
              // This case should ideally not happen if main.mcfunction is always generated
             editorStatusDiv.textContent = 'No editable files were generated.';
             if (fileEditorTextarea) fileEditorTextarea.value = '';
         }


        // --- Finalize Preparation ---
        if(packStatusDiv) packStatusDiv.textContent = 'Files are ready for editing.';
        generateAndDownloadPackBtn.disabled = false; // Enable the Generate & Download button
        prepareFilesBtn.disabled = false; // Re-enable prepare button (user can change presets and re-prepare)

    }

    // Generation and Download Logic
    async function generateAndDownloadPack() {
         // Check all necessary elements exist
         if (!generateAndDownloadPackBtn || !packStatusDiv || !packNameInput || !packDescriptionInput || !packIconInput || !editableFiles) {
             console.error("Missing required elements for pack generation. Cannot proceed.");
             if(packStatusDiv) packStatusDiv.textContent = 'Error generating pack: Missing page elements.';
             return;
         }

        generateAndDownloadPackBtn.disabled = true; // Disable button while generating
        if(packStatusDiv) packStatusDiv.textContent = 'Generating zip pack...';

        const packName = packNameInput.value.trim() || 'My Function Pack';
        const packDescription = packDescriptionInput.value.trim() || 'Generated by the online tool';
        const packIconFile = packIconInput.files[0]; // Get the uploaded file
        const packNamespace = sanitizeNamespace(packName) || 'my_pack'; // Ensure namespace is valid

        const manifestUuid = generateUUID();
        const moduleUuid = generateUUID();

        // manifest.json - Not editable via UI, generated based on pack info
        const manifestContent = JSON.stringify({
            "format_version": 2,
            "header": {
                "name": packName,
                "description": packDescription,
                "uuid": manifestUuid,
                "version": [1, 0, 0], // Default version
                "min_engine_version": [1, 16, 0] // Minimum engine version
            },
            "modules": [
                {
                    "type": "data",
                    "uuid": moduleUuid,
                    "version": [1, 0, 0] // Default version
                }
            ]
        }, null, 4); // Use 4 spaces for indentation

        // tick.json - Not editable via UI, always runs main function
        const tickJsonContent = JSON.stringify({
             "values": [
                `${packNamespace}:main` // Reference the main function in the namespace
             ]
        }, null, 4);


        // --- Create Zip File ---
        const zip = new JSZip();

        // Add manifest.json to the root of the zip
        zip.file("manifest.json", manifestContent);

        // Add pack icon if uploaded
        if (packIconFile) {
             // Read the file asynchronously as an ArrayBuffer
             try {
                 const iconData = await packIconFile.arrayBuffer();
                 zip.file("pack_icon.png", iconData); // Add the file content
             } catch (error) {
                 if(packStatusDiv) packStatusDiv.textContent = `Error reading pack icon: ${error}`;
                 console.error("Error reading pack icon:", error);
                 generateAndDownloadPackBtn.disabled = false;
                 return; // Stop generation if icon reading fails
             }
        }

        // Create the functions folder
        const functionsFolder = zip.folder("functions");

        // Add tick.json directly inside the functions folder
        functionsFolder.file("tick.json", tickJsonContent);

        // Add editable files from the map to the zip
        // The keys in editableFiles are already the paths relative to the functions/ folder
        editableFiles.forEach((content, relativePath) => {
            // relativePath will be something like 'my_pack/main.mcfunction'
            // JSZip.file("functions/my_pack/main.mcfunction", content)
            // This is equivalent to functionsFolder.file("my_pack/main.mcfunction", content)
            functionsFolder.file(relativePath, content);
        });


        // --- Generate and Download the Zip File ---
        zip.generateAsync({ type: "blob" })
            .then(function(content) {
                // Use the shared download function with the generated Blob
                download(`${packName}.zip`, content);

                if(packStatusDiv) packStatusDiv.textContent = 'Pack generated and downloaded successfully!';
                generateAndDownloadPackBtn.disabled = false; // Re-enable the button

            })
            .catch(function(error) {
                // Handle any errors during zip generation
                if(packStatusDiv) packStatusDiv.textContent = `Error generating pack: ${error}`;
                generateAndDownloadPackBtn.disabled = false;
                console.error("Error generating zip:", error);
            });
    }


    // --- Add Event Listeners for Function Pack tab elements ---
    // Ensure elements are checked for existence before adding listeners
    if (prepareFilesBtn) {
        prepareFilesBtn.addEventListener('click', prepareFilesForEditing);
        // Initial state: disable generate/download until files are prepared
        if (generateAndDownloadPackBtn) generateAndDownloadPackBtn.disabled = true;
         if (fileEditorArea) fileEditorArea.style.display = 'none'; // Hide editor initially
    }

    if (generateAndDownloadPackBtn) {
        generateAndDownloadPackBtn.addEventListener('click', generateAndDownloadPack);
        // Initial state is already handled by prepareFilesBtn check
    }

    // Use event delegation on the parent div for preset add/remove buttons
    if (presetListDiv && selectedPresetsListUl) { // Check both parents exist
        // Add a single listener to the common ancestor (or one of the parents)
        // We can add it to the section div containing both lists
        const presetsSection = document.querySelector('.presets.section');
        if(presetsSection) {
             presetsSection.addEventListener('click', handlePresetButtonClick);
        } else {
             // Fallback if section div not found, add to both lists (less efficient)
             if(presetListDiv) presetListDiv.addEventListener('click', handlePresetButtonClick);
             if(selectedPresetsListUl) selectedPresetsListUl.addEventListener('click', handlePresetButtonClick);
        }
    }


    // Use event delegation on the parent div for file selection buttons in the editor
    if (editableFileListDiv) {
         editableFileListDiv.addEventListener('click', function(event) {
             const button = event.target.closest('button[data-filename]'); // Only handle clicks on buttons with data-filename
             if (button) {
                 loadFileIntoEditor(button.dataset.filename);
             }
         });
    }

    // Listen for input (typing) on the file editor textarea
    if (fileEditorTextarea) {
         fileEditorTextarea.addEventListener('input', handleEditorInput);
          // Optional: save on blur too, might be less frequent but guarantees save
          // fileEditorTextarea.addEventListener('blur', handleEditorInput);
    }


    // --- QR Code to MCFunction Tool Logic and Listeners ---

    // Event Listener for File Input (Image Tool)
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
                // Handle case where user cancels file selection
                if (imagePreview) imagePreview.style.display = 'none';
                if (convertButton) convertButton.disabled = true;
                if (outputCommands) outputCommands.value = '';
                if (copyButton) copyButton.disabled = true;
                if (downloadButton) downloadButton.disabled = true;
                if (imageStatusMessage) imageStatusMessage.textContent = 'Select an image to begin.';
            }
        });
    }

    // Add listener for range slider value update and CSS variable (only needed once)
    if (thresholdInput && thresholdValueSpan) { // Check for both elements
         const updateThresholdDisplay = () => {
             thresholdValueSpan.textContent = thresholdInput.value;
             thresholdInput.style.setProperty('--threshold-progress', `${(thresholdInput.value / 255) * 100}%`);
         };
         // Add listener here. Initial update is handled in openTab for qrTool.
         thresholdInput.addEventListener('input', updateThresholdDisplay);
         // The very first load when qrTool might not be the default tab needs an initial setting
         // But openTab should handle this now. If not default, this listener will fire on first input.
         // To be extra safe, you could call updateThresholdDisplay() here, but openTab is better.
    }


    // Event Listener for Convert Button (Image Tool)
    if (convertButton) {
        convertButton.addEventListener('click', function() {
            // Check all necessary elements are available for conversion logic
            if (!imagePreview || !imagePreview.src || imagePreview.src === '#' || !processingCanvas || !ctx || !pixelRatioInput || !baseHeightInput || !zOffsetInput || !ditheringEnabledInput || !outputCommands || !imageStatusMessage || !convertButton || !copyButton || !downloadButton || !thresholdInput) {
                console.error("Missing required elements for image conversion. Cannot proceed.");
                if(imageStatusMessage) imageStatusMessage.textContent = 'Error converting image: Missing page elements.';
                 if (convertButton) convertButton.disabled = false; // Ensure button is re-enabled on error
                return;
            }

            if (imageStatusMessage) imageStatusMessage.textContent = 'Converting...';
            if (convertButton) convertButton.disabled = true;
            if (copyButton) copyButton.disabled = true;
            if (downloadButton) downloadButton.disabled = true;
            if (outputCommands) outputCommands.value = '';

            const img = new Image();
            img.onload = function() {
                processImage(img); // Call the processing function
            };
            img.onerror = function() {
                if (imageStatusMessage) imageStatusMessage.textContent = 'Error loading image for processing.';
                if (convertButton) convertButton.disabled = false;
            };
            img.src = imagePreview.src; // Use the data URL from the preview
        });
    }

     // Helper Function to Find Closest Color (Image Tool) - Gets threshold from input
    function findClosestColor(pixelColor, palette) {
        const black = palette[0];
        const white = palette[1];

        const r = pixelColor[0];
        const g = pixelColor[1];
        const b = pixelColor[2];

        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
         // Read threshold value directly from the input element
         const threshold = parseInt(document.getElementById('threshold')?.value) || 128; // Use optional chaining in case element is somehow missing

        if (luminance < threshold) {
            return black;
        } else {
            return white;
        }
    }

     // Dithering Helper Function (Image Tool) - Same as before
     function diffuseError(workingPixels, width, height, px, py, er, eg, eb, weight) {
         if (px >= 0 && px < width && py >= 0 && py < height) {
             const idx = (py * width + px) * 4;
             // Only apply error to pixels that are not fully transparent
             if (workingPixels[idx + 3] > 10) { // Check alpha is mostly opaque
                 workingPixels[idx] = Math.max(0, Math.min(255, workingPixels[idx] + er * weight));
                 workingPixels[idx + 1] = Math.max(0, Math.min(255, workingPixels[idx + 1] + eg * weight));
                 workingPixels[idx + 2] = Math.max(0, Math.min(255, workingPixels[idx + 2] + eb * weight));
             }
         }
     }

     // Process Image Function (Image Tool) - Same as before, calls findClosestColor
    function processImage(img) {
        // Check all necessary elements again before processing pixels
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
        // Threshold is read inside findClosestColor


        if (pixelRatio < 1) {
             imageStatusMessage.textContent = 'Pixels per Block must be at least 1.';
             convertButton.disabled = false;
             return;
        }

        // Set canvas size to original image size for drawing and getting pixel data
        processingCanvas.width = img.width;
        processingCanvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;
        // Create a writable copy of the pixel data if dithering is enabled
        const workingPixels = ditheringEnabled ? new Uint8ClampedArray(pixels) : pixels;


        const commands = []; // Array to store generated commands
        // Calculate output dimensions in blocks
        const outputWidth = Math.floor(img.width / pixelRatio);
        const outputHeight = Math.floor(img.height / pixelRatio);

        if (outputWidth === 0 || outputHeight === 0) {
            imageStatusMessage.textContent = 'Image is too small for the chosen Pixels per Block.';
            convertButton.disabled = false;
            return;
        }

         // Clear canvas and resize it to match the output block dimensions for the preview
         ctx.clearRect(0, 0, processingCanvas.width, processingCanvas.height); // Clear previous content
        processingCanvas.width = outputWidth; // Set canvas size to output block dimensions
        processingCanvas.height = outputHeight;
         ctx.fillStyle = '#1a1a1a'; // Fill background with a dark color
         ctx.fillRect(0, 0, outputWidth, outputHeight); // Fill the background


        // Loop through each block position in the output grid
        for (let y = 0; y < outputHeight; y++) {
            for (let x = 0; x < outputWidth; x++) {
                 const startPixelX = x * pixelRatio; // Top-left X coordinate in original image
                 const startPixelY = y * pixelRatio; // Top-left Y coordinate in original image

                 // Get the color of the top-left pixel in the current block area
                 // This pixel will be used as the representative color for the block
                 const pixelIndex = (startPixelY * img.width + startPixelX) * 4;
                 const pixelR = workingPixels[pixelIndex];
                 const pixelG = workingPixels[pixelIndex + 1];
                 const pixelB = workingPixels[pixelIndex + 2];
                 const pixelA = workingPixels[pixelIndex + 3]; // Get alpha


                 let matchedBlock = null;
                 let finalColorForCanvas = [0, 0, 0]; // Default color for drawing on the preview canvas

                 // Only process if the pixel is mostly opaque (alpha > 10)
                 if (pixelA > 10) {
                     const originalColor = [pixelR, pixelG, pixelB]; // Color from workingPixels (modified if dithering)
                     // Find the closest block color based on the representative pixel's color and the threshold
                     matchedBlock = findClosestColor(originalColor, minecraftPalette);

                     finalColorForCanvas = matchedBlock.color; // Use the matched block's color for the preview

                     // Apply dithering if enabled
                     if (ditheringEnabled) {
                         // Calculate the error between the original pixel color and the chosen block color
                         let errorR = originalColor[0] - matchedBlock.color[0];
                         let errorG = originalColor[1] - matchedBlock.color[1];
                         let errorB = originalColor[2] - matchedBlock.color[2];

                         // Distribute the error to neighboring pixels using Floyd-Steinberg weights
                         diffuseError(workingPixels, img.width, img.height, startPixelX + 1, startPixelY, errorR, errorG, errorB, 7 / 16);
                         diffuseError(workingPixels, img.width, img.height, startPixelX - 1, startPixelY + 1, errorR, errorG, errorB, 3 / 16);
                         diffuseError(workingPixels, img.width, img.height, startPixelX, startPixelY + 1, errorR, errorG, errorB, 5 / 16);
                         diffuseError(workingPixels, img.width, img.height, startPixelX + 1, startPixelY + 1, errorR, errorG, errorB, 1 / 16);
                     }

                      // Add the setblock command for this block position
                      commands.push(`setblock ~${x} ~${y + baseHeight} ~${zOffset} ${matchedBlock.id}`);

                 } else {
                    // If pixel is transparent or very low alpha, place a white block
                     matchedBlock = findClosestColor([255, 255, 255], minecraftPalette); // Assume transparent areas become white wool
                     finalColorForCanvas = matchedBlock.color;
                     commands.push(`setblock ~${x} ~${y + baseHeight} ~${zOffset} ${matchedBlock.id}`); // Place white block
                 }

                 // Draw a single pixel on the smaller preview canvas representing the block color
                 ctx.fillStyle = `rgb(${finalColorForCanvas[0]}, ${finalColorForCanvas[1]}, ${finalColorForCanvas[2]})`;
                 ctx.fillRect(x, y, 1, 1); // Draw a 1x1 pixel at (x, y) on the output grid

            }
        }

        // Update the output textarea and status message
        outputCommands.value = commands.join('\n'); // Join commands with newlines
        imageStatusMessage.textContent = `Converted image to ${commands.length} blocks (${outputWidth}x${outputHeight}).`; // Show command count and dimensions

        // Enable Copy and Download buttons if commands were generated
        convertButton.disabled = false; // Re-enable convert button
        copyButton.disabled = commands.length === 0;
        downloadButton.disabled = commands.length === 0;
    }

    // Copy Button Functionality (Image Tool)
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            if (!outputCommands) return;
            outputCommands.select(); // Select the text in the textarea
            outputCommands.setSelectionRange(0, 99999); // For mobile compatibility

            // Copy the selected text to the clipboard
            navigator.clipboard.writeText(outputCommands.value).then(() => {
                // Provide visual feedback that copy was successful
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                // Revert button text after a short delay
                setTimeout(() => {
                    copyButton.textContent = originalText;
                }, 1500);
            }).catch(err => {
                // Handle potential errors during copy (e.g., not supported, permissions)
                console.error('Could not copy text: ', err);
                 if(imageStatusMessage) imageStatusMessage.textContent = 'Error copying commands.';
            });
        });
    }


    // Download Button Functionality (Image Tool)
    if (downloadButton) {
         downloadButton.addEventListener('click', function() {
             if (!outputCommands || !imageStatusMessage) return; // Check elements
             const textToSave = outputCommands.value; // Get text from textarea
             if (!textToSave) {
                 imageStatusMessage.textContent = 'No commands to download.';
                 return;
             }
             // Use the shared download function to create and trigger download of .mcfunction file
             download('pixel_art.mcfunction', textToSave);
             imageStatusMessage.textContent = 'Downloaded pixel_art.mcfunction'; // Update status message
         });
    }


    // --- MCFunction to Nifty Building Tool NBT Converter Logic and Listeners ---

    // Event Listener for File Input (MCFunction Tool)
    if (nbtFileInput) {
        nbtFileInput.addEventListener('change', getNBTFile); // Attach listener to the file input
    }

    function getNBTFile(event) {
        const input = event.target;
        if ('files' in input && input.files.length > 0) {
             // Check if fileStatusMessage element exists before using it
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Reading file...';
             processNBTFile(input.files[0]); // Process the first selected file
        } else {
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Select an .mcfunction file to convert.';
        }
        // Clearing input.value can prevent selecting the same file repeatedly if needed.
        // input.value = ''; // Uncomment if you want to allow re-selecting the same file
    }

    // Main processing logic for NBT conversion
    function processNBTFile(file) {
         // Check all necessary elements exist before starting
         if(!nbtStatusMessage || !nbtTitleInput || !commandsPerNpcInput) {
             console.error("Missing NBT tool elements. Cannot proceed.");
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Internal error: Missing elements.';
             return;
         }

         nbtStatusMessage.textContent = 'Processing commands...';
        // Read the file content asynchronously
        readFileContent(file).then(content => {
            // Extract useful commands (setblock, fill, summon, structure, ignoring comments)
            const commands = getUsefulCommands(content);

            if (commands.length === 0) {
                 nbtStatusMessage.textContent = 'No setblock, fill, summon, or structure commands found in the file.';
                 return;
            }

            // Get options from user input
            let commands_per_npc = parseInt(commandsPerNpcInput.value);
            let nbt_name = nbtTitleInput.value.trim();
            let file_name;

            // Determine output file name and default NBT title
            if (nbt_name === "") {
                file_name = "NiftyBuildingTool_Output.txt";
                nbt_name = "Unnamed Build" // Use default name for NBT data too if input is empty
            } else {
                // Clean up file name to be safer for file systems (alphanumeric, hyphen, underscore)
                file_name = "NiftyBuildingTool_" + nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "") + ".txt";
            }

            // Validate commands per NPC, default if invalid
            if (isNaN(commands_per_npc) || commands_per_npc <= 0) {
                commands_per_npc = 346; // Default limit
                 if (commandsPerNpcInput) commandsPerNpcInput.value = 346; // Update the input field
            }

            let curSec = 0; // Counter for NPC sections
            // Start building the main NBT structure string
            let NBTdata = getBlockOpener(nbt_name); // Opening part of the NBT structure

            // Calculate the number of NPCs needed
            let NPCCount = Math.ceil(commands.length / commands_per_npc);

            nbtStatusMessage.textContent = `Generating NBT for ${commands.length} commands across ${NPCCount} NPCs...`;

            // Loop through commands, splitting them into NPC sections
            for (var i = 0; i < commands.length; i += commands_per_npc) {
                curSec++; // Increment section counter
                // Get the commands for the current NPC section
                let NPCCommandList = commands.slice(i, i + commands_per_npc);
                // Determine the tag for the *next* NPC (or 1 if this is the last NPC)
                let nextNPC = (curSec === NPCCount ? 1 : curSec + 1);

                // Clean name for NPC tag and ticking area (strict alphanumeric, hyphen, underscore)
                const cleanNbtNameForTag = nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "");

                // Add necessary commands to the start and end of the NPC's command list
                // Ticking area commands ensure chunks are loaded
                NPCCommandList.unshift(`/tickingarea add circle ~ ~ ~ 4 NIFTYBUILDINGTOOL_${cleanNbtNameForTag}`);
                NPCCommandList.push(`/tickingarea remove NIFTYBUILDINGTOOL_${cleanNbtNameForTag}`);
                // Add dialogue command to open the next NPC's dialogue if there is a next NPC
                if (NPCCount > 1) {
                     NPCCommandList.push(`/dialogue open @e[tag="${cleanNbtNameForTag}${nextNPC}",type=NPC,c=1] @initiator`);
                }
                // Add command to kill the current NPC after it finishes
                NPCCommandList.push(`/kill @s`);

                // Add the NBT structure for the current NPC
                NBTdata += getNPCOpener(curSec, nbt_name); // NPC opening part
                // Convert each command in the list to its NBT string representation and join with commas
                NBTdata += NPCCommandList.map(x => commandToNBT(x.trim())).join(",");
                NBTdata += getNPCCloser(); // NPC closing part

                // Add a comma separator if this is not the last NPC
                if (curSec < NPCCount) {
                  NBTdata += ",";
                }
            }
            NBTdata += getBlockCloser(); // Closing part of the main NBT structure

            // Trigger download
             nbtStatusMessage.textContent = 'Download starting...';
            download(file_name, NBTdata); // Use the shared download function

             nbtStatusMessage.textContent = `Successfully generated and downloaded ${file_name}.`; // Final status message
        }).catch(error => {
             // Handle errors during file reading or processing
             console.error("Error processing file:", error);
             if(nbtStatusMessage) nbtStatusMessage.textContent = 'Error processing file. Check console (F12) for details.';
         });
    }

    // Helper to read file content (used by NBT Tool)
    function readFileContent(file) {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = event => resolve(event.target.result);
            reader.onerror = error => reject(error);
            reader.readAsText(file); // Read file as text
        })
    }

    // Helper to extract useful commands (used by NBT Tool)
    function getUsefulCommands(content) {
        return content.split('\n') // Split content into lines
            .map(x => x.replace(/^\s*\//, "").trim()) // Remove leading slash and trim whitespace
            .filter(x => { // Filter out empty lines, comments, and non-building commands
                return x.length > 0 && !x.startsWith("#") && (x.startsWith("setblock") || x.startsWith("fill") || x.startsWith("summon") || x.startsWith("structure"));
            });
    }

    // NBT Helper Functions (from provided code, used by NBT Tool) - Same as before
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


}); // End of DOMContentLoaded listener
