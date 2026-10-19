/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  05 Sep 2025         Khanh Tran	    		Init & create file. Điền tên người duyệt LXH trên IF tạo từ SO from ms. Ngọc (https://app.clickup.com/t/86d07ekxx)
 */
/**
 * @NApiVersion 2.1
 */
define(['N/search',
    '../lib/scv_lib_function',
    '../cons/scv_cons_search_pxk_ql_kho.js'
],
    (search,
        lbf,
        cSearchPxkQlKho
    ) => {

        const updateNguoiPheDuyetLsx = (curRec) => {
            let if_duyet_lxh = curRec.getValue('custbody_scv_if_duyet_lxh');
            let createdfrom = curRec.getValue('createdfrom');
            let createdfromType = lbf.getTranRecordType(createdfrom);

            if(if_duyet_lxh || createdfromType !== "salesorder") return;

            let arrSSPxkQlKho = cSearchPxkQlKho.getDataSource([
                search.createFilter({name: 'internalid', operator: 'anyof', values: createdfrom})
            ]);
            let phe_duyet = arrSSPxkQlKho[0]?.phe_duyet || '';

            curRec.setValue('custbody_scv_if_duyet_lxh', phe_duyet)
        }
        
        return {
            updateNguoiPheDuyetLsx
        }
        
    });
