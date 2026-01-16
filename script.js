// ============================================
// Smart Message Builder - Tree View Version
// ============================================

// Configuration
const CONFIG = {
    MAX_UNDO_STACK: 50,
    MAX_STORAGE_SIZE: 5 * 1024 * 1024,
    FEEDBACK_DURATION: 3000,
    DEBOUNCE_DELAY: 150,
    STORAGE_KEYS: {
        TEMPLATES: 'smartMessageBuilder_templates',
        XSD_SCHEMA: 'smartMessageBuilder_xsdSchema',
        LAST_FORMAT: 'smartMessageBuilder_lastFormat',
        SIDEBAR_STATE: 'smartMessageBuilder_sidebarState',
        OUTPUT_HEIGHT: 'smartMessageBuilder_outputHeight'
    }
};

// DOM Elements
const elements = {
    // Toolbar
    outputFormatSelect: document.getElementById('outputFormatSelect'),
    messageTemplate: document.getElementById('messageTemplate'),
    presetTemplatesGroup: document.getElementById('preset-templates-group'),
    customTemplatesGroup: document.getElementById('custom-templates-group'),
    deleteTemplateBtn: document.getElementById('delete-template-btn'),
    uploadXsdBtn: document.getElementById('upload-xsd-btn'),
    xsdUploadInput: document.getElementById('xsd-upload-input'),
    uploadBtn: document.getElementById('upload-btn'),
    fileUpload: document.getElementById('file-upload'),
    pasteBtn: document.getElementById('paste-btn'),
    undoBtn: document.getElementById('undo-btn'),
    redoBtn: document.getElementById('redo-btn'),
    saveTemplateBtn: document.getElementById('save-template-btn'),
    clearAllBtn: document.getElementById('clear-all-btn'),
    unsavedIndicator: document.getElementById('unsaved-indicator'),
    
    // Tree Editor
    treeContainer: document.getElementById('tree-container'),
    treeEmptyState: document.getElementById('tree-empty-state'),
    addRecordBtn: document.getElementById('add-record-btn'),
    addChildBtn: document.getElementById('add-child-btn'),
    expandAllBtn: document.getElementById('expand-all-btn'),
    collapseAllBtn: document.getElementById('collapse-all-btn'),
    
    // Properties Sidebar
    propertiesSidebar: document.getElementById('properties-sidebar'),
    toggleSidebarBtn: document.getElementById('toggle-sidebar-btn'),
    propertiesEmpty: document.getElementById('properties-empty'),
    propertiesForm: document.getElementById('properties-form'),
    nodeTypeSelect: document.getElementById('node-type-select'),
    customNodeNameGroup: document.getElementById('custom-node-name-group'),
    customNodeNameInput: document.getElementById('custom-node-name'),
    fieldsContainer: document.getElementById('fields-container'),
    addFieldBtn: document.getElementById('add-field-btn'),
    duplicateNodeBtn: document.getElementById('duplicate-node-btn'),
    copyNodeBtn: document.getElementById('copy-node-btn'),
    pasteNodeBtn: document.getElementById('paste-node-btn'),
    moveUpBtn: document.getElementById('move-up-btn'),
    moveDownBtn: document.getElementById('move-down-btn'),
    deleteNodeBtn: document.getElementById('delete-node-btn'),
    
    // Output Panel
    outputPanel: document.getElementById('output-panel'),
    toggleOutputBtn: document.getElementById('toggle-output-btn'),
    outputFormatBadge: document.getElementById('output-format-badge'),
    outputContent: document.getElementById('output-content'),
    outputHighlighted: document.getElementById('output-highlighted'),
    outputResizeHandle: document.getElementById('output-resize-handle'),
    copyTextBtn: document.getElementById('copy-text-btn'),
    copyRichBtn: document.getElementById('copy-rich-btn'),
    downloadBtn: document.getElementById('download-btn'),
    
    // Modals
    initialXsdModal: document.getElementById('initial-xsd-modal'),
    initialXsdUploadBtn: document.getElementById('initial-xsd-upload-btn'),
    saveModal: document.getElementById('save-modal'),
    templateNameInput: document.getElementById('template-name'),
    confirmSaveBtn: document.getElementById('confirm-save-btn'),
    confirmModal: document.getElementById('confirm-modal'),
    confirmTitle: document.getElementById('confirm-title'),
    confirmMessage: document.getElementById('confirm-message'),
    confirmActionBtn: document.getElementById('confirm-action-btn'),
    
    // Feedback
    copyFeedback: document.getElementById('copy-feedback'),
    
    // Templates
    treeNodeTemplate: document.getElementById('tree-node-template'),
    fieldTemplate: document.getElementById('field-template')
};

// ============================================
// Application State
// ============================================
const state = {
    nodes: [],              // Flat array of all nodes with parentId references
    selectedNodeId: null,   // Currently selected node ID
    clipboard: null,        // Copied node data
    undoStack: [],
    redoStack: [],
    hasUnsavedChanges: false,
    xsdSchema: null,
    customTemplates: {},
    currentFormat: 'astm',
    sortableInstances: [],
    isResizingOutput: false
};

// Generate unique IDs
let nodeIdCounter = 0;
const generateNodeId = () => `node_${++nodeIdCounter}_${Date.now()}`;

