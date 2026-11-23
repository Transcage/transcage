package com.transcage.routes;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.transcage.Database;
import com.transcage.helpers.JwtHelper;
import com.transcage.helpers.ResponseHelper;
import io.javalin.Javalin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.*;
import java.util.*;

public class AuthRoutes {

    private static final Logger log = LoggerFactory.getLogger(AuthRoutes.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    public static void register(Javalin app) {

        // ── POST /api/v1/auth/register ──────────────────────────────────────────
        app.post("/api/v1/auth/register", ctx -> {
            Map<String, Object> body;
            try {
                body = mapper.readValue(ctx.body(), Map.class);
            } catch (Exception e) {
                ResponseHelper.badRequest(ctx, "Invalid JSON body");
                return;
            }

            String fullName = trim(body, "full_name");
            String phone    = trim(body, "phone");
            String email    = trim(body, "email");
            String password = trim(body, "password");
            String role     = trim(body, "role");

            // Validation
            if (fullName == null || fullName.isEmpty()) { ResponseHelper.badRequest(ctx, "Full name is required"); return; }
            if (phone == null || phone.isEmpty())        { ResponseHelper.badRequest(ctx, "Phone number is required"); return; }
            if (password == null || password.length() < 6) { ResponseHelper.badRequest(ctx, "Password must be at least 6 characters"); return; }

            // Normalize role — only CUSTOMER and DRIVER allowed on self-registration
            if (role == null || (!role.equals("CUSTOMER") && !role.equals("DRIVER"))) {
                role = "CUSTOMER";
            }

            String uuid = UUID.randomUUID().toString();
            String passwordHash = BCrypt.withDefaults().hashToString(12, password.toCharArray());

            try (Connection conn = Database.getConnection()) {
                // Check phone uniqueness
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT id FROM users WHERE phone = ?")) {
                    ps.setString(1, phone);
                    ResultSet rs = ps.executeQuery();
                    if (rs.next()) { ResponseHelper.badRequest(ctx, "Phone number is already registered"); return; }
                }

                // Check email uniqueness (if provided)
                if (email != null && !email.isEmpty()) {
                    try (PreparedStatement ps = conn.prepareStatement(
                            "SELECT id FROM users WHERE email = ?")) {
                        ps.setString(1, email);
                        ResultSet rs = ps.executeQuery();
                        if (rs.next()) { ResponseHelper.badRequest(ctx, "Email is already registered"); return; }
                    }
                }

                // Insert user
                String insertUser = "INSERT INTO users (uuid, full_name, phone, email, status) VALUES (?,?,?,?,'active')";
                int userId;
                try (PreparedStatement ps = conn.prepareStatement(insertUser, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setString(1, uuid);
                    ps.setString(2, fullName);
                    ps.setString(3, phone);
                    ps.setString(4, email != null && !email.isEmpty() ? email : null);
                    ps.executeUpdate();
                    ResultSet rs = ps.getGeneratedKeys();
                    rs.next();
                    userId = rs.getInt(1);
                }

                // Store password in user_secrets (plain Java BCrypt — not DB encrypted)
                String insertSecret = "INSERT INTO user_secrets (user_id, secret_type, encrypted_secret, iv) VALUES (?,?,?,?)";
                try (PreparedStatement ps = conn.prepareStatement(insertSecret)) {
                    ps.setInt(1, userId);
                    ps.setString(2, "password");
                    ps.setString(3, passwordHash);
                    ps.setString(4, "bcrypt"); // marker: bcrypt, no IV needed
                    ps.executeUpdate();
                }

                // Insert primary role
                String insertRole = "INSERT INTO user_roles (user_id, role) VALUES (?,?)";
                try (PreparedStatement ps = conn.prepareStatement(insertRole)) {
                    ps.setInt(1, userId);
                    ps.setString(2, role);
                    ps.executeUpdate();
                }

                // If DRIVER: create draft driver_profile
                if ("DRIVER".equals(role)) {
                    try (PreparedStatement ps = conn.prepareStatement(
                            "INSERT INTO driver_profiles (user_id, application_status) VALUES (?, 'draft')")) {
                        ps.setInt(1, userId);
                        ps.executeUpdate();
                    }
                }

                String token = JwtHelper.generate(userId, role, null);
                Map<String, Object> data = new LinkedHashMap<>();
                data.put("token", token);
                data.put("user_id", userId);
                data.put("full_name", fullName);
                data.put("phone", phone);
                data.put("role", role);

                ResponseHelper.created(ctx, "Account created successfully", data);

            } catch (SQLException e) {
                log.error("[Transcage][Auth] Register error: {}", e.getMessage());
                ResponseHelper.serverError(ctx, "Registration failed. Please try again.");
            }
        });

        // ── POST /api/v1/auth/login ─────────────────────────────────────────────
        app.post("/api/v1/auth/login", ctx -> {
            Map<String, Object> body;
            try {
                body = mapper.readValue(ctx.body(), Map.class);
            } catch (Exception e) {
                ResponseHelper.badRequest(ctx, "Invalid JSON body");
                return;
            }

            String identifier = trim(body, "identifier"); // phone or email
            String password   = trim(body, "password");

            if (identifier == null || identifier.isEmpty()) { ResponseHelper.badRequest(ctx, "Phone or email is required"); return; }
            if (password == null || password.isEmpty())      { ResponseHelper.badRequest(ctx, "Password is required"); return; }

            try (Connection conn = Database.getConnection()) {

                // Fetch user by phone or email
                String sql = "SELECT id, full_name, phone, email, status FROM users WHERE phone = ? OR email = ? LIMIT 1";
                int userId;
                String fullName, userStatus;
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, identifier);
                    ps.setString(2, identifier);
                    ResultSet rs = ps.executeQuery();
                    if (!rs.next()) { ResponseHelper.unauthorized(ctx, "Invalid phone/email or password"); return; }
                    userId     = rs.getInt("id");
                    fullName   = rs.getString("full_name");
                    userStatus = rs.getString("status");
                }

                if ("suspended".equals(userStatus)) { ResponseHelper.unauthorized(ctx, "Account has been suspended"); return; }

                // Fetch password hash
                String hashSql = "SELECT encrypted_secret FROM user_secrets WHERE user_id = ? AND secret_type = 'password' AND is_active = 1 LIMIT 1";
                String storedHash;
                try (PreparedStatement ps = conn.prepareStatement(hashSql)) {
                    ps.setInt(1, userId);
                    ResultSet rs = ps.executeQuery();
                    if (!rs.next()) { ResponseHelper.unauthorized(ctx, "Invalid phone/email or password"); return; }
                    storedHash = rs.getString("encrypted_secret");
                }

                BCrypt.Result result = BCrypt.verifyer().verify(password.toCharArray(), storedHash);
                if (!result.verified) { ResponseHelper.unauthorized(ctx, "Invalid phone/email or password"); return; }

                // Fetch roles — primary role first
                List<String> roles = new ArrayList<>();
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT role FROM user_roles WHERE user_id = ? AND is_active = 1 ORDER BY created_at ASC")) {
                    ps.setInt(1, userId);
                    ResultSet rs = ps.executeQuery();
                    while (rs.next()) roles.add(rs.getString("role"));
                }
                String primaryRole = roles.isEmpty() ? "CUSTOMER" : roles.get(0);

                // Update last_login_at
                try (PreparedStatement ps = conn.prepareStatement(
                        "UPDATE users SET last_login_at = NOW() WHERE id = ?")) {
                    ps.setInt(1, userId);
                    ps.executeUpdate();
                }

                String token = JwtHelper.generate(userId, primaryRole, null);
                Map<String, Object> data = new LinkedHashMap<>();
                data.put("token", token);
                data.put("user_id", userId);
                data.put("full_name", fullName);
                data.put("roles", roles);
                data.put("active_role", primaryRole);

                ResponseHelper.ok(ctx, "Login successful", data);

            } catch (SQLException e) {
                log.error("[Transcage][Auth] Login error: {}", e.getMessage());
                ResponseHelper.serverError(ctx, "Login failed. Please try again.");
            }
        });

        // ── GET /api/v1/auth/me ─────────────────────────────────────────────────
        app.get("/api/v1/auth/me", ctx -> {
            String authHeader = ctx.header("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                ResponseHelper.unauthorized(ctx, "Authentication required");
                return;
            }
            var claims = JwtHelper.verify(authHeader.substring(7));
            if (claims == null) { ResponseHelper.unauthorized(ctx, "Invalid or expired token"); return; }

            int userId;
            try { userId = Integer.parseInt(claims.getSubject()); }
            catch (Exception e) { ResponseHelper.unauthorized(ctx, "Malformed token"); return; }

            try (Connection conn = Database.getConnection()) {
                try (PreparedStatement ps = conn.prepareStatement(
                        "SELECT id, uuid, full_name, phone, email, photo, status FROM users WHERE id = ? LIMIT 1")) {
                    ps.setInt(1, userId);
                    ResultSet rs = ps.executeQuery();
                    if (!rs.next()) { ResponseHelper.notFound(ctx, "User not found"); return; }

                    Map<String, Object> data = new LinkedHashMap<>();
                    data.put("id", rs.getInt("id"));
                    data.put("uuid", rs.getString("uuid"));
                    data.put("full_name", rs.getString("full_name"));
                    data.put("phone", rs.getString("phone"));
                    data.put("email", rs.getString("email"));
                    data.put("photo", rs.getString("photo"));
                    data.put("status", rs.getString("status"));
                    data.put("active_role", claims.getStringClaimValue("role"));

                    ResponseHelper.ok(ctx, "User profile", data);
                }
            } catch (Exception e) {
                log.error("[Transcage][Auth] /me error: {}", e.getMessage());
                ResponseHelper.serverError(ctx, "Could not fetch profile");
            }
        });
    }

    private static String trim(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v != null ? v.toString().trim() : null;
    }
}
