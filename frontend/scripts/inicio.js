window.onload = function () {
    obtenerUsuarios();
};

async function obtenerUsuarios() {
    try {
        const respuesta = await fetch('http://localhost:3000/listadoUsuarios');
        const datos = await respuesta.json();

        new DataTable('#tablaUsuarios', {
            data: datos,
            language: {
                url: 'https://cdn.datatables.net/plug-ins/2.0.8/i18n/es-CL.json'
            },
            columns: [
                { data: 'nombre' },
                { data: 'rut' },
                { data: 'correo' },
                { data: 'telefono', defaultContent: '-' },
                {
                    data: 'fechaNacimiento',
                    render: function (data) {
                        if (!data) return '-';
                        return new Date(data).toLocaleDateString('es-CL');
                    }
                },
                {
                    data: 'gentilicio',
                    render: function (data) {
                        return data ? data.nombre : '-';
                    }
                },
                {
                    data: 'genero',
                    render: function (data) {
                        if (data === 'M') return 'Masculino';
                        if (data === 'F') return 'Femenino';
                        if (data === 'O') return 'Otro';
                        return '-';
                    }
                },
                {
                    data: 'activo',
                    render: function (data) {
                        return data ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>';
                    }
                }
            ]
        });

        if (!respuesta.ok) {
            throw new Error(respuesta.status);
        }
    } catch (error) {
        console.log('Ha ocurrido el siguiente error: ', error);
    }
}
