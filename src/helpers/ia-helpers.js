/**
 * Generar título de conversación a partir del primer mensaje
 * @param {string} primerMensaje - El primer mensaje de la conversación
 * @returns {string} Título generado
 */
export const generarTituloConversacion = (primerMensaje) => {
  if (!primerMensaje || typeof primerMensaje !== "string") {
    return "Nueva Conversación";
  }

  // Tomar los primeros 50 caracteres y eliminar saltos de línea
  let titulo = primerMensaje.replace(/\n/g, " ").trim();
  
  if (titulo.length > 50) {
    titulo = titulo.substring(0, 50) + "...";
  }

  return titulo;
};

/**
 * Detectar si la pregunta es sobre permisos/funcionalidades del usuario
 * @param {string} pregunta - La pregunta del usuario
 * @returns {boolean} True si es una pregunta sobre permisos
 */
export const esPreguntaSobrePermisos = (pregunta) => {
  if (!pregunta || typeof pregunta !== "string") return false;
  
  const palabrasClavePermisos = [
    "permiso",
    "puedo",
    "funciones",
    "funcionalidades",
    "acceso",
    "qué puedo hacer",
    "qué puedo ver",
    "qué módulos",
    "qué operaciones",
    "qué acciones",
    "capabilities",
    "funcionalidad",
    "roleamiento",
    "rol",
    "privilegios",
    "autorización"
  ];

  const preguntaLower = pregunta.toLowerCase();
  return palabrasClavePermisos.some(palabra => preguntaLower.includes(palabra));
};

/**
 * Obtener descripción de permisos por rol
 * @param {string} rol - El rol del usuario (ej: ADMINISTRADOR_ROLE)
 * @returns {Object} Objeto con descripción de permisos del rol
 */