// ============================================
// Record Type Definitions
// ============================================
const RECORD_TYPES = {
    astm: [
        { value: 'H', label: 'H - Header' },
        { value: 'P', label: 'P - Patient' },
        { value: 'O', label: 'O - Order' },
        { value: 'R', label: 'R - Result' },
        { value: 'C', label: 'C - Comment' },
        { value: 'Q', label: 'Q - Query' },
        { value: 'M', label: 'M - Manufacturer' },
        { value: 'S', label: 'S - Scientific' },
        { value: 'L', label: 'L - Terminator' }
    ],
    hl7: [
        // Message Header
        { value: 'MSH', label: 'MSH - Message Header' },
        { value: 'MSA', label: 'MSA - Message Acknowledgment' },
        { value: 'ERR', label: 'ERR - Error' },
        // Patient Administration
        { value: 'EVN', label: 'EVN - Event Type' },
        { value: 'PID', label: 'PID - Patient Identification' },
        { value: 'PD1', label: 'PD1 - Patient Additional Demographic' },
        { value: 'NK1', label: 'NK1 - Next of Kin' },
        { value: 'PV1', label: 'PV1 - Patient Visit' },
        { value: 'PV2', label: 'PV2 - Patient Visit Additional' },
        { value: 'MRG', label: 'MRG - Merge Patient Information' },
        // Orders
        { value: 'ORC', label: 'ORC - Common Order' },
        { value: 'OBR', label: 'OBR - Observation Request' },
        { value: 'OBX', label: 'OBX - Observation/Result' },
        { value: 'NTE', label: 'NTE - Notes and Comments' },
        { value: 'TQ1', label: 'TQ1 - Timing/Quantity' },
        { value: 'TQ2', label: 'TQ2 - Timing/Quantity Relationship' },
        { value: 'RXA', label: 'RXA - Pharmacy Administration' },
        { value: 'RXC', label: 'RXC - Pharmacy Component' },
        { value: 'RXD', label: 'RXD - Pharmacy Dispense' },
        { value: 'RXE', label: 'RXE - Pharmacy Encoded Order' },
        { value: 'RXG', label: 'RXG - Pharmacy Give' },
        { value: 'RXO', label: 'RXO - Pharmacy Prescription' },
        { value: 'RXR', label: 'RXR - Pharmacy Route' },
        // Financial
        { value: 'FT1', label: 'FT1 - Financial Transaction' },
        { value: 'DG1', label: 'DG1 - Diagnosis' },
        { value: 'GT1', label: 'GT1 - Guarantor' },
        { value: 'IN1', label: 'IN1 - Insurance' },
        { value: 'IN2', label: 'IN2 - Insurance Additional' },
        { value: 'IN3', label: 'IN3 - Insurance Additional Info' },
        // Scheduling
        { value: 'SCH', label: 'SCH - Scheduling Activity' },
        { value: 'AIS', label: 'AIS - Appointment Information' },
        { value: 'AIG', label: 'AIG - Appointment Information General' },
        { value: 'AIL', label: 'AIL - Appointment Information Location' },
        { value: 'AIP', label: 'AIP - Appointment Information Personnel' },
        // Master Files
        { value: 'MFI', label: 'MFI - Master File Identification' },
        { value: 'MFE', label: 'MFE - Master File Entry' },
        // Query
        { value: 'QRD', label: 'QRD - Query Definition' },
        { value: 'QRF', label: 'QRF - Query Filter' },
        { value: 'QPD', label: 'QPD - Query Parameter Definition' },
        { value: 'RCP', label: 'RCP - Response Control Parameter' },
        // Other Common
        { value: 'AL1', label: 'AL1 - Allergy Information' },
        { value: 'DRG', label: 'DRG - Diagnosis Related Group' },
        { value: 'PR1', label: 'PR1 - Procedures' },
        { value: 'ROL', label: 'ROL - Role' },
        { value: 'SPM', label: 'SPM - Specimen' },
        { value: 'SAC', label: 'SAC - Specimen Container' },
        { value: 'TXA', label: 'TXA - Transcription Document Header' },
        { value: 'BTS', label: 'BTS - Batch Trailer' },
        { value: 'FHS', label: 'FHS - File Header' },
        { value: 'FTS', label: 'FTS - File Trailer' },
        { value: 'BHS', label: 'BHS - Batch Header' },
        { value: 'DSC', label: 'DSC - Continuation Pointer' },
        { value: 'CTD', label: 'CTD - Contact Data' },
        { value: 'CTI', label: 'CTI - Clinical Trial Identification' },
        { value: 'SFT', label: 'SFT - Software Segment' },
        { value: 'UAC', label: 'UAC - User Authentication Credential' }
    ],
    poct1a: [
        // ===== MESSAGE TYPES (Root Elements) - POCT1-A2 Standard =====
        { value: 'OBS.R02', label: 'OBS.R02 - Observation Result (Device→DMS)', allowsChildren: true, isRoot: true },
        { value: 'OBS.R01', label: 'OBS.R01 - Unsolicited Observation (Device→DMS)', allowsChildren: true, isRoot: true },
        { value: 'ACK.R01', label: 'ACK.R01 - Acknowledgment', allowsChildren: true, isRoot: true },
        { value: 'DOR.R01', label: 'DOR.R01 - Device Observation Request (DMS→Device)', allowsChildren: true, isRoot: true },
        { value: 'ESU.U01', label: 'ESU.U01 - Device Status Update', allowsChildren: true, isRoot: true },
        { value: 'EAC.U07', label: 'EAC.U07 - Device Action Request', allowsChildren: true, isRoot: true },
        { value: 'TCU.U10', label: 'TCU.U10 - Topic Configuration Update', allowsChildren: true, isRoot: true },
        { value: 'INR.U14', label: 'INR.U14 - Inventory Request', allowsChildren: true, isRoot: true },
        { value: 'HLO', label: 'HLO - Hello Message (Device→DMS)', allowsChildren: true, isRoot: true },
        { value: 'END', label: 'END - End Session Message', allowsChildren: true, isRoot: true },
        
        // ===== SEGMENT TYPES - POCT1-A2 Standard (Appendix B - DML) =====
        { value: 'HDR', label: 'HDR - Header (Message Header)', allowsChildren: true },
        { value: 'DEV', label: 'DEV - Device Identification', allowsChildren: true },
        { value: 'OPR', label: 'OPR - Operator', allowsChildren: true },
        { value: 'SBJ', label: 'SBJ - Subject/Patient', allowsChildren: true },
        { value: 'SPC', label: 'SPC - Specimen', allowsChildren: true },
        { value: 'ORD', label: 'ORD - Order (Test Order)', allowsChildren: true },
        { value: 'OBS', label: 'OBS - Observation (Test Result)', allowsChildren: true },
        { value: 'CTC', label: 'CTC - Control (QC Material)', allowsChildren: true },
        { value: 'CAL', label: 'CAL - Calibration', allowsChildren: true },
        { value: 'RGT', label: 'RGT - Reagent/Consumable', allowsChildren: true },
        { value: 'ENV', label: 'ENV - Environment Conditions', allowsChildren: true },
        { value: 'STS', label: 'STS - Status', allowsChildren: true },
        { value: 'NTE', label: 'NTE - Note/Comment', allowsChildren: false },
        { value: 'ERR', label: 'ERR - Error', allowsChildren: true },
        { value: 'SVC', label: 'SVC - Service', allowsChildren: true },
        { value: 'INV', label: 'INV - Inventory', allowsChildren: true },
        { value: 'CFG', label: 'CFG - Configuration', allowsChildren: true },
        { value: 'ACT', label: 'ACT - Action', allowsChildren: true },
        { value: 'ACC', label: 'ACC - Access Control', allowsChildren: true },
        { value: 'CAP', label: 'CAP - Device Capabilities', allowsChildren: true },
        { value: 'TPC', label: 'TPC - Topic', allowsChildren: true },
        { value: 'LST', label: 'LST - List (Operator/Patient)', allowsChildren: true },
        { value: 'EVT', label: 'EVT - Device Event', allowsChildren: true },
        
        // ===== HDR ELEMENTS (Header) =====
        { value: 'HDR.control_id', label: 'HDR.control_id - Message Control ID', allowsChildren: false },
        { value: 'HDR.version_id', label: 'HDR.version_id - Protocol Version', allowsChildren: false },
        { value: 'HDR.creation_dttm', label: 'HDR.creation_dttm - Creation Date/Time', allowsChildren: false },
        { value: 'HDR.character_set', label: 'HDR.character_set - Character Set', allowsChildren: false },
        { value: 'HDR.sending_device', label: 'HDR.sending_device - Sending Device ID', allowsChildren: false },
        { value: 'HDR.receiving_device', label: 'HDR.receiving_device - Receiving Device ID', allowsChildren: false },
        { value: 'HDR.processing_id', label: 'HDR.processing_id - Processing ID (T/D/P)', allowsChildren: false },
        
        // ===== DEV ELEMENTS (Device) =====
        { value: 'DEV.device_id', label: 'DEV.device_id - Device Identifier (EUI-64)', allowsChildren: false },
        { value: 'DEV.device_type', label: 'DEV.device_type - Device Type', allowsChildren: false },
        { value: 'DEV.vendor_id', label: 'DEV.vendor_id - Vendor Identifier', allowsChildren: false },
        { value: 'DEV.manufacturer', label: 'DEV.manufacturer - Manufacturer', allowsChildren: false },
        { value: 'DEV.model', label: 'DEV.model - Model Name', allowsChildren: false },
        { value: 'DEV.model_id', label: 'DEV.model_id - Model Identifier', allowsChildren: false },
        { value: 'DEV.serial_nbr', label: 'DEV.serial_nbr - Serial Number', allowsChildren: false },
        { value: 'DEV.serial_id', label: 'DEV.serial_id - Serial Identifier', allowsChildren: false },
        { value: 'DEV.software_version', label: 'DEV.software_version - Software Version', allowsChildren: false },
        { value: 'DEV.firmware_version', label: 'DEV.firmware_version - Firmware Version', allowsChildren: false },
        { value: 'DEV.condition_cd', label: 'DEV.condition_cd - Device Condition Code', allowsChildren: false },
        
        // ===== OPR ELEMENTS (Operator) =====
        { value: 'OPR.operator_id', label: 'OPR.operator_id - Operator ID', allowsChildren: false },
        { value: 'OPR.operator_name', label: 'OPR.operator_name - Operator Name', allowsChildren: false },
        { value: 'OPR.role_cd', label: 'OPR.role_cd - Role Code', allowsChildren: false },
        { value: 'OPR.permission_level_cd', label: 'OPR.permission_level_cd - Permission Level', allowsChildren: false },
        { value: 'OPR.password', label: 'OPR.password - Password', allowsChildren: false },
        { value: 'OPR.expiration_dttm', label: 'OPR.expiration_dttm - Expiration Date', allowsChildren: false },
        
        // ===== SBJ ELEMENTS (Subject/Patient) =====
        { value: 'SBJ.patient_id', label: 'SBJ.patient_id - Patient ID', allowsChildren: false },
        { value: 'SBJ.patient_name', label: 'SBJ.patient_name - Patient Name', allowsChildren: false },
        { value: 'SBJ.birth_dttm', label: 'SBJ.birth_dttm - Birth Date', allowsChildren: false },
        { value: 'SBJ.gender_cd', label: 'SBJ.gender_cd - Gender Code', allowsChildren: false },
        { value: 'SBJ.location', label: 'SBJ.location - Patient Location', allowsChildren: false },
        { value: 'SBJ.account_nbr', label: 'SBJ.account_nbr - Account Number', allowsChildren: false },
        { value: 'SBJ.medical_record_nbr', label: 'SBJ.medical_record_nbr - Medical Record Number', allowsChildren: false },
        
        // ===== SPC ELEMENTS (Specimen) =====
        { value: 'SPC.specimen_id', label: 'SPC.specimen_id - Specimen ID', allowsChildren: false },
        { value: 'SPC.specimen_type', label: 'SPC.specimen_type - Specimen Type', allowsChildren: false },
        { value: 'SPC.collection_dttm', label: 'SPC.collection_dttm - Collection Date/Time', allowsChildren: false },
        { value: 'SPC.source_cd', label: 'SPC.source_cd - Specimen Source', allowsChildren: false },
        { value: 'SPC.body_site', label: 'SPC.body_site - Body Site', allowsChildren: false },
        { value: 'SPC.action_cd', label: 'SPC.action_cd - Specimen Action Code', allowsChildren: false },
        
        // ===== ORD ELEMENTS (Order) =====
        { value: 'ORD.order_id', label: 'ORD.order_id - Order ID', allowsChildren: false },
        { value: 'ORD.accession_nbr', label: 'ORD.accession_nbr - Accession Number', allowsChildren: false },
        { value: 'ORD.test_cd', label: 'ORD.test_cd - Test Code', allowsChildren: false },
        { value: 'ORD.priority_cd', label: 'ORD.priority_cd - Priority Code', allowsChildren: false },
        { value: 'ORD.order_control', label: 'ORD.order_control - Order Control Code', allowsChildren: false },
        { value: 'ORD.ordering_provider', label: 'ORD.ordering_provider - Ordering Provider', allowsChildren: false },
        
        // ===== OBS ELEMENTS (Observation) =====
        { value: 'OBS.observation_id', label: 'OBS.observation_id - Observation ID', allowsChildren: false },
        { value: 'OBS.value', label: 'OBS.value - Result Value', allowsChildren: false },
        { value: 'OBS.value_type', label: 'OBS.value_type - Value Type (ST/NM/CE)', allowsChildren: false },
        { value: 'OBS.units', label: 'OBS.units - Units', allowsChildren: false },
        { value: 'OBS.observation_dttm', label: 'OBS.observation_dttm - Observation Date/Time', allowsChildren: false },
        { value: 'OBS.method_cd', label: 'OBS.method_cd - Method Code', allowsChildren: false },
        { value: 'OBS.status_cd', label: 'OBS.status_cd - Status Code (F/P/C)', allowsChildren: false },
        { value: 'OBS.reference_range', label: 'OBS.reference_range - Reference Range', allowsChildren: false },
        { value: 'OBS.interpretation_cd', label: 'OBS.interpretation_cd - Interpretation Code', allowsChildren: false },
        { value: 'OBS.abnormal_flag', label: 'OBS.abnormal_flag - Abnormal Flag (H/L/N)', allowsChildren: false },
        { value: 'OBS.loinc_cd', label: 'OBS.loinc_cd - LOINC Code', allowsChildren: false },
        { value: 'OBS.equipment_id', label: 'OBS.equipment_id - Equipment Instance ID', allowsChildren: false },
        { value: 'OBS.responsible_observer', label: 'OBS.responsible_observer - Responsible Observer', allowsChildren: false },
        
        // ===== CTC ELEMENTS (Control/QC) =====
        { value: 'CTC.control_id', label: 'CTC.control_id - Control ID', allowsChildren: false },
        { value: 'CTC.name', label: 'CTC.name - Control Name', allowsChildren: false },
        { value: 'CTC.lot_nbr', label: 'CTC.lot_nbr - Lot Number', allowsChildren: false },
        { value: 'CTC.material_lot_number', label: 'CTC.material_lot_number - Material Lot Number', allowsChildren: false },
        { value: 'CTC.expiration_dttm', label: 'CTC.expiration_dttm - Expiration Date', allowsChildren: false },
        { value: 'CTC.level_cd', label: 'CTC.level_cd - Level Code', allowsChildren: false },
        { value: 'CTC.expected_value', label: 'CTC.expected_value - Expected Value', allowsChildren: false },
        { value: 'CTC.target_range', label: 'CTC.target_range - Target Range', allowsChildren: false },
        { value: 'CTC.manufacturer', label: 'CTC.manufacturer - Manufacturer', allowsChildren: false },
        
        // ===== CAL ELEMENTS (Calibration) =====
        { value: 'CAL.calibration_id', label: 'CAL.calibration_id - Calibration ID', allowsChildren: false },
        { value: 'CAL.calibration_dttm', label: 'CAL.calibration_dttm - Calibration Date/Time', allowsChildren: false },
        { value: 'CAL.lot_nbr', label: 'CAL.lot_nbr - Calibrator Lot Number', allowsChildren: false },
        { value: 'CAL.expiration_dttm', label: 'CAL.expiration_dttm - Expiration Date', allowsChildren: false },
        { value: 'CAL.status_cd', label: 'CAL.status_cd - Calibration Status', allowsChildren: false },
        { value: 'CAL.slope', label: 'CAL.slope - Calibration Slope', allowsChildren: false },
        { value: 'CAL.intercept', label: 'CAL.intercept - Calibration Intercept', allowsChildren: false },
        
        // ===== RGT ELEMENTS (Reagent) =====
        { value: 'RGT.reagent_id', label: 'RGT.reagent_id - Reagent ID', allowsChildren: false },
        { value: 'RGT.name', label: 'RGT.name - Reagent Name', allowsChildren: false },
        { value: 'RGT.lot_nbr', label: 'RGT.lot_nbr - Lot Number', allowsChildren: false },
        { value: 'RGT.expiration_dttm', label: 'RGT.expiration_dttm - Expiration Date', allowsChildren: false },
        { value: 'RGT.quantity', label: 'RGT.quantity - Quantity Remaining', allowsChildren: false },
        { value: 'RGT.manufacturer', label: 'RGT.manufacturer - Manufacturer', allowsChildren: false },
        { value: 'RGT.catalog_nbr', label: 'RGT.catalog_nbr - Catalog Number', allowsChildren: false },
        
        // ===== ENV ELEMENTS (Environment) =====
        { value: 'ENV.temperature', label: 'ENV.temperature - Temperature', allowsChildren: false },
        { value: 'ENV.humidity', label: 'ENV.humidity - Humidity', allowsChildren: false },
        { value: 'ENV.pressure', label: 'ENV.pressure - Atmospheric Pressure', allowsChildren: false },
        
        // ===== STS ELEMENTS (Status) =====
        { value: 'STS.status_cd', label: 'STS.status_cd - Status Code', allowsChildren: false },
        { value: 'STS.status_dttm', label: 'STS.status_dttm - Status Date/Time', allowsChildren: false },
        { value: 'STS.reason_cd', label: 'STS.reason_cd - Reason Code', allowsChildren: false },
        { value: 'STS.condition_cd', label: 'STS.condition_cd - Condition Code (R/B/E)', allowsChildren: false },
        
        // ===== ERR ELEMENTS (Error) =====
        { value: 'ERR.error_cd', label: 'ERR.error_cd - Error Code', allowsChildren: false },
        { value: 'ERR.error_msg', label: 'ERR.error_msg - Error Message', allowsChildren: false },
        { value: 'ERR.severity_cd', label: 'ERR.severity_cd - Severity Code', allowsChildren: false },
        
        // ===== SVC ELEMENTS (Service) =====
        { value: 'SVC.role_cd', label: 'SVC.role_cd - Role Code (PAT/LQC/AQC)', allowsChildren: false },
        { value: 'SVC.observation_dttm', label: 'SVC.observation_dttm - Observation Date/Time', allowsChildren: false },
        { value: 'SVC.status_cd', label: 'SVC.status_cd - Status Code', allowsChildren: false },
        { value: 'SVC.reason_cd', label: 'SVC.reason_cd - Reason Code', allowsChildren: false },
        { value: 'SVC.sequence_nbr', label: 'SVC.sequence_nbr - Sequence Number', allowsChildren: false },
        
        // ===== ACC ELEMENTS (Access Control) =====
        { value: 'ACC.permission_level_cd', label: 'ACC.permission_level_cd - Permission Level Code', allowsChildren: false },
        { value: 'ACC.access_type', label: 'ACC.access_type - Access Type', allowsChildren: false },
        { value: 'ACC.effective_dttm', label: 'ACC.effective_dttm - Effective Date/Time', allowsChildren: false },
        { value: 'ACC.expiration_dttm', label: 'ACC.expiration_dttm - Expiration Date/Time', allowsChildren: false },
        
        // ===== CAP ELEMENTS (Device Capabilities) =====
        { value: 'CAP.max_message_sz', label: 'CAP.max_message_sz - Max Message Size (bytes)', allowsChildren: false },
        { value: 'CAP.supported_topics', label: 'CAP.supported_topics - Supported Topics', allowsChildren: false },
        { value: 'CAP.supported_services', label: 'CAP.supported_services - Supported Services', allowsChildren: false },
        { value: 'CAP.protocol_version', label: 'CAP.protocol_version - Protocol Version', allowsChildren: false },
        
        // ===== TPC ELEMENTS (Topic) =====
        { value: 'TPC.topic_id', label: 'TPC.topic_id - Topic Identifier', allowsChildren: false },
        { value: 'TPC.update_dttm', label: 'TPC.update_dttm - Last Update Date/Time', allowsChildren: false },
        { value: 'TPC.observations_update_dttm', label: 'TPC.observations_update_dttm - Observations Update Time', allowsChildren: false },
        { value: 'TPC.operator_list_update_dttm', label: 'TPC.operator_list_update_dttm - Operator List Update Time', allowsChildren: false },
        { value: 'TPC.patient_list_update_dttm', label: 'TPC.patient_list_update_dttm - Patient List Update Time', allowsChildren: false },
        
        // ===== LST ELEMENTS (List) =====
        { value: 'LST.list_type', label: 'LST.list_type - List Type (OPR/PAT)', allowsChildren: false },
        { value: 'LST.list_id', label: 'LST.list_id - List Identifier', allowsChildren: false },
        { value: 'LST.update_dttm', label: 'LST.update_dttm - Update Date/Time', allowsChildren: false },
        { value: 'LST.item_count', label: 'LST.item_count - Item Count', allowsChildren: false },
        
        // ===== EVT ELEMENTS (Device Event) =====
        { value: 'EVT.event_type', label: 'EVT.event_type - Event Type', allowsChildren: false },
        { value: 'EVT.event_dttm', label: 'EVT.event_dttm - Event Date/Time', allowsChildren: false },
        { value: 'EVT.event_cd', label: 'EVT.event_cd - Event Code', allowsChildren: false },
        { value: 'EVT.event_msg', label: 'EVT.event_msg - Event Message', allowsChildren: false },
        
        // ===== INV ELEMENTS (Inventory) =====
        { value: 'INV.item_id', label: 'INV.item_id - Item Identifier', allowsChildren: false },
        { value: 'INV.item_type', label: 'INV.item_type - Item Type', allowsChildren: false },
        { value: 'INV.quantity', label: 'INV.quantity - Quantity', allowsChildren: false },
        { value: 'INV.status_cd', label: 'INV.status_cd - Inventory Status', allowsChildren: false },
        
        // ===== CFG ELEMENTS (Configuration) =====
        { value: 'CFG.config_id', label: 'CFG.config_id - Configuration ID', allowsChildren: false },
        { value: 'CFG.config_value', label: 'CFG.config_value - Configuration Value', allowsChildren: false },
        { value: 'CFG.config_type', label: 'CFG.config_type - Configuration Type', allowsChildren: false },
        
        // ===== ACT ELEMENTS (Action) =====
        { value: 'ACT.action_id', label: 'ACT.action_id - Action Identifier', allowsChildren: false },
        { value: 'ACT.action_type', label: 'ACT.action_type - Action Type', allowsChildren: false },
        { value: 'ACT.action_dttm', label: 'ACT.action_dttm - Action Date/Time', allowsChildren: false },
        { value: 'ACT.action_status', label: 'ACT.action_status - Action Status', allowsChildren: false },
        
        // ===== NTE ELEMENTS (Note) =====
        { value: 'NTE.text', label: 'NTE.text - Note Text', allowsChildren: false },
        { value: 'NTE.source_cd', label: 'NTE.source_cd - Source Code', allowsChildren: false },
        { value: 'NTE.set_id', label: 'NTE.set_id - Set ID', allowsChildren: false },
        
        // ===== ACK ELEMENTS (Acknowledgment) =====
        { value: 'ACK.ack_cd', label: 'ACK.ack_cd - Acknowledgment Code (AA/AE/AR)', allowsChildren: false },
        { value: 'ACK.message_control_id', label: 'ACK.message_control_id - Referenced Message ID', allowsChildren: false },
        { value: 'ACK.text_message', label: 'ACK.text_message - Text Message', allowsChildren: false },
        { value: 'ACK.error_cd', label: 'ACK.error_cd - Error Code', allowsChildren: false },
        
        // ===== CUSTOM NODE PLACEHOLDER =====
        { value: 'CUSTOM', label: '✏️ Custom Node (Edit name below)', allowsChildren: true, isCustom: true }
    ],
    xml_request: [],
    xml_result: []
};

