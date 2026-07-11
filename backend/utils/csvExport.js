/**
 * CSV Export Utility
 * Converts array of objects to CSV string with proper escaping.
 */

/**
 * Escape a CSV field value (wrap in quotes if needed).
 * @param {*} value - The value to escape.
 * @returns {string} Escaped CSV field.
 */
function escapeCSVField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of objects to CSV format.
 * @param {string[]} headers - Column headers.
 * @param {Array<Object>} rows - Array of row objects.
 * @param {string[]} keys - Object keys matching headers in order.
 * @returns {string} CSV formatted string.
 */
export function generateCSV(headers, rows, keys) {
  const headerLine = headers.map(escapeCSVField).join(',');
  const dataLines = rows.map(row =>
    keys.map(key => escapeCSVField(row[key])).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Send CSV as downloadable file response.
 * @param {Object} res - Express response object.
 * @param {string} csvContent - CSV string content.
 * @param {string} filename - Download filename.
 */
export function sendCSVResponse(res, csvContent, filename) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csvContent); // BOM for Excel compatibility
}
