// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklewarn.js: Warn module
 ****************************************
 * Mode of invocation:     Tab ("Warn")
 * Active on:              Any page with relevant user name (userspace, contribs,
 *                         etc.), as well as the rollback success page
 */

Twinkle.warn = function twinklewarn() {

	if (mw.config.get('wgRelevantUserName')) {
		Twinkle.addPortletLink(Twinkle.warn.callback, 'Peringati', 'tw-warn', 'Peringatkan/beritahukan pengguna');
		if (Twinkle.getPref('autoMenuAfterRollback') &&
			mw.config.get('wgNamespaceNumber') === 3 &&
			mw.util.getParamValue('vanarticle') &&
			!mw.util.getParamValue('friendlywelcome') &&
			!mw.util.getParamValue('noautowarn')) {
			Twinkle.warn.callback();
		}
	}

	// Modify URL of talk page on rollback success pages, makes use of a
	// custom message box in [[MediaWiki:Rollback-success]]
	if (mw.config.get('wgAction') === 'rollback') {
		var $vandalTalkLink = $('#mw-rollback-success').find('.mw-usertoollinks a').first();
		if ($vandalTalkLink.length) {
			$vandalTalkLink.css('font-weight', 'bold');
			$vandalTalkLink.wrapInner($('<span/>').attr('title', 'Jika sesuai, Anda dapat menggunakan Twinkle untuk memperingatkan pengguna terkait suntingan mereka pada halaman ini.'));

			// Can't provide vanarticlerevid as only wgCurRevisionId is provided
			var extraParam = 'vanarticle=' + mw.util.rawurlencode(Morebits.pageNameNorm);
			var href = $vandalTalkLink.attr('href');
			if (href.indexOf('?') === -1) {
				$vandalTalkLink.attr('href', href + '?' + extraParam);
			} else {
				$vandalTalkLink.attr('href', href + '&' + extraParam);
			}
		}
	}
};

// Used to close window when switching to ARV in autolevel
Twinkle.warn.dialog = null;

