'use strict'
const MINE = '💣';
const FLAG = '🚩';
const EMPTY = '';
const HEART = '♥';

var gLevel = { size: 4, mines: 2 };
var gBoard;
var gGame;
var gElClickedMine = null;
var gStartTime;
var gTimerInterval;
var gHearts;


function init() {
    resetParameters();
    gBoard = buildBoard(gLevel.size);
    renderBoard(gBoard, 'game-board');
}
function resetParameters() {
    clearInterval(gTimerInterval);
    gGame = {
        isOn: false,
        isManual: false,
        isFirstClick: true,
        shownCount: 0,
        shownMinesCount: 0,
        markedCount: 0,
        secsPassed: 0,
        lives: 3,
        safeClicks: 3
    }
    gPrevMoves = [];
    gCurrMove = {
        isFirstClick: true,
        shownCount: 0,
        uncoveredElCells: [],
        searchedCells: []
    };
    gIsManualMode = false;
    gIsHint = false;
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = '😀';
    var elHintes = document.querySelectorAll('.hints span');
    for (var i = 0; i < elHintes.length; i++) {
        elHintes[i].style.display = 'inline';
        elHintes[i].classList.remove('hinted');
    }
    if (gLevel.size === 4) {
        gGame.lives = 2;
        gHearts = HEART + HEART;
    } else gHearts = HEART + HEART + HEART;
    document.querySelector('.lives span').innerText = gHearts;
    document.querySelector('.timer span').innerText = '00:00:00';
    document.querySelector('.safe-click span').innerText = gGame.safeClicks;
    document.querySelector('.manual button').innerText = 'Manual'
    gIsSave = false;
    setBestScore('begginer');
    setBestScore('medium');
    setBestScore('expert');
}
function buildBoard(size) {
    var board = [];
    for (var i = 0; i < size; i++) {
        board[i] = [];
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: true,
                isSearced: false
            };
        }
    }
    return board;
}
function renderBoard(board, selector) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += `<tr>\n`;
        for (var j = 0; j < board[0].length; j++) {
            var className = `cell cell-${i}-${j} covered`;
            strHTML += `<td class="${className}" onmousedown="checkClickType(this, ${i}, ${j}, event)" ></td>\n`
        }
        strHTML += '</tr>'
    }
    var elContainer = document.querySelector('.' + selector);
    elContainer.innerHTML = strHTML;
}
function generateMines(board, rowIdx, colIdx) {
    var emptyCells = getEmptyCells(board, rowIdx, colIdx);
    shuffle(emptyCells);
    // console.log(emptyCells)
    for (var i = 0; i < gLevel.mines; i++) {
        var currCell = drawCell(emptyCells);
        gBoard[currCell.i][currCell.j].isMine = true;
        var elCell = document.querySelector(`.cell-${currCell.i}-${currCell.j}`);
        // elCell.classList.add('mine');
    }
}
function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var cell = board[i][j];
            var minesCount = getNegsMinesCount(board, i, j);
            cell.minesAroundCount = minesCount;
        }
    }
}
function getNegsMinesCount(mat, rowIdx, colIdx) {
    var minesCounter = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > mat.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > mat[0].length - 1) continue
            if (i === rowIdx && j === colIdx) continue
            var cell = mat[i][j];
            if (cell.isMine) minesCounter++
        }
    }
    return minesCounter;
}
function checkClickType(elCell, i, j, e) {

    //start the timer after first click - right or left (unless manual mode)
    if (!gGame.isOn) {
        if (!gGame.isFirstClick) return;
        else if (!gIsManualMode) {
            gStartTime = new Date();
            gTimerInterval = setInterval(renderTimer, 10);
            gGame.isOn = true;
        }
    }

    var rightclick;
    if (!e) var e = window.event;
    if (e.button) rightclick = (e.button === 2)
    if (rightclick) {
        if (!gBoard[i][j].isShown) cellMarked(elCell, i, j);
        else if (elCell.classList.contains('covered')) cellMarked(elCell, i, j);
    }
    else {
        if (elCell.innerText !== FLAG) cellClicked(elCell, i, j);
    }
}
//on right click, mark the cell with flag
function cellMarked(elCell, i, j) {
    console.log('hi')
    if (elCell.innerText !== FLAG) {
        // console.log('marked!')
        elCell.innerText = FLAG;
        if (gBoard[i][j].isMine) gGame.markedCount++;
        if (checkVictory()) endGame(true);

    } else {
        // console.log('Unmarked!')
        elCell.innerText = EMPTY;
        if (gBoard[i][j].isMine) gGame.markedCount--;
    }
}
//on left click, check cell and reveal accordingly
function cellClicked(elCell, i, j) {
    //in manual mode:
    if (gIsManualMode) {
        if (gManualMineCount > 0) {
            gBoard[i][j].isMine = true;
            elCell.innerText = MINE;
            gManualMineCount--;
            if (!gManualMineCount) document.querySelector('.manual button').innerText = 'Play▶';
        }
        return;
    }

    //in hint mode:
    if (gIsHint) {
        if (!elCell.classList.contains('covered')) return;
        presentHint(i, j);
        return;
    }
    //first Click:
    if (gGame.isFirstClick) {
        if (!gGame.isManual) {
            firstClick(elCell, i, j);
            return;
        } else {
            setMinesNegsCount(gBoard);
            gGame.isFirstClick = false;
            gCurrMove.isFirstClick = false;
        }
    }

    var currCell = gBoard[i][j];
    currCell.isShown = true;
    var cellMineCount = currCell.minesAroundCount;

    //if cell is mine:
    if (currCell.isMine) {
        clickedMine(elCell);
        return;
    }

    if (elCell.classList.contains('covered')) {
        gGame.shownCount++;
        //updating prev move for undo:
        gCurrMove.shownCount++;
        gCurrMove.uncoveredElCells.push(elCell);
        gCurrMove.searchedCells.push(currCell);
    }

    elCell.classList.remove('covered');
    //if has mines negs
    if (cellMineCount) {
        elCell.innerText = cellMineCount;
        renderCountColor(elCell, cellMineCount);
    } else {
        //if doesn't have mines negs
        elCell.innerText = EMPTY;
        revealNegs(i, j);
    }
    savePrevMove();
    //check victory
    if (checkVictory()) endGame(true);
}
//if clicked MINE - check if there are still lives and update:
function checkGameOver() {
    if (gGame.lives > 0) {
        gGame.lives--;
        gHearts = gHearts.substring(0, gHearts.length - 1);
        document.querySelector('.lives span').innerText = gHearts;
        if (!gGame.lives) return true;
    }
    return false;
}
function checkVictory() {
    // console.log('gGame.shownCount', gGame.shownCount)
    if (gGame.shownMinesCount + gGame.markedCount === gLevel.mines) {
        if (gGame.shownCount === gLevel.size ** 2 - gLevel.mines) return true;
    }
    return false;
}
function endGame(isWin) {
    gGame.isOn = !gGame.isOn
    clearInterval(gTimerInterval);
    if (isWin) {
        //winning
        // console.log('you win');
        gGame.secsPassed = new Date - gStartTime;
        var level = (gLevel.size === 4) ? 'begginer' : (gLevel.size === 8) ? 'medium' : 'expert';
        checkBestScore(level, gGame.secsPassed)
        var elCells = document.querySelectorAll('.cell');
        for (var i = 0; i < elCells.length; i++) {
            elCells[i].classList.remove('covered');
        }
    } else {
        //losing
        // console.log('GAME OVER- YOU LOSE')
        var elMines = document.querySelectorAll('.mine');
        for (var i = 0; i < elMines.length; i++) {
            elMines[i].classList.add('clicked-mine');
            elMines[i].classList.remove('covered');
            elMines[i].innerText = MINE;
        }
    }
    var elSmiley = document.querySelector('.smiley');
    elSmiley.innerText = (isWin) ? '😎' : '🤯'
}
//when clicked on level:
function chooseBoardSize(elLevel) {
    gLevel.size = +elLevel.getAttribute('data-size');
    gLevel.mines = +elLevel.getAttribute('data-mines');
    clearInterval(gTimerInterval);
    init();
}
//render the colors of the numbers on the board (1- blue, 2- green...):
function renderCountColor(elCell, cellMineCount) {
    switch (cellMineCount) {
        case 1:
            elCell.style.color = '#007ea7'
            break;
        case 2:
            elCell.style.color = '#0ead69'
            break;
        case 3:
            elCell.style.color = '#c32f27'
            break;
        case 4:
            elCell.style.color = '#003459'
            break;
        case 5:
            elCell.style.color = '#780116'
            break;
    }
}
function firstClick(elCell, i, j) {
    if (gIsManualMode) return;
    generateMines(gBoard, i, j);
    setMinesNegsCount(gBoard);
    gGame.isFirstClick = false;
    gCurrMove.isFirstClick = false;
    // console.log('gGame.shownCount', gGame.shownCount)
    elCell.classList.remove('covered');
    revealNegs(i, j);
    // gBoard[i][j].isShown = true;
    //updating prev move for undo:
    gCurrMove.uncoveredElCells.push(elCell);
    gCurrMove.searchedCells.push(elCell);
    savePrevMove();
    checkVictory()
}
function clickedMine(elCell) {
    elCell.classList.remove('covered')
    gGame.shownMinesCount++;
    elCell.innerText = MINE;
    if (!gElClickedMine) {
        gElClickedMine = elCell;
    } else {
        gElClickedMine.classList.remove('clicked-mine');
    }
    gElClickedMine = elCell;
    gElClickedMine.classList.add('clicked-mine');
    //check Game over
    if (checkGameOver()) {
        endGame(false);
    } else if (checkVictory()) endGame(true);
    //updating prev move for undo:
    gCurrMove.uncoveredElCells.push(elCell);
    savePrevMove();
}











