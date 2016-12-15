const opts = require('./constants');
const Point = Phaser.Point;

class InGame {
	constructor() {
		this.canPick = true;
		this.tilesArray = [];
		this.tileGroup = null;
		this.tilePool = [];
	}

	preload() {
		const {game} = this;
		game.stage.backgroundColor = 0x222222;
		game.load.image('tiles', './tile.png');
	}

	create() {
		const {game} = this;
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

		game.scale.pageAlignHorizontally = true;
		game.scale.pageAlignVertically = true;

		this.createLv();
	}

	createLv() {
		const {game} = this;
		this.tileGroup = game.add.group();
		
		for (let i = 0; i < opts.rows; i++) {
			this.tilesArray[i] = [];
			for (let j = 0; j < opts.cols; j++) {
				this.addTile(i, j);
			}
		}

		game.input.onDown.add(this.pickTile, this);
	}

	addTile(row, col) {
		const tile = this.makeTile(row, col);

		this.tilesArray[row][col] = {
			tileSprite: tile,
			isEmpty: false,
			coordinate: new Point(row, col),
			tint: tile.tint
		};

		this.tileGroup.add(tile);
	}

	makeTile(row, col) {
		const left = (col + 0.5) * opts.tileSize;
		const top = (row + 0.5) * opts.tileSize;

		const theTile = this.game.add.sprite(left, top, 'tiles');

		theTile.anchor.set(0.5);
		theTile.width = opts.tileSize;
		theTile.height = opts.tileSize;

		const colorIndex = this.game.rnd.integerInRange(0, opts.colors.length - 1);

		theTile.tint = opts.colors[colorIndex];

		return theTile;
	}

	pickTile(e) {
		if (this.canPick) {
			const posX = e.x - this.tileGroup.x;
			const posY = e.y - this.tileGroup.y;

			// be careful, mouse x determine which column are we in
			// while mouse y position is row index
			const pickedRow = Math.floor(posY / opts.tileSize);
			const pickedCol = Math.floor(posX / opts.tileSize);

			if (this.isValidTile(pickedRow, pickedCol)) {
				const pickedTile = this.tilesArray[pickedRow][pickedCol];

				return this.tryPick(pickedTile);
			}
		}
	}

	isValidTile(row, col) {
		return row >= 0 && col >=0 &&
			row < opts.rows && col < opts.cols;
	}

	tryPick(theTile) {
		const fill = [];
		this.floodFill(theTile.coordinate, theTile.tint, fill);

		if (fill.length > 2) {
			this.destroyTiles(fill);
		}
	}

	destroyTiles(tileList) {
		this.canPick = false;

		tileList.forEach(point => {
			const tile = this.tilesArray[point.x][point.y];
			const tween = this.game.add.tween(tile.tileSprite).to({
				alpha: 0
			}, 300, Phaser.Easing.Linear.None, true);

			this.tilePool.push(tile.tileSprite);
			tween.onComplete.add(this.fillHoles, this);

			tile.isEmpty = true;
		});
	}

	// find same color tile
	floodFill(point, color, fillArr) {
		const {x, y} = point;
		if (!this.isValidTile(x, y)) {
			return;
		}
		if (this.tilesArray[x][y].isEmpty) {
			return;
		}
		if (this.pointInArr(fillArr, point)) {
			return;
		}
		if (this.tilesArray[x][y].tint === color) {
			fillArr.push(point);
			this.floodFill(new Point(x + 1, y), color, fillArr);
			this.floodFill(new Point(x - 1, y), color, fillArr);
			this.floodFill(new Point(x, y + 1), color, fillArr);
			this.floodFill(new Point(x, y - 1), color, fillArr);
		}
	}

	// check for phaser point in array
	pointInArr(arr, point) {
		return arr.some(myPoint => myPoint.equals(point));
	}

	fillHoles() {
		// on complete will be called before the last
		// tween object is destroyed
		if (this.game.tweens.getAll().length > 1) {
			return;
		}
		
		this.fillVertical();
	}

	fillVertical() {
		for (let j = 0; j < opts.cols; j++) {
			for (let i = opts.rows - 2; i >= 0; i--) {
				if (!this.tilesArray[i][j].isEmpty) {
					const holes = this.countSpacesBelow(i, j);

					if (holes > 0) {
						this.moveDownTile(i, j, i + holes, true)
							.onComplete.add(this.finishFill, this);
					}
				}
			}
		}

		for (let j = 0; j < opts.cols; j++) {
			const holes = this.countSpacesBelow(-1, j);

			for (let i = holes - 1; i >= 0; i--) {
				this.refillTile(i, j, holes)
					.onComplete.add(this.finishFill, this);
			}
		}
	}

	refillTile(i, j, holes) {
		const tileFromPool = this.tilePool.pop();
		tileFromPool.alpha = 1;
		tileFromPool.x = (j + 1 / 2) * opts.tileSize;
		tileFromPool.y = (i - holes + 1 / 2) * opts.tileSize;

		const colorIndex = this.game.rnd.integerInRange(0, opts.colors.length - 1);

		tileFromPool.tint = opts.colors[colorIndex];

		this.tilesArray[i][j] = {
			tileSprite: tileFromPool,
			isEmpty: false,
			coordinate: new Point(i, j),
			tint: tileFromPool.tint
		};

		return this.moveDownTile(0, j, i, false);
	}

	// how many empty tiles below ?
	countSpacesBelow(row, col) {
		let spaces = 0;
		for (let i = row + 1; i < opts.rows; i++) {
			if (this.tilesArray[i][col].isEmpty) {
				spaces += 1;
			}
		}

		return spaces;
	}

	moveDownTile(fromRow, fromCol, toRow, drop) {
		if (drop) {
			this.dropTile(fromRow, fromCol, toRow, drop);
		}

		const height = (toRow - fromRow) * opts.tileSize;

		const sprite = this.tilesArray[toRow][fromCol].tileSprite;
		return this.game.add.tween(sprite).to({
			y: (toRow + 1 / 2) * opts.tileSize
		}, height / 2, Phaser.Easing.Linear.None, true);
	}

	dropTile(fromRow, fromCol, toRow, drop) {
		const theTile = this.tilesArray[fromRow][fromCol].tileSprite;

		this.tilesArray[toRow][fromCol] = {
			tileSprite: theTile,
			isEmpty: false,
			coordinate: new Phaser.Point(toRow, fromCol),
			tint: theTile.tint
		};

		this.tilesArray[fromRow][fromCol].isEmpty = true;
	}

	finishFill() {
		if (this.game.tweens.getAll().length > 1) {
			return;
		}

		this.canPick = true;
	}
}

module.exports = InGame;
