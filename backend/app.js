const express = require('express');
const PORT = process.env.PORT ||3000;
const app = express();
app.use(express.json());

// Configuración Iniciar Server

app.listen(PORT,()=>{

    console.log("Server Iniciado para acceder usa http://localhost:3000 ")

});