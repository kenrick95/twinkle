//<nowiki>


(function($){

var api = new mw.Api(), relevantUserName;

/*
	****************************************
	*** twinkleblock.js: Block module
	****************************************
	* Mode of invocation:     Tab ("Block")
	* Active on:              any page with relevant user name (userspace, contribs, etc.)
	* Config directives in:   [soon to be TwinkleConfig]
	*/

Twinkle.block = function twinkleblock() {
	// should show on Contributions pages, anywhere there's a relevant user
	if ( Morebits.userIsInGroup('sysop') && mw.config.get('wgRelevantUserName') ) {
		Twinkle.addPortletLink(Twinkle.block.callback, 'Blokir', 'tw-block', 'Blokir pengguna' );
	}
};

Twinkle.block.callback = function twinkleblockCallback() {
	if( mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName') &&
			!confirm( 'Anda akan memblokir diri sendiri. Apakah Anda yakin ingin melanjutkan?' ) ) {
		return;
	}

	var Window = new Morebits.simpleWindow( 650, 530 );
	// need to be verbose about who we're blocking
	Window.setTitle( 'Blokir atau berikan templat blokir kepada ' + mw.config.get('wgRelevantUserName') );
	Window.setScriptName( 'Twinkle' );
	Window.addFooterLink( 'Templat pemblokiran', 'Template:Uw-block/doc/Block_templates' );
	Window.addFooterLink( 'Kebijakan pemblokiran', 'WP:BLOK' );
	Window.addFooterLink( 'Bantuan Twinkle', 'WP:TW/DOC#block' );

	Twinkle.block.currentBlockInfo = undefined;
	Twinkle.block.field_block_options = {};
	Twinkle.block.field_template_options = {};

	var form = new Morebits.quickForm( Twinkle.block.callback.evaluate );
	var actionfield = form.append( {
			type: 'field',
			label: 'Type of action'
		} );
	actionfield.append({
			type: 'checkbox',
			name: 'actiontype',
			event: Twinkle.block.callback.change_action,
			list: [
				{
					label: 'Blokir pengguna',
					value: 'block',
					tooltip: 'Blokir pengguna dengan opsi yang diberikan.',
					checked: true
				},
				{
					label: 'Tempatkan templat blokir ke halaman pembicaraan pengguna',
					value: 'template',
					tooltip: 'Jika pengurus yang memblokir lupa memberikan templat blokir, atau telah memblokirnya tanpa memberikan templat, Anda dapat menggunakan ini untuk memberikan templat blokir yang sesuai.',
					checked: true
				}
			]
		});

	form.append({ type: 'field', label: 'Opsi', name: 'field_preset' });
	form.append({ type: 'field', label: 'Opsi templat', name: 'field_template_options' });
	form.append({ type: 'field', label: 'Opsi pemblokiran', name: 'field_block_options' });

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
	result.root = result;

	Twinkle.block.fetchUserInfo(function() {
		// clean up preset data (defaults, etc.), done exactly once, must be before Twinkle.block.callback.change_action is called
		Twinkle.block.transformBlockPresets();

		// init the controls after user and block info have been fetched
		var evt = document.createEvent( 'Event' );
		evt.initEvent( 'change', true, true );
		result.actiontype[0].dispatchEvent( evt );
	});
};

Twinkle.block.fetchUserInfo = function twinkleblockFetchUserInfo(fn) {

	api.get({
		format: 'json',
		action: 'query',
		list: 'blocks|users|logevents',
		letype: 'block',
		lelimit: 1,
		bkusers: mw.config.get('wgRelevantUserName'),
		ususers: mw.config.get('wgRelevantUserName'),
		letitle: 'User:' + mw.config.get('wgRelevantUserName')
	})
	.then(function(data){
		var blockinfo = data.query.blocks[0],
			userinfo = data.query.users[0];

		Twinkle.block.isRegistered = !!userinfo.userid;
		relevantUserName = Twinkle.block.isRegistered ? 'User:' + mw.config.get('wgRelevantUserName') : mw.config.get('wgRelevantUserName');

		if (blockinfo) {
			// handle frustrating system of inverted boolean values
			blockinfo.disabletalk = blockinfo.allowusertalk === undefined;
			blockinfo.hardblock = blockinfo.anononly === undefined;
			Twinkle.block.currentBlockInfo = blockinfo;
		}

		Twinkle.block.hasBlockLog = !!data.query.logevents.length;

		if (typeof fn === 'function') return fn();
	}, function(msg) {
		Morebits.status.init($('div[name="currentblock"] span').last()[0]);
		Morebits.status.warn('Galat ketika mencari informasi pengguna', msg);
	});
};

Twinkle.block.callback.saveFieldset = function twinkleblockCallbacksaveFieldset(fieldset) {
	Twinkle.block[$(fieldset).prop('name')] = {};
	$(fieldset).serializeArray().forEach(function(el) {
		Twinkle.block[$(fieldset).prop('name')][el.name] = el.value;
	});
};

Twinkle.block.callback.change_action = function twinkleblockCallbackChangeAction(e) {
	var field_preset, field_template_options, field_block_options, $form = $(e.target.form);

	Twinkle.block.callback.saveFieldset($('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($('[name=field_template_options]'));

	if ($form.find('[name=actiontype][value=block]').is(':checked')) {
		field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Opsi', name: 'field_preset' });
		field_preset.append({
				type: 'select',
				name: 'preset',
				label: 'Pilih salah satu opsi:',
				event: Twinkle.block.callback.change_preset,
				list: Twinkle.block.callback.filtered_block_groups()
			});

		field_block_options = new Morebits.quickForm.element({ type: 'field', label: 'Opsi pemblokiran', name: 'field_block_options' });
		field_block_options.append({ type: 'div', name: 'hasblocklog', label: ' ' });
		field_block_options.append({ type: 'div', name: 'currentblock', label: ' ' });
		field_block_options.append({
				type: 'select',
				name: 'expiry_preset',
				label: 'Kedaluwarsa:',
				event: Twinkle.block.callback.change_expiry,
				list: [
					{ label: 'lain-lain', value: 'custom', selected: true },
					{ label: 'selamanya', value: 'infinity' },
					{ label: '3 jam', value: '3 hours' },
					{ label: '12 jam', value: '12 hours' },
					{ label: '24 jam', value: '24 hours' },
					{ label: '31 jam', value: '31 hours' },
					{ label: '36 jam', value: '36 hours' },
					{ label: '48 jam', value: '48 hours' },
					{ label: '60 jam', value: '60 hours' },
					{ label: '72 jam', value: '72 hours' },
					{ label: '1 minggu', value: '1 week' },
					{ label: '2 minggu', value: '2 weeks' },
					{ label: '1 bulan', value: '1 month' },
					{ label: '3 bulan', value: '3 months' },
					{ label: '6 bulan', value: '6 months' },
					{ label: '1 tahun', value: '1 year' },
					{ label: '2 tahun', value: '2 years' },
					{ label: '3 tahun', value: '3 years' }
				]
			});
			field_block_options.append({
					type: 'input',
					name: 'expiry',
					label: 'Waktu kedaluwarsa lain',
					tooltip: 'Anda bisa menggunakan waktu relatif, seperti "1 menit" atau "19 hari", atau dengan stempel waktu "yyyymmddhhmm", seperti 201601010300 untuk 1 Januari 2016 pukul 3.00 GMT.',
					value: Twinkle.block.field_block_options.expiry || Twinkle.block.field_template_options.template_expiry
				});
		var blockoptions = [
				{
					checked: Twinkle.block.field_block_options.nocreate,
					label: 'Matikan pembuatan akun',
					name: 'nocreate',
					value: '1'
				},
				{
					checked: Twinkle.block.field_block_options.noemail,
					label: 'Batasi pengguna mengirimkan surel',
					name: 'noemail',
					value: '1'
				},
				{
					checked: Twinkle.block.field_block_options.disabletalk,
					label: 'Batasi pengguna untuk menyunting halaman pembicaraan penggunanya ketika sedang diblokir',
					name: 'disabletalk',
					value: '1'
				}
			];

		if (Twinkle.block.isRegistered) {
			blockoptions.push({
					checked: Twinkle.block.field_block_options.autoblock,
					label: 'Blokir otomatis alamat IP yang digunakan (pemblokiran rumit)',
					name: 'autoblock',
					value: '1'
				});
		} else {
			blockoptions.push({
					checked: Twinkle.block.field_block_options.hardblock,
					label: 'Cegah pengguna yang masuk log untuk menyunting dari alamat IP ini (pemblokiran rumit)',
					name: 'hardblock',
					value: '1'
				});
		}

		blockoptions.push({
				checked: Twinkle.block.field_block_options.watchuser,
				label: 'Pantau halaman pengguna dan pembicaraannya',
				name: 'watchuser',
				value: '1'
			});

		field_block_options.append({
				type: 'checkbox',
				name: 'blockoptions',
				list: blockoptions
			});
		field_block_options.append({
				type: 'textarea',
				label: 'Alasan (untuk dicantumkan di log pemblokiran):',
				name: 'reason',
				value: Twinkle.block.field_block_options.reason
			});

		if (Twinkle.block.currentBlockInfo) {
			field_block_options.append( { type: 'hidden', name: 'reblock', value: '1' } );
		}
	}

	if ($form.find('[name=actiontype][value=template]').is(':checked')) {
		field_template_options = new Morebits.quickForm.element({ type: 'field', label: 'Opsi templat', name: 'field_template_options' });
		field_template_options.append( {
				type: 'select',
				name: 'template',
				label: 'Pilih templat halaman pembicaraan:',
				event: Twinkle.block.callback.change_template,
				list: Twinkle.block.callback.filtered_block_groups(true),
				value: Twinkle.block.field_template_options.template
			} );
		field_template_options.append( {
				type: 'input',
				name: 'article',
				display: 'none',
				label: 'Artikel yang berkaitan',
				value: '',
				tooltip: 'Suatu artikel dapat ditautkan dengan pemberitahuan, yang mungkin yang menjadi sasaran perusakan. Kosongkan jika tidak ada.'
			} );
		if (!$form.find('[name=actiontype][value=block]').is(':checked')) {
			field_template_options.append( {
				type: 'input',
				name: 'template_expiry',
				display: 'none',
				label: 'Periode pemblokiran: ',
				value: '',
				tooltip: 'Periode pemblokiran, seperti 24 jam, dua minggu, dsb.'
			} );
		}
		field_template_options.append( {
			type: 'input',
			name: 'block_reason',
			label: '"Anda telah diblokir karena ..." ',
			display: 'none',
			tooltip: 'Alasan opsional, untuk mengganti alasan baku dasar. Hanya tersedia untuk templat baku dasar.',
			value: Twinkle.block.field_template_options.block_reason
		} );

		if ($form.find('[name=actiontype][value=block]').is(':checked')) {
			field_template_options.append( {
				type: 'checkbox',
				name: 'blank_duration',
				list: [
					{
						label: 'Jangan masukkan jangka waktu pemblokiran dalam templat',
						checked: Twinkle.block.field_template_options.blank_duration,
						tooltip: 'Jangka waktu pemblokiran tidak dimasukkan ke dalam templat, jadi hanya menginformasikan \"Anda sudah diblokir dari penyuntingan sementara ini selama...\"'
					}
				]
			} );
		} else {
			field_template_options.append( {
				type: 'checkbox',
				name: 'notalk',
				list: [
					{
						label: 'Akses halaman pembicaraan dimatikan',
						checked: Twinkle.block.field_template_options.notalk,
						tooltip: 'Gunakan opsi ini untuk membuat templat pemblokiran berisi bahwa akses ke halaman pembicaraan pengguna sudah dihapus'
					}
				]
			} );
		}

		var $previewlink = $( '<a id="twinkleblock-preivew-link">Preview</a>' );
		$previewlink.off('click').on('click', function(){
			Twinkle.block.callback.preview($form[0]);
		});
		$previewlink.css({cursor: 'pointer'});
		field_template_options.append( { type: 'div', id: 'blockpreview', label: [ $previewlink[0] ] } );
		field_template_options.append( { type: 'div', id: 'twinkleblock-previewbox', style: 'display: none' } );
	}

	var oldfield;
	if (field_preset) {
		oldfield = $form.find('fieldset[name="field_preset"]')[0];
		oldfield.parentNode.replaceChild(field_preset.render(), oldfield);
	} else {
		$form.find('fieldset[name="field_preset"]').hide();
	}
	if (field_block_options) {
		oldfield = $form.find('fieldset[name="field_block_options"]')[0];
		oldfield.parentNode.replaceChild(field_block_options.render(), oldfield);
	} else {
		$form.find('fieldset[name="field_block_options"]').hide();
	}
	if (field_template_options) {
		oldfield = $form.find('fieldset[name="field_template_options"]')[0];
		oldfield.parentNode.replaceChild(field_template_options.render(), oldfield);
		e.target.form.root.previewer = new Morebits.wiki.preview($(e.target.form.root).find('#twinkleblock-previewbox').last()[0]);
	} else {
		$form.find('fieldset[name="field_template_options"]').hide();
	}

	if (Twinkle.block.hasBlockLog) {
		var $blockloglink = $( '<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: mw.config.get('wgRelevantUserName'), type: 'block'}) + '">block log</a>)' );

		Morebits.status.init($('div[name="hasblocklog"] span').last()[0]);
		Morebits.status.warn('Pengguna ini pernah diblokir sebelumnya', $blockloglink[0]);
	}

	if (Twinkle.block.currentBlockInfo) {
		Morebits.status.init($('div[name="currentblock"] span').last()[0]);
		Morebits.status.warn(relevantUserName + ' sudah diblokir', 'Kirim permintaan untuk memblokir ulang dengan opsi yang diberikan');
		Twinkle.block.callback.update_form(e, Twinkle.block.currentBlockInfo);
	} else if ($form.find('[name=actiontype][value=template]').is(':checked')) {
		// make sure all the fields are correct based on defaults
		if ($form.find('[name=actiontype][value=block]').is(':checked')) {
			Twinkle.block.callback.change_preset(e);
		} else {
			Twinkle.block.callback.change_template(e);
		}
	}
};

/*
	* Keep alphabetized by key name, Twinkle.block.blockGroups establishes
	*    the order they will appear in the interface
	*
	* Block preset format, all keys accept only 'true' (omit for false) except where noted:
	* <title of block template> : {
	*   autoblock: <autoblock any IP addresses used (for registered users only)>
	*   disabletalk: <disable user from editing their own talk page while blocked>
	*   expiry: <string - expiry timestamp, can include relative times like "5 months", "2 weeks" etc, use "infinity" for indefinite>
	*   forAnonOnly: <show block option in the interface only if the relevant user is an IP>
	*   forRegisteredOnly: <show block option in the interface only if the relevant user is registered>
	*   label: <string - label for the option of the dropdown in the interface (keep brief)>
	*   noemail: prevent the user from sending email through Special:Emailuser
	*   pageParam: <set if the associated block template accepts a page parameter>
	*   prependReason: <string - prepends the value of 'reason' to the end of the existing reason, namely for when revoking talk page access>
	*   nocreate: <block account creation from the user's IP (for anonymous users only)>
	*   nonstandard: <template does not conform to stewardship of WikiProject User Warnings and may not accept standard parameters>
	*   reason: <string - block rationale, as would appear in the block log,
	*            and the edit summary for when adding block template, unless 'summary' is set>
	*   reasonParam: <set if the associated block template accepts a reason parameter>
	*   sig: <string - set to ~~~~ if block template does not accept "true" as the value, or set null to omit sig param altogether>
	*   summary: <string - edit summary for when adding block template to user's talk page, if not set, 'reason' is used>
	*   suppressArticleInSummary: <set to suppress showing the article name in the edit summary, as with attack pages>
	*   templateName: <string - name of template to use (instead of key name), entry will be omitted from the Templates list.
	*                  (e.g. use another template but with different block options)>
	*   useInitialOptions: <when preset is chosen, only change given block options, leave others as they were>
	*
	* WARNING: 'anononly' and 'allowusertalk' are enabled by default.
	*   To disable, set 'hardblock' and 'disabletalk', respectively
	*/
Twinkle.block.blockPresetsInfo = {
	'anonblock' : {
		expiry: '31 hours',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{anonblock}}',
		sig: '~~~~'
	},
	'anonblock - school' : {
		expiry: '36 hours',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{anonblock}} <!-- Likely a school based on behavioral evidence -->',
		templateName: 'anonblock',
		sig: '~~~~'
	},
	'blocked proxy' : {
		expiry: '1 year',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{blocked proxy}}',
		sig: null
	},
	'CheckUser block' : {
		nonstandard: true,
		reason: '{{CheckUser block}}',
		sig: '~~~~'
	},
	'checkuserblock-account' : {
		nonstandard: true,
		reason: '{{checkuserblock-account}}',
		sig: '~~~~'
	},
	'checkuserblock-wide' : {
		nonstandard: true,
		reason: '{{checkuserblock-wide}}',
		sig: '~~~~'
	},
	'colocationwebhost' : {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{colocationwebhost}}',
		sig: null
	},
	'oversightblock' : {
		nonstandard: true,
		reason: '{{OversightBlock}}',
		sig: '~~~~'
	},
	'school block' : {
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{school block}}',
		sig: '~~~~'
	},
	// Placeholder for when we add support for rangeblocks
	// 'rangeblock' : {
	//   reason: '{{rangeblock}}',
	//   nocreate: true,
	//   nonstandard: true,
	//   forAnonOnly: true,
	//   sig: '~~~~'
	// },
	'tor' : {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{Tor}}',
		sig: null
	},
	'webhostblock' : {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{webhostblock}}',
		sig: null
	},
	// uw-prefixed
	'uw-3block' : {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: 'Melanggar pengembalian tiga kali berturut-turut',
		summary: 'Anda diblokir karena melanggar kebijakan [[WP:3RR|pengembalian tiga kali berturut-turut]]'
	},
	'uw-ablock' : {
		autoblock: true,
		expiry: '31 hours',
		forAnonOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Alamat IP Anda diblokir dari hak penyuntingan',
		suppressArticleInSummary: true
	},
	'uw-adblock' : {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Menggunakan Wikipedia untuk mengirimkan spam atau beriklan',
		summary: 'Anda diblokir karena mengirimkan spam atau beriklan di Wikipedia'
	},
	'uw-aeblock' : {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Penegakan kebijakan arbitrase',
		reasonParam: true,
		summary: 'Anda diblokir karena suntingan Anda melanggar kebijakan arbitrase'
	},
	'uw-bioblock' : {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Melanggar kebijakan penulisan biografi tokoh yang masih hidup',
		summary: 'Anda diblokir karena melanggar kebijakan penulisan biografi tokoh yang masih hidup'
	},
	'uw-block' : {
		autoblock: true,
		expiry: '24 hours',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Anda telah diblokir dari hak penyuntingan',
		suppressArticleInSummary: true
	},
	'uw-blockindef' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Anda telah diblokir selamanya dari hak penyuntingan',
		suppressArticleInSummary: true
	},
	'uw-blocknotalk' : {
		disabletalk: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Anda telah diblokir dari penyuntingan dan akses ke halaman pembicaraan pengguna Anda dimatikan',
		suppressArticleInSummary: true
	},
	'uw-botblock': {
		forRegisteredOnly: true,
		pageParam: true,
		reason: 'Menjalankan kode bot tanpa persetujuan',
		summary: 'Anda diblokir karena menjalankan kode bot tanpa mendapatkan persetujuan'
	},
	'uw-botublock': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: 'Nama pengguna mirip dengan nama bot (pemblokiran lunak)',
		summary: 'Anda diblokir selamanya karena nama pengguna Anda menyiratkan bahwa ini akun bot, yang saat ini belum mendapat persetujuan'
	},
	'uw-causeblock' : {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: 'Nama pengguna terkesan berhubungan dengan nama organisasi (pemblokiran lunak)',
		summary: 'Anda diblokir selamanya karena nama pengguna Anda berhubungan dengan sebuah kelompok, organisasi, atau situs web'
	},
	'uw-compblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Akun yang disalahgunakan',
		summary: 'Anda diblokir selamanya karena akun yang digunakan dianggap telah disalahgunakan'
	},
	'uw-copyrightblock' : {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: 'Melanggar hak cipta',
		summary: 'Anda diblokir karena terus-menerus melanggar hak cipta'
	},
	'uw-dblock': {
		autoblock: true,
		nocreate: true,
		reason: 'Menghilangkan isi halaman terus-menerus',
		pageParam: true,
		summary: 'Anda diblokir karena terus-menerus menghilangkan isi halaman'
	},
	'uw-disruptblock' : {
		autoblock: true,
		nocreate: true,
		reason: 'Suntingan yang mengganggu',
		summary: 'Anda diblokir karena melakukan penyuntingan yang mengganggu/mengacau'
	},
	'uw-efblock' : {
		autoblock: true,
		nocreate: true,
		reason: 'Memicu filter suntingan secara sengaja',
		summary: 'Anda diblokir karena memicu filter suntingan dengan sengaja'
	},
	'uw-ewblock' : {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: 'Perang suntingan',
		summary: 'Anda diblokir untuk mencegah perang suntingan dengan pengguna lain yang disebabkan oleh suntingan mengganggu Anda'
	},
	'uw-hblock' : {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Serangan atau olokan terhadap subjek lain',
		summary: 'Anda diblokir karena mencoba menyerang pengguna/subjek lain'
	},
	'uw-ipevadeblock' : {
		forAnonOnly: true,
		nocreate: true,
		reason: 'Menghindari pemblokiran',
		summary: 'Alamat IP Anda diblokir karena digunakan untuk menhindari pemblokiran'
	},
	'uw-lblock' : {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		reason: 'Membuat ancaman hukum',
		summary: 'Anda diblokir karena mencoba membuat ancaman hukum'
	},
	'uw-memorialblock': {
		forRegisteredOnly: true,
		expiry: 'infinity',
		reason: 'Nama pengguna terkesan sebagai penghormatan kepada seseorang (pemblokiran lunak)',
		summary: 'Anda diblokir karena nama pengguna Anda dianggap digunakan untuk menghormati seseorang'
	},
	'uw-myblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Menggunakan Wikipedia sebagai forum, situs web, atau blog',
		summary: 'Anda diblokir karena menggunakan Wikipedia sebagai tempat menulis blog, situs jejaring sosial, atau forum'
	},
	'uw-nothereblock' : {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		reason: 'Jelas-jelas tidak bermaksud mengembangkan Wikipedia',
		forRegisteredOnly: true,
		summary: 'Anda diblokir karena dianggap tidak akan mengembangkan Wikipedia'
	},
	'uw-npblock' : {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Membuat halaman tanpa isi',
		summary: 'Anda diblokir karena membuat halaman tanpa isi yang bermakna'
	},
	'uw-pablock' : {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		reason: 'Serangan atau olokan terhadap subjek lain',
		summary: 'Anda diblokir karena menyerang pengguna/subjek lainnya'
	},
	'uw-sblock' : {
		autoblock: true,
		nocreate: true,
		reason: 'Menggunakan Wikipedia untuk menyebarkan spam',
		summary: 'Anda diblokir karena mengirimkan spam atau beriklan'
	},
	'uw-soablock' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: 'Akun spam, promosi, dan iklan',
		summary: 'Anda diblokir karena menggunakan akun untuk mengirimkan iklan, spam, dan promosi'
	},
	'uw-sockblock' : {
		autoblock: true,
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Menyalahgunakan beberapa akun',
		summary: 'Anda diblokir karena menyalahgunakan beberapa akun'
	},
	'uw-softerblock' : {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: 'Nama pengguna untuk promosi (pemblokiran lunak)',
		summary: 'Anda diblokir selamanya karena akun Anda dianggap mewakili sebuah kelompok, organisasi, atau situs web'
	},
	'uw-spamublock' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Nama pengguna untuk promosi, suntingan iklan',
		summary: 'Anda diblokir selamanya karena akun ini digunakan untuk beriklan dan melanggar kebijakan nama pengguna'
	},
	'uw-spoablock' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Akun boneka',
		summary: 'Anda diblokir karena menggunakan akun boneka'
	},
	'uw-talkrevoked' : {
		disabletalk: true,
		reason: 'Mencabut akses halaman pembicaraan: menyalahgunakan halaman pembicaraan selama diblokir',
		prependReason: true,
		summary: 'Halaman pembicaraan pengguna Anda dimatikan',
		useInitialOptions: true
	},
	'uw-ublock' : {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: 'Nama pengguna dilarang (pemblokiran lunak)',
		reasonParam: true,
		summary: 'Anda diblokir selamanya karena nama pengguna tersebut melanggar kebijakan nama pengguna'
	},
	'uw-ublock-double': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: 'Nama pengguna mirip dengan pengguna lain (pemblokiran lunak)',
		summary: 'Anda diblokir karena nama pengguna Anda sangat mirip dengan pengguna lain'
	},
	'uw-uhblock' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Nama pengguna dilarang (pemblokiran rumit)',
		reasonParam: true,
		summary: 'Anda diblokir selamanya karena menggunakan nama pengguna yang dilarang'
	},
	'uw-ublock-famous' : {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: 'Nama pengguna mirip tokoh terkenal (pemblokiran rumit)',
		summary: 'Anda diblokir selamanya karena nama pengguna Anda mirip dengan nama tokoh terkenal'
	},
	'uw-uhblock-double': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Nama pengguna mirip dengan pengguna lain (pemblokiran rumit)',
		summary: 'Anda diblokir selamanya karena nama pengguna Anda sangat mirip dengan pengguna lain'
	},
	'uw-vaublock' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: 'Nama pengguna dilarang, akun vandalisme semata-mata',
		summary: 'Anda diblokir selamanya karena melakukan vandalisme semata-mata dan menggunakan nama pengguna yang dilarang'
	},
	'uw-vblock' : {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		pageParam: true,
		reason: 'Melakukan vandalisme',
		summary: 'Anda diblokir karena melakukan [[WP:VANDAL|vandalisme]] terus-terusan'
	},
	'uw-voablock' : {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: 'Akun vandalisme semata-mata',
		summary: 'Anda diblokir selamanya karena semata-mata melakukan [[WP:VANDAL|vandalisme]]'
	}
};

