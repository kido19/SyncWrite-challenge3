import Document from '../models/Document.js';
import Version from '../models/Version.js';
import { getUserRole } from '../utils/permissions.js';

export const getVersions = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = getUserRole(document, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const versions = await Version.find({ document: req.params.id })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .select('createdBy createdAt');

    res.status(200).json({ versions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getVersionById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = getUserRole(document, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const version = await Version.findById(req.params.versionId).populate('createdBy', 'name email');
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    res.status(200).json({ version });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const restoreVersion = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = getUserRole(document, req.user._id);
    if (role !== 'owner' && role !== 'editor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const version = await Version.findById(req.params.versionId);
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    document.content = version.content;
    await document.save();

    res.status(200).json({ content: version.content });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};