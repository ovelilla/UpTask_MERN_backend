import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import { Server } from "socket.io";

const app = express();
app.use(cookieParser());
app.use(express.json());

dotenv.config();

await connectDB();

const whiteList = [process.env.FRONTEND_URL, process.env.BACKEND_URL];

const corsOptions = {
    credentials: true,
    origin: function (origin, callback) {
        if (whiteList.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
};

app.set("trust proxy", 1);

app.use(cors(corsOptions));

app.use("/api/user", userRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/task", taskRoutes);

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL,
    },
});

io.on("connection", (socket) => {
    // console.log("Connected to socket.io");

    socket.on("open-project", (data) => {
        socket.join(data);
    });

    socket.on("create-task", (data) => {
        socket.to(data.project).emit("task-created", data);
    });

    socket.on("update-task", (data) => {
        socket.to(data.project._id).emit("task-updated", data);
    });

    socket.on("delete-task", (data) => {
        if (data.project._id) {
            socket.to(data.project._id).emit("task-deleted", data);
        } else {
            socket.to(data.project).emit("task-deleted", data);
        }
    });

    socket.on("change-status", (data) => {
        socket.to(data.project._id).emit("status-changed", data);
    });
});
