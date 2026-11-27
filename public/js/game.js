
var socket = io();

playerData = null;
yourTurn = null;
canPlay = false;


if ('addEventListener' in document) {
    document.addEventListener('DOMContentLoaded', function() {
        FastClick.attach(document.body);
    }, false);
}

function refreshPage(){
	location.reload()
}


degreeRotation = 0 
function spinObject(){
	if (document.getElementsByClassName("waitSpinner").length > 0){
		document.getElementsByClassName("waitSpinner")[0].style.transform = "rotate(" + degreeRotation + "deg)"
		document.getElementsByClassName("waitSpinner")[0].style.webkitTransform = "rotate(" + degreeRotation + "deg)"
		document.getElementsByClassName("waitSpinner")[1].style.transform = "rotate(" + degreeRotation + "deg)"
		document.getElementsByClassName("waitSpinner")[1].style.webkitTransform = "rotate(" + degreeRotation + "deg)"
		degreeRotation += 10
	}
}

loop = setInterval(spinObject, 1000/60)

function sandwichWithSpinners(elementId, sandwichText){
	var waitSpinner1 = document.createElement("i")
	var waitSpinner2 = document.createElement("i")
	
	waitSpinner1.setAttribute("class", "waitSpinner fa fa-spinner")
	waitSpinner2.setAttribute("class", "waitSpinner fa fa-spinner")
	
	var waitText = document.createTextNode(sandwichText)
	
	document.getElementById(elementId).innerHTML = ""
	
	document.getElementById(elementId).appendChild(waitSpinner1)
	document.getElementById(elementId).appendChild(waitText)
	document.getElementById(elementId).appendChild(waitSpinner2)
	
	loop = setInterval(spinObject, 1000/60)
}

//Creates a rematch button
function createRematchButton(){	
	var rematchBtn = document.createElement("button")
	
	var rematchText = document.createTextNode("Rematch?")
	
	rematchBtn.appendChild(rematchText)
	rematchBtn.setAttribute("id", "rematchButton")
	rematchBtn.setAttribute("class", "actionBtn btn btn-info")
	rematchBtn.setAttribute("onClick", "restartGame()")
	
	document.getElementById("gameState").appendChild(rematchBtn)
}


function createFindGameButton(){
	var findGame = document.createElement("button")
	findGame.setAttribute("class", "actionBtn btn btn-info")
	findGame.setAttribute("id", "findGameButton")
	findGame.setAttribute("onClick", "refreshPage()")
	
	var findGameText = document.createTextNode("New Game")
	
	findGame.appendChild(findGameText)
	
	document.getElementById("gameState").appendChild(findGame)
}

