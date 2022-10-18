var tiles = [],
    outputNodes = [],
    inputNodes = [],
    poweredNodes = [],
    tileSize = 150,
    levelRows = 6,
    levelCols = 6,
    firstPaint = true,
    tileTypes = ['o', 'O', 'i', 'I', 'L', 'l', 'T'],
    rotateableTypes = ['L', 'l', 'T', 'o', 'i'],
    editMode = false,
    interactable = true,
    activeLevel = 0,
    levelComplete = false,
    prevButton,
    nextButton;

var levels = [
    'O3.l.I3',
    'O.L.L3.I2 l1.l1.l1.l1 L1.L2.L1.L2',
    'O.L.T2.L3.I1.L1 l1.l1.L2.T3.T1.l2 L2.T.L3.L.L3.L L.l.L1.l1.l1.T1 L1.l1.I3.L.T.L3',
    'O.L1.T3.L2.T1.L3.O L1.l2.T1.L.L3.-3.T l1.L3.l2.L3.L.T2.l3 T1.L2.I2.I.I2.l1.T l1.T2.l1.-1.T2.l1.l1 L1.L2.L.L3.L1.L.T1 O3.T3.L.T2.T3.l1.L3',
]

function initControls()
{
    let elem = document.getElementById("controls");

    if (elem) {
        elem.parentNode.removeChild(elem);
    }

    let controls = [];

    controls.push(createDiv('Level ' + (activeLevel + 1) + '/' + levels.length).id('progress'));

    prevButton = createButton('< Prev');
    prevButton.attribute('disabled', '');

    if (activeLevel > 0) {
        prevButton.removeAttribute('disabled');
        prevButton.mousePressed(function () {
            levelComplete = false;
            interactable = true;
            activeLevel--;
            loadLevel(levels[activeLevel]);
            initControls();
        });
    }
    controls.push(prevButton);

    
    nextButton = createButton('Next >');
    nextButton.attribute('disabled', '');

    if (activeLevel < (levels.length - 1)) {
        nextButton.removeAttribute('disabled');
        nextButton.mousePressed(function () {
            levelComplete = false;
            interactable = true;
            activeLevel++;
            loadLevel(levels[activeLevel]);
            initControls();
        });
        
    }
    controls.push(nextButton);

    var controlsDiv = createDiv("").id("controls");
    controlsDiv.parent('game');

    for (var i = 0; i < controls.length; i++) {
        controlsDiv.child(controls[i]);
    }
}

function setup() {
    loadLevel(levels[0]);
    
    var canvas = createCanvas(tileSize * levelCols, tileSize * levelRows);
    canvas.parent('game');

    initControls();
}

function draw() {
    background(255);
    noStroke();

    for (const tile in tiles) {
        tiles[tile].draw();
    }
}

function mouseMoved() 
{
    if (interactable) {
        const key = getActiveTileKey();

        if (key) {
            tiles[key].hover = true;
        }
    
        for (const tile in tiles) {
            if (tile != key) {
                tiles[tile].hover = false;
            }
        }
    }
}

function mouseClicked(event) {
    const key = getActiveTileKey();

    if (key && interactable) {
        let tile = tiles[key];

        if (editMode || rotateableTypes.includes(tile.type)) {
            // Remove the tile from the array
            delete tiles[key];
                    
            // Add it back on to the end so it is last in rendering order
            tiles[key] = tile;
            tiles[key].rotate();
        }
    }
}

function keyTyped()
{
    if (editMode) {
        const activeTile = getActiveTileKey();
        let type = false;

        switch (key) {
            case 'o':
            case 'O':
                if (activeTile) {
                    type = tiles[activeTile].type == 'o' ? 'O' : 'o';
                }
                break;
            case 'i':
            case 'I':
                if (activeTile) {
                    type = tiles[activeTile].type == 'i' ? 'I' : 'i';
                }
                break;
            case 'l':
            case 'L':
                if (activeTile) {
                    type = tiles[activeTile].type == 'l' ? 'L' : 'l';
                }
                break;
            case 't':
            case 'T':
                if (activeTile) {
                    type = 'T';
                }
                break;
            case '-':
                if (activeTile) {
                    type = '-';
                }
                break;
            default:
                break;
        }

        if (type) {
            tiles[activeTile].changeType(type);
            updateInputOutputNodes();
            updateTilePower();
        }
    }
}

