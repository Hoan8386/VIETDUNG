/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/query', 'N/record', 'N/log'], function(query, record, log) {
    function execute(scriptContext) {
        try {
            var sql = "SELECT id FROM CUSTOMRECORD_ALN_CONFIG_ELEMENT_MAPPING ";

            var resultSet = query.runSuiteQL({ query: sql }).asMappedResults();
            log.debug('Records Found', resultSet.length + ' records to delete.');

            resultSet.forEach(function(recordData) {
                try {
                    record.delete({ type: 'customrecord_aln_config_element_mapping', id: recordData.id });
                    log.debug('Deleted Record', 'ID: ' + recordData.id);
                } catch (e) {
                    log.error('Error Deleting Record ID: ' + recordData.id, e);
                }
            });

            log.debug('Process Completed', 'All records have been processed.');
        } catch (error) {
            log.error('Script Execution Error', error);
        }
    }
    
    return { execute: execute };
});
