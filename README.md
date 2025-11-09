# 🎮 Tic-Tac-Toe Multiplayer (Next.js + Firebase + Firestore)

A real-time, online multiplayer **Tic-Tac-Toe** game built using:

✅ Next.js 14 (App Router)  
✅ Firebase Authentication  
✅ Firestore Realtime Sync  
✅ React Hooks  
✅ TailwindCSS + DaisyUI  

Two players join the same game using a **Game ID**, and every move updates instantly.

---

## 🚀 Features

### 🔥 Real-Time Game Play
- Firestore `onSnapshot` keeps boards in sync instantly.

### 👥 Multiplayer Support
- First player becomes **X**.
- Second player joins as **O**.

### 🧠 Game Logic
- Winner detection  
- Draw handling  
- Prevent invalid moves  
- Turn switching  

### 🔄 Reset Game
- After a match ends, a **Reset Game** button appears.

### 🔐 Authentication
- Firebase Auth uniquely identifies each player.

---

## 📁 Project Structure

```
TIC_TAC_TOE/
│
├── app/
│ ├── components/
│ │ ├── Game.tsx # Main game board logic
│ │ ├── Lobby.tsx # Join/Create game UI
│ │ └── LoginScreen.tsx # Login page
│ │
│ ├── globals.css
│ ├── layout.tsx
│ └── page.tsx # Landing/home page
│
├── lib/
│ ├── firebase.ts # Firebase setup
│ └── auth.tsx # Auth context + hooks
│
├── public/
│ └── favicon.ico
│
├── .env.local
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

| Tool | Usage |
|------|--------|
| **Next.js 14** | Core framework |
| **React** | UI components |
| **Firebase Auth** | User login |
| **Firestore** | Real-time database |
| **TailwindCSS** | Styles |
| **DaisyUI** | UI components |
| **TypeScript** | Types |

---

## 🔧 Installation

### 1️⃣ Clone the repo
```bash
git clone https://github.com/shubham3000/tic-tac-toe-online.git
cd tic-tac-toe-online
npm install
npm run dev
```

---

## 🔧 Update .env file with your firebase config

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASEURL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

---
## 🎮 How to Play

Login (Firebase).

Go to Lobby.

Create or join a game using Game ID.

Player X = creator
Player O = joiner

Play turns in real-time.

When someone wins or it's a draw → Reset Game.