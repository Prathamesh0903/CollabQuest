# Firebase Integration Setup

This project has been updated to use Firebase Authentication for user management. Here's how to set it up:

## Client-Side Setup

### 1. Firebase Configuration
The Firebase configuration is already set up in `client/src/firebase.js` with the following project details:
- Project ID: `signpdf-f4ff2`
- Auth Domain: `signpdf-f4ff2.firebaseapp.com`

### 2. Dependencies
Firebase has been added to the client dependencies. Run:
```bash
cd client
npm install
```

### 3. Authentication Flow
- Users sign in with Google OAuth
- Authentication state is managed through React Context
- Socket connections are authenticated with Firebase tokens

## Server-Side Setup

### 1. Firebase Admin SDK
The server uses Firebase Admin SDK for token verification. The configuration is in `server/config/firebase.js` and uses the `firebase-adminsdk.json` file.

### 2. Authentication Middleware
- Express routes are protected with Firebase token verification
- Socket connections require valid Firebase tokens
- User data is synced between Firebase and MongoDB

### 3. Dependencies
Firebase Admin SDK is already included in server dependencies.

## Features Added

### Client-Side
- **Login Component**: Google OAuth sign-in
- **AuthContext**: Manages authentication state
- **UserProfile Component**: Shows user info and logout
- **Protected Routes**: App requires authentication

### Server-Side
- **Firebase Token Verification**: All API routes protected
- **Socket Authentication**: Real-time connections authenticated
- **User Sync**: Firebase users synced to MongoDB
- **Route Protection**: All routes require valid tokens

## Usage

1. Start the server:
```bash
cd server
npm install
npm start
```

2. Start the client:
```bash
cd client
npm install
npm start
```

3. Users will be prompted to sign in with Google before accessing the collaborative editor.

## Security Features

- All API endpoints require Firebase authentication
- Socket connections are authenticated
- User data is validated on both client and server
- JWT tokens are used for additional session management

## Environment Variables

The server uses the following environment variables (see `server/env.example`):
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token signing
- `CLIENT_URL`: Frontend URL for CORS
- `NODE_ENV`: Environment (development/production)

The client uses the Firebase configuration from `client/src/firebase.js`. 