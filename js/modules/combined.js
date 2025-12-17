// ============================================
// MODULE: COMBINED CONDITIONS
// Multi-Trigger Rules
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
 * Add a new combined rule to the UI.
 */
export function addCombinedRule() {
  var container = document.getElementById('combinedRules');

  // Check if the last entry is empty (validation)
  var existingItems = container.querySelectorAll('.dynamic-item');
  if (existingItems.length > 0) {
    var lastItem = existingItems[existingItems.length - 1];
    var inputs = lastItem.querySelectorAll('input');
    var lastKeywords = inputs[0].value.trim();
    var lastResult = lastItem.querySelector('textarea').value.trim();

    if (!lastKeywords && !lastResult) {
      flashFeedback(inputs[0], 'red');
      flashFeedback(lastItem.querySelector('textarea'), 'red');
      return;
    }
  }

  var item = document.createElement('div');
  item.className = 'dynamic-item';
  item.innerHTML = '<input type="text" placeholder="Keywords (comma-separated)" style="flex:1;" /><input type="number" placeholder="Min hour" min="0" max="23" style="width:80px;" /><input type="number" placeholder="Max hour" min="0" max="23" style="width:80px;" /><input type="number" placeholder="Min messages" min="1" style="width:100px;" /><textarea placeholder="Result when all conditions met..." style="flex:1;"></textarea><button type="button" class="remove-entry-btn">Remove</button>';

  // Add event listener for remove button
  item.querySelector('.remove-entry-btn').addEventListener('click', function() {
    this.parentElement.remove();
  });

  container.appendChild(item);
  flashFeedback(item, 'green');
}

/**
 * Build the combined conditions script.
 * @param {boolean} standalone - Whether to include initContext function
 * @returns {string} - The generated script
 */
export function buildCombinedConditionsScript(standalone) {
  var rules = document.querySelectorAll('#combinedRules .dynamic-item');
  var debugMode = document.getElementById('debugMode').checked;
  var offset = parseInt(document.getElementById('timeOffset').value, 10) || 0;

  var script = "// ============================================\n";
  script += "// MODULE: COMBINED CONDITIONS\n";
  script += "// ============================================\n\n";

  // Check for any valid configuration
  var hasRules = false;
  rules.forEach(function(rule) {
    var keywords = rule.querySelector('input').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
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
    var keywords = rule.querySelector('input').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
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
