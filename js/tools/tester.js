// ============================================
// TOOL: SCRIPT TESTER
// Test scripts with sample messages
// ============================================

import { showToast, escapeHtml } from '../utils.js';

// Batch message counter
let batchMessageCounter = 0;

/**
 * Get the script content from the selected source.
 * @returns {string} - The script content
 */
export function getSelectedScript() {
  var source = document.getElementById('testerScriptSource').value;

  // Handle custom script option
  if (source === 'custom') {
    return document.getElementById('testerCustomScript').value || '';
  }

  var outputMap = {
    'final': 'finalOutput',
    'lorebook': 'lorebookOutput',
    'memory': 'memoryOutput',
    'pacing': 'pacingOutput',
    'tone': 'toneOutput',
    'time': 'timeOutput',
    'ambient': 'ambientOutput',
    'random': 'randomOutput',
    'combined': 'combinedOutput',
    'scoring': 'scoringOutput'
  };
  var outputId = outputMap[source];
  if (!outputId) return '';
  var el = document.getElementById(outputId);
  return el ? el.textContent : '';
}

/**
 * Clear test results.
 */
export function clearTestResults() {
  document.getElementById('testerResults').style.display = 'none';
  document.getElementById('testerConsoleOutput').textContent = '// Console logs will appear here';
  document.getElementById('testerPersonality').textContent = '(none)';
  document.getElementById('testerScenario').textContent = '(none)';
  document.getElementById('testerExamples').textContent = '(none)';
}

/**
 * Execute a single test and return results.
 * @param {string} scriptCode - The script to test
 * @param {string} testMessage - The test message
 * @param {string} charName - The character name
 * @returns {Object} - Test results
 */
export function executeScriptTest(scriptCode, testMessage, charName) {
  var context = {
    chat: {
      last_message: testMessage,
      last_messages: [],
      message_count: 1,
      multi_depth_enabled: false
    },
    character: {
      name: charName || '',
      personality: '',
      scenario: '',
      example_dialogues: ''
    }
  };

  var consoleLogs = [];
  var mockConsole = {
    log: function() {
      var args = Array.prototype.slice.call(arguments);
      consoleLogs.push(args.map(String).join(' '));
    },
    error: function() {
      var args = Array.prototype.slice.call(arguments);
      consoleLogs.push('[ERROR] ' + args.map(String).join(' '));
    },
    warn: function() {
      var args = Array.prototype.slice.call(arguments);
      consoleLogs.push('[WARN] ' + args.map(String).join(' '));
    },
    info: function() {
      var args = Array.prototype.slice.call(arguments);
      consoleLogs.push('[INFO] ' + args.map(String).join(' '));
    }
  };

  var errorOccurred = false;
  var errorMessage = '';

  try {
    var wrappedCode = '(function(context, console, Math) {\n' + scriptCode + '\n})';
    var scriptFn = eval(wrappedCode);
    scriptFn(context, mockConsole, Math);
  } catch (e) {
    errorOccurred = true;
    errorMessage = e.toString();
    consoleLogs.push('[EXECUTION ERROR] ' + errorMessage);
  }

  return {
    message: testMessage,
    consoleLogs: consoleLogs,
    personality: context.character.personality,
    scenario: context.character.scenario,
    examples: context.character.example_dialogues,
    error: errorOccurred,
    errorMessage: errorMessage,
    hasChanges: !!(context.character.personality || context.character.scenario || context.character.example_dialogues)
  };
}

/**
 * Run the script test.
 */
