import React from 'react';

const TestimonialCard = ({ testimonial }) => {
    return (
        <div className="bg-white rounded-lg p-9 shadow-[0_0_6px_rgba(0,0,0,0.3)] hover:scale-110 hover:shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all duration-300">
            <p className="italic text-gray-600 mb-4 text-center">
                "{testimonial.text}"
            </p>
            <span className="font-bold text-gray-800 block text-center">
                - {testimonial.author}
            </span>
        </div>
    );
};

export default TestimonialCard;