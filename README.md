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

### 3. Storage Setup

**CRITICAL**: You must create the storage bucket AND configure RLS policies manually in your Supabase dashboard:

#### Step 1: Create the Storage Bucket

1. Go to your Supabase project dashboard at https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Create a bucket named exactly: `clothes-images`
6. Configure the bucket settings:
   - **Public bucket**: Enable this for public access to images
   - **File size limit**: Set to 5MB (5242880 bytes)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
7. Click **"Create bucket"**

#### Step 2: Configure Row Level Security (RLS) Policies

**CRITICAL**: After creating the bucket, you MUST configure RLS policies to allow authenticated users to upload files:

1. In the Storage section, click on the `clothes-images` bucket
2. Click on the **"Policies"** tab
3. Click **"New policy"** → **"Create a policy from scratch"**
4. Configure the INSERT policy:
   - **Name**: `Allow authenticated uploads to clothes-images`
   - **For**: Select `INSERT`
   - **Target**: Ensure `Objects` is selected
   - **Using a custom expression**: Enter exactly:
     ```sql
     (bucket_id = 'clothes-images'::text AND auth.role() = 'authenticated'::text)
     ```
   - **Permissions**: Ensure `INSERT` is checked
5. Click **"Review"** and then **"Save policy"**

6. Create a SELECT policy for reading images:
   - Click **"New policy"** → **"Create a policy from scratch"**
   - **Name**: `Allow public access to clothes-images`
   - **For**: Select `SELECT`
   - **Target**: Ensure `Objects` is selected
   - **Using a custom expression**: Enter exactly:
     ```sql
     bucket_id = 'clothes-images'::text
     ```
   - **Permissions**: Ensure `SELECT` is checked
   - Click **"Review"** and then **"Save policy"**

7. Create a DELETE policy for removing images:
   - Click **"New policy"** → **"Create a policy from scratch"**
   - **Name**: `Allow authenticated users to delete their clothes-images`
   - **For**: Select `DELETE`
   - **Target**: Ensure `Objects` is selected
   - **Using a custom expression**: Enter exactly:
     ```sql
     (bucket_id = 'clothes-images'::text AND auth.role() = 'authenticated'::text)
     ```
   - **Permissions**: Ensure `DELETE` is checked
   - Click **"Review"** and then **"Save policy"**

### 4. Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Cloud Functions Setup

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
- Configure storage bucket policies (see Storage Setup above)
- Set up authentication providers

## Troubleshooting

### Common Issues

#### "Bucket not found" Error
This error occurs when the `clothes-images` storage bucket doesn't exist in your Supabase project.

#### "Row Level Security Policy Violation" Error
This error occurs when the storage bucket exists but doesn't have the proper RLS policies configured.

#### Android Upload Issues
Android users may experience upload failures due to platform-specific differences in file handling. The app now includes Android-specific upload logic that:
- Uses ArrayBuffer for file data on Android
- Provides detailed error logging with platform information
- Handles network request failures gracefully
- Validates files before upload to prevent server-side errors

**Solution:**
1. Go to your Supabase dashboard
2. Follow the complete **Storage Setup** instructions above
3. Ensure BOTH the bucket creation AND RLS policy configuration are completed
4. Verify that you have created all three policies: INSERT, SELECT, and DELETE
5. Double-check that the policy expressions are entered exactly as shown

#### Storage Upload Errors
- Verify bucket RLS policies are correctly configured (see Storage Setup above)
- Check that the bucket is set to public if you need public access to images
- Ensure file size limits are appropriate (recommended: 5MB)
- Confirm that all three RLS policies (INSERT, SELECT, DELETE) are created and active

#### Authentication Issues
- Verify your Supabase URL and anonymous key in `.env`
- Check that authentication is enabled in your Supabase project
- Ensure RLS policies are properly configured

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