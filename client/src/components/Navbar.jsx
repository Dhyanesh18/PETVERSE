const Navbar = () => {
    return (
        <header className="header">
            <nav id="navbar" className="navbar">
            <div className="nav-content">
                <div className="logo"><a href="/"><i className="fa fa-paw"></i> PetVerse</a></div>
                <div className="nav-icons">
                <a href="/cart" className="icon-btn cart-icon" id="cartIcon">
                    <i className="fa fa-shopping-cart"></i>
                    <span className="cart-count" id="cartCount" style={{display: "none"}}>0</span>
                </a>
                <a href="/login" className="icon-btn"><i className="fa fa-user"></i></a>
                </div>
                <div className="search">
                <input className="search-bar" type="text" placeholder="Search pets, products or services" />
                <button className="search-btn"><i className="fa fa-search"></i></button>
                </div>
                <button className="hamburger" id="hamburger">
                <i className="fa fa-bars"></i>
                </button>
                <ul className="nav-links">
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/pets">Pets</a></li>
                <li className="dropdown">
                    <a href="#" className="dropdown-toggle">Products <i className="fa fa-angle-down"></i></a>
                    <ul className="dropdown-menu">
                    <li><a href="/products/petfood">Pet Food</a></li>
                    <li><a href="/products/toys">Toys</a></li>
                    <li><a href="/products/accessories">Accessories</a></li>
                    </ul>
                </li>
                <li className="dropdown">
                    <a href="#" className="dropdown-toggle">Services <i className="fa fa-angle-down"></i></a>
                    <ul className="dropdown-menu">
                    <li><a href="/services">Services</a></li>
                    <li><a href="/mate">PetMate</a></li>
                    </ul>
                </li>
                </ul>
            </div>
            </nav>
        </header>
    )
};

export default Navbar;