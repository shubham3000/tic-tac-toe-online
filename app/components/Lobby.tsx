"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import { collection, addDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import Game from "./Game";
import Bingo from "./Bingo";

export default function Lobby() {
  const { user, logout } = useAuth();
  const [gameId, setGameId] = useState<string | null>(null);
  const [joinGameId, setJoinGameId] = useState<string>("");
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [activeGameType, setActiveGameType] = useState<"tictactoe" | "bingo" | null>(null);
  const [copied, setCopied] = useState(false);

  // Listen to game lobby for game type selection
  useEffect(() => {
    if (!gameId) return;

    const lobbyRef = doc(db, "gameLobbies", gameId);
    const unsubscribe = onSnapshot(lobbyRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        
        // If game type was selected, switch to that game
        if (data.gameType) {
          setActiveGame(gameId);
          setActiveGameType(data.gameType);
        }
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  // Create a new game lobby (only GameID creation)
  const createNewGameId = async () => {
    try {
      const lobbyRef = await addDoc(collection(db, "gameLobbies"), {
        createdBy: user?.uid,
        createdByName: user?.displayName,
        createdAt: new Date(),
        gameType: null, // Will be set when user selects a game
        players: { X: user?.uid, O: null },
        playerNames: { X: user?.displayName, O: null },
      });
      setGameId(lobbyRef.id);
    } catch (error) {
      console.error("Error creating game ID:", error);
    }
  };

  // Join existing game using GameID
  const joinExistingGame = async () => {
    if (!joinGameId.trim()) return;
    
    try {
      const lobbyRef = doc(db, "gameLobbies", joinGameId.trim());
      await updateDoc(lobbyRef, {
        [`players.O`]: user?.uid,
        [`playerNames.O`]: user?.displayName,
      });
      setGameId(joinGameId.trim());
      setJoinGameId("");
    } catch (error) {
      console.error("Error joining game:", error);
      alert("Invalid Game ID or game not found");
    }
  };

  // Select game type and update lobby
  const selectGameType = async (gameType: "tictactoe" | "bingo") => {
    if (!gameId) return;
    
    try {
      const lobbyRef = doc(db, "gameLobbies", gameId);
      await updateDoc(lobbyRef, {
        gameType: gameType,
      });
      
      // The listener will automatically switch to the game
      setActiveGame(gameId);
      setActiveGameType(gameType);
    } catch (error) {
      console.error("Error selecting game:", error);
    }
  };

  if (activeGame && activeGameType === "tictactoe") {
    return <Game gameId={activeGame} onBack={() => {
      setActiveGame(null);
      setActiveGameType(null);
    }} />;;
  }

  if (activeGame && activeGameType === "bingo") {
    return <Bingo gameId={activeGame} onBack={() => {
      setActiveGame(null);
      setActiveGameType(null);
    }} />;;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-purple-600 to-blue-500 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl">
        
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

        {/* Step 1: Create Game ID or Join */}
        {!gameId ? (
          <>
            {/* Create New Game */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">🎮 Create New Game</h2>
              <button
                onClick={createNewGameId}
                className="w-full py-4 bg-linear-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:shadow-xl transition-all text-lg"
              >
                Generate Game ID
              </button>
              <p className="text-gray-600 text-center mt-2">Click to create a unique game ID to play with a friend</p>
            </div>

            <div className="border-t my-6 flex items-center">
              <span className="flex-1 border-t border-gray-300"></span>
              <span className="px-4 text-gray-500 font-semibold">OR</span>
              <span className="flex-1 border-t border-gray-300"></span>
            </div>

            {/* Join Existing Game */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📥 Join Existing Game</h2>
              <div className="flex flex-col space-y-3">
                <input
                  type="text"
                  value={joinGameId}
                  onChange={(e) => setJoinGameId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && joinExistingGame()}
                  placeholder="Enter Game ID to join"
                  className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={joinExistingGame}
                  className="w-full py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:shadow-xl transition-all"
                >
                  Join Game
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Step 2: Game ID Created - Show Game Selection */}
            <div className="mb-8 bg-green-100 p-4 rounded-lg border-2 border-green-500">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-gray-700 font-semibold">✅ Game ID: {gameId}</p>
                  <p className="text-gray-600 text-sm mt-1">Share this ID with your opponent to join</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(gameId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold whitespace-nowrap"
                >
                  {copied ? "✓ Copied!" : "Copy ID"}
                </button>
              </div>
            </div>

            {/* Game Selection Cards */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Select Game Type</h2>
              <p className="text-gray-600 text-sm mb-4">When you select a game, your opponent will automatically join the same game</p>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Tic Tac Toe Card */}
                <div
                  className="bg-linear-to-br from-blue-400 to-blue-600 rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-2xl hover:scale-105 transition-all"
                  onClick={() => selectGameType("tictactoe")}
                >
                  <div className="h-32 flex items-center justify-center mb-4">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="w-6 h-6 bg-white rounded"></div>
                      <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-blue-600 font-bold text-xs">X</div>
                      <div className="w-6 h-6 bg-white rounded"></div>
                      <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-blue-600 font-bold text-xs">O</div>
                      <div className="w-6 h-6 bg-white rounded"></div>
                      <div className="w-6 h-6 bg-white rounded"></div>
                      <div className="w-6 h-6 bg-white rounded"></div>
                      <div className="w-6 h-6 bg-white rounded"></div>
                      <div className="w-6 h-6 bg-white rounded"></div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white text-center">Tic Tac Toe</h3>
                  <p className="text-blue-100 text-center mt-2">Classic 3x3 game</p>
                </div>

                {/* Bingo Card */}
                <div
                  className="bg-linear-to-br from-orange-400 to-pink-600 rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-2xl hover:scale-105 transition-all"
                  onClick={() => selectGameType("bingo")}
                >
                  <div className="h-32 flex items-center justify-center mb-4">
                    <div className="grid grid-cols-5 gap-1">
                      {[1, 2, 3, 4, 5, 16, 17, 18, 19, 20, 31, 32, 33, 34, 35, 46, 47, 48, 49, 50, 61, 62, 63, 64, 65].map((num) => (
                        <div key={num} className="w-4 h-4 bg-white rounded text-xs flex items-center justify-center font-bold text-orange-600"></div>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white text-center">Bingo (5x5)</h3>
                  <p className="text-orange-100 text-center mt-2">5x5 number matching game</p>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="border-t pt-4">
              <button
                onClick={() => {
                  setGameId(null);
                }}
                className="w-full py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back to Main Menu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
