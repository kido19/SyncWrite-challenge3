# SyncWrite API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true/false,
  "message": "Response message",
  "data": { ... }  // Only on success
}
```

## Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Endpoints

### Register User
`POST /auth/register`

**Request Body:**
```json
{
  "name": "kid kinfe",
  "email": "kid@example.com", 
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "kid kinfe",
    "email": "kid@example.com"
  }
}
```

### Login User
`POST /auth/login`

**Request Body:**
```json
{
  "email": "kid@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id", 
    "name": "kid kinfe",
    "email": "kid@example.com"
  }
}
```

### Get Current User
`GET /auth/me` 

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "kid kinfe", 
    "email": "kid@example.com"
  }
}
```

---

## Document Endpoints

### Get User's Documents
`GET /documents` 

**Response:**
```json
{
  "owned": [...documents],
  "shared": [...documents],
  "recent": [...documents]
}
```

**Document Object:**
```json
{
  "_id": "doc_id",
  "title": "Document Title",
  "content": "<p>HTML content</p>",
  "owner": {
    "_id": "user_id",
    "name": "Owner Name",
    "email": "owner@example.com"
  },
  "collaborators": [
    {
      "user": {
        "_id": "user_id",
        "name": "Collaborator Name", 
        "email": "collaborator@example.com"
      },
      "role": "editor"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "lastOpenedAt": "2024-01-01T00:00:00.000Z"
}
```

### Create Document
`POST /documents` 

**Request Body:**
```json
{
  "title": "New Document"  // Optional
}
```

**Response:**
```json
{
  "document": {
    "_id": "doc_id",
    "title": "New Document",
    "content": "",
    "owner": "user_id",
    "collaborators": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Document by ID
`GET /documents/:id` 🔒

**Response:**
```json
{
  "document": { ...document_object },
  "role": "owner|editor|commenter|viewer"
}
```

### Rename Document
`PATCH /documents/:id/rename` 🔒

**Permission:** Owner or Editor

**Request Body:**
```json
{
  "title": "Updated Title"
}
```

**Response:**
```json
{
  "document": { ...updated_document }
}
```

### Delete Document
`DELETE /documents/:id` 🔒

**Permission:** Owner only

**Response:**
```json
{
  "message": "Document deleted"
}
```

### Duplicate Document
`POST /documents/:id/duplicate` 🔒

**Permission:** Any user with access

**Response:**
```json
{
  "document": { ...duplicated_document }
}
```

### Update Document Content
`PATCH /documents/:id/content` 🔒

**Permission:** Owner or Editor

**Request Body:**
```json
{
  "content": "<p>Updated HTML content</p>"
}
```

**Response:**
```json
{
  "message": "Saved"
}
```

---

## Sharing Endpoints

### Add Collaborator
`POST /documents/:id/share` 🔒

**Permission:** Owner only

**Request Body:**
```json
{
  "email": "collaborator@example.com",
  "role": "viewer|commenter|editor"
}
```

**Response:**
```json
{
  "collaborators": [
    {
      "user": {
        "_id": "user_id",
        "name": "Collaborator Name",
        "email": "collaborator@example.com"
      },
      "role": "editor"
    }
  ]
}
```

### Remove Collaborator
`DELETE /documents/:id/share/:userId` 🔒

**Permission:** Owner only

**Response:**
```json
{
  "collaborators": [...remaining_collaborators]
}
```

---

## Version History Endpoints

### Get Document Versions
`GET /documents/:id/versions` 🔒

**Permission:** Any user with access

**Response:**
```json
{
  "versions": [
    {
      "_id": "version_id",
      "createdBy": {
        "_id": "user_id",
        "name": "User Name",
        "email": "user@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Version by ID
`GET /documents/:id/versions/:versionId` 🔒

**Permission:** Any user with access

**Response:**
```json
{
  "version": {
    "_id": "version_id",
    "content": "<p>Version content</p>",
    "createdBy": {
      "_id": "user_id", 
      "name": "User Name",
      "email": "user@example.com"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Restore Version
`POST /documents/:id/versions/:versionId/restore` 🔒

**Permission:** Owner or Editor

**Response:**
```json
{
  "content": "<p>Restored content</p>"
}
```

---

## Comments Endpoints

### Get Document Comments
`GET /documents/:id/comments` 🔒

**Permission:** Any user with access

**Response:**
```json
{
  "comments": [
    {
      "_id": "comment_id",
      "text": "This is a comment",
      "author": {
        "_id": "user_id",
        "name": "Author Name", 
        "email": "author@example.com"
      },
      "parentComment": null,
      "resolved": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Add Comment
`POST /documents/:id/comments` 🔒

**Permission:** Owner, Editor, or Commenter

**Request Body:**
```json
{
  "text": "This is my comment",
  "parentComment": "parent_comment_id"  // Optional for replies
}
```

**Response:**
```json
{
  "comment": {
    "_id": "comment_id",
    "text": "This is my comment",
    "author": {
      "_id": "user_id",
      "name": "Author Name",
      "email": "author@example.com"
    },
    "parentComment": null,
    "resolved": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Resolve/Unresolve Comment
`PATCH /documents/:id/comments/:commentId/resolve` 🔒

**Permission:** Owner, Editor, or Commenter

**Response:**
```json
{
  "comment": { ...updated_comment }
}
```

### Delete Comment
`DELETE /documents/:id/comments/:commentId` 🔒

**Permission:** Comment author only

**Response:**
```json
{
  "message": "Comment deleted"
}
```

---

## WebSocket Events

### Connection
Connect to: `ws://localhost:5000`

**Authentication:**
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'jwt_token_here' }
});
```

### Document Collaboration Events

#### Join Document
```javascript
socket.emit('join-document', {
  documentId: 'doc_id',
  token: 'jwt_token',
  name: 'User Name'
});
```

#### Presence Updates
```javascript
socket.on('presence-update', (users) => {
  // Array of online users
  console.log(users);
});
```

#### Real-time Content Sync
Handled automatically by Y.js and y-socket.io provider.

---

## Permission Levels

### Owner
- Full access to document
- Can rename and delete document
- Can manage collaborators
- Can edit content
- Can add/resolve comments
- Can view version history and restore versions

### Editor
- Can edit document content
- Can rename document
- Can add/resolve comments  
- Can view version history and restore versions
- Cannot delete document or manage collaborators

### Commenter
- Can view document (read-only)
- Can add/resolve comments
- Can view version history
- Cannot edit content or manage collaborators

### Viewer
- Can view document (read-only)
- Can view version history
- Cannot edit, comment, or manage collaborators

---

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- Document operations: 100 requests per minute  
- Real-time events: No explicit limits (handled by Socket.IO)

## Error Examples

### Validation Error (400)
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "message": "Invalid email or password"
}
```

### Authorization Error (403)
```json
{
  "message": "Access denied"
}
```

### Not Found Error (404)
```json
{
  "message": "Document not found"
}
```

### Server Error (500)
```json
{
  "message": "Server error",
  "error": "Error details"
}
```
