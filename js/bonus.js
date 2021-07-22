'use strict'

var gIsHint;
var gElHint;
var gSafeElCell;
var gIsSave;
var gPrevMoves;
var gCurrMove;
var gPreMove;

//hints:
function getHint(elHint) {
    if (gGame.isFirstClick) return;
    if (gIsHint) {
        gIsHint = false;
        gElHint.classList.remove("hinted");
        return;
    }
    // console.log('hint clicked')
    gIsHint = true;
    gElHint = elHint;
    gElHint.classList.add("hinted");
}
function presentHint(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > gBoard[0].length - 1) continue
            var currCell = gBoard[i][j];
            var currElCell = document.querySelector(`.cell-${i}-${j}`);
            if (!currElCell.classList.contains('covered')) continue;
            currElCell.innerText = (currCell.isMine) ? MINE : (currCell.minesAroundCount) ? currCell.minesAroundCount : EMPTY;
            currElCell.classList.remove('covered');
            currElCell.classList.add('shown-hint');
        }
    }
    setTimeout(function () {
        var hintedElcells = document.querySelectorAll('.shown-hint');
        for (var i = 0; i < hintedElcells.length; i++) {
            hintedElcells[i].innerText = EMPTY;
            hintedElcells[i].classList.add('covered')
            hintedElcells[i].classList.remove('shown-hint')
        }
    }, 1000);
    gIsHint = false;
    gElHint.style.display = 'none';
}
//safe click:
function safeClick() {
    if (gGame.safeClicks <= 0) return;
    console.log('gIsSave', gIsSave);
    if (gIsSave) return;
    gIsSave = true;
    var emptyCells = getEmptyCells(gBoard, Infinity, Infinity);
    shuffle(emptyCells);
    var location = drawCell(emptyCells);
    gSafeElCell = document.querySelector(`.cell-${location.i}-${location.j}`);
    gSafeElCell.classList.add('safe-cell');
    setTimeout(function () { gIsSave = false; gSafeElCell.classList.remove('safe-cell') }, 2000);
    document.querySelector('.safe-click span').innerText = --gGame.safeClicks;
}
//best score:
function checkBestScore(level, score) {
    var bestScore = localStorage.getItem(`${level}BestSecs`);
    //if not first time - update only if best score
    //if first time - update first score in storage
    if (bestScore !== null) {
        if (score < bestScore) {
            localStorage.setItem(`${level}BestSecs`, score);
            score = document.querySelector('.timer span').innerText;
            localStorage.setItem(`${level}BestScore`, score);
        }
        return;
    }
    localStorage.setItem(`${level}BestSecs`, score);
    score = document.querySelector('.timer span').innerText;
    localStorage.setItem(`${level}BestScore`, score);
    document.querySelector(`.${level} span`).innerText = score;
}
function setBestScore(level) {
    var bestLevelScore = localStorage.getItem(`${level}BestScore`);
    document.querySelector(`.${level} span`).innerText = (bestLevelScore !== null) ? bestLevelScore : '00:000';
}
//Undo
function undo() {
    //if before first click - can't undo
    if (gCurrMove.isFirstClick) return;
    if (!gPrevMoves.length) return;
    if(!gGame.isOn) return;
    var prevMove = gPrevMoves.pop();
    gGame.shownCount = prevMove.shownCount;
    for (var i = 0; i < prevMove.uncoveredElCells.length; i++) {
        var elCell = prevMove.uncoveredElCells[i];
        elCell.classList.add('covered');
        elCell.classList.remove('clicked-mine');
        elCell.innerText = EMPTY;
    }
}
function savePrevMove() {
    var preMove = {
        isFirstClick: gCurrMove.isFirstClick,
        shownCount: gCurrMove.shownCount,
        uncoveredElCells: gCurrMove.uncoveredElCells
    }
    gPrevMoves.push(preMove);
    resetCurrMove();
}
function resetCurrMove() {
    gCurrMove.shownCount = 0;
    gCurrMove.uncoveredElCells = [];
}

//TODO:Manually positioned mines

//TODO:fullexpand
