/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/url', '../lib/scv_lib_cs', '../lib/scv_lib_cs_xls', '../lib/scv_lib_custom_form.js'],
function(ccr, url, libCS, libCsXLS, libCustomForm) {
	const arrFldsMandatory = ['custpage_subsidiary'];
	function getUrlSL(objParams = {}) {
		return url.resolveScript({
			scriptId: 'customscript_scv_sl_rp_vas_fl',
			deploymentId: 'customdeploy_scv_sl_rp_vas_fl',
			returnExternalUrl: false,
			params: objParams
		});
	}

	function pageInit(scriptContext) {
		let currentRecord = scriptContext.currentRecord;
		// const style = "font-weight:bold; background-color: #12e57f !important;border-color: white #12e57f #12e57f #12e57f !important;";
		// const sl = 'custpage_sl_tt';
		// const lc = currentRecord.getLineCount(sl);
		// for (let i = 0; i < lc; i++) {
		//     const subHierarchy = currentRecord.getSublistValue({sublistId: sl, fieldId: 'subsidiarynohierarchy', line: i});
		//     if (subHierarchy) continue;
		//     const idrow = '#' + sl + 'row' + i;
		//     jQuery(idrow).attr("style", style);
		// }
		if(objProjectData.isearch === "T") {
			let curRec = scriptContext.currentRecord;
			libCustomForm.resizeGrid("scvTabsContainer");
			renderDxTabsWithDxGrid(curRec, objProjectData);
		}
	}

	function renderDxTabsWithDxGrid(curRec, objProjectData) {
		let { objData, isCnNt, isSnkc, currencyValue } = objProjectData;
		let columns;
		if (!isCnNt && currencyValue && !isSnkc) {
			columns = getCurrencyColumns();
		} else if (isCnNt) {
			columns = [...getBaseColumns(), getNestedAriseColumns(), getNestedBalanceColumns(), getNestedFinalColumns()];
		} else if (isSnkc){
			columns = getSnkcColumnsBase();
			if (currencyValue) {
				columns = getSnkcColumnsCurrency();
			}
		} else {
			columns = getDefaultColumns();
		}

		// Build Tab Panel
		const items = [{
			title: "Báo cáo chi tiết",
			template: function () {
				return $("<div>").dxDataGrid({
					dataSource: objData,
					columns: columns,
					showBorders: true,
					rowAlternationEnabled: true,
					columnAutoWidth: true,
					scrolling: { // Thêm đối tượng này
						mode: 'standard' // 'virtual' hoặc 'infinite' cũng có thể được sử dụng
					},
					paging: {
						pageSize: 100
					},

					pager: {
						showPageSizeSelector: true,
						allowedPageSizes: [20, 50, 100, 200],
						showInfo: true
					},

					searchPanel: {
						visible: true,
						width: 300,
						placeholder: "Tìm kiếm..."
					},
					onCellPrepared: function (e) {
						e.cellElement.css('font-size', '11px');
						if (e.rowType === "data" && e.data.typebold === "2") {
							e.cellElement.css("font-weight", "bold");
						}
					}
				});
			}
		}];

		$("#scvTabsContainer").dxTabPanel({ items });
	}

	function getBaseColumns() {
		return [
			// { dataField: 'accnumber', caption: 'Mã tài khoản', dataType: 'string', width: 100 },
			// { dataField: 'accname', caption: 'Tên tài khoản', dataType: 'string', width: 180},
			// { dataField: 'account_text', caption: 'Mã đối tượng', dataType: 'string', width: 300 },
			{
				dataField: 'doituong',
				caption: 'Đối tượng',
				dataType: 'string',
				cellTemplate: function (cellElement, cellInfo) {
					getUrlCell(cellElement, cellInfo);
				},
				width: 300 },
		];
	}

	function getNestedAriseColumns() {
		return {
			caption: 'Số dư đầu',
			columns: [
				{
					caption: 'Ngoại tệ',
					columns: [
						{ dataField: 'sodudauno', caption: 'Nợ', dataType: 'number',  format: "#,##0.##", alignment: 'right'},
						{ dataField: 'sodudauco', caption: 'Có', dataType: 'number',  format: "#,##0.##", alignment: 'right'},
					]
				},
				{
					caption: 'VNĐ',
					columns: [
						{ dataField: 'sodudaunovnd', caption: 'Nợ', dataType: 'number',  format: "###,###,##0", alignment: 'right'},
						{ dataField: 'sodudaucovnd', caption: 'Có', dataType: 'number',  format: "###,###,##0", alignment: 'right'},
					]
				}
			]
		}
	}

	function getNestedBalanceColumns() {
		return {
			caption: 'Số phát sinh',
			columns: [
				{
					caption: 'Ngoại tệ',
					columns: [
						{ dataField: 'phatsinhno', caption: 'Nợ', dataType: 'number',  format: "#,##0.##", alignment: 'right'},
						{ dataField: 'phatsinhco', caption: 'Có', dataType: 'number',  format: "#,##0.##", alignment: 'right'},
					]
				},
				{
					caption: 'VNĐ',
					columns: [
						{ dataField: 'phatsinhnovnd', caption: 'Nợ', dataType: 'number',  format: "###,###,##0", alignment: 'right'},
						{ dataField: 'phatsinhcovnd', caption: 'Có', dataType: 'number',  format: "###,###,##0", alignment: 'right'},
					]
				}
			]
		}
	}

	function getNestedFinalColumns() {
		return {
			caption: 'Số dư cuối',
			columns: [
				{
					caption: 'Ngoại tệ',
					columns: [
						{ dataField: 'soducuoino', caption: 'Nợ', dataType: 'number',  format: "#,##0.##", alignment: 'right'},
						{ dataField: 'soducuoico', caption: 'Có', dataType: 'number',  format: "#,##0.##", alignment: 'right'},
					]
				},
				{
					caption: 'VNĐ',
					columns: [
						{ dataField: 'soducuoinovnd', caption: 'Nợ', dataType: 'number',  format: "###,###,##0", alignment: 'right'},
						{ dataField: 'soducuoicovnd', caption: 'Có', dataType: 'number',  format: "###,###,##0", alignment: 'right'},
					]
				}
			]
		}
	}

	function getDefaultColumns() {
		return [
			// { dataField: 'accnumber', caption: 'Mã tài khoản', dataType: 'string' },
			// { dataField: 'accname', caption: 'Tên tài khoản', dataType: 'string' },
			{ dataField: 'subsidiarynohierarchy', caption: 'Công ty chi nhánh', dataType: 'string' },
			{
				dataField: 'doituong',
				caption: 'Đối tượng',
				dataType: 'string',
				cellTemplate: function (cellElement, cellInfo) {
					getUrlCell(cellElement, cellInfo);
				},
				width: 300 },
			{ dataField: 'sodudaunovnd', caption: 'Số dư đầu: Nợ', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'sodudaucovnd', caption: 'Số dư đầu: Có', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'phatsinhnovnd', caption: 'Phát sinh: Nợ', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'phatsinhcovnd', caption: 'Phát sinh: Có', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'soducuoinovnd', caption: 'Số dư cuối: Nợ', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'soducuoicovnd', caption: 'Số dư cuối: Có', dataType: 'number', format: "###,###,##0", alignment: 'right' },
		];
	}

	function getSnkcColumnsBase() {
		return [
			{ dataField: 'trandate', caption: 'Date', dataType: 'string' },
			{ dataField: 'tranid', caption: 'Số phiếu', dataType: 'string', width: 300 },
			{ dataField: 'ngayct', caption: 'Ngày CT', dataType: 'string' },
			// { dataField: 'soct', caption: 'Số CT', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{
				dataField: 'soct',
				caption: 'Số CT',
				dataType: 'string',
				cellTemplate: function (cellElement, cellInfo) {
					getUrlCell(cellElement, cellInfo);
				}
			},
			{ dataField: 'ordertype_text', caption: 'Order type', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'diengiai', caption: 'Diễn giải', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'accnumber', caption: 'Mã tài khoản', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'phatsinhnovnd', caption: 'Số dư nợ (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'phatsinhcovnd', caption: 'Số dư có (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
		];
	}

	function getSnkcColumnsCurrency() {
		return [
			{ dataField: 'trandate', caption: 'Date', dataType: 'string' },
			{ dataField: 'tranid', caption: 'Số phiếu', dataType: 'string', width: 300 },
			{ dataField: 'ngayct', caption: 'Ngày CT', dataType: 'string' },
			// { dataField: 'soct', caption: 'Số CT', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{
				dataField: 'soct',
				caption: 'Số CT',
				dataType: 'string',
				cellTemplate: function (cellElement, cellInfo) {
					getUrlCell(cellElement, cellInfo);
				}
			},
			{ dataField: 'ordertype_text', caption: 'Order type', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'diengiai', caption: 'Diễn giải', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'accnumber', caption: 'Mã tài khoản', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'phatsinhco', caption: 'Số dư nợ (NT)', dataType: 'number', format: "#,##0.##", alignment: 'right' },
			{ dataField: 'phatsinhno', caption: 'Số dư có (NT)', dataType: 'number', format: "#,##0.##", alignment: 'right' },
			{ dataField: 'phatsinhnovnd', caption: 'Số dư nợ (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'phatsinhcovnd', caption: 'Số dư có (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
		];
	}

	function getCurrencyColumns() {
		return [
			// { dataField: 'trandate', caption: 'Mã tài khoản', dataType: 'string' },
			// { dataField: 'ngayct', caption: 'Tên tài khoản', dataType: 'string' },
			{ dataField: 'subsidiarynohierarchy', caption: 'Công ty chi nhánh', dataType: 'string', width: 180},
			{
				dataField: 'doituong',
				caption: 'Đối tượng',
				dataType: 'string',
				cellTemplate: function (cellElement, cellInfo) {
					getUrlCell(cellElement, cellInfo);
				},
				width: 300 },
			{ dataField: 'sodudauno', caption: 'Số dư đầu: Nợ (NT)', dataType: 'number', format: "#,##0.##", alignment: 'right' },
			{ dataField: 'sodudaunovnd', caption: 'Số dư đầu: Nợ (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'sodudauco', caption: 'Số dư đầu: Có (NT)', dataType: 'number', format: "#,##0.##", alignment: 'right' },
			{ dataField: 'sodudaucovnd', caption: 'Số dư đầu: Có (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'phatsinhno', caption: 'Phát sinh: Nợ (NT)', dataType: 'number', format: "#,##0.##", alignment: 'right' },
			{ dataField: 'phatsinhnovnd', caption: 'Phát sinh: Nợ (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'phatsinhco', caption: 'Phát sinh: Có (NT)', dataType: 'number', format: "#,##0.##", alignment: 'right' },
			{ dataField: 'phatsinhcovnd', caption: 'Phát sinh: Có (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'soducuoino', caption: 'Số dư cuối: Nợ(NT)', dataType: 'number', format: "#,##0.##", alignment: 'right' },
			{ dataField: 'soducuoinovnd', caption: 'Số dư cuối: Nợ (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
			{ dataField: 'soducuoico', caption: 'Số dư cuối: Có (NT)', dataType: 'number', format: "#,##0.##", alignment: 'right' },
			{ dataField: 'soducuoicovnd', caption: 'Số dư cuối: Có (VNĐ)', dataType: 'number', format: "###,###,##0", alignment: 'right' },
		];
	}

	function getUrlCell(cellElement, cellInfo) {
		const rawHtml = cellInfo.value;

		if (!rawHtml || typeof rawHtml !== 'string' || !rawHtml.includes('<a')) {
			cellElement.text(rawHtml || "");
			return;
		}

		try {
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = rawHtml;
			const linkElement = tempDiv.querySelector('a');

			if (linkElement) {
				const url = linkElement.getAttribute('href');
				const text = linkElement.textContent || linkElement.innerText;

				$('<a>', {
					'href': url,
					'text': text,
					'target': '_blank'
				}).appendTo(cellElement);
			} else {
				cellElement.text(rawHtml);
			}
		} catch (e) {
			console.error("Lỗi xử lý HTML cho soct:", e);
			cellElement.text(rawHtml);
		}
	}

	function refresh() {
		window.location.reload();
	}

	// function searchReport() {
	// 	window.onbeforeunload = null;
	// 	let currentRecord = ccr.get();
	// 	if (!libCS.fnValidateFields(currentRecord, arrFldsMandatory))return;
	// 	let urlDC = getUrlSL();
	// 	urlDC = urlDC + plusParam(currentRecord) + plusAccount(currentRecord) + '&isearch=T';
	// 	window.location.replace(urlDC);
	// }

	function searchReport() {
		window.onbeforeunload = null;
		let currentRecord = ccr.get();
		if (!libCS.validateDate(currentRecord, 19)) {
			return;
		}
		let urlDC = getUrlParam(currentRecord) + '&isearch=T';
		urlDC = urlDC + plusAccount(currentRecord);
		window.location.replace(urlDC);
	}

	function getUrlParam(currentRecord) {
		return url.resolveScript({
			scriptId: 'customscript_scv_sl_rp_vas_fl_v2',
			deploymentId: 'customdeploy_scv_sl_rp_vas_fl_v2',
			returnExternalUrl: false,
			params: getParam(currentRecord)
		});
	}


	function getParam(currentRecord) {
		return {
			custpage_entity: currentRecord.getValue('custpage_entity'),
			custpage_subsidiary: currentRecord.getValue('custpage_subsidiary').join(','),
			custpage_subsidiarytext: currentRecord.getText('custpage_subsidiary'),
			custpage_paymentcode: currentRecord.getValue('custpage_paymentcode'),
			custpage_order_type: currentRecord.getValue('custpage_order_type'),
			custpage_classification: currentRecord.getValue('custpage_classification'),
			custpage_location: currentRecord.getValue('custpage_location'),
			custpage_department: currentRecord.getValue('custpage_department'),
			custpage_kmcp: currentRecord.getValue('custpage_kmcp'),
			custpage_netnoco: currentRecord.getValue('custpage_netnoco'),
			custpage_not_level: currentRecord.getValue('custpage_not_level') ? 'T' : 'F',
			custpage_acc_level: currentRecord.getValue('custpage_acc_level'),
			custpage_date_dauky: currentRecord.getText('custpage_date_dauky'),
			custpage_date_cuoiky: currentRecord.getText('custpage_date_cuoiky'),
			custpage_reportype: currentRecord.getValue('custpage_reportype'),
			custpage_currencyvalue: currentRecord.getValue('custpage_currencyvalue'),
			custpage_currencytext: currentRecord.getText('custpage_currencyvalue'),
			custpage_debitloanagreement: currentRecord.getValue('custpage_debitloanagreement'),
			custpage_debitloanagreementtext: currentRecord.getText('custpage_debitloanagreement'),
			custpage_account_parent: currentRecord.getValue('custpage_account_parent').join(','),
			custpage_account_parent_text: currentRecord.getText('custpage_account_parent'),
			custpage_exportbc: currentRecord.getValue('custpage_exportbc')
		}
	}

	function plusAccount(currentRecord) {
		return '&custpage_account=' + currentRecord.getValue('custpage_account')
			+ '&custpage_accounttext=' + getAcccountText(currentRecord.getText('custpage_account'), ' ');
	}

	function getAcccountText(account, space) {
		let accounttext = '';
		if(!!account && account.length > 0) {
			for(let i in account) {
				let tempvalue = account[i];
				if(!!tempvalue) {
					tempvalue = tempvalue.split(space);
					accounttext = accounttext + tempvalue[0] + ','
				}
			}
		}
		if(accounttext.length > 0)
			accounttext = accounttext.slice(0, -1);
		return accounttext;
	}

	const URL_RQ = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_rp_vas_fl_v2&deploy=customdeploy_scv_sl_rp_vas_fl_v2';

	function exportReport() {
		window.onbeforeunload = null;
		let currentRecord = ccr.get();
		if (!libCS.validateDate(currentRecord, 19)) {
			return;
		}
		let params = getParam(currentRecord);
		params.isearch = 'T';
		params.isgetdata = 'T';
		libCS.showLoadingDialog(true);

		let resCallData = nlapiRequestURL(URL_RQ, params);
		let body = resCallData.getBody();
		let jsonEnd = body.lastIndexOf('}');
		let cleanJson = body.slice(0, jsonEnd + 1);

		let objDataCol = JSON.parse(cleanJson);
		let objDataConfig = JSON.parse(nlapiRequestURL(URL_RQ, {
			action: 'getUrlTemplate',
			custpage_subsidiary: currentRecord.getValue('custpage_subsidiary'),
			date_dauky: (currentRecord.getValue('custpage_date_dauky')).toLocaleDateString('vi-VN'),
			date_cuoiky: (currentRecord.getValue('custpage_date_cuoiky')).toLocaleDateString('vi-VN'),
			custpage_reportype: params.custpage_reportype,
			custpage_entity: params.custpage_entity,
			custpage_currencytext: params.custpage_currencytext,
			custpage_currencyvalue: params.custpage_currencyvalue,
		}).getBody());
		try {
			exportExcel(params, currentRecord, objDataConfig, objDataCol);
		} catch (error) {
			console.log("error", error)
			libCS.showLoadingDialog(false);
		}
		libCS.showLoadingDialog(false);
	}

	const exportExcel = async (params, currentRecord, objDataConfig, listDataLines) => {
		debugger;
		const reportName = 'BÁO CÁO TỔNG HỢP CÔNG NỢ';
		const objDataHeader = objDataConfig.objDataHeader;

		let workbook = await libCsXLS.loadWorkbookFromUrl(objDataConfig.urlTemplate);
		let reportType = params.custpage_reportype;
		let currencyValue = params.custpage_currencyvalue;
		let currentSheet = workbook.worksheets[0];
		currentSheet.name = 'Chi Tiet Cong No';

		initDataHeaderSheet(currentSheet, objDataHeader, params);
		// updateValueParam(currentSheet, "BÁO CÁO TỔNG HỢP CÔNG NỢ KHÁCH HÀNG", params);

		let currentRowForDynamicData = 14;
		let columnSet = 14;
		const styleBold = libCsXLS.getObjStyleRow(currentSheet, columnSet, ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'], 0, 13, true);
		const styleNormal = libCsXLS.getObjStyleRow(currentSheet, columnSet, ['A','B','C','D','E','F','G','H','I','J','K','L','M', 'N'], 0, 13); // Style cho các dòng chi tiết
		let objData = listDataLines.objData;
		objData.forEach(item => {
			if (typeof item.phatsinhno === 'string') {
				item.phatsinhno = parseFloat(item.phatsinhno);
			}
			if (typeof item.phatsinhco === 'string') {
				item.phatsinhco = parseFloat(item.phatsinhco);
			}
			if (typeof item.phatsinhnovnd === 'string') {
				item.phatsinhnovnd = parseFloat(item.phatsinhnovnd);
			}
			if (typeof item.phatsinhcovnd === 'string') {
				item.phatsinhcovnd = parseFloat(item.phatsinhcovnd);
			}
		});
		for (let i = 0; i < objData.length; i++) {
			let objDataLine = objData[i];
			let styleToApply;

			if (currentRowForDynamicData > columnSet) {
				currentSheet.insertRow(currentRowForDynamicData);
			}
			if (objDataLine.isAccount) {
				libCsXLS.mergeCell(currentSheet, currentRowForDynamicData, 1, currentRowForDynamicData, 4);
			}
			if (objDataLine.typebold === '2') {
				styleToApply = styleBold;
			} else {
				styleToApply = styleNormal;
			}

			for (let j = 0; j < columnSet; j++) {
				let colName = String.fromCharCode(65 + j);
				let cell = currentSheet.getCell(colName + currentRowForDynamicData);
				cell.style = styleToApply[colName];
			}
			setCellValueDetailLine(currentSheet, objDataLine, currentRowForDynamicData, reportType, currencyValue);

			currentRowForDynamicData++;
		}
		// addFooterSignature(currentSheet, currentRowForDynamicData + 2);

		// Save File
		await libCsXLS.saveWorkbook(workbook, reportName + ".xlsx");
	}

	function initDataHeaderSheet(currentSheet, objDataHeader, params) {
		libCsXLS.updMultiValueToCell(currentSheet, [
			{addressCell: 'A1', keys: '{pSubsidiary}', values: objDataHeader.strLegalNameSub},
			{addressCell: 'A1', keys: '{pCode}', values: objDataHeader.strFederalNumberSub},
			{addressCell: 'A2', keys: '{pAddress}', values: objDataHeader.strMainAddrSub},
			{addressCell: 'A5', keys: '{pAccount}', values: Array.isArray(params.custpage_account_parent_text) ? params.custpage_account_parent_text.join(', ') : params.custpage_account_parent_text},
			{addressCell: 'A6', keys: '{pEntity}', values: params.custpage_entity || 'Tổng hợp'},
			{addressCell: 'A7', keys: '{pCurrency}', values: params.custpage_currencytext || 'VNĐ'},
			{addressCell: 'A8', keys: '{pFromDate}', values: objDataHeader.date_dauky},
			{addressCell: 'A8', keys: '{pToDate}', values: objDataHeader.date_cuoiky},
		]);
	}

	function updateValueParam(currentSheet, reportTitle, params) {
		libCsXLS.updMultiValueToCell(currentSheet, [
			{addressCell: 'A4', keys: '{pReportTitle}', values: reportTitle},
			{addressCell: 'A5', keys: '{pFromdate}', values: params.custpage_date_dauky},
			{addressCell: 'A5', keys: '{pTodate}', values: params.custpage_date_cuoiky}
		]);
	}

	function mergeCellBodyParm(currentSheet) {
		libCsXLS.mergeCell(currentSheet, 1, 1, 1, 13); // A1:M1
		libCsXLS.mergeCell(currentSheet, 2, 1, 2, 13); // A2:M2
	}

	function setCellValueDetailLine(currentSheet, objDataLine, rowInsert, reportType, currencyValue) {
		let cellMap = [];
		if (reportType === 'customsearch_scv_vas_cnfl_nt') {
			cellMap = [
				{ col: 'A', key: 'doituong_text' },
				{ col: 'B', key: 'sodudauno', isNumber: true },
				{ col: 'C', key: 'sodudaunovnd', isNumber: true},
				{ col: 'D', key: 'sodudauco', isNumber: true},
				{ col: 'E', key: 'sodudaucovnd', isNumber: true},
				{ col: 'F', key: 'phatsinhno', isNumber: true },
				{ col: 'G', key: 'phatsinhnovnd', isNumber: true },
				{ col: 'H', key: 'phatsinhco', isNumber: true },
				{ col: 'I', key: 'phatsinhcovnd', isNumber: true },
				{ col: 'J', key: 'soducuoino', isNumber: true },
				{ col: 'K', key: 'soducuoinovnd',  isNumber: true},
				{ col: 'L', key: 'soducuoico', isNumber: true },
				{ col: 'M', key: 'soducuoicovnd', isNumber: true},
			];
		} else if (reportType === 'customsearch_scv_vas_snkcfl') {
			if (currencyValue) {
				cellMap = [
					{ col: 'A', key: 'trandate' },
					{ col: 'B', key: 'tranid', isNumber: true },
					{ col: 'C', key: 'ngayct', isNumber: true},
					{ col: 'D', key: 'soct_text', isNumber: true},
					{ col: 'E', key: 'diengiai', isNumber: true},
					{ col: 'F', key: 'accnumber', isNumber: true },
					{ col: 'G', key: 'tygia', isNumber: true },
					{ col: 'H', key: 'phatsinhno', isNumber: true },
					{ col: 'I', key: 'phatsinhnovnd', isNumber: true },
					{ col: 'J', key: 'phatsinhco', isNumber: true },
					{ col: 'K', key: 'phatsinhcovnd',  isNumber: true},
				];
			} else {
				cellMap = [
					{ col: 'A', key: 'trandate' },
					{ col: 'B', key: 'tranid', isNumber: true },
					{ col: 'C', key: 'ngayct', isNumber: true},
					{ col: 'D', key: 'soct_text', isNumber: true},
					{ col: 'E', key: 'diengiai', isNumber: true},
					{ col: 'F', key: 'accnumber', isNumber: true },
					{ col: 'G', key: 'tygia', isNumber: true },
					{ col: 'H', key: 'phatsinhnovnd', isNumber: true },
					{ col: 'I', key: 'phatsinhcovnd',  isNumber: true},
				];
			}

		} else if (!currencyValue) {
			cellMap = [
				{ col: 'A', key: 'subsidiarynohierarchy' },
				{ col: 'B', key: 'doituong_text' },
				{ col: 'C', key: 'sodudaunovnd', isNumber: true},
				{ col: 'D', key: 'sodudaucovnd', isNumber: true},
				{ col: 'E', key: 'phatsinhcovnd', isNumber: true },
				{ col: 'F', key: 'phatsinhnovnd', isNumber: true },
				{ col: 'G', key: 'soducuoicovnd',  isNumber: true},
				{ col: 'H', key: 'soducuoinovnd', isNumber: true},
			]
		} else if (reportType === 'customsearch_scv_vas_cnfl' && currencyValue) {
			cellMap = [
				{ col: 'A', key: 'doituong_text' },
				{ col: 'B', key: 'sodudauno', isNumber: true },
				{ col: 'C', key: 'sodudaunovnd', isNumber: true},
				{ col: 'D', key: 'sodudauco', isNumber: true},
				{ col: 'E', key: 'sodudaucovnd', isNumber: true},
				{ col: 'F', key: 'phatsinhno', isNumber: true },
				{ col: 'G', key: 'phatsinhnovnd', isNumber: true },
				{ col: 'H', key: 'phatsinhco', isNumber: true },
				{ col: 'I', key: 'phatsinhcovnd', isNumber: true },
				{ col: 'J', key: 'soducuoino', isNumber: true },
				{ col: 'K', key: 'soducuoinovnd',  isNumber: true},
				{ col: 'L', key: 'soducuoico', isNumber: true},
				{ col: 'M', key: 'soducuoicovnd', isNumber: true},
			];
		}
		cellMap.forEach(({ col, key, isNumber, defaultValue }) => {
			const cell = currentSheet.getCell(`${col}${rowInsert}`);
			let value = objDataLine?.[key];
			cell.value = isNumber ? parseVietnameseNumber(value) : (value ?? defaultValue ?? null);
			if (isNumber) {
				if (!key || !key.toLowerCase().includes('vnd')) {
					cell.numFmt = '#,##0.00';
				}
			}
			if (key === 'diengiai' && value) {
				libCsXLS.updateRowHeight(currentSheet, value, 0, rowInsert, 35);
			}
		});
	}

	function parseVietnameseNumber(value) {
		// Nếu đã là kiểu number, trả về luôn
		if (typeof value === 'number') {
			return value;
		}
		// Nếu là string, tiếp tục xử lý như cũ
		if (typeof value === 'string' && value) {
			const parsableString = value.replace(/\./g, '').replace(',', '.');
			const number = parseFloat(parsableString);
			return isNaN(number) ? null : number;
		}
		// Trả về null cho các trường hợp khác (null, undefined, etc.)
		return null;
	}

    return {
    	pageInit: pageInit,
    	refresh: refresh,
    	searchReport: searchReport,
    	exportReport: exportReport,
    };

});
