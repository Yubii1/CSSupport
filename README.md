# CSSupport 📱

CSSupport is a cross-platform mobile support ticketing app built for IT departments and user support teams. The app enables users to submit issue reports and track their resolution progress, while team leads and IT staff can view, assign, and manage support tickets.

---

## ✨ Features

- 📋 Submit and track IT support requests
- 👤 Role-based access (Users, Team Leads)
- 🔔 Real-time announcements for teams
- 📈 Monthly reporting features (e.g., via Excel uploads)
- 🔐 Secure authentication
- 📱 Mobile-first UI with Expo and React Native

---

## 🧰 Tech Stack

| Layer            | Technology                          |
|------------------|--------------------------------------|
| Frontend         | React Native + Expo + TypeScript     |
| Backend          | Supabase (Auth, DB, Storage, Functions) |
| Routing          | Expo Router (File-based navigation)  |
| State Management | React Context API                    |
| Storage          | Supabase File Storage (e.g., uploads)|
| Dev Tools        | Git, GitHub, ESLint, Prettier        |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone git@github.com:Yubii1/CSSupport.git
cd CSSupport
2. Install dependencies
bash
Copy code
npm install
3. Start the development server
bash
Copy code
npx expo start
Make sure you have the Expo Go app installed on your mobile device.

📁 Folder Structure
bash
Copy code
CSSupport/
├── app/              # All screens and routes
├── components/       # Reusable UI components
├── lib/              # Supabase client and utilities
├── assets/           # Fonts, images, etc.
├── .expo/            # Expo-specific configs
└── .gitignore
⚙️ Available Scripts
Script Purpose
npm run lint Run ESLint
npm run reset-project Reset project and clean app dir
npx expo start Start local dev server

📦 Supabase Setup
Create a Supabase project at https://supabase.com

Copy your SUPABASE_URL and SUPABASE_ANON_KEY into a .env file:

ini
Copy code
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here
📚 Learn More
React Native

Expo Documentation

Supabase Docs

Expo Router

🧑‍💻 Author
Ubong Smartz
GitHub: @Yubii1

📝 License
MIT — Feel free to use, fork, and improve the app
