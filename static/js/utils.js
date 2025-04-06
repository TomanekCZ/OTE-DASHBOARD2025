/**
 * Shared utility functions for OTE application
 */

/**
 * Updates the date and time display in the header
 * This function was previously duplicated across multiple JS files
 */
function updateDateTime() {
  const now = new Date();
  document.getElementById("dateTime").textContent = now.toLocaleString(
    "cs-CZ",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );
}

/**
 * Creates a standard error message for API failures
 * @param {string} elementId - ID of the element to display the error
 * @param {string} message - Error message to display
 */
function showApiError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="error-message">Chyba při načítání dat: ${message}</div>`;
  }
}

/**
 * Format number with Czech locale
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return "-";
  }
  return Number(value).toLocaleString("cs-CZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Export functions for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    updateDateTime,
    showApiError,
    formatNumber,
  };
}
