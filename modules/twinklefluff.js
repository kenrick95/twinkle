// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklefluff.js: Revert/rollback module
 ****************************************
 * Mode of invocation:     Links on contributions, recent changes, history, and diff pages
 * Active on:              Diff pages, history pages, Special:RecentChanges(Linked),
                           and Special:Contributions
 */

/**
 Twinklefluff revert and antivandalism utility
 */

Twinkle.fluff = function twinklefluff() {
	// A list of usernames, usually only bots, that vandalism revert is jumped over; that is,
	// if vandalism revert was chosen on such username, then its target is on the revision before.
	// This is for handling quick bots that makes edits seconds after the original edit is made.
	// This only affects vandalism rollback; for good faith rollback, it will stop, indicating a bot
	// has no faith, and for normal rollback, it will rollback that edit.
	Twinkle.fluff.whiteList = [
		'AnomieBOT',
		'SineBot'
	];

	if (mw.config.get('wgIsProbablyEditable')) {
		// Only proceed if the user can actually edit the page
		// in question (ignored for contributions, see #632).
		// wgIsProbablyEditable should take care of
		// namespace/contentModel restrictions as well as
		// explicit protections; it won't take care of
		// cascading or TitleBlacklist restrictions
		if (mw.config.get('wgDiffNewId') || mw.config.get('wgDiffOldId')) { // wgDiffOldId included for clarity in if else loop [[phab:T214985]]
			mw.hook('wikipage.diff').add(function () { // Reload alongside the revision slider
				Twinkle.fluff.addLinks.diff();
			});
		} else if (mw.config.get('wgAction') === 'view' && mw.config.get('wgCurRevisionId') !== mw.config.get('wgRevisionId')) {
			Twinkle.fluff.addLinks.oldid();
		} else if (mw.config.get('wgAction') === 'history') {
			Twinkle.fluff.addLinks.history();
		}
	} else if (mw.config.get('wgNamespaceNumber') === -1) {
		Twinkle.fluff.skipTalk = !Twinkle.getPref('openTalkPageOnAutoRevert');
		Twinkle.fluff.rollbackInPlace = Twinkle.getPref('rollbackInPlace');

		if (mw.config.get('wgCanonicalSpecialPageName') === 'Contributions') {
			Twinkle.fluff.addLinks.contributions();
		} else if (mw.config.get('wgCanonicalSpecialPageName') === 'Recentchanges' || mw.config.get('wgCanonicalSpecialPageName') === 'Recentchangeslinked') {
			// Reload with recent changes updates
			// structuredChangeFilters.ui.initialized is just on load
			mw.hook('wikipage.content').add(function(item) {
				if (item.is('div')) {
					Twinkle.fluff.addLinks.recentchanges();
				}
			});
		}
	}
};

Twinkle.fluff.skipTalk = null;
Twinkle.fluff.rollbackInPlace = null;

