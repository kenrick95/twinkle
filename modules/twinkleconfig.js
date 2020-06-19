// <nowiki>


(function($) {


/*
 ****************************************
 *** twinkleconfig.js: Preferences module
 ****************************************
 * Mode of invocation:     Adds configuration form to Wikipedia:Twinkle/Preferences,
                           and adds an ad box to the top of user subpages belonging to the
                           currently logged-in user which end in '.js'
 * Active on:              What I just said.  Yeah.

 I, [[User:This, that and the other]], originally wrote this.  If the code is misbehaving, or you have any
 questions, don't hesitate to ask me.  (This doesn't at all imply [[WP:OWN]]ership - it's just meant to
 point you in the right direction.)  -- TTO
 */


Twinkle.config = {};

Twinkle.config.watchlistEnums = { yes: 'Tambahkan ke daftar pantauan', no: 'Jangan tambahkan ke daftar pantauan', 'default': 'Ikuti preferensi baku di situs ini' };

Twinkle.config.commonSets = {
	csdCriteria: {
		db: 'Alasan khusus ({{db}})',
		u1: 'U1', u2: 'U2', u3: 'U3', u4: 'U4', u5: 'U5', u6: 'U6', u7: 'U7', u8: 'U8', u10: 'U10', u11: 'U11', u12: 'U12', u13: 'U13', u14: 'U14',
		a1: 'A1', a2: 'A2', a3: 'A3', a5: 'A5', a7: 'A7', a9: 'A9', a10: 'A10', a11: 'A11',
		h1: 'H1', h2: 'H2', h3: 'H3', h5: 'H5',
		b1: 'B1', b2: 'B2', b3: 'B3', b7: 'B7', b8: 'B8', b9: 'B9', b10: 'B10',
		k1: 'K1',
		t2: 'T2', t3: 'T3',
		r2: 'R2', r3: 'R3', r4: 'R4',
		p1: 'P1', p2: 'P2'
	},
	csdCriteriaDisplayOrder: [
		'db',
		'u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u10', 'u11', 'u12', 'u13', 'u14',
		'a1', 'a2', 'a3', 'a5', 'a7', 'a9', 'a10', 'a11',
		'h1', 'h2', 'h3', 'h5',
		'b1', 'b2', 'b3', 'b7', 'b8', 'b9', 'b10',
		'k1',
		't2', 't3',
		'r2', 'r3', 'r4',
		'p1', 'p2'
	],
	csdCriteriaNotification: {
		db: 'Alasan khusus ({{db}})',

		u1: 'U1', u2: 'U2', u3: 'U3', u4: 'U4', u6: 'U6 (hanya untuk "pemindahan salin-tempel")',
		u10: 'U10', u11: 'U11', u12: 'U12', u13: 'U13',
		a1: 'A1', a2: 'A2', a3: 'A3', a5: 'A5', a7: 'A7', a9: 'A9', a10: 'A10', a11: 'A11',
		h3: 'H3', h5: 'H5',
		b1: 'B1', b2: 'B2', b3: 'B3', b7: 'B7', b9: 'B9', b10: 'B10',
		k1: 'K1',
		t2: 'T2', t3: 'T3',
		r2: 'R2', r3: 'R3', r4: 'R4',
		p1: 'P1', p2: 'P2'
	},
	csdCriteriaNotificationDisplayOrder: [
		'db',
		'u1', 'u2', 'u3', 'u4', 'u6', 'u10', 'u11', 'u12', 'u13', 'u14',
		'a1', 'a2', 'a3', 'a5', 'a7', 'a9', 'a10', 'a11',
		'h3', 'h5',
		'b1', 'b2', 'b3', 'b7', 'b9', 'b10',
		'c1',
		't2', 't3',
		'r2', 'r3', 'r4',
		'p1', 'p2'
	],
	csdAndDICriteria: {
		db: 'Alasan khusus ({{db}})',
		u1: 'U1', u2: 'U2', u3: 'U3', u4: 'U4', u5: 'U5', u6: 'U6', u7: 'U7', u8: 'U8', u10: 'U10', u11: 'U11', u12: 'U12', u13: 'U13', u14: 'U14',
		a1: 'A1', a2: 'A2', a3: 'A3', a5: 'A5', a7: 'A7', a9: 'A9', a10: 'A10', a11: 'A11',
		h1: 'H1', h2: 'H2', h3: 'H3', h5: 'H5',
		b1: 'B1', b2: 'B2', b3: 'B3', b4: 'B4', b5: 'B5', b6: 'B6', b7: 'B7', b8: 'B8', b9: 'B9', b10: 'B10', b11: 'B11',
		k1: 'K1',
		t2: 'T2', t3: 'T3',
		r2: 'R2', r3: 'R3', r4: 'R4',
		p1: 'P1', p2: 'P2'
	},
	csdAndDICriteriaDisplayOrder: [
		'db',
		'u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u10', 'u11', 'u12', 'u13', 'u14',
		'a1', 'a2', 'a3', 'a5', 'a7', 'a9', 'a10', 'a11',
		'h1', 'h2', 'h3', 'h5',
		'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10', 'b11',
		'k1',
		't2', 't3',
		'r2', 'r3', 'r4',
		'p1', 'p2'
	],
	namespacesNoSpecial: {
		'0': 'Artikel',
		'1': 'Pembicaraan (artikel)',
		'2': 'Pengguna',
		'3': 'Pembicaraan Pengguna',
		'4': 'Wikipedia',
		'5': 'Pembicaraan Wikipedia',
		'6': 'Berkas',
		'7': 'Pembicaraan Berkas',
		'8': 'MediaWiki',
		'9': 'Pembicaraan MediaWiki',
		'10': 'Templat',
		'11': 'Pembicaraan Templat',
		'12': 'Bantuan',
		'13': 'Pembicaraan Bantuan',
		'14': 'Kategori',
		'15': 'Pembicaraan Kategori',
		'100': 'Portal',
		'101': 'Pembicaraan Portal',
		'108': 'Buku',
		'109': 'Pembicaraan Buku',
		'118': 'Draf',
		'119': 'Pembicaraan Draf',
		'710': 'TimedText',
		'711': 'Pembicaraan TimedText',
		'828': 'Modul',
		'829': 'Pembicaraan Modul'
	}
};

/**
 * Section entry format:
 *
 * {
 *   title: <human-readable section title>,
 *   adminOnly: <true for admin-only sections>,
 *   hidden: <true for advanced preferences that rarely need to be changed - they can still be modified by manually editing twinkleoptions.js>,
 *   preferences: [
 *     {
 *       name: <TwinkleConfig property name>,
 *       label: <human-readable short description - used as a form label>,
 *       helptip: <(optional) human-readable text (using valid HTML) that complements the description, like limits, warnings, etc.>
 *       adminOnly: <true for admin-only preferences>,
 *       type: <string|boolean|integer|enum|set|customList> (customList stores an array of JSON objects { value, label }),
 *       enumValues: <for type = "enum": a JSON object where the keys are the internal names and the values are human-readable strings>,
 *       setValues: <for type = "set": a JSON object where the keys are the internal names and the values are human-readable strings>,
 *       setDisplayOrder: <(optional) for type = "set": an array containing the keys of setValues (as strings) in the order that they are displayed>,
 *       customListValueTitle: <for type = "customList": the heading for the left "value" column in the custom list editor>,
 *       customListLabelTitle: <for type = "customList": the heading for the right "label" column in the custom list editor>
 *     },
 *     . . .
 *   ]
 * },
 * . . .
 *
 */

Twinkle.config.sections = [
	{
		title: 'General',
		preferences: [
			// TwinkleConfig.summaryAd (string)
			// Text to be appended to the edit summary of edits made using Twinkle
			{
				name: 'summaryAd',
				label: '"Iklan" yang akan ditambahkan ke dalam ringkasan suntingan Twinkle',
				helptip: 'Iklan ringkasan harus diawali dengan sebuah spasi, dan singkat.',
				type: 'string'
			},

			// TwinkleConfig.deletionSummaryAd (string)
			// Text to be appended to the edit summary of deletions made using Twinkle
			{
				name: 'deletionSummaryAd',
				label: 'Iklan ringkasan yang digunakan untuk ringkasan penghapusan',
				helptip: 'Biasanya sama dengan iklan ringkasan suntingan di atas.',
				adminOnly: true,
				type: 'string'
			},

			// TwinkleConfig.protectionSummaryAd (string)
			// Text to be appended to the edit summary of page protections made using Twinkle
			{
				name: 'protectionSummaryAd',
				label: 'Iklan ringkasan yang digunakan untuk perlindungan halaman',
				helptip: 'Biasanya sama dengan iklan ringkasan suntingan di atas.',
				adminOnly: true,
				type: 'string'
			},

			// TwinkleConfig.userTalkPageMode may take arguments:
			// 'window': open a new window, remember the opened window
			// 'tab': opens in a new tab, if possible.
			// 'blank': force open in a new window, even if such a window exists
			{
				name: 'userTalkPageMode',
				label: 'Ketika membuka halaman pembicaraan pengguna, buka',
				type: 'enum',
				enumValues: { window: 'In a window, replacing other user talks', tab: 'In a new tab', blank: 'In a totally new window' }
			},

			// TwinkleConfig.dialogLargeFont (boolean)
			{
				name: 'dialogLargeFont',
				label: 'Gunakan teks yang lebih besar dalam dialog Twinkle',
				type: 'boolean'
			},

			// Twinkle.config.disabledModules (array)
			{
				name: 'disabledModules',
				label: 'Turn off the selected Twinkle modules',
				helptip: 'Anything you select here will NOT be available for use, so act with care. Uncheck to reactivate.',
				type: 'set',
				setValues: { arv: 'ARV', warn: 'Warn', welcome: 'Welcome', shared: 'Shared IP', talkback: 'Talkback', speedy: 'CSD', prod: 'PROD', xfd: 'XfD', image: 'Image (DI)', protect: 'Protect (RPP)', tag: 'Tag', diff: 'Diff', unlink: 'Unlink', 'fluff': 'Revert and rollback' }
			},

			// Twinkle.config.disabledSysopModules (array)
			{
				name: 'disabledSysopModules',
				label: 'Turn off the selected admin-only modules',
				helptip: 'Anything you select here will NOT be available for use, so act with care. Uncheck to reactivate.',
				adminOnly: true,
				type: 'set',
				setValues: { block: 'Block', deprod: 'DePROD', batchdelete: 'D-batch', batchprotect: 'P-batch', batchundelete: 'Und-batch' }
			}
		]
	},

	{
		title: 'ARV',
		preferences: [
			{
				name: 'spiWatchReport',
				label: 'Menambahkan halaman laporan pengguna siluman ke daftar pantauan',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			}
		]
	},

	{
		title: 'Block user',
		adminOnly: true,
		preferences: [
			// TwinkleConfig.defaultToPartialBlocks (boolean)
			// Whether to default partial blocks on or off
			{
				name: 'defaultToPartialBlocks',
				label: 'Select partial blocks by default when opening the block menu',
				type: 'boolean'
			},

			// TwinkleConfig.blankTalkpageOnIndefBlock (boolean)
			// if true, blank the talk page when issuing an indef block notice (per [[WP:UWUL#Indefinitely blocked users]])
			{
				name: 'blankTalkpageOnIndefBlock',
				label: 'Kosongkan halaman pembicaraan saat memblokir pengguna untuk selamanya',
				helptip: 'Lihat <a href="' + mw.util.getUrl('WP:UW#Indefinitely blocked users') + '">WP:UW</a> untuk informasi lebih lanjut.',
				type: 'boolean'
			}
		]
	},

	{
		title: 'Image deletion (DI)',
		preferences: [
			// TwinkleConfig.notifyUserOnDeli (boolean)
			// If the user should be notified after placing a file deletion tag
			{
				name: 'notifyUserOnDeli',
				label: 'Pilih "beritahu pengunggah berkas" sebagai pengaturan standar',
				type: 'boolean'
			},

			// TwinkleConfig.deliWatchPage (string)
			// The watchlist setting of the page tagged for deletion. Either "yes", "no", or "default". Default is "default" (Duh).
			{
				name: 'deliWatchPage',
				label: 'Menambahkan halaman berkas ke daftar pantauan setelah ditandai',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.deliWatchUser (string)
			// The watchlist setting of the user talk page if a notification is placed. Either "yes", "no", or "default". Default is "default" (Duh).
			{
				name: 'deliWatchUser',
				label: 'Menambahkan halaman pembicaraan pengunggah berkas ke daftar pantauan setelah diberitahu',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			}
		]
	},

	{
		title: 'Usulan penghapusan (UP)',
		preferences: [
			// TwinkleConfig.watchProdPages (boolean)
			// If, when applying prod template to page, to watch the page
			{
				name: 'watchProdPages',
				label: 'Menambahkan artikel ke daftar pantauan setelah ditandai',
				type: 'boolean'
			},

			// TwinkleConfig.markProdPagesAsPatrolled (boolean)
			// If, when applying prod template to page, to mark the page as curated/patrolled (if the page was reached from NewPages)
			{
				name: 'markProdPagesAsPatrolled',
				label: 'Mark page as patrolled/reviewed when tagging (if possible)',
				helptip: 'This should probably not be checked as doing so is against best practice consensus',
				type: 'boolean'
			},

			// TwinkleConfig.prodReasonDefault (string)
			// The prefilled PROD reason.
			{
				name: 'prodReasonDefault',
				label: 'Isian awal alasan UP',
				type: 'string'
			},

			{
				name: 'logProdPages',
				label: 'Simpan log di ruang pengguna halaman yang Anda tandai UP',
				helptip: 'Karena hanya pengurus yang memiliki akses ke kontribusi mereka yang dihapus, log ruang pengguna menawarkan cara yang baik untuk dapat melacak semua halaman yang Anda tandai UP dengan Twinkle.',
				type: 'boolean'
			},
			{
				name: 'prodLogPageName',
				label: 'Simpan log ruang pengguna UP di subhalaman pengguna ini',
				helptip: 'Masukkan nama subhalaman dalam kotak ini. Log UP Anda akan tersimpan di Pengguna:<i>nama pengguna</i>/<i>nama subhalaman</i>. Aktifkan log ruang pengguna UP untuk memanfaatkan fungsi ini.',
				type: 'string'
			}
		]
	},

	{
		title: 'Pengembalian dan pembatalan',  // twinklefluff module
		preferences: [
			// TwinkleConfig.autoMenuAfterRollback (bool)
			// Option to automatically open the warning menu if the user talk page is opened post-reversion
			{
				name: 'autoMenuAfterRollback',
				label: 'Automatically open the Twinkle warn menu on a user talk page after Twinkle rollback',
				helptip: 'Only operates if the relevant box is checked below.',
				type: 'boolean'
			},

			// TwinkleConfig.openTalkPage (array)
			// What types of actions that should result in opening of talk page
			{
				name: 'openTalkPage',
				label: 'Buka halaman pembicaraan pengguna setelah pengembalian dengan cara ini:',
				type: 'set',
				setValues: { agf: 'Pengembalian ANB', norm: 'Pengembalian normal', vand: 'Pengembalian vandalisme', torev: '"Kembalikan revisi ini"' }
			},

			// TwinkleConfig.openTalkPageOnAutoRevert (bool)
			// Defines if talk page should be opened when calling revert from contribs or recent changes pages. If set to true, openTalkPage defines then if talk page will be opened.
			{
				name: 'openTalkPageOnAutoRevert',
				label: 'Buka halaman pembicaraan pengguna setelah melakukan pembatalan dari kontribusi pengguna',
				helptip: 'Mungkin Anda sering membatalkan suntingan pada banyak halaman melalui halaman kontribusi pengguna vandal, sehingga tidaklah nyaman jika harus membuka halaman pembicaraan pengguna. Karenanya opsi ini tidak aktifkan secara bawaan. Jika ini diaktifkan, opsi-opsi yang diinginkan pada pengaturan sebelumnya perlu diaktifkan juga.',
				type: 'boolean'
			},

			// TwinkleConfig.rollbackInPlace (bool)
			//
			{
				name: 'rollbackInPlace',
				label: "Don't reload the page when rolling back from contributions or recent changes",
				helptip: "When this is on, Twinkle won't reload the contributions or recent changes feed after reverting, allowing you to revert more than one edit at a time.",
				type: 'boolean'
			},

			// TwinkleConfig.markRevertedPagesAsMinor (array)
			// What types of actions that should result in marking edit as minor
			{
				name: 'markRevertedPagesAsMinor',
				label: 'Tandai sebagai suntingan kecil pada pengembalian ini',
				type: 'set',
				setValues: { agf: 'Pengembalian ANB', norm: 'Pengembalian normal', vand: 'Pengembalian vandalisme', torev: '"Kembalikan revisi ini"' }
			},

			// TwinkleConfig.watchRevertedPages (array)
			// What types of actions that should result in forced addition to watchlist
			{
				name: 'watchRevertedPages',
				label: 'Tambahkan halaman ke daftar pantauan pada pengembalian ini',
				type: 'set',
				setValues: { agf: 'Pengembalian ANB', norm: 'Pengembalian normal', vand: 'Pengembalian vandalisme', torev: '"Kembalikan revisi ini"' }
			},

			// TwinkleConfig.offerReasonOnNormalRevert (boolean)
			// If to offer a prompt for extra summary reason for normal reverts, default to true
			{
				name: 'offerReasonOnNormalRevert',
				label: 'Tanyakan alasan untuk pengembalian normal',
				helptip: 'Pengembalian "normal" adalah jenis pengembalian yang dilakukan dengan mengeklik [kembalikan] di sisi tengah.',
				type: 'boolean'
			},

			{
				name: 'confirmOnFluff',
				label: 'Tampilkan pesan konfirmasi sebelum melakukan pengembalian',
				helptip: 'Bagi pengguna perangkat sentuh atau pena, dan mereka yang sering mengalami kebimbangan.',
				type: 'boolean'
			},

			// TwinkleConfig.showRollbackLinks (array)
			// Where Twinkle should show rollback links:
			// diff, others, mine, contribs, history, recent
			// Note from TTO: |contribs| seems to be equal to |others| + |mine|, i.e. redundant, so I left it out heres
			{
				name: 'showRollbackLinks',

				label: 'Tampilkan tautan-tautan pengembalian pada halaman ini',
				type: 'set',
				setValues: { diff: 'Halaman Diff', others: 'Halaman kontribusi pengguna lain', mine: 'Halaman kontribusi saya', recent: 'Recent changes and related changes special pages', history: 'History pages' }
			}
		]
	},

	{
		title: 'Shared IP tagging',
		preferences: [
			{
				name: 'markSharedIPAsMinor',
				label: 'Tandai penandaan IP bersama sebagai suntingan kecil',
				type: 'boolean'
			}
		]
	},

	{
		title: 'Penghapusan cepat (KPC)',
		preferences: [
			{
				name: 'speedySelectionStyle',
				label: 'Kapan eksekusi dilakukan dan menandai/menghapus halaman',
				type: 'enum',
				enumValues: { 'buttonClick': 'Ketika saya mengeklik "Submit"', 'radioClick': 'Setelah saya memilih sebuah opsi' }
			},

			// TwinkleConfig.watchSpeedyPages (array)
			// Whether to add speedy tagged or deleted pages to watchlist
			{
				name: 'watchSpeedyPages',
				label: 'Tambahkan halaman ke daftar pantauan setelah menandai dengan kriteria ini',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteria,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaDisplayOrder
			},

			// TwinkleConfig.markSpeedyPagesAsPatrolled (boolean)
			// If, when applying speedy template to page, to mark the page as triaged/patrolled (if the page was reached from NewPages)
			{
				name: 'markSpeedyPagesAsPatrolled',
				label: 'Tandai halaman sebagai sudah dipatroli setelah dilakukan penandaan (jika memungkinkan)',
				helptip: 'This should probably not be checked as doing so is against best practice consensus',
				type: 'boolean'
			},

			// TwinkleConfig.welcomeUserOnSpeedyDeletionNotification (array of strings)
			// On what types of speedy deletion notifications shall the user be welcomed
			// with a "firstarticle" notice if their talk page has not yet been created.
			{
				name: 'welcomeUserOnSpeedyDeletionNotification',
				label: 'Beritahu pembuat halaman jika menandai dengan kriteria ini',
				helptip: 'Meskipun Anda memilih untuk memberitahukan melalui tampilan KPC, pemberitahuan tersebut hanya akan dilakukan sesuai kriteria yang dipilih di sini.',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteriaNotification,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
			},

			// TwinkleConfig.notifyUserOnSpeedyDeletionNomination (array)
			// What types of actions should result in the author of the page being notified of nomination
			{
				name: 'notifyUserOnSpeedyDeletionNomination',
				label: 'Sapa pembuat halaman bersama dengan pemberitahuan setelah menandai dengan kriteria ini',
				helptip: 'Selamat datang hanya akan ditampilkan jika pengguna tersebut diberitahu mengenai penghapusan, dan hanya jika halaman pembicaraannya belum ada. Templat yang digunakan adalah {{Selamat datang 2}}.',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteriaNotification,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
			},

			// TwinkleConfig.warnUserOnSpeedyDelete (array)
			// What types of actions should result in the author of the page being notified of speedy deletion (admin only)
			{
				name: 'warnUserOnSpeedyDelete',
				label: 'Notify page creator when deleting under these criteria',
				helptip: 'Even if you choose to notify from the CSD screen, the notification will only take place for those criteria selected here.',
				adminOnly: true,
				type: 'set',
				setValues: Twinkle.config.commonSets.csdCriteriaNotification,
				setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
			},

			// TwinkleConfig.promptForSpeedyDeletionSummary (array of strings)
			{
				name: 'promptForSpeedyDeletionSummary',
				label: 'Izinkan penyuntingan ringkasan penghapusan setelah menghapus dengan kriteria ini',
				adminOnly: true,
				type: 'set',
				setValues: Twinkle.config.commonSets.csdAndDICriteria,
				setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder
			},

			// TwinkleConfig.deleteTalkPageOnDelete (boolean)
			// If talk page if exists should also be deleted (CSD G8) when spedying a page (admin only)
			{
				name: 'deleteTalkPageOnDelete',
				label: 'Pilih "juga hapus halaman pembicaraan" secara bawaan',
				adminOnly: true,
				type: 'boolean'
			},

			{
				name: 'deleteRedirectsOnDelete',
				label: 'Pilih "juga hapus pengalihan" secara bawaan',
				adminOnly: true,
				type: 'boolean'
			},

			// TwinkleConfig.deleteSysopDefaultToDelete (boolean)
			// Make the CSD screen default to "delete" instead of "tag" (admin only)
			{
				name: 'deleteSysopDefaultToDelete',
				label: 'Default to outright deletion instead of speedy tagging',
				helptip: 'If there is a CSD tag already present, Twinkle will always default to "delete" mode',
				adminOnly: true,
				type: 'boolean'
			},

			// TwinkleConfig.speedyWindowWidth (integer)
			// Defines the width of the Twinkle SD window in pixels
			{
				name: 'speedyWindowWidth',
				label: 'Lebar jendela penghapusan cepat (piksel)',
				type: 'integer'
			},

			// TwinkleConfig.speedyWindowWidth (integer)
			// Defines the width of the Twinkle SD window in pixels
			{
				name: 'speedyWindowHeight',
				label: 'Tinggi jendela penghapusan cepat (piksel)',
				helptip: 'Jika memiliki monitor besar, mungkin Anda ingin memperbesar jendela ini.',
				type: 'integer'
			},

			{
				name: 'logSpeedyNominations',
				label: 'Simpan log dalam ruang pengguna nominasi KPC',
				helptip: 'Karena selain pengurus tidak memiliki akses ke kontribusi mereka yang dihapus, log ruang pengguna menawarkan cara yang baik untuk melacak semua halaman yang Anda nominasikan KPC menggunakan Twinkle. Berkas yang ditandai menggunakan PB juga ditambahkan ke log ini.',
				type: 'boolean'
			},
			{
				name: 'speedyLogPageName',
				label: 'Simpan log ruang pengguna KPC di subhalaman pengguna ini',
				helptip: 'Masukkan nama subhalaman dalam kotak ini. Log KPC Anda akan tersimpan di Pengguna:<i>nama pengguna</i>/<i>nama subhalaman</i>. Aktifkan log ruang pengguna KPC untuk memanfaatkan fungsi ini.',
				type: 'string'
			},
			{
				name: 'noLogOnSpeedyNomination',
				label: 'Jangan buat entri log ruang pengguna setelah menandai dengan kriteria ini',
				type: 'set',
				setValues: Twinkle.config.commonSets.csdAndDICriteria,
				setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder
			}
		]
	},

	{
		title: 'Tag',
		preferences: [
			{
				name: 'watchTaggedPages',
				label: 'Tambahkan halaman ke daftar pantauan setelah penandaan',
				type: 'boolean'
			},
			{
				name: 'watchMergeDiscussions',
				label: 'Tambahkan halaman pembicaraan ke daftar pantauan setelah memulai diskusi penggabungan',
				type: 'boolean'
			},
			{
				name: 'markTaggedPagesAsMinor',
				label: 'Tandai penambahan tag sebagai suntingan kecil',
				type: 'boolean'
			},
			{
				name: 'markTaggedPagesAsPatrolled',
				label: 'Pilih "tandai halaman sebagai sudah dipatroli" secara bawaan',
				type: 'boolean'
			},
			{
				name: 'groupByDefault',
				label: 'Pilih "kelompokkan dalam {{artikel bermasalah}}" secara bawaan',
				type: 'boolean'
			},
			{
				name: 'tagArticleSortOrder',
				label: 'Urutan tampilan bawaan untuk tag artikel',
				type: 'enum',
				enumValues: { 'cat': 'Berdasarkan kategori', 'alpha': 'Alfabetis' }
			},
			{
				name: 'customTagList',
				label: 'Tampilan tag pemeliharaan artikel kustom',
				helptip: 'Ini tampil sebagai opsi tambahan di bawah daftar tag. Misalnya, Anda dapat menambahkan tag pemeliharaan baru yang belum pernah ditambahkan ke bawaan Twinkle.',
				type: 'customList',
				customListValueTitle: 'Nama templat (tanpa tanda kurung kurawal)',
				customListLabelTitle: 'Teks yang ditampilkan di dialog Tag '
			},
			{
				name: 'customFileTagList',
				label: 'Tampilan tag pemeliharaan berkas kustom',
				helptip: 'Tag tambahan untuk berkas.',
				type: 'customList',
				customListValueTitle: 'Nama templat (tanpa tanda kurung kurawal)',
				customListLabelTitle: 'Teks yang ditampilkan di dialog Tag '
			},
			{
				name: 'customRedirectTagList',
				label: 'Tampilan tag pemeliharaan halaman pengalihan kustom',
				helptip: 'Tag tambahan untuk pengalihan.',
				type: 'customList',
				customListValueTitle: 'Nama templat (tanpa tanda kurung kurawal)',
				customListLabelTitle: 'Teks yang ditampilkan di dialog Tag '
			}
		]
	},

	{
		title: 'Balasan pembicaraan',
		preferences: [
			{
				name: 'markTalkbackAsMinor',
				label: 'Tandai balasan pembicaraan sebagai suntingan kecil',
				type: 'boolean'
			},
			{
				name: 'insertTalkbackSignature',
				label: 'Tambahkan tanda tangan di dalam balasan pembicaraan',
				type: 'boolean'
			},
			{
				name: 'talkbackHeading',
				label: 'Judul bagian yang digunakan untuk balasan pembicaraan',
				type: 'string'
			},
			{
				name: 'adminNoticeHeading',
				label: 'Judul bagian yang digunakan untuk pemberitahuan papan pengumuman pengurus',
				helptip: 'Hanya relevan untuk AN dan ANI.',
				type: 'string'
			},
			{
				name: 'mailHeading',
				label: 'Judul bagian yang digunakan untuk pemberitahuan "Anda mendapatkan pesan"',
				type: 'string'
			}
		]
	},

	{
		title: 'Hapus tautan',
		preferences: [
			// TwinkleConfig.unlinkNamespaces (array)
			// In what namespaces unlink should happen, default in 0 (article), 10 (template), 100 (portal), and 118 (draft)
			{
				name: 'unlinkNamespaces',
				label: 'Hapus tautan dari halaman dalam ruangnama ini',
				helptip: 'Hindari memilih ruangnama pembicaraan apapun, karena Twinkle mungkin akan menghapus tautan dalam arsip pembicaraan.',
				type: 'set',
				setValues: Twinkle.config.commonSets.namespacesNoSpecial
			}
		]
	},

	{
		title: 'Memperingatkan pengguna',
		preferences: [
			// TwinkleConfig.defaultWarningGroup (int)
			// Which level warning should be the default selected group, default is 1
			{
				name: 'defaultWarningGroup',
				label: 'Tingkatan peringatan bawaan',
				type: 'enum',
				enumValues: {
					'1': 'Tingkat 1',
					'2': 'Tingkat 2',
					'3': 'Tingkat 3',
					'4': 'Tingkat 4',
					'5': 'Tingkat 4im',
					'6': 'Pemberitahuan masalah tunggal',
					'7': 'Peringatan masalah tunggal',
					// 8 was used for block templates before #260
					'9': 'Peringatan lainnya',
					'10': 'All warning templates',
					'11': 'Auto-select level (1-4)'
				}
			},

			// TwinkleConfig.combinedSingletMenus (boolean)
			// if true, show one menu with both single-issue notices and warnings instead of two separately
			{
				name: 'combinedSingletMenus',
				label: 'Replace the two separate single-issue menus into one combined menu',
				helptip: 'Selecting either single-issue notices or single-issue warnings as your default will make this your default if enabled.',
				type: 'boolean'
			},

			// TwinkleConfig.showSharedIPNotice may take arguments:
			// true: to show shared ip notice if an IP address
			// false: to not print the notice
			{
				name: 'showSharedIPNotice',
				label: 'Tambahkan pemberitahuan tambahan di halaman pembicaraan IP bersama',
				helptip: 'Pemberitahuan yang digunakan adalah {{Shared IP advice}}',
				type: 'boolean'
			},

			// TwinkleConfig.watchWarnings (boolean)
			// if true, watch the page which has been dispatched an warning or notice, if false, default applies
			{
				name: 'watchWarnings',
				label: 'Tambahkan halaman pembicaraan pengguna ke daftar pantauan setelah pemberitahuan',
				type: 'boolean'
			},

			// TwinkleConfig.oldSelect (boolean)
			// if true, use the native select menu rather the select2-based one
			{
				name: 'oldSelect',
				label: 'Use the non-searchable classic select menu',
				type: 'boolean'
			},

			{
				name: 'customWarningList',
				label: 'Tampilan templat peringatan kustom',
				helptip: 'Anda dapat menambahkan subhalaman pengguna atau templat pribadi. Peringatan kustom ditampilkan dalam kategori "Peringatan kustom" di dalam kotak dialog peringatan.',
				type: 'customList',
				customListValueTitle: 'Nama templat (tanpa tanda kurung kurawal)',
				customListLabelTitle: 'Teks yang ditampilkan di daftar peringatan (juga di ringkasan suntingan)'
			}
		]
	},

	{
		title: 'Menyambut pengguna (selamat datang)',
		preferences: [
			{
				name: 'topWelcomes',
				label: 'Tempatkan sambutan di atas semua konten yang ada di halaman pembicaraan pengguna',
				type: 'boolean'
			},
			{
				name: 'watchWelcomes',
				label: 'Tambahkan halaman pembicaraan pengguna ke daftar pantauan setelah menyambutnya',
				helptip: 'Melakukan hal ini merupakan penanganan pribadi dalam menyambut pengguna; Anda akan dapat memantau perkembangan mereka sebagai pemula, dan mungkin membantunya.',
				type: 'boolean'
			},
			{
				name: 'insertUsername',
				label: 'Tambahkan nama pengguna Anda ke templat (bila memungkinkan)',
				helptip: 'Beberapa templat selamat datang memiliki kalimat pembuka seperti "Halo, saya &lt;nama pengguna&gt;. Selamat datang" dll. Jika Anda menonaktifkan opsi ini, templat tersebut tidak akan tampil seperti demikian.',
				type: 'boolean'
			},
			{
				name: 'quickWelcomeMode',
				label: 'Mengeklik tautan "selamat datang" pada halaman perbedaan revisi akan',
				helptip: 'Jika Anda memilih penyambutan otomatis, templat yang Anda pilih di bawah akan digunakan.',
				type: 'enum',
				enumValues: { auto: 'sambut secara otomatis', norm: 'tanya Anda untuk memilih sebuah templat' }
			},
			{
				name: 'quickWelcomeTemplate',
				label: 'Templat yang digunakan untuk penyambutan otomatis',
				helptip: 'Masukkan nama templat selamat datang, tanpa kurung kurawal. Tautan ke artikel yang disuntingnya itu akan disertakan.',
				type: 'string'
			},
			{
				name: 'customWelcomeList',
				label: 'Tampilan templat selamat datang kustom',
				helptip: 'Anda dapat menambahkan templat selamat datang lainnya, atau subhalaman pengguna yang merupakan templat selamat datang (diawali dengan "User:"). Harap diingat bahwa templat ini disubstitusi ke halaman pembicaraan pengguna.',
				type: 'customList',
				customListValueTitle: 'Nama templat (tanpa kurung kurawal)',
				customListLabelTitle: 'Teks yang ditampilkan di kotak dialog Selamat datang'
			},
			{
				name: 'customWelcomeSignature',
				label: 'Tanda tangani templat selamat datang secara otomatis',
				helptip: 'Jika templat selamat datang kustom Anda telah memuat tanda tangan di dalam templatnya, nonaktifkan opsi ini.',
				type: 'boolean'
			}
		]
	},

	{
		title: 'XFD (diskusi penghapusan)',
		preferences: [
			{
				name: 'logXfdNominations',
				label: 'Keep a log in userspace of all pages you nominate for a deletion discussion (XfD)',
				helptip: 'The userspace log offers a good way to keep track of all pages you nominate for XfD using Twinkle.',
				type: 'boolean'
			},
			{
				name: 'xfdLogPageName',
				label: 'Keep the deletion discussion userspace log at this user subpage',
				helptip: 'Enter a subpage name in this box. You will find your XfD log at User:<i>username</i>/<i>subpage name</i>. Only works if you turn on the XfD userspace log.',
				type: 'string'
			},
			{
				name: 'noLogOnXfdNomination',
				label: 'Do not create a userspace log entry when nominating at this venue',
				type: 'set',
				setValues: { afd: 'AfD', tfd: 'TfD', ffd: 'FfD', cfd: 'CfD', cfds: 'CfD/S', mfd: 'MfD', rfd: 'RfD', rm: 'RM' }
			},

			// TwinkleConfig.xfdWatchPage (string)
			// The watchlist setting of the page being nominated for XfD. Either "yes" (add to watchlist), "no" (don't
			// add to watchlist), or "default" (use setting from preferences). Default is "default" (duh).
			{
				name: 'xfdWatchPage',
				label: 'Tambahkan halaman nominasi itu ke daftar pantauan',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchDiscussion (string)
			// The watchlist setting of the newly created XfD page (for those processes that create discussion pages for each nomination),
			// or the list page for the other processes.
			// Either "yes" (add to watchlist), "no" (don't add to watchlist), or "default" (use setting from preferences). Default is "default" (duh).
			{
				name: 'xfdWatchDiscussion',
				label: 'Tambahkan halaman diskusi penghapusan ke daftar pantauan',
				helptip: 'Ini merujuk ke subhalaman diskusi (untuk AfD dan MfD) atau halaman log harian (untuk TfD, CfD, RfD dan FfD)',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchList (string)
			// The watchlist setting of the XfD list page, *if* the discussion is on a separate page. Either "yes" (add to watchlist), "no" (don't
			// add to watchlist), or "default" (use setting from preferences). Default is "no" (Hehe. Seriously though, who wants to watch it?
			// Sorry in advance for any false positives.).
			{
				name: 'xfdWatchList',
				label: 'Tambahkan log harian/daftar halaman ke daftar pantauan (jika memungkinkan)',
				helptip: 'Ini hanya berlaku untuk AfD dan MfD, di mana diskusinya ditransklusikan ke halaman log harian (untuk AfD) atau halaman utama MfD (untuk MfD).',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchUser (string)
			// The watchlist setting of the user talk page if they receive a notification. Either "yes" (add to watchlist), "no" (don't
			// add to watchlist), or "default" (use setting from preferences). Default is "default" (duh).
			{
				name: 'xfdWatchUser',
				label: 'Tambahkan halaman pembicaraan pengguna ke daftar pantauan (ketika memberitahukan)',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			// TwinkleConfig.xfdWatchRelated (string)
			// The watchlist setting of the target of a redirect being nominated for RfD. Either "yes" (add to watchlist), "no" (don't
			// add to watchlist), or "default" (use setting from preferences). Default is "default" (duh).
			{
				name: 'xfdWatchRelated',
				label: 'Tambahkan halaman target pengalihan ke daftar pantauan (ketika memberitahukan)',
				helptip: 'Ini hanya berlaku untuk RfD, ketika memberitahukan di halaman pembicaraan target dari halaman pengalihan',
				type: 'enum',
				enumValues: Twinkle.config.watchlistEnums
			},

			{
				name: 'markXfdPagesAsPatrolled',
				label: 'Tandai halaman sebagai sudah dipatroli setelah nominasi AFD (jika mungkin)',
				type: 'boolean'
			}
		]
	},

	{
		title: 'Disembunyikan',
		hidden: true,
		preferences: [
			// twinkle.js: portlet setup
			{
				name: 'portletArea',
				type: 'string'
			},
			{
				name: 'portletId',
				type: 'string'
			},
			{
				name: 'portletName',
				type: 'string'
			},
			{
				name: 'portletType',
				type: 'string'
			},
			{
				name: 'portletNext',
				type: 'string'
			},
			// twinklefluff.js: defines how many revision to query maximum, maximum possible is 50, default is 50
			{
				name: 'revertMaxRevisions',
				type: 'integer'
			},
			// twinklewarn.js: When using the autolevel select option, how many days makes a prior warning stale
			// Huggle is three days ([[Special:Diff/918980316]] and [[Special:Diff/919417999]]) while ClueBotNG is two:
			// https://github.com/DamianZaremba/cluebotng/blob/4958e25d6874cba01c75f11debd2e511fd5a2ce5/bot/action_functions.php#L62
			{
				name: 'autolevelStaleDays',
				type: 'integer'
			},
			// twinklebatchdelete.js: How many pages should be processed maximum
			{
				name: 'batchMax',
				type: 'integer',
				adminOnly: true
			},
			// twinklebatchdelete.js: How many pages should be processed at a time
			{
				name: 'batchdeleteChunks',
				type: 'integer',
				adminOnly: true
			},
			// twinklebatchprotect.js: How many pages should be processed at a time
			{
				name: 'batchProtectChunks',
				type: 'integer',
				adminOnly: true
			},
			// twinklebatchundelete.js: How many pages should be processed at a time
			{
				name: 'batchundeleteChunks',
				type: 'integer',
				adminOnly: true
			},
			// twinkledeprod.js: How many pages should be processed at a time
			{
				name: 'proddeleteChunks',
				type: 'integer',
				adminOnly: true
			}
		]
	}

]; // end of Twinkle.config.sections


Twinkle.config.init = function twinkleconfigInit() {

	// create the config page at Wikipedia:Twinkle/Preferences
	if ((mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').project && mw.config.get('wgTitle') === 'Twinkle/Preferences') &&
			mw.config.get('wgAction') === 'view') {

		if (!document.getElementById('twinkle-config')) {
			return;  // maybe the page is misconfigured, or something - but any attempt to modify it will be pointless
		}

		// set style (the url() CSS function doesn't seem to work from wikicode - ?!)
		document.getElementById('twinkle-config-titlebar').style.backgroundImage = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAkCAMAAAB%2FqqA%2BAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAEhQTFRFr73ZobTPusjdsMHZp7nVwtDhzNbnwM3fu8jdq7vUt8nbxtDkw9DhpbfSvMrfssPZqLvVztbno7bRrr7W1d%2Fs1N7qydXk0NjpkW7Q%2BgAAADVJREFUeNoMwgESQCAAAMGLkEIi%2FP%2BnbnbpdB59app5Vdg0sXAoMZCpGoFbK6ciuy6FX4ABAEyoAef0BXOXAAAAAElFTkSuQmCC)';

		var contentdiv = document.getElementById('twinkle-config-content');
		contentdiv.textContent = '';  // clear children

		// let user know about possible conflict with skin js/common.js file
		// (settings in that file will still work, but they will be overwritten by twinkleoptions.js settings)
		if (window.TwinkleConfig || window.FriendlyConfig) {
			var contentnotice = document.createElement('p');
			contentnotice.innerHTML = '<table class="plainlinks ombox ombox-content"><tr><td class="mbox-image">' +
				'<img alt="" src="https://upload.wikimedia.org/wikipedia/commons/3/38/Imbox_content.png" /></td>' +
				'<td class="mbox-text"><p><big><b>Sebelum mengubah preferensi Anda di sini,</b> pastikan Anda telah menghapus setelan Twinkle dan Friendly lama dari skrip JavaScript kulit Anda.</big></p>' +
				'<p>Anda dapat mengunjungi <a href="' + mw.util.getUrl('User:' + mw.config.get('wgUserName') + '/' + mw.config.get('skin') +
				'.js', { action: 'edit' }) + '" target="_blank"><b>halaman kulit ini</b></a> atau <a href="' +
				mw.util.getUrl('User:' + mw.config.get('wgUserName') + '/common.js', { action: 'edit'}) + '" target="_blank"><b>berkas common.js Anda</b></a>, menghapus semua setelan tentang <code>TwinkleConfig</code> dan <code>FriendlyConfig</code>.</p>' +
				'</td></tr></table>';
			contentdiv.appendChild(contentnotice);
		}

		// start a table of contents
		var toctable = document.createElement('div');
		toctable.className = 'toc';
		toctable.style.marginLeft = '0.4em';
		// create TOC title
		var toctitle = document.createElement('div');
		toctitle.id = 'toctitle';
		var toch2 = document.createElement('h2');
		toch2.textContent = 'Contents ';
		toctitle.appendChild(toch2);
		// add TOC show/hide link
		var toctoggle = document.createElement('span');
		toctoggle.className = 'toctoggle';
		toctoggle.appendChild(document.createTextNode('['));
		var toctogglelink = document.createElement('a');
		toctogglelink.className = 'internal';
		toctogglelink.setAttribute('href', '#tw-tocshowhide');
		toctogglelink.textContent = 'hide';
		toctoggle.appendChild(toctogglelink);
		toctoggle.appendChild(document.createTextNode(']'));
		toctitle.appendChild(toctoggle);
		toctable.appendChild(toctitle);
		// create item container: this is what we add stuff to
		var tocul = document.createElement('ul');
		toctogglelink.addEventListener('click', function twinkleconfigTocToggle() {
			var $tocul = $(tocul);
			$tocul.toggle();
			if ($tocul.find(':visible').length) {
				toctogglelink.textContent = 'hide';
			} else {
				toctogglelink.textContent = 'show';
			}
		}, false);
		toctable.appendChild(tocul);
		contentdiv.appendChild(toctable);

		var tocnumber = 1;

		var contentform = document.createElement('form');
		contentform.setAttribute('action', 'javascript:void(0)');  // was #tw-save - changed to void(0) to work around Chrome issue
		contentform.addEventListener('submit', Twinkle.config.save, true);
		contentdiv.appendChild(contentform);

		var container = document.createElement('table');
		container.style.width = '100%';
		contentform.appendChild(container);

		$(Twinkle.config.sections).each(function(sectionkey, section) {
			if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
				return true;  // i.e. "continue" in this context
			}

			// add to TOC
			var tocli = document.createElement('li');
			tocli.className = 'toclevel-1';
			var toca = document.createElement('a');
			toca.setAttribute('href', '#twinkle-config-section-' + tocnumber.toString());
			toca.appendChild(document.createTextNode(section.title));
			tocli.appendChild(toca);
			tocul.appendChild(tocli);

			var row = document.createElement('tr');
			var cell = document.createElement('td');
			cell.setAttribute('colspan', '3');
			var heading = document.createElement('h4');
			heading.style.borderBottom = '1px solid gray';
			heading.style.marginTop = '0.2em';
			heading.id = 'twinkle-config-section-' + (tocnumber++).toString();
			heading.appendChild(document.createTextNode(section.title));
			cell.appendChild(heading);
			row.appendChild(cell);
			container.appendChild(row);

			var rowcount = 1;  // for row banding

			// add each of the preferences to the form
			$(section.preferences).each(function(prefkey, pref) {
				if (pref.adminOnly && !Morebits.userIsSysop) {
					return true;  // i.e. "continue" in this context
				}

				row = document.createElement('tr');
				row.style.marginBottom = '0.2em';
				// create odd row banding
				if (rowcount++ % 2 === 0) {
					row.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
				}
				cell = document.createElement('td');

				var label, input;
				switch (pref.type) {

					case 'boolean':  // create a checkbox
						cell.setAttribute('colspan', '2');

						label = document.createElement('label');
						input = document.createElement('input');
						input.setAttribute('type', 'checkbox');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						if (Twinkle.getPref(pref.name) === true) {
							input.setAttribute('checked', 'checked');
						}
						label.appendChild(input);
						label.appendChild(document.createTextNode(' ' + pref.label));
						cell.appendChild(label);
						break;

					case 'string':  // create an input box
					case 'integer':
						// add label to first column
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add input box to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						input = document.createElement('input');
						input.setAttribute('type', 'text');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						if (pref.type === 'integer') {
							input.setAttribute('size', 6);
							input.setAttribute('type', 'number');
							input.setAttribute('step', '1');  // integers only
						}
						if (Twinkle.getPref(pref.name)) {
							input.setAttribute('value', Twinkle.getPref(pref.name));
						}
						cell.appendChild(input);
						break;

					case 'enum':  // create a combo box
						// add label to first column
						// note: duplicates the code above, under string/integer
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add input box to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						input = document.createElement('select');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						$.each(pref.enumValues, function(enumvalue, enumdisplay) {
							var option = document.createElement('option');
							option.setAttribute('value', enumvalue);
							if (Twinkle.getPref(pref.name) === enumvalue) {
								option.setAttribute('selected', 'selected');
							}
							option.appendChild(document.createTextNode(enumdisplay));
							input.appendChild(option);
						});
						cell.appendChild(input);
						break;

					case 'set':  // create a set of check boxes
						// add label first of all
						cell.setAttribute('colspan', '2');
						label = document.createElement('label');  // not really necessary to use a label element here, but we do it for consistency of styling
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);

						var checkdiv = document.createElement('div');
						checkdiv.style.paddingLeft = '1em';
						var worker = function(itemkey, itemvalue) {
							var checklabel = document.createElement('label');
							checklabel.style.marginRight = '0.7em';
							checklabel.style.display = 'inline-block';
							var check = document.createElement('input');
							check.setAttribute('type', 'checkbox');
							check.setAttribute('id', pref.name + '_' + itemkey);
							check.setAttribute('name', pref.name + '_' + itemkey);
							if (Twinkle.getPref(pref.name) && Twinkle.getPref(pref.name).indexOf(itemkey) !== -1) {
								check.setAttribute('checked', 'checked');
							}
							// cater for legacy integer array values for unlinkNamespaces (this can be removed a few years down the track...)
							if (pref.name === 'unlinkNamespaces') {
								if (Twinkle.getPref(pref.name) && Twinkle.getPref(pref.name).indexOf(parseInt(itemkey, 10)) !== -1) {
									check.setAttribute('checked', 'checked');
								}
							}
							checklabel.appendChild(check);
							checklabel.appendChild(document.createTextNode(itemvalue));
							checkdiv.appendChild(checklabel);
						};
						if (pref.setDisplayOrder) {
							// add check boxes according to the given display order
							$.each(pref.setDisplayOrder, function(itemkey, item) {
								worker(item, pref.setValues[item]);
							});
						} else {
							// add check boxes according to the order it gets fed to us (probably strict alphabetical)
							$.each(pref.setValues, worker);
						}
						cell.appendChild(checkdiv);
						break;

					case 'customList':
						// add label to first column
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add button to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						var button = document.createElement('button');
						button.setAttribute('id', pref.name);
						button.setAttribute('name', pref.name);
						button.setAttribute('type', 'button');
						button.addEventListener('click', Twinkle.config.listDialog.display, false);
						// use jQuery data on the button to store the current config value
						$(button).data({
							value: Twinkle.getPref(pref.name),
							pref: pref
						});
						button.appendChild(document.createTextNode('Sunting butir'));
						cell.appendChild(button);
						break;

					default:
						alert('twinkleconfig: unknown data type for preference ' + pref.name);
						break;
				}
				row.appendChild(cell);

				// add help tip
				cell = document.createElement('td');
				cell.style.fontSize = '90%';

				cell.style.color = 'gray';
				if (pref.helptip) {
					// convert mentions of templates in the helptip to clickable links
					cell.innerHTML = pref.helptip.replace(/{{(.+?)}}/g,
						'{{<a href="' + mw.util.getUrl('Template:') + '$1" target="_blank">$1</a>}}');
				}
				// add reset link (custom lists don't need this, as their config value isn't displayed on the form)
				if (pref.type !== 'customList') {
					var resetlink = document.createElement('a');
					resetlink.setAttribute('href', '#tw-reset');
					resetlink.setAttribute('id', 'twinkle-config-reset-' + pref.name);
					resetlink.addEventListener('click', Twinkle.config.resetPrefLink, false);
					resetlink.style.cssFloat = 'right';
					resetlink.style.margin = '0 0.6em';
					resetlink.appendChild(document.createTextNode('Atur ulang'));
					cell.appendChild(resetlink);
				}
				row.appendChild(cell);

				container.appendChild(row);
				return true;
			});
			return true;
		});

		var footerbox = document.createElement('div');
		footerbox.setAttribute('id', 'twinkle-config-buttonpane');
		footerbox.style.backgroundColor = '#BCCADF';
		footerbox.style.padding = '0.5em';
		var button = document.createElement('button');
		button.setAttribute('id', 'twinkle-config-submit');
		button.setAttribute('type', 'submit');
		button.appendChild(document.createTextNode('Save changes'));
		footerbox.appendChild(button);
		var footerspan = document.createElement('span');
		footerspan.className = 'plainlinks';
		footerspan.style.marginLeft = '2.4em';
		footerspan.style.fontSize = '90%';
		var footera = document.createElement('a');
		footera.setAttribute('href', '#tw-reset-all');
		footera.setAttribute('id', 'twinkle-config-resetall');
		footera.addEventListener('click', Twinkle.config.resetAllPrefs, false);
		footera.appendChild(document.createTextNode('Kembalikan ke setelan baku'));
		footerspan.appendChild(footera);
		footerbox.appendChild(footerspan);
		contentform.appendChild(footerbox);

		// since all the section headers exist now, we can try going to the requested anchor
		if (location.hash) {
			window.location.hash = location.hash;
		}

	} else if (mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').user &&
			mw.config.get('wgTitle').indexOf(mw.config.get('wgUserName')) === 0 &&
			mw.config.get('wgPageName').slice(-3) === '.js') {

		var box = document.createElement('div');
		// Styled in twinkle.css
		box.setAttribute('id', 'twinkle-config-headerbox');

		var link,
			scriptPageName = mw.config.get('wgPageName').slice(mw.config.get('wgPageName').lastIndexOf('/') + 1,
				mw.config.get('wgPageName').lastIndexOf('.js'));

		if (scriptPageName === 'twinkleoptions') {
			// place "why not try the preference panel" notice
			box.setAttribute('class', 'config-twopt-box');

			if (mw.config.get('wgArticleId') > 0) {  // page exists
				box.appendChild(document.createTextNode('Halaman ini berisi preferensi Twinkle Anda. Anda dapat mengubahnya dengan menggunakan '));
			} else {  // page does not exist
				box.appendChild(document.createTextNode('Anda bisa menyesuaikan Twinkle untuk menyamakan preferensi Anda dengan menggunakan '));
			}
			link = document.createElement('a');
			link.setAttribute('href', mw.util.getUrl(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').project] + ':Twinkle/Preferences'));
			link.appendChild(document.createTextNode('Bilah preferensi Twinkle'));
			box.appendChild(link);
			box.appendChild(document.createTextNode(', atau dengan menyunting halaman ini.'));
			$(box).insertAfter($('#contentSub'));

		} else if (['monobook', 'vector', 'cologneblue', 'modern', 'timeless', 'minerva', 'common'].indexOf(scriptPageName) !== -1) {
			// place "Looking for Twinkle options?" notice
			box.setAttribute('class', 'config-userskin-box');

			box.appendChild(document.createTextNode('If you want to set Twinkle preferences, you can use the '));
			link = document.createElement('a');
			link.setAttribute('href', mw.util.getUrl(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').project] + ':Twinkle/Preferences'));
			link.appendChild(document.createTextNode('Bilah preferensi Twinkle'));
			box.appendChild(link);
			box.appendChild(document.createTextNode('.'));
			$(box).insertAfter($('#contentSub'));
		}
	}
};

// custom list-related stuff

Twinkle.config.listDialog = {};

Twinkle.config.listDialog.addRow = function twinkleconfigListDialogAddRow(dlgtable, value, label) {
	var contenttr = document.createElement('tr');
	// "remove" button
	var contenttd = document.createElement('td');
	var removeButton = document.createElement('button');
	removeButton.setAttribute('type', 'button');
	removeButton.addEventListener('click', function() {
		$(contenttr).remove();
	}, false);
	removeButton.textContent = 'Hapus';
	contenttd.appendChild(removeButton);
	contenttr.appendChild(contenttd);

	// value input box
	contenttd = document.createElement('td');
	var input = document.createElement('input');
	input.setAttribute('type', 'text');
	input.className = 'twinkle-config-customlist-value';
	input.style.width = '97%';
	if (value) {
		input.setAttribute('value', value);
	}
	contenttd.appendChild(input);
	contenttr.appendChild(contenttd);

	// label input box
	contenttd = document.createElement('td');
	input = document.createElement('input');
	input.setAttribute('type', 'text');
	input.className = 'twinkle-config-customlist-label';
	input.style.width = '98%';
	if (label) {
		input.setAttribute('value', label);
	}
	contenttd.appendChild(input);
	contenttr.appendChild(contenttd);

	dlgtable.appendChild(contenttr);
};

Twinkle.config.listDialog.display = function twinkleconfigListDialogDisplay(e) {
	var $prefbutton = $(e.target);
	var curvalue = $prefbutton.data('value');
	var curpref = $prefbutton.data('pref');

	var dialog = new Morebits.simpleWindow(720, 400);
	dialog.setTitle(curpref.label);
	dialog.setScriptName('Preferensi Twinkle');

	var dialogcontent = document.createElement('div');
	var dlgtable = document.createElement('table');
	dlgtable.className = 'wikitable';
	dlgtable.style.margin = '1.4em 1em';
	dlgtable.style.width = 'auto';

	var dlgtbody = document.createElement('tbody');

	// header row
	var dlgtr = document.createElement('tr');
	// top-left cell
	var dlgth = document.createElement('th');
	dlgth.style.width = '5%';
	dlgtr.appendChild(dlgth);
	// value column header
	dlgth = document.createElement('th');
	dlgth.style.width = '35%';
	dlgth.textContent = curpref.customListValueTitle ? curpref.customListValueTitle : 'Value';
	dlgtr.appendChild(dlgth);
	// label column header
	dlgth = document.createElement('th');
	dlgth.style.width = '60%';
	dlgth.textContent = curpref.customListLabelTitle ? curpref.customListLabelTitle : 'Label';
	dlgtr.appendChild(dlgth);
	dlgtbody.appendChild(dlgtr);

	// content rows
	var gotRow = false;
	$.each(curvalue, function(k, v) {
		gotRow = true;
		Twinkle.config.listDialog.addRow(dlgtbody, v.value, v.label);
	});
	// if there are no values present, add a blank row to start the user off
	if (!gotRow) {
		Twinkle.config.listDialog.addRow(dlgtbody);
	}

	// final "add" button
	var dlgtfoot = document.createElement('tfoot');
	dlgtr = document.createElement('tr');
	var dlgtd = document.createElement('td');
	dlgtd.setAttribute('colspan', '3');
	var addButton = document.createElement('button');
	addButton.style.minWidth = '8em';
	addButton.setAttribute('type', 'button');
	addButton.addEventListener('click', function() {
		Twinkle.config.listDialog.addRow(dlgtbody);
	}, false);
	addButton.textContent = 'Tambah';
	dlgtd.appendChild(addButton);
	dlgtr.appendChild(dlgtd);
	dlgtfoot.appendChild(dlgtr);

	dlgtable.appendChild(dlgtbody);
	dlgtable.appendChild(dlgtfoot);
	dialogcontent.appendChild(dlgtable);

	// buttonpane buttons: [Save changes] [Reset] [Cancel]
	var button = document.createElement('button');
	button.setAttribute('type', 'submit');  // so Morebits.simpleWindow puts the button in the button pane
	button.addEventListener('click', function() {
		Twinkle.config.listDialog.save($prefbutton, dlgtbody);
		dialog.close();
	}, false);
	button.textContent = 'Simpan perubahan';
	dialogcontent.appendChild(button);
	button = document.createElement('button');
	button.setAttribute('type', 'submit');  // so Morebits.simpleWindow puts the button in the button pane
	button.addEventListener('click', function() {
		Twinkle.config.listDialog.reset($prefbutton, dlgtbody);
	}, false);
	button.textContent = 'Setel ulang';
	dialogcontent.appendChild(button);
	button = document.createElement('button');
	button.setAttribute('type', 'submit');  // so Morebits.simpleWindow puts the button in the button pane
	button.addEventListener('click', function() {
		dialog.close();  // the event parameter on this function seems to be broken
	}, false);
	button.textContent = 'Batal';
	dialogcontent.appendChild(button);

	dialog.setContent(dialogcontent);
	dialog.display();
};

// Resets the data value, re-populates based on the new (default) value, then saves the
// old data value again (less surprising behaviour)
Twinkle.config.listDialog.reset = function twinkleconfigListDialogReset(button, tbody) {
	// reset value on button
	var $button = $(button);
	var curpref = $button.data('pref');
	var oldvalue = $button.data('value');
	Twinkle.config.resetPref(curpref);

	// reset form
	var $tbody = $(tbody);
	$tbody.find('tr').slice(1).remove();  // all rows except the first (header) row
	// add the new values
	var curvalue = $button.data('value');
	$.each(curvalue, function(k, v) {
		Twinkle.config.listDialog.addRow(tbody, v.value, v.label);
	});

	// save the old value
	$button.data('value', oldvalue);
};

Twinkle.config.listDialog.save = function twinkleconfigListDialogSave(button, tbody) {
	var result = [];
	var current = {};
	$(tbody).find('input[type="text"]').each(function(inputkey, input) {
		if ($(input).hasClass('twinkle-config-customlist-value')) {
			current = { value: input.value };
		} else {
			current.label = input.value;
			// exclude totally empty rows
			if (current.value || current.label) {
				result.push(current);
			}
		}
	});
	$(button).data('value', result);
};

// reset/restore defaults

Twinkle.config.resetPrefLink = function twinkleconfigResetPrefLink(e) {
	var wantedpref = e.target.id.substring(21); // "twinkle-config-reset-" prefix is stripped

	// search tactics
	$(Twinkle.config.sections).each(function(sectionkey, section) {
		if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
			return true;  // continue: skip impossibilities
		}

		var foundit = false;

		$(section.preferences).each(function(prefkey, pref) {
			if (pref.name !== wantedpref) {
				return true;  // continue
			}
			Twinkle.config.resetPref(pref);
			foundit = true;
			return false;  // break
		});

		if (foundit) {
			return false;  // break
		}
	});
	return false;  // stop link from scrolling page
};

Twinkle.config.resetPref = function twinkleconfigResetPref(pref) {
	switch (pref.type) {

		case 'boolean':
			document.getElementById(pref.name).checked = Twinkle.defaultConfig[pref.name];
			break;

		case 'string':
		case 'integer':
		case 'enum':
			document.getElementById(pref.name).value = Twinkle.defaultConfig[pref.name];
			break;

		case 'set':
			$.each(pref.setValues, function(itemkey) {
				if (document.getElementById(pref.name + '_' + itemkey)) {
					document.getElementById(pref.name + '_' + itemkey).checked = Twinkle.defaultConfig[pref.name].indexOf(itemkey) !== -1;
				}
			});
			break;

		case 'customList':
			$(document.getElementById(pref.name)).data('value', Twinkle.defaultConfig[pref.name]);
			break;

		default:
			alert('twinkleconfig: jenis data untuk preferensi tak diketahui ' + pref.name);
			break;
	}
};

Twinkle.config.resetAllPrefs = function twinkleconfigResetAllPrefs() {
	// no confirmation message - the user can just refresh/close the page to abort
	$(Twinkle.config.sections).each(function(sectionkey, section) {
		if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
			return true;  // continue: skip impossibilities
		}
		$(section.preferences).each(function(prefkey, pref) {
			if (!pref.adminOnly || Morebits.userIsSysop) {
				Twinkle.config.resetPref(pref);
			}
		});
		return true;
	});
	return false;  // stop link from scrolling page
};

Twinkle.config.save = function twinkleconfigSave(e) {
	Morebits.status.init(document.getElementById('twinkle-config-content'));

	var userjs = mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').user] + ':' + mw.config.get('wgUserName') + '/twinkleoptions.js';
	var wikipedia_page = new Morebits.wiki.page(userjs, 'Menyimpan preferensi ke ' + userjs);
	wikipedia_page.setCallbackParameters(e.target);
	wikipedia_page.load(Twinkle.config.writePrefs);

	return false;
};

Twinkle.config.writePrefs = function twinkleconfigWritePrefs(pageobj) {
	var form = pageobj.getCallbackParameters();

	// this is the object which gets serialized into JSON; only
	// preferences that this script knows about are kept
	var newConfig = {optionsVersion: 2};

	// a comparison function is needed later on
	// it is just enough for our purposes (i.e. comparing strings, numbers, booleans,
	// arrays of strings, and arrays of { value, label })
	// and it is not very robust: e.g. compare([2], ["2"]) === true, and
	// compare({}, {}) === false, but it's good enough for our purposes here
	var compare = function(a, b) {
		if (Array.isArray(a)) {
			if (a.length !== b.length) {
				return false;
			}
			var asort = a.sort(), bsort = b.sort();
			for (var i = 0; asort[i]; ++i) {
				// comparison of the two properties of custom lists
				if ((typeof asort[i] === 'object') && (asort[i].label !== bsort[i].label ||
					asort[i].value !== bsort[i].value)) {
					return false;
				} else if (asort[i].toString() !== bsort[i].toString()) {
					return false;
				}
			}
			return true;
		}
		return a === b;

	};

	$(Twinkle.config.sections).each(function(sectionkey, section) {
		if (section.adminOnly && !Morebits.userIsSysop) {
			return;  // i.e. "continue" in this context
		}

		// reach each of the preferences from the form
		$(section.preferences).each(function(prefkey, pref) {
			var userValue;  // = undefined

			// only read form values for those prefs that have them
			if (!pref.adminOnly || Morebits.userIsSysop) {
				if (!section.hidden) {
					switch (pref.type) {
						case 'boolean':  // read from the checkbox
							userValue = form[pref.name].checked;
							break;

						case 'string':  // read from the input box or combo box
						case 'enum':
							userValue = form[pref.name].value;
							break;

						case 'integer':  // read from the input box
							userValue = parseInt(form[pref.name].value, 10);
							if (isNaN(userValue)) {
								Morebits.status.warn('Menyimpan', 'Nilai yang Anda masukkan untuk ' + pref.name + ' (' + pref.value + ') tidak sah. Proses penyimpanan akan dilanjutkan, namun data yang tidak sah itu akan dilewati.');
								userValue = null;
							}
							break;

						case 'set':  // read from the set of check boxes
							userValue = [];
							if (pref.setDisplayOrder) {
							// read only those keys specified in the display order
								$.each(pref.setDisplayOrder, function(itemkey, item) {
									if (form[pref.name + '_' + item].checked) {
										userValue.push(item);
									}
								});
							} else {
							// read all the keys in the list of values
								$.each(pref.setValues, function(itemkey) {
									if (form[pref.name + '_' + itemkey].checked) {
										userValue.push(itemkey);
									}
								});
							}
							break;

						case 'customList':  // read from the jQuery data stored on the button object
							userValue = $(form[pref.name]).data('value');
							break;

						default:
							alert('twinkleconfig: unknown data type for preference ' + pref.name);
							break;
					}
				} else if (Twinkle.prefs) {
					// Retain the hidden preferences that may have customised by the user from twinkleoptions.js
					// undefined if not set
					userValue = Twinkle.prefs[pref.name];
				}
			}

			// only save those preferences that are *different* from the default
			if (userValue !== undefined && !compare(userValue, Twinkle.defaultConfig[pref.name])) {
				newConfig[pref.name] = userValue;
			}
		});
	});

	var text =
		'// twinkleoptions.js: personal Twinkle preferences file\n' +
		'//\n' +
		'// NOTE: The easiest way to change your Twinkle preferences is by using the\n' +
		'// Bilah preferensi Twinkle, at [[' + Morebits.pageNameNorm + ']].\n' +
		'//\n' +
		'// This file is AUTOMATICALLY GENERATED.  Any changes you make (aside from\n' +
		'// changing the configuration parameters in a valid-JavaScript way) will be\n' +
		'// overwritten the next time you click "save" in the Twinkle preferences\n' +
		'// panel.  If modifying this file, make sure to use correct JavaScript.\n' +
		'// <no' + 'wiki>\n' +
		'\n' +
		'window.Twinkle.prefs = ';
	text += JSON.stringify(newConfig, null, 2);
	text +=
		';\n' +
		'\n' +
		'// </no' + 'wiki>\n' +
		'// End of twinkleoptions.js\n';

	pageobj.setPageText(text);
	pageobj.setEditSummary('Menyimpan preferensi Twinkle: suntingan otomatis dari [[:' + Morebits.pageNameNorm + ']] ([[WP:TW|TW]])');
	pageobj.setCreateOption('recreate');
	pageobj.save(Twinkle.config.saveSuccess);
};

Twinkle.config.saveSuccess = function twinkleconfigSaveSuccess(pageobj) {
	pageobj.getStatusElement().info('successful');

	var noticebox = document.createElement('div');
	noticebox.className = 'successbox';
	noticebox.style.fontSize = '100%';
	noticebox.style.marginTop = '2em';
	noticebox.innerHTML = '<p><b>Preferensi Twinkle Anda telah disimpan.</b></p><p>Untuk melihat perubahan, Anda mungkin perly <b>mengosongkan semua tembolok peramban Anda</b> (kunjungi <a href="' + mw.util.getUrl('WP:BYPASS') + '" title="WP:BYPASS">WP:BYPASS</a> untuk informasi lanjutan).</p>';
	Morebits.status.root.appendChild(noticebox);
	var noticeclear = document.createElement('br');
	noticeclear.style.clear = 'both';
	Morebits.status.root.appendChild(noticeclear);
};
})(jQuery);


// </nowiki>
