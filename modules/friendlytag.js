//<nowiki>


(function($){


/*
 ****************************************
 *** friendlytag.js: Tag module
 ****************************************
 * Mode of invocation:     Tab ("Tag")
 * Active on:              Existing articles; file pages with a corresponding file
 *                         which is local (not on Commons); existing subpages of
 *                         {Wikipedia|Wikipedia talk}:Articles for creation;
 *                         all redirects
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
	else if( ( mw.config.get('wgNamespaceNumber') === 0 || mw.config.get('wgNamespaceNumber') === 118 || /^Wikipedia( talk)?\:Articles for creation\//.exec(Morebits.pageNameNorm) ) && mw.config.get('wgCurRevisionId') ) {
		Twinkle.tag.mode = 'article';
		Twinkle.addPortletLink( Twinkle.tag.callback, "Tag", "friendly-tag", "Beri tag pemeliharaan ke artikel" );
	}
};

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
							tooltip: 'Jika menerapkan tiga templat atau lebih yang didukung oleh {{multiple issues}} dan kotak ini dicentang, semua templat yang didukung akan dikelompokkan dalam templat {{multiple issues}}.',
							checked: Twinkle.getFriendlyPref('groupByDefault')
						}
					]
				}
			);

			break;

		case 'file':
			Window.setTitle( "Pemberian tag pemeliharaan berkas" );

			// TODO: perhaps add custom tags TO list of checkboxes

			form.append({ type: 'header', label: 'Tag lisensi dan sumber bermasalah' });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.licenseList } );

			form.append({ type: 'header', label: 'Tag terkait dengan Commons' });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.commonsList } );

			form.append({ type: 'header', label: 'Tag perapian' } );
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.cleanupList } );

			form.append({ type: 'header', label: 'Tag kualitas gambar' } );
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.qualityList } );

			form.append({ type: 'header', label: 'Tag penggantian' });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.replacementList } );
			break;

		case 'redirect':
			Window.setTitle( "Tag pengalihan" );

			form.append({ type: 'header', label:'Templat ejaan, salah ketik, gaya, dan kapitalisasi' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.spellingList });

			form.append({ type: 'header', label:'Templat nama pengganti' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.alternativeList });

			form.append({ type: 'header', label:'Templat administrasi dan pengalihan lain-lain' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.administrativeList });
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
		// fake a change event on the sort dropdown, to initialize the tag list
		var evt = document.createEvent("Event");
		evt.initEvent("change", true, true);
		result.sortorder.dispatchEvent(evt);
	}
};

Twinkle.tag.checkedTags = [];

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
			case "cleanup":
				checkbox.subgroup = {
					name: 'cleanup',
					type: 'input',
					label: 'Alasan perapian diperlukan: ',
					tooltip: 'Wajib diisi.',
					size: 35
				};
				break;
			case "copy edit":
				checkbox.subgroup = {
					name: 'copyEdit',
					type: 'input',
					label: '"Artikel ini perlu disunting lebih lanjut untuk..." ',
					tooltip: 'seperti ¨ejaan yang salah¨. Opsional.',
					size: 35
				};
				break;
			case "copypaste":
				checkbox.subgroup = {
					name: 'copypaste',
					type: 'input',
					label: 'URL sumber: ',
					tooltip: 'Jika diketahui.',
					size: 50
				};
				break;
			case "expert-subject":
				checkbox.subgroup = {
					name: 'expertSubject',
					type: 'input',
					label: 'Nama WikiProject terkait: ',
					tooltip: 'Opsional. Berikan nama WikiProject yang dapat membantu merekrut pengguna ahli. Jangan berikan awalan "WikiProject".'
				};
				break;
			case "globalize":
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
								{ label: "{{globalize/India}}: article deals primarily with the Indian viewpoint", value: "globalize/India" },
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
			case "merge":
			case "merge from":
			case "merge to":
				var otherTagName = "merge";
				switch (tag)
				{
					case "merge from":
						otherTagName = "digabungkan ke";
						break;
					case "merge to":
						otherTagName = "digabung dari";
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
							(tag === "digabungkan ke" ? 'artikel lainnya' : 'artikel ini') + ' halaman pembicaraan):',
						tooltip: 'Opsional, namun sangat disarankan. Kosongkan jika tidak diinginkan. Hanya tersedia jika nama artikel tunggal diberikan.'
					});
				}
				break;
			case "not Indonesian":
			case "rough translation":
				checkbox.subgroup = [
					{
						name: 'translationLanguage',
						type: 'input',
						label: 'Bahasa artikel (jika diketahui): ',
						tooltip: 'Baca pedoman penerjemahan artikel untuk informasi lebih lanjut.'
					}
				];
				if (tag === "not Indonesian") {
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
				break;
			case "notability":
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
						/* { label: "{{notability|Neologisms}}: pedoman kelayakan untuk neologisme", value: "Neologisms" },
						{ label: "{{notability|Numbers}}: pedoman kelayakan untuk angka", value: "Numbers" }, */
						{ label: "{{notability|Products}}: pedoman kelayakan untuk produk dan layanan", value: "Products" },
						{ label: "{{notability|Sport}}: pedoman kelayakan untuk olahraga", value: "Sport" },
						{ label: "{{notability|Web}}: pedoman kelayakan untuk isi situs", value: "Web" }
					]
				};
				break;
			default:
				break;
		}
		return checkbox;
	};

	// categorical sort order
	if (sortorder === "cat") {
		// function to iterate through the tags and create a checkbox for each one
		var doCategoryCheckboxes = function(subdiv, array) {
			var checkboxes = [];
			$.each(array, function(k, tag) {
				var description = Twinkle.tag.article.tags[tag];
				checkboxes.push(makeCheckbox(tag, description));
			});
			subdiv.append({
				type: "checkbox",
				name: "articleTags",
				list: checkboxes
			});
		};

		var i = 0;
		// go through each category and sub-category and append lists of checkboxes
		$.each(Twinkle.tag.article.tagCategories, function(title, content) {
			container.append({ type: "header", id: "tagHeader" + i, label: title });
			var subdiv = container.append({ type: "div", id: "tagSubdiv" + i++ });
			if ($.isArray(content)) {
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
		var checkboxes = [];
		$.each(Twinkle.tag.article.tags, function(tag, description) {
			checkboxes.push(makeCheckbox(tag, description));
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

	// add a link to each template's description page
	$.each(Morebits.quickForm.getElements(e.target.form, "articleTags"), function(index, checkbox) {
		var $checkbox = $(checkbox);
		var link = Morebits.htmlNode("a", ">");
		link.setAttribute("class", "tag-template-link");
		link.setAttribute("href", mw.util.getUrl("Template:" +
			Morebits.string.toUpperCaseFirstChar(checkbox.values)));
		link.setAttribute("target", "_blank");
		$checkbox.parent().append(["\u00A0", link]);
	});
};


// Tags for ARTICLES start here

Twinkle.tag.article = {};

// A list of all article tags, in alphabetical order
// To ensure tags appear in the default "categorized" view, add them to the tagCategories hash below.

Twinkle.tag.article.tags = {
	"advert": "artikel ditulis seperti iklan",
	"all plot": "artikel hampir semuanya ringkasan alur",
	"autobiography": "artikel adalah otobiografi yang tidak ditulis secara netral",
	"BLP sources": "artikel tokoh yang masih hidup perlu referensi lebih banyak untuk diperiksa",
	"BLP unsourced": "artikel tokoh yang masih hidup yang tidak punya referensi",
	"citation style": "artikel yang kutipannya tidak jelas atau tak konsisten",
	"cleanup": "artikel memerlukan perapian",
	"cleanup-reorganize": "artikel memerlukan pengubahan struktur agar sesuai dengan pedoman Wikipedia",
	"close paraphrasing": "artikel mengandung parafrasa yang mirip dengan sumber tidak bebas berhak cipta",
	"COI": "pembuat artikel memiliki konflik kepentingan",
	"condense": "artikel mungkin punya banyak kepala bagian yang membagi-bagi isinya",
	"confusing": "artikel tidak memiliki isi yang jelas (membingungkan)",
	"context": "konteks isi artikel tidak mencukupi",
	"copy edit": "artikel butuh perbaikan pada tata bahasa, gaya, relasi antarparagrag, dan/atau ejaan",
	"copypaste": "artikel terkesan disalin dari sebuah sumber",
	"dead end": "artikel tidak punya hubungan dengan artikel lain",
	"disputed": "akurasi aktual isi halaman dipertanyakan",
	"essay-like": "artikel ditulis seperti esai atau opini",
	"expand language": "artikel dapat dikembangkan dengan materi dari Wikipedia bahasa lain",
	"expert-subject": "artikel perlu dilihat oleh pengguna yang ahli di bidang ini",
	"external links": "pranala luar artikel tidak mengikuti pedoman dan kebijakan",
	"fansite": "artikel mirip dengan situs penggemar",
	"fiction": "artikel tidak dapat dibedakan antara nyata atau fiksi",
	"globalize": "artikel tidak mewakili sudut pandang umum subjek tersebut",
	/* "GOCEinuse": "article is currently undergoing a major copy edit by the Guild of Copy Editors", */
	"hoax": "artikel berisi informasi palsu",
	"improve categories": "artikel butuh kategori tambahan",
	"incomprehensible": "artikel sulit untuk dipahami atau tidak komprehensif",
	"in-universe": "subjek artikel adalah fiksi dan butuh gaya penulisan dari sudut pandang nonfiksi",
	"in use": "artikel dalam pengembangan dalam waktu dekat",
	"lead missing": "artikel tidak memiliki bagian pengantar dan perlu ditulis",
	"lead rewrite": "pengantar artikel tidak sesuai pedoman",
	"lead too long": "pengantar artikel sangat panjang dan harus dibuat lebih ringkas",
	"lead too short": "pengantar artikel sangat pendek dan harus dikembangkan",
	"linkrot": "sumber referensi artikel sudah mati, dan penulisannya harus diperbaiki",
	"manual": "gaya artikel mirip dengan buku pedoman",
	"merge": "artikel ini perlu digabungkan ke artikel lain",
	"merge from": "artikel lain harus digabungkan ke artikel ini",
	"merge to": "artikel ini harus digabungkan ke artikel lain",
	/* "metricate": "article exclusively uses non-SI units of measurement", */
	"more footnotes": "artikel sudah punya referensi, namun hanya punya sedikit catatan kaki",
	"new unreviewed article": "tandai artikel untuk diperiksa nanti",
	"news release": "gaya artikel mirip seperti berita",
	"no footnotes": "artikel punya referensi, namun tidak punya catatan kaki",
	"non-free": "artikel mungkin mengandung materi yang berhak cipta yang tidak digunakan sebagaimana mestinya",
	"notability": "subjek artikel tidak memenuhi kelayakan",
	/* "not English": "article is written in a language other than English and needs translation", */
	"one source": "artikel hanya merujuk pada sebuah sumber saja",
	"original research": "artikel memiliki penggunaan riset asli klaim yang tidak terperiksa",
	"orphan": "artikel tidak memiliki hubungan dengan artikel lain",
	"overcoverage": "artikel mengandung anggapan atau cakupan tidak sesuai terhadap satu bagian atau lebih",
	"overlinked": "artikel banyak mengandung pranala duplikat dan/atau tidak berhubungan",
	"overly detailed": "artikel mengandung jumlah detail yang terlalu banyak",
	"peacock": "artikel mengandung istilah hiperbola yang mempromosikan subjek tanpa informasi lengkap",
	"plot": "ringkasan alur di artikel terlalu panjang",
	"POV": "sudut pandang penulisan artikel tidak netral",
	"primary sources": "artikel terlalu mengandalkan sumber primer, dan butuh sumber tambahan",
	"prose": "artikel mengandung format yang lebih sesuai ditulis dalam bentuk prosa",
	"recentism": "artikel ini terlalu condong dengan peristiwa terkini",
	"refimprove": "artikel perlu sumber tambahan untuk diperiksa",
	"rough translation": "artikel sangat jelek penerjemahannya dan memerlukan perbaikan",
	"sections": "artikel perlu dibagi dalam subbagian",
	"self-published": "artikel mengandung sumber yang mungkin tak sesuai untuk sumber yang diterbitkan oleh diri sendiri",
	"technical": "artikel mengandung banyak istilah yang rumit",
	"tense": "artikel ditulis dalam gaya tidak sesuai",
	"third-party": "artikel terlalu mengandalkan sumber kedua, dan butuh sumber ketiga",
	"tone": "gaya penulisan tak sesuai",
	"too few opinions": "artikel tidak mengandung keseluruhan sudut pandang yang penting",
    "tugas sekolah": "artikel yang sedang digunakan untuk penilaian di sekolah/universitas",
	"uncategorized": "artikel tidak ada kategori",
	"under construction": "artikel sedang dalam tahap pengembangan",
	"underlinked": "artikel perlu lebih banyak pranala wiki",
	/* "undue": "article lends undue weight to certain aspects of the subject but not others" */
	"unfocused": "artikel kurang memfokuskan subjek atau punya topik yang lebih dari satu",
	"unreferenced": "artikel tidak punya referensi sama sekali",
	"unreliable sources": "sumber artikel mungkin tidak dapat dipercaya",
	"update": "artikel memerlukan informasi yang lebih aktual",
	"very long": "artikel sangaaaat panjang",
	"weasel": "kenetralan artikel diganggu oleh penggunaan kata bersayap"
};

// A list of tags in order of category
// Tags should be in alphabetical order within the categories
// Add new categories with discretion - the list is long enough as is!

Twinkle.tag.article.tagCategories = {
	"Tag rapikan dan pemeliharaan": {
		"Perapian secara umum": [
			"cleanup",  // has a subgroup with text input
			"copy edit"  // has a subgroup with text input
		],
		"Mengandung konten yang tidak diinginkan": [
			"close paraphrasing",
			"copypaste",  // has a subgroup with text input
			"external links",
			"non-free"
		],
		"Struktur, format, dan pengantar": [
			"cleanup-reorganize",
			"condense",
			"lead missing",
			"lead rewrite",
			"lead too long",
			"lead too short",
			"sections",
			"very long"
		],
		"Perapian terkait isi fiksi": [
			"all plot",
			"fiction",
			"in-universe",
			"plot"
		]
	},
	"Masalah konten secara umum": {
		"Kepentingan dan kelayakan": [
			"notability"  // has a subgroup with subcategories
		],
		"Gaya penulisan": [
			"advert",
			"essay-like",
			"fansite",
			"manual",
			"news release",
			"prose",
			"technical",
			"tense",
			"tone"
		],
		"Makna": [
			"confusing",
			"incomprehensible",
			"unfocused"
		],
		"Detail dan informasi": [
			"context",
			"expert-subject",
			"metricate",
			"overly detailed",
			"undue"
		],
		"Keaktualan": [
			"update"
		],
		"Netralitas, kecondongan dan akurasi faktual": [
			"autobiography",
			"COI",
			"disputed",
			"hoax",
			"globalize",  // has a subgroup with subcategories
			"overcoverage",
			"peacock",
			"POV",
			"recentism",
			"too few opinions",
			"weasel"
		],
		"Pemeriksaan dan sumber": [
			"BLP sources",
			"BLP unsourced",
			"one source",
			"original research",
			"primary sources",
			"refimprove",
			"self-published",
			"third-party",
			"unreferenced",
			"unreliable sources"
		]
	},
	"Masalah konten tertentu": {
		"Bahasa": [
			/ "not Indonesian",  // has a subgroup with several options
			"rough translation",  // has a subgroup with several options
			"expand language"
		],
		"Pranala dan tautan": [
			"dead end",
			"orphan",
			"overlinked",
			"underlinked"
		],
		"Teknik pemberian referensi": [
			"citation style",
			"linkrot",
			"more footnotes",
			"no footnotes"
		],
		"Kategori": [
			"improve categories",
			"uncategorized"
		]
	},
	"Penggabungan": [  // these three have a subgroup with several options
		"merge",
		"merge from",
		"merge to"
	],
	"Informasi halaman": [
		"GOCEinuse",
		"in use",
		"new unreviewed article",
        "tugas sekolah",
		"under construction"
	]
};

// Tags for REDIRECTS start here

Twinkle.tag.spellingList = [
	{
		label: '{{R from initialism}}: dialihkan dari penyingkatan (contoh ANB) ke bentuk panjangnya',
		value: 'R from initialism'
	},
	{
		label: '{{R from acronym}}: dialihkan dari akronim (contoh POTUS) ke bentuk panjangnya',
		value: 'R from acronym'
	},
	{
		label: '{{R to list entry}}: mengalihkan ke artikel berbentuk \¨entitas kecil\¨ yang mengandung pemerian ringkas subjek yang tidak cukup layak untuk dipisahkan artikelnya',
		value: 'R to list entry'
	},
	{
		label: '{{R to section}}: mirip dengan {{R to list entry}}, tetapi ketika daftar disusun dalam bagian seperti daftar karakter fiksi.',
		value: 'R to section'
	},
	{
		label: '{{R from misspelling}}: pengalihan dari kesalahan ejaan atau tipografi',
		value: 'R from misspelling'
	},
	{
		label: '{{R from alternative spelling}}: pengalihan dari judul dengan ejaan berbeda',
		value: 'R from alternative spelling'
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
		label: '{{R with possibilities}}: pengalihan dari judul yang spesifik ke judul yang lebih umum',
		value: 'R with possibilities'
	},
	{
		label: '{{R from member}}: pengalihan dari anggota kelompok ke topik terkait seperti kelompok, organisasi, atau tim yang ia terlibat di dalamnya',
		value: 'R from member'
	},
	{
		label: '{{R from other capitalisation}}: pengalihan dari judul dengan metode kapitalisasi lainnya',
		value: 'R from other capitalisation'
	}
];

Twinkle.tag.alternativeList = [
	{
		label: '{{R from alternative name}}: pengalihan dari judul dari suatu judul lain, nama lain, atau sinonim',
		value: 'R from alternative name'
	},
	{
		label: '{{R from long name}}: pengalihan dari sebuah judul yang lebih lengkap',
		value: 'R from long name'
	},
	{
		label: '{{R from surname}}: pengalihan dari sebuah judul yang merupakan nama belakang',
		value: 'R from surname'
	},
	{
		label: '{{R from historic name}}: pengalihan dari nama lain dengan sejarah yang penting mengenai sebuah wilayah, provinsi, kota, atau lainnya, yang saat ini tidak lagi dikenal dengan nama tersebut',
		value: 'R from historic name'
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
		label: '{{R to scientific name}}: pengalihan dari nama yang umum ke nama ilmiah',
		value: 'R to scientific name'
	},
	{
		label: '{{R from name and country}}: pengalihan dari nama khusus ke nama yang lebih ringkas',
		value: 'R from name and country'
	},
	{
		label: '{{R from alternative language}}: pengalihan dari nama bahasa Inggris ke nama dalam bahasa lain, atau sebaliknya',
		value: 'R from alternative language'
	},
	{
		label: '{{R from ASCII}}: pengalihan dari sebuah judul dalam ASCII dasar ke judul artikel yang formal, dengan perbedaan yang bukan berupa tanda diakritik',
		value: 'R from ASCII'
	},
	{
		label: '{{R to diacritics}}: pengalihan ke judul dengan disertai tanda diakritik',
		value: 'R to diacritics'
	}
];

Twinkle.tag.administrativeList = [
	{
		label: '{{R from merge}}: pengalihan dari halaman yang digabung untuk menyimpan sejarah suntingannya',
		value: 'R from merge'
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
		label: '{{R to decade}}: pengalihan dari suatu tahun ke artikel dekade',
		value: 'R to decade'
	},
	{
		label: '{{R from shortcut}}: pengalihan dari pintasan Wikipedia',
		value: 'R from shortcut'
	},
	{
		label: '{{R from CamelCase}}: pengalihan dari judul CamelCase',
		value: 'R from CamelCase'
	},
	{
		label: '{{R from EXIF}}: pengalihan pranala wiki yang dibuat dari informasi EXIF JPEG',
		value: 'R from EXIF'
	},
	{
		label: '{{R from school}}: pengalihan dari artikel sekolah yang mengandung sedikit informasi',
		value: 'R from school'
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
	{ label: '{{Do not move to Commons}} (masalah DP): berkas berlisensi DP di AS namun tidak dengan negara asalnya', value: 'Do not move to Commons' },
	{ label: '{{Do not move to Commons}} (alasan lain)', value: 'Jangan pindahkan ke Commons Commons_reason' },
	{ label: '{{Keep local}}: permintaan untuk menyimpan salinan lokal dari berkas Commons', value: 'Keep local' },
	{ label: '{{Now Commons}}: berkas sudah dipindahkan ke Commons', value: 'subst:ncd' }
];

Twinkle.tag.file.cleanupList = [
	{ label: '{{Artifacts}}: PNG mengandung artefak sisa kompresi', value: 'Artifacts' },
	{ label: '{{Bad font}}: SVG menggunakan huruf yang tidak tersedia di peladen miniatur', value: 'Bad font' },
	{ label: '{{Bad format}}: berkas PDF/DOC/... harus diubah ke format yang lebih umum/berguna', value: 'Bad format' },
	{ label: '{{Bad GIF}}: GIF yang harus diganti dengan PNG, JPEG, atau SVG', value: 'Bad GIF' },
	{ label: '{{Bad JPEG}}: JPEG yang harus diganti dengan PNG atau SVG', value: 'Bad JPEG' },
	{ label: '{{Bad trace}}: sisa SVG yang perlu dibersihkan', value: 'Bad trace' },
	{ label: '{{Cleanup image}}: perapian umum', value: 'Cleanup image' },
	{ label: '{{Cleanup SVG}}: perapian SVG yang memerlukan kode dan/atau tampilan', value: 'Cleanup SVG' },
	{ label: '{{ClearType}}: gambar (selain tangkapan layar) dengan anti-aliasing ClearType', value: 'ClearType' },
	{ label: '{{Imagewatermark}}: gambar mengandung tanda air yang tampak', value: 'Imagewatermark' },
	{ label: '{{NoCoins}}: gambar menggunakan koin untuk mengindikasikan skala', value: 'NoCoins' },
	{ label: '{{Overcompressed JPEG}}: JPEG dengan artefak tingkat tinggi', value: 'Overcompressed JPEG' },
	{ label: '{{Opaque}}: latar belakang yang perlu dibuat transparan', value: 'Opaque' },
	{ label: '{{Remove border}}: garis pinggir, bagian putih, dsb. yang tak diperlukan', value: 'Remove border' },
	{ label: '{{Rename media}}: nama berkas perlu diubah' value: 'Rename media' },
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
	{ label: '{{Should be text}}: gambar harus diganti dengan teks, tabel, atau kode matematika', value: 'Should be text' },
	{ label: '{{Split media}}: terdapat dua gambar berbeda in log pengunggahan yang perlu dipisahkan', value: 'Split media' }
];

Twinkle.tag.file.qualityList = [
	{ label: '{{Image-blownout}}', value: 'Image-blownout' },
	{ label: '{{Image-out-of-focus}}', value: 'Image-out-of-focus' },
	{ label: '{{Image-Poor-Quality}}', value: 'Image-Poor-Quality' },
	{ label: '{{Image-underexposure}}', value: 'Image-underexposure' },
	{ label: '{{Low quality chem}}: struktur kimia yang dipertentangkan', value: 'Low quality chem' }
];

Twinkle.tag.file.replacementList = [
	{ label: '{{Duplicate}}: berkas duplikat, namun masih dipakai dalam artikel', value: 'Duplicate' },
	{ label: '{{Obsolete}}: berkas baru telah tersedia', value: 'Obsolete' },
	{ label: '{{PNG version available}}', value: 'PNG version available' },
	{ label: '{{Vector version available}}', value: 'Vector version available' }
];


// Contains those article tags that *do not* work inside {{multiple issues}}.
Twinkle.tag.multipleIssuesExceptions = [
	'copypaste',
	'expand language',
	'GOCEinuse',
	'improve categories',
	'in use',
	'merge',
	'merge from',
	'merge to',
	'new unreviewed article',
	'not Indonesian',
	'rough translation',
	'uncategorized',
	'under construction'
];


Twinkle.tag.callbacks = {
	main: function( pageobj ) {
		var params = pageobj.getCallbackParameters(),
		    tagRe, tagText = '', summaryText = 'Added',
		    tags = [], groupableTags = [], i, totalTags;

		// Remove tags that become superfluous with this action
		var pageText = pageobj.getPageText().replace(/\{\{\s*([Nn]ew unreviewed article|[Uu]nreviewed|[Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, "");

		var addTag = function friendlytagAddTag( tagIndex, tagName ) {
			var currentTag = "";
			if( tagName === 'uncategorized' || tagName === 'improve categories' ) {
				pageText += '\n\n{{' + tagName +
					'|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
			} else {
				if( tagName === 'globalize' ) {
					currentTag += '{{' + params.tagParameters.globalize;
				} else {
					currentTag += ( Twinkle.tag.mode === 'redirect' ? '\n' : '' ) + '{{' + tagName;
				}

				if( tagName === 'notability' && params.tagParameters.notability !== 'none' ) {
					currentTag += '|' + params.tagParameters.notability;
				}

				// prompt for other parameters, based on the tag
				switch( tagName ) {
					case 'cleanup':
						if (params.tagParameters.cleanup) {
							currentTag += '|reason=' + params.tagParameters.cleanup;
						}
						break;
					case 'copy edit':
						if (params.tagParameters.copyEdit) {
							currentTag += '|for=' + params.tagParameters.copyEdit;
						}
						break;
					case 'copypaste':
						if (params.tagParameters.copypaste) {
							currentTag += '|url=' + params.tagParameters.copypaste;
						}
						break;
					case 'expand language':
						currentTag += '|topic=';
						var langcode = prompt('Masukkan kode bahasa dari wiki lainnya (contohnya "en").  \n' +
							"Informasi ini diperlukan. Untuk melewatinya, klik Cancel.", "");
						if (langcode === null || langcode === "") {
							Morebits.status.warn("Perhatian", "tag {{expand language}} dilewatkan oleh pengguna");
							return true;  // continue to next tag
						} else {
							currentTag += '|langcode=' + langcode;
						}
						var otherart = prompt('Masukkan nama artikel dari wiki lainnya tanpa awalan antarwiki.  \n' +
							"Informasi ini bersifat opsional. Klik Cancel untuk melewatinya.", "");
						if (otherart === null) {
							Morebits.status.warn("Perhatian", "tag {{expand language}} dilewatkan oleh pengguna");
							return true;  // continue to next tag
						} else {
							currentTag += '|otherarticle=' + otherart;
						}
						break;
					case 'expert-subject':
						if (params.tagParameters.expertSubject) {
							currentTag += '|1=' + params.tagParameters.expertSubject;
						}
						break;
					case 'news release':
						currentTag += '|1=article';
						break;
					case 'not Indonesian':
					case 'rough translation':
						if (params.translationLanguage) {
							currentTag += '|1=' + params.translationLanguage;
						}
						if (params.translationPostAtPNT) {
							currentTag += '|listed=yes';
						}
						break;
					case 'merge':
					case 'merge to':
					case 'merge from':
						if (params.mergeTarget) {
							// normalize the merge target for now and later
							params.mergeTarget = Morebits.string.toUpperCaseFirstChar(params.mergeTarget.replace(/_/g, ' '));

							currentTag += '|' + params.mergeTarget;

							// link to the correct section on the talk page, for article space only
							if (mw.config.get('wgNamespaceNumber') === 0 && (params.mergeReason || params.discussArticle)) {
								if (!params.discussArticle) {
									// discussArticle is the article whose talk page will contain the discussion
									params.discussArticle = (tagName === "merge to" ? params.mergeTarget : mw.config.get('wgTitle'));
									// nonDiscussArticle is the article which won't have the discussion
									params.nonDiscussArticle = (tagName === "merge to" ? mw.config.get('wgTitle') : params.mergeTarget);
									params.talkDiscussionTitle = 'Diusulkan digabung dengan ' + params.nonDiscussArticle;
								}
								currentTag += '|discuss=Talk:' + params.discussArticle + '#' + params.talkDiscussionTitle;
							}
						}
						break;
					default:
						break;
				}

				currentTag += (Twinkle.tag.mode === 'redirect') ? '}}' : '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}\n';
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
			if( tagName === 'globalize' ) {
				summaryText += "Template:" + params.tagParameters.globalize + '|' + params.tagParameters.globalize;
			} else {
				summaryText += (tagName.indexOf(":") !== -1 ? tagName : ("Template:" + tagName + "|" + tagName));
			}
			summaryText += ']]}}';
		};

		if( Twinkle.tag.mode !== 'redirect' ) {
			// Check for preexisting tags and separate tags into groupable and non-groupable arrays
			for( i = 0; i < params.tags.length; i++ ) {
				tagRe = new RegExp( '(\\{\\{' + params.tags[i] + '(\\||\\}\\})|\\|\\s*' + params.tags[i] + '\\s*=[a-z ]+\\d+)', 'im' );
				if( !tagRe.exec( pageText ) ) {
					if( Twinkle.tag.multipleIssuesExceptions.indexOf(params.tags[i]) === -1 ) {
						groupableTags = groupableTags.concat( params.tags[i] );
					} else {
						tags = tags.concat( params.tags[i] );
					}
				} else {
					Morebits.status.warn( 'Informasi', 'Ditemukan tag {{' + params.tags[i] +
						'}} di artikel tersebut... membatalkan...' );
					// don't do anything else with merge tags
					if (params.tags[i] === "merge" || params.tags[i] === "merge from" ||
						params.tags[i] === "merge to") {
						params.mergeTarget = params.mergeReason = params.mergeTagOther = false;
					}
				}
			}

			var miTest = /\{\{(multiple ?issues|article ?issues|mi)[^}]+\{/im.exec(pageText);
			var miOldStyleRegex = /\{\{(multiple ?issues|article ?issues|mi)\s*\|([^{]+)\}\}/im;
			var miOldStyleTest = miOldStyleRegex.exec(pageText);

			if( ( miTest || miOldStyleTest ) && groupableTags.length > 0 ) {
				Morebits.status.info( 'Informasi', 'Menambah tag yang lain ke dalam tag {{multiple issues}}' );

				groupableTags.sort();
				tagText = "";

				totalTags = groupableTags.length;
				$.each(groupableTags, addTag);

				summaryText += ' tag' + ( groupableTags.length > 1 ? 's' : '' ) + ' (within {{[[Template:multiple issues|multiple issues]]}})';
				if( tags.length > 0 ) {
					summaryText += ', dan';
				}

				if( miOldStyleTest ) {
					// convert tags from old-style to new-style
					var split = miOldStyleTest[2].split("|");
					$.each(split, function(index, val) {
						split[index] = val.replace("=", "|date=").trim();
					});
					pageText = pageText.replace(miOldStyleRegex, "{{$1|\n{{" + split.join("}}\n{{") + "}}\n" + tagText + "}}\n");
				} else {
					var miRegex = new RegExp("(\\{\\{\\s*" + miTest[1] + "\\s*(?:\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?)\\}\\}\\s*", "im");
					pageText = pageText.replace(miRegex, "$1" + tagText + "}}\n");
				}
				tagText = "";
			} else if( params.group && groupableTags.length >= 3 ) {
				Morebits.status.info( 'Informasi', 'Mengelompokkan tag yang didukung ke dalam {{multiple issues}}' );

				groupableTags.sort();
				tagText += '{{multiple issues|\n';

				totalTags = groupableTags.length;
				$.each(groupableTags, addTag);

				summaryText += ' tag (dalam {{[[Template:multiple issues|multiple issues]]}})';
				if( tags.length > 0 ) {
					summaryText += ', dan';
				}
				tagText += '}}\n';
			} else {
				tags = tags.concat( groupableTags );
			}
		} else {
			// Redirect tagging: Check for pre-existing tags
			for( i = 0; i < params.tags.length; i++ ) {
				tagRe = new RegExp( '(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im' );
				if( !tagRe.exec( pageText ) ) {
					tags = tags.concat( params.tags[i] );
				} else {
					Morebits.status.warn( 'Informasi', 'Ditemukan {{' + params.tags[i] +
						'}} dalam pengalihan... mengabaikan...' );
				}
			}
		}

		tags.sort();
		totalTags = tags.length;
		$.each(tags, addTag);

		if( Twinkle.tag.mode === 'redirect' ) {
			pageText += tagText;
		} else {
			// smartly insert the new tags after any hatnotes. Regex is a bit more
			// complicated than it'd need to be, to allow templates as parameters,
			// and to handle whitespace properly.
			pageText = pageText.replace(/^\s*(?:((?:\s*\{\{\s*(?:about|correct title|dablink|distinguish|for|other\s?(?:hurricaneuses|people|persons|places|uses(?:of)?)|redirect(?:-acronym)?|see\s?(?:also|wiktionary)|selfref|the)\d*\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\})+(?:\s*\n)?)\s*)?/i,
				"$1" + tagText);
		}
		summaryText += ( tags.length > 0 ? ' tag' + ( tags.length > 1 ? 's' : '' ) : '' ) +
			' to ' + Twinkle.tag.mode;

		// avoid truncated summaries
		if (summaryText.length > (254 - Twinkle.getPref('summaryAd').length)) {
			summaryText = summaryText.replace(/\[\[[^\|]+\|([^\]]+)\]\]/g, "$1");
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
				var talkpageText = "\n\n== Usulan penggabungan dengan [[" + params.nonDiscussArticle + "]] ==\n\n";
				talkpageText += params.mergeReason.trim() + " ~~~~";

				var talkpage = new Morebits.wiki.page("Talk:" + params.discussArticle, "Mengirimkan alasan ke halaman pembicaraan");
				talkpage.setAppendText(talkpageText);
				talkpage.setEditSummary('Usulkan penggabungan [[' + params.nonDiscussArticle + ']] ' +
					(tags.indexOf("merge") !== -1 ? 'with' : 'dengan') + ' [[' + params.discussArticle + ']]' +
					Twinkle.getPref('summaryAd'));
				talkpage.setWatchlist(Twinkle.getFriendlyPref('watchMergeDiscussions'));
				talkpage.setCreateOption('recreate');
				talkpage.append();
			}
			if (params.mergeTagOther) {
				// tag the target page if requested
				var otherTagName = "merge";
				if (tags.indexOf("merge from") !== -1) {
					otherTagName = "merge to";
				} else if (tags.indexOf("merge to") !== -1) {
					otherTagName = "merge from";
				}
				var newParams = {
					tags: [otherTagName],
					mergeTarget: Morebits.pageNameNorm,
					discussArticle: params.discussArticle,
					talkDiscussionTitle: params.talkDiscussionTitle
				};
				var otherpage = new Morebits.wiki.page(params.mergeTarget, "Menandai halaman lain (" +
					params.mergeTarget + ")");
				otherpage.setCallbackParameters(newParams);
				otherpage.load(Twinkle.tag.callbacks.main);
			}

			// post at WP:PNT for {{not English}} and {{rough translation}} tag
			if (params.translationPostAtPNT) {
				var pntPage = new Morebits.wiki.page('Wikipedia:Pages needing translation into English',
					"Listing article at Wikipedia:Pages needing translation into English");
				pntPage.setFollowRedirect(true);
				pntPage.setCallbackParameters({
					template: params.tags.indexOf("rough translation") !== -1 ? "duflu" : "needtrans",
					lang: params.translationLanguage,
					reason: params.translationComments
				});
				pntPage.load(Twinkle.tag.callbacks.translationListPage);
			}
			if (params.translationNotify) {
				pageobj.lookupCreator(function(innerPageobj) {
					var initialContrib = innerPageobj.getCreator();

					// Disallow warning yourself
					if (initialContrib === mw.config.get('wgUserName')) {
						innerPageobj.getStatusElement().warn("Anda (" + initialContrib + ") yang membuat halaman ini; lewati pemberitahuan pengguna");
						return;
					}

					var userTalkPage = new Morebits.wiki.page('User talk:' + initialContrib,
						'Notifying initial contributor (' + initialContrib + ')');
					var notifytext = "\n\n== Artikel Anda [[" + Morebits.pageNameNorm + "]]==\n" +
						"{{subst:uw-notenglish|1=" + Morebits.pageNameNorm +
						(params.translationPostAtPNT ? "" : "|nopnt=yes") + "}} ~~~~";
					userTalkPage.setAppendText(notifytext);
					userTalkPage.setEditSummary("Pemberitahuan: Gunakan bahasa Inggris ketika menulis di Wikipedia bahasa Indonesia." +
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
	},

	translationListPage: function friendlytagCallbacksTranslationListPage(pageobj) {
		var old_text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var statelem = pageobj.getStatusElement();

		var templateText = "{{subst:" + params.template + "|pg=" + Morebits.pageNameNorm + "|Language=" +
			(params.lang || "uncertain") + "|Comments=" + params.reason.trim() + "}} ~~~~";

		var text, summary;
		if (params.template === "duflu") {
			text = old_text + "\n\n" + templateText;
			summary = "Perapian terjemahan telah diminta di ";
		} else {
			text = old_text.replace(/\n+(==\s?Translated pages that could still use some cleanup\s?==)/,
				"\n\n" + templateText + "\n\n$1");
			summary = "Penerjemahan" + (params.lang ? (" dari " + params.lang) : "") + " telah diminta di ";
		}

		if (text === old_text) {
			statelem.error('gagal menemukan tujuan untuk berdiskusi');
			return;
		}
		pageobj.setPageText(text);
		pageobj.setEditSummary(summary + " [[" + Morebits.pageNameNorm + "]]" + Twinkle.getPref('summaryAd'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
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
				if (tag === "Veri vektor tersedia") {
					text = text.replace(/\{\{((convert to |convertto|should be |shouldbe|to)?svg|badpng|vectorize)[^}]*\}\}/gi, "");
				}

				currentTag = "{{" + (tag === "Jangan pindahkan ke Commons_reason" ? "Jangan pindahkan ke Commons" : tag);

				var input;
				switch (tag) {
					case "subst:ncd":
						/* falls through */
					case "Keep local":
						input = prompt( "{{" + (tag === "subst:ncd" ? "Now Commons" : tag) +
							"}} - Berikan nama berkas di Commons, jika berbeda dengan nama berkas lokal. Jangan berikan awalan File:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += '|1=' + input;
						}
						break;
					case "Rename media":
						input = prompt( "{{Rename media}} - Berikan nama baru untuk berkas ini (opsional):", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						input = prompt( "{{Rename media}} - Berikan alasan penggantian nama (opsional):", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|2=" + input;
						}
						break;
					case "Cleanup image":
						/* falls through */
					case "Cleanup SVG":
						input = prompt( "{{" + tag + "}} - Berikan alasan untuk perapian (wajib). Untuk melewatinya, klik Cancel:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						break;
					case "Image-Poor-Quality":
						input = prompt( "{{Image-Poor-Quality}} - Berikan alasan mengapa berkas ini sebegitu jeleknya (wajib). Klik Cancel untuk melewatinya:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						break;
					case "Low quality chem":
						input = prompt( "{{Low quality chem}} - Berikan alasan mengapa diagram ini dipertentangkan (wajib). Klik Cancel untuk melewatinya:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						break;
					case "PNG version available":
						/* falls through */
					case "Vector version available":
						/* falls through */
					case "Obsolete":
						/* falls through */
					case "Duplicate":
						input = prompt( "{{" + tag + "}} - Berikan nama berkas pengganti (wajib). Klik Cancel untuk melewatinya:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						break;
					case "Do not move to Commons_reason":
						input = prompt( "{{Do not move to Commons}} - Berikan alasan mengapa berkas ini tidak boleh dipindahkan ke Commons (wajib). Klik Cancel untuk melewatinya:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|reason=" + input;
						}
						break;
					case "subst:orfurrev":
						//remove {{non-free reduce}} and redirects
						text = text.replace(/\{\{\s*(Template\s*:\s*)?(Non-free reduce|FairUseReduce|Fairusereduce|Fair Use Reduce|Fair use reduce|Reduce size|Reduce|Fair-use reduce|Image-toobig|Comic-ovrsize-img|Non-free-reduce|Nfr|Smaller image|Nonfree reduce)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");
						currentTag += "|date={{subst:date}}";
						break;
					case "Copy to Commons":
						currentTag += "|human=" + mw.config.get("wgUserName");
						break;
					default:
						break;  // don't care
				}

				if (tag === "Should be SVG") {
					currentTag += "|" + params.svgSubcategory;
				}

				currentTag += "}}\n";

				tagtext += currentTag;
				summary += "{{" + tag + "}}, ";

				return true;  // continue
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

	switch (Twinkle.tag.mode) {
		case 'article':
			params.tags = form.getChecked( 'articleTags' );
			params.group = form.group.checked;
			params.tagParameters = {
				cleanup: form["articleTags.cleanup"] ? form["articleTags.cleanup"].value : null,
				copyEdit: form["articleTags.copyEdit"] ? form["articleTags.copyEdit"].value : null,
				copypaste: form["articleTags.copypaste"] ? form["articleTags.copypaste"].value : null,
				expertSubject: form["articleTags.expertSubject"] ? form["articleTags.expertSubject"].value : null,
				globalize: form["articleTags.globalize"] ? form["articleTags.globalize"].value : null,
				notability: form["articleTags.notability"] ? form["articleTags.notability"].value : null
			};
			// common to {{merge}}, {{merge from}}, {{merge to}}
			params.mergeTarget = form["articleTags.mergeTarget"] ? form["articleTags.mergeTarget"].value : null;
			params.mergeReason = form["articleTags.mergeReason"] ? form["articleTags.mergeReason"].value : null;
			params.mergeTagOther = form["articleTags.mergeTagOther"] ? form["articleTags.mergeTagOther"].checked : false;
			// common to {{not English}}, {{rough translation}}
			params.translationLanguage = form["articleTags.translationLanguage"] ? form["articleTags.translationLanguage"].value : null;
			params.translationNotify = form["articleTags.translationNotify"] ? form["articleTags.translationNotify"].checked : null;
			params.translationPostAtPNT = form["articleTags.translationPostAtPNT"] ? form["articleTags.translationPostAtPNT"].checked : null;
			params.translationComments = form["articleTags.translationComments"] ? form["articleTags.translationComments"].value : null;
			break;
		case 'file':
			params.svgSubcategory = form["imageTags.svgCategory"] ? form["imageTags.svgCategory"].value : null;
			params.tags = form.getChecked( 'imageTags' );
			break;
		case 'redirect':
			params.tags = form.getChecked( 'redirectTags' );
			break;
		default:
			alert("Twinkle.tag: moda tak dikenal " + Twinkle.tag.mode);
			break;
	}

	// form validation
	if( !params.tags.length ) {
		alert( 'Setidaknya Anda harus memiliki satu tag!' );
		return;
	}
	if( ((params.tags.indexOf("merge") !== -1) + (params.tags.indexOf("merge from") !== -1) +
		(params.tags.indexOf("merge to") !== -1)) > 1 ) {
		alert( 'Pilihlah salah satu {{merge}}, {{merge from}}, dan {{merge to}}. Jika memerlukan penggabungan lebih dari satu, gunakan {{merge}} dan pisahkan nama artikel dengan karakter pipa (walau dalam kasus ini Twinkle tak dapat menandai artikel lain secara otomatis).' );
		return;
	}
	if( (params.tags.indexOf("not Indonesian") !== -1) && (params.tags.indexOf("rough translation") !== -1) ) {
		alert( 'Pilihlah hanya satu dari {{not Indonesian}} dari {{rough translation}}.' );
		return;
	}
	if( (params.mergeTagOther || params.mergeReason) && params.mergeTarget.indexOf('|') !== -1 ) {
		alert( 'Tandai beberapa artikel dalam sebuah penggabungan, dan mulai diskusi untuk beberapa artikel, tidak didukung saat ini. Matikan opsi "tandai artikel lain", dan/atau kosongkan kotak "alasan" box, dan coba kembali.' );
		return;
	}
	if( params.tags.indexOf('cleanup') !== -1 && params.tagParameters.cleanup.trim && params.tagParameters.cleanup.trim() === "") {
		alert( 'Anda wajib memberikan alasan pemberian tag {{cleanup}}.' );
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
	switch (Twinkle.tag.mode) {
		case 'article':
			/* falls through */
		case 'redirect':
			wikipedia_page.load(Twinkle.tag.callbacks.main);
			return;
		case 'file':
			wikipedia_page.load(Twinkle.tag.callbacks.file);
			return;
		default:
			alert("Twinkle.tag: moda tak dikenal " + Twinkle.tag.mode);
			break;
	}
};
})(jQuery);


//</nowiki>
