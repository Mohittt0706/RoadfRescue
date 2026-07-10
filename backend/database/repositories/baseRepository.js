/**
 * Base Repository - Provides common database operations for all entities.
 * All repositories extend this class.
 */
export class BaseRepository {
  constructor(db, tableName) {
    this.db = db;
    this.tableName = tableName;
  }

  /** Find all records with optional conditions */
  findAll(conditions = {}, options = {}) {
    const { orderBy = 'created_at DESC', limit, offset } = options;
    let query = `SELECT * FROM ${this.tableName}`;
    const params = [];
    
    const keys = Object.keys(conditions).filter(k => conditions[k] !== undefined);
    if (keys.length > 0) {
      const where = keys.map(k => `${k} = ?`).join(' AND ');
      query += ` WHERE ${where}`;
      params.push(...keys.map(k => conditions[k]));
    }
    
    query += ` ORDER BY ${orderBy}`;
    
    if (limit) {
      query += ` LIMIT ?`;
      params.push(limit);
      if (offset) {
        query += ` OFFSET ?`;
        params.push(offset);
      }
    }
    
    return this.db.prepare(query).all(...params);
  }

  /** Find a single record by ID */
  findById(id) {
    return this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`).get(id);
  }

  /** Find a single record by arbitrary conditions */
  findOne(conditions) {
    const keys = Object.keys(conditions);
    if (keys.length === 0) return null;
    const where = keys.map(k => `${k} = ?`).join(' AND ');
    const params = keys.map(k => conditions[k]);
    return this.db.prepare(`SELECT * FROM ${this.tableName} WHERE ${where} LIMIT 1`).get(...params);
  }

  /** Insert a new record */
  create(data) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    const values = keys.map(k => data[k]);
    
    this.db.prepare(`INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`).run(...values);
    return this.findById(data.id);
  }

  /** Update a record by ID */
  update(id, data) {
    const keys = Object.keys(data);
    if (keys.length === 0) return this.findById(id);
    
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = [...keys.map(k => data[k]), id];
    
    this.db.prepare(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`).run(...values);
    return this.findById(id);
  }

  /** Delete a record by ID */
  delete(id) {
    return this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`).run(id);
  }

  /** Count records with optional conditions */
  count(conditions = {}) {
    let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];
    const keys = Object.keys(conditions).filter(k => conditions[k] !== undefined);
    if (keys.length > 0) {
      const where = keys.map(k => `${k} = ?`).join(' AND ');
      query += ` WHERE ${where}`;
      params.push(...keys.map(k => conditions[k]));
    }
    return this.db.prepare(query).get(...params).count;
  }

  /** Check if a record exists */
  exists(conditions) {
    return this.findOne(conditions) !== undefined;
  }

  /** Execute a raw query */
  raw(query, params = []) {
    return this.db.prepare(query).all(...params);
  }

  /** Execute a raw query and return single row */
  rawOne(query, params = []) {
    return this.db.prepare(query).get(...params);
  }

  /** Paginated query with total count */
  paginate(conditions = {}, options = {}) {
    const { page = 1, limit = 20, orderBy = 'created_at DESC' } = options;
    const offset = (page - 1) * limit;
    const data = this.findAll(conditions, { orderBy, limit, offset });
    const total = this.count(conditions);
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }
}
