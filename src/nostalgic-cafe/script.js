var app = (function(SC) {

  // utilities
  function foreach(context, fn) {
    Array.prototype.forEach.call(context, fn);
  }
  function filter(context, fn) {
    return Array.prototype.filter.call(context, fn);
  }
  function map(context, fn) {
    return Array.prototype.map.call(context, fn);
  }
  function hide(el) {
    var baseAttr = el.getAttribute('class').replace(' hidden', '');
    el.setAttribute('class',  baseAttr + ' hidden');
  };
  function show(el) { 
    var baseAttr = el.getAttribute('class').replace(' hidden', '');
    el.setAttribute('class', baseAttr);
  };

  // animation
  var animation = {
    flash: (function() {
      var toHide = true;
      
      return function(elements) {
        if (toHide) {
          foreach(elements, hide);
          toHide = false;
        } else {
          foreach(elements, show);
          toHide = true;
        }
      };
    }()),
    inturn: (function() {
      var index = 0;
      
      return function(elements) {
        foreach(elements, function(halo, i) {
          if (index === i)
            show(halo);
          else 
            hide(halo);
        })
        index = index === elements.length - 1 ? 0 : index + 1;
      };
    }()),
    inarow: (function() {
      var index = 0
        , toHide = false;
      
      return function(elements) {
        var halo = elements[index];
        if (toHide)
          hide(halo);
        else
          show(halo);
        
        if (index === elements.length - 1) {
          index = 0;
          toHide = !toHide;
        } else {
          index++;
        }
      };
    }()),
    interval: null
  };

  var Timer = function(t) {
    var timeout;
    var instance = {
      onend: function() {},
      valueOf: t
    }
    instance.start = function() {
      timeout = setTimeout(instance.onend, t);
    }
    instance.end = function() {
      clearTimeout(timeout);
      instance.onend();
    }
    return instance;
  }

  var interval = function(dur) {
    var i = null;
    dur = dur || 1000;

    return {
      start: function(dur) {
        i = setInterval(function() {
        }, dur)
      },
      stop: function() {
        clearInterval(i);
      }
    }
  }

  var playlist = {
    activeTrack: null,
    tracks: [],
    activate: function(track) {
      foreach(this.tracks, function(t) {
        if (t.playing)
          t.deactivate();
      })
      track.activate();
      if (this.isPlaying)
        track.play();
      this.activeTrack = track;
    },
    pause: function() {
      this.activeTrack.pause();
      this.activeTrack = null;
    },
    next: function() {
      return this.track(this.tracks.indexOf(this.activeTrack) + 1);
    },
    add: function(track) {
      var self = this;
      track.onactivate = function() {
        foreach(filter(self.tracks, function(t) {
          return t !== track;
        }), function(t) {
          t.deactivate();
        });
        if (playlist.isPlaying)
          track.play();
      };
      this.tracks.push(track);
    },
    track: function(indexOrProp, value) {
      if (typeof indexOrProp === 'string')
        return filter(this.tracks, function(t) {
          return t[indexOrProp] === value;
        })[0];
      return this.tracks[indexOrProp];
    },
    on: function(evt, fn) {
      var self = this;
      foreach(this.tracks, function(t) {
        t.on(evt, function() {
          if (self.activeTrack === t)
            fn.apply(null, arguments);
        });
      })
    }
  };

Object.defineProperties(playlist, {
  activeTrack: {
    get: function() {
      return this.track('active', true);
    },
    set: function(t) {
      foreach(this.tracks, function(t) {
        t.deactivate();
      });
      if (t)
        t.activate();
    }
  },
  isPlaying: {
    get: function() {
      return !!this.track('playing', true);
    }
  },
  length: {
    get: function() {
      return this.tracks.length;
    }
  }
});

(function(global, SC) {
  global.TrackModel = function(element) {
    var d = null
      , p = null
      , x = false
      , a = false;

    var iframe = element.getElementsByTagName('iframe')[0]
      , btn    = element.getElementsByClassName('track__number')[0]
      , embed  = element.getElementsByClassName('track__embed')[0];

    var widget = SC.Widget(iframe);
      
    var t = {
      animation: {
        frequency: parseInt(element.dataset.animfrequency),
        type: element.dataset.animation
      },
      element: element,
      texts: (function() {
        var texts = element.getElementsByClassName('textbox');
        return texts.length ? map(texts, function(el) {
          var x = textbox(el);
          x.timer = parseInt(el.dataset.t) * 1000;
          return x;
        }) : [];
      }()),
      play: function() { widget.play(); },
      pause: function() { widget.pause(); },
      on: function(evt, fn) { widget.bind(SC.Widget.Events[evt], fn); },
      seek: function(pos, cb) { widget.seekTo(pos, cb); },
      activate: function() {
        t.active = true;
        element.classList.add('track--active');
      },
      deactivate: function() { 
        t.active = false;
        element.classList.remove('track--active');
      }
    };

    Object.defineProperties(t, {
      id: {
        get: function() {
          return element.getAttribute('data-id');
        }
      },
      active: {
        get: function() { return a; },
        set: function(v) { a = !!v; }
      },
      duration: {
        get: function() {
          if (!d) 
            widget.getDuration(function(duration) {
              d = duration;
            });
          return d;
        }
      },
      position: {
        get: function() {
          widget.getPosition(function(position) {
            p = position;
          });
          return p;
        }
      },
      playing: {
        get: function() {
          widget.isPaused(function(paused) {
            x = !paused;
          });
          return x;
        }
      }
    });
    var intv = null
    t.on('PAUSE', function() {
      x = false;
      clearInterval(intv)
    });
    t.on('PLAY' , function() {
      x = true;
      intv = setInterval(function() {
        foreach(t.texts, function(text) {
          if (text.timer === Math.round(t.position / 1000) * 1000) {
            text.animate()
          }
        })
      }, 1000);
    });
    t.on('READY', function() {
      embed.classList.remove('track__embed--loading');
      btn.removeAttribute('disabled');
    });

    btn.addEventListener('click', function() {
      t.activate();
      if (t.onactivate)
        t.onactivate();
    });

    return t;
  };
}(window, SC));

  return {
    setInitialTrack: function() {
      var hashNav = location.hash.match(/^#track-(\d*)$/);
      if (hashNav && hashNav.length > 1) 
        hashNav = hashNav[1];
      
      var matchingTrack = playlist.track('id', hashNav);
      if (matchingTrack)
        playlist.activeTrack = matchingTrack;
      else
        playlist.activeTrack = playlist.track(0);
    },

    findNearestMultipleOf50: function(winWidth) {
      var x = 0;
      while (x < winWidth - 50) {
        x = x + 50;
      }
      return x;
    },

    resizeTrackList: function() {
      var winWidth = window.innerWidth
        , trackList = document.getElementById('track-list')
        , self = this;
      
      if (winWidth < 500) {
        trackList.style.width = self.findNearestMultipleOf50(winWidth) + 2 + 'px';
        foreach(playlist.tracks, function(t) {
          t.element.getElementsByTagName('iframe')[0].width = self.findNearestMultipleOf50(winWidth) - 1;
        });
      } else {
        trackList.style.width = '500px';
        foreach(playlist.tracks, function(t) {
          t.element.getElementsByTagName('iframe')[0].width = 499;
        });
      }
    },

    init: function() {
      var halos = document.getElementsByTagName('svg')[0].getElementsByClassName('halo');
      var trackElements = document.getElementsByClassName('track');
      var animated = false;
      
      foreach(trackElements, function(trackElement) {
        var track = TrackModel(trackElement);
        playlist.add(track);

        track.on('PLAY', function() {
          playlist.activeTrack = track;
          if (!animated) {
            animation.interval = setInterval(function() {
              animation[playlist.activeTrack.animation.type || 'inarow'](halos);
            }, playlist.activeTrack.animation.frequency || 500);
            animated = true;
          }
        });

        track.on('PAUSE', function() {
          clearInterval(animation.interval);
          animated = false;
        });

        track.on('FINISH', function() {
          if (playlist.next()) {
            playlist.activeTrack = playlist.next()
            playlist.activeTrack.seek(0);
            playlist.activeTrack.play();
          }
        });
      });

      this.setInitialTrack();
      if (window.innerWidth < 500)
        this.resizeTrackList();

      var resizeTimeout, self = this;
      window.addEventListener('resize', function() {
        self.resizeTrackList();
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
        }, 200);
      });
    }
  }
}(SC));

