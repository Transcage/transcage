package com.transcage.routes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transcage.Database;
import com.transcage.helpers.ResponseHelper;
import com.transcage.middleware.AuthMiddleware;
import io.javalin.Javalin;
import io.javalin.http.Context;

import java.sql.*;
import java.util.*;

/**
 * Transcage — Station Clerk Routes
 *
 * POST /api/v1/clerk/shipments/:id/intake        — record parcel received at station, set initial weight/price
 * GET  /api/v1/clerk/queue                       — pending shipments at clerk's station
 * GET  /api/v1/clerk/shipments/:id               — single shipment detail for clerk
 * POST /api/v1/clerk/shipments/:id/assign-driver — assign a driver for P2P shipment
 * POST /api/v1/clerk/shipments/:id/dispatch      — mark dispatched from origin station (S2S)
 * POST /api/v1/clerk/shipments/:id/receive       — record parcel received at destination station
 * POST /api/v1/clerk/shipments/:id/otp/generate  — generate pickup/delivery OTP
 * POST /api/v1/clerk/shipments/:id/otp/verify    — verify OTP and advance status
 * GET  /api/v1/clerk/drivers                     — list available drivers for assignment
 */
public class ClerkRoutes {

    private static final ObjectMapper OM = new ObjectMapper();

    public static void register(Javalin app) {

        // ── Intake: parcel dropped at origin station ──────────────────────────
        app.post("/api/v1/clerk/shipments/{id}/intake", ctx -> {
            AuthMiddleware.requireRole(ctx, "STATION_STAFF", "STATION_CLERK", "COMPANY_ADMIN", "PLATFORM_ADMIN");
            if (ctx.status().getCode() >= 400) return;
            handleIntake(ctx);
        });

        // ── Clerk queue ───────────────────────────────────────────────────────
        app.get("/api/v1/clerk/queue", ctx -> {
            AuthMiddleware.requireRole(ctx, "STATION_STAFF", "STATION_CLERK", "COMPANY_ADMIN", "PLATFORM_ADMIN");
            if (ctx.status().getCode() >= 400) return;
            handleQueue(ctx);
        });

        // ── Single shipment detail ────────────────────────────────────────────
        app.get("/api/v1/clerk/shipments/{id}", ctx -> {
            AuthMiddleware.requireRole(ctx, "STATION_STAFF", "STATION_CLERK", "COMPANY_ADMIN", "PLATFORM_ADMIN");
            if (ctx.status().getCode() >= 400) return;
            handleDetail(ctx);
        });

        // ── Assign driver (P2P) ───────────────────────────────────────────────
        app.post("/api/v1/clerk/shipments/{id}/assign-driver", ctx -> {
            AuthMiddleware.requireRole(ctx, "STATION_STAFF", "STATION_CLERK", "COMPANY_ADMIN", "PLATFORM_ADMIN");
            if (ctx.status().getCode() >= 400) return;
            handleAssignDriver(ctx);
        });

        // ── Dispatch from origin station (S2S) ───────────────────────────────
        app.post("/api/v1/clerk/shipments/{id}/dispatch", ctx -> {
            AuthMiddleware.requireRole(ctx, "STATION_STAFF", "STATION_CLERK", "COMPANY_ADMIN", "PLATFORM_ADMIN");
            if (ctx.status().getCode() >= 400) return;
            handleDispatch(ctx);
        });

        // ── Receive at destination station ────────────────────────────────────
        app.post("/api/v1/clerk/shipments/{id}/receive", ctx -> {
            AuthMiddleware.requireRole(ctx, "STATION_STAFF", "STATION_CLERK", "COMPANY_ADMIN", "PLATFORM_ADMIN");
            if (ctx.status().getCode() >= 400) return;
            handleReceive(ctx);
        });

        // ── Generate OTP for pickup/delivery ─────────────────────────────────
        app.post("/api/v1/clerk/shipments/{id}/otp/generate", ctx -> {
            AuthMiddleware.requireRole(ctx, "STATION_STAFF", "STATION_CLERK", "COMPANY_ADMIN", "PLATFORM_ADMIN");
            if (ctx.status().getCode() >= 400) return;
            handleGenerateOtp(ctx);
        });

        // ── Verify OTP and advance status ─────────────────────────────────────
        app.post("/api/v1/clerk/shipments/{id}/otp/verify", ctx -> {
            AuthMiddleware.requireRole(ctx, "STATION_STAFF", "STATION_CLERK", "COMPANY_ADMIN", "PLATFORM_ADMIN");
            if (ctx.status().getCode() >= 400) return;
            handleVerifyOtp(ctx);
        });

        // ── List available drivers ────────────────────────────────────────────
        app.get("/api/v1/clerk/drivers", ctx -> {
            AuthMiddleware.requireRole(ctx, "STATION_STAFF", "STATION_CLERK", "COMPANY_ADMIN", "PLATFORM_ADMIN");
            if (ctx.status().getCode() >= 400) return;
            handleListDrivers(ctx);
        });
    }

