// <nowiki>


(function($) {


/*
 ****************************************
 *** twinkleimage.js: Image CSD module
 ****************************************
 * Mode of invocation:     Tab ("DI")
 * Active on:              Local nonredirect file pages (not on Commons)
 */

Twinkle.image = function twinkleimage() {
	if (mw.config.get('wgNamespaceNumber') === 6 && mw.config.get('wgArticleId') && !document.getElementById('mw-sharedupload') && !Morebits.wiki.isPageRedirect()) {
		Twinkle.addPortletLink(Twinkle.image.callback, 'DI', 'tw-di', 'Nominate file for delayed speedy deletion');
	}
};

Twinkle.image.callback = function twinkleimageCallback() {
	var Window = new Morebits.simpleWindow(600, 330);
	Window.setTitle('File for dated speedy deletion');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Speedy deletion policy', 'WP:CSD#Files');
	Window.addFooterLink('Bantuan Twinkle', 'WP:TW/DOC#image');

	var form = new Morebits.quickForm(Twinkle.image.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: 'Notify original uploader',
				value: 'notify',
				name: 'notify',
				tooltip: "Uncheck this if you are planning to make multiple nominations from the same user, and don't want to overload their talk page with too many notifications.",
				checked: Twinkle.getPref('notifyUserOnDeli')
			}
		]
	}
	);
	var field = form.append({
		type: 'field',
		label: 'Type of action wanted'
	});
	field.append({
		type: 'radio',
		name: 'type',
		event: Twinkle.image.callback.choice,
		list: [
			{
				label: 'Tanpa sumber (KPC B4)',
				value: 'no source',
				checked: true,
				tooltip: 'Gambar atau media yang tidak memiliki informasi sumber'
			},
			{
				label: 'Tanpa lisensi (KPC B4)',
				value: 'no license',
				tooltip: 'Gambar atau media tidak memiliki informasi hak cipta dan status lisensinya'
			},
			{
				label: 'Tanpa sumber dan tanpa lisensi (KPC B4)',
				value: 'no source no license',
				tooltip: 'Image or media has neither information on source nor its copyright status'
			},
			{
				label: 'Berkas nonbebas yang tak digunakan (KPC B5)',
				value: 'orphaned fair use',
				tooltip: 'Image or media is unlicensed for use on Wikipedia and allowed only under a claim of fair use per Wikipedia:Non-free content, but it is not used in any articles'
			},
			{
				label: 'Tidak memiliki alasan penggunaan nonbebas (KPC B6)',
				value: 'no fair use rationale',
				tooltip: 'Gambar atau media yang diklaim perlu digunakan sejalan dengan kebijakan berkas non-bebas, tetapi tidak memiliki alasan mengapa hal ini dapat diizinkan untuk berkas ini'
			},
			{
				label: 'Berkas penggunaan wajar yang dipertentangkan (KPC B7)',
				value: 'disputed fair use rationale',
				tooltip: 'Gambar atau media yang memiliki alasan penggunaan wajar yang dipertentangkan'
			},
			{
				label: 'Berkas penggunaan wajar yang dapat digantikan (KPC B7)',
				value: 'replaceable fair use',
				tooltip: 'Image or media may fail Wikipedia\'s first non-free content criterion ([[WP:NFCC#1]]) in that it illustrates a subject for which a free image might reasonably be found or created that adequately provides the same information'
			},
			{
				label: 'Tidak ada bukti izin penggunaan (KPC B11)',
				value: 'no permission',
				tooltip: 'Image or media does not have proof that the author agreed to licence the file'
			}
		]
	});
	form.append({
		type: 'div',
		label: 'Work area',
		name: 'work_area'
	});
	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the parameters
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.type[0].dispatchEvent(evt);
};

Twinkle.image.callback.choice = function twinkleimageCallbackChoose(event) {
	var value = event.target.values;
	var root = event.target.form;
	var work_area = new Morebits.quickForm.element({
		type: 'div',
		name: 'work_area'
	});

	switch (value) {
		case 'no source no license':
		case 'no source':
			work_area.append({
				type: 'checkbox',
				name: 'non_free',
				list: [
					{
						label: 'Non-free',
						tooltip: 'File is licensed under a fair use claim'
					}
				]
			});
		/* falls through */
		case 'no license':
			work_area.append({
				type: 'checkbox',
				name: 'derivative',
				list: [
					{
						label: 'Derivative work which lacks a source for incorporated works',
						tooltip: 'File is a derivative of one or more other works whose source is not specified'
					}
				]
			});
			break;
		case 'no permission':
			work_area.append({
				type: 'input',
				name: 'source',
				label: 'Source: '
			});
			break;
		case 'disputed fair use rationale':
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Concern: '
			});
			break;
		case 'orphaned fair use':
			work_area.append({
				type: 'input',
				name: 'replacement',
				label: 'Replacement: ',
				tooltip: 'Optional file that replaces this one.  The "File:" prefix is optional.'
			});
			break;
		case 'replaceable fair use':
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Reason: '
			});
			break;
		default:
			break;
	}

	root.replaceChild(work_area.render(), $(root).find('div[name="work_area"]')[0]);
};