function keyPressed()
{
    if (editMode) {
        let row;
        let col;
        switch (keyCode) {
            case DOWN_ARROW:
                // Add a row
                levelRows++;
                resizeCanvas(tileSize * levelCols, tileSize * levelRows);

                row = levelRows - 1;
                for (let col = 0; col < levelCols; col++) {
                    const key = row + '_' + col;
                    tiles[key] = new Tile(row, col, tileSize, '-', 0);
                }
                break;
            case UP_ARROW:
                // Remove a row
                levelRows--;
                resizeCanvas(tileSize * levelCols, tileSize * levelRows);

                row = levelRows;

                for (const tile in tiles) {
                    const tileRow = tile.split('_')[0];

                    if (tileRow == row) {
                        delete tiles[tile];
                    }
                }

                break;
        
            case LEFT_ARROW:
                // Remove a column
                levelCols--;
                resizeCanvas(tileSize * levelCols, tileSize * levelRows);

                col = levelCols;

                for (const tile in tiles) {
                    const tileCol = tile.split('_')[1];

                    if (tileCol == col) {
                        delete tiles[tile];
                    }
                }
                break;

            case RIGHT_ARROW:
                // Add a column
                levelCols++;
                resizeCanvas(tileSize * levelCols, tileSize * levelRows);

                col = levelCols - 1;
                for (let row = 0; row < levelRows; row++) {
                    const key = row + '_' + col;
                    console.log(key);
                    tiles[key] = new Tile(row, col, tileSize, '-', 0);
                }
                break;

            case ESCAPE:
                // Clear the whole board
                for (const tile in tiles) {
                    tiles[tile].rotation = 0;
                    tiles[tile].changeType('-');
                }
                break;

            case ENTER:
                generateLevel();
                break;
            default:
                break;
        }
        
    }
}

function generateLevel()
{
    let rows = [];
    let levelOutput = '';

    // Re-order the tiles by key
    tiles = Object.keys(tiles).sort().reduce((obj, key) => { obj[key] = tiles[key]; return obj; }, {});

    let activeRow = 0;
    for (const tile in tiles) {
        const parts = tiles[tile].key.split('_');
        const row = parts[0];

        if (row > activeRow) {
            levelOutput += ' ';
            activeRow++;
        }

        if (typeof rows[row] === 'undefined') {
            rows[row] = [];
        }

        let rotation = tiles[tile].rotation / 90;

        if (rotation == 4 || rotation == 0) {
            rotation = '';
        }

        rows[row].push(tiles[tile].type + rotation);
    }

    for (let i = 0; i < rows.length; i++) {
        const cols = rows[i].join('.');

        levelOutput += cols;
        levelOutput += ' ';
    }

    console.log(levelOutput.trim());
}

function getActiveTileKey()
{
    const row = Math.floor(mouseY / tileSize);
    const col = Math.floor(mouseX / tileSize);
    const key = row + '_' + col;

    if (typeof tiles[key] !== 'undefined') {
        return key;
    }

    return null;
}

function loadLevel(level)
{
    outputNodes = [];
    tiles = [];

    let rows = level.split(' ');

    levelCols = rows[0].split('.').length;
    levelRows = rows.length;

    for (let row = 0; row < rows.length; row++) {

        const cols = rows[row].split('.');

        for (let col = 0; col < cols.length; col++) {
            const type = cols[col][0];
            const rotations = cols[col][1] ?? 0;
           
            const key = row + '_' + col;
            tiles[key] = new Tile(row, col, tileSize, type, rotations);
        }
    }

    resizeCanvas(tileSize * levelCols, tileSize * levelRows);

    updateInputOutputNodes();
    updateTilePower();
}

function updateInputOutputNodes()
{
    outputNodes = [];
    inputNodes = [];

    for (const tile in tiles) {
        if (tiles[tile].type == 'o' || tiles[tile].type == 'O') {
            outputNodes.push(tiles[tile].key);
        }

        if (tiles[tile].type == 'i' || tiles[tile].type == 'I') {
            inputNodes.push(tiles[tile].key);
        }
    }
}

function updateTilePower()
{
    poweredNodes = [];

    for (let i = 0; i < outputNodes.length; i++) {
        const key = outputNodes[i];
        poweredNodes.push(key);
        powerChildNodes(key);
    }

    for (const tile in tiles) {
        if (poweredNodes.includes(tiles[tile].key)) {
            tiles[tile].powered = true;
        } else {
            tiles[tile].powered = false;
        }
    }

    if (!editMode) {
        let poweredInputs = 0;

        for (let i = 0; i < inputNodes.length; i++) {
            const key = inputNodes[i];
            
            
            if (tiles[key].powered) {
                poweredInputs++;
            }
        }

        if (poweredInputs == inputNodes.length) {
            interactable = false;

            for (const tile in tiles) {
                tiles[tile].poweredColor = tiles[tile].successColor;
                tiles[tile].hover = false;

                if (!tiles[tile].powered) {
                    tiles[tile].changeType('-');
                }
            }
        }
    }
}

function powerChildNodes(key)
{
    if (typeof tiles[key] !== 'undefined') {
        for (let i = 0; i < tiles[key].connections.length; i++) {
            const connection = tiles[key].connections[i];
            
            if (typeof tiles[connection] !== 'undefined') {
                if (!poweredNodes.includes(connection) && tiles[connection].connections.includes(key)) {
                    poweredNodes.push(connection);
                    powerChildNodes(connection);
                }
            }
        }
    }
}