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

quark@nimbus:~/quark> 
