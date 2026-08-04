import jwt from 'jsonwebtoken';
import Document from '../models/Document.js';

const documentPresence = new Map();

const getOnlineUsers = (documentId) => {
  const users = documentPresence.get(documentId);
  if (!users) return [];
  return Array.from(users.values());
};

const getUserRole = (document, userId) => {
  if (document.owner.toString() === userId.toString()) return 'owner';
  const collaborator = document.collaborators.find(
    (c) => c.user.toString() === userId.toString()
  );
  return collaborator ? collaborator.role : null;
};

const registerPresenceHandlers = (io) => {
  io.on('connection', (socket) => {
    socket.on('join-document', async ({ documentId, token, name }) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const document = await Document.findById(documentId);

        if (!document) return;

        const role = getUserRole(document, decoded.id);
        if (!role) return;

        socket.join(`presence-${documentId}`);

        socket.data.documentId = documentId;
        socket.data.userId = decoded.id;
        socket.data.userName = name;

        if (!documentPresence.has(documentId)) {
          documentPresence.set(documentId, new Map());
        }
        documentPresence.get(documentId).set(socket.id, {
          userId: decoded.id,
          name,
        });

        io.to(`presence-${documentId}`).emit('presence-update', getOnlineUsers(documentId));
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('disconnect', () => {
      const { documentId } = socket.data;
      if (!documentId) return;

      const users = documentPresence.get(documentId);
      if (users) {
        users.delete(socket.id);
        if (users.size === 0) {
          documentPresence.delete(documentId);
        } else {
          io.to(`presence-${documentId}`).emit('presence-update', getOnlineUsers(documentId));
        }
      }
    });
  });
};

export default registerPresenceHandlers;
