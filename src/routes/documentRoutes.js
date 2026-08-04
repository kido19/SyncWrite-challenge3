import express from 'express';
import { body } from 'express-validator';
import {
  createDocument,
  getMyDocuments,
  getDocumentById,
  renameDocument,
  deleteDocument,
  duplicateDocument,
  updateContent,
  addCollaborator,
  removeCollaborator,
} from '../controllers/documentController.js';
import {
  getVersions,
  getVersionById,
  restoreVersion,
} from '../controllers/versionController.js';
import {
  getComments,
  addComment,
  resolveComment,
  deleteComment,
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';
import validateRequest from '../middleware/validateRequest.js';

const router = express.Router();

router.use(protect);

router.post('/', createDocument);
router.get('/', getMyDocuments);
router.get('/:id', getDocumentById);
router.patch(
  '/:id/rename',
  [body('title').trim().notEmpty().withMessage('Title cannot be empty')],
  validateRequest,
  renameDocument
);
router.delete('/:id', deleteDocument);
router.post('/:id/duplicate', duplicateDocument);
router.patch('/:id/content', updateContent);
router.post(
  '/:id/share',
  [
    body('email').isEmail().withMessage('Must be a valid email'),
    body('role').isIn(['viewer', 'commenter', 'editor']).withMessage('Invalid role'),
  ],
  validateRequest,
  addCollaborator
);
router.delete('/:id/share/:userId', removeCollaborator);

router.get('/:id/versions', getVersions);
router.get('/:id/versions/:versionId', getVersionById);
router.post('/:id/versions/:versionId/restore', restoreVersion);

router.get('/:id/comments', getComments);
router.post(
  '/:id/comments',
  [body('text').trim().notEmpty().withMessage('Comment cannot be empty')],
  validateRequest,
  addComment
);
router.patch('/:id/comments/:commentId/resolve', resolveComment);
router.delete('/:id/comments/:commentId', deleteComment);

export default router;