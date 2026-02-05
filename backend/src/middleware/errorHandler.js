// Global Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error occurred:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

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
