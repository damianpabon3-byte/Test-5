// ============================================
// MODULE: SCORING ENGINE
// Sentiment Analysis (Experimental)
// ============================================

import { escapeForScript, updateTokenMeter } from '../utils.js';

/**
 * Add a new score threshold to the UI.
 */
export function addScoreThreshold() {
  var container = document.getElementById('scoreThresholds');
  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML =
    '<div class="card-header-grid">' +
      '<div class="meta-field" style="flex-direction: row; gap: 8px;">' +
        '<select class="janitor-input" style="width: 80px;">' +
          '<option value=">=">>=</option>' +
          '<option value="<="><=</option>' +
          '<option value="==">=</option>' +
        '</select>' +
        '<input type="number" class="janitor-input" placeholder="Value" style="width: 100px;">' +
      '</div>' +
      '<button class="btn-remove-icon" title="Remove">✕</button>' +
    '</div>' +
    '<div class="card-body">' +
      '<textarea class="janitor-input auto-expand" placeholder="Response..."></textarea>' +
    '</div>';

  // Add event listener for remove button
  item.querySelector('.btn-remove-icon').addEventListener('click', function() {
    item.remove();
  });

  container.appendChild(item);
}

/**
 * Build the scoring engine script.
 * @param {boolean} standalone - Whether to include initContext function
 * @returns {string} - The generated script
 */
export function buildScoringScript(standalone) {
  var mode = document.getElementById('scoringMode').value;
  var positive = document.getElementById('scoringPositive').value.split(',').map(function(k) { return escapeForScript(k.trim().toLowerCase()); }).filter(Boolean);
  var negative = document.getElementById('scoringNegative').value.split(',').map(function(k) { return escapeForScript(k.trim().toLowerCase()); }).filter(Boolean);
  var thresholds = document.querySelectorAll('#scoreThresholds .janitor-card-entry');
  var debugMode = document.getElementById('debugMode').checked;

  var script = "// ============================================\n";
  script += "// MODULE: SCORING ENGINE (" + mode.toUpperCase() + ")\n";
  script += "// ============================================\n\n";

  // Check for any valid configuration
  var hasThresholds = false;
  thresholds.forEach(function(threshold) {
    var value = parseInt(threshold.querySelector('input').value, 10);
    var response = threshold.querySelector('textarea').value.trim();
    if (!isNaN(value) && response) {
      hasThresholds = true;
    }
  });

  if (positive.length === 0 && negative.length === 0 && !hasThresholds) {
    script += "// (No scoring keywords configured — this module currently does nothing.)\n";
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

  // Get message safely
  script += "// Get last user message safely\n";
  script += "var message = (context.chat && context.chat.last_message) ? context.chat.last_message : \"\";\n\n";

  if (mode === 'persistent') {
    script += "// EXPERIMENTAL: Persistent scoring via {{char}} tags\n";
    script += "// WARNING: Fragile and may break with platform updates\n\n";
    script += "var scoreMatch = context.character.scenario.match(/\\{\\{char_score:([-\\d]+)\\}\\}/);\n";
    script += "var score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;\n\n";
  } else {
    script += "// Stateless: Single-turn sentiment analysis\n";
    script += "var score = 0;\n\n";
  }

  script += "var msgLower = message.toLowerCase();\n\n";

  // Positive keywords
  if (positive.length > 0) {
    script += "// Positive keywords\n";
    script += "var positiveKeywords = [" + positive.map(function(k) { return "'" + k + "'"; }).join(", ") + "];\n";
    script += "for (var i = 0; i < positiveKeywords.length; i++) {\n";
    script += "  if (msgLower.indexOf(positiveKeywords[i]) !== -1) {\n";
    script += "    score += 1;\n";
    script += "  }\n";
    script += "}\n\n";
  }

  // Negative keywords
  if (negative.length > 0) {
    script += "// Negative keywords\n";
    script += "var negativeKeywords = [" + negative.map(function(k) { return "'" + k + "'"; }).join(", ") + "];\n";
    script += "for (var i = 0; i < negativeKeywords.length; i++) {\n";
    script += "  if (msgLower.indexOf(negativeKeywords[i]) !== -1) {\n";
    script += "    score -= 1;\n";
    script += "  }\n";
    script += "}\n\n";
  }

  // Update persistent score
  if (mode === 'persistent') {
    script += "// Update score tag\n";
    script += "if (scoreMatch) {\n";
    script += "  context.character.scenario = context.character.scenario.replace(/\\{\\{char_score:[-\\d]+\\}\\}/, '{{char_score:' + score + '}}');\n";
    script += "} else {\n";
    script += "  context.character.scenario += '\\n{{char_score:' + score + '}}';\n";
    script += "}\n\n";
  }

  // Thresholds
  if (hasThresholds) {
    thresholds.forEach(function(threshold) {
      var operator = threshold.querySelector('select').value;
      var value = parseInt(threshold.querySelector('input').value, 10);
      var response = threshold.querySelector('textarea').value.trim();

      if (!isNaN(value) && response) {
        script += "if (score " + operator + " " + value + ") {\n";
        script += "  context.character.personality += '\\n" + escapeForScript(response) + "';\n";
        script += "}\n";
      }
    });
  }

  if (debugMode) {
    script += "\ncontext.character.scenario += '\\n(debug: scoring module fired, score=' + score + ')';\n";
  }

  return script;
}

/**
 * Generate and display the scoring script.
 */
export function generateScoringScript() {
  var script = buildScoringScript(true);
  document.getElementById('scoringOutput').textContent = script;
  updateTokenMeter();
}
