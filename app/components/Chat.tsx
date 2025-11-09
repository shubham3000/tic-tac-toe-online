"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  DocumentData,
} from "firebase/firestore";

type ChatMessage = {
  id: string;
  text: string;
  sender: string;
  createdAt: Timestamp | null;
};

export default function Chat({ gameId }: { gameId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ✅ Validation function
  const isValidMessage = (text: string): boolean => {
    if (!text) return false;

    // Block URLs
    if (/(https?:\/\/[^\s]+)/gi.test(text)) return false;

    // Block HTML tags
    if (/<[^>]*>/g.test(text)) return false;

    // Block base64 image strings
    if (/^data:image\/[a-z]+;base64,/i.test(text)) return false;

    // Block common file extensions
    if (/\.(jpg|jpeg|png|gif|pdf|docx|zip|mp4|mp3)$/i.test(text)) return false;

    // Allow only letters, numbers, punctuation, spaces, emojis
    const allowedPattern = /^[\p{L}\p{N}\p{P}\p{Z}\p{Emoji}]+$/u;
    return allowedPattern.test(text);
  };

  // Load messages in real-time
  useEffect(() => {
    const chatRef = collection(db, "games", gameId, "chat");
    const q = query(chatRef, orderBy("createdAt"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;

        return {
          id: doc.id,
          text: typeof data.text === "string" ? data.text : "",
          sender: typeof data.sender === "string" ? data.sender : "unknown",
          createdAt:
            data.createdAt instanceof Timestamp ? data.createdAt : null,
        };
      });

      setMessages(msgs);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [gameId]);

  const sendMessage = async () => {
    if (!user) return;

    const trimmed = input.trim();
    if (!trimmed) return;

    // ✅ Validate before sending
    if (!isValidMessage(trimmed)) {
      alert("Only text and emojis are allowed — no links, files, or images.");
      return;
    }

    const chatRef = collection(db, "games", gameId, "chat");

    await addDoc(chatRef, {
      text: trimmed,
      sender: user.uid,
      createdAt: serverTimestamp(),
    });

    setInput("");
  };

  return (
    <div className="w-full max-w-md bg-white p-4 rounded-xl shadow-lg">
      <h2 className="text-xl text-gray-600 font-semibold mb-3">💬 Chat</h2>

      {/* Messages */}
      <div className="overflow-y-auto border border-gray-300 rounded-md p-3 mb-3 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 flex ${
              msg.sender === user?.uid ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[70%] ${
                msg.sender === user?.uid
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-black"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          className="flex-1 px-3 py-2 border rounded-md text-black"
        />
        <button
          type="submit"
          onClick={sendMessage}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
