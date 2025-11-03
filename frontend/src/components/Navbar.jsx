import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSearch, FaBars, FaTimes, FaPaw, FaAngleDown } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../utils/api';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const { cartCount } = useCart();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState({ pets: [], products: [], services: [] });
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const isHomepage = location.pathname === '/' || location.pathname === '/home';

    const navLinks = [
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

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Cart count is now handled by CartContext

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

    const hasResults = searchResults.pets?.length > 0 || 
                      searchResults.products?.length > 0 || 
                      searchResults.services?.length > 0;

    return (
        <header className="fixed top-0 left-0 w-full z-1000">
            <nav 
                className={`w-full px-15 py-5 transition-all duration-300 ${
                    isHomepage && !isScrolled && !openDropdown
                        ? 'bg-transparent' 
                        : 'bg-[#111] shadow-[0_2px_20px_rgba(0,0,0,0.5)]'
                }`}
            >
                <div className="max-w-screen-2xl mx-auto flex items-center gap-8">
                    {/* Logo */}
                    <div className="shrink-0">
                        <Link 
                            to="/" 
                            className="flex items-center gap-2 text-white font-bold text-2xl font-poppins tracking-wide no-underline"
                            style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)' }}
                        >
                            <FaPaw className="text-primary-400" /> PetVerse
                        </Link>
                    </div>

                    {/* Icons (Cart and User) */}
                    <div className="hidden lg:flex items-center gap-8 ml-auto">
                        <Link 
                            to="/cart" 
                            className="relative text-white text-xl hover:scale-125 transition-transform duration-300"
                            style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)', filter: 'none' }}
                            onMouseEnter={(e) => e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))'}
                            onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                        >
                            <FaShoppingCart />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-linear-to-br from-red-500 to-pink-600 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1.5 shadow-lg">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <Link 
                            to={user ? '/dashboard' : '/login'} 
                            className="text-white text-xl hover:scale-125 transition-transform duration-300"
                            style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)', filter: 'none' }}
                            onMouseEnter={(e) => e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))'}
                            onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
                        >
                            <FaUser />
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div ref={searchRef} className="relative hidden lg:flex items-center gap-2">
                        <input
                            className="w-[250px] xl:w-[300px] rounded-lg border-none px-4 py-2 shadow-[0_2px_15px_rgba(0,0,0,0.2)] transition-all duration-300 font-poppins text-sm focus:outline-none focus:scale-105 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] bg-white text-stone-950"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                            placeholder="Search pets, products or services"
                        />
                        <button 
                            onClick={handleSearchSubmit}
                            className="bg-white text-primary-500 font-bold px-4 py-2.5 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:scale-110 transition-all duration-300"
                        >
                            <FaSearch />
                        </button>

                        {/* Search Results Dropdown */}
                        {showSearchResults && (
                            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] max-h-[400px] overflow-y-auto p-4 w-full border border-gray-200 z-10000">
                                {hasResults ? (
                                    <>
                                        {searchResults.pets?.length > 0 && (
                                            <>
                                                <h4 className="mt-0 mb-2 text-gray-800 text-sm font-bold uppercase border-b-2 border-secondary-500 pb-2">Pets</h4>
                                                {searchResults.pets.map((pet) => (
                                                    <Link
                                                        key={pet._id}
                                                        to={`/seller/detail/${pet._id}`}
                                                        onClick={() => setShowSearchResults(false)}
                                                        className="block py-3 px-4 text-gray-800 rounded-lg my-1 hover:bg-linear-to-r hover:from-primary-50 hover:to-secondary-50 hover:text-secondary-600 hover:translate-x-1 transition-all duration-300 no-underline font-medium"
                                                    >
                                                        {pet.name} ({pet.breed})
                                                    </Link>
                                                ))}
                                            </>
                                        )}

                                        {searchResults.products?.length > 0 && (
                                            <>
                                                <h4 className="mt-4 mb-2 text-gray-800 text-sm font-bold uppercase border-b-2 border-secondary-500 pb-2">Products</h4>
                                                {searchResults.products.map((product) => (
                                                    <Link
                                                        key={product._id}
                                                        to={`/product/${product._id}`}
                                                        onClick={() => setShowSearchResults(false)}
                                                        className="block py-3 px-4 text-gray-800 rounded-lg my-1 hover:bg-linear-to-r hover:from-primary-50 hover:to-secondary-50 hover:text-secondary-600 hover:translate-x-1 transition-all duration-300 no-underline font-medium"
                                                    >
                                                        {product.name} ({product.brand})
                                                    </Link>
                                                ))}
                                            </>
                                        )}

                                        {searchResults.services?.length > 0 && (
                                            <>
                                                <h4 className="mt-4 mb-2 text-gray-800 text-sm font-bold uppercase border-b-2 border-secondary-500 pb-2">Services</h4>
                                                {searchResults.services.map((service) => (
                                                    <Link
                                                        key={service._id}
                                                        to={`/services/${service._id}`}
                                                        onClick={() => setShowSearchResults(false)}
                                                        className="block py-3 px-4 text-gray-800 rounded-lg my-1 hover:bg-linear-to-r hover:from-primary-50 hover:to-secondary-50 hover:text-secondary-600 hover:translate-x-1 transition-all duration-300 no-underline font-medium"
                                                    >
                                                        {service.serviceType}
                                                    </Link>
                                                ))}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <p className="py-8 text-center text-gray-500 italic font-medium">No results found.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Hamburger Menu Button */}
                    <button 
                        className="lg:hidden ml-auto text-white text-3xl p-2 hover:scale-125 transition-transform duration-300"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}
                    >
                        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                    </button>

                    {/* Desktop Navigation Links */}
                    <ul className="hidden lg:flex items-center gap-10 list-none">
                        {navLinks.map((link, index) => (
                            <li key={index} className="relative dropdown-container">
                                {link.dropdown ? (
                                    <>
                                        <button
                                            onClick={() => toggleDropdown(index)}
                                            className="text-white  text-xl flex items-center gap-1 hover:scale-105 hover:-translate-y-1 transition-all duration-300 bg-transparent border-none cursor-pointer font-poppins"
                                            style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)' }}
                                            onMouseEnter={(e) => e.currentTarget.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.8)'}
                                            onMouseLeave={(e) => e.currentTarget.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.3)'}
                                        >
                                            <span>{link.name}</span>
                                            <FaAngleDown className={`transition-transform duration-300 ${openDropdown === index ? 'rotate-180' : ''}`} />
                                        </button>
                                        {openDropdown === index && (
                                            <ul className="absolute top-13 left[-30px]  bg-stone-900 shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-xl py-2 min-w-5 z-50 list-none animate-fadeInDown">
                                                {link.dropdownItems.map((item, itemIndex) => (
                                                    <li key={itemIndex}>
                                                        <Link
                                                            to={item.url}
                                                            onClick={() => setOpenDropdown(null)}
                                                            className="block px-8 py-3 text-teal-600 hover:bg-linear-to-r hover:from-primary-500 hover:to-secondary-500 hover:text-white transition-all duration-300 no-underline font-medium text-sm"
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
                                        className="text-white  text-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 no-underline font-poppins"
                                        style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)' }}
                                        onMouseEnter={(e) => e.currentTarget.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.8)'}
                                        onMouseLeave={(e) => e.currentTarget.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.3)'}
                                    >
                                        {link.name}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="lg:hidden fixed top-20 left-0 w-full bg-linear-to-br from-primary-500 to-secondary-500 shadow-[0_10px_27px_rgba(0,0,0,0.15)] z-50">
                            <ul className="flex flex-col items-center gap-6 py-8 list-none">
                                {navLinks.map((link, index) => (
                                    <li key={index} className="w-full text-center">
                                        {link.dropdown ? (
                                            <>
                                                <button
                                                    onClick={() => toggleDropdown(index)}
                                                    className="text-white  text-xl flex items-center justify-center gap-2 w-full py-2 bg-transparent border-none cursor-pointer"
                                                >
                                                    <span>{link.name}</span>
                                                    <FaAngleDown className={`transition-transform ${openDropdown === index ? 'rotate-180' : ''}`} />
                                                </button>
                                                {openDropdown === index && (
                                                    <ul className="mt-2 bg-white/10 rounded-lg py-2 list-none">
                                                        {link.dropdownItems.map((item, itemIndex) => (
                                                            <li key={itemIndex}>
                                                                <Link
                                                                    to={item.url}
                                                                    onClick={() => {
                                                                        setOpenDropdown(null);
                                                                        setIsMobileMenuOpen(false);
                                                                    }}
                                                                    className="block py-2 px-6 text-white hover:bg-white/20 transition-all no-underline"
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
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className="text-white  text-xl no-underline block py-2"
                                            >
                                                {link.name}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Navbar;