// Consolidated construction of fluff links
Twinkle.fluff.linkBuilder = {
	spanTag: function(color, content) {
		var span = document.createElement('span');
		span.style.color = color;
		span.appendChild(document.createTextNode(content));
		return span;
	},

	buildLink: function(color, text) {
		var link = document.createElement('a');
		link.appendChild(Twinkle.fluff.linkBuilder.spanTag('Black', '['));
		link.appendChild(Twinkle.fluff.linkBuilder.spanTag(color, text));
		link.appendChild(Twinkle.fluff.linkBuilder.spanTag('Black', ']'));
		link.href = '#';
		return link;
	},

	/**
	 * @param {string} vandal - Username of the editor being reverted (required)
	 * @param {boolean} inline - True to create two links in a span, false
	 * to create three links in a div (optional)
	 * @param {number|string} [rev=wgCurRevisionId] - Revision ID being reverted (optional)
	 * @param {string} [page=wgPageName] - Page being reverted (optional)
	 */
	rollbackLinks: function(vandal, inline, rev, page) {
		var elem = inline ? 'span' : 'div';
		var revNode = document.createElement(elem);

		rev = parseInt(rev, 10);
		if (rev) {
			revNode.setAttribute('id', 'tw-revert' + rev);
		} else {
			revNode.setAttribute('id', 'tw-revert');
		}

		var normNode = document.createElement('strong');
		var vandNode = document.createElement('strong');

		var normLink = Twinkle.fluff.linkBuilder.buildLink('SteelBlue', 'kembalikan');
		var vandLink = Twinkle.fluff.linkBuilder.buildLink('Red', 'vandalisme');

		$(normLink).click(function() {
			Twinkle.fluff.revert('norm', vandal, rev, page);
			Twinkle.fluff.disableLinks(revNode);
		});
		$(vandLink).click(function() {
			Twinkle.fluff.revert('vand', vandal, rev, page);
			Twinkle.fluff.disableLinks(revNode);
		});

		vandNode.appendChild(vandLink);
		normNode.appendChild(normLink);

		var separator = inline ? ' ' : ' || ';

		if (!inline) {
			var agfNode = document.createElement('strong');
			var agfLink = Twinkle.fluff.linkBuilder.buildLink('DarkOliveGreen', 'kembalikan (AGF)');
			$(agfLink).click(function() {
				Twinkle.fluff.revert('agf', vandal, rev, page);
				// Twinkle.fluff.disableLinks(revNode); // rollbackInPlace not relevant for any inline situations
			});
			agfNode.appendChild(agfLink);
			revNode.appendChild(agfNode);
		}
		revNode.appendChild(document.createTextNode(separator));
		revNode.appendChild(normNode);
		revNode.appendChild(document.createTextNode(separator));
		revNode.appendChild(vandNode);

		return revNode;

	},

	// Build [restore this revision] links
	restoreThisRevisionLink: function(revisionRef, inline) {
		// If not a specific revision number, should be wgDiffNewId/wgDiffOldId/wgRevisionId
		revisionRef = typeof revisionRef === 'number' ? revisionRef : mw.config.get(revisionRef);

		var elem = inline ? 'span' : 'div';
		var revertToRevisionNode = document.createElement(elem);

		revertToRevisionNode.setAttribute('id', 'tw-revert-to-' + revisionRef);
		revertToRevisionNode.style.fontWeight = 'bold';

		var revertToRevisionLink = Twinkle.fluff.linkBuilder.buildLink('SaddleBrown', 'kembalikan revisi ini');
		$(revertToRevisionLink).click(function() {
			Twinkle.fluff.revertToRevision(revisionRef);
		});

		if (inline) {
			revertToRevisionNode.appendChild(document.createTextNode(' '));
		}
		revertToRevisionNode.appendChild(revertToRevisionLink);
		return revertToRevisionNode;
	}
};


