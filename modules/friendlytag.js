//<nowiki>

(function($) {


/*
 ****************************************
 *** friendlytag.js: Tag module
 ****************************************
 * Mode of invocation:     Tab ("Tag")
 * Active on:              Existing articles and drafts; file pages with a corresponding file
 *                         which is local (not on Commons); all redirects
 * Config directives in:   FriendlyConfig
 */

Twinkle.tag = function friendlytag() {
	// redirect tagging
	if( Morebits.wiki.isPageRedirect() ) {
		Twinkle.tag.mode = 'redirect';
		Twinkle.addPortletLink( Twinkle.tag.callback, "Tag", "tag ramah pengguna", "Tag pengalihan" );
	}
	// file tagging
	else if( mw.config.get('wgNamespaceNumber') === 6 && !document.getElementById("mw-sharedupload") && document.getElementById("mw-imagepage-section-filehistory") ) {
		Twinkle.tag.mode = 'file';
		Twinkle.addPortletLink( Twinkle.tag.callback, "Tag", "friendly-tag", "Beri tag pemeliharaan ke artikel" );
	}
	// article/draft article tagging
	else if( [0, 118].indexOf(mw.config.get('wgNamespaceNumber')) !== -1 && mw.config.get('wgCurRevisionId') ) {
		Twinkle.tag.mode = 'article';
		// Can't remove tags when not viewing current version
		Twinkle.tag.canRemove = (mw.config.get('wgCurRevisionId') === mw.config.get('wgRevisionId')) &&
			// Disabled on latest diff because the diff slider could be used to slide
			// away from the latest diff without causing the script to reload
			!mw.config.get('wgDiffNewId');
		Twinkle.addPortletLink( Twinkle.tag.callback, "Tag", "friendly-tag", "Berikan atau hapus tag pemeliharaan ke artikel" );
	}
};

Twinkle.tag.checkedTags = [];

Twinkle.tag.callback = function friendlytagCallback() {
	var Window = new Morebits.simpleWindow( 630, (Twinkle.tag.mode === "article") ? 500 : 400 );
	Window.setScriptName( "Twinkle" );
	// anyone got a good policy/guideline/info page/instructional page link??
	Window.addFooterLink( "Bantuan Twinkle", "WP:TW/DOC#tag" );

	var form = new Morebits.quickForm( Twinkle.tag.callback.evaluate );

	if (document.getElementsByClassName("patrollink").length) {
		form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Tandai halaman ini sebagai terpatroli',
					value: 'patrolPage',
					name: 'patrolPage',
					checked: Twinkle.getFriendlyPref('markTaggedPagesAsPatrolled')
				}
			]
		} );
	}

	switch( Twinkle.tag.mode ) {
		case 'article':
			Window.setTitle( "Pemberian tag pemeliharaan dalam artikel" );

			form.append({
				type: 'select',
				name: 'sortorder',
				label: 'Lihat daftar ini:',
				tooltip: 'Anda dapat mengganti tampilan susunan baku dalam preferensi Twinkle Anda (WP:TWPREFS).',
				event: Twinkle.tag.updateSortOrder,
				list: [
					{ type: 'option', value: 'cat', label: 'Menurut kategori', selected: Twinkle.getFriendlyPref('tagArticleSortOrder') === 'cat' },
					{ type: 'option', value: 'alpha', label: 'Menurut abjad', selected: Twinkle.getFriendlyPref('tagArticleSortOrder') === 'alpha' }
				]
			});

			if (! Twinkle.tag.canRemove) {
				var divElement = document.createElement('div');
				divElement.innerHTML = 'For removal of existing tags, please open Tag menu from the current version of article';
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

			form.append( {
					type: 'checkbox',
					list: [
						{
							label: 'Kelompokkan dalam {{multiple issues}} jika dibutuhkan',
							value: 'group',
							name: 'group',
							tooltip: 'Jika menerapkan dua templat atau lebih yang didukung oleh {{multiple issues}} dan kotak ini dicentang, semua templat yang didukung akan dikelompokkan dalam templat {{multiple issues}}.',
							checked: Twinkle.getFriendlyPref('groupByDefault')
						}
					]
				}
			);

			break;

		case 'file':
			Window.setTitle( "Pemberian tag pemeliharaan berkas" );

			form.append({ type: 'header', label: 'Tag lisensi dan sumber bermasalah' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.licenseList } );

			form.append({ type: 'header', label: 'Tag terkait dengan Commons' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.commonsList } );

			form.append({ type: 'header', label: 'Tag perapian' } );
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.cleanupList } );

			form.append({ type: 'header', label: 'Tag kualitas gambar' } );
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.qualityList } );

			form.append({ type: 'header', label: 'Tag penggantian' });
			form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.tag.file.replacementList } );

			if (Twinkle.getFriendlyPref('customFileTagList').length) {
				form.append({ type: 'header', label: 'Tag kustom' });
				form.append({ type: 'checkbox', name: 'fileTags', list: Twinkle.getFriendlyPref('customFileTagList') });
			}
			break;

		case 'redirect':
			Window.setTitle( "Tag pengalihan" );

			form.append({ type: 'header', label:'Templat ejaan, salah ketik, gaya, dan kapitalisasi' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.spellingList });

			form.append({ type: 'header', label:'Templat nama pengganti' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.alternativeList });

			form.append({ type: 'header', label:'Templat administrasi dan pengalihan lain-lain' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.administrativeList });

			if (Twinkle.getFriendlyPref('customRedirectTagList').length) {
				form.append({ type: 'header', label: 'Custom tags' });
				form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.getFriendlyPref('customRedirectTagList') });
			}
			break;

		default:
			alert("Twinkle.tag: moda tak dikenal " + Twinkle.tag.mode);
			break;
	}

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	if (Twinkle.tag.mode === "article") {

		Twinkle.tag.alreadyPresentTags = [];

		if (Twinkle.tag.canRemove) {
			// Look for existing maintenance tags in the lead section and put them in array

			// All tags are HTML table elements that are direct children of .mw-parser-output,
			// except when they are within {{multiple issues}}
			$('.mw-parser-output').children().each( function parsehtml(i,e) {

				// break out on encountering the first heading, which means we are no
				// longer in the lead section
				if (e.tagName === 'H2')
					return false;

				// The ability to remove tags depends on the template's {{ambox}} |name=
				// parameter bearing the template's correct name (preferably) or a name that at
				// least redirects to the actual name

				// All tags have their first class name as "box-" + template name
				if (e.className.indexOf('box-') === 0) {
					if (e.classList[0] === 'box-Multiple_issues') {
						$(e).find('.ambox').each(function(idx, e) {
							var tag = e.classList[0].slice(4).replace(/_/g,' ');
							Twinkle.tag.alreadyPresentTags.push(tag);
						});
						return true; // continue
					}

					var tag = e.classList[0].slice(4).replace(/_/g,' ');
					Twinkle.tag.alreadyPresentTags.push(tag);
				}
			} );

			// {{Uncategorized}} and {{Improve categories}} are usually placed at the end
			if ($(".box-Uncategorized").length) {
				Twinkle.tag.alreadyPresentTags.push('Uncategorized');
			}
			if ($(".box-Improve_categories").length) {
				Twinkle.tag.alreadyPresentTags.push('Improve categories');
			}

		}

		// fake a change event on the sort dropdown, to initialize the tag list
		var evt = document.createEvent("Event");
		evt.initEvent("change", true, true);
		result.sortorder.dispatchEvent(evt);

	} else {
		// Redirects and files: Add a link to each template's description page
		Morebits.quickForm.getElements(result, Twinkle.tag.mode + "Tags").forEach(generateLinks);
	}
};

