# Smart Wardrobe Management App

A modern React Native application built with Expo for intelligent wardrobe management, featuring AI-powered clothing tagging and outfit suggestions.

## Features

### 🎯 Core Functionality
- **Personal Wardrobe Management**: Add, edit, and organize your clothing items
- **Photo Upload**: Capture or select photos from your device
- **Automatic Tagging**: AI-powered clothing analysis using Google Cloud Vision
- **Smart Outfit Suggestions**: Daily AI-generated outfit recommendations
- **User Authentication**: Secure login with Supabase Auth

### 🎨 Modern Design
- Clean, fashion-focused interface
- Smooth animations and micro-interactions
- Responsive design for all device sizes
- Professional typography with Inter font family

### 🚀 Advanced Features
- Tab-based navigation for intuitive user experience
- Real-time data synchronization
- Secure image storage with Supabase
- Modular serverless architecture integration

## Tech Stack

### Frontend
- **React Native** with Expo SDK 53
- **TypeScript** for type safety
- **Expo Router** for navigation
- **React Native Reanimated** for animations

### Backend & Services
- **Supabase** for database, authentication, and storage
- **Google Cloud Vision API** for automatic clothing tagging
- **OpenAI API** for intelligent outfit suggestions
- **Google Cloud Functions** for serverless processing

## Project Structure

```
├── app/                    # App routes and screens
│   ├── (tabs)/            # Tab-based navigation
│   ├── auth.tsx           # Authentication screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks
├── services/              # API and business logic
├── types/                 # TypeScript type definitions
└── lib/                   # Utilities and configurations
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Expo CLI: `npm install -g @expo/cli`
- Supabase account
- Google Cloud Platform account (for Vision API)
- OpenAI account (for GPT API)

### 1. Environment Configuration

Copy `.env.sample` to `.env` and fill in your credentials:

```bash
cp .env.sample .env
```

Configure the following variables:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `EXPO_PUBLIC_CLOUD_FUNCTION_TAG_CLOTHES`: Google Cloud Function endpoint for clothing tagging
- `EXPO_PUBLIC_CLOUD_FUNCTION_SUGGEST_OUTFIT`: Google Cloud Function endpoint for outfit suggestions

### 2. Database Setup

The app uses Supabase PostgreSQL with the following main tables:
- `users`: User profiles and metadata
- `clothes`: Clothing items with attributes and image URLs  
- `outfit_suggestions`: AI-generated outfit recommendations

### 3. Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Cloud Functions Setup

The application requires two Google Cloud Functions:

**Tag Clothes Function** (`/tag-clothes`):
- Accepts image URL
- Uses Google Vision API to analyze clothing
- Returns type, color, and additional tags

**Suggest Outfit Function** (`/suggest-outfit`):
- Accepts user's clothing inventory
- Uses AI logic or OpenAI API
- Returns curated outfit suggestion

## Key Components

### Authentication
- Secure email/password authentication via Supabase Auth
- Automatic session management and persistence
- User profile management

### Wardrobe Management
- Photo capture or gallery selection
- Automatic image upload to Supabase Storage
- AI-powered tagging with Google Vision API
- Manual editing of clothing attributes

### Outfit Suggestions
- Context-aware suggestions (casual, work, formal, etc.)
- AI-powered outfit generation
- Outfit history and favorites
- Daily suggestions with refresh capability

## Architecture Highlights

### Modular Design
- Clean separation between UI, business logic, and data layers
- Reusable components and hooks
- Type-safe API integration

### Serverless Integration
- All AI processing handled via external Cloud Functions
- Secure API key management
- Scalable architecture for future enhancements

### User Experience
- Optimistic UI updates
- Loading states and error handling
- Smooth transitions and animations

## Development Guidelines

### Code Organization
- Components in `/components/` directory
- Business logic in `/services/` directory
- Type definitions in `/types/` directory
- Custom hooks in `/hooks/` directory

### Best Practices
- TypeScript for all components and services
- Error handling with user-friendly messages
- Responsive design principles
- Performance optimization with lazy loading

## Deployment

### Build for Production

```bash
# Web build
npm run build:web

# Mobile builds require Expo Application Services (EAS)
```

### Supabase Configuration
- Enable Row Level Security (RLS) on all tables
- Configure storage bucket policies
- Set up authentication providers

## Future Enhancements

- Social features (sharing outfits, following other users)
- Weather integration for seasonal suggestions
- Color palette analysis and matching
- Shopping integration with outfit suggestions
- Advanced filtering and search capabilities

## Support

For questions or issues:
1. Check the documentation in `/docs/` directory
2. Review the example implementations in `/examples/`
3. Create an issue in the project repository

## License

This project is licensed under the MIT License.