// ============================================
// Preset Templates
// ============================================
const PRESET_TEMPLATES = {
    astm: {
        'astm_basic_result': {
            name: 'Basic ASTM Result',
            nodes: [
                { id: 'p1', type: 'H', fields: [{ name: 1, value: '1' }, { name: 5, value: 'Analyzer' }], parentId: null },
                { id: 'p2', type: 'P', fields: [{ name: 1, value: '1' }, { name: 3, value: 'PatientID' }], parentId: null },
                { id: 'p3', type: 'O', fields: [{ name: 1, value: '1' }, { name: 3, value: 'SampleID' }], parentId: null },
                { id: 'p4', type: 'R', fields: [{ name: 1, value: '1' }, { name: 3, value: 'TestCode' }, { name: 4, value: '100' }], parentId: null },
                { id: 'p5', type: 'L', fields: [{ name: 1, value: '1' }], parentId: null }
            ]
        }
    },
    hl7: {
        'hl7_oru_r01': {
            name: 'HL7 ORU^R01 Result',
            nodes: [
                { id: 'p1', type: 'MSH', fields: [{ name: 9, value: 'ORU^R01' }, { name: 10, value: 'MSG001' }, { name: 11, value: 'P' }, { name: 12, value: '2.5.1' }], parentId: null },
                { id: 'p2', type: 'PID', fields: [{ name: 3, value: 'PAT001' }, { name: 5, value: 'Doe^John' }], parentId: null },
                { id: 'p3', type: 'OBR', fields: [{ name: 1, value: '1' }, { name: 4, value: 'TEST001^Test Name' }], parentId: null },
                { id: 'p4', type: 'OBX', fields: [{ name: 1, value: '1' }, { name: 2, value: 'NM' }, { name: 3, value: 'TEST001' }, { name: 5, value: '100' }, { name: 6, value: 'mg/dL' }], parentId: null }
            ]
        },
        'hl7_adt_a01': {
            name: 'HL7 ADT^A01 Admission',
            nodes: [
                { id: 'p1', type: 'MSH', fields: [{ name: 9, value: 'ADT^A01' }, { name: 10, value: 'MSG001' }, { name: 11, value: 'P' }, { name: 12, value: '2.5.1' }], parentId: null },
                { id: 'p2', type: 'EVN', fields: [{ name: 1, value: 'A01' }], parentId: null },
                { id: 'p3', type: 'PID', fields: [{ name: 3, value: 'PAT001' }, { name: 5, value: 'Doe^John' }], parentId: null },
                { id: 'p4', type: 'PV1', fields: [{ name: 2, value: 'I' }, { name: 3, value: 'ROOM101' }], parentId: null }
            ]
        }
    },
    poct1a: {
        'poct1a_qc_result': {
            name: 'POCT1-A QC Result (OBS.R02)',
            nodes: [
                { id: 'p1', type: 'OBS.R02', fields: [], parentId: null },
                { id: 'p2', type: 'HDR', fields: [], parentId: 'p1' },
                { id: 'p3', type: 'HDR.control_id', fields: [{ name: 'V', value: 'CTRL001' }], parentId: 'p2' },
                { id: 'p4', type: 'HDR.version_id', fields: [{ name: 'V', value: 'POCT1' }], parentId: 'p2' },
                { id: 'p5', type: 'HDR.creation_dttm', fields: [{ name: 'V', value: '2024-01-01T12:00:00' }], parentId: 'p2' },
                { id: 'p6', type: 'SVC', fields: [], parentId: 'p1' },
                { id: 'p7', type: 'SVC.role_cd', fields: [{ name: 'V', value: 'LQC' }], parentId: 'p6' },
                { id: 'p8', type: 'SVC.observation_dttm', fields: [{ name: 'V', value: '2024-01-01T11:30:00' }], parentId: 'p6' },
                { id: 'p9', type: 'SVC.status_cd', fields: [{ name: 'V', value: 'NRM' }], parentId: 'p6' },
                { id: 'p10', type: 'CTC', fields: [], parentId: 'p6' },
                { id: 'p11', type: 'CTC.name', fields: [{ name: 'V', value: 'Control L1' }], parentId: 'p10' },
                { id: 'p12', type: 'CTC.lot_number', fields: [{ name: 'V', value: '12345' }], parentId: 'p10' },
                { id: 'p13', type: 'OBS', fields: [], parentId: 'p10' },
                { id: 'p14', type: 'OBS.observation_id', fields: [{ name: 'V', value: 'GLU' }, { name: 'SN', value: 'ABT' }], parentId: 'p13' },
                { id: 'p15', type: 'OBS.value', fields: [{ name: 'V', value: '100' }, { name: 'U', value: 'mg/dL' }], parentId: 'p13' },
                { id: 'p16', type: 'OBS.status_cd', fields: [{ name: 'V', value: 'U' }], parentId: 'p13' },
                { id: 'p17', type: 'OPR', fields: [], parentId: 'p6' },
                { id: 'p18', type: 'OPR.operator_id', fields: [{ name: 'V', value: '1001' }], parentId: 'p17' },
                { id: 'p19', type: 'RGT', fields: [], parentId: 'p6' },
                { id: 'p20', type: 'RGT.name', fields: [{ name: 'V', value: 'Cartridge CG4+' }], parentId: 'p19' },
                { id: 'p21', type: 'RGT.lot_number', fields: [{ name: 'V', value: 'M12345' }], parentId: 'p19' }
            ]
        },
        'poct1a_patient_result': {
            name: 'POCT1-A Patient Result (OBS.R01)',
            nodes: [
                { id: 'p1', type: 'OBS.R01', fields: [], parentId: null },
                { id: 'p2', type: 'HDR', fields: [], parentId: 'p1' },
                { id: 'p3', type: 'HDR.control_id', fields: [{ name: 'V', value: 'MSG001' }], parentId: 'p2' },
                { id: 'p4', type: 'HDR.version_id', fields: [{ name: 'V', value: 'POCT1' }], parentId: 'p2' },
                { id: 'p5', type: 'SVC', fields: [], parentId: 'p1' },
                { id: 'p6', type: 'SVC.role_cd', fields: [{ name: 'V', value: 'PAT' }], parentId: 'p5' },
                { id: 'p7', type: 'SBJ', fields: [], parentId: 'p5' },
                { id: 'p8', type: 'OBS', fields: [], parentId: 'p5' },
                { id: 'p9', type: 'OBS.observation_id', fields: [{ name: 'V', value: 'GLU' }], parentId: 'p8' },
                { id: 'p10', type: 'OBS.value', fields: [{ name: 'V', value: '95' }, { name: 'U', value: 'mg/dL' }], parentId: 'p8' }
            ]
        }
    },
    xml_request: {},
    xml_result: {}
};

// ============================================
// Utility Functions
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showFeedback(message, type = 'success') {
    elements.copyFeedback.textContent = message;
    elements.copyFeedback.className = `copy-feedback visible ${type}`;
    setTimeout(() => {
        elements.copyFeedback.classList.remove('visible');
    }, CONFIG.FEEDBACK_DURATION);
}

