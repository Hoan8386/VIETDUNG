/**
 * @NApiVersion 2.1
 */
define(['N/record', 'N/query', 'N/runtime', '../olib/lodash.min', 'N/search'],

    (record, query, runtime, _, search) => {

        const createPhieuTheoDoi = (idTransaction, idTemplate, suiteLetName = 'Default Record Screen') => {
            let recNewPhieuTheoDoi = record.create({
                type: 'customrecord_scv_print_check',
                isDynamic: true
            });
            let objEmployee = getObjEmp();
            let currentMaxPrintCount = getCurrentMaxPrintCount(idTransaction, idTemplate, suiteLetName);
            setDataTheoDoiPhieuIn(recNewPhieuTheoDoi, idTransaction, idTemplate, suiteLetName, objEmployee, currentMaxPrintCount);
            recNewPhieuTheoDoi.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });
        }

        //đang phát triển chức năng in từ Suitelet và các record khác có phiếu in, xem xét
        const createPhieuTheoDoi4Suitelet = (idTransaction, suiteletName, idTemplate) => {
            idTransaction = typeof idTransaction === 'string' ? idTransaction.split(',') : idTransaction;
            if (util.isArray(idTransaction)) {
                // nếu idTransaction là mảng thì sẽ tạo phiếu theo dõi cho từng id trong mảng
                for (let i = 0; i < idTransaction.length; i++) {
                    createPhieuTheoDoi(idTransaction[i], idTemplate, suiteletName);
                }
            }else{
                createPhieuTheoDoi(idTransaction, idTemplate, suiteletName);
            }
        }

        const getObjEmp = () => {
            let idEntity = runtime.getCurrentUser().id;
            if (idEntity) {
                let lkFieldsEntity = search.lookupFields({
                    type: 'entity',
                    id: idEntity,
                    columns: ['recordtype']
                });

                if (lkFieldsEntity.recordtype === 'employee') {
                    let lkFieldsEmployee = search.lookupFields({
                        type: lkFieldsEntity.recordtype,
                        id: idEntity,
                        columns: ['custentity_scv_legal_name']
                    });
                    return {id: idEntity, legalName: lkFieldsEmployee.custentity_scv_legal_name};
                } else if (lkFieldsEntity.recordtype === 'partner') {
                    let lkFieldsPartner = search.lookupFields({
                        type: lkFieldsEntity.recordtype,
                        id: idEntity,
                        columns: ['custentity_scv_partner_employee', 'custentity_scv_partner_employee.custentity_scv_legal_name']
                    });

                    return {
                        id: lkFieldsPartner.custentity_scv_partner_employee[0]?.value,
                        legalName: lkFieldsPartner['custentity_scv_partner_employee.custentity_scv_legal_name']
                    };
                }
            }
        }

        // lấy ra số lần in lớn nhất của phiếu , nhóm theo idTransaction, idTemplate và suiteLetName
        const getCurrentMaxPrintCount = (idTransaction, idTemplate, suiteLetName) => {
            let queryGetDataIn =
                `SELECT p.custrecord_scv_print_times_count,
                        p.custrecord_scv_print_tran,
                        p.custrecord_scv_print_template
                 FROM customrecord_scv_print_check AS p
                 WHERE p.custrecord_scv_print_tran = '${idTransaction}'
                   AND p.custrecord_scv_print_template = '${idTemplate}'
                   AND p.custrecord_scv_suitelet_name = '${suiteLetName}'
                 ORDER BY p.custrecord_scv_print_times_count DESC`;

            let arrTheoDoiPhieuIn = query.runSuiteQL({query: queryGetDataIn}).asMappedResults();

            return arrTheoDoiPhieuIn[0]?.custrecord_scv_print_times_count || 0;
        }

        const setDataTheoDoiPhieuIn = (objRecord, idTransaction, idTemplate, suiteLetName, objEmployee, currentMaxPrintCount) => {
            objRecord.setValue('custrecord_scv_print_tran', idTransaction);
            objRecord.setValue('custrecord_scv_print_template', idTemplate);
            objRecord.setValue('custrecord_scv_print_times_count', currentMaxPrintCount + 1 || 1);
            objRecord.setValue('custrecord_scv_print_time', new Date());
            objRecord.setValue('custrecord_scv_suitelet_name', suiteLetName);
            objRecord.setValue('custrecord_scv_print_person', objEmployee.id);
            objRecord.setValue('custrecord_scv_print_person_legal_name', objEmployee.legalName);
        }

        return {
            createPhieuTheoDoi,
            createPhieuTheoDoi4Suitelet
        }

    });
