package com.calculator.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.calculator.exception.InvalidCalculationException;
import com.calculator.model.CalculationResponse;
import com.calculator.model.OperationType;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class CalculatorServiceTest {

    private CalculatorService calculatorService;

    @BeforeEach
    void setUp() {
        calculatorService = new CalculatorService();
    }

    @Nested
    @DisplayName("Basic arithmetic operations")
    class BasicOperations {

        @Test
        void addsTwoNumbersWithExactDecimalPrecision() {
            CalculationResponse response = calculatorService.add(new BigDecimal("0.1"), new BigDecimal("0.2"));

            assertThat(response.operation()).isEqualTo(OperationType.ADDITION);
            assertThat(response.result()).isEqualByComparingTo("0.3");
            assertThat(response.expression()).isEqualTo("0.1 + 0.2");
            assertThat(response.inputs()).containsEntry("a", new BigDecimal("0.1"))
                    .containsEntry("b", new BigDecimal("0.2"));
        }

        @Test
        void subtractsNegativeAndPositiveNumbers() {
            CalculationResponse response = calculatorService.subtract(new BigDecimal("10.5"), new BigDecimal("-4.5"));

            assertThat(response.operation()).isEqualTo(OperationType.SUBTRACTION);
            assertThat(response.result()).isEqualByComparingTo("15");
            assertThat(response.expression()).isEqualTo("10.5 - -4.5");
        }

        @Test
        void multipliesAndNormalizesZeroResult() {
            CalculationResponse response = calculatorService.multiply(new BigDecimal("123.45"), BigDecimal.ZERO);

            assertThat(response.operation()).isEqualTo(OperationType.MULTIPLICATION);
            assertThat(response.result()).isEqualByComparingTo("0");
            assertThat(response.result().toPlainString()).isEqualTo("0");
        }

        @Test
        void dividesWithHighPrecisionForNonTerminatingDecimals() {
            CalculationResponse response = calculatorService.divide(new BigDecimal("1"), new BigDecimal("3"));

            assertThat(response.operation()).isEqualTo(OperationType.DIVISION);
            assertThat(response.result()).isEqualByComparingTo("0.3333333333333333");
        }

        @Test
        void throwsWhenDividingByZero() {
            assertThatThrownBy(() -> calculatorService.divide(new BigDecimal("10"), new BigDecimal("0.00")))
                    .isInstanceOf(InvalidCalculationException.class)
                    .hasMessage("Division by zero is not allowed.");
        }

        @Test
        void throwsWhenBinaryOperandIsNull() {
            assertThatThrownBy(() -> calculatorService.add(null, BigDecimal.ONE))
                    .isInstanceOf(InvalidCalculationException.class)
                    .hasMessage("Both operands 'a' and 'b' are required.");
        }

        @Test
        void rejectsExtremeScaleAndMagnitudeOperands() {
            assertThatThrownBy(() -> calculatorService.add(new BigDecimal("1e10000000"), BigDecimal.ONE))
                    .isInstanceOf(InvalidCalculationException.class)
                    .hasMessage("Operand magnitude or precision exceeds the supported limit.");

            assertThatThrownBy(() -> calculatorService.subtract(new BigDecimal("1e-10000000"), BigDecimal.ONE))
                    .isInstanceOf(InvalidCalculationException.class)
                    .hasMessage("Operand magnitude or precision exceeds the supported limit.");
        }
    }

    @Nested
    @DisplayName("Advanced arithmetic operations")
    class AdvancedOperations {

        @Test
        void computesPositiveAndNegativeIntegerExponentiation() {
            CalculationResponse positive = calculatorService.power(new BigDecimal("2"), new BigDecimal("8"));
            CalculationResponse negativeExp = calculatorService.power(new BigDecimal("2"), new BigDecimal("-2"));
            CalculationResponse negativeBaseOdd = calculatorService.power(new BigDecimal("-2"), new BigDecimal("3"));
            CalculationResponse zeroPowerZero = calculatorService.power(BigDecimal.ZERO, BigDecimal.ZERO);
            CalculationResponse zeroPowerFraction = calculatorService.power(BigDecimal.ZERO, new BigDecimal("0.5"));

            assertThat(positive.operation()).isEqualTo(OperationType.EXPONENTIATION);
            assertThat(positive.result()).isEqualByComparingTo("256");
            assertThat(negativeExp.result()).isEqualByComparingTo("0.25");
            assertThat(negativeBaseOdd.result()).isEqualByComparingTo("-8");
            assertThat(zeroPowerZero.result()).isEqualByComparingTo("1");
            assertThat(zeroPowerFraction.result()).isEqualByComparingTo("0");
        }

        @Test
        void computesFractionalExponentiationForPositiveBase() {
            CalculationResponse response = calculatorService.power(new BigDecimal("9"), new BigDecimal("0.5"));

            assertThat(response.result()).isEqualByComparingTo("3");
            assertThat(response.expression()).isEqualTo("9 ^ 0.5");
        }

        @Test
        void throwsWhenZeroRaisedToNegativeExponent() {
            assertThatThrownBy(() -> calculatorService.power(BigDecimal.ZERO, new BigDecimal("-1")))
                    .isInstanceOf(InvalidCalculationException.class)
                    .hasMessage("Zero cannot be raised to a negative exponent.");
        }

        @Test
        void throwsWhenNegativeBaseRaisedToFractionalExponent() {
            assertThatThrownBy(() -> calculatorService.power(new BigDecimal("-4"), new BigDecimal("0.5")))
                    .isInstanceOf(InvalidCalculationException.class)
                    .hasMessage("Cannot raise a negative base to a fractional exponent in real arithmetic.");
        }

        @Test
        void throwsWhenExponentExceedsAllowedRange() {
            assertThatThrownBy(() -> calculatorService.power(new BigDecimal("2"), new BigDecimal("10001")))
                    .isInstanceOf(InvalidCalculationException.class)
                    .hasMessage("Exponent must be between -10000 and 10000.");
        }

        @Test
        void throwsWhenFractionalPowerOverflows() {
            assertThatThrownBy(() -> calculatorService.power(new BigDecimal("1e200"), new BigDecimal("2.5")))
                    .isInstanceOf(InvalidCalculationException.class)
                    .hasMessage("Exponentiation result is outside the supported numeric range.");
        }

        @Test
        void throwsWhenPowerSqrtOrPercentageReceiveNullInputs() {
            assertThatThrownBy(() -> calculatorService.power(null, BigDecimal.ONE))
                    .isInstanceOf(InvalidCalculationException.class)
                    .hasMessage("Both 'base' and 'exponent' are required.");

            assertThatThrownBy(() -> calculatorService.sqrt(null))
                    .isInstanceOf(InvalidCalculationException.class)
                    .hasMessage("Field 'value' is required.");

            assertThatThrownBy(() -> calculatorService.percentage(null, BigDecimal.TEN))
                    .isInstanceOf(InvalidCalculationException.class)
                    .hasMessage("Field 'percent' is required.");
        }

        @Test
        void computesSquareRootForZeroAndPositiveValues() {
            CalculationResponse zeroSqrt = calculatorService.sqrt(BigDecimal.ZERO);
            CalculationResponse perfectSqrt = calculatorService.sqrt(new BigDecimal("144"));

            assertThat(zeroSqrt.result()).isEqualByComparingTo("0");
            assertThat(perfectSqrt.operation()).isEqualTo(OperationType.SQUARE_ROOT);
            assertThat(perfectSqrt.result()).isEqualByComparingTo("12");
            assertThat(perfectSqrt.expression()).isEqualTo("sqrt(144)");
        }

        @Test
        void throwsWhenSquareRootValueIsNegative() {
            assertThatThrownBy(() -> calculatorService.sqrt(new BigDecimal("-9")))
                    .isInstanceOf(InvalidCalculationException.class)
                    .hasMessage("Square root of a negative number is not allowed.");
        }

        @Test
        void computesStandalonePercentageAndPercentageOfBase() {
            CalculationResponse standalone = calculatorService.percentage(new BigDecimal("25"), null);
            CalculationResponse ofBase = calculatorService.percentage(new BigDecimal("15"), new BigDecimal("200"));

            assertThat(standalone.operation()).isEqualTo(OperationType.PERCENTAGE);
            assertThat(standalone.result()).isEqualByComparingTo("0.25");
            assertThat(standalone.expression()).isEqualTo("25%");

            assertThat(ofBase.result()).isEqualByComparingTo("30");
            assertThat(ofBase.expression()).isEqualTo("15% of 200");
            assertThat(ofBase.inputs()).containsEntry("percent", new BigDecimal("15"))
                    .containsEntry("of", new BigDecimal("200"));
        }
    }
}
