// Importamos Express, el framework para crear el servidor
const express = require('express');

// Definimos el puerto donde correrá el servidor (3000 por defecto)
const PORT = process.env.PORT || 3000;

// Creamos la aplicación Express
const app = express();

// Middleware que permite leer JSON en las peticiones
app.use(express.json());

// Importamos los datos base de usuarios desde el frontend
import { usuariosBase } from '../frontend/js/datos';

// ========================================
// INICIALIZACIÓN DE DATOS
// ========================================

// Copiamos los usuarios base a una variable que actuará como "base de datos" en memoria
let usuarios = usuariosBase;

// ========================================
// INICIO DEL SERVIDOR
// ========================================

// Iniciamos el servidor en el puerto especificado
app.listen(PORT, () => {
    console.log("Server Iniciado para acceder usa http://localhost:3000 ");
});

// ========================================
// RUTA: GET /usuarios
// Obtener todos los usuarios
// ========================================
app.get("/usuarios", (req, res) => {
    // Imprimimos en consola los usuarios actuales
    console.log("Estos son los usuarios" + usuarios);
    
    // Enviamos la lista completa de usuarios como respuesta JSON
    res.json(usuarios);
});

// ========================================
// RUTA: GET /usuarios/:email
// Buscar un usuario específico por email
// ========================================
app.get("/usuarios/:email", (req, res) => {
    // Extraemos el email de los parámetros de la URL
    const email = req.params.email;
    
    // Buscamos el usuario que coincida con ese email
    const usuario = usuarios.find(u => u.email === email);
    
    // Si encontramos el usuario, lo devolvemos
    if (usuario) {
        res.json(usuario);
    } else {
        // Si no existe, devolvemos error 404 (No encontrado)
        res.status(404).json({ message: "Este usuario no existe" });
    }
});

// ========================================
// RUTA: POST /usuarios
// Crear un nuevo usuario
// ========================================
app.post("/usuarios", (req, res) => {
    // Obtenemos los datos del nuevo usuario del cuerpo de la petición
    const nuevoUsuario = req.body;
    
    // Verificamos si ya existe un usuario con ese email
    const existeUsuario = usuarios.find(u => u.email === nuevoUsuario.email);
    
    if (existeUsuario) {
        // Si existe, solo mostramos mensaje en consola (DEBERÍA devolver error)
        console.log("este usuario ya existe");
    } else {
        // Si no existe, agregamos el nuevo usuario al array
        usuarios.push(nuevoUsuario);
        
        // Respondemos con código 201 (Creado) y mensaje de éxito
        res.status(201).json({ message: "Usuario creado con éxito" });
    }
});

// ========================================
// RUTA: DELETE /usuarios/:email
// Eliminar un usuario por email
// ========================================
app.delete("/usuarios/:email", (req, res) => {
    // Extraemos el email de los parámetros (usando desestructuración)
    const { email } = req.params;
    
    // Buscamos la posición del usuario en el array
    const index = usuarios.findIndex(u => u.email === email);
    
    // Si encontramos el usuario (index diferente de -1)
    if (index !== -1) {
        // Eliminamos el usuario del array usando splice
        usuarios.splice(index, 1);
        
        // Respondemos con mensaje de éxito
        res.json({ message: "Usuario eliminado con éxito" });
    } else {
        // Si no existe, devolvemos error 404
        res.status(404).json({ message: "Usuario no encontrado" });
    }
});