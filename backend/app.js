// Importamos Express, el framework para crear el servidor
import express from 'express';

// Definimos el puerto donde correrá el servidor (3000 por defecto)
const PORT = process.env.PORT || 3000;

// Creamos la aplicación Express
const app = express();

// Middleware que permite leer JSON en las peticiones
app.use(express.json());

// Importamos los datos base de usuarios desde el frontend
import { usuariosBase } from '../frontend/js/datos.js';
import { voluntariadosBase } from '../frontend/js/datos.js';

// ========================================
// INICIALIZACIÓN DE DATOS
// ========================================

// Copiamos los voluntarios a una variable que va a actuar como base de datos.
let voluntariados = voluntariadosBase;
// Copiamos los usuarios base a una variable que actuará como "base de datos" en memoria
let usuarios = usuariosBase;

// ========================================
// RUTAS REST
// ========================================

app.get("/usuarios", (req, res) => {
    console.log("Estos son los usuarios" + usuarios);
    res.json(usuarios);
});

app.get("/usuarios/:email", (req, res) => {
    const email = req.params.email;
    const usuario = usuarios.find(u => u.email === email);
    if (usuario) {
        res.json(usuario);
    } else {
        res.status(404).json({ message: "Este usuario no existe" });
    }
});

app.post("/usuarios", (req, res) => {
    const nuevoUsuario = req.body;
    const existeUsuario = usuarios.find(u => u.email === nuevoUsuario.email);
    if (existeUsuario) {
        console.log("este usuario ya existe");
    } else {
        usuarios.push(nuevoUsuario);
        res.status(201).json({ message: "Usuario creado con éxito" });
    }
});

app.delete("/usuarios/:email", (req, res) => {
    const { email } = req.params;
    const index = usuarios.findIndex(u => u.email === email);
    if (index !== -1) {
        usuarios.splice(index, 1);
        res.json({ message: "Usuario eliminado con éxito" });
    } else {
        res.status(404).json({ message: "Usuario no encontrado" });
    }
});

app.get("/voluntariados", (req, res) => {
    console.log("Estos son los voluntariados disponibles" + voluntariados);
    res.json(voluntariados);
});

app.post("/voluntariados", (req, res) => {
    const nuevoVoluntario = req.body;
    const existeVoluntariado = voluntariados.find(u => u.id === nuevoVoluntario.id);
    if (existeVoluntariado) {
        console.log("este voluntariado ya existe");
        res.status(500).json({ message: "Este voluntariado ya existe" })
    } else {
        voluntariados.push(nuevoVoluntario);
        res.status(201).json({ message: "Voluntariado creado correctamente" });
    }
});

app.delete("/voluntariados/:id", (req, res) => {
    const { id } = req.params;
    const idNumero = Number(id)
    const index = voluntariados.findIndex(u => u.id === idNumero);
    if (index !== -1) {
        voluntariados.splice(index, 1);
        res.json({ message: "Voluntariado eliminado con exito" });
    } else {
        res.status(404).json({ message: "Voluntariado no encontrado" });
    }
});

// ========================================
// GRAPHQL CON APOLLO SERVER
// ========================================

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = `
  type Usuario {
    user: String!
    email: String!
    password: String!
    nombre: String!
    tipo: String!
  }



  type Query {
    usuarios: [Usuario!]!
    usuario(email: String!): Usuario

  }

  type Mutation {
    crearUsuario(
      user: String!
      email: String!
      password: String!
      nombre: String!
      tipo: String!
    ): Usuario!
    
    eliminarUsuario(email: String!): String!
    

`;

const resolvers = {
  Query: {
    usuarios: () => usuarios,
    usuario: (parent, args) => usuarios.find(u => u.email === args.email),

  },

  Mutation: {
    crearUsuario: (parent, args) => {
      const { user, email, password, nombre, tipo } = args;
      const existe = usuarios.find(u => u.email === email);
      if (existe) {
        throw new Error('Usuario ya existe');
      }
      const nuevoUsuario = { user, email, password, nombre, tipo };
      usuarios.push(nuevoUsuario);
      return nuevoUsuario;
    },

    eliminarUsuario: (parent, args) => {
      const index = usuarios.findIndex(u => u.email === args.email);
      if (index === -1) {
        throw new Error('Usuario no encontrado');
      }
      usuarios.splice(index, 1);
      return 'Usuario eliminado con éxito';
    },


  }
};

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

// ========================================
// INICIAR SERVIDORES
// ========================================

// Servidor REST en puerto 3000
app.listen(PORT, () => {
  console.log(`Servidor REST corriendo en: http://localhost:${PORT}`);

});

// Servidor GraphQL en puerto 4000 (NO usar await apolloServer.start())
const { url } = await startStandaloneServer(apolloServer, {
  listen: { port: 4000 },
});

console.log(` Servidor GraphQL corriendo en: ${url}`);
