/**
 * @NApiVersion 2.1
 */
define(['N/query', 'N/runtime', 'N/search'],
    
    (query, runtime, search) => {
        
        const getUrlFileTemplate = (fileType, fileName) => {
            let sqlFileFontInfo = "select f.name, f.url from file f where f.filetype = ? and f.name = ?";
            return query.runSuiteQL({query: sqlFileFontInfo, params: [fileType, fileName]}).asMappedResults()[0]?.url;
        }
        
        const getInforReport = (parameters) => {
            const currentUser = runtime.getCurrentUser();
            const subsidiaryId = isOneWorld() ? parameters.subsidiary?.split(",")?.[0] || currentUser?.subsidiary?.toString() : 1;
            let sqlDataInfo = `
                select s.legalname, s.name, s.federalidnumber,
                    BUILTIN.DF(s.mainaddress) AS mainaddress_text,
                    s.custrecord_scv_sub_ktt chief_acc_legal_name,
                    s.custrecord_scv_ten_giam_doc director_legal_name
                from subsidiary s
                where s.id = ${subsidiaryId}
            `;
            
            let resultSetDataInfo = query.runSuiteQL({
                query: sqlDataInfo,
                params: []
            });
            let listDataInfo = resultSetDataInfo.asMappedResults();
            
            let objInfoReport = {strLegalNameUser: lookupFieldsEmployee(currentUser.id)?.custentity_scv_legal_name};
            if (listDataInfo.length) {
                let objDataInfo = listDataInfo[0];
                Object.assign(objInfoReport, {
                    strLegalNameSub: objDataInfo.legalname, strNameSub: objDataInfo.name,
                    strMainAddrSub: objDataInfo.mainaddress_text?.split('\r\n')?.[0] || '',
                    strFederalNumberSub: objDataInfo.federalidnumber,
                    strChiefAccNameSub: objDataInfo.chief_acc_legal_name,
                    strDirectorLegalNameSub: objDataInfo.director_legal_name
                });
            }
            return objInfoReport;
        }
        
        const lookupFieldsEmployee = (employeeId) => {
            return search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: employeeId,
                columns: ['custentity_scv_legal_name']
            });
        }
        
        const isOneWorld = () => {
            return runtime.isFeatureInEffect({feature: 'SUBSIDIARIES'});
        }
        
        return {getUrlFileTemplate, getInforReport}
        
    });
