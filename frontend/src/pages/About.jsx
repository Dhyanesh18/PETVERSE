import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
    const stats = {
        activeUsers: 1500,
        activeSellers: 250,
        activeServiceProviders: 180,
        petsAvailable: 320
    };

    const features = [
        {
            icon: '🐾',
            title: 'Pet Adoption',
            description: 'Find your perfect companion through our safe and verified platform. Connect with responsible breeders and rescues.'
        },
        {
            icon: '🛒',
            title: 'Pet Essentials',
            description: 'Shop premium pet food, toys, and accessories tailored to your pet\'s specific needs from trusted sellers.'
        },
        {
            icon: '👨‍⚕️',
            title: 'Professional Services',
            description: 'Book appointments with vets, trainers, groomers, and more based on your schedule.'
        },
        {
            icon: '❤️',
            title: 'Pet Mating',
            description: 'Connect with other pet owners to find the perfect match for your pet in a safe, responsible environment.'
        },
        {
            icon: '🏠',
            title: 'Pet Community',
            description: 'Join pet-friendly events, share experiences, and connect with other pet enthusiasts in your area.'
        },
        {
            icon: '🔒',
            title: 'Verified Sellers',
            description: 'All our sellers and service providers are carefully vetted to ensure quality and reliability.'
        }
    ];

    const teamMembers = [
        {
            name: 'Dhyaneshvar K',
            role: 'Member 1',
            image: '/images/mem.jpg',
            social: {
                linkedin: '#',
                twitter: '#',
                instagram: '#'
            }
        },
        {
            name: 'Jeevan M',
            role: 'Member 2',
            image: '/images/mem.jpg',
            social: {
                linkedin: '#',
                twitter: '#',
                instagram: '#'
            }
        },
        {
            name: 'Suresh',
            role: 'Member 3',
            image: '/images/mem.jpg',
            social: {
                linkedin: '#',
                twitter: '#',
                instagram: '#'
            }
        },
        {
            name: 'Koushik',
            role: 'Member 4',
            image: '/images/mem.jpg',
            social: {
                linkedin: '#',
                twitter: '#',
                github: '#'
            }
        },
        {
            name: 'Charan',
            role: 'Member 5',
            image: '/images/mem.jpg',
            social: {
                linkedin: '#',
                twitter: '#',
                github: '#'
            }
        }
    ];

    return (
        <div className="min-h-screen bg-white" style={{ paddingTop: '35px' }}>
            {/* Hero Section */}
            <section className="relative bg-linear-to-br from-teal-600 to-teal-800 text-white py-20 px-4" style={{marginTop:"40px"}}>
                <div className="container mx-auto text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">About Us</h1>
                    <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
                        PetVerse is a community where pet lovers connect, sell, and find everything their furry friends need.
                    </p>
                    <Link 
                        to="/signup" 
                        className="inline-block bg-white text-teal-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg"
                    >
                        Join Our Community
                    </Link>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-teal-600 mb-2">
                                {stats.activeUsers}+
                            </div>
                            <div className="text-gray-600 font-medium">Active Users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-teal-600 mb-2">
                                {stats.activeSellers}+
                            </div>
                            <div className="text-gray-600 font-medium">Pet Sellers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-teal-600 mb-2">
                                {stats.activeServiceProviders}+
                            </div>
                            <div className="text-gray-600 font-medium">Service Providers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-teal-600 mb-2">
                                {stats.petsAvailable}
                            </div>
                            <div className="text-gray-600 font-medium">Pets Available</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold text-gray-800 mb-6">Our Mission</h2>
                            <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
                                <p>
                                    At PetVerse, we aim to build a vibrant community of pet lovers by making it easier than ever to care for and connect with pets. Our vision is to ensure every pet finds a loving home and every pet parent has access to reliable services and products.
                                </p>
                                <p>
                                    We believe in creating a safe, transparent marketplace where buyers can find trusted sellers and service providers. Our platform brings together all aspects of pet ownership - from adoption to healthcare, from training to everyday supplies - in one convenient place.
                                </p>
                                <p>
                                    Every connection made on PetVerse contributes to our goal of improving the lives of pets and their humans everywhere.
                                </p>
                            </div>
                        </div>
                        <div className="order-first md:order-last">
                            <img 
                                src="https://images.unsplash.com/photo-1534361960057-19889db9621e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
                                alt="Happy pets and owners"
                                className="rounded-lg shadow-lg w-full h-auto"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">What We Offer</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Community Section */}
            <section className="py-16 bg-linear-to-r from-teal-600 to-teal-700 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Join Our Pet-Loving Community</h2>
                    <div className="max-w-4xl mx-auto space-y-4 text-lg leading-relaxed mb-8">
                        <p>
                            PetVerse is more than just a marketplace - it's a community of passionate pet lovers who share knowledge, experiences, and support. Whether you're a first-time pet parent or a seasoned professional, there's a place for you here.
                        </p>
                        <p>
                            Connect with like-minded individuals, discover pet-friendly events in your area, and be part of a movement that's making pet care more accessible and enjoyable for everyone.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            to="/signup" 
                            className="bg-white text-teal-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-300"
                        >
                            Sign Up Today
                        </Link>
                        <Link 
                            to="/events" 
                            className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-teal-600 transition-colors duration-300"
                        >
                            Discover Events
                        </Link>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Meet Our Team</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="text-center">
                                <div className="mb-4">
                                    <img 
                                        src={member.image} 
                                        alt={member.name}
                                        className="w-32 h-32 rounded-full mx-auto object-cover shadow-lg"
                                    />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-1">{member.name}</h3>
                                <p className="text-gray-600 mb-4">{member.role}</p>
                                <div className="flex justify-center space-x-3">
                                    {member.social.linkedin && (
                                        <a href={member.social.linkedin} className="text-gray-400 hover:text-blue-600 transition-colors">
                                            <i className="fab fa-linkedin text-xl"></i>
                                        </a>
                                    )}
                                    {member.social.twitter && (
                                        <a href={member.social.twitter} className="text-gray-400 hover:text-blue-400 transition-colors">
                                            <i className="fab fa-twitter text-xl"></i>
                                        </a>
                                    )}
                                    {member.social.instagram && (
                                        <a href={member.social.instagram} className="text-gray-400 hover:text-pink-600 transition-colors">
                                            <i className="fab fa-instagram text-xl"></i>
                                        </a>
                                    )}
                                    {member.social.github && (
                                        <a href={member.social.github} className="text-gray-400 hover:text-gray-800 transition-colors">
                                            <i className="fab fa-github text-xl"></i>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
