/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/format', 'N/ui/message', 'N/redirect', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', '../lib/scv_lib_function.js', '../lib/scv_lib_report.js'],
	
(format, message, redirect, record, runtime, search, serverWidget, libFunc, libRep) => {
	const ReportType = {
		KET_CHUYEN_THUE_VAT: {value: '1', label: 'Kết chuyển thuế VAT', savedsearch: 'customsearch_scv_closing_entry_vat', memo: 'Kết chuyển thuế VAT', recordtype: 'customtransaction_scv_clos_entry_posting'},
		KET_CHUYEN_GIAM_TRU_DOANH_THU: {value: '2', label: 'Kết chuyển giảm trừ doanh thu', savedsearch: 'customsearch_scv_kc_income', memo: 'Kết chuyển giảm trừ doanh thu', recordtype: 'customtransaction_scv_closing_entry'},
		KET_CHUYEN_DOANH_THU: {value: '3', label: 'Kết chuyển doanh thu', savedsearch: 'customsearch_scv_closing_entry', memo: 'Kết chuyển doanh thu', recordtype: 'customtransaction_scv_closing_entry'},
		KET_CHUYEN_CHIPHI: {value: '4', label: 'Kết chuyển chi phí', savedsearch: 'customsearch_scv_closing_entry_2', memo: 'Kết chuyển chi phí', recordtype: 'customtransaction_scv_closing_entry'},
		KET_CHUYEN_LOI_NHUAN: {value: '5', label: 'Kết chuyển lợi nhuận', savedsearch: 'customsearch_scv_closing_entry_3', memo:'Kết chuyển lợi nhuận', recordtype: 'customtransaction_scv_clos_entry_posting'},
		KET_CHUYEN_CPSX: {value: '6', label: 'Kết chuyển chi phí sản xuất', savedsearch: 'customsearch_scv_closing_entry_pro_exp', memo: 'Kết chuyển chi phí sản xuất', recordtype: 'customtransaction_scv_clos_entry_posting'}
	}
	const listReport = [], objSS = {}, objMemo = {}, objRecordtype = {};
	for(let key in ReportType) {
		let attValue = ReportType[key].value;
		listReport.push({value: attValue, label: ReportType[key].label});
		objSS[attValue] = ReportType[key].savedsearch;
		objMemo[attValue] = ReportType[key].memo;
		objRecordtype[attValue] = ReportType[key].recordtype;
	}
	
	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} context
	 * @param {ServerRequest} context.request - Encapsulation of the incoming request
	 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	const onRequest = (context) => {
		let request = context.request;
		let response = context.response;
		let parameters = request.parameters;
		
		let subsidiary = parameters.custpage_subsidiary;
		let date_from = parameters.custpage_date_from;
		let date_to = parameters.custpage_date_to;
		let reportype = parameters.custpage_reportype;
		
		let isRun = true, reportypes;
		if(!reportype) {
			reportype = ReportType.KET_CHUYEN_THUE_VAT.value;
			isRun = false;
		}
		
		if(!date_to || !subsidiary) {
			isRun = false;
		}
		
		if(request.method === 'GET') {
			let form = createForm();
			reportypes = reportype.split(',');
			subsidiary = subsidiary || runtime.getCurrentUser().subsidiary;
			addFieldSearch(form, subsidiary, date_from, date_to, reportypes);
			
			let messageInf = parameters.custpage_message;
			if(messageInf) {
				form.addPageInitMessage({type: message.Type.INFORMATION, message: messageInf, duration: -1});
				isRun = false;
			}
			if(isRun) {
				({date_from} = getDateFrom(date_to));
				doSearchAndAddSublist(form, reportypes, {subsidiary, date_from, date_to});
			}
			response.writePage(form);
		} else {
			({date_from} = getDateFrom(date_to));
			let trandate = format.parse({value: date_to, type: format.Type.DATE});
			reportypes = reportype.split('');
			
			let listMapAccKc = [], listMapAccount = [];
			let ftmap = [];
			let clmap = [['accountincome', 1], ['accountcredit', 2]];
			for(reportype of reportypes) {
				if(reportype === ReportType.KET_CHUYEN_GIAM_TRU_DOANH_THU.value) {
					if(listMapAccKc.length === 0) {
						libRep.doSearchSSMore('customsearch_scv_kc_mapping_acc', 1000, listMapAccKc, ftmap, clmap, null, null);
					}
					createClosingentry(reportype, trandate, listMapAccKc, {subsidiary, date_from, date_to});
				} else {
					if(listMapAccount.length === 0) {
						listMapAccount = getListMapAccount();
						createClosingentry(reportype, trandate, listMapAccount, {subsidiary, date_from, date_to});
					}
				}
			}
			let messageInf = 'Tạo bút toán Closing Entry thành công!';
			let mrTaskId = '';
			redirect.toSuitelet({
				scriptId: 'customscript_scv_sl_closing_entry',
				deploymentId: 'customdeploy_scv_sl_closing_entry',
				parameters: {mrTaskId: mrTaskId, custpage_reportype: reportype, custpage_subsidiary: parameters.custpage_subsidiary, custpage_date_from: date_from, custpage_date_to: date_to, custpage_message: messageInf}
			});
		}
	}
	
	const getListMapAccount = () => {
		let listMapAccount = [], pageinfo = null, params_map = [];
		let sql_acc_map = "select acc.id, acc.acctnumber from account acc where acc.issummary = 'F'";
		libRep.doSearchSql(listMapAccount, pageinfo, sql_acc_map, params_map);
		return listMapAccount;
	}
	
	const getDateFrom = (date_to) => {
		let date1 = format.parse({value: date_to, type: format.Type.DATE});
		date1.setDate(1);
		let date_from = format.format({value : date1, type : format.Type.DATE});
		return {date_from}
	}
	
	const createForm = () => {
		let title = 'Closing Entry';
		let form = serverWidget.createForm({
			title : title
		});
		form.addSubmitButton({
			label : 'Create'
		});
		form.clientScriptModulePath = '../cs/scv_cs_sl_closing_entry.js';
		form.addButton({id: 'custpage_bt_search', label: 'Search', functionName: 'searchReport()'});
		return form;
	}
	
	const pushFilter = (f, options) => {
		f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORAFTER, values: options.date_from}));
		pushFilterCommon(f, options);
	}
	
	const pushFilterCommon = (f, options) => {
		f.push(search.createFilter({name: 'trandate', operator: search.Operator.ONORBEFORE, values: options.date_to}));
		f.push(search.createFilter({name: 'subsidiary', operator: search.Operator.ANYOF, values: options.subsidiary}));
	}
	
	const getAmountKetChuyen = (amount, objKetChuyen33311) => {
		amount = Math.abs(amount);
		let amount33311 = Math.abs(objKetChuyen33311.amount);
		if(amount > amount33311) {
			amount = -amount33311;
		} else if(amount < amount33311) {
			amount = -amount;
		}
		return amount;
	}
	
	const doSearchAndAddSublist = (form, reportypes, options) => {
		let pre = 'custpage_sl_rep', prett = 'custpage_sl_tt';
		let sublistId = 'custpage_sl_result';
		let pgSize = 1000;
		
		for(let reportype of reportypes) {
			let s = search.load(objSS[reportype]);
			let c = s.columns;
			let lc = c.length;
			let f = s.filters;
			
			let sublist = form.addSublist({
				id : sublistId + reportype,
				type : serverWidget.SublistType.LIST,
				label : listReport.find(o => o.value === reportype).label
			});
			
			let fieldStt = sublist.addField({id : prett + 0, type : 'float', label : 'STT'});
			fieldStt.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
			libRep.addFieldSublist(sublist, c, pre);
			
			let listMapAcc = [], listKetChuenVat33311 = [];
			if(reportype === ReportType.KET_CHUYEN_GIAM_TRU_DOANH_THU.value) {
				pushFilter(f, options);
				let fieldAc = sublist.addField({id : 'allocationaccount', type : 'text', label : 'Allocation Account'});
				fieldAc.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
				let ftmap = [];
				let clmap = [['subsidiary', 0], ['accountincome', 1, 'sltext'], ['accountcredit', 2]];
				libRep.doSearchSSMore('customsearch_scv_kc_mapping_acc', 1000, listMapAcc, ftmap, clmap, null, null);
			} else if(reportype === ReportType.KET_CHUYEN_THUE_VAT.value) {
				pushFilterCommon(f, options);
				let filterKetChuyen33311 = [];
				let colKetChuyen33311 = [['subsidiary_text', 0], ['subsidiary', 0], ['account', 1], ['amount', 2], ['locationaccount', '3']];
				pushFilterCommon(filterKetChuyen33311, options);
				libRep.doSearchSSMore('customsearch_scv_closing_entry_vat_2', 1000, listKetChuenVat33311, filterKetChuyen33311, colKetChuyen33311, null, null);
			} else {
				pushFilter(f, options);
			}
			
			s.filters = f;
			lc = c.length;
			//Xu ly
			let r = s.runPaged({pageSize: pgSize});
			let numPage = r.pageRanges.length;
			let searchPage, tempData, numTemp, tampValue, line = 0, j = 0;
			let col = JSON.parse(JSON.stringify(c));
			let vrNone = '- None -', objTemp;
			
			for(let np = 0; np < numPage; np++) {
				searchPage = r.fetch({index : np });
				tempData = searchPage.data;
				if(tempData) {
					numTemp = tempData.length;
					for(let i = 0; i < numTemp; i++) {
						let amount = 0;
						if(reportype === ReportType.KET_CHUYEN_THUE_VAT.value) {
							let objKetChuyen33311 = listKetChuenVat33311.find(o => o.account === tempData[i].getValue(c[3]));
							if(!objKetChuyen33311) continue;//voi truong hop nay phai mapping
							amount = getAmountKetChuyen(tempData[i].getValue(c[2]), objKetChuyen33311);
							if(!amount) {
								continue;//voi truong hop nay phai mapping
							}
						}
						sublist.setSublistValue({id : prett + 0, line : line, value : (line + 1).toFixed(0)});
						
						for(j = 0; j < lc; j++) {
							tampValue = libRep.getValueDisplay(tempData[i], col[j], c[j]);
							if(libFunc.isContainValue(tampValue) && tampValue !== vrNone) {
								sublist.setSublistValue({id : pre + j, line : line, value : tampValue});
							}
						}
						if(amount) {
							sublist.setSublistValue({id : pre + 2, line : line, value : amount});
						}
						if(reportype === ReportType.KET_CHUYEN_GIAM_TRU_DOANH_THU.value) {
							objTemp = listMapAcc[0];
							if(objTemp?.accountincome) {
								sublist.setSublistValue({id : 'allocationaccount', line : line, value : objTemp.accountincome.substring(0, 6)});
							}
						}
						line++;
					}
				}
			}
		}
	}
	
	const createClosingentry = (reportype, trandate, listMapAcc, options) => {
		let ssid = objSS[reportype];
		let s = search.load(ssid);
		let c = s.columns;
		let f = s.filters;
		let listKetChuenVat33311 = [];
		if(reportype === ReportType.KET_CHUYEN_THUE_VAT.value) {
			let filterKetChuyen33311 = [];
			let colKetChuyen33311 = [['subsidiary_text', 0], ['subsidiary', 0], ['account', 1], ['amount', 2], ['locationaccount', '3']];
			pushFilterCommon(filterKetChuyen33311, options);
			pushFilterCommon(f, options);
			libRep.doSearchSSMore('customsearch_scv_closing_entry_vat_2', 1000, listKetChuenVat33311, filterKetChuyen33311, colKetChuyen33311, null, null);
		} else {
			pushFilter(f, options);
		}
		s.filters = f;
		
		let r = s.runPaged({pageSize: 1000});
		let numPage = r.pageRanges.length;
		let searchPage, tempData, numTemp, objTemp, objData;
		let subPre = '', subNext = '', recCloingEntry = null, amount, account, accountcredit, acctnumber;
		
		let slL = 'line';
		let fieldsCredit = ['account', 'credit', 'memo'];
		let fieldsDebit = ['account', 'debit', 'memo'];
		let fieldsHead = ['subsidiary', 'trandate', 'memo'];
		
		let col_sub = c[0], col_account = c[1], col_amount = c[2], col_acctnumber = c[3];
		for(let np = 0; np < numPage; np++) {
			searchPage = r.fetch({index : np });
			tempData = searchPage.data;
			if(tempData) {
				numTemp = tempData.length;
				for(let i = 0; i < numTemp; i++) {
					objData = tempData[i];
					if(reportype !== ReportType.KET_CHUYEN_GIAM_TRU_DOANH_THU.value) {
						acctnumber = objData.getValue(col_acctnumber);
					}
					subNext = objData.getValue(col_sub);
					account = objData.getValue(col_account);
					amount = Number(objData.getValue(col_amount));
					
					if(subNext !== subPre) {
						if(recCloingEntry) {
							recCloingEntry.save({enableSourcing: false, ignoreMandatoryFields : true});
						}
						recCloingEntry = record.create({type: objRecordtype[reportype], isDynamic: true});
						libFunc.setValueData(recCloingEntry, fieldsHead, [subNext, trandate, objMemo[reportype]]);
					}
					subPre = subNext;
					if(reportype === ReportType.KET_CHUYEN_THUE_VAT.value) {
						let objKetChuyen33311 = listKetChuenVat33311.find(o => o.account === acctnumber);
						if(objKetChuyen33311) {
							amount = getAmountKetChuyen(amount, objKetChuyen33311);
						} else {
							amount = 0;
						}
					}
					if(amount !== 0) {
						recCloingEntry.selectNewLine({sublistId: slL});
						libFunc.setCurrentSublistValueData(recCloingEntry, slL, fieldsDebit, [account, amount, objMemo[reportype]]);
						recCloingEntry.commitLine({sublistId: slL});
						if(reportype === ReportType.KET_CHUYEN_GIAM_TRU_DOANH_THU.value) {
							objTemp = listMapAcc[0];
                            log.error('objTemp', objTemp);
							if(!objTemp) {
								throw 'Có một hoặc nhiều line không có tài khoản kết chuyển. Vui lòng kiểm tra lại!';
							}
							accountcredit = objTemp.accountincome;
						} else if(reportype === ReportType.KET_CHUYEN_THUE_VAT.value) {
							accountcredit = acctnumber;
						} else {
							objTemp = listMapAcc.find(e => e.acctnumber === acctnumber);
							accountcredit = objTemp.id;
						}
						recCloingEntry.selectNewLine({sublistId: slL});
						libFunc.setCurrentSublistValueData(recCloingEntry, slL, fieldsCredit, [accountcredit, amount, objMemo[reportype]]);
						recCloingEntry.commitLine({sublistId: slL});
					}
				}
			}
		}
		if(recCloingEntry) {
			recCloingEntry.save({enableSourcing: false, ignoreMandatoryFields : true});
		}
	}
	
	const addFieldSearch = (form, subsidiary, date_from, date_to, reportype) => {
		let containerMainId = 'fieldgroup_dc_main';
		form.addFieldGroup({
			id : containerMainId,
			label : 'Criteria'
		});
		
		let fieldReportype = form.addField({
			id: 'custpage_reportype', type: serverWidget.FieldType.MULTISELECT,
			label: 'Type', container: containerMainId
		});
		fieldReportype.isMandatory = true;
		libRep.addMultiSelectType(fieldReportype, reportype, listReport);
		
		let fieldSubsidiary = form.addField({
			id: 'custpage_subsidiary', type: serverWidget.FieldType.SELECT,
			label: 'Subsidiary', container: containerMainId, source: 'subsidiary'
		});
		//libRep.addSelectSubsidiary(fieldSubsidiary, subsidiary);
		fieldSubsidiary.defaultValue = subsidiary;
		fieldSubsidiary.isMandatory = true;
		
		let fieldDateTo = form.addField({
			id: 'custpage_date_to', type: serverWidget.FieldType.DATE,
			label: 'Closing Date', container: containerMainId
		});
		fieldDateTo.defaultValue = date_to;
		fieldDateTo.isMandatory = true;
	}
	
	return {
		onRequest
	};
	
});
