import jwt from "jsonwebtoken";
import User from "../models/User.js";

const checkAuthOld = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        const error = new Error('Token no válido');
        return res.status(401).json({ msg: error.message });
    }

    if (!authHeader.toLowerCase().startsWith('bearer')) {
        const error = new Error('Token no válido');
        return res.status(401).json({ msg: error.message });
    }

    try {
        const token = authHeader.split(' ').pop();
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.id;

        req.user = await User.findById(userId).select("__id name email");

        return next();
    } catch (error) {
        const e = new Error("Hubo un error");
        return res.status(404).json({ msg: e.message });
    }
};

export default checkAuthOld;
