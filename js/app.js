// ============================================
// JanitorAI Script Builder
// Main Application Entry Point
// ============================================

// Utilities
import {
  showToast,
  copyToClipboard,
  copyFinalScriptFallback,
  updateTokenMeter,
  generateHourInRangeFunction
} from './utils.js';

// Modules
import { addLoreEntry, buildLorebookScript, generateLorebookScript } from './modules/lorebook.js';
import { buildMemoryScript, generateMemoryScript } from './modules/memory.js';
import { addPacingPhase, addOneTimeEvent, buildPacingScript, generatePacingScript } from './modules/pacing.js';
import { addToneTrigger, buildToneScript, generateToneScript } from './modules/tone.js';
import { addTimeSlot, buildTimeScript, generateTimeScript } from './modules/time.js';
import { addAmbientEvent, buildAmbientScript, generateAmbientScript } from './modules/ambient.js';
import { addRandomEvent, buildRandomScript, generateRandomScript } from './modules/random.js';
import { addCombinedRule, buildCombinedConditionsScript, generateCombinedConditionsScript } from './modules/combined.js';
import { addScoreThreshold, buildScoringScript, generateScoringScript } from './modules/scoring.js';

// Tools
import { analyzeTriggers } from './tools/analyzer.js';
import {
  runScriptTest,
  clearTestResults,
  updateTesterScript,
  toggleBatchMode,
  addBatchTestMessage,
  clearBatchMessages,
  clearBatchResults,
  runBatchTests
} from './tools/tester.js';

// ============================================
// PRESET LOADER
// ============================================

