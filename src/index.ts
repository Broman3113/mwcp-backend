import express from 'express';
import cors from 'cors';
import { createServer } from "http";
import { Server } from "socket.io";
import {Room} from "./types";

export interface Point {
  id: string;
  screenX: number;
  screenY: number;
  color: string;
}

const app = express();
const PORT = 4000;

app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json()); // parse application/json bodies [web:111][web:114]
app.use(express.urlencoded({ extended: true })); // parse form bodies (optional but common) [web:114]

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const rooms: Record<string, Room> = {};

io.on("connection", socket => {
  socket.on("join_room", (roomId: string) => {
    if (!rooms[roomId]) {
      socket.emit("room_not_found");
      return;
    }

    socket.join(roomId);

    const pointsArray = Object.values(rooms[roomId].points);
    socket.emit("load_room", pointsArray);
  });

  socket.on("update_point", ({ roomId, point }) => {
    if (!rooms[roomId]) {
      socket.emit("room_not_found");
      return;
    }
    rooms[roomId].points[point.id] = point;
    socket.to(roomId).emit("point_updated", point); // broadcast to room excluding sender [web:191]
  });


  socket.on("create_point", (data: { roomId: string, point: Point }) => {
    const { roomId, point } = data;
    if (!rooms[roomId]) {
      socket.emit("room_not_found");
    }

    rooms[roomId].points[point.id] = point;
    io.to(roomId).emit("point_created", point);
  });
});

app.get("/api/rooms", (_, res) => {
  const roomsArray = Object.values(rooms);
  const returnRoomsArray = roomsArray.map(room => {
    return {...room, points: Object.values(room.points)}
  })
  res.json(returnRoomsArray);
});
app.post("/api/rooms", (req, res) => {
  console.log(req.body)
  const { name } = req.body;
  const roomId = crypto.randomUUID();
  rooms[roomId] = {
    id: roomId,
    name,
    points: {}
  };
  res.status(201).json({ id: roomId, name });
})

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
