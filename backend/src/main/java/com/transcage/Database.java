package com.transcage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Database {

    private static final Logger log = LoggerFactory.getLogger(Database.class);

    public static Connection getConnection() throws SQLException {
        try {
            return DriverManager.getConnection(AppConfig.DB_JDBC_URL, AppConfig.DB_USER, AppConfig.DB_PASS);
        } catch (SQLException e) {
            log.error("[Transcage][Database] Failed to obtain DB connection: {}", e.getMessage());
            throw e;
        }
    }

    public static boolean testConnection() {
        try (Connection c = getConnection()) {
            return c.isValid(2);
        } catch (SQLException e) {
            log.error("[Transcage][Database] DB connection test failed: {}", e.getMessage());
            return false;
        }
    }
}
