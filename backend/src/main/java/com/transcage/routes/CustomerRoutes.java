package com.transcage.routes;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.transcage.Database;
import com.transcage.helpers.ResponseHelper;
import com.transcage.middleware.AuthMiddleware;
import io.javalin.Javalin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.*;

public class CustomerRoutes {

    private static final Logger log = LoggerFactory.getLogger(CustomerRoutes.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void register(Javalin app) {

        // ── GET /api/v1/customer/shipments — paginated list ─────────────────
        app.get("/api/v1/customer/shipments", ctx -> {
            AuthMiddleware.requireRole(ctx, "CUSTOMER", "DRIVER", "OVERSEER", "COMPANY_OWNER", "COMPANY_ADMIN", "PLATFORM_ADMIN");
            if (ctx.status().getCode() != 200) return;

            int userId = ctx.attribute("userId");
            int page   = Math.max(1, intParam(ctx.queryParam("page"), 1));
            int limit  = 20;
            int offset = (page - 1) * limit;

            try (Connection conn = Database.getConnection()) {
                String sql = """
                    SELECT s.id, s.tracking_number, s.delivery_model, s.status,
                           s.recipient_name, s.payment_status,
                           s.origin_city, s.destination_city,
                           os.name AS origin_station_name, ds.name AS dest_station_name,
                           s.created_at
                    FROM shipments s
                    LEFT JOIN stations os ON s.origin_station_id = os.id
                    LEFT JOIN stations ds ON s.destination_station_id = ds.id
                    WHERE s.sender_id = ?
                    ORDER BY s.created_at DESC
                    LIMIT ? OFFSET ?
                """;

                List<Map<String, Object>> rows = new ArrayList<>();
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setInt(1, userId);
                    ps.setInt(2, limit);
                    ps.setInt(3, offset);
                    ResultSet rs = ps.executeQuery();
                    while (rs.next()) {
                        Map<String, Object> row = new LinkedHashMap<>();
                        row.put("id", rs.getInt("id"));
                        row.put("tracking_number", rs.getString("tracking_number"));
                        row.put("delivery_model", rs.getString("delivery_model"));
                        row.put("status", rs.getString("status"));
                        row.put("recipient_name", rs.getString("recipient_name"));
                        row.put("payment_status", rs.getString("payment_status"));
                        String origin = rs.getString("origin_station_name");
                        String dest   = rs.getString("dest_station_name");
                        row.put("origin",      origin != null ? origin : rs.getString("origin_city"));
                        row.put("destination", dest   != null ? dest   : rs.getString("destination_city"));
                        row.put("created_at", rs.getString("created_at"));
                        rows.add(row);
                    }
                }
                ResponseHelper.ok(ctx, "Shipments", rows);

            } catch (SQLException e) {
                log.error("[Transcage][Customer] getShipments error: {}", e.getMessage());
                ResponseHelper.serverError(ctx, "Could not load shipments");
            }
        });

        // ── POST /api/v1/customer/shipments — create shipment request ────────
        app.post("/api/v1/customer/shipments", ctx -> {
            AuthMiddleware.requireRole(ctx, "CUSTOMER", "PLATFORM_ADMIN");
            if (ctx.status().getCode() != 200) return;

            int userId = ctx.attribute("userId");
            Map<String, Object> body;
            try {
                body = mapper.readValue(ctx.body(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                ResponseHelper.badRequest(ctx, "Invalid JSON body");
                return;
            }

            String deliveryModel    = str(body, "delivery_model");
            String recipientName    = str(body, "recipient_name");
            String recipientPhone   = str(body, "recipient_phone");
            String parcelDesc       = str(body, "parcel_description");
            String parcelCategory   = str(body, "parcel_category");
            String originCity       = str(body, "origin_city");
            String destinationCity  = str(body, "destination_city");
            String recipientAddress = str(body, "recipient_address");

            if (deliveryModel == null || (!deliveryModel.equals("STATION_TO_STATION") && !deliveryModel.equals("LOCAL_P2P"))) {
                ResponseHelper.badRequest(ctx, "delivery_model must be STATION_TO_STATION or LOCAL_P2P");
                return;
            }
            if (recipientName == null || recipientName.isEmpty()) { ResponseHelper.badRequest(ctx, "recipient_name is required"); return; }
            if (recipientPhone == null || recipientPhone.isEmpty()) { ResponseHelper.badRequest(ctx, "recipient_phone is required"); return; }
            if (parcelDesc == null || parcelDesc.isEmpty()) { ResponseHelper.badRequest(ctx, "parcel_description is required"); return; }

            Integer originStationId = intObj(body, "origin_station_id");
            Integer destStationId   = intObj(body, "destination_station_id");
            Double  weightKg        = doubleObj(body, "parcel_weight_kg");

            // Tracking number: TC + YY + MM + 6-digit seq — use UUID for now
            String trackingNumber = generateTrackingNumber();

            try (Connection conn = Database.getConnection()) {
                String sql = """
                    INSERT INTO shipments
                     (tracking_number, sender_id, delivery_model, status, payment_status,
                      recipient_name, recipient_phone, recipient_address,
                      parcel_description, parcel_category, parcel_weight_kg,
                      origin_station_id, destination_station_id,
                      origin_city, destination_city)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """;

                int shipmentId;
                try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setString(1, trackingNumber);
                    ps.setInt(2, userId);
                    ps.setString(3, deliveryModel);
                    ps.setString(4, "REQUEST_CREATED");
                    ps.setString(5, "pending");
                    ps.setString(6, recipientName);
                    ps.setString(7, recipientPhone);
                    ps.setString(8, recipientAddress);
                    ps.setString(9, parcelDesc);
                    ps.setString(10, parcelCategory);
                    if (weightKg != null) ps.setDouble(11, weightKg); else ps.setNull(11, Types.DECIMAL);
                    if (originStationId != null) ps.setInt(12, originStationId); else ps.setNull(12, Types.INTEGER);
                    if (destStationId != null)   ps.setInt(13, destStationId);   else ps.setNull(13, Types.INTEGER);
                    ps.setString(14, originCity);
                    ps.setString(15, destinationCity);
                    ps.executeUpdate();
                    ResultSet rs = ps.getGeneratedKeys();
                    rs.next();
                    shipmentId = rs.getInt(1);
                }

                // Initial status log
                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO shipment_status_logs (shipment_id, new_status, changed_by_user_id, notes, is_customer_visible) VALUES (?,?,?,?,?)")) {
                    ps.setInt(1, shipmentId);
                    ps.setString(2, "REQUEST_CREATED");
                    ps.setInt(3, userId);
                    ps.setString(4, "Shipment request created by sender");
                    ps.setBoolean(5, true);
                    ps.executeUpdate();
                }

                Map<String, Object> data = new LinkedHashMap<>();
                data.put("shipment_id", shipmentId);
                data.put("tracking_number", trackingNumber);
                data.put("delivery_model", deliveryModel);
                data.put("status", "REQUEST_CREATED");

                ResponseHelper.created(ctx, "Shipment request created", data);

            } catch (SQLException e) {
                log.error("[Transcage][Customer] createShipment error: {}", e.getMessage());
                ResponseHelper.serverError(ctx, "Could not create shipment");
            }
        });

        // ── GET /api/v1/customer/shipments/{id} — single shipment detail ─────
        app.get("/api/v1/customer/shipments/{id}", ctx -> {
            AuthMiddleware.requireAuth(ctx);
            if (ctx.status().getCode() == 401) return;

            int userId     = ctx.attribute("userId");
            int shipmentId = intParam(ctx.pathParam("id"), 0);
            if (shipmentId == 0) { ResponseHelper.badRequest(ctx, "Invalid shipment id"); return; }

            try (Connection conn = Database.getConnection()) {
                String sql = """
                    SELECT s.*, os.name AS origin_station_name, ds.name AS dest_station_name,
                           u.full_name AS sender_name
                    FROM shipments s
                    LEFT JOIN stations os ON s.origin_station_id = os.id
                    LEFT JOIN stations ds ON s.destination_station_id = ds.id
                    LEFT JOIN users u ON s.sender_id = u.id
                    WHERE s.id = ? AND s.sender_id = ?
                    LIMIT 1
                """;
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setInt(1, shipmentId);
                    ps.setInt(2, userId);
                    ResultSet rs = ps.executeQuery();
                    if (!rs.next()) { ResponseHelper.notFound(ctx, "Shipment not found"); return; }
                    Map<String, Object> data = resultSetToMap(rs);
                    data.put("origin",      rs.getString("origin_station_name") != null ? rs.getString("origin_station_name") : rs.getString("origin_city"));
                    data.put("destination", rs.getString("dest_station_name") != null ? rs.getString("dest_station_name") : rs.getString("destination_city"));
                    ResponseHelper.ok(ctx, "Shipment detail", data);
                }
            } catch (SQLException e) {
                log.error("[Transcage][Customer] getShipment error: {}", e.getMessage());
                ResponseHelper.serverError(ctx, "Could not fetch shipment");
            }
        });

