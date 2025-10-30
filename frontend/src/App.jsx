import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Homepage from './pages/Homepage';
import Pets from './pages/Pets';
import api from './utils/api';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Fetch user session
        const fetchUser = async () => {
            try {
                const response = await api.get('/auth/session');
                if (response.data.success) {
                    setUser(response.data.data.user);
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        fetchUser();
    }, []);

    return (
        <Router>
            <Layout user={user}>
                <Routes>
                    <Route path="/" element={<Homepage />} />
                    <Route path="/home" element={<Homepage />} />
                    <Route path="/pets" element={<Pets />} />
                    {/* Add more routes */}
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