Twinkle.fluff.addLinks = {
	contributions: function() {
		// $('sp-contributions-footer-anon-range') relies on the fmbox
		// id in [[MediaWiki:Sp-contributions-footer-anon-range]] and
		// is used to show rollback/vandalism links for IP ranges
		if (mw.config.exists('wgRelevantUserName') || !!$('#sp-contributions-footer-anon-range')[0]) {
			// Get the username these contributions are for
			var username = mw.config.get('wgRelevantUserName');
			if (Twinkle.getPref('showRollbackLinks').indexOf('contribs') !== -1 ||
				(mw.config.get('wgUserName') !== username && Twinkle.getPref('showRollbackLinks').indexOf('others') !== -1) ||
				(mw.config.get('wgUserName') === username && Twinkle.getPref('showRollbackLinks').indexOf('mine') !== -1)) {
				var list = $('#mw-content-text').find('ul li:has(span.mw-uctop):has(.mw-changeslist-diff)');

				list.each(function(key, current) {
					// revid is also available in the href of both
					// .mw-changeslist-date or .mw-changeslist-diff
					var page = $(current).find('.mw-contributions-title').text();
					current.appendChild(Twinkle.fluff.linkBuilder.rollbackLinks(username, true, current.dataset.mwRevid, page));
				});
			}
		}
	},

	recentchanges: function() {
		if (Twinkle.getPref('showRollbackLinks').indexOf('recent') !== -1) {
			// Latest and revertable (not page creations, logs, categorizations, etc.)
			var list = $('.mw-changeslist .mw-changeslist-last.mw-changeslist-src-mw-edit');
			// Exclude top-level header if "group changes" preference is used
			// and find only individual lines or nested lines
			list = list.not('.mw-rcfilters-ui-highlights-enhanced-toplevel').find('.mw-changeslist-line-inner, td.mw-enhanced-rc-nested');

			list.each(function(key, current) {
				var vandal = $(current).find('.mw-userlink').text();
				var href = $(current).find('.mw-changeslist-diff').attr('href');
				var rev = mw.util.getParamValue('diff', href);
				var page = current.dataset.targetPage;
				current.appendChild(Twinkle.fluff.linkBuilder.rollbackLinks(vandal, true, rev, page));
			});
		}
	},

	history: function() {
		if (Twinkle.getPref('showRollbackLinks').indexOf('history') !== -1) {
			// All revs
			var histList = $('#pagehistory li').toArray();

			// On first page of results, so add revert/rollback
			// links to the top revision
			if (!$('.mw-firstlink').length) {
				var first = histList.shift();
				var vandal = first.querySelector('.mw-userlink').text;

				first.appendChild(Twinkle.fluff.linkBuilder.rollbackLinks(vandal, true));
			}

			// oldid
			histList.forEach(function(rev) {
				// From restoreThisRevision, non-transferable

				var href = rev.querySelector('.mw-changeslist-date').href;
				var oldid = parseInt(mw.util.getParamValue('oldid', href), 10);

				rev.appendChild(Twinkle.fluff.linkBuilder.restoreThisRevisionLink(oldid, true));
			});


		}
	},

	diff: function() {
		// Autofill user talk links on diffs with vanarticle for easy warning, but don't autowarn
		var warnFromTalk = function(xtitle) {
			var talkLink = $('#mw-diff-' + xtitle + '2 .mw-usertoollinks a').first();
			if (talkLink.length) {
				var extraParams = 'vanarticle=' + mw.util.rawurlencode(Morebits.pageNameNorm) + '&' + 'noautowarn=true';
				// diffIDs for vanarticlerevid
				extraParams += '&vanarticlerevid=';
				extraParams += xtitle === 'otitle' ? mw.config.get('wgDiffOldId') : mw.config.get('wgDiffNewId');

				var href = talkLink.attr('href');
				if (href.indexOf('?') === -1) {
					talkLink.attr('href', href + '?' + extraParams);
				} else {
					talkLink.attr('href', href + '&' + extraParams);
				}
			}
		};

		// Older revision
		warnFromTalk('otitle'); // Add quick-warn link to user talk link
		// Don't load if there's a single revision or weird diff (cur on latest)
		if (mw.config.get('wgDiffOldId') && (mw.config.get('wgDiffOldId') !== mw.config.get('wgDiffNewId'))) {
			// Add a [restore this revision] link to the older revision
			var oldTitle = document.getElementById('mw-diff-otitle1').parentNode;
			oldTitle.insertBefore(Twinkle.fluff.linkBuilder.restoreThisRevisionLink('wgDiffOldId'), oldTitle.firstChild);
		}

		// Newer revision
		warnFromTalk('ntitle'); // Add quick-warn link to user talk link
		// Add either restore or rollback links to the newer revision
		// Don't show if there's a single revision or weird diff (prev on first)
		if (document.getElementById('differences-nextlink')) {
			// Not latest revision, add [restore this revision] link to newer revision
			var newTitle = document.getElementById('mw-diff-ntitle1').parentNode;
			newTitle.insertBefore(Twinkle.fluff.linkBuilder.restoreThisRevisionLink('wgDiffNewId'), newTitle.firstChild);
		} else if (Twinkle.getPref('showRollbackLinks').indexOf('diff') !== -1 && mw.config.get('wgDiffOldId') && (mw.config.get('wgDiffOldId') !== mw.config.get('wgDiffNewId') || document.getElementById('differences-prevlink'))) {
			var vandal = $('#mw-diff-ntitle2').find('a').first().text();
			var ntitle = document.getElementById('mw-diff-ntitle1').parentNode;

			ntitle.insertBefore(Twinkle.fluff.linkBuilder.rollbackLinks(vandal), ntitle.firstChild);
		}
	},

	oldid: function() { // Add a [restore this revision] link on old revisions
		var title = document.getElementById('mw-revision-info').parentNode;
		title.insertBefore(Twinkle.fluff.linkBuilder.restoreThisRevisionLink('wgRevisionId'), title.firstChild);
	}
};

