# Kribb 🏠

A real estate mobile app built with [Expo](https://expo.dev), [Clerk](https://clerk.com) for authentication, and [Supabase](https://supabase.com) as the backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo (SDK 57) + Expo Router |
| Language | TypeScript |
| Auth | Clerk |
| Backend / DB | Supabase |
| Styling | NativeWind (Tailwind CSS) |
| State | Zustand |

---

## Prerequisites

Make sure the following are installed before you begin:

- **Node.js** v18 or later — [nodejs.org](https://nodejs.org)
- **npm** v9 or later (comes with Node.js)
- **Expo CLI** — comes with the project, no global install needed
- **Expo Go** app on your physical device (iOS / Android) **or** a simulator/emulator

---

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd kribb
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

This project uses `.env.local` for local secrets (Expo reads both `.env` and `.env.local`). A blank template is already provided at [`.env.local`](.env.local) — just fill in your values:

```env
# Clerk — see Step 4 below
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Supabase — see Step 5 below
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<your-supabase-anon-key>
EXPO_PUBLIC_SUPABASE_PASSWORD=<your-supabase-db-password>
```

> **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## 4. Set Up Clerk (Authentication)

### 4a. Create a Clerk Account & Application

1. Go to [clerk.com](https://clerk.com) and sign up / log in
2. Click **Create application**
3. Give it a name (e.g. `Kribb`) and enable **Email** as a sign-in method
4. Click **Create application**

### 4b. Get your Publishable Key

1. In the Clerk dashboard go to **API Keys**
2. Copy the **Publishable key** (starts with `pk_test_` for development)
3. Paste it into `.env`:
   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

### 4c. Configure JWT Template for Supabase

This app authenticates Supabase requests using Clerk JWTs. You need to create a JWT template so Supabase can verify Clerk tokens:

1. In the Clerk dashboard go to **Configure → JWT Templates**
2. Click **New template** → choose **Supabase**
3. Copy the **JWKS Endpoint** URL shown on the template page (you'll need it in Supabase)
4. Set the token **Lifetime** to `3600` seconds
5. Click **Save**

### 4d. Add the Clerk JWKS to Supabase

1. Go to your Supabase project → **Project Settings → Auth → JWT Settings**
2. Under **Third-party auth providers**, click **Add provider**
3. Choose **Clerk** and paste the JWKS URL from the previous step
4. Click **Save**

> After this, Supabase RLS policies can use `auth.jwt()->>'sub'` to match the Clerk user ID (`clerk_id`).

---


### Create a Supabase Account & Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **New Project**, give it a name (e.g. `kribb`) and set a **database password** — save this, it maps to `EXPO_PUBLIC_SUPABASE_PASSWORD` in your `.env`
3. Wait for the project to finish provisioning (~1 min)
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `EXPO_PUBLIC_SUPABASE_KEY`


### Supabase Queries

### User Table

```sql
create table users (
  id uuid default gen_random_uuid() primary key,
  clerk_id text unique not null,
  email text not null,
  first_name text,
  last_name text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamp with time zone default now()
);
```

### User RLS Policies

```sql
-- Enable RLS on users table
alter table users enable row level security;

create policy "Users can insert own row"
on users for insert
with check (clerk_id = auth.jwt()->>'sub');

create policy "Users can read own row"
on users for select
using (clerk_id = auth.jwt()->>'sub');

create policy "Users can update own row"
on users for update
using (clerk_id = auth.jwt()->>'sub');
```

### Properties Table

```sql
create table properties (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  price numeric not null,
  type text not null, -- 'apartment' | 'house' | 'villa' | 'studio'
  bedrooms int not null default 1,
  bathrooms int not null default 1,
  area_sqft int,
  address text not null,
  city text not null,
  latitude float,
  longitude float,
  images text[] default '{}', -- array of Supabase Storage URLs
  is_featured boolean default false,
  is_sold boolean default false,
  created_at timestamp with time zone default now()
);

alter table properties enable row level security;

-- Anyone can read properties (public listings)
create policy "Properties are publicly readable"
on properties for select
using (true);
```

### Saved Property Table

```sql
create table saved_properties (
  id uuid default gen_random_uuid() primary key,
  user_clerk_id text not null references users(clerk_id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_clerk_id, property_id) -- prevents duplicate saves
);

alter table saved_properties enable row level security;

create policy "Users can read own saved properties"
on saved_properties for select
using (user_clerk_id = auth.jwt()->>'sub');

create policy "Users can insert saved properties"
on saved_properties for insert
with check (user_clerk_id = auth.jwt()->>'sub');

create policy "Users can delete own saved properties"
on saved_properties for delete
using (user_clerk_id = auth.jwt()->>'sub');

```

### Insert Public Property Image Bucket

```sql
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true);

-- Allow anyone to read images (they're public listings)
create policy "Public can read property images"
on storage.objects for select
using (bucket_id = 'property-images');
```

### Admin Flag and Properties RLS Policies

```sql
alter table users 
add column is_admin boolean default false;

create policy "Admin can insert properties"
on properties for insert
with check (
  exists (
    select 1 from users
    where clerk_id = auth.jwt()->>'sub'
    and is_admin = true
  )
);

create policy "Admin can update properties"
on properties for update
using (
  exists (
    select 1 from users
    where clerk_id = auth.jwt()->>'sub'
    and is_admin = true
  )
);

create policy "Admin can delete properties"
on properties for delete
using (
  exists (
    select 1 from users
    where clerk_id = auth.jwt()->>'sub'
    and is_admin = true
  )
);

create policy "Admin can upload property images"
on storage.objects for insert
with check (
  bucket_id = 'property-images'
  and exists (
    select 1 from users
    where clerk_id = auth.jwt()->>'sub'
    and is_admin = true
  )
);
```

### Seeding Properties

```sql
insert into properties (
  title, description, price, type, bedrooms, bathrooms,
  area_sqft, address, city, latitude, longitude, images, is_featured
) values

-- Featured Properties
(
  'Modern Luxury Villa',
  'A stunning modern villa with open floor plan, floor-to-ceiling windows, and a private pool. Perfect for families looking for premium living.',
  12500000,
  'villa',
  4, 3, 3200,
  '14 Palm Grove Lane',
  'Mumbai',
  19.1136, 72.8697,
  ARRAY[
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
    'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800',
    'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800'
  ],
  true
),
(
  'Sky View Penthouse',
  'Breathtaking penthouse on the 32nd floor with panoramic city views, private terrace, and top-of-the-line finishes throughout.',
  28000000,
  'apartment',
  3, 2, 2800,
  '1 Skyline Tower, BKC',
  'Mumbai',
  19.0596, 72.8656,
  ARRAY[
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800'
  ],
  true
),
(
  'Green Valley Bungalow',
  'Spacious bungalow surrounded by lush greenery with a large garden, modern kitchen, and serene neighborhood.',
  8500000,
  'house',
  5, 4, 4500,
  '7 Green Valley Road',
  'Bangalore',
  12.9716, 77.5946,
  ARRAY[
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
  ],
  true
),
(
  'Downtown Studio Loft',
  'Chic studio loft in the heart of the city. Perfect for young professionals. Walking distance to metro, cafes, and offices.',
  3200000,
  'studio',
  1, 1, 650,
  '22 MG Road',
  'Bangalore',
  12.9756, 77.6097,
  ARRAY[
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800'
  ],
  true
),

-- Regular Properties
(
  'Cozy 2BHK Apartment',
  'Well-maintained apartment in a gated society with gym, clubhouse, and 24/7 security. Great connectivity to IT hubs.',
  5500000,
  'apartment',
  2, 2, 1100,
  '45 Whitefield Main Road',
  'Bangalore',
  12.9698, 77.7499,
  ARRAY[
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
  ],
  false
),
(
  'Sea Facing 3BHK',
  'Premium sea-facing apartment with stunning Arabian Sea views, spacious balcony, modular kitchen, and covered parking.',
  18500000,
  'apartment',
  3, 2, 1800,
  '9 Marine Drive',
  'Mumbai',
  18.9438, 72.8235,
  ARRAY[
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800'
  ],
  false
),
(
  'Heritage Row House',
  'Beautifully restored heritage row house with original architecture, courtyard, and modern interiors. Rare find in old city.',
  9200000,
  'house',
  4, 3, 2800,
  '3 Civil Lines',
  'Delhi',
  28.6862, 77.2217,
  ARRAY[
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
  ],
  false
),
(
  'Golf Course Villa',
  'Luxurious villa overlooking the golf course with private pool, landscaped garden, and world-class amenities.',
  45000000,
  'villa',
  5, 5, 6000,
  '1 Golf Course Road',
  'Gurugram',
  28.4595, 77.0266,
  ARRAY[
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
  ],
  false
),
(
  'Smart Studio Apartment',
  'Fully furnished smart studio with automated lighting, AC, and security. Ideal for bachelors and working professionals.',
  2800000,
  'studio',
  1, 1, 500,
  '18 Cyber City',
  'Gurugram',
  28.4943, 77.0880,
  ARRAY[
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800'
  ],
  false
),
(
  'Lake View Cottage',
  'Peaceful 3-bedroom cottage with direct lake view, private garden, and a cozy fireplace. Perfect for a quiet family life.',
  6800000,
  'house',
  3, 2, 1900,
  '5 Lake Shore Drive',
  'Pune',
  18.5204, 73.8567,
  ARRAY[
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800',
    'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800'
  ],
  false
),
(
  'IT Corridor Flat',
  'Affordable 2BHK in a prime IT corridor location. Walking distance to major tech parks, metro station, and shopping mall.',
  4200000,
  'apartment',
  2, 1, 950,
  '67 HITEC City',
  'Hyderabad',
  17.4474, 78.3762,
  ARRAY[
    'https://images.unsplash.com/photo-1560185008-b033106af5c3?w=800',
    'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800'
  ],
  false
),
(
  'Old City Haveli',
  'Majestic haveli with stunning Mughal-inspired architecture, rooftop terrace with city views, and 6 large bedrooms.',
  15000000,
  'villa',
  6, 4, 5200,
  '12 Charminar Road',
  'Hyderabad',
  17.3616, 78.4747,
  ARRAY[
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
    'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800'
  ],
  false
);
```
---

## 5. Start the Development Server

```bash
npx expo start
```

The Metro bundler will start and display a QR code in the terminal.

---

## 6. Open the App

Choose one of the following:

### 📱 Physical Device (Expo Go)
1. Install **Expo Go** from the [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Scan the QR code shown in the terminal with your camera (iOS) or the Expo Go app (Android)

### 🤖 Android Emulator
```bash
npx expo start --android
```
> Requires Android Studio with a configured AVD (Android Virtual Device).

### 🍎 iOS Simulator *(macOS only)*
```bash
npx expo start --ios
```
> Requires Xcode to be installed.

---

## 7. Available Scripts

| Command | Description |
|---|---|
| `npx expo start` | Start the dev server |
| `npx expo start --android` | Start and open on Android |
| `npx expo start --ios` | Start and open on iOS |
| `npx expo lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check without emitting |
| `npx expo-doctor` | Diagnose dependency/config issues |
| `npx expo install --fix` | Fix incompatible package versions |

---

## Project Structure

```
kribb/
├── app/                  # Expo Router file-based routes
│   ├── _layout.tsx       # Root layout (ClerkProvider)
│   └── (root)/
│       ├── _layout.tsx   # Syncs Clerk user to Supabase
│       ├── (auth)/       # Public routes (sign-in, sign-up)
│       └── (tabs)/       # Protected routes (home, search, saved, profile)
├── components/           # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Supabase client and utilities
├── store/                # Zustand global state
├── types/                # TypeScript type definitions
├── assets/               # Images, fonts
├── app.json              # Expo app config
└── tailwind.config.js    # NativeWind / Tailwind config
```

---

## Notes

- This app uses **Expo's Continuous Native Generation** — the `ios/` and `android/` directories are not committed. Do not create or edit them manually; configure native behaviour via `app.json` and config plugins.
- After adding a library with native code, you need a **development build**: run `npx expo run:ios` or `npx expo run:android` locally, or use [EAS Build](https://docs.expo.dev/eas/).
- To build for production: `npx eas-cli@latest build`.
