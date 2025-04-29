// --- Tab Functionality Script ---
function openTab(tabId) {
    // Get all elements with class="tab-content" and hide them
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = 'none';
    }

    // Get all elements with class="tab-button" and remove the class "active"
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabId).style.display = 'block';
    // Find the button that has the onclick corresponding to this tabId
     for (let i = 0; i < tabButtons.length; i++) {
        if (tabButtons[i].getAttribute('onclick').includes(`openTab('${tabId}')`)) {
             tabButtons[i].classList.add('active');
             break;
        }
    }
}

 // Automatically open the first tab on page load
 // Use DOMContentLoaded to ensure all elements exist before trying to access them
 document.addEventListener('DOMContentLoaded', function() {
     openTab('qrTool'); // Opens the QR code tab by default
 });


// --- Image to MCFunction Tool Script ---
// Get element references for the first tool
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const processingCanvas = document.getElementById('processingCanvas');
const ctx = processingCanvas.getContext('2d');
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

// Update threshold value display when slider moves
if (thresholdInput && thresholdValueSpan) { // Add checks in case elements don't load
    thresholdInput.addEventListener('input', function() {
        thresholdValueSpan.textContent = this.value;
    });
}


// --- Minecraft Block Color Palette (Only Black Concrete and White Wool) ---
const minecraftPalette = [
     { id: 'minecraft:black_concrete', color: [18, 20, 26] },
     { id: 'minecraft:white_wool', color: [242, 242, 242] }
];

// --- Event Listener for File Input (Image Tool) ---
if (imageInput) { // Add check
    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block'; // Show preview
                convertButton.disabled = false; // Enable convert button
                outputCommands.value = ''; // Clear previous output
                copyButton.disabled = true; // Disable copy button
                downloadButton.disabled = true; // Disable download button
                imageStatusMessage.textContent = 'Image loaded. Adjust options and click Convert.';
            };
            reader.onerror = function() {
                 imageStatusMessage.textContent = 'Error reading file.';
                 convertButton.disabled = true;
                 imagePreview.style.display = 'none';
                 copyButton.disabled = true;
                 downloadButton.disabled = true;
            }
            reader.readAsDataURL(file);
        } else {
             imagePreview.style.display = 'none';
             convertButton.disabled = true;
             outputCommands.value = '';
             copyButton.disabled = true;
             downloadButton.disabled = true;
             imageStatusMessage.textContent = 'Select an image to begin.';
        }
    });
}


