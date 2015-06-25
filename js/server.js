//Listen 443 port with https

var express = require(process.env.EXPRESS_PATH)
  , fs = require(process.env.FS_PATH)
  , routes = require(process.env.ROUTES_PATH);

// This allows to run the io and io3 Socket.IO servers (see below) with or
// without SSL depending on if the env var PRIVATE_KEY is defined (useful to
// run this same server.js in a devbox without SSL)
var httpsServerOptions349 =
        process.env.PRIVATE_KEY_339 ?
            {key: fs.readFileSync(process.env.PRIVATE_KEY_339).toString(),
             cert: fs.readFileSync(process.env.CA_CRT).toString() }
            :
            null;
var httpsServerOptions443 =
        process.env.PRIVATE_KEY_443 ?
            {key: fs.readFileSync(process.env.PRIVATE_KEY_443).toString(),
             cert: fs.readFileSync(process.env.CA_CRT).toString() }
            :
            null;


//////////  DEMO WEBSITE SERVER

// Demo website pages (which are expected to be in the /public directory)
// will only be served if the DEMO_WEBSITE_PORT environment variable is
// defined.

// Start page is /demo.html

// You can serve normal pages and AJAX requests with Express, and attach your
// socket.io server
// See http://socket.io/#how-to-use

// Just to be able to serve the demo website through HTTP, because
// when it's loaded by Chrome from the file system, there's this error
//   Unsafe JavaScript attempt to access frame with URL
//      file://localhost/Users/xavi/Development/quarking/demo-website/registro.html
//   from frame with URL 
//      file://localhost/Users/xavi/Development/quarking/demo-website/apiBCNQuark/qr.html?QRregister=1.
//   Domains, protocols and ports must match.
// This doesn't happen in Firefox.

//if (process.env.DEMO_WEBSITE_PORT) {
    // http://stackoverflow.com/questions/10434001/static-files-with-express-js
 //   var demoWebsiteServer = express();
  //  demoWebsiteServer.configure(function(){
   //     demoWebsiteServer.use(express.static(__dirname + '/public'));
 //   });
 //   demoWebsiteServer.listen(process.env.DEMO_WEBSITE_PORT);
//    console.log('Demo website listening on port ' +
 //               process.env.DEMO_WEBSITE_PORT);
//}

//////////  END OF DEMO WEBSITE SERVER

var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require(process.env.SOCKET_IO_PATH).listen(server);
server.listen(9349);

console.log("io server listening on port 9349");

var app3 = express()
  , https = require('https')
  , server3 = https.createServer(httpsServerOptions443,app3)
  , io3 = require(process.env.SOCKET_IO_PATH).listen(server3);
server3.listen(9443);

console.log("io3 server listening on port 9443");

var app2 = express()
  , http = require('http')
  , server2 = http.createServer(app2)
  , io2 = require(process.env.SOCKET_IO_PATH).listen(server2);
server2.listen(9348);

console.log("io2 server listening on port 9348");

var app4 = express()
  , http = require('http')
  , server4 = http.createServer(app4)
  , io4 = require(process.env.SOCKET_IO_PATH).listen(server4);
server4.listen(9988);

console.log("io4 server listening on port 9988");

var o = {};

