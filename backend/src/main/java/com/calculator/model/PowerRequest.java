package com.calculator.model;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PowerRequest(
        @NotNull(message = "Field 'base' is required.")
        BigDecimal base,

        @NotNull(message = "Field 'exponent' is required.")
        BigDecimal exponent
) {
}
