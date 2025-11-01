// components/Layout.js

import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
    const location = useLocation();
    
    const authRoutes = ['/login', '/signup'];
    const hideNavAndFooter = authRoutes.includes(location.pathname);

    return (
        <div className="flex flex-col min-h-screen">

            {!hideNavAndFooter && <Navbar />}

            <main className={`grow ${!hideNavAndFooter ? '' : ''}`}>
                {children}
            </main>
            {!hideNavAndFooter && <Footer />}
        </div>
    );
};

export default Layout;