function isHierarchicalFormat(format) {
    return ['poct1a', 'xml_request', 'xml_result'].includes(format);
}

function getRecordTypes(format) {
    if (format.startsWith('xml_') && state.xsdSchema) {
        return Object.keys(state.xsdSchema).map(key => ({
            value: key,
            label: key,
            allowsChildren: state.xsdSchema[key].children && state.xsdSchema[key].children.length > 0
        }));
    }
    return RECORD_TYPES[format] || [];
}

function getAllowedChildren(format, parentType) {
    if (format.startsWith('xml_') && state.xsdSchema && state.xsdSchema[parentType]) {
        return state.xsdSchema[parentType].children || [];
    }
    if (format === 'poct1a') {
        // Define POCT1-A hierarchy rules
        const poct1aHierarchy = {
            'OBS.R02': ['HDR', 'SVC'],
            'OBS.R01': ['HDR', 'SVC'],
            'ACK.R01': ['HDR', 'SVC'],
            'DOR.R01': ['HDR', 'SVC'],
            'HDR': ['HDR.control_id', 'HDR.version_id', 'HDR.creation_dttm'],
            'SVC': ['SVC.role_cd', 'SVC.observation_dttm', 'SVC.status_cd', 'SVC.reason_cd', 'SVC.sequence_nbr', 'CTC', 'OPR', 'RGT', 'ENV', 'SBJ', 'SPC', 'OBS', 'NTE'],
            'CTC': ['CTC.name', 'CTC.lot_number', 'CTC.expiration_date', 'CTC.level_cd', 'OBS', 'ISC', 'NTE'],
            'OBS': ['OBS.observation_id', 'OBS.value', 'OBS.method_cd', 'OBS.status_cd', 'OBS.normal_lo-hi_limit', 'NTE'],
            'OPR': ['OPR.operator_id'],
            'RGT': ['RGT.name', 'RGT.lot_number', 'RGT.expiration_date'],
            'ENV': [],
            'SBJ': [],
            'SPC': [],
            'DVC': [],
            'NTE': ['NTE.text']
        };
        return poct1aHierarchy[parentType] || RECORD_TYPES.poct1a.filter(t => t.allowsChildren !== false).map(t => t.value);
    }
    return [];
}

function getNodeById(nodeId) {
    return state.nodes.find(n => n.id === nodeId);
}

function getChildNodes(parentId) {
    return state.nodes.filter(n => n.parentId === parentId);
}

function getRootNodes() {
    return state.nodes.filter(n => n.parentId === null);
}

function getNodeDepth(nodeId) {
    let depth = 0;
    let node = getNodeById(nodeId);
    while (node && node.parentId) {
        depth++;
        node = getNodeById(node.parentId);
    }
    return depth;
}

function getNodeDescendants(nodeId) {
    const descendants = [];
    const children = getChildNodes(nodeId);
    for (const child of children) {
        descendants.push(child);
        descendants.push(...getNodeDescendants(child.id));
    }
    return descendants;
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ============================================
// State Management (Undo/Redo)
// ============================================
function saveStateForUndo() {
    const snapshot = deepClone(state.nodes);
    state.undoStack.push(snapshot);
    if (state.undoStack.length > CONFIG.MAX_UNDO_STACK) {
        state.undoStack.shift();
    }
    state.redoStack = [];
    updateUndoRedoButtons();
    markUnsavedChanges();
}

function undo() {
    if (state.undoStack.length === 0) return;
    const currentState = deepClone(state.nodes);
    state.redoStack.push(currentState);
    state.nodes = state.undoStack.pop();
    renderTree();
    updatePropertiesSidebar();
    updateOutput();
    updateUndoRedoButtons();
}

function redo() {
    if (state.redoStack.length === 0) return;
    const currentState = deepClone(state.nodes);
    state.undoStack.push(currentState);
    state.nodes = state.redoStack.pop();
    renderTree();
    updatePropertiesSidebar();
    updateOutput();
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    elements.undoBtn.disabled = state.undoStack.length === 0;
    elements.redoBtn.disabled = state.redoStack.length === 0;
}

function markUnsavedChanges() {
    state.hasUnsavedChanges = true;
    elements.unsavedIndicator.classList.remove('hidden');
}

function clearUnsavedChanges() {
    state.hasUnsavedChanges = false;
    elements.unsavedIndicator.classList.add('hidden');
}

// ============================================
// Node Management
// ============================================
function addNode(parentId = null, type = null, fields = [], insertAfterId = null) {
    saveStateForUndo();
    
    const format = state.currentFormat;
    const recordTypes = getRecordTypes(format);
    
    // For POCT1-A, root nodes should be message types (OBS.R02, etc.)
    let defaultType = type;
    if (!defaultType) {
        if (format === 'poct1a' && parentId === null) {
            // For root nodes, use message types only
            const rootTypes = recordTypes.filter(t => t.isRoot);
            defaultType = rootTypes[0]?.value || recordTypes[0]?.value || 'Element';
        } else if (format === 'poct1a' && parentId) {
            // For child nodes, get allowed children
            const parentNode = getNodeById(parentId);
            const allowedChildren = getAllowedChildren(format, parentNode?.type);
            defaultType = allowedChildren[0] || recordTypes[0]?.value || 'Element';
        } else {
            defaultType = recordTypes[0]?.value || 'Element';
        }
    }
    
    const newNode = {
        id: generateNodeId(),
        type: defaultType,
        fields: fields.length > 0 ? fields : [],
        parentId: parentId,
        expanded: true
    };
    
    if (insertAfterId) {
        const insertIndex = state.nodes.findIndex(n => n.id === insertAfterId);
        if (insertIndex !== -1) {
            state.nodes.splice(insertIndex + 1, 0, newNode);
        } else {
            state.nodes.push(newNode);
        }
    } else {
        state.nodes.push(newNode);
    }
    
    renderTree();
    selectNode(newNode.id);
    updateOutput();
    
    return newNode;
}

function addChildNode(parentId) {
    const format = state.currentFormat;
    if (!isHierarchicalFormat(format)) {
        showFeedback('Child nodes only available for hierarchical formats', 'error');
        return;
    }
    
    const parentNode = getNodeById(parentId);
    if (!parentNode) return;
    
    const allowedChildren = getAllowedChildren(format, parentNode.type);
    if (allowedChildren.length === 0 && format.startsWith('xml_')) {
        showFeedback('This element cannot have children', 'error');
        return;
    }
    
    const childType = allowedChildren[0] || getRecordTypes(format)[0]?.value;
    addNode(parentId, childType);
    
    // Ensure parent is expanded
    parentNode.expanded = true;
    const parentEl = document.querySelector(`[data-node-id="${parentId}"]`);
    if (parentEl) {
        parentEl.classList.remove('collapsed');
    }
}

function deleteNode(nodeId) {
    const node = getNodeById(nodeId);
    if (!node) return;
    
    saveStateForUndo();
    
    // Get all descendants to delete
    const descendants = getNodeDescendants(nodeId);
    const idsToDelete = [nodeId, ...descendants.map(d => d.id)];
    
    // Remove nodes
    state.nodes = state.nodes.filter(n => !idsToDelete.includes(n.id));
    
    // Clear selection if deleted node was selected
    if (state.selectedNodeId && idsToDelete.includes(state.selectedNodeId)) {
        state.selectedNodeId = null;
    }
    
    renderTree();
    updatePropertiesSidebar();
    updateOutput();
}

function duplicateNode(nodeId) {
    const node = getNodeById(nodeId);
    if (!node) return;
    
    saveStateForUndo();
    
    // Clone node and descendants
    const cloneNodeTree = (originalId, newParentId) => {
        const original = getNodeById(originalId);
        const clonedNode = {
            id: generateNodeId(),
            type: original.type,
            fields: deepClone(original.fields),
            parentId: newParentId,
            expanded: original.expanded
        };
        state.nodes.push(clonedNode);
        
        // Clone children
        const children = getChildNodes(originalId);
        for (const child of children) {
            cloneNodeTree(child.id, clonedNode.id);
        }
        
        return clonedNode;
    };
    
    const cloned = cloneNodeTree(nodeId, node.parentId);
    renderTree();
    selectNode(cloned.id);
    updateOutput();
    showFeedback('Node duplicated');
}

function moveNode(nodeId, direction) {
    const node = getNodeById(nodeId);
    if (!node) return;
    
    const siblings = node.parentId 
        ? getChildNodes(node.parentId) 
        : getRootNodes();
    
    const currentIndex = siblings.findIndex(s => s.id === nodeId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= siblings.length) return;
    
    saveStateForUndo();
    
    // Find actual indices in the main array
    const nodeArrayIndex = state.nodes.findIndex(n => n.id === nodeId);
    const targetNode = siblings[newIndex];
    const targetArrayIndex = state.nodes.findIndex(n => n.id === targetNode.id);
    
    // Swap in the main array
    [state.nodes[nodeArrayIndex], state.nodes[targetArrayIndex]] = 
    [state.nodes[targetArrayIndex], state.nodes[nodeArrayIndex]];
    
    renderTree();
    updateOutput();
}

function copyNode(nodeId) {
    const node = getNodeById(nodeId);
    if (!node) return;
    
    // Copy node and all descendants
    const copyNodeTree = (originalId) => {
        const original = getNodeById(originalId);
        const copied = {
            type: original.type,
            fields: deepClone(original.fields),
            expanded: original.expanded,
            children: []
        };
        
        const children = getChildNodes(originalId);
        for (const child of children) {
            copied.children.push(copyNodeTree(child.id));
        }
        
        return copied;
    };
    
    state.clipboard = copyNodeTree(nodeId);
    elements.pasteNodeBtn.disabled = false;
    showFeedback('Node copied to clipboard');
}

function pasteNode(targetParentId = null) {
    if (!state.clipboard) return;
    
    saveStateForUndo();
    
    const pasteNodeTree = (nodeData, parentId) => {
        const newNode = {
            id: generateNodeId(),
            type: nodeData.type,
            fields: deepClone(nodeData.fields),
            parentId: parentId,
            expanded: nodeData.expanded
        };
        state.nodes.push(newNode);
        
        for (const childData of nodeData.children || []) {
            pasteNodeTree(childData, newNode.id);
        }
        
        return newNode;
    };
    
    const pasted = pasteNodeTree(state.clipboard, targetParentId);
    renderTree();
    selectNode(pasted.id);
    updateOutput();
    showFeedback('Node pasted');
}

function selectNode(nodeId) {
    // Deselect previous
    document.querySelectorAll('.tree-node.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    state.selectedNodeId = nodeId;
    
    if (nodeId) {
        const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeEl) {
            nodeEl.classList.add('selected');
            nodeEl.focus();
        }
        elements.addChildBtn.disabled = !isHierarchicalFormat(state.currentFormat);
    } else {
        elements.addChildBtn.disabled = true;
    }
    
    updatePropertiesSidebar();
}

function updateNodeType(nodeId, newType) {
    const node = getNodeById(nodeId);
    if (!node) return;
    
    // Handle custom node type for POCT1-A
    if (state.currentFormat === 'poct1a' && newType === 'CUSTOM') {
        // Show custom name input
        elements.customNodeNameGroup.classList.remove('hidden');
        elements.customNodeNameInput.value = node.customTypeName || '';
        elements.customNodeNameInput.focus();
        return; // Don't update type yet, wait for custom name input
    }
    
    // Hide custom name input for non-custom types
    if (elements.customNodeNameGroup) {
        elements.customNodeNameGroup.classList.add('hidden');
    }
    
    if (node.type === newType) return;
    
    saveStateForUndo();
    node.type = newType;
    node.customTypeName = null; // Clear custom name when switching to standard type
    
    // Update tree display
    const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeEl) {
        const badge = nodeEl.querySelector('.node-type-badge');
        if (badge) badge.textContent = newType;
    }
    
    updateOutput();
}

function updateCustomNodeType(nodeId, customName) {
    const node = getNodeById(nodeId);
    if (!node || !customName.trim()) return;
    
    saveStateForUndo();
    node.type = customName.trim();
    node.customTypeName = customName.trim();
    
    // Update tree display
    const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeEl) {
        const badge = nodeEl.querySelector('.node-type-badge');
        if (badge) badge.textContent = customName.trim();
    }
    
    // Update dropdown to show custom option
    const customOption = Array.from(elements.nodeTypeSelect.options).find(opt => opt.value === 'CUSTOM');
    if (customOption) customOption.selected = true;
    
    updateOutput();
}

