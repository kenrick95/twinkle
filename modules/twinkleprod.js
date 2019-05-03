//<nowiki>


(function($){


/*
 ****************************************
 *** twinkleprod.js: PROD module
 ****************************************
 * Mode of invocation:     Tab ("PROD")
 * Active on:              Existing articles, files, books which are not redirects,
 *                         and user pages in [[:Category:Wikipedia books (user books)]]
 * Config directives in:   TwinkleConfig
 */

Twinkle.prod = function twinkleprod() {
	if( ([0, 6, 108].indexOf(mw.config.get('wgNamespaceNumber')) === -1) && (mw.config.get('wgNamespaceNumber') !== 2 || mw.config.get('wgCategories').indexOf('Wikipedia books (user books)') === -1) 
		|| !mw.config.get('wgCurRevisionId') || Morebits.wiki.isPageRedirect() ) {
		return;
	}

	Twinkle.addPortletLink( Twinkle.prod.callback, "UP", "tw-prod", "Usulan penghapusan melalui WP:UP" );
};

// Used in edit summaries, for comparisons, etc.
var namespace;

Twinkle.prod.callback = function twinkleprodCallback() {
	Twinkle.prod.defaultReason = Twinkle.getPref('prodReasonDefault');

	switch (mw.config.get('wgNamespaceNumber')) {
		case 0:
			namespace = 'article';
			break;
		case 6:
			namespace = 'file';
			break;
		case 2:
		case 108:
			namespace = 'book';
			break;
	}

	var Window = new Morebits.simpleWindow( 800, 410 );
	Window.setTitle( "Usulan Penghapusan (UP)" );
	Window.setScriptName( "Twinkle" );

	var form = new Morebits.quickForm( Twinkle.prod.callback.evaluate );

	if (namespace === 'article') {
		Window.addFooterLink( "Proposed deletion policy", "WP:PROD" );
		Window.addFooterLink( "BLP PROD policy", "WP:BLPPROD" );
	} else if ( namespace === 'file' ) {
		Window.addFooterLink( "Proposed deletion policy", "WP:PROD" );
	} else {	// if book
		Window.addFooterLink( "Proposed deletion (books) policy", "WP:BOOKPROD" );
	}

	var field = form.append( {
		type: 'field',
		label: 'type UP',
		id: 'prodtype_fieldset'
	} );

	field.append( {
			type: 'radio',
			name: 'prodtype',
			event: Twinkle.prod.callback.prodtypechanged,
			list: [
				{
					label: 'UP (usulan penghapusan)',
					value: 'prod',
					checked: true,
					tooltip: 'Usulan penghapusan normal'
				},
				{
					label: 'Usulan penghapusan halaman tokoh yang masih hidup tanpa referensi',
					value: 'prodblp',
					tooltip: 'Usulan penghapusan biografi baru dari tokoh yang masih hidup'
				}
			]
		} );

	// Placeholder fieldset to be replaced in Twinkle.prod.callback.prodtypechanged
	form.append( {
		type: 'field',
		name: 'parameters'
	} );

	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#prod" );

	form.append( { type:'submit', label:'Usulkan penghapusan' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// Hide fieldset for File and Book PROD types since only normal PROD is allowed
	if(namespace !== 'article') {
		$(result).find('#prodtype_fieldset').hide();
	}

	// Fake a change event on the first prod type radio, to initialize the type-dependent controls
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.prodtype[0].dispatchEvent( evt );

};


Twinkle.prod.callback.prodtypechanged = function(event) {
	//prepare frame for prod type dependant controls
	var field = new Morebits.quickForm.element( {
			type: 'field',
			label: 'Parameters',
			name: 'parameters'
		} );
	// create prod type dependant controls
	switch( event.target.values ) {
		case 'prod':
			field.append( {
					type: 'checkbox',
					list: [
						{
							label: 'Beritahukan pembuat halaman jika memungkinkan',
							value: 'notify',
							name: 'notify',
							tooltip: "Templat pemberitahuan akan dikirimkan ke halaman pembicaraannya jika opsi ini dipilih.",
							checked: true
						}
					]
				} );
			field.append( {
					type: 'textarea',
					name: 'reason',
					label: 'Alasan:',
					value: Twinkle.prod.defaultReason
				} );
			break;

		case 'prodblp':
			// first, remember the prod value that the user entered in the textarea, in case they want to switch back. We can abuse the config field for that.
			if (event.target.form.reason) {
				Twinkle.prod.defaultReason = event.target.form.reason.value;
			}

			field.append( {
					type: 'checkbox',
					list: [
						{
							label: 'Beritahukan pembuat halaman jika memungkinkan',
							value: 'notify',
							name: 'notify',
							tooltip: 'Pembuat halaman harus diberitahukan.',
							checked: true,
							disabled: true
						}
					]
				} );
			//temp warning, can be removed down the line once BLPPROD is more established. Amalthea, May 2010.
			var boldtext = document.createElement('b');
			boldtext.appendChild(document.createTextNode('Ingatlah bahwa hanya biografi tokoh yang masih hidup tanpa referensi yang cocok untuk tag ini.'));
			field.append({
				type: 'div',
				label: boldtext
			});
			break;

		default:
			break;
	}

	event.target.form.replaceChild( field.render(), $(event.target.form).find('fieldset[name="parameters"]')[0] );
};

Twinkle.prod.callbacks = {
	checkpriors: function(apiobj) {
		var xmlDoc = apiobj.responseXML;
		var statelem = apiobj.statelem;
		var params = apiobj.params;

		// Check existence of AfD, would be easier if mw.Title.exists() worked [[phab:T184953]]
		var exists;
		if (namespace === 'article') {
			var query = {
				'action': 'query',
				'prop': 'revisions',
				'titles': 'Wikipedia:Articles for deletion/' + Morebits.pageNameNorm
			};
			var wikipedia_api = new Morebits.wiki.api('Checking for prior AfDs', query, function(apiobj) {
				var xmlDoc = apiobj.responseXML;
				exists = $(xmlDoc).find('rev').attr('revid');
			});
			// Wait for API call to finish
			wikipedia_api.post({
				async: false
			});
		}
		if (exists) {
			statelem.warn( 'Previous AfD for this page title found, aborting procedure' );
			return;
		}

		// Check talk page for category indicating prior PROD
		var cats = $(xmlDoc).find('categories');
		if(cats.length) {
			if(params.blp) {
				if( !confirm( 'Previous PROD nomination found on talk page. Do you still want to continue applying BLPPROD? ' ) ) {
					statelem.warn( 'Previous PROD found on talk page, aborted by user' );
					return;
				} else {
					statelem.info( 'Previous PROD found on talk page, continuing' );
				}
			} else {
				statelem.warn( 'Previous PROD found on talk page, aborting procedure' );
				return;
			}
		}

		Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
		Morebits.wiki.actionCompleted.notice = "Tagging complete";

		var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Tagging page");
		wikipedia_page.setFollowRedirect(true);  // for NPP, and also because redirects are ineligible for PROD
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.prod.callbacks.main);
	},

	main: function(pageobj) {
		var statelem = pageobj.getStatusElement();

		if( !pageobj.exists() ) {
			statelem.error( "Kelihatannya halaman ini tidak ada. Mungkin sudah dihapus." );
			return;
		}

		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		// Check for already existing deletion tags
		var tag_re = /{{(?:db-?|delete|article for deletion\/dated|ffd\b)|#invoke:RfD/i;
		if( tag_re.test( text ) ) {
			statelem.warn( 'Halaman sudah ditandai dengan templat hapus. Proses dihentikan.' );
			return;
		}

		// Alert if article is not in Category:Living people and BLPPROD is selected
		if( params.blp ) {
			var blpcheck_re = /\[\[Category:Living people\]\]/i;
			if( !blpcheck_re.test( text ) ) {
				if( ! confirm("Please note that the article is not in Category:Living people and hence may be ineligible for BLPPROD. Are you sure you want to continue? \n\nYou may wish to add the category if you proceed, unless the article is about a recently deceased person." ) ) {
					return;
				}
			}
		}

		// Remove tags that become superfluous with this action
		text = text.replace(/{{\s*(userspace draft|mtc|(copy|move) to wikimedia commons|(copy |move )?to ?commons)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/gi, "");
		var prod_re = /{{\s*(?:Prod blp|Proposed deletion|book-prod)\/dated( files)?\s*\|(?:{{[^{}]*}}|[^{}])*}}/i;
		var summaryText;
		if( !prod_re.test( text ) ) {
			// Notification to first contributor
			if( params.usertalk ) {
				var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(params);
				thispage.lookupCreator(Twinkle.prod.callbacks.userNotification);
			}
			// If not notifying, log this PROD
			else if( Twinkle.getPref('logProdPages') ) {
				Twinkle.prod.callbacks.addToLog(params);
			}
			if(params.blp) {
				summaryText = "Usulkan penghapusan artikel per [[WP:BLPPROD]].";
				text = "{{subst:prod blp" + (params.usertalk ? "|help=off" : "") + "}}\n" + text;
			}
			else if(params.book) {
				summaryText = "Usulkan penghapusan buku per [[WP:BOOKPROD]].";
				text = "{{subst:book-prod|1=" + Morebits.string.formatReasonText(params.reason) + (params.usertalk ? "|help=off" : "") + "}}\n" + text;
			}
			else {
				summaryText = "Usulan penghapusan " + namespace + " per [[WP:PROD]].";
				text = "{{subst:prod|1=" + Morebits.string.formatReasonText(params.reason) + (params.usertalk ? "|help=off" : "") + "}}\n" + text;
			}

			// Add {{Old prod}} to the talk page
			var oldprodfull = '{{Old prod|nom=' + mw.config.get('wgUserName') + '|nomdate={{subst:#time: Y-m-d}}}}\n';
			var talktitle = new mw.Title(mw.config.get('wgPageName')).getTalkPage().getPrefixedText();
			var talkpage = new Morebits.wiki.page(talktitle, 'Menambahkan {{Old prod}} di halaman pembicaraan');
			talkpage.setPrependText(oldprodfull);
			talkpage.setEditSummary('Menambahkan {{Old prod}} di halaman pembicaraan ' + Twinkle.getPref('summaryAd'));
			talkpage.setFollowRedirect(true);  // match behavior for page tagging
			talkpage.setCreateOption('recreate');
			talkpage.prepend();
		}
		else {  // already tagged for PROD, so try endorsing it
			var prod2_re = /{{(?:Proposed deletion endorsed|prod-?2).*?}}/;
			if( prod2_re.test( text ) ) {
				statelem.warn( 'Halaman sudah ditandai dengan {{proposed deletion}} dan {{proposed deletion endorsed}}, proses dihentikan' );
				return;
			}
			var confirmtext = "Tag {{proposed deletion}} sudah ada di halaman ini. \nApakah Anda ingin menambahkan tag {{proposed deletion endorsed}} disertai alasan Anda?";
			if (params.blp) {
				confirmtext = "Tag {{proposed deletion}} bukan BOH ditemukan di artikel.  \nApakah Anda ingin menambahkan tag {{proposed deletion endorsed}} dengan alasan \"artikel adalah biografi tokoh yang masih hidup tanpa referensi\"?";
				// FIXME: this msg is shown even if it was a BLPPROD tag.
			}
			if( !confirm( confirmtext ) ) {
				statelem.warn( 'Dibatalkan oleh pengguna' );
				return;
			}

			summaryText = "Mendukung usulan penghapusan per [[WP:" + (params.blp ? "BLP" : (params.book ? "BOOK" : "")) + "UP]].";
			text = text.replace( prod_re, text.match( prod_re ) + "\n{{proposed deletion endorsed|1=" + (params.blp ?
				"artikel adalah biografi tokoh yang masih hidup tanpa referensi" :
				Morebits.string.formatReasonText(params.reason)) + "}}\n" );

			if( Twinkle.getPref('logProdPages') ) {
				params.logEndorsing = true;
				Twinkle.prod.callbacks.addToLog(params);
			}
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getPref('watchProdPages'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();
	},

	userNotification: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();

		// Disallow warning yourself
		if (initialContrib === mw.config.get("wgUserName")) {
			pageobj.getStatusElement().warn("Anda (" + initialContrib + ") membuat halaman ini; lewatkan pemberitahuan pengguna");
			if (Twinkle.getPref("logProdPages")) {
				Twinkle.prod.callbacks.addToLog(params);
			}
			return;
		}

		// [[Template:Proposed deletion notify]] supports File namespace
		var notifyTemplate;
		if(params.blp) {
			notifyTemplate = 'prodwarningBLP';
		} else if (params.book) {
			notifyTemplate = 'bprodwarning';
		} else {
			notifyTemplate = 'proposed deletion notify';
		}
		var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, "Memberitahukan kontributor awal (" + initialContrib + ")");
		var notifytext = "\n{{subst:" + notifyTemplate + "|1=" + Morebits.pageNameNorm + "|concern=" + params.reason + "}} ~~~~";
		usertalkpage.setAppendText(notifytext);
		usertalkpage.setEditSummary("Pemberitahuan: Usulan penghapusan  [[:" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
		usertalkpage.setCreateOption('recreate');
		usertalkpage.setFollowRedirect(true);
		usertalkpage.append(function onNotifySuccess() {
			// add nomination to the userspace log, if the user has enabled it
			if (Twinkle.getPref('logProdPages')) {
				params.logInitialContrib = initialContrib;
				Twinkle.prod.callbacks.addToLog(params);
			}
		}, function onNotifyError() {
			// if user could not be notified, log nomination without mentioning that notification was sent
			if (Twinkle.getPref('logProdPages')) {
				Twinkle.prod.callbacks.addToLog(params);
			}
		});
	},

	addToLog: function(params) {
		var wikipedia_page = new Morebits.wiki.page("User:" + mw.config.get('wgUserName') + "/" + Twinkle.getPref('prodLogPageName'), "Menambahkan entri ke log di ruang pengguna");
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.prod.callbacks.saveLog);
	},

	saveLog: function(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		// add blurb if log page doesn't exist
		if (!pageobj.exists()) {
			text =
				"Ini merupakan log semua tag [[WP:UP|usulan penghapusan]] yang diberikan atau didukung oleh pengguna ini dengan menggunakan modul UP [[WP:TW|Twinkle]].\n\n" +
				"Apabila Anda tidak ingin menyimpan log ini, matikan di [[Wikipedia:Twinkle/Preferences|preferences panel]], dan " +
				"usulkan penghapusan cepat halaman ini dengan kriteria [[WP:KPC#U1|KPC U1]].\n";
		}

		// create monthly header if it doesn't exist already
		var date = new Date();
		var headerRe = new RegExp("^==+\\s*" + date.getUTCMonthName() + "\\s+" + date.getUTCFullYear() + "\\s*==+", "m");
		if (!headerRe.exec(text)) {
			text += "\n\n=== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ===";
		}

		var summarytext;
		if (params.logEndorsing) {
			text += "\n# [[:" + Morebits.pageNameNorm + "]]: mendukung " + (params.blp ? "BLP " : (params.book ? "BOOK" : "")) + "UP. ~~~~~";
			if (params.reason) {
				text += "\n#* '''Alasan''': " + params.reason + "\n";
			}
			summarytext = "Mencatat dukungan nominasi penghapusan [[:" + Morebits.pageNameNorm + "]].";
		} else {
			text += "\n# [[:" + Morebits.pageNameNorm + "]]: " + (params.blp ? "BLP " : (params.book ? "BOOK" : "")) + "UP";
			if (params.logInitialContrib) {
				text += "; memberitahukan {{user|" + params.logInitialContrib + "}}";
			}
			text += " ~~~~~\n";
			if (!params.blp) {
				text += "#* '''Alasan''': " + params.reason + "\n";
			}
			summarytext = "Mencatat nominasi UP dari [[:" + Morebits.pageNameNorm + "]].";
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summarytext + Twinkle.getPref('summaryAd'));
		pageobj.setCreateOption("recreate");
		pageobj.save();
	}
};

Twinkle.prod.callback.evaluate = function twinkleprodCallbackEvaluate(e) {
	var form = e.target;
	var prodtype;

	if( namespace === 'article' ) {
		var prodtypes = form.prodtype;
		for( var i = 0; i < prodtypes.length; i++ ) {
			if( prodtypes[i].checked ) {
				prodtype = prodtypes[i].values;
				break;
			}
		}
	}

	var params = {
		usertalk: form.notify.checked,
		blp: prodtype === 'prodblp',
		book: namespace === 'book',
		reason: prodtype === 'prodblp' ? '' : form.reason.value  // using an empty string here as fallback will help with prod-2.
	};

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( form );

	var talk_title = new mw.Title(mw.config.get('wgPageName')).getTalkPage().getPrefixedText();
	var query = {
		'action': 'query',
		'prop': 'categories',
		'titles': talk_title,
		'clcategories': 'Kategori:Usulan penghapusan yang selesai didiskusikan'
	};

	var wikipedia_api = new Morebits.wiki.api('Mengecek usulan sebelumnya', query, Twinkle.prod.callbacks.checkpriors);
	wikipedia_api.params = params;
	wikipedia_api.post();
};
})(jQuery);


//</nowiki>
