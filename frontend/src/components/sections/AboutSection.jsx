import React from 'react';

const AboutSection = ({ features }) => {
    return (
        <section className="py-12 px-20 pb-20 bg-[#afc6c7]">
            <div className="max-w-full mx-auto text-center">
                <h2 className="text-4xl text-gray-700 my-8 text-center font-bold">
                    About Petverse
                </h2>
                <p className="text-xl leading-relaxed text-gray-700 my-4">
                    Welcome to PetVerse, your one-stop destination for all things pets!
                </p>
                <p className="text-xl leading-relaxed text-gray-700 my-4">
                    We are dedicated to helping you find the perfect pet and providing
                    everything they need to live a happy and healthy life.
                </p>
                <h3 className="text-2xl text-gray-800 mt-8 font-semibold">
                    Why Choose Us
                </h3>
                <ul className="text-left my-5 mx-auto p-0 list-none">
                    {features.map((feature, index) => (
                        <li key={index} className="text-center text-lg leading-loose text-gray-600 pl-5 -indent-5 mb-2.5">
                            <span className="text-green-600 font-bold">✔ &nbsp;</span>
                            <strong>{feature.title}:</strong> {feature.description}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

export default AboutSection;