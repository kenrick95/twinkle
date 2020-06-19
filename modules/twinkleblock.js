// <nowiki>


(function($) {

var api = new mw.Api(), relevantUserName;
var menuFormattedNamespaces = $.extend({}, mw.config.get('wgFormattedNamespaces'));
menuFormattedNamespaces[0] = '(Article)';

/*
 ****************************************
 *** twinkleblock.js: Block module
 ****************************************
 * Mode of invocation:     Tab ("Block")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 */

Twinkle.block = function twinkleblock() {
	// should show on Contributions or Block pages, anywhere there's a relevant user
	if (Morebits.userIsSysop && mw.config.get('wgRelevantUserName')) {
		Twinkle.addPortletLink(Twinkle.block.callback, 'Blokir', 'tw-block', 'Blokir pengguna');
	}
};

Twinkle.block.callback = function twinkleblockCallback() {
	if (mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName') &&
			!confirm('Anda akan memblokir diri sendiri. Apakah Anda yakin ingin melanjutkan?')) {
		return;
	}

	Twinkle.block.currentBlockInfo = undefined;
	Twinkle.block.field_block_options = {};
	Twinkle.block.field_template_options = {};

	var Window = new Morebits.simpleWindow(650, 530);
	// need to be verbose about who we're blocking
	Window.setTitle('Blokir atau berikan templat blokir kepada ' + mw.config.get('wgRelevantUserName'));
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Templat pemblokiran', 'Template:Uw-block/doc/Block_templates');
	Window.addFooterLink('Kebijakan pemblokiran', 'WP:BLOCK');
	Window.addFooterLink('Bantuan Twinkle', 'WP:TW/DOC#block');

	var form = new Morebits.quickForm(Twinkle.block.callback.evaluate);
	var actionfield = form.append({
		type: 'field',
		label: 'Type of action'
	});
	actionfield.append({
		type: 'checkbox',
		name: 'actiontype',
		event: Twinkle.block.callback.change_action,
		list: [
			{
				label: 'Blokir pengguna',
				value: 'block',
				tooltip: 'Blokir pengguna dengan opsi yang diberikan. If partial block is unchecked, this will be a sitewide block.',
				checked: true
			},
			{
				label: 'Partial block',
				value: 'partial',
				tooltip: 'Enable partial blocks and partial block templates.',
				checked: Twinkle.getPref('defaultToPartialBlocks')
			},
			{
				label: 'Tempatkan templat blokir ke halaman pembicaraan pengguna',
				value: 'template',
				tooltip: 'Jika pengurus yang memblokir lupa memberikan templat blokir, atau telah memblokirnya tanpa memberikan templat, Anda dapat menggunakan ini untuk memberikan templat blokir yang sesuai. Check the partial block box for partial block templates.',
				checked: true
			}
		]
	});

	form.append({ type: 'field', label: 'Opsi', name: 'field_preset' });
	form.append({ type: 'field', label: 'Opsi templat', name: 'field_template_options' });
	form.append({ type: 'field', label: 'Opsi pemblokiran', name: 'field_block_options' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.root = result;

	Twinkle.block.fetchUserInfo(function() {
		// clean up preset data (defaults, etc.), done exactly once, must be before Twinkle.block.callback.change_action is called
		Twinkle.block.transformBlockPresets();
		if (Twinkle.block.currentBlockInfo) {
			Window.addFooterLink('Unblock this user', 'Special:Unblock/' + mw.config.get('wgRelevantUserName'), true);
		}

		// init the controls after user and block info have been fetched
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.actiontype[0].dispatchEvent(evt);
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
		.then(function(data) {
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
			// Used later to check if block status changed while filling out the form
			Twinkle.block.blockLogId = Twinkle.block.hasBlockLog ? data.query.logevents[0].logid : false;

			if (typeof fn === 'function') {
				return fn();
			}
		}, function(msg) {
			Morebits.status.init($('div[name="currentblock"] span').last()[0]);
			Morebits.status.warn('Galat ketika mencari informasi pengguna', msg);
		});
};

Twinkle.block.callback.saveFieldset = function twinkleblockCallbacksaveFieldset(fieldset) {
	Twinkle.block[$(fieldset).prop('name')] = {};
	$(fieldset).serializeArray().forEach(function(el) {
		// namespaces and pages for partial blocks are overwritten
		// here, but we're handling them elsewhere so that's fine
		Twinkle.block[$(fieldset).prop('name')][el.name] = el.value;
	});
};

Twinkle.block.callback.change_action = function twinkleblockCallbackChangeAction(e) {
	var field_preset, field_template_options, field_block_options, $form = $(e.target.form);
	// Make ifs shorter
	var blockBox = $form.find('[name=actiontype][value=block]').is(':checked');
	var templateBox = $form.find('[name=actiontype][value=template]').is(':checked');
	var partial = $form.find('[name=actiontype][value=partial]');
	var partialBox = partial.is(':checked');
	var blockGroup = partialBox ? Twinkle.block.blockGroupsPartial : Twinkle.block.blockGroups;

	partial.prop('disabled', !blockBox && !templateBox);

	Twinkle.block.callback.saveFieldset($('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($('[name=field_template_options]'));

	if (blockBox) {
		field_preset = new Morebits.quickForm.element({ type: 'field', label: 'Opsi', name: 'field_preset' });
		field_preset.append({
			type: 'select',
			name: 'preset',
			label: 'Pilih salah satu opsi:',
			event: Twinkle.block.callback.change_preset,
			list: Twinkle.block.callback.filtered_block_groups(blockGroup)
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

		if (partialBox) { // Partial block
			field_block_options.append({
				type: 'select',
				multiple: true,
				name: 'pagerestrictions',
				label: 'Specific pages to block from editing',
				value: '',
				tooltip: '10 page max.'
			});
			var ns = field_block_options.append({
				type: 'select',
				multiple: true,
				name: 'namespacerestrictions',
				label: 'Namespace blocks',
				value: '',
				tooltip: 'Block from editing these namespaces.'
			});
			$.each(menuFormattedNamespaces, function(number, name) {
				// Ignore -1: Special; -2: Media; and 2300-2303: Gadget (talk) and Gadget definition (talk)
				if (number >= 0 && number < 830) {
					ns.append({ type: 'option', label: name, value: number });
				}
			});
		}

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
				value: '1',
				tooltip: partialBox ? 'If issuing a partial block, this MUST remain unchecked unless you are also preventing them from editing User talk space' : ''
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
			tooltip: 'Consider adding helpful details to the default message.',
			value: Twinkle.block.field_block_options.reason
		});

		field_block_options.append({
			type: 'div',
			name: 'filerlog_label',
			label: 'See also:',
			style: 'display:inline-block;font-style:normal !important',
			tooltip: 'Insert a "see also" message to indicate whether the filter log or deleted contributions played a role in the decision to block.'
		});
		field_block_options.append({
			type: 'checkbox',
			name: 'filter_see_also',
			event: Twinkle.block.callback.toggle_see_alsos,
			style: 'display:inline-block; margin-right:5px',
			list: [
				{
					label: 'Filter log',
					checked: false,
					value: 'filter log'
				}
			]
		});
		field_block_options.append({
			type: 'checkbox',
			name: 'deleted_see_also',
			event: Twinkle.block.callback.toggle_see_alsos,
			style: 'display:inline-block',
			list: [
				{
					label: 'Deleted contribs',
					checked: false,
					value: 'deleted contribs'
				}
			]
		});

		if (Twinkle.block.currentBlockInfo) {
			field_block_options.append({ type: 'hidden', name: 'reblock', value: '1' });
		}
	}

	if (templateBox) {
		field_template_options = new Morebits.quickForm.element({ type: 'field', label: 'Opsi templat', name: 'field_template_options' });
		field_template_options.append({
			type: 'select',
			name: 'template',
			label: 'Pilih templat halaman pembicaraan:',
			event: Twinkle.block.callback.change_template,
			list: Twinkle.block.callback.filtered_block_groups(blockGroup, true),
			value: Twinkle.block.field_template_options.template
		});
		field_template_options.append({
			type: 'input',
			name: 'article',
			display: 'none',
			label: 'Halaman yang berkaitan',
			value: '',
			tooltip: 'Suatu halaman dapat ditautkan dengan pemberitahuan, yang mungkin yang menjadi sasaran perusakan. Kosongkan jika tidak ada.'
		});

		// Only visible if partial and not blocking
		field_template_options.append({
			type: 'input',
			name: 'area',
			display: 'none',
			label: 'Area blocked from',
			value: '',
			tooltip: 'Optional explanation of the pages or namespaces the user was blocked from editing.'
		});

		if (!blockBox) {
			field_template_options.append({
				type: 'input',
				name: 'template_expiry',
				display: 'none',
				label: 'Periode pemblokiran: ',
				value: '',
				tooltip: 'Periode pemblokiran, seperti 24 jam, dua minggu, dsb.'
			});
		}
		field_template_options.append({
			type: 'input',
			name: 'block_reason',
			label: '"Anda telah diblokir karena ..." ',
			display: 'none',
			tooltip: 'Alasan opsional, untuk mengganti alasan baku dasar. Hanya tersedia untuk templat baku dasar.',
			value: Twinkle.block.field_template_options.block_reason
		});

		if (blockBox) {
			field_template_options.append({
				type: 'checkbox',
				name: 'blank_duration',
				list: [
					{
						label: 'Jangan masukkan jangka waktu pemblokiran dalam templat',
						checked: Twinkle.block.field_template_options.blank_duration,
						tooltip: 'Jangka waktu pemblokiran tidak dimasukkan ke dalam templat, jadi hanya menginformasikan "Anda sudah diblokir dari penyuntingan sementara ini selama..."'
					}
				]
			});
		} else {
			field_template_options.append({
				type: 'checkbox',
				list: [
					{
						label: 'Akses halaman pembicaraan dimatikan',
						name: 'notalk',
						checked: Twinkle.block.field_template_options.notalk,
						tooltip: 'Gunakan opsi ini untuk membuat templat pemblokiran berisi bahwa akses ke halaman pembicaraan pengguna sudah dihapus'
					},
					{
						label: 'User blocked from sending email',
						name: 'noemail_template',
						checked: Twinkle.block.field_template_options.noemail_template,
						tooltip: 'If the area is not provided, make the block template state that the user\'s email access has been removed'
					},
					{
						label: 'User blocked from creating accounts',
						name: 'nocreate_template',
						checked: Twinkle.block.field_template_options.nocreate_template,
						tooltip: 'If the area is not provided, make the block template state that the user\'s ability to create accounts has been removed'
					}
				]
			});
		}

		var $previewlink = $('<a id="twinkleblock-preivew-link">Preview</a>');
		$previewlink.off('click').on('click', function() {
			Twinkle.block.callback.preview($form[0]);
		});
		$previewlink.css({cursor: 'pointer'});
		field_template_options.append({ type: 'div', id: 'blockpreview', label: [ $previewlink[0] ] });
		field_template_options.append({ type: 'div', id: 'twinkleblock-previewbox', style: 'display: none' });
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


		$form.find('[name=pagerestrictions]').select2({
			width: '100%',
			placeholder: 'Select pages to block user from',
			language: {
				errorLoading: function() {
					return 'Incomplete or invalid search term';
				}
			},
			maximumSelectionLength: 10, // Software limitation [[phab:T202776]]
			minimumInputLength: 1, // prevent ajax call when empty
			ajax: {
				url: mw.util.wikiScript('api'),
				dataType: 'json',
				delay: 100,
				data: function(params) {
					var title = mw.Title.newFromText(params.term);
					if (!title) {
						return;
					}
					return {
						'action': 'query',
						'format': 'json',
						'list': 'allpages',
						'apfrom': title.title,
						'apnamespace': title.namespace,
						'aplimit': '10'
					};
				},
				processResults: function(data) {
					return {
						results: data.query.allpages.map(function(page) {
							var title = mw.Title.newFromText(page.title, page.ns).toText();
							return {
								id: title,
								text: title
							};
						})
					};
				}
			},
			templateSelection: function(choice) {
				return $('<a>').text(choice.text).attr({
					href: mw.util.getUrl(choice.text),
					target: '_blank'
				});
			}
		});


		$form.find('[name=namespacerestrictions]').select2({
			width: '100%',
			matcher: Morebits.select2.matchers.wordBeginning,
			language: {
				searching: Morebits.select2.queryInterceptor
			},
			templateResult: Morebits.select2.highlightSearchMatches,
			placeholder: 'Select namespaces to block user from'
		});

		mw.util.addCSS(
			// prevent dropdown from appearing behind the dialog, just in case
			'.select2-container { z-index: 10000; }' +
			// Reduce padding
			'.select2-results .select2-results__option { padding-top: 1px; padding-bottom: 1px; }' +
			// Adjust font size
			'.select2-container .select2-dropdown .select2-results { font-size: 13px; }' +
			'.select2-container .selection .select2-selection__rendered { font-size: 13px; }' +
			// Remove black border
			'.select2-container--default.select2-container--focus .select2-selection--multiple { border: 1px solid #aaa; }' +
			// Make the tiny cross larger
			'.select2-selection__choice__remove { font-size: 130%; }'
		);
	} else {
		$form.find('fieldset[name="field_block_options"]').hide();
		// Clear select2 options
		$form.find('[name=pagerestrictions]').val(null).trigger('change');
		$form.find('[name=namespacerestrictions]').val(null).trigger('change');
	}
	if (field_template_options) {
		oldfield = $form.find('fieldset[name="field_template_options"]')[0];
		oldfield.parentNode.replaceChild(field_template_options.render(), oldfield);
		e.target.form.root.previewer = new Morebits.wiki.preview($(e.target.form.root).find('#twinkleblock-previewbox').last()[0]);
	} else {
		$form.find('fieldset[name="field_template_options"]').hide();
	}

	if (Twinkle.block.hasBlockLog) {
		var $blockloglink = $('<a target="_blank" href="' + mw.util.getUrl('Special:Log', {action: 'view', page: mw.config.get('wgRelevantUserName'), type: 'block'}) + '">block log</a>)');

		Morebits.status.init($('div[name="hasblocklog"] span').last()[0]);
		Morebits.status.warn('Pengguna ini pernah diblokir sebelumnya', $blockloglink[0]);
	}

	if (Twinkle.block.currentBlockInfo) {
		Morebits.status.init($('div[name="currentblock"] span').last()[0]);
		// list=blocks without bkprops (as we do in fetchUerInfo)
		// returns partial: '' if the user is partially blocked
		var statusStr = relevantUserName + ' telah ' + (Twinkle.block.currentBlockInfo.partial === '' ? 'diblokir parsial' : 'diblokir penuh');
		if (Twinkle.block.currentBlockInfo.expiry === 'infinity') {
			statusStr += ' (selamanya)';
		} else if (new Morebits.date(Twinkle.block.currentBlockInfo.expiry).isValid()) {
			statusStr += ' (kedaluwarsa ' + new Morebits.date(Twinkle.block.currentBlockInfo.expiry).calendar('utc') + ')';
		}
		var infoStr = 'Kirim permintaan untuk memblokir ulang dengan opsi yang diberikan';
		if (Twinkle.block.currentBlockInfo.partial === undefined && partialBox) {
			infoStr += ', mengubah ke blokir parsial';
		} else if (Twinkle.block.currentBlockInfo.partial === '' && !partialBox) {
			infoStr += ', mengubah ke blokir penuh';
		}
		Morebits.status.warn(statusStr, infoStr);
		Twinkle.block.callback.update_form(e, Twinkle.block.currentBlockInfo);
	}
	if (templateBox) {
		// make sure all the fields are correct based on defaults
		if (blockBox) {
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
 *   expiry: <string - expiry timestamp, can include relative times like "5 months", "2 weeks" etc>
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
	'anonblock': {
		expiry: '31 hours',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{anonblock}}',
		sig: '~~~~'
	},
	'anonblock - school': {
		expiry: '36 hours',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{anonblock}} <!-- Likely a school based on behavioral evidence -->',
		templateName: 'anonblock',
		sig: '~~~~'
	},
	'blocked proxy': {
		expiry: '1 year',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		hardblock: true,
		reason: '{{blocked proxy}}',
		sig: null
	},
	'CheckUser block': {
		expiry: '1 week',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{CheckUser block}}',
		sig: '~~~~'
	},
	'checkuserblock-account': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{checkuserblock-account}}',
		sig: '~~~~'
	},
	'checkuserblock-wide': {
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{checkuserblock-wide}}',
		sig: '~~~~'
	},
	'colocationwebhost': {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{colocationwebhost}}',
		sig: null
	},
	'oversightblock': {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		nonstandard: true,
		reason: '{{OversightBlock}}',
		sig: '~~~~'
	},
	'school block': {
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{school block}}',
		sig: '~~~~'
	},
	'spamblacklistblock': {
		forAnonOnly: true,
		expiry: '1 month',
		disabletalk: true,
		nocreate: true,
		reason: '{{spamblacklistblock}} <!-- editor only attempts to add blacklisted links, see [[Special:Log/spamblacklist]] -->'
	},
	// Placeholder for when we add support for rangeblocks
	// 'rangeblock' : {
	//   reason: '{{rangeblock}}',
	//   nocreate: true,
	//   nonstandard: true,
	//   forAnonOnly: true,
	//   sig: '~~~~'
	// },
	'tor': {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{Tor}}',
		sig: null
	},
	'webhostblock': {
		expiry: '1 year',
		forAnonOnly: true,
		nonstandard: true,
		reason: '{{webhostblock}}',
		sig: null
	},
	// uw-prefixed
	'uw-3block': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: 'Melanggar pengembalian tiga kali berturut-turut',
		summary: 'Anda diblokir karena melanggar kebijakan [[WP:3RR|pengembalian tiga kali berturut-turut]]'
	},
	'uw-ablock': {
		autoblock: true,
		expiry: '31 hours',
		forAnonOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Alamat IP Anda diblokir dari hak penyuntingan',
		suppressArticleInSummary: true
	},
	'uw-adblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Menggunakan Wikipedia untuk mengirimkan spam atau beriklan',
		summary: 'Anda diblokir karena mengirimkan spam atau beriklan di Wikipedia'
	},
	'uw-aeblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Penegakan kebijakan arbitrase',
		reasonParam: true,
		summary: 'Anda diblokir karena suntingan Anda melanggar kebijakan arbitrase'
	},
	'uw-bioblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Melanggar kebijakan penulisan biografi tokoh yang masih hidup',
		summary: 'Anda diblokir karena melanggar kebijakan penulisan biografi tokoh yang masih hidup'
	},
	'uw-block': {
		autoblock: true,
		expiry: '24 hours',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Anda telah diblokir dari hak penyuntingan',
		suppressArticleInSummary: true
	},
	'uw-blockindef': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reasonParam: true,
		summary: 'Anda telah diblokir selamanya dari hak penyuntingan',
		suppressArticleInSummary: true
	},
	'uw-blocknotalk': {
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
	'uw-causeblock': {
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
	'uw-copyrightblock': {
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
	'uw-disruptblock': {
		autoblock: true,
		nocreate: true,
		reason: 'Suntingan yang mengganggu',
		summary: 'Anda diblokir karena melakukan penyuntingan yang mengganggu/mengacau'
	},
	'uw-efblock': {
		autoblock: true,
		nocreate: true,
		reason: 'Memicu filter suntingan secara sengaja',
		summary: 'Anda diblokir karena memicu filter suntingan dengan sengaja'
	},
	'uw-ewblock': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: true,
		pageParam: true,
		reason: 'Perang suntingan',
		summary: 'Anda diblokir untuk mencegah perang suntingan dengan pengguna lain yang disebabkan oleh suntingan mengganggu Anda'
	},
	'uw-hblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Serangan atau olokan terhadap subjek lain',
		summary: 'Anda diblokir karena mencoba menyerang pengguna/subjek lain'
	},
	'uw-ipevadeblock': {
		forAnonOnly: true,
		nocreate: true,
		reason: 'Menghindari pemblokiran',
		summary: 'Alamat IP Anda diblokir karena digunakan untuk menhindari pemblokiran'
	},
	'uw-lblock': {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		reason: 'Membuat ancaman hukum',
		summary: 'Anda diblokir karena mencoba membuat ancaman hukum'
	},
	'uw-nothereblock': {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		reason: 'Jelas-jelas tidak bermaksud mengembangkan Wikipedia',
		forRegisteredOnly: true,
		summary: 'Anda diblokir karena dianggap tidak akan mengembangkan Wikipedia'
	},
	'uw-npblock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Membuat halaman tanpa isi',
		summary: 'Anda diblokir karena membuat halaman tanpa isi yang bermakna'
	},
	'uw-pablock': {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		reason: 'Serangan atau olokan terhadap subjek lain',
		summary: 'Anda diblokir karena menyerang pengguna/subjek lainnya'
	},
	'uw-sblock': {
		autoblock: true,
		nocreate: true,
		reason: 'Menggunakan Wikipedia untuk menyebarkan spam',
		summary: 'Anda diblokir karena mengirimkan spam atau beriklan'
	},
	'uw-soablock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: 'Akun spam, promosi, dan iklan',
		summary: 'Anda diblokir karena menggunakan akun untuk mengirimkan iklan, spam, dan promosi'
	},
	'uw-socialmediablock': {
		autoblock: true,
		nocreate: true,
		pageParam: true,
		reason: 'Using Wikipedia as a [[WP:NOTMYSPACE|blog, web host, social networking site or forum]]',
		summary: 'You have been blocked from editing for using user and/or article pages as a [[WP:NOTMYSPACE|blog, web host, social networking site or forum]]'
	},
	'uw-sockblock': {
		autoblock: true,
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Menyalahgunakan beberapa akun',
		summary: 'Anda diblokir karena menyalahgunakan beberapa akun'
	},
	'uw-softerblock': {
		expiry: 'infinity',
		forRegisteredOnly: true,
		reason: 'Nama pengguna untuk promosi (pemblokiran lunak)',
		summary: 'Anda diblokir selamanya karena akun Anda dianggap mewakili sebuah kelompok, organisasi, atau situs web'
	},
	'uw-spamublock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Nama pengguna untuk promosi, suntingan iklan',
		summary: 'Anda diblokir selamanya karena akun ini digunakan untuk beriklan dan melanggar kebijakan nama pengguna'
	},
	'uw-spoablock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Akun boneka',
		summary: 'Anda diblokir karena menggunakan akun boneka'
	},
	'uw-talkrevoked': {
		disabletalk: true,
		reason: 'Mencabut akses halaman pembicaraan: menyalahgunakan halaman pembicaraan selama diblokir',
		prependReason: true,
		summary: 'Halaman pembicaraan pengguna Anda dimatikan',
		useInitialOptions: true
	},
	'uw-ublock': {
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
	'uw-ucblock': {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		pageParam: true,
		reason: 'Persistent addition of [[WP:INTREF|unsourced content]]',
		summary: 'You have been blocked from editing for persistent addition of [[WP:INTREF|unsourced content]]'
	},
	'uw-uhblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		reason: 'Nama pengguna dilarang (pemblokiran rumit)',
		reasonParam: true,
		summary: 'Anda diblokir selamanya karena menggunakan nama pengguna yang dilarang'
	},
	'uw-ublock-wellknown': {
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
	'uw-upeblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: '[[WP:PAID|Undisclosed paid editing]] in violation of the WMF [[WP:TOU|Terms of Use]]',
		summary: 'You have been indefinitely blocked from editing because your account is being used in violation of [[WP:PAID|Wikipedia policy on undisclosed paid advocacy]]'
	},
	'uw-vaublock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: 'Nama pengguna dilarang, akun vandalisme semata-mata',
		summary: 'Anda diblokir selamanya karena melakukan vandalisme semata-mata dan menggunakan nama pengguna yang dilarang'
	},
	'uw-vblock': {
		autoblock: true,
		expiry: '31 hours',
		nocreate: true,
		pageParam: true,
		reason: 'Melakukan vandalisme',
		summary: 'Anda diblokir karena melakukan [[WP:VANDAL|vandalisme]] terus-terusan'
	},
	'uw-voablock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: true,
		reason: 'Akun vandalisme semata-mata',
		summary: 'Anda diblokir selamanya karena semata-mata melakukan [[WP:VANDAL|vandalisme]]'
	},
	'zombie proxy': {
		expiry: '1 month',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{zombie proxy}}',
		sig: null
	},

	// Begin partial block templates, accessed in Twinkle.block.blockGroupsPartial
	'uw-acpblock': {
		autoblock: true,
		expiry: '48 hours',
		nocreate: true,
		pageParam: false,
		reasonParam: true,
		reason: 'Misusing [[WP:Sock puppetry|multiple accounts]]',
		summary: 'You have been [[WP:PB|blocked]] from creating accounts for misusing [[WP:SOCK|multiple accounts]]'
	},
	'uw-acpblockindef': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		pageParam: false,
		reasonParam: true,
		reason: 'Misusing [[WP:Sock puppetry|multiple accounts]]',
		summary: 'You have been indefinitely [[WP:PB|blocked]] from creating accounts for misusing [[WP:SOCK|multiple accounts]]'
	},
	'uw-aepblock': {
		autoblock: true,
		nocreate: false,
		pageParam: false,
		reason: '[[WP:Arbitration enforcement|Arbitration enforcement]]',
		reasonParam: true,
		summary: 'You have been [[WP:PB|blocked]] from editing for violating an [[WP:Arbitration|arbitration decision]]'
	},
	'uw-epblock': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: false,
		noemail: true,
		pageParam: false,
		reasonParam: true,
		reason: 'Email [[WP:Harassment|harassment]]',
		summary: 'You have been [[WP:PB|blocked]] from emailing other editors for [[WP:Harassment|harassment]]'
	},
	'uw-ewpblock': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: false,
		pageParam: false,
		reasonParam: true,
		reason: '[[WP:Edit warring|Edit warring]]',
		summary: 'You have been [[WP:PB|blocked]] from editing certain areas of the encyclopedia to prevent further [[WP:DE|disruption]] due to [[WP:EW|edit warring]]'
	},
	'uw-pblock': {
		autoblock: true,
		expiry: '24 hours',
		nocreate: false,
		pageParam: false,
		reasonParam: true,
		summary: 'You have been [[WP:PB|partially blocked]] from certain areas of the encyclopedia'
	},
	'uw-pblockindef': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: false,
		pageParam: false,
		reasonParam: true,
		summary: 'You have been indefinitely [[WP:PB|partially blocked]] from certain areas of the encyclopedia'
	}
};

