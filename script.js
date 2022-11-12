var settings = {
  particles: {
    length:   260, // maximum amount of particles
    duration:   4, // particle duration in sec
    velocity: 250, // particle velocity in pixels/sec
    effect: -0.65, // play with this for a nice effect
    size:      20, // particle size in pixels
  },
};

(function(){var b=0;var c=["ms","moz","webkit","o"];for(var a=0;a<c.length&&!window.requestAnimationFrame;++a){window.requestAnimationFrame=window[c[a]+"RequestAnimationFrame"];window.cancelAnimationFrame=window[c[a]+"CancelAnimationFrame"]||window[c[a]+"CancelRequestAnimationFrame"]}if(!window.requestAnimationFrame){window.requestAnimationFrame=function(h,e){var d=new Date().getTime();var f=Math.max(0,16-(d-b));var g=window.setTimeout(function(){h(d+f)},f);b=d+f;return g}}if(!window.cancelAnimationFrame){window.cancelAnimationFrame=function(d){clearTimeout(d)}}}());

/*
 * Point class
 */
var Point = (function() {
  function Point(x, y) {
    this.x = (typeof x !== 'undefined') ? x : 0;
    this.y = (typeof y !== 'undefined') ? y : 0;
  }
  Point.prototype.clone = function() {
    return new Point(this.x, this.y);
  };
  Point.prototype.length = function(length) {
    if (typeof length == 'undefined')
      return Math.sqrt(this.x * this.x + this.y * this.y);
    this.normalize();
    this.x *= length;
    this.y *= length;
    return this;
  };
  Point.prototype.normalize = function() {
    var length = this.length();
    this.x /= length;
    this.y /= length;
    return this;
  };
  return Point;
})();

/*
 * Particle class
 */
var Particle = (function() {
  function Particle() {
    this.position = new Point();
    this.velocity = new Point();
    this.acceleration = new Point();
    this.age = 0;
  }
  Particle.prototype.initialize = function(x, y, dx, dy) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = dx;
    this.velocity.y = dy;
    this.acceleration.x = dx * settings.particles.effect;
    this.acceleration.y = dy * settings.particles.effect;
    this.age = 0;
  };
  Particle.prototype.update = function(deltaTime) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.age += deltaTime;
  };
  Particle.prototype.draw = function(context, image) {
    function ease(t) {
      return (--t) * t * t + 1;
    }
    var size = image.width * ease(this.age / settings.particles.duration);
    context.globalAlpha = 1 - this.age / settings.particles.duration;
    context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
  };
  return Particle;
})();

/*
 * ParticlePool class
 */
var ParticlePool = (function() {
  var particles,
      firstActive = 0,
      firstFree   = 0,
      duration    = settings.particles.duration;
  
  function ParticlePool(length) {
    // create and populate particle pool
    particles = new Array(length);
    for (var i = 0; i < particles.length; i++)
      particles[i] = new Particle();
  }
  ParticlePool.prototype.add = function(x, y, dx, dy) {
    particles[firstFree].initialize(x, y, dx, dy);
    
    // handle circular queue
    firstFree++;
    if (firstFree   == particles.length) firstFree   = 0;
    if (firstActive == firstFree       ) firstActive++;
    if (firstActive == particles.length) firstActive = 0;
  };
  ParticlePool.prototype.update = function(deltaTime) {
    var i;
    
    // update active particles
    if (firstActive < firstFree) {
      for (i = firstActive; i < firstFree; i++)
        particles[i].update(deltaTime);
    }
    if (firstFree < firstActive) {
      for (i = firstActive; i < particles.length; i++)
        particles[i].update(deltaTime);
      for (i = 0; i < firstFree; i++)
        particles[i].update(deltaTime);
    }
    
    // remove inactive particles
    while (particles[firstActive].age >= duration && firstActive != firstFree) {
      firstActive++;
      if (firstActive == particles.length) firstActive = 0;
    }
    
    
  };
  ParticlePool.prototype.draw = function(context, image) {
    // draw active particles
    if (firstActive < firstFree) {
      for (i = firstActive; i < firstFree; i++)
        particles[i].draw(context, image);
    }
    if (firstFree < firstActive) {
      for (i = firstActive; i < particles.length; i++)
        particles[i].draw(context, image);
      for (i = 0; i < firstFree; i++)
        particles[i].draw(context, image);
    }
  };
  return ParticlePool;
})();

