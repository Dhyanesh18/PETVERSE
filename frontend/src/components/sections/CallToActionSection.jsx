import React from 'react';

const CallToActionSection = () => {
    return (
        <section 
            className="relative text-center bg-cover bg-center py-24 px-24 text-white h-[350px] m-0 border-b border-gray-500"
            style={{ backgroundImage: "url('/images/slide1.jpg')" }}
        >
            <div className="absolute inset-0 bg-black/50 z-1"></div>
            
            <div className="relative z-2">
                <h2 className="text-4xl font-bold mb-4">Ready to Find Your Perfect Pet?</h2>
                <p className="text-gray-100 text-lg mb-6">Join our community of pet lovers today</p>
                <div className="flex justify-center gap-8 my-5">
                    <button
                        onClick={() => window.location.href = '/pets'}
                        className="py-2.5 px-5 text-base font-bold rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.5)] cursor-pointer my-2.5 mx-1 transition-all duration-400 bg-black/30 text-white border border-white hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] hover:scale-110"
                    >
                        Adopt a Pet
                    </button>
                    <button
                        onClick={() => window.location.href = '/products'}
                        className="py-2.5 px-5 text-base font-bold rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.5)] cursor-pointer my-2.5 mx-1 transition-all duration-400 bg-black/30 text-white border border-white hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] hover:scale-110"
                    >
                        Shop Products
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CallToActionSection;