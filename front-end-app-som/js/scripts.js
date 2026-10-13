document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {

    // Botón ATRÁS de Android
    document.addEventListener("backbutton", function (e) {
        e.preventDefault();

      var mensajeSalida = "Esta acción cerrará la aplicación. ¿Seguro que desea salir?";

      if (navigator.notification && navigator.notification.confirm) {
        navigator.notification.confirm(
          mensajeSalida,
          function (resultado) {
            if (resultado === 1) {
              navigator.app.exitApp();
            }
          },
          "Salir",
          ["Aceptar", "Cancelar"]
        );
      } else if (window.confirm(mensajeSalida)) {
        navigator.app.exitApp();
        }
    }, false);


    // Enlaces externos: mailto, tel y whatsapp
    $(document).on(
        "click",
        'a[href^="mailto:"], a[href^="tel:"], a[href^="whatsapp:"]',
        function (e) {
            e.preventDefault();

            var href = $(this)
                .attr("href")
                .replaceAll(" ", "");

            cordova.InAppBrowser.open(href, "_system");
        }
    );
}


const versionAPP = "v2.5.5";
const baseurl = "som.com.ar";

const isAndroid = /Android/i.test(navigator.userAgent);

var ubicaciones = [];
var token = "";
var codigoInmo = "";
var codigoSuc = "";
var rol = "";
var paginaResultado = 1;
var paginaConsultas = 0;
var ordenResultado = 2;
var oferta;
var idConsulta = 0;
var idFicha = 0;
var ofertasGuardadas = [];
var cambioFotos = false;
var codigoBorrar = "";
var codigoRehabilitar = "";
var urlWhatsapp = "";

var ubicaciones = [];

var scrollTop = 0;

$(document).ready(function()
{
    $('#btntablistado').click(function(e) {
        window.setTimeout(scrollWin, 2);
    });

    if (localStorage.getItem("dirExacta") === null) {
        localStorage.setItem("dirExacta", false);
    }

    if (localStorage.getItem("infoContacto") === null) {
        localStorage.setItem("infoContacto", true);
    }

});


function mensaje(mensaje)
{
    M.toast({html: mensaje, classes: 'rounded', displayLength: 1000});
}

function obtenerParametros(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

function llamarLoginService()
{
    var request = new XMLHttpRequest();
    var url = "https://apmovil." + baseurl + "/LoginService.ashx";

    var body = JSON.stringify({ Token: token });

    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            console.log("LoginService response", request.status, request.responseText);
        }
    };

    request.open("POST", url, true);
    request.setRequestHeader("Content-Type", "application/json");
    request.send(body);
}

function cargarFicha(idOferta)
{
    $(".listado").removeClass("blue lighten-5");
    $("#" + idOferta).addClass("blue lighten-5");
    scrollCap();
    idFicha = idOferta;

    mensaje("<i class='material-icons red-text'>hourglass_full</i> Cargando...");

    var contenido = "";

    var request = new XMLHttpRequest();

    document.getElementById('emailFicha').value = "";
    document.getElementById('mapa').innerHTML = "";

    var url = "https://apmovil." + baseurl + "/BusquedaServiceV3.aspx?token=" + token + "&codigoInmobiliaria=" + codigoInmo + "&codigoSucursal=" + codigoSuc + "&Id=" + idOferta;

    var cod = $('#codigoBuscar').val();
    if(cod != "")
    {
      cod = cod.replace(/\s/g, '').toUpperCase();
      url = "https://apmovil." + baseurl + "/BusquedaServiceV3.aspx?token=" + token + "&codigoInmobiliaria=" + codigoInmo + "&codigoSucursal=" + codigoSuc + "&Codigo=" + cod;
      $("#btnBuscar").attr("onclick", "cargarBusqueda()");
    }

    request.open('GET', url, true);
    request.onload = function() {
      var ofer = JSON.parse(this.response);

      if (request.status < 200){
        mensaje("Ha ocurrido un error. Intente nuevamente.");
      }

      oferta = ofer;
      $("#contenidoFicha").removeClass("hide");
      $("#datosInmobiliaria").removeClass("hide");

      $(document).ready(function(){

        var atribs = "";

        if(oferta.Codigo != "")
        {
          contenido = "<div class='col s12'>";

          if(oferta.fotos !== null)
          {
            var galeria = "<br><div class='btnGaleria'><a class='btnFoto left' href='javascript:fotoAnterior()'><i class='material-icons'>chevron_left</i></a>" +
                            "<a class='btnFoto right' href='javascript:fotoSiguiente()'><i class='material-icons'>chevron_right</i></a></div><div class='slider'><ul class='slides'>";
            if(oferta.fotos.length > 0)
            {
              for (var i = 0; i < oferta.fotos.length; i++) {
                galeria += "<li><img src='https://apmovil." + baseurl + "/imagenes/grande/" + oferta.fotos[i].url + "'></li>";
              }
            }

            if(oferta.planos !== null)
            {
              if(oferta.planos.length > 0)
              {
                for (var i = 0; i < oferta.planos.length; i++) {
                  galeria += "<li><img src='https://apmovil." + baseurl + "/imagenes/grande/" + oferta.planos[i].url + "'></li>"
                }
              }
            }

            galeria += "</ul></div>";
            contenido += galeria;

            $(document).ready(function(){
              $('.slider').slider(
                {
                  indicators: false,
                  height: 400
                });
              $('.slider').slider('pause');
            });
          }

          contenido += "<br><div class='precio'><h6 class='centrado'><i class='material-icons iconoresultado'>home</i>" + oferta.TipoPropiedad + ", " + oferta.SubtipoPropiedad + "</h6>";

          contenido += "<h6 class='red-text centrado'><b>" + oferta.TipoOperacion + " " + oferta.Moneda + " " + oferta.Importe + "</b></h6>";

          if(oferta.Reservada === "Si")
          {
            contenido += "<h6 class='red-text centrado'>Oferta Reservada</h6>";
          }

          // AGREGAR LA DIRECCION

          if(oferta.Referencia !== "" && oferta.Referencia !== null)
          {
            if(armarDireccion(oferta) !== "")
            {
              contenido += "<h6 class='centrado'><i class='material-icons iconoresultado'>place</i>" + armarDireccion(oferta) + "</h6>";
              contenido += "<h6 class='centrado'>" + oferta.Referencia + "</h6>";
            }
            else
            {
              contenido += "<h6 class='centrado'><i class='material-icons iconoresultado'>place</i>" + oferta.Referencia + "</h6>";
            }
            contenido += "<h6 class='centrado'>" + oferta.Ubicacion.replace("CIUDAD AUTONOMA BUENOS AIRES","C.A.B.A.") + "</h6>";
          }
          else
          {
            contenido += "<h6 class='centrado'><i class='material-icons iconoresultado'>place</i>" + armarDireccion(oferta) + "</h6>";
            contenido += "<h6 class='centrado'><i class='material-icons iconoresultado'>place</i>" + oferta.Ubicacion.replace("CIUDAD AUTONOMA BUENOS AIRES","C.A.B.A.") + "</h6>";
          }

          contenido += "<h6 class='centrado'>Sup. Cubierta: <b>" + oferta.SubCub + " " + oferta.UnidadMedida + "</b><br>Sup. Total: <b>" + oferta. SupTot + " " + oferta.UnidadMedida + "</b></h6>";

          contenido += "<h6 class='centrado'>Código: <b><a href='javascript:copiarLink()'>" + oferta.Codigo + "&nbsp;  <i class='material-icons tiny'>content_copy</i></a></b></h6><h6 class='centrado'>Estado: <b>" + oferta.EstadoOferta + "</b></h6></div>";

          contenido += "<br><div class='destacable margen'><h6>" + oferta.Destacable.replaceAll("-","") + "</h6></div>";

          contenido += "</div>";

          document.getElementById('mostrarFicha').innerHTML = contenido;

          document.getElementById('atributos').innerHTML = "";

          var atributos = oferta.Atributos.split(";");

          for (var i = 0; i < atributos.length - 1; i++) {
            atribs = atribs + "<li><i class='material-icons blue-grey-text iconos-atributos'>keyboard_arrow_right</i>" + atributos[i].replace(":",": ") + "</li>";
          }

          if(oferta.Atributos.length > 0)
          {
            document.getElementById('atributos').innerHTML = "<h6 class='blue-text'>Características: </h6><ul class='atributos'>" + atribs + "</ul>";
          }

          if(oferta.Latitud !== 0 && oferta.Longitud !== 0 && oferta.Latitud !== "" && oferta.Longitud !== "")
          {
            document.getElementById('mapa').innerHTML = "<iframe height='500' width='100%' frameborder='0' src='mapa.html?latitud=" + oferta.Latitud + "&longitud=" + oferta.Longitud + "'></iframe>";
          }

          var url = "https://sistema." + baseurl + "/" + oferta.UrlFicha;

          url = corregirUrl(url);

          urlWhatsapp = url;

          var contacto = "";

          if(isAndroid)
          {
            contacto = "<a class='btn green fullwidth whatsapp' href='whatsapp://send?text=" + url + "' data-action='share/whatsapp/share'>" +
              "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Compartir por Whatsapp</a>";
          }
          else
          {
            contacto = "<a class='btn green fullwidth whatsapp' href='https://api.whatsapp.com/send?text=" + url + "' data-action='share/whatsapp/share'>" +
	        "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Compartir por Whatsapp</a>";
          }

          var linkemail = "mailto:?subject=Ficha%20Compartida%20desde%20sistema%20SOM&body=" + url;

          contacto += "<a class='blue btn fullwidth share modal-trigger' href='" + linkemail + "'><i class='material-icons left'>mail</i>Compartir por Email</a>";

          if(buscarGuardadas(idFicha))
          {
            contacto += "<a id='dislike" + idFicha + "' class='grey btn fullwidth share waves-effect waves-light' onclick='' href='javascript:noMeGusta()'><i class='material-icons left'>favorite_border</i>Ya no me gusta</a>";
          }
          else
          {
            contacto += "<a id='like" + idFicha + "' class='pink btn fullwidth share waves-effect waves-light' onclick='' href='javascript:meGusta()'><i class='material-icons left'>favorite_border</i>Me gusta esta oferta</a>";
          }


          document.getElementById('compartir').innerHTML = contacto;

          var datosInmo = "";

          datosInmo += "<br><img class='bordes' src='https://sistema." + baseurl + "/img/logos/" + oferta.Codigo.substring(0,3) + ".gif'>";

          datosInmo += "<h6><b>" + oferta.InmobiliariaNombre + "</b></h6>";

          if(oferta.InmobiliariaTelefono !== "" && oferta.InmobiliariaTelefono !== null)
          {
            datosInmo += "<h6>Teléfono: <b><a href='tel:+" + formatoTelefono(oferta.InmobiliariaTelefono) + "'>" + oferta.InmobiliariaTelefono + "</a></b></h6>";
          }

          if(oferta.InmobiliariaEmail !== "" && oferta.InmobiliariaEmail !== null)
          {
            datosInmo += "<h6 style='font-size: 3.6vw'>Email: <b><a href='mailto:" + oferta.InmobiliariaEmail + "'>" + oferta.InmobiliariaEmail + "</a></b></h6>";
          }
          if(oferta.InmobiliariaWhatsapp !== "" && oferta.InmobiliariaWhatsapp !== null)
          {
            if(isAndroid)
            {
                datosInmo += "<h6>Whatsapp: <b><a href='whatsapp://send?phone=" + formatoTelefono(oferta.InmobiliariaWhatsapp) + "'>" + oferta.InmobiliariaWhatsapp + "</a></b></h6>";
            }
            else
            {
                datosInmo += "<h6>Whatsapp: <b><a href='https://api.whatsapp.com/send?phone=" + formatoTelefono(oferta.InmobiliariaWhatsapp) + "'>" + oferta.InmobiliariaWhatsapp + "</a></b></h6>";
            }
          }

          document.getElementById('datosInmobiliaria').innerHTML = datosInmo;
          $(".tabs").tabs("select", "ficha");

          document.documentElement.scrollTop = 0;
        }
        else
        {
          mensaje("No se han encontrado resultados...");
        }

      });
    }
    request.send();
}

