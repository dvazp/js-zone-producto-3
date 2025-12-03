// Importamos Express, el framework para crear el servidor
import express from 'express';
import { MongoClient } from 'mongodb';

// Definimos el puerto donde correrá el servidor (3000 por defecto)
const PORT = process.env.PORT || 3000;

// Creamos la aplicación Express
const app = express();

// Middleware que permite leer JSON en las peticiones
app.use(express.json());

// Importamos los datos base de usuarios desde el frontend
/*
import { usuariosBase } from '../frontend/js/datos.js';
import { voluntariadosBase } from '../frontend/js/datos.js';
*/
let usuariosCollection;
let voluntariadosCollection;

//Conexion MongoDB
const MONGO_URI =  'mongodb://127.0.0.1:27017';
const DB_NAME = 'jszone';

const client = new MongoClient(MONGO_URI);

async function conectarMongo(){
  await client.connect();
  const db = client.db(DB_NAME);
  usuariosCollection = db.collection('usuarios');
  voluntariadosCollection = db.collection('voluntariados');
console.log("Conectado a MongoDB");
}

await conectarMongo();
// ========================================
// INICIALIZACIÓN DE DATOS
// ========================================

/* Copiamos los voluntarios a una variable que va a actuar como base de datos.
let voluntariados = voluntariadosBase;
// Copiamos los usuarios base a una variable que actuará como "base de datos" en memoria
let usuarios = usuariosBase;
*/
// ========================================
// RUTAS REST
// ========================================

app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await usuariosCollection.find().toArray();
    console.log('Estos son los usuarios', usuarios);
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error obteniendo usuarios' });
  }
});

app.get('/usuarios/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const usuario = await usuariosCollection.findOne({ email });
    if (usuario) {
      res.json(usuario);
    } else {
      res.status(404).json({ message: 'Este usuario no existe' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error buscando usuario' });
  }
});

app.post('/usuarios', async (req, res) => {
  try {
    const nuevoUsuario = req.body;
    const existeUsuario = await usuariosCollection.findOne({ email: nuevoUsuario.email });

    if (existeUsuario) {
      return res.status(400).json({ message: 'Este usuario ya existe' });
    }

    await usuariosCollection.insertOne(nuevoUsuario);
    res.status(201).json({ message: 'Usuario creado con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creando usuario' });
  }
});

app.delete('/usuarios/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await usuariosCollection.deleteOne({ email });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error eliminando usuario' });
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


  enum TipoVoluntariado{
  Oferta
  Peticion
  }

  scalar Date
  type Voluntariado{
        titulo: String! 
        usuario: String!
        fecha: Date!
        descripcion: String!
        tipo: TipoVoluntariado!
        email:String!
        id:ID!
  }


  type Query {
    usuarios: [Usuario!]!
    usuario(email: String!): Usuario
    voluntariados:[Voluntariado]
    voluntariado(id: ID!): Voluntariado
  }

  type Mutation {
    crearUsuario(
      user: String!
      email: String!
      password: String!
      nombre: String!
      tipo: String!
    ): Usuario!

    crearVoluntariado(
        titulo: String! 
        usuario: String!
        fecha: Date!
        descripcion: String!
        tipo: TipoVoluntariado!
        email:String!
    ): Voluntariado!


    eliminarVoluntariado(id: ID!): ID!
    eliminarUsuario(email: String!): String!
}

`;

const resolvers = {
  Query: {
    usuarios: async () => {
      return await usuariosCollection.find().toArray();
    },
    usuario: async (parent, args) => {
      return await usuariosCollection.findOne({ email: args.email });
    },
    voluntariados:() => voluntariados,
    voluntariado:(parent,args) => voluntariados.find(v => v.id === args.id),
  },

  Mutation: {
    crearUsuario: async (parent, args) => {
      const { user, email, password, nombre, tipo } = args;

      const existe = await usuariosCollection.findOne({ email });
      if (existe) {
        throw new Error('Usuario ya existe');
      }

      const nuevoUsuario = { user, email, password, nombre, tipo };
      await usuariosCollection.insertOne(nuevoUsuario);
      return nuevoUsuario;
    },

    eliminarUsuario: async (parent, args) => {
      const result = await usuariosCollection.deleteOne({ email: args.email });
      if (result.deletedCount === 0) {
        throw new Error('Usuario no encontrado');
      }
      return 'Usuario eliminado con éxito';
    },

    crearVoluntariado:(parent,args) =>{
    const {titulo,usuario,fecha,descripcion,tipo,email} = args;
    const nuevaID = (voluntariados.length+1).toString();
    const nuevoVoluntariado = {
    id: nuevaID,
    titulo,
    usuario,
    fecha,
    descripcion,
    tipo,
    email
    };
    voluntariados.push(nuevoVoluntariado);
    return nuevoVoluntariado;
    },

    eliminarVoluntariado:(parent,args) =>{
    const index = voluntariados.findIndex(v => v.id === args.id);
    if (index === -1) {
        throw new Error('Voluntariado no encontrado');
      }
      voluntariados.splice(index, 1);
      return args.id;
    }
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