export function runScriptTest() {
  var scriptCode = getSelectedScript();
  var testMessage = document.getElementById('testerMessage').value || '';
  var charName = document.getElementById('testerCharName').value || '';

  // Validate
  if (!scriptCode || scriptCode.indexOf('// Script will appear') === 0) {
    showToast('Please generate a script first before testing', 'error');
    return;
  }
  if (!testMessage.trim()) {
    showToast('Please enter a test message', 'error');
    return;
  }

  // Build context similar to JanitorAI
  var context = {
    chat: {
      last_message: testMessage,
      last_messages: [],
      message_count: 1,
      multi_depth_enabled: false
    },
    character: {
      name: charName,
      personality: '',
      scenario: '',
      example_dialogues: ''
    }
  };

  // Capture console output
  var consoleLogs = [];
  var mockConsole = {
    log: function() {
      var args = Array.prototype.slice.call(arguments);
      consoleLogs.push(args.map(String).join(' '));
    },
    error: function() {
      var args = Array.prototype.slice.call(arguments);
      consoleLogs.push('[ERROR] ' + args.map(String).join(' '));
    },
    warn: function() {
      var args = Array.prototype.slice.call(arguments);
      consoleLogs.push('[WARN] ' + args.map(String).join(' '));
    },
    info: function() {
      var args = Array.prototype.slice.call(arguments);
      consoleLogs.push('[INFO] ' + args.map(String).join(' '));
    }
  };

  // Execute the script in a sandboxed way
  var errorOccurred = false;
  var errorMessage = '';

  try {
    // Create a function that has access to context and mock console
    var wrappedCode = '(function(context, console, Math) {\n' + scriptCode + '\n})';
    var scriptFn = eval(wrappedCode);
    scriptFn(context, mockConsole, Math);
  } catch (e) {
    errorOccurred = true;
    errorMessage = e.toString();
    consoleLogs.push('[EXECUTION ERROR] ' + errorMessage);
  }

  // Display results
  document.getElementById('testerResults').style.display = 'block';

  // Console output
  var consoleEl = document.getElementById('testerConsoleOutput');
  if (consoleLogs.length > 0) {
    consoleEl.textContent = consoleLogs.join('\n');
    consoleEl.className = 'output-box' + (errorOccurred ? ' tester-error' : ' tester-success');
  } else {
    consoleEl.textContent = '(no console output)';
    consoleEl.className = 'output-box';
  }

  // Personality
  var personalityEl = document.getElementById('testerPersonality');
  if (context.character.personality) {
    personalityEl.textContent = context.character.personality;
    personalityEl.className = 'output-box tester-success';
  } else {
    personalityEl.textContent = '(no changes)';
    personalityEl.className = 'output-box';
  }

  // Scenario
  var scenarioEl = document.getElementById('testerScenario');
  if (context.character.scenario) {
    scenarioEl.textContent = context.character.scenario;
    scenarioEl.className = 'output-box tester-success';
  } else {
    scenarioEl.textContent = '(no changes)';
    scenarioEl.className = 'output-box';
  }

  // Example dialogues
  var examplesEl = document.getElementById('testerExamples');
  if (context.character.example_dialogues) {
    examplesEl.textContent = context.character.example_dialogues;
    examplesEl.className = 'output-box tester-success';
  } else {
    examplesEl.textContent = '(no changes)';
    examplesEl.className = 'output-box';
  }

  // Show success/error toast
  if (errorOccurred) {
    showToast('Script error: ' + errorMessage, 'error');
  } else {
    var changes = [];
    if (context.character.personality) changes.push('personality');
    if (context.character.scenario) changes.push('scenario');
    if (context.character.example_dialogues) changes.push('examples');

    if (changes.length > 0) {
      showToast('Test complete! Modified: ' + changes.join(', '), 'success');
    } else {
      showToast('Test complete - no triggers matched', 'warning');
    }
  }
}

/**
 * Update UI when script source changes.
 */
export function updateTesterScript() {
  var source = document.getElementById('testerScriptSource').value;
  var customSection = document.getElementById('testerCustomSection');

  // Show/hide custom script section
  if (source === 'custom') {
    customSection.style.display = 'block';
  } else {
    customSection.style.display = 'none';
  }

  clearTestResults();
}

// ============================================
// BATCH TESTING FUNCTIONS
// ============================================

/**
 * Toggle batch mode UI.
 */
export function toggleBatchMode() {
  var batchMode = document.getElementById('testerBatchMode').checked;
  var singleMode = document.getElementById('testerSingleMode');
  var batchSection = document.getElementById('testerBatchSection');
  var singleButtons = document.getElementById('singleTestButtons');
  var batchButtons = document.getElementById('batchTestButtons');

  if (batchMode) {
    singleMode.style.display = 'none';
    batchSection.style.display = 'block';
    singleButtons.style.display = 'none';
    batchButtons.style.display = 'block';
    // Add initial message box if empty
    if (document.getElementById('batchTestMessages').children.length === 0) {
      addBatchTestMessage();
    }
  } else {
    singleMode.style.display = 'block';
    batchSection.style.display = 'none';
    singleButtons.style.display = 'block';
    batchButtons.style.display = 'none';
  }

  // Clear results when switching modes
  clearTestResults();
  clearBatchResults();
}

/**
 * Add a new batch test message input.
 * @param {string} prefillText - Optional text to prefill
 * @returns {HTMLElement} - The created item element
 */
export function addBatchTestMessage(prefillText) {
  // Fix: Handle case where prefillText is a MouseEvent (when called via click handler)
  var text = (typeof prefillText === 'string') ? prefillText : '';

  batchMessageCounter++;
  var container = document.getElementById('batchTestMessages');
  var item = document.createElement('div');
  item.className = 'janitor-card-entry';
  item.innerHTML =
    '<div class="card-header-grid">' +
      '<span class="meta-field" style="font-weight: 600; color: var(--accent);">Message #' + batchMessageCounter + '</span>' +
      '<button class="btn-remove-icon" title="Remove">✕</button>' +
    '</div>' +
    '<div class="card-body">' +
      '<textarea class="janitor-input auto-expand batch-message-input" rows="2" placeholder="Enter test message..."></textarea>' +
    '</div>';
  container.appendChild(item);

  // Add event listener for remove button
  item.querySelector('.btn-remove-icon').addEventListener('click', function() {
    item.remove();
  });

  // Prefill if text provided
  if (text) {
    item.querySelector('textarea').value = text;
  }

  return item;
}