initHeart = function(canvas) {
  var context = canvas.getContext('2d'),
      particles = new ParticlePool(settings.particles.length),
      particleRate = settings.particles.length / settings.particles.duration, // particles/sec
      time;
  
  // get point on heart with -PI <= t <= PI
  function pointOnHeart(t) {
    return new Point(
      220 * Math.pow(Math.sin(t), 3),
      180 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
    );
  }
  
  // creating the particle image using a dummy canvas
  var image = (function() {
    var canvas  = document.createElement('canvas'),
        context = canvas.getContext('2d');
    canvas.width  = settings.particles.size;
    canvas.height = settings.particles.size;
    // helper function to create the path
    function to(t) {
      var point = pointOnHeart(t);
      point.x = settings.particles.size / 2 + point.x * settings.particles.size / 550;
      point.y = settings.particles.size / 2 - point.y * settings.particles.size / 550;
      return point;
    }
    // create the path
    context.beginPath();
    var t = -Math.PI;
    var point = to(t);
    context.moveTo(point.x, point.y);
    while (t < Math.PI) {
      t += 0.01; // baby steps!
      point = to(t);
      context.lineTo(point.x, point.y);
    }
    context.closePath();
    // create the fill
    context.fillStyle = '#EB1D36';
    context.fill();
    // create the image
    var image = new Image();
    image.src = canvas.toDataURL();
    return image;
  })();
  
  // render that thing!
  function render() {
    // next animation frame
    requestAnimationFrame(render);
    
    // update time
    var newTime   = new Date().getTime() / 3000,
        deltaTime = newTime - (time || newTime);
    time = newTime;
    
    // clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // create new particles
    var amount = particleRate * deltaTime;
    for (var i = 0; i < amount; i++) {
      var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
      var dir = pos.clone().length(settings.particles.velocity);
      particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
    }
    
    // update and draw particles
    particles.update(deltaTime);
    particles.draw(context, image);
  }
  
  // handle (re-)sizing of the canvas
  function onResize() {
    canvas.width  = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.onresize = onResize;
  
  // delay rendering bootstrap
  setTimeout(function() {
    onResize();
    render();
  }, 10);
};

document.getElementById('no-button').addEventListener('mouseover', function() {
  this.remove()
  addButton('1')
})

document.getElementById('no-button').addEventListener('click', function() {
  this.remove()
  addButton('1')
})

handleButton = function(time, ele) {
  ele.remove();
  addButton(time);
}

next = function(time) {
  switch(time) {
    case '1':
      document.getElementById('card-1').remove();
      document.getElementById('content-container').innerHTML += 
      `
      <div id="card-2" class="card border-primary mx-2" style="width: 30rem;">
        <div class="card-body">
          <h5 class="card-title text-black text-primary text-uppercase">Anh biết bé sẽ chọn mở mà :)))) <br></h5>
          <p class="card-text text-secondary">Ấn tiếp tục nha</p>
          <div id="group-button-2" class="text-center">
            <a href="#" id="yes-button-3" onclick="next('2')" class="btn btn-primary mb-2">Tiếp tục <i class="far fa-hand-point-right"></i></i></a>
          </div>
        </div>
      </div>
      `
      break;
    case '2':
      document.getElementById('card-2').remove();
      document.getElementById('content-container').innerHTML += 
      `
      <div id="card-3" class="card border-primary mx-2" style="width: 30rem;">
        <div class="card-body">
          <h5 class="card-title text-black text-primary">Bé có yêu chàng tiên ốc Vũ Quang Huy này hum ạ ?<br></h5>
          <div id="group-button-3" class="text-center">
            <a href="#" id="yes-button-1" onclick="next('3')" class="btn btn-primary mb-2 mr-3">Yêu quá chời yêu <i class="fas fa-heart"></i></a>
            <br class="mobile-break">
            <a href="#" onclick="handleButton('2', this)" onmouseover="handleButton('2', this)" id="no-button-2" class="btn btn-secondary mb-2">Hong yêu</a>
          </div>
        </div>
      </div>
      `
      break;
    case '3':
      document.getElementById('card-3').remove();
      document.getElementById('content-container').innerHTML += 
      `
      <div id="card-4" class="card border-primary mx-2" style="width: 30rem;">
        <div class="card-body">
          <h5 class="card-title text-black text-primary text-uppercase">Đây rồi, lời nhắn đây :)))) <br></h5>
          <p class="card-text text-secondary">Ấn để xem lời nhắn nha</p>
          <div id="group-button-2" class="text-center">
            <a href="#" id="yes-button-3" onclick="next('4')" class="btn btn-primary mb-2">Xem lời nhắn <i class="far fa-grin-hearts"></i></a>
          </div>
        </div>
      </div>
      `
      break;
    case '4':
      document.getElementById('card-4').remove();
      document.getElementById('curtain').classList.remove("d-block")
      document.getElementById('curtain').classList.add("d-none")
      document.getElementById('main-content').classList.remove("d-none")
      initHeart(document.getElementById('pinkboard'));
      break;
    case '5':
      document.getElementById('main-content').classList.add("h-100")
      document.getElementById('content-container-2').classList.add("d-none")
      document.getElementById('main-text-container').classList.remove("d-none")
      break;
  }
}
addButton = function(time) {
  switch(time) {
    case '1':
      document.getElementById('group-button-1').innerHTML += `<a href="#" onclick="next('1')" id="yes-button-2" class="btn btn-secondary mb-2">Mở liền</a>`
      break;
    case '2':
      document.getElementById('group-button-3').innerHTML += `<a href="#" onclick="next('3')" id="yes-button-2" class="btn btn-secondary mb-2">Cực kỳ yêu luôn <i class="far fa-kiss-wink-heart"></i></a>`
      break;
  }
}

var love = setInterval(function() {
    var r_num = Math.floor(Math.random() * 10) + 1;
    var r_size = Math.floor(Math.random() * 45) + 5;
    var r_left = Math.floor(Math.random() * 100) + 1;
    var r_bg = Math.floor(Math.random() * 25) + 10;
    var r_time = Math.floor(Math.random() * 5) + 16;

    $('.bg_heart').append("<div class='heart' style='width:" + r_size + "px;height:" + r_size + "px;left:" + r_left + "%;background:rgba(255," + (r_bg - 25) + "," + r_bg + ",1);-webkit-animation:love " + r_time + "s ease;-moz-animation:love " + r_time + "s ease;-ms-animation:love " + r_time + "s ease;animation:love " + r_time + "s ease'></div>");

    $('.bg_heart').append("<div class='heart' style='width:" + (r_size - 10) + "px;height:" + (r_size - 10) + "px;left:" + (r_left + r_num) + "%;background:rgba(255," + (r_bg - 25) + "," + (r_bg + 25) + ",1);-webkit-animation:love " + (r_time + 5) + "s ease;-moz-animation:love " + (r_time + 5) + "s ease;-ms-animation:love " + (r_time + 5) + "s ease;animation:love " + (r_time + 5) + "s ease'></div>");

    $('.heart').each(function() {
        var top = $(this).css("top").replace(/[^-\d\.]/g, '');
        var width = $(this).css("width").replace(/[^-\d\.]/g, '');
        if (top <= -100 || width >= 150) {
            $(this).detach();
        }
    });
}, 500);