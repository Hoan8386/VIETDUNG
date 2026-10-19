/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/log'], function(record, runtime, log) {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.CREATE) {
            try {
                var newRecord = context.newRecord;
                var user = runtime.getCurrentUser();

                log.debug('User ID', user.id); // Log the user ID for debugging
                log.debug('User Type', user.type); // Log the user type for debugging
                log.debug('User Role', user.role); // Log the user role for debugging
                log.debug('New Record Type', newRecord.type); // Log the new record type

                if (newRecord.type === 'customrecord_scv_sales_contract') {
                    if (!newRecord.getValue({ fieldId: 'custrecord_scv_sc_sales_rep' })) {
                        log.debug('custrecord_scv_sc_sales_rep is Null'); // Log when the field is null

                        newRecord.setValue({
                            fieldId: 'custrecord_scv_sc_sales_rep',
                            value: user.id
                        });
                        log.debug('custrecord_scv_sc_sales_rep Set to User ID', user.id); // Log the user ID set

                        try {
                            log.debug('Attempting to load partner record for custrecord_scv_sc_sales_rep', user.id); // Log the attempt to load partner record
                            var partnerRecord = record.load({
                                type: 'partner',
                                id: user.id
                            });
                            log.debug('Partner Record Loaded'); // Log successful loading of partner record

                            var employeeLink = partnerRecord.getValue({ fieldId: 'custentity_scv_partner_employee' });

                            log.debug('Employee Link', employeeLink); // Log the employee link

                            newRecord.setValue({
                                fieldId: 'custrecord_scv_sc_sales_rep',
                                value: employeeLink
                            });
                            log.debug('custrecord_scv_sc_sales_rep Set to partner.custentity_scv_partner_employee', employeeLink); // Log the employee link set
                        } catch (error) {
                            log.error('Error Loading Partner Record for custrecord_scv_sc_sales_rep', error.toString()); // Log the error
                        }
                    }
                }

                // Original logic for custrecord_scv_dkct_nguoi_de_nghi
                if (!newRecord.getValue({ fieldId: 'custrecord_scv_dkct_nguoi_de_nghi' })) {
                    log.debug('custrecord_scv_dkct_nguoi_de_nghi is Null'); // Log when the field is null

                    newRecord.setValue({
                        fieldId: 'custrecord_scv_dkct_nguoi_de_nghi',
                        value: user.id
                    });
                    log.debug('custrecord_scv_dkct_nguoi_de_nghi Set to User ID', user.id); // Log the user ID set

                    try {
                        log.debug('Attempting to load partner record for custrecord_scv_dkct_nguoi_de_nghi', user.id); // Log the attempt to load partner record
                        var partnerRecord2 = record.load({
                            type: 'partner',
                            id: user.id
                        });
                        log.debug('Partner Record Loaded'); // Log successful loading of partner record

                        var employeeLink2 = partnerRecord2.getValue({ fieldId: 'custentity_scv_partner_employee' });

                        log.debug('Employee Link', employeeLink2); // Log the employee link

                        newRecord.setValue({
                            fieldId: 'custrecord_scv_dkct_nguoi_de_nghi',
                            value: employeeLink2
                        });
                        log.debug('custrecord_scv_dkct_nguoi_de_nghi Set to partner.custentity_scv_partner_employee', employeeLink2); // Log the employee link set
                    } catch (error) {
                        log.error('Error Loading Partner Record for custrecord_scv_dkct_nguoi_de_nghi', error.toString()); // Log the error
                    }
                }
            } catch (error) {
                log.error('Error in beforeLoad', error.toString()); // Log the error
            }
        }
    }
    return {
        beforeLoad: beforeLoad
    };
});