Twinkle.block.transformBlockPresets = function twinkleblockTransformBlockPresets() {
	// supply sensible defaults
	$.each(Twinkle.block.blockPresetsInfo, function(preset, settings) {
		settings.summary = settings.summary || settings.reason;
		settings.sig = settings.sig !== undefined ? settings.sig : 'yes';
		// despite this it's preferred that you use 'infinity' as the value for expiry
		settings.indefinite = settings.indefinite || settings.expiry === 'infinity' || settings.expiry === 'infinite' || settings.expiry === 'indefinite' || settings.expiry === 'never';

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
			{ label: 'blokir anon', value: 'anonblock' },
			{ label: 'blokir anon - kemungkinan besar sekolah', value: 'anonblock - school' },
			{ label: 'blokir sekolah', value: 'school block' },
			{ label: 'Blokir umum (alasan tertentu)', value: 'uw-block' }, // ends up being default for registered users
			{ label: 'Blokir umum (alasan tertentu) - IP', value: 'uw-ablock', selected: true }, // set only when blocking IP
			{ label: 'Blokir umum (alasan tertentu) - selamanya', value: 'uw-blockindef' },
			{ label: 'Suntingan mengganggu', value: 'uw-disruptblock' },
			{ label: 'Penyalahgunaan halaman pembicaraan pengguna selama diblokir', value: 'uw-talkrevoked' },
			{ label: 'Tidak ingin mengembangkan ensiklopedia', value: 'uw-nothereblock' },
			{ label: 'Isi tanpa sumber', value: 'uw-ucblock' },
			{ label: 'Vandalisme', value: 'uw-vblock' },
			{ label: 'Akun vandalisme semata-mata', value: 'uw-voablock' }
		]
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
			{ label: 'Jejaring sosial', value: 'uw-socialmediablock' },
			{ label: 'Spam', value: 'uw-sblock' },
			{ label: 'Akun spam/iklan semata-mata', value: 'uw-soablock' },
			{ label: 'Bot yang belum disetujui', value: 'uw-botblock' },
			{ label: 'Undisclosed paid editing', value: 'uw-upeblock' },
			{ label: 'Melanggar tiga kali pengembalian', value: 'uw-3block' }
		]
	},
	{
		label: 'Pelanggaran nama pengguna',
		list: [
			{ label: 'Nama pengguna bot', value: 'uw-botublock' },
			{ label: 'Nama pengguna promosi, pemblokiran rumit', value: 'uw-spamublock' },
			{ label: 'Nama pengguna promosi, pemblokiran lunak', value: 'uw-softerblock' },
			{ label: 'Nama pengguna yang mirip, pemblokiran lunak', value: 'uw-ublock-double' },
			{ label: 'Pelanggaran nama pengguna, pemblokiran lunak', value: 'uw-ublock' },
			{ label: 'Pelanggaran nama pengguna, pemblokiran rumit', value: 'uw-uhblock' },
			{ label: 'Nama pengguna meniru-niru, pemblokiran rumit', value: 'uw-uhblock-double' },
			{ label: 'Nama pengguna yang mewakili tokoh terkenal, pemblokiran lunak', value: 'uw-ublock-wellknown' },
			{ label: 'Nama pengguna yang mewakili organisasi nirlaba, pemblokiran lunak', value: 'uw-causeblock' },
			{ label: 'Pelanggaran nama pengguna, vandalism-only account', value: 'uw-vaublock' }
		]
	},
	{
		label: 'Alasan bertemplat',
		list: [
			{ label: 'proksi yang diblokir', value: 'blocked proxy' },
			{ label: 'pemblokiran oleh Pemeriksa', value: 'CheckUser block', disabled: !Morebits.userIsInGroup('checkuser') },
			{ label: 'checkuserblock-account', value: 'checkuserblock-account', disabled: !Morebits.userIsInGroup('checkuser') },
			{ label: 'checkuserblock-wide', value: 'checkuserblock-wide', disabled: !Morebits.userIsInGroup('checkuser') },
			{ label: 'colocationwebhost', value: 'colocationwebhost' },
			{ label: 'oversightblock', value: 'oversightblock', disabled: !Morebits.userIsInGroup('oversight') },
			// { label: 'rangeblock', value: 'rangeblock' }, // placeholder for when we add support for rangeblocks
			{ label: 'spamblacklistblock', value: 'spamblacklistblock' },
			{ label: 'tor', value: 'tor' },
			{ label: 'webhostblock', value: 'webhostblock' },
			{ label: 'zombie proxy', value: 'zombie proxy' }
		]
	}
];

