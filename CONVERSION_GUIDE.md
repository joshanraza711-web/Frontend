# AutoFlow Web App - Setup Instructions

## ✅ Conversion Complete!

Your React Native app has been successfully converted to a pure React web app. This can now be packaged as an Android APK using web-to-app converter tools.

## 📦 Project Structure

```
autoflow_App/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Router & main component
│   ├── index.css             # Tailwind styles
│   ├── services/
│   │   └── api.js            # API client (unchanged)
│   ├── store/
│   │   └── useAuthStore.js   # Auth state (unchanged)
│   ├── screens/
│   │   ├── LoginScreen.jsx
│   │   ├── RegisterScreen.jsx
│   │   ├── DashboardScreen.jsx
│   │   ├── GenerateScreen.jsx
│   │   ├── DetailScreen.jsx
│   │   ├── ProfileScreen.jsx
│   │   └── AdminScreen.jsx
│   └── components/
│       ├── MediaCard.jsx
│       ├── StatusBadge.js
│       └── SkeletonCard.js
├── backend/                  # Backend (unchanged)
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS config
├── postcss.config.js        # PostCSS config
├── package.json             # Dependencies
└── README.md
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 3. Build for Production
```bash
npm run build
```

This creates a `dist/` folder ready for web-to-app conversion.

## 🔌 Backend Configuration

The app connects to your backend API at:
```
http://localhost:3000/api
```

Make sure your backend is running before testing.

## 🎨 Tech Stack

- **React 18** - UI framework
- **React Router v6** - Navigation
- **Zustand** - State management (same store logic)
- **Tailwind CSS** - Styling (dark theme)
- **Lucide React** - Icons
- **Vite** - Build tool

## 📱 Mobile-First Design

- Max width: 500px (mobile phone size)
- Responsive grid layouts
- Bottom navigation tabs
- Touch-friendly buttons
- Dark theme (#0F0F1A)

## ✨ Features Preserved

✅ Email/Password authentication
✅ Dashboard with media grid
✅ Filter tabs (All/Images/Videos/Pending/Failed)
✅ Generate images/videos (IMAGE/VIDEO mode, LANDSCAPE/PORTRAIT ratio)
✅ Detail view with download & share
✅ User profile with stats
✅ Admin dashboard (Stats/Workers/Prompts/Inject)
✅ Bulk download selection
✅ Prompt polling for pending status
✅ Dark theme color scheme

## 🔄 Component Conversions

### React Native → React Web
- `View` → `div`
- `Text` → `p`, `span`, `h1`, etc.
- `TextInput` → `input`, `textarea`
- `TouchableOpacity` → `button`
- `Image` → `img`
- `ScrollView` → `div` with `overflow-y: auto`
- `StyleSheet` → Tailwind CSS classes
- `FlatList` → CSS Grid with `.map()`
- `@expo/vector-icons` → `lucide-react`
- `react-native-fs` → Fetch API with Blob
- `react-native-share` → Web Share API
- `ActivityIndicator` → CSS spinner
- `Alert.alert()` → `window.confirm()` / `alert()`

## 📦 APK Conversion Tools

After building, take the `dist/` folder and convert it using:

1. **WebIntoApp** (Free) - webintoapp.com
2. **Median.co** (Trial) - median.co
3. **AppMySite** (Free tier) - appmysite.com
4. **GoNative** (Trial) - gonative.io

These tools wrap your React app in a WebView and generate a signed APK ready to install on Android devices.

## 🎯 Environment Variables

Create a `.env` file if needed:
```
VITE_API_URL=http://localhost:3000/api
```

## ⚠️ Notes

- Backend is unchanged - still runs on port 3000
- All API calls use the same logic as before
- Auth state (Zustand store) is the same
- Database operations are identical
- No breaking changes in functionality

## 🐛 Troubleshooting

### Port 5173 already in use
```bash
npm run dev -- --port 3001
```

### Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Tailwind classes not applying
Check that `index.html` includes `<div id="root"></div>`

## 📝 API Endpoints

All endpoints remain the same:
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /prompts` - Create prompt
- `GET /prompts` - List prompts
- `GET /prompts/:id` - Get prompt details
- `GET /media/:promptId` - Get media files
- `POST /media/bulk-download` - Bulk download
- `GET /admin/*` - Admin endpoints

## ✅ Ready to Package!

Once you've tested the web app:

1. Run `npm run build`
2. Upload the `dist/` folder to your chosen APK converter
3. Download the signed APK
4. Install on Android device
5. Open the app - it works as a native app!

---

**Happy coding! 🚀**
