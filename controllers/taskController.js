import mongoose from "mongoose";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

export const getTask = async (req, res) => {
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

    const task = await Task.findById(id).populate("project");

    if (!task) {
        const error = new Error("Tarea no encontrada");
        return res.status(404).json({ message: error.message });
    }

    if (task.project.creator.toString() !== req.user._id.toString()) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ message: error.message });
    }

    res.json(task);
};

export const createTask = async (req, res) => {
    const { name, description, deliveryDate, priority, project } = req.body;
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

    if (!priority) {
        const error = new Error("La prioridad es obligatoria");
        errors.priority = error.message;
    }

    if (Object.keys(errors).length) {
        return res.status(400).json({ errors });
    }

    const existsProject = await Project.findById(project);

    if (!existsProject) {
        const error = new Error("Proyecto no encontrado");
        return res.status(404).json({ message: error.message });
    }

    if (existsProject.creator.toString() !== req.user._id.toString()) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ message: error.message });
    }

    const task = new Task(req.body);

    try {
        const savedTask = await task.save();

        existsProject.tasks.push(savedTask._id);

        await existsProject.save();

        res.json({ message: "Tarea creada correctamente", task: savedTask });
    } catch (error) {
        console.log(error);
    }
};

export const updateTask = async (req, res) => {
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

    const { name, description, deliveryDate, priority } = req.body;
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

    if (!priority) {
        const error = new Error("La prioridad es obligatoria");
        errors.priority = error.message;
    }

    if (Object.keys(errors).length) {
        return res.status(400).json({ errors });
    }

    const task = await Task.findById(id).populate("project");

    if (!task) {
        const error = new Error("Tarea no encontrada");
        return res.status(404).json({ message: error.message });
    }

    if (task.project.creator.toString() !== req.user._id.toString()) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ message: error.message });
    }

    task.name = req.body.name || task.name;
    task.description = req.body.description || task.description;
    task.deliveryDate = req.body.deliveryDate || task.deliveryDate;
    task.priority = req.body.priority || task.priority;

    try {
        const updatedTask = await task.save();
        res.json({ message: "Tarea actualizada correctamente", task: updatedTask });
    } catch (error) {
        console.log(error);
    }
};

export const deleteTask = async (req, res) => {
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

    const task = await Task.findById(id).populate("project");

    if (!task) {
        const error = new Error("Tarea no encontrada");
        return res.status(404).json({ message: error.message });
    }

    if (task.project.creator.toString() !== req.user._id.toString()) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ message: error.message });
    }

    try {
        const project = await Project.findById(task.project);
        project.tasks.pull(task._id);
        
        await Promise.allSettled([project.save(), task.deleteOne()]);

        res.json({ message: "Tarea eliminada" });
    } catch (error) {
        console.log(error);
    }
};

export const changeStatus = async (req, res) => {
    const { _id } = req.body;

    const {
        Types: {
            ObjectId: { isValid },
        },
    } = mongoose;

    if (!isValid(_id)) {
        const error = new Error("Id no válido");
        return res.status(404).json({ message: error.message });
    }

    const task = await Task.findById(_id).populate("project");

    if (!task) {
        const error = new Error("Tarea no encontrada");
        return res.status(404).json({ message: error.message });
    }

    if (
        task.project.creator.toString() !== req.user._id.toString() &&
        !task.project.partners.some((partner) => partner._id.toString() === req.user._id.toString())
    ) {
        const error = new Error("Acción no válida");
        return res.status(403).json({ message: error.message });
    }

    task.status = !task.status;
    task.completed = task.status ? req.user._id : null;

    try {
        await task.save();

        const updatedTask = await Task.findById(_id).populate("project").populate("completed");

        res.json({ message: "Tarea actualizada correctamente", task: updatedTask });
    } catch (error) {
        console.log(error);
    }
};
