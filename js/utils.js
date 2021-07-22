
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
//negs loop
function getNegsMinesCount(mat, rowIdx, colIdx) {
    var elementCounter = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > mat.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > mat[0].length - 1) continue
            if (i === rowIdx && j === colIdx) continue
            var cell = mat[i][j];
            if (cell.isMine) elementCounter++
        }
    }
    return elementCounter;
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
    // to start time:
    // gStartTime = new Date();
    // gTimerInterval = setInterval(renderTimer, seconds);
    // to stop time:
    // clearInterval(gTimerInterval);
    var currentTime = new Date();
    var timeElapsed = new Date(currentTime - gStartTime);
    var sec = timeElapsed.getUTCSeconds();
    var ms = timeElapsed.getUTCMilliseconds();
    //don't forget to put timer class in html
    document.querySelector('.timer span').innerHTML = (sec > 9 ? sec : '0' + sec) + ':' +
        (ms > 99 ? ms : ms > 9 ? '0' + ms : '00' + ms);
}




