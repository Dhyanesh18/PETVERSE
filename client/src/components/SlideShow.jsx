import { useState, useEffect, useCallback } from 'react';

const slides = [
    { image: '/images/slide1.jpg', caption: 'Adorable Puppies' },
    { image: '/images/slide2.jpg', caption: 'Playful Kittens' },
    { image: '/images/slide3.jpg', caption: 'Exotic Birds' }
];

const Slideshow = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const changeSlide = useCallback((n) => {
        let newIndex = currentIndex + n;
        if (newIndex >= slides.length) { newIndex = 0; }
        if (newIndex < 0) { newIndex = slides.length - 1; }
        setCurrentIndex(newIndex);
    }, [currentIndex]); 

    useEffect(() => {
        const timer = setTimeout(() => {
            changeSlide(1);
        }, 5000);
        return () => clearTimeout(timer);

    }, [changeSlide]); 

    return (
        <section id="slideshow">
            <div className="slideshow-container">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className="slide fade"
                        style={{ display: index === currentIndex ? 'block' : 'none' }}
                    >
                        <img src={slide.image} alt={slide.caption} />
                        <div className="caption">{slide.caption}</div>
                    </div>
                ))}
                <button className="slideshow-btn prev" onClick={() => changeSlide(-1)}>&#10094;</button>
                <button className="slideshow-btn next" onClick={() => changeSlide(1)}>&#10095;</button>
            </div>
        </section>
    );
};

export default Slideshow;