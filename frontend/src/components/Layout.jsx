import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children, user }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar user={user} />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;