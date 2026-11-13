package com.calculator.model;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PercentageRequest(
        @NotNull(message = "Field 'percent' is required.")
        BigDecimal percent,

        BigDecimal of
) {
}