Twinkle.block.transformBlockPresets = function twinkleblockTransformBlockPresets() {
	// supply sensible defaults
	$.each(Twinkle.block.blockPresetsInfo, function(preset, settings) {
		settings.summary = settings.summary || settings.reason;
		settings.sig = settings.sig !== undefined ? settings.sig : 'yes';
		// despite this it's preferred that you use 'infinity' as the value for expiry
		settings.indefinite = settings.indefinite || settings.expiry === 'infinity' || settings.expiry === 'indefinite' || settings.expiry === 'never';

		if (!Twinkle.block.isRegistered && settings.indefinite) {
			settings.expiry = '31 hours';
		} else {
			settings.expiry = settings.expiry || '31 hours';
		}

		Twinkle.block.blockPresetsInfo[preset] = settings;
	});
};

// These are the groups of presets and defines the order in which they appear. For each list item:
//   label: <string, the description that will be visible in the dropdown>
//   value: <string, the key of a preset in blockPresetsInfo>
Twinkle.block.blockGroups = [
	{
		label: 'Alasan pemblokiran umum',
		list: [
			{ label: 'blokanon', value: 'anonblock' },
			{ label: 'blokanon - mirip sebuah sekolah', value: 'anonblock - school' },
			{ label: 'blokir sekolah', value: 'school block' },
			{ label: 'Blokir umum (alasan tertentu)', value: 'uw-block' }, // ends up being default for registered users
			{ label: 'Blokir umum (alasan tertentu) – IP', value: 'uw-ablock', selected: true }, // set only when blocking IP
			{ label: 'Blokir umum (alasan tertentu) – selamanya', value: 'uw-blockindef' },
			{ label: 'Suntingan mengganggu', value: 'uw-disruptblock' },
			{ label: 'Penyalahgunaan halaman pembicaraan pengguna selama diblokir', value: 'uw-talkrevoked' },
			{ label: 'Tidak ingin mengembangkan ensiklopedia', value: 'uw-nothereblock' },
			{ label: 'Vandalisme', value: 'uw-vblock' },
			{ label: 'Akun vandalisme semata-mata', value: 'uw-voablock' }
		],
	},
	{
		label: 'Alasan tambahan',
		list: [
			{ label: 'Beriklan', value: 'uw-adblock' },
			{ label: 'Penegakan kebijakan arbitrase', value: 'uw-aeblock' },
			{ label: 'Menghindari pemblokiran – IP', value: 'uw-ipevadeblock' },
			{ label: 'Melanggar kebijakan tokoh yang masih hidup', value: 'uw-bioblock' },
			{ label: 'Melanggar hak cipta', value: 'uw-copyrightblock' },
			{ label: 'Membuat halaman yang tidak pantas', value: 'uw-npblock' },
			{ label: 'Berhubungan dengan filter suntingan', value: 'uw-efblock' },
			{ label: 'Perang suntingan', value: 'uw-ewblock' },
			{ label: 'Pemblokiran umum dengan akses halaman pembicaraan dicabut', value: 'uw-blocknotalk' },
			{ label: 'Menyerang subjek', value: 'uw-hblock' },
			{ label: 'Ancaman hukum', value: 'uw-lblock' },
			{ label: 'Menyerang pribadi', value: 'uw-pablock' },
			{ label: 'Akun yang disalahgunakan', value: 'uw-compblock' },
			{ label: 'Menghapus isi halaman', value: 'uw-dblock' },
			{ label: 'Akun boneka (inang)', value: 'uw-sockblock' },
			{ label: 'Akun boneka (anak)', value: 'uw-spoablock' },
			{ label: 'Jejaring sosial', value: 'uw-myblock' },
			{ label: 'Spam', value: 'uw-sblock' },
			{ label: 'Akun spam/iklan semata-mata', value: 'uw-soablock' },
			{ label: 'Bot yang belum disetujui', value: 'uw-botblock' },
			{ label: 'Melanggar tiga kali pengembalian', value: 'uw-3block' }
		]
	},
	{
		label: 'Pelanggaran nama pengguna',
		list: [
			{ label: 'Nama pengguna bot', value: 'uw-botublock' },
			{ label: 'Nama pengguna penghormatan kepada seseorang, soft block', value: 'uw-memorialblock' },
			{ label: 'Nama pengguna promosi, pemblokiran rumit', value: 'uw-spamublock' },
			{ label: 'Nama pengguna promosi, pemblokiran lunak', value: 'uw-softerblock' },
			{ label: 'Nama pengguna yang mirip, pemblokiran lunak', value: 'uw-ublock-double' },
			{ label: 'Pelanggaran nama pengguna, pemblokiran lunak', value: 'uw-ublock' },
			{ label: 'Pelanggaran nama pengguna, pemblokiran rumit', value: 'uw-uhblock' },
			{ label: 'Nama pengguna meniru-niru, pemblokiran rumit', value: 'uw-uhblock-double' },
			{ label: 'Nama pengguna yang mewakili tokoh terkenal, pemblokiran lunak', value: 'uw-ublock-famous' },
			{ label: 'Nama pengguna yang mewakili organisasi, pemblokiran lunak', value: 'uw-causeblock' },
			{ label: 'Pelanggaran nama pengguna dan akun spam semata-mata', value: 'uw-vaublock' }
		]
	},
	{
		label: 'Alasan bertemplat',
		list: [
			{ label: 'proksi yang diblokir', value: 'blocked proxy' },
			{ label: 'pemblokiran oleh CheckUser', value: 'CheckUser block' },
			{ label: 'checkuserblock-account', value: 'checkuserblock-account' },
			{ label: 'checkuserblock-wide', value: 'checkuserblock-wide' },
			{ label: 'colocationwebhost', value: 'colocationwebhost' },
			{ label: 'oversightblock', value: 'oversightblock' },
			// { label: 'rangeblock', value: 'rangeblock' }, // placeholder for when we add support for rangeblocks
			{ label: 'tor', value: 'tor' },
			{ label: 'webhostblock', value: 'webhostblock' }
		]
	}
];

