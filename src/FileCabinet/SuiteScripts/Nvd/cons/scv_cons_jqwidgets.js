/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  17 Jan 2025         Huy Pham			    Init, create file
 */
define(['N/query'],
function(query) {
	const FIELD = {
	}

	const SUBLIST = {
		
	}

	const RECORDS = {
		_N: {
			file: null
		},
		FILES_IMPORTED: [],
		STYLES: {
			FLUENT: {
				NAME: "jqx.fluent.css",
				URL: "https://cdnjs.cloudflare.com/ajax/libs/jqwidgets/18.0.0/jqwidgets/styles/jqx.fluent.min.css",
				PATH: "../olib/jqwidgets/styles/jqx.fluent.css"
			},
			LIGHT: {
				NAME: "jqx.light.css",
				URL: "https://cdnjs.cloudflare.com/ajax/libs/jqwidgets/18.0.0/jqwidgets/styles/jqx.light.min.css",
				PATH: "../olib/jqwidgets/styles/jqx.light.css"
			},
		},
		CORE: [
			{
				NAME: "jquery.min.js",
				URL: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
				PATH: "../olib/jqwidgets/scripts/jquery.min@3.5.1.js"
			},
			{
				NAME: "jqx.base.css",
				URL: "https://cdnjs.cloudflare.com/ajax/libs/jqwidgets/18.0.0/jqwidgets/styles/jqx.base.min.css", 
				PATH: "../olib/jqwidgets/styles/jqx.base.css"
			},
			{NAME: "jqxcore.js", URL: "", PATH: "../olib/jqwidgets/jqxcore.js"},
			{NAME: "jqxdata.js", URL: "", PATH: "../olib/jqwidgets/jqxdata.js"},
			{NAME: "jqxresponse.js", URL: "", PATH: "../olib/jqwidgets/jqxresponse.js"},
		],
		MODULS: {
			GANTT: [
				{
					NAME: "jqx.gantt.css", 
					URL: "https://cdnjs.cloudflare.com/ajax/libs/jqwidgets/18.0.0/jqwidgets/styles/gantt/jqx.gantt.min.css", 
					PATH: "../olib/jqwidgets/styles/gantt/jqx.gantt.css"
				},
				{NAME: "jqxgantt.js", URL: "", PATH: "../olib/jqwidgets/jqxgantt.js"},
				{NAME: "jqxgantt.api.js", URL: "", PATH: "../olib/jqwidgets/jqxgantt.api.js"}
			],
			SPLITTER: [
				{NAME: "jqxsplitter.js", URL: "", PATH: "../olib/jqwidgets/jqxsplitter.js"},
			],
			CHART: [
				{NAME: "jqxchart.core.js", URL: "", PATH: "../olib/jqwidgets/jqxchart.core.js"},
				{NAME: "jqxdraw.js", URL: "", PATH: "../olib/jqwidgets/jqxdraw.js"},
				//{NAME: "jqxchart.js", URL: "", PATH: "../olib/jqwidgets/jqxchart.js"},
			],
			GRID: [
				
			]
		}
	}

	const initModulServer = (_objModul) =>{
		RECORDS._N.file = _objModul.file||null;
	}

	const getLibaryIncludes = (_arrModuls = []) =>{
		let arrLinkStyle = [
			`<link rel="stylesheet" href="${RECORDS.STYLES.LIGHT.URL}" type="text/css" />`
		];
		let arrScript = [];

		let arrFileName = [
			//RECORDS.STYLES.LIGHT.NAME
		];
		
		for(let i = 0; i < RECORDS.CORE.length; i++){
			let objRes = RECORDS.CORE[i];

			if(!!objRes.URL){
				if(objRes.URL.indexOf(".css") > -1){
					arrLinkStyle.push(`<link rel="stylesheet" href="${objRes.URL}" type="text/css" />`);

					continue;
				}
				else if(objRes.URL.indexOf(".js") > -1){
					arrScript.push(`<script type="text/javascript" src="${objRes.URL}"></script>`);

					continue;
				}
			}
			arrFileName.push(objRes.NAME);
		}

		for(let i = 0; i < _arrModuls.length; i++){
			let arrFileOfModul = _arrModuls[i];
			
			for(let j = 0; j < arrFileOfModul.length; j++){
				let objFileOfModul = arrFileOfModul[j];
				if(!!objFileOfModul.URL){
					if(objFileOfModul.URL.indexOf(".css") > -1){
						arrLinkStyle.push(`<link rel="stylesheet" href="${objFileOfModul.URL}" type="text/css" />`);

						continue;
					}
					else if(objFileOfModul.URL.indexOf(".js") > -1){
						arrScript.push(`<script type="text/javascript" src="${objFileOfModul.URL}"></script>`);

						continue;
					}
				}

				arrFileName.push(objFileOfModul.NAME);
			}
		}

		let arrUrlFile = query.runSuiteQL({
			query: `SELECT a.id, a.name, a.url, a.filetype
			FROM file a,
				(SELECT id, name, appfolder
					FROM MediaItemFolder
					START WITH name = 'jqwidgets' and appfolder like 'SuiteScripts%'
					CONNECT BY PRIOR id = parent) b
			WHERE a.folder = b.id
				AND a.isinactive = 'F'
				AND a.name IN ('${arrFileName.join("', '")}')
			`}).asMappedResults();

		for(let i = 0; i < arrFileName.length; i++){
			let fileName = arrFileName[i];

			let idxImported = RECORDS.FILES_IMPORTED.findIndex(e => e.name == fileName);
			if(idxImported > -1) continue;

			let objFile = arrUrlFile.find(e => e.name == fileName);
			if(!objFile) continue;

			if(objFile.filetype == "JAVASCRIPT"){
				arrScript.push(`<script type="text/javascript" src="${objFile.url}"></script>`);
			}
			else if(objFile.filetype == "STYLESHEET"){
				arrLinkStyle.push( `<link rel="stylesheet" href="${objFile.url}" type="text/css" />`);
			}

			RECORDS.FILES_IMPORTED.push(objFile);
		}

		return arrLinkStyle.join("\n") + "\n" + arrScript.join("\n");
	}
	
	const resizeReponsive  = (_id) => {
		jQuery("#" + _id).css("width",jQuery("#div__body").width() + "px");
		jQuery("#" + _id).css("height","100%");

		setTimeout(function(){
			resizeReponsive(_id)
		}, 10);
	}

    return {
		TYPE: "jqwidgets-ver19.0.0",
		FIELD,
		SUBLIST,
		RECORDS,
		initModulServer,
		getLibaryIncludes,
		resizeReponsive
    };
    
});
