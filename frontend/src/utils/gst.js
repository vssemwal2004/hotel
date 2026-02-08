/**
 * GST Calculation Utility for Hotel Room Bookings (India - Frontend)
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
 * @param {Object} roomType - Room type object with GST configuration
 * @param {number} pricePerNight - Price per night for slab calculation
 * @returns {Object} { gstPercentage, gstAmount, totalAmount, baseAmount, gstEnabled }
 */
export function calculateGST(baseAmount, roomType = {}, pricePerNight = null) {
  // Check if GST is enabled for this room type
  const gstEnabled = roomType.gstEnabled !== false // Default true
  
  if (!gstEnabled) {
    return {
      gstPercentage: 0,
      gstAmount: 0,
      totalAmount: baseAmount,
      baseAmount,
      gstEnabled: false
    }
  }
  
  // Determine GST percentage
  let gstPercentage
  
  if (roomType.gstPercentage !== null && roomType.gstPercentage !== undefined && roomType.gstPercentage !== '') {
    // Use admin-defined GST percentage
    gstPercentage = Number(roomType.gstPercentage)
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
    baseAmount,
    gstEnabled: true
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
  return `Taxes & Fees (${gstPercentage}% GST)`
}
