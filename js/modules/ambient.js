// ============================================
// MODULE: AMBIENT EVENTS
// Random Flavor Text
// ============================================

import { updateTokenMeter, flashFeedback, setupAutoExpand } from '../utils.js';

/**
 * Add a new ambient event to the UI.
 * Smart Card Layout:
 * - Header: Trigger Probability %
 * - Body: Ambient Event Description (Auto-expand Textarea)
 */
export function addAmbientEvent() {
  var container = document.getElementById('ambientEvents');

  // Check if the last entry is empty (validation)
  var existingItems = container.querySelectorAll('.janitor-card-entry');
  if (existingItems.length > 0) {
    var lastItem = existingItems[existingItems.length - 1];
    var lastContent = lastItem.querySelector('textarea').value.trim();

    if (!lastContent) {
      flashFeedback(lastItem.querySelector('textarea'), 'red');
      return;
    }
  }

  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML =
    '<div class="card-header-row">' +
      '<div class="meta-group" style="flex:0 0 150px;">' +
        '<label>Trigger Probability %</label>' +
        '<input type="number" class="janitor-input compact-input" placeholder="%" min="1" max="100" value="10">' +
      '</div>' +
      '<button type="button" class="btn-remove-icon" title="Remove Entry">✕</button>' +
    '</div>' +
    '<div class="card-body-row">' +
      '<label>Ambient Event Description</label>' +
      '<textarea class="janitor-input auto-expand-content" placeholder="Ambient event description to randomly inject..."></textarea>' +
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
 * Build the ambient events script.
 * @param {boolean} standalone - Whether to include initContext function
 * @returns {string} - The generated script
 */
export function buildAmbientScript(standalone) {
  var globalProbability = parseInt(document.getElementById('ambientProbability').value, 10) || 10;
  var events = document.querySelectorAll('#ambientEvents .janitor-card-entry');
  var debugMode = document.getElementById('debugMode').checked;

  var eventList = [];
  events.forEach(function(event) {
    var content = event.querySelector('textarea').value.trim();
    var probabilityInput = event.querySelector('input[type="number"]');
    var probability = probabilityInput ? (parseInt(probabilityInput.value, 10) || globalProbability) : globalProbability;
    if (content) {
      eventList.push({ content: content, probability: probability });
    }
  });

  var script = "// ============================================\n";
  script += "// MODULE: AMBIENT EVENTS\n";
  script += "// ============================================\n\n";

  // Check for any valid configuration
  if (eventList.length === 0) {
    script += "// (No ambient events configured — this module currently does nothing.)\n";
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

  script += "var ambientEvents = " + JSON.stringify(eventList, null, 2) + ";\n\n";

  script += "var roll = Math.floor(Math.random() * 100) + 1;\n\n";

  script += "// Check each ambient event with its own probability\n";
  script += "for (var i = 0; i < ambientEvents.length; i++) {\n";
  script += "  if (roll <= ambientEvents[i].probability) {\n";
  script += "    context.character.scenario += '\\n' + ambientEvents[i].content;\n";
  if (debugMode) {
    script += "    context.character.scenario += '\\n(debug: ambient event fired)';\n";
  }
  script += "    break; // Only fire one ambient event per turn\n";
  script += "  }\n";
  script += "}\n";

  return script;
}

/**
 * Generate and display the ambient script.
 */
export function generateAmbientScript() {
  var script = buildAmbientScript(true);
  document.getElementById('ambientOutput').textContent = script;
  updateTokenMeter();
}
