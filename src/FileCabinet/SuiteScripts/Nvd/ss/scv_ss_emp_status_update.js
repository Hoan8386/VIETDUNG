/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  ?                   ?                       ?
 * 28/05/2025          Thanh Ngo                Create Scheduled Script Chức năng tự động chuyển trạng thái nhân sự from Ms.Thao(https://app.clickup.com/t/86cya3qk9)
 */
/**
 /**
/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/query'],
    (record, query) => {

        const EmployeeStatus = {
            DANG_DI_LAM : 2,
            DA_NGHI_VIEC : 8,
        }

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            let today = new Date()
            today.setHours(0, 0, 0, 0);
                //.toLocaleString('en-US', {timeZone: 'Asia/Ho_Chi_Minh'});
            let resultSet = query.runSuiteQL({
                query: `
                    SELECT id,
                           custentity_scv_legal_name,
                           birthdate,
                           hiredate,
                           employeestatus,
                           releasedate
                    FROM employee
                    WHERE isinactive = 'F'
                      AND releasedate is not null
                      AND employeestatus = '${EmployeeStatus.DANG_DI_LAM}'
                `,
            }).asMappedResults();

            log.error('Employees checked', resultSet)

            resultSet.forEach((result) => {
                try {
                    const releaseDate = parseDate(result.releasedate);
                    // if (result.releasedate <= today) {
                    if (releaseDate <= today) {
                        const empId = result.id;
                        let empRec = record.load({type: record.Type.EMPLOYEE, id: empId});
                        empRec.setValue({
                            fieldId: 'employeestatus',
                            value: EmployeeStatus.DA_NGHI_VIEC
                        });
                        empRec.save();
                        log.error(`Employee Update`, `Employee ${result.custentity_scv_legal_name} with ID: ${empId} has been updated to Retired status.`);
                    }
                } catch (e) {
                    log.error('Error Updating Employee ID: ' + result.id, e.message);
                }
            });
        }

        const parseDate = (str) => {
            const [day, month, year] = str.split('/');
            return new Date(year, month - 1, day);
        };

        return {execute}
    });
