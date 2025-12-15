// ============================================
// UTILITY FUNCTIONS - Shared Helpers
// ============================================

/**
 * Escape a string for safe inclusion in generated script output.
 * Uses JSON.stringify to handle quotes, newlines, special chars, and unicode.
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
export function escapeForScript(str) {
  if (!str) return '';
  // JSON.stringify handles quotes, newlines, special chars, and unicode safely
  // Slice off surrounding quotes, then escape single quotes for JS string literals
  return JSON.stringify(str).slice(1, -1).replace(/'/g, "\\'");
}

/**
 * Escape a string for use in a regular expression.
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
export function escapeForRegex(str) {
  if (!str) return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} text - The text to escape
 * @returns {string} - The escaped HTML string
 */
export function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

let toastContainer = null;
let toastTimeout = null;

/**
 * Show a toast notification message.
 * @param {string} message - The message to display
 * @param {string} type - The type of toast: 'success', 'error', or 'warning'
 */
export function showToast(message, type) {
  type = type || 'success';

  // Create container if it doesn't exist
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  // Clear any existing toast
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  toastContainer.innerHTML = '';

  // Create new toast
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(function() {
    toast.classList.add('show');
  }, 10);

  // Auto-hide after 3 seconds
  toastTimeout = setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// ============================================
// CLIPBOARD FUNCTIONS
// ============================================

/**
 * Copy text from an element to clipboard.
 * @param {string} elementId - The ID of the element containing text to copy
 */
export function copyToClipboard(elementId) {
  var text = document.getElementById(elementId).textContent;

  // Try modern clipboard API first (requires HTTPS)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showToast('Copied to clipboard!', 'success');
    }, function() {
      // If clipboard API fails, fall back to legacy method
      fallbackCopyToClipboard(text);
    });
  } else {
    fallbackCopyToClipboard(text);
  }
}

/**
 * Robust fallback for mobile, WebViews, and non-HTTPS contexts.
 * @param {string} text - The text to copy
 */
export function fallbackCopyToClipboard(text) {
  var textarea = document.createElement('textarea');
  textarea.value = text;

  // Prevent zooming on iOS (font-size < 16px triggers zoom)
  textarea.style.fontSize = '16px';

  // Hide the textarea while keeping it functional
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '2em';
  textarea.style.height = '2em';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';
  textarea.style.opacity = '0';
  textarea.style.zIndex = '-1';

  // Prevent keyboard from appearing on mobile
  textarea.setAttribute('readonly', '');

  document.body.appendChild(textarea);

  // iOS-specific selection method
  if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
    textarea.contentEditable = true;
    textarea.readOnly = true;
    var range = document.createRange();
    range.selectNodeContents(textarea);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    textarea.setSelectionRange(0, 999999);
  } else {
    textarea.select();
  }

  var success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) {
    success = false;
  }

  document.body.removeChild(textarea);

  if (success) {
    showToast('Copied to clipboard!', 'success');
  } else {
    showToast('Failed to copy. Please select and copy manually.', 'error');
  }
}

/**
 * Robust fallback copy for final script (mobile, WebViews, non-HTTPS).
 * @param {string} text - The text to copy
 * @param {string} successMsg - Message to show on success
 * @param {string} fallbackMsg - Message to show if copy fails
 */
export function copyFinalScriptFallback(text, successMsg, fallbackMsg) {
  var textarea = document.createElement('textarea');
  textarea.value = text;

  // Prevent zooming on iOS
  textarea.style.fontSize = '16px';

  // Hide textarea while keeping it functional
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '2em';
  textarea.style.height = '2em';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';
  textarea.style.opacity = '0';
  textarea.style.zIndex = '-1';

  // Prevent keyboard from appearing on mobile
  textarea.setAttribute('readonly', '');

  document.body.appendChild(textarea);

  // iOS-specific selection method
  if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
    textarea.contentEditable = true;
    textarea.readOnly = true;
    var range = document.createRange();
    range.selectNodeContents(textarea);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    textarea.setSelectionRange(0, 999999);
  } else {
    textarea.select();
  }

  var success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) {
    success = false;
  }

  document.body.removeChild(textarea);

  if (success) {
    showToast(successMsg, 'success');
  } else {
    showToast(fallbackMsg, 'success');
  }
}

// ============================================
// TOKEN METER
// ============================================

/**
 * Update the token meter display based on enabled modules.
 */
export function updateTokenMeter() {
  var totalLength = 0;
  var items = document.querySelectorAll('#moduleOrder .order-item');

  items.forEach(function(item) {
    var module = item.getAttribute('data-module');
    var checkbox = document.getElementById('toggle-' + module);
    if (checkbox && checkbox.checked) {
      var outputId = module + 'Output';
      var outputEl = document.getElementById(outputId);
      if (outputEl && !outputEl.textContent.includes('// Script will appear here')) {
        // Ignore outputs that only contain "empty module" notices
        var isNoop = /module currently does nothing|entries configured|triggers configured|slots configured|phases or events configured|keywords configured|events configured|rules configured/i.test(outputEl.textContent);
        if (!isNoop) {
          totalLength += outputEl.textContent.length;
        }
      }
    }
  });

  document.getElementById('tokenCount').textContent = totalLength;
  var percentage = Math.min((totalLength / 10000) * 100, 100);
  document.getElementById('tokenFill').style.width = percentage + '%';
}

// ============================================
// HELPER FUNCTIONS FOR SCRIPT GENERATION
// ============================================

/**
 * Generate the hourInRange helper function for time wrap-around support.
 * This is used by time-based modules.
 * @returns {string} - The hourInRange function as a string
 */
export function generateHourInRangeFunction() {
  return "function hourInRange(h, start, end) {\n" +
         "  return start <= end ? (h >= start && h <= end) : (h >= start || h <= end);\n" +
         "}\n\n";
}

// ============================================
// TAB SWITCHING
// ============================================

/**
 * Switch between tabs in the UI.
 * @param {Event} e - The click event
 * @param {string} tabName - The name of the tab to switch to
 */
export function switchTab(e, tabName) {
  var tabs = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(function(tab) {
    tab.classList.remove('active');
  });
  panels.forEach(function(panel) {
    panel.classList.remove('active');
  });

  e.target.classList.add('active');
  document.getElementById(tabName).classList.add('active');
}
