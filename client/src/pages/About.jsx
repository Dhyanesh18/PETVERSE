import React from 'react';
import Header from '../components/Header';

const About = () => {
    const stats = [
        { label: 'Active Users', value: '10,000+', icon: '👥' },
        { label: 'Pets Available', value: '2,500+', icon: '🐕' },
        { label: 'Active Sellers', value: '500+', icon: '🏪' },
        { label: 'Service Providers', value: '200+', icon: '🔧' }
    ];

    const features = [
        {
            title: 'Pet Adoption',
            description: 'Find your perfect companion from our extensive database of pets looking for loving homes.',
            icon: '🏠'
        },
        {
            title: 'Pet Products',
            description: 'Shop from a wide range of high-quality pet products, food, toys, and accessories.',
            icon: '🛍️'
        },
        {
            title: 'Pet Services',
            description: 'Connect with verified veterinarians, groomers, trainers, and pet sitters in your area.',
            icon: '⚕️'
        },
        {
            title: 'Pet Mating',
            description: 'Find suitable mates for your pets through our secure and verified breeding platform.',
            icon: '💕'
        },
        {
            title: 'Events & Community',
            description: 'Join pet events, shows, and connect with fellow pet lovers in your community.',
            icon: '🎉'
        },
        {
            title: 'Expert Care',
            description: 'Access professional advice and resources to ensure the best care for your pets.',
            icon: '🩺'
        }
    ];

    const team = [
        {
            name: 'Dr. Sarah Johnson',
            role: 'Chief Veterinarian',
            description: 'With 15+ years of experience, Dr. Johnson ensures all pets on our platform receive the best care.',
            image: '👩‍⚕️'
        },
        {
            name: 'Mike Chen',
            role: 'Technology Director',
            description: 'Leading our tech team to create the most user-friendly pet platform in the industry.',
            image: '👨‍💻'
        },
        {
            name: 'Lisa Rodriguez',
            role: 'Community Manager',
            description: 'Building and nurturing our growing community of pet lovers and responsible owners.',
            image: '👩‍💼'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl font-bold mb-6">About PetVerse</h1>
                    <p className="text-xl max-w-3xl mx-auto leading-relaxed">
                        Your one-stop destination for everything pet-related. We're passionate about connecting pets with loving families, 
                        providing quality products, and building a community of responsible pet owners.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                {/* Mission Section */}
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <h2 className="text-4xl font-bold text-gray-900 mb-8">Our Mission</h2>
                    <p className="text-lg text-gray-600 leading-relaxed mb-8">
                        At PetVerse, we believe every pet deserves a loving home and the best possible care. Our mission is to create 
                        a comprehensive platform that connects pet lovers, facilitates responsible pet ownership, and promotes the 
                        well-being of animals everywhere.
                    </p>
                    <div className="bg-blue-50 rounded-lg p-8">
                        <h3 className="text-2xl font-semibold text-blue-900 mb-4">Why Choose PetVerse?</h3>
                        <p className="text-blue-800">
                            We combine cutting-edge technology with genuine care for animals to provide a safe, reliable, and 
                            comprehensive platform for all your pet needs. From adoption to products, services to community - 
                            we've got you covered.
                        </p>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mb-20">
                    <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Impact</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                                <div className="text-4xl mb-4">{stat.icon}</div>
                                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</div>
                                <div className="text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features Section */}
                <div className="mb-20">
                    <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">What We Offer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                                <div className="text-3xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Values Section */}
                <div className="mb-20">
                    <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🛡️</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Safety First</h3>
                            <p className="text-gray-600">
                                We prioritize the safety and well-being of all pets and ensure all our partners are verified and trustworthy.
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🤝</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Community</h3>
                            <p className="text-gray-600">
                                Building a supportive community where pet lovers can connect, share experiences, and help each other.
                            </p>
                        </div>
                        
                        <div className="text-center">
                            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">💡</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Innovation</h3>
                            <p className="text-gray-600">
                                Continuously improving our platform with the latest technology to serve pets and their owners better.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Team Section */}
                <div className="mb-20">
                    <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Meet Our Team</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {team.map((member, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                                <div className="text-6xl mb-4">{member.image}</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                                <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                                <p className="text-gray-600 text-sm">{member.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Get In Touch</h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Have questions or suggestions? We'd love to hear from you!
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        <div>
                            <div className="text-2xl mb-2">📧</div>
                            <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                            <p className="text-gray-600">support@petverse.com</p>
                        </div>
                        
                        <div>
                            <div className="text-2xl mb-2">📞</div>
                            <h3 className="font-semibold text-gray-900 mb-1">Call Us</h3>
                            <p className="text-gray-600">+91-XXXX-XXXX-XX</p>
                        </div>
                        
                        <div>
                            <div className="text-2xl mb-2">📍</div>
                            <h3 className="font-semibold text-gray-900 mb-1">Visit Us</h3>
                            <p className="text-gray-600">Bangalore, Karnataka, India</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            Contact Support
                        </button>
                        <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            Join Our Community
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;