// ============================================
// MODULE: PACING SYSTEM
// Message Count Gates
// ============================================

import { escapeForScript, updateTokenMeter, flashFeedback, setupAutoExpand } from '../utils.js';

/**
 * Add a new pacing phase to the UI.
 * Smart Card Layout:
 * - Header: Min Messages, Max Messages
 * - Body: Scenario Add-on (Auto-expand Textarea)
 */
export function addPacingPhase() {
  var container = document.getElementById('pacingPhases');

  // Check if the last entry is empty (validation)
  var existingItems = container.querySelectorAll('.janitor-card-entry');
  if (existingItems.length > 0) {
    var lastItem = existingItems[existingItems.length - 1];
    var inputs = lastItem.querySelectorAll('input[type="number"]');
    var lastMin = inputs[0].value.trim();
    var lastMax = inputs[1].value.trim();
    var lastContent = lastItem.querySelector('textarea').value.trim();

    if (!lastMin && !lastMax && !lastContent) {
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
        '<label>Min Messages</label>' +
        '<input type="number" class="janitor-input compact-input" placeholder="Min" min="1">' +
      '</div>' +
      '<div class="meta-group" style="flex:0 0 120px;">' +
        '<label>Max Messages</label>' +
        '<input type="number" class="janitor-input compact-input" placeholder="Max" min="1">' +
      '</div>' +
      '<button type="button" class="btn-remove-icon" title="Remove Entry">✕</button>' +
    '</div>' +
    '<div class="card-body-row">' +
      '<label>Scenario Add-on</label>' +
      '<textarea class="janitor-input auto-expand-content" placeholder="Scenario add-on for this message count phase..."></textarea>' +
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
 * Add a new one-time event to the UI.
 * Smart Card Layout:
 * - Header: Exact Message #
 * - Body: Event Content (Auto-expand Textarea)
 */
export function addOneTimeEvent() {
  var container = document.getElementById('oneTimeEvents');

  // Check if the last entry is empty (validation)
  var existingItems = container.querySelectorAll('.janitor-card-entry');
  if (existingItems.length > 0) {
    var lastItem = existingItems[existingItems.length - 1];
    var lastExact = lastItem.querySelector('input[type="number"]').value.trim();
    var lastContent = lastItem.querySelector('textarea').value.trim();

    if (!lastExact && !lastContent) {
      flashFeedback(lastItem.querySelector('input[type="number"]'), 'red');
      flashFeedback(lastItem.querySelector('textarea'), 'red');
      return;
    }
  }

  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML =
    '<div class="card-header-row">' +
      '<div class="meta-group" style="flex:0 0 140px;">' +
        '<label>Exact Message #</label>' +
        '<input type="number" class="janitor-input compact-input" placeholder="Message #" min="1">' +
      '</div>' +
      '<button type="button" class="btn-remove-icon" title="Remove Entry">✕</button>' +
    '</div>' +
    '<div class="card-body-row">' +
      '<label>Event Content</label>' +
      '<textarea class="janitor-input auto-expand-content" placeholder="One-time event content to inject at this message number..."></textarea>' +
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
 * Build the pacing script.
 * @param {boolean} standalone - Whether to include initContext function
 * @returns {string} - The generated script
 */
export function buildPacingScript(standalone) {
  var phases = document.querySelectorAll('#pacingPhases .janitor-card-entry');
  var events = document.querySelectorAll('#oneTimeEvents .janitor-card-entry');
  var debugMode = document.getElementById('debugMode').checked;

  var script = "// ============================================\n";
  script += "// MODULE: PACING\n";
  script += "// ============================================\n\n";

  // Check for any valid configuration
  var hasPhases = false;
  var hasEvents = false;

  phases.forEach(function(phase) {
    var inputs = phase.querySelectorAll('input[type="number"]');
    var min = parseInt(inputs[0].value, 10);
    var max = parseInt(inputs[1].value, 10);
    var content = phase.querySelector('textarea').value.trim();
    if (!isNaN(min) && !isNaN(max) && content) {
      hasPhases = true;
    }
  });

  events.forEach(function(event) {
    var exact = parseInt(event.querySelector('input[type="number"]').value, 10);
    var content = event.querySelector('textarea').value.trim();
    if (!isNaN(exact) && content) {
      hasEvents = true;
    }
  });

  if (!hasPhases && !hasEvents) {
    script += "// (No pacing phases or events configured — this module currently does nothing.)\n";
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

    // Add message_count alias for standalone mode
    script += "// Safe message counter alias for pacing module\n";
    script += "var message_count = (context.chat && typeof context.chat.message_count === 'number')\n";
    script += "  ? context.chat.message_count\n";
    script += "  : 0;\n\n";
  }

  script += "var count = message_count;\n";
  script += "var pacingSet = false;\n\n";

  // Phases
  if (hasPhases) {
    script += "// Message Count Phases\n";
    phases.forEach(function(phase) {
      var inputs = phase.querySelectorAll('input[type="number"]');
      var min = parseInt(inputs[0].value, 10);
      var max = parseInt(inputs[1].value, 10);
      var content = phase.querySelector('textarea').value.trim();

      if (!isNaN(min) && !isNaN(max) && content) {
        script += "if (count >= " + min + " && count <= " + max + ") {\n";
        script += "  context.character.scenario += '\\n" + escapeForScript(content) + "';\n";
        script += "  pacingSet = true;\n";
        script += "}\n";
      }
    });
    script += "\n";
  }

  // One-time events
  if (hasEvents) {
    script += "// One-Time Events\n";
    events.forEach(function(event) {
      var exact = parseInt(event.querySelector('input[type="number"]').value, 10);
      var content = event.querySelector('textarea').value.trim();

      if (!isNaN(exact) && content) {
        script += "if (count === " + exact + ") {\n";
        script += "  context.character.scenario += '\\n" + escapeForScript(content) + "';\n";
        script += "  pacingSet = true;\n";
        script += "}\n";
      }
    });
  }

  if (debugMode) {
    script += "\nif (pacingSet) {\n";
    script += "  context.character.scenario += '\\n(debug: pacing fired, message_count=' + count + ')';\n";
    script += "}\n";
  }

  return script;
}

/**
 * Generate and display the pacing script.
 */
export function generatePacingScript() {
  var script = buildPacingScript(true);
  document.getElementById('pacingOutput').textContent = script;
  updateTokenMeter();
}
