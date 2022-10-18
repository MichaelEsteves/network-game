class Tile {
    key;
    column;
    type;
    rotating = false;
    hover = false;
    rotation = 0;
    targetRotation = 0;
    powered = false;
    poweredColor = color(0, 158, 255);
    successColor = color(0, 219, 72);
    unpoweredColor = color(150, 150, 150);
    color = color(220, 220, 220);
    hoverColor = color(230, 230, 230);
    connections = [];
    x;
    y;

    constructor(row, column, size, type, rotations) {
        this.key = row + '_' + column;
        this.column = column;
        this.row = row;
        this.size = size;
        this.type = type;
        this.rotation = rotations * 90;

        this.updateConnections();

        this.x = this.column * this.size;
        this.y = this.row * this.size;

        if (this.type == 'o') {
            this.powered = true;
        }
    }

    changeType = function (type) {
        this.type = type;
        this.updateConnections();
    }

    rotate = function () {
        if (!this.rotating) {
            this.rotating = true;
            this.targetRotation = this.rotation + 90;

            // Don't rotate over 360° to keep other calculations easier
            if (this.targetRotation > 360) {
                this.rotation = 0;
                this.targetRotation = 90;
            }
        }
    }

    draw = function () {
        resetMatrix();
        rectMode(CENTER);
        let rotationFinished = false;
        
        translate(this.x + (this.size / 2), this.y + (this.size / 2));

        angleMode(DEGREES);

        if (this.rotating) {

            if (editMode) {
                this.rotation = this.targetRotation;
                this.rotating = false;
                rotationFinished = true;
            } else {
                if (this.rotation < this.targetRotation) {
                    this.rotation += 12;
                }
    
                if (this.rotation >= this.targetRotation) {
                    this.rotation = this.targetRotation;
                    this.rotating = false;
    
                    rotationFinished = true;
                }
            }
        }

        rotate(this.rotation);

        if (rotationFinished) {
            // Check powered status after rotation
            this.updateConnections();
            updateTilePower();
        }

        if (this.hover && interactable) {
            cursor(HAND);
            fill(this.hoverColor);
        } else {
            fill(this.color);
        }

        strokeWeight(1);
        stroke(160);

        square(0, 0, this.size);
        this.drawTileType();
    }

    updateConnections = function() {
        this.connections = [];
        switch (this.type) {
            case 'T':
                this.updateLeftConnection();
                this.updateRightConnection();
                this.updateBottomConnection();
                break;

            case 'l':
                this.updateTopConnection();
                this.updateBottomConnection();
                break;

            case 'L':
                this.updateTopConnection();
                this.updateRightConnection();
                break;

            case 'o':
            case 'O':
                this.updateBottomConnection();
                break;

            case 'i':
            case 'I':
                this.updateTopConnection();
                break;
        
            default:
                break;
        }
    }

    updateRightConnection = function() {
        switch (this.rotation) {
            case 0:
            case 360:
                // right
                this.connections.push(this.row + '_' + (this.column + 1));
                break;
            case 90:
                // bottom
                this.connections.push((this.row + 1) + '_' + this.column);
                break;
            case 180:
                // left
                this.connections.push(this.row + '_' + (this.column - 1));
                break;
            case 270:
                // top
                this.connections.push((this.row - 1) + '_' + this.column);
                break;
        }
    }

    updateLeftConnection = function() {
        switch (this.rotation) {
            case 0:
            case 360:
                // left
                this.connections.push(this.row + '_' + (this.column - 1));
                break;
            case 90:
                // top
                this.connections.push((this.row - 1) + '_' + this.column);
                break;
            case 180:
                // right
                this.connections.push(this.row + '_' + (this.column + 1));
                break;
            case 270:
                // bottom
                this.connections.push((this.row + 1) + '_' + this.column);
                break;
        }
    }

    updateTopConnection = function() {
        switch (this.rotation) {
            case 0:
            case 360:
                // top
                this.connections.push((this.row - 1) + '_' + this.column);
                break;
            case 90:
                // right
                this.connections.push(this.row + '_' + (this.column + 1));
                break;
            case 180:
                // bottom
                this.connections.push((this.row + 1) + '_' + this.column);
                break;
            case 270:
                // left
                this.connections.push(this.row + '_' + (this.column - 1));
                break;
        }
    }

    updateBottomConnection = function() {
        switch (this.rotation) {
            case 0:
            case 360:
                // bottom
                this.connections.push((this.row + 1) + '_' + this.column);
                break;
            case 90:
                // left
                this.connections.push(this.row + '_' + (this.column - 1));
                break;
            case 180:
                // top
                this.connections.push((this.row - 1) + '_' + this.column);
                break;
            case 270:
                // right
                this.connections.push(this.row + '_' + (this.column + 1));
                break;
        }
    }

    drawTileType = function() {
        noStroke();

        if (this.powered) {
            fill(this.poweredColor);
        } else {
            fill(this.unpoweredColor);
        }

        let lineWidth = this.size / 8;

        switch (this.type) {
            case 'T':
                rect(0, 0, this.size, lineWidth);
                translate(0, this.size / 4);
                rect(0, 0, lineWidth, this.size / 2);
                break;

            case 'l':
                rect(0, 0, lineWidth, this.size);
                break;

            case 'L':
                square(0, 0, lineWidth);
                translate(0, -this.size / 4);
                rect(0, 0, lineWidth, this.size / 2);
                translate(this.size / 4, this.size / 4);
                rect(0, 0, this.size / 2, lineWidth);
                break;

            case 'o':
                circle(0, 0, lineWidth * 3);
                translate(0, this.size / 4);
                rect(0, 0, lineWidth, this.size / 2);

                if (this.hover) {
                    fill(this.hoverColor);
                } else {
                    fill(this.color);
                }

                translate(0, -this.size / 4);
                circle(0, 0, lineWidth);
                break;

            case 'O':
                circle(0, 0, lineWidth * 3);
                translate(0, this.size / 4);
                rect(0, 0, lineWidth, this.size / 2);
                break;
            
            case 'i':
                square(0, 0, lineWidth * 3);
                translate(0, -this.size / 4);
                rect(0, 0, lineWidth, this.size / 2);

                if (this.hover) {
                    fill(this.hoverColor);
                } else {
                    fill(this.color);
                }

                translate(0, this.size / 4);
                square(0, 0, lineWidth);
                break;

            case 'I':
                square(0, 0, lineWidth * 3);
                translate(0, -this.size / 4);
                rect(0, 0, lineWidth, this.size / 2);
                break;
        
            default:
                break;
        }
    }
}
