// ============================================
// MODULE: TONE/STATE ENGINE
// Dynamic personality shifts based on keywords
// ============================================

import { escapeForScript, updateTokenMeter } from '../utils.js';

/**
 * Flash validation feedback on elements.
 * @param {HTMLElement} element - Element to flash
 * @param {string} type - 'green' for success, 'red' for error
 */
function flashFeedback(element, type) {
  element.classList.remove('flash-green', 'flash-red');
  void element.offsetWidth;
  element.classList.add('flash-' + type);
  setTimeout(function() {
    element.classList.remove('flash-' + type);
  }, 600);
}

/**
 * Add a new tone trigger to the UI.
 */
export function addToneTrigger() {
  var container = document.getElementById('toneTriggers');

  // Check if the last entry is empty (validation)
  var existingItems = container.querySelectorAll('.dynamic-item');
  if (existingItems.length > 0) {
    var lastItem = existingItems[existingItems.length - 1];
    var lastKeywords = lastItem.querySelector('input').value.trim();
    var lastContent = lastItem.querySelector('textarea').value.trim();

    if (!lastKeywords && !lastContent) {
      flashFeedback(lastItem.querySelector('input'), 'red');
      flashFeedback(lastItem.querySelector('textarea'), 'red');
      return;
    }
  }

  var item = document.createElement('div');
  item.className = 'dynamic-item';
  item.innerHTML = '<input type="text" placeholder="Keywords (comma-separated)" style="flex:1;" /><textarea placeholder="Personality add-on when triggered..." style="flex:1;"></textarea><button type="button" class="remove-entry-btn">Remove</button>';

  // Add event listener for remove button
  item.querySelector('.remove-entry-btn').addEventListener('click', function() {
    this.parentElement.remove();
  });

  container.appendChild(item);
  flashFeedback(item, 'green');
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
