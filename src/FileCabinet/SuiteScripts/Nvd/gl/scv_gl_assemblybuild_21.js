/**
 * @NApiVersion 2.1
 * @NScriptType customglplugin
 */
define(['N/search'],
    (search) => {
        const SEGMENT_IDS = ['cseg_scv_sg_proj', 'cseg_scv_sc', 'cseg_scv_pc', 'cseg_scv_kmcp', 'cseg_scv_loan'];
        const ACCOUNT_COLUMNS = ['number', 'type', 'custrecord_scv_acc_drc', 'custrecord_scv_acc_wip'];

        const customizeGlImpact = (context) => {
            const standardLines = context.standardLines;
            const customLines = context.customLines;
            const arrAccRe = {};
            const count = standardLines.count;

            for (let i = 0; i < count; i++) {
                const strLine = standardLines.getLine({index: i});
                const accountId = strLine.accountId;
                const amount = strLine.creditAmount;
                if (accountId && amount > 0) {
                    const objAccount = arrAccRe[accountId + ''] || {};
                    if (!objAccount.id) {
                        const lkAcc = search.lookupFields({type: 'account', id: accountId, columns: ACCOUNT_COLUMNS});
                        objAccount.id = accountId;
                        objAccount.type = getLookupValue(lkAcc.type);
                        objAccount.number = lkAcc.number;
                        objAccount.acc_drc = getLookupValue(lkAcc.custrecord_scv_acc_drc);
                        objAccount.acc_wip = getLookupValue(lkAcc.custrecord_scv_acc_wip);
                        arrAccRe[accountId + ''] = objAccount;
                        //log.debug('objAccount.acc_drc', objAccount.acc_drc);
                    }

                    if (!!objAccount.acc_drc) {
                        const memo = strLine.id + '-' + strLine.memo;
                        //Dao debit credit
                        addLine(customLines, amount, 0, objAccount.acc_drc, strLine, memo);
                        //Debit credit
                        addLine(customLines, 0, amount, objAccount.acc_drc, strLine, memo);
                    }
                    if (!!objAccount.acc_wip) {
                        const memo = strLine.id + '-' + strLine.memo;
                        //Dao debit credit
                        addLine(customLines, amount, 0, objAccount.acc_wip, strLine, memo);
                        //Debit credit
                        addLine(customLines, 0, amount, objAccount.acc_wip, strLine, '0' + '-' + strLine.memo);
                    }
                }
            }
        };

        //lookupFields tra ve mang [{value, text}] voi truong select
        const getLookupValue = (value) => {
            if (Array.isArray(value)) {
                return value.length > 0 ? value[0].value : '';
            }
            return value;
        };

        const addLine = (customLines, debit, credit, accOpp, strLine, memo) => {
            const newLine = customLines.addNewLine();
            if (debit > 0) {
                newLine.debitAmount = debit;
            }
            if (credit > 0) {
                newLine.creditAmount = credit;
            }
            newLine.accountId = accOpp * 1;
            newLine.memo = memo;
            newLine.departmentId = strLine.departmentId;
            newLine.classId = strLine.classId;
            newLine.locationId = strLine.locationId;
            newLine.entityId = strLine.entityId;
            for (const segmentId of SEGMENT_IDS) {
                const segmentValueId = strLine.getSegmentValueId({segmentId: segmentId});
                if (segmentValueId !== undefined) {
                    newLine.setSegmentValueId({segmentId: segmentId, segmentValueId: segmentValueId});
                }
            }
        };

        return {customizeGlImpact};
    });
