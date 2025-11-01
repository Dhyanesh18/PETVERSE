import React from 'react';

const HeroSection = () => {
    return (
        <section 
            className="relative h-screen w-full bg-cover bg-center bg-fixed"
            style={{
                backgroundImage: "url('/images/hero.jpg')",
            }}
        >
            <div className="absolute inset-0 bg-black/50 z-[1"></div>
            
            <div className="relative z-2 h-full flex flex-col justify-center items-center text-white text-center px-4 pt-20 pb-10">
                <h1 
                    className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 animate-fadeInUp font-poppins"
                    style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}
                >
                    Find your <span 
                        className="text-teal-300 text-6xl md:text-7xl lg:text-8xl" 
                        style={{ textShadow: '0 0 20px rgba(20, 184, 166, 0.2), 0 0 40px rgba(20, 184, 166, 0.1)' }}
                    >
                        Perfect Pet
                    </span>
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
                    className="font-bold text-lg px-10 py-4 my-5 bg-teal-500 rounded-lg text-white shadow-[0_4px_15px_rgba(43,188,169,0.4)] hover:scale-105 hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(43,188,169,0.6)] transition-all duration-300 animate-fadeInUp font-poppins"
                    style={{ animationDelay: '0.6s', animationFillMode: 'both' }}
                >
                    Adopt Now
                </button>
            </div>
        </section>
    );
};

export default HeroSection;