function corregirUrl(url) {
  const partes = url.split("-");

  if (localStorage.getItem("dirExacta") === "true" && localStorage.getItem("infoContacto") === "true" ) {
    partes.splice(4, 0, "sfce");
  }

  if (localStorage.getItem("dirExacta") === "true" && localStorage.getItem("infoContacto") === "false" ) {
    partes.splice(4, 0, "sdce");
  }

  if (localStorage.getItem("dirExacta") === "false" && localStorage.getItem("infoContacto") === "true" ) {
    partes.splice(4, 0, "sfc");
  }

  if (localStorage.getItem("dirExacta") === "false" && localStorage.getItem("infoContacto") === "false" ) {
    partes.splice(4, 0, "sdc");
  }

  return partes.join("-");
}

function formatoTelefono(tel)
{
  return tel.replaceAll("(","").replaceAll("-","").replaceAll(")","").replaceAll(" ","").replaceAll("+","");
}

function meGusta()
{
  mensaje("<i class='material-icons red-text'>favorite</i> ¡Te gusta esta oferta!");
  ofertasGuardadas.push(idFicha);

  $("#" + idFicha).addClass("green lighten-3");
}

function noMeGusta()
{
  mensaje("<i class='material-icons red-text'>thumb_down</i> ¡Ya no te gusta esta oferta!");
  const indexOferta = ofertasGuardadas.indexOf(idFicha);

  ofertasGuardadas.splice(indexOferta, 1);

  $("#" + idFicha).removeClass("green lighten-3");
}

function fotoAnterior()
{
  $('.slider').slider('prev');
  $('.slider').slider('pause');
}

function fotoSiguiente()
{
  $('.slider').slider('next');
  $('.slider').slider('pause');
}

function enviarFicha(idOferta)
{
  mensaje("Enviando ficha, aguarde un intante...");
  var clave = localStorage.getItem('tokenSOM');
  var user = localStorage.getItem('userSOM');
  var msj = "";
  var destinatario = document.getElementById('emailFicha').value;
  var request = new XMLHttpRequest();

  var url = "http://sgi." + baseurl + "/api/enviarficha.php?usuario=" + user + "&clave=" + clave + "&IdInmueble=" + idOferta + "&destinatario='" + destinatario + "'";

  request.open('GET', url, true);

    request.onload = function() {
    var data = JSON.parse(this.response);

      if (request.status >= 200 && request.readyState == 4) {
        if(data["Estado"])
        {
          msj = data["Mensaje"];
        }
      }
      else
      {
        msj = "Ha ocurrido un error. Intente nuevamente.";
      }
      mensaje(msj);
    }
    $('#escribirEmail').modal('close');
    request.send();
}

function verContacto(idContacto)
{
	$("#contenidoContacto").empty();
	var request = new XMLHttpRequest();

	var contenido = "<h5 class='centrado'><i class='material-icons'>person</i>&nbsp;Datos de contacto</h5>";

  request.open('GET', 'http://sgi.' + baseurl + '/api/inmobiliaria.php?idInmobiliaria=' + idContacto, true);

    request.onload = function() {
	var data = JSON.parse(this.response);

      if (request.status < 200) {
        mensaje("Ha ocurrido un error. Intente nuevamente.");
      }

      contenido = contenido + "<div class='col s12 centrado'><b>" + data['Inmobiliaria'].Nombre + "</b></h6></div><div class='col s12 centrado'>";

      if(data['Inmobiliaria'].HorarioAtencion != null && data['Inmobiliaria'].HorarioAtencion != "")
		  {
		contenido = contenido + "<br><br>Horario de atenci&oacute;n:" + data['Inmobiliaria'].HorarioAtencion;
	    }

	    if(data['Inmobiliaria'].Responsable != null && data['Inmobiliaria'].Responsable != "")
		  {
		contenido = contenido + "<br><br>Responsable ante el CISA: " + data['Inmobiliaria'].Responsable;
	    }

      if(data['Telefonos'].length > 0)
		  {
			  contenido = contenido + "<br><br>Tel&eacute;fono: " + data['Telefonos'][0] + "<br><br><a href='tel:" + data['Telefonos'][0] + "' class='btn blue' style='width:140px'><i class='material-icons right'>phone</i>llamar</a>";
	    }

      for (var i = 0; i < data['TelefonosConTipo'].length; i++) {
        if(data['TelefonosConTipo'][i].Tipo == "WhatsApp")
        {
          var tel = data['TelefonosConTipo'][i].CodigoPais + " " + data['TelefonosConTipo'][i].CodigoArea + " " + data['TelefonosConTipo'][i].Numero;
          var tel = data['TelefonosConTipo'][i].CodigoPais + " " + data['TelefonosConTipo'][i].CodigoArea + " " + data['TelefonosConTipo'][i].Numero;

          if(isAndroid)
          {
            contenido += "<br><br><a class='btn blue-grey fullwidth whatsapp' style='text-align: right; width:140px' href='whatsapp://send?phone=" + tel + "&text=Contacto por la ficha " + oferta.codigo +
              "' data-action='share/whatsapp/share'>Contactar</a>";
          }
          else
          {
            contenido += "<br><br><a class='btn blue-grey fullwidth whatsapp' style='text-align: right; width:140px' href='https://api.whatsapp.com/send?phone=" + tel + "&text=Contacto por la ficha " + oferta.codigo +
              "' data-action='share/whatsapp/share'>Contactar</a>";
          }
          break;
        }
      }

	    if(data['Emails'].length > 0)
		  {
			  contenido = contenido + "<br><br>Email: <a href='mailto:" + data['Emails'][0] + "'>" + data['Emails'][0] + "</a>";
	    }

      contenido = contenido + "</div>";

      $("#contenidoContacto").append(contenido);
    }

    request.send();

	$('#contacto').modal('open');
}

function armarDireccion(oferta)
{
  var direccion = "";

  if(oferta.Calle != "")
  {
    direccion += oferta.Calle;
  }

  if(oferta.Altura != "")
  {
    direccion += " " + oferta.Altura;
  }

  if(oferta.Piso != "")
  {
    direccion += ", Piso " + oferta.Piso;
  }

  return direccion;
}

function altaOferta()
{
  $('#editarInv').removeClass("disabled");
  $('#fotosInv').removeClass("disabled");
  $('#invEditar').removeClass("tab-inactiva");
  $('#invArchivos').removeClass("tab-inactiva");
  $('input').val('');
  $('#destacable').val('');
  $(".tabs").tabs("select", "editar");
  cerrarMapa();
  $('#codigo').text("");
  $('#reservada').prop('checked', false);
  $('select').prop('selectedIndex',0);
  $('select').formSelect();
}

