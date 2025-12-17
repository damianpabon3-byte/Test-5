// ============================================
// MODULE: LOREBOOK
// Hierarchical Keyword Database
// ============================================

import { escapeForScript, updateTokenMeter, initAutoExpand } from '../utils.js';

/**
 * Add a new lore entry to the UI.
 */
export function addLoreEntry() {
  var container = document.getElementById('loreEntries');
  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML = `
    <div class="card-header-grid">
      <div class="meta-field">
        <label>Type</label>
        <select class="janitor-input">
          <option value="people">People</option>
          <option value="places">Places</option>
          <option value="objects">Objects</option>
          <option value="moods">Moods</option>
          <option value="events">Events</option>
        </select>
      </div>
      <button class="btn-remove-icon" title="Remove">✕</button>
    </div>
    <div class="card-keywords">
      <label>Keywords</label>
      <input type="text" class="janitor-input" placeholder="Keywords (comma-separated)" />
    </div>
    <div class="card-body">
      <label>Content</label>
      <p class="field-subtext">Example: The Golden Inn is a rowdy tavern located in...</p>
      <textarea class="janitor-input auto-expand" placeholder="Lore content to inject..."></textarea>
    </div>
  `;

  // Add event listener for remove button
  item.querySelector('.btn-remove-icon').addEventListener('click', function() {
    this.closest('.janitor-card-entry').remove();
  });

  container.appendChild(item);

  // Initialize auto-expand on the textarea
  initAutoExpand(item.querySelector('.card-body textarea'));
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

  var entries = document.querySelectorAll('#loreEntries .janitor-card-entry');
  var lorebook = {
    people: [],
    places: [],
    objects: [],
    moods: [],
    events: []
  };

  entries.forEach(function(entry) {
    var category = entry.querySelector('select').value;
    var keywords = entry.querySelector('.card-keywords input').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
    var content = entry.querySelector('.card-body textarea').value.trim();

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
