// components/Layout.js

import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
    const location = useLocation();
    
    // Hide navbar on login and all signup pages
    const hideNavbar = location.pathname === '/login' || 
                       location.pathname.startsWith('/signup');

    return (
        <div className="min-h-screen flex flex-col">
            {!hideNavbar && <Navbar />}
            <main className="flex-grow">
                {children}
            </main>
            {!hideNavbar && <Footer />}
        </div>
    );
};

export default Layout;