function limpiarBusqueda()
{
  $(".listado").removeClass("blue lighten-5");
  $('input').val('');
  $('select').prop('selectedIndex',0);
  $('select').formSelect();

  var checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(function(checkbox) {
      checkbox.checked = false;
  });

}

function cargarConsultas(reiniciar = false)
{
  mensaje("<i class='material-icons red-text'>hourglass_full</i> Cargando, un momento por favor...");
  var request = new XMLHttpRequest();

  token = obtenerParametros("token");

  $("#mostrarconsulta").addClass("hide");

  if(reiniciar)
  {
    paginaConsultas = 0;
    document.getElementById('itemConsultas').innerHTML = "";
  }

  var url = "https://apmovil." + baseurl + "/ConsultasService.aspx?token=" + token + "&pagina=" + paginaConsultas;

  request.open('GET',url, true);

  var consulta = "";

  var clase = "";

  request.onload = function() {
  var data = JSON.parse(this.response);

    if (request.status < 200) {
      mensaje("Ha ocurrido un error. Intente nuevamente.");
    }

    if(data.length < 1)
    {
      if(paginaConsultas === 0)
      {
        var consulta = "<div class='col s12 center-align'><i class='material-icons red-text large'>edit</i><br><h5>No se encontraron consultas.</h5></div>";
        $('#itemConsultas').append(consulta);
      }
      $("#cargarMasConsultas").addClass("hide");
    }
    else
    {
      data.forEach(con => {

        if(con.Respondida)
        {
          clase = clase.replace("green lighten-4","");
          clase = "grey lighten-3 respondida";
        }
        else
        {
          clase = clase.replace("grey lighten-3 respondida","");
          clase = "green lighten-4";
        }

        var fotoConsulta = con.UrlFoto && con.UrlFoto !== "" && con.UrlFoto !== null
          ? "https://apmovil." + baseurl + "/imagenes/chico/" + con.UrlFoto
          : "images/noimage80.jpg";

        consulta =  "<div onclick='javascript:verConsulta(" + con.IdContacto + ")' class='col s12 padding consulta " + clase + "'><div class='col s4 center-align'><img class='bordes' src='" + fotoConsulta + "'><br><b>" + con.Oferta + "</b></div><div class='col s8 center-align'><span class='truncate'><b>" + con.Nombre + "</b></span>" +
                    "<b>Tel: " + con.Telefono + "</b><br>" +
                    "<b>Email: " + con.Email + "</b><br>" +
                    "Fecha: <b>" + con.Fecha.split(' ')[0] + "</b>" +
        "</div></div>";
        $('#itemConsultas').append(consulta);
      });

      paginaConsultas++;
      if(data.length < 20)
      {
        $("#cargarMasConsultas").addClass("hide");
      }
      else
      {
        $("#cargarMasConsultas").removeClass("hide");
      }
    }
  }
  request.send();
}

function limpiarConsulta(texto) {
    return texto.replace(/<br\s*\/?>/gi, '');
}

function verConsulta(idCon)
{
  $('#respuesta').val("");
  $('#respuesta').attr("disabled", false);
  $('#respuesta').addClass('hide');
  $('#responderConsulta').removeClass('disabled');
  $('#responderConsulta').addClass('hide');
  mensaje("Un momento por favor...");
  var request = new XMLHttpRequest();

  idConsulta = idCon;

  var url = "https://apmovil." + baseurl + "/ConsultasService.aspx?token=" + token + "&IdContacto=" + idCon;

  $("#mostrarconsulta").removeClass("hide");
  request.open('GET',url, true);

  document.getElementById('contenidoMensaje').innerHTML = "";
  document.getElementById('botonesconsulta').innerHTML = "";

  request.onload = function() {
  var data = JSON.parse(this.response);

    if (request.status < 200) {
      mensaje("Ha ocurrido un error. Intente nuevamente.");
    }

    var consulta = "";

    data.forEach(con => {

      if(typeof con.Email === "string" && con.Email.trim() !== "")
      {
        $('#respuesta').removeClass('hide');
        $('#responderConsulta').removeClass('hide');
      }

      if(con.Respondida)
      {
        $('#respuesta').val(con.Respuesta);
        $('#respuesta').attr("disabled", true);
        $('#responderConsulta').addClass('disabled');
      }

      consulta =  "<br><b><h5><i class='material-icons blue-text'>person</i> " + con.Nombre.toUpperCase() + "</h5></b><br>" +
                  "Consulta: <b>" + con.Mensaje + "</b>" +
                  "<br>Email: <b>" + con.Email + "</b>" +
                  "<br><br>Oferta: <b>" + con.Oferta + "</b>" +
                  "<br><br><a class='btn' href='javascript:verFichaConsulta(\"" + con.Oferta + "\")'>Ver Ficha</a></b>";

      if(typeof con.Email === "string" && con.Email.trim() !== "")
      {
        consulta += "<br><br><p class='left-align'>Responder esta consulta: </p>";
      }



      var urlFicha = "https://apmovil." + baseurl + "/propiedades-" + codigoInmo + "-" + codigoSuc + "-" + con.Oferta + "-sfc.html";

      $('#contenidoMensaje').append(consulta);

      var mensajeWs = "Nos comunicamos en respuesta a su consulta: %0A" + limpiarConsulta(con.Mensaje) + ".%0AFicha: " + urlFicha + " - Respuesta: " + $('#respuesta').val();

      if(con.Telefono !== "" && con.Telefono !== null)
      {
        var telefono = "<br><a class='blue btn l12 fullwidth' href=tel:" + formatoTelefono(con.Telefono) + "><i class='material-icons left'>phone</i>Llamar al interesado</a><br>";
        $('#botonesconsulta').append(telefono);

        var whatsapp = "";
        if(isAndroid)
        {
          whatsapp = "<br><a class='btn green whatsapp fullwidth' href='whatsapp://send?phone=" + formatoTelefono(con.Telefono) + "&text=" + mensajeWs + "' data-action='share/whatsapp/share'>" +
               "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Responder por Whatsappp</a>";
        }
        else
        {
          whatsapp = "<br><a class='btn green whatsapp fullwidth' href='https://wa.me/" + formatoTelefono(con.Telefono) + "?text=" + mensajeWs + "' target='_blank' data-action='share/whatsapp/share'>" +
               "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Responder por Whatsappp</a>";
        }
        $('#botonesconsulta').append(whatsapp);
      }

    });
    $(".tabs").tabs("select", "mensajes");
  }
  request.send();
}

function responderConsulta()
{
  var jsonConsulta = {};

  mensaje("Enviando su respuesta...");

  jsonConsulta["Token"] = token;
  jsonConsulta["IdContacto"] = idConsulta;
  jsonConsulta["Mensaje"] = $('#respuesta').val();

  var xhr = new XMLHttpRequest();

  var data = JSON.stringify(jsonConsulta);

  var url = "https://apmovil." + baseurl + "/ResponderService.ashx";

  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
          mensaje('¡Respuesta enviada!');
          $('#respuesta').val('');
          cargarConsultas();
      }
  };

  xhr.send(data);
}

function verFichaConsulta(codigo) {
  const url = "https://apmovil." + baseurl + "/BusquedaServiceV2.aspx?token=" + token +
              "&codigoInmobiliaria=" + codigoInmo +
              "&codigoSucursal=" + codigoSuc +
              "&Codigo=" + codigo;

  var request = new XMLHttpRequest();

  request.open('GET', url, true);
  request.onload = function () {
    if (request.status >= 200 && request.status < 300) {
      try {
        const ofer = JSON.parse(request.responseText);
        console.log("Respuesta JSON:", JSON.stringify(ofer, null, 2));

        var imagenSrc = (ofer.fotos && ofer.fotos[0] && ofer.fotos[0].url)
        ? ofer.fotos[0].url
        : 'images/noimage.jpg';

        var fichaHTML = "<img style='width: 100%; max-height: 200px; object-fit: contain;' src='" + imagenSrc + "'>";

        fichaHTML += "<br><b>" + ofer.TipoPropiedad + " - " + ofer.SubtipoPropiedad + "</b>";

        var referencia = (ofer.Referencia && ofer.Referencia.trim() !== "") ? `(${ofer.Referencia})` : "";

        fichaHTML += "<br><b><i class='material-icons tiny'>place</i>" + ofer.Calle + " " + ofer.Altura + "<br><br>" + referencia + "</b><br>" + ofer.Ubicacion;

        fichaHTML += "<br><br><b>" + ofer.TipoOperacion + " " + ofer.Moneda + " " + ofer.Importe + "</b>";

        $('#contenidoFichaConsulta').html(fichaHTML);

        $('#verFichaConsulta').modal('open');
      } catch (e) {
        console.error("Error al parsear JSON:", e);
      }
    } else {
      mensaje("Ha ocurrido un error. Intente nuevamente.");
    }
  };

  request.send();
}

function armarUbicacion(oferta)
{
  var ubicacion = "";

  if(oferta.Barrio.Id != null)
  {
    ubicacion += oferta.Barrio.Nombre + ", ";
  }

  if(oferta.Zona.Id != null)
  {
    ubicacion += oferta.Zona.Nombre + ", ";
  }

  if(oferta.BarrioCerrado.Id != null)
  {
    ubicacion += oferta.BarrioCerrado.Nombre + ", ";
  }

  if(oferta.Localidad.Id != null && oferta.Localidad.Nombre != "CAPITAL FEDERAL")
  {
    ubicacion += oferta.Localidad.Nombre + ", ";
  }

  if(oferta.Partido.Id != null && oferta.Partido.Nombre != "CAPITAL FEDERAL")
  {
    ubicacion += oferta.Partido.Nombre + ", ";
  }

  if(oferta.Provincia.Id != null && oferta.Provincia.Nombre != "CAPITAL FEDERAL")
  {
    ubicacion += oferta.Provincia.Nombre;
  }

  var caracter = ubicacion.substring(ubicacion.length - 2, ubicacion.length);

  if(caracter.includes(","))
  {
      ubicacion = ubicacion.substring(0,ubicacion.length -2);
  }

  return ubicacion;
}

