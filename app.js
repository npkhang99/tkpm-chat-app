const express = require('express')
const app = express()

// connect to database
var mysql = require('mysql');
 
console.log('Get connection ...');
 
var conn = mysql.createConnection({
    database: 'message',
    host: "localhost",
    user: "root",
    password: "7762141604"
}); 

conn.connect(function(err) {
  console.log("Connected!");
});

//set the template engine ejs
app.set('view engine', 'ejs')

//middlewares
app.use(express.static('public'))

//routes
app.get('/', (req, res) => {
    res.render('index')
})

//Listen on port 3000
server = app.listen(3000)

//socket.io instantiation
const io = require("socket.io")(server)

//listen on every connection
io.on('connection', (socket) => {
    console.log('New user connected')

    var load = "select username, textmess from allmessage"; 
    conn.query(load, function(err, results) {
        if (err) {
            throw err;
        }

        for (var i = 0; i < results.length; i++) {
            socket.emit('load_data', {name: results[i].username, text: results[i].textmess});
        }
    });

    //default username
    socket.username = "Anonymous"

    //listen on change_username
    socket.on('change_username', (data) => {
        socket.username = data.username  
        
    })

    //listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        io.sockets.emit('new_message', {message : data.message, hash: data.hash, username : socket.username});

        conn.connect(function(err) {
            //if (err) throw err;
            console.log("Connected!");
            
            var save = "Insert into allmessage (username, textmess) " + " Values ('" + socket.username + "','" + data.message +"')"; 
            conn.query(save, function(err, results) {
                if (err) throw err;
                console.log("Insert a record!");
            });
        });
    })

    //listen on typing
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', {username : socket.username})
    })
})
