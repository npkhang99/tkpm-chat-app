const express = require('express')
const app = express()
const CryptoJS = require("crypto-js")
const crypto = require("crypto")

// connect to database
var mysql = require('mysql');
 
console.log('Get connection ...');

require('dotenv').config()

var conn = mysql.createConnection({
    database: process.env.DATABASE,
    host: process.env.HOST,
    user: process.env.DBUSER,
    password: process.env.PASSWORD
}); 

conn.connect(function(err) {
    if (err) {
        console.log("Database connection error")
        console.log(err)
    }
    else{
        console.log("Connected!");
    }
});

//set the template engine ejs
app.set('view engine', 'ejs')

//middlewares
app.use(express.static('public'))

//routes
app.get('/', (req, res) => {
    res.render('index')
})
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

//Listen on port 3000
server = app.listen(3000, () => {
    console.log("Lisening on port 3000...")
})

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

    socket.on('username_login', (data) => {
        var load = "select * from account where username = '" + data.username + "'"; 
        conn.query(load, function(err, results) {
            if (err) {
                throw err;
            }

            console.log(results)

            if (results.length !== 1) {
                socket.emit("alert", {title: "Login failed!", message: `Username or password is incorrect`, type: "error"});
                return;
            }

            var line = results[0]
            var salted_password = data.password + line.salt
            var final_password = CryptoJS.SHA512(salted_password).toString()

            if (final_password !== line.pass) {
                socket.emit("alert", {title: "Login failed!", message: `Username or password is incorrect`, type: "error"});
                return;
            }
            
            // socket.emit('loggedin', {username: data.username})
            socket.emit("alert", {title: "Logged-in!", message: `Logged-in as ${data.username}`, type: "success", username: data.username});
            socket.username = data.username;
        });
    })
    
    socket.on('register', (data) => {
        conn.query(`select * from account where username = "${data.username}"`, (err, results, fields) => {
            if (results.length !== 0) {
                socket.emit("alert", {title: "Register failed!", message: `Username already exists`, type: "error"});
                // throw Error("Username already exists");
            }
            else {
                var salt = crypto.randomBytes(16).toString("base64")
                var salted_password = data.password + salt
                var final_password = CryptoJS.SHA512(salted_password).toString()
                
                var save = `Insert into account (username, pass, salt) Values ("${data.username}", "${final_password}", "${salt}")`;
                conn.query(save, function(err, results) {
                    if (err) throw err;
                    socket.emit("alert", {title: "Success!", message: `Your account has been successfully registerd`, type: "success"});
                    console.log("Successfully registered an account");
                });
            }
        })

    })

    //listen on typing
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', {username : socket.username})
    })
})
