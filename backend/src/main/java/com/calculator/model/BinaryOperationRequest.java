package com.calculator.model;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record BinaryOperationRequest(
        @NotNull(message = "Operand 'a' is required.")
        BigDecimal a,

        @NotNull(message = "Operand 'b' is required.")
        BigDecimal b
) {
}
