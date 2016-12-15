const opts = require('./constants');

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
			coordinate: new Phaser.Point(col, row),
			value: tile.tint
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
		
	}
}

module.exports = InGame;