function updateNodeField(nodeId, fieldIndex, fieldName, fieldValue) {
    const node = getNodeById(nodeId);
    if (!node) return;
    
    if (!node.fields[fieldIndex]) {
        node.fields[fieldIndex] = {};
    }
    
    node.fields[fieldIndex].name = fieldName;
    node.fields[fieldIndex].value = fieldValue;
    
    // Update preview in tree
    updateNodePreview(nodeId);
    updateOutputDebounced();
}

function updateNodePreview(nodeId) {
    const node = getNodeById(nodeId);
    if (!node) return;
    
    const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (!nodeEl) return;
    
    const preview = nodeEl.querySelector('.node-preview');
    if (!preview) return;
    
    // Build preview based on format - show like the output
    const format = state.currentFormat;
    let previewText = '';
    
    if (format === 'astm' || format === 'hl7') {
        // For ASTM/HL7, show fields joined by | like the actual output
        const fields = buildFieldArray(node.fields);
        previewText = fields.join('|');
    } else {
        // For XML formats, show attribute=value pairs
        const previewFields = node.fields.slice(0, 3)
            .filter(f => f.value)
            .map(f => `${f.name}="${f.value}"`);
        previewText = previewFields.join(' ');
    }
    
    preview.textContent = previewText;
}

// ============================================
// Tree Rendering
// ============================================
function renderTree() {
    // Destroy existing sortable instances
    state.sortableInstances.forEach(instance => instance.destroy());
    state.sortableInstances = [];
    
    // Clear tree container except empty state
    const children = Array.from(elements.treeContainer.children);
    children.forEach(child => {
        if (child.id !== 'tree-empty-state') {
            child.remove();
        }
    });
    
    const rootNodes = getRootNodes();
    
    // Show/hide empty state
    elements.treeEmptyState.style.display = rootNodes.length === 0 ? 'flex' : 'none';
    
    // Render root nodes
    rootNodes.forEach(node => {
        const nodeEl = createNodeElement(node);
        elements.treeContainer.appendChild(nodeEl);
    });
    
    // Initialize sortable for root level
    initSortable(elements.treeContainer, null);
    
    // Update button states
    elements.addChildBtn.disabled = !state.selectedNodeId || !isHierarchicalFormat(state.currentFormat);
}

function createNodeElement(node) {
    const template = elements.treeNodeTemplate.content.cloneNode(true);
    const nodeEl = template.querySelector('.tree-node');
    
    nodeEl.dataset.nodeId = node.id;
    nodeEl.setAttribute('aria-expanded', node.expanded !== false);
    
    // Set type badge
    const badge = nodeEl.querySelector('.node-type-badge');
    badge.textContent = node.type;
    
    // Set preview based on format - show like the output
    const preview = nodeEl.querySelector('.node-preview');
    const format = state.currentFormat;
    let previewText = '';
    
    if (format === 'astm' || format === 'hl7') {
        // For ASTM/HL7, show fields joined by | like the actual output
        const fields = buildFieldArray(node.fields);
        previewText = fields.join('|');
    } else {
        // For XML formats, show attribute=value pairs
        const previewFields = node.fields.slice(0, 3)
            .filter(f => f.value)
            .map(f => `${f.name}="${f.value}"`);
        previewText = previewFields.join(' ');
    }
    preview.textContent = previewText;
    
    // Handle children
    const childrenContainer = nodeEl.querySelector('.node-children');
    const children = getChildNodes(node.id);
    
    if (children.length === 0) {
        nodeEl.classList.add('no-children');
    } else {
        children.forEach(child => {
            const childEl = createNodeElement(child);
            childrenContainer.appendChild(childEl);
        });
        
        // Initialize sortable for this children container
        if (isHierarchicalFormat(state.currentFormat)) {
            initSortable(childrenContainer, node.id);
        }
    }
    
    // Handle collapsed state
    if (node.expanded === false) {
        nodeEl.classList.add('collapsed');
    }
    
    // Handle selection
    if (node.id === state.selectedNodeId) {
        nodeEl.classList.add('selected');
    }
    
    // Event listeners
    setupNodeEventListeners(nodeEl, node.id);
    
    return nodeEl;
}

function setupNodeEventListeners(nodeEl, nodeId) {
    const nodeRow = nodeEl.querySelector('.node-row');
    const toggle = nodeEl.querySelector('.node-toggle');
    const addChildBtn = nodeEl.querySelector('.add-child-inline');
    const deleteBtn = nodeEl.querySelector('.delete-node-inline');
    
    // Click to select
    nodeRow.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            selectNode(nodeId);
        }
    });
    
    // Double click to toggle expand
    nodeRow.addEventListener('dblclick', (e) => {
        if (!e.target.closest('button')) {
            toggleNodeExpand(nodeId);
        }
    });
    
    // Toggle expand/collapse
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNodeExpand(nodeId);
    });
    
    // Add child button
    addChildBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addChildNode(nodeId);
    });
    
    // Delete button
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNode(nodeId);
    });
    
    // Keyboard navigation
    nodeEl.addEventListener('keydown', (e) => {
        handleNodeKeydown(e, nodeId);
    });
}

function toggleNodeExpand(nodeId) {
    const node = getNodeById(nodeId);
    if (!node) return;
    
    node.expanded = !node.expanded;
    
    const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (nodeEl) {
        nodeEl.classList.toggle('collapsed', !node.expanded);
        nodeEl.setAttribute('aria-expanded', node.expanded);
    }
}

function expandAllNodes() {
    state.nodes.forEach(node => node.expanded = true);
    document.querySelectorAll('.tree-node').forEach(el => {
        el.classList.remove('collapsed');
        el.setAttribute('aria-expanded', 'true');
    });
}

function collapseAllNodes() {
    state.nodes.forEach(node => node.expanded = false);
    document.querySelectorAll('.tree-node').forEach(el => {
        el.classList.add('collapsed');
        el.setAttribute('aria-expanded', 'false');
    });
}

function handleNodeKeydown(e, nodeId) {
    const node = getNodeById(nodeId);
    if (!node) return;
    
    switch (e.key) {
        case 'ArrowUp':
            e.preventDefault();
            navigateToSibling(nodeId, -1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            navigateToSibling(nodeId, 1);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (node.expanded && getChildNodes(nodeId).length > 0) {
                toggleNodeExpand(nodeId);
            } else if (node.parentId) {
                selectNode(node.parentId);
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (!node.expanded && getChildNodes(nodeId).length > 0) {
                toggleNodeExpand(nodeId);
            } else {
                const children = getChildNodes(nodeId);
                if (children.length > 0) {
                    selectNode(children[0].id);
                }
            }
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            toggleNodeExpand(nodeId);
            break;
        case 'Delete':
            e.preventDefault();
            deleteNode(nodeId);
            break;
    }
}

function navigateToSibling(nodeId, direction) {
    const node = getNodeById(nodeId);
    const siblings = node.parentId ? getChildNodes(node.parentId) : getRootNodes();
    const currentIndex = siblings.findIndex(s => s.id === nodeId);
    const newIndex = currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < siblings.length) {
        selectNode(siblings[newIndex].id);
    }
}

// ============================================
// Drag & Drop (Sortable)
// ============================================
function initSortable(container, parentId) {
    if (!container) return;
    
    const sortable = new Sortable(container, {
        group: 'tree-nodes',
        animation: 150,
        handle: '.node-drag-handle',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        fallbackOnBody: true,
        swapThreshold: 0.65,
        
        onStart: (evt) => {
            document.body.classList.add('is-dragging');
        },
        
        onEnd: (evt) => {
            document.body.classList.remove('is-dragging');
            
            const nodeId = evt.item.dataset.nodeId;
            const fromContainer = evt.from;
            const toContainer = evt.to;
            
            const oldParentId = fromContainer === elements.treeContainer 
                ? null 
                : fromContainer.closest('.tree-node')?.dataset.nodeId || null;
            const newParentId = toContainer === elements.treeContainer 
                ? null 
                : toContainer.closest('.tree-node')?.dataset.nodeId || null;
            
            handleNodeDrop(nodeId, oldParentId, newParentId, evt.oldIndex, evt.newIndex);
        }
    });
    
    state.sortableInstances.push(sortable);
}

function handleNodeDrop(nodeId, oldParentId, newParentId, oldIndex, newIndex) {
    const node = getNodeById(nodeId);
    if (!node) return;
    
    // If nothing changed, do nothing
    if (oldParentId === newParentId && oldIndex === newIndex) {
        return;
    }
    
    // Prevent dropping a node into its own descendants
    if (newParentId) {
        const descendants = getNodeDescendants(nodeId);
        if (descendants.some(d => d.id === newParentId)) {
            renderTree(); // Revert
            showFeedback('Cannot drop a node into its own children', 'error');
            return;
        }
    }
    
    saveStateForUndo();
    
    // Update parent reference
    node.parentId = newParentId;
    
    // Rebuild state.nodes array based on current DOM order
    rebuildNodesFromDOM();
    
    renderTree();
    selectNode(nodeId);
    updateOutput();
}

function rebuildNodesFromDOM() {
    const newNodes = [];
    
    function processContainer(container, parentId) {
        const nodeElements = container.querySelectorAll(':scope > .tree-node');
        nodeElements.forEach(el => {
            const nodeId = el.dataset.nodeId;
            const node = getNodeById(nodeId);
            if (node) {
                node.parentId = parentId;
                newNodes.push(node);
                
                const childrenContainer = el.querySelector(':scope > .node-children');
                if (childrenContainer) {
                    processContainer(childrenContainer, nodeId);
                }
            }
        });
    }
    
    processContainer(elements.treeContainer, null);
    state.nodes = newNodes;
}

// ============================================
// Properties Sidebar
// ============================================
function updatePropertiesSidebar() {
    const node = getNodeById(state.selectedNodeId);
    
    if (!node) {
        elements.propertiesEmpty.classList.remove('hidden');
        elements.propertiesForm.classList.add('hidden');
        return;
    }
    
    elements.propertiesEmpty.classList.add('hidden');
    elements.propertiesForm.classList.remove('hidden');
    
    // Update type selector
    populateTypeSelector(node);
    
    // Update fields
    renderFields(node);
}

function populateTypeSelector(node) {
    const format = state.currentFormat;
    let recordTypes = getRecordTypes(format);
    
    // For POCT1-A, filter based on context but always keep CUSTOM option
    if (format === 'poct1a') {
        if (!node.parentId) {
            // Root nodes should only show message types plus CUSTOM
            recordTypes = recordTypes.filter(t => t.isRoot || t.isCustom);
        } else {
            // Child nodes should show allowed children plus CUSTOM
            const parent = getNodeById(node.parentId);
            if (parent) {
                const allowedChildren = getAllowedChildren(format, parent.type);
                if (allowedChildren.length > 0) {
                    recordTypes = recordTypes.filter(t => allowedChildren.includes(t.value) || t.isCustom);
                } else {
                    // If no specific allowed children, show all non-root types plus CUSTOM
                    recordTypes = recordTypes.filter(t => !t.isRoot || t.isCustom);
                }
            }
        }
    } else if (node.parentId && isHierarchicalFormat(format)) {
        // Filter by allowed children if node has parent
        const parent = getNodeById(node.parentId);
        if (parent) {
            const allowedChildren = getAllowedChildren(format, parent.type);
            if (allowedChildren.length > 0) {
                recordTypes = recordTypes.filter(t => allowedChildren.includes(t.value));
            }
        }
    }
    
    elements.nodeTypeSelect.innerHTML = '';
    recordTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        option.selected = type.value === node.type || (type.value === 'CUSTOM' && node.customTypeName);
        elements.nodeTypeSelect.appendChild(option);
    });
    
    // If current type not in list, add it (for backwards compatibility)
    if (!recordTypes.some(t => t.value === node.type) && !node.customTypeName) {
        const option = document.createElement('option');
        option.value = node.type;
        option.textContent = node.type;
        option.selected = true;
        elements.nodeTypeSelect.insertBefore(option, elements.nodeTypeSelect.firstChild);
    }
    
    // Handle custom node name input visibility for POCT1-A
    if (format === 'poct1a' && node.customTypeName) {
        elements.customNodeNameGroup.classList.remove('hidden');
        elements.customNodeNameInput.value = node.customTypeName;
    } else {
        elements.customNodeNameGroup.classList.add('hidden');
        elements.customNodeNameInput.value = '';
    }
}

