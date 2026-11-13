package com.calculator.exception;

public class InvalidCalculationException extends RuntimeException {

    private final String code;

    public InvalidCalculationException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
