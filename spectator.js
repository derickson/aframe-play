function luminance(r,g,b) {
  return 0.2126*r + 0.7152*g + 0.0722*b;
}

function gray(r,g,b) {
  return .393*r + .769*g + .189*b;
}

function isGreenScreen(r,g,b) {

  lum = luminance(r,g,b);
  greenMoreThanRed = Math.max(0, g -r);
  greenMoreThanBlue = Math.max(0, g -b);

  return 50 < lum && 
      lum  < 220 && 
      g > 90 &&
      greenMoreThanRed > 10 &&
      greenMoreThanBlue > 5;
}

function bitOffset(x, y, width) {
  return ((width * y) + x) * 4;
}

// code modified from http://blog.ivank.net/fastest-gaussian-blur.html
// source channel, target channel, width, height, radius
function gaussBlur_1 (scl, tcl, w, h, r) {
    var rs = Math.ceil(r * 2.57);     // significant radius
    for(var i=0; i<h; i++) {
        for(var j=0; j<w; j++) {
            var val = [0,0,0], wsum = 0;
            for(var iy = i-rs; iy<i+rs+1; iy++) {
                for(var ix = j-rs; ix<j+rs+1; ix++) {
                    var x = Math.min(w-1, Math.max(0, ix));
                    var y = Math.min(h-1, Math.max(0, iy));
                    var dsq = (ix-j)*(ix-j)+(iy-i)*(iy-i);
                    var wght = Math.exp( -dsq / (2*r*r) ) / (Math.PI*2*r*r);
                    val[0] += scl[((y*w)+x)*4+0] * wght; 
                    val[1] += scl[((y*w)+x)*4+1] * wght;  
                    val[2] += scl[((y*w)+x)*4+2] * wght;  
                    wsum += wght;
                }
            }
            tcl[(i*w+j)*4+0] = Math.round(val[0]/wsum);
            tcl[(i*w+j)*4+1] = Math.round(val[1]/wsum);  
            tcl[(i*w+j)*4+2] = Math.round(val[2]/wsum);  
            tcl[(i*w+j)*4+3] = scl[((y*w)+x)*4+3];               
        }
    }
}

function boxesForGauss(sigma, n)  // standard deviation, number of boxes
{
    var wIdeal = Math.sqrt((12*sigma*sigma/n)+1);  // Ideal averaging filter width 
    var wl = Math.floor(wIdeal);  if(wl%2==0) wl--;
    var wu = wl+2;
        
    var mIdeal = (12*sigma*sigma - n*wl*wl - 4*n*wl - 3*n)/(-4*wl - 4);
    var m = Math.round(mIdeal);
    // var sigmaActual = Math.sqrt( (m*wl*wl + (n-m)*wu*wu - n)/12 );
        
    var sizes = [];  for(var i=0; i<n; i++) sizes.push(i<m?wl:wu);
    return sizes;
}

function gaussBlurColor_4(sclData, tclData, w, h, r){
  var sourceR = new Array(w*h);
  var sourceG = new Array(w*h);
  var sourceB = new Array(w*h);
  var targetBuffR = new Array(w*h);
  var targetBuffG = new Array(w*h);
  var targetBuffB = new Array(w*h);

  for(var i = 0; i<h; i++){
    for(var j = 0; j<w; j++){
      sourceR[i*w+j] = sclData[((i*w)+j)*4 + 0];
      sourceG[i*w+j] = sclData[((i*w)+j)*4 + 1];
      sourceB[i*w+j] = sclData[((i*w)+j)*4 + 2];
    }
  }

  gaussBlur_4(sourceR, targetBuffR, w, h, r);
  gaussBlur_4(sourceG, targetBuffG, w, h, r);
  gaussBlur_4(sourceB, targetBuffB, w, h, r);

  for(var i = 0; i<h; i++){
    for(var j = 0; j<w; j++){
      tclData[((i*w)+j)*4 + 0] = targetBuffR[i*w+j];
    }
  }
  for(var i = 0; i<h; i++){
    for(var j = 0; j<w; j++){
      tclData[((i*w)+j)*4 + 1] = targetBuffG[i*w+j];
    }
  }
  for(var i = 0; i<h; i++){
    for(var j = 0; j<w; j++){
      tclData[((i*w)+j)*4 + 2] = targetBuffB[i*w+j];
      tclData[((i*w)+j)*4 + 3] = sclData[((i*w)+j)*4 + 3]
    }
  }



  
}

function gaussBlur_4 (scl, tcl, w, h, r) {
    var bxs = boxesForGauss(r, 3);
    boxBlur_4 (scl, tcl, w, h, (bxs[0]-1)/2);
    boxBlur_4 (tcl, scl, w, h, (bxs[1]-1)/2);
    boxBlur_4 (scl, tcl, w, h, (bxs[2]-1)/2);
}



