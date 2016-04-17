var game        = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, 'game');
var cursors     = null;
var pad1        = null;
var flamingo    = null;
var fish        = null;
var shrimp      = null;
var maxVelocity = 750;
var score       = 0;
var useGamepad  = false;

function preload() {
  game.load.image('flamingo', 'assets/flamingo.png');
  game.load.image('fish', 'assets/shark.png');
  game.load.image('shrimp', 'assets/shrimp.gif');
}

function create() {
  game.input.gamepad.start();
  game.stage.backgroundColor = '#77aaff';

  pad1     = game.input.gamepad.pad1;
  cursors  = game.input.keyboard.createCursorKeys();
  flamingo = createFlamingo(game);
  fish     = createFishGroup(game);
  shrimp   = createShrimpGroup(game);
}

function update() {
  keyboardInput(flamingo);
  updateFlamingo(flamingo);
  updateFishGroup(fish);
  updateShrimpGroup(shrimp);
}

function keyboardInput(flamingo) {
  if(useGamepad) {
    flamingo.body.velocity.x = maxVelocity * pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X);
    flamingo.body.velocity.y = maxVelocity * pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y);
  } else {
    if(cursors.left.isDown)  flamingo.body.velocity.x = -maxVelocity;
    if(cursors.right.isDown) flamingo.body.velocity.x = +maxVelocity;
    if(cursors.up.isDown)    flamingo.body.velocity.y = -maxVelocity;
    if(cursors.down.isDown)  flamingo.body.velocity.y = +maxVelocity;
  }
}

function createFlamingo(game) {
  var flamingo = game.add.sprite(0, 0, 'flamingo');
  game.physics.arcade.enable(flamingo);
  flamingo.body.bounce.x = .2;
  flamingo.body.bounce.y = .2;
  flamingo.body.drag.x = 1250;
  flamingo.body.drag.y = 1250;
  flamingo.body.collideWorldBounds = true;
  flamingo.anchor.setTo(0.5, 0.5);
  return flamingo;
}

function updateFlamingo(flamingo) {
  var xFlip = flamingo.body.velocity.x > 0 ? -1 : 1;
  flamingo.scale.x = (1 + 0.001 * Math.min(score, 10000)) * xFlip;
  flamingo.scale.y = (1 + 0.001 * Math.min(score, 10000));
}

function createFishGroup(game) {
  var fish = game.add.physicsGroup(Phaser.Physics.ARCADE);
  game.physics.arcade.enable(fish);
  return fish;
}

function createFish(group) {
  var fish = group.create(game.world.randomX, game.world.randomY, 'fish');
  fish.body.collideWorldBounds = true;
  fish.pursuitAngle = (Math.random() * 2 - 1) * Math.PI / 6;
  fish.anchor.setTo(0.5, 0.5);
  return fish;
}

function rotate(vec, angle) {
  var x0 = vec.x;
  var y0 = vec.y;
  var x1 = y0 * Math.sin(angle) + x0 * Math.cos(angle);
  var y1 = y0 * Math.cos(angle) - x0 * Math.sin(angle);
  return new Phaser.Point(x1, y1);
}

function updateFishGroup(group) {
  while(group.length < 15) createFish(group);

  group.forEach(updateFish, this, true, group);
  game.physics.arcade.collide(group);

  game.physics.arcade.overlap(flamingo, group, function (flamingo, fish) {
    fish.kill();
    group.remove(fish);
    game.debug.text(--score, 10, 20);
  }, null, this);
}

function updateFish(fish, group) {
  var attackFlamingo = new Phaser.Point(
    flamingo.position.x - fish.position.x,
    flamingo.position.y - fish.position.y
  );

  attackFlamingo.setMagnitude(50);
  attackFlamingo = rotate(attackFlamingo, fish.pursuitAngle);

  var avoidSwarm = new Phaser.Point();

  group.forEach(function(fish2) {
    if(fish != fish2) {
      var avoidFish = new Phaser.Point(
        fish.position.x - fish2.position.x,
        fish.position.y - fish2.position.y
      );

      avoidFish.setMagnitude(5);

      avoidSwarm.add(avoidFish.x, avoidFish.y);
    }
  });

  avoidSwarm.setMagnitude(40);

  fish.body.velocity.add(attackFlamingo.x, attackFlamingo.y);
  fish.body.velocity.add(avoidSwarm.x, avoidSwarm.y);
  fish.body.velocity.setMagnitude(500);

  var xFlip = fish.body.velocity.x > 0 ? -1 : 1;
  fish.scale.x = xFlip;
}

function createShrimpGroup(game) {
  var shrimp = game.add.physicsGroup();
  game.physics.arcade.enable(shrimp);
  return shrimp;
}

function createShrimp(group) {
  var shrimp = group.create(game.world.randomX, game.world.randomY, 'shrimp');
  shrimp.body.collideWorldBounds = true;
  shrimp.anchor.setTo(0.5, 0.5);
  return shrimp;
}

function updateShrimpGroup(group) {
  while(group.length < 50) createShrimp(group);

  group.forEach(updateShrimp, this, true, group);

  game.physics.arcade.overlap(flamingo, group, function (flamingo, shrimp) {
    shrimp.kill();
    group.remove(shrimp);
    game.debug.text(++score, 10, 20);
  }, null, this);
}

function updateShrimp(shrimp, group) {
  shrimp.body.velocity.x += Math.random() * 50 - 25;
  shrimp.body.velocity.y += Math.random() * 50 - 25;

  var xFlip = shrimp.body.velocity.x > 0 ? -1 : 1;
  shrimp.scale.x = xFlip;
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
