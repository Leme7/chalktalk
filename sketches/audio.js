function() {
   var _audio_volume = 1;
   this.label = "Audio";
   this.code = [
      ["sin", "sin(TAU*x*time)"],
      ["vibrato", "t = 2*PI * x * time;\nvary = 1 + 7 / max(x, 1);\nreturn sin(t) + sin(vary * t) / 4;"],
      ["sawtooth", "x = x * time % 1.0;\nreturn x / 4;"],
      ["triangle", "x = 2 * x * time % 2;\nx = x < 1 ? x : 2 - x;\nreturn x;"],
      ["square", "x = 2 * x * time % 2;\nx = 2 * floor(x) - 1;\nreturn x / 8;"],
      ["noise", "return 3 * noise(3 * x * time)"],
      ["fractal", "return 3 * fractal(3 * x * time)"],
      ["turbulence", "return 5 * turbulence(3 * x * time) - 1.5"],
   ];
   this.savedCode = "";
   this.savedX = "";
   this.savedY = "";
   this.savedZ = "";

   this.defineInput(AT.Hertz);
   this.defineInput(AT.Float);
   this.defineInput(AT.Float);

   this.onDelete = function() {
      setAudioSignal(function(t) { return 0; });
   }

   this.render = function(elapsed) {
      var cs = isDef(this.selectedIndex) ? this.selectedIndex : 0;
      var t = 1/3;

      m.scale(this.size / 400);

      _audio_volume = pow(Math.min(1.0, this.computePixelSize()), 3);

      mLine([1,1],[1,-1]);
      mCurve([[1,-1],[-t,-t],[-1,-t],[-1,t],[-t,t],[1,1]]);
      if ( this.code[cs][1] != this.savedCode ||
           this.inputs.hasLink(0) && this.inputs.value(0) != this.savedX ||
           this.inputs.hasLink(1) && this.inputs.value(1) != this.savedY ||
           this.inputs.hasLink(2) && this.inputs.value(2) != this.savedZ ) {

         var code = this.savedCode = this.code[cs][1];

         if (this.inputs.hasLink(0)) this.savedX = this.inputs.value(0);
         if (this.inputs.hasLink(1)) this.savedY = this.inputs.value(1);
         if (this.inputs.hasLink(2)) this.savedZ = this.inputs.value(2);

         var var_xyz = "var x=(" + def(this.inputs.value(0)) + ")," +
                           "y=(" + def(this.inputs.value(1)) + ")," +
                           "z=(" + def(this.inputs.value(2)) + ");" ;

         // MAKE SURE THE CODE IS VALID.

         var isError = false;
         try {
            var c = code;
            var i = c.indexOf("return ");
            if (i >= 0)
               c = c.substring(0,i) + c.substring(i+7, c.length);
            eval(var_xyz + c);
         } catch (e) { isError = true; console.log("aha"); }

         // IF IT IS, SEND THE FUNCTION TO THE OUTPUT.

         if (! isError) {
            var i = code.indexOf("return ");
            if (i < 0)
               code = "return " + code;

            window.audioFunction0 = window.audioFunction1;
            window.audioFunction1 = new Function("time", var_xyz + code);

            var audioFunction = function(time) {
               var f1 = audioFunction1(time);
               var t = sCurve(min(1, (audioIndex - audioIndex0) / 1024));
               return _audio_volume * (t == 1 ? f1 : mix(audioFunction0(time), f1, t));
            }

            window.audioIndex0 = audioIndex;
            setAudioSignal(audioFunction);

            this.audioShape = [];
            for (var t = 0 ; t <= 1 ; t += .01)
               this.audioShape.push([2*t-1, audioFunction1(t/100)/TAU]);
         }
      }
      this.afterSketch(function() {
         if (this.audioShape !== undefined) {
            lineWidth(1);
            mCurve(this.audioShape);
         }
      });
   }
}