Twinkle.fluff.disableLinks = function disablelinks(parentNode) {
	// Array.from not available in IE11 :(
	$(parentNode).children().each(function(_ix, node) {
		node.innerHTML = node.textContent; // Feels like cheating
		$(node).css('font-weight', 'normal').css('color', 'darkgray');
	});
};


Twinkle.fluff.revert = function revertPage(type, vandal, rev, page) {
	if (mw.util.isIPv6Address(vandal)) {
		vandal = Morebits.sanitizeIPv6(vandal);
	}

	var pagename = page || mw.config.get('wgPageName');
	var revid = rev || mw.config.get('wgCurRevisionId');

	if (Twinkle.fluff.rollbackInPlace) {
		var notifyStatus = document.createElement('span');
		mw.notify(notifyStatus, {
			autoHide: false,
			title: 'Rollback on ' + page,
			tag: 'twinklefluff_' + rev // Shouldn't be necessary given disableLink
		});
		Morebits.status.init(notifyStatus);
	} else {
		Morebits.status.init(document.getElementById('mw-content-text'));
		$('#catlinks').remove();
	}

	var params = {
		type: type,
		user: vandal,
		pagename: pagename,
		revid: revid
	};
	var query = {
		'action': 'query',
		'prop': ['info', 'revisions', 'flagged'],
		'titles': pagename,
		'intestactions': 'edit',
		'rvlimit': 50, // intentionally limited
		'rvprop': [ 'ids', 'timestamp', 'user', 'comment' ],
		'curtimestamp': '',
		'meta': 'tokens',
		'type': 'csrf'
	};
	var wikipedia_api = new Morebits.wiki.api('Mengambil data revisi yang lebih awal', query, Twinkle.fluff.callbacks.main);
	wikipedia_api.params = params;
	wikipedia_api.post();
};

Twinkle.fluff.revertToRevision = function revertToRevision(oldrev) {

	Morebits.status.init(document.getElementById('mw-content-text'));

	var query = {
		'action': 'query',
		'prop': ['info', 'revisions'],
		'titles': mw.config.get('wgPageName'),
		'rvlimit': 1,
		'rvstartid': oldrev,
		'rvprop': [ 'ids', 'timestamp', 'user', 'comment' ],
		'format': 'xml',
		'curtimestamp': '',
		'meta': 'tokens',
		'type': 'csrf'
	};
	var wikipedia_api = new Morebits.wiki.api('Mengambil data revisi yang lebih awal', query, Twinkle.fluff.callbacks.toRevision);
	wikipedia_api.params = { rev: oldrev };
	wikipedia_api.post();
};

Twinkle.fluff.userIpLink = function(user) {
	return (mw.util.isIPAddress(user) ? '[[Special:Contributions/' : '[[:User:') + user + '|' + user + ']]';
};