    // ── Intake handler ────────────────────────────────────────────────────────
    private static void handleIntake(Context ctx) {
        int shipmentId;
        try { shipmentId = Integer.parseInt(ctx.pathParam("id")); }
        catch (NumberFormatException e) { ResponseHelper.badRequest(ctx, "Invalid shipment ID"); return; }

        Map<String, Object> body = parseBody(ctx);
        if (body == null) return;

        Double actualWeight = getDouble(body, "actual_weight_kg");
        Double price        = getDouble(body, "price");
        String notes        = getString(body, "notes");

        try (Connection conn = Database.getConnection()) {
            // Verify shipment exists and is awaiting intake
            String checkSql = "SELECT id, status, origin_station_id FROM shipments WHERE id = ?";
            try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
                ps.setInt(1, shipmentId);
                ResultSet rs = ps.executeQuery();
                if (!rs.next()) { ResponseHelper.notFound(ctx, "Shipment not found"); return; }
                String status = rs.getString("status");
                if (!"REQUEST_CREATED".equals(status) && !"AWAITING_STATION_INTAKE".equals(status)) {
                    ResponseHelper.badRequest(ctx, "Shipment is not awaiting intake (status: " + status + ")");
                    return;
                }
            }

            // Update shipment
            StringBuilder sql = new StringBuilder("UPDATE shipments SET status = 'AT_ORIGIN_STATION', updated_at = NOW()");
            if (actualWeight != null) sql.append(", weight_kg = ").append(actualWeight);
            if (price        != null) sql.append(", price = ").append(price);
            sql.append(" WHERE id = ?");

            try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
                ps.setInt(1, shipmentId);
                ps.executeUpdate();
            }

            // Write audit log
            insertLog(conn, shipmentId, ctx.attribute("userId"), "AT_ORIGIN_STATION", "Parcel received at origin station" + (notes != null ? ": " + notes : ""), null);

