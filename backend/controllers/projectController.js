import mongoose from 'mongoose';
import Project from '../models/Project.js';
import User from '../models/User.js';


export const createProject = async (req, res, next) => {
  try {
    const { name, description, members } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

 
    let validMembers = [];
    if (members && members.length > 0) {
      const users = await User.find({ _id: { $in: members } });
      validMembers = users.map((u) => u._id);
    }

   
    if (!validMembers.includes(req.user._id.toString())) {
      validMembers.push(req.user._id);
    }

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: validMembers,
    });

    await project.populate('members', 'name email role');
    await project.populate('createdBy', 'name email');

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};


export const getProjects = async (req, res, next) => {
  try {
    let projects;

    if (req.user.role === 'admin') {
    
      projects = await Project.find({ createdBy: req.user._id })
        .populate('members', 'name email role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    } else {
    
      projects = await Project.find({ members: req.user._id })
        .populate('members', 'name email role')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }

    res.json(projects);
  } catch (error) {
    next(error);
  }
};


export const getProjectById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }

    const project = await Project.findById(req.params.id)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }


    const isMember = project.members.some(
      (m) => m._id.toString() === req.user._id.toString()
    );
    const isCreator = project.createdBy._id.toString() === req.user._id.toString();

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const updateMembers = async (req, res, next) => {
  try {
    const { memberIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project creator can manage members' });
    }

    const users = await User.find({ _id: { $in: memberIds } });
    const validIds = users.map((u) => u._id);

    // Always keep creator
    if (!validIds.includes(req.user._id.toString())) {
      validIds.push(req.user._id);
    }

    project.members = validIds;
    await project.save();
    await project.populate('members', 'name email role');
    await project.populate('createdBy', 'name email');

    res.json(project);
  } catch (error) {
    next(error);
  }
};


export const deleteProject = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid project id' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project creator can delete it' });
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};