Twinkle.warn.callback = function twinklewarnCallback() {
	if (mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName') &&
		!confirm('Anda hendak memperingatkan diri sendiri! Apakah Anda yakin ingin melakukannya?')) {
		return;
	}

	var dialog;
	Twinkle.warn.dialog = new Morebits.simpleWindow(600, 440);
	dialog = Twinkle.warn.dialog;
	Window.setTitle('Peringatkan/beritahu pengguna');
	dialog.setScriptName('Twinkle');
	dialog.addFooterLink('Memilih tingkat peringatan', 'WP:UWUL#Levels');
	dialog.addFooterLink('Bantuan Twinkle', 'WP:TW/DOC#warn');

	var form = new Morebits.quickForm(Twinkle.warn.callback.evaluate);
	var main_select = form.append({
		type: 'field',
		label: 'Pilih jenis peringatan/pemberitahuan untuk ditampilkan',
		tooltip: 'Pilih dahulu kelompok peringatan utama, lalu peringatan spesifik untuk ditampilkan.'
	});

	var main_group = main_select.append({
		type: 'select',
		name: 'main_group',
		event: Twinkle.warn.callback.change_category
	});

	var defaultGroup = parseInt(Twinkle.getPref('defaultWarningGroup'), 10);
	main_group.append({ type: 'option', label: '1: Catatan umum', value: 'level1', selected: defaultGroup === 1 });
	main_group.append({ type: 'option', label: '2: Pemberitahuan', value: 'level2', selected: defaultGroup === 2 });
	main_group.append({ type: 'option', label: '3: Peringatan', value: 'level3', selected: defaultGroup === 3 });
	main_group.append({ type: 'option', label: '4: Peringatan terakhir', value: 'level4', selected: defaultGroup === 4 });
	main_group.append({ type: 'option', label: '4im: Sekadar peringatan', value: 'level4im', selected: defaultGroup === 5 });
	if (Twinkle.getPref('combinedSingletMenus')) {
		main_group.append({ type: 'option', label: 'Pesan isu tunggal', value: 'singlecombined', selected: defaultGroup === 6 || defaultGroup === 7 });
	} else {
		main_group.append({ type: 'option', label: 'Pemberitahuan isu tunggal', value: 'singlenotice', selected: defaultGroup === 6 });
		main_group.append({ type: 'option', label: 'Peringatan isu tunggal', value: 'singlewarn', selected: defaultGroup === 7 });
	}
	if (Twinkle.getPref('customWarningList').length) {
		main_group.append({ type: 'option', label: 'Peringatan kustom', value: 'custom', selected: defaultGroup === 9 });
	}
	main_group.append({ type: 'option', label: 'All warning templates', value: 'kitchensink', selected: defaultGroup === 10 });
	main_group.append({ type: 'option', label: 'Auto-select level (1-4)', value: 'autolevel', selected: defaultGroup === 11 });

	main_select.append({ type: 'select', name: 'sub_group', event: Twinkle.warn.callback.change_subcategory }); // Will be empty to begin with.

	form.append({
		type: 'input',
		name: 'article',
		label: 'Artikel terkait',
		value: mw.util.getParamValue('vanarticle') || '',
		tooltip: 'Suatu artikel dapat ditautkan dalam pemberitahuan ini, mungkin karena merupakan pengembalian atas artikel terkait pemberitahuan ini. Biarkan kosong jika tidak ada artikel yang ingin ditautkan.'
	});

	form.append({
		type: 'div',
		label: '',
		style: 'color: red',
		id: 'twinkle-warn-revert-messages'
	});

	var vanrevid = mw.util.getParamValue('vanarticlerevid');
	if (vanrevid) {
		var message = '';
		var query = {};

		// If you tried reverting, check if *you* actually reverted
		if (!mw.util.getParamValue('noautowarn') && mw.util.getParamValue('vanarticle')) { // Via fluff link
			query = {
				action: 'query',
				titles: mw.util.getParamValue('vanarticle'),
				prop: 'revisions',
				rvstartid: vanrevid,
				rvlimit: 2,
				rvdir: 'newer',
				rvprop: 'user'
			};

			new Morebits.wiki.api('Checking if you successfully reverted the page', query, function(apiobj) {
				var revertUser = $(apiobj.getResponse()).find('revisions rev')[1].getAttribute('user');
				if (revertUser && revertUser !== mw.config.get('wgUserName')) {
					message += ' Someone else reverted the page and may have already warned the user.';
					$('#twinkle-warn-revert-messages').text('Note:' + message);
				}
			}).post();
		}

		// Confirm edit wasn't too old for a warning
		query = {
			action: 'query',
			prop: 'revisions',
			rvprop: 'timestamp',
			revids: vanrevid
		};
		new Morebits.wiki.api('Grabbing the revision timestamps', query, function(apiobj) {
			var vantimestamp = $(apiobj.getResponse()).find('revisions rev').attr('timestamp');
			var revDate = new Morebits.date(vantimestamp);
			if (vantimestamp && revDate.isValid()) {
				if (revDate.add(24, 'hours').isBefore(new Date())) {
					message += ' This edit was made more than 24 hours ago so a warning may be stale.';
					$('#twinkle-warn-revert-messages').text('Note:' + message);
				}
			}
		}).post();
	}

	var more = form.append({ type: 'field', name: 'reasonGroup', label: 'Informasi peringatan' });
	more.append({ type: 'textarea', label: 'Pesan opsional:', name: 'reason', tooltip: 'Mungkin suatu alasan atau, jika tidak, diperlukan tambahan pemberitahuan yang lebih rinci.' });

	var previewlink = document.createElement('a');
	$(previewlink).click(function() {
		Twinkle.warn.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = 'pointer';
	previewlink.textContent = 'Lihat pratayang';
	more.append({ type: 'div', id: 'warningpreview', label: [ previewlink ] });
	more.append({ type: 'div', id: 'twinklewarn-previewbox', style: 'display: none' });

	more.append({ type: 'submit', label: 'Kirimkan' });

	var result = form.render();
	dialog.setContent(result);
	dialog.display();
	result.main_group.root = result;
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklewarn-previewbox').last()[0]);

	// We must init the first choice (General Note);
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.main_group.dispatchEvent(evt);
};

// This is all the messages that might be dispatched by the code
// Each of the individual templates require the following information:
//   label (required): A short description displayed in the dialog
//   summary (required): The edit summary used. If an article name is entered, the summary is postfixed with "on [[article]]", and it is always postfixed with ". $summaryAd"
//   suppressArticleInSummary (optional): Set to true to suppress showing the article name in the edit summary. Useful if the warning relates to attack pages, or some such.
Twinkle.warn.messages = {
	levels: {
		'Peringatan umum': {
			'uw-vandalism': {
				level1: {
					label: 'Vandalisme',
					summary: 'Catatan: Suntingan tidak membangun'
				},
				level2: {
					label: 'Vandalisme',
					summary: 'Pemberitahuan: Suntingan tidak membangun'
				},
				level3: {
					label: 'Vandalisme',
					summary: 'Warning: Vandalisme'
				},
				level4: {
					label: 'Vandalisme',
					summary: 'Pengatan terakhir: Vandalisme'
				},
				level4im: {
					label: 'Vandalisme',
					summary: 'Sekadar peringatan: Vandalisme'
				}
			},
			'uw-disruptive': {
				level1: {
					label: 'Suntingan tidak membangun',
					summary: 'Catatan: Suntingan tidak membangun'
				},
				level2: {
					label: 'Suntingan tidak membangun',
					summary: 'Pemberitahuan: Suntingan tidak membangun'
				},
				level3: {
					label: 'Suntingan tidak membangun',
					summary: 'Warning: Suntingan tidak membangun'
				}
			},
			'uw-test': {
				level1: {
					label: 'Suntingan uji coba',
					summary: 'Catatan: Suntingan uji coba'
				},
				level2: {
					label: 'Suntingan uji coba',
					summary: 'Pemberitahuan: Suntingan uji coba'
				},
				level3: {
					label: 'Suntingan uji coba',
					summary: 'Warning: Suntingan uji coba'
				}
			},
			'uw-delete': {
				level1: {
					label: 'Menghapus konten, mengosongkan halaman',
					summary: 'Catatan: Menghapus konten, mengosongkan halaman'
				},
				level2: {
					label: 'Menghapus konten, mengosongkan halaman',
					summary: 'Pemberitahuan: Menghapus konten, mengosongkan halaman'
				},
				level3: {
					label: 'Menghapus konten, mengosongkan halaman',
					summary: 'Warning: Menghapus konten, mengosongkan halaman'
				},
				level4: {
					label: 'Menghapus konten, mengosongkan halaman',
					summary: 'Pengatan terakhir: Menghapus konten, mengosongkan halaman'
				},
				level4im: {
					label: 'Menghapus konten, mengosongkan halaman',
					summary: 'Sekadar peringatan: Menghapus konten, mengosongkan halaman'
				}
			},
			'uw-generic': {
				level4: {
					label: 'Peringatan umum (untuk templat yang tidak ada di tingkat 4)',
					summary: 'Pemberitahuan peringatan terakhir'
				}
			}
		},
		'Perilaku dalam artikel': {
			'uw-biog': {
				level1: {
					label: 'Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup',
					summary: 'Catatan: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup'
				},
				level2: {
					label: 'Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup',
					summary: 'Pemberitahuan: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup'
				},
				level3: {
					label: 'Menambahkan informasi fitnah/kontroversial tanpa rujukan tentang orang yang masih hidup',
					summary: 'Peringatan: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup'
				},
				level4: {
					label: 'Menambahkan informasi fitnah tanpa rujukan tentang orang yang masih hidup',
					summary: 'Peringatan terakhir: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup'
				},
				level4im: {
					label: 'Menambahkan informasi fitnah tanpa rujukan tentang orang yang masih hidup',
					summary: 'Sekadar peringatan: Menambahkan informasi kontroversial tanpa rujukan tentang orang yang masih hidup'
				}
			},
			'uw-defamatory': {
				level1: {
					label: 'Menambahkan konten yang memfitnah',
					summary: 'Catatan: Menambahkan konten yang memfitnah'
				},
				level2: {
					label: 'Menambahkan konten yang memfitnah',
					summary: 'Pemberitahuan: Menambahkan konten yang memfitnah'
				},
				level3: {
					label: 'Menambahkan konten yang memfitnah',
					summary: 'Peringatan: Menambahkan konten yang memfitnah'
				},
				level4: {
					label: 'Menambahkan konten yang memfitnah',
					summary: 'Peringatan terakhir: Menambahkan konten yang memfitnah'
				},
				level4im: {
					label: 'Menambahkan konten yang memfitnah',
					summary: 'Sekadar peringatan: Menambahkan konten yang memfitnah'
				}
			},
			'uw-error': {
				level1: {
					label: 'Menambahkan kesalahan faktual secara sengaja',
					summary: 'Catatan: Penambahan kesalahan faktual secara sengaja'
				},
				level2: {
					label: 'Menambahkan kesalahan faktual secara sengaja',
					summary: 'Pemberitahuan: Penambahan kesalahan faktual secara sengaja'
				},
				level3: {
					label: 'Menambahkan kesalahan faktual secara sengaja',
					summary: 'Peringatan: Menambahkan kesalahan faktual secara sengaja'
				},
				level4: {
					label: 'Menambahkan kesalahan faktual secara sengaja',
					summary: 'Peringatan terakhir: Menambahkan kesalahan faktual secara sengaja'
				}
			},
			'uw-genre': {
				level1: {
					label: 'Mengubah secara massal atau sering tanpa konsensus atau rujukan',
					summary: 'Catatan: Mengubah secara massal atau sering tanpa konsensus atau rujukan'
				},
				level2: {
					label: 'Mengubah secara massal atau sering tanpa konsensus atau rujukan',
					summary: 'Pemberitahuan: Mengubah secara massal atau sering tanpa konsensus atau rujukan'
				},
				level3: {
					label: 'Mengubah secara massal atau sering tanpa konsensus atau rujukan',
					summary: 'Peringatan: Mengubah secara massal atau sering tanpa konsensus atau rujukan'
				},
				level4: {
					label: 'Mengubah secara massal atau sering tanpa konsensus atau rujukan',
					summary: 'Peringatan terakhir: Mengubah secara massal atau sering tanpa konsensus atau rujukan'
				}
			},
			'uw-image': {
				level1: {
					label: 'Vandalisme terkait berkas dalam artikel',
					summary: 'Catatan: Vandalisme terkait berkas dalam artikel'
				},
				level2: {
					label: 'Vandalisme terkait berkas dalam artikel',
					summary: 'Pemberitahuan: Vandalisme terkait berkas dalam artikel'
				},
				level3: {
					label: 'Vandalisme terkait berkas dalam artikel',
					summary: 'Peringatan: Vandalisme terkait berkas dalam artikel'
				},
				level4: {
					label: 'Vandalisme terkait berkas dalam artikel',
					summary: 'Peringatan terakhir: Vandalisme terkait berkas dalam artikel'
				},
				level4im: {
					label: 'Vandalisme terkait berkas',
					summary: 'Sekadar peringatan: Vandalisme terkait berkas'
				}
			},
			'uw-joke': {
				level1: {
					label: 'Menggunakan lelucon yang tidak pantas dalam artikel',
					summary: 'Catatan: Menggunakan lelucon yang tidak pantas dalam artikel'
				},
				level2: {
					label: 'Menggunakan lelucon yang tidak pantas dalam artikel',
					summary: 'Pemberitahuan: Menggunakan lelucon yang tidak pantas dalam artikel'
				},
				level3: {
					label: 'Menggunakan lelucon yang tidak pantas dalam artikel',
					summary: 'Peringatan: Menggunakan lelucon yang tidak pantas dalam artikel'
				},
				level4: {
					label: 'Menggunakan lelucon yang tidak pantas dalam artikel',
					summary: 'Peringatan terakhir: Menggunakan lelucon yang tidak pantas dalam artikel'
				},
				level4im: {
					label: 'Menggunakan lelucon yang tidak pantas',
					summary: 'Sekadar peringatan: Menggunakan lelucon yang tidak pantas'
				}
			},
			'uw-nor': {
				level1: {
					label: 'Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan',
					summary: 'Catatan: Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan'
				},
				level2: {
					label: 'Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan',
					summary: 'Pemberitahuan: Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan'
				},
				level3: {
					label: 'Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan',
					summary: 'Peringatan: Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan'
				},
				level4: {
					label: 'Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan',
					summary: 'Peringatan terakhir: Menambahkan riset asli, misalnya kumpulan rujukan yang belum dipublikasikan'
				}
			},
			'uw-notcensored': {
				level1: {
					label: 'Menyensor materi',
					summary: 'Catatan: Menyensor materi'
				},
				level2: {
					label: 'Menyensor materi',
					summary: 'Pemberitahuan: Menyensor materi'
				},
				level3: {
					label: 'Menyensor materi',
					summary: 'Peringatan: Menyensor materi'
				}
			},
			'uw-own': {
				level1: {
					label: 'Mengklaim kepemilikan artikel',
					summary: 'Catatan: Mengklaim kepemilikan artikel'
				},
				level2: {
					label: 'Mengklaim kepemilikan artikel',
					summary: 'Pemberitahuan: Mengklaim kepemilikan artikel'
				},
				level3: {
					label: 'Mengklaim kepemilikan artikel',
					summary: 'Peringatan: Mengklaim kepemilikan artikel'
				},
				level4im: {
					label: 'Mengklaim kepemilikan artikel',
					summary: 'Sekadar peringatan: Mengklaim kepemilikan artikel'
				}
			},
			'uw-tdel': {
				level1: {
					label: 'Menghapus templat pemeliharaan',
					summary: 'Catatan: Menghapus templat pemeliharaan'
				},
				level2: {
					label: 'Menghapus templat pemeliharaan',
					summary: 'Pemberitahuan: Menghapus templat pemeliharaan'
				},
				level3: {
					label: 'Menghapus templat pemeliharaan',
					summary: 'Peringatan: Menghapus templat pemeliharaan'
				},
				level4: {
					label: 'Menghapus templat pemeliharaan',
					summary: 'Peringatan terakhir: Menghapus templat pemeliharaan'
				}
			},
			'uw-unsourced': {
				level1: {
					label: 'Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan',
					summary: 'Catatan: Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan'
				},
				level2: {
					label: 'Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan',
					summary: 'Pemberitahuan: Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan'
				},
				level3: {
					label: 'Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan',
					summary: 'Peringatan: Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan'
				},
				level4: {
					label: 'Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan',
					summary: 'Peringatan terakhir: Menambahkan materi tanpa dikutip dengan semestinya atau tanpa rujukan'
				}
			}
		},
		'Promotions and spam': {
			'uw-advert': {
				level1: {
					label: 'Menggunakan Wikipedia untuk beriklan atau promosi',
					summary: 'Catatan: Menggunakan Wikipedia untuk beriklan atau promosi'
				},
				level2: {
					label: 'Menggunakan Wikipedia untuk beriklan atau promosi',
					summary: 'Pemberitahuan: Menggunakan Wikipedia untuk beriklan atau promosi'
				},
				level3: {
					label: 'Menggunakan Wikipedia untuk beriklan atau promosi',
					summary: 'Peringatan: Menggunakan Wikipedia untuk beriklan atau promosi'
				},
				level4: {
					label: 'Menggunakan Wikipedia untuk beriklan atau promosi',
					summary: 'Peringatan terakhir: Menggunakan Wikipedia untuk beriklan atau promosi'
				},
				level4im: {
					label: 'Menggunakan Wikipedia untuk beriklan atau promosi',
					summary: 'Sekadar peringatan: Menggunakan Wikipedia untuk beriklan atau promosi'
				}
			},
			'uw-npov': {
				level1: {
					label: 'Tidak berpegang pada sudut pandang netral',
					summary: 'Catatan: Tidak berpegang pada sudut pandang netral'
				},
				level2: {
					label: 'Tidak berpegang pada sudut pandang netral',
					summary: 'Pemberitahuan: Tidak berpegang pada sudut pandang netral'
				},
				level3: {
					label: 'Tidak berpegang pada sudut pandang netral',
					summary: 'Peringatan: Tidak berpegang pada sudut pandang netral'
				},
				level4: {
					label: 'Tidak berpegang pada sudut pandang netral',
					summary: 'Peringatan terakhir: Tidak berpegang pada sudut pandang netral'
				}
			},
			'uw-paid': {
				level1: {
					label: 'Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia',
					summary: 'Catatan: Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia'
				},
				level2: {
					label: 'Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia',
					summary: 'Pemberitahuan: Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia'
				},
				level3: {
					label: 'Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia',
					summary: 'Peringatan: Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia'
				},
				level4: {
					label: 'Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia',
					summary: 'Peringatan terakhir: Suntingan berbayar tanpa penyingkapan di bawah Ketentuan Pengunaan Wikimedia'
				}
			},
			'uw-spam': {
				level1: {
					label: 'Menambahkan pranala luar yang tak pantas',
					summary: 'Catatan: Menambahkan pranala luar yang tak pantas'
				},
				level2: {
					label: 'Menambahkan pranala luar spam',
					summary: 'Pemberitahuan: Menambahkan pranala luar spam'
				},
				level3: {
					label: 'Menambahkan pranala luar spam',
					summary: 'Peringatan: Menambahkan pranala luar spam'
				},
				level4: {
					label: 'Menambahkan pranala luar spam',
					summary: 'Peringatan terakhir: Menambahkan pranala luar spam'
				},
				level4im: {
					label: 'Menambahkan pranala luar spam',
					summary: 'Sekadar peringatan: Menambahkan pranala luar spam'
				}
			}
		},
		'Perilaku terhadap pengguna lain': {
			'uw-agf': {
				level1: {
					label: 'Not assuming good faith',
					summary: 'Catatan: Not assuming good faith'
				},
				level2: {
					label: 'Not assuming good faith',
					summary: 'Pemberitahuan: Not assuming good faith'
				},
				level3: {
					label: 'Not assuming good faith',
					summary: 'Peringatan: Not assuming good faith'
				}
			},
			'uw-harass': {
				level1: {
					label: 'Harassment of other users',
					summary: 'Catatan: Harassment of other users'
				},
				level2: {
					label: 'Harassment of other users',
					summary: 'Pemberitahuan: Harassment of other users'
				},
				level3: {
					label: 'Harassment of other users',
					summary: 'Peringatan: Harassment of other users'
				},
				level4: {
					label: 'Harassment of other users',
					summary: 'Peringatan terakhir: Harassment of other users'
				},
				level4im: {
					label: 'Harassment of other users',
					summary: 'Sekadar peringatan: Harassment of other users'
				}
			},
			'uw-npa': {
				level1: {
					label: 'Personal attack directed at a specific editor',
					summary: 'Catatan: Personal attack directed at a specific editor'
				},
				level2: {
					label: 'Personal attack directed at a specific editor',
					summary: 'Pemberitahuan: Personal attack directed at a specific editor'
				},
				level3: {
					label: 'Personal attack directed at a specific editor',
					summary: 'Peringatan: Personal attack directed at a specific editor'
				},
				level4: {
					label: 'Personal attack directed at a specific editor',
					summary: 'Peringatan terakhir: Personal attack directed at a specific editor'
				},
				level4im: {
					label: 'Personal attack directed at a specific editor',
					summary: 'Sekadar peringatan: Personal attack directed at a specific editor'
				}
			},
			'uw-tempabuse': {
				level1: {
					label: 'Improper use of warning or blocking template',
					summary: 'Catatan: Improper use of warning or blocking template'
				},
				level2: {
					label: 'Improper use of warning or blocking template',
					summary: 'Pemberitahuan: Improper use of warning or blocking template'
				}
			}
		},
		'Penghilangan tag penghapusan': {
			'uw-afd': {
				level1: {
					label: 'Menghilangkan templat {{Afd}}',
					summary: 'Catatan: Menghilangkan templat {{Afd}}'
				},
				level2: {
					label: 'Menghilangkan templat {{Afd}}',
					summary: 'Pemberitahuan: Menghilangkan templat {{Afd}}'
				},
				level3: {
					label: 'Menghilangkan templat {{Afd}}',
					summary: 'Peringatan: Menghilangkan templat {{Afd}}'
				},
				level4: {
					label: 'Menghilangkan templat {{Afd}}',
					summary: 'Peringatan terakhir: Menghilangkan templat {{Afd}}'
				}
			},
			'uw-blpprod': {
				level1: {
					label: 'Menghilangkan templat {{Prod blp}}',
					summary: 'Catatan: Menghilangkan templat {{Prod blp}}'
				},
				level2: {
					label: 'Menghilangkan templat {{Prod blp}}',
					summary: 'Pemberitahuan: Menghilangkan templat {{Prod blp}}'
				},
				level3: {
					label: 'Menghilangkan templat {{Prod blp}}',
					summary: 'Peringatan: Menghilangkan templat {{Prod blp}}'
				},
				level4: {
					label: 'Menghilangkan templat {{Prod blp}}',
					summary: 'Peringatan terakhir: Menghilangkan templat {{Prod blp}}'
				}
			},
			'uw-idt': {
				level1: {
					label: 'Menghilangkan tag penghapusan berkas',
					summary: 'Catatan: Menghilangkan tag penghapusan berkas'
				},
				level2: {
					label: 'Menghilangkan tag penghapusan berkas',
					summary: 'Pemberitahuan: Menghilangkan tag penghapusan berkas'
				},
				level3: {
					label: 'Menghilangkan tag penghapusan berkas',
					summary: 'Peringatan: Menghilangkan tag penghapusan berkas'
				},
				level4: {
					label: 'Menghilangkan tag penghapusan berkas',
					summary: 'Peringatan terakhir: Menghilangkan tag penghapusan berkas'
				}
			},
			'uw-speedy': {
				level1: {
					label: 'Menghilangkan tag penghapusan cepat',
					summary: 'Catatan: Menghilangkan tag penghapusan cepat'
				},
				level2: {
					label: 'Menghilangkan tag penghapusan cepat',
					summary: 'Pemberitahuan: Menghilangkan tag penghapusan cepat'
				},
				level3: {
					label: 'Menghilangkan tag penghapusan cepat',
					summary: 'Peringatan: Menghilangkan tag penghapusan cepat'
				},
				level4: {
					label: 'Menghilangkan tag penghapusan cepat',
					summary: 'Peringatan terakhir: Menghilangkan tag penghapusan cepat'
				}
			}
		},
		'Lain-lain': {
			'uw-attempt': {
				level1: {
					label: 'Memicu filter penyuntingan',
					summary: 'Catatan: Memicu filter penyuntingan'
				},
				level2: {
					label: 'Memicu filter penyuntingan',
					summary: 'Pemberitahuan: Memicu filter penyuntingan'
				},
				level3: {
					label: 'Memicu filter penyuntingan',
					summary: 'Peringatan: Memicu filter penyuntingan'
				},
				level4: {
					label: 'Memicu filter penyuntingan',
					summary: 'Peringatan terakhir: Memicu filter penyuntingan'
				}
			},
			'uw-chat': {
				level1: {
					label: 'Menggunakan halaman pembicaraan sebagai forum',
					summary: 'Catatan: Menggunakan halaman pembicaraan sebagai forum'
				},
				level2: {
					label: 'Menggunakan halaman pembicaraan sebagai forum',
					summary: 'Pemberitahuan: Menggunakan halaman pembicaraan sebagai forum'
				},
				level3: {
					label: 'Menggunakan halaman pembicaraan sebagai forum',
					summary: 'Peringatan: Menggunakan halaman pembicaraan sebagai forum'
				},
				level4: {
					label: 'Menggunakan halaman pembicaraan sebagai forum',
					summary: 'Peringatan terakhir: Menggunakan halaman pembicaraan sebagai forum'
				}
			},
			'uw-create': {
				level1: {
					label: 'Membuat halaman yang tidak pantas',
					summary: 'Catatan: Membuat halaman yang tidak pantas'
				},
				level2: {
					label: 'Membuat halaman yang tidak pantas',
					summary: 'Pemberitahuan: Membuat halaman yang tidak pantas'
				},
				level3: {
					label: 'Membuat halaman yang tidak pantas',
					summary: 'Peringatan: Membuat halaman yang tidak pantas'
				},
				level4: {
					label: 'Membuat halaman yang tidak pantas',
					summary: 'Peringatan terakhir: Membuat halaman yang tidak pantas'
				},
				level4im: {
					label: 'Membuat halaman yang tidak pantas',
					summary: 'Sekadar peringatan: Membuat halaman yang tidak pantas'
				}
			},
			'uw-mos': {
				level1: {
					label: 'Pedoman gaya',
					summary: 'Catatan: Format, tanggal, bahasa, dll. (Pedoman gaya)'
				},
				level2: {
					label: 'Pedoman gaya',
					summary: 'Pemberitahuan: Format, tanggal, bahasa, dll. (Pedoman gaya)'
				},
				level3: {
					label: 'Pedoman gaya',
					summary: 'Peringatan: Format, tanggal, bahasa, dll. (Pedoman gaya)'
				},
				level4: {
					label: 'Pedoman gaya',
					summary: 'Peringatan terakhir: Format, tanggal, bahasa, dll. (Pedoman gaya)'
				}
			},
			'uw-move': {
				level1: {
					label: 'Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus',
					summary: 'Catatan: Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus'
				},
				level2: {
					label: 'Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus',
					summary: 'Pemberitahuan: Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus'
				},
				level3: {
					label: 'Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus',
					summary: 'Peringatan: Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus'
				},
				level4: {
					label: 'Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus',
					summary: 'Peringatan terakhir: Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus'
				},
				level4im: {
					label: 'Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus',
					summary: 'Sekadar peringatan: Memindahkan halaman bertentangan dengan konvensi penamaan atau konsensus'
				}
			},
			'uw-tpv': {
				level1: {
					label: 'Menyunting komentar pengguna lain di halaman pembicaraan',
					summary: 'Catatan: Menyunting komentar pengguna lain di halaman pembicaraan'
				},
				level2: {
					label: 'Menyunting komentar pengguna lain di halaman pembicaraan',
					summary: 'Pemberitahuan: Menyunting komentar pengguna lain di halaman pembicaraan'
				},
				level3: {
					label: 'Menyunting komentar pengguna lain di halaman pembicaraan',
					summary: 'Peringatan: Menyunting komentar pengguna lain di halaman pembicaraan'
				},
				level4: {
					label: 'Menyunting komentar pengguna lain di halaman pembicaraan',
					summary: 'Peringatan terakhir: Menyunting komentar pengguna lain di halaman pembicaraan'
				},
				level4im: {
					label: 'Menyunting komentar pengguna lain di halaman pembicaraan',
					summary: 'Sekadar peringatan: Menyunting komentar pengguna lain di halaman pembicaraan'
				}
			},
			'uw-upload': {
				level1: {
					label: 'Menggunggah berkas nonensiklopedis',
					summary: 'Catatan: Menggunggah berkas nonensiklopedis'
				},
				level2: {
					label: 'Menggunggah berkas nonensiklopedis',
					summary: 'Pemberitahuan: Menggunggah berkas nonensiklopedis'
				},
				level3: {
					label: 'Menggunggah berkas nonensiklopedis',
					summary: 'Peringatan: Menggunggah berkas nonensiklopedis'
				},
				level4: {
					label: 'Menggunggah berkas nonensiklopedis',
					summary: 'Peringatan terakhir: Menggunggah berkas nonensiklopedis'
				},
				level4im: {
					label: 'Menggunggah berkas nonensiklopedis',
					summary: 'Sekadar peringatan: Menggunggah berkas nonensiklopedis'
				}
			}
		}
	},

	singlenotice: {
		'uw-aiv': {
			label: 'Laporan AIV tidak benar',
			summary: 'Pemberitahuan: Laporan AIV tidak benar'
		},
		'uw-autobiography': {
			label: 'Membuat otobiografi',
			summary: 'Pemberitahuan: Pembuatan otobiografi'
		},
		'uw-badcat': {
			label: 'Menambahkan kategori yang salah',
			summary: 'Pemberitahuan: Penambahan kategori yang salah'
		},
		'uw-badlistentry': {
			label: 'Menambahkan entri yang tidak sepatutnya pada daftar',
			summary: 'Pemberitahuan: Penambahan entri yang tidak sepatutnya pada daftar'
		},
		'uw-bite': {
			label: '"Menggigit" pendatang baru',
			summary: 'Pemberitahuan: "Menggigit" pendatang baru',
			suppressArticleInSummary: true  // non-standard (user name, not article), and not necessary
		},
		'uw-coi': {
			label: 'Konflik kepentingan',
			summary: 'Pemberitahuan: Konflik kepentingan',
			heading: 'Managing a conflict of interest'
		},
		'uw-controversial': {
			label: 'Memasukkan materi kontroversial',
			summary: 'Pemberitahuan: Pemasukan materi kontroversial'
		},
		'uw-copying': {
			label: 'Menyalin teks ke halaman lain',
			summary: 'Pemberitahuan: Penyalinan teks ke halaman lain'
		},
		'uw-crystal': {
			label: 'Menambahkan informasi spekulatif atau belum dikonfirmasi',
			summary: 'Pemberitahuan: Penambahan informasi spekulatif atau belum dikonfirmasi'
		},
		'uw-c&pmove': {
			label: 'Pemindahan potong dan tempel',
			summary: 'Pemberitahuan: Pemindahan potong dan tempel'
		},
		'uw-dab': {
			label: 'Suntingan tidak benar pada halaman disambiguasi',
			summary: 'Pemberitahuan: Suntingan tidak benar pada halaman disambiguasi'
		},
		'uw-date': {
			label: 'Mengubah format tanggal secara tidak perlu',
			summary: 'Pemberitahuan: Pengubahan format tanggal secara tidak perlu'
		},
		'uw-deadlink': {
			label: 'Menghapus rujukan layak yang mengandung pranala mati',
			summary: 'Pemberitahuan: Penghapusan rujukan layak yang mengandung pranala mati'
		},
		'uw-draftfirst': {
			label: 'Merancang dalam ruang pengguna tanpa risiko penghapusan cepat',
			summary: 'Pemberitahuan: Pertimbangkan merancang artikel Anda dalam [[Bantuan:Draf ruang pengguna|ruang pengguna]]'
		},
		'uw-editsummary': {
			label: 'Tidak menggunakan ringkasan suntingan',
			summary: 'Pemberitahuan: Tidak menggunakan ringkasan suntingan'
		},
		'uw-elinbody': {
			label: 'Menambahkan pranala luar ke bagian isi artikel',
			summary: 'Pemberitahuan: Letakkan pranala pada bagian Pranala luar di akhir artikel'
		},
		'uw-english': {
			label: 'Tidak berkomunikasi dalam bahasa Indonesia',
			summary: 'Pemberitahuan: Tidak berkomunikasi dalam bahasa Indonesia'
		},
		'uw-hasty': {
			label: 'Menambahkan tag penghapusan cepat secara gegabah',
			summary: 'Pemberitahuan: Izinkan pembuat artikel memperbaikinya sebelum diberi tag hapus'
		},
		'uw-italicize': {
			label: 'Cetak miring judul buku, film, album, majalah, serial TV, dll.',
			summary: 'Pemberitahuan: Cetak miring judul buku, film, album, majalah, serial TV, dll.'
		},
		'uw-lang': {
			label: 'Pengubahan yang tidak perlu antara bahasa Inggris Amerika dan Britania',
			summary: 'Pemberitahuan: Pengubahan yang tidak perlu antara bahasa Inggris Amerika dan Britania',
			heading: 'National varieties of English'
		},
		'uw-linking': {
			label: 'Menambahkan pranala merah atau pengulangan pranala biru secara berlebihan',
			summary: 'Pemberitahuan: Penambahan pranala merah atau pengulangan pranala biru secara berlebihan'
		},
		'uw-minor': {
			label: 'Menandai suntingan kecil secara tidak benar',
			summary: 'Pemberitahuan: Penandaan suntingan kecil secara tidak benar'
		},
		'uw-notenglish': {
			label: 'Membuat artikel bukan dalam bahasa Indonesia',
			summary: 'Pemberitahuan: Pembuatan artikel bukan dalam bahasa Indonesia'
		},
		'uw-notvote': {
			label: 'Kita menggunakan konsensus, bukan pemungutan suara',
			summary: 'Pemberitahuan: Kita menggunakan konsensus, bukan pemungutan suara'
		},
		'uw-plagiarism': {
			label: 'Menyalin dari sumber domain publik tanpa atribusi',
			summary: 'Pemberitahuan: Penyalinan dari sumber domain publik tanpa atribusi'
		},
		'uw-preview': {
			label: 'Menggunakan tombol Lihat pratayang untuk menghindari kesalahan',
			summary: 'Pemberitahuan: Penggunaan tombol Lihat pratayang untuk menghindari kesalahan'
		},
		'uw-redlink': {
			label: 'Penghapusan pranala merah secara sembarangan',
			summary: 'Pemberitahuan: Hati-hati saat menghapus pranala merah'
		},
		'uw-selfrevert': {
			label: 'Mengembalikan uji coba sendiri',
			summary: 'Pemberitahuan: Pengembalian uji coba sendiri'
		},
		'uw-socialnetwork': {
			label: 'Wikipedia bukanlah jejaring sosial',
			summary: 'Pemberitahuan: Wikipedia bukanlah jejaring sosial'
		},
		'uw-sofixit': {
			label: 'Jangan ragu, Anda dapat memperbaikinya',
			summary: 'Pemberitahuan: Jangan ragu, Anda dapat memperbaikinya'
		},
		'uw-spoiler': {
			label: 'Menambahkan peringatan beberan atau menghapus beberan dari bagian terkait',
			summary: "Pemberitahuan: Jangan menghapus atau menandai kemungkinan 'beberan'"
		},
		'uw-talkinarticle': {
			label: 'Pembicaraan dalam artikel',
			summary: 'Pemberitahuan: Pembicaraan dalam artikel'
		},
		'uw-tilde': {
			label: 'Tidak menandatangani pesan',
			summary: 'Pemberitahuan: Tidak menandatangani pesan'
		},
		'uw-toppost': {
			label: 'Menulis pesan di bagian atas halaman pembicaraan',
			summary: 'Pemberitahuan: Penulisan pesan di bagian atas halaman pembicaraan'
		},
		'uw-userspace draft finish': {
			label: 'Draf ruang pengguna yang terbengkalai',
			summary: 'Pemberitahuan: Draf ruang pengguna yang terbengkalai'
		},
		'uw-vgscope': {
			label: 'Menambahkan instruksi, cara curang, atau penelusuran permainan video',
			summary: 'Pemberitahuan: Penambahan instruksi, cara curang, atau penelusuran permainan video'
		},
		'uw-warn': {
			label: 'Menggunakan templat peringatan pengguna setelah mengembalikan vandalisme',
			summary: 'Pemberitahuan: Penggunaan templat peringatan pengguna setelah mengembalikan vandalisme'
		},
		'uw-wrongsummary': {
			label: 'Ketidaksesuaian atau ketidakakuratan penggunaan ringkasan suntingan',
			summary: 'Pemberitahuan: Ketidaksesuaian atau ketidakakuratan penggunaan ringkasan suntingan'
		}
	},

	singlewarn: {
		'uw-3rr': {
			label: 'Melanggar aturan tiga kali pengembalian; lihat pula uw-ew',
			summary: 'Peringatan: Pelanggaran aturan tiga kali pengembalian'
		},
		'uw-affiliate': {
			label: 'Pemasaran afiliasi',
			summary: 'Peringatan: Pemasaran afiliasi'
		},
		'uw-agf-sock': {
			label: 'Menggunakan lebih dari satu akun (asumsikan niat baik)',
			summary: 'Peringatan: Penggunaan lebih dari satu akun'
		},
		'uw-attack': {
			label: 'Membuat halaman serangan',
			summary: 'Peringatan: Pembuatan halaman serangan',
			suppressArticleInSummary: true
		},
		'uw-botun': {
			label: 'Nama pengguna bot',
			summary: 'Peringatan: Nama pengguna bot'
		},
		'uw-canvass': {
			label: 'Penganvasan',
			summary: 'Peringatan: Penganvasan'
		},
		'uw-copyright': {
			label: 'Copyright violation',
			summary: 'Warning: Copyright violation'
		},
		'uw-copyright-link': {
			label: 'Pelanggaran hak cipta',
			summary: 'Peringatan: Pelanggaran hak cipta'
		},
		'uw-copyright-new': {
			label: 'Menautkan ke pelanggaran karya berhak cipta',
			summary: 'Peringatan: Tautan ke pelanggaran karya berhak cipta',
			heading: 'Wikipedia dan hak cipta'
		},
		'uw-copyright-remove': {
			label: 'Menghapus templat {{copyvio}} dari artikel',
			summary: 'Peringatan: Penghapusan templat {{copyvio}}'
		},
		'uw-efsummary': {
			label: 'Ringkasan suntingan memicu filter penyuntingan',
			summary: 'Pemberitahuan: Ringkasan suntingan memicu filter penyuntingan'
		},
		'uw-ew': {
			label: 'Perang suntingan (teguran keras)',
			summary: 'Peringatan: Perang suntingan'
		},
		'uw-ewsoft': {
			label: 'Perang suntingan (teguran lunak bagi pengguna baru)',
			summary: 'Pemberitahuan: Perang suntingan'
		},
		'uw-hijacking': {
			label: 'Hijacking articles',
			summary: 'Warning: Hijacking articles'
		},
		'uw-hoax': {
			label: 'Membuat cerita/kabar bohong',
			summary: 'Peringatan: Pembuatan cerita bohong'
		},
		'uw-legal': {
			label: 'Membuat ancaman hukum',
			summary: 'Peringatan: Pembuatan ancaman hukum'
		},
		'uw-login': {
			label: 'Menyunting setelah keluar log',
			summary: 'Pemberitahuan: Penyuntingan setelah keluar log'
		},
		'uw-multipleIPs': {
			label: 'Menggunakan lebih dari satu alamat IP',
			summary: 'Peringatan: Penggunaan lebih dari satu alamat IP'
		},
		'uw-pinfo': {
			label: 'Menambahkan info pribadi pengguna lain',
			summary: 'Peringatan: Penambahan info pribadi pengguna lain'
		},
		'uw-salt': {
			label: 'Membuat kembali artikel dalam daftar hitam judul dengan judul berbeda',
			summary: 'Peringatan: Pembuatan kembali artikel yang tidak diperkenankan dengan judul berbeda'
		},
		'uw-socksuspect': {
			label: 'Dugaan pengguna siluman',
			summary: 'Peringatan: Dugaan [[WP:SILUMAN|pengguna siluman]]'  // of User:...
		},
		'uw-upv': {
			label: 'Vandalisme halaman pengguna',
			summary: 'Peringatan: Vandalisme halaman pengguna'
		},
		'uw-username': {
			label: 'Nama pengguna tidak sesuai kebijakan',
			summary: 'Pemberitahuan: Nama pengguna tidak sesuai kebijakan',
			suppressArticleInSummary: true  // not relevant for this template
		},
		'uw-coi-username': {
			label: 'Nama pengguna tidak sesuai kebijakan, dan konflik kepentingan',
			summary: 'Pemberitahuan: Kebijakan konflik kepentingan dan nama pengguna',
			heading: 'Your username'
		},
		'uw-userpage': {
			label: 'Subhalaman atau halaman pengguna tidak sesuai kebijakan',
			summary: 'Pemberitahuan: Subhalaman atau halaman pengguna tidak sesuai kebijakan'
		}
	}
};

// Used repeatedly below across menu rebuilds
Twinkle.warn.prev_article = null;
Twinkle.warn.prev_reason = null;
Twinkle.warn.talkpageObj = null;

Twinkle.warn.callback.change_category = function twinklewarnCallbackChangeCategory(e) {
	var value = e.target.value;
	var sub_group = e.target.root.sub_group;
	sub_group.main_group = value;
	var old_subvalue = sub_group.value;
	var old_subvalue_re;
	if (old_subvalue) {
		if (value === 'kitchensink') { // Exact match possible in kitchensink menu
			old_subvalue_re = new RegExp(mw.util.escapeRegExp(old_subvalue));
		} else {
			old_subvalue = old_subvalue.replace(/\d*(im)?$/, '');
			old_subvalue_re = new RegExp(mw.util.escapeRegExp(old_subvalue) + '(\\d*(?:im)?)$');
		}
	}

	while (sub_group.hasChildNodes()) {
		sub_group.removeChild(sub_group.firstChild);
	}

	var selected = false;
	// worker function to create the combo box entries
	var createEntries = function(contents, container, wrapInOptgroup, val) {
		val = typeof val !== 'undefined' ? val : value; // IE doesn't support default parameters
		// level2->2, singlewarn->''; also used to distinguish the
		// scaled levels from singlenotice, singlewarn, and custom
		var level = val.replace(/^\D+/g, '');
		// due to an apparent iOS bug, we have to add an option-group to prevent truncation of text
		// (search WT:TW archives for "Problem selecting warnings on an iPhone")
		if (wrapInOptgroup && $.client.profile().platform === 'iphone') {
			var wrapperOptgroup = new Morebits.quickForm.element({
				type: 'optgroup',
				label: 'Templat yang tersedia'
			});
			wrapperOptgroup = wrapperOptgroup.render();
			container.appendChild(wrapperOptgroup);
			container = wrapperOptgroup;
		}

		$.each(contents, function(itemKey, itemProperties) {
			// Skip if the current template doesn't have a version for the current level
			if (!!level && !itemProperties[val]) {
				return;
			}
			var key = typeof itemKey === 'string' ? itemKey : itemProperties.value;
			var template = key + level;

			var elem = new Morebits.quickForm.element({
				type: 'option',
				label: '{{' + template + '}}: ' + (level ? itemProperties[val].label : itemProperties.label),
				value: template
			});

			// Select item best corresponding to previous selection
			if (!selected && old_subvalue && old_subvalue_re.test(template)) {
				elem.data.selected = selected = true;
			}
			var elemRendered = container.appendChild(elem.render());
			$(elemRendered).data('messageData', itemProperties);
		});
	};

	switch (value) {
		case 'singlenotice':
		case 'singlewarn':
			createEntries(Twinkle.warn.messages[value], sub_group, true);
			break;
		case 'singlecombined':
			var unSortedSinglets = $.extend({}, Twinkle.warn.messages.singlenotice, Twinkle.warn.messages.singlewarn);
			var sortedSingletMessages = {};
			Object.keys(unSortedSinglets).sort().forEach(function(key) {
				sortedSingletMessages[key] = unSortedSinglets[key];
			});
			createEntries(sortedSingletMessages, sub_group, true);
			break;
		case 'custom':
			createEntries(Twinkle.getPref('customWarningList'), sub_group, true);
			break;
		case 'kitchensink':
			['level1', 'level2', 'level3', 'level4', 'level4im'].forEach(function(lvl) {
				$.each(Twinkle.warn.messages.levels, function(_, levelGroup) {
					createEntries(levelGroup, sub_group, true, lvl);
				});
			});
			createEntries(Twinkle.warn.messages.singlenotice, sub_group, true);
			createEntries(Twinkle.warn.messages.singlewarn, sub_group, true);
			createEntries(Twinkle.getPref('customWarningList'), sub_group, true);
			break;
		case 'level1':
		case 'level2':
		case 'level3':
		case 'level4':
		case 'level4im':
			// Creates subgroup regardless of whether there is anything to place in it;
			// leaves "Removal of deletion tags" empty for 4im
			$.each(Twinkle.warn.messages.levels, function(groupLabel, groupContents) {
				var optgroup = new Morebits.quickForm.element({
					type: 'optgroup',
					label: groupLabel
				});
				optgroup = optgroup.render();
				sub_group.appendChild(optgroup);
				// create the options
				createEntries(groupContents, optgroup, false);
			});
			break;
		case 'autolevel':
			// Check user page to determine appropriate level
			var autolevelProc = function() {
				var wikitext = Twinkle.warn.talkpageObj.getPageText();
				// history not needed for autolevel
				var latest = Twinkle.warn.callbacks.dateProcessing(wikitext)[0];
				// Pseudo-params with only what's needed to parse the level i.e. no messageData
				var params = {
					sub_group: old_subvalue,
					article: e.target.root.article.value
				};
				var lvl = 'level' + Twinkle.warn.callbacks.autolevelParseWikitext(wikitext, params, latest)[1];

				// Identical to level1, etc. above but explicitly provides the level
				$.each(Twinkle.warn.messages.levels, function(groupLabel, groupContents) {
					var optgroup = new Morebits.quickForm.element({
						type: 'optgroup',
						label: groupLabel
					});
					optgroup = optgroup.render();
					sub_group.appendChild(optgroup);
					// create the options
					createEntries(groupContents, optgroup, false, lvl);
				});

				// Trigger subcategory change, add select menu, etc.
				Twinkle.warn.callback.postCategoryCleanup(e);
			};


			if (Twinkle.warn.talkpageObj) {
				autolevelProc();
			} else {
				var usertalk_page = new Morebits.wiki.page('User_talk:' + mw.config.get('wgRelevantUserName'), 'Loading previous warnings');
				usertalk_page.setFollowRedirect(true);
				usertalk_page.load(function(pageobj) {
					Twinkle.warn.talkpageObj = pageobj; // Update talkpageObj
					autolevelProc();
				});
			}
			break;
		default:
			alert('Unknown warning group in twinklewarn');
			break;
	}

	// Trigger subcategory change, add select menu, etc.
	// Here because of the async load for autolevel
	if (value !== 'autolevel') {
		// reset any autolevel-specific messages while we're here
		$('#twinkle-warn-autolevel-message').remove();

		Twinkle.warn.callback.postCategoryCleanup(e);
	}
};

Twinkle.warn.callback.postCategoryCleanup = function twinklewarnCallbackPostCategoryCleanup(e) {
	// clear overridden label on article textbox
	Morebits.quickForm.setElementTooltipVisibility(e.target.root.article, true);
	Morebits.quickForm.resetElementLabel(e.target.root.article);
	// Trigger custom label/change on main category change
	Twinkle.warn.callback.change_subcategory(e);

	// Use select2 to make the select menu searchable
	if (!Twinkle.getPref('oldSelect')) {
		$('select[name=sub_group]')
			.select2({
				width: '100%',
				matcher: Morebits.select2.matchers.optgroupFull,
				templateResult: Morebits.select2.highlightSearchMatches,
				language: {
					searching: Morebits.select2.queryInterceptor
				}
			})
			.change(Twinkle.warn.callback.change_subcategory);

		$('.select2-selection').keydown(Morebits.select2.autoStart);

		mw.util.addCSS(
			// prevent dropdown from appearing behind the dialog, just in case
			'.select2-container { z-index: 10000; }' +

			// Increase height
			'.select2-container .select2-dropdown .select2-results > .select2-results__options { max-height: 350px; }' +

			// Reduce padding
			'.select2-results .select2-results__option { padding-top: 1px; padding-bottom: 1px; }' +
			'.select2-results .select2-results__group { padding-top: 1px; padding-bottom: 1px; } ' +

			// Adjust font size
			'.select2-container .select2-dropdown .select2-results { font-size: 13px; }' +
			'.select2-container .selection .select2-selection__rendered { font-size: 13px; }'
		);
	}
};

Twinkle.warn.callback.change_subcategory = function twinklewarnCallbackChangeSubcategory(e) {
	var main_group = e.target.form.main_group.value;
	var value = e.target.form.sub_group.value;

	// Tags that don't take a linked article, but something else (often a username).
	// The value of each tag is the label next to the input field
	var notLinkedArticle = {
		'uw-agf-sock': 'Optional username of other account (without User:) ',
		'uw-bite': "Username of 'bitten' user (without User:) ",
		'uw-socksuspect': 'Username of sock master, if known (without User:) ',
		'uw-username': 'Username violates policy because... ',
		'uw-aiv': 'Optional username that was reported (without User:) '
	};

	if (['singlenotice', 'singlewarn', 'singlecombined', 'kitchensink'].indexOf(main_group) !== -1) {
		if (notLinkedArticle[value]) {
			if (Twinkle.warn.prev_article === null) {
				Twinkle.warn.prev_article = e.target.form.article.value;
			}
			e.target.form.article.notArticle = true;
			e.target.form.article.value = '';

			// change form labels according to the warning selected
			Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, false);
			Morebits.quickForm.overrideElementLabel(e.target.form.article, notLinkedArticle[value]);
		} else if (e.target.form.article.notArticle) {
			if (Twinkle.warn.prev_article !== null) {
				e.target.form.article.value = Twinkle.warn.prev_article;
				Twinkle.warn.prev_article = null;
			}
			e.target.form.article.notArticle = false;
			Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, true);
			Morebits.quickForm.resetElementLabel(e.target.form.article);
		}
	}

	// add big red notice, warning users about how to use {{uw-[coi-]username}} appropriately
	$('#tw-warn-red-notice').remove();
	var $redWarning;
	if (value === 'uw-username') {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{uw-username}} seharusnya <b>tidak</b> digunakan untuk pelanggaran kebijakan nama pengguna secara <b>terang-terangan</b>. " +
			'Pelanggaran terang-terangan seharusnya dilaporkan langsung kepada UAA (via tab ARV pada Twinkle). ' +
			'{{uw-username}} sebaiknya hanya digunakan dalam kasus ringan untuk berdiskusi dengan pengguna tersebut.</div>');
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	} else if (value === 'uw-coi-username') {
		$redWarning = $("<div style='color: red;' id='tw-warn-red-notice'>{{uw-coi-username}} seharusnya <b>tidak</b> digunakan untuk pelanggaran kebijakan nama pengguna secara <b>terang-terangan</b>. " +
			"Blatant violations should be reported directly to UAA (via Twinkle's ARV tab). " +
			'{{uw-coi-username}} sebaiknya hanya digunakan dalam kasus ringan untuk berdiskusi dengan pengguna tersebut.</div>');
		$redWarning.insertAfter(Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup));
	}
};