Twinkle.tag.updateSortOrder = function(e) {
	var sortorder = e.target.value;
	Twinkle.tag.checkedTags = e.target.form.getChecked("articleTags");
	if (!Twinkle.tag.checkedTags) {
		Twinkle.tag.checkedTags = [];
	}

	var container = new Morebits.quickForm.element({ type: "fragment" });

	// function to generate a checkbox, with appropriate subgroup if needed
	var makeCheckbox = function(tag, description) {
		var checkbox = { value: tag, label: "{{" + tag + "}}: " + description };
		if (Twinkle.tag.checkedTags.indexOf(tag) !== -1) {
			checkbox.checked = true;
		}
		switch (tag) {
			case "Cleanup":
				checkbox.subgroup = {
					name: 'cleanup',
					type: 'input',
					label: 'Alasan perapian diperlukan: ',
					tooltip: 'Wajib diisi.',
					size: 35
				};
				break;
			case "Close paraphrasing":
				checkbox.subgroup = {
					name: 'closeParaphrasing',
					type: 'input',
					label: 'Source: ',
					tooltip: 'Source that has been closely paraphrased'
				};
				break;
			case "Copy edit":
				checkbox.subgroup = {
					name: 'copyEdit',
					type: 'input',
					label: '"Artikel ini perlu disunting lebih lanjut untuk..." ',
					tooltip: 'seperti ¨ejaan yang salah¨. Opsional.',
					size: 35
				};
				break;
			case "Copypaste":
				checkbox.subgroup = {
					name: 'copypaste',
					type: 'input',
					label: 'URL sumber: ',
					tooltip: 'Jika diketahui.',
					size: 50
				};
				break;
			case "Expand language":
				checkbox.subgroup = [ {
						name: 'expandLanguageLangCode',
						type: 'input',
						label: 'Language code: ',
						tooltip: 'Language code of the language from which article is to be expanded from'
					}, {
						name: 'expandLanguageArticle',
						type: 'input',
						label: 'Name of article: ',
						tooltip: 'Name of article to be expanded from, without the interwiki prefix'
					},
				];
				break;
			case "Expert needed":
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
						tooltip: 'Short explanation describing the issue. Either Reason or Talk link is required.'
					},
					{
						name: 'expertNeededTalk',
						type: 'input',
						label: 'Diskusi pembicaraan: ',
						tooltip: 'Name of the section of this article\'s talk page where the issue is being discussed. Do not give a link, just the name of the section. Either Reason or Talk link is required.'
					}
				];
				break;
			case "Globalize":
				checkbox.subgroup = {
					name: 'globalize',
					type: 'select',
					list: [
						{ label: "{{globalize}}: artikel mungkin tidak mewakili keseluruhan subjek yang dibahas", value: "globalize" },
						/* {
							label: "Subtemplat {{globalize}} mengenai wilayah",
							list: [
								{ label: "{{globalize/Australia}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Australia", value: "globalize/Australia" },
								{ label: "{{globalize/Canada}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Kanada", value: "globalize/Canada" },
								{ label: "{{globalize/China}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Tiongkok", value: "globalize/China" },
								{ label: "{{globalize/Common law}}: artikel berisi konten yang dibuat terutama dalam sudut pandang hukum secara umum", value: "globalize/Common law" },
								{ label: "{{globalize/Eng}}: artikel berisi konten yang dibuat terutama dalam sudut pandang pengguna bahasa Inggris", value: "globalize/Eng" },
								{ label: "{{globalize/Europe}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Eropa", value: "globalize/Europe" },
								{ label: "{{globalize/France}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Peranc", value: "globalize/France" },
								{ label: "{{globalize/Germany}}: article deals primarily with the German viewpoint", value: "globalize/Germany" },
								{ label: "{{globalize/Middle East}}: article deals primarily with the Middle Eastern viewpoint", value: "globalize/Middle East" },
								{ label: "{{globalize/North America}}: article deals primarily with the North American viewpoint", value: "globalize/North America" },
								{ label: "{{globalize/Northern}}: article deals primarily with the northern hemisphere viewpoint", value: "globalize/Northern" },
								{ label: "{{globalize/Southern}}: article deals primarily with the southern hemisphere viewpoint", value: "globalize/Southern" },
								{ label: "{{globalize/South Africa}}: article deals primarily with the South African viewpoint", value: "globalize/South Africa" },
								{ label: "{{globalize/UK}}: article deals primarily with the British viewpoint", value: "globalize/UK" },
								{ label: "{{globalize/UK and Canada}}: article deals primarily with the British and Canadian viewpoints", value: "globalize/UK and Canada" },
								{ label: "{{globalize/US}}: article deals primarily with the USA viewpoint", value: "globalize/US" },
								{ label: "{{globalize/West}}: article deals primarily with the viewpoint of Western countries", value: "globalize/West" }
							]
						} */
					]
				};
				break;
			case "History merge":
				checkbox.subgroup = [
					{
						name: 'histmergeOriginalPage',
						type: 'input',
						label: 'Other article: ',
						tooltip: 'Name of the page that should be merged into this one (required).'
					},
					{
						name: 'histmergeReason',
						type: 'input',
						label: 'Reason: ',
						tooltip: 'Short explanation describing the reason a history merge is needed. Should probably begin with "because" and end with a period.'
					},
					{
						name: 'histmergeSysopDetails',
						type: 'input',
						label: 'Extra details: ',
						tooltip: 'For complex cases, provide extra instructions for the reviewing administrator.'
					}
				];
				break;
			case "Merge":
			case "Merge from":
			case "Merge to":
				var otherTagName = "Merge";
				switch (tag)
				{
					case "Merge from":
						otherTagName = "Merge to";
						break;
					case "Merge to":
						otherTagName = "Merge from";
						break;
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
							(tag === "Merge from" ? 'artikel lainnya' : 'artikel ini') + ' halaman pembicaraan):',
						tooltip: 'Opsional, namun sangat disarankan. Kosongkan jika tidak diinginkan. Hanya tersedia jika nama artikel tunggal diberikan.'
					});
				}
				break;
			// case "Not English":
			case "Not Indonesian":
			case "Rough translation":
					checkbox.subgroup = [
						{
							name: 'translationLanguage',
							type: 'input',
							label: 'Bahasa artikel (jika diketahui): ',
							tooltip: 'Baca pedoman penerjemahan artikel untuk informasi lebih lanjut.'
						}
					];
					// if (tag === "Not English") {
					if (tag === "Not Indonesian") {
						checkbox.subgroup.push({
							name: 'translationNotify',
							type: 'checkbox',
							list: [
								{
									label: 'Beritahukan pembuat artikel',
									checked: true,
									tooltip: "Tempatkan {{uw-notenglish}} di halaman pembicaraannya."
								}
							]
						});
					}
					if (mw.config.get('wgNamespaceNumber') === 0) {
						checkbox.subgroup.push({
							name: 'translationPostAtPNT',
							type: 'checkbox',
							list: [
								{
									label: 'List this article at Wikipedia:Pages needing translation into English (PNT)',
									checked: true
								}
							]
						});
						checkbox.subgroup.push({
							name: 'translationComments',
							type: 'textarea',
							label: 'Additional comments to post at PNT',
							tooltip: 'Optional, and only relevant if "List this article ..." above is checked.'
						});
					}
					break;
			case "Notability":
				checkbox.subgroup = {
					name: 'notability',
					type: 'select',
					list: [
						{ label: "{{notability}}: subjek artikel mungkin tidak memenuhi kelayakan secara umum", value: "none" },
						{ label: "{{notability|Academics}}: pedoman kelayakan untuk akademik", value: "Academics" },
						{ label: "{{notability|Biographies}}: pedoman kelayakan untuk biografi", value: "Biographies" },
						{ label: "{{notability|Books}}: pedoman kelayakan untuk buku", value: "Books" },
						{ label: "{{notability|Companies}}: pedoman kelayakan untuk perusahaan dan organisasi", value: "Companies" },
						{ label: "{{notability|Events}}: pedoman kelayakan untuk acara/perhelatan", value: "Events" },
						{ label: "{{notability|Films}}: pedoman kelayakan untuk film", value: "Films" },
						{ label: "{{notability|Places}}: pedoman kelayakan untuk tempat/lokasi", value: "Places" },
						{ label: "{{notability|Music}}: pedoman kelayakan untuk musik", value: "Music" },
						// { label: "{{notability|Neologisms}}: pedoman kelayakan untuk neologisme", value: "Neologisms" },
						// { label: "{{notability|Numbers}}: pedoman kelayakan untuk angka", value: "Numbers" },
						{ label: "{{notability|Products}}: pedoman kelayakan untuk produk dan layanan", value: "Products" },
						{ label: "{{notability|Sport}}: pedoman kelayakan untuk olahraga", value: "Sport" },
						{ label: "{{notability|Television}}:  pedoman kelayakan untuk acara televisi", value: "Television" },
						{ label: "{{notability|Web}}: pedoman kelayakan untuk isi situs", value: "Web" }
					]
				};
				break;
			default:
				break;
		}
		return checkbox;
	};

	var makeCheckboxesForAlreadyPresentTags = function() {
		container.append({ type: "header", id: "tagHeader0", label: "Tags already present" });
		var subdiv = container.append({ type: "div", id: "tagSubdiv0" });
		var checkboxes = [];
		Twinkle.tag.alreadyPresentTags.forEach( function(tag) {
			var description = Twinkle.tag.article.tags[tag];
			var checkbox =
				{
					value: tag,
					label: "{{" + tag + "}}" + ( description ? (": " + description) : ""),
					checked: true
					//, subgroup: { type: 'input', name: 'removeReason', label: 'Reason', tooltip: 'Enter reason for removing this tag' }
					// TODO: add option for providing reason for removal
				};

			checkboxes.push(checkbox);
		} );
		subdiv.append({
			type: "checkbox",
			name: "alreadyPresentArticleTags",
			list: checkboxes
		});
	};

	// categorical sort order
	if (sortorder === "cat") {
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
				type: "checkbox",
				name: "articleTags",
				list: checkboxes
			});
		};

		if(Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
		}
		var i = 1;
		// go through each category and sub-category and append lists of checkboxes
		$.each(Twinkle.tag.article.tagCategories, function(title, content) {
			container.append({ type: "header", id: "tagHeader" + i, label: title });
			var subdiv = container.append({ type: "div", id: "tagSubdiv" + i++ });
			if (Array.isArray(content)) {
				doCategoryCheckboxes(subdiv, content);
			} else {
				$.each(content, function(subtitle, subcontent) {
					subdiv.append({ type: "div", label: [ Morebits.htmlNode("b", subtitle) ] });
					doCategoryCheckboxes(subdiv, subcontent);
				});
			}
		});
	}
	// alphabetical sort order
	else {
		if(Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
			container.append({ type: "header", id: "tagHeader1", label: "Available tags" });
		}
		var checkboxes = [];
		$.each(Twinkle.tag.article.tags, function(tag, description) {
			if (Twinkle.tag.alreadyPresentTags.indexOf(tag) === -1) {
				checkboxes.push(makeCheckbox(tag, description));
			}
		});
		container.append({
			type: "checkbox",
			name: "articleTags",
			list: checkboxes
		});
	}

	// append any custom tags
	if (Twinkle.getFriendlyPref('customTagList').length) {
		container.append({ type: 'header', label: 'Tag yang disesuaikan' });
		container.append({ type: 'checkbox', name: 'articleTags', list: Twinkle.getFriendlyPref('customTagList') });
	}

	var $workarea = $(e.target.form).find("div#tagWorkArea");
	var rendered = container.render();
	$workarea.empty().append(rendered);

	// style adjustments
	$workarea.find("h5").css({ 'font-size': '110%' });
	$workarea.find("h5:not(:first-child)").css({ 'margin-top': '1em' });
	$workarea.find("div").filter(":has(span.quickformDescription)").css({ 'margin-top': '0.4em' });

	Morebits.quickForm.getElements(e.target.form, "articleTags").forEach(generateLinks);
	var alreadyPresentTags = Morebits.quickForm.getElements(e.target.form, "alreadyPresentArticleTags");
	if (alreadyPresentTags) {
		alreadyPresentTags.forEach(generateLinks);
	}
};

