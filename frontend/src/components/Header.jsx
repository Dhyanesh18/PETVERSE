import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { useCart } from '../contexts/CartContext';
import { searchAll } from '../services/api';

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ pets: [], products: [], services: [] });
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showServicesDropdown, setShowServicesDropdown] = useState(false);
    const navigate = useNavigate();
    // Temporary fallback values until contexts are properly set up
    const user = null;
    const isAuthenticated = false;
    const logout = () => {};
    const cartCount = 0;
    const searchRef = useRef(null);
    const debounceTimeout = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (query) => {
        if (!query.trim()) {
            setShowDropdown(false);
            return;
        }

        try {
            const response = await searchAll(query);
            setSearchResults(response.data || { pets: [], products: [], services: [] });
            setShowDropdown(true);
        } catch (error) {
            console.error('Search failed:', error);
            // Set empty results on error
            setSearchResults({ pets: [], products: [], services: [] });
            setShowDropdown(false);
        }
    };

    const handleSearchInput = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            handleSearch(query);
        }, 300);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowDropdown(false);
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const hasSearchResults = searchResults.pets.length > 0 || searchResults.products.length > 0 || searchResults.services.length > 0;

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/home" className="flex items-center gap-2 text-2xl font-bold text-indigo-600">
                        <span className="text-3xl">🐾</span>
                        <span>PetVerse</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/home" className="text-gray-700 hover:text-indigo-600 font-medium transition">
                            Home
                        </Link>
                        <Link to="/pets" className="text-gray-700 hover:text-indigo-600 font-medium transition">
                            Pets
                        </Link>
                        <Link to="/products" className="text-gray-700 hover:text-indigo-600 font-medium transition">
                            Products
                        </Link>
                        <div className="relative">
                            <button
                                onClick={() => setShowServicesDropdown(!showServicesDropdown)}
                                className="text-gray-700 hover:text-indigo-600 font-medium transition flex items-center gap-1"
                            >
                                Services
                                <span className="text-xs">▼</span>
                            </button>
                            {showServicesDropdown && (
                                <div className="absolute top-full mt-2 bg-white shadow-lg rounded-lg py-2 w-48">
                                    <Link
                                        to="/services"
                                        className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                        onClick={() => setShowServicesDropdown(false)}
                                    >
                                        PetCare
                                    </Link>
                                    <Link
                                        to="/pets/mate"
                                        className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                        onClick={() => setShowServicesDropdown(false)}
                                    >
                                        PetMate
                                    </Link>
                                    <Link
                                        to="/events"
                                        className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                        onClick={() => setShowServicesDropdown(false)}
                                    >
                                        Events
                                    </Link>
                                </div>
                            )}
                        </div>
                        <Link to="/about" className="text-gray-700 hover:text-indigo-600 font-medium transition">
                            About
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="hidden md:block flex-1 max-w-md mx-6 relative" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchInput}
                                placeholder="Search pets, products or services"
                                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
                            >
                                🔍
                            </button>
                        </form>

                        {/* Search Dropdown */}
                        {showDropdown && (
                            <div className="absolute top-full mt-2 w-full bg-white shadow-2xl rounded-lg max-h-96 overflow-y-auto z-50">
                                {!hasSearchResults ? (
                                    <p className="p-4 text-gray-500">No results found.</p>
                                ) : (
                                    <>
                                        {searchResults.pets.length > 0 && (
                                            <div className="p-2">
                                                <h4 className="font-bold text-gray-700 px-2 py-1">Pets</h4>
                                                {searchResults.pets.slice(0, 3).map((pet) => (
                                                    <Link
                                                        key={pet._id}
                                                        to={`/seller/detail/${pet._id}`}
                                                        className="block px-4 py-2 hover:bg-indigo-50 rounded"
                                                        onClick={() => setShowDropdown(false)}
                                                    >
                                                        {pet.name} ({pet.breed})
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                        {searchResults.products.length > 0 && (
                                            <div className="p-2">
                                                <h4 className="font-bold text-gray-700 px-2 py-1">Products</h4>
                                                {searchResults.products.slice(0, 3).map((product) => (
                                                    <Link
                                                        key={product._id}
                                                        to={`/buy/${product._id}`}
                                                        className="block px-4 py-2 hover:bg-indigo-50 rounded"
                                                        onClick={() => setShowDropdown(false)}
                                                    >
                                                        {product.name} ({product.brand})
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                        {searchResults.services.length > 0 && (
                                            <div className="p-2">
                                                <h4 className="font-bold text-gray-700 px-2 py-1">Services</h4>
                                                {searchResults.services.slice(0, 3).map((service) => (
                                                    <Link
                                                        key={service._id}
                                                        to={`/services/${service._id}`}
                                                        className="block px-4 py-2 hover:bg-indigo-50 rounded"
                                                        onClick={() => setShowDropdown(false)}
                                                    >
                                                        {service.serviceType}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Icons */}
                    <div className="flex items-center gap-4">
                        <Link to="/cart" className="relative text-gray-700 hover:text-indigo-600 transition">
                            <span className="text-2xl">🛒</span>
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {isAuthenticated ? (
                            <div className="relative group">
                                <button className="text-gray-700 hover:text-indigo-600 transition">
                                    <span className="text-2xl">👤</span>
                                </button>
                                <div className="absolute right-0 top-full mt-2 bg-white shadow-lg rounded-lg py-2 w-48 hidden group-hover:block">
                                    <Link
                                        to={
                                            user?.role === 'admin'
                                                ? '/admin/dashboard'
                                                : user?.role === 'seller'
                                                ? '/seller/dashboard'
                                                : user?.role === 'service-provider'
                                                ? '/service-provider/dashboard'
                                                : '/owner-dashboard'
                                        }
                                        className="block px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link to="/login" className="text-gray-700 hover:text-indigo-600 transition">
                                <span className="text-2xl">👤</span>
                            </Link>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden text-gray-700 hover:text-indigo-600"
                        >
                            <span className="text-2xl">☰</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {showMobileMenu && (
                    <div className="md:hidden py-4 border-t">
                        <Link
                            to="/home"
                            className="block py-2 text-gray-700 hover:text-indigo-600"
                            onClick={() => setShowMobileMenu(false)}
                        >
                            Home
                        </Link>
                        <Link
                            to="/pets"
                            className="block py-2 text-gray-700 hover:text-indigo-600"
                            onClick={() => setShowMobileMenu(false)}
                        >
                            Pets
                        </Link>
                        <Link
                            to="/products"
                            className="block py-2 text-gray-700 hover:text-indigo-600"
                            onClick={() => setShowMobileMenu(false)}
                        >
                            Products
                        </Link>
                        <Link
                            to="/services"
                            className="block py-2 text-gray-700 hover:text-indigo-600"
                            onClick={() => setShowMobileMenu(false)}
                        >
                            Services
                        </Link>
                        <Link
                            to="/about"
                            className="block py-2 text-gray-700 hover:text-indigo-600"
                            onClick={() => setShowMobileMenu(false)}
                        >
                            About
                        </Link>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;