function renderFields(node) {
    elements.fieldsContainer.innerHTML = '';
    
    node.fields.forEach((field, index) => {
        const fieldEl = createFieldElement(node.id, index, field);
        elements.fieldsContainer.appendChild(fieldEl);
    });
    
    // If no fields, add an empty one
    if (node.fields.length === 0) {
        addFieldToNode(node.id);
    }
}

function createFieldElement(nodeId, fieldIndex, field) {
    const template = elements.fieldTemplate.content.cloneNode(true);
    const fieldRow = template.querySelector('.field-row');
    
    const numericInput = fieldRow.querySelector('.field-name-numeric');
    const textInput = fieldRow.querySelector('.field-name-text');
    const selectInput = fieldRow.querySelector('.field-name-select');
    const valueInput = fieldRow.querySelector('.field-value-input');
    const timestampBtn = fieldRow.querySelector('.timestamp-btn');
    const removeBtn = fieldRow.querySelector('.remove-field-btn');
    
    const format = state.currentFormat;
    const isXml = format.startsWith('xml_') || format === 'poct1a';
    
    // Configure field name input based on format
    if (isXml) {
        numericInput.classList.add('hidden');
        textInput.classList.remove('hidden');
        textInput.value = field.name || '@';
        textInput.placeholder = '@attr or text()';
        
        textInput.addEventListener('input', debounce(() => {
            updateNodeField(nodeId, fieldIndex, textInput.value, valueInput.value);
            markUnsavedChanges();
        }, CONFIG.DEBOUNCE_DELAY));
    } else {
        numericInput.value = field.name || '';
        
        numericInput.addEventListener('input', debounce(() => {
            const numValue = parseInt(numericInput.value) || 1;
            updateNodeField(nodeId, fieldIndex, numValue, valueInput.value);
            markUnsavedChanges();
        }, CONFIG.DEBOUNCE_DELAY));
    }
    
    // Value input
    valueInput.value = field.value || '';
    valueInput.addEventListener('input', debounce(() => {
        const nameValue = isXml ? textInput.value : (parseInt(numericInput.value) || 1);
        updateNodeField(nodeId, fieldIndex, nameValue, valueInput.value);
        markUnsavedChanges();
    }, CONFIG.DEBOUNCE_DELAY));
    
    // Timestamp button (show for date fields)
    const isDateField = String(field.name).toLowerCase().includes('date') || 
                        String(field.name).toLowerCase().includes('time') ||
                        [7, 14].includes(field.name); // Common date field positions
    if (isDateField) {
        timestampBtn.classList.remove('hidden');
        timestampBtn.addEventListener('click', () => {
            const now = new Date();
            const timestamp = now.toISOString().replace(/[-:]/g, '').replace('T', '').split('.')[0];
            valueInput.value = timestamp;
            const nameValue = isXml ? textInput.value : (parseInt(numericInput.value) || 1);
            updateNodeField(nodeId, fieldIndex, nameValue, timestamp);
            markUnsavedChanges();
        });
    }
    
    // Remove button
    removeBtn.addEventListener('click', () => {
        removeFieldFromNode(nodeId, fieldIndex);
    });
    
    return fieldRow;
}

function addFieldToNode(nodeId) {
    const node = getNodeById(nodeId);
    if (!node) return;
    
    const format = state.currentFormat;
    const isXml = format.startsWith('xml_') || format === 'poct1a';
    
    const newField = {
        name: isXml ? '@' : (node.fields.length + 1),
        value: ''
    };
    
    node.fields.push(newField);
    renderFields(node);
    markUnsavedChanges();
    
    // Focus the new field
    const lastField = elements.fieldsContainer.lastElementChild;
    if (lastField) {
        const valueInput = lastField.querySelector('.field-value-input');
        valueInput?.focus();
    }
}

function removeFieldFromNode(nodeId, fieldIndex) {
    const node = getNodeById(nodeId);
    if (!node) return;
    
    saveStateForUndo();
    node.fields.splice(fieldIndex, 1);
    renderFields(node);
    updateNodePreview(nodeId);
    updateOutput();
}

function toggleSidebar() {
    elements.propertiesSidebar.classList.toggle('collapsed');
    const isCollapsed = elements.propertiesSidebar.classList.contains('collapsed');
    localStorage.setItem(CONFIG.STORAGE_KEYS.SIDEBAR_STATE, isCollapsed ? 'collapsed' : 'open');
}
// ============================================
// Output Generation
// ============================================
const updateOutputDebounced = debounce(updateOutput, CONFIG.DEBOUNCE_DELAY);

function updateOutput() {
    const format = state.currentFormat;
    const output = buildMessage(format);
    const highlighted = highlightSyntax(output, format);
    
    elements.outputHighlighted.innerHTML = highlighted;
    elements.outputFormatBadge.textContent = format.toUpperCase().replace('_', ' ');
}

function buildMessage(format) {
    const rootNodes = getRootNodes();
    
    switch (format) {
        case 'astm':
            return buildAstmMessage(rootNodes);
        case 'hl7':
            return buildHl7Message(rootNodes);
        case 'poct1a':
            return buildPoct1aMessage(rootNodes);
        case 'xml_request':
        case 'xml_result':
            return buildXmlMessage(rootNodes, format);
        default:
            return '';
    }
}

function buildAstmMessage(nodes) {
    const lines = [];
    
    nodes.forEach(node => {
        const fields = buildFieldArray(node.fields);
        const line = `${node.type}|${fields.join('|')}`;
        lines.push(line);
    });
    
    return lines.join('\n');
}

function buildHl7Message(nodes) {
    const lines = [];
    
    nodes.forEach(node => {
        const fields = buildFieldArray(node.fields);
        if (node.type === 'MSH') {
            // MSH has special handling - field 1 is |, field 2 is ^~\&
            // So user fields start at position 3
            lines.push(`MSH|^~\\&|${fields.slice(2).join('|')}`);
        } else {
            lines.push(`${node.type}|${fields.join('|')}`);
        }
    });
    
    return lines.join('\r\n');
}

function buildPoct1aMessage(nodes) {
    const buildNodeXml = (node, indent = 0) => {
        const pad = '  '.repeat(indent);
        
        // Build attributes from fields (V, U, SN, SV, DN, NULL, etc.)
        const attrs = node.fields
            .map(f => `${f.name}="${escapeXml(f.value)}"`)
            .join(' ');
        
        const children = getChildNodes(node.id);
        
        // If no children and has attributes, use self-closing with attributes
        if (children.length === 0) {
            if (attrs) {
                return `${pad}<${node.type} ${attrs}/>`;
            } else {
                return `${pad}<${node.type}/>`;
            }
        }
        
        // Has children
        let xml = `${pad}<${node.type}${attrs ? ' ' + attrs : ''}>`;
        xml += '\n';
        children.forEach(child => {
            xml += buildNodeXml(child, indent + 1) + '\n';
        });
        xml += `${pad}</${node.type}>`;
        
        return xml;
    };
    
    let output = '<?xml version="1.0" encoding="utf-8" ?>\n';
    
    // Build from root nodes (should be message type like OBS.R02)
    nodes.forEach(node => {
        output += buildNodeXml(node, 0) + '\n';
    });
    
    return output.trim();
}

function buildXmlMessage(nodes, format) {
    const rootElement = format === 'xml_request' ? 'Request' : 'Result';
    
    const buildNodeXml = (node, indent = 0) => {
        const pad = '  '.repeat(indent);
        const attrs = node.fields
            .filter(f => String(f.name).startsWith('@'))
            .map(f => `${f.name.substring(1)}="${escapeXml(f.value)}"`)
            .join(' ');
        
        const textContent = node.fields.find(f => f.name === 'text()')?.value || '';
        const children = getChildNodes(node.id);
        
        if (children.length === 0 && !textContent) {
            return `${pad}<${node.type}${attrs ? ' ' + attrs : ''}/>`;
        }
        
        let xml = `${pad}<${node.type}${attrs ? ' ' + attrs : ''}>`;
        
        if (textContent) {
            xml += escapeXml(textContent);
        }
        
        if (children.length > 0) {
            xml += '\n';
            children.forEach(child => {
                xml += buildNodeXml(child, indent + 1) + '\n';
            });
            xml += `${pad}</${node.type}>`;
        } else {
            xml += `</${node.type}>`;
        }
        
        return xml;
    };
    
    let output = '<?xml version="1.0" encoding="UTF-8"?>\n';
    output += `<${rootElement}>\n`;
    
    nodes.forEach(node => {
        output += buildNodeXml(node, 1) + '\n';
    });
    
    output += `</${rootElement}>`;
    return output;
}

function buildFieldArray(fields) {
    if (fields.length === 0) return [];
    
    // Find the maximum field position
    let maxIndex = 0;
    fields.forEach(field => {
        const index = parseInt(field.name);
        if (!isNaN(index) && index > maxIndex) {
            maxIndex = index;
        }
    });
    
    if (maxIndex === 0) return [];
    
    // Create array only up to the last defined field
    const result = new Array(maxIndex).fill('');
    fields.forEach(field => {
        const index = parseInt(field.name) - 1;
        if (index >= 0 && index < maxIndex) {
            result[index] = field.value || '';
        }
    });
    return result;
}

function escapeXml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// ============================================
// Syntax Highlighting
// ============================================
function highlightSyntax(text, format) {
    if (!text) return '';
    
    switch (format) {
        case 'astm':
            return highlightAstm(text);
        case 'hl7':
            return highlightHl7(text);
        case 'poct1a':
        case 'xml_request':
        case 'xml_result':
            return highlightXml(text);
        default:
            return escapeHtml(text);
    }
}

function highlightAstm(text) {
    return text.split('\n').map(line => {
        // Escape HTML first
        line = escapeHtml(line);
        
        // Highlight frame characters
        line = line.replace(/&lt;STX&gt;/g, '<span class="hl-frame">&lt;STX&gt;</span>');
        line = line.replace(/&lt;ETX&gt;/g, '<span class="hl-frame">&lt;ETX&gt;</span>');
        line = line.replace(/&lt;CR&gt;/g, '<span class="hl-cr">&lt;CR&gt;</span>');
        
        // Highlight record type (after STX)
        line = line.replace(/(<span class="hl-frame">&lt;STX&gt;<\/span>)([A-Z])/g, 
            '$1<span class="hl-record-type">$2</span>');
        
        // Highlight delimiters and fields
        const parts = line.split('|');
        if (parts.length > 1) {
            line = parts.map((part, i) => {
                if (i === 0) return part;
                if (part.includes('<span')) return '<span class="hl-delimiter">|</span>' + part;
                return '<span class="hl-delimiter">|</span><span class="hl-field-value">' + part + '</span>';
            }).join('');
        }
        
        return line;
    }).join('\n');
}

function highlightHl7(text) {
    return text.split('\n').map(line => {
        if (!line.trim()) return line;
        
        const parts = line.split('|');
        const segmentType = parts[0];
        
        let result = `<span class="hl-record-type">${escapeHtml(segmentType)}</span>`;
        
        for (let i = 1; i < parts.length; i++) {
            result += '<span class="hl-delimiter">|</span>';
            const fieldValue = parts[i];
            if (fieldValue) {
                if (fieldValue.includes('^')) {
                    result += fieldValue.split('^').map(comp => 
                        `<span class="hl-field-value">${escapeHtml(comp)}</span>`
                    ).join('<span class="hl-delimiter">^</span>');
                } else {
                    result += `<span class="hl-field-value">${escapeHtml(fieldValue)}</span>`;
                }
            }
        }
        
        return result;
    }).join('\n');
}