Twinkle.fluff.callbacks = {
	toRevision: function(apiobj) {
		var xmlDoc = apiobj.responseXML;

		var lastrevid = parseInt($(xmlDoc).find('page').attr('lastrevid'), 10);
		var touched = $(xmlDoc).find('page').attr('touched');
		var loadtimestamp = $(xmlDoc).find('api').attr('curtimestamp');
		var csrftoken = $(xmlDoc).find('tokens').attr('csrftoken');
		var revertToRevID = parseInt($(xmlDoc).find('rev').attr('revid'), 10);
		var revertToUser = $(xmlDoc).find('rev').attr('user');

		if (revertToRevID !== apiobj.params.rev) {
			apiobj.statelem.error('Revisi yang diambil tidak cocok dengan revisi yang diminta. Menghentikan pengembalian.');
			return;
		}

		var optional_summary = prompt('Mohon beri alasan pengembalian:                                ', '');  // padded out to widen prompt in Firefox
		if (optional_summary === null) {
			apiobj.statelem.error('Dibatalkan oleh pengguna.');
			return;
		}
		var summary = Twinkle.fluff.formatSummary('Dikembalikan ke revisi ' + revertToRevID + ' oleh $USER', revertToUser, optional_summary);

		var query = {
			'action': 'edit',
			'title': mw.config.get('wgPageName'),
			'summary': summary,
			'token': csrftoken,
			'undo': lastrevid,
			'undoafter': revertToRevID,
			'basetimestamp': touched,
			'starttimestamp': loadtimestamp,
			'watchlist': Twinkle.getPref('watchRevertedPages').indexOf('torev') !== -1 ? 'watch' : undefined,
			'minor': Twinkle.getPref('markRevertedPagesAsMinor').indexOf('torev') !== -1 ? true : undefined
		};

		Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
		Morebits.wiki.actionCompleted.notice = 'Pengembalian selesai';

		var wikipedia_api = new Morebits.wiki.api('Menyimpan konten yang dikembalikan', query, Twinkle.fluff.callbacks.complete, apiobj.statelem);
		wikipedia_api.params = apiobj.params;
		wikipedia_api.post();

	},
	main: function(apiobj) {
		var xmlDoc = apiobj.responseXML;

		if (typeof $(xmlDoc).find('actions').attr('edit') === 'undefined') {
			self.statelem.error("Tidak bisa menyunting halaman, kemungkinan dilindungi.");
			return;
		}

		var lastrevid = parseInt($(xmlDoc).find('page').attr('lastrevid'), 10);
		var touched = $(xmlDoc).find('page').attr('touched');
		var loadtimestamp = $(xmlDoc).find('api').attr('curtimestamp');
		var csrftoken = $(xmlDoc).find('tokens').attr('csrftoken');
		var lastuser = $(xmlDoc).find('rev').attr('user');

		var revs = $(xmlDoc).find('rev');

		var statelem = apiobj.statelem;
		var params = apiobj.params;

		if (revs.length < 1) {
			statelem.error('Tidak memiliki satu pun revisi tambahan, sehingga tidak mungkin untuk dikembalikan.');
			return;
		}
		var top = revs[0];
		if (lastrevid < params.revid) {
			Morebits.status.error('Error', [ 'Penanda revisi terakhir yang diperoleh dari peladen, ', Morebits.htmlNode('strong', lastrevid), ', kurang dari penanda revisi yang saat ini ditampilkan. Ini menandakan bahwa revisi saat ini sudah dihapus, peladen sedang tersendat, atau data buruk yang diterima. Proses aka dihentikan.' ]);
			return;
		}
		var index = 1;
		if (params.revid !== lastrevid) {
			Morebits.status.warn('Peringatan', [ 'Revisi terakhir ', Morebits.htmlNode('strong', lastrevid), ' tidak sesuai dengan revisi kami ', Morebits.htmlNode('strong', self.params.revid) ]);
			if (lastuser === params.user) {
				switch (params.type) {
					case 'vand':
						Morebits.status.info('Informasi', [ 'Revisi terakhir dibuat oleh ', Morebits.htmlNode('strong', self.params.user), '. Karena dianggap sebagai vandalisme, kami lanjutkan pengembaliannya.' ]);
						break;
					case 'agf':
						Morebits.status.warn('Warning', [ 'Revisi terakhir dibuat oleh ', Morebits.htmlNode('strong', self.params.user), '. Karena dianggap sebagai niat baik, pengembalian ini dihentikan, di mana masalah mungkin dapat diatasi.' ]);
						return;
					default:
						Morebits.status.warn('Perhatian', [ 'Revisi terakhir dibuat oleh ', Morebits.htmlNode('strong', self.params.user), ', namun kami akan menghentikan proses pengembalian.' ]);
						return;
				}
			} else if (params.type === 'vand' &&
					Twinkle.fluff.whiteList.indexOf(top.getAttribute('user')) !== -1 && revs.length > 1 &&
					revs[1].getAttribute('pageId') === params.revid) {
				Morebits.status.info('Informasi', [ 'Revisi terakhir dibuat oleh ', Morebits.htmlNode('strong', lastuser), ', bot yang tepercaya, dan revisi sebelumnya dibuat oleh pengguna vandalisme, pengembalian dilanjutkan.' ]);
				index = 2;
			} else {
				Morebits.status.error('Galat', [ 'Revisi terakhir dibuat oleh ', Morebits.htmlNode('strong', lastuser), ', sehingga mungkin telah dikembalikan, akan menghentikan pengembalian ini.']);
				return;
			}

		}

		if (Twinkle.fluff.whiteList.indexOf(params.user) !== -1) {
			switch (params.type) {
				case 'vand':
					Morebits.status.info('Info', [ 'Pengembalian vandalisme dipilih pada ', Morebits.htmlNode('strong', params.user), '. Karena bot ini masuk daftar putih, kami menganggap Anda akan mengembalikan vandalisme yang dibuat oleh pengguna sebelumnya.' ]);
					index = 2;
					params.user = revs[1].getAttribute('user');
					break;
				case 'agf':
					Morebits.status.warn('Pemberitahuan', [ 'Pengembalian dengan niat baik dipilih pada ', Morebits.htmlNode('strong', params.user), '. Ini adalah bot yang masuk daftar putih, dan karena bot tidak punya niat, pengembalian ANB tidak dilanjutkan.' ]);
					return;
				case 'norm':
				/* falls through */
				default:
					var cont = confirm('Pengembalian normal sudah dipilih, namun suntingan terakhir dibuat oleh bot yang masuk daftar putih (' + params.user + '). Ingin melanjutkan revisi sebelumnya saja?');
					if (cont) {
						Morebits.status.info('Info', [ 'Pengembalian normal dipilih pada ', Morebits.htmlNode('strong', params.user), '. Ini adalah bot daftar putih, dan dengan konfirmasi, kami akan mengembalikan revisi sebelumnya saja.' ]);
						index = 2;
						params.user = revs[1].getAttribute('user');
					} else {
						Morebits.status.warn('Pemberitahuan', [ 'Pengembalian normal dipilih pada ', Morebits.htmlNode('strong', params.user), '. Ini adalah bot daftar putih, namun dengan konfirmasi, pengembalian revisi atas akan diproses.' ]);
					}
					break;
			}
		}
		var found = false;
		var count = 0;

		for (var i = index; i < revs.length; ++i) {
			++count;
			if (revs[i].getAttribute('user') !== params.user) {
				found = i;
				break;
			}
		}

		if (!found) {
			statelem.error([ 'Tidak dapat ditemukan revisi sebelumnya. Mungkin ', Morebits.htmlNode('strong', params.user), ' adalah satu-satunya penyunting, atau pengguna tersebut telah melakukan ' + Twinkle.getPref('revertMaxRevisions') + ' suntingan berturut-turut.' ]);
			return;
		}

		if (!count) {
			Morebits.status.error('Galat', 'Tidak bisa membatalkan nol revisi. Ini mungkin dikarenakan revisi tersebut telah dibatalkan namun penanda revisi masih tetap sama.');
			return;
		}

		var good_revision = revs[found];
		var userHasAlreadyConfirmedAction = false;
		if (params.type !== 'vand' && count > 1) {
			if (!confirm(params.user + ' telah melakukan ' + count + ' suntingan berturut-turut. Apakah Anda yakin mau membatalkan semuanya?')) {
				Morebits.status.info('Notice', 'Menghentikan pembatalan.');
				return;
			}
			userHasAlreadyConfirmedAction = true;
		}

		params.count = count;

		params.goodid = good_revision.getAttribute('revid');
		params.gooduser = good_revision.getAttribute('user');

		statelem.status([ ' revisi ', Morebits.htmlNode('strong', params.goodid), ' yang dilakukan ', Morebits.htmlNode('strong', count), ' suntingan yang lalu oleh ', Morebits.htmlNode('strong', params.gooduser) ]);

		var summary, extra_summary;
		switch (params.type) {
			case 'agf':
				extra_summary = prompt('Komentar tambahan untuk ringkasan suntingan:                              ', '');  // padded out to widen prompt in Firefox
				if (extra_summary === null) {
					statelem.error('Dibatalkan oleh pengguna.');
					return;
				}
				userHasAlreadyConfirmedAction = true;

				summary = Twinkle.fluff.formatSummary('Membatalkan suntingan [[WP:ANB|berniat baik]] oleh $USER', params.user, extra_summary);
				break;

			case 'vand':

				summary = 'Membatalkan ' + params.count + (params.count > 1 ? ' suntingan' : ' suntingan') + ' oleh [[Special:Contributions/' +
				params.user + '|' + params.user + ']] ([[User talk:' + params.user + '|bicara]]) ke revisi terakhir oleh ' +
				params.gooduser + Twinkle.getPref('summaryAd');
				break;

			case 'norm':
			/* falls through */
			default:
				if (Twinkle.getPref('offerReasonOnNormalRevert')) {
					extra_summary = prompt('Komentar tambahan untuk ringkasan suntingan:                              ', '');  // padded out to widen prompt in Firefox
					if (extra_summary === null) {
						statelem.error('Dibatalkan oleh pengguna.');
						return;
					}
					userHasAlreadyConfirmedAction = true;
				}

				summary = Twinkle.fluff.formatSummary('Membatalkan ' + params.count + (params.count > 1 ? ' edits' : ' edit') +
				' by $USER', params.user, extra_summary);
				break;
		}

		if (Twinkle.getPref('confirmOnFluff') && !userHasAlreadyConfirmedAction && !confirm('Membatalkan halaman: Anda yakin?')) {
			statelem.error('Dibatalkan oleh pengguna.');
			return;
		}

		// Decide whether to notify the user on success
		if (!Twinkle.fluff.skipTalk && Twinkle.getPref('openTalkPage').indexOf(params.type) !== -1 &&
				mw.config.get('wgUserName') !== params.user) {
			params.notifyUser = true;
		}

		// figure out whether we need to/can review the edit
		var $flagged = $(xmlDoc).find('flagged');
		if ((Morebits.userIsInGroup('reviewer') || Morebits.userIsSysop) &&
				$flagged.length &&
				$flagged.attr('stable_revid') >= params.goodid &&
				$flagged.attr('pending_since')) {
			params.reviewRevert = true;
			params.csrftoken = csrftoken;
		}

		var query = {
			'action': 'edit',
			'title': params.pagename,
			'summary': summary,
			'token': csrftoken,
			'undo': lastrevid,
			'undoafter': params.goodid,
			'basetimestamp': touched,
			'starttimestamp': loadtimestamp,
			'watchlist': Twinkle.getPref('watchRevertedPages').indexOf(params.type) !== -1 ? 'watch' : undefined,
			'minor': Twinkle.getPref('markRevertedPagesAsMinor').indexOf(params.type) !== -1 ? true : undefined
		};

		if (!Twinkle.fluff.rollbackInPlace) {
			Morebits.wiki.actionCompleted.redirect = params.pagename;
		}
		Morebits.wiki.actionCompleted.notice = 'Pembatalan selesai';

		var wikipedia_api = new Morebits.wiki.api('Menyimpan isi yang telah dibatalkan', query, Twinkle.fluff.callbacks.complete, statelem);
		wikipedia_api.params = params;
		wikipedia_api.post();

	},
	complete: function (apiobj) {
		// TODO Most of this is copy-pasted from Morebits.wiki.page#fnSaveSuccess. Unify it
		var xml = apiobj.getXML();
		var $edit = $(xml).find('edit');

		if ($(xml).find('captcha').length > 0) {
			apiobj.statelem.error('Could not rollback, because the wiki server wanted you to fill out a CAPTCHA.');
		} else if ($edit.attr('nochange') === '') {
			apiobj.statelem.error('Revisi yang dibatalkan sama dengan revisi terakhir: Tidak ada yang dapat dilakukan.');
		} else {
			apiobj.statelem.info('done');
			var params = apiobj.params;

			if (params.notifyUser) { // Only from main, not from toRevision
				Morebits.status.info('Info', [ 'Opening user talk page edit form for user ', Morebits.htmlNode('strong', params.user) ]);

				var windowQuery = {
					'title': 'User talk:' + params.user,
					'action': 'edit',
					'preview': 'yes',
					'vanarticle': params.pagename.replace(/_/g, ' '),
					'vanarticlerevid': params.revid,
					'vanarticlegoodrevid': params.goodid,
					'type': params.type,
					'count': params.count
				};

				switch (Twinkle.getPref('userTalkPageMode')) {
					case 'tab':
						window.open(mw.util.getUrl('', windowQuery), '_blank');
						break;
					case 'blank':
						window.open(mw.util.getUrl('', windowQuery), '_blank',
							'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800');
						break;
					case 'window':
					/* falls through */
					default:
						window.open(mw.util.getUrl('', windowQuery),
							window.name === 'twinklewarnwindow' ? '_blank' : 'twinklewarnwindow',
							'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800');
						break;
				}
			}


			// review the revert, if needed
			if (apiobj.params.reviewRevert) {
				var query = {
					'action': 'review',
					'revid': $edit.attr('newrevid'),
					'token': apiobj.params.csrftoken,
					'comment': Twinkle.getPref('summaryAd').trim()
				};
				var wikipedia_api = new Morebits.wiki.api('Secara otomatis menerima suntingan Anda', query);
				wikipedia_api.post();
			}
		}
	}
};

