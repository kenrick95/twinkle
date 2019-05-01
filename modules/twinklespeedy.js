//<nowiki>


(function($){


/*
 ****************************************
 *** twinklespeedy.js: CSD module
 ****************************************
 * Mode of invocation:     Tab ("CSD")
 * Active on:              Non-special, existing pages
 * Config directives in:   TwinkleConfig
 *
 * NOTE FOR DEVELOPERS:
 *   If adding a new criterion, add it to the appropriate places at the top of
 *   twinkleconfig.js.  Also check out the default values of the CSD preferences
 *   in twinkle.js, and add your new criterion to those if you think it would be
 *   good.
 */

Twinkle.speedy = function twinklespeedy() {
	// Disable on:
	// * special pages
	// * non-existent pages
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}

	Twinkle.addPortletLink( Twinkle.speedy.callback, "KPC", "tw-csd", Morebits.userIsInGroup('sysop') ? "Hapus halaman berdasarkan WP:KPC" : "Meminta penghapusan cepat menurut WP:KPC" );
};

// This function is run when the CSD tab/header link is clicked
Twinkle.speedy.callback = function twinklespeedyCallback() {
	Twinkle.speedy.initDialog(Morebits.userIsInGroup( 'sysop' ) ? Twinkle.speedy.callback.evaluateSysop : Twinkle.speedy.callback.evaluateUser, true);
};

// Used by unlink feature
Twinkle.speedy.dialog = null;

// The speedy criteria list can be in one of several modes
Twinkle.speedy.mode = {
	sysopSingleSubmit: 1,  // radio buttons, no subgroups, submit when "Submit" button is clicked
	sysopRadioClick: 2,  // radio buttons, no subgroups, submit when a radio button is clicked
	sysopMultipleSubmit: 3, // check boxes, subgroups, "Submit" button already present
	sysopMultipleRadioClick: 4, // check boxes, subgroups, need to add a "Submit" button
	userMultipleSubmit: 5,  // check boxes, subgroups, "Submit" button already pressent
	userMultipleRadioClick: 6,  // check boxes, subgroups, need to add a "Submit" button
	userSingleSubmit: 7,  // radio buttons, subgroups, submit when "Submit" button is clicked
	userSingleRadioClick: 8,  // radio buttons, subgroups, submit when a radio button is clicked

	// are we in "delete page" mode?
	// (sysops can access both "delete page" [sysop] and "tag page only" [user] modes)
	isSysop: function twinklespeedyModeIsSysop(mode) {
		return mode === Twinkle.speedy.mode.sysopSingleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleSubmit ||
			mode === Twinkle.speedy.mode.sysopRadioClick ||
			mode === Twinkle.speedy.mode.sysopMultipleRadioClick;
	},
	// do we have a "Submit" button once the form is created?
	hasSubmitButton: function twinklespeedyModeHasSubmitButton(mode) {
		return mode === Twinkle.speedy.mode.sysopSingleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleRadioClick ||
			mode === Twinkle.speedy.mode.userMultipleSubmit ||
			mode === Twinkle.speedy.mode.userMultipleRadioClick ||
			mode === Twinkle.speedy.mode.userSingleSubmit;
	},
	// is db-multiple the outcome here?
	isMultiple: function twinklespeedyModeIsMultiple(mode) {
		return mode === Twinkle.speedy.mode.userMultipleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleSubmit ||
			mode === Twinkle.speedy.mode.userMultipleRadioClick ||
			mode === Twinkle.speedy.mode.sysopMultipleRadioClick;
	},
};

// Prepares the speedy deletion dialog and displays it
Twinkle.speedy.initDialog = function twinklespeedyInitDialog(callbackfunc) {
	var dialog;
	Twinkle.speedy.dialog = new Morebits.simpleWindow( Twinkle.getPref('speedyWindowWidth'), Twinkle.getPref('speedyWindowHeight') );
	dialog = Twinkle.speedy.dialog;
	dialog.setTitle( "Pilih kriteria penghapusan cepat" );
	dialog.setScriptName( "Twinkle" );
	dialog.addFooterLink( "Kriteria Penghapusan Cepat", "WP:KPC" );
	dialog.addFooterLink( "Bantuan Twinkle", "WP:TW/DOC#speedy" );

	var form = new Morebits.quickForm( callbackfunc, (Twinkle.getPref('speedySelectionStyle') === 'radioClick' ? 'change' : null) );
	if( Morebits.userIsInGroup( 'sysop' ) ) {
		form.append( {
				type: 'checkbox',
				list: [
					{
						label: 'Hanya tandai halaman, jangan hapus',
						value: 'tag_only',
						name: 'tag_only',
						tooltip: 'Jika Anda hanya ingin menadai halaman alih-alih menghapusnya sekarang',
						checked : Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							var cForm = event.target.form;
							var cChecked = event.target.checked;
							// enable/disable talk page checkbox
							if (cForm.talkpage) {
								cForm.talkpage.disabled = cChecked;
								cForm.talkpage.checked = !cChecked && Twinkle.getPref('deleteTalkPageOnDelete');
							}
							// enable/disable redirects checkbox
							cForm.redirects.disabled = cChecked;
							cForm.redirects.checked = !cChecked;
							// enable/disable delete multiple
							cForm.delmultiple.disabled = cChecked;
							cForm.delmultiple.checked = false;
							// enable/disable open talk page checkbox
							cForm.openusertalk.disabled = cChecked;
							cForm.openusertalk.checked = false;

							// enable/disable notify checkbox
							cForm.notify.disabled = !cChecked;
							cForm.notify.checked = cChecked;
							// enable/disable multiple
							cForm.multiple.disabled = !cChecked;
							cForm.multiple.checked = false;

							Twinkle.speedy.callback.modeChanged(cForm);

							event.stopPropagation();
						}
					}
				]
			} );

		var deleteOptions = form.append( {
				type: 'div',
				name: 'delete_options'
			} );
		deleteOptions.append( {
				type: 'header',
				label: 'Opsi penghapusan terkait'
			} );
		if (mw.config.get('wgNamespaceNumber') % 2 === 0 && (mw.config.get('wgNamespaceNumber') !== 2 || (/\//).test(mw.config.get('wgTitle')))) {  // hide option for user pages, to avoid accidentally deleting user talk page
			deleteOptions.append( {
				type: 'checkbox',
				list: [
					{
						label: 'Hapus juga halaman pembicaraan',
						value: 'talkpage',
						name: 'talkpage',
						tooltip: "Pilihan ini juga menghapus halaman pembicaraan halaman ini. Jika Anda memilih KPC B8 (telah dipindahkan ke Commons), opsi ini tidak ditindaklanjuti dan halaman pembicaraan *tidak* dihapus.",
						checked: Twinkle.getPref('deleteTalkPageOnDelete'),
						disabled: Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							event.stopPropagation();
						}
					}
				]
			} );
		}
		deleteOptions.append( {
				type: 'checkbox',
				list: [
					{
						label: 'Hapus juga semua pengalihan',
						value: 'redirects',
						name: 'redirects',
						tooltip: "Opsi ini juga menghapus semua pengalihan yang beralih ke halaman ini. Abaikan jika penghapusan bersifat prosedural (misalnya pindah halaman).",
						checked: Twinkle.getPref('deleteRedirectsOnDelete'),
						disabled: Twinkle.getPref('deleteSysopDefaultToTag'),
						event: function( event ) {
							event.stopPropagation();
						}
					}
				]
			} );
		deleteOptions.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Hapus dengan alasan beberapa kriteria',
					value: 'delmultiple',
					name: 'delmultiple',
					tooltip: "Ketika terpilih, Anda dapat memilih beberapa kriteria yang dapat dipakai ke halaman. Misalnya, U11 dan A7.",
					event: function( event ) {
						Twinkle.speedy.callback.modeChanged( event.target.form );
						event.stopPropagation();
					}
				}
			]
		} );
		deleteOptions.append( {
				type: 'checkbox',
				list: [
					{
						label: 'Buka halaman pembicaraan pengguna saat mengirimkan',
						value: 'openusertalk',
						name: 'openusertalk',
						tooltip: 'Secara baku akan membuka preferensi buka-halaman-pembicaraan ketika menghapus halaman dengan alasan ini. Jangan ubah jika Anda memilihnya untuk menghapus dalam beberapa kriteria.',
						checked : false
					}
				]
			} );
	}

	var tagOptions = form.append( {
			type: 'div',
			name: 'tag_options'
		} );

	if( Morebits.userIsInGroup( 'sysop' ) ) {
		tagOptions.append( {
				type: 'header',
				label: 'Opsi terkait dengan tag'
			} );
	}

	tagOptions.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Hubungi pembuat halaman jika memungkinkan',
					value: 'notify',
					name: 'notify',
					tooltip: "Templat notifikasi akan diberikan pada halaman pembicaraan pembuat halaman, JIKA Anda mengaktifkan notifikasi di preferensi Twinkle " +
						"untuk kriteria yang Anda pilih DAN kotak ini diberi ceklis. Pembuat halaman akan disambut juga.",
					checked: !Morebits.userIsInGroup( 'sysop' ) || Twinkle.getPref('deleteSysopDefaultToTag'),
					disabled: Morebits.userIsInGroup( 'sysop' ) && !Twinkle.getPref('deleteSysopDefaultToTag'),
					event: function( event ) {
						event.stopPropagation();
					}
				}
			]
		} );
	tagOptions.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Tandai dengan beberapa tag',
					value: 'multiple',
					name: 'multiple',
					tooltip: "Ketika dipilih, Anda dapat memilih beberapa kriteria untuk diterapkan. Contohnya, G11 dan A7 adalah gabungan umum pada artikel.",
					disabled: Morebits.userIsInGroup( 'sysop' ) && !Twinkle.getPref('deleteSysopDefaultToTag'),
					event: function( event ) {
						Twinkle.speedy.callback.modeChanged( event.target.form );
						event.stopPropagation();
					}
				}
			]
		} );

	form.append( {
			type: 'div',
			name: 'work_area',
			label: 'Gagal menginisialisasi modul KPC. Ulangi kembali atau beritahukan pengembang Twinkle mengenai masalah ini.'
		} );

	if( Twinkle.getPref( 'speedySelectionStyle' ) !== 'radioClick' ) {
		form.append( { type: 'submit' } );
	}

	var result = form.render();
	dialog.setContent( result );
	dialog.display();

	Twinkle.speedy.callback.modeChanged( result );

	// if sysop, check if CSD is already on the page and fill in custom rationale
	if (Morebits.userIsInGroup('sysop') && $("#delete-reason").length) {
		var customOption = $("input[name=csd][value=reason]")[0];

		if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
			// force listeners to re-init
			customOption.click();
			customOption.parentNode.appendChild(customOption.subgroup);
		}

		customOption.subgroup.querySelector('input').value = decodeURIComponent($("#delete-reason").text()).replace(/\+/g, ' ');
	}
};

