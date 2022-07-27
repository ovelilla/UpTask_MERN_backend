import mongoose from "mongoose";
import User from "../models/User.js";
import Project from "../models/Project.js";
import isValidEmail from "../helpers/isValidEmail.js";

export const getProjects = async (req, res) => {
    const projects = await Project.find({
        $or: [{ creator: { $in: req.user } }, { partners: { $in: req.user } }],
    })
        // .where("creator")
        // .equals(req.user)
        .select("-tasks -partners");

    res.json(projects);
};

export const getProject = async (req, res) => {
    const { id } = req.params;
    const {
        Types: {
            ObjectId: { isValid },
        },
    } = mongoose;

    if (!isValid(id)) {
        const error = new Error("Id no válido");
        return res.status(404).json({ message: error.message });
    }

    // const project = await Project.findById(id).populate("tasks").populate("partners", "name email");
    const project = await Project.findById(id)
        .populate({ path: "tasks", populate: { path: "completed", select: "name" } })
        .populate("partners", "name email");

    if (!project) {
        const error = new Error("Proyecto no encontrado");
        return res.status(404).json({ message: error.message });
    }

    if (
        project.creator.toString() !== req.user._id.toString() &&
        !project.partners.some((partner) => partner._id.toString() === req.user._id.toString())
    ) {
        const error = new Error("Acción no válida");
        return res.status(401).json({ message: error.message });
    }

    res.json(project);
};

export const createProject = async (req, res) => {
    const { name, description, deliveryDate, customer } = req.body;
    const errors = {};

    if (!name) {
        const error = new Error("El nombre es obligatorio");
        errors.name = error.message;
    }

    if (!description) {
        const error = new Error("La descripción es obligatoria");
        errors.description = error.message;
    }

    if (!deliveryDate) {
        const error = new Error("La fecha de entrega es obligatoria");
        errors.deliveryDate = error.message;
    }

    if (!customer) {
        const error = new Error("El cliente es obigatorio");
        errors.customer = error.message;
    }

    if (Object.keys(errors).length) {
        return res.status(400).json({ errors });
    }

    const project = new Project(req.body);
    project.creator = req.user._id;

    try {
        const savedProject = await project.save();
        res.json({ message: "Proyecto creado correctamente", project: savedProject });
    } catch (error) {
        console.log(error);
    }
};

export const updateProject = async (req, res) => {
    const { id } = req.params;

    const {
        Types: {
            ObjectId: { isValid },
        },
    } = mongoose;

    if (!isValid(id)) {
        const error = new Error("Id no válido");
        return res.status(404).json({ message: error.message });
    }

    const { name, description, deliveryDate, customer } = req.body;
    const errors = {};

    if (!name) {
        const error = new Error("El nombre es obligatorio");
        errors.name = error.message;
    }

    if (!description) {
        const error = new Error("La descripción es obligatoria");
        errors.description = error.message;
    }

    if (!deliveryDate) {
        const error = new Error("La fecha de entrega es obligatoria");
        errors.deliveryDate = error.message;
    }

    if (!customer) {
        const error = new Error("El cliente es obigatorio");
        errors.customer = error.message;
    }

    if (Object.keys(errors).length) {
        return res.status(400).json({ errors });
    }

    const project = await Project.findById(id);

    if (!project) {
        const error = new Error("Proyecto no encontrado");
        return res.status(404).json({ message: error.message });
    }

    if (project.creator.toString() !== req.user._id.toString()) {
        const error = new Error("Acción no válida");
        return res.status(401).json({ message: error.message });
    }

    project.name = req.body.name || project.name;
    project.description = req.body.description || project.description;
    project.deliveryDate = req.body.deliveryDate || project.deliveryDate;
    project.customer = req.body.customer || project.customer;

    try {
        const updatedProject = await project.save();
        res.json({ message: "Proyecto actualizado correctamente", project: updatedProject });
    } catch (error) {
        console.log(error);
    }
};

export const deleteProject = async (req, res) => {
    const { id } = req.params;
    const {
        Types: {
            ObjectId: { isValid },
        },
    } = mongoose;

    if (!isValid(id)) {
        const error = new Error("Id no válido");
        return res.status(404).json({ message: error.message });
    }

    const project = await Project.findById(id);

    if (!project) {
        const error = new Error("Proyecto no encontrado");
        return res.status(404).json({ message: error.message });
    }

    if (project.creator.toString() !== req.user._id.toString()) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ message: error.message });
    }

    try {
        await project.deleteOne();
        res.json({ message: "Proyecto eliminado" });
    } catch (error) {
        console.log(error);
    }
};

export const addPartner = async (req, res) => {
    const { email, project } = req.body;
    const errors = {};

    const {
        Types: {
            ObjectId: { isValid },
        },
    } = mongoose;

    if (!isValid(project)) {
        const error = new Error("Id no válido");
        return res.status(404).json({ message: error.message });
    }

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

    const user = await User.findOne({ email }).select("_id name email");

    if (!user) {
        const error = new Error("El usuario no existe");
        errors.email = error.message;
        return res.status(404).json({ errors });
    }

    const existsProject = await Project.findById(project);

    if (!existsProject) {
        const error = new Error("Proyecto no encontrado");
        return res.status(404).json({ message: error.message });
    }

    if (existsProject.partners.includes(user._id)) {
        const error = new Error("El usuario ya es parte del proyecto");
        return res.status(404).json({ message: error.message });
    }

    if (existsProject.creator.toString() === user._id.toString()) {
        const error = new Error("El creador del proyecto no puede ser colaborador");
        return res.status(403).json({ message: error.message });
    }

    if (existsProject.creator.toString() !== req.user._id.toString()) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ message: error.message });
    }

    existsProject.partners.push(user._id);

    try {
        await existsProject.save();

        res.json({
            message: "Colaborador agregado correctamente",
            partner: user,
        });
    } catch (error) {
        console.log(error);
    }
};

export const deletePartner = async (req, res) => {
    const { id } = req.params;
    const partner = req.body;

    const {
        Types: {
            ObjectId: { isValid },
        },
    } = mongoose;

    if (!isValid(id)) {
        const error = new Error("Id no válido");
        return res.status(404).json({ message: error.message });
    }

    const project = await Project.findById(id);

    if (!project) {
        const error = new Error("Proyecto no encontrado");
        return res.status(404).json({ message: error.message });
    }

    if (project.creator.toString() !== req.user._id.toString()) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ message: error.message });
    }

    project.partners.pull(partner._id);

    try {
        await project.save();

        res.json({ message: "Colaborador eliminado correctamente" });
    } catch (error) {
        console.log(error);
    }
};
