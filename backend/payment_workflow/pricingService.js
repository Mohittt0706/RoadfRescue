import { getHaversineDistance } from '../booking_workflow/dispatch.js';

/**
 * Calculates the complete pricing breakdown for a booking or emergency
 * 
 * @param {object} db - SQLite database
 * @param {string} bookingId - ID of the booking or emergency
 * @param {string} [couponCode] - Optional coupon code to apply
 * @returns {object} Pricing breakdown details
 */
export function calculatePricing(db, bookingId, couponCode = null) {
  // 1. Fetch booking (checks standard bookings first, then fallback to emergencies)
  let booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  let isEmergency = false;

  if (!booking) {
    booking = db.prepare('SELECT * FROM emergencies WHERE id = ?').get(bookingId);
    if (!booking) {
      throw new Error(`Booking/Emergency not found: ${bookingId}`);
    }
    isEmergency = true;
  }

  // 2. Base Price
  const basePrice = booking.price || 999;

  // 3. Distance Charge
  let distanceKm = 0;
  let distanceCharge = 0;
  
  // Calculate distance to mechanic if one is assigned and coords are available
  const mechId = isEmergency ? booking.assigned_mechanic : booking.assigned_mechanic_id;
  if (mechId && booking.latitude && booking.longitude) {
    const override = db.prepare('SELECT latitude, longitude FROM mechanic_locations WHERE mechanic_id = ?').get(mechId);
    const mech = override || db.prepare('SELECT latitude, longitude FROM mechanics WHERE id = ?').get(mechId);
    
    if (mech && mech.latitude && mech.longitude) {
      distanceKm = getHaversineDistance(
        parseFloat(booking.latitude),
        parseFloat(booking.longitude),
        parseFloat(mech.latitude),
        parseFloat(mech.longitude)
      );
      // Charge ₹15 per km after a free radius of 3km
      if (distanceKm > 3) {
        distanceCharge = Math.round((distanceKm - 3) * 15);
      }
    }
  }

  // 4. Surcharges
  let emergencySurcharge = 0;
  let nightSurcharge = 0;
  let holidaySurcharge = 0;

  // Emergency Priority Surcharge
  const priority = booking.priority || 'Normal';
  if (priority === 'Critical') {
    emergencySurcharge = 300;
  } else if (priority === 'Urgent') {
    emergencySurcharge = 150;
  }

  // Night Surcharge (10 PM to 6 AM)
  const bookingTimeStr = isEmergency ? booking.created_time : booking.booking_time;
  const bookingDate = new Date(bookingTimeStr);
  const hour = bookingDate.getHours();
  if (hour >= 22 || hour < 6) {
    nightSurcharge = 150;
  }

  // Holiday / Weekend Surcharge (Sat or Sun)
  const day = bookingDate.getDay();
  if (day === 0 || day === 6) {
    holidaySurcharge = 100;
  }

  // 5. Platform Fee
  const platformFee = 49;

  // Calculate gross subtotal before discounts
  const subtotal = basePrice + distanceCharge + emergencySurcharge + nightSurcharge + holidaySurcharge + platformFee;

  // 6. Coupon Discount
  let discount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(couponCode.toUpperCase().trim());
    if (coupon) {
      const now = new Date();
      const expiry = coupon.expiry_date ? new Date(coupon.expiry_date) : null;
      
      const isExpired = expiry && now > expiry;
      const limitReached = coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit;
      const meetsMinVal = subtotal >= coupon.min_order_value;

      if (!isExpired && !limitReached && meetsMinVal) {
        appliedCoupon = coupon.code;
        if (coupon.discount_type === 'percentage') {
          discount = Math.round(subtotal * (coupon.discount_value / 100));
        } else {
          // Flat discount
          discount = Math.min(coupon.discount_value, subtotal);
        }
      }
    }
  }

  // 7. GST / Taxes (18% GST)
  const taxableAmount = Math.max(0, subtotal - discount);
  const gstAmount = Math.round(taxableAmount * 0.18);

  // 8. Final Payable Amount
  const finalAmount = taxableAmount + gstAmount;

  return {
    bookingId,
    isEmergency,
    basePrice,
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    distanceCharge,
    emergencySurcharge,
    nightSurcharge,
    holidaySurcharge,
    platformFee,
    subtotal,
    appliedCoupon,
    discount,
    taxableAmount,
    gstPercentage: 18,
    gstAmount,
    finalAmount
  };
}
