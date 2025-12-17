// ============================================
// MODULE: TIME & ENVIRONMENT
// Hour-based behavior changes
// ============================================

import { escapeForScript, generateHourInRangeFunction, updateTokenMeter, flashFeedback, setupAutoExpand } from '../utils.js';

/**
 * Add a new time slot to the UI.
 * Smart Card Layout:
 * - Header: Start Hour, End Hour
 * - Body: Scenario Add-on (Auto-expand Textarea)
 */
export function addTimeSlot() {
  var container = document.getElementById('timeSlots');

  // Check if the last entry is empty (validation)
  var existingItems = container.querySelectorAll('.janitor-card-entry');
  if (existingItems.length > 0) {
    var lastItem = existingItems[existingItems.length - 1];
    var inputs = lastItem.querySelectorAll('input[type="number"]');
    var lastStart = inputs[0].value.trim();
    var lastEnd = inputs[1].value.trim();
    var lastContent = lastItem.querySelector('textarea').value.trim();

    if (!lastStart && !lastEnd && !lastContent) {
      flashFeedback(inputs[0], 'red');
      flashFeedback(inputs[1], 'red');
      flashFeedback(lastItem.querySelector('textarea'), 'red');
      return;
    }
  }

  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML =
    '<div class="card-header-row">' +
      '<div class="meta-group" style="flex:0 0 120px;">' +
        '<label>Start Hour</label>' +
        '<input type="number" class="janitor-input compact-input" placeholder="0-23" min="0" max="23">' +
      '</div>' +
      '<div class="meta-group" style="flex:0 0 120px;">' +
        '<label>End Hour</label>' +
        '<input type="number" class="janitor-input compact-input" placeholder="0-23" min="0" max="23">' +
      '</div>' +
      '<button type="button" class="btn-remove-icon" title="Remove Entry">✕</button>' +
    '</div>' +
    '<div class="card-body-row">' +
      '<label>Scenario Add-on</label>' +
      '<textarea class="janitor-input auto-expand-content" placeholder="Scenario add-on for this time range..."></textarea>' +
    '</div>';

  // Add event listener for remove button
  item.querySelector('.btn-remove-icon').addEventListener('click', function() {
    this.closest('.janitor-card-entry').remove();
  });

  // Setup auto-expand for the textarea
  setupAutoExpand(item.querySelector('.auto-expand-content'));

  container.appendChild(item);
  flashFeedback(item, 'green');
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
    var inputs = slot.querySelectorAll('input[type="number"]');
    var start = parseInt(inputs[0].value, 10);
    var end = parseInt(inputs[1].value, 10);
    var content = slot.querySelector('textarea').value.trim();
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
    var inputs = slot.querySelectorAll('input[type="number"]');
    var start = parseInt(inputs[0].value, 10);
    var end = parseInt(inputs[1].value, 10);
    var content = slot.querySelector('textarea').value.trim();

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