// --- Event Listener for Convert Button (Image Tool) ---
if (convertButton) { // Add check
    convertButton.addEventListener('click', function() {
        if (!imagePreview.src || imagePreview.src === '#') {
            imageStatusMessage.textContent = 'No image loaded.';
            return;
        }

        imageStatusMessage.textContent = 'Converting...';
        convertButton.disabled = true;
        copyButton.disabled = true;
        downloadButton.disabled = true;
        outputCommands.value = '';

        const img = new Image();
        img.onload = function() {
            processImage(img);
        };
        img.onerror = function() {
            imageStatusMessage.textContent = 'Error loading image for processing.';
            convertButton.disabled = false;
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

    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    if (luminance < 128) {
        return black;
    } else {
        return white;
    }
}

 // --- Dithering Helper Function (Image Tool) ---
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

 // --- Process Image Function (Image Tool) ---
function processImage(img) {
    const pixelRatio = parseInt(pixelRatioInput.value) || 1;
    const baseHeight = parseInt(baseHeightInput.value) || 64;
    const zOffset = parseInt(zOffsetInput.value) || 0;
    const ditheringEnabled = ditheringEnabledInput.checked;
    const threshold = parseInt(thresholdInput.value) || 128;

    if (pixelRatio < 1) {
         imageStatusMessage.textContent = 'Pixel Ratio must be at least 1.';
         convertButton.disabled = false;
         return;
    }

    processingCanvas.width = img.width;
    processingCanvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const pixels = imageData.data;
    const workingPixels = new Uint8ClampedArray(pixels);

    // Apply B&W Thresholding
    for (let i = 0; i < workingPixels.length; i += 4) {
        const r = workingPixels[i];
        const g = workingPixels[i + 1];
        const b = workingPixels[i + 2];
        const alpha = workingPixels[i + 3];

        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        let bwValue;

        if (alpha < 128) { // Treat semi-transparent as white
            bwValue = 255;
        } else {
           bwValue = luminance < threshold ? 0 : 255;
        }

        workingPixels[i] = bwValue;
        workingPixels[i + 1] = bwValue;
        workingPixels[i + 2] = bwValue;
        workingPixels[i + 3] = 255; // Ensure full alpha for solid blocks
    }


    const commands = [];
    const outputWidth = Math.floor(img.width / pixelRatio);
    const outputHeight = Math.floor(img.height / pixelRatio);

    if (outputWidth === 0 || outputHeight === 0) {
        imageStatusMessage.textContent = 'Image is too small for the chosen Pixel Ratio.';
        convertButton.disabled = false;
        return;
    }

    ctx.clearRect(0, 0, img.width, img.height); // Clear canvas content
    processingCanvas.width = outputWidth; // Set canvas size to output block dimensions
    processingCanvas.height = outputHeight;


    for (let y = 0; y < outputHeight; y++) {
        for (let x = 0; x < outputWidth; x++) {
             const startX = x * pixelRatio;
             const startY = y * pixelRatio;

             let representativeR = 0, representativeG = 0, representativeB = 0;
             let colorSourceCount = 0;

             for (let py = 0; py < pixelRatio; py++) {
                for (let px = 0; px < pixelRatio; px++) {
                    const currentPixelX = startX + px;
                    const currentPixelY = startY + py;
                     if (currentPixelX < img.width && currentPixelY < img.height) {
                        const index = (currentPixelY * img.width + currentPixelX) * 4;
                         representativeR += workingPixels[index];
                         representativeG += workingPixels[index + 1];
                         representativeB += workingPixels[index + 2];
                         colorSourceCount++;
                     }
                 }
             }

             let matchedBlock = null;

             if(colorSourceCount > 0) {
                 representativeR = Math.round(representativeR / colorSourceCount);
                 representativeG = Math.round(representativeG / colorSourceCount);
                 representativeB = Math.round(representativeB / colorSourceCount);
                 let finalColor = [representativeR, representativeG, representativeB]; // Note: Using 'let' for finalColor if needed later

                 matchedBlock = findClosestColor(finalColor, minecraftPalette); // Uses simplified B&W logic

                 if (ditheringEnabled) {
                     let errorR = finalColor[0] - matchedBlock.color[0];
                     let errorG = finalColor[1] - matchedBlock.color[1];
                     let errorB = finalColor[2] - matchedBlock.color[2];

                     diffuseError(workingPixels, img.width, img.height, startX + 1, startY, errorR, errorG, errorB, 7 / 16);
                     diffuseError(workingPixels, img.width, img.height, startX - 1, startY + 1, errorR, errorG, errorB, 3 / 16);
                     diffuseError(workingPixels, img.width, img.height, startX, startY + 1, errorR, errorG, errorB, 5 / 16);
                     diffuseError(workingPixels, img.width, img.height, startX + 1, startY + 1, errorR, errorG, errorB, 1 / 16);
                 }

                commands.push(`setblock ~${x} ~${y + baseHeight} ~${zOffset} ${matchedBlock.id}`);

                 ctx.fillStyle = `rgb(${matchedBlock.color[0]}, ${matchedBlock.color[1]}, ${matchedBlock.color[2]})`;
                 ctx.fillRect(x, y, 1, 1); // Draw a 1x1 pixel on the output canvas grid

             } else {
                 // If count is 0, region was fully transparent (alpha < 128 during thresholding) - treat as white
                 matchedBlock = findClosestColor([255, 255, 255], minecraftPalette); // Match white block
                 commands.push(`setblock ~${x} ~${y + baseHeight} ~${zOffset} ${matchedBlock.id}`); // Place white block
                 ctx.fillStyle = `rgb(${matchedBlock.color[0]}, ${matchedBlock.color[1]}, ${matchedBlock.color[2]})`;
                 ctx.fillRect(x, y, 1, 1); // Draw white on preview
             }
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
             imageStatusMessage.textContent = 'Error copying commands.';
        });
    });
}


// --- Download Button Functionality (Image Tool) ---
if (downloadButton) { // Add check
     downloadButton.addEventListener('click', function() {
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


// --- MCFunction to Nifty Building Tool NBT Converter Script ---
// Using the provided code and linking to its specific elements

const nbtStatusMessage = document.getElementById('nbtStatusMessage'); // Get reference to the new status element
const nbtFileInput = document.getElementById('input-file'); // Get ref to the input file element
const nbtTitleInput = document.getElementById('nbt-title');
const commandsPerNpcInput = document.getElementById('commands-per-npc');


// Entry point for choosing a file (MCFunction Tool) - event listener on its specific input
if (nbtFileInput) { // Add check
    nbtFileInput.addEventListener('change', getFile);
}


function getFile(event) {
    const input = event.target;
    if ('files' in input && input.files.length > 0) {
         nbtStatusMessage.textContent = 'Reading file...';
         processFile(input.files[0]);
    } else {
         nbtStatusMessage.textContent = 'Select an .mcfunction file to convert.';
    }
    input.value = ''; // Clear file input after selection
}

// Meat-and-potatoes logic (MCFunction Tool)
function processFile(file) {
     nbtStatusMessage.textContent = 'Processing commands...';
    readFileContent(file).then(content => {
        const commands = getUsefulCommands(content);

        if (commands.length === 0) {
             nbtStatusMessage.textContent = 'No setblock, fill, or summon commands found in the file.';
             return;
        }

        let commands_per_npc = parseInt(commandsPerNpcInput.value);
        let nbt_name = nbtTitleInput.value.trim();
        let file_name;
        if (nbt_name === "") {
            file_name = "NiftyBuildingTool_Output.txt";
            nbt_name = "Unnamed Build"
        } else {
            // Clean up file name to be safer for file systems
            file_name = "NiftyBuildingTool_" + nbt_name.replace(/[^a-zA-Z0-9_\-]/g, "") + ".txt";
             // No change to nbt_name here yet, cleaning done in getBlockOpener/getNPCOpener
        }
        if (isNaN(commands_per_npc) || commands_per_npc <= 0) {
            commands_per_npc = 346;
             if (commandsPerNpcInput) commandsPerNpcInput.value = 346; // Update the input field too if it exists
        }

        let curSec = 0;
        // Cleaning for NBT string content happens inside these opener functions now
        let NBTdata = getBlockOpener(nbt_name);
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

            NBTdata += getNPCOpener(curSec, nbt_name); // Pass original nbt_name, clean inside opener
            NBTdata += NPCCommandList.map(x => commandToNBT(x.trim())).join(",");
            NBTdata += getNPCCloser();

            if (curSec < NPCCount) {
              NBTdata += ",";
            }
        }
        NBTdata += getBlockCloser();

         nbtStatusMessage.textContent = 'Download starting...';
        // Using the shared download function
        download(file_name, NBTdata);

         nbtStatusMessage.textContent = `Successfully generated and downloaded ${file_name}.`;
    }).catch(error => {
         console.error("Error processing file:", error);
         nbtStatusMessage.textContent = 'Error processing file. Check console (F12) for details.';
     });
}

// Read a whole file (Used by NBT Tool)
function readFileContent(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    })
}

// Find relevant commands (Used by NBT Tool)
function getUsefulCommands(content) {
    return content.split('\n').map(x => x.replace(/^\s*\//, "").trim()).filter(x => {
        return x.length > 0 && (x.startsWith("setblock") || x.startsWith("fill") || x.startsWith("summon"));
    });
}

// NBT Helper Functions (from provided code, used by NBT Tool)
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
// This function is used by both tools
function download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
}