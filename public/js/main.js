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

const socket = io('/')
let myId, myAva = "https://i.pinimg.com/736x/1b/f8/28/1bf82870c80483a1e1728be4fa535b11.jpg";
const videoGrid = document.getElementById('videoGrid')
var peer = new Peer()
const myPeer = new Peer(undefined, {
	path: '/peerjs',
	host: '/',
	port: '5000',

})

let peers = {};
let myVideoStream;

peer.on('open', (id) => {
	myId = id;
	socket.emit('join-room', ROOM_ID, myId, myAva)
	AddUser(myId, myAva)
	socket.on("all-users", (allUser) => {
		allUser.forEach(user => {
			AddUser(user.userId, user.userAvatar);
		});
	})
	socket.on('user-connected', (toId, toAva) => {
		AddUser(toId, toAva);
	})
	socket.on("user-disconnected", (userId) => {
		RemoveUser(userId);
	})
	peer.on('call', function (call) {
		const UserID = call.metadata.userID;
		call.answer();
		call.on('stream', (stream) => {
			console.log(UserID, stream)
			OnCamUser(UserID, stream)
		})

	});
	socket.on("disconnect", () => {
		socket.emit("disconnect")
	});
	let text = $('input')

	$('html').keydown(function (e) {
		if (e.which == 13 && text.val().length !== 0) {
			socket.emit('message', text.val())
			text.val('')
		}
	})

	socket.on('createMessage', (message, userId) => {
		const messageClass = userId === myId ? 'myMessage' : 'otherMessage'; // Xác định class dựa trên userId

		$('ul').append(`
        <li class="${messageClass}">
            <span class="messageHeader">
                <span>
                    From 
                    <span class="messageSender">${userId === myId ? 'You' : 'Someone'}</span> 
                    to 
                    <span class="messageReceiver">Everyone:</span>
                </span>
                ${new Date().toLocaleString('en-US', {
			hour: 'numeric',
			minute: 'numeric',
			hour12: true,
		})}
            </span>
            <span class="messageContent">${message}</span>
        </li>
    `);

		scrollToBottom();
	});


})


const AddUser = (id, ava) => {
	if (document.getElementById(`user-${id}`)) {
		document.getElementById(`user-${id}`).remove();
	}
	const UserDiv = document.createElement('div');
	UserDiv.id = `user-${id}`;

	const Avatar = document.createElement('div');
	const Video = document.createElement('video');

	Avatar.id = `avatar-${id}`
	Avatar.classList.add("card_video_mute");
	Avatar.innerHTML = `<img src="${ava}" class="card_video_mute_img" alt="">`;
	UserDiv.appendChild(Avatar);

	Video.srcObject = null;
	Video.autoplay = true;
	Video.id = `video-${id}`
	Video.classList.add("card_video_mute")
	Video.muted = true;
	Video.classList.add("camera-off-st")
	Video.style.transform = "scaleX(-1)";
	Video.playsInline = true;
	Video.addEventListener('loadedmetadata', () => {
		Video.play()
	})
	UserDiv.appendChild(Video)
	videoGrid.appendChild(UserDiv);
	updateVideoGridClass()


}
const RemoveUser = (id) => {
	console.log(id)
	const userElement = document.getElementById(`user-${id}`);
	if (userElement) {
		userElement.remove();
	}
	updateVideoGridClass()

}
const OnCamUser = (id, stream) => {
	document.getElementById(`avatar-${id}`).classList.add("camera-off-st");
	document.getElementById(`video-${id}`).srcObject = stream;
	document.getElementById(`video-${id}`).classList.remove("camera-off-st")
	document.getElementById(`video-${id}`).play();
	const video = document.getElementById(`video-${id}`);
	video.addEventListener('loadedmetadata', () => {
		video.play().catch(err => console.error("Error playing video:", err));
	});
}
const OffCamUser = (id) => {
	const videoElement = document.getElementById(`video-${id}`);
	const avatarElement = document.getElementById(`avatar-${id}`);

	if (videoElement) {
		videoElement.classList.add("camera-off-st");

		videoElement.srcObject = null;
	} else {
		console.warn(`Video element for user ${id} not found.`);
	}

	if (avatarElement) {
		avatarElement.classList.remove("camera-off-st");
	} else {
		console.warn(`Avatar element for user ${id} not found.`);
	}
};

socket.on("user-off-cam", (userID) => {
	OffCamUser(userID)
})
const OnCam = () => {
	const videoButton = document.querySelector('.mainVideoButton'); // Tìm phần tử nút bật/tắt camera

	if (!myVideoStream) {
		navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
			myVideoStream = stream;
			OnCamUser(myId, stream);

			socket.emit("on-my-cam");

			socket.on("list-user", (list) => {
				list.forEach((user) => {
					if (user.userId !== myId) {
						const call = peer.call(user.userId, stream, {
							metadata: {
								userID: myId
							}
						});
						call.on('error', (err) => {
							console.error("Error in call:", err);
						});
					}
				});
			});

			videoButton.innerHTML = `
                <i class="fas fa-video"></i>
                <span>Stop Video</span>
            `;
		});
	} else {
		myVideoStream.getTracks().forEach((track) => track.stop());
		myVideoStream = null;

		socket.emit("off-cam", myId);
		OffCamUser(myId);

		videoButton.innerHTML = `
            <i class="fa-solid fa-video-slash"></i>
            <span>Play Video</span>
        `;
	}
};

const toggleChat = () => {
	const div = document.querySelector('.mainRight');

	if (div) {
		const hasClass = div.classList.contains('camera-off-st');

		if (hasClass) {
			div.classList.remove("camera-off-st");
		} else {
			div.classList.add("camera-off-st");
		}
	} else {
		console.warn('Không tìm thấy phần tử có class "mainRight".');
	}
};
const leave = () => {
	window.location.href = "/end-call"
}
const scrollToBottom = () => {
	var d = $('.mainChatWindow')
	d.scrollTop(d.prop('scrollHeight'))
}