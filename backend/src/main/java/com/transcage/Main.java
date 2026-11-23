package com.transcage;

import com.transcage.helpers.ResponseHelper;
import com.transcage.routes.AuthRoutes;
import com.transcage.routes.ClerkRoutes;
import com.transcage.routes.CustomerRoutes;
import com.transcage.routes.TrackRoutes;
import io.javalin.Javalin;
import io.javalin.json.JavalinJackson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Main {

    private static final Logger log = LoggerFactory.getLogger(Main.class);

    public static void main(String[] args) {

        // Verify DB connection on startup
        if (!Database.testConnection()) {
            log.error("[Transcage] Cannot connect to '{}'. Check .env / MySQL.", AppConfig.DB_NAME);
            System.exit(1);
        }
        log.info("[Transcage] DB connection OK — {}", AppConfig.DB_NAME);

        Javalin app = Javalin.create(config -> {
            config.jsonMapper(new JavalinJackson());

            // CORS — allow frontend
            config.bundledPlugins.enableCors(cors -> {
                cors.addRule(rule -> {
                    rule.allowHost(AppConfig.FRONTEND_URL);
                    rule.allowHost("http://localhost:5173");
                    rule.allowHost("http://127.0.0.1:5173");
                    rule.allowCredentials = true;
                });
            });

            if (AppConfig.isDev()) {
                config.bundledPlugins.enableDevLogging();
            }
        });

        // ── Ping ────────────────────────────────────────────────────────────────
        app.get("/api/ping", ctx -> ResponseHelper.ok(ctx, "pong"));

        // ── Feature Routes ───────────────────────────────────────────────────────
        AuthRoutes.register(app);
        TrackRoutes.register(app);
        CustomerRoutes.register(app);
        ClerkRoutes.register(app);

        // ── 404 fallback ─────────────────────────────────────────────────────────
        app.error(404, ctx -> ResponseHelper.notFound(ctx, "Resource not found"));
        app.error(500, ctx -> ResponseHelper.serverError(ctx, "Internal server error"));

        app.start(AppConfig.APP_PORT);
        log.info("[Transcage] Server running on port {}", AppConfig.APP_PORT);
    }
}
