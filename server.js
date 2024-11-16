const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer')
const peerServer = ExpressPeerServer(server, {
	debug: true,
})
const { v4: uuidv4 } = require('uuid')

const rooms = {};

app.use('/peerjs', peerServer)
app.use(express.static('public'))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
	res.redirect(`/${uuidv4()}`)
})
app.get('/end-call', (req, res) => {
	res.render('endcall')
})

app.get('/:room', (req, res) => {
	res.render('room', { roomId: req.params.room })
})

io.on('connection', (socket) => {
	socket.on('join-room', (roomId, userId, userAvatar) => {
		if (!rooms[roomId]) rooms[roomId] = [];
		socket.emit('all-users', rooms[roomId]);
		rooms[roomId].push({ userId, userAvatar });
		socket.join(roomId)
		socket.to(roomId).emit('user-connected', userId, userAvatar)
		socket.on("on-my-cam", () => {
			socket.emit("list-user", rooms[roomId]);
		})
		socket.on('message', (message) => {
			io.to(roomId).emit('createMessage', message, userId)
		})
		socket.on("off-cam", (userId) => {
			io.to(roomId).emit('user-off-cam', userId)
		})
		socket.on('disconnect', () => {
			console.log(userId);
			if (rooms[roomId]) {
				rooms[roomId] = rooms[roomId].filter((user) => user.userId !== userId);
				socket.to(roomId).emit('user-disconnected', userId);

			}
		});
	})
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => console.log(`Listening on port ${PORT}`))