app.init();

var SVG = {
  viewBox: function(svg) {
    var coords = svg.getAttribute('viewBox').split(' ').map(function(coord) {
      return parseFloat(coord);
    });

    return {
      x: coords[0],
      y: coords[1],
      width: coords[2],
      height: coords[3]
    };
  },

  largestAxis: function(viewBox) {
    if (viewBox.height > viewBox.width)
      return viewBox.height;
    return viewBox.width;
  }
};


function optimalImageCover(image, origin) {
  var img = {
  	w: image.clientWidth,
  	h: image.clientHeight
  };
  img.ratio = Math.max(img.w, img.h) / Math.min(img.w, img.h);
  var win = {
  	w: window.innerWidth,
  	h: window.innerHeight
  };
  win.ratio = Math.max(win.w, win.h) / Math.min(win.w, win.h);
  
  var imgOverWinRatio = {
  	w: img.w / win.w,
    h: img.h / win.h
  }
  
    image.style.marginTop =  '0';
  if (imgOverWinRatio.w < imgOverWinRatio.h) {
  	image.style.width = win.w + 'px';
    image.style.height = 'auto';
    var multiplier = img.w / win.w;
    if (origin === 'center') {
      if (img.h * multiplier > win.h) 
      	image.style.marginTop = -((img.h * multiplier - win.h) / 2)  + 'px';
    }
  } else {
  	image.style.height = win.h + 'px';
    image.style.width = 'auto';
  }
}