Twinkle.image.callback.evaluate = function twinkleimageCallbackEvaluate(event) {
	var type, non_free, source, reason, replacement, derivative;

	var notify = event.target.notify.checked;
	var types = event.target.type;
	for (var i = 0; i < types.length; ++i) {
		if (types[i].checked) {
			type = types[i].values;
			break;
		}
	}
	if (event.target.non_free) {
		non_free = event.target.non_free.checked;
	}
	if (event.target.source) {
		source = event.target.source.value;
	}
	if (event.target.reason) {
		reason = event.target.reason.value;
	}
	if (event.target.replacement && event.target.replacement.value.trim()) {
		replacement = event.target.replacement.value;
		replacement = /^\s*(Image|File):/i.test(replacement) ? replacement : 'File:' + replacement;
	}
	if (event.target.derivative) {
		derivative = event.target.derivative.checked;
	}

	var csdcrit;
	switch (type) {
		case 'no source no license':
		case 'no source':
		case 'no license':
			csdcrit = 'F4';
			break;
		case 'orphaned fair use':
			csdcrit = 'F5';
			break;
		case 'no fair use rationale':
			csdcrit = 'F6';
			break;
		case 'disputed fair use rationale':
		case 'replaceable fair use':
			csdcrit = 'F7';
			break;
		case 'no permission':
			csdcrit = 'F11';
			break;
		default:
			throw new Error('Twinkle.image.callback.evaluate: unknown criterion');
	}

	var lognomination = Twinkle.getPref('logSpeedyNominations') && Twinkle.getPref('noLogOnSpeedyNomination').indexOf(csdcrit.toLowerCase()) === -1;
	var templatename = derivative ? 'dw ' + type : type;

	var params = {
		'type': type,
		'templatename': templatename,
		'normalized': csdcrit,
		'non_free': non_free,
		'source': source,
		'reason': reason,
		'replacement': replacement,
		'lognomination': lognomination
	};
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(event.target);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'Tagging complete';

	// Tagging image
	var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging file with deletion tag');
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.image.callbacks.taggingImage);

	// Notifying uploader
	if (notify) {
		wikipedia_page.lookupCreation(Twinkle.image.callbacks.userNotification);
	} else {
		// add to CSD log if desired
		if (lognomination) {
			params.fromDI = true;
			Twinkle.speedy.callbacks.user.addToLog(params, null);
		}
		// No auto-notification, display what was going to be added.
		var noteData = document.createElement('pre');
		noteData.appendChild(document.createTextNode('{{subst:di-' + templatename + '-notice|1=' + mw.config.get('wgTitle') + '}} ~~~~'));
		Morebits.status.info('Notification', [ 'Following/similar data should be posted to the original uploader:', document.createElement('br'), noteData ]);
	}
};

Twinkle.image.callbacks = {
	taggingImage: function(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
		text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');

		var tag = '{{di-' + params.templatename + '|date={{subst:#time:j F Y}}';
		switch (params.type) {
			case 'no source no license':
			case 'no source':
				tag += params.non_free ? '|non-free=yes' : '';
				break;
			case 'no permission':
				tag += params.source ? '|source=' + params.source : '';
				break;
			case 'disputed fair use rationale':
				tag += params.reason ? '|concern=' + params.reason : '';
				break;
			case 'orphaned fair use':
				tag += params.replacement ? '|replacement=' + params.replacement : '';
				break;
			case 'replaceable fair use':
				tag += params.reason ? '|1=' + params.reason : '';
				break;
			default:
				break;  // doesn't matter
		}
		tag += '|help=off}}\n';

		pageobj.setPageText(tag + text);
		pageobj.setEditSummary('This file is up for deletion, per [[WP:CSD#' + params.normalized + '|CSD ' + params.normalized + ']] (' + params.type + ').' + Twinkle.getPref('summaryAd'));
		switch (Twinkle.getPref('deliWatchPage')) {
			case 'yes':
				pageobj.setWatchlist(true);
				break;
			case 'no':
				pageobj.setWatchlistFromPreferences(false);
				break;
			default:
				pageobj.setWatchlistFromPreferences(true);
				break;
		}
		pageobj.setCreateOption('nocreate');
		pageobj.save();
	},
	userNotification: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();

		// disallow warning yourself
		if (initialContrib === mw.config.get('wgUserName')) {
			pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
		} else {
			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
			var notifytext = '\n{{subst:di-' + params.templatename + '-notice|1=' + mw.config.get('wgTitle');
			if (params.type === 'no permission') {
				notifytext += params.source ? '|source=' + params.source : '';
			}
			notifytext += '}} ~~~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: tagging for deletion of [[:' + Morebits.pageNameNorm + ']].' + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			switch (Twinkle.getPref('deliWatchUser')) {
				case 'yes':
					usertalkpage.setWatchlist(true);
					break;
				case 'no':
					usertalkpage.setWatchlistFromPreferences(false);
					break;
				default:
					usertalkpage.setWatchlistFromPreferences(true);
					break;
			}
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}

		// add this nomination to the user's userspace log, if the user has enabled it
		if (params.lognomination) {
			params.fromDI = true;
			Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
		}
	}
};
})(jQuery);


// </nowiki>
