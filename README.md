# SmartDrive

**SmartDrive** is an intelligent route planning application designed to enhance your travel experience. It goes beyond simple point-A-to-point-B navigation by integrating tourist spots, weather data, and multiple driving profiles to find the best route for your needs.

## Features

-   **Intelligent Route Planning**: Calculate optimal routes based on your preferences.
-   **Driving Profiles**: Choose from various driving profiles (e.g., Leisure, Scenic, Fastest) to suit your mood.
-   **Tourist Spot Discovery**: Discover interesting tourist spots along your route.
-   **Real-time Weather Integration**: (Planned) Get weather updates for your journey.
-   **Dark Mode**: A sleek dark mode for comfortable viewing at night.
-   **Live Time Sync**: Sync travel time with network time for accurate planning.
-   **Interactive Map**: Powered by Google Maps for a familiar and robust mapping experience.

## Tech Stack

-   **Frontend Framework**: React
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS
-   **Map Integration**: @react-google-maps/api
-   **Backend/Database**: Firebase (Firestore)
-   **Icons**: Lucide React

## Getting Started

### Prerequisites

-   Node.js (v18 or higher recommended)
-   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/3am-coderz/Smart-drive.git
    cd Smart-drive
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Configuration

Create a `.env` file in the root directory and add your Google Maps and Firebase credentials:

```env
# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> [!IMPORTANT]
> A valid Google Maps API key with "Places", "Geometry", "Drawing", and "Visualization" libraries enabled is required.
> You must also enable "Realtime Database" in your Firebase project.

### Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the app for production.
-   `npm run lint`: Runs ESLint to check for code quality issues.
-   `npm run preview`: Locally preview the production build.
-   `npm run upload-tourist-data`: Seeder script to upload tourist data to Firebase. **Note:** This script relies on absolute paths to data files on the original development machine and will not work on other devices without modification.
-   `npm run verify-db`: Script to verify database content.