/**
 * Price Calculator Utility
 *
 * Pure calculation functions for pricing operations.
 * No database access - only math operations.
 * Used by PricingService and TaxService for core calculations.
 */

/**
 * Apply a multiplier to a base amount.
 * @param {number} base - Base amount
 * @param {number} multiplier - Multiplier (e.g., 1.15 for 15% increase)
 * @returns {number} Result rounded to 2 decimal places
 */
export function applyMultiplier(base, multiplier) {
  return Math.round(base * multiplier * 100) / 100;
}

/**
 * Apply a fixed charge to an amount.
 * @param {number} amount - Current amount
 * @param {number} charge - Fixed charge to add
 * @returns {number} Result rounded to 2 decimal places
 */
export function addFixedCharge(amount, charge) {
  return Math.round((amount + charge) * 100) / 100;
}

/**
 * Apply a percentage discount.
 * @param {number} amount - Current amount
 * @param {number} percentage - Discount percentage (0-100)
 * @returns {object} { discounted, discountAmount }
 */
export function applyPercentageDiscount(amount, percentage) {
  const discountAmount = Math.round((amount * percentage / 100) * 100) / 100;
  const discounted = Math.round(Math.max(0, amount - discountAmount) * 100) / 100;
  return { discounted, discountAmount };
}

/**
 * Apply a flat discount.
 * @param {number} amount - Current amount
 * @param {number} flatDiscount - Flat discount amount
 * @returns {object} { discounted, discountAmount }
 */
export function applyFlatDiscount(amount, flatDiscount) {
  const discountAmount = Math.min(flatDiscount, amount);
  const discounted = Math.round((amount - discountAmount) * 100) / 100;
  return { discounted, discountAmount };
}

/**
 * Calculate GST for an amount.
 * @param {number} amount - Taxable amount
 * @param {number} gstRate - GST rate in percentage (e.g., 18 for 18%)
 * @returns {number} GST amount rounded to 2 decimal places
 */
export function calculateGST(amount, gstRate) {
  return Math.round((amount * gstRate / 100) * 100) / 100;
}

/**
 * Calculate total with GST.
 * @param {number} amount - Base amount
 * @param {number} gstRate - GST rate in percentage
 * @returns {object} { base, gstAmount, total }
 */
export function totalWithGST(amount, gstRate) {
  const gstAmount = calculateGST(amount, gstRate);
  const total = Math.round((amount + gstAmount) * 100) / 100;
  return { base: amount, gstAmount, total };
}

/**
 * Calculate emergency surcharge.
 * @param {number} basePrice - Base price
 * @param {number} multiplier - Emergency multiplier (e.g., 1.5 for 50% increase)
 * @param {number} fixedCharge - Fixed emergency charge
 * @param {number} priorityCharge - Priority-based charge
 * @returns {object} { adjustedPrice, emergencyCharge, total }
 */
export function calculateEmergencySurcharge(basePrice, multiplier, fixedCharge = 0, priorityCharge = 0) {
  const adjustedPrice = applyMultiplier(basePrice, multiplier);
  const emergencyCharge = addFixedCharge(fixedCharge, priorityCharge);
  const total = addFixedCharge(adjustedPrice, emergencyCharge);
  return { adjustedPrice, emergencyCharge, total };
}

/**
 * Round to specified decimal places.
 * @param {number} value - Value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded value
 */
export function roundTo(value, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Validate a price value.
 * @param {number} price - Price to validate
 * @returns {boolean} True if valid (non-negative number)
 */
export function isValidPrice(price) {
  return typeof price === 'number' && !isNaN(price) && price >= 0;
}
