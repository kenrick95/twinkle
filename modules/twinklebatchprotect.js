// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklebatchprotect.js: Batch protect module (sysops only)
 ****************************************
 * Mode of invocation:     Tab ("P-batch")
 * Active on:              Existing project pages and user pages; existing and
 *                         non-existing categories; Special:PrefixIndex
 */


Twinkle.batchprotect = function twinklebatchprotect() {
	if (Morebits.userIsSysop && ((mw.config.get('wgArticleId') > 0 && (mw.config.get('wgNamespaceNumber') === 2 ||
		mw.config.get('wgNamespaceNumber') === 4)) || mw.config.get('wgNamespaceNumber') === 14 ||
		mw.config.get('wgCanonicalSpecialPageName') === 'Prefixindex')) {
		Twinkle.addPortletLink(Twinkle.batchprotect.callback, 'P-batch', 'tw-pbatch', 'Lindungi halaman yang tertaut pada halaman ini');
	}
};

Twinkle.batchprotect.unlinkCache = {};
Twinkle.batchprotect.callback = function twinklebatchprotectCallback() {
	var Window = new Morebits.simpleWindow(600, 400);
	Window.setTitle('Perlindungan massal');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Kebijakan perlindungan', 'WP:PROT');
	Window.addFooterLink('Bantuan Twinkle', 'WP:TW/DOC#protect');

	var form = new Morebits.quickForm(Twinkle.batchprotect.callback.evaluate);
	form.append({
		type: 'checkbox',
		name: 'editmodify',
		event: Twinkle.protect.formevents.editmodify,
		list: [
			{
				label: 'Ubah perlindungan penyuntingan',
				value: 'editmodify',
				tooltip: 'Hanya untuk halaman yang ada',
				checked: true
			}
		]
	});
	var editlevel = form.append({
		type: 'select',
		name: 'editlevel',
		label: 'Ubah perlindungan:',
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
	/* editlevel.append({
		type: 'option',
		label: 'Extended confirmed',
		value: 'extendedconfirmed'
	});
	editlevel.append({
		type: 'option',
		label: 'Template editor',
		value: 'templateeditor'
	}); */
	editlevel.append({
		type: 'option',
		label: 'Pengurus',
		value: 'sysop',
		selected: true
	});
	form.append({
		type: 'select',
		name: 'editexpiry',
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
			{ label: '2 hari', selected: true, value: '2 days' },
			{ label: '3 hari', value: '3 days' },
			{ label: '4 hari', value: '4 days' },
			{ label: '1 minggu', value: '1 week' },
			{ label: '2 minggu', value: '2 weeks' },
			{ label: '1 bulan', value: '1 month' },
			{ label: '2 bulan', value: '2 months' },
			{ label: '3 bulan', value: '3 months' },
			{ label: '1 tahun', value: '1 year' },
			{ label: 'selamanya', value: 'indefinite' },
			{ label: 'Atur sendiri...', value: 'custom' }
		]
	});

	form.append({
		type: 'checkbox',
		name: 'movemodify',
		event: Twinkle.protect.formevents.movemodify,
		list: [
			{
				label: 'Ubah perlindungan pemindahan',
				value: 'movemodify',
				tooltip: 'Hanya untuk halaman yang ada',
				checked: true
			}
		]
	});
	var movelevel = form.append({
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
	/* movelevel.append({
		type: 'option',
		label: 'Extended confirmed',
		value: 'extendedconfirmed'
	});
	movelevel.append({
		type: 'option',
		label: 'Template editor',
		value: 'templateeditor'
	}); */
	movelevel.append({
		type: 'option',
		label: 'Pengurus',
		value: 'sysop',
		selected: true
	});
	form.append({
		type: 'select',
		name: 'moveexpiry',
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
			{ label: '2 hari', selected: true, value: '2 days' },
			{ label: '3 hari', value: '3 days' },
			{ label: '4 hari', value: '4 days' },
			{ label: '1 minggu', value: '1 week' },
			{ label: '2 minggu', value: '2 weeks' },
			{ label: '1 bulan', value: '1 month' },
			{ label: '2 bulan', value: '2 months' },
			{ label: '3 bulan', value: '3 months' },
			{ label: '1 tahun', value: '1 year' },
			{ label: 'selamanya', value: 'indefinite' },
			{ label: 'Atur sendiri...', value: 'custom' }
		]
	});

	form.append({
		type: 'checkbox',
		name: 'createmodify',
		event: function twinklebatchprotectFormCreatemodifyEvent(e) {
			e.target.form.createlevel.disabled = !e.target.checked;
			e.target.form.createexpiry.disabled = !e.target.checked || (e.target.form.createlevel.value === 'all');
			e.target.form.createlevel.style.color = e.target.form.createexpiry.style.color = e.target.checked ? '' : 'transparent';
		},
		list: [
			{
				label: 'Ubah perlindungan pembuatan',
				value: 'createmodify',
				tooltip: 'Hanya untuk halaman yang belum ada',
				checked: true
			}
		]
	});
	var createlevel = form.append({
		type: 'select',
		name: 'createlevel',
		label: 'Buat perlindungan:',
		event: Twinkle.protect.formevents.createlevel
	});
	createlevel.append({
		type: 'option',
		label: 'Semua',
		value: 'all'
	});
	createlevel.append({
		type: 'option',
		label: 'Terkonfirmasi otomatis',
		value: 'autoconfirmed'
	});
	/* createlevel.append({
		type: 'option',
		label: 'Extended confirmed',
		value: 'extendedconfirmed'
	});
	createlevel.append({
		type: 'option',
		label: 'Template editor',
		value: 'templateeditor'
	}); */
	createlevel.append({
		type: 'option',
		label: 'Pengurus',
		value: 'sysop',
		selected: true
	});
	form.append({
		type: 'select',
		name: 'createexpiry',
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
			{ label: '2 hari', selected: true, value: '2 days' },
			{ label: '3 hari', value: '3 days' },
			{ label: '4 hari', value: '4 days' },
			{ label: '1 minggu', value: '1 week' },
			{ label: '2 minggu', value: '2 weeks' },
			{ label: '1 bulan', value: '1 month' },
			{ label: '2 bulan', value: '2 months' },
			{ label: '3 bulan', value: '3 months' },
			{ label: '1 tahun', value: '1 year' },
			{ label: 'selamanya', value: 'indefinite' },
			{ label: 'Atur sendiri...', value: 'custom' }
		]
	});

	form.append({
		type: 'header',
		label: ''  // horizontal rule
	});
	form.append({
		type: 'input',
		name: 'reason',
		label: 'Alasan: ',
		size: 60,
		tooltip: 'Untuk log perlindungan dan riwayat halaman'
	});

	var query = {
		'action': 'query',
		'prop': 'revisions|info',
		'rvprop': 'size',
		'inprop': 'protection'
	};

	if (mw.config.get('wgNamespaceNumber') === 14) {  // categories
		query.generator = 'categorymembers';
		query.gcmtitle = mw.config.get('wgPageName');
		query.gcmlimit = Twinkle.getPref('batchMax');
	} else if (mw.config.get('wgCanonicalSpecialPageName') === 'Prefixindex') {
		query.generator = 'allpages';
		query.gapnamespace = mw.util.getParamValue('namespace') || $('select[name=namespace]').val();
		query.gapprefix = mw.util.getParamValue('prefix') || $('input[name=prefix]').val();
		query.gaplimit = Twinkle.getPref('batchMax');
	} else {
		query.generator = 'links';
		query.titles = mw.config.get('wgPageName');
		query.gpllimit = Twinkle.getPref('batchMax');
	}

	var statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();

	var statelem = new Morebits.status('Mengambil senarai halaman');

	var wikipedia_api = new Morebits.wiki.api('memuat...', query, function(apiobj) {
		var xml = apiobj.responseXML;
		var $pages = $(xml).find('page');
		var list = [];
		$pages.each(function(index, page) {
			var $page = $(page);
			var title = $page.attr('title');
			var isRedir = $page.attr('redirect') === ''; // XXX ??
			var missing = $page.attr('missing') === ''; // XXX ??
			var size = $page.find('rev').attr('size');
			var $editProt;

			var metadata = [];
			if (missing) {
				metadata.push('halaman tidak ada');
				$editProt = $page.find('pr[type="create"][level="sysop"]');
			} else {
				if (isRedir) {
					metadata.push('redirect');
				}
				metadata.push(size + ' bytes');
				$editProt = $page.find('pr[type="edit"][level="sysop"]');
			}
			if ($editProt.length > 0) {
				metadata.push('fully' + (missing ? ' create' : '') + ' dilindungi' +
				($editProt.attr('expiry') === 'infinity' ? ' selamanya' : ', kedaluwarsa ' + new Morebits.date($editProt.attr('expiry')).calendar('utc') + ' (UTC)'));
			}

			list.push({ label: title + (metadata.length ? ' (' + metadata.join('; ') + ')' : ''), value: title, checked: true, style: $editProt.length > 0 ? 'color:red' : '' });
		});
		form.append({ type: 'header', label: 'Halaman yang akan dilindungi' });
		form.append({
			type: 'button',
			label: 'Pilih semua',
			event: function(e) {
				$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', true);
			}
		});
		form.append({
			type: 'button',
			label: 'Kosongkan centang',
			event: function(e) {
				$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', false);
			}
		});
		form.append({
			type: 'checkbox',
			name: 'pages',
			list: list
		});
		form.append({ type: 'submit' });

		var result = form.render();
		Window.setContent(result);

		Morebits.checkboxShiftClickSupport(Morebits.quickForm.getElements(result, 'pages'));
	}, statelem);

	wikipedia_api.post();
};

Twinkle.batchprotect.currentProtectCounter = 0;
Twinkle.batchprotect.currentprotector = 0;
Twinkle.batchprotect.callback.evaluate = function twinklebatchprotectCallbackEvaluate(event) {
	Morebits.wiki.actionCompleted.notice = 'Perlindungan massal telah selesai';

	var form = event.target;

	var numProtected = $(Morebits.quickForm.getElements(form, 'pages')).filter(function(index, element) {
		return element.checked && element.nextElementSibling.style.color === 'red';
	}).length;
	if (numProtected > 0 && !confirm('Anda akan melakukan tindakan pada ' + numProtected + ' halaman yang dilindungi penuh. Yakin?')) {
		return;
	}

	var pages = form.getChecked('pages');
	var reason = form.reason.value;
	var editmodify = form.editmodify.checked;
	var editlevel = form.editlevel.value;
	var editexpiry = form.editexpiry.value;
	var movemodify = form.movemodify.checked;
	var movelevel = form.movelevel.value;
	var moveexpiry = form.moveexpiry.value;
	var createmodify = form.createmodify.checked;
	var createlevel = form.createlevel.value;
	var createexpiry = form.createexpiry.value;

	if (!reason) {
		alert("Anda harus memberikan alasan. Jangan mengabaikannya!");
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	if (!pages) {
		Morebits.status.error('Galat', 'Tidak ada halaman untuk dilindungi. Membatalkan...');
		return;
	}

	var batchOperation = new Morebits.batchOperation('Menerapkan pengaturan perlindungan');
	batchOperation.setOption('chunkSize', Twinkle.getPref('batchProtectChunks'));
	batchOperation.setOption('preserveIndividualStatusLines', true);
	batchOperation.setPageList(pages);
	batchOperation.run(function(pageName) {
		var query = {
			'action': 'query',
			'titles': pageName
		};
		var wikipedia_api = new Morebits.wiki.api('Memeriksa apakah ' + pageName + ' ada', query,
			Twinkle.batchprotect.callbacks.main, null, batchOperation.workerFailure);
		wikipedia_api.params = {
			page: pageName,
			reason: reason,
			editmodify: editmodify,
			editlevel: editlevel,
			editexpiry: editexpiry,
			movemodify: movemodify,
			movelevel: movelevel,
			moveexpiry: moveexpiry,
			createmodify: createmodify,
			createlevel: createlevel,
			createexpiry: createexpiry,
			batchOperation: batchOperation
		};
		wikipedia_api.post();
	});
};

Twinkle.batchprotect.callbacks = {
	main: function(apiobj) {
		var xml = apiobj.responseXML;
		var normal = $(xml).find('normalized n').attr('to');
		if (normal) {
			apiobj.params.page = normal;
		}

		var exists = $(xml).find('page').attr('missing') !== '';

		var page = new Morebits.wiki.page(apiobj.params.page, 'Melindungi ' + apiobj.params.page);
		var takenAction = false;
		if (exists && apiobj.params.editmodify) {
			page.setEditProtection(apiobj.params.editlevel, apiobj.params.editexpiry);
			takenAction = true;
		}
		if (exists && apiobj.params.movemodify) {
			page.setMoveProtection(apiobj.params.movelevel, apiobj.params.moveexpiry);
			takenAction = true;
		}
		if (!exists && apiobj.params.createmodify) {
			page.setCreateProtection(apiobj.params.createlevel, apiobj.params.createexpiry);
			takenAction = true;
		}
		if (!takenAction) {
			Morebits.status.warn('Melindungi ' + apiobj.params.page, 'halaman ' + (exists ? 'tersedia' : 'tidak ada') + '; sedang gabut, loncati...');
			apiobj.params.batchOperation.workerFailure(apiobj);
			return;
		}

		page.setEditSummary(apiobj.params.reason);
		page.protect(apiobj.params.batchOperation.workerSuccess, apiobj.params.batchOperation.workerFailure);
	}
};
})(jQuery);


// </nowiki>
