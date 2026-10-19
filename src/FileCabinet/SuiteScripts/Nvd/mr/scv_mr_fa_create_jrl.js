/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['../sl/scv_sl_fa_create_jrl.js'], function(SLFACreateJRL) {
    const getInputData = () => {
        return JSON.parse(SLFACreateJRL.getCache().get({key: 'jsondata'}));
    }

    const map = context => {
        const objData = context.value;
        const idJrl = SLFACreateJRL.createJournalEntry(objData);
        if (idJrl) {
            SLFACreateJRL.setJRLCreateByTrans(objData.arrTrans, idJrl);
        }
    }

    const reduce = context => {}


    const summarize = context => {}

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});