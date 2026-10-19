/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record'], function(record) {
    function beforeLoad(context) {
        var task = context.newRecord;
        if (context.type === context.UserEventType.CREATE) {
            task.setValue('assigned', null);
        }
    }
    return {
        beforeLoad: beforeLoad
    };
});
