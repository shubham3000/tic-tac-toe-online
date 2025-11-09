# 🎮 Tic-Tac-Toe Multiplayer (Next.js + Firebase + Firestore)

A real-time, online multiplayer **Tic-Tac-Toe** game featuring:

✅ Next.js 16 (App Router)  
✅ Firebase Authentication  
✅ Firestore Realtime Sync  
✅ Player Chat  
✅ Starting Player Selection  
✅ Swap Starter After Round  
✅ Clean UI with TailwindCSS  

Two players join the same game using a **Game ID**. Every move and chat message updates instantly using Firestore listeners.

---

## 🚀 Features

### 🔥 Real-Time Multiplayer
- Firestore `onSnapshot` keeps both players perfectly in sync.

### 👥 Player Assignment
- Player **X** = Game creator  
- Player **O** = Joiner  
- Auto-assigns upon joining a game

### 🎙️ In-Game Chat
- Real-time text messaging  
- Emoji & text only  
- No files, images, or links allowed  
- Auto-scroll to latest messages  

### 🧠 Game Logic
- Full winner detection  
- Draw detection  
- Turn switching  
- Prevents invalid or out-of-turn moves  

### 🔄 Reset & Swap Starter
- After each round:
  - Choose **who starts next round (X or O)**  
  - Board resets with selected starter  
- You can also pick who starts **before** creating a game in the lobby

### 🔐 Authentication (Firebase)
- Login & logout  
- Uses Firebase Auth for secure identity  

### 📱 UI/UX Improvements
- Responsive layout  
- Smooth navigation  
- Copy Game ID button  
- "Back to Lobby" without losing session  

---

## 📁 Project Structure

```
TIC_TAC_TOE/
│
├── app/
│ ├── components/
│ │ ├── Game.tsx # Main game board logic
│ │ ├── Lobby.tsx # Join/Create game UI
│ │ ├── Chat.tsx # Real-time chat component
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
| **Next.js 16** | Core framework |
| **React** | UI components |
| **Firebase Auth** | Authentication |
| **Firestore** | Real-time game + chat |
| **TailwindCSS** | Styling |
| **TypeScript** | Type saftey |

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

## 💲 Update .env file with your firebase config

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

1️⃣ Login

Firebase Authentication is required.

2️⃣ Enter the Lobby

Choose:

Create Game

Join Game using an ID

3️⃣ Choose Who Starts

Before creating a game you can pick:

Player X

Player O

4️⃣ Share Game ID

Your friend joins using the same ID.

5️⃣ Play in Real Time

Both boards sync instantly.

6️⃣ Chat System

Send text messages while playing.

7️⃣ End of Round

After a win or draw:

Choose who starts next round (X or O)

Board resets instantly

8️⃣ Return to Lobby

Use the Back button anytime.