io4.sockets.on('connection', function (socket) {
    socket.on('createSession', function(params){
        console.log("io4.-> socket.on('createSession'...)");

        try{
            var now = new Date();        
            var now2 = new Date().toString();
            var t = socket.handshake.headers.referer;
            var ip = socket.handshake.address;
            
            var mes = now.getMonth()+1;
            var log = fs.createWriteStream("logs/"+now.getFullYear()+"_"+mes+".txt", {'flags': 'a'});
            log.end(now2+"||"+t+"||"+ip.address+"\n");
            
            if(params.indexOf("SESSION_ID:") > -1) {
                var bk=params.split('SESSION_ID:');
                var bk2=bk[1].split('||rn');
                var sessionId = bk2[0];
            }
            else{
                var sessionId = socket.id;
            }        

            o["m"+socket.id] = sessionId;
        
            var fa=params.split('FIRST_CONTENT');
            var fad = fa[1];
            
            o[sessionId] = {"main":socket.id};
            o[sessionId]["fa"] = fad;

            var res;        
            if(socket.id) res = 'create_session_result_ok';
            else    res = 'create_session_result_error';
                
            var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:'+res+'||rnSESSION_ID:'+sessionId+'||rnMESSAGE_END';
            io4.sockets.socket(socket.id).emit('getResult', data);

        }
        catch (err) {
            console.log("Error: ",err);
        }
    });
    
    socket.on('connectTo', function(params){
        console.log("io4.-> socket.on('connectTo'...)");

        try{
            if(params.message) var aux = params.message;
            else var aux = params;

            var bk=aux.split('SESSION_ID:');
            var bk2=bk[1].split('||rn');
            var sessionId = bk2[0];

            o["m"+socket.id] = sessionId;

            if (o[sessionId]["device1"]) {
                var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:connect_to_request_error||rnNODE_ID:device1||rnMESSAGE_END';
                io4.sockets.socket(socket.id).emit('getResult', data);
            }
            else{
                o["m"+socket.id] = {"device1":socket.id};
                o[sessionId]["device1"] = socket.id;

                var res;
                if(socket.id){
                    res = 'connect_to_request_ok';
                    var data2 = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:mobile_connected||rnMESSAGE_END';
                    io4.sockets.socket(o[sessionId]["main"]).emit('getResult', data2);
                }  
                else res = 'connect_to_request_error';
                    
                var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:'+res+'||rnNODE_ID:device1||rnFIRST_CONTENT'+o[sessionId]["fa"];
                io4.sockets.socket(socket.id).emit('getResult', data);
            }
        }
        catch (err) {
            console.log("Error: ",err);
        }    
    });
    
    socket.on('suspend', function(){
        io4.sockets.socket(socket.id).emit('createSessionResponse', socket.id);
    });
    
    socket.on('reconnect', function(){
        io4.sockets.socket(socket.id).emit('createSessionResponse', socket.id);
    });
    
    socket.on('disconnect', function(){
        console.log("io4.-> socket.on('disconnect'...)");

        try{
            var temp = o["m"+socket.id];
            if(o[temp]){
                if (o[temp]["device1"]) {
                    var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:Cancel||rnMESSAGE_END';
                    io4.sockets.socket(o[temp]["device1"]).emit('getResult', data);
                    io4.sockets.socket(o[temp]["main"]).emit('getResult', data);
                }    
            }
        }
        catch (err) {
            console.log("Error: ",err);
        }
    });
    
    /* SEND_TO */
    socket.on('sendTo', function(message){
        console.log("io4.-> socket.on('sendTo'...)");

        try{
            if(message.message) var aux = message.message;
            else var aux = message;
            
            var bk=aux.split('FROM:');
            var bk2=bk[1].split('||rn');
            var bkFrom=bk2[0].split('@');
            
            var bk=aux.split('TO:');
            var bk2=bk[1].split('||rn');
            var bkTo=bk2[0].split('@');
            
            // see comments in the corresponding code of PLAIN-SOCKET SERVER
            var recipientSocket = o[bkFrom[0]][bkTo[1]];
            if (typeof recipientSocket === 'string') {
               // recipientSocket is a Socket.IO's socket id
               io4.sockets.socket(recipientSocket).emit('getResult', aux);
            }
            else {
               // recipientSocket is a plain-socket
               // http://nodejs.org/api/net.html#net_socket_write_data_encoding_callback
               recipientSocket.write("getResult " + aux + "\n");
            }
        }
        catch (err) {
            console.log("Error: ",err);
        }
    });
});

io4.sockets.on('disconnect', function(){
     console.log("Desconectado2");
});

