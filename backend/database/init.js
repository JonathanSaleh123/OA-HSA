const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'hsa.db');

// Create/connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        salt TEXT NOT NULL,
        pass_hash TEXT NOT NULL,
        created DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating Users table:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Users table created/verified');
    });

    // Account table
    db.run(`
      CREATE TABLE IF NOT EXISTS Account (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        balance DECIMAL(10,2) DEFAULT 0.00,
        created DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users (id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating Account table:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Account table created/verified');
    });

    // Debit_Cards table
    db.run(`
      CREATE TABLE IF NOT EXISTS Debit_Cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        number TEXT UNIQUE NOT NULL,
        cvv TEXT NOT NULL,
        created DATETIME DEFAULT CURRENT_TIMESTAMP,
        expired DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users (id),
        FOREIGN KEY (account_id) REFERENCES Account (id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating Debit_Cards table:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Debit_Cards table created/verified');
    });

    // Merchant_Codes table
    db.run(`
      CREATE TABLE IF NOT EXISTS Merchant_Codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        merchant_code TEXT UNIQUE NOT NULL,
        description TEXT,
        is_medical BOOLEAN DEFAULT 0
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating Merchant_Codes table:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Merchant_Codes table created/verified');
    });

    // Transactions table
    db.run(`
      CREATE TABLE IF NOT EXISTS Transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id INTEGER NOT NULL,
        merchant_name TEXT NOT NULL,
        merchant_code TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (card_id) REFERENCES Debit_Cards (id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating Transactions table:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Transactions table created/verified');
      resolve();
    });
  });
};

// Seed initial data
const seedInitialData = () => {
  return new Promise((resolve, reject) => {
    // Insert some common merchant codes
    const merchantCodes = [
      { code: '8011', description: 'Doctors', is_medical: 1 },
      { code: '8020', description: 'Dentists', is_medical: 1 },
      { code: '8031', description: 'Osteopathic Physicians', is_medical: 1 },
      { code: '8041', description: 'Chiropractors', is_medical: 1 },
      { code: '8042', description: 'Optometrists', is_medical: 1 },
      { code: '8043', description: 'Ophthalmologists', is_medical: 1 },
      { code: '8049', description: 'Podiatrists', is_medical: 1 },
      { code: '8050', description: 'Nursing and Personal Care Facilities', is_medical: 1 },
      { code: '8062', description: 'Hospitals', is_medical: 1 },
      { code: '8071', description: 'Medical and Dental Laboratories', is_medical: 1 },
      { code: '8099', description: 'Health Practitioners, Not Elsewhere Classified', is_medical: 1 },
      { code: '5912', description: 'Drug Stores and Pharmacies', is_medical: 1 },
      { code: '5122', description: 'Drugs, Drug Proprietaries, and Druggist Sundries', is_medical: 1 },
      { code: '5047', description: 'Medical, Dental, Ophthalmic, and Hospital Equipment and Supplies', is_medical: 1 },
      { code: '5999', description: 'Miscellaneous and Specialty Retail Stores', is_medical: 0 },
      { code: '5411', description: 'Grocery Stores, Supermarkets', is_medical: 0 },
      { code: '5541', description: 'Service Stations (with or without ancillary services)', is_medical: 0 }
    ];

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO Merchant_Codes (merchant_code, description, is_medical) 
      VALUES (?, ?, ?)
    `);

    merchantCodes.forEach(({ code, description, is_medical }) => {
      stmt.run(code, description, is_medical);
    });

    stmt.finalize((err) => {
      if (err) {
        console.error('❌ Error seeding merchant codes:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Merchant codes seeded');
      resolve();
    });
  });
};

// Main initialization
const initDatabase = async () => {
  try {
    console.log('🚀 Initializing HSA Database...\n');
    
    await createTables();
    await seedInitialData();
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('📁 Database file:', dbPath);
    
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('🔒 Database connection closed');
      }
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase, dbPath };
