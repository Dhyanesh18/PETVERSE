import React from 'react';
import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

const Unauthorized = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
                <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Access Denied
                </h1>
                <p className="text-gray-600 mb-6">
                    You don't have permission to access this page.
                </p>
                <Link
                    to="/"
                    className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                    Go to Homepage
                </Link>
            </div>
        </div>
    );
};

export default Unauthorized;