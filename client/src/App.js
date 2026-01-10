import React, { useEffect } from "react";
import "./styles/App.css"; 

function App() {
  const token = localStorage.getItem('token');

  useEffect(() => {
    const animateElements = document.querySelectorAll(".animate");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1 }
    );

    animateElements.forEach((el) => {
      el.style.opacity = 0;
      el.style.transform = "translateY(30px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(el);
    });

    // Mobile menu functionality
    const mobileMenuBtn = document.querySelector("#mobile-menu-btn");
    const navLinks = document.querySelector(".nav-links");

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener("click", () => {
        const currentDisplay = navLinks.style.display;
        navLinks.style.display = currentDisplay === "flex" ? "none" : "flex";
        navLinks.style.flexDirection = "column";
        navLinks.style.position = "absolute";
        navLinks.style.top = "100%";
        navLinks.style.left = "0";
        navLinks.style.right = "0";
        navLinks.style.backgroundColor = "white";
        navLinks.style.padding = "2rem";
        navLinks.style.boxShadow = "0 10px 30px rgba(0,0,0,0.1)";
      });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        if (targetId === "#") return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: "smooth",
          });

          // Close mobile menu if open
          if (window.innerWidth <= 768) {
            navLinks.style.display = "none";
          }
        }
      });
    });

    // Cleanup function
    return () => {
      observer.disconnect();
      if (mobileMenuBtn) {
        mobileMenuBtn.removeEventListener("click", () => {});
      }
    };
  }, []);

  const apiEndpoints = [
    {
      method: "GET",
      endpoint: "/api/events",
      description: "Retrieve all events",
      access: "Public",
    },
    {
      method: "GET",
      endpoint: "/api/events/:id",
      description: "Get specific event details",
      access: "Public",
    },
    {
      method: "POST",
      endpoint: "/api/events",
      description: "Create a new event",
      access: "Organizer/Admin",
    },
    {
      method: "POST",
      endpoint: "/api/registrations",
      description: "Register for an event",
      access: "Authenticated Users",
    },
    {
      method: "GET",
      endpoint: "/api/registrations/my-registrations",
      description: "View user's registrations",
      access: "Authenticated Users",
    },
    {
      method: "DELETE",
      endpoint: "/api/registrations/:id",
      description: "Cancel a registration",
      access: "Authenticated Users",
    },
    {
      method: "POST",
      endpoint: "/api/auth/register",
      description: "Register a new user",
      access: "Public",
    },
    {
      method: "POST",
      endpoint: "/api/auth/login",
      description: "User login",
      access: "Public",
    },
  ];

  const features = [
    {
      icon: "fas fa-calendar-check",
      title: "Event Management",
      description:
        "Create, update, and manage events with details. Full CRUD operations with admin controls.",
    },
    {
      icon: "fas fa-user-friends",
      title: "User Registration",
      description:
        "Users can register for events with validation, prevent duplicates, and track registration status",
    },
    {
      icon: "fas fa-cogs",
      title: "Admin Dashboard",
      description:
        "Admins can manage events, view & manage users and their activity",
    },
  ];

  const techStack = [
    {
      icon: "fab fa-node-js",
      name: "Express.js",
      description: "Backend Framework",
    },
    {
      icon: "fas fa-database",
      name: "PostgressDB",
      description: "SQL Database",
    },
    {
      icon: "fas fa-shield-alt",
      name: "Supabase Auth",
      description: "Secure Authentication",
    },
    { icon: "fas fa-server", name: "REST API", description: "Architecture" },
  ];

  return (
    <div className="App">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
      <header>
        <div className="container">
          <nav className="navbar">
            <a href="#hero" className="logo">
              <i className="fas fa-calendar-alt"></i>
              CodeAlpha EventHub
            </a>

            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#tech">Tech Stack</a>
              <a href="#api">API Endpoints</a>
              <a href={token != null ? "/events" : "/login"} className="cta-button">
                <i className="fas fa-rocket"></i> Get Started
              </a>
            </div>

            <button id="mobile-menu-btn" title="Menu">
              <i className="fas fa-bars"></i>
            </button>
          </nav>
        </div>
      </header>

      <section className="hero" id="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text animate">
              <h1>
                Professional <span>Event Registration</span> System
              </h1>
              <p>
                A scalable backend solution built with Express.js and
                PostgressDB built as a task for Code Alpha internship program.
                Manage events, registrations, and users with a robust API.
              </p>
              <div className="hero-buttons">
                <a href={token ? "/events" : "/login"} className="cta-button">
                  <i className="fas fa-calendar-check"></i> View events
                </a>
                <a
                  href="https://github.com/Tsedexashu08/CodeAlpha_Event_Registration_System"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-button"
                  style={{
                    border: "2px solid white",
                    marginLeft: "1rem",
                  }}
                >
                  <i className="fab fa-github"></i> GitHub Repo
                </a>
              </div>
            </div>
            <div className="hero-image delay-1 animate">
              <div className="hero-image-container">
                <div className="hero-image-content">
                  <img
                    src="https://umaine.edu/undiscoveredmaine/wp-content/uploads/sites/527/2020/08/trillion-main.jpg"
                    alt="hero img"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <div className="section-title animate">
            <h2>Core Features</h2>
            <p>
              Everything required by the task to manage events and registrations
              efficiently
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`feature-card ${
                  index > 0 ? `delay-${index}` : ""
                } animate`}
              >
                <div className="feature-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tech" className="tech-stack">
        <div className="container">
          <div className="section-title animate">
            <h2>Technology Stack</h2>
            <p>Modern technologies powering the Event Registration System</p>
          </div>

           <div class="tech-grid">
                <div class="tech-item animate">
                    <div class="tech-icon">
                        <i class="fab fa-node-js"></i>
                    </div>
                    <h4>Express.js</h4>
                    <p>Backend Framework</p>
                </div>

                <div class="tech-item delay-1 animate">
                    <div class="tech-icon">
                        <i class="fas fa-database"></i>
                    </div>
                    <h4>PostgressDB</h4>
                    <p>SQL Database</p>
                </div>

                <div class="tech-item delay-2 animate">
                    <div class="tech-icon">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <h4>Supabase Auth</h4>
                    <p>Secure Authentication</p>
                </div>

                <div class="tech-item animate">
                    <div class="tech-icon">
                        <i class="fas fa-server"></i>
                    </div>
                    <h4>REST API</h4>
                    <p>Architecture</p>
                </div>
            </div>
        </div>
      </section>

      <section id="api" className="api-endpoints">
        <div className="container">
          <div className="section-title animate">
            <h2>API Endpoints</h2>
            <p>Complete RESTful API for managing events and registrations</p>
          </div>

          <table className="endpoints-table animate">
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Description</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {apiEndpoints.map((endpoint, index) => (
                <tr key={index}>
                  <td>
                    <span
                      className={`method ${endpoint.method
                        .toLowerCase()
                        .replace("post", "post")}`}
                    >
                      {endpoint.method}
                    </span>
                  </td>
                  <td>
                    <code>{endpoint.endpoint}</code>
                  </td>
                  <td>{endpoint.description}</td>
                  <td>{endpoint.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default App;
