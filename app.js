/* ==========================================================================
   CONFIGURACIÓN GLOBAL Y ESTADO INICIAL DE LA APLICACIÓN
   ========================================================================== */
let STORAGE_KEY = 'pena_lotera_v3.3';
let BACKUP_PREVIO_KEY = STORAGE_KEY + '_backup_previo';
let vistaActual = "morosos";
let mostrarTodosMovimientos = false;
let fotoInformeApuesta = null;

// Estructura principal de datos persistida en localStorage
let estado = {
	participantes: [
		{ id: 1, nombre: "Rafael Lugris", saldo: 600, activo: true },
		{ id: 2, nombre: "Borja Ardá", saldo: 900, activo: true },
		{ id: 3, nombre: "Luis Toimil", saldo: 200, activo: true },
		{ id: 4, nombre: "Bruno Tembrás", saldo: 500, activo: true },
		{ id: 5, nombre: "Juan Carlos González", saldo: 1900, activo: true },
		{ id: 6, nombre: "Angel Piñon", saldo: 900, activo: true },
		{ id: 7, nombre: "Oscar López", saldo: 100, activo: true },
		{ id: 8, nombre: "Jesus Freire", saldo: 1000, activo: true },
		{ id: 9, nombre: "David Lamas", saldo: 2100, activo: true },
		{ id: 10, nombre: "Roberto de la Puente", saldo: 200, activo: true },
		{ id: 11, nombre: "Azucena Rico", saldo: 1700, activo: true },
		{ id: 12, nombre: "Alberto Sebastian", saldo: 0, activo: true },
		{ id: 13, nombre: "Martin Lopez", saldo: 100, activo: true },
		{ id: 14, nombre: "Andres Castro", saldo: 1500, activo: true }
	],
	botePremios: 17676,
	apuestaSemanal: 1400,
	movimientos: []
};

// Agrupaciones de IDs de formularios para facilitar su ocultación en bloque
const PANELES_SUPERIORES = ["nuevaApuesta", "novoPremio", "panelAjustes", "recargaSaldo"];
const PANELES_PARTICIPANTES = ["formParticipante", "formEditarParticipante"];
const TODOS_LOS_PANELES = [...PANELES_SUPERIORES, ...PANELES_PARTICIPANTES];

/* ==========================================================================
   UTILIDADES GENERALES Y ACCESIBILIDAD (ARIA / MENÚS / PANELES)
   ========================================================================== */

