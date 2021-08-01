function createRiffSpewer(riffOpts) {
  /*
riffOpts should contain: {
  beatSpan: number,
  beatWobble: number,
  rootPitch: number,
  pitchRange: [],
  pitchChoices: [], // Instead of rootPitch and pitchRange
  durationRange: []

  // Optional:
  pitchTransformer: function
}
*/

  var riffSpewer = {
    opts: riffOpts,
  };

  riffSpewer.spew = function spew() {
    var riff = [];
    var durationRangeLength =
      this.opts.durationRange[1] - this.opts.durationRange[0] + 1;

    for (var i = 0; i <= this.opts.beatSpan; ++i) {
      var pitch;
      if (this.opts.pitchChoices) {
        pitch = this.opts.pitchChoices[
          Math.floor(Math.random() * this.opts.pitchChoices.length)
        ];
      } else {
        let noteRangeLength =
          this.opts.pitchRange[1] - this.opts.pitchRange[0] + 1;
        pitch =
          Math.floor(Math.random() * noteRangeLength) + this.opts.pitchRange[0];
      }

      if (this.opts.pitchTransformer) {
        pitch = this.opts.pitchTransformer(pitch);
      }

      riff.push({
        pitch: pitch,
        //duration: 1.0 / 4,
        duration:
          Math.floor(Math.random() * durationRangeLength) +
          this.opts.durationRange[0],
        velocity: 127,
      });
    }
    return riff;
  };

  return riffSpewer;
}
