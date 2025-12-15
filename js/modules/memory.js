// ============================================
// MODULE: MEMORY SYSTEM
// Auto-detect and remember user info
// ============================================

import { escapeForScript, escapeForRegex, updateTokenMeter } from '../utils.js';

/**
 * Build the memory system script.
 * @param {boolean} standalone - Whether to include initContext function
 * @returns {string} - The generated script
 */
export function buildMemoryScript(standalone) {
  var namePhrase = escapeForRegex(document.getElementById('memNamePhrase').value.trim().toLowerCase());
  var factsKeywords = document.getElementById('memFactsKeywords').value.split(',').map(function(k) { return escapeForScript(k.trim().toLowerCase()); }).filter(Boolean);
  var likesKeywords = document.getElementById('memLikesKeywords').value.split(',').map(function(k) { return escapeForScript(k.trim().toLowerCase()); }).filter(Boolean);
  var dislikesKeywords = document.getElementById('memDislikesKeywords').value.split(',').map(function(k) { return escapeForScript(k.trim().toLowerCase()); }).filter(Boolean);
  var debugMode = document.getElementById('debugMode').checked;

  var script = "// ============================================\n";
  script += "// MODULE: MEMORY SYSTEM\n";
  script += "// ============================================\n\n";

  // Check for any valid configuration
  var hasAnyConfig = !!namePhrase || factsKeywords.length > 0 || likesKeywords.length > 0 || dislikesKeywords.length > 0;

  if (!hasAnyConfig) {
    script += "// (No memory triggers configured — this module currently does nothing.)\n";
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
  script += "var message = (context.chat && context.chat.last_message) ? context.chat.last_message : \"\";\n";
  script += "var last_message = message.toLowerCase();\n";
  script += "var memoryUpdated = false;\n\n";

  // Only add name detection if namePhrase is provided
  if (namePhrase) {
    script += "// Name Detection (captures names with accents, hyphens, apostrophes)\n";
    script += "var nameRegex = new RegExp('" + namePhrase + "\\\\s+([^\\\\d,.;!?]{2,40})', 'i');\n";
    script += "var nameMatch = last_message.match(nameRegex);\n";
    script += "if (nameMatch && nameMatch[1]) {\n";
    script += "  var detectedName = nameMatch[1].trim();\n";
    script += "  // Dedupe: only add if not already present\n";
    script += "  if (context.character.scenario.indexOf('User name: ' + detectedName) === -1) {\n";
    script += "    context.character.scenario += '\\nUser name: ' + detectedName;\n";
    script += "    memoryUpdated = true;\n";
    script += "  }\n";
    script += "}\n\n";
  }

  // Facts with deduplication
  if (factsKeywords.length > 0) {
    script += "// Facts Detection with deduplication\n";
    script += "var factsKeywords = [" + factsKeywords.map(function(k) { return "'" + k + "'"; }).join(", ") + "];\n";
    script += "for (var i = 0; i < factsKeywords.length; i++) {\n";
    script += "  if (last_message.indexOf(factsKeywords[i]) !== -1) {\n";
    script += "    var factEntry = 'Fact: ' + message;\n";
    script += "    if (context.character.scenario.indexOf(factEntry) === -1) {\n";
    script += "      context.character.scenario += '\\n' + factEntry;\n";
    script += "      memoryUpdated = true;\n";
    script += "    }\n";
    script += "    break;\n";
    script += "  }\n";
    script += "}\n\n";
  }

  // Likes with deduplication
  if (likesKeywords.length > 0) {
    script += "// Likes Detection with deduplication\n";
    script += "var likesKeywords = [" + likesKeywords.map(function(k) { return "'" + k + "'"; }).join(", ") + "];\n";
    script += "for (var i = 0; i < likesKeywords.length; i++) {\n";
    script += "  if (last_message.indexOf(likesKeywords[i]) !== -1) {\n";
    script += "    var likeEntry = 'Likes: ' + message;\n";
    script += "    if (context.character.scenario.indexOf(likeEntry) === -1) {\n";
    script += "      context.character.scenario += '\\n' + likeEntry;\n";
    script += "      memoryUpdated = true;\n";
    script += "    }\n";
    script += "    break;\n";
    script += "  }\n";
    script += "}\n\n";
  }

  // Dislikes with deduplication
  if (dislikesKeywords.length > 0) {
    script += "// Dislikes Detection with deduplication\n";
    script += "var dislikesKeywords = [" + dislikesKeywords.map(function(k) { return "'" + k + "'"; }).join(", ") + "];\n";
    script += "for (var i = 0; i < dislikesKeywords.length; i++) {\n";
    script += "  if (last_message.indexOf(dislikesKeywords[i]) !== -1) {\n";
    script += "    var dislikeEntry = 'Dislikes: ' + message;\n";
    script += "    if (context.character.scenario.indexOf(dislikeEntry) === -1) {\n";
    script += "      context.character.scenario += '\\n' + dislikeEntry;\n";
    script += "      memoryUpdated = true;\n";
    script += "    }\n";
    script += "    break;\n";
    script += "  }\n";
    script += "}\n\n";
  }

  if (debugMode) {
    script += "// Debug Output\n";
    script += "if (memoryUpdated) {\n";
    script += "  context.character.scenario += '\\n(debug: memory updated)';\n";
    script += "}\n";
  }

  return script;
}

/**
 * Generate and display the memory script.
 */
export function generateMemoryScript() {
  var script = buildMemoryScript(true);
  document.getElementById('memoryOutput').textContent = script;
  updateTokenMeter();
}
