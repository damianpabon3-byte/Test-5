// ============================================
// MODULE: COMBINED CONDITIONS
// Multi-Trigger Rules
// ============================================

import { escapeForScript, generateHourInRangeFunction, updateTokenMeter, flashFeedback, setupAutoExpand } from '../utils.js';

/**
 * Add a new combined rule to the UI.
 * Smart Card Layout:
 * - Header: Keywords, Min Hour, Max Hour, Min Messages
 * - Body: Result (Auto-expand Textarea)
 */
export function addCombinedRule() {
  var container = document.getElementById('combinedRules');

  // Check if the last entry is empty (validation)
  var existingItems = container.querySelectorAll('.janitor-card-entry');
  if (existingItems.length > 0) {
    var lastItem = existingItems[existingItems.length - 1];
    var lastKeywords = lastItem.querySelector('input[type="text"]').value.trim();
    var lastResult = lastItem.querySelector('textarea').value.trim();

    if (!lastKeywords && !lastResult) {
      flashFeedback(lastItem.querySelector('input[type="text"]'), 'red');
      flashFeedback(lastItem.querySelector('textarea'), 'red');
      return;
    }
  }

  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML =
    '<div class="card-header-row">' +
      '<div class="meta-group">' +
        '<label>Keywords</label>' +
        '<input type="text" class="janitor-input compact-input" placeholder="Keywords (comma-separated)">' +
      '</div>' +
      '<div class="meta-group" style="flex:0 0 80px;">' +
        '<label>Min Hour</label>' +
        '<input type="number" class="janitor-input compact-input" placeholder="0-23" min="0" max="23">' +
      '</div>' +
      '<div class="meta-group" style="flex:0 0 80px;">' +
        '<label>Max Hour</label>' +
        '<input type="number" class="janitor-input compact-input" placeholder="0-23" min="0" max="23">' +
      '</div>' +
      '<div class="meta-group" style="flex:0 0 100px;">' +
        '<label>Min Messages</label>' +
        '<input type="number" class="janitor-input compact-input" placeholder="Min" min="1">' +
      '</div>' +
      '<button type="button" class="btn-remove-icon" title="Remove Entry">✕</button>' +
    '</div>' +
    '<div class="card-body-row">' +
      '<label>Result</label>' +
      '<textarea class="janitor-input auto-expand-content" placeholder="Result to inject when all conditions are met..."></textarea>' +
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
 * Build the combined conditions script.
 * @param {boolean} standalone - Whether to include initContext function
 * @returns {string} - The generated script
 */
export function buildCombinedConditionsScript(standalone) {
  var rules = document.querySelectorAll('#combinedRules .janitor-card-entry');
  var debugMode = document.getElementById('debugMode').checked;
  var offset = parseInt(document.getElementById('timeOffset').value, 10) || 0;

  var script = "// ============================================\n";
  script += "// MODULE: COMBINED CONDITIONS\n";
  script += "// ============================================\n\n";

  // Check for any valid configuration
  var hasRules = false;
  rules.forEach(function(rule) {
    var keywords = rule.querySelector('input[type="text"]').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
    var result = rule.querySelector('textarea').value.trim();
    if (keywords.length > 0 && result) {
      hasRules = true;
    }
  });

  if (!hasRules) {
    script += "// (No combined condition rules configured — this module currently does nothing.)\n";
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
    script += "// Safe message counter alias for combined conditions\n";
    script += "var message_count = (context.chat && typeof context.chat.message_count === 'number')\n";
    script += "  ? context.chat.message_count\n";
    script += "  : 0;\n\n";
  }

  // Add hourInRange for wrap-around support
  script += generateHourInRangeFunction();

  // Get message safely
  script += "// Get last user message safely\n";
  script += "var message = (context.chat && context.chat.last_message) ? context.chat.last_message : \"\";\n";
  script += "var msgLower = message.toLowerCase();\n";
  script += "var count = message_count;\n";
  script += "var offset = " + offset + ";\n";
  script += "var hour = (new Date().getHours() + offset + 24) % 24;\n";
  script += "var combinedFired = false;\n\n";

  rules.forEach(function(rule, index) {
    var keywords = rule.querySelector('input[type="text"]').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
    var inputs = rule.querySelectorAll('input[type="number"]');
    var minHour = parseInt(inputs[0].value, 10);
    var maxHour = parseInt(inputs[1].value, 10);
    var minMessages = parseInt(inputs[2].value, 10);
    var result = rule.querySelector('textarea').value.trim();

    if (keywords.length > 0 && result) {
      script += "// Combined Rule " + (index + 1) + "\n";
      script += "var keywordMatch" + index + " = false;\n";
      keywords.forEach(function(keyword) {
        script += "if (msgLower.indexOf('" + escapeForScript(keyword) + "') !== -1) keywordMatch" + index + " = true;\n";
      });

      script += "if (keywordMatch" + index;

      if (!isNaN(minHour) && !isNaN(maxHour)) {
        script += " && hourInRange(hour, " + minHour + ", " + maxHour + ")";
      }

      if (!isNaN(minMessages)) {
        script += " && count >= " + minMessages;
      }

      script += ") {\n";
      script += "  context.character.scenario += '\\n" + escapeForScript(result) + "';\n";
      script += "  combinedFired = true;\n";
      script += "}\n\n";
    }
  });

  if (debugMode) {
    script += "if (combinedFired) {\n";
    script += "  context.character.scenario += '\\n(debug: combined conditions fired)';\n";
    script += "}\n";
  }

  return script;
}

/**
 * Generate and display the combined conditions script.
 */
export function generateCombinedConditionsScript() {
  var script = buildCombinedConditionsScript(true);
  document.getElementById('combinedOutput').textContent = script;
  updateTokenMeter();
}
