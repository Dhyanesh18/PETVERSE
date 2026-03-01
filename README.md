# PETVERSE USAGE INSTRUCTIONS

### 1. Install frontend node modules and start the react server
```
cd frontend
npm install
npm run dev
```

### 2. Create the .env file in the backend folder
```
//.env

MONGODB_URI=<your_mongodb_uri>
SESSION_SECRET=<jwt_session_secret>
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
PORT=8080

// node mailer
EMAIL_USER=<email_for_two_factor_auth>
EMAIL_PASSWORD=<password_for_the_above_email_account>

```

### 3. Install backend node modules and start the backend server
```
cd backend
npm install
npm run dev
```

### 4. Open frontend in the browser

open http://localhost:3000 in the browser 

### 5. Use the seed scripts to create the admin, wallets and Create the users and sellers and service providers manually through the app UI