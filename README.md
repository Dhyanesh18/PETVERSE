# PETVERSE

**Your one-stop destination for all pet needs**

PETVERSE is a comprehensive pet management platform that connects pet owners, sellers, and service providers. Built with modern web technologies, it offers a seamless experience for managing everything related to your pets.

## Features

### Core Features
- **User Authentication** - Secure registration and login system with role-based access control
- **User Dashboard** - Personalized dashboard for managing pets, orders, and bookings
- **Admin Panel** - Comprehensive admin interface for platform management

### Pet Management
- **Pet Profiles** - Create and manage profiles for your pets
- **Pet Mating Services** - Find suitable mates for your pets
- **Pet Adoption** - Browse and adopt pets from verified sellers

### E-Commerce
- **Product Marketplace** - Browse and purchase pet products
- **Seller Dashboard** - Manage products, inventory, and orders
- **Shopping Cart** - Add items and manage your cart
- **Order Management** - Track orders and order history
- **Payment Integration** - Secure payment processing

### Services
- **Service Booking** - Book grooming, veterinary, and other pet services
- **Service Provider Dashboard** - Manage service offerings and bookings
- **Availability Management** - Set and manage service availability

### Events & Community
- **Pet Events** - Create and join pet-related events
- **Reviews & Ratings** - Rate and review products and services
- **Real-time Chat** - Socket.io powered real-time communication

### Additional Features
- **Advanced Search** - Search for products, services, and pets
- **Wallet System** - Manage payments and transactions
- **Image Management** - Upload and manage pet and product images

## Technical Implementation

### Form Validation using DOM
Comprehensive client-side validation implemented across multiple pages:

#### Pages with Form Validation:
1. **User Registration Pages** (`views/signup.ejs`, `views/signup-owner.ejs`)
   - JavaScript: `public/js/signup.js`
   - Real-time email validation with regex pattern
   - Username validation (minimum 3 characters)
   - Password strength validation (minimum 8 characters)
   - Password confirmation matching
   - Phone number validation (10-digit format)
   - Full name validation (first and last name required)
   - Terms and conditions checkbox validation
   - Dynamic error message display using DOM manipulation

2. **Seller Registration** (`views/signup-seller.ejs`)
   - JavaScript: `public/js/signup-seller.js`
   - Business name validation
   - GST number format validation
   - Business address validation
   - Contact information validation

3. **Service Provider Registration** (`views/signup-service.ejs`)
   - JavaScript: `public/js/signup-service.js`
   - Service type validation
   - Certification document validation
   - License number validation
   - Service area validation

4. **Booking System** (`views/booking.ejs`)
   - JavaScript: `public/js/booking-validation.js`
   - Date picker validation (no past dates, no Sundays)
   - Time slot selection validation
   - Future date limit validation (within 3 months)
   - Real-time validation feedback with visual indicators

5. **Event Creation** (`views/add-event.ejs`)
   - JavaScript: `public/js/add-event.js`
   - Event time validation (end time after start time)
   - Contact phone validation (10-digit format)
   - File upload validation (permission document, max 10MB)
   - Character count validation for description (max 1000 chars)

### Dynamic HTML Implementation
Interactive DOM manipulation for seamless user experience:

#### Pages with Dynamic HTML:
1. **Product Listing** (`views/products.ejs`)
   - JavaScript: `public/js/Products.js`
   - Dynamic product card generation using `createElement` and `appendChild`
   - Real-time filter application with DOM updates
   - Dynamic pagination button creation
   - Shopping cart item rendering with document fragments
   - Dynamic notification system
   - Mobile menu toggle with DOM manipulation
   - Filter panel expansion/collapse

2. **Shopping Cart** (`views/cart.ejs`)
   - JavaScript: `public/js/cart.js`, `public/js/cart-manager.js`
   - Dynamic cart item rendering
   - Real-time quantity updates
   - Dynamic cart count badge updates
   - Empty cart state rendering
   - Dynamic price calculation display

3. **Booking System** (`views/booking.ejs`)
   - JavaScript: `public/js/booking-validation.js`
   - Dynamic time slot dropdown population
   - Loading state indicators
   - Dynamic error/success message display
   - Real-time slot availability updates

