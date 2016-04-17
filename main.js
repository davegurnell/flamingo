var game        = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, 'game');
var cursors     = null;
var pad1        = null;
var player      = null;
var playerMask  = null;
var enemy       = null;
var food        = null;
var maxVelocity = 750;
var score       = 0;
var useGamepad  = false;

function preload() {
  game.load.image('player', 'assets/flamingo.png');
  game.load.image('playerMask', 'assets/flamingo_mask.png');
  game.load.image('enemy', 'assets/shark.png');
  game.load.image('food', 'assets/shrimp.gif');
}

function create() {
  game.input.gamepad.start();
  game.stage.backgroundColor = '#77aaff';

  pad1       = game.input.gamepad.pad1;
  cursors    = game.input.keyboard.createCursorKeys();
  player     = createPlayer(game);
  playerMask = createPlayerMask(game, player);
  enemy      = createEnemyGroup(game);
  food       = createFoodGroup(game);
}

function update() {
  keyboardInput(player);
  updatePlayer(player);
  updateEnemyGroup(enemy);
  updateFoodGroup(food);
}

function keyboardInput(player) {
  if(useGamepad) {
    player.body.velocity.x = maxVelocity * pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X);
    player.body.velocity.y = maxVelocity * pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y);
  } else {
    if(cursors.left.isDown)  player.body.velocity.x = -maxVelocity;
    if(cursors.right.isDown) player.body.velocity.x = +maxVelocity;
    if(cursors.up.isDown)    player.body.velocity.y = -maxVelocity;
    if(cursors.down.isDown)  player.body.velocity.y = +maxVelocity;
  }
}

function createPlayer(game) {
  var player = game.add.sprite(0, 0, 'player');
  game.physics.arcade.enable(player);
  player.body.bounce.x = .2;
  player.body.bounce.y = .2;
  player.body.drag.x = 1250;
  player.body.drag.y = 1250;
  player.body.collideWorldBounds = true;
  player.anchor.setTo(0.5, 0.5);
  return player;
}

function createPlayerMask(game, player) {
  var playerMask = player.addChild(game.make.sprite(0, 0, 'playerMask'));
  playerMask.anchor.setTo(0.5, 0.5);
  return playerMask;
}

function updatePlayer(player) {
  if(player.body.velocity.x > 0) player.scale.x = -1;
  if(player.body.velocity.x < 0) player.scale.x = +1;
  var maskAlpha = Math.min(1.0, Math.max(0.0, score / 100.0));
  console.log(maskAlpha);
  playerMask.alpha = maskAlpha;
}

function createEnemyGroup(game) {
  var enemy = game.add.physicsGroup(Phaser.Physics.ARCADE);
  game.physics.arcade.enable(enemy);
  return enemy;
}

function createEnemy(group) {
  var enemy = group.create(game.world.randomX, game.world.randomY, 'enemy');
  enemy.body.collideWorldBounds = true;
  enemy.pursuitAngle = (Math.random() * 2 - 1) * Math.PI / 6;
  enemy.anchor.setTo(0.5, 0.5);
  return enemy;
}

function rotate(vec, angle) {
  var x0 = vec.x;
  var y0 = vec.y;
  var x1 = y0 * Math.sin(angle) + x0 * Math.cos(angle);
  var y1 = y0 * Math.cos(angle) - x0 * Math.sin(angle);
  return new Phaser.Point(x1, y1);
}

function updateEnemyGroup(group) {
  while(group.length < 15) createEnemy(group);

  group.forEach(updateEnemy, this, true, group);
  game.physics.arcade.collide(group);

  game.physics.arcade.overlap(player, group, function (player, enemy) {
    enemy.kill();
    group.remove(enemy);
    updateScore(-5);
  }, null, this);
}

function updateEnemy(enemy, group) {
  var attackPlayer = new Phaser.Point(
    player.position.x - enemy.position.x,
    player.position.y - enemy.position.y
  );

  attackPlayer.setMagnitude(50);
  attackPlayer = rotate(attackPlayer, enemy.pursuitAngle);

  var avoidSwarm = new Phaser.Point();

  group.forEach(function(enemy2) {
    if(enemy != enemy2) {
      var avoidEnemy = new Phaser.Point(
        enemy.position.x - enemy2.position.x,
        enemy.position.y - enemy2.position.y
      );

      avoidEnemy.setMagnitude(5);

      avoidSwarm.add(avoidEnemy.x, avoidEnemy.y);
    }
  });

  avoidSwarm.setMagnitude(40);

  enemy.body.velocity.add(attackPlayer.x, attackPlayer.y);
  enemy.body.velocity.add(avoidSwarm.x, avoidSwarm.y);
  enemy.body.velocity.setMagnitude(500);

  if(enemy.body.velocity.x > 0) enemy.scale.x = -1;
  if(enemy.body.velocity.x < 0) enemy.scale.x = +1;
}

function createFoodGroup(game) {
  var food = game.add.physicsGroup();
  game.physics.arcade.enable(food);
  return food;
}

function createFood(group) {
  var food = group.create(game.world.randomX, game.world.randomY, 'food');
  food.body.collideWorldBounds = true;
  food.anchor.setTo(0.5, 0.5);
  return food;
}

function updateFoodGroup(group) {
  while(group.length < 100) createFood(group);

  group.forEach(updateFood, this, true, group);

  game.physics.arcade.overlap(player, group, function(player, food) {
    food.kill();
    group.remove(food);
    updateScore(+1);
  }, null, this);
}

function updateFood(food, group) {
  food.body.velocity.x += Math.random() * 50 - 25;
  food.body.velocity.y += Math.random() * 50 - 25;
  if(food.body.velocity.x > 0) food.scale.x = -1;
  if(food.body.velocity.x < 0) food.scale.x = +1;
}

function updateScore(delta) {
  score = Math.max(0, score + delta);
  game.debug.text(score, 10, 20);
}

function quit(pointer) {

}

function monitor(func) {
  window.setInterval(function() {
    console.log(func());
  }, 100);
}

game.state.add('Game', {
  preload : preload,
  create  : create,
  update  : update,
  quit    : quit
});

game.state.start('Game');