io3.sockets.on('connection', function (socket) {
    socket.on('createSession', function(params){
        console.log("io3 -> socket.on('createSession'...)");

        try{
            var now = new Date();        
            var now2 = new Date().toString();
            var t = socket.handshake.headers.referer;
            var ip = socket.handshake.address;

            var result = [];
            for (var i = 0; i < params.length; i++) {
              result.push(params.charCodeAt(i)-1);
            }

            var cadenaRes = String.fromCharCode.apply(null, result);

            if(t.indexOf("idconnex") != -1){
                var bk=cadenaRes.split('WEBSERVICE:');
                var bk2=bk[1].split('||rn');
                var webS = bk2[0];
                webS = webS.replace("www.","");
                webS = webS.replace("CA.bcnquark.com","bcnquark.com");
                webS = webS.replace(".com","");
                webS = webS.replace(".es","");
                webS = webS.replace(".org","");
                webS = webS.replace(".cat","");
            }
            else{
                t="ok";
                webS="ok";
            }            

            if(t.indexOf(webS) != -1){            
                var mes = now.getMonth()+1;
                var log = fs.createWriteStream("logs/"+now.getFullYear()+"_"+mes+".txt", {'flags': 'a'});
                log.end(now2+"||"+t+"||"+ip.address+"\n");
                
                if(params.indexOf("SESSION_ID:") > -1) {
                    var bk=params.split('SESSION_ID:');
                    var bk2=bk[1].split('||rn');
                    var sessionId = bk2[0];
                }
                else{
                    var sessionId = socket.id;
                }        

                o["m"+socket.id] = sessionId;
            
                var fa=params.split('FIRST_CONTENT');
                var fad = fa[1];
                
                o[sessionId] = {"main":socket.id};
                o[sessionId]["fa"] = fad;

                var res;        
                if(socket.id) res = 'create_session_result_ok';
                else    res = 'create_session_result_error';
                    
                var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:'+res+'||rnSESSION_ID:'+sessionId+'||rnMESSAGE_END';
                io3.sockets.socket(socket.id).emit('getResult', data);
            }
            else{
                var res = 'create_session_result_ERROR';                
                var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:'+res+'||rnSESSION_ID:'+sessionId+'||rnMESSAGE_END';
                io3.sockets.socket(socket.id).emit('getResult', data);
            }
        }
        catch (err) {
            console.log("Error: ",err);
            var res = 'create_session_result_ERROR';                
                var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:'+res+'||rnSESSION_ID:'+sessionId+'||rnMESSAGE_END';
                io3.sockets.socket(socket.id).emit('getResult', data);
        }
    });
    
    socket.on('connectTo', function(params){
        console.log("io3 -> socket.on('connectTo'...)");

        try{
            if(params.message) var aux = params.message;
            else var aux = params;

            var bk=aux.split('SESSION_ID:');
            var bk2=bk[1].split('||rn');
            var sessionId = bk2[0];

            o["m"+socket.id] = sessionId;

            if (o[sessionId]["device1"]) {
                var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:connect_to_request_error||rnNODE_ID:device1||rnMESSAGE_END';
                io3.sockets.socket(socket.id).emit('getResult', data);
            }
            else{
                o["m"+socket.id] = {"device1":socket.id};
                o[sessionId]["device1"] = socket.id;

                var res;
                if(socket.id){
                    res = 'connect_to_request_ok';
                    var data2 = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:mobile_connected||rnMESSAGE_END';
                    io3.sockets.socket(o[sessionId]["main"]).emit('getResult', data2);
                }  
                else res = 'connect_to_request_error';
                    
                var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:'+res+'||rnNODE_ID:device1||rnFIRST_CONTENT'+o[sessionId]["fa"];
                io3.sockets.socket(socket.id).emit('getResult', data);
            }
        }
        catch (err) {
            console.log("Error: ",err);
        }    
    });
    
    socket.on('suspend', function(){
        io3.sockets.socket(socket.id).emit('createSessionResponse', socket.id);
    });
    
    socket.on('reconnect', function(){
        io3.sockets.socket(socket.id).emit('createSessionResponse', socket.id);
    });
    
    socket.on('disconnect', function(){
        console.log("io3 -> socket.on('disconnect'...)");

        try{
            var temp = o["m"+socket.id];
            if(o[temp]){
                if (o[temp]["device1"]) {
                    var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:Cancel||rnMESSAGE_END';
                    io3.sockets.socket(o[temp]["device1"]).emit('getResult', data);
                    io3.sockets.socket(o[temp]["main"]).emit('getResult', data);
                }    
            }
        }
        catch (err) {
            console.log("Error: ",err);
        }
    });
    
    /* SEND_TO */
    socket.on('sendTo', function(message){
        console.log("io3 -> socket.on('sendTo'...)");

        try{
            if(message.message) var aux = message.message;
            else var aux = message;
            
            var bk=aux.split('FROM:');
            var bk2=bk[1].split('||rn');
            var bkFrom=bk2[0].split('@');
            
            var bk=aux.split('TO:');
            var bk2=bk[1].split('||rn');
            var bkTo=bk2[0].split('@');
            
            // see comments in the corresponding code of PLAIN-SOCKET SERVER
            var recipientSocket = o[bkFrom[0]][bkTo[1]];
            if (typeof recipientSocket === 'string') {
               // recipientSocket is a Socket.IO's socket id
               io3.sockets.socket(recipientSocket).emit('getResult', aux);
            }
            else {
               // recipientSocket is a plain-socket
               // http://nodejs.org/api/net.html#net_socket_write_data_encoding_callback
               recipientSocket.write("getResult " + aux + "\n");
            }
        }
        catch (err) {
            console.log("Error: ",err);
        }
    });
});