Twinkle.block.callback.filtered_block_groups = function twinkleblockCallbackFilteredBlockGroups(show_template) {
	return $.map(Twinkle.block.blockGroups, function(blockGroup) {
		var list = $.map(blockGroup.list, function(blockPreset) {
				// only show uw-talkrevoked if reblocking
				if (!Twinkle.block.currentBlockInfo && blockPreset.value === "uw-talkrevoked") return;

				var blockSettings = Twinkle.block.blockPresetsInfo[blockPreset.value];
				var registrationRestrict = blockSettings.forRegisteredOnly ? Twinkle.block.isRegistered : (blockSettings.forAnonOnly ? !Twinkle.block.isRegistered : true);
				if (!(blockSettings.templateName && show_template) && registrationRestrict) {
					var templateName = blockSettings.templateName || blockPreset.value;
					return {
						label: (show_template ? '{{' + templateName + '}}: ' : '') + blockPreset.label,
						value: blockPreset.value,
						data: [{
							name: 'template-name',
							value: templateName
						}],
						selected: !!blockPreset.selected
					};
				}
			});
		if (list.length) return {
				label: blockGroup.label,
				list: list
			};
	});
};

Twinkle.block.callback.change_preset = function twinkleblockCallbackChangePreset(e) {
	var key = e.target.form.preset.value;
	if (!key) return;

	e.target.form.template.value = Twinkle.block.blockPresetsInfo[key].templateName || key;
	Twinkle.block.callback.update_form(e, Twinkle.block.blockPresetsInfo[key]);
	Twinkle.block.callback.change_template(e);
};

