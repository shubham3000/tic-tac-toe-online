"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import Chat from "../components/Chat";

// CSS for pulsing animation
const pulseStyle = `
  @keyframes pulse-glow {
    0% {
      box-shadow: 0 0 20px 8px rgba(101, 200, 58, 1), inset 0 0 0 2px rgba(34, 197, 94, 1);
      transform: scale(1.15);
      background-color: rgb(163, 230, 53);
    }
    50% {
      box-shadow: 0 0 30px 12px rgba(101, 200, 58, 0.6), inset 0 0 0 2px rgba(34, 197, 94, 1);
      transform: scale(1.25);
      background-color: rgb(132, 204, 22);
    }
    100% {
      box-shadow: 0 0 20px 8px rgba(101, 200, 58, 1), inset 0 0 0 2px rgba(34, 197, 94, 1);
      transform: scale(1.15);
      background-color: rgb(163, 230, 53);
    }
  }
  
  .pulse-glow {
    animation: pulse-glow 1.2s infinite !important;
    position: relative;
    z-index: 10;
  }
`;

// Add styles to document
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.innerHTML = pulseStyle;
  document.head.appendChild(styleElement);
}

type BingoCard = {
  grid: Record<string, number>;
  marked: Record<string, boolean>;
  lastMarked?: string; // Track the last marked box position
};

type BingoGameState = {
  cards: { X: BingoCard | null; O: BingoCard | null };
  winner: "X" | "O" | null;
  players: { X: string | null; O: string | null };
  playerNames: { X: string | null; O: string | null };
  wins: { X: number; O: number };
};

// Generate a 5x5 bingo card with numbers 1-25 in random order
const generateBingoCard = (): BingoCard => {
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  const grid: Record<string, number> = {};
  const marked: Record<string, boolean> = {};

  // Shuffle and place numbers
  for (let i = 0; i < 25; i++) {
    const randomIdx = Math.floor(Math.random() * numbers.length);
    const num = numbers.splice(randomIdx, 1)[0];
    const key = `${Math.floor(i / 5)},${i % 5}`;
    grid[key] = num;
    marked[key] = false;
  }

  return { grid, marked };
};

// Convert grid to 2D array for display
const gridTo2D = (grid: Record<string, number>): number[][] => {
  const result: number[][] = [];
  for (let row = 0; row < 5; row++) {
    result[row] = [];
    for (let col = 0; col < 5; col++) {
      result[row][col] = grid[`${row},${col}`] || 0;
    }
  }
  return result;
};

// Convert marked to 2D array
const markedTo2D = (marked: Record<string, boolean>): boolean[][] => {
  const result: boolean[][] = [];
  for (let row = 0; row < 5; row++) {
    result[row] = [];
    for (let col = 0; col < 5; col++) {
      result[row][col] = marked[`${row},${col}`] || false;
    }
  }
  return result;
};

// Check for bingo (5 in a row, column, or diagonal)
const checkBingo = (marked: Record<string, boolean>): boolean => {
  const grid2D = markedTo2D(marked);

  // Check rows
  for (let i = 0; i < 5; i++) {
    if (grid2D[i].every((m) => m)) return true;
  }

  // Check columns
  for (let j = 0; j < 5; j++) {
    if (grid2D.every((row) => row[j])) return true;
  }

  // Check diagonals
  if (grid2D.every((row, i) => row[i])) return true;
  if (grid2D.every((row, i) => row[4 - i])) return true;

  return false;
};

