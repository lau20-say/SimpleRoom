const socket = io('/')
const videoGrid = document.getElementById('videoGrid')
const myVideo = document.createElement('video')
const myAva = "https://i.pinimg.com/736x/94/3c/df/943cdfbd0e3d03859e0ba4f1398dcf84.jpg";
let myId;
myVideo.muted = true

var peer = new Peer()

const myPeer = new Peer(undefined, {
	path: '/peerjs',
	host: '/',
	port: '5000',
})

const peers = {}
let myVideoStream

socket.on('user-disconnected', (userId) => {
	const vde = document.getElementById(`user-${userId}`);
	const ava = document.getElementById(`avatar-${userId}`);

	if (vde) vde.remove();
	if (ava) ava.remove();
	updateVideoGridClass();
	if (peers[userId]) peers[userId].close()
})
socket.on("disconnect", () => {
	socket.emit("disconnect", myId);
});
peer.on('open', (id) => {
	myId = id;
	socket.emit('join-room', ROOM_ID, id, myAva)
	navigator.mediaDevices
		.getUserMedia({
			video: true,
			audio: false,
		})
		.then((stream) => {
			myVideoStream = stream
			addVideoStream(stream, myId)

			socket.on('user-connected', (userId) => {
				connectToNewUser(userId, stream)
			})

			peer.on('call', (call) => {
				call.answer(stream)
				const usid = call.metadata.userId;
				console.log(usid)
				const video = document.createElement('video')
				call.on('stream', (userVideoStream) => {
					addVideoStream(userVideoStream, usid)
				})
			})

			let text = $('input')

			$('html').keydown(function (e) {
				if (e.which == 13 && text.val().length !== 0) {
					socket.emit('message', text.val())
					text.val('')
				}
			})

			socket.on('createMessage', (message, userId) => {
				$('ul').append(`<li >
								<span class="messageHeader">
									<span>
										From 
										<span class="messageSender">Someone</span> 
										to 
										<span class="messageReceiver">Everyone:</span>
									</span>

									${new Date().toLocaleString('en-US', {
					hour: 'numeric',
					minute: 'numeric',
					hour12: true,
				})}
								</span>

								<span class="message">${message}</span>
							
							</li>`)
				scrollToBottom()
			})
		})

})

const connectToNewUser = (userId, stream) => {
	const call = peer.call(userId, stream, { metadata: { userId: myId } })
	const video = document.createElement('video')
	call.on('stream', (userVideoStream) => {
		addVideoStream(userVideoStream, userId)
	})
	call.on('close', () => {
		video.remove()
	})

	peers[userId] = call
}
function updateVideoGridClass() {
	const videoGrid = document.getElementById("videoGrid");
	const videoElements = videoGrid.children.length;

	videoGrid.className = "";

	if (videoElements === 1) {
		videoGrid.classList.add("one-set");
	} else if (videoElements === 2) {
		videoGrid.classList.add("two-set");
	} else if (videoElements === 3 || videoElements === 4) {
		videoGrid.classList.add("three-set");
	} else if (videoElements === 5 || videoElements === 6) {
		videoGrid.classList.add("four-set");
	} else if (videoElements === 7 || videoElements === 8) {
		videoGrid.classList.add("five-set");
	}
	else if (videoElements === 9 || videoElements === 10) {
		videoGrid.classList.add("six-set");
	} else if (videoElements === 11 || videoElements === 12) {
		videoGrid.classList.add("seven-set");
	} else if (videoElements === 13 || videoElements === 14) {
		videoGrid.classList.add("eight-set");
	}
}
const addVideoStream = (stream, userId) => {
	if (document.getElementById(`user-${userId}`)) {
		return;
	}
	const video = document.createElement('video')
	video.srcObject = stream;
	video.autoplay = true;
	video.id = `user-${userId}`;
	video.style.transform = "scaleX(-1)";
	video.playsInline = true;
	video.classList.add("card_video_mute")
	video.addEventListener('loadedmetadata', () => {
		video.play()
	})
	videoGrid.append(video)
	updateVideoGridClass();
}

const scrollToBottom = () => {
	var d = $('.mainChatWindow')
	d.scrollTop(d.prop('scrollHeight'))
}

const playStop = () => {
	console.log('object')
	let enabled = myVideoStream.getVideoTracks()[0].enabled
	if (enabled) {
		myVideoStream.getVideoTracks()[0].enabled = false
		setPlayVideo()
	} else {
		setStopVideo()
		myVideoStream.getVideoTracks()[0].enabled = true
	}
}
socket.on("user-off-cam", (userId, avatar) => {

	addAvatar(avatar, userId)
})
socket.on("user-on-cam", (userId) => {

	removeAvatar(userId)
})
const setStopVideo = () => {
	socket.emit("on-cam", myId)
	const html = `
	  <i class="fas fa-video"></i>
	  <span>Stop Video</span>
	`
	document.querySelector('.mainVideoButton').innerHTML = html
}

const setPlayVideo = () => {
	socket.emit("off-cam", myId)

	const html = `
	<i class="stop fas fa-video-slash"></i>
	  <span>Play Video</span>
	`
	document.querySelector('.mainVideoButton').innerHTML = html
}
const addAvatar = (ava, userId) => {
	const avatar = document.getElementById(`user-${userId}`)
	avatar.classList.add("camera-off-st")
	const div = document.createElement('div')
	div.id = `avatar-${userId}`;
	const html = `<div class="card_video_mute">
        <img src="${ava}" class="card_video_mute_img" alt="">
        <div class="camera_off"><i class="fa-solid fa-video-slash"></i></div>
        <div class="mic_off"><i class="fa-solid fa-microphone-slash"></i></div>
    </div>`;
	div.innerHTML = html;
	videoGrid.append(div);
};
const removeAvatar = (userId) => {
	const ava = document.getElementById(`avatar-${userId}`);
	const vid = document.getElementById(`user-${userId}`);
	if (ava) {
		ava.remove();
	}
	vid.classList.remove("camera-off-st")
}