function loadPreset(presetName) {
  if (presetName === 'slowburn') {
    document.getElementById('memNamePhrase').value = 'my name is';
    document.getElementById('memFactsKeywords').value = 'fact, i am, i work as';
    document.getElementById('memLikesKeywords').value = 'i like, i love, favorite';
    document.getElementById('memDislikesKeywords').value = 'i hate, i dislike';

    document.getElementById('pacingPhases').innerHTML = '';
    addPacingPhase();
    var phases = document.querySelectorAll('#pacingPhases .dynamic-item');
    phases[0].querySelector('input[placeholder="Min messages"]').value = '1';
    phases[0].querySelector('input[placeholder="Max messages"]').value = '15';
    phases[0].querySelector('textarea').value = '{{char}} is cautious and formal, still getting to know {{user}}.';

    addPacingPhase();
    phases = document.querySelectorAll('#pacingPhases .dynamic-item');
    phases[1].querySelector('input[placeholder="Min messages"]').value = '16';
    phases[1].querySelector('input[placeholder="Max messages"]').value = '40';
    phases[1].querySelector('textarea').value = '{{char}} is warming up, showing more genuine interest.';

    addPacingPhase();
    phases = document.querySelectorAll('#pacingPhases .dynamic-item');
    phases[2].querySelector('input[placeholder="Min messages"]').value = '41';
    phases[2].querySelector('input[placeholder="Max messages"]').value = '999';
    phases[2].querySelector('textarea').value = '{{char}} feels comfortable and open, deeply engaged.';

    showToast('Slow-Burn Romance preset loaded! Check Memory and Pacing sections.', 'success');
    document.getElementById('memory').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } else if (presetName === 'rpg') {
    document.getElementById('loreEntries').innerHTML = '';
    addLoreEntry();
    var entries = document.querySelectorAll('#loreEntries .dynamic-item');
    entries[0].querySelector('select').value = 'people';
    entries[0].querySelector('input[placeholder="Keywords (comma-separated)"]').value = 'blacksmith, forge';
    entries[0].querySelector('textarea').value = 'The blacksmith Gareth runs the forge. He is gruff but fair, known for masterwork weapons.';

    addLoreEntry();
    entries = document.querySelectorAll('#loreEntries .dynamic-item');
    entries[1].querySelector('select').value = 'places';
    entries[1].querySelector('input[placeholder="Keywords (comma-separated)"]').value = 'tavern, inn';
    entries[1].querySelector('textarea').value = 'The Rusty Tankard tavern is a cozy refuge, always filled with adventurers and rumors.';

    addLoreEntry();
    entries = document.querySelectorAll('#loreEntries .dynamic-item');
    entries[2].querySelector('select').value = 'events';
    entries[2].querySelector('input[placeholder="Keywords (comma-separated)"]').value = 'festival, celebration';
    entries[2].querySelector('textarea').value = 'The annual Harvest Festival brings music, dancing, and competitions to the town square.';

    showToast('RPG Adventure preset loaded! Check Lorebook section.', 'success');
    document.getElementById('lorebook').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } else if (presetName === 'ambient') {
    document.getElementById('ambientEvents').innerHTML = '';
    addAmbientEvent();
    var events = document.querySelectorAll('#ambientEvents .dynamic-item');
    events[0].querySelector('textarea').value = 'A gentle breeze rustles the curtains.';

    addAmbientEvent();
    events = document.querySelectorAll('#ambientEvents .dynamic-item');
    events[1].querySelector('textarea').value = 'The faint sound of traffic hums in the distance.';

    addAmbientEvent();
    events = document.querySelectorAll('#ambientEvents .dynamic-item');
    events[2].querySelector('textarea').value = 'Sunlight filters through the window, casting warm patterns.';

    addAmbientEvent();
    events = document.querySelectorAll('#ambientEvents .dynamic-item');
    events[3].querySelector('textarea').value = 'The smell of fresh coffee lingers in the air.';

    document.getElementById('ambientProbability').value = '15';

    showToast('Ambient Flavor Pack preset loaded! Check Ambient Events section.', 'success');
    document.getElementById('ambient').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } else if (presetName === 'memory') {
    document.getElementById('memNamePhrase').value = 'my name is';
    document.getElementById('memFactsKeywords').value = 'fact, i am, i work, i study';
    document.getElementById('memLikesKeywords').value = 'i like, i love, i enjoy';
    document.getElementById('memDislikesKeywords').value = 'i hate, i dislike, i don\'t like';

    showToast('Memory Starter preset loaded! Check Memory section.', 'success');
    document.getElementById('memory').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ============================================
// RESET AND BATCH OPERATIONS
// ============================================

function resetAllFields() {
  if (!confirm('⚠️ This will clear all fields and reset to defaults. Are you sure?')) {
    return;
  }

  // Reset memory
  document.getElementById('memNamePhrase').value = 'my name is';
  document.getElementById('memFactsKeywords').value = 'fact, i am, i work as, i study';
  document.getElementById('memLikesKeywords').value = 'i like, i love, i enjoy, favorite';
  document.getElementById('memDislikesKeywords').value = 'i hate, i dislike, i don\'t like, can\'t stand';

  // Clear dynamic lists
  document.getElementById('loreEntries').innerHTML = '';
  document.getElementById('timeSlots').innerHTML = '';
  document.getElementById('pacingPhases').innerHTML = '';
  document.getElementById('oneTimeEvents').innerHTML = '';
  document.getElementById('toneTriggers').innerHTML = '';
  document.getElementById('ambientEvents').innerHTML = '';
  document.getElementById('randomEvents').innerHTML = '';
  document.getElementById('combinedRules').innerHTML = '';
  document.getElementById('scoreThresholds').innerHTML = '';

  // Reset other fields
  document.getElementById('timeOffset').value = '0';
  document.getElementById('ambientProbability').value = '10';
  document.getElementById('scoringPositive').value = 'love, great, wonderful, amazing';
  document.getElementById('scoringNegative').value = 'hate, awful, terrible, horrible';
  document.getElementById('scoringMode').value = 'stateless';

  // Clear outputs
  var outputs = ['memoryOutput', 'lorebookOutput', 'timeOutput', 'pacingOutput', 'toneOutput', 'scoringOutput', 'ambientOutput', 'randomOutput', 'combinedOutput', 'finalOutput'];
  outputs.forEach(function(id) {
    document.getElementById(id).textContent = '// Script will appear here after clicking Generate';
  });

  // Restore default toggles
  document.getElementById('toggle-lorebook').checked = true;
  document.getElementById('toggle-memory').checked = true;
  document.getElementById('toggle-pacing').checked = true;
  document.getElementById('toggle-tone').checked = true;

  document.getElementById('toggle-time').checked = false;
  document.getElementById('toggle-ambient').checked = false;
  document.getElementById('toggle-random').checked = false;
  document.getElementById('toggle-combined').checked = false;
  document.getElementById('toggle-scoring').checked = false;

  // Add one default entry for each
  addLoreEntry();
  addTimeSlot();
  addPacingPhase();
  addToneTrigger();
  addAmbientEvent();

  showToast('All fields reset to defaults!', 'success');
}

function generateAllEnabledModules() {
  var items = document.querySelectorAll('#moduleOrder .order-item');
  var enabledModules = [];

  items.forEach(function(item) {
    var module = item.getAttribute('data-module');
    var checkbox = document.getElementById('toggle-' + module);
    if (checkbox && checkbox.checked) {
      enabledModules.push(module);
    }
  });

  if (enabledModules.length === 0) {
    showToast('No modules enabled! Please enable at least one module.', 'warning');
    return;
  }

  // Generate each enabled module
  enabledModules.forEach(function(module) {
    switch(module) {
      case 'memory': generateMemoryScript(); break;
      case 'lorebook': generateLorebookScript(); break;
      case 'time': generateTimeScript(); break;
      case 'pacing': generatePacingScript(); break;
      case 'tone': generateToneScript(); break;
      case 'scoring': generateScoringScript(); break;
      case 'ambient': generateAmbientScript(); break;
      case 'random': generateRandomScript(); break;
      case 'combined': generateCombinedConditionsScript(); break;
    }
  });

  // Then combine
  setTimeout(function() {
    generateFinalCombinedScript();
  }, 100);

  showToast('Generated all ' + enabledModules.length + ' enabled modules and combined them!', 'success');
}

// ============================================
// FINAL COMBINED SCRIPT
// ============================================

function generateFinalCombinedScript() {
  var order = [];
  var items = document.querySelectorAll('#moduleOrder .order-item');

  items.forEach(function(item) {
    var module = item.getAttribute('data-module');
    var checkbox = document.getElementById('toggle-' + module);
    if (checkbox && checkbox.checked) {
      order.push(module);
    }
  });

  if (order.length === 0) {
    showToast('No modules enabled! Please enable at least one module in the Module Control Panel.', 'warning');
    return;
  }

  var finalScript = "";
  finalScript += "// ============================================\n";
  finalScript += "// COMBINED SCRIPT - All Enabled Modules\n";
  finalScript += "// Generated by JanitorAI Script Builder\n";
  finalScript += "// ============================================\n\n";

  // Shared init function (only once for combined script)
  finalScript += "// Shared initialization function\n";
  finalScript += "function initContext() {\n";
  finalScript += "  if (!context.character) context.character = {};\n";
  finalScript += "  if (!context.character.personality) context.character.personality = \"\";\n";
  finalScript += "  if (!context.character.scenario) context.character.scenario = \"\";\n";
  finalScript += "}\n\n";

  // Call it once at the start
  finalScript += "// Initialize context\n";
  finalScript += "initContext();\n\n";

  // Add message_count alias for modules that need it (pacing, combined)
  var needsMessageCount = order.includes('pacing') || order.includes('combined');
  if (needsMessageCount) {
    finalScript += "// Safe message counter alias for pacing/combined modules\n";
    finalScript += "var message_count = (context.chat && typeof context.chat.message_count === 'number')\n";
    finalScript += "  ? context.chat.message_count\n";
    finalScript += "  : 0;\n\n";
  }

  // Check if hourInRange is needed
  var needsHourInRange = order.includes('time') || order.includes('combined');
  if (needsHourInRange) {
    finalScript += generateHourInRangeFunction();
  }

  // Add each enabled module using builder functions with standalone=false
  var activeModuleCount = 0;
  order.forEach(function(module) {
    var moduleScript = '';

    // Call the appropriate builder function with standalone=false
    switch(module) {
      case 'memory':
        moduleScript = buildMemoryScript(false);
        break;
      case 'lorebook':
        moduleScript = buildLorebookScript(false);
        break;
      case 'time':
        moduleScript = buildTimeScript(false);
        break;
      case 'pacing':
        moduleScript = buildPacingScript(false);
        break;
      case 'tone':
        moduleScript = buildToneScript(false);
        break;
      case 'scoring':
        moduleScript = buildScoringScript(false);
        break;
      case 'ambient':
        moduleScript = buildAmbientScript(false);
        break;
      case 'random':
        moduleScript = buildRandomScript(false);
        break;
      case 'combined':
        moduleScript = buildCombinedConditionsScript(false);
        break;
    }

    // Remove module headers for cleaner combined output
    moduleScript = moduleScript.replace(/\/\/ =+\r?\n\/\/ MODULE:.*?\r?\n\/\/ =+\r?\n\r?\n/g, '');
    moduleScript = moduleScript.replace(/function hourInRange\(h, start, end\)[\s\S]*?\}\r?\n\r?\n/g, '');

    if (moduleScript.trim()) {
      finalScript += "// ========== " + module.toUpperCase() + " MODULE ==========\n";
      finalScript += moduleScript.trim() + "\n\n";
      activeModuleCount++;
    }
  });

  document.getElementById("finalOutput").textContent = finalScript;

  // Copy to clipboard (with robust fallback for non-HTTPS / mobile / WebViews)
  var successMsg = 'Complete script copied to clipboard! Total modules: ' + activeModuleCount;
  var fallbackMsg = 'Script generated! Scroll down to see the combined output. Total modules: ' + activeModuleCount;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(finalScript).then(function () {
      showToast(successMsg, 'success');
    }, function () {
      // Clipboard API failed, try legacy method
      copyFinalScriptFallback(finalScript, successMsg, fallbackMsg);
    });
  } else {
    copyFinalScriptFallback(finalScript, successMsg, fallbackMsg);
  }

  updateTokenMeter();
}

