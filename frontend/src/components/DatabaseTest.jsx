import React, { useState, useEffect } from 'react';
import { getFeaturedPets, getFeaturedProducts, checkUserSession } from '../services/api';

const DatabaseTest = () => {
    const [testResults, setTestResults] = useState({
        pets: { status: 'testing', data: null, error: null },
        products: { status: 'testing', data: null, error: null },
        session: { status: 'testing', data: null, error: null }
    });

    useEffect(() => {
        runTests();
    }, []);

    const runTests = async () => {
        // Test pets endpoint
        try {
            const petsResponse = await getFeaturedPets();
            setTestResults(prev => ({
                ...prev,
                pets: { status: 'success', data: petsResponse.data, error: null }
            }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                pets: { status: 'error', data: null, error: error.message }
            }));
        }

        // Test products endpoint
        try {
            const productsResponse = await getFeaturedProducts();
            setTestResults(prev => ({
                ...prev,
                products: { status: 'success', data: productsResponse.data, error: null }
            }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                products: { status: 'error', data: null, error: error.message }
            }));
        }

        // Test session endpoint
        try {
            const sessionResponse = await checkUserSession();
            setTestResults(prev => ({
                ...prev,
                session: { status: 'success', data: sessionResponse.data, error: null }
            }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                session: { status: 'error', data: null, error: error.message }
            }));
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'testing': return '⏳';
            case 'success': return '✅';
            case 'error': return '❌';
            default: return '❓';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'testing': return 'text-yellow-600';
            case 'success': return 'text-green-600';
            case 'error': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Database Connection Test</h2>
                <button
                    onClick={runTests}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Retest
                </button>
            </div>

            <div className="space-y-6">
                {/* Pets Test */}
                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{getStatusIcon(testResults.pets.status)}</span>
                        <h3 className="text-lg font-semibold">Pets Database</h3>
                        <span className={`text-sm font-medium ${getStatusColor(testResults.pets.status)}`}>
                            {testResults.pets.status.toUpperCase()}
                        </span>
                    </div>
                    
                    {testResults.pets.error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                            <p className="text-red-700 text-sm">Error: {testResults.pets.error}</p>
                        </div>
                    )}
                    
                    {testResults.pets.data && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-green-700 text-sm">
                                Successfully fetched {Array.isArray(testResults.pets.data) ? testResults.pets.data.length : 'data'} pets
                            </p>
                            <details className="mt-2">
                                <summary className="cursor-pointer text-green-600 text-sm">View Data</summary>
                                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                                    {JSON.stringify(testResults.pets.data, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
                </div>

                {/* Products Test */}
                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{getStatusIcon(testResults.products.status)}</span>
                        <h3 className="text-lg font-semibold">Products Database</h3>
                        <span className={`text-sm font-medium ${getStatusColor(testResults.products.status)}`}>
                            {testResults.products.status.toUpperCase()}
                        </span>
                    </div>
                    
                    {testResults.products.error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                            <p className="text-red-700 text-sm">Error: {testResults.products.error}</p>
                        </div>
                    )}
                    
                    {testResults.products.data && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-green-700 text-sm">
                                Successfully fetched {Array.isArray(testResults.products.data) ? testResults.products.data.length : 'data'} products
                            </p>
                            <details className="mt-2">
                                <summary className="cursor-pointer text-green-600 text-sm">View Data</summary>
                                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                                    {JSON.stringify(testResults.products.data, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
                </div>

                {/* Session Test */}
                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{getStatusIcon(testResults.session.status)}</span>
                        <h3 className="text-lg font-semibold">Session Management</h3>
                        <span className={`text-sm font-medium ${getStatusColor(testResults.session.status)}`}>
                            {testResults.session.status.toUpperCase()}
                        </span>
                    </div>
                    
                    {testResults.session.error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                            <p className="text-red-700 text-sm">Error: {testResults.session.error}</p>
                        </div>
                    )}
                    
                    {testResults.session.data && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-green-700 text-sm">
                                Session check successful - User {testResults.session.data.isLoggedIn ? 'logged in' : 'not logged in'}
                            </p>
                            <details className="mt-2">
                                <summary className="cursor-pointer text-green-600 text-sm">View Session Data</summary>
                                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                                    {JSON.stringify(testResults.session.data, null, 2)}
                                </pre>
                            </details>
                        </div>
                    )}
                </div>
            </div>

            {/* Connection Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Connection Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                        <span>Backend Server:</span>
                        <span className="font-medium text-blue-600">http://localhost:8080</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span>Frontend Server:</span>
                        <span className="font-medium text-blue-600">http://localhost:5173</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span>Proxy:</span>
                        <span className="font-medium text-green-600">Configured</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseTest;
