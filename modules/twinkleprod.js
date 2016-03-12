//<nowiki>


(function($){


/*
 ****************************************
 *** twinkleprod.js: PROD module
 ****************************************
 * Mode of invocation:     Tab ("PROD")
 * Active on:              Existing articles which are not redirects
 * Config directives in:   TwinkleConfig
 */

Twinkle.prod = function twinkleprod() {
	if( mw.config.get('wgNamespaceNumber') !== 0 || !mw.config.get('wgCurRevisionId') || Morebits.wiki.isPageRedirect() ) {
		return;
	}

	Twinkle.addPortletLink( Twinkle.prod.callback, "UP", "tw-prod", "Usulan penghapusan melalui WP:UP" );
};

Twinkle.prod.callback = function twinkleprodCallback() {
	Twinkle.prod.defaultReason = Twinkle.getPref('prodReasonDefault');

	var Window = new Morebits.simpleWindow( 800, 410 );
	Window.setTitle( "Usulan Penghapusan (UP)" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Kebijakan usulan penghapusan", "WP:UP" );
	/* Window.addFooterLink( "BLP PROD policy", "WP:BLPPROD" ); */
	Window.addFooterLink( "Bantuan Twinkle", "WP:TW/DOC#prod" );

	var form = new Morebits.quickForm( Twinkle.prod.callback.evaluate );

	var field = form.append( {
			type: 'field',
			label: 'Jenis UP'
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

	form.append( {
			type: 'field',
			label:'Work area',
			name: 'work_area'
		} );

	form.append( { type:'submit', label:'Usulkan penghapusan' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// fake a change event on the first prod type radio, to initialize the type-dependent controls
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.prodtype[0].dispatchEvent( evt );
};

Twinkle.prod.callback.prodtypechanged = function(event) {
	//prepare frame for prod type dependant controls
	var field = new Morebits.quickForm.element( {
			type: 'field',
			label: 'Parameters',
			name: 'work_area'
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
				}
			);
			field.append( {
					type: 'textarea',
					name: 'reason',
					label: 'Alasan:',
					value: Twinkle.prod.defaultReason
				} );
			break;

		case 'prodblp':
			// first, remember the prod value that the user entered in the textarea, in case he wants to switch back. We can abuse the config field for that.
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
				}
			);
			//temp warning, can be removed down the line once BLPPROD is more established. Amalthea, May 2010.
			var boldtext = document.createElement('b');
			boldtext.appendChild(document.createTextNode('Ingatlah bahwa hanya biografi tokoh yang masih hidup tanpa referensi yang cocok untuk tag ini.'));
			field.append({
				type: 'div',
				label: boldtext
			});
			if (mw.config.get('wgArticleId') < 26596183) {
				field.append({
					type: 'header',
					label: 'It appears that this article was created before March 18, 2010, and is thus ineligible for a BLP PROD. Please make sure that this is not the case, or use normal PROD instead.' // untuk dilihat kembali
				});
			}
			break;

		default:
			break;
	}

	event.target.form.replaceChild( field.render(), $(event.target.form).find('fieldset[name="work_area"]')[0] );
};

Twinkle.prod.callbacks = {
	main: function(pageobj) {
		var statelem = pageobj.getStatusElement();

		if( !pageobj.exists() ) {
			statelem.error( "Kelihatannya halaman ini tidak ada. Mungkin sudah dihapus." );
			return;
		}

		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		var tag_re = /(\{\{(?:db-?|delete|[aitcmrs]fd|md1)[^{}]*?\|?[^{}]*?\}\})/i;
		if( tag_re.test( text ) ) {
			statelem.warn( 'Halaman sudah ditandai dengan templat hapus. Proses dihentikan.' );
			return;
		}

		// Remove tags that become superfluous with this action
		text = text.replace(/\{\{\s*([Nn]ew unreviewed article|[Uu]nreviewed|[Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, "");

		var prod_re = /\{\{\s*(?:dated prod|dated prod blp|Prod blp\/dated|Proposed deletion\/dated)\s*\|(?:\{\{[^\{\}]*\}\}|[^\}\{])*\}\}/i;
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

			summaryText = "Usulkan penghapusan artikel per [[WP:" + (params.blp ? "BLP" : "") + "UP]].";
			text = "{{subst:prod" + (params.blp ? " blp" : ("|1=" + Morebits.string.formatReasonText(params.reason))) + "}}\n" + text;
		}
		else {  // already tagged for PROD, so try endorsing it
			var prod2_re = /\{\{(?:Proposed deletion endorsed|prod-?2).*?\}\}/;
			if( prod2_re.test( text ) ) {
				statelem.warn( 'Halaman sudah ditandai dengan {{proposed deletion}} dan {{proposed deletion endorsed}}, proses dihentikan' );
				return;
			}
			var confirmtext = "Tag {{proposed deletion}} sudah ada di halaman ini. \nApakah Anda ingin menambahkan tag {{proposed deletion endorsed}} disertai alasan Anda?";
			if (params.blp) {
				confirmtext = "Tag {{proposed deletion}} bukan BOH ditemukan di artikel.  \nApakah Anda ingin menambahkan tag {{proposed deletion endorsed}} dengan alasan \"artikel adalah biografi tokoh yang masih hidup tanpa referensi\"?";
			}
			if( !confirm( confirmtext ) ) {
				statelem.warn( 'Dibatalkan oleh pengguna' );
				return;
			}

			summaryText = "Mendukung usulan penghapusan per [[WP:" + (params.blp ? "BLP" : "") + "UP]].";
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

		var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, "Memberitahukan kontributor awal (" + initialContrib + ")");
		var notifytext = "\n{{subst:prodwarning" + (params.blp ? "BLP" : "") + "|1=" + Morebits.pageNameNorm + "|concern=" + params.reason + "}} ~~~~";
		usertalkpage.setAppendText(notifytext);
		usertalkpage.setEditSummary("Pemberitahuan: usulan penghapusan [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
		usertalkpage.setCreateOption('recreate');
		usertalkpage.setFollowRedirect(true);
		usertalkpage.append();
		if (Twinkle.getPref('logProdPages')) {
			params.logInitialContrib = initialContrib;
			Twinkle.prod.callbacks.addToLog(params);
		}
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

		// create monthly header
		var date = new Date();
		var headerRe = new RegExp("^==+\\s*" + date.getUTCMonthName() + "\\s+" + date.getUTCFullYear() + "\\s*==+", "m");
		if (!headerRe.exec(text)) {
			text += "\n\n=== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ===";
		}

		var summarytext;
		if (params.logEndorsing) {
			text += "\n# [[" + Morebits.pageNameNorm + "]]: mendukung " + (params.blp ? "BLP " : "") + "UP. ~~~~~";
			if (params.reason) {
				text += "\n#* '''Alasan''': " + params.reason + "\n";
			}
			summarytext = "Mencatat dukungan nominasi penghapusan [[" + Morebits.pageNameNorm + "]].";
		} else {
			text += "\n# [[" + Morebits.pageNameNorm + "]]: " + (params.blp ? "BLP " : "") + "UP";
			if (params.logInitialContrib) {
				text += "; memberitahukan {{user|" + params.logInitialContrib + "}}";
			}
			text += " ~~~~~\n";
			if (!params.blp) {
				text += "#* '''Alasan''': " + params.reason + "\n";
			}
			summarytext = "Mencatat nominasi UP dari [[" + Morebits.pageNameNorm + "]].";
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

	var prodtypes = form.prodtype;
	for( var i = 0; i < prodtypes.length; i++ ) {
		if( !prodtypes[i].checked ) {
			continue;
		}
		prodtype = prodtypes[i].values;
		break;
	}

	var params = {
		usertalk: form.notify.checked,
		blp: prodtype === 'prodblp',
		reason: prodtype === 'prodblp' ? '' : form.reason.value  // using an empty string here as fallback will help with prod-2.
	};

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( form );

	if (prodtype === 'prodblp' && mw.config.get('wgArticleId') < 26596183) {
		if (!confirm( "It appears that this article was created before March 18, 2010, and is thus ineligible for a BLP PROD. Do you want to continue tagging it?" )) // sesuaikan kembali dengan kebijakan idwiki
		{
			Morebits.status.warn( 'Perhatian', 'Dibatalkan oleh pengguna.' );
			return;
		}
	}

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "Penandaan selesai";

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Menandai halaman");
	wikipedia_page.setFollowRedirect(true);  // for NPP, and also because redirects are ineligible for PROD
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.prod.callbacks.main);
};
})(jQuery);


//</nowiki>