Twinkle.warn.callbacks = {
	getWarningWikitext: function(templateName, article, reason, isCustom) {
		var text = '{{subst:' + templateName;

		// add linked article for user warnings
		if (article) {
			// c&pmove has the source as the first parameter
			if (templateName === 'uw-c&pmove') {
				text += '|to=' + article;
			} else {
				text += '|1=' + article;
			}
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
	showPreview: function(form, templatename) {
		// Provided on autolevel, not otherwise
		templatename = templatename || form.sub_group.value;
		var linkedarticle = form.article.value;
		var templatetext;

		templatetext = Twinkle.warn.callbacks.getWarningWikitext(templatename, linkedarticle,
			form.reason.value, form.main_group.value === 'custom');

		form.previewer.beginRender(templatetext, 'User_talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username
	},
	// Just a pass-through unless the autolevel option was selected
	preview: function(form) {
		if (form.main_group.value === 'autolevel') {
			// Always get a new, updated talkpage for autolevel processing
			var usertalk_page = new Morebits.wiki.page('User_talk:' + mw.config.get('wgRelevantUserName'), 'Loading previous warnings');
			usertalk_page.setFollowRedirect(true);
			usertalk_page.load(function(pageobj) {
				Twinkle.warn.talkpageObj = pageobj; // Update talkpageObj

				var wikitext = pageobj.getPageText();
				// history not needed for autolevel
				var latest = Twinkle.warn.callbacks.dateProcessing(wikitext)[0];
				var params = {
					sub_group: form.sub_group.value,
					article: form.article.value,
					messageData: $(form.sub_group).find('option[value="' + $(form.sub_group).val() + '"]').data('messageData')
				};
				var template = Twinkle.warn.callbacks.autolevelParseWikitext(wikitext, params, latest)[0];
				Twinkle.warn.callbacks.showPreview(form, template);

				// If the templates have diverged, fake a change event
				// to reload the menu with the updated pageobj
				if (form.sub_group.value !== template) {
					var evt = document.createEvent('Event');
					evt.initEvent('change', true, true);
					form.main_group.dispatchEvent(evt);
				}
			});
		} else {
			Twinkle.warn.callbacks.showPreview(form);
		}
	},
	/**
	* Used in the main and autolevel loops to determine when to warn
	* about excessively recent, stale, or identical warnings.
	* @param {string} wikitext  The text of a user's talk page, from getPageText()
	* @returns {Object[]} - Array of objects: latest contains most recent
	* warning and date; history lists all prior warnings
	*/
	dateProcessing: function(wikitext) {
		var history_re = /<!--\s?Template:([uU]w-.*?)\s?-->.*?(\d{1,2}:\d{1,2}, \d{1,2} \w+ \d{4} \(UTC\))/g;
		var history = {};
		var latest = { date: new Morebits.date(0), type: '' };
		var current;

		while ((current = history_re.exec(wikitext)) !== null) {
			var template = current[1], current_date = new Morebits.date(current[2]);
			if (!(template in history) || history[template].isBefore(current_date)) {
				history[template] = current_date;
			}
			if (!latest.date.isAfter(current_date)) {
				latest.date = current_date;
				latest.type = template;
			}
		}
		return [latest, history];
	},
	/**
	* Main loop for deciding what the level should increment to. Most of
	* this is really just error catching and updating the subsequent data.
	* May produce up to two notices in a twinkle-warn-autolevel-messages div
	*
	* @param {string} wikitext  The text of a user's talk page, from getPageText() (required)
	* @param {Object} params  Params object: sub_group is the template (required);
	* article is the user-provided article (form.article) used to link ARV on recent level4 warnings;
	* messageData is only necessary if getting the full template, as it's
	* used to ensure a valid template of that level exists
	* @param {Object} latest  First element of the array returned from
	* dateProcessing. Provided here rather than processed within to avoid
	* repeated call to dateProcessing
	* @param {(Date|Morebits.date)} date  Date from which staleness is determined
	* @param {Morebits.status} statelem  Status element, only used for handling error in final execution
	*
	* @returns {Array} - Array that contains the full template and just the warning level
	*/
	autolevelParseWikitext: function(wikitext, params, latest, date, statelem) {
		var template = params.sub_group.replace(/(.*)\d$/, '$1');

		var level; // undefined rather than '' means the isNaN below will return true
		if (/\d(?:im)?$/.test(latest.type)) { // level1-4im
			level = parseInt(latest.type.replace(/.*(\d)(?:im)?$/, '$1'), 10);
		} else if (latest.type) { // Non-numbered warning
			// Try to leverage existing categorization of
			// warnings, all but one are universally lowercased
			var loweredType = /uw-multipleIPs/i.test(template) ? 'uw-multipleIPs' : template.toLowerCase();
			// It would be nice to account for blocks, but in most
			// cases the hidden message is terminal, not the sig
			if (Twinkle.warn.messages.singlewarn[loweredType]) {
				level = 3;
			} else {
				level = 1; // singlenotice or not found
			}
		}

		var $autolevelMessage = $('<div/>', {'id': 'twinkle-warn-autolevel-message'});

		if (isNaN(level)) { // No prior warnings found, this is the first
			level = 1;
		} else if (level > 4 || level < 1) { // Shouldn't happen
			var message = 'Unable to parse previous warning level, please manually select a warning level.';
			if (statelem) {
				statelem.error(message);
			} else {
				alert(message);
			}
			return;
		} else {
			date = date || new Date();
			var autoTimeout = new Morebits.date(latest.date.getTime()).add(parseInt(Twinkle.getPref('autolevelStaleDays'), 10), 'days');
			if (autoTimeout.isAfter(date)) {
				if (level === 4) {
					level = 4;
					// Basically indicates whether we're in the final Main evaluation or not,
					// and thus whether we can continue or need to display the warning and link
					if (!statelem) {
						var $link = $('<a/>', {
							'href': '#',
							'text': 'click here to open the ARV tool.',
							'css': { 'fontWeight': 'bold' },
							'click': function() {
								Morebits.wiki.actionCompleted.redirect = null;
								Twinkle.warn.dialog.close();
								Twinkle.arv.callback(mw.config.get('wgRelevantUserName'));
								$('input[name=page]').val(params.article); // Target page
								$('input[value=final]').prop('checked', true); // Vandalism after final
							}
						});
						var statusNode = $('<div/>', {
							'text': mw.config.get('wgRelevantUserName') + ' recently received a level 4 warning (' + latest.type + ') so it might be better to report them instead; ',
							'css': {'color': 'red' }
						});
						statusNode.append($link[0]);
						$autolevelMessage.append(statusNode);
					}
				} else { // Automatically increase severity
					level += 1;
				}
			} else { // Reset warning level if most-recent warning is too old
				level = 1;
			}
		}

		// Validate warning level, falling back to the uw-generic series.
		// Only a few items are missing a level, and in all but a handful
		// of cases, the uw-generic series is explicitly used elsewhere per WP:UTM.
		if (params.messageData && !params.messageData['level' + level]) {
			template = 'uw-generic';
		}
		template += level;

		$autolevelMessage.prepend($('<div>Will issue a <span style="font-weight: bold;">level ' + level + '</span> template.</div>'));
		// After the only other message: the (text-only) staleness note
		$('#twinkle-warn-autolevel-message').remove(); // clean slate
		$autolevelMessage.insertAfter($('#twinkle-warn-warning-message'));

		return [template, level];
	},
	main: function(pageobj) {
		var text = pageobj.getPageText();
		var statelem = pageobj.getStatusElement();
		var params = pageobj.getCallbackParameters();
		var messageData = params.messageData;

		// JS somehow didn't get destructured assignment until ES6 so of course IE doesn't support it
		var warningHistory = Twinkle.warn.callbacks.dateProcessing(text);
		var latest = warningHistory[0];
		var history = warningHistory[1];

		var now = new Morebits.date(pageobj.getLoadTime());

		Twinkle.warn.talkpageObj = pageobj; // Update talkpageObj, just in case
		if (params.main_group === 'autolevel') {
			// [template, level]
			var templateAndLevel = Twinkle.warn.callbacks.autolevelParseWikitext(text, params, latest, now, statelem);

			// Only if there's a change from the prior display/load
			if (params.sub_group !== templateAndLevel[0] && !confirm('Will issue a {{' + templateAndLevel[0] + '}} template to the user, okay?')) {
				pageobj.statelem.info('dibatalkan sesuai permintaan pengguna');
				return;
			}
			// Update params now that we've selected a warning
			params.sub_group = templateAndLevel[0];
			messageData = params.messageData['level' + templateAndLevel[1]];
		} else if (params.sub_group in history) {
			if (new Morebits.date(history[params.sub_group]).add(1, 'day').isAfter(now)) {
				if (!confirm('Suatu ' + params.sub_group + ' yang identik telah diberikan dalam 24 jam terakhir.  \nAnda tetap ingin memberikan peringatan/pemberitahuan ini?')) {
					pageobj.statelem.info('dibatalkan sesuai permintaan pengguna');
					return;
				}
			}
		}

		latest.date.add(1, 'minute'); // after long debate, one minute is max

		if (latest.date.isAfter(now)) {
			if (!confirm('A ' + latest.type + ' diberikan dalam satu menit terakhir.  \nAnda tetap ingin memberikan peringatan/pemberitahuan ini?')) {
				pageobj.statelem.info('dibatalkan sesuai permintaan pengguna');
				return;
			}
		}

		var dateHeaderRegex = now.monthHeaderRegex(), dateHeaderRegexLast, dateHeaderRegexResult;
		while ((dateHeaderRegexLast = dateHeaderRegex.exec(text)) !== null) {
			dateHeaderRegexResult = dateHeaderRegexLast;
		}
		// If dateHeaderRegexResult is null then lastHeaderIndex is never checked. If it is not null but
		// \n== is not found, then the date header must be at the very start of the page. lastIndexOf
		// returns -1 in this case, so lastHeaderIndex gets set to 0 as desired.
		var lastHeaderIndex = text.lastIndexOf('\n==') + 1;

		if (text.length > 0) {
			text += '\n\n';
		}

		if (messageData.heading) {
			text += '== ' + messageData.heading + ' ==\n';
		} else if (!dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex) {
			Morebits.status.info('Info', 'Akan membuat judul tingkat 2 yang baru untuk tanggal tersebut, karena belum ada untuk bulan ini');
			text += now.monthHeader() + '\n';
		}
		text += Twinkle.warn.callbacks.getWarningWikitext(params.sub_group, params.article,
			params.reason, params.main_group === 'custom');

		if (Twinkle.getPref('showSharedIPNotice') && mw.util.isIPAddress(mw.config.get('wgTitle'))) {
			Morebits.status.info('Info', 'Menambahkan pemberitahuan IP bersama');
			text += '\n{{subst:Shared IP advice}}';
		}

		// build the edit summary
		var summary;
		if (params.main_group === 'custom') {
			switch (params.sub_group.substr(-1)) {
				case '1':
					summary = 'Catatan umum';
					break;
				case '2':
					summary = 'Pemberitahuan';
					break;
				case '3':
					summary = 'Peringatan';
					break;
				case '4':
					summary = 'Peringatan terakhir';
					break;
				case 'm':
					if (params.sub_group.substr(-3) === '4im') {
						summary = 'Sekadar peringatan';
						break;
					}
					summary = 'Pemberitahuan';
					break;
				default:
					summary = 'Pemberitahuan';
					break;
			}
			summary += ': ' + Morebits.string.toUpperCaseFirstChar(messageData.label);
		} else {
			// Normalize kitchensink to the 1-4im style
			if (params.main_group === 'kitchensink' && !/^D+$/.test(params.sub_group)) {
				var sub = params.sub_group.substr(-1);
				if (sub === 'm') {
					sub = params.sub_group.substr(-3);
				}
				// Don't overwrite uw-3rr, technically unnecessary
				if (/\d/.test(sub)) {
					params.main_group = 'level' + sub;
				}
			}
			summary = /^\D+$/.test(params.main_group) ? messageData.summary : messageData[params.main_group].summary;
			if (messageData.suppressArticleInSummary !== true && params.article) {
				if (params.sub_group === 'uw-agf-sock' ||
						params.sub_group === 'uw-socksuspect' ||
						params.sub_group === 'uw-aiv') {  // these templates require a username
					summary += ' dari [[:User:' + params.article + ']]';
				} else {
					summary += ' di [[:' + params.article + ']]';
				}
			}
		}
		summary += '.' + Twinkle.getPref('summaryAd');

		pageobj.setPageText(text);
		pageobj.setEditSummary(summary);
		pageobj.setWatchlist(Twinkle.getPref('watchWarnings'));
		pageobj.save();
	}
};

Twinkle.warn.callback.evaluate = function twinklewarnCallbackEvaluate(e) {
	var userTalkPage = 'User_talk:' + mw.config.get('wgRelevantUserName');

	// First, check to make sure a reason was filled in if uw-username was selected

	if (e.target.sub_group.value === 'uw-username' && e.target.article.value.trim() === '') {
		alert('Anda harus menuliskan alasan untuk menggunakan templat {{uw-username}}.');
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
		messageData: selectedEl.data('messageData')
	};

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(e.target);

	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'Peringatan telah diberikan, memuat kembali halaman pembicaraan dalam beberapa detik';

	var wikipedia_page = new Morebits.wiki.page(userTalkPage, 'Perubahan halaman pembicaraan pengguna');
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.load(Twinkle.warn.callbacks.main);
};
})(jQuery);


// </nowiki>
