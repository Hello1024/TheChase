
/* Local Vars:
 *   models : Object[] -- 
 *   lengths : Object[] --
 *   rows : Int[] -- y-coords of rows starting with first traffic row
 *   context : Canvas Context -- used for drawing to main canvas.
 */

var lengths = [{width: 179, height: 21}, {width: 118, height: 21}, {width: 85, height: 22}];
var rows = [473-271, 443-271, 413-271, 383-271, 353-271, 323-271, 0];
var context = null;

var show_rules = function() {
    document.getElementById('start_image').style.visibility="hidden";
}
var start_game = function() {
    document.getElementById('rules_image').style.visibility="hidden";

    game = new Game();
    
    $(document).keydown(function(e) {
        var arrow_key = get_arrow_key(e);
        if (arrow_key) {
            e.preventDefault(); 
            game.paused = false;
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
    
    new Audio('Sirens.mp3').play();
    
    sprites = new Image();
    deadsprite = new Image();
    sprites.src = 'assets/thechase_sprites_v2.png'; 
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
        draw_police();
        if (game.lives > 0) { 
            game.score += 1;
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
    context.fillStyle='#D8D5C4';
    context.fillRect(0,0,399,344);

    //context.drawImage(sprites, 0, 0, 399, 113, 0, 0, 399, 113);
    context.drawImage(sprites, 0, 119, 399, 34, 0, 0, 399, 34);
    context.drawImage(sprites, 0, 119, 399, 34, 0, 495-271, 399, 34);
};

var draw_info = function() {
    draw_lives();
    context.fillStyle = '#600000';

    context.font = 'bold 10pt arial';
    context.fillText('Score: ', 4, 560-271);
    context.fillText('Highscore: ', 200, 560-271);
    draw_score();
};

var draw_lives = function() {
    var x = 4;
    var y = 532-271;
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
    context.fillText(game.level, 131, 545-271);
};

var draw_score = function() {
    context.font = 'bold 10pt arial';
    context.fillText(game.score, 49, 560-271);
    if (window.localStorage['highscore']) {
        highscore = localStorage['highscore'];
    } else highscore = 0;
    context.fillText(highscore, 272, 560-271);
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
    // police collision
    else if (game.posX < game.policePosX + 30) {
        sploosh();
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

var draw_police = function() {
  context.drawImage(sprites, 230, 315, 100, 180, game.policePosX, 473-150-271, 100, 180);
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
    context.font = 'bold 48pt arial';
    context.fillStyle = '#222';
    context.fillText('GAME', 60, 80);
    context.fillText('OVER', 60, 160);
    if (game.score >= highscore) {
        localStorage['highscore'] = game.score;
        context.font = 'bold 32pt arial';
        context.fillStyle = '#922';
        context.fillText('YOU GOT A', 20, 210);
        context.fillText('HIGHSCORE', 6, 280);
    }
};

//move
var up = function() {
    if (bounds_check(game.posX, game.posY-30)) {
        game.posY -= 30;
        game.current++;
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
    if (y > 300-271 && y < 480-271 && x > 0 && x < 369) {
        return true;
    }
    return false;
};



var collides = function(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (((x1 <= x2+w2 && x1 >=x2) && (y1 <= y2+h2 && y1 >= y2)) ||
            ((x1+w1 <= x2+w2 && x1+w1 >= x2) && (y1 <= y2+h2 && y1 >= y2)) ||
            ((x1 <= x2+w2 && x1 >=x2) && (y1+h1 <= y2+h2 && y1+h1 >= y2)) ||
            ((x1+w1 <= x2+w2 && x1+w1 >= x2) && (y1+h1 <= y2+h2 && y1+h1 >= y2)));
}

var car_collision = function() {
    if (game.posY < 505-271 && game.posY > 270-271) {
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
                // we can't hit more stuff till the old one is resolved
                if (game.last_hit) return false; 
                game.last_hit = cars[i];
                return true;
            } 
        }
    }
    game.last_hit = false;
    return false;
};



var sploosh = function() {
    game.lives--;
    game.dead = 20;
    new Audio('Prison Cell Door sound effect.mp3').play();
    
};

var hit_car = function() {
    game.paused = true;
    document.getElementById('questionimg').src = models[game.last_hit.model].file;
    document.getElementById('question').style.display = 'block';
    document.getElementById('answerbox').value = '';
    document.getElementById('answerbox').focus();

    
    setTimeout(() => {
        document.getElementById('question').style.display = 'none';
        var answer = document.getElementById('answerbox').value;
        document.getElementById('answerbox').blur();
        if (models[game.last_hit.model].answer) {
            if (answer == models[game.last_hit.model].answer ) {
                // Correct
                game.policePosX -= 3;
                game.score += answer.length*200;
            } else {
                // wrong
                game.policePosX += 30;
            }
        }
        game.last_hit.invisible = true;
        game.paused = false;
    }, 5000);

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
    return make_car(Math.floor(Math.random()*6), Math.random()*399, Math.floor(Math.random()*models.length));
};

var make_car = function(row, x, model) {
    return new Car(x==null?399:x, rows[row], row, model==null?1:model);
};


/* game "classes" - game, car
 * Car models:
 *   0: pink sedan
 *   1: white sedan
 *   2: yellow sedan
 *   3: white bulldozer
 *   4: white truck
 */
var Car = function(x, y, lane, model) {
    this.posX = x;
    this.posY = y;
    this.lane = lane;
    this.speed = Math.random()+0.1;
    this.model = model;
    this.width = models[model].width;
    this.height = models[model].height;
    this.move = function() {
        this.posX = this.posX - (models[model].dir * this.speed * (game.posX/100));
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
    this.lives = 3;
    this.extra = 0;
    this.level = 1;
    this.score = 0;
    this.policePosX = -50;  
    this.reset = function () {
        this.posY = 473-271;
        this.posX = 187;
        this.facing = 'u';
        this.current = -1;
        this.highest = -1;
        this.dead = -1;
    }
    this.paused = true;
    this.reset();
}



window.addEventListener('load', function(){
 
    var touchsurface = document.getElementById('game'),
        startX,
        startY,
        Xdist,
        Ydist,
        threshold = 100, //required min distance traveled to be considered swipe
        allowedTime = 400, // maximum time allowed to travel that distance
        elapsedTime,
        startTime
 
    function handleswipe(swipeleftBol, swiperightBol, swipeupBol, swipedownBol){

        game.paused = false;
        if (game.dead === -1 && game.lives > 0) {
            if (swipeupBol){ 
                up();
            } else if (swipedownBol){
                down();
            } else if (swipeleftBol){
                left();
            } else if (swiperightBol){
                right();
            }
        }
    }
 
    touchsurface.addEventListener('touchstart', function(e){
        touchsurface.innerHTML = ''
        var touchobj = e.changedTouches[0]
        dist = 0
        startX = touchobj.pageX
        startY = touchobj.pageY
        startTime = new Date().getTime() // record time when finger first makes contact with surface
        e.preventDefault();
    }, false)
 
    touchsurface.addEventListener('touchmove', function(e){
        e.preventDefault() // prevent scrolling when inside DIV
    }, false)
 
    touchsurface.addEventListener('touchend', function(e){
        var touchobj = e.changedTouches[0]
        Xdist = touchobj.pageX - startX // get total dist traveled by finger while in contact with surface
        Ydist = touchobj.pageY - startY // get total dist traveled by finger while in contact with surface
        elapsedTime = new Date().getTime() - startTime // get time elapsed
        // check that elapsed time is within specified, horizontal dist traveled >= threshold, and vertical dist traveled <= 100
        var swiperightBol = (elapsedTime <= allowedTime && Xdist >= threshold && Math.abs(Ydist) <= 50);
        var swipeleftBol = (elapsedTime <= allowedTime && Xdist <= -threshold && Math.abs(Ydist) <= 50);
        var swipedownBol = (elapsedTime <= allowedTime && Ydist >= threshold && Math.abs(Xdist) <= 50);
        var swipeupBol = (elapsedTime <= allowedTime && Ydist <= -threshold && Math.abs(Xdist) <= 50);
        handleswipe(swipeleftBol, swiperightBol, swipeupBol, swipedownBol)
        e.preventDefault()
    }, false)
 
}, false) // end window.onload
