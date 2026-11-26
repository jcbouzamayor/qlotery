let STORAGE_KEY = 'pena_lotera_v3.1';
let vistaActual = "morosos";
let mostrarTodosMovimientos = false;
let fotoInformeApuesta = null;

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

const VISTAS_CON_LISTADO = [
	"participantes",
	"morosos",
	"movimientos",
	"premios"
];

const PANELES_SUPERIORES = ["nuevaApuesta", "novoPremio", "panelAjustes", "recargaSaldo"];
const PANELES_PARTICIPANTES = ["formParticipante", "formEditarParticipante"];
const TODOS_LOS_PANELES = [...PANELES_SUPERIORES, ...PANELES_PARTICIPANTES];

function escaparHtml(texto) {
	return String(texto ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function cerrarMenuLateral() {
	let menu = document.getElementById("menuLateral");
	let botonMenu = document.getElementById("botonMenu");
	if (menu) {
		menu.setAttribute("hidden", "");
	}
	if (botonMenu) {
		botonMenu.setAttribute("aria-expanded", "false");
	}
}

function ocultarFormularios(ids) {
	ids.forEach((id) => {
		let el = document.getElementById(id);
		if (el) {
			el.setAttribute("hidden", "");
		}
	});
}

function mostrarListadoContenedor() {
	let contenedorListado = document.getElementById("listadoDinamico");
	if (contenedorListado) {
		contenedorListado.removeAttribute("hidden");
	}
}

function ocultarListadoContenedor() {
	let contenedorListado = document.getElementById("listadoDinamico");
	if (contenedorListado) {
		contenedorListado.setAttribute("hidden", "");
	}
}

function actualizarVisibilidadListadoSegunPaneles() {
	let hayPanelAbierto = TODOS_LOS_PANELES.some((id) => {
		let el = document.getElementById(id);
		return el && !el.hasAttribute("hidden");
	});

	if (hayPanelAbierto) {
		ocultarListadoContenedor();
	}
}

function guardarEstado() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

function cargarEstado() {
	let estadoRecuperado = localStorage.getItem(STORAGE_KEY);
	if (estadoRecuperado) {
		estado = JSON.parse(estadoRecuperado);
	}
}

function formatearEuros(euros) {
	let eurosFormateados = euros / 100;
	return eurosFormateados.toFixed(2) + " €";
}

function calcularBoteGlobal() {
	return calcularSaldosPersonales() + estado.botePremios;
}

function calcularSaldosPersonales() {
	let sumaSaldos = 0;
	for (let i = 0; i < estado.participantes.length; i++) {
		let saldoIndividual = estado.participantes[i].saldo;
		sumaSaldos += saldoIndividual;
	}
	return sumaSaldos;
}

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

function reenderizarEdicionParticipantes() {
	let listaEdicionParticipantes = document.getElementById("listadoEdicionParticipantes");
	if (!listaEdicionParticipantes) {
		return;
	}

	listaEdicionParticipantes.innerHTML = "";
	for (let i = 0; i < estado.participantes.length; i++) {
		let p = estado.participantes[i];
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
			for (let i = 0; i < estado.participantes.length; i++) {
				let p = estado.participantes[i];
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

function limpiarComentarios() {
	let mensajeApuesta = document.getElementById("mensajeApuesta");
	let mensajeAjustes = document.getElementById("mensajeAjustes");
	let aviso = document.getElementById("textoEditarParticipante");
	if (mensajeApuesta) mensajeApuesta.innerHTML = "";
	if (mensajeAjustes) mensajeAjustes.innerHTML = "";
	if (aviso) aviso.innerHTML = "";
}

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

function abrirAjustes() {
	let panel = document.getElementById("panelAjustes");
	let inputApuesta = document.getElementById("inputApuestaSemanal");
	let aviso = document.getElementById("mensajeAjustes");
	if (!panel) return;

	panel.toggleAttribute("hidden");
	if (!panel.hasAttribute("hidden")) {
		if (aviso) aviso.textContent = "";
		if (inputApuesta) {
			inputApuesta.value = (estado.apuestaSemanal / 100).toFixed(2);
			inputApuesta.focus();
		}
	}
}

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

function descargarInformeApuestaHtml({ tipoApuesta, importeCentimos }) {
	let fechaTexto = new Date().toLocaleString("es-ES");
	let fechaArchivo = new Date().toISOString().slice(0, 10);

	let morosos = estado.participantes.filter((p) => p.activo && Number(p.saldo) < 0);
	let participantesActivos = estado.participantes.filter((p) => p.activo);

	let filasMorosos =
		morosos.length === 0
			? '<p class="sin-datos">Non hai morosos tras esta aposta.</p>'
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
		}
	});
}

document.getElementById("botonMenu").addEventListener("click", (evento) => {
	evento.preventDefault();
	let menu = document.getElementById("menuLateral");
	let botonMenu = document.getElementById("botonMenu");
	if (!menu) return;

	menu.toggleAttribute("hidden");
	if (botonMenu) {
		botonMenu.setAttribute("aria-expanded", String(!menu.hasAttribute("hidden")));
	}
});

document.addEventListener("keydown", (evento) => {
	if (evento.key === "Escape") {
		cerrarMenuLateral();
	}
});

document.getElementById("guardarApuestaSemanal").addEventListener("click", (evento) => {
	evento.preventDefault();
	let inputApuesta = document.getElementById("inputApuestaSemanal");
	let inputImporteApuesta = document.getElementById("importeApuesta");
	let aviso = document.getElementById("mensajeAjustes");
	if (!inputApuesta) return;

	let limpia = inputApuesta.value.trim().replace(",", ".");
	let num = Number(limpia);

	if (limpia === "" || isNaN(num) || num <= 0) {
		if (aviso) aviso.textContent = "A aposta semanal non é correcta.";
		return;
	}

	estado.apuestaSemanal = Math.round(num * 100);
	if (inputImporteApuesta) {
		inputImporteApuesta.value = num;
	}
	guardarEstado();
	renderizarTotales();
	if (aviso) aviso.textContent = "Aposta semanal actualizada.";
});

cargarEstado();
renderizarTotales();
ocultarListadoContenedor();

document.getElementById("formParticipante").addEventListener("submit", (evento) => {
	evento.preventDefault();

	let aviso = document.getElementById("textoAdvertencia");
	let usuarioLimpio = document.getElementById("nuevoUsuario").value.trim();
	let saldoLimpio = document.getElementById("nuevoSaldo").value.trim().replace(",", ".");
	let saldoNumerico = 0;

	if (usuarioLimpio === "") {
		aviso.textContent = "O nome non pode estar baleiro.";
		return;
	}

	if (saldoLimpio !== "") {
		saldoNumerico = Number(saldoLimpio);
		if (isNaN(saldoNumerico) || saldoNumerico < 0) {
			aviso.textContent = "O saldo inicial no é correcto.";
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

	aviso.textContent = "";
	document.getElementById("formParticipante").reset();
	document.getElementById("formParticipante").setAttribute("hidden", "");
	vistaActual = "participantes";
	renderizarListado();
	ocultarListadoContenedor();
	let avisoEdicion = document.getElementById("textoEditarParticipante");
	if (avisoEdicion) avisoEdicion.innerHTML = "Participante gardado correctamente.";
});

document.getElementById("crearApuesta").addEventListener("click", (evento) => {
	evento.preventDefault();
	cerrarMenuLateral();
	limpiarComentarios();
	ocultarFormularios(["novoPremio", "panelAjustes", "recargaSaldo", ...PANELES_PARTICIPANTES]);

	let formularioApuesta = document.getElementById("nuevaApuesta");
	formularioApuesta.toggleAttribute("hidden");
	if (!formularioApuesta.hasAttribute("hidden")) {
		document.getElementById("importeApuesta").focus();
	}
	actualizarVisibilidadListadoSegunPaneles();
});

document.getElementById("guardarPremio").addEventListener("click", (evento) => {
	evento.preventDefault();
	cerrarMenuLateral();
	limpiarComentarios();
	ocultarFormularios(["nuevaApuesta", "panelAjustes", "recargaSaldo", ...PANELES_PARTICIPANTES]);

	let formularioPremio = document.getElementById("novoPremio");
	formularioPremio.toggleAttribute("hidden");
	if (!formularioPremio.hasAttribute("hidden")) {
		document.getElementById("importePremio").focus();
	}
	actualizarVisibilidadListadoSegunPaneles();
});

document.getElementById("botonAjustes").addEventListener("click", (evento) => {
	evento.preventDefault();
	cerrarMenuLateral();
	limpiarComentarios();
	ocultarFormularios(["nuevaApuesta", "novoPremio", "recargaSaldo", ...PANELES_PARTICIPANTES]);
	abrirAjustes();
	actualizarVisibilidadListadoSegunPaneles();
});

document.getElementById("nuevoParticipante").addEventListener("click", () => {
	cerrarMenuLateral();
	limpiarComentarios();
	ocultarFormularios([...PANELES_SUPERIORES, "formEditarParticipante"]);

	let formularioNuevoParticipante = document.getElementById("formParticipante");
	formularioNuevoParticipante.toggleAttribute("hidden");
	if (!formularioNuevoParticipante.hasAttribute("hidden")) {
		document.getElementById("nuevoUsuario").focus();
	}
	actualizarVisibilidadListadoSegunPaneles();
});

document.getElementById("editarParticipante").addEventListener("click", () => {
	cerrarMenuLateral();
	limpiarComentarios();
	ocultarFormularios([...PANELES_SUPERIORES, "formParticipante"]);

	let formularioEdicionParticipante = document.getElementById("formEditarParticipante");
	formularioEdicionParticipante.toggleAttribute("hidden");
	if (!formularioEdicionParticipante.hasAttribute("hidden")) {
		reenderizarEdicionParticipantes();
	}
	actualizarVisibilidadListadoSegunPaneles();
});

function cerrarFormulariosYMostrarVista(nuevaVista) {
	cerrarMenuLateral();
	ocultarFormularios(TODOS_LOS_PANELES);
	vistaActual = nuevaVista;
	renderizarListado();
	mostrarListadoContenedor();
	limpiarComentarios();
}

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

document.getElementById("nuevaApuesta").addEventListener("submit", (evento) => {
	evento.preventDefault();
	limpiarComentarios();

	let contadorActivos = 0;
	let apuestaIndividual = 0;
	let mensajeApuesta = document.getElementById("mensajeApuesta");
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
		if (mensajeApuesta) mensajeApuesta.innerHTML = "El importe no es correcto.";
		return;
	}

	if (!radioSeleccionado) {
		if (mensajeApuesta) mensajeApuesta.innerHTML = "Selecciona o tipo de aposta.";
		return;
	}

	let boteAfectado = radioSeleccionado.value;

	if (boteAfectado === "semanal") {
		if (contadorActivos === 0) {
			if (mensajeApuesta) mensajeApuesta.innerHTML = "Non hai participantes activos.";
			return;
		}

		let contadorMorosos = 0;
		let cantidadApostada = Math.round(importeNum * 100);
		apuestaIndividual = Math.ceil(cantidadApostada / contadorActivos);

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

		if (mensajeApuesta) mensajeApuesta.innerHTML = "Aposta semanal rexistrada correctamente.";
	} else if (boteAfectado === "extraordinaria") {
		let cantidadApostada = Math.round(importeNum * 100);
		estado.botePremios = estado.botePremios - cantidadApostada;
		registrarMovimientos(formatearEuros(cantidadApostada), "Aposta extraordinaria", "Desconta Bote Premios", "");
		renderizarTotales();
		guardarEstado();
		ocultarListadoContenedor();

		descargarInformeApuestaHtml({
			tipoApuesta: "extraordinaria",
			importeCentimos: cantidadApostada
		});

		if (mensajeApuesta) mensajeApuesta.innerHTML = "Aposta extraordinaria rexistrada correctamente.";
	}
});

document.getElementById("novoPremio").addEventListener("submit", (evento) => {
	evento.preventDefault();
	limpiarComentarios();
	let mensajePremio = document.getElementById("mensajeApuesta");
	let comentarioPremio = document.getElementById("comentarioPremio").value;
	let cadenaNumericaPremio = document.getElementById("importePremio").value;
	let cadenaLimpia = cadenaNumericaPremio.trim().replace(",", ".");

	if (cadenaLimpia === "" || isNaN(cadenaLimpia) || cadenaLimpia <= 0) {
		mensajePremio.innerHTML = "El importe no es correcto.";
		return;
	}

	let premio = Number(cadenaLimpia);
	let premioCentimos = Math.round(premio * 100);
	estado.botePremios += premioCentimos;
	mensajePremio.innerHTML = "Premio gardado correctamente.";
	vistaActual = "premios";
	registrarMovimientos(formatearEuros(premioCentimos), "Premios", "Suma Bote Premios", comentarioPremio);
	renderizarTotales();
	renderizarListado();
	guardarEstado();
});

document.getElementById("enviarEdicionParticipante").addEventListener("click", (evento) => {
	evento.preventDefault();
	limpiarComentarios();
	let aviso = document.getElementById("textoEditarParticipante");
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
			if (aviso) aviso.textContent = "Hai algún participante co nome baleiro.";
			return;
		}

		if (saldoTexto === "" || isNaN(saldoNum)) {
			if (aviso) aviso.textContent = "Hai algún saldo con formato incorrecto.";
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

	if (aviso) aviso.textContent = "Cambios gardados correctamente.";
});

document.getElementById("inputImportarJson").addEventListener("change", (evento) => {
	let aviso = document.getElementById("mensajeAjustes");
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
				if (aviso) aviso.textContent = "O ficheiro JSON non ten un formato válido para QLotery.";
				return;
			}

			estado = datos;
			guardarEstado();
			renderizarTotales();
			renderizarListado();
			ocultarListadoContenedor();

			let inputApuesta = document.getElementById("inputApuestaSemanal");
			if (inputApuesta) {
				inputApuesta.value = (estado.apuestaSemanal / 100).toFixed(2);
			}
			if (aviso) aviso.textContent = "Respaldo restaurado correctamente.";
		} catch (error) {
			if (aviso) aviso.textContent = "Erro ao ler o JSON: ficheiro corrupto ou non válido.";
		} finally {
			evento.target.value = "";
		}
	};

	lector.readAsText(archivo);
});