Twinkle.speedy.callback.getMode = function twinklespeedyCallbackGetMode(form) {
	var mode = Twinkle.speedy.mode.userSingleSubmit;
	if (form.tag_only && !form.tag_only.checked) {
		if (form.delmultiple.checked) {
			mode = Twinkle.speedy.mode.sysopMultipleSubmit;
		} else {
			mode = Twinkle.speedy.mode.sysopSingleSubmit;
		}
	} else {
		if (form.multiple.checked) {
			mode = Twinkle.speedy.mode.userMultipleSubmit;
		} else {
			mode = Twinkle.speedy.mode.userSingleSubmit;
		}
	}
	if (Twinkle.getPref('speedySelectionStyle') === 'radioClick') {
		mode++;
	}

	return mode;
};

Twinkle.speedy.callback.modeChanged = function twinklespeedyCallbackModeChanged(form) {
	var namespace = mw.config.get('wgNamespaceNumber');

	// first figure out what mode we're in
	var mode = Twinkle.speedy.callback.getMode(form);

	if (Twinkle.speedy.mode.isSysop(mode)) {
		$("[name=delete_options]").show();
		$("[name=tag_options]").hide();
	} else {
		$("[name=delete_options]").hide();
		$("[name=tag_options]").show();
	}

	var work_area = new Morebits.quickForm.element( {
			type: 'div',
			name: 'work_area'
		} );

	if (mode === Twinkle.speedy.mode.userMultipleRadioClick || mode === Twinkle.speedy.mode.sysopMultipleRadioClick) {
		var evaluateType = Twinkle.speedy.mode.isSysop(mode) ? 'evaluateSysop' : 'evaluateUser';

		work_area.append( {
				type: 'div',
				label: 'Setelah selesai, klik:'
			} );
		work_area.append( {
				type: 'button',
				name: 'submit-multiple',
				label: 'Submit Query',
				event: function( event ) {
					Twinkle.speedy.callback[evaluateType]( event );
					event.stopPropagation();
				}
			} );
	}

	var radioOrCheckbox = (Twinkle.speedy.mode.isMultiple(mode) ? 'checkbox' : 'radio');

	if (Twinkle.speedy.mode.isSysop(mode) && !Twinkle.speedy.mode.isMultiple(mode)) {
		work_area.append( { type: 'header', label: 'Alasan lain' } );
		work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.customRationale, mode) } );
	}

	if (namespace % 2 === 1 && namespace !== 3) {
		// show db-talk on talk pages, but not user talk pages
		work_area.append( { type: 'header', label: 'Halaman pembicaraan' } );
		work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.talkList, mode) } );
	}

	if (!mw.config.get('wgIsRedirect')) {
		switch (namespace) {
			case 0:  // article
			case 1:  // talk
				work_area.append( { type: 'header', label: 'Artikel' } );
				work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.articleList, mode) } );
				break;

			case 2:  // user
			case 3:  // user talk
				work_area.append( { type: 'header', label: 'Halaman pengguna' } );
				work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.userList, mode) } );
				break;

			case 6:  // file
			case 7:  // file talk
				work_area.append( { type: 'header', label: 'Berkas' } );
				work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.fileList, mode) } );
				if (!Twinkle.speedy.mode.isSysop(mode)) {
					work_area.append( { type: 'div', label: 'Menandai untuk KPC B4 (tanpa lisensi), B5 (penggunaan wajar tak terpakai), F6 (tanpa alasan penggunaan untuk penggunaan wajar), dan F11 (tanpa izin) dapat menggunakan tab "DI".' } );
				}
				break;

			case 10:  // template
			case 11:  // template talk
				work_area.append( { type: 'header', label: 'Templat' } );
				work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.templateList, mode) } );
				break;

			case 14:  // category
			case 15:  // category talk
				work_area.append( { type: 'header', label: 'Kategori' } );
				work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.categoryList, mode) } );
				break;

			case 100:  // portal
			case 101:  // portal talk
				work_area.append( { type: 'header', label: 'Portal' } );
				work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.portalList, mode) } );
				break;

			default:
				break;
		}
	}

	// custom rationale lives under general criteria when tagging
	var generalCriteria = Twinkle.speedy.generalList;
	if(!Twinkle.speedy.mode.isSysop(mode)) {
		generalCriteria = Twinkle.speedy.customRationale.concat(generalCriteria);
	}
	work_area.append( { type: 'header', label: 'Kriteria umum' } );
	work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(generalCriteria, mode) });

	if(mw.config.get('wgIsRedirect')) {
		work_area.append( { type: 'header', label: 'Pengalihan' } );
		work_area.append( { type: radioOrCheckbox, name: 'csd', list: Twinkle.speedy.generateCsdList(Twinkle.speedy.redirectList, mode) } );
	}

	var old_area = Morebits.quickForm.getElements(form, "work_area")[0];
	form.replaceChild(work_area.render(), old_area);
};

Twinkle.speedy.generateCsdList = function twinklespeedyGenerateCsdList(list, mode) {
	// mode switches
	var isSysop = Twinkle.speedy.mode.isSysop(mode);
	var multiple = Twinkle.speedy.mode.isMultiple(mode);
	var hasSubmitButton = Twinkle.speedy.mode.hasSubmitButton(mode);

	var openSubgroupHandler = function(e) {
		$(e.target.form).find('input').prop('disabled', true);
		$(e.target.form).children().css('color', 'gray');
		$(e.target).parent().css('color', 'black').find('input').prop('disabled', false);
		$(e.target).parent().find('input:text')[0].focus();
		e.stopPropagation();
	};
	var submitSubgroupHandler = function(e) {
		var evaluateType = Twinkle.speedy.mode.isSysop(mode) ? 'evaluateSysop' : 'evaluateUser';
		Twinkle.speedy.callback[evaluateType](e);
		e.stopPropagation();
	};

	return $.map(list, function(critElement) {
		var criterion = $.extend({}, critElement);

		if (multiple) {
			if (criterion.hideWhenMultiple) {
				return null;
			}
			if (criterion.hideSubgroupWhenMultiple) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenSingle) {
				return null;
			}
			if (criterion.hideSubgroupWhenSingle) {
				criterion.subgroup = null;
			}
		}

		if (isSysop) {
			if (criterion.hideWhenSysop) {
				return null;
			}
			if (criterion.hideSubgroupWhenSysop) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenUser) {
				return null;
			}
			if (criterion.hideSubgroupWhenUser) {
				criterion.subgroup = null;
			}
		}

		if (mw.config.get('wgIsRedirect') && criterion.hideWhenRedirect) {
			return null;
		}

		if (criterion.subgroup && !hasSubmitButton) {
			if ($.isArray(criterion.subgroup)) {
				criterion.subgroup.push({
					type: 'button',
					name: 'submit',
					label: 'Kirim permintaan',
					event: submitSubgroupHandler
				});
			} else {
				criterion.subgroup = [
					criterion.subgroup,
					{
						type: 'button',
						name: 'submit',  // ends up being called "csd.submit" so this is OK
						label: 'Kirim permintaan',
						event: submitSubgroupHandler
					}
				];
			}
			// FIXME: does this do anything?
			criterion.event = openSubgroupHandler;
		}

		if ( isSysop ) {
			var originalEvent = criterion.event;
			criterion.event = function(e) {
				if (multiple) return originalEvent(e);

				var normalizedCriterion = Twinkle.speedy.normalizeHash[e.target.value];
				$('[name=openusertalk]').prop('checked',
						Twinkle.getPref('openUserTalkPageOnSpeedyDelete').indexOf(normalizedCriterion) !== -1
					);
				if ( originalEvent ) {
					return originalEvent(e);
				}
			};
		}

		return criterion;
	});
};

Twinkle.speedy.customRationale = [
	{
		label: 'Alasan lain' + (Morebits.userIsInGroup('sysop') ? ' (alasan penghapusan lainnya)' : ' menggunakan kriteria templat {{db}}'),
		value: 'reason',
		tooltip: '{{db}} kependekan dari "dihapus karena". Sekurang-kurangnya satu kriteria harus diberikan, dan sebutkan alasannya.',
		subgroup: {
			name: 'reason_1',
			type: 'input',
			label: 'Alasan: ',
			size: 60
		},
		hideWhenMultiple: true
	}
];

Twinkle.speedy.talkList = [
	{
		label: 'U8: Halaman pembicaraan yatim',
		value: 'talk',
		tooltip: 'Ini tidak termasuk halaman yang berguna untuk proyek, khususnya halaman pembicaraan pengguna, arsip pembicaraan pengguna, dan halaman pembicaraan untuk halaman berkas yang ada di Commons.',
		hideWhenRedirect: true
	}
];

