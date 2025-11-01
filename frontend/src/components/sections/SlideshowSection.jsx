import React, { useState, useEffect } from 'react';

const SlideshowSection = ({ slides }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (slides.length > 0) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [slides]);

    const changeSlide = (direction) => {
        if (slides.length === 0) return;
        setCurrentSlide((prev) => {
            const newSlide = prev + direction;
            if (newSlide < 0) return slides.length - 1;
            if (newSlide >= slides.length) return 0;
            return newSlide;
        });
    };

    if (!slides || slides.length === 0) return null;

    return (
        <section className="py-20 px-4 md:px-10">
            <div className="relative max-w-full mx-auto mb-5 overflow-hidden rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-white">
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
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-5 py-2.5 text-lg rounded-md text-center font-semibold font-poppins">
                            {slide.caption}
                        </div>
                    </div>
                ))}
                
                <button 
                    onClick={() => changeSlide(-1)}
                    className="absolute top-1/2 left-2.5 -translate-y-1/2 bg-black/50 text-white border-none px-5 py-2.5 text-lg cursor-pointer z-10 rounded-full hover:bg-black/80 transition-all duration-300"
                >
                    &#10094;
                </button>
                <button 
                    onClick={() => changeSlide(1)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 bg-black/50 text-white border-none px-5 py-2.5 text-lg cursor-pointer z-10 rounded-full hover:bg-black/80 transition-all duration-300"
                >
                    &#10095;
                </button>
            </div>

            <div className="flex justify-center gap-2.5">
                {slides.map((_, index) => (
                    <span
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-2.5 cursor-pointer transition-all duration-300 ${
                            index === currentSlide 
                                ? 'bg-black w-2.5 rounded-full' 
                                : 'bg-gray-400 w-2.5 rounded-full'
                        }`}
                    />
                ))}
            </div>
        </section>
    );
};

export default SlideshowSection;