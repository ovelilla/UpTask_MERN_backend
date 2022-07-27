import nodemailer from "nodemailer";

const signupEmail = async (user) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const { name, email, token } = user;

    const html = `
    <p>Hola ${name}, confirma tu cuenta en UpTask.</p>
    <p>Tu cuenta ya está casi lista, solo debes confirmarla en el siguiente enlace</p>
    <a href="${process.env.FRONTEND_URL}/confirmar/${token}">Comprobar cuenta</a>
    <p>Si no has creado esta cuenta, puedes ignorar este mensaje.</p>
    `;

    const info = await transporter.sendMail({
        from: "UpTask - Administrador de Proyectos",
        to: email,
        subject: "Confirma tu cuenta en UpTask",
        text: "Confirma tu cuenta en UpTask",
        html: html,
    });

    console.log("Mensaje enviado: %s", info.messageId);
};

export default signupEmail;
