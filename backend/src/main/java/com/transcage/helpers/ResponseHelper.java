package com.transcage.helpers;

import io.javalin.http.Context;

import java.util.LinkedHashMap;
import java.util.Map;

public class ResponseHelper {

    public static void ok(Context ctx, String message, Object data) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("message", message);
        body.put("data", data);
        ctx.status(200).json(body);
    }

    public static void ok(Context ctx, String message) {
        ok(ctx, message, null);
    }

    public static void created(Context ctx, String message, Object data) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("message", message);
        body.put("data", data);
        ctx.status(201).json(body);
    }

    public static void error(Context ctx, int statusCode, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", message);
        body.put("data", null);
        ctx.status(statusCode).json(body);
    }

    public static void badRequest(Context ctx, String message) {
        error(ctx, 400, message);
    }

    public static void unauthorized(Context ctx, String message) {
        error(ctx, 401, message);
    }

    public static void forbidden(Context ctx, String message) {
        error(ctx, 403, message);
    }

    public static void notFound(Context ctx, String message) {
        error(ctx, 404, message);
    }

    public static void serverError(Context ctx, String message) {
        error(ctx, 500, message);
    }
}
