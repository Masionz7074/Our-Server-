document.addEventListener('DOMContentLoaded', () => {
    const originalCodeTextarea = document.getElementById('originalCode');
    const obfuscatedCodeTextarea = document.getElementById('obfuscatedCode');
    const obfuscateButton = document.getElementById('obfuscateButton');

    // Check if the obfuscator library is available
    if (typeof JavaScriptObfuscator === 'undefined') {
        console.error("JavaScriptObfuscator library not found. Make sure javascript-obfuscator.js is in the js/ folder and loaded correctly.");
        obfuscatedCodeTextarea.value = "Error: Obfuscator library not loaded. See console for details.";
        obfuscateButton.disabled = true;
        obfuscateButton.textContent = "Library Error";
        return;
    }

    obfuscateButton.addEventListener('click', () => {
        const originalCode = originalCodeTextarea.value;

        if (originalCode.trim() === '') {
            obfuscatedCodeTextarea.value = "Paste code into the 'Original Code' area first.";
            return;
        }

        // --- Obfuscator Options for Bedrock Compatibility ---
        // These options are chosen to be strong but avoid features
        // that might be problematic in the Bedrock Script API environment.
        // ALWAYS TEST the output in Bedrock!
        const obfuscationOptions = {
            compact: true, // Recommended: Removes extra spaces and line breaks
            controlFlowFlattening: true, // Strong obfuscation: Makes control flow hard to follow
            controlFlowFlatteningThreshold: 0.75, // Apply to 75% of code blocks
            deadCodeInjection: true, // Adds confusing dead code
            deadCodeInjectionThreshold: 0.4, // Inject into 40% of code
            disableConsoleOutput: false, // DISABLED for compatibility: Bedrock's console handling can be specific. Keeping this false is safer.
            identifierNamesGenerator: 'hexadecimal', // Renames variables/functions to hex strings (e.g., _0x123abc) - Good obfuscation
            log: false, // Don't log obfuscator process to console
            numbersToExpressions: true, // Converts number literals (e.g., 10 -> (5+5)) - Generally safe
            renameGlobals: false, // DISABLED - CRITICAL for Bedrock API: Renaming globals will break access to 'world', 'system', imported modules (@minecraft/server, etc.). MUST BE FALSE.
            selfDefending: true, // Makes the code harder to reformat or debug - Good for protection
            simplify: true, // Simplifies expressions - Generally safe
            splitStrings: true, // Splits strings into small chunks
            splitStringsThreshold: 0.75, // Apply to 75% of strings
            stringArray: true, // Moves string literals into an array
            stringArrayEncoding: ['base64', 'rc4'], // Encodes strings in the array - Adds complexity (requires base64 and rc4 codecs which are part of the library)
            stringArrayThreshold: 0.75, // Apply to 75% of strings
            unicodeEscapeSequence: true, // Replaces characters with unicode escape sequences (\uXXXX) - Makes code harder to read directly
        };

        try {
            // Perform the obfuscation using the chosen options
            const obfuscatedCode = JavaScriptObfuscator.obfuscate(
                originalCode,
                obfuscationOptions
            ).getObfuscatedCode();

            // Display the result
            obfuscatedCodeTextarea.value = obfuscatedCode;

        } catch (error) {
            console.error("Obfuscation failed:", error);
            obfuscatedCodeTextarea.value = "Error during obfuscation: " + error.message;
        }
    });
});