package com.calculator.service;

import com.calculator.exception.InvalidCalculationException;
import com.calculator.model.CalculationResponse;
import com.calculator.model.OperationType;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CalculatorService {

    private static final MathContext MATH_CONTEXT = new MathContext(16, RoundingMode.HALF_UP);
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal MAX_ABS_EXPONENT = BigDecimal.valueOf(10_000);
    private static final int MAX_SCALE_OR_MAGNITUDE = 1_000;

    public CalculationResponse add(BigDecimal a, BigDecimal b) {
        requireOperands(a, b);
        BigDecimal result = normalize(a.add(b, MATH_CONTEXT));
        return buildBinaryResponse(OperationType.ADDITION, a, b, result, "+");
    }

    public CalculationResponse subtract(BigDecimal a, BigDecimal b) {
        requireOperands(a, b);
        BigDecimal result = normalize(a.subtract(b, MATH_CONTEXT));
        return buildBinaryResponse(OperationType.SUBTRACTION, a, b, result, "-");
    }

    public CalculationResponse multiply(BigDecimal a, BigDecimal b) {
        requireOperands(a, b);
        BigDecimal result = normalize(a.multiply(b, MATH_CONTEXT));
        return buildBinaryResponse(OperationType.MULTIPLICATION, a, b, result, "*");
    }

    public CalculationResponse divide(BigDecimal a, BigDecimal b) {
        requireOperands(a, b);
        if (b.compareTo(BigDecimal.ZERO) == 0) {
            throw new InvalidCalculationException("DIVISION_BY_ZERO", "Division by zero is not allowed.");
        }
        BigDecimal result = normalize(a.divide(b, MATH_CONTEXT));
        return buildBinaryResponse(OperationType.DIVISION, a, b, result, "/");
    }

    public CalculationResponse power(BigDecimal base, BigDecimal exponent) {
        if (base == null || exponent == null) {
            throw new InvalidCalculationException("MISSING_OPERAND", "Both 'base' and 'exponent' are required.");
        }
        validateOperand(base);
        validateOperand(exponent);
        if (exponent.abs().compareTo(MAX_ABS_EXPONENT) > 0) {
            throw new InvalidCalculationException(
                    "EXPONENT_OUT_OF_RANGE",
                    "Exponent must be between -10000 and 10000."
            );
        }
        if (base.compareTo(BigDecimal.ZERO) == 0 && exponent.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidCalculationException(
                    "ZERO_NEGATIVE_EXPONENT",
                    "Zero cannot be raised to a negative exponent."
            );
        }

        BigDecimal computed;
        if (isIntegral(exponent)) {
            try {
                computed = base.pow(exponent.intValueExact(), MATH_CONTEXT);
            } catch (ArithmeticException ex) {
                throw new InvalidCalculationException(
                        "NUMERIC_OVERFLOW",
                        "Exponentiation result is outside the supported numeric range."
                );
            }
        } else {
            if (base.compareTo(BigDecimal.ZERO) < 0) {
                throw new InvalidCalculationException(
                        "NEGATIVE_BASE_FRACTIONAL_EXPONENT",
                        "Cannot raise a negative base to a fractional exponent in real arithmetic."
                );
            }
            double doubleResult = Math.pow(base.doubleValue(), exponent.doubleValue());
            if (!Double.isFinite(doubleResult)) {
                throw new InvalidCalculationException(
                        "NUMERIC_OVERFLOW",
                        "Exponentiation result is outside the supported numeric range."
                );
            }
            computed = BigDecimal.valueOf(doubleResult).round(MATH_CONTEXT);
        }

        BigDecimal normalizedBase = normalize(base);
        BigDecimal normalizedExponent = normalize(exponent);
        Map<String, BigDecimal> inputs = new LinkedHashMap<>();
        inputs.put("base", normalizedBase);
        inputs.put("exponent", normalizedExponent);

        return new CalculationResponse(
                OperationType.EXPONENTIATION,
                inputs,
                normalize(computed),
                normalizedBase.toPlainString() + " ^ " + normalizedExponent.toPlainString(),
                Instant.now()
        );
    }

    public CalculationResponse sqrt(BigDecimal value) {
        if (value == null) {
            throw new InvalidCalculationException("MISSING_OPERAND", "Field 'value' is required.");
        }
        validateOperand(value);
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidCalculationException(
                    "NEGATIVE_SQUARE_ROOT",
                    "Square root of a negative number is not allowed."
            );
        }

        BigDecimal normalizedValue = normalize(value);
        BigDecimal result = normalize(value.sqrt(MATH_CONTEXT));
        Map<String, BigDecimal> inputs = Map.of("value", normalizedValue);

        return new CalculationResponse(
                OperationType.SQUARE_ROOT,
                inputs,
                result,
                "sqrt(" + normalizedValue.toPlainString() + ")",
                Instant.now()
        );
    }

    public CalculationResponse percentage(BigDecimal percent, BigDecimal of) {
        if (percent == null) {
            throw new InvalidCalculationException("MISSING_OPERAND", "Field 'percent' is required.");
        }
        validateOperand(percent);
        if (of != null) {
            validateOperand(of);
        }

        BigDecimal normalizedPercent = normalize(percent);
        BigDecimal ratio = percent.divide(ONE_HUNDRED, MATH_CONTEXT);
        Map<String, BigDecimal> inputs = new LinkedHashMap<>();
        inputs.put("percent", normalizedPercent);

        BigDecimal result;
        String expression;
        if (of == null) {
            result = normalize(ratio);
            expression = normalizedPercent.toPlainString() + "%";
        } else {
            BigDecimal normalizedOf = normalize(of);
            inputs.put("of", normalizedOf);
            result = normalize(ratio.multiply(of, MATH_CONTEXT));
            expression = normalizedPercent.toPlainString() + "% of " + normalizedOf.toPlainString();
        }

        return new CalculationResponse(
                OperationType.PERCENTAGE,
                inputs,
                result,
                expression,
                Instant.now()
        );
    }

    private CalculationResponse buildBinaryResponse(
            OperationType operation,
            BigDecimal a,
            BigDecimal b,
            BigDecimal result,
            String symbol
    ) {
        BigDecimal normalizedA = normalize(a);
        BigDecimal normalizedB = normalize(b);
        Map<String, BigDecimal> inputs = new LinkedHashMap<>();
        inputs.put("a", normalizedA);
        inputs.put("b", normalizedB);

        return new CalculationResponse(
                operation,
                inputs,
                result,
                normalizedA.toPlainString() + " " + symbol + " " + normalizedB.toPlainString(),
                Instant.now()
        );
    }

    private void requireOperands(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) {
            throw new InvalidCalculationException("MISSING_OPERAND", "Both operands 'a' and 'b' are required.");
        }
        validateOperand(a);
        validateOperand(b);
    }

    private void validateOperand(BigDecimal value) {
        long scale = value.scale();
        long integerDigits = (long) value.precision() - scale;
        if (Math.abs(scale) > MAX_SCALE_OR_MAGNITUDE || integerDigits > MAX_SCALE_OR_MAGNITUDE) {
            throw new InvalidCalculationException(
                    "OPERAND_OUT_OF_RANGE",
                    "Operand magnitude or precision exceeds the supported limit."
            );
        }
    }

    private boolean isIntegral(BigDecimal value) {
        return value.compareTo(BigDecimal.ZERO) == 0 || value.stripTrailingZeros().scale() <= 0;
    }

    private BigDecimal normalize(BigDecimal value) {
        if (value.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal stripped = value.stripTrailingZeros();
        return stripped.scale() < 0 ? stripped.setScale(0, RoundingMode.UNNECESSARY) : stripped;
    }
}