function cargarBusqueda()
{
  $("#btnBuscar").removeAttr("onclick");
  var cod = $('#codigoBuscar').val();

  if(cod != "")
  {
    cargarFicha(0);
    $('#codigoBuscar').val('');
  }
  else
  {
    ofertasGuardadas = [];
    paginaResultado = 1;
    cargarResultado(paginaResultado,ordenResultado);
    $("#cargarMasResultados").removeClass("hide");
  }
}

function cargarMasResultados()
{
  scrollCap();
  paginaResultado += 1;
  cargarResultado(paginaResultado,ordenResultado);
}

function enviarOferta()
{
  mensaje("Grabando, un momento por favor...");

  var atributos = "";
  $(".comboatrib").each(function(){
      var id = $(this).attr('id');
      if($("#" + id + " option:selected").text() !== "Seleccionar")
      {
        atributos = atributos + $(this).attr('title') + ":" + $("#" + id + " option:selected").text() + ";";
      }
  });

  $(".atributos").each(function(){

    if($(this).val() != "")
    {
      atributos = atributos + $(this).attr('title') + ":" + $(this).val() + ";";
    }
  });

  atributos = atributos.slice(0, -1);

  var jsonOferta = {};

  jsonOferta["Codigo"] = $("#codigo").text();
  jsonOferta["Tipo"] = $("#producto option:selected").text().replace('Seleccionar','');
  jsonOferta["Subtipo"] = $("#subproducto option:selected").text().replace('Seleccionar','');
  jsonOferta["SupCub"] = $("#txtSup1").val();
  jsonOferta["SupTot"] = $("#txtSup2").val();
  jsonOferta["UnidadSup"] = $("#unidadmedida option:selected").text().replace('Seleccionar','');
  jsonOferta["Destacable"] = $("#destacable").val();
  jsonOferta["InformacionReservada"] = $("#infoReservada").val();
  jsonOferta["Pais"] = $("#pais option:selected").text().replace('Seleccionar','');
  jsonOferta["Calle"] = $("#calle").val();
  jsonOferta["Altura"] = $("#altura").val();
  jsonOferta["Piso"] = $("#piso").val();
  jsonOferta["Unidad"] = $("#departamento").val().toUpperCase();;
  jsonOferta["Referencia"] = $("#referencia").text();
  jsonOferta["Provincia"] = $("#provincia option:selected").text().replace('Seleccionar','');
  jsonOferta["Barrio"] = $("#ubicacionBuscar").val().replace("CABA","CIUDAD AUTONOMA BUENOS AIRES");
  jsonOferta["Country"] = "";
  jsonOferta["latitud"] = $('#latitud').val();
  jsonOferta["longitud"] = $('#longitud').val();
  jsonOferta["Operacion"] = $("#operacion option:selected").text().replace('Seleccionar','');
  jsonOferta["SubOperacion"] = ".";
  jsonOferta["Atributos"] = atributos.replace('Seleccionar','');
  jsonOferta["Moneda"] = $("#moneda option:selected").text().replace('Seleccionar','');
  jsonOferta["Precio"] = parseInt($("#precio").val().replace(".",""));


  var jsonFotos = [];
  var jsonPlanos = [];
  if(cambioFotos)
  {
    jsonOferta["BorrarFotos"] = "Si";

    var i = 0;

    $(".fotoInventario").each(function(){
        jsonFotos[i] = {"url": $(this).attr('src').replace("Chico","Grande").replace("chico","grande")};
        i++;
    });

    i = 0;
    $(".planoInventario").each(function(){
        jsonPlanos[i] = {"url": $(this).attr('src').replace("Chico","Grande").replace("chico","grande")};
        i++;
    });
  }
  else
  {
    jsonOferta["BorrarFotos"] = "No";
  }

  jsonOferta["planos"] = jsonPlanos;
  jsonOferta["fotos"] = jsonFotos;

  var check = "NO"; // Sntes decia NO

  if($("#publicarSom").is(':checked'))
  {
    check = "SI";
  }
  jsonOferta["Publica"] = check;

  check = "NO";

  if($("#reservada").is(':checked'))
  {
    check = "SI";
  }

  jsonOferta["Reservada"] = check;
  jsonOferta["FechaPublicacion"] = "";
  jsonOferta["Token"] = token;

  var data = JSON.stringify(jsonOferta);

  var xhr = new XMLHttpRequest();

  var url = "https://apmovil." + baseurl + "/GrabarService.ashx";

  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        if(xhr.responseText.includes("ERROR"))
        {
          mensaje("Ha ocurrido un error, intente nuevamente...");
        }
        else
        {
          mensaje("Se ha grabado la oferta " + xhr.responseText);
          setTimeout(function() {

            cargarInventario();
            $(".tabs").tabs("select", "inventario");

          }, 2000);
        }
      }
  }

  xhr.send(data);

}

function cargarResultado(pagina, idOrden)
{
  mensaje("<i class='material-icons red-text'>search</i> Buscando, un momento por favor...");
  var ofertas = "";
  var misOfertas = 0;
  var request = new XMLHttpRequest();

  if(pagina == 1)
  {
    document.getElementById('itemsResultados').innerHTML = "";
  }

  var codigo = document.getElementById('codigoBuscar').value;

    if($('#soloMisOfertas').prop('checked'))
    {
      misOfertas = 1;
    }

    $("#contenidoFicha").addClass("hide");
    $("#datosInmobiliaria").addClass("hide");

    if(operacion != "")
    {
      operacion = '&IdOperacion=' + operacion;
    }

    var ubicacion = $("#ubicacionBuscar").val().split(",");

    var esBarrioCerrado = false;

    ubicaciones.forEach(function(ubi) {
      if (ubi.nombre.trim() === String(ubicacion).trim()) {
        esBarrioCerrado = ubi.esBarrioCerrado;
      }
    });

    var localidad = "";
    var barrio = "";
    var zona = "";

    if(ubicacion.length === 3)
    {
      zona = ubicacion[0];
      barrio = ubicacion[1];
      localidad = ubicacion[2].replace("CABA", "CIUDAD AUTONOMA BUENOS AIRES").substring(1);
    }
    if(ubicacion.length === 2)
    {
      barrio = ubicacion[0];
      localidad = ubicacion[1].replace("CABA", "CIUDAD AUTONOMA BUENOS AIRES").substring(1);
    }
    if(ubicacion.length === 1)
    {
      localidad = ubicacion[0];
    }

    var url = "https://apmovil." + baseurl + "/BusquedaServiceV2.aspx?token=" + token +
              "&codigoInmobiliaria=" + codigoInmo + "&codigoSucursal=" + codigoSuc +
              "&productoTipo=" + $("#producto option:selected").text() +
              "&productoSubTipo=" + $("#subproducto option:selected").text() +
              "&operacionTipo=" + $("#operacion option:selected").text() +
              "&moneda=" + $("#moneda option:selected").text() +
              "&pais=" + $("#pais option:selected").text() +
              "&provincia=" + $("#provincia option:selected").text() +
              "&localidad=" + localidad +
              "&barrio=" + barrio +
              "&precioDesde=" + $("#precioMin").val() +
              "&precioHasta=" + $("#precioMax").val() +
              "&pagina=" + paginaResultado +
              "&cantidad=20" +
              "&orden=" + idOrden +
              "&zona=" + zona;

    if(misOfertas === 1)
    {
      url += "&inventario=1";
    }

    if(codigo != "")
    {
      url += "&codigo=" + codigo;
    }

    if(esBarrioCerrado)
    {
      url += "&esBarrioCerrado=Si";
    }

      request.open('GET', url, true);

      request.onload = function() {
      $("#btnBuscar").attr("onclick", "cargarBusqueda()");
      var oferta = JSON.parse(this.response);

        if (request.status < 200) {
          mensaje("Ha ocurrido un error. Intente nuevamente.");
        }

        if(oferta.totales.Total == 0)
        {
          ofertas = "<h4 class='centrado'>No se encontraron resultados.<br><br><i class='material-icons large red-text'>thumb_down</i></h4>";
          $("#cantidadOfertas").text("");
          $("#cargarMasResultados").addClass("hide");
        }
        else
        {
          if(oferta.inmuebles.length < 20)
          {
            $('#cantidadOfertas').text("Mostrando " + oferta.totales.Total + " de " + oferta.totales.Total + " ofertas.");
            $("#cargarMasResultados").addClass("hide");
          }
          else
          {
            $('#cantidadOfertas').text("Mostrando " + 20*pagina + " de " + oferta.totales.Total + " ofertas.");
          }
          oferta.inmuebles.forEach(inmueble => {

            var foto = "";

            if(inmueble.UrlFoto != "" && inmueble.UrlFoto != null)
            {
              foto = "<div class='fotolistado bordes' style='background-image: url(https://apmovil." + baseurl + "/imagenes/mediano/" + inmueble.UrlFoto + ")'></div>";
            }
            else
            {
              foto = "<img class='fotolistado bordes' src='images/noimage80.jpg' height='50'>";
            }

            var clase = "";

            if(buscarGuardadas(inmueble.ID))
            {
              clase = "green lighten-3";
            }

            var item =
            "<table id='" + inmueble.ID + "' width='100%' class='listado " + clase + "' onclick='cargarFicha(" + inmueble.ID + ");' id='tablaResultado'><tr class='itemlistado'>" +
            "       <td width='100'>" + foto + "</td>" +
            "       <td>" + inmueble.TipoProducto.replace(" <br>", ",") + "<br>" +
            inmueble.Direccion.replace("CIUDAD AUTONOMA BUENOS AIRES", "C.A.B.A.").replace(", Argentina","") + "<br>";

            if(inmueble.Barrio !== "")
            {
              item += inmueble.Barrio + ", ";
            }

            if(inmueble.Localidad !== "")
            {
              item += inmueble.Localidad.replace("CIUDAD AUTONOMA BUENOS AIRES", "C.A.B.A.") + "<br>";
            }

            var reservadaTexto = "";

            if(inmueble.Reservada === "Si")
            {
              reservadaTexto = "<br><span class='red-text'><b>Oferta Reservada</b></span>";
            }

            item += "<b>" + inmueble.OperacionPrecio + "</b>" + reservadaTexto +
            "</td></tr></table>";
            ofertas = ofertas + item;
          });
        }

        $('#itemsResultados').append(ofertas);
        $(".tabs").tabs("select", "resultado");
      }

      request.send();
}

