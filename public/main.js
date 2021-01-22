// Data: sender, reciver, amount, time
//       0       1        2       3
let speed = 1000 * 1000 // 1000 seconds pre frame
const transferTime = 60;
let curTime = data[0][3];
let prevTime = curTime;
const numDisplay = 30;
const displayRad = 350;
const curDisplayed = [];
const users = [];
const lerpRate = 0.1;
const CHIPWARE = "665310034514673686";
const DO_SCALE = false;
const MAX_SIZE = 200;
let curMaxSize = 0;
let transfers = [];
class User {
	constructor(id, name) {
		this.id = id;
		this.name = name;
		this.bal = 0;
		this.place = 0;
		this.x = 0;
		this.y = 0;
	}
	draw() {
		if (this.place > numDisplay && this.id != CHIPWARE) return;
		const anglePerPlace = (Math.PI * 2) / (numDisplay + 1);
		const targetX = windowWidth / 2 + Math.cos(anglePerPlace * this.place) * displayRad;
		const targetY = windowHeight / 2 + Math.sin(anglePerPlace * this.place) * displayRad;

		curMaxSize = max(curMaxSize, this.bal);

		let size = DO_SCALE ? (this.bal / curMaxSize) * MAX_SIZE : this.bal;

		this.x = lerp(this.x, targetX, lerpRate);
		this.y = lerp(this.y, targetY, lerpRate);
		if (this.id == CHIPWARE) {
			this.bal = 0;
			this.x = windowWidth / 2;
			this.y = windowHeight / 2;
		}
		noFill();
		stroke(200, 200, 200);
		ellipse(this.x, this.y, size, size);
		noStroke();
		fill(255);
		text(this.name, this.x - textWidth(this.name) / 2, this.y);
	}
}
class Transfer {
	constructor(sender, reciver, amount) {
		this.x = sender.x;
		this.y = sender.y;
		this.reciver = reciver;
		this.sender = sender;
		this.life = transferTime;
		this.dead = false;
		this.size = amount * 5;
	}
	draw() {
		this.life--;
		this.vx = (this.reciver.x - this.x) / this.life;
		this.vy = (this.reciver.y - this.y) / this.life;
		if (this.life <= 0) this.dead = true;
		this.x += this.vx;
		this.y += this.vy;
		noStroke();
		if (this.sender.id == CHIPWARE) {
			fill(51);
		} else {
			fill(0, 0, 200);
		}
		ellipse(this.x, this.y, this.size, this.size);
	}
}

function setup() {
	createCanvas(window.innerWidth, window.innerHeight);
}

function getUser(userID) {
	const user = users.find(user => user.id == userID);
	if (user) return user;
	const nameObj = usernames.find(uname => uname.id == userID);
	const name = nameObj ? nameObj.username : userID;
	const newUser = new User(userID, name);
	users.push(newUser);
	return newUser;
}

function handleData() {
	const timeIntervalStart = prevTime;
	const timeIntervalLen = curTime - prevTime;
	const timeIntervalEnd = timeIntervalStart + timeIntervalLen;
	const transactions = [];
	data.forEach(item => {
		const time = item[3];
		if (time > timeIntervalStart && time < timeIntervalEnd) {
			transactions.push(item);
		}
	});
	transactions.forEach(transaction => {
		const sender = getUser(transaction[0]);
		const reciver = getUser(transaction[1]);
		const amount = parseInt(transaction[2]);
		// console.log(amount);
		sender.bal -= amount;
		reciver.bal += amount;
		transfers.push(new Transfer(sender, reciver, amount));
	});
}

function draw() {
	background(0);
	handleData();
	users.sort((a, b) => b.bal - a.bal).forEach((user, idx) => {
		user.place = idx;
		user.draw();
	});
	transfers.forEach(transfer => transfer.draw());
	transfers = transfers.filter(transfer => !transfer.dead);
	prevTime = curTime;
	curTime += speed;
}