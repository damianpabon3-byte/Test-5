// ============================================
// MODULE: AMBIENT EVENTS
// Random Flavor Text
// ============================================

import { updateTokenMeter } from '../utils.js';

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
 * Add a new ambient event to the UI.
 */
export function addAmbientEvent() {
  var container = document.getElementById('ambientEvents');

  // Check if the last entry is empty (validation)
  var existingItems = container.querySelectorAll('.dynamic-item');
  if (existingItems.length > 0) {
    var lastItem = existingItems[existingItems.length - 1];
    var lastContent = lastItem.querySelector('textarea').value.trim();

    if (!lastContent) {
      flashFeedback(lastItem.querySelector('textarea'), 'red');
      return;
    }
  }

  var item = document.createElement('div');
  item.className = 'dynamic-item';
  item.innerHTML = '<textarea placeholder="Ambient event description..." style="flex:1;"></textarea><button type="button" class="remove-entry-btn">Remove</button>';

  // Add event listener for remove button
  item.querySelector('.remove-entry-btn').addEventListener('click', function() {
    this.parentElement.remove();
  });

  container.appendChild(item);
  flashFeedback(item, 'green');
}

/**
 * Build the ambient events script.
 * @param {boolean} standalone - Whether to include initContext function
 * @returns {string} - The generated script
 */
export function buildAmbientScript(standalone) {
  var probability = parseInt(document.getElementById('ambientProbability').value, 10) || 10;
  var events = document.querySelectorAll('#ambientEvents .dynamic-item');
  var debugMode = document.getElementById('debugMode').checked;

  var eventList = [];
  events.forEach(function(event) {
    var content = event.querySelector('textarea').value.trim();
    if (content) {
      eventList.push(content);
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

  script += "var probability = " + probability + ";\n";
  script += "var roll = Math.floor(Math.random() * 100) + 1;\n\n";

  script += "if (roll <= probability && ambientEvents.length > 0) {\n";
  script += "  var randomIndex = Math.floor(Math.random() * ambientEvents.length);\n";
  script += "  context.character.scenario += '\\n' + ambientEvents[randomIndex];\n";
  if (debugMode) {
    script += "  context.character.scenario += '\\n(debug: ambient event fired)';\n";
  }
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
