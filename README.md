# 🎮 Multiplayer Games Platform (Next.js + Firebase + Firestore)

A real-time, online multiplayer gaming platform featuring **Tic-Tac-Toe** and **Bingo** games with:

✅ Next.js 16 (App Router)  
✅ Firebase Authentication  
✅ Firestore Realtime Sync  
✅ Multiple Game Types (Tic-Tac-Toe & Bingo)  
✅ Player Chat  
✅ Starting Player Selection  
✅ Swap Starter After Round  
✅ Independent Win Tracking Per Game  
✅ Clean UI with TailwindCSS  

Two players join the same game using a **Game ID**. Every move and chat message updates instantly using Firestore listeners.

---

## 🚀 Features

### 🎯 Multiple Game Types
- **Tic-Tac-Toe**: Classic 3x3 board game
- **Bingo**: 5x5 card with numbers 1-25 (rows, columns, diagonals)

### 🔥 Real-Time Multiplayer
- Firestore `onSnapshot` keeps both players perfectly in sync.
- Instant board updates across all clients

### 👥 Player Assignment
- First player to join becomes **X** (or first player in Bingo)
- Second player becomes **O**  
- Auto-assigns upon joining a game

### 🎙️ In-Game Chat
- Real-time text messaging  
- Emoji & text support  
- Auto-scroll to latest messages  

### 🧠 Game Logic

**Tic-Tac-Toe:**
- Full winner detection (rows, columns, diagonals)
- Draw detection  
- Turn switching  
- Prevents invalid or out-of-turn moves  

**Bingo:**
- 5x5 random number cards (1-25)
- Click to mark numbers
- Win detection (complete rows, columns, diagonals)
- Opponent cards hidden until game ends
- Winning box highlighted with pulsing animation

### 🏆 Independent Win Tracking
- **Each game session** has its own isolated win counter
- **Wins are tied to players** (by user ID), not positions
- When players swap positions, their wins stay with them
- Bingo and Tic-Tac-Toe wins are tracked separately

### 🔄 Reset & Swap Starter
- After each round:
  - Choose **who starts next round (X or O)**  
  - Board resets with selected starter  
- Wins remain with each player regardless of position swap
- You can also pick who starts **before** creating a game in the lobby

### 🔐 Authentication (Firebase)
- Login & logout  
- Uses Firebase Auth for secure identity  

### 📱 UI/UX Improvements
- Responsive layout  
- Smooth navigation  
- Copy Game ID button  
- "Back to Lobby" without losing session
- Loading states for game initialization
- Visual feedback for game actions

---

## 📁 Project Structure

```
TIC_TAC_TOE/
│
├── app/
│ ├── components/
│ │ ├── Game.tsx       # Tic-Tac-Toe game board logic
│ │ ├── Bingo.tsx      # Bingo game board logic
│ │ ├── Lobby.tsx      # Join/Create game UI
│ │ ├── Chat.tsx       # Real-time chat component
│ │ ├── LoginScreen.tsx # Login page
│ │ └── [others].tsx
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
│ └── stickers/ # Game assets
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

### 1️⃣ Login
Firebase Authentication is required.

### 2️⃣ Enter the Lobby
Choose one of the available games:
- **Tic-Tac-Toe** - Classic 3x3 grid
- **Bingo** - 5x5 number card

Then:
- **Create Game** - Start a new game session
- **Join Game** - Enter an existing Game ID

### 3️⃣ Choose Who Starts (Tic-Tac-Toe only)
Before creating a game, select:
- **Player X** (starts first)
- **Player O**

### 4️⃣ Share Game ID
Your friend joins using the same ID and game type.

### 5️⃣ Play in Real Time

**Tic-Tac-Toe:**
- Click empty cells to place your mark
- Complete 3 in a row, column, or diagonal to win

**Bingo:**
- Click numbers on your card to mark them
- Complete a row, column, or diagonal to win
- Opponent's card is hidden until game ends

### 6️⃣ Chat System
Send text messages while playing - all updates sync in real-time.

### 7️⃣ End of Round
After a win or draw:
- Choose who starts next round (X or O)
- Board resets instantly
- Your win count updates (tied to your user, not position)

### 8️⃣ Return to Lobby
Use the **Back to Lobby** button anytime to find a new game.