io3.sockets.on('disconnect', function(){
     console.log("Desconectado2");
});

io.sockets.on('connection', function (socket) {
    socket.on('createSession', function(params){
        console.log("io -> socket.on('createSession'...)");

        try{
            var now = new Date();        
            var now2 = new Date().toString();
            var t = socket.handshake.headers.referer;
            var ip = socket.handshake.address;
            
            var mes = now.getMonth()+1;
            var log = fs.createWriteStream("logs/"+now.getFullYear()+"_"+mes+".txt", {'flags': 'a'});
            log.end(now2+"||"+t+"||"+ip.address+"\n");
            
            if(params.indexOf("SESSION_ID:") > -1) {
                var bk=params.split('SESSION_ID:');
                var bk2=bk[1].split('||rn');
                var sessionId = bk2[0];
            }
            else{
                var sessionId = socket.id;
            }        

            o["m"+socket.id] = sessionId;
        
            var fa=params.split('FIRST_CONTENT');
            var fad = fa[1];
            
            o[sessionId] = {"main":socket.id};
            o[sessionId]["fa"] = fad;

            var res;        
            if(socket.id) res = 'create_session_result_ok';
            else    res = 'create_session_result_error';
                
            var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:'+res+'||rnSESSION_ID:'+sessionId+'||rnMESSAGE_END';
            io.sockets.socket(socket.id).emit('getResult', data);

        }
        catch (err) {
            console.log("Error: ",err);
        }
    });
    
    socket.on('connectTo', function(params){
        console.log("io -> socket.on('connectTo'...)");

        try{
            if(params.message) var aux = params.message;
            else var aux = params;

            var bk=aux.split('SESSION_ID:');
            var bk2=bk[1].split('||rn');
            var sessionId = bk2[0];

            o["m"+socket.id] = sessionId;

            if (o[sessionId]["device1"]) {
                var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:connect_to_request_error||rnNODE_ID:device1||rnMESSAGE_END';
                io.sockets.socket(socket.id).emit('getResult', data);
            }
            else{
                o["m"+socket.id] = {"device1":socket.id};
                o[sessionId]["device1"] = socket.id;

                var res;
                if(socket.id){
                    res = 'connect_to_request_ok';
                    var data2 = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:mobile_connected||rnMESSAGE_END';
                    io.sockets.socket(o[sessionId]["main"]).emit('getResult', data2);
                }  
                else res = 'connect_to_request_error';
                    
                var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:'+res+'||rnNODE_ID:device1||rnFIRST_CONTENT'+o[sessionId]["fa"];
                io.sockets.socket(socket.id).emit('getResult', data);
            }
        }
        catch (err) {
            console.log("Error: ",err);
        }    
    });
    
    socket.on('suspend', function(){
        io.sockets.socket(socket.id).emit('createSessionResponse', socket.id);
    });
    
    socket.on('reconnect', function(){
        io.sockets.socket(socket.id).emit('createSessionResponse', socket.id);
    });
    
    socket.on('disconnect', function(){
        console.log("io -> socket.on('disconnect'...)");

        try{
            var temp = o["m"+socket.id];
            if(o[temp]){
                if (o[temp]["device1"]) {
                    var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:Cancel||rnMESSAGE_END';
                    io.sockets.socket(o[temp]["device1"]).emit('getResult', data);
                    io.sockets.socket(o[temp]["main"]).emit('getResult', data);
                }    
            }
        }
        catch (err) {
            console.log("Error: ",err);
        }
    });
    
    /* SEND_TO */
    socket.on('sendTo', function(message){
        console.log("io -> socket.on('sendTo'...)");
        
        try{
            if(message.message) var aux = message.message;
            else var aux = message;
            
            var bk=aux.split('FROM:');
            var bk2=bk[1].split('||rn');
            var bkFrom=bk2[0].split('@');
            
            var bk=aux.split('TO:');
            var bk2=bk[1].split('||rn');
            var bkTo=bk2[0].split('@');
            
            // see comments in the corresponding code of PLAIN-SOCKET SERVER
            var recipientSocket = o[bkFrom[0]][bkTo[1]];
            if (typeof recipientSocket === 'string') {
               // recipientSocket is a Socket.IO's socket id
               io.sockets.socket(recipientSocket).emit('getResult', aux);
            }
            else {
               // recipientSocket is a plain-socket
               // http://nodejs.org/api/net.html#net_socket_write_data_encoding_callback
               recipientSocket.write("getResult " + aux + "\n");
            }
        }
        catch (err) {
            console.log("Error: ",err);
        }
    });
});

