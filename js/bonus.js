'use strict'

var gIsHint;
var gElHint;
var gSafeElCell;
var gIsSave;
var gPrevMoves;
var gCurrMove;
var gPreMove;
var gIsManualMode;
var gManualMineCount;

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
    document.querySelector(`.${level} span`).innerText = (bestLevelScore !== null) ? bestLevelScore : '00:00:00';
}
//Undo
function undo() {
    //if before first click - can't undo
    if (gCurrMove.isFirstClick) return;
    if (!gPrevMoves.length) return;
    if (!gGame.isOn) return;
    var prevMove = gPrevMoves.pop();
    gGame.shownCount -= prevMove.shownCount;
    gGame.shownMinesCount -= prevMove.markedCount;
    resetSearchedCells(prevMove);
    for (var i = 0; i < prevMove.uncoveredElCells.length; i++) {
        var elCell = prevMove.uncoveredElCells[i];
        elCell.classList.add('covered');
        elCell.classList.remove('clicked-mine');
        elCell.innerText = EMPTY;
    }
}
function savePrevMove() {
    var preMove = { ...gCurrMove };
    gPrevMoves.push(preMove);
    resetCurrMove();
}
function resetCurrMove() {
    gCurrMove.shownCount = 0;
    gCurrMove.markedCount = 0;
    gCurrMove.uncoveredElCells = [];
    gCurrMove.searchedCells = [];
}
function resetSearchedCells(prevMove) {
    var searchedCells = prevMove.searchedCells;
    if (!searchedCells.length) return;
    for (var i = 0; i < searchedCells.length; i++) {
        var curCell = searchedCells[i];
        curCell.isSearced = false;
        curCell.isShown = false;
    }
}
//Manually positioned mines
function toggleManualPosition(elButton) {
    if (!gIsManualMode) {
        if (gGame.isOn) init();
        gGame.isManual = true;
        gIsManualMode = true;
        gGame.isFirstClick = true;
        gManualMineCount = gLevel.mines;
        // console.log('gManualMineCount', gManualMineCount)
    }
    else if (!gManualMineCount) {
        coverMines();
        // gGame.isFirstClick = true;
        gIsManualMode = false;
        elButton.innerText = 'Play👍';
    }
}
function coverMines() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (gBoard[i][j].isMine) {
                var elCell = document.querySelector(`.cell-${i}-${j}`);
                elCell.innerText = EMPTY;
            }
        }
    }
}
//fullexpand
function revealNegs(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i > gBoard.length - 1) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j > gBoard[0].length - 1) continue
            var currCell = gBoard[i][j];
            if (currCell.isShown) continue;
            if (currCell.isSearced) continue;
            if (i === rowIdx && j === colIdx) {
                gGame.shownCount++;
                gCurrMove.shownCount++;
                continue
            }
            var currElCell = document.querySelector(`.cell-${i}-${j}`);
            if (currElCell.innerText === FLAG) continue
            if (currCell.isMine) continue;
            if (!currCell.minesAroundCount) {
                currElCell.innerText = EMPTY;
                currCell.isSearced = true;
                gCurrMove.searchedCells.push(currCell);

                // console.log('i-' + i + ' j-' + j)
                revealNegs(i, j);
            }
            else {
                currElCell.innerText = currCell.minesAroundCount;
                renderCountColor(currElCell, currCell.minesAroundCount);
            }
            currElCell.classList.remove('covered');
            currCell.isShown = true;
            gCurrMove.searchedCells.push(currCell);
            gGame.shownCount++;
            //updating prev move for undo:
            gCurrMove.shownCount++;
            gCurrMove.uncoveredElCells.push(currElCell);

        }
    }
}

