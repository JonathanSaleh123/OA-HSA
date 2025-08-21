const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'hsa.db');

// Create database connection
const createConnection = () => {
  return new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err.message);
      throw err;
    }
  });
};

// Get database connection
const getConnection = () => {
  const db = createConnection();
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  return db;
};

// Helper function to run queries with promises
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getConnection();
    
    db.run(query, params, function(err) {
      db.close();
      
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
    });
  });
};

// Helper function to get single row
const getRow = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getConnection();
    
    db.get(query, params, (err, row) => {
      db.close();
      
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper function to get multiple rows
const getRows = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getConnection();
    
    db.all(query, params, (err, rows) => {
      db.close();
      
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function to run transaction
const runTransaction = (queries) => {
  return new Promise((resolve, reject) => {
    const db = getConnection();
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      const results = [];
      let hasError = false;
      
      queries.forEach((queryObj, index) => {
        if (hasError) return;
        
        db.run(queryObj.query, queryObj.params || [], function(err) {
          if (err) {
            hasError = true;
            db.run('ROLLBACK');
            db.close();
            reject(err);
            return;
          }
          
          results.push({
            index,
            lastID: this.lastID,
            changes: this.changes
          });
          
          // If this is the last query, commit the transaction
          if (index === queries.length - 1 && !hasError) {
            db.run('COMMIT', (err) => {
              db.close();
              if (err) {
                reject(err);
              } else {
                resolve(results);
              }
            });
          }
        });
      });
    });
  });
};

module.exports = {
  getConnection,
  runQuery,
  getRow,
  getRows,
  runTransaction,
  dbPath
};