io.sockets.on('disconnect', function(){
     console.log("Desconectado2");
});

io2.sockets.on('connection', function (socket) {
    socket.on('createSession', function(params){
        console.log("io2 -> socket.on('createSession'...)");

        try{
            var now = new Date();        
            var now2 = new Date().toString();
            var t = socket.handshake.headers.referer;
            var ip = socket.handshake.address;
            
            var mes = now.getMonth()+1;
            var log = fs.createWriteStream("logs/"+now.getFullYear()+"_"+mes+".txt", {'flags': 'a'});
            log.end(now2+"||"+t+"||"+ip.address+"\n");
            
            if(params.indexOf("SESSION_ID:") > -1) {
                var bk=params.split('SESSION_ID:');
                var bk2=bk[1].split('||rn');
                var sessionId = bk2[0];
            }
            else{
                var sessionId = socket.id;
            }        

            o["m"+socket.id] = sessionId;
        
            var fa=params.split('FIRST_CONTENT');
            var fad = fa[1];
            
            o[sessionId] = {"main":socket.id};
            o[sessionId]["fa"] = fad;

            var res;        
            if(socket.id) res = 'create_session_result_ok';
            else    res = 'create_session_result_error';
                
            var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:'+res+'||rnSESSION_ID:'+sessionId+'||rnMESSAGE_END';
            io2.sockets.socket(socket.id).emit('getResult', data);

        }
        catch (err) {
            console.log("Error: ",err);
        }
    });
    
    socket.on('connectTo', function(params){
        console.log("io2 -> socket.on('connectTo'...)");

        try{
            if(params.message) var aux = params.message;
            else var aux = params;

            var bk=aux.split('SESSION_ID:');
            var bk2=bk[1].split('||rn');
            var sessionId = bk2[0];

            o["m"+socket.id] = sessionId;

            if (o[sessionId]["device1"]) {
                var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:connect_to_request_error||rnNODE_ID:device1||rnMESSAGE_END';
                io2.sockets.socket(socket.id).emit('getResult', data);
            }
            else{
                o["m"+socket.id] = {"device1":socket.id};
                o[sessionId]["device1"] = socket.id;

                var res;
                if(socket.id){
                    res = 'connect_to_request_ok';
                    var data2 = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:mobile_connected||rnMESSAGE_END';
                    io2.sockets.socket(o[sessionId]["main"]).emit('getResult', data2);
                }  
                else res = 'connect_to_request_error';
                    
                var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:'+res+'||rnNODE_ID:device1||rnFIRST_CONTENT'+o[sessionId]["fa"];
                io2.sockets.socket(socket.id).emit('getResult', data);
            }
        }
        catch (err) {
            console.log("Error: ",err);
        }    
    });
    
    socket.on('suspend', function(){
        io2.sockets.socket(socket.id).emit('createSessionResponse', socket.id);
    });
    
    socket.on('reconnect', function(){
        io2.sockets.socket(socket.id).emit('createSessionResponse', socket.id);
    });
    
    socket.on('disconnect', function(){
        console.log("io2 -> socket.on('disconnect'...)");

        try{
            var temp = o["m"+socket.id];
            if(o[temp]){
                if (o[temp]["device1"]) {
                    var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:Cancel||rnMESSAGE_END';
                    io2.sockets.socket(o[temp]["device1"]).emit('getResult', data);
                    io2.sockets.socket(o[temp]["main"]).emit('getResult', data);
                }    
            }
        }
        catch (err) {
            console.log("Error: ",err);
        }
    });
    
    /* SEND_TO */
    socket.on('sendTo', function(message){
        console.log("io2 -> socket.on('sendTo'...)");
        
        try{
            if(message.message) var aux = message.message;
            else var aux = message;
            
            var bk=aux.split('FROM:');
            var bk2=bk[1].split('||rn');
            var bkFrom=bk2[0].split('@');
            
            var bk=aux.split('TO:');
            var bk2=bk[1].split('||rn');
            var bkTo=bk2[0].split('@');
            
            // see comments in the corresponding code of PLAIN-SOCKET SERVER
            var recipientSocket = o[bkFrom[0]][bkTo[1]];
            if (typeof recipientSocket === 'string') {
               // recipientSocket is a Socket.IO's socket id
               io2.sockets.socket(recipientSocket).emit('getResult', aux);
            }
            else {
               // recipientSocket is a plain-socket
               // http://nodejs.org/api/net.html#net_socket_write_data_encoding_callback
               recipientSocket.write("getResult " + aux + "\n");
            }
        }
        catch (err) {
            console.log("Error: ",err);
        }
    });
});