// ============================================
// DRAG & DROP FOR MODULE ORDER
// ============================================

function setupDragAndDrop() {
  var draggedItem = null;
  var orderItems = document.querySelectorAll('.order-item');

  orderItems.forEach(function(item) {
    item.addEventListener('dragstart', function(e) {
      draggedItem = this;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
      this.style.opacity = '0.5';
    });

    item.addEventListener('dragend', function(e) {
      this.style.opacity = '';
    });

    item.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (this !== draggedItem) {
        var rect = this.getBoundingClientRect();
        var midpoint = rect.top + rect.height / 2;

        if (e.clientY < midpoint) {
          this.parentNode.insertBefore(draggedItem, this);
        } else {
          this.parentNode.insertBefore(draggedItem, this.nextSibling);
        }
      }
    });
  });
}

// ============================================
// MOBILE MENU
// ============================================

function setupMobileMenu() {
  var toggle = document.getElementById('mobileMenuToggle');
  var sidebar = document.getElementById('janitorSidebar');
  var backdrop = document.getElementById('sidebarBackdrop');

  if (!toggle || !sidebar || !backdrop) return;

  function openMenu() {
    sidebar.classList.add('open');
    backdrop.classList.add('visible');
  }

  function closeMenu() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('visible');
  }

  toggle.addEventListener('click', function() {
    if (sidebar.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  backdrop.addEventListener('click', closeMenu);

  // Close menu when a nav item is clicked (on mobile)
  document.querySelectorAll('.janitor-nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        closeMenu();
      }
    });
  });
}

