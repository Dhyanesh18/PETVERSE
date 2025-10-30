import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPaw, FaShoppingCart, FaHeart, FaStar, FaArrowRight } from 'react-icons/fa';
import api from '../utils/api';

const Homepage = () => {
    const [featuredPets, setFeaturedPets] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [slides, setSlides] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [petCategories, setPetCategories] = useState([]);
    const [features, setFeatures] = useState([]);
    const [testimonials, setTestimonials] = useState([]);

    useEffect(() => {
        fetchHomeData();
    }, []);

    // Auto-rotate slides
    useEffect(() => {
        if (slides.length > 0) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [slides]);

    const fetchHomeData = async () => {
        try {
            const response = await api.get('/user/home');
            if (response.data.success) {
                const data = response.data.data;
                setFeaturedPets(data.featuredPets || []);
                setFeaturedProducts(data.featuredProducts || []);
                setSlides(data.slides || []);
                setPetCategories(data.petCategories || []);
                setFeatures(data.features || []);
                setTestimonials(data.testimonials || []);
            }
        } catch (error) {
            console.error('Error fetching home data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (productId, itemType = 'Product') => {
        try {
            await api.post('/user/cart/add', {
                productId,
                quantity: 1,
                itemType
            });
            alert('Added to cart!');
        } catch (error) {
            console.error('Error adding to cart:', error);
            if (error.response?.status === 401) {
                window.location.href = '/login';
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100">
                <div className="text-center">
                    <FaPaw className="text-6xl text-cyan-500 animate-bounce mx-auto mb-4" />
                    <p className="text-xl text-gray-700">Loading PetVerse...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-cyan-50 to-blue-100 min-h-screen">
            {/* Hero Slider Section */}
            <section className="relative h-[500px] md:h-[600px] overflow-hidden">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${
                            index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${slide.image || '/images/default-slide.jpg'})`,
                            }}
                        >
                            <div className="w-full h-full bg-black bg-opacity-40 flex items-center justify-center">
                                <div className="text-center text-white px-4">
                                    <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in">
                                        {slide.caption || 'Welcome to PetVerse'}
                                    </h1>
                                    <p className="text-xl md:text-2xl mb-8">
                                        Your one-stop destination for all pet needs
                                    </p>
                                    <Link
                                        to="/pets"
                                        className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-full transition-all transform hover:scale-105"
                                    >
                                        Explore Pets
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Slide Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all ${
                                index === currentSlide
                                    ? 'bg-white w-8'
                                    : 'bg-white bg-opacity-50'
                            }`}
                        />
                    ))}
                </div>
            </section>

            {/* Pet Categories Section */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
                        Browse by Category
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {petCategories.map((category, index) => (
                            <Link
                                key={index}
                                to={category.url}
                                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                            >
                                <img
                                    src={category.image || '/images/default-category.jpg'}
                                    alt={category.name}
                                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent flex items-end">
                                    <h3 className="text-white text-xl font-bold p-4 w-full text-center">
                                        {category.name}
                                    </h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Pets Section */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                            Featured Pets
                        </h2>
                        <Link
                            to="/pets"
                            className="text-cyan-500 hover:text-cyan-600 font-semibold flex items-center space-x-2"
                        >
                            <span>View All</span>
                            <FaArrowRight />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {featuredPets.map((pet) => (
                            <div
                                key={pet._id}
                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2"
                            >
                                <Link to={`/pets/${pet._id}`}>
                                    <img
                                        src={pet.thumbnail || '/images/default-pet.jpg'}
                                        alt={pet.name}
                                        className="w-full h-48 object-cover"
                                    />
                                </Link>
                                <div className="p-4">
                                    <Link to={`/pets/${pet._id}`}>
                                        <h3 className="font-bold text-lg mb-2 text-gray-800 hover:text-cyan-500">
                                            {pet.name}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {pet.breed} • {pet.age} • {pet.gender}
                                    </p>
                                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                                        {pet.description}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-cyan-500 font-bold text-xl">
                                            ₹{pet.price?.toLocaleString()}
                                        </span>
                                        <button
                                            onClick={() => addToCart(pet._id, 'Pet')}
                                            className="bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-lg transition-colors"
                                        >
                                            <FaShoppingCart />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products Section */}
            <section className="py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                            Top Products
                        </h2>
                        <Link
                            to="/products"
                            className="text-cyan-500 hover:text-cyan-600 font-semibold flex items-center space-x-2"
                        >
                            <span>View All</span>
                            <FaArrowRight />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {featuredProducts.map((product) => (
                            <div
                                key={product._id}
                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2"
                            >
                                <Link to={`/products/${product._id}`}>
                                    <img
                                        src={product.thumbnail || '/images/default-product.jpg'}
                                        alt={product.name}
                                        className="w-full h-48 object-cover"
                                    />
                                </Link>
                                <div className="p-4">
                                    <Link to={`/products/${product._id}`}>
                                        <h3 className="font-bold text-lg mb-2 text-gray-800 hover:text-cyan-500">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center mb-2">
                                        <div className="flex text-yellow-400 text-sm mr-2">
                                            {[...Array(5)].map((_, i) => (
                                                <FaStar
                                                    key={i}
                                                    className={
                                                        i < Math.floor(product.avgRating || 0)
                                                            ? 'text-yellow-400'
                                                            : 'text-gray-300'
                                                    }
                                                />
                                            ))}
                                        </div>
                                        <span className="text-gray-600 text-sm">
                                            ({product.reviewCount || 0})
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mb-3">
                                        {product.discount > 0 ? (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-cyan-500 font-bold text-xl">
                                                    ₹{product.discountedPrice}
                                                </span>
                                                <span className="text-gray-400 line-through text-sm">
                                                    ₹{product.price}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-cyan-500 font-bold text-xl">
                                                ₹{product.price?.toLocaleString()}
                                            </span>
                                        )}
                                        {product.discount > 0 && (
                                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                {product.discount}% OFF
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => addToCart(product._id, 'Product')}
                                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <FaShoppingCart />
                                        <span>Add to Cart</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                        Why Choose PetVerse?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="text-center">
                                <div className="text-6xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-cyan-100">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
                        What Our Customers Say
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all"
                            >
                                <div className="flex text-yellow-400 mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <FaStar key={i} />
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                                <p className="text-cyan-600 font-bold">- {testimonial.author}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Ready to Find Your Perfect Pet?
                    </h2>
                    <p className="text-xl mb-8 opacity-90">
                        Join thousands of happy pet owners who found their companions on PetVerse
                    </p>
                    <Link
                        to="/register"
                        className="inline-block bg-white text-purple-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
                    >
                        Get Started Today
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Homepage;