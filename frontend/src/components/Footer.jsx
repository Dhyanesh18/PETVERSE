const Footer = () => {
    return (
        <footer id="footer">
            <div className="footer-container">
            <div className="footer-logo">
                <h2>PetVerse</h2>
                <p>Your one-stop destination for all pet needs</p>
            </div>
            <div className="footer-links">
                <h3>Quick Links</h3>
                <ul>
                <li><a href="/">About Us</a></li>
                <li><a href="/products">Shop</a></li>
                <li><a href="/services">Services</a></li>
                <li><a href="/contact">Contact Us</a></li>
                </ul>
            </div>
            <div className="footer-social">
                <h3>Follow Us</h3>
                <a href="https://facebook.com" target="_blank" className="social-icon">Facebook</a>
                <a href="https://instagram.com" target="_blank" className="social-icon">Instagram</a>
                <a href="https://twitter.com" target="_blank" className="social-icon">Twitter</a>
            </div>
            </div>
            <div className="footer-bottom">
            <p>&copy; 2025 PetVerse. All Rights Reserved</p>
            </div>
        </footer>
    );
};

export default Footer;