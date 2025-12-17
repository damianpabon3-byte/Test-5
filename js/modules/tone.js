// ============================================
// MODULE: TONE/STATE ENGINE
// Dynamic personality shifts based on keywords
// ============================================

import { escapeForScript, updateTokenMeter } from '../utils.js';

/**
 * Add a new tone trigger to the UI.
 */
export function addToneTrigger() {
  var container = document.getElementById('toneTriggers');
  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML = `
    <div class="card-header-grid">
      <div class="meta-field">
        <label>Keywords</label>
        <input type="text" class="janitor-input" placeholder="Keywords (comma-separated)" />
      </div>
      <button class="btn-remove-icon" title="Remove">✕</button>
    </div>
    <div class="card-body">
      <label>Content</label>
      <p class="field-subtext">Example: {{char}} speaks in short, angry sentences.</p>
      <textarea class="janitor-input auto-expand" placeholder="Personality add-on when triggered..."></textarea>
    </div>
  `;

  // Add event listener for remove button
  item.querySelector('.btn-remove-icon').addEventListener('click', function() {
    this.closest('.janitor-card-entry').remove();
  });

  container.appendChild(item);
}

/**
 * Build the tone/state engine script.
 * @param {boolean} standalone - Whether to include initContext function
 * @returns {string} - The generated script
 */
export function buildToneScript(standalone) {
  var padded = document.getElementById('tonePadded').checked;
  var debugMode = document.getElementById('debugMode').checked;
  var triggers = document.querySelectorAll('#toneTriggers .janitor-card-entry');

  var script = "// ============================================\n";
  script += "// MODULE: TONE/STATE ENGINE\n";
  script += "// ============================================\n\n";

  // Check for any valid configuration
  var hasTriggers = false;
  triggers.forEach(function(trigger) {
    var keywords = trigger.querySelector('.card-header-grid input').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
    var content = trigger.querySelector('.card-body textarea').value.trim();
    if (keywords.length > 0 && content) {
      hasTriggers = true;
    }
  });

  if (!hasTriggers) {
    script += "// (No tone triggers configured — this module currently does nothing.)\n";
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

  if (padded) {
    script += "var padded = ' ' + message.toLowerCase() + ' ';\n";
  } else {
    script += "var msgLower = message.toLowerCase();\n";
  }

  script += "var toneSet = false;\n\n";

  triggers.forEach(function(trigger) {
    var keywords = trigger.querySelector('.card-header-grid input').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
    var content = trigger.querySelector('.card-body textarea').value.trim();

    if (keywords.length > 0 && content) {
      script += "// Tone Trigger: " + keywords.join(', ') + "\n";
      keywords.forEach(function(keyword) {
        if (padded) {
          script += "if (padded.indexOf(' " + escapeForScript(keyword) + " ') !== -1) {\n";
        } else {
          script += "if (msgLower.indexOf('" + escapeForScript(keyword) + "') !== -1) {\n";
        }
        script += "  context.character.personality += '\\n" + escapeForScript(content) + "';\n";
        script += "  toneSet = true;\n";
        script += "}\n";
      });
      script += "\n";
    }
  });

  if (debugMode) {
    script += "if (toneSet) {\n";
    script += "  context.character.scenario += '\\n(debug: tone engine fired)';\n";
    script += "}\n";
  }

  return script;
}

/**
 * Generate and display the tone script.
 */
export function generateToneScript() {
  var script = buildToneScript(true);
  document.getElementById('toneOutput').textContent = script;
  updateTokenMeter();
}
