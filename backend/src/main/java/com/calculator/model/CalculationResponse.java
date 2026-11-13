package com.calculator.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

public record CalculationResponse(
        OperationType operation,
        Map<String, BigDecimal> inputs,
        BigDecimal result,
        String expression,
        Instant timestamp
) {
}
