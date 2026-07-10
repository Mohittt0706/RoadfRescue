import { Router } from 'express';
import { EmergencyDb } from '../emergencyDb.js';
import { verifyAdmin, verifyToken } from '../authentication/middleware.js';
import { insertAuditLog, getClientIP } from '../utils/auditLogger.js';

const router = Router();

const EMERGENCY_PRICES = {
  'Flat Tire': { base: 699, range: [500, 1000] },
  'Dead Battery': { base: 999, range: [800, 1500] },
  'Fuel Delivery': { base: 799, range: [700, 1200] },
  'Car Towing': { base: 1999, range: [1500, 3000] },
  'Engine Breakdown': { base: 1499, range: [1000, 2500] },
  'Lockout Assistance': { base: 899, range: [700, 1200] },
  'Accident': { base: 2499, range: [2000, 5000] },
  'Other': { base: 999, range: [800, 1500] }
};

const ETA_ESTIMATES = {
  'Flat Tire': { min: 15, max: 25 },
  'Dead Battery': { min: 10, max: 20 },
  'Fuel Delivery': { min: 20, max: 30 },
  'Car Towing': { min: 25, max: 40 },
  'Engine Breakdown': { min: 20, max: 35 },
  'Lockout Assistance': { min: 10, max: 20 },
  'Accident': { min: 15, max: 30 },
  'Other': { min: 15, max: 30 }
};

function generateEmergencyId() {
  const year = new Date().getFullYear();
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return `RR-${year}-${randNum}`;
}