/**
 * Adds a link to each template's description page
 * @param {Morebits.quickForm.element} checkbox  associated with the template
 */
var generateLinks = function(checkbox) {
	var link = Morebits.htmlNode("a", ">");
	link.setAttribute("class", "tag-template-link");
	var tagname = checkbox.values;
	link.setAttribute("href", mw.util.getUrl(
		(tagname.indexOf(":") === -1 ? "Template:" : "") +
		(tagname.indexOf("|") === -1 ? tagname : tagname.slice(0,tagname.indexOf("|")))
	));
	link.setAttribute("target", "_blank");
	$(checkbox).parent().append(["\u00A0", link]);
};


// Tags for ARTICLES start here

Twinkle.tag.article = {};

// A list of all article tags, in alphabetical order
// To ensure tags appear in the default "categorized" view, add them to the tagCategories hash below.

Twinkle.tag.article.tags = {
	"Advert": "artikel ditulis seperti iklan",
	"All plot": "artikel hampir semuanya ringkasan alur",
	"Autobiography": "artikel adalah otobiografi yang tidak ditulis secara netral",
	"BLP sources": "artikel tokoh yang masih hidup perlu referensi lebih banyak untuk diperiksa",
	"BLP unsourced": "artikel tokoh yang masih hidup yang tidak punya referensi",
	"Citation style": "artikel yang kutipannya tidak jelas atau tak konsisten",
	"Cleanup": "artikel memerlukan perapian",
	"Cleanup bare URLs": "article uses bare URLs for references, which are prone to link rot",
	"Cleanup-PR": "article reads like a press release or news release",
	"Cleanup reorganize": "artikel memerlukan pengubahan struktur agar sesuai dengan pedoman Wikipedia",
	"Cleanup rewrite": "article may need to be rewritten entirely to comply with Wikipedia's quality standards",
	"Cleanup tense": "article is written in an incorrect tense",
	"Close paraphrasing": "artikel mengandung parafrasa yang mirip dengan sumber tidak bebas berhak cipta",
	"COI": "pembuat artikel memiliki konflik kepentingan",
	"Condense": "artikel mungkin punya banyak kepala bagian yang membagi-bagi isinya",
	"Confusing": "artikel tidak memiliki isi yang jelas (membingungkan)",
	"Context": "konteks isi artikel tidak mencukupi",
	"Copy edit": "artikel butuh perbaikan pada tata bahasa, gaya, relasi antarparagrag, dan/atau ejaan",
	"Copypaste": "artikel terkesan disalin dari sebuah sumber",
	"Current": "article documents a current event",
	"Disputed": "akurasi aktual isi halaman dipertanyakan",
	"Essay-like": "artikel ditulis seperti esai atau opini",
	"Expand language": "artikel dapat dikembangkan dengan materi dari Wikipedia bahasa lain",
	"Expert needed": "artikel perlu dilihat oleh pengguna yang ahli di bidang ini",
	"External links": "pranala luar artikel tidak mengikuti pedoman dan kebijakan",
	"Fanpov": "artikel mirip dengan situs penggemar",
	"Fiction": "artikel tidak dapat dibedakan antara nyata atau fiksi",
	"Globalize": "artikel tidak mewakili sudut pandang umum subjek tersebut",
	"GOCEinuse": "article is currently undergoing a major copy edit by the Guild of Copy Editors",
	"History merge": "another page should be history merged into this one",
	"Hoax": "artikel berisi informasi palsu",
	"Improve categories": "artikel butuh kategori tambahan",
	"Incomprehensible": "artikel sulit untuk dipahami atau tidak komprehensif",
	"In-universe": "subjek artikel adalah fiksi dan butuh gaya penulisan dari sudut pandang nonfiksi",
	"In use": "artikel dalam pengembangan dalam waktu dekat",
	"Lead missing": "artikel tidak memiliki bagian pengantar dan perlu ditulis",
	"Lead rewrite": "pengantar artikel tidak sesuai pedoman",
	"Lead too long": "pengantar artikel sangat panjang dan harus dibuat lebih ringkas",
	"Lead too short": "pengantar artikel sangat pendek dan harus dikembangkan",
	"Like resume": "article is written like a resume",
	"Long plot": "ringkasan alur di artikel terlalu panjang",
	"Manual": "gaya artikel mirip dengan buku pedoman",
	"Merge": "artikel ini perlu digabungkan ke artikel lain",
	"Merge from": "artikel lain harus digabungkan ke artikel ini",
	"Merge to": "artikel ini harus digabungkan ke artikel lain",
	"More citations needed": "article needs additional references or sources for verification",
	"More footnotes": "artikel sudah punya referensi, namun hanya punya sedikit catatan kaki",
	"No footnotes": "artikel punya referensi, namun tidak punya catatan kaki",
	"No plot": "article is missing a plot summary",
	"Non-free": "artikel mungkin mengandung materi yang berhak cipta yang tidak digunakan sebagaimana mestinya",
	"Notability": "subjek artikel tidak memenuhi kelayakan",
	"Not English": "article is written in a language other than English and needs translation",
	"One source": "artikel hanya merujuk pada sebuah sumber saja",
	"Original research": "artikel memiliki penggunaan riset asli klaim yang tidak terperiksa",
	"Orphan": "artikel tidak memiliki hubungan dengan artikel lain",
	"Over-coverage": "artikel mengandung anggapan atau cakupan tidak sesuai terhadap satu bagian atau lebih",
	"Overlinked": "artikel banyak mengandung pranala duplikat dan/atau tidak berhubungan",
	"Overly detailed": "artikel mengandung jumlah detail yang terlalu banyak",
	"Over-quotation": "article contains too many or too-lengthy quotations for an encyclopedic entry",
	"Peacock": "artikel mengandung istilah hiperbola yang mempromosikan subjek tanpa informasi lengkap",
	"POV": "sudut pandang penulisan artikel tidak netral",
	"Primary sources": "artikel terlalu mengandalkan sumber primer, dan butuh sumber tambahan",
	"Prose": "artikel mengandung format yang lebih sesuai ditulis dalam bentuk prosa",
	"Recentism": "artikel ini terlalu condong dengan peristiwa terkini",
	"Rough translation": "artikel sangat jelek penerjemahannya dan memerlukan perbaikan",
	"Sections": "artikel perlu dibagi dalam subbagian",
	"Self-published": "artikel mengandung sumber yang mungkin tak sesuai untuk sumber yang diterbitkan oleh diri sendiri",
	"Technical": "artikel mengandung banyak istilah yang rumit",
	"Third-party": "artikel terlalu mengandalkan sumber kedua, dan butuh sumber ketiga",
	"Tone": "gaya penulisan tak sesuai",
	"Too few opinions": "artikel tidak mengandung keseluruhan sudut pandang yang penting",
	"Uncategorized": "artikel tidak ada kategori",
	"Under construction": "artikel sedang dalam tahap pengembangan",
	"Underlinked": "artikel perlu lebih banyak pranala wiki",
	"Undue weight": "article lends undue weight to certain ideas, incidents, or controversies",
	"Unfocused": "artikel kurang memfokuskan subjek atau punya topik yang lebih dari satu",
	"Unreferenced": "artikel tidak punya referensi sama sekali",
	"Unreliable sources": "sumber artikel mungkin tidak dapat dipercaya",
	"Undisclosed paid": "article may have been created or edited in return for undisclosed payments",
	"Update": "artikel memerlukan informasi yang lebih aktual",
	"Very long": "artikel sangaaaat panjang",
	"Weasel": "kenetralan artikel diganggu oleh penggunaan kata bersayap",
	"Dead end": "artikel tidak punya hubungan dengan artikel lain",
	"Linkrot": "sumber referensi artikel sudah mati, dan penulisannya harus diperbaiki",
	"New unreviewed article": "tandai artikel untuk diperiksa nanti",
	"News release": "gaya artikel mirip seperti berita",
	"Not Indonesian": "artikel tidak ditulis dalam bahasa Indonesia dan perlu diterjemahkan",
	"Refimprove": "artikel perlu sumber tambahan untuk diperiksa",
	"Tense": "artikel ditulis dalam gaya tidak sesuai",
	"Tugas sekolah": "artikel yang sedang digunakan untuk penilaian di sekolah/universitas"
};