// builtInString should contain the string "$USER", which will be replaced
// by an appropriate user link
Twinkle.fluff.formatSummary = function(builtInString, userName, userString) {
	var result = builtInString;

	// append user's custom reason
	if (userString) {
		result += ': ' + Morebits.string.toUpperCaseFirstChar(userString);
	}
	result += Twinkle.getPref('summaryAd');

	// find number of UTF-8 bytes the resulting string takes up, and possibly add
	// a contributions or contributions+talk link if it doesn't push the edit summary
	// over the 255-byte limit
	var resultLen = unescape(encodeURIComponent(result.replace('$USER', ''))).length;
	var contribsLink = '[[Special:Contributions/' + userName + '|' + userName + ']]';
	var contribsLen = unescape(encodeURIComponent(contribsLink)).length;
	if (resultLen + contribsLen <= 255) {
		var talkLink = ' ([[User talk:' + userName + '|bicara]])';
		if (resultLen + contribsLen + unescape(encodeURIComponent(talkLink)).length <= 255) {
			result = Morebits.string.safeReplace(result, '$USER', contribsLink + talkLink);
		} else {
			result = Morebits.string.safeReplace(result, '$USER', contribsLink);
		}
	} else {
		result = Morebits.string.safeReplace(result, '$USER', userName);
	}

	return result;
};
})(jQuery);


// </nowiki>
