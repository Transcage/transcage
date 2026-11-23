-- =============================================================================
-- TRANSCAGE — Full Database Schema
-- Database: transcagesysdb
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_general_ci
-- Style: No backticks. All indexes inside CREATE TABLE. FK checks wrapped.
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- SECTION 1 — SYSTEM CONFIGURATION & PLATFORM SETTINGS
-- =============================================================================

DROP TABLE IF EXISTS system_config;
CREATE TABLE IF NOT EXISTS system_config (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    category        VARCHAR(60)     NOT NULL,
    config_key      VARCHAR(120)    NOT NULL,
    config_value    TEXT            NOT NULL,
    description     VARCHAR(255)    NULL,
    is_public       TINYINT(1)      NOT NULL DEFAULT 0,
    is_encrypted    TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_system_config_key (config_key),
    KEY idx_system_config_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS cron_jobs;
CREATE TABLE IF NOT EXISTS cron_jobs (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    job_key         VARCHAR(80)     NOT NULL,
    description     VARCHAR(255)    NULL,
    interval_minutes INT UNSIGNED   NOT NULL DEFAULT 5,
    last_run_at     DATETIME        NULL,
    is_enabled      TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cron_job_key (job_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS audit_logs;
CREATE TABLE IF NOT EXISTS audit_logs (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_user_id   INT UNSIGNED    NULL,
    actor_role      VARCHAR(60)     NULL,
    action          VARCHAR(120)    NOT NULL,
    entity_type     VARCHAR(80)     NULL,
    entity_id       INT UNSIGNED    NULL,
    before_state    JSON            NULL,
    after_state     JSON            NULL,
    ip_address      VARCHAR(45)     NULL,
    notes           TEXT            NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_actor (actor_user_id),
    KEY idx_audit_entity (entity_type, entity_id),
    KEY idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 2 — PAYMENT GATEWAYS & SMS GATEWAYS
-- =============================================================================

DROP TABLE IF EXISTS payment_gateways;
CREATE TABLE IF NOT EXISTS payment_gateways (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    code                    VARCHAR(50)     NOT NULL,
    name                    VARCHAR(100)    NOT NULL,
    mode                    ENUM('test','live') NOT NULL DEFAULT 'test',
    is_enabled              TINYINT(1)      NOT NULL DEFAULT 0,
    is_default              TINYINT(1)      NOT NULL DEFAULT 0,
    is_configured           TINYINT(1)      NOT NULL DEFAULT 0,
    display_order           TINYINT UNSIGNED NOT NULL DEFAULT 0,
    logo                    VARCHAR(255)    NULL,
    credentials_encrypted   TEXT            NULL,
    credentials_iv          VARCHAR(128)    NULL,
    config_json             JSON            NULL,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_gateway_code (code),
    KEY idx_gateway_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS sms_gateways;
CREATE TABLE IF NOT EXISTS sms_gateways (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    code                    VARCHAR(50)     NOT NULL,
    name                    VARCHAR(120)    NOT NULL,
    mode                    ENUM('test','live') NOT NULL DEFAULT 'test',
    is_enabled              TINYINT(1)      NOT NULL DEFAULT 0,
    is_default              TINYINT(1)      NOT NULL DEFAULT 0,
    is_configured           TINYINT(1)      NOT NULL DEFAULT 0,
    display_order           TINYINT UNSIGNED NOT NULL DEFAULT 0,
    logo                    VARCHAR(255)    NULL,
    credentials_encrypted   TEXT            NULL,
    credentials_iv          VARCHAR(128)    NULL,
    config_json             JSON            NULL,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sms_gateway_code (code),
    KEY idx_sms_gateway_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS webhook_events;
CREATE TABLE IF NOT EXISTS webhook_events (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    gateway_code        VARCHAR(50)     NOT NULL,
    event_type          VARCHAR(100)    NOT NULL,
    gateway_reference   VARCHAR(150)    NOT NULL,
    raw_payload         MEDIUMTEXT      NOT NULL,
    is_processed        TINYINT(1)      NOT NULL DEFAULT 0,
    processed_at        DATETIME        NULL,
    error_message       TEXT            NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_webhook_ref (gateway_code, gateway_reference, event_type),
    KEY idx_webhook_processed (is_processed),
    KEY idx_webhook_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 3 — USERS & AUTHENTICATION
-- =============================================================================

DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    uuid                CHAR(36)        NOT NULL,
    full_name           VARCHAR(150)    NOT NULL,
    phone               VARCHAR(25)     NOT NULL,
    email               VARCHAR(180)    NULL,
    photo               VARCHAR(255)    NULL,
    status              ENUM('active','inactive','suspended','pending_verification') NOT NULL DEFAULT 'pending_verification',
    is_phone_verified   TINYINT(1)      NOT NULL DEFAULT 0,
    is_email_verified   TINYINT(1)      NOT NULL DEFAULT 0,
    notification_prefs  JSON            NULL,
    last_login_at       DATETIME        NULL,
    last_seen_at        DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_uuid (uuid),
    UNIQUE KEY uq_users_phone (phone),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS user_secrets;
CREATE TABLE IF NOT EXISTS user_secrets (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id             INT UNSIGNED    NOT NULL,
    secret_type         VARCHAR(50)     NOT NULL DEFAULT 'password',
    encrypted_secret    TEXT            NOT NULL,
    iv                  VARCHAR(128)    NOT NULL,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    deactivated_at      DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_secrets_lookup (user_id, secret_type, is_active),
    CONSTRAINT fk_user_secrets_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS user_sessions;
CREATE TABLE IF NOT EXISTS user_sessions (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id             INT UNSIGNED    NOT NULL,
    session_token       VARCHAR(128)    NOT NULL,
    active_role         VARCHAR(60)     NULL,
    device_name         VARCHAR(150)    NULL,
    device_type         VARCHAR(30)     NULL,
    ip_address          VARCHAR(45)     NULL,
    user_agent          VARCHAR(500)    NULL,
    expires_at          DATETIME        NOT NULL,
    is_revoked          TINYINT(1)      NOT NULL DEFAULT 0,
    revoked_at          DATETIME        NULL,
    last_used_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_sessions_token (session_token),
    KEY idx_user_sessions_lookup (user_id, is_revoked, expires_at),
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS auth_tokens;
CREATE TABLE IF NOT EXISTS auth_tokens (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id             INT UNSIGNED    NULL,
    identifier          VARCHAR(150)    NULL,
    token_type          ENUM('phone_otp','email_verify','password_reset','delivery_otp','collection_otp') NOT NULL,
    token_code          VARCHAR(64)     NOT NULL,
    shipment_id         INT UNSIGNED    NULL,
    is_used             TINYINT(1)      NOT NULL DEFAULT 0,
    expires_at          DATETIME        NOT NULL,
    used_at             DATETIME        NULL,
    ip_address          VARCHAR(45)     NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_auth_tokens_code (token_code, token_type, is_used, expires_at),
    KEY idx_auth_tokens_lookup (user_id, token_type, is_used, expires_at),
    KEY idx_auth_tokens_identifier (identifier, token_type, is_used),
    CONSTRAINT fk_auth_tokens_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS device_push_tokens;
CREATE TABLE IF NOT EXISTS device_push_tokens (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id             INT UNSIGNED    NOT NULL,
    platform            ENUM('web','android','ios','desktop') NOT NULL DEFAULT 'web',
    push_service        ENUM('vapid','fcm','apns') NOT NULL DEFAULT 'vapid',
    token_or_endpoint   TEXT            NOT NULL,
    p256dh              TEXT            NULL,
    auth_key            VARCHAR(255)    NULL,
    device_hint         VARCHAR(100)    NULL,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_push_tokens_user (user_id, is_active),
    CONSTRAINT fk_push_tokens_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 4 — USER ROLES (Multi-role per user)
-- A user can hold: CUSTOMER, DRIVER, STATION_CLERK, OVERSEER,
--                  COMPANY_OWNER, COMPANY_ADMIN, PLATFORM_ADMIN
-- =============================================================================

DROP TABLE IF EXISTS user_roles;
CREATE TABLE IF NOT EXISTS user_roles (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED    NOT NULL,
    role            ENUM('CUSTOMER','DRIVER','STATION_CLERK','OVERSEER','COMPANY_OWNER','COMPANY_ADMIN','PLATFORM_ADMIN') NOT NULL,
    company_id      INT UNSIGNED    NULL,
    station_id      INT UNSIGNED    NULL,
    granted_by      INT UNSIGNED    NULL,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    activated_at    DATETIME        NULL,
    deactivated_at  DATETIME        NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_role_company (user_id, role, company_id),
    KEY idx_user_roles_user (user_id, is_active),
    KEY idx_user_roles_company (company_id),
    KEY idx_user_roles_station (station_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 5 — COMPANIES / ORGANISATIONS
-- =============================================================================

DROP TABLE IF EXISTS companies;
CREATE TABLE IF NOT EXISTS companies (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    uuid                CHAR(36)        NOT NULL,
    name                VARCHAR(150)    NOT NULL,
    slug                VARCHAR(100)    NOT NULL,
    business_reg_no     VARCHAR(80)     NULL,
    contact_phone       VARCHAR(25)     NULL,
    contact_email       VARCHAR(180)    NULL,
    address             TEXT            NULL,
    city                VARCHAR(80)     NULL,
    region              VARCHAR(80)     NULL,
    country             VARCHAR(60)     NOT NULL DEFAULT 'Ghana',
    logo                VARCHAR(255)    NULL,
    description         TEXT            NULL,
    service_types       JSON            NULL,
    status              ENUM('draft','submitted','under_review','info_required','approved','rejected','suspended','deactivated') NOT NULL DEFAULT 'draft',
    owner_user_id       INT UNSIGNED    NULL,
    reviewed_by         INT UNSIGNED    NULL,
    review_notes        TEXT            NULL,
    reviewed_at         DATETIME        NULL,
    approved_at         DATETIME        NULL,
    suspended_at        DATETIME        NULL,
    suspension_reason   TEXT            NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_companies_uuid (uuid),
    UNIQUE KEY uq_companies_slug (slug),
    KEY idx_companies_status (status),
    KEY idx_companies_owner (owner_user_id),
    CONSTRAINT fk_companies_owner FOREIGN KEY (owner_user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 6 — STATIONS / FIXED POINTS
-- =============================================================================

DROP TABLE IF EXISTS stations;
CREATE TABLE IF NOT EXISTS stations (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    uuid                CHAR(36)        NOT NULL,
    company_id          INT UNSIGNED    NOT NULL,
    name                VARCHAR(150)    NOT NULL,
    code                VARCHAR(20)     NULL,
    address             TEXT            NULL,
    city                VARCHAR(80)     NULL,
    region              VARCHAR(80)     NULL,
    country             VARCHAR(60)     NOT NULL DEFAULT 'Ghana',
    latitude            DECIMAL(10,7)   NULL,
    longitude           DECIMAL(10,7)   NULL,
    contact_phone       VARCHAR(25)     NULL,
    contact_email       VARCHAR(180)    NULL,
    operating_hours     JSON            NULL,
    services            JSON            NULL,
    status              ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_stations_uuid (uuid),
    KEY idx_stations_company (company_id),
    KEY idx_stations_status (status),
    CONSTRAINT fk_stations_company FOREIGN KEY (company_id)
        REFERENCES companies (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Overseer station assignments (one overseer supervises multiple stations)
DROP TABLE IF EXISTS overseer_station_assignments;
CREATE TABLE IF NOT EXISTS overseer_station_assignments (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    overseer_user_id INT UNSIGNED   NOT NULL,
    station_id      INT UNSIGNED    NOT NULL,
    company_id      INT UNSIGNED    NOT NULL,
    assigned_by     INT UNSIGNED    NULL,
    assigned_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    UNIQUE KEY uq_overseer_station (overseer_user_id, station_id),
    KEY idx_overseer_assignments_station (station_id),
    CONSTRAINT fk_osa_overseer FOREIGN KEY (overseer_user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_osa_station FOREIGN KEY (station_id)
        REFERENCES stations (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_osa_company FOREIGN KEY (company_id)
        REFERENCES companies (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 7 — DRIVER PROFILES & APPLICATIONS
-- =============================================================================

DROP TABLE IF EXISTS driver_profiles;
CREATE TABLE IF NOT EXISTS driver_profiles (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id                 INT UNSIGNED    NOT NULL,
    company_id              INT UNSIGNED    NULL,
    id_type                 VARCHAR(50)     NULL,
    id_number               VARCHAR(80)     NULL,
    id_doc_path             VARCHAR(255)    NULL,
    license_number          VARCHAR(80)     NULL,
    license_doc_path        VARCHAR(255)    NULL,
    vehicle_type            VARCHAR(60)     NULL,
    vehicle_make            VARCHAR(80)     NULL,
    vehicle_model           VARCHAR(80)     NULL,
    vehicle_color           VARCHAR(50)     NULL,
    vehicle_plate           VARCHAR(30)     NULL,
    vehicle_doc_path        VARCHAR(255)    NULL,
    service_areas           JSON            NULL,
    service_types           JSON            NULL,
    can_do_station_to_station TINYINT(1)   NOT NULL DEFAULT 0,
    can_do_point_to_point   TINYINT(1)     NOT NULL DEFAULT 0,
    availability_status     ENUM('available','busy','offline','temp_unavailable','suspended') NOT NULL DEFAULT 'offline',
    application_status      ENUM('draft','submitted','under_review','approved','rejected','suspended') NOT NULL DEFAULT 'draft',
    reviewed_by             INT UNSIGNED    NULL,
    review_notes            TEXT            NULL,
    reviewed_at             DATETIME        NULL,
    approved_at             DATETIME        NULL,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_driver_profiles_user (user_id),
    KEY idx_driver_profiles_company (company_id),
    KEY idx_driver_profiles_availability (availability_status),
    KEY idx_driver_profiles_app_status (application_status),
    CONSTRAINT fk_driver_profiles_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_driver_profiles_company FOREIGN KEY (company_id)
        REFERENCES companies (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS driver_availability_logs;
CREATE TABLE IF NOT EXISTS driver_availability_logs (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    driver_user_id  INT UNSIGNED    NOT NULL,
    old_status      VARCHAR(30)     NULL,
    new_status      VARCHAR(30)     NOT NULL,
    reason          VARCHAR(255)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_dal_driver (driver_user_id),
    CONSTRAINT fk_dal_driver FOREIGN KEY (driver_user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 8 — SHIPMENTS (Central Record)
-- =============================================================================

DROP TABLE IF EXISTS shipments;
CREATE TABLE IF NOT EXISTS shipments (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    tracking_number         VARCHAR(20)     NOT NULL,
    delivery_model          ENUM('STATION_TO_STATION','POINT_TO_POINT') NOT NULL,
    sender_user_id          INT UNSIGNED    NOT NULL,
    recipient_name          VARCHAR(150)    NOT NULL,
    recipient_phone         VARCHAR(25)     NOT NULL,
    recipient_email         VARCHAR(180)    NULL,
    recipient_user_id       INT UNSIGNED    NULL,
    origin_station_id       INT UNSIGNED    NULL,
    destination_station_id  INT UNSIGNED    NULL,
    origin_address          TEXT            NULL,
    origin_city             VARCHAR(80)     NULL,
    origin_lat              DECIMAL(10,7)   NULL,
    origin_lng              DECIMAL(10,7)   NULL,
    destination_address     TEXT            NULL,
    destination_city        VARCHAR(80)     NULL,
    destination_lat         DECIMAL(10,7)   NULL,
    destination_lng         DECIMAL(10,7)   NULL,
    parcel_description      TEXT            NOT NULL,
    parcel_category         VARCHAR(80)     NULL,
    parcel_weight_kg        DECIMAL(8,2)    NULL,
    parcel_length_cm        DECIMAL(8,2)    NULL,
    parcel_width_cm         DECIMAL(8,2)    NULL,
    parcel_height_cm        DECIMAL(8,2)    NULL,
    handling_instructions   TEXT            NULL,
    is_fragile              TINYINT(1)      NOT NULL DEFAULT 0,
    estimated_price         DECIMAL(10,2)   NULL,
    driver_proposed_price   DECIMAL(10,2)   NULL,
    driver_proposed_reason  TEXT            NULL,
    final_price             DECIMAL(10,2)   NULL,
    platform_fee            DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    driver_earnings         DECIMAL(10,2)   NULL,
    company_earnings        DECIMAL(10,2)   NULL,
    payment_method          ENUM('TRANSCAGE_PAYMENT','PHYSICAL_PAYMENT') NULL,
    payment_status          ENUM('unpaid','pending','paid','held','released','refunded','failed') NOT NULL DEFAULT 'unpaid',
    payment_held_at         DATETIME        NULL,
    payment_released_at     DATETIME        NULL,
    assigned_company_id     INT UNSIGNED    NULL,
    assigned_driver_id      INT UNSIGNED    NULL,
    current_custodian_type  ENUM('SENDER','STATION','DRIVER','RECIPIENT','TRANSCAGE') NULL,
    current_custodian_id    INT UNSIGNED    NULL,
    status                  VARCHAR(60)     NOT NULL DEFAULT 'REQUEST_CREATED',
    parent_shipment_id      INT UNSIGNED    NULL,
    is_last_mile            TINYINT(1)      NOT NULL DEFAULT 0,
    rejection_reason        TEXT            NULL,
    cancelled_by            INT UNSIGNED    NULL,
    cancellation_reason     TEXT            NULL,
    cancelled_at            DATETIME        NULL,
    delivered_at            DATETIME        NULL,
    completed_at            DATETIME        NULL,
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_shipments_tracking (tracking_number),
    KEY idx_shipments_sender (sender_user_id),
    KEY idx_shipments_driver (assigned_driver_id),
    KEY idx_shipments_company (assigned_company_id),
    KEY idx_shipments_origin_station (origin_station_id),
    KEY idx_shipments_dest_station (destination_station_id),
    KEY idx_shipments_status (status),
    KEY idx_shipments_payment_status (payment_status),
    KEY idx_shipments_parent (parent_shipment_id),
    CONSTRAINT fk_shipments_sender FOREIGN KEY (sender_user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_shipments_recipient_user FOREIGN KEY (recipient_user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_shipments_origin_station FOREIGN KEY (origin_station_id)
        REFERENCES stations (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_shipments_dest_station FOREIGN KEY (destination_station_id)
        REFERENCES stations (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_shipments_company FOREIGN KEY (assigned_company_id)
        REFERENCES companies (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_shipments_driver FOREIGN KEY (assigned_driver_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_shipments_parent FOREIGN KEY (parent_shipment_id)
        REFERENCES shipments (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Shipment status history / activity timeline
DROP TABLE IF EXISTS shipment_status_logs;
CREATE TABLE IF NOT EXISTS shipment_status_logs (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    shipment_id     INT UNSIGNED    NOT NULL,
    old_status      VARCHAR(60)     NULL,
    new_status      VARCHAR(60)     NOT NULL,
    actor_user_id   INT UNSIGNED    NULL,
    actor_role      VARCHAR(60)     NULL,
    location_label  VARCHAR(150)    NULL,
    lat             DECIMAL(10,7)   NULL,
    lng             DECIMAL(10,7)   NULL,
    notes           TEXT            NULL,
    is_customer_visible TINYINT(1)  NOT NULL DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ssl_shipment (shipment_id),
    KEY idx_ssl_created (created_at),
    CONSTRAINT fk_ssl_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 9 — CUSTODY LOGS (Handover Records)
-- =============================================================================

DROP TABLE IF EXISTS custody_logs;
CREATE TABLE IF NOT EXISTS custody_logs (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    shipment_id             INT UNSIGNED    NOT NULL,
    from_party_type         ENUM('SENDER','STATION','DRIVER','RECIPIENT','TRANSCAGE') NULL,
    from_party_id           INT UNSIGNED    NULL,
    to_party_type           ENUM('SENDER','STATION','DRIVER','RECIPIENT','TRANSCAGE') NOT NULL,
    to_party_id             INT UNSIGNED    NOT NULL,
    station_id              INT UNSIGNED    NULL,
    handover_type           ENUM('SENDER_TO_STATION','STATION_TO_DRIVER','DRIVER_TO_STATION',
                                 'STATION_TO_RECIPIENT','DRIVER_TO_RECIPIENT','DRIVER_TO_DRIVER',
                                 'RETURN','SYSTEM') NOT NULL,
    otp_verified            TINYINT(1)      NOT NULL DEFAULT 0,
    otp_code                VARCHAR(10)     NULL,
    confirmed_at            DATETIME        NULL,
    location_label          VARCHAR(150)    NULL,
    lat                     DECIMAL(10,7)   NULL,
    lng                     DECIMAL(10,7)   NULL,
    photo_evidence_path     VARCHAR(255)    NULL,
    notes                   TEXT            NULL,
    status                  ENUM('pending','confirmed','disputed','rejected') NOT NULL DEFAULT 'pending',
    created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_custody_shipment (shipment_id),
    KEY idx_custody_to_party (to_party_type, to_party_id),
    KEY idx_custody_station (station_id),
    KEY idx_custody_status (status),
    CONSTRAINT fk_custody_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_custody_station FOREIGN KEY (station_id)
        REFERENCES stations (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 10 — PAYMENTS & FINANCIAL RECORDS
-- =============================================================================

DROP TABLE IF EXISTS shipment_payments;
CREATE TABLE IF NOT EXISTS shipment_payments (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    shipment_id         INT UNSIGNED    NOT NULL,
    payer_user_id       INT UNSIGNED    NOT NULL,
    gateway_id          INT UNSIGNED    NULL,
    gateway_code        VARCHAR(50)     NULL,
    gateway_reference   VARCHAR(150)    NULL,
    amount              DECIMAL(10,2)   NOT NULL,
    gateway_fee         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    currency            VARCHAR(10)     NOT NULL DEFAULT 'GHS',
    payment_type        ENUM('TRANSCAGE_PAYMENT','PHYSICAL_PAYMENT') NOT NULL,
    status              ENUM('PENDING','PAID','FAILED','REFUNDED','REVERSED') NOT NULL DEFAULT 'PENDING',
    recorded_by         INT UNSIGNED    NULL,
    paid_at             DATETIME        NULL,
    idempotency_key     VARCHAR(100)    NULL,
    webhook_event_id    INT UNSIGNED    NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payment_idempotency (idempotency_key),
    KEY idx_sp_shipment (shipment_id),
    KEY idx_sp_payer (payer_user_id),
    KEY idx_sp_status (status),
    KEY idx_sp_gateway_ref (gateway_code, gateway_reference),
    CONSTRAINT fk_sp_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sp_payer FOREIGN KEY (payer_user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sp_gateway FOREIGN KEY (gateway_id)
        REFERENCES payment_gateways (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_sp_webhook FOREIGN KEY (webhook_event_id)
        REFERENCES webhook_events (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Company balance wallets
DROP TABLE IF EXISTS company_wallets;
CREATE TABLE IF NOT EXISTS company_wallets (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    company_id          INT UNSIGNED    NOT NULL,
    balance             DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    pending_balance     DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    total_earned        DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    total_withdrawn     DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_company_wallets_company (company_id),
    CONSTRAINT fk_company_wallets_company FOREIGN KEY (company_id)
        REFERENCES companies (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Driver earnings wallets
DROP TABLE IF EXISTS driver_wallets;
CREATE TABLE IF NOT EXISTS driver_wallets (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    driver_user_id      INT UNSIGNED    NOT NULL,
    balance             DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    held_balance        DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    total_earned        DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    total_withdrawn     DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_driver_wallets_user (driver_user_id),
    CONSTRAINT fk_driver_wallets_user FOREIGN KEY (driver_user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Ledger transactions (double-entry style)
DROP TABLE IF EXISTS wallet_transactions;
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    wallet_type         ENUM('COMPANY','DRIVER','PLATFORM') NOT NULL,
    wallet_owner_id     INT UNSIGNED    NOT NULL,
    shipment_id         INT UNSIGNED    NULL,
    tx_type             ENUM('CREDIT','DEBIT','HOLD','RELEASE','REFUND','WITHDRAWAL','FEE') NOT NULL,
    amount              DECIMAL(12,2)   NOT NULL,
    balance_before      DECIMAL(12,2)   NOT NULL,
    balance_after       DECIMAL(12,2)   NOT NULL,
    reference           VARCHAR(100)    NULL,
    description         VARCHAR(255)    NULL,
    created_by          INT UNSIGNED    NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_wt_wallet (wallet_type, wallet_owner_id),
    KEY idx_wt_shipment (shipment_id),
    KEY idx_wt_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Withdrawal requests
DROP TABLE IF EXISTS withdrawal_requests;
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    requester_type      ENUM('DRIVER','COMPANY') NOT NULL,
    requester_id        INT UNSIGNED    NOT NULL,
    amount              DECIMAL(12,2)   NOT NULL,
    momo_number         VARCHAR(25)     NULL,
    momo_network        VARCHAR(30)     NULL,
    bank_details        JSON            NULL,
    gateway_code        VARCHAR(30)     NULL,
    gateway_reference   VARCHAR(150)    NULL,
    status              ENUM('PENDING','APPROVED','PROCESSING','PAID','REJECTED','FAILED') NOT NULL DEFAULT 'PENDING',
    approved_by         INT UNSIGNED    NULL,
    approval_notes      TEXT            NULL,
    processed_at        DATETIME        NULL,
    failure_reason      VARCHAR(255)    NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_wr_requester (requester_type, requester_id),
    KEY idx_wr_status (status),
    CONSTRAINT fk_wr_approver FOREIGN KEY (approved_by)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Refund records
DROP TABLE IF EXISTS refunds;
CREATE TABLE IF NOT EXISTS refunds (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    shipment_id         INT UNSIGNED    NOT NULL,
    payment_id          INT UNSIGNED    NOT NULL,
    amount              DECIMAL(10,2)   NOT NULL,
    reason              TEXT            NOT NULL,
    status              ENUM('PENDING','APPROVED','PROCESSED','REJECTED','FAILED') NOT NULL DEFAULT 'PENDING',
    gateway_reference   VARCHAR(150)    NULL,
    processed_by        INT UNSIGNED    NULL,
    processed_at        DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_refunds_shipment (shipment_id),
    KEY idx_refunds_payment (payment_id),
    CONSTRAINT fk_refunds_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id)
        REFERENCES shipment_payments (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 11 — DISPUTES & INCIDENTS
-- =============================================================================

DROP TABLE IF EXISTS disputes;
CREATE TABLE IF NOT EXISTS disputes (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    shipment_id         INT UNSIGNED    NOT NULL,
    dispute_type        ENUM('PRICE_DISAGREEMENT','MISSING_PARCEL','DAMAGED_PARCEL',
                             'WRONG_DELIVERY','DRIVER_CONDUCT','STAFF_CONDUCT',
                             'PAYMENT_ISSUE','OTHER') NOT NULL,
    raised_by           INT UNSIGNED    NOT NULL,
    against_user_id     INT UNSIGNED    NULL,
    description         TEXT            NOT NULL,
    evidence_paths      JSON            NULL,
    original_price      DECIMAL(10,2)   NULL,
    disputed_price      DECIMAL(10,2)   NULL,
    status              ENUM('open','under_review','resolved','closed','escalated') NOT NULL DEFAULT 'open',
    assigned_to         INT UNSIGNED    NULL,
    resolution_notes    TEXT            NULL,
    resolution_outcome  ENUM('upheld_customer','upheld_driver','settled','cancelled','no_action') NULL,
    resolved_at         DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_disputes_shipment (shipment_id),
    KEY idx_disputes_raised_by (raised_by),
    KEY idx_disputes_status (status),
    CONSTRAINT fk_disputes_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_disputes_raised_by FOREIGN KEY (raised_by)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_disputes_assigned FOREIGN KEY (assigned_to)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS dispute_messages;
CREATE TABLE IF NOT EXISTS dispute_messages (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    dispute_id      INT UNSIGNED    NOT NULL,
    sender_user_id  INT UNSIGNED    NOT NULL,
    message         TEXT            NOT NULL,
    attachment_path VARCHAR(255)    NULL,
    is_internal     TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_dm_dispute (dispute_id),
    CONSTRAINT fk_dm_dispute FOREIGN KEY (dispute_id)
        REFERENCES disputes (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_dm_sender FOREIGN KEY (sender_user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 12 — NOTIFICATIONS
-- =============================================================================

DROP TABLE IF EXISTS notifications;
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED    NOT NULL,
    category        VARCHAR(60)     NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    body            TEXT            NOT NULL,
    action_url      VARCHAR(255)    NULL,
    entity_type     VARCHAR(60)     NULL,
    entity_id       INT UNSIGNED    NULL,
    is_read         TINYINT(1)      NOT NULL DEFAULT 0,
    read_at         DATETIME        NULL,
    delivered_via   JSON            NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notif_user (user_id, is_read),
    KEY idx_notif_created (created_at),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 13 — MESSAGING & CALLS (Shipment-linked)
-- =============================================================================

DROP TABLE IF EXISTS shipment_messages;
CREATE TABLE IF NOT EXISTS shipment_messages (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    shipment_id     INT UNSIGNED    NOT NULL,
    sender_user_id  INT UNSIGNED    NOT NULL,
    receiver_user_id INT UNSIGNED   NOT NULL,
    message         TEXT            NOT NULL,
    attachment_path VARCHAR(255)    NULL,
    is_read         TINYINT(1)      NOT NULL DEFAULT 0,
    read_at         DATETIME        NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_sm_shipment (shipment_id),
    KEY idx_sm_sender (sender_user_id),
    KEY idx_sm_receiver (receiver_user_id, is_read),
    CONSTRAINT fk_sm_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sm_sender FOREIGN KEY (sender_user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_sm_receiver FOREIGN KEY (receiver_user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS call_sessions;
CREATE TABLE IF NOT EXISTS call_sessions (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    shipment_id         INT UNSIGNED    NULL,
    caller_user_id      INT UNSIGNED    NOT NULL,
    callee_user_id      INT UNSIGNED    NOT NULL,
    call_type           ENUM('AUDIO','VIDEO') NOT NULL DEFAULT 'AUDIO',
    provider            VARCHAR(50)     NULL,
    provider_session_id VARCHAR(150)    NULL,
    status              ENUM('initiated','ringing','active','ended','missed','rejected','failed') NOT NULL DEFAULT 'initiated',
    duration_seconds    INT UNSIGNED    NULL,
    started_at          DATETIME        NULL,
    ended_at            DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_call_shipment (shipment_id),
    KEY idx_call_caller (caller_user_id),
    KEY idx_call_callee (callee_user_id),
    CONSTRAINT fk_call_shipment FOREIGN KEY (shipment_id)
        REFERENCES shipments (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_call_caller FOREIGN KEY (caller_user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_call_callee FOREIGN KEY (callee_user_id)
        REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 14 — PLATFORM LEDGER & FLOAT
-- =============================================================================

DROP TABLE IF EXISTS platform_ledger;
CREATE TABLE IF NOT EXISTS platform_ledger (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tx_type         ENUM('FEE_INCOME','REFUND_OUT','GATEWAY_FEE','ADJUSTMENT') NOT NULL,
    amount          DECIMAL(12,2)   NOT NULL,
    shipment_id     INT UNSIGNED    NULL,
    reference       VARCHAR(100)    NULL,
    description     VARCHAR(255)    NULL,
    recorded_by     INT UNSIGNED    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_pl_type (tx_type),
    KEY idx_pl_shipment (shipment_id),
    KEY idx_pl_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- SECTION 15 — SUPPORT TICKETS
-- =============================================================================

DROP TABLE IF EXISTS support_tickets;
CREATE TABLE IF NOT EXISTS support_tickets (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED    NULL,
    shipment_id     INT UNSIGNED    NULL,
    category        VARCHAR(80)     NOT NULL,
    subject         VARCHAR(255)    NOT NULL,
    status          ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
    priority        ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
    assigned_to     INT UNSIGNED    NULL,
    resolved_at     DATETIME        NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_st_user (user_id),
    KEY idx_st_shipment (shipment_id),
    KEY idx_st_status (status),
    CONSTRAINT fk_st_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_st_assigned FOREIGN KEY (assigned_to)
        REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS support_messages;
CREATE TABLE IF NOT EXISTS support_messages (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    ticket_id       INT UNSIGNED    NOT NULL,
    sender_user_id  INT UNSIGNED    NULL,
    sender_name     VARCHAR(100)    NULL,
    message         TEXT            NOT NULL,
    is_staff        TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_supm_ticket (ticket_id),
    CONSTRAINT fk_supm_ticket FOREIGN KEY (ticket_id)
        REFERENCES support_tickets (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SECTION 16 — SEED DATA (System Config only — 30+ rows)
-- =============================================================================

INSERT INTO payment_gateways (code, name, mode, is_enabled, is_default, is_configured, display_order, config_json)
VALUES
    ('paystack', 'Paystack', 'test', 1, 1, 0, 1, JSON_OBJECT('currency','GHS','channels',JSON_ARRAY('mobile_money','card'),'transfers',true,'payouts',true)),
    ('hubtel',   'Hubtel Direct MoMo', 'test', 0, 0, 0, 2, JSON_OBJECT('currency','GHS','channels',JSON_ARRAY('mobile_money'),'transfers',true)),
    ('flutterwave','Flutterwave', 'test', 0, 0, 0, 3, JSON_OBJECT('currency','GHS','channels',JSON_ARRAY('mobile_money','card','bank_transfer')))
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO sms_gateways (code, name, mode, is_enabled, is_default, is_configured, display_order, config_json)
VALUES
    ('moolre',  'Moolre SMS',  'test', 0, 0, 0, 1, JSON_OBJECT('sandbox_url','https://api.moolre.com/sandbox/sms','live_url','https://api.moolre.com/v1/sms','notes','Ghana-based gateway with MoMo integration.')),
    ('arkesel', 'Arkesel SMS', 'test', 1, 1, 0, 2, JSON_OBJECT('sandbox_url','https://sms.arkesel.com/sms/api','live_url','https://sms.arkesel.com/sms/api','notes','Ghana SMS provider.')),
    ('hubtel_sms','Hubtel SMS','test', 0, 0, 0, 3, JSON_OBJECT('sandbox_url','https://smsc.hubtel.com/v1/messages/send','live_url','https://smsc.hubtel.com/v1/messages/send','notes','Hubtel SMS channel.')),
    ('twilio',  'Twilio SMS',  'test', 0, 0, 0, 4, JSON_OBJECT('live_url','https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json','notes','Global SMS fallback.'))
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO cron_jobs (job_key, description, interval_minutes) VALUES
    ('expire_otps',           'Expire unused OTP tokens older than their TTL',                5),
    ('release_driver_funds',  'Auto-release held delivery funds after confirmed delivery',    10),
    ('payment_reconcile',     'Match unconfirmed gateway payments against webhooks',           5),
    ('notification_cleanup',  'Archive read notifications older than 60 days',              1440),
    ('session_cleanup',       'Delete expired and revoked user sessions',                    720)
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO system_config (category, config_key, config_value, description, is_public) VALUES
    ('platform',      'platform.name',                    'Transcage',                       'Brand name',                                   1),
    ('platform',      'platform.tagline',                 'One connected platform. Every delivery accounted for.', 'Brand tagline',         1),
    ('platform',      'platform.country',                 'Ghana',                           'Default operating country',                    1),
    ('platform',      'platform.currency',                'GHS',                             'Default currency code',                        1),
    ('platform',      'platform.currency_symbol',         '₵',                               'Currency display symbol',                      1),
    ('platform',      'platform.support_email',           'support@transcage.com',           'Public support email',                         1),
    ('platform',      'platform.support_phone',           '+233000000000',                   'Public support phone',                         1),
    ('platform',      'platform.timezone',                'Africa/Accra',                    'Platform timezone',                            1),
    ('platform',      'platform.env',                     'development',                     'Current environment: development|production',   0),
    ('sms',           'sms.provider',                     'arkesel',                         'Active SMS gateway code',                      0),
    ('sms',           'sms.sender_id',                    'TRANSCAGE',                       'SMS sender name shown to recipients',           0),
    ('sms',           'sms.otp_ttl_minutes',              '10',                              'OTP validity window in minutes',               0),
    ('sms',           'sms.otp_length',                   '6',                               'Number of digits in OTP codes',                0),
    ('sms',           'sms.enabled',                      '1',                               'Enable SMS sending (0=disabled)',              0),
    ('email',         'email.provider',                   'smtp',                            'Email delivery provider',                      0),
    ('email',         'email.from_name',                  'Transcage',                       'Display name on outgoing emails',              0),
    ('email',         'email.from_address',               'noreply@transcage.com',           'From address for outgoing emails',             0),
    ('email',         'email.smtp_host',                  'smtp.example.com',                'SMTP host',                                    0),
    ('email',         'email.smtp_port',                  '587',                             'SMTP port',                                    0),
    ('email',         'email.smtp_encryption',            'tls',                             'SMTP encryption: tls|ssl|none',                0),
    ('payments',      'payments.platform_fee_percent',    '5',                               'Platform fee % on point-to-point deliveries',  0),
    ('payments',      'payments.station_fee_percent',     '3',                               'Platform fee % on station-to-station payments', 0),
    ('payments',      'payments.min_withdrawal',          '50',                              'Minimum withdrawal amount in GHS',             0),
    ('payments',      'payments.hold_release_hours',      '24',                              'Hours before auto-release of held P2P funds',  0),
    ('payments',      'payments.refund_window_days',      '7',                               'Days within which a refund can be initiated',  0),
    ('notifications', 'notifications.in_app_enabled',     '1',                               'Enable in-app notifications',                  0),
    ('notifications', 'notifications.push_enabled',       '1',                               'Enable browser push notifications',            0),
    ('notifications', 'notifications.sms_critical_only',  '0',                               'Limit SMS to critical events only',            0),
    ('tracking',      'tracking.prefix',                  'TC',                              'Tracking number prefix (e.g. TC2411001)',       1),
    ('tracking',      'tracking.public_tracking',         '1',                               'Allow public parcel tracking without login',    1),
    ('security',      'security.jwt_secret',              'CHANGE_THIS_IN_PRODUCTION',       'JWT signing secret — MUST be changed',          0),
    ('security',      'security.jwt_ttl_minutes',         '1440',                            'JWT token validity in minutes (24h)',           0),
    ('security',      'security.max_login_attempts',      '5',                               'Max failed logins before lockout',             0),
    ('security',      'security.lockout_minutes',         '30',                              'Account lockout duration after failed logins',  0),
    ('calls',         'calls.provider',                   'daily.co',                        'WebRTC calling provider',                      0),
    ('calls',         'calls.enabled',                    '1',                               'Enable in-platform voice calls',               0),
    ('cron',          'cron.last_run',                    '0',                               'Unix timestamp of last cron execution',         0),
    ('cron',          'cron.cooldown_seconds',            '300',                             'Minimum seconds between cron runs',            0)
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