/**
 * Clear all batch messages.
 */
export function clearBatchMessages() {
  document.getElementById('batchTestMessages').innerHTML = '';
  batchMessageCounter = 0;
  addBatchTestMessage(); // Add one empty one
}

/**
 * Clear batch results.
 */
export function clearBatchResults() {
  document.getElementById('batchResults').style.display = 'none';
  document.getElementById('batchResultsSummary').innerHTML = '';
  document.getElementById('batchResultsList').innerHTML = '';
}

/**
 * Run all batch tests.
 */
export function runBatchTests() {
  var scriptCode = getSelectedScript();
  var charName = document.getElementById('testerCharName').value || '';

  // Validate script
  if (!scriptCode || scriptCode.indexOf('// Script will appear') === 0) {
    showToast('Please generate or paste a script first', 'error');
    return;
  }

  // Get all messages
  var messageInputs = document.querySelectorAll('#batchTestMessages .batch-message-input');
  var messages = [];
  messageInputs.forEach(function(input) {
    var msg = input.value.trim();
    if (msg) messages.push(msg);
  });

  if (messages.length === 0) {
    showToast('Please add at least one test message', 'error');
    return;
  }

  // Run all tests
  var results = [];
  var successCount = 0;
  var noTriggerCount = 0;
  var errorCount = 0;

  messages.forEach(function(msg, idx) {
    var result = executeScriptTest(scriptCode, msg, charName);
    result.index = idx + 1;
    results.push(result);

    if (result.error) {
      errorCount++;
    } else if (result.hasChanges) {
      successCount++;
    } else {
      noTriggerCount++;
    }
  });

  // Display results
  displayBatchResults(results, successCount, noTriggerCount, errorCount);
}

/**
 * Display batch test results.
 * @param {Array} results - The test results
 * @param {number} successCount - Number of successful triggers
 * @param {number} noTriggerCount - Number of no-trigger results
 * @param {number} errorCount - Number of errors
 */
export function displayBatchResults(results, successCount, noTriggerCount, errorCount) {
  var container = document.getElementById('batchResults');
  var summary = document.getElementById('batchResultsSummary');
  var list = document.getElementById('batchResultsList');

  // Summary
  summary.innerHTML =
    '<strong>Batch Test Complete:</strong> ' + results.length + ' messages tested — ' +
    '<span style="color: var(--success);">' + successCount + ' triggered</span>, ' +
    '<span style="color: var(--text-muted);">' + noTriggerCount + ' no triggers</span>, ' +
    '<span style="color: var(--danger);">' + errorCount + ' errors</span>';

  // Individual results
  list.innerHTML = '';
  results.forEach(function(result) {
    var statusClass = result.error ? 'error' : (result.hasChanges ? 'success' : 'no-trigger');
    var statusText = result.error ? '❌ Error' : (result.hasChanges ? '✅ Triggered' : '⚪ No Trigger');

    var item = document.createElement('div');
    item.className = 'batch-result-item ' + statusClass;
    item.innerHTML =
      '<div class="batch-result-header">' +
        '<span class="batch-result-number">Test #' + result.index + '</span>' +
        '<span class="batch-result-status">' + statusText + ' (click to expand)</span>' +
      '</div>' +
      '<div class="batch-result-message">"' + escapeHtml(result.message.substring(0, 150)) + (result.message.length > 150 ? '...' : '') + '"</div>' +
      '<div class="batch-result-details">' +
        '<div class="batch-result-detail">' +
          '<strong>Console Output:</strong>' +
          '<div class="output-box">' + (result.consoleLogs.length > 0 ? escapeHtml(result.consoleLogs.join('\n')) : '(none)') + '</div>' +
        '</div>' +
        '<div class="batch-result-detail">' +
          '<strong>Personality:</strong>' +
          '<div class="output-box">' + (result.personality ? escapeHtml(result.personality) : '(no changes)') + '</div>' +
        '</div>' +
        '<div class="batch-result-detail">' +
          '<strong>Scenario:</strong>' +
          '<div class="output-box">' + (result.scenario ? escapeHtml(result.scenario) : '(no changes)') + '</div>' +
        '</div>' +
        '<div class="batch-result-detail">' +
          '<strong>Example Dialogues:</strong>' +
          '<div class="output-box">' + (result.examples ? escapeHtml(result.examples) : '(no changes)') + '</div>' +
        '</div>' +
      '</div>';

    // Add click handler to toggle details
    item.querySelector('.batch-result-header').addEventListener('click', function() {
      this.nextElementSibling.nextElementSibling.classList.toggle('expanded');
    });

    list.appendChild(item);
  });

  container.style.display = 'block';
  showToast('Batch test complete: ' + results.length + ' messages processed', 'success');
}
