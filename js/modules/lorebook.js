// ============================================
// MODULE: LOREBOOK
// Hierarchical Keyword Database
// ============================================

import { escapeForScript, updateTokenMeter } from '../utils.js';

/**
 * Flash validation feedback on elements.
 * @param {HTMLElement} element - Element to flash
 * @param {string} type - 'green' for success, 'red' for error
 */
function flashFeedback(element, type) {
  element.classList.remove('flash-green', 'flash-red');
  // Trigger reflow to restart animation
  void element.offsetWidth;
  element.classList.add('flash-' + type);
  setTimeout(function() {
    element.classList.remove('flash-' + type);
  }, 600);
}

/**
 * Add a new lore entry to the UI.
 */
export function addLoreEntry() {
  var container = document.getElementById('loreEntries');

  // Check if the last entry is empty (validation)
  var existingItems = container.querySelectorAll('.dynamic-item');
  if (existingItems.length > 0) {
    var lastItem = existingItems[existingItems.length - 1];
    var lastKeywords = lastItem.querySelector('input').value.trim();
    var lastContent = lastItem.querySelector('textarea').value.trim();

    if (!lastKeywords && !lastContent) {
      // Flash empty fields red
      flashFeedback(lastItem.querySelector('input'), 'red');
      flashFeedback(lastItem.querySelector('textarea'), 'red');
      return; // Don't add new entry
    }
  }

  var item = document.createElement('div');
  item.className = 'dynamic-item';
  item.innerHTML = '<select style="width:120px;"><option value="people">People</option><option value="places">Places</option><option value="objects">Objects</option><option value="moods">Moods</option><option value="events">Events</option></select><input type="text" placeholder="Keywords (comma-separated)" style="flex:1;" /><textarea placeholder="Lore content to inject..." style="flex:2;"></textarea><button type="button" class="remove-entry-btn">Remove</button>';

  // Add event listener for remove button
  item.querySelector('.remove-entry-btn').addEventListener('click', function() {
    this.parentElement.remove();
  });

  container.appendChild(item);

  // Flash the newly added item green
  flashFeedback(item, 'green');
}

/**
 * Build the lorebook script.
 * @param {boolean} standalone - Whether to include initContext function
 * @returns {string} - The generated script
 */
export function buildLorebookScript(standalone) {
  var padded = document.getElementById('lorePadded').checked;
  var breakEarly = document.getElementById('loreBreakEarly').checked;
  var debugMode = document.getElementById('debugMode').checked;

  var entries = document.querySelectorAll('#loreEntries .dynamic-item');
  var lorebook = {
    people: [],
    places: [],
    objects: [],
    moods: [],
    events: []
  };

  entries.forEach(function(entry) {
    var category = entry.querySelector('select').value;
    var keywords = entry.querySelector('input').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
    var content = entry.querySelector('textarea').value.trim();

    if (keywords.length > 0 && content) {
      lorebook[category].push({
        keywords: keywords,
        content: content
      });
    }
  });

  var script = "// ============================================\n";
  script += "// MODULE: LOREBOOK\n";
  script += "// ============================================\n\n";

  // Check for any valid configuration
  var hasEntries = lorebook.people.length > 0 || lorebook.places.length > 0 ||
                   lorebook.objects.length > 0 || lorebook.moods.length > 0 ||
                   lorebook.events.length > 0;

  if (!hasEntries) {
    script += "// (No lorebook entries configured — this module currently does nothing.)\n";
    return script;
  }

  // Only include initContext if standalone
  if (standalone) {
    script += "// Init function for standalone use\n";
    script += "function initContext() {\n";
    script += "  if (!context.character) context.character = {};\n";
    script += "  if (!context.character.personality) context.character.personality = \"\";\n";
    script += "  if (!context.character.scenario) context.character.scenario = \"\";\n";
    script += "}\n";
    script += "initContext();\n\n";
  }

  // Get message safely
  script += "// Get last user message safely\n";
  script += "var message = (context.chat && context.chat.last_message) ? context.chat.last_message : \"\";\n\n";

  script += "var lorebook = " + JSON.stringify(lorebook, null, 2) + ";\n\n";

  if (padded) {
    script += "var padded = ' ' + message.toLowerCase() + ' ';\n";
  } else {
    script += "var msgLower = message.toLowerCase();\n";
  }

  script += "var loreTriggered = false;\n";
  script += "var found = false;\n\n";

  script += "// Lorebook lookup with " + (breakEarly ? "break-early" : "multi-match") + " and deduplication\n";
  script += "for (var category in lorebook) {\n";
  script += "  var entries = lorebook[category];\n";
  script += "  for (var i = 0; i < entries.length && !found; i++) {\n";
  script += "    var entry = entries[i];\n";
  script += "    for (var k = 0; k < entry.keywords.length; k++) {\n";
  if (padded) {
    script += "      if (padded.indexOf(' ' + entry.keywords[k] + ' ') !== -1) {\n";
  } else {
    script += "      if (msgLower.indexOf(entry.keywords[k]) !== -1) {\n";
  }
  script += "        // Dedupe: only add if not already present\n";
  script += "        if (context.character.scenario.indexOf(entry.content) === -1) {\n";
  script += "          context.character.scenario += '\\n' + entry.content;\n";
  script += "          loreTriggered = true;\n";
  script += "        }\n";
  if (breakEarly) {
    script += "        found = true;\n";
  }
  script += "        break;\n";
  script += "      }\n";
  script += "    }\n";
  if (breakEarly) {
    script += "    if (found) break;\n";
  }
  script += "  }\n";
  if (breakEarly) {
    script += "  if (found) break;\n";
  }
  script += "}\n\n";

  if (debugMode) {
    script += "if (loreTriggered) {\n";
    script += "  context.character.scenario += '\\n(debug: lorebook fired)';\n";
    script += "}\n";
  }

  return script;
}

/**
 * Generate and display the lorebook script.
 */
export function generateLorebookScript() {
  var script = buildLorebookScript(true);
  document.getElementById('lorebookOutput').textContent = script;
  updateTokenMeter();
}