4. **Event Management** (`views/add-event.ejs`)
   - JavaScript: `public/js/add-event.js`
   - Dynamic document preview creation
   - Character counter updates
   - File information display (name, size, icon)
   - Dynamic submit button state changes

5. **Admin Dashboard** (`views/admin.ejs`)
   - JavaScript: `public/js/admin.js`
   - Dynamic tab switching without page reload
   - Application card filtering
   - Dynamic visibility toggling
   - Real-time counter updates

### Data Handling with AJAX/Fetch API
Asynchronous operations implemented across multiple pages:

#### Key Implementations:

1. **Product Management** (`views/products.ejs`)
   - JavaScript: `public/js/Products.js`
   - **Product Search**: Real-time search with debounced API calls
   - **Add to Cart**: Async product addition with fetch API
   - **Product Filtering**: Dynamic filtering without page reload
   - **Product Details**: Fetch individual product data asynchronously

2. **Shopping Cart Operations** (`views/cart.ejs`)
   - JavaScript: `public/js/cart.js`
   - **Add to Cart**: `/cart/add` endpoint with POST method
   - **Update Quantity**: `/cart/update` endpoint for quantity changes
   - **Remove Items**: `/cart/remove` endpoint for item deletion
   - **Cart Count**: `/cart/count` endpoint for real-time count updates
   - All operations use async/await with proper error handling

3. **Booking System** (`views/booking.ejs`)
   - JavaScript: `public/js/booking-validation.js`
   - **Check Availability**: `/booking/available/slots` with query parameters
   - **Create Booking**: Form submission with async fetch
   - Real-time slot availability checking
   - Date-based slot filtering

4. **Event Management** (`views/add-event.ejs`)
   - JavaScript: `public/js/add-event.js`
   - **Create Event**: `/events/add` with FormData for file uploads
   - Async event creation with loading states
   - File upload with multipart/form-data

5. **User Registration** (`views/signup.ejs`, etc.)
   - JavaScript: `public/js/signup.js`, etc.
   - **User Registration**: `/signup/owner` endpoint with JSON payload
   - Async form submission with validation
   - Proper error handling and user feedback

6. **Product Buy Page** (`views/Buy.ejs`)
   - JavaScript: `public/js/Buy.js`
   - Product detail fetching
   - Related product loading
   - Async review submission

**Common Features Across All Async Operations:**
- Proper error handling with try-catch blocks
- Loading state indicators during API calls
- User feedback through notifications/alerts
- JSON data exchange with RESTful APIs
- Response validation and error management

## Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose ODM)
- **Session Management:** express-session
- **Authentication:** bcrypt/bcryptjs
- **Real-time Communication:** Socket.io
- **File Uploads:** Multer
- **Validation:** Joi
- **View Engine:** EJS (for server-side rendering)

### Database
- **Primary Database:** MongoDB
- **Additional Storage:** SQLite3

## Project Structure

```
PETVERSE/
├── app.js                  # Main application entry point
├── package.json            # Node.js dependencies
├── .env                    # Environment variables (not in repo)
├── .gitignore             # Git ignore rules
│
├── models/                 # Mongoose data models
│   ├── users.js           # User model
│   ├── pets.js            # Pet model
│   ├── products.js        # Product model
│   ├── Service.js         # Service model
│   ├── Booking.js         # Booking model
│   ├── cart.js            # Cart model
│   ├── order.js           # Order model
│   ├── event.js           # Event model
│   ├── reviews.js         # Review model
│   ├── wallet.js          # Wallet model
│   └── ...                # Other models
│
├── routes/                 # Express route handlers
│   ├── auth-routes.js     # Authentication routes
│   ├── user-routes.js     # User routes
│   ├── admin-routes.js    # Admin routes
│   ├── pet-routes.js      # Pet management routes
│   ├── mate-routes.js     # Pet mating routes
│   ├── product-routes.js  # Product routes
│   ├── seller.js          # Seller routes
│   ├── services-routes.js # Service routes
│   ├── booking.js         # Booking routes
│   ├── cart.js            # Cart routes
│   ├── payment.js         # Payment routes
│   ├── event-routes.js    # Event routes
│   ├── review-routes.js   # Review routes
│   └── ...                # Other routes
│
├── controllers/            # Business logic controllers
├── middleware/             # Custom middleware
├── views/                  # EJS templates
├── public/                 # Static assets (CSS, JS, images)
└── scripts/                # Utility scripts
```

