import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPaw, FaShoppingCart, FaStar } from 'react-icons/fa';
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

    const changeSlide = (direction) => {
        if (slides.length === 0) return;
        setCurrentSlide((prev) => {
            const newSlide = prev + direction;
            if (newSlide < 0) return slides.length - 1;
            if (newSlide >= slides.length) return 0;
            return newSlide;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <FaPaw className="text-6xl text-secondary-500 animate-bounce mx-auto mb-4" />
                    <p className="text-xl text-gray-700 font-poppins font-semibold">Loading PetVerse...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50">
            {/* Hero Section */}
            <section 
                className="relative h-screen w-full bg-cover bg-center bg-fixed"
                style={{
                    backgroundImage: "url('/images/hero.jpg')",
                }}
            >
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/60 z-1"></div>
                
                {/* Hero Content */}
                <div className="relative z-2 h-full flex flex-col justify-center items-center text-white text-center px-4 pt-20 pb-10">
                    <h1 
                        className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 animate-fadeInUp font-poppins"
                        style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}
                    >
                        Find your <span className="text-teal-400 text-6xl md:text-7xl lg:text-8xl" style={{ textShadow: `0 0 20px rgba(20, 184, 166, 0.2), 0 0 40px rgba(20, 184, 166, 0.1)`}}>Perfect Pet</span>
                    </h1>
                    <p 
                        className="text-xl md:text-2xl mb-8 animate-fadeInUp font-poppins font-medium"
                        style={{ 
                            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                            animationDelay: '0.3s',
                            animationFillMode: 'both'
                        }}
                    >
                        Find your furry friend and everything they need
                    </p>
                    <button 
                        onClick={() => window.location.href = '/pets'}
                        className="font-bold text-lg px-10 py-4 my-5 bg-teal-500 rounded-lg text-white text-shadow-teal-600 text-shadow-md shadow-[0_4px_15px_rgba(43,188,169,0.4)] hover:scale-105 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(43,188,169,0.6)] transition-all duration-300 animate-fadeInUp font-poppins"
                        style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
                    >
                        Adopt Now
                    </button>
                </div>
            </section>

            {/* Slideshow Section */}
            {slides.length > 0 && (
                <section className="py-20 px-4 md:px-10">
                    <div className="relative max-w-full mx-auto mb-5 overflow-hidden rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                        {slides.map((slide, index) => (
                            <div
                                key={index}
                                className={`${index === currentSlide ? 'block' : 'hidden'} relative transition-opacity duration-1000`}
                            >
                                <img 
                                    src={slide.image} 
                                    alt={`slide${index + 1}`}
                                    className="w-full h-[400px] object-cover"
                                />
                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-3 text-lg rounded-lg text-center font-semibold font-poppins">
                                    {slide.caption}
                                </div>
                            </div>
                        ))}
                        
                        <button 
                            onClick={() => changeSlide(-1)}
                            className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/50 text-white border-none px-5 py-3 text-xl cursor-pointer z-10 rounded-full hover:bg-black/80 hover:scale-110 transition-all duration-300"
                        >
                            &#10094;
                        </button>
                        <button 
                            onClick={() => changeSlide(1)}
                            className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/50 text-white border-none px-5 py-3 text-xl cursor-pointer z-10 rounded-full hover:bg-black/80 hover:scale-110 transition-all duration-300"
                        >
                            &#10095;
                        </button>
                    </div>

                    <div className="flex justify-center gap-2.5 mt-4">
                        {slides.map((_, index) => (
                            <span
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-3 rounded-full cursor-pointer transition-all duration-300 ${
                                    index === currentSlide 
                                        ? 'bg-secondary-500 w-8 rounded-md' 
                                        : 'bg-gray-300 w-3 hover:bg-primary-500'
                                }`}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Search by Pet Categories */}
            <section id="searchby-pet" className="searchby-pet pt-0">
                <div className="searchby-pet-content">
                    <h1 className="section-title">Search by Pet</h1>
                    <div className="pet-grid">
                        {petCategories.map((pet, index) => (
                            <div key={index} className="pet-card">
                                <img src={pet.image} alt={pet.name.toLowerCase()} />
                                <h2 className="card-text">{pet.name}</h2>
                                <button
                                    className="card-button"
                                    onClick={() => (window.location.href = '/pets')}
                                >
                                    Explore
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr />

            {/* Featured Pets Section */}
            <section className="feature-pets">
                <div className="feature-pets-content">
                    <h1 className="section-title">Featured Pets</h1>
                    <div className="pet-grid">
                        {featuredPets.map((pet) => (
                            <div key={pet._id} className="pet-card feature-pets-card">
                                <Link to={`/pets/${pet._id}`}>
                                    <img
                                        src={pet.thumbnail || '/images/default-pet.jpg'}
                                        alt={pet.name}
                                    />
                                </Link>
                                <Link to={`/pets/${pet._id}`}>
                                    <h2 className="card-text">{pet.name}</h2>
                                </Link>
                                <p className="text-sm text-gray-600 mb-2 font-poppins">
                                    {pet.breed} • {pet.age} • {pet.gender}
                                </p>
                                <p className="price">
                                    <strong>₹ {pet.price?.toLocaleString()}</strong>
                                </p>
                                <button
                                    className="card-button"
                                    onClick={() => addToCart(pet._id, 'Pet')}
                                >
                                    Buy Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <hr />

            {/* Featured Products Section */}
            <section className="feature-prod">
                <div className="feature-pdts-content">
                    <h1 className="section-title">Featured Products</h1>
                    <div className="product-grid">
                        {featuredProducts.map((product) => (
                            <div key={product._id} className="product-card feature-pdts-card">
                                <Link to={`/products/${product._id}`}>
                                    <img
                                        src={product.thumbnail || '/images/default-product.jpg'}
                                        alt={product.name}
                                    />
                                </Link>
                                <Link to={`/products/${product._id}`}>
                                    <h2 className="card-text">{product.name}</h2>
                                </Link>
                                <div className="flex items-center justify-center mb-2">
                                    <div className="flex text-amber-400 text-sm mr-2">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar
                                                key={i}
                                                className={
                                                    i < Math.floor(product.avgRating || 0)
                                                        ? 'text-amber-400'
                                                        : 'text-gray-300'
                                                }
                                            />
                                        ))}
                                    </div>
                                    <span className="text-gray-600 text-sm font-poppins">
                                        ({product.reviewCount || 0})
                                    </span>
                                </div>
                                <p className="price">
                                    <strong>₹ {product.price?.toLocaleString()}</strong>
                                </p>
                                {product.discount > 0 && (
                                    <span className="bg-linear-to-r from-red-500 to-pink-600 text-white text-xs font-bold px-2 py-1 rounded font-poppins inline-block mb-2">
                                        {product.discount}% OFF
                                    </span>
                                )}
                                <button
                                    className="card-button"
                                    onClick={() => addToCart(product._id, 'Product')}
                                >
                                    Buy Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about">
                <div className="container">
                    <h2 className="section-title">About Petverse</h2>
                    <p className="about-text">
                        Welcome to PetVerse, your one-stop destination for all things pets!
                    </p>
                    <p className="about-text">
                        We are dedicated to helping you find the perfect pet and providing
                        everything they need to live a happy and healthy life.
                    </p>
                    <h3 className="features-title">Why Choose Us</h3>
                    <ul className="features-list">
                        {features.map((feature, index) => (
                            <li key={index}>
                                <span className="point">✔ &nbsp;</span>
                                <strong>{feature.title}:</strong> {feature.description}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials">
                <div className="testimonial-section">
                    <h2>What Our Customers Say</h2>
                    <div className="testimonial-cards">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="testimonial">
                                <p>"{testimonial.text}"</p>
                                <span>- {testimonial.author}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="call-to-action">
                <h2>Ready to Find Your Perfect Pet?</h2>
                <p>Join our community of pet lovers today</p>
                <div className="cta-buttons">
                    <button
                        id="adopt"
                        onClick={() => (window.location.href = '/pets')}
                        className="cta-btn"
                    >
                        Adopt a Pet
                    </button>
                    <button
                        id="shop"
                        onClick={() => (window.location.href = '/products')}
                        className="cta-btn"
                    >
                        Shop Products
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Homepage;