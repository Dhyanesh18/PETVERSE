import React from 'react';

const TermsAndConditions = () => {
    return (
        <div className="pt-30 pb-12 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-lg rounded-xl p-8 md:p-12">
            
            <h1 className="text-3xl md:text-4xl font-bold text-teal-700 mb-2 text-center">
                Terms and Conditions
            </h1>
            <p className="text-gray-500 text-center mb-8">Last Updated: January 2026</p>

            <div className="space-y-6 text-gray-700 leading-relaxed text-left">
                
                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">1. Introduction</h2>
                <p>
                    Welcome to PetVerse. By accessing our website, you agree to these terms. 
                    PetVerse acts as a platform connecting Pet Owners, Sellers, and Service Providers. 
                    We do not own the pets sold or directly provide the services listed unless explicitly stated.
                </p>
                </section>

                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">2. User Roles & Responsibilities</h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Pet Owners:</strong> You agree to provide accurate information about your pets. You are responsible for verifying the legitimacy of Sellers and Service Providers before making payments.</li>
                    <li><strong>Sellers:</strong> You warrant that all pets sold are healthy, vaccinated, and legally bred. Selling endangered species or sick animals is strictly prohibited and will result in an immediate ban.</li>
                    <li><strong>Service Providers:</strong> You must hold valid licenses (e.g., Veterinary license) where applicable. You are solely responsible for the quality and safety of services provided (breeding assistance, pet sitting, etc.).</li>
                </ul>
                </section>

                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">3. Pet Mating & Breeding Services</h2>
                <p>
                    PetVerse provides a platform for owners to find mates for their pets. We are not responsible for the genetic health, temperament, or outcome of any breeding arrangement. Users are encouraged to sign separate breeding contracts and verify health screenings independently.
                </p>
                </section>

                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">4. Lost & Found Feature</h2>
                <p>
                    The "Lost Pet" feature utilizes location data to alert nearby users. While we strive to help reunite pets with owners, PetVerse guarantees no specific outcome. Users agree not to post false "Lost Pet" alerts.
                </p>
                </section>

                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">5. Transactions & Refunds</h2>
                <p>
                    Transactions for products, pets, or services are primarily between the Buyer and the Seller/Provider. PetVerse is not liable for disputes, refunds, or cancellations, though we may intervene as a mediator at our sole discretion.
                </p>
                </section>

                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">6. Animal Welfare Policy</h2>
                <p>
                    We have a zero-tolerance policy for animal cruelty. Any content depicting abuse, neglect, or illegal fighting will be reported to authorities.
                </p>
                </section>

                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">7. Limitation of Liability</h2>
                <p>
                    PetVerse is not liable for any damages, injuries, or losses resulting from the use of our services, including but not limited to pet illness, behavioral issues, or service malpractice.
                </p>
                </section>

            </div>
            </div>
        </div>
        </div>
    );
};

export default TermsAndConditions;