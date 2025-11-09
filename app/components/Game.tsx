"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";

type Player = "X" | "O" | null;

type GameState = {
  board: Player[];
  currentPlayer: Player;
  winner: Player | "draw" | null;
  players: {
    X: string | null;
    O: string | null;
  };
  wins: {
    X: number;
    O: number;
  };
};

export default function Game({ gameId }: { gameId: string }) {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
    players: { X: null, O: null },
    wins: { X: 0, O: 0 },
  });

  useEffect(() => {
    const gameRef = doc(db, "games", gameId);

    // Initialize game if empty
    const initGame = async () => {
      const gameDoc = await getDoc(gameRef);

      if (!gameDoc.exists()) {
        await setDoc(gameRef, {
          board: Array(9).fill(null),
          currentPlayer: "X",
          winner: null,
          players: { X: user?.uid || null, O: null },
          wins: { X: 0, O: 0 },
        });
      } else {
        const data = gameDoc.data();

        // Join as O if empty and you are not X
        if (!data.players.O && user?.uid !== data.players.X) {
          await updateDoc(gameRef, {
            "players.O": user?.uid || null,
          });
        }
      }
    };

    initGame();

    // Subscribe to Firestore
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameState;

        setGameState({
          ...data,
          wins: data.wins || { X: 0, O: 0 },
        });
      }
    });

    return () => unsubscribe();
  }, [gameId, user]);

  const checkWinner = (board: Player[]): Player | "draw" | null => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    if (board.every((cell) => cell !== null)) return "draw";

    return null;
  };

  const copyGameId = async () => {
    await navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };


  const handleMove = async (index: number) => {
    if (!user) return;

    const playerSymbol = gameState.players.X === user.uid ? "X" : "O";

    if (
      gameState.board[index] !== null ||
      gameState.winner ||
      gameState.currentPlayer !== playerSymbol
    ) {
      return;
    }

    const newBoard = [...gameState.board];
    newBoard[index] = playerSymbol;
    const winner = checkWinner(newBoard);

    const gameRef = doc(db, "games", gameId);

    if (winner && winner !== "draw") {
      await updateDoc(gameRef, {
        board: newBoard,
        winner,
        currentPlayer: null,
        [`wins.${winner}`]: (gameState.wins?.[winner] || 0) + 1,
      });
      return;
    }

    await updateDoc(gameRef, {
      board: newBoard,
      currentPlayer: playerSymbol === "X" ? "O" : "X",
      winner,
    });
  };

  const resetGame = async () => {
    const gameRef = doc(db, "games", gameId);
    await updateDoc(gameRef, {
      board: Array(9).fill(null),
      currentPlayer: "X",
      winner: null,
    });
  };

  const getCellStyle = (value: Player) =>
    `w-20 h-20 bg-white rounded-lg shadow-md flex items-center justify-center text-4xl font-bold cursor-pointer transition-all hover:bg-gray-100
    ${value === "X" ? "text-blue-500" : "text-pink-500"}`;

  if (!gameState.players.O) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Waiting for Player 2...</h2>
        <div className="text-center">
          <p className="text-gray-600 mb-2">
            Share this Game ID:
            <span className="font-semibold ml-1">{gameId}</span>
          </p>

          <button
            onClick={copyGameId}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            Copy Game ID
          </button>

          {copied && (
            <p className="text-green-500 font-semibold mt-2 transition-opacity">
              ✅ Copied!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-linear-to-br from-purple-600 to-blue-500 p-4">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          ⬅ Back
        </button>

        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-2xl">
        {/* CURRENT TURN OR WINNER */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {gameState.winner
              ? gameState.winner === "draw"
                ? "It's a Draw!"
                : `Player ${gameState.winner} Wins!`
              : `Current Player: ${gameState.currentPlayer}`}
          </h2>
        </div>

        {/* GAME BOARD */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {gameState.board.map((value, index) => (
            <button
              key={index}
              onClick={() => handleMove(index)}
              className={getCellStyle(value)}
              disabled={!!gameState.winner}
            >
              {value}
            </button>
          ))}
        </div>

        {/* WHO YOU ARE */}
        <div className="text-center text-gray-600 mb-4">
          <p>You are Player: {user?.uid === gameState.players.X ? "X" : "O"}</p>
        </div>

        {/* WIN STATS */}
        <div className="text-center text-lg font-semibold text-gray-700 mb-4">
          <p>Player X Wins: {gameState.wins.X}</p>
          <p>Player O Wins: {gameState.wins.O}</p>
        </div>

        {/* RESET BUTTON */}
        {gameState.winner && (
          <div className="text-center mt-4">
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all"
            >
              Reset Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
