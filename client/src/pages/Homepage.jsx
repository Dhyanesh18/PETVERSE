import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Slideshow from '../components/SlideShow';
import FeaturedSection from '../components/FeaturedSection';
import ItemCard from '../components/ItemCard'; 
import { getFeaturedPets, getFeaturedProducts } from '../services/api';
import { Link } from 'react-router-dom';

const petCategories = [
    { name: 'Dogs', image: '/images/dog.jpg' },
    { name: 'Cats', image: '/images/cat.jpg' },
    { name: 'Birds', image: '/images/bird.jpg' },
    { name: 'Fish', image: '/images/fish.jpg' }
];

const testimonials = [
    { text: 'Found my perfect companion here!', author: 'John Wick' },
    { text: 'Great service and quality products', author: 'Donald Trump' },
];

const HomePage = () => {
    return (
        <>
            <Navbar />
            <main>
                <section className="hero">
                    <div className="hero-content">
                        <h1>Find your <span>Perfect Pet</span></h1>
                        <p>Find your furry friend and everything they need</p>
                        <Link to="/pets" className="adopt-btn">Adopt Now</Link>
                    </div>
                </section>
                
                <Slideshow />
                <hr />

                <section className="searchby-pet">
                    <div className="container">
                        <h1 className="section-title">Search by Pet</h1>
                        <div className="pet-grid">
                            {petCategories.map(pet => (
                                <div key={pet.name} className="pet-card">
                                    <img src={pet.image} alt={pet.name.toLowerCase()} />
                                    <h2 className="card-text">{pet.name}</h2>
                                    <Link to="/pets" className="card-button">Explore</Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                <hr />

                <FeaturedSection
                    title="Featured Pets"
                    fetchFunction={getFeaturedPets}
                    CardComponent={({ item }) => <ItemCard item={item} type="pet" />}
                    viewAllLink="/pets"
                />
                <hr />

                <FeaturedSection
                    title="Featured Products"
                    fetchFunction={getFeaturedProducts}
                    // Changed: Do the same for products
                    CardComponent={({ item }) => <ItemCard item={item} type="product" />}
                    viewAllLink="/products"
                />

                <section className="testimonials">
                    <div className="container">
                        <h2>What Our Customers Say</h2>
                        <div className="testimonial-cards">
                            {testimonials.map((t, i) => (
                                <div key={i} className="testimonial">
                                    <p>"{t.text}"</p>
                                    <span>- {t.author}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                
                <section className="call-to-action">
                    <h2>Ready to Find Your Perfect Pet?</h2>
                    <p>Join our community of pet lovers today</p>
                    <div className="cta-buttons">
                        <Link to="/pets" className="cta-btn">Adopt a Pet</Link>
                        <Link to="/products" className="cta-btn">Shop Products</Link>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
};

export default HomePage;