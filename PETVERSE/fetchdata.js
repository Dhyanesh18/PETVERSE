const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('./petverse.db', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to petverse.db\n');
    }
});

// Function to fetch and print data from a table
const fetchTableData = (tableName) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
        if (err) {
            console.error(`Error fetching data from ${tableName}:`, err.message);
            return;
        }
        console.log(`=== Data from ${tableName} ===`);
        console.table(rows); // Prints in tabular format
    });
};

// Fetch and print data from all tables
fetchTableData('users');
fetchTableData('sellers');
fetchTableData('service_providers');

// Close the database connection after a delay (to allow async queries)
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('Error closing the database:', err.message);
        } else {
            console.log('\nDatabase connection closed.');
        }
    });
}, 2000);