Twinkle.block.blockGroupsPartial = [
	{
		label: 'Common partial block reasons',
		list: [
			{ label: 'Generic partial block (custom reason)', value: 'uw-pblock', selected: true },
			{ label: 'Generic partial block (custom reason) - indefinite', value: 'uw-pblockindef' },
			{ label: 'Edit warring', value: 'uw-ewpblock' }
		]
	},
	{
		label: 'Extended partial block reasons',
		list: [
			{ label: 'Arbitration enforcement', value: 'uw-aepblock' },
			{ label: 'Email harassment', value: 'uw-epblock' },
			{ label: 'Misusing multiple accounts', value: 'uw-acpblock' },
			{ label: 'Misusing multiple accounts - indefinite', value: 'uw-acpblockindef' }
		]
	}
];


Twinkle.block.callback.filtered_block_groups = function twinkleblockCallbackFilteredBlockGroups(group, show_template) {
	return $.map(group, function(blockGroup) {
		var list = $.map(blockGroup.list, function(blockPreset) {
			// only show uw-talkrevoked if reblocking
			if (!Twinkle.block.currentBlockInfo && blockPreset.value === 'uw-talkrevoked') {
				return;
			}

			var blockSettings = Twinkle.block.blockPresetsInfo[blockPreset.value];
			var registrationRestrict = blockSettings.forRegisteredOnly ? Twinkle.block.isRegistered : blockSettings.forAnonOnly ? !Twinkle.block.isRegistered : true;
			if (!(blockSettings.templateName && show_template) && registrationRestrict) {
				var templateName = blockSettings.templateName || blockPreset.value;
				return {
					label: (show_template ? '{{' + templateName + '}}: ' : '') + blockPreset.label,
					value: blockPreset.value,
					data: [{
						name: 'template-name',
						value: templateName
					}],
					selected: !!blockPreset.selected,
					disabled: !!blockPreset.disabled
				};
			}
		});
		if (list.length) {
			return {
				label: blockGroup.label,
				list: list
			};
		}
	});
};