## Setup and Installation Guide

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)

### Step-by-Step Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Dhyanesh18/PETVERSE.git
cd PETVERSE
```

#### 2. Install Dependencies

```bash
npm install
```

This will install all the required packages listed in `package.json` including:
- Express.js
- Mongoose
- bcrypt
- Socket.io
- And other dependencies

#### 3. Set Up MongoDB

**Option A: Local MongoDB Installation**

1. Install MongoDB Community Edition on your system
2. Start the MongoDB service:

   **Windows:**
   ```bash
   net start MongoDB
   ```

   **macOS:**
   ```bash
   brew services start mongodb-community
   ```

   **Linux:**
   ```bash
   sudo systemctl start mongod
   ```

3. Verify MongoDB is running:
   ```bash
   mongo --eval "db.version()"
   ```

**Option B: MongoDB Atlas (Cloud)**

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Whitelist your IP address
5. Create a database user

#### 4. Configure Environment Variables

Create a `.env` file in the root directory of the project:

```bash
# Create .env file
touch .env  # On Linux/macOS
# Or manually create the file on Windows
```

Add the following configuration to your `.env` file:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/petverse
# For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/petverse

# Session Secret (use a random secure string)
SESSION_SECRET=your-super-secret-session-key-change-this

# Server Port
PORT=8080

# Add any other environment-specific variables as needed
```

**Important:** Replace the placeholder values with your actual credentials and never commit the `.env` file to version control.

#### 5. Verify Installation

Check that all dependencies are installed correctly:

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check MongoDB connection (optional)
node -e "require('mongoose').connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse').then(() => console.log('MongoDB connected')).catch(err => console.error(err))"
```

### Running the Application

#### Development Mode (Recommended for Development)

Start the backend server with nodemon for automatic reloading:

```bash
npm run dev
```

The backend server will start on `http://localhost:8080`

#### Production Mode

Start the production server:

```bash
npm start
```

The application will be available at `http://localhost:8080`

#### Accessing the Application

Once the server is running:

1. **Open your browser** and navigate to: `http://localhost:8080`

2. **First-time setup:**
   - Register a new account
   - Complete your profile
   - Start exploring PETVERSE features

### Verification Steps

After starting the application, verify everything is working:

1. **Check Backend**: Visit `http://localhost:8080` - You should see the login page
2. **Check Database**: Look for connection message in terminal: "MongoDB connected"
3. **Test Registration**: Try creating a new user account
4. **Test Login**: Login with your credentials

### Troubleshooting

#### Common Issues and Solutions

**Problem: MongoDB Connection Error**
```
Solution:
- Ensure MongoDB service is running
- Check MONGODB_URI in .env file is correct
- Verify MongoDB is accessible on the specified port
- For MongoDB Atlas, check IP whitelist settings
```

**Problem: Port Already in Use**
```
Solution:
- Change PORT in .env file to a different number (e.g., 3000, 5000)
- Or kill the process using the port:
  Windows: netstat -ano | findstr :8080
  Linux/Mac: lsof -ti:8080 | xargs kill
```

**Problem: Module Not Found Error**
```
Solution:
- Delete node_modules folder and package-lock.json
- Run npm install again
```

### Available Scripts

```bash
npm start       # Start the production server
npm run dev     # Start the development server with nodemon (auto-reload)
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/petverse

# Session
SESSION_SECRET=your-secret-key-here

# Server
PORT=8080

# Add other environment-specific variables as needed
```

## User Roles

The platform supports three main user roles:

1. **Regular Users** - Pet owners who can browse, purchase, and book services
2. **Sellers** - Vendors who can list and sell pet products
3. **Service Providers** - Professionals offering pet-related services
4. **Admins** - Platform administrators with full access

## Security

- Passwords are hashed using bcrypt
- Session management with secure cookies
- Input validation using Joi
- Protected routes with authentication middleware

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For any queries or support, please reach out to the project maintainer.

## Acknowledgments

- Built for pet lovers
- Thanks to all contributors and the open-source community

---

**Made by the PETVERSE Team**
