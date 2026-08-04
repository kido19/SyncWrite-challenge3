import Document from '../models/Document.js';
import Comment from '../models/Comment.js';
import { getUserRole } from '../utils/permissions.js';

export const getComments = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = getUserRole(document, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comments = await Comment.find({ document: req.params.id })
      .sort({ createdAt: 1 })
      .populate('author', 'name email');

    res.status(200).json({ comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text, parentComment } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = getUserRole(document, req.user._id);
    if (role !== 'owner' && role !== 'editor' && role !== 'commenter') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comment = await Comment.create({
      document: req.params.id,
      author: req.user._id,
      text,
      parentComment: parentComment || null,
    });

    await comment.populate('author', 'name email');

    res.status(201).json({ comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const resolveComment = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = getUserRole(document, req.user._id);
    if (role !== 'owner' && role !== 'editor' && role !== 'commenter') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    comment.resolved = !comment.resolved;
    await comment.save();

    res.status(200).json({ comment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await comment.deleteOne();

    res.status(200).json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};