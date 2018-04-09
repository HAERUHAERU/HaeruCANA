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

class ActWebsocketInterface {
    constructor(uri, path = "MiniParse") {
        var querySet = this.getQuerySet();
        this.uri = uri;
        this.id = null;
        this.activate = !1;
        var This = this;
        document.addEventListener('onBroadcastMessage', function (evt) {
            This.onBroadcastMessage(evt)
        });
        document.addEventListener('onRecvMessage', function (evt) {
            This.onRecvMessage(evt)
        });
        window.addEventListener('message', function (e) {
            if (e.data.type === 'onBroadcastMessage') {
                This.onBroadcastMessage(e.data)
            }
            if (e.data.type === 'onRecvMessage') {
                This.onRecvMessage(e.data)
            }
        })
    }
    connect() {
        if (typeof this.websocket != "undefined" && this.websocket != null)
            this.close();
        this.activate = !0;
        var This = this;
        this.websocket = new WebSocket(this.uri);
        this.websocket.onopen = function (evt) {
            This.onopen(evt)
        };
        this.websocket.onmessage = function (evt) {
            This.onmessage(evt)
        };
        this.websocket.onclose = function (evt) {
            This.onclose(evt)
        };
        this.websocket.onerror = function (evt) {
            This.onerror(evt)
        }
    }
    close() {
        this.activate = !1;
        if (this.websocket != null && typeof this.websocket != "undefined") {
            this.websocket.close()
        }
    }
    onopen(evt) {
        if (this.id != null && typeof this.id != "undefined") {
            this.set_id(this.id)
        } else {
            if (typeof overlayWindowId != "undefined") {
                this.set_id(overlayWindowId)
            } else {
                var r = new RegExp('[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}');
                var id = r.exec(navigator.userAgent);
                if (id != null && id.length == 1) {
                    this.set_id(id[0])
                }
            }
        }
    }
    onclose(evt) {
        this.websocket = null;
        if (this.activate) {
            var This = this;
            setTimeout(function () {
                This.connect()
            }, 5000)
        }
    }
    onmessage(evt) {
        if (evt.data == ".") {
            this.websocket.send(".")
        } else {
            try {
                var obj = JSON.parse(evt.data);
                var type = obj.type;
                if (type == "broadcast") {
                    var from = obj.from;
                    var type = obj.msgtype;
                    var msg = obj.msg;
                    document.dispatchEvent(new CustomEvent('onBroadcastMessage', {
                        detail: obj
                    }))
                }
                if (type == "send") {
                    var from = obj.from;
                    var type = obj.msgtype;
                    var msg = obj.msg;
                    document.dispatchEvent(new CustomEvent('onRecvMessage', {
                        detail: obj
                    }))
                }
                if (type == "set_id") { }
            } catch (e) { }
        }
    }
    onerror(evt) {
        this.websocket.close();
        console.log(evt)
    }
    getQuerySet() {
        var querySet = {};
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            try {
                var pair = vars[i].split('=');
                querieSet[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
            } catch (e) { }
        }
        return querySet
    }
    broadcast(type, msg) {
        if (typeof overlayWindowId != 'undefined' && this.id != overlayWindowId) {
            this.set_id(overlayWindowId)
        }
        var obj = {};
        obj.type = "broadcast";
        obj.msgtype = type;
        obj.msg = msg;
        this.websocket.send(JSON.stringify(obj))
    }
    send(to, type, msg) {
        if (typeof overlayWindowId != 'undefined' && this.id != overlayWindowId) {
            this.set_id(overlayWindowId)
        }
        var obj = {};
        obj.type = "send";
        obj.to = to;
        obj.msgtype = type;
        obj.msg = msg;
        this.websocket.send(JSON.stringify(obj))
    }
    overlayAPI(type, msg) {
        var obj = {};
        if (typeof overlayWindowId != 'undefined' && this.id != overlayWindowId) {
            this.set_id(overlayWindowId)
        }
        obj.type = "overlayAPI";
        obj.to = overlayWindowId;
        obj.msgtype = type;
        obj.msg = msg;
        this.websocket.send(JSON.stringify(obj))
    }
    set_id(id) {
        var obj = {};
        obj.type = "set_id";
        obj.id = id;
        this.id = overlayWindowId;
        this.websocket.send(JSON.stringify(obj))
    }
    onRecvMessage(e) { }
    onBroadcastMessage(e) { }
};
class WebSocketImpl extends ActWebsocketInterface {
    constructor(uri, path = "MiniParse") {
        super(uri, path)
    }
    onRecvMessage(e) {
        onRecvMessage(e)
    }
    onBroadcastMessage(e) {
        onBroadcastMessage(e)
    }
};
if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", function () {
        document.removeEventListener("DOMContentLoaded", arguments.callee, !1);
        domReady()
    }, !1);
    window.onbeforeunload = function () {
        webs.close()
    };
    window.addEventListener("unload", function () {
        webs.close()
    }, !1)
} else if (document.attachEvent) {
    document.attachEvent("onreadystatechange", function () {
        if (document.readyState === "complete") {
            document.detachEvent("onreadystatechange", arguments.callee);
            domReady()
        }
    })
}
window.addEventListener('message', function (e) {
    if (e.data.type === 'onBroadcastMessage') {
        onBroadcastMessage(e.data)
    }
    if (e.data.type === 'onRecvMessage') {
        onRecvMessage(e.data)
    }
});

function domReady() {
    try {
        webs = new WebSocketImpl(wsUri2);
        webs.connect();
        console.log("Connecting...")
    } catch (ex) {
        console.log("[ERROR] : WebSocket has Error [] " + ex)
    }
    try {
        document.addEventListener('beforeLogLineRead', beforeLogLineRead)
    } catch (ex) { }
    try {
        document.addEventListener('onLogLineRead', onLogLineRead)
    } catch (ex) { }
    try {
        document.addEventListener('onOverlayDataUpdate', onOverlayDataUpdate)
    } catch (ex) {
        console.log("Core Error : onOverlayDataUpdate is not defined.")
    }
    try {
        document.addEventListener('onOverlayStateUpdate', onOverlayStateUpdate)
    } catch (ex) { }
    try {
        onDocumentLoad()
    } catch (ex) { }
}

function onRecvMessage(e) {
    if (e.detail.msgtype == "Chat") {
        document.dispatchEvent(new CustomEvent("onChatting", {
            detail: e.detail.msg
        }))
    } else {
        console.log(e.detail.msgtype + ":" + e.detail.msg)
    }
}

function onBroadcastMessage(e) {
    switch (e.detail.msgtype) {
        case "AddCombatant":
            break;
        case "RemoveCombatant":
            break;
        case "AbilityUse":
            break;
        case "Chat":
            document.dispatchEvent(new CustomEvent("onChatting", {
                detail: e.detail.msg
            }));
            break;
        default:
            console.log(e.detail.msgtype + ":" + e.detail.msg);
            break
    }
}