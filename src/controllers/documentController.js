import Document from '../models/Document.js';
import User from '../models/User.js';
import Version from '../models/Version.js';

const getUserRole = (document, userId) => {
  if (document.owner.toString() === userId.toString()) return 'owner';

  const collaborator = document.collaborators.find(
    (c) => c.user.toString() === userId.toString()
  );
  return collaborator ? collaborator.role : null;
};

export const createDocument = async (req, res) => {
  try {
    const { title } = req.body;

    const document = await Document.create({
      title: title || 'Untitled Document',
      owner: req.user._id,
      content: '',
    });

    res.status(201).json({ document });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMyDocuments = async (req, res) => {
  try {
    const userId = req.user._id;

    const [owned, shared, recent] = await Promise.all([
  Document.find({ owner: userId })
    .sort({ updatedAt: -1 })
    .select('title owner content createdAt updatedAt collaborators')
    .populate('collaborators.user', 'name email')
    .lean(),

  Document.find({ 'collaborators.user': userId })
    .sort({ updatedAt: -1 })
    .populate('owner', 'name email')
    .select('title owner content createdAt updatedAt collaborators')
    .lean(),

  Document.find({
    $or: [{ owner: userId }, { 'collaborators.user': userId }],
  })
    .sort({ lastOpenedAt: -1 })
    .limit(5)
    .select('title owner content updatedAt lastOpenedAt')
    .lean(),
]);

    res.status(200).json({ owned, shared, recent });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = getUserRole(document, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Access denied' });
    }
await document.populate([
  { path: 'owner', select: 'name email' },
  { path: 'collaborators.user', select: 'name email' },
]);

document.lastOpenedAt = new Date();
document.save().catch((err) => console.error('Failed to update lastOpenedAt', err));

    res.status(200).json({ document, role });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const renameDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = getUserRole(document, req.user._id);
    if (role !== 'owner' && role !== 'editor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    document.title = req.body.title;
    await document.save();

    res.status(200).json({ document });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can delete this document' });
    }

    await document.deleteOne();

    res.status(200).json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateContent = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = getUserRole(document, req.user._id);
    if (role !== 'owner' && role !== 'editor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (document.content !== req.body.content) {
  await Version.create({
    document: document._id,
    content: req.body.content,
    createdBy: req.user._id,
  });
}

    document.content = req.body.content;
    await document.save();

    res.status(200).json({ message: 'Saved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addCollaborator = async (req, res) => {
  try {
    const { email, role } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can manage sharing' });
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    if (userToAdd._id.toString() === document.owner.toString()) {
      return res.status(400).json({ message: 'This user already owns the document' });
    }

    const existing = document.collaborators.find(
      (c) => c.user.toString() === userToAdd._id.toString()
    );

    if (existing) {
      existing.role = role;
    } else {
      document.collaborators.push({ user: userToAdd._id, role });
    }

    await document.save();
    await document.populate('collaborators.user', 'name email');

    res.status(200).json({ collaborators: document.collaborators });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const removeCollaborator = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the owner can manage sharing' });
    }

    document.collaborators = document.collaborators.filter(
      (c) => c.user.toString() !== req.params.userId
    );

    await document.save();
    await document.populate('collaborators.user', 'name email');

    res.status(200).json({ collaborators: document.collaborators });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const duplicateDocument = async (req, res) => {
  try {
    const original = await Document.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = getUserRole(original, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const copy = await Document.create({
      title: `${original.title} (Copy)`,
      owner: req.user._id,
      content: original.content,
    });

    res.status(201).json({ document: copy });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};