function highlightXml(text) {
    let result = escapeHtml(text);
    
    // XML declaration
    result = result.replace(/(&lt;\?xml[^?]*\?&gt;)/g, '<span class="hl-comment">$1</span>');
    
    // Self-closing tags with attributes: <Tag attr="value"/>
    result = result.replace(/(&lt;)([\w\.\-:]+)((?:\s+[\w\.\-:]+="[^"]*")*)(\s*\/&gt;)/g, (match, open, tag, attrs, close) => {
        let highlightedAttrs = '';
        if (attrs) {
            highlightedAttrs = attrs.replace(/([\w\.\-:]+)="([^"]*)"/g, 
                ' <span class="hl-attr">$1</span>=<span class="hl-attr-value">"$2"</span>');
        }
        return `<span class="hl-delimiter">${open}</span><span class="hl-tag">${tag}</span>${highlightedAttrs}<span class="hl-delimiter">${close}</span>`;
    });
    
    // Opening tags with attributes: <Tag attr="value">
    result = result.replace(/(&lt;)([\w\.\-:]+)((?:\s+[\w\.\-:]+="[^"]*")*)(&gt;)/g, (match, open, tag, attrs, close) => {
        let highlightedAttrs = '';
        if (attrs) {
            highlightedAttrs = attrs.replace(/([\w\.\-:]+)="([^"]*)"/g, 
                ' <span class="hl-attr">$1</span>=<span class="hl-attr-value">"$2"</span>');
        }
        return `<span class="hl-delimiter">${open}</span><span class="hl-tag">${tag}</span>${highlightedAttrs}<span class="hl-delimiter">${close}</span>`;
    });
    
    // Closing tags: </Tag>
    result = result.replace(/(&lt;\/)([\w\.\-:]+)(&gt;)/g, 
        '<span class="hl-delimiter">$1</span><span class="hl-tag">$2</span><span class="hl-delimiter">$3</span>');
    
    // Text content between tags (anything not inside a span already)
    result = result.replace(/(&gt;)([^<]+)(&lt;)/g, (match, open, text, close) => {
        const trimmed = text.trim();
        if (trimmed && !text.includes('class=')) {
            return `${open}<span class="hl-text">${text}</span>${close}`;
        }
        return match;
    });
    
    return result;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Copy & Download Functions
// ============================================
async function copyAsPlainText() {
    const output = buildMessage(state.currentFormat);
    try {
        await navigator.clipboard.writeText(output);
        showFeedback('Copied to clipboard!', 'success');
    } catch (err) {
        showFeedback('Failed to copy', 'error');
    }
}

async function copyAsRichText() {
    const htmlContent = elements.outputHighlighted.innerHTML;
    const plainText = buildMessage(state.currentFormat);
    
    try {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const item = new ClipboardItem({
            'text/html': blob,
            'text/plain': new Blob([plainText], { type: 'text/plain' })
        });
        await navigator.clipboard.write([item]);
        showFeedback('Copied with formatting!', 'success');
    } catch (err) {
        // Fallback to plain text
        await copyAsPlainText();
    }
}

function downloadOutput() {
    const output = buildMessage(state.currentFormat);
    const format = state.currentFormat;
    
    let extension = 'txt';
    let mimeType = 'text/plain';
    
    if (format === 'hl7') {
        extension = 'hl7';
    } else if (format.startsWith('xml_') || format === 'poct1a') {
        extension = 'xml';
        mimeType = 'application/xml';
    }
    
    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message_${Date.now()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    
    showFeedback('File downloaded!', 'success');
}

// ============================================
// Template Management
// ============================================
function loadTemplates() {
    // Load custom templates from storage
    try {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.TEMPLATES);
        if (stored) {
            state.customTemplates = JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Failed to load templates:', e);
    }
    
    updateTemplateDropdown();
}

function updateTemplateDropdown() {
    const format = state.currentFormat;
    
    // Clear groups
    elements.presetTemplatesGroup.innerHTML = '';
    elements.customTemplatesGroup.innerHTML = '';
    
    // Add preset templates
    const presets = PRESET_TEMPLATES[format] || {};
    Object.entries(presets).forEach(([key, template]) => {
        const option = document.createElement('option');
        option.value = `preset_${key}`;
        option.textContent = template.name;
        elements.presetTemplatesGroup.appendChild(option);
    });
    
    // Add custom templates
    const custom = state.customTemplates[format] || {};
    Object.entries(custom).forEach(([key, template]) => {
        const option = document.createElement('option');
        option.value = `custom_${key}`;
        option.textContent = template.name;
        elements.customTemplatesGroup.appendChild(option);
    });
    
    elements.messageTemplate.value = 'custom';
}

function loadTemplate(templateId) {
    if (templateId === 'custom') {
        clearAllNodes();
        return;
    }
    
    const format = state.currentFormat;
    let template;
    
    if (templateId.startsWith('preset_')) {
        const key = templateId.replace('preset_', '');
        template = PRESET_TEMPLATES[format]?.[key];
    } else if (templateId.startsWith('custom_')) {
        const key = templateId.replace('custom_', '');
        template = state.customTemplates[format]?.[key];
    }
    
    if (!template) return;
    
    saveStateForUndo();
    
    // Clear and load nodes
    state.nodes = [];
    nodeIdCounter = 0;
    
    // Recreate nodes with new IDs but preserving structure
    const idMap = {};
    template.nodes.forEach(nodeData => {
        const newId = generateNodeId();
        idMap[nodeData.id] = newId;
        
        state.nodes.push({
            id: newId,
            type: nodeData.type,
            fields: deepClone(nodeData.fields),
            parentId: nodeData.parentId ? idMap[nodeData.parentId] : null,
            expanded: true
        });
    });
    
    state.selectedNodeId = null;
    renderTree();
    updatePropertiesSidebar();
    updateOutput();
    clearUnsavedChanges();
}

function saveTemplate() {
    showModal(elements.saveModal);
    elements.templateNameInput.value = '';
    elements.templateNameInput.focus();
}

function confirmSaveTemplate() {
    const name = elements.templateNameInput.value.trim();
    if (!name) {
        showFeedback('Please enter a template name', 'error');
        return;
    }
    
    const format = state.currentFormat;
    const key = `template_${Date.now()}`;
    
    if (!state.customTemplates[format]) {
        state.customTemplates[format] = {};
    }
    
    state.customTemplates[format][key] = {
        name: name,
        nodes: deepClone(state.nodes)
    };
    
    // Save to storage
    try {
        const json = JSON.stringify(state.customTemplates);
        if (json.length > CONFIG.MAX_STORAGE_SIZE) {
            showFeedback('Storage limit reached. Delete some templates.', 'error');
            return;
        }
        localStorage.setItem(CONFIG.STORAGE_KEYS.TEMPLATES, json);
    } catch (e) {
        showFeedback('Failed to save template', 'error');
        return;
    }
    
    hideModal(elements.saveModal);
    updateTemplateDropdown();
    clearUnsavedChanges();
    showFeedback('Template saved!', 'success');
}

function deleteTemplate() {
    const templateId = elements.messageTemplate.value;
    if (!templateId.startsWith('custom_')) {
        showFeedback('Cannot delete preset templates', 'error');
        return;
    }
    
    showConfirmModal(
        'Delete Template',
        'Are you sure you want to delete this template?',
        () => {
            const format = state.currentFormat;
            const key = templateId.replace('custom_', '');
            
            if (state.customTemplates[format]) {
                delete state.customTemplates[format][key];
                localStorage.setItem(CONFIG.STORAGE_KEYS.TEMPLATES, JSON.stringify(state.customTemplates));
            }
            
            updateTemplateDropdown();
            showFeedback('Template deleted', 'success');
        }
    );
}

function clearAllNodes() {
    if (state.nodes.length === 0) return;
    
    showConfirmModal(
        'Clear All',
        'Are you sure you want to clear all nodes?',
        () => {
            saveStateForUndo();
            state.nodes = [];
            state.selectedNodeId = null;
            renderTree();
            updatePropertiesSidebar();
            updateOutput();
        }
    );
}

// ============================================
// Modal Functions
// ============================================
function showModal(modal) {
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function showConfirmModal(title, message, onConfirm) {
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    
    const handler = () => {
        hideModal(elements.confirmModal);
        elements.confirmActionBtn.removeEventListener('click', handler);
        onConfirm();
    };
    
    elements.confirmActionBtn.addEventListener('click', handler);
    showModal(elements.confirmModal);
}

// ============================================
// XSD Schema Handling
// ============================================
function loadXsdSchema() {
    elements.xsdUploadInput.click();
}

function handleXsdUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const xsdContent = e.target.result;
            const schema = parseXsdSchema(xsdContent);
            state.xsdSchema = schema;
            
            localStorage.setItem(CONFIG.STORAGE_KEYS.XSD_SCHEMA, JSON.stringify(schema));
            showFeedback('XSD schema loaded!', 'success');
            
            if (state.currentFormat.startsWith('xml_')) {
                updatePropertiesSidebar();
            }
        } catch (err) {
            console.error('XSD parsing error:', err);
            showFeedback('Failed to parse XSD file', 'error');
        }
    };
    reader.readAsText(file);
}

function parseXsdSchema(xsdContent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xsdContent, 'application/xml');
    const schema = {};
    
    const complexTypes = doc.querySelectorAll('complexType');
    complexTypes.forEach(ct => {
        const name = ct.getAttribute('name');
        if (!name) return;
        
        const elementInfo = { attributes: [], children: [] };
        
        ct.querySelectorAll('attribute').forEach(attr => {
            elementInfo.attributes.push({
                name: attr.getAttribute('name'),
                type: attr.getAttribute('type'),
                required: attr.getAttribute('use') === 'required'
            });
        });
        
        ct.querySelectorAll('element').forEach(el => {
            const ref = el.getAttribute('ref') || el.getAttribute('name');
            if (ref) elementInfo.children.push(ref);
        });
        
        schema[name] = elementInfo;
    });
    
    const elements = doc.querySelectorAll('schema > element');
    elements.forEach(el => {
        const name = el.getAttribute('name');
        const type = el.getAttribute('type');
        
        if (name && !schema[name]) {
            schema[name] = {
                attributes: [],
                children: type ? (schema[type]?.children || []) : []
            };
        }
    });
    
    return schema;
}

// ============================================
// File Upload & Parsing
// ============================================

// Get allowed extensions for current format
function getAllowedExtensions(format) {
    const extensionMap = {
        'astm': ['astm', 'txt'],
        'hl7': ['hl7', 'txt'],
        'xml_request': ['xml'],
        'xml_result': ['xml'],
        'poct1a': ['poct1a', 'xml', 'txt']
    };
    return extensionMap[format] || ['txt'];
}

function updateFileUploadAccept() {
    const extensions = getAllowedExtensions(state.currentFormat);
    elements.fileUpload.accept = extensions.map(ext => `.${ext}`).join(',');
}

function handleFileUpload(file) {
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop();
    const allowedExtensions = getAllowedExtensions(state.currentFormat);
    
    if (!allowedExtensions.includes(extension)) {
        showFeedback(`Invalid file type. For ${state.currentFormat.toUpperCase()} use: ${allowedExtensions.map(e => '.' + e).join(', ')}`, 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        parseAndLoadMessage(e.target.result, state.currentFormat);
    };
    reader.readAsText(file);
}

function areFormatsCompatible(format1, format2) {
    // Group compatible formats
    const groups = [
        ['astm'],
        ['hl7'],
        ['poct1a', 'xml_request', 'xml_result']
    ];
    
    const group1 = groups.find(g => g.includes(format1));
    const group2 = groups.find(g => g.includes(format2));
    
    return group1 === group2;
}

async function handlePasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        if (text) parseAndLoadMessage(text, state.currentFormat);
    } catch (err) {
        showFeedback('Failed to read clipboard', 'error');
    }
}

function parseAndLoadMessage(content, format) {
    content = content.trim();
    let nodes = [];
    
    try {
        switch (format) {
            case 'astm':
                nodes = parseAstmMessage(content);
                break;
            case 'hl7':
                nodes = parseHl7Message(content);
                break;
            case 'poct1a':
            case 'xml_request':
            case 'xml_result':
                nodes = parseXmlMessage(content);
                break;
            default:
                showFeedback('Unknown message format', 'error');
                return;
        }
        
        if (nodes.length === 0) {
            showFeedback('No valid records found', 'error');
            return;
        }
        
        saveStateForUndo();
        
        if (state.currentFormat !== format) {
            state.currentFormat = format;
            elements.outputFormatSelect.value = format;
            localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_FORMAT, format);
        }
        
        state.nodes = nodes;
        state.selectedNodeId = null;
        nodeIdCounter = nodes.length;
        
        renderTree();
        updatePropertiesSidebar();
        updateOutput();
        updateTemplateDropdown();
        showFeedback(`Message loaded as ${format.toUpperCase()}!`, 'success');
        
    } catch (err) {
        console.error('Parse error:', err);
        showFeedback('Failed to parse message', 'error');
    }
}

