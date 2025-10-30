import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSearch, FaBars, FaTimes, FaPaw, FaAngleDown } from 'react-icons/fa';
import api from '../utils/api';

const Navbar = ({ user, navLinks }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ pets: [], products: [], services: [] });
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [openDropdown, setOpenDropdown] = useState(null);
    
    const searchRef = useRef(null);
    const navigate = useNavigate();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch cart count
    useEffect(() => {
        const fetchCartCount = async () => {
            try {
                const response = await api.get('/user/cart/count');
                if (response.data.success) {
                    setCartCount(response.data.data.cartCount);
                }
            } catch (error) {
                console.error('Error fetching cart count:', error);
            }
        };
        
        if (user) {
            fetchCartCount();
        }
    }, [user]);

    // Handle search with debounce
    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            if (searchQuery.trim()) {
                performSearch(searchQuery);
            } else {
                setShowSearchResults(false);
                setSearchResults({ pets: [], products: [], services: [] });
            }
        }, 400);

        return () => clearTimeout(debounceTimeout);
    }, [searchQuery]);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
            if (!event.target.closest('.dropdown-container')) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const performSearch = async (query) => {
        try {
            const response = await api.get(`/search/api?term=${encodeURIComponent(query)}`);
            if (response.data.success) {
                setSearchResults(response.data.data);
                setShowSearchResults(true);
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setShowSearchResults(false);
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const toggleDropdown = (index) => {
        setOpenDropdown(openDropdown === index ? null : index);
    };

    const defaultNavLinks = [
        { name: 'Home', url: '/home' },
        { name: 'Pets', url: '/pets' },
        { name: 'Products', url: '/products' },
        {
            name: 'Services',
            url: '#',
            dropdown: true,
            dropdownItems: [
                { name: 'PetCare', url: '/services' },
                { name: 'PetMate', url: '/mate' },
                { name: 'Events', url: '/events' }
            ]
        },
        { name: 'About', url: '/about' }
    ];

    const links = navLinks || defaultNavLinks;

    const hasResults = searchResults.pets.length > 0 || 
                        searchResults.products.length > 0 || 
                        searchResults.services.length > 0;

    return (
        <header className="w-full">
            <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
                isScrolled ? 'bg-stone-950 shadow-xl' : 'bg-transparent'
            }`}>
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20 gap-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-2 text-white font-bold text-xl ">
                            <FaPaw className="text-2xl" />
                            <span className="hidden sm:inline">PetVerse</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <ul className="hidden lg:flex items-center space-x-6 flex-1 justify-center gap-4">
                            {links.map((link, index) => (
                                <li key={index} className="relative dropdown-container">
                                    {link.dropdown ? (
                                        <>
                                            <button
                                                onClick={() => toggleDropdown(index)}
                                                className="text-lg text-white hover:text-cyan-700 transition-colors font-medium flex items-center space-x-1"
                                            >
                                                <span>{link.name}</span>
                                                <FaAngleDown className={`transition-transform ${openDropdown === index ? 'rotate-180' : ''}`} />
                                            </button>
                                            {openDropdown === index && (
                                                <ul className="absolute top-11 left-[-18px] bg-stone-950 shadow-lg rounded-lg py-2 min-w-[120px] z-50">
                                                    {link.dropdownItems.map((item, itemIndex) => (
                                                        <li key={itemIndex}>
                                                            <Link
                                                                to={item.url}
                                                                onClick={() => setOpenDropdown(null)}
                                                                className="block px-4 py-2 text-white hover:bg-gray-700 transition-colors text-center text-sm"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            to={link.url}
                                            className="text-xl text-white hover:text-cyan-700 transition-colors font-medium"
                                        >
                                            {link.name}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {/* Search Bar */}
                        <div ref={searchRef} className="relative hidden md:flex items-center flex-1 max-w-md">
                            <form onSubmit={handleSearchSubmit} className="w-full flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search pets, products or services"
                                    className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all hover:scale-104"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-3 bg-cyan-700 hover:bg-cyan-500 text-white rounded-lg transition-all hover:scale-105"
                                >
                                    <FaSearch />
                                </button>
                            </form>

                            {/* Search Results Dropdown */}
                            {showSearchResults && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50 border border-gray-200">
                                    {hasResults ? (
                                        <div className="p-3">
                                            {searchResults.pets.length > 0 && (
                                                <div className="mb-3">
                                                    <h4 className="text-xs font-semibold text-gray-700 uppercase border-b-2 border-cyan-500 pb-1 mb-2">
                                                        Pets
                                                    </h4>
                                                    {searchResults.pets.map((pet) => (
                                                        <Link
                                                            key={pet._id}
                                                            to={`/pets/${pet._id}`}
                                                            onClick={() => setShowSearchResults(false)}
                                                            className="block px-3 py-2 text-gray-800 hover:bg-cyan-50 hover:text-cyan-600 rounded transition-colors text-sm"
                                                        >
                                                            {pet.name} ({pet.breed})
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {searchResults.products.length > 0 && (
                                                <div className="mb-3">
                                                    <h4 className="text-xs font-semibold text-gray-700 uppercase border-b-2 border-cyan-500 pb-1 mb-2">
                                                        Products
                                                    </h4>
                                                    {searchResults.products.map((product) => (
                                                        <Link
                                                            key={product._id}
                                                            to={`/products/${product._id}`}
                                                            onClick={() => setShowSearchResults(false)}
                                                            className="block px-3 py-2 text-gray-800 hover:bg-cyan-50 hover:text-cyan-600 rounded transition-colors text-sm"
                                                        >
                                                            {product.name} ({product.brand})
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}

                                            {searchResults.services.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold text-gray-700 uppercase border-b-2 border-cyan-500 pb-1 mb-2">
                                                        Services
                                                    </h4>
                                                    {searchResults.services.map((service) => (
                                                        <Link
                                                            key={service._id}
                                                            to={`/services/${service._id}`}
                                                            onClick={() => setShowSearchResults(false)}
                                                            className="block px-3 py-2 text-gray-800 hover:bg-cyan-50 hover:text-cyan-600 rounded transition-colors text-sm"
                                                        >
                                                            {service.serviceType}
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="p-5 text-center text-gray-500 italic text-sm">
                                            No results found.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Icons */}
                        <div className="flex items-center space-x-4 gap-6">
                            <Link
                                to="/cart"
                                className="relative text-white hover:text-cyan-700 text-xl transition-all hover:scale-110"
                            >
                                <FaShoppingCart />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            <Link
                                to={user ? '/dashboard' : '/login'}
                                className="text-white hover:text-cyan-700 text-xl transition-all hover:scale-110"
                            >
                                <FaUser />
                            </Link>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden text-white text-2xl hover:text-cyan-400 transition-all"
                            >
                                {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden bg-gray-800 border-t border-gray-700">
                        <ul className="px-4 py-2 space-y-2">
                            {/* Mobile Search */}
                            <li className="pb-2 border-b border-gray-700">
                                <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                    />
                                    <button
                                        type="submit"
                                        className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
                                    >
                                        <FaSearch />
                                    </button>
                                </form>
                            </li>

                            {links.map((link, index) => (
                                <li key={index}>
                                    {link.dropdown ? (
                                        <div>
                                            <button
                                                onClick={() => toggleDropdown(index)}
                                                className="w-full text-left text-white hover:text-cyan-400 py-2 flex items-center justify-between"
                                            >
                                                <span>{link.name}</span>
                                                <FaAngleDown className={`transition-transform ${openDropdown === index ? 'rotate-180' : ''}`} />
                                            </button>
                                            {openDropdown === index && (
                                                <ul className="pl-4 space-y-2 mt-2">
                                                    {link.dropdownItems.map((item, itemIndex) => (
                                                        <li key={itemIndex}>
                                                            <Link
                                                                to={item.url}
                                                                onClick={() => {
                                                                    setIsMobileMenuOpen(false);
                                                                    setOpenDropdown(null);
                                                                }}
                                                                className="block text-white hover:text-cyan-400 py-1 text-sm"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ) : (
                                        <Link
                                            to={link.url}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block text-white hover:text-cyan-400 py-2"
                                        >
                                            {link.name}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </nav>

            {/* Spacer to prevent content from going under fixed navbar */}
            <div className="h-20"></div>
        </header>
    );
};

export default Navbar;