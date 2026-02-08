/**
 * GST Calculation Utility for Hotel Room Bookings (India)
 * 
 * GST Slabs (2025/2026):
 * - Up to ₹1,000: 0% GST
 * - ₹1,001 - ₹7,500: 5% GST
 * - Above ₹7,500: 18% GST
 */

/**
 * Calculate GST percentage based on room tariff per night
 * @param {number} pricePerNight - Room price per night
 * @returns {number} GST percentage (0, 5, or 18)
 */
export function getGSTSlabPercentage(pricePerNight) {
  if (pricePerNight <= 1000) {
    return 0
  } else if (pricePerNight <= 7500) {
    return 5
  } else {
    return 18
  }
}

/**
 * Calculate GST for a booking
 * @param {number} baseAmount - Base amount before tax
 * @param {number|null} customGSTPercentage - Custom GST percentage set by admin (optional)
 * @param {number} pricePerNight - Price per night for slab calculation
 * @returns {Object} { gstPercentage, gstAmount, totalAmount }
 */
export function calculateGST(baseAmount, customGSTPercentage = null, pricePerNight = null) {
  // Determine GST percentage
  let gstPercentage
  
  if (customGSTPercentage !== null && customGSTPercentage !== undefined) {
    // Use admin-defined GST percentage
    gstPercentage = Number(customGSTPercentage)
  } else {
    // Use slab-based calculation
    const rateToCheck = pricePerNight || baseAmount
    gstPercentage = getGSTSlabPercentage(rateToCheck)
  }
  
  // Calculate GST amount
  const gstAmount = Math.round((baseAmount * gstPercentage) / 100)
  
  // Calculate total
  const totalAmount = baseAmount + gstAmount
  
  return {
    gstPercentage,
    gstAmount,
    totalAmount,
    baseAmount
  }
}

/**
 * Format GST display text
 * @param {number} gstPercentage 
 * @returns {string}
 */
export function formatGSTLabel(gstPercentage) {
  if (gstPercentage === 0) {
    return 'No GST'
  }
  return `GST (${gstPercentage}%)`
}
