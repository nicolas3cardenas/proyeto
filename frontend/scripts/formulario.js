// Cargar datos al iniciar la página
window.onload = function () {
    cargarPaises();
    cargarComunas();
};

// =========================================
// Cargar select de países
// =========================================
async function cargarPaises() {
    try {
        const respuesta = await fetch('http://localhost:3000/listadoPaises');
        const paises = await respuesta.json();

        const select = document.getElementById('selectNacionalidad');
        paises.forEach(pais => {
            const option = document.createElement('option');
            option.value = pais.iso2;
            option.textContent = pais.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.log('Error al cargar países:', error);
    }
}

// =========================================
// Cargar select de comunas
// =========================================
async function cargarComunas() {
    try {
        const respuesta = await fetch('http://localhost:3000/listadoComunas');
        const comunas = await respuesta.json();

        const select = document.getElementById('selectComuna');
        comunas.forEach(comuna => {
            const option = document.createElement('option');
            option.value = comuna.nombre_comuna;
            option.textContent = comuna.nombre_comuna;
            select.appendChild(option);
        });
    } catch (error) {
        console.log('Error al cargar comunas:', error);
    }
}

// =========================================
// Funciones de validación
// =========================================
function validarInput(input) {
    if (input.val().trim() === '') {
        input.addClass('is-invalid').removeClass('is-valid');
    } else {
        input.addClass('is-valid').removeClass('is-invalid');
    }
}

function validarEmail(input) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (regex.test(input.val())) {
        input.addClass('is-valid').removeClass('is-invalid');
    } else {
        input.addClass('is-invalid').removeClass('is-valid');
    }
}

function validarRut(input) {
    const rut = input.val().trim();
    if (validarFormatoRut(rut)) {
        input.addClass('is-valid').removeClass('is-invalid');
    } else {
        input.addClass('is-invalid').removeClass('is-valid');
    }
}

function validarFormatoRut(rut) {
    if (!rut) return false;
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

function validarContrasena(input) {
    if (input.val().length >= 6) {
        input.addClass('is-valid').removeClass('is-invalid');
    } else {
        input.addClass('is-invalid').removeClass('is-valid');
    }
}

function validarRepetirContrasena(inputRepetir, inputOriginal) {
    if (inputRepetir.val() === inputOriginal.val() && inputRepetir.val() !== '') {
        inputRepetir.addClass('is-valid').removeClass('is-invalid');
    } else {
        inputRepetir.addClass('is-invalid').removeClass('is-valid');
    }
}

// =========================================
// Validar y enviar formulario
// =========================================
async function validar_formulario() {
    const nombre = document.getElementById('inputNombre').value.trim();
    const rut = document.getElementById('inputRut').value.trim();
    const correo = document.getElementById('inputCorreo').value.trim();
    const telefono = document.getElementById('inputTelefono').value.trim();
    const fechaNacimiento = document.getElementById('inputFechaNac').value;
    const nacionalidad = document.getElementById('selectNacionalidad').value;
    const contrasena = document.getElementById('inputContrasena').value;
    const repetirContrasena = document.getElementById('inputRepetirContrasena').value;
    const genero = document.querySelector('input[name="genero"]:checked')?.value;
    const comuna = document.getElementById('selectComuna').value;
    const calle = document.getElementById('inputCalle').value.trim();
    const numero = document.getElementById('inputNumero').value.trim();
    const departamento = document.getElementById('inputDepartamento').value.trim();

    // Validaciones básicas
    if (!nombre || !rut || !correo || !fechaNacimiento || !nacionalidad || !contrasena || !comuna || !calle || !numero) {
        alert('Por favor complete todos los campos obligatorios.');
        return;
    }

    if (!validarFormatoRut(rut)) {
        alert('El RUT ingresado no es válido.');
        return;
    }

    if (contrasena !== repetirContrasena) {
        alert('Las contraseñas no coinciden.');
        return;
    }

    if (contrasena.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    const direccion = JSON.stringify({ comuna, calle, numero, departamento });

    const datos = {
        nombre,
        rut,
        correo,
        telefono,
        fechaNacimiento,
        nacionalidad,
        genero,
        direccion,
        contrasena
    };

    try {
        const respuesta = await fetch('http://localhost:3000/guardarUsuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('Usuario registrado correctamente.');
            document.getElementById('formularioRegistro').reset();
            // Limpiar clases de validación
            document.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
                el.classList.remove('is-valid', 'is-invalid');
            });
        } else {
            alert('Error: ' + resultado.message);
        }
    } catch (error) {
        console.log('Error al enviar formulario:', error);
        alert('No se pudo conectar con el servidor.');
    }
}
