import User from "../models/User.js";
import isValidEmail from "../helpers/isValidEmail.js";
import generateToken from "../helpers/generateToken.js";
import generateJWT from "../helpers/generateJWT.js";
import signupEmail from "../helpers/signupEmail.js";
import recoverEmail from "../helpers/recoverEmail.js";

export const signup = async (req, res) => {
    const { name, email, password } = req.body;

    const errors = {};

    if (!name) {
        const error = new Error("El nombre es obligatorio");
        errors.name = error.message;
    }

    if (!email) {
        const error = new Error("El email es obligatorio");
        errors.email = error.message;
    }

    if (email && !isValidEmail(email)) {
        const error = new Error("El email no es válido");
        errors.email = error.message;
    }

    if (!password) {
        const error = new Error("El password es obligatorio");
        errors.password = error.message;
    }

    if (password && password.length < 6) {
        const error = new Error(
            "El password debe contener al menos 6 caracteres"
        );
        errors.password = error.message;
    }

    if (Object.keys(errors).length) {
        return res.status(400).json({ errors });
    }

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            const error = new Error("Usuario ya registrado");
            errors.email = error.message;
            return res.status(400).json({ errors });
        }

        const user = new User(req.body);
        user.token = generateToken();

        await user.save();

        signupEmail({ name: user.name, email: user.email, token: user.token });

        res.status(200).json({
            message: "Usuario creado correctamente, revisa tu email",
        });
    } catch (error) {
        console.log(error);
    }
};

export const confirm = async (req, res) => {
    const { token } = req.body;

    try {
        const user = await User.findOne({ token });

        if (!user) {
            const error = new Error("Token no válido");
            return res.status(403).json({ message: error.message });
        }

        user.token = "";
        user.confirmed = true;

        await user.save();

        res.status(200).json({ message: "Usuario confirmado correctamente" });
    } catch (error) {
        console.log(error);
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    const errors = {};

    if (!email) {
        const error = new Error("El email es obligatorio");
        errors.email = error.message;
    }

    if (email && !isValidEmail(email)) {
        const error = new Error("El email no es válido");
        errors.email = error.message;
    }

    if (!password) {
        const error = new Error("El password es obligatorio");
        errors.password = error.message;
    }

    if (password && password.length < 6) {
        const error = new Error(
            "El password debe contener al menos 6 caracteres"
        );
        errors.password = error.message;
    }

    if (Object.keys(errors).length) {
        return res.status(400).json({ errors });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            const error = new Error("El usuario no existe");
            errors.email = error.message;
            return res.status(404).json({ errors });
        }

        if (!user.confirmed) {
            const error = new Error("Tu cuenta no ha sido confirmada");
            errors.email = error.message;
            return res.status(404).json({ errors });
        }

        if (!(await user.comparePassword(password))) {
            const error = new Error("El password es incorrecto");
            errors.password = error.message;
            return res.status(404).json({ errors });
        }

        const token = generateJWT(user.id);

        res.cookie("access_token", token, {
            // expires: new Date(Date.now() + 24 * 3600000),
            secure: true,
            httpOnly: true,
            // sameSite: "Strict",
            // domain: process.env.FRONTEND_URL
        });

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
        });
    } catch (error) {
        console.log(error);
    }
};

export const logout = async (req, res) => {
    res.clearCookie("access_token");

    res.status(200).json({ message: "Sesión cerrada correctamente" });
};

export const recover = async (req, res) => {
    const { email } = req.body;

    const errors = {};

    if (!email) {
        const error = new Error("El email es obligatorio");
        errors.email = error.message;
    }

    if (email && !isValidEmail(email)) {
        const error = new Error("El email no es válido");
        errors.email = error.message;
    }

    if (Object.keys(errors).length) {
        return res.status(400).json({ errors });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            const error = new Error("El usuario no existe");
            errors.email = error.message;
            return res.status(400).json({ errors });
        }

        user.token = generateToken();

        await user.save();

        recoverEmail({ name: user.name, email: user.email, token: user.token });

        res.status(200).json({ message: "Hemos enviado un email con las instrucciones" });
    } catch (error) {
        console.log(error);
    }
};

export const checkToken = async (req, res) => {
    const { token } = req.body;

    const user = await User.findOne({ token });

    if (!user) {
        const error = new Error("Token no válido");
        return res.status(403).json({ message: error.message });
    }

    res.status(200).json({ message: "Introduce tu nuevo password" });
};

export const restore = async (req, res) => {
    const { password, token } = req.body;

    const errors = {};

    if (!password) {
        const error = new Error("El password es obligatorio");
        errors.password = error.message;
    }

    if (password && password.length < 6) {
        const error = new Error(
            "El password debe contener al menos 6 caracteres"
        );
        errors.password = error.message;
    }

    if (Object.keys(errors).length) {
        return res.status(400).json({ errors });
    }

    try {
        const user = await User.findOne({ token });

        if (!user) {
            const error = new Error("Token no válido");
            return res.status(400).json({ message: error.message });
        }

        user.token = "";
        user.password = password;

        await user.save();

        res.status(200).json({ message: "Password actualizado correctamente" });
    } catch (error) {
        console.log(error);
    }
};

export const auth = async (req, res) => {
    const { user } = req;
    res.status(200).json(user);
};
