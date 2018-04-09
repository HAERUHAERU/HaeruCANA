//주소 처리
//----------------------------------------------------------------------------------------

var QueryString = function () {
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = decodeURIComponent(pair[1])
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
            query_string[pair[0]] = arr
        } else {
            query_string[pair[0]].push(decodeURIComponent(pair[1]))
        }
    }
    return query_string
}();

var host_port = QueryString.HOST_PORT;

function editHost(wsUri) {
    while (host_port.endsWith('/')) {
        host_port = host_port.substring(0, host_port.length - 1)
    }
    if (wsUri.indexOf("//") == 0) {
        wsUri = wsUri.substring(2)
    }
    if (wsUri.indexOf("ws://") == 0 || wsUri.indexOf("wss://") == 0) {
        if (host_port.indexOf("ws://") == 0 || host_port.indexOf("wss://") == 0) {
            wsUri = wsUri.replace(/ws:\/\/@HOST_PORT@/im, host_port);
            wsUri = wsUri.replace(/wss:\/\/@HOST_PORT@/im, host_port)
        } else {
            wsUri = wsUri.replace(/@HOST_PORT@/im, host_port)
        }
    } else {
        if (host_port.indexOf("ws://") == 0 || host_port.indexOf("wss://") == 0) {
            wsUri = wsUri.replace(/@HOST_PORT@/im, host_port)
        } else {
            wsUri = "ws://" + wsUri.replace(/@HOST_PORT@/im, host_port)
        }
    }
    return wsUri
}

//ACTWebSocket 적용
//----------------------------------------------------------------------------------------

function connectWebSocket(uri) {
    websocket = new WebSocket(uri);
    websocket.onmessage = function (evt) {
        if (evt.data == ".")
            websocket.send(".");
        else
            BeforeLogLineRead(evt.data);
    };
    websocket.onclose = function (evt) {
        console.log("re-connect...");
        setTimeout(function () { connectWebSocket(uri) }, 5000);
    };
    websocket.onerror = function (evt) {
        console.log(evt);
        websocket.close();
    };
}

connectWebSocket(editHost(wsUri1))	//로그
connectWebSocket(editHost(wsUri2))	//전투 데이터
