(function() {

/* Local Vars:
 *   models : Object[] -- 
 *   lengths : Object[] --
 *   rows : Int[] -- y-coords of rows starting with first traffic row
 *   context : Canvas Context -- used for drawing to main canvas.
 */
var models = [
    {width: 30, height: 22, dir: 1, file: "data/TNA_CCC_HO13_001_00004.0000.jpg" }, 
    {width: 29, height: 24, dir: 1, file: "data/TNA_CCC_HO13_001_00004.0001.jpg"}, 
    {width:24, height: 26, dir: 1, file: "data/TNA_CCC_HO13_001_00004.0002.jpg"}, 
    {width: 24, height: 21, dir: 1, file: "data/TNA_CCC_HO13_001_00004.0003.jpg"}, 
    {width: 46, height: 19, dir: 1, file: "data/TNA_CCC_HO13_001_00004.0004.jpg"}
];
var lengths = [{width: 179, height: 21}, {width: 118, height: 21}, {width: 85, height: 22}];
var rows = [473, 443, 413, 383, 353, 323, 288, 261, 233, 203, 173, 143, 113];
var context = null;

var start_game = function() {
    game = new Game();
    $(document).keydown(function(e) {
        var arrow_key = get_arrow_key(e);
        if (arrow_key) {
            e.preventDefault(); 
        }
        if (game.dead === -1 && game.lives > 0) {
            if (arrow_key === 'u'){ 
                up();
            } else if (arrow_key === 'd'){
                down();
            } else if (arrow_key === 'l'){
                left();
            } else if (arrow_key === 'r'){
                right();
            }
        }
    });
    board = document.getElementById('game');
    context = board.getContext('2d');
    theme = document.createElement('audio');
    theme.setAttribute('src', 'assets/frogger.mp3');
    theme.setAttribute('loop', 'true');
    theme.play();
    sprites = new Image();
    deadsprite = new Image();
    sprites.src = 'assets/frogger_sprites.png'; 
    deadsprite.src = 'assets/dead_frog.png';
    sprites.onload = function() {
        draw_bg();
        draw_info();
        make_cars();
        draw_frog();
        setInterval(game_loop, 50);
    };
};

var game_loop = function() {
    if (!game.paused) {
        draw_bg();
        draw_info();
        draw_cars();
        if (game.lives > 0) { 
            draw_frog();
        } else {
            game_over();
        }
    }
};

var get_arrow_key = function(e) {
    /* 
    Args:
        e -- event

    Returns: the name of the arrow key that was pressed when a key is pressed or null.
    */
    switch(e.keyCode) {
        case 37:
            return 'l';
        case 38:
            return 'u';
        case 39:
            return 'r';
        case 40:
            return 'd';
    }
    return null;
};

//drawer functions: bg, info, frogger, cars
var draw_bg = function() {
    context.fillStyle='#191970';
    context.fillRect(0,0,399,284);
    context.fillStyle='#D8D5C4';
    context.fillRect(0,284,399,283);
    context.drawImage(sprites, 0, 0, 399, 113, 0, 0, 399, 113);
    context.drawImage(sprites, 0, 119, 399, 34, 0, 283, 399, 34);
    context.drawImage(sprites, 0, 119, 399, 34, 0, 495, 399, 34);
};

var draw_info = function() {
    draw_lives();
    context.font = 'bold 14pt arial';
    context.fillStyle = '#00EE00';
    context.fillText('Level ', 74, 545);
    draw_level();
    context.font = 'bold 10pt arial';
    context.fillText('Score: ', 4, 560);
    context.fillText('Highscore: ', 200, 560);
    draw_score();
};

var draw_lives = function() {
    var x = 4;
    var y = 532;
    if ((game.score - (game.extra * 10000)) >= 10000 && game.lives < 4) {
        game.extra++;
    }
    for (var i = 0; i<(game.lives + game.extra); i++){ 
        context.drawImage(sprites, 13, 334, 17, 23, x, y, 11, 15);
        x += 14;
    }
};

var draw_level = function() {
    context.font = 'bold 15pt arial';
    context.fillStyle = '#00EE00';
    context.fillText(game.level, 131, 545);
};

var draw_score = function() {
    context.font = 'bold 10pt arial';
    context.fillStyle = '#00EE00';
    context.fillText(game.score, 49, 560);
    if (window.localStorage['highscore']) {
        highscore = localStorage['highscore'];
    } else highscore = 0;
    context.fillText(highscore, 272, 560);
};

var draw_frog = function() {
    if (game.dead > 0) {
            // @4,2 ; 19x24
        context.drawImage(deadsprite, 4, 2, 19, 24, game.posX, game.posY, 19, 24);
        game.dead--;
    }
    else if (game.dead === 0) {
        game.reset();
    }
    else if (car_collision()) {
        hit_car();
    }
    else {
        if (game.facing === 'u') {
            context.drawImage(sprites, 12, 369, 23, 17, game.posX, game.posY, 23, 17);
            game.width = 23, game.height = 17;
        }
        else if (game.facing === 'd') {
            context.drawImage(sprites, 80, 369, 23, 17, game.posX, game.posY, 23, 17);
            game.width = 23, game.height = 17;
        }
        else if (game.facing === 'l') {
            context.drawImage(sprites, 80, 335, 19, 23, game.posX, game.posY, 19, 23);
            game.width = 19, game.height = 23;
        }
        else if (game.facing === 'r') {
            context.drawImage(sprites, 12, 335, 19, 23, game.posX, game.posY, 19, 23);
            game.width = 19, game.height = 23;
        }
    }
};


var draw_cars = function() {
    for (var i=0; i<cars.length; i++) {
        cars[i].move();
        if (cars[i].out_of_bounds()) {
            cars[i] = make_car(cars[i].lane, null, cars[i].model);
        }
        if (!cars[i].invisible)
          cars[i].draw();
    }
};


var game_over = function() {
    context.font = 'bold 72pt arial';
    context.fillStyle = '#FFFFFF';
    context.fillText('GAME', 60, 150);
    context.fillText('OVER', 60, 300);
    if (game.score >= highscore) {
        localStorage['highscore'] = game.score;
        context.font = 'bold 48pt arial';
        context.fillStyle = '#00EE00';
        context.fillText('YOU GOT A', 20, 380);
        context.fillText('HIGHSCORE', 6, 460);
    }
};

//move
var up = function() {
    if (bounds_check(game.posX, game.posY-30)) {
        game.posY -= 30;
        game.current++;
    }
    if (game.current > game.highest) {
        game.score += 10;
        game.highest++;
    }
    game.facing = 'u';
};

var down = function() {
    if (bounds_check(game.posX, game.posY+30)) {
        game.posY += 30;
        game.current--;
    }
    game.facing = 'd';
};

var left = function() {
    if (bounds_check(game.posX-30, game.posY)) game.posX -= 30;
    game.facing = 'l';
};

var right = function() {
    if (bounds_check(game.posX+30, game.posY)) game.posX += 30;
    game.facing = 'r';
};

var bounds_check = function(x, y) {
    if (y > 300 && y < 480 && x > 0 && x < 369) {
        return true;
    }
    return false;
};


var level = function() {
    for (var i=0; i<game.won.length; i++) {
        game.won[i] = false;
    }
    game.score += 1000;
    game.level++;
};

var collides = function(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (((x1 <= x2+w2 && x1 >=x2) && (y1 <= y2+h2 && y1 >= y2)) ||
            ((x1+w1 <= x2+w2 && x1+w1 >= x2) && (y1 <= y2+h2 && y1 >= y2)) ||
            ((x1 <= x2+w2 && x1 >=x2) && (y1+h1 <= y2+h2 && y1+h1 >= y2)) ||
            ((x1+w1 <= x2+w2 && x1+w1 >= x2) && (y1+h1 <= y2+h2 && y1+h1 >= y2)));
}

var car_collision = function() {
    if (game.posY < 505 && game.posY > 270) {
        for (var i=0; i<cars.length; i++) {
            if (!cars[i].invisible && collides(
                    game.posX, 
                    game.posY, 
                    game.width, 
                    game.height, 
                    cars[i].posX, 
                    cars[i].posY, 
                    cars[i].width, 
                    cars[i].height)) {
                game.last_hit = cars[i];
                return true;
            } 
        }
    }
    return false;
};



var sploosh = function() {
    game.lives--;
    game.dead = 20;
};

var hit_car = function() {
    game.paused = true;
    context.drawImage(models[game.last_hit.model].image, 50, 50);
    setTimeout(() => {
        prompt();
        game.last_hit.invisible = true;
        game.paused = false;
    }, 100);

};

// object initializers - cars
var make_cars = function() {
    cars = [];
    for (var i=0; i < 30; i++) {
        cars.push(make_random_car());
    }
    cars.forEach(c => c.invisible=true);
};


var make_random_car = function() {
    return make_car(Math.floor(Math.random()*6), Math.random()*399, Math.floor(Math.random()*5));
};

var make_car = function(row, x, model) {
    switch(row) {
        case 0:
            return new Car(x==null?399:x, rows[row], row, 3, model==null?1:model);
        case 1:
            return new Car(x==null?399:x, rows[row], row, 2, model==null?0:model);
        case 2:
            return new Car(x==null?399:x, rows[row], row, 4, model==null?2:model);
        case 3:
            return new Car(x==null?399:x, rows[row], row, 3, model==null?3:model);
        case 4:
            return new Car(x==null?399:x, rows[row], row, 3, model==null?0:model);
        case 5:
            return new Car(x==null?399:x, rows[row], row, 4, model==null?4:model);
    }
};


/* game "classes" - game, car
 * Car models:
 *   0: pink sedan
 *   1: white sedan
 *   2: yellow sedan
 *   3: white bulldozer
 *   4: white truck
 */
var Car = function(x, y, lane, speed, model) {
    this.posX = x;
    this.posY = y;
    this.lane = lane;
    this.speed = speed;
    this.model = model;
    this.width = models[model].width;
    this.height = models[model].height;
    this.move = function() {
        this.posX = this.posX - (models[model].dir * this.speed * game.level);
    };
    this.draw = function() {
        if (models[this.model].image) {
            context.drawImage(models[this.model].image, this.posX, this.posY, 30, 22);
        } else {
            models[this.model].image = new Image();
            models[this.model].image.src = models[this.model].file;
        }
    };
    this.out_of_bounds = function() {
        return ((this.posX + this.width) < 0);
    };
};
var Game = function() {
    this.preloaded_data = {};
    this.lives = 5;
    this.extra = 0;
    this.level = 1;
    this.score = 0;   
    this.reset = function () {
        this.posY = 473;
        this.posX = 187;
        this.facing = 'u';
        this.current = -1;
        this.highest = -1;
        this.dead = -1;
    }
    this.reset();
}

start_game();
})();
