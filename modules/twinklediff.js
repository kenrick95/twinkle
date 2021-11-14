// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklediff.js: Diff module
 ****************************************
 * Mode of invocation:     Tab on non-diff pages ("Last"); tabs on diff pages ("Since", "Since mine", "Current")
 * Active on:              Existing non-special pages
 */

Twinkle.diff = function twinklediff() {
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}
	Twinkle.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), {diff: 'cur', oldid: 'prev'}), 'Terakhir', 'tw-lastdiff', 'Tampilkan beda terbaru');

	// Show additional tabs only on diff pages
	if (mw.util.getParamValue('diff')) {
		Twinkle.addPortletLink(function() {
			Twinkle.diff.evaluate(false);
		}, 'Sejak', 'tw-since', 'Lihat perbedaan antara revisi terakhir dan revisi oleh pengguna sebelumnya');
		Twinkle.addPortletLink(function() {
			Twinkle.diff.evaluate(true);
		}, 'Sejak saya', 'tw-sincemine', 'Lihat perbedaan antara revisi terakhir dan revisi terakhir saya');

		var oldid = /oldid=(.+)/.exec($('#mw-diff-ntitle1').find('strong a').first().attr('href'))[1];
		Twinkle.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), {diff: 'cur', oldid: oldid}), 'Saat ini', 'tw-curdiff', 'Perlihatkan beda ke revisi terbaru');
	}
};

Twinkle.diff.evaluate = function twinklediffEvaluate(me) {

	var user;
	if (me) {
		user = mw.config.get('wgUserName');
	} else {
		var node = document.getElementById('mw-diff-ntitle2');
		if (!node) {
			// nothing to do?
			return;
		}
		user = $(node).find('a').first().text();
	}
	var query = {
		'prop': 'revisions',
		'action': 'query',
		'titles': mw.config.get('wgPageName'),
		'rvlimit': 1,
		'rvprop': [ 'ids', 'user' ],
		'rvstartid': mw.config.get('wgCurRevisionId') - 1, // i.e. not the current one
		'rvuser': user
	};
	Morebits.status.init(document.getElementById('mw-content-text'));
	var wikipedia_api = new Morebits.wiki.api('Mengambil data kontributor awal', query, Twinkle.diff.callbacks.main);
	wikipedia_api.params = { user: user };
	wikipedia_api.post();
};

Twinkle.diff.callbacks = {
	main: function(self) {
		var xmlDoc = self.responseXML;
		var revid = $(xmlDoc).find('rev').attr('revid');

		if (!revid) {
			self.statelem.error('tidak ditemukan adanya revisi yang lebih baru, atau ' + self.params.user + ' merupakan satu-satunya kontributor. Membatalkan.');
			return;
		}
		window.location = mw.util.getUrl(mw.config.get('wgPageName'), {
			diff: mw.config.get('wgCurRevisionId'),
			oldid: revid
		});
	}
};
})(jQuery);


// </nowiki>