function buscarGuardadas(id)
{
  var esta = false;
  ofertasGuardadas.forEach(function(ofer, index) {
    if(ofer == id)
    {
      esta = true;
    }
  });
  return esta;
}

function setearDomicilios(cambioProv)
{

  var id = 0;

  if(cambioProv)
  {
    id = $('#provincia').val();
    $('#ubicacionBuscar').val('')
  }
  else
  {
    if(oferta != null)
    {
      id = oferta.Provincia.Id;
    }
  }

  if(id == 11)
  {
    $("#domicilio").addClass("hide");
  }
  else
  {
    $("#domicilio").removeClass("hide");
  }
}

function inicializar()
{
    setTimeout(function() {
      $(document).ready(function(){
        $('.tabs').tabs();
        $('select').formSelect();
        $('.modal').modal();
        $('.sidenav').sidenav();
        $('.collapsible').collapsible();
      });

      $('#ubicacionBuscar').val('');

      token = obtenerParametros('token');
      codigoInmo = obtenerParametros('inmobiliaria');
      codigoSuc = obtenerParametros('sucursal');
      rol = obtenerParametros('rol');

      if(!token)
      {
        mensaje("No se ha ingresado un Token. Es necesario para operar.");
        window.location.href = "login.html";
      }

      llamarLoginService();

      cargarProductos();
      cargarSubproductos();
      inicializarPaises();
      inicializarProvincias(1);

      $('#tipoInv').on('change', function() {
        cargarInventario();
      });

      $('#ordenInv').on('change', function() {
        cargarInventario();
      });

      $('#busquedaSom').removeClass('hide');

    }, 200);
}

function cambiarToken()
{
  var token = obtenerParametros('token');
  if(token !== null)
  {
    window.location.href = "cambiartoken.html?token=" + token;
  }
}

function cargarInventario()
{
  document.getElementById('contenidoInventario').innerHTML = "";
  mensaje("<i class='material-icons red-text'>hourglass_full</i> Cargando inventario, un momento por favor...");
  var request = new XMLHttpRequest();

  codigoSuc = obtenerParametros('sucursal');
  codigoInmo = obtenerParametros('inmobiliaria');
  rol = obtenerParametros('rol');

  var valorInv = $('#tipoInv').val();
  var ordenInv = $('#ordenInv').val();
  var cantidad = 20000;
  var historico = false;
  $('#opcionesInv').removeClass("hide");

  if(!rol.includes("Vendedor") && !rol.includes("Api"))
  {
    var url = "https://apmovil." + baseurl + "/BusquedaServiceV2.aspx?token=" + token +
              "&codigoInmobiliaria=" + codigoInmo + "&codigoSucursal=" + codigoSuc +
              "&productoTipo=&productoSubTipo=&operacionTipo=&moneda=&pais=&provincia=&localidad=&barrio=&precioDesde=&precioHasta=&vencidas=true&pagina=1&cantidad=" + cantidad + "&orden=" + ordenInv + "&zona=&inventario=1";

    if(valorInv == 2)
    {
      url += "&propio=true";
      url = url.replace("cantidad=20000","cantidad=100");
    }

    if(valorInv == 3)
    {
      url += "&historico=true";
      url = url.replace("cantidad=20000","cantidad=100");
      historico = true;
    }

    var busquedaInv = $('#buscarInv').val();

    if(busquedaInv !== "")
    {
      url += "&calle=" + busquedaInv;
    }

    $('#btnAlta').removeClass("hide");
    if(historico)
    {
      $('#btnAlta').addClass("hide");
    }

    request.open('GET',url, true);

    request.onload = function() {
    var data = JSON.parse(this.response);

      if (request.status < 200) {
        mensaje("Ha ocurrido un error. Intente nuevamente.");
      }
      else
      {
        var ofertas = "";
        data.inmuebles.forEach(inmueble => {

          var clase = "";

          if(inmueble.vencida)
          {
            clase = "red lighten-5";
          }

          var foto = "";

          if(inmueble.UrlFoto != "" && inmueble.UrlFoto != null)
          {
            foto = "<div class='fotolistado bordes' style='background-image: url(https://apmovil." + baseurl + "/imagenes/mediano/" + inmueble.UrlFoto + ")'></div>";
          }
          else
          {
            foto = "<img class='fotolistado bordes' src='images/noimage80.jpg' height='50'>";
          }


          var reservadaTexto = "";

          if(inmueble.Reservada === "Si")
          {
            reservadaTexto = " - <span class='red-text'><b>Reservada</b></span>";
          }

          var item =
          "<table id='" + inmueble.ID + "' width='100%' class='listado " + clase + "' id='tablaResultado'><tr class='itemlistado'>" +
          "<td  width='100' onclick='editarFicha(" + inmueble.ID + ");' >" + foto + "</td>" +
          "<td onclick='editarFicha(" + inmueble.ID + ");'>" + inmueble.TipoProducto + "</b><br>" +
          inmueble.Direccion.replace("CIUDAD AUTONOMA BUENOS AIRES", "C.A.B.A.").replace(", Argentina","") + "<br><b>"
          + inmueble.OperacionPrecio + "</b><br>" + inmueble.Codigo + reservadaTexto + "</td>";

          if(historico)
          {
            item += "</td><td width='40px'><a class='modal-trigger' href='javascript:mostrarRehabilitar(\"" + inmueble.Codigo + "\");'><i class='material-icons green-text' style='font-size: 30px'>refresh</i></a></td></tr></table>";
          }
          else
          {
            item += "</td><td width='40px'><a class='modal-trigger' href='javascript:mostrarEliminar(\"" + inmueble.Codigo + "\");'><i class='material-icons red-text' style='font-size: 30px'>delete</i></a></td></tr></table>";
          }

          ofertas = ofertas + item;
        });

        $('#contenidoInventario').append(ofertas);
        $('.collapsible').removeClass("hide");
        $('#buscarInv').val('');
      }
    }
    request.send();
  }
  else
  {
    $('#opcionesInv').addClass("hide");
    var contenidoInv = "<br><h5 class='center-align'><i class='material-icons red-text' style='font-size: 70px'>home</i></h5><br><h4 class='center-align'>Su usuario no tiene permisos para utilizar esta sección.</h4>";
    $('#contenidoInventario').append(contenidoInv);
  }
}

