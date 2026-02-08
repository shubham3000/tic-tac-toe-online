"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import Chat from "../components/Chat";

type Player = "X" | "O" | null;

type GameState = {
  board: Player[];
  currentPlayer: Player;
  winner: Player | "draw" | null;
  players: { X: string | null; O: string | null };
  playerNames: { X: string | null; O: string | null };
  wins: { X: number; O: number };
  startingPlayer: "X" | "O";
  gameType?: string;
};

export default function Game({
  gameId,
  onBack,
}: {
  gameId: string;
  onBack: () => void;
}) {
  const { user, logout } = useAuth();

  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
    players: { X: null, O: null },
    playerNames: { X: null, O: null },
    wins: { X: 0, O: 0 },
    startingPlayer: "X",
  });

  // --------------------------------------------------------------
  // Load game + realtime updates
  // --------------------------------------------------------------
  useEffect(() => {
    const gameRef = doc(db, "gameLobbies", gameId);

    const initGame = async () => {
      const gameDoc = await getDoc(gameRef);

      // -----------------------------------------------
      // CASE 1 — Game does not exist → Create new
      // -----------------------------------------------
      if (!gameDoc.exists()) {
        await setDoc(gameRef, {
          board: Array(9).fill(null),
          currentPlayer: "X",
          startingPlayer: "X",
          winner: null,
          players: { X: user?.uid || null, O: null },
          playerNames: { X: user?.displayName || "Player X", O: null },
          winsData: { 
            tictactoe: { 
              [user?.uid || "temp"]: 0
            } 
          },
          gameType: "tictactoe",
        });
        return;
      }

      // -----------------------------------------------
      // CASE 2 — Game exists → sync and fix missing names
      // -----------------------------------------------
      const data = gameDoc.data();

      const currentX = data.players?.X;
      const currentO = data.players?.O;

      const nameX = data.playerNames?.X;
      const nameO = data.playerNames?.O;

      const updates: Record<string, unknown> = {};

      // Assign user to empty slot
      // Assign user to exactly ONE empty slot
      if (!currentX && !currentO) {
        updates["players.X"] = user?.uid;
        updates["playerNames.X"] = user?.displayName || "Player X";
      } else if (!currentO && user?.uid !== currentX) {
        updates["players.O"] = user?.uid;
        updates["playerNames.O"] = user?.displayName || "Player O";
      }

      // Fix missing names
      if (currentX && !nameX) updates["playerNames.X"] = "Player X";
      if (currentO && !nameO) updates["playerNames.O"] = "Player O";

      // Always keep names synced with Firebase Auth
      if (user?.uid === currentX) {
        updates["playerNames.X"] = user?.displayName || "Player X";
      }

      if (user?.uid === currentO) {
        updates["playerNames.O"] = user?.displayName || "Player O";
      }

      // Apply updates if needed
      if (Object.keys(updates).length > 0) {
        await updateDoc(gameRef, updates);
      }
    };

    initGame();

    // Live realtime updates
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const rawData = docSnap.data();
      const gameType = rawData?.gameType || "tictactoe";

      // Convert user ID based wins to X/O display wins
      const winsDataByUserId = rawData?.winsData?.[gameType] || {};
      const wins = {
        X: typeof winsDataByUserId[rawData?.players?.X] === "number" ? winsDataByUserId[rawData?.players?.X] : 0,
        O: typeof winsDataByUserId[rawData?.players?.O] === "number" ? winsDataByUserId[rawData?.players?.O] : 0,
      };

      setGameState({
        board: rawData.board ?? Array(9).fill(null),
        currentPlayer: rawData.currentPlayer ?? rawData.startingPlayer ?? "X",
        winner: rawData.winner ?? null,
        players: rawData.players ?? { X: null, O: null },
        playerNames: rawData.playerNames ?? { X: "Player X", O: "Player O" },
        wins,
        startingPlayer: rawData.startingPlayer ?? "X",
        gameType,
      });
    });

    return () => unsubscribe();
  }, [gameId, user]);

  // --------------------------------------------------------------
  // Check Winner
  // --------------------------------------------------------------
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

    return board.every((cell) => cell !== null) ? "draw" : null;
  };

  // --------------------------------------------------------------
  // Handle Player Move
  // --------------------------------------------------------------
  const handleMove = async (index: number) => {
    if (!user) return;

    const playerSymbol =
      gameState.players.X === user.uid
        ? "X"
        : gameState.players.O === user.uid
          ? "O"
          : null;

    if (!playerSymbol) return;

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
    const gameRef = doc(db, "gameLobbies", gameId);

    if (winner && winner !== "draw") {
      const winnerUserId = gameState.players[winner];
      const currentWins =
        typeof gameState.wins?.[winner] === "number"
          ? gameState.wins[winner]
          : 0;

      await updateDoc(gameRef, {
        board: newBoard,
        winner,
        currentPlayer: null,
        [`winsData.tictactoe.${winnerUserId}`]: currentWins + 1,
      });
    }

    await updateDoc(gameRef, {
      board: newBoard,
      currentPlayer: playerSymbol === "X" ? "O" : "X",
      winner,
    });
  };

  // --------------------------------------------------------------
  // Swap Starter + Swap Teams
  // (Wins stay with users, not swapped)
  // --------------------------------------------------------------
  const swapStarter = async (newStarter: "X" | "O") => {
    const gameRef = doc(db, "gameLobbies", gameId);

    const currentX = gameState.players.X;
    const currentO = gameState.players.O;

    const nameX = gameState.playerNames.X;
    const nameO = gameState.playerNames.O;

    let newPlayers = { ...gameState.players };
    let newNames = { ...gameState.playerNames };

    // If user is switching sides → swap players and names only
    const userIsX = user?.uid === currentX;
    const userIsO = user?.uid === currentO;

    const switchingXtoO = userIsX && newStarter === "O";
    const switchingOtoX = userIsO && newStarter === "X";

    if (switchingXtoO || switchingOtoX) {
      newPlayers = { X: currentO, O: currentX };
      newNames = { X: nameO, O: nameX };
      // Wins are NOT swapped - they stay with each user
    }

    await updateDoc(gameRef, {
      startingPlayer: newStarter,
      currentPlayer: newStarter,
      players: newPlayers,
      playerNames: newNames,
      board: Array(9).fill(null),
      winner: null,
    });
  };

  // --------------------------------------------------------------
  // Cell UI
  // --------------------------------------------------------------
  const getCellStyle = (value: Player) =>
    `w-20 h-20 bg-white rounded-lg shadow-md flex items-center justify-center text-4xl font-bold cursor-pointer 
     transition-all hover:bg-gray-100
     ${value === "X" ? "text-blue-500" : "text-pink-500"}`;

  // --------------------------------------------------------------
  // Waiting screen - Only show if X hasn't joined yet
  // --------------------------------------------------------------
  if (!gameState.players.X) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold text-white">
          ⏳ Waiting for Player X...
        </h2>
      </div>
    );
  }

  // --------------------------------------------------------------
  // Main Game UI
  // --------------------------------------------------------------
  return (
    <div className="flex flex-col items-center min-h-screen bg-linear-to-br from-purple-600 to-blue-500 p-4">
      {/* TOP BUTTONS */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
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

      <div className="flex flex-col md:flex-row gap-9">
        {/* GAME AREA */}
        <div className="w-full max-w-4xl bg-white p-8 rounded-xl shadow-2xl">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {gameState.winner
                ? gameState.winner === "draw"
                  ? "It's a Draw!"
                  : `${gameState.playerNames[gameState.winner]} (${gameState.winner}) Wins!`
                : `Turn: ${
                    gameState.currentPlayer === "X"
                      ? `${gameState.playerNames.X} (X)`
                      : `${gameState.playerNames.O} (O)`
                  }`}
            </h2>
          </div>

          {/* Game Board */}
          {gameState.board.length === 9 ? (
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
          ) : (
            <div className="text-center py-12 text-gray-600 bg-gray-50 rounded-lg mb-8">
              <p className="text-lg font-semibold">⏳ Loading Game Board...</p>
            </div>
          )}

          <div className="text-center text-gray-600 mb-4">
            <p>
              You are:{" "}
              <strong>
                {user?.uid === gameState.players.X
                  ? `${gameState.playerNames.X} (X)`
                  : `${gameState.playerNames.O} (O)`}
              </strong>
            </p>
          </div>

          <div className="text-center text-lg font-semibold text-gray-700 mb-4">
            <p>
              {gameState.playerNames.X} (X) Wins: {gameState.wins.X}
            </p>
            <p>
              {gameState.playerNames.O} (O) Wins: {gameState.wins.O}
            </p>
          </div>

          {gameState.winner && (
            <div className="mt-6 text-center space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Who starts next round?
              </h3>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => swapStarter("X")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {gameState.playerNames.X} (X)
                </button>

                <button
                  onClick={() => swapStarter("O")}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  {gameState.playerNames.O} (O)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CHAT */}
        <Chat gameId={gameId} />
      </div>
    </div>
  );
}