Twinkle.block.callback.change_preset = function twinkleblockCallbackChangePreset(e) {
	var key = e.target.form.preset.value;
	if (!key) {
		return;
	}

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

Twinkle.block.seeAlsos = [];
Twinkle.block.callback.toggle_see_alsos = function twinkleblockCallbackToggleSeeAlso() {
	var reason = this.form.reason.value.replace(
		new RegExp('( <!--|;) ' + 'see also ' + Twinkle.block.seeAlsos.join(' and ') + '( -->)?'), ''
	);

	Twinkle.block.seeAlsos = Twinkle.block.seeAlsos.filter(function(el) {
		return el !== this.value;
	}.bind(this));

	if (this.checked) {
		Twinkle.block.seeAlsos.push(this.value);
	}
	var seeAlsoMessage = Twinkle.block.seeAlsos.join(' and ');

	if (!Twinkle.block.seeAlsos.length) {
		this.form.reason.value = reason;
	} else if (reason.indexOf('{{') !== -1) {
		this.form.reason.value = reason + ' <!-- see also ' + seeAlsoMessage + ' -->';
	} else {
		this.form.reason.value = reason + '; see also ' + seeAlsoMessage;
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
	if (Twinkle.block.isRegistered && relevantUserName.search(/bot\b/i) > 0) {
		data.autoblock = false;
	}

	$(form.field_block_options).find(':checkbox').each(function(i, el) {
		// don't override original options if useInitialOptions is set
		if (data.useInitialOptions && data[el.name] === undefined) {
			return;
		}

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
		} else if (form.template_expiry.parentNode.style.display === 'none') {
			if (Twinkle.block.prev_template_expiry !== null) {
				form.template_expiry.value = Twinkle.block.prev_template_expiry;
				Twinkle.block.prev_template_expiry = null;
			}
			form.template_expiry.parentNode.style.display = 'block';
		}
		if (Twinkle.block.prev_template_expiry) {
			form.expiry.value = Twinkle.block.prev_template_expiry;
		}
		Morebits.quickForm.setElementVisibility(form.notalk.parentNode, !settings.nonstandard);
		Morebits.quickForm.setElementVisibility(form.noemail_template.parentNode, $(form).find('[name=actiontype][value=partial]').is(':checked') && !$(form).find('[name=actiontype][value=block]').is(':checked'));
		Morebits.quickForm.setElementVisibility(form.nocreate_template.parentNode, $(form).find('[name=actiontype][value=partial]').is(':checked') && !$(form).find('[name=actiontype][value=block]').is(':checked'));
	} else {
		Morebits.quickForm.setElementVisibility(
			form.blank_duration.parentNode,
			!settings.indefinite && !settings.nonstandard
		);
	}
	Morebits.quickForm.setElementVisibility(form.article.parentNode, !!settings.pageParam);
	Morebits.quickForm.setElementVisibility(form.block_reason.parentNode, !!settings.reasonParam);

	// Partial block
	Morebits.quickForm.setElementVisibility(form.area.parentNode, $(form).find('[name=actiontype][value=partial]').is(':checked') && !$(form).find('[name=actiontype][value=block]').is(':checked'));

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
		indefinite: (/indef|infinit|never|\*|max/).test(form.template_expiry ? form.template_expiry.value : form.expiry.value),
		reason: form.block_reason.value,
		template: form.template.value,
		partial: $(form).find('[name=actiontype][value=partial]').is(':checked'),
		pagerestrictions: $(form.pagerestrictions).val() || [],
		namespacerestrictions: $(form.namespacerestrictions).val() || [],
		noemail: form.noemail.checked || (form.noemail_template ? form.noemail_template.checked : false),
		nocreate: form.nocreate.checked || (form.nocreate_template ? form.nocreate_template.checked : false),
		area: form.area.value
	};

	var templateText = Twinkle.block.callback.getBlockNoticeWikitext(params);

	form.previewer.beginRender(templateText, 'User_talk:' + mw.config.get('wgRelevantUserName')); // Force wikitext/correct username
};

Twinkle.block.callback.evaluate = function twinkleblockCallbackEvaluate(e) {
	var $form = $(e.target),
		toBlock = $form.find('[name=actiontype][value=block]').is(':checked'),
		toWarn = $form.find('[name=actiontype][value=template]').is(':checked'),
		toPartial = $form.find('[name=actiontype][value=partial]').is(':checked'),
		blockoptions = {}, templateoptions = {};

	Twinkle.block.callback.saveFieldset($form.find('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($form.find('[name=field_template_options]'));

	blockoptions = Twinkle.block.field_block_options;

	templateoptions = Twinkle.block.field_template_options;
	templateoptions.disabletalk = !!(templateoptions.disabletalk || blockoptions.disabletalk);
	templateoptions.hardblock = !!blockoptions.hardblock;
	delete blockoptions.expiry_preset; // remove extraneous

	// Partial API requires this to be gone, not false or 0
	if (toPartial) {
		blockoptions.partial = templateoptions.partial = true;
	}
	templateoptions.pagerestrictions = $form.find('[name=pagerestrictions]').val() || [];
	templateoptions.namespacerestrictions = $form.find('[name=namespacerestrictions]').val() || [];
	// Format for API here rather than in saveFieldset
	blockoptions.pagerestrictions = templateoptions.pagerestrictions.join('|');
	blockoptions.namespacerestrictions = templateoptions.namespacerestrictions.join('|');

	// use block settings as warn options where not supplied
	templateoptions.summary = templateoptions.summary || blockoptions.reason;
	templateoptions.expiry = templateoptions.template_expiry || blockoptions.expiry;

	if (toBlock) {
		if (blockoptions.partial) {
			if (blockoptions.disabletalk && blockoptions.namespacerestrictions.indexOf('3') === -1) {
				return alert('Partial blocks cannot prevent talk page access unless also restricting them from editing User talk space!');
			}
			if (!blockoptions.namespacerestrictions && !blockoptions.pagerestrictions) {
				if (!blockoptions.noemail && !blockoptions.nocreate) { // Blank entries technically allowed [[phab:T208645]]
					return alert('No pages or namespaces were selected, nor were email or account creation restrictions applied; please select at least one option to apply a partial block!');
				} else if (!confirm('You are about to block with no restrictions on page or namespace editing, are you sure you want to proceed?')) {
					return;
				}
			}
		}
		if (!blockoptions.expiry) {
			return alert('Berikan waktu kedaluwarsa pemblokiran!');
		}
		if (!blockoptions.reason) {
			return alert('Berikan alasan pemblokiran!');
		}

		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(e.target);
		var statusElement = new Morebits.status('Menjalankan pemblokiran');
		blockoptions.action = 'block';
		blockoptions.user = mw.config.get('wgRelevantUserName');

		// boolean-flipped options
		blockoptions.anononly = blockoptions.hardblock ? undefined : true;
		blockoptions.allowusertalk = blockoptions.disabletalk ? undefined : true;

		/*
		  Check if block status changed while processing the form.

		  There's a lot to consider here. list=blocks provides the
		  current block status, but there are at least two issues with
		  relying on it. First, the id doesn't update on a reblock,
		  meaning the individual parameters need to be compared. This
		  can be done roughly with JSON.stringify - we can thankfully
		  rely on order from the server, although sorting would be
		  fine if not - but falsey values are problematic and is
		  non-ideal. More importantly, list=blocks won't indicate if a
		  non-blocked user is blocked then unblocked. This should be
		  exceedingy rare, but regardless, we thus need to check
		  list=logevents, which has a nicely updating logid
		  parameter. We can't rely just on that, though, since it
		  doesn't account for blocks that have expired on their own.

		  As such, we use both. Using some ternaries, the logid
		  variables are false if there's no logevents, so if they
		  aren't equal we defintely have a changed entry (send
		  confirmation). If they are equal, then either the user was
		  never blocked (the block statuses will be equal, no
		  confirmation) or there's no new block, in which case either
		  a block expired (different statuses, confirmation) or the
		  same block is still active (same status, no confirmation).
		*/
		api.get({
			format: 'json',
			action: 'query',
			list: 'blocks|logevents',
			letype: 'block',
			lelimit: 1,
			letitle: 'User:' + blockoptions.user,
			bkusers: blockoptions.user
		}).then(function(data) {
			var block = data.query.blocks[0];
			var logevents = data.query.logevents[0];
			var logid = data.query.logevents.length ? logevents.logid : false;

			if (logid !== Twinkle.block.blockLogId || !!block !== !!Twinkle.block.currentBlockInfo) {
				var message = 'The block status of ' + mw.config.get('wgRelevantUserName') + ' has changed. ';
				if (block) {
					message += 'New status: ';
				} else {
					message += 'Last entry: ';
				}

				var logExpiry = '';
				if (logevents.params.duration) {
					if (logevents.params.duration === 'infinity') {
						logExpiry = 'indefinitely';
					} else {
						var expiryDate = new Morebits.date(logevents.params.expiry);
						logExpiry += (expiryDate.isBefore(new Date()) ? ', expired ' : ' until ') + expiryDate.calendar();
					}
				} else { // no duration, action=unblock, just show timestamp
					logExpiry = ' ' + new Morebits.date(logevents.timestamp).calendar();
				}
				message += Morebits.string.toUpperCaseFirstChar(logevents.action) + 'ed by ' + logevents.user + logExpiry +
					' for "' + logevents.comment + '". Do you want to override with your settings?';

				if (!confirm(message)) {
					Morebits.status.info('Executing block', 'Canceled by user');
					return;
				}
				blockoptions.reblock = 1; // Writing over a block will fail otherwise
			}
			// execute block
			blockoptions.token = mw.user.tokens.get('csrfToken');
			var mbApi = new Morebits.wiki.api('Executing block', blockoptions, function() {
				statusElement.info('Selesai');
				if (toWarn) {
					Twinkle.block.callback.issue_template(templateoptions);
				}
			});
			mbApi.post();
		});
	} else if (toWarn) {
		Morebits.simpleWindow.setButtonsEnabled(false);

		Morebits.status.init(e.target);
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
		disabletalk: Twinkle.block.field_template_options.notalk,
		noemail: Twinkle.block.field_template_options.noemail_template,
		nocreate: Twinkle.block.field_template_options.nocreate_template
	});

	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = 'Tindakan selesai, memuat ulang halaman pembicaraan dalam beberapa detik';

	var wikipedia_page = new Morebits.wiki.page(userTalkPage, 'Mengubah halaman pembicaraan pengguna');
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.setFollowRedirect(true);
	wikipedia_page.load(Twinkle.block.callback.main);
};

Twinkle.block.callback.getBlockNoticeWikitext = function(params) {
	var text = '{{', settings = Twinkle.block.blockPresetsInfo[params.template];
	if (!settings.nonstandard) {
		text += 'subst:' + params.template;
		if (params.article && settings.pageParam) {
			text += '|page=' + params.article;
		}

		if (!/te?mp|^\s*$|min/.exec(params.expiry)) {
			if (params.indefinite) {
				text += '|indef=yes';
			} else if (!params.blank_duration) {
				text += '|time=' + params.expiry;
			}
		}

		if (!Twinkle.block.isRegistered && !params.hardblock) {
			text += '|anon=yes';
		}

		if (params.reason) {
			text += '|reason=' + params.reason;
		}
		if (params.disabletalk) {
			text += '|notalk=yes';
		}

		// Currently, all partial block templates are "standard"
		// Building the template, however, takes a fair bit of logic
		if (params.partial) {
			if (params.pagerestrictions.length || params.namespacerestrictions.length) {
				var makeSentence = function (array) {
					if (array.length < 3) {
						return array.join(' and ');
					}
					var last = array.pop();
					return array.join(', ') + ', and ' + last;

				};
				text += '|area=' + (params.indefinite ? 'certain ' : 'from certain ');
				if (params.pagerestrictions.length) {
					text += 'pages (' + makeSentence(params.pagerestrictions.map(function(p) {
						return '[[:' + p + ']]';
					}));
					text += params.namespacerestrictions.length ? ') and certain ' : ')';
				}
				if (params.namespacerestrictions.length) {
					// 1 => Talk, 2 => User, etc.
					var namespaceNames = params.namespacerestrictions.map(function(id) {
						return menuFormattedNamespaces[id];
					});
					text += '[[Wikipedia:Namespace|namespaces]] (' + makeSentence(namespaceNames) + ')';
				}
			} else if (params.area) {
				text += '|area=' + params.area;
			} else {
				if (params.noemail) {
					text += '|email=yes';
				}
				if (params.nocreate) {
					text += '|accountcreate=yes';
				}
			}
		}
	} else {
		text += params.template;
	}

	if (settings.sig) {
		text += '|sig=' + settings.sig;
	}
	return text + '}}';
};

Twinkle.block.callback.main = function twinkleblockcallbackMain(pageobj) {
	var text = pageobj.getPageText(),
		params = pageobj.getCallbackParameters(),
		messageData = params.messageData,
		date = new Morebits.date(pageobj.getLoadTime());

	var dateHeaderRegex = date.monthHeaderRegex(), dateHeaderRegexLast, dateHeaderRegexResult;
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

	params.indefinite = (/indef|infinit|never|\*|max/).test(params.expiry);

	if (Twinkle.getPref('blankTalkpageOnIndefBlock') && params.template !== 'uw-lblock' && params.indefinite) {
		Morebits.status.info('Info', 'Menghapus isi halaman pembicaraan berdasarkan preferensi dan membuat bagian tingkat 2 untuk tanggal');
		text = date.monthHeader() + '\n';
	} else if (!dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex) {
		Morebits.status.info('Info', 'Akan membuat bagian tingkat 2 baru untuk tanggal, karena subbagian bulan ini tidak tersedia');
		text += date.monthHeader() + '\n';
	}

	params.expiry = typeof params.template_expiry !== 'undefined' ? params.template_expiry : params.expiry;

	text += Twinkle.block.callback.getBlockNoticeWikitext(params);

	// build the edit summary
	var summary = messageData.summary;
	if (messageData.suppressArticleInSummary !== true && params.article) {
		summary += ' di [[:' + params.article + ']]';
	}
	summary += '.' + Twinkle.getPref('summaryAd');

	pageobj.setPageText(text);
	pageobj.setEditSummary(summary);
	pageobj.setWatchlist(Twinkle.getPref('watchWarnings'));
	pageobj.save();
};

})(jQuery);


// </nowiki>