            ResponseHelper.ok(ctx, "Parcel intake recorded successfully");
        } catch (Exception e) {
            ResponseHelper.serverError(ctx, "Database error: " + e.getMessage());
        }
    }

    // ── Queue handler ─────────────────────────────────────────────────────────
    private static void handleQueue(Context ctx) {
        String filter   = ctx.queryParam("filter");   // all | pending | dispatched
        String search   = ctx.queryParam("search");
        int    page     = parseIntParam(ctx.queryParam("page"), 1);
        int    pageSize = 20;
        int    offset   = (page - 1) * pageSize;

        // Status filters
        List<String> statusFilter = new ArrayList<>();
        if ("pending".equals(filter)) {
            statusFilter.addAll(Arrays.asList("REQUEST_CREATED", "AWAITING_STATION_INTAKE", "AT_ORIGIN_STATION", "DRIVER_ASSIGNED"));
        } else if ("dispatched".equals(filter)) {
            statusFilter.addAll(Arrays.asList("IN_TRANSIT", "AT_DESTINATION_STATION", "OUT_FOR_DELIVERY"));
        } else {
            statusFilter.addAll(Arrays.asList(
                "REQUEST_CREATED", "AWAITING_STATION_INTAKE", "AT_ORIGIN_STATION",
                "DRIVER_ASSIGNED", "IN_TRANSIT", "AT_DESTINATION_STATION", "OUT_FOR_DELIVERY"
            ));
        }

        String inClause = String.join(",", Collections.nCopies(statusFilter.size(), "?"));

        try (Connection conn = Database.getConnection()) {
            StringBuilder sql = new StringBuilder(
                "SELECT s.id, s.tracking_number, s.status, s.delivery_model, " +
                "s.recipient_name, s.recipient_phone, s.parcel_description, " +
                "s.price, s.weight_kg, s.created_at, " +
                "os.name AS origin_station, ds.name AS dest_station, " +
                "u.full_name AS customer_name " +
                "FROM shipments s " +
                "LEFT JOIN stations os ON s.origin_station_id = os.id " +
                "LEFT JOIN stations ds ON s.destination_station_id = ds.id " +
                "JOIN users u ON s.customer_user_id = u.id " +
                "WHERE s.status IN (" + inClause + ")"
            );

            List<Object> params = new ArrayList<>(statusFilter);

            if (search != null && !search.isBlank()) {
                sql.append(" AND (s.tracking_number LIKE ? OR s.recipient_name LIKE ? OR s.recipient_phone LIKE ?)");
                String like = "%" + search.trim() + "%";
                params.add(like); params.add(like); params.add(like);
            }

            sql.append(" ORDER BY s.created_at DESC LIMIT ? OFFSET ?");
            params.add(pageSize); params.add(offset);

            try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
                for (int i = 0; i < params.size(); i++) {
                    Object p = params.get(i);
                    if (p instanceof Integer) ps.setInt(i + 1, (Integer) p);
                    else ps.setString(i + 1, (String) p);
                }
                ResultSet rs = ps.executeQuery();
                List<Map<String, Object>> rows = new ArrayList<>();
                while (rs.next()) rows.add(rowToMap(rs));
                ResponseHelper.ok(ctx, "Queue loaded", rows);
            }
        } catch (Exception e) {
            ResponseHelper.serverError(ctx, "Database error: " + e.getMessage());
        }
    }

    // ── Detail handler ────────────────────────────────────────────────────────
    private static void handleDetail(Context ctx) {
        int shipmentId;
        try { shipmentId = Integer.parseInt(ctx.pathParam("id")); }
        catch (NumberFormatException e) { ResponseHelper.badRequest(ctx, "Invalid shipment ID"); return; }

        try (Connection conn = Database.getConnection()) {
            String sql =
                "SELECT s.*, " +
                "os.name AS origin_station_name, ds.name AS dest_station_name, " +
                "u.full_name AS customer_name, u.phone AS customer_phone " +
                "FROM shipments s " +
                "LEFT JOIN stations os ON s.origin_station_id = os.id " +
                "LEFT JOIN stations ds ON s.destination_station_id = ds.id " +
                "JOIN users u ON s.customer_user_id = u.id " +
                "WHERE s.id = ?";

            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, shipmentId);
                ResultSet rs = ps.executeQuery();
                if (!rs.next()) { ResponseHelper.notFound(ctx, "Shipment not found"); return; }
                Map<String, Object> row = rowToMap(rs);

                // Attach audit log / timeline
                row.put("timeline", fetchTimeline(conn, shipmentId));
                ResponseHelper.ok(ctx, "Shipment loaded", row);
            }
        } catch (Exception e) {
            ResponseHelper.serverError(ctx, "Database error: " + e.getMessage());
        }
    }

    // ── Assign driver ─────────────────────────────────────────────────────────
    private static void handleAssignDriver(Context ctx) {
        int shipmentId;
        try { shipmentId = Integer.parseInt(ctx.pathParam("id")); }
        catch (NumberFormatException e) { ResponseHelper.badRequest(ctx, "Invalid shipment ID"); return; }

        Map<String, Object> body = parseBody(ctx);
        if (body == null) return;

        Integer driverId = getInt(body, "driver_user_id");
        if (driverId == null) { ResponseHelper.badRequest(ctx, "driver_user_id is required"); return; }

        try (Connection conn = Database.getConnection()) {
            // Update shipment
            String sql = "UPDATE shipments SET driver_user_id = ?, status = 'DRIVER_ASSIGNED', updated_at = NOW() WHERE id = ?";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, driverId); ps.setInt(2, shipmentId);
                int rows = ps.executeUpdate();
                if (rows == 0) { ResponseHelper.notFound(ctx, "Shipment not found"); return; }
            }
            insertLog(conn, shipmentId, ctx.attribute("userId"), "DRIVER_ASSIGNED", "Driver assigned (ID: " + driverId + ")", null);
            ResponseHelper.ok(ctx, "Driver assigned successfully");
        } catch (Exception e) {
            ResponseHelper.serverError(ctx, "Database error: " + e.getMessage());
        }
    }

    // ── Dispatch from origin station ──────────────────────────────────────────
    private static void handleDispatch(Context ctx) {
        int shipmentId;
        try { shipmentId = Integer.parseInt(ctx.pathParam("id")); }
        catch (NumberFormatException e) { ResponseHelper.badRequest(ctx, "Invalid shipment ID"); return; }

        Map<String, Object> body = parseBody(ctx);
        String notes = body != null ? getString(body, "notes") : null;

        try (Connection conn = Database.getConnection()) {
            String sql = "UPDATE shipments SET status = 'IN_TRANSIT', updated_at = NOW() WHERE id = ? AND status = 'AT_ORIGIN_STATION'";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, shipmentId);
                int rows = ps.executeUpdate();
                if (rows == 0) { ResponseHelper.badRequest(ctx, "Shipment cannot be dispatched in its current status"); return; }
            }
            insertLog(conn, shipmentId, ctx.attribute("userId"), "IN_TRANSIT", "Dispatched from origin station" + (notes != null ? ": " + notes : ""), null);
            ResponseHelper.ok(ctx, "Shipment dispatched successfully");
        } catch (Exception e) {
            ResponseHelper.serverError(ctx, "Database error: " + e.getMessage());
        }
    }

    // ── Receive at destination station ────────────────────────────────────────
    private static void handleReceive(Context ctx) {
        int shipmentId;
        try { shipmentId = Integer.parseInt(ctx.pathParam("id")); }
        catch (NumberFormatException e) { ResponseHelper.badRequest(ctx, "Invalid shipment ID"); return; }

        Map<String, Object> body = parseBody(ctx);
        String notes = body != null ? getString(body, "notes") : null;

        try (Connection conn = Database.getConnection()) {
            String sql = "UPDATE shipments SET status = 'AT_DESTINATION_STATION', updated_at = NOW() WHERE id = ? AND status = 'IN_TRANSIT'";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, shipmentId);
                int rows = ps.executeUpdate();
                if (rows == 0) { ResponseHelper.badRequest(ctx, "Shipment is not in transit"); return; }
            }
            insertLog(conn, shipmentId, ctx.attribute("userId"), "AT_DESTINATION_STATION", "Arrived at destination station" + (notes != null ? ": " + notes : ""), null);
            ResponseHelper.ok(ctx, "Parcel received at destination station");
        } catch (Exception e) {
            ResponseHelper.serverError(ctx, "Database error: " + e.getMessage());
        }
    }

    // ── Generate OTP ──────────────────────────────────────────────────────────
    private static void handleGenerateOtp(Context ctx) {
        int shipmentId;
        try { shipmentId = Integer.parseInt(ctx.pathParam("id")); }
        catch (NumberFormatException e) { ResponseHelper.badRequest(ctx, "Invalid shipment ID"); return; }

        Map<String, Object> body = parseBody(ctx);
        if (body == null) return;
        String otpType = getString(body, "otp_type"); // PICKUP | DELIVERY
        if (otpType == null) { ResponseHelper.badRequest(ctx, "otp_type is required (PICKUP or DELIVERY)"); return; }

        // Generate a 6-digit OTP
        String otp = String.format("%06d", (int)(Math.random() * 1_000_000));
        Timestamp expiresAt = new Timestamp(System.currentTimeMillis() + 30L * 60 * 1000); // 30 min

        try (Connection conn = Database.getConnection()) {
            // Expire any existing active OTPs of this type
            String expire = "UPDATE shipment_otps SET status = 'EXPIRED' WHERE shipment_id = ? AND otp_type = ? AND status = 'PENDING'";
            try (PreparedStatement ps = conn.prepareStatement(expire)) {
                ps.setInt(1, shipmentId); ps.setString(2, otpType); ps.executeUpdate();
            }

            // Insert new OTP
            String insert = "INSERT INTO shipment_otps (shipment_id, otp_type, otp_code, expires_at, status) VALUES (?, ?, ?, ?, 'PENDING')";
            try (PreparedStatement ps = conn.prepareStatement(insert)) {
                ps.setInt(1, shipmentId); ps.setString(2, otpType);
                ps.setString(3, otp); ps.setTimestamp(4, expiresAt);
                ps.executeUpdate();
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("otp_code", otp);
            result.put("expires_at", expiresAt.toString());
            result.put("otp_type", otpType);
            ResponseHelper.ok(ctx, "OTP generated", result);
        } catch (Exception e) {
            ResponseHelper.serverError(ctx, "Database error: " + e.getMessage());
        }
    }

    // ── Verify OTP ────────────────────────────────────────────────────────────
    private static void handleVerifyOtp(Context ctx) {
        int shipmentId;
        try { shipmentId = Integer.parseInt(ctx.pathParam("id")); }
        catch (NumberFormatException e) { ResponseHelper.badRequest(ctx, "Invalid shipment ID"); return; }

        Map<String, Object> body = parseBody(ctx);
        if (body == null) return;

        String otpCode = getString(body, "otp_code");
        String otpType = getString(body, "otp_type"); // PICKUP | DELIVERY
        if (otpCode == null || otpType == null) {
            ResponseHelper.badRequest(ctx, "otp_code and otp_type are required"); return;
        }

        try (Connection conn = Database.getConnection()) {
            String findSql =
                "SELECT id, otp_code, expires_at, status FROM shipment_otps " +
                "WHERE shipment_id = ? AND otp_type = ? AND status = 'PENDING' " +
                "ORDER BY created_at DESC LIMIT 1";
            int otpRowId;
            try (PreparedStatement ps = conn.prepareStatement(findSql)) {
                ps.setInt(1, shipmentId); ps.setString(2, otpType);
                ResultSet rs = ps.executeQuery();
                if (!rs.next()) { ResponseHelper.badRequest(ctx, "No active OTP found for this shipment"); return; }
                otpRowId = rs.getInt("id");
                String stored  = rs.getString("otp_code");
                Timestamp exp  = rs.getTimestamp("expires_at");
                if (!stored.equals(otpCode)) {
                    ResponseHelper.badRequest(ctx, "Incorrect OTP code"); return;
                }
                if (exp.before(new Timestamp(System.currentTimeMillis()))) {
                    ResponseHelper.badRequest(ctx, "OTP has expired"); return;
                }
            }

            // Mark OTP used
            String markUsed = "UPDATE shipment_otps SET status = 'USED', used_at = NOW() WHERE id = ?";
            try (PreparedStatement ps = conn.prepareStatement(markUsed)) {
                ps.setInt(1, otpRowId); ps.executeUpdate();
            }

            // Advance shipment status
            String newStatus = "PICKUP".equals(otpType) ? "PICKED_UP_BY_DRIVER" : "DELIVERED";
            String advance   = "UPDATE shipments SET status = ?, updated_at = NOW() WHERE id = ?";
            try (PreparedStatement ps = conn.prepareStatement(advance)) {
                ps.setString(1, newStatus); ps.setInt(2, shipmentId); ps.executeUpdate();
            }

            insertLog(conn, shipmentId, ctx.attribute("userId"), newStatus, "OTP verified — " + otpType, null);
            ResponseHelper.ok(ctx, "OTP verified. Status updated to " + newStatus);
        } catch (Exception e) {
            ResponseHelper.serverError(ctx, "Database error: " + e.getMessage());
        }
    }

    // ── List drivers ──────────────────────────────────────────────────────────
    private static void handleListDrivers(Context ctx) {
        try (Connection conn = Database.getConnection()) {
            String sql =
                "SELECT u.id, u.full_name, u.phone, u.driver_status " +
                "FROM users u " +
                "WHERE u.role = 'DRIVER' AND u.driver_status = 'AVAILABLE' " +
                "ORDER BY u.full_name";
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ResultSet rs = ps.executeQuery();
                List<Map<String, Object>> rows = new ArrayList<>();
                while (rs.next()) rows.add(rowToMap(rs));
                ResponseHelper.ok(ctx, "Drivers loaded", rows);
            }
        } catch (Exception e) {
            ResponseHelper.serverError(ctx, "Database error: " + e.getMessage());
        }
    }

    // ── Shared helpers ────────────────────────────────────────────────────────
    private static void insertLog(Connection conn, int shipmentId, Integer actorId,
                                  String status, String notes, String location) throws Exception {
        String sql = "INSERT INTO shipment_audit_logs (shipment_id, actor_user_id, status, notes, location) VALUES (?, ?, ?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, shipmentId);
            if (actorId != null) ps.setInt(2, actorId); else ps.setNull(2, Types.INTEGER);
            ps.setString(3, status);
            ps.setString(4, notes);
            ps.setString(5, location);
            ps.executeUpdate();
        }
    }

    private static List<Map<String, Object>> fetchTimeline(Connection conn, int shipmentId) throws Exception {
        String sql = "SELECT status, notes, location, created_at AS timestamp, actor_user_id " +
                     "FROM shipment_audit_logs WHERE shipment_id = ? ORDER BY created_at DESC";
        List<Map<String, Object>> events = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, shipmentId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) events.add(rowToMap(rs));
        }
        return events;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> parseBody(Context ctx) {
        try { return ctx.bodyAsClass(Map.class); }
        catch (Exception e) { ResponseHelper.badRequest(ctx, "Invalid JSON body"); return null; }
    }

    private static String getString(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v instanceof String s ? s.trim() : null;
    }

    private static Double getDouble(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v == null) return null;
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return null; }
    }

    private static Integer getInt(Map<String, Object> map, String key) {
        Object v = map.get(key);
        if (v == null) return null;
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return null; }
    }

    private static int parseIntParam(String s, int def) {
        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
    }

    private static Map<String, Object> rowToMap(ResultSet rs) throws Exception {
        ResultSetMetaData meta = rs.getMetaData();
        Map<String, Object> row = new LinkedHashMap<>();
        for (int i = 1; i <= meta.getColumnCount(); i++) {
            row.put(meta.getColumnLabel(i), rs.getObject(i));
        }
        return row;
    }
}
