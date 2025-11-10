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
import Image from "next/image";

type ChatMessage = {
  id: string;
  text?: string;
  sender: string;
  createdAt: Timestamp | null;
  type: "text" | "sticker";
  stickerUrl?: string | null;
};

export default function Chat({ gameId }: { gameId: string }) {
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [showStickers, setShowStickers] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Random color per user session
  const userColor = "#4f46e5"; // X → blue
  const otherColor = "#6b7280"; // O → gray

  // Stickers
  const stickers = [
    "/stickers/haha.png",
    "/stickers/lol.png",
    "/stickers/angryboy.png",
    "/stickers/angrygirl.png",
    "/stickers/angry2.png",
    "/stickers/angry3.png",
    "/stickers/break-up.png",
    "/stickers/happy.png",
    "/stickers/laugh.png",
    "/stickers/no.png",
    "/stickers/XOXO.png",
    "/stickers/win.png",
  ];

  // Validate text
  const isValidMessage = (text: string): boolean => {
    if (!text) return false;
    if (/(https?:\/\/[^\s]+)/gi.test(text)) return false;
    if (/<[^>]*>/g.test(text)) return false;
    if (/^data:image\/[a-z]+;base64,/i.test(text)) return false;
    if (/\.(jpg|jpeg|png|gif|pdf|docx|zip|mp4|mp3)$/i.test(text)) return false;

    const allowedPattern = /^[\p{L}\p{N}\p{P}\p{Z}\p{Emoji}]+$/u;
    return allowedPattern.test(text);
  };

  // Load chat messages
  useEffect(() => {
    const chatRef = collection(db, "games", gameId, "chat");
    const q = query(chatRef, orderBy("createdAt"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = snapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;

        return {
          id: doc.id,
          type: data.type,
          text: data.text,
          stickerUrl: data.stickerUrl,
          sender: data.sender,
          createdAt:
            data.createdAt instanceof Timestamp ? data.createdAt : null,
        };
      });

      setMessages(msgs);

      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    });

    return () => unsubscribe();
  }, [gameId]);

  // Send text message
  const sendMessage = async () => {
    if (!user) return;

    const trimmed = input.trim();
    if (!trimmed) return;

    if (!isValidMessage(trimmed)) {
      alert("Only emojis and clean text allowed — no links, files, or HTML.");
      return;
    }

    const chatRef = collection(db, "games", gameId, "chat");

    await addDoc(chatRef, {
      type: "text",
      text: trimmed,
      sender: user.uid,
      createdAt: serverTimestamp(),
    });

    setInput("");
  };

  // Send sticker
  const sendSticker = async (url: string) => {
    if (!user) return;

    const chatRef = collection(db, "games", gameId, "chat");

    await addDoc(chatRef, {
      type: "sticker",
      stickerUrl: url,
      sender: user.uid,
      createdAt: serverTimestamp(),
    });

    setShowStickers(false);
  };

  return (
    <div className="w-full bg-white p-4 rounded-xl shadow-lg">
      <h2 className="text-xl text-gray-600 font-semibold mb-3">💬 Chat</h2>

      {/* Chat Messages */}
      <div className="overflow-y-auto border border-gray-300 rounded-md p-3 mb-3 bg-gray-50 h-96">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 flex ${
              msg.sender === user?.uid ? "justify-end" : "justify-start"
            }`}
          >
            {/* Text Message */}
            {msg.type === "text" && (
              <div
                className={`px-3 py-2 rounded-lg max-w-[70%] text-white`}
                style={{
                  backgroundColor:
                    msg.sender === user?.uid ? userColor : otherColor,
                }}
              >
                {msg.text}
              </div>
            )}

            {/* Sticker Message */}
            {msg.type === "sticker" && msg.stickerUrl && (
              <Image
                src={msg.stickerUrl}
                alt="sticker"
                width={64}
                height={64}
                className="w-16 h-16 rounded-lg"
              />
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Sticker Picker */}
      {showStickers && (
        <div className="grid grid-cols-3 gap-3 p-3 h-40 overflow-y-scroll bg-gray-200 rounded-lg mb-3">
          {stickers.map((s, index) => (
            <Image
              key={index}
              src={s}
              onClick={() => sendSticker(s)}
              alt="sticker"
              width={64}
              height={64}
              className="w-16 h-16 cursor-pointer hover:scale-110 transition"
            />
          ))}
        </div>
      )}

      {/* Input + Buttons */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message..."
          className="flex-1 px-3 py-2 border rounded-md text-black"
        />

        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Send
        </button>

        <button
          onClick={() => setShowStickers(!showStickers)}
          className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
        >
          😄
        </button>
      </div>
    </div>
  );
}
