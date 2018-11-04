(function(opts) {
  function AnimatedTextbox(el, duration) {
    this.baseClass = 'textbox';
    this.duration = duration;

    if (!el) {
      var el = document.createElement('div');
      el.className = this.baseClass;
    }
      el.style.cssText = 'transition: bottom ' + (this.duration / 1000) + 's linear, opacity 1s';

    this.element = el;
  }

  AnimatedTextbox.prototype.is = function(className, state) {
    var outputClass = this.baseClass + '--' + className;
    if (typeof state !== 'undefined')
      this.element.classList[!!state === true ? 'add' : 'remove'](outputClass)
    return this.element.classList.contains(outputClass);
  };

  AnimatedTextbox.prototype.render = function(to) {
    if (document.body.contains(el)) return;
    (to || document.body).appendChild(el);
  };

  AnimatedTextbox.prototype.hide = function() {
    var self = this;
    self.is('hiding', true);
    setTimeout(function() {
      self.is('hiding', false);
      self.is('hidden', true);
    }, 1000);
  };

  AnimatedTextbox.prototype.show = function() {
    var self = this;
    self.is('hidden', false);
    self.is('showing', true);
    setTimeout(function() {
      self.is('showing', false);
    }, 1000);
  };

  AnimatedTextbox.prototype.animate = function() {
    var self = this;
    self.show();
    self.is('animated', true);
    if (self.duration) {
      setTimeout(function() {
        self.is('animated', false);
        self.hide();
      }, self.duration);
    }
  };

  opts.root.textbox = function(el) {
    return new AnimatedTextbox(el, !el ? 5000 : parseInt(el.dataset.duration) * 1000);
  };
}({
  root: window
}))