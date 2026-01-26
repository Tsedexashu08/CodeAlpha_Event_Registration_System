import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Dashboard.module.css';
import editstyles from '../styles/EventForm.module.css';
import { useNavigate } from 'react-router-dom';

const EventFormModal = ({ onClose, token, onEventCreated }) => {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    max_attendees: 100,
    category: '',
    price: 0,
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: name === 'max_attendees' || name === 'price' ?
        (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!eventData.title || !eventData.date || !eventData.location || !eventData.description) {
      setFormError('Please fill in all required fields: Title, Description, Date, and Location.');
      return;
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create event.');
      }

      onEventCreated(result.data);
      onClose();

    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className={editstyles.modal_backdrop}>
      <div className={editstyles.modal_content}>
        <div className={editstyles.modal_header}>
          <h2 className={editstyles.modal_title}>Add New Event</h2>
          <button onClick={onClose} className={editstyles.close_button}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          {formError && <div className={editstyles.error_message}>{formError}</div>}

          <div className={editstyles.form_group}>
            <label htmlFor="title">Event Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={eventData.title}
              onChange={handleChange}
              required
              placeholder="Enter event title"
            />
          </div>

          <div className={editstyles.form_group}>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={eventData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Describe your event"
            ></textarea>
          </div>

          <div className={editstyles.form_row}>
            <div className={editstyles.form_group}>
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={eventData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className={editstyles.form_group}>
              <label htmlFor="time">Time</label>
              <input
                type="time"
                id="time"
                name="time"
                value={eventData.time}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={editstyles.form_group}>
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={eventData.location}
              onChange={handleChange}
              required
              placeholder="Enter event location"
            />
          </div>

          <div className={editstyles.form_row}>
            <div className={editstyles.form_group}>
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={eventData.category}
                onChange={handleChange}
                className={editstyles.select_input}
              >
                <option value="">Select category</option>
                <option value="Technology">Technology</option>
                <option value="Business">Business</option>
                <option value="Arts">Arts</option>
                <option value="Sports">Sports</option>
                <option value="Education">Education</option>
                <option value="Networking">Networking</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className={editstyles.form_group}>
              <label htmlFor="max_attendees">Max Attendees</label>
              <input
                type="number"
                id="max_attendees"
                name="max_attendees"
                value={eventData.max_attendees}
                onChange={handleChange}
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div className={editstyles.form_group}>
            <label htmlFor="price">Price ($)</label>
            <div className={editstyles.price_input}>
              <span className={editstyles.currency_symbol}>$</span>
              <input
                type="number"
                id="price"
                name="price"
                value={eventData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className={editstyles.required_note}>
            * Required fields
          </div>

          <div className={editstyles.form_actions}>
            <button
              type="button"
              onClick={onClose}
              className={editstyles.cancel_button}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={editstyles.submit_button}
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  const [summaryStats, setSummaryStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));


  useEffect(() => {
    const checkUserRole = () => {
      const userData = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (!userData || !storedToken) {
        setError('Access Denied. Please log in.');
        window.location.href = '/login?redirect=/dashboard';
        return;
      }

      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin') {
        setError('Access Denied. This page is for administrators only.');
        // Optionally redirect non-admins away
        // window.location.href = '/'; 
        setLoading(false);
        return;
      }

      setUser(parsedUser);
      setToken(storedToken);
      fetchAdminData(storedToken);
    };

    checkUserRole();
  }, []);

  const fetchAdminData = async (token) => {
    try {
      setLoading(true);
      // Fetch all users
      const usersResponse = await fetch('/api/auth/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!usersResponse.ok) throw new Error('Failed to fetch users.');
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);

      // Fetch all events (we may need a new admin endpoint for this later)
      const eventsResponse = await fetch('/api/events');
      if (!eventsResponse.ok) throw new Error('Failed to fetch events.');
      const eventsData = await eventsResponse.json();
      setEvents(eventsData.data || []);

      setSummaryStats({
        totalUsers: usersData.pagination?.total || usersData.users?.length || 0,
        totalEvents: eventsData.pagination?.total || eventsData.data?.length || 0,
        totalRegistrations: 'N/A'
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEventCreated = (newEvent) => {
    setEvents(prevEvents => [newEvent, ...prevEvents]);
    setSummaryStats(prev => ({ ...prev, totalEvents: prev.totalEvents + 1 }));
  };
 
  const handleDelete = async (eventId) => {
   
    if (!window.confirm('Are you sure you want to delete this event?')) {
    return;
  }

  try {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}` // Add auth token if needed
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete event');
    }

   
    alert('Event deleted successfully');
    
     window.location.reload();

  } catch (error) {
    console.error('Delete error:', error);
    alert(`Failed to delete event: ${error.message}`);
  }
};

  if (error) {
    return (
      <div className={`${styles.dashboard} ${styles.error_page}`}>
        <div className={styles.container}>
          <div className={styles.error_message}>{error}</div>
          <Link to="/" className={styles.cta_button}>Go to Homepage</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${styles.dashboard} ${styles.loading_page}`}>
        <div className={styles.loading_spinner}></div>
        <div className={styles.loading_text}>Loading Admin Dashboard...</div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {isModalOpen && (
        <EventFormModal
          token={token}
          onClose={() => setIsModalOpen(false)}
          onEventCreated={handleEventCreated}
        />
      )}
      <header className={styles.main_header}>
        <div className={styles.container}>
          <nav className={styles.navbar}>
            <Link to="/" className={styles.logo}>
              <i className="fas fa-calendar-alt"></i>
              CodeAlpha EventHub Admin
            </Link>
            <div className={styles.nav_links}>
              <Link to="/" className={styles.nav_link}>
                <i className="fas fa-home"></i> Home
              </Link>
              <Link to="/events" className={styles.nav_link}>
                <i className="fas fa-calendar"></i> Events
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
                className={styles.cta_button_logout}
              >
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className={styles.main_content}>
        <div className={styles.container}>
          <h1 className={styles.page_title}>Welcome, {user?.name}!</h1>

          {/* Summary Stats */}
          <section className={styles.summary}>
            <div className={styles.stat_card}>
              <h2>Total Users</h2>
              <p>{summaryStats.totalUsers}</p>
            </div>
            <div className={styles.stat_card}>
              <h2>Total Events</h2>
              <p>{summaryStats.totalEvents}</p>
            </div>
            <div className={styles.stat_card}>
              <h2>Total Registrations</h2>
              <p>{summaryStats.totalRegistrations}</p>
            </div>
          </section>

          {/* Users Table */}
          <section className={styles.data_section}>
            <h2>Users Management</h2>
            <table className={styles.data_table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <button className={`${styles.action_button} ${styles.edit_button}`}>Edit Role</button>
                      <button className={`${styles.action_button} ${styles.delete_button}`}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Events Table */}
          <section className={styles.data_section}>
            <div className={styles.section_header}>
              <h2>Events Management</h2>
              <button onClick={() => setIsModalOpen(true)} className={styles.cta_button}>
                <i className="fas fa-plus"></i> Add Event
              </button>
            </div>
            <table className={styles.data_table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Organizer ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td>{e.title}</td>
                    <td>{new Date(e.date).toLocaleDateString()}</td>
                    <td>{e.location}</td>
                    <td>{e.organizer_id}</td>
                    <td>

                      <button className={`${styles.action_button} ${styles.edit_button}`}>Edit</button>
                      <button className={`${styles.action_button} ${styles.delete_button}`} type='submit' onClick={() => handleDelete(e.id)}>Delete</button>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;