// Escapa caracteres especiales HTML para evitar inyecciones al generar el informe descargable
function escaparHtml(texto) {
	return String(texto ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

// Actualiza el atributo aria-expanded de un botón según el estado visible de su panel asociado
function actualizarAriaExpanded(idBoton, expandido) {
	let boton = document.getElementById(idBoton);
	if (boton) {
		boton.setAttribute("aria-expanded", String(Boolean(expandido)));
	}
}

// Sincroniza los estados ARIA de los botones de menú y subpaneles de ajustes
function sincronizarEstadosAria() {
	let menuLateral = document.getElementById("menuLateral");
	let menuAjustes = document.getElementById("menuAjustes");
	let panelAjustes = document.getElementById("panelAjustes");
	let seccionApuesta = document.getElementById("seccionApuestaSemanal");
	let seccionBackup = document.getElementById("seccionBackup");

	actualizarAriaExpanded("botonMenu", menuLateral && !menuLateral.hasAttribute("hidden"));
	actualizarAriaExpanded("botonAjustes", menuAjustes && !menuAjustes.hasAttribute("hidden"));

	let panelAbierto = panelAjustes && !panelAjustes.hasAttribute("hidden");
	actualizarAriaExpanded(
		"botonEditarApuestaSemanal",
		panelAbierto && seccionApuesta && !seccionApuesta.hasAttribute("hidden")
	);
	actualizarAriaExpanded(
		"botonCopiaSeguridad",
		panelAbierto && seccionBackup && !seccionBackup.hasAttribute("hidden")
	);
}

// Oculta el menú desplegable de listados (botón hamburguesa)
function cerrarMenuLateral() {
	let menu = document.getElementById("menuLateral");
	if (menu) {
		menu.setAttribute("hidden", "");
	}
	actualizarAriaExpanded("botonMenu", false);
}

// Oculta el menú desplegable de ajustes (icono engranaje)
function cerrarMenuAjustes() {
	let menuAjustes = document.getElementById("menuAjustes");
	if (menuAjustes) {
		menuAjustes.setAttribute("hidden", "");
	}
	actualizarAriaExpanded("botonAjustes", false);
}

// Cierra ambos menús desplegables de la cabecera
function cerrarMenusDesplegables() {
	cerrarMenuLateral();
	cerrarMenuAjustes();
}

// Oculta todos los elementos cuyos IDs se pasen en el array
function ocultarFormularios(ids) {
	ids.forEach((id) => {
		let el = document.getElementById(id);
		if (el) {
			el.setAttribute("hidden", "");
		}
	});
	sincronizarEstadosAria();
}

// Oculta los subpaneles internos del formulario de ajustes
function ocultarSubpanelesAjustes() {
	ocultarFormularios(["seccionApuestaSemanal", "seccionBackup"]);
}

// Cierra todos los formularios y subpaneles abiertos en pantalla
function cerrarTodosLosPaneles() {
	ocultarFormularios(TODOS_LOS_PANELES);
	ocultarSubpanelesAjustes();
}

// Muestra el contenedor principal de listados
function mostrarListadoContenedor() {
	let contenedorListado = document.getElementById("listadoDinamico");
	if (contenedorListado) {
		contenedorListado.removeAttribute("hidden");
	}
}

// Oculta el contenedor principal de listados
function ocultarListadoContenedor() {
	let contenedorListado = document.getElementById("listadoDinamico");
	if (contenedorListado) {
		contenedorListado.setAttribute("hidden", "");
	}
}

// Oculta el listado si hay algún formulario abierto para evitar solapamientos visuales
function actualizarVisibilidadListadoSegunPaneles() {
	let hayPanelAbierto = TODOS_LOS_PANELES.some((id) => {
		let el = document.getElementById(id);
		return el && !el.hasAttribute("hidden");
	});

	if (hayPanelAbierto) {
		ocultarListadoContenedor();
	}
}

/* ==========================================================================
   PERSISTENCIA EN LOCALSTORAGE Y CÁLCULOS MONETARIOS
   ========================================================================== */

// Guarda el objeto estado actual en localStorage
function guardarEstado() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

// Guarda una copia preventiva en localStorage antes de sobrescribir datos al restaurar un JSON
function guardarRespaldoPreventivo() {
	try {
		localStorage.setItem(
			BACKUP_PREVIO_KEY,
			JSON.stringify({
				guardadoEn: new Date().toISOString(),
				estado: estado
			})
		);
	} catch (error) {
		// Si localStorage está lleno o bloqueado, no interrumpimos el flujo principal
	}
}

// Recupera el estado guardado en localStorage al iniciar la aplicación
function cargarEstado() {
	let estadoRecuperado = localStorage.getItem(STORAGE_KEY);
	if (estadoRecuperado) {
		estado = JSON.parse(estadoRecuperado);
	}
}

// Convierte un importe entero en céntimos a cadena formateada en euros (ej: 1400 -> "14.00 €")
function formatearEuros(euros) {
	let eurosFormateados = euros / 100;
	return eurosFormateados.toFixed(2) + " €";
}

// Calcula el bote global sumando los saldos individuales y el bote de premios
function calcularBoteGlobal() {
	return calcularSaldosPersonales() + estado.botePremios;
}

// Suma los saldos actuales de todos los participantes (en céntimos)
function calcularSaldosPersonales() {
	let sumaSaldos = 0;
	for (let i = 0; i < estado.participantes.length; i++) {
		let saldoIndividual = estado.participantes[i].saldo;
		sumaSaldos += saldoIndividual;
	}
	return sumaSaldos;
}

// Devuelve una copia del array de participantes ordenada alfabéticamente por nombre
function obtenerParticipantesOrdenadosAlfabetico() {
	return [...estado.participantes].sort((a, b) =>
		String(a.nombre ?? "").localeCompare(String(b.nombre ?? ""), "es", {
			sensitivity: "base"
		})
	);
}

/* ==========================================================================
   RENDERIZADO DE VISTAS, LISTADOS Y FORMULARIOS DINÁMICOS
   ========================================================================== */

// Dibuja las dos tarjetas superiores con el Bote total y el Bote de premios
function renderizarTotales() {
	let visor = document.getElementById("visorTotales");
	if (!visor) return;

	let boteGlobalTexto = formatearEuros(calcularBoteGlobal());
	let botePremiosTexto = formatearEuros(estado.botePremios);

	visor.innerHTML =
		'<div class="tarjeta-bote">' +
			'<span class="etiqueta-bote">Bote total</span>' +
			'<strong class="valor-bote">' + boteGlobalTexto + '</strong>' +
		'</div>' +
		'<div class="tarjeta-bote">' +
			'<span class="etiqueta-bote">Bote premios</span>' +
			'<strong class="valor-bote">' + botePremiosTexto + '</strong>' +
		'</div>';
}

// Genera las filas editables de participantes ordenadas alfabéticamente en el formulario de edición
function reenderizarEdicionParticipantes() {
	let listaEdicionParticipantes = document.getElementById("listadoEdicionParticipantes");
	if (!listaEdicionParticipantes) {
		return;
	}

	let participantesOrdenados = obtenerParticipantesOrdenadosAlfabetico();

	listaEdicionParticipantes.innerHTML = "";
	for (let i = 0; i < participantesOrdenados.length; i++) {
		let p = participantesOrdenados[i];
		let li = document.createElement("li");
		li.dataset.id = p.id;

		let inputNombre = document.createElement("input");
		inputNombre.type = "text";
		inputNombre.name = "nombre";
		inputNombre.defaultValue = p.nombre;
		inputNombre.value = p.nombre;

		let inputSaldo = document.createElement("input");
		inputSaldo.type = "text";
		inputSaldo.inputMode = "decimal";
		inputSaldo.name = "saldo";
		let saldoEuros = (p.saldo / 100).toFixed(2);
		inputSaldo.defaultValue = saldoEuros;
		inputSaldo.value = saldoEuros;

		let labelActivo = document.createElement("label");
		let checkActivo = document.createElement("input");
		checkActivo.type = "checkbox";
		checkActivo.name = "activo";
		checkActivo.defaultChecked = p.activo;
		checkActivo.checked = p.activo;
		labelActivo.append(checkActivo, " Activo");

		li.append(inputNombre, " ", inputSaldo, " ", labelActivo);
		listaEdicionParticipantes.appendChild(li);
	}
}

// Renderiza el listado principal según la vista activa (participantes, morosos, movimientos o premios)
function renderizarListado() {
	let listado = document.getElementById("listado");
	if (!listado) {
		return;
	}

	let btnExportarTxt = document.getElementById("exportarMovimientosTxt");
	if (btnExportarTxt) {
		if (vistaActual === "movimientos") {
			btnExportarTxt.removeAttribute("hidden");
		} else {
			btnExportarTxt.setAttribute("hidden", "");
		}
	}

	listado.innerHTML = "";
	switch (vistaActual) {
		case "participantes": {
			let participantesOrdenados = obtenerParticipantesOrdenadosAlfabetico();

			for (let i = 0; i < participantesOrdenados.length; i++) {
				let p = participantesOrdenados[i];
				let li = document.createElement("li");
				li.dataset.id = p.id;
				li.textContent = p.nombre + " - " + formatearEuros(p.saldo) + " - " + (p.activo ? "Activo" : "Inactivo");
				listado.appendChild(li);
			}
			break;
		}
		case "morosos": {
			for (let i = 0; i < estado.participantes.length; i++) {
				let p = estado.participantes[i];
				if (p.saldo < 0 && p.activo) {
					let li = document.createElement("li");
					li.dataset.id = p.id;
					li.textContent = p.nombre + " -> " + formatearEuros(p.saldo);
					listado.appendChild(li);
				}
			}
			break;
		}
		case "movimientos": {
			if (estado.movimientos.length === 0) {
				let li = document.createElement("li");
				li.textContent = "Non hai movementos rexistrados.";
				listado.appendChild(li);
			} else {
				let movimientosOrdenados = [...estado.movimientos].reverse();
				let movimientosVisibles = mostrarTodosMovimientos
					? movimientosOrdenados
					: movimientosOrdenados.slice(0, 10);

				for (let i = 0; i < movimientosVisibles.length; i++) {
					let m = movimientosVisibles[i];
					let li = document.createElement("li");
					li.textContent =
						m.fecha +
						" - " +
						m.importe +
						" - " +
						m.concepto +
						" - " +
						m.afectaA +
						(m.comentario ? " - " + m.comentario : "");
					listado.appendChild(li);
				}
			}
			break;
		}
		case "premios": {
			let hayPremios = false;
			for (let i = 0; i < estado.movimientos.length; i++) {
				if (estado.movimientos[i].concepto === "Premios") {
					hayPremios = true;
					let li = document.createElement("li");
					li.textContent =
						estado.movimientos[i].fecha +
						" - " +
						estado.movimientos[i].importe +
						" - " +
						estado.movimientos[i].concepto +
						" - " +
						estado.movimientos[i].afectaA +
						(estado.movimientos[i].comentario ? " - " + estado.movimientos[i].comentario : "");
					listado.appendChild(li);
				}
			}
			if (!hayPremios) {
				let li = document.createElement("li");
				li.textContent = "Non hai premios rexistrados.";
				listado.appendChild(li);
			}
			break;
		}
	}
}

// Añade un nuevo participante al estado, guarda en localStorage y refresca la interfaz
function agregarParticipante(nombre, saldo) {
	let nuevoParticipante = {
		id: Date.now(),
		nombre: nombre,
		saldo: saldo,
		activo: true
	};
	estado.participantes.push(nuevoParticipante);
	guardarEstado();
	renderizarTotales();
	renderizarListado();
}

// Limpia todos los mensajes de aviso o error visibles en pantalla
function limpiarComentarios() {
	let mensajeApuesta = document.getElementById("mensajeApuesta");
	let mensajeAjustes = document.getElementById("mensajeAjustes");
	let aviso = document.getElementById("textoEditarParticipante");
	let advertencia = document.getElementById("textoAdvertencia");
	if (mensajeApuesta) mensajeApuesta.textContent = "";
	if (mensajeAjustes) mensajeAjustes.textContent = "";
	if (aviso) aviso.textContent = "";
	if (advertencia) advertencia.textContent = "";
}

// Muestra un mensaje de aviso o confirmación en el contenedor indicado limpiando avisos previos
function mostrarFeedback(idElemento, texto) {
	limpiarComentarios();
	let el = document.getElementById(idElemento);
	if (el) {
		el.textContent = texto;
	}
}

// Registra una nueva entrada en el historial de movimientos y guarda el estado
function registrarMovimientos(importe, concepto, afecta, comentario) {
	let nuevoMovimiento = {
		id: Date.now(),
		fecha: new Date().toLocaleDateString("es-ES"),
		importe: importe,
		concepto: concepto,
		afectaA: afecta,
		comentario: comentario
	};
	estado.movimientos.push(nuevoMovimiento);
	guardarEstado();
}

// Abre o cierra un subpanel concreto dentro de #panelAjustes (apuesta semanal o copia de seguridad)
function abrirSubpanelAjustes(idSeccion) {
	let panel = document.getElementById("panelAjustes");
	let seccion = document.getElementById(idSeccion);
	if (!panel || !seccion) return;

	let yaEstabaVisible = !panel.hasAttribute("hidden") && !seccion.hasAttribute("hidden");
	ocultarSubpanelesAjustes();

	if (yaEstabaVisible) {
		panel.setAttribute("hidden", "");
	} else {
		panel.removeAttribute("hidden");
		seccion.removeAttribute("hidden");

		if (idSeccion === "seccionApuestaSemanal") {
			let inputApuesta = document.getElementById("inputApuestaSemanal");
			if (inputApuesta) {
				inputApuesta.value = (estado.apuestaSemanal / 100).toFixed(2);
				inputApuesta.focus();
			}
		}
	}

	actualizarVisibilidadListadoSegunPaneles();
	sincronizarEstadosAria();
}

// Rellena el desplegable de recarga de saldo ordenando a los participantes de menor a mayor saldo
function rellenarSelectParticipantesSaldo() {
	let selectParticipanteSaldo = document.getElementById("selectParticipanteSaldo");
	if (!selectParticipanteSaldo) return;
	selectParticipanteSaldo.innerHTML = "";

	let participantesOrdenados = [...estado.participantes].sort(
		(a, b) => Number(a.saldo) - Number(b.saldo)
	);

	for (let i = 0; i < participantesOrdenados.length; i++) {
		let participanteActual = participantesOrdenados[i];
		let saldoNum = Number(participanteActual.saldo);
		let saldoFormateado = formatearEuros(saldoNum);
		let textoSelect = participanteActual.nombre + " (" + saldoFormateado + ")";
		let opcion = document.createElement("option");
		opcion.value = participanteActual.id;
		opcion.textContent = textoSelect;
		selectParticipanteSaldo.appendChild(opcion);
	}
}

/* ==========================================================================
   GESTIÓN DE IMÁGENES Y GENERACIÓN DEL INFORME HTML DE APUESTA
   ========================================================================== */

// Redimensiona y comprime la imagen seleccionada del resguardo para incrustarla en el informe HTML
function prepararFotoDesdeArchivo(archivo) {
	return new Promise((resolve, reject) => {
		let lector = new FileReader();
		lector.onload = () => {
			let img = new Image();
			img.onload = () => {
				let maxAncho = 900;
				let ancho = img.width;
				let alto = img.height;

				if (ancho > maxAncho) {
					alto = Math.round((alto * maxAncho) / ancho);
					ancho = maxAncho;
				}

				let canvas = document.createElement("canvas");
				canvas.width = ancho;
				canvas.height = alto;
				let ctx = canvas.getContext("2d");
				ctx.drawImage(img, 0, 0, ancho, alto);
				resolve(canvas.toDataURL("image/jpeg", 0.82));
			};
			img.onerror = reject;
			img.src = lector.result;
		};
		lector.onerror = reject;
		lector.readAsDataURL(archivo);
	});
}

// Comprueba si hay imagen adjunta y pide confirmación al usuario si no existe
function confirmarApuestaSinFoto() {
	if (fotoInformeApuesta) {
		return true;
	}
	return window.confirm(
		"Non se adxuntou ningunha imaxe. Crear a aposta igualmente?"
	);
}

// Genera y descarga un archivo HTML autocontenido con el resumen de la apuesta, morosos, saldos y foto
function descargarInformeApuestaHtml({ tipoApuesta, importeCentimos }) {
	let fechaTexto = new Date().toLocaleString("es-ES");
	let fechaArchivo = new Date().toISOString().slice(0, 10);

	let morosos = estado.participantes.filter((p) => p.activo && Number(p.saldo) < 0);
	let participantesActivos = estado.participantes.filter((p) => p.activo);

	let filasMorosos =
		morosos.length === 0
			? '<p class="sin-datos">Non hai morosos esta semana.</p>'
			: '<ul class="lista-informe">' +
				morosos
					.map(
						(p) =>
							'<li class="moroso"><span>' +
							escaparHtml(p.nombre) +
							'</span><strong>' +
							escaparHtml(formatearEuros(p.saldo)) +
							'</strong></li>'
					)
					.join("") +
				'</ul>';

	let filasSaldos =
		'<table class="tabla-saldos"><thead><tr><th>Participante</th><th>Saldo</th></tr></thead><tbody>' +
		participantesActivos
			.map((p) => {
				let claseSaldo = Number(p.saldo) < 0 ? "negativo" : "";
				return (
					'<tr><td>' +
					escaparHtml(p.nombre) +
					'</td><td class="' +
					claseSaldo +
					'">' +
					escaparHtml(formatearEuros(p.saldo)) +
					'</td></tr>'
				);
			})
			.join("") +
		'</tbody></table>';

	let bloqueFoto = fotoInformeApuesta
		? '<section class="card"><h2>Foto adxunta</h2><img src="' +
			fotoInformeApuesta +
			'" alt="Foto da aposta" class="foto-apuesta"></section>'
		: "";

	let htmlDocumento =
		'<!DOCTYPE html><html lang="gl"><head><meta charset="UTF-8">' +
		'<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
		'<title>Informe aposta QLotery - ' +
		escaparHtml(fechaArchivo) +
		'</title><style>' +
		'body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#eef5fc;color:#0f2942;margin:0;padding:16px;}' +
		'.contenedor{max-width:680px;margin:0 auto;}' +
		'.cabecera{background:#003a70;color:#fff;padding:16px 20px;border-radius:12px;margin-bottom:14px;}' +
		'.cabecera h1{margin:0 0 6px 0;font-size:1.35rem;}' +
		'.cabecera p{margin:0;font-size:0.9rem;opacity:0.9;}' +
		'.card{background:#fff;border:1px solid #c6dcf2;border-radius:12px;padding:16px;margin-bottom:14px;}' +
		'.card h2{margin:0 0 10px 0;font-size:1.05rem;color:#003a70;}' +
		'.lista-informe{list-style:none;padding:0;margin:0;}' +
		'.lista-informe li{display:flex;justify-content:space-between;padding:8px 10px;border-radius:8px;background:#fff5f5;border:1px solid #f3c6c6;margin-bottom:6px;color:#8e1b1b;}' +
		'.sin-datos{margin:0;color:#1f6b50;font-weight:600;}' +
		'.tabla-saldos{width:100%;border-collapse:collapse;font-size:0.95rem;}' +
		'.tabla-saldos th,.tabla-saldos td{padding:8px 10px;border-bottom:1px solid #e2ecf6;text-align:left;}' +
		'.tabla-saldos th:last-child,.tabla-saldos td:last-child{text-align:right;}' +
		'.negativo{color:#b42318;font-weight:700;}' +
		'.foto-apuesta{display:block;max-width:100%;height:auto;border-radius:10px;border:1px solid #c6dcf2;}' +
		'</style></head><body><div class="contenedor">' +
		'<header class="cabecera"><h1>QLotery · Informe de aposta</h1><p>' +
		escaparHtml(fechaTexto) +
		'</p></header>' +
		'<section class="card"><h2>Resumo da aposta</h2>' +
		'<p><strong>Tipo:</strong> ' +
		escaparHtml(tipoApuesta === "semanal" ? "Aposta semanal" : "Aposta extraordinaria") +
		'</p>' +
		'<p><strong>Importe:</strong> ' +
		escaparHtml(formatearEuros(importeCentimos)) +
		'</p>' +
		'<p><strong>Bote premios actual:</strong> ' +
		escaparHtml(formatearEuros(estado.botePremios)) +
		'</p></section>' +
		bloqueFoto +
		'<section class="card"><h2>Morosos (' +
		morosos.length +
		')</h2>' +
		filasMorosos +
		'</section>' +
		'<section class="card"><h2>Saldos actuais</h2>' +
		filasSaldos +
		'</section>' +
		'</div></body></html>';

	let blob = new Blob([htmlDocumento], { type: "text/html;charset=utf-8" });
	let url = URL.createObjectURL(blob);
	let enlace = document.createElement("a");
	enlace.href = url;
	enlace.download = "qlotery_informe_apuesta_" + fechaArchivo + ".html";
	document.body.appendChild(enlace);
	enlace.click();
	enlace.remove();
	URL.revokeObjectURL(url);
}

/* ==========================================================================
   EVENTOS DE NAVEGACIÓN, MENÚS Y SUBPANELES DE AJUSTES
   ========================================================================== */

// Procesa la foto del resguardo cuando el usuario selecciona una imagen
let inputFotoEl = document.getElementById("inputFotoApuesta");
if (inputFotoEl) {
	inputFotoEl.addEventListener("change", async (evento) => {
		let archivo = evento.target.files && evento.target.files[0];
		if (!archivo) {
			fotoInformeApuesta = null;
			return;
		}
		try {
			fotoInformeApuesta = await prepararFotoDesdeArchivo(archivo);
		} catch (error) {
			fotoInformeApuesta = null;
			mostrarFeedback("mensajeApuesta", "Non se puido cargar a imaxe do resgardo.");
		}
	});
}

// Alterna el menú lateral de listados (botón hamburguesa)
document.getElementById("botonMenu").addEventListener("click", (evento) => {
	evento.preventDefault();
	let menu = document.getElementById("menuLateral");
	if (!menu) return;

	limpiarComentarios();
	cerrarMenuAjustes();
	menu.toggleAttribute("hidden");
	sincronizarEstadosAria();
});

// Alterna el menú desplegable de ajustes (icono engranaje)
document.getElementById("botonAjustes").addEventListener("click", (evento) => {
	evento.preventDefault();
	let menuAjustes = document.getElementById("menuAjustes");
	if (!menuAjustes) return;

	limpiarComentarios();
	cerrarMenuLateral();
	menuAjustes.toggleAttribute("hidden");
	sincronizarEstadosAria();
});

// Cierra menús, paneles y avisos al pulsar la tecla Escape
document.addEventListener("keydown", (evento) => {
	if (evento.key === "Escape") {
		cerrarMenusDesplegables();
		cerrarTodosLosPaneles();
		limpiarComentarios();
	}
});

// Abre el subpanel para editar el importe de la apuesta semanal
document.getElementById("botonEditarApuestaSemanal").addEventListener("click", (evento) => {
	evento.preventDefault();
	cerrarMenusDesplegables();
	limpiarComentarios();
	ocultarFormularios(["nuevaApuesta", "novoPremio", "recargaSaldo", ...PANELES_PARTICIPANTES]);
	abrirSubpanelAjustes("seccionApuestaSemanal");
});

// Abre el subpanel de exportación e importación de copias de seguridad (.json)
document.getElementById("botonCopiaSeguridad").addEventListener("click", (evento) => {
	evento.preventDefault();
	cerrarMenusDesplegables();
	limpiarComentarios();
	ocultarFormularios(["nuevaApuesta", "novoPremio", "recargaSaldo", ...PANELES_PARTICIPANTES]);
	abrirSubpanelAjustes("seccionBackup");
});

// Guarda el nuevo importe por defecto de la apuesta semanal
document.getElementById("guardarApuestaSemanal").addEventListener("click", (evento) => {
	evento.preventDefault();
	let inputApuesta = document.getElementById("inputApuestaSemanal");
	let inputImporteApuesta = document.getElementById("importeApuesta");
	if (!inputApuesta) return;

	let limpia = inputApuesta.value.trim().replace(",", ".");
	let num = Number(limpia);

	if (limpia === "" || isNaN(num) || num <= 0) {
		mostrarFeedback("mensajeAjustes", "A aposta semanal non é correcta.");
		return;
	}

	estado.apuestaSemanal = Math.round(num * 100);
	if (inputImporteApuesta) {
		inputImporteApuesta.value = num;
	}
	guardarEstado();
	renderizarTotales();
	mostrarFeedback("mensajeAjustes", "Aposta semanal actualizada.");
});

/* ==========================================================================
   ARRANQUE INICIAL DE LA APLICACIÓN
   ========================================================================== */
cargarEstado();
renderizarTotales();
ocultarListadoContenedor();
sincronizarEstadosAria();

/* ==========================================================================
   EVENTOS DE PARTICIPANTES (ALTA, EDICIÓN Y CONSULTA)
   ========================================================================== */

// Valida y da de alta un nuevo participante desde #formParticipante
document.getElementById("formParticipante").addEventListener("submit", (evento) => {
	evento.preventDefault();

	let usuarioLimpio = document.getElementById("nuevoUsuario").value.trim();
	let saldoLimpio = document.getElementById("nuevoSaldo").value.trim().replace(",", ".");
	let saldoNumerico = 0;

	if (usuarioLimpio === "") {
		mostrarFeedback("textoAdvertencia", "O nome non pode estar baleiro.");
		return;
	}

	if (saldoLimpio !== "") {
		saldoNumerico = Number(saldoLimpio);
		if (isNaN(saldoNumerico) || saldoNumerico < 0) {
			mostrarFeedback("textoAdvertencia", "O saldo inicial no é correcto.");
			return;
		}
	}

	let saldoCentimos = Math.round(saldoNumerico * 100);
	agregarParticipante(usuarioLimpio, saldoCentimos);

	if (saldoCentimos > 0) {
		registrarMovimientos(
			formatearEuros(saldoCentimos),
			"Novo participante",
			usuarioLimpio,
			"Saldo inicial  " + formatearEuros(saldoCentimos)
		);
	}

	document.getElementById("formParticipante").reset();
	document.getElementById("formParticipante").setAttribute("hidden", "");
	vistaActual = "participantes";
	renderizarListado();
	ocultarListadoContenedor();
	sincronizarEstadosAria();
	mostrarFeedback("textoEditarParticipante", "Participante gardado correctamente.");
});

// Abre o cierra el formulario de nueva apuesta
document.getElementById("crearApuesta").addEventListener("click", (evento) => {
	evento.preventDefault();
	cerrarMenusDesplegables();
	limpiarComentarios();
	ocultarSubpanelesAjustes();
	ocultarFormularios(["novoPremio", "panelAjustes", "recargaSaldo", ...PANELES_PARTICIPANTES]);

	let formularioApuesta = document.getElementById("nuevaApuesta");
	formularioApuesta.toggleAttribute("hidden");
	if (!formularioApuesta.hasAttribute("hidden")) {
		document.getElementById("importeApuesta").focus();
	}
	actualizarVisibilidadListadoSegunPaneles();
	sincronizarEstadosAria();
});

// Abre o cierra el formulario de guardar premio
document.getElementById("guardarPremio").addEventListener("click", (evento) => {
	evento.preventDefault();
	cerrarMenusDesplegables();
	limpiarComentarios();
	ocultarSubpanelesAjustes();
	ocultarFormularios(["nuevaApuesta", "panelAjustes", "recargaSaldo", ...PANELES_PARTICIPANTES]);

	let formularioPremio = document.getElementById("novoPremio");
	formularioPremio.toggleAttribute("hidden");
	if (!formularioPremio.hasAttribute("hidden")) {
		document.getElementById("importePremio").focus();
	}
	actualizarVisibilidadListadoSegunPaneles();
	sincronizarEstadosAria();
});

// Abre o cierra el formulario para añadir un participante
document.getElementById("nuevoParticipante").addEventListener("click", () => {
	cerrarMenusDesplegables();
	limpiarComentarios();
	ocultarSubpanelesAjustes();
	ocultarFormularios([...PANELES_SUPERIORES, "formEditarParticipante"]);

	let formularioNuevoParticipante = document.getElementById("formParticipante");
	formularioNuevoParticipante.toggleAttribute("hidden");
	if (!formularioNuevoParticipante.hasAttribute("hidden")) {
		document.getElementById("nuevoUsuario").focus();
	}
	actualizarVisibilidadListadoSegunPaneles();
	sincronizarEstadosAria();
});

// Abre o cierra el formulario de edición masiva de participantes
document.getElementById("editarParticipante").addEventListener("click", () => {
	cerrarMenusDesplegables();
	limpiarComentarios();
	ocultarSubpanelesAjustes();
	ocultarFormularios([...PANELES_SUPERIORES, "formParticipante"]);

	let formularioEdicionParticipante = document.getElementById("formEditarParticipante");
	formularioEdicionParticipante.toggleAttribute("hidden");
	if (!formularioEdicionParticipante.hasAttribute("hidden")) {
		reenderizarEdicionParticipantes();
	}
	actualizarVisibilidadListadoSegunPaneles();
	sincronizarEstadosAria();
});

// Cierra cualquier formulario abierto y muestra el listado correspondiente a la vista elegida
function cerrarFormulariosYMostrarVista(nuevaVista) {
	cerrarMenusDesplegables();
	cerrarTodosLosPaneles();
	limpiarComentarios();
	vistaActual = nuevaVista;
	renderizarListado();
	mostrarListadoContenedor();
}

// Botones del menú lateral para cambiar entre los distintos listados
document.getElementById("mostrarParticipantes").addEventListener("click", () => {
	cerrarFormulariosYMostrarVista("participantes");
});

document.getElementById("mostrarMorosos").addEventListener("click", () => {
	cerrarFormulariosYMostrarVista("morosos");
});

document.getElementById("mostrarMovimientos").addEventListener("click", () => {
	cerrarFormulariosYMostrarVista("movimientos");
});

document.getElementById("mostrarPremios").addEventListener("click", () => {
	cerrarFormulariosYMostrarVista("premios");
});

/* ==========================================================================
   PROCESAMIENTO DE APUESTAS, PREMIOS, EDICIÓN DE PARTICIPANTES Y SALDOS
   ========================================================================== */

// Valida, pide confirmación (incluyendo aviso si falta foto) y registra una apuesta
document.getElementById("nuevaApuesta").addEventListener("submit", (evento) => {
	evento.preventDefault();
	limpiarComentarios();

	let contadorActivos = 0;
	let apuestaIndividual = 0;
	let cadenaCantidadApostada = document.getElementById("importeApuesta").value;
	let cadenaLimpia = cadenaCantidadApostada.trim().replace(",", ".");
	let radioSeleccionado = document.querySelector('input[name="tipoApuesta"]:checked');
	let importeNum = Number(cadenaLimpia);

	for (let i = 0; i < estado.participantes.length; i++) {
		if (estado.participantes[i].activo) {
			contadorActivos++;
		}
	}

	if (cadenaLimpia === "" || isNaN(importeNum) || importeNum <= 0) {
		mostrarFeedback("mensajeApuesta", "El importe no es correcto.");
		return;
	}

	if (!radioSeleccionado) {
		mostrarFeedback("mensajeApuesta", "Selecciona o tipo de aposta.");
		return;
	}

	let boteAfectado = radioSeleccionado.value;

	if (boteAfectado === "semanal") {
		if (contadorActivos === 0) {
			mostrarFeedback("mensajeApuesta", "Non hai participantes activos.");
			return;
		}

		if (!confirmarApuestaSinFoto()) {
			mostrarFeedback("mensajeApuesta", "Aposta semanal cancelada por falta de imaxe.");
			return;
		}

		let cantidadApostada = Math.round(importeNum * 100);
		apuestaIndividual = Math.ceil(cantidadApostada / contadorActivos);

		let confirmado = window.confirm(
			"Confirmar aposta semanal de " +
				formatearEuros(cantidadApostada) +
				" (" +
				formatearEuros(apuestaIndividual) +
				" por participante activo)?"
		);
		if (!confirmado) {
			mostrarFeedback("mensajeApuesta", "Aposta semanal cancelada.");
			return;
		}

		let contadorMorosos = 0;

		for (let i = 0; i < estado.participantes.length; i++) {
			if (estado.participantes[i].activo) {
				estado.participantes[i].saldo = estado.participantes[i].saldo - apuestaIndividual;
			}
		}

		renderizarTotales();
		registrarMovimientos(formatearEuros(cantidadApostada), "Aposta semanal", "Desconta saldo individual", "");
		guardarEstado();

		for (let i = 0; i < estado.participantes.length; i++) {
			if (estado.participantes[i].activo && estado.participantes[i].saldo < 0) {
				contadorMorosos++;
			}
		}

		if (contadorMorosos > 0) {
			vistaActual = "morosos";
			renderizarListado();
			mostrarListadoContenedor();
		} else {
			ocultarListadoContenedor();
		}

		descargarInformeApuestaHtml({
			tipoApuesta: "semanal",
			importeCentimos: cantidadApostada
		});

		let formularioApuesta = document.getElementById("nuevaApuesta");
		if (formularioApuesta) {
			formularioApuesta.reset();
			formularioApuesta.setAttribute("hidden", "");
		}
		fotoInformeApuesta = null;
		actualizarVisibilidadListadoSegunPaneles();
		sincronizarEstadosAria();

		mostrarFeedback("mensajeApuesta", "Aposta semanal rexistrada correctamente.");
	} else if (boteAfectado === "extraordinaria") {
		if (!confirmarApuestaSinFoto()) {
			mostrarFeedback("mensajeApuesta", "Aposta extraordinaria cancelada por falta de imaxe.");
			return;
		}

		let cantidadApostada = Math.round(importeNum * 100);

		let confirmado = window.confirm(
			"Confirmar aposta extraordinaria de " +
				formatearEuros(cantidadApostada) +
				" con cargo ao Bote de Premios?"
		);
		if (!confirmado) {
			mostrarFeedback("mensajeApuesta", "Aposta extraordinaria cancelada.");
			return;
		}

		estado.botePremios = estado.botePremios - cantidadApostada;
		registrarMovimientos(formatearEuros(cantidadApostada), "Aposta extraordinaria", "Desconta Bote Premios", "");
		renderizarTotales();
		guardarEstado();
		ocultarListadoContenedor();

		descargarInformeApuestaHtml({
			tipoApuesta: "extraordinaria",
			importeCentimos: cantidadApostada
		});

		let formularioApuesta = document.getElementById("nuevaApuesta");
		if (formularioApuesta) {
			formularioApuesta.reset();
			formularioApuesta.setAttribute("hidden", "");
		}
		fotoInformeApuesta = null;
		actualizarVisibilidadListadoSegunPaneles();
		sincronizarEstadosAria();

		mostrarFeedback("mensajeApuesta", "Aposta extraordinaria rexistrada correctamente.");
	}
});

// Valida y suma un premio al bote de premios registrando el movimiento
document.getElementById("novoPremio").addEventListener("submit", (evento) => {
	evento.preventDefault();
	limpiarComentarios();
	let comentarioPremio = document.getElementById("comentarioPremio").value;
	let cadenaNumericaPremio = document.getElementById("importePremio").value;
	let cadenaLimpia = cadenaNumericaPremio.trim().replace(",", ".");

	if (cadenaLimpia === "" || isNaN(cadenaLimpia) || cadenaLimpia <= 0) {
		mostrarFeedback("mensajeApuesta", "El importe no es correcto.");
		return;
	}

	let premio = Number(cadenaLimpia);
	let premioCentimos = Math.round(premio * 100);
	estado.botePremios += premioCentimos;
	vistaActual = "premios";
	registrarMovimientos(formatearEuros(premioCentimos), "Premios", "Suma Bote Premios", comentarioPremio);
	renderizarTotales();
	renderizarListado();
	ocultarListadoContenedor();
	guardarEstado();

	let formularioPremio = document.getElementById("novoPremio");
	if (formularioPremio) {
		formularioPremio.reset();
		formularioPremio.setAttribute("hidden", "");
	}
	actualizarVisibilidadListadoSegunPaneles();
	sincronizarEstadosAria();

	mostrarFeedback("mensajeApuesta", "Premio gardado correctamente.");
});

// Valida y guarda los cambios de nombre, saldo y estado activo de todos los participantes editados
document.getElementById("enviarEdicionParticipante").addEventListener("click", (evento) => {
	evento.preventDefault();
	limpiarComentarios();
	let filas = document.querySelectorAll("#listadoEdicionParticipantes li");
	let cambiosPreparados = [];

	for (let i = 0; i < filas.length; i++) {
		let li = filas[i];
		let id = Number(li.dataset.id);
		let inputNombre = li.querySelector('input[name="nombre"]');
		let inputSaldo = li.querySelector('input[name="saldo"]');
		let checkActivo = li.querySelector('input[name="activo"]');

		let nombre = inputNombre ? inputNombre.value.trim() : "";
		let saldoTexto = inputSaldo ? inputSaldo.value.trim().replace(",", ".") : "";
		let activo = checkActivo ? checkActivo.checked : false;
		let saldoNum = Number(saldoTexto);

		if (nombre === "") {
			mostrarFeedback("textoEditarParticipante", "Hai algún participante co nome baleiro.");
			return;
		}

		if (saldoTexto === "" || isNaN(saldoNum)) {
			mostrarFeedback("textoEditarParticipante", "Hai algún saldo con formato incorrecto.");
			return;
		}

		cambiosPreparados.push({
			id: id,
			nombre: nombre,
			saldoCentimos: Math.round(saldoNum * 100),
			activo: activo
		});
	}

	for (let i = 0; i < cambiosPreparados.length; i++) {
		let cambio = cambiosPreparados[i];
		let participante = estado.participantes.find((p) => p.id === cambio.id);
		if (!participante) continue;

		let nombreAnterior = participante.nombre;
		let saldoAnterior = participante.saldo;
		let activoAnterior = participante.activo;

		if (nombreAnterior !== cambio.nombre) {
			registrarMovimientos(
				formatearEuros(0),
				"Edición participante",
				cambio.nombre,
				"Nome: " + nombreAnterior + " -> " + cambio.nombre
			);
		}

		if (saldoAnterior !== cambio.saldoCentimos) {
			registrarMovimientos(
				formatearEuros(cambio.saldoCentimos),
				"Nuevo saldo",
				cambio.nombre,
				"Saldo: " + formatearEuros(saldoAnterior) + " -> " + formatearEuros(cambio.saldoCentimos)
			);
		}

		if (activoAnterior !== cambio.activo) {
			registrarMovimientos(
				formatearEuros(0),
				"Estado participante",
				cambio.nombre,
				"Estado: " + (activoAnterior ? "Activo" : "Inactivo") + " -> " + (cambio.activo ? "Activo" : "Inactivo")
			);
		}

		participante.nombre = cambio.nombre;
		participante.saldo = cambio.saldoCentimos;
		participante.activo = cambio.activo;
	}

	guardarEstado();
	renderizarTotales();

	let formularioEdicionParticipante = document.getElementById("formEditarParticipante");
	if (formularioEdicionParticipante) {
		formularioEdicionParticipante.setAttribute("hidden", "");
	}

	vistaActual = "participantes";
	renderizarListado();
	ocultarListadoContenedor();
	sincronizarEstadosAria();
	mostrarFeedback("textoEditarParticipante", "Cambios gardados correctamente.");
});

/* ==========================================================================
   COPIAS DE SEGURIDAD (.JSON) Y EXPORTACIÓN DE MOVIMIENTOS (.TXT)
   ========================================================================== */

// Importa y restaura una copia de seguridad JSON previa confirmación y respaldo preventivo
document.getElementById("inputImportarJson").addEventListener("change", (evento) => {
	limpiarComentarios();
	let archivo = evento.target.files && evento.target.files[0];
	if (!archivo) return;

	let lector = new FileReader();
	lector.onload = () => {
		try {
			let datos = JSON.parse(lector.result);
			let estructuraValida =
				datos &&
				typeof datos === "object" &&
				Array.isArray(datos.participantes) &&
				typeof datos.botePremios === "number" &&
				typeof datos.apuestaSemanal === "number" &&
				Array.isArray(datos.movimientos);

			if (!estructuraValida) {
				mostrarFeedback("mensajeAjustes", "O ficheiro JSON non ten un formato válido para QLotery.");
				return;
			}

			let confirmado = window.confirm(
				"Restaurar este respaldo sobrescribirá os datos actuais. Gardarase unha copia preventiva previa en localStorage. Continuar?"
			);
			if (!confirmado) {
				mostrarFeedback("mensajeAjustes", "Restauración cancelada.");
				return;
			}

			guardarRespaldoPreventivo();
			estado = datos;
			guardarEstado();
			renderizarTotales();
			renderizarListado();
			ocultarListadoContenedor();

			let inputApuesta = document.getElementById("inputApuestaSemanal");
			if (inputApuesta) {
				inputApuesta.value = (estado.apuestaSemanal / 100).toFixed(2);
			}
			mostrarFeedback("mensajeAjustes", "Respaldo restaurado correctamente (copia previa gardada).");
		} catch (error) {
			mostrarFeedback("mensajeAjustes", "Erro ao ler o JSON: ficheiro corrupto ou non válido.");
		} finally {
			evento.target.value = "";
		}
	};

	lector.readAsText(archivo);
});

// Descarga una copia de seguridad completa del estado actual en formato .json
document.getElementById("exportarJson").addEventListener("click", () => {
	limpiarComentarios();
	let fechaHoy = new Date().toISOString().slice(0, 10);
	let jsonStr = JSON.stringify(estado, null, 2);
	let blob = new Blob([jsonStr], { type: "application/json" });
	let url = URL.createObjectURL(blob);

	let enlace = document.createElement("a");
	enlace.href = url;
	enlace.download = "qlotery_respaldo_" + fechaHoy + ".json";
	document.body.appendChild(enlace);
	enlace.click();
	enlace.remove();
	URL.revokeObjectURL(url);

	mostrarFeedback("mensajeAjustes", "Respaldo JSON exportado.");
});

// Restaura en el campo de texto el valor actual guardado de la apuesta semanal
document.getElementById("resetApuestaSemanal").addEventListener("click", () => {
	limpiarComentarios();
	document.getElementById("inputApuestaSemanal").value = (estado.apuestaSemanal / 100).toFixed(2);
});

// Exporta el historial completo de movimientos a un archivo de texto plano (.txt)
document.getElementById("exportarMovimientosTxt").addEventListener("click", () => {
	limpiarComentarios();

	if (!estado.movimientos || estado.movimientos.length === 0) {
		mostrarFeedback("mensajeAjustes", "Non hai movementos para exportar.");
		return;
	}

	let fechaHoy = new Date().toISOString().slice(0, 10);
	let lineas = [...estado.movimientos].reverse().map((m) => {
		return (
			m.fecha +
			" | " +
			m.importe +
			" | " +
			m.concepto +
			" | " +
			m.afectaA +
			(m.comentario ? " | " + m.comentario : "")
		);
	});

	let contenidoTxt = lineas.join("\n");
	let blob = new Blob([contenidoTxt], { type: "text/plain;charset=utf-8" });
	let url = URL.createObjectURL(blob);

	let enlace = document.createElement("a");
	enlace.href = url;
	enlace.download = "qlotery_movementos_" + fechaHoy + ".txt";
	document.body.appendChild(enlace);
	enlace.click();
	enlace.remove();
	URL.revokeObjectURL(url);

	mostrarFeedback("mensajeAjustes", "Movementos exportados a TXT.");
});

/* ==========================================================================
   RECARGA INDIVIDUAL DE SALDO
   ========================================================================== */

// Abre o cierra el formulario de recarga de saldo y carga el selector de participantes
document.getElementById("sumarSaldo").addEventListener("click", () => {
	cerrarMenusDesplegables();
	limpiarComentarios();
	ocultarSubpanelesAjustes();
	ocultarFormularios(["nuevaApuesta", "novoPremio", "panelAjustes", ...PANELES_PARTICIPANTES]);
	let formRecarga = document.getElementById("recargaSaldo");
	if (!formRecarga) return;
	formRecarga.toggleAttribute("hidden");
	if (!formRecarga.hasAttribute("hidden")) {
		rellenarSelectParticipantesSaldo();
		let inputRecarga = document.getElementById("inputRecarga");
		if (inputRecarga) {
			inputRecarga.focus();
		}
	}
	actualizarVisibilidadListadoSegunPaneles();
	sincronizarEstadosAria();
});

// Valida y suma el importe recargado al saldo del participante seleccionado
document.getElementById("botonRecargaSaldo").addEventListener("click", (evento) => {
	evento.preventDefault();
	limpiarComentarios();
	let selectParticipante = document.getElementById("selectParticipanteSaldo");
	let inputImporteRecarga = document.getElementById("inputRecarga");
	if (!selectParticipante || !inputImporteRecarga) return;

	let idSeleccionado = Number(selectParticipante.value);
	let participante = estado.participantes.find((p) => p.id === idSeleccionado);
	if (!participante) return;

	let importeLimpio = inputImporteRecarga.value.trim().replace(",", ".");
	let importeNum = Number(importeLimpio);

	if (importeLimpio === "" || Number.isNaN(importeNum) || importeNum <= 0) {
		mostrarFeedback("mensajeApuesta", "El importe no es correcto.");
		return;
	}

	let importeEnCentimos = Math.round(importeNum * 100);
	participante.saldo += importeEnCentimos;

	registrarMovimientos(
		formatearEuros(importeEnCentimos),
		"Engadir saldo",
		participante.nombre,
		"Saldo engadido (" + formatearEuros(participante.saldo) + ")"
	);

	inputImporteRecarga.value = "0";
	guardarEstado();
	renderizarTotales();
	renderizarListado();

	let formRecarga = document.getElementById("recargaSaldo");
	if (formRecarga) formRecarga.setAttribute("hidden", "");
	actualizarVisibilidadListadoSegunPaneles();
	sincronizarEstadosAria();
	mostrarFeedback("mensajeApuesta", "Saldo engadido correctamente.");
});