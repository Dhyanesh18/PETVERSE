import React from 'react';

const LostPetFilters = ({ filters, onChange, userLocation }) => {
    const handleStatusChange = (e) => {
        onChange({ status: e.target.value });
    };

    const handlePetTypeChange = (e) => {
        onChange({ petType: e.target.value });
    };

    const handleRadiusChange = (e) => {
        onChange({ radius: parseInt(e.target.value) });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i className="fas fa-filter text-teal-600"></i>
                Filters
            </h3>

            {/* Status Filter */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                </label>
                <select
                    value={filters.status}
                    onChange={handleStatusChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                    <option value="reunited">Reunited</option>
                </select>
            </div>

            {/* Pet Type Filter */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Type
                </label>
                <select
                    value={filters.petType}
                    onChange={handlePetTypeChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                    <option value="">All Types</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* Search Radius */}
            {userLocation && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Radius: {filters.radius} km
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={filters.radius}
                        onChange={handleRadiusChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>5 km</span>
                        <span>100 km</span>
                    </div>
                </div>
            )}

            {/* Location Info */}
            <div className="mt-6 p-4 bg-teal-50 rounded-lg">
                <div className="flex items-start gap-2">
                    <i className="fas fa-info-circle text-teal-600 mt-1"></i>
                    <div className="text-sm text-teal-800">
                        {userLocation ? (
                            <>
                                <p className="font-medium mb-1">Location Enabled</p>
                                <p className="text-xs">Showing results near you</p>
                            </>
                        ) : (
                            <>
                                <p className="font-medium mb-1">Enable Location</p>
                                <p className="text-xs">Allow location access to see nearby lost pets</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Reset Filters Button */}
            <button
                onClick={() => onChange({ status: 'lost', petType: '', radius: 50 })}
                className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
                <i className="fas fa-redo mr-2"></i>
                Reset Filters
            </button>
        </div>
    );
};

export default LostPetFilters;
