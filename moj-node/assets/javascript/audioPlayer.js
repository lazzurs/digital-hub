$(document).ready(function() {
  var audio = $('#audioPlayer');
  var title = audio.data().title;
  var evt25 = once(matomoAudioEvent({ action: '25%', name: title }));
  var evt50 = once(matomoAudioEvent({ action: '50%', name: title }));
  var evt75 = once(matomoAudioEvent({ action: '75%', name: title }));
  var evt90 = once(matomoAudioEvent({ action: '90%', name: title }));

  $('#audioPlayer').videoPlayer({
    name: audio.attr('data-title'),
    media: {
      preload: 'metadata',
      mp3: audio.attr('data-media'),
    },
    timeupdate: function(event) {
      var percentage = Math.round(event.jPlayer.status.currentPercentAbsolute);
      if (percentage >= 25 && percentage < 50) {
        evt25();
      } else if (percentage >= 50 && percentage < 75) {
        evt50();
      } else if (percentage >= 75 && percentage < 90) {
        evt75();
      } else if (percentage >= 90) {
        evt90();
      }
    },
  });

  function matomoAudioEvent(config) {
    return function() {
      if (!_paq) return;
      _paq.push(['trackEvent', 'Radio', config.action, config.name]);
    };
  }

  function once(fn) {
    return function() {
      if (fn.called) return;
      var result = fn.apply(this, arguments);

      fn.called = true;

      return result;
    };
  }
});