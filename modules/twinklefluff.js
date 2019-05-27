//<nowiki>


(function($){


/*
 ****************************************
 *** twinklefluff.js: Revert/rollback module
 ****************************************
 * Mode of invocation:     Links on history, contributions, and diff pages
 * Active on:              Diff pages, history pages, contributions pages
 * Config directives in:   TwinkleConfig
 */

/**
 Twinklefluff revert and antivandalism utility
 */

Twinkle.fluff = {
	spanTag: function( color, content ) {
		var span = document.createElement( 'span' );
		span.style.color = color;
		span.appendChild( document.createTextNode( content ) );
		return span;
	},

	buildLink: function(color, text) {
		var link = document.createElement('a');
		link.appendChild(Twinkle.fluff.spanTag('Black', '['));
		link.appendChild(Twinkle.fluff.spanTag(color, text));
		link.appendChild(Twinkle.fluff.spanTag('Black', ']'));
		return link;
	},

	auto: function() {
		if( mw.config.get('wgRevisionId') !== mw.config.get('wgCurRevisionId') ) {
			// not latest revision
			alert("Tidak dapat mengembalikan revisi, halaman sudah berubah saat ini.");
			return;
		}

		var vandal = $("#mw-diff-ntitle2").find("a.mw-userlink").text();

		Twinkle.fluff.revert( Morebits.queryString.get( 'twinklerevert' ), vandal, true );
	},

	contributions: function() {
		// $('sp-contributions-footer-anon-range') relies on the fmbox
		// id in [[MediaWiki:Sp-contributions-footer-anon-range]] and
		// is used to show rollback/vandalism links for IP ranges
		if( mw.config.get('wgCanonicalSpecialPageName') === "Contributions" && (mw.config.exists('wgRelevantUserName') || !!$('#sp-contributions-footer-anon-range')[0])) {
			//Get the username these contributions are for
			var username = mw.config.get('wgRelevantUserName');
			if( Twinkle.getPref('showRollbackLinks').indexOf('contribs') !== -1 ||
				( mw.config.get('wgUserName') !== username && Twinkle.getPref('showRollbackLinks').indexOf('others') !== -1 ) ||
				( mw.config.get('wgUserName') === username && Twinkle.getPref('showRollbackLinks').indexOf('mine') !== -1 ) ) {
				var list = $("#mw-content-text").find("ul li:has(span.mw-uctop)");

				var revNode = document.createElement('strong');
				var revLink = Twinkle.fluff.buildLink('SteelBlue', 'kembalikan');
				revNode.appendChild(revLink);

				var revVandNode = document.createElement('strong');
				var revVandLink = Twinkle.fluff.buildLink('Red', 'vandalisme');
				revVandNode.appendChild(revVandLink);

				list.each(function(key, current) {
					var href = $(current).find(".mw-changeslist-diff").attr("href");
					if (href) {
						current.appendChild( document.createTextNode(' ') );
						var tmpNode = revNode.cloneNode( true );
						tmpNode.firstChild.setAttribute( 'href', href + '&' + Morebits.queryString.create( { 'twinklerevert': 'norm' } ) );
						current.appendChild( tmpNode );
						current.appendChild( document.createTextNode(' ') );
						tmpNode = revVandNode.cloneNode( true );
						tmpNode.firstChild.setAttribute( 'href', href + '&' + Morebits.queryString.create( { 'twinklerevert': 'vand' } ) );
						current.appendChild( tmpNode );
					}
				});
			}
		}
	},

	diff: function() {
		// Add a [restore this revision] link to the older revision
		// Don't show if there's a single revision or weird diff (cur on latest)
		if (mw.config.get('wgDiffOldId') && (mw.config.get('wgDiffOldId') !== mw.config.get('wgDiffNewId'))) {
			var revertToRevision = document.createElement('div');
			revertToRevision.setAttribute( 'id', 'tw-revert-to-orevision' );
			revertToRevision.style.fontWeight = 'bold';

			var revertToRevisionLink = Twinkle.fluff.buildLink('SaddleBrown', 'kembalikan revisi ini');
			revertToRevisionLink.href = "#";
			$(revertToRevisionLink).click(function(){
				Twinkle.fluff.revertToRevision(mw.config.get('wgDiffOldId').toString());
			});
			revertToRevision.appendChild(revertToRevisionLink);

			var otitle = document.getElementById('mw-diff-otitle1').parentNode;
			otitle.insertBefore( revertToRevision, otitle.firstChild );
		}

		// Add either restore or rollback links to the newer revision
		// Don't show if there's a single revision or weird diff (prev on first)
		var ntitle = document.getElementById('mw-diff-ntitle1').parentNode;
		if( document.getElementById('differences-nextlink') ) {
			// Not latest revision
			var revertToRevisionN = document.createElement('div');
			revertToRevisionN.setAttribute( 'id', 'tw-revert-to-nrevision' );
			revertToRevisionN.style.fontWeight = 'bold';

			var revertToRevisionNLink = Twinkle.fluff.buildLink('SaddleBrown', 'kembalikan revisi ini');
			revertToRevisionNLink.href = "#";
			$(revertToRevisionNLink).click(function(){
				Twinkle.fluff.revertToRevision(mw.config.get('wgDiffNewId').toString());
			});
			revertToRevisionN.appendChild(revertToRevisionNLink);

			ntitle.insertBefore( revertToRevisionN, ntitle.firstChild );
		} else if( Twinkle.getPref('showRollbackLinks').indexOf('diff') !== -1 && mw.config.get('wgDiffOldId') && (mw.config.get('wgDiffOldId') !== mw.config.get('wgDiffNewId') || document.getElementById('differences-prevlink'))) {
			var vandal = $("#mw-diff-ntitle2").find("a").first().text();

			var revertNode = document.createElement('div');
			revertNode.setAttribute( 'id', 'tw-revert' );

			var agfNode = document.createElement('strong');
			var vandNode = document.createElement('strong');
			var normNode = document.createElement('strong');

			var agfLink = Twinkle.fluff.buildLink('DarkOliveGreen', 'kembalikan (AGF)');
			var vandLink = Twinkle.fluff.buildLink('Red', 'kembalikan (VANDAL)');
			var normLink = Twinkle.fluff.buildLink('SteelBlue', 'kembalikan');

			agfLink.href = "#";
			vandLink.href = "#";
			normLink.href = "#";
			$(agfLink).click(function(){
				Twinkle.fluff.revert('agf', vandal);
			});
			$(vandLink).click(function(){
				Twinkle.fluff.revert('vand', vandal);
			});
			$(normLink).click(function(){
				Twinkle.fluff.revert('norm', vandal);
			});

			agfNode.appendChild(agfLink);
			vandNode.appendChild(vandLink);
			normNode.appendChild(normLink);

			revertNode.appendChild( agfNode );
			revertNode.appendChild( document.createTextNode(' || ') );
			revertNode.appendChild( normNode );
			revertNode.appendChild( document.createTextNode(' || ') );
			revertNode.appendChild( vandNode );

			ntitle.insertBefore( revertNode, ntitle.firstChild );
		}
	},

	oldid: function() { // Add a [restore this revision] link on old revisions
		var revertToRevision = document.createElement('div');
		revertToRevision.setAttribute( 'id', 'tw-revert-to-orevision' );
		revertToRevision.style.fontWeight = 'bold';

		var revertToRevisionLink = Twinkle.fluff.buildLink('SaddleBrown', 'kembalikan revisi ini');
		revertToRevisionLink.href = "#";
		$(revertToRevisionLink).click(function(){
			Twinkle.fluff.revertToRevision(mw.config.get('wgRevisionId').toString());
		});
		revertToRevision.appendChild(revertToRevisionLink);
		var otitle = document.getElementById('mw-revision-info').parentNode;
		otitle.insertBefore( revertToRevision, otitle.firstChild );
	}
};

Twinkle.fluff.revert = function revertPage( type, vandal, autoRevert, rev, page ) {
	if (mw.util.isIPv6Address(vandal)) {
		vandal = Morebits.sanitizeIPv6(vandal);
	}

	var pagename = page || mw.config.get('wgPageName');
	var revid = rev || mw.config.get('wgCurRevisionId');

	Morebits.status.init( document.getElementById('mw-content-text') );
	$( '#catlinks' ).remove();

	var params = {
		type: type,
		user: vandal,
		pagename: pagename,
		revid: revid,
		autoRevert: !!autoRevert
	};
	var query = {
		'action': 'query',
		'prop': ['info', 'revisions', 'flagged'],
		'titles': pagename,
		'rvlimit': 50, // max possible
		'rvprop': [ 'ids', 'timestamp', 'user', 'comment' ],
		'intoken': 'edit'
	};
	var wikipedia_api = new Morebits.wiki.api( 'Mengambil data revisi yang lebih awal', query, Twinkle.fluff.callbacks.main );
	wikipedia_api.params = params;
	wikipedia_api.post();
};

Twinkle.fluff.revertToRevision = function revertToRevision( oldrev ) {

	Morebits.status.init( document.getElementById('mw-content-text') );

	var query = {
		'action': 'query',
		'prop': ['info',  'revisions'],
		'titles': mw.config.get('wgPageName'),
		'rvlimit': 1,
		'rvstartid': oldrev,
		'rvprop': [ 'ids', 'timestamp', 'user', 'comment' ],
		'intoken': 'edit',
		'format': 'xml'
	};
	var wikipedia_api = new Morebits.wiki.api( 'Mengambil data revisi yang lebih awal', query, Twinkle.fluff.callbacks.toRevision.main );
	wikipedia_api.params = { rev: oldrev };
	wikipedia_api.post();
};

Twinkle.fluff.userIpLink = function( user ) {
	return (mw.util.isIPAddress(user) ? "[[Special:Contributions/" : "[[:User:" ) + user + "|" + user + "]]";
};

Twinkle.fluff.callbacks = {
	toRevision: {
		main: function( self ) {
			var xmlDoc = self.responseXML;

			var lastrevid = parseInt( $(xmlDoc).find('page').attr('lastrevid'), 10);
			var touched = $(xmlDoc).find('page').attr('touched');
			var starttimestamp = $(xmlDoc).find('page').attr('starttimestamp');
			var edittoken = $(xmlDoc).find('page').attr('edittoken');
			var revertToRevID = $(xmlDoc).find('rev').attr('revid');
			var revertToUser = $(xmlDoc).find('rev').attr('user');

			if (revertToRevID !== self.params.rev) {
				self.statitem.error( 'The retrieved revision does not match the requested revision. Stopping revert.' );
				return;
			}

			var optional_summary = prompt( "Berikan alasan pengembalian ini:                                ", "" );  // padded out to widen prompt in Firefox
			if (optional_summary === null)
			{
				self.statelem.error( 'Dibatalkan oleh pengguna.' );
				return;
			}
			var summary = Twinkle.fluff.formatSummary("Dikembalikan ke revisi " + revertToRevID + " oleh $USER", revertToUser, optional_summary);

			var query = {
				'action': 'edit',
				'title': mw.config.get('wgPageName'),
				'summary': summary,
				'token': edittoken,
				'undo': lastrevid,
				'undoafter': revertToRevID,
				'basetimestamp': touched,
				'starttimestamp': starttimestamp,
				'watchlist': Twinkle.getPref('watchRevertedPages').indexOf( 'torev' ) !== -1 ? 'watch' : undefined,
				'minor': Twinkle.getPref('markRevertedPagesAsMinor').indexOf( 'torev' ) !== -1  ? true : undefined
			};

			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.notice = "Pengembalian selesai";

			var wikipedia_api = new Morebits.wiki.api( 'Menyimpan isi yang dikembalikan', query, Twinkle.fluff.callbacks.complete, self.statelem);
			wikipedia_api.params = self.params;
			wikipedia_api.post();

		}
	},
	main: function( self ) {
		var xmlDoc = self.responseXML;

		var lastrevid = parseInt( $(xmlDoc).find('page').attr('lastrevid'), 10);
		var touched = $(xmlDoc).find('page').attr('touched');
		var starttimestamp = $(xmlDoc).find('page').attr('starttimestamp');
		var edittoken = $(xmlDoc).find('page').attr('edittoken');
		var lastuser = $(xmlDoc).find('rev').attr('user');

		var revs = $(xmlDoc).find('rev');

		if( revs.length < 1 ) {
			self.statelem.error( 'Tidak memiliki satu pun revisi tambahan, sehingga tidak mungkin untuk dikembalikan' );
			return;
		}
		var top = revs[0];
		if( lastrevid < self.params.revid ) {
			Morebits.status.error( 'Error', [ 'Penanda revisi terakhir yang diperoleh dari peladen, ', Morebits.htmlNode( 'strong', lastrevid ), ', kurang dari penanda revisi yang saat ini ditampilkan. Ini menandakan bahwa revisi saat ini sudah dihapus, peladen sedang tersendat, atau data buruk yang diterima. Proses aka dihentikan.' ] );
			return;
		}
		var index = 1;
		if( self.params.revid !== lastrevid  ) {
			Morebits.status.warn( 'Peringatan', [ 'Revisi terakhir ', Morebits.htmlNode( 'strong', lastrevid ), ' tidak sesuai dengan revisi kami ', Morebits.htmlNode( 'strong', self.params.revid ) ] );
			if( lastuser === self.params.user ) {
				switch( self.params.type ) {
				case 'vand':
					Morebits.status.info( 'Informasi', [ 'Revisi terakhir dibuat oleh ', Morebits.htmlNode( 'strong', self.params.user ) , '. Karena dianggap sebagai vandalisme, kami lanjutkan pengembaliannya.' ]);
					break;
				case 'agf':
					Morebits.status.warn( 'Warning', [ 'Revisi terakhir dibuat oleh ', Morebits.htmlNode( 'strong', self.params.user ) , '. Karena dianggap sebagai niat baik, pengembalian ini dihentikan, di mana masalah mungkin dapat diatasi.' ]);
					return;
				default:
					Morebits.status.warn( 'Perhatian', [ 'Revisi terakhir dibuat oleh ', Morebits.htmlNode( 'strong', self.params.user ) , ', namun kami akan menghentikan proses pengembalian.' ] );
					return;
				}
			}
			else if(self.params.type === 'vand' &&
					Twinkle.fluff.whiteList.indexOf( top.getAttribute( 'user' ) ) !== -1 && revs.length > 1 &&
					revs[1].getAttribute( 'pageId' ) === self.params.revid) {
				Morebits.status.info( 'Informasi', [ 'Revisi terakhir dibuat oleh ', Morebits.htmlNode( 'strong', lastuser ), ', bot yang tepercaya, dan revisi sebelumnya dibuat oleh pengguna vandalisme, pengembalian dilanjutkan.' ] );
				index = 2;
			} else {
				Morebits.status.error( 'Galat', [ 'Revisi terakhir dibuat oleh ', Morebits.htmlNode( 'strong', lastuser ), ', sehingga mungkin telah dikembalikan, akan menghentikan pengembalian ini.'] );
				return;
			}

		}

		if( Twinkle.fluff.whiteList.indexOf( self.params.user ) !== -1  ) {
			switch( self.params.type ) {
			case 'vand':
				Morebits.status.info( 'Informasi', [ 'Pengembalian vandalisme dipilih pada ', Morebits.htmlNode( 'strong', self.params.user ), '. Karena bot ini masuk daftar putih, kami menganggap Anda akan mengembalikan vandalisme yang dibuat oleh pengguna sebelumnya.' ] );
				index = 2;
				self.params.user = revs[1].getAttribute( 'user' );
				break;
			case 'agf':
				Morebits.status.warn( 'Pemberitahuan', [ 'Pengembalian dengan niat baik dipilih pada ', Morebits.htmlNode( 'strong', self.params.user ), '. Ini adalah bot yang masuk daftar putih, dan karena bot tidak punya niat, pengembalian ANB tidak dilanjutkan.' ] );
				return;
			case 'norm':
				/* falls through */
			default:
				var cont = confirm( 'Pengembalian normal sudah dipilih, namun suntingan terakhir dibuat oleh bot yang masuk daftar putih (' + self.params.user + '). Ingin melanjutkan revisi sebelumnya saja?' );
				if( cont ) {
					Morebits.status.info( 'Informasi', [ 'Pengembalian normal dipilih pada ', Morebits.htmlNode( 'strong', self.params.user ), '. Ini adalah bot daftar putih, dan dengan konfirmasi, kami akan mengembalikan revisi sebelumnya saja.' ] );
					index = 2;
					self.params.user = revs[1].getAttribute( 'user' );
				} else {
					Morebits.status.warn( 'Pemberitahuan', [ 'Pengembalian normal dipilih pada ', Morebits.htmlNode( 'strong', self.params.user ), '. Ini adalah bot daftar putih, namun dengan konfirmasi, pengembalian revisi atas akan diproses.' ] );
				}
				break;
			}
		}
		var found = false;
		var count = 0;

		for( var i = index; i < revs.length; ++i ) {
			++count;
			if( revs[i].getAttribute( 'user' ) !== self.params.user ) {
				found = i;
				break;
			}
		}

		if( ! found ) {
			self.statelem.error( [ 'Tidak dapat ditemukan revisi sebelumnya. Mungkin ', Morebits.htmlNode( 'strong', self.params.user ), ' adalah satu-satunya penyunting, atau pengguna tersebut telah melakukan ' + Twinkle.getPref('revertMaxRevisions') + ' suntingan berturut-turut.' ] );
			return;
		}

		if( ! count ) {
			Morebits.status.error( 'Galat', "Tidak bisa membatalkan nol revisi. Ini mungkin dikarenakan revisi tersebut telah dibatalkan namun penanda revisi masih tetap sama." );
			return;
		}

		var good_revision = revs[ found ];
		var userHasAlreadyConfirmedAction = false;
		if (self.params.type !== 'vand' && count > 1) {
			if ( !confirm( self.params.user + ' telah melakukan ' + count + ' suntingan berturut-turut. Apakah Anda yakin mau membatalkan semuanya?') ) {
				Morebits.status.info( 'Notice', 'Menghentikan pembatalan.' );
				return;
			}
			userHasAlreadyConfirmedAction = true;
		}

		self.params.count = count;

		self.params.goodid = good_revision.getAttribute( 'revid' );
		self.params.gooduser = good_revision.getAttribute( 'user' );

		self.statelem.status( [ ' revisi ', Morebits.htmlNode( 'strong', self.params.goodid ), ' yang dilakukan ', Morebits.htmlNode( 'strong', count ), ' suntingan yang lalu oleh ', Morebits.htmlNode( 'strong', self.params.gooduser ) ] );

		var summary, extra_summary;
		switch( self.params.type ) {
		case 'agf':
			extra_summary = prompt( "Komentar tambahan untuk ringkasan suntingan:                               ", "" );  // padded out to widen prompt in Firefox
			if (extra_summary === null)
			{
				self.statelem.error( 'Dibatalkan oleh pengguna.' );
				return;
			}
			userHasAlreadyConfirmedAction = true;

			summary = Twinkle.fluff.formatSummary("Membatalkan suntingan [[WP:ANB|berniat baik]] oleh $USER", self.params.user, extra_summary);
			break;

		case 'vand':

			summary = "Membatalkan " + self.params.count + (self.params.count > 1 ? ' suntingan' : ' suntingan') + " oleh [[Special:Contributions/" +
				self.params.user + "|" + self.params.user + "]] ([[User talk:" + self.params.user + "|bicara]]) ke revisi terakhir oleh " +
				self.params.gooduser + Twinkle.getPref('summaryAd');
			break;

		case 'norm':
			/* falls through */
		default:
			if( Twinkle.getPref('offerReasonOnNormalRevert') ) {
				extra_summary = prompt( "Komentar tambahan untuk ringkasan suntingan:                              ", "" );  // padded out to widen prompt in Firefox
				if (extra_summary === null)
				{
					self.statelem.error( 'Dibatalkan oleh pengguna.' );
					return;
				}
				userHasAlreadyConfirmedAction = true;
			}

			summary = Twinkle.fluff.formatSummary("Membatalkan " + self.params.count +
				" suntingan oleh $USER", self.params.user, extra_summary);
			break;
		}

		if (Twinkle.getPref('confirmOnFluff') && !userHasAlreadyConfirmedAction && !confirm("Membatalkan halaman: Anda yakin?")) {
			self.statelem.error( 'Dibatalkan oleh pengguna.' );
			return;
		}

		var query;
		if( (!self.params.autoRevert || Twinkle.getPref('openTalkPageOnAutoRevert')) &&
				Twinkle.getPref('openTalkPage').indexOf( self.params.type ) !== -1 &&
				mw.config.get('wgUserName') !== self.params.user ) {
			Morebits.status.info( 'Informasi', [ 'Membuka halaman penyuntingan halaman pembicaraan pengguna ', Morebits.htmlNode( 'strong', self.params.user ) ] );

			query = {
				'title': 'User talk:' + self.params.user,
				'action': 'edit',
				'preview': 'yes',
				'vanarticle': self.params.pagename.replace(/_/g, ' '),
				'vanarticlerevid': self.params.revid,
				'vanarticlegoodrevid': self.params.goodid,
				'type': self.params.type,
				'count': self.params.count
			};

			switch( Twinkle.getPref('userTalkPageMode') ) {
			case 'tab':
				window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), '_blank' );
				break;
			case 'blank':
				window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), '_blank',
					'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
				break;
			case 'window':
				/* falls through */
			default:
				window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ),
					( window.name === 'twinklewarnwindow' ? '_blank' : 'twinklewarnwindow' ),
					'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
				break;
			}
		}

		// figure out whether we need to/can review the edit
		var $flagged = $(xmlDoc).find('flagged');
		if ((Morebits.userIsInGroup('reviewer') || Morebits.userIsInGroup('sysop')) &&
				$flagged.length &&
				$flagged.attr("stable_revid") >= self.params.goodid &&
				$flagged.attr("pending_since")) {
			self.params.reviewRevert = true;
			self.params.edittoken = edittoken;
		}

		query = {
			'action': 'edit',
			'title': self.params.pagename,
			'summary': summary,
			'token': edittoken,
			'undo': lastrevid,
			'undoafter': self.params.goodid,
			'basetimestamp': touched,
			'starttimestamp': starttimestamp,
			'watchlist' :  Twinkle.getPref('watchRevertedPages').indexOf( self.params.type ) !== -1 ? 'watch' : undefined,
			'minor': Twinkle.getPref('markRevertedPagesAsMinor').indexOf( self.params.type ) !== -1 ? true : undefined
		};

		Morebits.wiki.actionCompleted.redirect = self.params.pagename;
		Morebits.wiki.actionCompleted.notice = "Pembatalan selesai";

		var wikipedia_api = new Morebits.wiki.api( 'Menyimpan isi yang telah dibatalkan', query, Twinkle.fluff.callbacks.complete, self.statelem);
		wikipedia_api.params = self.params;
		wikipedia_api.post();

	},
	complete: function (apiobj) {
		// TODO Most of this is copy-pasted from Morebits.wiki.page#fnSaveSuccess. Unify it
		var xml = apiobj.getXML();
		var $edit = $(xml).find('edit');
		var blacklist = $edit.attr('spamblacklist');
		if (blacklist) {
			var code = document.createElement('code');
			code.style.fontFamily = "monospace";
			code.appendChild(document.createTextNode(blacklist));
			apiobj.statelem.error(['Tidak dapat membatalkan karena URL ', code, ' berada dalam daftar hitam spam.']);
		} else if ( $(xml).find('captcha').length > 0 ) { // TODO: Translate!
			apiobj.statelem.error("Could not rollback, because the wiki server wanted you to fill out a CAPTCHA.");
		} else if ( $edit.attr('code') === 'abusefilter-disallowed' ) { // TODO: Translate!
			apiobj.statelem.error('The edit was disallowed by the edit filter rule "' + $edit.attr('info').substring(17) + '".');
		} else if ( $edit.attr('info') && $edit.attr('info').indexOf('Hit AbuseFilter:') === 0 ) { // TODO: Translate!
			var div = document.createElement('div');
			div.className = "toccolours";
			div.style.fontWeight = "normal";
			div.style.color = "black";
			div.innerHTML = $edit.attr('warning');
			apiobj.statelem.error([ 'The following warning was returned by the edit filter: ', div, 'If you wish to proceed with the rollback, please reload this page (F5 or Ctrl+R) and carry it out again. This warning will not appear a second time.' ]);
		} else if ($edit.attr('nochange') === '') {
			apiobj.statelem.warn("Revisi yang dibatalkan sama dengan revisi terakhir: Tidak ada yang dapat dilakukan.");
		} else {
			apiobj.statelem.info("done");

			// review the revert, if needed
			if (apiobj.params.reviewRevert) {
				var query = {
					'action': 'review',
					'revid': $edit.attr('newrevid'),
					'token': apiobj.params.edittoken,
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
	var resultLen = unescape(encodeURIComponent(result.replace("$USER", ""))).length;
	var contribsLink = "[[Special:Contributions/" + userName + "|" + userName + "]]";
	var contribsLen = unescape(encodeURIComponent(contribsLink)).length;
	if (resultLen + contribsLen <= 255) {
		var talkLink = " ([[User talk:" + userName + "|bicara]])";
		if (resultLen + contribsLen + unescape(encodeURIComponent(talkLink)).length <= 255) {
			result = Morebits.string.safeReplace(result, "$USER", contribsLink + talkLink);
		} else {
			result = Morebits.string.safeReplace(result, "$USER", contribsLink);
		}
	} else {
		result = Morebits.string.safeReplace(result, "$USER", userName);
	}

	return result;
};

Twinkle.fluff.init = function twinklefluffinit() {
	if (Twinkle.userAuthorized)
	{
		// A list of usernames, usually only bots, that vandalism revert is jumped over; that is,
		// if vandalism revert was chosen on such username, then its target is on the revision before.
		// This is for handling quick bots that makes edits seconds after the original edit is made.
		// This only affects vandalism rollback; for good faith rollback, it will stop, indicating a bot
		// has no faith, and for normal rollback, it will rollback that edit.
		Twinkle.fluff.whiteList = [
			'AnomieBOT',
			'SineBot'
		];

		if ( Morebits.queryString.exists( 'twinklerevert' ) ) {
			Twinkle.fluff.auto();
		} else if( mw.config.get('wgNamespaceNumber') === -1 && mw.config.get('wgCanonicalSpecialPageName') === "Contributions" ) {
			Twinkle.fluff.contributions();
		} else if( mw.config.get('wgDiffNewId') || mw.config.get('wgDiffOldId') ) { // wgDiffOldId included for clarity in if else loop [[phab:T214985]]
			mw.hook( 'wikipage.diff' ).add( function () { // Reload alongside the revision slider
				Twinkle.fluff.diff();
			} );
		} else if( mw.config.get('wgAction') === 'view' && mw.config.get('wgCurRevisionId') !== mw.config.get('wgRevisionId') ) {
			Twinkle.fluff.oldid();
		}
	}
};
})(jQuery);


//</nowiki>
