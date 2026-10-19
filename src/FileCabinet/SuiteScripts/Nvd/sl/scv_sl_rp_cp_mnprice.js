/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/config', 'N/format', 'N/file', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/serverWidget',
        '../common/scv_common_rp_cp_mnprice.js',
        '../lib/scv_lib_function.js', '../lib/scv_lib_report.js'
        ],
    
    (config, format, file, redirect, runtime, search, serverWidget, cmRpCpMnPrice, libFunc, libRep) => {
        
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
            let location = parameters.custpage_location;
            let thanhpham = parameters.custpage_thanhpham;
            let item = parameters.custpage_item;
            let fromdate = parameters.custpage_fromdate;
            let todate = parameters.custpage_todate;
            let fromdate_prv = parameters.custpage_fromdate_prv;
            let todate_prv = parameters.custpage_todate_prv;
            let mainline = parameters.custpage_mainline;
            
            let isRun = true;
            if (!subsidiary || !fromdate || !todate
                || !fromdate_prv || !todate_prv) {
                isRun = false;
            }
            if (!subsidiary) {
                let userObj = runtime.getCurrentUser();
                subsidiary = [userObj.subsidiary];
            } else if (typeof subsidiary === 'string') {
                subsidiary = subsidiary.split(',');
            }
            
            let mdata = cmRpCpMnPrice.getSublistColMaster();
            let sl = mdata.sl;
            let col_sl = mdata.col_sl;
            let lc_sl = col_sl.length;
            
            let configRecObj = config.load({type: config.Type.USER_PREFERENCES});
            let timezone = configRecObj.getValue('TIMEZONE');
            
            if (request.method === 'GET') {
                let title = 'BÁO CÁO SO SÁNH GIÁ THÀNH';
                let form = serverWidget.createForm({
                    title: title
                });
                form.clientScriptModulePath = '../cssl/scv_cs_sl_rp_cp_mnprice.js';
                form.addButton({id: 'custpage_bt_search', label: 'Search', functionName: 'searchReport()'});
                form.addButton({id: 'custpage_bt_export', label: 'Export', functionName: 'exportReport()'});
                
                addFieldSearch(form, subsidiary, location, thanhpham, item, fromdate, todate, fromdate_prv, todate_prv, mainline);
                
                if (isRun) {
                    let list_ss = [], filters = [];
                    let col_ss = mdata.col_ss;
                    let col_ss_add = cmRpCpMnPrice.getColSSAdd(libFunc, format, timezone, fromdate, todate, fromdate_prv, todate_prv);
                    cmRpCpMnPrice.pushFilter(search, libFunc, filters, subsidiary, mainline, location, thanhpham, item, col_ss_add);
                    libRep.doSearchSSMoreRange('customsearch_scv_production_cost_ss', 1000, list_ss, filters, col_ss, col_ss_add.col_ss_add, col_ss_add.splice);
                    if (parameters.isExport === 'T') {
                        let path = '../xml/rp_mn/SCV_BCSS_GIATHANH.xml';
                        let pExpandedRowCount = 14;
                        let objRow = {pRow: '', line: 0};
                        makeRow(objRow, list_ss, mainline);
                        
                        if (path) {
                            let fileObject = file.load({id: path});
                            let content = fileObject.getContents();
                            content = content.replace(/{pExpandedRowCount}/gi, pExpandedRowCount + objRow.line);
                            content = content.replace(/{psubsidiary_text}/gi, libFunc.reText(parameters.custpage_subsidiary_text));
                            content = content.replace(/{pfromdate}/gi, fromdate);
                            content = content.replace(/{ptodate}/gi, todate);
                            content = content.replace(/{pfromdate_prv}/gi, fromdate_prv);
                            content = content.replace(/{ptodate_prv}/gi, todate_prv);
                            content = content.replace(/{plocation_text}/gi, !!location ? libFunc.reText(parameters.custpage_location_text) : '');
                            content = content.replace(/{pthanhpham_text}/gi, libFunc.reText(parameters.custpage_thanhpham_text));
                            content = content.replace(/{pnvl_text}/gi, libFunc.reText(parameters.custpage_item_text));
                            content = content.replace(/{pRow}/gi, objRow.pRow);
                            
                            let namefile = 'BCSS_GIATHANH.xls';
                            
                            let f = file.create({
                                name: namefile,
                                fileType: file.Type.XMLDOC,
                                contents: content,
                                encoding: file.Encoding.UTF8,
                            });
                            response.writeFile(f, false);
                        }
                    } else {
                        let sublist = form.addSublist({id: sl, type: serverWidget.SublistType.LIST, label: 'KẾT QUẢ'});
                        libRep.addFieldLineColList(sublist, col_sl);
                        
                        setSublistValue(sublist, list_ss, col_sl, lc_sl, 0);
                    }
                }
                if (parameters.isExport !== 'T') {
                    response.writePage(form);
                }
            } else {
                redirect.toSuitelet({
                    scriptId: 'customscript_scv_sl_rp_cp_mnprice',
                    deploymentId: 'customdeploy_scv_sl_rp_cp_mnprice',
                    parameters: {custpage_fromdate: fromdate, custpage_todate: todate}
                });
            }
        }
        
        const setSublistValue = (sublist, list_ss, col_sl, lc_sl, line) => {
            let tempcol, tempValue;
            for (let i in list_ss) {
                sublist.setSublistValue({id: 'stt', line: line, value: (line + 1).toFixed(0)});
                cmRpCpMnPrice.setValueColLine(libFunc, list_ss, i);
                for (let j = 0; j < lc_sl; j++) {
                    tempcol = col_sl[j].id;
                    tempValue = list_ss[i][tempcol];
                    if (libFunc.isContainValue(tempValue)) {
                        sublist.setSublistValue({id: tempcol, line: line, value: tempValue});
                    }
                }
                line++;
            }
            return line;
        }
        
        const addFieldSearch = (form, subsidiary, location, thanhpham, item, fromdate, todate, fromdate_prv, todate_prv, mainline) => {
            form.addFieldGroup({
                id: 'fieldgroup_dc_main',
                label: 'Criteria'
            });
            
            let custpage_subsidiary = form.addField({
                id: 'custpage_subsidiary', type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary', container: 'fieldgroup_dc_main'
            });
            libRep.addSelectSubsidiary(custpage_subsidiary, subsidiary);
            custpage_subsidiary.isMandatory = true;
            
            let custpage_location = form.addField({
                id: 'custpage_location', type: serverWidget.FieldType.SELECT,
                label: 'Location', container: 'fieldgroup_dc_main'
            });
            let c = ['internalid', 'namenohierarchy', 'name'];
            let f = [['isinactive', 'is', false]];
            if (subsidiary) {
                f.push('and');
                f.push(['subsidiary', 'anyOf', subsidiary]);
            }
            libRep.addSelection(custpage_location, 'location', c, f, true, location);
            
            let custpage_thanhpham = form.addField({
                id: 'custpage_thanhpham', type: serverWidget.FieldType.SELECT,
                label: 'Thành phẩm', container: 'fieldgroup_dc_main', source: 'assemblyitem'
            });
            custpage_thanhpham.defaultValue = thanhpham;
            
            let custpage_item = form.addField({
                id: 'custpage_item', type: serverWidget.FieldType.SELECT,
                label: 'NVL', container: 'fieldgroup_dc_main', source: 'item'
            });
            custpage_item.defaultValue = item;
            
            let custpage_fromdate = form.addField({
                id: 'custpage_fromdate', type: serverWidget.FieldType.DATE,
                label: 'Từ ngày (Kỳ này)', container: 'fieldgroup_dc_main'
            });
            custpage_fromdate.defaultValue = fromdate;
            custpage_fromdate.isMandatory = true;
            custpage_fromdate.updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            
            let custpage_todate = form.addField({
                id: 'custpage_todate', type: serverWidget.FieldType.DATE,
                label: 'Đến ngày (Kỳ này)', container: 'fieldgroup_dc_main'
            });
            custpage_todate.defaultValue = todate;
            custpage_todate.isMandatory = true;
            custpage_todate.updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            
            let custpage_fromdate_prv = form.addField({
                id: 'custpage_fromdate_prv', type: serverWidget.FieldType.DATE,
                label: 'Từ ngày (Kỳ trước)', container: 'fieldgroup_dc_main'
            });
            custpage_fromdate_prv.defaultValue = fromdate_prv;
            custpage_fromdate_prv.isMandatory = true;
            custpage_fromdate_prv.updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            
            let custpage_todate_prv = form.addField({
                id: 'custpage_todate_prv', type: serverWidget.FieldType.DATE,
                label: 'Đến ngày (Kỳ trước)', container: 'fieldgroup_dc_main'
            });
            custpage_todate_prv.defaultValue = todate_prv;
            custpage_todate_prv.isMandatory = true;
            custpage_todate_prv.updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            
            let custpage_mainline = form.addField({
                id: 'custpage_mainline', type: serverWidget.FieldType.CHECKBOX,
                label: 'Hiển thị NVL chi tiết', container: 'fieldgroup_dc_main'
            });
            custpage_mainline.defaultValue = (!mainline || mainline === 'F') ? 'F' : 'T';
        }
        
        const makeRow = (objRow, list_value, mainline_h) => {
            let rowOpen = '<Row ss:AutoFitHeight="0" ss:Height="16.5">', rowClose = '</Row>',
                cellClose = '</Data></Cell>';
            let mainline, s84, s85, s86;
            for (let i in list_value) {
                mainline = list_value[i].mainline;
                if (mainline === '*' && (mainline_h === true || mainline_h === 'T' || mainline_h === 'true' || mainline_h === 'True')) {
                    s84 = 's87';
                    s85 = 's88';
                    s86 = 's89';
                } else {
                    s84 = 's84';
                    s85 = 's85';
                    s86 = 's86';
                }
                cmRpCpMnPrice.setValueColLine(libFunc, list_value, i);
                objRow.pRow = objRow.pRow + rowOpen;
                objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s84 + '"><Data ss:Type="Number">' + (objRow.line + 1) + cellClose;
                objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s84 + '"><Data ss:Type="String">' + libFunc.reText(list_value[i].location_text) + cellClose;
                objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s84 + '"><Data ss:Type="String">' + libFunc.reText(list_value[i].thanhpham_text) + cellClose;
                objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s84 + '"><Data ss:Type="String">' + libFunc.reText(list_value[i].nvl_text) + cellClose;
                objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s84 + '"><Data ss:Type="String">' + libFunc.reText(list_value[i].stockunit_text) + cellClose;
                if (!!list_value[i].chenhlechgia) {
                    objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s85 + '"><Data ss:Type="Number">' + (list_value[i].chenhlechgia || '') + cellClose;
                    objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s86 + '"><Data ss:Type="Number">' + (list_value[i].biendong_ep || '') + cellClose;
                } else {
                    objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s85 + '"><Data ss:Type="String">' + cellClose;
                    objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s86 + '"><Data ss:Type="String">' + cellClose;
                }
                objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s85 + '"><Data ss:Type="Number">' + (list_value[i].quantity || '') + cellClose;
                if (!!list_value[i].dongiatb) {
                    objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s85 + '"><Data ss:Type="Number">' + (list_value[i].dongiatb || '') + cellClose;
                } else {
                    objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s85 + '"><Data ss:Type="String">' + cellClose;
                }
                objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s85 + '"><Data ss:Type="Number">' + (list_value[i].amount || '') + cellClose;
                objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s85 + '"><Data ss:Type="Number">' + (list_value[i].quantity_prv || '') + cellClose;
                if (!!list_value[i].dongiatb_prv) {
                    objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s85 + '"><Data ss:Type="Number">' + (list_value[i].dongiatb_prv || '') + cellClose;
                } else {
                    objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s85 + '"><Data ss:Type="String">' + cellClose;
                }
                objRow.pRow = objRow.pRow + '<Cell ss:StyleID="' + s85 + '"><Data ss:Type="Number">' + (list_value[i].amount_prv || '') + cellClose;
                
                objRow.pRow = objRow.pRow + rowClose;
                objRow.line = objRow.line + 1;
            }
        }
        
        return {
            onRequest
        };
        
    });
