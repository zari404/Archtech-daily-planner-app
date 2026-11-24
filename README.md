# Daily Planner — Full-Stack To-Do App

A responsive daily planner built with HTML, CSS, JavaScript and a Node.js/Express backend. Tasks and projects are saved by the server in a JSON data file.

## Features

- Add, edit and delete tasks
- Set task status: To do, In progress, Done or Cancelled
- Create, edit and delete projects
- Assign tasks to projects
- Filter tasks by status and project
- View project completion progress
- View task activity reports
- Toggle dark mode
- Responsive layout for desktop and mobile
- Server API saves tasks and projects

## Tech stack

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js and Express
- Storage: JSON file (`data/db.json`)

## Run locally

1. Install Node.js (LTS).
2. Open this folder in VS Code.
3. Open the terminal in this folder.
4. Install dependencies:

   ```bash
   npm install
   ```

5. Start the server:

   ```bash
   npm start
   ```

6. Open `http://localhost:3000` in your browser.

Do not open `public/index.html` directly or use Live Server for this full-stack version. The app must be served by Node.js so its `/api/data` endpoint works.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/data` | Get all projects and tasks |
| PUT | `/api/data` | Save all projects and tasks |
| GET | `/api/health` | Check server status |

## Deploy to Render

1. Create a GitHub repository and upload this project.
2. Sign in to Render and choose **New + → Web Service**.
3. Connect your GitHub repository.
4. Use these settings:
   - Build command: `npm install`
   - Start command: `npm start`
5. Deploy and open the Render URL.

**Important storage note:** this starter stores data in `data/db.json`. A free Render web service may use an ephemeral filesystem, so local JSON-file data can be lost when the service restarts or redeploys. For reliable persistent online data, connect a managed database (for example, PostgreSQL) before relying on the deployed app for real tasks. Do not store sensitive information in this demo.

## Screenshots

Add screenshots after running the app:

1. Create a folder named `screenshots`.
2. Save screenshots as `screenshots/today.png`, `screenshots/projects.png` and `screenshots/report.png`.
3. Add this section to display them:

```md
## Screenshots

### Today
![Today view](screenshots/today.png)

### Projects
![Projects view](screenshots/projects.png)

### Reports
![Reports view](screenshots/report.png)
```

## Future improvements

- User accounts and authentication
- PostgreSQL database
- Due dates and reminders
- Search and priority labels

## Author

Created as a learning project to practice frontend development, Node.js and full-stack application structure.