Twinkle.block.callback.change_expiry = function twinkleblockCallbackChangeExpiry(e) {
	var expiry = e.target.form.expiry;
	if (e.target.value === 'custom') {
		Morebits.quickForm.setElementVisibility(expiry.parentNode, true);
	} else {
		Morebits.quickForm.setElementVisibility(expiry.parentNode, false);
		expiry.value = e.target.value;
	}
};

Twinkle.block.callback.update_form = function twinkleblockCallbackUpdateForm(e, data) {
	var form = e.target.form, expiry = data.expiry;

	// don't override original expiry if useInitialOptions is set
	if (!data.useInitialOptions) {
		if (Date.parse(expiry)) {
			expiry = new Date(expiry).toGMTString();
			form.expiry_preset.value = 'custom';
		} else {
			form.expiry_preset.value = data.expiry || 'custom';
		}

		form.expiry.value = expiry;
		if (form.expiry_preset.value === 'custom') {
			Morebits.quickForm.setElementVisibility(form.expiry.parentNode, true);
		} else {
			Morebits.quickForm.setElementVisibility(form.expiry.parentNode, false);
		}
	}

	// boolean-flipped options, more at [[mw:API:Block]]
	data.disabletalk = data.disabletalk !== undefined ? data.disabletalk : false;
	data.hardblock = data.hardblock !== undefined ? data.hardblock : false;

	// disable autoblock if blocking a bot
	if (Twinkle.block.isRegistered && relevantUserName.search(/bot$/i) > 0) {
		data.autoblock = false;
	}

	$(form.field_block_options).find(':checkbox').each(function(i, el) {
		// don't override original options if useInitialOptions is set
		if (data.useInitialOptions && data[el.name] === undefined) return;

		var check = data[el.name] === '' || !!data[el.name];
		$(el).prop('checked', check);
	});

	if (data.prependReason && data.reason) {
		form.reason.value = data.reason + '; ' + form.reason.value;
	} else {
		form.reason.value = data.reason || '';
	}
};