io2.sockets.on('disconnect', function(){
     console.log("Desconectado2");
});
/*

//////////  PLAIN-SOCKET SERVER

// Sequence diagram of the communication between the user's web browser,
// phone, and the proxy (this server, typically hosted and managed by
// Quarking, but not necessarily):
//
// // When the Quarking button in a web page displayed by the browser is
// // clicked...
// Browser->Proxy: createSession
//      o["m"+socket.id] = sessionId
//                           // <- bk2[0] | socket.id
//                           // <- in io2 and io3, but in io's createSession
//                           //    sessionId is always equal to socket.id
//      o[sessionId] = {"main": sessionId}
//      // For login, fad (First Action ?) contains the encrypted
//      // QLogin_request
//      o[sessionId]["fa"] = fad
// Proxy->Browser: getResult
//
// // When the phone scans the QR Code...
// Phone->Proxy: connectTo(sessionId)
//      // The phone obtained the sessionId from the QR Code generated by the
//      // browser.
//      // TODO: For plain-socket (vs Socket.IO) connections, there's not 'socket.id'
//      o["m"+socket.id] = {"device1":socket.id};
//      // For plain-socket (vs Socket.IO) connections, the 'socket.id' in the
//      // next line is replaced with 'socket' (because plain sockets don't
//      // have an id).
//      o[sessionId]["device1"] = socket.id
// Proxy->Phone: connect_to_request_ok
//      // The encrypted content received in the createSession message from
//      // the browser (o[sessionId]["fa"]) is sent to the phone.
// Proxy->Browser: mobile_connected
// Phone->Proxy: sendTo
//      // For login:
//      // Message containing the encrypted user credentials
// Proxy->Browser: sendTo
//      // For login:
//      // Message containing the encrypted user credentials

// http://www.hacksparrow.com/tcp-socket-programming-in-node-js.html
var net = require('net');

// when started as 127.0.0.1 it doesn't respond, the real address must be
// used instead
var SOCKET_SERVER_HOST = process.env.SOCKET_SERVER_HOST || '127.0.0.1';

// In Unix sudo is required to listen on ports below 1024. To avoid using
// sudo, the port can be set to something higher through the PORT100
// environment variable (actually, the PORT100 environment var can used to set
// the port to any value, of course). Idea from
// https://devcenter.heroku.com/articles/nodejs
var SOCKET_SERVER_PORT = process.env.SOCKET_SERVER_PORT || 80;


// Create a server instance, and chain the listen function to it.
// The function passed to net.createServer() becomes the event handler
//for the 'connection' event
// The socket object the callback function receives UNIQUE for each connection
net.createServer(function(socket) {

    // We have a connection - a socket object is assigned to the connection
    // automatically
    console.log('CONNECTED: ' + socket.remoteAddress + ':' +
                                                       socket.remotePort);
    // socket.id is undefined here, and docs do not say anything about Socket
    // objects having an id property.
    // http://nodejs.org/api/net.html#net_class_net_socket
    // Maybe only Socket.IO sockets have ids?
    // https://github.com/LearnBoost/socket.io/blob/master/lib/socket.js
    //
    console.log("socket.id: " + socket.id);

    // Add a 'data' event handler to this instance of socket
    // http://nodejs.org/api/net.html#net_event_data
    socket.on('data', function(data) {
        try
        {
            console.log('DATA ' + socket.remoteAddress + ': ' + data);

            // http://nodejs.org/api/buffer.html#buffer_buf_tostring_encoding_start_end
            var stringData = data.toString('utf8');

            // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/substring
            if (stringData.substring(0, 10) == "connectTo ") {

                console.log("EVENT connectTo");

                // Parses a message created like this...
                // "MESSAGE_BEGIN||rnMESSAGE_TYPE:connectTo||rnSESSION_ID:"+this.ids+"||rnMESSAGE_END"

                //if (params.message) var aux = params.message;
                //else var aux = params;
                var aux = stringData.substring(10);

                var bk = aux.split('SESSION_ID:');
                var bk2 = bk[1].split('||rn');
                var sessionId = bk2[0];

                // NEW! I still don't know what's the purpose of this, but plain sockets do NOT have an id
                //o["m"+socket.id] = sessionId;

                console.log("sessionId: " + sessionId);
                console.log("CONTENIDO ==> " + o[sessionId]["device1"]);
                // only one mobile device is allowed to connect for each sessionId
                if (o[sessionId]["device1"]) {
                    console.log("connect_to_request_error");
                    var data =
                            'MESSAGE_BEGIN||rnMESSAGE_TYPE:connect_to_request_error||rnNODE_ID:device1||rnMESSAGE_END';
                    //io2.sockets.socket(socket.id).emit('getResult', data);
                    //http://nodejs.org/api/net.html#net_socket_write_data_encoding_callback
                    socket.write("getResult " + data + "\n");
                }
                else {

                    // NEW! I still don't know what's the purpose of this, but plain sockets do NOT have an id
                    //o["m"+socket.id] = {"device1":socket.id};

                    // About the sessionId:
                    // When the user loads in his web browser the login page of a
                    // website that uses Quarking, this page sends a createSession
                    // message to Quarking servers and receives a sessionId in the
                    // response. This sessionId corresponds to the socket.id of the
                    // connection between the web page and a Quarking server.
                    //
                    // For messages coming through Socket.IO, the socket.id is stored
                    // in "device1", but plain sockets do not have an id property.
                    //   http://nodejs.org/api/net.html#net_class_net_socket
                    //   https://github.com/LearnBoost/socket.io/blob/master/lib/socket.js
                    // Because of this the entire socket is stored instead.
                    o[sessionId]["device1"] = socket;

                    var res;
                    if (socket) {
                        res = 'connect_to_request_ok';
                        var data2 =
                                'MESSAGE_BEGIN||rnMESSAGE_TYPE:mobile_connected||rnMESSAGE_END';
                        // "main" is assigned in the createSession event message handler
                        io2.sockets.socket(o[sessionId]["main"]).emit('getResult', data2);
                    }
                    else res = 'connect_to_request_error';

                    var data =
                            'MESSAGE_BEGIN||rnMESSAGE_TYPE:'+res+'||rnNODE_ID:device1||rnFIRST_CONTENT'+o[sessionId]["fa"];
                    //io3.sockets.socket(socket.id).emit('getResult', data);
                    //http://nodejs.org/api/net.html#net_socket_write_data_encoding_callback
                    console.log("will send this to the phone:\n");
                    console.log(data);
                    socket.write("getResult " + data + "\n");
                }

            }
            else if (stringData.substring(0, 7) == "sendTo ") {

                // Example message
                // 'MESSAGE_BEGIN||rn'
                //      'MESSAGE_TYPE:sendTo||rn'
                //      'FROM:'+sessionId+'@main||rn'
                //      'TO:'+sessionId+'@device1||rn'
                //      encryptedContent
                // There's a MESSAGE_END, but it's part of encryptedContent (!!?).

                // In the code for Socket.IO
                //
                // if(message.message) var aux = message.message;
                // else var aux = message;
                //
                // but here the message parameter is named data (stringData is
                // its string representation, see above), and I'm assuming it
                // doesn't have a message property.
                var aux = stringData.substring(7);

                // DOUBT:
                // what if sessionId or the encrypted content contain the string
                // FROM: or TO:?
                var bk = aux.split('FROM:');
                var bk2 = bk[1].split('||rn');
                var bkFrom = bk2[0].split('@');

                var bk = aux.split('TO:');
                var bk2 = bk[1].split('||rn');
                var bkTo = bk2[0].split('@');

                // Following the example above,
                //   bkFrom[0] would be sessionId
                //   bkTo[1] would be 'device1'
                // Using these 2 pieces of data, the socket where the message has
                // to be sent to is retrieved from the 'o' object,
                //   o[sessionId]['device1']
                // Depending on the typeof the retrieved value, the message is
                // sent through Socket.IO or a plain-socket (which corresponds to
                // the type of connection between the phone and this proxy).
                // The typeof socket.id is "string"
                // The typeof a plain socket is "object"
                var recipientSocket = o[bkFrom[0]][bkTo[1]];
                if (typeof recipientSocket === 'string') {
                    // recipientSocket is a Socket.IO's socket id
                    io2.sockets.socket(recipientSocket).emit('getResult', aux);
                }
                else {
                    // recipientSocket is a plain-socket
                    //http://nodejs.org/api/net.html#net_socket_write_data_encoding_callback
                    recipientSocket.write("getResult " + aux + "\n");
                }

            }

            // NEW!!
            // else if (stringData.substring(0, 11) == "disconnect ") {

            //     var temp = o["m"+socket.id];
            //     console.log("o-temp ==> "+o[temp]);
            //     if(o[temp]){
            //         if (o[temp]["device1"]) {
            //             var data = 'MESSAGE_BEGIN||rnMESSAGE_TYPE:Cancel||rnMESSAGE_END';
            //             io2.sockets.socket(o[temp]["device1"]).emit('getResult', data);
            //             io2.sockets.socket(o[temp]["main"]).emit('getResult', data);
            //         }    
            //     }
            // }
        }
        catch (err) {
            console.log("Error: ",err);
        }
    });

    // Add a 'close' event handler to this instance of socket
    socket.on('close', function(data) {
        console.log('CLOSED: ' + socket.remoteAddress +' '+ socket.remotePort);
    });

}).listen(SOCKET_SERVER_PORT, SOCKET_SERVER_HOST);
// http://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback

console.log('Plain-socket server listening on ' + SOCKET_SERVER_HOST + ':' +
            SOCKET_SERVER_PORT);

//////////  END OF PLAIN-SOCKET SERVER
*/
quark@nimbus:~/quark> 
