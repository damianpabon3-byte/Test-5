// ============================================
// MODULE: AMBIENT EVENTS
// Random Flavor Text
// ============================================

import { updateTokenMeter } from '../utils.js';

/**
 * Add a new ambient event to the UI.
 */
export function addAmbientEvent() {
  var container = document.getElementById('ambientEvents');
  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML = `
    <div class="card-header-grid">
      <div class="meta-field" style="flex:1;">
        <label>Ambient Event</label>
      </div>
      <button class="btn-remove-icon" title="Remove">✕</button>
    </div>
    <div class="card-body">
      <label>Content</label>
      <p class="field-subtext">Example: A distant dog barks.</p>
      <textarea class="janitor-input auto-expand" placeholder="Ambient event description..."></textarea>
    </div>
  `;

  // Add event listener for remove button
  item.querySelector('.btn-remove-icon').addEventListener('click', function() {
    this.closest('.janitor-card-entry').remove();
  });

  container.appendChild(item);
}

/**
 * Build the ambient events script.
 * @param {boolean} standalone - Whether to include initContext function
 * @returns {string} - The generated script
 */
export function buildAmbientScript(standalone) {
  var probability = parseInt(document.getElementById('ambientProbability').value, 10) || 10;
  var events = document.querySelectorAll('#ambientEvents .janitor-card-entry');
  var debugMode = document.getElementById('debugMode').checked;

  var eventList = [];
  events.forEach(function(event) {
    var content = event.querySelector('.card-body textarea').value.trim();
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
