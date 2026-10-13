// CArga los encabezados en el HTML
	
	// Parametro random para la recarga de los estilos
	var params = Math.ceil(Math.random() * 10831);

	var encabezado = "<title>SOM - Servicio de Ofertas M&uacute;ltiples</title>" +
	"<link href='css/icon.css?" + params + "' rel='stylesheet'>" +
	"<script src='js/jquery.min.js?" + params + "'></script>" +
	"<script src='js/jquery-ui.js?" + params + "'></script>" +
	"<script src='js/scripts.js?" + params + "'></script>" +
	"<meta charset='UTF-8'>" + 
	"<link type='text/css' rel='stylesheet' href='css/materialize.min.css?" + params + "'  media='screen,projection'/>" +
	"<meta name='viewport' content='width=device-width, initial-scale=1.0'/>" +
	"<meta http-equiv='Content-Type' content='text/html; charset=utf-8'/>";

	document.write(encabezado);