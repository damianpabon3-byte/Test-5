// ============================================
// TOOL: TRIGGER ANALYZER
// Scan modules for keyword conflicts and overlaps
// ============================================

import { showToast } from '../utils.js';

/**
 * Analyze all triggers across modules for conflicts and overlaps.
 */
export function analyzeTriggers() {
  var triggerMap = {}; // keyword -> [{module, context, action}]

  // Collect from Lorebook
  var loreEntries = document.querySelectorAll('#loreEntries .dynamic-item');
  loreEntries.forEach(function(entry) {
    var category = entry.querySelector('select').value;
    var keywords = entry.querySelector('input').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
    var content = entry.querySelector('textarea').value.trim();
    if (content) {
      keywords.forEach(function(kw) {
        if (!triggerMap[kw]) triggerMap[kw] = [];
        triggerMap[kw].push({
          module: 'Lorebook',
          context: category,
          action: 'Injects lore entry (' + content.substring(0, 40) + (content.length > 40 ? '...' : '') + ')'
        });
      });
    }
  });

  // Collect from Tone
  var toneTriggers = document.querySelectorAll('#toneTriggers .dynamic-item');
  toneTriggers.forEach(function(trigger) {
    var keywords = trigger.querySelector('input').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
    var content = trigger.querySelector('textarea').value.trim();
    if (content) {
      keywords.forEach(function(kw) {
        if (!triggerMap[kw]) triggerMap[kw] = [];
        triggerMap[kw].push({
          module: 'Tone',
          context: 'personality shift',
          action: 'Adds: ' + content.substring(0, 40) + (content.length > 40 ? '...' : '')
        });
      });
    }
  });

  // Collect from Scoring - Positive
  var positiveKeywords = document.getElementById('scoringPositive').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
  positiveKeywords.forEach(function(kw) {
    if (!triggerMap[kw]) triggerMap[kw] = [];
    triggerMap[kw].push({
      module: 'Scoring',
      context: 'positive',
      action: 'Adds +1 to score'
    });
  });

  // Collect from Scoring - Negative
  var negativeKeywords = document.getElementById('scoringNegative').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
  negativeKeywords.forEach(function(kw) {
    if (!triggerMap[kw]) triggerMap[kw] = [];
    triggerMap[kw].push({
      module: 'Scoring',
      context: 'negative',
      action: 'Subtracts -1 from score'
    });
  });

  // Collect from Memory - Facts
  var factsKeywords = document.getElementById('memFactsKeywords').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
  factsKeywords.forEach(function(kw) {
    if (!triggerMap[kw]) triggerMap[kw] = [];
    triggerMap[kw].push({
      module: 'Memory',
      context: 'facts detection',
      action: 'Triggers fact storage'
    });
  });

  // Collect from Memory - Likes
  var likesKeywords = document.getElementById('memLikesKeywords').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
  likesKeywords.forEach(function(kw) {
    if (!triggerMap[kw]) triggerMap[kw] = [];
    triggerMap[kw].push({
      module: 'Memory',
      context: 'likes detection',
      action: 'Triggers like storage'
    });
  });

  // Collect from Memory - Dislikes
  var dislikesKeywords = document.getElementById('memDislikesKeywords').value.split(',').map(function(k) { return k.trim().toLowerCase(); }).filter(Boolean);
  dislikesKeywords.forEach(function(kw) {
    if (!triggerMap[kw]) triggerMap[kw] = [];
    triggerMap[kw].push({
      module: 'Memory',
      context: 'dislikes detection',
      action: 'Triggers dislike storage'
    });
  });

  // Analyze the collected triggers
  var conflicts = [];      // Same keyword with opposing scoring effects
  var multiTriggers = [];  // Keywords that trigger multiple things
  var overlaps = [];       // Keywords that contain each other
  var allKeywords = Object.keys(triggerMap);

  // Check for multi-triggers and conflicts
  allKeywords.forEach(function(kw) {
    var usages = triggerMap[kw];
    if (usages.length > 1) {
      // Check for scoring conflicts (positive AND negative)
      var hasPositive = usages.some(function(u) { return u.module === 'Scoring' && u.context === 'positive'; });
      var hasNegative = usages.some(function(u) { return u.module === 'Scoring' && u.context === 'negative'; });
      if (hasPositive && hasNegative) {
        conflicts.push({ keyword: kw, usages: usages });
      } else {
        multiTriggers.push({ keyword: kw, usages: usages });
      }
    }
  });

  // Check for overlapping keywords (one contains another)
  for (var i = 0; i < allKeywords.length; i++) {
    for (var j = i + 1; j < allKeywords.length; j++) {
      var kw1 = allKeywords[i];
      var kw2 = allKeywords[j];
      // Check if one contains the other (but they're not equal)
      if (kw1 !== kw2) {
        if (kw1.indexOf(kw2) !== -1 || kw2.indexOf(kw1) !== -1) {
          overlaps.push({
            keywords: [kw1, kw2],
            note: kw1.length > kw2.length
              ? '"' + kw1 + '" contains "' + kw2 + '"'
              : '"' + kw2 + '" contains "' + kw1 + '"'
          });
        }
      }
    }
  }

  // Build results HTML
  var resultsHTML = '<div class="analyzer-results">';

  // Summary
  resultsHTML += '<div class="analyzer-summary">';
  resultsHTML += '<span class="analyzer-stat">Total keywords: <strong>' + allKeywords.length + '</strong></span>';
  resultsHTML += '<span class="analyzer-stat">Conflicts: <strong>' + conflicts.length + '</strong></span>';
  resultsHTML += '<span class="analyzer-stat">Multi-triggers: <strong>' + multiTriggers.length + '</strong></span>';
  resultsHTML += '<span class="analyzer-stat">Overlaps: <strong>' + overlaps.length + '</strong></span>';
  resultsHTML += '</div>';

  // Conflicts section
  if (conflicts.length > 0) {
    resultsHTML += '<div class="analyzer-section">';
    resultsHTML += '<h4>⚠️ Conflicts (Same keyword with opposing effects)</h4>';
    conflicts.forEach(function(item) {
      resultsHTML += '<div class="analyzer-item analyzer-conflict">';
      resultsHTML += '<div class="analyzer-keyword">"' + item.keyword + '"</div>';
      resultsHTML += '<div class="analyzer-usage">';
      item.usages.forEach(function(usage) {
        resultsHTML += '<div class="analyzer-usage-item">→ ' + usage.module + ' (' + usage.context + '): ' + usage.action + '</div>';
      });
      resultsHTML += '</div></div>';
    });
    resultsHTML += '</div>';
  }

  // Multi-triggers section
  if (multiTriggers.length > 0) {
    resultsHTML += '<div class="analyzer-section">';
    resultsHTML += '<h4>📋 Multi-Triggers (Keywords that fire multiple things)</h4>';
    multiTriggers.forEach(function(item) {
      resultsHTML += '<div class="analyzer-item analyzer-warning">';
      resultsHTML += '<div class="analyzer-keyword">"' + item.keyword + '"</div>';
      resultsHTML += '<div class="analyzer-usage">';
      item.usages.forEach(function(usage) {
        resultsHTML += '<div class="analyzer-usage-item">→ ' + usage.module + ' (' + usage.context + '): ' + usage.action + '</div>';
      });
      resultsHTML += '</div></div>';
    });
    resultsHTML += '</div>';
  }

  // Overlaps section
  if (overlaps.length > 0) {
    resultsHTML += '<div class="analyzer-section">';
    resultsHTML += '<h4>🔗 Overlapping Keywords (May cause unintended matches without padded matching)</h4>';
    overlaps.forEach(function(item) {
      resultsHTML += '<div class="analyzer-item analyzer-warning">';
      resultsHTML += '<div class="analyzer-keyword">' + item.note + '</div>';
      resultsHTML += '</div>';
    });
    resultsHTML += '</div>';
  }

  // All clear message
  if (conflicts.length === 0 && multiTriggers.length === 0 && overlaps.length === 0) {
    if (allKeywords.length === 0) {
      resultsHTML += '<div class="analyzer-empty">No triggers configured yet. Add keywords to your modules to analyze them.</div>';
    } else {
      resultsHTML += '<div class="analyzer-item analyzer-ok">';
      resultsHTML += '<strong>✓ All Clear!</strong> No conflicts or overlaps detected in your ' + allKeywords.length + ' keywords.';
      resultsHTML += '</div>';
    }
  }

  resultsHTML += '</div>';

  document.getElementById('analyzerResults').innerHTML = resultsHTML;
  showToast('Trigger analysis complete!', 'success');
}