Twinkle.speedy.fileList = [
	{
		label: 'B1: Redundan atau duplikat',
		value: 'redundantimage',
		tooltip: 'Berkas atau media tak terpakai yang merupakan sebuah salinan, dengan format yang sama dan resolusi/kualitas yang sama/lebih rendah, dari sebuah berkas atau media lain di Wikipedia. Yang tidak termasuk di dalamnya adalah duplikat berkas atau media di Wikimedia Commons, karena alasan-alasan lisensi;',
	},
	{
		label: 'B2: Rusak atau kosong',
		value: 'noimage',
		tooltip: 'Sebelum menghapus berkas jenis ini, pastikan bahwa mesin MediaWiki tidak dapat membaca berkas tersebut dengan cara pratayang gambar yang diperkecil. Pemuat aslinya dapat memperbaikinya dengan cara memuatkan versi berkas yang tidak rusak.'
	},
	{
		label: 'B2: Halaman deskripsi berkas yang tidak dibutuhkan untuk berkas yang berada di Commons',
		value: 'fpcfail',
		tooltip: 'Gambar yang disimpan di Commons tanpa tag atau informasi pada halaman deskripsi di Wikipedia bahasa Indonesia yang tidak diperlukan lagi.',
		hideWhenMultiple: true
	},
	{
		label: 'B3: Lisensi yang tidak sesuai',
		value: 'noncom',
		tooltip: 'Berkas atau media yang diberi lisensi "untuk tujuan non komersial saja" (termasuk lisensi Creative Commons nonkomersial), "tanpa karya turunan" atau "gunakan dengan izin" dapat dihapus, kecuali berkas tersebut memenuhi standar pemakaian konten tak bebas. Berkas yang berlisensi GFDL sebelum versi 1.3, yang tidak mengizinkan versi setelahnya, dapat dihapus.'
	},
	{
		label: 'B4: Informasi lisensi kurang',
		value: 'unksource',
		tooltip: 'Berkas dan media yang tidak memiliki informasi lisensi yang cukup, dapat dihapus setelah diidentifikasi sebagai berkas tanpa informasi lisensi yang cukup selama tujuh hari jika informasinya tidak ditambahkan. Perhatikan bahwa pemuat berkas terkadang menyebutkan sumbernya di ringkasan pemuatan.',
		hideWhenUser: true
	},
	{
		label: 'B5: Berkas tak bebas yang tak digunakan.',
		value: 'unfree',
		tooltip: 'Berkas dan media yang tidak memiliki lisensi bebas atau domain publik, yang tidak digunakan di artikel manapun, dapat dihapus setelah diidentifikasi sebagai berkas tak bebas yang tak digunakan selama tujuh hari. Perkecualian dapat diberikan kepada berkas yang akan digunakan untuk artikel yang sedang ditulis/dipersiapkan.',
		hideWhenUser: true
	},
	{
		label: 'B6: Tidak memiliki alasan penggunaan tak bebas',
		value: 'norat',
		tooltip: 'Yang termasuk di dalamnya: Berkas dan media tak bebas yang ditulis sebagai "penggunaan wajar" namun tidak menyediakan alasan yang rasional dapat dihapus setelah diidentifikasi sebagai berkas tanpa alasan penggunaan tak bebas selama tujuh hari. Tag {{Fair use}} saja tidak merupakan alasan yang sah. Yang tidak termasuk di dalamnya: alasan telsh diberikan namun diperdebatkan.',
		hideWhenUser: true
	},
	{
		label: 'B7: Klaim penggunaan wajar tidak sah.',
		value: 'badfairuse',  // same as below
		tooltip: 'Berkas atau media tak bebas dengan templat penggunaan wajar yang jelas-jelas tidak sah (seperti tag {{Logo}} pada sebuah foto maskot) dapat dihapus dengan segera.',
		subgroup: {
			name: 'badfairuse_reason',
			type: 'input',
			label: 'Penjelasan (opsional): ',
			size: 60
		}
	},
	/*{
		label: 'F7: Fair-use media from a commercial image agency which is not the subject of sourced commentary',
		value: 'badfairuse',  // same as above
		tooltip: 'Non-free images or media from a commercial source (e.g., Associated Press, Getty), where the file itself is not the subject of sourced commentary, are considered an invalid claim of fair use and fail the strict requirements of WP:NFCC.',
		subgroup: {
			name: 'badfairuse_reason',
			type: 'input',
			label: 'Optional explanation: ',
			size: 60
		},
		hideWhenMultiple: true
	},*/
	{
		label: 'B8: Berkas yang sama persis tersedia di Wikimedia Commons',
		value: 'nowcommons',
		tooltip: 'Syarat: (1) Versi di Commons memiliki format yang sama dan memiliki kualitas/resolusi yang sama atau lebih tinggi. (2) Lisensi dan sumber tidak diragukan lagi, dan lisensi yang digunakan merupakan lisensi Commons yang berterima. (2) Semua informasi pada berkas lokal juga ada di Commons, termasuk sejarah pemuatan yang lengkap dengan pranala ke halaman pengguna pemuat lokal. (3) Jika nama yang digunakan di Commons berbeda dengan di lokal, semua penggunaan berkas di lokal harus disesuaikan (diganti) sesuai dengan nama yang terdapat di Commons.(4) Berkas tidak dilindungi. JANGAN MENGHAPUS BERKAS YANG DILINDUNGI, meskipun ada duplikatnya di Commons. Berkas seperti itu biasanya dimuat di wiki lokal dan dilindungi karena digunakan pada antar muka atau templat yang beresiko tinggi.',
		subgroup: {
			name: 'nowcommons_filename',
			type: 'input',
			label: 'Nama berkas di Commons: ',
			value: Morebits.pageNameNorm,
			tooltip: 'Kosongkan jika berkasnya memiliki nama yang sama. Awalan "File:" opsional.'
		},
		hideWhenMultiple: true
	},
	{
		label: 'B9: Terang-terangan melanggar hak cipta',
		value: 'imgcopyvio',
		tooltip: 'Yang termasuk di dalamnya: berkas atau media yang diklaim sebagai berkas berlisensi bebas padahal sebenarnya bukan. Sebuah URL atau indikasi lokasi sumber harus disediakan. Yang tidak termasuk di dalamnya: berkas dengan klaim penggunaan bebas, atau berkas dengan klaim yang dapat dipercaya dari pemiliknya yang telah melepasnya di bawah lisensi bebas yang kompatibel dengan lisensi Wikipedia. Ini termasuk gambar-gambar dari perpustakaan foto stok seperti Getty Images dan Corbis.',
		subgroup: {
			name: 'imgcopyvio_url',
			type: 'input',
			label: 'URL sumber konten, termasuk "http://". Jika tidak dapat memberikan URL, mohon tidak menggunakan KPC B9. (Pengecualian: copyvio untuk bahan non-Internet, biarkan kosong.) ',
			size: 60
		}
	},
	{
		label: 'B10: Berkas media yang tidak berguna',
		value: 'badfiletype',
		tooltip: 'Berkas yang dimuatkan yang bukan merupakan gambar, audio, atau video (mis. berkas-berkas .doc, .pdf, dan .xls) yang tidak digunakan di artikel apa pun dan tidak bakal digunakan sebagai bahan ensiklopedia.'
	},
	{
		label: 'B11: Tak ada bukti izin penggunaan.',
		value: 'nopermission',
		tooltip: 'Yang termasuk di dalamnya: jika pemuat mencantumkan sebuah lisensi dan menyatakan bahwa pihak ketiga sebagai sumber atau pemegang lisensi tanpa memberikan bukti bahwa pihak ketiga tersebut telah setuju dengan lisensi tersebut, berkas yang dimaksud dapat dihapus tujuh hari setelah pemberitahuan kepada sang pemuat.',
		hideWhenUser: true
	},
	{
		label: 'U8: Halaman deksripsi berkas tanpa adanya berkas',
		value: 'imagepage',
		tooltip: 'Gunakan ini jika berkas benar-benar tidak ada. Berkas rusak, dan halaman deskripsi lokal di Commons, harus menggunakan B2; pengalihan tidak sesuai gunakan R3; dan pengalihan rusak ke Commons gunakan U6.'
	}
];

Twinkle.speedy.articleList = [
	{
		label: 'A1: Artikel tanpa konteks.',
		value: 'nocontext',
		tooltip: 'Yang termasuk di dalamnya: artikel tanpa konteks yang tidak cukup untuk berdiri sendiri ataupun untuk dikembangkan lebih lanjut. Hanya dapat berlaku untuk artikel sangat pendek. Konteks berbeda dengan isi.'
	},
	{
		label: 'A2: Artikel berbahasa asing yang tidak diterjemahkan atau diterjemahkan secara buruk',
		value: 'foreign',
		tooltip: 'Yang termasuk di dalamnya: artikel dari proyek Wikimedia lainnya yang tidak diterjemahkan sama sekali atau yang diterjemahkan secara buruk (dengan atau tanpa bantuan mesin penerjemah). Jika sudah diterjemahkan hingga kriteria sebuah stub, maka bagian yang tidak diterjemahkan sajalah yang harus dipotong. Yang tidak termasuk di dalamnya: artikel yang tidak dari proyek Wikimedia lainnya yang bisa diberi templat {{terjemah}}.',
		subgroup: {
			name: 'foreign_source',
			type: 'input',
			label: 'Pranala interwiki ke artikel di wiki bahasa asing: ',
			tooltip: 'Misalnya, en:Indonesia'
		}
	},
	{
		label: 'A3: Tanpa isi',
		value: 'nocontent',
		tooltip: 'Yang termasuk di dalamnya: artikel (selain halaman disambiguasi, pengalihan, atau pengalihan lunak) yang hanya terdiri dari salah satu hal atau kombinasi dari hal-hal berikut: pranala luar, kategori, templat selain kotak info, gambar, bagian "lihat pula", judul yang di-parafrase-kan, usaha untuk menghubungi orang atau kelompok yang digunakan sebagai judul, atau komentar layaknya orang berdiskusi. Yang tidak termasuk di dalamnya: artikel pendek yang memiliki isi walaupun pendek tidak dapat dihapus menggunakan kriteria ini. Kriteria ini juga tidak berlaku untuk halaman dengan sebuah kotak info dan informasi yang nontrivia.'
	},
	{
		label: 'A5: Artikel transwiki',
		value: 'transwiki',
		tooltip: 'Yang termasuk di dalamnya: Artikel yang telah dipindahkan ke wiki lain dan ada catatan pemindahannya (termasuk informasi tentang pembuat artikel) yang jelas. Artikel yang dipindahkan dapat berupa sebuah definisi kata yang telah dipindahkan ke KamusWiki, sumber bahan yang telah dipindahkan ke WikiSource, atau artikel lainnya yang telah didiskusikan dan disetujui untuk dipindahkan ke wiki lain.'
	},
	{
		label: 'A7: Tidak mengindikasikan kepentingan (tokoh, organisasi, isi situs)',
		value: 'a7',
		tooltip: 'Artikel tentang tokoh, organisasi (termasuk di dalamnya band, klub, perusahaan, dll., kecuali sekolah), atau isi situs yang tidak menunjukkan alasan mengapa subyek itu dianggap penting. Jika yang kontroversial, maka Anda dapat mengusulkan penghapusan dengan templat {{hapus}} atau membawanya ke halaman Wikipedia:Usulan penghapusan',
		//hideWhenSingle: true
	},
	/*{
		label: 'A7: Unremarkable person',
		value: 'person',
		tooltip: 'An article about a real person that does not assert the importance or significance of its subject. If controversial, or if there has been a previous AfD that resulted in the article being kept, the article should be nominated for AfD instead',
		hideWhenMultiple: true
	},
	{
		label: 'A7: Unremarkable musician(s) or band',
		value: 'band',
		tooltip: 'Article about a band, singer, musician, or musical ensemble that does not assert the importance or significance of the subject',
		hideWhenMultiple: true
	},
	{
		label: 'A7: Unremarkable club',
		value: 'club',
		tooltip: 'Article about a club that does not assert the importance or significance of the subject',
		hideWhenMultiple: true
	},
	{
		label: 'A7: Unremarkable company or organization',
		value: 'corp',
		tooltip: 'Article about a company or organization that does not assert the importance or significance of the subject',
		hideWhenMultiple: true
	},
	{
		label: 'A7: Unremarkable website or web content',
		value: 'web',
		tooltip: 'Article about a web site, blog, online forum, webcomic, podcast, or similar web content that does not assert the importance or significance of its subject',
		hideWhenMultiple: true
	},
	{
		label: 'A7: Unremarkable individual animal',
		value: 'animal',
		tooltip: 'Article about an individual animal (e.g. pet) that does not assert the importance or significance of its subject',
		hideWhenMultiple: true
	},
	{
		label: 'A7: Unremarkable organized event',
		value: 'event',
		tooltip: 'Article about an organized event (tour, function, meeting, party, etc.) that does not assert the importance or significance of its subject',
		hideWhenMultiple: true
	},*/
	{
		label: 'A9: Artikel yang tidak mengindikasikan kepentingan (rekaman musik)',
		value: 'a9',
		tooltip: 'Artikel tentang rekaman musik yang tidak menunjukkan alasan mengapa subyek itu dianggap penting dan/atau yang artikel tentang rekaman musik yang artisnya tidak ada di Wikipedia bahasa Indonesia.'
	},
	{
		label: 'A10: Artikel yang tidak dirapikan dalam batas waktu yang telah ditentukan',
		value: 'a10',
		tooltip: 'Artikel yang tidak dirapikan dalam batas waktu yang telah ditentukan, baik oleh pembuat artikel maupun oleh Wikipediawan lain, sehingga dapat dianggap keberadaannya di Wikipedia hanya akan menurunkan kualitas Wikipedia bahasa Indonesia.',
		subgroup: {
			name: 'a10_article',
			type: 'input',
			label: 'Artikel serupa: '
		}
	},
	/*{
		label: 'A11: Obviously made up by creator, and no claim of significance',
		value: 'madeup',
		tooltip: 'An article which plainly indicates that the subject was invented/coined/discovered by the article\'s creator or someone they know personally, and does not credibly indicate why its subject is important or significant'
	}*/
];

