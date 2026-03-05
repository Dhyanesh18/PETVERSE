const { logError } = require('../utils/logger');

// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    const errorData = {
        message: err.message,
        errorName: err.name,
        url: req.url,
        method: req.method,
        statusCode: err.status || 500,
        userAgent: req.get('user-agent'),
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
    
    // Log error to separate error log file
    logError(errorData);

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: err.message
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID format'
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            error: 'Duplicate entry detected'
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired'
        });
    }

    // CSRF token errors
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
            success: false,
            error: 'Invalid CSRF token'
        });
    }

    // Multer file upload errors
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            error: `File upload error: ${err.message}`
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// 404 Not Found Handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
};

module.exports = { errorHandler, notFoundHandler };
