/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query', 'N/record', 'N/runtime', 'N/search',
    '../lib/scv_lib_function',
],
/**
 * @param{query} query
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (query, record, runtime, search,
        lbf
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let params = request.parameters;
            let response = scriptContext.response;
            let objResponse = {data: {}, isSuccess: true, msg: '', url: ''};
            try {
                let curRec = record.load({type: params.recType, id: params.recId});
                switch (params.templateId) {
                    case 'scv_docx_thong_bao_pakt':
                        objResponse.data = getDataExpThongBaoPakt(curRec, params);
                        break;
                    case 'scv_docx_pakt':
                        objResponse.data = getDataExpPakt(curRec, params);
                        break;
                }

                response.setHeader({
                    name: 'Content-Type',
                    value: 'application/json'
                });
                response.write(JSON.stringify(objResponse));
            } catch (error) {
                log.error('error try-cat', error)
                objResponse.isSuccess = false;
                objResponse.msg = `${error.toString()} - action ${params.templateId}`;
                response.write(JSON.stringify(objResponse));
            }
        }

        const getDataSubsidiary = (subsidiary) => {
            let lkSub = search.lookupFields({
                type: 'subsidiary',
                id: subsidiary,
                columns: ['state']
            });
            return {
                state: lkSub.state?.[0]?.value
            }
        }

        const getddMMyyyy = () => {
            let curDate = new Date();
            return `${curDate.getDate()} tháng ${curDate.getMonth() + 1} năm ${curDate.getFullYear()}`;
        }

        const getDataEmp = (empId) => {
            let lkEmp = search.lookupFields({
                type: lbf.getEntityType(empId),
                id: empId,
                columns: ['custentity_scv_legal_name', 'title']
            });

            return {
                legal_name: lkEmp.custentity_scv_legal_name,
                title: lkEmp.title
            }
        }

        const getDataExpThongBaoPakt = (curRec, params) => {
            let subsidiary = curRec.getValue('custevent_scv_subsidiary');
            let subsidiary_state = subsidiary ? getDataSubsidiary(subsidiary).state : '';
            let ddMMyyyy = getddMMyyyy();
            let objNdpa_T = {arrNdct: []};
            let slPakt = 'recmachcustrecord_scv_pakt_parent';
            for(let i = 0; i < curRec.getLineCount(slPakt); i++){
                let print = curRec.getSublistValue(slPakt, 'custrecord_scv_pakt_print', i);
                if(!print) continue;

                objNdpa_T.print = print;
                objNdpa_T.id = curRec.getSublistValue(slPakt, 'id', i);
                objNdpa_T.assembly = curRec.getSublistText(slPakt, 'custrecord_scv_pakt_assembly', i);
                objNdpa_T.subject = curRec.getSublistText(slPakt, 'custrecord_scv_pakt_subject', i);
                objNdpa_T.note = curRec.getSublistValue(slPakt, 'custrecord_scv_pakt_note', i);
                objNdpa_T.requestor = curRec.getSublistValue(slPakt, 'custrecord_scv_pakt_requestor', i);
                objNdpa_T.date = curRec.getSublistValue(slPakt, 'custrecord_scv_pakt_date', i);
            }

            if(objNdpa_T.id){
                let ndPaktRec = record.load({type: 'customrecord_scv_pakt', id: objNdpa_T.id});
                let slNdct = 'recmachcustrecord_scv_nvl_parent';
                for(let i = 0; i < ndPaktRec.getLineCount(slNdct); i++){
                    let obj = {};
                    obj.stt = ndPaktRec.getSublistValue(slNdct, 'custrecord_scv_nvl_stt', i);
                    obj.quyCach = ndPaktRec.getSublistValue(slNdct, 'custrecord_scv_nvl_name', i);
                    obj.seri = ndPaktRec.getSublistValue(slNdct, 'custrecord_scv_nvl_seri', i);
                    obj.loi = ndPaktRec.getSublistValue(slNdct, 'custrecord_scv_nvl_loi', i);
                    obj.phuongAn = ndPaktRec.getSublistValue(slNdct, 'custrecord_scv_nvl_solution', i);
                    obj.ghiChu = ndPaktRec.getSublistValue(slNdct, 'custrecord_scv_nvl_note', i);
                    objNdpa_T.arrNdct.push(obj);
                }
            };
            
            let vv = objNdpa_T.subject;
            let maHangSX = objNdpa_T.assembly;
            let so = '.PASX';
            let related_case = curRec.getValue('custevent_scv_related_case');
            if(related_case){
                let lkRltCase = search.lookupFields({
                    type: 'supportcase',
                    id: related_case,
                    columns: ['custevent_scv_so_phieu', 'title']
                });
                so = lkRltCase.title + so;
            }

            let slTbpa = 'recmachcustrecord_scv_tb_parent';
            let arrTbpa = [];
            for(let i = 0; i < curRec.getLineCount(slTbpa); i++){
                let obj = {};
                obj.bplq = curRec.getSublistText(slTbpa, 'custrecord_scv_tb_bplq', i);
                obj.bplq = obj.bplq.join(", ");
                obj.lan = curRec.getSublistValue(slTbpa, 'custrecord_scv_tb_lan', i);
                obj.in = curRec.getSublistValue(slTbpa, 'custrecord_scv_tb_in', i);
                obj.dia_diem = curRec.getSublistValue(slTbpa, 'custrecord_scv_tb_dia_diem', i);
                obj.tgdk = curRec.getSublistText(slTbpa, 'custrecord_scv_tb_tgdk', i);
                obj.kq = curRec.getSublistValue(slTbpa, 'custrecord_scv_tb_kq', i);
                arrTbpa.push(obj);
            }

            let arrTbpa_F = arrTbpa.filter(e => !e.in);
            let objTbpa = arrTbpa.find(e => e.in);
            let tbpa_diaDiem = objTbpa.dia_diem;
            let tptg = objTbpa.bplq;
            let tgdk = objTbpa.tgdk;
            let isShowTbpa = arrTbpa_F.length > 0 ? [true] : [];
            return {
                subsidiary_state, ddMMyyyy, vv,
                tbpa_diaDiem, tptg, tgdk,
                maHangSX, so, isShowTbpa,
                ndct: objNdpa_T.arrNdct, tbpa: arrTbpa_F
            }
        }

        const getDataExpPakt = (curRec, params) => {
            let so = '.PASX';
            let pxl_skph = '';
            let related_case = curRec.getValue('custevent_scv_related_case');
            if(related_case){
                let lkRltCase = search.lookupFields({
                    type: 'supportcase',
                    id: related_case,
                    columns: ['custevent_scv_so_phieu', 'title']
                });
                so = lkRltCase.title + so;
                pxl_skph = lkRltCase.custevent_scv_so_phieu;
            }
            
            let objNdpa_T = {arrNdct: [], arrTsn: []};
            let slPakt = 'recmachcustrecord_scv_pakt_parent';
            for(let i = 0; i < curRec.getLineCount(slPakt); i++){
                let print = curRec.getSublistValue(slPakt, 'custrecord_scv_pakt_print', i);
                if(!print) continue;

                objNdpa_T.print = print;
                objNdpa_T.id = curRec.getSublistValue(slPakt, 'id', i);
                objNdpa_T.assembly = curRec.getSublistText(slPakt, 'custrecord_scv_pakt_assembly', i);
                objNdpa_T.subject = curRec.getSublistText(slPakt, 'custrecord_scv_pakt_subject', i);
                objNdpa_T.note = curRec.getSublistValue(slPakt, 'custrecord_scv_pakt_note', i);
                objNdpa_T.requestor = curRec.getSublistValue(slPakt, 'custrecord_scv_pakt_requestor', i);
                objNdpa_T.date = curRec.getSublistText(slPakt, 'custrecord_scv_pakt_date', i);
            }

            if(objNdpa_T.id){
                let ndPaktRec = record.load({type: 'customrecord_scv_pakt', id: objNdpa_T.id});
                let slNdct = 'recmachcustrecord_scv_nvl_parent';
                for(let i = 0; i < ndPaktRec.getLineCount(slNdct); i++){
                    let obj = {};
                    obj.stt = ndPaktRec.getSublistValue(slNdct, 'custrecord_scv_nvl_stt', i);
                    obj.quyCach = ndPaktRec.getSublistValue(slNdct, 'custrecord_scv_nvl_name', i);
                    obj.seri = ndPaktRec.getSublistValue(slNdct, 'custrecord_scv_nvl_seri', i);
                    obj.loi = ndPaktRec.getSublistValue(slNdct, 'custrecord_scv_nvl_loi', i);
                    obj.phuongAn = ndPaktRec.getSublistValue(slNdct, 'custrecord_scv_nvl_solution', i);
                    obj.ghiChu = ndPaktRec.getSublistValue(slNdct, 'custrecord_scv_nvl_note', i);
                    objNdpa_T.arrNdct.push(obj);
                }

                let slTsn = 'recmachcustrecord_scv_paky_tsn_parent';
                for(let i = 0; i < ndPaktRec.getLineCount(slTsn); i++){
                    let obj = {};
                    obj.thongSo = ndPaktRec.getSublistText(slTsn, 'custrecord_scv_paky_tsn_thong_so', i);
                    obj.so1 = ndPaktRec.getSublistValue(slTsn, 'custrecord_scv_paky_tsn_so1', i);
                    obj.so2 = ndPaktRec.getSublistValue(slTsn, 'custrecord_scv_paky_tsn_so2', i);
                    obj.so3 = ndPaktRec.getSublistValue(slTsn, 'custrecord_scv_paky_tsn_so3', i);
                    obj.so4 = ndPaktRec.getSublistValue(slTsn, 'custrecord_scv_paky_tsn_so4', i);
                    obj.so5 = ndPaktRec.getSublistValue(slTsn, 'custrecord_scv_paky_tsn_so5', i);
                    obj.so6 = ndPaktRec.getSublistValue(slTsn, 'custrecord_scv_paky_tsn_so6', i);
                    obj.so7_8 = ndPaktRec.getSublistValue(slTsn, 'custrecord_scv_paky_tsn_so78', i);
                    objNdpa_T.arrTsn.push(obj);
                }
            };

            let vv = objNdpa_T.subject;
            let maHangSX = objNdpa_T.assembly;
            let luuYKhac = objNdpa_T.note;
            let subsidiary = curRec.getValue('custevent_scv_subsidiary');
            let subsidiary_state = subsidiary ? getDataSubsidiary(subsidiary).state : '';
            let ddMMyyyy = getddMMyyyy();
            let approver1 = curRec.getValue('custevent_scv_approver1');
            let objApr = approver1 ? getDataEmp(approver1) : {};
            let kiemSoat = [objApr.legal_name, objApr.title].filter(Boolean).join('-');
            let objReq = objNdpa_T.requestor ? getDataEmp(objNdpa_T.requestor) : {};
            let nguoiLap = [objReq.legal_name, objReq.title, objNdpa_T.date].filter(Boolean).join('-');
            let isShowTsn = objNdpa_T.arrTsn.length > 0 ? [true] : [];
            return {
                so, vv, pxl_skph, maHangSX,
                luuYKhac, subsidiary_state, ddMMyyyy, kiemSoat, nguoiLap, isShowTsn,
                ndct: objNdpa_T.arrNdct, tsn: objNdpa_T.arrTsn
            }
        }

        return {
            onRequest,
            getDataExpThongBaoPakt,
            getDataExpPakt
        }

    });