// ============================================
// SIDEBAR NAVIGATION HELPERS
// ============================================

function scrollToSection(sectionId, clickedElement) {
  var element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Update active state in sidebar
    document.querySelectorAll('.janitor-nav-item').forEach(function(item) {
      item.classList.remove('active');
    });
    if (clickedElement) {
      clickedElement.classList.add('active');
    }
  }
}

// ============================================
// SCROLL SPY - Auto-highlight sidebar on scroll
// ============================================

function setupScrollSpy() {
  // All sections that can be scrolled to
  var sections = document.querySelectorAll('[id]');
  var navItems = document.querySelectorAll('.janitor-nav-item[data-scroll]');

  // Map section IDs to their nav items
  var sectionToNav = {};
  navItems.forEach(function(item) {
    var scrollTarget = item.getAttribute('data-scroll');
    sectionToNav[scrollTarget] = item;
  });

  // Intersection Observer for scroll spy
  var observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px', // Trigger when section is in upper-middle of viewport
    threshold: 0
  };

  var currentActive = null;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var sectionId = entry.target.id;
        var navItem = sectionToNav[sectionId];

        if (navItem && navItem !== currentActive) {
          // Remove active from all nav items
          navItems.forEach(function(item) {
            item.classList.remove('active');
          });
          // Add active to current nav item
          navItem.classList.add('active');
          currentActive = navItem;
        }
      }
    });
  }, observerOptions);

  // Observe all sections that have corresponding nav items
  Object.keys(sectionToNav).forEach(function(sectionId) {
    var section = document.getElementById(sectionId);
    if (section) {
      observer.observe(section);
    }
  });
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
  // Sidebar navigation - scroll buttons (all navigation now uses scroll)
  document.querySelectorAll('.janitor-nav-item[data-scroll]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var sectionId = this.getAttribute('data-scroll');
      scrollToSection(sectionId, this);
    });
  });

  // Preset cards
  document.querySelectorAll('.preset-card[data-preset]').forEach(function(card) {
    card.addEventListener('click', function() {
      var presetName = this.getAttribute('data-preset');
      loadPreset(presetName);
    });
  });

  // Module control panel buttons
  document.getElementById('btnCopyAllModules')?.addEventListener('click', generateFinalCombinedScript);
  document.getElementById('btnGenerateAllModules')?.addEventListener('click', generateAllEnabledModules);
  document.getElementById('btnResetAll')?.addEventListener('click', resetAllFields);

  // Add entry buttons
  document.getElementById('btnAddLoreEntry')?.addEventListener('click', addLoreEntry);
  document.getElementById('btnAddPacingPhase')?.addEventListener('click', addPacingPhase);
  document.getElementById('btnAddOneTimeEvent')?.addEventListener('click', addOneTimeEvent);
  document.getElementById('btnAddToneTrigger')?.addEventListener('click', addToneTrigger);
  document.getElementById('btnAddTimeSlot')?.addEventListener('click', addTimeSlot);
  document.getElementById('btnAddAmbientEvent')?.addEventListener('click', addAmbientEvent);
  document.getElementById('btnAddRandomEvent')?.addEventListener('click', addRandomEvent);
  document.getElementById('btnAddCombinedRule')?.addEventListener('click', addCombinedRule);
  document.getElementById('btnAddScoreThreshold')?.addEventListener('click', addScoreThreshold);

  // Generate script buttons
  document.getElementById('btnGenerateLorebook')?.addEventListener('click', generateLorebookScript);
  document.getElementById('btnGenerateMemory')?.addEventListener('click', generateMemoryScript);
  document.getElementById('btnGeneratePacing')?.addEventListener('click', generatePacingScript);
  document.getElementById('btnGenerateTone')?.addEventListener('click', generateToneScript);
  document.getElementById('btnGenerateTime')?.addEventListener('click', generateTimeScript);
  document.getElementById('btnGenerateAmbient')?.addEventListener('click', generateAmbientScript);
  document.getElementById('btnGenerateRandom')?.addEventListener('click', generateRandomScript);
  document.getElementById('btnGenerateCombined')?.addEventListener('click', generateCombinedConditionsScript);
  document.getElementById('btnGenerateScoring')?.addEventListener('click', generateScoringScript);

  // Analyzer and final output
  document.getElementById('btnAnalyzeTriggers')?.addEventListener('click', analyzeTriggers);
  document.getElementById('btnRegenerateCombined')?.addEventListener('click', generateFinalCombinedScript);

  // Copy to clipboard buttons (using data-copy attribute)
  document.querySelectorAll('[data-copy]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var outputId = this.getAttribute('data-copy');
      copyToClipboard(outputId);
    });
  });

  // Tester controls
  document.getElementById('testerScriptSource')?.addEventListener('change', updateTesterScript);
  document.getElementById('testerBatchMode')?.addEventListener('change', toggleBatchMode);
  document.getElementById('btnRunTest')?.addEventListener('click', runScriptTest);
  document.getElementById('btnClearTestResults')?.addEventListener('click', clearTestResults);
  document.getElementById('btnRunBatchTests')?.addEventListener('click', runBatchTests);
  document.getElementById('btnClearBatchResults')?.addEventListener('click', clearBatchResults);
  document.getElementById('btnAddBatchMessage')?.addEventListener('click', addBatchTestMessage);
  document.getElementById('btnClearBatchMessages')?.addEventListener('click', clearBatchMessages);
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function () {
  // Restore default toggles (prevents stale browser-cached states)
  document.getElementById('toggle-lorebook').checked = true;
  document.getElementById('toggle-memory').checked = true;
  document.getElementById('toggle-pacing').checked = true;
  document.getElementById('toggle-tone').checked = true;

  document.getElementById('toggle-time').checked = false;
  document.getElementById('toggle-ambient').checked = false;
  document.getElementById('toggle-random').checked = false;
  document.getElementById('toggle-combined').checked = false;
  document.getElementById('toggle-scoring').checked = false;

  // Ensure outputs start clean (helps with bfcache / reloads)
  var outputs = [
    'memoryOutput','lorebookOutput','timeOutput','pacingOutput','toneOutput',
    'scoringOutput','ambientOutput','randomOutput','combinedOutput','finalOutput'
  ];
  outputs.forEach(function (id) {
    document.getElementById(id).textContent = '// Script will appear here after clicking Generate';
  });

  // Add one default entry for each dynamic section
  addLoreEntry();
  addTimeSlot();
  addPacingPhase();
  addToneTrigger();
  addAmbientEvent();

  // Setup mobile menu
  setupMobileMenu();

  // Setup event listeners
  setupEventListeners();

  // Setup drag and drop
  setupDragAndDrop();

  // Setup scroll spy for sidebar navigation
  setupScrollSpy();

  updateTokenMeter();
});

