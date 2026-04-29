import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getProjectById, getTasks, updateProjectMembers, getAllUsers, deleteProject
} from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        getProjectById(id),
        getTasks(id),
      ]);
      setProject(projRes.data);
      setTasks(taskRes.data);
      setSelectedMembers(projRes.data.members.map((m) => m._id));
      if (user?.role === 'admin') {
        const usersRes = await getAllUsers();
        setAllUsers(usersRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMembers = async () => {
    setSaving(true);
    try {
      const res = await updateProjectMembers(id, { memberIds: selectedMembers });
      setProject(res.data);
      setShowMemberModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update members');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      await deleteProject(id);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const tasksByStatus = {
    'Todo': tasks.filter((t) => t.status === 'Todo'),
    'In Progress': tasks.filter((t) => t.status === 'In Progress'),
    'Done': tasks.filter((t) => t.status === 'Done'),
  };

  const statusColors = { 'Todo': 'secondary', 'In Progress': 'warning', 'Done': 'success' };

  if (loading) return <Layout><div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div></Layout>;
  if (error) return <Layout><div className="alert alert-danger">{error}</div></Layout>;

  return (
    <Layout>
      {/* Header */}
      <div className="d-flex align-items-start mb-4 flex-wrap gap-2">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb small mb-1">
              <li className="breadcrumb-item"><Link to="/projects">Projects</Link></li>
              <li className="breadcrumb-item active">{project.name}</li>
            </ol>
          </nav>
          <h4 className="fw-bold mb-0">
            <i className="bi bi-folder-fill text-primary me-2"></i>{project.name}
          </h4>
          {project.description && (
            <p className="text-muted small mb-0">{project.description}</p>
          )}
        </div>
        <div className="ms-auto d-flex gap-2">
          {user?.role === 'admin' && project.createdBy?._id === user._id && (
            <>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowMemberModal(true)}>
                <i className="bi bi-people me-1"></i>Manage Members
              </button>
              <Link to={`/tasks/new?project=${id}`} className="btn btn-primary btn-sm">
                <i className="bi bi-plus-lg me-1"></i>Add Task
              </Link>
              <button className="btn btn-outline-danger btn-sm" onClick={handleDeleteProject}>
                <i className="bi bi-trash"></i>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-2 px-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small fw-semibold me-2">
              <i className="bi bi-people me-1"></i>Team ({project.members.length}):
            </span>
            {project.members.map((m) => (
              <span key={m._id} className="badge bg-light text-dark border">
                <i className="bi bi-person-circle me-1"></i>{m.name}
                <span className={`ms-1 badge ${m.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'} small`}>
                  {m.role}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="row g-3">
        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
          <div key={status} className="col-xl-4 col-md-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom">
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fw-semibold">
                    <span className={`badge bg-${statusColors[status]} me-2`}>{statusTasks.length}</span>
                    {status}
                  </span>
                </div>
              </div>
              <div className="card-body p-2" style={{ minHeight: 200 }}>
                {statusTasks.length === 0 ? (
                  <p className="text-muted text-center small py-4">No tasks</p>
                ) : (
                  statusTasks.map((task) => (
                    <TaskCard key={task._id} task={task} onUpdate={fetchData} />
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Member Modal */}
      {showMemberModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold"><i className="bi bi-people me-2"></i>Manage Members</h5>
                <button className="btn-close" onClick={() => setShowMemberModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="border rounded p-2" style={{ maxHeight: 250, overflowY: 'auto' }}>
                  {allUsers.filter((u) => u._id !== user._id).map((u) => (
                    <div key={u._id} className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`mem-${u._id}`}
                        checked={selectedMembers.includes(u._id)}
                        onChange={() =>
                          setSelectedMembers((prev) =>
                            prev.includes(u._id)
                              ? prev.filter((id) => id !== u._id)
                              : [...prev, u._id]
                          )
                        }
                      />
                      <label className="form-check-label small" htmlFor={`mem-${u._id}`}>
                        {u.name} — <span className="text-muted">{u.email}</span>
                        <span className={`ms-1 badge ${u.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                          {u.role}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveMembers} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProjectDetail;