Twinkle.speedy.categoryList = [
	{
		label: 'K1: Kategori tanpa isi',
		value: 'catempty',
		tooltip: 'Kategori tanpa isi yang selama paling tidak empat hari masih tidak memiliki isi. Yang tidak termasuk di dalamnya: kategori disambiguasi, pengalihan kategori, kategori topik pilihan, atau kategori yang menurut naturnya dapat menjadi kosong sewaktu-waktu (mis. kategori yang ditransklusikan oleh kotak pengguna.)'
	},
	{
		label: 'K2: Kategori yang namanya telah diganti',
		value: 'k2',
		tooltip: 'Koreksi tipografi; Koreksi kapitalisasi; Perubahan dari bentuk tunggal ke jamak, atau sebaliknya; Ketidaksesuaian dengan pedoman pemerian nama kategori "x di y", "x oleh y", "x dari y" seperti yang tertera di Wikipedia:pedoman pemberian nama kategori.; Pemanjangan nama negara; Koreksi disambiguasi dari nama yang tak unik.'
	},
	{
		label: 'U8: Kategori yang berisi templat yang telah dihapus',
		value: 'templatecat',
		tooltip: 'Situasi ini di mana kategori memang kosong, karena templat yang menempatkan halaman dalam kategori ini sudah dihapus. Ini tidak termasuk kategori yang masih digunakan.'
	}
];

Twinkle.speedy.userList = [
	{
		label: 'H1: Permintaan pengguna',
		value: 'userreq',
		tooltip: 'Yang termasuk di dalamnya: halaman dan subhalaman pengguna (tetapi tidak halaman pembicaraan pengguna) yang diminta untuk dihapus oleh penggunanya. Dalam kasus-kasus yang langka ada kemungkinan halaman tersebut perlu dipertahankan untuk kepentingan administratif.',
		subgroup: ((mw.config.get('wgNamespaceNumber') === 3 && mw.config.get('wgTitle').indexOf('/') === -1) ? {
			name: 'userreq_rationale',
			type: 'input',
			label: 'Alasan penghapusan (wajib): ',
			tooltip: 'Halaman pembicaraan pengguna dihapus hanya dalam keadaan langka tertentu.',
			size: 60
		} : null),
		hideSubgroupWhenMultiple: true
	},
	{
		label: 'H2: Pengguna yang tidak ada',
		value: 'nouser',
		tooltip: 'Yang termasuk di dalamya: halaman pengguna seorang pengguna yang tidak eksis (cek lewat Istimewa:Daftar pengguna), tidak termasuk alamat IP.'
	},
	{
		label: 'H3: Galeri tak bebas',
		value: 'gallery',
		tooltip: 'Galeri di ruangnama pengguna yang terdiri lebih dari separuhnya gambar-gambar tak bebas atau "penggunaan wajar". Kebijakan Wikipedia melarang penggunaan berkas-berkas tak bebas di ruangnama pengguna, walaupun yang memuat adalah pengguna itu sendiri; penggunaan berkas-berkas yang berada di bawah domain umum atau lisensi bebas diperkenankan.'
	},
	// {
	// 	label: 'U5: Blatant WP:NOTWEBHOST violations',
	// 	value: 'notwebhost',
	// 	tooltip: 'Pages in userspace consisting of writings, information, discussions, and/or activities not closely related to Wikipedia\'s goals, where the owner has made few or no edits outside of userspace, with the exception of plausible drafts, pages adhering to WP:UPYES, and résumé-style pages.'
	// },
	{
		label: 'U6: Draf kosong',
		value: 'blankdraft',
		tooltip: 'Draf di ruangnama pengguna berisi hanya teks baku dari Wisaya Artikel, dan penulis halaman telah nonaktif selama lebih dari satu tahun.',
		hideWhenMultiple: true
	},
	{
    label: 'U11: Halaman pengguna yang berisi iklan, dengan menggunakan nama pengguna berkesan iklan',
		value: 'spamuser',
		tooltip: 'Halaman pengguna untuk promosi, dengan nama pengguna untuk tujuan promosi. Perhatikan pula bahwa dengan adanya halaman mengenai perusahaan pada halaman pengguna tidak termasuk dalam kriteria ini. Jika halaman pengguna adalah spam, dan nama penggunanya tidak, tandai dengan U11 saja.',
		hideWhenMultiple: true
	}
];

Twinkle.speedy.templateList = [
	{
		label: 'T2: Templat yang merupakan penyimpangan terang-terangan dari kebijakan yang ada',
		value: 'policy',
		tooltip: 'Templat yang merupakan penyimpangan terang-terangan dari kebijakan yang ada.'
	},
	{
		label: 'T3: Templat yang tidak digunakan selayaknya dan/atau duplikat templat lain',
		value: 'duplicatetemplate',
		tooltip: 'Templat yang tidak digunakan selayaknya, dan yang berupa: duplikat templat lain, atau memiliki fungsi yang sama yang dapat disediakan oleh templat lain dapat dihapuskan setelah diberi tanda penghapusan cepat selama tujuh hari.',
		subgroup: {
			name: 'duplicatetemplate_2',
			type: 'input',
			label: 'Templat yang membuat templat ini redundan: ',
			tooltip: 'Awalan "Templat:" tidak diperlukan.'
		},
		hideWhenMultiple: true
	}
];

Twinkle.speedy.portalList = [
	{
		label: 'P1: Semua topik yang dapat memenuhi kriteria penghapusan cepat artikel',
		value: 'p1',
		tooltip: 'Harus menyebutkan KPC yang berlaku untuk kasus ini (A1, A3, A7, atau A10).',
		subgroup: {
			name: 'p1_1',
			type: 'select',
			label: 'Pilih kriteria yang berlaku: '
		},
		hideWhenMultiple: true
	},
	{
		label: 'P2: Portal yang kurang terisi',
		value: 'emptyportal',
		tooltip: 'Portal yang topiknya hanya memiliki kurang dari tiga artikel nonrintisan dengan topik judul portal yang bersangkutan.'
	}
];

