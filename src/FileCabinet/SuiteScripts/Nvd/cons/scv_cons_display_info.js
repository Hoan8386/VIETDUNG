define([],
    function () {
        return {
            CUSTOM_ACTION: {
                CHECK_PERMISSION_VIEW_COST_OF_ROLE: 'scvCheckViewCostOfRole',
                CHECK_ITEM_TYPE_OTHER_CHARGE: 'scvCheckItemTypeOtherCharge'
            },
            ITEM_OTHER_CHARGE: 'OthCharge',
            RECORD_TYPE: {
                WORK_ORDER: 'workorder', BOM_REVISION: 'bomrevision', ASSEMBLY_BUILD: 'assemblybuild'
            },
            COLUMN_ID_QUANTITY: 'custpage_scv_quantity',
            COLUMN_ID_STD_QUANTITY_USED: 'quantityfulfilled',
            COLUMN_ID_STD_QUANTITY_USED_CUSTOM: 'custpage_scv_quantityfulfilled',
            COLUMN_ID_STD_QUANTITY_COMMIT: 'quantitycommitted',
            FIELD_BODY_ASSEMBLY_ITEM: 'assemblyitem',
            PREFIX_ELEMENT_ID: 'component_quantity',
            SUFFIX_ELEMENT_ID: '_fs',
            FIELD_BODY_ITEM: 'item',
            FIELD_BODY_LOCATION: 'location',
            FIELD_BODY_QUANTITY_WORK_ORDER: 'quantity',
            FIELD_BODY_QUANTITY_ASSEMBLY_BUILD: 'quantity',
            FIELD_LINE_QUANTITY_ASSEMBLY_BUILD: 'quantity',
            FIELD_LINE_QUANTITY_ASSEMBLY_BUILD_CUSTOM: 'custpage_scv_quantity_ab',
            ROLE_ADMIN_ID: 3,
            MODE: {
                CREATE: 'create'
            },
            MESSAGE: {
                ALERT_NOT_EDIT_QUANTITY_LINE_ITEM_OTHER_CHARGE: 'This item is Other Charge!You do not change this line! Please check again!'
            },
            USER_TEST_ID: 25
        };
    });