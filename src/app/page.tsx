"use client"
import { useState, useEffect } from "react";
import { db } from "@/lib/firebaseConfig";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { FiPlus, FiSearch } from "react-icons/fi";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Room {
  id: string;
  name: string;
}

export default function Home() {
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "rooms"), (querySnapshot) => {
      const roomList: Room[] = querySnapshot.docs.map((doc) => {
        return {
          id: doc.id,
          name: doc.data().name,
        };
      });
      setRooms(roomList);
      setFilteredRooms(roomList); // Initially set filteredRooms to all rooms
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRooms(rooms); // If search query is empty, show all rooms
    } else {
      const filtered = rooms.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) || room.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRooms(filtered);
    }
  }, [searchQuery, rooms]);

  const createRoom = async () => {
    if (!roomName || !roomId) return;

    const validRoomId = /^[a-zA-Z0-9_.-]+$/.test(roomId);
    if (!validRoomId) {
      setErrorMessage("無効なルームIDです。使用できるのは、文字、数字、'-'、'_'、および '.' のみです。");
      return;
    }

    if (roomId.length > 10) {
      setErrorMessage("ルームIDは10文字を超えてはいけません。");
      return;
    }

    setErrorMessage("");

    try {
      const roomRef = doc(db, "rooms", roomId.toLowerCase());
      await setDoc(roomRef, { name: roomName });
      setRoomName("");
      setRoomId("");
      setShowModal(false);
    } catch (error) {
      console.error("Error creating room: ", error);
    }
  };

  return (
    <div>
      <div className="px-8 py-4 flex items-center justify-center select-none h-16 bg-white md:bg-white/25 backdrop-blur-md sticky top-0 z-50 shadow-md">
        <Link href="/" className="flex items-center"><Image src="/kuma.svg" alt="Logo" width={100} height={100} className="h-6 w-fit mr-2" /><p className="font-bold">810ch</p></Link>
      </div>

      <div className="md:container mx-auto p-4 md:p-8">
        <div className="flex items-center px-4 h-10 overflow-hidden rounded-sm border shadow-sm bg-white border-zinc-200 focus-within:ring-2 focus-within:border-blue-400 focus-within:ring-blue-50 duration-200">
          <FiSearch className="mr-4 text-zinc-400" />
          <input
            placeholder="コミュニティを検索する"
            className="bg-transparent outline-none h-10 w-full placeholder:text-zinc-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} // Update search query on input change
          />
        </div>

        {/* Message when no communities found */}
        {filteredRooms.length === 0 && (
          <div className="mt-8 flex items-center justify-center">
            <p className="text-zinc-400">コミュニティが見つかりませんでした。</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {filteredRooms.length > 0 && filteredRooms.map((room, index) => (
            <div key={index} className="flex flex-row md:flex-col rounded-sm shadow-sm bg-white overflow-hidden hover:shadow-md duration-200 hover:translate-y-[-8px] h-16 md:h-auto">
              <img src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${room.id}&backgroundColor=e4e4e7&eyesColor=a1a1aa&mouthColor=a1a1aa&shapeColor=transparent`} alt="avatar" className="md:h-32 h-16 md:w-full bg-zinc-200 w-16" />
              <div className="flex items-center md:items-start w-full p-4">
                <p className="text-lg line-clamp-2 mr-4">{room.name}</p>
                <div className="ml-auto">
                  <Link href={`/${room.id}`}><p className="px-4 py-2 rounded-sm font-bold bg-blue-600 text-white whitespace-nowrap">参加</p></Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed right-8 bottom-8">
        <Button icon={<FiPlus />} onClick={() => setShowModal(true)} variant="secondary" className="shadow-md">コミュニティを新規作成</Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 backdrop-blur">
          <div className="bg-white p-6 rounded-sm w-3/4 md:w-1/4">
            <h1 className="text-xl mb-4 font-bold">コミュニティを新規作成</h1>
            <Input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="mb-2 w-full"
              placeholder="ルームの名前"
            />
            <Input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toLowerCase())}
              className="mb-4 w-full"
              placeholder="識別ID"
            />

            {errorMessage && <p className="text-red-400 text-sm mb-4">{errorMessage}</p>}

            <div className="flex items-center justify-end">
              <Button onClick={() => setShowModal(false)} variant="secondary" className="mr-2">
                キャンセル
              </Button>
              <Button onClick={createRoom}>作成</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}