function editarFicha(idOferta)
{
  // Se desactiva el click en el inventario hasta que carga la ficha a editar

  mensaje("Un momento por favor...");

  $('#contenidoInventario').addClass("no-clickeable");

  $('#editarInv').removeClass("disabled");
  $('#fotosInv').removeClass("disabled");
  $('#invEditar').removeClass("tab-inactiva");
  $('#invArchivos').removeClass("tab-inactiva");
  var request = new XMLHttpRequest();

  $(".listado").removeClass("blue lighten-5");
  $("#" + idOferta).addClass("blue lighten-5");

  idFicha = idOferta;

  var url = "https://apmovil." + baseurl + "/OfertasServiceV3.aspx?id=" + idOferta + "&token=" + token;

  $("#itemsFotos").empty();
  $("#itemsPlanos").empty();

  request.open('GET', url, true);

    request.onload = function() {
      var data = JSON.parse(this.response);

      if (request.status >= 200 && request.status < 400) {
        oferta = data;
        $('#contenidoInventario').removeClass("no-clickeable");
      }

      actualizarSelect(oferta.TipoPropiedad, 'producto');

      cargarSubproductos(oferta.SubtipoPropiedad);
      mostrarAtributos(oferta.TipoPropiedad);
      $('#precio').val(oferta.Importe);

      $('#calle').val(oferta.Calle);

      $('#codigo').text(oferta.Codigo);

      $('#altura').val(oferta.Altura);

      $('#piso').val(oferta.Piso);

      $('#departamento').val(oferta.Unidad);

      $('#referencia').val(oferta.Referencia);

      $('#infoReservada').val(oferta.InformacionReservada);

      $('#destacable').val(oferta.Destacable);
      M.updateTextFields();
      M.textareaAutoResize($('#destacable'));
      M.textareaAutoResize($('#infoReservada'));

      actualizarSelect(oferta.TipoOperacion, 'operacion');

      actualizarSelect(oferta.Moneda, 'moneda');

      armarSuperficies();

      $('#txtSup1').val(oferta.SubCub);
      $('#txtSup2').val(oferta.SupTot);

      actualizarSelect(oferta.UnidadMedida, 'unidadmedida');

      actualizarSelect(oferta.Pais, 'pais');

      inicializarProvincias($("#pais").val(), oferta.Provincia);

      inicializarUbicaciones(oferta.Provincia);

      $('#ubicacionBuscar').val(oferta.Ubicacion.replace("CIUDAD AUTONOMA BUENOS AIRES","CABA"));

      if(oferta.latitud != "" || oferta.longitud != "")
      {
        ubicarMapa(oferta.Latitud, oferta.Longitud);
      }

      $('#latitud').val(oferta.Latitud);
      $('#longitud').val(oferta.Longitud);

      if(oferta.Publica)
      {
        $("#publicarSom").prop("checked", true);
      }
      else
      {
        $("#publicarSom").prop("checked", false);
      }

      if(oferta.Reservada === "Si")
      {
        $("#reservada").prop("checked", true);
      }
      else
      {
        $("#reservada").prop("checked", false);
      }

      // Cargar atributos
      setTimeout(function() {

        cargarAtributos(oferta.Atributos);

      }, 1500);

      var url = "https://sistema." + baseurl + "/" + oferta.UrlFicha;

      url = corregirUrl(url);

      urlWhatsapp = url;

      var contacto = "";

      if(isAndroid)
      {
        contacto = "<div class='whatsapp-float'><a href='whatsapp://send?text=" + url + "' class='btn-floating btn-large green ws-float' style='margin-bottom: 40px'></a></div>";
      }
      else
      {
        contacto = "<div class='whatsapp-float'><a href='https://api.whatsapp.com/send?text=" + url + "' class='btn-floating btn-large green ws-float' style='margin-bottom: 40px'></a></div>";
      }

      /*if(isAndroid)
      {
        contacto = "<div class=''><a href='whatsapp://send?text=" + url + "' class='btn-floating btn-large green ws-float' style='margin-bottom: 40px'></a></div>";
      }
      else
      {
        contacto = "<div class=''><a href='https://api.whatsapp.com/send?text=" + url + "' class='btn-floating btn-large green ws-float' style='margin-bottom: 40px'></a></div>";
      }*/

      document.getElementById('compartirWS').innerHTML = contacto;

      // Carga de fotos y planos

      if(oferta.fotos !== null)
      {
        oferta.fotos.forEach(fot => {
          var fotoChica = fot.urlChica && fot.urlChica !== "" && fot.urlChica !== null
            ? "https://apmovil." + baseurl + "/imagenes/chico/" + fot.urlChica
            : "images/noimage80.jpg";

          $("#itemsFotos").append("<li class='col s6 m4' style='margin-bottom: 10px'><div class='list'><img class='full fotoInventario' src='" + fotoChica + "' width='100'><div class='center-align'><select style='width: 85px; display: inline-block' class='browser-default btn-remove'><option disabled selected>Eliminar</option><option>Confirmar</option></select><div><div></li>");
        });
      }

      if(oferta.planos !== null)
      {
        oferta.planos.forEach(pla => {
          var planoUrl = pla.url && pla.url !== "" && pla.url !== null
            ? "https://apmovil." + baseurl + "/imagenes/chico/" + pla.url
            : "images/noimage80.jpg";

          $("#itemsPlanos").append("<li class='col s6 m4' style='margin-bottom: 10px'><div class='list'><img class='full planoInventario' src='" + planoUrl + "' width='100'><div class='center-align'><select style='width: 85px; display: inline-block' class='browser-default btn-remove'><option disabled selected>Eliminar</option><option>Confirmar</option></select><div><div></li>");
        });
      }

      $('select').formSelect();

      $(".tabs").tabs("select", "editar");
    }
    request.send();
}

function actualizarSelect(texto, selectId) {
    var select = document.getElementById(selectId);
    for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].text === texto) {
          $("#" + selectId).val(select.options[i].value);
        }
    }
    return -1; // Si el texto no se encuentra en las opciones del select
}

function copiarLink() {
  if (navigator.clipboard && window.isSecureContext) {

    navigator.clipboard.writeText(urlWhatsapp)
      .then(() => {
        mensaje("Ha copiado el link a esta ficha!");
      })
      .catch(err => {
        mensaje("Ha ocurrido un error al copiar el link.");
      });
  } else {
    const input = document.createElement("input");
    input.value = urlWhatsapp;
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, 99999); // Mobile
    document.execCommand("copy");
    document.body.removeChild(input);
    mensaje("Ha copiado el link a esta ficha!");
  }
}


function mostrarEliminar(cod)
{
  codigoBorrar = cod;
  $('#eliminaroferta').modal('open');
}

function eliminarFicha()
{
  mensaje("Eliminando oferta, un momento por favor...");

  var jsonOferta = {};

  $('#eliminaroferta').modal('close');

  jsonOferta["Baja"] = codigoBorrar;
  jsonOferta["Token"] = token;

  var data = JSON.stringify(jsonOferta);

  var xhr = new XMLHttpRequest();

  var url = "https://apmovil." + baseurl + "/GrabarService.ashx";

  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        if(xhr.responseText.includes("ERROR"))
        {
          mensaje("Ha ocurrido un error, intente nuevamente...");
        }
        else
        {
          mensaje("Se ha eliminado la oferta " + xhr.responseText);
          setTimeout(function() {

            cargarInventario();
            $(".tabs").tabs("select", "inventario");

          }, 2000);
        }
      }
  }

  xhr.send(data);
}

function inventario()
{
  $('#editarInv').addClass("disabled");
  $('#fotosInv').addClass("disabled");
  $('#invEditar').addClass("tab-inactiva");
  $('#invArchivos').addClass("tab-inactiva");
  window.scrollTo(0, 0);
}

function mostrarRehabilitar(cod)
{
  codigoRehabilitar = cod;
  $('#rehabilitaroferta').modal('open');
}

function rehabilitarOferta(codigo)
{
  mensaje("Rehabilitando oferta, un momento por favor...");

  var jsonOferta = {};

  $('#rehabilitaroferta').modal('close');

  jsonOferta["Rehabilitar"] = codigoRehabilitar;
  jsonOferta["Token"] = token;

  var data = JSON.stringify(jsonOferta);

  var xhr = new XMLHttpRequest();

  var url = "https://apmovil." + baseurl + "/GrabarService.ashx";

  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        if(xhr.responseText.includes("ERROR"))
        {
          mensaje("Ha ocurrido un error, intente nuevamente...");
        }
        else
        {
          mensaje("Se ha rehabilitado la oferta " + xhr.responseText);
          setTimeout(function() {

            cargarInventario();
            $(".tabs").tabs("select", "inventario");

          }, 2000);
        }
      }
  }

  xhr.send(data);
}

function mostrarAtributos(tipo)
{
  $("#descripcionAtributos").empty();
  var request = new XMLHttpRequest();

  var url = "https://apmovil." + baseurl + "/AtributosService.aspx?dato=" + tipo;

  request.open('GET', url, true);

    request.onload = function() {
      var data = JSON.parse(this.response);

      if (request.status < 200) {
        mensaje("Ha ocurrido un error. Intente nuevamente.");
      }
        var nomatr = 0;
        data.forEach(atributo => {

            if(atributo.Importante)
            {
                if(atributo.Opciones !== null)
                {
                  var Options = "<option value='' selected>Seleccionar</option>";

                  atributo.Opciones.forEach(opcion => {

                      Options = Options + "<option value='" + opcion + "'>" + opcion + "</option>";
                  });

                  $("#descripcionAtributos").append("<div class='col s12 input-field'><select id='atr" + nomatr + "' title='" + atributo.Nombre + "' class='comboatrib'>" + Options + "</select><label>" + atributo.Nombre + "</label></div>");
                }
                else
                {
                  var atrib = "<div class='col s12'><label>" + atributo.Nombre + "</label><input type='text' class='atributos atrText browser-default' title='" + atributo.Nombre + "' placeholder=' '></div>";
                  $("#descripcionAtributos").append(atrib);
                }
            }
            nomatr++;
        });

        $('.comboatrib').formSelect();
    }

    request.send();
    //$('#pais').val('1');
}

function cargarAtributos(datos)
{
  atributos = datos.split(";");

  $(".comboatrib").each(function(){

    for (var i = 0; i <= atributos.length - 2; i++) {

      valor = atributos[i].split(":");

      var idAtr = $(this).attr('id');

      if($(this).attr('title') !== "undefined" && $(this).attr('title') === valor[0])
      {
        actualizarSelect(valor[1], idAtr);
      }
    }
  });

  $('.comboatrib').formSelect();

  $(".atributos").each(function(){

    for (var i = 0; i <= atributos.length - 2; i++) {

      valor = atributos[i].split(":");

      if($(this).attr('title') !== "undefined" && $(this).attr('title') === valor[0])
      {
        $(this).val(valor[1]);
      }

    }
  });
}

