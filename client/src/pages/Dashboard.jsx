import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import styles from '../styles/Dashboard.module.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  
  const [summaryStats, setSummaryStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
  });

  useEffect(() => {
    const checkUserRole = () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!userData || !token) {
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
      fetchAdminData(token);
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

      // Set summary stats
      setSummaryStats({
          totalUsers: usersData.pagination?.total || usersData.users?.length || 0,
          totalEvents: eventsData.pagination?.total ||eventsData.events?.length|| 0,
          totalRegistrations: 'N/A' // Placeholder
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            <h2>Events Management</h2>
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
                      <button className={`${styles.action_button} ${styles.delete_button}`}>Delete</button>
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

