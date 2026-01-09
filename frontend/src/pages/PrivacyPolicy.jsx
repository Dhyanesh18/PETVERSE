import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="pt-30 pb-12 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow-lg rounded-xl p-8 md:p-12">
            
            <h1 className="text-3xl md:text-4xl font-bold text-teal-700 mb-2 text-center">
                Privacy Policy
            </h1>
            <p className="text-gray-500 text-center mb-8">Last Updated: January 2026</p>

            <div className="space-y-6 text-gray-700 leading-relaxed text-left">
                
                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">1. Information We Collect</h2>
                <p className="mb-2">To provide our services, we collect the following types of information:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Personal Identity:</strong> Name, Email, Phone Number (for account creation).</li>
                    <li><strong>Pet Data:</strong> Breed, Age, Medical History, Photos (for listings and mating profiles).</li>
                    <li><strong>Location Data:</strong> Your precise location is used for the "Lost Pet" radius feature and to find nearby Vets/Services.</li>
                    <li><strong>Payment Info:</strong> Transaction details when buying products or booking services.</li>
                </ul>
                </section>

                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">2. How We Use Your Data</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>To connect Pet Owners with Sellers and Service Providers.</li>
                    <li>To display "Nearby" posts for lost pets based on geolocation.</li>
                    <li>To verify the legitimacy of Service Providers (Vets/Breeders).</li>
                    <li>To process transactions and bookings.</li>
                </ul>
                </section>

                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">3. Location Services</h2>
                <p>
                    The "Lost Pet" feature relies on location tracking. By using this feature, you consent to sharing your approximate location with other users in the vicinity to facilitate the recovery of lost animals. You can disable this in your device settings, but the feature may not work as intended.
                </p>
                </section>

                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">4. Data Sharing</h2>
                <p>
                    We do not sell your personal data. However, your contact information may be shared with:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>A Service Provider when you book an appointment.</li>
                    <li>A Seller when you purchase a pet or product.</li>
                    <li>Other users if you explicitly opt-in to the "Find a Mate" contact feature.</li>
                </ul>
                </section>

                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">5. Security</h2>
                <p>
                    We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
                </p>
                </section>

                <section>
                <h2 className="text-xl font-bold text-gray-900 mb-2">6. Contact Us</h2>
                <p>
                    If you have questions about this policy or wish to delete your data, please contact our support team at <a href="mailto:support@petverse.com" className="text-teal-600 hover:underline">support@petverse.com</a>.
                </p>
                </section>

            </div>
            </div>
        </div>
        </div>
    );
};

export default PrivacyPolicy;