export const obtenerPermisosDeRol = (rol) => {
  const permisosMap = {
    ADMINISTRADOR_ROLE: {
      nombre: "Administrador",
      descripcion: "Acceso total al sistema",
      modulos: {
        clientes: {
          ver: true,
          crear: true,
          editar: true,
          eliminar: true,
          asignar_gerente: true,
          asignar_vendedor: true
        },
        facturas_por_cobrar: {
          ver: true,
          crear: true,
          editar: true,
          eliminar: true,
          cambiar_estado: true,
          generar_reportes: true
        },
        facturas_por_pagar: {
          ver: true,
          crear: true,
          editar: true,
          eliminar: true,
          cambiar_estado: true,
          generar_reportes: true
        },
        cobros: {
          ver: true,
          crear: true,
          editar: true,
          eliminar: true,
          registrar_cobros: true
        },
        pagos_proveedores: {
          ver: true,
          crear: true,
          editar: true,
          eliminar: true,
          registrar_pagos: true
        },
        proveedores: {
          ver: true,
          crear: true,
          editar: true,
          eliminar: true
        },
        reportes: {
          acceso_total: true,
          generar_todos: true,
          exportar_excel: true
        },
        ia_chat: true,
        consultar_permisos: true,
        auditoria: true
      }
    },
    CONTADOR_ROLE: {
      nombre: "Contador",
      descripcion: "Acceso a información financiera y reportes",
      modulos: {
        clientes: {
          ver: true,
          crear: false,
          editar: false,
          eliminar: false
        },
        facturas_por_cobrar: {
          ver: true,
          crear: true,
          editar: false,
          eliminar: false,
          generar_reportes: true
        },
        facturas_por_pagar: {
          ver: true,
          crear: true,
          editar: false,
          eliminar: false,
          generar_reportes: true
        },
        cobros: {
          ver: true,
          crear: false,
          editar: false,
          generar_reportes: true
        },
        pagos_proveedores: {
          ver: true,
          crear: false,
          editar: false,
          generar_reportes: true
        },
        proveedores: {
          ver: true,
          crear: false,
          editar: false,
          eliminar: false
        },
        reportes: {
          acceso_total: true,
          generar_todos: true,
          exportar_excel: true
        },
        ia_chat: true,
        consultar_permisos: true,
        auditoria: true
      }
    },
    GERENTE_GENERAL_ROLE: {
      nombre: "Gerente General",
      descripcion: "Acceso completo con responsabilidad global",
      modulos: {
        clientes: {
          ver: true,
          crear: true,
          editar: true,
          eliminar: false,
          asignar_gerente: true,
          asignar_vendedor: true
        },
        facturas_por_cobrar: {
          ver: true,
          crear: true,
          editar: true,
          eliminar: false,
          cambiar_estado: true,
          generar_reportes: true
        },
        facturas_por_pagar: {
          ver: true,
          crear: true,
          editar: true,
          eliminar: false,
          cambiar_estado: true,
          generar_reportes: true
        },
        cobros: {
          ver: true,
          crear: true,
          editar: true,
          registrar_cobros: true
        },
        pagos_proveedores: {
          ver: true,
          crear: true,
          editar: true,
          registrar_pagos: true
        },
        proveedores: {
          ver: true,
          crear: true,
          editar: true,
          eliminar: false
        },
        reportes: {
          acceso_total: true,
          generar_todos: true,
          exportar_excel: true
        },
        ia_chat: true,
        consultar_permisos: true
      }
    },
    GERENTE_ROLE: {
      nombre: "Gerente de Ventas",
      descripcion: "Acceso a sus clientes asignados",
      modulos: {
        clientes: {
          ver: "sus_asignados",
          crear: false,
          editar: "sus_asignados",
          eliminar: false
        },
        facturas_por_cobrar: {
          ver: "sus_asignados",
          crear: false,
          editar: "sus_asignados",
          generar_reportes: "sus_asignados"
        },
        cobros: {
          ver: "sus_asignados",
          crear: true,
          editar: "sus_asignados",
          registrar_cobros: true
        },
        reportes: {
          acceso_limitado: true,
          ver_mis_clientes: true,
          exportar_excel: true
        },
        ia_chat: true,
        consultar_permisos: true
      }
    },
    VENDEDOR_ROLE: {
      nombre: "Vendedor",
      descripcion: "Acceso a sus clientes asignados",
      modulos: {
        clientes: {
          ver: "sus_asignados",
          crear: false,
          editar: "sus_asignados",
          eliminar: false
        },
        facturas_por_cobrar: {
          ver: "sus_asignados",
          crear: false,
          editar: false,
          generar_reportes: "sus_asignados"
        },
        cobros: {
          ver: "sus_asignados",
          crear: true,
          editar: false,
          registrar_cobros: true
        },
        reportes: {
          acceso_limitado: true,
          ver_mis_clientes: true,
          exportar_excel: true
        },
        ia_chat: true,
        consultar_permisos: true
      }
    },
    AUXILIAR_ROLE: {
      nombre: "Auxiliar",
      descripcion: "Acceso limitado a solo lectura",
      modulos: {
        clientes: {
          ver: true,
          crear: false,
          editar: false,
          eliminar: false
        },
        facturas_por_cobrar: {
          ver: true,
          crear: false,
          editar: false,
          eliminar: false
        },
        cobros: {
          ver: true,
          crear: false,
          editar: false
        },
        reportes: {
          ver_basicos: true,
          exportar_excel: false
        },
        ia_chat: false,
        consultar_permisos: true
      }
    },
    CLIENTE_ROLE: {
      nombre: "Cliente",
      descripcion: "Acceso limitado como cliente externo",
      modulos: {
        ver_mis_facturas: true,
        ver_mis_pagos: true,
        reportes_personales: true,
        ia_chat: false,
        consultar_permisos: true
      }
    }
  };

  return permisosMap[rol] || {
    nombre: "Rol desconocido",
    descripcion: "Permisos no definidos",
    modulos: {}
  };
};

/**
 * Generar resumen de permisos en formato legible para mostrar al usuario
 * @param {string} rol - El rol del usuario
 * @returns {string} Resumen formateado de permisos
 */
export const generarResumenPermisos = (rol) => {
  const permisos = obtenerPermisosDeRol(rol);
  
  let resumen = `## Permisos para el rol: ${permisos.nombre}\n\n`;
  resumen += `**Descripción:** ${permisos.descripcion}\n\n`;
  resumen += `### Acceso a módulos:\n`;

  const modulos = permisos.modulos || {};
  Object.entries(modulos).forEach(([modulo, acceso]) => {
    if (typeof acceso === "object" && acceso !== null) {
      resumen += `\n**${modulo}:**\n`;
      if (acceso.ver) {
        resumen += `- ✅ Ver: `;
        resumen += acceso.ver === true ? "Acceso total" : acceso.ver === false ? "No" : `Solo ${acceso.ver}`;
        resumen += "\n";
      }
      if (acceso.crear) {
        resumen += `- ✅ Crear: ${acceso.crear === true ? "Sí" : "No"}\n`;
      }
      if (acceso.editar) {
        resumen += `- ✅ Editar: `;
        resumen += acceso.editar === true ? "Sí" : acceso.editar === false ? "No" : `Solo ${acceso.editar}`;
        resumen += "\n";
      }
      if (acceso.eliminar) {
        resumen += `- ✅ Eliminar: ${acceso.eliminar === true ? "Sí" : "No"}\n`;
      }
    } else if (typeof acceso === "boolean") {
      resumen += `- ${acceso ? "✅" : "❌"} ${modulo}\n`;
    }
  });

  return resumen;
};
