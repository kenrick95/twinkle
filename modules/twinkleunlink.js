//<nowiki>


(function($){


/*
 ****************************************
 *** twinkleunlink.js: Unlink module
 ****************************************
 * Mode of invocation:     Tab ("Unlink")
 * Active on:              Non-special pages, except Wikipedia:Sandbox
 * Config directives in:   TwinkleConfig
 */

Twinkle.unlink = function twinkleunlink() {
	if( mw.config.get('wgNamespaceNumber') < 0 || mw.config.get('wgPageName') === 'Wikipedia:Bak pasir' ||
		(!Morebits.userIsInGroup('extendedconfirmed') && !Morebits.userIsInGroup('sysop')) ) {
		return;
	}
	Twinkle.addPortletLink( Twinkle.unlink.callback, "Unlink", "tw-unlink", "Hapus pranala balik" );
};

Twinkle.unlink.getChecked2 = function twinkleunlinkGetChecked2( nodelist ) {
	if( !( nodelist instanceof NodeList ) && !( nodelist instanceof HTMLCollection ) ) {
		return nodelist.checked ? [ nodelist.values ] : [];
	}
	var result = [];
	for(var i  = 0; i < nodelist.length; ++i ) {
		if( nodelist[i].checked ) {
			result.push( nodelist[i].values );
		}
	}
	return result;
};

// the parameter is used when invoking unlink from admin speedy
Twinkle.unlink.callback = function(presetReason) {
	var Window = new Morebits.simpleWindow( 600, 440 );
	Window.setTitle( "Hapus pranala balik" + (mw.config.get('wgNamespaceNumber') === 6 ? " dan penggunaan berkas" : "") );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Bantuan Twinkle", "WP:TW/DOC#unlink" );

	var form = new Morebits.quickForm( Twinkle.unlink.callback.evaluate );

	// prepend some basic documentation
	var node1 = Morebits.htmlNode("code", "[[" + Morebits.pageNameNorm + "|teks pranala]]");
	var node2 = Morebits.htmlNode("code", "teks pranala");
	node1.style.fontFamily = node2.style.fontFamily = "monospace";
	node1.style.fontStyle = node2.style.fontStyle = "normal";
	form.append( {
		type: 'div',
		style: 'margin-bottom: 0.5em',
		label: [
			'Alat ini membantu Anda menghapus semua pranala balik ke halaman ini' +
				(mw.config.get('wgNamespaceNumber') === 6 ? ", dan/atau menyembunyikan penggunaan berkas ini dengan markah komentar <!-- -->" : "") +
				". Misalnya, ",
			node1,
			" akan menjadi ",
			node2,
			". Berhati-hatilah saat menggunakan."
		]
	} );

	form.append( {
		type: 'input',
		name: 'reason',
		label: 'Alasan: ',
		value: (presetReason ? presetReason : ''),
		size: 60
	} );

	var query;
	if(mw.config.get('wgNamespaceNumber') === 6) {  // File:
		query = {
			'action': 'query',
			'list': [ 'backlinks', 'imageusage' ],
			'bltitle': mw.config.get('wgPageName'),
			'iutitle': mw.config.get('wgPageName'),
			'bllimit': 'max', // 500 is max for normal users, 5000 for bots and sysops
			'iulimit': 'max', // 500 is max for normal users, 5000 for bots and sysops
			'blnamespace': Twinkle.getPref('unlinkNamespaces'),
			'iunamespace': Twinkle.getPref('unlinkNamespaces'),
			'rawcontinue': true
		};
	} else {
		query = {
			'action': 'query',
			'list': 'backlinks',
			'bltitle': mw.config.get('wgPageName'),
			'blfilterredir': 'nonredirects',
			'bllimit': 'max', // 500 is max for normal users, 5000 for bots and sysops
			'blnamespace': Twinkle.getPref('unlinkNamespaces'),
			'rawcontinue': true
		};
	}
	var wikipedia_api = new Morebits.wiki.api( 'Mengambil pranala balik', query, Twinkle.unlink.callbacks.display.backlinks );
	wikipedia_api.params = { form: form, Window: Window, image: mw.config.get('wgNamespaceNumber') === 6 };
	wikipedia_api.post();

	var root = document.createElement( 'div' );
	root.style.padding = '15px';  // just so it doesn't look broken
	Morebits.status.init( root );
	wikipedia_api.statelem.status( "memuat..." );
	Window.setContent( root );
	Window.display();
};

Twinkle.unlink.callback.evaluate = function twinkleunlinkCallbackEvaluate(event) {
	var reason = event.target.reason.value;
	if (!reason) {
		alert("Anda harus memberikan alasan untuk menghapus pranala.");
		return;
	}

	var backlinks = [], imageusage = [];
	if( event.target.backlinks ) {
		backlinks = Twinkle.unlink.getChecked2(event.target.backlinks);
	}
	if( event.target.imageusage ) {
		imageusage = Twinkle.unlink.getChecked2(event.target.imageusage);
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( event.target );

	var pages = Morebits.array.uniq(backlinks.concat(imageusage));

	var unlinker = new Morebits.batchOperation("Menghapus pranala balik" + (imageusage ? " dan penggunaan berkas" : ""));
	unlinker.setOption("preserveIndividualStatusLines", true);
	unlinker.setPageList(pages);
	var params = { reason: reason, unlinker: unlinker };
	unlinker.run(function(pageName) {
		var wikipedia_page = new Morebits.wiki.page(pageName, "Menghapus di artikel \"" + pageName + "\"");
		wikipedia_page.setBotEdit(true);  // unlink considered a floody operation
		var innerParams = $.extend({}, params);
		innerParams.doBacklinks = backlinks && backlinks.indexOf(pageName) !== -1;
		innerParams.doImageusage = imageusage && imageusage.indexOf(pageName) !== -1;
		wikipedia_page.setCallbackParameters(innerParams);
		wikipedia_page.load(Twinkle.unlink.callbacks.unlinkBacklinks);
	});
};

Twinkle.unlink.callbacks = {
	display: {
		backlinks: function twinkleunlinkCallbackDisplayBacklinks(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var havecontent = false;
			var list, namespaces, i;

			if( apiobj.params.image ) {
				var imageusage = $(xmlDoc).find('query imageusage iu');
				list = [];
				for ( i = 0; i < imageusage.length; ++i ) {
					var usagetitle = imageusage[i].getAttribute('title');
					list.push( { label: usagetitle, value: usagetitle, checked: true } );
				}
				if (!list.length)
				{
					apiobj.params.form.append( { type: 'div', label: 'Tidak ditemukan penggunaan gambar.' } );
				}
				else
				{
					apiobj.params.form.append( { type:'header', label: 'Penggunaan berkas' } );
					namespaces = [];
					$.each(Twinkle.getPref('unlinkNamespaces'), function(k, v) {
						namespaces.push(v === '0' ? '(Article)' : mw.config.get('wgFormattedNamespaces')[v]);
					});
					apiobj.params.form.append( {
						type: 'div',
						label: "Ruangnama terpilih: " + namespaces.join(', '),
						tooltip: "Anda dapat mengubah setelan ini di preferensi Twinkle Anda: [[WP:TWPREFS]]"
					});
					if ($(xmlDoc).find('query-continue').length) {
						apiobj.params.form.append( {
							type: 'div',
							label: "Ditampilkan " + list.length.toString() + " instansi penggunaan berkas."
						});
					}
					apiobj.params.form.append({
						type: 'button',
						label: "Pilih semua",
						event: function(e) {
							$(Morebits.quickForm.getElements(e.target.form, "imageusage")).prop('checked', true);
						}
					});
					apiobj.params.form.append({
						type: 'button',
						label: "Hapus semua pilihan",
						event: function(e) {
							$(Morebits.quickForm.getElements(e.target.form, "imageusage")).prop('checked', false);
						}
					});
					apiobj.params.form.append({
						type: 'checkbox',
						name: 'imageusage',
						list: list
					});
					havecontent = true;
				}
			}

			var backlinks = $(xmlDoc).find('query backlinks bl');
			if( backlinks.length > 0 ) {
				list = [];
				for ( i = 0; i < backlinks.length; ++i ) {
					var title = backlinks[i].getAttribute('title');
					list.push( { label: title, value: title, checked: true } );
				}
				apiobj.params.form.append( { type:'header', label: 'Pranala balik' } );
				namespaces = [];
				$.each(Twinkle.getPref('unlinkNamespaces'), function(k, v) {
					namespaces.push(v === '0' ? '(Article)' : mw.config.get('wgFormattedNamespaces')[v]);
				});
				apiobj.params.form.append( {
					type: 'div',
					label: "Ruangnama terpilih: " + namespaces.join(', '),
					tooltip: "Anda dapat mengubah setelan ini di preferensi Twinkle Anda: [[WP:TWPREFS]]"
				});
				if ($(xmlDoc).find('query-continue').length) {
					apiobj.params.form.append( {
						type: 'div',
						label: "Ditampilkan " + list.length.toString() + " pranala balik."
					});
				}
				apiobj.params.form.append({
					type: 'button',
					label: "Pilih semua",
						event: function(e) {
							$(Morebits.quickForm.getElements(e.target.form, "backlinks")).prop('checked', true);
						}
				});
				apiobj.params.form.append({
					type: 'button',
					label: "Hapus semua pilihan",
						event: function(e) {
							$(Morebits.quickForm.getElements(e.target.form, "backlinks")).prop('checked', false);
						}
				});
				apiobj.params.form.append({
					type: 'checkbox',
					name: 'backlinks',
					list: list
				});
				havecontent = true;
			}
			else
			{
				apiobj.params.form.append( { type: 'div', label: 'Tidak ditemukan pranala balik.' } );
			}

			if (havecontent) {
				apiobj.params.form.append( { type:'submit' } );
			}

			var result = apiobj.params.form.render();
			apiobj.params.Window.setContent( result );

			Morebits.checkboxShiftClickSupport($("input[name='imageusage']", result));
			Morebits.checkboxShiftClickSupport($("input[name='backlinks']", result));

		}
	},
	unlinkBacklinks: function twinkleunlinkCallbackUnlinkBacklinks(pageobj) {
		var oldtext = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var wikiPage = new Morebits.wikitext.page(oldtext);

		var summaryText = "", warningString = false;
		var text;

		// remove image usages
		if (params.doImageusage) {
			wikiPage.commentOutImage(mw.config.get('wgTitle'), 'Disembunyikan sebagai komentar');
			text = wikiPage.getText();
			// did we actually make any changes?
			if (text === oldtext) {
				warningString = "penggunaan berkas";
			} else {
				summaryText = "Membuat penggunaan berkas jadi komentar";
				oldtext = text;
			}
		}

		// remove backlinks
		if (params.doBacklinks) {
			wikiPage.removeLink(Morebits.pageNameNorm);
			text = wikiPage.getText();
			// did we actually make any changes?
			if (text === oldtext) {
				warningString = (warningString ? "pranala balik atau penggunaan berkas" : "pranala balik");
			} else {
				summaryText = (summaryText ? (summaryText + " / ") : "") + "Hapus pranala ke";
				oldtext = text;
			}
		}

		if (warningString) {
			// nothing to do!
			pageobj.getStatusElement().error("Tidak ditemukan adanya " + warningString + " di halaman ini.");
			params.unlinker.workerFailure(pageobj);
			return;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText + " \"" + Morebits.pageNameNorm + "\": " + params.reason + "." + Twinkle.getPref('summaryAd'));
		pageobj.setCreateOption('nocreate');
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	}
};
})(jQuery);


//</nowiki>
