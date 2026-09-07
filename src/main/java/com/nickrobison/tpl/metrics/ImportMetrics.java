package com.nickrobison.tpl.metrics;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@ApplicationScoped
public class ImportMetrics {
    private final AtomicLong accepted = new AtomicLong();
    private final AtomicLong completed = new AtomicLong();
    private final AtomicLong failed = new AtomicLong();
    private final AtomicLong validationNanos = new AtomicLong();
    private final AtomicLong validationCount = new AtomicLong();
    private final AtomicLong storageNanos = new AtomicLong();
    private final AtomicLong storageCount = new AtomicLong();

    public void accepted() {
        accepted.incrementAndGet();
    }

    public void completed() {
        completed.incrementAndGet();
    }

    public void failed() {
        failed.incrementAndGet();
    }

    public long startValidation() {
        return System.nanoTime();
    }

    public void stopValidation(long start) {
        validationNanos.addAndGet(System.nanoTime() - start);
        validationCount.incrementAndGet();
    }

    public long startStorage() {
        return System.nanoTime();
    }

    public void stopStorage(long start) {
        storageNanos.addAndGet(System.nanoTime() - start);
        storageCount.incrementAndGet();
    }

    public Map<String, Object> snapshot() {
        Map<String, Object> snap = new HashMap<>();
        snap.put("accepted", accepted.get());
        snap.put("completed", completed.get());
        snap.put("failed", failed.get());
        snap.put("validationAvgMs", avgMs(validationNanos.get(), validationCount.get()));
        snap.put("storageAvgMs", avgMs(storageNanos.get(), storageCount.get()));
        return snap;
    }

    private static double avgMs(long nanos, long count) {
        return count == 0 ? 0.0 : (nanos / 1_000_000.0) / count;
    }
}
