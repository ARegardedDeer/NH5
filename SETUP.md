# NH5 Development Setup Guide

## Prerequisites

- **macOS** (required for iOS development)
- **Xcode** 15+ (install from Mac App Store)
- **Node.js** 18+ (install via Homebrew: `brew install node`)
- **CocoaPods** (install via: `sudo gem install cocoapods`)
- **GitHub account** with repository access

---

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/YOUR-USERNAME/nimehime-nh5.git
cd nimehime-nh5
```

### 2. Install Dependencies
```bash
# Install Node.js packages
npm install

# Install iOS CocoaPods dependencies
cd ios
pod install
cd ..
```

This will take 5-10 minutes on first install.

### 3. Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env
```

**⚠️ Important:** Get the actual Supabase credentials from the project owner.

Edit `.env` and replace placeholder values:
```
SUPABASE_URL=https://your-actual-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Run the App
```bash
npm run ios
```

This opens the iOS Simulator with the NH5 app.

---

## Troubleshooting

### Pod install fails
```bash
cd ios
pod deintegrate
pod install
```

### Metro bundler issues
```bash
npx react-native start --reset-cache
```

### Build errors after dependency updates
```bash
cd ios
pod install
cd ..
npm run ios
```

---

## Project Structure

```
NH5/
├── src/
│   ├── screens/        # App screens (Home, Detail, MyList, etc.)
│   ├── components/     # Reusable UI components
│   ├── hooks/          # React Query hooks and custom hooks
│   ├── lib/            # Supabase client and utilities
│   └── navigation/     # React Navigation configuration
├── ios/                # iOS native project
├── .env.example        # Environment variable template
└── SETUP.md            # This file
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key (public) |

Get these values from the [Supabase dashboard](https://supabase.com) under **Project Settings > API**.
