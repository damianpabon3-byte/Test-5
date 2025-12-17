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
  item.className = 'dynamic-item';
  item.innerHTML = '<input type="text" placeholder="Keywords (comma-separated)" style="flex:1;" /><textarea placeholder="Personality add-on when triggered..." style="flex:1;"></textarea><button type="button" class="remove-entry-btn">Remove</button>';

  // Add event listener for remove button
  item.querySelector('.remove-entry-btn').addEventListener('click', function() {
    this.parentElement.remove();
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
  var triggers = document.querySelectorAll('#toneTriggers .dynamic-item');

  var script = "// ============================================\n";
  script += "// MODULE: TONE/STATE ENGINE\n";
  script += "// ============================================\n\n";

  // Check for any valid configuration
  var hasTriggers = false;
  triggers.forEach(function(trigger) {
    var keywords = trigger.querySelector('input').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
    var content = trigger.querySelector('textarea').value.trim();
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
    var keywords = trigger.querySelector('input').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
    var content = trigger.querySelector('textarea').value.trim();

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
