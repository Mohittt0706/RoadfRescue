import PDFDocument from 'pdfkit';
import fs from 'fs';
import { join } from 'path';

/**
 * Generates a professional PDF invoice for a completed booking payment
 * 
 * @param {object} db - SQLite database connection
 * @param {string} bookingId - ID of the booking/emergency
 * @param {object} pricing - Detailed pricing breakdown from PricingEngine
 * @param {object} payment - Payment record details
 * @returns {Promise<string>} Saved PDF invoice relative file path
 */
export async function generateInvoice(db, bookingId, pricing, payment) {
  const invoicesDir = join(process.cwd(), 'uploads', 'invoices');
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }

  // Fetch customer details
  let customerName = 'Guest Customer';
  let customerPhone = 'N/A';
  let serviceName = 'Roadside Assistance';

  if (pricing.isEmergency) {
    const emergency = db.prepare('SELECT customer_name, phone, emergency_type FROM emergencies WHERE id = ?').get(bookingId);
    if (emergency) {
      customerName = emergency.customer_name;
      customerPhone = emergency.phone;
      serviceName = `SOS - ${emergency.emergency_type}`;
    }
  } else {
    const booking = db.prepare('SELECT customer_name, phone, service_name FROM bookings WHERE id = ?').get(bookingId);
    if (booking) {
      customerName = booking.customer_name;
      customerPhone = booking.phone;
      serviceName = booking.service_name;
    }
  }

  // Fetch mechanic details
  let mechanicName = 'Unassigned Partner';
  const mechId = pricing.isEmergency ? 
    db.prepare('SELECT assigned_mechanic FROM emergencies WHERE id = ?').get(bookingId)?.assigned_mechanic : 
    db.prepare('SELECT assigned_mechanic_id FROM bookings WHERE id = ?').get(bookingId)?.assigned_mechanic_id;

  if (mechId) {
    const mech = db.prepare('SELECT name FROM mechanics WHERE id = ?').get(mechId);
    if (mech) mechanicName = mech.name;
  }

  const invoiceNumber = `INV-${Date.now()}`;
  const filename = `${invoiceNumber}.pdf`;
  const filePath = join(invoicesDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // --- Header (Premium Styling) ---
      doc.fillColor('#FF3B30').fontSize(24).text('RoadRescue', 50, 50, { bold: true });
      doc.fillColor('#555555').fontSize(10).text('Emergency Roadside Assistance Partner', 50, 80);
      
      doc.fillColor('#222222').fontSize(16).text('TAX INVOICE', 400, 50, { align: 'right' });
      doc.fillColor('#777777').fontSize(9)
         .text(`Invoice No: ${invoiceNumber}`, 400, 75, { align: 'right' })
         .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 400, 90, { align: 'right' })
         .text(`Booking ID: ${bookingId}`, 400, 105, { align: 'right' });

      // Horizontal line
      doc.strokeColor('#E0E0E0').lineWidth(1).moveTo(50, 130).lineTo(550, 130).stroke();

      // --- Billing Details ---
      doc.fillColor('#222222').fontSize(11).text('Billed To:', 50, 150, { bold: true });
      doc.fillColor('#555555').fontSize(9)
         .text(`Name: ${customerName}`, 50, 165)
         .text(`Mobile: ${customerPhone}`, 50, 180);

      doc.fillColor('#222222').fontSize(11).text('Assigned Technician:', 350, 150, { bold: true });
      doc.fillColor('#555555').fontSize(9)
         .text(`Name: ${mechanicName}`, 350, 165)
         .text(`Service Type: ${serviceName}`, 350, 180);

      // Horizontal line
      doc.strokeColor('#E0E0E0').lineWidth(1).moveTo(50, 210).lineTo(550, 210).stroke();

      // --- Invoice Items Grid Table ---
      const tableTop = 230;
      doc.fillColor('#222222').fontSize(10)
         .text('Description', 50, tableTop, { bold: true })
         .text('Amount (INR)', 450, tableTop, { align: 'right', bold: true });

      // Grid line
      doc.strokeColor('#999999').lineWidth(1).moveTo(50, 245).lineTo(550, 245).stroke();

      let currentHeight = 260;

      const drawItemRow = (label, value) => {
        if (value > 0) {
          doc.fillColor('#555555').fontSize(9).text(label, 50, currentHeight);
          doc.fillColor('#222222').fontSize(9).text(`₹${value.toLocaleString('en-IN')}`, 450, currentHeight, { align: 'right' });
          currentHeight += 20;
        }
      };

      drawItemRow(`Base Charge (${serviceName})`, pricing.basePrice);
      drawItemRow(`Distance Surcharge (${pricing.distanceKm} km)`, pricing.distanceCharge);
      drawItemRow('Emergency Priority Surcharge', pricing.emergencySurcharge);
      drawItemRow('Night Shift Surcharge', pricing.nightSurcharge);
      drawItemRow('Weekend/Holiday Surcharge', pricing.holidaySurcharge);
      drawItemRow('Platform Fee', pricing.platformFee);

      // Grid line
      doc.strokeColor('#E0E0E0').lineWidth(0.5).moveTo(50, currentHeight).lineTo(550, currentHeight).stroke();
      currentHeight += 10;

      // Draw discount row
      if (pricing.discount > 0) {
        doc.fillColor('#FF3B30').fontSize(9).text(`Coupon Applied (${pricing.appliedCoupon})`, 50, currentHeight);
        doc.fillColor('#FF3B30').fontSize(9).text(`-₹${pricing.discount.toLocaleString('en-IN')}`, 450, currentHeight, { align: 'right' });
        currentHeight += 20;
      }

      // Draw GST row
      drawItemRow(`GST/Tax (18%)`, pricing.gstAmount);

      // Grid line
      doc.strokeColor('#222222').lineWidth(1).moveTo(50, currentHeight).lineTo(550, currentHeight).stroke();
      currentHeight += 10;

      // Final total
      doc.fillColor('#222222').fontSize(12).text('Total Paid (INR)', 50, currentHeight, { bold: true });
      doc.fillColor('#222222').fontSize(12).text(`₹${pricing.finalAmount.toLocaleString('en-IN')}`, 450, currentHeight, { align: 'right', bold: true });
      currentHeight += 30;

      // --- Payment Information ---
      doc.fillColor('#222222').fontSize(10).text('Payment Information:', 50, currentHeight, { bold: true });
      doc.fillColor('#555555').fontSize(8)
         .text(`Payment Gateway: ${payment.gateway || 'Razorpay'}`, 50, currentHeight + 15)
         .text(`Payment Status: Captured`, 50, currentHeight + 27)
         .text(`Transaction Reference: ${payment.transaction_reference || 'N/A'}`, 50, currentHeight + 39)
         .text(`Gateway Order ID: ${payment.order_id || 'N/A'}`, 50, currentHeight + 51);

      // --- Footer ---
      doc.fillColor('#999999').fontSize(8).text('Thank you for choosing RoadRescue. Safety is our priority.', 50, 700, { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        const relativePath = `/uploads/invoices/${filename}`;
        // Update payment table with invoice path
        db.prepare('UPDATE workflow_payments SET invoice_path = ? WHERE id = ?').run(relativePath, payment.id);
        resolve(relativePath);
      });

      writeStream.on('error', (streamErr) => {
        reject(streamErr);
      });
    } catch (docErr) {
      reject(docErr);
    }
  });
}