Twinkle.speedy.generalList = [
	{
    label: 'U1: Tulisan ngawur. Yang termasuk di dalamnya: Halaman-halaman yang isinya hanyalah ujaran tak keruan, tanpa makna dan isi.',
    value: 'nonsense',
    tooltip: 'Yang tidak termasuk di dalamnya: penulisan yang buruk, terjemahan buruk, vandalisme, materi fiktif, materi berbahasa selain bahasa Indonesia, dan materi palsu.',
		hideWhenRedirect: true
	},
	{
		label: 'U2: Uji coba',
		value: 'test',
		tooltip: 'Halaman yang dibuat untuk mencoba kode-kode wiki. Yang tidak termasuk di dalamnya: penyuntingan di halaman-halaman bernama "bak pasir" dan ruangnama pengguna.'
	},
	{
		label: 'U3: Vandalisme murni/terang-terangan.',
		value: 'vandalism',
		tooltip: 'Vandalisme murni/terang-terangan (termasuk pengalihan yang ditinggalkan dari vandalisme pemindahan halaman).'
	},
	{
		label: 'U3: Materi palsu terang-terangan',
		value: 'hoax',
		tooltip: 'Materi palsu terang-terangan untuk tujuan vandalisme.',
		hideWhenMultiple: true
	},
	{
		label: 'U4: Pembuatan ulang dari halaman yang sudah dihapus.',
		value: 'repost',
		tooltip: 'Yang termasuk di dalamnya: Salinan dari halaman yang dihapus melalui sebuah diskusi, baik melalui Wikipedia:Usulan penghapusan maupun di halaman pembicaraannya. Yang tidak termasuk di dalamnya: Pemulihan artikel melalui evaluasi penghapusan dan halaman yang dihapus tanpa melalui diskusi.',
		subgroup: {
			name: 'repost_1',
			type: 'input',
			label: 'Halaman yang memuat diskusi penghapusan: ',
			tooltip: 'Harus dimulai dengan awalan "Wikipedia:"',
			size: 60
		},
		hideSubgroupWhenMultiple: true
	},
	{
		label: 'U5: Pengguna yang diblokir atau yang dilarang.',
		value: 'banned',
		tooltip: 'Halaman-halaman yang dibuat oleh pengguna yang sedang diblokir atau dilarang, termasuk yang terbukti membuat akun siluman, yang melanggar ketentuan pemblokiran atau peringatan kepada mereka.',
		subgroup: {
			name: 'banned_1',
			type: 'input',
			label: 'Nama pengguna (jika ada): ',
			tooltip: 'Jangan dimulai dengan "Pengguna:"'
		},
		hideSubgroupWhenMultiple: true
	},
	{
		label: 'U6: Penggabungan riwayat halaman',
		value: 'histmerge',
		tooltip: 'Hapus sementara sebuah halaman untuk menggabungkan sejarah halaman.',
		subgroup: {
			name: 'histmerge_1',
			type: 'input',
			label: 'Halaman akan digabungkan dengan: '
		},
		hideWhenMultiple: true
	},
	{
		label: 'U6: Pemindahan',
		value: 'move',
		tooltip: 'Memberi tempat untuk pemindahan.',
		subgroup: [
			{
				name: 'move_1',
				type: 'input',
				label: 'Halaman yang akan dipindahkan ke sini: '
			},
			{
				name: 'move_2',
				type: 'input',
				label: 'Alasan: ',
				size: 60
			}
		],
		hideWhenMultiple: true
	},
	// {
	// 	label: 'U6: XfD',
	// 	value: 'xfd',
	// 	tooltip: 'An admin has closed a deletion discussion (at AfD, FfD, RfD, TfD, CfD, or MfD) as "delete", but they didn\'t actually delete the page.',
	// 	subgroup: {
	// 		name: 'xfd_fullvotepage',
	// 		type: 'input',
	// 		label: 'Page where the deletion discussion was held: ',
	// 		size: 40
	// 	},
	// 	hideWhenMultiple: true
	// },
	{
		label: 'U6: Halaman disambiguasi yang tak perlu',
		value: 'disambig',
		tooltip: 'Untuk halaman disambiguasi yatim yang: (1) mendisambiguasi kurang dari dua halaman Wikipedia untuk yang judulnya berakhiran "(disambiguasi)"; atau (2) mendisambiguasi tidak ada halaman.',
		hideWhenMultiple: true,
		hideWhenRedirect: true
	},
	{
		label: 'U6: Pemindahan salin-tempel',
		value: 'copypaste',
		tooltip: 'Pemindahan salin-tempel halaman lain yang perlu dihapus sementara untuk membuat tempat agar dapat dipindahkan melalui peralatan Wikipedia.',
		subgroup: {
			name: 'copypaste_1',
			type: 'input',
			label: 'Halaman asal yang disalin-tempel: '
		},
		hideWhenMultiple: true,
		hideWhenRedirect: true
	},
	{
		label: 'U6: Alasan teknis',
		value: 'g6',
		tooltip: 'Alasan teknis lainnya',
		subgroup: {
			name: 'g6_rationale',
			type: 'input',
			label: 'Alasan: ',
			size: 60
		}
	},
	{
		label: 'U7: Permintaan pembuat halaman',
		value: 'author',
		tooltip: 'Permintaan Wikipediawan yang memulai halaman itu, jika halaman tersebut belum disunting secara berarti oleh pengguna lain. Jika pembuat halaman mengosongkan halaman yang dibuatnya, hal ini dapat diartikan bahwa ia menginginkan halaman tersebut dihapus.',
		subgroup: {
			name: 'author_rationale',
			type: 'input',
			label: 'Penjelasan opsional: ',
			tooltip: 'Coba letakkan halaman di mana pengguna meminta penghapusan ini.',
			size: 60
		},
		hideSubgroupWhenSysop: true
	},
	{
		label: 'U8: Halaman yang tergantung pada halaman yang tak ada atau yang dihapus.',
		value: 'g8',
		tooltip: 'Yang termasuk di dalamnya: Pengalihan rusak (termasuk nama pengalihan yang buruk, pengalihan yang berputar), halaman pembicaraan yang artikelnya telah dihapus, subhalaman yang super-halamannya telah dihapus, halaman berkas tanpa suatu berkas, atau kategori yang isinya telah dipindahkan. Yang tidak termasuk di dalamnya: diskusi penghapusan yang tidak terdapat di tempat lain, halaman pengguna dan halaman pembicaraan pengguna, arsip pembicaraan, pengalihan rusak yang masih bisa dialihkan ke halaman lain, dan halaman berkas dan halaman pembicaraan berkas untuk berkas yang terdapat di Commons.',
		subgroup: {
			name: 'g8_rationale',
			type: 'input',
			label: 'Penjelasan opsional: ',
			size: 60
		},
		hideWhenRedirect: true
	},
	{
		label: 'U8: Subhalaman tanpa halaman asal',
		value: 'subpage',
		tooltip: 'Tidak termasuk halaman yang berguna untuk dilindungi.',
		hideWhenMultiple: true
	},
	{
		label: 'U10: Serangan atau olokan terhadap subyek atau entitas lain.',
		value: 'attack',
		tooltip: 'Serangan atau olokan terhadap subyek atau entitas lain.  Yang termasuk di dalamnya: Ancaman, artikel biografi orang hidup yang isinya semuanya bernada negatif dan tidak memiliki sumber (dan di sejarah revisinya tidak ada versi yang netral yang dapat digunakan). Judul artikel dan isi artikel dapat dipakai untuk menentukan apakah artikel tersebut masuk kategori ini atau tidak.'
	},
	{
		label: 'U10: Biografi orang hidup yang semuanya bernada negatif dan tanpa sumber',
		value: 'negublp',
		tooltip: 'Artikel biografi orang hidup yang isinya semuanya bernada negatif dan tidak memiliki sumber (dan di sejarah revisinya tidak ada versi yang netral yang dapat digunakan).',
		hideWhenMultiple: true
	},
	{
		label: 'U11: Iklan atau promosi terang-terangan.',
		value: 'iklan',
		tooltip: 'Yang termasuk di dalamnya: Halaman yang dibuat dengan tujuan utama untuk mempromosikan suatu entitas, dan yang tidak ensiklopedis (yang perlu ditulis ulang agar bersifat ensiklopedis). Yang tidak termasuk di dalamnya: artikel yang memiliki judul suatu nama perusahaan atau produk tidak secara otomatis masuk ke kategori ini.',
		hideWhenRedirect: true
	},
	{
		label: 'U12: Pelanggaran hak cipta terang-terangan',
		value: 'copyvio',
		tooltip: 'Yang termasuk di dalamnya: Halaman dengan teks yang berhak cipta tanpa adanya suatu pemberitahuan yang jelas bahwa teks tersebut diberi lisensi domain publik, penggunaan bebas, atau penggunaan gratis, dan tidak ada bagian dari teks yang tidak melanggar hak cipta yang patut diselamatkan. Kecuali jika ditinjau dari riwayat halamannya tidak ada versi yang bisa digunakan untuk menggantikan versi yang melanggar hak cipta, maka halaman tersebut akan dihapus seluruh isinya.',
		subgroup: [
			{
				name: 'copyvio_url',
				type: 'input',
				label: 'URL (jika ada): ',
				tooltip: 'Jika merupakan sumber daring, berikan di sini, dan tulis protokol "http://" atau "https://". Jika URL dalam "spam blacklist", Anda dapat hapus protokolnya.',
				size: 60
			},
			{
				name: 'copyvio_url2',
				type: 'input',
				label: 'URL tambahan: ',
				tooltip: 'Opsional.',
				size: 60
			},
			{
				name: 'copyvio_url3',
				type: 'input',
				label: 'URL tambahan: ',
				tooltip: 'Opsional.',
				size: 60
			}
		],
		hideWhenRedirect: true
	},
	// {
	// 	label: 'G13: Old, abandoned Articles for Creation submissions',
	// 	value: 'afc',
	// 	tooltip: 'Any rejected or unsubmitted AfC submission that has not been edited for more than 6 months.'
	// }
];

Twinkle.speedy.redirectList = [
	{
		label: 'R2: Pengalihan dari ruangnama artikel ke ruangnama lain, kecuali ruangnama Kategori:, Templat:, Wikipedia:, Bantuan:, dan Portal:',
		value: 'rediruser',
		tooltip: 'Jika pengalihan ditimbulkan karena pemindahan halaman, tunggu satu atau beberapa hari sebelum menghapus pengalihan. Lihat pula Wikipedia:Pengalihan antar-ruangnama.'
	},
	{
		label: 'R3: Pengalihan yang baru dibuat karena kesalahan ketik atau kesalahan penamaan yang tidak disengaja',
		value: 'redirtypo',
		tooltip: 'Meskipun demikian, pengalihan dari kesalahan umum pengejaan atau penamaan biasanya berguna, seperti halnya pengalihan dari istilah dalam bahasa lain.'
	},
	{
		label: 'U6: Pengalihan ke halaman disambiguasi yang salah',
		value: 'movedab',
		tooltip: 'Untuk halaman disambiguasi yang berakhiran "(disambiguasi)" yang topik utamanya tidak ada.',
		hideWhenMultiple: true
	},
	{
		label: 'U8: Pengalihan ke target tidak sah, seperti target yang tidak ada, pengalihan ganda, dan judul yang buruk',
		value: 'redirnone',
		tooltip: 'Ini tidak berlaku untuk halaman berguna ke sebuah proyek, dan khususnya: diskusi penghapusan yang tidak dicatat di tempat lain, halaman pengguna dan pembicaraannya, arsip halaman pembicaraan, pengalihan yang dapat diperbaiki, dan halaman berkas dan pembicaraannya yang ada di Commons.'
	}
];

Twinkle.speedy.normalizeHash = {
	'reason': 'db',
	'nonsense': 'u1',
	'test': 'u2',
	'vandalism': 'u3',
	'hoax': 'u3',
	'repost': 'u4',
	'banned': 'u5',
	'histmerge': 'u6',
	'move': 'u6',
	'xfd': 'u6',
	'disambig': 'u6',
	'movedab': 'u6',
	'copypaste': 'u6',
	'g6': 'u6',
	'u6': 'u6',
	'author': 'u7',
	'g8': 'u8',
	'u8': 'u8',
	'talk': 'u8',
	'subpage': 'u8',
	'redirnone': 'u8',
	'templatecat': 'u8',
	'imagepage': 'u8',
	'attack': 'u10',
	'negublp': 'u10',
	'spam': 'u11',
	'spamuser': 'u11',
	'copyvio': 'u12',
	'afc': 'u13',
	'nocontext': 'a1',
	'foreign': 'a2',
	'nocontent': 'a3',
	'transwiki': 'a5',
	'a7': 'a7',
	'person': 'a7',
	'corp': 'a7',
	'web': 'a7',
	'band': 'a7',
	'club': 'a7',
	'animal': 'a7',
	'event': 'a7',
	'a9': 'a9',
	'a10': 'a10',
	'madeup': 'a11',
	'rediruser': 'r2',
	'redirtypo': 'r3',
	'redundantimage': 'b1',
	'noimage': 'b2',
	'fpcfail': 'b2',
	'noncom': 'b3',
	'unksource': 'b4',
	'unfree': 'b5',
	'norat': 'b6',
	'badfairuse': 'b7',
	'nowcommons': 'b8',
	'imgcopyvio': 'b9',
	'badfiletype': 'b10',
	'nopermission': 'b11',
	'catempty': 'k1',
	'k1': 'k1',
	'k2': 'k2',
	'userreq': 'h1',
	'nouser': 'h2',
	'gallery': 'h3',
	'notwebhost': 'h5',
	'policy': 't2',
	'duplicatetemplate': 't3',
	'p1': 'p1',
	'emptyportal': 'p2',
	'p2': 'p2'
};

