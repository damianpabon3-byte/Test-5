// ============================================
// MODULE: PACING SYSTEM
// Message Count Gates
// ============================================

import { escapeForScript, updateTokenMeter, initAutoExpand } from '../utils.js';

/**
 * Add a new pacing phase to the UI.
 */
export function addPacingPhase() {
  var container = document.getElementById('pacingPhases');
  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML = `
    <div class="card-header-grid multi-field">
      <div class="meta-field">
        <label>Min Messages</label>
        <input type="number" class="janitor-input" placeholder="Min" min="1" />
      </div>
      <div class="meta-field">
        <label>Max Messages</label>
        <input type="number" class="janitor-input" placeholder="Max" min="1" />
      </div>
      <button class="btn-remove-icon" title="Remove">✕</button>
    </div>
    <div class="card-body">
      <label>Content</label>
      <p class="field-subtext">Example: {{char}} begins to open up about their past...</p>
      <textarea class="janitor-input auto-expand" placeholder="Scenario add-on for this phase..."></textarea>
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
 * Add a new one-time event to the UI.
 */
export function addOneTimeEvent() {
  var container = document.getElementById('oneTimeEvents');
  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML = `
    <div class="card-header-grid">
      <div class="meta-field">
        <label>Message Number</label>
        <input type="number" class="janitor-input" placeholder="Exact message #" min="1" />
      </div>
      <button class="btn-remove-icon" title="Remove">✕</button>
    </div>
    <div class="card-body">
      <label>Content</label>
      <p class="field-subtext">Example: {{char}} begins to open up about their past...</p>
      <textarea class="janitor-input auto-expand" placeholder="One-time event content..."></textarea>
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
    var inputs = phase.querySelectorAll('.card-header-grid input');
    var min = parseInt(inputs[0].value, 10);
    var max = parseInt(inputs[1].value, 10);
    var content = phase.querySelector('.card-body textarea').value.trim();
    if (!isNaN(min) && !isNaN(max) && content) {
      hasPhases = true;
    }
  });

  events.forEach(function(event) {
    var exact = parseInt(event.querySelector('.card-header-grid input').value, 10);
    var content = event.querySelector('.card-body textarea').value.trim();
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
      var inputs = phase.querySelectorAll('.card-header-grid input');
      var min = parseInt(inputs[0].value, 10);
      var max = parseInt(inputs[1].value, 10);
      var content = phase.querySelector('.card-body textarea').value.trim();

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
      var exact = parseInt(event.querySelector('.card-header-grid input').value, 10);
      var content = event.querySelector('.card-body textarea').value.trim();

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
