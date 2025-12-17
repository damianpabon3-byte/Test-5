// ============================================
// MODULE: RANDOM EVENTS
// Weighted Reactions
// ============================================

import { escapeForScript, updateTokenMeter } from '../utils.js';

/**
 * Add a new random event to the UI.
 */
export function addRandomEvent() {
  var container = document.getElementById('randomEvents');
  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML = `
    <div class="card-header-grid">
      <div class="meta-field">
        <label>Trigger Phrase</label>
        <input type="text" class="janitor-input" placeholder="Trigger phrase" />
      </div>
      <button class="btn-remove-icon" title="Remove">✕</button>
    </div>
    <div class="card-body">
      <label>Content</label>
      <p class="field-subtext">Example: I agree|I disagree|Maybe (Pipe separated)</p>
      <textarea class="janitor-input auto-expand" placeholder="Responses (pipe-separated: option1|option2|option3)"></textarea>
    </div>
  `;

  // Add event listener for remove button
  item.querySelector('.btn-remove-icon').addEventListener('click', function() {
    this.closest('.janitor-card-entry').remove();
  });

  container.appendChild(item);
}

/**
 * Build the random events script.
 * @param {boolean} standalone - Whether to include initContext function
 * @returns {string} - The generated script
 */
export function buildRandomScript(standalone) {
  var events = document.querySelectorAll('#randomEvents .janitor-card-entry');
  var debugMode = document.getElementById('debugMode').checked;

  var script = "// ============================================\n";
  script += "// MODULE: RANDOM EVENTS\n";
  script += "// ============================================\n\n";

  // Check for any valid configuration
  var hasEvents = false;
  events.forEach(function(event) {
    var trigger = event.querySelector('.card-header-grid input').value.trim().toLowerCase();
    var responses = event.querySelector('.card-body textarea').value.split('|').map(function(r) { return r.trim(); }).filter(Boolean);
    if (trigger && responses.length > 0) {
      hasEvents = true;
    }
  });

  if (!hasEvents) {
    script += "// (No random events configured — this module currently does nothing.)\n";
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
  script += "var message = (context.chat && context.chat.last_message) ? context.chat.last_message : \"\";\n";
  script += "var msgLower = message.toLowerCase();\n";
  script += "var randomFired = false;\n\n";

  events.forEach(function(event) {
    var trigger = event.querySelector('.card-header-grid input').value.trim().toLowerCase();
    var responses = event.querySelector('.card-body textarea').value.split('|').map(function(r) { return r.trim(); }).filter(Boolean);

    if (trigger && responses.length > 0) {
      script += "// Random Event: " + trigger + "\n";
      script += "if (msgLower.indexOf('" + escapeForScript(trigger) + "') !== -1) {\n";
      script += "  var responses = " + JSON.stringify(responses) + ";\n";
      script += "  var randomResponse = responses[Math.floor(Math.random() * responses.length)];\n";
      script += "  context.character.personality += '\\n' + randomResponse;\n";
      script += "  randomFired = true;\n";
      script += "}\n\n";
    }
  });

  if (debugMode) {
    script += "if (randomFired) {\n";
    script += "  context.character.scenario += '\\n(debug: random event fired)';\n";
    script += "}\n";
  }

  return script;
}

/**
 * Generate and display the random events script.
 */
export function generateRandomScript() {
  var script = buildRandomScript(true);
  document.getElementById('randomOutput').textContent = script;
  updateTokenMeter();
}
