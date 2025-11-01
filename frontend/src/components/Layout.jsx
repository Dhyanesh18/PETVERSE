import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children, user }) => {
    const location = useLocation();
    
    // Routes where navbar and footer should be hidden
    const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
    const hideNavAndFooter = authRoutes.includes(location.pathname);

    return (
        <div className="flex flex-col min-h-screen">
            {!hideNavAndFooter && <Navbar user={user} />}
            <main className={`grow ${!hideNavAndFooter ? '' : ''}`}>
                {children}
            </main>
            {!hideNavAndFooter && <Footer />}
        </div>
    );
};

export default Layout;