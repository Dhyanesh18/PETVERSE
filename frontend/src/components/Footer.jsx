import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPaw } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="bg-stone-900 text-white py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Logo Section */}
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <FaPaw className="text-3xl text-cyan-700" />
                            <h2 className="text-2xl font-bold text-cyan-700">PetVerse</h2>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Your one-stop destination for all pet needs. Find pets, products, and services all in one place.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/pets" className="text-cyan-700 hover:text-white transition-colors">
                                    Pets
                                </Link>
                            </li>
                            <li>
                                <Link to="/products" className="text-cyan-700 hover:text-white transition-colors">
                                    Products
                                </Link>
                            </li>
                            <li>
                                <Link to="/services" className="text-cyan-700 hover:text-white transition-colors">
                                    Services
                                </Link>
                            </li>
                            <li>
                                <Link to="/events" className="text-cyan-700 hover:text-white transition-colors">
                                    Events
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-cyan-700 hover:text-white transition-colors">
                                    About Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
                        <div className="space-y-2">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-cyan-700 hover:text-white transition-colors"
                            >
                                <FaFacebook className="text-xl" />
                                <span>Facebook</span>
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-cyan-700 hover:text-white transition-colors"
                            >
                                <FaTwitter className="text-xl" />
                                <span>Twitter</span>
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-cyan-700 hover:text-white transition-colors"
                            >
                                <FaInstagram className="text-xl" />
                                <span>Instagram</span>
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center space-x-2 text-cyan-700 hover:text-white transition-colors"
                            >
                                <FaLinkedin className="text-xl" />
                                <span>LinkedIn</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-8 pt-8 border-t border-gray-700 text-center">
                    <p className="text-gray-400 text-sm">
                        © {new Date().getFullYear()} PetVerse. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;