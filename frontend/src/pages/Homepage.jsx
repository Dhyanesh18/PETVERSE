import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPaw } from 'react-icons/fa';
import api from '../utils/api';

// Import components
import HeroSection from '../components/sections/HeroSection';
import SlideshowSection from '../components/sections/SlideshowSection';
import AboutSection from '../components/sections/AboutSection';
import CallToActionSection from '../components/sections/CallToActionSection';
import PetCard from '../components/cards/PetCard';
import ProductCard from '../components/cards/ProductCard';
import CategoryCard from '../components/cards/CategoryCard';
import TestimonialCard from '../components/cards/TestimonialCard';

const Homepage = () => {
    const navigate = useNavigate();
    const [featuredPets, setFeaturedPets] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [petCategories, setPetCategories] = useState([]);
    const [features, setFeatures] = useState([]);
    const [testimonials, setTestimonials] = useState([]);

    useEffect(() => {
        fetchHomeData();
    }, []);

    const fetchHomeData = async () => {
        try {
            const response = await api.get('/user/home');
            console.log('Full API Response:', response);
            console.log('Response Data:', response.data);
            
            if (response.data.success) {
                const data = response.data.data;
                console.log('Data Object:', data);
                console.log('Featured Pets:', data.featuredPets);
                console.log('Featured Products:', data.featuredProducts);
                console.log('Featured Products Length:', data.featuredProducts?.length);
                console.log('Featured Products Type:', typeof data.featuredProducts);
                console.log('Is Array?', Array.isArray(data.featuredProducts));
                
                setFeaturedPets(data.featuredPets || []);
                setFeaturedProducts(data.featuredProducts || []);
                setSlides(data.slides || []);
                setPetCategories(data.petCategories || []);
                setFeatures(data.features || []);
                setTestimonials(data.testimonials || []);
            } else {
                console.error('API returned success: false', response.data);
            }
        } catch (error) {
            console.error('Error fetching home data:', error);
            console.error('Error response:', error.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (productId, itemType = 'Product') => {
        try {
            await api.post('/cart/add', {
                productId,
                quantity: 1,
                itemType
            });
            alert('Added to cart!');
            // Dispatch cart update event
            window.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            console.error('Error adding to cart:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            } else {
                alert('Failed to add to cart. Please try again.');
            }
        }
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
            <HeroSection />

            {/* Slideshow Section */}
            <SlideshowSection slides={slides} />

            {/* Divider */}
            <hr className="border-none h-px bg-gray-300 w-[90%] mx-auto my-12 mt-15" />

            {/* Search by Pet Categories */}
            <section className="py-0">
                <div className="max-w-[1400px] mx-auto">
                    <h1 className="text-4xl text-gray-700 my-8 text-center font-bold">
                        Search by Pet
                    </h1>
                    <div className="flex gap-5 p-2.5 px-5 justify-center items-center mx-auto">
                        {petCategories.map((category, index) => (
                            <CategoryCard
                                key={index}
                                category={category}
                                onClick={() => {
                                    // Extract category name from the category object
                                    const categoryName = category.name?.toLowerCase() || '';
                                    navigate(`/pets?category=${categoryName}`);
                                }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Divider */}
            <hr className="border-none h-px bg-gray-300 w-[90%] mx-auto my-12 mt-15" />

            {/* Featured Pets Section */}
            <section className="py-0">
                <div className="max-w-[1400px] mx-auto px-4">
                    <h1 className="text-4xl text-gray-700 my-8 text-center font-bold">
                        Featured Pets
                    </h1>
                    <div className="flex gap-5 p-2.5 px-5 pb-10 justify-center items-center mx-auto">
                        {featuredPets.map((pet) => (
                            <PetCard
                                key={pet._id}
                                pet={pet}
                                onAddToCart={addToCart}
                                variant="feature"
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Divider */}
            <hr className="border-none h-px bg-gray-300 w-[90%] mx-auto my-12 mt-15" />

            {/* Featured Products Section */}
            <section className="py-0">
                <div className="max-w-[1400px] mx-auto px-4">
                    <h1 className="text-4xl text-gray-700 my-8 text-center font-bold">
                        Featured Products
                    </h1>
                    
                    {featuredProducts.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">No featured products available</p>
                    ) : (
                        <div className="flex gap-5 p-2.5 px-5 pb-30 justify-center items-center mx-auto">
                            {featuredProducts.map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    onAddToCart={addToCart}
                                    variant="feature"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* About Section */}
            <AboutSection features={features} />

            {/* Testimonials Section */}
            <section className="text-center my-20 mt-12">
                <h2 className="text-4xl text-gray-700 my-8 font-bold">What Our Customers Say</h2>
                <div className="flex gap-8 mx-8">
                    {testimonials.map((testimonial, index) => (
                        <TestimonialCard key={index} testimonial={testimonial} />
                    ))}
                </div>
            </section>

            {/* Call to Action Section */}
            <CallToActionSection />
        </div>
    );
};

export default Homepage;