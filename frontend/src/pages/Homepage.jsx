import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { getFeaturedPets, getFeaturedProducts } from '../services/api';

const petCategories = [
    { name: 'Dogs', image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
    { name: 'Cats', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
    { name: 'Birds', image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' },
    { name: 'Fish', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80' }
];

const slides = [
    { image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', caption: 'Welcome to PetVerse' },
    { image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', caption: 'Find Your Perfect Companion' },
    { image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80', caption: 'Quality Pet Products' }
];

const testimonials = [
    { text: 'Found my perfect companion here!', author: 'John Wick' },
    { text: 'Great service and quality products', author: 'Donald Trump' },
    { text: 'Amazing experience, highly recommended!', author: 'Jane Doe' }
];

const features = [
    { title: 'Wide Selection', description: 'Browse through hundreds of pets and products' },
    { title: 'Trusted Sellers', description: 'All sellers are verified and trusted' },
    { title: 'Quality Assurance', description: 'We ensure the best quality for your pets' },
    { title: '24/7 Support', description: 'Our team is always here to help you' }
];

const HomePage = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [featuredPets, setFeaturedPets] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFeaturedItems();
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchFeaturedItems = async () => {
        try {
            const [petsRes, productsRes] = await Promise.all([
                getFeaturedPets(),
                getFeaturedProducts()
            ]);
            setFeaturedPets(petsRes.data || []);
            setFeaturedProducts(productsRes.data || []);
        } catch (error) {
            console.error('Failed to fetch featured items:', error);
            // Set empty arrays as fallback
            setFeaturedPets([]);
            setFeaturedProducts([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Hero Section - Matching Original Design */}
            <section 
                className="relative h-[80vh] w-full bg-cover bg-center mb-12"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1601758228041-f3b2795255f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)' }}
            >
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/40"></div>
                
                {/* Hero Content */}
                <div className="relative z-10 h-full flex flex-col justify-center items-center text-white text-center px-4 pb-8">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        Find your <span className="text-5xl md:text-7xl">Perfect Pet</span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-8">Find your furry friend and everything they need</p>
                    <Link
                        to="/pets"
                        className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-lg px-8 py-4 rounded-lg transition transform hover:scale-105 shadow-lg"
                    >
                        Adopt Now
                    </Link>
                </div>
            </section>

            {/* Slideshow */}
            <section className="container mx-auto px-4 mb-12">
                <div className="relative w-full h-[500px] overflow-hidden rounded-3xl shadow-2xl">
                    {slides.map((slide, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-1000 ${
                                index === currentSlide ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            <img
                                src={slide.image}
                                alt={slide.caption}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/1200x500?text=' + slide.caption;
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                            
                            {/* Caption at bottom center */}
                            <div className="absolute bottom-16 left-0 right-0 flex items-center justify-center">
                                <h2 className="text-3xl md:text-4xl font-semibold text-white bg-black/30 px-6 py-2 rounded-lg backdrop-blur-sm">
                                    {slide.caption}
                                </h2>
                            </div>
                        </div>
                    ))}
                    
                    {/* Navigation Arrows */}
                    <button
                        onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    
                    {/* Indicator Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`w-2.5 h-2.5 rounded-full transition ${
                                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Search by Pet */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Search by Pet</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {petCategories.map((pet) => (
                            <Link
                                key={pet.name}
                                to="/pets"
                                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                            >
                                <div className="h-64">
                                    <img
                                        src={pet.image}
                                        alt={pet.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/300x300?text=' + pet.name;
                                        }}
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                                    <div className="p-4 w-full text-center">
                                        <h3 className="text-2xl font-bold text-white mb-2">{pet.name}</h3>
                                        <button className="bg-white text-indigo-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition">
                                            Explore
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Pets */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Featured Pets</h2>
                    {loading ? (
                        <div className="text-center">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredPets.slice(0, 4).map((pet) => (
                                <Link
                                    key={pet._id}
                                    to={`/seller/detail/${pet._id}`}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
                                >
                                    <div className="h-56">
                                        {pet.images && pet.images.length > 0 ? (
                                            <img
                                                src={`data:${pet.images[0].contentType};base64,${pet.images[0].data}`}
                                                alt={pet.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-400">No image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{pet.breed}</h3>
                                        <p className="text-2xl font-bold text-indigo-600">₹{pet.price}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                    <div className="text-center mt-8">
                        <Link
                            to="/pets"
                            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                        >
                            View All Pets
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Featured Products</h2>
                    {loading ? (
                        <div className="text-center">Loading...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredProducts.slice(0, 4).map((product) => (
                                <Link
                                    key={product._id}
                                    to={`/buy/${product._id}`}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
                                >
                                    <div className="h-56">
                                        {product.images && product.images.length > 0 ? (
                                            <img
                                                src={`data:${product.images[0].contentType};base64,${product.images[0].data}`}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-400">No image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
                                        <p className="text-2xl font-bold text-indigo-600">₹{product.price}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                    <div className="text-center mt-8">
                        <Link
                            to="/products"
                            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                        >
                            View All Products
                        </Link>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">About PetVerse</h2>
                    <p className="text-center text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
                        Welcome to PetVerse, your one-stop destination for all things pets!
                    </p>
                    <p className="text-center text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
                        We are dedicated to helping you find the perfect pet and providing everything they need to live a happy and healthy life.
                    </p>
                    <h3 className="text-3xl font-bold text-center text-gray-800 mb-8">Why Choose Us</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                                <h4 className="text-xl font-bold text-indigo-600 mb-3">{feature.title}</h4>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">What Our Customers Say</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-gray-50 p-6 rounded-lg shadow-md">
                                <p className="text-gray-700 text-lg mb-4 italic">&quot;{testimonial.text}&quot;</p>
                                <p className="text-indigo-600 font-semibold">- {testimonial.author}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Find Your Perfect Pet?</h2>
                    <p className="text-xl mb-8">Join our community of pet lovers today</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/pets"
                            className="bg-white text-indigo-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition transform hover:scale-105"
                        >
                            Adopt a Pet
                        </Link>
                        <Link
                            to="/products"
                            className="bg-yellow-400 text-indigo-900 px-8 py-4 rounded-full text-lg font-bold hover:bg-yellow-300 transition transform hover:scale-105"
                        >
                            Shop Products
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-4">🐾 PetVerse</h3>
                            <p className="text-gray-400">Your Pet Care Companion</p>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                <li><Link to="/home" className="text-gray-400 hover:text-white">Home</Link></li>
                                <li><Link to="/about" className="text-gray-400 hover:text-white">About</Link></li>
                                <li><Link to="/pets" className="text-gray-400 hover:text-white">Pets</Link></li>
                                <li><Link to="/products" className="text-gray-400 hover:text-white">Products</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold mb-4">Follow Us</h4>
                            <div className="flex gap-4">
                                <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
                                <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
                                <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; {new Date().getFullYear()} PetVerse. All Rights Reserved</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;