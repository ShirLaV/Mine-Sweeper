
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
function getEmptyCells(board, rowIdx, colIdx) {
    var emptyCells = [];
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (i >= rowIdx - 1 && i <= rowIdx + 1 && j >= colIdx - 1 && j <= colIdx + 1) continue;
            var currCell = board[i][j];
            // console.log(i, j)
            var elCurrCell = document.querySelector(`.cell-${i}-${j}`);
            if (currCell.isMine === false && elCurrCell.classList.contains('covered')) {
                emptyCells.push({ i, j });
            }
        }
    }
    return emptyCells;
}
function renderCell(location, value) {
    // location such as: {i: 2, j: 7}
    // Select the elCell and set the value
    var elCell = document.querySelector(`.cell${location.i}-${location.j}`);
    elCell.innerHTML = value;
}
function drawCell(cells) {
    return cells.pop()
}
function shuffle(items) {
    var randIdx, keep, i;
    for (i = items.length - 1; i > 0; i--) {
        randIdx = getRandomInt(0, items.length);

        keep = items[i];
        items[i] = items[randIdx];
        items[randIdx] = keep;
    }
    return items;
}
//timer
function renderTimer() {

    var currentTime = new Date();
    var timeElapsed = new Date(currentTime - gStartTime);
    var sec = timeElapsed.getUTCSeconds();
    var ms = timeElapsed.getUTCMilliseconds();
    var min = timeElapsed.getUTCMinutes();

    document.querySelector('.timer span').innerHTML = (min > 9 ? min : '0' + min) +':' 
    + (sec > 9 ? sec : '0' + sec) + ':' +
        (parseInt(ms/10));
}




