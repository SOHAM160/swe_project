# Backend Setup Documentation

## Overview

The WasteChain application now uses a fully functional backend server that stores all data locally on your PC. All buttons and features are now connected to real API endpoints.

## Data Storage

- **Location**: All data is stored in the `/data` directory at the project root
- **Format**: JSON files (one file per data type)
- **Files Created**:
  - `bins.json` - Smart bin data
  - `citizens.json` - Citizen user data
  - `contractors.json` - Contractor user data
  - `activities.json` - System activity logs
  - `blockchain.json` - Blockchain transaction logs
  - `reports.json` - Issue reports from citizens
  - `users.json` - Admin users

## API Endpoints

### Bins
- `GET /api/bins` - Get all bins
- `POST /api/bins` - Create a new bin
- `GET /api/bins/[id]` - Get a specific bin
- `PATCH /api/bins/[id]` - Update a bin
- `DELETE /api/bins/[id]` - Delete a bin

### Citizens
- `GET /api/citizens` - Get all citizens
- `POST /api/citizens` - Create a new citizen
- `GET /api/citizens/[id]` - Get a specific citizen
- `PATCH /api/citizens/[id]` - Update a citizen
- `POST /api/citizens/[id]/report` - Submit an issue report (awards points)

### Contractors
- `GET /api/contractors` - Get all contractors
- `POST /api/contractors` - Create a new contractor
- `GET /api/contractors/[id]` - Get a specific contractor
- `PATCH /api/contractors/[id]` - Update a contractor
- `POST /api/contractors/[id]/pickup` - Confirm a pickup (updates earnings)

### Activities
- `GET /api/activities` - Get activity feed
- `POST /api/activities` - Create a new activity log

### Blockchain
- `GET /api/blockchain` - Get all blockchain transactions
- `POST /api/blockchain` - Log a new transaction

### Analytics
- `GET /api/analytics` - Get system-wide analytics and statistics

### Reports
- `GET /api/reports` - Get all issue reports

### Initialization
- `GET /api/init` - Initialize default data
- `POST /api/init` - Initialize default data

## Functional Features

### Admin Dashboard
✅ **Emergency Collection** - Actually dispatches collection for all full bins
✅ **Generate Report** - Downloads a JSON report file
✅ **Add New Bin** - Creates bins with form input
✅ **Update Bin Status** - Updates bin status and fill level
✅ **Delete Bin** - Removes bins from the system
✅ **Real-time Activity Feed** - Shows actual system activities
✅ **Analytics Dashboard** - Displays real statistics from the database

### Citizen Dashboard
✅ **Report Issues** - Submits reports and awards points (stored in database)
✅ **Find Nearest Bin** - Uses browser geolocation API
✅ **Points System** - Real points tracking (persisted)
✅ **Environmental Impact** - Real data from user profile
✅ **Refresh Data** - Updates from backend

### Contractor Dashboard
✅ **Confirm Pickup** - Updates bin status and contractor earnings (persisted)
✅ **Resolve Hazards** - Updates bin status and earnings
✅ **Earnings Tracking** - Real-time earnings from database
✅ **Performance Stats** - Actual weekly statistics
✅ **Route Optimization** - Shows route info for assigned bins
✅ **Emergency Contact** - Functional contact prompt

## Data Persistence

All data is automatically saved to JSON files in the `/data` directory. The data persists between server restarts.

## Initialization

The database is automatically initialized on first API call. Default data includes:
- 3 sample bins
- 1 admin user
- 1 demo citizen (with 1250 points)
- 1 demo contractor (with earnings data)

## Running the Server

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The backend will automatically initialize on first request

3. All data will be stored in the `data/` directory

## Notes

- The `/data` directory is gitignored to prevent committing user data
- All API endpoints return proper error messages
- Data is validated before saving
- Activities are automatically logged for important actions
- Blockchain transactions are recorded for all pickups and updates

