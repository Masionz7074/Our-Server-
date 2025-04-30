// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {

    // --- Get ALL Element References FIRST ---
    // Global Elements and Navigation
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarLinks = document.querySelectorAll('#sidebar .sidebar-link');
    const mainContent = document.getElementById('mainContent');
    const contentSections = document.querySelectorAll('.content-section');

    // Function Pack Creator Tool Elements
    const generateBtn = document.getElementById('generateBtn');
    const packNameInput = document.getElementById('packName');
    const packDescriptionInput = document.getElementById('packDescription');
    const packIconInput = document.getElementById('packIcon');
    const presetListDiv = document.getElementById('presetList');
    const selectedPresetsDiv = document.getElementById('selectedPresets');
    const selectedPresetsListUl = document.getElementById('selectedPresetsList');
    const packStatusDiv = document.getElementById('packStatus');

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

    // Settings Tool Elements
    const musicVolumeInput = document.getElementById('musicVolume');
    const musicVolumeValueSpan = document.getElementById('musicVolumeValue');
    const sfxVolumeInput = document.getElementById('sfxVolume');
    const sfxVolumeValueSpan = document.getElementById('sfxVolumeValue');
    const toggleMusicBtn = document.getElementById('toggleMusicBtn');


    // --- Set Initial Audio Volumes and State (Read from localStorage) ---
    if (backgroundMusic) {
        const savedMusicVolume = localStorage.getItem('musicVolume');
        backgroundMusic.volume = savedMusicVolume !== null ? parseFloat(savedMusicVolume) : 0.5; // Default to 50% if no saved volume
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
     if (clickSound) {
        const savedSfxVolume = localStorage.getItem('sfxVolume');
         clickSound.volume = savedSfxVolume !== null ? parseFloat(savedSfxVolume) : 1.0; // Default to 100% if no saved volume
     }


    // --- Global Functions (Navigation, Download, Sound) ---

    function toggleSidebar() {
        if (sidebar) {
            sidebar.classList.toggle('open');
            document.body.classList.toggle('sidebar-open');
        }
    }

    function showSection(sectionId) {
        // Hide all content sections
        contentSections.forEach(section => {
            section.style.display = 'none';
        });

        // Show the selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.style.display = 'block';
             if (mainContent) {
                 // Smooth scroll behavior might be annoying, simpler is instant scroll
                 mainContent.scrollTo({ top: 0, behavior: 'auto' }); // Scroll to top
             }

            // Update active state in sidebar links
            sidebarLinks.forEach(link => {
                 if (link.dataset.section === sectionId) {
                     link.classList.add('active-section');
                 } else {
                     link.classList.remove('active-section');
                 }
            });

            // --- Perform setup specific to the section being shown ---
            if (sectionId === 'functionPackTool') {
                if (presetListDiv && selectedPresetsListUl) {
                    renderPresetList();
                    renderSelectedPresetsList();
                }
            } else if (sectionId === 'qrTool') {
                if (thresholdInput && thresholdValueSpan) {
                    const updateThresholdDisplay = () => {
                        thresholdValueSpan.textContent = thresholdInput.value;
                        thresholdInput.style.setProperty('--threshold-progress', `${(thresholdInput.value / 255) * 100}%`);
                    };
                    updateThresholdDisplay();
                }
            } else if (sectionId === 'settingsTool') {
                 // Initialize settings UI when the settings section is shown
                 if (musicVolumeInput && musicVolumeValueSpan && backgroundMusic) {
                     // Ensure the slider reflects the current audio volume
                     musicVolumeInput.value = backgroundMusic.volume;
                     musicVolumeValueSpan.textContent = `${Math.round(backgroundMusic.volume * 100)}%`;
                 }
                 if (sfxVolumeInput && sfxVolumeValueSpan && clickSound) {
                     // Ensure the slider reflects the current audio volume
                     sfxVolumeInput.value = clickSound.volume;
                     sfxVolumeValueSpan.textContent = `${Math.round(clickSound.volume * 100)}%`;
                     // Set initial lastValue for test sound logic
                     sfxVolumeInput.dataset.lastValue = sfxVolumeInput.value;
                 }
                  // Update music toggle button text
                 if (toggleMusicBtn && backgroundMusic) {
                     toggleMusicBtn.textContent = backgroundMusic.paused ? 'Play Music' : 'Pause Music';
                 }
            }
        } else {
             console.error(`Content section with ID "${sectionId}" not found.`);
        }

        // Close the sidebar on mobile after selecting a section
        // Use a width check or check for the sidebar class
        if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
             toggleSidebar();
        }
    }

    // Shared Download Function (Same as before)
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

    // Sound on Click Logic (Uses clickSound volume)
    function playClickSound() {
        if (clickSound) {
            clickSound.currentTime = 0;
            clickSound.play().catch(e => { /* Error ignored, often autoplay policy */ });
        }
    }

    // Background Music Playback Attempt Logic
    function attemptBackgroundMusicPlayback() {
        if (backgroundMusic && backgroundMusic.paused) {
            const playPromise = backgroundMusic.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log("Background music started.");
                    // Music is playing, remove these specific listeners
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

    // --- Settings Functionality ---
    function handleMusicVolumeChange() {
         if (backgroundMusic && musicVolumeInput && musicVolumeValueSpan) {
            backgroundMusic.volume = parseFloat(musicVolumeInput.value); // Update volume
            musicVolumeValueSpan.textContent = `${Math.round(backgroundMusic.volume * 100)}%`; // Update display
            localStorage.setItem('musicVolume', backgroundMusic.volume.toString()); // Save to local storage as string
         }
    }

    function handleSfxVolumeChange() {
         if (clickSound && sfxVolumeInput && sfxVolumeValueSpan) {
             clickSound.volume = parseFloat(sfxVolumeInput.value); // Update volume
             sfxVolumeValueSpan.textContent = `${Math.round(clickSound.volume * 100)}%`; // Update display
             localStorage.setItem('sfxVolume', clickSound.volume.toString()); // Save to local storage as string

             // Play a quick test sound if volume is increased from 0 and slider position changed
             if (clickSound.volume > 0 && sfxVolumeInput.dataset.lastValue !== sfxVolumeInput.value) {
                 playClickSound();
             }
             sfxVolumeInput.dataset.lastValue = sfxVolumeInput.value; // Store current value for next comparison
         }
    }

    function toggleMusicPlayback() {
        if (backgroundMusic && toggleMusicBtn) {
            if (backgroundMusic.paused) {
                // Attempt to play, which also handles autoplay rules
                attemptBackgroundMusicPlayback();
                // Also explicitly remove the initial attempt listeners in case the attemptBackgroundMusicPlayback promise fails later but the button click still works
                 document.body.removeEventListener('click', attemptBackgroundMusicPlayback);
                 document.body.removeEventListener('keydown', attemptBackgroundMusicPlayback);

                toggleMusicBtn.textContent = 'Pause Music';
            } else {
                backgroundMusic.pause();
                console.log("Background music paused.");
                toggleMusicBtn.textContent = 'Play Music';
            }
        }
    }


    // --- Add Global Event Listeners ---

    // Listener for the hamburger button
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleSidebar);
    }

    // Listeners for sidebar links using delegation
    const sidebarMenu = document.querySelector('.sidebar-menu');
    const sidebarFooter = document.querySelector('.sidebar-footer');

    if (sidebarMenu) {
        sidebarMenu.addEventListener('click', (event) => {
            const linkButton = event.target.closest('.sidebar-link');
            if (linkButton && linkButton.dataset.section) {
                showSection(linkButton.dataset.section);
            }
        });
    }
     if (sidebarFooter) {
        sidebarFooter.addEventListener('click', (event) => {
            const linkButton = event.target.closest('.sidebar-link');
            if (linkButton && linkButton.dataset.section) {
                showSection(linkButton.dataset.section);
            }
        });
    }


    // Add event listener to play click sound on button clicks using delegation on the body
    document.body.addEventListener('click', (event) => {
        const clickedElement = event.target;
        // Check if the clicked element or its closest ancestor is a button, but NOT the hamburger icon itself
        // or a link within the sidebar, or a slider input.
        const button = clickedElement.closest('button');

        // Check if it's a button, not disabled, and not the hamburger or a sidebar link
        if (button && !button.disabled && button !== hamburgerBtn && !button.closest('#sidebar')) {
             // Exclude clicks on the range input element itself (thumb drag)
             if (event.target.type !== 'range') {
                 playClickSound();
             }
        }
        // Optionally add sound for sidebar links separately if desired, but they are buttons so the above works
        // if (clickedElement.closest('.sidebar-link')) {
        //      playClickSound();
        // }
    });


    // Add initial listeners to try playing background music on the first click or keydown
    document.body.addEventListener('click', attemptBackgroundMusicPlayback);
    document.body.addEventListener('keydown', attemptBackgroundMusicPlayback);


    // --- Add Event Listeners for Function Pack tab elements ---
    if (generateBtn) {
        generateBtn.addEventListener('click', generatePack);
    }

    const presetsSection = document.querySelector('.presets.section');
    if(presetsSection) {
         presetsSection.addEventListener('click', handlePresetButtonClick);
    }


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


    // --- MCFunction to Nifty Building Tool NBT Logic and Listeners ---

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


    // --- Add Event Listeners for Settings elements ---
    if (musicVolumeInput && musicVolumeValueSpan && backgroundMusic) {
        musicVolumeInput.addEventListener('input', handleMusicVolumeChange);
         // Initial display is set in showSection('settingsTool')
    }
     if (sfxVolumeInput && sfxVolumeValueSpan && clickSound) {
        sfxVolumeInput.addEventListener('input', handleSfxVolumeChange);
         // Initial display and lastValue are set in showSection('settingsTool')
     }
     if (toggleMusicBtn && backgroundMusic) {
        toggleMusicBtn.addEventListener('click', toggleMusicPlayback);
         // Initial button text is set in showSection('settingsTool')
     }


    // --- Initial Page Load: Show Default Section ---
     showSection('homeTool');


}); // End of DOMContentLoaded listener
