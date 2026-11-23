package com.transcage.helpers;

import com.transcage.AppConfig;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jws.JsonWebSignature;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.jwt.consumer.JwtConsumer;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.HmacKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;

public class JwtHelper {

    private static final Logger log = LoggerFactory.getLogger(JwtHelper.class);
    private static final long TTL_MINUTES = 1440;

    public static String generate(int userId, String role, String companyId) {
        try {
            JwtClaims claims = new JwtClaims();
            claims.setSubject(String.valueOf(userId));
            claims.setIssuedAtToNow();
            claims.setExpirationTimeMinutesInTheFuture(TTL_MINUTES);
            claims.setClaim("role", role);
            if (companyId != null) claims.setClaim("company_id", companyId);

            JsonWebSignature jws = new JsonWebSignature();
            jws.setPayload(claims.toJson());
            jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.HMAC_SHA256);
            jws.setKey(new HmacKey(AppConfig.JWT_SECRET.getBytes(StandardCharsets.UTF_8)));
            return jws.getCompactSerialization();
        } catch (Exception e) {
            log.error("[Transcage][JwtHelper] JWT generation failed: {}", e.getMessage());
            return null;
        }
    }

    public static JwtClaims verify(String token) {
        try {
            JwtConsumer consumer = new JwtConsumerBuilder()
                    .setRequireSubject()
                    .setVerificationKey(new HmacKey(AppConfig.JWT_SECRET.getBytes(StandardCharsets.UTF_8)))
                    .build();
            return consumer.processToClaims(token);
        } catch (InvalidJwtException e) {
            log.error("[Transcage][JwtHelper] JWT verification failed: {}", e.getMessage());
            return null;
        }
    }
}
