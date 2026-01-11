# Espresso Tracker

A web application to help users dial in their perfect espresso shots by tracking settings, equipment, and flavor profiles.

## Features

- **User Authentication**: Secure login and registration
- **Bean Management**: Track different coffee beans with variety, roaster, seller, and roast level
- **Espresso Records**: Record detailed information about each shot:
  - Equipment (machine and grinder)
  - Settings (grind size, dose, extraction time, yield)
  - Flavor ratings (overall, sourness, bitterness, sweetness)
  - Notes
- **Search & Filter**: Search records across all beans by machine, grinder, and bean information
- **User Settings**: Set default machine and grinder for convenience

## Tech Stack

### Backend
- **Python 3.8+**
- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Database (can be easily switched to PostgreSQL)
- **JWT** - Authentication tokens

### Frontend
- **React 18** with TypeScript
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS** - Custom styling

## Quick Start

### Development Setup

#### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables (copy .env.example to .env and configure):
```bash
cp .env.example .env
# Edit .env with your settings
```

5. Run the server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

#### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (copy .env.example to .env):
```bash
cp .env.example .env
# Edit .env and set REACT_APP_API_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm start
```

The app will be available at `http://localhost:3000`

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick deployment with scripts:**
```bash
# Deploy to VPS
./deploy.sh all vps

# Deploy to Railway
./deploy.sh all railway

# Deploy frontend to Netlify
./deploy.sh frontend netlify
```

## Project Structure

```
espresso-tracker/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication utilities
│   ├── routers/             # API route handlers
│   │   ├── auth.py          # Authentication routes
│   │   ├── beans.py         # Bean CRUD operations
│   │   ├── records.py       # Espresso record operations
│   │   └── users.py         # User settings
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variables template
│   └── Procfile             # Production process file
│
├── frontend/
│   ├── src/
│   │   ├── api/             # API client functions
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts (Auth)
│   │   ├── pages/           # Page components
│   │   └── App.tsx          # Main app component
│   ├── package.json         # Node dependencies
│   └── .env.example         # Environment variables template
│
├── deploy.sh                # General deployment script
├── deploy-vps.sh            # Full VPS setup script
└── DEPLOYMENT.md            # Detailed deployment guide
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Beans
- `GET /api/beans/` - Get all beans for current user
- `GET /api/beans/{id}` - Get bean by ID
- `POST /api/beans/` - Create new bean
- `PUT /api/beans/{id}` - Update bean
- `DELETE /api/beans/{id}` - Delete bean

### Records
- `GET /api/records/` - Get all records (with optional filters)
- `GET /api/records/{id}` - Get record by ID
- `POST /api/records/` - Create new record
- `PUT /api/records/{id}` - Update record
- `DELETE /api/records/{id}` - Delete record

### User Settings
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update user settings

## Usage

1. **Register/Login**: Create an account or login
2. **Add Beans**: Add coffee beans you want to track
3. **Set Defaults**: Configure your default machine and grinder in Settings
4. **Record Shots**: For each bean, add espresso records with all the details
5. **Search**: Use the Search page to find guidance for your bean + machine + grinder combination
6. **Track Progress**: Review your records to find the perfect settings

## Development Notes

- The backend uses SQLite by default. For production, consider switching to PostgreSQL.
- JWT secret key should be set via environment variable (SECRET_KEY)
- CORS is configured via ALLOWED_ORIGINS environment variable
- Environment variables are loaded from `.env` files (see `.env.example`)

## License

MIT
