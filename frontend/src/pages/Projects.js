import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProjects, createProject, deleteProject, getAllUsers } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', members: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'admin') fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await getProjects();
      setProjects(data);
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await getAllUsers();
      setUsers(data);
    } catch {}
  };

  const handleMemberToggle = (userId) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter((id) => id !== userId)
        : [...prev.members, userId],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setFormError('Project name is required');
    setFormError('');
    setSubmitting(true);
    try {
      await createProject(form);
      setShowModal(false);
      setForm({ name: '', description: '', members: [] });
      fetchProjects();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <Layout>
      <div className="d-flex align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0"><i className="bi bi-folder me-2 text-primary"></i>Projects</h4>
          <p className="text-muted small mb-0">{projects.length} project{projects.length !== 1 ? 's' : ''} found</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary ms-auto" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg me-2"></i>New Project
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-folder-x fs-1 text-muted d-block mb-3"></i>
          <h5 className="text-muted">No projects yet</h5>
          {user?.role === 'admin' && (
            <button className="btn btn-primary mt-2" onClick={() => setShowModal(true)}>
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="row g-3">
          {projects.map((project) => (
            <div key={project._id} className="col-xl-4 col-md-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="bg-primary bg-opacity-10 rounded-2 p-2 me-2">
                      <i className="bi bi-folder-fill text-primary fs-5"></i>
                    </div>
                    {user?.role === 'admin' && project.createdBy?._id === user._id && (
                      <div className="dropdown">
                        <button className="btn btn-link text-muted p-0" data-bs-toggle="dropdown">
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => navigate(`/projects/${project._id}`)}
                            >
                              <i className="bi bi-eye me-2"></i>View
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item text-danger"
                              onClick={() => handleDelete(project._id)}
                            >
                              <i className="bi bi-trash me-2"></i>Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <h6 className="fw-bold mb-1">{project.name}</h6>
                  <p className="text-muted small mb-3">
                    {project.description || <span className="fst-italic">No description</span>}
                  </p>

                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      {project.members?.slice(0, 4).map((m, i) => (
                        <div
                          key={m._id}
                          className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center small fw-bold"
                          title={m.name}
                          style={{
                            width: 28, height: 28, fontSize: 11,
                            marginLeft: i > 0 ? -8 : 0,
                            border: '2px solid white',
                            zIndex: 4 - i,
                          }}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {project.members?.length > 4 && (
                        <span className="text-muted small ms-2">+{project.members.length - 4}</span>
                      )}
                    </div>
                    <Link
                      to={`/projects/${project._id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Open <i className="bi bi-arrow-right ms-1"></i>
                    </Link>
                  </div>
                </div>
                <div className="card-footer bg-white border-0 pt-0 pb-3 px-3">
                  <small className="text-muted">
                    <i className="bi bi-person me-1"></i>
                    Created by {project.createdBy?.name}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-folder-plus me-2 text-primary"></i>New Project
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body">
                  {formError && (
                    <div className="alert alert-danger py-2 small">{formError}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Project Name *</label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Website Redesign"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Brief project description..."
                    />
                  </div>
                  {users.length > 0 && (
                    <div className="mb-2">
                      <label className="form-label fw-semibold small">Add Members</label>
                      <div className="border rounded p-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                        {users.filter((u) => u._id !== user._id).map((u) => (
                          <div key={u._id} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`m-${u._id}`}
                              checked={form.members.includes(u._id)}
                              onChange={() => handleMemberToggle(u._id)}
                            />
                            <label className="form-check-label small" htmlFor={`m-${u._id}`}>
                              {u.name} <span className="text-muted">({u.email})</span>
                              <span className={`ms-1 badge ${u.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                {u.role}
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</> : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Projects;
