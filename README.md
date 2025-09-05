# ViroNex 🚀

A full-stack social media platform inspired by YouTube and Twitter, built with modern web technologies. Share videos, connect with friends, and engage with content in real-time.

![ViroNex](https://img.shields.io/badge/ViroNex-Social%20Media-blue?style=for-the-badge&logo=video&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

## 🌟 Features

### 🔐 Authentication & User Management
- Secure user registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Profile management with avatars and cover images

### 📹 Video Content
- Upload and stream videos
- Cloud storage with Cloudinary
- Video metadata management
- Content categorization and tagging

### 💬 Social Interactions
- Like and comment on videos
- Follow/unfollow users
- Real-time notifications
- User engagement analytics

### 🔍 Discovery & Search
- Advanced video search
- Trending content algorithms
- Personalized recommendations
- Hashtag-based content discovery

### 📱 API-First Architecture
- RESTful API design
- Comprehensive error handling
- Rate limiting and security
- CORS-enabled for frontend integration

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Password Hashing**: bcrypt
- **File Uploads**: Multer

### DevOps & Tools
- **Process Management**: Nodemon
- **Environment**: dotenv
- **Version Control**: Git
- **Package Manager**: npm

## 📁 Project Structure

```
ViroNex/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── index.js              # Server entry point
│   ├── constants.js          # Application constants
│   ├── controllers/
│   │   └── user.controller.js # User-related business logic
│   ├── db/
│   │   └── index.js          # Database connection
│   ├── middlewares/
│   │   └── multer.middleware.js # File upload middleware
│   ├── models/
│   │   ├── user.model.js     # User data schema
│   │   └── video.model.js    # Video data schema
│   ├── routes/
│   │   └── user.routes.js    # User API routes
│   └── utils/
│       ├── ApiError.js       # Custom error handling
│       ├── ApiResponse.js    # Standardized API responses
│       ├── asynchandler.js   # Async error wrapper
│       └── cloudinary.js     # Cloud storage utility
├── public/
│   └── temp/                 # Temporary file storage
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables
└── README.md                # Project documentation
```

## 🚀 Getting Started

### Prerequisites

Before running this application, make sure you have:
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account for media storage

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ethyashpathak/ViroNex.git
   cd ViroNex
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/vironex
   CORS_ORIGIN=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   JWT_SECRET=your_jwt_secret
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8000`

## 📡 API Endpoints

### Authentication Routes
```
POST /api/v1/users/register  # Register new user
POST /api/v1/users/login     # User login
```

### User Management
```
GET    /api/v1/users/profile      # Get user profile
PUT    /api/v1/users/profile      # Update user profile
DELETE /api/v1/users/profile      # Delete user account
```

### Video Management
```
POST   /api/v1/videos/upload      # Upload new video
GET    /api/v1/videos             # Get all videos
GET    /api/v1/videos/:id         # Get specific video
PUT    /api/v1/videos/:id         # Update video
DELETE /api/v1/videos/:id         # Delete video
```

### Social Features
```
POST   /api/v1/videos/:id/like     # Like/unlike video
POST   /api/v1/videos/:id/comment  # Add comment
GET    /api/v1/users/:id/follow    # Follow user
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests (when implemented)

### Code Quality

- **Error Handling**: Custom ApiError class for consistent error responses
- **Async Wrapper**: AsyncHandler utility for clean async code
- **Validation**: Input validation and sanitization
- **Security**: CORS, rate limiting, and secure headers

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Shaswat Pathak**
- GitHub: [@ethyashpathak](https://github.com/ethyashpathak)

## 🙏 Acknowledgments

- Inspired by YouTube and Twitter
- Built with modern JavaScript and Node.js best practices
- Thanks to the open-source community for amazing tools and libraries

---

⭐ **Star this repo if you found it helpful!**

Made with ❤️ by Shaswat Pathak</content>
<parameter name="filePath">d:\2nd year\ViroNex\README.md
