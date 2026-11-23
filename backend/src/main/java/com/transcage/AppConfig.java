package com.transcage;

import io.github.cdimascio.dotenv.Dotenv;

public class AppConfig {

    private static final Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

    public static final String DB_HOST   = get("DB_HOST", "localhost");
    public static final String DB_PORT   = get("DB_PORT", "3306");
    public static final String DB_NAME   = get("DB_NAME", "transcagesysdb");
    public static final String DB_USER   = get("DB_USER", "root");
    public static final String DB_PASS   = get("DB_PASS", "");
    public static final int    APP_PORT  = Integer.parseInt(get("APP_PORT", "7070"));
    public static final String APP_ENV   = get("APP_ENV", "development");
    public static final String JWT_SECRET = get("JWT_SECRET", "CHANGE_ME");
    public static final String FRONTEND_URL = get("FRONTEND_URL", "http://localhost:5173");

    public static final String DB_JDBC_URL = "jdbc:mysql://" + DB_HOST + ":" + DB_PORT + "/" + DB_NAME
            + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&useUnicode=true&characterEncoding=UTF-8";

    public static boolean isDev() {
        return "development".equalsIgnoreCase(APP_ENV);
    }

    private static String get(String key, String fallback) {
        String val = dotenv.get(key, null);
        if (val == null || val.isBlank()) {
            val = System.getenv(key);
        }
        return (val != null && !val.isBlank()) ? val : fallback;
    }
}
