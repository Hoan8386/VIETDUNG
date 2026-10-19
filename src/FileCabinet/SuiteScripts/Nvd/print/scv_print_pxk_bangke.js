/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  09 Sep 2026         Huy Pham			    Init, create file
 *  16 Oct 2026         Huy Pham			    Bổ sung mẫu (FDD 15/10/2026), from ms.Ngọc (https://app.clickup.com/t/3773072/86d40bypv)
 */
define([
    "N/record", "N/url", 'N/search', 'N/file', 'N/runtime',
    "../lib/scv_lib_pdf.js",
    '../lib/scv_lib_function',
    '../cons/scv_cons_search.js',
    '../cons/scv_cons_format.js',
    '../cons/scv_cons_role.js',
],
    (
        record, url, search, file, runtime,
        libPdf,
        lbf,
        constSearch,
        constFormat,
        constRole,
    ) => {

        const validatePrint = (curRec) =>{
            if(runtime.getCurrentUser().role != constRole.RECORDS.ADMINISTRATOR.ID) return false;

            let createdfromId = curRec.getValue("createdfrom");
            if(!createdfromId) return false;

            let createdfromType = lbf.getTranRecordType(createdfromId);
            if(createdfromType === "salesorder") return true;

            return true;
        }

        const addBtnPrint = (scriptContext, curRec) => {
            if(!validatePrint(curRec)) return null;

            let form = scriptContext.form;
            
            let urlScript = url.resolveScript({
                scriptId: 'customscript_scv_sl_print',
                deploymentId: 'customdeploy_scv_sl_print',
                params: {
                    recordId: curRec.id,
                    recordType: curRec.type,
                    printFile: "scv_print_pxk_bangke",
                }
            });

            form.addButton({
                id: "custpage_btn_print_pxk_bangke",
                label: "PXK bảng kê",
                functionName: "window.open('" + urlScript + "');"
            });

            return { export_type: "PDF", id: "custpage_btn_print_pxk_bangke" };
        };

        const generateFilePDF = (_params) => {
            let curRec = record.load({ type: _params.recordType, id: _params.recordId });

            if (!validatePrint(curRec)){
                throw new Error("Không đủ điều kiện để in ấn");
            }

            let renderer = rennderPDF(curRec);

            renderer.addRecord('record', curRec);

            let filePDF = renderer.renderAsPdf();

            return filePDF;
        };

        const rennderPDF = (curRec) =>{
            let optionNumber = {
                groupSeparator: ',',
                decimalSeparator: '.',
            };

            let renderer = libPdf.renderTemplateWithXml("scv_print_pxk_bangke");

            let companyRec = record.load({type: "subsidiary", id: 1});

            let objResult = {
                tagImgLogo: libPdf.createImageBySubsidiaryV2(companyRec, 40),
                qr_product_info_url: file.load({id: '../assets/scv_qrcode_link_nvd.png'}).url,
                headers: {},
                total_quantity: 0,
                lines: []
            };
            
            let arrResPrintPXKG01 = getDataPrintPXKG(curRec);

            if(arrResPrintPXKG01.length > 0){
                objResult.headers = arrResPrintPXKG01[0];

                objResult.headers.subsidiary_legal_name = objResult.headers.subsidiary_legal_name?.toUpperCase();
            }

            for(let i = 0; i < arrResPrintPXKG01.length; i++){
                let objResPrintPXKG01 = arrResPrintPXKG01[i];

                objResult.total_quantity += objResPrintPXKG01.quantity * 1;

                objResult.lines.push({
                    stt: i + 1,
                    item_name: objResPrintPXKG01.item_name,
                    units_display: objResPrintPXKG01.units_display || objResPrintPXKG01.units,
                    quantity: constFormat.formatNumber(objResPrintPXKG01.quantity * 1, null, optionNumber),
                    memo: objResPrintPXKG01.memo,
                });
            }
            objResult.total_quantity = constFormat.roundNumber(objResult.total_quantity);
            objResult.total_quantity = constFormat.formatNumber(objResult.total_quantity, 2, optionNumber);
            
            renderer.addCustomDataSource({
                format: "OBJECT",
                alias: 'result',
                data: objResult
            });

            return renderer;
        }

        const getDataPrintPXKG = (curRec) =>{
            let filters = [];

            filters.push(search.createFilter({
                name: "internalid", operator: "anyof", values: curRec.id
            }));

            return constSearch.getDataSource_Mixed("customsearch_scv_if_print_pxk_chi_tiet", filters);
        }

        return { addBtnPrint, generateFilePDF };
    });
