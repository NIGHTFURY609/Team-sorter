# Team Sorting Web Applicatioivujbboink

A real-time team sorting application built with Node.js, Express, MongoDB, Redis, and Socket.IO. This application allows participants to join a session and administrators to organize them into random teams.

## Features

### Participant Interface
- Simple, clean interface for joining sessions
- Real-time validation and feedback
- Mobile-responsive design
- Confirmation messages upon successful submission

### Admin Dashboard
- Real-time participant list updates
- Live connection status indicator
- Flexible team generation (specify number of teams)
- Visual team display with color-coded cards
- Participant management (clear all functionality)
- Responsive design with modern UI

### Technical Features
- **Real-time Updates**: Socket.IO for instant participant updates
- **Data Persistence**: MongoDB for permanent storage
- **Fast Caching**: Redis for real-time participant list caching
- **Responsive Design**: Tailwind CSS for modern, mobile-first styling
- **Error Handling**: Comprehensive error handling and user feedback

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Caching**: Redis
- **Real-time Communication**: Socket.IO
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Development**: Nodemon for auto-restart

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 14 or higher)
- **MongoDB** (running locally or connection to MongoDB Atlas)
- **Redis** (running locally or connection to Redis instance)

## Installation & Setup

1. **Clone or create the project structure:**
   ```bash
   mkdir team-sorting-app
   cd team-sorting-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your database connections:
   ```
   MONGODB_URI=mongodb://localhost:27017/teamsort
   REDIS_URI=redis://localhost:6379
   PORT=3000
   ```

4. **Make sure MongoDB and Redis are running:**
   
   **For MongoDB:**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (cloud) - update MONGODB_URI in .env
   ```
   
   **For Redis:**
   ```bash
   # If using local Redis
   redis-server
   
   # Or use Redis Cloud - update REDIS_URI in .env
   ```

5. **Start the application:**
   ```bash
   # For development (with auto-restart)
   npm run dev
   
   # For production
   npm start
   ```

6. **Access the application:**
   - **Participant page**: http://localhost:3000
   - **Admin dashboard**: http://localhost:3000/admin

## Project Structure

```
team-sorting-app/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
├── .env                   # Your environment variables (create this)
├── README.md              # This file
└── public/
    ├── index.html         # Participant submission page
    ├── admin.html         # Admin dashboard
    └── js/
        ├── main.js        # Client script for participant page
        └── admin.js       # Client script for admin dashboard
```

## Usage

### For Participants
1. Navigate to the main URL (http://localhost:3000)
2. Enter your full name in the text field
3. Click "Join Session"
4. Wait for the admin to organize teams

### For Administrators
1. Navigate to the admin panel (http://localhost:3000/admin)
2. Watch as participants join in real-time
3. Enter the desired number of teams
4. Click "Sort into Teams" to randomly distribute participants
5. View the generated teams with color-coded cards
6. Use "Clear All Participants" to reset the session

## API Endpoints

- `GET /` - Participant submission page
- `GET /admin` - Admin dashboard
- `POST /api/participants` - Add a new participant
- `GET /api/participants` - Get all participants
- `DELETE /api/participants` - Clear all participants (admin only)

## Socket.IO Events

### Client to Server
- `generate_teams` - Request team generation with specified number of teams
- `get_participants` - Request current participants list

### Server to Client
- `new_participant` - New participant joined
- `participants_list` - Current participants list
- `teams_generated` - Teams have been generated
- `participants_cleared` - All participants cleared
- `error` - Error occurred

## Development

### Running in Development Mode
```bash
npm run dev
```
This uses nodemon for automatic server restarts when files change.

### Environment Variables
Create a `.env` file based on `.env.example`:

```env
MONGODB_URI=mongodb://localhost:27017/teamsort
REDIS_URI=redis://localhost:6379
PORT=3000
```

### Database Models

**Participant Schema:**
```javascript
{
  name: String (required, trimmed),
  createdAt: Date (default: now)
}
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check the MONGODB_URI in your .env file
   - Verify network connectivity

2. **Redis Connection Error:**
   - Ensure Redis server is running
   - Check the REDIS_URI in your .env file
   - Verify Redis is accessible

3. **Port Already in Use:**
   - Change the PORT in your .env file
   - Kill any processes using the port: `lsof -ti:3000 | xargs kill -9`

4. **Socket.IO Not Working:**
   - Check browser console for errors
   - Ensure firewall isn't blocking WebSocket connections
   - Verify server is running and accessible

### Logs
The server provides comprehensive logging for debugging:
- Connection status for MongoDB and Redis
- Socket.IO connection/disconnection events
- API request/response information
- Error details with stack traces

## Contributing

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.