package com.transcage.middleware;

import com.transcage.helpers.JwtHelper;
import com.transcage.helpers.ResponseHelper;
import io.javalin.http.Context;
import io.javalin.http.Handler;
import org.bitbucket.b_c.jose4j.jwt.JwtClaims;

public class AuthMiddleware {

    public static void requireAuth(Context ctx) {
        String authHeader = ctx.header("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            ResponseHelper.unauthorized(ctx, "Authentication required");
            ctx.skipRemainingHandlers();
            return;
        }
        String token = authHeader.substring(7);
        JwtClaims claims = JwtHelper.verify(token);
        if (claims == null) {
            ResponseHelper.unauthorized(ctx, "Invalid or expired token");
            ctx.skipRemainingHandlers();
            return;
        }
        // Inject user context for route handlers
        try {
            ctx.attribute("userId", Integer.parseInt(claims.getSubject()));
            ctx.attribute("userRole", claims.getStringClaimValue("role"));
            String companyId = claims.getStringClaimValue("company_id");
            if (companyId != null) ctx.attribute("companyId", Integer.parseInt(companyId));
        } catch (Exception e) {
            ResponseHelper.unauthorized(ctx, "Malformed token claims");
            ctx.skipRemainingHandlers();
        }
    }

    public static void requireRole(Context ctx, String... allowedRoles) {
        requireAuth(ctx);
        if (ctx.status().getCode() == 401) return;

        String role = ctx.attribute("userRole");
        for (String allowed : allowedRoles) {
            if (allowed.equalsIgnoreCase(role)) return;
        }
        ResponseHelper.forbidden(ctx, "Insufficient permissions");
        ctx.skipRemainingHandlers();
    }
}
