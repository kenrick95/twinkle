// <nowiki>

(function($) {


/*
 ****************************************
 *** friendlytag.js: Tag module
 ****************************************
 * Mode of invocation:     Tab ("Tag")
 * Active on:              Existing articles and drafts; file pages with a corresponding file
 *                         which is local (not on Commons); all redirects
 */

Twinkle.tag = function friendlytag() {
	// redirect tagging
	if (Morebits.wiki.isPageRedirect()) {
		Twinkle.tag.mode = 'redirect';
		Twinkle.addPortletLink(Twinkle.tag.callback, 'Tag', 'friendly-tag', 'Tag pengalihan');
	// file tagging
	} else if (mw.config.get('wgNamespaceNumber') === 6 && !document.getElementById('mw-sharedupload') && document.getElementById('mw-imagepage-section-filehistory')) {
		Twinkle.tag.mode = 'file';
		Twinkle.addPortletLink(Twinkle.tag.callback, 'Tag', 'friendly-tag', 'Beri tag pemeliharaan ke artikel');
	// article/draft article tagging
	} else if ([0, 118].indexOf(mw.config.get('wgNamespaceNumber')) !== -1 && mw.config.get('wgCurRevisionId')) {
		Twinkle.tag.mode = 'article';
		// Can't remove tags when not viewing current version
		Twinkle.tag.canRemove = (mw.config.get('wgCurRevisionId') === mw.config.get('wgRevisionId')) &&
			// Disabled on latest diff because the diff slider could be used to slide
			// away from the latest diff without causing the script to reload
			!mw.config.get('wgDiffNewId');
		Twinkle.addPortletLink(Twinkle.tag.callback, 'Tag', 'friendly-tag', 'Berikan atau hapus tag pemeliharaan ke artikel');
	}
};

Twinkle.tag.checkedTags = [];

Twinkle.tag.callback = function friendlytagCallback() {
	var Window = new Morebits.simpleWindow(630, Twinkle.tag.mode === 'article' ? 500 : 400);
	Window.setScriptName('Twinkle');
	// anyone got a good policy/guideline/info page/instructional page link??
	Window.addFooterLink('Bantuan Twinkle', 'WP:TW/DOC#tag');

	var form = new Morebits.quickForm(Twinkle.tag.callback.evaluate);

	form.append({
		type: 'input',
		label: 'Filter cepat: ',
		name: 'quickfilter',
		size: '30px',
		event: function twinkletagquickfilter() {
			// flush the DOM of all existing underline spans
			$allCheckboxDivs.find('.search-hit').each(function(i, e) {
				var label_element = e.parentElement;
				// This would convert <label>Hello <span class=search-hit>wo</span>rld</label>
				// to <label>Hello world</label>
				label_element.innerHTML = label_element.textContent;
			});

			if (this.value) {
				$allCheckboxDivs.hide();
				$allHeaders.hide();
				var searchString = this.value;
				var searchRegex = new RegExp(mw.util.escapeRegExp(searchString), 'i');

				$allCheckboxDivs.find('label').each(function () {
					var label_text = this.textContent;
					var searchHit = searchRegex.exec(label_text);
					if (searchHit) {
						var range = document.createRange();
						var textnode = this.childNodes[0];
						range.selectNodeContents(textnode);
						range.setStart(textnode, searchHit.index);
						range.setEnd(textnode, searchHit.index + searchString.length);
						var underline_span = $('<span>').addClass('search-hit').css('text-decoration', 'underline')[0];
						range.surroundContents(underline_span);
						this.parentElement.style.display = 'block'; // show
					}
				});
			} else {
				$allCheckboxDivs.show();
				$allHeaders.show();
			}
		}
	});

	switch (Twinkle.tag.mode) {
		case 'article':
			Window.setTitle('Pemberian tag pemeliharaan dalam artikel');

			form.append({
				type: 'select',
				name: 'sortorder',
				label: 'Lihat daftar ini:',
				tooltip: 'Anda dapat mengganti tampilan susunan baku dalam preferensi Twinkle Anda (WP:TWPREFS).',
				event: Twinkle.tag.updateSortOrder,
				list: [
					{ type: 'option', value: 'cat', label: 'Menurut kategori', selected: Twinkle.getPref('tagArticleSortOrder') === 'cat' },
					{ type: 'option', value: 'alpha', label: 'Menurut abjad', selected: Twinkle.getPref('tagArticleSortOrder') === 'alpha' }
				]
			});


			if (!Twinkle.tag.canRemove) {
				var divElement = document.createElement('div');
				divElement.innerHTML = 'Untuk menghapus tag yang ada, silakan buka menu Tag dari versi artikel saat ini';
				form.append({
					type: 'div',
					name: 'untagnotice',
					label: divElement
				});
			}

			form.append({
				type: 'div',
				id: 'tagWorkArea',
				className: 'morebits-scrollbox',
				style: 'max-height: 28em'
			});

			form.append({
				type: 'checkbox',
				list: [
					{
						label: 'Kelompokkan dalam {{multiple issues}} jika dibutuhkan',
						value: 'group',
						name: 'group',
						tooltip: 'Jika menerapkan dua templat atau lebih yang didukung oleh {{multiple issues}} dan kotak ini dicentang, semua templat yang didukung akan dikelompokkan dalam templat {{multiple issues}}.',
						checked: Twinkle.getPref('groupByDefault')
					}
				]
			});

			form.append({
				type: 'input',
				label: 'Alasan',
				name: 'reason',
				tooltip: 'Alasan tambahan untuk dimasukkan dalam ringkasan suntingan. Disarankan saat menghapus tag.',
				size: '60px'
			});

			break;

		case 'file':
			Window.setTitle('Pemberian tag pemeliharaan berkas');

			form.append({ type: 'header', label: 'Tag lisensi dan sumber bermasalah' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.licenseList });

			form.append({ type: 'header', label: 'Tag yang berhubungan dengan Commons' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.commonsList });

			form.append({ type: 'header', label: 'Tag perapian' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.cleanupList });

			form.append({ type: 'header', label: 'Tag kualitas gambar' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.qualityList });

			form.append({ type: 'header', label: 'Tag penggantian' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.replacementList });

			if (Twinkle.getPref('customFileTagList').length) {
				form.append({ type: 'header', label: 'Tag kustom' });
				form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.getPref('customFileTagList') });
			}
			break;

		case 'redirect':
			Window.setTitle('Tag pengalihan');

			form.append({ type: 'header', label: 'Templat ejaan, salah ketik, gaya, dan kapitalisasi' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.spellingList });

			form.append({ type: 'header', label: 'Templat nama pengganti' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.alternativeList });

			form.append({ type: 'header', label: 'Templat administrasi dan pengalihan lain-lain' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.administrativeList });

			if (Twinkle.getPref('customRedirectTagList').length) {
				form.append({ type: 'header', label: 'Custom tags' });
				form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.getPref('customRedirectTagList') });
			}
			break;

		default:
			alert('Twinkle.tag: moda tak dikenal ' + Twinkle.tag.mode);
			break;
	}

	if (document.getElementsByClassName('patrollink').length) {
		form.append({
			type: 'checkbox',
			list: [
				{
					label: 'Tandai halaman ini sebagai terpatroli',
					value: 'patrolPage',
					name: 'patrolPage',
					checked: Twinkle.getPref('markTaggedPagesAsPatrolled')
				}
			]
		});
	}
	form.append({ type: 'submit', className: 'tw-tag-submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// for quick filter:
	$allCheckboxDivs = $(result).find('[name$=Tags]').parent();
	$allHeaders = $(result).find('h5');
	result.quickfilter.focus();  // place cursor in the quick filter field as soon as window is opened
	result.quickfilter.autocomplete = 'off'; // disable browser suggestions
	result.quickfilter.addEventListener('keypress', function(e) {
		if (e.keyCode === 13) { // prevent enter key from accidentally submitting the form
			e.preventDefault();
			return false;
		}
	});

	if (Twinkle.tag.mode === 'article') {

		Twinkle.tag.alreadyPresentTags = [];

		if (Twinkle.tag.canRemove) {
			// Look for existing maintenance tags in the lead section and put them in array

			// All tags are HTML table elements that are direct children of .mw-parser-output,
			// except when they are within {{multiple issues}}
			$('.mw-parser-output').children().each(function parsehtml(i, e) {

				// break out on encountering the first heading, which means we are no
				// longer in the lead section
				if (e.tagName === 'H2') {
					return false;
				}

				// The ability to remove tags depends on the template's {{ambox}} |name=
				// parameter bearing the template's correct name (preferably) or a name that at
				// least redirects to the actual name

				// All tags have their first class name as "box-" + template name
				if (e.className.indexOf('box-') === 0) {
					if (e.classList[0] === 'box-Multiple_issues') {
						$(e).find('.ambox').each(function(idx, e) {
							var tag = e.classList[0].slice(4).replace(/_/g, ' ');
							Twinkle.tag.alreadyPresentTags.push(tag);
						});
						return true; // continue
					}

					var tag = e.classList[0].slice(4).replace(/_/g, ' ');
					Twinkle.tag.alreadyPresentTags.push(tag);
				}
			});

			// {{Uncategorized}} and {{Improve categories}} are usually placed at the end
			if ($('.box-Uncategorized').length) {
				Twinkle.tag.alreadyPresentTags.push('Uncategorized');
			}
			if ($('.box-Improve_categories').length) {
				Twinkle.tag.alreadyPresentTags.push('Improve categories');
			}

		}

		// Add status text node after Submit button
		var statusNode = document.createElement('small');
		statusNode.id = 'tw-tag-status';
		Twinkle.tag.status = {
			// initial state; defined like this because these need to be available for reference
			// in the click event handler
			numAdded: 0,
			numRemoved: 0
		};
		$('button.tw-tag-submit').after(statusNode);

		// fake a change event on the sort dropdown, to initialize the tag list
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.sortorder.dispatchEvent(evt);

	} else {
		// Redirects and files: Add a link to each template's description page
		Morebits.quickForm.getElements(result, Twinkle.tag.mode + 'Tags').forEach(generateLinks);
	}
};


// $allCheckboxDivs and $allHeaders are defined globally, rather than in the
// quickfilter event function, to avoid having to recompute them on every keydown
var $allCheckboxDivs, $allHeaders;

Twinkle.tag.updateSortOrder = function(e) {
	var form = e.target.form;
	var sortorder = e.target.value;
	Twinkle.tag.checkedTags = form.getChecked('articleTags') || [];

	var container = new Morebits.quickForm.element({ type: 'fragment' });

	// function to generate a checkbox, with appropriate subgroup if needed
	var makeCheckbox = function(tag, description) {
		var checkbox = { value: tag, label: '{{' + tag + '}}: ' + description };
		if (Twinkle.tag.checkedTags.indexOf(tag) !== -1) {
			checkbox.checked = true;
		}
		switch (tag) {
			case 'Cleanup':
				checkbox.subgroup = {
					name: 'cleanup',
					type: 'input',
					label: 'Alasan perapian diperlukan: ',
					tooltip: 'Wajib diisi',
					size: 35
				};
				break;
			case 'Close paraphrasing':
				checkbox.subgroup = {
					name: 'closeParaphrasing',
					type: 'input',
					label: 'Source: ',
					tooltip: 'Kalimat yang diparafrase sangat mirip dengan sumber aslinya'
				};
				break;
			case 'Copy edit':
				checkbox.subgroup = {
					name: 'copyEdit',
					type: 'input',
					label: '"Artikel ini perlu disunting lebih lanjut untuk..." ',
					tooltip: 'seperti ¨ejaan yang salah¨. Opsional.',
					size: 35
				};
				break;
			case 'Copypaste':
				checkbox.subgroup = {
					name: 'copypaste',
					type: 'input',
					label: 'URL sumber: ',
					tooltip: 'Jika diketahui',
					size: 50
				};
				break;
			case 'Expand language':
				checkbox.subgroup = [ {
					name: 'expandLanguageLangCode',
					type: 'input',
					label: 'Kode bahasa: ',
					tooltip: 'Kode bahasa sumber artikel ini dikembangkan'
				}, {
					name: 'expandLanguageArticle',
					type: 'input',
					label: 'Nama artikel: ',
					tooltip: 'Judul artikel asal yang dikembangkan, tanpa awalan antarwiki'
				}
				];
				break;
			case 'Expert needed':
				checkbox.subgroup = [
					{
						name: 'expertNeeded',
						type: 'input',
						label: 'Nama ProyekWiki terkait: ',
						tooltip: 'Opsional. Berikan nama ProyekWiki yang dapat membantu merekrut pengguna ahli. Jangan berikan awalan "WikiProject" atau "ProyekWiki"'
					},
					{
						name: 'expertNeededReason',
						type: 'input',
						label: 'Alasan: ',
						tooltip: 'Penjelasan singkat yang menjelaskan masalahnya'
					},
					{
						name: 'expertNeededTalk',
						type: 'input',
						label: 'Diskusi pembicaraan: ',
						tooltip: 'Nama bagian dari halaman pembicaraan artikel ini yang sedang didiskusikan. Cukup berikan nama bagian artikelnya, bukan pranalanya.'
					}
				];
				break;
			case 'Globalize':
				checkbox.subgroup = {
					name: 'globalizeRegion',
					type: 'input',
					label: 'Tidak mewakili seluruh negara atau wilayah'
				};
				break;
			case 'History merge':
				checkbox.subgroup = [
					{
						name: 'histmergeOriginalPage',
						type: 'input',
						label: 'Artikel lain: ',
						tooltip: 'Nama halaman yang harus digabung ke halaman ini (wajib)'
					},
					{
						name: 'histmergeReason',
						type: 'input',
						label: 'Alasan: ',
						tooltip: 'Penjelasan singkat dan alasan penggabungan sejarah artikel diperlukan'
					},
					{
						name: 'histmergeSysopDetails',
						type: 'input',
						label: 'Perincian tambahan: ',
						tooltip: 'Untuk kasus kompleks, berikan instruksi tambahan guna ditinjau oleh pengurus'
					}
				];
				break;
			case 'Merge':
			case 'Merge from':
			case 'Merge to':
				var otherTagName = 'Merge';
				switch (tag) {
					case 'Merge from':
						otherTagName = 'Merge to';
						break;
					case 'Merge to':
						otherTagName = 'Merge from';
						break;
					// no default
				}
				checkbox.subgroup = [
					{
						name: 'mergeTarget',
						type: 'input',
						label: 'Artikel lainnya: ',
						tooltip: 'Jika beberapa artikel ditulis, pisahkan dengan karakter pipa: Artikel pertama|Artikel kedua'
					},
					{
						name: 'mergeTagOther',
						type: 'checkbox',
						list: [
							{
								label: 'Berikan tag ke artikel lainnya dengan tag {{' + otherTagName + '}}',
								checked: true,
								tooltip: 'Hanya ada jika nama artikel tunggal diberikan.'
							}
						]
					}
				];
				if (mw.config.get('wgNamespaceNumber') === 0) {
					checkbox.subgroup.push({
						name: 'mergeReason',
						type: 'textarea',
						label: 'Alasan penggabungan (akan dikirimkan ke ' +
							(tag === 'Merge from' ? 'artikel lainnya' : 'artikel ini') + ' halaman pembicaraan):',
						tooltip: 'Opsional, namun sangat disarankan. Kosongkan jika tidak diinginkan. Hanya tersedia jika nama artikel tunggal diberikan.'
					});
				}
				break;
			case 'Not Indonesian':
			case 'Rough translation':
				checkbox.subgroup = [
					{
						name: 'translationLanguage',
						type: 'input',
						label: 'Bahasa artikel (jika diketahui): ',
						tooltip: 'Baca pedoman penerjemahan artikel untuk informasi lebih lanjut.'
					}
				];
				if (tag === 'Not Indonesian') {
					checkbox.subgroup.push({
						name: 'translationNotify',
						type: 'checkbox',
						list: [
							{
								label: 'Beritahukan pembuat artikel',
								checked: true,
								tooltip: 'Tempatkan {{uw-notenglish}} di halaman pembicaraannya.'
							}
						]
					});
				}
				break;
			case 'Notability':
				checkbox.subgroup = {
					name: 'notability',
					type: 'select',
					list: [
						{ label: '{{notability}}: subjek artikel mungkin tidak memenuhi kelayakan secara umum', value: 'none' },
						{ label: '{{notability|Academics}}: pedoman kelayakan untuk akademik', value: 'Academics' },
						{ label: '{{notability|Astro}}: pedoman kelayakan untuk benda astronomi', value: 'Astro' },
						{ label: '{{notability|Biographies}}: pedoman kelayakan untuk biografi', value: 'Biographies' },
						{ label: '{{notability|Books}}: pedoman kelayakan untuk buku', value: 'Books' },
						{ label: '{{notability|Companies}}: pedoman kelayakan untuk perusahaan dan organisasi', value: 'Companies' },
						{ label: '{{notability|Events}}: pedoman kelayakan untuk acara/perhelatan', value: 'Events' },
						{ label: '{{notability|Films}}: pedoman kelayakan untuk film', value: 'Films' },
						{ label: '{{notability|Geographic}}: pedoman kelayakan untuk fitur geografi', value: 'Geographic' },
						{ label: '{{notability|Lists}}: pedoman kelayakan untuk halaman daftar', value: 'Lists' },
						{ label: '{{notability|Music}}: pedoman kelayakan untuk musik', value: 'Music' },
						{ label: '{{notability|Neologisms}}: pedoman kelayakan untuk neologisme', value: 'Neologisms' },
						{ label: '{{notability|Numbers}}: pedoman kelayakan untuk angka', value: 'Numbers' },
						{ label: '{{notability|Products}}: pedoman kelayakan untuk produk dan layanan', value: 'Products' },
						{ label: '{{notability|Sports}}: pedoman kelayakan untuk olahraga', value: 'Sports' },
						{ label: '{{notability|Television}}: pedoman kelayakan untuk acara televisi', value: 'Television' },
						{ label: '{{notability|Web}}: pedoman kelayakan untuk isi situs web', value: 'Web' }
					]
				};
				break;
			default:
				break;
		}
		return checkbox;
	};

	var makeCheckboxesForAlreadyPresentTags = function() {
		container.append({ type: 'header', id: 'tagHeader0', label: 'Tags already present' });
		var subdiv = container.append({ type: 'div', id: 'tagSubdiv0' });
		var checkboxes = [];
		var unCheckedTags = e.target.form.getUnchecked('alreadyPresentArticleTags') || [];
		Twinkle.tag.alreadyPresentTags.forEach(function(tag) {
			var description = Twinkle.tag.article.tags[tag];
			var checkbox =
				{
					value: tag,
					label: '{{' + tag + '}}' + (description ? ': ' + description : ''),
					checked: unCheckedTags.indexOf(tag) === -1,
					style: 'font-style: italic'
				};

			checkboxes.push(checkbox);
		});
		subdiv.append({
			type: 'checkbox',
			name: 'alreadyPresentArticleTags',
			list: checkboxes
		});
	};

	if (sortorder === 'cat') { // categorical sort order
		// function to iterate through the tags and create a checkbox for each one
		var doCategoryCheckboxes = function(subdiv, array) {
			var checkboxes = [];
			$.each(array, function(k, tag) {
				var description = Twinkle.tag.article.tags[tag];
				if (Twinkle.tag.alreadyPresentTags.indexOf(tag) === -1) {
					checkboxes.push(makeCheckbox(tag, description));
				}
			});
			subdiv.append({
				type: 'checkbox',
				name: 'articleTags',
				list: checkboxes
			});
		};

		if (Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
		}
		var i = 1;
		// go through each category and sub-category and append lists of checkboxes
		$.each(Twinkle.tag.article.tagCategories, function(title, content) {
			container.append({ type: 'header', id: 'tagHeader' + i, label: title });
			var subdiv = container.append({ type: 'div', id: 'tagSubdiv' + i++ });
			if (Array.isArray(content)) {
				doCategoryCheckboxes(subdiv, content);
			} else {
				$.each(content, function(subtitle, subcontent) {
					subdiv.append({ type: 'div', label: [ Morebits.htmlNode('b', subtitle) ] });
					doCategoryCheckboxes(subdiv, subcontent);
				});
			}
		});
	} else { // alphabetical sort order
		if (Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
			container.append({ type: 'header', id: 'tagHeader1', label: 'Available tags' });
		}
		var checkboxes = [];
		$.each(Twinkle.tag.article.tags, function(tag, description) {
			if (Twinkle.tag.alreadyPresentTags.indexOf(tag) === -1) {
				checkboxes.push(makeCheckbox(tag, description));
			}
		});
		container.append({
			type: 'checkbox',
			name: 'articleTags',
			list: checkboxes
		});
	}

	// append any custom tags
	if (Twinkle.getPref('customTagList').length) {
		container.append({ type: 'header', label: 'Tag yang disesuaikan' });
		container.append({ type: 'checkbox', name: 'articleTags',
			list: Twinkle.getPref('customTagList').map(function(el) {
				el.checked = Twinkle.tag.checkedTags.indexOf(el.value) !== -1;
				return el;
			})
		});
	}

	var $workarea = $(form).find('#tagWorkArea');
	var rendered = container.render();
	$workarea.empty().append(rendered);

	// for quick filter:
	$allCheckboxDivs = $workarea.find('[name$=Tags]').parent();
	$allHeaders = $workarea.find('h5, .quickformDescription');
	form.quickfilter.value = ''; // clear search, because the search results are not preserved over mode change
	form.quickfilter.focus();

	// style adjustments
	$workarea.find('h5').css({ 'font-size': '110%' });
	$workarea.find('h5:not(:first-child)').css({ 'margin-top': '1em' });
	$workarea.find('div').filter(':has(span.quickformDescription)').css({ 'margin-top': '0.4em' });

	var alreadyPresentTags = Morebits.quickForm.getElements(form, 'alreadyPresentArticleTags');
	if (alreadyPresentTags) {
		alreadyPresentTags.forEach(generateLinks);
	}
	// in the unlikely case that *every* tag is already on the page
	var notPresentTags = Morebits.quickForm.getElements(form, 'articleTags');
	if (notPresentTags) {
		notPresentTags.forEach(generateLinks);
	}

	// tally tags added/removed, update statusNode text
	var statusNode = document.getElementById('tw-tag-status');
	$('[name=articleTags], [name=alreadyPresentArticleTags]').click(function() {
		if (this.name === 'articleTags') {
			Twinkle.tag.status.numAdded += this.checked ? 1 : -1;
		} else if (this.name === 'alreadyPresentArticleTags') {
			Twinkle.tag.status.numRemoved += this.checked ? -1 : 1;
		}

		var firstPart = 'Adding ' + Twinkle.tag.status.numAdded + ' tag' + (Twinkle.tag.status.numAdded > 1 ? 's' : '');
		var secondPart = 'Removing ' + Twinkle.tag.status.numRemoved + ' tag' + (Twinkle.tag.status.numRemoved > 1 ? 's' : '');
		statusNode.textContent =
			(Twinkle.tag.status.numAdded ? '  ' + firstPart : '') +
			(Twinkle.tag.status.numRemoved ? (Twinkle.tag.status.numAdded ? '; ' : '  ') + secondPart : '');
	});
};

/**
 * Adds a link to each template's description page
 * @param {Morebits.quickForm.element} checkbox  associated with the template
 */
var generateLinks = function(checkbox) {
	var link = Morebits.htmlNode('a', '>');
	link.setAttribute('class', 'tag-template-link');
	var tagname = checkbox.values;
	link.setAttribute('href', mw.util.getUrl(
		(tagname.indexOf(':') === -1 ? 'Template:' : '') +
		(tagname.indexOf('|') === -1 ? tagname : tagname.slice(0, tagname.indexOf('|')))
	));
	link.setAttribute('target', '_blank');
	$(checkbox).parent().append(['\u00A0', link]);
};


// Tags for ARTICLES start here

Twinkle.tag.article = {};

// A list of all article tags, in alphabetical order
// To ensure tags appear in the default "categorized" view, add them to the tagCategories hash below.

Twinkle.tag.article.tags = {
	'Advert': 'artikel ditulis seperti iklan',
	'All plot': 'artikel hampir semuanya ringkasan alur',
	'Autobiography': 'artikel adalah otobiografi yang tidak ditulis secara netral',
	'BLP sources': 'artikel tokoh yang masih hidup perlu referensi lebih banyak untuk diperiksa',
	'BLP unsourced': 'artikel tokoh yang masih hidup yang tidak punya referensi',
	'Citation style': 'artikel yang kutipannya tidak jelas atau tak konsisten',
	'Cleanup': 'artikel memerlukan perapian',
	'Cleanup bare URLs': 'artikel menggunakan URL telanjang untuk referensi, yang rentan terhadap pranala mati',
	'Cleanup-PR': 'artikel dibaca seperti siaran pers',
	'Cleanup reorganize': 'artikel memerlukan pengubahan struktur agar sesuai dengan pedoman Wikipedia',
	'Cleanup rewrite': 'artikel mungkin perlu ditulis ulang secara menyeluruh agar memenuhi standar kualitas Wikipedia',
	'Cleanup tense': 'artikel ditulis dalam bentuk kala yang salah',
	'Close paraphrasing': 'artikel mengandung parafrasa yang mirip dengan sumber tidak bebas berhak cipta',
	'COI': 'pembuat artikel memiliki konflik kepentingan',
	'Condense': 'artikel mungkin punya banyak kepala bagian yang membagi-bagi isinya',
	'Confusing': 'artikel tidak memiliki isi yang jelas (membingungkan)',
	'Context': 'konteks isi artikel tidak mencukupi',
	'Copy edit': 'artikel butuh perbaikan pada tata bahasa, gaya, relasi antarparagrag, dan/atau ejaan',
	'Copypaste': 'artikel terkesan disalin dari sebuah sumber',
	'Current': 'artikel mendokumentasikan sebuah peristiwa terkini',
	'Disputed': 'akurasi aktual isi halaman dipertanyakan',
	'Essay-like': 'artikel ditulis seperti esai atau opini',
	'Expand language': 'artikel dapat dikembangkan dengan materi dari Wikipedia bahasa lain',
	'Expert needed': 'artikel perlu dilihat oleh pengguna yang ahli di bidang ini',
	'External links': 'pranala luar artikel tidak mengikuti pedoman dan kebijakan',
	'Fanpov': 'artikel mirip dengan situs penggemar',
	'Fiction': 'artikel tidak dapat dibedakan antara nyata atau fiksi',
	'Globalize': 'artikel tidak mewakili sudut pandang umum subjek tersebut',
	'GOCEinuse': 'artikel sedang dalam perubahan besar oleh Guild of Copy Editors',
	'History merge': 'menggabungkan riwayat halaman lain ke dalam halaman ini',
	'Hoax': 'artikel berisi informasi palsu',
	'Improve categories': 'artikel butuh kategori tambahan',
	'Incomprehensible': 'artikel sulit untuk dipahami atau tidak komprehensif',
	'In-universe': 'subjek artikel adalah fiksi dan butuh gaya penulisan dari sudut pandang nonfiksi',
	'In use': 'artikel dalam pengembangan dalam waktu dekat',
	'Lead missing': 'artikel tidak memiliki bagian pengantar dan perlu ditulis',
	'Lead rewrite': 'pengantar artikel tidak sesuai pedoman',
	'Lead too long': 'pengantar artikel sangat panjang dan harus dibuat lebih ringkas',
	'Lead too short': 'pengantar artikel sangat pendek dan harus dikembangkan',
	'Like resume': 'artikel ditulis seperti resume',
	'Long plot': 'ringkasan alur di artikel terlalu panjang',
	'Manual': 'gaya artikel mirip dengan buku pedoman',
	'Merge': 'artikel ini perlu digabungkan ke artikel lain',
	'Merge from': 'artikel lain harus digabungkan ke artikel ini',
	'Merge to': 'artikel ini harus digabungkan ke artikel lain',
	'More citations needed': 'artikel butuh referensi atau sumber tambahan untuk verifikasi',
	'More footnotes': 'artikel sudah punya referensi, namun hanya punya sedikit catatan kaki',
	'No footnotes': 'artikel punya referensi, namun tidak punya catatan kaki',
	'No plot': 'artikel tidak memiliki ringkasan alur',
	'Non-free': 'artikel mungkin mengandung materi yang berhak cipta yang tidak digunakan sebagaimana mestinya',
	'Notability': 'subjek artikel tidak memenuhi kelayakan',
	'Not English': 'artikel ditulis dalam bahasa selain bahasa Inggris dan butuh terjemahan',
	'One source': 'artikel hanya merujuk pada sebuah sumber saja',
	'Original research': 'artikel memiliki penggunaan riset asli klaim yang tidak terperiksa',
	'Orphan': 'artikel tidak memiliki hubungan dengan artikel lain',
	'Over-coverage': 'artikel mengandung anggapan atau cakupan tidak sesuai terhadap satu bagian atau lebih',
	'Overlinked': 'artikel banyak mengandung pranala duplikat dan/atau tidak berhubungan',
	'Overly detailed': 'artikel mengandung jumlah detail yang terlalu banyak',
	'Over-quotation': 'artikel mengandung terlalu banyak atau terlalu panjang kutipan untuk entri ensiklopedis',
	'Peacock': 'artikel mengandung istilah hiperbola yang mempromosikan subjek tanpa informasi lengkap',
	'POV': 'sudut pandang penulisan artikel tidak netral',
	'Primary sources': 'artikel terlalu mengandalkan sumber primer, dan butuh sumber tambahan',
	'Prose': 'artikel mengandung format yang lebih sesuai ditulis dalam bentuk prosa',
	'Recentism': 'artikel ini terlalu condong dengan peristiwa terkini',
	'Rough translation': 'artikel sangat jelek penerjemahannya dan memerlukan perbaikan',
	'Sections': 'artikel perlu dibagi dalam subbagian',
	'Self-published': 'artikel mengandung sumber yang mungkin tak sesuai untuk sumber yang diterbitkan oleh diri sendiri',
	'Technical': 'artikel mengandung banyak istilah yang rumit',
	'Third-party': 'artikel terlalu mengandalkan sumber kedua, dan butuh sumber ketiga',
	'Tone': 'gaya penulisan tak sesuai',
	'Too few opinions': 'artikel tidak mengandung keseluruhan sudut pandang yang penting',
	'Uncategorized': 'artikel tidak ada kategori',
	'Under construction': 'artikel sedang dalam tahap pengembangan',
	'Underlinked': 'artikel perlu lebih banyak pranala wiki',
	'Undue weight': 'artikel ini memberi berat tak wajar untuk gagasan, insiden, atau kontroversi tertentu',
	'Unfocused': 'artikel kurang memfokuskan subjek atau punya topik yang lebih dari satu',
	'Unreferenced': 'artikel tidak punya referensi sama sekali',
	'Unreliable sources': 'sumber artikel mungkin tidak dapat dipercaya',
	'Undisclosed paid': 'artikel mungkin telah dibuat atau disunting sebagai imbalan untuk pembayaran yang tidak diungkapkan',
	'Update': 'artikel memerlukan informasi yang lebih aktual',
	'Very long': 'artikel sangaaaat panjang',
	'Weasel': 'kenetralan artikel diganggu oleh penggunaan kata bersayap',
	'Dead end': 'artikel tidak punya hubungan dengan artikel lain',
	'Linkrot': 'sumber referensi artikel sudah mati, dan penulisannya harus diperbaiki',
	'New unreviewed article': 'tandai artikel untuk diperiksa nanti',
	'News release': 'gaya artikel mirip seperti berita',
	'Not Indonesian': 'artikel tidak ditulis dalam bahasa Indonesia dan perlu diterjemahkan',
	'Refimprove': 'artikel perlu sumber tambahan untuk diperiksa',
	'Tense': 'artikel ditulis dalam gaya tidak sesuai',
	'Tugas sekolah': 'artikel yang sedang digunakan untuk penilaian di sekolah/universitas'
/* TODO: Incoming merge
	'Advert': 'written like an advertisement',
	'All plot': 'almost entirely a plot summary',
	'Autobiography': 'autobiography and may not be written neutrally',
	'BLP sources': 'BLP that needs additional sources for verification',
	'BLP unsourced': 'BLP that has no sources at all (use BLP PROD instead for new articles)',
	'Citation style': 'unclear or inconsistent citation style',
	'Cleanup': 'requires cleanup',
	'Cleanup bare URLs': 'uses bare URLs for references, which are prone to link rot',
	'Cleanup-PR': 'reads like a press release or news article',
	'Cleanup reorganize': "needs reorganization to comply with Wikipedia's layout guidelines",
	'Cleanup rewrite': "needs to be rewritten entirely to comply with Wikipedia's quality standards",
	'Cleanup tense': 'does not follow guidelines on use of different tenses.',
	'Close paraphrasing': 'contains close paraphrasing of a non-free copyrighted source',
	'COI': 'creator or major contributor may have a conflict of interest',
	'Condense': 'too many section headers dividing up content',
	'Confusing': 'confusing or unclear',
	'Context': 'insufficient context for those unfamiliar with the subject',
	'Copy edit': 'requires copy editing for grammar, style, cohesion, tone, or spelling',
	'Copypaste': 'appears to have been copied and pasted from another location',
	'Current': 'documents a current event',
	'Dead end': 'article has no links to other articles',
	'Disputed': 'questionable factual accuracy',
	'Essay-like': 'written like a personal reflection, personal essay, or argumentative essay',
	'Expand language': 'should be expanded with text translated from a foreign-language article',
	'Expert needed': 'needs attention from an expert on the subject',
	'External links': 'external links may not follow content policies or guidelines',
	'Fanpov': "written from a fan's point of view",
	'Fiction': 'fails to distinguish between fact and fiction',
	'Globalize': 'may not represent a worldwide view of the subject',
	'GOCEinuse': 'currently undergoing a major copy edit by the Guild of Copy Editors',
	'History merge': 'another page should be history merged into this one',
	'Hoax': 'may partially or completely be a hoax',
	'Improve categories': 'needs additional or more specific categories',
	'Incomprehensible': 'very hard to understand or incomprehensible',
	'In-universe': 'subject is fictional and needs rewriting to provide a non-fictional perspective',
	'In use': 'undergoing a major edit for a short while',
	'Lead missing': 'no lead section',
	'Lead rewrite': 'lead section needs to be rewritten to comply with guidelines',
	'Lead too long': 'lead section is too long for the length of the article',
	'Lead too short': 'lead section is too short and should be expanded to summarize key points',
	'Like resume': 'written like a resume',
	'Long plot': 'plot summary is too long or excessively detailed',
	'Manual': 'written like a manual or guidebook',
	'Merge': 'should be merged with another given article',
	'Merge from': 'another given article should be merged into this one',
	'Merge to': 'should be merged into another given article',
	'More citations needed': 'needs additional references or sources for verification',
	'More footnotes': 'has some references, but insufficient inline citations',
	'No footnotes': 'has references, but lacks inline citations',
	'No plot': 'needs a plot summary',
	'Non-free': 'may contain excessive or improper use of copyrighted materials',
	'Notability': 'subject may not meet the general notability guideline',
	'Not English': 'written in a language other than English and needs translation',
	'One source': 'relies largely or entirely on a single source',
	'Original research': 'contains original research',
	'Orphan': 'linked to from no other articles',
	'Over-coverage': 'extensive bias or disproportional coverage towards one or more specific regions',
	'Overlinked': 'too many duplicate and/or irrelevant links to other articles',
	'Overly detailed': 'excessive amount of intricate detail',
	'Over-quotation': 'too many or too-lengthy quotations for an encyclopedic entry',
	'Peacock': 'contains wording that promotes the subject in a subjective manner without adding information',
	'POV': 'does not maintain a neutral point of view',
	'Primary sources': 'relies too much on references to primary sources, and needs secondary sources',
	'Prose': 'written in a list format but may read better as prose',
	'Recentism': 'slanted towards recent events',
	'Rough translation': 'poor translation from another language',
	'Sections': 'needs to be divided into sections by topic',
	'Self-published': 'contains excessive or inappropriate references to self-published sources',
	'Sources exist': 'notable topic, sources are available that could be added to article',
	'Technical': 'too technical for most readers to understand',
	'Third-party': 'relies too heavily on sources too closely associated with the subject',
	'Tone': 'tone or style may not reflect the encyclopedic tone used on Wikipedia',
	'Too few opinions': 'may not include all significant viewpoints',
	'Uncategorized': 'not added to any categories',
	'Under construction': 'in the process of an expansion or major restructuring',
	'Underlinked': 'needs more wikilinks to other articles',
	'Undue weight': 'lends undue weight to certain ideas, incidents, or controversies',
	'Unfocused': 'lacks focus or is about more than one topic',
	'Unreferenced': 'does not cite any sources at all',
	'Unreliable sources': 'some references may not be reliable',
	'Undisclosed paid': 'may have been created or edited in return for undisclosed payments',
	'Update': 'needs additional up-to-date information added',
	'Very long': 'too long to read and navigate comfortably',
	'Weasel': 'neutrality or verifiability is compromised by the use of weasel words'
*/
};

// A list of tags in order of category
// Tags should be in alphabetical order within the categories
// Add new categories with discretion - the list is long enough as is!

Twinkle.tag.article.tagCategories = {
	'Tag rapikan dan pemeliharaan': {
		'Perapian secara umum': [
			'Cleanup',  // has a subgroup with text input
			'Cleanup rewrite',
			'Copy edit'  // has a subgroup with text input
		],
		'Mengandung konten yang tidak diinginkan': [
			'Close paraphrasing',
			'Copypaste',  // has a subgroup with text input
			'External links',
			'Non-free'
		],
		'Struktur, format, dan pengantar': [
			'Cleanup reorganize',
			'Condense',
			'Lead missing',
			'Lead rewrite',
			'Lead too long',
			'Lead too short',
			'Sections',
			'Very long'
		],
		'Perapian yang berhubungan dengan isi fiksi': [
			'All plot',
			'Fiction',
			'In-universe',
			'Long plot',
			'No plot'
		]
	},
	'Masalah konten secara umum': {
		'Kepentingan dan kelayakan': [
			'Notability'  // has a subgroup with subcategories
		],
		'Gaya penulisan': [
			'Advert',
			'Cleanup tense',
			'Essay-like',
			'Fanpov',
			'Like resume',
			'Manual',
			'Cleanup-PR',
			'Over-quotation',
			'Prose',
			'Technical',
			'Tone'
		],
		'Makna': [
			'Confusing',
			'Incomprehensible',
			'Unfocused'
		],
		'Detail dan informasi': [
			'Context',
			'Expert needed',
			'Overly detailed',
			'Undue weight'
		],
		'Keaktualan': [
			'Current',
			'Update'
		],
		'Netralitas, kecondongan dan akurasi faktual': [
			'Autobiography',
			'COI',
			'Disputed',
			'Hoax',
			'Globalize',  // has a subgroup with subcategories
			'Over-coverage',
			'Peacock',
			'POV',
			'Recentism',
			'Too few opinions',
			'Undisclosed paid',
			'Weasel'
		],
		'Pemeriksaan dan sumber': [
			'BLP sources',
			'BLP unsourced',
			'More citations needed',
			'One source',
			'Original research',
			'Primary sources',
			'Self-published',
			'Third-party',
			'Unreferenced',
			'Unreliable sources'
		]
	},
	'Masalah konten tertentu': {
		'Bahasa': [
			'Not Indonesian',  // has a subgroup with several options
			'Rough translation',  // has a subgroup with several options
			'Expand language'
		],
		'Pranala dan tautan': [
			'Orphan',
			'Overlinked',
			'Underlinked'
		],
		'Teknik pemberian referensi': [
			'Citation style',
			'Cleanup bare URLs',
			'More footnotes',
			'No footnotes'
		],
		'Kategori': [
			'Improve categories',
			'Uncategorized'
		]
	},
	'Penggabungan': [
		'History merge',
		'Merge', // these three have a subgroup with several options
		'Merge from',
		'Merge to'
	],
	'Informasi halaman': [
		'GOCEinuse',
		'In use',
		'Tugas sekolah',
		'Under construction'
		/* TODO: Incoming merge
	'Cleanup and maintenance tags': {
		'General cleanup': [
			'Cleanup',  // has a subgroup with text input
			'Cleanup rewrite',
			'Copy edit'  // has a subgroup with text input
		],
		'Potentially unwanted content': [
			'Close paraphrasing',
			'Copypaste',  // has a subgroup with text input
			'External links',
			'Non-free'
		],
		'Structure, formatting, and lead section': [
			'Cleanup reorganize',
			'Condense',
			'Lead missing',
			'Lead rewrite',
			'Lead too long',
			'Lead too short',
			'Sections',
			'Very long'
		],
		'Fiction-related cleanup': [
			'All plot',
			'Fiction',
			'In-universe',
			'Long plot',
			'No plot'
		]
	},
	'General content issues': {
		'Importance and notability': [
			'Notability'  // has a subgroup with subcategories
		],
		'Style of writing': [
			'Advert',
			'Cleanup tense',
			'Essay-like',
			'Fanpov',
			'Like resume',
			'Manual',
			'Cleanup-PR',
			'Over-quotation',
			'Prose',
			'Technical',
			'Tone'
		],
		'Sense (or lack thereof)': [
			'Confusing',
			'Incomprehensible',
			'Unfocused'
		],
		'Information and detail': [
			'Context',
			'Expert needed',
			'Overly detailed',
			'Undue weight'
		],
		'Timeliness': [
			'Current',
			'Update'
		],
		'Neutrality, bias, and factual accuracy': [
			'Autobiography',
			'COI',
			'Disputed',
			'Hoax',
			'Globalize',
			'Over-coverage',
			'Peacock',
			'POV',
			'Recentism',
			'Too few opinions',
			'Undisclosed paid',
			'Weasel'
		],
		'Verifiability and sources': [
			'BLP sources',
			'BLP unsourced',
			'More citations needed',
			'One source',
			'Original research',
			'Primary sources',
			'Self-published',
			'Sources exist',
			'Third-party',
			'Unreferenced',
			'Unreliable sources'
		]
	},
	'Specific content issues': {
		'Language': [
			'Not English',  // has a subgroup with several options
			'Rough translation',  // has a subgroup with several options
			'Expand language'
		],
		'Links': [
			'Dead end',
			'Orphan',
			'Overlinked',
			'Underlinked'
		],
		'Referencing technique': [
			'Citation style',
			'Cleanup bare URLs',
			'More footnotes',
			'No footnotes'
		],
		'Categories': [
			'Improve categories',
			'Uncategorized'
		]
	},
	'Merging': [
		'History merge',
		'Merge',   // these three have a subgroup with several options
		'Merge from',
		'Merge to'
	],
	'Informational': [
		'GOCEinuse',
		'In use',
		'Under construction'
*/
	]
};

// Contains those article tags that *do not* work inside {{multiple issues}}.
Twinkle.tag.multipleIssuesExceptions = [
	'Copypaste',
	'Current', // Works but not intended for use in MI
	'Expand language',
	'GOCEinuse',
	'History merge',
	'Improve categories',
	'In use',
	'Merge',
	'Merge from',
	'Merge to',
	'Not English',
	'Rough translation',
	'Uncategorized',
	'Under construction'
];

// Tags for REDIRECTS start here

Twinkle.tag.spellingList = [
	{
		label: '{{R from acronym}}: dialihkan dari akronim (contoh POTUS) ke bentuk panjangnya',
		value: 'R from acronym'
	},
	{
		label: '{{R from alternative spelling}}: pengalihan dari judul dengan ejaan berbeda',
		value: 'R from alternative spelling'
	},
	{
		label: '{{R from initialism}}: dialihkan dari penyingkatan (contoh ANB) ke bentuk panjangnya',
		value: 'R from initialism'
	},
	{
		label: '{{R from ASCII-only}}: pengalihan dari sebuah judul dalam ASCII dasar ke judul artikel yang formal, dengan perbedaan yang bukan berupa tanda diakritik atau sebagainya',
		value: 'R from ASCII-only'
	},
	{
		label: '{{R from member}}: pengalihan dari anggota kelompok ke topik terkait seperti kelompok, organisasi, atau tim yang ia terlibat di dalamnya',
		value: 'R from member'
	},
	{
		label: '{{R from misspelling}}: pengalihan dari kesalahan ejaan atau tipografi',
		value: 'R from misspelling'
	},
	{
		label: '{{R from modification}}: redirect from a modification of the target\'s title, such as with words rearranged',
		value: 'R from modification'
	},
	{
		label: '{{R from other capitalisation}}: pengalihan dari judul dengan metode kapitalisasi lainnya',
		value: 'R from other capitalisation'
	},
	{
		label: '{{R from plural}}: pengalihan dari kata yang menunjukkan jumlah banyak ke padanan jumlah tunggalnya',
		value: 'R from plural'
	},
	{
		label: '{{R from related word}}: pengalihan dari kata yang berkaitan',
		value: 'R from related word'
	},
	{
		label: '{{R to list entry}}: mengalihkan ke artikel berbentuk ¨entitas kecil¨ yang mengandung pemerian ringkas subjek yang tidak cukup layak untuk dipisahkan artikelnya',
		value: 'R to list entry'
	},
	{
		label: '{{R to section}}: mirip dengan {{R to list entry}}, tetapi ketika daftar disusun dalam bagian seperti daftar karakter fiksi.',
		value: 'R to section'
	},
	{
		label: '{{R with possibilities}}: pengalihan dari judul yang spesifik ke judul yang lebih umum',
		value: 'R with possibilities'
	}
];

Twinkle.tag.alternativeList = [
	{
		label: '{{R from alternative language}}: pengalihan dari nama bahasa Inggris ke nama dalam bahasa lain, atau sebaliknya',
		value: 'R from alternative language',
		subgroup: [
			{
				name: 'altLangFrom',
				type: 'input',
				label: 'From language (two-letter code): ',
				tooltip: 'Enter the two-letter code of the language the redirect name is in; such as en for English, de for German'
			},
			{
				name: 'altLangTo',
				type: 'input',
				label: 'To language (two-letter code): ',
				tooltip: 'Enter the two-letter code of the language the target name is in; such as en for English, de for German'
			},
			{
				name: 'altLangInfo',
				type: 'div',
				label: $.parseHTML('<p>For a list of language codes, see <a href="/wiki/Wp:Template_messages/Redirect_language_codes">Wikipedia:Template messages/Redirect language codes</a></p>')
			}
		]
	},
	{
		label: '{{R from alternative name}}: pengalihan dari judul dari suatu judul lain, nama lain, atau sinonim',
		value: 'R from alternative name'
	},
	{
		label: '{{R from former name}}: redirect from a former name or working title',
		value: 'R from former name'
	},
	{
		label: '{{R from historic name}}: pengalihan dari nama lain dengan sejarah yang penting mengenai sebuah wilayah, provinsi, kota, atau lainnya, yang saat ini tidak lagi dikenal dengan nama tersebut',
		value: 'R from historic name'
	},
	{ // TODO: Translate!
		label: '{{R from incorrect name}}: redirect from an erroneus name that is unsuitable as a title',
		value: 'R from incorrect name'
	},
	{
		label: '{{R from long name}}: pengalihan dari sebuah judul yang lebih lengkap',
		value: 'R from long name'
	},
	{
		label: '{{R from molecular formula}}: redirect from a molecular/chemical formula to its technical or trivial name',
		value: 'R from molecular formula'
	},
	{
		label: '{{R from name and country}}: pengalihan dari nama khusus ke nama yang lebih ringkas',
		value: 'R from name and country'
	},
	{
		label: '{{R from phrase}}: pengalihan dari sebuah frasa ke artikel yang lebih umum yang mencakup semua topik',
		value: 'R from phrase'
	},
	{
		label: '{{R from scientific name}}: pengalihan dari nama ilmiah ke nama yang umum',
		value: 'R from scientific name'
	},
	{
		label: '{{R from short name}}: redirect from a title that is a shortened form of a person\'s full name, a book title, or other more complete title',
		value: 'R from short name'
	},
	{
		label: '{{R from subtopic}}: redirect from a title that is a subtopic of the target article',
		value: 'R from subtopic'
	},
	{
		label: '{{R from surname}}: pengalihan dari sebuah judul yang merupakan nama belakang',
		value: 'R from surname'
	},
	{
		label: '{{R to diacritic}}: pengalihan ke judul dengan disertai tanda diakritik (accents, umlauts, etc.)',
		value: 'R to diacritic'
	},
	{
		label: '{{R to related topic}}: redirect to an article about a similar topic',
		value: 'R to related topic'
	},
	{
		label: '{{R to scientific name}}: pengalihan dari nama yang umum ke nama ilmiah',
		value: 'R to scientific name'
	}
];

Twinkle.tag.administrativeList = [
	{
		label: '{{R from ambiguous term}}: redirect from an ambiguous page name to a page that disambiguates it. This template should never appear on a page that has "(disambiguation)" in its title, use R to disambiguation page instead',
		value: 'R from ambiguous term'
	},
	{
		label: '{{R from CamelCase}}:  pengalihan dari judul CamelCase',
		value: 'R from CamelCase'
	},
	{
		label: '{{R to decade}}: pengalihan dari suatu tahun ke artikel dekade',
		value: 'R to decade'
	},
	{
		label: '{{R to disambiguation page}}: pengalihan ke halaman disambiguasi',
		value: 'R to disambiguation page'
	},
	{
		label: '{{R from duplicated article}}: pengalihan ke artikel serupa untuk menyimpan sejarah suntingannya',
		value: 'R from duplicated article'
	},
	{
		label: '{{R from file metadata link}}: redirect of a wikilink created from EXIF, XMP, or other information (i.e. the "metadata" section on some image description pages)',
		value: 'R from file metadata link'
	},
	{
		label: '{{R with history}}: redirect from a page containing substantive page history, kept to preserve content and attributions',
		value: 'R with history'
	},
	{
		label: '{{R from incomplete disambiguation}}: redirect from a page name that is too ambiguous to be the title of an article and should redirect to an appropriate disambiguation page',
		value: 'R from incomplete disambiguation'
	},
	{
		label: '{{R from merge}}: pengalihan dari halaman yang digabung untuk menyimpan sejarah suntingannya',
		value: 'R from merge'
	},
	{
		label: '{{R from other disambiguation}}: redirect from a page name with an alternative disambiguation qualifier',
		value: 'R from other disambiguation'
	},
	{
		label: '{{R printworthy}}: redirect from a title that would be helpful in a printed or CD/DVD version of Wikipedia',
		value: 'R printworthy'
	},
	{
		label: '{{R from school}}: pengalihan dari artikel sekolah yang mengandung sedikit informasi',
		value: 'R from school'
	},
	{
		label: '{{R from shortcut}}: pengalihan dari pintasan Wikipedia',
		value: 'R from shortcut'
	},
	{
		label: '{{R from sort name}}: redirect from the target\'s sort name, such as beginning with their surname rather than given name',
		value: 'R from sort name'
	},
	{
		label: '{{R unprintworthy}}: redirect from a title that would NOT be helpful in a printed or CD/DVD version of Wikipedia',
		value: 'R unprintworthy'
	}
];

// maintenance tags for FILES start here

Twinkle.tag.file = {};

Twinkle.tag.file.licenseList = [
	{ label: '{{Bsr}}: informasi sumber terdiri dari URL kasar', value: 'Bsr' },
	{ label: '{{Non-free reduce}}: gambar penggunaan wajar yang beresolusi tinggi (atau klip suara yang panjang, dsb.)', value: 'Non-free reduce' },
	{ label: '{{Orphaned non-free revisions}}: media penggunaan wajar dengan revisi lama yang perlu dihapus', value: 'subst:orfurrev' }
];

Twinkle.tag.file.commonsList = [
	{ label: '{{Copy to Commons}}: media bebas yang perlu dipindahkan ke Commons', value: 'Copy to Commons' },
	{ label: '{{Do not move to Commons}} (masalah domain umum): berkas berlisensi domain umum di AS namun tidak dengan negara asalnya', value: 'Do not move to Commons' },
	{
		label: '{{Do not move to Commons}} (alasan lain)',
		value: 'Jangan pindahkan ke Commons Commons_reason',
		subgroup: {
			type: 'input',
			name: 'DoNotMoveToCommons',
			label: 'Alasan: ',
			tooltip: 'Masukkan alasan mengapa berkas ini tidak layak dipindahkan ke Commons (diperlukan)'
		}
	},
	{
		label: '{{Keep local}}: permintaan untuk menyimpan salinan lokal dari berkas Commons',
		value: 'Keep local',
		subgroup: {
			type: 'input',
			name: 'keeplocalName',
			label: 'Nama berkas di Commons, jika berbeda: ',
			tooltip: 'Nama berkas di Commons, jika nama berkas tidak sama, jangan taruh awalan "Berkas:":'
		}
	},
	{
		label: '{{Now Commons}}: berkas sudah dipindahkan ke Commons',
		value: 'subst:ncd',
		subgroup: {
			type: 'input',
			name: 'ncdName',
			label: 'Nama berkas di Commons, jika berbeda: ',
			tooltip: 'Nama berkas di Commons, jika nama berkas tidak sama, jangan taruh awalan "Berkas:":'
		}
	}
];

Twinkle.tag.file.cleanupList = [
	{ label: '{{Artifacts}}: PNG mengandung artefak sisa kompresi', value: 'Artifacts' },
	{ label: '{{Bad font}}: SVG menggunakan huruf yang tidak tersedia di peladen miniatur', value: 'Bad font' },
	{ label: '{{Bad format}}: berkas PDF/DOC/... harus diubah ke format yang lebih umum/berguna', value: 'Bad format' },
	{ label: '{{Bad GIF}}: GIF yang harus diganti dengan PNG, JPEG, atau SVG', value: 'Bad GIF' },
	{ label: '{{Bad JPEG}}: JPEG yang harus diganti dengan PNG atau SVG', value: 'Bad JPEG' },
	{ label: '{{Bad trace}}: sisa SVG yang perlu dibersihkan', value: 'Bad trace' },
	{
		label: '{{Cleanup image}}: perapian umum', value: 'Cleanup image',
		subgroup: {
			type: 'input',
			name: 'cleanupimageReason',
			label: 'Alasan: ',
			tooltip: 'Masukkan alasan perapian (diperlukan)'
		}
	},
	{ label: '{{ClearType}}: gambar (selain tangkapan layar) dengan anti-aliasing ClearType', value: 'ClearType' },
	{ label: '{{Imagewatermark}}: gambar mengandung tanda air yang tampak', value: 'Imagewatermark' },
	{ label: '{{NoCoins}}: gambar menggunakan koin untuk mengindikasikan skala', value: 'NoCoins' },
	{ label: '{{Overcompressed JPEG}}: JPEG dengan artefak tingkat tinggi', value: 'Overcompressed JPEG' },
	{ label: '{{Opaque}}: latar belakang yang perlu dibuat transparan', value: 'Opaque' },
	{ label: '{{Remove border}}: garis pinggir, bagian putih, dsb. yang tak diperlukan', value: 'Remove border' },
	{
		label: '{{Rename media}}: nama berkas perlu diubah, sesuai kriteria',
		value: 'Rename media',
		subgroup: [
			{
				type: 'input',
				name: 'renamemediaNewname',
				label: 'Nama baru: ',
				tooltip: 'Masukkan nama baru berkas ini (opsional)'
			},
			{
				type: 'input',
				name: 'renamemediaReason',
				label: 'Alasan: ',
				tooltip: 'Masukkan alasan perubahan nama ini (opsional)'
			}
		]
	},
	{ label: '{{Should be PNG}}: GIF atau JPEG harus berbentuk "lossless"', value: 'Should be PNG' },
	{
		label: '{{Should be SVG}}: PNG, GIF atau JPEG harus berupa grafik vektor', value: 'Should be SVG',
		subgroup: {
			name: 'svgCategory',
			type: 'select',
			list: [
				{ label: '{{Should be SVG|other}}', value: 'other' },
				{ label: '{{Should be SVG|alphabet}}: gambar karakter, contoh huruf, dsb.', value: 'alphabet' },
				{ label: '{{Should be SVG|chemical}}: diagram kimia, dsb.', value: 'chemical' },
				{ label: '{{Should be SVG|circuit}}: diagram sirkuit elektronik, dsb.', value: 'circuit' },
				{ label: '{{Should be SVG|coat of arms}}: lambang negara', value: 'coat of arms' },
				{ label: '{{Should be SVG|diagram}}: diagram yang tidak sesuai dengan subkategori lain', value: 'diagram' },
				{ label: '{{Should be SVG|emblem}}: emblem, logo bebas, dsb.', value: 'emblem' },
				{ label: '{{Should be SVG|fair use}}: gambar atau logo untuk penggunaan wajar', value: 'fair use' },
				{ label: '{{Should be SVG|flag}}: bendera', value: 'flag' },
				{ label: '{{Should be SVG|graph}}: plot visual data', value: 'graph' },
				{ label: '{{Should be SVG|logo}}: logo', value: 'logo' },
				{ label: '{{Should be SVG|map}}: peta', value: 'map' },
				{ label: '{{Should be SVG|music}}: notasi musik, dsb.', value: 'music' },
				{ label: '{{Should be SVG|physical}}: gambar "realistis" dari objek fisik, manusia, dsb.', value: 'physical' },
				{ label: '{{Should be SVG|symbol}}: simbol, ikon lainnya, dsb.', value: 'symbol' }
			]
		}
	},
	{ label: '{{Should be text}}: gambar harus diganti dengan teks, tabel, atau kode matematika', value: 'Should be text' }
];

Twinkle.tag.file.qualityList = [
	{ label: '{{Image-blownout}}', value: 'Image-blownout' },
	{ label: '{{Image-out-of-focus}}', value: 'Image-out-of-focus' },
	{
		label: '{{Image-Poor-Quality}}', value: 'Image-Poor-Quality',
		subgroup: {
			type: 'input',
			name: 'ImagePoorQualityReason',
			label: 'Reason: ',
			tooltip: 'Enter the reason why this image is so bad (required)'
		}
	},
	{ label: '{{Image-underexposure}}', value: 'Image-underexposure' },
	{
		label: '{{Low quality chem}}: struktur kimia yang dipertentangkan', value: 'Low quality chem',
		subgroup: {
			type: 'input',
			name: 'lowQualityChemReason',
			label: 'Alasan: ',
			tooltip: 'Masukkan alasan mengapa diagram ini dipertentangkan (diperlukan)'
		}
	}
];

Twinkle.tag.file.replacementList = [
	{ label: '{{Obsolete}}: berkas baru telah tersedia', value: 'Obsolete' },
	{ label: '{{PNG version available}}', value: 'PNG version available' },
	{ label: '{{Vector version available}}', value: 'Vector version available' }
];
Twinkle.tag.file.replacementList.forEach(function(el) {
	el.subgroup = {
		type: 'input',
		label: 'Replacement file: ',
		tooltip: 'Enter the name of the file which replaces this one (required)',
		name: el.value.replace(/ /g, '_') + 'File'
	};
});


Twinkle.tag.callbacks = {
	article: function articleCallback(pageobj) {

		// Remove tags that become superfluous with this action
		var pageText = pageobj.getPageText().replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
		var params = pageobj.getCallbackParameters();

		/**
		 * Saves the page following the removal of tags if any. The last step.
		 * Called from removeTags()
		 */
		var postRemoval = function() {
			if (params.tagsToRemove.length) {
				// Remove empty {{multiple issues}} if found
				pageText = pageText.replace(/\{\{(multiple ?issues|article ?issues|mi)\s*\|\s*\}\}\n?/im, '');
				// Remove single-element {{multiple issues}} if found
				pageText = pageText.replace(/\{\{(?:multiple ?issues|article ?issues|mi)\s*\|\s*(\{\{[^}]+\}\})\s*\}\}/im, '$1');
			}

			// Build edit summary
			var makeSentence = function(array) {
				if (array.length < 3) {
					return array.join(' and ');
				}
				var last = array.pop();
				return array.join(', ') + ', and ' + last;
			};
			var makeTemplateLink = function(tag) {
				var text = '{{[[';
				// if it is a custom tag with a parameter
				if (tag.indexOf('|') !== -1) {
					tag = tag.slice(0, tag.indexOf('|'));
				}
				text += tag.indexOf(':') !== -1 ? tag : 'Template:' + tag + '|' + tag;
				return text + ']]}}';
			};

			var summaryText;
			var addedTags = params.tags.map(makeTemplateLink);
			var removedTags = params.tagsToRemove.map(makeTemplateLink);
			if (addedTags.length) {
				summaryText = 'Added ' + makeSentence(addedTags);
				summaryText += removedTags.length ? '; and removed ' + makeSentence(removedTags) : '';
			} else {
				summaryText = 'Removed ' + makeSentence(removedTags);
			}
			summaryText += ' tag' + (addedTags.length + removedTags.length > 1 ? 's' : '');
			if (params.reason) {
				summaryText += ': ' + params.reason;
			}

			// avoid truncated summaries
			if (summaryText.length > (499 - Twinkle.getPref('summaryAd').length)) {
				summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
			}

			pageobj.setPageText(pageText);
			pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
			pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
			pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save(function() {
				// special functions for merge tags
				if (params.mergeReason) {
					// post the rationale on the talk page (only operates in main namespace)
					var talkpageText = '\n\n== ' + params.talkDiscussionTitleLinked + ' ==\n\n';
					talkpageText += params.mergeReason.trim() + ' ~~~~';
					var talkpage = new Morebits.wiki.page('Talk:' + params.discussArticle, 'Posting rationale on talk page');
					talkpage.setAppendText(talkpageText);
					talkpage.setEditSummary('/* ' + params.talkDiscussionTitle + ' */ new section' + Twinkle.getPref('summaryAd'));
					talkpage.setWatchlist(Twinkle.getPref('watchMergeDiscussions'));
					talkpage.setCreateOption('recreate');
					talkpage.append();
				}
				if (params.mergeTagOther) {
					// tag the target page if requested
					var otherTagName = 'Merge';
					if (params.mergeTag === 'Merge from') {
						otherTagName = 'Merge to';
					} else if (params.mergeTag === 'Merge to') {
						otherTagName = 'Merge from';
					}
					var newParams = {
						tags: [otherTagName],
						tagsToRemove: [],
						tagsToRemain: [],
						mergeTarget: Morebits.pageNameNorm,
						discussArticle: params.discussArticle,
						talkDiscussionTitle: params.talkDiscussionTitle,
						talkDiscussionTitleLinked: params.talkDiscussionTitleLinked
					};
					var otherpage = new Morebits.wiki.page(params.mergeTarget, 'Tagging other page (' +
						params.mergeTarget + ')');
					otherpage.setCallbackParameters(newParams);
					otherpage.load(Twinkle.tag.callbacks.article);
				}

				// post at WP:PNT for {{not English}} and {{rough translation}} tag
				if (params.translationPostAtPNT) {
					var pntPage = new Morebits.wiki.page('Wikipedia:Pages needing translation into English',
						'Listing article at Wikipedia:Pages needing translation into English');
					pntPage.setFollowRedirect(true);
					pntPage.load(function friendlytagCallbacksTranslationListPage(pageobj) {
						var old_text = pageobj.getPageText();

						var template = params.tags.indexOf('Rough translation') !== -1 ? 'duflu' : 'needtrans';
						var lang = params.translationLanguage;
						var reason = params.translationComments;

						var templateText = '{{subst:' + template + '|pg=' + Morebits.pageNameNorm + '|Language=' +
							(lang || 'uncertain') + '|Comments=' + reason.trim() + '}} ~~~~';

						var text, summary;
						if (template === 'duflu') {
							text = old_text + '\n\n' + templateText;
							summary = 'Translation cleanup requested on ';
						} else {
							text = old_text.replace(/\n+(==\s?Translated pages that could still use some cleanup\s?==)/,
								'\n\n' + templateText + '\n\n$1');
							summary = 'Translation' + (lang ? ' from ' + lang : '') + ' requested on ';
						}

						if (text === old_text) {
							pageobj.getStatusElement().error('failed to find target spot for the discussion');
							return;
						}
						pageobj.setPageText(text);
						pageobj.setEditSummary(summary + ' [[:' + Morebits.pageNameNorm + ']]' + Twinkle.getPref('summaryAd'));
						pageobj.setCreateOption('recreate');
						pageobj.save();
					});
				}
				if (params.translationNotify) {
					pageobj.lookupCreation(function(innerPageobj) {
						var initialContrib = innerPageobj.getCreator();

						// Disallow warning yourself
						if (initialContrib === mw.config.get('wgUserName')) {
							innerPageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
							return;
						}

						var userTalkPage = new Morebits.wiki.page('User talk:' + initialContrib,
							'Notifying initial contributor (' + initialContrib + ')');
						var notifytext = '\n\n== Your article [[' + Morebits.pageNameNorm + ']]==\n' +
							'{{subst:uw-notenglish|1=' + Morebits.pageNameNorm +
							(params.translationPostAtPNT ? '' : '|nopnt=yes') + '}} ~~~~';
						userTalkPage.setAppendText(notifytext);
						userTalkPage.setEditSummary('Notice: Please use English when contributing to the English Wikipedia.' +
							Twinkle.getPref('summaryAd'));
						userTalkPage.setCreateOption('recreate');
						userTalkPage.setFollowRedirect(true);
						userTalkPage.append();
					});
				}
			});

			if (params.patrol) {
				pageobj.triage();
			}
		};

		/**
		 * Removes the existing tags that were deselected (if any)
		 * Calls postRemoval() when done
		 */
		var removeTags = function removeTags() {

			if (params.tagsToRemove.length === 0) {
				postRemoval();
				return;
			}

			Morebits.status.info('Info', 'Removing deselected tags that were already present');

			var getRedirectsFor = [];

			// Remove the tags from the page text, if found in its proper name,
			// otherwise moves it to `getRedirectsFor` array earmarking it for
			// later removal
			params.tagsToRemove.forEach(function removeTag(tag) {
				var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?');

				if (tag_re.test(pageText)) {
					pageText = pageText.replace(tag_re, '');
				} else {
					getRedirectsFor.push('Template:' + tag);
				}
			});

			if (!getRedirectsFor.length) {
				postRemoval();
				return;
			}

			// Remove tags which appear in page text as redirects
			var api = new Morebits.wiki.api('Getting template redirects', {
				'action': 'query',
				'prop': 'linkshere',
				'titles': getRedirectsFor.join('|'),
				'redirects': 1,  // follow redirect if the class name turns out to be a redirect page
				'lhnamespace': '10',  // template namespace only
				'lhshow': 'redirect',
				'lhlimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
			}, function removeRedirectTag(apiobj) {

				$(apiobj.responseXML).find('page').each(function(idx, page) {
					var removed = false;
					$(page).find('lh').each(function(idx, el) {
						var tag = $(el).attr('title').slice(9);
						var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?');
						if (tag_re.test(pageText)) {
							pageText = pageText.replace(tag_re, '');
							removed = true;
							return false;   // break out of $.each
						}
					});
					if (!removed) {
						Morebits.status.warn('Info', 'Failed to find {{' +
						$(page).attr('title').slice(9) + '}} on the page... excluding');
					}

				});

				postRemoval();

			});
			api.post();

		};

		if (!params.tags.length) {
			removeTags();
			return;
		}

		var tagRe, tagText = '', tags = [], groupableTags = [], groupableExistingTags = [];
		// Executes first: addition of selected tags

		/**
		 * Updates `tagText` with the syntax of `tagName` template with its parameters
		 * @param {number} tagIndex
		 * @param {string} tagName
		 */
		var addTag = function articleAddTag(tagIndex, tagName) {
			var currentTag = '';
			if (tagName === 'Uncategorized' || tagName === 'Improve categories') {
				pageText += '\n\n{{' + tagName + '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
			} else {
				currentTag += '{{' + tagName;
				// fill in other parameters, based on the tag
				switch (tagName) {
					case 'Cleanup':
						currentTag += '|reason=' + params.cleanup;
						break;
					case 'Close paraphrasing':
						currentTag += '|source=' + params.closeParaphrasing;
						break;
					case 'Copy edit':
						if (params.copyEdit) {
							currentTag += '|for=' + params.copyEdit;
						}
						break;
					case 'Copypaste':
						if (params.copypaste) {
							currentTag += '|url=' + params.copypaste;
						}
						break;
					case 'Expand language':
						currentTag += '|topic=';
						currentTag += '|langcode=' + params.expandLanguageLangCode;
						if (params.expandLanguageArticle !== null) {
							currentTag += '|otherarticle=' + params.expandLanguageArticle;
						}
						break;
					case 'Expert needed':
						if (params.expertNeeded) {
							currentTag += '|1=' + params.expertNeeded;
						}
						if (params.expertNeededTalk) {
							currentTag += '|talk=' + params.expertNeededTalk;
						}
						if (params.expertNeededReason) {
							currentTag += '|reason=' + params.expertNeededReason;
						}
						break;
					case 'Globalize':
						currentTag += '|1=article';
						if (params.globalizeRegion) {
							currentTag += '|2=' + params.globalizeRegion;
						}
						break;
					case 'News release':
						currentTag += '|1=article';
						break;
					case 'Notability':
						if (params.notability !== 'none') {
							currentTag += '|' + params.notability;
						}
						break;
					case 'Not Indonesian':
					case 'Not English':
					case 'Rough translation':
						if (params.translationLanguage) {
							currentTag += '|1=' + params.translationLanguage;
						}
						if (params.translationPostAtPNT) {
							currentTag += '|listed=yes';
						}
						break;
					case 'History merge':
						currentTag += '|originalpage=' + params.histmergeOriginalPage;
						if (params.histmergeReason) {
							currentTag += '|reason=' + params.histmergeReason;
						}
						if (params.histmergeSysopDetails) {
							currentTag += '|details=' + params.histmergeSysopDetails;
						}
						break;
					case 'Merge':
					case 'Merge to':
					case 'Merge from':
						params.mergeTag = tagName;
						// normalize the merge target for now and later
						params.mergeTarget = Morebits.string.toUpperCaseFirstChar(params.mergeTarget.replace(/_/g, ' '));

						currentTag += '|' + params.mergeTarget;

						// link to the correct section on the talk page, for article space only
						if (mw.config.get('wgNamespaceNumber') === 0 && (params.mergeReason || params.discussArticle)) {
							if (!params.discussArticle) {
								// discussArticle is the article whose talk page will contain the discussion
								params.discussArticle = tagName === 'Merge to' ? params.mergeTarget : mw.config.get('wgTitle');
								// nonDiscussArticle is the article which won't have the discussion
								params.nonDiscussArticle = tagName === 'Merge to' ? mw.config.get('wgTitle') : params.mergeTarget;
								var direction = '[[' + params.nonDiscussArticle + ']]' + (params.mergeTag === 'Merge' ? ' with ' : ' into ') + '[[' + params.discussArticle + ']]';
								params.talkDiscussionTitleLinked = 'Diusulkan digabung dengan ' + direction;
								params.talkDiscussionTitle = params.talkDiscussionTitleLinked.replace(/\[\[(.*?)\]\]/g, '$1');
							}
							currentTag += '|discuss=Talk:' + params.discussArticle + '#' + params.talkDiscussionTitle;
						}
						break;
					default:
						break;
				}

				currentTag += '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}\n';
				tagText += currentTag;
			}
		};

		/**
		 * Adds the tags which go outside {{multiple issues}}, either because
		 * these tags aren't supported in {{multiple issues}} or because
		 * {{multiple issues}} is not being added to the page at all
		 */
		var addUngroupedTags = function() {
			$.each(tags, addTag);

			// Smartly insert the new tags after any hatnotes or
			// afd, csd, or prod templates or hatnotes. Regex is
			// extra complicated to allow for templates with
			// parameters and to handle whitespace properly.
			pageText = pageText.replace(
				new RegExp(
					// leading whitespace
					'^\\s*' +
					// capture template(s)
					'(?:((?:\\s*' +
					// AfD is special, as the tag includes html comments before and after the actual template
					'(?:<!--.*AfD.*\\n\\{\\{(?:Article for deletion\\/dated|AfDM).*\\}\\}\\n<!--.*(?:\\n<!--.*)?AfD.*(?:\\s*\\n))?|' + // trailing whitespace/newline needed since this subst's a newline
					// begin template format
					'\\{\\{\\s*(?:' +
					// CSD
					'db|delete|db-.*?|speedy deletion-.*?|' +
					// PROD
					'(?:proposed deletion|prod blp)\\/dated(?:\\s*\\|(?:concern|user|timestamp|help).*)+|' +
					// various hatnote templates
					'about|correct title|dablink|distinguish|for|other\\s?(?:hurricaneuses|people|persons|places|uses(?:of)?)|redirect(?:-acronym)?|see\\s?(?:also|wiktionary)|selfref|short description|the' +
					// not a hatnote, but sometimes under a CSD or AfD
					'|salt|proposed deletion endorsed' +
					// end main template name, optionally with a number (such as redirect2)
					')\\d*\\s*' +
					// template parameters
					'(\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?' +
					// end template format
					'\\}\\})+' +
					// end capture
					'(?:\\s*\\n)?)' +
					// trailing whitespace
					'\\s*)?',
					'i'), '$1' + tagText
			);

			removeTags();
		};

		// Separate tags into groupable ones (`groupableTags`) and non-groupable ones (`tags`)
		params.tags.forEach(function(tag) {
			tagRe = new RegExp('\\{\\{' + tag + '(\\||\\}\\})', 'im');
			// regex check for preexistence of tag can be skipped if in canRemove mode
			if (Twinkle.tag.canRemove || !tagRe.exec(pageText)) {
				// condition Twinkle.tag.article.tags[tag] to ensure that its not a custom tag
				// Custom tags are assumed non-groupable, since we don't know whether MI template supports them
				if (Twinkle.tag.article.tags[tag] && Twinkle.tag.multipleIssuesExceptions.indexOf(tag) === -1) {
					groupableTags.push(tag);
				} else {
					tags.push(tag);
				}
			} else {
				if (tag === 'Merge from' || tag === 'History merge') {
					tags.push(tag);
				} else {
					Morebits.status.warn('Info', 'Ditemukan tag {{' + tag +
						'}} di artikel tersebut... membatalkan');
					// don't do anything else with merge tags
					if (['Merge', 'Merge to'].indexOf(tag) !== -1) {
						params.mergeTarget = params.mergeReason = params.mergeTagOther = null;
					}
				}
			}
		});

		// To-be-retained existing tags that are groupable
		params.tagsToRemain.forEach(function(tag) {
			if (Twinkle.tag.multipleIssuesExceptions.indexOf(tag) === -1) {
				groupableExistingTags.push(tag);
			}
		});

		var miTest = /\{\{(multiple ?issues|article ?issues|mi)(?!\s*\|\s*section\s*=)[^}]+\{/im.exec(pageText);

		if (miTest && groupableTags.length > 0) {
			Morebits.status.info('Info', 'Menambah tag yang lain ke dalam tag {{multiple issues}} yang telah ada');

			tagText = '';
			$.each(groupableTags, addTag);

			var miRegex = new RegExp('(\\{\\{\\s*' + miTest[1] + '\\s*(?:\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?)\\}\\}\\s*', 'im');
			pageText = pageText.replace(miRegex, '$1' + tagText + '}}\n');
			tagText = '';

			addUngroupedTags();

		} else if (params.group && !miTest && (groupableExistingTags.length + groupableTags.length) >= 2) {
			Morebits.status.info('Info', 'Mengelompokkan tag yang didukung ke dalam {{multiple issues}}');

			tagText += '{{Multiple issues|\n';

			/**
			 * Adds newly added tags to MI
			 */
			var addNewTagsToMI = function() {
				$.each(groupableTags, addTag);
				tagText += '}}\n';

				addUngroupedTags();
			};


			var getRedirectsFor = [];

			// Reposition the tags on the page into {{multiple issues}}, if found with its
			// proper name, else moves it to `getRedirectsFor` array to be handled later
			groupableExistingTags.forEach(function repositionTagIntoMI(tag) {
				var tag_re = new RegExp('(\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?)');
				if (tag_re.test(pageText)) {
					tagText += tag_re.exec(pageText)[1];
					pageText = pageText.replace(tag_re, '');
				} else {
					getRedirectsFor.push('Template:' + tag);
				}
			});

			if (!getRedirectsFor.length) {
				addNewTagsToMI();
				return;
			}

			var api = new Morebits.wiki.api('Getting template redirects', {
				'action': 'query',
				'prop': 'linkshere',
				'titles': getRedirectsFor.join('|'),
				'redirects': 1,
				'lhnamespace': '10', // template namespace only
				'lhshow': 'redirect',
				'lhlimit': 'max' // 500 is max for normal users, 5000 for bots and sysops
			}, function replaceRedirectTag(apiobj) {
				$(apiobj.responseXML).find('page').each(function(idx, page) {
					var found = false;
					$(page).find('lh').each(function(idx, el) {
						var tag = $(el).attr('title').slice(9);
						var tag_re = new RegExp('(\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?)');
						if (tag_re.test(pageText)) {
							tagText += tag_re.exec(pageText)[1];
							pageText = pageText.replace(tag_re, '');
							found = true;
							return false;   // break out of $.each
						}
					});
					if (!found) {
						Morebits.status.warn('Info', 'Failed to find the existing {{' +
						$(page).attr('title').slice(9) + '}} on the page... skip repositioning');
					}
				});
				addNewTagsToMI();
			});
			api.post();

		} else {
			tags = tags.concat(groupableTags);
			addUngroupedTags();
		}
	},

	redirect: function redirect(pageobj) {
		var params = pageobj.getCallbackParameters(),
			pageText = pageobj.getPageText(),
			tagRe, tagText = '', summaryText = 'Added',
			tags = [], i;

		for (i = 0; i < params.tags.length; i++) {
			tagRe = new RegExp('(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im');
			if (!tagRe.exec(pageText)) {
				tags.push(params.tags[i]);
			} else {
				Morebits.status.warn('Info', 'Found {{' + params.tags[i] +
					'}} on the redirect already...excluding');
			}
		}

		var addTag = function redirectAddTag(tagIndex, tagName) {
			tagText += '\n{{' + tagName;
			if (tagName === 'R from alternative language') {
				if (params.altLangFrom) {
					tagText += '|from=' + params.altLangFrom;
				}
				if (params.altLangTo) {
					tagText += '|to=' + params.altLangTo;
				}
			}
			tagText += '}}';

			if (tagIndex > 0) {
				if (tagIndex === (tags.length - 1)) {
					summaryText += ' and';
				} else if (tagIndex < (tags.length - 1)) {
					summaryText += ',';
				}
			}

			summaryText += ' {{[[:' + (tagName.indexOf(':') !== -1 ? tagName : 'Template:' + tagName + '|' + tagName) + ']]}}';
		};

		tags.sort();
		$.each(tags, addTag);

		// Check for all Rcat shell redirects (from #433)
		if (pageText.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
			// Regex inspired by [[User:Kephir/gadgets/sagittarius.js]] ([[Special:PermaLink/831402893]])
			var oldTags = pageText.match(/(\s*{{[A-Za-z ]+\|)((?:[^|{}]*|{{[^}]*}})+)(}})\s*/i);
			pageText = pageText.replace(oldTags[0], oldTags[1] + tagText + oldTags[2] + oldTags[3]);
		} else {
			// Fold any pre-existing Rcats into taglist and under Rcatshell
			var pageTags = pageText.match(/\n{{R(?:edirect)? .*?}}/img);
			var oldPageTags = '';
			if (pageTags) {
				pageTags.forEach(function(pageTag) {
					var pageRe = new RegExp(pageTag, 'img');
					pageText = pageText.replace(pageRe, '');
					oldPageTags += pageTag;
				});
			}
			pageText += '\n{{Redirect category shell|' + tagText + oldPageTags + '\n}}';
		}

		summaryText += (tags.length > 0 ? ' tag' + (tags.length > 1 ? 's' : '') : '') + ' to redirect';

		// avoid truncated summaries
		if (summaryText.length > (499 - Twinkle.getPref('summaryAd').length)) {
			summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, '$1');
		}

		pageobj.setPageText(pageText);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.triage();
		}

	},

	file: function friendlytagCallbacksFile(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var summary = 'Menambahkan ';

		// Add maintenance tags
		if (params.tags.length) {

			var tagtext = '', currentTag;
			$.each(params.tags, function(k, tag) {
				// when other commons-related tags are placed, remove "move to Commons" tag
				if (['Keep local', 'subst:ncd', 'Jangan pindahkan ke Commons Commons_reason', 'Do not move to Commons',
					'Now Commons'].indexOf(tag) !== -1) {
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
				}

				currentTag = '{{' + (tag === 'Jangan pindahkan ke Commons Commons_reason' ? 'Do not move to Commons' : tag);

				switch (tag) {
					case 'subst:ncd':
						if (params.ncdName !== '') {
							currentTag += '|1=' + params.ncdName;
						}
						break;
					case 'Keep local':
						if (params.keeplocalName !== '') {
							currentTag += '|1=' + params.keeplocalName;
						}
						break;
					case 'Rename media':
						if (params.renamemediaNewname !== '') {
							currentTag += '|1=' + params.renamemediaNewname;
						}
						if (params.renamemediaReason !== '') {
							currentTag += '|2=' + params.renamemediaReason;
						}
						break;
					case 'Cleanup image':
						currentTag += '|1=' + params.cleanupimageReason;
						break;
					case 'Image-Poor-Quality':
						currentTag += '|1=' + params.ImagePoorQualityReason;
						break;
					case 'Low quality chem':
						currentTag += '|1=' + params.lowQualityChemReason;
						break;
					case 'Vector version available':
						text = text.replace(/\{\{((convert to |convertto|should be |shouldbe|to)?svg|badpng|vectorize)[^}]*\}\}/gi, '');
						/* falls through */
					case 'PNG version available':
						/* falls through */
					case 'Obsolete':
						currentTag += '|1=' + params[tag.replace(/ /g, '_') + 'File'];
						break;
					case 'Jangan pindahkan ke Commons Commons_reason':
						currentTag += '|reason=' + params.DoNotMoveToCommons;
						break;
					case 'subst:orfurrev':
						// remove {{non-free reduce}} and redirects
						text = text.replace(/\{\{\s*(Template\s*:\s*)?(Non-free reduce|FairUseReduce|Fairusereduce|Fair Use Reduce|Fair use reduce|Reduce size|Reduce|Fair-use reduce|Image-toobig|Comic-ovrsize-img|Non-free-reduce|Nfr|Smaller image|Nonfree reduce)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
						currentTag += '|date={{subst:date}}';
						break;
					case 'Copy to Commons':
						currentTag += '|human=' + mw.config.get('wgUserName');
						break;
					case 'Should be SVG':
						currentTag += '|' + params.svgCategory;
						break;
					default:
						break;  // don't care
				}

				currentTag += '}}\n';

				tagtext += currentTag;
				summary += '{{' + tag + '}}, ';
			});

			if (!tagtext) {
				pageobj.getStatusElement().warn('Tindakan pengguna dibatalkan; tugas tidak dilanjutkan');
				return;
			}

			text = tagtext + text;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summary.substring(0, summary.length - 2) + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.triage();
		}
	}
};

Twinkle.tag.callback.evaluate = function friendlytagCallbackEvaluate(e) {
	var form = e.target;
	var params = {};
	if (form.patrolPage) {
		params.patrol = form.patrolPage.checked;
	}

	// Don't return null if there aren't any available tags
	params.tags = form.getChecked(Twinkle.tag.mode + 'Tags') || [];

	// Save values of input fields into params object. This works as quickform input
	// fields within subgroups of elements with name 'articleTags' (say) have their
	// name attribute as 'articleTags.' + name of the subgroup element

	var name_prefix = Twinkle.tag.mode + 'Tags.';
	$(form).find("[name^='" + name_prefix + "']:not(div)").each(function(idx, el) {
		// el are the HTMLInputElements, el.name gives the name attribute
		params[el.name.slice(name_prefix.length)] =
			el.type === 'checkbox' ? form[el.name].checked : form[el.name].value;
	});

	switch (Twinkle.tag.mode) {
		case 'article':
			params.tagsToRemove = form.getUnchecked('alreadyPresentArticleTags') || [];
			params.tagsToRemain = form.getChecked('alreadyPresentArticleTags') || [];
			params.reason = form.reason.value.trim();

			params.group = form.group.checked;

			// Validation
			if ((params.tags.indexOf('Merge') !== -1) || (params.tags.indexOf('Merge from') !== -1) ||
				(params.tags.indexOf('Merge to') !== -1)) {
				if (((params.tags.indexOf('Merge') !== -1) + (params.tags.indexOf('Merge from') !== -1) +
					(params.tags.indexOf('Merge to') !== -1)) > 1) {
					alert('Please select only one of {{merge}}, {{merge from}}, and {{merge to}}. If several merges are required, use {{merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).');
					return;
				}
				if (!params.mergeTarget) {
					alert('Please specify the title of the other article for use in the merge template.');
					return;
				}
				if ((params.mergeTagOther || params.mergeReason) && params.mergeTarget.indexOf('|') !== -1) {
					alert('Tagging multiple articles in a merge, and starting a discussion for multiple articles, is not supported at the moment. Please turn off "tag other article", and/or clear out the "reason" box, and try again.');
					return;
				}
			}
			if ((params.tags.indexOf('Not Indonesian') !== -1) && (params.tags.indexOf('Rough translation') !== -1)) {
				alert('Please select only one of {{not Indonesian}} and {{rough translation}}.');
				return;
			}
			if (params.tags.indexOf('History merge') !== -1 && params.histmergeOriginalPage.trim() === '') {
				alert('You must specify a page to be merged for the {{history merge}} tag.');
				return;
			}
			if (params.tags.indexOf('Cleanup') !== -1 && params.cleanup.trim() === '') {
				alert('You must specify a reason for the {{cleanup}} tag.');
				return;
			}
			if (params.tags.indexOf('Expand language') !== -1 && params.expandLanguageLangCode.trim() === '') {
				alert('You must specify language code for the {{expand language}} tag.');
				return;
			}
			break;

		case 'file':

			if (params.tags.indexOf('Cleanup image') !== -1 && params.cleanupimageReason === '') {
				alert('You must specify a reason for the cleanup tag.');
				return;
			}
			if (params.tags.indexOf('Image-Poor-Quality') !== -1 && params.ImagePoorQualityReason === '') {
				alert('You must specify a reason for the {{Image-Poor-Quality}} tag');
				return;
			}
			if (params.tags.indexOf('Low Quality Chem') !== -1 && params.lowQualityChemReason === '') {
				alert('You must specify a reason for the {{Low Quality Chem}} tag');
				return;
			}
			if ((params.tags.indexOf('Obsolete') !== -1 && params.ObsoleteFile === '') ||
				(params.tags.indexOf('PNG version available') !== -1 && params.PNG_version_availableFile === '') ||
				(params.tags.indexOf('Vector version available') !== -1 && params.Vector_version_availableFile === '')
			) {
				alert('You must specify the replacement file name for a tag in the Replacement tags list');
				return;
			}
			if (params.tags.indexOf('Jangan pindahkan ke Commons Commons_reason') !== -1 && params.DoNotMoveToCommons === '') {
				alert('You must specify a reason for the {{Do not move to Commons}} tag');
				return;
			}
			break;

		case 'redirect':
			break;

		default:
			alert('Twinkle.tag: moda tak dikenal ' + Twinkle.tag.mode);
			break;
	}

	// File/redirect: return if no tags selected
	// Article: return if no tag is selected and no already present tag is deselected
	if (params.tags.length === 0 && (Twinkle.tag.mode !== 'article' || params.tagsToRemove.length === 0)) {
		alert('Setidaknya Anda harus memiliki satu tag!');
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Morebits.wiki.actionCompleted.redirect = Morebits.pageNameNorm;
	Morebits.wiki.actionCompleted.notice = 'Menandai selesai, sedang memuat kembali halaman ini dalam beberapa detik';
	if (Twinkle.tag.mode === 'redirect') {
		Morebits.wiki.actionCompleted.followRedirect = false;
	}

	var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, 'Menandai ' + Twinkle.tag.mode);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.tag.callbacks[Twinkle.tag.mode]);

};

})(jQuery);
// </nowiki>