function parseAstmMessage(content) {
    const nodes = [];
    const lines = content.split(/[\r\n]+/);
    
    lines.forEach(line => {
        line = line.replace(/<STX>|<ETX>|<CR>|\x02|\x03|\r/g, '').trim();
        if (!line) return;
        
        const parts = line.split('|');
        if (parts.length < 2) return;
        
        const type = parts[0];
        const fields = [];
        
        for (let i = 1; i < parts.length; i++) {
            if (parts[i]) fields.push({ name: i, value: parts[i] });
        }
        
        nodes.push({
            id: generateNodeId(),
            type: type,
            fields: fields,
            parentId: null,
            expanded: true
        });
    });
    
    return nodes;
}

function parseHl7Message(content) {
    const nodes = [];
    const lines = content.split(/[\r\n]+/);
    
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        
        const parts = line.split('|');
        const type = parts[0];
        const fields = [];
        const startIndex = type === 'MSH' ? 2 : 1;
        
        for (let i = startIndex; i < parts.length; i++) {
            if (parts[i]) {
                const fieldNum = type === 'MSH' ? i + 1 : i;
                fields.push({ name: fieldNum, value: parts[i] });
            }
        }
        
        nodes.push({
            id: generateNodeId(),
            type: type,
            fields: fields,
            parentId: null,
            expanded: true
        });
    });
    
    return nodes;
}

function parseXmlMessage(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'application/xml');
    const nodes = [];
    
    const parseElement = (element, parentId = null) => {
        const nodeId = generateNodeId();
        const fields = [];
        
        // Parse all attributes (V, U, SN, SV, DN, NULL, etc.)
        Array.from(element.attributes).forEach(attr => {
            if (!attr.name.startsWith('xmlns')) {
                fields.push({ name: attr.name, value: attr.value });
            }
        });
        
        nodes.push({
            id: nodeId,
            type: element.tagName,
            fields: fields,
            parentId: parentId,
            expanded: true
        });
        
        Array.from(element.children).forEach(child => parseElement(child, nodeId));
    };
    
    const root = doc.documentElement;
    // For POCT1-A, the root element (OBS.R02, OBS.R01, etc.) IS the message type, don't skip
    // Only skip generic wrapper elements
    const skipRoot = ['Request', 'Result', 'POCT1A', 'root'].includes(root.tagName);
    
    if (skipRoot) {
        Array.from(root.children).forEach(child => parseElement(child, null));
    } else {
        parseElement(root, null);
    }
    
    return nodes;
}
// ============================================
// Output Panel Resize
// ============================================
function initOutputResize() {
    let startY, startHeight;
    
    const onMouseMove = (e) => {
        if (!state.isResizingOutput) return;
        const deltaY = startY - e.clientY;
        const newHeight = Math.max(100, Math.min(window.innerHeight - 200, startHeight + deltaY));
        elements.outputPanel.style.height = `${newHeight}px`;
        document.documentElement.style.setProperty('--output-height', `${newHeight}px`);
    };
    
    const onMouseUp = () => {
        state.isResizingOutput = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        
        const height = parseInt(elements.outputPanel.style.height);
        localStorage.setItem(CONFIG.STORAGE_KEYS.OUTPUT_HEIGHT, height);
    };
    
    elements.outputResizeHandle.addEventListener('mousedown', (e) => {
        state.isResizingOutput = true;
        startY = e.clientY;
        startHeight = elements.outputPanel.offsetHeight;
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    
    const savedHeight = localStorage.getItem(CONFIG.STORAGE_KEYS.OUTPUT_HEIGHT);
    if (savedHeight) {
        elements.outputPanel.style.height = `${savedHeight}px`;
        document.documentElement.style.setProperty('--output-height', `${savedHeight}px`);
    }
}

function toggleOutputPanel() {
    elements.outputPanel.classList.toggle('collapsed');
    const isExpanded = !elements.outputPanel.classList.contains('collapsed');
    elements.toggleOutputBtn.setAttribute('aria-expanded', isExpanded);
}

// ============================================
// Event Listeners Setup
// ============================================
function setupEventListeners() {
    // Format selector
    elements.outputFormatSelect.addEventListener('change', (e) => {
        const newFormat = e.target.value;
        const oldFormat = state.currentFormat;
        
        // If there are nodes and format is incompatible, warn user
        if (state.nodes.length > 0 && !areFormatsCompatible(oldFormat, newFormat)) {
            elements.confirmTitle.textContent = 'Change Format?';
            elements.confirmMessage.textContent = `Changing from ${oldFormat.toUpperCase()} to ${newFormat.toUpperCase()} will clear your current message. The formats are not compatible.`;
            elements.confirmActionBtn.textContent = 'Clear & Change';
            elements.confirmActionBtn.onclick = () => {
                hideModal(elements.confirmModal);
                saveStateForUndo();
                state.nodes = [];
                state.selectedNodeId = null;
                state.currentFormat = newFormat;
                elements.outputFormatSelect.value = newFormat;
                localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_FORMAT, newFormat);
                updateFileUploadAccept();
                updateTemplateDropdown();
                renderTree();
                updatePropertiesSidebar();
                updateOutput();
            };
            // Reset dropdown to old value temporarily
            elements.outputFormatSelect.value = oldFormat;
            showModal(elements.confirmModal);
            return;
        }
        
        state.currentFormat = newFormat;
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_FORMAT, newFormat);
        updateFileUploadAccept();
        updateTemplateDropdown();
        renderTree();
        updatePropertiesSidebar();
        updateOutput();
    });
    
    // Template selector
    elements.messageTemplate.addEventListener('change', (e) => {
        loadTemplate(e.target.value);
    });
    
    // Delete template
    elements.deleteTemplateBtn.addEventListener('click', deleteTemplate);
    
    // XSD upload
    elements.uploadXsdBtn.addEventListener('click', loadXsdSchema);
    elements.xsdUploadInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleXsdUpload(e.target.files[0]);
        e.target.value = '';
    });
    
    // File upload
    elements.uploadBtn.addEventListener('click', () => elements.fileUpload.click());
    elements.fileUpload.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFileUpload(e.target.files[0]);
        e.target.value = '';
    });
    
    // Paste
    elements.pasteBtn.addEventListener('click', handlePasteFromClipboard);
    
    // Undo/Redo
    elements.undoBtn.addEventListener('click', undo);
    elements.redoBtn.addEventListener('click', redo);
    
    // Save/Clear
    elements.saveTemplateBtn.addEventListener('click', saveTemplate);
    elements.clearAllBtn.addEventListener('click', clearAllNodes);
    
    // Tree actions
    elements.addRecordBtn.addEventListener('click', () => addNode());
    elements.addChildBtn.addEventListener('click', () => {
        if (state.selectedNodeId) addChildNode(state.selectedNodeId);
    });
    elements.expandAllBtn.addEventListener('click', expandAllNodes);
    elements.collapseAllBtn.addEventListener('click', collapseAllNodes);
    
    // Properties sidebar
    elements.toggleSidebarBtn.addEventListener('click', toggleSidebar);
    elements.nodeTypeSelect.addEventListener('change', (e) => {
        if (state.selectedNodeId) updateNodeType(state.selectedNodeId, e.target.value);
    });
    
    // Custom node name input for POCT1-A
    elements.customNodeNameInput.addEventListener('input', (e) => {
        if (state.selectedNodeId && state.currentFormat === 'poct1a') {
            updateCustomNodeType(state.selectedNodeId, e.target.value);
        }
    });
    elements.customNodeNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            elements.customNodeNameInput.blur();
        }
    });
    
    elements.addFieldBtn.addEventListener('click', () => {
        if (state.selectedNodeId) addFieldToNode(state.selectedNodeId);
    });
    
    // Node actions
    elements.duplicateNodeBtn.addEventListener('click', () => {
        if (state.selectedNodeId) duplicateNode(state.selectedNodeId);
    });
    elements.copyNodeBtn.addEventListener('click', () => {
        if (state.selectedNodeId) copyNode(state.selectedNodeId);
    });
    elements.pasteNodeBtn.addEventListener('click', () => {
        pasteNode(state.selectedNodeId);
    });
    elements.moveUpBtn.addEventListener('click', () => {
        if (state.selectedNodeId) moveNode(state.selectedNodeId, 'up');
    });
    elements.moveDownBtn.addEventListener('click', () => {
        if (state.selectedNodeId) moveNode(state.selectedNodeId, 'down');
    });
    elements.deleteNodeBtn.addEventListener('click', () => {
        if (state.selectedNodeId) deleteNode(state.selectedNodeId);
    });
    
    // Output panel
    elements.toggleOutputBtn.addEventListener('click', toggleOutputPanel);
    elements.copyTextBtn.addEventListener('click', copyAsPlainText);
    elements.copyRichBtn.addEventListener('click', copyAsRichText);
    elements.downloadBtn.addEventListener('click', downloadOutput);
    
    // Save modal
    elements.confirmSaveBtn.addEventListener('click', confirmSaveTemplate);
    elements.templateNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmSaveTemplate();
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) hideModal(modal);
        });
    });
    
    // Modal backdrop close
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', () => {
            const modal = backdrop.closest('.modal');
            if (modal) hideModal(modal);
        });
    });
    
    // Initial XSD modal
    elements.initialXsdUploadBtn?.addEventListener('click', () => {
        hideModal(elements.initialXsdModal);
        loadXsdSchema();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeydown);
    
    // Before unload warning
    window.addEventListener('beforeunload', (e) => {
        if (state.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

function handleGlobalKeydown(e) {
    if (e.target.matches('input, textarea, select')) {
        if (e.key === 'Escape') e.target.blur();
        return;
    }
    
    const isMod = e.ctrlKey || e.metaKey;
    
    if (isMod && e.key === 'z') {
        e.preventDefault();
        undo();
    } else if (isMod && e.key === 'y') {
        e.preventDefault();
        redo();
    } else if (isMod && e.key === 's') {
        e.preventDefault();
        saveTemplate();
    } else if (isMod && e.key === 'v') {
        e.preventDefault();
        handlePasteFromClipboard();
    } else if (isMod && e.key === 'c' && state.selectedNodeId) {
        e.preventDefault();
        copyNode(state.selectedNodeId);
    } else if (isMod && e.key === 'd' && state.selectedNodeId) {
        e.preventDefault();
        duplicateNode(state.selectedNodeId);
    } else if (e.key === 'Delete' && state.selectedNodeId) {
        e.preventDefault();
        deleteNode(state.selectedNodeId);
    } else if (e.altKey && e.key === 'ArrowUp' && state.selectedNodeId) {
        e.preventDefault();
        moveNode(state.selectedNodeId, 'up');
    } else if (e.altKey && e.key === 'ArrowDown' && state.selectedNodeId) {
        e.preventDefault();
        moveNode(state.selectedNodeId, 'down');
    } else if (e.key === 'Escape') {
        document.querySelectorAll('.modal.visible').forEach(modal => hideModal(modal));
    }
}

// ============================================
// Initialization
// ============================================
function init() {
    // Restore last format
    const savedFormat = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_FORMAT);
    if (savedFormat) {
        state.currentFormat = savedFormat;
        elements.outputFormatSelect.value = savedFormat;
    }
    
    // Update file upload accept attribute
    updateFileUploadAccept();
    
    // Restore sidebar state
    const sidebarState = localStorage.getItem(CONFIG.STORAGE_KEYS.SIDEBAR_STATE);
    if (sidebarState === 'collapsed') {
        elements.propertiesSidebar.classList.add('collapsed');
    }
    
    // Load saved XSD schema
    try {
        const savedXsd = localStorage.getItem(CONFIG.STORAGE_KEYS.XSD_SCHEMA);
        if (savedXsd) {
            state.xsdSchema = JSON.parse(savedXsd);
        }
    } catch (e) {
        console.warn('Failed to load XSD schema:', e);
    }
    
    // Load templates
    loadTemplates();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize output resize
    initOutputResize();
    
    // Initial render
    renderTree();
    updateOutput();
    updateUndoRedoButtons();
    
    // Show XSD modal for XML formats if no schema loaded
    if (state.currentFormat.startsWith('xml_') && !state.xsdSchema) {
        setTimeout(() => {
            showModal(elements.initialXsdModal);
        }, 500);
    }
    
    console.log('Smart Message Builder initialized');
}

// Start the application
document.addEventListener('DOMContentLoaded', init);