Twinkle.block.callback.change_template = function twinkleblockcallbackChangeTemplate(e) {
	var form = e.target.form, value = form.template.value, settings = Twinkle.block.blockPresetsInfo[value];

	if (!$(form).find('[name=actiontype][value=block]').is(':checked')) {
		if (settings.indefinite || settings.nonstandard) {
			if (Twinkle.block.prev_template_expiry === null) {
				Twinkle.block.prev_template_expiry = form.template_expiry.value || '';
			}
			form.template_expiry.parentNode.style.display = 'none';
			form.template_expiry.value = 'indefinite';
		} else if ( form.template_expiry.parentNode.style.display === 'none' ) {
			if(Twinkle.block.prev_template_expiry !== null) {
				form.template_expiry.value = Twinkle.block.prev_template_expiry;
				Twinkle.block.prev_template_expiry = null;
			}
			form.template_expiry.parentNode.style.display = 'block';
		}
		if (Twinkle.block.prev_template_expiry) form.expiry.value = Twinkle.block.prev_template_expiry;
		Morebits.quickForm.setElementVisibility(form.notalk.parentNode, !settings.nonstandard);
	} else {
		Morebits.quickForm.setElementVisibility(
			form.blank_duration.parentNode,
			!settings.indefinite && !settings.nonstandard
		);
	}

	Morebits.quickForm.setElementVisibility(form.article.parentNode, !!settings.pageParam);
	Morebits.quickForm.setElementVisibility(form.block_reason.parentNode, !!settings.reasonParam);

	form.root.previewer.closePreview();
};
Twinkle.block.prev_template_expiry = null;
Twinkle.block.prev_block_reason = null;
Twinkle.block.prev_article = null;
Twinkle.block.prev_reason = null;

