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
  wins: { X: number; O: number };
  startingPlayer: "X" | "O";
};

export default function Game({
  gameId,
  onBack,
}: {
  gameId: string;
  onBack: () => void;
}) {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
    players: { X: null, O: null },
    wins: { X: 0, O: 0 },
    startingPlayer: "X",
  });

  useEffect(() => {
    const gameRef = doc(db, "games", gameId);

    const initGame = async () => {
      const gameDoc = await getDoc(gameRef);

      if (!gameDoc.exists()) {
        await setDoc(gameRef, {
          board: Array(9).fill(null),
          currentPlayer: "X",
          startingPlayer: "X",
          winner: null,
          players: { X: user?.uid || null, O: null },
          wins: { X: 0, O: 0 },
        });
      } else {
        const data = gameDoc.data();
        if (!data.players.O && user?.uid !== data.players.X) {
          await updateDoc(gameRef, {
            "players.O": user?.uid || null,
          });
        }
      }
    };

    initGame();

    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GameState;

        setGameState({
          ...data,
          wins: data.wins || { X: 0, O: 0 },
          startingPlayer: data.startingPlayer || "X",
          currentPlayer: data.currentPlayer || data.startingPlayer,
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

    return board.every((cell) => cell !== null) ? "draw" : null;
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

  // RESET ROUND (no change to starter)
  const resetGame = async () => {
    const gameRef = doc(db, "games", gameId);
    await updateDoc(gameRef, {
      board: Array(9).fill(null),
      currentPlayer: gameState.startingPlayer,
      winner: null,
    });
  };

  // SWAP STARTER AFTER ROUND END
  const swapStarter = async (starter: "X" | "O") => {
    const gameRef = doc(db, "games", gameId);

    await updateDoc(gameRef, {
      startingPlayer: starter,
      currentPlayer: starter,
      board: Array(9).fill(null),
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

        <p className="text-gray-600 mb-2">
          Share this Game ID:
          <span className="font-semibold ml-1">{gameId}</span>
        </p>

        <p className="text-gray-600 mt-3">
          <strong>First Turn:</strong>{" "}
          {gameState.startingPlayer === "X" ? "Player X" : "Player O"}
        </p>

        <button
          onClick={copyGameId}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
        >
          Copy Game ID
        </button>

        {copied && (
          <p className="text-green-500 font-semibold mt-2">✅ Copied!</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-linear-to-br from-purple-600 to-blue-500 p-4">
      <div className="flex gap-4 mb-6">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
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
        {/* GAME UI */}
        <div className="bg-white p-8 rounded-xl shadow-2xl">
          {/* Current Status */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {gameState.winner
                ? gameState.winner === "draw"
                  ? "It's a Draw!"
                  : `Player ${gameState.winner} Wins!`
                : `Current Player: ${gameState.currentPlayer}`}
            </h2>
          </div>

          {/* Game Board */}
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

          {/* Player Indicator */}
          <div className="text-center text-gray-600 mb-4">
            <p>
              You are Player: {user?.uid === gameState.players.X ? "X" : "O"}
            </p>
          </div>

          {/* Win Stats */}
          <div className="text-center text-lg font-semibold text-gray-700 mb-4">
            <p>Player X Wins: {gameState.wins.X}</p>
            <p>Player O Wins: {gameState.wins.O}</p>
          </div>

          {/* SWAP STARTER AFTER WIN */}
          {gameState.winner && (
            <div className="text-center mt-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Choose who starts next round:
              </h3>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => swapStarter("X")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Player X Starts
                </button>

                <button
                  onClick={() => swapStarter("O")}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  Player O Starts
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CHAT */}
        <div className="">
          <Chat gameId={gameId} />
        </div>
      </div>
    </div>
  );
}
