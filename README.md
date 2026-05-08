<<<<<<< HEAD
# FitBuddy

Your AI-powered fitness companion for smart workout tracking, analytics, and community engagement.

---

## 🚀 Setup & Development

1. **Clone the repo:**
   ```sh
   git clone https://github.com/your-org/fitbuddy.git
   cd fitbuddy
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Start the dev server:**
```sh
npm run dev
```
4. **Run backend (if separate):**
   - See backend/README.md for instructions.

---

## 🏗️ Build & Deployment

- **Build for production:**
  ```sh
  npm run build
  ```
- **Preview production build:**
  ```sh
  npm run preview
  ```
- **Deploy:**
  - Use Vercel, Netlify, or your own server.
  - See `.github/workflows/ci.yml` for CI/CD pipeline.

---

## ⚙️ Environment Variables

- `VITE_API_URL` — Base URL for backend API
- `VITE_SENTRY_DSN` — Sentry DSN for error monitoring
- (Add more as needed)

---

## 🔗 API Endpoints

- `/api/login` — User authentication
- `/api/workouts` — Workout CRUD
- `/api/leaderboard` — Leaderboard data
- `/api/challenges` — Challenges data
- `/api/friends` — Friends and requests
- `/api/recommendation` — AI/ML recommendations
- `/api/admin/stats` — Admin stats
- `/api/feedback` — User feedback
- (See `API.md` for full docs)

---

## 🧪 Testing

- **Unit/Integration:**
  ```sh
  npm run test
  ```
- **E2E (Cypress):**
  ```sh
  npx cypress open
  ```
- **Accessibility Audit:**
  ```sh
  node scripts/a11y-audit.js
  ```
- **Performance Audit (Lighthouse):**
  ```sh
  bash scripts/lighthouse-audit.sh
  ```

---

## 🛠️ CI/CD

- Automated via GitHub Actions (`.github/workflows/ci.yml`)
- Runs lint, test, e2e, build, and deploy steps

---

## 💬 Feedback & Help

- Use the in-app Feedback button (bottom right)
- Or email: support@fitbuddy.com
- See the [Help & FAQ](/help) page

---

## 🤝 Contributing

- Fork the repo and create a feature branch
- Open a pull request with a clear description
- Run all tests before submitting
- See `CONTRIBUTING.md` for more

---

## 📖 API Documentation (Placeholder)

See `API.md` for detailed API docs (to be completed).

---

**FitBuddy** © 2025. All rights reserved.
=======
# FitForge Buddy

A universal React Native/React web application for fitness tracking and coaching.

## Features

- **Universal Platform Support**: Works on both web browsers and mobile devices
- **Fitness Tracking**: Workout logging, macro tracking, and activity monitoring
- **Social Features**: Friends system and leaderboards
- **Coaching Tools**: Coach dashboard for managing clients
- **Admin Panel**: Administrative tools for platform management

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Android Studio (for Android development)
- Android SDK
- Expo CLI

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fitforge-buddy-main/fitforge-buddy-main
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your configuration:
```env
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
VITE_RUNWAY_API_KEY=your_runway_api_key
```

## Running the Application

### Web Development
```bash
npm run dev
```
This will start the Vite development server for web development.

### Mobile Development (Android)

#### Option 1: Using Expo CLI (Recommended)
```bash
npx expo run:android
```
This will build and run the app on your connected Android device or emulator.

#### Option 2: Using Android Studio
1. Open Android Studio
2. Open the `android` folder from your project directory
3. Wait for Gradle sync to complete
4. Connect your Android device or start an emulator
5. Click the "Run" button (green play icon)

### Universal Development (Both Web and Mobile)
```bash
# Start the development server
npx expo start

# Then press:
# - 'w' for web
# - 'a' for Android
# - 'i' for iOS
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── lib/           # Utility libraries and services
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
└── assets/        # Static assets

android/           # Android-specific configuration
public/            # Public assets for web
```

## Platform-Specific Features

### Web Features
- Full browser compatibility
- Responsive design
- Web-specific optimizations
- Feedback widget

### Mobile Features
- Native mobile UI components
- Touch-optimized navigation
- Mobile-specific performance optimizations
- Platform-specific styling

## Development Notes

- The app uses a universal codebase that works on both web and mobile
- React Router is used for web navigation
- Platform detection is handled automatically
- Components are designed to be responsive and work on all screen sizes

## Troubleshooting

### Android Issues
1. Make sure Android Studio is properly configured
2. Ensure Android SDK is installed and configured
3. Check that your device/emulator is connected
4. Clear Metro cache: `npx expo start --clear`

### Web Issues
1. Check that all dependencies are installed
2. Clear browser cache
3. Check console for any JavaScript errors

### General Issues
1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Clear Expo cache: `npx expo start --clear`
3. Check environment variables are properly set

## Building for Production

### Web Build
```bash
npm run build
```

### Android Build
```bash
npx expo build:android
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both web and mobile
5. Submit a pull request

## License

This project is licensed under the MIT License.
>>>>>>> 105f20dc52a6568a3123bf5ca00e6c2ae00c78c4
