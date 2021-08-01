var versePitches = [26, 26, 26, 26, 28, 28, 33];
var chorusPitches = [
  26,
  26,
  26,
  26,
  26,
  26,
  26,
  26,
  26,
  26,
  26,
  26,
  30,
  30,
  30,
  30,
  32,
  37,
  37,
  42,
];

function createSandworm() {
  var sandworm = {
    instrumentsLoaded: false,
    playOnLoad: false,
  };

  sandworm.init = function init() {
    MIDI.loadPlugin({
      soundfontUrl: "./soundfont/",
      instruments: ["acoustic_grand_piano", "acoustic_grand_piano"],
      callback: this.onInstrumentsLoaded.bind(this),
    });
  };

  sandworm.onInstrumentsLoaded = function onInstrumentsLoaded() {
    this.instrumentsLoaded = true;
    if (this.playOnLoad) {
      this.play();
    }
    document.querySelector("#message").innerText = "Instruments loaded.";
    document
      .getElementById("play-button")
      .addEventListener("click", this.play.bind(this)); // This is why I stopped using this.
  };

  sandworm.play = function play() {
    var delays = [0, 0]; // One per channel.

    function playNote(note, channel) {
      MIDI.noteOn(channel, note.pitch, note.velocity, delays[channel]);
      // MIDI.noteOff(channel, note.pitch, delays[channel] + note.duration);

      delays[channel] += note.duration;
    }

    //var spewerE = createRiffSpewer({
    //beatSpan: 16, //512,
    //beatWobble: 0,
    //rootPitch: 28, // E
    //pitchRange: [28, 28 + 48],
    //durationRange: [1, 4],
    //pitchTransformer: majorKeyFitter(28),
    //});
    //
    //var spewerA = createRiffSpewer({
    //beatSpan: 16, //512,
    //beatWobble: 0,
    //rootPitch: 33, // A
    //pitchRange: [33 - 24, 33 + 12],
    //durationRange: [1, 4],
    //pitchTransformer: majorKeyFitter(33),
    //});
    //
    //var spewerB = createRiffSpewer({
    //beatSpan: 16, //512,
    //beatWobble: 0,
    //rootPitch: 35 + 24, // B
    //pitchRange: [35 - 12, 35 + 24],
    //durationRange: [1, 4],
    //pitchTransformer: majorKeyFitter(35),
    //});
    //

    var spewerVerse = createRiffSpewer({
      beatSpan: 12,
      beatWobble: 0,
      pitchChoices: versePitches,
      durationRange: [60 / 160 / 4, 0],
      pitchTransformer: Shift(12),
    });

    var spewerVerseHigh = createRiffSpewer({
      beatSpan: 12,
      beatWobble: 0,
      pitchChoices: versePitches,
      durationRange: [60 / 160 / 4, 0],
      pitchTransformer: Shift(19),
    });

    var spewerChorus = createRiffSpewer({
      beatSpan: 8,
      beatWobble: 0,
      pitchChoices: chorusPitches,
      durationRange: [60 / 160 / 2, 0],
    });

    var spewerRandOctaveChorus = createRiffSpewer({
      beatSpan: 8,
      beatWobble: 0,
      pitchChoices: chorusPitches,
      durationRange: [60 / 160 / 2, 0],
      pitchTransformer: randomOctave,
    });

    var spewerHighChorus = createRiffSpewer({
      beatSpan: 8,
      beatWobble: 0,
      pitchChoices: chorusPitches,
      durationRange: [60 / 160 / 2, 0],
      pitchTransformer: Shift(12),
    });

    var spewerLongNote = createRiffSpewer({
      beatSpan: 1,
      pitchChoices: [26],
      beatWobble: 0,
      durationRange: [(160 / 60) * 8, 0],
    });

    var spewerQueue = [
      {
        spewer1: spewerChorus,
        spewer2: spewerChorus,
      },
      { spewer1: spewerLongNote },
      {
        spewer1: spewerVerse,
        spewer2: spewerVerse,
      },
      {
        spewer1: spewerChorus,
        spewer2: spewerChorus,
      },
      {
        spewer1: spewerVerse,
        spewer2: spewerRandOctaveChorus,
      },
      {
        spewer1: spewerVerse,
        spewer2: spewerVerseHigh,
      },
      {
        spewer1: spewerChorus,
        spewer2: spewerHighChorus,
      },
    ];

    if (!this.instrumentsLoaded) {
      this.playOnLoad = true;
      return;
    }

    this.playOnLoad = false;

    var songRepsQueued = 0;

    function playRep() {
      for (
        var spewerIndex = 0;
        spewerIndex < spewerQueue.length;
        ++spewerIndex
      ) {
        var spewer1 = spewerQueue[spewerIndex].spewer1;
        var spewer2 = spewerQueue[spewerIndex].spewer2;

        for (var spewerRep = 0; spewerRep < 2; ++spewerRep) {
          var riff = spewer1.spew();
          var riff2 = null;
          if (spewer2) {
            riff2 = spewer2.spew();
          }

          for (var riffRep = 0; riffRep < 4; ++riffRep) {
            for (var noteIndex = 0; noteIndex < riff.length; ++noteIndex) {
              var note1 = riff[noteIndex];
              playNote(note1, 0);
              if (riff2 && noteIndex < riff2.length) {
                let note2 = riff2[noteIndex];
                playNote(note2, 1);
              }
            }
          }
        }
      }

      ++songRepsQueued;
    }

    playRep();
  };

  // scale should have an entry for all 12 half-steps, each either null or not
  // null.
  function findClosest(scale, pitch) {
    var closest = null;
    for (var i = pitch; i >= 0; --i) {
      if (scale[i] !== null) {
        closest = i;
        break;
      }
    }

    return closest !== null ? closest : pitch;
  }

  function fitToPitch(pitch, scale) {
    var offset = pitch % 12;
    var base = ~~(pitch / 12) * 12;
    var newOffset = findClosest(scale, offset);
    // console.log('In:', offset, 'Out:', newOffset);
    return base + newOffset;
  }

  // Just fits notes to the key – cannot do anything about whether the tonic
  // dominates.
  function majorKeyFitter(tonic) {
    // 0, 2, 4, 5, 7, 9, 11
    var scale = [0, null, 2, null, 4, 5, null, 7, null, 9, null, 11];
    // Shift it to the tonic.
    var tonicMod = tonic % 12;
    scale = scale.concat(scale.splice(0, tonicMod));

    function fitToMajorKey(pitch) {
      return fitToPitch(pitch, scale);
    }

    return fitToMajorKey;
  }

  function Shift(delta) {
    return shift;

    function shift(pitch) {
      return pitch + delta;
    }
  }

  function randomOctave(pitch) {
    return pitch + 12 * (Math.floor(Math.random() * 3) + 1);
  }

  return sandworm;
}

var sandworm = createSandworm();
sandworm.init();