function generateInvoiceId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${rand}`;
}

function isValidPhone(phone) {
  const cleaned = phone.replace(/[\s\-+]/g, '');
  return /^91\d{10}$|^\d{10}$/.test(cleaned);
}

function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidVehicleNumber(vn) {
  return /^[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,2}[\s-]?\d{1,4}$/i.test(vn);
}

function calculatePrice(emergencyType, priority) {
  const basePrice = EMERGENCY_PRICES[emergencyType]?.base || 999;
  let multiplier = 1;
  if (priority === 'Urgent') multiplier = 1.25;
  if (priority === 'Critical') multiplier = 1.5;
  return Math.round(basePrice * multiplier);
}

function calculateETA(emergencyType, priority) {
  const eta = ETA_ESTIMATES[emergencyType] || { min: 15, max: 30 };
  let min = eta.min;
  let max = eta.max;
  if (priority === 'Critical') { min = Math.max(5, min - 5); max = Math.max(10, max - 10); }
  if (priority === 'Urgent') { min = Math.max(8, min - 3); max = Math.max(12, max - 5); }
  return { min, max, text: `${min}-${max} mins`, minutes: Math.round((min + max) / 2) };
}

async function checkDuplicate(phone, emergencyType, latitude, longitude, db) {
  const recent = await EmergencyDb.findRecentByPhone(phone, 10, db);
  if (!recent || recent.length === 0) return false;
  
  return recent.some(e => {
    if (e.emergency_type !== emergencyType) return false;
    if (!latitude || !longitude || !e.latitude || !e.longitude) return false;
    const dist = Math.sqrt(
      Math.pow((e.latitude - latitude) * 111, 2) + 
      Math.pow((e.longitude - longitude) * 111 * Math.cos(latitude * Math.PI / 180), 2)
    );
    return dist < 0.5;
  });
}

// POST /api/emergency - Create an emergency request (Public/User access allowed)
router.post('/', async (req, res) => {
  const { db, io } = req;
  const {
    customer_name, phone, email, vehicle, vehicle_number,
    emergency_type, latitude, longitude, address, notes,
    payment_method, priority
  } = req.body;

  if (!customer_name) return res.status(400).json({ error: 'Customer Name is required.' });
  if (!phone) return res.status(400).json({ error: 'Mobile Number is required.' });
  if (!vehicle) return res.status(400).json({ error: 'Vehicle Type is required.' });
  if (!vehicle_number) return res.status(400).json({ error: 'Vehicle Number is required.' });
  if (!emergency_type) return res.status(400).json({ error: 'Emergency Type is required.' });

  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Mobile Number must contain 10 digits.' });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }

  if (!isValidVehicleNumber(vehicle_number)) {
    return res.status(400).json({ error: 'Invalid vehicle number format. Example: MH-12-XX-9999' });
  }

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'GPS Location missing.' });
  }

  try {
    const isDuplicate = await checkDuplicate(phone, emergency_type, latitude, longitude, db);
    if (isDuplicate) {
      return res.status(409).json({ 
        error: 'Similar emergency request already exists. Please wait for your existing request to be processed.' 
      });
    }
  } catch (dupError) {
    console.error('Duplicate Check Error:', dupError);
  }

  const emergencyId = generateEmergencyId();
  const price = calculatePrice(emergency_type, priority || 'Normal');
  const eta = calculateETA(emergency_type, priority || 'Normal');

  const newRequest = {
    id: emergencyId,
    customer_name,
    phone,
    email: email || '',
    vehicle,
    vehicle_number,
    emergency_type,
    price,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    address: address || 'Ahmedabad, India',
    notes: notes || '',
    priority: priority || 'Normal',
    status: 'Pending',
    created_time: new Date(),
    updated_time: new Date(),
    assigned_mechanic: null,
    eta: eta.text,
    eta_minutes: eta.minutes,
    payment_method: payment_method || 'UPI',
    payment_status: 'Pending',
    invoice_id: null,
    total_distance_km: 0
  };

  try {
    const saved = await EmergencyDb.create(newRequest, db);

    const notiId = `noti-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const notiTitle = '🚨 New Emergency Request';
    const notiMessage = `Customer: ${customer_name} requires ${emergency_type} (₹${price.toLocaleString('en-IN')})`;
    
    try {
      db.prepare(`
        INSERT INTO notifications (id, type, title, message, booking_id, read, target_role)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(notiId, 'new_emergency', notiTitle, notiMessage, null, 0, 'admin');
    } catch (notiError) {
      console.error('Database Notification Error:', notiError);
    }

    io.to('admin_room').emit('new_emergency', {
      emergency: saved,
      notification: {
        id: notiId,
        type: 'new_emergency',
        title: notiTitle,
        message: notiMessage,
        emergencyId: saved.id,
        read: 0,
        time: new Date().toLocaleTimeString('en-IN')
      }
    });

    res.status(201).json({
      success: true,
      emergencyId: saved.id,
      booking: saved,
      eta: saved.eta
    });
  } catch (error) {
    console.error('Error creating emergency request:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// GET /api/emergency - List all emergency requests (Admin Only)
router.get('/', verifyAdmin, async (req, res) => {
  const { db } = req;
  try {
    const list = await EmergencyDb.find({}, db);
    res.json(list);
  } catch (error) {
    console.error('Error listing emergencies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/emergency/:id - Get specific emergency detail (Public/Tracking page access)
router.get('/:id', async (req, res) => {
  const { db } = req;
  const { id } = req.params;
  try {
    const emergency = await EmergencyDb.findById(id, db);
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }
    res.json(emergency);
  } catch (error) {
    console.error('Error fetching emergency:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/emergency/:id - Update emergency details (Admin/Owner Allowed)
router.put('/:id', async (req, res) => {
  const { db, io } = req;
  const { id } = req.params;
  
  const allowedFields = ['address', 'notes', 'priority', 'payment_method'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }
  updates.updated_time = new Date();

  try {
    const updated = await EmergencyDb.findByIdAndUpdate(id, updates, db);
    if (!updated) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    // Audit log for emergency update
    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'UPDATE',
      entity: 'emergency',
      entityId: id,
      description: `Updated emergency request for ${updated.customer_name}`,
      ipAddress: getClientIP(req),
    });

    io.to(`emergency_track_${id}`).emit('emergency_update', updated);
    io.to('admin_room').emit('emergency_list_update', updated);

    res.json({ success: true, emergency: updated });
  } catch (error) {
    console.error('Error updating emergency:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/emergency/:id - Delete emergency request (Admin Only)
router.delete('/:id', verifyAdmin, async (req, res) => {
  const { db, io } = req;
  const { id } = req.params;
  try {
    const deleted = await EmergencyDb.findByIdAndDelete(id, db);
    if (!deleted) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    // Audit log for emergency deletion
    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'DELETE',
      entity: 'emergency',
      entityId: id,
      description: `Deleted emergency request for ${deleted.customer_name} (${deleted.emergency_type})`,
      ipAddress: getClientIP(req),
    });

    io.to('admin_room').emit('emergency_deleted', { id });
    res.json({ success: true, message: 'Emergency request deleted' });
  } catch (error) {
    console.error('Error deleting emergency:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/emergency/assign - Assign mechanic to emergency (Admin Only)
router.post('/assign', verifyAdmin, async (req, res) => {
  const { db, io } = req;
  const { id, mechanic_name, eta, price } = req.body;

  if (!id || !mechanic_name) {
    return res.status(400).json({ error: 'Missing emergency ID or mechanic name' });
  }

  try {
    const updates = {
      assigned_mechanic: mechanic_name,
      status: 'Mechanic Assigned',
      updated_time: new Date()
    };
    
    if (eta) {
      updates.eta = eta;
      const match = eta.match(/(\d+)-(\d+)/);
      if (match) {
        updates.eta_minutes = Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
      }
    }
    
    if (price !== undefined) {
      updates.price = parseFloat(price);
    }

    const updated = await EmergencyDb.findByIdAndUpdate(id, updates, db);

    if (!updated) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    // Audit log for emergency mechanic assignment
    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'UPDATE',
      entity: 'emergency',
      entityId: id,
      description: `Assigned mechanic "${mechanic_name}" to emergency for ${updated.customer_name}`,
      ipAddress: getClientIP(req),
    });

    io.to(`emergency_track_${id}`).emit('emergency_update', updated);
    io.to('admin_room').emit('emergency_list_update', updated);

    res.json({ success: true, emergency: updated });
  } catch (error) {
    console.error('Error assigning mechanic:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/emergency/status - Update emergency status (Admin/Mechanic access)
router.post('/status', verifyToken, async (req, res) => {
  const { db, io } = req;
  const { id, status } = req.body;
  const { role } = req.user;

  if (!id || !status) {
    return res.status(400).json({ error: 'Missing emergency ID or status' });
  }

  // Only admins and mechanics can update emergency status
  if (role !== 'admin' && role !== 'super_admin' && role !== 'mechanic') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const validStatuses = ['Pending', 'Accepted', 'Mechanic Assigned', 'Mechanic En Route', 'Arrived', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const updates = { status, updated_time: new Date() };
    
    if (status === 'Completed') {
      updates.payment_status = 'Paid';
      updates.invoice_id = generateInvoiceId();
    }
    
    if (status === 'Cancelled') {
      updates.payment_status = 'Cancelled';
    }

    const updated = await EmergencyDb.findByIdAndUpdate(id, updates, db);
    if (!updated) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    // Audit log for emergency status change
    insertAuditLog(db, {
      adminId: req.user.id,
      action: 'STATUS_CHANGE',
      entity: 'emergency',
      entityId: id,
      description: `Emergency status changed to "${status}" for ${updated.customer_name}`,
      ipAddress: getClientIP(req),
    });

    io.to(`emergency_track_${id}`).emit('emergency_update', updated);
    io.to('admin_room').emit('emergency_list_update', updated);

    res.json({ success: true, emergency: updated });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/emergency/price - Update emergency price (Admin Only)
router.post('/price', verifyAdmin, async (req, res) => {
  const { db, io } = req;
  const { id, price } = req.body;

  if (!id || price === undefined) {
    return res.status(400).json({ error: 'Missing emergency ID or price' });
  }

  try {
    const updated = await EmergencyDb.findByIdAndUpdate(id, { 
      price: parseFloat(price),
      updated_time: new Date()
    }, db);
    
    if (!updated) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    io.to(`emergency_track_${id}`).emit('emergency_update', updated);
    io.to('admin_room').emit('emergency_list_update', updated);

    res.json({ success: true, emergency: updated });
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/emergency/eta - Update emergency ETA (Admin Only)
router.post('/eta', verifyAdmin, async (req, res) => {
  const { db, io } = req;
  const { id, eta, eta_minutes } = req.body;

  if (!id || !eta) {
    return res.status(400).json({ error: 'Missing emergency ID or ETA' });
  }

  try {
    const updates = { eta, updated_time: new Date() };
    if (eta_minutes !== undefined) {
      updates.eta_minutes = parseInt(eta_minutes);
    } else {
      const match = eta.match(/(\d+)-(\d+)/);
      if (match) {
        updates.eta_minutes = Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
      }
    }

    const updated = await EmergencyDb.findByIdAndUpdate(id, updates, db);
    if (!updated) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    io.to(`emergency_track_${id}`).emit('emergency_update', updated);
    io.to('admin_room').emit('emergency_list_update', updated);

    res.json({ success: true, emergency: updated });
  } catch (error) {
    console.error('Error updating ETA:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/emergency/payment - Update payment status (Admin Only)
router.post('/payment', verifyAdmin, async (req, res) => {
  const { db, io } = req;
  const { id, payment_status, payment_method } = req.body;

  if (!id || !payment_status) {
    return res.status(400).json({ error: 'Missing emergency ID or payment status' });
  }

  const validPaymentStatuses = ['Pending', 'Paid', 'Failed', 'Refunded', 'Cancelled'];
  if (!validPaymentStatuses.includes(payment_status)) {
    return res.status(400).json({ error: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}` });
  }

  try {
    const updates = { payment_status, updated_time: new Date() };
    if (payment_method) {
      updates.payment_method = payment_method;
    }
    if (payment_status === 'Paid' && !req.body.invoice_id) {
      updates.invoice_id = generateInvoiceId();
    }

    const updated = await EmergencyDb.findByIdAndUpdate(id, updates, db);
    if (!updated) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    io.to(`emergency_track_${id}`).emit('emergency_update', updated);
    io.to('admin_room').emit('emergency_list_update', updated);

    res.json({ success: true, emergency: updated });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/emergency/invoice/:id - Generate invoice data (Public/User tracking)
router.get('/invoice/:id', async (req, res) => {
  const { db } = req;
  const { id } = req.params;
  
  try {
    const emergency = await EmergencyDb.findById(id, db);
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const invoice = {
      invoice_id: emergency.invoice_id || generateInvoiceId(),
      emergency_id: emergency.id,
      customer_name: emergency.customer_name,
      phone: emergency.phone,
      email: emergency.email,
      vehicle: emergency.vehicle,
      vehicle_number: emergency.vehicle_number,
      emergency_type: emergency.emergency_type,
      price: emergency.price,
      payment_method: emergency.payment_method,
      payment_status: emergency.payment_status,
      status: emergency.status,
      assigned_mechanic: emergency.assigned_mechanic,
      eta: emergency.eta,
      address: emergency.address,
      created_time: emergency.created_time,
      completed_time: emergency.status === 'Completed' ? emergency.updated_time : null,
      items: [
        { description: `${emergency.emergency_type} Service`, amount: emergency.price },
        { description: 'Service Call Fee', amount: 0, note: 'Included' },
        { description: 'GST (18%)', amount: Math.round(emergency.price * 0.18) }
      ],
      total: Math.round(emergency.price * 1.18)
    };

    res.json(invoice);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
