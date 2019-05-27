//<nowiki>


(function($){


/*
 ****************************************
 *** twinklewarn.js: Warn module
 ****************************************
 * Mode of invocation:     Tab ("Warn")
 * Active on:              User (talk) pages and (deleted) Contributions
 * Config directives in:   TwinkleConfig
 */

Twinkle.warn = function twinklewarn() {
	if( mw.config.get( 'wgRelevantUserName' ) ) {
			Twinkle.addPortletLink( Twinkle.warn.callback, "Peringati", "tw-warn", "Peringatkan/beritahukan pengguna" );
			if (Twinkle.getPref('autoMenuAfterRollback') && mw.config.get('wgNamespaceNumber') === 3 && mw.util.getParamValue('vanarticle') && !mw.util.getParamValue('friendlywelcome')) {
				Twinkle.warn.callback();
			}
	}

	// Modify URL of talk page on rollback success pages, makes use of a
	// custom message box in [[MediaWiki:Rollback-success]]
	if( mw.config.get('wgAction') === 'rollback' ) {
		var $vandalTalkLink = $("#mw-rollback-success").find(".mw-usertoollinks a").first();
		if ( $vandalTalkLink.length ) {
			$vandalTalkLink.css("font-weight", "bold");
			$vandalTalkLink.wrapInner($("<span/>").attr("title", "Jika sesuai, Anda dapat menggunakan Twinkle untuk memperingatkan pengguna terkait suntingan mereka pada halaman ini."));

			var extraParam = "vanarticle=" + mw.util.rawurlencode(Morebits.pageNameNorm);
			var href = $vandalTalkLink.attr("href");
			if (href.indexOf("?") === -1) {
				$vandalTalkLink.attr("href", href + "?" + extraParam);
			} else {
				$vandalTalkLink.attr("href", href + "&" + extraParam);
			}
		}
	}
};

Twinkle.warn.callback = function twinklewarnCallback() {
	if( mw.config.get( 'wgRelevantUserName' ) === mw.config.get( 'wgUserName' ) &&
			!confirm( 'Anda hendak memperingatkan diri sendiri! Apakah Anda yakin ingin melakukannya?' ) ) {
		return;
	}

	var Window = new Morebits.simpleWindow( 600, 440 );
	Window.setTitle( "Peringatkan/beritahu pengguna" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Memilih tingkat peringatan", "WP:UWUL#Levels" );
	Window.addFooterLink( "Bantuan Twinkle", "WP:TW/DOC#Warn_.28peringatan_di_pembicaraan_pengguna.29" );

	var form = new Morebits.quickForm( Twinkle.warn.callback.evaluate );
	var main_select = form.append( {
			type: 'field',
			label: 'Pilih jenis peringatan/pemberitahuan untuk ditampilkan',
			tooltip: 'Pilih dahulu kelompok peringatan utama, lalu peringatan spesifik untuk ditampilkan.'
		} );

	var main_group = main_select.append( {
			type: 'select',
			name: 'main_group',
			event:Twinkle.warn.callback.change_category
		} );

	var defaultGroup = parseInt(Twinkle.getPref('defaultWarningGroup'), 10);
	main_group.append( { type: 'option', label: '1: Catatan umum', value: 'level1', selected: ( defaultGroup === 1 ) } );
	main_group.append( { type: 'option', label: '2: Pemberitahuan', value: 'level2', selected: ( defaultGroup === 2 ) } );
	main_group.append( { type: 'option', label: '3: Peringatan', value: 'level3', selected: ( defaultGroup === 3 ) } );
	main_group.append( { type: 'option', label: '4: Peringatan terakhir', value: 'level4', selected: ( defaultGroup === 4 ) } );
	main_group.append( { type: 'option', label: '4im: Sekadar peringatan', value: 'level4im', selected: ( defaultGroup === 5 ) } );
	main_group.append( { type: 'option', label: 'Pemberitahuan isu tunggal', value: 'singlenotice', selected: ( defaultGroup === 6 ) } );
	main_group.append( { type: 'option', label: 'Peringatan isu tunggal', value: 'singlewarn', selected: ( defaultGroup === 7 ) } );
	if( Twinkle.getPref( 'customWarningList' ).length ) {
		main_group.append( { type: 'option', label: 'Peringatan kustom', value: 'custom', selected: ( defaultGroup === 9 ) } );
	}

	main_select.append( { type: 'select', name: 'sub_group', event:Twinkle.warn.callback.change_subcategory } ); //Will be empty to begin with.

	form.append( {
			type: 'input',
			name: 'article',
			label: 'Artikel terkait',
			value:( Morebits.queryString.exists( 'vanarticle' ) ? Morebits.queryString.get( 'vanarticle' ) : '' ),
			tooltip: 'Suatu artikel dapat ditautkan dalam pemberitahuan ini, mungkin karena merupakan pengembalian atas artikel terkait pemberitahuan ini. Biarkan kosong jika tidak ada artikel yang ingin ditautkan.'
		} );

	var more = form.append( { type: 'field', name: 'reasonGroup', label: 'Informasi peringatan' } );
	more.append( { type: 'textarea', label: 'Pesan opsional:', name: 'reason', tooltip: 'Mungkin suatu alasan atau, jika tidak, diperlukan tambahan pemberitahuan yang lebih rinci.' } );

	var previewlink = document.createElement( 'a' );
	$(previewlink).click(function(){
		Twinkle.warn.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = "pointer";
	previewlink.textContent = 'Lihat pratayang';
	more.append( { type: 'div', id: 'warningpreview', label: [ previewlink ] } );
	more.append( { type: 'div', id: 'twinklewarn-previewbox', style: 'display: none' } );

	more.append( { type: 'submit', label: 'Kirimkan' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
	result.main_group.root = result;
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklewarn-previewbox').last()[0]);

	// We must init the first choice (General Note);
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.main_group.dispatchEvent( evt );
};

// This is all the messages that might be dispatched by the code
// Each of the individual templates require the following information:
//   label (required): A short description displayed in the dialog
//   summary (required): The edit summary used. If an article name is entered, the summary is postfixed with "on [[article]]", and it is always postfixed with ". $summaryAd"
//   suppressArticleInSummary (optional): Set to true to suppress showing the article name in the edit summary. Useful if the warning relates to attack pages, or some such.
Twinkle.warn.messages = {
	levels: {
		"Peringatan umum": {
			"uw-vandalism": {
				level1: {
					label: "Vandalisme",
					summary: "Catatan: Suntingan tidak membangun"
				},
				level2: {
					label: "Vandalisme",
					summary: "Pemberitahuan: Suntingan merusak"
				},
				level3: {
					label: "Vandalisme",
					summary: "Pengatan: Vandalisme"
				},
				level4: {
					label: "Vandalisme",
					summary: "Pengatan terakhir: Vandalisme"
				},
				level4im: {
					label: "Vandalisme",
					summary: "Hanya peringatna: Vandalisme"
				}
			},
			"uw-disruptive": {
				level1: {
					label: "Suntingan tidak membangun",
					summary: "Catatan: Suntingan tidak membangun"
				},
				level2: {
					label: "Suntingan tidak membangun",
					summary: "Pemberitahuan: Suntingan tidak membangun"
				},
				level3: {
					label: "Suntingan tidak membangun",
					summary: "Peringatan: Suntingan tidak membangun"
				}
			},
			"uw-test": {
				level1: {
					label: "Suntingan uji coba",
					summary: "Catatan: Suntingan uji coba"
				},
				level2: {
					label: "Suntingan uji coba",
					summary: "Pemberitahuan: Suntingan uji coba"
				},
				level3: {
					label: "Suntingan uji coba",
					summary: "Peringatan: Suntingan uji coba"
				}
			},
			"uw-delete": {
				level1: {
					label: "Menghapus konten, mengosongkan halaman",
					summary: "Catatan: Menghapus konten, mengosongkan halaman"
				},
				level2: {
					label: "Menghapus konten, mengosongkan halaman",
					summary: "Pemberitahuan: Menghapus konten, mengosongkan halaman"
				},
				level3: {
					label: "Menghapus konten, mengosongkan halaman",
					summary: "Peringatan: Menghapus konten, mengosongkan halaman"
				},
				level4: {
					label: "Menghapus konten, mengosongkan halaman",
					summary: "Peringatan terakhir: Menghapus konten, mengosongkan halaman"
				},
				level4im: {
					label: "Menghapus konten, mengosongkan halaman",
					summary: "Sekadar peringatan: Menghapus konten, mengosongkan halaman"
				}
			},
			"uw-generic": {
				level4: {
					label: "Peringatan umum (untuk templat yang tidak ada di tingkat 4)",
					summary: "Pemberitahuan peringatan terakhir"
				}
			},
		},
		"Perilaku dalam artikel": {
			"uw-biog": {
				level1: {
					label: "Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup",
					summary: "Catatan: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup"
				},
				level2: {
					label: "Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup",
					summary: "Pemberitahuan: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup"
				},
				level3: {
					label: "Menambahkan informasi fitnah/kontroversial tanpa rujukan tentang orang yang masih hidup",
					summary: "Peringatan: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup"
				},
				level4: {
					label: "Menambahkan informasi fitnah tanpa rujukan tentang orang yang masih hidup",
					summary: "Peringatan terakhir: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup"
				},
				level4im: {
					label: "Menambahkan informasi fitnah tanpa rujukan tentang orang yang masih hidup",
					summary: "Sekadar peringatan: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup"
				}
			},
			"uw-defamatory": {
				level1: {
					label: "Menambahkan konten yang memfitnah",
					summary: "Catatan: Menambahkan konten yang memfitnah"
				},
				level2: {
					label: "Menambahkan konten yang memfitnah",
					summary: "Pemberitahuan: Menambahkan konten yang memfitnah"
				},
				level3: {
					label: "Menambahkan konten yang memfitnah",
					summary: "Peringatan: Menambahkan konten yang memfitnah"
				},
				level4: {
					label: "Menambahkan konten yang memfitnah",
					summary: "Peringatan terakhir: Menambahkan konten yang memfitnah"
				},
				level4im: {
					label: "Menambahkan konten yang memfitnah",
					summary: "Sekadar peringatan: Menambahkan konten yang memfitnah"
				}
			},
			"uw-error": {
				level1: {
					label: "Menambahkan kesalahan faktual secara sengaja",
					summary: "Catatan: Penambahan kesalahan faktual secara sengaja"
				},
				level2: {
					label: "Menambahkan kesalahan faktual secara sengaja",
					summary: "Pemberitahuan: Penambahan kesalahan faktual secara sengaja"
				},
				level3: {
					label: "Menambahkan kesalahan faktual secara sengaja",
					summary: "Peringatan: Menambahkan kesalahan faktual secara sengaja"
				},
				level4: {
					label: "Menambahkan kesalahan faktual secara sengaja",
					summary: "Peringatan terakhir: Menambahkan kesalahan faktual secara sengaja"
				}
			},
			"uw-genre": {
				level1: {
					label: "Mengubah secara massal atau sering tanpa konsensus atau rujukan",
					summary: "Catatan: Mengubah secara massal atau sering tanpa konsensus atau rujukan"
				},
				level2: {
					label: "Mengubah secara massal atau sering tanpa konsensus atau rujukan",
					summary: "Pemberitahuan: Mengubah secara massal atau sering tanpa konsensus atau rujukan"
				},
				level3: {
					label: "Mengubah secara massal atau sering tanpa konsensus atau rujukan",
					summary: "Peringatan: Mengubah secara massal atau sering tanpa konsensus atau rujukan"
				},
				level4: {
					label: "Mengubah secara massal atau sering tanpa konsensus atau rujukan",
					summary: "Peringatan terakhir: Mengubah secara massal atau sering tanpa konsensus atau rujukan"
				}
			},
			"uw-image": {
				level1: {
					label: "Vandalisme terkait berkas dalam artikel",
					summary: "Catatan: Vandalisme terkait berkas dalam artikel"
				},
				level2: {
					label: "Vandalisme terkait berkas dalam artikel",
					summary: "Pemberitahuan: Vandalisme terkait berkas dalam artikel"
				},
				level3: {
					label: "Vandalisme terkait berkas dalam artikel",
					summary: "Peringatan: Vandalisme terkait berkas dalam artikel"
				},
				level4: {
					label: "Vandalisme terkait berkas dalam artikel",
					summary: "Peringatan terakhir: Vandalisme terkait berkas dalam artikel"
				},
				level4im: {
					label: "Vandalisme terkait berkas",
					summary: "Sekadar peringatan: Vandalisme terkait berkas"
				}
			},
			"uw-joke": {
				level1: {
					label: "Menggunakan lelucon yang tidak pantas dalam artikel",
					summary: "Catatan: Menggunakan lelucon yang tidak pantas dalam artikel"
				},
				level2: {
					label: "Menggunakan lelucon yang tidak pantas dalam artikel",
					summary: "Pemberitahuan: Menggunakan lelucon yang tidak pantas dalam artikel"
				},
				level3: {
					label: "Menggunakan lelucon yang tidak pantas dalam artikel",
					summary: "Peringatan: Menggunakan lelucon yang tidak pantas dalam artikel"
				},
				level4: {
					label: "Menggunakan lelucon yang tidak pantas dalam artikel",
					summary: "Peringatan terakhir: Menggunakan lelucon yang tidak pantas dalam artikel"
				},
				level4im: {
					label: "Menggunakan lelucon yang tidak pantas",
					summary: "Sekadar peringatan: Menggunakan lelucon yang tidak pantas"
				}
			},
			"uw-nor": {
				level1: {
					label: "Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan",
					summary: "Catatan: Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan"
				},
				level2: {
					label: "Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan",
					summary: "Pemberitahuan: Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan"
				},
				level3: {
					label: "Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan",
					summary: "Peringatan: Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan"
				},
				level4: {
					label: "Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan",
					summary: "Peringatan terakhir: Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan"
				}
			},
			"uw-notcensored": {
				level1: {
					label: "Menyensor materi",
					summary: "Catatan: Menyensor materi"
				},
				level2: {
					label: "Menyensor materi",
					summary: "Pemberitahuan: Menyensor materi"
				},
				level3: {
					label: "Menyensor materi",
					summary: "Peringatan: Menyensor materi"
				}
			},
			"uw-own": {
				level1: {
					label: "Mengklaim kepemilikan artikel",
					summary: "Catatan: Mengklaim kepemilikan artikel"
				},
				level2: {
					label: "Mengklaim kepemilikan artikel",
					summary: "Pemberitahuan: Mengklaim kepemilikan artikel"
				},
				level3: {
					label: "Mengklaim kepemilikan artikel",
					summary: "Peringatan: Mengklaim kepemilikan artikel"
				},
				level4im: {
					label: "Mengklaim kepemilikan artikel",
					summary: "Sekadar peringatan: Mengklaim kepemilikan artikel"
				}
			},
			"uw-tdel": {
				level1: {
					label: "Menghapus templat pemeliharaan",
					summary: "Catatan: Menghapus templat pemeliharaan"
				},
				level2: {
					label: "Menghapus templat pemeliharaan",
					summary: "Pemberitahuan: Menghapus templat pemeliharaan"
				},
				level3: {
					label: "Menghapus templat pemeliharaan",
					summary: "Peringatan: Menghapus templat pemeliharaan"
				},
				level4: {
					label: "Menghapus templat pemeliharaan",
					summary: "Peringatan terakhir: Menghapus templat pemeliharaan"
				}
			},
			"uw-unsourced": {
				level1: {
					label: "Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan",
					summary: "Catatan: Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan"
				},
				level2: {
					label: "Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan",
					summary: "Pemberitahuan: Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan"
				},
				level3: {
					label: "Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan",
					summary: "Peringatan: Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan"
				},
				level4: {
					label: "Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan",
					summary: "Peringatan terakhir: Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan"
				}
			},
		},
		"Promotions and spam": {
			"uw-advert": {
				level1: {
					label: "Menggunakan Wikipedia untuk beriklan atau promosi",
					summary: "Catatan: Menggunakan Wikipedia untuk beriklan atau promosi"
				},
				level2: {
					label: "Menggunakan Wikipedia untuk beriklan atau promosi",
					summary: "Pemberitahuan: Menggunakan Wikipedia untuk beriklan atau promosi"
				},
				level3: {
					label: "Menggunakan Wikipedia untuk beriklan atau promosi",
					summary: "Peringatan: Menggunakan Wikipedia untuk beriklan atau promosi"
				},
				level4: {
					label: "Menggunakan Wikipedia untuk beriklan atau promosi",
					summary: "Peringatan terakhir: Menggunakan Wikipedia untuk beriklan atau promosi"
				},
				level4im: {
					label: "Menggunakan Wikipedia untuk beriklan atau promosi",
					summary: "Sekadar peringatan: Menggunakan Wikipedia untuk beriklan atau promosi"
				}
			},
			"uw-npov": {
				level1: {
					label: "Tidak berpegang pada sudut pandang netral",
					summary: "Catatan: Tidak berpegang pada sudut pandang netral"
				},
				level2: {
					label: "Tidak berpegang pada sudut pandang netral",
					summary: "Pemberitahuan: Tidak berpegang pada sudut pandang netral"
				},
				level3: {
					label: "Tidak berpegang pada sudut pandang netral",
					summary: "Peringatan: Tidak berpegang pada sudut pandang netral"
				},
				level4: {
					label: "Tidak berpegang pada sudut pandang netral",
					summary: "Peringatan terakhir: Tidak berpegang pada sudut pandang netral"
				}
			},
			"uw-paid": {
				level1: {
					label: "Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia",
					summary: "Catatan: Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia"
				},
				level2: {
					label: "Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia",
					summary: "Pemberitahuan: Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia"
				},
				level3: {
					label: "Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia",
					summary: "Peringatan: Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia"
				},
				level4: {
					label: "Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia",
					summary: "Peringatan terakhir: Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia"
				}
			},
			"uw-spam": {
				level1: {
					label: "Menambahkan pranala luar yang tak pantas",
					summary: "Catatan: Menambahkan pranala luar yang tak pantas"
				},
				level2: {
					label: "Menambahkan pranala luar spam",
					summary: "Pemberitahuan: Menambahkan pranala luar spam"
				},
				level3: {
					label: "Menambahkan pranala luar spam",
					summary: "Peringatan: Menambahkan pranala luar spam"
				},
				level4: {
					label: "Menambahkan pranala luar spam",
					summary: "Peringatan terakhir: Menambahkan pranala luar spam"
				},
				level4im: {
					label: "Menambahkan pranala luar spam",
					summary: "Sekadar peringatan: Menambahkan pranala luar spam"
				}
			},
		},
		"Perilaku terhadap pengguna lain": {
			"uw-agf": {
				level1: {
					label: "Not assuming good faith",
					summary: "Catatan: Not assuming good faith"
				},
				level2: {
					label: "Not assuming good faith",
					summary: "Pemberitahuan: Not assuming good faith"
				},
				level3: {
					label: "Not assuming good faith",
					summary: "Peringatan: Not assuming good faith"
				}
			},
			"uw-harass": {
				level1: {
					label: "Harassment of other users",
					summary: "Catatan: Harassment of other users"
				},
				level2: {
					label: "Harassment of other users",
					summary: "Pemberitahuan: Harassment of other users"
				},
				level3: {
					label: "Harassment of other users",
					summary: "Peringatan: Harassment of other users"
				},
				level4: {
					label: "Harassment of other users",
					summary: "Peringatan terakhir: Harassment of other users"
				},
				level4im: {
					label: "Harassment of other users",
					summary: "Sekadar peringatan: Harassment of other users"
				}
			},
			"uw-npa": {
				level1: {
					label: "Personal attack directed at a specific editor",
					summary: "Catatan: Personal attack directed at a specific editor"
				},
				level2: {
					label: "Personal attack directed at a specific editor",
					summary: "Pemberitahuan: Personal attack directed at a specific editor"
				},
				level3: {
					label: "Personal attack directed at a specific editor",
					summary: "Peringatan: Personal attack directed at a specific editor"
				},
				level4: {
					label: "Personal attack directed at a specific editor",
					summary: "Peringatan terakhir: Personal attack directed at a specific editor"
				},
				level4im: {
					label: "Personal attack directed at a specific editor",
					summary: "Sekadar peringatan: Personal attack directed at a specific editor"
				}
			},
			"uw-tempabuse": {
				level1: {
					label: "Improper use of warning or blocking template",
					summary: "Catatan: Improper use of warning or blocking template"
				},
				level2: {
					label: "Improper use of warning or blocking template",
					summary: "Pemberitahuan: Improper use of warning or blocking template"
				}
			},
		},
		"Penghilangan tag penghapusan": {
			"uw-afd": {
				level1: {
					label: "Menghilangkan templat {{Afd}}",
					summary: "Catatan: Menghilangkan templat {{Afd}}"
				},
				level2: {
					label: "Menghilangkan templat {{Afd}}",
					summary: "Pemberitahuan: Menghilangkan templat {{Afd}}"
				},
				level3: {
					label: "Menghilangkan templat {{Afd}}",
					summary: "Peringatan: Menghilangkan templat {{Afd}}"
				},
				level4: {
					label: "Menghilangkan templat {{Afd}}",
					summary: "Peringatan terakhir: Menghilangkan templat {{Afd}}"
				}
			},
			"uw-blpprod": {
				level1: {
					label: "Menghilangkan templat {{Prod blp}}",
					summary: "Catatan: Menghilangkan templat {{Prod blp}}"
				},
				level2: {
					label: "Menghilangkan templat {{Prod blp}}",
					summary: "Pemberitahuan: Menghilangkan templat {{Prod blp}}"
				},
				level3: {
					label: "Menghilangkan templat {{Prod blp}}",
					summary: "Peringatan: Menghilangkan templat {{Prod blp}}"
				},
				level4: {
					label: "Menghilangkan templat {{Prod blp}}",
					summary: "Peringatan terakhir: Menghilangkan templat {{Prod blp}}"
				}
			},
			"uw-idt": {
				level1: {
					label: "Menghilangkan tag penghapusan berkas",
					summary: "Catatan: Menghilangkan tag penghapusan berkas"
				},
				level2: {
					label: "Menghilangkan tag penghapusan berkas",
					summary: "Pemberitahuan: Menghilangkan tag penghapusan berkas"
				},
				level3: {
					label: "Menghilangkan tag penghapusan berkas",
					summary: "Peringatan: Menghilangkan tag penghapusan berkas"
				},
				level4: {
					label: "Menghilangkan tag penghapusan berkas",
					summary: "Peringatan terakhir: Menghilangkan tag penghapusan berkas"
				}
			},
			"uw-speedy": {
				level1: {
					label: "Menghilangkan tag penghapusan cepat",
					summary: "Catatan: Menghilangkan tag penghapusan cepat"
				},
				level2: {
					label: "Menghilangkan tag penghapusan cepat",
					summary: "Pemberitahuan: Menghilangkan tag penghapusan cepat"
				},
				level3: {
					label: "Menghilangkan tag penghapusan cepat",
					summary: "Peringatan: Menghilangkan tag penghapusan cepat"
				},
				level4: {
					label: "Menghilangkan tag penghapusan cepat",
					summary: "Peringatan terakhir: Menghilangkan tag penghapusan cepat"
				}
			},
		},
		"Lain-lain": {
			"uw-attempt": {
				level1: {
					label: "Memicu filter penyuntingan",
					summary: "Catatan: Memicu filter penyuntingan"
				},
				level2: {
					label: "Memicu filter penyuntingan",
					summary: "Pemberitahuan: Memicu filter penyuntingan"
				},
				level3: {
					label: "Memicu filter penyuntingan",
					summary: "Peringatan: Memicu filter penyuntingan"
				},
				level4: {
					label: "Memicu filter penyuntingan",
					summary: "Peringatan terakhir: Memicu filter penyuntingan"
				}
			},
			"uw-chat": {
				level1: {
					label: "Menggunakan halaman pembicaraan sebagai forum",
					summary: "Catatan: Menggunakan halaman pembicaraan sebagai forum"
				},
				level2: {
					label: "Menggunakan halaman pembicaraan sebagai forum",
					summary: "Pemberitahuan: Menggunakan halaman pembicaraan sebagai forum"
				},
				level3: {
					label: "Menggunakan halaman pembicaraan sebagai forum",
					summary: "Peringatan: Menggunakan halaman pembicaraan sebagai forum"
				},
				level4: {
					label: "Menggunakan halaman pembicaraan sebagai forum",
					summary: "Peringatan terakhir: Menggunakan halaman pembicaraan sebagai forum"
				}
			},
			"uw-create": {
				level1: {
					label: "Membuat halaman yang tidak pantas",
					summary: "Catatan: Membuat halaman yang tidak pantas"
				},
				level2: {
					label: "Membuat halaman yang tidak pantas",
					summary: "Pemberitahuan: Membuat halaman yang tidak pantas"
				},
				level3: {
					label: "Membuat halaman yang tidak pantas",
					summary: "Peringatan: Membuat halaman yang tidak pantas"
				},
				level4: {
					label: "Membuat halaman yang tidak pantas",
					summary: "Peringatan terakhir: Membuat halaman yang tidak pantas"
				},
				level4im: {
					label: "Membuat halaman yang tidak pantas",
					summary: "Sekadar peringatan: Membuat halaman yang tidak pantas"
				}
			},
			"uw-mos": {
				level1: {
					label: "Pedoman gaya",
					summary: "Catatan: Format, tanggal, bahasa, dll. (Pedoman gaya)"
				},
				level2: {
					label: "Pedoman gaya",
					summary: "Pemberitahuan: Format, tanggal, bahasa, dll. (Pedoman gaya)"
				},
				level3: {
					label: "Pedoman gaya",
					summary: "Peringatan: Format, tanggal, bahasa, dll. (Pedoman gaya)"
				},
				level4: {
					label: "Pedoman gaya",
					summary: "Peringatan terakhir: Format, tanggal, bahasa, dll. (Pedoman gaya)"
				}
			},
			"uw-move": {
				level1: {
					label: "Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus",
					summary: "Catatan: Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus"
				},
				level2: {
					label: "Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus",
					summary: "Pemberitahuan: Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus"
				},
				level3: {
					label: "Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus",
					summary: "Peringatan: Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus"
				},
				level4: {
					label: "Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus",
					summary: "Peringatan terakhir: Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus"
				},
				level4im: {
					label: "Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus",
					summary: "Sekadar peringatan: Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus"
				}
			},
			"uw-tpv": {
				level1: {
					label: "Menyunting komentar pengguna lain di halaman pembicaraan",
					summary: "Catatan: Menyunting komentar pengguna lain di halaman pembicaraan"
				},
				level2: {
					label: "Menyunting komentar pengguna lain di halaman pembicaraan",
					summary: "Pemberitahuan: Menyunting komentar pengguna lain di halaman pembicaraan"
				},
				level3: {
					label: "Menyunting komentar pengguna lain di halaman pembicaraan",
					summary: "Peringatan: Menyunting komentar pengguna lain di halaman pembicaraan"
				},
				level4: {
					label: "Menyunting komentar pengguna lain di halaman pembicaraan",
					summary: "Peringatan terakhir: Menyunting komentar pengguna lain di halaman pembicaraan"
				}
			},
			"uw-upload": {
				level1: {
					label: "Menggunggah berkas nonensiklopedis",
					summary: "Catatan: Menggunggah berkas nonensiklopedis"
				},
				level2: {
					label: "Menggunggah berkas nonensiklopedis",
					summary: "Pemberitahuan: Menggunggah berkas nonensiklopedis"
				},
				level3: {
					label: "Menggunggah berkas nonensiklopedis",
					summary: "Peringatan: Menggunggah berkas nonensiklopedis"
				},
				level4: {
					label: "Menggunggah berkas nonensiklopedis",
					summary: "Peringatan terakhir: Menggunggah berkas nonensiklopedis"
				},
				level4im: {
					label: "Menggunggah berkas nonensiklopedis",
					summary: "Sekadar peringatan: Menggunggah berkas nonensiklopedis"
				}
			}
		}
	},

	singlenotice: {
		"uw-aiv": {
			label: "Laporan AIV tidak benar",
			summary: "Pemberitahuan: Laporan AIV tidak benar"
		},
		"uw-autobiography": {
			label: "Membuat otobiografi",
			summary: "Pemberitahuan: Pembuatan otobiografi"
		},
		"uw-badcat": {
			label: "Menambahkan kategori yang salah",
			summary: "Pemberitahuan: Penambahan kategori yang salah"
		},
		"uw-badlistentry": {
			label: "Menambahkan entri yang tidak sepatutnya pada daftar",
			summary: "Pemberitahuan: Penambahan entri yang tidak sepatutnya pada daftar"
		},
		"uw-bite": {
			label: "\"Menggigit\" pendatang baru",
			summary: "Pemberitahuan: \"Menggigit\" pendatang baru",
			suppressArticleInSummary: true  // non-standard (user name, not article), and not necessary
		},
		"uw-coi": {
			label: "Konflik kepentingan",
			summary: "Pemberitahuan: Konflik kepentingan",
			heading: "Managing a conflict of interest"
		},
		"uw-controversial": {
			label: "Memasukkan materi kontroversial",
			summary: "Pemberitahuan: Pemasukan materi kontroversial"
		},
		"uw-copying": {
			label: "Menyalin teks ke halaman lain",
			summary: "Pemberitahuan: Penyalinan teks ke halaman lain"
		},
		"uw-crystal": {
			label: "Menambahkan informasi spekulatif atau belum dikonfirmasi",
			summary: "Pemberitahuan: Penambahan informasi spekulatif atau belum dikonfirmasi"
		},
		"uw-c&pmove": {
			label: "Pemindahan potong dan tempel",
			summary: "Pemberitahuan: Pemindahan potong dan tempel"
		},
		"uw-dab": {
			label: "Suntingan tidak benar pada halaman disambiguasi",
			summary: "Pemberitahuan: Suntingan tidak benar pada halaman disambiguasi"
		},
		"uw-date": {
			label: "Mengubah format tanggal secara tidak perlu",
			summary: "Pemberitahuan: Pengubahan format tanggal secara tidak perlu"
		},
		"uw-deadlink": {
			label: "Menghapus rujukan layak yang mengandung pranala mati",
			summary: "Pemberitahuan: Penghapusan rujukan layak yang mengandung pranala mati"
		},
		"uw-draftfirst": {
			label: "Merancang dalam ruang pengguna tanpa risiko penghapusan cepat",
			summary: "Pemberitahuan: Pertimbangkan merancang artikel Anda dalam [[Bantuan:Draf ruang pengguna|ruang pengguna]]"
		},
		"uw-editsummary": {
			label: "Tidak menggunakan ringkasan suntingan",
			summary: "Pemberitahuan: Tidak menggunakan ringkasan suntingan"
		},
		"uw-english": {
			label: "Tidak berkomunikasi dalam bahasa Indonesia",
			summary: "Pemberitahuan: Tidak berkomunikasi dalam bahasa Indonesia"
		},
		"uw-hasty": {
			label: "Menambahkan tag penghapusan cepat secara gegabah",
			summary: "Pemberitahuan: Izinkan pembuat artikel memperbaikinya sebelum diberi tag hapus"
		},
		"uw-inline-el": {
			label: "Menambahkan pranala luar ke bagian isi artikel",
			summary: "Pemberitahuan: Letakkan pranala pada bagian Pranala luar di akhir artikel"
		},
		"uw-italicize": {
			label: "Cetak miring judul buku, film, album, majalah, serial TV, dll.",
			summary: "Pemberitahuan: Cetak miring judul buku, film, album, majalah, serial TV, dll."
		},
		"uw-lang": {
			label: "Pengubahan yang tidak perlu antara bahasa Inggris Amerika dan Britania",
			summary: "Pemberitahuan: Pengubahan yang tidak perlu antara bahasa Inggris Amerika dan Britania",
			heading: "National varieties of English"
		},
		"uw-linking": {
			label: "Menambahkan pranala merah atau pengulangan pranala biru secara berlebihan",
			summary: "Pemberitahuan: Penambahan pranala merah atau pengulangan pranala biru secara berlebihan"
		},
		"uw-minor": {
			label: "Menandai suntingan kecil secara tidak benar",
			summary: "Pemberitahuan: Penandaan suntingan kecil secara tidak benar"
		},
		"uw-notenglish": {
			label: "Membuat artikel bukan dalam bahasa Indonesia",
			summary: "Pemberitahuan: Pembuatan artikel bukan dalam bahasa Indonesia"
		},
		"uw-notvote": {
			label: "Kita menggunakan konsensus, bukan pemungutan suara",
			summary: "Pemberitahuan: Kita menggunakan konsensus, bukan pemungutan suara"
		},
		"uw-plagiarism": {
			label: "Menyalin dari sumber domain publik tanpa atribusi",
			summary: "Pemberitahuan: Penyalinan dari sumber domain publik tanpa atribusi"
		},
		"uw-preview": {
			label: "Menggunakan tombol Lihat pratayang untuk menghindari kesalahan",
			summary: "Pemberitahuan: Penggunaan tombol Lihat pratayang untuk menghindari kesalahan"
		},
		"uw-redlink": {
			label: "Penghapusan pranala merah secara sembarangan",
			summary: "Pemberitahuan: Hati-hati saat menghapus pranala merah"
		},
		"uw-selfrevert": {
			label: "Mengembalikan uji coba sendiri",
			summary: "Pemberitahuan: Pengembalian uji coba sendiri"
		},
		"uw-socialnetwork": {
			label: "Wikipedia bukanlah jejaring sosial",
			summary: "Pemberitahuan: Wikipedia bukanlah jejaring sosial"
		},
		"uw-sofixit": {
			label: "Jangan ragu, Anda dapat memperbaikinya",
			summary: "Pemberitahuan: Jangan ragu, Anda dapat memperbaikinya"
		},
		"uw-spoiler": {
			label: "Menambahkan peringatan beberan atau menghapus beberan dari bagian terkait",
			summary: "Pemberitahuan: Jangan menghapus atau menandai kemungkinan 'beberan'"
		},
		"uw-talkinarticle": {
			label: "Pembicaraan dalam artikel",
			summary: "Pemberitahuan: Pembicaraan dalam artikel"
		},
		"uw-tilde": {
			label: "Tidak menandatangani pesan",
			summary: "Pemberitahuan: Tidak menandatangani pesan"
		},
		"uw-toppost": {
			label: "Menulis pesan di bagian atas halaman pembicaraan",
			summary: "Pemberitahuan: Penulisan pesan di bagian atas halaman pembicaraan"
		},
		"uw-userspace draft finish": {
			label: "Draf ruang pengguna yang terbengkalai",
			summary: "Pemberitahuan: Draf ruang pengguna yang terbengkalai"
		},
		"uw-vgscope": {
			label: "Menambahkan instruksi, cara curang, atau penelusuran permainan video",
			summary: "Pemberitahuan: Penambahan instruksi, cara curang, atau penelusuran permainan video"
		},
		"uw-warn": {
			label: "Menggunakan templat peringatan pengguna setelah mengembalikan vandalisme",
			summary: "Pemberitahuan: Penggunaan templat peringatan pengguna setelah mengembalikan vandalisme"
		}
	},

	singlewarn: {
		"uw-3rr": {
			label: "Melanggar aturan tiga kali pengembalian; lihat pula uw-ew",
			summary: "Peringatan: Pelanggaran aturan tiga kali pengembalian"
		},
		"uw-affiliate": {
			label: "Pemasaran afiliasi",
			summary: "Peringatan: Pemasaran afiliasi"
		},
		"uw-agf-sock": {
			label: "Menggunakan lebih dari satu akun (asumsikan niat baik)",
			summary: "Peringatan: Penggunaan lebih dari satu akun"
		},
		"uw-attack": {
			label: "Membuat halaman serangan",
			summary: "Peringatan: Pembuatan halaman serangan",
			suppressArticleInSummary: true
		},
		"uw-bizlist": {
			label: "Mempromosikan bisnis",
			summary: "Peringatan: Promosi bisnis"
		},
		"uw-botun": {
			label: "Nama pengguna bot",
			summary: "Peringatan: Nama pengguna bot"
		},
		"uw-canvass": {
			label: "Penganvasan",
			summary: "Peringatan: Penganvasan"
		},
		"uw-copyright": {
			label: "Pelanggaran hak cipta",
			summary: "Peringatan: Pelanggaran hak cipta"
		},
		"uw-copyright-link": {
			label: "Menautkan ke pelanggaran karya berhak cipta",
			summary: "Peringatan: Tautan ke pelanggaran karya berhak cipta"
		},
		"uw-copyright-new": {
			label: "Pelanggaran hak cipta (dengan penjelasan bagi pengguna baru)",
			summary: "Peringatan: Hindari masalah hak cipta",
			heading: "Wikipedia dan hak cipta"
		},
		"uw-copyright-remove": {
			label: "Menghapus templat {{copyvio}} dari artikel",
			summary: "Peringatan: Penghapusan templat {{copyvio}}"
		},
		"uw-efsummary": {
			label: "Ringkasan suntingan memicu filter penyuntingan",
			summary: "Pemberitahuan: Ringkasan suntingan memicu filter penyuntingan"
		},
		"uw-ew": {
			label: "Perang suntingan (teguran keras)",
			summary: "Peringatan: Perang suntingan"
		},
		"uw-ewsoft": {
			label: "Perang suntingan (teguran lunak bagi pengguna baru)",
			summary: "Pemberitahuan: Perang suntingan"
		},
		"uw-hoax": {
			label: "Membuat cerita/kabar bohong",
			summary: "Peringatan: Pembuatan cerita bohong"
		},
		"uw-legal": {
			label: "Membuat ancaman hukum",
			summary: "Peringatan: Pembuatan ancaman hukum"
		},
		"uw-login": {
			label: "Menyunting setelah keluar log",
			summary: "Pemberitahuan: Penyuntingan setelah keluar log"
		},
		"uw-multipleIPs": {
			label: "Menggunakan lebih dari satu alamat IP",
			summary: "Peringatan: Penggunaan lebih dari satu alamat IP"
		},
		"uw-pinfo": {
			label: "Menambahkan info pribadi pengguna lain",
			summary: "Peringatan: Penambahan info pribadi pengguna lain"
		},
		"uw-salt": {
			label: "Membuat kembali artikel dalam daftar hitam judul dengan judul berbeda",
			summary: "Peringatan: Pembuatan kembali artikel yang tidak diperkenankan dengan judul berbeda"
		},
		"uw-socksuspect": {
			label: "Dugaan pengguna siluman",
			summary: "Peringatan: Dugaan [[WP:SILUMAN|pengguna siluman]]"  // of User:...
		},
		"uw-upv": {
			label: "Vandalisme halaman pengguna",
			summary: "Peringatan: Vandalisme halaman pengguna"
		},
		"uw-username": {
			label: "Nama pengguna tidak sesuai kebijakan",
			summary: "Pemberitahuan: Nama pengguna tidak sesuai kebijakan",
			suppressArticleInSummary: true  // not relevant for this template
		},
		"uw-coi-username": {
			label: "Nama pengguna tidak sesuai kebijakan, dan konflik kepentingan",
			summary: "Pemberitahuan: Kebijakan konflik kepentingan dan nama pengguna",
			heading: "Nama pengguna Anda"
		},
		"uw-userpage": {
			label: "Subhalaman atau halaman pengguna tidak sesuai kebijakan",
			summary: "Pemberitahuan: Subhalaman atau halaman pengguna tidak sesuai kebijakan"
		},
		"uw-wrongsummary": {
			label: "Ketidaksesuaian atau ketidakakuratan penggunaan ringkasan suntingan",
			summary: "Pemberitahuan: Ketidaksesuaian atau ketidakakuratan penggunaan ringkasan suntingan"
		}
	}
};

Twinkle.warn.prev_article = null;
Twinkle.warn.prev_reason = null;

Twinkle.warn.callback.change_category = function twinklewarnCallbackChangeCategory(e) {
	var value = e.target.value;
	var sub_group = e.target.root.sub_group;
	sub_group.main_group = value;
	var old_subvalue = sub_group.value;
	var old_subvalue_re;
	if( old_subvalue ) {
		old_subvalue = old_subvalue.replace(/\d*(im)?$/, '' );
		old_subvalue_re = new RegExp( mw.RegExp.escape( old_subvalue ) + "(\\d*(?:im)?)$" );
	}

	while( sub_group.hasChildNodes() ){
		sub_group.removeChild( sub_group.firstChild );
	}

	// worker function to create the combo box entries
	var createEntries = function( contents, container, wrapInOptgroup ) {
		// level2->2, singlewarn->''; also used to distinguish the
		// scaled levels from singlenotice, singlewarn, and custom
		var level = value.replace(/^\D+/g,'');
		// due to an apparent iOS bug, we have to add an option-group to prevent truncation of text
		// (search WT:TW archives for "Problem selecting warnings on an iPhone")
		if ( wrapInOptgroup && $.client.profile().platform === "iphone" ) {
			var wrapperOptgroup = new Morebits.quickForm.element( {
				type: 'optgroup',
				label: 'Templat yang tersedia'
			} );
			wrapperOptgroup = wrapperOptgroup.render();
			container.appendChild( wrapperOptgroup );
			container = wrapperOptgroup;
		}

		$.each( contents, function( itemKey, itemProperties ) {
			// Skip if the current template doesn't have a version for the current level
			if (!!level && !itemProperties[value]) {
				return;
			}
			var key = (typeof itemKey === "string") ? itemKey : itemProperties.value;

			var selected = false;
			if( old_subvalue && old_subvalue_re.test( key ) ) {
				selected = true;
			}

			// Slice out leading uw- from the menu display
			var elem = new Morebits.quickForm.element( {
				type: 'option',
				label: (value === 'custom' ? "{{" + key + "}}" : key.slice(3)) + level + ": " + (level ? itemProperties[value].label : itemProperties.label),
				value: key + level,
				selected: selected
			} );
			var elemRendered = container.appendChild( elem.render() );
			$(elemRendered).data("messageData", itemProperties);
		} );
	};

	if( value === "singlenotice" || value === "singlewarn" ) {
		// no categories, just create the options right away
		createEntries( Twinkle.warn.messages[ value ], sub_group, true );
	} else if( value === "custom" ) {
		createEntries( Twinkle.getPref("customWarningList"), sub_group, true );
	} else {
		// create the option-groups
		$.each( Twinkle.warn.messages.levels, function( groupLabel, groupContents ) {
			// Creates subgroup regardless of whether there is anything to place in it;
			// leaves "Removal of deletion tags" empty for 4im
			var optgroup = new Morebits.quickForm.element( {
				type: 'optgroup',
				label: groupLabel
			} );
			optgroup = optgroup.render();
			sub_group.appendChild( optgroup );
			// create the options
			createEntries( groupContents, optgroup, false );
		} );
	}

	// clear overridden label on article textbox
	Morebits.quickForm.setElementTooltipVisibility(e.target.root.article, true);
	Morebits.quickForm.resetElementLabel(e.target.root.article);
	// hide the big red notice
	$("#tw-warn-red-notice").remove();
	// add custom label.redWarning
	Twinkle.warn.callback.change_subcategory(e);
};

Twinkle.warn.callback.change_subcategory = function twinklewarnCallbackChangeSubcategory(e) {
	var main_group = e.target.form.main_group.value;
	var value = e.target.form.sub_group.value;

	// Tags that don't take a linked article, but something else (often a username).
	// The value of each tag is the label next to the input field
	var notLinkedArticle = {
		"uw-agf-sock": "Optional username of other account (without User:) ",
		"uw-bite": "Username of 'bitten' user (without User:) ",
		"uw-socksuspect": "Username of sock master, if known (without User:) ",
		"uw-username": "Username violates policy because... ",
		"uw-aiv": "Optional username that was reported (without User:) "
	};

	if( main_group === 'singlenotice' || main_group === 'singlewarn' ) {
		if( notLinkedArticle[value] ) {
			if(Twinkle.warn.prev_article === null) {
				Twinkle.warn.prev_article = e.target.form.article.value;
			}
			e.target.form.article.notArticle = true;
			e.target.form.article.value = '';

			// change form labels according to the warning selected
			Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, false);
			Morebits.quickForm.overrideElementLabel(e.target.form.article, notLinkedArticle[value]);
		} else if( e.target.form.article.notArticle ) {
			if(Twinkle.warn.prev_article !== null) {
				e.target.form.article.value = Twinkle.warn.prev_article;
				Twinkle.warn.prev_article = null;
			}
			e.target.form.article.notArticle = false;
			Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, true);
			Morebits.quickForm.resetElementLabel(e.target.form.article);
		}
	}

	// add big red notice, warning users about how to use {{uw-[coi-]username}} appropriately
	$("#tw-warn-red-notice").remove();

	var $redWarning;
	if (value === "uw-username") {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{uw-username}} seharusnya <b>tidak</b> digunakan untuk pelanggaran kebijakan nama pengguna secara <b>terang-terangan</b>. " +
			"Pelanggaran terang-terangan seharusnya dilaporkan langsung kepada UAA (via tab ARV pada Twinkle). " +
			"{{uw-username}} sebaiknya hanya digunakan dalam kasus ringan untuk berdiskusi dengan pengguna tersebut.</div>");
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	} else if (value === "uw-coi-username") {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{uw-coi-username}} seharusnya <b>tidak</b> digunakan untuk pelanggaran kebijakan nama pengguna secara <b>terang-terangan</b>. " +
			"Blatant violations should be reported directly to UAA (via Twinkle's ARV tab). " +
			"{{uw-coi-username}} sebaiknya hanya digunakan dalam kasus ringan untuk berdiskusi dengan pengguna tersebut.</div>");
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	}
};

Twinkle.warn.callbacks = {
	getWarningWikitext: function(templateName, article, reason, isCustom) {
		var text = "{{subst:" + templateName;

		if (article) {
			// add linked article for user warnings
			text += '|1=' + article;
		}
		if (reason && !isCustom) {
			// add extra message
			if (templateName === 'uw-csd' || templateName === 'uw-probation' ||
				templateName === 'uw-userspacenoindex' || templateName === 'uw-userpage') {
				text += "|3=''" + reason + "''";
			} else {
				text += "|2=''" + reason + "''";
			}
		}
		text += '}}';

		if (reason && isCustom) {
			// we assume that custom warnings lack a {{{2}}} parameter
			text += " ''" + reason + "''";
		}

		return text + ' ~~~~';
	},
	preview: function(form) {
		var templatename = form.sub_group.value;
		var linkedarticle = form.article.value;
		var templatetext;

		templatetext = Twinkle.warn.callbacks.getWarningWikitext(templatename, linkedarticle,
			form.reason.value, form.main_group.value === 'custom');

		form.previewer.beginRender(templatetext, 'User_talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username
	},
	main: function( pageobj ) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var messageData = params.messageData;

		var history_re = /<!-- Template:(uw-.*?) -->.*?(\d{1,2}:\d{1,2}, \d{1,2} \w+ \d{4}) \(UTC\)/g;
		var history = {};
		var latest = { date: new Date( 0 ), type: '' };
		var current;

		while( ( current = history_re.exec( text ) ) ) {
			var current_date = new Date( current[2] + ' UTC' );
			if( !( current[1] in history ) ||  history[ current[1] ] < current_date ) {
				history[ current[1] ] = current_date;
			}
			if( current_date > latest.date ) {
				latest.date = current_date;
				latest.type = current[1];
			}
		}

		var date = new Date();

		if( params.sub_group in history ) {
			var temp_time = new Date( history[ params.sub_group ] );
			temp_time.setUTCHours( temp_time.getUTCHours() + 24 );

			if( temp_time > date ) {
				if( !confirm( "Suatu " + params.sub_group + " yang identik telah diberikan dalam 24 jam terakhir.  \nAnda tetap ingin memberikan peringatan/pemberitahuan ini?" ) ) {
					pageobj.statelem.info( 'dibatalkan sesuai permintaan pengguna' );
					return;
				}
			}
		}

		latest.date.setUTCMinutes( latest.date.getUTCMinutes() + 1 ); // after long debate, one minute is max

		if( latest.date > date ) {
			if( !confirm( "Suatu " + latest.type + " diberikan dalam satu menit terakhir.  \nAnda tetap ingin memberikan peringatan/pemberitahuan ini?" ) ) {
				pageobj.statelem.info( 'dibatalkan sesuai permintaan pengguna' );
				return;
			}
		}

		var dateHeaderRegex = new RegExp( "^==+\\s*(?:" + date.getUTCMonthName() + '|' + date.getUTCMonthNameAbbrev() +
			")\\s+" + date.getUTCFullYear() + "\\s*==+", 'mg' );
		var dateHeaderRegexLast, dateHeaderRegexResult;
		while ((dateHeaderRegexLast = dateHeaderRegex.exec( text )) !== null) {
			dateHeaderRegexResult = dateHeaderRegexLast;
		}
		// If dateHeaderRegexResult is null then lastHeaderIndex is never checked. If it is not null but
		// \n== is not found, then the date header must be at the very start of the page. lastIndexOf
		// returns -1 in this case, so lastHeaderIndex gets set to 0 as desired.
		var lastHeaderIndex = text.lastIndexOf( "\n==" ) + 1;

		if( text.length > 0 ) {
			text += "\n\n";
		}

		if( messageData.heading ) {
			text += "== " + messageData.heading + " ==\n";
		} else if( !dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex ) {
			Morebits.status.info( 'Info', 'Akan membuat judul tingkat 2 yang baru untuk tanggal tersebut, karena belum ada untuk bulan ini' );
			text += "== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ==\n";
		}
		text += Twinkle.warn.callbacks.getWarningWikitext(params.sub_group, params.article,
			params.reason, params.main_group === 'custom');

		if ( Twinkle.getPref('showSharedIPNotice') && mw.util.isIPAddress( mw.config.get('wgTitle') ) ) {
			Morebits.status.info( 'Info', 'Menambahkan pemberitahuan IP bersama' );
			text +=  "\n{{subst:Shared IP advice}}";
		}

		// build the edit summary
		var summary;
		if( params.main_group === 'custom' ) {
			switch( params.sub_group.substr( -1 ) ) {
				case "1":
					summary = "Catatan umum";
					break;
				case "2":
					summary = "Pemberitahuan";
					break;
				case "3":
					summary = "Peringatan";
					break;
				case "4":
					summary = "Peringatan terakhir";
					break;
				case "m":
					if( params.sub_group.substr( -3 ) === "4im" ) {
						summary = "Sekadar peringatan";
						break;
					}
					summary = "Pemberitahuan";
					break;
				default:
					summary = "Pemberitahuan";
					break;
			}
			summary += ": " + Morebits.string.toUpperCaseFirstChar(messageData.label);
		} else {
			summary = (/^\D+$/.test(params.main_group) ? messageData.summary : messageData[params.main_group].summary);
			if ( messageData.suppressArticleInSummary !== true && params.article ) {
				if ( params.sub_group === "uw-agf-sock" ||
						params.sub_group === "uw-socksuspect" ||
						params.sub_group === "uw-aiv" ) {  // these templates require a username
					summary += " dari [[:User:" + params.article + "]]";
				} else {
					summary += " di [[:" + params.article + "]]";
				}
			}
		}
		summary += "." + Twinkle.getPref("summaryAd");

		pageobj.setPageText( text );
		pageobj.setEditSummary( summary );
		pageobj.setWatchlist( Twinkle.getPref('watchWarnings') );
		pageobj.save();
	}
};

Twinkle.warn.callback.evaluate = function twinklewarnCallbackEvaluate(e) {
	var userTalkPage = 'User_talk:' + mw.config.get('wgRelevantUserName');

	// First, check to make sure a reason was filled in if uw-username was selected

	if(e.target.sub_group.value === 'uw-username' && e.target.article.value.trim() === '') {
		alert("Anda harus menuliskan alasan untuk menggunakan templat {{uw-username}}.");
		return;
	}

	// Find the selected <option> element so we can fetch the data structure
	var selectedEl = $(e.target.sub_group).find('option[value="' + $(e.target.sub_group).val() + '"]');

	// Then, grab all the values provided by the form
	var params = {
		reason: e.target.reason.value,
		main_group: e.target.main_group.value,
		sub_group: e.target.sub_group.value,
		article: e.target.article.value,  // .replace( /^(Image|Category):/i, ':$1:' ),  -- apparently no longer needed...
		messageData: selectedEl.data("messageData")
	};

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target );

	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = "Peringatan telah diberikan, memuat kembali halaman pembicaraan dalam beberapa detik";

	var wikipedia_page = new Morebits.wiki.page( userTalkPage, 'Perubahan halaman pembicaraan pengguna' );
	wikipedia_page.setCallbackParameters( params );
	wikipedia_page.setFollowRedirect( true );
	wikipedia_page.load( Twinkle.warn.callbacks.main );
};
})(jQuery);


//</nowiki>