document.getElementById("exportarJson").addEventListener("click", () => {
	let aviso = document.getElementById("mensajeAjustes");
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

	if (aviso) aviso.textContent = "Respaldo JSON exportado.";
});

document.getElementById("resetApuestaSemanal").addEventListener("click", () => {
	document.getElementById("inputApuestaSemanal").value = (estado.apuestaSemanal / 100).toFixed(2);
});

document.getElementById("exportarMovimientosTxt").addEventListener("click", () => {
	let aviso = document.getElementById("mensajeAjustes");

	if (!estado.movimientos || estado.movimientos.length === 0) {
		if (aviso) aviso.textContent = "Non hai movementos para exportar.";
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

	if (aviso) aviso.textContent = "Movementos exportados a TXT.";
});

document.getElementById("sumarSaldo").addEventListener("click", () => {
	limpiarComentarios();
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
});

document.getElementById("botonRecargaSaldo").addEventListener("click", (evento) => {
	evento.preventDefault();
	limpiarComentarios();
	let mensajeSaldo = document.getElementById("mensajeApuesta");
	let selectParticipante = document.getElementById("selectParticipanteSaldo");
	let inputImporteRecarga = document.getElementById("inputRecarga");
	if (!selectParticipante || !inputImporteRecarga) return;

	let idSeleccionado = Number(selectParticipante.value);
	let participante = estado.participantes.find((p) => p.id === idSeleccionado);
	if (!participante) return;

	let importeLimpio = inputImporteRecarga.value.trim().replace(",", ".");
	let importeNum = Number(importeLimpio);

	if (importeLimpio === "" || Number.isNaN(importeNum) || importeNum <= 0) {
		if (mensajeSaldo) mensajeSaldo.innerHTML = "El importe no es correcto.";
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
	if (mensajeSaldo) mensajeSaldo.innerHTML = "Saldo engadido correctamente.";
});