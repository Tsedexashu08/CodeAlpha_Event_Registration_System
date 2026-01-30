# Event Registration System

## Project Overview

This project is a comprehensive Event Registration System made due to task assigned in the code alpha internship designed to manage various events, user registrations, and authentication securely. It provides a platform for users to sign up, log in, view available events, and register for them. The system features a clear separation of concerns, ensuring maintainability and scalability.
## Screenshots
### Login Page
![Login Page Screenshot](/login.png)

### Dashboard
![Dashboard Screenshot](/dashboard.png)

### Events List
![Events List Screenshot](/events.png)

## Getting Started
 The below steps are to be carried out after running npm install in both client & server side
**client side**- cd to the client folder & run npm start
**server side**- cd to the server folder & run node server.js

## Admin credentials
**email:**admin@gmail.com
**username:**admin
**password:**Admin@123
## Architecture: Model-View-Controller (MVC)

The application follows a Model-View-Controller (MVC) architectural pattern, which separates the application into three main logical components:

-   **Model:** Manages the data and business logic. This includes handling data storage, retrieval, and validation. In this project, models are defined on the server-side, interacting with the database.
    -   **Location:** `server/models/`
-   **View:** Responsible for presenting data to the user. This is the user interface part of the application. In this project, the client-side React application serves as the View.
    -   **Location:** `client/src/pages/` (for main views) and other client-side components.
-   **Controller:** Acts as an intermediary between the Model and View. It receives input from the user (via the View), processes it, interacts with the Model to perform actions, and then updates the View. In this project, controllers are located on the server-side, handling API requests.
    -   **Location:** `server/controllers/`

## Project Structure

The project is divided into two main parts: `client` (frontend) and `server` (backend).

### `client/`

This directory contains the React frontend application.

-   **`public/`**: Static assets like `index.html`, favicons, and manifest.
-   **`src/`**:
    -   **`App.js`**: Main application component.
    -   **`index.js`**: Entry point for the React application.
    -   **`pages/`**: Contains major application views (e.g., `Dashboard.jsx`, `Events.jsx`, `Login.jsx`, `SignUp.jsx`).
    -   **`styles/`**: Contains CSS modules and global stylesheets for styling components and pages.

### `server/`

This directory contains the Node.js/Express backend application.

-   **`.env`**: Environment variables (not committed to VCS).
-   **`server.js`**: The main entry point for the backend server.
-   **`supabaseClient.js`**: Configuration and initialization for Supabase client.
-   **`controllers/`**: Contains controller logic for handling different API endpoints (e.g., `EventController.js`, `RegistrationController.js`, `UserController.js`).
-   **`middleware/`**: Houses middleware functions, such as authentication (`auth.js`).
-   **`models/`**: Defines data models and schemas (e.g., `Event.js`, `Registration.js`, `User.js`).
-   **`routes/`**: Defines API routes and links them to their respective controller functions (e.g., `authRoutes.js`, `eventRoutes.js`, `registrationRoutes.js`).


