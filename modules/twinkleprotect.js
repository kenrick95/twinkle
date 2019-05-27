//<nowiki>


(function($){


/*
 ****************************************
 *** twinkleprotect.js: Protect/RPP module
 ****************************************
 * Mode of invocation:     Tab ("PP"/"RPP")
 * Active on:              Non-special pages
 * Config directives in:   TwinkleConfig
 */

// Note: a lot of code in this module is re-used/called by batchprotect.

Twinkle.protect = function twinkleprotect() {
	if ( mw.config.get('wgNamespaceNumber') < 0 ) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.protect.callback, Morebits.userIsInGroup('sysop') ? "PP" : "RPP", "tw-rpp",
		Morebits.userIsInGroup('sysop') ? "Lindungi halaman" : "Permintaan perlindungan halaman" );
};

Twinkle.protect.callback = function twinkleprotectCallback() {
	var Window = new Morebits.simpleWindow( 620, 530 );
	Window.setTitle( Morebits.userIsInGroup( 'sysop' ) ? "Terapkan, meminta atau menandai halaman terlindungi" : "Minta atau tandai perlindungan halaman" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Templat perlindungan", "Templat:Templat perlindungan" );
	Window.addFooterLink( "Kebijakan perlindungan", "WP:LINDUNG" );
	Window.addFooterLink( "Bantuan Twinkle", "WP:TW/DOC#protect" );

	var form = new Morebits.quickForm( Twinkle.protect.callback.evaluate );
	var actionfield = form.append( {
			type: 'field',
			label: 'Jenis tindakan'
		} );
	if( Morebits.userIsInGroup( 'sysop' ) ) {
		actionfield.append( {
				type: 'radio',
				name: 'actiontype',
				event: Twinkle.protect.callback.changeAction,
				list: [
					{
						label: 'Lindungi halaman',
						value: 'protect',
						tooltip: 'Terapkan perlindungan ke halaman ini.',
						checked: true
					}
				]
			} );
	}
	actionfield.append( {
			type: 'radio',
			name: 'actiontype',
			event: Twinkle.protect.callback.changeAction,
			list: [
				{
					label: 'Meminta perlindungan halaman',
					value: 'request',
					tooltip: 'Jika Anda ingin meminta perlindungan halaman melalui WP:RPP' + (Morebits.userIsInGroup('sysop') ? ' alih-alih melindunginya sendiri.' : '.'),
					checked: !Morebits.userIsInGroup('sysop')
				},
				{
					label: 'Tandai halaman dengan templat perlindungan',
					value: 'tag',
					tooltip: 'Jika pengurus yang melakukan perlindungan lupa memberi templat, atau Anda sudah melindunginya tanpa menandai, Anda dapat menggunakan ini untuk menandai tag yang cocok.',
					disabled: mw.config.get('wgArticleId') === 0 || mw.config.get('wgPageContentModel') === 'Scribunto'
				}
			]
		} );

	form.append({ type: 'field', label: 'Jenis pengaturan', name: 'field_preset' });
	form.append({ type: 'field', label: '1', name: 'field1' });
	form.append({ type: 'field', label: '2', name: 'field2' });

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the controls
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.actiontype[0].dispatchEvent( evt );

	Morebits.wiki.actionCompleted.postfix = false;  // avoid Action: completed notice

	// get current protection level asynchronously
	Twinkle.protect.fetchProtectionLevel();
};

// Contains the current protection level in an object
// Once filled, it will look something like:
// { edit: { level: "sysop", expiry: <some date>, cascade: true }, ... }
Twinkle.protect.currentProtectionLevels = {};

// returns a jQuery Deferred object, usage:
//   Twinkle.protect.fetchProtectingAdmin(apiObject, pageName, protect/stable).done(function(admin_username) { ...code... });
Twinkle.protect.fetchProtectingAdmin = function twinkleprotectFetchProtectingAdmin(api, pageName, protType, logIds) {
	logIds = logIds || [];

	return api.get({
		format: 'json',
		action: 'query',
		list: 'logevents',
		letitle: pageName,
		letype: protType
	}).then(function( data ) {
		// don't check log entries that have already been checked (e.g. don't go into an infinite loop!)
		var event = data.query ? $.grep(data.query.logevents, function(le) { return $.inArray(le.logid, logIds); })[0] : null;
		if (!event) {
			// fail gracefully
			return null;
		} else if (event.action === "move_prot" || event.action === "move_stable") {
			return twinkleprotectFetchProtectingAdmin( api, (protType === 'protect' ? event.params.oldtitle_title : event.params.oldtitle), protType, logIds.concat(event.logid) );
		} else {
			return event.user;
		}
	});
};

// mw.loader.getState('ext.flaggedRevs.review') returns null if the
// FlaggedRevs extension is not registered.  Previously, this was done with
// wgFlaggedRevsParams, but after 1.34-wmf4 it is no longer exported if empty
// (https://gerrit.wikimedia.org/r/c/mediawiki/extensions/FlaggedRevs/+/508427)
Twinkle.protect.fetchProtectionLevel = function twinkleprotectFetchProtectionLevel() {

	var api = new mw.Api();
	var protectDeferred = api.get({
		format: 'json',
		indexpageids: true,
		action: 'query',
		list: 'logevents',
		letype: 'protect',
		letitle: mw.config.get('wgPageName'),
		prop: (mw.loader.getState('ext.flaggedRevs.review') ? 'info|flagged' : 'info'),
		inprop: 'protection',
		titles: mw.config.get('wgPageName')
	});
	var stableDeferred = api.get({
		format: 'json',
		action: 'query',
		list: 'logevents',
		letype: 'stable',
		letitle: mw.config.get('wgPageName')
	});

	var earlyDecision = [protectDeferred];
	if (mw.loader.getState('ext.flaggedRevs.review')) {
		earlyDecision.push(stableDeferred);
	}

	$.when.apply($, earlyDecision).done(function(protectData, stableData){
		// $.when.apply is supposed to take an unknown number of promises
		// via an array, which it does, but the type of data returned varies.
		// If there are two or more deferreds, it returns an array (of objects),
		// but if there's just one deferred, it retuns a simple object.
		// This is annoying.
		protectData = $(protectData).toArray();

		var pageid = protectData[0].query.pageids[0];
		var page = protectData[0].query.pages[pageid];
		var current = {}, adminEditDeferred;

		$.each(page.protection, function( index, protection ) {
			if (protection.type !== "aft") {
				current[protection.type] = {
					level: protection.level,
					expiry: protection.expiry,
					cascade: protection.cascade === ''
				};
				// logs report last admin who made changes to either edit/move/create protection, regardless if they only modified one of them
				if (!adminEditDeferred) {
					adminEditDeferred = Twinkle.protect.fetchProtectingAdmin(api, mw.config.get('wgPageName'), 'protect');
				}
			}
		});

		if (page.flagged) {
			current.stabilize = {
				level: page.flagged.protection_level,
				expiry: page.flagged.protection_expiry
			};
			adminEditDeferred = Twinkle.protect.fetchProtectingAdmin(api, mw.config.get('wgPageName'), 'stable');
		}

		// show the protection level and log info
		Twinkle.protect.hasProtectLog = !!protectData[0].query.logevents.length;
		Twinkle.protect.hasStableLog = mw.loader.getState('ext.flaggedRevs.review') ? !!stableData[0].query.logevents.length : false;
		Twinkle.protect.currentProtectionLevels = current;

		if (adminEditDeferred) {
			adminEditDeferred.done(function(admin) {
				if (admin) {
					$.each(['edit', 'move', 'create', 'stabilize'], function(i, type) {
						if (Twinkle.protect.currentProtectionLevels[type]) {
							Twinkle.protect.currentProtectionLevels[type].admin = admin;
						}
					});
				}
				Twinkle.protect.callback.showLogAndCurrentProtectInfo();
			});
		} else {
			Twinkle.protect.callback.showLogAndCurrentProtectInfo();
		}
	});
};

Twinkle.protect.callback.showLogAndCurrentProtectInfo = function twinkleprotectCallbackShowLogAndCurrentProtectInfo() {
	var currentlyProtected = !$.isEmptyObject(Twinkle.protect.currentProtectionLevels);

	if (Twinkle.protect.hasProtectLog || Twinkle.protect.hasStableLog) {
		var $linkMarkup = $("<span>");

		if (Twinkle.protect.hasProtectLog) {
			$linkMarkup.append(
				$( '<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: mw.config.get('wgPageName'), type: 'protect'}) + '">log perlindungan</a>' ),
				Twinkle.protect.hasStableLog ? $("<span> &bull; </span>") : null
			);
		}

		if (Twinkle.protect.hasStableLog) {
			$linkMarkup.append($( '<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: mw.config.get('wgPageName'), type: 'stable'}) + '">log perubahan tertunda</a>)' ));
		}

		Morebits.status.init($('div[name="hasprotectlog"] span')[0]);
		Morebits.status.warn(
			currentlyProtected ? 'Perlindungan sebelumnya' : 'Halaman ini telah dilindungi sebelumnya',
			$linkMarkup[0]
		);
	}

	Morebits.status.init($('div[name="currentprot"] span')[0]);
	var protectionNode = [], statusLevel = 'info';

	if (currentlyProtected) {
		$.each(Twinkle.protect.currentProtectionLevels, function(type, settings) {
			var label = type === 'stabilize' ? 'Perubahan tertunda' : Morebits.string.toUpperCaseFirstChar(type);
			protectionNode.push($("<b>" + label + ": " + settings.level + "</b>")[0]);
			if (settings.expiry === 'infinity') {
				protectionNode.push(" (indefinite) ");
			} else {
				protectionNode.push(" (expires " + new Date(settings.expiry).toUTCString() + ") ");
			}
			if (settings.cascade) {
				protectionNode.push("(cascading) ");
			}
			if (settings.admin) {
				var adminLink = '<a target="_blank" href="' + mw.util.getUrl('User talk:' + settings.admin) + '">' +  settings.admin + '</a>';
				protectionNode.push($("<span>by " + adminLink + "&nbsp;</span>")[0]);
			}
			protectionNode.push($("<span> \u2022 </span>")[0]);
		});
		protectionNode = protectionNode.slice(0, -1); // remove the trailing bullet
		statusLevel = 'warn';
	} else {
		protectionNode.push($("<b>tidak ada perlindungan</b>")[0]);
	}

	Morebits.status[statusLevel]("Tingkat perlindungan saat ini", protectionNode);
};

Twinkle.protect.callback.changeAction = function twinkleprotectCallbackChangeAction(e) {
	var field_preset;
	var field1;
	var field2;
	var isTemplate = mw.config.get("wgNamespaceNumber") === 10 || mw.config.get("wgNamespaceNumber") === 828;

	switch (e.target.values) {
		case 'protect':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Pilihan aturan', name: 'field_preset' });
			field_preset.append({
					type: 'select',
					name: 'category',
					label: 'Pilih pilihan berikut:',
					event: Twinkle.protect.callback.changePreset,
					list: (mw.config.get('wgArticleId') ?
						Twinkle.protect.protectionTypes.filter(function(v) {
							return isTemplate || v.label !== 'Templat perlindungan';
						}) :
						Twinkle.protect.protectionTypesCreate)
				});

			field2 = new Morebits.quickForm.element({ type: 'field', label: 'Opsi perlindungan', name: 'field2' });
			field2.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field2.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
			// for existing pages
			if (mw.config.get('wgArticleId')) {
				field2.append({
						type: 'checkbox',
						name: 'editmodify',
						event: Twinkle.protect.formevents.editmodify,
						list: [
							{
								label: 'Ubah perlindungan suntingan',
								value: 'editmodify',
								tooltip: 'Jika ini dimatikan, tingkat perlindungan suntingan, dan jangka waktu perlindungan, akan ditinggalkan seperti sediakala.',
								checked: true
							}
						]
					});
				var editlevel = field2.append({
						type: 'select',
						name: 'editlevel',
						label: 'Perlindungan suntingan:',
						event: Twinkle.protect.formevents.editlevel
					});
				editlevel.append({
						type: 'option',
						label: 'Semua',
						value: 'all'
					});
				editlevel.append({
						type: 'option',
						label: 'Terkonfirmasi otomatis',
						value: 'autoconfirmed'
					});
				// editlevel.append({
				// 		type: 'option',
				// 		label: 'Extended confirmed',
				// 		value: 'extendedconfirmed'
				// 	});
				if (isTemplate) {
					editlevel.append({
							type: 'option',
							label: 'Editor templat',
							value: 'templateeditor'
						});
				}
				editlevel.append({
						type: 'option',
						label: 'Pengurus',
						value: 'sysop',
						selected: true
					});
				field2.append({
						type: 'select',
						name: 'editexpiry',
						label: 'Jangka waktu perlindungan:',
						event: function(e) {
							if (e.target.value === 'custom') {
								Twinkle.protect.doCustomExpiry(e.target);
							}
						},
						// default expiry selection is conditionally set in Twinkle.protect.callback.changePreset
						list: [
							{ label: '1 jam', value: '1 hour' },
							{ label: '2 jam', value: '2 hours' },
							{ label: '3 jam', value: '3 hours' },
							{ label: '6 jam', value: '6 hours' },
							{ label: '12 jam', value: '12 hours' },
							{ label: '1 hari', value: '1 day' },
							{ label: '2 hari', value: '2 days' },
							{ label: '3 hari', value: '3 days' },
							{ label: '4 hari', value: '4 days' },
							{ label: '1 minggu', value: '1 week' },
							{ label: '2 minggu', value: '2 weeks' },
							{ label: '1 bulan', value: '1 month' },
							{ label: '2 bulan', value: '2 months' },
							{ label: '3 bulan', value: '3 months' },
							{ label: '1 tahun', value: '1 year' },
							{ label: 'tak terbatas', value:'indefinite' },
							{ label: 'Lain-lain...', value: 'custom' }
						]
					});
				field2.append({
						type: 'checkbox',
						name: 'movemodify',
						event: Twinkle.protect.formevents.movemodify,
						list: [
							{
								label: 'Ubah perlindungan pemindahan',
								value: 'movemodify',
								tooltip: 'Jika opsi ini dimatikan, tingkat perlindungan pemindahan halaman dan jangka waktu kedaluwarsa akan ditinggalkan sebagaimana adanya.',
								checked: true
							}
						]
					});
				var movelevel = field2.append({
						type: 'select',
						name: 'movelevel',
						label: 'Perlindungan pemindahan:',
						event: Twinkle.protect.formevents.movelevel
					});
				movelevel.append({
						type: 'option',
						label: 'Semua',
						value: 'all'
					});
				movelevel.append({
						type: 'option',
						label: 'Terkonfirmasi otomatis',
						value: 'autoconfirmed'
					});
				if (isTemplate) {
					movelevel.append({
							type: 'option',
							label: 'Editor templat',
							value: 'templateeditor'
						});
				}
				movelevel.append({
						type: 'option',
						label: 'Pengurus',
						value: 'sysop',
						selected: true
					});
				field2.append({
						type: 'select',
						name: 'moveexpiry',
						label: 'Jangka waktu perlindungan:',
						event: function(e) {
							if (e.target.value === 'custom') {
								Twinkle.protect.doCustomExpiry(e.target);
							}
						},
						// default expiry selection is conditionally set in Twinkle.protect.callback.changePreset
						list: [
							{ label: '1 jam', value: '1 hour' },
							{ label: '2 jam', value: '2 hours' },
							{ label: '3 jam', value: '3 hours' },
							{ label: '6 jam', value: '6 hours' },
							{ label: '12 jam', value: '12 hours' },
							{ label: '1 hari', value: '1 day' },
							{ label: '2 hari', selected: true, value: '2 days' },
							{ label: '3 hari', value: '3 days' },
							{ label: '4 hari', value: '4 days' },
							{ label: '1 minggu', value: '1 week' },
							{ label: '2 minggu', value: '2 weeks' },
							{ label: '1 bulan', value: '1 month' },
							{ label: '2 bulan', value: '2 months' },
							{ label: '3 bulan', value: '3 months' },
							{ label: '1 tahun', value: '1 year' },
							{ label: 'tak terbatas', value:'indefinite' },
							{ label: 'Lain-lain...', value: 'custom' }
						]
					});
				if (mw.loader.getState('ext.flaggedRevs.review')) {
					field2.append({
							type: 'checkbox',
							name: 'pcmodify',
							event: Twinkle.protect.formevents.pcmodify,
							list: [
								{
									label: 'Modify pending changes protection',
									value: 'pcmodify',
									tooltip: 'If this is turned off, the pending changes level, and expiry time, will be left as is.',
									checked: true,
									disabled: (mw.config.get('wgNamespaceNumber') !== 0 && mw.config.get('wgNamespaceNumber') !== 4) // Hardcoded until [[phab:T218479]]
								}
							]
						});
					var pclevel = field2.append({
							type: 'select',
							name: 'pclevel',
							label: 'Perubahan tertunda:',
							event: Twinkle.protect.formevents.pclevel
						});
					pclevel.append({
							type: 'option',
							label: 'None',
							value: 'none'
						});
					pclevel.append({
							type: 'option',
							label: 'Perubahan tertunda',
							value: 'autoconfirmed',
							selected: true
						});
					field2.append({
							type: 'select',
							name: 'pcexpiry',
							label: 'Kedaluwarsa:',
							event: function(e) {
								if (e.target.value === 'custom') {
									Twinkle.protect.doCustomExpiry(e.target);
								}
							},
							list: [
								{ label: '1 jam', value: '1 hour' },
								{ label: '2 jam', value: '2 hours' },
								{ label: '3 jam', value: '3 hours' },
								{ label: '6 jam', value: '6 hours' },
								{ label: '12 jam', value: '12 hours' },
								{ label: '1 hari', value: '1 day' },
								{ label: '2 hari', value: '2 days' },
								{ label: '3 hari', value: '3 days' },
								{ label: '4 hari', value: '4 days' },
								{ label: '1 minggu', value: '1 week' },
								{ label: '2 minggu', value: '2 weeks' },
								{ label: '1 bulan', selected: true,  value: '1 month' },
								{ label: '2 bulan', value: '2 months' },
								{ label: '3 bulan', value: '3 months' },
								{ label: '1 tahun', value: '1 year' },
								{ label: 'tak terbatas', value:'indefinite' },
								{ label: 'Lain-lain...', value: 'custom' }
							]
						});
				}
			} else {  // for non-existing pages
				var createlevel = field2.append({
						type: 'select',
						name: 'createlevel',
						label: 'Perlindungan pembuatan:',
						event: Twinkle.protect.formevents.createlevel
					});
				createlevel.append({
						type: 'option',
						label: 'Semua',
						value: 'all'
					});
				if (mw.config.get("wgNamespaceNumber") !== 0) {
					createlevel.append({
							type: 'option',
							label: 'Terkonfirmasi otomatis',
							value: 'autoconfirmed'
						});
				}
				if (isTemplate) {
					createlevel.append({
							type: 'option',
							label: 'Editor templat',
							value: 'templateeditor'
						});
				}
				createlevel.append({
						type: 'option',
						label: 'Pengurus',
						value: 'sysop', // enwp: extendedconfirmed
						selected: true
					});
				createlevel.append({
						type: 'option',
						label: 'Sysop',
						value: 'sysop'
					});
				field2.append({
						type: 'select',
						name: 'createexpiry',
						label: 'Jangka waktu perlindungan:',
						event: function(e) {
							if (e.target.value === 'custom') {
								Twinkle.protect.doCustomExpiry(e.target);
							}
						},
						list: [
							{ label: '1 jam', value: '1 hour' },
							{ label: '2 jam', value: '2 hours' },
							{ label: '3 jam', value: '3 hours' },
							{ label: '6 jam', value: '6 hours' },
							{ label: '12 jam', value: '12 hours' },
							{ label: '1 hari', value: '1 day' },
							{ label: '2 hari', selected: true, value: '2 days' },
							{ label: '3 hari', value: '3 days' },
							{ label: '4 hari', value: '4 days' },
							{ label: '1 minggu', value: '1 week' },
							{ label: '2 minggu', value: '2 weeks' },
							{ label: '1 bulan', value: '1 month' },
							{ label: '2 bulan', value: '2 months' },
							{ label: '3 bulan', value: '3 months' },
							{ label: '1 tahun', value: '1 year' },
							{ label: 'tak terbatas', value:'indefinite' },
							{ label: 'Lain-lain...', value: 'custom' }
						]
					});
			}
			field2.append({
					type: 'textarea',
					name: 'protectReason',
					label: 'Alasan (untuk log perlindungan):'
				});
			if (!mw.config.get('wgArticleId') || mw.config.get('wgPageContentModel') === 'Scribunto') {  // tagging isn't relevant for non-existing or module pages
				break;
			}
			/* falls through */
		case 'tag':
			field1 = new Morebits.quickForm.element({ type: 'field', label: 'Opsi penandaan tag', name: 'field1' });
			field1.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field1.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
			field1.append( {
					type: 'select',
					name: 'tagtype',
					label: 'Pilih templat:',
					list: Twinkle.protect.protectionTags,
					event: Twinkle.protect.formevents.tagtype
				} );
			field1.append( {
					type: 'checkbox',
					list: [
						{
							name: 'small',
							label: 'Ikon (small=yes)',
							tooltip: 'Akan menggunakan fitur |small=yes dari templat, dan hanya tampil dengan ikon gembok',
							checked: true
						},
						{
							name: 'noinclude',
							label: 'Sembunyikan templat ke dalam <noinclude>',
							tooltip: 'Akan menyembunyikan templat perlindungan dalam tag &lt;noinclude&gt;, sehingga tidak akan ditransklusi',
							checked: (mw.config.get('wgNamespaceNumber') === 10)
						}
					]
				} );
			break;

		case 'request':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Jenis perlindungan', name: 'field_preset' });
			field_preset.append({
					type: 'select',
					name: 'category',
					label: 'Jenis dan alasan:',
					event: Twinkle.protect.callback.changePreset,
					list: (mw.config.get('wgArticleId') ? Twinkle.protect.protectionTypes : Twinkle.protect.protectionTypesCreate)
				});

			field1 = new Morebits.quickForm.element({ type: 'field', label: 'Opsi', name: 'field1' });
			field1.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field1.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
			field1.append( {
					type: 'select',
					name: 'expiry',
					label: 'Jangka waktu: ',
					list: [
						{ label: 'Sementara', value: 'temporary' },
						{ label: 'Selamanya', value: 'indefinite' },
						{ label: '', selected: true, value: '' }
					]
				} );
			field1.append({
					type: 'textarea',
					name: 'reason',
					label: 'Alasan: '
				});
			break;
		default:
			alert("Terjadi sesuatu di twinkleprotect");
			break;
	}

	var oldfield;

	if (field_preset) {
		oldfield = $(e.target.form).find('fieldset[name="field_preset"]')[0];
		oldfield.parentNode.replaceChild(field_preset.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field_preset"]').css('display', 'none');
	}
	if (field1) {
		oldfield = $(e.target.form).find('fieldset[name="field1"]')[0];
		oldfield.parentNode.replaceChild(field1.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field1"]').css('display', 'none');
	}
	if (field2) {
		oldfield = $(e.target.form).find('fieldset[name="field2"]')[0];
		oldfield.parentNode.replaceChild(field2.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field2"]').css('display', 'none');
	}

	if (e.target.values === 'protect') {
		// fake a change event on the preset dropdown
		var evt = document.createEvent( "Event" );
		evt.initEvent( 'change', true, true );
		e.target.form.category.dispatchEvent( evt );

		// reduce vertical height of dialog
		$(e.target.form).find('fieldset[name="field2"] select').parent().css({ display: 'inline-block', marginRight: '0.5em' });
	}

	// re-add protection level and log info, if it's available
	Twinkle.protect.callback.showLogAndCurrentProtectInfo();
};

Twinkle.protect.formevents = {
	editmodify: function twinkleprotectFormEditmodifyEvent(e) {
		e.target.form.editlevel.disabled = !e.target.checked;
		e.target.form.editexpiry.disabled = !e.target.checked || (e.target.form.editlevel.value === 'all');
		e.target.form.editlevel.style.color = e.target.form.editexpiry.style.color = (e.target.checked ? "" : "transparent");
	},
	editlevel: function twinkleprotectFormEditlevelEvent(e) {
		e.target.form.editexpiry.disabled = (e.target.value === 'all');
	},
	movemodify: function twinkleprotectFormMovemodifyEvent(e) {
		// sync move settings with edit settings if applicable
		if (e.target.form.movelevel.disabled && !e.target.form.editlevel.disabled) {
			e.target.form.movelevel.value = e.target.form.editlevel.value;
			e.target.form.moveexpiry.value = e.target.form.editexpiry.value;
		} else if (e.target.form.editlevel.disabled) {
			e.target.form.movelevel.value = 'sysop';
			e.target.form.moveexpiry.value = 'indefinite';
		}
		e.target.form.movelevel.disabled = !e.target.checked;
		e.target.form.moveexpiry.disabled = !e.target.checked || (e.target.form.movelevel.value === 'all');
		e.target.form.movelevel.style.color = e.target.form.moveexpiry.style.color = (e.target.checked ? "" : "transparent");
	},
	movelevel: function twinkleprotectFormMovelevelEvent(e) {
		e.target.form.moveexpiry.disabled = (e.target.value === 'all');
	},
	pcmodify: function twinkleprotectFormPcmodifyEvent(e) {
		e.target.form.pclevel.disabled = !e.target.checked;
		e.target.form.pcexpiry.disabled = !e.target.checked || (e.target.form.pclevel.value === 'none');
		e.target.form.pclevel.style.color = e.target.form.pcexpiry.style.color = (e.target.checked ? "" : "transparent");
	},
	pclevel: function twinkleprotectFormPclevelEvent(e) {
		e.target.form.pcexpiry.disabled = (e.target.value === 'none');
	},
	createlevel: function twinkleprotectFormCreatelevelEvent(e) {
		e.target.form.createexpiry.disabled = (e.target.value === 'all');
	},
	tagtype: function twinkleprotectFormTagtypeEvent(e) {
		e.target.form.small.disabled = e.target.form.noinclude.disabled = (e.target.value === 'none') || (e.target.value === 'noop');
	}
};

Twinkle.protect.doCustomExpiry = function twinkleprotectDoCustomExpiry(target) {
	var custom = prompt('Masukkan waktu lainnya.  \nAnda dapat menggunakan waktu relatif, seperti ¨1 menit¨ atau ¨19 hari¨, atau stempel waktu absolut, "yyyymmddhhmm" (contohnya "200602011405" adalah 1 Februari 2006, pukul 14.05 GMT).', '');
	if (custom) {
		var option = document.createElement('option');
		option.setAttribute('value', custom);
		option.textContent = custom;
		target.appendChild(option);
		target.value = custom;
	} else {
		target.selectedIndex = 0;
	}
};

Twinkle.protect.protectionTypes = [
	{ label: 'Hapus perlindungan', value: 'unprotect' },
	{
		label: 'Perlindungan penuh',
		list: [
			{ label: 'Bawaan (penuh)', value: 'pp-protected' },
			{ label: 'Isi yang dipertentangkan/perang suntingan (penuh)', value: 'pp-dispute' },
			{ label: 'Vandalisme berulang (penuh)', value: 'pp-vandalism' },
			{ label: 'Pembicaraan pengguna yang diblokir (penuh)', value: 'pp-usertalk' }
		]
	},
	{
		label: 'Perlindungan templat',
		list: [
			{ label: 'Templat yang sering dipakai', value: 'pp-template' }
		]
	},
	// idwiki doesn't have extendedconfirmed!
	// {
	// 	label: 'Extended confirmed protection',
	// 	list: [
	// 		{ label: 'Arbitration enforcement (ECP)', selected: true, value: 'pp-30-500-arb' },
	// 		{ label: 'Persistent vandalism (ECP)', value: 'pp-30-500-vandalism' },
	// 		{ label: 'Disruptive editing (ECP)', value: 'pp-30-500-disruptive' },
	// 		{ label: 'BLP policy violations (ECP)', value: 'pp-30-500-blp' },
	// 		{ label: 'Sockpuppetry (ECP)', value: 'pp-30-500-sock' }
	// 	]
	// },
	{
		label: 'Perlindungan sebagian',
		list: [
			{ label: 'Bawaan (semi)', value: 'pp-semi-protected' },
			{ label: 'Vandalisme berulang (semi)', selected: true, value: 'pp-semi-vandalism' },
			{ label: 'Suntingan merusak (semi)', value: 'pp-semi-disruptive' },
			{ label: 'Penambahan isi tanpa sumber (semi)', value: 'pp-semi-unsourced' },
			{ label: 'Melanggar kebijakan BLP (semi)', value: 'pp-semi-blp' },
			{ label: 'Penggunaan akun boneka (semi)', value: 'pp-semi-sock' },
			{ label: 'Pembicaraan pengguna yang diblokir (semi)', value: 'pp-semi-usertalk' }
		]
	},
	{
		label: 'Perubahan tertunda',
		list: [
			{ label: 'Bawaan (PT)', value: 'pp-pc-protected' },
			{ label: 'Vandalisme berulang (PT)', value: 'pp-pc-vandalism' },
			{ label: 'Suntingan merusak (PT)', value: 'pp-pc-disruptive' },
			{ label: 'Penambahan isi tanpa sumber (PT)', value: 'pp-pc-unsourced' },
			{ label: 'Penyalahgunaan kebijakan BLP (PT)', value: 'pp-pc-blp' }
		]
	},
	{
		label: 'Perlindungan pemindahan',
		list: [
			{ label: 'Bawaan (pemindahan)', value: 'pp-move' },
			{ label: 'Isi yang dipertentangkan/perang suntingan (pemindahan)', value: 'pp-move-dispute' },
			{ label: 'Vandalisme pemindahan halaman (pemindahan)', value: 'pp-move-vandalism' },
			{ label: 'Halaman yang banyak ditampilkan (pemindahan)', value: 'pp-move-indef' }
		]
	}
];

Twinkle.protect.protectionTypesCreate = [
	{ label: 'Hapus perlindungan', value: 'unprotect' },
	{
		label: 'Buat perlindungan',
		list: [
			{ label: 'Bawaan ({{pp-create}})', value: 'pp-create' },
			{ label: 'Judul halaman yang menghasut', value: 'pp-create-offensive' },
			{ label: 'Pembuatan halaman berulang', selected: true, value: 'pp-create-salt' },
			{ label: 'Halaman biografi orang hidup yang dibuat kembali', value: 'pp-create-blp' }
		]
	}
];

// A page with both regular and PC protection will be assigned its regular
// protection weight plus 2
Twinkle.protect.protectionWeight = {
	sysop: 40,
	templateeditor: 30,
	// extendedconfirmed: 20,
	autoconfirmed: 10,
	flaggedrevs_autoconfirmed: 5,  // Pending Changes protection alone
	all: 0,
	flaggedrevs_none: 0  // just in case
};

// NOTICE: keep this synched with [[MediaWiki:Protect-dropdown]]
// Also note: stabilize = Pending Changes level
Twinkle.protect.protectionPresetsInfo = {
	'pp-protected': {
		edit: 'sysop',
		move: 'sysop',
		reason: null
	},
	'pp-dispute': {
		edit: 'sysop',
		move: 'sysop',
		reason: 'Perang suntingan/isi yang dipertentangkan'
	},
	'pp-vandalism': {
		edit: 'sysop',
		move: 'sysop',
		reason: '[[WP:VANDAL|Vandalisme]] yang berulang-ulang'
	},
	'pp-usertalk': {
		edit: 'sysop',
		move: 'sysop',
		reason: 'Penyalahgunaan halaman pembicaraan pengguna saat diblokir'
	},
	'pp-template': {
		edit: 'templateeditor',
		move: 'templateeditor',
		reason: 'Templat yang sering digunakan'
	},
	// 'pp-30-500-arb': {
	// 	edit: 'extendedconfirmed',
	// 	move: 'extendedconfirmed',
	// 	reason: '[[WP:30/500|Arbitration enforcement]]',
	// 	template: 'pp-30-500'
	// },
	// 'pp-30-500-vandalism': {
	// 	edit: 'extendedconfirmed',
	// 	move: 'extendedconfirmed',
	// 	reason: 'Persistent [[WP:Vandalism|vandalism]] from (auto)confirmed accounts',
	// 	template: 'pp-30-500'
	// },
	// 'pp-30-500-disruptive': {
	// 	edit: 'extendedconfirmed',
	// 	move: 'extendedconfirmed',
	// 	reason: 'Persistent [[WP:Disruptive editing|disruptive editing]] from (auto)confirmed accounts',
	// 	template: 'pp-30-500'
	// },
	// 'pp-30-500-blp': {
	// 	edit: 'extendedconfirmed',
	// 	move: 'extendedconfirmed',
	// 	reason: 'Persistent violations of the [[WP:BLP|biographies of living persons policy]] from (auto)confirmed accounts',
	// 	template: 'pp-30-500'
	// },
	// 'pp-30-500-sock': {
	// 	edit: 'extendedconfirmed',
	// 	move: 'extendedconfirmed',
	// 	reason: 'Persistent [[WP:Sock puppetry|sock puppetry]]',
	// 	template: 'pp-30-500'
	// },
	'pp-semi-vandalism': {
		edit: 'autoconfirmed',
		reason: '[[WP:VANDAL|Vandalisme]] berulang-ulang',
		template: 'pp-vandalism'
	},
	'pp-semi-disruptive': {
		edit: 'autoconfirmed',
		reason: 'Suntingan yang tidak berguna secara berulang-ulang',
		template: 'pp-protected'
	},
	'pp-semi-unsourced': {
		edit: 'autoconfirmed',
		reason: 'Penambahan isi halaman tanpa sumber',
		template: 'pp-protected'
	},
	'pp-semi-blp': {
		edit: 'autoconfirmed',
		reason: 'Melanggar kebijakan tokoh yang masih hidup',
		template: 'pp-blp'
	},
	'pp-semi-usertalk': {
		edit: 'autoconfirmed',
		move: 'autoconfirmed',
		reason: 'Penyalahgunaan halaman pembicaraan pengguna saat diblokir',
		template: 'pp-usertalk'
	},
	'pp-semi-template': {  // removed for now
		edit: 'autoconfirmed',
		move: 'autoconfirmed',
		reason: 'Templat berisiko tinggi',
		template: 'pp-template'
	},
	'pp-semi-sock': {
		edit: 'autoconfirmed',
		reason: 'Suntingan dari akun boneka berulang-ulang',
		template: 'pp-sock'
	},
	'pp-semi-protected': {
		edit: 'autoconfirmed',
		reason: null,
		template: 'pp-protected'
	},
	'pp-pc-vandalism': {
		stabilize: 'autoconfirmed',  // stabilize = Pending Changes
		reason: '[[WP:VANDAL|Vandalisme]] berulang-ulang',
		template: 'pp-pc'
	},
	'pp-pc-disruptive': {
		stabilize: 'autoconfirmed',
		reason: '[[WP:VANDAL|Suntingan merusak]] berulang-ulang',
		template: 'pp-pc'
	},
	'pp-pc-unsourced': {
		stabilize: 'autoconfirmed',
		reason: 'Penambahan isi artikel tanpa sumber',
		template: 'pp-pc'
	},
	'pp-pc-blp': {
		stabilize: 'autoconfirmed',
		reason: 'Melanggar kebijakan tokoh yang masih hidup',
		template: 'pp-pc'
	},
	'pp-pc-protected': {
		stabilize: 'autoconfirmed',
		reason: null,
		template: 'pp-pc'
	},
	'pp-move': {
		move: 'sysop',
		reason: null
	},
	'pp-move-dispute': {
		move: 'sysop',
		reason: 'Perang pemindahan halaman'
	},
	'pp-move-vandalism': {
		move: 'sysop',
		reason: 'Vandalisme pemindahan halaman'
	},
	'pp-move-indef': {
		move: 'sysop',
		reason: 'Halaman dengan lalu-lintas tinggi'
	},
	'unprotect': {
		edit: 'semua',
		move: 'semua',
		stabilize: 'tidak ada',
		create: 'semua',
		reason: null,
		template: 'tidak ada'
	},
	'pp-create-offensive': {
		create: 'sysop',
		reason: 'Nama yang menghasut'
	},
	'pp-create-salt': {
		create: 'sysop',
		reason: 'Halaman yang berulang kali dibuat dalam waktu dekat'
	},
	'pp-create-blp': {
		create: 'sysop',
		reason: 'Halaman tokoh hidup yang dibuat kembali'
	},
	'pp-create': {
		create: 'sysop',
		reason: '{{pp-create}}'
	}
};

Twinkle.protect.protectionTags = [
	{
		label: 'Tidak ada (hapus templat perlindungan yang ada)',
		value: 'none'
	},
	{
		label: 'Tidak ada (jangan hapus templat perlindungan yang ada)',
		value: 'noop'
	},
	{
		label: 'Sunting templat perlindungan',
		list: [
			{ label: '{{pp-vandalism}}: vandalisme', value: 'pp-vandalism' },
			{ label: '{{pp-dispute}}: perang suntingan', value: 'pp-dispute', selected: true },
			{ label: '{{pp-blp}}: melanggar kebijakan BLP', value: 'pp-blp' },
			{ label: '{{pp-sock}}: penyalahgunaan akun boneka', value: 'pp-sock' },
			{ label: '{{pp-template}}: templat berisiko tinggi', value: 'pp-template' },
			{ label: '{{pp-usertalk}}: halaman pembicaraan pengguna yang diblokir', value: 'pp-usertalk' },
			{ label: '{{pp-protected}}: perlindungan umum', value: 'pp-protected' },
			{ label: '{{pp-semi-indef}}: perlindungan sebagian dalam jangka waktu lama umum', value: 'pp-semi-indef' },
			// { label: '{{pp-30-500}}: extended confirmed protection', value: 'pp-30-500' }
		]
	},
	{
		label: 'Templat perubahan tertunda',
		list: [
			{ label: '{{pp-pc}}: perubahan tertunda', value: 'pp-pc' }
		]
	},
	{
		label: 'Templat perlindungan pemindahan',
		list: [
			{ label: '{{pp-move-dispute}}: perang suntingan', value: 'pp-move-dispute' },
			{ label: '{{pp-move-vandalism}}: vandalisme pemindahan halaman', value: 'pp-move-vandalism' },
			{ label: '{{pp-move-indef}}: umum dalam jangka waktu lama', value: 'pp-move-indef' },
			{ label: '{{pp-move}}: lainnya', value: 'pp-move' }
		]
	}
];

Twinkle.protect.callback.changePreset = function twinkleprotectCallbackChangePreset(e) {
	var form = e.target.form;

	var actiontypes = form.actiontype;
	var actiontype;
	for( var i = 0; i < actiontypes.length; i++ )
	{
		if( !actiontypes[i].checked ) {
			continue;
		}
		actiontype = actiontypes[i].values;
		break;
	}

	if (actiontype === 'protect') {  // actually protecting the page
		var item = Twinkle.protect.protectionPresetsInfo[form.category.value];

		if (mw.config.get('wgArticleId')) {
			if (item.edit) {
				form.editmodify.checked = true;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
				form.editlevel.value = item.edit;
				Twinkle.protect.formevents.editlevel({ target: form.editlevel });
				form.editexpiry.value = '2 days';
			} else {
				form.editmodify.checked = false;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
			}

			if (item.move) {
				form.movemodify.checked = true;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
				form.movelevel.value = item.move;
				Twinkle.protect.formevents.movelevel({ target: form.movelevel });
				form.moveexpiry.value = '2 days';
			} else {
				form.movemodify.checked = false;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
			}

			if (item.stabilize) {
				form.pcmodify.checked = true;
				Twinkle.protect.formevents.pcmodify({ target: form.pcmodify });
				form.pclevel.value = item.stabilize;
				Twinkle.protect.formevents.pclevel({ target: form.pclevel });
			} else if (form.pcmodify) {
				form.pcmodify.checked = false;
				Twinkle.protect.formevents.pcmodify({ target: form.pcmodify });
			}
		} else {
			if (item.create) {
				form.createlevel.value = item.create;
				Twinkle.protect.formevents.createlevel({ target: form.createlevel });
			}
		}

		var reasonField = (actiontype === "protect" ? form.protectReason : form.reason);
		if (item.reason) {
			reasonField.value = item.reason;
		} else {
			reasonField.value = '';
		}

		// sort out tagging options, disabled if nonexistent or lua
		if (mw.config.get('wgArticleId') && mw.config.get('wgPageContentModel') !== 'Scribunto') {
			if( form.category.value === 'unprotect' ) {
				form.tagtype.value = 'none';
			} else {
				form.tagtype.value = (item.template ? item.template : form.category.value);
			}
			Twinkle.protect.formevents.tagtype({ target: form.tagtype });

			if( /template/.test( form.category.value ) ) {
				form.noinclude.checked = true;
				form.editexpiry.value = form.moveexpiry.value = form.pcexpiry.value = "indefinite";
			} else if( mw.config.get('wgNamespaceNumber') !== 10 ) {
				form.noinclude.checked = false;
			}
		}

	} else {  // RPP request
		if( form.category.value === 'unprotect' ) {
			form.expiry.value = '';
			form.expiry.disabled = true;
		} else {
			form.expiry.value = '';
			form.expiry.disabled = false;
		}
	}
};

Twinkle.protect.callback.evaluate = function twinkleprotectCallbackEvaluate(e) {
	var form = e.target;

	var actiontypes = form.actiontype;
	var actiontype;
	for( var i = 0; i < actiontypes.length; i++ )
	{
		if( !actiontypes[i].checked ) {
			continue;
		}
		actiontype = actiontypes[i].values;
		break;
	}

	var tagparams;
	if( actiontype === 'tag' || (actiontype === 'protect' && mw.config.get('wgArticleId') && mw.config.get('wgPageContentModel') !== 'Scribunto') ) {
		tagparams = {
			tag: form.tagtype.value,
			reason: ((form.tagtype.value === 'pp-protected' || form.tagtype.value === 'pp-semi-protected' || form.tagtype.value === 'pp-move') && form.protectReason) ? form.protectReason.value : null,
			small: form.small.checked,
			noinclude: form.noinclude.checked
		};
	}

	switch (actiontype) {
		case 'protect':
			// protect the page
			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.notice = "Perlindungan selesai";

			var statusInited = false;
			var thispage;

			var allDone = function twinkleprotectCallbackAllDone() {
				if (thispage) {
					thispage.getStatusElement().info("done");
				}
				if (tagparams) {
					Twinkle.protect.callbacks.taggingPageInitial(tagparams);
				}
			};

			var stabilizeValues = {};
			if (form.pclevel) {
				stabilizeValues = {
					pclevel: form.pclevel.value,
					pcexpiry: form.pcexpiry.value,
					protectReason: form.protectReason.value
				};
			}

			var protectIt = function twinkleprotectCallbackProtectIt(next) {
				thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), "Sedang melindungi...");
				if (mw.config.get('wgArticleId')) {
					if (form.editmodify.checked) {
						thispage.setEditProtection(form.editlevel.value, form.editexpiry.value);
					}
					if (form.movemodify.checked) {
						thispage.setMoveProtection(form.movelevel.value, form.moveexpiry.value);
					}
				} else {
					thispage.setCreateProtection(form.createlevel.value, form.createexpiry.value);
					thispage.setWatchlist(false);
				}

				if (form.protectReason.value) {
					thispage.setEditSummary(form.protectReason.value);
				} else {
					alert("Berikan alasan perlindungan, yang nantinya akan dimasukkan ke log perlindungan.");
					return;
				}

				if (!statusInited) {
					Morebits.simpleWindow.setButtonsEnabled( false );
					Morebits.status.init( form );
					statusInited = true;
				}

				thispage.protect(next);
			};

			var stabilizeIt = function twinkleprotectCallbackStabilizeIt() {
				if (thispage) {
					thispage.getStatusElement().info("done");
				}

				thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), "Menerapkan perlindungan perubahan tertunda");
				thispage.setFlaggedRevs(stabilizeValues.pclevel, stabilizeValues.pcexpiry);

				if (stabilizeValues.protectReason) {
					thispage.setEditSummary(stabilizeValues.protectReason);
				} else {
					alert("Berikan alasan perlindungan, yang nantinya akan dimasukkan ke log perlindungan.");
					return;
				}

				if (!statusInited) {
					Morebits.simpleWindow.setButtonsEnabled(false);
					Morebits.status.init(form);
					statusInited = true;
				}

				thispage.stabilize(allDone);
			};

			if ((form.editmodify && form.editmodify.checked) || (form.movemodify && form.movemodify.checked) ||
				!mw.config.get('wgArticleId')) {
				if (form.pcmodify && form.pcmodify.checked) {
					protectIt(stabilizeIt);
				} else {
					protectIt(allDone);
				}
			} else if (form.pcmodify && form.pcmodify.checked) {
				stabilizeIt();
			} else {
				alert("Berikan tugas kepada Twinkle! \nJika Anda hanya ingin menandai halaman, pilih opsi ¨Tandai halaman dengan templat perlindungan¨ di bagian atas.");
			}

			break;

		case 'tag':
			// apply a protection template

			Morebits.simpleWindow.setButtonsEnabled( false );
			Morebits.status.init( form );

			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.followRedirect = false;
			Morebits.wiki.actionCompleted.notice = "Penandaan selesai";

			Twinkle.protect.callbacks.taggingPageInitial(tagparams);
			break;

		case 'request':
			// file request at RFPP
			var typename, typereason;
			switch( form.category.value ) {
				case 'pp-dispute':
				case 'pp-vandalism':
				case 'pp-usertalk':
				case 'pp-protected':
					typename = 'full protection';
					break;
				case 'pp-template':
					typename = 'template protection';
					break;
				// case 'pp-30-500-arb':
				// case 'pp-30-500-vandalism':
				// case 'pp-30-500-disruptive':
				// case 'pp-30-500-blp':
				// case 'pp-30-500-sock':
				// 	typename = 'extended confirmed';
				// 	break;
				case 'pp-semi-vandalism':
				case 'pp-semi-disruptive':
				case 'pp-semi-unsourced':
				case 'pp-semi-usertalk':
				case 'pp-semi-sock':
				case 'pp-semi-blp':
				case 'pp-semi-protected':
					typename = 'semi-protection';
					break;
				case 'pp-pc-vandalism':
				case 'pp-pc-blp':
				case 'pp-pc-protected':
				case 'pp-pc-unsourced':
				case 'pp-pc-disruptive':
					typename = 'pending changes';
					break;
				case 'pp-move':
				case 'pp-move-dispute':
				case 'pp-move-indef':
				case 'pp-move-vandalism':
					typename = 'move protection';
					break;
				case 'pp-create':
				case 'pp-create-offensive':
				case 'pp-create-blp':
				case 'pp-create-salt':
					typename = 'create protection';
					break;
				case 'unprotect':
					var admins = $.map(Twinkle.protect.currentProtectionLevels, function(pl) { return pl.admin ? 'User:' + pl.admin : null; });
					if (admins.length && !confirm('Have you attempted to contact the protecting admins (' + $.unique(admins).join(', ') + ') first?' )) {
						return false;
					}
					// otherwise falls through
				default:
					typename = 'unprotection';
					break;
			}
			switch (form.category.value) {
				case 'pp-dispute':
					typereason = 'Perang suntingan';
					break;
				case 'pp-vandalism':
				case 'pp-semi-vandalism':
				case 'pp-pc-vandalism':
				// case 'pp-30-500-vandalism':
					typereason = 'Vandalisme berulang-ulang';
					break;
				case 'pp-semi-disruptive':
				case 'pp-pc-disruptive':
				// case 'pp-30-500-disruptive':
					typereason = 'Suntingan tidak berguna berulang-ulang';
					break;
				case 'pp-semi-unsourced':
				case 'pp-pc-unsourced':
					typereason = 'Menambahkan isi yang tidak memiliki sumber';
					break;
				case 'pp-template':
					typereason = 'Templat yang banyak digunakan';
					break;
				// case 'pp-30-500-arb':
				// 	typereason = '[[WP:30/500|Arbitration enforcement]]';
				// 	break;
				case 'pp-usertalk':
				case 'pp-semi-usertalk':
					typereason = 'Penyalahgunaan halaman pembicaraan pengguna yang sedang diblokir';
					break;
				case 'pp-semi-sock':
				// case 'pp-30-500-sock':
					typereason = 'Penggunaan akun boneka berulang-ulang';
					break;
				case 'pp-semi-blp':
				case 'pp-pc-blp':
				// case 'pp-30-500-blp':
					typereason = 'Melanggar kebijakan tokoh yang masih hidup';
					break;
				case 'pp-move-dispute':
					typereason = 'Judul halaman yang dipertentangkan/perang pemindahan halaman';
					break;
				case 'pp-move-vandalism':
					typereason = 'Vandalisme pemindahan halaman';
					break;
				case 'pp-move-indef':
					typereason = 'Halaman yang banyak ditampilkan';
					break;
				case 'pp-create-offensive':
					typereason = 'Nama yang menghasut';
					break;
				case 'pp-create-blp':
					typereason = 'Halaman tokoh yang masih hidup yang baru dihapus';
					break;
				case 'pp-create-salt':
					typereason = 'Pembuatan halaman berulang-ulang dalam waktu dekat';
					break;
				default:
					typereason = '';
					break;
			}

			var reason = typereason;
			if( form.reason.value !== '') {
				if ( typereason !== '' ) {
					reason += "\u00A0\u2013 ";  // U+00A0 NO-BREAK SPACE; U+2013 EN RULE
				}
				reason += form.reason.value;
			}
			if( reason !== '' && reason.charAt( reason.length - 1 ) !== '.' ) {
				reason += '.';
			}

			var rppparams = {
				reason: reason,
				typename: typename,
				category: form.category.value,
				expiry: form.expiry.value
			};

			Morebits.simpleWindow.setButtonsEnabled( false );
			Morebits.status.init( form );

			var rppName = 'Wikipedia:Permintaan perhatian pengurus/Perlindungan';

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = rppName;
			Morebits.wiki.actionCompleted.notice = "Nominasi selesai, membuka halaman diskusi";

			var rppPage = new Morebits.wiki.page( rppName, 'Meminta perlindungan halaman');
			rppPage.setFollowRedirect( true );
			rppPage.setCallbackParameters( rppparams );
			rppPage.load( Twinkle.protect.callbacks.fileRequest );
			break;
		default:
			alert("twinkleprotect: tindakan tidak diketahui");
			break;
	}
};

Twinkle.protect.callbacks = {
	taggingPageInitial: function( tagparams ) {
		if (tagparams.tag === 'noop') {
			Morebits.status.info("Terapkan templat perlindungan", "tidak tahu apa yang mau dilakukan");
			return;
		}

		var protectedPage = new Morebits.wiki.page( mw.config.get('wgPageName'), 'Tandai halaman');
		protectedPage.setCallbackParameters( tagparams );
		protectedPage.load( Twinkle.protect.callbacks.taggingPage );
	},
	taggingPage: function( protectedPage ) {
		var params = protectedPage.getCallbackParameters();
		var text = protectedPage.getPageText();
		var tag, summary;

		var oldtag_re = /\s*(?:<noinclude>)?\s*\{\{\s*(pp-[^{}]*?|protected|(?:t|v|s|p-|usertalk-v|usertalk-s|sb|move)protected(?:2)?|protected template|privacy protection)\s*?\}\}\s*(?:<\/noinclude>)?\s*/gi;
		var re_result = oldtag_re.exec(text);
		if (re_result) {
			if (confirm("{{" + re_result[1] + "}} ditemukan di halaman ini. \nKlik OK untuk menghapusnya, atau Cancel untuk mengabaikan.")) {
				text = text.replace( oldtag_re, '' );
			}
		}

		if ( params.tag !== 'none' ) {
			tag = params.tag;
			if( params.reason ) {
				tag += '|reason=' + params.reason;
			}
			if( params.small ) {
				tag += '|small=yes';
			}
		}

		if( params.tag === 'none' ) {
			summary = 'Menghapus templat perlindungan' + Twinkle.getPref('summaryAd');
		} else {
			if( Morebits.wiki.isPageRedirect() ) {
				//Only tag if no {{rcat shell}} is found
				if (!text.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
					text = text.replace(/#REDIRECT ?(\[\[.*?\]\])(.*)/i, "#REDIRECT $1$2\n\n{{" + tag + "}}");
				} else {
					Morebits.status.info("Redirect category shell present", "nothing to do");
					return;
				}
			} else if( params.noinclude ) {
				text = "<noinclude>{{" + tag + "}}</noinclude>" + text;
			} else {
				text = "{{" + tag + "}}\n" + text;
			}
			summary = "Menambahkan {{" + params.tag + "}}" + Twinkle.getPref('summaryAd');
		}

		protectedPage.setEditSummary( summary );
		protectedPage.setPageText( text );
		protectedPage.setCreateOption( 'nocreate' );
		protectedPage.suppressProtectWarning(); // no need to let admins know they are editing through protection
		protectedPage.save();
	},

	fileRequest: function( rppPage ) {

		var params = rppPage.getCallbackParameters();
		var text = rppPage.getPageText();
		var statusElement = rppPage.getStatusElement();

		var rppRe = new RegExp( '===\\s*(\\[\\[)?\\s*:?\\s*' + RegExp.escape( Morebits.pageNameNorm, true ) + '\\s*(\\]\\])?\\s*===', 'm' );
		var tag = rppRe.exec( text );

		var rppLink = document.createElement('a');
		rppLink.setAttribute('href', mw.util.getUrl(rppPage.getPageName()) );
		rppLink.appendChild(document.createTextNode(rppPage.getPageName()));

		if ( tag ) {
			statusElement.error( [ 'Sudah ada permintaan perlindungan halaman ini di ', rppLink, ', sedang membatalkan permintaan.' ] );
			return;
		}

		var newtag = '=== [[:' + Morebits.pageNameNorm + ']] ===\n';
		if( ( new RegExp( '^' + RegExp.escape( newtag ).replace( /\s+/g, '\\s*' ), 'm' ) ).test( text ) ) {
			statusElement.error( [ 'Sudah ada permintaan perlindungan halaman ini di ', rppLink, ', sedang membatalkan permintaan.' ] );
			return;
		}
		newtag += '* {{pagelinks|1=' + Morebits.pageNameNorm + '}}\n\n';

		var words;
		switch( params.expiry ) {
		case 'temporary':
			words = "Sementara ";
			break;
		case 'indefinite':
			words = "Selamanya ";
			break;
		default:
			words = "";
			break;
		}

		words += params.typename;

		newtag += "'''" + Morebits.string.toUpperCaseFirstChar(words) + ( params.reason !== '' ? ( ":''' " +
			Morebits.string.formatReasonText(params.reason) ) : ".'''" ) + " ~~~~";

		// If either protection type results in a increased status, then post it under increase
		// else we post it under decrease
		var increase = false;
		var protInfo = Twinkle.protect.protectionPresetsInfo[params.category];

		// function to compute protection weights (see comment at Twinkle.protect.protectionWeight)
		var computeWeight = function(mainLevel, stabilizeLevel) {
			var result = Twinkle.protect.protectionWeight[mainLevel || 'all'];
			if (stabilizeLevel) {
				if (result) {
					if (stabilizeLevel.level === "autoconfirmed") {
						result += 2;
					}
				} else {
					result = Twinkle.protect.protectionWeight["flaggedrevs_" + stabilizeLevel];
				}
			}
			return result;
		};

		// compare the page's current protection weights with the protection we are requesting
		var editWeight = computeWeight(Twinkle.protect.currentProtectionLevels.edit &&
			Twinkle.protect.currentProtectionLevels.edit.level,
			Twinkle.protect.currentProtectionLevels.stabilize &&
			Twinkle.protect.currentProtectionLevels.stabilize.level);
		if (computeWeight(protInfo.edit, protInfo.stabilize) > editWeight ||
			computeWeight(protInfo.move) > computeWeight(Twinkle.protect.currentProtectionLevels.move &&
			Twinkle.protect.currentProtectionLevels.move.level) ||
			computeWeight(protInfo.create) > computeWeight(Twinkle.protect.currentProtectionLevels.create &&
			Twinkle.protect.currentProtectionLevels.create.level)) {
			increase = true;
		}

		var reg;
		if ( increase ) {
			reg = /(\n==\s*Current requests for reduction in protection level\s*==)/;
		} else {
			reg = /(\n==\s*Current requests for edits to a protected page\s*==)/;
		}

		var originalTextLength = text.length;
		text = text.replace( reg, "\n" + newtag + "\n$1");
		if (text.length === originalTextLength)
		{
			var linknode = document.createElement('a');
			linknode.setAttribute("href", mw.util.getUrl("Wikipedia:Twinkle/Fixing PPH") );
			linknode.appendChild(document.createTextNode('Bagaimana memperbaiki PPH'));
			statusElement.error( [ 'Tidak menemukan bagian yang sesuai di WP:RPP. Untuk memperbaiki masalah ini, lihat ', linknode, '.' ] );
			return;
		}
		statusElement.status( 'Menambahkan permintaan baru...' );
		rppPage.setEditSummary( "Meminta " + params.typename + (params.typename === "perubahan tertunda" ? ' di [[:' : ' dari [[:') +
			Morebits.pageNameNorm + ']].' + Twinkle.getPref('summaryAd') );
		rppPage.setPageText( text );
		rppPage.setCreateOption( 'recreate' );
		rppPage.save();
	}
};
})(jQuery);


//</nowiki>
