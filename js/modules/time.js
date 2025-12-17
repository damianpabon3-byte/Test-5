// ============================================
// MODULE: TIME & ENVIRONMENT
// Hour-based behavior changes
// ============================================

import { escapeForScript, generateHourInRangeFunction, updateTokenMeter } from '../utils.js';

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
 * Add a new time slot to the UI.
 */
export function addTimeSlot() {
  var container = document.getElementById('timeSlots');

  // Check if the last entry is empty (validation)
  var existingItems = container.querySelectorAll('.dynamic-item');
  if (existingItems.length > 0) {
    var lastItem = existingItems[existingItems.length - 1];
    var inputs = lastItem.querySelectorAll('input');
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
  item.className = 'dynamic-item';
  item.innerHTML = '<input type="number" placeholder="Start hour (0-23)" min="0" max="23" style="width:120px;" /><input type="number" placeholder="End hour (0-23)" min="0" max="23" style="width:120px;" /><textarea placeholder="Scenario add-on for this time range..." style="flex:1;"></textarea><button type="button" class="remove-entry-btn">Remove</button>';

  // Add event listener for remove button
  item.querySelector('.remove-entry-btn').addEventListener('click', function() {
    this.parentElement.remove();
  });

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
  var slots = document.querySelectorAll('#timeSlots .dynamic-item');

  var script = "// ============================================\n";
  script += "// MODULE: TIME & ENVIRONMENT\n";
  script += "// ============================================\n\n";

  // Check for any valid configuration
  var hasSlots = false;
  slots.forEach(function(slot) {
    var start = parseInt(slot.querySelectorAll('input')[0].value, 10);
    var end = parseInt(slot.querySelectorAll('input')[1].value, 10);
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
    var start = parseInt(slot.querySelectorAll('input')[0].value, 10);
    var end = parseInt(slot.querySelectorAll('input')[1].value, 10);
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