function georeferenciar()
{

  $('#nombreCalle').empty();
  $('#nombreCalle').append(`<option disabled selected>Seleccione la ubicación correspondiente:</option>`);

  mensaje('Ubicando en mapa, aguarde un instante...');

  var provincia = $("#provincia option:selected").text();

  var ubicacion = $('#ubicacionBuscar').val();

  var calle = $('#calle').val();

  var altura = $('#altura').val();

  var provincia = $("#provincia option:selected").text();

  var ubicacion = $('#ubicacionBuscar').val().split(',')[0];

  var urlApi = "https://maps.googleapis.com/maps/api/geocode/json?address=" + provincia + ", " + ubicacion + ", " + calle + ", " + altura + "&key=AIzaSyBGtClDdDlC_-ITTM_JXTw5JiFJgyN_ehY";

  var request = new XMLHttpRequest();

  request.open('GET', urlApi, true);

    request.onload = function() {
    var data = JSON.parse(this.response);

    if (request.status < 200) {
      mensaje("Ha ocurrido un error. Intente nuevamente.");
    }

      if(data.results.length > 0)
      {
        $('#contenedorCalle').removeClass("hide");

        /*var lat = parseFloat(data.results[data.results.length -1].geometry.location.lat);
        var long = parseFloat(data.results[data.results.length -1].geometry.location.lng);

        $('#latitud').val(lat);
        $('#longitud').val(long);*/

        $.each(data.results, function(index, result) {
            var calle = '';
            var localidad = '';
            var barrio = '';

            $.each(result.address_components, function(i, componente) {
                if (componente.types.includes('route')) {
                    calle = componente.short_name;
                }
                if (componente.types.includes('sublocality')) {
                    barrio = componente.short_name + ", ";
                }
                if (componente.types.includes('locality')) {
                    localidad = componente.short_name;
                }
            });

            var nombre = `${calle} ${altura}, ${barrio}${localidad}`;
            var lat = result.geometry.location.lat;
            var lng = result.geometry.location.lng;
            var value = `${lat},${lng}`;

            $('#nombreCalle').append(`<option value="${value}">${nombre}</option>`);
        });

        $('#nombreCalle').formSelect();
        $('#nombreCalle').on('change', function()
        {
          var value = $(this).val();

          if (value) {
              var coords = value.split(',');
              var lat = parseFloat(coords[0]);
              var long = parseFloat(coords[1]);

              ubicarMapa(lat, long);
          }
        });
      }
      else
      {
        cerrarMapa();
        mensaje('No se ha podido ubicar en el mapa...');
      }
    }

    request.send();
}

function ubicarMapa(lat, long)
{
  $('#invMapa').attr('src', 'mapa.html?latitud=' + lat + '&longitud=' + long);
  $('#latitud').val(lat);
  $('#longitud').val(long);
  document.getElementById('mapaABM').style.display = 'block';
}

function cerrarMapa()
{
  $('#longitud').val("");
  $('#latitud').val("");
  document.getElementById('mapaABM').style.display = 'none';
}

function cargarProductos()
{
  var request = new XMLHttpRequest();

  var url = "https://apmovil." + baseurl + "/ParametrosService.aspx?dato=PRODUCTOS";

  request.open('GET',url, true);

  var Options="";

  $('#producto').empty();

  Options = Options + "<option value='' selected>Seleccionar</option>";

  request.onload = function() {
  var data = JSON.parse(this.response);

    if (request.status < 200) {
      mensaje("Ha ocurrido un error. Intente nuevamente.");
    }

      data.forEach(producto => {
          Options = Options + "<option value='" + producto.ID + "'>" + producto.Nombre + "</option>";
      });
      $('#producto').append(Options);

    $('#producto').formSelect();
    $('#producto').on('change', function()
    {
      cargarSubproductos();
      mostrarAtributos($("#producto option:selected").text());
      armarSuperficies();
    });
  }
  request.send();
}

function armarSuperficies()
{
  $('.superficie1').removeClass("hide");
  $('.superficie2').removeClass("hide");
  $('.superficie1').removeClass("s8");
  $('.superficie1').addClass("s4");
  $('.superficie2').removeClass("s8");
  $('.superficie2').addClass("s4");
  // Departamentos
  if($('#producto').val() == 1)
  {
    $('#lblSup1').text("Sup. cubierta");
    $('#lblSup2').text("Sup. total");
  }
  // Casas
  if($('#producto').val() == 2)
  {
    $('#lblSup1').text("Sup. cubierta");
    $('#lblSup2').text("Sup. terreno");
  }
  // Oficinas
  if($('#producto').val() == 32)
  {
    $('#lblSup1').text("Sup. cubierta");
    $('#lblSup2').text("Sup. oficina");
  }
  // Locales
  if($('#producto').val() == 33)
  {
    $('#lblSup1').text("Sup. cubierta");
    $('#lblSup2').text("Sup. total");
  }
  // Terrenos
  if($('#producto').val() == 34)
  {
    $('#lblSup1').text("Superficie");
    $('.superficie1').removeClass("s4");
    $('.superficie1').addClass("s8");
    $('.superficie2').addClass("hide");
  }
  // Depositos
  if($('#producto').val() == 36)
  {
    $('#lblSup1').text("Sup. cub. total");
    $('.superficie1').removeClass("s4");
    $('.superficie1').addClass("s8");
    $('.superficie2').addClass("hide");
  }
  // Propiedades rurales
  if($('#producto').val() == 37)
  {
    $('#lblSup1').text("Cant. has.");
    $('.superficie1').removeClass("s4");
    $('.superficie1').addClass("s8");
    $('.superficie2').addClass("hide");
  }
  // Edificios en block
  if($('#producto').val() == 38)
  {
    $('#lblSup1').text("Sup. total");
    $('.superficie1').removeClass("s4");
    $('.superficie1').addClass("s8");
    $('.superficie2').addClass("hide");
  }
  // Cocheras
  if($('#producto').val() == 40)
  {
    $('#lblSup1').text("Sup. total");
    $('.superficie1').removeClass("s4");
    $('.superficie1').addClass("s8");
    $('.superficie2').addClass("hide");
  }
  // Fondos de comercio
  if($('#producto').val() == 42)
  {
    $('#lblSup1').text("Sup. planta baja");
    $('.superficie1').removeClass("s4");
    $('.superficie1').addClass("s8");
    $('.superficie2').addClass("hide");
  }
  // Otros productos
  if($('#producto').val() == 45)
  {
    $('#lblSup1').text("Sup. cubierta");
    $('.superficie1').removeClass("s4");
    $('.superficie1').addClass("s8");
    $('.superficie2').addClass("hide");
  }
}

function ordenarResultados(orden)
{
  document.getElementById('itemsResultados').innerHTML = ""
  ordenResultado = orden;
  window.scrollTo(0, 0);
  paginaResultado = 1;
  cargarResultado(paginaResultado,ordenResultado);
}

function cargarSubproductos(subprod = false)
{
  var request = new XMLHttpRequest();

  var idproducto = $('#producto').val();

  var url = "https://apmovil." + baseurl + "/ParametrosService.aspx?dato=SUBTIPOS&subdato=" + idproducto;

  request.open('GET', url, true);

  var Options="";

  $('#subproducto').empty();

    Options = Options + "<option value='' selected>Seleccionar</option>";

    request.onload = function() {
    var data = JSON.parse(this.response);

    if (request.status < 200) {
      mensaje("Ha ocurrido un error. Intente nuevamente.");
    }

      data.forEach(producto => {
            Options = Options + "<option value='" + producto.ID + "'>" + producto.Nombre + "</option>";
      });

      $('#subproducto').append(Options);

      if(subprod)
      {
        actualizarSelect(subprod, 'subproducto');
      }

      $('#subproducto').formSelect();
    }

    request.send();
}

function inicializarPaises()
{
  var request = new XMLHttpRequest();

  var url = "https://apmovil." + baseurl + "/ParametrosService.aspx?dato=PAISES";

  request.open('GET', url, true);

  var Options="";

  Options = Options + "<option value=''>Seleccionar</option>";

    request.onload = function() {
      var data = JSON.parse(this.response);

      if (request.status < 200) {
        mensaje("Ha ocurrido un error. Intente nuevamente.");
      }

        data.forEach(pais => {
            Options = Options + "<option value='" + pais.ID + "'>" + pais.Nombre + "</option>";
        });
        $('#pais').append(Options);
        $("#pais").val(1);
        $('#pais').formSelect();
        $('#pais').on('change', function() {
        inicializarProvincias(this.value);
      });
    }

    request.send();
}

function inicializarProvincias(idPais, nombreprov = false)
{
  $("#provincia").empty();

  var request = new XMLHttpRequest();

  var url = "https://apmovil." + baseurl + "/ParametrosService.aspx?dato=PROVINCIAS&subdato=" + idPais;

  request.open('GET', url, true);

  var Options="";
  Options = Options + "<option value='' selected>Seleccionar</option>";
    request.onload = function() {
      var data = JSON.parse(this.response);

      if (request.status < 200) {
        mensaje("Ha ocurrido un error. Intente nuevamente.");
      }

        data.forEach(prov => {
            Options = Options + "<option value='" + prov.ID + "'>" + prov.Nombre + "</option>";
        });
        $('#provincia').append(Options);

        if(nombreprov)
        {
          actualizarSelect(nombreprov, 'provincia');
        }

        $('#provincia').formSelect();
        $('#provincia').on('change', function() {
          var valor = $("#provincia option:selected").text();

          inicializarUbicaciones(valor);
        });
    }

    request.send();
}

