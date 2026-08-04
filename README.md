# SyncWrite - Real-Time Collaborative Document Editor

A real-time collaborative document editor built with React, Node.js, Socket.IO, and Y.js. Similar to Google Docs, it allows multiple users to edit documents simultaneously with real-time synchronization.

## 🚀 Features

### Core Functionality
- **Real-time Collaboration**: Multiple users can edit the same document simultaneously
- **Rich Text Editing**: Support for headings, bold, italic, underline, lists, text alignment, and hyperlinks
- **Live Presence Awareness**: See who's currently viewing/editing the document
- **Auto-save**: Automatic document saving with visual status indicator
- **User Authentication**: Secure registration and login system

### Document Management
- **Create Documents**: Start new collaborative documents
- **Rename Documents**: Click-to-edit document titles
- **Delete Documents**: Remove documents you own
- **Duplicate Documents**: Copy existing documents
- **Document Dashboard**: View owned, shared, and recently opened documents

### Collaboration Features
- **Document Sharing**: Share documents with specific permission levels
- **Permission Levels**: Owner, Editor, Commenter, and Viewer roles
- **Version History**: View and restore previous document versions
- **Comments System**: Add, reply to, and resolve comments
- **Real-time Synchronization**: Changes appear instantly across all connected users

### Additional Features
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works on desktop and mobile devices


## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **Y.js** for conflict-free collaborative editing
- **JWT** for authentication
- **bcrypt** for password hashing

### Frontend
- **React** with hooks and context
- **TipTap** rich text editor
- **Y.js** for collaborative editing
- **Socket.IO Client** for real-time updates
- **React Router** for navigation
- **Axios** for API calls

## 📋 Prerequisites

- Node.js
- MongoDB Atlas account or local MongoDB installation
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/kido19/SyncWrite-challenge3
cd challenge3
```

### 2. Backend Setup
```bash
# To install backend dependencies
npm install

# Create environment file
cp .env.example .env
```

### 3. Configure Environment Variables
Edit `.env` file with your MongoDB connection string:

```env
MONGO_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/syncwrite?retryWrites=true&w=majority
JWT_SECRET=your-jwt-secret-key
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 4. Frontend Setup
```bash
# Navigate to client directory
cd client

# Install frontend dependencies
npm install
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
# From project root
npm run dev
```

**Terminal 2 - Frontend:**
```bash
# From client directory
cd client
npm run dev
```

### 6. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🗄 Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

### Document Collection
```javascript
{
  _id: ObjectId,
  title: String,
  content: String (HTML),
  owner: ObjectId (ref: User),
  collaborators: [{
    user: ObjectId (ref: User),
    role: String (viewer|commenter|editor)
  }],
  lastOpenedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Version Collection
```javascript
{
  _id: ObjectId,
  document: ObjectId (ref: Document),
  content: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Comment Collection
```javascript
{
  _id: ObjectId,
  document: ObjectId (ref: Document),
  author: ObjectId (ref: User),
  text: String,
  parentComment: ObjectId (ref: Comment),
  resolved: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Document Endpoints
- `GET /api/documents` - Get user's documents
- `POST /api/documents` - Create new document
- `GET /api/documents/:id` - Get specific document
- `PATCH /api/documents/:id/rename` - Rename document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/duplicate` - Duplicate document
- `PATCH /api/documents/:id/content` - Update document content

### Sharing Endpoints
- `POST /api/documents/:id/share` - Add collaborator
- `DELETE /api/documents/:id/share/:userId` - Remove collaborator

### Version History Endpoints
- `GET /api/documents/:id/versions` - Get document versions
- `GET /api/documents/:id/versions/:versionId` - Get specific version
- `POST /api/documents/:id/versions/:versionId/restore` - Restore version

### Comments Endpoints
- `GET /api/documents/:id/comments` - Get document comments
- `POST /api/documents/:id/comments` - Add comment
- `PATCH /api/documents/:id/comments/:commentId/resolve` - Toggle comment resolution
- `DELETE /api/documents/:id/comments/:commentId` - Delete comment

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Input validation and sanitization
- CORS configuration
- Authorization checks for document access

## 🎯 Usage Guide

### When it Started
1. **Register/Login**: Create an account or sign in
2. **Create Document**: Click "New Document" on dashboard
3. **Edit Document**: Use the rich text editor with formatting toolbar
4. **Share Document**: Click "Share" to invite collaborators
5. **Collaborate**: Multiple users can edit simultaneously

### Collaboration Features
- **Real-time Editing**: Changes appear instantly for all users
- **Presence Indicators**: See who's currently online
- **Comments**: Add comments and replies, mark as resolved
- **Version History**: View and restore previous versions
- **Permissions**: Control who can view, comment, or edit

### Keyboard Shortcuts
- `Ctrl+B` - Bold text
- `Ctrl+I` - Italic text
- `Ctrl+U` - Underline text
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo

## 🔧 Development

### Project Structure
```
challenge3/
├── src/                    # Backend source code
│   ├── config/            # Database configuration
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── sockets/          # Socket.IO handlers
│   └── utils/            # Utility functions
├── client/               # Frontend React application
│   ├── src/
│   │   ├── api/          # API configuration
│   │   ├── components/   # React components
│   │   ├── context/      # React context providers
│   │   └── pages/        # Page components
└── README.md
```


### Common Issues

**MongoDB Connection Failed:**
- Check MongoDB Atlas IP whitelist
- Verify connection string credentials
- Ensure network connectivity

**Port Already in Use:**
- Kill processes using ports 5000 or 5173
- Use different ports in environment variables

**Real-time Features Not Working:**
- Check Socket.IO connection
- Verify backend server is running
- Check browser console for errors


## Name: Kidist Kinfe
## Id:CTC-015-26