// A list of tags in order of category
// Tags should be in alphabetical order within the categories
// Add new categories with discretion - the list is long enough as is!

Twinkle.tag.article.tagCategories = {
	"Tag rapikan dan pemeliharaan": {
		"Perapian secara umum": [
			"Cleanup",  // has a subgroup with text input
			"Cleanup rewrite",
			"Copy edit"  // has a subgroup with text input
		],
		"Mengandung konten yang tidak diinginkan": [
			"Close paraphrasing",
			"Copypaste",  // has a subgroup with text input
			"External links",
			"Non-free"
		],
		"Struktur, format, dan pengantar": [
			"Cleanup reorganize",
			"Condense",
			"Lead missing",
			"Lead rewrite",
			"Lead too long",
			"Lead too short",
			"Sections",
			"Very long"
		],
		"Perapian terkait isi fiksi": [
			"All plot",
			"Fiction",
			"In-universe",
			"Long plot",
			"No plot"
		]
	},
	"Masalah konten secara umum": {
		"Kepentingan dan kelayakan": [
			"Notability"  // has a subgroup with subcategories
		],
		"Gaya penulisan": [
			"Advert",
			"Cleanup tense",
			"Essay-like",
			"Fanpov",
			"Like resume",
			"Manual",
			"Cleanup-PR",
			"Over-quotation",
			"Prose",
			"Technical",
			"Tone"
		],
		"Makna": [
			"Confusing",
			"Incomprehensible",
			"Unfocused"
		],
		"Detail dan informasi": [
			"Context",
			"Expert needed",
			"Overly detailed",
			"Undue weight"
		],
		"Keaktualan": [
			"Current",
			"Update"
		],
		"Netralitas, kecondongan dan akurasi faktual": [
			"Autobiography",
			"COI",
			"Disputed",
			"Hoax",
			"Globalize",  // has a subgroup with subcategories
			"Over-coverage",
			"Peacock",
			"POV",
			"Recentism",
			"Too few opinions",
			"Undisclosed paid",
			"Weasel"
		],
		"Pemeriksaan dan sumber": [
			"BLP sources",
			"BLP unsourced",
			"More citations needed",
			"One source",
			"Original research",
			"Primary sources",
			"Self-published",
			"Third-party",
			"Unreferenced",
			"Unreliable sources"
		]
	},
	"Masalah konten tertentu": {
		"Bahasa": [
			"Not Indonesian",  // has a subgroup with several options
			"Rough translation",  // has a subgroup with several options
			"Expand language"
		],
		"Pranala dan tautan": [
			"Orphan",
			"Overlinked",
			"Underlinked"
		],
		"Teknik pemberian referensi": [
			"Citation style",
			"Cleanup bare URLs",
			"More footnotes",
			"No footnotes"
		],
		"Kategori": [
			"Improve categories",
			"Uncategorized"
		]
	},
	"Penggabungan": [
		"History merge",
		"Merge",	// these three have a subgroup with several options
		"Merge from",
		"Merge to"
	],
	"Informasi halaman": [
		"GOCEinuse",
		"In use",
        "Tugas sekolah",
		"Under construction"
	]
};

// Contains those article tags that *do not* work inside {{multiple issues}}.
Twinkle.tag.multipleIssuesExceptions = [
	'Copypaste',
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
		label: '{{R from member}}: pengalihan dari anggota kelompok ke topik terkait seperti kelompok, organisasi, atau tim yang ia terlibat di dalamnya',
		value: 'R from member'
	},
	{
		label: '{{R from misspelling}}: pengalihan dari kesalahan ejaan atau tipografi',
		value: 'R from misspelling'
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
		subgroup : [
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
		label: '{{R from ASCII}}: pengalihan dari sebuah judul dalam ASCII dasar ke judul artikel yang formal, dengan perbedaan yang bukan berupa tanda diakritik',
		value: 'R from ASCII'
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
		label: '{{R from surname}}: pengalihan dari sebuah judul yang merupakan nama belakang',
		value: 'R from surname'
	},
	{
		label: '{{R to diacritics}}: pengalihan ke judul dengan disertai tanda diakritik',
		value: 'R to diacritics'
	},
	{
		label: '{{R to scientific name}}: pengalihan dari nama yang umum ke nama ilmiah',
		value: 'R to scientific name'
	}
];