function resetBoxes(){
	for (var i = 1; i < 10; i ++){
		document.getElementById(i.toString()).innerHTML = ""
		document.getElementById(i.toString()).className = "box"
	}	
}
function resetScoreboard(){
	document.getElementById("XScore").innerHTML = "0"
	document.getElementById("tieScore").innerHTML = "0"
	document.getElementById("OScore").innerHTML = "0"

function checkTurn(){
	var turnText;
	if (yourTurn){
		clearInterval(loop)
		turnText = "Your Turn"
		document.getElementById("turn").innerHTML = turnText
		document.getElementById("turn").className = "yourTurn"
	}else{
		turnText = " Friend's Turn "
		document.getElementById("turn").className = "notYourTurn"
		sandwichWithSpinners("turn", turnText)
		
	}
}


socket.on("connect", function(){
	
	resetBoxes()
	resetScoreboard()
})


socket.on("playersJoined", function(joinInfo){
	playerData = joinInfo
	if (playerData.roomType == "private"){
		document.getElementById("roomId").innerHTML = "" + joinInfo.roomId
	}
	document.getElementById("player").innerHTML = "Now you are : " + joinInfo.letter
})

function removeSearchAction(){
	document.getElementById("loadingContainer").remove()
}

function removeSearchScreen(){
	document.getElementById("loadingContainer").setAttribute("class", "animated fadeOut")
	clearInterval(loadingLoop)
	setTimeout(removeSearchAction, 1500)
}

function gameStart(){	

	clearInterval(loop)
	
	
	if (document.getElementById("loadingContainer")){
		removeSearchScreen()
	}
	document.getElementById("gameContainer").style.display = "block"
	document.getElementById("gameState").innerHTML = ""
	canPlay = true
	yourTurn = playerData.turn
	checkTurn()
}


socket.on("gameStart", function(){
	gameStart()
})


function playerDisconnected(text){
	
	clearInterval(loop)
		
	document.getElementById("gameState").innerHTML = text
	
	document.getElementById("turn").innerHTML = ""
	if (playerData.roomType == "random"){
		createFindGameButton()
	}
	canPlay = false
}

socket.on("gameNotExist", function(roomId){
	document.getElementById("searchState").innerHTML = "Room " + roomId + "Not Exist."
})


socket.on("playerDisconnect", function(){
	playerDisconnected("Friend Disconnected")
})

function restartGame(){
	document.getElementById("rematchButton").remove()
	sandwichWithSpinners("gameState", " Waiting for Friend ")

	var roomId = playerData.roomId
	socket.emit("restartGame", roomId)
}

socket.on("gameRestarted", function(newPlayerData){
	playerData = newPlayerData
	resetBoxes()
	canPlay = true
	gameStart()
})


function addLetterToScoreboard(letter){
	var newScore = Number(document.getElementById(letter + "Score").innerHTML)
	newScore ++
	document.getElementById(letter + "Score").innerHTML = newScore
}


function endGameInit(){
	document.getElementById("turn").innerHTML = ""
	createRematchButton()
	canPlay = false
}

socket.on("winnerDetermined", function(winner){
	if (winner.youWon){
		document.getElementById("gameState").innerHTML = "You Won!"
	}else{
		document.getElementById("gameState").innerHTML = "You Lost..."
	}
	
	addLetterToScoreboard(winner.winningLetter)
	
	endGameInit()
})


function addClassByLetter(boxId, letter){
	if (letter == "X"){
		document.getElementById(boxId).className += " playerX" 
	}else if (letter == "O"){
		document.getElementById(boxId).className += " playerO"
	}
}

socket.on("tie", function(){
	document.getElementById("gameState").innerHTML = "It's tied !"
	endGameInit()
	addLetterToScoreboard("tie")
})


socket.on("otherTurn", function(){
	if (checkWinner()){
		socket.emit("winner", playerData)
	}else{
		if (checkTie()){
			socket.emit("tie", playerData.roomId)
		}else{
			yourTurn = false
			checkTurn()
		}
	}
})


socket.on("yourTurn", function(info){
	document.getElementById(info.boxPlayed).innerHTML = info.letter
	
	addClassByLetter(info.boxPlayed, info.letter)
	
	yourTurn = true
	checkTurn()
})


function areEqual(){
	var len = arguments.length;
	for (var i = 1; i< len; i++){
		if (arguments[i] == null || arguments[i] == "" || arguments[i] != arguments[i-1]){
			return false;
		}
	}
	return true;
}

function checkTie(){
	isTie = true
	for (var i = 1; i < 10; i ++){
		var box = document.getElementById(i.toString()).innerHTML
		if (box == "" || box == null){
			isTie = false
		}
	}
	return isTie
}

function prepareGameState(){
	boxContent = {}
	for (var i = 1; i < 10; i++){
		boxContent[i] = document.getElementById(i.toString()).innerHTML
	}
	console.log(prepareGameState)
}

function checkWinner(){
	
	box1 = document.getElementById("1").innerHTML
	box2 = document.getElementById("2").innerHTML
	box3 = document.getElementById("3").innerHTML
	
	box4 = document.getElementById("4").innerHTML
	box5 = document.getElementById("5").innerHTML
	box6 = document.getElementById("6").innerHTML
	
	box7 = document.getElementById("7").innerHTML
	box8 = document.getElementById("8").innerHTML
	box9 = document.getElementById("9").innerHTML
	
	isWinner = false
	
	
	if (areEqual(box1, box2, box3)){
		isWinner = true
	
	
	}else if (areEqual(box4, box5, box6)){
		isWinner = true
	}
	

	else if (areEqual(box7, box8, box9)){
		isWinner = true
	}
	
	
	else if (areEqual(box1, box4, box7)){
		isWinner = true
	}
	
	
	else if (areEqual(box2, box5, box8)){
		isWinner = true
	}
	
	
	else if (areEqual(box3, box6, box9)){
		isWinner = true
	}
	
	
	else if (areEqual(box1, box5, box9)){
		isWinner = true
	}
	
	
	else if (areEqual(box3, box5, box7)){
		isWinner = true
	}
	
	return isWinner
}

function boxClick(box){
	if (canPlay){
		if (yourTurn){
			if ( document.getElementById(box.id).innerHTML == ""){
				document.getElementById(box.id).innerHTML = playerData.letter
				
				addClassByLetter(box.id, playerData.letter)
				
				movePlayed = {
					player: playerData,
					box: box.id
				}
				
				socket.emit("playedMove", movePlayed)
			}
		}
	}
}
