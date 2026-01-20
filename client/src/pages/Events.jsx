import React, { useState, useEffect } from 'react';
import styles from '../styles/Events.module.css';

function Events() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState({});
  const [filters, setFilters] = useState({
    category: 'all',
    date: 'all',
    search: ''
  });

  const API_BASE_URL = 'http://localhost:3000/';

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, filters]);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchUserRegistrations();
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}api/events`);
      const data = await response.json();
      
      if (response.ok) {
        setEvents(data.data || []);
        // Extract unique categories
        const uniqueCategories = ['all', ...new Set(data.data.map(event => event.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRegistrations = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}api/registrations/my-registrations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.data || []);
        
        // Create a map of event_id -> registration status
        const statusMap = {};
        data.data.forEach(reg => {
          statusMap[reg.event_id] = reg.status;
        });
        setRegistrationStatus(statusMap);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(event => event.category === filters.category);
    }

    // Filter by date
    if (filters.date !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (filters.date) {
        case 'today':
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === today.toDateString();
          });
          break;
        case 'upcoming':
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= today;
          });
          break;
        case 'past':
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate < today;
          });
          break;
      }
    }

    // Filter by search
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredEvents(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterClick = (event) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login?redirect=/events';
      return;
    }
    
    setSelectedEvent(event);
    setShowRegistrationModal(true);
  };

  const handleRegistration = async () => {
    if (!user || !selectedEvent) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}api/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: selectedEvent.id,
          user_id: user.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Successfully registered for the event!');
        setRegistrationStatus(prev => ({
          ...prev,
          [selectedEvent.id]: 'confirmed'
        }));
        // Update event attendees count
        setEvents(prevEvents =>
          prevEvents.map(event =>
            event.id === selectedEvent.id
              ? { ...event, current_attendees: event.current_attendees + 1 }
              : event
          )
        );
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      alert('Network error. Please try again.');
    } finally {
      setShowRegistrationModal(false);
      setSelectedEvent(null);
    }
  };

  const handleCancelRegistration = async (eventId) => {
    if (!user) return;

    if (!window.confirm('Are you sure you want to cancel your registration?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const registration = registrations.find(reg => reg.event_id === eventId);
      
      if (!registration) return;

      const response = await fetch(`${API_BASE_URL}api/registrations/${registration.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Registration cancelled successfully');
        // Update registration status
        setRegistrationStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[eventId];
          return newStatus;
        });
        // Update event attendees count
        setEvents(prevEvents =>
          prevEvents.map(event =>
            event.id === eventId
              ? { ...event, current_attendees: Math.max(0, event.current_attendees - 1) }
              : event
          )
        );
      } else {
        alert('Failed to cancel registration');
      }
    } catch (err) {
      console.error('Cancel registration error:', err);
      alert('Network error. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (event) => {
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) return 'past';
    if (event.current_attendees >= event.max_attendees) return 'full';
    if (!event.is_active) return 'cancelled';
    return 'active';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return styles.badgeActive;
      case 'full': return styles.badgeFull;
      case 'past': return styles.badgePast;
      case 'cancelled': return styles.badgeCancelled;
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <div className={`${styles.text} ${styles.loadingText}`}>Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}>
          <nav className={styles.navbar}>
            <a href="/" className={styles.logo}>
              <i className={`fas fa-calendar-alt ${styles.logoIcon}`}></i>
              CodeAlpha EventHub
            </a>
            <div className={styles.navLinks}>
              <a href="/events" className={`${styles.navLink} ${styles.navLinkActive}`}>
                <i className="fas fa-calendar"></i> Events
              </a>
              {user && (
                <a href="/dashboard" className={styles.navLink}>
                  <i className="fas fa-user"></i> Dashboard
                </a>
              )}
              {user ? (
                <a href="/logout" className={`${styles.button} ${styles.buttonLogout}`}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </a>
              ) : (
                <>
                  <a href="/login" className={styles.navLink}>
                    <i className="fas fa-sign-in-alt"></i> Login
                  </a>
                  <a href="/signup" className={`${styles.button} ${styles.buttonPrimary}`}>
                    <i className="fas fa-user-plus"></i> Sign Up
                  </a>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={`${styles.heading} ${styles.h1}`}>Discover Amazing Events</h1>
            <p className={`${styles.text} ${styles.textLarge}`}>
              Join thousands of attendees at our exciting events. Register now to secure your spot!
            </p>
            {!user && (
              <div className={styles.heroButtons}>
                <a href="/signup" className={`${styles.button} ${styles.buttonPrimary}`}>
                  <i className="fas fa-user-plus"></i> Join Now
                </a>
                <a href="#events" className={`${styles.button} ${styles.buttonSecondary}`}>
                  <i className="fas fa-calendar-check"></i> Browse Events
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className={styles.filtersSection}>
        <div className={styles.container}>
          <div className={styles.filtersCard}>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="search" className={styles.filterLabel}>
                  <i className="fas fa-search"></i>
                </label>
                <input
                  type="text"
                  id="search"
                  name="search"
                  placeholder="Search events..."
                  value={filters.search}
                  onChange={handleFilterChange}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="category" className={styles.filterLabel}>
                  <i className="fas fa-tag"></i> Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className={styles.filterSelect}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="date" className={styles.filterLabel}>
                  <i className="fas fa-calendar"></i> Date
                </label>
                <select
                  id="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  className={styles.filterSelect}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past Events</option>
                </select>
              </div>

              <button 
                className={styles.resetFilters}
                onClick={() => setFilters({
                  category: 'all',
                  date: 'all',
                  search: ''
                })}
              >
                <i className="fas fa-redo"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className={styles.eventsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={`${styles.heading} ${styles.h2}`}>Available Events</h2>
            <p className={styles.text}>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {error && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <i className={`fas fa-exclamation-circle ${styles.alertIcon}`}></i>
              <span>{error}</span>
            </div>
          )}

          {filteredEvents.length === 0 ? (
            <div className={styles.noEvents}>
              <i className={`fas fa-calendar-times ${styles.noEventsIcon}`}></i>
              <h3 className={styles.heading}>No events found</h3>
              <p className={styles.text}>Try adjusting your filters or check back later for new events.</p>
            </div>
          ) : (
            <div className={styles.eventsGrid}>
              {filteredEvents.map(event => {
                const status = getEventStatus(event);
                const isRegistered = registrationStatus[event.id];
                const isFull = status === 'full';
                const isPast = status === 'past';
                const isCancelled = status === 'cancelled';

                return (
                  <div key={event.id} className={styles.eventCard}>
                    <div className={styles.eventHeader}>
                      <span className={`${styles.eventBadge} ${getStatusBadgeClass(status)}`}>
                        {status === 'active' && 'Active'}
                        {status === 'full' && 'Full'}
                        {status === 'past' && 'Past'}
                        {status === 'cancelled' && 'Cancelled'}
                      </span>
                      {event.category && (
                        <span className={styles.categoryBadge}>
                          <i className="fas fa-tag"></i> {event.category}
                        </span>
                      )}
                    </div>

                    <div className={styles.eventContent}>
                      <h3 className={`${styles.heading} ${styles.h3}`}>{event.title}</h3>
                      <p className={styles.eventDescription}>
                        {event.description.length > 150 
                          ? `${event.description.substring(0, 150)}...` 
                          : event.description}
                      </p>

                      <div className={styles.eventDetails}>
                        <div className={styles.detailItem}>
                          <i className={`fas fa-calendar-day ${styles.detailIcon}`}></i>
                          <span>{formatDate(event.date)}</span>
                        </div>
                        {event.time && (
                          <div className={styles.detailItem}>
                            <i className={`fas fa-clock ${styles.detailIcon}`}></i>
                            <span>{formatTime(event.time)}</span>
                          </div>
                        )}
                        <div className={styles.detailItem}>
                          <i className={`fas fa-map-marker-alt ${styles.detailIcon}`}></i>
                          <span>{event.location}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <i className={`fas fa-users ${styles.detailIcon}`}></i>
                          <span>{event.current_attendees} / {event.max_attendees} attendees</span>
                        </div>
                        {event.price > 0 && (
                          <div className={styles.detailItem}>
                            <i className={`fas fa-ticket-alt ${styles.detailIcon}`}></i>
                            <span>${parseFloat(event.price).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.eventFooter}>
                      <div className={styles.attendeeProgress}>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill}
                            style={{ 
                              width: `${(event.current_attendees / event.max_attendees) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className={`${styles.text} ${styles.progressText}`}>
                          {Math.round((event.current_attendees / event.max_attendees) * 100)}% filled
                        </span>
                      </div>

                      <div className={styles.eventActions}>
                        {isRegistered ? (
                          <>
                            <span className={styles.registeredBadge}>
                              <i className="fas fa-check-circle"></i> Registered
                            </span>
                            {!isPast && !isCancelled && (
                              <button
                                className={`${styles.button} ${styles.buttonOutline}`}
                                onClick={() => handleCancelRegistration(event.id)}
                              >
                                <i className="fas fa-times"></i> Cancel
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            className={`${styles.button} ${
                              isFull || isPast || isCancelled 
                                ? styles.buttonDisabled 
                                : styles.buttonPrimary
                            }`}
                            onClick={() => handleRegisterClick(event)}
                            disabled={isFull || isPast || isCancelled}
                          >
                            {isFull && <i className="fas fa-ban"></i>}
                            {isPast && <i className="fas fa-history"></i>}
                            {isCancelled && <i className="fas fa-times-circle"></i>}
                            {!isFull && !isPast && !isCancelled && <i className="fas fa-user-plus"></i>}
                            <span>
                              {isFull && 'Event Full'}
                              {isPast && 'Event Ended'}
                              {isCancelled && 'Event Cancelled'}
                              {!isFull && !isPast && !isCancelled && 'Register Now'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Registration Modal */}
      {showRegistrationModal && selectedEvent && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.heading}>Confirm Registration</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowRegistrationModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.eventSummary}>
                <h4 className={styles.h4}>{selectedEvent.title}</h4>
                <p><i className="fas fa-calendar-day"></i> {formatDate(selectedEvent.date)}</p>
                {selectedEvent.time && (
                  <p><i className="fas fa-clock"></i> {formatTime(selectedEvent.time)}</p>
                )}
                <p><i className="fas fa-map-marker-alt"></i> {selectedEvent.location}</p>
                {selectedEvent.price > 0 && (
                  <p><i className="fas fa-ticket-alt"></i> ${parseFloat(selectedEvent.price).toFixed(2)}</p>
                )}
              </div>
              
              <div className={styles.termsCheckbox}>
                <input type="checkbox" id="confirm-terms" defaultChecked />
                <label htmlFor="confirm-terms">
                  I agree to attend this event and understand the terms
                </label>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={`${styles.button} ${styles.buttonOutline}`}
                onClick={() => setShowRegistrationModal(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleRegistration}
              >
                <i className="fas fa-user-plus"></i> Confirm Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>© {new Date().getFullYear()} CodeAlpha EventHub. All rights reserved.</p>
          <p>Find amazing events and connect with like-minded people.</p>
        </div>
      </footer>
    </div>
  );
}

export default Events;