// ============================================
// EXPOSE FUNCTIONS TO WINDOW FOR INLINE HANDLERS
// (Fallback for any remaining inline onclick attributes)
// ============================================

window.copyToClipboard = copyToClipboard;
window.loadPreset = loadPreset;
window.resetAllFields = resetAllFields;
window.generateAllEnabledModules = generateAllEnabledModules;
window.generateFinalCombinedScript = generateFinalCombinedScript;
window.addLoreEntry = addLoreEntry;
window.generateLorebookScript = generateLorebookScript;
window.generateMemoryScript = generateMemoryScript;
window.addPacingPhase = addPacingPhase;
window.addOneTimeEvent = addOneTimeEvent;
window.generatePacingScript = generatePacingScript;
window.addToneTrigger = addToneTrigger;
window.generateToneScript = generateToneScript;
window.addTimeSlot = addTimeSlot;
window.generateTimeScript = generateTimeScript;
window.addAmbientEvent = addAmbientEvent;
window.generateAmbientScript = generateAmbientScript;
window.addRandomEvent = addRandomEvent;
window.generateRandomScript = generateRandomScript;
window.addCombinedRule = addCombinedRule;
window.generateCombinedConditionsScript = generateCombinedConditionsScript;
window.addScoreThreshold = addScoreThreshold;
window.generateScoringScript = generateScoringScript;
window.analyzeTriggers = analyzeTriggers;
window.runScriptTest = runScriptTest;
window.clearTestResults = clearTestResults;
window.updateTesterScript = updateTesterScript;
window.toggleBatchMode = toggleBatchMode;
window.addBatchTestMessage = addBatchTestMessage;
window.clearBatchMessages = clearBatchMessages;
window.clearBatchResults = clearBatchResults;
window.runBatchTests = runBatchTests;