/*function inicializarUbicaciones(nomProv)
{
  var request = new XMLHttpRequest();

  var url = "https://apmovil." + baseurl + "/ubicacionesservice.aspx?provincia=" + nomProv;

  request.open('GET', url, true);

    request.onload = function() {
      var data = JSON.parse(this.response);

    var dataUbicaciones = {};

    if (request.status < 200) {
      mensaje("Ha ocurrido un error. Intente nuevamente.");
    }

    data.forEach(ubi => {
      var nombre = ubi.Nombre.replace("CIUDAD AUTONOMA BUENOS AIRES","CABA");
      dataUbicaciones[nombre] = null;
      ubicaciones.push({nombre: nombre});
      //ubicaciones.push({nombre: ubi.Nombre, parametro: ubi.parametro, id: ubi.id});
    });

    $('#ubicacionBuscar').autocomplete({
      data: dataUbicaciones,
      function (a, b, inputString) {
          return a.indexOf(inputString) - b.indexOf(inputString);
      }
    });
    }

    request.send();
}*/

function inicializarUbicaciones(nomProv) {
  var request = new XMLHttpRequest();

  var url = "https://apmovil." + baseurl + "/ubicacionesservice.aspx?provincia=" + nomProv;

  request.open('GET', url, true);

  request.onload = function() {
    var data = JSON.parse(this.response);

    var dataUbicaciones = {};
    ubicaciones = []

    if (request.status < 200) {
      mensaje("Ha ocurrido un error. Intente nuevamente.");s
      return;
    }

    data.forEach(ubi => {
      var nombre = ubi.Nombre.replace("CIUDAD AUTONOMA BUENOS AIRES", "CABA");

      // Comprobamos si "Country" tiene texto para marcar si es barrio cerrado
      var esBarrioCerrado = ubi.Country.trim() !== "";

      // Agregamos la propiedad 'esBarrioCerrado' al objeto de ubicación
      ubicaciones.push({
        nombre: nombre,
        esBarrioCerrado: esBarrioCerrado
      });

      // También agregamos al autocompletado
      dataUbicaciones[nombre] = null;
    });

    $('#ubicacionBuscar').autocomplete({
      data: dataUbicaciones,
      function(a, b, inputString) {
        return a.indexOf(inputString) - b.indexOf(inputString);
      }
    });
  }

  request.send();
}


function verBusqueda()
{
  if(token != "" && codigoInmo != "")
  {
    window.location.href = "busqueda.html?token=" + token + "&inmobiliaria=" + codigoInmo + "&sucursal=" + codigoSuc + "&rol=" + rol;
  }
  else
  {
    mensaje("Atención! Su sesión ha expirado.");
    window.location.href = "index.html";
  }
}

function verInventario()
{
  if(token != "")
  {
    window.location.href = "inventario.html?token=" + token + "&inmobiliaria=" + codigoInmo + "&sucursal=" + codigoSuc + "&rol=" + rol;
  }
  else
  {
    alert("Atención! Su sesion ha expirado.");
    window.location.href = "index.html";
  }
}

function verConsultas()
{
  if(token != "")
  {
    window.location.href = "consultas.html?token=" + token + "&inmobiliaria=" + codigoInmo + "&sucursal=" + codigoSuc + "&rol=" + rol;
  }
  else
  {
    alert("Atención! Su sesion ha expirado.");
    window.location.href = "index.html";
  }
}

// Editor de imagenes

// Cambios en el editor de imagenes

function inicializarEditorImagenes()
{
  $(function () {
  $("#itemsFotos").sortable({
          start: function (event, ui) {
                  ui.item.toggleClass("highlight");
          },
          stop: function (event, ui) {
                  ui.item.toggleClass("highlight");
          },
          change: function(event, ui) {
            cambioFotos = true;
        }
  });
  $("#itemsFotos").disableSelection();
  });

  $(document).ready(function() {
    $('#itemsFotos').on('change', '.btn-remove', function(){
      $(this).closest('li').fadeOut('slow', function(){
        $(this).remove();
        cambioFotos = true;
      });
    });
  });

  $(function () {
  $("#itemsPlanos").sortable({
          start: function (event, ui) {
                  ui.item.toggleClass("highlight");
          },
          stop: function (event, ui) {
                  ui.item.toggleClass("highlight");
          }
  });
  $("#itemsPlanos").disableSelection();
  });

  $(document).ready(function() {
    $('#itemsPlanos').on('click', '.btn-remove', function(){
      $(this).closest('li').fadeOut('slow', function(){
        $(this).remove();
        cambioFotos = true;
      });
    });
  });
}

function cargarFotos(elem)
{
    var files = $('#subirFotos')[0].files;

    var jsonFoto = {};

    var cantFot = 0;

    var tiempo = 0;

    for (var i = 0, f; f = files[i]; i++) {
      renderImage(files[i],i, jsonFoto);
      tiempo = tiempo + ((files[i].size/1024)-600);
      cantFot = (i+1);
    }

    if(tiempo < 1000)
    {
      tiempo = 1000;
    }

    mensaje("Subiendo " + cantFot + " imagenes, esto puede demorar. Aguarde un instante por favor...");

    $('#cargando').modal('open');

    setTimeout(function() {

      var data = JSON.stringify(jsonFoto);

      $.ajax({
          type: "POST",
          url: "https://api.topinmobiliario.com/subirfotos.php",
          data: data,
          async: true,
          contentType: "application/json; charset=utf-8",
          dataType: 'json',
          success: function (res) {
            for (var i = 0; i < res.urls.length; i++) {
              $("#itemsFotos").append("<li class='col s6 m4' style='margin-bottom: 10px'><div class='list'><img class='full fotoInventario' src='" + res.urls[i] + "' width='100'><div class='center-align'><select style='width: 85px; display: inline-block' class='browser-default btn-remove'><option disabled selected>Eliminar</option><option>Confirmar</option></select><div><div></li>");
              cambioFotos = true;
            }
            $('#cargando').modal('close');
          }
      });

    }, (tiempo).toFixed());
}

function renderImage(file, pos, json)
{
    var reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = function (e) {

      //json[pos] = e.target.result;

      var img = new Image();
        img.src = e.target.result;

        img.onload = function(){

          var canvas = document.createElement('canvas'),
          ctx = canvas.getContext('2d');

          var ratio = 1;

          if(img.width > 1320)
          {
            ratio = 1320/img.width;
          }

          if(img.height > 1320)
          {
            ratio = 1320/img.height;
          }

          var jsonFoto = {};

          canvas.width = img.width*ratio;
          canvas.height = img.height*ratio;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          json[pos] = canvas.toDataURL();
        }
    }
}

function cargarPlanos() {

    mensaje("<i class='material-icons red-text'>hourglass_full</i> Cargando imagenes, un momento por favor...");

    var files = $('#subirPlanos')[0].files;

    var jsonPlano = {};

    for (var i = 0, f; f = files[i]; i++) {
      renderImage(files[i],i, jsonPlano);
    }

    setTimeout(function() {

      var data = JSON.stringify(jsonPlano);

      //console.log(data);

      $.ajax({
          type: "POST",
          url: "https://api.topinmobiliario.com/subirfotos.php",
          data: data,
          contentType: "application/json; charset=utf-8",
          dataType: 'json',
          success: function (res) {
            for (var i = 0; i < res.urls.length; i++) {
              $("#itemsPlanos").append("<li class='col s6 m4' style='margin-bottom: 10px'><div class='list'><img class='full planoInventario' src='" + res.urls[i] + "' width='100'><div class='center-align'><select style='width: 85px; display: inline-block' class='browser-default btn-remove'><option disabled selected>Eliminar</option><option>Confirmar</option></select><div><div></li>");
              cambioFotos = true;
            }
          }
      });

    }, 2000);
}

function validate(evt) {
  var theEvent = evt || window.event;

  // Handle paste
  if (theEvent.type === 'paste') {
      key = event.clipboardData.getData('text/plain');
  } else {
  // Handle key press
      var key = theEvent.keyCode || theEvent.which;
      key = String.fromCharCode(key);
  }
  var regex = /[0-9]|\./;
  if( !regex.test(key) ) {
    theEvent.returnValue = false;
    if(theEvent.preventDefault) theEvent.preventDefault();
  }
}

function scrollWin()
{
    window.scrollTo(0, scrollTop);
}

function scrollCap()
{
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
}

!function(t,e){"use strict";function n(){this.dispatchEvent(new CustomEvent("long-press",{bubbles:!0,cancelable:!0})),clearTimeout(o),console&&console.log&&console.log("long-press fired on "+this.outerHTML)}var o=null,s="ontouchstart"in t||navigator.MaxTouchPoints>0||navigator.msMaxTouchPoints>0,u=s?"touchstart":"mousedown",a=s?"touchcancel":"mouseout",i=s?"touchend":"mouseup";"initCustomEvent"in e.createEvent("CustomEvent")&&(t.CustomEvent=function(t,n){n=n||{bubbles:!1,cancelable:!1,detail:void 0};var o=e.createEvent("CustomEvent");return o.initCustomEvent(t,n.bubbles,n.cancelable,n.detail),o},t.CustomEvent.prototype=t.Event.prototype),e.addEventListener(u,function(t){var e=t.target,s=parseInt(e.getAttribute("data-long-press-delay")||"1500",10);o=setTimeout(n.bind(e),s)}),e.addEventListener(i,function(t){clearTimeout(o)}),e.addEventListener(a,function(t){clearTimeout(o)})}(this,document);
