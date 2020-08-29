$(function(){
   	//make connection
	var socket = io.connect('http://localhost:3000')

	//buttons and inputs
	var message = $("#message")
	var username = $("#username")
	var send_message = $("#send_message")
	var send_username = $("#send_username")
	var chatroom = $("#chatroom")
	var feedback = $("#feedback")

	socket.on('load_data',(data) => {
		var bytes = CryptoJS.AES.decrypt(data.text, "Sleighs83Horton33Gumdrop")
		var decrypted_text = bytes.toString(CryptoJS.enc.Utf8)
		chatroom.append("<p class='message'>" + data.name + ": " + decrypted_text + "</p>")
	});

	//Emit message
	send_message.click(function(){
		var hash_value = CryptoJS.SHA256(message.val()).toString()
		var cipher_text = CryptoJS.AES.encrypt(message.val(), "Sleighs83Horton33Gumdrop").toString()
		socket.emit('new_message', {message: cipher_text, hash: hash_value})
	})

	//Listen on new_message
	socket.on("new_message", (data) => {
		console.log(data)

		var bytes = CryptoJS.AES.decrypt(data.message, "Sleighs83Horton33Gumdrop")
		var decrypted_text = bytes.toString(CryptoJS.enc.Utf8)
		var hash_value = CryptoJS.SHA256(decrypted_text).toString()

		if (hash_value !== data.hash) {
			throw "Hash not match, message corrupted or changed"
		}

		feedback.html('');
		message.val('');
		chatroom.append("<p class='message'>" + data.username + ": " + decrypted_text + "</p>")
	})

	//Emit a username
	send_username.click(function(){
		socket.emit('change_username', {username : username.val()})

	})

	//Emit typing
	message.bind("keypress", () => {
		socket.emit('typing')
	})

	//Listen on typing
	socket.on('typing', (data) => {
		feedback.html("<p><i>" + data.username + " is typing a message..." + "</i></p>")
	})
});