Twinkle.speedy.callbacks = {
	getTemplateCodeAndParams: function(params) {
		var code, parameters, i;
		if (params.normalizeds.length > 1) {
			code = "{{db-multiple"; // TODO in id.wikipedia, import this template!
			params.utparams = {};
			$.each(params.normalizeds, function(index, norm) {
				code += "|" + norm.toUpperCase();
				parameters = params.templateParams[index] || [];
				for (var i in parameters) {
					if (typeof parameters[i] === 'string' && !parseInt(i, 10)) {  // skip numeric parameters - {{db-multiple}} doesn't understand them
						code += "|" + i + "=" + parameters[i];
					}
				}
				$.extend(params.utparams, Twinkle.speedy.getUserTalkParameters(norm, parameters));
			});
			code += "}}";
		} else {
			parameters = params.templateParams[0] || [];
			code = "{{hapus|" + params.values[0];
			for (i in parameters) {
				if (typeof parameters[i] === 'string') {
					code += "|" + i + "=" + parameters[i];
				}
			}
			code += "}}";
			params.utparams = Twinkle.speedy.getUserTalkParameters(params.normalizeds[0], parameters);
		}

		return [code, params.utparams];
	},

	parseWikitext: function(wikitext, callback) {
		var query = {
			action: "parse",
			prop: "text",
			pst: "true",
			text: wikitext,
			title: mw.config.get("wgPageName")
		};

		var statusIndicator = new Morebits.status( 'Membuat ringkasan penghapusan' );
		var api = new Morebits.wiki.api( 'Memilah-milah templat hapus', query, function(apiObj) {
				var reason = decodeURIComponent($(apiObj.getXML().querySelector('text').childNodes[0].nodeValue).find('#delete-reason').text()).replace(/\+/g, ' ');
				if (!reason) {
					statusIndicator.warn( 'Tidak dapat membuat ringkasan dari templat penghapusan' );
				} else {
					statusIndicator.info( 'selesai' );
				}
				callback(reason);
			}, statusIndicator);
		api.post();
	},

	sysop: {
		main: function( params ) {
			var reason;

			if (!params.normalizeds.length && params.normalizeds[0] === 'db') {
				reason = prompt("Masukkan alasan penghapusan yang akan digunakan untuk catatan penghapusan:", "");
				Twinkle.speedy.callbacks.sysop.deletePage( reason, params );
			} else {
				var code = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params)[0];
				Twinkle.speedy.callbacks.parseWikitext(code, function(reason) {
					if (params.promptForSummary) {
						reason = prompt("Masukkan alasan penghapusan yang digunakan, atau klik OK untuk menerima yang dibuat secara otomatis.", reason);
					}
					Twinkle.speedy.callbacks.sysop.deletePage( reason, params );
				});
			}
		},
		deletePage: function( reason, params ) {
			var thispage = new Morebits.wiki.page( mw.config.get('wgPageName'), "Menghapus halaman" );

			if (reason === null) {
				return Morebits.status.error("Meminta alasan", "Dibatalkan");
			} else if (!reason || !reason.replace(/^\s*/, "").replace(/\s*$/, "")) {
				return Morebits.status.error("Meminta alasan", "Anda tidak memberikan apa pun. Saya tidak tahu... apa yang terjadi dengan pengurus dan antek apatisnya... Saya menyerah...");
			}
			thispage.setEditSummary( reason + Twinkle.getPref('deletionSummaryAd') );
			thispage.deletePage(function() {
				thispage.getStatusElement().info("selesai");
				Twinkle.speedy.callbacks.sysop.deleteTalk( params );
			});

			// look up initial contributor. If prompting user for deletion reason, just display a link.
			// Otherwise open the talk page directly
			if( params.openUserTalk ) {
				thispage.setCallbackParameters( params );
				thispage.lookupCreator( Twinkle.speedy.callbacks.sysop.openUserTalkPage );
			}
		},
		deleteTalk: function( params ) {
			// delete talk page
			if (params.deleteTalkPage &&
					params.normalized !== 'f8' &&
					document.getElementById( 'ca-talk' ).className !== 'new') {
				var talkpage = new Morebits.wiki.page( Morebits.wikipedia.namespaces[ mw.config.get('wgNamespaceNumber') + 1 ] + ':' + mw.config.get('wgTitle'), "Menghapus halaman pembicaraan" );
				talkpage.setEditSummary('[[WP:KPC#U8|U8]]: Halaman pembicaraan dari halaman yang telah dihapus: "' + Morebits.pageNameNorm + '"' + Twinkle.getPref('deletionSummaryAd'));
				talkpage.deletePage();
				// this is ugly, but because of the architecture of wiki.api, it is needed
				// (otherwise success/failure messages for the previous action would be suppressed)
				window.setTimeout(function() { Twinkle.speedy.callbacks.sysop.deleteRedirects( params ); }, 1800);
			} else {
				Twinkle.speedy.callbacks.sysop.deleteRedirects( params );
			}
		},
		deleteRedirects: function( params ) {
			// delete redirects
			if (params.deleteRedirects) {
				var query = {
					'action': 'query',
					'titles': mw.config.get('wgPageName'),
					'prop': 'redirects',
					'rdlimit': 5000  // 500 is max for normal users, 5000 for bots and sysops
				};
				var wikipedia_api = new Morebits.wiki.api( 'mencari daftar pengalihan...', query, Twinkle.speedy.callbacks.sysop.deleteRedirectsMain,
					new Morebits.status( 'Menghapus halaman pengalihan' ) );
				wikipedia_api.params = params;
				wikipedia_api.post();
			}

			// promote Unlink tool
			var $link, $bigtext;
			if( mw.config.get('wgNamespaceNumber') === 6 && params.normalized !== 'f8' ) {
				$link = $('<a/>', {
					'href': '#',
					'text': 'Klik di sini untuk mengakses alat Unlink',
					'css': { 'fontSize': '100%', 'fontWeight': 'bold' },
					'click': function(){
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback("Menghapus pranala balik ke halaman yang dihapus " + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span/>', {
					'text': 'Untuk pranala balik yang yatim dan menghapus halaman yang terkait dengan penggunaan berkas',
					'css': { 'fontSize': '100%', 'fontWeight': 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			} else if (params.normalized !== 'f8') {
				$link = $('<a/>', {
					'href': '#',
					'text': 'Klik di sini untuk mengakses alat Unlink',
					'css': { 'fontSize': '100%', 'fontWeight': 'bold' },
					'click': function(){
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback("Menghapus pranala balik ke halaman yang dihapus " + Morebits.pageNameNorm);
					}
				});
				$bigtext = $('<span/>', {
					'text': 'Tuju ke pranala balik yang yatim',
					'css': { 'fontSize': '100%', 'fontWeight': 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			}
		},
		openUserTalkPage: function( pageobj ) {
			pageobj.getStatusElement().unlink();  // don't need it anymore
			var user = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			var query = {
				'title': 'User talk:' + user,
				'action': 'edit',
				'preview': 'yes',
				'vanarticle': Morebits.pageNameNorm
			};

			if (params.normalized === 'db' || Twinkle.getPref("promptForSpeedyDeletionSummary").indexOf(params.normalized) !== -1) {
				// provide a link to the user talk page
				var $link, $bigtext;
				$link = $('<a/>', {
					'href': mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ),
					'text': 'Klik di sini untuk membuka Pembicaraan Pengguna: ' + user,
					'target': '_blank',
					'css': { 'fontSize': '100%', 'fontWeight': 'bold' }
				});
				$bigtext = $('<span/>', {
					'text': 'Beritahu pembuat halaman',
					'css': { 'fontSize': '100%', 'fontWeight': 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			} else {
				// open the initial contributor's talk page
				var statusIndicator = new Morebits.status('Membuka kotak penyuntingan halaman pembicaraan pengguna untuk ' + user, 'sedang membuka...');

				switch( Twinkle.getPref('userTalkPageMode') ) {
				case 'tab':
					window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), '_blank' );
					break;
				case 'blank':
					window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ), '_blank', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
					break;
				case 'window':
					/* falls through */
				default:
					window.open( mw.util.wikiScript('index') + '?' + Morebits.queryString.create( query ),
						( window.name === 'twinklewarnwindow' ? '_blank' : 'twinklewarnwindow' ),
						'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800' );
					break;
				}

				statusIndicator.info( 'selesai' );
			}
		},
		deleteRedirectsMain: function( apiobj ) {
			var xmlDoc = apiobj.getXML();
			var $snapshot = $(xmlDoc).find('redirects rd');
			var total = $snapshot.length;
			var statusIndicator = apiobj.statelem;

			if( !total ) {
				statusIndicator.status("tidak ada pengalihan yang ditemukan");
				return;
			}

			statusIndicator.status("0%");

			var current = 0;
			var onsuccess = function( apiobjInner ) {
				var now = parseInt( 100 * (++current)/total, 10 ) + '%';
				statusIndicator.update( now );
				apiobjInner.statelem.unlink();
				if( current >= total ) {
					statusIndicator.info( now + ' (selesai)' );
					Morebits.wiki.removeCheckpoint();
				}
			};

			Morebits.wiki.addCheckpoint();

			$snapshot.each(function(key, value) {
				var title = $(value).attr('title');
				var page = new Morebits.wiki.page(title, 'Menghapus pengalihan "' + title + '"');
				page.setEditSummary('[[WP:KPC#U8|U8]]: Pengalihan ke halaman yang telah dihapus "' + Morebits.pageNameNorm + '"' + Twinkle.getPref('deletionSummaryAd'));
				page.deletePage(onsuccess);
			});
		}
	},

	user: {
		main: function(pageobj) {
			var statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error( "Sepertinya halaman ini tidak ada; mungkin telah dihapus" );
				return;
			}

			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			statelem.status( 'Memeriksa tag di halaman...' );

			// check for existing deletion tags
			var tag = /(?:\{\{\s*(db|delete|hapus|hapus:|penghapusan|db-.*?|speedy deletion-.*?)(?:\s*\||\s*\}\}))/.exec( text );
			if( tag ) {
				statelem.error( [ Morebits.htmlNode( 'strong', tag[1] ) , " telah ada di halaman ini." ] );
				return;
			}

			var xfd = /(?:\{\{([rsaiftcm]fd|md1|proposed deletion)[^{}]*?\}\})/i.exec( text );
			if( xfd && !confirm( "Templat yang berhubungan dengan penghapusan {{" + xfd[1] + "}} ditemukan di halaman. Apakah Anda masih ingin menambahkan templat KPC?" ) ) {
				return;
			}

			// given the params, builds the template and also adds the user talk page parameters to the params that were passed in
			// returns => [<string> wikitext, <object> utparams]
			var buildData = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params),
				code = buildData[0];
			params.utparams = buildData[1];

			var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
			// patrol the page, if reached from Special:NewPages
			if( Twinkle.getPref('markSpeedyPagesAsPatrolled') ) {
				thispage.patrol();
			}

			// Wrap SD template in noinclude tags if we are in template space.
			// Won't work with userboxes in userspace, or any other transcluded page outside template space
			if (mw.config.get('wgNamespaceNumber') === 10) {  // Template:
				code = "<noinclude>" + code + "</noinclude>";
			}

			// Remove tags that become superfluous with this action
			text = text.replace(/\{\{\s*([Nn]ew unreviewed article|[Uu]nreviewed|[Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, "");
			if (mw.config.get('wgNamespaceNumber') === 6) {
				// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
				text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, "");
			}

			// Generate edit summary for edit
			var editsummary;
			if (params.normalizeds.length > 1) {
				editsummary = 'Meminta penghapusan cepat (';
				$.each(params.normalizeds, function(index, norm) {
					editsummary += '[[WP:KPC#' + norm.toUpperCase() + '|KPC ' + norm.toUpperCase() + ']], ';
				});
				editsummary = editsummary.substr(0, editsummary.length - 2); // remove trailing comma
				editsummary += ').';
			} else if (params.normalizeds[0] === "db") {
				editsummary = 'Meminta [[WP:KPC|penghapusan cepat]] dengan alasan \"' + parameters["1"] + '\".';
			} else if (params.values[0] === "histmerge") {
				editsummary = "Meminta penggabungan riwayat dengan [[" + parameters["1"] + "]] ([[WP:KPC#U6|KPC U6]]).";
			} else {
				editsummary = "Meminta penghapusan cepat ([[WP:KPC#" + params.normalizeds[0].toUpperCase() + "|KPC " + params.normalizeds[0].toUpperCase() + "]]).";
			}

			pageobj.setPageText(code + ((params.normalizeds.indexOf('g10') !== -1) ? '' : ("\n" + text) )); // cause attack pages to be blanked
			pageobj.setEditSummary(editsummary + Twinkle.getPref('summaryAd'));
			pageobj.setWatchlist(params.watch);
			pageobj.setCreateOption('nocreate');
			pageobj.save(Twinkle.speedy.callbacks.user.tagComplete);
		},

		tagComplete: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			// Notification to first contributor
			if (params.usertalk) {
				var callback = function(pageobj) {
					var initialContrib = pageobj.getCreator();

					// disallow warning yourself
					if (initialContrib === mw.config.get('wgUserName')) {
						Morebits.status.warn("Anda (" + initialContrib + ") membuat halaman ini; lewati pemberitahuan");

					// don't notify users when their user talk page is nominated
					} else if (initialContrib === mw.config.get('wgTitle') && mw.config.get('wgNamespaceNumber') === 3) {
						Morebits.status.warn("Memberitahu penyunting awal: pengguna ini membuat halaman pembicaraannya sendiri; lewati pemberitahuan");

					// quick hack to prevent excessive unwanted notifications, per request. Should actually be configurable on recipient page...
					} else if ((initialContrib === "Cyberbot I" || initialContrib === "SoxBot") && params.normalizeds[0] === "f2") {
						Morebits.status.warn("Memberitahu kontributor awal: halaman dibuat oleh bot; lewati pemberitahuan");

					} else {
						var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, "Memberitahu penyunting awal (" + initialContrib + ")"),
							notifytext, i;

						// specialcase "db" and "db-multiple"
						if (params.normalizeds.length > 1) {
							notifytext = "\n{{subst:db-notice-multiple|1=" + Morebits.pageNameNorm;
							var count = 2;
							$.each(params.normalizeds, function(index, norm) {
								notifytext += "|" + (count++) + "=" + norm.toUpperCase();
							});
						} else if (params.normalizeds[0] === "db") {
							notifytext = "\n{{subst:db-reason-notice|1=" + Morebits.pageNameNorm;
						} else {
							notifytext = "\n{{subst:db-csd-notice-custom|1=" + Morebits.pageNameNorm + "|2=" + params.values[0];
						}

						for (i in params.utparams) {
							if (typeof params.utparams[i] === 'string') {
								notifytext += "|" + i + "=" + params.utparams[i];
							}
						}
						notifytext += (params.welcomeuser ? "" : "|nowelcome=yes") + "}} ~~~~";

						var editsummary = "Pemberitahuan: nominasi penghapusan cepat";
						if (params.normalizeds.indexOf("g10") === -1) {  // no article name in summary for G10 deletions
							editsummary += " untuk [[" + Morebits.pageNameNorm + "]].";
						} else {
							editsummary += " dari halaman serangan.";
						}

						usertalkpage.setAppendText(notifytext);
						usertalkpage.setEditSummary(editsummary + Twinkle.getPref('summaryAd'));
						usertalkpage.setCreateOption('recreate');
						usertalkpage.setFollowRedirect(true);
						usertalkpage.append();
					}

					// add this nomination to the user's userspace log, if the user has enabled it
					if (params.lognomination) {
						Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
					}
				};
				var thispage = new Morebits.wiki.page(Morebits.pageNameNorm);
				thispage.lookupCreator(callback);
			}
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			else if (params.lognomination) {
				Twinkle.speedy.callbacks.user.addToLog(params, null);
			}
		},

		// note: this code is also invoked from twinkleimage
		// the params used are:
		//   for CSD: params.values, params.normalizeds  (note: normalizeds is an array)
		//   for DI: params.fromDI = true, params.templatename, params.normalized  (note: normalized is a string)
		addToLog: function(params, initialContrib) {
			var wikipedia_page = new Morebits.wiki.page("User:" + mw.config.get('wgUserName') + "/" + Twinkle.getPref('speedyLogPageName'), "Menambahkan entri ke log ruangnama pengguna");
			params.logInitialContrib = initialContrib;
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.speedy.callbacks.user.saveLog);
		},

		saveLog: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			var appendText = "";

			// add blurb if log page doesn't exist
			if (!pageobj.exists()) {
				appendText +=
					"Ini adalah log semua nominasi [[WP:KPC|penghapusan cepat]] yang dibuat oleh pengguna ini dengan menggunakan modul KPC [[WP:TW|Twinkle]].\n\n" +
                    "Jika Anda tidak ingin menyimpan log ini, Anda dapat mematikannya di  [[Wikipedia:Twinkle/Preferences|panel preferensi]], dan " +
                    "menominasikan halaman ini untuk dihapus di bawah [[WP:KPC#H1|KPC U1]].\n";
				if (Morebits.userIsInGroup("sysop")) {
					appendText += "\n\nLog ini tidak mencatat penghapusan cepat yang dibuat menggunakan Twinkle.";
				}
			}

			// create monthly header
			var date = new Date();
			var headerRe = new RegExp("^==+\\s*" + date.getUTCMonthName() + "\\s+" + date.getUTCFullYear() + "\\s*==+", "m");
			if (!headerRe.exec(text)) {
				appendText += "\n\n=== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ===";
			}

			appendText += "\n# [[:" + Morebits.pageNameNorm + "]]: ";
			if (params.fromDI) {
				appendText += "DI [[WP:KPC#" + params.normalized.toUpperCase() + "|KPC " + params.normalized.toUpperCase() + "]]";// ({{tl|di-" + params.templatename + "}})";
			} else {
				if (params.normalizeds.length > 1) {
					appendText += "berbagai kriteria (";
					$.each(params.normalizeds, function(index, norm) {
						appendText += "[[WP:KPC#" + norm.toUpperCase() + "|" + norm.toUpperCase() + ']], ';
					});
					appendText = appendText.substr(0, appendText.length - 2);  // remove trailing comma
					appendText += ')';
				} else if (params.normalizeds[0] === "db") {
					appendText += "{{tl|db-reason}}";
				} else {
					appendText += "[[WP:KPC#" + params.normalizeds[0].toUpperCase() + "|KPC " + params.normalizeds[0].toUpperCase() + "]] ({{tl|db-" + params.values[0] + "}})";
				}
			}

			if (params.logInitialContrib) {
				appendText += "; memberitahukan {{user|1=" + params.logInitialContrib + "}}";
			}
			appendText += " ~~~~~\n";

			pageobj.setAppendText(appendText);
			pageobj.setEditSummary("Mencatat nominasi penghapusan cepat [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			pageobj.setCreateOption("recreate");
			pageobj.append();
		}
	}
};

// validate subgroups in the form passed into the speedy deletion tag
Twinkle.speedy.getParameters = function twinklespeedyGetParameters(form, values) {
	var parameters = [];

	$.each(values, function(index, value) {
		var currentParams = [];
		switch (value) {
			case 'reason':
				if (form["csd.reason_1"]) {
					var dbrationale = form["csd.reason_1"].value;
					if (!dbrationale || !dbrationale.trim()) {
						alert( 'Alasan lainnya: Mohon tulis alasan!' );
						parameters = null;
						return false;
					}
					currentParams["1"] = dbrationale;
				}
				break;

			case 'userreq':  // U1
				if (form["csd.userreq_rationale"]) {
					var u1rationale = form["csd.userreq_rationale"].value;
					if (mw.config.get('wgNamespaceNumber') === 3 && !((/\//).test(mw.config.get('wgTitle'))) &&
							(!u1rationale || !u1rationale.trim())) {
						alert( 'KPC H1: Mohon tuliskan alasan ketika mengusulkan penghapusan halaman pembiaraan pengguna.' );
						parameters = null;
						return false;
					}
					currentParams.rationale = u1rationale;
				}
				break;

			case 'repost':  // G4
				if (form["csd.repost_1"]) {
					var deldisc = form["csd.repost_1"].value;
					if (deldisc) {
						if (deldisc.substring(0, 9) !== "Wikipedia" && deldisc.substring(0, 3) !== "WP:") {
							alert( 'KPC U4: Penghapusan halaman diskusi, jika ada, harus dimulai dengan "Wikipedia:".' );
							parameters = null;
							return false;
						}
						currentParams["1"] = deldisc;
					}
				}
				break;

			case 'banned':  // G5
				if (form["csd.banned_1"] && form["csd.banned_1"].value) {
					currentParams["1"] = form["csd.banned_1"].value.replace(/^\s*User:/i, "");
				}
				break;

			case 'histmerge':  // G6
				if (form["csd.histmerge_1"]) {
					var merger = form["csd.histmerge_1"].value;
					if (!merger || !merger.trim()) {
						alert( 'KPC U6 (histmerge): Mohon tuliskan nama halaman yang akan digabung.' );
						parameters = null;
						return false;
					}
					currentParams["1"] = merger;
				}
				break;

			case 'move':  // G6
				if (form["csd.move_1"] && form["csd.move_2"]) {
					var movepage = form["csd.move_1"].value,
						movereason = form["csd.move_2"].value;
					if (!movepage || !movepage.trim()) {
						alert( 'KPC U6 (move): Mohon tuliskan nama halaman yang akan dipindahkan ke sini.' );
						parameters = null;
						return false;
					}
					if (!movereason || !movereason.trim()) {
						alert( 'KPC U6 (move): Mohon tuliskan alasan pemindahan.' );
						parameters = null;
						return false;
					}
					currentParams["1"] = movepage;
					currentParams["2"] = movereason;
				}
				break;

			// case 'xfd':  // G6
			// 	if (form["csd.xfd_fullvotepage"]) {
			// 		var xfd = form["csd.xfd_fullvotepage"].value;
			// 		if (xfd) {
			// 			if (xfd.substring(0, 9) !== "Wikipedia" && xfd.substring(0, 3) !== "WP:") {
			// 				alert( 'CSD G6 (XFD):  The deletion discussion page name, if provided, must start with "Wikipedia:".' );
			// 				parameters = null;
			// 				return false;
			// 			}
			// 			currentParams.fullvotepage = xfd;
			// 		}
			// 	}
			// 	break;

			case 'copypaste':  // G6
				if (form["csd.copypaste_1"]) {
					var copypaste = form["csd.copypaste_1"].value;
					if (!copypaste || !copypaste.trim()) {
						alert( 'KPC U6 (salin-tempel): Mohon tuliskan halaman sumber.' );
						parameters = null;
						return false;
					}
					currentParams["1"] = copypaste;
				}
				break;

			case 'g6':  // G6
				if (form["csd.g6_rationale"] && form["csd.g6_rationale"].value) {
					currentParams.rationale = form["csd.g6_rationale"].value;
				}
				break;

			case 'author':  // G7
				if (form["csd.author_rationale"] && form["csd.author_rationale"].value) {
					currentParams.rationale = form["csd.author_rationale"].value;
				}
				break;

			case 'g8':  // G8
				if (form["csd.g8_rationale"] && form["csd.g8_rationale"].value) {
					currentParams.rationale = form["csd.g8_rationale"].value;
				}
				break;

			case 'attack':  // G10
				currentParams.blanked = 'yes';
				// it is actually blanked elsewhere in code, but setting the flag here
				break;

			case 'copyvio':  // G12
				if (form["csd.copyvio_url"] && form["csd.copyvio_url"].value) {
					currentParams.url = form["csd.copyvio_url"].value;
				}
				if (form["csd.copyvio_url2"] && form["csd.copyvio_url2"].value) {
					currentParams.url2 = form["csd.copyvio_url2"].value;
				}
				if (form["csd.copyvio_url3"] && form["csd.copyvio_url3"].value) {
					currentParams.url3 = form["csd.copyvio_url3"].value;
				}
				break;

			case 'afc':  // G13
				var query = {
							action: "query",
							titles: mw.config.get("wgPageName"),
							prop: "revisions",
							rvprop: "timestamp"
						},
						api = new Morebits.wiki.api( 'Mengambil waktu revisi terakhir', query, function( apiobj ) {
							var xmlDoc = apiobj.getXML(),
									isoDateString = $(xmlDoc).find("rev").attr("timestamp");

							currentParams.ts = isoDateString;
						});

				// Wait for API call to finish
				api.post({
					async: false
				});

				break;

			case 'redundantimage':  // F1
				if (form["csd.redundantimage_filename"]) {
					var redimage = form["csd.redundantimage_filename"].value;
					if (!redimage || !redimage.trim()) {
						alert( 'KPC B1: Mohon tuliskan nama berkas yang lain.' );
						parameters = null;
						return false;
					}
					currentParams.filename = redimage.replace(/^\s*(Image|File):/i, "");
				}
				break;

			case 'badfairuse':  // F7
				if (form["csd.badfairuse_reason"] && form["csd.badfairuse_reason"].value) {
					currentParams.reason = form["csd.badfairuse_reason"].value;
				}
				break;

			case 'nowcommons':  // F8
				if (form["csd.nowcommons_filename"]) {
					var filename = form["csd.nowcommons_filename"].value;
					if (filename && filename !== Morebits.pageNameNorm) {
						if (filename.indexOf("Image:") === 0 || filename.indexOf("File:") === 0) {
							currentParams["1"] = filename;
						} else {
							currentParams["1"] = "File:" + filename;
						}
					}
				}
				currentParams.date = "~~~~~";
				break;

			case 'imgcopyvio':  // F9
				if (form["csd.imgcopyvio_url"] && form["csd.imgcopyvio_url"].value) {
					currentParams.url = form["csd.imgcopyvio_url"].value;
				}
				break;

			case 'foreign':  // A2
				if (form["csd.foreign_source"]) {
					var foreignlink = form["csd.foreign_source"].value;
					if (!foreignlink || !foreignlink.trim()) {
						alert( 'KPC A2: Mohon tuliskan pranala antarwiki ke artikel yang memuat artikel ini sebagai salinan.' );
						parameters = null;
						return false;
					}
					currentParams.source = foreignlink;
				}
				break;

			case 'a10':  // A10
				if (form["csd.a10_article"]) {
					var duptitle = form["csd.a10_article"].value;
					if (!duptitle || !duptitle.trim()) {
						alert( 'KPC A10: Mohon tuliskan nama artikel duplikat.' );
						parameters = null;
						return false;
					}
					currentParams.article = duptitle;
				}
				break;

			case 'duplicatetemplate':  // T3
				if (form["csd.duplicatetemplate_2"]) {
					var t3template = form["csd.duplicatetemplate_2"].value;
					if (!t3template || !t3template.trim()) {
						alert( 'KPC T3: Mohon tuliskan nama templat duplikat.' );
						parameters = null;
						return false;
					}
					currentParams["1"] = "~~~~~";
					currentParams["2"] = t3template.replace(/^\s*Template:/i, "");
				}
				break;

			case 'p1':  // P1
				if (form["csd.p1_criterion"]) {
					var criterion = form["csd.p1_criterion"].value;
					if (!criterion || !criterion.trim()) {
						alert( 'KPC P1: Mohon tuliskan kriteria KPC yang sesuai; atau alasan lainnya.' );
						parameters = null;
						return false;
					}
					currentParams["1"] = criterion;
				}
				break;

			default:
				break;
		}
		parameters.push(currentParams);
	});
	return parameters;
};

// function for processing talk page notification template parameters
Twinkle.speedy.getUserTalkParameters = function twinklespeedyGetUserTalkParameters(normalized, parameters) {
	var utparams = [];
	switch (normalized) {
		case 'db':
			utparams["2"] = parameters["1"];
			break;
		case 'g12':
			utparams.key1 = "url";
			utparams.value1 = utparams.url = parameters.url;
			break;
		case 'a10':
			utparams.key1 = "article";
			utparams.value1 = utparams.article = parameters.article;
			break;
		default:
			break;
	}
	return utparams;
};


Twinkle.speedy.resolveCsdValues = function twinklespeedyResolveCsdValues(e) {
	var values = (e.target.form ? e.target.form : e.target).getChecked('csd');
	if (values.length === 0) {
		alert( "Mohon tuliskan kriteria yang sesuai!" );
		return null;
	}
	return values;
};

Twinkle.speedy.callback.evaluateSysop = function twinklespeedyCallbackEvaluateSysop(e) {
	var form = (e.target.form ? e.target.form : e.target);

	if (e.target.type === "checkbox" || e.target.type === "text" ||
			e.target.type === "select") {
		return;
	}

	var tag_only = form.tag_only;
	if( tag_only && tag_only.checked ) {
		Twinkle.speedy.callback.evaluateUser(e);
		return;
	}

	var values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}

	var normalizeds = values.map(function(value) {
		return Twinkle.speedy.normalizeHash[ value ];
	});

	// analyse each criterion to determine whether to watch the page, prompt for summary, or open user talk page
	var watchPage, promptForSummary;
	normalizeds.forEach(function(norm) {
		if (Twinkle.getPref("watchSpeedyPages").indexOf(norm) !== -1) {
			watchPage = true;
		}
		if (Twinkle.getPref("promptForSpeedyDeletionSummary").indexOf(norm) !== -1) {
			promptForSummary = true;
		}
	});

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		deleteTalkPage: form.talkpage && form.talkpage.checked,
		deleteRedirects: form.redirects.checked,
		openUserTalk: form.openusertalk.checked,
		promptForSummary: promptForSummary,
		templateParams: Twinkle.speedy.getParameters( form, values )
	};
	if(!params.templateParams) {
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( form );

	Twinkle.speedy.callbacks.sysop.main( params );
};

Twinkle.speedy.callback.evaluateUser = function twinklespeedyCallbackEvaluateUser(e) {
	var form = (e.target.form ? e.target.form : e.target);

	if (e.target.type === "checkbox" || e.target.type === "text" ||
			e.target.type === "select") {
		return;
	}

	var values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	//var multiple = form.multiple.checked;
	var normalizeds = [];
	$.each(values, function(index, value) {
		var norm = Twinkle.speedy.normalizeHash[ value ];

		normalizeds.push(norm);
	});

	// analyse each criterion to determine whether to watch the page/notify the creator
	var watchPage = false;
	$.each(normalizeds, function(index, norm) {
		if (Twinkle.getPref('watchSpeedyPages').indexOf(norm) !== -1) {
			watchPage = true;
			return false;  // break
		}
	});

	var notifyuser = false;
	if (form.notify.checked) {
		$.each(normalizeds, function(index, norm) {
			if (Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').indexOf(norm) !== -1) {
				if (norm === 'g6' && ['disambig', 'copypaste'].indexOf(values[index]) === -1) {
					return true;
				}
				notifyuser = true;
				return false;  // break
			}
		});
	}

	var welcomeuser = false;
	if (notifyuser) {
		$.each(normalizeds, function(index, norm) {
			if (Twinkle.getPref('welcomeUserOnSpeedyDeletionNotification').indexOf(norm) !== -1) {
				welcomeuser = true;
				return false;  // break
			}
		});
	}

	var csdlog = false;
	if (Twinkle.getPref('logSpeedyNominations')) {
		$.each(normalizeds, function(index, norm) {
			if (Twinkle.getPref('noLogOnSpeedyNomination').indexOf(norm) === -1) {
				csdlog = true;
				return false;  // break
			}
		});
	}

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		usertalk: notifyuser,
		welcomeuser: welcomeuser,
		lognomination: csdlog,
		templateParams: Twinkle.speedy.getParameters( form, values )
	};
	if (!params.templateParams) {
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( form );

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = "Penandaan selesai";

	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Menandai halaman");
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.speedy.callbacks.user.main);
};
})(jQuery);


//</nowiki>