Twinkle.tag.administrativeList = [
	{
		label: '{{R from CamelCase}}: pengalihan dari judul CamelCase',
		value: 'R from CamelCase'
	},
	{
		label: '{{R from duplicated article}}: pengalihan ke artikel serupa untuk menyimpan sejarah suntingannya',
		value: 'R from duplicated article'
	},
	{

		label: '{{R from EXIF}}: pengalihan pranala wiki yang dibuat dari informasi EXIF JPEG (bagian "metadata" dari beberapa jenis halaman berkas)',
		value: 'R from EXIF'
	},
	{
		label: '{{R from merge}}: pengalihan dari halaman yang digabung untuk menyimpan sejarah suntingannya',
		value: 'R from merge'
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
		label: '{{R to decade}}: pengalihan dari suatu tahun ke artikel dekade',
		value: 'R to decade'
	},
	{
		label: '{{R to disambiguation page}}: pengalihan ke halaman disambiguasi',
		value: 'R to disambiguation page'
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
	{ 	label: '{{Do not move to Commons}} (alasan lain)',
		value: 'Jangan pindahkan ke Commons Commons_reason',
		subgroup: {
			type: 'input',
			name: 'DoNotMoveToCommons',
			label: 'Alasan: ',
			tooltip: 'Masukkan alasan mengapa berkas ini tidak layak dipindahkan ke Commons (diperlukan)'
		}
	},
	{ 	label: '{{Keep local}}: permintaan untuk menyimpan salinan lokal dari berkas Commons',
		value: 'Keep local',
		subgroup: {
			type: 'input',
			name: 'keeplocalName',
			label: 'Nama berkas di Commons, jika berbeda: ',
			tooltip: 'Nama berkas di Commons, jika nama berkas tidak sama, jangan taruh awalan "Berkas:":'
		}
	},
	{ 	label: '{{Now Commons}}: berkas sudah dipindahkan ke Commons',
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
	{ 	label: '{{Cleanup image}}: perapian umum', value: 'Cleanup image',
		subgroup: {
			type: 'input',
			name: 'cleanupimageReason',
			label: 'Alasan: ',
			tooltip: 'Masukkan alasan perapian (diperlukan)'
		}
	},
	{ 	label: '{{Cleanup SVG}}: perapian SVG yang memerlukan kode dan/atau tampilan', value: 'Cleanup SVG',
		subgroup: {
			type: 'input',
			name: 'cleanupsvgReason',
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
	{	label: '{{Rename media}}: nama berkas perlu diubah, sesuai kriteria',
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
	{ 	label: '{{Image-Poor-Quality}}', value: 'Image-Poor-Quality',
		subgroup: {
			type: 'input',
			name: 'ImagePoorQualityReason',
			label: 'Reason: ',
			tooltip: 'Enter the reason why this image is so bad (required)'
		}
	},
	{ label: '{{Image-underexposure}}', value: 'Image-underexposure' },
	{ 	label: '{{Low quality chem}}: struktur kimia yang dipertentangkan', value: 'Low quality chem',
		subgroup: {
			type: 'input',
			name: 'lowQualityChemReason',
			label: 'Alasan: ',
			tooltip: 'Masukkan alasan mengapa diagram ini dipertentangkan (diperlukan)'
		}
	},
];

Twinkle.tag.file.replacementList = [
	{ label: '{{Duplicate}}: berkas duplikat, namun masih dipakai dalam artikel', value: 'Duplicate' },
	{ label: '{{Obsolete}}: berkas baru telah tersedia', value: 'Obsolete' },
	{ label: '{{PNG version available}}', value: 'PNG version available' },
	{ label: '{{Vector version available}}', value: 'Vector version available' }
];
Twinkle.tag.file.replacementList.forEach(function(el) {
	el.subgroup = {
		type: 'input',
		label: 'Replacement file: ',
		tooltip: 'Enter the name of the file which replaces this one (required)',
		name: el.value.replace(/ /g,'_') + 'File'
	}
});


Twinkle.tag.callbacks = {
	article: function articleCallback(pageobj) {

		// Remove tags that become superfluous with this action
		var pageText = pageobj.getPageText().replace(/\{\{\s*([Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, "");
		var summaryText;
		var params = pageobj.getCallbackParameters();

		/**
		 * Saves the page following the removal of tags if any. The last step.
		 * Called from removeTags()
		 */
		var postRemoval = function() {

			if (params.tagsToRemove.length) {
				// Finish summary text
				summaryText += ' tag' + ( params.tagsToRemove.length > 1 ? 's' : '') + ' from article';

				// Remove empty {{multiple issues}} if found
				pageText = pageText.replace(/\{\{(multiple ?issues|article ?issues|mi)\s*\|\s*\}\}\n?/im, '');
				// Remove single-element {{multiple issues}} if found
				pageText = pageText.replace(/\{\{(?:multiple ?issues|article ?issues|mi)\s*\|\s*(\{\{[^}]+\}\})\s*\}\}/im, '$1');
			}

			// avoid truncated summaries
			if (summaryText.length > (254 - Twinkle.getPref('summaryAd').length)) {
				summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, "$1");
			}

			pageobj.setPageText(pageText);
			pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
			pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
			pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save(function() {
				// special functions for merge tags
				if (params.mergeReason) {
					// post the rationale on the talk page (only operates in main namespace)
					var talkpageText = "\n\n== Proposed merge with [[" + params.nonDiscussArticle + "]] ==\n\n";
					talkpageText += params.mergeReason.trim() + " ~~~~";

					var talkpage = new Morebits.wiki.page("Talk:" + params.discussArticle, "Posting rationale on talk page");
					talkpage.setAppendText(talkpageText);
					talkpage.setEditSummary('Proposing to merge [[:' + params.nonDiscussArticle + ']] ' +
						(params.mergeTag === 'Merge' ? 'with' : 'into') + ' [[:' + params.discussArticle + ']]' +
						Twinkle.getPref('summaryAd'));
					talkpage.setWatchlist(Twinkle.getFriendlyPref('watchMergeDiscussions'));
					talkpage.setCreateOption('recreate');
					talkpage.append();
				}
				if (params.mergeTagOther) {
					// tag the target page if requested
					var otherTagName = "Merge";
					if (params.mergeTag === 'Merge from') {
						otherTagName = "Merge to";
					} else if (params.mergeTag === 'Merge to') {
						otherTagName = "Merge from";
					}
					var newParams = {
						tags: [otherTagName],
						tagsToRemove: [],
						tagsToRemain: [],
						mergeTarget: Morebits.pageNameNorm,
						discussArticle: params.discussArticle,
						talkDiscussionTitle: params.talkDiscussionTitle
					};
					var otherpage = new Morebits.wiki.page(params.mergeTarget, "Tagging other page (" +
						params.mergeTarget + ")");
					otherpage.setCallbackParameters(newParams);
					otherpage.load(Twinkle.tag.callbacks.article);
				}

				// post at WP:PNT for {{not English}} and {{rough translation}} tag
				if (params.translationPostAtPNT) {
					var pntPage = new Morebits.wiki.page('Wikipedia:Pages needing translation into English',
						"Listing article at Wikipedia:Pages needing translation into English");
					pntPage.setFollowRedirect(true);
					pntPage.setCallbackParameters({
						template: params.tags.indexOf('Rough translation') !== -1 ? "duflu" : "needtrans",
						lang: params.translationLanguage,
						reason: params.translationComments
					});
					pntPage.load(function friendlytagCallbacksTranslationListPage(pageobj) {
						var old_text = pageobj.getPageText();
						var params = pageobj.getCallbackParameters();
						var statelem = pageobj.getStatusElement();

						var templateText = "{{subst:" + params.template + "|pg=" + Morebits.pageNameNorm + "|Language=" +
							(params.lang || "uncertain") + "|Comments=" + params.reason.trim() + "}} ~~~~";

						var text, summary;
						if (params.template === "duflu") {
							text = old_text + "\n\n" + templateText;
							summary = "Translation cleanup requested on ";
						} else {
							text = old_text.replace(/\n+(==\s?Translated pages that could still use some cleanup\s?==)/,
								"\n\n" + templateText + "\n\n$1");
							summary = "Translation" + (params.lang ? (" from " + params.lang) : "") + " requested on ";
						}

						if (text === old_text) {
							statelem.error('failed to find target spot for the discussion');
							return;
						}
						pageobj.setPageText(text);
						pageobj.setEditSummary(summary + " [[:" + Morebits.pageNameNorm + "]]" + Twinkle.getPref('summaryAd'));
						pageobj.setCreateOption('recreate');
						pageobj.save();
					});
				}
				if (params.translationNotify) {
					pageobj.lookupCreator(function(innerPageobj) {
						var initialContrib = innerPageobj.getCreator();

						// Disallow warning yourself
						if (initialContrib === mw.config.get('wgUserName')) {
							innerPageobj.getStatusElement().warn("You (" + initialContrib + ") created this page; skipping user notification");
							return;
						}

						var userTalkPage = new Morebits.wiki.page('User talk:' + initialContrib,
							'Notifying initial contributor (' + initialContrib + ')');
						var notifytext = "\n\n== Your article [[" + Morebits.pageNameNorm + "]]==\n" +
							"{{subst:uw-notenglish|1=" + Morebits.pageNameNorm +
							(params.translationPostAtPNT ? "" : "|nopnt=yes") + "}} ~~~~";
						userTalkPage.setAppendText(notifytext);
						userTalkPage.setEditSummary("Notice: Please use English when contributing to the English Wikipedia." +
							Twinkle.getPref('summaryAd'));
						userTalkPage.setCreateOption('recreate');
						userTalkPage.setFollowRedirect(true);
						userTalkPage.append();
					});
				}
			});

			if( params.patrol ) {
				pageobj.patrol();
			}
		};

		/**
		 * Removes the existing tags that were deselected (if any)
		 * Calls postRemoval() when done
		 */
		var removeTags = function removeTags()  {

			if (params.tagsToRemove.length === 0) {
				// finish summary text from adding of tags, in this case where there are
				// no tags to be removed
				summaryText += ' tag' + ( tags.length > 1 ? 's' : '' ) + ' to article';

				postRemoval();
				return;
			}

			Morebits.status.info( 'Info', 'Removing deselected tags that were already present' );

			if (params.tags.length > 0) {
				summaryText += ( tags.length ? (' tag' + ( tags.length > 1 ? 's' : '' )) : '' ) + ', and removed';
			} else {
				summaryText = 'Removed';
			}

			var getRedirectsFor = [];

			// Remove the tags from the page text, if found in its proper name,
			// otherwise moves it to `getRedirectsFor` array earmarking it for
			// later removal
			params.tagsToRemove.forEach(function removeTag(tag, tagIndex) {

				var tag_re = new RegExp('\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]+)?\\}\\}\\n?');
				if (tag === 'Globalize') {
					// special case to catch occurrences like {{Globalize/UK}}, etc
					tag_re = new RegExp('\\{\\{[gG]lobalize/?[^}]*\\}\\}\\n?');
				}

				if(tag_re.test(pageText)) {
					pageText = pageText.replace(tag_re,'');
				} else {
					getRedirectsFor.push('Template:' + tag);
				}

				// Producing summary text for current tag removal
				if ( tagIndex > 0 ) {
					if( tagIndex === (params.tagsToRemove.length - 1) ) {
						summaryText += ' and';
					} else if ( tagIndex < (params.tagsToRemove.length - 1) ) {
						summaryText += ',';
					}
				}
				summaryText += ' {{[[Template:' + tag + '|' + tag + ']]}}';
			});

			if (! getRedirectsFor.length) {
				postRemoval();
				return;
			}

			// Remove tags which appear in page text as redirects
			var api = new Morebits.wiki.api("Getting template redirects", {
				"action": "query",
				"prop": "linkshere",
				"titles": getRedirectsFor.join('|'),
				"redirects": 1,  // follow redirect if the class name turns out to be a redirect page
				"lhnamespace": "10",  // template namespace only
				"lhshow": "redirect",
				"lhlimit": "max"
			}, function removeRedirectTag(apiobj) {

				$(apiobj.responseXML).find('page').each(function(idx,page) {
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

		if (! params.tags.length) {
			removeTags();
			return;
		}

		// Executes first: addition of selected tags
		summaryText = 'Added';
		var tagRe, tagText = '', tags = [], groupableTags = [], groupableExistingTags = [], totalTags;

		/**
		 * Updates `tagText` with the syntax of `tagName` template with its parameters
		 * @param {number} tagIndex
		 * @param {string} tagName
		 */
		var addTag = function articleAddTag( tagIndex, tagName ) {
			var currentTag = "";
			if( tagName === 'Uncategorized' || tagName === 'Improve categories' ) {
				pageText += '\n\n{{' + tagName + '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
			} else {
				if( tagName === 'Globalize' ) {
					currentTag += '{{' + params.globalize;
				} else {
					currentTag += '{{' + tagName;
				}

				// fill in other parameters, based on the tag
				switch( tagName ) {
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
					case 'News release':
						currentTag += '|1=article';
						break;
					case 'Notability':
						if (params.notability !== 'none' ) {
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
						if (params.mergeTarget) {
							// normalize the merge target for now and later
							params.mergeTarget = Morebits.string.toUpperCaseFirstChar(params.mergeTarget.replace(/_/g, ' '));

							currentTag += '|' + params.mergeTarget;

							// link to the correct section on the talk page, for article space only
							if (mw.config.get('wgNamespaceNumber') === 0 && (params.mergeReason || params.discussArticle)) {
								if (!params.discussArticle) {
									// discussArticle is the article whose talk page will contain the discussion
									params.discussArticle = (tagName === "Merge to" ? params.mergeTarget : mw.config.get('wgTitle'));
									// nonDiscussArticle is the article which won't have the discussion
									params.nonDiscussArticle = (tagName === "Merge to" ? mw.config.get('wgTitle') : params.mergeTarget);
									params.talkDiscussionTitle = 'Diusulkan digabung dengan ' + params.nonDiscussArticle;
								}
								currentTag += '|discuss=Talk:' + params.discussArticle + '#' + params.talkDiscussionTitle;
							}
						}
						break;
					default:
						break;
				}

				currentTag += '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}\n';
				tagText += currentTag;
			}

			if ( tagIndex > 0 ) {
				if( tagIndex === (totalTags - 1) ) {
					summaryText += ' dan';
				} else if ( tagIndex < (totalTags - 1) ) {
					summaryText += ',';
				}
			}

			summaryText += ' {{[[';
			if( tagName === 'Globalize' ) {
				summaryText += "Template:" + params.globalize + '|' + params.globalize;
			} else {
				// if it is a custom tag with a parameter
				if( tagName.indexOf("|") !== -1 ) {
					tagName = tagName.slice(0,tagName.indexOf("|"));
				}
				summaryText += (tagName.indexOf(":") !== -1 ? tagName : ("Template:" + tagName + "|" + tagName));
			}
			summaryText += ']]}}';

		};

		/**
		 * Adds the tags which go outside {{multiple issues}}, either because
		 * these tags aren't supported in {{multiple issues}} or because
		 * {{multiple issues}} is not being added to the page at all
		 */
		var addUngroupedTags = function() {
			totalTags = tags.length;
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
					'(?:<!--.*AfD.*\\n\\{\\{Article for deletion\\/dated.*\\}\\}\\n<!--.*\\n<!--.*AfD.*(?:\\s*\\n))?|' + // trailing whitespace/newline needed since this subst's a newline
					// begin template format
					'\\{\\{\\s*(?:' +
					// CSD
					'db|delete|db-.*?|speedy deletion-.*?|' +
					// PROD
					'(?:proposed deletion|prod blp)\\/dated\\n(?:\\s+\\|(?:concern|user|timestamp|help).*)+|' +
					// various hatnote templates
					'about|correct title|dablink|distinguish|for|other\\s?(?:hurricaneuses|people|persons|places|uses(?:of)?)|redirect(?:-acronym)?|see\\s?(?:also|wiktionary)|selfref|the' +
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
				'i'), "$1" + tagText
			);

			removeTags();
		};

		// Separate tags into groupable ones (`groupableTags`) and non-groupable ones (`tags`)
		params.tags.forEach(function(tag) {
			tagRe = new RegExp( '\\{\\{' + tag + '(\\||\\}\\})', 'im' );
			// regex check for preexistence of tag can be skipped if in canRemove mode
			if( Twinkle.tag.canRemove || !tagRe.exec( pageText ) ) {
				// condition Twinkle.tag.article.tags[tag] to ensure that its not a custom tag
				// Custom tags are assumed non-groupable, since we don't know whether MI template supports them
				if( Twinkle.tag.article.tags[tag] && Twinkle.tag.multipleIssuesExceptions.indexOf(tag) === -1 ) {
					groupableTags.push( tag );
				} else {
					tags.push( tag );
				}
			} else {
				if (tag === 'Merge from' || tag === 'History merge') {
					tags.push( tag );
				} else {
					Morebits.status.warn( 'Info', 'Ditemukan tag {{' + tag +
						'}} di artikel tersebut... membatalkan' );
					// don't do anything else with merge tags
					if ( ['Merge', 'Merge to'].indexOf(tag) !== -1 ) {
						params.mergeTarget = params.mergeReason = params.mergeTagOther = null;
					}
				}
			}
		});

		// To-be-retained existing tags that are groupable
		params.tagsToRemain.forEach( function(tag) {
			if (Twinkle.tag.multipleIssuesExceptions.indexOf(tag) === -1) {
				groupableExistingTags.push(tag);
			}
		});

		var miTest = /\{\{(multiple ?issues|article ?issues|mi)(?!\s*\|\s*section\s*=)[^}]+\{/im.exec(pageText);

		if( miTest && groupableTags.length > 0 ) {
			Morebits.status.info( 'Info', 'Menambah tag yang lain ke dalam tag {{multiple issues}}' );

			tagText = "";

			totalTags = groupableTags.length;
			$.each(groupableTags, addTag);

			summaryText += ' tag' + ( groupableTags.length > 1 ? 's' : '' ) + ' (dalam {{[[Template:multiple issues|multiple issues]]}})';
			if( tags.length > 0 ) {
				summaryText += ', dan';
			}

			var miRegex = new RegExp("(\\{\\{\\s*" + miTest[1] + "\\s*(?:\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?)\\}\\}\\s*", "im");
			pageText = pageText.replace(miRegex, "$1" + tagText + "}}\n");
			tagText = "";

			addUngroupedTags();

		} else if( params.group && !miTest && (groupableExistingTags.length + groupableTags.length) >= 2 ) {
			Morebits.status.info( 'Info', 'Mengelompokkan tag yang didukung ke dalam {{multiple issues}}' );

			tagText += '{{Multiple issues|\n';

			/**
			 * Adds newly added tags to MI
			 */
			var addNewTagsToMI = function() {
				totalTags = groupableTags.length;
				$.each(groupableTags, addTag);
				if (groupableTags.length) {
					summaryText += ' tags (dalam {{[[Template:multiple issues|multiple issues]]}})';
				} else {
					summaryText += ' {{[[Template:multiple issues|multiple issues]]}}';
				}
				if( tags.length > 0 ) {
					summaryText += ', dan';
				}
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

			if(! getRedirectsFor.length) {
				addNewTagsToMI();
				return;
			}

			var api = new Morebits.wiki.api("Getting template redirects", {
				"action": "query",
				"prop": "linkshere",
				"titles": getRedirectsFor.join('|'),
				"redirects": 1,
				"lhnamespace": "10",	// template namespace only
				"lhshow": "redirect",
				"lhlimit": "max"
			}, function replaceRedirectTag(apiobj) {
				$(apiobj.responseXML).find('page').each(function(idx, page) {
					var found = false;
					$(page).find('lh').each(function(idx, el) {
						var tag = $(el).attr('title').slice(9);
						var tag_re = new RegExp('(\\{\\{' + Morebits.pageNameRegex(tag) + '\\s*(\\|[^}]*)?\\}\\}\\n?)');
						if(tag_re.test(pageText)) {
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
			tags = tags.concat( groupableTags );
			addUngroupedTags();
		}

	},

	redirect: function redirect(pageobj) {
		var params = pageobj.getCallbackParameters(),
			pageText = pageobj.getPageText(),
			tagRe, tagText = '', summaryText = 'Added',
			tags = [], i;

		for( i = 0; i < params.tags.length; i++ ) {
			tagRe = new RegExp( '(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im' );
			if( !tagRe.exec( pageText ) ) {
				tags.push( params.tags[i] );
			} else {
				Morebits.status.warn( 'Info', 'Found {{' + params.tags[i] +
					'}} on the redirect already...excluding' );
			}
		}

		var addTag = function redirectAddTag( tagIndex, tagName ) {
			tagText += "\n{{" + tagName;
			if (tagName === 'R from alternative language') {
				if(params.altLangFrom) {
					tagText += '|from=' + params.altLangFrom;
				}
				if(params.altLangTo) {
					tagText += '|to=' + params.altLangTo;
				}
			}
			tagText += '}}';

			if ( tagIndex > 0 ) {
				if( tagIndex === (tags.length - 1) ) {
					summaryText += ' and';
				} else if ( tagIndex < (tags.length - 1) ) {
					summaryText += ',';
				}
			}

			summaryText += ' {{[[:' + (tagName.indexOf(":") !== -1 ? tagName : ("Template:" + tagName + "|" + tagName)) + ']]}}';
		};

		tags.sort();
		$.each(tags, addTag);

		// Check for all Rcat shell redirects (from #433)
		if (pageText.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
			// Regex courtesy [[User:Kephir/gadgets/sagittarius.js]] at [[Special:PermaLink/831402893]]
			var oldTags = pageText.match(/(\s*{{[A-Za-z ]+\|)((?:[^|{}]*|{{[^|}]*}})+)(}})\s*/i);
			pageText = pageText.replace(oldTags[0], oldTags[1] + tagText + oldTags[2] + oldTags[3]);
		} else {
			// Fold any pre-existing Rcats into taglist and under Rcatshell
			var pageTags = pageText.match(/\n{{R(?:edirect)? .*?}}/img);
			var oldPageTags ='';
			if (pageTags) {
				pageTags.forEach(function(pageTag) {
					var pageRe = new RegExp(pageTag, 'img');
					pageText = pageText.replace(pageRe,'');
					oldPageTags += pageTag;
				});
			}
			pageText += '\n{{Redirect category shell|' + tagText + oldPageTags + '\n}}';
		}

		summaryText += ( tags.length > 0 ? ' tag' + ( tags.length > 1 ? 's' : '' ) : '' ) + ' to redirect';

		// avoid truncated summaries
		if (summaryText.length > (254 - Twinkle.getPref('summaryAd').length)) {
			summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)\]\]/g, "$1");
		}

		pageobj.setPageText(pageText);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if( params.patrol ) {
			pageobj.patrol();
		}

	},

	file: function friendlytagCallbacksFile(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var summary = "Menambahkan ";

		// Add maintenance tags
		if (params.tags.length) {

			var tagtext = "", currentTag;
			$.each(params.tags, function(k, tag) {
				// when other commons-related tags are placed, remove "move to Commons" tag
				if (["Keep local", "subst:ncd", "Do not move to Commons_reason", "Jangan pindahkan ke Commons",
					"Now Commons"].indexOf(tag) !== -1) {
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, "");
				}

				currentTag = "{{" + (tag === "Jangan pindahkan ke Commons_reason" ? "Jangan pindahkan ke Commons" : tag);

				switch (tag) {
					case "subst:ncd":
						if (params.ncdName !== "") currentTag += '|1=' + params.ncdName;
						break;
					case "Keep local":
						if (params.keeplocalName !== "") currentTag += '|1=' + params.keeplocalName;
						break;
					case "Rename media":
						if (params.renamemediaNewname !== "") currentTag += '|1=' + params.renamemediaNewname;
						if (params.renamemediaReason !== "") currentTag += '|2=' + params.renamemediaReason;
						break;
					case "Cleanup image":
						currentTag += '|1=' + params.cleanupimageReason;
						break;
					case "Cleanup SVG":
						currentTag += '|1=' + params.cleanupsvgReason;
						break;
					case "Image-Poor-Quality":
						currentTag += '|1=' + params.ImagePoorQualityReason;
						break;
					case "Low quality chem":
						currentTag += '|1=' + params.lowQualityChemReason;
						break;
					case "Vector version available":
						text = text.replace(/\{\{((convert to |convertto|should be |shouldbe|to)?svg|badpng|vectorize)[^}]*\}\}/gi, "");
						/* falls through */
					case "PNG version available":
						/* falls through */
					case "Obsolete":
						/* falls through */
					case "Duplicate":
						currentTag += "|1=" + params[tag.replace(/ /g,'_') + 'File'];
						break;
					case "Do not move to Commons_reason":
						currentTag += '|reason=' + params.DoNotMoveToCommons
						break;
					case "subst:orfurrev":
						//remove {{non-free reduce}} and redirects
						text = text.replace(/\{\{\s*(Template\s*:\s*)?(Non-free reduce|FairUseReduce|Fairusereduce|Fair Use Reduce|Fair use reduce|Reduce size|Reduce|Fair-use reduce|Image-toobig|Comic-ovrsize-img|Non-free-reduce|Nfr|Smaller image|Nonfree reduce)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");
						currentTag += "|date={{subst:date}}";
						break;
					case "Copy to Commons":
						currentTag += "|human=" + mw.config.get("wgUserName");
						break;
					case "Should be SVG":
						currentTag += "|" + params.svgCategory;
						break;
					default:
						break;  // don't care
				}

				currentTag += "}}\n";

				tagtext += currentTag;
				summary += "{{" + tag + "}}, ";
			});

			if (!tagtext) {
				pageobj.getStatusElement().warn("Tindakan pengguna dibatalkan; tugas tidak dilanjutkan");
				return;
			}

			text = tagtext + text;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summary.substring(0, summary.length - 2) + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if( params.patrol ) {
			pageobj.patrol();
		}
	}
};

Twinkle.tag.callback.evaluate = function friendlytagCallbackEvaluate(e) {
	var form = e.target;
	var params = {};
	if (form.patrolPage) {
		params.patrol = form.patrolPage.checked;
	}

	params.tags = form.getChecked( Twinkle.tag.mode + 'Tags' );

	// Save values of input fields into params object. This works as quickform input
	// fields within subgroups of elements with name 'articleTags' (say) have their
	// name attribute as 'articleTags.' + name of the subgroup element

	var name_prefix = Twinkle.tag.mode + 'Tags.';
	$(form).find("[name^='" + name_prefix + "']:not(div)").each(function(idx,el) {
		// el are the HTMLInputElements, el.name gives the name attribute
		params[el.name.slice(name_prefix.length)] =
			(el.type === 'checkbox' ? form[el.name].checked : form[el.name].value);
	});

	switch (Twinkle.tag.mode) {
		case 'article':
			params.tagsToRemove = form.getUnchecked('alreadyPresentArticleTags') || [];
			params.tagsToRemain = form.getChecked('alreadyPresentArticleTags') || [];

			params.group = form.group.checked;

			// Validation
			if ( (params.tags.indexOf("Merge") !== -1) || (params.tags.indexOf("Merge from") !== -1) ||
				(params.tags.indexOf("Merge to") !== -1) ) {
				if( ((params.tags.indexOf("Merge") !== -1) + (params.tags.indexOf("Merge from") !== -1) +
					(params.tags.indexOf("Merge to") !== -1)) > 1 ) {
					alert( 'Please select only one of {{merge}}, {{merge from}}, and {{merge to}}. If several merges are required, use {{merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).' );
					return;
				}
				if ( !params.mergeTarget ) {
					alert( 'Please specify the title of the other article for use in the merge template.' );
					return;
				}
				if( (params.mergeTagOther || params.mergeReason) && params.mergeTarget.indexOf('|') !== -1 ) {
					alert( 'Tagging multiple articles in a merge, and starting a discussion for multiple articles, is not supported at the moment. Please turn off "tag other article", and/or clear out the "reason" box, and try again.' );
					return;
				}
			}
			if( (params.tags.indexOf("Not Indonesian") !== -1) && (params.tags.indexOf("Rough translation") !== -1) ) {
				alert( 'Please select only one of {{not Indonesian}} and {{rough translation}}.' );
				return;
			}
			if( params.tags.indexOf('History merge') !== -1 && params.histmergeOriginalPage.trim() === '') {
				alert( 'You must specify a page to be merged for the {{history merge}} tag.' );
				return;
			}
			if( params.tags.indexOf('Cleanup') !== -1 && params.cleanup.trim() === '') {
				alert( 'You must specify a reason for the {{cleanup}} tag.' );
				return;
			}
			if( params.tags.indexOf('Expand language') !== -1 && params.expandLanguageLangCode.trim() === '') {
				alert('You must specify language code for the {{expand language}} tag.');
				return;
			}
			break;

		case 'file':

			if( (params.tags.indexOf('Cleanup image') !== -1 && params.cleanupimageReason === '') ||
				(params.tags.indexOf('Cleanup svg') !== -1 && params.cleanupsvgReason === '') ) {
				alert( 'You must specify a reason for the cleanup tag.' );
				return;
			}
			if( params.tags.indexOf('Image-Poor-Quality') !== -1 && params.ImagePoorQualityReason === '' ) {
				alert('You must specify a reason for the {{Image-Poor-Quality}} tag');
				return;
			}
			if( params.tags.indexOf('Low Quality Chem') !== -1 && params.lowQualityChemReason === '' ) {
				alert('You must specify a reason for the {{Low Quality Chem}} tag');
				return;
			}
			if( (params.tags.indexOf('Duplicate') !== -1 && params.DuplicateFile === '') ||
				(params.tags.indexOf('Obsolete') !== -1 && params.ObsoleteFile === '') ||
				(params.tags.indexOf('PNG version available') !== -1 && params.PNG_version_availableFile === '') ||
				(params.tags.indexOf('Vector version available') !== -1 && params.Vector_version_availableFile === '')
			) {
				alert('You must specify the replacement file name for a tag in the Replacement tags list');
				return;
			}
			if( params.tags.indexOf('Do not move to Commons_reason') !== -1 && params.DoNotMoveToCommons === '' ) {
				alert('You must specify a reason for the {{Do not move to Commons}} tag');
				return;
			}
			break;

		case 'redirect':
			break;

		default:
			alert("Twinkle.tag: moda tak dikenal " + Twinkle.tag.mode);
			break;
	}

	// File/redirect: return if no tags selected
	// Article: return if no tag is selected and no already present tag is deselected
	if( params.tags.length === 0 && (Twinkle.tag.mode !== 'article' || params.tagsToRemove.length === 0)) {
		alert( 'Setidaknya Anda harus memiliki satu tag!' );
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( form );

	Morebits.wiki.actionCompleted.redirect = Morebits.pageNameNorm;
	Morebits.wiki.actionCompleted.notice = "Menandai selesai, sedang memuat kembali halaman ini dalam beberapa detik";
	if (Twinkle.tag.mode === 'redirect') {
		Morebits.wiki.actionCompleted.followRedirect = false;
	}

	var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, "Menandai " + Twinkle.tag.mode);
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.tag.callbacks[Twinkle.tag.mode]);

};

})(jQuery);
//</nowiki>
