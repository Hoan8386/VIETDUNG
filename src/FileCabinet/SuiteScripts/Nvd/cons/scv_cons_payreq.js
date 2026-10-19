define([], () => {
    const CustomRecordType = {
        PAYMENT_REQUEST: 'customrecord_scv_payment',
        LC_WRITE_CHECK: 'custompurchase_scv_lenhchi'
    };
    const CustomButtonId = {
        DNTT: 'btn_dntt',
        DNTU: 'btn_dntu',
        VENDOR_PREPAYMENT: 'vendorprepayment',
        BILL: 'bill',
        BILL_TRANSFORM_PO: 'bill_transform_po',
        EXPENSE_REPORT: 'bill_transform_po',
        WRITE_CHECK_TUNV: 'writecheck_tunv',
        WRITE_CHECK_CHI_KHAC: 'writecheck_chikhac',
        CREDIT_MEMO: 'creditmemo',
        DEPOSIT: 'deposit',
        BILL_PAYMENT: 'billpayment',
        BILL_CREDIT: 'billcredit',
        QUYET_TOAN : 'payreq_quyettoan',
        DNTT_FROM_IB: 'dntt_from_ib',
        JOURNAL_ENTRY : 'btn_journal_entry',
        CUSTOMER_REFUND : 'btn_cus_ref'
    };
    const CustomAccountId = {
        ACCOUNT_14110001: '118',
        ACCOUNT_71110001: '244',
        ACCOUNT_14120001: '243',
        ACCOUNT_33110001: '111',
    };
    const CustomTaxCodeId = {
        UNDEF_VN: '5'
    };
    const CustomPaymentTypeId = {
        CHI_KHAC: '3',
        TAM_UNG_NCC: '1',
        TAM_UNG_NHAN_VIEN: '7',
        TAM_UNG_NV_DI_MUA_HANG: '8',
        THANH_TOAN_CONG_NO: '2',
        HOAN_UNG_NHAN_VIEN: '9',
        QUYET_TOAN_NV_DI_MUA_HANG: '11',
        CAN_TRU_CONG_NO: '10',
        TRA_TIEN_KH : '12',
        HOAN_TIEN_KHACH_HANG : '13',
    };
    const CustomSublistId = {
        PAYMENT_REQUEST: 'recmachcustrecord_scv_pay',
        ITEM: 'item',
        EXPENSE: 'expense',
        OTHER: 'other'
    };
    const CustomSavedSearchId = {
        LIST_ACCOUNT_ON_ITEMS: 'customsearch_scv_list_account_on_item',
        EMP_CHECK: 'customsearch_scv_emp_precheck',
        EMP_DEPOSIT: 'customsearch_scv_emp_deposits',
        EMP_EXPENSE_REPORT: 'customsearch_scv_emp_exprep',
        EMP_BILL_PAYMENT: 'customsearch_scv_emp_billpayment',
        PAY_REQ_PAID_AMOUNT: 'customsearch_scv_paid_amt_payr',
        ACCOUNT_MAIN_BILLS : 'customsearch_scv_account_transaction'
    };
    const CustomStatusId = {
        APPROVED: '3',
        CANCEL: '13',
        CLOSED: '5',
        CONFIRMED: '19',
        DRAFT: '1',
        GD_SAN_XUAT: '23',
        KV_DUYET: '22',
        OPEN: '10',
        PENDING_ACC_APPROVAL: '21',
        PENDING_APPROVAL: '2',
        PENDING_BOD_APPROVAL: '8',
        PENDING_CHIEF_ACC_APPROVAL: '11',
        PENDING_CONFIRMATION: '6',
        PENDING_DEPUTY_ACC_APPROVAL: '20',
        PENDING_FOR_DEPOSIT: '12',
        PENDING_HOD_APPROVAL: '7',
        PENDING_KHTH_APPROVE: '25',
        PENDING_TGD_APPROVAL: '14',
        REJECTED: '4',
        TGD_PTGD: '24',
    };
    const CustomScriptId = {
        SL_SCRIPT_CREATE_BILL_FROM_PAYMENT: 'customscript_scv_sl_crt_bill_from_payreq',
        SL_DEPLOY_CREATE_BILL_FROM_PAYMENT: 'customdeploy_scv_sl_crt_bill_from_payreq'
    };
    const CustomCacheData = {
        SUBSIDIARY: 'scvSubsidiary',
        ACCOUNT: 'scvAccount',
    };
    const CustomKeySession = {
        PAYMENT_REQUEST : 'scvPaymentRequest',
        DATA_TAX_CODE : 'scvDataTaxCode'
    };
    const CustomRoleId = {
        ADMINISTRATOR: '3',
        NVD_THU_QUY : '1638'
    };
    const CustomProps = {
        SOURCE_LINE_PAY_REQ : 'sourceLinePayReq',
    };
    const CustomLine = {
        LINE_CREATED_FROM_ORDER: '1',
        LINE_CREATED_FROM_ITEM_RECEIPT: '2',
        LINE_OTHER: '3',
    };
    return {
        CustomKeySession,
        CustomRoleId,
        CustomScriptId,
        CustomRecordType,
        CustomButtonId,
        CustomAccountId,
        CustomTaxCodeId,
        CustomPaymentTypeId,
        CustomSublistId,
        CustomSavedSearchId,
        CustomStatusId,
        CustomCacheData,
        CustomProps,
        CustomLine
    };
});