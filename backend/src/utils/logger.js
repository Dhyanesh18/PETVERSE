const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create error log stream with rotation
const errorLogStream = rfs.createStream('error.log', {
    interval: '1d', // Rotate daily
    path: logsDir,
    maxFiles: 30, // Keep 30 days of error logs
    maxSize: '10M' // Rotate if file exceeds 10MB
});

// Format error log entry
function formatErrorLog(errorData) {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        ...errorData
    }) + '\n';
}

// Log errors to separate file
function logError(errorData) {
    const logEntry = formatErrorLog({
        level: 'ERROR',
        ...errorData
    });
    
    // Write to error log file
    errorLogStream.write(logEntry);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ ERROR LOG:', {
            message: errorData.message,
            url: errorData.url,
            method: errorData.method,
            timestamp: errorData.timestamp
        });
    }
}

// Log warnings
function logWarning(warningData) {
    const logEntry = formatErrorLog({
        level: 'WARNING',
        ...warningData
    });
    
    errorLogStream.write(logEntry);
    
    if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ WARNING LOG:', warningData);
    }
}

// Log info
function logInfo(infoData) {
    const logEntry = formatErrorLog({
        level: 'INFO',
        ...infoData
    });
    
    errorLogStream.write(logEntry);
    
    if (process.env.NODE_ENV === 'development') {
        console.log('ℹ️ INFO LOG:', infoData);
    }
}

module.exports = {
    logError,
    logWarning,
    logInfo,
    errorLogStream
};