Twinkle.block.callback.preview = function twinkleblockcallbackPreview(form) {
	var params = {
		article: form.article.value,
		blank_duration: form.blank_duration ? form.blank_duration.checked : false,
		disabletalk: form.disabletalk.checked || (form.notalk ? form.notalk.checked : false),
		expiry: form.template_expiry ? form.template_expiry.value : form.expiry.value,
		hardblock: Twinkle.block.isRegistered ? form.autoblock.checked : form.hardblock.checked,
		indefinite: (/indef|infinity|never|\*|max/).test( form.template_expiry ? form.template_expiry.value : form.expiry.value ),
		reason: form.block_reason.value,
		template: form.template.value
	};

	var templateText = Twinkle.block.callback.getBlockNoticeWikitext(params);

	form.previewer.beginRender(templateText);
};

Twinkle.block.callback.evaluate = function twinkleblockCallbackEvaluate(e) {
	var $form = $(e.target),
		toBlock = $form.find('[name=actiontype][value=block]').is(':checked'),
		toWarn = $form.find('[name=actiontype][value=template]').is(':checked'),
		blockoptions = {}, templateoptions = {};

	Twinkle.block.callback.saveFieldset($form.find('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($form.find('[name=field_template_options]'));

	blockoptions = Twinkle.block.field_block_options;

	templateoptions = Twinkle.block.field_template_options;
	templateoptions.disabletalk = !!(templateoptions.disabletalk || blockoptions.disabletalk);
	templateoptions.hardblock = !!blockoptions.hardblock;
	delete blockoptions.expiry_preset; // remove extraneous

	// use block settings as warn options where not supplied
	templateoptions.summary = templateoptions.summary || blockoptions.reason;
	templateoptions.expiry = templateoptions.template_expiry || blockoptions.expiry;

	if (toBlock) {
		if (!blockoptions.expiry) return alert('Berikan waktu kedaluwarsa pemblokiran!');
		if (!blockoptions.reason) return alert('Berikan alasan pemblokiran!');

		Morebits.simpleWindow.setButtonsEnabled( false );
		Morebits.status.init( e.target );
		var statusElement = new Morebits.status('Menjalankan pemblokiran');
		blockoptions.action = 'block';
		blockoptions.user = mw.config.get('wgRelevantUserName');

		// boolean-flipped options
		blockoptions.anononly = blockoptions.hardblock ? undefined : true;
		blockoptions.allowusertalk = blockoptions.disabletalk ? undefined : true;

		// fix for bug with block API, see [[phab:T68646]]
		if (blockoptions.expiry === 'infinity') blockoptions.expiry = 'infinite';

		// execute block
		api.getToken('block').then(function(token) {
			statusElement.status('Sedang menjalankan...');
			blockoptions.token = token;
			var mbApi = new Morebits.wiki.api( 'Executing block', blockoptions, function(data) {
				statusElement.info('Selesai');
				if (toWarn) Twinkle.block.callback.issue_template(templateoptions);
			});
			mbApi.post();
		}, function() {
			statusElement.error('Tidak bisa mendapatkan token pemblokiran');
		});
	} else if (toWarn) {
		Morebits.simpleWindow.setButtonsEnabled( false );

		Morebits.status.init( e.target );
		Twinkle.block.callback.issue_template(templateoptions);
	} else {
		return alert('Berikan tugas kepada Twinkle!');
	}
};

Twinkle.block.callback.issue_template = function twinkleblockCallbackIssueTemplate(formData) {
	var userTalkPage = 'User_talk:' + mw.config.get('wgRelevantUserName');

	var params = $.extend(formData, {
		messageData: Twinkle.block.blockPresetsInfo[formData.template],
		reason: Twinkle.block.field_template_options.block_reason,
		disabletalk: Twinkle.block.field_template_options.notalk
	});

	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'Tindakan selesai, memuat ulang halaman pembicaraan dalam beberapa detik';

	var wikipedia_page = new Morebits.wiki.page( userTalkPage, 'Mengubah halaman pembicaraan pengguna' );
	wikipedia_page.setCallbackParameters( params );
	wikipedia_page.setFollowRedirect( true );
	wikipedia_page.load( Twinkle.block.callback.main );
};

Twinkle.block.callback.getBlockNoticeWikitext = function(params) {
	var text = '{{', settings = Twinkle.block.blockPresetsInfo[params.template];

	if (!settings.nonstandard) {
		text += 'subst:'+params.template;
		if (params.article && settings.pageParam) text += '|page=' + params.article;

		if (!/te?mp|^\s*$|min/.exec(params.expiry)) {
			if (params.indefinite) {
				text += '|indef=yes';
			} else if(!params.blank_duration) {
				text += '|time=' + params.expiry;
			}
		}

		if (!Twinkle.block.isRegistered && !params.hardblock) {
			text += '|anon=yes';
		}

		if (params.reason) text += '|reason=' + params.reason;
		if (params.disabletalk) text += '|notalk=yes';
	} else {
		text += params.template;
	}

	if (settings.sig) text += '|sig=' + settings.sig;

	return text + '}}';
};

Twinkle.block.callback.main = function twinkleblockcallbackMain( pageobj ) {
	var text = pageobj.getPageText(),
		params = pageobj.getCallbackParameters(),
		messageData = params.messageData,
		date = new Date();

	var dateHeaderRegex = new RegExp( '^==+\\s*(?:' + date.getUTCMonthName() + '|' + date.getUTCMonthNameAbbrev() +
		')\\s+' + date.getUTCFullYear() + '\\s*==+', 'mg' );
	var dateHeaderRegexLast, dateHeaderRegexResult;
	while ((dateHeaderRegexLast = dateHeaderRegex.exec( text )) !== null) {
		dateHeaderRegexResult = dateHeaderRegexLast;
	}
	// If dateHeaderRegexResult is null then lastHeaderIndex is never checked. If it is not null but
	// \n== is not found, then the date header must be at the very start of the page. lastIndexOf
	// returns -1 in this case, so lastHeaderIndex gets set to 0 as desired.
	var lastHeaderIndex = text.lastIndexOf( '\n==' ) + 1;

	if ( text.length > 0 ) {
		text += '\n\n';
	}

	params.indefinite = (/indef|infinity|never|\*|max/).test( params.expiry );

	if ( Twinkle.getPref('blankTalkpageOnIndefBlock') && params.template !== 'uw-lblock' && params.indefinite ) {
		Morebits.status.info( 'Info', 'Menghapus isi halaman pembicaraan berdasarkan preferensi dan membuat bagian tingkat 2 untuk tanggal' );
		text = '== ' + date.getUTCMonthName() + ' ' + date.getUTCFullYear() + ' ==\n';
	} else if( !dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex ) {
		Morebits.status.info( 'Info', 'Akan membuat bagian tingkat 2 baru untuk tanggal, karena subbagian bulan ini tidak tersedia' );
		text += '== ' + date.getUTCMonthName() + ' ' + date.getUTCFullYear() + ' ==\n';
	}

	params.expiry = typeof params.template_expiry !== "undefined" ? params.template_expiry : params.expiry;

	text += Twinkle.block.callback.getBlockNoticeWikitext(params);

	// build the edit summary
	var summary = messageData.summary;
	if ( messageData.suppressArticleInSummary !== true && params.article ) {
		summary += ' di [[' + params.article + ']]';
	}
	summary += '.' + Twinkle.getPref('summaryAd');

	pageobj.setPageText( text );
	pageobj.setEditSummary( summary );
	pageobj.setWatchlist( Twinkle.getPref('watchWarnings') );
	pageobj.save();
};

})(jQuery);

//</nowiki>
