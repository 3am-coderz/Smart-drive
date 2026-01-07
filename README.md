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

Create a `.env` file in the root directory and add your Google Maps API Key:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

> [!IMPORTANT]
> A valid Google Maps API key with "Places", "Geometry", "Drawing", and "Visualization" libraries enabled is required for the map to function correctly.

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
-   `npm run upload-tourist-data`: Seeder script to upload tourist data to Firebase.
-   `npm run verify-db`: Script to verify database content.