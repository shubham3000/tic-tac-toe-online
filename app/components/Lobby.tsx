"use client";

import { useState } from "react";
import { useAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import Game from "./Game";

export default function Lobby() {
  const { user, logout } = useAuth();
  const [gameId, setGameId] = useState<string>("");
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // NEW: starting player selector
  const [startingPlayer, setStartingPlayer] = useState<"X" | "O">("X");

  const createGame = async () => {
    try {
      const gameRef = await addDoc(collection(db, "games"), {
        board: Array(9).fill(null),
        currentPlayer: startingPlayer,      // ✅ starting player set here
        startingPlayer,                     // store choice
        winner: null,
        players: { X: user?.uid, O: null },
        wins: { X: 0, O: 0 },
        createdAt: new Date(),
      });

      setActiveGame(gameRef.id);
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  const joinGame = () => {
    if (gameId.trim()) {
      setActiveGame(gameId.trim());
    }
  };

  if (activeGame) {
    return <Game gameId={activeGame} onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-purple-600 to-blue-500 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {user?.displayName}
          </h1>

          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Starting Player Selector */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Who should start first?
          </label>
          <select
            value={startingPlayer}
            onChange={(e) => setStartingPlayer(e.target.value as "X" | "O")}
            className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg"
          >
            <option value="X">Player X (You)</option>
            <option value="O">Player O</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="space-y-6">

          <button
            onClick={createGame}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Create New Game
          </button>

          <div className="flex flex-col space-y-2">
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter Game ID"
              className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg"
            />

            <button
              onClick={joinGame}
              className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Join Game
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
