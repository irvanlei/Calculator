package com.calculator.model;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record SqrtRequest(
        @NotNull(message = "Field 'value' is required.")
        BigDecimal value
) {
}