function boxBlur_4 (scl, tcl, w, h, r) {
    for(var i=0; i<scl.length; i++) tcl[i] = scl[i];
    boxBlurH_4(tcl, scl, w, h, r);
    boxBlurT_4(scl, tcl, w, h, r);
}
function boxBlurH_4 (scl, tcl, w, h, r) {
    var iarr = 1 / (r+r+1);
    for(var i=0; i<h; i++) {
        var ti = i*w, li = ti, ri = ti+r;
        var fv = scl[ti], lv = scl[ti+w-1], val = (r+1)*fv;
        for(var j=0; j<r; j++) val += scl[ti+j];
        for(var j=0  ; j<=r ; j++) { val += scl[ri++] - fv       ;   tcl[ti++] = Math.round(val*iarr); }
        for(var j=r+1; j<w-r; j++) { val += scl[ri++] - scl[li++];   tcl[ti++] = Math.round(val*iarr); }
        for(var j=w-r; j<w  ; j++) { val += lv        - scl[li++];   tcl[ti++] = Math.round(val*iarr); }
    }
}
function boxBlurT_4 (scl, tcl, w, h, r) {
    var iarr = 1 / (r+r+1);
    for(var i=0; i<w; i++) {
        var ti = i, li = ti, ri = ti+r*w;
        var fv = scl[ti], lv = scl[ti+w*(h-1)], val = (r+1)*fv;
        for(var j=0; j<r; j++) val += scl[ti+j*w];
        for(var j=0  ; j<=r ; j++) { val += scl[ri] - fv     ;  tcl[ti] = Math.round(val*iarr);  ri+=w; ti+=w; }
        for(var j=r+1; j<h-r; j++) { val += scl[ri] - scl[li];  tcl[ti] = Math.round(val*iarr);  li+=w; ri+=w; ti+=w; }
        for(var j=h-r; j<h  ; j++) { val += lv      - scl[li];  tcl[ti] = Math.round(val*iarr);  li+=w; ti+=w; }
    }
}






var videoLoaded = false;


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


          // start the webcam
          var video = document.querySelector("#videoElement");
          
          navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
          if (navigator.getUserMedia) {       
             navigator.getUserMedia({video: true}, handleVideo, videoError);
          }

          function handleVideo(stream) {
             video.src = window.URL.createObjectURL(stream);
             videoLoaded = true;
          }

          function videoError() {
             // do something
             console.log("could not do video");
          }

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

          this.renderComposite();

        },

        'renderComposite': function () {

          // this is the webcam
          var foregroundVideo = document.querySelector("#webcam video");
          
          // this is the spectator camera
          var backgroundCanvas = document.querySelector("#spectatorDiv canvas");

          // this is the target composite
          var canvas =  document.querySelector("#composite canvas");

          var width = foregroundVideo.width;
          var height = foregroundVideo.height;
          
          canvas.setAttribute('width', width);
          canvas.setAttribute('height', height);


          if(canvas.getContext){

            // TODO not hapy with how img data obtained.  
            // draw seems wasteful as it is already on a canvas

            var context = canvas.getContext('2d');
            
            context.drawImage(backgroundCanvas, 0, 0, width, height);
            var imgBackgroundData = context.getImageData(0, 0, width, height);
            
            context.drawImage(foregroundVideo, 0, 0, width, height);
            foregroundVideoData = context.getImageData(0, 0, width, height);
            
            var blurredVideoData = context.createImageData(width, height);
            var imgData = context.createImageData(width, height);

            if(videoLoaded && foregroundVideoData && foregroundVideoData.data){

              gaussBlurColor_4(foregroundVideoData.data, blurredVideoData.data, width, height, 2.0)
              // context.putImageData(blurredVideoData, 0, 0);

              for (i = 0; i < imgData.width * imgData.height * 4; i += 4) {
                  var blurryR = blurredVideoData.data[i + 0];
                  var blurryG = blurredVideoData.data[i + 1];
                  var blurryB = blurredVideoData.data[i + 2];

                  var r = foregroundVideoData.data[i + 0];
                  var g = foregroundVideoData.data[i + 1];
                  var b = foregroundVideoData.data[i + 2];
                  var a = foregroundVideoData.data[i + 3];

                  if( isGreenScreen(blurryR,blurryG,blurryB) ){
                    a = 0;

                    imgData.data[i + 0] = imgBackgroundData.data[i + 0];
                    imgData.data[i + 1] = imgBackgroundData.data[i + 1];
                    imgData.data[i + 2] = imgBackgroundData.data[i + 2];
                    imgData.data[i + 3] = imgBackgroundData.data[i + 3];
                  }
                  if(a != 0){ // draw the foreground image

                    imgData.data[i + 0] = r;
                    imgData.data[i + 1] = g;
                    imgData.data[i + 2] = b;
                    imgData.data[i + 3] = a;

                    }
              }

              // for(y=0; y<height; y++){
              //   for(x=0; x<width; x++){

              //     bO = bitOffset(x,y,width);

              //     imgData.data[ bO + 0 ] = foregroundVideoData.data[ bO + 0 ];
              //     imgData.data[ bO + 1 ] = foregroundVideoData.data[ bO + 1 ];
              //     imgData.data[ bO + 2 ] = foregroundVideoData.data[ bO + 2 ];
              //     imgData.data[ bO + 3 ] = foregroundVideoData.data[ bO + 3 ];


              //   }
              // }
            }



            // for (i = 0; i < imgData.width * imgData.height * 4; i += 4) {
            //     var r = foregroundVideoData.data[i + 0];
            //     var g = foregroundVideoData.data[i + 1];
            //     var b = foregroundVideoData.data[i + 2];
            //     var a = foregroundVideoData.data[i + 3];

            //     if( isGreenScreen(r,g,b) ){
            //       a = 0;

            //       imgData.data[i + 0] = imgBackgroundData.data[i + 0];
            //       imgData.data[i + 1] = imgBackgroundData.data[i + 1];
            //       imgData.data[i + 2] = imgBackgroundData.data[i + 2];
            //       imgData.data[i + 3] = imgBackgroundData.data[i + 3];
            //     }
            //     if(a != 0){ // draw the foreground image
            //       imgData.data[i + 0] = r;
            //       imgData.data[i + 1] = g;
            //       imgData.data[i + 2] = b;
            //       imgData.data[i + 3] = a;
            //     }
            // }

            
            context.putImageData(imgData, 0, 0);
              
          }


        }
      });





