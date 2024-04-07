# Hostel Hub Backend

Hostel Hub Backend is the backend server for an online buying and selling website dedicated to students residing in hostels. It provides RESTful APIs to manage user authentication, product listings and Chat.

## Features

- User authentication with JWT (JSON Web Tokens)
- Secure password hashing with bcryptjs
- Image upload to Cloudinary for product listings
- Cross-origin resource sharing (CORS) support
- Middleware for parsing cookies
- Environment variable management with dotenv

## Tech Stack

- Node.js
- MongoDB
- ExpressJS

## Dependencies

- bcryptjs: ^2.4.3
- cloudinary: ^2.0.3
- cookie-parser: ^1.4.6
- cors: ^2.8.5
- dotenv: ^16.4.5
- express: ^4.18.3
- jsonwebtoken: ^9.0.2
- mongoose: ^8.2.0
- multer: ^1.4.5-lts.1
- zod: ^3.22.4

## Installation

1. Clone this repository:

    ```bash
    git clone https://github.com/rishitgupta2003/hostelhub-Backend.git
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables:

    Create a `.env` file in the root directory and specify the following variables:

    ```plaintext
    PORT
    DATABASE_URI
    CORS_ORIGIN
    SALT_ROUNDS
    ACCESS_TOKEN_SECRET
    REFRESH_TOKEN_SECRET
    ACCESS_TOKEN_EXPIRY
    REFRES_TOKEN_EXPIRY
    CLOUDINARY_CLOUD_NAME
    CLOUDINARY_API_KEY
    CLOUDINARY_API_SECRET
    DEFAULT_AVATAR_USER_SCHEMA
    REGISTER_TOKEN_PASS
    REGISTER_TOKEN_EXPIRY
    ```

4. Start the server:

    ```bash
    npm run test
    ```

## Usage

Once the server is running, you can access the API endpoints through `http://localhost:8000`.

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

## Contact

For any inquiries or support, please contact [Rishit Gupta](https://github.com/rishitgupta2003).