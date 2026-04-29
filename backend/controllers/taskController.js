import Task from '../models/Task.js';
import Project from '../models/Project.js';


const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const isMember = project.members.some((m) => m.toString() === userId.toString());
  const isCreator = project.createdBy.toString() === userId.toString();
  return isMember || isCreator ? project : null;
};


export const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, project, assignedTo } = req.body;

    if (!title || !dueDate || !project || !assignedTo) {
      return res.status(400).json({ message: 'title, dueDate, project, and assignedTo are required' });
    }

    const proj = await checkProjectAccess(project, req.user._id);
    if (!proj) {
      return res.status(403).json({ message: 'Project not found or access denied' });
    }


    const isMember = proj.members.some((m) => m.toString() === assignedTo);
    if (!isMember) {
      return res.status(400).json({ message: 'Assignee must be a project member' });
    }

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      project,
      assignedTo,
      createdBy: req.user._id,
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name');

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};


export const getTasks = async (req, res, next) => {
  try {
    const { project } = req.query;
    let filter = {};

    if (project) {
      const proj = await checkProjectAccess(project, req.user._id);
      if (!proj) {
        return res.status(403).json({ message: 'Project not found or access denied' });
      }
      filter.project = project;
    } else {
 
      if (req.user.role === 'member') {
        filter.assignedTo = req.user._id;
      } else {
      
        const adminProjects = await Project.find({ createdBy: req.user._id }).select('_id');
        filter.project = { $in: adminProjects.map((p) => p._id) };
      }
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};


export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const proj = await checkProjectAccess(task.project._id, req.user._id);
    if (!proj) return res.status(403).json({ message: 'Access denied' });

    res.json(task);
  } catch (error) {
    next(error);
  }
};


export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const proj = await checkProjectAccess(task.project, req.user._id);
    if (!proj) return res.status(403).json({ message: 'Access denied' });

    if (req.user.role === 'member') {
      
      if (task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update your own tasks' });
      }
      if (req.body.status) task.status = req.body.status;
    } else {
      
      const { title, description, status, priority, dueDate, assignedTo } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate) task.dueDate = dueDate;
      if (assignedTo) task.assignedTo = assignedTo;
    }

    const updated = await task.save();
    await updated.populate('assignedTo', 'name email');
    await updated.populate('createdBy', 'name email');
    await updated.populate('project', 'name');

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

 
    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the task creator can delete it' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};


export const getDashboardStats = async (req, res, next) => {
  try {
    let filter = {};
    const now = new Date();

    if (req.user.role === 'member') {
      filter.assignedTo = req.user._id;
    } else {
      const adminProjects = await Project.find({ createdBy: req.user._id }).select('_id');
      filter.project = { $in: adminProjects.map((p) => p._id) };
    }

    const [total, completed, inProgress, overdue] = await Promise.all([
      Task.countDocuments(filter),
      Task.countDocuments({ ...filter, status: 'Done' }),
      Task.countDocuments({ ...filter, status: 'In Progress' }),
      Task.countDocuments({ ...filter, status: { $ne: 'Done' }, dueDate: { $lt: now } }),
    ]);

    const recentTasks = await Task.find(filter)
      .populate('assignedTo', 'name')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      total,
      completed,
      inProgress,
      todo: total - completed - inProgress,
      overdue,
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};
