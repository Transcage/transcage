package com.transcage.routes;

import com.transcage.Database;
import com.transcage.helpers.ResponseHelper;
import io.javalin.Javalin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.*;

public class TrackRoutes {

    private static final Logger log = LoggerFactory.getLogger(TrackRoutes.class);

    public static void register(Javalin app) {

        // ── GET /api/v1/track/{tracking_number} — public, no auth ───────────────
        app.get("/api/v1/track/{tracking_number}", ctx -> {
            String trackingNumber = ctx.pathParam("tracking_number")
                    .toUpperCase().replaceAll("[^A-Z0-9]", "");

            if (trackingNumber.isEmpty()) {
                ResponseHelper.badRequest(ctx, "Invalid tracking number");
                return;
            }

            try (Connection conn = Database.getConnection()) {

                // Fetch shipment core info
                String shipmentSql = """
                    SELECT s.id, s.tracking_number, s.delivery_model, s.status,
                           s.recipient_name, s.parcel_description, s.parcel_category,
                           s.parcel_weight_kg,
                           s.origin_city, s.destination_city,
                           os.name AS origin_station_name, os.city AS origin_station_city,
                           ds.name AS dest_station_name, ds.city AS dest_station_city,
                           s.payment_status, s.created_at, s.delivered_at, s.completed_at
                    FROM shipments s
                    LEFT JOIN stations os ON s.origin_station_id = os.id
                    LEFT JOIN stations ds ON s.destination_station_id = ds.id
                    WHERE s.tracking_number = ?
                    LIMIT 1
                """;

                Map<String, Object> shipmentData = new LinkedHashMap<>();
                int shipmentId;
                try (PreparedStatement ps = conn.prepareStatement(shipmentSql)) {
                    ps.setString(1, trackingNumber);
                    ResultSet rs = ps.executeQuery();
                    if (!rs.next()) {
                        ResponseHelper.notFound(ctx, "Tracking number not found");
                        return;
                    }
                    shipmentId = rs.getInt("id");
                    shipmentData.put("tracking_number", rs.getString("tracking_number"));
                    shipmentData.put("delivery_model", rs.getString("delivery_model"));
                    shipmentData.put("status", rs.getString("status"));
                    shipmentData.put("recipient_name", rs.getString("recipient_name"));
                    shipmentData.put("description", rs.getString("parcel_description"));
                    shipmentData.put("category", rs.getString("parcel_category"));
                    shipmentData.put("weight_kg", rs.getObject("parcel_weight_kg"));
                    shipmentData.put("payment_status", rs.getString("payment_status"));
                    shipmentData.put("created_at", rs.getString("created_at"));
                    shipmentData.put("delivered_at", rs.getString("delivered_at"));
                    shipmentData.put("completed_at", rs.getString("completed_at"));

                    // Origin / destination
                    String originStation = rs.getString("origin_station_name");
                    String destStation   = rs.getString("dest_station_name");
                    shipmentData.put("origin", originStation != null
                            ? originStation + (rs.getString("origin_station_city") != null ? ", " + rs.getString("origin_station_city") : "")
                            : rs.getString("origin_city"));
                    shipmentData.put("destination", destStation != null
                            ? destStation + (rs.getString("dest_station_city") != null ? ", " + rs.getString("dest_station_city") : "")
                            : rs.getString("destination_city"));
                }

                // Fetch timeline (customer-visible events)
                List<Map<String, Object>> timeline = new ArrayList<>();
                String timelineSql = """
                    SELECT new_status, notes, location_label, created_at
                    FROM shipment_status_logs
                    WHERE shipment_id = ? AND is_customer_visible = 1
                    ORDER BY created_at ASC
                """;
                try (PreparedStatement ps = conn.prepareStatement(timelineSql)) {
                    ps.setInt(1, shipmentId);
                    ResultSet rs = ps.executeQuery();
                    while (rs.next()) {
                        Map<String, Object> event = new LinkedHashMap<>();
                        event.put("status", rs.getString("new_status"));
                        event.put("label", formatStatusLabel(rs.getString("new_status")));
                        event.put("location", rs.getString("location_label"));
                        event.put("notes", rs.getString("notes"));
                        event.put("timestamp", rs.getString("created_at"));
                        timeline.add(event);
                    }
                }
                shipmentData.put("timeline", timeline);

                ResponseHelper.ok(ctx, "Shipment found", shipmentData);

            } catch (SQLException e) {
                log.error("[Transcage][Track] Error tracking {}: {}", trackingNumber, e.getMessage());
                ResponseHelper.serverError(ctx, "Tracking lookup failed");
            }
        });
    }

    private static String formatStatusLabel(String status) {
        if (status == null) return "Unknown";
        return switch (status) {
            case "REQUEST_CREATED"           -> "Shipment Requested";
            case "AWAITING_STATION_INTAKE"   -> "Awaiting Station Drop-off";
            case "AT_ORIGIN_STATION"         -> "Received at Origin Station";
            case "DRIVER_ASSIGNED"           -> "Driver Assigned";
            case "PICKED_UP_BY_DRIVER"       -> "Picked Up by Driver";
            case "IN_TRANSIT"                -> "In Transit";
            case "AT_DESTINATION_STATION"    -> "Arrived at Destination Station";
            case "OUT_FOR_DELIVERY"          -> "Out for Delivery";
            case "DELIVERED"                 -> "Delivered";
            case "COMPLETED"                 -> "Completed";
            case "DISPUTED"                  -> "Under Dispute";
            case "CANCELLED"                 -> "Cancelled";
            default -> status.replace("_", " ");
        };
    }
}
