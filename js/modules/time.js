// ============================================
// MODULE: TIME & ENVIRONMENT
// Hour-based behavior changes
// ============================================

import { escapeForScript, generateHourInRangeFunction, updateTokenMeter, initAutoExpand } from '../utils.js';

/**
 * Add a new time slot to the UI.
 */
export function addTimeSlot() {
  var container = document.getElementById('timeSlots');
  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML = `
    <div class="card-header-grid multi-field">
      <div class="meta-field">
        <label>Start Hour (0-23)</label>
        <input type="number" class="janitor-input" placeholder="Start" min="0" max="23" />
      </div>
      <div class="meta-field">
        <label>End Hour (0-23)</label>
        <input type="number" class="janitor-input" placeholder="End" min="0" max="23" />
      </div>
      <button class="btn-remove-icon" title="Remove">✕</button>
    </div>
    <div class="card-body">
      <label>Content</label>
      <p class="field-subtext">Example: The sun sets, casting long shadows...</p>
      <textarea class="janitor-input auto-expand" placeholder="Scenario add-on for this time range..."></textarea>
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
 * Build the time & environment script.
 * @param {boolean} standalone - Whether to include initContext function
 * @returns {string} - The generated script
 */
export function buildTimeScript(standalone) {
  var offset = parseInt(document.getElementById('timeOffset').value, 10) || 0;
  var debugMode = document.getElementById('debugMode').checked;
  var slots = document.querySelectorAll('#timeSlots .janitor-card-entry');

  var script = "// ============================================\n";
  script += "// MODULE: TIME & ENVIRONMENT\n";
  script += "// ============================================\n\n";

  // Check for any valid configuration
  var hasSlots = false;
  slots.forEach(function(slot) {
    var inputs = slot.querySelectorAll('.card-header-grid input');
    var start = parseInt(inputs[0].value, 10);
    var end = parseInt(inputs[1].value, 10);
    var content = slot.querySelector('.card-body textarea').value.trim();
    if (!isNaN(start) && !isNaN(end) && content) {
      hasSlots = true;
    }
  });

  if (!hasSlots) {
    script += "// (No time slots configured — this module currently does nothing.)\n";
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

  // Add hourInRange function for wrap-around support
  script += generateHourInRangeFunction();

  script += "var offset = " + offset + ";\n";
  script += "var hour = (new Date().getHours() + offset + 24) % 24;\n";
  script += "var timeSet = false;\n\n";

  slots.forEach(function(slot) {
    var inputs = slot.querySelectorAll('.card-header-grid input');
    var start = parseInt(inputs[0].value, 10);
    var end = parseInt(inputs[1].value, 10);
    var content = slot.querySelector('.card-body textarea').value.trim();

    if (!isNaN(start) && !isNaN(end) && content) {
      script += "if (hourInRange(hour, " + start + ", " + end + ")) {\n";
      script += "  context.character.scenario += '\\n" + escapeForScript(content) + "';\n";
      script += "  timeSet = true;\n";
      script += "}\n";
    }
  });

  if (debugMode) {
    script += "\nif (timeSet) {\n";
    script += "  context.character.scenario += '\\n(debug: time module fired, hour=' + hour + ')';\n";
    script += "}\n";
  }

  return script;
}

/**
 * Generate and display the time script.
 */
export function generateTimeScript() {
  var script = buildTimeScript(true);
  document.getElementById('timeOutput').textContent = script;
  updateTokenMeter();
}
