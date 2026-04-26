// ===== services =====
export const event_service_token = Symbol('EVENT_SERVICE_TOKEN');
export const event_session_service_token = Symbol(
    'EVENT_SESSION_SERVICE_TOKEN',
);
export const ticket_section_service_token = Symbol(
    'TICKET_SECTION_SERVICE_TOKEN',
);
export const ticket_sale_phase_service_token = Symbol(
    'TICKET_SALE_PHASE_SERVICE_TOKEN',
);
export const event_media_service_token = Symbol('EVENT_MEDIA_SERVICE_TOKEN');
export const event_publication_review_service_token = Symbol(
    'EVENT_PUBLICATION_REVIEW_SERVICE_TOKEN',
);
export const event_staff_service_token = Symbol('EVENT_STAFF_SERVICE_TOKEN');

// ===== event use cases =====
export const create_event_usecase_token = Symbol('CREATE_EVENT_USECASE_TOKEN');
export const list_events_by_company_usecase_token = Symbol(
    'LIST_EVENTS_BY_COMPANY_USECASE_TOKEN',
);
export const get_event_usecase_token = Symbol('GET_EVENT_USECASE_TOKEN');
export const update_event_usecase_token = Symbol('UPDATE_EVENT_USECASE_TOKEN');
export const delete_event_usecase_token = Symbol('DELETE_EVENT_USECASE_TOKEN');
export const submit_event_for_review_usecase_token = Symbol(
    'SUBMIT_EVENT_FOR_REVIEW_USECASE_TOKEN',
);
export const get_event_sales_summary_usecase_token = Symbol(
    'GET_EVENT_SALES_SUMMARY_USECASE_TOKEN',
);
export const issue_courtesies_usecase_token = Symbol(
    'ISSUE_COURTESIES_USECASE_TOKEN',
);
export const assign_event_staff_usecase_token = Symbol(
    'ASSIGN_EVENT_STAFF_USECASE_TOKEN',
);
export const list_event_staff_usecase_token = Symbol(
    'LIST_EVENT_STAFF_USECASE_TOKEN',
);
export const revoke_event_staff_usecase_token = Symbol(
    'REVOKE_EVENT_STAFF_USECASE_TOKEN',
);

// ===== session use cases =====
export const create_session_usecase_token = Symbol(
    'CREATE_SESSION_USECASE_TOKEN',
);
export const update_session_usecase_token = Symbol(
    'UPDATE_SESSION_USECASE_TOKEN',
);
export const delete_session_usecase_token = Symbol(
    'DELETE_SESSION_USECASE_TOKEN',
);

// ===== section use cases =====
export const create_section_usecase_token = Symbol(
    'CREATE_SECTION_USECASE_TOKEN',
);
export const update_section_usecase_token = Symbol(
    'UPDATE_SECTION_USECASE_TOKEN',
);
export const delete_section_usecase_token = Symbol(
    'DELETE_SECTION_USECASE_TOKEN',
);

// ===== phase use cases =====
export const create_phase_usecase_token = Symbol('CREATE_PHASE_USECASE_TOKEN');
export const update_phase_usecase_token = Symbol('UPDATE_PHASE_USECASE_TOKEN');
export const delete_phase_usecase_token = Symbol('DELETE_PHASE_USECASE_TOKEN');

// ===== media use cases =====
export const add_event_media_usecase_token = Symbol(
    'ADD_EVENT_MEDIA_USECASE_TOKEN',
);
export const remove_event_media_usecase_token = Symbol(
    'REMOVE_EVENT_MEDIA_USECASE_TOKEN',
);

// ===== public (discovery) use cases =====
export const list_public_events_usecase_token = Symbol(
    'LIST_PUBLIC_EVENTS_USECASE_TOKEN',
);
export const get_public_event_usecase_token = Symbol(
    'GET_PUBLIC_EVENT_USECASE_TOKEN',
);

// ===== admin use cases =====
export const list_pending_events_usecase_token = Symbol(
    'LIST_PENDING_EVENTS_USECASE_TOKEN',
);
export const get_event_for_review_usecase_token = Symbol(
    'GET_EVENT_FOR_REVIEW_USECASE_TOKEN',
);
export const approve_event_usecase_token = Symbol(
    'APPROVE_EVENT_USECASE_TOKEN',
);
export const reject_event_usecase_token = Symbol(
    'REJECT_EVENT_USECASE_TOKEN',
);
export const publish_event_usecase_token = Symbol(
    'PUBLISH_EVENT_USECASE_TOKEN',
);
export const unpublish_event_usecase_token = Symbol(
    'UNPUBLISH_EVENT_USECASE_TOKEN',
);
export const rotate_event_qr_usecase_token = Symbol(
    'ROTATE_EVENT_QR_USECASE_TOKEN',
);
export const admin_list_events_usecase_token = Symbol(
    'ADMIN_LIST_EVENTS_USECASE_TOKEN',
);

// ===== promoter use cases =====
export const event_promoter_service_token = Symbol(
    'EVENT_PROMOTER_SERVICE_TOKEN',
);
export const assign_event_promoters_usecase_token = Symbol(
    'ASSIGN_EVENT_PROMOTERS_USECASE_TOKEN',
);
export const list_event_promoters_usecase_token = Symbol(
    'LIST_EVENT_PROMOTERS_USECASE_TOKEN',
);
export const revoke_event_promoter_usecase_token = Symbol(
    'REVOKE_EVENT_PROMOTER_USECASE_TOKEN',
);
export const list_my_promoted_events_usecase_token = Symbol(
    'LIST_MY_PROMOTED_EVENTS_USECASE_TOKEN',
);
export const get_promoter_sales_usecase_token = Symbol(
    'GET_PROMOTER_SALES_USECASE_TOKEN',
);
export const list_event_attendees_usecase_token = Symbol(
    'LIST_EVENT_ATTENDEES_USECASE_TOKEN',
);
export const list_my_staff_events_usecase_token = Symbol(
    'LIST_MY_STAFF_EVENTS_USECASE_TOKEN',
);
