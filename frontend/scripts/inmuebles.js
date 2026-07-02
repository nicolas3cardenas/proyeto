window.onload = function () {
    cargarUsuarios();
    obtenerInmuebles();
};

// =========================================
// Cargar select de usuarios
// =========================================
async function cargarUsuarios() {
    try {
        const respuesta = await fetch('http://localhost:3000/listadoUsuariosSimple');
        const usuarios = await respuesta.json();

        const select = document.getElementById('selectUsuario');
        usuarios.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario._id;
            option.textContent = `${usuario.nombre} (${usuario.rut})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.log('Error al cargar usuarios:', error);
    }
}

// =========================================
// Guardar inmueble
// =========================================
async function guardarInmueble() {
    const usuario = document.getElementById('selectUsuario').value;
    const tipo = document.getElementById('selectTipo').value;
    const direccion = document.getElementById('inputDireccionInmueble').value.trim();
    const ciudad = document.getElementById('inputCiudad').value.trim();
    const region = document.getElementById('inputRegion').value.trim();
    const metrosCuadrados = document.getElementById('inputMetros').value;
    const habitaciones = document.getElementById('inputHabitaciones').value;
    const valor = document.getElementById('inputValor').value;
    const estado = document.getElementById('selectEstado').value;
    const uso = document.getElementById('selectUso').value;

    if (!usuario || !tipo || !direccion || !ciudad || !region) {
        alert('Por favor complete los campos obligatorios: propietario, tipo, dirección, ciudad y región.');
        return;
    }

    const datos = {
        usuario,
        tipo,
        direccion,
        ciudad,
        region,
        metrosCuadrados: metrosCuadrados ? Number(metrosCuadrados) : null,
        habitaciones: habitaciones ? Number(habitaciones) : null,
        valor: valor ? Number(valor) : null,
        estado,
        uso
    };

    try {
        const respuesta = await fetch('http://localhost:3000/guardarInmueble', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert('Inmueble registrado correctamente.');
            limpiarFormulario();
            // Recargar tabla
            $('#tablaInmuebles').DataTable().destroy();
            obtenerInmuebles();
        } else {
            alert('Error: ' + resultado.message);
        }
    } catch (error) {
        console.log('Error al guardar inmueble:', error);
        alert('No se pudo conectar con el servidor.');
    }
}

// =========================================
// Obtener inmuebles con $lookup (datos de usuario)
// =========================================
async function obtenerInmuebles() {
    try {
        const respuesta = await fetch('http://localhost:3000/listadoInmuebles');
        const datos = await respuesta.json();

        new DataTable('#tablaInmuebles', {
            data: datos,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/2.0.8/i18n/es-CL.json'
            },
            columns: [
                {
                    data: 'datosUsuario',
                    render: function (data) {
                        return data ? data.nombre : '-';
                    }
                },
                {
                    data: 'datosUsuario',
                    render: function (data) {
                        return data ? data.rut : '-';
                    }
                },
                { data: 'tipo' },
                { data: 'direccion' },
                { data: 'ciudad' },
                { data: 'region' },
                { data: 'metrosCuadrados', defaultContent: '-' },
                { data: 'habitaciones', defaultContent: '-' },
                {
                    data: 'valor',
                    render: function (data) {
                        if (!data) return '-';
                        return '$' + Number(data).toLocaleString('es-CL');
                    }
                },
                { data: 'estado', defaultContent: '-' },
                { data: 'uso', defaultContent: '-' }
            ]
        });

    } catch (error) {
        console.log('Error al obtener inmuebles:', error);
    }
}

// =========================================
// Limpiar formulario
// =========================================
function limpiarFormulario() {
    document.getElementById('formularioInmueble').reset();
}
