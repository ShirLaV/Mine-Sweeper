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
        uncoveredElCells: []
    };
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
    document.querySelector('.timer span').innerText = '00:000';
    document.querySelector('.safe-click span').innerText = gGame.safeClicks;
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
                isMarked: true
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
        elCell.classList.add('mine');
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
function checkClickType(elCell, i, j, e) {
    //start the timer after first click - right or left
    if (!gGame.isOn) {
        if (!gGame.isFirstClick) return;
        gStartTime = new Date();
        gTimerInterval = setInterval(renderTimer, 10);
        gGame.isOn = true;
    }

    var rightclick;
    if (!e) var e = window.event;
    if (e.button) rightclick = (e.button === 2)
    if (rightclick) {
        if (elCell.classList.contains('covered')) cellMarked(elCell);
    }
    else {
        if (elCell.innerText !== FLAG) cellClicked(elCell, i, j);
    }
}
//on right click, mark the cell with flag
function cellMarked(elCell) {
    if (elCell.innerText !== FLAG) {
        // console.log('marked!')
        elCell.innerText = FLAG;
        if (elCell.classList.contains('mine')) gGame.markedCount++;
        if (checkVictory()) endGame(true);

    } else {
        // console.log('Unmarked!')
        elCell.innerText = EMPTY;
        if (elCell.classList.contains('mine')) gGame.markedCount--;
    }
}
//on left click, check cell and reveal accordingly
function cellClicked(elCell, i, j) {
    //in hint mode:
    if (gIsHint) {
        if (!elCell.classList.contains('covered')) return;
        presentHint(i, j);
        return;
    }
    //first Click:
    if (gGame.isFirstClick) {
        firstClick(elCell, i, j);
        return;
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
    }

    elCell.classList.remove('covered');
    //if has mines negs
    if (cellMineCount) {
        elCell.innerText = cellMineCount;
        renderCountColor(elCell, cellMineCount);
    } else {
        //if doesn't have mines negs
        elCell.innerText = EMPTY;
        revealNegs(i, j, i, j);
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
    // console.log('gGame.shownMinesCount', gGame.shownMinesCount)
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
    generateMines(gBoard, i, j);
    setMinesNegsCount(gBoard);
    gGame.isFirstClick = false;
    gCurrMove.isFirstClick = false;
    gGame.shownCount++;
    elCell.classList.remove('covered');
    revealNegs(i, j, i, j);
    //updating prev move for undo:
    gCurrMove.shownCount++;
    gCurrMove.uncoveredElCells.push(elCell);
    savePrevMove();

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
function revealNegs(rowIdx, colIdx, prevI, prevJ) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > gBoard[0].length - 1) continue
            if (i === rowIdx && j === colIdx) continue
            var currCell = gBoard[i][j];
            var currElCell = document.querySelector(`.cell-${i}-${j}`);
            if (!currElCell.classList.contains('covered')) continue;
            if (currElCell.innerText === FLAG) continue
            if (currCell.isMine) continue;
            if (!currCell.minesAroundCount) {
                currElCell.innerText = EMPTY;
                // console.log('i-'+i+' j-'+j)
                // if (i !== prevI && j !== prevJ) revealNegs(i, j, rowIdx, colIdx);
            }
            else currElCell.innerText = currCell.minesAroundCount;
            renderCountColor(currElCell, currCell.minesAroundCount);
            currElCell.classList.remove('covered');
            currElCell.isShown = true;
            gGame.shownCount++;
            //updating prev move for undo:
            gCurrMove.shownCount++;
            gCurrMove.uncoveredElCells.push(currElCell);
        }
    }
}





