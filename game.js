const InGame = require('./in-game.js');

const options = require('./constants');

const game = new Phaser.Game(options.width, options.height);

game.state.add('InGame', InGame);
game.state.start('InGame');
