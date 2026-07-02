// Importación de dependencias para ejecutar nuestra app en backend
const express = require('express');       
const cors = require('cors');             
const mongoose = require('mongoose');    
const bcrypt = require('bcryptjs');       

const app = express();

app.use(cors());
app.use(express.json());

// Conexión a DB
mongoose.connect('mongodb://localhost:27017/IEI_N3_C3', {})
    .then(() => console.log('Conexión Exitosa!'))
    .catch((err) => console.log('No se ha podido establecer la conexión con el servidor ', err));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Puerto: ${PORT}`));

// =============================================
// SCHEMA: Países (colección existente)
// =============================================
const pais = new mongoose.Schema({
    nombre: String,
    iso2: String,
    iso3: String,
    codigoPais: String,
    nacionalidad: String
});
const Pais = mongoose.model('Pais', pais, 'paises');

// =============================================
// SCHEMA: Comunas (colección existente)
// =============================================
const comuna = new mongoose.Schema({
    codigo_comuna: String,
    nombre_comuna: String,
    codigo_postal: String,
    nombre_region: String
});
const Comuna = mongoose.model('Comuna', comuna, 'comunas');

// =============================================
// SCHEMA: Dirección (subdocumento embebido)
// =============================================
const direccionSchema = new mongoose.Schema({
    comuna: String,
    calle: String,
    numero: String,
    departamento: String
});

// =============================================
// SCHEMA: Usuario (actualizado según evaluación)
// =============================================

// Función de validación de RUT chileno (módulo 11)
function validarRut(rut) {
    if (!rut || typeof rut !== 'string') return false;
    const rutLimpio = rut.replace(/[.\-]/g, '').toUpperCase();
    if (rutLimpio.length < 2) return false;

    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1);

    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador < 7 ? multiplicador + 1 : 2;
    }

    const dvCalculado = 11 - (suma % 11);
    const dvFinal = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : String(dvCalculado);

    return dv === dvFinal;
}

const usuario = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    rut: {
        type: String,
        required: [true, 'El RUT es obligatorio'],
        validate: {
            validator: validarRut,
            message: 'RUT chileno inválido'
        }
    },
    correo: {
        type: String,
        required: [true, 'El correo es obligatorio']
    },
    telefono: {
        type: String
    },
    fechaNacimiento: {
        type: Date,
        validate: {
            validator: function (fecha) {
                return fecha < new Date();
            },
            message: 'La fecha de nacimiento debe ser anterior a la fecha actual'
        }
    },
    nacionalidad: {
        type: String,
        required: [true, 'La nacionalidad es obligatoria']
    },
    genero: {
        type: String,
        enum: ['M', 'F', 'O']
    },
    direccion: {
        type: direccionSchema,
        required: [true, 'La dirección es obligatoria']
    },
    contrasena: {
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },
    fechaRegistro: {
        type: Date,
        default: Date.now
    },
    activo: {
        type: Boolean,
        default: true
    }
});

const Usuario = mongoose.model('Usuario', usuario, 'usuarios');

// =============================================
// SCHEMA: Inmueble (nueva entidad relacionada)
// =============================================
const inmueble = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario es obligatorio']
    },
    tipo: {
        type: String,
        required: [true, 'El tipo de inmueble es obligatorio']
    },
    direccion: {
        type: String,
        required: [true, 'La dirección del inmueble es obligatoria']
    },
    ciudad: {
        type: String,
        required: [true, 'La ciudad es obligatoria']
    },
    region: {
        type: String,
        required: [true, 'La región es obligatoria']
    },
    metrosCuadrados: {
        type: Number
    },
    habitaciones: {
        type: Number
    },
    valor: {
        type: Number
    },
    estado: {
        type: String
    },
    uso: {
        type: String
    }
});

const Inmueble = mongoose.model('Inmueble', inmueble, 'inmuebles');

// =============================================
// RUTAS: Usuario
// =============================================

// POST - Guardar nuevo usuario
app.post('/guardarUsuario', async (req, res) => {
    try {
        const { nombre, rut, correo, telefono, fechaNacimiento, nacionalidad, genero, direccion, contrasena } = req.body;

        // Parsear dirección si viene como string JSON
        const jsonDireccion = typeof direccion === 'string' ? JSON.parse(direccion) : direccion;

        // Hashear contraseña con bcrypt
        const hashContrasena = await bcrypt.hash(contrasena, 10);

        const nuevoUsuario = new Usuario({
            nombre,
            rut,
            correo,
            telefono,
            fechaNacimiento,
            nacionalidad,
            genero,
            direccion: jsonDireccion,
            contrasena: hashContrasena
        });

        await nuevoUsuario.save();
        res.status(200).json({ message: 'Usuario registrado correctamente.' });
    } catch (err) {
        res.status(500).json({ message: 'No ha sido posible registrar el usuario.', error: err.message });
    }
});

// GET - Listar usuarios con datos de país ($lookup)
app.get('/listadoUsuarios', async (req, res) => {
    try {
        const usuarios = await Usuario.aggregate([
            {
                $lookup: {
                    from: 'paises',
                    localField: 'nacionalidad',
                    foreignField: 'iso2',
                    as: 'gentilicio'
                }
            },
            {
                $unwind: {
                    path: '$gentilicio',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);
        res.status(200).json(usuarios);
    } catch (err) {
        res.status(500).json({ message: 'No ha sido posible obtener los usuarios.', error: err.message });
    }
});

// =============================================
// RUTAS: Inmueble
// =============================================

// POST - Guardar nuevo inmueble
app.post('/guardarInmueble', async (req, res) => {
    try {
        const { usuario, tipo, direccion, ciudad, region, metrosCuadrados, habitaciones, valor, estado, uso } = req.body;

        const nuevoInmueble = new Inmueble({
            usuario,
            tipo,
            direccion,
            ciudad,
            region,
            metrosCuadrados,
            habitaciones,
            valor,
            estado,
            uso
        });

        await nuevoInmueble.save();
        res.status(200).json({ message: 'Inmueble registrado correctamente.' });
    } catch (err) {
        res.status(500).json({ message: 'No ha sido posible registrar el inmueble.', error: err.message });
    }
});

// GET - Listar inmuebles con datos del usuario ($lookup)
app.get('/listadoInmuebles', async (req, res) => {
    try {
        const inmuebles = await Inmueble.aggregate([
            {
                $lookup: {
                    from: 'usuarios',           
                    localField: 'usuario',     
                    foreignField: '_id',        
                    as: 'datosUsuario'          
                }
            },
            {
                $unwind: {
                    path: '$datosUsuario',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);
        res.status(200).json(inmuebles);
    } catch (err) {
        res.status(500).json({ message: 'No ha sido posible obtener los inmuebles.', error: err.message });
    }
});

// =============================================
// RUTAS: Auxiliares
// =============================================

// GET - Listar países (para select del formulario)
app.get('/listadoPaises', async (req, res) => {
    try {
        const paises = await Pais.find();
        res.status(200).json(paises);
    } catch (err) {
        res.status(500).json({ message: 'No ha sido posible obtener los países.', error: err.message });
    }
});

// GET - Listar comunas (para select del formulario)
app.get('/listadoComunas', async (req, res) => {
    try {
        const comunas = await Comuna.find();
        res.status(200).json(comunas);
    } catch (err) {
        res.status(500).json({ message: 'No ha sido posible obtener las comunas.', error: err.message });
    }
});

// GET - Listar usuarios (para select al registrar inmueble)
app.get('/listadoUsuariosSimple', async (req, res) => {
    try {
        const usuarios = await Usuario.find({}, { nombre: 1, rut: 1 });
        res.status(200).json(usuarios);
    } catch (err) {
        res.status(500).json({ message: 'No ha sido posible obtener los usuarios.', error: err.message });
    }
});
