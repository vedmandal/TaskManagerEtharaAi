import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateMembers,
  deleteProject,
} from '../controllers/projectController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, adminOnly, createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProjectById);
router.put('/:id/members', protect, adminOnly, updateMembers);
router.delete('/:id', protect, adminOnly, deleteProject);

export default router;
