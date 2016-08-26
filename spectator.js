AFRAME.registerComponent('spectator',{
        'schema': {
          canvas: {
            type: 'string',
            default: ''
          },
          // desired FPS of spectator dislay
          fps: {
            type: 'number',
            default: '15.0'
          }
        },
        'init': function() {
          var targetEl = document.querySelector(this.data.canvas)

          this.counter = 0;
          this.renderer = new THREE.WebGLRenderer( { antialias: true } );

          this.renderer.setPixelRatio( window.devicePixelRatio );
          this.renderer.setSize( targetEl.offsetWidth, targetEl.offsetHeight );

          // creates spectator canvas
          targetEl.appendChild(this.renderer.domElement);
        },
        'tick': function(time, timeDelta) {



          var loopFPS = 1000.0 / timeDelta;
          var hmdIsXFasterThanDesiredFPS = loopFPS / this.data.fps;
          var renderEveryNthFrame = Math.round(hmdIsXFasterThanDesiredFPS);

          if(this.counter % renderEveryNthFrame === 0){
            this.render(timeDelta);
          }
          this.counter += 1;  
        },
        'render': function(){
          this.renderer.render( this.el.sceneEl.object3D , this.el.object3DMap.camera );
        }
      });

document.addEventListener("DOMContentLoaded", function(event) {
    var video = document.querySelector("#videoElement");
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
	if (navigator.getUserMedia) {       
	    navigator.getUserMedia({video: true}, handleVideo, videoError);
	}

	function handleVideo(stream) {
	    video.src = window.URL.createObjectURL(stream);
	}

	function videoError() {
	    // do something
	    console.log("could not do video");
	}
});