        // ── GET /api/v1/stations — list active stations (for form dropdowns) ─
        app.get("/api/v1/stations", ctx -> {
            try (Connection conn = Database.getConnection()) {
                List<Map<String, Object>> stations = new ArrayList<>();
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT id, name, city, region, address FROM stations WHERE status = 'active' ORDER BY city, name")) {
                    ResultSet rs = ps.executeQuery();
                    while (rs.next()) {
                        Map<String, Object> st = new LinkedHashMap<>();
                        st.put("id",      rs.getInt("id"));
                        st.put("name",    rs.getString("name"));
                        st.put("city",    rs.getString("city"));
                        st.put("region",  rs.getString("region"));
                        st.put("address", rs.getString("address"));
                        stations.add(st);
                    }
                }
                ResponseHelper.ok(ctx, "Stations", stations);
            } catch (SQLException e) {
                log.error("[Transcage][Customer] stations error: {}", e.getMessage());
                ResponseHelper.serverError(ctx, "Could not load stations");
            }
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private static String generateTrackingNumber() {
        java.time.LocalDate now = java.time.LocalDate.now();
        String seq = String.valueOf((int)(Math.random() * 900000) + 100000);
        return String.format("TC%02d%02d%s", now.getYear() % 100, now.getMonthValue(), seq);
    }

    private static String str(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v != null && !v.toString().isBlank() ? v.toString().trim() : null;
    }

    private static int intParam(String val, int def) {
        try { return val != null ? Integer.parseInt(val) : def; } catch (Exception e) { return def; }
    }

    private static Integer intObj(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return null; }
    }

    private static Double doubleObj(Map<String, Object> body, String key) {
        Object v = body.get(key);
        if (v == null) return null;
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return null; }
    }

    private static Map<String, Object> resultSetToMap(ResultSet rs) throws SQLException {
        ResultSetMetaData meta = rs.getMetaData();
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 1; i <= meta.getColumnCount(); i++) {
            map.put(meta.getColumnLabel(i), rs.getObject(i));
        }
        return map;
    }
}