export default function Bingo({
  gameId,
  onBack,
}: {
  gameId: string;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const [gameState, setGameState] = useState<BingoGameState>({
    cards: { X: null, O: null },
    winner: null,
    players: { X: null, O: null },
    playerNames: { X: null, O: null },
    wins: { X: 0, O: 0 },
  });

  // Load game + realtime updates
  useEffect(() => {
    const gameRef = doc(db, "gameLobbies", gameId);

    const initGame = async () => {
      const gameDoc = await getDoc(gameRef);

      if (!gameDoc.exists()) {
        const newCard = generateBingoCard();
        await setDoc(gameRef, {
          cards: { X: newCard, O: null },
          winner: null,
          players: { X: user?.uid || null, O: null },
          playerNames: { X: user?.displayName || "Player X", O: null },
          winsData: { 
            bingo: { 
              [user?.uid || "temp"]: 0
            } 
          },
          gameType: "bingo",
        });
        return;
      }

      const data = gameDoc.data();
      const currentX = data.players?.X;
      const currentO = data.players?.O;
      const nameX = data.playerNames?.X;
      const nameO = data.playerNames?.O;

      const updates: Record<string, unknown> = {};

      // Initialize cards structure if not present
      if (!data.cards) {
        updates["cards"] = { X: null, O: null };
      }
      if (data.winner === undefined) {
        updates["winner"] = null;
      }
      if (!data.wins) {
        updates["wins"] = { X: 0, O: 0 };
      }

      // Assign player and create their card
      if (!currentX && user?.uid !== currentO) {
        updates["players.X"] = user?.uid;
        updates["playerNames.X"] = user?.displayName || "Player X";
        // Always create a card for the new player
        if (!data.cards?.X) {
          const newCard = generateBingoCard();
          updates["cards.X"] = newCard;
        }
      }

      if (!currentO && user?.uid !== currentX) {
        updates["players.O"] = user?.uid;
        updates["playerNames.O"] = user?.displayName || "Player O";
        // Always create a card for the new player
        if (!data.cards?.O) {
          const newCard = generateBingoCard();
          updates["cards.O"] = newCard;
        }
      }

      // Ensure cards exist for all assigned players
      if (currentX && !data.cards?.X) {
        updates["cards.X"] = generateBingoCard();
      }
      if (currentO && !data.cards?.O) {
        updates["cards.O"] = generateBingoCard();
      }

      if (currentX && !nameX) updates["playerNames.X"] = "Player X";
      if (currentO && !nameO) updates["playerNames.O"] = "Player O";

      if (user?.uid === currentX) {
        updates["playerNames.X"] = user?.displayName || "Player X";
      }

      if (user?.uid === currentO) {
        updates["playerNames.O"] = user?.displayName || "Player O";
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(gameRef, updates);
      }
    };

    initGame();

    // Listen for realtime updates
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        const gameType = (rawData?.gameType as string) || "bingo";
        
        // Convert user ID based wins to X/O display wins
        const winsDataByUserId = rawData?.winsData?.[gameType] || {};
        const wins = {
          X: typeof winsDataByUserId[rawData?.players?.X] === "number" ? winsDataByUserId[rawData?.players?.X] : 0,
          O: typeof winsDataByUserId[rawData?.players?.O] === "number" ? winsDataByUserId[rawData?.players?.O] : 0,
        };

        const data = {
          ...rawData,
          wins,
        } as BingoGameState;

        setGameState(data);
      }
    });

    return () => unsubscribe();
  }, [user?.uid, user?.displayName, gameId]);

  // Mark number on player's card
  const markNumber = async (playerKey: "X" | "O", row: number, col: number) => {
    if (gameState.winner) return;
    if (!gameState.cards[playerKey]) return;

    const key = `${row},${col}`;
    const updatedMarked = { ...gameState.cards[playerKey]!.marked };
    updatedMarked[key] = !updatedMarked[key];

    // Check if bingo
    if (checkBingo(updatedMarked) && !gameState.winner) {
      const gameRef = doc(db, "gameLobbies", gameId);
      const winnerUserId = gameState.players[playerKey];
      await updateDoc(gameRef, {
        winner: playerKey,
        [`winsData.bingo.${winnerUserId}`]: gameState.wins[playerKey] + 1,
        [`cards.${playerKey}.lastMarked`]: key,
      });
    } else {
      const gameRef = doc(db, "gameLobbies", gameId);
      await updateDoc(gameRef, {
        [`cards.${playerKey}.marked`]: updatedMarked,
        [`cards.${playerKey}.lastMarked`]: key,
      });
    }
  };

  const resetGame = async () => {
    const gameRef = doc(db, "gameLobbies", gameId);
    await updateDoc(gameRef, {
      cards: {
        X: gameState.cards.X ? generateBingoCard() : null,
        O: gameState.cards.O ? generateBingoCard() : null,
      },
      winner: null,
    });
  };

  const playerCard = (playerKey: "X" | "O") => {
    // Safety check for undefined gameState.cards
    if (!gameState.cards || !gameState.cards[playerKey]) {
      return null;
    }
    
    const card = gameState.cards[playerKey];
    if (!card) return null;

    // Check if this card belongs to current user
    const isCurrentUser = gameState.players[playerKey] === user?.uid;

    // If there's a winner, reveal all cards
    const shouldShowCard = isCurrentUser || gameState.winner;

    // If it's not current user's card and no winner, show a hidden card placeholder
    if (!shouldShowCard) {
      return (
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-bold mb-2 text-gray-800">
            {gameState.playerNames[playerKey]}
          </h3>
          <div className="bg-linear-to-br from-purple-500 to-purple-700 p-4 rounded-lg border-2 border-purple-800 w-80 h-80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white text-4xl font-bold mb-2">🔒</p>
              <p className="text-white font-semibold">Opponent&apos;s Card</p>
              <p className="text-purple-100 text-sm mt-2">Hidden from your view</p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <div className="text-sm font-semibold text-gray-700">Wins: {gameState.wins[playerKey]}</div>
          </div>
        </div>
      );
    }

    const grid2D = gridTo2D(card.grid);
    const marked2D = markedTo2D(card.marked);
    const isWinner = gameState.winner === playerKey;
    const lastMarkedKey = card.lastMarked;

    return (
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-bold mb-2 text-gray-800">
          {gameState.playerNames[playerKey]} {isCurrentUser && !gameState.winner ? "(Your Card)" : ""} {isWinner && gameState.winner ? "✨ (Winner)" : ""}
        </h3>
        <div className={`p-4 rounded-lg border-2 ${isWinner && gameState.winner ? "bg-yellow-50 border-yellow-400" : "bg-white border-gray-300"}`}>
          {grid2D.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1 mb-1">
              {row.map((num, colIdx) => {
                const cellKey = `${rowIdx},${colIdx}`;
                // Show last marked with highlight (this will be the winning box)
                const isLastMarked = lastMarkedKey === cellKey && gameState.winner === playerKey;
                const isWinningBox = isLastMarked && marked2D[rowIdx][colIdx];
                
                return (
                  <button
                    key={cellKey}
                    onClick={() => isCurrentUser && markNumber(playerKey, rowIdx, colIdx)}
                    disabled={!isCurrentUser}
                    className={`w-14 h-14 font-bold text-center rounded-lg transition-all text-sm ${
                      isWinningBox
                        ? "bg-lime-300 text-black scale-110 ring-4 ring-lime-500 shadow-2xl pulse-glow border-2 border-lime-600"
                        : marked2D[rowIdx][colIdx]
                        ? "bg-green-500 text-white scale-105"
                        : "bg-blue-100 text-blue-900 hover:bg-blue-200"
                    } ${!isCurrentUser ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 text-center">
          <div className="text-sm font-semibold text-gray-700">Wins: {gameState.wins[playerKey]}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-orange-500 to-pink-500 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🎲 Bingo Game (1-25)</h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Lobby
          </button>
        </div>

        {/* Game ID */}
        <div className="mb-6 flex items-center justify-center gap-3 bg-gray-100 p-4 rounded-lg">
          <span className="text-gray-700 font-semibold">Game ID: <span className="text-blue-600 font-bold">{gameId}</span></span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(gameId);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 font-semibold"
          >
            {copied ? "✓ Copied!" : "Copy ID"}
          </button>
        </div>

        {/* Game Rules Info */}
        <div className="mb-6 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
          <p className="text-sm text-gray-700">
            <strong>How to Play:</strong> Click numbers on your card to mark them. Win by completing a full row, column, or diagonal!
          </p>
        </div>

        {/* Player Cards */}
        {gameState.cards?.X && gameState.cards?.O ? (
          <div className="grid grid-cols-2 gap-8 mb-8">
            {playerCard("X")}
            {playerCard("O")}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600 bg-gray-50 rounded-lg mb-8">
            <p className="text-lg font-semibold mb-2">⏳ Loading Game...</p>
            <p className="text-sm">Initializing bingo cards for both players...</p>
            <div className="mt-4 text-xs text-gray-500">
              <p>Cards X: {gameState.cards?.X ? "✓ Ready" : "⏳ Loading"}</p>
              <p>Cards O: {gameState.cards?.O ? "✓ Ready" : "⏳ Loading"}</p>
            </div>
          </div>
        )}

        {/* Winner Display */}
        {gameState.winner && (
          <>
            <div className="mb-6 p-6 bg-linear-to-r from-green-100 to-green-50 border-2 border-green-500 rounded-lg text-center">
              <h2 className="text-3xl font-bold text-green-700 mb-2">
                🎉 {gameState.playerNames[gameState.winner]} Wins! 🎉
              </h2>
              <p className="text-green-600 mb-4">
                Total Wins: <span className="text-2xl font-bold">{gameState.wins[gameState.winner]}</span>
              </p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg"
              >
                Play Again
              </button>
            </div>

            {/* Reveal Both Cards */}
            <div className="mb-6 bg-blue-50 p-6 rounded-lg border-2 border-blue-400">
              <h3 className="text-xl font-bold text-blue-800 mb-4 text-center">📋 Final Cards - Game Verification</h3>
              <div className="grid grid-cols-2 gap-8">
                {playerCard("X")}
                {playerCard("O")}
              </div>
            </div>
          </>
        )}

        {/* Chat */}
        <Chat gameId={gameId} />
      </div>
    </div>
  );
}
