import mongoose from 'mongoose';

const EmergencySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer_name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  vehicle: { type: String, required: true },
  vehicle_number: { type: String, required: true },
  emergency_type: { type: String, required: true },
  price: { type: Number, default: 0 },
  latitude: { type: Number },
  longitude: { type: Number },
  address: { type: String },
  notes: { type: String },
  priority: { type: String, default: 'Normal' },
  status: { type: String, default: 'Pending' },
  created_time: { type: Date, default: Date.now },
  updated_time: { type: Date, default: Date.now },
  assigned_mechanic: { type: String, default: null },
  eta: { type: String, default: null },
  eta_minutes: { type: Number, default: 0 },
  payment_method: { type: String, default: 'UPI' },
  payment_status: { type: String, default: 'Pending' },
  invoice_id: { type: String, default: null },
  total_distance_km: { type: Number, default: 0 }
});

let EmergencyModel = null;
let isMongoConnected = false;

// Async function to connect to MongoDB
export async function connectMongo() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roadrescue';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    EmergencyModel = mongoose.model('Emergency', EmergencySchema);
    isMongoConnected = true;
    console.log('Connected to MongoDB successfully for Emergency Requests.');
  } catch (err) {
    console.error('MongoDB Connection Error Stack:', err.stack || err);
    console.warn('MongoDB connection failed or is offline. Using SQLite fallback for Emergency Requests.');
  }
}

// Start connection attempt immediately
connectMongo();

export const EmergencyDb = {
  isMongo() {
    return isMongoConnected && EmergencyModel !== null;
  },

  async create(data, db) {
    if (this.isMongo()) {
      const emergency = new EmergencyModel(data);
      return await emergency.save();
    } else {
      const nowStr = new Date().toISOString();
      db.prepare(`
        INSERT INTO emergencies (
          id, customer_name, phone, email, vehicle, vehicle_number, 
          emergency_type, price, latitude, longitude, address, notes, 
          priority, status, created_time, updated_time, 
          assigned_mechanic, eta, eta_minutes, payment_method, 
          payment_status, invoice_id, total_distance_km
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.id,
        data.customer_name,
        data.phone,
        data.email || '',
        data.vehicle,
        data.vehicle_number,
        data.emergency_type,
        data.price || 0,
        data.latitude || 23.0225,
        data.longitude || 72.5714,
        data.address || '',
        data.notes || '',
        data.priority || 'Normal',
        data.status || 'Pending',
        nowStr,
        nowStr,
        data.assigned_mechanic || null,
        data.eta || null,
        data.eta_minutes || 0,
        data.payment_method || 'UPI',
        data.payment_status || 'Pending',
        data.invoice_id || null,
        data.total_distance_km || 0
      );
      return this.findById(data.id, db);
    }
  },

  async find(filters = {}, db) {
    if (this.isMongo()) {
      return await EmergencyModel.find(filters).sort({ created_time: -1 });
    } else {
      let query = 'SELECT * FROM emergencies WHERE 1=1';
      const params = [];
      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }
      if (filters.priority) {
        query += ' AND priority = ?';
        params.push(filters.priority);
      }
      query += ' ORDER BY created_time DESC';
      return db.prepare(query).all(...params);
    }
  },

  async findById(id, db) {
    if (this.isMongo()) {
      return await EmergencyModel.findOne({ id });
    } else {
      return db.prepare('SELECT * FROM emergencies WHERE id = ?').get(id);
    }
  },

  async findByIdAndUpdate(id, updates, db) {
    if (this.isMongo()) {
      return await EmergencyModel.findOneAndUpdate({ id }, { ...updates, updated_time: new Date() }, { new: true });
    } else {
      const current = this.findById(id, db);
      if (!current) return null;

      const merged = { ...current, ...updates, updated_time: new Date().toISOString() };
      db.prepare(`
        UPDATE emergencies 
        SET status = ?, assigned_mechanic = ?, eta = ?, eta_minutes = ?, 
            updated_time = ?, notes = ?, priority = ?, price = ?,
            payment_method = ?, payment_status = ?, invoice_id = ?,
            address = ?, total_distance_km = ?
        WHERE id = ?
      `).run(
        merged.status,
        merged.assigned_mechanic,
        merged.eta,
        merged.eta_minutes || 0,
        merged.updated_time,
        merged.notes,
        merged.priority,
        merged.price || 0,
        merged.payment_method,
        merged.payment_status || 'Pending',
        merged.invoice_id || null,
        merged.address,
        merged.total_distance_km || 0,
        id
      );
      return merged;
    }
  },

  async findByIdAndDelete(id, db) {
    if (this.isMongo()) {
      return await EmergencyModel.findOneAndDelete({ id });
    } else {
      const current = this.findById(id, db);
      if (!current) return null;
      db.prepare('DELETE FROM emergencies WHERE id = ?').run(id);
      return current;
    }
  },

  async findRecentByPhone(phone, minutesAgo, db) {
    if (this.isMongo()) {
      const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000);
      return await EmergencyModel.find({ 
        phone, 
        created_time: { $gte: cutoff } 
      }).sort({ created_time: -1 });
    } else {
      const cutoff = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
      return db.prepare(
        'SELECT * FROM emergencies WHERE phone = ? AND created_time >= ? ORDER BY created_time DESC'
      ).all(phone, cutoff);
    }
  }
};
