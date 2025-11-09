'use client';

import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from 'firebase/firestore';

type Player = 'X' | 'O' | null;
type GameState = {
  board: Player[];
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  players: {
    X: string | null;
    O: string | null;
  };
};

export default function Game({ gameId }: { gameId: string }) {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    players: { X: null, O: null },
  });

  useEffect(() => {
    const gameRef = doc(db, 'games', gameId);

    // Initialize game if it doesn't exist
    const initGame = async () => {
      const gameDoc = await getDoc(gameRef);
      if (!gameDoc.exists()) {
        await setDoc(gameRef, {
          board: Array(9).fill(null),
          currentPlayer: 'X',
          winner: null,
          players: { X: user?.uid || null, O: null },
        });
      } else if (!gameDoc.data().players.O && user?.uid !== gameDoc.data().players.X) {
        // Join as player O if spot is open
        await updateDoc(gameRef, {
          'players.O': user?.uid,
        });
      }
    };

    initGame();

    // Subscribe to game updates
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        setGameState(doc.data() as GameState);
      }
    });

    return () => unsubscribe();
  }, [gameId, user]);

  const checkWinner = (board: Player[]): Player | 'draw' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    if (board.every(cell => cell !== null)) {
      return 'draw';
    }

    return null;
  };

  const handleMove = async (index: number) => {
    if (!user) return;
    
    const playerSymbol = gameState.players.X === user.uid ? 'X' : 'O';
    
    // Check if it's the player's turn and the cell is empty
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

    const gameRef = doc(db, 'games', gameId);
    await updateDoc(gameRef, {
      board: newBoard,
      currentPlayer: playerSymbol === 'X' ? 'O' : 'X',
      winner,
    });
  };

  // ✅ RESET GAME BUTTON FUNCTION
  const resetGame = async () => {
    const gameRef = doc(db, 'games', gameId);

    await updateDoc(gameRef, {
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
    });
  };

  const getCellStyle = (value: Player) => {
    return `w-20 h-20 bg-white rounded-lg shadow-md flex items-center justify-center text-4xl font-bold cursor-pointer transition-all hover:bg-gray-100 
      ${value === 'X' ? 'text-blue-500' : 'text-pink-500'}`;
  };

  if (!gameState.players.O) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Waiting for Player 2...</h2>
        <p className="text-gray-600">Share this game ID with a friend: {gameId}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-purple-600 to-blue-500 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {gameState.winner
              ? gameState.winner === 'draw'
                ? "It's a Draw!"
                : `Player ${gameState.winner} Wins!`
              : `Current Player: ${gameState.currentPlayer}`}
          </h2>
        </div>
        
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

        <div className="text-center text-gray-600 mb-4">
          <p>You are Player: {user?.uid === gameState.players.X ? 'X' : 'O'}</p>
        </div>

        {/* ✅ SHOW RESET BUTTON IF GAME FINISHED */}
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
