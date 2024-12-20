const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer')
const peerServer = ExpressPeerServer(server, {
    debug: true,
})
const { v4: uuidv4 } = require('uuid')
const peerToAvatar = {};

app.use('/peerjs', peerServer)
app.use(express.static('public'))
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.redirect(`/${uuidv4()}`)
})

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room })
})

io.on('connection', (socket) => {
    socket.on('join-room', (roomId, userId, userAvatar) => {
        peerToAvatar[userId] = userAvatar;
        socket.join(roomId)
        socket.to(roomId).emit('user-connected', userId)

        socket.on('message', (message) => {
            io.to(roomId).emit('createMessage', message, userId)
        })
        socket.on("off-cam", (userId) => {
            io.to(roomId).emit('user-off-cam', userId, peerToAvatar[userId])
        })
        socket.on("on-cam", (userId) => {
            io.to(roomId).emit('user-on-cam', userId)
        })
        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId)
        })
    })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => console.log(`Listening on port ${PORT}`))